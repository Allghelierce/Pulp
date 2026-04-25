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
  sunshine: number
  gems: number
  xp: number
  grove: any[]
  inventory: string[]
  setSunshine: (v: number | ((p: number) => number)) => void
  setGems: (v: number | ((p: number) => number)) => void
  setInventory: (v: string[] | ((p: string[]) => string[])) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
  notes: NoteData[]
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'true rare', 'premium', 'extinct', 'chroma']
const RARITY_META: Record<string, { label: string; color: string }> = {
  common: { label: 'Common', color: '#8a8a8f' },
  uncommon: { label: 'Uncommon', color: '#6b9a6b' },
  rare: { label: 'Rare', color: '#6888a8' },
  'true rare': { label: 'True Rare', color: '#8b7aaa' },
  premium: { label: 'Premium', color: '#b89860' },
  chroma: { label: 'Chroma', color: '#a8708a' },
  extinct: { label: 'Extinct', color: '#7a6a9a' },
}

function seededRng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

// Road segments (polylines in viewBox 0–100 coords)
const ROAD_MAIN = [[-2,100],[6,92],[14,84],[22,76],[30,70],[40,65],[50,62],[60,60],[70,58],[80,54],[90,48],[102,42]]
const ROAD_BRANCH = [[50,62],[48,54],[44,46],[38,38],[34,32]]

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
  if (distToPolyline(x, y, ROAD_MAIN) < 4.5) return false
  if (distToPolyline(x, y, ROAD_BRANCH) < 4) return false
  if (inLake(x, y)) return false
  return true
}

function forestPlacement(trees: any[]): { x: number; y: number; tree: any }[] {
  if (trees.length === 0) return []

  const results: { x: number; y: number; tree: any }[] = []

  // Organic cluster seeds — groups of trees form around these anchor points
  const clusterSeeds = [
    { cx: 18, cy: 50, r: 16 },  // left meadow
    { cx: 14, cy: 72, r: 14 },  // bottom-left
    { cx: 38, cy: 80, r: 16 },  // bottom-center-left
    { cx: 60, cy: 82, r: 12 },  // bottom-center-right (avoid lake)
    { cx: 82, cy: 66, r: 12 },  // right side
    { cx: 70, cy: 42, r: 14 },  // upper-right
    { cx: 28, cy: 42, r: 12 },  // upper-left
    { cx: 50, cy: 50, r: 10 },  // center (between roads)
    { cx: 8, cy: 90, r: 10 },   // far bottom-left
    { cx: 92, cy: 88, r: 8 },   // far bottom-right
  ]

  const minSpacing = trees.length > 40 ? 4.5 : trees.length > 20 ? 5.5 : 6.5

  for (let i = 0; i < trees.length; i++) {
    let placed = false

    for (let attempt = 0; attempt < 50; attempt++) {
      const rng = seededRng(i * 311 + attempt * 173 + 4729)
      // Pick a cluster weighted by how full it is, with randomness
      const ci = Math.floor(rng() * clusterSeeds.length)
      const cluster = clusterSeeds[ci]

      // Random point within cluster radius with bias toward center
      const a = rng() * Math.PI * 2
      const dist = cluster.r * Math.sqrt(rng()) * (0.4 + rng() * 0.6)
      const x = cluster.cx + Math.cos(a) * dist
      const y = cluster.cy + Math.sin(a) * dist * 0.6 // squash for perspective

      const cx = Math.max(4, Math.min(96, x))
      const cy = Math.max(32, Math.min(95, y))

      if (!isPlantable(cx, cy)) continue

      const tooClose = results.some(r => Math.hypot(r.x - cx, r.y - cy) < minSpacing)
      if (tooClose) continue

      results.push({ x: cx, y: cy, tree: trees[i] })
      placed = true
      break
    }

    if (!placed) {
      const rng = seededRng(i * 997 + 7331)
      const x = 5 + rng() * 90
      const y = 34 + rng() * 58
      results.push({ x, y, tree: trees[i] })
    }
  }

  return results.sort((a, b) => a.y - b.y)
}

