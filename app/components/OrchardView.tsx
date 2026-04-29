"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES, getLevel } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"
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

// Road segments (polylines in viewBox 0–100 coords)
const ROAD_MAIN = [[-2,100],[6,92],[14,84],[22,76],[30,70],[40,65],[50,62],[60,60],[70,58],[80,54],[90,48],[102,42]]

// Lake: ellipse at bottom-right
const LAKE_CX = 78, LAKE_CY = 80, LAKE_RX = 14, LAKE_RY = 7

function distToPolyline(x: number, y: number, pts: number[][]): number {
  let minD = Infinity
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1]
    const dx = bx - ax, dy = by - ay
    const len2 = dx * dx + dy * dy
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2))
    const d = Math.hypot(x - (ax + t * dx), y - (ay + t * dy))
    if (d < minD) minD = d
  }
  return minD
}

function inLake(x: number, y: number): boolean {
  return ((x - LAKE_CX) / (LAKE_RX + 3)) ** 2 + ((y - LAKE_CY) / (LAKE_RY + 3)) ** 2 < 1
}

function isPlantable(x: number, y: number): boolean {
  if (y < 30) return false
  if (y > 96) return false
  if (x < 3 || x > 97) return false
  if (distToPolyline(x, y, ROAD_MAIN) < 8) return false
  if (inLake(x, y)) return false
  return true
}

