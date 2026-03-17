import { useRef, useState, memo } from "react"
import { TablePicker } from "./TablePicker"
import { ColumnPicker } from "./ColumnPicker"

interface DocumentToolbarProps {
  accent: string
  zoom: string
  saveSelection: () => void
  setZoom: (v: string) => void
  insertTable: (rows: number, cols: number) => void
  insertColumns: (num: number) => void
  openAlert: (title: string, message?: string) => void
  showDrawToolbar: boolean
  onToggleDrawToolbar: () => void
}

export const DocumentToolbar = memo(function DocumentToolbar({
  accent, zoom, saveSelection, setZoom, insertTable, insertColumns, openAlert,
  showDrawToolbar, onToggleDrawToolbar,
}: DocumentToolbarProps) {
  const tableButtonRef = useRef<HTMLButtonElement>(null)
  const colButtonRef = useRef<HTMLButtonElement>(null)
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [tableMenuPos, setTableMenuPos] = useState({ top: 0, left: 0 })
  const [colMenuPos, setColMenuPos] = useState({ top: 0, left: 0 })

  return (
    <div id="document-toolbar" className="ls-toolbar h-12 bg-zinc-50 border-b border-zinc-200/80 flex items-center pl-10 pr-4 gap-3 z-20 shrink-0 overflow-x-auto justify-between" onClick={() => { setShowTableMenu(false); setShowColumnMenu(false) }} style={{ transform: "translateZ(0)" }}>
      <div className="flex items-center gap-2.5">

        {/* Table picker */}
        <div className="relative shrink-0">
          <button ref={tableButtonRef} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveSelection(); const r = tableButtonRef.current?.getBoundingClientRect(); if (r) setTableMenuPos({ top: r.bottom + 4, left: r.left }); setShowTableMenu(v => !v); setShowColumnMenu(false) }} onClick={e => e.stopPropagation()} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer">
            Table
          </button>
          {showTableMenu && (
            <div style={{ position: "fixed", top: tableMenuPos.top, left: tableMenuPos.left, zIndex: 1000 }} className="bg-white border border-zinc-200 rounded-xl shadow-xl p-3" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
              <TablePicker accent={accent} onSelect={(rows, cols) => { insertTable(rows, cols); setShowTableMenu(false) }} />
            </div>
          )}
        </div>

        {/* Column picker */}
        <div className="relative shrink-0">
          <button ref={colButtonRef} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveSelection(); const r = colButtonRef.current?.getBoundingClientRect(); if (r) setColMenuPos({ top: r.bottom + 4, left: r.left }); setShowColumnMenu(v => !v); setShowTableMenu(false) }} onClick={e => e.stopPropagation()} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer">
            Columns
          </button>
          {showColumnMenu && (
            <div style={{ position: "fixed", top: colMenuPos.top, left: colMenuPos.left, zIndex: 1000 }} className="bg-white border border-zinc-200 rounded-xl shadow-xl p-3" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
              <ColumnPicker onSelect={n => { insertColumns(n); setShowColumnMenu(false) }} />
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

        <button onClick={onToggleDrawToolbar} className={`flex items-center gap-2 text-[12px] font-medium border rounded-[5px] px-3 py-1 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer ${showDrawToolbar ? 'border-zinc-300 bg-zinc-100' : 'border-zinc-200 bg-white hover:bg-zinc-100'}`} style={showDrawToolbar ? { color: accent, borderColor: `${accent}40`, backgroundColor: `${accent}10` } : {}}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>
          </svg>
          Draw
        </button>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

        <select value={zoom} onChange={e=>setZoom(e.target.value)} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-2.5 py-1 outline-none bg-white shrink-0 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer">
          {[["0.43","50%"],["0.64","75%"],["0.85","100%"],["1.06","125%"],["1.28","150%"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Right: Full Access + Share */}
      <div className="flex items-center gap-3 shrink-0 pl-2 pr-1" style={{ fontFamily: '"EB Garamond", Georgia, serif' }}>
        <button onClick={() => openAlert("Share note", "Sharing is coming soon!")} className="flex items-center h-[34px] px-3.5 rounded-[7px] text-[14px] font-medium tracking-wide text-[#3f3f46] bg-white border border-[#e4e4e7] transition-colors hover:bg-[#f4f4f5] shadow-[0_1px_2px_rgba(0,0,0,0.04)]" title="Share note">
          <svg className="w-4 h-4 mr-2 text-[#71717a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          Share
        </button>
      </div>
    </div>
  )
})
