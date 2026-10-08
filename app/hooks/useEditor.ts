"use client"
import { useRef, useCallback, useEffect } from "react"
import type { NoteData } from "@/app/types"

interface UseEditorOptions {
  editorRef: React.RefObject<HTMLDivElement | null>
  activeTabId: string | null
  currentPageIdx: number
  setNotes: (updater: NoteData[] | ((prev: NoteData[]) => NoteData[])) => void
  accent: string
}

export function useEditor({ editorRef, activeTabId, currentPageIdx, setNotes, accent }: UseEditorOptions) {
  const savedRange = useRef<Range | null>(null)

  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange()
  }, [])

  // Continuously track the last selection made inside any contenteditable so it
  // survives focus moving elsewhere (e.g. into the AI hub input). This lets the
  // AI apply edits back to the exact text the user had highlighted.
  useEffect(() => {
    const onSelChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const node = sel.getRangeAt(0).commonAncestorContainer
      const el = (node.nodeType === 1 ? node : node.parentNode) as HTMLElement | null
      if (el?.closest?.('[contenteditable="true"]')) {
        savedRange.current = sel.getRangeAt(0).cloneRange()
      }
    }
    document.addEventListener("selectionchange", onSelChange)
    return () => document.removeEventListener("selectionchange", onSelChange)
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
  useEffect(() => {
    activeTabIdRef.current = activeTabId
    currentPageIdxRef.current = currentPageIdx
  }, [activeTabId, currentPageIdx])

  const commitToState = useCallback(() => {
    const content = editorRef.current?.innerHTML || ""
    const tid = activeTabIdRef.current
    const pidx = currentPageIdxRef.current
    setNotes(prev => prev.map(n =>
      n.id === tid ? { ...n, pages: n.pages.map((p, i) => i === pidx ? content : p) } : n
    ))
  }, [editorRef, setNotes])

  // Called on every onInput — schedules a debounced state sync.
  // Text is contentEditable (not React-driven), so this debounce only gates
  // persistence + derived UI (word count, sidebar), not typing responsiveness.
  // Kept generous to avoid re-rendering the whole page on every keystroke;
  // blur / tab-switch / nav / unload all flushSync first, so nothing is lost.
  const syncContent = useCallback(() => {
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(commitToState, 250)
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
      h1: { fontSize: "2.75rem", fontWeight: "800", margin: "1.25rem 0" },
      h2: { fontSize: "1.75rem", fontWeight: "700", margin: "1rem 0" },
      h3: { fontSize: "1.35rem", fontWeight: "700", margin: "0.75rem 0" },
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
    const cellStyle = "border:1.5px solid rgba(0,0,0,0.15);padding:8px 12px;font-size:13px;min-width:80px;outline:none;"
    const headerRow = `<tr>${Array.from({ length: cols }, () => `<th style="${cellStyle}font-weight:600;text-align:left;"><br></th>`).join("")}</tr>`
    const bodyRows = Array.from({ length: rows - 1 }, () =>
      `<tr>${Array.from({ length: cols }, () => `<td style="${cellStyle}"><br></td>`).join("")}</tr>`
    ).join("")
    const html = `<div class="pulp-table-wrap" style="position:relative;margin:16px 0;"><table style="border-collapse:collapse;width:100%;table-layout:fixed;">${headerRow}${bodyRows}</table></div><p><br></p>`
    insertHTML(html)
  }, [insertHTML])

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

    // ─── Obsidian-style keyboard shortcuts ───────────────────────
    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
    const isBold = (isMac && e.metaKey && e.key === 'b') || (!isMac && e.ctrlKey && e.key === 'b')
    const isItalic = (isMac && e.metaKey && e.key === 'i') || (!isMac && e.ctrlKey && e.key === 'i')
    const isUnderline = (isMac && e.metaKey && e.key === 'u') || (!isMac && e.ctrlKey && e.key === 'u')
    const isStrikethrough = (isMac && e.metaKey && e.shiftKey && e.key === 'x') || (!isMac && e.ctrlKey && e.shiftKey && e.key === 'x')
    const isCodeBlock = (isMac && e.metaKey && e.shiftKey && e.key === 'e') || (!isMac && e.ctrlKey && e.shiftKey && e.key === 'e')

    if (isBold) {
      e.preventDefault()
      saveSelection()
      document.execCommand('bold', false)
      return
    }
    if (isItalic) {
      e.preventDefault()
      saveSelection()
      document.execCommand('italic', false)
      return
    }
    if (isUnderline) {
      e.preventDefault()
      saveSelection()
      document.execCommand('underline', false)
      return
    }
    if (isStrikethrough) {
      e.preventDefault()
      saveSelection()
      document.execCommand('strikeThrough', false)
      return
    }
    if (isCodeBlock) {
      e.preventDefault()
      saveSelection()
      insertHTML('<pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-family:monospace;overflow-x:auto"><code>code here</code></pre><br/>')
      return
    }
    // ──────────────────────────────────────────────────────────────

    // Let browser handle backspace normally - custom animation was causing bugs with rapid deletions
    // Just track that we need to sync content after deletion
    if (e.key === "Backspace") {
      // Allow natural browser deletion, but sync content after
      setTimeout(() => syncContent(), 0)
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

    // Lists, Docs-style: Tab nests the item one level (nested bullets change shape
    // via CSS: ● → ○ → ■), Shift+Tab un-nests it, Backspace at the start of a nested
    // item un-nests it. Works in the page and in text boxes.
    {
      const startEl = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer as HTMLElement : range.startContainer.parentElement
      const host = startEl?.closest<HTMLElement>('[contenteditable="true"]') ?? null
      const li = startEl?.closest("li") ?? null
      if (li && host && host.contains(li) && !li.closest("td, th")) {
        const list = li.parentElement
        const nested = !!list && !!list.parentElement && host.contains(list.parentElement) && !!list.parentElement.closest("ul, ol, li") && host.contains(list.parentElement.closest("ul, ol, li")!)
        const atStart = range.collapsed && (() => { const r = document.createRange(); r.setStart(li, 0); r.setEnd(range.startContainer, range.startOffset); return r.toString().replace(/\u200b/g, "") === "" })()
        if (e.key === "Tab" && !e.altKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault()
          if (!e.shiftKey) document.execCommand("indent")
          else if (nested) document.execCommand("outdent")
          syncContent()
          return
        }
        if (e.key === "Backspace" && nested && atStart) {
          e.preventDefault()
          document.execCommand("outdent")
          syncContent()
          return
        }
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
  }, [editorRef, syncContent, saveSelection, insertHTML])

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
  }, [editorRef, commitToState])

  // Table selection: click grip to select whole table, Backspace/Delete to remove
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Clicking the ::before pseudo-element fires on the .pulp-table-wrap itself
      // at coordinates above the table (the grip area)
      const wrap = target.closest('.pulp-table-wrap') as HTMLElement | null
      if (!wrap) {
        document.querySelectorAll('.pulp-table-selected').forEach(el => el.classList.remove('pulp-table-selected'))
        return
      }
      const rect = wrap.getBoundingClientRect()
      const isGripArea = e.clientY < rect.top + 4
      if (isGripArea || target === wrap) {
        e.preventDefault()
        e.stopPropagation()
        document.querySelectorAll('.pulp-table-selected').forEach(el => el.classList.remove('pulp-table-selected'))
        wrap.classList.add('pulp-table-selected')
        const sel = window.getSelection()
        const r = document.createRange()
        r.selectNode(wrap)
        sel?.removeAllRanges()
        sel?.addRange(r)
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return
      const selected = document.querySelector('.pulp-table-selected')
      if (!selected) return
      e.preventDefault()
      const next = selected.nextSibling || selected.previousSibling
      const parent = selected.parentNode
      selected.remove()
      if (next) {
        const r = document.createRange()
        r.setStart(next, 0); r.collapse(true)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(r)
      }
      if (parent) (parent as HTMLElement).dispatchEvent(new Event('input', { bubbles: true }))
    }

    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleKey, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keydown', handleKey, true)
    }
  }, [])

  return { savedRange, saveSelection, restoreSelection, execCmd, insertHTML, applyFontSize, applyBlockStyle, toggleScript, insertTable, insertColumns, handleEditorKeyDown, syncContent, flushSync }
}
