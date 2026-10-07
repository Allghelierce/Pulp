"use client"
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { Tree, Achievement, NoteData } from "@/app/types"
import { loadDailyStats, type DailyEntry } from "@/app/lib/dailyStats"
import { DashboardToolbar } from "./dashboard/DashboardToolbar"
import { DashboardGrid } from "./dashboard/DashboardGrid"
import { WidgetLibrary } from "./dashboard/WidgetLibrary"
import { useWidgetLayout } from "./dashboard/useWidgetLayout"
import type { WidgetProps } from "./dashboard/widgetRegistry"
import { LIVELY_CSS } from "./dashboard/lively"
import { SCENE_CSS } from "./GroveScene"
import { buildQuips, nextQuipIndex } from "./dashboard/quips"

import "./dashboard/widgets/registerAll"

export interface DashboardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  xp?: number
  grove: Tree[]
  inventory: string[]
  activeNotebookId?: string
  activeNotebookName?: string
  achievements: Achievement[]
  notes: NoteData[]
  goalStreak?: number
  sap?: number
  dailyGoalMinutes?: number
  hibernation?: { startDate: string; endDate: string; streakFrozen: number } | null
  hibernationScheduled?: { startDate: string; endDate: string } | null
  quotaTier?: 'monthly' | 'weekly' | 'daily'
}

const DEFAULT_GOALS = { focus: 60, writing: 2000, sessions: 3 }

function loadGoals() {
  if (typeof window === 'undefined') return DEFAULT_GOALS
  try {
    const saved = localStorage.getItem('pulp-ring-goals')
    if (saved) return { ...DEFAULT_GOALS, ...JSON.parse(saved) }
  } catch {}
  return DEFAULT_GOALS
}

export const DashboardView = memo(function DashboardView({
  isOpen, onClose, theme, xp, grove, inventory,
  activeNotebookId, activeNotebookName, achievements, notes,
  goalStreak, sap, dailyGoalMinutes, hibernation, hibernationScheduled, quotaTier,
}: DashboardViewProps) {
  const isDark = theme === 'dark'
  const [dailyStats, setDailyStats] = useState<DailyEntry[]>([])
  const [goals] = useState(loadGoals)
  const [libraryOpen, setLibraryOpen] = useState(false)
  // One friendly comparison per visit, rotating through what the numbers support.
  const [quipIndex] = useState(nextQuipIndex)
  const quip = useMemo(() => {
    const quips = buildQuips(dailyStats, grove.length)
    return quips.length ? quips[quipIndex % quips.length] : null
  }, [dailyStats, grove.length, quipIndex])

  const {
    layout, editMode, setEditMode,
    moveWidget, pinWidget, addWidget, removeWidget, resetLayout, gridFull,
  } = useWidgetLayout()

  useEffect(() => {
    if (!isOpen) return
    setDailyStats(loadDailyStats())
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const widgetProps: WidgetProps = useMemo(() => ({
    isDark,
    size: [1, 1],
    dailyStats,
    grove,
    xp,
    goals,
    inventory,
    activeNotebookId,
    activeNotebookName,
    achievements,
    notes,
    goalStreak,
    sap,
    dailyGoalMinutes,
    hibernation,
    hibernationScheduled,
    quotaTier,
  }), [isDark, dailyStats, grove, xp, goals, inventory, activeNotebookId, activeNotebookName, achievements, notes, goalStreak, sap, dailyGoalMinutes, hibernation, hibernationScheduled, quotaTier])

  if (!isOpen) return null

  const bg = isDark ? '#0e0c09' : '#ede6d8'

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{LIVELY_CSS + SCENE_CSS}</style>
      <DashboardToolbar
        isDark={isDark}
        quip={quip}
        editMode={editMode}
        onClose={onClose}
        onToggleEdit={() => setEditMode(!editMode)}
        onOpenLibrary={() => setLibraryOpen(true)}
        onResetLayout={resetLayout}
      />

      <DashboardGrid
        widgets={layout.widgets}
        widgetProps={widgetProps}
        editMode={editMode}
        onMove={moveWidget}
        onPin={pinWidget}
        onRemove={removeWidget}
      />

      <WidgetLibrary
        isOpen={libraryOpen}
        isDark={isDark}
        widgets={layout.widgets}
        gridFull={gridFull}
        onClose={() => setLibraryOpen(false)}
        onAdd={addWidget}
        onRemove={removeWidget}
      />
    </div>
  )
})
