import { useState, useCallback, useRef, useEffect } from "react"
import { DEFAULT_LAYOUT, genInstanceId, GRID_COLS, MAX_ROWS, type DashboardLayout, type WidgetInstance } from "./widgetRegistry"
import { supabase } from "@/lib/supabase"
import * as db from "@/lib/db"

const STORAGE_KEY = "pulp-dashboard-layout"
const SUPABASE_DEBOUNCE = 2000

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

function saveLocal(layout: DashboardLayout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
}

// Widgets added after people already saved a layout get placed once, only into
// free space (never moving anything). Removing them afterwards sticks.
const SEEDED_KEY = "pulp-dashboard-seeded"
const SEED_WIDGETS: { widgetId: string; sizes: [number, number][] }[] = [
  { widgetId: 'week-forest', sizes: [[6, 1], [3, 1]] },
]

function freeSlot(size: [number, number], widgets: WidgetInstance[]): [number, number] | null {
  for (let row = 0; row <= MAX_ROWS - size[1]; row++) {
    for (let col = 0; col <= GRID_COLS - size[0]; col++) {
      const test: WidgetInstance = { instanceId: '', widgetId: '', pinned: false, size, position: [col, row] }
      if (!widgets.some(o => overlaps(test, o))) return [col, row]
    }
  }
  return null
}

function seedNewWidgets(layout: DashboardLayout): DashboardLayout {
  if (typeof window === "undefined") return layout
  try {
    const seeded: string[] = JSON.parse(localStorage.getItem(SEEDED_KEY) || '[]')
    let widgets = layout.widgets
    for (const { widgetId, sizes } of SEED_WIDGETS) {
      if (seeded.includes(widgetId)) continue
      seeded.push(widgetId)
      if (widgets.some(w => w.widgetId === widgetId)) continue
      for (const size of sizes) {
        const pos = freeSlot(size, widgets)
        if (pos) { widgets = [...widgets, { instanceId: genInstanceId(), widgetId, position: pos, size, pinned: false }]; break }
      }
    }
    localStorage.setItem(SEEDED_KEY, JSON.stringify(seeded))
    if (widgets === layout.widgets) return layout
    const next = { ...layout, widgets, lastModified: Date.now() }
    saveLocal(next)
    return next
  } catch { return layout }
}

function overlaps(a: WidgetInstance, b: WidgetInstance): boolean {
  return a.position[0] < b.position[0] + b.size[0] && a.position[0] + a.size[0] > b.position[0]
    && a.position[1] < b.position[1] + b.size[1] && a.position[1] + a.size[1] > b.position[1]
}

function findEmptySlot(widget: WidgetInstance, others: WidgetInstance[]): [number, number] {
  for (let row = 0; row <= MAX_ROWS - widget.size[1]; row++) {
    for (let col = 0; col <= GRID_COLS - widget.size[0]; col++) {
      const test = { ...widget, position: [col, row] as [number, number] }
      if (!others.some(o => overlaps(test, o))) return [col, row]
    }
  }
  return widget.position
}

function resolveCollisions(widgets: WidgetInstance[]): WidgetInstance[] {
  const sorted = widgets.map(w => ({ ...w, position: [...w.position] as [number, number], size: [...w.size] as [number, number] }))
    .sort((a, b) => a.position[1] - b.position[1] || a.position[0] - b.position[0])
  for (let iter = 0; iter < 30; iter++) {
    let moved = false
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i], b = sorted[j]
        if (overlaps(a, b)) {
          const pushRow = a.position[1] + a.size[1]
          if (pushRow + b.size[1] <= MAX_ROWS) {
            b.position = [b.position[0], pushRow]
          } else {
            const others = sorted.filter((_, k) => k !== j)
            b.position = findEmptySlot(b, others)
          }
          moved = true
        }
      }
    }
    if (!moved) break
  }
  return sorted
}

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

async function saveToSupabase(layout: DashboardLayout) {
  const uid = await getUserId()
  if (!uid) return
  db.upsertSettings(uid, { dashboard_layout: layout as unknown as Record<string, unknown> })
}

async function loadFromSupabase(): Promise<DashboardLayout | null> {
  const uid = await getUserId()
  if (!uid) return null
  const settings = await db.getSettings(uid)
  if (!settings?.dashboard_layout) return null
  const remote = settings.dashboard_layout as unknown as DashboardLayout
  if (remote.version === 1 && remote.widgets?.length) return remote
  return null
}

