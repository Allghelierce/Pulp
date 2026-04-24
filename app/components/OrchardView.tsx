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

function packPositions(count: number, plotW: number, plotH: number): { x: number; y: number }[] {
  if (count === 0) return []

  const positions: { x: number; y: number }[] = []
  const cols = Math.ceil(Math.sqrt(count * 1.3))
  const rows = Math.ceil(count / cols)
  const spacingX = plotW / (cols + 1)
  const spacingY = plotH / (rows + 1)

  let idx = 0
  for (let r = 0; r < rows && idx < count; r++) {
    const rowCount = Math.min(cols, count - idx)
    const rowOffset = (r % 2) * (spacingX * 0.3)
    for (let c = 0; c < rowCount && idx < count; c++) {
      const rng = seededRng(idx * 127 + 997)
      const jitterX = (rng() - 0.5) * spacingX * 0.4
      const jitterY = (rng() - 0.5) * spacingY * 0.3
      positions.push({
        x: spacingX * (c + 1) + rowOffset + jitterX,
        y: spacingY * (r + 1) + jitterY,
      })
      idx++
    }
  }
  return positions
}

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
    const positions = packPositions(filteredTrees.length, 100, 100)
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

  const bgColor = isDark ? '#0c0e10' : '#f5f3ef'
  const cardBg = isDark ? '#141618' : '#eae7e1'
  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  const textPrimary = isDark ? '#d4d0c8' : '#3a3630'
  const textSecondary = isDark ? '#6b6860' : '#9a9590'
  const textMuted = isDark ? '#4a4840' : '#b8b4ae'
  const groundDark = isDark ? '#1a1e16' : '#e2ddd4'
  const groundMid = isDark ? '#222820' : '#d8d2c8'

  const plotSize = Math.min(
    filteredTrees.length <= 3 ? 44 :
    filteredTrees.length <= 8 ? 36 :
    filteredTrees.length <= 20 ? 28 : 22,
    44
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "94vw", maxWidth: 860, height: "90vh", maxHeight: 720,
          borderRadius: 16, overflow: "hidden", position: "relative",
          background: bgColor,
          boxShadow: isDark ? "0 25px 80px -15px rgba(0,0,0,0.7)" : "0 25px 80px -15px rgba(0,0,0,0.15)",
          border: `1px solid ${cardBorder}`,
        }}
      >
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: textPrimary }}>
                Orchard
              </h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: textSecondary }}>
                  Lv.{lvl.level}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: textMuted }}>{lvl.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                <span className="text-[10px]">☀️</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: textSecondary }}>{sunshine}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                <span className="text-[10px]">💎</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: textSecondary }}>{gems}</span>
              </div>
              <button onClick={onClose} className="ml-1 p-1.5 rounded-lg transition-colors" style={{ color: textMuted }} onMouseEnter={e => e.currentTarget.style.color = textPrimary} onMouseLeave={e => e.currentTarget.style.color = textMuted}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </header>

          {/* XP bar */}
          <div className="px-6 py-1.5 shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' }}>
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

          {/* Time range tabs + stats */}
          <div className="px-6 py-3 shrink-0 flex items-center justify-between" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <div className="flex items-center gap-1">
              {ranges.map(r => (
                <button
                  key={r.key}
                  onClick={() => setTimeRange(r.key)}
                  className="px-3 py-1 rounded-md text-[11px] font-medium transition-all"
                  style={{
                    color: timeRange === r.key ? (isDark ? '#e8e4dc' : '#2a2620') : textMuted,
                    background: timeRange === r.key ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') : 'transparent',
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

          {/* Orchard scene */}
          <div className="flex-1 relative overflow-auto px-6 py-4">
            {filteredTrees.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <span className="text-[32px]">🌱</span>
                <p className="text-[12px]" style={{ color: textMuted }}>
                  No plants {timeRange === 'day' ? 'today' : timeRange === 'week' ? 'this week' : timeRange === 'month' ? 'this month' : 'this year'}.
                </p>
                <p className="text-[10px]" style={{ color: textMuted }}>
                  Complete focus sessions with a seed selected to grow your collection.
                </p>
              </div>
            ) : (
              <div
                className="relative mx-auto"
                style={{
                  width: '100%',
                  maxWidth: 780,
                  aspectRatio: '16 / 9',
                  maxHeight: 'calc(100% - 8px)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: isDark
                    ? `linear-gradient(180deg, #10140e 0%, ${groundDark} 40%, ${groundMid} 100%)`
                    : `linear-gradient(180deg, #ede9e0 0%, ${groundDark} 40%, ${groundMid} 100%)`,
                  border: `1px solid ${cardBorder}`,
                }}
              >
                {/* Isometric ground grid */}
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: isDark ? 0.06 : 0.08 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line key={`h-${i}`} x1="0" y1={`${(i + 1) * 8}%`} x2="100%" y2={`${(i + 1) * 8}%`} stroke={isDark ? '#fff' : '#000'} strokeWidth="0.5" />
                  ))}
                  {Array.from({ length: 16 }).map((_, i) => (
                    <line key={`v-${i}`} x1={`${(i + 1) * 6}%`} y1="0" x2={`${(i + 1) * 6}%`} y2="100%" stroke={isDark ? '#fff' : '#000'} strokeWidth="0.5" />
                  ))}
                </svg>

                {/* Subtle ground texture patches */}
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: isDark ? 0.04 : 0.05 }}>
                  {Array.from({ length: 8 }).map((_, i) => {
                    const rng = seededRng(i * 71 + 19)
                    return (
                      <ellipse key={i}
                        cx={`${10 + rng() * 80}%`} cy={`${30 + rng() * 60}%`}
                        rx={`${4 + rng() * 6}%`} ry={`${2 + rng() * 3}%`}
                        fill={isDark ? '#2a3a20' : '#c8c0b4'}
                      />
                    )
                  })}
                </svg>

                {/* Trees */}
                <AnimatePresence>
                  {sorted.map(({ pos, tree }, renderIdx) => {
                    const typeInfo = TREE_TYPES[tree.type]
                    const rarityMeta = RARITY_LABELS[typeInfo?.rarity || 'common'] || RARITY_LABELS.common
                    const isHarvestable = tree.stage >= 4

                    const depthT = pos.y / 100
                    const scale = 0.7 + depthT * 0.35
                    const plantSize = Math.round(plotSize * scale)

                    return (
                      <motion.div
                        key={tree.id || renderIdx}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ delay: renderIdx * 0.02, duration: 0.3 }}
                        className="absolute flex flex-col items-center group"
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          transform: `translate(-50%, -85%)`,
                          zIndex: 10 + renderIdx,
                          cursor: isHarvestable ? 'pointer' : 'default',
                        }}
                        onClick={() => { if (isHarvestable) sellPlant(tree) }}
                      >
                        <div className="relative">
                          <motion.div
                            className={tree.stage >= 3 ? getRarityPlantClass(tree.type) : ''}
                            whileHover={{ scale: 1.15, y: -2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            <PlantIcon type={tree.type} size={plantSize} stage={tree.stage} />
                          </motion.div>
                        </div>

                        {/* Shadow */}
                        <div
                          className="rounded-full -mt-0.5"
                          style={{
                            width: Math.round(plantSize * 0.5),
                            height: Math.max(2, Math.round(plantSize * 0.1)),
                            backgroundColor: isDark ? `rgba(0,0,0,${0.2 + depthT * 0.15})` : `rgba(0,0,0,${0.08 + depthT * 0.06})`,
                            filter: 'blur(1.5px)',
                          }}
                        />

                        {/* Tooltip */}
                        <div className="mt-0.5 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ zIndex: 100 }}>
                          <div className="px-2 py-1 rounded-md" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: `1px solid ${cardBorder}` }}>
                            <span className="text-[8px] font-bold uppercase tracking-wider whitespace-nowrap block" style={{ color: textPrimary }}>
                              {typeInfo?.name || tree.type}
                            </span>
                            {isHarvestable ? (
                              <span className="text-[7px] font-bold uppercase tracking-widest whitespace-nowrap block mt-0.5" style={{ color: rarityMeta.color }}>
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
      </motion.div>
    </motion.div>
  )
})
