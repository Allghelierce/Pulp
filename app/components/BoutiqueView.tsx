"use client"
import { memo, useState, useEffect, useRef } from "react"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"
import { ACCENT_COLORS, FONT_OPTIONS, HEADING_FONT_OPTIONS, PAGE_STYLE_OPTIONS } from "./settings/SettingsView"

export type TabId = 'shop' | 'gems' | 'bag' | 'catalog'

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
  initialTab?: TabId
  initialScrollTo?: string
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

const RARITY_LABEL: Record<string, string> = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare',
  'true rare': 'True Rare', premium: 'Premium', chroma: 'Chroma', extinct: 'Extinct',
}

const RARITY_COLOR: Record<string, string> = {
  common: '#a1a1aa', uncommon: '#34d399', rare: '#60a5fa',
  'true rare': '#a78bfa', premium: '#fbbf24', chroma: '#f472b6', extinct: '#f87171',
}

const RARITY_BG: Record<string, string> = {
  common: 'linear-gradient(180deg, #1a1e14 0%, #1e2616 50%, #22301a 100%)',
  uncommon: 'linear-gradient(180deg, #0e1a16 0%, #122820 50%, #163228 100%)',
  rare: 'linear-gradient(180deg, #0e1420 0%, #121e30 50%, #162840 100%)',
  'true rare': 'linear-gradient(180deg, #16102a 0%, #1e1638 50%, #261c46 100%)',
  premium: 'linear-gradient(180deg, #1a1610 0%, #28201a 50%, #362a20 100%)',
  chroma: 'linear-gradient(180deg, #1a0e1e 0%, #28142e 50%, #361a3e 100%)',
  extinct: 'linear-gradient(180deg, #1a0a0a 0%, #2a1010 50%, #3a1616 100%)',
}

const TOTAL_WEIGHT = Object.keys(TREE_TYPES).filter(t => t !== 'spoiled').reduce((sum, t) => sum + TREE_TYPES[t].weight, 0)

function getDropChance(weight: number): string {
  const pct = (weight / TOTAL_WEIGHT) * 100
  if (pct >= 1) return `${pct.toFixed(0)}%`
  if (pct >= 0.1) return `${pct.toFixed(1)}%`
  return `${pct.toFixed(2)}%`
}

const font = '"EB Garamond", Georgia, serif'

