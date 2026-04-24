"use client"
import { memo, useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES, getLevel, XP_LEVELS } from "@/app/constants"
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

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'true rare', 'premium', 'chroma', 'extinct'] as const
const RARITY_LABELS: Record<string, { label: string; color: string; glow: string }> = {
  common: { label: 'Common', color: '#8a8a8f', glow: '' },
  uncommon: { label: 'Uncommon', color: '#6b9a6b', glow: '' },
  rare: { label: 'Rare', color: '#6888a8', glow: '0 0 10px rgba(104,136,168,0.15)' },
  'true rare': { label: 'True Rare', color: '#8b7aaa', glow: '0 0 12px rgba(139,122,170,0.15)' },
  premium: { label: 'Premium', color: '#b89860', glow: '0 0 12px rgba(184,152,96,0.15)' },
  chroma: { label: 'Chroma', color: '#a8708a', glow: '0 0 14px rgba(168,112,138,0.18)' },
  extinct: { label: 'Extinct', color: '#7a6a9a', glow: '0 0 14px rgba(122,106,154,0.2)' },
}

// Plot positions for a natural-looking garden layout (not a rigid grid)
const PLOT_POSITIONS = [
  { x: 15, y: 8 }, { x: 50, y: 5 }, { x: 85, y: 9 },
  { x: 10, y: 42 }, { x: 50, y: 38 }, { x: 88, y: 40 },
  { x: 18, y: 72 }, { x: 52, y: 75 }, { x: 83, y: 70 },
]

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme, accent,
  sunshine, gems, xp, grove, inventory, setSunshine, setGems, setInventory, setGrove
}: OrchardViewProps) {

  const [plantingPlot, setPlantingPlot] = useState<number | null>(null)
  const [shopTab, setShopTab] = useState<string>('common')
  const isDark = theme === 'dark'
  const lvl = getLevel(xp)

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (plantingPlot !== null) setPlantingPlot(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [plantingPlot, onClose, isOpen])

  const plantFromInventory = (seedType: string, seedIdx: number, plotIdx: number) => {
    setInventory(inv => inv.filter((_, i) => i !== seedIdx))
    setGrove(g => {
      const next = [...g]
      const newPlant = { id: Date.now(), type: seedType, stage: 0, progress: 0, plantedAt: Date.now() }
      if (next.length <= plotIdx) {
        while (next.length < plotIdx) next.push(null)
        next[plotIdx] = newPlant
      } else {
        next[plotIdx] = newPlant
      }
      return next.slice(0, 9)
    })
    setPlantingPlot(null)
  }

  const sellPlant = (plotIdx: number) => {
    const tree = grove[plotIdx]
    if (!tree || tree.stage < 4) return
    const typeInfo = TREE_TYPES[tree.type]
    const goldBack = Math.floor(typeInfo.cost * 1.5)
    if (typeInfo.currency === 'sunshine') setSunshine(s => s + goldBack)
    else setGems(g => g + goldBack)
    setGrove(g => { const next = [...g]; next[plotIdx] = null; return next })
  }

  const shopItems = useMemo(() => {
    const grouped: Record<string, { type: string; info: any }[]> = {}
    for (const type of Object.keys(TREE_TYPES)) {
      const info = TREE_TYPES[type]
      if (type === 'spoiled') continue
      const r = info.rarity || 'common'
      if (!grouped[r]) grouped[r] = []
      grouped[r].push({ type, info })
    }
    return grouped
  }, [])

  if (!isOpen) return null

  const filledPlots = grove.filter(t => t !== null).length
  const grownPlots = grove.filter(t => t && t.stage >= 4).length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#080c08]">
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(22,101,52,0.4) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(120,80,30,0.2) 0%, transparent 60%)'
        }} />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Top bar */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-8 py-4 border-b border-white/[0.04] bg-black/20 backdrop-blur-md shrink-0"
        >
          <div className="flex items-center gap-5">
            <h1 className="text-xl font-bold tracking-tight text-stone-300/80" style={{ fontFamily: '"EB Garamond", serif' }}>
              The Garden
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-500/[0.08] border border-stone-500/[0.1]">
              <span className="text-[11px] font-bold text-stone-400/80 tabular-nums" style={{ fontFamily: '"EB Garamond", serif' }}>
                Lv.{lvl.level}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-stone-500/50">{lvl.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-700/[0.3] border border-stone-600/[0.12]">
              <span className="text-[10px]">☀️</span>
              <span className="text-[11px] font-bold tabular-nums text-stone-300/70">{sunshine}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-700/[0.3] border border-stone-600/[0.12]">
              <span className="text-[10px]">💎</span>
              <span className="text-[11px] font-bold tabular-nums text-stone-300/70">{gems}</span>
            </div>
            <button onClick={onClose} className="ml-2 p-2 rounded-full hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </motion.header>

        {/* Main content — two column layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: The Grove (garden scene) */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* XP bar — thin, minimal */}
            <div className="px-8 pt-5 pb-1">
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

            {/* Garden Scene */}
            <div className="flex-1 px-8 py-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500/60">Your Grove</h2>
                <span className="text-[9px] text-zinc-600 tabular-nums">
                  {filledPlots}/9 planted{grownPlots > 0 ? ` · ${grownPlots} harvestable` : ''}
                </span>
              </div>

              {/* Garden terrain */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-white/[0.03]" style={{ aspectRatio: '16/10', background: 'linear-gradient(180deg, #0a120a 0%, #111a0e 30%, #14200f 60%, #1a2510 100%)' }}>
                {/* Ground texture lines */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none">
                  {[20, 40, 60, 80].map(y => (
                    <path key={y} d={`M0 ${y}% Q 25% ${y - 3}% 50% ${y}% T 100% ${y}%`} stroke="white" strokeWidth="0.5" fill="none" />
                  ))}
                </svg>

                {/* Fence posts */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-900/20 to-transparent" />

                {/* Plots */}
                {PLOT_POSITIONS.map((pos, i) => {
                  const tree = grove[i]
                  const isPlanting = plantingPlot === i
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.04 }}
                      className="absolute flex flex-col items-center"
                      style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -20%)',
                        zIndex: Math.floor(pos.y),
                      }}
                    >
                      {tree ? (
                        <div className="flex flex-col items-center group cursor-pointer" onClick={(e) => { e.stopPropagation(); if (tree.stage >= 4) sellPlant(i) }}>
                          <motion.div
                            whileHover={{ scale: 1.08 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <PlantIcon type={tree.type} size={Math.min(90, 60 + tree.stage * 8)} stage={tree.stage} />
                          </motion.div>

                          {/* Soil patch */}
                          <div className="w-12 h-2 rounded-full bg-amber-900/15 -mt-1 blur-[1px]" />

                          {/* Info */}
                          <div className="mt-1 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                              {TREE_TYPES[tree.type]?.name?.split(' ')[0]}
                            </span>
                            {tree.stage >= 4 ? (
                              <span className="text-[7px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">
                                Harvest +{Math.floor(TREE_TYPES[tree.type].cost * 1.5)} {TREE_TYPES[tree.type].currency === 'sunshine' ? '☀️' : '💎'}
                              </span>
                            ) : (
                              <div className="w-10 h-[3px] rounded-full bg-white/5 mt-1 overflow-hidden">
                                <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${Math.min(100, tree.progress)}%` }} />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPlantingPlot(isPlanting ? null : i)}
                          className={`group flex flex-col items-center transition-all ${isPlanting ? '' : 'opacity-30 hover:opacity-60'}`}
                        >
                          {/* Empty plot marker */}
                          <div className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
                            isPlanting
                              ? 'border-emerald-500/50 bg-emerald-500/10 scale-110'
                              : 'border-zinc-700/30 group-hover:border-zinc-600/50'
                          }`}>
                            <span className={`text-sm ${isPlanting ? 'text-emerald-400 rotate-45' : 'text-zinc-700 group-hover:text-zinc-500'} transition-all`}>+</span>
                          </div>
                          <div className="w-8 h-1.5 rounded-full bg-amber-900/10 mt-0.5 blur-[1px]" />
                        </button>
                      )}
                    </motion.div>
                  )
                })}

                {/* Planting overlay */}
                <AnimatePresence>
                  {plantingPlot !== null && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400/70">Plant a seed</span>
                        <button onClick={() => setPlantingPlot(null)} className="ml-auto text-zinc-500 hover:text-zinc-300 text-xs">Cancel</button>
                      </div>
                      {inventory.length === 0 ? (
                        <p className="text-[10px] text-zinc-500 italic">No seeds — buy some from the nursery.</p>
                      ) : (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {inventory.map((seedType, sIdx) => {
                            const info = TREE_TYPES[seedType]
                            if (!info) return null
                            return (
                              <button
                                key={sIdx}
                                onClick={() => plantFromInventory(seedType, sIdx, plantingPlot)}
                                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all"
                              >
                                <PlantIcon type={seedType} size={22} isSeed />
                                <span className="text-[10px] font-bold text-zinc-300">{info.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tools — inline, compact */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setSunshine(s => s - 5)
                    setGrove(prev => {
                      const idx = prev.findIndex(t => t && t.stage < 4 && t.type !== 'spoiled')
                      if (idx === -1) return prev
                      const next = [...prev]
                      const newProgress = (next[idx].progress || 0) + 15
                      next[idx] = { ...next[idx], progress: newProgress, stage: Math.min(4, Math.floor(newProgress / 25)) }
                      return next
                    })
                  }}
                  disabled={sunshine < 5 || (grove || []).filter(t => t && t.stage < 4 && t.type !== 'spoiled').length === 0}
                  className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-emerald-500/[0.06] hover:border-emerald-500/[0.1] transition-all disabled:opacity-20 disabled:pointer-events-none group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">🌿</span>
                  <div className="text-left flex-1">
                    <span className="block text-[10px] font-bold text-emerald-300/80">Mulch</span>
                    <span className="block text-[8px] text-zinc-600">+15% growth · 5☀️</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    const spoiledIdx = grove.findIndex(t => t && t.type === 'spoiled')
                    if (spoiledIdx === -1) return
                    setGems(g => g - 5)
                    setGrove(prev => { const next = [...prev]; next[spoiledIdx] = { ...next[spoiledIdx], type: 'navel', stage: 0, progress: 0 }; return next })
                  }}
                  disabled={gems < 5 || !grove.some(t => t && t.type === 'spoiled')}
                  className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-purple-500/[0.06] hover:border-purple-500/[0.1] transition-all disabled:opacity-20 disabled:pointer-events-none group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">✨</span>
                  <div className="text-left flex-1">
                    <span className="block text-[10px] font-bold text-purple-300/80">Revival</span>
                    <span className="block text-[8px] text-zinc-600">Revive spoiled · 5💎</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Nursery Shop */}
          <div className="w-[320px] shrink-0 border-l border-white/[0.03] flex flex-col bg-black/20 overflow-hidden">
            <div className="px-5 pt-5 pb-3 shrink-0">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/50 mb-3">Nursery</h2>
              {/* Rarity tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {RARITY_ORDER.filter(r => shopItems[r]?.length).map(r => {
                  const meta = RARITY_LABELS[r]
                  const isActive = shopTab === r
                  return (
                    <button
                      key={r}
                      onClick={() => setShopTab(r)}
                      className="shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        backgroundColor: isActive ? `${meta.color}18` : 'transparent',
                        border: `1px solid ${isActive ? `${meta.color}35` : 'transparent'}`,
                        color: isActive ? meta.color : '#52525b',
                      }}
                    >
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Shop items */}
            <div className="flex-1 overflow-y-auto px-5 pb-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}>
              <div className="space-y-2">
                {(shopItems[shopTab] || []).map(({ type, info }) => {
                  const canAfford = info.currency === 'sunshine' ? sunshine >= info.cost : gems >= info.cost
                  const meta = RARITY_LABELS[info.rarity] || RARITY_LABELS.common
                  return (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (!canAfford) return
                        if (info.currency === 'sunshine') setSunshine(s => s - info.cost)
                        else setGems(g => g - info.cost)
                        setInventory(inv => [...inv, type])
                      }}
                      disabled={!canAfford}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group disabled:opacity-25"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.015)',
                        border: '1px solid rgba(255,255,255,0.03)',
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: info.bg,
                          boxShadow: meta.glow || undefined,
                        }}
                      >
                        <PlantIcon type={type} size={28} isSeed />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-zinc-200 truncate">{info.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold tabular-nums" style={{ color: meta.color }}>
                            {info.cost} {info.currency === 'sunshine' ? '☀️' : '💎'}
                          </span>
                          <span className="text-[8px] text-zinc-700">·</span>
                          <span className="text-[8px] text-zinc-600">
                            Harvest {Math.floor(info.cost * 1.5)} {info.currency === 'sunshine' ? '☀️' : '💎'}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <span className="text-emerald-400 text-[10px]">+</span>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Inventory */}
              {inventory.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2">Inventory ({inventory.length})</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(inventory)].map(type => {
                      const count = inventory.filter(s => s === type).length
                      const info = TREE_TYPES[type]
                      if (!info) return null
                      return (
                        <div key={type} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.02] border border-white/[0.04]">
                          <PlantIcon type={type} size={14} isSeed />
                          <span className="text-[9px] font-bold text-zinc-400">{info.name.split(' ')[0]}</span>
                          <span className="text-[8px] text-zinc-600">×{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer quote */}
            <div className="px-5 py-3 border-t border-white/[0.03] shrink-0">
              <p className="text-[9px] italic text-emerald-800/40 text-center" style={{ fontFamily: '"EB Garamond", serif' }}>
                &quot;An orchard is grown with patience and nurtured by persistence.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
