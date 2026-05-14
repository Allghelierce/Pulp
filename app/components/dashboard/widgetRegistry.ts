import type { ComponentType } from "react"
import type { Tree, Achievement, NoteData } from "@/app/types"
import type { DailyEntry } from "@/app/lib/dailyStats"

export interface WidgetProps {
  isDark: boolean
  size: [number, number]
  dailyStats: DailyEntry[]
  grove: Tree[]
  xp: number
  goals: { focus: number; writing: number; sessions: number }
  inventory: string[]
  activeNotebookId?: string
  activeNotebookName?: string
  achievements: Achievement[]
  notes: NoteData[]
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
}

export const GRID_COLS = 6
export const ROW_HEIGHT = 120
export const GRID_GAP = 16
export const GRID_PAD = 24

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

export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 1,
  lastModified: Date.now(),
  widgets: [
    { instanceId: 'default_rings', widgetId: 'activity-rings', position: [0, 0], size: [2, 2], pinned: false },
    { instanceId: 'default_stats', widgetId: 'stats-summary', position: [2, 0], size: [2, 1], pinned: false },
    { instanceId: 'default_level', widgetId: 'level-progress', position: [4, 0], size: [2, 1], pinned: false },
    { instanceId: 'default_today', widgetId: 'today-vs-yesterday', position: [2, 1], size: [1, 1], pinned: false },
    { instanceId: 'default_streak', widgetId: 'streak-card', position: [3, 1], size: [1, 1], pinned: false },
    { instanceId: 'default_notebook', widgetId: 'notebook-stats', position: [4, 1], size: [2, 1], pinned: false },
    { instanceId: 'default_heatmap', widgetId: 'consistency-heatmap', position: [0, 2], size: [3, 2], pinned: false },
    { instanceId: 'default_species', widgetId: 'species-collection', position: [3, 2], size: [3, 2], pinned: false },
    { instanceId: 'default_trees', widgetId: 'recently-grown', position: [0, 4], size: [6, 1], pinned: false },
  ],
}
