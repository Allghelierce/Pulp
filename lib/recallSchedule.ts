// SM-2 spaced-repetition scheduler for recall decks.
// Each notebook owns a persistent deck of cards with their own scheduling state,
// so "easy" cards return less often and the review load reflects real retention.
import type { Card } from "@/lib/recallPrompt"

export type Grade = "again" | "hard" | "good" | "easy"

export interface ScheduledCard {
  id: string
  q: string
  a: string
  hint?: string
  ease: number        // SM-2 ease factor, >= 1.3
  intervalDays: number // current interval in days
  reps: number        // consecutive successful reps
  lapses: number      // times forgotten
  due: number         // epoch ms when next due
  last?: number       // epoch ms of last review
  topic?: string      // topic display name from session-end tagging; compare via normalizeTopic
  treeId?: number     // tree planted by the session that made this card (per-session recall)
}

export interface Deck {
  noteId: string
  cards: ScheduledCard[]
  generatedAt: number
  noteHash: string    // fingerprint of source notes, to detect drift
}

const DAY = 86_400_000
const STORAGE_PREFIX = "pulp-recall-"
const NEW_PER_SESSION = 6
const SESSION_CAP = 25
const MIN_EASE = 1.3

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

// ── SM-2 update ─────────────────────────────────────────────────────
// Returns a NEW card with updated schedule after a grade.
export function applyGrade(card: ScheduledCard, grade: Grade, now: number): ScheduledCard {
  let { ease, reps, intervalDays, lapses } = card

  if (grade === "again") {
    reps = 0
    lapses += 1
    ease = Math.max(MIN_EASE, ease - 0.2)
    intervalDays = 0
    // due again in ~10 min (same session relearn)
    return { ...card, ease, reps, lapses, intervalDays, due: now + 10 * 60_000, last: now }
  }

  if (grade === "hard") {
    ease = Math.max(MIN_EASE, ease - 0.15)
    intervalDays = reps === 0 ? 1 : Math.max(1, intervalDays * 1.2)
    reps += 1
  } else if (grade === "good") {
    intervalDays = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(intervalDays * ease)
    reps += 1
  } else { // easy
    ease = ease + 0.15
    intervalDays = reps === 0 ? 3 : reps === 1 ? 8 : Math.round(intervalDays * ease * 1.3)
    reps += 1
  }

  intervalDays = Math.max(1, intervalDays)
  return { ...card, ease, reps, lapses, intervalDays, due: now + intervalDays * DAY, last: now }
}

// Preview of the next interval for each grade (for button labels).
export function previewIntervals(card: ScheduledCard, now: number): Record<Grade, string> {
  const fmt = (c: ScheduledCard): string => {
    if (c.due - now < DAY) return "<1d"
    const d = Math.round((c.due - now) / DAY)
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

// ── session selection ───────────────────────────────────────────────
export function buildSession(deck: Deck, now: number): ScheduledCard[] {
  const due = deck.cards.filter(c => c.reps > 0 && c.due <= now).sort((a, b) => a.due - b.due)
  const fresh = deck.cards.filter(c => c.reps === 0).slice(0, NEW_PER_SESSION)
  return [...due, ...fresh].slice(0, SESSION_CAP)
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
    if (c.reps === 0) { newCount++; dueNow++; continue }
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
export function addTopicCards(noteId: string, cards: Card[], topic: string, now: number, noteHash?: string, treeId?: number): number {
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
    next.push({ ...sc, topic, ...(treeId != null ? { treeId } : {}) })
    added++
  }
  saveDeck({ ...deck, cards: next, noteHash: noteHash ?? deck.noteHash })
  return added
}
