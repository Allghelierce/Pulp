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
  common: '#a1a1aa',
  uncommon: '#34d399',
  rare: '#60a5fa',
  'true rare': '#4d8cff',
  sacred: '#c4b5fd',
}

const SHOP_RARITY_COLOR: Record<string, string> = {
  common: '#8a7a6a',
  uncommon: '#6b8f5e',
  rare: '#b8860b',
  'true rare': '#8b4513',
  sacred: '#722f37',
}

const RARITY_BG: Record<string, string> = {
  common: 'linear-gradient(180deg, #1a1e14 0%, #1e2616 50%, #22301a 100%)',
  uncommon: 'linear-gradient(180deg, #0e1a16 0%, #122820 50%, #163228 100%)',
  rare: 'linear-gradient(180deg, #0e1420 0%, #121e30 50%, #162840 100%)',
  'true rare': 'linear-gradient(180deg, #14102a 0%, #1a1636 50%, #201c42 100%)',
  sacred: 'linear-gradient(180deg, #0c0a14 0%, #141020 50%, #1c162c 100%)',
}

const SHOP_BG: Record<string, string> = {
  common: 'linear-gradient(180deg, #e8e0d4 0%, #d4caba 100%)',
  uncommon: 'linear-gradient(180deg, #dde8d4 0%, #c2d4b0 100%)',
  rare: 'linear-gradient(180deg, #e8dcc4 0%, #d4c4a0 100%)',
  'true rare': 'linear-gradient(180deg, #ddd0c0 0%, #c4aa88 100%)',
  sacred: 'linear-gradient(180deg, #e0d0c8 0%, #c8a898 100%)',
}

