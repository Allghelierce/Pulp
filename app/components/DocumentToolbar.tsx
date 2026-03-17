import { useRef, useState, memo } from "react"
import { TablePicker } from "./TablePicker"
import { ColumnPicker } from "./ColumnPicker"

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
  insertCornell: () => void
  showDrawToolbar: boolean
  onToggleDrawToolbar: () => void
  rightSidebarOpen: boolean
  setRightSidebarOpen: (v: boolean) => void
}

const GOLD = "#D4AF37"
const chevron = (
  <svg width="7" height="5" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.45, marginLeft: 2 }}><path d="M0 0l5 6 5-6z"/></svg>
)

export const DocumentToolbar = memo(function DocumentToolbar({
  accent, zoom, gridView, sketchMode, drawLineMode, currentPageIdx,
  saveSelection, setZoom, setCarouselIdx, setGridView, setSketchMode, setSketchPrompt, setDrawLineMode,
  insertTable, insertColumns, openAlert, clearPage, autoAlign, insertCornell,
  showDrawToolbar, onToggleDrawToolbar,
  rightSidebarOpen, setRightSidebarOpen,
}: DocumentToolbarProps) {
  const insertButtonRef = useRef<HTMLButtonElement>(null)
  const aiButtonRef = useRef<HTMLButtonElement>(null)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [insertSubmenu, setInsertSubmenu] = useState<"table" | "columns" | null>(null)
  const [showAiMenu, setShowAiMenu] = useState(false)
  const [insertMenuPos, setInsertMenuPos] = useState({ top: 0, left: 0 })
  const [aiMenuPos, setAiMenuPos] = useState({ top: 0, left: 0 })

  const closeAll = () => { setShowInsertMenu(false); setInsertSubmenu(null); setShowAiMenu(false) }

  const btnBase = "text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer"

  const activeStyle = (active: boolean): React.CSSProperties => active
    ? { backgroundColor: "#f4f4f5", borderColor: "#d4d4d8", color: "#18181b" }
    : {}

  const menuItemStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8,
    width: "100%", padding: "7px 10px",
    fontSize: 12, fontWeight: 500,
    color: "#18181b", background: "transparent",
    border: "none", borderRadius: 6, cursor: "pointer",
    textAlign: "left",
  }

  return (
    <div
      id="document-toolbar"
      className="ls-toolbar h-12 bg-zinc-50 border-b border-zinc-200/80 flex items-center pl-10 pr-4 gap-2.5 z-20 shrink-0 overflow-x-auto justify-between"
      onClick={closeAll}
      style={{ transform: "translateZ(0)" }}
    >
      <div className="flex items-center gap-2">

        {/* Insert dropdown: Table, Columns, Cornell */}
        <div className="relative shrink-0">
          <button
            ref={insertButtonRef}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); saveSelection(); const r = insertButtonRef.current?.getBoundingClientRect(); if (r) setInsertMenuPos({ top: r.bottom + 4, left: r.left }); setShowInsertMenu(v => !v); setInsertSubmenu(null); setShowAiMenu(false) }}
            onClick={e => e.stopPropagation()}
            className={`${btnBase} flex items-center`}
            style={activeStyle(showInsertMenu)}
          >
            Insert {chevron}
          </button>
          {showInsertMenu && (
            <div
              style={{ position: "fixed", top: insertMenuPos.top, left: insertMenuPos.left, zIndex: 1000, minWidth: 160, background: "white", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 8, padding: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
              onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
            >
              <button
                onMouseDown={e => { e.preventDefault(); setInsertSubmenu(s => s === "table" ? null : "table") }}
                style={{ ...menuItemStyle, justifyContent: "space-between" }}
              >
                Table
                <svg width="6" height="9" viewBox="0 0 6 10" fill="currentColor" style={{ opacity: 0.4 }}><path d="M0 0l6 5-6 5z"/></svg>
              </button>
              {insertSubmenu === "table" && (
                <div style={{ padding: "4px 6px 2px" }}>
                  <TablePicker accent={accent} onSelect={(rows, cols) => { insertTable(rows, cols); setShowInsertMenu(false); setInsertSubmenu(null) }} />
                </div>
              )}

              <button
                onMouseDown={e => { e.preventDefault(); setInsertSubmenu(s => s === "columns" ? null : "columns") }}
                style={{ ...menuItemStyle, justifyContent: "space-between" }}
              >
                Columns
                <svg width="6" height="9" viewBox="0 0 6 10" fill="currentColor" style={{ opacity: 0.4 }}><path d="M0 0l6 5-6 5z"/></svg>
              </button>
              {insertSubmenu === "columns" && (
                <div style={{ padding: "4px 6px 2px" }}>
                  <ColumnPicker onSelect={n => { insertColumns(n); setShowInsertMenu(false); setInsertSubmenu(null) }} />
                </div>
              )}

              <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 6px" }} />

              <button
                onMouseDown={e => { e.preventDefault(); insertCornell(); setShowInsertMenu(false) }}
                style={menuItemStyle}
              >
                Cornell Notes
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

        {/* Grid */}
        <button
          onMouseDown={e => { e.preventDefault(); setCarouselIdx(currentPageIdx); setGridView(v => !v) }}
          title="Page grid"
          className={btnBase}
          style={activeStyle(gridView)}
        >
          Grid
        </button>

        {/* Line */}
        <button
          onMouseDown={e => { e.preventDefault(); setDrawLineMode(!drawLineMode) }}
          title="Draw vertical line"
          className={btnBase}
          style={activeStyle(drawLineMode)}
        >
          Line
        </button>

        {/* Align */}
        <button
          onMouseDown={e => { e.preventDefault(); autoAlign() }}
          title="Auto align boxes"
          className={btnBase}
        >
          Align
        </button>

        {/* Clear */}
        <button
          onMouseDown={e => { e.preventDefault(); clearPage() }}
          title="Clear page"
          className={btnBase}
          style={{ color: "#dc2626", borderColor: "#fecaca", backgroundColor: "#fff5f5" }}
        >
          Clear
        </button>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

        {/* AI dropdown */}
        <div className="relative shrink-0">
          <button
            ref={aiButtonRef}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); const r = aiButtonRef.current?.getBoundingClientRect(); if (r) setAiMenuPos({ top: r.bottom + 4, left: r.left }); setShowAiMenu(v => !v); setShowInsertMenu(false); setInsertSubmenu(null) }}
            onClick={e => e.stopPropagation()}
            className={`${btnBase} flex items-center`}
            style={{ ...activeStyle(showAiMenu || sketchMode), color: GOLD }}
          >
            AI {chevron}
          </button>
          {showAiMenu && (
            <div
              style={{ position: "fixed", top: aiMenuPos.top, left: aiMenuPos.left, zIndex: 1000, minWidth: 150, background: "white", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 8, padding: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
              onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
            >
              <button
                onMouseDown={e => {
                  e.preventDefault()
                  const selection = window.getSelection()?.toString()
                  if (!selection) { openAlert("Select text first", "Highlight some text before drawing a sketch box."); return }
                  setSketchPrompt(selection); setSketchMode(true); setShowAiMenu(false)
                }}
                style={{ ...menuItemStyle, ...(sketchMode ? { background: "#f4f4f5" } : {}) }}
              >
                AI Sketch
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

        {/* Draw toolbar toggle */}
        <button
          onClick={onToggleDrawToolbar}
          className={`${btnBase} flex items-center gap-1.5`}
          style={activeStyle(showDrawToolbar)}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
          Draw
        </button>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

        <select value={zoom} onChange={e => setZoom(e.target.value)} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-2.5 py-1 outline-none bg-white shrink-0 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer">
          {[["0.43","50%"],["0.64","75%"],["0.85","100%"],["1.06","125%"],["1.28","150%"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Right: Share + sidebar toggle */}
      <div className="flex items-center gap-3 shrink-0 pl-2 pr-1" style={{ fontFamily: '"EB Garamond", Georgia, serif' }}>
        <button onClick={() => openAlert("Share note", "Sharing is coming soon!")} className="flex items-center h-[34px] px-3.5 rounded-[7px] text-[14px] font-medium tracking-wide text-[#3f3f46] bg-white border border-[#e4e4e7] transition-colors hover:bg-[#f4f4f5] shadow-[0_1px_2px_rgba(0,0,0,0.04)]" title="Share note">
          <svg className="w-4 h-4 mr-2 text-[#71717a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          Share
        </button>

        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className={`flex items-center justify-center w-[34px] h-[34px] rounded-[7px] border transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${rightSidebarOpen ? 'bg-zinc-100 border-zinc-300' : 'bg-white border-[#e4e4e7] hover:bg-[#f4f4f5]'}`}
          title="Toggle Sidebar"
          style={rightSidebarOpen ? { color: GOLD, borderColor: `${GOLD}44`, backgroundColor: `${GOLD}10` } : {}}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </button>
      </div>
    </div>
  )
})
