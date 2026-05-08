"use client"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { flushSync } from "react-dom"
import { uid } from "@/app/lib/uid"
import type { TextBox, NoteData, HLine } from "@/app/types"
import { apiFetch } from "@/lib/apiFetch"

interface UseBoxDrawingOptions {
  activeTabId: string | null
  currentPageIdx: number
  zoom: string
  accent: string
  notes: NoteData[]
  setNotes: (updater: NoteData[] | ((prev: NoteData[]) => NoteData[])) => void
  paperRef: React.RefObject<HTMLDivElement | null>
  sketchMode: boolean
  sketchPrompt: string
  setSketchMode: (v: boolean) => void
  setSketchPrompt: (v: string) => void
  drawLineMode: boolean
  setDrawLineMode: (v: boolean) => void
  activeTool: string
  setActiveTool: (v: string) => void
  stickyColor: string
  onError?: (title: string, message: string) => void
  drawingUndo?: () => void
  drawingRedo?: () => void
  drawingCanUndo?: boolean
  drawingCanRedo?: boolean
}

export function useBoxDrawing({
  activeTabId, currentPageIdx, zoom, accent, notes, setNotes, paperRef,
  sketchMode, sketchPrompt, setSketchMode, setSketchPrompt, drawLineMode, setDrawLineMode,
  activeTool, setActiveTool, stickyColor, onError,
  drawingUndo, drawingRedo, drawingCanUndo, drawingCanRedo
}: UseBoxDrawingOptions) {
  // Selection is only in a ref. A cheap counter triggers box-list re-renders.
  const selectedBoxIdsRef = useRef<Set<string>>(new Set())
  const selectedDrawingIdsRef = useRef<Set<string>>(new Set())
  const [selectionVersion, setSelectionVersion] = useState(0)
  const selectedLineRef = useRef<number | null>(null)
  const [lineSelectionVersion, setLineSelectionVersion] = useState(0)
  const selectedHLineIdRef = useRef<string | null>(null)
  const [hlineSelectionVersion, setHlineSelectionVersion] = useState(0)
  const hlineDragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const [loadingBoxId, setLoadingBoxId] = useState<string | null>(null)
  const aligningRef = useRef(false)
  const undoStackRef = useRef<{ tabId: string; pageIdx: number; boxes: TextBox[]; drawings?: unknown[] }[]>([])
  const redoStackRef = useRef<{ tabId: string; pageIdx: number; boxes: TextBox[]; drawings?: unknown[] }[]>([])
  const drawingUndoRef = useRef(drawingUndo)
  const drawingRedoRef = useRef(drawingRedo)
  const drawingCanUndoRef = useRef(drawingCanUndo)
  const drawingCanRedoRef = useRef(drawingCanRedo)

  // Stable refs so DOM handlers never have stale closures
  const zoomRef = useRef(zoom)
  const activeTabIdRef = useRef(activeTabId)
  const currentPageIdxRef = useRef(currentPageIdx)
  const notesRef = useRef(notes)
  const sketchRef = useRef({ sketchMode, sketchPrompt, drawLineMode, activeTool, stickyColor })
  const accentRef = useRef(accent)
  // Page attaches its selection rect div to this ref for zero-React-state drag updates
  const selectionRectRef = useRef<HTMLDivElement | null>(null)
  const rafId = useRef<number>(0)

  // Update ref + bump version counter (cheap number, not a new Set object in state)
  const setSelectedBoxIds = useCallback((v: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (typeof v === 'function') {
      selectedBoxIdsRef.current = v(selectedBoxIdsRef.current)
    } else {
      selectedBoxIdsRef.current = v
    }
    setSelectionVersion(c => c + 1)
  }, [])

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { accentRef.current = accent }, [accent])
  useEffect(() => { drawingUndoRef.current = drawingUndo }, [drawingUndo])
  useEffect(() => { drawingRedoRef.current = drawingRedo }, [drawingRedo])
  useEffect(() => { drawingCanUndoRef.current = drawingCanUndo }, [drawingCanUndo])
  useEffect(() => { drawingCanRedoRef.current = drawingCanRedo }, [drawingCanRedo])
  useEffect(() => {
    activeTabIdRef.current = activeTabId
    setSelectedBoxIds(new Set())
    selectedDrawingIdsRef.current = new Set()
  }, [activeTabId, setSelectedBoxIds])

  useEffect(() => {
    currentPageIdxRef.current = currentPageIdx
    setSelectedBoxIds(new Set())
    selectedDrawingIdsRef.current = new Set()
  }, [currentPageIdx, setSelectedBoxIds])
  useEffect(() => { notesRef.current = notes }, [notes])
  useEffect(() => { sketchRef.current = { sketchMode, sketchPrompt, drawLineMode, activeTool, stickyColor } }, [sketchMode, sketchPrompt, drawLineMode, activeTool, stickyColor])

  // Keyboard shortcuts — delete selected boxes/lines, select all
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) return

      // Ctrl/Cmd+A — select all boxes on current page
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current
        const allIds = new Set((notesRef.current.find(n => n.id === tid)?.boxes[pidx] || []).map(b => b.id))
        if (allIds.size === 0) return
        e.preventDefault()
        setSelectedBoxIds(allIds)
        return
      }

      // Undo — restore previous box/drawing state, then fall through to drawing undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const stack = undoStackRef.current
        if (stack.length > 0) {
          const snap = stack.pop()!
          const tid = activeTabIdRef.current
          const pidx = currentPageIdxRef.current
          const note = notesRef.current.find(n => n.id === snap.tabId)
          if (note) {
            redoStackRef.current.push({
              tabId: snap.tabId, pageIdx: snap.pageIdx,
              boxes: [...(note.boxes[snap.pageIdx] || [])],
              drawings: note.drawings?.[snap.pageIdx] ? [...note.drawings[snap.pageIdx]] : undefined,
            })
          }
          setNotes(prev => prev.map(n => {
            if (n.id !== snap.tabId) return n
            const restored: Partial<NoteData> = { boxes: { ...n.boxes, [snap.pageIdx]: snap.boxes } }
            if (snap.drawings) restored.drawings = { ...(n.drawings || {}), [snap.pageIdx]: snap.drawings } as NoteData['drawings']
            return { ...n, ...restored }
          }))
        } else if (drawingCanUndoRef.current) {
          drawingUndoRef.current?.()
        }
        return
      }

      // Redo — Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault()
        const stack = redoStackRef.current
        if (stack.length > 0) {
          const snap = stack.pop()!
          const note = notesRef.current.find(n => n.id === snap.tabId)
          if (note) {
            undoStackRef.current.push({
              tabId: snap.tabId, pageIdx: snap.pageIdx,
              boxes: [...(note.boxes[snap.pageIdx] || [])],
              drawings: note.drawings?.[snap.pageIdx] ? [...note.drawings[snap.pageIdx]] : undefined,
            })
          }
          setNotes(prev => prev.map(n => {
            if (n.id !== snap.tabId) return n
            const restored: Partial<NoteData> = { boxes: { ...n.boxes, [snap.pageIdx]: snap.boxes } }
            if (snap.drawings) restored.drawings = { ...(n.drawings || {}), [snap.pageIdx]: snap.drawings } as NoteData['drawings']
            return { ...n, ...restored }
          }))
        } else if (drawingCanRedoRef.current) {
          drawingRedoRef.current?.()
        }
        return
      }

      // Arrow keys — nudge selected boxes; Option+Arrow — snap to page edge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const ids = selectedBoxIdsRef.current
        if (ids.size === 0) return
        e.preventDefault()
        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current

        const scale = parseFloat(zoomRef.current) || 1
        const pageW = Math.round((paperRef.current?.offsetWidth ?? 800) / scale)
        const pageH = 1100

        if (e.altKey) {
          const padX = 32
          const padY = 24
          const marginLineX = 112
          const noteLines = notesRef.current.find(n => n.id === tid)?.lines?.[pidx] || []
          const leftEdge = noteLines.length > 0 ? Math.min(...noteLines) + padX : marginLineX + padX
          setNotes(prev => prev.map(n => {
            if (n.id !== tid) return n
            const boxes = (n.boxes[pidx] || []).map(b => {
              if (!ids.has(b.id)) return b
              const maxX = Math.max(leftEdge, pageW - b.w - padX)
              const maxY = Math.max(padY, pageH - b.h - padY)
              const newX = e.key === 'ArrowLeft' ? leftEdge : e.key === 'ArrowRight' ? maxX : b.x
              const newY = e.key === 'ArrowUp' ? padY : e.key === 'ArrowDown' ? maxY : b.y
              return { ...b, x: newX, y: newY }
            })
            return { ...n, boxes: { ...n.boxes, [pidx]: boxes } }
          }))
        } else {
          const step = e.shiftKey ? 40 : 15
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
          setNotes(prev => prev.map(n => {
            if (n.id !== tid) return n
            const boxes = (n.boxes[pidx] || []).map(b => {
              if (!ids.has(b.id)) return b
              const newX = Math.min(Math.max(0, pageW - b.w), Math.max(0, b.x + dx))
              const newY = Math.min(Math.max(0, pageH - b.h), Math.max(0, b.y + dy))
              return { ...b, x: newX, y: newY }
            })
            return { ...n, boxes: { ...n.boxes, [pidx]: boxes } }
          }))
        }
        return
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return

      // Delete selected hline
      if (selectedHLineIdRef.current !== null) {
        e.preventDefault()
        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current
        const hid = selectedHLineIdRef.current
        setNotes(prev => prev.map(n => n.id !== tid ? n : {
          ...n, hlines: { ...(n.hlines || {}), [pidx]: (n.hlines?.[pidx] || []).filter(h => h.id !== hid) }
        }))
        selectedHLineIdRef.current = null
        setHlineSelectionVersion(c => c + 1)
        return
      }

      // Delete selected line
      if (selectedLineRef.current !== null) {
        e.preventDefault()
        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current
        const lineX = selectedLineRef.current
        setNotes(prev => prev.map(n => n.id !== tid ? n : {
          ...n, lines: { ...n.lines, [pidx]: (n.lines?.[pidx] || []).filter(x => x !== lineX) }
        }))
        selectedLineRef.current = null
        setLineSelectionVersion(c => c + 1)
        return
      }

      // Delete selected boxes and drawings
      const ids = selectedBoxIdsRef.current
      const drawIds = selectedDrawingIdsRef.current
      if (ids.size === 0 && drawIds.size === 0) return
      e.preventDefault()
      const toDelete = Array.from(ids)
      const toDeleteDrawings = Array.from(drawIds)
      const tid = activeTabIdRef.current
      const pidx = currentPageIdxRef.current
      const note = notesRef.current.find(n => n.id === tid)
      if (note) {
        undoStackRef.current.push({
          tabId: tid!,
          pageIdx: pidx,
          boxes: [...(note.boxes[pidx] || [])],
          drawings: note.drawings?.[pidx] ? [...note.drawings[pidx]] : undefined,
        })
        if (undoStackRef.current.length > 50) undoStackRef.current.shift()
      }
      setNotes(prev => prev.map(n => {
        if (n.id !== tid) return n
        const updated: Partial<NoteData> = {}
        if (toDelete.length > 0) {
          updated.boxes = { ...n.boxes, [pidx]: (n.boxes[pidx] || []).filter(b => !toDelete.includes(b.id)) }
        }
        if (toDeleteDrawings.length > 0) {
          const drawings = n.drawings || {}
          updated.drawings = { ...drawings, [pidx]: (drawings[pidx] || []).filter(d => !toDeleteDrawings.includes(d.id)) }
        }
        return { ...n, ...updated }
      }))
      setSelectedBoxIds(new Set())
      selectedDrawingIdsRef.current = new Set()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [setNotes, setSelectedBoxIds])

  const updateBoxes = useCallback((fn: (boxes: TextBox[]) => TextBox[]) =>
    setNotes(prev => prev.map(n => n.id !== activeTabIdRef.current ? n : {
      ...n, boxes: { ...n.boxes, [currentPageIdxRef.current]: fn(n.boxes[currentPageIdxRef.current] || []) }
    })), [setNotes])

  const dragRef = useRef<{ ids: string[]; sx: number; sy: number; originalBoxes: Record<string, { x: number, y: number }>; elements: Record<string, HTMLElement> } | null>(null)
  const resizeRef = useRef<{ id: string; handle: string; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number; element: HTMLElement | null } | null>(null)
  const selectionRef = useRef<{ sx: number; sy: number; active: boolean; pendingSelected: Set<string>; cachedBoxes: TextBox[] } | null>(null)

  const s = useCallback(() => parseFloat(zoomRef.current), [])
  const el = useCallback((id: string) => document.getElementById(`box-${id}`), [])

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

          if (selectionRectRef.current) {
            const rs = selectionRectRef.current.style
            rs.left = rectX + 'px'; rs.top = rectY + 'px'
            rs.width = rectW + 'px'; rs.height = rectH + 'px'
          }

          cancelAnimationFrame(rafId.current)
          rafId.current = requestAnimationFrame(() => {
            if (!selectionRef.current) return
            const boxesToCheck = selectionRef.current.cachedBoxes
            const newPending = new Set<string>()
            const solid = accentRef.current.length > 7 ? accentRef.current.slice(0, 7) : accentRef.current

            for (const b of boxesToCheck) {
              const hit = b.x < rectX + rectW && b.x + b.w > rectX &&
                b.y < rectY + rectH && b.y + b.h > rectY
              const node = el(b.id)
              if (node) node.style.outline = hit ? `1.5px solid ${solid}` : ''
              if (hit) newPending.add(b.id)
            }
            selectionRef.current.pendingSelected = newPending

            const note = notesRef.current.find(n => n.id === activeTabIdRef.current)
            const drawings = note?.drawings?.[currentPageIdxRef.current] || []
            const pendingDrawings = new Set<string>()
            for (const d of drawings) {
              if (!d.points || d.points.length === 0) continue
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
              for (const p of d.points) {
                if (p.x < minX) minX = p.x
                if (p.y < minY) minY = p.y
                if (p.x > maxX) maxX = p.x
                if (p.y > maxY) maxY = p.y
              }
              const hit = minX < rectX + rectW && maxX > rectX && minY < rectY + rectH && maxY > rectY
              if (hit) pendingDrawings.add(d.id)
            }
            selectedDrawingIdsRef.current = pendingDrawings
          })
        }
      }
      return
    }

    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      if (dragRef.current) {
        const { sx, sy, originalBoxes, elements } = dragRef.current
        const scale = s()
        for (const id in elements) {
          const node = elements[id]
          const orig = originalBoxes[id]
          if (node && orig) {
            node.style.left = (orig.x + (e.clientX - sx) / scale) + 'px'
            node.style.top = (orig.y + (e.clientY - sy) / scale) + 'px'
          }
        }
      }
      if (resizeRef.current) {
        const { handle, sx, sy, ox, oy, ow, oh, element } = resizeRef.current
        const scale = s()
        const dx = (e.clientX - sx) / scale, dy = (e.clientY - sy) / scale
        let x = ox, y = oy, w = ow, h = oh
        if (handle.includes('e')) w = Math.max(80, ow + dx)
        if (handle.includes('s')) h = Math.max(40, oh + dy)
        if (handle.includes('w')) { x = ox + dx; w = Math.max(80, ow - dx) }
        if (handle.includes('n')) { y = oy + dy; h = Math.max(40, oh - dy) }
        if (element) {
          element.style.left = x + 'px'; element.style.top = y + 'px'
          element.style.width = w + 'px'; element.style.height = h + 'px'
        }
      }
    })
  })

  // generateSketch needs to be stable too
  const generateSketch = useCallback(async (prompt: string, boxId: string) => {
    if (!prompt.trim() || !activeTabIdRef.current) return
    setLoadingBoxId(boxId)
    try {
      const res = await apiFetch('/api/sketch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt.trim() }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.url) { onError?.("Sketch Error", "No image was generated. Try a different prompt."); return }
      setNotes(prev => prev.map(n => n.id !== activeTabIdRef.current ? n : {
        ...n, boxes: { ...n.boxes, [currentPageIdxRef.current]: (n.boxes[currentPageIdxRef.current] || []).map(b => b.id === boxId ? { ...b, content: data.url } : b) }
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      console.error('Sketch failed:', err)
      onError?.("Sketch Error", `Failed to generate sketch: ${msg}`)
    } finally {
      setLoadingBoxId(null)
    }
  }, [setNotes])

  const rewriteBox = useCallback(async (text: string, boxId: string) => {
    if (!text.trim() || !activeTabIdRef.current) return
    setLoadingBoxId(boxId)
    try {
      const res = await apiFetch('/api/rewrite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.trim() }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.rewritten) throw new Error('No rewritten text returned')
      setNotes(prev => prev.map(n => n.id !== activeTabIdRef.current ? n : {
        ...n, boxes: { ...n.boxes, [currentPageIdxRef.current]: (n.boxes[currentPageIdxRef.current] || []).map(b => b.id === boxId ? { ...b, content: data.rewritten } : b) }
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      console.error('Rewrite failed:', err)
      onError?.("Rewrite Error", `Failed to rewrite text: ${msg}`)
    } finally {
      setLoadingBoxId(null)
    }
  }, [setNotes])

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
        const { activeTool, stickyColor, sketchMode, sketchPrompt } = sketchRef.current
        if (activeTool === 'sticky') {
          const r = paperRef.current?.getBoundingClientRect()
          if (r) {
            const x = (sx - r.left) / scale
            const y = (sy - r.top) / scale
            const id = uid()
            const newBox: TextBox = {
              id, x: x - 100, y: y - 100, w: 200, h: 200, content: '',
              boxHighlightColor: stickyColor,
              boxFontFamily: 'cursive',
              boxFontSize: 24,
              boxOutlineWidth: 0,
              boxRotation: 2,
            }
            flushSync(() => {
              setNotes(prev => prev.map(n => n.id !== tid ? n : {
                ...n, boxes: { ...n.boxes, [pidx]: [...(n.boxes[pidx] || []), newBox] }
              }))
              setSelectedBoxIds(new Set([id]))
              setActiveTool('select')
            })
            const node = document.getElementById(`box-${id}`)
            if (node) {
              node.animate([
                { transform: 'scale(1.2) rotate(5deg)', opacity: 0 },
                { transform: 'scale(1) rotate(0deg)', opacity: 1 }
              ], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })
              const targetNode = node.querySelector<HTMLElement>('[contenteditable]')
              if (targetNode) {
                targetNode.focus()
                const range = document.createRange()
                range.selectNodeContents(targetNode)
                range.collapse(false)
                const sel = window.getSelection()
                sel?.removeAllRanges()
                sel?.addRange(range)
              }
            }
          }
          return
        }

        // Plain click — always create a box (page.tsx already gates on valid tools)
        const r = paperRef.current?.getBoundingClientRect()
        if (r) {
          const x = (sx - r.left) / scale
          const y = (sy - r.top) / scale
          const id = uid()
          const paperW = paperRef.current?.clientWidth || 800
          const bw = Math.min(300, paperW - x - 8)
          const newBox: TextBox = { id, x, y: y - 8, w: Math.max(bw, 120), h: 32, content: '' }
          const currentBoxes = notesRef.current.find(n => n.id === tid)?.boxes[pidx] || []
          const hasEmpty = currentBoxes.some(b => b.content.trim() === '' && !b.boxHighlightColor)
          setNotes(prev => prev.map(n => n.id !== tid ? n : {
            ...n, boxes: { ...n.boxes, [pidx]: [...(hasEmpty ? (n.boxes[pidx] || []).filter(b => b.content.trim() !== '' || !!b.boxHighlightColor) : (n.boxes[pidx] || [])), newBox] }
          }))
          setSelectedBoxIds(new Set([id]))
          if (activeTool === 'textbox') setActiveTool('select')
          const focusNewBox = () => {
            const targetNode = document.getElementById(`box-${id}`)?.querySelector<HTMLElement>('[contenteditable]')
            if (targetNode) {
              targetNode.focus()
              const range = document.createRange()
              range.selectNodeContents(targetNode)
              range.collapse(false)
              const sel = window.getSelection()
              sel?.removeAllRanges()
              sel?.addRange(range)
            } else {
              requestAnimationFrame(focusNewBox)
            }
          }
          requestAnimationFrame(focusNewBox)
          if (sketchMode) {
            requestAnimationFrame(() => generateSketch(sketchPrompt, id))
            setSketchMode(false); setSketchPrompt('')
          }
        }
      } else {
        // Drag-select: only prune if there are empty boxes (avoid spurious re-renders)
        const currentTab = notesRef.current.find(n => n.id === tid)
        const hasEmpty = (currentTab?.boxes[pidx] || []).some(b => b.content.trim() === '' && !b.boxHighlightColor)
        if (hasEmpty) {
          setNotes(prev => prev.map(n => n.id !== tid ? n : {
            ...n, boxes: { ...n.boxes, [pidx]: (n.boxes[pidx] || []).filter(b => b.content.trim() !== '' || !!b.boxHighlightColor) }
          }))
        }
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

  const addListeners = useCallback(() => {
    document.addEventListener('mousemove', handleMove.current)
    document.addEventListener('mouseup', handleUp.current)
  }, [])

  const pruneEmpty = useCallback(() => updateBoxes(bs => bs.filter(b => b.content.trim() !== '' || !!b.boxHighlightColor)), [updateBoxes])

  const startDrag = useCallback((e: React.MouseEvent, box: TextBox) => {
    const target = e.target as HTMLElement
    const isEditable = target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
    if (!isEditable) e.preventDefault()
    e.stopPropagation()

    let draggingIds = Array.from(selectedBoxIdsRef.current)
    if (!selectedBoxIdsRef.current.has(box.id)) {
      setSelectedBoxIds(new Set([box.id]))
      draggingIds = [box.id]
    }

    const originalBoxes: Record<string, { x: number, y: number }> = {}
    const elements: Record<string, HTMLElement> = {}
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    const currentTab = notesRef.current.find(n => n.id === tid)
    for (const b of (currentTab?.boxes[pidx] || [])) {
      if (draggingIds.includes(b.id)) {
        originalBoxes[b.id] = { x: b.x, y: b.y }
        const node = el(b.id); if (node) elements[b.id] = node
      }
    }

    dragRef.current = { ids: draggingIds, sx: e.clientX, sy: e.clientY, originalBoxes, elements }
    addListeners()
  }, [addListeners, el, setSelectedBoxIds])

  const startResize = useCallback((e: React.MouseEvent, box: TextBox, handle: string) => {
    e.preventDefault(); e.stopPropagation()
    resizeRef.current = { id: box.id, handle, sx: e.clientX, sy: e.clientY, ox: box.x, oy: box.y, ow: box.w, oh: box.h, element: el(box.id) }
    addListeners()
  }, [addListeners, el])

  const onPaperMouseDown = useCallback((e: React.MouseEvent) => {
    if (!paperRef.current) return

    // Force blur current element if it's within our editor area
    if (document.activeElement instanceof HTMLElement &&
      (document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.hasAttribute('contenteditable') ||
        document.activeElement.tagName === 'INPUT')) {
      document.activeElement.blur()
    }

    const target = e.target as HTMLElement
    const isEditable = target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
    if (!isEditable) e.preventDefault()

    const r = paperRef.current.getBoundingClientRect()
    const zoomVal = Number(zoomRef.current)
    const x = (e.clientX - r.left) / zoomVal
    const y = (e.clientY - r.top) / zoomVal
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current

    if (sketchRef.current.drawLineMode) {
      if (tid) {
        setNotes(prev => prev.map(n => n.id === tid ? { ...n, lines: { ...(n.lines || {}), [pidx]: [...(n.lines?.[pidx] || []), x] } } : n))
      }
      setDrawLineMode(false)
      return
    }

    // Check if clicking near an existing line (within 8px)
    const currentTab = notesRef.current.find(n => n.id === tid)
    const lines = currentTab?.lines?.[pidx] || []
    for (const lineX of lines) {
      if (Math.abs(x - lineX) < 8) {
        selectedLineRef.current = lineX
        setLineSelectionVersion(c => c + 1)
        return
      }
    }

    // Check if clicking near a line (horizontal or vertical)
    const hlines = currentTab?.hlines?.[pidx] || []
    for (const hl of hlines) {
      const isVert = hl.direction === "vertical"
      const hit = isVert
        ? (Math.abs(x - hl.x) < 8 && y >= hl.y && y <= hl.y + hl.width)
        : (x >= hl.x && x <= hl.x + hl.width && Math.abs(y - hl.y) < 8)
      if (hit) {
        selectedHLineIdRef.current = hl.id
        selectedLineRef.current = null
        setHlineSelectionVersion(c => c + 1)
        setLineSelectionVersion(c => c + 1)
        hlineDragRef.current = { id: hl.id, startX: e.clientX, startY: e.clientY, origX: hl.x, origY: hl.y }
        const onMove = (ev: MouseEvent) => {
          if (!hlineDragRef.current) return
          const dx = (ev.clientX - hlineDragRef.current.startX) / zoomVal
          const dy = (ev.clientY - hlineDragRef.current.startY) / zoomVal
          const newX = hlineDragRef.current.origX + dx
          const newY = hlineDragRef.current.origY + dy
          setNotes(prev => prev.map(n => n.id !== tid ? n : {
            ...n, hlines: { ...(n.hlines || {}), [pidx]: (n.hlines?.[pidx] || []).map(h => h.id !== hlineDragRef.current!.id ? h : { ...h, x: newX, y: newY }) }
          }))
        }
        const onUp = () => {
          hlineDragRef.current = null
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return
      }
    }

    // No line clicked, clear line selection and start box selection
    selectedLineRef.current = null
    selectedHLineIdRef.current = null
    setLineSelectionVersion(c => c + 1)
    setHlineSelectionVersion(c => c + 1)

    const boxes = currentTab?.boxes[pidx] || []
    selectionRef.current = { sx: e.clientX, sy: e.clientY, active: false, pendingSelected: new Set(), cachedBoxes: boxes }
    addListeners()
  }, [addListeners, setDrawLineMode, setNotes])

  const pushUndo = useCallback(() => {
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    const note = notesRef.current.find(n => n.id === tid)
    if (note) {
      undoStackRef.current.push({
        tabId: tid!,
        pageIdx: pidx,
        boxes: [...(note.boxes[pidx] || [])],
        drawings: note.drawings?.[pidx] ? [...note.drawings[pidx]] : undefined,
      })
      if (undoStackRef.current.length > 50) undoStackRef.current.shift()
    }
  }, [])

  const deleteBox = useCallback((id: string) => {
    pushUndo()
    const element = document.getElementById(`box-${id}`)
    if (element) {
      element.style.pointerEvents = 'none'
      element.style.transition = 'none'

      if (!document.getElementById('eraser-particle-style')) {
        const sheet = document.createElement('style')
        sheet.id = 'eraser-particle-style'
        sheet.textContent = `@keyframes eraser-particle{0%{opacity:0.7;transform:scale(1) translate(0,0)}100%{opacity:0;transform:scale(0.3) translate(8px,-8px)}}`
        document.head.appendChild(sheet)
      }

      const dust = document.createElement('div')
      dust.style.cssText = `position:absolute;inset:0;pointer-events:none;z-index:999;overflow:hidden;`
      for (let i = 0; i < 6; i++) {
        const p = document.createElement('div')
        const x = 20 + Math.random() * 60
        const y = 20 + Math.random() * 60
        const size = 2 + Math.random() * 3
        p.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:${size}px;height:${size}px;border-radius:50%;background:rgba(180,170,160,0.5);opacity:0;animation:eraser-particle 0.6s ${i * 0.04}s ease-out forwards;`
        dust.appendChild(p)
      }
      element.style.position === '' && (element.style.position = 'relative')
      element.appendChild(dust)

      element.animate([
        { clipPath: 'inset(0 0 0 0)', opacity: 1, filter: 'blur(0px)' },
        { clipPath: 'inset(0 0 0 30%)', opacity: 0.7, filter: 'blur(0.3px)', offset: 0.3 },
        { clipPath: 'inset(0 0 0 70%)', opacity: 0.4, filter: 'blur(0.5px)', offset: 0.7 },
        { clipPath: 'inset(0 0 0 100%)', opacity: 0, filter: 'blur(1px)' },
      ], { duration: 450, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' })

      setTimeout(() => {
        updateBoxes(bs => bs.filter(b => b.id !== id))
        setSelectedBoxIds(prev => { const n = new Set(prev); n.delete(id); return n })
      }, 500)
    } else {
      updateBoxes(bs => bs.filter(b => b.id !== id))
      setSelectedBoxIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }, [pushUndo, setSelectedBoxIds, updateBoxes])

  const updateBoxContent = useCallback((id: string, text: string) => updateBoxes(bs => bs.map(b => b.id === id ? { ...b, content: text } : b)), [updateBoxes])

  const autoAlign = useCallback(() => {
    if (aligningRef.current) return
    aligningRef.current = true
    pushUndo()
    try {
      updateBoxes(bs => {
        if (bs.length === 0) return bs
        const selectedIds = selectedBoxIdsRef.current
        const toAlign = selectedIds.size > 0 ? bs.filter(b => selectedIds.has(b.id)) : bs
        if (toAlign.length === 0) return bs

        const sorted = [...toAlign].sort((a, b) => a.y - b.y || a.x - b.x)
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
        const alignedBoxesMap = new Map()

        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current
        const currentNote = activeTabIdRef.current ? notesRef.current.find(n => n.id === tid) : null
        const noteLines = currentNote?.lines?.[pidx] || []
        const leftEdge = noteLines.length > 0 ? Math.min(...noteLines) + 32 : 128
        const lines = [112, ...noteLines].sort((a, b) => a - b)

        for (const row of rows) {
          row.sort((a, b) => a.x - b.x || a.y - b.y)
          let currentX = leftEdge
          let maxH = 0
          for (let i = 0; i < row.length; i++) {
            const rowBox = row[i]
            let snappedX = currentX
            if (lines.length > 0) {
              let matchedLine = -1
              if (i === 0 && rowBox.x < lines[0] + 250) {
                matchedLine = lines[0]
              } else {
                for (const lx of lines) {
                  if (rowBox.x >= lx - 40) matchedLine = lx
                }
              }
              if (matchedLine !== -1) {
                snappedX = matchedLine + 32
              }
            }
            snappedX = Math.max(snappedX, currentX)
            alignedBoxesMap.set(rowBox.id, { ...rowBox, x: snappedX, y: currentY })
            currentX = snappedX + (rowBox.w || 300) + 48
            maxH = Math.max(maxH, rowBox.h || 40)
          }
          currentY += maxH + 24
        }
        return bs.map(b => alignedBoxesMap.get(b.id) || b)
      })
    } finally {
      aligningRef.current = false
    }
  }, [pushUndo, updateBoxes])

  const verticalAlign = useCallback(() => {
    if (aligningRef.current) return
    aligningRef.current = true
    pushUndo()
    try {
      updateBoxes(bs => {
        const selectedIds = selectedBoxIdsRef.current
        const toAlign = selectedIds.size > 0 ? bs.filter(b => selectedIds.has(b.id)) : bs
        if (toAlign.length === 0) return bs

        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current
        const noteLines = notesRef.current.find(n => n.id === tid)?.lines?.[pidx] || []
        const leftEdge = noteLines.length > 0 ? Math.min(...noteLines) + 32 : 0

        const sorted = [...toAlign].sort((a, b) => a.y - b.y || a.x - b.x)

        const targetX = Math.max(sorted[0].x, leftEdge)
        const startY = toAlign.length === bs.length ? 20 : sorted[0].y
        let tempY = startY

        const alignedBoxesMap = new Map()
        for (const box of sorted) {
          const height = box.h || 40
          alignedBoxesMap.set(box.id, { ...box, x: targetX, y: tempY })
          tempY += height + 20
        }

        return bs.map(b => alignedBoxesMap.get(b.id) || b)
      })
    } finally {
      aligningRef.current = false
    }
  }, [pushUndo, updateBoxes])

  const centerStack = useCallback(() => {
    if (aligningRef.current) return
    aligningRef.current = true
    pushUndo()
    try {
      updateBoxes(bs => {
        const selectedIds = selectedBoxIdsRef.current
        const toAlign = selectedIds.size > 0 ? bs.filter(b => selectedIds.has(b.id)) : bs
        if (toAlign.length === 0) return bs

        const paper = paperRef.current
        const paperW = paper ? paper.clientWidth : 800
        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current
        const noteLines = notesRef.current.find(n => n.id === tid)?.lines?.[pidx] || []
        const leftEdge = noteLines.length > 0 ? Math.min(...noteLines) + 32 : 40
        const usableW = paperW - leftEdge
        const sorted = [...toAlign].sort((a, b) => a.y - b.y)

        let currentY = Math.max(sorted[0].y, 60)
        const map = new Map()
        for (const box of sorted) {
          const cx = leftEdge + (usableW - box.w) / 2
          map.set(box.id, { ...box, x: Math.max(leftEdge, cx), y: currentY })
          currentY += (box.h || 40) + 20
        }
        return bs.map(b => map.get(b.id) || b)
      })
    } finally { aligningRef.current = false }
  }, [pushUndo, updateBoxes])

  const twoColumnGrid = useCallback(() => {
    if (aligningRef.current) return
    aligningRef.current = true
    pushUndo()
    try {
      updateBoxes(bs => {
        const selectedIds = selectedBoxIdsRef.current
        const toAlign = selectedIds.size > 0 ? bs.filter(b => selectedIds.has(b.id)) : bs
        if (toAlign.length === 0) return bs

        const paper = paperRef.current
        const paperW = paper ? paper.clientWidth : 800
        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current
        const noteLines = notesRef.current.find(n => n.id === tid)?.lines?.[pidx] || []
        const leftEdge = noteLines.length > 0 ? Math.min(...noteLines) + 32 : 80
        const gap = 32
        const colW = (paperW - leftEdge - gap) / 2
        const sorted = [...toAlign].sort((a, b) => a.y - b.y || a.x - b.x)

        const map = new Map()
        let leftY = 60, rightY = 60
        for (let i = 0; i < sorted.length; i++) {
          const box = sorted[i]
          const isLeft = leftY <= rightY
          const x = isLeft ? leftEdge : leftEdge + colW + gap
          const y = isLeft ? leftY : rightY
          map.set(box.id, { ...box, x, y, w: colW })
          if (isLeft) leftY += (box.h || 40) + 20
          else rightY += (box.h || 40) + 20
        }
        return bs.map(b => map.get(b.id) || b)
      })
    } finally { aligningRef.current = false }
  }, [pushUndo, updateBoxes])

  const distributeEvenly = useCallback(() => {
    if (aligningRef.current) return
    aligningRef.current = true
    pushUndo()
    try {
      updateBoxes(bs => {
        const selectedIds = selectedBoxIdsRef.current
        const toAlign = selectedIds.size > 0 ? bs.filter(b => selectedIds.has(b.id)) : bs
        if (toAlign.length < 3) return bs // Need at least 3 to distribute intermediate ones

        const sorted = [...toAlign].sort((a, b) => a.y - b.y)
        const first = sorted[0]
        const last = sorted[sorted.length - 1]

        const totalGap = (last.y - first.y)
        const step = totalGap / (sorted.length - 1)

        const map = new Map()
        for (let i = 0; i < sorted.length; i++) {
          map.set(sorted[i].id, { ...sorted[i], y: first.y + i * step })
        }
        return bs.map(b => map.get(b.id) || b)
      })
    } finally { aligningRef.current = false }
  }, [pushUndo, updateBoxes])

  const selectBox = useCallback((id: string) => { pruneEmpty(); setSelectedBoxIds(new Set([id])) }, [pruneEmpty, setSelectedBoxIds])

  const setBoxAlignment = useCallback((align: "left" | "center" | "right") => {
    updateBoxes(bs => bs.map(b => selectedBoxIdsRef.current.has(b.id) ? { ...b, textAlign: align } : b))
  }, [updateBoxes])

  const updateBox = useCallback((id: string, updates: Partial<TextBox>) =>
    updateBoxes(bs => bs.map(b => b.id === id ? { ...b, ...updates } : b)), [updateBoxes])

  return useMemo(() => ({
    selectionVersion, selectedBoxIdsRef, selectedDrawingIdsRef, setSelectedBoxIds, selectBox, selectionRectRef, loadingBoxId,
    lineSelectionVersion, selectedLineRef,
    hlineSelectionVersion, selectedHLineIdRef,
    onPaperMouseDown, startDrag, startResize, deleteBox, updateBoxContent, updateBox, updateBoxes,
    autoAlign, verticalAlign, centerStack, twoColumnGrid, distributeEvenly, setBoxAlignment, generateSketch, rewriteBox
  }), [selectionVersion, setSelectedBoxIds, selectBox, loadingBoxId, lineSelectionVersion, hlineSelectionVersion, onPaperMouseDown, startDrag, startResize, deleteBox, updateBoxContent, updateBox, updateBoxes, autoAlign, verticalAlign, centerStack, twoColumnGrid, distributeEvenly, setBoxAlignment, generateSketch, rewriteBox])
}
