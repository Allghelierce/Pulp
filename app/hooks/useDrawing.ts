"use client"
import { useRef, useEffect, useMemo } from "react"
import { NoteData } from "@/app/types"

export function useDrawing({
  canvasRef,
  activeTool,
  accent,
  zoom,
  currentPageIdx,
  setNotes,
  activeTabId,
  notes,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  activeTool: string
  accent: string
  zoom: string
  currentPageIdx: number
  setNotes: React.Dispatch<React.SetStateAction<NoteData[]>>
  activeTabId: string | null
  notes: NoteData[]
}) {
  const drawing = useRef(false)
  const currentPath = useRef<{ x: number; y: number }[]>([])
  const activeTabIdRef = useRef(activeTabId)
  const currentPageIdxRef = useRef(currentPageIdx)
  const notesRef = useRef(notes)

  useEffect(() => { activeTabIdRef.current = activeTabId }, [activeTabId])
  useEffect(() => { currentPageIdxRef.current = currentPageIdx }, [currentPageIdx])
  useEffect(() => { 
    notesRef.current = notes
    render()
  }, [notes, currentPageIdx, activeTabId])

  // Keep canvas dimensions in sync with paper size
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const sync = () => {
      if (c.offsetWidth && c.offsetHeight) {
        const prev = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
        c.width = c.offsetWidth
        c.height = c.offsetHeight
        c.getContext('2d')!.putImageData(prev, 0, 0)
      }
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(c)
    return () => ro.disconnect()
  }, [canvasRef])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scale = parseFloat(zoom)
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
  }

  const ctx = () => canvasRef.current?.getContext('2d') ?? null
  const solid = () => accent.length > 7 ? accent.slice(0, 7) : accent

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

    const newStroke = {
      id: Math.random().toString(36).substr(2, 9),
      tool: activeTool,
      color: solid(),
      width: activeTool === 'pen' ? 2 : activeTool === 'eraser' ? 24 : 1.5,
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

    cx.clearRect(0, 0, c.width, c.height)

    // Helper to draw a path
    const drawPath = (path: any) => {
      if (!path.points || path.points.length < 2) return
      cx.beginPath()
      cx.strokeStyle = path.color
      cx.fillStyle = `${path.color}1a`
      cx.lineWidth = path.width
      cx.lineCap = 'round'
      cx.lineJoin = 'round'

      if (path.tool === 'eraser') cx.globalCompositeOperation = 'destination-out'
      else cx.globalCompositeOperation = 'source-over'

      const pts = path.points
      const start = pts[0]
      const end = pts[pts.length - 1]
      const dx = end.x - start.x
      const dy = end.y - start.y

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
          cx.fill(); cx.stroke()
          break
        case 'circle':
          cx.ellipse(start.x + dx/2, start.y + dy/2, Math.abs(dx/2), Math.abs(dy/2), 0, 0, Math.PI*2)
          cx.fill(); cx.stroke()
          break
        case 'diamond': {
          const mx = start.x + dx/2, my = start.y + dy/2
          cx.moveTo(mx, start.y); cx.lineTo(start.x + dx, my)
          cx.lineTo(mx, start.y + dy); cx.lineTo(start.x, my)
          cx.closePath(); cx.fill(); cx.stroke()
          break
        }
        case 'line':
          cx.moveTo(start.x, start.y); cx.lineTo(end.x, end.y); cx.stroke()
          break
        case 'arrow': {
          cx.moveTo(start.x, start.y); cx.lineTo(end.x, end.y); cx.stroke()
          const angle = Math.atan2(dy, dx)
          const hl = 14
          cx.beginPath()
          cx.moveTo(end.x, end.y)
          cx.lineTo(end.x - hl * Math.cos(angle - Math.PI/6), end.y - hl * Math.sin(angle - Math.PI/6))
          cx.moveTo(end.x, end.y)
          cx.lineTo(end.x - hl * Math.cos(angle + Math.PI/6), end.y - hl * Math.sin(angle + Math.PI/6))
          cx.stroke()
          break
        }
      }
    }

    // Draw historical paths
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    const currentNote = notesRef.current.find(n => n.id === tid)
    
    if (currentNote?.drawings?.[pidx]) {
      currentNote.drawings[pidx].forEach(drawPath)
    }

    // Draw active path
    if (drawing.current) {
      drawPath({
        tool: activeTool,
        color: solid(),
        width: activeTool === 'pen' ? 2 : activeTool === 'eraser' ? 24 : 1.5,
        points: currentPath.current
      })
    }
  }

  const clearCanvas = () => {
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    setNotes(prev => prev.map(n => n.id === tid ? { ...n, drawings: { ...(n.drawings || {}), [pidx]: [] } } : n))
  }

  const getCursor = () => {
    switch (activeTool) {
      case 'eraser': return 'cell'
      case 'pen': case 'rect': case 'circle': case 'diamond': case 'arrow': case 'line': return 'crosshair'
      default: return 'default'
    }
  }

  return useMemo(() => ({ onPointerDown, onPointerMove, onPointerUp, clearCanvas, getCursor }), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTool, accent, zoom])
}
