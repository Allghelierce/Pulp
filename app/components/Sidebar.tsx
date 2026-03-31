"use client"
import { memo, useState, useRef, useCallback } from "react"
import type { NoteData, FolderData } from "@/app/types"
import { ItemMenu } from "./ItemMenu"
import { IconPicker } from "./IconPicker"
import { BackgroundPlus } from "@/components/ui/background-plus"

interface SidebarProps {
  notes: NoteData[]
  folders: FolderData[]
  activeTabId: string | null
  accent: string
  draggedNoteId: string | null
  renamingFolder: number | null
  user: any
  sidebarWidth: number
  isDragging?: boolean
  onAddNote: (folderId: number | null) => void
  onAddTypedNote: (folderId: number | null, noteType?: "notebook" | "singlepage" | "flashcard") => void
  onAddFolder: () => void
  onSelectNote: (id: string) => void
  onRenameNote: (id: string, currentName: string) => void
  onDeleteNote: (id: string) => void
  onToggleFolder: (id: number) => void
  onRenameFolder: (id: number, name: string) => void
  onDeleteFolder: (id: number) => void
  onSetRenamingFolder: (id: number | null) => void
  onSetDraggedNoteId: (id: string | null) => void
  onDropNote: (e: React.DragEvent, targetFolderId: number | null, targetNoteId?: string) => void
  onSetNoteParent: (id: string, parentId: string | undefined) => void
  onChangeNoteIcon: (id: string, icon: string) => void
  onOpenSettings: () => void
  onGoToShelf: () => void
  bookmarks: any[]
  onJumpToBookmark: (b: any) => void
  onReorderBookmarks: (b: any[]) => void
  onDeleteBookmark: (id: string) => void
  onRenameBookmark: (id: string, current: string) => void
}

