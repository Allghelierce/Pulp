import type { ComponentType } from "react"
import type { Tree, Achievement, NoteData } from "@/app/types"
import type { DailyEntry } from "@/app/lib/dailyStats"

export interface WidgetProps {
  isDark: boolean
  size: [number, number]
  dailyStats: DailyEntry[]
  grove: Tree[]
  xp?: number
  goals: { focus: number; writing: number; sessions: number }
  inventory: string[]
  activeNotebookId?: string
  activeNotebookName?: string
  achievements: Achievement[]
  notes: NoteData[]
  goalStreak?: number
  sap?: number
  hibernation?: { startDate: string; endDate: string; streakFrozen: number } | null
  hibernationScheduled?: { startDate: string; endDate: string } | null
  dailyGoalMinutes?: number
  quotaTier?: 'monthly' | 'weekly' | 'daily'
  ready?: boolean
}

export interface WidgetDefinition {
  id: string
  name: string
  description: string
  category: 'progress' | 'activity' | 'grove' | 'analysis'
  defaultSize: [number, number]
  minSize: [number, number]
  maxSize: [number, number]
  component: ComponentType<WidgetProps>
  /** Render without the card background/shadow (widget supplies its own visuals). */
  transparent?: boolean
}

export interface WidgetInstance {
  instanceId: string
  widgetId: string
  position: [number, number]
  size: [number, number]
  pinned: boolean
}

export interface DashboardLayout {
  version: 1
  widgets: WidgetInstance[]
  lastModified: number
  /** Layout revision; older saved layouts are migrated once (see useWidgetLayout). */
  rev?: number
}

export const LAYOUT_REV = 2

export const GRID_COLS = 6
export const ROW_HEIGHT = 140
export const GRID_GAP = 16
export const GRID_PAD = 24
export const MAX_ROWS = 5

let _registry: WidgetDefinition[] = []

export function registerWidget(def: WidgetDefinition) {
  if (!_registry.find(w => w.id === def.id)) _registry.push(def)
}

export function getWidgetRegistry(): WidgetDefinition[] {
  return _registry
}

export function getWidgetDef(id: string): WidgetDefinition | undefined {
  return _registry.find(w => w.id === id)
}

let _nextId = 0
export function genInstanceId(): string {
  return `w_${Date.now()}_${_nextId++}`
}

// Streak lives in the header (flame next to "Stats"); Consistency and Weekly
// Standings are the 3-row centerpiece. Fills the 6×5 grid with no gaps.
export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 1,
  rev: LAYOUT_REV,
  lastModified: Date.now(),
  widgets: [
    { instanceId: 'default_rings', widgetId: 'activity-rings', position: [0, 0], size: [2, 2], pinned: false },
    { instanceId: 'default_stats', widgetId: 'stats-summary', position: [2, 0], size: [2, 1], pinned: false },
    { instanceId: 'default_level', widgetId: 'level-progress', position: [4, 0], size: [2, 1], pinned: false },
    { instanceId: 'default_today', widgetId: 'today-vs-yesterday', position: [2, 1], size: [1, 1], pinned: false },
    { instanceId: 'default_week_forest', widgetId: 'week-forest', position: [3, 1], size: [3, 1], pinned: false },
    { instanceId: 'default_heatmap', widgetId: 'consistency-heatmap', position: [0, 2], size: [3, 3], pinned: false },
    { instanceId: 'default_league', widgetId: 'league-standing', position: [3, 2], size: [3, 3], pinned: false },
  ],
}
