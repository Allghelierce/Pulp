"use client"
import { memo, useState, useEffect, useRef, useCallback } from "react"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"
import { PulpIcon } from '@/app/components/CurrencyIcons'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

export type TabId = 'shop' | 'satchel' | 'catalog'

const MAX_SEEDS = 30

interface BoutiqueViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  sap: number
  inventory: string[]
  setSap: (v: number | ((p: number) => number)) => void
  setInventory: (v: string[] | ((p: string[]) => string[])) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
  onUpdateConfig: (updates: Record<string, any>) => void
  initialTab?: TabId
  initialScrollTo?: string
  isAdmin?: boolean
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'true rare', 'sacred']

const RARITY_LABEL: Record<string, string> = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare', 'true rare': 'True Rare', sacred: 'Sacred',
}

const RARITY_COLOR: Record<string, string> = {
  common: '#a1a1aa', uncommon: '#34d399', rare: '#60a5fa', 'true rare': '#4d8cff', sacred: '#c4b5fd',
}

const RARITY_BG: Record<string, string> = {
  common: 'linear-gradient(180deg, #1a1e14 0%, #1e2616 50%, #22301a 100%)',
  uncommon: 'linear-gradient(180deg, #0e1a16 0%, #122820 50%, #163228 100%)',
  rare: 'linear-gradient(180deg, #0e1420 0%, #121e30 50%, #162840 100%)',
  'true rare': 'linear-gradient(180deg, #14102a 0%, #1a1636 50%, #201c42 100%)',
  sacred: 'linear-gradient(180deg, #0c0a14 0%, #141020 50%, #1c162c 100%)',
}

const CATEGORY_LABEL: Record<string, string> = {
  fruit: '🍊 Fruit', flora: '🌿 Flora', gem: '💎 Gem', none: '',
}

const CATEGORY_COLOR: Record<string, string> = {
  fruit: '#fb923c', flora: '#a3e635', gem: '#a78bfa', none: '#71717a',
}

const TOTAL_WEIGHT = Object.keys(TREE_TYPES).filter(t => t !== 'spoiled' && t !== 'tangerine').reduce((sum, t) => sum + TREE_TYPES[t].weight, 0)

function getDropChance(weight: number): string {
  const pct = (weight / TOTAL_WEIGHT) * 100
  if (pct >= 1) return `${pct.toFixed(0)}%`
  if (pct >= 0.1) return `${pct.toFixed(1)}%`
  return `${pct.toFixed(2)}%`
}

const font = '"EB Garamond", serif'

function rarityPlantClass(rarity: string): string {
  switch (rarity) {
    case 'uncommon': return 'rarity-uncommon'
    case 'rare': return 'rarity-rare'
    case 'true rare': return 'rarity-true-rare'
    case 'sacred': return 'rarity-premium'
    default: return ''
  }
}

function rarityCardClass(rarity: string): string {
  switch (rarity) {
    case 'rare': return 'rarity-card-rare'
    case 'true rare': return 'rarity-card-true-rare'
    case 'sacred': return 'rarity-card-premium'
    default: return ''
  }
}

