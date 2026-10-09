// Pure-logic tests for "topics as trees" (docs/timer-recall-design.txt).
// No browser needed: lib code only touches localStorage, shimmed below.
import { test, expect } from "@playwright/test"
import type { Tree } from "@/app/types"
import {
  bankNutrients, getBanked, takeBanked, isFullyGrown, topicFreshness, FULL_STAGE, SAPLING_STAGE,
} from "@/lib/topics"
import { applyRecall, recallTarget } from "@/app/lib/treeGrowth"
import { guessTopic, backfillTopics, giveTopic, sessionsByTree } from "@/lib/treeSessions"
import { buildDeck, mergeCards, deckStorageKey, type Deck } from "@/lib/recallSchedule"

// ── in-memory localStorage ──────────────────────────────────────────
class MemStorage {
  private m = new Map<string, string>()
  get length() { return this.m.size }
  key(i: number) { return [...this.m.keys()][i] ?? null }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string) { this.m.set(k, String(v)) }
  removeItem(k: string) { this.m.delete(k) }
  clear() { this.m.clear() }
}
const store = new MemStorage()
;(globalThis as unknown as { localStorage: Storage }).localStorage = store as unknown as Storage
test.beforeEach(() => store.clear())

const DAY = 86_400_000
let nextId = 1
const sapling = (over: Partial<Tree> = {}): Tree => ({
  id: nextId++, type: "tangerine", stage: SAPLING_STAGE, progress: 50, plantedAt: nextId,
  topic: "Photosynthesis", recallNeeded: 5, recallDone: 0, ...over,
})
const legacy = (over: Partial<Tree> = {}): Tree => ({
  id: nextId++, type: "tangerine", stage: 2, progress: 50, plantedAt: nextId, ...over,
})

// ── 1. lib/topics.ts ────────────────────────────────────────────────
test.describe("topics bank", () => {
  test("bank accumulates per normalized topic", () => {
    bankNutrients("Photosynthesis", 2)
    bankNutrients("  photosynthesis ", 3)
    expect(getBanked("PHOTOSYNTHESIS")).toBe(5)
    expect(getBanked("Mitosis")).toBe(0)
  })

  test("takeBanked takes up to max and clears empty topics", () => {
    bankNutrients("Mitosis", 5)
    expect(takeBanked("mitosis", 3)).toBe(3)
    expect(getBanked("Mitosis")).toBe(2)
    expect(takeBanked("Mitosis")).toBe(2)
    expect(getBanked("Mitosis")).toBe(0)
    expect(JSON.parse(store.getItem("pulp-topic-bank")!)).toEqual({})
    expect(takeBanked("Mitosis")).toBe(0)
  })
})

test.describe("isFullyGrown", () => {
  test("topic tree is full only once recallDone >= recallNeeded", () => {
    expect(isFullyGrown(sapling({ recallDone: 0 }))).toBe(false)
    expect(isFullyGrown(sapling({ recallDone: 4 }))).toBe(false)
    expect(isFullyGrown(sapling({ recallDone: 5 }))).toBe(true)
    expect(isFullyGrown(sapling({ recallDone: 9 }))).toBe(true)
  })

  test("legacy trees are always full, at any stage", () => {
    for (const stage of [0, 1, 2, 3, 4]) expect(isFullyGrown(legacy({ stage }))).toBe(true)
  })
})

test.describe("topicFreshness", () => {
  const now = 1_700_000_000_000
  const saveDeckWith = (noteId: string, cards: { topic?: string; due: number }[]) =>
    store.setItem(deckStorageKey(noteId), JSON.stringify({
      noteId, generatedAt: now, noteHash: "", cards: cards.map((c, i) => ({ id: `c${i}`, q: "q", a: "a", ...c })),
    }))

  test("1 when nothing is overdue", () => {
    expect(topicFreshness("Photosynthesis", now)).toBe(1)
    saveDeckWith("n1", [{ topic: "Photosynthesis", due: now + DAY }])
    expect(topicFreshness("photosynthesis", now)).toBe(1)
  })

  test("drops as tagged cards go overdue, floors at 0", () => {
    saveDeckWith("n1", [{ topic: "Photosynthesis", due: now }])
    const f0 = topicFreshness("Photosynthesis", now)
    const f7 = topicFreshness("Photosynthesis", now + 7 * DAY)
    const f14 = topicFreshness("Photosynthesis", now + 14 * DAY)
    expect(f0).toBe(1)
    expect(f7).toBeCloseTo(0.5, 5)
    expect(f14).toBe(0)
    expect(topicFreshness("Photosynthesis", now + 30 * DAY)).toBe(0)
  })

  test("ignores other topics and untagged cards; uses worst card across decks", () => {
    saveDeckWith("n1", [{ topic: "Mitosis", due: now - 10 * DAY }, { due: now - 10 * DAY }])
    expect(topicFreshness("Photosynthesis", now)).toBe(1)
    saveDeckWith("n2", [{ topic: " photosynthesis", due: now - 7 * DAY }])
    saveDeckWith("n3", [{ topic: "Photosynthesis", due: now - 2 * DAY }])
    expect(topicFreshness("Photosynthesis", now)).toBeCloseTo(0.5, 5)
  })
})