const SHOP_BG_DARK: Record<string, string> = {
  common: 'linear-gradient(180deg, #1e1c18 0%, #16140f 100%)',
  uncommon: 'linear-gradient(180deg, #181e14 0%, #121a0e 100%)',
  rare: 'linear-gradient(180deg, #1e1a10 0%, #18140a 100%)',
  'true rare': 'linear-gradient(180deg, #1e1610 0%, #18100a 100%)',
  sacred: 'linear-gradient(180deg, #1e1416 0%, #180e10 100%)',
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

function RarityScene({ rarity, isDark }: { rarity: string; isDark: boolean }) {
  if (rarity === 'true rare') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="trurerare-glow" cx="50%" cy="75%">
              <stop offset="0%" stopColor={isDark ? 'rgba(139,69,19,0.1)' : 'rgba(139,69,19,0.06)'}>
                <animate attributeName="stopColor" values={isDark ? 'rgba(139,69,19,0.06);rgba(139,69,19,0.14);rgba(139,69,19,0.06)' : 'rgba(139,69,19,0.04);rgba(139,69,19,0.08);rgba(139,69,19,0.04)'} dur="6s" repeatCount="indefinite" />
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
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="sac-glow" cx="50%" cy="60%">
              <stop offset="0%" stopColor={isDark ? 'rgba(114,47,55,0.06)' : 'rgba(114,47,55,0.04)'}>
                <animate attributeName="stopColor" values={isDark ? 'rgba(114,47,55,0.04);rgba(160,80,60,0.08);rgba(114,47,55,0.04)' : 'rgba(114,47,55,0.03);rgba(160,80,60,0.06);rgba(114,47,55,0.03)'} dur="8s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#sac-glow)" />
          {Array.from({ length: 6 }).map((_, i) => (
            <circle key={i}
              cx={`${15 + (i * 23) % 70}%`}
              cy={`${20 + (i * 17) % 60}%`}
              r={0.4 + (i % 3) * 0.2}
              fill={isDark ? '#d4a574' : '#8b6040'}
            >
              <animate attributeName="opacity" values="0;0.35;0" dur={`${6 + (i % 4) * 2}s`} begin={`${i * 1.2}s`} repeatCount="indefinite" />
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
  const [crackingCard, setCrackingCard] = useState<number | null>(null)
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
    if (revealedCards.has(index) || crackingCard !== null) return
    const type = dailySeeds[index]
    const rarity = type ? TREE_TYPES[type]?.rarity || 'common' : 'common'
    setCrackingCard(index)
    setTimeout(() => {
      const next = new Set(revealedCards)
      next.add(index)
      setRevealedCards(next)
      localStorage.setItem('pulp_revealed_cards', JSON.stringify([...next]))
      setCrackingCard(null)
      setRevealEffect({ index, rarity })
      const dur = rarity === 'sacred' ? 2500 : rarity === 'true rare' ? 1800 : rarity === 'rare' ? 1200 : rarity === 'uncommon' ? 800 : 500
      setTimeout(() => setRevealEffect(null), dur)
    }, 600)
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
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/60 p-4" onMouseDown={onClose} onWheel={e => e.stopPropagation()} onTouchMove={e => e.preventDefault()} style={{ overscrollBehavior: 'contain' }}>
      <style>{`
        @keyframes seed-wobble {
          0%, 100% { transform: scale(1) rotate(0deg); }
          15% { transform: scale(1.04) rotate(-2deg); }
          30% { transform: scale(0.97) rotate(2deg); }
          45% { transform: scale(1.02) rotate(-1deg); }
          60% { transform: scale(0.99) rotate(1deg); }
          75% { transform: scale(1.01) rotate(0deg); }
        }
        @keyframes seed-crack {
          0% { clip-path: inset(0); opacity: 1; }
          40% { clip-path: inset(0); opacity: 1; }
          60% { clip-path: polygon(0 0, 48% 0, 45% 50%, 42% 100%, 0 100%); opacity: 0.8; }
          80% { clip-path: polygon(0 0, 46% 0, 40% 50%, 38% 100%, 0 100%); opacity: 0.3; }
          100% { clip-path: polygon(0 0, 44% 0, 36% 50%, 34% 100%, 0 100%); opacity: 0; }
        }
        @keyframes seed-crack-right {
          0% { clip-path: inset(0); opacity: 1; }
          40% { clip-path: inset(0); opacity: 1; }
          60% { clip-path: polygon(52% 0, 100% 0, 100% 100%, 58% 100%, 55% 50%); opacity: 0.8; }
          80% { clip-path: polygon(54% 0, 100% 0, 100% 100%, 62% 100%, 60% 50%); opacity: 0.3; }
          100% { clip-path: polygon(56% 0, 100% 0, 100% 100%, 66% 100%, 64% 50%); opacity: 0; }
        }
        @keyframes sprout-emerge {
          0% { transform: scaleY(0) translateY(20px); transform-origin: center bottom; opacity: 0; }
          40% { transform: scaleY(0.1) translateY(15px); transform-origin: center bottom; opacity: 0; }
          60% { transform: scaleY(0.6) scaleX(0.8) translateY(5px); transform-origin: center bottom; opacity: 1; }
          80% { transform: scaleY(1.08) scaleX(1.02) translateY(-3px); transform-origin: center bottom; opacity: 1; }
          90% { transform: scaleY(0.97) scaleX(1) translateY(1px); transform-origin: center bottom; opacity: 1; }
          100% { transform: scaleY(1) scaleX(1) translateY(0); transform-origin: center bottom; opacity: 1; }
        }
        @keyframes leaf-scatter {
          0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 0; }
          15% { opacity: 1; transform: translate(var(--lx1), var(--ly1)) rotate(45deg) scale(1); }
          100% { opacity: 0; transform: translate(var(--lx2), var(--ly2)) rotate(var(--lr)) scale(0.3); }
        }
        @keyframes pollen-drift {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          20% { opacity: 0.7; transform: translate(var(--px1), var(--py1)) scale(1); }
          100% { opacity: 0; transform: translate(var(--px2), var(--py2)) scale(0.5); }
        }
        @keyframes vine-unfurl {
          0% { stroke-dashoffset: 200; opacity: 0; }
          20% { opacity: 0.4; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes golden-bloom {
          0% { transform: scale(0); opacity: 0; }
          30% { transform: scale(1.2); opacity: 0.15; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes seed-spin-reveal {
          0% { transform: rotateY(0) scale(1); }
          30% { transform: rotateY(180deg) scale(0.9); }
          60% { transform: rotateY(360deg) scale(1.05); }
          100% { transform: rotateY(360deg) scale(1); }
        }
        @keyframes rarity-pulse {
          0%, 100% { box-shadow: 0 0 8px var(--pulse-col), 0 4px 20px var(--pulse-col20); }
          50% { box-shadow: 0 0 18px var(--pulse-col), 0 4px 30px var(--pulse-col40); }
        }
        @keyframes shop-pollen {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          10% { opacity: 0.4; transform: translate(var(--sp-x1), var(--sp-y1)) scale(1); }
          90% { opacity: 0.15; }
          100% { opacity: 0; transform: translate(var(--sp-x2), var(--sp-y2)) scale(0.3); }
        }
        @keyframes shop-leaf-float {
          0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 0; }
          10% { opacity: 0.3; transform: translate(var(--sl-x1), var(--sl-y1)) rotate(45deg) scale(1); }
          90% { opacity: 0.1; }
          100% { opacity: 0; transform: translate(var(--sl-x2), var(--sl-y2)) rotate(var(--sl-r)) scale(0.2); }
        }
        @keyframes daily-deal-glow {
          0%, 100% { box-shadow: 0 0 12px #d9770630, 0 0 24px #d9770610; }
          50% { box-shadow: 0 0 20px #d9770650, 0 0 40px #d9770625; }
        }
        .seed-packet { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .seed-packet:hover { transform: translateY(-4px); }
        .seed-cracking { animation: seed-spin-reveal 0.6s ease-in-out, seed-wobble 0.6s ease-in-out !important; }
        .seed-revealed { animation: rarity-pulse 3s ease-in-out infinite; }
        .daily-deal { animation: daily-deal-glow 2.5s ease-in-out infinite !important; }
      `}</style>
      <div
        onMouseDown={e => e.stopPropagation()}
        className={`relative w-full max-w-[1060px] rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border overflow-hidden flex flex-col ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"}`}
        style={{ backgroundColor: bg, height: '85vh', maxHeight: '85vh' }}
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
            <div style={{ padding: '2px 24px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingBottom: '8%' }}>
              {/* Hanging vines + bottom oranges */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <svg viewBox="0 0 1060 700" style={{ width: '100%', height: '100%' }} fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {(() => { const g = isDark ? '#5a9a3a' : '#3a7a1e'; const gl = isDark ? '#7aba5a' : '#5a9a3a'; return (<>
                    {/* Vine A — far left, long, detailed */}
                    <g opacity={isDark ? 0.06 : 0.045}>
                      <path d="M45 0 Q38 50 48 100 Q56 145 44 190 Q36 230 42 270 Q50 300 44 330" stroke={g} strokeWidth="1.5" />
                      <path d="M45 0 Q40 50 50 100 Q58 145 46 190" stroke={gl} strokeWidth="0.4" opacity="0.3" />
                      <path d="M48 35 Q35 28 30 38 Q38 41 48 35" fill={g} />
                      <path d="M36 33 Q34 36 38 38" stroke={gl} strokeWidth="0.3" fill="none" opacity="0.5" />
                      <path d="M44 95 Q54 86 60 96 Q52 99 44 95" fill={gl} />
                      <path d="M50 91 Q54 93 52 96" stroke={g} strokeWidth="0.3" fill="none" opacity="0.5" />
                      <path d="M48 150 Q36 142 32 152 Q40 155 48 150" fill={g} />
                      <path d="M42 210 Q52 202 58 212 Q50 215 42 210" fill={gl} />
                      <path d="M44 275 Q32 268 28 278 Q36 280 44 275" fill={g} />
                      {/* Tendrils */}
                      <path d="M46 65 Q40 58 36 62 Q34 66 38 68" stroke={g} strokeWidth="0.5" fill="none" />
                      <path d="M42 190 Q36 183 32 188 Q30 192 34 194" stroke={gl} strokeWidth="0.4" fill="none" />
                      <path d="M44 310 Q38 304 34 308 Q33 312 36 314" stroke={g} strokeWidth="0.4" fill="none" />
                    </g>

                    {/* Vine B — left, textured */}
                    <g opacity={isDark ? 0.05 : 0.035}>
                      <path d="M150 0 Q145 40 155 75 Q162 105 152 140 Q146 168 150 195" stroke={g} strokeWidth="1.3" />
                      <path d="M150 0 Q147 40 157 75 Q164 105 154 140" stroke={gl} strokeWidth="0.3" opacity="0.3" />
                      <path d="M155 28 Q145 20 140 30 Q147 33 155 28" fill={g} />
                      <path d="M146 25 Q144 28 148 30" stroke={gl} strokeWidth="0.3" fill="none" opacity="0.5" />
                      <path d="M152 80 Q162 72 167 82 Q160 85 152 80" fill={gl} />
                      <path d="M150 135 Q140 128 136 138 Q143 140 150 135" fill={g} />
                      <path d="M152 170 Q162 164 166 174 Q159 176 152 170" fill={gl} />
                      <path d="M154 55 Q148 48 144 52 Q143 56 146 57" stroke={g} strokeWidth="0.4" fill="none" />
                    </g>

                    {/* Vine C — left-center, wispy with curls */}
                    <g opacity={isDark ? 0.04 : 0.025}>
                      <path d="M310 0 Q305 30 312 58 Q318 80 310 105 Q304 125 308 145" stroke={g} strokeWidth="1" />
                      <path d="M312 35 Q302 28 298 38 Q305 40 312 35" fill={g} />
                      <path d="M310 70 Q320 63 324 73 Q317 75 310 70" fill={gl} />
                      <path d="M308 110 Q298 104 294 114 Q301 116 308 110" fill={g} />
                      <path d="M312 48 Q316 42 314 38 Q312 36 310 40" stroke={gl} strokeWidth="0.4" fill="none" />
                    </g>

                    {/* Vine D — center-left, thick */}
                    <g opacity={isDark ? 0.04 : 0.03}>
                      <path d="M440 0 Q448 35 438 70 Q430 100 440 130 Q448 155 442 180" stroke={g} strokeWidth="1.2" />
                      <path d="M440 0 Q450 35 440 70" stroke={gl} strokeWidth="0.3" opacity="0.3" />
                      <path d="M438 40 Q450 32 454 42 Q447 45 438 40" fill={gl} />
                      <path d="M448 37 Q452 39 450 42" stroke={g} strokeWidth="0.3" fill="none" opacity="0.5" />
                      <path d="M440 90 Q428 83 424 93 Q432 95 440 90" fill={g} />
                      <path d="M442 145 Q452 138 456 148 Q449 150 442 145" fill={gl} />
                      <path d="M439 60 Q444 53 442 48 Q439 46 438 50" stroke={g} strokeWidth="0.4" fill="none" />
                    </g>

                    {/* Vine E — center, tiny */}
                    <g opacity={isDark ? 0.03 : 0.02}>
                      <path d="M560 0 Q555 20 560 42 Q565 58 558 72" stroke={g} strokeWidth="0.8" />
                      <path d="M560 25 Q550 20 548 28 Q553 30 560 25" fill={g} />
                      <path d="M558 50 Q566 44 570 52 Q564 54 558 50" fill={gl} />
                    </g>

                    {/* Vine F — center-right, long curvy */}
                    <g opacity={isDark ? 0.05 : 0.04}>
                      <path d="M650 0 Q658 45 648 95 Q640 135 652 180 Q660 215 650 250 Q644 275 648 300" stroke={g} strokeWidth="1.4" />
                      <path d="M650 0 Q660 45 650 95 Q642 135 654 180" stroke={gl} strokeWidth="0.4" opacity="0.25" />
                      <path d="M648 50 Q638 42 634 52 Q641 55 648 50" fill={g} />
                      <path d="M640 47 Q637 50 641 52" stroke={gl} strokeWidth="0.3" fill="none" opacity="0.5" />
                      <path d="M652 100 Q662 92 668 102 Q660 105 652 100" fill={gl} />
                      <path d="M648 155 Q636 148 632 158 Q640 160 648 155" fill={g} />
                      <path d="M650 215 Q660 208 664 218 Q657 220 650 215" fill={gl} />
                      <path d="M648 265 Q638 258 634 268 Q641 270 648 265" fill={g} />
                      <path d="M651 75 Q646 68 642 72 Q640 76 644 78" stroke={g} strokeWidth="0.5" fill="none" />
                      <path d="M649 240 Q654 233 652 228 Q649 226 648 230" stroke={gl} strokeWidth="0.4" fill="none" />
                    </g>

                    {/* Vine G — right, medium */}
                    <g opacity={isDark ? 0.04 : 0.03}>
                      <path d="M780 0 Q785 30 778 65 Q772 90 780 115 Q786 135 782 155" stroke={g} strokeWidth="1.1" />
                      <path d="M778 32 Q788 25 792 35 Q785 37 778 32" fill={gl} />
                      <path d="M780 75 Q770 68 766 78 Q773 80 780 75" fill={g} />
                      <path d="M782 120 Q792 114 796 124 Q789 126 782 120" fill={gl} />
                      <path d="M779 52 Q784 45 782 40 Q779 38 778 42" stroke={g} strokeWidth="0.4" fill="none" />
                    </g>

                    {/* Vine H — right, long thick */}
                    <g opacity={isDark ? 0.05 : 0.04}>
                      <path d="M920 0 Q928 55 918 110 Q910 155 922 200 Q930 240 920 280" stroke={g} strokeWidth="1.5" />
                      <path d="M920 0 Q930 55 920 110 Q912 155 924 200" stroke={gl} strokeWidth="0.4" opacity="0.25" />
                      <path d="M918 45 Q930 38 934 48 Q927 50 918 45" fill={gl} />
                      <path d="M928 42 Q932 44 930 48" stroke={g} strokeWidth="0.3" fill="none" opacity="0.5" />
                      <path d="M922 100 Q910 93 906 103 Q914 105 922 100" fill={g} />
                      <path d="M918 160 Q928 153 932 163 Q925 165 918 160" fill={gl} />
                      <path d="M920 220 Q908 214 904 224 Q912 226 920 220" fill={g} />
                      <path d="M919 75 Q924 68 922 62 Q919 60 918 64" stroke={gl} strokeWidth="0.5" fill="none" />
                      <path d="M921 250 Q914 244 910 248 Q909 252 912 254" stroke={g} strokeWidth="0.4" fill="none" />
                    </g>

                    {/* Vine I — far right */}
                    <g opacity={isDark ? 0.04 : 0.03}>
                      <path d="M1020 0 Q1015 35 1022 70 Q1028 95 1018 125 Q1012 148 1016 170" stroke={g} strokeWidth="1.2" />
                      <path d="M1022 30 Q1032 24 1036 34 Q1029 36 1022 30" fill={gl} />
                      <path d="M1018 80 Q1008 73 1004 83 Q1011 85 1018 80" fill={g} />
                      <path d="M1016 130 Q1026 123 1030 133 Q1023 135 1016 130" fill={gl} />
                      <path d="M1020 52 Q1025 46 1023 40 Q1020 38 1019 42" stroke={g} strokeWidth="0.4" fill="none" />
                    </g>

                    {/* Vine J — tiny between B and C */}
                    <g opacity={isDark ? 0.03 : 0.02}>
                      <path d="M240 0 Q235 22 240 48 Q245 65 238 82" stroke={g} strokeWidth="0.8" />
                      <path d="M240 30 Q232 24 228 32 Q234 34 240 30" fill={g} />
                      <path d="M238 60 Q246 55 250 62 Q244 64 238 60" fill={gl} />
                    </g>

                  </>)})()}
                </svg>
              </div>
              {/* Toggle + Timer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, position: 'relative', zIndex: 1 }}>
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
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.4, position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: 28 }}>🍂</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: textMuted, fontFamily: font }}>Seasonal shop coming soon</span>
                </div>
              ) : (<>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginBottom: 2, position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: '"EB Garamond", serif', color: isDark ? '#dcd8d0' : '#2a2620', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Shop</span>
                <svg width="180" height="20" viewBox="0 0 180 20" style={{ marginTop: 10, opacity: isDark ? 0.3 : 0.25 }}>
                  {(() => { const c = isDark ? '#dcd8d0' : '#2a2620'; return (<>
                    <polygon points="5,10 10,6.5 15,10 10,13.5" fill={c} />
                    <line x1="15" y1="10" x2="60" y2="10" stroke={c} strokeWidth="0.7" />
                    <path d="M60 10 Q65 10 68 6.5 Q71 3 74 5.5 Q77 8 74 10 Q71 12 68 10" fill="none" stroke={c} strokeWidth="0.8" strokeLinecap="round" />
                    <path d="M74 10 Q77 7.5 80 5 Q83 2.5 86 6 Q87.5 8.5 86 10" fill="none" stroke={c} strokeWidth="0.7" strokeLinecap="round" />
                    <polygon points="90,5 93,10 90,15 87,10" fill="#d97706" />
                    <path d="M94 10 Q92.5 8.5 94 6 Q97 2.5 100 5 Q103 7.5 106 10" fill="none" stroke={c} strokeWidth="0.7" strokeLinecap="round" />
                    <path d="M106 10 Q109 12 112 10 Q115 8 112 5.5 Q109 3 112 6.5 Q115 10 120 10" fill="none" stroke={c} strokeWidth="0.8" strokeLinecap="round" />
                    <line x1="120" y1="10" x2="165" y2="10" stroke={c} strokeWidth="0.7" />
                    <polygon points="165,10 170,6.5 175,10 170,13.5" fill={c} />
                  </>)})()}
                </svg>
              </div>
              {/* 5 Oval Seed Packets */}
              {(() => {
                const dealIdx = dailySeeds.reduce((best, type, i) => {
                  const d = shopDiscounts[type] || 0
                  const bd = shopDiscounts[dailySeeds[best]] || 0
                  return d > bd ? i : best
                }, 0)
                const hasDeal = (shopDiscounts[dailySeeds[dealIdx]] || 0) > 0
                return (
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flex: 1, alignItems: 'center', position: 'relative', zIndex: 1 }}>
                {/* Ambient particles */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
                  {Array.from({ length: 8 }).map((_, pi) => {
                    const x1 = -20 + Math.sin(pi * 1.3) * 30
                    const y1 = -10 + Math.cos(pi * 0.9) * 20
                    const x2 = 40 + Math.sin(pi * 2.1) * 60
                    const y2 = -80 - Math.random() * 60
                    return (
                      <div key={`p-${pi}`} style={{
                        position: 'absolute',
                        left: `${10 + (pi * 11) % 80}%`,
                        top: `${30 + (pi * 17) % 50}%`,
                        width: 3, height: 3, borderRadius: '50%',
                        backgroundColor: isDark ? '#d9770640' : '#d9770630',
                        ['--sp-x1' as string]: `${x1}px`, ['--sp-y1' as string]: `${y1}px`,
                        ['--sp-x2' as string]: `${x2}px`, ['--sp-y2' as string]: `${y2}px`,
                        animation: `shop-pollen ${8 + pi * 1.5}s ease-in-out ${pi * 1.2}s infinite`,
                      }} />
                    )
                  })}
                  {Array.from({ length: 5 }).map((_, li) => {
                    const x1 = 15 + Math.sin(li * 2) * 20
                    const y1 = -10 + Math.cos(li) * 15
                    const x2 = 30 + Math.sin(li * 3) * 50
                    const y2 = -60 - Math.random() * 40
                    const rot = 120 + li * 60
                    return (
                      <div key={`l-${li}`} style={{
                        position: 'absolute',
                        left: `${5 + (li * 19) % 85}%`,
                        top: `${50 + (li * 13) % 40}%`,
                        width: 8, height: 5,
                        backgroundColor: isDark ? '#6a8a4a20' : '#5a7a3a18',
                        borderRadius: '50% 50% 50% 0',
                        ['--sl-x1' as string]: `${x1}px`, ['--sl-y1' as string]: `${y1}px`,
                        ['--sl-x2' as string]: `${x2}px`, ['--sl-y2' as string]: `${y2}px`,
                        ['--sl-r' as string]: `${rot}deg`,
                        animation: `shop-leaf-float ${12 + li * 2}s ease-in-out ${li * 2.5}s infinite`,
                      }} />
                    )
                  })}
                </div>
                {dailySeeds.map((type, i) => {
                  const isDailyDeal = hasDeal && i === dealIdx
                  const t = TREE_TYPES[type]
                  if (!t) return null
                  const isRevealed = revealedCards.has(i)
                  const isCracking = crackingCard === i
                  const soldOut = (shopStock[type] || 0) <= 0
                  const rarityCol = SHOP_RARITY_COLOR[t.rarity] || '#8a7a6a'
                  const discount = shopDiscounts[type] || 0
                  const price = getPrice(type)
                  const cardW = 180
                  const cardH = 320

                  return (
                    <div key={`${type}-${i}`} style={{ position: 'relative', width: cardW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* Daily deal label */}
                      {isDailyDeal && (
                        <div style={{
                          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                          fontSize: 7, fontWeight: 800, color: '#d97706', letterSpacing: '0.1em',
                          textTransform: 'uppercase', whiteSpace: 'nowrap', zIndex: 20,
                          background: isDark ? 'rgba(217,119,6,0.1)' : 'rgba(217,119,6,0.08)',
                          padding: '2px 8px', borderRadius: 4,
                          border: `1px solid ${isDark ? 'rgba(217,119,6,0.2)' : 'rgba(217,119,6,0.15)'}`,
                        }}>Daily Deal</div>
                      )}
                      {/* Seed card */}
                      <div
                        className={`seed-packet ${isCracking ? 'seed-cracking' : ''} ${isRevealed ? 'seed-revealed' : ''} ${isDailyDeal && !isRevealed ? 'daily-deal' : ''}`}
                        onClick={() => !isRevealed && revealCard(i)}
                        style={{
                          width: cardW, height: cardH, borderRadius: 14,
                          position: 'relative', overflow: 'hidden',
                          cursor: 'pointer',
                          ['--pulse-col' as string]: `${rarityCol}30`,
                          ['--pulse-col20' as string]: `${rarityCol}15`,
                          ['--pulse-col40' as string]: `${rarityCol}30`,
                          boxShadow: isRevealed
                            ? `0 4px 20px ${rarityCol}20, 0 2px 8px rgba(0,0,0,0.15)`
                            : isDailyDeal
                              ? undefined
                              : isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)',
                          border: `1px solid ${isRevealed ? `${rarityCol}35` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                        }}
                      >
                        {!isRevealed ? (
                          /* Unrevealed — kraft paper seed packet */
                          <div
                            onClick={() => revealCard(i)}
                            style={{
                              width: '100%', height: '100%', borderRadius: 'inherit',
                              background: isDark
                                ? `radial-gradient(circle at 40% 35%, #2a2520 0%, #1e1a15 60%, #141210 100%)`
                                : `radial-gradient(circle at 40% 35%, #f0e8d8 0%, #e0d4c0 60%, #d0c4a8 100%)`,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              position: 'relative',
                            }}
                          >
                            {/* Botanical filigree border */}
                            <svg viewBox="0 0 180 320" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                              {(() => { const fc = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'; return (<>
                                <rect x="12" y="12" width="156" height="296" rx="8" fill="none" stroke={fc} strokeWidth="0.5" />
                                <path d="M12 40 Q30 38 36 28 Q38 35 48 36" fill="none" stroke={fc} strokeWidth="0.5" />
                                <path d="M168 40 Q150 38 144 28 Q142 35 132 36" fill="none" stroke={fc} strokeWidth="0.5" />
                                <path d="M12 280 Q30 282 36 292 Q38 285 48 284" fill="none" stroke={fc} strokeWidth="0.5" />
                                <path d="M168 280 Q150 282 144 292 Q142 285 132 284" fill="none" stroke={fc} strokeWidth="0.5" />
                                <circle cx="12" cy="40" r="1.5" fill={fc} />
                                <circle cx="168" cy="40" r="1.5" fill={fc} />
                                <circle cx="12" cy="280" r="1.5" fill={fc} />
                                <circle cx="168" cy="280" r="1.5" fill={fc} />
                                <line x1="48" y1="16" x2="132" y2="16" stroke={fc} strokeWidth="0.3" strokeDasharray="2 4" />
                                <line x1="48" y1="304" x2="132" y2="304" stroke={fc} strokeWidth="0.3" strokeDasharray="2 4" />
                              </>)})()}
                            </svg>
                            {/* Sprouting seed */}
                            {(() => {
                              const isRareUp = t.rarity === 'rare' || t.rarity === 'true rare' || t.rarity === 'sacred'
                              const seedCol = isRareUp ? '#d97706' : (isDark ? '#8a7a6a' : '#6a5a4a')
                              const sproutCol = isRareUp ? '#e8a020' : (isDark ? '#6a8a4a' : '#5a7a3a')
                              return (
                                <svg width="40" height="52" viewBox="0 0 40 52" style={{ opacity: isDark ? 0.35 : 0.4 }}>
                                  {/* Seed body */}
                                  <ellipse cx="20" cy="38" rx="8" ry="10" fill={seedCol} opacity="0.6" />
                                  <ellipse cx="20" cy="38" rx="8" ry="10" stroke={seedCol} strokeWidth="1" fill="none" opacity="0.8" />
                                  {/* Crack line */}
                                  <path d="M20 30 Q18 34 20 38 Q22 34 20 30" stroke={seedCol} strokeWidth="0.8" fill="none" opacity="0.5" />
                                  {/* Sprout stem */}
                                  <path d="M20 30 Q19 24 20 16" stroke={sproutCol} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                                  {/* Left leaf */}
                                  <path d="M20 22 Q14 18 12 14 Q16 16 20 20" fill={sproutCol} opacity="0.7" />
                                  {/* Right leaf */}
                                  <path d="M20 18 Q26 14 28 10 Q24 13 20 16" fill={sproutCol} opacity="0.7" />
                                  {/* Tiny unfurling leaf at top */}
                                  <path d="M20 16 Q18 12 16 10 Q18 11 20 14" fill={sproutCol} opacity="0.5" />
                                </svg>
                              )
                            })()}
                            {/* Discount badge */}
                            {discount > 0 && (
                              <div style={{
                                position: 'absolute', top: 14, right: 18,
                                fontSize: 8, fontWeight: 800, color: '#d97706',
                                opacity: isDark ? 0.4 : 0.35,
                              }}>%</div>
                            )}
                          </div>
                        ) : (
                          /* Revealed — plant on earthy ground */
                          <div
                            onClick={() => {
                              prevTabRef.current = activeTab
                              setSelectedPlant(type)
                              setPreviewStage(0)
                            }}
                            style={{
                              width: '100%', height: '100%', borderRadius: 'inherit',
                              background: isDark ? (SHOP_BG_DARK[t.rarity] || SHOP_BG_DARK.common) : (SHOP_BG[t.rarity] || SHOP_BG.common),
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                              position: 'relative', overflow: 'hidden',
                            }}
                          >
                            <RarityScene rarity={t.rarity} isDark={isDark} />
                            <Sparkles rarity={t.rarity} count={3} />
                            {/* Botanical filigree border */}
                            <svg viewBox="0 0 180 320" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 6 }}>
                              {(() => { const fc = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'; return (<>
                                <rect x="10" y="10" width="160" height="300" rx="8" fill="none" stroke={fc} strokeWidth="0.5" />
                                <path d="M10 38 Q28 36 34 26 Q36 33 46 34" fill="none" stroke={fc} strokeWidth="0.5" />
                                <path d="M170 38 Q152 36 146 26 Q144 33 134 34" fill="none" stroke={fc} strokeWidth="0.5" />
                                <path d="M10 282 Q28 284 34 294 Q36 287 46 286" fill="none" stroke={fc} strokeWidth="0.5" />
                                <path d="M170 282 Q152 284 146 294 Q144 287 134 286" fill="none" stroke={fc} strokeWidth="0.5" />
                                <circle cx="10" cy="38" r="1.5" fill={fc} />
                                <circle cx="170" cy="38" r="1.5" fill={fc} />
                                <circle cx="10" cy="282" r="1.5" fill={fc} />
                                <circle cx="170" cy="282" r="1.5" fill={fc} />
                                <line x1="46" y1="14" x2="134" y2="14" stroke={fc} strokeWidth="0.3" strokeDasharray="2 4" />
                                <line x1="46" y1="306" x2="134" y2="306" stroke={fc} strokeWidth="0.3" strokeDasharray="2 4" />
                              </>)})()}
                            </svg>
                            {/* Inner vignette */}
                            <div style={{
                              position: 'absolute', inset: 0, borderRadius: 'inherit',
                              boxShadow: `inset 0 0 20px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`,
                              pointerEvents: 'none', zIndex: 4,
                            }} />
                            {/* Rarity label */}
                            <div style={{
                              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                              fontSize: 7, fontWeight: 700, color: rarityCol,
                              letterSpacing: '0.08em', textTransform: 'uppercase',
                              background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                              padding: '2px 6px', borderRadius: 3,
                              backdropFilter: 'blur(4px)', zIndex: 5,
                              whiteSpace: 'nowrap',
                            }}>
                              {RARITY_LABEL[t.rarity]}
                            </div>
                            {/* Tree name */}
                            <div style={{
                              position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                              fontSize: 11, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)',
                              fontFamily: '"EB Garamond", serif', letterSpacing: '0.04em',
                              background: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.65)',
                              padding: '2px 8px', borderRadius: 3,
                              backdropFilter: 'blur(4px)', zIndex: 5,
                              whiteSpace: 'nowrap',
                            }}>
                              {t.name}
                            </div>
                            {/* Stock / sold out */}
                            {soldOut ? (
                              <div style={{
                                position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
                                fontSize: 7, fontWeight: 700, color: textMuted, textTransform: 'uppercase',
                                background: isDark ? 'rgba(39,39,42,0.8)' : 'rgba(228,228,231,0.9)',
                                padding: '2px 6px', borderRadius: 3,
                                backdropFilter: 'blur(4px)', zIndex: 5,
                              }}>Sold out</div>
                            ) : (
                              <div style={{
                                position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
                                fontSize: 7, fontWeight: 700,
                                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
                                background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)',
                                padding: '2px 6px', borderRadius: 3,
                                backdropFilter: 'blur(4px)', zIndex: 5,
                              }}>x{shopStock[type]}</div>
                            )}
                            {/* Discount badge - now on price tag */}
                            {discount > 0 && false && (
                              <div style={{
                                position: 'absolute', bottom: 36, right: 18,
                                fontSize: 8, fontWeight: 800, color: '#fff',
                                background: '#d97706', padding: '2px 5px', borderRadius: 3,
                                zIndex: 5,
                              }}>-{discount}%</div>
                            )}
                            {/* Plant — centered, base overlaps into grass */}
                            <div style={{
                              position: 'absolute', bottom: '15%', left: 0, right: 0,
                              display: 'flex', justifyContent: 'center',
                              zIndex: 2,
                            }}>
                              <div className={rarityPlantClass(t.rarity)} style={{
                                animation: isRevealed && revealEffect?.index === i ? 'sprout-emerge 0.3s ease-out' : undefined,
                                position: 'relative',
                              }}>
                                <PlantIcon type={type} size={120} stage={3} hideGround />
                                {/* Ground blend */}
                                <div style={{
                                  position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
                                  width: '60%', height: 10, zIndex: 5,
                                  background: `linear-gradient(to top, ${isDark ? '#2a4a1e' : '#5a8a3a'} 0%, transparent 100%)`,
                                  borderRadius: '50%',
                                }} />
                              </div>
                            </div>
                            {/* Ground */}
                            <svg viewBox="0 0 180 60" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '22%', zIndex: 3 }}>
                              <defs>
                                <linearGradient id={`ground-${i}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={isDark ? '#3a5a2a' : '#6a9a4a'} />
                                  <stop offset="40%" stopColor={isDark ? '#2a4a1e' : '#5a8a3a'} />
                                  <stop offset="100%" stopColor={isDark ? '#1a3412' : '#3a6a22'} />
                                </linearGradient>
                              </defs>
                              <path d="M0 18 Q20 10 45 13 Q70 8 90 11 Q120 7 145 12 Q165 10 180 14 L180 60 L0 60 Z" fill={`url(#ground-${i})`} />
                              <path d="M0 18 Q20 10 45 13 Q70 8 90 11 Q120 7 145 12 Q165 10 180 14" fill="none" stroke={isDark ? '#4a6a38' : '#7aaa58'} strokeWidth="0.6" opacity="0.3" />
                            </svg>
                          </div>
                        )}
                        {/* Crack overlay during reveal */}
                        {isCracking && (
                          <>
                            <div style={{
                              position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: 10,
                              background: isDark
                                ? `radial-gradient(circle at 40% 35%, #2a2520 0%, #1e1a15 60%, #141210 100%)`
                                : `radial-gradient(circle at 40% 35%, #f0e8d8 0%, #e0d4c0 60%, #d0c4a8 100%)`,
                              animation: 'seed-crack 0.6s ease-in forwards',
                            }} />
                            <div style={{
                              position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: 10,
                              background: isDark
                                ? `radial-gradient(circle at 40% 35%, #2a2520 0%, #1e1a15 60%, #141210 100%)`
                                : `radial-gradient(circle at 40% 35%, #f0e8d8 0%, #e0d4c0 60%, #d0c4a8 100%)`,
                              animation: 'seed-crack-right 0.6s ease-in forwards',
                            }} />
                          </>
                        )}
                      </div>
                      {/* Hanging parchment price tag */}
                      {(() => {
                        const tagRot = [(-3), 2, (-1.5), 3, (-2.5)][i % 5]
                        const tagOffX = [(-6), 8, 3, (-9), 5][i % 5]
                        const stringH = [18, 22, 16, 24, 20][i % 5]
                        return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', visibility: isRevealed ? 'visible' : 'hidden', marginTop: -2, marginLeft: tagOffX, transform: `rotate(${tagRot}deg)`, transformOrigin: 'top center' }}>
                        <svg width="2" height={stringH} style={{ overflow: 'visible' }}>
                          <line x1="1" y1="0" x2={1 + tagRot * 0.3} y2={stringH} stroke={isDark ? 'rgba(180,160,130,0.4)' : 'rgba(120,100,70,0.35)'} strokeWidth="0.8" />
                        </svg>
                        <div style={{
                          position: 'relative',
                          background: isDark
                            ? 'linear-gradient(145deg, #2a2418 0%, #1e1a14 50%, #252018 100%)'
                            : 'linear-gradient(145deg, #f2e8d4 0%, #e8dcc4 50%, #f0e4ce 100%)',
                          border: `1px solid ${isDark ? 'rgba(180,160,130,0.15)' : 'rgba(140,120,80,0.2)'}`,
                          borderRadius: 2,
                          padding: '3px 8px 4px',
                          minWidth: 44,
                          textAlign: 'center' as const,
                          boxShadow: isDark
                            ? '0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)'
                            : '0 2px 6px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                        }}>
                          <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', pointerEvents: 'none' }}>
                            {[0.25, 0.5, 0.75].map(y => (
                              <div key={y} style={{ position: 'absolute', left: '8%', right: '8%', top: `${y * 100}%`, height: 0.5, background: isDark ? 'rgba(180,160,130,0.05)' : 'rgba(140,120,80,0.05)' }} />
                            ))}
                          </div>
                          <div style={{
                            position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
                            width: 4, height: 4, borderRadius: '50%',
                            background: isDark ? '#0e0d0b' : '#e0d8c8',
                            border: `0.5px solid ${isDark ? 'rgba(180,160,130,0.2)' : 'rgba(140,120,80,0.15)'}`,
                          }} />
                          {discount > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                              <span style={{ fontSize: 7, fontWeight: 800, color: '#dc2626', fontFamily: font, letterSpacing: '0.02em' }}>-{discount}%</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 0 }}>
                                <PulpIcon size={8} />
                                <span style={{ fontSize: 7, fontWeight: 600, color: isDark ? '#8a7a60' : '#9a8a6a', textDecoration: 'line-through', fontFamily: font }}>{t.cost}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PulpIcon size={8} />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', fontFamily: font }}>{price}</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 0 }}>
                              <PulpIcon size={8} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? '#d4c4a0' : '#4a3a20', fontFamily: font }}>{price}</span>
                            </div>
                          )}
                        </div>
                      </div>
                        )
                      })()}

                      {/* Leaf scatter effect on reveal (rare+) */}
                      {revealEffect?.index === i && (revealEffect.rarity === 'rare' || revealEffect.rarity === 'true rare' || revealEffect.rarity === 'sacred') && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 20 }}>
                          {Array.from({ length: revealEffect.rarity === 'sacred' ? 12 : revealEffect.rarity === 'true rare' ? 8 : 5 }).map((_, li) => {
                            const angle = (li / (revealEffect.rarity === 'sacred' ? 12 : revealEffect.rarity === 'true rare' ? 8 : 5)) * Math.PI * 2
                            const dist1 = 20 + Math.random() * 15
                            const dist2 = 50 + Math.random() * 40
                            return (
                              <div key={li} style={{
                                position: 'absolute', width: 6, height: 4,
                                backgroundColor: revealEffect.rarity === 'sacred' ? '#d97706' : revealEffect.rarity === 'true rare' ? '#8b6040' : '#6b8f5e',
                                borderRadius: '50% 50% 50% 0',
                                ['--lx1' as string]: `${Math.cos(angle) * dist1}px`,
                                ['--ly1' as string]: `${Math.sin(angle) * dist1}px`,
                                ['--lx2' as string]: `${Math.cos(angle) * dist2}px`,
                                ['--ly2' as string]: `${Math.sin(angle) * dist2 + 20}px`,
                                ['--lr' as string]: `${180 + Math.random() * 360}deg`,
                                animation: `leaf-scatter ${revealEffect.rarity === 'sacred' ? '1.6s' : '1.2s'} ease-out ${li * 0.05}s forwards`,
                              }} />
                            )
                          })}
                        </div>
                      )}
                      {/* Pollen drift for true rare + sacred */}
                      {revealEffect?.index === i && (revealEffect.rarity === 'true rare' || revealEffect.rarity === 'sacred') && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 19 }}>
                          {Array.from({ length: revealEffect.rarity === 'sacred' ? 16 : 8 }).map((_, pi) => {
                            const angle = Math.random() * Math.PI * 2
                            const d1 = 10 + Math.random() * 20
                            const d2 = 40 + Math.random() * 60
                            return (
                              <div key={pi} style={{
                                position: 'absolute', width: 3, height: 3, borderRadius: '50%',
                                backgroundColor: revealEffect.rarity === 'sacred' ? '#d4a040' : '#a08050',
                                ['--px1' as string]: `${Math.cos(angle) * d1}px`,
                                ['--py1' as string]: `${Math.sin(angle) * d1 - 10}px`,
                                ['--px2' as string]: `${Math.cos(angle) * d2}px`,
                                ['--py2' as string]: `${Math.sin(angle) * d2 - 30}px`,
                                animation: `pollen-drift ${revealEffect.rarity === 'sacred' ? '2s' : '1.5s'} ease-out ${pi * 0.08}s forwards`,
                              }} />
                            )
                          })}
                        </div>
                      )}
                      {/* Golden bloom burst for sacred */}
                      {revealEffect?.index === i && revealEffect.rarity === 'sacred' && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 18 }}>
                          {[0, 0.1, 0.2].map((delay, ri) => (
                            <div key={ri} style={{
                              position: 'absolute', width: cardW * 0.6, height: cardH * 0.6,
                              borderRadius: '50%', left: -(cardW * 0.3), top: -(cardH * 0.3),
                              background: `radial-gradient(circle, ${rarityCol}30 0%, transparent 70%)`,
                              animation: `golden-bloom 2s ease-out ${delay}s forwards`,
                            }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
                )
              })()}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10, position: 'relative', zIndex: 2 }}>
                <button
                  onClick={() => { setActiveTab('catalog'); setIsRenderingCatalog(true); setSelectedPlant(null); setTimeout(() => setIsRenderingCatalog(false), 20) }}
                  className="transition-all hover:scale-105 active:scale-95"
                  style={{
                    padding: '5px 14px', borderRadius: 6,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    color: isDark ? '#dcd8d0' : '#2a2620', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 10, fontWeight: 600, fontFamily: font, letterSpacing: '0.04em',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                  Catalog
                </button>
              </div>

              </>
              )}
            </div>
          )}

          {activeTab === 'shop' && selectedPlant && previewInfo && (() => {
            const stock = shopStock[selectedPlant!] || 0
            const discPrice = getPrice(selectedPlant!)
            const cantAfford = sap < discPrice
            const disc = shopDiscounts[selectedPlant!] || 0
            const rarityCol = SHOP_RARITY_COLOR[previewInfo.rarity] || '#8a7a6a'
            const cat = previewInfo.category || 'none'
            const desc = cat === 'fruit'
              ? `A ${RARITY_LABEL[previewInfo.rarity].toLowerCase()} fruit tree that produces ${previewInfo.sapYield || 2} sap when harvested.`
              : cat === 'flora'
              ? `A ${RARITY_LABEL[previewInfo.rarity].toLowerCase()} ornamental plant. Yields ${previewInfo.sapYield || 2} sap at maturity.`
              : cat === 'gem'
              ? `A ${RARITY_LABEL[previewInfo.rarity].toLowerCase()} crystalline tree that yields gems when sap is collected.`
              : `A ${RARITY_LABEL[previewInfo.rarity].toLowerCase()} specimen. Produces ${previewInfo.sapYield || 2} sap when mature.`

            return (
            <div style={{ padding: '32px 40px', flex: 1, display: 'flex', alignItems: 'center', gap: 40, minHeight: 0 }}>
              {/* Left — plant preview */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 220, height: 260, borderRadius: 16, overflow: 'hidden', position: 'relative',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  background: isDark
                    ? (SHOP_BG_DARK[previewInfo.rarity] || SHOP_BG_DARK.common)
                    : (SHOP_BG[previewInfo.rarity] || SHOP_BG.common),
                }}>
                  <RarityScene rarity={previewInfo.rarity} isDark={isDark} />
                  <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 30px ${isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 16, pointerEvents: 'none', zIndex: 1 }} />
                  <Sparkles rarity={previewInfo.rarity} count={6} />
                  <div className={previewStage >= 4 ? rarityPlantClass(previewInfo.rarity) : ''} style={{ position: 'relative', marginBottom: 16, zIndex: 2 }}>
                    {previewStage === 0
                      ? <PlantIcon type={selectedPlant!} size={130} isSeed />
                      : <PlantIcon type={selectedPlant!} size={130} stage={previewStage - 1} />
                    }
                  </div>
                </div>
                {/* Stage slider */}
                <div style={{ width: 220 }}>
                  <input
                    type="range"
                    min={0}
                    max={STAGE_NAMES.length - 1}
                    value={previewStage}
                    onChange={e => setPreviewStage(Number(e.target.value))}
                    className="boutique-slider"
                    style={{
                      width: '100%', height: 3, appearance: 'none', WebkitAppearance: 'none',
                      background: `linear-gradient(90deg, ${isDark ? '#52525b' : '#a1a1aa'} 0%, ${isDark ? '#52525b' : '#a1a1aa'} ${(previewStage / (STAGE_NAMES.length - 1)) * 100}%, ${isDark ? 'rgba(39,39,42,0.6)' : 'rgba(228,228,231,0.8)'} ${(previewStage / (STAGE_NAMES.length - 1)) * 100}%, ${isDark ? 'rgba(39,39,42,0.6)' : 'rgba(228,228,231,0.8)'} 100%)`,
                      borderRadius: 4, outline: 'none', cursor: 'pointer',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    {STAGE_NAMES.map((name, si) => (
                      <button
                        key={si}
                        onClick={() => setPreviewStage(si)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
                          fontSize: 8, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                          color: previewStage === si ? textPrimary : textMuted,
                          fontFamily: font, transition: 'color 0.15s',
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — info + buy */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                {/* Rarity badge */}
                <span style={{
                  fontSize: 9, fontWeight: 700, color: rarityCol, letterSpacing: '0.08em',
                  textTransform: 'uppercase', fontFamily: font, marginBottom: 6,
                }}>
                  {RARITY_LABEL[previewInfo.rarity]}
                </span>

                {/* Name */}
                <div style={{ fontSize: 24, fontWeight: 600, color: textPrimary, fontFamily: font, letterSpacing: '-0.01em', marginBottom: 4 }}>
                  {previewInfo.name}
                </div>

                {/* Category */}
                {cat !== 'none' && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: CATEGORY_COLOR[cat], fontFamily: font, marginBottom: 12 }}>
                    {CATEGORY_LABEL[cat]}
                  </span>
                )}

                {/* Description */}
                <p style={{ fontSize: 13, color: textSecondary, fontFamily: font, lineHeight: 1.6, marginBottom: 20, maxWidth: 360 }}>
                  {desc}
                </p>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font, marginBottom: 2 }}>Sap Yield</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary, fontFamily: font, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PulpIcon size={12} />
                      {previewInfo.sapYield || 2}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font, marginBottom: 2 }}>Drop Rate</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary, fontFamily: font }}>{getDropChance(previewInfo.weight)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font, marginBottom: 2 }}>Shape</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary, fontFamily: font, textTransform: 'capitalize' }}>{previewInfo.shape}</div>
                  </div>
                </div>

                {/* Price + Buy */}
                {stock <= 0 ? (
                  <div style={{
                    fontSize: 13, fontWeight: 700, fontFamily: font,
                    color: isDark ? '#71717a' : '#a1a1aa',
                    padding: '10px 0',
                  }}>
                    Sold Out
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={() => buySeed(selectedPlant!)}
                      disabled={cantAfford}
                      className="transition-all hover:brightness-110"
                      style={{
                        fontFamily: font, cursor: cantAfford ? 'default' : 'pointer', border: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#d97706', color: '#fff',
                        opacity: cantAfford ? 0.35 : 1,
                        padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      }}
                    >
                      Buy Seed
                      <span style={{ opacity: 0.5 }}>·</span>
                      <PulpIcon size={11} />
                      {disc > 0 ? (
                        <>
                          <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: 11 }}>{previewInfo.cost}</span>
                          {discPrice.toLocaleString()}
                        </>
                      ) : previewInfo.cost.toLocaleString()}
                    </button>
                    <span style={{ fontSize: 10, fontWeight: 600, color: textMuted, fontFamily: font }}>
                      ×{stock} left
                    </span>
                  </div>
                )}
              </div>
            </div>
          )})()}

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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {inventory.map((type, idx) => {
                    const t = TREE_TYPES[type]
                    if (!t) return null
                    const rc = RARITY_COLOR[t.rarity]
                    return (
                      <div
                        key={`${type}-${idx}`}
                        className="relative group"
                      >
                        <button
                          onClick={() => { prevTabRef.current = activeTab; setSelectedPlant(type); setPreviewStage(0); setActiveTab('shop') }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            transition: 'all 0.15s', fontFamily: font, textAlign: 'left',
                            boxShadow: `inset 0 0 0 1px ${rc}10`,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = `${rc}40` }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: `${rc}15`,
                          }}>
                            <PlantIcon type={type} size={22} isSeed />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: rc, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>{RARITY_LABEL[t.rarity]}</div>
                          </div>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); discardSeed(idx) }}
                          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer ${
                            isDark ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600' : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'
                          }`}
                          style={{ zIndex: 2 }}
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
                  <div key={rarity} style={{ marginBottom: 44 }}>
                    {(() => {
                      const owned = plants.filter(t => inventory.includes(t)).length
                      const total = plants.length
                      const pct = Math.round((owned / total) * 100)
                      const rc = RARITY_COLOR[rarity]
                      const complete = owned === total
                      return (
                    <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${complete ? `${rc}30` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: rc, boxShadow: complete ? `0 0 8px ${rc}60` : 'none' }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{RARITY_LABEL[rarity]}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: complete ? rc : textMuted, fontFamily: font }}>{owned}<span style={{ opacity: 0.5 }}>/{total}</span>{complete && <span style={{ marginLeft: 6, fontSize: 9, letterSpacing: '0.06em' }}>COMPLETE</span>}</span>
                      </div>
                      <div style={{ height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: complete ? rc : `linear-gradient(90deg, ${rc}90, ${rc}50)`, borderRadius: 3, transition: 'width 0.4s ease', boxShadow: pct > 0 ? `0 0 8px ${rc}30` : 'none' }} />
                      </div>
                    </div>
                      )
                    })()}
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
                              background: RARITY_BG[t.rarity] || RARITY_BG.common,
                            }}>
                              <RarityScene rarity={t.rarity} isDark={isDark} />
                              <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 12px ${isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)'}`, pointerEvents: 'none', zIndex: 4 }} />
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
                              <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 7, fontWeight: 700, color: RARITY_COLOR[t.rarity], letterSpacing: '0.04em', background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', padding: '1px 4px', borderRadius: 3, backdropFilter: 'blur(4px)', zIndex: 2 }}>
                                {getDropChance(t.weight)}
                              </div>
                              {type === 'tangerine' ? (
                                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 700, color: '#d97706', letterSpacing: '0.06em', background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)', zIndex: 2, textTransform: 'uppercase' }}>
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
