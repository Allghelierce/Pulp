"use client"
import { memo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"

interface OrchardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  sunshine: number
  gems: number
  grove: any[]
  inventory: string[]
  setSunshine: (v: number | ((p: number) => number)) => void
  setGems: (v: number | ((p: number) => number)) => void
  setInventory: (v: string[] | ((p: string[]) => string[])) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
}

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme, accent,
  sunshine, gems, grove, inventory, setSunshine, setGems, setInventory, setGrove
}: OrchardViewProps) {

  const [plantingPlot, setPlantingPlot] = useState<number | null>(null)

  const plantFromInventory = (seedType: string, seedIdx: number, plotIdx: number) => {
    // Remove from inventory
    setInventory(inv => inv.filter((_, i) => i !== seedIdx))
    // Add to grove
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
      onClick={() => {
        if (plantingPlot !== null) setPlantingPlot(null)
        else onClose()
      }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative inset-x-0 top-1/2 -translate-y-1/2 max-w-2xl mx-auto w-full max-h-[85vh] overflow-y-auto rounded-3xl flex flex-col shadow-2xl border ${
          theme === 'dark'
            ? 'bg-[#0f0f12] border-zinc-800'
            : 'bg-white border-zinc-200 shadow-xl'
        } font-sans`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-20 p-8 border-b flex items-center justify-between backdrop-blur-sm ${
          theme === 'dark' ? 'bg-[#0f0f12]/80 border-zinc-800' : 'bg-white/80 border-zinc-100'
        }`}>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Your Orchard
            </h1>
            <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Focus sanctuary & growth</p>
          </div>
          <button
            onClick={onClose}
            className={`p-3 rounded-full transition-all hover:scale-110 ${
              theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 p-8 space-y-12">
          {/* Currencies - Subtle Header */}
          <div className="flex items-center gap-8 px-4">
             <div className="flex items-center gap-3">
                <span className="text-xl">☀️</span>
                <div>
                   <span className="block text-lg font-bold leading-tight">{sunshine}</span>
                   <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Sunshine</span>
                </div>
             </div>
             <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
             <div className="flex items-center gap-3">
                <span className="text-xl">💎</span>
                <div>
                   <span className="block text-lg font-bold leading-tight">{gems}</span>
                   <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Gems</span>
                </div>
             </div>
          </div>

          {/* Your Grove */}
          <section className="space-y-4 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-400">Your Grove</h2>
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                {grove.filter(t => t !== null).length}/9 Plots
              </span>
            </div>

            <div className={`grid grid-cols-3 gap-3 p-5 rounded-2xl border ${
              theme === 'dark' ? 'bg-zinc-900/10 border-zinc-800/50' : 'bg-zinc-50/50 border-zinc-100'
            }`}>
              {[...Array(9)].map((_, i) => {
                const tree = grove[i]
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all overflow-hidden ${
                      plantingPlot === i ? 'ring-2 ring-emerald-500 border-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                      tree ? (theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm') :
                      (theme === 'dark' ? 'bg-zinc-950/20 border-zinc-800/50' : 'bg-zinc-100/50 border-zinc-200/50 hover:bg-zinc-100 hover:border-zinc-300')
                    } cursor-pointer group`}
                    onClick={() => {
                      if (!tree) setPlantingPlot(i === plantingPlot ? null : i)
                    }}
                  >
                    {!tree ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xl transition-transform group-hover:scale-110 ${plantingPlot === i ? 'rotate-45 text-emerald-500' : 'text-zinc-300 dark:text-zinc-700'}`}>
                          +
                        </span>
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Plant Seed</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full h-full p-2">
                        <div className="flex-1 flex items-center justify-center">
                          <PlantIcon type={tree.type} size={50} stage={tree.stage} />
                        </div>
                        
                        {tree.stage === 4 ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); sellPlant(i); }}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase py-1 rounded-lg transition-colors shadow-lg shadow-emerald-500/30"
                          >
                            Sell +{Math.floor(TREE_TYPES[tree.type].cost * 1.5)} {TREE_TYPES[tree.type].currency === 'sunshine' ? '☀️' : '💎'}
                          </button>
                        ) : (
                          <div className={`w-12 h-1 rounded-full overflow-hidden border ${
                            theme === 'dark' ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-200 border-gray-300'
                          }`}>
                            <motion.div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${(tree.progress / 100) * 100}%` }}
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
                          className="absolute inset-x-0 bottom-0 top-0 z-50 bg-white/95 dark:bg-zinc-900/95 p-3 flex flex-col"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Your Seeds</span>
                             <button onClick={() => setPlantingPlot(null)} className="text-zinc-400 hover:text-zinc-600">×</button>
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {inventory.length === 0 ? (
                              <p className="text-[10px] text-zinc-400 text-center py-4">No seeds in inventory.</p>
                            ) : (
                              inventory.map((seedType, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => plantFromInventory(seedType, sIdx, i)}
                                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-zinc-100 dark:border-zinc-700 hover:border-emerald-200 transition-all text-left"
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
                  </div>
                )
              })}
            </div>
          </section>

          {/* Farmer Tools */}
          <section className="space-y-4">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-400">Farmer Tools</h2>
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
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                  sunshine < 5 || (grove || []).filter(t => t && t.stage < 4 && t.type !== 'spoiled').length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50 active:scale-95'
                } ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}
              >
                <div className="w-11 h-11 rounded-lg bg-emerald-500/5 flex items-center justify-center text-xl border border-emerald-500/10 group-hover:scale-110 transition-transform">🌿</div>
                <div className="flex-1">
                  <span className="block text-sm font-bold text-emerald-600">Organic Mulch</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5">+15% Growth boost</p>
                  <span className="block mt-1 font-bold text-xs text-emerald-600">5 ☀️</span>
                </div>
              </button>

              <button
                onClick={() => setGems(g => g - 30)}
                disabled={gems < 30}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                  gems < 30 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50 active:scale-95'
                } ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}
              >
                <div className="w-11 h-11 rounded-lg bg-purple-500/5 flex items-center justify-center text-xl border border-purple-500/10 group-hover:drop-shadow-[0_0_8px_#a855f766] transition-all">🧿</div>
                <div className="flex-1">
                  <span className="block text-sm font-bold text-purple-600">Warding Totem</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5">24h Protection</p>
                  <span className="block mt-1 font-bold text-xs text-purple-600">30 💎</span>
                </div>
              </button>
            </div>
          </section>

          <footer className="text-center py-8 border-t border-zinc-100/50 dark:border-zinc-800/50">
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest italic leading-relaxed">
              &quot;An orchard is grown with patience and nurtured by persistence.&quot;
            </p>
          </footer>
        </div>
      </motion.div>
    </motion.div>
  )
})