// ── 2. applyRecall ──────────────────────────────────────────────────
test.describe("applyRecall", () => {
  test("tagged recall grows matching unfinished sapling", () => {
    const s = sapling({ topic: "Photosynthesis", recallDone: 1 })
    const out = applyRecall([s], "  PHOTOSYNTHESIS ", 2)
    expect(out[0].recallDone).toBe(3)
    expect(out[0].stage).toBe(SAPLING_STAGE)
    expect(getBanked("Photosynthesis")).toBe(0)
  })

  test("reaching recallNeeded jumps to full stage", () => {
    const s = sapling({ recallNeeded: 5, recallDone: 4 })
    const out = applyRecall([s], "Photosynthesis", 1)
    expect(out[0].recallDone).toBe(5)
    expect(out[0].stage).toBe(FULL_STAGE)
    expect(out[0].progress).toBe(100)
    expect(isFullyGrown(out[0])).toBe(true)
  })

  test("tagged recall feeds the oldest matching sapling only", () => {
    const older = sapling({ plantedAt: 1 })
    const newer = sapling({ plantedAt: 2 })
    const out = applyRecall([newer, older], "Photosynthesis", 1)
    expect(out.find(t => t.id === older.id)!.recallDone).toBe(1)
    expect(out.find(t => t.id === newer.id)!.recallDone).toBe(0)
  })

  test("tagged recall with no sapling waiting: grove unchanged, growth banked", () => {
    const grove = [sapling({ topic: "Mitosis" }), legacy()]
    const out = applyRecall(grove, "Photosynthesis", 3)
    expect(out).toBe(grove)
    expect(out).toEqual(grove)
    expect(getBanked("Photosynthesis")).toBe(3)
  })

  test("tagged recall when the topic's tree is already full: banked, tree untouched", () => {
    const full = sapling({ recallNeeded: 5, recallDone: 5, stage: FULL_STAGE })
    const grove = [full]
    const out = applyRecall(grove, "Photosynthesis", 2)
    expect(out).toEqual([full])
    expect(getBanked("Photosynthesis")).toBe(2)
  })

  test("untagged recall with no sapling waiting: grove unchanged, nothing planted", () => {
    const grove = [legacy(), legacy({ stage: 4 })]
    const out = applyRecall(grove, undefined, 3, "nb1")
    expect(out).toBe(grove)
    expect(out).toHaveLength(2)
    const empty = applyRecall([], "", 3, "nb1")
    expect(empty).toEqual([])
    expect(store.length).toBe(0) // untagged never banks
  })

  test("untagged recall grows a waiting sapling in the same notebook", () => {
    const other = sapling({ notebookId: "nb2", plantedAt: 1 })
    const here = sapling({ notebookId: "nb1", plantedAt: 2 })
    const out = applyRecall([other, here], undefined, 1, "nb1")
    expect(out.find(t => t.id === here.id)!.recallDone).toBe(1)
    expect(out.find(t => t.id === other.id)!.recallDone).toBe(0)
  })

  test("legacy and full trees never change", () => {
    const old = legacy({ notebookId: "nb1", topic: "Photosynthesis" })
    const full = sapling({ notebookId: "nb1", recallDone: 5, stage: FULL_STAGE, progress: 100 })
    const grove = [old, full]
    const snapshot = JSON.parse(JSON.stringify(grove))
    expect(applyRecall(grove, "Photosynthesis", 4, "nb1")).toEqual(snapshot)
    expect(applyRecall(grove, undefined, 4, "nb1")).toEqual(snapshot)
    expect(grove).toEqual(snapshot)
  })

  test("zero or negative weight is a no-op", () => {
    const grove = [sapling()]
    expect(applyRecall(grove, "Photosynthesis", 0)).toBe(grove)
    expect(getBanked("Photosynthesis")).toBe(0)
  })
})

