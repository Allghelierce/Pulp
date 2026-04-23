"use client"
import { memo, useState, useEffect } from "react"
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

const GARDEN_EMOJIS = ['🌸', '🌼', '🍃', '🌿', '🦋', '🐝', '🌺', '✨']

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme, accent,
  sunshine, gems, xp, grove, inventory, setSunshine, setGems, setInventory, setGrove
}: OrchardViewProps) {

  const [plantingPlot, setPlantingPlot] = useState<number | null>(null)
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
      const newPlant = {
        id: Date.now(),
        type: seedType,
        stage: 0,
        progress: 0,
        plantedAt: Date.now()
      }
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
    setGrove(g => {
      const next = [...g]
      next[plotIdx] = null
      return next
    })
  }

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
      {/* Fullscreen background */}
      <div className={`absolute inset-0 ${isDark
        ? 'bg-gradient-to-b from-[#0a0f0a] via-[#0f1a0f] to-[#0a0f0a]'
        : 'bg-gradient-to-b from-[#f0f7e8] via-[#e8f4dc] to-[#dcefd0]'
      }`}>
        {/* Floating particles */}
        {GARDEN_EMOJIS.map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-lg pointer-events-none select-none"
            style={{ left: `${10 + (i * 12) % 80}%`, top: `${15 + (i * 17) % 70}%` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: [0, 0.3, 0],
              y: [20, -30, -60],
            }}
            transition={{
              duration: 6 + i * 0.8,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "easeInOut",
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`flex items-center justify-between px-8 py-5 backdrop-blur-md border-b ${
            isDark ? 'bg-black/30 border-white/5' : 'bg-white/40 border-black/5'
          }`}
        >
          <div className="flex items-center gap-6">
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}
                style={{ fontFamily: '"EB Garamond", serif' }}>
                The Garden
              </h1>
              <p className={`text-[10px] font-medium mt-0.5 ${isDark ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>
                Grow your world, one word at a time
              </p>
            </div>

            {/* Level badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200/50'
            }`}>
              <span className={`text-sm font-black ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                style={{ fontFamily: '"EB Garamond", serif' }}>
                Lv.{lvl.level}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-amber-400/60' : 'text-amber-600/60'}`}>
                {lvl.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Currencies */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                isDark ? 'bg-yellow-500/10 border-yellow-500/15' : 'bg-yellow-50 border-yellow-200/50'
              }`}>
                <svg className="w-3.5 h-3.5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42"/></svg>
                <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>{sunshine}</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                isDark ? 'bg-purple-500/10 border-purple-500/15' : 'bg-purple-50 border-purple-200/50'
              }`}>
                <span className="text-xs">💎</span>
                <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{gems}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2.5 rounded-full transition-all hover:scale-110 ${
                isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/10 text-zinc-500'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </motion.div>

        {/* Main garden area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-10 space-y-10">

            {/* XP Progress */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className={`p-5 rounded-2xl border backdrop-blur-sm ${
                isDark ? 'bg-black/20 border-white/5' : 'bg-white/50 border-black/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Progress to {lvl.level < XP_LEVELS.length ? getLevel(xp + lvl.nextXp - lvl.currentXp).name : 'Max'}
                </span>
                <span className={`text-[10px] tabular-nums font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {xp.toLocaleString()} XP
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #16a34a, #22c55e, #4ade80)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, lvl.progress * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className={`text-[9px] tabular-nums ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {lvl.currentXp}/{lvl.nextXp} XP
                </span>
                <span className={`text-[9px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {Math.round(lvl.progress * 100)}%
                </span>
              </div>
            </motion.div>

            {/* Grove Grid - larger, more garden-like */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${isDark ? 'text-emerald-400/70' : 'text-emerald-700/70'}`}>
                  Your Grove
                </h2>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {filledPlots}/9 planted
                  </span>
                  {grownPlots > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {grownPlots} fully grown
                    </span>
                  )}
                </div>
              </div>

              <div className={`grid grid-cols-3 gap-4 p-6 rounded-3xl border backdrop-blur-sm ${
                isDark ? 'bg-black/20 border-white/5' : 'bg-white/40 border-black/5'
              }`}>
                {[...Array(9)].map((_, i) => {
                  const tree = grove[i]
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.25 + i * 0.04 }}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative border-2 transition-all overflow-hidden ${
                        plantingPlot === i
                          ? 'ring-2 ring-emerald-500 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : tree
                            ? (isDark ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-white/60 border-emerald-200/50 shadow-sm')
                            : (isDark ? 'bg-white/[0.02] border-white/5 hover:border-emerald-500/30 hover:bg-emerald-950/10' : 'bg-white/30 border-black/5 hover:border-emerald-300 hover:bg-emerald-50/30')
                      } cursor-pointer group`}
                      onClick={() => {
                        if (!tree) setPlantingPlot(i === plantingPlot ? null : i)
                      }}
                    >
                      {!tree ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className={`text-2xl transition-all group-hover:scale-125 ${
                            plantingPlot === i ? 'rotate-45 text-emerald-500' : (isDark ? 'text-zinc-700' : 'text-zinc-300')
                          }`}>
                            +
                          </span>
                          <span className={`text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity ${
                            isDark ? 'text-zinc-500' : 'text-zinc-400'
                          }`}>Plant</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center w-full h-full p-3">
                          <div className="flex-1 flex items-center justify-center">
                            <PlantIcon type={tree.type} size={60} stage={tree.stage} />
                          </div>
                          <span className={`text-[8px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {TREE_TYPES[tree.type]?.name?.split(' ')[0] || tree.type}
                          </span>
                          {tree.stage >= 4 ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); sellPlant(i); }}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase py-1.5 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                            >
                              Harvest +{Math.floor(TREE_TYPES[tree.type].cost * 1.5)} {TREE_TYPES[tree.type].currency === 'sunshine' ? '☀️' : '💎'}
                            </button>
                          ) : (
                            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                              <motion.div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (tree.progress / 100) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <AnimatePresence>
                        {plantingPlot === i && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`absolute inset-0 z-50 p-3 flex flex-col backdrop-blur-md ${
                              isDark ? 'bg-zinc-900/95' : 'bg-white/95'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Seeds</span>
                              <button onClick={() => setPlantingPlot(null)} className={`${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-400 hover:text-zinc-600'}`}>×</button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                              {inventory.length === 0 ? (
                                <p className={`text-[10px] text-center py-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>No seeds yet.</p>
                              ) : (
                                inventory.map((seedType, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => plantFromInventory(seedType, sIdx, i)}
                                    className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                                      isDark
                                        ? 'bg-zinc-800 hover:bg-emerald-900/30 border-zinc-700 hover:border-emerald-500/30'
                                        : 'bg-zinc-50 hover:bg-emerald-50 border-zinc-100 hover:border-emerald-200'
                                    }`}
                                  >
                                    <PlantIcon type={seedType} size={20} />
                                    <span className="text-[10px] font-bold truncate flex-1">{TREE_TYPES[seedType].name}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>

            {/* Farmer Tools */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className={`text-xs font-black uppercase tracking-[0.15em] px-1 ${isDark ? 'text-emerald-400/70' : 'text-emerald-700/70'}`}>
                Tools
              </h2>
              <div className="grid grid-cols-2 gap-4">
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
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group backdrop-blur-sm ${
                    sunshine < 5 || (grove || []).filter(t => t && t.stage < 4 && t.type !== 'spoiled').length === 0
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:scale-[1.02] active:scale-[0.98]'
                  } ${isDark ? 'bg-black/20 border-emerald-800/20 hover:border-emerald-500/30' : 'bg-white/50 border-emerald-100 hover:border-emerald-300 shadow-sm'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🌿</div>
                  <div className="flex-1">
                    <span className={`block text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Organic Mulch</span>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>+15% growth boost</p>
                    <span className={`block mt-1 font-bold text-xs ${isDark ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>5 ☀️</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const spoiledIdx = grove.findIndex(t => t && t.type === 'spoiled')
                    if (spoiledIdx === -1) return
                    setGems(g => g - 5)
                    setGrove(prev => {
                      const next = [...prev]
                      const original = next[spoiledIdx]
                      next[spoiledIdx] = { ...original, type: 'navel', stage: 0, progress: 0 }
                      return next
                    })
                  }}
                  disabled={gems < 5 || !grove.some(t => t && t.type === 'spoiled')}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group backdrop-blur-sm ${
                    gems < 5 || !grove.some(t => t && t.type === 'spoiled')
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:scale-[1.02] active:scale-[0.98]'
                  } ${isDark ? 'bg-black/20 border-purple-800/20 hover:border-purple-500/30' : 'bg-white/50 border-purple-100 hover:border-purple-300 shadow-sm'}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">✨</div>
                  <div className="flex-1">
                    <span className={`block text-sm font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Revival Elixir</span>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Revive a spoiled plant</p>
                    <span className={`block mt-1 font-bold text-xs ${isDark ? 'text-purple-500/70' : 'text-purple-600/70'}`}>5 💎</span>
                  </div>
                </button>
              </div>
            </motion.section>

            {/* Nursery Shop */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="space-y-4"
            >
              <h2 className={`text-xs font-black uppercase tracking-[0.15em] px-1 ${isDark ? 'text-emerald-400/70' : 'text-emerald-700/70'}`}>
                Nursery Shop
              </h2>
              <div className={`flex flex-wrap gap-4 p-5 rounded-2xl border backdrop-blur-sm ${
                isDark ? 'bg-black/20 border-white/5' : 'bg-white/40 border-black/5'
              }`}>
                {(Object.keys(TREE_TYPES) as Array<keyof typeof TREE_TYPES>).map(type => {
                  const info = TREE_TYPES[type]
                  const canAfford = info.currency === 'sunshine' ? sunshine >= info.cost : gems >= info.cost
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (!canAfford) return
                        if (info.currency === 'sunshine') setSunshine(s => s - info.cost)
                        else setGems(g => g - info.cost)
                        setGrove(g => [...g.slice(0, 8), {
                          id: Date.now(), type, stage: 0, progress: 0, plantedAt: Date.now()
                        }].slice(0, 9))
                      }}
                      disabled={!canAfford}
                      className="flex flex-col items-center group disabled:opacity-25 transition-all hover:scale-105 active:scale-95"
                    >
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 border-dashed transition-all mb-1.5 overflow-hidden ${
                          isDark ? 'border-zinc-700 group-hover:border-zinc-500' : 'border-zinc-200 group-hover:border-zinc-400'
                        }`}
                        style={{ backgroundColor: info.bg }}
                      >
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: info.color }} />
                      </div>
                      <span className={`text-[9px] font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{info.name.split(' ')[0]}</span>
                      <span className={`text-[8px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {info.cost} {info.currency === 'sunshine' ? '☀️' : '💎'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.section>

            <footer className="text-center py-8">
              <p className={`text-[10px] font-medium italic tracking-wider ${isDark ? 'text-emerald-600/40' : 'text-emerald-700/30'}`}>
                &quot;An orchard is grown with patience and nurtured by persistence.&quot;
              </p>
            </footer>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
