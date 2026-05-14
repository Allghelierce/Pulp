"use client"
import { memo, useCallback, useRef } from "react"
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

export const DashboardGrid = memo(function DashboardGrid({
  widgets, widgetProps, editMode, onMove, onPin, onRemove,
}: DashboardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    instanceId: string
    startX: number
    startY: number
    origPos: [number, number]
    el: HTMLElement | null
    ghost: HTMLDivElement | null
  } | null>(null)

  const cellW = useCallback(() => {
    if (!gridRef.current) return 160
    return (gridRef.current.clientWidth - GRID_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
  }, [])

  const posToGrid = useCallback((clientX: number, clientY: number): [number, number] => {
    if (!gridRef.current) return [0, 0]
    const rect = gridRef.current.getBoundingClientRect()
    const x = clientX - rect.left - GRID_PAD
    const y = clientY - rect.top - GRID_PAD + gridRef.current.scrollTop
    const cw = cellW()
    const col = Math.max(0, Math.min(GRID_COLS - 1, Math.round(x / (cw + GRID_GAP))))
    const row = Math.max(0, Math.round(y / (ROW_HEIGHT + GRID_GAP)))
    return [col, row]
  }, [cellW])

  const handleDragStart = useCallback((instanceId: string, e: React.PointerEvent) => {
    if (!editMode) return
    e.preventDefault()
    const widget = widgets.find(w => w.instanceId === instanceId)
    if (!widget) return

    const el = (e.target as HTMLElement).closest('[data-widget-id]') as HTMLElement
    if (!el) return

    const ghost = document.createElement('div')
    ghost.style.cssText = `
      position: fixed; pointer-events: none; z-index: 9999;
      width: ${el.offsetWidth}px; height: ${el.offsetHeight}px;
      border-radius: 20px; opacity: 0.7;
      background: ${widgetProps.isDark ? '#141210' : '#f5f3ef'};
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      transition: none;
    `
    ghost.style.left = `${e.clientX - el.offsetWidth / 2}px`
    ghost.style.top = `${e.clientY - el.offsetHeight / 2}px`
    document.body.appendChild(ghost)

    dragRef.current = {
      instanceId,
      startX: e.clientX,
      startY: e.clientY,
      origPos: widget.position,
      el,
      ghost,
    }

    el.style.opacity = '0.3'

    const onPointerMove = (ev: PointerEvent) => {
      if (!dragRef.current?.ghost) return
      dragRef.current.ghost.style.left = `${ev.clientX - el.offsetWidth / 2}px`
      dragRef.current.ghost.style.top = `${ev.clientY - el.offsetHeight / 2}px`
    }

    const onPointerUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      if (!dragRef.current) return

      const [col, row] = posToGrid(ev.clientX, ev.clientY)
      dragRef.current.ghost?.remove()
      if (dragRef.current.el) dragRef.current.el.style.opacity = '1'

      const w = widgets.find(w => w.instanceId === instanceId)
      const clampedCol = Math.min(col, GRID_COLS - (w?.size[0] ?? 1))
      onMove(instanceId, [clampedCol, row] as [number, number])
      dragRef.current = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }, [editMode, widgets, widgetProps.isDark, posToGrid, onMove, cellW])

  const maxRow = widgets.reduce((m, w) => Math.max(m, w.position[1] + w.size[1]), 0)
  const cw = cellW()

  return (
    <div
      ref={gridRef}
      style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: GRID_PAD,
        position: 'relative',
        minHeight: (maxRow + 1) * (ROW_HEIGHT + GRID_GAP) + GRID_PAD,
      }}
    >
      <div style={{ position: 'relative', width: '100%', minHeight: maxRow * (ROW_HEIGHT + GRID_GAP) }}>
        {widgets.map(widget => {
          const def = getWidgetDef(widget.widgetId)
          if (!def) return null
          const Component = def.component
          const left = widget.position[0] * (cw + GRID_GAP)
          const top = widget.position[1] * (ROW_HEIGHT + GRID_GAP)
          const width = widget.size[0] * cw + (widget.size[0] - 1) * GRID_GAP
          const height = widget.size[1] * ROW_HEIGHT + (widget.size[1] - 1) * GRID_GAP

          return (
            <div
              key={widget.instanceId}
              data-widget-id={widget.instanceId}
              style={{
                position: 'absolute',
                left, top, width, height,
                transition: editMode ? 'none' : 'left 300ms ease, top 300ms ease, width 300ms ease, height 300ms ease',
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
                <Component {...widgetProps} size={widget.size} />
              </WidgetWrapper>
            </div>
          )
        })}
      </div>
    </div>
  )
})