function rarityPlantClass(rarity: string): string {
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

function rarityCardClass(rarity: string): string {
  switch (rarity) {
    case 'rare': return 'rarity-card-rare'
    case 'true rare': return 'rarity-card-true-rare'
    case 'premium': return 'rarity-card-premium'
    case 'chroma': return 'rarity-card-chroma'
    case 'extinct': return 'rarity-card-extinct'
    default: return ''
  }
}

function Sparkles({ rarity, count }: { rarity: string; count: number }) {
  if (!['premium', 'chroma', 'extinct'].includes(rarity)) return null
  const cls = rarity === 'premium' ? 'sparkle-premium' : rarity === 'chroma' ? 'sparkle-chroma' : 'sparkle-extinct'
  return (
    <div className="sparkle-container">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`sparkle ${cls}`}
          style={{
            width: 3 + Math.random() * 4,
            height: 3 + Math.random() * 4,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * (3 / count)}s`,
          }}
        />
      ))}
    </div>
  )
}

export const BoutiqueView = memo(function BoutiqueView({
  isOpen, onClose, theme, accent,
  sunshine, gems, inventory, setSunshine, setGems, setInventory, setGrove,
  unlockedCosmetics, setUnlockedCosmetics, onUpdateConfig,
  initialTab, initialScrollTo
}: BoutiqueViewProps) {

  const [activeTab, setActiveTab] = useState<TabId>('shop')
  const [dailySeeds, setDailySeeds] = useState<string[]>([])
  const [shopStock, setShopStock] = useState<Record<string, number>>({})
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null)
  const [previewStage, setPreviewStage] = useState(3)
  const [highlightItem, setHighlightItem] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDark = theme === 'dark'

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
      if (initialScrollTo) {
        setHighlightItem(initialScrollTo)
        setTimeout(() => {
          const el = document.getElementById(`gem-item-${initialScrollTo}`)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setTimeout(() => setHighlightItem(null), 2000)
        }, 100)
      }
    }
  }, [isOpen, initialTab, initialScrollTo])

  const bg = isDark ? '#0a0a0c' : '#f5f3f1'
  const cardBg = isDark ? 'rgba(24,24,27,0.5)' : '#ffffff'
  const cardBorder = isDark ? 'rgba(39,39,42,0.6)' : 'rgba(228,228,231,0.8)'
  const textPrimary = isDark ? '#e4e4e7' : '#18181b'
  const textSecondary = isDark ? '#71717a' : '#71717a'
  const textMuted = isDark ? '#52525b' : '#a1a1aa'
  const dividerColor = isDark ? 'rgba(39,39,42,0.6)' : 'rgba(228,228,231,0.8)'

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPlant) setSelectedPlant(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose, selectedPlant])

  useEffect(() => {
    if (!isOpen) return
    const lastReset = localStorage.getItem('pulp_last_shop_reset')
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
    const getStockValue = () => {
      const r = Math.random() * 100
      if (r < 2) return 7; if (r < 7) return 3; if (r < 27) return 2; return 1
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
        for (const t of weightedTypes) { r -= TREE_TYPES[t].weight; if (r <= 0) { picked = t; break } }
        selected.push(picked)
        newStock[picked] = getStockValue()
      }
      Object.keys(TREE_TYPES).filter(t => TREE_TYPES[t].rarity === 'common' && t !== 'spoiled').forEach(t => { newStock[t] = getStockValue() })
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
    const t = TREE_TYPES[type]
    const hasFunds = t.currency === 'sunshine' ? sunshine >= t.cost : gems >= t.cost
    if (!hasFunds) return
    if (t.currency === 'sunshine') setSunshine((s: number) => s - t.cost)
    else setGems((g: number) => g - t.cost)
    const nextStock = { ...shopStock, [type]: shopStock[type] - 1 }
    setShopStock(nextStock)
    localStorage.setItem('pulp_shop_stock', JSON.stringify(nextStock))
    setInventory(inv => [...inv, type])
  }

  const discardSeed = (index: number) => setInventory(inv => inv.filter((_, i) => i !== index))

  const buyCosmetic = (c: typeof GEM_COSMETICS[number]) => {
    if (gems < c.cost || unlockedCosmetics.includes(c.id)) return
    setGems((g: number) => g - c.cost)
    setUnlockedCosmetics(prev => [...prev, c.id])
  }

  const applyCosmetic = (c: typeof GEM_COSMETICS[number]) => {
    if (c.type === 'accent') onUpdateConfig({ accentColor: c.value })
  }

  if (!isOpen) return null

  const STAGE_NAMES = ['Seed', 'Seedling', 'Sprout', 'Young', 'Mature']
  const previewInfo = selectedPlant ? TREE_TYPES[selectedPlant] : null

  const CurrencyPill = ({ type, amount }: { type: 'sunshine' | 'gems'; amount: number }) => (
    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"} border rounded-full px-2.5 py-1`} style={{ color: type === 'gems' ? '#a78bfa' : '#d97706' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {type === 'gems'
          ? <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
          : <><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42"/></>
        }
      </svg>
      {amount >= 999999 ? '∞' : amount.toLocaleString()}
    </span>
  )

  const tabs: { id: TabId; label: string }[] = [
    { id: 'shop', label: 'Shop' },
    { id: 'gems', label: 'Gems' },
    { id: 'bag', label: 'My Seeds' },
    { id: 'catalog', label: 'Catalog' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onMouseDown={onClose}>
      <div
        onMouseDown={e => e.stopPropagation()}
        className={`relative w-full max-w-[1000px] rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border overflow-hidden flex flex-col ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"}`}
        style={{ backgroundColor: bg, height: 740 }}
      >
        {/* ── Header ── */}
        <div className={`px-6 pt-5 pb-4 border-b shrink-0 flex items-center justify-between ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"}`}>
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedPlant(null) }}
                className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-all ${
                  activeTab === tab.id
                    ? isDark ? "bg-zinc-800 text-white shadow-sm" : "bg-white text-zinc-900 shadow-sm"
                    : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <CurrencyPill type="sunshine" amount={sunshine} />
            <CurrencyPill type="gems" amount={gems} />
            <button
              onClick={onClose}
              className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ml-2 ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* ── Plant Preview (when selected) ── */}
        {selectedPlant && previewInfo && (
          <div style={{ flexShrink: 0, borderBottom: `1px solid ${dividerColor}` }}>
            {/* Compact header bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px',
              borderBottom: `1px solid ${dividerColor}`,
              backgroundColor: isDark ? 'rgba(24,24,27,0.5)' : 'rgba(255,255,255,0.6)',
            }}>
              <button
                onClick={() => setSelectedPlant(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: textSecondary, fontFamily: font, fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Back
              </button>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: textPrimary, fontFamily: font }}>{previewInfo.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: RARITY_COLOR[previewInfo.rarity], marginLeft: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {RARITY_LABEL[previewInfo.rarity]}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CurrencyPill type={previewInfo.currency} amount={previewInfo.cost} />
                <button
                  onClick={() => buySeed(selectedPlant!)}
                  disabled={(shopStock[selectedPlant!] || 0) <= 0 || (previewInfo.currency === 'sunshine' ? sunshine < previewInfo.cost : gems < previewInfo.cost)}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${isDark ? "bg-zinc-200 text-zinc-900 hover:bg-white" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}
                  style={{
                    fontFamily: font, cursor: 'pointer', border: 'none',
                    opacity: ((shopStock[selectedPlant!] || 0) <= 0 || (previewInfo.currency === 'sunshine' ? sunshine < previewInfo.cost : gems < previewInfo.cost)) ? 0.3 : 1,
                  }}
                >
                  {(shopStock[selectedPlant!] || 0) <= 0 ? 'Sold out' : 'Buy Seed'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: bg }}>

          {/* ── SHOP ── */}
          {activeTab === 'shop' && !selectedPlant && (
            <div style={{ padding: 24 }}>
              {/* Featured */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Featured Today</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#34d399', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Refreshes daily</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  {dailySeeds.map(type => <PlantCard key={type} type={type} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} textPrimary={textPrimary} textMuted={textMuted} shopStock={shopStock} onClick={() => { setSelectedPlant(type); setPreviewStage(3) }} featured />)}
                </div>
              </div>

              {/* By rarity */}
              {RARITY_ORDER.map(rarity => {
                const plants = Object.keys(TREE_TYPES).filter(t => TREE_TYPES[t].rarity === rarity && t !== 'spoiled' && !dailySeeds.includes(t))
                if (plants.length === 0) return null
                return (
                  <div key={rarity} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: RARITY_COLOR[rarity] }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{RARITY_LABEL[rarity]}</span>
                      <div style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                      {plants.map(type => <PlantCard key={type} type={type} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} textPrimary={textPrimary} textMuted={textMuted} shopStock={shopStock} onClick={() => { setSelectedPlant(type); setPreviewStage(3) }} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'shop' && selectedPlant && previewInfo && (
            <div style={{ padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Large plant preview */}
              <div style={{
                width: '100%', maxWidth: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                borderRadius: 16, overflow: 'hidden', position: 'relative',
                height: 280,
                background: previewInfo.sceneBg || (isDark ? 'linear-gradient(180deg, #1a1a1e 0%, #141416 100%)' : 'linear-gradient(180deg, #f0ede8 0%, #e8e4dd 100%)'),
              }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(180deg, transparent 0%, rgba(40,32,20,0.35) 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)', borderRadius: 16, pointerEvents: 'none' }} />
                <Sparkles rarity={previewInfo.rarity} count={8} />
                <div className={previewStage >= 4 ? rarityPlantClass(previewInfo.rarity) : ''} style={{ position: 'relative', marginBottom: 8 }}>
                  {previewStage === 0
                    ? <PlantIcon type={selectedPlant!} size={160} isSeed />
                    : <PlantIcon type={selectedPlant!} size={160} stage={previewStage - 1} />
                  }
                </div>
              </div>

              {/* Stage label */}
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary, fontFamily: font }}>
                  {STAGE_NAMES[previewStage]}
                </span>
                <span style={{ fontSize: 11, color: textMuted, fontFamily: font, marginLeft: 8 }}>
                  Stage {previewStage + 1} of {STAGE_NAMES.length}
                </span>
              </div>

              {/* Slider */}
              <div style={{ width: '100%', maxWidth: 400, marginTop: 12, padding: '0 4px' }}>
                <input
                  type="range"
                  min={0}
                  max={STAGE_NAMES.length - 1}
                  value={previewStage}
                  onChange={e => setPreviewStage(Number(e.target.value))}
                  className="boutique-slider"
                  style={{
                    width: '100%', height: 4, appearance: 'none', WebkitAppearance: 'none',
                    background: `linear-gradient(90deg, ${isDark ? '#52525b' : '#a1a1aa'} 0%, ${isDark ? '#52525b' : '#a1a1aa'} ${(previewStage / (STAGE_NAMES.length - 1)) * 100}%, ${isDark ? 'rgba(39,39,42,0.6)' : 'rgba(228,228,231,0.8)'} ${(previewStage / (STAGE_NAMES.length - 1)) * 100}%, ${isDark ? 'rgba(39,39,42,0.6)' : 'rgba(228,228,231,0.8)'} 100%)`,
                    borderRadius: 4, outline: 'none', cursor: 'pointer',
                  }}
                />
                {/* Stage dots */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 2px' }}>
                  {STAGE_NAMES.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => setPreviewStage(i)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                        fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                        color: previewStage === i ? textPrimary : textMuted,
                        fontFamily: font, transition: 'color 0.15s',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── GEMS ── */}
          {activeTab === 'gems' && (
            <div ref={scrollRef} style={{ padding: 24 }}>

              <GemSection title="Accent Colors" isDark={isDark} textSecondary={textSecondary} dividerColor={dividerColor}>
                <div style={{ borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden', backgroundColor: cardBg }}>
                  {[
                    ...ACCENT_COLORS.filter(c => c.cost || c.pro).map(({ hex, name, cost, pro }) => ({ id: `accent_${hex}`, name, cost, pro, value: hex })),
                    ...GEM_COSMETICS.filter(c => c.type === 'accent').map(c => ({ id: c.id, name: c.name, cost: c.cost, value: c.value })),
                  ].map((item, idx) => {
                    const owned = unlockedCosmetics.includes(item.id)
                    const cantAfford = !item.cost || gems < item.cost
                    return (
                      <div key={item.id} id={`gem-item-${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: idx > 0 ? `1px solid ${dividerColor}` : 'none', transition: 'background 0.3s', background: highlightItem === item.id ? (isDark ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.08)') : 'transparent' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#27272a' : '#f0ede8', flexShrink: 0 }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: item.value }} />
                        </div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: textPrimary, fontFamily: font }}>{item.name}</div></div>
                        {(item as any).pro ? (
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#f59e0b', padding: '1px 6px', borderRadius: 99 }}>PRO</span>
                        ) : owned ? (
                          <button onClick={() => onUpdateConfig({ accentColor: item.value })} style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>Apply</button>
                        ) : (
                          <button onClick={() => { if (item.cost && gems >= item.cost) { setGems(g => g - item.cost!); setUnlockedCosmetics(prev => [...prev, item.id]); onUpdateConfig({ accentColor: item.value }) } }} disabled={cantAfford} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: cantAfford ? 'not-allowed' : 'pointer', opacity: cantAfford ? 0.35 : 1, fontFamily: font }}>💎 {item.cost}</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </GemSection>

              <GemSection title="Heading Fonts" isDark={isDark} textSecondary={textSecondary} dividerColor={dividerColor}>
                <div style={{ borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden', backgroundColor: cardBg }}>
                  {HEADING_FONT_OPTIONS.filter(f => f.cost || f.pro).map((f, idx) => {
                    const id = `hfont_${f.value}`, owned = unlockedCosmetics.includes(id), cantAfford = !f.cost || gems < f.cost
                    return (
                      <div key={id} id={`gem-item-${id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: idx > 0 ? `1px solid ${dividerColor}` : 'none', transition: 'background 0.3s', background: highlightItem === id ? (isDark ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.08)') : 'transparent' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#27272a' : '#f0ede8', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontFamily: `"${f.value}", serif`, fontWeight: 600, color: textPrimary }}>Aa</span>
                        </div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: textPrimary, fontFamily: `"${f.value}", serif` }}>{f.label}</div></div>
                        {f.pro ? (
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#f59e0b', padding: '1px 6px', borderRadius: 99 }}>PRO</span>
                        ) : owned ? (
                          <button onClick={() => onUpdateConfig({ headingFont: f.value })} style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>Apply</button>
                        ) : (
                          <button onClick={() => { if (f.cost && gems >= f.cost) { setGems(g => g - f.cost!); setUnlockedCosmetics(prev => [...prev, id]); onUpdateConfig({ headingFont: f.value }) } }} disabled={cantAfford} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: cantAfford ? 'not-allowed' : 'pointer', opacity: cantAfford ? 0.35 : 1, fontFamily: font }}>💎 {f.cost}</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </GemSection>

              <GemSection title="Body Fonts" isDark={isDark} textSecondary={textSecondary} dividerColor={dividerColor}>
                <div style={{ borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden', backgroundColor: cardBg }}>
                  {FONT_OPTIONS.filter(f => f.cost || f.pro).map((f, idx) => {
                    const id = `bfont_${f.value}`, owned = unlockedCosmetics.includes(id), cantAfford = !f.cost || gems < f.cost
                    return (
                      <div key={id} id={`gem-item-${id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: idx > 0 ? `1px solid ${dividerColor}` : 'none', transition: 'background 0.3s', background: highlightItem === id ? (isDark ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.08)') : 'transparent' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#27272a' : '#f0ede8', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontFamily: `"${f.value}", serif`, fontWeight: 600, color: textPrimary }}>Aa</span>
                        </div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: textPrimary, fontFamily: `"${f.value}", serif` }}>{f.label}</div></div>
                        {f.pro ? (
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#f59e0b', padding: '1px 6px', borderRadius: 99 }}>PRO</span>
                        ) : owned ? (
                          <button onClick={() => onUpdateConfig({ editorFont: f.value })} style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>Apply</button>
                        ) : (
                          <button onClick={() => { if (f.cost && gems >= f.cost) { setGems(g => g - f.cost!); setUnlockedCosmetics(prev => [...prev, id]); onUpdateConfig({ editorFont: f.value }) } }} disabled={cantAfford} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: cantAfford ? 'not-allowed' : 'pointer', opacity: cantAfford ? 0.35 : 1, fontFamily: font }}>💎 {f.cost}</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </GemSection>

              <GemSection title="Page Styles" isDark={isDark} textSecondary={textSecondary} dividerColor={dividerColor}>
                <div style={{ borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden', backgroundColor: cardBg }}>
                  {PAGE_STYLE_OPTIONS.filter(f => f.cost || f.pro).map((f, idx) => {
                    const id = `paper_${f.value}`, owned = unlockedCosmetics.includes(id), cantAfford = !f.cost || gems < f.cost
                    return (
                      <div key={id} id={`gem-item-${id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: idx > 0 ? `1px solid ${dividerColor}` : 'none', transition: 'background 0.3s', background: highlightItem === id ? (isDark ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.08)') : 'transparent' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#27272a' : '#f0ede8', flexShrink: 0 }}>
                          <span style={{ fontSize: 12 }}>▤</span>
                        </div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: textPrimary, fontFamily: font }}>{f.label}</div></div>
                        {f.pro ? (
                          <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#f59e0b', padding: '1px 6px', borderRadius: 99 }}>PRO</span>
                        ) : owned ? (
                          <button onClick={() => onUpdateConfig({ paperStyle: f.value })} style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>Apply</button>
                        ) : (
                          <button onClick={() => { if (f.cost && gems >= f.cost) { setGems(g => g - f.cost!); setUnlockedCosmetics(prev => [...prev, id]); onUpdateConfig({ paperStyle: f.value }) } }} disabled={cantAfford} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: cantAfford ? 'not-allowed' : 'pointer', opacity: cantAfford ? 0.35 : 1, fontFamily: font }}>💎 {f.cost}</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </GemSection>

              <GemSection title="Ink Styles" isDark={isDark} textSecondary={textSecondary} dividerColor={dividerColor}>
                <div style={{ borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden', backgroundColor: cardBg }}>
                  {GEM_COSMETICS.filter(c => c.type === 'ink').map((cosmetic, idx) => {
                    const owned = unlockedCosmetics.includes(cosmetic.id), cantAfford = gems < cosmetic.cost
                    return (
                      <div key={cosmetic.id} id={`gem-item-${cosmetic.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: idx > 0 ? `1px solid ${dividerColor}` : 'none', transition: 'background 0.3s', background: highlightItem === cosmetic.id ? (isDark ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.08)') : 'transparent' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#27272a' : '#f0ede8', flexShrink: 0 }}><span style={{ fontSize: 12 }}>✎</span></div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: textPrimary, fontFamily: font }}>{cosmetic.name}</div></div>
                        {owned ? (
                          <button onClick={() => applyCosmetic(cosmetic)} style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>Owned ✓</button>
                        ) : (
                          <button onClick={() => buyCosmetic(cosmetic)} disabled={cantAfford} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: cantAfford ? 'not-allowed' : 'pointer', opacity: cantAfford ? 0.35 : 1, fontFamily: font }}>💎 {cosmetic.cost}</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </GemSection>

              <GemSection title="Paper Textures" isDark={isDark} textSecondary={textSecondary} dividerColor={dividerColor}>
                <div style={{ borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden', backgroundColor: cardBg }}>
                  {GEM_COSMETICS.filter(c => c.type === 'paper').map((cosmetic, idx) => {
                    const owned = unlockedCosmetics.includes(cosmetic.id), cantAfford = gems < cosmetic.cost
                    return (
                      <div key={cosmetic.id} id={`gem-item-${cosmetic.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: idx > 0 ? `1px solid ${dividerColor}` : 'none', transition: 'background 0.3s', background: highlightItem === cosmetic.id ? (isDark ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.08)') : 'transparent' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#27272a' : '#f0ede8', flexShrink: 0 }}><span style={{ fontSize: 12 }}>▤</span></div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: textPrimary, fontFamily: font }}>{cosmetic.name}</div></div>
                        {owned ? (
                          <button onClick={() => applyCosmetic(cosmetic)} style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>Owned ✓</button>
                        ) : (
                          <button onClick={() => buyCosmetic(cosmetic)} disabled={cantAfford} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: cantAfford ? 'not-allowed' : 'pointer', opacity: cantAfford ? 0.35 : 1, fontFamily: font }}>💎 {cosmetic.cost}</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </GemSection>

            </div>
          )}

          {/* ── BAG ── */}
          {activeTab === 'bag' && (
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your Seeds</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: textMuted, fontFamily: font }}>{inventory.length}/40</span>
              </div>
              {inventory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: textMuted, fontFamily: font }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🌱</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>No seeds yet</div>
                  <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Buy seeds from the shop to grow your grove.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {inventory.map((type, idx) => {
                    const t = TREE_TYPES[type]
                    return (
                      <div
                        key={`${type}-${idx}`}
                        style={{
                          borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden',
                          backgroundColor: cardBg, position: 'relative',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', cursor: 'pointer', backgroundColor: isDark ? 'rgba(26,26,30,0.5)' : '#f5f2ed' }}
                          onClick={() => { setSelectedPlant(type); setPreviewStage(0); setActiveTab('shop') }}
                        >
                          <PlantIcon type={type} size={44} isSeed />
                        </div>
                        <div style={{ padding: '8px 10px', borderTop: `1px solid ${dividerColor}` }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: textPrimary, fontFamily: font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                          <div style={{ fontSize: 9, fontWeight: 600, color: RARITY_COLOR[t.rarity], letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{RARITY_LABEL[t.rarity]}</div>
                        </div>
                        <button
                          onClick={() => discardSeed(idx)}
                          style={{
                            position: 'absolute', top: 4, right: 4, width: 18, height: 18,
                            borderRadius: '50%', border: 'none', cursor: 'pointer',
                            backgroundColor: isDark ? '#27272a' : '#f0ede8',
                            color: textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: 0, transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '0' }}
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── CATALOG ── */}
          {activeTab === 'catalog' && (
            <div style={{ padding: 24 }}>
              {RARITY_ORDER.map(rarity => {
                const plants = Object.keys(TREE_TYPES).filter(t => TREE_TYPES[t].rarity === rarity && t !== 'spoiled')
                if (plants.length === 0) return null
                return (
                  <div key={rarity} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: RARITY_COLOR[rarity] }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{RARITY_LABEL[rarity]}</span>
                      <div style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                      {plants.map(type => {
                        const t = TREE_TYPES[type]
                        const owned = inventory.includes(type)
                        return (
                          <button
                            key={type}
                            className={rarityCardClass(t.rarity)}
                            onClick={() => { setSelectedPlant(type); setPreviewStage(3); setActiveTab('shop') }}
                            style={{
                              borderRadius: 14, border: `1px solid ${cardBorder}`, overflow: 'hidden',
                              backgroundColor: cardBg, cursor: 'pointer', textAlign: 'left',
                              transition: 'all 0.15s', position: 'relative', fontFamily: font,
                            }}
                          >
                            <div style={{
                              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                              height: 180, position: 'relative',
                              background: RARITY_BG[t.rarity] || (isDark ? 'linear-gradient(180deg, #1a1a1e 0%, #141416 100%)' : 'linear-gradient(180deg, #f0ede8 0%, #e8e4dd 100%)'),
                            }}>
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 16, background: 'linear-gradient(180deg, transparent 0%, rgba(40,32,20,0.3) 100%)' }} />
                              <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 15px rgba(0,0,0,0.25)', pointerEvents: 'none' }} />
                              <Sparkles rarity={t.rarity} count={4} />
                              <div className={rarityPlantClass(t.rarity)} style={{ position: 'relative', marginBottom: -2 }}>
                                <PlantIcon type={type} size={120} stage={3} />
                              </div>
                              <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 8, fontWeight: 700, color: RARITY_COLOR[t.rarity], letterSpacing: '0.04em', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                                {getDropChance(t.weight)}
                              </div>
                              {owned && (
                                <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', backgroundColor: isDark ? 'rgba(6,78,59,0.8)' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#34d399" : "#059669"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              )}
                            </div>
                            <div style={{ padding: '10px 14px', borderTop: `1px solid ${dividerColor}` }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: t.currency === 'gems' ? '#a78bfa' : '#d97706' }}>
                                  {t.currency === 'gems' ? '💎' : '☀️'} {t.cost}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 600, color: RARITY_COLOR[t.rarity], letterSpacing: '0.06em', textTransform: 'uppercase' }}>{RARITY_LABEL[t.rarity]}</span>
                              </div>
                            </div>
                          </button>
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
  )
})

function PlantCard({ type, isDark, cardBg, cardBorder, textPrimary, textMuted, shopStock, onClick, featured }: {
  type: string; isDark: boolean; cardBg: string; cardBorder: string; textPrimary: string; textMuted: string
  shopStock: Record<string, number>; onClick: () => void; featured?: boolean
}) {
  const t = TREE_TYPES[type]
  if (!t) return null
  const soldOut = (shopStock[type] || 0) <= 0
  const dividerColor = isDark ? 'rgba(39,39,42,0.6)' : 'rgba(228,228,231,0.8)'

  return (
    <button
      onClick={onClick}
      className={`${isDark ? "hover:border-zinc-700" : "hover:border-zinc-300"} ${rarityCardClass(t.rarity)}`}
      style={{
        borderRadius: 14, border: `1px solid ${cardBorder}`, overflow: 'hidden',
        backgroundColor: cardBg, cursor: 'pointer', textAlign: 'left',
        opacity: soldOut ? 0.35 : 1, transition: 'all 0.15s',
        fontFamily: '"EB Garamond", Georgia, serif',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        height: featured ? 200 : 180,
        background: RARITY_BG[t.rarity] || (isDark ? 'linear-gradient(180deg, #1a1a1e 0%, #141416 100%)' : 'linear-gradient(180deg, #f0ede8 0%, #e8e4dd 100%)'),
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 16, background: 'linear-gradient(180deg, transparent 0%, rgba(40,32,20,0.3) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 15px rgba(0,0,0,0.25)', pointerEvents: 'none' }} />
        <Sparkles rarity={t.rarity} count={featured ? 6 : 4} />
        <div className={rarityPlantClass(t.rarity)} style={{ position: 'relative', marginBottom: -2 }}>
          <PlantIcon type={type} size={featured ? 130 : 120} stage={3} />
        </div>
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 8, fontWeight: 700, color: RARITY_COLOR[t.rarity], letterSpacing: '0.04em', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
          {getDropChance(t.weight)}
        </div>
        {soldOut && (
          <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', background: isDark ? 'rgba(39,39,42,0.8)' : 'rgba(228,228,231,0.9)', padding: '2px 8px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
            Sold out
          </div>
        )}
      </div>
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${dividerColor}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: RARITY_COLOR[t.rarity], letterSpacing: '0.06em', textTransform: 'uppercase' }}>{RARITY_LABEL[t.rarity]}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.currency === 'gems' ? '#a78bfa' : '#d97706' }}>
            {t.currency === 'gems' ? '💎' : '☀️'} {t.cost}
          </span>
        </div>
      </div>
    </button>
  )
}

function GemSection({ title, isDark, textSecondary, dividerColor, children }: {
  title: string; isDark: boolean; textSecondary: string; dividerColor: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
        <div style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
      </div>
      {children}
    </div>
  )
}
