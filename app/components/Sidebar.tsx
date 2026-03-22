"use client"
import { memo, useState } from "react"
import type { NoteData, FolderData } from "@/app/types"
import { ItemMenu } from "./ItemMenu"
import { IconPicker } from "./IconPicker"

interface SidebarProps {
  notes: NoteData[]
  folders: FolderData[]
  activeTabId: string | null
  accent: string
  draggedNoteId: string | null
  renamingFolder: number | null
  user: any
  sidebarWidth: number
  onAddNote: (folderId: number | null) => void
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
}

export const Sidebar = memo(function Sidebar({
  notes, folders, activeTabId, accent, draggedNoteId, renamingFolder, user, sidebarWidth,
  onAddNote, onAddFolder, onSelectNote, onRenameNote, onDeleteNote,
  onToggleFolder, onRenameFolder, onDeleteFolder, onSetRenamingFolder,
  onSetDraggedNoteId, onDropNote, onSetNoteParent, onChangeNoteIcon, onOpenSettings, onGoToShelf,
}: SidebarProps) {
  const [nestTargetId, setNestTargetId] = useState<string | null>(null)
  const [iconPicker, setIconPicker] = useState<{ noteId: string; x: number; y: number } | null>(null)

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
    if (draggedNoteId && draggedNoteId !== targetId && !isDescendant(draggedNoteId, targetId)) {
      onSetNoteParent(draggedNoteId, targetId)
      onSetDraggedNoteId(null)
    }
    setNestTargetId(null)
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
        onClick={() => onSelectNote(n.id)}
        className={`group w-full text-left transition-all flex items-center justify-between cursor-pointer ${draggedNoteId === n.id ? "opacity-40" : ""}`}
        style={{ paddingLeft: indentPx + 12, paddingRight: 16, paddingTop: indentPx > 12 ? 4 : 6, paddingBottom: indentPx > 12 ? 4 : 6, fontSize: indentPx > 12 ? 11 : 12, ...noteRowStyle(n.id) }}
        onMouseEnter={e => { if (activeTabId !== n.id && nestTargetId !== n.id) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.03)" }}
        onMouseLeave={e => { if (activeTabId !== n.id && nestTargetId !== n.id) (e.currentTarget as HTMLElement).style.backgroundColor = "" }}
      >
        <span className="flex items-center gap-1.5 truncate">
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
          <span className="truncate">{n.subject}</span>
        </span>
        <ItemMenu actions={[
          { label: "Rename", onClick: () => onRenameNote(n.id, n.subject) },
          { label: "Delete 🗑️", onClick: () => onDeleteNote(n.id), danger: true },
        ]} />
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

      <div id="app-sidebar" className="bg-[#110d0e] text-white flex flex-col shrink-0 overflow-hidden border-r border-white/5" style={{ width: sidebarWidth, scrollbarGutter: "stable", transition: "width 0.15s ease" }}>
        <div className="p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5 mb-5 cursor-default">
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
          <input placeholder="Search…" className="w-full bg-zinc-900/60 border border-white/10 rounded-full px-3 py-1.5 text-xs outline-none focus:border-white/30 transition-colors" />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-visible py-3 space-y-0.5" onDragOver={e => e.preventDefault()} onDrop={handleRootDrop}>
          <>
            <div className="flex items-center justify-between px-6 mb-2">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest" style={{ fontFamily: 'var(--font-italiana)' }}>Binder</p>
                <button onClick={onGoToShelf} className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-white/5 group">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#F56A00"/><circle cx="5.2" cy="5.2" r="2" fill="rgba(255,200,80,0.4)"/><path d="M7 1 C5.5 -0.5 3.5 0 4.2 1.5" stroke="#2d5c10" strokeWidth="1" fill="none"/><ellipse cx="4.5" cy="0.8" rx="2" ry="1" fill="#3a7020" opacity="0.85" transform="rotate(-20 4.5 0.8)"/></svg>
                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors">Shelf</span>
                </button>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onAddNote(null)} className="text-[10px] text-zinc-500 hover:text-white hover:bg-zinc-800 px-2 py-0.5 rounded transition-colors">+ Note</button>
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
                    <button onClick={() => onAddNote(f.id)} className="text-[11px] text-zinc-600 hover:text-white px-3 py-0.5 block">+ Note</button>
                  </div>
                )}
              </div>
            ))}
          </>
        </div>

        <div className="border-t border-white/5 px-3 py-2 shrink-0">
          <button onClick={onOpenSettings} className="w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors hover:bg-zinc-800/70 group">
            <span className="text-[13px] shrink-0">⚙️</span>
            <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 truncate min-w-0">{user?.email ?? "Settings"}</span>
          </button>
        </div>
      </div>
    </>
  )
})
