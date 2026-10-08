// Full review: study EVERY card in a notebook (not just due ones), with
// on-demand cards for pages that have none, paced tree growth, and resume.
import type { NoteData } from "@/app/types"
import { extractTextFromHTML } from "@/lib/sanitize"
import { hashNotes, loadDeck, saveDeck, type Deck, type ScheduledCard } from "@/lib/recallSchedule"
import { normalizeTopic } from "@/lib/topics"

export const MIN_PAGE_TEXT = 80          // less new text than this isn't worth a card call
export const MAX_PAGES_PER_START = 6     // bound AI work per review start
// Local calendar day (the user's midnight, not UTC's).
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }

// ── coverage: which note text already has cards ─────────────────────────
// Tracked per LINE (a fingerprint set on the deck), so moving/reordering pages
// or fixing a short line doesn't re-card a page; only real new text does.

// Plain-text lines of some HTML: block ends and <br> become line breaks
// (same split as the focus-session diff in VitalitySystem, so keys match).
export function htmlLines(html: string): string[] {
  const text = extractTextFromHTML(
    String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6]|blockquote|pre|tr)>/gi, "\n"),
  )
  return text.split("\n").map(l => l.trim()).filter(Boolean)
}

const lineKey = (l: string) => hashNotes(l.trim().replace(/\s+/g, " "))

// Lines on one page: the page body plus its text boxes (imports live in boxes).
export function pageLines(note: NoteData, i: number): string[] {
  const out = htmlLines(note.pages[i] || "")
  for (const b of note.boxes?.[i] || []) out.push(...htmlLines(b.content || ""))
  return out
}

export function notebookLines(note: NoteData): string[] {
  return note.pages.flatMap((_, i) => pageLines(note, i))
}

// Pages with enough text that no cards were made from yet. `text` is only the
// new lines, so the AI cards what's missing instead of re-carding the page.
export function uncoveredPages(note: NoteData, deck: Deck | null): { i: number; text: string }[] {
  const covered = new Set(deck?.covered || [])
  const out: { i: number; text: string }[] = []
  for (let i = 0; i < note.pages.length; i++) {
    const text = pageLines(note, i).filter(l => !covered.has(lineKey(l))).join("\n")
    if (text.length >= MIN_PAGE_TEXT) out.push({ i, text })
  }
  return out
}

// Record that cards were made from these lines.
export function markCovered(noteId: string, lines: string[]): void {
  const deck = loadDeck(noteId)
  if (!deck) return
  const covered = new Set(deck.covered || [])
  for (const l of lines) if (l.trim()) covered.add(lineKey(l))
  saveDeck({ ...deck, covered: [...covered] })
}

// Decks made before coverage was tracked: their cards stand for `lines` (the
// notes as they are now), so only text added later gets carded on demand.
export function seedCoverage(noteId: string, lines: string[]): Deck | null {
  const deck = loadDeck(noteId)
  if (!deck || deck.covered || !deck.cards.length) return deck
  const next = { ...deck, covered: [...new Set(lines.filter(l => l.trim()).map(lineKey))] }
  saveDeck(next)
  return next
}

// One carding run per notebook at a time (across mounts): a second start waits
// for the running one, then sees its pages as covered instead of re-carding them.
const carding = new Map<string, Promise<unknown>>()
export async function exclusiveCarding<T>(noteId: string, fn: () => Promise<T>): Promise<T> {
  while (carding.has(noteId)) await carding.get(noteId)!.catch(() => {})
  const p = fn()
  carding.set(noteId, p)
  try { return await p } finally { if (carding.get(noteId) === p) carding.delete(noteId) }
}

// Free accounts out of today's card allowance: don't ask again this page load.
let cardsLimitedDay = ""
export const cardsLimitedToday = () => cardsLimitedDay === today()
export const setCardsLimitedToday = () => { cardsLimitedDay = today() }

export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

// ── paced growth: a card grows its tree once per day, and each tree gains at
// most `cap` (≈ a third of what it needs) per day from full review ──────────
const GROWTH_KEY = "pulp-full-review-growth"
type Ledger = { day: string; cards: string[]; topics: Record<string, number>; sap?: string[] }

function readLedger(): Ledger {
  try {
    const l = JSON.parse(localStorage.getItem(GROWTH_KEY) || "null") as Ledger | null
    if (l && l.day === today()) return l
  } catch {}
  return { day: today(), cards: [], topics: {} }
}
const writeLedger = (l: Ledger) => { try { localStorage.setItem(GROWTH_KEY, JSON.stringify(l)) } catch {} }

// Returns the growth weight actually allowed (0 = this card already counted
// today, or the tree is "rested" until tomorrow). `treeKey` identifies the tree.
export function claimFullReviewGrowth(cardId: string, treeKey: string, weight: number, cap: number): number {
  const l = readLedger()
  if (l.cards.includes(cardId)) return 0
  const k = normalizeTopic(treeKey)
  const granted = Math.max(0, Math.min(weight, cap - (l.topics[k] || 0)))
  l.cards.push(cardId)
  if (granted > 0) l.topics[k] = (l.topics[k] || 0) + granted
  writeLedger(l)
  return granted
}

// Sap: a card pays in full review at most once a day (re-runs can't farm it).
export function claimFullReviewSap(cardId: string): boolean {
  const l = readLedger()
  const sap = l.sap || []
  if (sap.includes(cardId)) return false
  writeLedger({ ...l, sap: [...sap, cardId] })
  return true
}

// ── resume: remaining card ids + the tallies so far, kept for a few days ──
const PROGRESS_PREFIX = "pulp-full-review-progress-"
const PROGRESS_TTL = 3 * 86_400_000

export type TopicScore = { right: number; total: number }
export type FullTally = { done: string[]; scores: Record<string, TopicScore>; missed: string[]; grown: Record<string, number>; sap: number; sapAgain: number }
type Progress = FullTally & { ids: string[]; at: number }

export function saveProgress(noteId: string, ids: string[], tally?: FullTally): void {
  try {
    if (ids.length && tally) localStorage.setItem(PROGRESS_PREFIX + noteId, JSON.stringify({ ...tally, ids, at: Date.now() }))
    else localStorage.removeItem(PROGRESS_PREFIX + noteId)
  } catch {}
}

// An unfinished full review: its remaining cards (still in the deck), plus cards
// added since it started, and its tallies — or null.
export function loadProgress(noteId: string, cards: ScheduledCard[]): (FullTally & { queue: ScheduledCard[] }) | null {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS_PREFIX + noteId) || "null") as Progress | null
    if (!p || !Array.isArray(p.ids) || Date.now() - p.at > PROGRESS_TTL) return null
    const byId = new Map(cards.map(c => [c.id, c]))
    const left = p.ids.map(id => byId.get(id)).filter((c): c is ScheduledCard => !!c)
    const seen = new Set([...p.ids, ...(p.done || [])])
    const added = shuffled(cards.filter(c => !seen.has(c.id)))
    const queue = [...left, ...added]
    if (!queue.length) return null
    return { queue, done: p.done || [], scores: p.scores || {}, missed: p.missed || [], grown: p.grown || {}, sap: p.sap || 0, sapAgain: p.sapAgain || 0 }
  } catch { return null }
}
