"use client"
import { useMemo, useState } from 'react'
import type { NoteData } from '@/app/types'
import { Plus } from 'lucide-react'

interface ShelfViewProps {
  notes: NoteData[]
  onOpenNote: (id: string) => void
  onCreateNote: () => void
  theme: "light" | "dark"
}

const BOOK_COLORS = [
  "#7A3318","#3D6022","#2E4C5A","#6A2020","#1E4C2A",
  "#7A4C10","#1A3C58","#5C2C48","#2A4C1A","#B04010",
  "#1A507A","#6C3A1A","#4A287A","#3A5C48","#5C1A28",
  "#2C3A58","#7C2844","#3A5C18","#9A3A08","#2A4A7A",
]

function sr(n: number) { return ((n * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff }

// ── Orange tree SVG ──────────────────────────────────────────────────────────
function OrangeTree({ flip, dk }: { flip?: boolean; dk: boolean }) {
  const g1 = dk ? '#1A3610' : '#265018'
  const g2 = dk ? '#254A18' : '#346A22'
  const g3 = dk ? '#2E5E20' : '#428430'
  const g4 = dk ? '#387228' : '#52A03C'
  const id = flip ? 'r' : 'l'

  const orangePositions: [number,number,number][] = [
    [50,234,6.5],[82,226,6],[36,248,5.5],[96,242,6.2],
    [65,212,6.8],[44,262,5],[88,255,5.5],[62,244,5.2],
    [30,268,4.8],[102,260,5],[72,274,5],[40,222,5.5],
    [75,198,5],[55,198,6],
  ]

  return (
    <svg width="138" height="720" viewBox="0 0 138 720"
      style={{ overflow:'visible', flexShrink:0, transform: flip ? 'scaleX(-1)' : undefined }}>
      <defs>
        <radialGradient id={`og-${id}`} cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#FFCA4A" />
          <stop offset="48%" stopColor="#E87818" />
          <stop offset="100%" stopColor="#C05010" />
        </radialGradient>
        <linearGradient id={`pot-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6A2E10" />
          <stop offset="38%" stopColor="#C06838" />
          <stop offset="72%" stopColor="#AE5C30" />
          <stop offset="100%" stopColor="#6A2E10" />
        </linearGradient>
        <linearGradient id={`potrim-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D07848" />
          <stop offset="100%" stopColor="#A85830" />
        </linearGradient>
        <radialGradient id={`soil-${id}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#3A2010" />
          <stop offset="100%" stopColor="#1E0E06" />
        </radialGradient>
      </defs>

      {/* ── Pot ── */}
      {/* Pot body */}
      <path d="M 24 716 L 114 716 L 103 672 L 35 672 Z" fill={`url(#pot-${id})`} />
      {/* Pot shadow right side */}
      <path d="M 103 672 L 114 716 L 114 716 Z" fill="rgba(0,0,0,0.20)" />
      {/* Pot highlight left side */}
      <path d="M 35 672 L 24 716 Q 32 716 42 700 Z" fill="rgba(255,255,255,0.06)" />
      {/* Pot rim */}
      <rect x="19" y="664" width="100" height="16" rx="5" fill={`url(#potrim-${id})`} />
      <rect x="19" y="664" width="100" height="7" rx="5" fill="rgba(255,255,255,0.14)" />
      {/* Soil */}
      <ellipse cx="69" cy="672" rx="40" ry="10" fill={`url(#soil-${id})`} />
      <ellipse cx="62" cy="670" rx="14" ry="5" fill="rgba(255,255,255,0.04)" />

      {/* ── Trunk ── */}
      <path d="M 64 671 C 62 630 59 582 62 532 C 64 498 67 472 65 444"
        stroke="#2C1608" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d="M 64 671 C 62 630 59 582 62 532 C 64 498 67 472 65 444"
        stroke="#5C3820" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M 66 669 C 64 628 61 580 64 530 C 66 496 69 470 67 442"
        stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Branches */}
      <path d="M 63 548 Q 42 534 30 514" stroke="#4A2E14" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M 64 518 Q 86 502 100 488" stroke="#4A2E14" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M 64 488 Q 45 474 34 460" stroke="#4A2E14" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 65 465 Q 84 452 96 440" stroke="#4A2E14" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* ── Canopy — deep back ── */}
      <circle cx="69" cy="360" r="80" fill={g1} opacity="0.55" />
      <circle cx="32" cy="388" r="58" fill={g1} opacity="0.5" />
      <circle cx="108" cy="382" r="62" fill={g1} opacity="0.52" />

      {/* Canopy — mid ── */}
      <circle cx="69" cy="342" r="72" fill={g2} />
      <circle cx="28" cy="368" r="54" fill={g2} opacity="0.93" />
      <circle cx="110" cy="362" r="56" fill={g2} opacity="0.93" />
      <circle cx="69" cy="390" r="56" fill={g2} opacity="0.88" />
      <circle cx="46" cy="328" r="48" fill={g2} opacity="0.82" />
      <circle cx="94" cy="324" r="46" fill={g2} opacity="0.82" />

      {/* Canopy — front ── */}
      <circle cx="52" cy="328" r="56" fill={g3} />
      <circle cx="86" cy="332" r="54" fill={g3} opacity="0.96" />
      <circle cx="69" cy="308" r="50" fill={g3} opacity="0.92" />
      <circle cx="30" cy="354" r="44" fill={g3} opacity="0.88" />
      <circle cx="108" cy="348" r="48" fill={g3} opacity="0.9" />
      <circle cx="69" cy="372" r="48" fill={g3} opacity="0.82" />
      <circle cx="40" cy="316" r="38" fill={g3} opacity="0.78" />
      <circle cx="98" cy="312" r="36" fill={g3} opacity="0.78" />

      {/* Canopy — top shine ── */}
      <circle cx="55" cy="302" r="36" fill={g4} opacity="0.72" />
      <circle cx="80" cy="298" r="30" fill={g4} opacity="0.68" />
      <circle cx="69" cy="284" r="26" fill={g4} opacity="0.62" />
      <circle cx="45" cy="292" r="20" fill={g4} opacity="0.55" />
      <circle cx="92" cy="290" r="18" fill={g4} opacity="0.52" />

      {/* ── Oranges ── */}
      {orangePositions.map(([ox, oy, r], i) => (
        <g key={i}>
          <circle cx={ox} cy={oy} r={r} fill={`url(#og-${id})`} />
          <circle cx={ox - r*0.28} cy={oy - r*0.32} r={r*0.32} fill="rgba(255,224,160,0.32)" />
          <path d={`M ${ox} ${oy-r} Q ${ox+r*0.55} ${oy-r*1.75} ${ox+r*0.75} ${oy-r*1.55}`}
            stroke={g3} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  )
}

// ── Shelf layout constants ───────────────────────────────────────────────────
const SHELF_W    = 840
const SIDE_W     = 19
const DIV_W      = 8
const NUM_COLS   = 5
const COL_W      = Math.floor((SHELF_W - 2 * SIDE_W - (NUM_COLS - 1) * DIV_W) / NUM_COLS) // 154
const SECTION_H  = 152
const PLANK_H    = 15
const TOP_H      = 22
const BASE_H     = 28
const SHELF_ROWS = 4
const PER_SHELF  = 6   // max books per shelf section

// cols 1,2,3 (0-indexed) house books; 0 and 4 are empty
const BOOK_COL_INDICES = [1, 2, 3]

export function ShelfView({ notes, onOpenNote, onCreateNote, theme }: ShelfViewProps) {
  const dk = theme === "dark"
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Round-robin into 3 book-column pools
  const bookPools = useMemo(() => {
    const p: NoteData[][] = [[], [], []]
    notes.forEach((note, i) => p[i % 3].push(note))
    return p
  }, [notes])

  // Wood palette
  const frameEdge  = dk ? '#180E06' : '#6A3E22'
  const frameFace  = dk ? '#221408' : '#8A5430'
  const frameLight = dk ? '#2E1C0C' : '#A86C40'
  const backCol    = dk ? '#0C0804' : '#CEBB96'

  return (
    <div className="h-screen w-full overflow-auto flex flex-col items-center"
      style={{
        background: dk
          ? 'linear-gradient(170deg, #100B06 0%, #08060302 100%)'
          : 'linear-gradient(170deg, #F8F2E2 0%, #EDE3C6 100%)',
      }}
    >
      {/* Ambient ceiling light */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: dk
          ? 'radial-gradient(ellipse 55% 30% at 50% 0%, rgba(210,130,25,0.05) 0%, transparent 100%)'
          : 'radial-gradient(ellipse 55% 30% at 50% 0%, rgba(255,225,130,0.25) 0%, transparent 100%)',
      }} />

      {/* ── Header ── */}
      <div className="w-full flex items-end justify-between px-10 pt-10 pb-8 relative z-10"
        style={{ maxWidth: 1180 }}>
        <div>
          <h1 style={{
            fontFamily: 'Crimson Pro, serif', fontStyle: 'italic',
            fontSize: 44, lineHeight: 1, marginBottom: 7, margin: 0,
            color: dk ? '#E8701A' : '#C04A08',
          }}>Pulp</h1>
          <p style={{
            marginTop: 6, fontSize: 9, letterSpacing: '0.36em',
            textTransform: 'uppercase', fontWeight: 400,
            color: dk ? '#9A5830' : '#B07040',
          }}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} on the shelf
          </p>
        </div>
        <button onClick={onCreateNote} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #E0601A, #B83E0E)',
          color: 'white', fontWeight: 400, fontSize: 9, letterSpacing: '0.22em',
          textTransform: 'uppercase',
          boxShadow: `0 4px 20px rgba(200,70,10,${dk ? '0.55' : '0.36'})`,
        }}>
          <Plus size={12} style={{ strokeWidth: 2.5 }} />New Note
        </button>
      </div>

      {/* ── Main: trees + shelf ── */}
      <div className="relative z-10 flex items-end" style={{ gap: 18, paddingBottom: 64 }}>

        <OrangeTree dk={dk} />

        {/* ── Shelf unit ── */}
        <div style={{ width: SHELF_W, position: 'relative' }}>

          {/* Top cap */}
          <div style={{
            height: TOP_H,
            background: `linear-gradient(180deg, ${frameLight} 0%, ${frameEdge} 100%)`,
            borderRadius: '8px 8px 0 0',
            boxShadow: dk
              ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.5)'
              : 'inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 8px rgba(0,0,0,0.14)',
          }}>
            {/* Top cap grain */}
            <div style={{
              position:'absolute', inset:0,
              backgroundImage:'repeating-linear-gradient(90deg, transparent, transparent 34px, rgba(0,0,0,0.015) 34px, rgba(0,0,0,0.015) 35px)',
              borderRadius:'8px 8px 0 0',
            }}/>
          </div>

          {/* Cabinet body row */}
          <div style={{ display:'flex', position:'relative' }}>

            {/* Left side panel */}
            <div style={{
              width: SIDE_W, flexShrink: 0,
              background: `linear-gradient(90deg, ${frameEdge} 0%, ${frameFace} 60%, ${frameLight} 100%)`,
              boxShadow: `inset -2px 0 5px rgba(0,0,0,0.18)`,
            }}/>

            {/* Interior — all shelf rows */}
            <div style={{ flex:1 }}>
              {Array.from({ length: SHELF_ROWS }).map((_, rowIdx) => (
                <div key={rowIdx}>

                  {/* Section row */}
                  <div style={{ display:'flex', height: SECTION_H }}>
                    {[0,1,2,3,4].map(colIdx => {
                      const bookPoolIdx = BOOK_COL_INDICES.indexOf(colIdx)
                      const isBookCol   = bookPoolIdx !== -1
                      const pool        = isBookCol ? bookPools[bookPoolIdx] : []
                      const cellBooks   = pool.slice(rowIdx * PER_SHELF, (rowIdx + 1) * PER_SHELF)
                      const isLast      = colIdx === NUM_COLS - 1

                      return (
                        <div key={colIdx} style={{ display:'flex', flexShrink:0 }}>
                          {/* Section back */}
                          <div style={{
                            width: COL_W, height: SECTION_H,
                            background: backCol,
                            position: 'relative', overflow: 'hidden',
                          }}>
                            {/* Ambient shadows from vertical panels */}
                            <div style={{
                              position:'absolute',top:0,left:0,bottom:0,width:16,
                              background:'linear-gradient(90deg,rgba(0,0,0,0.11) 0%,transparent 100%)',
                              pointerEvents:'none',zIndex:1,
                            }}/>
                            <div style={{
                              position:'absolute',top:0,right:0,bottom:0,width:16,
                              background:'linear-gradient(270deg,rgba(0,0,0,0.09) 0%,transparent 100%)',
                              pointerEvents:'none',zIndex:1,
                            }}/>
                            {/* Shadow from shelf above */}
                            <div style={{
                              position:'absolute',top:0,left:0,right:0,height:22,
                              background:'linear-gradient(180deg,rgba(0,0,0,0.14) 0%,transparent 100%)',
                              pointerEvents:'none',zIndex:1,
                            }}/>
                            {/* Subtle back-panel texture */}
                            <div style={{
                              position:'absolute',inset:0,
                              backgroundImage: dk
                                ? 'repeating-linear-gradient(0deg,transparent,transparent 50px,rgba(255,255,255,0.008) 50px,rgba(255,255,255,0.008) 51px)'
                                : 'repeating-linear-gradient(0deg,transparent,transparent 50px,rgba(0,0,0,0.018) 50px,rgba(0,0,0,0.018) 51px)',
                              pointerEvents:'none',
                            }}/>

                            {/* Books */}
                            {isBookCol && cellBooks.length > 0 && (
                              <div style={{
                                position:'absolute',bottom:0,left:8,right:8,
                                display:'flex',alignItems:'flex-end',gap:2,
                                zIndex:2,
                              }}>
                                {cellBooks.map((note, bIdx) => {
                                  const seed  = rowIdx*100 + bookPoolIdx*33 + bIdx
                                  const bh    = 88 + Math.floor(sr(seed*3)*56)
                                  const bw    = 22 + Math.floor(sr(seed*7)*13)
                                  const color = BOOK_COLORS[(rowIdx*7 + bookPoolIdx*6 + bIdx*4 + 1) % BOOK_COLORS.length]
                                  const isHov = hoveredId === note.id
                                  const delay = rowIdx*70 + bookPoolIdx*45 + bIdx*28

                                  return (
                                    <div
                                      key={note.id}
                                      onClick={() => onOpenNote(note.id)}
                                      onMouseEnter={() => setHoveredId(note.id)}
                                      onMouseLeave={() => setHoveredId(null)}
                                      title={note.subject}
                                      className="book-item"
                                      style={{
                                        width:bw, height:bh,
                                        position:'relative', cursor:'pointer', flexShrink:0,
                                        transform: isHov ? 'translateY(-11px)' : 'translateY(0)',
                                        filter: isHov
                                          ? 'brightness(1.28) drop-shadow(0 -6px 13px rgba(0,0,0,0.52))'
                                          : 'none',
                                        transition:'transform 0.18s cubic-bezier(0.34,1.56,0.64,1),filter 0.18s ease',
                                        animationDelay:`${delay}ms`,
                                      }}
                                    >
                                      {/* Spine */}
                                      <div style={{
                                        position:'absolute',inset:0,
                                        background:`linear-gradient(90deg,${color}55 0%,${color} 14%,${color}F4 84%,${color}50 100%)`,
                                        borderRadius:'2px 2px 0 0',
                                      }}/>
                                      {/* Binding crease */}
                                      <div style={{
                                        position:'absolute',top:0,left:4,bottom:0,width:2.5,
                                        background:'rgba(0,0,0,0.26)',borderRadius:1,
                                      }}/>
                                      {/* Top highlight */}
                                      <div style={{
                                        position:'absolute',top:0,left:0,right:0,height:3,
                                        background:'rgba(255,246,214,0.2)',borderRadius:'2px 2px 0 0',
                                      }}/>
                                      {/* Page edge */}
                                      <div style={{
                                        position:'absolute',top:2,right:0,bottom:2,width:2,
                                        background:'rgba(238,222,172,0.26)',
                                      }}/>
                                      {/* Decorative bands */}
                                      <div style={{
                                        position:'absolute',
                                        top:Math.round(bh*0.11),left:0,right:0,height:1.5,
                                        background:'rgba(255,255,255,0.09)',
                                      }}/>
                                      <div style={{
                                        position:'absolute',
                                        bottom:Math.round(bh*0.11),left:0,right:0,height:1.5,
                                        background:'rgba(0,0,0,0.1)',
                                      }}/>
                                      {/* Title */}
                                      <div style={{
                                        position:'absolute',inset:'10px 0',
                                        display:'flex',alignItems:'center',justifyContent:'center',
                                        overflow:'hidden',
                                      }}>
                                        <span style={{
                                          writingMode:'vertical-rl',
                                          transform:'rotate(180deg)',
                                          fontSize:8,
                                          fontFamily:'Crimson Pro, serif',
                                          fontWeight:700,
                                          color:'rgba(255,248,228,0.72)',
                                          userSelect:'none',
                                          letterSpacing:'0.07em',
                                          maxHeight:bh-22,
                                          overflow:'hidden',
                                          whiteSpace:'nowrap',
                                        }}>{note.subject}</span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          {/* Vertical divider (between columns) */}
                          {!isLast && (
                            <div style={{
                              width:DIV_W, flexShrink:0,
                              background:`linear-gradient(90deg,${frameEdge} 0%,${frameFace} 48%,${frameEdge} 100%)`,
                              boxShadow:'inset 1px 0 0 rgba(255,255,255,0.055),inset -1px 0 0 rgba(0,0,0,0.1)',
                            }}/>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Horizontal shelf plank */}
                  <div style={{
                    height:PLANK_H, position:'relative', zIndex:2,
                    background:`linear-gradient(180deg,${frameLight}EE 0%,${frameFace} 22%,${frameEdge} 65%,${frameEdge} 100%)`,
                    boxShadow:`0 6px 18px rgba(0,0,0,${dk?'0.65':'0.28'}),0 2px 5px rgba(0,0,0,${dk?'0.42':'0.16'}),inset 0 1px 0 rgba(255,255,255,${dk?'0.09':'0.22'})`,
                  }}>
                    <div style={{
                      position:'absolute',inset:0,
                      backgroundImage:'repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(0,0,0,0.018) 20px,rgba(0,0,0,0.018) 21px)',
                    }}/>
                    <div style={{
                      position:'absolute',top:0,left:0,right:0,height:2,
                      background:`rgba(255,255,255,${dk?'0.09':'0.22'})`,
                    }}/>
                    <div style={{
                      position:'absolute',bottom:0,left:0,right:0,height:4,
                      background:`rgba(0,0,0,${dk?'0.38':'0.18'})`,
                    }}/>
                  </div>

                </div>
              ))}
            </div>

            {/* Right side panel */}
            <div style={{
              width:SIDE_W, flexShrink:0,
              background:`linear-gradient(270deg,${frameEdge} 0%,${frameFace} 60%,${frameLight} 100%)`,
              boxShadow:`inset 2px 0 5px rgba(0,0,0,0.18)`,
            }}/>

          </div>

          {/* Plinth / base */}
          <div style={{
            height:BASE_H, position:'relative',
            background:`linear-gradient(180deg,${frameFace} 0%,${frameEdge} 100%)`,
            borderRadius:'0 0 8px 8px',
            boxShadow: dk ? '0 18px 55px rgba(0,0,0,0.92)' : '0 18px 55px rgba(0,0,0,0.2)',
          }}>
            {/* Feet */}
            {[56, 192, 360, 528, SHELF_W - 74].map(left => (
              <div key={left} style={{
                position:'absolute', bottom:0, left,
                width:34, height:10,
                background:frameEdge,
                borderRadius:'0 0 4px 4px',
                boxShadow: dk ? '0 5px 14px rgba(0,0,0,0.7)' : '0 5px 14px rgba(0,0,0,0.16)',
              }}/>
            ))}
          </div>

          {/* Floor shadow */}
          <div style={{
            height:28, marginTop:6,
            background:'radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.22) 0%, transparent 70%)',
          }}/>

        </div>

        <OrangeTree flip dk={dk} />

      </div>

      <style>{`
        @keyframes book-rise {
          0%   { transform: translateY(14px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        .book-item {
          opacity: 0;
          animation: book-rise 0.42s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>
    </div>
  )
}
