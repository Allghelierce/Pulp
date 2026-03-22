"use client"
import React, { useMemo } from 'react'
import type { NoteData } from '@/app/types'
import { Plus } from 'lucide-react'
import { TREE_PATH } from './treePath'

interface ShelfViewProps {
  notes: NoteData[]
  onOpenNote: (id: string) => void
  onCreateNote: () => void
  theme: "light" | "dark"
}

// Warm earthy book colors that complement the wood shelf
const NOTE_COLORS = [
  "#8b3a1a","#5a6e2a","#4a5a6a",
  "#7a2a2a","#2a5a3a","#8a5a1a",
  "#2a4a6a","#6a3a5a","#3a5a2a",
  "#7a4a2a","#4a6a5a","#6a2a3a",
]

function sr(n: number) { return ((n * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff }

// Book spine — warm artisan style
function Book({ x, y, w, h, color, label, onClick, isNote, delay }: {
  x: number; y: number; w: number; h: number; color: string; label: string
  onClick?: () => void; isNote: boolean; delay: number
}) {
  return (
    <g onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', animationDelay: `${delay}ms`, transformOrigin: `${x+w/2}px ${y+h}px` }}
      className={`anim-book ${isNote ? 'shelf-book' : ''}`}>
      {/* Drop shadow */}
      <rect x={x+3} y={y+4} width={w} height={h} rx={2} fill="rgba(0,0,0,0.22)" />
      {/* Spine body */}
      <rect x={x} y={y} width={w} height={h} rx={2} fill={color} />
      {/* Left binding crease */}
      <rect x={x+2} y={y+2} width={2.5} height={h-4} rx={1} fill="rgba(0,0,0,0.2)" />
      {/* Top edge highlight */}
      <rect x={x} y={y} width={w} height={3} rx={1} fill="rgba(255,240,200,0.18)" />
      {/* Bottom shadow */}
      <rect x={x} y={y+h-3} width={w} height={3} rx={1} fill="rgba(0,0,0,0.18)" />
      {/* Subtle page edge (right side) */}
      <rect x={x+w-2} y={y+1} width={2} height={h-2} rx={1} fill="rgba(240,220,170,0.25)" />
      {isNote && (
        <text x={x+w/2} y={y+h/2} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,240,210,0.72)" fontSize="6"
          fontFamily="Georgia, serif" fontWeight="600"
          transform={`rotate(-90, ${x+w/2}, ${y+h/2})`}
          style={{ userSelect: 'none', pointerEvents: 'none' }}>
          {label.substring(0, 14)}
        </text>
      )}
    </g>
  )
}

export function ShelfView({ notes, onOpenNote, onCreateNote, theme }: ShelfViewProps) {
  const dk = theme === "dark"

  // Shelf y positions and x bounds within the 802×803 SVG coordinate space
  const shelves = [
    { y: 312, x1: 12,  x2: 434 },  // top
    { y: 472, x1: 148, x2: 750 },  // middle
    { y: 634, x1: 248, x2: 644 },  // bottom
  ]

  const shelfNotes = useMemo(() => {
    const dist: NoteData[][] = [[], [], []]
    notes.forEach((note, i) => dist[i % 3].push(note))
    return dist
  }, [notes])

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

      {/* Header */}
      <div className="absolute top-6 left-8 z-10">
        <h1 className="font-serif italic text-4xl leading-none mb-1"
          style={{ color: dk ? '#e8701a' : '#c04a08' }}>Pulp</h1>
        <p className="text-[10px] tracking-[0.28em] uppercase font-medium"
          style={{ color: dk ? '#9a5222' : '#b06830' }}>
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </p>
      </div>

      {/* Main tree SVG */}
      <svg viewBox="0 0 802 803" width="802" height="803"
        style={{ overflow: 'visible', maxHeight: '85vh', maxWidth: '90vw' }}>
        <defs>
          <filter id="ws" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="3" dy="5" stdDeviation="10" floodColor="rgba(0,0,0,0.28)" />
          </filter>
          <linearGradient id="woodGrad" x1="0" y1="0" x2="0" y2="803" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#eecf78" />
            <stop offset="28%"  stopColor="#ddb855" />
            <stop offset="62%"  stopColor="#c89840" />
            <stop offset="82%"  stopColor="#aa7e2c" />
            <stop offset="100%" stopColor="#8b6020" />
          </linearGradient>
        </defs>

        {/* ── TREE SHELF SILHOUETTE ── */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d={TREE_PATH}
          fill="url(#woodGrad)"
          filter="url(#ws)"
        />

        {/* ── BOOKS on shelves ─────────────────────────────────── */}
        {shelves.map((shelf, sIdx) => {
          const noteList = shelfNotes[sIdx]
          const BW = 22, gap = 3, pad = 18
          const maxBooks = Math.floor((shelf.x2 - shelf.x1 - pad * 2) / (BW + gap))
          const els: React.ReactElement[] = []
          for (let i = 0; i < Math.min(noteList.length, maxBooks); i++) {
            const note = noteList[i]
            const seed = sIdx * 100 + i
            const bH = 80 + Math.floor(sr(seed * 3) * 55)
            const x = shelf.x1 + pad + i * (BW + gap)
            const y = shelf.y - bH
            const color = NOTE_COLORS[(sIdx * 4 + i) % NOTE_COLORS.length]
            const delay = 150 + sIdx * 200 + i * 40
            els.push(
              <Book key={note.id}
                x={x} y={y} w={BW} h={bH} color={color}
                label={note.subject || 'Note'}
                onClick={() => onOpenNote(note.id)}
                isNote={true} delay={delay} />
            )
          }
          return els
        })}

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
        @keyframes book-pop {
          0% { transform: translateY(-12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .anim-book {
          opacity: 0;
          animation: book-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.15) forwards;
        }
        .shelf-book { transition: filter 0.15s ease; }
        .shelf-book:hover {
          filter: brightness(1.25) drop-shadow(0 -3px 6px rgba(0,0,0,0.3));
        }
        .shelf-book:hover rect:not(:first-child) {
          transform: translateY(-3px);
        }
        .shelf-book:hover text {
          transform: translateY(-3px) rotate(-90deg);
        }
      `}</style>
    </div>
  )
}
