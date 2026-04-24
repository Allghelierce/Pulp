"use client"
import { memo, useState, useEffect } from "react"
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
  unlockedCosmetics: string[]
  setUnlockedCosmetics: (v: string[] | ((p: string[]) => string[])) => void
  onUpdateConfig: (updates: Record<string, any>) => void
}

const GEM_COSMETICS = [
  { id: 'color_gold', name: 'Liquid Gold', type: 'accent', value: '#b8860b', cost: 8 },
  { id: 'color_midnight', name: 'Midnight Ink', type: 'accent', value: '#191970', cost: 8 },
  { id: 'color_ember', name: 'Ember', type: 'accent', value: '#cc5500', cost: 8 },
  { id: 'color_seafoam', name: 'Seafoam', type: 'accent', value: '#2e8b57', cost: 8 },
  { id: 'color_plum', name: 'Dark Plum', type: 'accent', value: '#3c1361', cost: 8 },
  { id: 'ink_vintage', name: 'Vintage Sepia', type: 'ink', value: 'vintage', cost: 12 },
  { id: 'ink_blueprint', name: 'Blueprint Blue', type: 'ink', value: 'blueprint', cost: 12 },
  { id: 'ink_emerald', name: 'Emerald Script', type: 'ink', value: 'emerald', cost: 12 },
  { id: 'paper_parchment', name: 'Aged Parchment', type: 'paper', value: 'parchment', cost: 15 },
  { id: 'paper_midnight', name: 'Midnight Paper', type: 'paper', value: 'midnight', cost: 15 },
]

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'true rare', 'premium', 'chroma', 'extinct']

const RARITY_STYLE: Record<string, string> = {
  common: 'text-zinc-400',
  uncommon: 'text-emerald-500',
  rare: 'text-blue-500',
  'true rare': 'text-violet-500',
  premium: 'text-amber-500',
  chroma: 'text-pink-500',
  extinct: 'text-red-500',
}

const RARITY_DOT: Record<string, string> = {
  common: 'bg-zinc-400',
  uncommon: 'bg-emerald-500',
  rare: 'bg-blue-500',
  'true rare': 'bg-violet-500',
  premium: 'bg-amber-400',
  chroma: 'bg-pink-500',
  extinct: 'bg-red-600',
}

type TabId = 'shop' | 'cosmetics' | 'inventory' | 'catalog'

const TABS: { id: TabId; label: string; group: string }[] = [
  { id: 'shop', label: 'Daily Seeds', group: 'Shop' },
  { id: 'cosmetics', label: 'Gem Shop', group: 'Shop' },
  { id: 'inventory', label: 'My Seeds', group: 'Collection' },
  { id: 'catalog', label: 'Catalog', group: 'Collection' },
]

const TAB_DESCRIPTIONS: Record<TabId, string> = {
  shop: 'Browse today\'s rotating seed selection',
  cosmetics: 'Exclusive cosmetics purchased with gems',
  inventory: 'Seeds you own, ready to plant',
  catalog: 'Complete seed encyclopedia',
}

