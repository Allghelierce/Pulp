// Spaced-repetition scheduler for recall decks — a copy of Anki's default
// scheduler (v3, SM-2 based) with Anki's default deck options:
//   learning steps 1m 10m · graduating 1d · easy 4d · starting ease 250%
//   relearning step 10m · lapse new interval 0% (min 1d) · hard 1.2x · easy bonus 1.3
// Each notebook owns a persistent deck of cards with their own scheduling state.
import type { Card } from "@/lib/recallPrompt"

export type Grade = "again" | "hard" | "good" | "easy"
export type CardState = "new" | "learning" | "review" | "relearning"

export interface ScheduledCard {
  id: string
  q: string
  a: string
  hint?: string
  ease: number        // SM-2 ease factor, >= 1.3
  intervalDays: number // current interval in days (review cards)
  reps: number        // times graded (0 = new, never seen)
  lapses: number      // times forgotten
  state?: CardState   // Anki queue; missing on old cards -> derived from reps
  step?: number       // index into the learning/relearning steps
  due: number         // epoch ms when next due
  last?: number       // epoch ms of last review
  topic?: string      // topic display name from session-end tagging; compare via normalizeTopic
  treeId?: number     // tree planted by the session that made this card (per-session recall)
  alts?: string[]     // AI rephrasings of q ("mix up wording"); any one tests the same answer
}

export interface Deck {
  noteId: string
  cards: ScheduledCard[]
  generatedAt: number
  noteHash: string    // fingerprint of source notes, to detect drift
  covered?: string[]  // fingerprints of note lines that cards were made from (full review coverage; lib/fullReview)
}

const DAY = 86_400_000
const STORAGE_PREFIX = "pulp-recall-"
const NEW_PER_SESSION = 6
const SESSION_CAP = 25
const MIN_EASE = 1.3
const MIN = 60_000
// Anki defaults (Deck options).
const LEARN_STEPS = [1, 10]       // minutes
const RELEARN_STEPS = [10]        // minutes
const GRADUATING_IVL = 1          // days
const EASY_IVL = 4                // days
const HARD_MULT = 1.2
const EASY_BONUS = 1.3
const LAPSE_MULT = 0              // "new interval" after a lapse
const MIN_IVL = 1
const MAX_IVL = 36_500
const LEARN_AHEAD_MS = 20 * MIN   // Anki shows learning cards up to 20m early

// ── identity & drift ────────────────────────────────────────────────
// Cheap stable fingerprint of note text, used to spot major edits.
export function hashNotes(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return `${text.length}:${(h >>> 0).toString(36)}`
}

