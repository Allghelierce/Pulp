"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"



interface TextBox { id: string; x: number; y: number; w: number; h: number; content: string }
type BoxesMap = { [pageIdx: number]: TextBox[] }
interface NoteData { id: string; subject: string; pages: string[]; folderId: number | null; boxes: BoxesMap }
interface FolderData { id: number; name: string; open: boolean }


const ACCENT = "#600b2779"


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
              onMouseDown={(e) => { e.preventDefault(); onSelect(r + 1, c + 1) }}
              className={`w-5 h-5 border rounded cursor-pointer transition-colors ${
                r < hover.r && c < hover.c ? "bg-[#7A5C66]/30 border-[#7A5C66]" : "bg-zinc-100 border-zinc-300"
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
  const [notes, setNotes] = useState<NoteData[]>([{ id: "00000000-0000-0000-0000-000000000001", subject: "Test", pages: [""], folderId: null, boxes: {} }])
  const [folders, setFolders] = useState<FolderData[]>([{ id: 1, name: "General", open: true }])
  const [activeTabId, setActiveTabId] = useState<string>("00000000-0000-0000-0000-000000000001")
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [zoom, setZoom] = useState("0.9")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [gridView, setGridView] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<number | null>(null)
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)
  const [boxMode, setBoxMode] = useState(false)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [draftBox, setDraftBox] = useState<TextBox | null>(null)
  const [draggingBox, setDraggingBox] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [customSize, setCustomSize] = useState("16")


  const editorRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const activeNote = notes.find(n => n.id === activeTabId) ?? notes[0]
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
    const saveToCloud = async () => {
      if (!activeNote || !user) return // Don't save if no one is logged in!


      const { error } = await supabase
        .from('notes')
        .upsert({
          id: activeNote.id,
          subject: activeNote.subject,
          pages: activeNote.pages,
          boxes: activeNote.boxes,
          user_id: user.id // Uses the ID from the ✅ checkmark
        })


      if (error) console.error("Save failed:", error.message)
      else console.log("Autosaved to cloud!")
    }


    const timer = setTimeout(saveToCloud, 2000)
    return () => clearTimeout(timer)
  }, [activeNote, user]) // Critical: user must be here!


  useEffect(() => {
    if (!gridView && editorRef.current && editorRef.current.innerHTML !== activeNote.pages[currentPageIdx]) {
      editorRef.current.innerHTML = activeNote.pages[currentPageIdx] || ""
    }
  }, [activeTabId, currentPageIdx, gridView])


  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange()
  }


  const restoreSelection = () => {
    editorRef.current?.focus()
    const sel = window.getSelection()
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current) }
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
    document.execCommand("fontSize", false, "7")
    editorRef.current?.querySelectorAll('font[size="7"]').forEach(el => {
      const span = document.createElement("span")
      span.style.fontSize = sizePx + "px"
      el.parentNode?.insertBefore(span, el)
      while (el.firstChild) span.appendChild(el.firstChild)
      el.parentNode?.removeChild(el)
    })
    editorRef.current?.focus()
  }


  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== " ") return
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
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
    let html = `<table style="border-collapse:collapse;width:100%;margin:16px 0">`
    for (let r = 0; r < rows; r++) {
      html += `<tr>`
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? "th" : "td"
        const style = `border:1px solid #a1a1aa;padding:8px 12px;text-align:left;${r === 0 ? "background:#f9fafb;font-weight:bold;" : ""}`
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
    for (let i = 0; i < num; i++) html += `<div style="border:1px dashed #e4e4e7;padding:12px;min-height:80px;">Column ${i + 1} content…</div>`
    html += `</div><br/>`
    insertHTML(html)
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
    setDraftBox({ id: crypto.randomUUID(), x, y, w: 0, h: 0, content: "" })
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
    setDraftBox({id:draftBox?.id??crypto.randomUUID(), x:drawStart.x, y:drawStart.y, w:x-drawStart.x, h:y-drawStart.y, content:""})
  }


  const onPaperMouseUp=()=>{
    if(draggingBox)setDraggingBox(null)
    if(!boxMode||!draftBox)return
    if(Math.abs(draftBox.w)>15&&Math.abs(draftBox.h)>15){
      const committed={...draftBox,id:crypto.randomUUID()}
      const b={...activeNote.boxes}
      if(!b[currentPageIdx])b[currentPageIdx]=[]
      b[currentPageIdx]=[...b[currentPageIdx],committed]
      setNotes(notes.map(n=>n.id===activeTabId?{...n,boxes:b}:n))
      setSelectedBoxId(null)
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
    if (!boxMode) return
    e.stopPropagation()
    const { x, y } = getPaperXY(e)
    setDraggingBox({ id: box.id, offsetX: x - box.x, offsetY: y - box.y })
    setSelectedBoxId(box.id)
  }


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
    const name = prompt("Name your new note:", "New Note")
    if (!name) return
    const id = crypto.randomUUID() // ✅ Produces a valid string (UUID)
    setNotes(prev => [...prev, { id, subject: name, pages: [""], folderId, boxes: {} }])
    setActiveTabId(id)
    setCurrentPageIdx(0)
  }


  const renameNote = (id: string, currentName: string) => {
    const newName = prompt("Rename note:", currentName)
    if (newName) setNotes(prev => prev.map(n => n.id === id ? { ...n, subject: newName } : n))
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
    h1{color:${ACCENT};margin-bottom:32px}hr{border:none;border-top:1px solid #ddd;margin:32px 0}
    h3{color:${ACCENT}88;font-size:12px;text-transform:uppercase;letter-spacing:.1em}</style>
    </head><body><h1>${activeNote.subject}</h1>
    ${activeNote.pages.map((p, i) => `<section><h3>Page ${i + 1}</h3><div>${p || "<em style='color:#bbb'>Empty page</em>"}</div></section>`).join("<hr/>")}</body></html>`
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }))
    a.download = `${activeNote.subject.replace(/[^a-z0-9]/gi, "_")}.html`
    a.click()
  }


  const topLevelNotes = notes.filter(n => n.folderId === null)
  const notesInFolder = (fid: number) => notes.filter(n => n.folderId === fid)
  const btnBase = "w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-zinc-200"


  return (
    <div className="flex h-screen bg-[#F0ECEA] text-[#1A1A1A] overflow-hidden font-sans" onClick={() => setShowTableMenu(false)}>
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Bilbo&family=Licorice&family=Original+Surfer&display=swap');" }} />
      <div className={`${sidebarOpen ? "w-64" : "w-0"} bg-[#110d0e] text-white flex flex-col shrink-0 transition-all duration-300 overflow-hidden border-r border-white/5`}>
        <div className="p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 mb-5 cursor-default">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg,${ACCENT}88,${ACCENT})` }}>
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M4 22C4 22 10 6 24 6"/><path d="M18 13C24 13 24 23 18 23"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: '"Licorice", cursive' }}> Letter Soup </h1>
          </div>
          <input placeholder="Search…" className="w-full bg-zinc-900/60 border border-white/10 rounded-full px-3 py-1.5 text-xs outline-none focus:border-white/30 transition-colors" />
        </div>


        <div className="flex-1 overflow-y-auto p-3 space-y-0.5" onDragOver={e => e.preventDefault()} onDrop={e => handleDropNote(e, null)}>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 px-2">Notebooks</p>
          
          {topLevelNotes.map(n => (
            <button key={n.id} 
              draggable 
              onDragStart={() => setDraggedNoteId(n.id)}
              onDragEnd={() => setDraggedNoteId(null)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDropNote(e, null, n.id)}
              onClick={() => { setActiveTabId(n.id); setCurrentPageIdx(0) }}
              onContextMenu={(e) => { e.preventDefault(); renameNote(n.id, n.subject) }}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-full transition-all ${draggedNoteId === n.id ? 'opacity-50' : ''}`}
              style={activeTabId === n.id ? { backgroundColor: ACCENT, color: "white" } : { color: "#a1a1aa" }}
              onMouseEnter={e => { if (activeTabId !== n.id) (e.currentTarget as HTMLElement).style.backgroundColor = "#1f1f1f" }}
              onMouseLeave={e => { if (activeTabId !== n.id) (e.currentTarget as HTMLElement).style.backgroundColor = "" }}>
              📄 {n.subject}
            </button>
          ))}


          {folders.map(f => (
            <div key={f.id} onDragOver={e => e.preventDefault()} onDrop={e => handleDropNote(e, f.id)}>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-zinc-900/60 group" onClick={() => toggleFolder(f.id)}>
                <span className="text-[10px] text-zinc-600">{f.open ? "▾" : "▸"}</span>
                {renamingFolder === f.id ? (
                  <input autoFocus className="flex-1 bg-white/10 text-white text-xs rounded px-1.5 outline-none min-w-0" defaultValue={f.name} onBlur={e => { renameFolder(f.id, e.target.value); setRenamingFolder(null) }} onKeyDown={e => { if (e.key === "Enter") { renameFolder(f.id, (e.target as HTMLInputElement).value); setRenamingFolder(null) } }} onClick={e => e.stopPropagation()} />
                ) : (
                  <span className="flex-1 text-xs text-zinc-300 truncate" onDoubleClick={e => { e.stopPropagation(); setRenamingFolder(f.id) }}>📁 {f.name}</span>
                )}
              </div>
              {f.open && (
                <div className="pl-5 space-y-0.5">
                  {notesInFolder(f.id).map(n => (
                    <button key={n.id} 
                      draggable 
                      onDragStart={() => setDraggedNoteId(n.id)}
                      onDragEnd={() => setDraggedNoteId(null)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDropNote(e, f.id, n.id)}
                      onClick={() => { setActiveTabId(n.id); setCurrentPageIdx(0) }}
                      onContextMenu={(e) => { e.preventDefault(); renameNote(n.id, n.subject) }}
                      className={`w-full text-left px-3 py-1 text-[11px] rounded-full transition-all ${draggedNoteId === n.id ? 'opacity-50' : ''}`}
                      style={activeTabId === n.id ? { backgroundColor: ACCENT, color: "white" } : { color: "#71717a" }}>
                      📄 {n.subject}
                    </button>
                  ))}
                  <button onClick={() => addNote(f.id)} className="text-[11px] text-zinc-600 hover:text-white px-3 py-0.5 block">+ Note</button>
                </div>
              )}
            </div>
          ))}
        </div>


        <div className="p-3 border-t border-white/5 space-y-1">
          <button onClick={() => addNote(null)} className="w-full text-left text-[11px] text-zinc-500 hover:text-white px-2 py-1 rounded transition-colors">+ New Note</button>
          <button onClick={addFolder} className="w-full text-left text-[11px] text-zinc-500 hover:text-white px-2 py-1 rounded transition-colors">+ New Folder</button>
          
          <div className="flex items-center justify-between mt-4">
            <button className="flex items-center gap-2 text-[11px] text-zinc-500 hover:text-white px-2 py-1 rounded transition-colors">
              ⚙️ Settings
            </button>
              <Link 
                href="/login" 
                className="flex items-center gap-2 text-[11px] text-zinc-500 hover:text-white px-2 py-1 rounded transition-colors hover:bg-zinc-800"
              >
                <span>👤</span> 
                <span>{user ? '✅' : 'Account'}</span>
              </Link>
          </div>
        </div>
      </div>


      <div className="flex-1 flex flex-col overflow-hidden relative">
        <button onClick={() => setSidebarOpen(v => !v)} className="absolute left-2 top-[54px] z-50 text-zinc-400 hover:text-zinc-700 transition-colors p-1 text-2xl leading-none">
          {sidebarOpen ? "‹" : "›"}
        </button>


        <div className="h-10 bg-zinc-50 border-b border-zinc-200 flex items-center pl-10 pr-4 gap-2 z-30 shrink-0 overflow-x-auto justify-between">
          <div className="flex items-center gap-2">
            
            <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 shrink-0">
              <button onMouseDown={e=>{e.preventDefault();execCmd("bold")}} className={`${btnBase} font-bold text-sm`}>B</button>
              <button onMouseDown={e=>{e.preventDefault();execCmd("italic")}} className={`${btnBase} italic text-sm`}>I</button>
              <button onMouseDown={e=>{e.preventDefault();execCmd("underline")}} className={`${btnBase} underline text-sm`}>U</button>
              <button onMouseDown={e=>{e.preventDefault();execCmd("strikeThrough")}} className={`${btnBase} line-through text-sm`}>S</button>
            </div>


            <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 shrink-0">
              <input type="color" onMouseDown={saveSelection} onInput={e => execCmd("foreColor", (e.target as HTMLInputElement).value)} className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer rounded" />
              <button onMouseDown={e=>{e.preventDefault();execCmd("hiliteColor","#fef08a")}} className={`${btnBase} bg-yellow-200 text-[10px] font-bold`}>H</button>
              <button onMouseDown={e=>{e.preventDefault();execCmd("hiliteColor","transparent")}} className={`${btnBase} text-xs`}>✕</button>
            </div>


            <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 shrink-0">
              <button onMouseDown={e=>{e.preventDefault();execCmd("superscript")}} className={`${btnBase} text-[10px]`}>x²</button>
              <button onMouseDown={e=>{e.preventDefault();execCmd("subscript")}} className={`${btnBase} text-[10px]`}>x₂</button>
              <button onMouseDown={e=>{e.preventDefault();restoreSelection(); if(document.queryCommandState("superscript")) document.execCommand("superscript",false); if(document.queryCommandState("subscript")) document.execCommand("subscript",false); saveSelection(); editorRef.current?.focus()}} className={`${btnBase} text-xs`}>✕</button>
            </div>


            <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 shrink-0">
              <button onMouseDown={e=>{e.preventDefault();execCmd("insertUnorderedList")}} className={`${btnBase} text-base leading-none`}>•≡</button>
              <button onMouseDown={e=>{e.preventDefault();execCmd("insertOrderedList")}} className={`${btnBase} text-[10px]`}>1≡</button>
              <button onMouseDown={e=>{e.preventDefault();insertHTML(`<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><input type="checkbox" style="width:15px;height:15px;accent-color:${ACCENT}"/><span>Task</span></div><br/>`)}} className={`${btnBase} text-sm`}>☑</button>
            </div>


            <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 shrink-0">
              <button onMouseDown={e=>{e.preventDefault();execCmd("outdent")}} className={`${btnBase} text-sm`}>⇤</button>
              <button onMouseDown={e=>{e.preventDefault();execCmd("indent")}} className={`${btnBase} text-sm`}>⇥</button>
            </div>


            <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 shrink-0">
              <button onMouseDown={e=>{e.preventDefault();insertHTML(`<blockquote style="border-left:4px solid ${ACCENT};padding:8px 16px;margin:8px 0;color:#888;font-style:italic;background:#f7f0f2;border-radius:0 8px 8px 0">Quote…</blockquote><br/>`)}} className={`${btnBase} text-base`}>❝</button>
              <button onMouseDown={e=>{e.preventDefault();insertHTML('<hr style="border:none;border-top:2px solid #ddd;margin:16px 0"/><br/>')}} className={`${btnBase} font-bold`}>—</button>
            </div>
            
            <button onMouseDown={e=>{e.preventDefault();setBoxMode(v=>!v);setSelectedBoxId(null)}} className="h-7 px-2.5 rounded text-[10px] font-bold border transition-colors shrink-0" style={boxMode ? { backgroundColor: ACCENT, color: "white", borderColor: ACCENT } : { borderColor: "#d4d4d8", color: "#52525b" }}>
              ⬜ BOX
            </button>
          </div>


          <div className="flex items-center gap-1.5 shrink-0">
            <button onMouseDown={e=>{e.preventDefault();setGridView(v=>!v)}} className="h-7 px-2.5 rounded text-[10px] font-bold border transition-colors" style={gridView ? { backgroundColor: ACCENT, color: "white", borderColor: ACCENT } : { borderColor: "#d4d4d8", color: "#52525b" }}>
              ⊞ GRID
            </button>
            <button onMouseDown={e=>{e.preventDefault();downloadNote()}} className="h-7 px-3 rounded text-[10px] font-bold text-white transition-opacity hover:opacity-80" style={{ backgroundColor: ACCENT }}>
              ↓ SAVE
            </button>
          </div>
        </div>


        <div className="h-12 bg-white border-b border-zinc-200 flex items-center px-8 gap-3 z-20 shadow-sm shrink-0 overflow-x-auto">
          <select onMouseDown={saveSelection} onChange={e=>execCmd("fontName",e.target.value)} className="text-[11px] border border-zinc-200 rounded-full px-3 py-1 outline-none bg-zinc-50 shrink-0">
            <option value="Original Surfer">Default</option>
            <option value="Fredoka">Bubbly</option>
            <option value="Georgia">Serif</option>
            <option value="Arial">Sans</option>
          </select>


          <div className="flex items-center gap-1 border-r border-zinc-200 pr-3 shrink-0">
            <select onMouseDown={saveSelection} defaultValue="" onChange={e=>{const v=e.target.value; if(v){setCustomSize(v);applyFontSize(v)}}} className="text-[11px] border border-zinc-200 rounded-full px-3 py-1 outline-none bg-zinc-50">
              <option value="" disabled>Size</option>
              {[8,10,11,12,14,16,18,20,24,28,32,36,48,64,72].map(s=><option key={s} value={String(s)}>{s}px</option>)}
            </select>
            <input type="number" min={1} max={400} value={customSize} onChange={e=>setCustomSize(e.target.value)} onMouseDown={saveSelection} onKeyDown={e=>{if(e.key==="Enter")applyFontSize(customSize)}} className="w-14 text-[11px] border border-zinc-200 rounded-full px-2 py-1 outline-none bg-zinc-50 text-center" />
          </div>


          <select onMouseDown={saveSelection} defaultValue="" onChange={e=>{const v=e.target.value; if(!v) return; restoreSelection(); document.execCommand("formatBlock",false,v); editorRef.current?.focus(); e.target.value=""}} className="text-[11px] border border-zinc-200 rounded-full px-3 py-1 outline-none bg-zinc-50 shrink-0">
            <option value="" disabled>Style</option>
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>


          <div className="relative shrink-0">
            <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveSelection(); setShowTableMenu(v => !v) }} className="text-[11px] border border-zinc-200 rounded-full px-3 py-1 bg-zinc-50 hover:bg-zinc-100 whitespace-nowrap">
              ⊞ Table
            </button>
            {showTableMenu && (
              <div className="absolute top-9 left-0 bg-white border border-zinc-200 rounded-xl shadow-xl p-3 z-50" onClick={e => e.stopPropagation()}>
                <p className="text-[10px] text-zinc-400 mb-2 text-center">Click to insert</p>
                <TablePicker onSelect={insertTable} />
              </div>
            )}
          </div>


          <select onMouseDown={saveSelection} onChange={(e) => { const val = parseInt(e.target.value); if (val) insertColumns(val); e.target.value = "" }} defaultValue="" className="text-[11px] border border-zinc-200 rounded-full px-3 py-1 outline-none bg-zinc-50 shrink-0">
            <option value="" disabled>Columns</option>
            <option value="2">2 Columns</option>
            <option value="3">3 Columns</option>
          </select>


          <select value={zoom} onChange={e=>setZoom(e.target.value)} className="text-[11px] border border-zinc-200 rounded-full px-3 py-1 outline-none bg-zinc-50 shrink-0">
            {["0.5","0.75","0.9","1.0","1.25","1.5"].map(v=><option key={v} value={v}>{Math.round(parseFloat(v)*100)}%</option>)}
          </select>
        </div>


        {gridView ? (
          <main className="flex-1 overflow-auto p-8 bg-[#EDE8E6]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{color:ACCENT}}>{activeNote.subject} — All Pages</h2>
              <button onClick={()=>setGridView(false)} className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">← Back</button>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {activeNote.pages.map((page,idx)=>(
                <div key={idx} onClick={()=>{setGridView(false);setCurrentPageIdx(idx)}} className="bg-white shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all border-t-[5px]" style={{borderTopColor:ACCENT}}>
                  <div className="px-4 py-2 border-b border-zinc-100"><p className="text-[9px] font-bold uppercase tracking-widest" style={{color:ACCENT}}>Page {idx+1}</p></div>
                  <div className="p-4 h-44 overflow-hidden text-[9px] text-zinc-500 leading-relaxed pointer-events-none [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6" dangerouslySetInnerHTML={{__html: page||"<em style='color:#ccc'>Empty</em>"}} />
                </div>
              ))}
              <div onClick={()=>{const np=[...activeNote.pages,""]; setNotes(prev=>prev.map(n=>n.id===activeTabId?{...n,pages:np}:n)); setGridView(false); setCurrentPageIdx(activeNote.pages.length)}} className="bg-white/40 border-2 border-dashed border-zinc-300 flex items-center justify-center h-[200px] cursor-pointer hover:border-zinc-400 hover:bg-white/60 transition-all">
                <span className="text-zinc-400 text-sm">+ New Page</span>
              </div>
            </div>
          </main>
        ) : (
          <main className="flex-1 overflow-auto p-8 flex justify-center bg-[#EDE8E6]">
            <div style={{transform:`scale(${zoom})`,transformOrigin:"top center"}} className="w-full max-w-4xl shrink-0">
              <div
                ref={paperRef}
                className="bg-white shadow-2xl overflow-hidden relative"
                style={{
                  minHeight:"1300px",
                  cursor: boxMode ? "crosshair" : "default",
                  backgroundImage: `linear-gradient(transparent 31px, #e4e4e7 32px)`,
                  backgroundSize: `100% 32px`
                }}
                onMouseDown={onPaperMouseDown}
                onMouseMove={onPaperMouseMove}
                onMouseUp={onPaperMouseUp}
                onMouseLeave={onPaperMouseUp}
              >
                
              {/* ── 3D DOUBLE-LOOP SPIRAL BINDING ── */}
              <div className="absolute left-[-24px] top-0 bottom-0 w-16 z-30 pointer-events-none flex flex-col pt-[32px]">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="relative w-full h-[32px]">
                    
                    {/* 1. The Punched Hole: Uses an inner shadow to look like it's cut into the paper */}
                    <div className="absolute left-[34px] top-2 w-4 h-4 rounded-full bg-[#d7d2d0] shadow-[inset_2px_3px_5px_rgba(0,0,0,0.6)] border border-zinc-200" />
                    
                    {/* 2. The Back Wire: Sits slightly "behind" to create the loop wrap effect */}
                    <div className="absolute left-[10px] top-[14px] w-[30px] h-[10px] border-b-[3px] border-[#B8860B] rounded-full opacity-40 blur-[1px]" />


                    {/* 3. The Main Gold Wire: Extends off the left edge (-24px) into the hole */}
                    <div className="absolute left-0 top-[10px] w-[42px] h-[14px] border-y-[3px] border-r-[3px] border-[#D4AF37] rounded-r-full shadow-[3px_4px_6px_rgba(0,0,0,0.3)] z-10" />
                    
                    {/* 4. Metallic Highlight: A thinner, lighter line on top of the gold for a "shiny" look */}
                    <div className="absolute left-[2px] top-[11px] w-[38px] h-[10px] border-y-[1px] border-r-[1px] border-[#FFF3A3] rounded-r-full z-20 opacity-60" />
                    
                  </div>
                ))}
              </div>
                
                {/* Margin Line */}
                <div className="absolute left-20 top-0 bottom-0 w-[1px] bg-red-300/40 z-20 pointer-events-none" />


                <div className="pl-24 pr-12 pt-[32px] pb-14" style={{pointerEvents: boxMode ? "none" : "auto", position: 'relative', zIndex: 10}}>
                  <input className="text-4xl font-bold mb-[24px] w-full bg-white outline-none transition-colors pb-2 relative z-20" style={{fontFamily:'"Bilbo", cursive', color:ACCENT, borderBottom:`2px solid ${ACCENT}22`}} value={activeNote.subject} onChange={e=>setNotes(prev=>prev.map(n=>n.id===activeTabId?{...n,subject:e.target.value}:n))} />
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={saveSelection}
                    onMouseUp={saveSelection}
                    onFocus={saveSelection}
                    onSelect={saveSelection}
                    onInput={()=>{saveSelection(); const content = editorRef.current?.innerHTML||""; setNotes(prev=>prev.map(n=>n.id===activeTabId?{...n,pages:n.pages.map((p,i)=>i===currentPageIdx?content:p)}:n))}}
                    style={{fontFamily:'"Original Surfer", cursive', pointerEvents: boxMode?"none":"auto", lineHeight: "32px"}}
                    className="w-full min-h-[1000px] outline-none text-xl break-words [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
                  />
                </div>


                {(activeNote.boxes[currentPageIdx] || []).map((box) => (
                  <div 
                    key={box.id}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Delete' || e.key === 'Backspace') deleteBox(box.id);
                    }}
                    onMouseDown={(e) => onBoxMouseDown(e, box)}
                    className={`absolute p-2 transition-colors outline-none z-50 group bg-white/90 ${selectedBoxId === box.id ? 'border-2' : 'border border-dashed hover:border-zinc-500'}`}
                    style={{ 
                      left: box.x, top: box.y, width: box.w, height: box.h,
                      borderColor: selectedBoxId === box.id ? ACCENT : "#a1a1aa",
                      cursor: boxMode || draggingBox?.id === box.id ? "grab" : "text"
                    }}
                  >
                    {selectedBoxId === box.id && boxMode && <div className="absolute -top-6 right-0 text-[9px] text-white bg-red-500 px-1 rounded">Press Del</div>}
                    <textarea
                      onKeyDown={e => e.stopPropagation()}
                      className="w-full h-full bg-transparent outline-none resize-none text-lg leading-tight"
                      style={{ fontFamily: '"Original Surfer", cursive', pointerEvents: boxMode || draggingBox?.id === box.id ? "none" : "auto" }}
                      value={box.content}
                      onChange={(e) => updateBoxContent(box.id, e.target.value)}
                    />
                  </div>
                ))}


                {draftBox && draftBox.w > 2 && (
                  <div style={{ position:"absolute", left:draftBox.x, top:draftBox.y, width:draftBox.w, height:draftBox.h, border:`2px dashed ${ACCENT}`, background:`${ACCENT}10`, borderRadius:4, pointerEvents:"none", zIndex:60 }} />
                )}


                <div className="flex justify-center items-center gap-10 py-10 relative z-20">
                  <button disabled={currentPageIdx===0} onClick={()=>setCurrentPageIdx(p=>p-1)} className="text-3xl disabled:opacity-10 hover:scale-110 transition-transform bg-white rounded-full px-2" style={{color:ACCENT}}>&larr;</button>
                  <span className="px-4 py-1 bg-zinc-50 rounded-full text-[10px] font-bold text-zinc-400">PAGE {currentPageIdx+1} / {activeNote.pages.length}</span>
                  <button onClick={()=>{ if(currentPageIdx<activeNote.pages.length-1) setCurrentPageIdx(p=>p+1); else { const np=[...activeNote.pages,""]; setNotes(prev=>prev.map(n=>n.id===activeTabId?{...n,pages:np}:n)); setCurrentPageIdx(activeNote.pages.length); } }} className="text-3xl hover:scale-110 transition-transform bg-white rounded-full px-2" style={{color:ACCENT}}>&rarr;</button>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
