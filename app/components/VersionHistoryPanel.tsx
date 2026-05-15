"use client"
import { memo, useState, useMemo } from "react"
import type { NoteVersion } from "@/app/types"

interface VersionHistoryPanelProps {
  versions: NoteVersion[]
  noteSubject: string
  onRestore: (version: NoteVersion) => void
  onDelete: (timestamp: number) => void
  onSaveSnapshot: () => NoteVersion[]
  onClose: () => void
  theme: "light" | "dark"
  currentPages: string[]
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  let relative: string
  if (mins < 1) relative = "Just now"
  else if (mins < 60) relative = `${mins}m ago`
  else if (hours < 24) relative = `${hours}h ago`
  else if (days < 7) relative = `${days}d ago`
  else relative = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${relative} · ${time}`
}

function getPagePreview(pages: string[]): string {
  const text = pages.join(" ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  return text.slice(0, 120) || "Empty"
}

function countChanges(version: NoteVersion, currentPages: string[]): string {
  const vPages = version.pages.length
  const boxCount = Object.values(version.boxes).reduce((sum, arr) => sum + arr.length, 0)
  const parts: string[] = []
  parts.push(`${vPages} page${vPages !== 1 ? "s" : ""}`)
  if (boxCount > 0) parts.push(`${boxCount} box${boxCount !== 1 ? "es" : ""}`)
  return parts.join(", ")
}

export const VersionHistoryPanel = memo(function VersionHistoryPanel({
  versions,
  noteSubject,
  onRestore,
  onDelete,
  onSaveSnapshot,
  onClose,
  theme,
  currentPages,
}: VersionHistoryPanelProps) {
  const isDark = theme === "dark"
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null)
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)
  const [localVersions, setLocalVersions] = useState(versions)

  const sorted = useMemo(() => [...localVersions].sort((a, b) => b.timestamp - a.timestamp), [localVersions])

  const grouped = useMemo(() => {
    const groups: { label: string; items: NoteVersion[] }[] = []
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 86400000

    let today: NoteVersion[] = []
    let yesterday: NoteVersion[] = []
    let older: NoteVersion[] = []

    for (const v of sorted) {
      if (v.timestamp >= todayStart) today.push(v)
      else if (v.timestamp >= yesterdayStart) yesterday.push(v)
      else older.push(v)
    }

    if (today.length) groups.push({ label: "Today", items: today })
    if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday })
    if (older.length) groups.push({ label: "Older", items: older })
    return groups
  }, [sorted])

  const previewVersion = previewIdx !== null ? sorted[previewIdx] : null

  return (
    <div
      className="fixed inset-0 z-[500] flex"
      onClick={onClose}
    >
      <div className="flex-1" />
      <div
        className={`w-[340px] h-full flex flex-col shadow-2xl border-l ${isDark ? "bg-[#09090b] border-zinc-800" : "bg-white border-zinc-200"}`}
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: 'Crimson Pro, serif' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-zinc-100 text-zinc-400"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isDark ? "text-zinc-400" : "text-zinc-500"}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span className={`text-[13px] font-normal truncate ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
              Version History
            </span>
          </div>
          <button
            onClick={() => { const updated = onSaveSnapshot(); setLocalVersions(updated) }}
            title="Save snapshot now"
            className={`text-[10px] font-normal px-2 py-1 rounded-lg transition-colors cursor-pointer ${isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-100"}`}
          >
            Save now
          </button>
        </div>

        {/* Note title */}
        <div className={`px-4 py-2 text-[11px] truncate ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
          {noteSubject || "Untitled"}
          <span className="ml-1.5 tabular-nums">· {localVersions.length} version{localVersions.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Preview pane */}
        {previewVersion && (
          <div className={`mx-3 mb-2 rounded-lg border p-3 ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
            <div className={`text-[10px] font-normal uppercase tracking-wide mb-1.5 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Preview</div>
            <div className={`text-[11px] leading-relaxed line-clamp-4 ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
              {getPagePreview(previewVersion.pages)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => { onRestore(previewVersion); onClose() }}
                className="text-[10px] font-normal px-2.5 py-1 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors cursor-pointer"
              >
                Restore this version
              </button>
              <button
                onClick={() => setPreviewIdx(null)}
                className={`text-[10px] font-normal px-2 py-1 rounded-lg transition-colors cursor-pointer ${isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-100"}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Version list */}
        <div
          className="flex-1 overflow-y-auto px-3 pb-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: isDark ? "#3f3f46 transparent" : "#d4d4d8 transparent" }}
        >
          {sorted.length === 0 && (
            <div className={`text-center py-12 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-40">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-[12px] font-normal">No versions yet</p>
              <p className="text-[10px] mt-1 opacity-70">Versions are saved automatically every 5 minutes and when you switch notes.</p>
            </div>
          )}

          {grouped.map(group => (
            <div key={group.label} className="mt-3 first:mt-0">
              <div className={`text-[9px] font-normal uppercase tracking-widest px-1 mb-1.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((v, i) => {
                  const globalIdx = sorted.indexOf(v)
                  const isConfirming = confirmIdx === globalIdx
                  return (
                    <div
                      key={v.timestamp}
                      className={`group rounded-lg border p-2.5 transition-colors cursor-pointer ${
                        previewIdx === globalIdx
                          ? isDark ? "border-orange-600/40 bg-orange-950/20" : "border-orange-300 bg-orange-50/50"
                          : isDark ? "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50" : "border-zinc-100 hover:border-zinc-200 bg-white"
                      }`}
                      onClick={() => setPreviewIdx(previewIdx === globalIdx ? null : globalIdx)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className={`text-[11px] font-normal ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                            {formatTimestamp(v.timestamp)}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                            {countChanges(v, currentPages)}
                          </div>
                          <div className={`text-[10px] mt-1 truncate ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                            {getPagePreview(v.pages).slice(0, 60)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { onRestore(v); onClose() }}
                            title="Restore"
                            className={`p-1 rounded transition-colors ${isDark ? "hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300" : "hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"}`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                            </svg>
                          </button>
                          {!isConfirming ? (
                            <button
                              onClick={() => setConfirmIdx(globalIdx)}
                              title="Delete"
                              className={`p-1 rounded transition-colors ${isDark ? "hover:bg-red-500/10 text-zinc-600 hover:text-red-400" : "hover:bg-red-50 text-zinc-300 hover:text-red-400"}`}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => { onDelete(v.timestamp); setLocalVersions(prev => prev.filter(x => x.timestamp !== v.timestamp)); setConfirmIdx(null) }}
                              className="text-[9px] font-normal px-1.5 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                              Delete?
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {sorted.length > 0 && (
          <div className={`px-4 py-2.5 border-t text-[10px] ${isDark ? "border-zinc-800 text-zinc-600" : "border-zinc-100 text-zinc-400"}`}>
            Auto-saved every 5 min & on note switch
          </div>
        )}
      </div>
    </div>
  )
})
