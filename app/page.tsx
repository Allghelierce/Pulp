"use client"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { NoteData, FolderData, DialogConfig } from "@/app/types"
import { uid } from "@/app/lib/uid"
import { getPaperBg } from "@/app/lib/paperStyle"
import { useEditor } from "@/app/hooks/useEditor"
import { useBoxDrawing } from "@/app/hooks/useBoxDrawing"
import { AppDialog } from "@/app/components/AppDialog"
import { SettingsView } from "@/app/components/settings/SettingsView"
import { Sidebar } from "@/app/components/Sidebar"
import { FormattingToolbar } from "@/app/components/FormattingToolbar"
import { DocumentToolbar } from "@/app/components/DocumentToolbar"
import { RightToolbar } from "@/app/components/RightToolbar"
import { GridView } from "@/app/components/GridView"

export default function NoteApp() {
  const [notes, setNotes] = useState<NoteData[]>([])
  const [folders, setFolders] = useState<FolderData[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [dialog, setDialog] = useState<DialogConfig | null>(null)

  // UI state
  const [zoom, setZoom] = useState("0.85")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [gridView, setGridView] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [bindingCompact, setBindingCompact] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<number | null>(null)
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)
  const [boxMode, setBoxMode] = useState(false)
  const [sketchMode, setSketchMode] = useState(false)
  const [sketchPrompt, setSketchPrompt] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [customSize, setCustomSize] = useState("16")

  // Settings
  const [accent, setAccent] = useState("#600b2779")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [autoSave, setAutoSave] = useState(true)
  const [spellCheck, setSpellCheck] = useState(true)
  const [editorFont, setEditorFont] = useState("EB Garamond")
  const [lineSpacing, setLineSpacing] = useState<"compact" | "normal" | "relaxed">("normal")
  const [paperStyle, setPaperStyle] = useState<"lined" | "dotgrid" | "plain" | "stenopad">("lined")
  const [showBinding, setShowBinding] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [sidebarOnStart, setSidebarOnStart] = useState(true)
  const [bgEffect, setBgEffect] = useState(true)

  const editorRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeNote = (notes.find(n => n.id === activeTabId) ?? notes[0]) as NoteData

  // Dialog helpers
  const openPrompt  = (title: string, defaultValue: string, placeholder: string, confirmLabel: string, onConfirm: (v: string) => void) => setDialog({ type: "prompt", title, defaultValue, placeholder, confirmLabel, onConfirm })
  const openConfirm = (title: string, message: string, confirmLabel: string, danger: boolean, onConfirm: () => void) => setDialog({ type: "confirm", title, message, confirmLabel, danger, onConfirm })
  const openAlert   = (title: string, message?: string) => setDialog({ type: "alert", title, message })

  // Hooks
  const editor = useEditor({ editorRef, activeTabId, currentPageIdx, setNotes, accent })
  const boxes  = useBoxDrawing({ activeTabId, currentPageIdx, zoom, setNotes, paperRef, boxMode, sketchMode, sketchPrompt, setSketchMode, setBoxMode, setSketchPrompt })

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session: any) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // Resize observer for binding layout
  useEffect(() => {
    const check = () => { if (paperRef.current) setBindingCompact(paperRef.current.offsetWidth < 680) }
    check()
    const ro = new ResizeObserver(check)
    if (paperRef.current) ro.observe(paperRef.current)
    return () => ro.disconnect()
  }, [])

  // Cloud autosave
  useEffect(() => {
    if (!autoSave || isLoading || !activeNote || !user) return
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("notes").upsert({ id: activeNote.id, subject: activeNote.subject, pages: activeNote.pages, boxes: activeNote.boxes, folder_id: activeNote.folderId, user_id: user.id })
      if (error) console.error("Save failed:", error.message)
    }, 2000)
    return () => clearTimeout(timer)
  }, [activeNote, user])

  // Sync editor DOM with active note/page
  useEffect(() => {
    if (!activeNote) return
    if (!gridView && editorRef.current && editorRef.current.innerHTML !== activeNote.pages[currentPageIdx])
      editorRef.current.innerHTML = activeNote.pages[currentPageIdx] || ""
  }, [activeTabId, currentPageIdx, gridView, activeNote])

  // Fetch notes from cloud
  useEffect(() => {
    const fetchNotes = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { setIsLoading(false); return }
      const { data, error } = await supabase.from("notes").select("*").eq("user_id", u.id)
      if (!error && data?.length) {
        setNotes(data.map(n => ({ id: n.id, subject: n.subject, pages: n.pages ?? [""], boxes: n.boxes ?? {}, folderId: n.folder_id ?? null })))
        setActiveTabId(data[0].id)
      } else { setNotes([]); setActiveTabId(null) }
      setIsLoading(false)
    }
    fetchNotes()
  }, [user])

  // Note/folder actions
  const addNote = (folderId: number | null = null) =>
    openPrompt("Name your note", "New Note", "Note name…", "Create", name => {
      if (!name.trim()) return
      const id = uid()
      setNotes(prev => [...prev, { id, subject: name.trim(), pages: [""], folderId, boxes: {} }])
      setActiveTabId(id); setCurrentPageIdx(0)
    })

  const renameNote = (id: string, currentName: string) =>
    openPrompt("Rename note", currentName, "Note name…", "Rename", newName => {
      if (newName.trim()) setNotes(prev => prev.map(n => n.id === id ? { ...n, subject: newName.trim() } : n))
    })

  const deleteNote = (id: string) =>
    openConfirm("Delete note?", "This cannot be undone.", "Delete", true, async () => {
      setNotes(prev => prev.filter(n => n.id !== id))
      if (activeTabId === id) setActiveTabId(notes.find(n => n.id !== id)?.id ?? null)
      if (user) await supabase.from("notes").delete().eq("id", id)
    })

  const clearPage = () =>
    openConfirm("Clear this page?", "All content on this page will be deleted. This cannot be undone.", "Clear", true, () => {
      if (editorRef.current) editorRef.current.innerHTML = ""
      setNotes(prev => prev.map(n => {
        if (n.id !== activeTabId) return n
        const newPages = [...n.pages]; newPages[currentPageIdx] = ""
        const newBoxes = { ...n.boxes }; newBoxes[currentPageIdx] = []
        return { ...n, pages: newPages, boxes: newBoxes }
      }))
    })

  const addFolder = () => { const id = Date.now(); setFolders(prev => [...prev, { id, name: "New Folder", open: true }]); setRenamingFolder(id) }
  const toggleFolder = (id: number) => setFolders(prev => prev.map(f => f.id === id ? { ...f, open: !f.open } : f))
  const renameFolder = (id: number, name: string) => setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  const deleteFolder = (id: number) =>
    openConfirm("Delete folder?", "Notes inside will be moved to root.", "Delete", true, () => {
      setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n))
      setFolders(prev => prev.filter(f => f.id !== id))
    })

  const handleDropNote = (e: React.DragEvent, targetFolderId: number | null, targetNoteId?: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!draggedNoteId || draggedNoteId === targetNoteId) return
    setNotes(prev => {
      const copy = [...prev]
      const draggedIdx = copy.findIndex(n => n.id === draggedNoteId)
      if (draggedIdx === -1) return prev
      const draggedNote = { ...copy[draggedIdx], folderId: targetFolderId }
      copy.splice(draggedIdx, 1)
      if (targetNoteId) copy.splice(copy.findIndex(n => n.id === targetNoteId), 0, draggedNote)
      else copy.push(draggedNote)
      return copy
    })
    setDraggedNoteId(null)
  }

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

  if (isLoading) return (
    <div className="h-screen bg-[#110d0e] flex items-center justify-center text-white font-sans">
      <div className="animate-pulse text-xl">Loading Letter Soup...</div>
    </div>
  )

  const { backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize } = getPaperBg(lineSpacing, paperStyle, theme)
  const lh = ({ compact: 24, normal: 32, relaxed: 40 } as Record<string, number>)[lineSpacing] ?? 32

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: theme === "dark" ? "#1C1C1E" : "#F0ECEA", color: theme === "dark" ? "#E5E5E7" : "#1A1A1A", backgroundImage: bgEffect ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='${theme === "dark" ? "0.035" : "0.045"}'/%3E%3C/svg%3E")` : undefined, backgroundRepeat: "repeat" }}>
      {dialog && <AppDialog config={dialog} accent={accent} onClose={() => setDialog(null)} />}
      {showSettings && <SettingsView user={user} onClose={() => setShowSettings(false)} accentColor={accent} setAccentColor={setAccent} theme={theme} setTheme={setTheme} autoSave={autoSave} setAutoSave={setAutoSave} spellCheck={spellCheck} setSpellCheck={setSpellCheck} editorFont={editorFont} setEditorFont={setEditorFont} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} paperStyle={paperStyle} setPaperStyle={setPaperStyle} showBinding={showBinding} setShowBinding={setShowBinding} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} sidebarOnStart={sidebarOnStart} setSidebarOnStart={setSidebarOnStart} bgEffect={bgEffect} setBgEffect={setBgEffect} />}
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Bilbo&family=Licorice&family=Original+Surfer&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');${reduceMotion ? "*, *::before, *::after { transition: none !important; animation: none !important; }" : ""}` }} />
      {theme === "dark" && <style dangerouslySetInnerHTML={{ __html: `.ls-toolbar { background-color: #2C2C2E !important; border-color: #38383A !important; } .ls-toolbar button { background-color: #3A3A3C !important; color: #E5E5E7 !important; border-color: #48484A !important; } .ls-toolbar select, .ls-toolbar input { background-color: #3A3A3C !important; color: #E5E5E7 !important; border-color: #48484A !important; } .ls-toolbar .text-zinc-600 { color: #A1A1AA !important; } .ls-toolbar .border-zinc-200 { border-color: #48484A !important; }` }} />}

      <Sidebar notes={notes} folders={folders} activeTabId={activeTabId} accent={accent} draggedNoteId={draggedNoteId} renamingFolder={renamingFolder} user={user} sidebarOpen={sidebarOpen} onAddNote={addNote} onAddFolder={addFolder} onSelectNote={id => { setActiveTabId(id); setCurrentPageIdx(0) }} onRenameNote={renameNote} onDeleteNote={deleteNote} onToggleFolder={toggleFolder} onRenameFolder={renameFolder} onDeleteFolder={deleteFolder} onSetRenamingFolder={setRenamingFolder} onSetDraggedNoteId={setDraggedNoteId} onDropNote={handleDropNote} onOpenSettings={() => setShowSettings(true)} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <button onClick={() => setSidebarOpen(v => !v)} className="absolute left-2 top-[54px] z-50 text-zinc-400 hover:text-zinc-700 transition-colors p-1 text-2xl leading-none">
          {sidebarOpen ? "‹" : "›"}
        </button>

        {notes.length > 0 && <>
          <FormattingToolbar accent={accent} execCmd={editor.execCmd} saveSelection={editor.saveSelection} toggleScript={editor.toggleScript} insertHTML={editor.insertHTML} openAlert={openAlert} downloadNote={downloadNote} editorRef={editorRef} />
          <DocumentToolbar accent={accent} zoom={zoom} customSize={customSize} saveSelection={editor.saveSelection} execCmd={editor.execCmd} applyFontSize={editor.applyFontSize} applyBlockStyle={editor.applyBlockStyle} setCustomSize={setCustomSize} setZoom={setZoom} insertTable={editor.insertTable} insertColumns={editor.insertColumns} />
        </>}

        <div className="flex-1 flex overflow-hidden relative">
          {notes.length === 0 ? (
            <main className="flex-1 flex items-center justify-center bg-[#EDE8E6]">
              <div className="text-center">
                <p className="text-5xl font-bold mb-6" style={{ fontFamily: '"Licorice", cursive', color: accent }}>Ready?</p>
                <button onClick={() => addNote(null)} className="w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white mx-auto transition-all hover:scale-110" style={{ backgroundColor: accent }}>+</button>
              </div>
            </main>
          ) : gridView ? (
            <GridView activeNote={activeNote} activeTabId={activeTabId} carouselIdx={carouselIdx} lineSpacing={lineSpacing} paperStyle={paperStyle} theme={theme} editorFont={editorFont} accent={accent} setCarouselIdx={setCarouselIdx} setGridView={setGridView} setCurrentPageIdx={setCurrentPageIdx} setNotes={setNotes} />
          ) : (
            <main className="flex-1 overflow-auto px-8 pt-16 pb-8 flex justify-center" style={{ backgroundColor: theme === "dark" ? "#141414" : "#EDE8E6" }}>
              <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }} className="w-full max-w-5xl shrink-0">
                <div style={{ position: "relative" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 4, right: -4, bottom: 0, backgroundColor: theme === "dark" ? "#2a2a2a" : "#f0e9e0", borderRadius: 2, zIndex: 1, boxShadow: "2px 0 6px rgba(0,0,0,0.10)" }} />
                    <div style={{ position: "absolute", top: 0, left: 8, right: -8, bottom: 0, backgroundColor: theme === "dark" ? "#232323" : "#e8e0d4", borderRadius: 2, zIndex: 0, boxShadow: "2px 0 6px rgba(0,0,0,0.08)" }} />
                    <div style={{ position: "absolute", top: 0, left: 12, right: -12, bottom: 0, backgroundColor: theme === "dark" ? "#1c1c1c" : "#dfd6c8", borderRadius: 2, zIndex: -1 }} />

                    <div ref={paperRef} className="relative" style={{ minHeight: "1300px", cursor: boxMode ? "crosshair" : "default", backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize, zIndex: 2, boxShadow: theme === "dark" ? "0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" : "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)" }} onMouseDown={boxes.onPaperMouseDown} onMouseMove={boxes.onPaperMouseMove} onMouseUp={boxes.onPaperMouseUp} onMouseLeave={boxes.onPaperMouseUp}>

                      {/* Spiral binding */}
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
                              <div className="absolute left-2 top-[34px] w-5 h-4 rounded-sm bg-[#d7d2d0] shadow-[inset_2px_3px_5px_rgba(0,0,0,0.6)] border border-zinc-200" />
                              <div className="absolute left-[14px] top-[12px] w-[10px] h-[28px] border-r-[3px] border-[#8B6914] rounded-full opacity-40 blur-[0.5px]" />
                              <div className="absolute left-[10px] top-0 w-[15px] h-[42px] border-l-[3.5px] border-r-[3.5px] border-b-[3.5px] border-[#D4AF37] rounded-b-full shadow-[3px_4px_6px_rgba(0,0,0,0.3)] z-10" style={{ borderColor: '#D4AF37 #D4AF37 #8B6914 transparent' }} />
                              <div className="absolute left-[11px] top-[2px] w-[10px] h-[38px] border-l-[1px] border-r-[1px] border-b-[1.5px] border-[#FFF3A3] rounded-b-full z-20 opacity-50" />
                              <div className="absolute left-[18px] top-[38px] w-[2px] h-[10px] bg-black/10 blur-[2px] z-0" />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="absolute left-28 top-0 bottom-0 w-[1px] z-20 pointer-events-none" style={{ backgroundColor: theme === "dark" ? "rgba(248,113,113,0.3)" : "rgba(252,165,165,0.6)" }} />
                      <div className="absolute top-0 left-0 bottom-0 pointer-events-none" style={{ width: 220, background: "linear-gradient(to right, rgba(0,0,0,0.065) 0%, rgba(0,0,0,0.018) 50%, transparent 100%)", zIndex: 21 }} />

                      <div className="pl-36 pr-12 pt-[32px] pb-14" style={{ pointerEvents: boxMode ? "none" : "auto", position: "relative", zIndex: 10 }}>
                        <div
                          ref={editorRef}
                          contentEditable
                          suppressContentEditableWarning
                          spellCheck={spellCheck}
                          onKeyDown={editor.handleEditorKeyDown}
                          onKeyUp={editor.saveSelection}
                          onMouseUp={editor.saveSelection}
                          onFocus={editor.saveSelection}
                          onBlur={editor.saveSelection}
                          onSelect={editor.saveSelection}
                          onInput={() => { editor.saveSelection(); if (syncTimer.current) clearTimeout(syncTimer.current); syncTimer.current = setTimeout(editor.syncContent, 300) }}
                          style={{ fontFamily: `"${editorFont}", serif`, pointerEvents: boxMode ? "none" : "auto", lineHeight: `${lh}px`, color: theme === "dark" ? "#E5E5E7" : "#1A1A1A" }}
                          className="w-full min-h-[1000px] outline-none text-xl break-words [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
                        />
                      </div>

                      {(activeNote.boxes[currentPageIdx] || []).map(box => (
                        <div
                          key={box.id}
                          tabIndex={0}
                          onKeyDown={e => { if (e.target instanceof HTMLTextAreaElement) return; if (e.key === "Backspace" || e.key === "Delete") boxes.deleteBox(box.id) }}
                          onMouseDown={e => boxes.onBoxMouseDown(e, box)}
                          onMouseUp={boxes.makeBoxResizeHandler(box)}
                          className={`absolute p-2 transition-shadow outline-none z-50 group shadow-sm ${boxes.selectedBoxId === box.id ? "ring-2 ring-offset-2" : "border border-dashed hover:border-zinc-500"}`}
                          style={{ left: box.x, top: box.y, width: box.w, height: box.h, backgroundColor: theme === "dark" ? "rgba(44,44,46,0.95)" : "rgba(255,255,255,0.92)", boxShadow: boxes.selectedBoxId === box.id ? `0 0 0 2px white, 0 0 0 4px ${accent}` : "none", borderColor: boxes.selectedBoxId === box.id ? accent : "#a1a1aa", cursor: boxMode || boxes.draggingBox?.id === box.id ? "grab" : "default", resize: boxes.selectedBoxId === box.id ? "both" : "none", overflow: "hidden" }}
                        >
                          {boxes.selectedBoxId === box.id && (
                            <button onMouseDown={e => { e.stopPropagation(); boxes.deleteBox(box.id) }} className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-lg hover:bg-red-600 z-[60]">✕</button>
                          )}
                          {boxes.loadingBoxId === box.id ? (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs animate-pulse font-mono">GENERATING...</div>
                          ) : box.content.includes("http") || box.content.startsWith("data:image") ? (
                            <div className="w-full h-full pointer-events-none flex items-center justify-center p-1">
                              <img src={box.content} className="w-full h-full object-contain filter grayscale mix-blend-multiply opacity-90" alt="sketch" />
                            </div>
                          ) : (
                            <textarea onKeyDown={e => e.stopPropagation()} className="w-full h-full bg-transparent outline-none resize-none text-lg leading-tight overflow-hidden" style={{ fontFamily: '"Original Surfer", cursive', pointerEvents: boxMode ? "none" : "auto" }} value={box.content} onChange={e => boxes.updateBoxContent(box.id, e.target.value)} />
                          )}
                        </div>
                      ))}

                      {boxes.draftBox && boxes.draftBox.w > 2 && (
                        <div style={{ position: "absolute", left: boxes.draftBox.x, top: boxes.draftBox.y, width: boxes.draftBox.w, height: boxes.draftBox.h, border: `2px dashed ${accent}`, background: `${accent}10`, borderRadius: 4, pointerEvents: "none", zIndex: 60 }} />
                      )}

                      <div className="flex justify-center items-center gap-10 py-10 relative z-20">
                        <button disabled={currentPageIdx === 0} onClick={() => setCurrentPageIdx(p => p - 1)} className="text-3xl disabled:opacity-10 hover:scale-110 transition-transform bg-white rounded-full px-2" style={{ color: accent }}>&larr;</button>
                        <span className="px-4 py-1 bg-zinc-50 rounded-full text-[10px] font-bold text-zinc-400">PAGE {currentPageIdx + 1} / {activeNote.pages.length}</span>
                        <button onClick={() => { if (currentPageIdx < activeNote.pages.length - 1) setCurrentPageIdx(p => p + 1); else { const np = [...activeNote.pages, ""]; setNotes(prev => prev.map(n => n.id === activeTabId ? { ...n, pages: np } : n)); setCurrentPageIdx(activeNote.pages.length) } }} className="text-3xl hover:scale-110 transition-transform bg-white rounded-full px-2" style={{ color: accent }}>&rarr;</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 60, marginTop: -8, background: "radial-gradient(ellipse 90% 55% at 46% 0%, rgba(0,0,0,0.22) 0%, transparent 70%)", pointerEvents: "none", position: "relative", zIndex: 0 }} />
                </div>
              </div>
            </main>
          )}
        </div>

        {notes.length > 0 && (
          <RightToolbar theme={theme} accent={accent} gridView={gridView} sketchMode={sketchMode} rightSidebarOpen={rightSidebarOpen} currentPageIdx={currentPageIdx} setRightSidebarOpen={setRightSidebarOpen} setGridView={setGridView} setCarouselIdx={setCarouselIdx} setSketchMode={setSketchMode} setBoxMode={setBoxMode} setSketchPrompt={setSketchPrompt} openAlert={openAlert} clearPage={clearPage} />
        )}
      </div>
    </div>
  )
}
