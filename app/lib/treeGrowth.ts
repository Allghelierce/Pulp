import { TREE_TYPES } from "@/app/constants"
import type { Tree } from "@/app/types"

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
