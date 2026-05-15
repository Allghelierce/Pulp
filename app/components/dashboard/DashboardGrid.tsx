"use client"
import { memo, useCallback, useEffect, useRef } from "react"
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
  const previewRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    instanceId: string
    el: HTMLElement
    offsetX: number
    offsetY: number
    snapCol: number
    snapRow: number
    size: [number, number]
  } | null>(null)

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

  const handleDragStart = useCallback((instanceId: string, e: React.PointerEvent) => {
    if (!editMode || !gridRef.current) return
    e.preventDefault()
    const widget = widgets.find(w => w.instanceId === instanceId)
    if (!widget) return

    const el = (e.target as HTMLElement).closest('[data-widget-id]') as HTMLElement
    if (!el) return

    const elRect = el.getBoundingClientRect()
    const cw = getCellWidth()

    el.style.position = 'fixed'
    el.style.left = `${elRect.left}px`
    el.style.top = `${elRect.top}px`
    el.style.width = `${elRect.width}px`
    el.style.height = `${elRect.height}px`
    el.style.zIndex = '100'
    el.style.opacity = '0.85'
    el.style.transform = 'scale(1.03)'
    el.style.transition = 'none'
    el.style.pointerEvents = 'none'

    if (previewRef.current) {
      const pw = widget.size[0] * cw + (widget.size[0] - 1) * GRID_GAP
      const ph = widget.size[1] * ROW_HEIGHT + (widget.size[1] - 1) * GRID_GAP
      previewRef.current.style.display = 'block'
      previewRef.current.style.width = `${pw}px`
      previewRef.current.style.height = `${ph}px`
      previewRef.current.style.left = `${widget.position[0] * (cw + GRID_GAP)}px`
      previewRef.current.style.top = `${widget.position[1] * (ROW_HEIGHT + GRID_GAP)}px`
    }

    dragRef.current = {
      instanceId,
      el,
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

      d.el.style.left = `${gx}px`
      d.el.style.top = `${gy}px`

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

      d.el.style.position = ''
      d.el.style.left = ''
      d.el.style.top = ''
      d.el.style.width = ''
      d.el.style.height = ''
      d.el.style.zIndex = ''
      d.el.style.opacity = ''
      d.el.style.transform = ''
      d.el.style.transition = ''
      d.el.style.pointerEvents = ''

      if (previewRef.current) {
        previewRef.current.style.display = 'none'
      }

      onMove(instanceId, [d.snapCol, d.snapRow])
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
                transition: 'left 300ms ease, top 300ms ease, width 300ms ease, height 300ms ease',
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
