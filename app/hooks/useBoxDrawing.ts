"use client"
import { useState, useRef, useEffect } from "react"
import { uid } from "@/app/lib/uid"
import type { TextBox, NoteData } from "@/app/types"

interface UseBoxDrawingOptions {
  activeTabId: string | null
  currentPageIdx: number
  zoom: string
  setNotes: React.Dispatch<React.SetStateAction<NoteData[]>>
  paperRef: React.RefObject<HTMLDivElement | null>
  sketchMode: boolean
  sketchPrompt: string
  setSketchMode: (v: boolean) => void
  setSketchPrompt: (v: string) => void
}

export function useBoxDrawing({
  activeTabId, currentPageIdx, zoom, setNotes, paperRef,
  sketchMode, sketchPrompt, setSketchMode, setSketchPrompt,
}: UseBoxDrawingOptions) {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [loadingBoxId, setLoadingBoxId] = useState<string | null>(null)

  // Stable refs so DOM handlers never have stale closures
  const zoomRef = useRef(zoom)
  const activeTabIdRef = useRef(activeTabId)
  const currentPageIdxRef = useRef(currentPageIdx)
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { activeTabIdRef.current = activeTabId }, [activeTabId])
  useEffect(() => { currentPageIdxRef.current = currentPageIdx }, [currentPageIdx])

  const updateBoxes = (fn: (boxes: TextBox[]) => TextBox[]) =>
    setNotes(prev => prev.map(n => n.id !== activeTabIdRef.current ? n : {
      ...n, boxes: { ...n.boxes, [currentPageIdxRef.current]: fn(n.boxes[currentPageIdxRef.current] || []) }
    }))

  // Drag / resize state - mutated directly, no re-renders during move
  const dragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null)
  const resizeRef = useRef<{ id: string; handle: string; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number } | null>(null)

  const s = () => parseFloat(zoomRef.current)
  const el = (id: string) => document.getElementById(`box-${id}`)

  // Stable handler refs - close only over other refs, so always fresh
  const handleMove = useRef((e: MouseEvent) => {
    if (dragRef.current) {
      const { id, sx, sy, ox, oy } = dragRef.current
      const node = el(id)
      if (node) { node.style.left = (ox + (e.clientX - sx) / s()) + 'px'; node.style.top = (oy + (e.clientY - sy) / s()) + 'px' }
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

    if (dragRef.current) {
      const { id, sx, sy, ox, oy } = dragRef.current
      const x = ox + (e.clientX - sx) / scale, y = oy + (e.clientY - sy) / scale
      commit(bs => bs.map(b => b.id === id ? { ...b, x, y } : b))
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
    setSelectedBoxId(box.id)
    dragRef.current = { id: box.id, sx: e.clientX, sy: e.clientY, ox: box.x, oy: box.y }
    addListeners()
  }

  const startResize = (e: React.MouseEvent, box: TextBox, handle: string) => {
    e.preventDefault(); e.stopPropagation()
    resizeRef.current = { id: box.id, handle, sx: e.clientX, sy: e.clientY, ox: box.x, oy: box.y, ow: box.w, oh: box.h }
    addListeners()
  }

  // Click anywhere on paper → create box
  const onPaperMouseDown = (e: React.MouseEvent) => {
    if (!paperRef.current) return
    pruneEmpty()
    setSelectedBoxId(null)
    const r = paperRef.current.getBoundingClientRect()
    const scale = s()
    const x = (e.clientX - r.left) / scale
    const y = (e.clientY - r.top) / scale
    const id = uid()
    const newBox: TextBox = { id, x: x - 8, y: y - 8, w: 260, h: 80, content: '' }
    updateBoxes(bs => [...bs, newBox])
    requestAnimationFrame(() => {
      document.getElementById(`box-${id}`)?.querySelector<HTMLTextAreaElement>('textarea')?.focus()
    })
    if (sketchMode) {
      const prompt = sketchPrompt
      requestAnimationFrame(() => generateSketch(prompt, id))
      setSketchMode(false); setSketchPrompt('')
    }
  }

  const deleteBox = (id: string) => { updateBoxes(bs => bs.filter(b => b.id !== id)); setSelectedBoxId(null) }
  const updateBoxContent = (id: string, text: string) => updateBoxes(bs => bs.map(b => b.id === id ? { ...b, content: text } : b))

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

  const selectBox = (id: string) => { pruneEmpty(); setSelectedBoxId(id) }

  return { selectedBoxId, setSelectedBoxId, selectBox, loadingBoxId, onPaperMouseDown, startDrag, startResize, deleteBox, updateBoxContent }
}
