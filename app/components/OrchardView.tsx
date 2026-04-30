"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES, getLevel } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"
import { PulpIcon, GemIcon, LeafIcon } from '@/app/components/CurrencyIcons'
import type { NoteData } from "@/app/types"

interface OrchardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  juice: number
  gems: number
  xp: number
  grove: any[]
  inventory: string[]
  setJuice: (v: number | ((p: number) => number)) => void
  setGems: (v: number | ((p: number) => number)) => void
  setInventory: (v: string[] | ((p: string[]) => string[])) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
  notes: NoteData[]
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary']
const RARITY_META: Record<string, { label: string; color: string }> = {
  common: { label: 'Common', color: '#8a8a8f' },
  uncommon: { label: 'Uncommon', color: '#6b9a6b' },
  rare: { label: 'Rare', color: '#6888a8' },
  legendary: { label: 'Legendary', color: '#b89860' },
}

function seededRng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

function orchardPlacement(trees: any[]): { x: number; y: number; tree: any; col: number }[] {
  if (trees.length === 0) return []

  const results: { x: number; y: number; tree: any; col: number }[] = []
  const cols = Math.min(8, Math.max(3, Math.ceil(Math.sqrt(trees.length * 1.2))))
  const rows = Math.ceil(trees.length / cols)
  const colStart = 10
  const colEnd = 90
  const rowStart = 34
  const rowEnd = 93

  for (let i = 0; i < trees.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const colRows = Math.min(rows, Math.ceil((trees.length - col) / cols))
    const x = cols === 1 ? 50 : colStart + col * ((colEnd - colStart) / (cols - 1))
    const rowSpacing = colRows > 1 ? (rowEnd - rowStart) / (colRows - 1) : 0
    const y = colRows === 1 ? 60 : rowStart + row * rowSpacing
    const rng = seededRng(i * 317 + col * 53 + 991)
    const jx = (rng() - 0.5) * 3
    const jy = (rng() - 0.5) * 2
    results.push({ x: Math.max(6, Math.min(94, x + jx)), y: Math.max(32, Math.min(94, y + jy)), tree: trees[i], col })
  }

  return results.sort((a, b) => a.y - b.y)
}

function getRarityPlantClass(type: string): string {
  const rarity = TREE_TYPES[type]?.rarity
  switch (rarity) {
    case 'uncommon': return 'rarity-uncommon'
    case 'rare': return 'rarity-rare'
    case 'legendary': return 'rarity-premium'
    default: return ''
  }
}

const PLOT_COST = [0, 5, 12]

