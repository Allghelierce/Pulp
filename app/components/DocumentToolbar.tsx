"use client"
import { useRef, useState } from "react"
import { TablePicker } from "./TablePicker"
import { ColumnPicker } from "./ColumnPicker"

interface DocumentToolbarProps {
  accent: string
  zoom: string
  customSize: string
  saveSelection: () => void
  execCmd: (cmd: string, value?: string) => void
  applyFontSize: (sizePx: string) => void
  applyBlockStyle: (tag: string) => void
  setCustomSize: (v: string) => void
  setZoom: (v: string) => void
  insertTable: (rows: number, cols: number) => void
  insertColumns: (num: number) => void
}

export function DocumentToolbar({
  accent, zoom, customSize, saveSelection, execCmd, applyFontSize, applyBlockStyle,
  setCustomSize, setZoom, insertTable, insertColumns,
}: DocumentToolbarProps) {
  const tableButtonRef = useRef<HTMLButtonElement>(null)
  const colButtonRef = useRef<HTMLButtonElement>(null)
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [tableMenuPos, setTableMenuPos] = useState({ top: 0, left: 0 })
  const [colMenuPos, setColMenuPos] = useState({ top: 0, left: 0 })

  return (
    <div id="document-toolbar" className="ls-toolbar h-12 bg-zinc-50 border-b border-zinc-200/80 flex items-center pl-10 pr-4 gap-3 z-20 shrink-0 overflow-x-auto justify-between" onClick={() => { setShowTableMenu(false); setShowColumnMenu(false) }}>
      <div className="flex items-center gap-2.5">
        <select onMouseDown={saveSelection} onChange={e=>execCmd("fontName",e.target.value)} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-2.5 py-1 outline-none bg-white shrink-0 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer">
          <option value="Original Surfer">Default</option>
          <option value="Fredoka">Bubbly</option>
          <option value="Georgia">Serif</option>
          <option value="Arial">Sans</option>
        </select>

        <div className="flex items-center gap-1 border-r border-zinc-200 pr-2.5 shrink-0">
          <select onMouseDown={saveSelection} defaultValue="" onChange={e=>{const v=e.target.value; if(v){setCustomSize(v);applyFontSize(v);e.target.value=""}}} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-2 py-1 outline-none bg-white text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer">
            <option value="" disabled>Size</option>
            {[8,10,11,12,14,16,18,20,24,28,32,36,48,64,72].map(s=><option key={s} value={String(s)}>{s}px</option>)}
          </select>
          <input type="number" min={1} max={400} value={customSize} onChange={e=>setCustomSize(e.target.value)} onMouseDown={saveSelection} onKeyDown={e=>{if(e.key==="Enter")applyFontSize(customSize)}} className="w-14 text-[12px] font-medium border border-zinc-200 rounded-[5px] px-1.5 py-1 outline-none bg-white text-center text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)]" />
        </div>

        <select onMouseDown={saveSelection} defaultValue="" onChange={e=>{const v=e.target.value; if(!v) return; applyBlockStyle(v); e.target.value=""}} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-2.5 py-1 outline-none bg-white shrink-0 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer">
          <option value="" disabled>Style</option>
          <option value="default">Default</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="w-px h-5 bg-zinc-200 shrink-0" />

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

        <select value={zoom} onChange={e=>setZoom(e.target.value)} className="text-[12px] font-medium border border-zinc-200 rounded-[5px] px-2.5 py-1 outline-none bg-white shrink-0 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer">
          {[["0.43","50%"],["0.64","75%"],["0.85","100%"],["1.06","125%"],["1.28","150%"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    </div>
  )
}
