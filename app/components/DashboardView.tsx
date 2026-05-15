"use client"
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { Tree, Achievement, NoteData } from "@/app/types"
import { loadDailyStats, type DailyEntry } from "@/app/lib/dailyStats"
import { DashboardToolbar } from "./dashboard/DashboardToolbar"
import { DashboardGrid } from "./dashboard/DashboardGrid"
import { WidgetLibrary } from "./dashboard/WidgetLibrary"
import { useWidgetLayout } from "./dashboard/useWidgetLayout"
import type { WidgetProps } from "./dashboard/widgetRegistry"

import "./dashboard/widgets/registerAll"

export interface DashboardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  xp: number
  grove: Tree[]
  inventory: string[]
  activeNotebookId?: string
  activeNotebookName?: string
  achievements: Achievement[]
  notes: NoteData[]
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
}: DashboardViewProps) {
  const isDark = theme === 'dark'
  const [dailyStats, setDailyStats] = useState<DailyEntry[]>([])
  const [goals] = useState(loadGoals)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const {
    layout, editMode, setEditMode,
    moveWidget, pinWidget, addWidget, removeWidget,
  } = useWidgetLayout()

  useEffect(() => {
    if (!isOpen) return
    setDailyStats(loadDailyStats())
    requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)))
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => { window.removeEventListener("keydown", handler); setMounted(false) }
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
  }), [isDark, dailyStats, grove, xp, goals, inventory, activeNotebookId, activeNotebookName, achievements, notes])

  if (!isOpen) return null

  const bg = isDark ? '#0e0c09' : '#ede6d8'

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
    }}>
      <DashboardToolbar
        isDark={isDark}
        editMode={editMode}
        onClose={onClose}
        onToggleEdit={() => setEditMode(!editMode)}
        onOpenLibrary={() => setLibraryOpen(true)}
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
        onClose={() => setLibraryOpen(false)}
        onAdd={addWidget}
        onRemove={removeWidget}
      />
    </div>
  )
})
