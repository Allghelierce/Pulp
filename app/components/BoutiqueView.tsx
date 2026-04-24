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

const RARITY_LABEL: Record<string, string> = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare',
  'true rare': 'True Rare', premium: 'Premium', chroma: 'Chroma', extinct: 'Extinct',
}

const RARITY_COLOR: Record<string, string> = {
  common: '#a1a1aa', uncommon: '#34d399', rare: '#60a5fa',
  'true rare': '#a78bfa', premium: '#fbbf24', chroma: '#f472b6', extinct: '#f87171',
}

type TabId = 'shop' | 'gems' | 'bag' | 'catalog'

const font = '"EB Garamond", Georgia, serif'

export const BoutiqueView = memo(function BoutiqueView({
  isOpen, onClose, theme, accent,
  sunshine, gems, inventory, setSunshine, setGems, setInventory, setGrove,
  unlockedCosmetics, setUnlockedCosmetics, onUpdateConfig
}: BoutiqueViewProps) {

  const [activeTab, setActiveTab] = useState<TabId>('shop')
  const [dailySeeds, setDailySeeds] = useState<string[]>([])
  const [shopStock, setShopStock] = useState<Record<string, number>>({})
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null)
  const [previewStage, setPreviewStage] = useState(3)
  const isDark = theme === 'dark'

  const bg = isDark ? '#141416' : '#f7f5f2'
  const cardBg = isDark ? '#1c1c20' : '#ffffff'
  const cardBorder = isDark ? '#2a2a2e' : '#e8e5e0'
  const textPrimary = isDark ? '#e4e4e7' : '#2c2417'
  const textSecondary = isDark ? '#71717a' : '#8c8278'
  const textMuted = isDark ? '#52525b' : '#b5ada5'
  const dividerColor = isDark ? '#27272a' : '#e8e5e0'

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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: font, fontSize: 13, fontWeight: 600, color: type === 'gems' ? '#a78bfa' : '#d97706' }}>
      <span style={{ fontSize: 11 }}>{type === 'gems' ? '💎' : '☀️'}</span>
      {amount}
    </span>
  )

  const tabs: { id: TabId; label: string }[] = [
    { id: 'shop', label: 'Shop' },
    { id: 'gems', label: 'Gems' },
    { id: 'bag', label: 'My Seeds' },
    { id: 'catalog', label: 'Catalog' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} onMouseDown={onClose}>
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 880, height: '82vh', maxHeight: 740,
          backgroundColor: bg, borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
          border: `1px solid ${cardBorder}`,
          fontFamily: font,
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${dividerColor}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedPlant(null) }}
                style={{
                  padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  fontFamily: font, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  backgroundColor: activeTab === tab.id ? (isDark ? '#27272a' : '#2c2417') : 'transparent',
                  color: activeTab === tab.id ? (isDark ? '#e4e4e7' : '#fff') : textSecondary,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <CurrencyPill type="sunshine" amount={sunshine} />
            <CurrencyPill type="gems" amount={gems} />
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* ── Plant Preview (when selected) ── */}
        {selectedPlant && previewInfo && (
          <div style={{ flexShrink: 0, borderBottom: `1px solid ${dividerColor}` }}>
            {/* Preview area */}
            <div style={{
              height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark
                ? 'linear-gradient(180deg, #1a1a1e 0%, #141416 100%)'
                : 'linear-gradient(180deg, #f0ede8 0%, #e8e4dd 100%)',
              position: 'relative',
            }}>
              <button
                onClick={() => setSelectedPlant(null)}
                style={{
                  position: 'absolute', top: 16, left: 20,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: textSecondary, fontFamily: font, fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Back
              </button>

              {/* Name + rarity badge */}
              <div style={{ position: 'absolute', top: 16, right: 20, textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary, fontFamily: font }}>{previewInfo.name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: RARITY_COLOR[previewInfo.rarity], marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {RARITY_LABEL[previewInfo.rarity]}
                </div>
              </div>

              {/* Growth stages */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, paddingBottom: 8 }}>
                {STAGE_NAMES.map((name, i) => {
                  const active = previewStage === i
                  return (
                    <button
                      key={i}
                      onClick={() => setPreviewStage(i)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        background: 'none', border: 'none', cursor: 'pointer',
                        opacity: active ? 1 : 0.4,
                        transform: active ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{
                        padding: 8, borderRadius: 12,
                        backgroundColor: active ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') : 'transparent',
                      }}>
                        {i === 0 ? (
                          <PlantIcon type={selectedPlant} size={active ? 60 : 44} isSeed />
                        ) : (
                          <PlantIcon type={selectedPlant} size={active ? 60 : 44} stage={i - 1} />
                        )}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: active ? textPrimary : textMuted, fontFamily: font,
                      }}>{name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Purchase bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 24px',
              backgroundColor: isDark ? '#18181b' : '#faf8f5',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CurrencyPill type={previewInfo.currency} amount={previewInfo.cost} />
                {shopStock[selectedPlant!] !== undefined && (
                  <span style={{ fontSize: 11, color: textMuted, fontFamily: font }}>
                    {(shopStock[selectedPlant!] || 0) > 0 ? `${shopStock[selectedPlant!]} in stock` : 'Sold out'}
                  </span>
                )}
              </div>
              <button
                onClick={() => buySeed(selectedPlant!)}
                disabled={(shopStock[selectedPlant!] || 0) <= 0 || (previewInfo.currency === 'sunshine' ? sunshine < previewInfo.cost : gems < previewInfo.cost)}
                style={{
                  padding: '8px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  fontFamily: font, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  backgroundColor: isDark ? '#e4e4e7' : '#2c2417',
                  color: isDark ? '#141416' : '#fff',
                  opacity: ((shopStock[selectedPlant!] || 0) <= 0 || (previewInfo.currency === 'sunshine' ? sunshine < previewInfo.cost : gems < previewInfo.cost)) ? 0.3 : 1,
                }}
              >
                Buy Seed
              </button>
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font }}>Featured Today</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#34d399', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font }}>Refreshes daily</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
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
                      <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font }}>{RARITY_LABEL[rarity]}</span>
                      <div style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {plants.map(type => <PlantCard key={type} type={type} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} textPrimary={textPrimary} textMuted={textMuted} shopStock={shopStock} onClick={() => { setSelectedPlant(type); setPreviewStage(3) }} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'shop' && selectedPlant && (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: textMuted, fontSize: 13, fontFamily: font }}>
              Browse through the growth stages above.
            </div>
          )}

          {/* ── GEMS ── */}
          {activeTab === 'gems' && (
            <div style={{ padding: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font, display: 'block', marginBottom: 14 }}>Exchange Sunshine for Gems</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 32 }}>
                {[
                  { amount: 10, cost: 25, label: 'Small Pouch' },
                  { amount: 30, cost: 60, label: 'Gem Satchel' },
                  { amount: 75, cost: 120, label: 'Treasure Chest', best: true },
                  { amount: 200, cost: 250, label: 'Royal Vault' },
                ].map(pack => (
                  <button
                    key={pack.label}
                    onClick={() => { if (sunshine >= pack.cost) { setSunshine((s: number) => s - pack.cost); setGems((g: number) => g + pack.amount) } }}
                    disabled={sunshine < pack.cost}
                    style={{
                      padding: 16, borderRadius: 10, border: `1px solid ${cardBorder}`,
                      backgroundColor: cardBg, cursor: sunshine >= pack.cost ? 'pointer' : 'not-allowed',
                      opacity: sunshine < pack.cost ? 0.35 : 1,
                      textAlign: 'left', fontFamily: font, position: 'relative',
                      transition: 'all 0.15s',
                    }}
                  >
                    {(pack as any).best && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font }}>Best value</span>}
                    <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary, marginBottom: 4 }}>{pack.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>💎 {pack.amount} gems</div>
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${dividerColor}`, fontSize: 12, fontWeight: 600, color: '#d97706' }}>☀️ {pack.cost} sunshine</div>
                  </button>
                ))}
              </div>

              {/* Cosmetics */}
              {(['accent', 'ink', 'paper'] as const).map(category => {
                const items = GEM_COSMETICS.filter(c => c.type === category)
                const label = category === 'accent' ? 'Accent Colors' : category === 'ink' ? 'Ink Styles' : 'Paper Textures'
                return (
                  <div key={category} style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font, display: 'block', marginBottom: 10 }}>{label}</span>
                    <div style={{ borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden', backgroundColor: cardBg }}>
                      {items.map((cosmetic, idx) => {
                        const owned = unlockedCosmetics.includes(cosmetic.id)
                        const cantAfford = gems < cosmetic.cost
                        return (
                          <div key={cosmetic.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderTop: idx > 0 ? `1px solid ${dividerColor}` : 'none',
                          }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#27272a' : '#f0ede8', flexShrink: 0 }}>
                              {cosmetic.type === 'accent' ? (
                                <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: cosmetic.value }} />
                              ) : (
                                <span style={{ fontSize: 12 }}>{cosmetic.type === 'ink' ? '🖋' : '📄'}</span>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: textPrimary, fontFamily: font }}>{cosmetic.name}</div>
                            </div>
                            {owned ? (
                              <button onClick={() => applyCosmetic(cosmetic)} style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>
                                {cosmetic.type === 'accent' ? 'Apply' : 'Owned ✓'}
                              </button>
                            ) : (
                              <button
                                onClick={() => buyCosmetic(cosmetic)}
                                disabled={cantAfford}
                                style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'none', border: 'none', cursor: cantAfford ? 'not-allowed' : 'pointer', opacity: cantAfford ? 0.35 : 1, fontFamily: font }}
                              >
                                💎 {cosmetic.cost}
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

          {/* ── BAG ── */}
          {activeTab === 'bag' && (
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font }}>Your Seeds</span>
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
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', cursor: 'pointer', backgroundColor: isDark ? '#1a1a1e' : '#f5f2ed' }}
                          onClick={() => { setSelectedPlant(type); setPreviewStage(0); setActiveTab('shop') }}
                        >
                          <PlantIcon type={type} size={44} isSeed />
                        </div>
                        <div style={{ padding: '8px 10px', borderTop: `1px solid ${dividerColor}` }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: textPrimary, fontFamily: font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                          <div style={{ fontSize: 9, fontWeight: 600, color: RARITY_COLOR[t.rarity], letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font, marginTop: 2 }}>{RARITY_LABEL[t.rarity]}</div>
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
                      <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font }}>{RARITY_LABEL[rarity]}</span>
                      <div style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {plants.map(type => {
                        const t = TREE_TYPES[type]
                        const owned = inventory.includes(type)
                        return (
                          <button
                            key={type}
                            onClick={() => { setSelectedPlant(type); setPreviewStage(3); setActiveTab('shop') }}
                            style={{
                              borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden',
                              backgroundColor: cardBg, cursor: 'pointer', textAlign: 'left',
                              transition: 'all 0.15s', position: 'relative', fontFamily: font,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 0', backgroundColor: isDark ? '#1a1a1e' : '#f5f2ed' }}>
                              <PlantIcon type={type} size={40} stage={3} />
                              {owned && (
                                <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', backgroundColor: isDark ? '#064e3b' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#34d399" : "#059669"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              )}
                            </div>
                            <div style={{ padding: '8px 10px', borderTop: `1px solid ${dividerColor}` }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: t.currency === 'gems' ? '#a78bfa' : '#d97706' }}>
                                  {t.currency === 'gems' ? '💎' : '☀️'} {t.cost}
                                </span>
                                <span style={{ fontSize: 9, color: textMuted }}>{t.weight ? `${(t.weight * 100).toFixed(1)}%` : ''}</span>
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
  const soldOut = (shopStock[type] || 0) <= 0
  const dividerColor = isDark ? '#27272a' : '#e8e5e0'

  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 10, border: `1px solid ${cardBorder}`, overflow: 'hidden',
        backgroundColor: cardBg, cursor: 'pointer', textAlign: 'left',
        opacity: soldOut ? 0.35 : 1, transition: 'all 0.15s',
        fontFamily: '"EB Garamond", Georgia, serif',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: featured ? '28px 0' : '20px 0',
        backgroundColor: isDark ? '#1a1a1e' : '#f5f2ed',
      }}>
        <PlantIcon type={type} size={featured ? 56 : 44} stage={3} />
      </div>
      <div style={{ padding: '8px 10px', borderTop: `1px solid ${dividerColor}` }}>
        <div style={{ fontSize: featured ? 12 : 11, fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: RARITY_COLOR[t.rarity], letterSpacing: '0.06em', textTransform: 'uppercase' }}>{RARITY_LABEL[t.rarity]}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: t.currency === 'gems' ? '#a78bfa' : '#d97706' }}>
            {t.currency === 'gems' ? '💎' : '☀️'} {t.cost}
          </span>
        </div>
        {soldOut && <div style={{ fontSize: 9, fontWeight: 600, color: textMuted, marginTop: 2 }}>Sold out</div>}
      </div>
    </button>
  )
}
