"use client"
import { memo, useState, useEffect, useMemo } from "react"
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

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme, accent,
  sunshine, gems, xp, grove, inventory, setSunshine, setGems, setInventory, setGrove
}: OrchardViewProps) {

  const isDark = theme === 'dark'
  const lvl = getLevel(xp)

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose, isOpen])

  const sellPlant = (plotIdx: number) => {
    const tree = grove[plotIdx]
    if (!tree || tree.stage < 4) return
    const typeInfo = TREE_TYPES[tree.type]
    if (!typeInfo) return
    const goldBack = Math.floor(typeInfo.cost * 1.5)
    if (typeInfo.currency === 'sunshine') setSunshine(s => s + goldBack)
    else setGems(g => g + goldBack)
    setGrove(g => g.filter((_, i) => i !== plotIdx))
  }

  const trees = useMemo(() => grove.filter(t => t !== null), [grove])
  const harvestable = trees.filter(t => t && t.stage >= 4).length

  if (!isOpen) return null

  const COLS = 5
  const rows = Math.max(2, Math.ceil(trees.length / COLS) + 1)
  const totalSlots = rows * COLS

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "92vw", maxWidth: 780, height: "88vh", maxHeight: 820,
          borderRadius: 18, overflow: "hidden", position: "relative",
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="absolute inset-0 bg-[#080c08]">
          <div className="absolute inset-0 opacity-30" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(40,55,35,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(80,65,40,0.15) 0%, transparent 60%)'
          }} />
        </div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between px-8 py-4 border-b border-white/[0.04] bg-black/20 backdrop-blur-md shrink-0"
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

          {/* XP bar */}
          <div className="px-8 pt-5 pb-1 shrink-0">
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

          {/* Stats bar */}
          <div className="px-8 py-3 shrink-0 flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500/60">
              {trees.length} planted
            </span>
            {harvestable > 0 && (
              <span className="text-[10px] text-stone-500/50">
                · {harvestable} harvestable
              </span>
            )}
          </div>

          {/* Orchard grid — scrollable, expands dynamically */}
          <div className="flex-1 overflow-y-auto px-8 pb-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}>
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              }}
            >
              {Array.from({ length: totalSlots }).map((_, i) => {
                const tree = trees[i]
                if (tree) {
                  const typeInfo = TREE_TYPES[tree.type]
                  const rarityMeta = RARITY_LABELS[typeInfo?.rarity || 'common'] || RARITY_LABELS.common
                  const isHarvestable = tree.stage >= 4
                  return (
                    <motion.div
                      key={tree.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`relative flex flex-col items-center rounded-2xl p-3 pt-5 cursor-pointer group transition-all ${
                        isHarvestable ? 'hover:bg-white/[0.04]' : ''
                      }`}
                      style={{
                        aspectRatio: '1',
                        backgroundColor: 'rgba(255,255,255,0.015)',
                        border: '1px solid rgba(255,255,255,0.03)',
                      }}
                      onClick={() => { if (isHarvestable) sellPlant(i) }}
                    >
                      <motion.div
                        className={tree.stage >= 3 ? getRarityPlantClass(tree.type) : ''}
                        whileHover={{ scale: 1.06 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <PlantIcon type={tree.type} size={Math.min(72, 48 + tree.stage * 6)} stage={tree.stage} />
                      </motion.div>

                      <div className="w-10 h-1.5 rounded-full bg-amber-900/15 mt-1 blur-[1px]" />

                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mt-2 truncate max-w-full">
                        {typeInfo?.name?.split(' ')[0] || tree.type}
                      </span>

                      {isHarvestable ? (
                        <span className="text-[7px] font-bold uppercase tracking-widest mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: rarityMeta.color }}>
                          Harvest +{Math.floor((typeInfo?.cost || 5) * 1.5)} {typeInfo?.currency === 'sunshine' ? '☀️' : '💎'}
                        </span>
                      ) : (
                        <div className="w-full max-w-[48px] h-[3px] rounded-full bg-white/5 mt-1.5 overflow-hidden">
                          <div className="h-full bg-stone-500/50 rounded-full transition-all" style={{ width: `${Math.min(100, tree.progress)}%` }} />
                        </div>
                      )}
                    </motion.div>
                  )
                }

                // Empty slot
                return (
                  <motion.div
                    key={`empty-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex flex-col items-center justify-center rounded-2xl opacity-20"
                    style={{
                      aspectRatio: '1',
                      border: '1px dashed rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="w-8 h-1.5 rounded-full bg-amber-900/10 blur-[1px]" />
                  </motion.div>
                )
              })}
            </div>

            {/* Tools row */}
            {trees.length > 0 && (
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    if (sunshine < 5) return
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
                  disabled={sunshine < 5 || trees.filter(t => t && t.stage < 4 && t.type !== 'spoiled').length === 0}
                  className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all disabled:opacity-20 disabled:pointer-events-none group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">🌿</span>
                  <div className="text-left flex-1">
                    <span className="block text-[10px] font-bold text-stone-300/70">Mulch</span>
                    <span className="block text-[8px] text-zinc-600">+15% growth · 5☀️</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    const spoiledIdx = grove.findIndex(t => t && t.type === 'spoiled')
                    if (spoiledIdx === -1) return
                    setGems(g => g - 5)
                    setGrove(prev => { const next = [...prev]; next[spoiledIdx] = { ...next[spoiledIdx], type: 'heartwood', stage: 0, progress: 0 }; return next })
                  }}
                  disabled={gems < 5 || !grove.some(t => t && t.type === 'spoiled')}
                  className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all disabled:opacity-20 disabled:pointer-events-none group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">✨</span>
                  <div className="text-left flex-1">
                    <span className="block text-[10px] font-bold text-stone-300/70">Revival</span>
                    <span className="block text-[8px] text-zinc-600">Revive spoiled · 5💎</span>
                  </div>
                </button>
              </div>
            )}

            {/* Empty state */}
            {trees.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 opacity-40">
                <p className="text-[12px] text-stone-400" style={{ fontFamily: '"EB Garamond", serif' }}>
                  Your orchard is empty. Complete focus sessions with a seed selected to grow your collection.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-3 border-t border-white/[0.03] shrink-0">
            <p className="text-[9px] italic text-stone-600/40 text-center" style={{ fontFamily: '"EB Garamond", serif' }}>
              &quot;An orchard is grown with patience and nurtured by persistence.&quot;
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
})
