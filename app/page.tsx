"use client"
import { useState, useRef, useEffect } from "react"

function TablePicker({ onSelect }: { onSelect: (rows: number, cols: number) => void }) {
  const [hover, setHover] = useState({ r: 0, c: 0 })
  const MAX = 6
  return (
    <div>
      {Array.from({ length: MAX }, (_, r) => (
        <div key={r} className="flex gap-1 mb-1">
          {Array.from({ length: MAX }, (_, c) => (
            <div
              key={c}
              onMouseEnter={() => setHover({ r: r + 1, c: c + 1 })}
              onClick={() => onSelect(r + 1, c + 1)}
              className={`w-5 h-5 border rounded cursor-pointer transition-colors ${
                r < hover.r && c < hover.c ? "bg-rose-200 border-rose-400" : "bg-zinc-100 border-zinc-300"
              }`}
            />
          ))}
        </div>
      ))}
      <p className="text-[10px] text-zinc-500 text-center mt-1">{hover.r} × {hover.c}</p>
    </div>
  )
}

export default function NoteApp() {
  const [notes, setNotes] = useState([{ id: 1, subject: "My Creative Notes", pages: [""], favorite: false, tags: ["Ideas"] }])
  const [activeTabId, setActiveTabId] = useState(1)
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  // FIX: store zoom as string so <select value={zoom}> string comparison works correctly
  const [zoom, setZoom] = useState("0.9")
  const [theme] = useState({ paper: "bg-white", accent: "border-rose-800" })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showTableMenu, setShowTableMenu] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  // FIX: save/restore selection so dropdowns don't steal focus and lose the cursor position
  const savedRange = useRef<Range | null>(null)

  const activeNote = notes.find(n => n.id === activeTabId) || notes[0]

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== activeNote.pages[currentPageIdx]) {
      editorRef.current.innerHTML = activeNote.pages[currentPageIdx] || ""
    }
  }, [activeTabId, currentPageIdx])

  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
    }
  }

  const restoreSelection = () => {
    editorRef.current?.focus()
    const sel = window.getSelection()
    if (sel && savedRange.current) {
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
    }
  }

  // All toolbar commands go through here — restores selection first so dropdowns don't break cursor
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

  // Auto-markdown: "* " → bullet list, "1. " → numbered list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== " ") return
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const node = range.startContainer
    if (node.nodeType !== Node.TEXT_NODE) return
    const before = (node.textContent || "").slice(0, range.startOffset)

    if (before === "*") {
      e.preventDefault()
      const del = document.createRange()
      del.setStart(node, 0)
      del.setEnd(node, range.startOffset)
      sel.removeAllRanges()
      sel.addRange(del)
      document.execCommand("delete", false)
      document.execCommand("insertUnorderedList", false)
    } else if (/^\d+\.$/.test(before)) {
      e.preventDefault()
      const del = document.createRange()
      del.setStart(node, 0)
      del.setEnd(node, range.startOffset)
      sel.removeAllRanges()
      sel.addRange(del)
      document.execCommand("delete", false)
      document.execCommand("insertOrderedList", false)
    }
  }

  const insertQuoteBlock = () =>
    insertHTML(`<blockquote style="border-left:4px solid #9f1239;padding:8px 16px;margin:8px 0;color:#6b7280;font-style:italic;background:#fff1f2;border-radius:0 8px 8px 0">Quote text here…</blockquote><br/>`)

  const insertDivider = () =>
    insertHTML(`<hr style="border:none;border-top:2px solid #e4e4e7;margin:16px 0"/><br/>`)

  const insertChecklist = () =>
    insertHTML(`<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><input type="checkbox" style="width:16px;height:16px;accent-color:#9f1239"/><span>Task item</span></div><br/>`)

  const insertCollapsible = () =>
    insertHTML(`<details style="border:1px solid #e4e4e7;border-radius:8px;padding:8px 12px;margin:8px 0"><summary style="font-weight:bold;cursor:pointer;user-select:none;padding:4px">▶ Toggle Section</summary><div style="padding:8px 4px;margin-top:4px">Collapsed content here…</div></details><br/>`)

  const insertTable = (rows: number, cols: number) => {
    let html = `<table style="border-collapse:collapse;width:100%;margin:16px 0">`
    for (let r = 0; r < rows; r++) {
      html += `<tr>`
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? "th" : "td"
        const style = `border:1px solid #e4e4e7;padding:8px 12px;text-align:left;${r === 0 ? "background:#f9fafb;font-weight:bold;" : ""}`
        html += `<${tag} style="${style}">${r === 0 ? `Col ${c + 1}` : ""}</${tag}>`
      }
      html += `</tr>`
    }
    html += `</table><br/>`
    setShowTableMenu(false)
    insertHTML(html)
  }

  const insertColumns = (num: number) => {
    let html = `<div style="display:grid;grid-template-columns:repeat(${num},1fr);gap:16px;margin:16px 0">`
    for (let i = 0; i < num; i++) {
      html += `<div style="border:1px dashed #e4e4e7;padding:12px;min-height:80px;border-radius:6px">Column ${i + 1} content…</div>`
    }
    html += `</div><br/>`
    insertHTML(html)
  }

  const addNote = () => {
    const newId = Date.now()
    setNotes([...notes, { id: newId, subject: "New Subject", pages: [""], favorite: false, tags: [] }])
    setActiveTabId(newId)
    setCurrentPageIdx(0)
  }

  return (
    <div
      className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] overflow-hidden selection:bg-rose-100 font-sans"
      onClick={() => setShowTableMenu(false)}
    >
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-52" : "w-0"} bg-[#121212] text-white flex flex-col border-r border-white/10 shrink-0 transition-all duration-300`}>
        {sidebarOpen && (
          <>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3 mb-6 group cursor-default">
                <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-rose-900 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(159,18,57,0.4)] transition-transform group-hover:scale-110">
                  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                    <path d="M4 22C4 22 10 6 24 6" />
                    <path d="M18 13C24 13 24 23 18 23" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: '"Licorice", cursive' }}>tangible</h1>
              </div>
              <input type="text" placeholder="Search…" className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-rose-800" />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-2">Notebooks</p>
              {notes.map(n => (
                <button key={n.id} onClick={() => { setActiveTabId(n.id); setCurrentPageIdx(0) }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-full mb-1 transition-all ${activeTabId === n.id ? "bg-rose-800 shadow-lg" : "hover:bg-zinc-900 text-zinc-400"}`}>
                  {n.subject}
                </button>
              ))}
              <button onClick={addNote} className="text-[10px] text-zinc-500 hover:text-white px-3 mt-2">+ New Note</button>
            </div>
            <div className="p-4 space-y-2">
              <button onClick={() => window.print()} className="w-full py-2 bg-zinc-800 text-[10px] font-bold rounded-full hover:bg-zinc-700">Save</button>
              <button className="w-full py-2 bg-rose-900 text-[10px] font-bold rounded-full shadow-lg shadow-rose-900/20">Export PDF</button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-2 top-14 mt-2 z-50 w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          {sidebarOpen ? "←" : "→"}
        </button>

        {/* ── TOP TOOLBAR: icon buttons ── */}
        <div className="h-10 bg-zinc-50 border-b border-zinc-200 flex items-center pl-14 pr-4 gap-2 z-30 overflow-x-auto shrink-0">

          {/* Bold / Italic / Underline / Strike */}
          <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2">
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("bold") }} title="Bold" className="w-7 h-7 hover:bg-zinc-200 rounded font-bold text-sm">B</button>
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("italic") }} title="Italic" className="w-7 h-7 hover:bg-zinc-200 rounded italic text-sm">I</button>
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("underline") }} title="Underline" className="w-7 h-7 hover:bg-zinc-200 rounded underline text-sm">U</button>
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("strikeThrough") }} title="Strikethrough" className="w-7 h-7 hover:bg-zinc-200 rounded line-through text-sm">S</button>
          </div>

          {/* Color + Highlight */}
          <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2">
            <input type="color" title="Text color" onMouseDown={saveSelection} onInput={(e) => execCmd("foreColor", (e.target as HTMLInputElement).value)} className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer" />
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("hiliteColor", "#fef08a") }} title="Highlight yellow" className="w-7 h-7 hover:bg-zinc-200 rounded bg-yellow-200 text-[10px] font-bold">H</button>
            {/* FIX: 'inherit' removes only highlight without nuking bold/italic/etc */}
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("hiliteColor", "inherit") }} title="Remove highlight" className="w-7 h-7 hover:bg-zinc-200 rounded text-xs">✕</button>
          </div>

          {/* Superscript / Subscript */}
          <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2">
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("superscript") }} title="Superscript" className="w-7 h-7 hover:bg-zinc-200 rounded text-[10px]">x²</button>
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("subscript") }} title="Subscript" className="w-7 h-7 hover:bg-zinc-200 rounded text-[10px]">x₂</button>
            {/* FIX: queryCommandState checks which one is active before toggling — won't accidentally turn one on */}
            <button onMouseDown={(e) => {
              e.preventDefault()
              restoreSelection()
              if (document.queryCommandState("superscript")) document.execCommand("superscript", false)
              if (document.queryCommandState("subscript")) document.execCommand("subscript", false)
              editorRef.current?.focus()
            }} title="Remove super/subscript" className="w-7 h-7 hover:bg-zinc-200 rounded text-xs">✕</button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2">
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("insertUnorderedList") }} title="Bullet list  (or type * + space)" className="w-7 h-7 hover:bg-zinc-200 rounded text-base leading-none">•≡</button>
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("insertOrderedList") }} title="Numbered list (or type 1. + space)" className="w-7 h-7 hover:bg-zinc-200 rounded text-[10px]">1≡</button>
            <button onMouseDown={(e) => { e.preventDefault(); insertChecklist() }} title="Checklist" className="w-7 h-7 hover:bg-zinc-200 rounded text-sm">☑</button>
          </div>

          {/* Indent / Outdent */}
          <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2">
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("outdent") }} title="Decrease indent" className="w-7 h-7 hover:bg-zinc-200 rounded text-sm">⇤</button>
            <button onMouseDown={(e) => { e.preventDefault(); execCmd("indent") }} title="Increase indent" className="w-7 h-7 hover:bg-zinc-200 rounded text-sm">⇥</button>
          </div>

          {/* Block inserts */}
          <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2">
            <button onMouseDown={(e) => { e.preventDefault(); insertQuoteBlock() }} title="Quote block" className="w-7 h-7 hover:bg-zinc-200 rounded text-base">❝</button>
            <button onMouseDown={(e) => { e.preventDefault(); insertDivider() }} title="Horizontal divider" className="w-7 h-7 hover:bg-zinc-200 rounded text-base font-bold">—</button>
            <button onMouseDown={(e) => { e.preventDefault(); insertCollapsible() }} title="Collapsible section" className="w-7 h-7 hover:bg-zinc-200 rounded text-[10px]">▶…</button>
          </div>

          <div className="flex items-center gap-2 ml-1">
            <button className="px-3 py-1 bg-rose-800 text-white rounded-full text-[10px] font-bold">🎨 DRAW</button>
            <button className="px-3 py-1 bg-zinc-900 text-white rounded-full text-[10px] font-bold">✨ TRANSFORM</button>
          </div>
        </div>

        {/* ── BOTTOM TOOLBAR: dropdowns ── */}
        <div className="h-12 bg-white border-b border-zinc-200 flex items-center px-8 gap-3 z-20 shadow-sm shrink-0 overflow-x-auto relative">

          {/* Font family */}
          <select
            onMouseDown={saveSelection}
            onChange={(e) => execCmd("fontName", e.target.value)}
            className="text-[11px] border rounded-full px-3 py-1 outline-none bg-zinc-50 focus:ring-1 focus:ring-rose-800 shrink-0"
          >
            <option value="Original Surfer">Default</option>
            <option value="Fredoka">Bubbly</option>
            <option value="Arial">Sans</option>
            <option value="Georgia">Serif</option>
            <option value="Courier New">Mono</option>
          </select>

          {/* FIX: Paragraph style / headings — restores selection before formatBlock so cursor isn't lost */}
          <select
            onMouseDown={saveSelection}
            onChange={(e) => {
              const val = e.target.value
              if (!val) return
              restoreSelection()
              document.execCommand("formatBlock", false, val)
              editorRef.current?.focus()
              e.target.value = ""
            }}
            defaultValue=""
            className="text-[11px] border rounded-full px-3 py-1 outline-none bg-zinc-50 shrink-0"
          >
            <option value="" disabled>Style</option>
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="pre">Code block</option>
          </select>

          {/* FIX: Zoom stored as string — value prop matches option value strings correctly; 100% no longer snaps to 75% */}
          <select
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
            className="text-[11px] border rounded-full px-3 py-1 outline-none bg-zinc-50 shrink-0"
          >
            <option value="0.5">50%</option>
            <option value="0.6">60%</option>
            <option value="0.75">75%</option>
            <option value="0.85">85%</option>
            <option value="0.9">90%</option>
            <option value="0.95">95%</option>
            <option value="1.0">100%</option>
            <option value="1.1">110%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
            <option value="1.75">175%</option>
            <option value="2.0">200%</option>
          </select>

          {/* Table grid picker */}
          <div className="relative shrink-0">
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveSelection(); setShowTableMenu(v => !v) }}
              className="text-[11px] border rounded-full px-3 py-1 bg-zinc-50 hover:bg-zinc-100 whitespace-nowrap"
            >
              ⊞ Table
            </button>
            {showTableMenu && (
              <div className="absolute top-9 left-0 bg-white border border-zinc-200 rounded-xl shadow-xl p-3 z-50" onClick={e => e.stopPropagation()}>
                <p className="text-[10px] text-zinc-400 mb-2 text-center">Click to insert</p>
                <TablePicker onSelect={insertTable} />
              </div>
            )}
          </div>

          {/* Multi-column layout */}
          <select
            onMouseDown={saveSelection}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (val) insertColumns(val)
              e.target.value = ""
            }}
            defaultValue=""
            className="text-[11px] border rounded-full px-3 py-1 outline-none bg-zinc-50 shrink-0"
          >
            <option value="" disabled>Columns</option>
            <option value="2">2 Columns</option>
            <option value="3">3 Columns</option>
            <option value="4">4 Columns</option>
          </select>
        </div>

        {/* ── EDITOR CANVAS ── */}
        <main className="flex-1 overflow-auto p-8 flex justify-center bg-[#F3F4F6]">
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            className={`w-full max-w-7xl bg-white shadow-2xl min-h-[1100px] border border-zinc-100 relative ${theme.paper} ${theme.accent} border-t-[12px] shrink-0 rounded-3xl overflow-hidden`}
          >
            <div className="px-20 py-24 text-rose-950">
              <input
                className="text-5xl font-bold mb-10 w-full bg-transparent outline-none border-b-2 border-transparent focus:border-rose-100 transition-colors"
                style={{ fontFamily: '"Bilbo", cursive' }}
                value={activeNote.subject}
                onChange={(e) => setNotes(notes.map(n => n.id === activeTabId ? { ...n, subject: e.target.value } : n))}
              />
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onKeyDown={handleKeyDown}
                onKeyUp={saveSelection}
                onMouseUp={saveSelection}
                onFocus={saveSelection}
                onSelect={saveSelection}
                onInput={() => {
                  saveSelection()
                  const content = editorRef.current?.innerHTML || ""
                  setNotes(notes.map(n => n.id === activeTabId
                    ? { ...n, pages: n.pages.map((p, i) => i === currentPageIdx ? content : p) }
                    : n))
                }}
                style={{ fontFamily: '"Original Surfer", cursive' }}
                className="w-full h-[700px] outline-none leading-relaxed text-xl break-words overflow-hidden"
              />
            </div>
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-12">
              <button disabled={currentPageIdx === 0} onClick={() => setCurrentPageIdx(currentPageIdx - 1)} className="text-3xl hover:text-rose-800 disabled:opacity-10">&larr;</button>
              <div className="px-4 py-1 bg-zinc-50 rounded-full text-[10px] font-bold text-zinc-400">PAGE {currentPageIdx + 1} / {activeNote.pages.length}</div>
              <button onClick={() => {
                if (currentPageIdx < activeNote.pages.length - 1) {
                  setCurrentPageIdx(currentPageIdx + 1)
                } else {
                  const newPages = [...activeNote.pages, ""]
                  setNotes(notes.map(n => n.id === activeTabId ? { ...n, pages: newPages } : n))
                  setCurrentPageIdx(activeNote.pages.length)
                }
              }} className="text-3xl hover:text-rose-800">&rarr;</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}