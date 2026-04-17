"use client"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { uid } from "@/app/lib/uid"
import type { TextBox, NoteData } from "@/app/types"

interface UseBoxDrawingOptions {
  activeTabId: string | null
  currentPageIdx: number
  zoom: string
  accent: string
  notes: NoteData[]
  setNotes: React.Dispatch<React.SetStateAction<NoteData[]>>
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
}

export function useBoxDrawing({
  activeTabId, currentPageIdx, zoom, accent, notes, setNotes, paperRef,
  sketchMode, sketchPrompt, setSketchMode, setSketchPrompt, drawLineMode, setDrawLineMode,
  activeTool, setActiveTool, stickyColor
}: UseBoxDrawingOptions) {
  // Selection is only in a ref. A cheap counter triggers box-list re-renders.
  const selectedBoxIdsRef = useRef<Set<string>>(new Set())
  const [selectionVersion, setSelectionVersion] = useState(0)
  const selectedLineRef = useRef<number | null>(null)
  const [lineSelectionVersion, setLineSelectionVersion] = useState(0)
  const [loadingBoxId, setLoadingBoxId] = useState<string | null>(null)
  const aligningRef = useRef(false)

  // Stable refs so DOM handlers never have stale closures
  const zoomRef = useRef(zoom)
  const activeTabIdRef = useRef(activeTabId)
  const currentPageIdxRef = useRef(currentPageIdx)
  const notesRef = useRef(notes)
  const sketchRef = useRef({ sketchMode, sketchPrompt, drawLineMode, activeTool, stickyColor })
  const accentRef = useRef(accent)
  // Page attaches its selection rect div to this ref for zero-React-state drag updates
  const selectionRectRef = useRef<HTMLDivElement | null>(null)

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
  useEffect(() => { activeTabIdRef.current = activeTabId }, [activeTabId])
  useEffect(() => { currentPageIdxRef.current = currentPageIdx }, [currentPageIdx])
  useEffect(() => { notesRef.current = notes }, [notes])
  useEffect(() => { sketchRef.current = { sketchMode, sketchPrompt, drawLineMode, activeTool, stickyColor } }, [sketchMode, sketchPrompt, drawLineMode, activeTool, stickyColor])

  // Keyboard shortcuts — delete selected boxes/lines, select all
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return
      
      // Allow deletion logic for contentEditable elements if they are empty or visual-only (like horizontal lines)
      if (target.isContentEditable) {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        
        const plainText = target.innerText.trim();
        
        // If there is ANY text content, let the browser/editor handle it normally.
        // We only allow this global delete to trigger for truly empty or visual/SVG-only boxes.
        if (plainText !== "") return;
      }

      // Ctrl/Cmd+A — select all boxes on current page
      if (e.ctrlKey && e.key === 'a') {
        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current
        const allIds = new Set((notesRef.current.find(n => n.id === tid)?.boxes[pidx] || []).map(b => b.id))
        if (allIds.size === 0) return
        e.preventDefault()
        setSelectedBoxIds(allIds)
        return
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return

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

      // Delete selected boxes
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
    requestAnimationFrame(() => {
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
          }
        }
        return
      }

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
      const res = await fetch('/api/sketch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt.trim() }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.url) { console.warn('No image URL', data); return }
      setNotes(prev => prev.map(n => n.id !== activeTabIdRef.current ? n : {
        ...n, boxes: { ...n.boxes, [currentPageIdxRef.current]: (n.boxes[currentPageIdxRef.current] || []).map(b => b.id === boxId ? { ...b, content: data.url } : b) }
      }))
    } catch (err) {
      console.error('Sketch failed:', err)
    } finally {
      setLoadingBoxId(null)
    }
  }, [setNotes])
  
  const rewriteBox = useCallback(async (text: string, boxId: string) => {
    if (!text.trim() || !activeTabIdRef.current) return
    setLoadingBoxId(boxId)
    try {
      const res = await fetch('/api/rewrite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.trim() }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.rewritten) throw new Error('No rewritten text returned')
      setNotes(prev => prev.map(n => n.id !== activeTabIdRef.current ? n : {
        ...n, boxes: { ...n.boxes, [currentPageIdxRef.current]: (n.boxes[currentPageIdxRef.current] || []).map(b => b.id === boxId ? { ...b, content: data.rewritten } : b) }
      }))
    } catch (err) {
      console.error('Rewrite failed:', err)
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
              boxFontFamily: '"Bilbo", cursive', 
              boxFontSize: 24,
              boxOutlineWidth: 0,
              boxRotation: 2, // Slight tilt
            }
            setNotes(prev => prev.map(n => n.id !== tid ? n : {
              ...n, boxes: { ...n.boxes, [pidx]: [...(n.boxes[pidx] || []), newBox] }
            }))
            setSelectedBoxIds(new Set([id]))
            setActiveTool('select')
            
            const focusStickyBox = (retryCount = 0) => {
              const node = document.getElementById(`box-${id}`)
              if (node) {
                if (retryCount === 0) { // Only animate on first successful find
                  node.animate([
                    { transform: 'scale(1.2) rotate(5deg)', opacity: 0 },
                    { transform: 'scale(1) rotate(0deg)', opacity: 1 }
                  ], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })
                }
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
              } else if (retryCount < 10) {
                setTimeout(() => focusStickyBox(retryCount + 1), 10)
              }
            }
            focusStickyBox()
          }
          return
        }

        // Plain click — always create a box (page.tsx already gates on valid tools)
        const r = paperRef.current?.getBoundingClientRect()
        if (r) {
          const x = (sx - r.left) / scale
          const y = (sy - r.top) / scale
          const id = uid()
          const newBox: TextBox = { id, x: x - 8, y: y - 8, w: 300, h: 32, content: '' }
          setNotes(prev => prev.map(n => n.id !== tid ? n : {
            ...n, boxes: { ...n.boxes, [pidx]: [...(n.boxes[pidx] || []).filter(b => b.content.trim() !== '' || !!b.boxHighlightColor), newBox] }
          }))
          setSelectedBoxIds(new Set([id]))
          const focusNewBox = (retryCount = 0) => {
            const targetNode = document.getElementById(`box-${id}`)?.querySelector<HTMLElement>('[contenteditable]')
            if (targetNode) {
              targetNode.focus()
              const range = document.createRange()
              range.selectNodeContents(targetNode)
              range.collapse(false)
              const sel = window.getSelection()
              sel?.removeAllRanges()
              sel?.addRange(range)
            } else if (retryCount < 10) {
              setTimeout(() => focusNewBox(retryCount + 1), 10)
            }
          }
          focusNewBox()
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
    const x = (e.clientX - r.left) / Number(zoomRef.current)
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

    // No line clicked, clear line selection and start box selection
    selectedLineRef.current = null
    setLineSelectionVersion(c => c + 1)

    const boxes = currentTab?.boxes[pidx] || []
    selectionRef.current = { sx: e.clientX, sy: e.clientY, active: false, pendingSelected: new Set(), cachedBoxes: boxes }
    addListeners()
  }, [addListeners, setDrawLineMode, setNotes])

  const deleteBox = useCallback((id: string) => {
    const element = document.getElementById(`box-${id}`)
    if (element) {
      element.style.pointerEvents = 'none'
      element.style.transition = 'none'

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

      const sheet = document.createElement('style')
      sheet.textContent = `@keyframes eraser-particle{0%{opacity:0.7;transform:scale(1) translate(0,0)}100%{opacity:0;transform:scale(0.3) translate(${Math.random()>0.5?'':'-'}${8+Math.random()*12}px,-${6+Math.random()*10}px)}}`
      document.head.appendChild(sheet)

      element.animate([
        { clipPath: 'inset(0 0 0 0)', opacity: 1, filter: 'blur(0px)' },
        { clipPath: 'inset(0 0 0 30%)', opacity: 0.7, filter: 'blur(0.3px)', offset: 0.3 },
        { clipPath: 'inset(0 0 0 70%)', opacity: 0.4, filter: 'blur(0.5px)', offset: 0.7 },
        { clipPath: 'inset(0 0 0 100%)', opacity: 0, filter: 'blur(1px)' },
      ], { duration: 450, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' })

      setTimeout(() => {
        sheet.remove()
        updateBoxes(bs => bs.filter(b => b.id !== id))
        setSelectedBoxIds(prev => { const n = new Set(prev); n.delete(id); return n })
      }, 500)
    } else {
      updateBoxes(bs => bs.filter(b => b.id !== id))
      setSelectedBoxIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }, [setSelectedBoxIds, updateBoxes])

  const updateBoxContent = useCallback((id: string, text: string) => updateBoxes(bs => bs.map(b => b.id === id ? { ...b, content: text } : b)), [updateBoxes])

  const autoAlign = useCallback(() => {
    if (aligningRef.current) return
    aligningRef.current = true
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
        const standardMarginX = 128
        const alignedBoxesMap = new Map()

        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current
        const currentNote = activeTabIdRef.current ? notesRef.current.find(n => n.id === tid) : null
        const noteLines = currentNote?.lines?.[pidx] || []
        const lines = [112, ...noteLines].sort((a, b) => a - b)

        for (const row of rows) {
          row.sort((a, b) => a.x - b.x || a.y - b.y)
          let currentX = standardMarginX
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
  }, [updateBoxes])

  const verticalAlign = useCallback(() => {
    if (aligningRef.current) return
    aligningRef.current = true
    try {
      updateBoxes(bs => {
        const selectedIds = selectedBoxIdsRef.current
        const toAlign = selectedIds.size > 0 ? bs.filter(b => selectedIds.has(b.id)) : bs
        if (toAlign.length === 0) return bs

        const sorted = [...toAlign].sort((a, b) => a.y - b.y || a.x - b.x)

        const tid = activeTabIdRef.current
        const pidx = currentPageIdxRef.current
        const currentNote = tid ? notesRef.current.find(n => n.id === tid) : null
        const noteLines = currentNote?.lines?.[pidx] || []
        const lines = [112, ...noteLines].sort((a, b) => a - b)

        // Start Y from the first box's Y or 80
        let tempY = Math.max(sorted[0].y, 80)
        // Align to the first margin line (usually 112 + 32 = 144)
        const baseMarginX = (lines[0] || 112) + 32

        const alignedBoxesMap = new Map()
        for (const box of sorted) {
          const height = box.h || 40
          alignedBoxesMap.set(box.id, { ...box, x: baseMarginX, y: tempY })
          tempY += height + 16 // Consistent gap
        }

        return bs.map(b => alignedBoxesMap.get(b.id) || b)
      })
    } finally {
      aligningRef.current = false
    }
  }, [updateBoxes])

  const centerStack = useCallback(() => {
    if (aligningRef.current) return
    aligningRef.current = true
    try {
      updateBoxes(bs => {
        const selectedIds = selectedBoxIdsRef.current
        const toAlign = selectedIds.size > 0 ? bs.filter(b => selectedIds.has(b.id)) : bs
        if (toAlign.length === 0) return bs

        const paper = paperRef.current
        const paperW = paper ? paper.clientWidth : 800
        const sorted = [...toAlign].sort((a, b) => a.y - b.y)

        let currentY = Math.max(sorted[0].y, 60)
        const map = new Map()
        for (const box of sorted) {
          const cx = (paperW - box.w) / 2
          map.set(box.id, { ...box, x: Math.max(40, cx), y: currentY })
          currentY += (box.h || 40) + 20
        }
        return bs.map(b => map.get(b.id) || b)
      })
    } finally { aligningRef.current = false }
  }, [updateBoxes])

  const twoColumnGrid = useCallback(() => {
    if (aligningRef.current) return
    aligningRef.current = true
    try {
      updateBoxes(bs => {
        const selectedIds = selectedBoxIdsRef.current
        const toAlign = selectedIds.size > 0 ? bs.filter(b => selectedIds.has(b.id)) : bs
        if (toAlign.length === 0) return bs

        const paper = paperRef.current
        const paperW = paper ? paper.clientWidth : 800
        const margin = 80
        const gap = 32
        const colW = (paperW - margin * 2 - gap) / 2
        const sorted = [...toAlign].sort((a, b) => a.y - b.y || a.x - b.x)

        const map = new Map()
        let leftY = 60, rightY = 60
        for (let i = 0; i < sorted.length; i++) {
          const box = sorted[i]
          const isLeft = leftY <= rightY
          const x = isLeft ? margin : margin + colW + gap
          const y = isLeft ? leftY : rightY
          map.set(box.id, { ...box, x, y, w: colW })
          if (isLeft) leftY += (box.h || 40) + 20
          else rightY += (box.h || 40) + 20
        }
        return bs.map(b => map.get(b.id) || b)
      })
    } finally { aligningRef.current = false }
  }, [updateBoxes])

  const distributeEvenly = useCallback(() => {
    if (aligningRef.current) return
    aligningRef.current = true
    try {
      updateBoxes(bs => {
        const selectedIds = selectedBoxIdsRef.current
        const toAlign = selectedIds.size > 0 ? bs.filter(b => selectedIds.has(b.id)) : bs
        if (toAlign.length < 2) return bs

        const sorted = [...toAlign].sort((a, b) => a.y - b.y)
        const firstY = sorted[0].y
        const totalH = sorted.reduce((sum, b) => sum + (b.h || 40), 0)
        const availH = Math.max(totalH + (sorted.length - 1) * 24, 800)
        const gap = (availH - totalH) / (sorted.length - 1)

        const map = new Map()
        let currentY = firstY
        for (const box of sorted) {
          map.set(box.id, { ...box, y: currentY })
          currentY += (box.h || 40) + gap
        }
        return bs.map(b => map.get(b.id) || b)
      })
    } finally { aligningRef.current = false }
  }, [updateBoxes])

  const selectBox = useCallback((id: string) => { pruneEmpty(); setSelectedBoxIds(new Set([id])) }, [pruneEmpty, setSelectedBoxIds])

  const setBoxAlignment = useCallback((align: "left" | "center" | "right") => {
    updateBoxes(bs => bs.map(b => selectedBoxIdsRef.current.has(b.id) ? { ...b, textAlign: align } : b))
  }, [updateBoxes])

  const updateBox = useCallback((id: string, updates: Partial<TextBox>) =>
    updateBoxes(bs => bs.map(b => b.id === id ? { ...b, ...updates } : b)), [updateBoxes])

  return useMemo(() => ({
    selectionVersion, selectedBoxIdsRef, setSelectedBoxIds, selectBox, selectionRectRef, loadingBoxId,
    lineSelectionVersion, selectedLineRef,
    onPaperMouseDown, startDrag, startResize, deleteBox, updateBoxContent, updateBox,
    autoAlign, verticalAlign, centerStack, twoColumnGrid, distributeEvenly, setBoxAlignment, generateSketch, rewriteBox
  }), [selectionVersion, setSelectedBoxIds, selectBox, loadingBoxId, lineSelectionVersion, onPaperMouseDown, startDrag, startResize, deleteBox, updateBoxContent, updateBox, autoAlign, verticalAlign, centerStack, twoColumnGrid, distributeEvenly, setBoxAlignment, generateSketch, rewriteBox])
}
