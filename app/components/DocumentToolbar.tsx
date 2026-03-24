import { memo } from "react"
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
  onDownload,
}: DocumentToolbarProps) {

  const btnBase = "text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97]"

  const activeStyle = (active: boolean): React.CSSProperties => active
    ? { backgroundColor: "#f4f4f5", borderColor: "#d4d4d8", color: "#18181b" }
    : {}

  return (
    <div
      id="document-toolbar"
      className="ls-toolbar h-12 bg-zinc-50 border-b border-zinc-200/80 flex items-center pl-10 pr-4 gap-2.5 z-20 shrink-0 overflow-x-auto justify-between"
      style={{ transform: "translateZ(0)" }}
    >
      <div className="flex items-center gap-2">

        {/* Grid */}
        <button
          onMouseDown={e => { e.preventDefault(); setCarouselIdx(currentPageIdx); setGridView(v => !v) }}
          title="Page grid"
          className={btnBase}
          style={activeStyle(gridView)}
        >
          Grid
        </button>

        {/* Align + Line grouped button */}
        <div className="flex shrink-0 border border-zinc-200 rounded-[5px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <button
            onMouseDown={e => { e.preventDefault(); autoAlign(); verticalAlign() }}
            title="Align boxes"
            className="text-[12px] font-medium px-3 py-1 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            Align
          </button>
          <div className="w-px bg-zinc-200 self-stretch" />
          <button
            onMouseDown={e => { e.preventDefault(); setDrawLineMode(!drawLineMode) }}
            title="Draw vertical line"
            className="px-2 py-1 hover:bg-zinc-100 transition-colors cursor-pointer flex items-center"
            style={drawLineMode ? { color: "#18181b", backgroundColor: "#f4f4f5" } : { color: "#a1a1aa" }}
          >
            <svg width="9" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="3" x2="12" y2="21" /></svg>
          </button>
        </div>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

        {/* Draw toolbar toggle */}
        <button
          onClick={onToggleDrawToolbar}
          className={`${btnBase} flex items-center gap-1.5`}
          style={activeStyle(showDrawToolbar)}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="m2 2 7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>
          Draw
        </button>

        {/* Sticky Note Tool */}
        <div className="flex shrink-0 border border-zinc-200 rounded-[5px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <button
            onClick={() => setActiveTool(activeTool === 'sticky' ? 'select' : 'sticky')}
            className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer whitespace-nowrap`}
            style={activeTool === 'sticky' ? { backgroundColor: '#f4f4f5', color: '#18181b' } : {}}
            title="Add Sticky Note"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={activeTool === 'sticky' ? stickyColor : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.5 3h-10A2.5 2.5 0 0 0 3 5.5v13A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-10L15.5 3z" />
              <path d="M15 3v5.5a2.5 2.5 0 0 0 2.5 2.5h5.5" />
            </svg>
            Sticky
          </button>
          <div className="w-px bg-zinc-200 self-stretch" />
          <div className="flex items-center gap-1 px-2">
            {[
              ['Yellow', '#fef08a'],
              ['Pink', '#fce7f3'],
              ['Blue', '#bae6fd'],
              ['Green', '#bbf7d0'],
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
          style={activeTool === 'hr' ? { backgroundColor: '#f4f4f5', color: '#18181b' } : {}}
          title="Add Horizontal Line"
        >
          <svg width="13" height="9" viewBox="0 0 24 24" fill="none" stroke={activeTool === 'hr' ? 'currentColor' : '#a1a1aa'} strokeWidth="3" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12" /></svg>
          H-Line
        </button>

        {/* Compact All */}
        <button
          onClick={onCompactAll}
          className={`${btnBase} flex items-center gap-1.5`}
          style={activeStyle(allCompacted)}
          title={allCompacted ? "Expand All" : "Collapse All"}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: allCompacted ? 'rotate(0deg)' : 'rotate(90deg)' }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          Compact
        </button>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

        <select value={zoom} onChange={e => setZoom(e.target.value)} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-2.5 py-1 outline-none bg-white shrink-0 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer">
          {[["0.43", "50%"], ["0.64", "75%"], ["0.85", "100%"], ["1.06", "125%"], ["1.28", "150%"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Right: Share + sidebar toggle */}
      <div className="flex items-center gap-3 shrink-0 pl-2 pr-1" style={{ fontFamily: '"EB Garamond", Georgia, serif' }}>
        <AnimatedDownloadButton onDownload={onDownload} />
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

        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className={`flex items-center justify-center w-[34px] h-[34px] rounded-[7px] border transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${rightSidebarOpen ? 'bg-zinc-100 border-zinc-300' : 'bg-white border-[#e4e4e7] hover:bg-[#f4f4f5]'}`}
          title="Toggle Sidebar"
          style={rightSidebarOpen ? { color: GOLD, borderColor: `${GOLD}44`, backgroundColor: `${GOLD}10` } : {}}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </button>
      </div>
    </div>
  )
})
