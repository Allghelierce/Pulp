// Topics-as-trees shared contract (docs/timer-recall-design.txt).
// Focus timer grows a tree to SAPLING; recall on that tree's topic grows it to FULL.
import { TREE_TYPES } from "@/app/constants"
import type { Tree } from "@/app/types"

export const SAPLING_STAGE = 2 // timer ceiling for topic trees
export const FULL_STAGE = 4

const BANK_KEY = "pulp-topic-bank"
const RECALL_PREFIX = "pulp-recall-"
const DAY = 86_400_000

// Canonical key for comparing topics ("  Photosynthesis " === "photosynthesis").
export const normalizeTopic = (t: string): string => t.trim().toLowerCase().replace(/\s+/g, " ")

// Correct-answer weight a topic tree needs to go sapling -> full, by rarity.
const RECALL_BY_RARITY: Record<string, number> = {
  common: 5, uncommon: 8, rare: 15, "true rare": 20, premium: 20, extinct: 25, chroma: 25,
}
export function recallNeededFor(type: string): number {
  const rarity = (TREE_TYPES as Record<string, any>)[type]?.rarity
  return RECALL_BY_RARITY[rarity] ?? 5
}

export const isTopicTree = (t: Tree): boolean => t.recallNeeded != null

// Only full topic trees produce sap. Legacy trees (pre-topics) keep producing
// at every stage, as they did before, so nobody loses existing income.
export function isFullyGrown(t: Tree): boolean {
  if (isTopicTree(t)) return (t.recallDone || 0) >= (t.recallNeeded || 0)
  return true
}

// ── banked nutrients: recall with no sapling waiting ────────────────
type Bank = Record<string, number>
function readBank(): Bank {
  try { return JSON.parse(localStorage.getItem(BANK_KEY) || "{}") } catch { return {} }
}
function writeBank(b: Bank) {
  try { localStorage.setItem(BANK_KEY, JSON.stringify(b)) } catch {}
}
export function bankNutrients(topic: string, weight: number) {
  const b = readBank(); const k = normalizeTopic(topic)
  b[k] = (b[k] || 0) + weight
  writeBank(b)
}
export function getBanked(topic: string): number {
  return readBank()[normalizeTopic(topic)] || 0
}
// Remove up to `max` banked weight and return what was taken.
export function takeBanked(topic: string, max = Infinity): number {
  const b = readBank(); const k = normalizeTopic(topic)
  const take = Math.min(b[k] || 0, max)
  if (take > 0) { b[k] -= take; if (b[k] <= 0) delete b[k]; writeBank(b) }
  return take
}

// ── freshness: 1 = nothing due, 0 = long overdue (visual only) ──────
// Reads every recall deck in localStorage and looks at cards tagged `topic`.
// `live` (optional): only decks of notebooks still in use count.
export function topicFreshness(topic: string, now = Date.now(), live?: ReadonlySet<string>): number {
  const k = normalizeTopic(topic)
  let worstOverdueDays = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(RECALL_PREFIX)) continue
      const deck = JSON.parse(localStorage.getItem(key) || "null")
      if (live && !live.has(deck?.noteId)) continue
      for (const c of deck?.cards || []) {
        if (!c.topic || normalizeTopic(c.topic) !== k) continue
        if (c.due < now) worstOverdueDays = Math.max(worstOverdueDays, (now - c.due) / DAY)
      }
    }
  } catch {}
  // Fully faded after ~14 overdue days.
  return Math.max(0, 1 - worstOverdueDays / 14)
}

// CSS filter for a tree sprite. Floor keeps faded trees muted but alive-looking.
export function freshnessFilter(freshness: number): string {
  const f = Math.max(0, Math.min(1, freshness))
  return `saturate(${(0.35 + 0.65 * f).toFixed(2)}) brightness(${(0.85 + 0.15 * f).toFixed(2)})`
}