// Stable-ish id from question text so re-generated identical cards keep history.
export function cardId(q: string): string {
  let h = 5381
  for (let i = 0; i < q.length; i++) h = ((h << 5) + h + q.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

// ── deck construction ───────────────────────────────────────────────
export function freshCard(c: Card, now: number): ScheduledCard {
  return { id: cardId(c.q), q: c.q, a: c.a, hint: c.hint, ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, due: now }
}

export function buildDeck(noteId: string, cards: Card[], noteText: string, now: number): Deck {
  const seen = new Set<string>()
  const scheduled: ScheduledCard[] = []
  for (const c of cards) {
    const sc = freshCard(c, now)
    if (seen.has(sc.id)) continue
    seen.add(sc.id)
    scheduled.push(sc)
  }
  return { noteId, cards: scheduled, generatedAt: now, noteHash: hashNotes(noteText) }
}

// Merge freshly generated cards into an existing deck, preserving the
// scheduling state of cards that still exist (matched by id).
export function mergeCards(deck: Deck, cards: Card[], noteText: string, now: number): Deck {
  const byId = new Map(deck.cards.map(c => [c.id, c]))
  const merged: ScheduledCard[] = []
  const seen = new Set<string>()
  for (const c of cards) {
    const id = cardId(c.q)
    if (seen.has(id)) continue
    seen.add(id)
    const existing = byId.get(id)
    if (existing) merged.push({ ...existing, a: c.a, hint: c.hint })
    else merged.push(freshCard(c, now))
  }
  // Topic-tagged cards come from session-end tagging, not this batch — keep them.
  for (const c of deck.cards) if (c.topic && !seen.has(c.id)) merged.push(c)
  return { ...deck, cards: merged, generatedAt: now, noteHash: hashNotes(noteText) }
}

// ── Anki v3 scheduling ──────────────────────────────────────────────
export const stateOf = (c: ScheduledCard): CardState => c.state ?? (c.reps === 0 ? "new" : "review")
export const isNew = (c: ScheduledCard) => stateOf(c) === "new"
// Ready now (new cards too — session cards carry a future first-due).
export const isDue = (c: ScheduledCard, now: number) => c.due <= now
// Short-term card that should come back within this sitting.
export const isLearning = (c: ScheduledCard) => { const st = stateOf(c); return st === "learning" || st === "relearning" }

// Anki's interval fuzz, deterministic per card so previews match the result.
function fuzz(ivl: number, seed: string): number {
  if (ivl < 2.5) return Math.round(ivl)
  const range = ivl < 7 ? Math.max(1, ivl * 0.15) : ivl < 20 ? ivl * 0.1 : ivl * 0.05
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const r = ((h >>> 0) % 1000) / 1000 // 0..1
  return Math.round(ivl - range + r * 2 * range)
}
const clampIvl = (d: number) => Math.min(MAX_IVL, Math.max(MIN_IVL, d))

// Returns a NEW card with its schedule updated after a grade.
export function applyGrade(card: ScheduledCard, grade: Grade, now: number): ScheduledCard {
  const st = stateOf(card)
  const base = { ...card, reps: card.reps + 1, last: now }
  const inMinutes = (m: number, state: CardState, step: number): ScheduledCard =>
    ({ ...base, state, step, due: now + m * MIN })
  const toReview = (ivlDays: number, ease = card.ease): ScheduledCard => {
    const ivl = clampIvl(ivlDays)
    return { ...base, state: "review", step: 0, ease, intervalDays: ivl, due: now + ivl * DAY }
  }

  // New / learning: walk the learning steps, then graduate.
  if (st === "new" || st === "learning") {
    const step = st === "new" ? 0 : Math.min(card.step ?? 0, LEARN_STEPS.length - 1)
    if (grade === "again") return inMinutes(LEARN_STEPS[0], "learning", 0)
    if (grade === "hard") {
      // First step: halfway to the next step (Anki: avg of 1m and 10m).
      const m = step === 0 && LEARN_STEPS.length > 1 ? (LEARN_STEPS[0] + LEARN_STEPS[1]) / 2 : LEARN_STEPS[step]
      return inMinutes(m, "learning", step)
    }
    if (grade === "easy") return toReview(EASY_IVL)
    const next = step + 1
    if (next >= LEARN_STEPS.length) return toReview(GRADUATING_IVL)
    return inMinutes(LEARN_STEPS[next], "learning", next)
  }

  // Relearning after a lapse: the step, then back to review at the lapse interval.
  if (st === "relearning") {
    const step = Math.min(card.step ?? 0, RELEARN_STEPS.length - 1)
    if (grade === "again") return inMinutes(RELEARN_STEPS[0], "relearning", 0)
    if (grade === "hard") return inMinutes(RELEARN_STEPS[step], "relearning", step)
    if (grade === "easy") return toReview(card.intervalDays + 1)
    if (step + 1 < RELEARN_STEPS.length) return inMinutes(RELEARN_STEPS[step + 1], "relearning", step + 1)
    return toReview(card.intervalDays)
  }

  // Review card.
  const ivl = Math.max(MIN_IVL, card.intervalDays)
  if (grade === "again") {
    const ease = Math.max(MIN_EASE, card.ease - 0.2)
    const lapseIvl = clampIvl(Math.round(ivl * LAPSE_MULT))
    return { ...base, state: "relearning", step: 0, ease, lapses: card.lapses + 1, intervalDays: lapseIvl, due: now + RELEARN_STEPS[0] * MIN }
  }
  // Anki v3 credits a late review with the extra days it survived.
  const daysLate = card.last ? Math.max(0, (now - card.due) / DAY) : 0
  const hardIvl = clampIvl(fuzz(Math.max(ivl * HARD_MULT, ivl + 1), card.id + "h" + card.reps))
  if (grade === "hard") return toReview(hardIvl, Math.max(MIN_EASE, card.ease - 0.15))
  const goodIvl = clampIvl(Math.max(fuzz((ivl + daysLate / 2) * card.ease, card.id + "g" + card.reps), hardIvl + 1))
  if (grade === "good") return toReview(goodIvl)
  const easyIvl = clampIvl(Math.max(fuzz((ivl + daysLate) * card.ease * EASY_BONUS, card.id + "e" + card.reps), goodIvl + 1))
  return toReview(easyIvl, card.ease + 0.15)
}

// Preview of the next interval for each grade (for button labels).
export function previewIntervals(card: ScheduledCard, now: number): Record<Grade, string> {
  const fmt = (c: ScheduledCard): string => {
    const ms = c.due - now
    if (ms < 60 * MIN) return `${Math.max(1, Math.round(ms / MIN))}m`
    if (ms < DAY) return `${Math.round(ms / (60 * MIN))}h`
    const d = Math.round(ms / DAY)
    if (d < 30) return `${d}d`
    if (d < 365) return `${Math.round(d / 30)}mo`
    return `${(d / 365).toFixed(1)}y`
  }
  return {
    again: fmt(applyGrade(card, "again", now)),
    hard: fmt(applyGrade(card, "hard", now)),
    good: fmt(applyGrade(card, "good", now)),
    easy: fmt(applyGrade(card, "easy", now)),
  }
}

// Learning cards due soon come back in the same sitting (Anki's learn-ahead).
export const comesBackThisSession = (c: ScheduledCard, now: number) => isLearning(c) && c.due - now <= LEARN_AHEAD_MS

// ── session selection ───────────────────────────────────────────────
export function buildSession(deck: Deck, now: number): ScheduledCard[] {
  // Anki order: learning cards first, then reviews, then a few new cards.
  const learning = deck.cards.filter(c => isLearning(c) && c.due <= now + LEARN_AHEAD_MS).sort((a, b) => a.due - b.due)
  const due = deck.cards.filter(c => stateOf(c) === "review" && c.due <= now).sort((a, b) => a.due - b.due)
  const fresh = deck.cards.filter(c => isNew(c) && c.due <= now).slice(0, NEW_PER_SESSION)
  return [...learning, ...due, ...fresh].slice(0, SESSION_CAP)
}

export interface DeckStats {
  total: number
  dueNow: number      // cards ready to review right now (incl. new)
  newCount: number
  learning: number    // seen but interval < 7d
  mature: number      // interval >= 7d
  nextDue?: number    // soonest future due time among non-due cards
}

export function deckStats(deck: Deck, now: number): DeckStats {
  let dueNow = 0, newCount = 0, learning = 0, mature = 0, nextDue: number | undefined
  for (const c of deck.cards) {
    if (isNew(c)) {
      newCount++
      if (c.due <= now) dueNow++
      else if (nextDue === undefined || c.due < nextDue) nextDue = c.due
      continue
    }
    if (c.due <= now) dueNow++
    else if (nextDue === undefined || c.due < nextDue) nextDue = c.due
    if (c.intervalDays >= 7) mature++; else learning++
  }
  return { total: deck.cards.length, dueNow, newCount, learning, mature, nextDue }
}

// Lore: how deeply a notebook is known — share of the deck that is mature and
// not overdue. Drives orchard roots + sap later. One definition, kept here.
export function lore(deck: Deck, now: number): number {
  if (!deck.cards.length) return 0
  const healthy = deck.cards.filter(c => c.reps > 0 && c.due > now && c.intervalDays >= 4).length
  return healthy / deck.cards.length
}

// ── persistence ─────────────────────────────────────────────────────
export function loadDeck(noteId: string): Deck | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + noteId)
    if (!raw) return null
    const deck = JSON.parse(raw) as Deck
    if (!Array.isArray(deck?.cards)) return null
    return deck
  } catch { return null }
}