// ── 3. mergeCards keeps topic-tagged cards ──────────────────────────
test.describe("mergeCards", () => {
  test("rebuilding a deck keeps topic-tagged cards not in the new batch", () => {
    const now = 1_700_000_000_000
    const base = buildDeck("n1", [{ q: "Q1", a: "A1" }, { q: "Q2", a: "A2" }], "notes", now)
    const tagged = { ...base.cards[0], id: "topic-card", q: "Tq", a: "Ta", topic: "Photosynthesis", reps: 3, due: now + 5 * DAY }
    const deck: Deck = { ...base, cards: [...base.cards, tagged] }

    const merged = mergeCards(deck, [{ q: "Q1", a: "A1 new" }, { q: "Q3", a: "A3" }], "notes v2", now + DAY)
    const qs = merged.cards.map(c => c.q)
    expect(qs).toContain("Q1")
    expect(qs).toContain("Q3")
    expect(qs).not.toContain("Q2") // untagged stale card dropped
    const kept = merged.cards.find(c => c.id === "topic-card")
    expect(kept).toEqual(tagged) // scheduling + tag preserved
    expect(merged.cards.find(c => c.q === "Q1")!.a).toBe("A1 new")
  })

  test("tagged card regenerated in the batch keeps its tag and is not duplicated", () => {
    const now = 1_700_000_000_000
    const base = buildDeck("n1", [{ q: "Q1", a: "A1" }], "notes", now)
    const deck: Deck = { ...base, cards: [{ ...base.cards[0], topic: "Photosynthesis", reps: 2 }] }
    const merged = mergeCards(deck, [{ q: "Q1", a: "A1" }], "notes", now)
    expect(merged.cards).toHaveLength(1)
    expect(merged.cards[0].topic).toBe("Photosynthesis")
    expect(merged.cards[0].reps).toBe(2)
  })
})

test.describe("tree sessions", () => {
  test("guessTopic: a heading, else the notebook's own title, else the lead words", () => {
    expect(guessTopic("Light reactions\nThey happen in the thylakoid.", "Bio")).toBe("Light reactions")
    expect(guessTopic("- Krebs Cycle\nmore", "")).toBe("Krebs Cycle")
    expect(guessTopic("Plants make sugar from light in their leaves, mostly.", "Biology 101")).toBe("Biology 101")
    expect(guessTopic("Mitosis is how a cell divides into two identical cells.", "My First Notebook")).toBe("Mitosis")
    expect(guessTopic("Photosynthesis converts light energy into chemical energy.", "Untitled")).toBe("Photosynthesis converts light")
  })

  test("sessionsByTree counts each tree's cards and due; backfill gives untitled and guessed trees that topic", () => {
    const now = 1_700_000_000_000
    const card = (id: string, treeId: number | undefined, due: number, topic?: string) =>
      ({ id, q: id, a: "a", ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, state: "new", due, last: 0, topic, treeId })
    store.setItem("pulp-recall-n1", JSON.stringify({ noteId: "n1", generatedAt: now, noteHash: "", cards: [
      card("a", 1, now - 1, "Optics"), card("b", 1, now + DAY, "Optics"), card("c", 2, now - 1, "Waves"), card("d", undefined, now - 1, "Waves"),
    ] }))
    const s = sessionsByTree(now)
    expect(s.get(1)).toEqual({ cards: 2, due: 1, topic: "Optics", noteId: "n1" })
    expect(s.get(2)).toEqual({ cards: 1, due: 1, topic: "Waves", noteId: "n1" })
    const grove = [sapling({ id: 1, topic: undefined }), sapling({ id: 2, topic: "Wavy guess", topicGuess: true }), sapling({ id: 3, topic: "Kept" })]
    const next = backfillTopics(grove, s)
    expect(next.map(t => t.topic)).toEqual(["Optics", "Waves", "Kept"])
    expect(next[1].topicGuess).toBeUndefined()
    expect(backfillTopics(next, s)).toBe(next) // nothing left to fill: same grove
  })

  test("giveTopic: a real name takes banked growth, a guess never does", () => {
    bankNutrients("Optics", 3)
    let grove = [sapling({ id: 1, topic: undefined, recallNeeded: 5, recallDone: 0 })]
    const set = (fn: (g: Tree[]) => Tree[]) => { grove = fn(grove) }
    expect(giveTopic(grove, set, 1, "Optics", { guess: true })).toEqual({ recallDone: 0, recallNeeded: 5 })
    expect(grove[0]).toMatchObject({ topic: "Optics", topicGuess: true, recallDone: 0 })
    expect(getBanked("Optics")).toBe(3)
    expect(giveTopic(grove, set, 1, "Optics")).toEqual({ recallDone: 0, recallNeeded: 5 }) // same name: already counted as this topic
    expect(grove[0].topicGuess).toBeUndefined()
    grove = [sapling({ id: 2, topic: "Guess", topicGuess: true, recallNeeded: 5, recallDone: 0 })]
    expect(giveTopic(grove, set, 2, "Optics")).toEqual({ recallDone: 3, recallNeeded: 5 })
    expect(getBanked("Optics")).toBe(0)
    expect(giveTopic(grove, set, 99, "Optics")).toBeNull()
  })

  test("a guessed topic counts as untagged for recall, so the notebook's cards can finish it", () => {
    const guessed = sapling({ id: 1, topic: "Lead words", topicGuess: true, notebookId: "n1", plantedAt: 1 })
    const tagged = sapling({ id: 2, topic: "Optics", notebookId: "n1", plantedAt: 2 })
    expect(recallTarget([guessed, tagged], undefined, "n1")?.id).toBe(1)
    // A card from a session grows that session's own tree first.
    expect(recallTarget([guessed, tagged], "Optics", "n1", 1)?.id).toBe(1)
  })
})
