import { memo, useEffect, useRef, useState } from "react"
import AnimatedDownloadButton from "@/components/ui/download-hover-button"
import { ShoppingBag } from "lucide-react"
import { PulpIcon, GemIcon } from '@/app/components/CurrencyIcons'
import { ACCENT_COLORS } from '@/app/components/settings/SettingsView'

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
  onInsertVR: () => void
  activeTool: string
  setActiveTool: (tool: string) => void
  stickyColor: string
  setStickyColor: (color: string) => void
  onDownload: () => void
  onStartSidebarDrag: (x: number) => void
  sidebarWidth: number
  isSidebarDragging: boolean
  sap: number
  gems: number
  onOpenAiMenu: (x: number, y: number, selectedText?: string, initialPrompt?: string) => void
  onQuickPrompt: (prompt: string, buttonRect: DOMRect) => void
  onAiAction?: (action: string) => void
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
  onOpenGrove?: () => void
  userAvatarUrl?: string | null
  userEmail?: string | null
  onOpenLeaderboard?: () => void
  onOpenSettings?: () => void
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
  onOpenVersionHistory?: () => void
  darkPaper?: boolean
  selectedBoxCount: number
  unlockedCosmetics?: string[]
}


const GOLD = "#D4AF37"

const AiMascotIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="url(#orange-grad)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
    <defs>
      <radialGradient id="orange-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(11.2 11.2) rotate(90) scale(22.4)">
        <stop stopColor="#d97706" />
        <stop offset="1" stopColor="#d97706" />
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
  zoom, gridView, drawLineMode, currentPageIdx, accent,
  setZoom, setCarouselIdx, setGridView, setDrawLineMode,
  openAlert, clearPage, autoAlign, verticalAlign, centerStack, twoColumnGrid, distributeEvenly,
  insertTable, insertCornell, insertColumns,
  showDrawToolbar, onToggleDrawToolbar,
  rightSidebarOpen, setRightSidebarOpen,
  allCompacted, onCompactAll, onInsertHR, onInsertVR,
  activeTool, setActiveTool,
  stickyColor, setStickyColor,
  onDownload, theme,
  onStartSidebarDrag, sidebarWidth, isSidebarDragging,
  sap, gems, isVault, isUnlocked, onLock,
  sidebarOpen, onSidebarToggle, onTimerOpen, onOpenShop, onOpenGrove, onInsertImage, onOpenAiMenu, onQuickPrompt, onAiAction, isTextActive, onOpenChat, chatOpen,
  strokeColor, onStrokeColorChange, lineWidth, onLineWidthChange, onUndo, onRedo, canUndo, canRedo, onClearDrawing,
  userAvatarUrl, userEmail, onOpenLeaderboard, onOpenSettings, onOpenVersionHistory, darkPaper, selectedBoxCount, unlockedCosmetics = []
}: DocumentToolbarProps) {

  const toolbarRef = useRef<HTMLDivElement>(null)
  const [toolbarWidth, setToolbarWidth] = useState(9999)
  const [displaySap, setDisplaySap] = useState(sap)
  const prevSapRef = useRef(sap)
  const animFrameRef = useRef<number>(undefined)

  useEffect(() => {
    const prev = prevSapRef.current
    prevSapRef.current = sap
    if (sap >= prev || prev - sap < 2) {
      setDisplaySap(sap)
      return
    }
    const diff = prev - sap
    const steps = Math.min(diff, 30)
    const stepDuration = Math.min(60, 1200 / steps)
    let step = 0
    const tick = () => {
      step++
      const t = step / steps
      setDisplaySap(Math.round(prev - diff * t))
      if (step < steps) animFrameRef.current = window.setTimeout(tick, stepDuration) as unknown as number
    }
    tick()
    return () => { if (animFrameRef.current) clearTimeout(animFrameRef.current) }
  }, [sap])
  const compact = toolbarWidth < 820
  const hideCurrencies = toolbarWidth < 680
  const ultraCompact = toolbarWidth < 600

  useEffect(() => {
    const el = toolbarRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w) setToolbarWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const btnBaseInactive = "text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97]"
  const btnBaseActive = "text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97]"
  const btnIconOnly = "text-[12px] font-medium border border-zinc-200 rounded-[5px] p-1.5 bg-white hover:bg-zinc-100 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97]"
  const btnIconOnlyActive = "text-[12px] font-medium border border-zinc-200 rounded-[5px] p-1.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97]"
  const btnFont: React.CSSProperties = { fontFamily: '"EB Garamond", serif', letterSpacing: '0.01em' }

  const [currencyTooltip, setCurrencyTooltip] = useState<'sap' | 'gem' | null>(null)

  const NEON_ORANGE = "#d97706"
  const neonStyle: React.CSSProperties = { color: NEON_ORANGE, textShadow: `0 0 6px rgba(217,119,6,0.3), 0 0 2px rgba(217,119,6,0.15)` }
  const btn = (active: boolean) => compact ? (active ? btnIconOnlyActive : btnIconOnly) : (active ? btnBaseActive : btnBaseInactive)
  const activeStyle = (active: boolean): React.CSSProperties => active ? neonStyle : {}

  const leftToolsRef = useRef<HTMLDivElement>(null)
  const alignRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<HTMLDivElement>(null)
  const insertRef = useRef<HTMLDivElement>(null)
  const [alignOpen, setAlignOpen] = useState(false)
  const [drawOpen, setDrawOpen] = useState(false)
  const [insertOpen, setInsertOpen] = useState(false)
  const [tablePickerOpen, setTablePickerOpen] = useState(false)
  const [tableHover, setTableHover] = useState<[number, number]>([0, 0])
  const tablePickerRef = useRef<HTMLDivElement>(null)

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
    if (!tablePickerOpen) return
    const handler = (e: MouseEvent) => { if (!tablePickerRef.current?.contains(e.target as Node)) { setTablePickerOpen(false); setTableHover([0, 0]) } }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [tablePickerOpen])

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
      ref={toolbarRef}
      id="document-toolbar"
      className="ls-toolbar h-12 bg-zinc-50 border-b border-zinc-200/80 flex items-center pl-3 pr-4 gap-2.5 z-[200] shrink-0 justify-between relative"
      style={{ transform: "translateZ(0)", minWidth: 'max-content' }}
    >

      <div className="flex items-center gap-3 relative z-10 overflow-visible shrink-0" ref={leftToolsRef}>
        {/* Simple Sidebar Toggle Arrow */}
        <button
          onClick={onSidebarToggle}
          title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 transition-colors active:scale-90"
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
            className={`text-[12px] font-medium border border-zinc-200 rounded-[5px] ${compact ? 'p-1.5' : 'px-3 py-1'} bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97] flex items-center gap-1.5 ${insertOpen ? '' : 'text-zinc-700 hover:bg-zinc-100'}`}
            style={{ ...(insertOpen ? neonStyle : {}), ...btnFont }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {!compact && <><span>Insert</span>
            <svg width="8" height="6" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.5 }}><path d="M0 0l5 6 5-6z" /></svg></>}
          </button>

          {insertOpen && (
            <div className={`absolute top-[calc(100%+4px)] left-0 min-w-[180px] rounded-[6px] shadow-lg p-1 z-[100]`} style={{ background: theme === "dark" ? "rgba(31,31,35,0.96)" : "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}` }}>
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
                onMouseDown={e => { e.preventDefault(); setActiveTool(activeTool === 'vr' ? 'select' : 'vr'); setInsertOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer flex items-center gap-2 transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0"><line x1="12" y1="3" x2="12" y2="21" /></svg>
                Vertical Line
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); setActiveTool(activeTool === 'image' ? 'select' : 'image'); setInsertOpen(false) }}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer flex items-center gap-2 transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                style={btnFont}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                Image
              </button>
              <div className={`h-px mx-1.5 my-0.5 ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"}`} />
              <div ref={tablePickerRef} className="relative">
                <button
                  onMouseDown={e => { e.preventDefault(); setTablePickerOpen(!tablePickerOpen) }}
                  className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer flex items-center gap-2 transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                  style={btnFont}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
                  Table
                </button>
                {tablePickerOpen && (
                  <div
                    style={{
                      position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 999,
                      borderRadius: 12, padding: 12,
                      background: theme === "dark" ? "rgba(20,20,22,0.92)" : "rgba(255,255,255,0.92)",
                      backdropFilter: "blur(20px) saturate(120%)",
                      border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                      boxShadow: theme === "dark" ? "0 12px 40px -10px rgba(0,0,0,0.7)" : "0 12px 40px -10px rgba(0,0,0,0.12)",
                    }}
                    onMouseLeave={() => setTableHover([0, 0])}
                  >
                    <div style={{ fontSize: 10, color: theme === "dark" ? "#a1a1aa" : "#71717a", marginBottom: 8, textAlign: "center", fontWeight: 600 }}>
                      {tableHover[0] > 0 ? `${tableHover[0]} × ${tableHover[1]}` : "Select size"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 20px)", gap: 3 }}>
                      {Array.from({ length: 25 }, (_, i) => {
                        const r = Math.floor(i / 5) + 1
                        const c = (i % 5) + 1
                        const active = r <= tableHover[0] && c <= tableHover[1]
                        return (
                          <div
                            key={i}
                            onMouseEnter={() => setTableHover([r, c])}
                            onClick={() => { insertTable(r, c); setTablePickerOpen(false); setTableHover([0, 0]); setInsertOpen(false) }}
                            style={{
                              width: 20, height: 20, borderRadius: 3, cursor: "pointer",
                              background: active ? "rgba(217,119,6,0.5)" : "rgba(217,119,6,0.12)",
                              border: active ? "1.5px solid rgba(217,119,6,0.8)" : "1px solid rgba(217,119,6,0.25)",
                              transition: "all 0.05s",
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
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
          {!compact && <span>Grid</span>}
        </button>

        {/* Align Dropdown */}
        {!ultraCompact && <div ref={alignRef} className="relative flex shrink-0">
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
            {!compact && <span>Align</span>}
            <svg width="8" height="6" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.5 }}><path d="M0 0l5 6 5-6z" /></svg>
          </button>

          {alignOpen && (
            <div className={`absolute top-[calc(100%+4px)] left-0 min-w-[170px] rounded-[6px] shadow-lg p-1 z-[100]`} style={{ background: theme === "dark" ? "rgba(31,31,35,0.96)" : "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}` }}>
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
                onMouseDown={e => { e.preventDefault(); if (selectedBoxCount === 2) { twoColumnGrid(); setAlignOpen(false) } }}
                disabled={selectedBoxCount !== 2}
                className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] block transition-colors ${selectedBoxCount === 2 ? `cursor-pointer ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}` : `cursor-default ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}`}
                style={btnFont}
              >
                Two-Column Grid{selectedBoxCount !== 2 ? ' (select 2 boxes)' : ''}
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
        </div>}

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
            {!compact && <span>Draw</span>}
          </button>

          {showDrawToolbar && (
            <div
              className={`absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 rounded-[8px] shadow-md z-[100] p-1`}
              style={{ background: theme === "dark" ? "rgba(31,31,35,0.96)" : "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}` }}
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
                <button key="bw" onMouseDown={e => { e.preventDefault(); onStrokeColorChange(darkPaper ? '#ffffff' : '#000000') }}
                  className="w-4 h-4 rounded-full cursor-pointer hover:scale-125 transition-transform"
                  style={{
                    backgroundColor: darkPaper ? '#ffffff' : '#000000',
                    boxShadow: strokeColor === (darkPaper ? '#ffffff' : '#000000') ? `0 0 0 1.5px ${theme === "dark" ? "#27272a" : "#fff"}, 0 0 0 2.5px ${darkPaper ? '#ffffff' : '#000000'}` : "none",
                  }}
                />
                {ACCENT_COLORS.map(({ hex, cost, pro }) => {
                  const cosmeticId = `accent_${hex}`
                  const isOwned = !cost && !pro ? true : unlockedCosmetics.includes(cosmeticId)
                  return (
                  <button key={hex} onMouseDown={e => { e.preventDefault(); if (isOwned) onStrokeColorChange(hex) }}
                    className="w-4 h-4 rounded-full transition-transform relative"
                    style={{
                      backgroundColor: hex,
                      boxShadow: strokeColor === hex ? `0 0 0 1.5px ${theme === "dark" ? "#27272a" : "#fff"}, 0 0 0 2.5px ${hex}` : "none",
                      cursor: isOwned ? 'pointer' : 'not-allowed',
                      opacity: isOwned ? 1 : 0.4,
                    }}
                    title={isOwned ? undefined : `Locked — unlock in Settings`}
                  >
                    {!isOwned && <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="absolute inset-0 m-auto" style={{ color: theme === 'dark' ? '#fff' : '#000', opacity: 0.6 }}><path d="M12 2C9.24 2 7 4.24 7 7v3H5v12h14V10h-2V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v3H9V7c0-1.66 1.34-3 3-3z"/></svg>}
                  </button>
                  )
                })}
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
                {!compact && "Lock Vault"}
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                {!compact && "Unlock"}
              </>
            )}
          </button>
        )}



        {/* AI Button with Dropdown */}
        {!ultraCompact && <div ref={aiRef} className="relative flex shrink-0">
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
            {!compact && <span>Quick Prompts</span>}
            {!compact && <svg width="8" height="6" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.5, marginLeft: 2 }}><path d="M0 0l5 6 5-6z" /></svg>}
          </button>

          {aiOpen && (
            <div className={`absolute top-[calc(100%+4px)] left-0 min-w-[160px] rounded-[6px] shadow-lg p-1 z-[100]`} style={{ background: theme === "dark" ? "rgba(31,31,35,0.96)" : "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}` }}>
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
              {onAiAction && (
                <>
                  <div className="h-px bg-zinc-200/50 my-1 mx-1" />
                  <div className="px-2.5 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-tight mb-0.5">Study Tools</div>
                  {[
                    { label: "Quiz me", action: "quiz" },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onMouseDown={e => {
                        e.preventDefault()
                        onAiAction(item.action)
                        setAiOpen(false)
                      }}
                      className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-[4px] cursor-pointer block transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-100"}`}
                      style={btnFont}
                    >
                      {item.label}
                    </button>
                  ))}
                </>
              )}
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
        </div>}

        {/* Quiz / Chat button */}
        {!ultraCompact && <button
          onClick={onOpenChat}
          title="Chat with your notebook"
          className={`${btn(chatOpen)} flex items-center gap-1.5`}
          style={{ ...activeStyle(chatOpen), ...btnFont }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          {!compact && "Quiz Me"}
        </button>}

        {!compact && <div className="w-px h-5 bg-zinc-200 shrink-0" />}

        {!ultraCompact && <button
          onClick={onOpenVersionHistory}
          title="Version History"
          className={`${btn(false)} flex items-center gap-1.5`}
          style={btnFont}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {!compact && <span>History</span>}
        </button>}
      </div>

      {/* Currency Display - Centered */}
      {!hideCurrencies && <div className="relative">
        <div onClick={onOpenGrove} className="flex items-center gap-2.5 px-3.5 py-1.5 text-[12px] font-bold text-zinc-600 select-none tracking-tight rounded-full bg-black/[0.04] border border-black/[0.03] shadow-inner cursor-pointer hover:bg-black/[0.06] transition-colors" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
          <div
            className="flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setCurrencyTooltip(currencyTooltip === 'gem' ? null : 'gem') }}
            title="Time earned"
          >
            <GemIcon size={15} />
            <span>{gems >= 999999 ? "∞" : gems}</span>
          </div>
          {userAvatarUrl ? (
            <img src={userAvatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 ml-1.5 cursor-pointer hover:ring-2 hover:ring-orange-400/50 transition-all" referrerPolicy="no-referrer" onClick={(e) => { e.stopPropagation(); onOpenSettings?.() }} />
          ) : userEmail ? (
            <div className="w-5 h-5 rounded-full bg-zinc-300 flex items-center justify-center shrink-0 text-[8px] font-bold text-zinc-600 uppercase ml-1.5 cursor-pointer hover:ring-2 hover:ring-orange-400/50 transition-all" onClick={(e) => { e.stopPropagation(); onOpenSettings?.() }}>
              {userEmail[0]}
            </div>
          ) : null}
          {onOpenLeaderboard && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenLeaderboard?.() }}
              className="flex items-center gap-1 pl-1.5 border-l border-zinc-400/20 hover:text-orange-600 transition-colors group cursor-pointer"
              title="Leaderboard"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 mb-0.5"><rect x="2" y="14" width="5" height="8" rx="1" /><rect x="9.5" y="8" width="5" height="14" rx="1" /><rect x="17" y="11" width="5" height="11" rx="1" /></svg>
            </button>
          )}
        </div>

        {currencyTooltip && (
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setCurrencyTooltip(null)} />
            <div
              className="absolute z-[100] overflow-hidden"
              style={{
                top: '100%', right: 0, marginTop: 8, width: 260,
                borderRadius: 12,
                background: '#18181b',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6)',
              }}
            >
              <div className="px-4 pt-3.5 pb-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <GemIcon size={14} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e0d8', fontFamily: '"EB Garamond", serif' }}>
                    Time
                  </span>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                {[
                  { icon: '⏳', text: 'Earned 1:1 from focus sessions. 1 minute = 1 time.' },
                  { icon: '🌱', text: 'Spend time to buy seeds.' },
                  { icon: '🏆', text: 'Lifetime time earned is your leaderboard score.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="shrink-0" style={{ fontSize: 12 }}>{item.icon}</span>
                    <p style={{ fontSize: 12, color: '#a1a09c', fontFamily: '"EB Garamond", serif', lineHeight: 1.4, margin: 0 }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrencyTooltip(null)
                    if (currencyTooltip === 'sap') onOpenGrove?.()
                  }}
                  style={{
                    width: '100%', padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    fontFamily: '"EB Garamond", serif', color: '#fff', background: '#d97706', border: 'none', cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  Got it
                </button>
              </div>
            </div>
          </>
        )}

      </div>}

      <div className="shrink-0 pr-[68px]" />
    </div>
  )
})