function CurrencyIcon({ type, size = 12 }: { type: 'sunshine' | 'gems'; size?: number }) {
  if (type === 'sunshine') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill="#fbbf24" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <line key={a} x1="12" y1="3" x2="12" y2="1" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${a} 12 12)`} />
      ))}
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#a78bfa" />
    </svg>
  )
}

export const BoutiqueView = memo(function BoutiqueView({
  isOpen, onClose, theme, accent,
  sunshine, gems, inventory, setSunshine, setGems, setInventory, setGrove,
  unlockedCosmetics, setUnlockedCosmetics, onUpdateConfig
}: BoutiqueViewProps) {

  const [activeTab, setActiveTab] = useState<TabId>('shop')
  const [dailySeeds, setDailySeeds] = useState<string[]>([])
  const [shopStock, setShopStock] = useState<Record<string, number>>({})
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const lastReset = localStorage.getItem('pulp_last_shop_reset')
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`

    const getStockValue = () => {
      const r = Math.random() * 100
      if (r < 2) return 7
      if (r < 7) return 3
      if (r < 27) return 2
      return 1
    }

    if (lastReset !== todayStr) {
      const allTypes = Object.keys(TREE_TYPES).filter(t => t !== 'spoiled')
      const selected: string[] = []
      const newStock: Record<string, number> = {}

      for (let i = 0; i < 3; i++) {
        const weightedTypes = allTypes.filter(t => !selected.includes(t))
        if (weightedTypes.length === 0) break
        const totalWeight = weightedTypes.reduce((acc, t) => acc + TREE_TYPES[t].weight, 0)
        let r = Math.random() * totalWeight
        let picked = weightedTypes[0]
        for (const t of weightedTypes) {
          r -= TREE_TYPES[t].weight
          if (r <= 0) { picked = t; break }
        }
        selected.push(picked)
        newStock[picked] = getStockValue()
      }

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
    if ((shopStock[type] || 0) <= 0 || inventory.length >= 40) return
    const typeInfo = TREE_TYPES[type]
    const hasFunds = typeInfo.currency === 'sunshine' ? sunshine >= typeInfo.cost : gems >= typeInfo.cost
    if (!hasFunds) return
    if (typeInfo.currency === 'sunshine') setSunshine(s => s - typeInfo.cost)
    else setGems(g => g - typeInfo.cost)
    const nextStock = { ...shopStock, [type]: shopStock[type] - 1 }
    setShopStock(nextStock)
    localStorage.setItem('pulp_shop_stock', JSON.stringify(nextStock))
    setInventory(inv => [...inv, type])
  }

  const discardSeed = (index: number) => setInventory(inv => inv.filter((_, i) => i !== index))

  const buyCosmetic = (c: typeof GEM_COSMETICS[number]) => {
    if (gems < c.cost || unlockedCosmetics.includes(c.id)) return
    setGems(g => g - c.cost)
    setUnlockedCosmetics(prev => [...prev, c.id])
  }

  const applyCosmetic = (c: typeof GEM_COSMETICS[number]) => {
    if (c.type === 'accent') onUpdateConfig({ accentColor: c.value })
  }

  if (!isOpen) return null

  const groups = Array.from(new Set(TABS.map(t => t.group))).map(g => ({
    name: g, tabs: TABS.filter(t => t.group === g),
  }))

  const SeedRow = ({ type, soldOut, cantAfford, onBuy }: { type: string; soldOut: boolean; cantAfford: boolean; onBuy: () => void }) => {
    const t = TREE_TYPES[type]
    return (
      <button
        onClick={onBuy}
        disabled={soldOut || cantAfford}
        className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-all ${
          soldOut ? 'opacity-30' : cantAfford ? 'opacity-45' : isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50/80'
        }`}
      >
        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-100/80'}`}>
          <PlantIcon type={type} size={18} isSeed={true} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[12.5px] font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{t.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-1 h-1 rounded-full shrink-0 ${RARITY_DOT[t.rarity]}`} />
            <span className={`text-[9.5px] font-semibold uppercase tracking-wider ${RARITY_STYLE[t.rarity]}`}>{t.rarity}</span>
            {soldOut && <span className={`text-[9px] ml-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>sold out</span>}
            {!soldOut && shopStock[type] !== undefined && <span className={`text-[9px] ml-1 ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>{shopStock[type]} left</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <CurrencyIcon type={t.currency} size={11} />
          <span className={`text-[12px] font-semibold tabular-nums ${
            t.currency === 'gems' ? isDark ? 'text-purple-400' : 'text-purple-600' : isDark ? 'text-amber-400' : 'text-amber-600'
          }`}>{t.cost}</span>
        </div>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onMouseDown={onClose}>
      <div onMouseDown={e => e.stopPropagation()} className={`relative w-full max-w-[900px] ${isDark ? "bg-[#0a0a0c] text-zinc-100 border-zinc-800/80" : "bg-[#f5f3f1] text-zinc-900 border-zinc-200/80"} rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border flex overflow-hidden`} style={{ height: 620 }}>

        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-20 w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        {/* ── Sidebar ── */}
        <div className={`w-[200px] ${isDark ? "bg-[#060608] border-zinc-800/80" : "bg-[#ece8e5] border-zinc-200/70"} border-r flex flex-col shrink-0`}>
          <div className="px-5 pt-6 pb-4">
            <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Boutique</p>
          </div>

          {/* Currency display */}
          <div className={`mx-3 mb-3 p-3 rounded-lg ${isDark ? 'bg-zinc-900/60' : 'bg-white/60'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CurrencyIcon type="sunshine" size={13} />
              <span className={`text-[12px] font-semibold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{sunshine}</span>
              <span className={`text-[9px] uppercase tracking-wider ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>sunshine</span>
            </div>
            <div className="flex items-center gap-2">
              <CurrencyIcon type="gems" size={13} />
              <span className={`text-[12px] font-semibold tabular-nums ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{gems}</span>
              <span className={`text-[9px] uppercase tracking-wider ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>gems</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
            {groups.map(group => (
              <div key={group.name} className="mb-1">
                <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>{group.name}</p>
                {group.tabs.map(tab => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
                        isActive
                          ? isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                          : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
          <div className={`px-5 py-4 border-t ${isDark ? "border-zinc-800" : "border-zinc-200/60"}`}>
            <p className={`text-[10px] font-medium ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>{inventory.length}/40 seeds</p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`px-8 pt-6 pb-4 border-b ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"} shrink-0`}>
            <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
              {TAB_DESCRIPTIONS[activeTab]}
            </p>
          </div>

          <div className={`flex-1 overflow-y-auto px-8 py-5 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f5f3f1]'}`}>

            {/* ── Shop ── */}
            {activeTab === 'shop' && (
              <div className="space-y-5">
                {/* Featured */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Featured Today</p>
                    <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>Refreshes daily</span>
                  </div>
                  <div className={`rounded-xl border overflow-hidden divide-y ${isDark ? 'bg-zinc-900/30 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200/80 divide-zinc-100'}`}>
                    {dailySeeds.map(type => {
                      const t = TREE_TYPES[type]
                      const soldOut = (shopStock[type] || 0) <= 0
                      const cantAfford = t.currency === 'sunshine' ? sunshine < t.cost : gems < t.cost
                      return <SeedRow key={type} type={type} soldOut={soldOut} cantAfford={cantAfford} onBuy={() => buySeed(type)} />
                    })}
                  </div>
                </div>

                {/* Always Available */}
                <div>
                  <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Always Available</p>
                  <div className={`rounded-xl border overflow-hidden divide-y ${isDark ? 'bg-zinc-900/30 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200/80 divide-zinc-100'}`}>
                    {Object.keys(TREE_TYPES).filter(t => TREE_TYPES[t].rarity === 'common' && t !== 'spoiled').map(type => {
                      const soldOut = (shopStock[type] || 0) <= 0
                      return <SeedRow key={type} type={type} soldOut={soldOut} cantAfford={sunshine < TREE_TYPES[type].cost} onBuy={() => buySeed(type)} />
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Cosmetics ── */}
            {activeTab === 'cosmetics' && (
              <div className="space-y-5">
                {/* Get Gems */}
                <div>
                  <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Get Gems</p>
                  <div className={`rounded-xl border overflow-hidden divide-y ${isDark ? 'bg-zinc-900/30 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200/80 divide-zinc-100'}`}>
                    {[
                      { id: 'gems_10', amount: 10, cost: 25, label: 'Small Pouch' },
                      { id: 'gems_30', amount: 30, cost: 60, label: 'Gem Satchel' },
                      { id: 'gems_75', amount: 75, cost: 120, label: 'Treasure Chest', best: true },
                      { id: 'gems_200', amount: 200, cost: 250, label: 'Royal Vault' },
                    ].map(pack => (
                      <div key={pack.id} className="flex items-center gap-3.5 px-4 py-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-100/80'}`}>
                          <CurrencyIcon type="gems" size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-[12.5px] font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{pack.label}</p>
                            {(pack as any).best && <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${isDark ? 'bg-purple-950/60 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>Best value</span>}
                          </div>
                          <span className={`text-[9.5px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            {pack.amount} gems
                          </span>
                        </div>
                        <button
                          onClick={() => { if (sunshine >= pack.cost) { setSunshine((s: number) => s - pack.cost); setGems((g: number) => g + pack.amount) } }}
                          disabled={sunshine < pack.cost}
                          className={`flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                            sunshine < pack.cost
                              ? 'opacity-40 cursor-not-allowed'
                              : isDark ? 'text-amber-400 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-900/50' : 'text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100'
                          }`}
                        >
                          <CurrencyIcon type="sunshine" size={10} />
                          {pack.cost}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {(['accent', 'ink', 'paper'] as const).map(category => {
                  const items = GEM_COSMETICS.filter(c => c.type === category)
                  const label = category === 'accent' ? 'Accent Colors' : category === 'ink' ? 'Ink Styles' : 'Paper Textures'
                  return (
                    <div key={category}>
                      <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{label}</p>
                      <div className={`rounded-xl border overflow-hidden divide-y ${isDark ? 'bg-zinc-900/30 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200/80 divide-zinc-100'}`}>
                        {items.map(cosmetic => {
                          const owned = unlockedCosmetics.includes(cosmetic.id)
                          const cantAfford = gems < cosmetic.cost
                          return (
                            <div key={cosmetic.id} className={`flex items-center gap-3.5 px-4 py-3`}>
                              <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-100/80'}`}>
                                {cosmetic.type === 'accent' ? (
                                  <div className="w-4.5 h-4.5 rounded-full shadow-sm" style={{ backgroundColor: cosmetic.value, width: 18, height: 18 }} />
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#a1a1aa' : '#71717a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {cosmetic.type === 'ink' ? (
                                      <><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /></>
                                    ) : (
                                      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>
                                    )}
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[12.5px] font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{cosmetic.name}</p>
                                <span className={`text-[9.5px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                  {cosmetic.type === 'accent' ? 'Accent color' : cosmetic.type === 'ink' ? 'Ink style' : 'Paper texture'}
                                </span>
                              </div>
                              {owned ? (
                                <button
                                  onClick={() => applyCosmetic(cosmetic)}
                                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                                    isDark ? 'text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-900/50' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100'
                                  }`}
                                >
                                  {cosmetic.type === 'accent' ? 'Apply' : 'Owned'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => buyCosmetic(cosmetic)}
                                  disabled={cantAfford}
                                  className={`flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                                    cantAfford
                                      ? 'opacity-40 cursor-not-allowed'
                                      : isDark ? 'text-purple-400 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-900/50' : 'text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-100'
                                  }`}
                                >
                                  <CurrencyIcon type="gems" size={10} />
                                  {cosmetic.cost}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Inventory ── */}
            {activeTab === 'inventory' && (
              <div>
                {inventory.length === 0 ? (
                  <div className="py-20 text-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`mx-auto mb-3 ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <p className={`text-[13px] font-medium ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>No seeds yet</p>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-700' : 'text-zinc-400/70'}`}>Purchase seeds from the shop to get started.</p>
                  </div>
                ) : (
                  <div className={`rounded-xl border overflow-hidden divide-y ${isDark ? 'bg-zinc-900/30 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200/80 divide-zinc-100'}`}>
                    {inventory.map((type, idx) => {
                      const t = TREE_TYPES[type]
                      return (
                        <div key={`${type}-${idx}`} className="flex items-center gap-3.5 px-4 py-3 group">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-100/80'}`}>
                            <PlantIcon type={type} size={18} isSeed={true} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12.5px] font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{t.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className={`w-1 h-1 rounded-full shrink-0 ${RARITY_DOT[t.rarity]}`} />
                              <span className={`text-[9.5px] font-semibold uppercase tracking-wider ${RARITY_STYLE[t.rarity]}`}>{t.rarity}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => discardSeed(idx)}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium px-2.5 py-1 rounded-md ${
                              isDark ? 'text-red-400 hover:bg-red-950/40' : 'text-red-500 hover:bg-red-50'
                            }`}
                          >
                            Discard
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Catalog ── */}
            {activeTab === 'catalog' && (
              <div className="space-y-5">
                {RARITY_ORDER.map(rarity => {
                  const plants = Object.keys(TREE_TYPES).filter(t => TREE_TYPES[t].rarity === rarity && t !== 'spoiled')
                  if (plants.length === 0) return null
                  return (
                    <div key={rarity}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${RARITY_DOT[rarity]}`} />
                        <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] capitalize ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{rarity}</p>
                        <div className={`flex-1 h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-200/80'}`} />
                      </div>
                      <div className={`rounded-xl border overflow-hidden divide-y ${isDark ? 'bg-zinc-900/30 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200/80 divide-zinc-100'}`}>
                        {plants.map(type => {
                          const t = TREE_TYPES[type]
                          return (
                            <div key={type} className="flex items-center gap-3.5 px-4 py-2.5">
                              <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-100/80'}`}>
                                <PlantIcon type={type} size={18} isSeed={true} />
                              </div>
                              <p className={`flex-1 text-[12.5px] font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{t.name}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <CurrencyIcon type={t.currency} size={11} />
                                <span className={`text-[12px] font-semibold tabular-nums ${
                                  t.currency === 'gems' ? isDark ? 'text-purple-400' : 'text-purple-600' : isDark ? 'text-amber-400' : 'text-amber-600'
                                }`}>{t.cost}</span>
                              </div>
                              <span className={`text-[10px] tabular-nums w-10 text-right ${isDark ? 'text-zinc-700' : 'text-zinc-400'}`}>
                                {t.weight ? `${(t.weight * 100).toFixed(1)}%` : '---'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
