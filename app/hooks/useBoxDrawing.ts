"use client"
import { useState, useRef, useEffect } from "react"
import { uid } from "@/app/lib/uid"
import type { TextBox, NoteData } from "@/app/types"

interface UseBoxDrawingOptions {
  activeTabId: string | null
  currentPageIdx: number
  zoom: string
  notes: NoteData[]
  setNotes: React.Dispatch<React.SetStateAction<NoteData[]>>
  paperRef: React.RefObject<HTMLDivElement | null>
  sketchMode: boolean
  sketchPrompt: string
  setSketchMode: (v: boolean) => void
  setSketchPrompt: (v: string) => void
}

export function useBoxDrawing({
  activeTabId, currentPageIdx, zoom, notes, setNotes, paperRef,
  sketchMode, sketchPrompt, setSketchMode, setSketchPrompt,
}: UseBoxDrawingOptions) {
  const [selectedBoxIds, setSelectedBoxIds] = useState<Set<string>>(new Set())
  const [loadingBoxId, setLoadingBoxId] = useState<string | null>(null)

  // Stable refs so DOM handlers never have stale closures
  const zoomRef = useRef(zoom)
  const activeTabIdRef = useRef(activeTabId)
  const currentPageIdxRef = useRef(currentPageIdx)
  const notesRef = useRef(notes)
  const sketchRef = useRef({ sketchMode, sketchPrompt })
  const selectedBoxIdsRef = useRef<Set<string>>(new Set())
  // Page attaches its selection rect div to this ref for zero-React-state drag updates
  const selectionRectRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { activeTabIdRef.current = activeTabId }, [activeTabId])
  useEffect(() => { currentPageIdxRef.current = currentPageIdx }, [currentPageIdx])
  useEffect(() => { notesRef.current = notes }, [notes])
  useEffect(() => { sketchRef.current = { sketchMode, sketchPrompt } }, [sketchMode, sketchPrompt])
  useEffect(() => { selectedBoxIdsRef.current = selectedBoxIds }, [selectedBoxIds])

  // Delete key — remove all selected boxes when not typing in a textarea/input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) return
      const ids = selectedBoxIdsRef.current
      if (ids.size === 0) return
      e.preventDefault()
      const toDelete = Array.from(ids)
      const tid = activeTabIdRef.current
      const pidx = currentPageIdxRef.current
      setNotes(prev => prev.map(n => n.id !== tid ? n : {
        ...n, boxes: { ...n.boxes, [pidx]: (n.boxes[pidx] || []).filter(b => !toDelete.includes(b.id)) }
      }))
      setSelectedBoxIds(new Set())
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setNotes])

  const updateBoxes = (fn: (boxes: TextBox[]) => TextBox[]) =>
    setNotes(prev => prev.map(n => n.id !== activeTabIdRef.current ? n : {
      ...n, boxes: { ...n.boxes, [currentPageIdxRef.current]: fn(n.boxes[currentPageIdxRef.current] || []) }
    }))

  const dragRef = useRef<{ ids: string[]; sx: number; sy: number; originalBoxes: Record<string, {x: number, y: number}> } | null>(null)
  const resizeRef = useRef<{ id: string; handle: string; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number } | null>(null)
  const selectionRef = useRef<{ sx: number; sy: number; active: boolean; pendingSelected: Set<string> } | null>(null)

  const s = () => parseFloat(zoomRef.current)
  const el = (id: string) => document.getElementById(`box-${id}`)

  const handleMove = useRef((e: MouseEvent) => {
    if (selectionRef.current) {
      const { sx, sy } = selectionRef.current
      const dx = e.clientX - sx
      const dy = e.clientY - sy

      if (!selectionRef.current.active && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        selectionRef.current.active = true
        if (selectionRectRef.current) selectionRectRef.current.style.display = 'block'
      }

      if (selectionRef.current.active) {
        const paper = paperRef.current?.getBoundingClientRect()
        if (paper) {
          const scale = s()
          const x1 = Math.min(sx, e.clientX)
          const y1 = Math.min(sy, e.clientY)
          const x2 = Math.max(sx, e.clientX)
          const y2 = Math.max(sy, e.clientY)

          const rectX = (x1 - paper.left) / scale
          const rectY = (y1 - paper.top) / scale
          const rectW = (x2 - x1) / scale
          const rectH = (y2 - y1) / scale

          // Direct DOM — no React state update per frame
          if (selectionRectRef.current) {
            const rs = selectionRectRef.current.style
            rs.left = rectX + 'px'; rs.top = rectY + 'px'
            rs.width = rectW + 'px'; rs.height = rectH + 'px'
          }

          // Highlight intersecting boxes via direct DOM
          const tid = activeTabIdRef.current
          const pidx = currentPageIdxRef.current
          const currentTab = notesRef.current.find(n => n.id === tid)
          const newPending = new Set<string>()
          if (currentTab) {
            for (const b of (currentTab.boxes[pidx] || [])) {
              const hit = b.x < rectX + rectW && b.x + b.w > rectX &&
                          b.y < rectY + rectH && b.y + b.h > rectY
              const node = el(b.id)
              if (node) node.style.outline = hit ? '1px solid rgba(10,132,255,0.5)' : ''
              if (hit) newPending.add(b.id)
            }
          }
          selectionRef.current.pendingSelected = newPending
        }
      }
      return
    }

    if (dragRef.current) {
      const { ids, sx, sy, originalBoxes } = dragRef.current
      ids.forEach(id => {
        const node = el(id)
        const orig = originalBoxes[id]
        if (node && orig) {
          node.style.left = (orig.x + (e.clientX - sx) / s()) + 'px'
          node.style.top = (orig.y + (e.clientY - sy) / s()) + 'px'
        }
      })
    }
    if (resizeRef.current) {
      const { id, handle, sx, sy, ox, oy, ow, oh } = resizeRef.current
      const dx = (e.clientX - sx) / s(), dy = (e.clientY - sy) / s()
      let x = ox, y = oy, w = ow, h = oh
      if (handle.includes('e')) w = Math.max(80, ow + dx)
      if (handle.includes('s')) h = Math.max(40, oh + dy)
      if (handle.includes('w')) { x = ox + dx; w = Math.max(80, ow - dx) }
      if (handle.includes('n')) { y = oy + dy; h = Math.max(40, oh - dy) }
      const node = el(id)
      if (node) { node.style.left = x + 'px'; node.style.top = y + 'px'; node.style.width = w + 'px'; node.style.height = h + 'px' }
    }
  })

  const handleUp = useRef((e: MouseEvent) => {
    const scale = s()
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    const commit = (fn: (boxes: TextBox[]) => TextBox[]) =>
      setNotes(prev => prev.map(n => n.id !== tid ? n : { ...n, boxes: { ...n.boxes, [pidx]: fn(n.boxes[pidx] || []) } }))

    if (selectionRef.current) {
      const { sx, sy, active, pendingSelected } = selectionRef.current

      // Clear direct DOM outlines — React will re-render with correct borders
      const currentTab = notesRef.current.find(n => n.id === tid)
      for (const b of (currentTab?.boxes[pidx] || [])) {
        const node = el(b.id)
        if (node) node.style.outline = ''
      }

      if (!active) {
        // Plain click — create a new box
        const r = paperRef.current?.getBoundingClientRect()
        if (r) {
          const x = (sx - r.left) / scale
          const y = (sy - r.top) / scale
          const id = uid()
          const newBox: TextBox = { id, x: x - 8, y: y - 8, w: 260, h: 80, content: '' }
          commit(bs => [...bs, newBox])
          setSelectedBoxIds(new Set([id]))
          requestAnimationFrame(() => {
            document.getElementById(`box-${id}`)?.querySelector<HTMLTextAreaElement>('textarea')?.focus()
          })
          const { sketchMode, sketchPrompt } = sketchRef.current
          if (sketchMode) {
            requestAnimationFrame(() => generateSketch(sketchPrompt, id))
            setSketchMode(false); setSketchPrompt('')
          }
        }
      } else {
        // Commit final selection in one React state update
        setSelectedBoxIds(pendingSelected)
      }

      if (selectionRectRef.current) selectionRectRef.current.style.display = 'none'
      selectionRef.current = null
    }

    if (dragRef.current) {
      const { ids, sx, sy, originalBoxes } = dragRef.current
      const dx = (e.clientX - sx) / scale
      const dy = (e.clientY - sy) / scale
      commit(bs => bs.map(b => ids.includes(b.id) ? { ...b, x: originalBoxes[b.id].x + dx, y: originalBoxes[b.id].y + dy } : b))
      dragRef.current = null
    }
    if (resizeRef.current) {
      const { id, handle, sx, sy, ox, oy, ow, oh } = resizeRef.current
      const dx = (e.clientX - sx) / scale, dy = (e.clientY - sy) / scale
      let x = ox, y = oy, w = ow, h = oh
      if (handle.includes('e')) w = Math.max(80, ow + dx)
      if (handle.includes('s')) h = Math.max(40, oh + dy)
      if (handle.includes('w')) { x = ox + dx; w = Math.max(80, ow - dx) }
      if (handle.includes('n')) { y = oy + dy; h = Math.max(40, oh - dy) }
      commit(bs => bs.map(b => b.id === id ? { ...b, x, y, w, h } : b))
      resizeRef.current = null
    }
    document.removeEventListener('mousemove', handleMove.current)
    document.removeEventListener('mouseup', handleUp.current)
  })

  const addListeners = () => {
    document.addEventListener('mousemove', handleMove.current)
    document.addEventListener('mouseup', handleUp.current)
  }

  const pruneEmpty = () => updateBoxes(bs => bs.filter(b => b.content.trim() !== ''))

  const startDrag = (e: React.MouseEvent, box: TextBox) => {
    e.preventDefault(); e.stopPropagation()
    pruneEmpty()

    let draggingIds = Array.from(selectedBoxIds)
    if (!selectedBoxIds.has(box.id)) {
      setSelectedBoxIds(new Set([box.id]))
      draggingIds = [box.id]
    }

    const originalBoxes: Record<string, {x: number, y: number}> = {}
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    const currentTab = notesRef.current.find(n => n.id === tid)
    if (currentTab) {
      const currentBoxes = currentTab.boxes[pidx] || []
      draggingIds.forEach(id => {
        const b = currentBoxes.find(bz => bz.id === id)
        if (b) originalBoxes[id] = { x: b.x, y: b.y }
      })
    }

    dragRef.current = { ids: draggingIds, sx: e.clientX, sy: e.clientY, originalBoxes }
    addListeners()
  }

  const startResize = (e: React.MouseEvent, box: TextBox, handle: string) => {
    e.preventDefault(); e.stopPropagation()
    resizeRef.current = { id: box.id, handle, sx: e.clientX, sy: e.clientY, ox: box.x, oy: box.y, ow: box.w, oh: box.h }
    addListeners()
  }

  const onPaperMouseDown = (e: React.MouseEvent) => {
    if (!paperRef.current) return
    pruneEmpty()
    setSelectedBoxIds(new Set())
    selectionRef.current = { sx: e.clientX, sy: e.clientY, active: false, pendingSelected: new Set() }
    addListeners()
  }

  const deleteBox = (id: string) => {
    updateBoxes(bs => bs.filter(b => b.id !== id))
    setSelectedBoxIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }
  const updateBoxContent = (id: string, text: string) => updateBoxes(bs => bs.map(b => b.id === id ? { ...b, content: text } : b))

  const autoAlign = () => {
    updateBoxes(bs => {
      if (bs.length === 0) return bs
      const sorted = [...bs].sort((a, b) => a.y - b.y)
      const rows: TextBox[][] = []
      let currentRow: TextBox[] = [sorted[0]]

      for (let i = 1; i < sorted.length; i++) {
        const box = sorted[i]
        const rowAvgY = currentRow.reduce((sum, b) => sum + b.y, 0) / currentRow.length
        if (box.y < rowAvgY + 60) {
          currentRow.push(box)
        } else {
          rows.push(currentRow)
          currentRow = [box]
        }
      }
      rows.push(currentRow)

      let currentY = Math.max(sorted[0].y, 60)
      const standardMarginX = 90
      const newBoxes: TextBox[] = []
      for (const row of rows) {
        row.sort((a, b) => a.x - b.x)
        let currentX = standardMarginX
        let maxH = 0
        for (const rowBox of row) {
          newBoxes.push({ ...rowBox, x: currentX, y: currentY })
          currentX += rowBox.w + 40
          maxH = Math.max(maxH, rowBox.h)
        }
        currentY += maxH + 32
      }
      return newBoxes
    })
  }

  const generateSketch = async (prompt: string, boxId: string) => {
    if (!prompt.trim() || !activeTabIdRef.current) return
    setLoadingBoxId(boxId)
    try {
      const res = await fetch('/api/sketch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt.trim() }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.url) { console.warn('No image URL', data); return }
      updateBoxes(bs => bs.map(b => b.id === boxId ? { ...b, content: data.url } : b))
    } catch (err) {
      console.error('Sketch failed:', err)
    } finally {
      setLoadingBoxId(null)
    }
  }

  const selectBox = (id: string) => { pruneEmpty(); setSelectedBoxIds(new Set([id])) }

  return { selectedBoxIds, setSelectedBoxIds, selectBox, selectionRectRef, loadingBoxId, onPaperMouseDown, startDrag, startResize, deleteBox, updateBoxContent, autoAlign }
}