function getRarityPlantClass(type: string): string {
  const rarity = TREE_TYPES[type]?.rarity
  switch (rarity) {
    case 'uncommon': return 'rarity-uncommon'
    case 'rare': return 'rarity-rare'
    case 'true rare': return 'rarity-true-rare'
    case 'premium': return 'rarity-premium'
    case 'chroma': return 'rarity-chroma'
    case 'extinct': return 'rarity-extinct'
    default: return ''
  }
}

const Terrain = memo(function Terrain({ isDark }: { isDark: boolean }) {
  const sky = isDark ? '#0a0e0a' : '#d8dcd0'
  const ground = isDark ? '#141a12' : '#c4c0b0'
  const groundLight = isDark ? '#1a2216' : '#ccc8b8'
  const mtnFar = isDark ? '#0c100c' : '#b8b4a8'
  const mtnMid = isDark ? '#10160e' : '#c0bcae'
  const mtnNear = isDark ? '#121a10' : '#c8c4b4'
  const roadColor = isDark ? '#1c1814' : '#b0a898'
  const roadEdge = isDark ? '#181410' : '#a8a090'
  const lakeDeep = isDark ? '#0a1420' : '#8aacc8'
  const lakeShallow = isDark ? '#0e1a2a' : '#a0c4d8'
  const lakeEdge = isDark ? '#121c12' : '#90a880'
  const grass = isDark ? '#2a3a22' : '#a8a490'

  return (
    <>
      {/* Sky gradient at top */}
      <div className="absolute inset-0" style={{
        background: isDark
          ? `linear-gradient(180deg, #080c08 0%, ${ground} 28%)`
          : `linear-gradient(180deg, #e0e4d8 0%, ${ground} 28%)`,
      }} />

      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lakeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lakeShallow} />
            <stop offset="60%" stopColor={lakeDeep} />
            <stop offset="100%" stopColor={lakeDeep} />
          </linearGradient>
          <radialGradient id="lakeHighlight" cx="0.4" cy="0.3" r="0.6">
            <stop offset="0%" stopColor={isDark ? '#1a2a3a' : '#c0dce8'} stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Mountain range ── */}
        {/* Far mountains — jagged, desaturated */}
        <path d="M-5,22 L8,10 L14,16 L22,6 L30,14 L38,4 L46,12 L52,8 L60,14 L68,5 L76,11 L82,7 L90,13 L96,9 L105,18 L105,26 L-5,26 Z" fill={mtnFar} />
        {/* Snow caps */}
        <path d="M22,6 L24,9 L20,9 Z" fill={isDark ? '#2a2e2a' : '#e0dcd4'} opacity="0.5" />
        <path d="M38,4 L40.5,8 L35.5,8 Z" fill={isDark ? '#2a2e2a' : '#e0dcd4'} opacity="0.6" />
        <path d="M68,5 L70.5,9 L65.5,9 Z" fill={isDark ? '#2a2e2a' : '#e0dcd4'} opacity="0.45" />
        <path d="M52,8 L54,11 L50,11 Z" fill={isDark ? '#2a2e2a' : '#e0dcd4'} opacity="0.35" />

        {/* Mid mountains — rounder, warmer */}
        <path d="M-5,28 L10,20 L20,24 L32,17 L42,22 L52,18 L64,23 L74,19 L86,24 L95,20 L105,26 L105,32 L-5,32 Z" fill={mtnMid} />

        {/* Near foothills — transition into ground */}
        <path d="M-5,32 Q8,27 18,30 Q28,25 38,29 Q50,24 62,28 Q74,25 86,29 Q96,26 105,30 L105,36 L-5,36 Z" fill={mtnNear} />

        {/* Ground fill below foothills */}
        <rect x="-5" y="34" width="110" height="70" fill={ground} />

        {/* Subtle terrain variation — meadow patches */}
        <ellipse cx="20" cy="55" rx="18" ry="7" fill={groundLight} opacity="0.3" />
        <ellipse cx="55" cy="70" rx="14" ry="5" fill={groundLight} opacity="0.25" />
        <ellipse cx="35" cy="85" rx="20" ry="6" fill={groundLight} opacity="0.2" />

        {/* ── Main road — winding left-to-right ── */}
        <path
          d="M -2,100 C 6,92 14,84 22,76 C 30,70 40,65 50,62 C 60,60 70,58 80,54 C 90,48 98,44 102,42"
          stroke={roadEdge}
          strokeWidth="3.5"
          fill="none"
          opacity={isDark ? 0.5 : 0.4}
          strokeLinecap="round"
        />
        <path
          d="M -2,100 C 6,92 14,84 22,76 C 30,70 40,65 50,62 C 60,60 70,58 80,54 C 90,48 98,44 102,42"
          stroke={roadColor}
          strokeWidth="2"
          fill="none"
          opacity={isDark ? 0.6 : 0.5}
          strokeLinecap="round"
        />
        {/* Road texture dashes */}
        <path
          d="M -2,100 C 6,92 14,84 22,76 C 30,70 40,65 50,62 C 60,60 70,58 80,54 C 90,48 98,44 102,42"
          stroke={isDark ? '#2a2418' : '#c0b8a8'}
          strokeWidth="0.4"
          fill="none"
          opacity="0.3"
          strokeDasharray="2 4"
          strokeLinecap="round"
        />

        {/* ── Branch road — north toward mountains ── */}
        <path
          d="M 50,62 C 48,54 44,46 38,38 C 34,32 32,28 30,24"
          stroke={roadEdge}
          strokeWidth="2.5"
          fill="none"
          opacity={isDark ? 0.35 : 0.3}
          strokeLinecap="round"
        />
        <path
          d="M 50,62 C 48,54 44,46 38,38 C 34,32 32,28 30,24"
          stroke={roadColor}
          strokeWidth="1.4"
          fill="none"
          opacity={isDark ? 0.45 : 0.4}
          strokeLinecap="round"
        />

        {/* ── Lake ── */}
        <ellipse cx={LAKE_CX} cy={LAKE_CY} rx={LAKE_RX} ry={LAKE_RY} fill="url(#lakeGrad)" />
        <ellipse cx={LAKE_CX} cy={LAKE_CY} rx={LAKE_RX} ry={LAKE_RY} fill="url(#lakeHighlight)" />
        {/* Shore */}
        <ellipse cx={LAKE_CX} cy={LAKE_CY} rx={LAKE_RX + 1.5} ry={LAKE_RY + 1} fill="none" stroke={lakeEdge} strokeWidth="1.2" opacity="0.3" />
        {/* Reeds on left shore */}
        {[0,1,2].map(i => {
          const rx = LAKE_CX - LAKE_RX + 2 + i * 1.8
          const ry = LAKE_CY - 2 + i * 1.5
          return <g key={`reed${i}`} opacity={isDark ? 0.3 : 0.25}>
            <line x1={`${rx}`} y1={`${ry}`} x2={`${rx - 0.3}`} y2={`${ry - 2.5}`} stroke={grass} strokeWidth="0.4" />
            <line x1={`${rx + 0.6}`} y1={`${ry}`} x2={`${rx + 0.4}`} y2={`${ry - 2}`} stroke={grass} strokeWidth="0.35" />
          </g>
        })}
        {/* Water ripple */}
        <ellipse cx={LAKE_CX + 2} cy={LAKE_CY - 1} rx="4" ry="1" fill="none" stroke={isDark ? '#1a2a3a' : '#b8d4e0'} strokeWidth="0.3" opacity="0.3" />
        <ellipse cx={LAKE_CX - 3} cy={LAKE_CY + 2} rx="3" ry="0.7" fill="none" stroke={isDark ? '#1a2a3a' : '#b8d4e0'} strokeWidth="0.25" opacity="0.2" />

        {/* ── Grass tufts scattered across plantable areas ── */}
        {Array.from({ length: 30 }).map((_, i) => {
          const rng = seededRng(i * 53 + 101)
          const x = 3 + rng() * 94
          const y = 34 + rng() * 60
          if (inLake(x, y)) return null
          if (distToPolyline(x, y, ROAD_MAIN) < 3) return null
          const h = 0.5 + rng() * 0.7
          return (
            <g key={`g${i}`} opacity={isDark ? 0.15 + rng() * 0.1 : 0.1 + rng() * 0.08}>
              <line x1={`${x}`} y1={`${y}`} x2={`${x - 0.2}`} y2={`${y - h}`} stroke={grass} strokeWidth="0.3" />
              <line x1={`${x}`} y1={`${y}`} x2={`${x + 0.15}`} y2={`${y - h * 0.85}`} stroke={grass} strokeWidth="0.3" />
            </g>
          )
        })}

        {/* Small stones near road */}
        {Array.from({ length: 10 }).map((_, i) => {
          const rng = seededRng(i * 89 + 337)
          const x = 10 + rng() * 80
          const y = 36 + rng() * 55
          if (inLake(x, y)) return null
          return <ellipse key={`s${i}`} cx={`${x}`} cy={`${y}`} rx={`${0.25 + rng() * 0.2}`} ry={`${0.1 + rng() * 0.08}`} fill={isDark ? '#1c1e1a' : '#a8a498'} opacity={isDark ? 0.2 : 0.15} />
        })}
      </svg>

      {/* Atmospheric haze on mountains */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
        height: '32%',
        background: isDark
          ? `linear-gradient(180deg, rgba(8,12,8,0.6) 0%, rgba(8,12,8,0.2) 60%, transparent 100%)`
          : `linear-gradient(180deg, rgba(220,224,216,0.5) 0%, rgba(220,224,216,0.15) 60%, transparent 100%)`,
      }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: isDark
          ? 'inset 0 0 80px 20px rgba(10,14,10,0.5)'
          : 'inset 0 0 60px 15px rgba(180,176,164,0.25)',
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
  sunshine, gems, xp, grove, notes,
}: OrchardViewProps) {

  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null)
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
    if (selectedNotebook === null) return all
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

  if (!isOpen) return null

  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  const textPrimary = isDark ? '#d4d0c8' : '#3a3630'
  const textSecondary = isDark ? '#6b6860' : '#9a9590'
  const textMuted = isDark ? '#4a4840' : '#b8b4ae'
  const sidebarBg = isDark ? 'rgba(10,12,10,0.85)' : 'rgba(240,236,228,0.9)'
  const sidebarItemHover = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const sidebarItemActive = isDark ? 'rgba(234,88,12,0.1)' : 'rgba(234,88,12,0.08)'

  const baseSize = filteredTrees.length <= 6 ? 62 :
    filteredTrees.length <= 15 ? 56 :
    filteredTrees.length <= 30 ? 50 : 44

  const totalTrees = grove.filter(Boolean).length

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
        <div className="shrink-0 flex flex-col z-30 overflow-hidden" style={{
          width: 200,
          background: sidebarBg,
          backdropFilter: 'blur(16px)',
          borderRight: `1px solid ${cardBorder}`,
        }}>
          {/* Sidebar header */}
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: textMuted }}>
              Orchards
            </h2>
          </div>

          {/* All trees button */}
          <div className="px-2 pt-2 shrink-0">
            <button
              onClick={() => setSelectedNotebook(null)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
              style={{
                background: selectedNotebook === null ? sidebarItemActive : 'transparent',
                borderLeft: selectedNotebook === null ? '2px solid #ea580c' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (selectedNotebook !== null) e.currentTarget.style.background = sidebarItemHover }}
              onMouseLeave={e => { if (selectedNotebook !== null) e.currentTarget.style.background = 'transparent' }}
            >
              <span className="text-[13px]">🌳</span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold block truncate" style={{
                  color: selectedNotebook === null ? '#ea580c' : textPrimary,
                }}>All Trees</span>
              </div>
              <span className="text-[9px] font-bold tabular-nums shrink-0" style={{ color: textMuted }}>
                {totalTrees}
              </span>
            </button>
          </div>

          {/* Notebook list */}
          <div className="flex-1 overflow-y-auto px-2 py-1.5" style={{ scrollbarWidth: 'thin' }}>
            {activeNotes.map(note => {
              const count = notebookTreeCounts[note.id] || 0
              const isSelected = selectedNotebook === note.id
              const icon = note.icon || NOTE_TYPE_ICONS[note.noteType || 'notebook'] || '📓'

              return (
                <button
                  key={note.id}
                  onClick={() => setSelectedNotebook(note.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors mb-0.5"
                  style={{
                    background: isSelected ? sidebarItemActive : 'transparent',
                    borderLeft: isSelected ? '2px solid #ea580c' : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = sidebarItemHover }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <span className="text-[13px] shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-medium block truncate" style={{
                      color: isSelected ? '#ea580c' : textPrimary,
                    }}>{note.subject || 'Untitled'}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-[9px] font-bold tabular-nums shrink-0" style={{ color: textMuted }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Unassigned trees */}
            {(notebookTreeCounts['_unassigned'] || 0) > 0 && (
              <button
                onClick={() => setSelectedNotebook('_unassigned')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors mt-1"
                style={{
                  background: selectedNotebook === '_unassigned' ? sidebarItemActive : 'transparent',
                  borderLeft: selectedNotebook === '_unassigned' ? '2px solid #ea580c' : '2px solid transparent',
                  borderTop: `1px solid ${cardBorder}`,
                }}
                onMouseEnter={e => { if (selectedNotebook !== '_unassigned') e.currentTarget.style.background = sidebarItemHover }}
                onMouseLeave={e => { if (selectedNotebook !== '_unassigned') e.currentTarget.style.background = 'transparent' }}
              >
                <span className="text-[13px] shrink-0 opacity-50">🌿</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium block truncate" style={{
                    color: selectedNotebook === '_unassigned' ? '#ea580c' : textMuted,
                  }}>Unassigned</span>
                </div>
                <span className="text-[9px] font-bold tabular-nums shrink-0" style={{ color: textMuted }}>
                  {notebookTreeCounts['_unassigned']}
                </span>
              </button>
            )}
          </div>

          {/* Sidebar footer — stats */}
          <div className="shrink-0 px-4 py-3 flex flex-col gap-1.5" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider" style={{ color: textMuted }}>Level</span>
              <span className="text-[10px] font-bold" style={{ color: textSecondary }}>
                {lvl.level} · {lvl.name}
              </span>
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
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[9px]">☀️</span>
                <span className="text-[9px] font-bold tabular-nums" style={{ color: textSecondary }}>{sunshine}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px]">💎</span>
                <span className="text-[9px] font-bold tabular-nums" style={{ color: textSecondary }}>{gems}</span>
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
                {selectedNotebook === null ? 'All Trees' :
                 selectedNotebook === '_unassigned' ? 'Unassigned' :
                 activeNotes.find(n => n.id === selectedNotebook)?.subject || 'Untitled'}
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
              <button onClick={onClose} className="ml-2 p-1.5 rounded-lg transition-colors" style={{ color: textMuted }} onMouseEnter={e => e.currentTarget.style.color = textPrimary} onMouseLeave={e => e.currentTarget.style.color = textMuted}>
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
                      const depthScale = 0.6 + (y / 100) * 0.5
                      const treeSize = Math.round(baseSize * depthScale)

                      return (
                        <div
                          key={`${tree.id ?? 'tree'}-${renderIdx}`}
                          className="absolute flex flex-col items-center group"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -85%)',
                            zIndex: Math.round(y),
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