function Sparkles({ rarity, count }: { rarity: string; count: number }) {
  if (rarity !== 'sacred' && rarity !== 'true rare') return null
  const cls = 'sparkle-premium'
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
  if (rarity === 'true rare') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="trurerare-glow" cx="50%" cy="75%">
              <stop offset="0%" stopColor="rgba(77,140,255,0.1)">
                <animate attributeName="stopColor" values="rgba(77,140,255,0.06);rgba(77,140,255,0.14);rgba(77,140,255,0.06)" dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#trurerare-glow)" />
        </svg>
      </div>
    )
  }
  if (rarity === 'sacred') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="sac-core" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#1a1030" />
              <stop offset="100%" stopColor="#08060e" />
            </radialGradient>
            <radialGradient id="sac-glow" cx="50%" cy="60%">
              <stop offset="0%" stopColor="rgba(196,166,255,0.06)">
                <animate attributeName="stopColor" values="rgba(196,166,255,0.04);rgba(230,210,255,0.08);rgba(196,166,255,0.04)" dur="8s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="sac-halo" cx="50%" cy="30%">
              <stop offset="0%" stopColor="rgba(230,210,255,0.06)" />
              <stop offset="60%" stopColor="rgba(160,130,220,0.03)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#sac-core)" />
          <rect width="100%" height="100%" fill="url(#sac-glow)" />
          <rect width="100%" height="100%" fill="url(#sac-halo)" />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i}
              cx={`${12 + (i * 23) % 76}%`}
              cy={`${20 + (i * 17) % 60}%`}
              r={0.4 + (i % 3) * 0.2}
              fill={i % 3 === 0 ? '#d4b8ff' : i % 3 === 1 ? '#a78bfa' : '#e8deff'}
            >
              <animate attributeName="opacity" values="0;0.5;0" dur={`${6 + (i % 4) * 2}s`} begin={`${i * 1.2}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>
      </div>
    )
  }

  return null
}

const NIGHT_MARKET_SLOTS = 5
const TWELVE_HOURS = 12 * 60 * 60 * 1000

function getMarketEpoch() {
  return Math.floor(Date.now() / TWELVE_HOURS)
}

function getNextMarketRefresh() {
  return (getMarketEpoch() + 1) * TWELVE_HOURS
}

function generateMarketSeeds(epoch: number): { seeds: string[]; stock: Record<string, number>; discounts: Record<string, number> } {
  const allTypes = Object.keys(TREE_TYPES).filter(t => t !== 'spoiled' && t !== 'tangerine')
  const rng = seedRng(epoch)
  const selected: string[] = []
  const stock: Record<string, number> = {}
  const discounts: Record<string, number> = {}

  for (let i = 0; i < NIGHT_MARKET_SLOTS; i++) {
    const available = allTypes.filter(t => !selected.includes(t))
    if (available.length === 0) break
    const totalWeight = available.reduce((acc, t) => acc + TREE_TYPES[t].weight, 0)
    let r = rng() * totalWeight
    let picked = available[0]
    for (const t of available) {
      r -= TREE_TYPES[t].weight
      if (r <= 0) { picked = t; break }
    }
    selected.push(picked)
    const sv = rng() * 100
    stock[picked] = sv < 2 ? 7 : sv < 7 ? 3 : sv < 27 ? 2 : 1
    if (rng() < 0.07) {
      const pcts = [10, 15, 20, 25, 30]
      discounts[picked] = pcts[Math.floor(rng() * pcts.length)]
    }
  }

  return { seeds: selected, stock, discounts }
}

function seedRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

export const BoutiqueView = memo(function BoutiqueView({
  isOpen, onClose, theme, accent,
  sap, inventory, setSap, setInventory, setGrove,
  onUpdateConfig,
  initialTab, initialScrollTo,
  isAdmin
}: BoutiqueViewProps) {

  const [activeTab, setActiveTab] = useState<TabId>('shop')
  const [satchelFullPopup, setSatchelFullPopup] = useState(false)
  const [shopMode, setShopMode] = useState<'current' | 'seasonal'>('current')
  const [isRenderingCatalog, setIsRenderingCatalog] = useState(false)
  const [dailySeeds, setDailySeeds] = useState<string[]>([])
  const [shopStock, setShopStock] = useState<Record<string, number>>({})
  const [shopDiscounts, setShopDiscounts] = useState<Record<string, number>>({})
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null)
  const [previewStage, setPreviewStage] = useState(3)
  const [countdown, setCountdown] = useState('')
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set())
  const [flippingCard, setFlippingCard] = useState<number | null>(null)
  const [revealEffect, setRevealEffect] = useState<{ index: number; rarity: string } | null>(null)
  const [marketEpoch, setMarketEpoch] = useState(getMarketEpoch)
  const prevTabRef = useRef<TabId>('shop')

  const isDark = theme === 'dark'

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
      if (initialTab === 'catalog') {
        setIsRenderingCatalog(true)
        setTimeout(() => setIsRenderingCatalog(false), 20)
      }
    }
  }, [isOpen, initialTab, initialScrollTo])

  const bg = isDark ? '#09090b' : '#f5f3ef'
  const cardBg = isDark ? 'rgba(24,24,27,0.5)' : '#ffffff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'

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
    const tick = () => {
      const diff = getNextMarketRefresh() - Date.now()
      if (diff <= 0) {
        setCountdown('Refreshing...')
        const newEpoch = getMarketEpoch()
        if (newEpoch !== marketEpoch) {
          setMarketEpoch(newEpoch)
          setRevealedCards(new Set())
        }
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isOpen, marketEpoch])

  useEffect(() => {
    if (!isOpen) return
    const epoch = marketEpoch
    const lastReset = localStorage.getItem('pulp_last_market_reset')
    if (lastReset !== String(epoch)) {
      const { seeds, stock, discounts } = generateMarketSeeds(epoch)
      setDailySeeds(seeds)
      setShopStock(stock)
      setShopDiscounts(discounts)
      setRevealedCards(new Set())
      localStorage.setItem('pulp_last_market_reset', String(epoch))
      localStorage.setItem('pulp_daily_seeds', JSON.stringify(seeds))
      localStorage.setItem('pulp_shop_stock', JSON.stringify(stock))
      localStorage.setItem('pulp_shop_discounts', JSON.stringify(discounts))
      localStorage.removeItem('pulp_revealed_cards')
    } else {
      const savedSeeds = localStorage.getItem('pulp_daily_seeds')
      const savedStock = localStorage.getItem('pulp_shop_stock')
      const savedRevealed = localStorage.getItem('pulp_revealed_cards')
      const savedDiscounts = localStorage.getItem('pulp_shop_discounts')
      if (savedSeeds) setDailySeeds(JSON.parse(savedSeeds))
      if (savedStock) setShopStock(JSON.parse(savedStock))
      if (savedRevealed) setRevealedCards(new Set(JSON.parse(savedRevealed)))
      if (savedDiscounts) setShopDiscounts(JSON.parse(savedDiscounts))
    }
  }, [isOpen, marketEpoch])

  const revealCard = (index: number) => {
    if (revealedCards.has(index) || flippingCard !== null) return
    const type = dailySeeds[index]
    const rarity = type ? TREE_TYPES[type]?.rarity || 'common' : 'common'
    setFlippingCard(index)
    setTimeout(() => {
      const next = new Set(revealedCards)
      next.add(index)
      setRevealedCards(next)
      localStorage.setItem('pulp_revealed_cards', JSON.stringify([...next]))
      setFlippingCard(null)
      setRevealEffect({ index, rarity })
      const dur = rarity === 'sacred' ? 2500 : rarity === 'true rare' ? 1800 : rarity === 'rare' ? 1200 : rarity === 'uncommon' ? 800 : 500
      setTimeout(() => setRevealEffect(null), dur)
    }, 400)
  }

  const forceRefresh = () => {
    const newEpoch = Date.now()
    const { seeds, stock, discounts } = generateMarketSeeds(newEpoch)
    setDailySeeds(seeds)
    setShopStock(stock)
    setShopDiscounts(discounts)
    setRevealedCards(new Set())
    localStorage.setItem('pulp_last_market_reset', String(getMarketEpoch()))
    localStorage.setItem('pulp_daily_seeds', JSON.stringify(seeds))
    localStorage.setItem('pulp_shop_stock', JSON.stringify(stock))
    localStorage.setItem('pulp_shop_discounts', JSON.stringify(discounts))
    localStorage.removeItem('pulp_revealed_cards')
  }

  const getPrice = (type: string) => {
    const base = TREE_TYPES[type].cost
    const disc = shopDiscounts[type]
    return disc ? Math.floor(base * (1 - disc / 100)) : base
  }

  const buySeed = (type: string) => {
    if ((shopStock[type] || 0) <= 0) return
    if (inventory.length >= MAX_SEEDS) { setSatchelFullPopup(true); return }
    const price = getPrice(type)
    if (sap < price) return
    setSap((j: number) => j - price)
    const nextStock = { ...shopStock, [type]: shopStock[type] - 1 }
    setShopStock(nextStock)
    localStorage.setItem('pulp_shop_stock', JSON.stringify(nextStock))
    setInventory(inv => [...inv, type])
  }

  const discardSeed = (index: number) => setInventory(inv => inv.filter((_, i) => i !== index))

  if (!isOpen) return null

  const STAGE_NAMES = ['Seed', 'Seedling', 'Sprout', 'Young', 'Mature']
  const previewInfo = selectedPlant ? TREE_TYPES[selectedPlant] : null

  const CurrencyPill = ({ amount }: { amount: number }) => (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold tabular-nums ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"} border rounded-full px-2.5 py-1`}>
      <PulpIcon size={11} />
      {amount >= 999999 ? '∞' : amount.toLocaleString()}
    </span>
  )

  const tabIcons: Record<TabId, React.ReactNode> = {
    shop: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>,
    satchel: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2h8l2 4H6l2-4z"/><path d="M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6"/><path d="M9 6v2a3 3 0 006 0V6"/></svg>,
    catalog: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'shop', label: 'Shop' },
    { id: 'satchel', label: 'Satchel' },
    { id: 'catalog', label: 'Catalog' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/60 p-4" onMouseDown={onClose}>
      <style>{`
        .flip-card { perspective: 800px; }
        .flip-card-inner {
          position: relative; width: 100%; height: 100%;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .flip-card-inner.flipped { transform: rotateY(180deg); }
        .flip-card-face {
          position: absolute; inset: 0;
          backface-visibility: hidden; -webkit-backface-visibility: hidden;
          border-radius: 14px; overflow: hidden;
        }
        .flip-card-back { transform: rotateY(180deg); }
        .flip-card-front { cursor: pointer; }
        .flip-card-front:hover { transform: translateY(-2px); }
        @keyframes reveal-border-flash {
          0% { box-shadow: inset 0 0 0 0 var(--reveal-color); }
          20% { box-shadow: inset 0 0 60px 10px var(--reveal-color); }
          100% { box-shadow: inset 0 0 0 0 transparent; }
        }
        @keyframes modal-shake-sm {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-0.5px, 0.5px); }
          50% { transform: translate(0.5px, -0.5px); }
          75% { transform: translate(-0.5px, 0); }
        }
        @keyframes modal-shake-lg {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-4px, 3px); }
          20% { transform: translate(4px, -3px); }
          30% { transform: translate(-3px, 4px); }
          40% { transform: translate(3px, -2px); }
          50% { transform: translate(-3px, 2px); }
          60% { transform: translate(2px, -3px); }
          70% { transform: translate(-2px, 2px); }
          80% { transform: translate(2px, -1px); }
          90% { transform: translate(-1px, 1px); }
        }
        @keyframes sacred-vignette {
          0% { opacity: 0; }
          15% { opacity: 1; }
          40% { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @keyframes sacred-screen-flash {
          0% { opacity: 0; }
          8% { opacity: 0.7; }
          20% { opacity: 0; }
          28% { opacity: 0.4; }
          40% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes sacred-border-sweep {
          0% { opacity: 0; box-shadow: inset 0 0 0 0 var(--reveal-color); }
          15% { opacity: 1; box-shadow: inset 0 0 80px 20px var(--reveal-color); }
          40% { box-shadow: inset 0 0 40px 5px var(--reveal-color); }
          100% { opacity: 0; box-shadow: inset 0 0 0 0 transparent; }
        }
        @keyframes trurare-ripple {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        .modal-shake-rare { animation: modal-shake-sm 0.4s ease-out; }
        .modal-shake-trurare { animation: modal-shake-lg 0.7s ease-out; }
        .modal-shake-sacred { animation: modal-shake-lg 1s ease-out; }
      `}</style>
      <div
        onMouseDown={e => e.stopPropagation()}
        className={`relative w-full max-w-[1060px] rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border overflow-hidden flex flex-col ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"} ${revealEffect?.rarity === 'sacred' ? 'modal-shake-sacred' : revealEffect?.rarity === 'true rare' ? 'modal-shake-trurare' : revealEffect?.rarity === 'rare' ? 'modal-shake-rare' : ''}`}
        key={revealEffect ? `shake-${revealEffect.index}` : 'stable'}
        style={{ backgroundColor: bg, height: 720 }}
      >
        {/* Header */}
        <div className={`px-6 pt-4 pb-3 border-b shrink-0 flex items-center justify-between ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <CurrencyPill amount={sap} />
          </div>
        </div>

        {/* Plant Preview (when selected) */}
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

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: bg, display: 'flex', flexDirection: 'column' }}>

          {/* SHOP */}
          {activeTab === 'shop' && !selectedPlant && (
            <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Toggle + Timer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                {/* Current / Seasonal toggle */}
                <div className={`flex rounded-lg overflow-hidden p-0.5 text-[10px] font-semibold`} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  {(['current', 'seasonal'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setShopMode(mode)}
                      className="px-3 py-1 rounded-md transition-all"
                      style={{
                        background: shopMode === mode ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent',
                        color: shopMode === mode ? textPrimary : textMuted,
                        fontFamily: font, letterSpacing: '0.02em', textTransform: 'capitalize',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                {/* Timer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.05)', padding: '4px 10px', borderRadius: '99px', border: `1px solid ${isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.1)'}` }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#ef4444', fontFamily: font }}>refreshes in</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace', letterSpacing: '0.02em' }}>{countdown}</span>
                </div>
              </div>

              {shopMode === 'seasonal' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.4 }}>
                  <span style={{ fontSize: 28 }}>🍂</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: textMuted, fontFamily: font }}>Seasonal shop coming soon</span>
                </div>
              ) : (<>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 500, fontFamily: font, color: '#d97706', letterSpacing: '0.06em', fontStyle: 'italic' }}>Daily Picks</span>
              </div>
              {/* 5 Flip Cards */}
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flex: 1, alignItems: 'center', maxHeight: 460 }}>
                {dailySeeds.map((type, i) => {
                  const t = TREE_TYPES[type]
                  if (!t) return null
                  const isRevealed = revealedCards.has(i)
                  const isFlipping = flippingCard === i
                  const soldOut = (shopStock[type] || 0) <= 0
                  const rarityCol = RARITY_COLOR[t.rarity] || '#a1a1aa'
                  const discount = shopDiscounts[type] || 0
                  const price = getPrice(type)

                  return (
                    <div key={`${type}-${i}`} className="flip-card" style={{ width: '20%', maxWidth: 190, aspectRatio: '3/4.2', position: 'relative' }}>
                      <div className={`flip-card-inner ${isRevealed || isFlipping ? 'flipped' : ''}`}>
                        {/* Front - Unrevealed */}
                        <div
                          className="flip-card-face flip-card-front"
                          onClick={() => revealCard(i)}
                          style={{
                            background: isDark
                              ? `linear-gradient(180deg, #18181b 0%, #0f0f12 100%)`
                              : `linear-gradient(180deg, #fafaf9 0%, #f0ede8 100%)`,
                            border: `1px solid ${cardBorder}`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: isDark ? `0 2px 12px rgba(0,0,0,0.3), inset 0 0 30px ${rarityCol}08` : `0 2px 10px rgba(0,0,0,0.05), inset 0 0 30px ${rarityCol}06`,
                          }}
                        >
                          {/* Rarity color hint — subtle bottom edge glow */}
                          <div style={{
                            position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 2,
                            borderRadius: '1px 1px 0 0',
                            background: rarityCol, opacity: isDark ? 0.2 : 0.15,
                          }} />
                          {/* Rarity hint — faint radial at bottom */}
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                            background: `radial-gradient(ellipse at bottom, ${rarityCol}${isDark ? '0a' : '08'} 0%, transparent 70%)`,
                            pointerEvents: 'none',
                          }} />
                          {/* Inner border detail */}
                          <div style={{
                            position: 'absolute', inset: 6, borderRadius: 8,
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
                            pointerEvents: 'none',
                          }} />
                          {/* Center diamond */}
                          <div style={{
                            width: 10, height: 10, transform: 'rotate(45deg)',
                            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                            borderRadius: 2,
                          }} />
                          {/* Corner dots */}
                          {[[8, 8], [8, undefined], [undefined, 8], [undefined, undefined]].map(([t2, l], ci) => (
                            <div key={ci} style={{
                              position: 'absolute',
                              top: t2 !== undefined ? t2 : undefined,
                              bottom: t2 === undefined ? 8 : undefined,
                              left: l !== undefined ? l : undefined,
                              right: l === undefined ? 8 : undefined,
                              width: 3, height: 3, borderRadius: '50%',
                              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                            }} />
                          ))}
                          {/* Discount badge hint */}
                          {discount > 0 && (
                            <div style={{
                              position: 'absolute', top: 8, right: 8,
                              fontSize: 7, fontWeight: 800, color: '#ef4444',
                              opacity: isDark ? 0.3 : 0.25,
                            }}>%</div>
                          )}
                        </div>

                        {/* Back - Revealed */}
                        <div
                          className={`flip-card-face flip-card-back ${rarityCardClass(t.rarity)}`}
                          style={{
                            background: RARITY_BG[t.rarity] || (isDark ? 'linear-gradient(180deg, #1a1a1e 0%, #141416 100%)' : 'linear-gradient(180deg, #f0ede8 0%, #e8e4dd 100%)'),
                            border: `1px solid ${cardBorder}`,
                            display: 'flex', flexDirection: 'column',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            if (isRevealed) {
                              prevTabRef.current = activeTab
                              setSelectedPlant(type)
                              setPreviewStage(0)
                            }
                          }}
                        >
                          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                            <RarityScene rarity={t.rarity} />
                            <Sparkles rarity={t.rarity} count={4} />
                            <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 16px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 4 }} />
                            <div style={{
                              position: 'absolute', top: 6, left: 6, fontSize: 7, fontWeight: 700,
                              color: rarityCol, letterSpacing: '0.06em', textTransform: 'uppercase',
                              background: 'rgba(0,0,0,0.45)', padding: '2px 5px', borderRadius: 3,
                              backdropFilter: 'blur(4px)', zIndex: 5,
                            }}>
                              {RARITY_LABEL[t.rarity]}
                            </div>
                            {soldOut ? (
                              <div style={{
                                position: 'absolute', top: 6, right: 6, fontSize: 7, fontWeight: 700,
                                color: textMuted, textTransform: 'uppercase',
                                background: isDark ? 'rgba(39,39,42,0.8)' : 'rgba(228,228,231,0.9)', padding: '2px 6px', borderRadius: 3,
                                backdropFilter: 'blur(4px)', zIndex: 5,
                              }}>Sold out</div>
                            ) : (
                              <div style={{
                                position: 'absolute', top: 6, right: 6, fontSize: 7, fontWeight: 700,
                                color: 'rgba(255,255,255,0.5)',
                                background: 'rgba(0,0,0,0.45)', padding: '2px 6px', borderRadius: 3,
                                backdropFilter: 'blur(4px)', zIndex: 5,
                              }}>x{shopStock[type]}</div>
                            )}
                            {discount > 0 && (
                              <div style={{
                                position: 'absolute', bottom: 6, left: 6, fontSize: 8, fontWeight: 800,
                                color: '#fff', background: '#ef4444', padding: '2px 5px', borderRadius: 3,
                                zIndex: 5,
                              }}>-{discount}%</div>
                            )}
                            <div className={rarityPlantClass(t.rarity)} style={{ position: 'relative', zIndex: 4, marginBottom: '10%' }}>
                              <PlantIcon type={type} size={80} stage={3} hideGround />
                            </div>
                            {/* Grassy hill */}
                            <svg viewBox="0 0 100 18" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '14%', zIndex: 3 }}>
                              <defs>
                                <linearGradient id={`mkt-soil-${i}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={isDark ? '#2e2414' : '#6e5c3a'} />
                                  <stop offset="100%" stopColor={isDark ? '#1a1408' : '#4e3e22'} />
                                </linearGradient>
                              </defs>
                              <rect y="3" width="100" height="15" fill={`url(#mkt-soil-${i})`} />
                              <path d="M-1 4 Q4 2.5 10 3.5 Q16 1.5 24 3 Q30 1 38 2.8 Q44 1 52 3 Q58 0.5 66 2.5 Q72 1 80 2.8 Q86 0.5 94 2.5 Q98 1.5 101 3 L101 6.5 Q94 5 86 5.8 Q78 4.5 70 5.5 Q62 4 54 5.5 Q46 4 38 5.5 Q30 4 22 5.5 Q14 4 6 5.5 L-1 6Z" fill={isDark ? '#1e3e16' : '#4a7a2e'} />
                              <path d="M-1 3 Q5 1 12 2.5 Q18 0 26 2 Q32 0 40 1.8 Q46 0 54 2 Q60 0 68 1.8 Q74 0 82 2 Q88 0 96 2 Q100 1 101 2 L101 5 Q94 3.5 86 4.5 Q78 3 70 4 Q62 3 54 4 Q46 3 38 4 Q30 3 22 4 Q14 3 6 4 L-1 4.5Z" fill={isDark ? '#2a4a1e' : '#5a8a3a'} />
                              <path d="M-1 2.5 Q6 1 14 2 Q20 0 28 1.5 Q34 0 42 1.5 Q48 0 56 1.5 Q62 0 70 1.5 Q76 0 84 1.5 Q90 0 98 1.5 L101 2 L101 4 Q92 3 84 3.5 Q76 2.5 68 3.2 Q60 2.5 52 3.2 Q44 2.5 36 3.2 Q28 2.5 20 3.2 Q12 2.5 4 3.2 L-1 3.5Z" fill={isDark ? '#345828' : '#6a9a4a'} />
                              <path d="M4 2 Q3 -0.5 2 -2 M5 2.2 Q5.5 0 6.5 -1" stroke={isDark ? '#4a6a38' : '#7aaa58'} strokeWidth="0.4" fill="none" opacity="0.5" strokeLinecap="round" />
                              <path d="M30 1.5 Q28.5 -0.5 27.5 -2 M31 1.8 Q31.5 0 32 -1.5" stroke={isDark ? '#4a6a38' : '#7aaa58'} strokeWidth="0.4" fill="none" opacity="0.5" strokeLinecap="round" />
                              <path d="M57 1.5 Q55.5 -0.5 54 -2 M58 1.5 Q58.5 0 59 -1.5" stroke={isDark ? '#4a6a38' : '#7aaa58'} strokeWidth="0.4" fill="none" opacity="0.5" strokeLinecap="round" />
                              <path d="M84 1.5 Q82.5 -0.5 81 -2 M85 1.5 Q85.5 0 86 -1.5" stroke={isDark ? '#4a6a38' : '#7aaa58'} strokeWidth="0.4" fill="none" opacity="0.5" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div style={{
                            padding: '7px 10px', borderTop: `1px solid ${dividerColor}`,
                            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)',
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, fontFamily: font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                              <span style={{ fontSize: 8, fontWeight: 600, color: rarityCol, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                {getDropChance(t.weight)}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <PulpIcon size={10} />
                                {discount > 0 ? (
                                  <>
                                    <span style={{ textDecoration: 'line-through', opacity: 0.4, fontSize: 9 }}>{t.cost}</span>
                                    <span>{price.toLocaleString()}</span>
                                  </>
                                ) : (
                                  t.cost.toLocaleString()
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Reveal glow on card (rare+) */}
                      {revealEffect?.index === i && revealEffect.rarity !== 'common' && revealEffect.rarity !== 'uncommon' && (
                        <div style={{
                          position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none', zIndex: 10,
                          ['--reveal-color' as string]: `${RARITY_COLOR[revealEffect.rarity]}30`,
                          animation: `reveal-border-flash ${revealEffect.rarity === 'sacred' ? '2s' : revealEffect.rarity === 'true rare' ? '1.2s' : '0.8s'} ease-out forwards`,
                        }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Nav buttons below cards */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 18 }}>
                <button
                  onClick={() => setActiveTab('satchel')}
                  className={`px-5 py-2 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-2 w-48 justify-center ${isDark ? 'bg-zinc-800/60 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/60' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                  style={{ border: `1px solid ${cardBorder}`, fontFamily: font }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2h8l2 4H6l2-4z"/><path d="M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6"/><path d="M9 6v2a3 3 0 006 0V6"/></svg>
                  Satchel
                  <span style={{ fontSize: 9, opacity: 0.5 }}>{inventory.length}/{MAX_SEEDS}</span>
                </button>
                <button
                  onClick={() => { setActiveTab('catalog'); setIsRenderingCatalog(true); setSelectedPlant(null); setTimeout(() => setIsRenderingCatalog(false), 20) }}
                  className={`px-5 py-2 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-2 w-48 justify-center ${isDark ? 'bg-zinc-800/60 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/60' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                  style={{ border: `1px solid ${cardBorder}`, fontFamily: font }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                  Catalog
                </button>
              </div>
              </>
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
                background: previewInfo.sceneBg || RARITY_BG[previewInfo.rarity] || (isDark ? 'linear-gradient(180deg, #1a1a1e 0%, #141416 100%)' : 'linear-gradient(180deg, #f0ede8 0%, #e8e4dd 100%)'),
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
                <span style={{ fontSize: 11, color: textMuted, fontFamily: font, marginLeft: 8 }}>
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
                const discPrice = getPrice(selectedPlant!)
                const cantAfford = sap < discPrice
                const disc = shopDiscounts[selectedPlant!] || 0
                if (stock <= 0) return (
                  <div className="mt-5 px-6 py-2.5 rounded-lg text-[13px] font-bold" style={{
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
                      className="px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all hover:brightness-110"
                      style={{
                        fontFamily: font, cursor: cantAfford ? 'default' : 'pointer', border: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#d97706', color: '#fff',
                        opacity: cantAfford ? 0.35 : 1,
                      }}
                    >
                      Buy Seed
                      <span style={{ opacity: 0.6, marginLeft: 2 }}>·</span>
                      <PulpIcon size={10} />
                      {disc > 0 ? (
                        <>
                          <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: 11 }}>{previewInfo.cost}</span>
                          {discPrice.toLocaleString()}
                        </>
                      ) : previewInfo.cost.toLocaleString()}
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

          {/* SATCHEL */}
          {activeTab === 'satchel' && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setActiveTab('shop')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, fontFamily: font, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Back
                </button>
                <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Satchel</span>
                <span className={`text-[11px] font-semibold ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{inventory.length}/{MAX_SEEDS}</span>
              </div>
              {inventory.length === 0 ? (
                <div className={`text-center py-16 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  <div className="text-[32px] mb-3 opacity-40">🌱</div>
                  <div className="text-[14px] font-medium">No seeds yet</div>
                  <div className="text-[12px] mt-1 opacity-70">Buy seeds from the market to grow your orchard.</div>
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

          {/* CATALOG */}
          {activeTab === 'catalog' && (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <button
                  onClick={() => setActiveTab('shop')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, fontFamily: font, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Back
                </button>
              </div>
              {isRenderingCatalog ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', opacity: 0.6 }}>
                  <span style={{ fontSize: 24, marginBottom: 12 }}>📖</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: textMuted, fontFamily: font }}>Opening catalog...</span>
                </div>
              ) : (
                RARITY_ORDER.map(rarity => {
                  const plants = Object.keys(TREE_TYPES).filter(t => TREE_TYPES[t].rarity === rarity && t !== 'spoiled')
                  if (plants.length === 0) return null
                  return (
                  <div key={rarity} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: RARITY_COLOR[rarity] }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{RARITY_LABEL[rarity]}</span>
                      <div style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px 10px' }}>
                      {plants.map(type => {
                        const t = TREE_TYPES[type]
                        const owned = inventory.includes(type)
                        return (
                          <button
                            key={type}
                            className={rarityCardClass(t.rarity)}
                            onClick={() => { prevTabRef.current = activeTab; setSelectedPlant(type); setPreviewStage(3); setActiveTab('shop') }}
                            style={{
                              borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden',
                              backgroundColor: cardBg, cursor: 'pointer', textAlign: 'left',
                              transition: 'all 0.15s', position: 'relative', fontFamily: font,
                            }}
                          >
                            <div style={{
                              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                              width: '100%', position: 'relative', aspectRatio: '1',
                              background: RARITY_BG[t.rarity] || (isDark ? 'linear-gradient(180deg, #1a1a1e 0%, #141416 100%)' : 'linear-gradient(180deg, #f0ede8 0%, #e8e4dd 100%)'),
                            }}>
                              <RarityScene rarity={t.rarity} />
                              <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 12px rgba(0,0,0,0.25)', pointerEvents: 'none', zIndex: 4 }} />
                              <Sparkles rarity={t.rarity} count={3} />
                              <div className={rarityPlantClass(t.rarity)} style={{ position: 'relative', zIndex: 2, bottom: '7%' }}>
                                <PlantIcon type={type} size={120} stage={3} hideGround />
                              </div>
                              <svg viewBox="0 0 100 18" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '12%', zIndex: 3 }}>
                                <defs>
                                  <linearGradient id={`soil-g-${type}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isDark ? '#2e2414' : '#6e5c3a'} />
                                    <stop offset="100%" stopColor={isDark ? '#1a1408' : '#4e3e22'} />
                                  </linearGradient>
                                </defs>
                                <rect y="3" width="100" height="15" fill={`url(#soil-g-${type})`} />
                                <path d="M-1 4 Q4 2.5 10 3.5 Q16 1.5 24 3 Q30 1 38 2.8 Q44 1 52 3 Q58 0.5 66 2.5 Q72 1 80 2.8 Q86 0.5 94 2.5 Q98 1.5 101 3 L101 6.5 Q94 5 86 5.8 Q78 4.5 70 5.5 Q62 4 54 5.5 Q46 4 38 5.5 Q30 4 22 5.5 Q14 4 6 5.5 L-1 6Z" fill={isDark ? '#1e3e16' : '#4a7a2e'} />
                                <path d="M-1 3 Q5 1 12 2.5 Q18 0 26 2 Q32 0 40 1.8 Q46 0 54 2 Q60 0 68 1.8 Q74 0 82 2 Q88 0 96 2 Q100 1 101 2 L101 5 Q94 3.5 86 4.5 Q78 3 70 4 Q62 3 54 4 Q46 3 38 4 Q30 3 22 4 Q14 3 6 4 L-1 4.5Z" fill={isDark ? '#2a4a1e' : '#5a8a3a'} />
                                <path d="M-1 2.5 Q6 1 14 2 Q20 0 28 1.5 Q34 0 42 1.5 Q48 0 56 1.5 Q62 0 70 1.5 Q76 0 84 1.5 Q90 0 98 1.5 L101 2 L101 4 Q92 3 84 3.5 Q76 2.5 68 3.2 Q60 2.5 52 3.2 Q44 2.5 36 3.2 Q28 2.5 20 3.2 Q12 2.5 4 3.2 L-1 3.5Z" fill={isDark ? '#345828' : '#6a9a4a'} />
                                <path d="M4 2 Q3 -0.5 2 -2 M5 2.2 Q5.5 0 6.5 -1 M6.5 2 Q8 0.5 9 -0.8" stroke={isDark ? '#4a6a38' : '#7aaa58'} strokeWidth="0.4" fill="none" opacity="0.5" strokeLinecap="round" />
                                <path d="M16 1 Q14.5 -1 13 -2.5 M17 1.2 Q17.5 -0.5 18 -2 M18.5 1 Q20 -0.2 21.5 -1.2" stroke={isDark ? '#3a5a2a' : '#6a9a48'} strokeWidth="0.35" fill="none" opacity="0.45" strokeLinecap="round" />
                                <path d="M30 1.5 Q28.5 -0.5 27.5 -2 M31 1.8 Q31.5 0 32 -1.5 M32.5 1.5 Q34 0 35.5 -1" stroke={isDark ? '#4a6a38' : '#7aaa58'} strokeWidth="0.4" fill="none" opacity="0.5" strokeLinecap="round" />
                                <path d="M44 1 Q42.5 -1 41.5 -2.5 M45 1.2 Q45.5 -0.5 46 -1.8" stroke={isDark ? '#3a5a2a' : '#6a9a48'} strokeWidth="0.35" fill="none" opacity="0.4" strokeLinecap="round" />
                                <path d="M57 1.5 Q55.5 -0.5 54 -2 M58 1.5 Q58.5 0 59 -1.5 M59.5 1.5 Q61 0 62.5 -1" stroke={isDark ? '#4a6a38' : '#7aaa58'} strokeWidth="0.4" fill="none" opacity="0.5" strokeLinecap="round" />
                                <path d="M71 1 Q69.5 -0.8 68.5 -2 M72 1.2 Q72.5 -0.2 73 -1.5" stroke={isDark ? '#3a5a2a' : '#6a9a48'} strokeWidth="0.35" fill="none" opacity="0.45" strokeLinecap="round" />
                                <path d="M84 1.5 Q82.5 -0.5 81 -2 M85 1.5 Q85.5 0 86 -1.5 M86.5 1.5 Q88 0.2 89.5 -0.8" stroke={isDark ? '#4a6a38' : '#7aaa58'} strokeWidth="0.4" fill="none" opacity="0.5" strokeLinecap="round" />
                                <path d="M95 1 Q93.5 -0.5 92.5 -2 M96 1.2 Q96.5 -0.2 97 -1.5" stroke={isDark ? '#3a5a2a' : '#6a9a48'} strokeWidth="0.35" fill="none" opacity="0.4" strokeLinecap="round" />
                              </svg>
                              <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 7, fontWeight: 700, color: RARITY_COLOR[t.rarity], letterSpacing: '0.04em', background: 'rgba(0,0,0,0.5)', padding: '1px 4px', borderRadius: 3, backdropFilter: 'blur(4px)', zIndex: 2 }}>
                                {getDropChance(t.weight)}
                              </div>
                              {type === 'tangerine' ? (
                                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 700, color: '#fb923c', letterSpacing: '0.06em', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)', zIndex: 2, textTransform: 'uppercase' }}>
                                  Default
                                </div>
                              ) : owned && (
                                <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', backgroundColor: isDark ? 'rgba(6,78,59,0.8)' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', zIndex: 2 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#34d399" : "#059669"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              )}
                            </div>
                            <div style={{ padding: '6px 8px', borderTop: `1px solid ${dividerColor}` }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                              <div style={{ marginTop: 2 }}>
                                <span style={{ fontSize: 8, fontWeight: 600, color: RARITY_COLOR[t.rarity], letterSpacing: '0.06em', textTransform: 'uppercase' }}>{RARITY_LABEL[t.rarity]}</span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })
              )}
            </div>
          )}

        </div>

        {/* Admin refresh button */}
        {isAdmin && activeTab === 'shop' && !selectedPlant && (
          <button
            onClick={forceRefresh}
            style={{
              position: 'absolute', bottom: 16, right: 16,
              width: 36, height: 36, borderRadius: '50%',
              background: isDark ? 'rgba(39,39,42,0.8)' : 'rgba(228,228,231,0.9)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: isDark ? '#a1a1aa' : '#71717a',
              backdropFilter: 'blur(4px)',
              zIndex: 10,
            }}
            title="Force refresh (admin)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
          </button>
        )}

        {/* Reveal effects overlay */}
        {revealEffect && (revealEffect.rarity === 'rare' || revealEffect.rarity === 'true rare' || revealEffect.rarity === 'sacred') && (() => {
          const col = RARITY_COLOR[revealEffect.rarity]
          const isSacred = revealEffect.rarity === 'sacred'
          const isTrueRare = revealEffect.rarity === 'true rare'
          return (
            <>
              {/* Vignette */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50, borderRadius: 16, overflow: 'hidden',
                background: `radial-gradient(ellipse at 50% 50%, transparent 30%, ${col}${isSacred ? '18' : isTrueRare ? '0c' : '08'} 100%)`,
                animation: `sacred-vignette ${isSacred ? '2.5s' : isTrueRare ? '1.5s' : '1s'} ease-out forwards`,
              }} />
              {/* Border sweep for true rare + sacred */}
              {(isTrueRare || isSacred) && (
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 51, borderRadius: 16,
                  ['--reveal-color' as string]: `${col}20`,
                  animation: `sacred-border-sweep ${isSacred ? '2s' : '1.2s'} ease-out forwards`,
                }} />
              )}
              {/* Expanding ripples for true rare */}
              {isTrueRare && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 49, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 16 }}>
                  {[0, 0.15, 0.3].map((delay, ri) => (
                    <div key={ri} style={{
                      position: 'absolute', width: 100, height: 100, borderRadius: '50%',
                      border: `1.5px solid ${col}40`,
                      animation: `trurare-ripple 1.2s ease-out ${delay}s forwards`,
                      opacity: 0,
                    }} />
                  ))}
                </div>
              )}
              {/* Sacred: screen flash + more ripples + center burst */}
              {isSacred && (
                <>
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 52, borderRadius: 16,
                    background: `radial-gradient(circle at 50% 50%, ${col}30 0%, ${col}08 50%, transparent 70%)`,
                    animation: 'sacred-screen-flash 2.5s ease-out forwards',
                  }} />
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 49, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 16 }}>
                    {[0, 0.12, 0.24, 0.36, 0.48].map((delay, ri) => (
                      <div key={ri} style={{
                        position: 'absolute', width: 80, height: 80, borderRadius: '50%',
                        border: `2px solid ${col}50`,
                        animation: `trurare-ripple 1.6s ease-out ${delay}s forwards`,
                        opacity: 0,
                      }} />
                    ))}
                  </div>
                </>
              )}
            </>
          )
        })()}

        {/* Satchel full popup */}
        {satchelFullPopup && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onMouseDown={() => setSatchelFullPopup(false)}
          >
            <div
              onMouseDown={e => e.stopPropagation()}
              className={`rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
              style={{ fontFamily: font }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>Satchel Full</div>
              <div style={{ fontSize: 12, color: textSecondary, lineHeight: 1.5 }}>
                You have {MAX_SEEDS}/{MAX_SEEDS} seeds. Plant or discard some before buying more.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setSatchelFullPopup(false); setActiveTab('satchel') }}
                  className="px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={{ background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Open Satchel
                </button>
                <button
                  onClick={() => setSatchelFullPopup(false)}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'}`}
                  style={{ background: 'none', border: `1px solid ${cardBorder}`, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
