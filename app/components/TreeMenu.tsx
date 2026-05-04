"use client"
import { useState, useRef, useEffect } from 'react'
import type { NoteData } from '@/app/types'

interface TreeMenuProps {
  notes: NoteData[]
  onOpenNote: (id: string) => void
}

// Muted book colors — similar to real book spines
const NOTE_COLORS = [
  "#7a9a6a","#5a7a4a","#7a8a9a","#5a6a7a",
  "#9a8a6a","#7a6a4a","#8a7a9a","#6a5a7a",
  "#9a7a6a","#7a5a4a","#6a8a7a","#4a6a5a",
]
const FILLER = [
  "#c8c2b0","#d4cebb","#b8b2a2","#dcd5c5",
  "#c4bcac","#ccc5b5","#bab3a3","#d0c9b9",
]

function s(n: number) { return ((n * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff }

function LeafSprig({ cx, cy, sc = 1, f = 1 }: { cx: number; cy: number; sc?: number; f?: number }) {
  return (
    <g>
      <path d={`M${cx} ${cy} C${cx+18*f*sc} ${cy-11*sc} ${cx+32*f*sc} ${cy-6*sc} ${cx+27*f*sc} ${cy+5*sc}`}
        stroke="#4a7820" strokeWidth={1.3*sc} fill="none"/>
      <ellipse cx={cx+16*f*sc} cy={cy-6*sc} rx={8.5*sc} ry={4.5*sc} fill="#5a9828" opacity={0.88}
        transform={`rotate(${-25*f} ${cx+16*f*sc} ${cy-6*sc})`}/>
      <ellipse cx={cx+25*f*sc} cy={cy+3*sc} rx={7*sc} ry={3.5*sc} fill="#4a8820" opacity={0.82}
        transform={`rotate(${18*f} ${cx+25*f*sc} ${cy+3*sc})`}/>
      <path d={`M${cx} ${cy} C${cx+9*f*sc} ${cy-25*sc} ${cx+22*f*sc} ${cy-25*sc} ${cx+17*f*sc} ${cy-16*sc}`}
        stroke="#4a7820" strokeWidth={1.0*sc} fill="none"/>
      <ellipse cx={cx+12*f*sc} cy={cy-22*sc} rx={7*sc} ry={3.5*sc} fill="#6aac38" opacity={0.85}
        transform={`rotate(${-46*f} ${cx+12*f*sc} ${cy-22*sc})`}/>
    </g>
  )
}

function Orange({ cx, cy, r = 7 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <ellipse cx={cx+1} cy={cy+r*0.75} rx={r*0.7} ry={r*0.25} fill="rgba(0,0,0,0.15)"/>
      <circle cx={cx} cy={cy} r={r} fill="#F56A00"/>
      <circle cx={cx-r*0.28} cy={cy-r*0.3} r={r*0.35} fill="rgba(255,210,100,0.4)"/>
      <circle cx={cx} cy={cy+r*0.6} r={r*0.13} fill="rgba(160,55,0,0.55)"/>
      <path d={`M${cx} ${cy-r} C${cx-r*0.45} ${cy-r*1.55} ${cx-r} ${cy-r*1.35} ${cx-r*0.78} ${cy-r}`}
        stroke="#2d5c10" strokeWidth={1.2} fill="none"/>
      <ellipse cx={cx-r*0.45} cy={cy-r*1.35} rx={r*0.45} ry={r*0.22} fill="#3a7020" opacity={0.88}
        transform={`rotate(-28 ${cx-r*0.45} ${cy-r*1.35})`}/>
    </g>
  )
}

function Plank({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const w = x2 - x1
  return (
    <g>
      <rect x={x1} y={y+8} width={w} height={5} rx={1} fill="rgba(0,0,0,0.18)"/>
      <rect x={x1} y={y} width={w} height={8} rx={2} fill="#c8a060"/>
      <rect x={x1} y={y} width={w} height={2.5} rx={1} fill="rgba(255,230,150,0.5)"/>
      {[0.2, 0.5, 0.78].map(p => (
        <line key={p} x1={x1+w*p} y1={y} x2={x1+w*(p+0.005)} y2={y+8}
          stroke="rgba(100,60,0,0.12)" strokeWidth={1}/>
      ))}
    </g>
  )
}

export function TreeMenu({ notes, onOpenNote }: TreeMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  // 3 shelves
  const shelves = [
    { y: 88,  x1: 55,  x2: 282 },
    { y: 204, x1: 20,  x2: 298 },
    { y: 320, x1: 36,  x2: 292 },
  ]

  const shelfNotes: NoteData[][] = [[], [], []]
  notes.forEach((note, i) => shelfNotes[i % 3].push(note))

  // Light driftwood / natural wood palette
  const w1 = '#7a5228'   // darkest groove
  const w2 = '#a07038'   // base
  const w3 = '#c89048'   // mid
  const w4 = '#e0b870'   // light face
  const w5 = '#f0d098'   // highlight

  return (
    <div ref={ref} className="relative">

      {/* ── TRIGGER BUTTON ─────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Pulp shelf"
        className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors hover:bg-white/5 group"
      >
        {/* Mini orange icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" fill="#F56A00"/>
          <circle cx="5.5" cy="5.5" r="2" fill="rgba(255,200,80,0.4)"/>
          <circle cx="7" cy="10" r="0.8" fill="rgba(160,55,0,0.55)"/>
          <path d="M7 1 C5.5 -0.5 3.5 0 4.2 1.5" stroke="#2d5c10" strokeWidth="1" fill="none"/>
          <ellipse cx="4.5" cy="0.8" rx="2" ry="1" fill="#3a7020" opacity="0.85" transform="rotate(-20 4.5 0.8)"/>
        </svg>
        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-medium tracking-wide">
          Shelf
        </span>
      </button>

      {/* ── POPOVER PANEL ──────────────────────────────── */}
      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 z-[100] rounded-2xl shadow-2xl border border-white/8 overflow-hidden"
          style={{ width: 340, background: '#1c1208' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: '#d97706' }}>
              Pulp — {notes.length} {notes.length === 1 ? 'notebook' : 'notebooks'}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-600 hover:text-zinc-300 transition-colors text-[11px] w-5 h-5 flex items-center justify-center rounded"
            >
              ✕
            </button>
          </div>

          {/* Tree SVG */}
          <svg
            viewBox="0 0 320 360"
            width="320"
            height="360"
            className="mx-auto block"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="tmShadow">
                <feDropShadow dx="3" dy="5" stdDeviation="6" floodColor="rgba(0,0,0,0.35)"/>
              </filter>
            </defs>

            {/* ── LEFT MAIN TRUNK ─────────────────────────── */}
            {/* Shadow */}
            <path d="M 42 360 C 34 300, 22 240, 28 185 C 32 145, 38 115, 52 90"
              stroke="rgba(0,0,0,0.22)" strokeWidth={40} strokeLinecap="round" fill="none"/>
            {/* Dark base */}
            <path d="M 40 360 C 32 300, 20 240, 26 185 C 30 145, 36 115, 50 90"
              stroke={w1} strokeWidth={38} strokeLinecap="round" fill="none" filter="url(#tmShadow)"/>
            {/* Mid */}
            <path d="M 40 360 C 32 300, 20 240, 26 185 C 30 145, 36 115, 50 90"
              stroke={w2} strokeWidth={28} strokeLinecap="round" fill="none"/>
            {/* Light face */}
            <path d="M 40 360 C 32 300, 20 240, 26 185 C 30 145, 36 115, 50 90"
              stroke={w3} strokeWidth={16} strokeLinecap="round" fill="none" opacity={0.7}/>
            {/* Highlight */}
            <path d="M 38 360 C 30 300, 18 240, 24 185 C 28 145, 34 115, 48 90"
              stroke={w4} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.55}/>
            <path d="M 36 360 C 28 300, 16 240, 22 185 C 26 145, 32 115, 46 90"
              stroke={w5} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.35}/>

            {/* Bark grooves on left trunk */}
            <path d="M 30 285 C 35 295, 28 305, 34 315" stroke={w1} strokeWidth={1.5} fill="none" opacity={0.5}/>
            <path d="M 24 220 C 30 230, 23 240, 29 250" stroke={w1} strokeWidth={1.5} fill="none" opacity={0.45}/>
            <path d="M 28 155 C 33 165, 27 174, 33 182" stroke={w1} strokeWidth={1.2} fill="none" opacity={0.4}/>

            {/* ── RIGHT CONNECTORS ───────────────────────── */}
            {/* Top-right to mid-right connector */}
            <path d="M 280 90 C 295 115, 308 150, 305 185 C 302 200, 298 204, 298 204"
              stroke={w1} strokeWidth={24} strokeLinecap="round" fill="none"/>
            <path d="M 280 90 C 295 115, 308 150, 305 185 C 302 200, 298 204, 298 204"
              stroke={w2} strokeWidth={16} strokeLinecap="round" fill="none"/>
            <path d="M 280 88 C 295 113, 307 148, 304 183"
              stroke={w3} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.65}/>
            <path d="M 279 86 C 294 111, 306 146, 303 181"
              stroke={w4} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.45}/>

            {/* Mid-right looping down to bottom-right */}
            <path d="M 295 204 C 310 230, 318 270, 308 305 C 300 330, 288 320, 288 320"
              stroke={w1} strokeWidth={20} strokeLinecap="round" fill="none"/>
            <path d="M 295 204 C 310 230, 318 270, 308 305 C 300 330, 288 320, 288 320"
              stroke={w2} strokeWidth={13} strokeLinecap="round" fill="none"/>
            <path d="M 294 203 C 309 229, 317 268, 307 303"
              stroke={w3} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.65}/>
            <path d="M 293 202 C 308 228, 316 267, 306 302"
              stroke={w4} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.4}/>

            {/* ── CROWN BRANCHES ─────────────────────────── */}
            {/* Left crown */}
            <path d="M 52 90 C 38 68, 22 48, 10 28"
              stroke={w1} strokeWidth={14} strokeLinecap="round" fill="none"/>
            <path d="M 52 90 C 38 68, 22 48, 10 28"
              stroke={w3} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.7}/>
            {/* Left sub-branch */}
            <path d="M 32 58 C 22 44, 14 32, 8 18"
              stroke={w1} strokeWidth={9} strokeLinecap="round" fill="none"/>
            <path d="M 32 58 C 22 44, 14 32, 8 18"
              stroke={w3} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.65}/>

            {/* Right crown */}
            <path d="M 200 88 C 220 62, 245 40, 268 20"
              stroke={w1} strokeWidth={14} strokeLinecap="round" fill="none"/>
            <path d="M 200 88 C 220 62, 245 40, 268 20"
              stroke={w3} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.7}/>
            {/* Right sub-branch */}
            <path d="M 240 48 C 255 34, 270 22, 284 10"
              stroke={w1} strokeWidth={9} strokeLinecap="round" fill="none"/>
            <path d="M 240 48 C 255 34, 270 22, 284 10"
              stroke={w3} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.65}/>
            {/* Center crown twig */}
            <path d="M 130 88 C 138 65, 148 48, 160 32"
              stroke={w1} strokeWidth={10} strokeLinecap="round" fill="none"/>
            <path d="M 130 88 C 138 65, 148 48, 160 32"
              stroke={w3} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.65}/>

            {/* ── SHELF PLANKS ───────────────────────────── */}
            <Plank x1={55}  x2={282} y={88}/>
            <Plank x1={20}  x2={298} y={204}/>
            <Plank x1={36}  x2={292} y={320}/>

            {/* ── LEAF SPRIGS + ORANGES ──────────────────── */}
            {/* Left crown */}
            <LeafSprig cx={10} cy={28} sc={0.9} f={-1}/>
            <LeafSprig cx={8}  cy={18} sc={0.75} f={-1}/>
            <Orange cx={6}  cy={20} r={6.5}/>
            <Orange cx={16} cy={10} r={5.5}/>

            {/* Right crown */}
            <LeafSprig cx={268} cy={20} sc={0.9} f={1}/>
            <LeafSprig cx={284} cy={10} sc={0.75} f={1}/>
            <Orange cx={278} cy={14} r={6.5}/>
            <Orange cx={262} cy={6}  r={5}/>

            {/* Center crown */}
            <LeafSprig cx={160} cy={32} sc={0.85} f={1}/>
            <Orange cx={168} cy={24} r={6}/>
            <Orange cx={152} cy={20} r={5}/>

            {/* ── BOOKS on each shelf ─────────────────────── */}
            {shelves.map((shelf, sIdx) => {
              const noteList = shelfNotes[sIdx]
              const BW = 17
              const gap = 2
              const pad = 12
              const total = Math.floor((shelf.x2 - shelf.x1 - pad * 2) / (BW + gap))
              const els: React.ReactElement[] = []

              for (let i = 0; i < total; i++) {
                const note = noteList[i]
                const seed = sIdx * 80 + i
                const bH = note
                  ? 64 + Math.floor(s(seed * 3) * 40)
                  : 56 + Math.floor(s(seed * 7) * 38)
                const x = shelf.x1 + pad + i * (BW + gap)
                const y = shelf.y - bH
                const color = note
                  ? NOTE_COLORS[(sIdx * 4 + noteList.indexOf(note)) % NOTE_COLORS.length]
                  : FILLER[Math.floor(s(seed * 13) * FILLER.length)]

                els.push(
                  <g key={note ? note.id : `f-${sIdx}-${i}`}
                    onClick={note ? () => { onOpenNote(note.id); setOpen(false) } : undefined}
                    style={{ cursor: note ? 'pointer' : 'default' }}
                    className={note ? 'tree-book' : ''}
                  >
                    {/* Shadow */}
                    <rect x={x+2} y={y+3} width={BW} height={bH} rx={2} fill="rgba(0,0,0,0.2)"/>
                    {/* Body */}
                    <rect x={x} y={y} width={BW} height={bH} rx={2} fill={color}/>
                    {/* Left highlight */}
                    <rect x={x+1.5} y={y+4} width={2} height={bH-8} rx={1} fill="rgba(255,255,255,0.14)"/>
                    {/* Top edge */}
                    <rect x={x} y={y} width={BW} height={3.5} rx={1} fill="rgba(255,255,255,0.12)"/>
                    {/* Note label */}
                    {note && (
                      <text x={x+BW/2} y={y+bH/2} textAnchor="middle" dominantBaseline="middle"
                        fill="rgba(255,255,255,0.7)" fontSize="5.5"
                        fontFamily="EB Garamond, serif" fontWeight="600"
                        transform={`rotate(-90, ${x+BW/2}, ${y+bH/2})`}
                        style={{ userSelect:'none', pointerEvents:'none' }}>
                        {(note.subject || "Note").substring(0, 12)}
                      </text>
                    )}
                  </g>
                )
              }
              return els
            })}
          </svg>

          {/* Footer hint */}
          <p className="text-center text-[9px] text-zinc-700 pb-3 -mt-1 tracking-widest uppercase">
            click a book to open
          </p>
        </div>
      )}

      <style>{`
        .tree-book { transition: filter 0.12s ease; }
        .tree-book:hover { filter: brightness(1.2) drop-shadow(0 -3px 6px rgba(0,0,0,0.3)); }
      `}</style>
    </div>
  )
}
