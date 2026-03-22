"use client"
import { useRef, useCallback, useEffect } from "react"
import type { NoteData } from "@/app/types"

interface UseEditorOptions {
  editorRef: React.RefObject<HTMLDivElement | null>
  activeTabId: string | null
  currentPageIdx: number
  setNotes: React.Dispatch<React.SetStateAction<NoteData[]>>
  accent: string
}

export function useEditor({ editorRef, activeTabId, currentPageIdx, setNotes, accent }: UseEditorOptions) {
  const savedRange = useRef<Range | null>(null)

  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange()
  }, [])

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && savedRange.current) {
      // Find the contenteditable ancestor to restore focus
      let node = savedRange.current.commonAncestorContainer as Node | null
      while (node && node.nodeType !== 1) node = node.parentNode
      const editable = (node as HTMLElement)?.closest?.('[contenteditable]') as HTMLElement | null
      if (editable && editable !== document.activeElement) {
        editable.focus()
      } else if (!editable) {
        editorRef.current?.focus()
      }
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
    } else {
      editorRef.current?.focus()
    }
  }, [editorRef])

  // ─────────────────────────────────────────────────────────────────────────────
  // Debounced sync: never call setNotes more than once per 500 ms while typing.
  // The DOM (contentEditable) is the live source of truth; React state is only
  // needed for cloud persistence and page/tab switching.
  // ─────────────────────────────────────────────────────────────────────────────
  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const activeTabIdRef = useRef(activeTabId)
  const currentPageIdxRef = useRef(currentPageIdx)
  // Keep refs in sync so the debounced callback always captures current values
  // without needing them in the useCallback dependency array.
  activeTabIdRef.current = activeTabId
  currentPageIdxRef.current = currentPageIdx

  const commitToState = useCallback(() => {
    const content = editorRef.current?.innerHTML || ""
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    setNotes(prev => prev.map(n =>
      n.id === tid ? { ...n, pages: n.pages.map((p, i) => i === pidx ? content : p) } : n
    ))
  }, [editorRef, setNotes])

  // Called on every onInput — schedules a debounced state sync
  const syncContent = useCallback(() => {
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(commitToState, 500)
  }, [commitToState])

  // Call this before page/tab navigation to immediately commit pending edits
  const flushSync = useCallback(() => {
    clearTimeout(syncTimer.current)
    commitToState()
  }, [commitToState])
  // ─────────────────────────────────────────────────────────────────────────────

  const execCmd = useCallback((cmd: string, value?: string) => {
    restoreSelection()
    document.execCommand(cmd, false, value)
    saveSelection()
  }, [restoreSelection, saveSelection])

  const insertHTML = useCallback((html: string) => {
    restoreSelection()
    document.execCommand("insertHTML", false, html)
    saveSelection()
  }, [restoreSelection, saveSelection])

  const applyFontSize = useCallback((sizePx: string) => {
    if (!sizePx || isNaN(Number(sizePx))) return
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (range.collapsed) return
    const span = document.createElement("span")
    span.style.fontSize = sizePx + "px"
    const fragment = range.extractContents()
    const tmp = document.createElement("div")
    tmp.appendChild(fragment)
    tmp.querySelectorAll<HTMLElement>("[style]").forEach(el => el.style.removeProperty("font-size"))
    tmp.querySelectorAll<HTMLElement>("span").forEach(el => {
      if (!el.getAttribute("style") && el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE)
        el.replaceWith(el.firstChild)
    })
    while (tmp.firstChild) span.appendChild(tmp.firstChild)
    range.insertNode(span)
    const nr = document.createRange(); nr.selectNodeContents(span)
    sel.removeAllRanges(); sel.addRange(nr); savedRange.current = nr.cloneRange()
  }, [restoreSelection])

  const applyBlockStyle = useCallback((tag: string) => {
    const editor = editorRef.current
    if (!editor || !savedRange.current) return
    const headingStyles: Record<string, { fontSize: string; fontWeight: string; margin: string }> = {
      h1: { fontSize: "3rem", fontWeight: "800", margin: "1.25rem 0" },
      h2: { fontSize: "2.25rem", fontWeight: "700", margin: "1rem 0" },
      h3: { fontSize: "1.75rem", fontWeight: "700", margin: "0.75rem 0" },
    }
    restoreSelection()
    document.execCommand("formatBlock", false, tag === "default" ? "p" : tag)
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode
      const block = (node as HTMLElement).closest(tag === "default" ? "p" : tag) as HTMLElement | null
      if (block) {
        if (tag === "default") {
          block.style.fontSize = ""; block.style.fontWeight = ""; block.style.margin = ""
        } else {
          const s = headingStyles[tag]
          if (s) { block.style.fontSize = s.fontSize; block.style.fontWeight = s.fontWeight; block.style.margin = s.margin; block.style.display = "block" }
        }
        const nr = document.createRange(); nr.selectNodeContents(block)
        sel.removeAllRanges(); sel.addRange(nr); savedRange.current = nr.cloneRange()
      }
    }
    commitToState()
  }, [editorRef, restoreSelection, commitToState])

  const toggleScript = useCallback((cmd: "superscript" | "subscript") => {
    const tag = cmd === "superscript" ? "SUP" : "SUB"
    const saved = savedRange.current
    let node: Node | null = saved?.commonAncestorContainer ?? null
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode
    let scriptEl: HTMLElement | null = null
    while (node && node !== editorRef.current) {
      if ((node as HTMLElement).tagName === tag) { scriptEl = node as HTMLElement; break }
      node = node.parentNode
    }
    const sel = window.getSelection()
    if (scriptEl && scriptEl.parentNode) {
      if (saved && !saved.collapsed) {
        const parent = scriptEl.parentNode
        while (scriptEl.firstChild) parent.insertBefore(scriptEl.firstChild, scriptEl)
        parent.removeChild(scriptEl)
        try { sel?.removeAllRanges(); sel?.addRange(saved) } catch { /* stale */ }
        saveSelection()
      } else {
        const nr = document.createRange(); nr.setStartAfter(scriptEl); nr.collapse(true)
        sel?.removeAllRanges(); sel?.addRange(nr); savedRange.current = nr.cloneRange()
      }
    } else {
      if (saved) { sel?.removeAllRanges(); sel?.addRange(saved) }
      document.execCommand(cmd, false)
      saveSelection()
    }
  }, [editorRef, saveSelection])

  const getRangeAtSaved = useCallback((): Range => {
    const editor = editorRef.current!
    if (savedRange.current) {
      try {
        const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(savedRange.current)
        const r = savedRange.current.cloneRange(); r.collapse(true); return r
      } catch { /* stale range */ }
    }
    const r = document.createRange(); r.selectNodeContents(editor); r.collapse(false); return r
  }, [editorRef])

  const focusFirstCell = useCallback((el: Element | null) => {
    if (!el) return
    const r = document.createRange(); r.setStart(el, 0); r.collapse(true)
    window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(r)
    savedRange.current = r.cloneRange()
  }, [])

  const insertTable = useCallback((rows: number, cols: number) => {
    const cellStyle = "border:1px solid #e4e4e7;padding:8px 12px;min-width:60px;"
    const table = document.createElement("table")
    table.style.cssText = "border-collapse:collapse;width:100%;margin:16px 0;table-layout:fixed"
    const tbody = document.createElement("tbody")
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr")
      for (let c = 0; c < cols; c++) {
        const td = document.createElement("td"); td.style.cssText = cellStyle; td.appendChild(document.createElement("br")); tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    const spacer = document.createElement("p"); spacer.appendChild(document.createElement("br"))
    restoreSelection()
    const range = getRangeAtSaved()
    range.deleteContents(); range.insertNode(spacer); range.insertNode(table)
    focusFirstCell(table.querySelector("td"))
    restoreSelection()
  }, [focusFirstCell, getRangeAtSaved, restoreSelection])

  const insertColumns = useCallback((num: number) => {
    const grid = document.createElement("div")
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${num},1fr);gap:16px;margin:16px 0`
    for (let i = 0; i < num; i++) {
      const col = document.createElement("div"); col.style.cssText = "border:1px dashed #e4e4e7;padding:12px;min-height:80px;"; col.appendChild(document.createElement("br")); grid.appendChild(col)
    }
    const spacer = document.createElement("p"); spacer.appendChild(document.createElement("br"))
    restoreSelection()
    const range = getRangeAtSaved()
    const frag = document.createDocumentFragment(); frag.appendChild(grid); frag.appendChild(spacer)
    range.deleteContents(); range.insertNode(frag)
    focusFirstCell(grid.firstElementChild)
  }, [focusFirstCell, getRangeAtSaved, restoreSelection])

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent) => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)

    // Handwritten Erase Effect
    if (e.key === "Backspace" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (!range.collapsed) {
        e.preventDefault()
        
        const paper = document.getElementById("editor-paper")
        const rect = range.getBoundingClientRect()
        if (paper && rect.width > 0) {
          let zoom = 1
          const zoomWrapper = document.querySelector('.max-w-5xl.shrink-0') as HTMLElement
          if (zoomWrapper && zoomWrapper.style.zoom) zoom = parseFloat(zoomWrapper.style.zoom) || 1
          
          const paperRect = paper.getBoundingClientRect()
          const ghost = document.createElement("div")
          ghost.className = "erased"
          ghost.style.position = "absolute"
          ghost.style.left = ((rect.left - paperRect.left) / zoom) + "px"
          ghost.style.top = ((rect.top - paperRect.top) / zoom) + "px"
          ghost.style.width = (rect.width / zoom) + "px"
          ghost.style.height = (rect.height / zoom) + "px"
          ghost.style.overflow = "hidden"
          
          let parent = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer as HTMLElement
          if (parent) {
            const comp = window.getComputedStyle(parent)
            ghost.style.fontFamily = comp.fontFamily
            ghost.style.fontSize = comp.fontSize
            ghost.style.fontWeight = comp.fontWeight
            ghost.style.lineHeight = comp.lineHeight
            ghost.style.color = comp.color
          }
          ghost.appendChild(range.cloneContents())
          ghost.onanimationend = () => ghost.remove()
          
          let layer = document.getElementById("ghost-layer")
          if (!layer) {
            layer = document.createElement("div")
            layer.id = "ghost-layer"
            layer.style.position = "absolute"
            layer.style.inset = "0"
            layer.style.pointerEvents = "none"
            layer.style.zIndex = "40"
            paper.appendChild(layer)
          }
          layer.appendChild(ghost)
        }
        
        range.deleteContents()
        syncContent()
        return
      } else if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
        e.preventDefault()
        const textNode = range.startContainer as Text
        const offset = range.startOffset
        
        const charRange = document.createRange()
        charRange.setStart(textNode, offset - 1)
        charRange.setEnd(textNode, offset)
        const rect = charRange.getBoundingClientRect()
        
        const paper = document.getElementById("editor-paper")
        if (paper && rect.width > 0) {
          let zoom = 1
          const zoomWrapper = document.querySelector('.max-w-5xl.shrink-0') as HTMLElement
          if (zoomWrapper && zoomWrapper.style.zoom) zoom = parseFloat(zoomWrapper.style.zoom) || 1
          
          const paperRect = paper.getBoundingClientRect()
          const ghost = document.createElement("span")
          ghost.className = "erased"
          ghost.style.position = "absolute"
          ghost.style.left = ((rect.left - paperRect.left) / zoom) + "px"
          ghost.style.top = ((rect.top - paperRect.top) / zoom) + "px"
          
          if (textNode.parentElement) {
            const comp = window.getComputedStyle(textNode.parentElement)
            ghost.style.fontFamily = comp.fontFamily
            ghost.style.fontSize = comp.fontSize
            ghost.style.fontWeight = comp.fontWeight
            ghost.style.lineHeight = comp.lineHeight
            ghost.style.color = comp.color
            ghost.style.letterSpacing = comp.letterSpacing
          }
          
          ghost.textContent = textNode.textContent?.charAt(offset - 1) || ""
          ghost.onanimationend = () => ghost.remove()
          
          let layer = document.getElementById("ghost-layer")
          if (!layer) {
            layer = document.createElement("div")
            layer.id = "ghost-layer"
            layer.style.position = "absolute"
            layer.style.inset = "0"
            layer.style.pointerEvents = "none"
            layer.style.zIndex = "40"
            paper.appendChild(layer)
          }
          layer.appendChild(ghost)
        }
        
        textNode.deleteData(offset - 1, 1)
        syncContent()
        return
      }
    }

    // Blockquote handling
    let blockquote: HTMLElement | null = null
    let n: Node | null = range.startContainer
    while (n && n !== editorRef.current) {
      if ((n as HTMLElement).tagName === "BLOCKQUOTE") { blockquote = n as HTMLElement; break }
      n = n.parentNode
    }
    if (blockquote) {
      if (e.key === "Enter") { e.preventDefault(); document.execCommand("insertHTML", false, "<br>"); return }
      if ((e.key === "Backspace" || e.key === "Delete") && !(blockquote.textContent ?? "").replace(/\u00a0/g, "").trim()) {
        e.preventDefault()
        const afterNode = blockquote.nextSibling; blockquote.remove()
        const nr = document.createRange()
        if (afterNode) nr.setStart(afterNode, 0)
        else if (editorRef.current) nr.setStart(editorRef.current, editorRef.current.childNodes.length)
        nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr); return
      }
    }

    // Task handling
    let taskItem: HTMLElement | null = null
    n = range.startContainer
    while (n && n !== editorRef.current) {
      if ((n as HTMLElement).classList?.contains("task-item")) { taskItem = n as HTMLElement; break }
      n = n.parentNode
    }
    if (taskItem) {
      if (e.key === "Enter") {
        e.preventDefault()
        const textSpan = taskItem.querySelector('span')
        if (!textSpan?.textContent?.replace(/\u00a0|\u200B/g, '').trim()) {
           taskItem.remove()
           document.execCommand("insertHTML", false, "<p><br></p>")
           return
        }
        const newTask = taskItem.cloneNode(true) as HTMLElement
        const newSpan = newTask.querySelector('span')
        if (newSpan) newSpan.innerHTML = "&#8203;"
        const cb = newTask.querySelector('input[type="checkbox"]') as HTMLInputElement
        if (cb) cb.checked = false
        taskItem.after(newTask)
        const nr = document.createRange()
        const targetNode = newSpan?.firstChild || newTask
        nr.setStart(targetNode, targetNode.nodeType === Node.TEXT_NODE ? 1 : 0)
        nr.collapse(true)
        sel.removeAllRanges(); sel.addRange(nr)
        return
      }
      if ((e.key === "Backspace" || e.key === "Delete") && !(taskItem.textContent ?? "").replace(/\u00a0|\u200B/g, "").trim()) {
        e.preventDefault()
        const afterNode = taskItem.nextSibling; taskItem.remove()
        const nr = document.createRange()
        if (afterNode) nr.setStart(afterNode, 0)
        else if (editorRef.current) nr.setStart(editorRef.current, editorRef.current.childNodes.length)
        nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr); return
      }
    }

    // Tab → table navigation
    if (e.key === "Tab") {
      let cell: HTMLElement | null = null, cn: Node | null = range.startContainer
      while (cn && cn !== editorRef.current) {
        const tag = (cn as HTMLElement).tagName
        if (tag === "TD" || tag === "TH") { cell = cn as HTMLElement; break }
        cn = cn.parentNode
      }
      if (cell) {
        e.preventDefault()
        const table = cell.closest("table")!
        const cells = Array.from(table.querySelectorAll<HTMLElement>("td, th"))
        const idx = cells.indexOf(cell)
        if (e.shiftKey && idx > 0) {
          const r = document.createRange(); r.selectNodeContents(cells[idx - 1]); r.collapse(false); sel.removeAllRanges(); sel.addRange(r)
        } else if (!e.shiftKey && idx < cells.length - 1) {
          const r = document.createRange(); r.selectNodeContents(cells[idx + 1]); r.collapse(false); sel.removeAllRanges(); sel.addRange(r)
        } else if (!e.shiftKey) {
          const numCols = cell.closest("tr")?.querySelectorAll("td, th").length ?? 1
          const tbody = table.querySelector("tbody") ?? table
          const newRow = document.createElement("tr")
          for (let i = 0; i < numCols; i++) {
            const td = document.createElement("td"); td.style.cssText = "border:1px solid #e4e4e7;padding:8px 12px;min-width:60px;"; td.innerHTML = "<br>"; newRow.appendChild(td)
          }
          tbody.appendChild(newRow)
          const r = document.createRange(); r.selectNodeContents(newRow.querySelector("td")!); r.collapse(true); sel.removeAllRanges(); sel.addRange(r)
        }
        return
      }
    }

    // Space → list autocomplete
    if (e.key !== " ") return
    const node = range.startContainer
    if (node.nodeType !== Node.TEXT_NODE) return
    const before = (node.textContent ?? "").slice(0, range.startOffset)
    const tryConvert = (cmd: string) => {
      e.preventDefault()
      const del = document.createRange(); del.setStart(node, 0); del.setEnd(node, range.startOffset)
      sel.removeAllRanges(); sel.addRange(del)
      // Convert to list first so the wrapper exists
      document.execCommand(cmd, false)
      // Then delete the trigger character
      document.execCommand("delete", false)
    }
    if (before === "*" || before === "-") tryConvert("insertUnorderedList")
    else if (/^\d+[\.\)]$/.test(before)) tryConvert("insertOrderedList")
  }, [editorRef])

  // Capture-phase listener: fires BEFORE browser processes <summary> default
  // behavior (toggling details open/closed), so we can fully control Enter/Backspace
  // inside toggle block headers without the browser interfering.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== 'Backspace') return
      const sel = window.getSelection()
      if (!sel || !sel.rangeCount) return

      let toggle: HTMLDetailsElement | null = null
      let summary: HTMLElement | null = null
      let editableRoot: Node | null = null
      let curr: Node | null = sel.getRangeAt(0).startContainer
      while (curr) {
        const el = curr as HTMLElement
        if (el.tagName === 'SUMMARY') summary = el
        if (el.tagName === 'DETAILS' && el.classList?.contains('toggle-block')) toggle = curr as HTMLDetailsElement
        if (el.contentEditable === 'true') { editableRoot = curr; break }
        curr = curr.parentNode
      }
      if (!toggle || !summary || !editableRoot) return

      const root = editableRoot

      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopImmediatePropagation()
        toggle.open = true
        requestAnimationFrame(() => {
          const content = toggle!.querySelector('div[data-placeholder*="Enter content"]') as HTMLElement | null
          if (!content) return
          if (!content.firstChild) content.innerHTML = '<br>'
          const r = document.createRange()
          r.setStart(content, 0); r.collapse(true)
          ;(root as HTMLElement).focus()
          const s = window.getSelection()
          s?.removeAllRanges(); s?.addRange(r)
          savedRange.current = r.cloneRange()
        })
        return
      }

      // Backspace: only delete toggle when header is empty
      const headerSpan = summary.querySelector('span')
      if (headerSpan?.textContent?.replace(/\u200B/g, '').trim()) return
      e.preventDefault()
      e.stopImmediatePropagation()
      const prev = toggle.previousSibling
      const next = toggle.nextSibling
      toggle.remove()
      const r = document.createRange()
      if (prev) { r.setStartAfter(prev); r.collapse(true) }
      else if (next) { r.setStart(next, 0); r.collapse(true) }
      else { r.setStart(root, 0); r.collapse(true) }
      const s = window.getSelection()
      s?.removeAllRanges(); s?.addRange(r)
      if (root === editorRef.current) {
        commitToState()
      } else {
        ;(root as HTMLElement).dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, []) // savedRange/editorRef are refs, commitToState is stable

  return { savedRange, saveSelection, restoreSelection, execCmd, insertHTML, applyFontSize, applyBlockStyle, toggleScript, insertTable, insertColumns, handleEditorKeyDown, syncContent, flushSync }
}
