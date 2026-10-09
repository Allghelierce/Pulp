// Trees as focus sessions: the cards a session made (tagged with its tree id), and
// naming a session's topic — retried later when the AI call fails or the tab closes,
// with a local guess meanwhile so every tree carries a topic.
import type { Tree } from "@/app/types"
import { MAX_TEXT, MIN_TOPIC_TEXT, type Card } from "@/lib/recallPrompt"
import { addTopicCards, firstRecallDue } from "@/lib/recallSchedule"
import { markCovered } from "@/lib/fullReview"
import { readDecks } from "@/lib/topicIndex"
import { normalizeTopic, takeBanked, FULL_STAGE } from "@/lib/topics"

const PENDING_KEY = "pulp-tag-pending"
const MAX_PENDING = 12
const MAX_TOPIC = 40

// ── a tree's own session cards ──────────────────────────────────────
export interface TreeSession { cards: number; due: number; topic?: string; noteId: string }

// Every tree's session cards, by tree id: count, due now, their topic, the deck they live in.
export function sessionsByTree(now = Date.now()): Map<number, TreeSession> {
  const out = new Map<number, TreeSession>()
  for (const deck of readDecks()) {
    for (const c of deck.cards) {
      if (c.treeId == null) continue
      let s = out.get(c.treeId)
      if (!s) { s = { cards: 0, due: 0, noteId: deck.noteId }; out.set(c.treeId, s) }
      s.cards++
      if (c.due <= now) s.due++
      if (!s.topic && c.topic?.trim()) s.topic = c.topic.trim()
    }
  }
  return out
}

// Trees whose topic never landed on them but whose session cards carry one
// (e.g. the grove was saved before the tag did). Returns the grove unchanged if none.
export function backfillTopics(grove: Tree[], sessions: Map<number, TreeSession>): Tree[] {
  let changed = false
  const next = grove.map(t => {
    const topic = sessions.get(t.id)?.topic
    if (!topic || (t.topic?.trim() && !t.topicGuess)) return t
    if (t.topic === topic && !t.topicGuess) return t
    changed = true
    const { topicGuess: _, ...rest } = t
    return { ...rest, topic }
  })
  return changed ? next : grove
}

// ── naming a session ────────────────────────────────────────────────
// What the topic call needs, kept until it succeeds.
export interface PendingTag { treeId: number | null; noteId: string; text: string; title: string; topics: string[]; at: number }

function readPending(): PendingTag[] {
  try { const v = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); return Array.isArray(v) ? v : [] } catch { return [] }
}
function writePending(list: PendingTag[]) {
  try { list.length ? localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-MAX_PENDING))) : localStorage.removeItem(PENDING_KEY) } catch {}
}
export function savePendingTag(p: PendingTag) {
  if (p.treeId == null) return
  writePending([...readPending().filter(x => x.treeId !== p.treeId), { ...p, text: p.text.slice(0, MAX_TEXT) }])
}
export function clearPendingTag(treeId: number) {
  const list = readPending()
  if (list.some(x => x.treeId === treeId)) writePending(list.filter(x => x.treeId !== treeId))
}
export function pendingTag(treeId: number): PendingTag | undefined {
  return readPending().find(x => x.treeId === treeId)
}
export function pendingTags(): PendingTag[] { return readPending() }

