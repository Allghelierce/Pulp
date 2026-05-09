"use client"
import { memo, useState, useRef, useCallback, useEffect, useMemo } from "react"
import type { NoteData, FolderData } from "@/app/types"
import { ItemMenu } from "./ItemMenu"
import { IconPicker } from "./IconPicker"
import dynamic from "next/dynamic"
import type { Bookmark, User } from "@/app/types"
import { apiFetch } from "@/lib/apiFetch"
import { GlassFilter } from "@/components/ui/liquid-glass-button"

const ShopCountdown = memo(function ShopCountdown() {
  const [cd, setCd] = useState('')
  useEffect(() => {
    const THREE_H = 3 * 60 * 60 * 1000
    const tick = () => {
      const next = (Math.floor(Date.now() / THREE_H) + 1) * THREE_H
      const diff = next - Date.now()
      if (diff <= 0) { setCd('0:00'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCd(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  if (!cd) return null
  return <span className="ml-auto mr-8 text-[10px] text-zinc-600" style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}>{cd}</span>
})

// ─── Archive Panel ────────────────────────────────────────────────────────────
function ArchiveSection({ archivedNotes, onUnarchiveNote }: {
  archivedNotes: NoteData[]
  onUnarchiveNote: (id: string) => void
}) {
  return (
    <div className="border-t border-white/5 bg-zinc-950/40 z-10 shrink-0 flex flex-col px-4 py-2 gap-1.5" style={{ height: 120 }}>
      {/* Header: simplified archive icon + label */}
      <div className="flex items-center gap-1.5 shrink-0 h-4">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 shrink-0" style={{ display: 'block', transform: 'translateY(0.5px)' }}>
          <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
        </svg>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Archive</span>
        <span className="text-[9px] text-zinc-700 tabular-nums leading-none">({archivedNotes.length})</span>
      </div>
      {/* Scrollable list */}
      <div className="overflow-y-auto flex-1 space-y-0.5 pr-0.5" style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}>
        {archivedNotes.length === 0 && <p className="text-[10px] text-zinc-800 italic px-1">Archive is empty.</p>}
        {archivedNotes.map(an => (
          <div key={an.id} className="group/ar flex items-center justify-between gap-1 rounded px-1 py-0.5 hover:bg-white/5 transition-colors">
            <span className="text-[10px] truncate text-zinc-600 group-hover/ar:text-zinc-400 transition-colors min-w-0">{an.subject || "Untitled"}</span>
            <button
              onClick={() => onUnarchiveNote(an.id)}
              title="Unarchive"
              className="opacity-0 group-hover/ar:opacity-100 transition-opacity text-[10px] text-zinc-500 hover:text-[#d97706] shrink-0"
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SidebarProps {
  notes: NoteData[]
  folders: FolderData[]
  activeTabId: string | null
  accent: string
  draggedNoteId: string | null
  renamingFolder: number | null
  user: User | null
  sidebarWidth: number
  isDragging?: boolean
  unlockedIds: Set<string>
  onAddNote: (folderId?: number | null) => void
  onAddTypedNote: (folderId: number | null, noteType?: "notebook" | "singlepage" | "flashcard" | "vault" | "cornell") => void
  onAddFolder: () => void
  onSelectNote: (id: string) => void
  onRenameNote: (id: string, newName: string) => void
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
  onOpenTimer?: () => void
  timerOpen?: boolean
  onUnlockDev: () => void
  onGoToShelf: () => void
  onOpenShop?: () => void
  onOpenGemStore?: () => void
  onOpenLeaderboard?: () => void
  onOpenFocus?: () => void
  onOpenStats?: () => void
  juice?: number
  gems?: number
  xp?: number
  totalNotes?: number
  totalChars?: number
  streak?: number
  bookmarks: Bookmark[]
  onJumpToBookmark: (b: Bookmark) => void
  onReorderBookmarks: (b: Bookmark[]) => void
  onDeleteBookmark: (id: string) => void
  onRenameBookmark: (id: string, current: string) => void
  archivedNotes?: NoteData[]
  onArchiveNote?: (id: string) => void
  onUnarchiveNote?: (id: string) => void
  onSearchNavigate?: (noteId: string, pageIdx: number) => void
  onSetCover?: (noteId: string) => void
}

export const Sidebar = memo(function Sidebar({
  notes, folders, activeTabId, accent, draggedNoteId, renamingFolder, user, sidebarWidth, isDragging, unlockedIds,
  onAddNote, onAddTypedNote, onAddFolder, onSelectNote, onRenameNote, onDeleteNote,
  onToggleFolder, onRenameFolder, onDeleteFolder, onSetRenamingFolder,
  onSetDraggedNoteId, onDropNote, onSetNoteParent, onChangeNoteIcon, onOpenSettings, onOpenTimer, timerOpen, onUnlockDev, onGoToShelf,
  onOpenShop, onOpenGemStore, onOpenLeaderboard, onOpenFocus, onOpenStats,
  juice = 0, gems = 0, xp = 0, totalNotes = 0, totalChars = 0, streak = 0,
  bookmarks, onJumpToBookmark, onReorderBookmarks, onDeleteBookmark, onRenameBookmark,
  archivedNotes = [], onArchiveNote, onUnarchiveNote, onSearchNavigate, onSetCover,
}: SidebarProps) {
  const [nestTargetId, setNestTargetId] = useState<string | null>(null)
  const [bookmarkMenuId, setBookmarkMenuId] = useState<string | null>(null)
  const [renamingBookmarkId, setRenamingBookmarkId] = useState<string | null>(null)
  const [bookmarkRenameValue, setBookmarkRenameValue] = useState("")
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
  const [devClicks, setDevClicks] = useState(0)
  const [logoSqueeze, setLogoSqueeze] = useState(false)
  const [hideBookmarks, setHideBookmarks] = useState(false)
  const [hideBacklinks, setHideBacklinks] = useState(false)
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [aiResults, setAiResults] = useState<{ noteId: string; noteName: string; noteIcon?: string; pageIdx: number; reason: string }[]>([])
  const [aiSearching, setAiSearching] = useState(false)
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stripHtml = useCallback((html: string) => {
    const tmp = document.createElement("div")
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ""
  }, [])

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q.length < 2) return []
    const results: { noteId: string; noteName: string; noteIcon?: string; pageIdx: number; snippet: string; matchType: "title" | "content" | "box" }[] = []
    const activeNotes = notes.filter(n => !n.archived)
    for (const note of activeNotes) {
      if (note.subject.toLowerCase().includes(q)) {
        results.push({ noteId: note.id, noteName: note.subject, noteIcon: note.icon, pageIdx: 0, snippet: note.subject, matchType: "title" })
      }
      for (let pi = 0; pi < note.pages.length; pi++) {
        const text = stripHtml(note.pages[pi]).toLowerCase()
        const idx = text.indexOf(q)
        if (idx !== -1) {
          const start = Math.max(0, idx - 30)
          const end = Math.min(text.length, idx + q.length + 50)
          const raw = text.slice(start, end).trim()
          const snippet = (start > 0 ? "..." : "") + raw + (end < text.length ? "..." : "")
          results.push({ noteId: note.id, noteName: note.subject, noteIcon: note.icon, pageIdx: pi, snippet, matchType: "content" })
        }
        const boxes = note.boxes[pi] || []
        for (const box of boxes) {
          const boxText = stripHtml(box.content).toLowerCase()
          const bIdx = boxText.indexOf(q)
          if (bIdx !== -1) {
            const start = Math.max(0, bIdx - 20)
            const end = Math.min(boxText.length, bIdx + q.length + 40)
            const raw = boxText.slice(start, end).trim()
            const snippet = (start > 0 ? "..." : "") + raw + (end < boxText.length ? "..." : "")
            results.push({ noteId: note.id, noteName: note.subject, noteIcon: note.icon, pageIdx: pi, snippet, matchType: "box" })
          }
        }
      }
      if (results.length >= 20) break
    }
    return results
  }, [searchQuery, notes, stripHtml])

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 3) {
      setAiResults([])
      setAiSearching(false)
      return
    }
    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current)
    setAiSearching(true)
    aiDebounceRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch("/api/semantic-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        })
        if (!res.ok) { setAiSearching(false); return }
        const data = await res.json()
        const activeNotes = notes.filter(n => !n.archived)
        const mapped = (data.results || [])
          .filter((r: { note_id: string }) => activeNotes.some(n => n.id === r.note_id))
          .map((r: { note_id: string; page_index: number; chunk_text: string; similarity: number }) => {
            const note = activeNotes.find(n => n.id === r.note_id)!
            return {
              noteId: r.note_id,
              noteName: note.subject,
              noteIcon: note.icon,
              pageIdx: Math.min(r.page_index, note.pages.length - 1),
              reason: r.chunk_text.slice(0, 80) + (r.chunk_text.length > 80 ? "…" : ""),
            }
          })
        setAiResults(mapped)
      } catch { /* ignore */ }
      setAiSearching(false)
    }, 400)
    return () => { if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current) }
  }, [searchQuery, notes, stripHtml])

  useEffect(() => {
    if (!searchFocused) return
    const handler = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSearchFocused(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [searchFocused])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setNewMenuOpen(null)
      if (!(e.target as HTMLElement)?.closest?.('[data-note-menu]')) setNoteMenuId(null)
      setBookmarkMenuId(null)
      const clickedInsidePicker = (e.target as HTMLElement)?.closest?.('[data-icon-picker]')
      if (!clickedInsidePicker) setIconPicker(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const startHold = useCallback((id: string) => {
    setHoldingId(id)
    setHoldProgress(0)
    const start = Date.now()
    holdIntervalRef.current = setInterval(() => {
      const t = (Date.now() - start) / 800
      const p = Math.min(t < 0.5 ? t * 0.8 : 0.4 + (t - 0.5) * 1.2, 1)
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

  const uniqueNotes = notes.filter((n, i, a) => a.findIndex(x => x.id === n.id) === i)
  const topLevelNotes = uniqueNotes.filter(n => n.folderId === null && !n.parentId && !n.archived)
  const notesInFolder = (fid: number) => uniqueNotes.filter(n => n.folderId === fid && !n.parentId && !n.archived)
  const childNotes = (parentId: string) => uniqueNotes.filter(n => n.parentId === parentId && !n.archived)

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
    const r = parseInt(accentSolid.slice(1, 3), 16), g = parseInt(accentSolid.slice(3, 5), 16), b = parseInt(accentSolid.slice(5, 7), 16)
    if (multiSelectedIds.has(id)) return { backgroundColor: `rgba(${r},${g},${b},0.15)` }
    if (nestTargetId === id && draggedNoteId !== id)
      return { outline: `1.5px solid rgba(${r},${g},${b},0.45)`, outlineOffset: -1, backgroundColor: `rgba(${r},${g},${b},0.1)` }
    if (activeTabId === id) return { backgroundColor: `rgba(${r},${g},${b},0.14)` }
    return {}
  }

  const renderNote = (n: NoteData, indentPx: number): React.ReactNode => (
    <div key={n.id}>
      <div
        role="button"
        draggable={renamingNoteId !== n.id}
        onDragStart={(e) => {
          if (renamingNoteId === n.id) {
            e.preventDefault()
            return
          }
          onSetDraggedNoteId(n.id)
        }}
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
            <div
              style={{
                width: 14, height: 18, borderRadius: 2, overflow: "hidden", pointerEvents: "none",
                backgroundImage: `url(${n.cover})`, backgroundSize: "cover", backgroundPosition: "center",
                flexShrink: 0
              }}
            />
          )}

          <div className="w-px h-3 bg-zinc-500/30 dark:bg-zinc-700/50 shrink-0 mx-0.5" />

          {/* Note type indicator */}
          {n.noteType === "flashcard" && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" className="shrink-0" aria-label="Flashcard">
              <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" style={{ strokeDasharray: "2,2" }} />
              <line x1="6" y1="12" x2="18" y2="12" style={{ strokeDasharray: "2,2" }} />
            </svg>
          )}
          {n.noteType === "singlepage" && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" className="shrink-0" aria-label="Single Page">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" style={{ strokeDasharray: "2,2" }} />
              <polyline points="14 2 14 8 20 8" style={{ strokeDasharray: "2,2" }} />
            </svg>
          )}
          {n.noteType === "vault" && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" className="shrink-0" aria-label="Vault">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              {unlockedIds.has(n.id) ? (
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              ) : (
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              )}
            </svg>
          )}
          {(!n.noteType || n.noteType === "notebook") && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" className="shrink-0" aria-label="Notebook">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" style={{ strokeDasharray: "2,2" }} />
              <path d="M6.5 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5a2.5 2.5 0 0 0-2 2.5v1a2.5 2.5 0 0 0 2.5 2.5H20" style={{ strokeDasharray: "2,2" }} />
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
            className={`w-5 h-5 flex items-center justify-center rounded transition-opacity ${noteMenuId === n.id ? "opacity-100 bg-zinc-700 text-white" : "opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-zinc-400 hover:text-white"}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" opacity="0.55">
              <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
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
          data-note-menu
          className="fixed z-[1000] min-w-max rounded shadow-lg border border-zinc-700 bg-zinc-800 overflow-hidden"
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
            className="w-full text-left px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors whitespace-nowrap"
          >
            Rename
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              if (noteMenuId) onArchiveNote?.(noteMenuId)
              setNoteMenuId(null)
            }}
            className="w-full text-left px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors whitespace-nowrap"
          >
            Archive
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              onDeleteNote(noteMenuId)
              setNoteMenuId(null)
            }}
            className="w-full text-left px-3 py-1.5 text-[10px] text-red-500 hover:bg-red-900/30 transition-colors whitespace-nowrap"
          >
            Delete
          </button>
        </div>
      )}

      <div id="app-sidebar" className={`text-white flex flex-col shrink-0 h-full ${searchFocused && searchQuery.trim().length >= 2 ? "" : "overflow-hidden"} relative z-[250]`} style={{ width: sidebarWidth, scrollbarGutter: "stable", transition: isDragging ? "none" : "width 160ms cubic-bezier(0.25, 1, 0.5, 1)", willChange: "width", boxShadow: "4px 0 16px rgba(0,0,0,0.25), 1px 0 4px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.03)" }}>
        <div className="absolute inset-0 z-0 overflow-hidden" style={{ backdropFilter: 'url("#liquid-glass-filter") blur(24px) saturate(1.4)', WebkitBackdropFilter: 'url("#liquid-glass-filter") blur(24px) saturate(1.4)' }} />
        <div className="absolute inset-0 z-0" style={{ background: 'rgba(35,33,33,0.92)' }} />
        <div className="absolute inset-0 z-0 pointer-events-none rounded-r-sm" style={{ boxShadow: 'inset -2px 0 8px rgba(0,0,0,0.4), inset 0 0 40px rgba(255,255,255,0.01)' }} />
        {/* Bamboo stalks */}
        <svg className="absolute inset-0 z-0 pointer-events-none" viewBox="0 0 220 1000" width="100%" height="100%" preserveAspectRatio="none">
          <defs><symbol id="bnode" viewBox="0 0 6 3"><ellipse cx="3" cy="1.5" rx="3" ry="1.5" /></symbol></defs>
          <line x1="28" y1="0" x2="28" y2="1000" stroke="rgba(140,120,80,0.035)" strokeWidth="1.8" />
          <use href="#bnode" x="25" y="80" width="6" height="3" fill="rgba(140,120,80,0.04)" />
          <use href="#bnode" x="25" y="220" width="6" height="3" fill="rgba(140,120,80,0.035)" />
          <use href="#bnode" x="25" y="390" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <use href="#bnode" x="25" y="540" width="6" height="3" fill="rgba(140,120,80,0.04)" />
          <use href="#bnode" x="25" y="710" width="6" height="3" fill="rgba(140,120,80,0.035)" />
          <use href="#bnode" x="25" y="880" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <line x1="44" y1="0" x2="44" y2="1000" stroke="rgba(130,115,70,0.025)" strokeWidth="0.7" />
          <use href="#bnode" x="41.5" y="130" width="5" height="2.5" fill="rgba(130,115,70,0.03)" />
          <use href="#bnode" x="41.5" y="310" width="5" height="2.5" fill="rgba(130,115,70,0.025)" />
          <use href="#bnode" x="41.5" y="500" width="5" height="2.5" fill="rgba(130,115,70,0.03)" />
          <use href="#bnode" x="41.5" y="680" width="5" height="2.5" fill="rgba(130,115,70,0.025)" />
          <use href="#bnode" x="41.5" y="870" width="5" height="2.5" fill="rgba(130,115,70,0.03)" />
          <line x1="67" y1="0" x2="67" y2="1000" stroke="rgba(140,120,80,0.03)" strokeWidth="1.2" />
          <use href="#bnode" x="64" y="60" width="6" height="3" fill="rgba(140,120,80,0.035)" />
          <use href="#bnode" x="64" y="250" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <use href="#bnode" x="64" y="430" width="6" height="3" fill="rgba(140,120,80,0.035)" />
          <use href="#bnode" x="64" y="620" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <use href="#bnode" x="64" y="790" width="6" height="3" fill="rgba(140,120,80,0.025)" />
          <use href="#bnode" x="64" y="940" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <line x1="95" y1="0" x2="95" y2="1000" stroke="rgba(120,110,75,0.02)" strokeWidth="0.6" />
          <use href="#bnode" x="92.5" y="170" width="5" height="2.5" fill="rgba(120,110,75,0.025)" />
          <use href="#bnode" x="92.5" y="380" width="5" height="2.5" fill="rgba(120,110,75,0.02)" />
          <use href="#bnode" x="92.5" y="560" width="5" height="2.5" fill="rgba(120,110,75,0.025)" />
          <use href="#bnode" x="92.5" y="750" width="5" height="2.5" fill="rgba(120,110,75,0.02)" />
          <line x1="130" y1="0" x2="130" y2="1000" stroke="rgba(140,120,80,0.028)" strokeWidth="1.5" />
          <use href="#bnode" x="127" y="100" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <use href="#bnode" x="127" y="290" width="6" height="3" fill="rgba(140,120,80,0.028)" />
          <use href="#bnode" x="127" y="470" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <use href="#bnode" x="127" y="660" width="6" height="3" fill="rgba(140,120,80,0.025)" />
          <use href="#bnode" x="127" y="850" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <line x1="160" y1="0" x2="160" y2="1000" stroke="rgba(130,115,70,0.018)" strokeWidth="0.5" />
          <use href="#bnode" x="157.5" y="200" width="5" height="2.5" fill="rgba(130,115,70,0.022)" />
          <use href="#bnode" x="157.5" y="420" width="5" height="2.5" fill="rgba(130,115,70,0.018)" />
          <use href="#bnode" x="157.5" y="630" width="5" height="2.5" fill="rgba(130,115,70,0.022)" />
          <use href="#bnode" x="157.5" y="860" width="5" height="2.5" fill="rgba(130,115,70,0.018)" />
          <line x1="190" y1="0" x2="190" y2="1000" stroke="rgba(140,120,80,0.03)" strokeWidth="1.0" />
          <use href="#bnode" x="187" y="150" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <use href="#bnode" x="187" y="350" width="6" height="3" fill="rgba(140,120,80,0.028)" />
          <use href="#bnode" x="187" y="530" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <use href="#bnode" x="187" y="720" width="6" height="3" fill="rgba(140,120,80,0.025)" />
          <use href="#bnode" x="187" y="910" width="6" height="3" fill="rgba(140,120,80,0.03)" />
          <path d="M67,45 Q78,28 85,18" stroke="rgba(110,130,70,0.03)" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          <path d="M130,55 Q120,35 115,24" stroke="rgba(110,130,70,0.025)" strokeWidth="0.6" fill="none" strokeLinecap="round" />
        </svg>
        <GlassFilter />

        <div className="relative px-3.5 py-4 border-b border-white/5 shrink-0 z-10" style={{ opacity: sidebarWidth > 40 ? 1 : 0, transition: "opacity 100ms ease", minWidth: 220 }}>
          <div
            onClick={() => {
              const count = devClicks + 1
              if (count >= 7) {
                onUnlockDev()
                setDevClicks(0)
              } else {
                setDevClicks(count)
              }
            }}
            className="relative flex items-center gap-2.5 mb-5 cursor-default select-none"
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" fill="#92400e" />
              <circle cx="14" cy="14" r="11" fill="#d97706" />
              <line x1="14" y1="3" x2="14" y2="25" stroke="#92400e" strokeWidth="1.1" strokeOpacity="0.55" />
              <line x1="8.5" y1="23.5" x2="19.5" y2="4.5" stroke="#92400e" strokeWidth="1.1" strokeOpacity="0.55" />
              <line x1="19.5" y1="23.5" x2="8.5" y2="4.5" stroke="#92400e" strokeWidth="1.1" strokeOpacity="0.55" />
              <circle cx="14" cy="14" r="1.8" fill="#92400e" fillOpacity="0.75" />
              <path d="M8.5 8 Q10.5 6 13.5 7" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.35" fill="none" />
            </svg>
            <h1 style={{ fontFamily: '"EB Garamond", serif', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: '#d97706', transform: 'translateY(-2px)' }}>pulp <span style={{ fontSize: 10, fontWeight: 500, color: '#71717a', letterSpacing: '0.05em', verticalAlign: 'super' }}>beta</span></h1>
          </div>
          <div ref={searchRef} className="relative">
            <div className="relative">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={e => {
                  if (e.key === "Escape") { setSearchQuery(""); setSearchFocused(false); searchInputRef.current?.blur() }
                  if (e.key === "Enter" && searchResults.length > 0) {
                    const r = searchResults[0]
                    onSearchNavigate?.(r.noteId, r.pageIdx)
                    setSearchQuery(""); setSearchFocused(false)
                  }
                }}
                placeholder="Search notes…"
                className="relative w-full bg-zinc-900/40 border border-white/[0.06] rounded-lg pl-7 pr-2.5 py-1 text-[11px] outline-none focus:border-white/20 transition-colors text-zinc-400 placeholder:text-zinc-600"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); searchInputRef.current?.focus() }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>
            {searchFocused && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-[9999] rounded-lg border border-white/10 bg-[#09090b] shadow-2xl shadow-black/50 overflow-hidden" style={{ maxHeight: 'min(400px, calc(100vh - 160px))' }} onMouseDown={e => e.stopPropagation()}>
                {searchResults.length === 0 && aiResults.length === 0 && !aiSearching ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[11px] text-zinc-500">No results for &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto" style={{ maxHeight: 'min(400px, calc(100vh - 160px))' }}>
                    {searchResults.map((r, i) => (
                      <button
                        key={`${r.noteId}-${r.pageIdx}-${r.matchType}-${i}`}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-white/5 transition-colors flex flex-col gap-0.5 border-b border-white/5 last:border-0"
                        onClick={() => {
                          onSearchNavigate?.(r.noteId, r.pageIdx)
                          setSearchQuery(""); setSearchFocused(false)
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {r.noteIcon && <span className="text-[11px] shrink-0">{r.noteIcon}</span>}
                          <span className="text-[11px] font-semibold text-zinc-200 truncate">{r.noteName || "Untitled"}</span>
                          {r.matchType !== "title" && (
                            <span className="text-[9px] text-zinc-600 shrink-0 ml-auto tabular-nums">p.{r.pageIdx + 1}</span>
                          )}
                        </div>
                        {r.matchType !== "title" && (
                          <p className="text-[10px] text-zinc-500 leading-relaxed truncate">{r.snippet}</p>
                        )}
                        <span className="text-[8px] uppercase tracking-widest font-bold mt-0.5" style={{ color: r.matchType === "title" ? "#f59e0b" : r.matchType === "box" ? "#8b5cf6" : "#71717a" }}>
                          {r.matchType === "title" ? "Title" : r.matchType === "box" ? "Textbox" : "Page content"}
                        </span>
                      </button>
                    ))}
                    {(aiResults.length > 0 || aiSearching) && (
                      <>
                        {searchResults.length > 0 && <div className="border-t border-white/5" />}
                        <div className="px-3.5 py-1.5 flex items-center gap-1.5">
                          {aiSearching && (
                            <svg width="12" height="12" viewBox="0 0 24 24" className="animate-spin text-orange-400 shrink-0">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                            </svg>
                          )}
                          <span className="text-[9px] uppercase tracking-widest font-bold text-orange-400/70">
                            {aiSearching ? "Searching with AI…" : "AI Results"}
                          </span>
                        </div>
                        {aiResults
                          .filter(ar => !searchResults.some(lr => lr.noteId === ar.noteId && lr.pageIdx === ar.pageIdx))
                          .map((r, i) => (
                          <button
                            key={`ai-${r.noteId}-${r.pageIdx}-${i}`}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-white/5 transition-colors flex flex-col gap-0.5 border-b border-white/5 last:border-0"
                            onClick={() => {
                              onSearchNavigate?.(r.noteId, r.pageIdx)
                              apiFetch("/api/search-click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: searchQuery, noteId: r.noteId, pageIndex: r.pageIdx }) }).catch(() => {})
                              setSearchQuery(""); setSearchFocused(false)
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {r.noteIcon && <span className="text-[11px] shrink-0">{r.noteIcon}</span>}
                              <span className="text-[11px] font-semibold text-zinc-200 truncate">{r.noteName || "Untitled"}</span>
                              <span className="text-[9px] text-zinc-600 shrink-0 ml-auto tabular-nums">p.{r.pageIdx + 1}</span>
                            </div>
                            <p className="text-[10px] text-orange-400/60 leading-relaxed truncate">{r.reason}</p>
                            <span className="text-[8px] uppercase tracking-widest font-bold mt-0.5 text-orange-400/50">Semantic match</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nav buttons — top */}
        <div className="px-2 pt-2 pb-1 flex flex-col gap-px z-10 shrink-0" style={{ opacity: sidebarWidth > 40 ? 1 : 0, transition: "opacity 100ms ease", minWidth: 256 }}>
          {onOpenShop && (
            <button onClick={onOpenShop} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/[0.05] focus:outline-none group w-full text-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-zinc-300 shrink-0"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span className="text-[12px] font-medium text-zinc-400 group-hover:text-zinc-200" style={{ fontFamily: '"EB Garamond", serif', letterSpacing: '0.01em' }}>Shop</span>
              <ShopCountdown />
            </button>
          )}
          {onOpenStats && (
            <button onClick={onOpenStats} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/[0.05] focus:outline-none group w-full text-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-zinc-300 shrink-0"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              <span className="text-[12px] font-medium text-zinc-400 group-hover:text-zinc-200" style={{ fontFamily: '"EB Garamond", serif', letterSpacing: '0.01em' }}>Stats</span>
            </button>
          )}
          {onOpenLeaderboard && (
            <button onClick={onOpenLeaderboard} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/[0.05] focus:outline-none group w-full text-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-zinc-300 shrink-0"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 22V8a4 4 0 0 0-4-4H4v9a4 4 0 0 0 4 4h2"/><path d="M14 22V8a4 4 0 0 1 4-4h2v9a4 4 0 0 1-4 4h-2"/></svg>
              <span className="text-[12px] font-medium text-zinc-400 group-hover:text-zinc-200" style={{ fontFamily: '"EB Garamond", serif', letterSpacing: '0.01em' }}>Leaderboard</span>
            </button>
          )}
          <button onClick={onOpenSettings} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/[0.05] group w-full text-left focus:outline-none">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-zinc-300 shrink-0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span className="text-[12px] font-medium text-zinc-400 group-hover:text-zinc-200" style={{ fontFamily: '"EB Garamond", serif', letterSpacing: '0.01em' }}>Settings</span>
          </button>
          <div className="mt-1.5 mx-[-8px] border-b border-white/5" />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-visible px-0 py-3 space-y-0.5 z-10" style={{ opacity: sidebarWidth > 40 ? 1 : 0, transition: "opacity 100ms ease", minWidth: 256 }} onDragOver={e => e.preventDefault()} onDrop={handleRootDrop}>
          {/* Binder Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between px-6 mb-2">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest" style={{ fontFamily: '"EB Garamond", serif' }}>Binder</p>
                {/* Get rid of the shelf for now
                <button onClick={onGoToShelf} className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-white/5 group">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#F56A00" /><circle cx="5.2" cy="5.2" r="2" fill="rgba(255,200,80,0.4)" /><path d="M7 1 C5.5 -0.5 3.5 0 4.2 1.5" stroke="#2d5c10" strokeWidth="1" fill="none" /><ellipse cx="4.5" cy="0.8" rx="2" ry="1" fill="#3a7020" opacity="0.85" transform="rotate(-20 4.5 0.8)" /></svg>
                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors">Shelf</span>
                </button>
                */}
              </div>
              <div className="flex items-center gap-1.5 relative">
                <div className="relative flex items-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddNote(null) }}
                    className="text-[10px] px-2 py-1 rounded transition-colors leading-none font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
                    style={{ fontFamily: '"EB Garamond", serif', letterSpacing: '0.01em' }}
                  >
                    + New
                  </button>
                </div>
                <button onClick={onAddFolder} className="text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 px-2 py-1 rounded transition-colors leading-none font-medium ml-0.5" style={{ fontFamily: '"EB Garamond", serif', letterSpacing: '0.01em' }}>+ Folder</button>
              </div>
            </div>

            {topLevelNotes.map(n => renderNote(n, 12))}
            {folders.map(f => (
              <div key={f.id} onDragOver={e => e.preventDefault()} onDrop={e => onDropNote(e, f.id)}>
                <div className="flex items-center gap-1.5 px-6 py-1.5 cursor-pointer hover:bg-zinc-900/60 group" onClick={() => onToggleFolder(f.id)}>
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
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddNote(f.id) }}
                        className="text-[11px] px-3 py-0.5 block rounded transition-colors text-zinc-800 hover:text-zinc-500 hover:bg-zinc-800/40"
                      >
                        + New
                      </button>
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
          <div className="mb-6 pt-4">
            <div className="flex items-center justify-between px-6 mb-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest" style={{ fontFamily: '"EB Garamond", serif' }}>Bookmarks</p>
            </div>
            {bookmarks && bookmarks.length > 0 ? (
              bookmarks.filter(b => b.noteId === activeTabId).map((b: Bookmark, idx: number) => (
                <div
                  key={b.id}
                  draggable={renamingBookmarkId !== b.id}
                  onDragStart={() => setDraggedBookmarkId(b.id)}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (draggedBookmarkId && draggedBookmarkId !== b.id) setBookmarkTargetId(b.id) }}
                  onDrop={() => handleBookmarkDrop(b.id)}
                  onClick={() => { if (renamingBookmarkId !== b.id) onJumpToBookmark(b) }}
                  className={`relative group flex items-center cursor-pointer py-1.5 pl-6 pr-2 text-[#a1a1aa] hover:bg-white/5 transition-all ${draggedBookmarkId === b.id ? "opacity-30" : ""} ${bookmarkTargetId === b.id ? "border-t-2" : ""}`}
                  style={{ borderTopColor: bookmarkTargetId === b.id ? accent : "transparent" }}
                >
                  <span className="shrink-0 text-[10px] font-bold text-zinc-600 w-4 text-right">{idx + 1}.</span>
                  {renamingBookmarkId === b.id ? (
                    <input
                      autoFocus
                      value={bookmarkRenameValue}
                      onChange={e => setBookmarkRenameValue(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onBlur={() => {
                        if (bookmarkRenameValue.trim()) onRenameBookmark(b.id, bookmarkRenameValue.trim())
                        setRenamingBookmarkId(null)
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") { if (bookmarkRenameValue.trim()) onRenameBookmark(b.id, bookmarkRenameValue.trim()); setRenamingBookmarkId(null) }
                        if (e.key === "Escape") setRenamingBookmarkId(null)
                      }}
                      className="flex-1 bg-white/10 text-white text-xs rounded px-1.5 py-0.5 ml-2 outline-none min-w-0"
                    />
                  ) : (
                    <span className="truncate text-xs ml-2">{b.label || b.noteTitle} <span className="text-[10px] opacity-40 ml-1">p.{b.pageIdx + 1}</span></span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setBookmarkMenuId(bookmarkMenuId === b.id ? null : b.id) }}
                    className="shrink-0 ml-auto mr-1 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-zinc-500 hover:text-zinc-300"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity="0.55"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                  </button>
                  {bookmarkMenuId === b.id && (
                    <div
                      className="absolute right-2 top-7 z-50 min-w-max rounded shadow-lg border border-zinc-700 bg-zinc-800 overflow-hidden"
                      onMouseLeave={() => setBookmarkMenuId(null)}
                    >
                      <button
                        onClick={e => { e.stopPropagation(); setBookmarkMenuId(null); setBookmarkRenameValue(b.label || b.noteTitle); setRenamingBookmarkId(b.id) }}
                        className="w-full text-left px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-colors whitespace-nowrap"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Rename
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setBookmarkMenuId(null); onDeleteBookmark(b.id) }}
                        className="w-full text-left px-3 py-1.5 text-[10px] text-red-500 hover:bg-red-900/30 flex items-center gap-2 transition-colors whitespace-nowrap"
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
          <div className="mb-6 pt-4">
            <div className="flex items-center justify-between px-6 mb-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest" style={{ fontFamily: '"EB Garamond", serif' }}>Backlinks</p>
            </div>
            {(() => {
              const bls = activeTabId ? notes.filter(n => n.id !== activeTabId && (
                n.pages.some(p => p.includes(`data-backlink-id="${activeTabId}"`)) ||
                Object.values(n.boxes).some(pageBoxes => (pageBoxes || []).some(b => b.content.includes(`data-backlink-id="${activeTabId}"`)))
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

        {/* Focus — dock button */}
        {onOpenTimer && (
          <div className="shrink-0 z-10 relative px-3 pb-1 pt-3" style={{ opacity: sidebarWidth > 40 ? 1 : 0, visibility: sidebarWidth > 40 ? 'visible' : 'hidden', transition: "opacity 100ms ease" }}>
            <button
              onClick={onOpenTimer}
              title="Focus timer"
              className={`flex flex-col items-center justify-center w-full py-3 rounded-xl transition-all group cursor-pointer ${timerOpen ? "" : "hover:scale-[1.02] active:scale-[0.98]"}`}
              style={{
                background: timerOpen
                  ? 'linear-gradient(135deg, rgba(217,119,6,0.15), rgba(217,119,6,0.08))'
                  : 'linear-gradient(135deg, rgba(217,119,6,0.06), rgba(217,119,6,0.02))',
                boxShadow: timerOpen
                  ? '0 0 20px rgba(217,119,6,0.15), inset 0 1px 0 rgba(217,119,6,0.15)'
                  : '0 0 12px rgba(217,119,6,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                border: timerOpen ? '1px solid rgba(217,119,6,0.2)' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className={`mb-1 transition-colors ${timerOpen ? "text-amber-500" : "text-amber-600/60 group-hover:text-amber-500/80"}`}>
                <ellipse cx="12" cy="21" rx="7" ry="1.5" fill="currentColor" opacity="0.25" />
                <path d="M12 20 C12 16 11.5 14 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 14 C9 12 7 10.5 7 8.5 C7 8.5 9.5 9 12 12" fill="currentColor" opacity="0.7" />
                <path d="M8.5 10 L10 11.5" stroke="currentColor" strokeWidth="0.6" opacity="0.4" strokeLinecap="round" />
                <path d="M12 11 C15 9 17 7.5 17 5.5 C17 5.5 14.5 6 12 9" fill="currentColor" opacity="0.7" />
                <path d="M15.5 7 L14 8.5" stroke="currentColor" strokeWidth="0.6" opacity="0.4" strokeLinecap="round" />
                <circle cx="12" cy="11" r="1" fill="currentColor" opacity="0.5" />
                <path d="M18 4 L18.5 3 L19 4 L18.5 5Z" fill="currentColor" opacity="0.3" />
                <path d="M5 6 L5.3 5.2 L5.6 6 L5.3 6.8Z" fill="currentColor" opacity="0.2" />
              </svg>
              <span className={`text-[13px] font-semibold tracking-wide transition-colors ${timerOpen ? "text-amber-500" : "text-amber-600/50 group-hover:text-amber-500/70"}`} style={{ fontFamily: '"EB Garamond", serif' }}>Focus</span>
            </button>
          </div>
        )}

        {/* Socials */}
        <div className="shrink-0 flex items-center justify-start gap-3 pb-3 pt-1.5 px-3.5 z-10 relative" style={{ opacity: sidebarWidth > 40 ? 1 : 0, visibility: sidebarWidth > 40 ? 'visible' : 'hidden', transition: "opacity 100ms ease" }}>
          <a href="#" title="Instagram" className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
          </a>
          <a href="#" title="Discord" className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z"/></svg>
          </a>
          <a href="#" title="YouTube" className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href="#" title="Twitter" className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>

      </div>
    </>
  )
})
