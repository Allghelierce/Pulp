"use client"
import { memo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"

interface BoutiqueViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  sunshine: number
  gems: number
  inventory: string[]
  setSunshine: (v: number | ((p: number) => number)) => void
  setGems: (v: number | ((p: number) => number)) => void
  setInventory: (v: string[] | ((p: string[]) => string[])) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'true rare', 'premium', 'chroma', 'extinct', 'limited']

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-zinc-100 text-zinc-500',
  uncommon: 'bg-emerald-100 text-emerald-600',
  rare: 'bg-blue-100 text-blue-600',
  'true rare': 'bg-violet-100 text-violet-600',
  premium: 'bg-amber-400 text-white shadow-[0_0_10px_rgba(251,191,36,0.5)]',
  chroma: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]',
  extinct: 'bg-zinc-950 text-white shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-zinc-800',
  limited: 'bg-orange-500 text-white'
}

export const BoutiqueView = memo(function BoutiqueView({
  isOpen, onClose, theme, accent,
  sunshine, gems, inventory, setSunshine, setGems, setInventory, setGrove
}: BoutiqueViewProps) {

  const [activeTab, setActiveTab] = useState<'shop' | 'catalog' | 'inventory'>('shop')
  const [dailySeeds, setDailySeeds] = useState<string[]>([])
  const [shopStock, setShopStock] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!isOpen) return
    const lastReset = localStorage.getItem('pulp_last_shop_reset')
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`

    const getStockValue = () => {
      const r = Math.random() * 100
      if (r < 2) return 7      // 2% chance for 7
      if (r < 7) return 3      // 5% chance for 3
      if (r < 27) return 2     // 20% chance for 2
      return 1                 // Default 1
    }

    if (lastReset !== todayStr) {
      const allTypes = Object.keys(TREE_TYPES).filter(t => t !== 'spoiled')
      const selected: string[] = []
      const newStock: Record<string, number> = {}
      
      // Daily Selection
      for (let i = 0; i < 3; i++) {
        const weightedTypes = allTypes.filter(t => !selected.includes(t))
        if (weightedTypes.length === 0) break
        
        const totalWeight = weightedTypes.reduce((acc, t) => acc + TREE_TYPES[t].weight, 0)
        let r = Math.random() * totalWeight
        let picked = weightedTypes[0]
        
        for (const t of weightedTypes) {
          r -= TREE_TYPES[t].weight
          if (r <= 0) {
            picked = t
            break
          }
        }
        selected.push(picked)
        newStock[picked] = getStockValue()
      }

      // Nursery Selection
      Object.keys(TREE_TYPES).filter(t => TREE_TYPES[t].rarity === 'common' && t !== 'spoiled').forEach(t => {
        newStock[t] = getStockValue()
      })
      
      setDailySeeds(selected)
      setShopStock(newStock)
      localStorage.setItem('pulp_last_shop_reset', todayStr)
      localStorage.setItem('pulp_daily_seeds', JSON.stringify(selected))
      localStorage.setItem('pulp_shop_stock', JSON.stringify(newStock))
    } else {
      const savedSeeds = localStorage.getItem('pulp_daily_seeds')
      const savedStock = localStorage.getItem('pulp_shop_stock')
      if (savedSeeds) setDailySeeds(JSON.parse(savedSeeds))
      if (savedStock) setShopStock(JSON.parse(savedStock))
    }
  }, [isOpen])

  const buySeed = (type: string) => {
    if ((shopStock[type] || 0) <= 0) return
    if (inventory.length >= 40) {
      alert("Inventory is full (max 40 seeds)!")
      return
    }

    const typeInfo = TREE_TYPES[type]
    const hasFunds = typeInfo.currency === 'sunshine' ? sunshine >= typeInfo.cost : gems >= typeInfo.cost
    if (!hasFunds) return
    
    if (typeInfo.currency === 'sunshine') setSunshine(s => s - typeInfo.cost)
    else setGems(g => g - typeInfo.cost)

    // Update stock
    const nextStock = { ...shopStock, [type]: shopStock[type] - 1 }
    setShopStock(nextStock)
    localStorage.setItem('pulp_shop_stock', JSON.stringify(nextStock))

    // Add to inventory
    setInventory(inv => [...inv, type])
  }

  const discardSeed = (index: number) => {
    setInventory(inv => inv.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl rounded-3xl flex flex-col shadow-2xl border ${
          theme === 'dark' ? 'bg-[#0f0f12] border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'
        } overflow-hidden font-sans`}
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className={`flex p-1 rounded-xl ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <button 
                onClick={() => setActiveTab('shop')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'shop' 
                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' 
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                Today's Boutique
              </button>
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'inventory' 
                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' 
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                Inventory ({inventory.length}/40)
              </button>
              <button 
                onClick={() => setActiveTab('catalog')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'catalog' 
                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' 
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                Catalog
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <svg className="w-5 h-5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[75vh]">
          {activeTab === 'shop' ? (
            <div className="p-8 space-y-10">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Limited Selection</h2>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Refocussing in 24h</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {dailySeeds.map(type => (
                    <button
                      key={type}
                      onClick={() => buySeed(type)}
                      disabled={(shopStock[type] || 0) <= 0 || (TREE_TYPES[type].currency === 'sunshine' ? sunshine < TREE_TYPES[type].cost : gems < TREE_TYPES[type].cost)}
                      className={`flex items-center gap-6 p-6 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                        (shopStock[type] || 0) <= 0
                          ? 'opacity-60 grayscale bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                          : (TREE_TYPES[type].currency === 'sunshine' ? sunshine < TREE_TYPES[type].cost : gems < TREE_TYPES[type].cost)
                          ? 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'
                      }`}
                    >
                       <div className={`absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-tighter ${RARITY_COLORS[TREE_TYPES[type].rarity]}`}>
                        {TREE_TYPES[type].rarity}
                      </div>
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 group-hover:scale-105 transition-transform overflow-visible">
                        <PlantIcon type={type} size={48} />
                      </div>
                      <div className="flex-1">
                        <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100">{TREE_TYPES[type].name}</span>
                        {(shopStock[type] || 0) <= 0 ? (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 block">OUT OF STOCK</span>
                        ) : (
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-xs text-zinc-500">A rare prospect for your collection.</p>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{shopStock[type]} in stock</span>
                          </div>
                        )}
                        <div className={`inline-flex mt-3 px-3 py-1 rounded-lg font-bold text-xs ${
                          TREE_TYPES[type].currency === 'gems' ? 'bg-purple-500/10 text-purple-600' : 'bg-orange-500/10 text-orange-600'
                        }`}>
                          {TREE_TYPES[type].cost} {TREE_TYPES[type].currency === 'sunshine' ? '☀️' : '💎'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Basic Nursery</h2>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(TREE_TYPES).filter(t => TREE_TYPES[t].rarity === 'common' && t !== 'spoiled').map(type => (
                    <button
                      key={type}
                      onClick={() => buySeed(type)}
                      disabled={(shopStock[type] || 0) <= 0 || sunshine < TREE_TYPES[type].cost}
                      className={`flex flex-col p-5 rounded-2xl border transition-all text-left relative group ${
                        (shopStock[type] || 0) <= 0
                          ? 'opacity-60 grayscale bg-zinc-50 dark:bg-zinc-900'
                          : sunshine < TREE_TYPES[type].cost
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 mb-4 overflow-visible">
                        <PlantIcon type={type} size={28} />
                      </div>
                      <span className="font-bold text-sm">{TREE_TYPES[type].name}</span>
                      {(shopStock[type] || 0) <= 0 ? (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 block">OUT OF STOCK</span>
                      ) : (
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 font-bold text-xs text-zinc-500">
                            {TREE_TYPES[type].cost} ☀️
                          </div>
                          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{shopStock[type]} left</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : activeTab === 'inventory' ? (
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Your Seed Storage</h2>
                <span className="text-[10px] font-bold text-zinc-400">{inventory.length}/40 Seeds</span>
              </div>
              
              {inventory.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto opacity-40">
                    ☀️
                  </div>
                  <p className="text-sm text-zinc-400 font-medium">Your inventory is currently empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {inventory.map((type, idx) => (
                    <div
                      key={`${type}-${idx}`}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 group"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-visible">
                        <PlantIcon type={type} size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-sm truncate">{TREE_TYPES[type].name}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${RARITY_COLORS[TREE_TYPES[type].rarity]}`}>
                          {TREE_TYPES[type].rarity}
                        </span>
                      </div>
                      <button 
                        onClick={() => discardSeed(idx)}
                        className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 space-y-12">
              {RARITY_ORDER.map(rarity => {
                const plants = Object.keys(TREE_TYPES).filter(t => TREE_TYPES[t].rarity === rarity)
                if (plants.length === 0) return null
                return (
                  <section key={rarity} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${RARITY_COLORS[rarity]}`}>
                        {rarity}
                      </h3>
                      <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      {plants.map(type => (
                        <div key={type} className="flex flex-col items-center text-center group">
                          <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center mb-3 transition-all ${
                            theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
                          }`}>
                            <PlantIcon type={type} size={40} />
                          </div>
                          <span className="block text-[11px] font-bold text-zinc-900 dark:text-zinc-100">{TREE_TYPES[type].name}</span>
                          <span className="block text-[9px] font-medium text-zinc-400 mt-1">
                            {TREE_TYPES[type].weight ? `${(TREE_TYPES[type].weight * 100).toFixed(1)}%` : '---'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>

        <footer className="p-6 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                <div className="flex items-center gap-1.5"><span className="text-sm">☀️</span> {sunshine}</div>
                <div className="flex items-center gap-1.5"><span className="text-sm">💎</span> {gems}</div>
              </div>
           </div>
           <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest opacity-50">Botanical Inventory v2.0</p>
        </footer>
      </motion.div>
    </motion.div>
  )
})