function forestPlacement(trees: any[]): { x: number; y: number; tree: any }[] {
  if (trees.length === 0) return []

  const results: { x: number; y: number; tree: any }[] = []

  const clusterSeeds = [
    { cx: 18, cy: 50, r: 16 },
    { cx: 14, cy: 72, r: 14 },
    { cx: 38, cy: 80, r: 16 },
    { cx: 60, cy: 82, r: 12 },
    { cx: 82, cy: 66, r: 12 },
    { cx: 70, cy: 42, r: 14 },
    { cx: 28, cy: 42, r: 12 },
    { cx: 50, cy: 55, r: 10 },
    { cx: 8, cy: 90, r: 10 },
    { cx: 92, cy: 88, r: 8 },
  ]

  // Group trees by date so same-day trees cluster together
  const sorted = [...trees].sort((a, b) => (a.plantedAt || 0) - (b.plantedAt || 0))
  const dayMs = 24 * 60 * 60 * 1000
  const groups: any[][] = []
  let currentGroup: any[] = []
  let currentDay = -1
  for (const tree of sorted) {
    const day = Math.floor((tree.plantedAt || 0) / dayMs)
    if (day !== currentDay && currentGroup.length > 0) {
      groups.push(currentGroup)
      currentGroup = []
    }
    currentDay = day
    currentGroup.push(tree)
  }
  if (currentGroup.length > 0) groups.push(currentGroup)

  // Assign each date-group a preferred cluster
  const minSpacing = trees.length > 40 ? 4.5 : trees.length > 20 ? 5.5 : 6.5
  const usedClusters = new Set<number>()

  for (let gi = 0; gi < groups.length; gi++) {
    // Pick a cluster for this date group — prefer unused ones
    const groupRng = seededRng(gi * 7919 + 1301)
    let bestCi = Math.floor(groupRng() * clusterSeeds.length)
    for (let t = 0; t < clusterSeeds.length; t++) {
      const ci = (bestCi + t) % clusterSeeds.length
      if (!usedClusters.has(ci)) { bestCi = ci; break }
    }
    usedClusters.add(bestCi)
    const primaryCluster = clusterSeeds[bestCi]

    for (let i = 0; i < groups[gi].length; i++) {
      let placed = false
      for (let attempt = 0; attempt < 60; attempt++) {
        const rng = seededRng(gi * 311 + i * 173 + attempt * 59 + 4729)
        // First 40 attempts try the assigned cluster, rest overflow to any
        const cluster = attempt < 40 ? primaryCluster : clusterSeeds[Math.floor(rng() * clusterSeeds.length)]

        const a = rng() * Math.PI * 2
        const dist = cluster.r * Math.sqrt(rng()) * (0.4 + rng() * 0.6)
        const x = cluster.cx + Math.cos(a) * dist
        const y = cluster.cy + Math.sin(a) * dist * 0.6

        const cx = Math.max(4, Math.min(96, x))
        const cy = Math.max(32, Math.min(95, y))

        if (!isPlantable(cx, cy)) continue
        const tooClose = results.some(r => Math.hypot(r.x - cx, r.y - cy) < minSpacing)
        if (tooClose) continue

        results.push({ x: cx, y: cy, tree: groups[gi][i] })
        placed = true
        break
      }

      if (!placed) {
        const rng = seededRng(gi * 997 + i * 331 + 7331)
        const x = 5 + rng() * 90
        const y = 34 + rng() * 58
        results.push({ x, y, tree: groups[gi][i] })
      }
    }
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

const Terrain = memo(function Terrain({ isDark }: { isDark: boolean }) {
  const sky1 = isDark ? '#0a0e14' : '#b8cce0'
  const sky2 = isDark ? '#0c1018' : '#c8daea'
  const skyHorizon = isDark ? '#101814' : '#d4e0d0'
  const ground = isDark ? '#141a12' : '#b8c4a0'
  const groundLight = isDark ? '#1a2216' : '#c4d0ac'
  const groundDark = isDark ? '#10140e' : '#a8b490'
  const mtnFar = isDark ? '#0c120e' : '#8a9a80'
  const mtnMid = isDark ? '#0e160f' : '#98aa8c'
  const mtnNear = isDark ? '#101a10' : '#a8b898'
  const mtnSnow = isDark ? '#2a3028' : '#e4e8dc'
  const roadBase = isDark ? '#1a1814' : '#a09888'
  const roadCenter = isDark ? '#22201a' : '#b0a898'
  const roadEdgeLine = isDark ? '#141210' : '#908878'
  const lakeDeep = isDark ? '#081018' : '#6898b8'
  const lakeMid = isDark ? '#0c1820' : '#80aac8'
  const lakeShallow = isDark ? '#102028' : '#98c0d8'
  const lakeShore = isDark ? '#182418' : '#8aa880'
  const grass = isDark ? '#2a3a22' : '#90a478'

  return (
    <>
      {/* Sky */}
      <div className="absolute inset-0" style={{
        background: isDark
          ? `linear-gradient(180deg, ${sky1} 0%, ${sky2} 12%, ${skyHorizon} 24%, ${ground} 34%)`
          : `linear-gradient(180deg, ${sky1} 0%, ${sky2} 12%, ${skyHorizon} 24%, ${ground} 34%)`,
      }} />

      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lakeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lakeShallow} />
            <stop offset="40%" stopColor={lakeMid} />
            <stop offset="100%" stopColor={lakeDeep} />
          </linearGradient>
          <linearGradient id="lakeReflect" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#141e14' : '#a0b890'} stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="roadSurface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={roadCenter} />
            <stop offset="50%" stopColor={roadBase} />
            <stop offset="100%" stopColor={roadCenter} />
          </linearGradient>
        </defs>

        {/* ── Mountain range ── */}
        {/* Far peaks */}
        <path d="M-5,24 L6,12 L14,18 L22,7 L30,15 L38,5 L46,14 L52,9 L60,15 L68,6 L76,12 L82,8 L90,14 L96,10 L105,19 L105,28 L-5,28 Z" fill={mtnFar} />
        {/* Snow caps */}
        <path d="M22,7 L24.5,11 L19.5,11 Z" fill={mtnSnow} opacity="0.5" />
        <path d="M38,5 L41,10 L35,10 Z" fill={mtnSnow} opacity="0.6" />
        <path d="M68,6 L70.5,10 L65.5,10 Z" fill={mtnSnow} opacity="0.45" />
        {/* Mid range */}
        <path d="M-5,28 L10,21 L20,25 L32,18 L42,23 L52,19 L64,24 L74,20 L86,25 L95,21 L105,27 L105,34 L-5,34 Z" fill={mtnMid} />
        {/* Near foothills */}
        <path d="M-5,33 Q8,28 18,31 Q28,26 38,30 Q50,25 62,29 Q74,26 86,30 Q96,27 105,31 L105,38 L-5,38 Z" fill={mtnNear} />

        {/* Ground */}
        <rect x="-5" y="36" width="110" height="68" fill={ground} />

        {/* Meadow patches */}
        <ellipse cx="22" cy="54" rx="18" ry="6" fill={groundLight} opacity="0.55" />
        <ellipse cx="68" cy="66" rx="14" ry="5" fill={groundLight} opacity="0.5" />
        <ellipse cx="40" cy="84" rx="20" ry="5" fill={groundLight} opacity="0.4" />
        <ellipse cx="85" cy="44" rx="10" ry="4" fill={groundDark} opacity="0.3" />

        {/* ── Main road — polished with edges and center line ── */}
        {/* Road bed (wide, dark edge) */}
        <path
          d="M -2,100 C 6,92 14,84 22,76 C 30,70 40,65 50,62 C 60,60 70,58 80,54 C 90,48 98,44 102,42"
          stroke={roadEdgeLine}
          strokeWidth="4"
          fill="none"
          opacity={isDark ? 0.7 : 0.6}
          strokeLinecap="round"
        />
        {/* Road surface */}
        <path
          d="M -2,100 C 6,92 14,84 22,76 C 30,70 40,65 50,62 C 60,60 70,58 80,54 C 90,48 98,44 102,42"
          stroke="url(#roadSurface)"
          strokeWidth="2.8"
          fill="none"
          opacity={isDark ? 0.85 : 0.75}
          strokeLinecap="round"
        />
        {/* Center dashes */}
        <path
          d="M -2,100 C 6,92 14,84 22,76 C 30,70 40,65 50,62 C 60,60 70,58 80,54 C 90,48 98,44 102,42"
          stroke={isDark ? '#2a2820' : '#c8c0b0'}
          strokeWidth="0.35"
          fill="none"
          opacity={isDark ? 0.5 : 0.45}
          strokeDasharray="1.5 3"
          strokeLinecap="round"
        />


        {/* ── Lake ── */}
        {/* Shore ring */}
        <ellipse cx={LAKE_CX} cy={LAKE_CY} rx={LAKE_RX + 1.5} ry={LAKE_RY + 1.2} fill={lakeShore} opacity="0.5" />
        {/* Water body */}
        <ellipse cx={LAKE_CX} cy={LAKE_CY} rx={LAKE_RX} ry={LAKE_RY} fill="url(#lakeGrad)" />
        {/* Reflection of green */}
        <ellipse cx={LAKE_CX} cy={LAKE_CY - 1} rx={LAKE_RX - 2} ry={LAKE_RY - 2} fill="url(#lakeReflect)" />
        {/* Highlight */}
        <ellipse cx={LAKE_CX - 3} cy={LAKE_CY - 2} rx="5" ry="1.5"
          fill={isDark ? '#18243a' : '#c8dce8'} opacity="0.2" />
        {/* Ripples */}
        <ellipse cx={LAKE_CX + 2} cy={LAKE_CY} rx="3.5" ry="0.8" fill="none"
          stroke={isDark ? '#182838' : '#a8c8d8'} strokeWidth="0.2" opacity="0.2" />

        {/* ── Grass tufts ── */}
        {Array.from({ length: 20 }).map((_, i) => {
          const rng = seededRng(i * 53 + 101)
          const x = 4 + rng() * 92
          const y = 36 + rng() * 58
          if (inLake(x, y)) return null
          if (distToPolyline(x, y, ROAD_MAIN) < 3) return null
          const h = 0.4 + rng() * 0.6
          return (
            <g key={`g${i}`} opacity={isDark ? 0.18 + rng() * 0.08 : 0.12 + rng() * 0.06}>
              <line x1={`${x}`} y1={`${y}`} x2={`${x - 0.15}`} y2={`${y - h}`} stroke={grass} strokeWidth="0.3" />
              <line x1={`${x}`} y1={`${y}`} x2={`${x + 0.12}`} y2={`${y - h * 0.8}`} stroke={grass} strokeWidth="0.25" />
            </g>
          )
        })}
      </svg>

      {/* Atmospheric haze over mountains */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
        height: '30%',
        background: isDark
          ? 'linear-gradient(180deg, rgba(10,14,20,0.4) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(184,204,224,0.3) 0%, transparent 100%)',
      }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: isDark
          ? 'inset 0 0 80px 20px rgba(10,14,10,0.5)'
          : 'inset 0 0 60px 15px rgba(160,170,150,0.2)',
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
  juice, gems, xp, grove, notes,
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

  const TREES_PER_PLOT = 120
  const totalPlots = Math.max(1, Math.ceil(filteredTrees.length / TREES_PER_PLOT))
  
  const currentPlotTrees = useMemo(() => {
    const start = plotPage * TREES_PER_PLOT
    return filteredTrees.slice(start, start + TREES_PER_PLOT)
  }, [filteredTrees, plotPage])

  const placed = useMemo(() => forestPlacement(currentPlotTrees), [currentPlotTrees])

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
            <p className={`text-[9.5px] font-bold uppercase tracking-widest px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Notebooks</p>

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
                  <p className={`text-[9.5px] font-bold uppercase tracking-widest px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Archived</p>
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
                  <p className={`text-[9.5px] font-bold uppercase tracking-widest px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Other</p>
                </div>
                <button
                  onClick={() => setSelectedNotebook('_unassigned')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2.5 ${
                    selectedNotebook === '_unassigned'
                      ? isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                      : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                  }`}
                >
                  <span className="text-[13px] shrink-0 opacity-50">🌿</span>
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
                style={{ background: '#ea580c' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, lvl.progress * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <span className="text-[9px]">🧃</span>
                <span className={`text-[9px] font-bold tabular-nums ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{juice}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px]">💎</span>
                <span className={`text-[9px] font-bold tabular-nums ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{gems}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main orchard area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Terrain isDark={isDark} />

          {/* Thin top bar */}
          <div className="relative z-20 flex items-center justify-between px-5 py-2 shrink-0" style={{
            background: isDark ? 'rgba(14,18,12,0.7)' : 'rgba(200,196,180,0.7)',
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
              {totalPlots > 1 && (
                <div className="flex items-center gap-2 mr-4 rounded-lg px-2 py-1" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }}>
                  <button onClick={() => setPlotPage(p => Math.max(0, p - 1))} disabled={plotPage === 0} className="p-0.5 disabled:opacity-30 hover:opacity-100 opacity-70 transition-opacity" style={{ color: textPrimary }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="text-[10px] tabular-nums font-bold uppercase tracking-widest" style={{ color: textSecondary }}>
                    Plot {plotPage + 1} <span className="opacity-50">/ {totalPlots}</span>
                  </span>
                  <button onClick={() => setPlotPage(p => Math.min(totalPlots - 1, p + 1))} disabled={plotPage === totalPlots - 1} className="p-0.5 disabled:opacity-30 hover:opacity-100 opacity-70 transition-opacity" style={{ color: textPrimary }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
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
                    <span className="text-[32px] animate-pulse">🌿</span>
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
                      const depthScale = 0.55 + (y / 100) * 0.5
                      const treeSize = Math.round(baseSize * depthScale)

                      // Atmospheric perspective: depth 0 = far (y~30), depth 1 = near (y~95)
                      const depthNorm = Math.max(0, Math.min(1, (y - 30) / 65))
                      const fogOpacity = 0.5 + depthNorm * 0.5
                      const blurPx = (1 - depthNorm) * 0.4
                      const saturate = 0.6 + depthNorm * 0.4
                      const brightness = 1 + (1 - depthNorm) * 0.12

                      return (
                        <div
                          key={`${tree.id ?? 'tree'}-${renderIdx}`}
                          className="absolute flex flex-col items-center group"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -85%)',
                            zIndex: Math.round(y),
                            opacity: fogOpacity,
                            filter: `blur(${blurPx}px) saturate(${saturate}) brightness(${brightness})`,
                          }}
                        >
                          <div className={tree.stage >= 3 ? getRarityPlantClass(tree.type) : ''}>
                            <PlantIcon type={tree.type} size={treeSize} stage={tree.stage} />
                          </div>

                          <div className="rounded-full -mt-1" style={{
                            width: Math.round(treeSize * 0.45),
                            height: Math.max(2, Math.round(treeSize * 0.08)),
                            backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.08)',
                            filter: 'blur(2px)',
                          }} />

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
