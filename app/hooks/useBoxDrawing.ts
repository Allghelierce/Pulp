"use client"
import { useState } from "react"
import { uid } from "@/app/lib/uid"
import type { TextBox, NoteData } from "@/app/types"

interface UseBoxDrawingOptions {
  activeTabId: string | null
  currentPageIdx: number
  zoom: string
  setNotes: React.Dispatch<React.SetStateAction<NoteData[]>>
  paperRef: React.RefObject<HTMLDivElement | null>
  boxMode: boolean
  sketchMode: boolean
  sketchPrompt: string
  setSketchMode: (v: boolean) => void
  setBoxMode: (v: boolean) => void
  setSketchPrompt: (v: string) => void
}

export function useBoxDrawing({
  activeTabId, currentPageIdx, zoom, setNotes, paperRef,
  boxMode, sketchMode, sketchPrompt, setSketchMode, setBoxMode, setSketchPrompt,
}: UseBoxDrawingOptions) {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [draftBox, setDraftBox] = useState<TextBox | null>(null)
  const [draggingBox, setDraggingBox] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [loadingBoxId, setLoadingBoxId] = useState<string | null>(null)

  const updateBoxes = (fn: (boxes: TextBox[]) => TextBox[]) =>
    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
      ...n, boxes: { ...n.boxes, [currentPageIdx]: fn(n.boxes[currentPageIdx] || []) }
    }))

  const getPaperXY = (e: React.MouseEvent) => {
    const r = paperRef.current!.getBoundingClientRect()
    const s = parseFloat(zoom)
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }
  }

  const generateSketch = async (prompt: string, boxId: string) => {
    if (!prompt.trim() || !activeTabId) return
    setLoadingBoxId(boxId)
    try {
      const res = await fetch("/api/sketch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt.trim() }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.url) { console.warn("No image URL returned from /api/sketch", data); return }
      updateBoxes(boxes => boxes.map(b => b.id === boxId ? { ...b, content: data.url } : b))
    } catch (err) {
      console.error("Sketch generation failed:", err)
    } finally {
      setLoadingBoxId(null)
    }
  }

  const onPaperMouseDown = (e: React.MouseEvent) => {
    if (!boxMode) return
    e.preventDefault()
    const { x, y } = getPaperXY(e)
    setDrawStart({ x, y })
    setDraftBox({ id: uid(), x, y, w: 0, h: 0, content: "" })
    setSelectedBoxId(null)
  }

  const onPaperMouseMove = (e: React.MouseEvent) => {
    if (draggingBox) {
      const { x, y } = getPaperXY(e)
      updateBoxes(boxes => boxes.map(b => b.id === draggingBox.id ? { ...b, x: x - draggingBox.offsetX, y: y - draggingBox.offsetY } : b))
      return
    }
    if (!boxMode || !drawStart) return
    const { x, y } = getPaperXY(e)
    setDraftBox({ id: draftBox?.id ?? uid(), x: drawStart.x, y: drawStart.y, w: x - drawStart.x, h: y - drawStart.y, content: "" })
  }

  const onPaperMouseUp = () => {
    if (draggingBox) { setDraggingBox(null); return }
    if (!boxMode || !draftBox) return
    if (Math.abs(draftBox.w) > 15 && Math.abs(draftBox.h) > 15) {
      const committed = { ...draftBox, id: uid() }
      updateBoxes(boxes => [...boxes, committed])
      setSelectedBoxId(committed.id)
      if (sketchMode) {
        requestAnimationFrame(() => generateSketch(sketchPrompt, committed.id))
        setSketchMode(false); setBoxMode(false); setSketchPrompt("")
      }
    }
    setDrawStart(null); setDraftBox(null)
  }

  const deleteBox = (boxId: string) => {
    updateBoxes(boxes => boxes.filter(b => b.id !== boxId))
    setSelectedBoxId(null)
  }

  const updateBoxContent = (boxId: string, text: string) =>
    updateBoxes(boxes => boxes.map(b => b.id === boxId ? { ...b, content: text } : b))

  const onBoxMouseDown = (e: React.MouseEvent<HTMLDivElement>, box: TextBox) => {
    if ((e.target as HTMLElement).tagName === "BUTTON") return
    const rect = e.currentTarget.getBoundingClientRect()
    if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) return
    e.stopPropagation()
    setSelectedBoxId(box.id)
    e.currentTarget.focus()
    if (boxMode || e.target === e.currentTarget) {
      const { x, y } = getPaperXY(e)
      setDraggingBox({ id: box.id, offsetX: x - box.x, offsetY: y - box.y })
    }
  }

  const makeBoxResizeHandler = (box: TextBox) => (e: React.MouseEvent) => {
    if (!paperRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const paperRect = paperRef.current.getBoundingClientRect()
    const s = parseFloat(zoom)
    const newX = (rect.left - paperRect.left) / s
    const newY = (rect.top - paperRect.top) / s
    const newW = rect.width / s
    const newH = rect.height / s
    if (Math.abs(box.w - newW) > 1 || Math.abs(box.h - newH) > 1 || Math.abs(box.x - newX) > 1 || Math.abs(box.y - newY) > 1)
      updateBoxes(boxes => boxes.map(b => b.id === box.id ? { ...b, x: newX, y: newY, w: newW, h: newH } : b))
  }

  return {
    selectedBoxId, setSelectedBoxId, draftBox, draggingBox, loadingBoxId,
    onPaperMouseDown, onPaperMouseMove, onPaperMouseUp,
    onBoxMouseDown, makeBoxResizeHandler, deleteBox, updateBoxContent,
  }
}
