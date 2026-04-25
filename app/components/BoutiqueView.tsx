"use client"
import { memo, useState, useEffect, useRef, useCallback } from "react"
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
  { id: 'color_gold', name: 'Liquid Gold', type: 'accent', value: '#b8860b', cost: 2 },
  { id: 'color_midnight', name: 'Midnight Ink', type: 'accent', value: '#191970', cost: 2 },
  { id: 'color_ember', name: 'Ember', type: 'accent', value: '#cc5500', cost: 2 },
  { id: 'color_seafoam', name: 'Seafoam', type: 'accent', value: '#2e8b57', cost: 2 },
  { id: 'color_plum', name: 'Dark Plum', type: 'accent', value: '#3c1361', cost: 2 },
  { id: 'ink_vintage', name: 'Vintage Sepia', type: 'ink', value: 'vintage', cost: 3 },
  { id: 'ink_blueprint', name: 'Blueprint Blue', type: 'ink', value: 'blueprint', cost: 3 },
  { id: 'ink_emerald', name: 'Emerald Script', type: 'ink', value: 'emerald', cost: 3 },
  { id: 'paper_parchment', name: 'Aged Parchment', type: 'paper', value: 'parchment', cost: 4 },
  { id: 'paper_midnight', name: 'Midnight Paper', type: 'paper', value: 'midnight', cost: 4 },
]

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'true rare', 'premium', 'extinct', 'chroma']

const RARITY_LABEL: Record<string, string> = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare',
  'true rare': 'True Rare', premium: 'Premium', chroma: 'Chroma', extinct: 'Extinct',
}

const RARITY_COLOR: Record<string, string> = {
  common: '#a1a1aa', uncommon: '#34d399', rare: '#60a5fa',
  'true rare': '#a78bfa', premium: '#e07840', chroma: '#f472b6', extinct: '#f87171',
}

