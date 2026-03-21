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

const NOTE_COLORS = [
  "#8B7355","#A08C6A","#6B8CAE","#4A7090",
  "#909090","#787878","#5C7A5C","#4A6A4A",
  "#9B8B6B","#C0A878","#7B6B9B","#5A4A7A",
  "#7A5050","#6A3E3E","#505868","#3E4858",
  "#4A5A3A","#3A4A2A","#8B6040","#704A28",
]
const FILLER = [
  "#a0a0a0","#8a8a8a","#b2b0aa","#787878","#c0b8ac",
  "#909898","#a8a098","#d0c8bc","#686868","#b8b0a8",
  "#989090","#c8c0b4","#707878","#a0989c","#888080",
]

function sr(n: number) { return ((n * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff }

function Orange({ cx, cy, r = 9 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <ellipse cx={cx+2} cy={cy+r*0.8} rx={r*0.72} ry={r*0.25} fill="rgba(0,0,0,0.18)" />
      <circle cx={cx} cy={cy} r={r} fill="#F56A00" />
      <circle cx={cx-r*0.28} cy={cy-r*0.28} r={r*0.36} fill="rgba(255,210,100,0.42)" />
      <circle cx={cx} cy={cy+r*0.6} r={r*0.13} fill="rgba(160,55,0,0.6)" />
      <path d={`M${cx} ${cy-r} C${cx-r*0.5} ${cy-r*1.6} ${cx-r*1.05} ${cy-r*1.38} ${cx-r*0.82} ${cy-r*1.04}`}
        stroke="#2d5c10" strokeWidth={1.4} fill="none"/>
      <ellipse cx={cx-r*0.5} cy={cy-r*1.4} rx={r*0.5} ry={r*0.25} fill="#3a7020" opacity={0.88}
        transform={`rotate(-28 ${cx-r*0.5} ${cy-r*1.4})`}/>
    </g>
  )
}

function Sprig({ cx, cy, s=1, f=1 }: { cx:number; cy:number; s?:number; f?:number }) {
  return (
    <g>
      <path d={`M${cx} ${cy} C${cx+22*f*s} ${cy-14*s} ${cx+40*f*s} ${cy-8*s} ${cx+34*f*s} ${cy+6*s}`}
        stroke="#4a7820" strokeWidth={1.6*s} fill="none"/>
      <ellipse cx={cx+20*f*s} cy={cy-8*s} rx={11*s} ry={5.5*s} fill="#5a9828" opacity={0.88}
        transform={`rotate(${-26*f} ${cx+20*f*s} ${cy-8*s})`}/>
      <ellipse cx={cx+32*f*s} cy={cy+3*s} rx={9*s} ry={4.5*s} fill="#4a8820" opacity={0.82}
        transform={`rotate(${18*f} ${cx+32*f*s} ${cy+3*s})`}/>
      <path d={`M${cx} ${cy} C${cx+12*f*s} ${cy-32*s} ${cx+28*f*s} ${cy-32*s} ${cx+22*f*s} ${cy-20*s}`}
        stroke="#4a7820" strokeWidth={1.2*s} fill="none"/>
      <ellipse cx={cx+16*f*s} cy={cy-28*s} rx={9*s} ry={4.5*s} fill="#6aac38" opacity={0.88}
        transform={`rotate(${-48*f} ${cx+16*f*s} ${cy-28*s})`}/>
    </g>
  )
}

function Plank({ x1, x2, y, dk }: { x1:number; x2:number; y:number; dk:boolean }) {
  const w = x2-x1
  return (
    <g>
      <rect x={x1} y={y+10} width={w} height={6} rx={2} fill="rgba(0,0,0,0.2)" />
      <rect x={x1} y={y} width={w} height={10} rx={2} fill={dk ? '#6a4820' : '#c8a060'}/>
      <rect x={x1} y={y} width={w} height={3} rx={1} fill={dk ? 'rgba(200,160,80,0.28)' : 'rgba(255,235,160,0.6)'}/>
      {[0.15,0.35,0.55,0.75].map(p => (
        <line key={p} x1={x1+w*p} y1={y} x2={x1+w*(p+0.004)} y2={y+10}
          stroke="rgba(100,60,0,0.13)" strokeWidth={1.2}/>
      ))}
    </g>
  )
}

function Book({ x, y, w, h, color, label, onClick, isNote }: {
  x:number; y:number; w:number; h:number; color:string; label:string
  onClick?:()=>void; isNote:boolean
}) {
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }} className={isNote ? 'shelf-book' : ''}>
      <rect x={x+2} y={y+3} width={w} height={h} rx={2} fill="rgba(0,0,0,0.22)"/>
      <rect x={x} y={y} width={w} height={h} rx={2} fill={color}/>
      <rect x={x+1.5} y={y+5} width={2} height={h-10} rx={1} fill="rgba(255,255,255,0.15)"/>
      <rect x={x} y={y} width={w} height={4} rx={1} fill="rgba(255,255,255,0.12)"/>
      <rect x={x} y={y+h-4} width={w} height={4} rx={1} fill="rgba(0,0,0,0.14)"/>
      {isNote && (
        <text x={x+w/2} y={y+h/2} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.75)" fontSize="6.5"
          fontFamily="Georgia, serif" fontWeight="600"
          transform={`rotate(-90, ${x+w/2}, ${y+h/2})`}
          style={{ userSelect:'none', pointerEvents:'none' }}>
          {label.substring(0,14)}
        </text>
      )}
    </g>
  )
}