const Terrain = memo(function Terrain({ isDark, treeCount }: { isDark: boolean; treeCount: number }) {
  const sky = isDark
    ? 'linear-gradient(180deg, #0c1210 0%, #0e1812 15%, #121e14 30%, #162416 50%, #1a2c18 70%, #1e3018 100%)'
    : 'linear-gradient(180deg, #87CEEB 0%, #a8d8c8 15%, #b8dab0 30%, #a8c48c 50%, #90b470 70%, #7da860 100%)'
  const groundBase = isDark ? '#1a2c16' : '#7da860'
  const groundMid = isDark ? '#1e3218' : '#8ab86c'
  const groundDark = isDark ? '#142210' : '#6e9854'
  const groundLight = isDark ? '#223a1c' : '#96c474'
  const dirtColor = isDark ? '#2a2418' : '#8a7a5a'
  const dirtLight = isDark ? '#322c1e' : '#9a8a6a'

  const cols = Math.min(8, Math.max(3, Math.ceil(Math.sqrt(treeCount * 1.2))))
  const colStart = 10
  const colEnd = 90

  return (
    <>
      <div className="absolute inset-0" style={{ background: sky }} />

      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Distant hills */}
        <path d="M-5,28 Q8,22 18,25 Q28,20 38,23 Q48,18 58,22 Q68,17 78,21 Q88,18 98,24 L105,26 L105,100 L-5,100 Z" fill={isDark ? '#0e1a0c' : '#6a9a50'} opacity="0.5" />
        <path d="M-5,30 Q15,24 30,28 Q45,22 60,26 Q75,20 90,25 Q100,22 105,27 L105,100 L-5,100 Z" fill={groundBase} />

        {/* Gentle terrain variation */}
        <ellipse cx="25" cy="50" rx="22" ry="10" fill={groundLight} opacity="0.2" />
        <ellipse cx="70" cy="65" rx="25" ry="12" fill={groundMid} opacity="0.15" />
        <ellipse cx="50" cy="85" rx="30" ry="10" fill={groundLight} opacity="0.15" />
        <ellipse cx="85" cy="45" rx="14" ry="7" fill={groundDark} opacity="0.15" />
        <ellipse cx="15" cy="75" rx="16" ry="8" fill={groundDark} opacity="0.1" />

        {/* Tilled dirt columns */}
        {Array.from({ length: cols }).map((_, ci) => {
          const x = cols === 1 ? 50 : colStart + ci * ((colEnd - colStart) / (cols - 1))
          return (
            <g key={`till-${ci}`}>
              <rect x={x - 0.6} y="32" width={1.2} height="62" rx="0.5" fill={dirtColor} opacity={isDark ? 0.25 : 0.15} />
              <rect x={x - 0.2} y="33" width={0.4} height="60" rx="0.2" fill={dirtLight} opacity={isDark ? 0.12 : 0.08} />
            </g>
          )
        })}

        {/* Grass tufts */}
        {Array.from({ length: 40 }).map((_, i) => {
          const rng = seededRng(i * 53 + 101)
          const x = 3 + rng() * 94
          const y = 30 + rng() * 66
          const h = 0.4 + rng() * 0.7
          return (
            <g key={`g${i}`} opacity={isDark ? 0.18 : 0.12}>
              <line x1={`${x}`} y1={`${y}`} x2={`${x - 0.3}`} y2={`${y - h}`} stroke={isDark ? '#3a5a2e' : '#6a9a50'} strokeWidth="0.25" />
              <line x1={`${x}`} y1={`${y}`} x2={`${x + 0.2}`} y2={`${y - h * 0.8}`} stroke={isDark ? '#3a5a2e' : '#6a9a50'} strokeWidth="0.2" />
            </g>
          )
        })}

        {/* Fence posts along edges */}
        {[5, 20, 35, 50, 65, 80, 95].map(x => (
          <g key={`fence-${x}`} opacity={isDark ? 0.15 : 0.1}>
            <rect x={x - 0.3} y="28" width="0.6" height="3" fill={isDark ? '#3a3020' : '#7a6a4a'} />
          </g>
        ))}
        <line x1="5" y1="29" x2="95" y2="29" stroke={isDark ? '#3a3020' : '#7a6a4a'} strokeWidth="0.25" opacity={isDark ? 0.12 : 0.08} />

        {/* Dirt path along bottom */}
        <path d="M-2,97 Q25,94 50,96 Q75,94 102,97 L102,100 L-2,100 Z" fill={dirtColor} opacity="0.25" />
      </svg>

      {/* Soft vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: isDark
          ? 'inset 0 0 60px 15px rgba(8,12,8,0.4)'
          : 'inset 0 0 40px 10px rgba(80,100,60,0.12)',
      }} />
    </>
  )
})

const NOTE_TYPE_ICONS: Record<string, string> = {
  notebook: '📓',
  singlepage: '📄',
  flashcard: '🃏',
  vault: '🔒',
  cornell: '📋',
}

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme,
  juice, gems, xp, grove, notes, setGems,
}: OrchardViewProps) {

  const activeNotesForDefault = useMemo(() => notes.filter(n => !n.archived && !n.deletedAt), [notes])
  const [selectedNotebook, setSelectedNotebook] = useState<string>(activeNotesForDefault.length > 0 ? activeNotesForDefault[0].id : '_unassigned')
  const [plotPage, setPlotPage] = useState(0)
  const [renderTrees, setRenderTrees] = useState(false)

  useEffect(() => {
    setPlotPage(0)
  }, [selectedNotebook])
  
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setRenderTrees(true), 150)
      return () => clearTimeout(timer)
    } else {
      setRenderTrees(false)
    }
  }, [isOpen])

  const lvl = getLevel(xp)
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose, isOpen])

  const activeNotes = useMemo(() => notes.filter(n => !n.archived && !n.deletedAt), [notes])

  const notebookTreeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    grove.filter(Boolean).forEach(t => {
      const nid = t.notebookId || '_unassigned'
      counts[nid] = (counts[nid] || 0) + 1
    })
    return counts
  }, [grove])

  const filteredTrees = useMemo(() => {
    const all = grove.filter(t => t !== null)
    if (selectedNotebook === '_unassigned') return all.filter(t => !t.notebookId)
    return all.filter(t => t.notebookId === selectedNotebook)
  }, [grove, selectedNotebook])

  const TREES_PER_PLOT = 40
  const MAX_PLOTS = 3

  const [unlockedPlots, setUnlockedPlots] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('pulp-unlocked-plots') || '{}') } catch { return {} }
  })

  const nbUnlocked = unlockedPlots[selectedNotebook] || 1
  const totalPlots = Math.min(MAX_PLOTS, Math.max(1, Math.ceil(filteredTrees.length / TREES_PER_PLOT)))
  const accessiblePlots = Math.min(totalPlots, nbUnlocked)

  const unlockNextPlot = () => {
    const nextPlot = nbUnlocked + 1
    if (nextPlot > MAX_PLOTS) return
    const cost = PLOT_COST[nextPlot - 1] || 0
    if (gems < cost) return
    setGems((g: number) => g - cost)
    const updated = { ...unlockedPlots, [selectedNotebook]: nextPlot }
    setUnlockedPlots(updated)
    localStorage.setItem('pulp-unlocked-plots', JSON.stringify(updated))
    setPlotPage(nextPlot - 1)
  }

  const currentPlotTrees = useMemo(() => {
    const start = plotPage * TREES_PER_PLOT
    return filteredTrees.slice(start, start + TREES_PER_PLOT)
  }, [filteredTrees, plotPage])

  const placed = useMemo(() => orchardPlacement(currentPlotTrees), [currentPlotTrees])

  const rarityCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredTrees.forEach(t => {
      const r = TREE_TYPES[t.type]?.rarity || 'common'
      counts[r] = (counts[r] || 0) + 1
    })
    return counts
  }, [filteredTrees])

  const archivedNotes = useMemo(() => notes.filter(n => n.archived && !n.deletedAt), [notes])

  if (!isOpen) return null

  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  const textPrimary = isDark ? '#d4d0c8' : '#3a3630'
  const textSecondary = isDark ? '#6b6860' : '#9a9590'
  const textMuted = isDark ? '#4a4840' : '#b8b4ae'

  const baseSize = filteredTrees.length <= 6 ? 78 :
    filteredTrees.length <= 15 ? 70 :
    filteredTrees.length <= 30 ? 62 : 54

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
      onWheel={(e) => { if (e.ctrlKey || e.metaKey) e.preventDefault() }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onWheel={(e) => { if (e.ctrlKey || e.metaKey) e.preventDefault() }}
        className="relative flex overflow-hidden"
        style={{
          width: "96vw", maxWidth: 1060, height: "92vh", maxHeight: 780,
          borderRadius: 18,
          boxShadow: isDark ? "0 30px 100px -20px rgba(0,0,0,0.8)" : "0 30px 100px -20px rgba(0,0,0,0.2)",
          border: `1px solid ${cardBorder}`,
        }}
      >
        {/* Notebook Sidebar */}
        <div className={`w-[200px] ${isDark ? "bg-[#060608] border-zinc-800/80" : "bg-[#ece8e5] border-zinc-200/70"} border-r flex flex-col shrink-0 z-30`}>
          {/* Sidebar header */}
          <div className="px-5 pt-6 pb-4">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-zinc-400"}`} style={{ fontFamily: 'var(--font-italiana)' }}>Orchard</p>
          </div>

          {/* Notebook list */}
          <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
            <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Notebooks</p>

            {activeNotes.map(note => {
              const count = notebookTreeCounts[note.id] || 0
              const isSelected = selectedNotebook === note.id
              const icon = note.icon || NOTE_TYPE_ICONS[note.noteType || 'notebook'] || '📓'

              return (
                <button
                  key={note.id}
                  onClick={() => setSelectedNotebook(note.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                      : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                  }`}
                >
                  <span className="text-[13px] shrink-0">{icon}</span>
                  <span className="flex-1 min-w-0 truncate">{note.subject || 'Untitled'}</span>
                  {count > 0 && (
                    <span className={`text-[9px] font-bold tabular-nums shrink-0 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{count}</span>
                  )}
                </button>
              )
            })}

            {/* Archived notebooks */}
            {archivedNotes.length > 0 && archivedNotes.some(n => (notebookTreeCounts[n.id] || 0) > 0) && (
              <>
                <div className={`${isDark ? "border-t border-zinc-800" : "border-t border-zinc-300/40"} pt-3 mt-3`}>
                  <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Archived</p>
                </div>
                {archivedNotes.filter(n => (notebookTreeCounts[n.id] || 0) > 0).map(note => {
                  const count = notebookTreeCounts[note.id] || 0
                  const isSelected = selectedNotebook === note.id
                  const icon = note.icon || NOTE_TYPE_ICONS[note.noteType || 'notebook'] || '📓'
                  return (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNotebook(note.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                          : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                      }`}
                      style={{ opacity: isSelected ? 1 : 0.7 }}
                    >
                      <span className="text-[13px] shrink-0">{icon}</span>
                      <span className="flex-1 min-w-0 truncate">{note.subject || 'Untitled'}</span>
                      {count > 0 && (
                        <span className={`text-[9px] font-bold tabular-nums shrink-0 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{count}</span>
                      )}
                    </button>
                  )
                })}
              </>
            )}

            {/* Unassigned trees */}
            {(notebookTreeCounts['_unassigned'] || 0) > 0 && (
              <>
                <div className={`${isDark ? "border-t border-zinc-800" : "border-t border-zinc-300/40"} pt-3 mt-3`}>
                  <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Other</p>
                </div>
                <button
                  onClick={() => setSelectedNotebook('_unassigned')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2.5 ${
                    selectedNotebook === '_unassigned'
                      ? isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                      : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                  }`}
                >
                  <span className="shrink-0 opacity-50"><LeafIcon size={13} /></span>
                  <span className="flex-1 min-w-0 truncate">Unassigned</span>
                  <span className={`text-[9px] font-bold tabular-nums shrink-0 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{notebookTreeCounts['_unassigned']}</span>
                </button>
              </>
            )}
          </nav>

          {/* Sidebar footer — stats */}
          <div className={`px-5 py-4 border-t ${isDark ? "border-zinc-800" : "border-zinc-200/60"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Level {lvl.level}</span>
              <span className={`text-[10px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{lvl.name}</span>
            </div>
            <div className="h-[2px] rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#d97706' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, lvl.progress * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <PulpIcon size={9} />
                <span className={`text-[9px] font-bold tabular-nums ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{juice}</span>
              </div>
              <div className="flex items-center gap-1">
                <GemIcon size={9} />
                <span className={`text-[9px] font-bold tabular-nums ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{gems}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main orchard area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Terrain isDark={isDark} treeCount={currentPlotTrees.length} />

          {/* Thin top bar */}
          <div className="relative z-20 flex items-center justify-between px-5 py-2 shrink-0" style={{
            background: isDark ? 'rgba(14,22,12,0.8)' : 'rgba(120,160,90,0.7)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${cardBorder}`,
          }}>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold" style={{ color: textPrimary }}>
                {selectedNotebook === '_unassigned' ? 'Unassigned' :
                 [...activeNotes, ...notes.filter(n => n.archived)].find(n => n.id === selectedNotebook)?.subject || 'Untitled'}
              </span>
              <span className="text-[10px] font-medium tabular-nums" style={{ color: textMuted }}>
                {filteredTrees.length} {filteredTrees.length === 1 ? 'tree' : 'trees'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {(filteredTrees.length > TREES_PER_PLOT || nbUnlocked > 1) && (
                <div className="flex items-center gap-2 mr-4 rounded-lg px-2 py-1" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }}>
                  <button onClick={() => setPlotPage(p => Math.max(0, p - 1))} disabled={plotPage === 0} className="p-0.5 disabled:opacity-30 hover:opacity-100 opacity-70 transition-opacity" style={{ color: textPrimary }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="text-[10px] tabular-nums font-bold uppercase tracking-widest" style={{ color: textSecondary }}>
                    Plot {plotPage + 1} <span className="opacity-50">/ {nbUnlocked}</span>
                  </span>
                  {plotPage + 1 < nbUnlocked ? (
                    <button onClick={() => setPlotPage(p => Math.min(nbUnlocked - 1, p + 1))} className="p-0.5 hover:opacity-100 opacity-70 transition-opacity" style={{ color: textPrimary }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  ) : nbUnlocked < MAX_PLOTS ? (
                    <button
                      onClick={unlockNextPlot}
                      disabled={gems < (PLOT_COST[nbUnlocked] || 0)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                      style={{ color: '#d97706', backgroundColor: isDark ? 'rgba(217,119,6,0.1)' : 'rgba(217,119,6,0.08)' }}
                      title={`Unlock plot ${nbUnlocked + 1} for ${PLOT_COST[nbUnlocked]} gems`}
                    >
                      <GemIcon size={9} /> {PLOT_COST[nbUnlocked]}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </button>
                  ) : (
                    <span className="p-0.5 opacity-30" style={{ color: textPrimary }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </span>
                  )}
                </div>
              )}
              {RARITY_ORDER.filter(r => rarityCounts[r] && r !== 'common').map(r => (
                <span key={r} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RARITY_META[r].color }} />
                  <span className="text-[9px] tabular-nums" style={{ color: RARITY_META[r].color }}>{rarityCounts[r]}</span>
                </span>
              ))}
              <button onClick={onClose} className="ml-2 p-1.5 rounded-full transition-colors" style={{ color: textMuted }} onMouseEnter={e => e.currentTarget.style.color = textPrimary} onMouseLeave={e => e.currentTarget.style.color = textMuted}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Orchard scene */}
          <div className="flex-1 relative overflow-hidden" style={{
            perspective: '800px',
          }}>
            <div className="absolute inset-0" style={{
              transform: 'rotateX(8deg)',
              transformOrigin: 'center 40%',
            }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedNotebook ?? 'all'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                {!renderTrees ? (
                  <div className="h-full flex items-center justify-center relative z-10">
                    <span className="animate-pulse"><LeafIcon size={32} /></span>
                  </div>
                ) : filteredTrees.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 relative z-10">
                    <span className="text-[32px]">🌱</span>
                    <p className="text-[12px]" style={{ color: textMuted }}>
                      {selectedNotebook === null ? 'Your orchard is empty.' :
                       selectedNotebook === '_unassigned' ? 'No unassigned trees.' :
                       'No trees grown for this notebook yet.'}
                    </p>
                    <p className="text-[10px]" style={{ color: textMuted }}>
                      Complete focus sessions with a seed selected to grow your collection.
                    </p>
                  </div>
                ) : (
                  <>
                    {placed.map(({ x, y, tree }, renderIdx) => {
                      const typeInfo = TREE_TYPES[tree.type]
                      const rarity = typeInfo?.rarity || 'common'
                      const meta = RARITY_META[rarity] || RARITY_META.common
                      const depthScale = 0.6 + (y / 100) * 0.45
                      const treeSize = Math.round(baseSize * depthScale)
                      const depthT = Math.max(0, Math.min(1, (y - 30) / 65))
                      const scaleY = 0.78 + depthT * 0.22
                      const skewX = ((x - 50) / 50) * (1 - depthT) * -2

                      return (
                        <div
                          key={`${tree.id ?? 'tree'}-${renderIdx}`}
                          className="absolute flex flex-col items-center group"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: `translate(-50%, -85%) scaleY(${scaleY.toFixed(3)}) skewX(${skewX.toFixed(1)}deg)`,
                            transformOrigin: 'center bottom',
                            zIndex: Math.round(y),
                          }}
                        >
                          <div className={tree.stage >= 3 ? getRarityPlantClass(tree.type) : ''}>
                            <PlantIcon type={tree.type} size={treeSize} stage={tree.stage} hideGround />
                          </div>

                          <div className="mt-0.5 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ zIndex: 300 }}>
                            <div className="px-2.5 py-1.5 rounded-lg" style={{
                              backgroundColor: isDark ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.94)',
                              backdropFilter: 'blur(10px)',
                              border: `1px solid ${cardBorder}`,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}>
                              <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap block" style={{ color: textPrimary }}>
                                {typeInfo?.name || tree.type}
                              </span>
                              <span className="text-[8px] font-semibold uppercase tracking-widest whitespace-nowrap block mt-0.5" style={{ color: meta.color }}>
                                {meta.label}
                              </span>
                              {tree.stage < 4 && (
                                <div className="w-full h-[2px] rounded-full mt-1 overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, tree.progress)}%`, background: '#8ba870' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