export const Sidebar = memo(function Sidebar({
  notes, folders, activeTabId, accent, draggedNoteId, renamingFolder, user, sidebarWidth, isDragging,
  onAddNote, onAddTypedNote, onAddFolder, onSelectNote, onRenameNote, onDeleteNote,
  onToggleFolder, onRenameFolder, onDeleteFolder, onSetRenamingFolder,
  onSetDraggedNoteId, onDropNote, onSetNoteParent, onChangeNoteIcon, onOpenSettings, onGoToShelf,
  bookmarks, onJumpToBookmark, onReorderBookmarks, onDeleteBookmark, onRenameBookmark,
}: SidebarProps) {
  const [nestTargetId, setNestTargetId] = useState<string | null>(null)
  const [bookmarkMenuId, setBookmarkMenuId] = useState<string | null>(null)
  const [iconPicker, setIconPicker] = useState<{ noteId: string; x: number; y: number } | null>(null)
  const [draggedBookmarkId, setDraggedBookmarkId] = useState<string | null>(null)
  const [bookmarkTargetId, setBookmarkTargetId] = useState<string | null>(null)
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [holdingId, setHoldingId] = useState<string | null>(null)
  const [holdProgress, setHoldProgress] = useState(0)
  const [noteMenuId, setNoteMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [newMenuOpen, setNewMenuOpen] = useState<string | null>(null)
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set())
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startHold = useCallback((id: string) => {
    setHoldingId(id)
    setHoldProgress(0)
    const start = Date.now()
    holdIntervalRef.current = setInterval(() => {
      const p = Math.min((Date.now() - start) / 1800, 1)
      setHoldProgress(p)
      if (p >= 1) {
        clearInterval(holdIntervalRef.current!)
        holdIntervalRef.current = null
        setHoldingId(null)
        setHoldProgress(0)
        
        // Mass delete if this note is part of the multi-selection
        if (multiSelectedIds.has(id)) {
          multiSelectedIds.forEach(selectedId => {
            onDeleteNote(selectedId)
          })
          setMultiSelectedIds(new Set())
        } else {
          onDeleteNote(id)
        }
      }
    }, 16)
  }, [onDeleteNote, multiSelectedIds])

  const cancelHold = useCallback(() => {
    if (holdIntervalRef.current) { clearInterval(holdIntervalRef.current); holdIntervalRef.current = null }
    setHoldingId(null)
    setHoldProgress(0)
  }, [])

  const topLevelNotes = notes.filter(n => n.folderId === null && !n.parentId)
  const notesInFolder = (fid: number) => notes.filter(n => n.folderId === fid && !n.parentId)
  const childNotes = (parentId: string) => notes.filter(n => n.parentId === parentId)

  const isDescendant = (ancestorId: string, candidateId: string): boolean => {
    const children = notes.filter(n => n.parentId === ancestorId)
    return children.some(c => c.id === candidateId || isDescendant(c.id, candidateId))
  }

  const handleNestDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedBookmarkId) return // Differentiate between note and bookmark drag
    if (draggedNoteId && draggedNoteId !== targetId && !isDescendant(draggedNoteId, targetId)) {
      onSetNoteParent(draggedNoteId, targetId)
      onSetDraggedNoteId(null)
      setNestTargetId(null)
    }
  }

  const handleBookmarkDrop = (targetId: string) => {
    if (!draggedBookmarkId || draggedBookmarkId === targetId) {
      setDraggedBookmarkId(null)
      setBookmarkTargetId(null)
      return
    }
    const oldIdx = bookmarks.findIndex(b => b.id === draggedBookmarkId)
    const newIdx = bookmarks.findIndex(b => b.id === targetId)
    if (oldIdx === -1 || newIdx === -1) return

    const newBookmarks = [...bookmarks]
    const [moved] = newBookmarks.splice(oldIdx, 1)
    newBookmarks.splice(newIdx, 0, moved)
    onReorderBookmarks(newBookmarks)
    setDraggedBookmarkId(null)
    setBookmarkTargetId(null)
  }
  const handleRootDrop = (e: React.DragEvent) => {
    if (draggedNoteId) {
      const dragged = notes.find(n => n.id === draggedNoteId)
      if (dragged?.parentId) {
        onSetNoteParent(draggedNoteId, undefined)
        onSetDraggedNoteId(null)
        e.stopPropagation()
        setNestTargetId(null)
        return
      }
    }
    onDropNote(e, null)
    setNestTargetId(null)
  }

  const noteRowStyle = (id: string): React.CSSProperties => {
    const accentSolid = accent.length > 7 ? accent.slice(0, 7) : accent
    if (multiSelectedIds.has(id)) return { backgroundColor: `${accentSolid}33`, color: "white" }
    if (nestTargetId === id && draggedNoteId !== id)
      return { outline: `1.5px solid ${accent}`, outlineOffset: -1, backgroundColor: `${accent}22`, color: "white" }
    if (activeTabId === id) return { backgroundColor: `${accentSolid}44`, color: "white" }
    return { color: "#a1a1aa" }
  }

  const renderNote = (n: NoteData, indentPx: number): React.ReactNode => (
    <div key={n.id}>
      <div
        role="button"
        draggable
        onDragStart={() => onSetDraggedNoteId(n.id)}
        onDragEnd={() => { onSetDraggedNoteId(null); setNestTargetId(null) }}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (draggedNoteId !== n.id) setNestTargetId(n.id) }}
        onDragLeave={() => setNestTargetId(t => t === n.id ? null : t)}
        onDrop={e => handleNestDrop(e, n.id)}
        onClick={e => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) {
            e.preventDefault(); e.stopPropagation()
            setMultiSelectedIds(prev => {
              const next = new Set(prev)
              if (next.has(n.id)) next.delete(n.id)
              else next.add(n.id)
              return next
            })
          } else {
            setMultiSelectedIds(new Set())
            onSelectNote(n.id)
          }
        }}
        className={`group w-full text-left transition-all flex items-center cursor-pointer ${draggedNoteId === n.id ? "opacity-40" : ""}`}
        style={{ paddingLeft: indentPx + 12, paddingRight: 16, paddingTop: indentPx > 12 ? 4 : 6, paddingBottom: indentPx > 12 ? 4 : 6, fontSize: indentPx > 12 ? 11 : 12, ...noteRowStyle(n.id) }}
        onMouseEnter={e => { if (activeTabId !== n.id && nestTargetId !== n.id && !multiSelectedIds.has(n.id)) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.03)" }}
        onMouseLeave={e => { if (activeTabId !== n.id && nestTargetId !== n.id && !multiSelectedIds.has(n.id)) (e.currentTarget as HTMLElement).style.backgroundColor = "" }}
      >
        <span className="flex items-center gap-1.5 truncate min-w-0 flex-1">
          {indentPx > 12 && <span className="text-[9px] text-zinc-600 shrink-0">↳</span>}
          <span
            className="shrink-0 cursor-pointer hover:scale-125 transition-transform"
            title="Change icon"
            onClick={e => {
              e.stopPropagation()
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              setIconPicker({ noteId: n.id, x: rect.right + 6, y: rect.top })
            }}
          >
            {n.icon ?? "📄"}
          </span>
          {n.cover && (
            <img
              src={n.cover}
              alt="Cover"
              className="shrink-0 rounded"
              style={{ width: 14, height: 18, objectFit: "cover" }}
            />
          )}
          {/* Note type indicator */}
          {n.noteType === "flashcard" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" className="shrink-0" aria-label="Flashcard">
              <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" style={{ strokeDasharray: "2,2" }}/>
              <line x1="6" y1="12" x2="18" y2="12" style={{ strokeDasharray: "2,2" }}/>
            </svg>
          )}
          {n.noteType === "singlepage" && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" className="shrink-0" aria-label="Single Page">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" style={{ strokeDasharray: "2,2" }}/>
              <polyline points="14 2 14 8 20 8" style={{ strokeDasharray: "2,2" }}/>
            </svg>
          )}
          {(!n.noteType || n.noteType === "notebook") && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" className="shrink-0" aria-label="Notebook">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" style={{ strokeDasharray: "2,2" }}/>
              <path d="M6.5 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5a2.5 2.5 0 0 0-2 2.5v1a2.5 2.5 0 0 0 2.5 2.5H20" style={{ strokeDasharray: "2,2" }}/>
            </svg>
          )}
          {renamingNoteId === n.id ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={() => { if (renameValue.trim()) onRenameNote(n.id, renameValue.trim()); setRenamingNoteId(null) }}
              onKeyDown={e => {
                e.stopPropagation()
                if (e.key === "Enter") { if (renameValue.trim()) onRenameNote(n.id, renameValue.trim()); setRenamingNoteId(null) }
                if (e.key === "Escape") setRenamingNoteId(null)
              }}
              onClick={e => e.stopPropagation()}
              className="flex-1 bg-white/10 text-white text-xs rounded px-1.5 outline-none min-w-0"
            />
          ) : (
            <span
              className="truncate"
              onDoubleClick={e => { e.stopPropagation(); setRenamingNoteId(n.id); setRenameValue(n.subject) }}
            >{n.subject}</span>
          )}
        </span>
        
        <div className="flex items-center shrink-0 ml-1.5 gap-0.5">
          {/* Hold-to-delete button */}
          <button
            onMouseDown={e => { e.stopPropagation(); startHold(n.id) }}
            onMouseUp={e => { e.stopPropagation(); cancelHold() }}
            onMouseLeave={() => cancelHold()}
            onTouchStart={e => { e.stopPropagation(); startHold(n.id) }}
            onTouchEnd={() => cancelHold()}
            onClick={e => e.stopPropagation()}
            title="Hold to delete"
            className="opacity-0 group-hover:opacity-100 transition-opacity relative w-5 h-5 flex items-center justify-center rounded"
            style={{ background: holdingId === n.id ? `conic-gradient(#ef4444 ${holdProgress * 360}deg, rgba(255,255,255,0.06) 0deg)` : "transparent" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={holdingId === n.id ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#71717a" }}>
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>

          {/* Menu button */}
          <button
            onClick={e => {
              e.stopPropagation()
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              setNoteMenuId(noteMenuId === n.id ? null : n.id)
              setMenuPos({ x: rect.right + 4, y: rect.top })
            }}
            title="More options"
            className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-700"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#71717a" }}>
              <circle cx="12" cy="5" r="2.5" /><circle cx="12" cy="12" r="2.5" /><circle cx="12" cy="19" r="2.5" />
            </svg>
          </button>
        </div>
      </div>
      {childNotes(n.id).map(child => renderNote(child, indentPx + 16))}
    </div>
  )

  return (
    <>
      {iconPicker && (
        <IconPicker
          x={iconPicker.x}
          y={iconPicker.y}
          onSelect={icon => onChangeNoteIcon(iconPicker.noteId, icon)}
          onClose={() => setIconPicker(null)}
        />
      )}

      {noteMenuId && menuPos && (
        <div
          className="fixed z-[1000] min-w-max rounded-lg shadow-lg border border-zinc-700 bg-zinc-900 overflow-hidden"
          style={{ left: menuPos.x, top: menuPos.y }}
          onMouseLeave={() => setNoteMenuId(null)}
        >
          <button
            onClick={e => {
              e.stopPropagation()
              setRenamingNoteId(noteMenuId)
              const note = notes.find(n => n.id === noteMenuId)
              if (note) setRenameValue(note.subject)
              setNoteMenuId(null)
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 transition-colors text-zinc-200"
          >
            Rename
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              onSelectNote(noteMenuId)
              setNoteMenuId(null)
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 transition-colors text-zinc-200 border-t border-zinc-700"
          >
            Open
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              if (noteMenuId) onChangeNoteIcon(noteMenuId, "📄")
              setNoteMenuId(null)
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 transition-colors text-zinc-200 border-t border-zinc-700"
          >
            Change icon
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              onDeleteNote(noteMenuId)
              setNoteMenuId(null)
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-red-900/30 transition-colors text-red-400 border-t border-zinc-700"
          >
            Delete
          </button>
        </div>
      )}

      <div id="app-sidebar" className="bg-[#110d0e] text-white flex flex-col shrink-0 overflow-hidden border-r border-white/5 relative" style={{ width: sidebarWidth, scrollbarGutter: "stable", transition: isDragging ? "none" : "width 160ms cubic-bezier(0.25, 1, 0.5, 1)", willChange: "width" }}>
        {/* Background Ambient Pattern - covers logo + content area */}
        <div
          className="absolute top-0 left-0 right-0 bottom-[52px] pointer-events-none z-[1] overflow-hidden"
          style={{ opacity: 0.65 }}
        >
          <BackgroundPlus plusColor="#e8862a" plusSize={40} fade={false} style={{ opacity: 0.5 }} />
        </div>

        <div className="relative p-4 border-b border-white/5 shrink-0 overflow-hidden z-10" style={{ opacity: sidebarWidth > 40 ? 1 : 0, transition: "opacity 100ms ease", minWidth: 256 }}>
          <div className="relative flex items-center gap-2.5 mb-5 cursor-default">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" fill="#B8661A" />
              <circle cx="14" cy="14" r="11" fill="#F5A030" />
              <line x1="14" y1="3" x2="14" y2="25" stroke="#B8661A" strokeWidth="1.1" strokeOpacity="0.55" />
              <line x1="8.5" y1="23.5" x2="19.5" y2="4.5" stroke="#B8661A" strokeWidth="1.1" strokeOpacity="0.55" />
              <line x1="19.5" y1="23.5" x2="8.5" y2="4.5" stroke="#B8661A" strokeWidth="1.1" strokeOpacity="0.55" />
              <circle cx="14" cy="14" r="1.8" fill="#B8661A" fillOpacity="0.75" />
              <path d="M8.5 8 Q10.5 6 13.5 7" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.35" fill="none" />
            </svg>
            <h1 className="text-3xl text-white" style={{ fontFamily: 'var(--font-dancing), cursive', letterSpacing: '0.02em' }}>Pulp</h1>
          </div>
          <input placeholder="Search…" className="relative w-full bg-zinc-900/60 border border-white/10 rounded-full px-3 py-1.5 text-xs outline-none focus:border-white/30 transition-colors" />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-visible py-3 space-y-0.5 z-10" style={{ opacity: sidebarWidth > 40 ? 1 : 0, transition: "opacity 100ms ease", minWidth: 256 }} onDragOver={e => e.preventDefault()} onDrop={handleRootDrop}>
          {/* Binder Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between px-6 mb-2">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest" style={{ fontFamily: 'var(--font-italiana)' }}>Binder</p>
                {/* Get rid of the shelf for now
                <button onClick={onGoToShelf} className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-white/5 group">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#F56A00" /><circle cx="5.2" cy="5.2" r="2" fill="rgba(255,200,80,0.4)" /><path d="M7 1 C5.5 -0.5 3.5 0 4.2 1.5" stroke="#2d5c10" strokeWidth="1" fill="none" /><ellipse cx="4.5" cy="0.8" rx="2" ry="1" fill="#3a7020" opacity="0.85" transform="rotate(-20 4.5 0.8)" /></svg>
                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors">Shelf</span>
                </button>
                */}
              </div>
              <div className="flex gap-1 relative">
                <div className="relative group">
                  <button className="text-[10px] text-zinc-500 hover:text-white hover:bg-zinc-800 px-2 py-0.5 rounded transition-colors">+ New</button>
                  <div className="hidden group-hover:flex flex-col absolute left-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-50 min-w-max overflow-hidden">
                    <button onClick={() => { onAddTypedNote(null, "notebook"); setNewMenuOpen(null) }} className="px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white text-left transition-colors">📓 Notebook</button>
                    <button onClick={() => { onAddTypedNote(null, "singlepage"); setNewMenuOpen(null) }} className="px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white text-left transition-colors">📄 Single Page</button>
                    <button onClick={() => { onAddTypedNote(null, "flashcard"); setNewMenuOpen(null) }} className="px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white text-left transition-colors">🃏 Flashcard Set</button>
                  </div>
                </div>
                <button onClick={onAddFolder} className="text-[10px] text-zinc-500 hover:text-white hover:bg-zinc-800 px-2 py-0.5 rounded transition-colors">+ Folder</button>
              </div>
            </div>

            {topLevelNotes.map(n => renderNote(n, 12))}
            {folders.map(f => (
              <div key={f.id} onDragOver={e => e.preventDefault()} onDrop={e => onDropNote(e, f.id)}>
                <div className="flex items-center gap-1.5 px-6 py-1.5 cursor-pointer hover:bg-zinc-900/60 group uppercase" onClick={() => onToggleFolder(f.id)}>
                  <span className="text-[10px] text-zinc-600">{f.open ? "▾" : "▸"}</span>
                  {renamingFolder === f.id ? (
                    <input autoFocus className="flex-1 bg-white/10 text-white text-xs rounded px-1.5 outline-none min-w-0" defaultValue={f.name} onBlur={e => { onRenameFolder(f.id, e.target.value); onSetRenamingFolder(null) }} onKeyDown={e => { if (e.key === "Enter") { onRenameFolder(f.id, (e.target as HTMLInputElement).value); onSetRenamingFolder(null) } }} onClick={e => e.stopPropagation()} />
                  ) : (
                    <span className="flex-1 text-xs text-zinc-300 truncate">📁 {f.name}</span>
                  )}
                  <ItemMenu actions={[
                    { label: "Rename", onClick: () => onSetRenamingFolder(f.id) },
                    { label: "Delete 🗑️", onClick: () => onDeleteFolder(f.id), danger: true },
                  ]} />
                </div>
                {f.open && (
                  <div className="pl-5 space-y-0.5">
                    {notesInFolder(f.id).map(n => renderNote(n, 12))}
                    <div className="relative group inline-block">
                      <button className="text-[11px] text-zinc-600 hover:text-white px-3 py-0.5 block">+ New</button>
                      <div className="hidden group-hover:flex flex-col absolute left-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-50 min-w-max overflow-hidden">
                        <button onClick={() => { onAddTypedNote(f.id, "notebook"); setNewMenuOpen(null) }} className="px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white text-left transition-colors whitespace-nowrap">📓 Notebook</button>
                        <button onClick={() => { onAddTypedNote(f.id, "singlepage"); setNewMenuOpen(null) }} className="px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white text-left transition-colors whitespace-nowrap">📄 Single Page</button>
                        <button onClick={() => { onAddTypedNote(f.id, "flashcard"); setNewMenuOpen(null) }} className="px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white text-left transition-colors whitespace-nowrap">🃏 Flashcard Set</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {topLevelNotes.length === 0 && folders.length === 0 && (
              <p className="px-10 py-1 text-[10px] text-zinc-700 font-medium italic">None</p>
            )}
          </div>

          {/* Bookmarks Section */}
          <div className="mb-6 pt-4 border-t border-white/5">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-6 mb-2" style={{ fontFamily: 'var(--font-italiana)' }}>Bookmarks</p>
            {bookmarks && bookmarks.length > 0 ? (
              bookmarks.map((b: any, idx) => (
                <div
                  key={b.id}
                  draggable
                  onDragStart={() => setDraggedBookmarkId(b.id)}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (draggedBookmarkId && draggedBookmarkId !== b.id) setBookmarkTargetId(b.id) }}
                  onDrop={() => handleBookmarkDrop(b.id)}
                  className={`relative group flex items-center transition-all ${draggedBookmarkId === b.id ? "opacity-30" : ""} ${bookmarkTargetId === b.id ? "border-t-2" : ""}`}
                  style={{ borderTopColor: bookmarkTargetId === b.id ? accent : "transparent" }}
                >
                  <div
                    onClick={() => onJumpToBookmark(b)}
                    className="flex-1 flex items-center gap-2 cursor-pointer py-1.5 pl-6 pr-2 text-[#a1a1aa] hover:bg-white/5 transition-all truncate min-w-0"
                  >
                    <span className="shrink-0 text-[10px] font-bold text-zinc-600 w-4 text-right">{idx + 1}.</span>
                    <span className="truncate text-xs">{b.noteTitle} <span className="text-[10px] opacity-40 ml-1">p.{b.pageIdx + 1}</span></span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setBookmarkMenuId(bookmarkMenuId === b.id ? null : b.id) }}
                    className="shrink-0 mr-3 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-zinc-500 hover:text-zinc-300"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
                  </button>
                  {bookmarkMenuId === b.id && (
                    <div
                      className="absolute right-2 top-7 z-50 w-36 bg-[#1c1c1f] border border-white/10 rounded-md shadow-xl overflow-hidden"
                      onMouseLeave={() => setBookmarkMenuId(null)}
                    >
                      <button
                        onClick={e => { e.stopPropagation(); setBookmarkMenuId(null); onRenameBookmark(b.id, b.noteTitle) }}
                        className="w-full text-left px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/10 flex items-center gap-2 transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Rename
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setBookmarkMenuId(null); onDeleteBookmark(b.id) }}
                        className="w-full text-left px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="px-10 py-1 text-[10px] text-zinc-700 font-medium italic">None</p>
            )}
          </div>
          {/* Backlinks Section */}
          <div className="mb-6 pt-4 border-t border-white/5">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-6 mb-2" style={{ fontFamily: 'var(--font-italiana)' }}>Backlinks</p>
            {(() => {
              const bls = activeTabId ? notes.filter(n => n.id !== activeTabId && (
                n.pages.some(p => p.includes(`data-backlink-id="${activeTabId}"`)) ||
                Object.values(n.boxes).some(pageBoxes => (pageBoxes || []).some((b: any) => b.content.includes(`data-backlink-id="${activeTabId}"`)))
              )) : []
              if (bls.length === 0) return <p className="px-10 py-1 text-[10px] text-zinc-700 font-medium italic">None</p>
              return bls.map(b => (
                <div key={b.id} className="relative group flex items-center transition-all">
                  <div
                    onClick={() => onSelectNote(b.id)}
                    className="flex-1 flex items-center gap-2 cursor-pointer py-1.5 pl-6 pr-2 text-[#a1a1aa] hover:bg-white/5 transition-all truncate min-w-0"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                    <span className="truncate text-xs">{b.subject}</span>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>

        <div className="border-t border-white/5 px-3 py-2 shrink-0 z-10 relative bg-[#110d0e]" style={{ opacity: sidebarWidth > 40 ? 1 : 0, transition: "opacity 100ms ease", minWidth: 256 }}>
          {!user && (
            <button onClick={() => window.location.href = "/login"} className="w-full mb-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all bg-[#F5A030]/10 hover:bg-[#F5A030]/20 border border-[#F5A030]/20 text-[#F5A030] group shadow-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              <span className="text-[10px] font-bold tracking-[0.05em] uppercase">Sign In to Sync</span>
            </button>
          )}
          <button onClick={onOpenSettings} className="w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors hover:bg-zinc-800/70 group">
            <span className="text-[13px] shrink-0">⚙️</span>
            <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 truncate min-w-0">{user?.email ?? "Settings"}</span>
          </button>
        </div>
      </div>
    </>
  )
})
