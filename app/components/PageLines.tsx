"use client"
import { memo, useEffect, useRef } from "react"
import type { HLine } from "@/app/types"

// Free-standing horizontal / vertical rules on a page (note.hlines).
// Drag and resize move the DOM directly and commit once on release, so a
// drag never re-renders the page. Selection is owned by useBoxDrawing so
// Delete / arrows / marquee keep working.

const HIT = 16       // grab zone thickness (px)
const MIN_LEN = 24   // shortest a line can be resized to

interface PageLinesProps {
  lines: HLine[]
  selectedIds: ReadonlySet<string>
  onSelect: (next: Set<string>) => void
  onCommit: (next: HLine[]) => void   // push undo + save
  zoom: number
  accent: string
  inkColor: string
}

type Drag =
  | { kind: "move"; ids: string[]; sx: number; sy: number; moved: boolean; dx: number; dy: number }
  | { kind: "resize"; id: string; end: "start" | "end"; sx: number; sy: number; orig: HLine; delta: number }

export const PageLines = memo(function PageLines({
  lines, selectedIds, onSelect, onCommit, zoom, accent, inkColor,
}: PageLinesProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const linesRef = useRef(lines)
  useEffect(() => { linesRef.current = lines }, [lines])

  const el = (id: string) => rootRef.current?.querySelector<HTMLElement>(`[data-hline="${id}"]`) ?? null

  const onLineDown = (e: React.PointerEvent, hl: HLine) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    let next = new Set(selectedIds)
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      if (next.has(hl.id)) next.delete(hl.id); else next.add(hl.id)
    } else if (!next.has(hl.id)) {
      next = new Set([hl.id])
    }
    onSelect(next)
    const ids = [...next].filter(id => linesRef.current.some(l => l.id === id))
    if (!ids.includes(hl.id)) return
    dragRef.current = { kind: "move", ids, sx: e.clientX, sy: e.clientY, moved: false, dx: 0, dy: 0 }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onHandleDown = (e: React.PointerEvent, hl: HLine, end: "start" | "end") => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    dragRef.current = { kind: "resize", id: hl.id, end, sx: e.clientX, sy: e.clientY, orig: hl, delta: 0 }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    let dx = (e.clientX - d.sx) / zoom
    let dy = (e.clientY - d.sy) / zoom
    if (d.kind === "move") {
      if (!d.moved && Math.hypot(dx, dy) < 2) return
      d.moved = true
      if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0 }
      d.dx = dx; d.dy = dy
      for (const id of d.ids) {
        const node = el(id)
        if (node) node.style.transform = `translate(${dx}px, ${dy}px)`
      }
      return
    }
    // Resize along the line's own axis only.
    const vertical = d.orig.direction === "vertical"
    const along = vertical ? dy : dx
    const maxShrink = d.orig.width - MIN_LEN
    const delta = d.end === "start" ? Math.min(along, maxShrink) : Math.max(along, -maxShrink)
    d.delta = delta
    const node = el(d.id)
    if (!node) return
    const pos = d.end === "start" ? (vertical ? d.orig.y : d.orig.x) + delta : (vertical ? d.orig.y : d.orig.x)
    const len = d.end === "start" ? d.orig.width - delta : d.orig.width + delta
    if (vertical) { node.style.top = `${pos}px`; node.style.height = `${len}px` }
    else { node.style.left = `${pos}px`; node.style.width = `${len}px` }
  }

  const onPointerUp = () => {
    const d = dragRef.current
    dragRef.current = null
    if (!d) return
    if (d.kind === "move") {
      for (const id of d.ids) { const node = el(id); if (node) node.style.transform = "" }
      if (!d.moved) return
      const ids = new Set(d.ids)
      onCommit(linesRef.current.map(l => ids.has(l.id) ? { ...l, x: Math.round(l.x + d.dx), y: Math.round(l.y + d.dy) } : l))
      return
    }
    if (d.delta === 0) return
    const vertical = d.orig.direction === "vertical"
    onCommit(linesRef.current.map(l => {
      if (l.id !== d.id) return l
      if (d.end === "end") return { ...l, width: Math.round(l.width + d.delta) }
      return vertical
        ? { ...l, y: Math.round(l.y + d.delta), width: Math.round(l.width - d.delta) }
        : { ...l, x: Math.round(l.x + d.delta), width: Math.round(l.width - d.delta) }
    }))
  }

  const handle = (hl: HLine, end: "start" | "end", vertical: boolean) => (
    <div
      onPointerDown={e => onHandleDown(e, hl, end)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute", width: 12, height: 12, borderRadius: "50%", background: accent, border: "2px solid #fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)", touchAction: "none",
        cursor: vertical ? "ns-resize" : "ew-resize",
        ...(vertical
          ? { left: "50%", marginLeft: -6, [end === "start" ? "top" : "bottom"]: -6 }
          : { top: "50%", marginTop: -6, [end === "start" ? "left" : "right"]: -6 }),
      }}
    />
  )

  return (
    <div ref={rootRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20 }}>
      {lines.map(hl => {
        const selected = selectedIds.has(hl.id)
        const vertical = hl.direction === "vertical"
        const color = selected ? accent : inkColor
        return (
          <div
            key={hl.id}
            data-hline={hl.id}
            className="pulp-hline"
            onPointerDown={e => onLineDown(e, hl)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              position: "absolute", pointerEvents: "auto", touchAction: "none", cursor: "move",
              ...(vertical
                ? { left: hl.x - HIT / 2, top: hl.y, width: HIT, height: hl.width }
                : { left: hl.x, top: hl.y - HIT / 2, width: hl.width, height: HIT }),
            }}
          >
            {selected && (
              <div style={{ position: "absolute", inset: vertical ? "-4px 2px" : "2px -4px", borderRadius: 6, background: `${accent}14`, border: `1px solid ${accent}55` }} />
            )}
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible", filter: vertical ? "url(#hand-rule-v)" : "url(#hand-rule)" }}>
              {vertical
                ? <line x1="50%" y1="0" x2="50%" y2="100%" stroke={color} strokeWidth={selected ? 2.4 : 1.8} strokeLinecap="round" />
                : <line x1="0" y1="50%" x2="100%" y2="50%" stroke={color} strokeWidth={selected ? 2.4 : 1.8} strokeLinecap="round" />}
            </svg>
            {selected && <>{handle(hl, "start", vertical)}{handle(hl, "end", vertical)}</>}
          </div>
        )
      })}
      <style>{`.pulp-hline:hover line { stroke: ${accent}; }`}</style>
    </div>
  )
})
