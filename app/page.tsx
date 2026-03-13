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
import { FloatingToolbar } from "@/app/components/FloatingToolbar"
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

  const activeNote = (notes.find(n => n.id === activeTabId) ?? notes[0]) as NoteData

  // Dialog helpers
  const openPrompt  = (title: string, defaultValue: string, placeholder: string, confirmLabel: string, onConfirm: (v: string) => void) => setDialog({ type: "prompt", title, defaultValue, placeholder, confirmLabel, onConfirm })
  const openConfirm = (title: string, message: string, confirmLabel: string, danger: boolean, onConfirm: () => void) => setDialog({ type: "confirm", title, message, confirmLabel, danger, onConfirm })
  const openAlert   = (title: string, message?: string) => setDialog({ type: "alert", title, message })

  // Hooks
  const editor = useEditor({ editorRef, activeTabId, currentPageIdx, setNotes, accent })
  const boxes  = useBoxDrawing({ activeTabId, currentPageIdx, zoom, setNotes, paperRef, sketchMode, sketchPrompt, setSketchMode, setSketchPrompt })

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

  // Load settings from cloud
  useEffect(() => {
    if (!user) return
    supabase.from("user_settings").select("settings").eq("user_id", user.id).single().then(({ data }) => {
      if (!data?.settings) return
      const s = data.settings
      if (s.accent)                    setAccent(s.accent)
      if (s.theme)                     setTheme(s.theme)
      if (s.autoSave      !== undefined) setAutoSave(s.autoSave)
      if (s.spellCheck    !== undefined) setSpellCheck(s.spellCheck)
      if (s.editorFont)                setEditorFont(s.editorFont)
      if (s.lineSpacing)               setLineSpacing(s.lineSpacing)
      if (s.paperStyle)                setPaperStyle(s.paperStyle)
      if (s.showBinding   !== undefined) setShowBinding(s.showBinding)
      if (s.reduceMotion  !== undefined) setReduceMotion(s.reduceMotion)
      if (s.sidebarOnStart !== undefined) setSidebarOnStart(s.sidebarOnStart)
      if (s.bgEffect      !== undefined) setBgEffect(s.bgEffect)
    })
  }, [user])

  // Save settings to cloud (debounced)
  useEffect(() => {
    if (!user) return
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        settings: { accent, theme, autoSave, spellCheck, editorFont, lineSpacing, paperStyle, showBinding, reduceMotion, sidebarOnStart, bgEffect }
      })
      if (error) console.error("Settings save failed:", error.message, error.code)
    }, 1000)
    return () => clearTimeout(timer)
  }, [accent, theme, autoSave, spellCheck, editorFont, lineSpacing, paperStyle, showBinding, reduceMotion, sidebarOnStart, bgEffect, user])

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
  const lastSyncKey = useRef<string>("")
  useEffect(() => {
    if (!activeNote) return
    const key = `${activeTabId}:${currentPageIdx}:${gridView}`
    if (!gridView && editorRef.current && lastSyncKey.current !== key) {
      editorRef.current.innerHTML = activeNote.pages[currentPageIdx] || ""
      lastSyncKey.current = key
    }
  }, [activeTabId, currentPageIdx, gridView, activeNote?.pages])

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

  const { backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize } = getPaperBg(lineSpacing, paperStyle, theme === "dark")


  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#F0ECEA", color: theme === "dark" ? "#FAFAFA" : "#1A1A1A", backgroundImage: bgEffect ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='${theme === "dark" ? "0.035" : "0.045"}'/%3E%3C/svg%3E")` : undefined, backgroundRepeat: "repeat" }}>
      {dialog && <AppDialog config={dialog} accent={accent} onClose={() => setDialog(null)} />}
      {showSettings && <SettingsView user={user} onClose={() => setShowSettings(false)} accentColor={accent} setAccentColor={setAccent} theme={theme} setTheme={setTheme} autoSave={autoSave} setAutoSave={setAutoSave} spellCheck={spellCheck} setSpellCheck={setSpellCheck} editorFont={editorFont} setEditorFont={setEditorFont} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} paperStyle={paperStyle} setPaperStyle={setPaperStyle} showBinding={showBinding} setShowBinding={setShowBinding} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} sidebarOnStart={sidebarOnStart} setSidebarOnStart={setSidebarOnStart} bgEffect={bgEffect} setBgEffect={setBgEffect} />}
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Bilbo&family=Licorice&family=Original+Surfer&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');${reduceMotion ? "*, *::before, *::after { transition: none !important; animation: none !important; }" : ""} .ls-toolbar { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; letter-spacing: -0.01em; }` }} />
      {theme === "dark" && <style dangerouslySetInnerHTML={{ __html: `.ls-toolbar { background-color: rgba(18,18,20,0.85) !important; border-color: rgba(255,255,255,0.08) !important; box-shadow: 0 4px 32px rgba(0,0,0,0.5) !important; backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; } .ls-toolbar .hover\\:bg-zinc-200, .ls-toolbar .hover\\:bg-zinc-100 { color: #A1A1AA !important; background-color: transparent !important; border-color: transparent !important; box-shadow: none !important; } .ls-toolbar .hover\\:bg-zinc-200:hover, .ls-toolbar .hover\\:bg-zinc-100:hover { background-color: rgba(255,255,255,0.08) !important; color: #FAFAFA !important; } .ls-toolbar select, .ls-toolbar input { background-color: rgba(255,255,255,0.05) !important; color: #FAFAFA !important; border-color: rgba(255,255,255,0.08) !important; } .ls-toolbar .text-zinc-600 { color: #A1A1AA !important; } .ls-toolbar .border-zinc-200, .ls-toolbar .border-zinc-200\\/80 { border-color: rgba(255,255,255,0.08) !important; } .ls-toolbar .bg-white, .ls-toolbar .bg-zinc-50 { background-color: transparent !important; }` }} />}

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
            <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#EDE8E6" }}>
              <div className="text-center">
                <p className="text-5xl font-bold mb-6" style={{ fontFamily: '"Licorice", cursive', color: accent }}>Ready?</p>
                <button onClick={() => addNote(null)} className="w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white mx-auto transition-all hover:scale-110" style={{ backgroundColor: accent }}>+</button>
              </div>
            </main>
          ) : gridView ? (
            <GridView activeNote={activeNote} activeTabId={activeTabId} carouselIdx={carouselIdx} lineSpacing={lineSpacing} paperStyle={paperStyle} theme={theme} editorFont={editorFont} accent={accent} setCarouselIdx={setCarouselIdx} setGridView={setGridView} setCurrentPageIdx={setCurrentPageIdx} setNotes={setNotes} />
          ) : (
            <main className="flex-1 overflow-auto px-8 pt-16 pb-8 flex justify-center" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#EDE8E6" }}>
              <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }} className="w-full max-w-5xl shrink-0">
                <div style={{ position: "relative" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 4, right: -4, bottom: 0, backgroundColor: theme === "dark" ? "#1f1f23" : "#f0e9e0", borderRadius: 2, zIndex: 1, boxShadow: "2px 0 6px rgba(0,0,0,0.10)" }} />
                    <div style={{ position: "absolute", top: 0, left: 8, right: -8, bottom: 0, backgroundColor: theme === "dark" ? "#1a1a1e" : "#e8e0d4", borderRadius: 2, zIndex: 0, boxShadow: "2px 0 6px rgba(0,0,0,0.08)" }} />
                    <div style={{ position: "absolute", top: 0, left: 12, right: -12, bottom: 0, backgroundColor: theme === "dark" ? "#151518" : "#dfd6c8", borderRadius: 2, zIndex: -1 }} />

                    <div ref={paperRef} id="editor-paper" className="relative" style={{ minHeight: "1300px", cursor: "default", backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize, zIndex: 2, boxShadow: theme === "dark" ? "0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" : "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)" }} onMouseDown={boxes.onPaperMouseDown}>

                      {/* Spiral binding */}
                      {showBinding && !bindingCompact && (
                        <div className="absolute left-[-24px] top-0 bottom-0 w-16 z-30 pointer-events-none flex flex-col justify-center overflow-hidden">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <div key={i} className="relative w-full h-[32px]">
                              <svg width="56" height="32" viewBox="0 0 56 32" className="absolute left-0 top-0 overflow-visible">
                                <defs>
                                  <linearGradient id="wire-gold-v" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#8B6914" />
                                    <stop offset="10%" stopColor="#FFF3A3" />
                                    <stop offset="40%" stopColor="#D4AF37" />
                                    <stop offset="80%" stopColor="#A67C00" />
                                    <stop offset="100%" stopColor="#4A3B0A" />
                                  </linearGradient>
                                  <filter id="shadow-v" x="-20%" y="-20%" width="150%" height="150%">
                                    <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.45" />
                                  </filter>
                                </defs>
                                
                                {/* Hole Punch */}
                                <rect x="34" y="6" width="8" height="14" rx="2" fill="#111" />
                                <rect x="34" y="6" width="8" height="14" rx="2" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
                                <rect x="33.5" y="5.5" width="9" height="15" rx="2.5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" opacity="0.6" />

                                {/* Wires */}
                                <path d="M 38 11 C 6 11, 6 7, 38 7" fill="none" stroke="url(#wire-gold-v)" strokeWidth="2.5" strokeLinecap="round" filter="url(#shadow-v)" />
                                <path d="M 38 19 C 6 19, 6 15, 38 15" fill="none" stroke="url(#wire-gold-v)" strokeWidth="2.5" strokeLinecap="round" filter="url(#shadow-v)" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      )}
                      {showBinding && bindingCompact && (
                        <div className="absolute top-[-24px] left-0 right-0 h-[56px] z-30 pointer-events-none flex flex-row pl-[32px] overflow-hidden">
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} className="relative h-full w-[32px]">
                              <svg width="32" height="56" viewBox="0 0 32 56" className="absolute left-0 top-0 overflow-visible">
                                <defs>
                                  <linearGradient id="wire-gold-h" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#8B6914" />
                                    <stop offset="10%" stopColor="#FFF3A3" />
                                    <stop offset="40%" stopColor="#D4AF37" />
                                    <stop offset="80%" stopColor="#A67C00" />
                                    <stop offset="100%" stopColor="#4A3B0A" />
                                  </linearGradient>
                                  <filter id="shadow-h" x="-20%" y="-20%" width="150%" height="150%">
                                    <feDropShadow dx="2" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.45" />
                                  </filter>
                                </defs>

                                {/* Hole Punch */}
                                <rect x="6" y="34" width="14" height="8" rx="2" fill="#111" />
                                <rect x="6" y="34" width="14" height="8" rx="2" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
                                <rect x="5.5" y="33.5" width="15" height="9" rx="2.5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" opacity="0.6" />

                                {/* Wires */}
                                <path d="M 11 38 C 11 6, 7 6, 7 38" fill="none" stroke="url(#wire-gold-h)" strokeWidth="2.5" strokeLinecap="round" filter="url(#shadow-h)" />
                                <path d="M 19 38 C 19 6, 15 6, 15 38" fill="none" stroke="url(#wire-gold-h)" strokeWidth="2.5" strokeLinecap="round" filter="url(#shadow-h)" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="absolute left-28 top-0 bottom-0 w-[1px] z-20 pointer-events-none" style={{ backgroundColor: theme === "dark" ? "rgba(248,113,113,0.3)" : "rgba(252,165,165,0.6)" }} />
                      <div className="absolute top-0 left-0 bottom-0 pointer-events-none" style={{ width: 220, background: "linear-gradient(to right, rgba(0,0,0,0.065) 0%, rgba(0,0,0,0.018) 50%, transparent 100%)", zIndex: 21 }} />

                      <div ref={editorRef} className="w-full min-h-[1000px]" style={{ pointerEvents: "none" }} />

                      <style>{`
                        .note-box { transition: box-shadow 0.15s ease, border-color 0.15s ease; }
                        .note-box:hover .nb-drag { opacity: 1 !important; }
                        .note-box textarea { caret-color: ${accent.length > 7 ? accent.slice(0, 7) : accent}; color: #1a1a1a !important; }
                      `}</style>

                      {(activeNote.boxes[currentPageIdx] || []).map(box => {
                        const isSelected = boxes.selectedBoxId === box.id
                        const accentSolid = accent.length > 7 ? accent.slice(0, 7) : accent
                        const corners = ["nw","ne","sw","se"]
                        const cornerPos: Record<string, React.CSSProperties> = {
                          nw: { top: -4, left: -4, cursor: "nw-resize" },
                          ne: { top: -4, right: -4, cursor: "ne-resize" },
                          sw: { bottom: -4, left: -4, cursor: "sw-resize" },
                          se: { bottom: -4, right: -4, cursor: "se-resize" },
                        }
                        const edges = ["n","s","w","e"]
                        const edgePos: Record<string, React.CSSProperties> = {
                          n: { top: -3, left: "calc(50% - 12px)", width: 24, cursor: "n-resize" },
                          s: { bottom: -3, left: "calc(50% - 12px)", width: 24, cursor: "s-resize" },
                          w: { top: "calc(50% - 12px)", left: -3, height: 24, cursor: "w-resize" },
                          e: { top: "calc(50% - 12px)", right: -3, height: 24, cursor: "e-resize" },
                        }
                        return (
                          <div
                            key={box.id}
                            id={`box-${box.id}`}
                            className="note-box"
                            onMouseDown={e => { e.stopPropagation(); boxes.selectBox(box.id) }}
                            style={{
                              position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h,
                              border: isSelected ? `1px solid ${accentSolid}55` : "1px solid transparent",
                              borderRadius: 2,
                              backgroundColor: "transparent",
                              boxShadow: "none",
                              zIndex: 50, overflow: "visible",
                            }}
                          >
                            {/* Drag zone — invisible strip, shows grip on hover */}
                            <div
                              className="nb-drag"
                              onMouseDown={e => boxes.startDrag(e, box)}
                              style={{
                                position: "absolute", top: 0, left: 0, right: 0, height: 18,
                                cursor: "grab", zIndex: 10, borderRadius: "2px 2px 0 0",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                opacity: isSelected ? 1 : 0, transition: "opacity 0.12s",
                              }}
                            >
                              <svg width="20" height="6" viewBox="0 0 20 6" fill="none">
                                {[0,6,12].map(x => <g key={x}><circle cx={x+2} cy={2} r={1.2} fill={`${accentSolid}70`}/><circle cx={x+2} cy={5} r={1.2} fill={`${accentSolid}70`}/></g>)}
                              </svg>
                            </div>

                            {/* Corner resize handles */}
                            {isSelected && corners.map(h => (
                              <div key={h} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); boxes.startResize(e, box, h) }}
                                style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", background: "white", border: `1.5px solid ${accentSolid}`, boxShadow: "0 1px 4px rgba(0,0,0,0.18)", zIndex: 20, ...cornerPos[h] }} />
                            ))}

                            {/* Edge resize handles */}
                            {isSelected && edges.map(h => (
                              <div key={h} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); boxes.startResize(e, box, h) }}
                                style={{ position: "absolute", height: ["n","s"].includes(h) ? 6 : 24, width: ["w","e"].includes(h) ? 6 : 24, borderRadius: 3, background: `${accentSolid}40`, zIndex: 20, ...edgePos[h] }} />
                            ))}

                            {/* Delete — subtle X inside top-right */}
                            {isSelected && (
                              <button onMouseDown={e => { e.stopPropagation(); boxes.deleteBox(box.id) }}
                                style={{ position: "absolute", top: 2, right: 4, width: 16, height: 16, borderRadius: 4, background: "transparent", border: "none", cursor: "pointer", fontSize: 11, lineHeight: 1, color: `${accentSolid}99`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, padding: 0 }}
                              >×</button>
                            )}

                            {/* Content */}
                            <div style={{ position: "absolute", top: 18, left: 0, right: 0, bottom: 0, padding: "0 8px 6px", overflow: "hidden" }}>
                              {boxes.loadingBoxId === box.id ? (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#a1a1aa", fontSize: 11, letterSpacing: "0.12em", fontFamily: "monospace" }}>generating…</div>
                              ) : box.content.includes("http") || box.content.startsWith("data:image") ? (
                                <img src={box.content} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "grayscale(1)", mixBlendMode: "multiply", opacity: 0.9 }} alt="sketch" />
                              ) : (
                                <textarea
                                  onKeyDown={e => e.stopPropagation()}
                                  onMouseDown={e => e.stopPropagation()}
                                  style={{ width: "100%", height: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: '"EB Garamond", Georgia, serif', fontSize: 17, lineHeight: 1.6, color: "#1a1a1a", cursor: "text", padding: 0 }}
                                  value={box.content}
                                  onChange={e => boxes.updateBoxContent(box.id, e.target.value)}
                                />
                              )}
                            </div>
                          </div>
                        )
                      })}

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
          <RightToolbar theme={theme} accent={accent} gridView={gridView} sketchMode={sketchMode} rightSidebarOpen={rightSidebarOpen} currentPageIdx={currentPageIdx} setRightSidebarOpen={setRightSidebarOpen} setGridView={setGridView} setCarouselIdx={setCarouselIdx} setSketchMode={setSketchMode} setSketchPrompt={setSketchPrompt} openAlert={openAlert} clearPage={clearPage} />
        )}
        {notes.length > 0 && !gridView && (
          <FloatingToolbar accent={accent} />
        )}
      </div>
    </div>
  )
}