const RARITY_BG: Record<string, string> = {
  common: 'linear-gradient(180deg, #1a1e14 0%, #1e2616 50%, #22301a 100%)',
  uncommon: 'linear-gradient(180deg, #0e1a16 0%, #122820 50%, #163228 100%)',
  rare: 'linear-gradient(180deg, #0e1420 0%, #121e30 50%, #162840 100%)',
  'true rare': 'linear-gradient(180deg, #16102a 0%, #1e1638 50%, #261c46 100%)',
  premium: 'linear-gradient(180deg, #1a1610 0%, #28201a 50%, #362a20 100%)',
  chroma: 'linear-gradient(180deg, #1a0e1e 0%, #28142e 50%, #361a3e 100%)',
  extinct: 'linear-gradient(180deg, #161014 0%, #1e1418 50%, #26181e 100%)',
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

function RarityScene({ rarity }: { rarity: string }) {
  if (rarity === 'extinct') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="ext-core" cx="50%" cy="75%">
              <stop offset="0%" stopColor="#1e1018" />
              <stop offset="60%" stopColor="#120a10" />
              <stop offset="100%" stopColor="#0a060a" />
            </radialGradient>
            <radialGradient id="ext-ember" cx="50%" cy="80%">
              <stop offset="0%" stopColor="rgba(168,85,100,0.05)">
                <animate attributeName="stopColor" values="rgba(168,85,100,0.05);rgba(168,85,100,0.1);rgba(168,85,100,0.05)" dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#ext-core)" />
          <rect width="100%" height="100%" fill="url(#ext-ember)" />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i}
              cx={`${(i * 29 + 12) % 88}%`}
              r={0.6 + (i % 3) * 0.3}
              fill={i % 3 === 0 ? '#a85568' : i % 2 === 0 ? '#8a4a5a' : '#4a2030'}
            >
              <animate attributeName="opacity" values="0;0.6;0.2;0" dur={`${4 + (i % 4) * 1.5}s`} begin={`${i * 0.9}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${75 + (i * 7) % 20}%;${55 + (i * 5) % 15}%`} dur={`${4 + (i % 4) * 1.5}s`} begin={`${i * 0.9}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>
    )
  }

  if (rarity === 'chroma') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="chr-a" cx="25%" cy="30%">
              <stop offset="0%" stopColor="rgba(192,132,252,0.14)">
                <animate attributeName="stopColor" values="rgba(192,132,252,0.14);rgba(96,165,250,0.14);rgba(244,114,182,0.14);rgba(192,132,252,0.14)" dur="12s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="chr-b" cx="75%" cy="70%">
              <stop offset="0%" stopColor="rgba(244,114,182,0.1)">
                <animate attributeName="stopColor" values="rgba(244,114,182,0.1);rgba(52,211,153,0.1);rgba(192,132,252,0.1);rgba(244,114,182,0.1)" dur="12s" begin="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="chr-c" cx="55%" cy="50%">
              <stop offset="0%" stopColor="rgba(96,165,250,0.06)">
                <animate attributeName="stopColor" values="rgba(96,165,250,0.06);rgba(244,114,182,0.06);rgba(52,211,153,0.06);rgba(96,165,250,0.06)" dur="12s" begin="8s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="#06020e" />
          <rect width="100%" height="100%" fill="url(#chr-a)">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="8s" repeatCount="indefinite" />
          </rect>
          <rect width="100%" height="100%" fill="url(#chr-b)">
            <animate attributeName="opacity" values="1;0.7;1" dur="10s" repeatCount="indefinite" />
          </rect>
          <rect width="100%" height="100%" fill="url(#chr-c)" />
          {Array.from({ length: 5 }).map((_, i) => {
            const colors = ['#c084fc', '#f472b6', '#60a5fa', '#34d399', '#a78bfa']
            return (
              <circle key={i}
                cx={`${(i * 37 + 10) % 85}%`} cy={`${(i * 31 + 15) % 75}%`}
                r={1}
                fill={colors[i]}
              >
                <animate attributeName="opacity" values="0;0.4;0" dur={`${6 + (i % 3) * 2}s`} begin={`${i * 1.8}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="0.8;1.8;0.8" dur={`${6 + (i % 3) * 2}s`} begin={`${i * 1.8}s`} repeatCount="indefinite" />
              </circle>
            )
          })}
        </svg>
      </div>
    )
  }

  if (rarity === 'premium') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="prm-core" cx="50%" cy="65%">
              <stop offset="0%" stopColor="#1c1608" />
              <stop offset="100%" stopColor="#0a0804" />
            </radialGradient>
            <radialGradient id="prm-glow" cx="50%" cy="75%">
              <stop offset="0%" stopColor="rgba(224,120,64,0.08)">
                <animate attributeName="stopColor" values="rgba(224,120,64,0.05);rgba(224,120,64,0.12);rgba(224,120,64,0.05)" dur="5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#prm-core)" />
          <rect width="100%" height="100%" fill="url(#prm-glow)" />
          {Array.from({ length: 6 }).map((_, i) => (
            <circle key={i}
              cx={`${(i * 33 + 15) % 85}%`}
              r={0.6 + (i % 2) * 0.3}
              fill={i % 2 === 0 ? '#e07840' : '#c06030'}
            >
              <animate attributeName="opacity" values="0;0.5;0" dur={`${5 + (i % 3) * 2}s`} begin={`${i * 1.5}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${70 + (i * 11) % 20}%;${45 + (i * 7) % 15}%`} dur={`${5 + (i % 3) * 2}s`} begin={`${i * 1.5}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>
    )
  }

  return null
}

export const BoutiqueView = memo(function BoutiqueView({
  isOpen, onClose, theme, accent,
  sunshine, gems, inventory, setSunshine, setGems, setInventory, setGrove,
  unlockedCosmetics, setUnlockedCosmetics, onUpdateConfig,
  initialTab, initialScrollTo
}: BoutiqueViewProps) {

  const [activeTab, setActiveTab] = useState<TabId>('shop')
  const [dailySeeds, setDailySeeds] = useState<string[]>([])
  const [shopItems, setShopItems] = useState<string[]>([])
  const [shopStock, setShopStock] = useState<Record<string, number>>({})
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null)
  const [previewStage, setPreviewStage] = useState(3)
  const [highlightItem, setHighlightItem] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevTabRef = useRef<TabId>('shop')
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
  const textSecondary = isDark ? '#a1a1aa' : '#000000'
  const textMuted = isDark ? '#52525b' : '#000000'
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

  const getShopEpoch = useCallback(() => {
    const now = Date.now()
    const THREE_HOURS = 3 * 60 * 60 * 1000
    return Math.floor(now / THREE_HOURS)
  }, [])

  const getNextRefresh = useCallback(() => {
    const THREE_HOURS = 3 * 60 * 60 * 1000
    return (getShopEpoch() + 1) * THREE_HOURS
  }, [getShopEpoch])

  useEffect(() => {
    if (!isOpen) return
    const tick = () => {
      const diff = getNextRefresh() - Date.now()
      if (diff <= 0) { setCountdown('Refreshing...'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isOpen, getNextRefresh])

  useEffect(() => {
    if (!isOpen) return
    const epoch = String(getShopEpoch())
    const lastReset = localStorage.getItem('pulp_last_shop_reset')
    const getStockValue = () => {
      const r = Math.random() * 100
      if (r < 2) return 7; if (r < 7) return 3; if (r < 27) return 2; return 1
    }
    if (lastReset !== epoch) {
      const allTypes = Object.keys(TREE_TYPES).filter(t => t !== 'spoiled')
      const selected: string[] = []
      const newStock: Record<string, number> = {}
      for (let i = 0; i < 4; i++) {
        const weightedTypes = allTypes.filter(t => !selected.includes(t))
        if (weightedTypes.length === 0) break
        const totalWeight = weightedTypes.reduce((acc, t) => acc + TREE_TYPES[t].weight, 0)
        let r = Math.random() * totalWeight
        let picked = weightedTypes[0]
        for (const t of weightedTypes) { r -= TREE_TYPES[t].weight; if (r <= 0) { picked = t; break } }
        selected.push(picked)
        newStock[picked] = getStockValue()
      }
      const available = GEM_COSMETICS.filter(c => !unlockedCosmetics.includes(c.id))
      const shuffled = [...available].sort(() => Math.random() - 0.5)
      const items = shuffled.slice(0, 2).map(c => c.id)
      setDailySeeds(selected)
      setShopItems(items)
      setShopStock(newStock)
      localStorage.setItem('pulp_last_shop_reset', epoch)
      localStorage.setItem('pulp_daily_seeds', JSON.stringify(selected))
      localStorage.setItem('pulp_shop_items', JSON.stringify(items))
      localStorage.setItem('pulp_shop_stock', JSON.stringify(newStock))
    } else {
      const savedSeeds = localStorage.getItem('pulp_daily_seeds')
      const savedStock = localStorage.getItem('pulp_shop_stock')
      const savedItems = localStorage.getItem('pulp_shop_items')
      if (savedSeeds) setDailySeeds(JSON.parse(savedSeeds))
      if (savedStock) setShopStock(JSON.parse(savedStock))
      if (savedItems) setShopItems(JSON.parse(savedItems))
    }
  }, [isOpen, getShopEpoch, unlockedCosmetics])

  const buySeed = (type: string) => {
    if ((shopStock[type] || 0) <= 0 || inventory.length >= 60) return
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
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold tabular-nums ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"} border rounded-full px-2.5 py-1`}>
      <span className="text-[10px] leading-none">{type === 'gems' ? '💎' : '☀️'}</span>
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
        className={`relative w-full max-w-[900px] rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border overflow-hidden flex flex-col ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"}`}
        style={{ backgroundColor: bg, height: 660 }}
      >
        {/* ── Header ── */}
        <div className={`px-6 pt-4 pb-3 border-b shrink-0 flex items-center justify-between ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"}`}>
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedPlant(null) }}
                className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-all ${
                  activeTab === tab.id
                    ? "shadow-sm"
                    : isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700"
                }`}
                style={activeTab === tab.id ? {
                  backgroundColor: `${accent}18`,
                  color: accent,
                  border: `1px solid ${accent}30`,
                } : { border: '1px solid transparent' }}
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
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px',
              borderBottom: `1px solid ${dividerColor}`,
              backgroundColor: isDark ? 'rgba(24,24,27,0.5)' : 'rgba(255,255,255,0.6)',
            }}>
              <button
                onClick={() => { setSelectedPlant(null); setActiveTab(prevTabRef.current) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: textSecondary, fontFamily: font, fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Back
              </button>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: textPrimary, fontFamily: font }}>{previewInfo.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: RARITY_COLOR[previewInfo.rarity], marginLeft: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {RARITY_LABEL[previewInfo.rarity]}
                </span>
              </div>
              <div style={{ width: 50 }} />
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: bg, display: 'flex', flexDirection: 'column' }}>

          {/* ── SHOP ── */}
          {activeTab === 'shop' && !selectedPlant && (
            <div style={{ padding: '12px 20px' }}>
              {/* Timer header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Shop</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#ef444410', padding: '4px 10px', borderRadius: '99px', border: '1px solid #ef444420' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace', letterSpacing: '0.02em' }}>{countdown}</span>
                </div>
              </div>

              {/* 4 Seed Cards */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Seeds</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {dailySeeds.map(type => <PlantCard key={type} type={type} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} textPrimary={textPrimary} textMuted={textMuted} shopStock={shopStock} onClick={() => { setSelectedPlant(type); setPreviewStage(0) }} featured isShop />)}
                </div>
              </div>

              {/* 2 Item Cards */}
              {shopItems.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Items</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {shopItems.map(id => {
                      const cosmetic = GEM_COSMETICS.find(c => c.id === id)
                      if (!cosmetic) return null
                      const owned = unlockedCosmetics.includes(cosmetic.id)
                      const cantAfford = gems < cosmetic.cost
                      return (
                        <div
                          key={id}
                          style={{
                            borderRadius: 14, border: `1px solid ${cardBorder}`, overflow: 'hidden',
                            backgroundColor: cardBg, fontFamily: font,
                          }}
                        >
                          <div style={{
                            height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isDark ? 'linear-gradient(180deg, #1a1a1e 0%, #18181c 100%)' : 'linear-gradient(180deg, #f2f0ed 0%, #eae8e4 100%)',
                          }}>
                            {cosmetic.type === 'accent' && <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: cosmetic.value, boxShadow: `0 0 16px ${cosmetic.value}40` }} />}
                            {cosmetic.type === 'ink' && <span style={{ fontSize: 22, color: isDark ? '#a1a1aa' : '#71717a' }}>✎</span>}
                            {cosmetic.type === 'paper' && <span style={{ fontSize: 22, color: isDark ? '#a1a1aa' : '#71717a' }}>▤</span>}
                          </div>
                          <div style={{ padding: '6px 10px', borderTop: `1px solid ${dividerColor}` }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cosmetic.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{cosmetic.type}</span>
                              {owned
                                ? <button onClick={() => applyCosmetic(cosmetic)} style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'none', border: 'none', cursor: 'pointer' }}>Apply</button>
                                : <button
                                    onClick={() => buyCosmetic(cosmetic)}
                                    disabled={cantAfford}
                                    style={{
                                      fontSize: 11, fontWeight: 700, color: textSecondary, background: 'none', border: 'none',
                                      cursor: cantAfford ? 'not-allowed' : 'pointer', opacity: cantAfford ? 0.35 : 1,
                                    }}
                                  >
                                    💎 {cosmetic.cost}
                                  </button>
                              }
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shop' && selectedPlant && previewInfo && (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0 }}>
              {/* Large plant preview */}
              <div style={{
                width: '100%', maxWidth: 520, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                borderRadius: 16, overflow: 'hidden', position: 'relative',
                height: 320,
                background: ['premium', 'chroma', 'extinct'].includes(previewInfo.rarity) ? 'none' : (previewInfo.sceneBg || (isDark ? 'linear-gradient(180deg, #1a1a1e 0%, #141416 100%)' : 'linear-gradient(180deg, #f0ede8 0%, #e8e4dd 100%)')),
              }}>
                <RarityScene rarity={previewInfo.rarity} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(180deg, transparent 0%, rgba(40,32,20,0.35) 100%)', zIndex: 1 }} />
                <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)', borderRadius: 16, pointerEvents: 'none', zIndex: 1 }} />
                <Sparkles rarity={previewInfo.rarity} count={10} />
                <div className={previewStage >= 4 ? rarityPlantClass(previewInfo.rarity) : ''} style={{ position: 'relative', marginBottom: 12, zIndex: 2 }}>
                  {previewStage === 0
                    ? <PlantIcon type={selectedPlant!} size={180} isSeed />
                    : <PlantIcon type={selectedPlant!} size={180} stage={previewStage - 1} />
                  }
                </div>
              </div>

              {/* Stage label */}
              <div style={{ marginTop: 10, textAlign: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary, fontFamily: font }}>
                  {STAGE_NAMES[previewStage]}
                </span>
                <span style={{ fontSize: 11, color: isDark ? textMuted : "#000000", fontFamily: font, marginLeft: 8 }}>
                  Stage {previewStage + 1} of {STAGE_NAMES.length}
                </span>
              </div>

              {/* Slider */}
              <div style={{ width: '100%', maxWidth: 520, marginTop: 16, padding: '0 4px' }}>
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

              {/* Buy button + stock indicator */}
              {(() => {
                const stock = shopStock[selectedPlant!] || 0
                const cantAfford = previewInfo.currency === 'sunshine' ? sunshine < previewInfo.cost : gems < previewInfo.cost
                if (stock <= 0) return (
                  <div className="mt-5 px-6 py-2.5 rounded-xl text-[13px] font-bold" style={{
                    fontFamily: font, display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    color: isDark ? '#71717a' : '#a1a1aa',
                  }}>
                    Sold Out
                  </div>
                )
                return (
                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={() => buySeed(selectedPlant!)}
                      disabled={cantAfford}
                      className="px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:brightness-110"
                      style={{
                        fontFamily: font, cursor: cantAfford ? 'default' : 'pointer', border: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#e67e22', color: '#fff',
                        opacity: cantAfford ? 0.35 : 1,
                      }}
                    >
                      Buy Seed
                      <span style={{ opacity: 0.6, marginLeft: 2 }}>·</span>
                      <span className="text-[10px] leading-none">{previewInfo.currency === 'sunshine' ? '☀️' : '💎'}</span>
                      {previewInfo.cost.toLocaleString()}
                    </button>
                    <span style={{
                      fontSize: 10, fontWeight: 700, fontFamily: font,
                      color: isDark ? '#71717a' : '#a1a1aa',
                    }}>
                      ×{stock} left
                    </span>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── GEMS ── */}
          {activeTab === 'gems' && (
            <div ref={scrollRef} className="px-6 py-4">

              <GemSection title="Accent Colors" isDark={isDark}>
                {[
                  ...ACCENT_COLORS.filter(c => c.cost || c.pro).map(({ hex, name, cost, pro }) => ({ id: `accent_${hex}`, name, cost, pro, value: hex })),
                  ...GEM_COSMETICS.filter(c => c.type === 'accent').map(c => ({ id: c.id, name: c.name, cost: c.cost, value: c.value })),
                ].map((item) => {
                  const owned = unlockedCosmetics.includes(item.id)
                  const cantAfford = !item.cost || gems < item.cost
                  return (
                    <GemRow key={item.id} id={`gem-item-${item.id}`} isDark={isDark} highlight={highlightItem === item.id}
                      icon={<div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.value }} />}
                      label={item.name}
                      action={(item as any).pro
                        ? <span className="text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#e07840' }}>PRO</span>
                        : owned
                        ? <button onClick={() => onUpdateConfig({ accentColor: item.value })} className="text-[11px] font-semibold text-emerald-400 bg-transparent border-none cursor-pointer">Apply</button>
                        : <button onClick={() => { if (item.cost && gems >= item.cost) { setGems(g => g - item.cost!); setUnlockedCosmetics(prev => [...prev, item.id]); onUpdateConfig({ accentColor: item.value }) } }} disabled={cantAfford} className={`text-[11px] font-bold text-zinc-400 bg-transparent border-none ${cantAfford ? 'cursor-not-allowed opacity-35' : 'cursor-pointer'}`}>💎 {item.cost}</button>
                      }
                    />
                  )
                })}
              </GemSection>

              <GemSection title="Heading Fonts" isDark={isDark}>
                {HEADING_FONT_OPTIONS.filter(f => f.cost || f.pro).map((f) => {
                  const id = `hfont_${f.value}`, owned = unlockedCosmetics.includes(id), cantAfford = !f.cost || gems < f.cost
                  return (
                    <GemRow key={id} id={`gem-item-${id}`} isDark={isDark} highlight={highlightItem === id}
                      icon={<span className={`text-[13px] font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} style={{ fontFamily: `"${f.value}", serif` }}>Aa</span>}
                      label={f.label} labelFont={`"${f.value}", serif`}
                      action={f.pro
                        ? <span className="text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#e07840' }}>PRO</span>
                        : owned
                        ? <button onClick={() => onUpdateConfig({ headingFont: f.value })} className="text-[11px] font-semibold text-emerald-400 bg-transparent border-none cursor-pointer">Apply</button>
                        : <button onClick={() => { if (f.cost && gems >= f.cost) { setGems(g => g - f.cost!); setUnlockedCosmetics(prev => [...prev, id]); onUpdateConfig({ headingFont: f.value }) } }} disabled={cantAfford} className={`text-[11px] font-bold text-zinc-400 bg-transparent border-none ${cantAfford ? 'cursor-not-allowed opacity-35' : 'cursor-pointer'}`}>💎 {f.cost}</button>
                      }
                    />
                  )
                })}
              </GemSection>

              <GemSection title="Body Fonts" isDark={isDark}>
                {FONT_OPTIONS.filter(f => f.cost || f.pro).map((f) => {
                  const id = `bfont_${f.value}`, owned = unlockedCosmetics.includes(id), cantAfford = !f.cost || gems < f.cost
                  return (
                    <GemRow key={id} id={`gem-item-${id}`} isDark={isDark} highlight={highlightItem === id}
                      icon={<span className={`text-[13px] font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} style={{ fontFamily: `"${f.value}", serif` }}>Aa</span>}
                      label={f.label} labelFont={`"${f.value}", serif`}
                      action={f.pro
                        ? <span className="text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#e07840' }}>PRO</span>
                        : owned
                        ? <button onClick={() => onUpdateConfig({ editorFont: f.value })} className="text-[11px] font-semibold text-emerald-400 bg-transparent border-none cursor-pointer">Apply</button>
                        : <button onClick={() => { if (f.cost && gems >= f.cost) { setGems(g => g - f.cost!); setUnlockedCosmetics(prev => [...prev, id]); onUpdateConfig({ editorFont: f.value }) } }} disabled={cantAfford} className={`text-[11px] font-bold text-zinc-400 bg-transparent border-none ${cantAfford ? 'cursor-not-allowed opacity-35' : 'cursor-pointer'}`}>💎 {f.cost}</button>
                      }
                    />
                  )
                })}
              </GemSection>

              <GemSection title="Page Styles" isDark={isDark}>
                {PAGE_STYLE_OPTIONS.filter(f => f.cost || f.pro).map((f) => {
                  const id = `paper_${f.value}`, owned = unlockedCosmetics.includes(id), cantAfford = !f.cost || gems < f.cost
                  return (
                    <GemRow key={id} id={`gem-item-${id}`} isDark={isDark} highlight={highlightItem === id}
                      icon={<span className="text-[12px]">▤</span>}
                      label={f.label}
                      action={f.pro
                        ? <span className="text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#e07840' }}>PRO</span>
                        : owned
                        ? <button onClick={() => onUpdateConfig({ paperStyle: f.value })} className="text-[11px] font-semibold text-emerald-400 bg-transparent border-none cursor-pointer">Apply</button>
                        : <button onClick={() => { if (f.cost && gems >= f.cost) { setGems(g => g - f.cost!); setUnlockedCosmetics(prev => [...prev, id]); onUpdateConfig({ paperStyle: f.value }) } }} disabled={cantAfford} className={`text-[11px] font-bold text-zinc-400 bg-transparent border-none ${cantAfford ? 'cursor-not-allowed opacity-35' : 'cursor-pointer'}`}>💎 {f.cost}</button>
                      }
                    />
                  )
                })}
              </GemSection>

              <GemSection title="Ink Styles" isDark={isDark}>
                {GEM_COSMETICS.filter(c => c.type === 'ink').map((cosmetic) => {
                  const owned = unlockedCosmetics.includes(cosmetic.id), cantAfford = gems < cosmetic.cost
                  return (
                    <GemRow key={cosmetic.id} id={`gem-item-${cosmetic.id}`} isDark={isDark} highlight={highlightItem === cosmetic.id}
                      icon={<span className="text-[12px]">✎</span>}
                      label={cosmetic.name}
                      action={owned
                        ? <button onClick={() => applyCosmetic(cosmetic)} className="text-[11px] font-semibold text-emerald-400 bg-transparent border-none cursor-pointer">Apply</button>
                        : <button onClick={() => buyCosmetic(cosmetic)} disabled={cantAfford} className={`text-[11px] font-bold text-zinc-400 bg-transparent border-none ${cantAfford ? 'cursor-not-allowed opacity-35' : 'cursor-pointer'}`}>💎 {cosmetic.cost}</button>
                      }
                    />
                  )
                })}
              </GemSection>

              <GemSection title="Paper Textures" isDark={isDark}>
                {GEM_COSMETICS.filter(c => c.type === 'paper').map((cosmetic) => {
                  const owned = unlockedCosmetics.includes(cosmetic.id), cantAfford = gems < cosmetic.cost
                  return (
                    <GemRow key={cosmetic.id} id={`gem-item-${cosmetic.id}`} isDark={isDark} highlight={highlightItem === cosmetic.id}
                      icon={<span className="text-[12px]">▤</span>}
                      label={cosmetic.name}
                      action={owned
                        ? <button onClick={() => applyCosmetic(cosmetic)} className="text-[11px] font-semibold text-emerald-400 bg-transparent border-none cursor-pointer">Apply</button>
                        : <button onClick={() => buyCosmetic(cosmetic)} disabled={cantAfford} className={`text-[11px] font-bold text-zinc-400 bg-transparent border-none ${cantAfford ? 'cursor-not-allowed opacity-35' : 'cursor-pointer'}`}>💎 {cosmetic.cost}</button>
                      }
                    />
                  )
                })}
              </GemSection>

            </div>
          )}

          {/* ── BAG ── */}
          {activeTab === 'bag' && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Your Seeds</span>
                <span className={`text-[11px] font-semibold ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{inventory.length}/60</span>
              </div>
              {inventory.length === 0 ? (
                <div className={`text-center py-16 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  <div className="text-[32px] mb-3 opacity-40">🌱</div>
                  <div className="text-[14px] font-medium">No seeds yet</div>
                  <div className="text-[12px] mt-1 opacity-70">Buy seeds from the shop to grow your orchard.</div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {inventory.map((type, idx) => {
                    const t = TREE_TYPES[type]
                    if (!t) return null
                    return (
                      <div
                        key={`${type}-${idx}`}
                        className="relative group"
                      >
                        <button
                          onClick={() => { prevTabRef.current = activeTab; setSelectedPlant(type); setPreviewStage(0); setActiveTab('shop') }}
                          title={t.name}
                          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all border ${
                            isDark
                              ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80'
                              : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                          }`}
                          style={{ boxShadow: `0 0 0 2px ${RARITY_COLOR[t.rarity]}20` }}
                        >
                          <PlantIcon type={type} size={32} isSeed />
                        </button>
                        <button
                          onClick={() => discardSeed(idx)}
                          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer ${
                            isDark ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'
                          }`}
                        >
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
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
                            onClick={() => { prevTabRef.current = activeTab; setSelectedPlant(type); setPreviewStage(3); setActiveTab('shop') }}
                            style={{
                              borderRadius: 14, border: `1px solid ${cardBorder}`, overflow: 'hidden',
                              backgroundColor: cardBg, cursor: 'pointer', textAlign: 'left',
                              transition: 'all 0.15s', position: 'relative', fontFamily: font,
                            }}
                          >
                            <div style={{
                              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                              height: 180, position: 'relative',
                              background: ['premium', 'chroma', 'extinct'].includes(t.rarity) ? 'none' : (RARITY_BG[t.rarity] || (isDark ? 'linear-gradient(180deg, #1a1a1e 0%, #141416 100%)' : 'linear-gradient(180deg, #f0ede8 0%, #e8e4dd 100%)')),
                            }}>
                              <RarityScene rarity={t.rarity} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 16, background: 'linear-gradient(180deg, transparent 0%, rgba(40,32,20,0.3) 100%)', zIndex: 1 }} />
                              <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 15px rgba(0,0,0,0.25)', pointerEvents: 'none', zIndex: 1 }} />
                              <Sparkles rarity={t.rarity} count={4} />
                              <div className={rarityPlantClass(t.rarity)} style={{ position: 'relative', marginBottom: -2, zIndex: 2 }}>
                                <PlantIcon type={type} size={120} stage={3} />
                              </div>
                              <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 8, fontWeight: 700, color: RARITY_COLOR[t.rarity], letterSpacing: '0.04em', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)', zIndex: 2 }}>
                                {getDropChance(t.weight)}
                              </div>
                              {owned && (
                                <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', backgroundColor: isDark ? 'rgba(6,78,59,0.8)' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', zIndex: 2 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#34d399" : "#059669"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              )}
                            </div>
                            <div style={{ padding: '10px 14px', borderTop: `1px solid ${dividerColor}` }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                              <div style={{ marginTop: 4 }}>
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

function PlantCard({ type, isDark, cardBg, cardBorder, textPrimary, textMuted, shopStock, onClick, featured, isShop }: {
  type: string; isDark: boolean; cardBg: string; cardBorder: string; textPrimary: string; textMuted: string
  shopStock: Record<string, number>; onClick: () => void; featured?: boolean; isShop?: boolean
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
        height: featured ? 100 : 95,
        background: ['premium', 'chroma', 'extinct'].includes(t.rarity) ? 'none' : (RARITY_BG[t.rarity] || (isDark ? 'linear-gradient(180deg, #1a1a1e 0%, #141416 100%)' : 'linear-gradient(180deg, #f0ede8 0%, #e8e4dd 100%)')),
        position: 'relative',
      }}>
        <RarityScene rarity={t.rarity} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 12, background: 'linear-gradient(180deg, transparent 0%, rgba(40,32,20,0.3) 100%)', zIndex: 1 }} />
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 15px rgba(0,0,0,0.25)', pointerEvents: 'none', zIndex: 1 }} />
        <Sparkles rarity={t.rarity} count={featured ? 6 : 4} />
        <div className={rarityPlantClass(t.rarity)} style={{ position: 'relative', marginBottom: -2, zIndex: 2 }}>
          <PlantIcon type={type} size={featured ? 68 : 64} stage={3} />
        </div>
        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 8, fontWeight: 700, color: RARITY_COLOR[t.rarity], letterSpacing: '0.04em', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)', zIndex: 2 }}>
          {getDropChance(t.weight)}
        </div>
        {soldOut && (
          <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', background: isDark ? 'rgba(39,39,42,0.8)' : 'rgba(228,228,231,0.9)', padding: '2px 8px', borderRadius: 6, backdropFilter: 'blur(4px)', zIndex: 2 }}>
            Sold out
          </div>
        )}
        {!soldOut && isShop && (shopStock[type] || 0) > 0 && (
          <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, color: isDark ? '#a1a1aa' : '#71717a', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 6, backdropFilter: 'blur(4px)', zIndex: 2 }}>
            x{shopStock[type]}
          </div>
        )}
      </div>
      <div style={{ padding: '6px 10px', borderTop: `1px solid ${dividerColor}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: RARITY_COLOR[t.rarity], letterSpacing: '0.06em', textTransform: 'uppercase' }}>{RARITY_LABEL[t.rarity]}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#d97706' }}>
            ☀️ {t.cost.toLocaleString()}
          </span>
        </div>
      </div>
    </button>
  )
}

function GemSection({ title, isDark, children }: {
  title: string; isDark: boolean; textSecondary?: string; dividerColor?: string; children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <p className={`text-[9px] font-semibold uppercase tracking-[0.12em] mb-1.5 px-0.5 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
        {title}
      </p>
      <div className={`rounded-lg border overflow-hidden divide-y ${
        isDark
          ? "bg-zinc-900/50 border-zinc-800 divide-zinc-800/60"
          : "bg-white border-zinc-200/80 divide-zinc-100"
      }`}>
        {children}
      </div>
    </div>
  )
}

function GemRow({ id, isDark, highlight, icon, label, labelFont, action }: {
  id: string; isDark: boolean; highlight: boolean
  icon: React.ReactNode; label: string; labelFont?: string; action: React.ReactNode
}) {
  return (
    <div
      id={id}
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${highlight ? (isDark ? 'bg-zinc-700/20' : 'bg-zinc-200/40') : ''}`}
    >
      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] font-medium leading-snug ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`} style={labelFont ? { fontFamily: labelFont } : undefined}>
          {label}
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}
