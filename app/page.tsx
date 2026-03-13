"use client"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { TextBox, NoteData, FolderData, DialogConfig } from "@/app/types"
import { AppDialog } from "@/app/components/AppDialog"
import { SettingsView } from "@/app/components/settings/SettingsView"
import { Sidebar } from "@/app/components/Sidebar"
import { FormattingToolbar } from "@/app/components/FormattingToolbar"
import { DocumentToolbar } from "@/app/components/DocumentToolbar"
import { RightToolbar } from "@/app/components/RightToolbar"





const START_ID = "00000000-0000-0000-0000-000000000001"

export default function NoteApp() {
  const uid = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const [notes, setNotes] = useState<NoteData[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [accent, setAccent] = useState("#600b2779")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [folders, setFolders] = useState<FolderData[]>([])
  const [isLoading, setIsLoading] = useState(true) // Add this
  const [activeTabId, setActiveTabId] = useState<string | null>(null) // Start null
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [zoom, setZoom] = useState("0.85")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [gridView, setGridView] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [bindingCompact, setBindingCompact] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<number | null>(null)
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)
  const [boxMode, setBoxMode] = useState(false)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [draftBox, setDraftBox] = useState<TextBox | null>(null)
  const [draggingBox, setDraggingBox] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [customSize, setCustomSize] = useState("16")
  const [dialog, setDialog] = useState<DialogConfig | null>(null)

  const openPrompt  = (title: string, defaultValue: string, placeholder: string, confirmLabel: string, onConfirm: (v: string) => void) =>
    setDialog({ type: "prompt", title, defaultValue, placeholder, confirmLabel, onConfirm })
  const openConfirm = (title: string, message: string, confirmLabel: string, danger: boolean, onConfirm: () => void) =>
    setDialog({ type: "confirm", title, message, confirmLabel, danger, onConfirm })
  const openAlert   = (title: string, message?: string) =>
    setDialog({ type: "alert", title, message })
  const [autoSave, setAutoSave] = useState(true)
  const [spellCheck, setSpellCheck] = useState(true)
  const [editorFont, setEditorFont] = useState("EB Garamond")
  const [lineSpacing, setLineSpacing] = useState<"compact"|"normal"|"relaxed">("normal")
  const [paperStyle, setPaperStyle] = useState<"lined"|"dotgrid"|"plain"|"stenopad">("lined")
  const [showBinding, setShowBinding] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [sidebarOnStart, setSidebarOnStart] = useState(true)
  const [bgEffect, setBgEffect] = useState(true)
  // 1. Add these two states near the other useState declarations
  const [sketchMode, setSketchMode] = useState(false)
  const [sketchPrompt, setSketchPrompt] = useState("")
  const [loadingBoxId, setLoadingBoxId] = useState<string | null>(null)
  // 2. Refactor generateSketch
const generateSketch = async (prompt: string, boxId: string) => {
  if (!prompt.trim() || !activeTabId) return;

  setLoadingBoxId(boxId);

  try {
    const res = await fetch("/api/sketch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (!data.url) {
      console.warn("No image URL returned from /api/sketch", data);
      return;
    }

    // Update using functional updater → safer with async
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === activeTabId
          ? {
              ...note,
              boxes: {
                ...note.boxes,
                [currentPageIdx]: (note.boxes[currentPageIdx] || []).map(box =>
                  box.id === boxId ? { ...box, content: data.url } : box
                )
              }
            }
          : note
      )
    );
  } catch (err) {
    console.error("Sketch generation failed:", err);
    // Optional: show toast / mark box as failed
  } finally {
    setLoadingBoxId(null);
  }
};


  const editorRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const activeNote = (notes.find(n => n.id === activeTabId) ?? notes[0]) as NoteData

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 1. Check if someone is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })


    // 2. Listen for changes (using 'any' to stop the red lines)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: any) => {
      setUser(session?.user ?? null)
    })


    return () => subscription.unsubscribe()
  }, [])


  useEffect(() => {
    const check = () => {
      if (paperRef.current) setBindingCompact(paperRef.current.offsetWidth < 680)
    }
    check()
    const ro = new ResizeObserver(check)
    if (paperRef.current) ro.observe(paperRef.current)
    return () => ro.disconnect()
  }, [])


  useEffect(() => {
    const saveToCloud = async () => {
      if (!autoSave || isLoading || !activeNote || !user) return
      if (!activeNote || !user) return // Don't save if no one is logged in!


      const { error } = await supabase
        .from('notes')
        .upsert({
          id: activeNote.id,
          subject: activeNote.subject,
          pages: activeNote.pages,
          boxes: activeNote.boxes,
          folder_id: activeNote.folderId,  // add this
          user_id: user.id // Uses the ID from the ✅ checkmark
        })


      if (error) console.error("Save failed:", error.message)
      else console.log("Autosaved to cloud!")
    }


    const timer = setTimeout(saveToCloud, 2000)
    return () => clearTimeout(timer)
  }, [activeNote, user]) // Critical: user must be here!


  useEffect(() => {
    if (!activeNote) return
    if (!gridView && editorRef.current &&
        editorRef.current.innerHTML !== activeNote.pages[currentPageIdx]) {
      editorRef.current.innerHTML = activeNote.pages[currentPageIdx] || ""
    }
  }, [activeTabId, currentPageIdx, gridView, activeNote])


  useEffect(() => {
      const fetchNotes = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', currentUser.id)

        if (!error && data && data.length > 0) {
          setNotes(data.map(n => ({
            id: n.id,
            subject: n.subject,
            pages: n.pages ?? [""],
            boxes: n.boxes ?? {},
            folderId: n.folder_id ?? null,   // ← this is the key fix
          })))
          setActiveTabId(data[0].id)
        } else {
          setNotes([])
          setActiveTabId(null)
        }
        setIsLoading(false)
      }

      fetchNotes()
    }, [user])


  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange()
  }


  const restoreSelection = () => {
    editorRef.current?.focus()
    const sel = window.getSelection()
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current) }
  }


  const toggleScript = (cmd: "superscript" | "subscript") => {
    const tag = cmd === "superscript" ? "SUP" : "SUB"
    const saved = savedRange.current

    // Walk saved range BEFORE focus changes anything
    let node: Node | null = saved?.commonAncestorContainer ?? null
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode
    let scriptEl: HTMLElement | null = null
    while (node && node !== editorRef.current) {
      if ((node as HTMLElement).tagName === tag) { scriptEl = node as HTMLElement; break }
      node = node.parentNode
    }

    editorRef.current?.focus()
    const sel = window.getSelection()

    if (scriptEl && scriptEl.parentNode) {
      if (saved && !saved.collapsed) {
        // Text is selected inside the element — unwrap to remove the formatting
        const parent = scriptEl.parentNode
        while (scriptEl.firstChild) parent.insertBefore(scriptEl.firstChild, scriptEl)
        parent.removeChild(scriptEl)
        try { sel?.removeAllRanges(); sel?.addRange(saved) } catch { /* stale */ }
        saveSelection()
      } else {
        // Collapsed cursor — just escape: place cursor right after the element
        // so the already-typed super/subscript text stays intact
        const newRange = document.createRange()
        newRange.setStartAfter(scriptEl)
        newRange.collapse(true)
        sel?.removeAllRanges()
        sel?.addRange(newRange)
        savedRange.current = newRange.cloneRange()
      }
    } else {
      // APPLY
      if (saved) { sel?.removeAllRanges(); sel?.addRange(saved) }
      document.execCommand(cmd, false)
      saveSelection()
    }
  }

  const execCmd = (cmd: string, value?: string) => {
    restoreSelection()
    document.execCommand(cmd, false, value)
    saveSelection()
    editorRef.current?.focus()
  }


  const insertHTML = (html: string) => {
    restoreSelection()
    document.execCommand("insertHTML", false, html)
    saveSelection()
    editorRef.current?.focus()
  }


  const applyFontSize = (sizePx: string) => {
    if (!sizePx || isNaN(Number(sizePx))) return
    restoreSelection()

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) { editorRef.current?.focus(); return }

    const range = sel.getRangeAt(0)
    if (range.collapsed) { editorRef.current?.focus(); return }

    // Extract selected content, wrap in a new span, strip nested font-size overrides,
    // then re-insert and re-select — same pattern as Google Docs
    const span = document.createElement("span")
    span.style.fontSize = sizePx + "px"
    const fragment = range.extractContents()
    // Strip any existing font-size styles from moved nodes so the outer span wins
    const tmp = document.createElement("div")
    tmp.appendChild(fragment)
    tmp.querySelectorAll<HTMLElement>("[style]").forEach(el => el.style.removeProperty("font-size"))
    // Also unwrap any empty font-size-only spans left behind
    tmp.querySelectorAll<HTMLElement>("span").forEach(el => {
      if (!el.getAttribute("style") && el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE) {
        el.replaceWith(el.firstChild)
      }
    })
    while (tmp.firstChild) span.appendChild(tmp.firstChild)

    range.insertNode(span)

    // Re-select the span contents so the selection stays visible (like Google Docs)
    const newRange = document.createRange()
    newRange.selectNodeContents(span)
    sel.removeAllRanges()
    sel.addRange(newRange)
    savedRange.current = newRange.cloneRange()

    editorRef.current?.focus()
  }


  const applyBlockStyle = (tag: string) => {
    const editor = editorRef.current
    if (!editor) return

    const headingStyles: Record<string, { fontSize: string; fontWeight: string; margin: string }> = {
      h1: { fontSize: "3rem",    fontWeight: "800", margin: "1.25rem 0" },
      h2: { fontSize: "2.25rem", fontWeight: "700", margin: "1rem 0" },
      h3: { fontSize: "1.75rem", fontWeight: "700", margin: "0.75rem 0" },
    }

    if (!savedRange.current) { editor.focus(); return }

    // "default" strips heading tags and inline styles, resetting to plain text
    if (tag === "default") {
      restoreSelection()
      document.execCommand("formatBlock", false, "p")
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.getRangeAt(0).commonAncestorContainer
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode
        const block = (node as HTMLElement).closest("p") as HTMLElement | null
        if (block) {
          block.style.fontSize = ""; block.style.fontWeight = ""; block.style.margin = ""
          const newRange = document.createRange()
          newRange.selectNodeContents(block)
          sel.removeAllRanges(); sel.addRange(newRange)
          savedRange.current = newRange.cloneRange()
        }
      }
      const content = editor.innerHTML
      setNotes(prev => prev.map(n =>
        n.id === activeTabId
          ? { ...n, pages: n.pages.map((p, i) => i === currentPageIdx ? content : p) }
          : n
      ))
      return
    }

    // restoreSelection focuses editor and re-adds the saved range
    restoreSelection()

    document.execCommand("formatBlock", false, tag)

    // .closest(tag) reliably finds the element formatBlock just created/converted
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode
      const block = (node as HTMLElement).closest(tag) as HTMLElement | null
      if (block) {
        const s = headingStyles[tag]
        if (s) {
          block.style.fontSize   = s.fontSize
          block.style.fontWeight = s.fontWeight
          block.style.margin     = s.margin
          block.style.display    = "block"
        }
        // Keep text highlighted after the change
        const newRange = document.createRange()
        newRange.selectNodeContents(block)
        sel.removeAllRanges()
        sel.addRange(newRange)
        savedRange.current = newRange.cloneRange()
      }
    }

    // Sync state so React doesn't overwrite the DOM on next render
    const content = editor.innerHTML
    setNotes(prev => prev.map(n =>
      n.id === activeTabId
        ? { ...n, pages: n.pages.map((p, i) => i === currentPageIdx ? content : p) }
        : n
    ))
  }


  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)

    // Find if cursor is inside a blockquote
    let blockquote: HTMLElement | null = null
    let n: Node | null = range.startContainer
    while (n && n !== editorRef.current) {
      if ((n as HTMLElement).tagName === "BLOCKQUOTE") { blockquote = n as HTMLElement; break }
      n = n.parentNode
    }

    if (blockquote) {
      if (e.key === "Enter") {
        // Stay inside the quote box on Enter instead of breaking out
        e.preventDefault()
        document.execCommand("insertHTML", false, "<br>")
        return
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        // If blockquote is effectively empty, remove it cleanly to avoid
        // the browser merging it and leaving residual background-color on text
        const text = (blockquote.textContent ?? "").replace(/\u00a0/g, "").trim()
        if (text === "") {
          e.preventDefault()
          const afterNode = blockquote.nextSibling
          blockquote.remove()
          const newRange = document.createRange()
          if (afterNode) { newRange.setStart(afterNode, 0) }
          else if (editorRef.current) { newRange.setStart(editorRef.current, editorRef.current.childNodes.length) }
          newRange.collapse(true)
          sel.removeAllRanges()
          sel.addRange(newRange)
          return
        }
      }
    }

    // Tab → navigate between table cells
    if (e.key === "Tab") {
      let cell: HTMLElement | null = null
      let cn: Node | null = range.startContainer
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
        if (e.shiftKey) {
          // Move to previous cell
          if (idx > 0) {
            const prev = cells[idx - 1]
            const r = document.createRange(); r.selectNodeContents(prev); r.collapse(false)
            sel.removeAllRanges(); sel.addRange(r)
          }
        } else if (idx < cells.length - 1) {
          // Move to next cell
          const next = cells[idx + 1]
          const r = document.createRange(); r.selectNodeContents(next); r.collapse(false)
          sel.removeAllRanges(); sel.addRange(r)
        } else {
          // Last cell → append a new row
          const numCols = (cell.closest("tr")?.querySelectorAll("td, th").length) ?? 1
          const tbody = table.querySelector("tbody") ?? table
          const newRow = document.createElement("tr")
          for (let i = 0; i < numCols; i++) {
            const td = document.createElement("td")
            td.style.cssText = "border:1px solid #e4e4e7;padding:8px 12px;min-width:60px;"
            td.innerHTML = "<br>"
            newRow.appendChild(td)
          }
          tbody.appendChild(newRow)
          const firstCell = newRow.querySelector("td")!
          const r = document.createRange(); r.selectNodeContents(firstCell); r.collapse(true)
          sel.removeAllRanges(); sel.addRange(r)
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
      const del = document.createRange()
      del.setStart(node, 0); del.setEnd(node, range.startOffset)
      sel.removeAllRanges(); sel.addRange(del)
      document.execCommand("delete", false)
      document.execCommand(cmd, false)
    }
    if (before === "*") tryConvert("insertUnorderedList")
    else if (/^\d+\.$/.test(before)) tryConvert("insertOrderedList")
  }


  const insertTable = (rows: number, cols: number) => {
    // Build table DOM directly — more reliable than execCommand("insertHTML")
    const cellStyle = "border:1px solid #e4e4e7;padding:8px 12px;min-width:60px;"
    const table = document.createElement("table")
    table.style.cssText = "border-collapse:collapse;width:100%;margin:16px 0;table-layout:fixed"
    const tbody = document.createElement("tbody")
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr")
      for (let c = 0; c < cols; c++) {
        const td = document.createElement("td")
        td.style.cssText = cellStyle
        td.appendChild(document.createElement("br"))
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    const spacer = document.createElement("p")
    spacer.appendChild(document.createElement("br"))

    // Find insertion point: use saved range, or end of editor
    const editor = editorRef.current
    if (!editor) return
    editor.focus()

    let range: Range | null = null
    if (savedRange.current) {
      try {
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(savedRange.current)
        range = savedRange.current.cloneRange()
        range.collapse(true)
      } catch { range = null }
    }
    if (!range) {
      range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
    }

    range.deleteContents()
    range.insertNode(spacer)
    range.insertNode(table)

    // Place cursor in first cell
    const firstCell = table.querySelector("td")
    if (firstCell) {
      const cur = document.createRange()
      cur.setStart(firstCell, 0)
      cur.collapse(true)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(cur)
      savedRange.current = cur.cloneRange()
    }
    editor.focus()
  }


  const insertColumns = (num: number) => {
    const editor = editorRef.current
    if (!editor) return

    const grid = document.createElement("div")
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${num},1fr);gap:16px;margin:16px 0`
    for (let i = 0; i < num; i++) {
      const col = document.createElement("div")
      col.style.cssText = "border:1px dashed #e4e4e7;padding:12px;min-height:80px;"
      col.appendChild(document.createElement("br"))
      grid.appendChild(col)
    }
    const spacer = document.createElement("p")
    spacer.appendChild(document.createElement("br"))

    editor.focus()
    let range: Range | null = null
    if (savedRange.current) {
      try {
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(savedRange.current)
        range = savedRange.current.cloneRange()
        range.collapse(true)
      } catch { range = null }
    }
    if (!range) {
      range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
    }

    const frag = document.createDocumentFragment()
    frag.appendChild(grid)
    frag.appendChild(spacer)
    range.deleteContents()
    range.insertNode(frag)

    // Place cursor in first column
    const firstCol = grid.firstElementChild as HTMLElement | null
    if (firstCol) {
      const cur = document.createRange()
      cur.setStart(firstCol, 0)
      cur.collapse(true)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(cur)
      savedRange.current = cur.cloneRange()
    }
    editor.focus()
  }


  const getPaperXY = (e: React.MouseEvent): { x: number; y: number } => {
    const r = paperRef.current!.getBoundingClientRect()
    const s = parseFloat(zoom)
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }
  }


  const onPaperMouseDown = (e: React.MouseEvent) => {
    if (!boxMode) return
    e.preventDefault()
    const { x, y } = getPaperXY(e)
    setDrawStart({ x, y })
  setDraftBox({ id: uid(), x, y, w: 0, h: 0, content: "" })
    setSelectedBoxId(null)
  }


  const onPaperMouseMove=(e:React.MouseEvent)=>{
    if(draggingBox){
      const {x,y}=getPaperXY(e)
      const b={...activeNote.boxes}
      b[currentPageIdx]=b[currentPageIdx].map(bb=>bb.id===draggingBox.id?{...bb,x:x-draggingBox.offsetX,y:y-draggingBox.offsetY}:bb)
      setNotes(notes.map(n=>n.id===activeTabId?{...n,boxes:b}:n))
      return
    }
    if(!boxMode||!drawStart)return
    const {x,y}=getPaperXY(e)
    setDraftBox({id:draftBox?.id??uid(), x:drawStart.x, y:drawStart.y, w:x-drawStart.x, h:y-drawStart.y, content:""})
  }


  // 4. Replace onPaperMouseUp

 const onPaperMouseUp = () => {
  if (draggingBox) { setDraggingBox(null); return }
  if (!boxMode || !draftBox) return
  if (Math.abs(draftBox.w) > 15 && Math.abs(draftBox.h) > 15) {
    const committed = { ...draftBox, id: uid() }
    const b = { ...activeNote.boxes }
    if (!b[currentPageIdx]) b[currentPageIdx] = []
    b[currentPageIdx] = [...b[currentPageIdx], committed]
    setNotes(notes.map(n => n.id === activeTabId ? { ...n, boxes: b } : n))
    setSelectedBoxId(committed.id)

if (sketchMode) {
  const newBoxId = committed.id;           // fresh id
  setSelectedBoxId(newBoxId);

    // Give React one render cycle to include the new box in state
    requestAnimationFrame(() => {
      generateSketch(sketchPrompt, newBoxId);
    });

    setSketchMode(false);
    setBoxMode(false);
    setSketchPrompt("");   // optional cleanup
  }
    }
    setDrawStart(null)
    setDraftBox(null)
  }


  const deleteBox = (boxId: string) => {
    const updatedBoxes = { ...activeNote.boxes }
    updatedBoxes[currentPageIdx] = updatedBoxes[currentPageIdx].filter(b => b.id !== boxId)
    setNotes(notes.map(n => n.id === activeTabId ? { ...n, boxes: updatedBoxes } : n))
    setSelectedBoxId(null)
  }


  const updateBoxContent = (boxId: string, text: string) => {
    const updatedBoxes = { ...activeNote.boxes }
    updatedBoxes[currentPageIdx] = updatedBoxes[currentPageIdx].map(b => b.id === boxId ? { ...b, content: text } : b)
    setNotes(notes.map(n => n.id === activeTabId ? { ...n, boxes: updatedBoxes } : n))
  }


  const onBoxMouseDown = (e: React.MouseEvent<HTMLDivElement>, box: TextBox) => {
    // 1. If clicking delete button, exit
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    // 2. If clicking the RESIZE HANDLE (bottom-right 20px), don't start a drag
    const rect = e.currentTarget.getBoundingClientRect();
    const isResizeZone = (e.clientX > rect.right - 20) && (e.clientY > rect.bottom - 20);
    if (isResizeZone) return;

    e.stopPropagation();
    setSelectedBoxId(box.id);
    e.currentTarget.focus();

    // 3. Start drag only if in boxMode OR clicking the container border
    if (boxMode || e.target === e.currentTarget) {
      const { x, y } = getPaperXY(e);
      setDraggingBox({ id: box.id, offsetX: x - box.x, offsetY: y - box.y });
    }
  };


  const handleDropNote = (e: React.DragEvent, targetFolderId: number | null, targetNoteId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedNoteId || draggedNoteId === targetNoteId) return
    setNotes(prev => {
      const copy = [...prev]
      const draggedIdx = copy.findIndex(n => n.id === draggedNoteId)
      if (draggedIdx === -1) return prev
      const draggedNote = { ...copy[draggedIdx], folderId: targetFolderId }
      copy.splice(draggedIdx, 1)
      if (targetNoteId) {
        const targetIdx = copy.findIndex(n => n.id === targetNoteId)
        copy.splice(targetIdx, 0, draggedNote)
      } else copy.push(draggedNote)
      return copy
    })
    setDraggedNoteId(null)
  }


  const addNote = (folderId: number | null = null) => {
    openPrompt("Name your note", "New Note", "Note name…", "Create", (name) => {
      if (!name.trim()) return
      const id = uid()
      setNotes(prev => [...prev, { id, subject: name.trim(), pages: [""], folderId, boxes: {} }])
      setActiveTabId(id)
      setCurrentPageIdx(0)
    })
  }

  const clearPage = () => {
    openConfirm("Clear this page?", "All content on this page will be deleted. This cannot be undone.", "Clear", true, () => {
      if (editorRef.current) editorRef.current.innerHTML = ""
      setNotes(prev => prev.map(n => {
        if (n.id !== activeTabId) return n
        const newPages = [...n.pages]; newPages[currentPageIdx] = ""
        const newBoxes = { ...n.boxes }; newBoxes[currentPageIdx] = []
        return { ...n, pages: newPages, boxes: newBoxes }
      }))
    })
  }

  const renameNote = (id: string, currentName: string) => {
    openPrompt("Rename note", currentName, "Note name…", "Rename", (newName) => {
      if (newName.trim()) setNotes(prev => prev.map(n => n.id === id ? { ...n, subject: newName.trim() } : n))
    })
  }

  const deleteNote = async (id: string) => {
    openConfirm("Delete note?", "This cannot be undone.", "Delete", true, async () => {
      setNotes(prev => prev.filter(n => n.id !== id))
      if (activeTabId === id) setActiveTabId(notes.find(n => n.id !== id)?.id ?? null)
      if (user) await supabase.from('notes').delete().eq('id', id)
    })
  }

  const deleteFolder = (id: number) => {
    openConfirm("Delete folder?", "Notes inside will be moved to root.", "Delete", true, () => {
      setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n))
      setFolders(prev => prev.filter(f => f.id !== id))
    })
  }


  const addFolder = () => {
    const id = Date.now()
    setFolders(prev => [...prev, { id, name: "New Folder", open: true }])
    setRenamingFolder(id)
  }


  const toggleFolder = (id: number) => setFolders(prev => prev.map(f => f.id === id ? { ...f, open: !f.open } : f))
  const renameFolder = (id: number, name: string) => setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))


  const downloadNote = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeNote.subject}</title>
    <style>body{font-family:Georgia,serif;max-width:720px;margin:0 auto;padding:48px;color:#1a1a1a}
    h1{color:${accent};margin-bottom:32px}hr{border:none;border-top:1px solid #ddd;margin:32px 0}
    h3{color:${accent}88;font-size:12px;text-transform:uppercase;letter-spacing:.1em}</style>
    </head><body><h1>${activeNote.subject}</h1>
    ${activeNote.pages.map((p, i) => `<section><h3>Page ${i + 1}</h3><div>${p || "<em style='color:#bbb'>Empty page</em>"}</div></section>`).join("<hr/>")}</body></html>`
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }))
    a.download = `${activeNote.subject.replace(/[^a-z0-9]/gi, "_")}.html`
    a.click()
  }


  const btnBase = "w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-zinc-200"


      if (isLoading) {
      return (
        <div className="h-screen bg-[#110d0e] flex items-center justify-center text-white font-sans">
          <div className="animate-pulse text-xl">Loading Letter Soup...</div>
        </div>
      )
    }

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: theme === "dark" ? "#1C1C1E" : "#F0ECEA", color: theme === "dark" ? "#E5E5E7" : "#1A1A1A", backgroundImage: bgEffect ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='${theme === "dark" ? "0.035" : "0.045"}'/%3E%3C/svg%3E")` : undefined, backgroundRepeat: "repeat" }}>
      {dialog && <AppDialog config={dialog} accent={accent} onClose={() => setDialog(null)} />}
      {showSettings && <SettingsView user={user} onClose={() => setShowSettings(false)} accentColor={accent} setAccentColor={setAccent} theme={theme} setTheme={setTheme} autoSave={autoSave} setAutoSave={setAutoSave} spellCheck={spellCheck} setSpellCheck={setSpellCheck} editorFont={editorFont} setEditorFont={setEditorFont} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} paperStyle={paperStyle} setPaperStyle={setPaperStyle} showBinding={showBinding} setShowBinding={setShowBinding} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} sidebarOnStart={sidebarOnStart} setSidebarOnStart={setSidebarOnStart} bgEffect={bgEffect} setBgEffect={setBgEffect} />}
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Bilbo&family=Licorice&family=Original+Surfer&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');${reduceMotion ? "*, *::before, *::after { transition: none !important; animation: none !important; }" : ""}` }} />
      {theme === "dark" && <style dangerouslySetInnerHTML={{ __html: `.ls-toolbar { background-color: #2C2C2E !important; border-color: #38383A !important; } .ls-toolbar button { background-color: #3A3A3C !important; color: #E5E5E7 !important; border-color: #48484A !important; } .ls-toolbar select, .ls-toolbar input { background-color: #3A3A3C !important; color: #E5E5E7 !important; border-color: #48484A !important; } .ls-toolbar .text-zinc-600 { color: #A1A1AA !important; } .ls-toolbar .border-zinc-200 { border-color: #48484A !important; }` }} />}
      <Sidebar
        notes={notes} folders={folders} activeTabId={activeTabId} accent={accent}
        draggedNoteId={draggedNoteId} renamingFolder={renamingFolder} user={user} sidebarOpen={sidebarOpen}
        onAddNote={addNote} onAddFolder={addFolder}
        onSelectNote={(id) => { setActiveTabId(id); setCurrentPageIdx(0) }}
        onRenameNote={renameNote} onDeleteNote={deleteNote}
        onToggleFolder={toggleFolder} onRenameFolder={renameFolder} onDeleteFolder={deleteFolder}
        onSetRenamingFolder={setRenamingFolder} onSetDraggedNoteId={setDraggedNoteId}
        onDropNote={handleDropNote} onOpenSettings={() => setShowSettings(true)}
      />


      <div className="flex-1 flex flex-col overflow-hidden relative">
        <button onClick={() => setSidebarOpen(v => !v)} className="absolute left-2 top-[54px] z-50 text-zinc-400 hover:text-zinc-700 transition-colors p-1 text-2xl leading-none">
          {sidebarOpen ? "‹" : "›"}
        </button>

      {notes.length > 0 && <>
        <FormattingToolbar
          accent={accent} btnBase={btnBase} execCmd={execCmd} saveSelection={saveSelection}
          toggleScript={toggleScript} insertHTML={insertHTML} openAlert={openAlert}
          downloadNote={downloadNote} editorRef={editorRef}
        />
        <DocumentToolbar
          accent={accent} zoom={zoom} customSize={customSize}
          saveSelection={saveSelection} execCmd={execCmd} applyFontSize={applyFontSize}
          applyBlockStyle={applyBlockStyle} setCustomSize={setCustomSize} setZoom={setZoom}
          insertTable={insertTable} insertColumns={insertColumns}
        />
      </>}

      <div className="flex-1 flex overflow-hidden relative">
          {notes.length === 0 ? (
            <main className="flex-1 flex items-center justify-center bg-[#EDE8E6]">
              <div className="text-center">
                <p
                  className="text-5xl font-bold mb-6"
                  style={{ fontFamily: '"Licorice", cursive', color: accent }}
                >
                  Ready?
                </p>
                <button
                  onClick={() => addNote(null)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white mx-auto transition-all hover:scale-110"
                  style={{ backgroundColor: accent }}
                >
                  +
                </button>
              </div>
            </main>
          ) : gridView ? (
          <main className="flex-1 flex flex-col overflow-hidden select-none" style={{ backgroundColor: theme === "dark" ? "#0e0e0e" : "#E8E3E0" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-5 pb-0 shrink-0">
              <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>{activeNote.subject}</h2>
              <button onClick={() => setGridView(false)} className="text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors font-medium">← Back to editor</button>
            </div>

            {/* Carousel stage */}
            <div className="flex-1 flex items-center justify-center" style={{ perspective: "1400px" }}>
              <div className="relative w-full h-full flex items-center justify-center">
                {[-1, 0, 1].map(offset => {
                  const idx = carouselIdx + offset
                  const isNewCard = idx === activeNote.pages.length && offset === 1
                  if (idx < 0 || (idx >= activeNote.pages.length && !isNewCard)) return null
                  const isCenter = offset === 0
                  const page = activeNote.pages[idx] ?? ""

                  const lhMap: Record<string, number> = { compact: 24, normal: 32, relaxed: 40 }
                  const lh = lhMap[lineSpacing] ?? 32
                  const lineColor = theme === "dark" ? "#3a3a3a" : "#e4e4e7"
                  const paperBg = paperStyle === "stenopad" ? "#F5EDB8" : theme === "dark" ? "#2C2C2E" : "#ffffff"
                  const bgImage = paperStyle === "plain" ? "none"
                    : paperStyle === "dotgrid" ? `radial-gradient(circle, ${lineColor} 1px, transparent 1px)`
                    : paperStyle === "stenopad" ? `linear-gradient(to right, transparent 111px, #C17A7A 111px, #C17A7A 113px, transparent 113px), linear-gradient(to right, transparent 120px, #C17A7A 120px, #C17A7A 122px, transparent 122px), linear-gradient(transparent ${lh - 1}px, #3DBECB ${lh}px)`
                    : `linear-gradient(transparent ${lh - 1}px, ${lineColor} ${lh}px)`
                  const bgSize = paperStyle === "plain" ? "auto"
                    : paperStyle === "dotgrid" ? `${lh * 0.75}px ${lh * 0.75}px`
                    : paperStyle === "stenopad" ? `100% 100%, 100% 100%, 100% ${lh}px`
                    : `100% ${lh}px`

                  return (
                    <div
                      key={isNewCard ? "new" : idx}
                      onClick={() => { if (!isCenter) setCarouselIdx(isNewCard ? activeNote.pages.length - 1 : idx) }}
                      style={{
                        position: "absolute",
                        transform: isCenter
                          ? "translateX(0px) scale(1) rotateY(0deg)"
                          : offset === -1
                            ? "translateX(-340px) scale(0.72) rotateY(32deg)"
                            : "translateX(340px) scale(0.72) rotateY(-32deg)",
                        zIndex: isCenter ? 20 : 5,
                        opacity: isCenter ? 1 : 0.55,
                        transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease",
                        cursor: isCenter ? "default" : "pointer",
                        transformStyle: "preserve-3d",
                        willChange: "transform",
                      }}
                    >
                      {isNewCard ? (
                        <div
                          onClick={() => {
                            const np = [...activeNote.pages, ""]
                            setNotes(prev => prev.map(n => n.id === activeTabId ? { ...n, pages: np } : n))
                            setCarouselIdx(activeNote.pages.length)
                          }}
                          style={{ width: 310, height: 438, borderRadius: 8, border: `2px dashed ${accent}55`, background: `${accent}08`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: accent }}>+</div>
                          <span style={{ color: accent, fontSize: 12, fontWeight: 600 }}>New Page</span>
                        </div>
                      ) : (
                        <div style={{
                          width: 310, height: 438, borderRadius: 8, overflow: "hidden", position: "relative",
                          backgroundColor: paperBg,
                          backgroundImage: bgImage, backgroundSize: bgSize,
                          boxShadow: isCenter
                            ? "0 50px 100px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.07)"
                            : "0 16px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)",
                        }}>
                          {/* Top accent stripe */}
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: accent, zIndex: 3 }} />

                          {/* Page badge */}
                          <div style={{ position: "absolute", top: 12, right: 10, zIndex: 4, background: accent, color: "white", fontSize: 8, fontWeight: 800, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 99 }}>
                            PAGE {idx + 1}
                          </div>

                          {/* Margin line */}
                          <div style={{ position: "absolute", left: 58, top: 0, bottom: 0, width: 1, background: "rgba(252,165,165,0.45)", zIndex: 2, pointerEvents: "none" }} />

                          {/* Full-page content, scaled to fit card */}
                          <div style={{
                            position: "absolute", top: 0, left: 0,
                            width: 827, height: 1170,
                            transform: "scale(0.3745)", transformOrigin: "top left",
                            padding: "52px 80px 80px 160px",
                            fontSize: 20,
                            lineHeight: lineSpacing === "compact" ? "24px" : lineSpacing === "relaxed" ? "40px" : "32px",
                            fontFamily: `"${editorFont}", serif`,
                            color: theme === "dark" ? "#E5E5E7" : "#1A1A1A",
                            pointerEvents: "none",
                          }}
                            dangerouslySetInnerHTML={{ __html: page || `<span style="color:#ccc;font-style:italic;font-size:16px">Empty page</span>` }}
                          />

                          {/* Open overlay (center card only) */}
                          {isCenter && (
                            <div
                              onClick={() => { setCurrentPageIdx(idx); setGridView(false) }}
                              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-5"
                              style={{ background: "linear-gradient(transparent 55%, rgba(0,0,0,0.18))", cursor: "pointer", zIndex: 10 }}
                            >
                              <span className="text-white text-[11px] font-bold px-5 py-2 rounded-full shadow-lg" style={{ backgroundColor: accent }}>Open Page</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Nav controls */}
            <div className="flex items-center justify-center gap-5 pb-8 shrink-0">
              <button
                onClick={() => setCarouselIdx(i => Math.max(0, i - 1))}
                disabled={carouselIdx === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all disabled:opacity-20 hover:scale-110 active:scale-95"
                style={{ backgroundColor: accent, color: "white" }}
              >‹</button>

              <div className="flex gap-1.5 items-center">
                {activeNote.pages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIdx(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === carouselIdx ? 22 : 7,
                      height: 7,
                      backgroundColor: i === carouselIdx ? accent : `${accent}44`,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => setCarouselIdx(i => Math.min(activeNote.pages.length - 1, i + 1))}
                disabled={carouselIdx >= activeNote.pages.length - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all disabled:opacity-20 hover:scale-110 active:scale-95"
                style={{ backgroundColor: accent, color: "white" }}
              >›</button>
            </div>
          </main>
        ) : (
          <main className="flex-1 overflow-auto px-8 pt-16 pb-8 flex justify-center" style={{ backgroundColor: theme === "dark" ? "#141414" : "#EDE8E6" }}>
            <div style={{transform:`scale(${zoom})`,transformOrigin:"top center"}} className="w-full max-w-5xl shrink-0">
              {/* ── 3D open-notebook effect ── */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "relative" }}>
                {/* Page stack layers — right-edge paper thickness illusion */}
                <div style={{ position: "absolute", top: 0, left: 4, right: -4, bottom: 0, backgroundColor: theme === "dark" ? "#2a2a2a" : "#f0e9e0", borderRadius: 2, zIndex: 1, boxShadow: "2px 0 6px rgba(0,0,0,0.10)" }} />
                <div style={{ position: "absolute", top: 0, left: 8, right: -8, bottom: 0, backgroundColor: theme === "dark" ? "#232323" : "#e8e0d4", borderRadius: 2, zIndex: 0, boxShadow: "2px 0 6px rgba(0,0,0,0.08)" }} />
                <div style={{ position: "absolute", top: 0, left: 12, right: -12, bottom: 0, backgroundColor: theme === "dark" ? "#1c1c1c" : "#dfd6c8", borderRadius: 2, zIndex: -1 }} />

              <div
                ref={paperRef}
                className="relative"
                style={(() => {
                  const lhMap = { compact: 24, normal: 32, relaxed: 40 }
                  const lh = lhMap[lineSpacing] ?? 32
                  const lineColor = theme === "dark" ? "#3a3a3a" : "#C2D3E8"
                  const paperBg = paperStyle === "stenopad" ? "#F5EDB8" : theme === "dark" ? "#2C2C2E" : "#FDFCF9"
                  const bgImage = paperStyle === "plain" ? "none"
                    : paperStyle === "dotgrid" ? `radial-gradient(circle, ${lineColor} 1.5px, transparent 1.5px)`
                    : paperStyle === "stenopad" ? `linear-gradient(to right, transparent 111px, #C17A7A 111px, #C17A7A 113px, transparent 113px), linear-gradient(to right, transparent 120px, #C17A7A 120px, #C17A7A 122px, transparent 122px), linear-gradient(transparent ${lh - 1}px, #3DBECB ${lh}px)`
                    : `linear-gradient(transparent ${lh - 1}px, ${lineColor} ${lh}px)`
                  const bgSize = paperStyle === "plain" ? "auto"
                    : paperStyle === "dotgrid" ? "28px 28px"
                    : paperStyle === "stenopad" ? `100% 100%, 100% 100%, 100% ${lh}px`
                    : `100% ${lh}px`
                  return {
                    minHeight: "1300px",
                    cursor: boxMode ? "crosshair" : "default",
                    backgroundColor: paperBg,
                    backgroundImage: bgImage,
                    backgroundSize: bgSize,
                    zIndex: 2,
                    boxShadow: theme === "dark"
                      ? "0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)"
                      : "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }
                })()}
                onMouseDown={onPaperMouseDown}
                onMouseMove={onPaperMouseMove}
                onMouseUp={onPaperMouseUp}
                onMouseLeave={onPaperMouseUp}
              >
                
{/* ── BRONZE SPIRAL BINDING — left (normal) or top (compact/notepad) ── */}
              {showBinding && !bindingCompact && (
                <div className="absolute left-[-24px] top-0 bottom-0 w-16 z-30 pointer-events-none flex flex-col justify-center overflow-hidden">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="relative w-full h-[32px]">
                      <div className="absolute left-[34px] top-2 w-4 h-5 rounded-sm bg-[#d7d2d0] shadow-[inset_2px_3px_5px_rgba(0,0,0,0.6)] border border-zinc-200" />
                      <div className="absolute left-[12px] top-[14px] w-[28px] h-[10px] border-b-[3px] border-[#8B6914] rounded-full opacity-40 blur-[0.5px]" />
                      <div className="absolute left-0 top-[10px] w-[42px] h-[15px] border-y-[3.5px] border-r-[3.5px] border-[#D4AF37] rounded-r-full shadow-[3px_4px_6px_rgba(0,0,0,0.3)] z-10" style={{ borderColor: '#A67C00 #D4AF37 #8B6914 #D4AF37' }} />
                      <div className="absolute left-[2px] top-[11px] w-[38px] h-[10px] border-y-[1px] border-r-[1.5px] border-[#FFF3A3] rounded-r-full z-20 opacity-50" />
                      <div className="absolute left-[38px] top-[18px] w-[10px] h-[2px] bg-black/10 blur-[2px] z-0" />
                    </div>
                  ))}
                </div>
              )}
              {showBinding && bindingCompact && (
                <div className="absolute top-[-28px] left-0 right-0 h-16 z-30 pointer-events-none flex flex-row pl-[32px]">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="relative h-full w-[32px]">
                      {/* Punched hole */}
                      <div className="absolute left-2 top-[34px] w-5 h-4 rounded-sm bg-[#d7d2d0] shadow-[inset_2px_3px_5px_rgba(0,0,0,0.6)] border border-zinc-200" />
                      {/* Back wire */}
                      <div className="absolute left-[14px] top-[12px] w-[10px] h-[28px] border-r-[3px] border-[#8B6914] rounded-full opacity-40 blur-[0.5px]" />
                      {/* Main wire — U-shape opening downward */}
                      <div className="absolute left-[10px] top-0 w-[15px] h-[42px] border-l-[3.5px] border-r-[3.5px] border-b-[3.5px] border-[#D4AF37] rounded-b-full shadow-[3px_4px_6px_rgba(0,0,0,0.3)] z-10" style={{ borderColor: '#D4AF37 #D4AF37 #8B6914 transparent' }} />
                      {/* Metallic highlight */}
                      <div className="absolute left-[11px] top-[2px] w-[10px] h-[38px] border-l-[1px] border-r-[1px] border-b-[1.5px] border-[#FFF3A3] rounded-b-full z-20 opacity-50" />
                      {/* Shadow on paper */}
                      <div className="absolute left-[18px] top-[38px] w-[2px] h-[10px] bg-black/10 blur-[2px] z-0" />
                    </div>
                  ))}
                </div>
              )}
                              
                {/* Margin Line */}
                <div className="absolute left-28 top-0 bottom-0 w-[1px] z-20 pointer-events-none" style={{ backgroundColor: theme === "dark" ? "rgba(248,113,113,0.3)" : "rgba(252,165,165,0.6)" }} />
                {/* Spine shadow — binding casting shadow onto page */}
                <div className="absolute top-0 left-0 bottom-0 pointer-events-none" style={{ width: 220, background: "linear-gradient(to right, rgba(0,0,0,0.065) 0%, rgba(0,0,0,0.018) 50%, transparent 100%)", zIndex: 21 }} />


                <div className="pl-36 pr-12 pt-[32px] pb-14" style={{pointerEvents: boxMode ? "none" : "auto", position: 'relative', zIndex: 10}}>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={spellCheck}
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={saveSelection}
                    onMouseUp={saveSelection}
                    onFocus={saveSelection}
                    onBlur={saveSelection}
                    onSelect={saveSelection}
                    onInput={()=>{saveSelection(); const content = editorRef.current?.innerHTML||""; setNotes(prev=>prev.map(n=>n.id===activeTabId?{...n,pages:n.pages.map((p,i)=>i===currentPageIdx?content:p)}:n))}}
                    style={{fontFamily:`"${editorFont}", serif`, pointerEvents: boxMode?"none":"auto", lineHeight: lineSpacing === "compact" ? "24px" : lineSpacing === "relaxed" ? "40px" : "32px", color: theme === "dark" ? "#E5E5E7" : "#1A1A1A"}}
                    className="w-full min-h-[1000px] outline-none text-xl break-words [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
                  />
                </div>


{(activeNote.boxes[currentPageIdx] || []).map((box) => (
  <div 
    key={box.id}
    tabIndex={0} 
    onKeyDown={(e) => {
      if (e.target instanceof HTMLTextAreaElement) return; 
      if (e.key === 'Backspace' || e.key === 'Delete') deleteBox(box.id);
    }}
    onMouseDown={(e) => onBoxMouseDown(e, box)}
    className={`absolute p-2 transition-shadow outline-none z-50 group shadow-sm ${selectedBoxId === box.id ? 'ring-2 ring-offset-2' : 'border border-dashed hover:border-zinc-500'}`}
    style={{
      left: box.x, top: box.y, width: box.w, height: box.h,
      backgroundColor: theme === "dark" ? "rgba(44,44,46,0.95)" : "rgba(255,255,255,0.92)",
      boxShadow: selectedBoxId === box.id ? `0 0 0 2px white, 0 0 0 4px ${accent}` : 'none',
      borderColor: selectedBoxId === box.id ? accent : "#a1a1aa",
      cursor: boxMode || draggingBox?.id === box.id ? "grab" : "default",
      resize: selectedBoxId === box.id ? 'both' : 'none',
      overflow: 'hidden'
    }}
onMouseUp={(e) => {
  if (!paperRef.current) return;
  
  const rect = e.currentTarget.getBoundingClientRect();
  const paperRect = paperRef.current.getBoundingClientRect();
  const s = parseFloat(zoom);

  // Convert screen pixels back to internal paper coordinates
  const newX = (rect.left - paperRect.left) / s;
  const newY = (rect.top - paperRect.top) / s;
  const newW = rect.width / s;
  const newH = rect.height / s;

  // Only update if change is > 1px to avoid jitter
  if (Math.abs(box.w - newW) > 1 || Math.abs(box.h - newH) > 1 || 
      Math.abs(box.x - newX) > 1 || Math.abs(box.y - newY) > 1) {
    
    setNotes(prev => prev.map(n => {
      if (n.id !== activeTabId) return n;
      const bMap = { ...n.boxes };
      bMap[currentPageIdx] = bMap[currentPageIdx].map(b => 
        b.id === box.id ? { ...b, x: newX, y: newY, w: newW, h: newH } : b
      );
      return { ...n, boxes: bMap };
    }));
  }
}}
  >
    {selectedBoxId === box.id && (
      <button 
        onMouseDown={(e) => { e.stopPropagation(); deleteBox(box.id); }}
        className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-lg hover:bg-red-600 z-[60]"
      >✕</button>
    )}

    {loadingBoxId === box.id ? (
      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs animate-pulse font-mono">GENERATING...</div>
    ) : box.content.includes("http") || box.content.startsWith("data:image") ? (
      <div className="w-full h-full pointer-events-none flex items-center justify-center p-1">
        <img 
          src={box.content} 
          className="w-full h-full object-contain filter grayscale mix-blend-multiply opacity-90" 
          alt="sketch"
        />
      </div>
    ) : (
      <textarea
        onKeyDown={e => e.stopPropagation()}
        className="w-full h-full bg-transparent outline-none resize-none text-lg leading-tight overflow-hidden"
        style={{ fontFamily: '"Original Surfer", cursive', pointerEvents: boxMode ? "none" : "auto" }}
        value={box.content}
        onChange={(e) => updateBoxContent(box.id, e.target.value)}
      />
    )}
  </div>
))}


                {draftBox && draftBox.w > 2 && (
                  <div style={{ position:"absolute", left:draftBox.x, top:draftBox.y, width:draftBox.w, height:draftBox.h, border:`2px dashed ${accent}`, background:`${accent}10`, borderRadius:4, pointerEvents:"none", zIndex:60 }} />
                )}


                <div className="flex justify-center items-center gap-10 py-10 relative z-20">
                  <button disabled={currentPageIdx===0} onClick={()=>setCurrentPageIdx(p=>p-1)} className="text-3xl disabled:opacity-10 hover:scale-110 transition-transform bg-white rounded-full px-2" style={{color:accent}}>&larr;</button>
                  <span className="px-4 py-1 bg-zinc-50 rounded-full text-[10px] font-bold text-zinc-400">PAGE {currentPageIdx+1} / {activeNote.pages.length}</span>
                  <button onClick={()=>{ if(currentPageIdx<activeNote.pages.length-1) setCurrentPageIdx(p=>p+1); else { const np=[...activeNote.pages,""]; setNotes(prev=>prev.map(n=>n.id===activeTabId?{...n,pages:np}:n)); setCurrentPageIdx(activeNote.pages.length); } }} className="text-3xl hover:scale-110 transition-transform bg-white rounded-full px-2" style={{color:accent}}>&rarr;</button>
                </div>
              </div>
              </div>{/* end tilt group */}
              {/* Desk shadow beneath notebook */}
              <div style={{ height: 60, marginTop: -8, background: "radial-gradient(ellipse 90% 55% at 46% 0%, rgba(0,0,0,0.22) 0%, transparent 70%)", pointerEvents: "none", position: "relative", zIndex: 0 }} />
              </div>{/* end 3D notebook wrapper */}
            </div>
          </main>
        )}

      {/* ── Right sidebar (floating overlay) ── */}
      {notes.length > 0 && (
        <RightToolbar
          theme={theme} accent={accent} gridView={gridView} sketchMode={sketchMode}
          rightSidebarOpen={rightSidebarOpen} currentPageIdx={currentPageIdx}
          setRightSidebarOpen={setRightSidebarOpen} setGridView={setGridView}
          setCarouselIdx={setCarouselIdx} setSketchMode={setSketchMode}
          setBoxMode={setBoxMode} setSketchPrompt={setSketchPrompt}
          openAlert={openAlert} clearPage={clearPage}
        />
      )}
      </div>
    </div>
  </div>
  )
}
