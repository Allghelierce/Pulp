"use client"
import { memo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES } from "@/app/constants"

import { PlantIcon } from "./PlantIcon"
import { PulpIcon, GemIcon } from '@/app/components/CurrencyIcons'

interface BinderViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  sap: number
  gems: number
  grove: any[]
  inventory: string[]
  setSap: (v: number | ((p: number) => number)) => void
  setGems: (v: number | ((p: number) => number)) => void
  setInventory: (v: string[] | ((p: string[]) => string[])) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
}

const RARITY_CARD_STYLES: Record<string, string> = {
  common: "card-common",
  uncommon: "card-uncommon",
  rare: "card-rare",
  sacred: "card-premium",
}

const Card = ({ card, idx, sellCard, theme }: any) => {
  if (!card) return (
    <div className={`group relative rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all duration-500 hover:border-emerald-500/30 ${
      theme === 'dark' ? 'border-zinc-800/50 bg-zinc-900/20' : 'border-zinc-200 bg-zinc-50/50'
    }`}>
      <div className="w-12 h-12 rounded-full bg-zinc-400/5 flex items-center justify-center group-hover:scale-110 transition-transform">
        <span className="text-2xl opacity-20 grayscale">🎴</span>
      </div>
      <span className="text-[10px] font-normal uppercase tracking-[0.2em] opacity-10">Empty Slot</span>
    </div>
  )

  const typeInfo = TREE_TYPES[card.type]
  if (!typeInfo) return null
  const styleClass = RARITY_CARD_STYLES[typeInfo.rarity] || "bg-white"

  return (
    <motion.div
      layout
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", damping: 15, stiffness: 200 }}
      className={`group relative rounded-lg p-3 flex flex-col items-center justify-between overflow-hidden shadow-2xl transition-all duration-500 ${styleClass}`}
    >
      {/* Decorative Corner Accents */}
      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-black/5 rounded-tl-xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-black/5 rounded-br-xl pointer-events-none" />

      {/* Rarity Tag */}
      <div className="absolute top-2 left-2 flex flex-col">
        <span className="text-[8px] font-normal uppercase tracking-[0.2em] opacity-30">{typeInfo.rarity}</span>
        {typeInfo.rarity === 'sacred' && (
          <span className="text-[6px] font-normal italic opacity-40 -mt-0.5 tracking-tighter">Sacred</span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 w-full pt-2">
        <div className="plant-icon-wrapper relative">
          <PlantIcon type={card.type} size={70} stage={card.stage} />
          {/* Subtle Glow beneath icon */}
          <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>
        <div className="text-center z-10 transition-transform group-hover:scale-105 duration-500">
          <h4 className="font-normal text-xs uppercase tracking-tight leading-none mb-0.5">{typeInfo.name}</h4>
          <p className="text-[9px] font-normal opacity-40 uppercase tracking-widest italic">Estate Collection</p>
        </div>
      </div>

      {/* Progress & Actions */}
      <div className="w-full mt-2 space-y-1.5 z-10">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[8px] font-normal uppercase tracking-widest opacity-40">
            <span>Growth Progress</span>
            <span>{Math.floor(card.progress)}%</span>
          </div>
          <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden border border-black/5">
            <motion.div 
              className="h-full bg-emerald-500 progress-bar shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              initial={{ width: 0 }}
              animate={{ width: `${card.progress}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            className="flex-1 py-1.5 rounded-md bg-black/5 hover:bg-black/10 text-[8px] font-normal uppercase tracking-[0.15em] transition-all opacity-40 hover:opacity-100 hover:scale-95"
            onClick={(e) => { e.stopPropagation(); alert("Trading system coming soon!"); }}
          >
            Initiate Trade
          </button>
        </div>
      </div>

      {/* Sell Overlay (Animated) */}
      <AnimatePresence>
        {card.stage === 4 && (
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            onClick={(e) => { e.stopPropagation(); sellCard(idx); }}
            className="absolute inset-0 bg-emerald-600/95 backdrop-blur-sm text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 rounded-lg"
          >
            <div className="flex flex-col items-center gap-2 -mt-4">
              <span className="text-4xl">💰</span>
              <span className="font-normal text-xs tracking-widest uppercase">Redeem Estate</span>
              <div className="px-4 py-1 rounded-full bg-white/20 text-[10px] font-normal">
                +{Math.floor(typeInfo.cost * 1.5)} {typeInfo.currency === 'sap' ? <PulpIcon size={12} /> : <GemIcon size={12} />}
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export const BinderView = memo(function BinderView({
  isOpen, onClose, theme, accent,
  sap, gems, grove, inventory, setSap, setGems, setInventory, setGrove
}: BinderViewProps) {

  const [page, setPage] = useState(0)
  const cardsPerPage = 8
  const totalPages = Math.max(1, Math.ceil(grove.length / cardsPerPage))
  const [plantingPlot, setPlantingPlot] = useState<number | null>(null)

  const sellCard = (idx: number) => {
    const tree = grove[idx]
    if (!tree || tree.stage < 4) return
    const typeInfo = TREE_TYPES[tree.type]
    const goldBack = Math.floor(typeInfo.cost * 1.5)
    if (typeInfo.currency === 'sap') setSap(s => s + goldBack)
    else setGems(g => g + goldBack)
    setGrove(g => g.filter((_, i) => i !== idx))
  }

  const plantFromInventory = (seedType: string, seedIdx: number) => {
    setInventory(inv => inv.filter((_, i) => i !== seedIdx))
    setGrove(g => [...g, {
      id: Date.now(),
      type: seedType,
      stage: 0,
      progress: 0,
      plantedAt: Date.now()
    }])
    setPlantingPlot(null)
  }

  if (!isOpen) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .binder-backdrop {
          background: radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%);
        }
        .binder-body {
          background: #121214;
          box-shadow: 0 100px 150px -50px rgba(0,0,0,0.8);
        }
        .binder-inner {
          background: #fbf9f6;
          box-shadow: inset 0 0 100px rgba(0,0,0,0.02);
        }
        .binder-inner-dark {
          background: #1a1a1e;
          box-shadow: inset 0 0 100px rgba(0,0,0,0.2);
        }
        .binder-spine-rings {
          background: linear-gradient(to right, #2a2a2e 0%, #3f3f46 50%, #2a2a2e 100%);
        }

        /* Card Rarity Effect Definitions */
        .card-common { @apply bg-white border-zinc-200 text-zinc-900 border shadow-sm; }
        .card-uncommon { @apply bg-emerald-50 border-emerald-200 text-emerald-900 border shadow-sm; }
        .card-rare { @apply bg-blue-50 border-blue-200 text-blue-900 border shadow-md; }
        .card-true-rare { @apply bg-violet-50 border-violet-200 text-violet-900 border shadow-lg; }
        .card-limited { @apply bg-orange-50 border-orange-200 text-orange-900 border shadow-md; }

        @keyframes gold-shine { 
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; } 
        }
        .card-premium {
          background: linear-gradient(135deg, #fffbeb 25%, #fde68a 50%, #fffbeb 75%);
          background-size: 200% 200%;
          border: 1px solid #fcd34d !important;
          animation: gold-shine 8s linear infinite;
        }

        @keyframes chroma-pulse {
          0% { border-color: #f43f5e; box-shadow: 0 0 15px rgba(244,63,94,0.15); }
          33% { border-color: #3b82f6; box-shadow: 0 0 15px rgba(59,130,246,0.15); }
          66% { border-color: #10b981; box-shadow: 0 0 15px rgba(16,185,129,0.15); }
          100% { border-color: #f43f5e; box-shadow: 0 0 15px rgba(244,63,94,0.15); }
        }
        .card-chroma {
          background: white;
          border: 3px solid transparent !important;
          animation: chroma-pulse 6s ease-in-out infinite;
        }

        @keyframes extinct-void {
          0% { box-shadow: 0 0 0px #000 inset; transform: scale(1); }
          50% { box-shadow: 0 0 50px rgba(0,0,0,0.5) inset; transform: scale(1.005); }
          100% { box-shadow: 0 0 0px #000 inset; transform: scale(1); }
        }
        @keyframes rotating {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .card-extinct {
          background: radial-gradient(circle at center, #1b1b1f 0%, #000000 100%);
          border: 1px solid #27272a !important;
          animation: extinct-void 5s ease-in-out infinite;
        }
        .card-extinct * { color: #f4f4f5 !important; }
        .card-extinct .plant-icon-wrapper { filter: brightness(0.9) contrast(1.1); animation: rotating 40s linear infinite; }
        .card-extinct .progress-bar { background: #52525b !important; }
      `}} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 binder-backdrop backdrop-blur-[2px]"
        onClick={() => {
          if (plantingPlot !== null) setPlantingPlot(null)
          else onClose()
        }}
      >
        <motion.div
          initial={{ y: 80, rotateX: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, rotateX: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, rotateX: 20, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-6xl h-[90vh] rounded-[3rem] flex flex-col binder-body border-[12px] border-[#18181b] overflow-hidden"
        >
          {/* Top Decorative Lip */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          
          {/* Binder Spine Mechanism */}
          <div className="absolute left-1/2 top-0 bottom-0 w-16 -translate-x-1/2 z-30 flex flex-col items-center justify-between py-12 pointer-events-none">
             <div className="absolute inset-0 binder-spine-rings opacity-30 shadow-[0_0_50px_rgba(0,0,0,0.5)]" />
             {[...Array(6)].map((_, i) => (
                <div key={i} className="relative w-12 h-6 flex items-center justify-center">
                   <div className="absolute w-[140%] h-[2px] bg-gradient-to-r from-zinc-600/50 via-zinc-400 to-zinc-600/50 blur-[0.5px]" />
                   <div className="w-10 h-3 rounded-full bg-[#18181b] shadow-inner border border-white/5" />
                </div>
             ))}
          </div>

          {/* Book Content */}
          <div className={`flex-1 flex overflow-hidden ${theme === 'dark' ? 'binder-inner-dark' : 'binder-inner'}`}>
             {/* Left Page */}
             <div className="flex-1 p-10 flex flex-col relative">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex flex-col">
                      <h2 className="text-3xl font-normal italic tracking-tighter text-zinc-900 dark:text-zinc-100 leading-none">PULP ESTATE</h2>
                      <span className="text-[10px] font-normal uppercase tracking-[0.3em] text-zinc-400 mt-2">Folio Archetype v2.4</span>
                   </div>
                   <div className="px-3 py-1 bg-black/5 rounded-full text-[10px] font-normal tracking-widest text-black">PG {page * 2 + 1}</div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 flex-1">
                   {[...Array(4)].map((_, i) => {
                      const globalIdx = page * cardsPerPage + i
                      const card = grove[globalIdx]
                      return <Card key={i} card={card} idx={globalIdx} sellCard={sellCard} theme={theme} />
                   })}
                </div>
             </div>

             {/* Right Page */}
             <div className="flex-1 p-10 flex flex-col relative border-l border-black/5">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-normal uppercase tracking-widest text-zinc-400">Yield Balance</span>
                         <div className="flex items-center gap-4 mt-1 font-normal text-sm">
                            <span className="flex items-center gap-1.5"><PulpIcon size={18} /> {sap}</span>
                            <span className="flex items-center gap-1.5"><GemIcon size={18} /> {gems}</span>
                         </div>
                      </div>
                   </div>
                   <div className="px-3 py-1 bg-black/5 rounded-full text-[10px] font-normal tracking-widest text-black">PG {page * 2 + 2}</div>
                </div>

                <div className="grid grid-cols-4 gap-4 flex-1">
                   {[...Array(4)].map((_, i) => {
                      const globalIdx = page * cardsPerPage + 4 + i
                      const card = grove[globalIdx]
                      return <Card key={i} card={card} idx={globalIdx} sellCard={sellCard} theme={theme} />
                   })}
                </div>
             </div>
          </div>

          {/* Control Dock */}
          <div className="h-28 bg-[#09090b] flex items-center px-16 justify-between z-40 relative shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
             <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="group flex flex-col items-center gap-1 transition-all disabled:opacity-20 hover:scale-105 active:scale-95"
             >
                <span className="text-[10px] font-normal uppercase tracking-widest text-black group-hover:text-white transition-colors">Previous</span>
                <div className="w-12 h-1 bg-zinc-700 rounded-full group-hover:bg-emerald-500 transition-colors" />
             </button>

             <div className="flex items-center gap-4">
                <div className="text-[10px] font-normal text-black bg-black/20 px-4 py-2 rounded-full uppercase tracking-[0.2em]">{page + 1} / {totalPages}</div>
                <button
                  onClick={() => setPlantingPlot(-1)}
                  className="flex items-center gap-4 px-10 py-4 rounded-lg bg-[#fbf9f6] text-[#121214] font-normal text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-white active:scale-95 transition-all group"
                >
                  <span className="text-xl -mt-1 group-hover:rotate-90 transition-transform">+</span> 
                  Deposit Asset
                </button>
             </div>

             <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="group flex flex-col items-center gap-1 transition-all disabled:opacity-20 hover:scale-105 active:scale-95"
             >
                <span className="text-[10px] font-normal uppercase tracking-widest text-black group-hover:text-white transition-colors">Next</span>
                <div className="w-12 h-1 bg-zinc-700 rounded-full group-hover:bg-emerald-500 transition-colors" />
             </button>
          </div>

          {/* Asset Deposit Overlay */}
          <AnimatePresence>
            {plantingPlot !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] flex items-center justify-center p-20 bg-black/80 backdrop-blur-xl"
                onClick={() => setPlantingPlot(null)}
              >
                <div 
                  className={`w-full max-w-2xl rounded-[2.5rem] p-12 flex flex-col gap-8 shadow-2xl border ${
                    theme === 'dark' ? 'bg-[#1a1a1e] border-zinc-800' : 'bg-white border-zinc-100'
                  }`}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                       <h3 className="text-2xl font-normal italic tracking-tighter uppercase leading-none">Select Asset</h3>
                       <span className="text-[10px] font-normal text-zinc-400 uppercase tracking-widest mt-2">{inventory.length} seeds available in cold storage</span>
                    </div>
                    <button onClick={() => setPlantingPlot(null)} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                    {inventory.length === 0 ? (
                      <div className="col-span-2 py-20 text-center text-zinc-400 italic font-serif opacity-40">Your cold storage is empty. Visit the Boutique to acquire new assets.</div>
                    ) : (
                      inventory.map((type, idx) => (
                        <button
                          key={idx}
                          onClick={() => plantFromInventory(type, idx)}
                          className="flex items-center gap-5 p-5 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 hover:bg-black/5 dark:hover:bg-white/5 hover:border-emerald-500/30 transition-all text-left group"
                        >
                          <div className="w-14 h-14 rounded-lg bg-black/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                             <PlantIcon type={type} size={40} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-normal text-sm uppercase tracking-tight">{TREE_TYPES[type].name}</span>
                            <span className="text-[9px] text-zinc-400 uppercase font-normal tracking-widest mt-1 italic">{TREE_TYPES[type].rarity}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  )
})
