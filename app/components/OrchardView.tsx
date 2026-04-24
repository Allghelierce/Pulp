"use client"
import { memo, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
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

function scatterPositions(count: number): { x: number; y: number }[] {
  if (count === 0) return []

  const placed: { x: number; y: number }[] = []
  const minDist = Math.max(8, 38 / Math.sqrt(count))

  for (let i = 0; i < count; i++) {
    const rng = seededRng(i * 127 + (i * i) * 31 + 997)
    let bestX = 50, bestY = 50, bestMinD = 0

    const attempts = 80
    for (let a = 0; a < attempts; a++) {
      const cx = 6 + rng() * 88
      const cy = 8 + rng() * 82

      let closestD = Infinity
      for (const p of placed) {
        const dx = cx - p.x
        const dy = (cy - p.y) * 0.7
        closestD = Math.min(closestD, Math.sqrt(dx * dx + dy * dy))
      }

      if (closestD > bestMinD) {
        bestMinD = closestD
        bestX = cx
        bestY = cy
      }

      if (closestD >= minDist) break
    }

    placed.push({ x: bestX, y: bestY })
  }

  return placed
}

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme,
  sunshine, gems, xp, grove, setSunshine, setGems, setGrove
}: OrchardViewProps) {

  const lvl = getLevel(xp)

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose, isOpen])

  const sellPlant = (idx: number) => {
    const tree = trees[idx]
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

  const trees = useMemo(() => grove.filter(t => t !== null), [grove])
  const harvestable = trees.filter(t => t && t.stage >= 4).length
  const positions = useMemo(() => scatterPositions(trees.length), [trees.length])

  const sorted = useMemo(() => {
    return positions
      .map((pos, i) => ({ pos, tree: trees[i], origIdx: i }))
      .filter(d => d.tree)
      .sort((a, b) => a.pos.y - b.pos.y)
  }, [positions, trees])

  if (!isOpen) return null

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
          width: "96vw", maxWidth: 1100, height: "94vh", maxHeight: 920,
          borderRadius: 18, overflow: "hidden", position: "relative",
          boxShadow: "0 25px 80px -15px rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="relative z-10 h-full flex flex-col">
          {/* Header — overlays the scene */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between px-8 py-3.5 bg-black/40 backdrop-blur-md shrink-0 relative z-20"
          >
            <div className="flex items-center gap-5">
              <h1 className="text-xl font-bold tracking-tight text-stone-300/80" style={{ fontFamily: '"EB Garamond", serif' }}>
                Your Orchard
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-500/[0.08] border border-stone-500/[0.1]">
                <span className="text-[11px] font-bold text-stone-400/80 tabular-nums" style={{ fontFamily: '"EB Garamond", serif' }}>
                  Lv.{lvl.level}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-stone-500/50">{lvl.name}</span>
              </div>
              <span className="text-[10px] text-stone-500/50">
                {trees.length} planted{harvestable > 0 ? ` · ${harvestable} harvestable` : ''}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06]">
                <span className="text-[10px]">☀️</span>
                <span className="text-[11px] font-bold tabular-nums text-stone-300/70">{sunshine}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06]">
                <span className="text-[10px]">💎</span>
                <span className="text-[11px] font-bold tabular-nums text-stone-300/70">{gems}</span>
              </div>
              <button onClick={onClose} className="ml-2 p-2 rounded-full hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </motion.header>

          {/* XP bar */}
          <div className="px-8 py-2 shrink-0 bg-black/30 backdrop-blur-sm relative z-20">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #4a5a3a, #6b7a58)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, lvl.progress * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-[9px] tabular-nums text-zinc-600 shrink-0">{xp.toLocaleString()} XP</span>
            </div>
          </div>

          {/* The orchard scene — fills remaining space */}
          <div className="flex-1 relative overflow-hidden">
            {/* Sky gradient */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(180deg, #0b1520 0%, #0e1d18 15%, #0f2214 30%, #12281a 50%, #162c1a 65%, #1a3018 80%, #1e3416 90%, #223818 100%)',
            }} />

            {/* Stars / fireflies at the top (sky area) */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }}>
              {Array.from({ length: 24 }).map((_, i) => {
                const rng = seededRng(i * 53 + 7)
                const cx = rng() * 100
                const cy = rng() * 25
                const r = 0.3 + rng() * 0.8
                return (
                  <circle key={i} cx={`${cx}%`} cy={`${cy}%`} r={r} fill="#c8d8b0">
                    <animate attributeName="opacity" values={`${0.15 + rng() * 0.2};${0.5 + rng() * 0.4};${0.15 + rng() * 0.2}`} dur={`${3 + rng() * 4}s`} begin={`${rng() * 5}s`} repeatCount="indefinite" />
                  </circle>
                )
              })}
            </svg>

            {/* Mist layers for atmospheric depth */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(180deg, rgba(20,40,26,0.4) 0%, transparent 20%, transparent 50%, rgba(20,40,26,0.15) 80%, rgba(30,52,24,0.3) 100%)',
            }} />

            {/* Distant treeline silhouette */}
            <svg className="absolute w-full" style={{ top: '12%', height: '18%', opacity: 0.12 }} viewBox="0 0 1200 200" preserveAspectRatio="none">
              <path d="M0 200 L0 140 Q30 80 60 130 Q80 60 110 120 Q140 50 170 115 Q200 70 230 125 Q250 55 280 110 Q310 65 340 120 Q370 45 400 115 Q430 70 460 125 Q490 40 520 110 Q550 60 580 120 Q610 50 640 115 Q670 75 700 130 Q730 55 760 120 Q790 60 820 125 Q850 45 880 115 Q910 65 940 120 Q970 55 1000 115 Q1030 70 1060 125 Q1090 50 1120 110 Q1150 60 1180 120 L1200 130 L1200 200 Z" fill="#0a1a0e" />
            </svg>

            {/* Mid-ground hill contours */}
            <svg className="absolute w-full" style={{ top: '28%', height: '25%', opacity: 0.08 }} viewBox="0 0 1200 200" preserveAspectRatio="none">
              <path d="M0 200 L0 120 Q150 60 300 100 Q450 40 600 90 Q750 50 900 110 Q1050 70 1200 95 L1200 200 Z" fill="#1a3018" />
            </svg>

            {/* Ground plane — subtle rolling hills */}
            <svg className="absolute w-full bottom-0" style={{ height: '55%', opacity: 0.15 }} viewBox="0 0 1200 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ground-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2a4020" stopOpacity="0" />
                  <stop offset="40%" stopColor="#2a4020" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1a2e14" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <path d="M0 400 L0 80 Q100 50 200 70 Q350 30 500 60 Q650 20 800 55 Q950 35 1100 65 L1200 50 L1200 400 Z" fill="url(#ground-g)" />
            </svg>

            {/* Scattered grass tufts */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
              {Array.from({ length: 40 }).map((_, i) => {
                const rng = seededRng(i * 89 + 41)
                const x = rng() * 100
                const y = 40 + rng() * 55
                return (
                  <g key={i} transform={`translate(${x * 12}, ${y * 4})`}>
                    <line x1="0" y1="0" x2="-2" y2="-6" stroke="#4a7a3a" strokeWidth="0.8" />
                    <line x1="2" y1="0" x2="4" y2="-5" stroke="#3a6a2a" strokeWidth="0.8" />
                    <line x1="4" y1="0" x2="3" y2="-7" stroke="#4a7a3a" strokeWidth="0.8" />
                  </g>
                )
              })}
            </svg>

            {/* Path / trail winding through */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.04 }}>
              <path d="M -5% 95% Q 15% 70% 30% 65% Q 45% 58% 55% 55% Q 70% 50% 85% 42% Q 95% 38% 105% 30%" stroke="#8a7a60" strokeWidth="12" fill="none" strokeLinecap="round" />
            </svg>

            {/* Trees — sorted by y so farther = behind */}
            {sorted.map(({ pos, tree, origIdx }, renderIdx) => {
              const typeInfo = TREE_TYPES[tree.type]
              const rarityMeta = RARITY_LABELS[typeInfo?.rarity || 'common'] || RARITY_LABELS.common
              const isHarvestable = tree.stage >= 4

              const depthT = pos.y / 100
              const scale = 0.45 + depthT * 0.65
              const basePlantSize = Math.min(90, 55 + tree.stage * 8)
              const plantSize = Math.round(basePlantSize * scale)
              const fogOpacity = Math.max(0, 0.35 - depthT * 0.35)
              const shadowW = Math.round(10 + depthT * 16)

              return (
                <motion.div
                  key={tree.id || origIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + renderIdx * 0.03 }}
                  className="absolute flex flex-col items-center group"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: `translate(-50%, -80%)`,
                    zIndex: 10 + renderIdx,
                    cursor: isHarvestable ? 'pointer' : 'default',
                  }}
                  onClick={() => { if (isHarvestable) sellPlant(origIdx) }}
                >
                  {/* Atmospheric fog overlay on distant trees */}
                  <div className="relative">
                    <motion.div
                      className={tree.stage >= 3 ? getRarityPlantClass(tree.type) : ''}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      style={{ opacity: 1 - fogOpacity * 0.5 }}
                    >
                      <PlantIcon type={tree.type} size={plantSize} stage={tree.stage} />
                    </motion.div>
                    {fogOpacity > 0.05 && (
                      <div className="absolute inset-0 pointer-events-none rounded-full" style={{
                        background: `radial-gradient(circle, rgba(15,30,18,${fogOpacity}) 30%, transparent 70%)`,
                      }} />
                    )}
                  </div>

                  {/* Ground shadow — larger for closer trees */}
                  <div
                    className="rounded-full blur-[2px] -mt-1"
                    style={{
                      width: shadowW,
                      height: Math.max(2, shadowW * 0.2),
                      backgroundColor: `rgba(10,20,10,${0.15 + depthT * 0.15})`,
                    }}
                  />

                  {/* Hover tooltip */}
                  <div className="mt-1 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                      <span className="text-[8px] font-bold text-zinc-300 uppercase tracking-wider whitespace-nowrap block">
                        {typeInfo?.name || tree.type}
                      </span>
                      {isHarvestable ? (
                        <span className="text-[7px] font-bold uppercase tracking-widest whitespace-nowrap block mt-0.5" style={{ color: rarityMeta.color }}>
                          Harvest +{Math.floor((typeInfo?.cost || 5) * 1.5)} {typeInfo?.currency === 'sunshine' ? '☀️' : '💎'}
                        </span>
                      ) : (
                        <div className="w-full h-[3px] rounded-full bg-white/10 mt-1 overflow-hidden">
                          <div className="h-full bg-stone-400/60 rounded-full" style={{ width: `${Math.min(100, tree.progress)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* Fireflies in the lower field */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }}>
              {Array.from({ length: 8 }).map((_, i) => {
                const rng = seededRng(i * 139 + 73)
                const cx = 10 + rng() * 80
                const cy = 40 + rng() * 50
                return (
                  <circle key={`ff-${i}`} cx={`${cx}%`} cy={`${cy}%`} r="1.2" fill="#a0d890">
                    <animate attributeName="opacity" values="0;0.7;0" dur={`${3 + rng() * 3}s`} begin={`${rng() * 6}s`} repeatCount="indefinite" />
                    <animate attributeName="cx" values={`${cx}%;${cx + (rng() - 0.5) * 4}%;${cx}%`} dur={`${5 + rng() * 4}s`} repeatCount="indefinite" />
                    <animate attributeName="cy" values={`${cy}%;${cy - 1 - rng() * 2}%;${cy}%`} dur={`${4 + rng() * 3}s`} repeatCount="indefinite" />
                  </circle>
                )
              })}
            </svg>

            {/* Empty state */}
            {trees.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                <p className="text-[13px] text-stone-400/60" style={{ fontFamily: '"EB Garamond", serif' }}>
                  Your orchard is empty. Complete focus sessions with a seed selected to grow your collection.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
})