export function ShelfView({ notes, onOpenNote, onCreateNote, theme }: ShelfViewProps) {
  const dk = theme === "dark"

  const shelves = [
    { y: 215, x1: 48,  x2: 375 },
    { y: 208, x1: 502, x2: 868 },
    { y: 396, x1: 238, x2: 612 },
    { y: 550, x1: 48,  x2: 378 },
    { y: 632, x1: 504, x2: 930 },
    { y: 742, x1: 474, x2: 930 },
  ]

  const shelfNotes = useMemo(() => {
    const dist: NoteData[][] = shelves.map(() => [])
    notes.forEach((note, i) => dist[i % shelves.length].push(note))
    return dist
  }, [notes]) // eslint-disable-line react-hooks/exhaustive-deps

  const t1 = dk ? '#281408' : '#38180a'
  const t2 = dk ? '#3c1e0c' : '#502410'
  const t3 = dk ? '#5a3018' : '#784030'
  const t4 = dk ? '#7a4828' : '#a05838'

  return (
    <div className="h-screen w-full overflow-hidden relative flex items-center justify-center"
      style={{ background: dk ? '#130e08' : '#eae3d8' }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: dk
          ? 'radial-gradient(ellipse at 65% 35%, rgba(100,45,8,0.10) 0%, transparent 60%)'
          : 'radial-gradient(ellipse at 65% 25%, rgba(240,200,120,0.22) 0%, transparent 65%)',
      }}/>

      <div className="relative" style={{ width: 1000, height: 775 }}>
        <svg viewBox="0 0 1000 775" width="1000" height="775"
          className="absolute inset-0" style={{ overflow:'visible' }}>
          <defs>
            <filter id="ts" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="6" dy="10" stdDeviation="12" floodColor="rgba(0,0,0,0.3)"/>
            </filter>
          </defs>

          {/* ROOTS */}
          <path d="M 838 775 C 798 754,752 746,718 762" stroke={t1} strokeWidth={30} strokeLinecap="round" fill="none"/>
          <path d="M 838 775 C 870 756,904 748,928 764" stroke={t1} strokeWidth={24} strokeLinecap="round" fill="none"/>
          <path d="M 838 775 C 816 760,792 755,780 768" stroke={t1} strokeWidth={17} strokeLinecap="round" fill="none"/>

          {/* TRUNK */}
          <path d="M 848 775 C 836 672,816 570,786 478 C 754 386,696 320,626 254 C 566 198,516 152,484 90 C 467 50,454 20,452 2"
            stroke="rgba(0,0,0,0.20)" strokeWidth={82} strokeLinecap="round" fill="none"/>
          <path d="M 838 775 C 826 672,806 570,776 478 C 744 386,686 320,616 254 C 556 198,506 152,474 90 C 457 50,445 20,443 2"
            stroke={t1} strokeWidth={78} strokeLinecap="round" fill="none" filter="url(#ts)"/>
          <path d="M 838 775 C 826 672,806 570,776 478 C 744 386,686 320,616 254 C 556 198,506 152,474 90 C 457 50,445 20,443 2"
            stroke={t2} strokeWidth={62} strokeLinecap="round" fill="none"/>
          <path d="M 838 775 C 826 672,806 570,776 478 C 744 386,686 320,616 254 C 556 198,506 152,474 90"
            stroke={t3} strokeWidth={38} strokeLinecap="round" fill="none" opacity={0.7}/>
          <path d="M 830 775 C 818 672,798 570,768 478 C 736 386,678 320,608 254 C 548 198,498 152,466 90"
            stroke={t4} strokeWidth={15} strokeLinecap="round" fill="none" opacity={0.55}/>
          <path d="M 826 775 C 814 672,794 570,764 478 C 732 386,674 320,604 254"
            stroke={t4} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.28}/>
          {/* Bark */}
          <path d="M 790 460 C 798 480,791 502,800 524" stroke={t1} strokeWidth={3} fill="none" opacity={0.55}/>
          <path d="M 748 370 C 756 390,749 410,758 430" stroke={t1} strokeWidth={2.5} fill="none" opacity={0.48}/>
          <path d="M 686 290 C 693 308,687 325,695 342" stroke={t1} strokeWidth={2} fill="none" opacity={0.42}/>
          <ellipse cx={808} cy={598} rx={18} ry={12} fill={t1} opacity={0.55}/>
          <ellipse cx={808} cy={598} rx={11} ry={7} fill={t2} opacity={0.45}/>

          {/* BRANCH 1: upper-left */}
          <path d="M 574 246 C 502 236,410 226,318 219 C 250 214,170 215,100 216 C 78 216,48 217,48 217"
            stroke={t1} strokeWidth={34} strokeLinecap="round" fill="none"/>
          <path d="M 574 246 C 502 236,410 226,318 219 C 250 214,170 215,100 216 C 78 216,48 217,48 217"
            stroke={t2} strokeWidth={22} strokeLinecap="round" fill="none"/>
          <path d="M 574 242 C 502 232,410 222,318 215"
            stroke={t4} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.4}/>

          {/* BRANCH 2: upper-right */}
          <path d="M 560 236 C 624 226,708 218,790 212 C 834 208,868 209,868 209"
            stroke={t1} strokeWidth={30} strokeLinecap="round" fill="none"/>
          <path d="M 560 236 C 624 226,708 218,790 212 C 834 208,868 209,868 209"
            stroke={t2} strokeWidth={20} strokeLinecap="round" fill="none"/>
          <path d="M 560 232 C 624 222,708 214,790 208"
            stroke={t4} strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={0.4}/>

          {/* BRANCH 3: middle */}
          <path d="M 634 412 C 568 406,468 400,376 402 C 328 403,280 403,240 404"
            stroke={t1} strokeWidth={28} strokeLinecap="round" fill="none"/>
          <path d="M 634 412 C 568 406,468 400,376 402 C 328 403,280 403,240 404"
            stroke={t2} strokeWidth={18} strokeLinecap="round" fill="none"/>

          {/* BRANCH 4: lower-left */}
          <path d="M 752 564 C 660 559,542 554,420 556 C 338 557,230 556,150 555 C 110 555,68 555,48 555"
            stroke={t1} strokeWidth={26} strokeLinecap="round" fill="none"/>
          <path d="M 752 564 C 660 559,542 554,420 556 C 338 557,230 556,150 555 C 110 555,68 555,48 555"
            stroke={t2} strokeWidth={16} strokeLinecap="round" fill="none"/>

          {/* BRANCHES 5+6: lower-right */}
          <path d="M 814 674 C 846 654,864 646,888 640 C 908 635,930 633,930 633"
            stroke={t1} strokeWidth={22} strokeLinecap="round" fill="none"/>
          <path d="M 814 674 C 742 654,642 644,562 641 C 532 640,504 638,504 638"
            stroke={t1} strokeWidth={20} strokeLinecap="round" fill="none"/>
          <path d="M 814 674 C 846 654,864 646,888 640 C 908 635,930 633,930 633"
            stroke={t2} strokeWidth={14} strokeLinecap="round" fill="none"/>
          <path d="M 814 674 C 742 654,642 644,562 641 C 532 640,504 638,504 638"
            stroke={t2} strokeWidth={12} strokeLinecap="round" fill="none"/>
          <path d="M 814 758 C 848 754,884 752,912 751 C 924 751,930 750,930 750"
            stroke={t1} strokeWidth={18} strokeLinecap="round" fill="none"/>
          <path d="M 814 758 C 762 754,682 750,602 749 C 550 748,506 748,474 747"
            stroke={t1} strokeWidth={17} strokeLinecap="round" fill="none"/>
          <path d="M 814 758 C 848 754,884 752,912 751"
            stroke={t2} strokeWidth={11} strokeLinecap="round" fill="none"/>
          <path d="M 814 758 C 762 754,682 750,602 749 C 550 748,506 748,474 747"
            stroke={t2} strokeWidth={10} strokeLinecap="round" fill="none"/>

          {/* PLANKS */}
          <Plank x1={48}  x2={375} y={215} dk={dk}/>
          <Plank x1={502} x2={868} y={208} dk={dk}/>
          <Plank x1={238} x2={614} y={396} dk={dk}/>
          <Plank x1={48}  x2={378} y={550} dk={dk}/>
          <Plank x1={504} x2={930} y={632} dk={dk}/>
          <Plank x1={474} x2={930} y={742} dk={dk}/>

          {/* CROWN TWIGS */}
          <path d="M 468 76 C 446 46,420 26,394 8" stroke={t1} strokeWidth={12} strokeLinecap="round" fill="none"/>
          <path d="M 468 76 C 490 42,518 20,546 6" stroke={t1} strokeWidth={11} strokeLinecap="round" fill="none"/>
          <path d="M 468 76 C 455 54,438 38,424 27" stroke={t1} strokeWidth={8} strokeLinecap="round" fill="none"/>
          <path d="M 468 76 C 482 56,506 40,520 31" stroke={t1} strokeWidth={8} strokeLinecap="round" fill="none"/>

          {/* ORANGES + SPRIGS — crown */}
          <Sprig cx={394} cy={8}  s={1.1} f={-1}/><Sprig cx={546} cy={6}  s={1.05} f={1}/>
          <Sprig cx={424} cy={27} s={0.9} f={-1}/><Sprig cx={520} cy={31} s={0.9} f={1}/>
          <Orange cx={380} cy={16} r={10.5}/><Orange cx={408} cy={5} r={9}/>
          <Orange cx={562} cy={12} r={10}/><Orange cx={538} cy={24} r={8}/>
          <Orange cx={466} cy={2} r={8.5}/><Orange cx={450} cy={38} r={6.5}/>

          {/* ORANGES — branch tips */}
          <Sprig cx={48} cy={208} s={0.92} f={-1}/><Orange cx={36} cy={199} r={9}/><Orange cx={58} cy={195} r={7}/>
          <Sprig cx={868} cy={200} s={0.92} f={1}/><Orange cx={882} cy={191} r={9}/><Orange cx={862} cy={187} r={7}/>
          <Sprig cx={240} cy={394} s={0.82} f={-1}/><Orange cx={228} cy={386} r={8}/><Orange cx={250} cy={382} r={6}/>
          <Sprig cx={48} cy={546} s={0.88} f={-1}/><Orange cx={36} cy={538} r={8.5}/><Orange cx={60} cy={534} r={6.5}/>
          <Sprig cx={930} cy={624} s={0.82} f={1}/><Orange cx={944} cy={616} r={7.5}/>

          {/* BOOKS */}
          {shelves.map((shelf, sIdx) => {
            const noteList = shelfNotes[sIdx]
            const BW=19, gap=2, pad=16
            const total = Math.floor((shelf.x2-shelf.x1-pad*2)/(BW+gap))
            const els: React.ReactElement[] = []
            for (let i=0; i<total; i++) {
              const note = noteList[i]
              const seed = sIdx*100+i
              const bH = note ? 78+Math.floor(sr(seed*3)*52) : 68+Math.floor(sr(seed*7)*48)
              const x = shelf.x1+pad+i*(BW+gap)
              const y = shelf.y-bH
              const color = note
                ? NOTE_COLORS[(sIdx*3+noteList.indexOf(note))%NOTE_COLORS.length]
                : FILLER[Math.floor(sr(seed*13)*FILLER.length)]
              els.push(
                <Book key={note ? note.id : `f-${sIdx}-${i}`}
                  x={x} y={y} w={BW} h={bH} color={color}
                  label={note ? (note.subject||(note as any).title||"Note") : ""}
                  onClick={note ? ()=>onOpenNote(note.id) : undefined}
                  isNote={!!note}/>
              )
            }
            return els
          })}
        </svg>

        {/* HEADER */}
        <div className="absolute top-7 left-9 pointer-events-none select-none">
          <h1 className="font-serif italic leading-none" style={{
            fontSize: 48, color: dk ? '#e8701a' : '#bf4908',
            textShadow: dk ? '0 2px 22px rgba(220,90,10,0.5)' : '0 1px 8px rgba(180,60,0,0.22)',
          }}>Pulp</h1>
          <p className="mt-1.5 text-[10px] tracking-[0.3em] uppercase font-medium" style={{
            color: dk ? '#9a5222' : '#b06228',
          }}>
            {notes.length} {notes.length===1?'note':'notes'}
          </p>
        </div>

        {/* NEW NOTE BUTTON */}
        <button onClick={onCreateNote}
          className="absolute bottom-7 left-9 flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-[10px] tracking-[0.18em] uppercase transition-all hover:scale-105 active:scale-95"
          style={{ background:'linear-gradient(135deg,#e0601a,#b83e0e)', boxShadow:`0 4px 20px rgba(200,70,10,${dk?'0.6':'0.45'})` }}>
          <Plus className="w-3.5 h-3.5"/>New Note
        </button>
      </div>

      <style>{`
        .shelf-book { transition: filter 0.15s ease; }
        .shelf-book:hover { filter: brightness(1.18) drop-shadow(0 -5px 8px rgba(0,0,0,0.3)); }
      `}</style>
    </div>
  )
}