// A topic from the notes alone, for when the AI can't name one: the first
// heading-like line written, else the notebook's own title, else the opening
// words up to the first linking verb ("Mitosis is…" -> "Mitosis").
const DEFAULT_TITLE = /^(untitled|my first notebook|new notebook|notebook)\b/i
const LINKING = /^(is|are|was|were|has|have|had|can|will|means|refers|describes|involves|includes)$/i
export function guessTopic(text: string, title: string): string {
  const lines = text.split("\n").map(l => l.replace(/^[\s#>*•\-–—\d.)]+/, "").trim()).filter(Boolean)
  const heading = lines.find(l => l.length >= 3 && l.length <= MAX_TOPIC && !/[.!?,;:]$/.test(l) && l.split(/\s+/).length <= 6)
  if (heading) return heading
  const t = title.trim()
  if (t && !DEFAULT_TITLE.test(t)) return t.slice(0, MAX_TOPIC)
  const words = (lines[0] || "").replace(/[.!?,;:].*$/, "").split(/\s+/).filter(Boolean)
  const stop = words.findIndex((w, i) => i > 0 && LINKING.test(w))
  const lead = words.slice(0, stop > 0 ? Math.min(stop, 4) : 3).join(" ")
  return lead.slice(0, MAX_TOPIC) || "Notes"
}

export type NameResult = { topic: string; cards: number } | { failed: true; status: number }

// One AI call names the session and writes its cards (tagged to the tree, first due
// tomorrow morning). `noteHash` stamps the deck when it was in sync with the notes.
// Clears the pending entry on success; leaves it for a retry on failure.
export async function nameSession(p: PendingTag, noteHash?: string): Promise<NameResult> {
  try {
    // Loaded on use, so the rest of this module stays usable without the auth client.
    const { apiFetch } = await import("@/lib/apiFetch")
    const res = await apiFetch("/api/recall/topic", {
      method: "POST",
      body: JSON.stringify({ text: p.text, title: p.title, topics: p.topics }),
    })
    if (!res.ok) {
      // Too little text is never going to work: stop retrying it.
      if (res.status === 400 && p.treeId != null) clearPendingTag(p.treeId)
      return { failed: true, status: res.status }
    }
    const data = await res.json() as { topic?: string; cards?: Card[] }
    const topic = typeof data?.topic === "string" ? data.topic.trim().slice(0, 60) : ""
    if (!topic) return { failed: true, status: 502 }
    const cards = Array.isArray(data.cards) ? data.cards : []
    let added = 0
    if (cards.length) {
      added = addTopicCards(p.noteId, cards, topic, Date.now(), noteHash, p.treeId ?? undefined, firstRecallDue(Date.now()))
      markCovered(p.noteId, p.text.split("\n")) // full review won't re-card what this session carded
      if (added > 0) {
        try { window.dispatchEvent(new CustomEvent("pulp-cards-queued", { detail: { noteId: p.noteId, topic, count: added } })) } catch {}
      }
    }
    if (p.treeId != null) clearPendingTag(p.treeId)
    return { topic, cards: added }
  } catch {
    return { failed: true, status: 0 }
  }
}

// Give tree `treeId` its topic (a real one clears any guess) and the nutrients banked
// for it. `grove` is the current grove, read for what the tree still needs; the patch
// goes through `setGrove` as an updater. Banking writes localStorage, so this runs
// outside any state updater. Returns the recall progress it ends with, or null if
// the tree is gone.
export function giveTopic(
  grove: Tree[], setGrove: (fn: (g: Tree[]) => Tree[]) => void, treeId: number, topic: string, opts: { guess?: boolean } = {},
): { recallDone: number; recallNeeded: number } | null {
  const tree = grove.find(t => t.id === treeId)
  if (!tree) return null
  const need = tree.recallNeeded ?? 0
  // A guess never takes banked growth (the real topic may be another grove), nor does a re-tag.
  const same = !!tree.topic && normalizeTopic(tree.topic) === normalizeTopic(topic)
  const banked = opts.guess || same || tree.recallNeeded == null ? 0 : takeBanked(topic, Math.max(0, need - (tree.recallDone || 0)))
  setGrove(g => g.map(t => {
    if (t.id !== treeId) return t
    const { topicGuess: _, ...rest } = t
    const recallDone = (t.recallDone || 0) + banked
    const full = banked > 0 && recallDone >= (t.recallNeeded ?? need)
    return { ...rest, topic, ...(opts.guess ? { topicGuess: true } : {}), ...(banked > 0 ? { recallDone } : {}), ...(full ? { stage: FULL_STAGE, progress: 100 } : {}) }
  }))
  return { recallDone: Math.min((tree.recallDone || 0) + banked, need), recallNeeded: need }
}

export const canName = (text: string): boolean => text.trim().length >= MIN_TOPIC_TEXT
