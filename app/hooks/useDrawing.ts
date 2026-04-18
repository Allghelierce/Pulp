"use client"
import { useRef, useEffect, useMemo, useCallback, useState } from "react"
import { NoteData, DrawingPath } from "@/app/types"

export function useDrawing({
  canvasRef,
  activeTool,
  accent,
  zoom,
  currentPageIdx,
  setNotes,
  activeTabId,
  notes,
  strokeColor,
  fillColor,
  lineWidth,
  opacity,
  dash,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  activeTool: string
  accent: string
  zoom: string
  currentPageIdx: number
  setNotes: React.Dispatch<React.SetStateAction<NoteData[]>>
  activeTabId: string | null
  notes: NoteData[]
  strokeColor: string
  fillColor: string
  lineWidth: number
  opacity: number
  dash: boolean
}) {
  const drawing = useRef(false)
  const currentPath = useRef<{ x: number; y: number }[]>([])
  const activeTabIdRef = useRef(activeTabId)
  const currentPageIdxRef = useRef(currentPageIdx)
  const notesRef = useRef(notes)
  const undoStack = useRef<DrawingPath[][]>([])
  const redoStack = useRef<DrawingPath[][]>([])
  const [undoCount, setUndoCount] = useState(0)
  const [redoCount, setRedoCount] = useState(0)

  useEffect(() => { activeTabIdRef.current = activeTabId }, [activeTabId])
  useEffect(() => { currentPageIdxRef.current = currentPageIdx }, [currentPageIdx])
  useEffect(() => {
    notesRef.current = notes
    render()
  }, [notes, currentPageIdx, activeTabId])

  const dprRef = useRef(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const sync = () => {
      const parent = c.parentElement
      if (!parent) return
      const w = parent.offsetWidth
      const h = parent.offsetHeight
      if (w && h) {
        const dpr = window.devicePixelRatio || 1
        dprRef.current = dpr
        c.width = w * dpr
        c.height = h * dpr
        c.style.width = w + 'px'
        c.style.height = h + 'px'
        const cx = c.getContext('2d')
        if (cx) cx.scale(dpr, dpr)
        render()
      }
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(c.parentElement || c)
    return () => ro.disconnect()
  }, [canvasRef])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!
    const rect = c.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (c.width / rect.width / dprRef.current), y: (e.clientY - rect.top) * (c.height / rect.height / dprRef.current) }
  }

  const ctx = () => canvasRef.current?.getContext('2d') ?? null

  const getCurrentDrawings = (): DrawingPath[] => {
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    const note = notesRef.current.find(n => n.id === tid)
    return note?.drawings?.[pidx] || []
  }

  const pushUndo = () => {
    undoStack.current.push([...getCurrentDrawings()])
    redoStack.current = []
    setUndoCount(undoStack.current.length)
    setRedoCount(0)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current
    if (!c) return
    e.preventDefault()
    drawing.current = true
    c.setPointerCapture(e.pointerId)
    const pos = getPos(e)
    currentPath.current = [pos]
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const pos = getPos(e)
    currentPath.current.push(pos)
    render()
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    drawing.current = false
    canvasRef.current?.releasePointerCapture(e.pointerId)

    if (currentPath.current.length < 2 && activeTool !== 'eraser' && !['rect', 'circle', 'diamond', 'arrow', 'line'].includes(activeTool)) return

    pushUndo()

    const isHighlighter = activeTool === 'highlighter'
    const newStroke: DrawingPath = {
      id: Math.random().toString(36).substr(2, 9),
      tool: isHighlighter ? 'pen' : activeTool,
      color: activeTool === 'eraser' ? '#000000' : strokeColor,
      fill: activeTool === 'eraser' ? undefined : (fillColor !== 'transparent' ? fillColor : undefined),
      opacity: activeTool === 'eraser' ? 1 : (isHighlighter ? 0.35 : opacity),
      dash: activeTool === 'eraser' ? false : dash,
      width: activeTool === 'eraser' ? 16 : (isHighlighter ? lineWidth * 2.5 : lineWidth),
      points: [...currentPath.current]
    }

    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current

    setNotes(prev => prev.map(n => {
      if (n.id !== tid) return n
      const drawings = n.drawings || {}
      const pageDrawings = drawings[pidx] || []
      return { ...n, drawings: { ...drawings, [pidx]: [...pageDrawings, newStroke] } }
    }))

    currentPath.current = []
    render()
  }

  const render = () => {
    const c = canvasRef.current
    const cx = ctx()
    if (!c || !cx) return

    const dpr = dprRef.current
    cx.setTransform(dpr, 0, 0, dpr, 0, 0)
    cx.clearRect(0, 0, c.width, c.height)

    const drawPath = (path: DrawingPath) => {
      if (!path.points || path.points.length < 2) return

      cx.save()
      cx.globalAlpha = path.opacity ?? 1
      cx.strokeStyle = path.color
      cx.lineWidth = path.width
      cx.lineCap = 'round'
      cx.lineJoin = 'round'

      if (path.dash) {
        cx.setLineDash([path.width * 3, path.width * 2])
      } else {
        cx.setLineDash([])
      }

      const hasFill = path.fill && path.fill !== 'transparent'
      cx.fillStyle = hasFill ? path.fill! : `${path.color}1a`

      if (path.tool === 'eraser') cx.globalCompositeOperation = 'destination-out'
      else cx.globalCompositeOperation = 'source-over'

      const pts = path.points
      const start = pts[0]
      const end = pts[pts.length - 1]
      const dx = end.x - start.x
      const dy = end.y - start.y

      cx.beginPath()
      switch (path.tool) {
        case 'pen':
        case 'eraser':
          cx.moveTo(pts[0].x, pts[0].y)
          for (let i = 1; i < pts.length; i++) {
            cx.lineTo(pts[i].x, pts[i].y)
          }
          cx.stroke()
          break
        case 'rect':
          cx.rect(start.x, start.y, dx, dy)
          if (hasFill) cx.fill()
          cx.stroke()
          break
        case 'circle':
          if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
            cx.ellipse(start.x + dx/2, start.y + dy/2, Math.abs(dx/2), Math.abs(dy/2), 0, 0, Math.PI*2)
            if (hasFill) cx.fill()
            cx.stroke()
          }
          break
        case 'diamond': {
          const mx = start.x + dx/2, my = start.y + dy/2
          cx.moveTo(mx, start.y); cx.lineTo(start.x + dx, my)
          cx.lineTo(mx, start.y + dy); cx.lineTo(start.x, my)
          cx.closePath()
          if (hasFill) cx.fill()
          cx.stroke()
          break
        }
        case 'line':
          cx.moveTo(start.x, start.y); cx.lineTo(end.x, end.y); cx.stroke()
          break
        case 'arrow': {
          cx.moveTo(start.x, start.y); cx.lineTo(end.x, end.y); cx.stroke()
          const angle = Math.atan2(dy, dx)
          const hl = Math.max(8, path.width * 3)
          cx.beginPath()
          cx.moveTo(end.x, end.y)
          cx.lineTo(end.x - hl * Math.cos(angle - Math.PI/6), end.y - hl * Math.sin(angle - Math.PI/6))
          cx.moveTo(end.x, end.y)
          cx.lineTo(end.x - hl * Math.cos(angle + Math.PI/6), end.y - hl * Math.sin(angle + Math.PI/6))
          cx.stroke()
          break
        }
      }
      cx.restore()
    }

    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    const currentNote = notesRef.current.find(n => n.id === tid)

    if (currentNote?.drawings?.[pidx]) {
      currentNote.drawings[pidx].forEach(drawPath)
    }

    if (drawing.current && currentPath.current.length > 0) {
      const isHighlighter = activeTool === 'highlighter'
      drawPath({
        id: '_live',
        tool: isHighlighter ? 'pen' : activeTool,
        color: activeTool === 'eraser' ? '#000000' : strokeColor,
        fill: activeTool === 'eraser' ? undefined : (fillColor !== 'transparent' ? fillColor : undefined),
        opacity: activeTool === 'eraser' ? 1 : (isHighlighter ? 0.35 : opacity),
        dash: activeTool === 'eraser' ? false : dash,
        width: activeTool === 'eraser' ? 16 : (isHighlighter ? lineWidth * 2.5 : lineWidth),
        points: currentPath.current
      })
    }
  }

  const clearCanvas = useCallback(() => {
    pushUndo()
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    setNotes(prev => prev.map(n => n.id === tid ? { ...n, drawings: { ...(n.drawings || {}), [pidx]: [] } } : n))
  }, [setNotes])

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    redoStack.current.push([...getCurrentDrawings()])
    const prev = undoStack.current.pop()!
    setNotes(p => p.map(n => n.id === tid ? { ...n, drawings: { ...(n.drawings || {}), [pidx]: prev } } : n))
    setUndoCount(undoStack.current.length)
    setRedoCount(redoStack.current.length)
  }, [setNotes])

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    undoStack.current.push([...getCurrentDrawings()])
    const next = redoStack.current.pop()!
    setNotes(p => p.map(n => n.id === tid ? { ...n, drawings: { ...(n.drawings || {}), [pidx]: next } } : n))
    setUndoCount(undoStack.current.length)
    setRedoCount(redoStack.current.length)
  }, [setNotes])

  const getCursor = () => {
    switch (activeTool) {
      case 'eraser': return 'cell'
      case 'highlighter': return 'crosshair'
      case 'pen': case 'rect': case 'circle': case 'diamond': case 'arrow': case 'line': return 'crosshair'
      default: return 'default'
    }
  }

  const smoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 4) return points
    const smoothed: { x: number; y: number }[] = []
    const tension = 0.5
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]
      for (let t = 0; t < 1; t += 0.25) {
        const t2 = t * t, t3 = t2 * t
        const v0 = (p2.x - p0.x) * tension, v1 = (p3.x - p1.x) * tension
        const x = p1.x + v0 * t + (3 * (p2.x - p1.x) - 2 * v0 - v1) * t2 + (2 * (p1.x - p2.x) + v0 + v1) * t3
        const v0y = (p2.y - p0.y) * tension, v1y = (p3.y - p1.y) * tension
        const y = p1.y + v0y * t + (3 * (p2.y - p1.y) - 2 * v0y - v1y) * t2 + (2 * (p1.y - p2.y) + v0y + v1y) * t3
        smoothed.push({ x, y })
      }
    }
    smoothed.push(points[points.length - 1])
    return smoothed
  }

  const improveDrawing = useCallback(() => {
    pushUndo()
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    setNotes(prev => prev.map(n => {
      if (n.id !== tid) return n
      const drawings = n.drawings || {}
      const pageDrawings = drawings[pidx] || []
      const improved = pageDrawings.map(stroke => {
        if (['pen', 'eraser'].includes(stroke.tool) && stroke.points.length > 3) {
          return { ...stroke, points: smoothPath(stroke.points) }
        }
        return stroke
      })
      return { ...n, drawings: { ...drawings, [pidx]: improved } }
    }))
    render()
  }, [setNotes])

  // Keyboard shortcut for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === 'z' && !e.shiftKey) {
        const el = document.activeElement as HTMLElement | null
        if (el?.isContentEditable || el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA') return
        e.preventDefault()
        undo()
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        const el = document.activeElement as HTMLElement | null
        if (el?.isContentEditable || el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA') return
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  return useMemo(() => ({
    onPointerDown, onPointerMove, onPointerUp,
    clearCanvas, getCursor, improveDrawing,
    undo, redo, canUndo: undoCount > 0, canRedo: redoCount > 0,
  }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTool, accent, zoom, strokeColor, fillColor, lineWidth, opacity, dash, clearCanvas, improveDrawing, undo, redo, undoCount, redoCount])
}
