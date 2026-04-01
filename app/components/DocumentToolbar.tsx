import { memo, useEffect, useRef, useState } from "react"
import AnimatedDownloadButton from "@/components/ui/download-hover-button"
import { ShareButton } from "@/components/ui/share-button"
import { Link as LinkIcon } from "lucide-react"

const XIcon = (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
const FbIcon = (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
const LiIcon = (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>

interface DocumentToolbarProps {
  accent: string
  zoom: string
  theme: "light" | "dark"
  gridView: boolean
  sketchMode: boolean
  drawLineMode: boolean
  currentPageIdx: number
  saveSelection: () => void
  setZoom: (v: string) => void
  setCarouselIdx: (idx: number) => void
  setGridView: (fn: (v: boolean) => boolean) => void
  setSketchMode: (v: boolean) => void
  setSketchPrompt: (v: string) => void
  setDrawLineMode: (v: boolean) => void
  insertTable: (rows: number, cols: number) => void
  insertColumns: (num: number) => void
  openAlert: (title: string, message?: string) => void
  clearPage: () => void
  autoAlign: () => void
  verticalAlign: () => void
  insertCornell: () => void
  showDrawToolbar: boolean
  onToggleDrawToolbar: () => void
  rightSidebarOpen: boolean
  setRightSidebarOpen: (v: boolean) => void
  allCompacted: boolean
  onCompactAll: () => void
  onInsertHR: () => void
  activeTool: string
  setActiveTool: (tool: string) => void
  stickyColor: string
  setStickyColor: (color: string) => void
  onDownload: () => void
  onStartSidebarDrag: (x: number) => void
  sidebarWidth: number
  isSidebarDragging: boolean
  sunshine: number
  gems: number
  isVault?: boolean
  isUnlocked?: boolean
  onLock?: () => void
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
  onTimerOpen?: () => void
}


const GOLD = "#D4AF37"

export const DocumentToolbar = memo(function DocumentToolbar({
  zoom, gridView, drawLineMode, currentPageIdx,
  setZoom, setCarouselIdx, setGridView, setDrawLineMode,
  openAlert, clearPage, autoAlign, verticalAlign,
  showDrawToolbar, onToggleDrawToolbar,
  rightSidebarOpen, setRightSidebarOpen,
  allCompacted, onCompactAll, onInsertHR,
  activeTool, setActiveTool,
  stickyColor, setStickyColor,
  onDownload, theme,
  onStartSidebarDrag, sidebarWidth, isSidebarDragging,
  sunshine, gems, isVault, isUnlocked, onLock,
  sidebarOpen, onSidebarToggle, onTimerOpen
}: DocumentToolbarProps) {

  const btnBase = "text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97]"
  const btnFont: React.CSSProperties = { fontFamily: '"EB Garamond", Georgia, serif', letterSpacing: '0.01em' }

  const activeStyle = (active: boolean): React.CSSProperties => active
    ? { backgroundColor: "#f4f4f5", borderColor: "#d4d4d8", color: "#18181b" }
    : {}

  const leftToolsRef = useRef<HTMLDivElement>(null)
  const alignRef = useRef<HTMLDivElement>(null)
  const [alignOpen, setAlignOpen] = useState(false)
  
  useEffect(() => {
    if (!alignOpen) return
    const handler = (e: MouseEvent) => { if (!alignRef.current?.contains(e.target as Node)) setAlignOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [alignOpen])

  useEffect(() => {
    if (!leftToolsRef.current) return
  }, [])

  return (
    <div
      id="document-toolbar"
      className="ls-toolbar h-12 bg-zinc-50 border-b border-zinc-200/80 flex items-center pl-10 pr-4 gap-2.5 z-20 shrink-0 justify-between relative"
      style={{ transform: "translateZ(0)" }}
    >
      
      <div className="flex items-center gap-3 relative z-10" ref={leftToolsRef}>
        {/* Simple Sidebar Toggle Arrow */}
        <button
          onClick={onSidebarToggle}
          title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          className="text-zinc-600 hover:text-zinc-800 transition-colors active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={sidebarOpen ? "15 18 9 12 15 6" : "9 18 15 12 9 6"}></polyline>
          </svg>
        </button>

        <div className="w-1 shrink-0" />

        <div className="w-px h-5 bg-zinc-200/60 mr-1" />

        {/* Grid */}
        <button
          onMouseDown={e => { e.preventDefault(); setCarouselIdx(currentPageIdx); setGridView(v => !v) }}
          title="Page grid"
          className={btnBase}
          style={{ ...activeStyle(gridView), ...btnFont }}
        >
          Grid View
        </button>

        {/* Align Dropdown */}
        <div ref={alignRef} className="relative flex shrink-0">
          <button
            onMouseDown={e => { e.preventDefault(); setAlignOpen(!alignOpen) }}
            title="Align options"
            className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 active:scale-[0.97]"
            style={{ ...(alignOpen ? { backgroundColor: "#f4f4f5", borderColor: "#d4d4d8", color: "#18181b" } : {}), ...btnFont }}
          >
            Align
            <svg width="8" height="6" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.5 }}><path d="M0 0l5 6 5-6z" /></svg>
          </button>

          {alignOpen && (
            <div className={`absolute top-[calc(100%+4px)] left-0 min-w-[130px] rounded-[6px] shadow-lg border p-1 z-[100] ${theme === "dark" ? "bg-[#1f1f23] border-zinc-800" : "bg-white border-zinc-200"}`}>
              <button
                onMouseDown={e => { e.preventDefault(); autoAlign(); setAlignOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer block transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                Horizontal Snap
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); verticalAlign(); setAlignOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer block transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                Vertical Distribute
              </button>
            </div>
          )}
        </div>

        {isVault && (
          <button
            onClick={onLock}
            className={`${btnBase} flex items-center gap-1.5`}
            title={isUnlocked ? "Lock Vault" : "Unlock Vault"}
            style={btnFont}
          >
            {isUnlocked ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                Lock Vault
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Unlock
              </>
            )}
          </button>
        )}



        {/* Draw toolbar toggle */}
        <button
          onClick={onToggleDrawToolbar}
          className={`${btnBase} flex items-center gap-1.5`}
          style={{ ...activeStyle(showDrawToolbar), ...btnFont }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="m2 2 7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>
          Draw
        </button>

        {/* Sticky Note Tool */}
        <div className="flex shrink-0 border border-zinc-200 rounded-[5px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <button
            onClick={() => setActiveTool(activeTool === 'sticky' ? 'select' : 'sticky')}
            className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer whitespace-nowrap`}
            style={{ ...(activeTool === 'sticky' ? { backgroundColor: '#f4f4f5', color: '#18181b' } : {}), ...btnFont }}
            title="Add Sticky Note"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={activeTool === 'sticky' ? stickyColor : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.5 3h-10A2.5 2.5 0 0 0 3 5.5v13A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-10L15.5 3z" />
              <path d="M15 3v5.5a2.5 2.5 0 0 0 2.5 2.5h5.5" />
            </svg>
            Sticky
          </button>
          <div className="flex items-center gap-1 px-2">
            {[
              ['Yellow', '#fef08a'],
              ['Pink', '#fce7f3'],
              ['Orange', '#fed7aa']
            ].map(([name, color]) => (
              <button
                key={name}
                onClick={() => { setStickyColor(color); setActiveTool('sticky') }}
                className={`w-3.5 h-3.5 rounded-full border border-black/5 transition-all hover:scale-125 ${stickyColor === color && activeTool === 'sticky' ? 'ring-2 ring-zinc-400 ring-offset-1' : ''}`}
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
          </div>
        </div>

        {/* HR Tool */}
        <button
          onClick={() => setActiveTool(activeTool === 'hr' ? 'select' : 'hr')}
          className={`${btnBase} flex items-center gap-1.5`}
          style={{ ...(activeTool === 'hr' ? { backgroundColor: '#f4f4f5', color: '#18181b' } : {}), ...btnFont }}
          title="Add Horizontal Line"
        >
          <svg width="13" height="9" viewBox="0 0 24 24" fill="none" stroke={activeTool === 'hr' ? 'currentColor' : '#a1a1aa'} strokeWidth="3" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12" /></svg>
          H-Line
        </button>

        {/* Compact All */}
        <button
          onClick={onCompactAll}
          className={`${btnBase} flex items-center gap-1.5`}
          style={{ ...activeStyle(allCompacted), ...btnFont }}
          title={allCompacted ? "Expand All" : "Collapse All"}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: allCompacted ? 'rotate(0deg)' : 'rotate(90deg)' }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          Compact
        </button>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

        <select value={zoom} onChange={e => setZoom(e.target.value)} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-2.5 py-1 outline-none bg-white shrink-0 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer" style={btnFont}>
          {[["0.43", "50%"], ["0.64", "75%"], ["0.85", "100%"], ["1.06", "125%"], ["1.28", "150%"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Currencies Display - Centered */}
      <div className="flex items-center gap-2 px-3 py-1 text-[9px] font-bold text-zinc-600 select-none tracking-tight rounded-full bg-black/[0.04] border border-black/[0.03] shadow-inner" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
        <div className="flex items-center gap-1.5 hover:scale-105 transition-transform cursor-default" title="Sunshine (Earned by active time)">
          <span className="text-[10px] leading-none">☀️</span>
          <span>{sunshine}</span>
        </div>
        <div className="w-px h-3 bg-zinc-400/30" />
        <div className="flex items-center gap-1.5 hover:scale-105 transition-transform cursor-default" title="Gems (Purchased or rare)">
          <span className="text-[10px] leading-none">💎</span>
          <span>{gems}</span>
        </div>
      </div>

      {/* Right: Timer + Share */}
      <div className="flex items-center gap-3 shrink-0 pl-2 pr-1" style={{ fontFamily: '"EB Garamond", Georgia, serif' }}>
        <button
          onClick={onTimerOpen}
          title="Focus Timer"
          className="h-[28px] flex items-center gap-1.5 px-2.5 rounded-[6px] border border-[#e4e4e7]/60 hover:border-[#d4d4d8] hover:bg-[#f9f9f9] bg-white transition-all active:scale-95"
          style={{ fontFamily: '"EB Garamond", Georgia, serif' }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#b85e22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <path d="M12 1v6m0 6v6" />
            <path d="M4.22 4.22l4.24 4.24m0 5.08l4.24 4.24M19.78 4.22l-4.24 4.24m0 5.08l-4.24 4.24" />
          </svg>
          <span className="text-[13.5px]" style={{ color: '#b85e22' }}>Timer</span>
        </button>

        <ShareButton
          links={[
            { icon: XIcon, onClick: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, "_blank"), label: "Share on X" },
            { icon: FbIcon, onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank"), label: "Share on Facebook" },
            { icon: LiIcon, onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank"), label: "Share on LinkedIn" },
            { icon: LinkIcon, onClick: () => navigator.clipboard.writeText(window.location.href), label: "Copy link" },
          ]}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#b85e22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share
        </ShareButton>

      </div>
    </div>
  )
})
