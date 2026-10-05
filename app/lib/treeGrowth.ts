import { TREE_TYPES } from "@/app/constants"
import type { Tree } from "@/app/types"
import { FULL_STAGE, normalizeTopic, isTopicTree, isFullyGrown, bankNutrients } from "@/lib/topics"

// Growth stage from a 0..1 ratio of focus-minutes toward a tree's growth target.
// Mirrors the computeStage used in VitalitySystem.claimReward.
export const computeStage = (ratio: number): number =>
  ratio >= 1 ? 4 : ratio >= 0.6 ? 3 : ratio >= 0.3 ? 2 : ratio >= 0.1 ? 1 : 0

// Plant a new tree of `type`, or grow the existing partial one, by `minutes` of
// progress. Returns the new grove array. This is the shared plant/grow core used
// by both the focus timer (claimReward) and Recall mode (correct answers), so a
// recall "correct answer" converts to a small number of growth-minutes.
export function growTree(grove: Tree[], type: string, minutes: number, notebookId?: string): Tree[] {
  const info = (TREE_TYPES as Record<string, any>)[type]
  const growthTarget = info?.growthMinutes || 25
  const existingPartial = grove.find(
    t => t.type === type && t.growthTarget && (t.focusMinutes || 0) < t.growthTarget,
  )
  if (existingPartial) {
    const newFocus = Math.min(growthTarget, (existingPartial.focusMinutes || 0) + minutes)
    const ratio = newFocus / growthTarget
    return grove.map(t =>
      t.id === existingPartial.id
        ? { ...t, focusMinutes: newFocus, stage: computeStage(ratio), progress: ratio * 100 }
        : t,
    )
  }
  const ratio = Math.min(1, minutes / growthTarget)
  const newTree: Tree = {
    id: Date.now(),
    type,
    stage: computeStage(ratio),
    progress: ratio * 100,
    plantedAt: Date.now(),
    notebookId: notebookId ?? undefined,
    focusMinutes: minutes,
    growthTarget,
  }
  return [...grove, newTree]
}

// Add `weight` of recall to one topic tree; finishing it jumps to FULL_STAGE.
function feedTopicTree(grove: Tree[], id: number, weight: number): Tree[] {
  return grove.map(t => {
    if (t.id !== id) return t
    const done = (t.recallDone || 0) + weight
    return done >= (t.recallNeeded || 0)
      ? { ...t, recallDone: done, stage: FULL_STAGE, progress: 100 }
      : { ...t, recallDone: done }
  })
}

const oldest = (trees: Tree[]): Tree | undefined =>
  trees.reduce<Tree | undefined>((a, t) => (!a || t.plantedAt < a.plantedAt ? t : a), undefined)

// Recall growth (topics as trees, docs/timer-recall-design.txt).
// - topic: grow that topic's unfinished sapling; none waiting -> bank nutrients.
// - no topic (legacy cards / nothing written): oldest topic-less sapling in the
//   notebook, else oldest sapling in the notebook, else oldest topic-less sapling
//   anywhere, else no growth.
// Full trees and legacy trees are never touched by the topic paths.
// NOTE: banking writes localStorage — call outside React state updaters.
export function applyRecall(grove: Tree[], topic: string | undefined, weight: number, notebookId?: string, treeId?: number): Tree[] {
  if (weight <= 0) return grove
  const waiting = grove.filter(t => isTopicTree(t) && !isFullyGrown(t))
  // Card from a specific session: grow that session's own tree first.
  if (treeId != null && waiting.some(t => t.id === treeId)) return feedTopicTree(grove, treeId, weight)
  if (topic && topic.trim()) {
    const k = normalizeTopic(topic)
    const match = oldest(waiting.filter(t => t.topic && normalizeTopic(t.topic) === k))
    if (match) return feedTopicTree(grove, match.id, weight)
    bankNutrients(topic, weight)
    return grove
  }
  const inNotebook = waiting.filter(t => (t.notebookId ?? undefined) === (notebookId ?? undefined))
  // Fallback: a topic-less sapling anywhere (paper sessions, no notebook) so none get stuck.
  const target = oldest(inNotebook.filter(t => !t.topic)) ?? oldest(inNotebook) ?? oldest(waiting.filter(t => !t.topic))
  if (target) return feedTopicTree(grove, target.id, weight)
  // Nothing waiting: only the timer plants trees, so recall just pays its sap.
  return grove
}
