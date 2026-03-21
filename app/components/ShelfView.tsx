"use client"
import React, { useMemo } from 'react'
import type { NoteData } from '@/app/types'
import { Plus } from 'lucide-react'

interface ShelfViewProps {
  notes: NoteData[]
  onOpenNote: (id: string) => void
  onCreateNote: () => void
  theme: "light" | "dark"
}

// Natural muted book spine colors
const NOTE_COLORS = [
  "#7a8c6a","#5c7050","#8a9c7a",
  "#6a7c9a","#4a6080","#8a7c6a",
  "#9a8a6a","#7a6850","#6a7a5a",
  "#8a6a5a","#7a8a9a","#5a6a7a",
]

function sr(n: number) { return ((n * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff }

// Orange with leaf stem — the Pulp motif
function Orange({ cx, cy, r = 8 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <ellipse cx={cx+1.5} cy={cy+r*0.78} rx={r*0.7} ry={r*0.24} fill="rgba(0,0,0,0.14)" />
      <circle cx={cx} cy={cy} r={r} fill="#F56A00" />
      <circle cx={cx-r*0.3} cy={cy-r*0.3} r={r*0.36} fill="rgba(255,215,90,0.4)" />
      <circle cx={cx} cy={cy+r*0.62} r={r*0.13} fill="rgba(155,50,0,0.55)" />
      <path d={`M${cx} ${cy-r} C${cx-r*0.45} ${cy-r*1.55} ${cx-r} ${cy-r*1.35} ${cx-r*0.78} ${cy-r}`}
        stroke="#2a5510" strokeWidth={1.3} fill="none" />
      <ellipse cx={cx-r*0.46} cy={cy-r*1.38} rx={r*0.48} ry={r*0.23} fill="#3a6a18" opacity={0.88}
        transform={`rotate(-28 ${cx-r*0.46} ${cy-r*1.38})`} />
    </g>
  )
}

// Green leaf cluster at branch tips
function Leaves({ cx, cy, s = 1, flip = false }: { cx: number; cy: number; s?: number; flip?: boolean }) {
  const f = flip ? -1 : 1
  return (
    <g>
      {/* Main stem */}
      <path d={`M${cx} ${cy} C${cx+10*f*s} ${cy-18*s} ${cx+20*f*s} ${cy-22*s} ${cx+16*f*s} ${cy-10*s}`}
        stroke="#4a7820" strokeWidth={1.4*s} fill="none" />
      {/* Leaves */}
      <ellipse cx={cx+8*f*s}  cy={cy-14*s} rx={10*s} ry={5*s}  fill="#4a8a20" opacity={0.88}
        transform={`rotate(${-35*f} ${cx+8*f*s} ${cy-14*s})`} />
      <ellipse cx={cx+16*f*s} cy={cy-20*s} rx={9*s}  ry={4.5*s} fill="#5a9a28" opacity={0.85}
        transform={`rotate(${-20*f} ${cx+16*f*s} ${cy-20*s})`} />
      <path d={`M${cx} ${cy} C${cx-5*f*s} ${cy-22*s} ${cx+5*f*s} ${cy-30*s} ${cx+10*f*s} ${cy-24*s}`}
        stroke="#4a7820" strokeWidth={1.2*s} fill="none" />
      <ellipse cx={cx+5*f*s}  cy={cy-28*s} rx={9*s}  ry={4*s}   fill="#6aaa30" opacity={0.85}
        transform={`rotate(${-55*f} ${cx+5*f*s} ${cy-28*s})`} />
      <path d={`M${cx} ${cy} C${cx+18*f*s} ${cy-10*s} ${cx+28*f*s} ${cy-15*s} ${cx+22*f*s} ${cy-5*s}`}
        stroke="#3a6818" strokeWidth={1.1*s} fill="none" />
      <ellipse cx={cx+22*f*s} cy={cy-10*s} rx={8*s}  ry={4*s}   fill="#4a8020" opacity={0.82}
        transform={`rotate(${-10*f} ${cx+22*f*s} ${cy-10*s})`} />
    </g>
  )
}

// Wooden shelf plank — light natural wood
function Plank({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const w = x2 - x1
  return (
    <g>
      {/* Underside shadow */}
      <rect x={x1+4} y={y+12} width={w-4} height={6} rx={3} fill="rgba(0,0,0,0.12)" />
      {/* Live-edge bottom (organic shape) */}
      <path d={`M${x1} ${y+12} C${x1+w*0.2} ${y+15} ${x1+w*0.5} ${y+14} ${x1+w*0.8} ${y+16} L${x2} ${y+12} L${x2} ${y} L${x1} ${y} Z`}
        fill="#c09040" opacity={0.35} />
      {/* Main plank body */}
      <rect x={x1} y={y} width={w} height={12} rx={3} fill="#d4aa58" />
      {/* Top highlight */}
      <rect x={x1} y={y} width={w} height={3.5} rx={2} fill="rgba(255,235,150,0.55)" />
      {/* Grain lines */}
      {[0.15, 0.3, 0.48, 0.65, 0.82].map(p => (
        <path key={p}
          d={`M${x1+w*p} ${y} C${x1+w*(p+0.005)} ${y+5} ${x1+w*p} ${y+9} ${x1+w*(p+0.003)} ${y+12}`}
          stroke="rgba(120,70,0,0.1)" strokeWidth={1} fill="none" />
      ))}
    </g>
  )
}

// Book spine
function Book({ x, y, w, h, color, label, onClick, isNote }: {
  x: number; y: number; w: number; h: number; color: string; label: string
  onClick?: () => void; isNote: boolean
}) {
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}
      className={isNote ? 'shelf-book' : ''}>
      <rect x={x+2} y={y+3} width={w} height={h} rx={2} fill="rgba(0,0,0,0.18)" />
      <rect x={x} y={y} width={w} height={h} rx={2} fill={color} />
      <rect x={x+1.5} y={y+4} width={2} height={h-8} rx={1} fill="rgba(255,255,255,0.16)" />
      <rect x={x} y={y} width={w} height={4} rx={1} fill="rgba(255,255,255,0.14)" />
      <rect x={x} y={y+h-4} width={w} height={4} rx={1} fill="rgba(0,0,0,0.12)" />
      {isNote && (
        <text x={x+w/2} y={y+h/2} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.78)" fontSize="6.5"
          fontFamily="Georgia, serif" fontWeight="600"
          transform={`rotate(-90, ${x+w/2}, ${y+h/2})`}
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {label.substring(0, 13)}
        </text>
      )}
    </g>
  )
}

