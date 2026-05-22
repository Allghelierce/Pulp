"use client"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { GRID_COLS, ROW_HEIGHT, GRID_GAP, GRID_PAD, MAX_ROWS, getWidgetDef, type WidgetInstance, type WidgetProps } from "./widgetRegistry"
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
  const previewRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [dragSize, setDragSize] = useState<{ w: number; h: number } | null>(null)
  const [snapPos, setSnapPos] = useState<[number, number] | null>(null)

  const dragRef = useRef<{
    instanceId: string
    offsetX: number
    offsetY: number
    size: [number, number]
    snapCol: number
    snapRow: number
  } | null>(null)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      if (w) setGridWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const getCellWidth = useCallback(() => {
    const w = gridWidth || gridRef.current?.clientWidth || 960
    return (w - GRID_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
  }, [gridWidth])

  const clampGrid = useCallback((col: number, row: number, size: [number, number]): [number, number] => {
    return [
      Math.max(0, Math.min(col, GRID_COLS - size[0])),
      Math.max(0, Math.min(row, MAX_ROWS - size[1])),
    ]
  }, [])

  const handleDragStart = useCallback((instanceId: string, e: React.PointerEvent) => {
    if (!editMode || !gridRef.current) return
    e.preventDefault()
    const widget = widgets.find(w => w.instanceId === instanceId)
    if (!widget) return

    const el = (e.target as HTMLElement).closest('[data-widget-id]') as HTMLElement
    if (!el) return

    const elRect = el.getBoundingClientRect()
    const cw = getCellWidth()
    const w = widget.size[0] * cw + (widget.size[0] - 1) * GRID_GAP
    const h = widget.size[1] * ROW_HEIGHT + (widget.size[1] - 1) * GRID_GAP

    setDraggingId(instanceId)
    setDragPos({ x: elRect.left, y: elRect.top })
    setDragSize({ w, h })
    setSnapPos(widget.position)

    if (previewRef.current) {
      previewRef.current.style.display = 'block'
      previewRef.current.style.width = `${w}px`
      previewRef.current.style.height = `${h}px`
      previewRef.current.style.left = `${widget.position[0] * (cw + GRID_GAP)}px`
      previewRef.current.style.top = `${widget.position[1] * (ROW_HEIGHT + GRID_GAP)}px`
    }

    dragRef.current = {
      instanceId,
      offsetX: e.clientX - elRect.left,
      offsetY: e.clientY - elRect.top,
      snapCol: widget.position[0],
      snapRow: widget.position[1],
      size: widget.size,
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (!dragRef.current || !gridRef.current) return
      const d = dragRef.current
      const gx = ev.clientX - d.offsetX
      const gy = ev.clientY - d.offsetY

      setDragPos({ x: gx, y: gy })

      const rect = gridRef.current.getBoundingClientRect()
      const cw = getCellWidth()
      const ww = d.size[0] * cw + (d.size[0] - 1) * GRID_GAP
      const wh = d.size[1] * ROW_HEIGHT + (d.size[1] - 1) * GRID_GAP
      const cx = gx + ww / 2 - rect.left - GRID_PAD
      const cy = gy + wh / 2 - rect.top - GRID_PAD + gridRef.current.scrollTop
      const [col, row] = clampGrid(
        Math.round(cx / (cw + GRID_GAP) - d.size[0] / 2),
        Math.round(cy / (ROW_HEIGHT + GRID_GAP) - d.size[1] / 2),
        d.size
      )

      if (col !== d.snapCol || row !== d.snapRow) {
        d.snapCol = col
        d.snapRow = row
        setSnapPos([col, row])
        if (previewRef.current) {
          previewRef.current.style.left = `${col * (cw + GRID_GAP)}px`
          previewRef.current.style.top = `${row * (ROW_HEIGHT + GRID_GAP)}px`
        }
      }
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      if (!dragRef.current) return
      const d = dragRef.current

      if (previewRef.current) {
        previewRef.current.style.display = 'none'
      }

      onMove(d.instanceId, [d.snapCol, d.snapRow])
      setDraggingId(null)
      setDragPos(null)
      setDragSize(null)
      setSnapPos(null)
      dragRef.current = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }, [editMode, widgets, getCellWidth, clampGrid, onMove])

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
        <div
          ref={previewRef}
          style={{
            display: 'none',
            position: 'absolute',
            borderRadius: 20,
            border: `2px dashed ${widgetProps.isDark ? 'rgba(217,119,6,0.5)' : 'rgba(217,119,6,0.4)'}`,
            background: widgetProps.isDark ? 'rgba(217,119,6,0.08)' : 'rgba(217,119,6,0.06)',
            transition: 'left 150ms ease, top 150ms ease',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        {widgets.map(widget => {
          const def = getWidgetDef(widget.widgetId)
          if (!def) return null
          const Component = def.component
          const isDragging = widget.instanceId === draggingId
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
                zIndex: 1,
                transition: isDragging ? 'none' : 'left 300ms ease, top 300ms ease, width 300ms ease, height 300ms ease',
                opacity: isDragging ? 0.3 : 1,
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

      {/* Drag overlay — renders above everything */}
      {draggingId && dragPos && dragSize && (() => {
        const widget = widgets.find(w => w.instanceId === draggingId)
        if (!widget) return null
        const def = getWidgetDef(widget.widgetId)
        if (!def) return null
        const Component = def.component
        return (
          <div
            style={{
              position: 'fixed',
              left: dragPos.x,
              top: dragPos.y,
              width: dragSize.w,
              height: dragSize.h,
              zIndex: 9999,
              opacity: 0.9,
              transform: 'scale(1.03)',
              pointerEvents: 'none',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ width: '100%', height: '100%', background: widgetProps.isDark ? '#141210' : '#f5f3ef', borderRadius: 20, overflow: 'hidden' }}>
              <Component {...widgetProps} size={widget.size} />
            </div>
          </div>
        )
      })()}
    </div>
  )
})
