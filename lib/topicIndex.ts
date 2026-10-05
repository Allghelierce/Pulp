// One row per topic across all notebooks: due cards, saplings waiting, freshness.
// Built from recall decks (localStorage) + the grove. Powers the Topics list.
import type { Tree } from "@/app/types"
import type { Deck } from "@/lib/recallSchedule"
import { normalizeTopic, isTopicTree, isFullyGrown, getBanked, topicFreshness } from "@/lib/topics"

const RECALL_PREFIX = "pulp-recall-"

export interface TopicRow {
  key: string            // normalizeTopic(name)
  name: string           // display name
  due: number            // cards due now (incl. new)
  cards: number          // total tagged cards
  dueByNotebook: Record<string, number>
  notebookIds: string[]
  saplings: number       // unfinished topic trees
  fullTrees: number
  recallLeft: number     // weight still needed across waiting saplings
  banked: number
  freshness: number      // 0..1
  lastStudied: number    // newest card review or tree plant, epoch ms
}

function readDecks(): Deck[] {
  const out: Deck[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith(RECALL_PREFIX)) continue
      const d = JSON.parse(localStorage.getItem(k) || "null")
      if (d?.cards) out.push(d)
    }
  } catch {}
  return out
}

export function buildTopicIndex(grove: Tree[], now = Date.now()): TopicRow[] {
  const rows = new Map<string, TopicRow>()
  const row = (name: string): TopicRow => {
    const key = normalizeTopic(name)
    let r = rows.get(key)
    if (!r) {
      r = { key, name: name.trim(), due: 0, cards: 0, dueByNotebook: {}, notebookIds: [], saplings: 0, fullTrees: 0, recallLeft: 0, banked: 0, freshness: 1, lastStudied: 0 }
      rows.set(key, r)
    }
    return r
  }
  const addNotebook = (r: TopicRow, id?: string) => { if (id && !r.notebookIds.includes(id)) r.notebookIds.push(id) }

  for (const deck of readDecks()) {
    for (const c of deck.cards) {
      if (!c.topic) continue
      const r = row(c.topic)
      r.cards++
      addNotebook(r, deck.noteId)
      if (c.due <= now) {
        r.due++
        r.dueByNotebook[deck.noteId] = (r.dueByNotebook[deck.noteId] || 0) + 1
      }
      if (c.last) r.lastStudied = Math.max(r.lastStudied, c.last)
    }
  }
  for (const t of grove) {
    if (!t?.topic || !isTopicTree(t)) continue
    const r = row(t.topic)
    addNotebook(r, t.notebookId)
    r.lastStudied = Math.max(r.lastStudied, t.plantedAt || 0)
    if (isFullyGrown(t)) r.fullTrees++
    else { r.saplings++; r.recallLeft += Math.max(0, (t.recallNeeded || 0) - (t.recallDone || 0)) }
  }
  for (const r of rows.values()) {
    r.banked = getBanked(r.name)
    r.freshness = topicFreshness(r.name, now)
  }
  // Most urgent first: due cards, then waiting saplings, then most faded.
  return [...rows.values()].sort((a, b) =>
    (b.due - a.due) || (b.saplings - a.saplings) || (a.freshness - b.freshness) || (b.lastStudied - a.lastStudied))
}

// Notebook with the most due cards for a topic (where "Recall" should open).
export function bestNotebookFor(r: TopicRow): string | undefined {
  const entries = Object.entries(r.dueByNotebook).sort((a, b) => b[1] - a[1])
  return entries[0]?.[0] ?? r.notebookIds[0]
}

// Cards due now across every notebook (tagged or not) — sidebar badge.
export function totalDueAll(now = Date.now()): number {
  let n = 0
  for (const deck of readDecks()) for (const c of deck.cards) if (c.due <= now) n++
  return n
}