export function saveDeck(deck: Deck): void {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(STORAGE_PREFIX + deck.noteId, JSON.stringify(deck)) } catch {}
}

export function deckStorageKey(noteId: string): string {
  return STORAGE_PREFIX + noteId
}

// ── topic cards (session-end tagging) ───────────────────────────────
// Append topic-tagged cards to a notebook's deck without touching existing
// cards' scheduling. Existing cards with the same id just gain the topic tag
// if they had none. Creates the deck if missing. Returns how many were added.
// `noteHash` (optional) overrides the deck's fingerprint, e.g. to mark the
// deck as in sync with the notes the cards came from.
// Session cards wait before their first recall: remembering later (spacing)
// beats quizzing right away. First due = next 6am at least 6h from now (i.e. "tomorrow morning").
export function firstRecallDue(now: number): number {
  const d = new Date(now + 6 * 3_600_000)
  if (d.getHours() >= 6) d.setDate(d.getDate() + 1)
  d.setHours(6, 0, 0, 0)
  return d.getTime()
}

export function addTopicCards(noteId: string, cards: Card[], topic: string, now: number, noteHash?: string, treeId?: number, firstDue = now): number {
  const deck: Deck = loadDeck(noteId) ?? { noteId, cards: [], generatedAt: now, noteHash: noteHash ?? "" }
  const byId = new Map(deck.cards.map((c, i) => [c.id, i]))
  const next = [...deck.cards]
  let added = 0
  for (const c of cards) {
    const sc = freshCard(c, now)
    const i = byId.get(sc.id)
    if (i !== undefined) {
      if (!next[i].topic) next[i] = { ...next[i], topic, ...(treeId != null ? { treeId } : {}) }
      continue
    }
    byId.set(sc.id, next.length)
    next.push({ ...sc, due: firstDue, topic, ...(treeId != null ? { treeId } : {}) })
    added++
  }
  saveDeck({ ...deck, cards: next, noteHash: noteHash ?? deck.noteHash })
  return added
}

// ── single-card edits (highlight-to-card toast: undo / tweak wording) ──
export function removeCard(noteId: string, id: string): boolean {
  const deck = loadDeck(noteId)
  if (!deck || !deck.cards.some(c => c.id === id)) return false
  saveDeck({ ...deck, cards: deck.cards.filter(c => c.id !== id) })
  return true
}

// Rewrites a card's question/answer, keeping its schedule. The id follows the new
// question (like every card) unless another card already has that id. Returns the
// card's id afterwards, or null if it's gone.
export function editCard(noteId: string, id: string, q: string, a: string): string | null {
  const deck = loadDeck(noteId)
  const i = deck?.cards.findIndex(c => c.id === id) ?? -1
  if (!deck || i < 0) return null
  const nextId = cardId(q)
  const newId = nextId === id || !deck.cards.some(c => c.id === nextId) ? nextId : id
  const cards = [...deck.cards]
  // Rephrasings were written for the old question.
  cards[i] = { ...cards[i], id: newId, q, a, alts: q === cards[i].q ? cards[i].alts : undefined }
  saveDeck({ ...deck, cards })
  return newId
}
