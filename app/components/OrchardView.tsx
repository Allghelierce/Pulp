"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES, getLevel } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"

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
}

const RARITY_LABELS: Record<string, { label: string; color: string }> = {
  common: { label: 'Common', color: '#8a8a8f' },
  uncommon: { label: 'Uncommon', color: '#6b9a6b' },
  rare: { label: 'Rare', color: '#6888a8' },
  'true rare': { label: 'True Rare', color: '#8b7aaa' },
  premium: { label: 'Premium', color: '#b89860' },
  chroma: { label: 'Chroma', color: '#a8708a' },
  extinct: { label: 'Extinct', color: '#7a6a9a' },
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

function seededRng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => {
    s ^= s << 13
    s ^= s >> 17
    s ^= s << 5
    return ((s >>> 0) % 10000) / 10000
  }
}

type TimeRange = 'day' | 'week' | 'month' | 'year'

function getTimeRangeCutoff(range: TimeRange): number {
  const now = Date.now()
  switch (range) {
    case 'day': return now - 24 * 60 * 60 * 1000
    case 'week': return now - 7 * 24 * 60 * 60 * 1000
    case 'month': return now - 30 * 24 * 60 * 60 * 1000
    case 'year': return now - 365 * 24 * 60 * 60 * 1000
  }
}

// Golden-angle spiral placement — clumps from center, expands outward, no grid pattern
function spiralPositions(count: number): { x: number; y: number }[] {
  if (count === 0) return []
  const positions: { x: number; y: number }[] = []
  const goldenAngle = 137.508 * (Math.PI / 180)
  const maxRadius = 42

  for (let i = 0; i < count; i++) {
    const rng = seededRng(i * 317 + 5431)
    const t = i / Math.max(count - 1, 1)
    const radius = maxRadius * Math.sqrt(t) * (0.85 + rng() * 0.3)
    const angle = i * goldenAngle + rng() * 0.6
    const jitterX = (rng() - 0.5) * 6
    const jitterY = (rng() - 0.5) * 5
    positions.push({
      x: 50 + Math.cos(angle) * radius + jitterX,
      y: 50 + Math.sin(angle) * radius * 0.65 + jitterY,
    })
  }
  return positions
}

