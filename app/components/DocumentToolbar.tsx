import { memo, useEffect, useRef, useState } from "react"
import AnimatedDownloadButton from "@/components/ui/download-hover-button"
import { ShareButton } from "@/components/ui/share-button"
import { Link as LinkIcon, ShoppingBag } from "lucide-react"

const XIcon = (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
const FbIcon = (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" /></svg>
const LiIcon = (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>

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
  centerStack: () => void
  twoColumnGrid: () => void
  distributeEvenly: () => void
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
  onOpenAiMenu: (x: number, y: number, selectedText?: string, initialPrompt?: string) => void
  onQuickPrompt: (prompt: string, buttonRect: DOMRect) => void
  isTextActive: boolean
  onOpenChat: () => void
  chatOpen: boolean
  isVault?: boolean
  isUnlocked?: boolean
  onLock?: () => void
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
  onTimerOpen?: () => void
  onOpenShop: () => void
  onOpenGemStore?: () => void
  onOpenGrove?: () => void
  userAvatarUrl?: string | null
  userEmail?: string | null
  onInsertImage?: () => void
  strokeColor: string
  onStrokeColorChange: (c: string) => void
  lineWidth: number
  onLineWidthChange: (w: number) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onClearDrawing: () => void
}


const GOLD = "#D4AF37"

const AiMascotIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="url(#orange-grad)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
    <defs>
      <radialGradient id="orange-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(11.2 11.2) rotate(90) scale(22.4)">
        <stop stopColor="#fb923c" />
        <stop offset="1" stopColor="#ea580c" />
      </radialGradient>
    </defs>
    {/* Eyes */}
    <circle cx="11" cy="14" r="1.5" fill="rgba(0,0,0,0.7)" />
    <circle cx="21" cy="14" r="1.5" fill="rgba(0,0,0,0.7)" />
    {/* Mouth */}
    <path d="M 12 21 Q 16 24 20 21" stroke="rgba(0,0,0,0.7)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    {/* Leaf */}
    <path d="M 16 2 L 20 0 Q 22 2 20 4 L 16 2 Z" fill="#166534" />
  </svg>
)

const COMMON_PROMPTS = [
  { label: "Summarize", prompt: "Summarize this as short bullet points. Use a bullet character (•) for each point. Output only the bullet points." },
  { label: "Make shorter", prompt: "Condense this into fewer words while keeping the meaning. Output only the shortened text." },
  { label: "Fix Grammar", prompt: "Fix grammar and spelling errors. Output only the corrected text." },
  { label: "Expand", prompt: "Expand this with more detail and explanation. Output only the expanded text." },
  { label: "Explain simply", prompt: "Rewrite this in very simple, easy-to-understand language. Output only the simplified text." },
  { label: "Rewrite", prompt: "Rewrite this more professionally and clearly. Output only the rewritten text." },
]

export const DocumentToolbar = memo(function DocumentToolbar({
  zoom, gridView, drawLineMode, currentPageIdx,
  setZoom, setCarouselIdx, setGridView, setDrawLineMode,
  openAlert, clearPage, autoAlign, verticalAlign, centerStack, twoColumnGrid, distributeEvenly,
  insertCornell, insertColumns,
  showDrawToolbar, onToggleDrawToolbar,
  rightSidebarOpen, setRightSidebarOpen,
  allCompacted, onCompactAll, onInsertHR,
  activeTool, setActiveTool,
  stickyColor, setStickyColor,
  onDownload, theme,
  onStartSidebarDrag, sidebarWidth, isSidebarDragging,
  sunshine, gems, isVault, isUnlocked, onLock,
  sidebarOpen, onSidebarToggle, onTimerOpen, onOpenShop, onOpenGemStore, onOpenGrove, onInsertImage, onOpenAiMenu, onQuickPrompt, isTextActive, onOpenChat, chatOpen,
  strokeColor, onStrokeColorChange, lineWidth, onLineWidthChange, onUndo, onRedo, canUndo, canRedo, onClearDrawing,
  userAvatarUrl, userEmail
}: DocumentToolbarProps) {



  const btnBaseInactive = "text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97]"
  const btnBaseActive = "text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97]"
  const btnFont: React.CSSProperties = { fontFamily: '"EB Garamond", Georgia, serif', letterSpacing: '0.01em' }

  const NEON_ORANGE = "#d97706"
  const neonStyle: React.CSSProperties = { color: NEON_ORANGE, textShadow: `0 0 6px rgba(217,119,6,0.3), 0 0 2px rgba(217,119,6,0.15)` }
  const btn = (active: boolean) => active ? btnBaseActive : btnBaseInactive
  const activeStyle = (active: boolean): React.CSSProperties => active ? neonStyle : {}

  const leftToolsRef = useRef<HTMLDivElement>(null)
  const alignRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<HTMLDivElement>(null)
  const insertRef = useRef<HTMLDivElement>(null)
  const [alignOpen, setAlignOpen] = useState(false)
  const [drawOpen, setDrawOpen] = useState(false)
  const [insertOpen, setInsertOpen] = useState(false)

  useEffect(() => {
    if (!alignOpen) return
    const handler = (e: MouseEvent) => { if (!alignRef.current?.contains(e.target as Node)) setAlignOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [alignOpen])

  const [aiOpen, setAiOpen] = useState(false)
  const aiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!drawOpen) return
    const handler = (e: MouseEvent) => { if (!drawRef.current?.contains(e.target as Node)) setDrawOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [drawOpen])

  useEffect(() => {
    if (!insertOpen) return
    const handler = (e: MouseEvent) => { if (!insertRef.current?.contains(e.target as Node)) setInsertOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [insertOpen])

  useEffect(() => {
    if (!aiOpen) return
    const handler = (e: MouseEvent) => { if (!aiRef.current?.contains(e.target as Node)) setAiOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [aiOpen])

  useEffect(() => {
    if (!leftToolsRef.current) return
  }, [])

  return (
    <div
      id="document-toolbar"
      className="ls-toolbar h-12 bg-zinc-50 border-b border-zinc-200/80 flex items-center pl-10 pr-4 gap-2.5 z-[200] shrink-0 justify-between relative"
      style={{ transform: "translateZ(0)" }}
    >

      <div className="flex items-center gap-3 relative z-10 min-w-0" ref={leftToolsRef}>
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

        {/* Insert Dropdown */}
        <div ref={insertRef} className="relative flex shrink-0">
          <button
            onClick={() => setInsertOpen(!insertOpen)}
            title="Insert elements"
            className={`text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97] flex items-center gap-1.5 ${insertOpen ? '' : 'text-zinc-700 hover:bg-zinc-100'}`}
            style={{ ...(insertOpen ? neonStyle : {}), ...btnFont }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span>Insert</span>
            <svg width="8" height="6" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.5 }}><path d="M0 0l5 6 5-6z" /></svg>
          </button>

          {insertOpen && (
            <div className={`absolute top-[calc(100%+4px)] left-0 min-w-[180px] rounded-[6px] shadow-lg border p-1 z-[100] ${theme === "dark" ? "bg-[#1f1f23] border-zinc-800" : "bg-white border-zinc-200"}`}>
              <div className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-tight mb-0.5 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Elements</div>
              <button
                onMouseDown={e => { e.preventDefault(); setActiveTool(activeTool === 'sticky' ? 'select' : 'sticky'); setInsertOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer flex items-center gap-2 transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15.5 3h-10A2.5 2.5 0 0 0 3 5.5v13A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-10L15.5 3z" />
                  <path d="M15 3v5.5a2.5 2.5 0 0 0 2.5 2.5h5.5" />
                </svg>
                Sticky Note
                <div className="ml-auto flex items-center gap-1">
                  {[['#fef08a'], ['#fce7f3'], ['#fed7aa'], ['#bfdbfe']].map(([color]) => (
                    <span
                      key={color}
                      onClick={e => { e.stopPropagation(); setStickyColor(color); setActiveTool('sticky'); setInsertOpen(false) }}
                      className={`w-3 h-3 rounded-full border border-black/10 cursor-pointer hover:scale-125 transition-transform ${stickyColor === color && activeTool === 'sticky' ? 'ring-1.5 ring-zinc-400 ring-offset-1' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); setActiveTool(activeTool === 'hr' ? 'select' : 'hr'); setInsertOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer flex items-center gap-2 transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><line x1="3" y1="12" x2="21" y2="12" /></svg>
                Horizontal Line
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); onInsertImage?.(); setInsertOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer flex items-center gap-2 transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                Image
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); setActiveTool(activeTool === 'textbox' ? 'select' : 'textbox'); setInsertOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer flex items-center gap-2 transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="14" y2="12" /></svg>
                Text Box
              </button>
            </div>
          )}
        </div>

        {/* Grid */}
        <button
          onMouseDown={e => { e.preventDefault(); setCarouselIdx(currentPageIdx); setGridView(v => !v) }}
          title="Page grid"
          className={`${btn(gridView)} flex items-center gap-1.5`}
          style={{ ...activeStyle(gridView), ...btnFont }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Grid</span>
        </button>

        {/* Align Dropdown */}
        <div ref={alignRef} className="relative flex shrink-0">
          <button
            onMouseDown={e => { e.preventDefault(); setAlignOpen(!alignOpen) }}
            title="Align options"
            className={`${btn(alignOpen)} flex items-center gap-1.5`}
            style={{ ...(alignOpen ? neonStyle : {}), ...btnFont }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" opacity="0.8" />
              <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" opacity="0.6" />
              <line x1="7" y1="18" x2="17" y2="18" strokeWidth="2" opacity="0.4" />
            </svg>
            <span>Align</span>
            <svg width="8" height="6" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.5 }}><path d="M0 0l5 6 5-6z" /></svg>
          </button>

          {alignOpen && (
            <div className={`absolute top-[calc(100%+4px)] left-0 min-w-[170px] rounded-[6px] shadow-lg border p-1 z-[100] ${theme === "dark" ? "bg-[#1f1f23] border-zinc-800" : "bg-white border-zinc-200"}`}>
              <div className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-tight mb-0.5 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Arrange Boxes</div>
              <button
                onMouseDown={e => { e.preventDefault(); autoAlign(); setAlignOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer block transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                Snap to Grid
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); verticalAlign(); setAlignOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer block transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                Stack Vertically
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); centerStack(); setAlignOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer block transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                Center on Page
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); twoColumnGrid(); setAlignOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer block transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                Two-Column Grid
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); distributeEvenly(); setAlignOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer block transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                Distribute Top Edges
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-zinc-200/60 mx-0.5" />

        {/* Draw */}
        <div ref={drawRef} className="relative flex shrink-0">
          <button
            onMouseDown={e => { e.preventDefault(); onToggleDrawToolbar() }}
            title={showDrawToolbar ? "Close Drawing" : "Drawing"}
            className={`${btn(showDrawToolbar)} flex items-center gap-1.5`}
            style={{ ...activeStyle(showDrawToolbar), ...btnFont }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="m2 2 7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>
            <span>Draw</span>
          </button>

          {showDrawToolbar && (
            <div
              className={`absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 rounded-[8px] border shadow-md z-[100] p-1 ${theme === "dark" ? "bg-[#1f1f23] border-zinc-800" : "bg-white/95 border-zinc-200/80 backdrop-blur-xl"}`}
              onMouseDown={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-px px-0.5 mb-1">
                {([
                  ["pen", "Pen", "M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"],
                  ["line", "Line", ""],
                  ["arrow", "Arrow", ""],
                  ["eraser", "Eraser", "m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21M22 21H7M5 11l9 9"],
                ] as const).map(([tool, label, d]) => {
                  const active = activeTool === tool
                  const isEraser = tool === "eraser"
                  return (
                    <button
                      key={tool}
                      onMouseDown={e => { e.preventDefault(); setActiveTool(isEraser && active ? "pen" : tool) }}
                      title={label}
                      className={`h-6 w-6 flex items-center justify-center rounded-[5px] transition-colors cursor-pointer active:scale-[0.95] ${
                        active
                          ? isEraser
                            ? "bg-red-500/10 text-red-500"
                            : theme === "dark" ? "bg-zinc-700 text-zinc-100" : "bg-zinc-100 text-zinc-800"
                          : theme === "dark" ? "text-zinc-500 hover:bg-zinc-800" : "text-zinc-400 hover:bg-zinc-50"
                      }`}
                    >
                      {tool === "line" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="19" x2="19" y2="5" /></svg>
                      ) : tool === "arrow" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5" /><polyline points="9 5 19 5 19 15" /></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
                      )}
                    </button>
                  )
                })}
                <div className={`w-px h-4 mx-0.5 ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-200/60"}`} />
                {[0.5, 1, 2, 4].map(w => (
                  <button key={w} onMouseDown={e => { e.preventDefault(); onLineWidthChange(w) }}
                    className={`h-6 w-5 flex items-center justify-center rounded-[4px] cursor-pointer transition-colors ${lineWidth === w ? (theme === "dark" ? "bg-zinc-700" : "bg-zinc-100") : ""}`}
                    title={`${w}px`}>
                    <div className="rounded-full" style={{
                      width: Math.max(2, w * 2), height: Math.max(2, w * 2),
                      backgroundColor: lineWidth === w ? (theme === "dark" ? "#e4e4e7" : "#18181b") : (theme === "dark" ? "#52525b" : "#b4b4b4"),
                    }} />
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5 px-0.5 mb-1">
                {["#000000","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899"].map(c => (
                  <button key={c} onMouseDown={e => { e.preventDefault(); onStrokeColorChange(c) }}
                    className="w-4 h-4 rounded-full cursor-pointer hover:scale-125 transition-transform"
                    style={{
                      backgroundColor: c,
                      boxShadow: strokeColor === c ? `0 0 0 1.5px ${theme === "dark" ? "#27272a" : "#fff"}, 0 0 0 2.5px ${c}` : "none",
                    }}
                  />
                ))}
              </div>
              <div className={`h-px mx-0.5 mb-1 ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"}`} />
              <div className="flex items-center gap-px px-0.5">
                <button onMouseDown={e => { e.preventDefault(); onUndo() }}
                  className={`h-5 w-5 flex items-center justify-center rounded-[4px] transition-colors cursor-pointer active:scale-[0.95] ${theme === "dark" ? "text-zinc-500 hover:bg-zinc-800" : "text-zinc-400 hover:bg-zinc-50"}`}
                  style={{ opacity: canUndo ? 1 : 0.2 }} title="Undo">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                </button>
                <button onMouseDown={e => { e.preventDefault(); onRedo() }}
                  className={`h-5 w-5 flex items-center justify-center rounded-[4px] transition-colors cursor-pointer active:scale-[0.95] ${theme === "dark" ? "text-zinc-500 hover:bg-zinc-800" : "text-zinc-400 hover:bg-zinc-50"}`}
                  style={{ opacity: canRedo ? 1 : 0.2 }} title="Redo">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                </button>
                <div className="flex-1" />
                <button onMouseDown={e => { e.preventDefault(); onClearDrawing() }}
                  className={`h-5 w-5 flex items-center justify-center rounded-[4px] transition-colors cursor-pointer active:scale-[0.95] ${theme === "dark" ? "text-red-400/60 hover:bg-red-500/10" : "text-red-300 hover:bg-red-50"}`}
                  title="Clear all">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {isVault && (
          <button
            onClick={onLock}
            className={`${btn(false)} flex items-center gap-1.5`}
            title={isUnlocked ? "Lock Vault" : "Unlock Vault"}
            style={btnFont}
          >
            {isUnlocked ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
                Lock Vault
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Unlock
              </>
            )}
          </button>
        )}



        {/* AI Button with Dropdown */}
        <div ref={aiRef} className="relative flex shrink-0">
          <button
            onMouseDown={e => { e.preventDefault(); if (isTextActive) setAiOpen(!aiOpen) }}
            title={isTextActive ? "Quick Prompts" : "Click on a text box first"}
            className={`${btn(aiOpen)} flex items-center gap-1.5`}
            style={{
              ...(aiOpen ? neonStyle : {}),
              ...btnFont,
              ...(!isTextActive ? { opacity: 0.4, cursor: "default" } : {}),
            }}
          >
            <AiMascotIcon size={14} />
            <span>Quick Prompts</span>
            <svg width="8" height="6" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.5, marginLeft: 2 }}><path d="M0 0l5 6 5-6z" /></svg>
          </button>

          {aiOpen && (
            <div className={`absolute top-[calc(100%+4px)] left-0 min-w-[160px] rounded-[6px] shadow-lg border p-1 z-[100] ${theme === "dark" ? "bg-[#1f1f23] border-zinc-800" : "bg-white border-zinc-200"}`}>
              <div className="px-2.5 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-tight mb-0.5">Quick Prompts</div>
              {COMMON_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onMouseDown={e => {
                    e.preventDefault()
                    const btnRect = e.currentTarget.getBoundingClientRect()
                    onQuickPrompt(item.prompt, btnRect)
                    setAiOpen(false)
                  }}
                  className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer block transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                  style={btnFont}
                >
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-zinc-200/50 my-1 mx-1" />
              <button
                onMouseDown={e => {
                  e.preventDefault()
                  const btnRect = e.currentTarget.getBoundingClientRect()
                  onOpenAiMenu(btnRect.left, btnRect.bottom + 8)
                  setAiOpen(false)
                }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer block transition-colors text-orange-600 hover:bg-orange-50`}
                style={btnFont}
              >
                Custom Prompt...
              </button>
            </div>
          )}
        </div>

        {/* Quiz / Chat button */}
        <button
          onClick={onOpenChat}
          title="Chat with your notebook"
          className={`${btn(chatOpen)} flex items-center gap-1.5`}
          style={{ ...activeStyle(chatOpen), ...btnFont }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          Quiz Me
        </button>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

        <select value={zoom} onChange={e => setZoom(e.target.value)} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-2.5 py-1 outline-none bg-white shrink-0 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer" style={btnFont}>
          {[["0.43", "50%"], ["0.64", "75%"], ["0.85", "100%"], ["1.06", "125%"], ["1.28", "150%"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Currencies Display - Centered */}
      <div className="relative">
        <div onClick={onOpenGrove} className="flex items-center gap-2 px-3 py-1 text-[9px] font-bold text-zinc-600 select-none tracking-tight rounded-full bg-black/[0.04] border border-black/[0.03] shadow-inner cursor-pointer hover:bg-black/[0.06] transition-colors" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
          <div className="flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer" title="Open Grove & Leaderboard">
            <span className="text-[10px] leading-none">☀️</span>
            <span>{sunshine >= 999999 ? "∞" : sunshine}</span>
          </div>
          <div className="w-px h-3 bg-zinc-400/30" />
          <div
            className="flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onOpenGemStore?.() }}
            title="Get Gems"
          >
            <span className="text-[10px] leading-none">💎</span>
            <span>{gems >= 999999 ? "∞" : gems}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenShop() }}
            className="flex items-center gap-1 ml-1 pl-1.5 border-l border-zinc-400/20 hover:text-orange-600 transition-colors group cursor-pointer"
            title="Pulp Boutique"
          >
            <ShoppingBag size={11} strokeWidth={2.8} className="group-hover:scale-110 mb-0.5" />
          </button>
          {userAvatarUrl ? (
            <img src={userAvatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 ml-1.5" referrerPolicy="no-referrer" />
          ) : userEmail ? (
            <div className="w-5 h-5 rounded-full bg-zinc-300 flex items-center justify-center shrink-0 text-[8px] font-bold text-zinc-600 uppercase ml-1.5">
              {userEmail[0]}
            </div>
          ) : null}
        </div>

      </div>

      {/* Right: Share */}
      <div className="flex items-center gap-3 shrink-0 pl-2 pr-[68px]" style={{ fontFamily: '"EB Garamond", Georgia, serif' }}>

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
