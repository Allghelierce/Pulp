"use client"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { GRID_COLS, ROW_HEIGHT, GRID_GAP, GRID_PAD, getWidgetDef, type WidgetInstance, type WidgetProps } from "./widgetRegistry"
import { WidgetWrapper } from "./WidgetWrapper"

interface DashboardGridProps {
  widgets: WidgetInstance[]
  widgetProps: WidgetProps
  editMode: boolean
  onMove: (instanceId: string, pos: [number, number]) => void
  onPin: (instanceId: string) => void
  onRemove: (instanceId: string) => void
}

interface DragState {
  instanceId: string
  offsetX: number
  offsetY: number
  ghostX: number
  ghostY: number
  ghostW: number
  ghostH: number
  snapCol: number
  snapRow: number
  widgetSize: [number, number]
}

export const DashboardGrid = memo(function DashboardGrid({
  widgets, widgetProps, editMode, onMove, onPin, onRemove,
}: DashboardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [contentReady, setContentReady] = useState(false)
  const dragRef = useRef<DragState | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setContentReady(true))
    return () => { cancelAnimationFrame(id); setContentReady(false) }
  }, [])

  const getCellWidth = useCallback(() => {
    if (!gridRef.current) return 160
    return (gridRef.current.clientWidth - GRID_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
  }, [])

  const clampGrid = useCallback((col: number, row: number, size: [number, number]): [number, number] => {
    return [
      Math.max(0, Math.min(col, GRID_COLS - size[0])),
      Math.max(0, row),
    ]
  }, [])

  const posToGrid = useCallback((topLeftX: number, topLeftY: number, size: [number, number]): [number, number] => {
    if (!gridRef.current) return [0, 0]
    const rect = gridRef.current.getBoundingClientRect()
    const cw = getCellWidth()
    const x = topLeftX - rect.left - GRID_PAD
    const y = topLeftY - rect.top - GRID_PAD + gridRef.current.scrollTop
    const col = Math.round(x / (cw + GRID_GAP))
    const row = Math.round(y / (ROW_HEIGHT + GRID_GAP))
    return clampGrid(col, row, size)
  }, [getCellWidth, clampGrid])

  const handleDragStart = useCallback((instanceId: string, e: React.PointerEvent) => {
    if (!editMode || !gridRef.current) return
    e.preventDefault()
    const widget = widgets.find(w => w.instanceId === instanceId)
    if (!widget) return

    const el = (e.target as HTMLElement).closest('[data-widget-id]') as HTMLElement
    if (!el) return

    const elRect = el.getBoundingClientRect()

    const state: DragState = {
      instanceId,
      offsetX: e.clientX - elRect.left,
      offsetY: e.clientY - elRect.top,
      ghostX: elRect.left,
      ghostY: elRect.top,
      ghostW: elRect.width,
      ghostH: elRect.height,
      snapCol: widget.position[0],
      snapRow: widget.position[1],
      widgetSize: widget.size,
    }

    dragRef.current = state
    setDrag(state)

    const onPointerMove = (ev: PointerEvent) => {
      if (!dragRef.current || !gridRef.current) return
      const gx = ev.clientX - dragRef.current.offsetX
      const gy = ev.clientY - dragRef.current.offsetY
      const [col, row] = posToGrid(gx, gy, dragRef.current.widgetSize)

      const next = { ...dragRef.current, ghostX: gx, ghostY: gy, snapCol: col, snapRow: row }
      dragRef.current = next

      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => setDrag({ ...next }))
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      cancelAnimationFrame(rafRef.current)
      if (dragRef.current) {
        onMove(instanceId, [dragRef.current.snapCol, dragRef.current.snapRow])
      }
      dragRef.current = null
      setDrag(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }, [editMode, widgets, getCellWidth, posToGrid, onMove])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const maxRow = widgets.reduce((m, w) => Math.max(m, w.position[1] + w.size[1]), 0)
  const cw = getCellWidth()

  return (
    <div
      ref={gridRef}
      style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: GRID_PAD,
        position: 'relative',
        minHeight: (maxRow + 2) * (ROW_HEIGHT + GRID_GAP) + GRID_PAD,
      }}
    >
      <div style={{ position: 'relative', width: '100%', minHeight: maxRow * (ROW_HEIGHT + GRID_GAP) }}>
        {drag && (
          <div style={{
            position: 'absolute',
            left: drag.snapCol * (cw + GRID_GAP),
            top: drag.snapRow * (ROW_HEIGHT + GRID_GAP),
            width: drag.widgetSize[0] * cw + (drag.widgetSize[0] - 1) * GRID_GAP,
            height: drag.widgetSize[1] * ROW_HEIGHT + (drag.widgetSize[1] - 1) * GRID_GAP,
            borderRadius: 20,
            border: `2px dashed ${widgetProps.isDark ? 'rgba(217,119,6,0.5)' : 'rgba(217,119,6,0.4)'}`,
            background: widgetProps.isDark ? 'rgba(217,119,6,0.08)' : 'rgba(217,119,6,0.06)',
            transition: 'left 150ms ease, top 150ms ease',
            pointerEvents: 'none',
            zIndex: 5,
          }} />
        )}

        {widgets.map(widget => {
          const def = getWidgetDef(widget.widgetId)
          if (!def) return null
          const Component = def.component
          const isDragging = drag?.instanceId === widget.instanceId
          const left = widget.position[0] * (cw + GRID_GAP)
          const top = widget.position[1] * (ROW_HEIGHT + GRID_GAP)
          const width = widget.size[0] * cw + (widget.size[0] - 1) * GRID_GAP
          const height = widget.size[1] * ROW_HEIGHT + (widget.size[1] - 1) * GRID_GAP

          return (
            <div
              key={widget.instanceId}
              data-widget-id={widget.instanceId}
              style={{
                position: isDragging ? 'fixed' : 'absolute',
                left: isDragging ? drag.ghostX : left,
                top: isDragging ? drag.ghostY : top,
                width: isDragging ? drag.ghostW : width,
                height: isDragging ? drag.ghostH : height,
                zIndex: isDragging ? 100 : 1,
                opacity: isDragging ? 0.85 : 1,
                transform: isDragging ? 'scale(1.03)' : 'none',
                transition: isDragging ? 'none' : 'left 300ms ease, top 300ms ease, width 300ms ease, height 300ms ease, opacity 150ms ease',
                pointerEvents: isDragging ? 'none' : 'auto',
              }}
            >
              <WidgetWrapper
                isDark={widgetProps.isDark}
                pinned={widget.pinned}
                editMode={editMode}
                instanceId={widget.instanceId}
                onPin={() => onPin(widget.instanceId)}
                onRemove={() => onRemove(widget.instanceId)}
                onDragStart={handleDragStart}
              >
                {contentReady && <Component {...widgetProps} size={widget.size} />}
              </WidgetWrapper>
            </div>
          )
        })}
      </div>
    </div>
  )
})