const TerrainSvg = memo(function TerrainSvg({ isDark }: { isDark: boolean }) {
  const grassTufts = useMemo(() => Array.from({ length: 24 }).map((_, i) => {
    const rng = seededRng(i * 53 + 101)
    const x = 5 + rng() * 90
    const y = 15 + rng() * 80
    const size = 1.5 + rng() * 3
    return { i, x, y, size, opacity: isDark ? 0.15 + rng() * 0.1 : 0.12 + rng() * 0.08, d: `M${x}%,${y}% q${-size * 0.3}%,${-size}% ${-size * 0.1}%,${-size * 1.2}% M${x}%,${y}% q${size * 0.1}%,${-size * 0.8}% ${size * 0.4}%,${-size * 1.1}% M${x}%,${y}% q${size * 0.2}%,${-size * 0.9}% ${-size * 0.2}%,${-size * 1.0}%` }
  }), [isDark])

  const stones = useMemo(() => Array.from({ length: 10 }).map((_, i) => {
    const rng = seededRng(i * 89 + 337)
    return { i, cx: 8 + rng() * 84, cy: 25 + rng() * 70, rx: 0.3 + rng() * 0.5, ry: 0.15 + rng() * 0.25 }
  }), [])

  const dirtPatches = useMemo(() => Array.from({ length: 6 }).map((_, i) => {
    const rng = seededRng(i * 127 + 71)
    return { i, cx: 10 + rng() * 80, cy: 30 + rng() * 60, rx: 3 + rng() * 5, ry: 1.5 + rng() * 2.5 }
  }), [])

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      <ellipse cx="25%" cy="75%" rx="30%" ry="12%" fill={isDark ? '#1e2818' : '#c8c0b0'} opacity={isDark ? 0.3 : 0.2} />
      <ellipse cx="70%" cy="60%" rx="25%" ry="8%" fill={isDark ? '#202a1a' : '#ccc4b4'} opacity={isDark ? 0.25 : 0.15} />
      <ellipse cx="50%" cy="85%" rx="40%" ry="10%" fill={isDark ? '#1c2616' : '#c0b8a8'} opacity={isDark ? 0.2 : 0.15} />
      {grassTufts.map(g => (
        <g key={`grass-${g.i}`} opacity={g.opacity}>
          <path d={g.d} stroke={isDark ? '#4a6a38' : '#8a9a78'} strokeWidth="0.8" fill="none" />
        </g>
      ))}
      {stones.map(s => (
        <ellipse key={`stone-${s.i}`} cx={`${s.cx}%`} cy={`${s.cy}%`} rx={`${s.rx}%`} ry={`${s.ry}%`} fill={isDark ? '#2a2e28' : '#b0a898'} opacity={isDark ? 0.3 : 0.25} />
      ))}
      {dirtPatches.map(d => (
        <ellipse key={`dirt-${d.i}`} cx={`${d.cx}%`} cy={`${d.cy}%`} rx={`${d.rx}%`} ry={`${d.ry}%`} fill={isDark ? '#1a1e14' : '#c4bca8'} opacity={isDark ? 0.15 : 0.12} />
      ))}
      <path d="M 10% 95% Q 30% 70% 45% 55% Q 55% 45% 50% 35% Q 45% 25% 55% 15%" stroke={isDark ? '#2a2e22' : '#bab2a0'} strokeWidth="12" fill="none" opacity={isDark ? 0.2 : 0.15} strokeLinecap="round" />
      <path d="M 10% 95% Q 30% 70% 45% 55% Q 55% 45% 50% 35% Q 45% 25% 55% 15%" stroke={isDark ? '#222820' : '#c4bcaa'} strokeWidth="6" fill="none" opacity={isDark ? 0.15 : 0.1} strokeLinecap="round" />
    </svg>
  )
})

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme,
  sunshine, gems, xp, grove, setSunshine, setGems, setGrove
}: OrchardViewProps) {

  const lvl = getLevel(xp)
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose, isOpen])

  const sellPlant = (tree: any) => {
    if (!tree || tree.stage < 4) return
    const typeInfo = TREE_TYPES[tree.type]
    if (!typeInfo) return
    const goldBack = Math.floor(typeInfo.cost * 1.5)
    if (typeInfo.currency === 'sunshine') setSunshine(s => s + goldBack)
    else setGems(g => g + goldBack)
    setGrove(g => {
      const realIdx = g.indexOf(tree)
      return realIdx >= 0 ? g.filter((_, i) => i !== realIdx) : g
    })
  }

  const allTrees = useMemo(() => grove.filter(t => t !== null), [grove])
  const filteredTrees = useMemo(() => {
    const cutoff = getTimeRangeCutoff(timeRange)
    return allTrees.filter(t => (t.plantedAt || 0) >= cutoff)
  }, [allTrees, timeRange])

  const harvestable = filteredTrees.filter(t => t && t.stage >= 4).length

  const sorted = useMemo(() => {
    const positions = spiralPositions(filteredTrees.length)
    return positions
      .map((pos, i) => ({ pos, tree: filteredTrees[i] }))
      .filter(d => d.tree)
      .sort((a, b) => a.pos.y - b.pos.y)
  }, [filteredTrees])

  if (!isOpen) return null

  const ranges: { key: TimeRange; label: string }[] = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ]

  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  const textPrimary = isDark ? '#d4d0c8' : '#3a3630'
  const textSecondary = isDark ? '#6b6860' : '#9a9590'
  const textMuted = isDark ? '#4a4840' : '#b8b4ae'

  const baseSize = filteredTrees.length <= 6 ? 56 :
    filteredTrees.length <= 15 ? 48 :
    filteredTrees.length <= 30 ? 40 : 34

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative flex flex-col overflow-hidden"
        style={{
          width: "96vw", maxWidth: 1000, height: "92vh", maxHeight: 780,
          borderRadius: 18,
          boxShadow: isDark ? "0 30px 100px -20px rgba(0,0,0,0.8)" : "0 30px 100px -20px rgba(0,0,0,0.2)",
          border: `1px solid ${cardBorder}`,
        }}
      >
        {/* Full-bleed terrain background */}
        <div className="absolute inset-0" style={{
          background: isDark
            ? 'linear-gradient(180deg, #0e1210 0%, #141c14 20%, #1a2418 45%, #1e2a1c 65%, #222e20 80%, #2a3428 100%)'
            : 'linear-gradient(180deg, #e8e4dc 0%, #ddd8cc 20%, #d4cfbf 45%, #c8c2b2 65%, #bdb7a5 80%, #b0aa98 100%)',
        }} />

        <TerrainSvg isDark={isDark} />

        {/* Floating header overlay */}
        <header className="relative z-20 flex items-center justify-between px-6 py-3 shrink-0" style={{
          background: isDark ? 'rgba(10,12,10,0.75)' : 'rgba(240,236,228,0.75)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${cardBorder}`,
        }}>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: textPrimary }}>
              Orchard
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: textSecondary }}>
                Lv.{lvl.level}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: textMuted }}>{lvl.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
              <span className="text-[10px]">☀️</span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: textSecondary }}>{sunshine}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
              <span className="text-[10px]">💎</span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: textSecondary }}>{gems}</span>
            </div>
            <button onClick={onClose} className="ml-1 p-1.5 rounded-lg transition-colors" style={{ color: textMuted }} onMouseEnter={e => e.currentTarget.style.color = textPrimary} onMouseLeave={e => e.currentTarget.style.color = textMuted}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        {/* XP bar */}
        <div className="relative z-20 px-6 py-1.5 shrink-0" style={{
          background: isDark ? 'rgba(10,12,10,0.6)' : 'rgba(240,236,228,0.6)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${cardBorder}`,
        }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: isDark ? 'linear-gradient(90deg, #4a5a3a, #6b7a58)' : 'linear-gradient(90deg, #8ba870, #a0c088)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, lvl.progress * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <span className="text-[9px] tabular-nums shrink-0" style={{ color: textMuted }}>{xp.toLocaleString()} XP</span>
          </div>
        </div>

        {/* Time range tabs */}
        <div className="relative z-20 px-6 py-2.5 shrink-0 flex items-center justify-between" style={{
          background: isDark ? 'rgba(10,12,10,0.5)' : 'rgba(240,236,228,0.5)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${cardBorder}`,
        }}>
          <div className="flex items-center gap-1">
            {ranges.map(r => (
              <button
                key={r.key}
                onClick={() => setTimeRange(r.key)}
                className="px-3 py-1 rounded-md text-[11px] font-medium transition-all"
                style={{
                  color: timeRange === r.key ? (isDark ? '#e8e4dc' : '#2a2620') : textMuted,
                  background: timeRange === r.key ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : 'transparent',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] tabular-nums" style={{ color: textSecondary }}>
              {filteredTrees.length} planted
            </span>
            {harvestable > 0 && (
              <span className="text-[10px] tabular-nums" style={{ color: '#8ba870' }}>
                {harvestable} harvestable
              </span>
            )}
          </div>
        </div>

        {/* Orchard scene — full bleed */}
        <div className="flex-1 relative overflow-hidden">
          {filteredTrees.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 relative z-10">
              <span className="text-[32px]">🌱</span>
              <p className="text-[12px]" style={{ color: textMuted }}>
                No plants {timeRange === 'day' ? 'today' : timeRange === 'week' ? 'this week' : timeRange === 'month' ? 'this month' : 'this year'}.
              </p>
              <p className="text-[10px]" style={{ color: textMuted }}>
                Complete focus sessions with a seed selected to grow your collection.
              </p>
            </div>
          ) : (
            <div className="absolute inset-0">
              <AnimatePresence>
                {sorted.map(({ pos, tree }, renderIdx) => {
                  const typeInfo = TREE_TYPES[tree.type]
                  const rarityMeta = RARITY_LABELS[typeInfo?.rarity || 'common'] || RARITY_LABELS.common
                  const isHarvestable = tree.stage >= 4

                  const depthT = pos.y / 100
                  const scale = 0.75 + depthT * 0.35
                  const plantSize = Math.round(baseSize * scale)

                  return (
                    <motion.div
                      key={`${tree.id ?? 'tree'}-${renderIdx}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute flex flex-col items-center group"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: `translate(-50%, -80%)`,
                        zIndex: Math.round(pos.y),
                        cursor: isHarvestable ? 'pointer' : 'default',
                      }}
                      onClick={() => { if (isHarvestable) sellPlant(tree) }}
                    >
                      <div className="relative">
                        <motion.div
                          className={tree.stage >= 3 ? getRarityPlantClass(tree.type) : ''}
                          whileHover={{ scale: 1.15, y: -3 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <PlantIcon type={tree.type} size={plantSize} stage={tree.stage} />
                        </motion.div>
                      </div>

                      {/* Shadow on ground */}
                      <div
                        className="rounded-full -mt-0.5"
                        style={{
                          width: Math.round(plantSize * 0.55),
                          height: Math.max(2, Math.round(plantSize * 0.12)),
                          backgroundColor: isDark ? `rgba(0,0,0,${0.25 + depthT * 0.15})` : `rgba(0,0,0,${0.1 + depthT * 0.08})`,
                          filter: 'blur(2px)',
                        }}
                      />

                      {/* Tooltip on hover */}
                      <div className="mt-0.5 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ zIndex: 200 }}>
                        <div className="px-2.5 py-1.5 rounded-lg" style={{
                          backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${cardBorder}`,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}>
                          <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap block" style={{ color: textPrimary }}>
                            {typeInfo?.name || tree.type}
                          </span>
                          {isHarvestable ? (
                            <span className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap block mt-0.5" style={{ color: rarityMeta.color }}>
                              Harvest +{Math.floor((typeInfo?.cost || 5) * 1.5)} {typeInfo?.currency === 'sunshine' ? '☀️' : '💎'}
                            </span>
                          ) : (
                            <div className="w-full h-[2px] rounded-full mt-1 overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, tree.progress)}%`, background: '#8ba870' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
