import { useState, useCallback, useRef, useEffect } from "react"
import { DEFAULT_LAYOUT, genInstanceId, GRID_COLS, type DashboardLayout, type WidgetInstance } from "./widgetRegistry"

const STORAGE_KEY = "pulp-dashboard-layout"

function loadLayout(): DashboardLayout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardLayout
      if (parsed.version === 1 && parsed.widgets?.length) return parsed
    }
  } catch {}
  return DEFAULT_LAYOUT
}

function saveLayout(layout: DashboardLayout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
}

function resolveCollisions(widgets: WidgetInstance[]): WidgetInstance[] {
  const sorted = [...widgets].sort((a, b) => a.position[1] - b.position[1] || a.position[0] - b.position[0])
  for (let iter = 0; iter < 30; iter++) {
    let moved = false
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i], b = sorted[j]
        const overlapX = a.position[0] < b.position[0] + b.size[0] && a.position[0] + a.size[0] > b.position[0]
        const overlapY = a.position[1] < b.position[1] + b.size[1] && a.position[1] + a.size[1] > b.position[1]
        if (overlapX && overlapY) {
          b.position = [b.position[0], a.position[1] + a.size[1]]
          moved = true
        }
      }
    }
    if (!moved) break
  }
  return sorted
}

export function useWidgetLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(loadLayout)
  const [editMode, setEditMode] = useState(false)
  const [dragging, setDragging] = useState<{ instanceId: string; ghostPos: [number, number]; snapPos: [number, number] } | null>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((next: DashboardLayout) => {
    const updated = { ...next, lastModified: Date.now() }
    setLayout(updated)
    saveLayout(updated)
  }, [])

  const moveWidget = useCallback((instanceId: string, newPos: [number, number]) => {
    setLayout(prev => {
      const widgets = prev.widgets.map(w =>
        w.instanceId === instanceId ? { ...w, position: [Math.max(0, Math.min(newPos[0], GRID_COLS - w.size[0])), Math.max(0, newPos[1])] as [number, number] } : w
      )
      const resolved = resolveCollisions(widgets)
      const next = { ...prev, widgets: resolved, lastModified: Date.now() }
      saveLayout(next)
      return next
    })
  }, [])

  const resizeWidget = useCallback((instanceId: string, newSize: [number, number]) => {
    setLayout(prev => {
      const widgets = prev.widgets.map(w =>
        w.instanceId === instanceId ? { ...w, size: newSize } : w
      )
      const resolved = resolveCollisions(widgets)
      const next = { ...prev, widgets: resolved, lastModified: Date.now() }
      saveLayout(next)
      return next
    })
  }, [])

  const pinWidget = useCallback((instanceId: string) => {
    setLayout(prev => {
      const widgets = prev.widgets.map(w =>
        w.instanceId === instanceId ? { ...w, pinned: !w.pinned } : w
      )
      const next = { ...prev, widgets, lastModified: Date.now() }
      saveLayout(next)
      return next
    })
  }, [])

  const addWidget = useCallback((widgetId: string, defaultSize: [number, number]) => {
    setLayout(prev => {
      const maxRow = prev.widgets.reduce((m, w) => Math.max(m, w.position[1] + w.size[1]), 0)
      const inst: WidgetInstance = {
        instanceId: genInstanceId(),
        widgetId,
        position: [0, maxRow],
        size: defaultSize,
        pinned: false,
      }
      const widgets = resolveCollisions([...prev.widgets, inst])
      const next = { ...prev, widgets, lastModified: Date.now() }
      saveLayout(next)
      return next
    })
  }, [])

  const removeWidget = useCallback((instanceId: string) => {
    setLayout(prev => {
      const widgets = prev.widgets.filter(w => w.instanceId !== instanceId)
      const next = { ...prev, widgets, lastModified: Date.now() }
      saveLayout(next)
      return next
    })
  }, [])

  return {
    layout,
    editMode,
    setEditMode,
    dragging,
    setDragging,
    moveWidget,
    resizeWidget,
    pinWidget,
    addWidget,
    removeWidget,
    persist,
  }
}