// Small decorative pot with succulent
function Pot({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Pot */}
      <path d={`M${x-14} ${y} Q${x-16} ${y-24} ${x-10} ${y-34} L${x+10} ${y-34} Q${x+16} ${y-24} ${x+14} ${y}`}
        fill="#c07840" opacity={0.85} />
      <ellipse cx={x} cy={y-34} rx={11} ry={4} fill="#d08848" opacity={0.9} />
      <ellipse cx={x} cy={y} rx={15} ry={4.5} fill="#a06030" opacity={0.7} />
      {/* Soil */}
      <ellipse cx={x} cy={y-34} rx={9} ry={3} fill="#5a3a18" opacity={0.75} />
      {/* Succulent leaves */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = angle * Math.PI / 180
        const lx = x + Math.cos(rad) * 7
        const ly = y - 34 + Math.sin(rad) * 4 - 8
        return (
          <ellipse key={i} cx={lx} cy={ly} rx={5} ry={3.5}
            fill={i % 2 === 0 ? '#7aaa60' : '#8abf70'} opacity={0.9}
            transform={`rotate(${angle} ${lx} ${ly})`} />
        )
      })}
      <circle cx={x} cy={y-44} r={4} fill="#9abe78" opacity={0.95} />
    </g>
  )
}

// Ceramic bird
function Bird({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const f = flip ? -1 : 1
  return (
    <g transform={`scale(${f},1) translate(${flip ? -x*2 : 0},0)`}>
      <ellipse cx={x} cy={y} rx={11} ry={8} fill="#c8d4c0" />
      <circle cx={x+8} cy={y-5} r={7} fill="#c8d4c0" />
      <ellipse cx={x+11} cy={y-5} rx={3} ry={2} fill="#b8c4b0" />
      <circle cx={x+11} cy={y-7} r={1.5} fill="#2a3a20" />
      <path d={`M${x-6} ${y+5} L${x-4} ${y+12}`} stroke="#a8b4a0" strokeWidth={2} strokeLinecap="round" />
      <path d={`M${x+2} ${y+5} L${x+4} ${y+12}`} stroke="#a8b4a0" strokeWidth={2} strokeLinecap="round" />
    </g>
  )
}

// Small vase with lavender
function Vase({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x-7} ${y} Q${x-9} ${y-18} ${x-5} ${y-30} L${x+5} ${y-30} Q${x+9} ${y-18} ${x+7} ${y}`}
        fill="#d8d0c0" opacity={0.85} />
      <ellipse cx={x} cy={y-30} rx={6} ry={2.5} fill="#e8e0d0" opacity={0.9} />
      <ellipse cx={x} cy={y} rx={8} ry={3} fill="#c0b8a8" opacity={0.7} />
      {/* Lavender stems */}
      {[-4, 0, 4].map((dx, i) => (
        <g key={i}>
          <path d={`M${x+dx} ${y-30} C${x+dx} ${y-38} ${x+dx+2} ${y-46} ${x+dx+1} ${y-52}`}
            stroke="#7a8860" strokeWidth={1.2} fill="none" />
          <ellipse cx={x+dx+1} cy={y-54} rx={2.5} ry={5}
            fill={i===1 ? '#9488b8' : '#8878a8'} opacity={0.88} />
        </g>
      ))}
    </g>
  )
}

export function ShelfView({ notes, onOpenNote, onCreateNote, theme }: ShelfViewProps) {
  const dk = theme === "dark"

  // 3 shelves — compact, like the reference
  const shelves = [
    { y: 198, x1: 88, x2: 500 },  // top
    { y: 358, x1: 88, x2: 548 },  // middle
    { y: 518, x1: 88, x2: 538 },  // bottom
  ]

  const shelfNotes = useMemo(() => {
    const dist: NoteData[][] = [[], [], []]
    notes.forEach((note, i) => dist[i % 3].push(note))
    return dist
  }, [notes])

  // Light driftwood palette
  const w1 = '#8b6020'  // darkest groove/shadow
  const w2 = '#aa7e2c'  // dark base
  const w3 = '#c89840'  // mid wood
  const w4 = '#ddb855'  // light face
  const w5 = '#eecf78'  // bright face

  const bg = dk ? '#141008' : '#f0ebe0'

  return (
    <div className="h-screen w-full overflow-hidden relative flex flex-col items-center justify-center"
      style={{ background: bg }}>

      {/* Warm wall gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: dk
          ? 'radial-gradient(ellipse at 50% 30%, rgba(80,40,5,0.18) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at 50% 20%, rgba(255,230,160,0.4) 0%, transparent 65%)',
      }} />

      {/* Back button */}
      <div className="absolute top-6 left-8 z-10">
        <h1 className="font-serif italic text-4xl leading-none mb-1"
          style={{ color: dk ? '#e8701a' : '#c04a08' }}>Pulp</h1>
        <p className="text-[10px] tracking-[0.28em] uppercase font-medium"
          style={{ color: dk ? '#9a5222' : '#b06830' }}>
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </p>
      </div>

      {/* Main tree SVG — compact, portrait proportions */}
      <svg viewBox="0 0 640 640" width="640" height="640"
        style={{ overflow: 'visible', maxHeight: '85vh', maxWidth: '90vw' }}>
        <defs>
          <filter id="ws" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="4" dy="6" stdDeviation="8" floodColor="rgba(0,0,0,0.22)" />
          </filter>
        </defs>

        {/* ── LEFT TRUNK — stops just below bottom shelf ──────── */}
        <path d="M 88 560 C 80 520, 68 470, 76 420 C 84 370, 66 320, 74 268 C 82 215, 64 165, 73 120 C 78 90, 82 60, 84 30"
          stroke="rgba(0,0,0,0.15)" strokeWidth={58} strokeLinecap="round" fill="none" />
        <path d="M 86 558 C 78 518, 66 468, 74 418 C 82 368, 64 318, 72 266 C 80 213, 62 163, 71 118 C 76 88, 80 58, 82 28"
          stroke={w1} strokeWidth={54} strokeLinecap="round" fill="none" filter="url(#ws)" />
        <path d="M 86 558 C 78 518, 66 468, 74 418 C 82 368, 64 318, 72 266 C 80 213, 62 163, 71 118 C 76 88, 80 58, 82 28"
          stroke={w2} strokeWidth={42} strokeLinecap="round" fill="none" />
        <path d="M 86 558 C 78 518, 66 468, 74 418 C 82 368, 64 318, 72 266 C 80 213, 62 163, 71 118 C 76 88, 80 58, 82 28"
          stroke={w3} strokeWidth={28} strokeLinecap="round" fill="none" opacity={0.78} />
        <path d="M 84 558 C 76 518, 64 468, 72 418 C 80 368, 62 318, 70 266 C 78 213, 60 163, 69 118"
          stroke={w4} strokeWidth={13} strokeLinecap="round" fill="none" opacity={0.62} />
        <path d="M 82 558 C 74 518, 62 468, 70 418 C 78 368, 60 318, 68 266"
          stroke={w5} strokeWidth={4.5} strokeLinecap="round" fill="none" opacity={0.42} />
        {/* Short roots */}
        <path d="M 80 558 C 68 575, 55 582, 44 578" stroke={w2} strokeWidth={22} strokeLinecap="round" fill="none"/>
        <path d="M 80 558 C 92 572, 106 578, 118 574" stroke={w2} strokeWidth={16} strokeLinecap="round" fill="none"/>

        {/* Bark texture grooves */}
        <path d="M 72 450 C 78 465, 71 480, 77 495" stroke={w1} strokeWidth={2} fill="none" opacity={0.5}/>
        <path d="M 68 340 C 74 354, 67 368, 73 382" stroke={w1} strokeWidth={2} fill="none" opacity={0.45}/>
        <path d="M 72 240 C 77 252, 71 264, 76 276" stroke={w1} strokeWidth={1.8} fill="none" opacity={0.4}/>
        <path d="M 70 155 C 75 165, 69 174, 74 183" stroke={w1} strokeWidth={1.5} fill="none" opacity={0.38}/>

        {/* ── RIGHT CONNECTOR (shelf 1 → shelf 2) ──────────────── */}
        <path d="M 500 200 C 520 225, 545 278, 540 340 C 536 356, 530 362, 520 365"
          stroke={w1} strokeWidth={34} strokeLinecap="round" fill="none" />
        <path d="M 500 200 C 520 225, 545 278, 540 340 C 536 356, 530 362, 520 365"
          stroke={w2} strokeWidth={24} strokeLinecap="round" fill="none" />
        <path d="M 500 198 C 520 223, 544 276, 539 338 C 535 354, 529 360, 519 363"
          stroke={w3} strokeWidth={12} strokeLinecap="round" fill="none" opacity={0.7}/>
        <path d="M 499 196 C 519 221, 543 274, 538 336"
          stroke={w5} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.45}/>

        {/* ── RIGHT CONNECTOR (shelf 2 → shelf 3, pronounced organic loop) ── */}
        <path d="M 548 362 C 592 388, 630 425, 628 472 C 626 508, 596 522, 548 522"
          stroke={w1} strokeWidth={30} strokeLinecap="round" fill="none" />
        <path d="M 548 362 C 592 388, 630 425, 628 472 C 626 508, 596 522, 548 522"
          stroke={w2} strokeWidth={21} strokeLinecap="round" fill="none" />
        <path d="M 548 360 C 591 386, 628 423, 626 470 C 624 506, 594 520, 547 520"
          stroke={w3} strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.7}/>
        <path d="M 547 358 C 590 384, 627 421, 625 468 C 623 504, 593 518, 546 518"
          stroke={w5} strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={0.45}/>

        {/* ── LEFT CONNECTOR (trunk swell between shelf 1 & 2) ─── */}
        {/* The left trunk naturally widens and reconnects — add a side bulge */}
        <path d="M 74 202 C 50 230, 38 268, 52 306 C 62 332, 76 348, 74 362"
          stroke={w1} strokeWidth={28} strokeLinecap="round" fill="none" />
        <path d="M 74 202 C 50 230, 38 268, 52 306 C 62 332, 76 348, 74 362"
          stroke={w2} strokeWidth={19} strokeLinecap="round" fill="none" />
        <path d="M 73 200 C 49 228, 37 266, 51 304 C 61 330, 75 346, 73 360"
          stroke={w4} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.55}/>

        {/* Left connector between shelf 2 & 3 */}
        <path d="M 74 362 C 54 388, 44 420, 56 456 C 64 480, 78 502, 76 522"
          stroke={w1} strokeWidth={24} strokeLinecap="round" fill="none" />
        <path d="M 74 362 C 54 388, 44 420, 56 456 C 64 480, 78 502, 76 522"
          stroke={w2} strokeWidth={16} strokeLinecap="round" fill="none" />
        <path d="M 73 360 C 53 386, 43 418, 55 454 C 63 478, 77 500, 75 520"
          stroke={w4} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.55}/>

        {/* ── SHELF PLANKS ─────────────────────────────────────── */}
        <Plank x1={88} x2={500} y={198} />
        <Plank x1={88} x2={548} y={358} />
        <Plank x1={88} x2={538} y={518} />

        {/* ── UPPER DECORATIVE BRANCHES ────────────────────────── */}
        {/* Center-going up from trunk */}
        <path d="M 82 110 C 95 85, 120 60, 155 38"
          stroke={w1} strokeWidth={18} strokeLinecap="round" fill="none"/>
        <path d="M 82 110 C 95 85, 120 60, 155 38"
          stroke={w3} strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.7}/>
        <path d="M 82 110 C 95 85, 120 60, 155 38"
          stroke={w5} strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={0.45}/>

        {/* Right upper branch — longer, goes right */}
        <path d="M 155 38 C 195 20, 250 12, 305 8 C 350 4, 390 10, 420 18"
          stroke={w1} strokeWidth={14} strokeLinecap="round" fill="none"/>
        <path d="M 155 38 C 195 20, 250 12, 305 8 C 350 4, 390 10, 420 18"
          stroke={w3} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.72}/>
        <path d="M 155 36 C 195 18, 250 10, 305 6 C 350 2, 390 8, 420 16"
          stroke={w5} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.45}/>

        {/* Right sub-branch going further right */}
        <path d="M 350 8 C 390 -5, 430 -8, 470 -4 C 500 -1, 520 6, 535 14"
          stroke={w1} strokeWidth={10} strokeLinecap="round" fill="none"/>
        <path d="M 350 8 C 390 -5, 430 -8, 470 -4 C 500 -1, 520 6, 535 14"
          stroke={w3} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.7}/>

        {/* Right tip sub-branch */}
        <path d="M 480 -2 C 505 -12, 525 -15, 545 -10"
          stroke={w1} strokeWidth={7} strokeLinecap="round" fill="none"/>
        <path d="M 480 -2 C 505 -12, 525 -15, 545 -10"
          stroke={w4} strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={0.65}/>

        {/* Left upper branch — goes left */}
        <path d="M 82 110 C 60 90, 35 72, 12 58"
          stroke={w1} strokeWidth={16} strokeLinecap="round" fill="none"/>
        <path d="M 82 110 C 60 90, 35 72, 12 58"
          stroke={w3} strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.72}/>
        <path d="M 81 108 C 59 88, 34 70, 11 56"
          stroke={w5} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.42}/>

        {/* Left sub-tip */}
        <path d="M 20 62 C 6 48, -4 34, -8 18"
          stroke={w1} strokeWidth={10} strokeLinecap="round" fill="none"/>
        <path d="M 20 62 C 6 48, -4 34, -8 18"
          stroke={w3} strokeWidth={5.5} strokeLinecap="round" fill="none" opacity={0.7}/>

        {/* Mid-left branch coming off trunk between shelf 1 and 2 */}
        <path d="M 58 270 C 36 255, 14 248, -5 252"
          stroke={w1} strokeWidth={14} strokeLinecap="round" fill="none"/>
        <path d="M 58 270 C 36 255, 14 248, -5 252"
          stroke={w3} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.72}/>
        <path d="M 58 268 C 36 253, 14 246, -5 250"
          stroke={w5} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.42}/>

        {/* ── LEAF CLUSTERS + ORANGES ──────────────────────────── */}
        {/* Right upper branch tips */}
        <Leaves cx={420} cy={18}  s={1.1} flip={true}/>
        <Orange cx={432} cy={10} r={9}/>
        <Orange cx={410} cy={4}  r={7.5}/>

        <Leaves cx={535} cy={14}  s={0.95} flip={true}/>
        <Orange cx={548} cy={6}  r={8}/>

        <Leaves cx={545} cy={-10} s={0.85} flip={true}/>
        <Orange cx={556} cy={-18} r={7}/>

        {/* Center branch tip */}
        <Leaves cx={155} cy={38}  s={1.0} flip={false}/>
        <Orange cx={145} cy={30} r={8}/>
        <Orange cx={162} cy={22} r={6.5}/>

        {/* Left branch tips */}
        <Leaves cx={12}  cy={58}  s={0.95} flip={false}/>
        <Orange cx={2}   cy={50}  r={8}/>

        <Leaves cx={-8}  cy={18}  s={0.85} flip={false}/>
        <Orange cx={-16} cy={10}  r={7}/>

        {/* Mid-left branch tip */}
        <Leaves cx={-5}  cy={252} s={0.9} flip={false}/>
        <Orange cx={-14} cy={244} r={7.5}/>
        <Orange cx={2}   cy={240} r={6}/>

        {/* ── BOOKS on shelves ─────────────────────────────────── */}
        {shelves.map((shelf, sIdx) => {
          const noteList = shelfNotes[sIdx]
          const BW = 19, gap = 2, pad = 14
          const els: React.ReactElement[] = []
          for (let i = 0; i < noteList.length; i++) {
            const note = noteList[i]
            const seed = sIdx * 100 + i
            const bH = 72 + Math.floor(sr(seed * 3) * 50)
            const x = shelf.x1 + pad + i * (BW + gap)
            const y = shelf.y - bH
            const color = NOTE_COLORS[(sIdx * 4 + i) % NOTE_COLORS.length]
            els.push(
              <Book key={note.id}
                x={x} y={y} w={BW} h={bH} color={color}
                label={note.subject || 'Note'}
                onClick={() => onOpenNote(note.id)}
                isNote={true} />
            )
          }
          return els
        })}

        {/* ── DECORATIVE ITEMS ─────────────────────────────────── */}
        {/* Succulent pot on middle shelf */}
        <Pot x={300} y={358} />

        {/* Ceramic birds + vase on bottom shelf */}
        <Bird x={310} y={506} />
        <Bird x={340} y={506} flip />
        <Vase x={390} y={518} />

      </svg>

      {/* New Note button */}
      <button onClick={onCreateNote}
        className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-[10px] tracking-[0.18em] uppercase transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #e0601a, #b83e0e)',
          boxShadow: `0 4px 20px rgba(200,70,10,${dk ? '0.6' : '0.45'})`,
        }}>
        <Plus className="w-3.5 h-3.5" />New Note
      </button>

      <style>{`
        .shelf-book { transition: filter 0.15s ease; }
        .shelf-book:hover { filter: brightness(1.2) drop-shadow(0 -4px 8px rgba(0,0,0,0.25)); }
      `}</style>
    </div>
  )
}