export function useWidgetLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(() => seedNewWidgets(loadLayout()))
  const [editMode, setEditMode] = useState(false)
  const [dragging, setDragging] = useState<{ instanceId: string; ghostPos: [number, number]; snapPos: [number, number] } | null>(null)
  const supabaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    loadFromSupabase().then(remote => {
      if (!remote) return
      const local = loadLayout()
      if (remote.lastModified > local.lastModified) {
        setLayout(remote)
        saveLocal(remote)
      }
    })
  }, [])

  const commitLayout = useCallback((next: DashboardLayout) => {
    const updated = { ...next, lastModified: Date.now() }
    setLayout(updated)
    saveLocal(updated)
    if (supabaseTimer.current) clearTimeout(supabaseTimer.current)
    supabaseTimer.current = setTimeout(() => saveToSupabase(updated), SUPABASE_DEBOUNCE)
  }, [])

  const moveWidget = useCallback((instanceId: string, newPos: [number, number]) => {
    setLayout(prev => {
      const moving = prev.widgets.find(w => w.instanceId === instanceId)
      if (!moving) return prev
      const col = Math.max(0, Math.min(newPos[0], GRID_COLS - moving.size[0]))
      const row = Math.max(0, Math.min(newPos[1], MAX_ROWS - moving.size[1]))
      const oldPos = moving.position
      const movedWidget = { ...moving, position: [col, row] as [number, number] }

      const hitWidgets = prev.widgets.filter(w => {
        if (w.instanceId === instanceId) return false
        return overlaps(movedWidget, { ...w })
      })

      const widgets = prev.widgets.map(w => {
        if (w.instanceId === instanceId) return movedWidget
        if (hitWidgets.some(h => h.instanceId === w.instanceId)) {
          return { ...w, position: [...oldPos] as [number, number] }
        }
        return w
      })

      const resolved = resolveCollisions(widgets)
      const next = { ...prev, widgets: resolved, lastModified: Date.now() }
      saveLocal(next)
      if (supabaseTimer.current) clearTimeout(supabaseTimer.current)
      supabaseTimer.current = setTimeout(() => saveToSupabase(next), SUPABASE_DEBOUNCE)
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
      saveLocal(next)
      if (supabaseTimer.current) clearTimeout(supabaseTimer.current)
      supabaseTimer.current = setTimeout(() => saveToSupabase(next), SUPABASE_DEBOUNCE)
      return next
    })
  }, [])

  const pinWidget = useCallback((instanceId: string) => {
    setLayout(prev => {
      const widgets = prev.widgets.map(w =>
        w.instanceId === instanceId ? { ...w, pinned: !w.pinned } : w
      )
      const next = { ...prev, widgets, lastModified: Date.now() }
      saveLocal(next)
      if (supabaseTimer.current) clearTimeout(supabaseTimer.current)
      supabaseTimer.current = setTimeout(() => saveToSupabase(next), SUPABASE_DEBOUNCE)
      return next
    })
  }, [])

  const gridFull = layout.widgets.reduce((m, w) => Math.max(m, w.position[1] + w.size[1]), 0) >= MAX_ROWS

  const addWidget = useCallback((widgetId: string, defaultSize: [number, number]) => {
    setLayout(prev => {
      const maxRow = prev.widgets.reduce((m, w) => Math.max(m, w.position[1] + w.size[1]), 0)
      if (maxRow + defaultSize[1] > MAX_ROWS) return prev
      const inst: WidgetInstance = {
        instanceId: genInstanceId(),
        widgetId,
        position: [0, maxRow],
        size: defaultSize,
        pinned: false,
      }
      const widgets = resolveCollisions([...prev.widgets, inst])
      const next = { ...prev, widgets, lastModified: Date.now() }
      saveLocal(next)
      if (supabaseTimer.current) clearTimeout(supabaseTimer.current)
      supabaseTimer.current = setTimeout(() => saveToSupabase(next), SUPABASE_DEBOUNCE)
      return next
    })
  }, [])

  const resetLayout = useCallback(() => {
    const next = {
      ...DEFAULT_LAYOUT,
      lastModified: Date.now(),
      widgets: DEFAULT_LAYOUT.widgets.map(w => ({ ...w, position: [...w.position] as [number, number], size: [...w.size] as [number, number] })),
    }
    setLayout(next)
    saveLocal(next)
    if (supabaseTimer.current) clearTimeout(supabaseTimer.current)
    supabaseTimer.current = setTimeout(() => saveToSupabase(next), SUPABASE_DEBOUNCE)
  }, [])

  const removeWidget = useCallback((instanceId: string) => {
    setLayout(prev => {
      const widgets = prev.widgets.filter(w => w.instanceId !== instanceId)
      const next = { ...prev, widgets, lastModified: Date.now() }
      saveLocal(next)
      if (supabaseTimer.current) clearTimeout(supabaseTimer.current)
      supabaseTimer.current = setTimeout(() => saveToSupabase(next), SUPABASE_DEBOUNCE)
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
    resetLayout,
    commitLayout,
    gridFull,
  }
}
