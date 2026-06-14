"use client"
import { memo, useState, useEffect, useRef, useCallback } from "react"
import { TREE_TYPES } from "@/app/constants"
import { getPalette, getType, chipButton } from "@/app/theme/palette"
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
  'true rare': '#c084fc',
  sacred: '#c4b5fd',
}

const SHOP_RARITY_COLOR: Record<string, string> = {
  common: '#a1a1aa',
  uncommon: '#34d399',
  rare: '#60a5fa',
  'true rare': '#c084fc',
  sacred: '#c4b5fd',
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

const font = 'Crimson Pro, serif'

function marketSeededRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 }
}

function getMarketHillY(x: number): number {
  if (x < 140) return 170 - (x + 20) * 50 / 160
  if (x < 280) return 120 - (x - 140) * 15 / 140
  return 105 + (x - 280) * 45 / 130
}

function MarketHillGrass({ isDark }: { isDark: boolean }) {
  const rng = marketSeededRng(557)
  const tufts: string[] = []
  const bushPaths: string[] = []
  const bladesPaths: string[] = []
  for (let i = 0; i < 40; i++) {
    const x = 5 + (i / 40) * 400 + (rng() - 0.5) * 12
    const ridgeY = getMarketHillY(x)
    const baseY = ridgeY + 0.5 + rng() * 8
    const h = 1.0 + rng() * 2.0
    tufts.push(`M${x.toFixed(1)},${baseY.toFixed(1)}l${(-0.6).toFixed(2)},${(-h).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.5).toFixed(1)},${(-h * 0.85).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.8).toFixed(2)},${(-h * 0.65).toFixed(1)}`)
  }
  for (let i = 0; i < 25; i++) {
    const x = 5 + (i / 25) * 400 + (rng() - 0.5) * 15
    const ridgeY = getMarketHillY(x)
    const by = ridgeY + 1 + rng() * 8
    const bw = 1.0 + rng() * 2.0
    const bh = 0.5 + rng() * 1.2
    bushPaths.push(`M${(x - bw).toFixed(1)},${by.toFixed(1)}Q${(x - bw * 0.3).toFixed(1)},${(by - bh * 1.5).toFixed(1)} ${x.toFixed(1)},${(by - bh).toFixed(1)}Q${(x + bw * 0.4).toFixed(1)},${(by - bh * 1.4).toFixed(1)} ${(x + bw).toFixed(1)},${by.toFixed(1)}Z`)
  }
  for (let i = 0; i < 35; i++) {
    const x = 5 + (i / 35) * 400 + (rng() - 0.5) * 12
    const ridgeY = getMarketHillY(x)
    const by = ridgeY + 1 + rng() * 9
    const bh = 1.0 + rng() * 2.0
    const curve = (rng() - 0.5) * 1.5
    bladesPaths.push(`M${x.toFixed(1)},${by.toFixed(1)}C${(x + curve * 0.2).toFixed(1)},${(by - bh * 0.3).toFixed(1)} ${(x + curve * 0.7).toFixed(1)},${(by - bh * 0.6).toFixed(1)} ${(x + curve * 0.5).toFixed(1)},${(by - bh).toFixed(1)}`)
  }
  return <>
    <path d={bushPaths.join('')} fill={isDark ? '#182c12' : '#3a6a2e'} opacity={isDark ? 0.25 : 0.15} />
    <path d={tufts.join('')} stroke={isDark ? '#223e1e' : '#527e42'} strokeWidth="0.5" fill="none" opacity="0.45" />
    <path d={bladesPaths.join('')} stroke={isDark ? '#1e3818' : '#3e6e34'} strokeWidth="0.35" fill="none" opacity="0.35" />
  </>
}

function MarketHillPaths({ isDark }: { isDark: boolean }) {
  const dirtBase = isDark ? '#2a2014' : '#8a7050'
  const dirtDark = isDark ? '#1a1408' : '#6a5030'
  const dirtLight = isDark ? '#342a1a' : '#a08a60'
  const edgeGrass = isDark ? '#1a2c14' : '#4a7a3a'
  const rng = marketSeededRng(5599)
  const pts: [number,number][] = []
  for (let x = -5; x <= 410; x += 25) pts.push([x, getMarketHillY(x) + 2])
  const mainD = "M" + pts.map(p => `${p[0].toFixed(0)},${p[1].toFixed(0)}`).join(" L")
  const pebbles: string[] = []
  const grassEdgeD: string[] = []
  const ruts: string[] = []
  const wornPatches: string[] = []
  for (let i = 0; i < 30; i++) {
    const t = rng()
    const idx = Math.floor(t * (pts.length - 1))
    const frac = t * (pts.length - 1) - idx
    const nxt = Math.min(idx + 1, pts.length - 1)
    const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
    const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
    const ox = (rng() - 0.5) * 2
    const oy = (rng() - 0.5) * 1.5
    const pr = 0.1 + rng() * 0.2
    pebbles.push(`M${(px+ox+pr).toFixed(2)},${(py+oy).toFixed(2)}a${pr.toFixed(2)},${(pr*0.7).toFixed(2)} 0 1 1 -${(pr*2).toFixed(2)},0a${pr.toFixed(2)},${(pr*0.7).toFixed(2)} 0 1 1 ${(pr*2).toFixed(2)},0Z`)
  }
  for (let i = 0; i < 18; i++) {
    const t = rng()
    const idx = Math.floor(t * (pts.length - 1))
    const frac = t * (pts.length - 1) - idx
    const nxt = Math.min(idx + 1, pts.length - 1)
    const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
    const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
    const side = rng() > 0.5 ? 1 : -1
    const gx = px + side * (0.8 + rng() * 1)
    const gy = py + side * (0.2 + rng() * 0.5)
    const gh = 0.5 + rng() * 1
    const gsway = (rng() - 0.5) * 0.6
    grassEdgeD.push(`M${gx.toFixed(1)},${gy.toFixed(1)}q${gsway.toFixed(2)},${(-gh*0.5).toFixed(2)} ${(gsway*0.3).toFixed(2)},${(-gh).toFixed(2)}`)
  }
  for (let i = 0; i < 15; i++) {
    const t = 0.05 + rng() * 0.9
    const idx = Math.floor(t * (pts.length - 1))
    const frac = t * (pts.length - 1) - idx
    const nxt = Math.min(idx + 1, pts.length - 1)
    const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
    const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
    const dx = (pts[nxt][0] - pts[idx][0]) * 0.08
    const dy = (pts[nxt][1] - pts[idx][1]) * 0.08
    ruts.push(`M${(px-dx).toFixed(1)},${(py-dy+0.2).toFixed(1)}L${(px+dx).toFixed(1)},${(py+dy+0.2).toFixed(1)}`)
  }
  for (let i = 0; i < 12; i++) {
    const t = rng()
    const idx = Math.floor(t * (pts.length - 1))
    const frac = t * (pts.length - 1) - idx
    const nxt = Math.min(idx + 1, pts.length - 1)
    const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
    const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
    const wr = 0.5 + rng() * 1
    wornPatches.push(`M${(px-wr).toFixed(1)},${py.toFixed(1)}a${wr.toFixed(2)},${(wr*0.35).toFixed(2)} 0 1 1 ${(wr*2).toFixed(2)},0a${wr.toFixed(2)},${(wr*0.35).toFixed(2)} 0 1 1 -${(wr*2).toFixed(2)},0Z`)
  }
  const branchPts: [number,number][] = []
  for (let x = 100; x <= 280; x += 20) branchPts.push([x, getMarketHillY(x) + 8 + Math.sin(x * 0.03) * 3])
  const branchD = "M" + branchPts.map(p => `${p[0].toFixed(0)},${p[1].toFixed(0)}`).join(" L")
  const spurD = `M60,${(getMarketHillY(60) + 5).toFixed(0)} Q75,${(getMarketHillY(75) + 7).toFixed(0)} 90,${(getMarketHillY(90) + 6).toFixed(0)}`
  return <g>
    <path d={mainD} fill="none" stroke={dirtDark} strokeWidth="1.2" strokeLinecap="round" opacity={isDark ? 0.12 : 0.08} />
    <path d={mainD} fill="none" stroke={dirtBase} strokeWidth="0.7" strokeLinecap="round" opacity={isDark ? 0.2 : 0.14} />
    <path d={branchD} fill="none" stroke={dirtDark} strokeWidth="0.8" strokeLinecap="round" opacity={isDark ? 0.1 : 0.06} />
    <path d={branchD} fill="none" stroke={dirtBase} strokeWidth="0.4" strokeLinecap="round" opacity={isDark ? 0.18 : 0.12} />
    <path d={spurD} fill="none" stroke={dirtBase} strokeWidth="0.35" opacity={isDark ? 0.15 : 0.1} strokeLinecap="round" />
    <path d={wornPatches.join('')} fill={dirtLight} opacity={isDark ? 0.06 : 0.04} />
    <path d={ruts.join('')} stroke={dirtDark} strokeWidth="0.15" fill="none" opacity={isDark ? 0.12 : 0.08} strokeLinecap="round" />
    <path d={pebbles.join('')} fill={dirtDark} opacity={isDark ? 0.15 : 0.1} />
    <path d={grassEdgeD.join('')} stroke={edgeGrass} strokeWidth="0.2" fill="none" opacity={isDark ? 0.18 : 0.1} />
  </g>
}

function MarketTangerineTrees({ isDark }: { isDark: boolean }) {
  const rng = marketSeededRng(331)
  const trunkC = isDark ? '#1a1208' : '#3a2e1a'
  const canopyC = isDark ? '#142a12' : '#2e5a26'
  const canopyS = isDark ? '#0c1e0a' : '#1e4a1a'
  const fruitC = isDark ? '#7a4e08' : '#a06010'
  const count = 35
  const trunks: string[] = []
  const mainBranches: string[] = []
  const canopies: string[] = []
  const shadeP: string[] = []
  const leafTufts: string[] = []
  const fruits: string[] = []
  for (let i = 0; i < count; i++) {
    const bx = 5 + (i / count) * 395 + (rng() - 0.5) * 18
    if (bx > 245 && bx < 275) { rng(); rng(); rng(); continue }
    const by = getMarketHillY(bx) + 1 + rng() * 10
    const sc = 0.25 + rng() * 0.35
    const tx = bx + (rng() - 0.5) * 4, ty = by
    const s = sc
    const trunkCurve = (rng() - 0.5) * 4 * s
    const trunkH = (14 + rng() * 6) * s
    const topY = ty - trunkH
    trunks.push(`M${tx.toFixed(1)},${ty.toFixed(1)}C${(tx + trunkCurve).toFixed(1)},${(ty - trunkH * 0.4).toFixed(1)} ${(tx - trunkCurve * 0.5).toFixed(1)},${(ty - trunkH * 0.7).toFixed(1)} ${tx.toFixed(1)},${topY.toFixed(1)}`)
    const brL = 8 + rng() * 6, brR = 8 + rng() * 6
    const brDroopL = rng() * 3, brDroopR = rng() * 3
    mainBranches.push(`M${tx.toFixed(1)},${(topY + 2 * s).toFixed(1)}C${(tx - brL * 0.4 * s).toFixed(1)},${(topY - 2 * s).toFixed(1)} ${(tx - brL * 0.8 * s).toFixed(1)},${(topY - 2 * s).toFixed(1)} ${(tx - brL * s).toFixed(1)},${(topY + brDroopL * s).toFixed(1)}`)
    mainBranches.push(`M${tx.toFixed(1)},${(topY + 2 * s).toFixed(1)}C${(tx + brR * 0.4 * s).toFixed(1)},${(topY - 2 * s).toFixed(1)} ${(tx + brR * 0.8 * s).toFixed(1)},${(topY - 2 * s).toFixed(1)} ${(tx + brR * s).toFixed(1)},${(topY + brDroopR * s).toFixed(1)}`)
    const rxBase = 14 + rng() * 8, ryBase = 10 + rng() * 8
    const cx = tx + (rng() - 0.5) * 3 * s, cy = topY - ryBase * 0.5 * s
    const rx = rxBase * s, ry = ryBase * s
    const w1 = (rng() - 0.5) * rx * 0.3
    const w2 = (rng() - 0.5) * ry * 0.3
    const w3 = (rng() - 0.5) * rx * 0.25
    canopies.push(`M${(cx - rx).toFixed(1)},${(cy + ry * 0.4 + w2).toFixed(1)}C${(cx - rx + w1).toFixed(1)},${(cy - ry * 0.5).toFixed(1)} ${(cx - rx * 0.3 + w3).toFixed(1)},${(cy - ry).toFixed(1)} ${cx.toFixed(1)},${(cy - ry + w2 * 0.3).toFixed(1)}C${(cx + rx * 0.35 - w3).toFixed(1)},${(cy - ry).toFixed(1)} ${(cx + rx - w1).toFixed(1)},${(cy - ry * 0.5).toFixed(1)} ${(cx + rx).toFixed(1)},${(cy + ry * 0.4 - w2).toFixed(1)}C${(cx + rx * 0.5).toFixed(1)},${(cy + ry * 0.9).toFixed(1)} ${cx.toFixed(1)},${(cy + ry * 0.7).toFixed(1)} ${cx.toFixed(1)},${(cy + ry * 0.7).toFixed(1)}C${cx.toFixed(1)},${(cy + ry * 0.7).toFixed(1)} ${(cx - rx * 0.5).toFixed(1)},${(cy + ry * 0.9).toFixed(1)} ${(cx - rx).toFixed(1)},${(cy + ry * 0.4 + w2).toFixed(1)}Z`)
    shadeP.push(`M${(cx - rx * 0.7).toFixed(1)},${(cy + ry * 0.15).toFixed(1)}Q${cx.toFixed(1)},${(cy + ry * 0.8).toFixed(1)} ${(cx + rx * 0.7).toFixed(1)},${(cy + ry * 0.15).toFixed(1)}`)
    const tuftCount = 3 + Math.floor(rng() * 4)
    for (let t = 0; t < tuftCount; t++) {
      const ang = rng() * Math.PI * 2
      const dist = 0.8 + rng() * 0.2
      const lx = cx + Math.cos(ang) * rx * dist, ly = cy + Math.sin(ang) * ry * dist
      const ls = (1.5 + rng() * 1.5) * s
      const tiltX = (rng() - 0.5) * ls
      leafTufts.push(`M${(lx - ls).toFixed(1)},${ly.toFixed(1)}Q${(lx + tiltX).toFixed(1)},${(ly - ls * (0.8 + rng() * 0.6)).toFixed(1)} ${(lx + ls).toFixed(1)},${ly.toFixed(1)}Z`)
    }
    const fruitCount = 3 + Math.floor(rng() * 5)
    for (let f = 0; f < fruitCount; f++) {
      const fAng = rng() * Math.PI * 2
      const fDist = 0.2 + rng() * 0.55
      const fpx = cx + Math.cos(fAng) * rx * fDist, fpy = cy + Math.sin(fAng) * ry * fDist
      const fr = (0.6 + rng() * 0.6) * s
      fruits.push(`M${(fpx + fr).toFixed(2)},${fpy.toFixed(2)}a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 -${(fr * 2).toFixed(2)},0a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 ${(fr * 2).toFixed(2)},0Z`)
    }
  }
  return (
    <g>
      <path d={trunks.join('')} stroke={trunkC} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d={mainBranches.join('')} stroke={trunkC} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d={canopies.join('')} fill={canopyC} />
      <path d={shadeP.join('')} stroke={canopyS} strokeWidth="1.2" fill="none" />
      <path d={leafTufts.join('')} fill={canopyC} />
      <path d={fruits.join('')} fill={fruitC} />
    </g>
  )
}

function MarketGroundGrass({ isDark, groundY }: { isDark: boolean; groundY: number }) {
  const rng = marketSeededRng(2557)
  const spread = 300 - groundY + 5
  const tufts: string[] = []
  const bushPaths: string[] = []
  const bladesPaths: string[] = []
  const flowerStems: string[] = []
  const flowerPetals: string[] = []
  const flowerCenters: string[] = []
  for (let i = 0; i < 50; i++) {
    const x = 5 + (i / 50) * 400 + (rng() - 0.5) * 10
    const baseY = groundY - 2 + rng() * spread
    const h = 1.8 + rng() * 3.0
    tufts.push(`M${x.toFixed(1)},${baseY.toFixed(1)}l${(-0.8).toFixed(2)},${(-h).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.7).toFixed(1)},${(-h * 0.85).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(1.1).toFixed(2)},${(-h * 0.65).toFixed(1)}`)
  }
  for (let i = 0; i < 30; i++) {
    const x = 5 + (i / 30) * 400 + (rng() - 0.5) * 12
    const by = groundY - 2 + rng() * spread
    const bw = 1.8 + rng() * 3.0
    const bh = 0.8 + rng() * 1.6
    bushPaths.push(`M${(x - bw).toFixed(1)},${by.toFixed(1)}Q${(x - bw * 0.3).toFixed(1)},${(by - bh * 1.5).toFixed(1)} ${x.toFixed(1)},${(by - bh).toFixed(1)}Q${(x + bw * 0.4).toFixed(1)},${(by - bh * 1.4).toFixed(1)} ${(x + bw).toFixed(1)},${by.toFixed(1)}Z`)
  }
  for (let i = 0; i < 40; i++) {
    const x = 5 + (i / 40) * 400 + (rng() - 0.5) * 10
    const by = groundY - 2 + rng() * spread
    const bh = 1.8 + rng() * 3.0
    const curve = (rng() - 0.5) * 1.5
    bladesPaths.push(`M${x.toFixed(1)},${by.toFixed(1)}C${(x + curve * 0.2).toFixed(1)},${(by - bh * 0.3).toFixed(1)} ${(x + curve * 0.7).toFixed(1)},${(by - bh * 0.6).toFixed(1)} ${(x + curve * 0.5).toFixed(1)},${(by - bh).toFixed(1)}`)
  }
  const petalC = isDark ? '#8a5510' : '#d97706'
  const centerC = isDark ? '#b07820' : '#f0a828'
  for (let i = 0; i < 8; i++) {
    const fx = 5 + (i / 8) * 400 + (rng() - 0.5) * 20
    const fy = groundY - 1 + rng() * spread
    const sh = 3.0 + rng() * 3.5
    const tx = fx + (rng() - 0.5) * 0.5
    const ty = fy - sh
    const pr = 1.5 + rng() * 1.0
    flowerStems.push(`M${fx.toFixed(1)},${fy.toFixed(1)}L${tx.toFixed(1)},${ty.toFixed(1)}`)
    const petals = 4 + Math.floor(rng() * 3)
    for (let p = 0; p < petals; p++) {
      const ang = (p / petals) * Math.PI * 2 + rng() * 0.3
      const px = tx + Math.cos(ang) * pr
      const py = ty + Math.sin(ang) * pr * 0.7
      const prx = pr * 0.5, pry = pr * 0.35
      flowerPetals.push(`M${(px + prx).toFixed(2)},${py.toFixed(2)}a${prx.toFixed(2)},${pry.toFixed(2)} 0 1 1 -${(prx * 2).toFixed(2)},0a${prx.toFixed(2)},${pry.toFixed(2)} 0 1 1 ${(prx * 2).toFixed(2)},0Z`)
    }
    flowerCenters.push(`M${(tx + pr * 0.25).toFixed(2)},${ty.toFixed(2)}a${(pr * 0.25).toFixed(2)},${(pr * 0.25).toFixed(2)} 0 1 1 -${(pr * 0.5).toFixed(2)},0a${(pr * 0.25).toFixed(2)},${(pr * 0.25).toFixed(2)} 0 1 1 ${(pr * 0.5).toFixed(2)},0Z`)
  }
  return <>
    <path d={bushPaths.join('')} fill={isDark ? '#182c12' : '#3a6a2e'} opacity={isDark ? 0.25 : 0.15} />
    <path d={tufts.join('')} stroke={isDark ? '#223e1e' : '#527e42'} strokeWidth="0.6" fill="none" opacity="0.45" />
    <path d={bladesPaths.join('')} stroke={isDark ? '#1e3818' : '#3e6e34'} strokeWidth="0.4" fill="none" opacity="0.35" />
    <path d={flowerStems.join('')} stroke={isDark ? '#1a3a10' : '#5a8a40'} strokeWidth="0.2" fill="none" opacity="0.4" />
    <path d={flowerPetals.join('')} fill={petalC} opacity={isDark ? 0.45 : 0.35} />
    <path d={flowerCenters.join('')} fill={centerC} opacity={isDark ? 0.5 : 0.4} />
  </>
}

function getGroundPath(type: string): { fill: string; edge: string } {
  const shape = TREE_TYPES[type]?.shape || ''
  if (['palm', 'papaya', 'pineapple', 'agave'].includes(shape)) {
    return { fill: 'M0 22 Q30 14 60 18 Q90 12 120 16 Q150 13 180 20 L180 60 L0 60 Z', edge: 'M0 22 Q30 14 60 18 Q90 12 120 16 Q150 13 180 20' }
  }
  if (['cactus', 'sage', 'baobab'].includes(shape)) {
    return { fill: 'M0 20 L30 16 Q60 12 90 15 L120 13 Q150 16 180 18 L180 60 L0 60 Z', edge: 'M0 20 L30 16 Q60 12 90 15 L120 13 Q150 16 180 18' }
  }
  if (shape === 'winterveil') {
    return { fill: 'M0 16 Q20 10 50 14 Q80 6 110 12 Q140 8 160 14 Q170 12 180 16 L180 60 L0 60 Z', edge: 'M0 16 Q20 10 50 14 Q80 6 110 12 Q140 8 160 14 Q170 12 180 16' }
  }
  if (['coral', 'whirlpool', 'lotus', 'leviathan'].includes(shape)) {
    return { fill: 'M0 24 Q40 20 90 22 Q140 19 180 24 L180 60 L0 60 Z', edge: 'M0 24 Q40 20 90 22 Q140 19 180 24' }
  }
  if (['mushroom', 'mangrove', 'cattail', 'ivy'].includes(shape)) {
    return { fill: 'M0 20 Q15 14 35 17 Q55 10 80 15 Q105 9 130 14 Q155 11 180 18 L180 60 L0 60 Z', edge: 'M0 20 Q15 14 35 17 Q55 10 80 15 Q105 9 130 14 Q155 11 180 18' }
  }
  if (['void', 'starweaver', 'prismatic'].includes(shape)) {
    return { fill: 'M0 22 Q45 16 90 20 Q135 14 180 22 L180 60 L0 60 Z', edge: 'M0 22 Q45 16 90 20 Q135 14 180 22' }
  }
  return { fill: 'M0 18 Q20 10 45 13 Q70 8 90 11 Q120 7 145 12 Q165 10 180 14 L180 60 L0 60 Z', edge: 'M0 18 Q20 10 45 13 Q70 8 90 11 Q120 7 145 12 Q165 10 180 14' }
}

function getTerrainColors(type: string, isDark: boolean): { top: string; mid: string; bottom: string; edge: string; blendBase: string } {
  const shape = TREE_TYPES[type]?.shape || ''
  if (['palm', 'papaya', 'pineapple', 'agave'].includes(shape)) {
    return isDark
      ? { top: '#4a3a20', mid: '#3a2c18', bottom: '#2a1e10', edge: '#5a4a30', blendBase: '#3a2c18' }
      : { top: '#e0c890', mid: '#d0b870', bottom: '#b89850', edge: '#c8a858', blendBase: '#d0b870' }
  }
  if (['cactus', 'sage', 'baobab'].includes(shape)) {
    return isDark
      ? { top: '#3a3020', mid: '#302818', bottom: '#241e10', edge: '#4a3828', blendBase: '#302818' }
      : { top: '#d8c4a0', mid: '#c8b088', bottom: '#a89068', edge: '#b8a078', blendBase: '#c8b088' }
  }
  if (shape === 'winterveil') {
    return isDark
      ? { top: '#3a4050', mid: '#2a3040', bottom: '#1e2430', edge: '#4a5060', blendBase: '#2a3040' }
      : { top: '#dce4f0', mid: '#c8d4e4', bottom: '#a8b8cc', edge: '#b8c8dc', blendBase: '#c8d4e4' }
  }
  if (['coral', 'whirlpool', 'lotus', 'leviathan'].includes(shape)) {
    return isDark
      ? { top: '#1e2a30', mid: '#162228', bottom: '#0e181e', edge: '#2a3a42', blendBase: '#162228' }
      : { top: '#b8d0d8', mid: '#a0c0cc', bottom: '#80a8b8', edge: '#90b4c0', blendBase: '#a0c0cc' }
  }
  if (['mushroom', 'mangrove', 'cattail', 'ivy'].includes(shape)) {
    return isDark
      ? { top: '#282418', mid: '#201c12', bottom: '#18140c', edge: '#342e20', blendBase: '#201c12' }
      : { top: '#a89878', mid: '#988868', bottom: '#887858', edge: '#8a7a5a', blendBase: '#988868' }
  }
  if (['void', 'starweaver', 'prismatic'].includes(shape)) {
    return isDark
      ? { top: '#1a1420', mid: '#140e18', bottom: '#0e0a12', edge: '#2a1e30', blendBase: '#140e18' }
      : { top: '#9888a0', mid: '#887898', bottom: '#706080', edge: '#7a6a88', blendBase: '#887898' }
  }
  return isDark
    ? { top: '#3a3020', mid: '#2e2618', bottom: '#221c10', edge: '#4a3a28', blendBase: '#2e2618' }
    : { top: '#c8b090', mid: '#b8a080', bottom: '#a08868', edge: '#a89070', blendBase: '#b8a080' }
}

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
            <radialGradient id="sac-nebula-1" cx="30%" cy="40%" r="50%">
              <stop offset="0%" stopColor="rgba(140,80,220,0.08)" />
              <stop offset="60%" stopColor="rgba(100,50,180,0.03)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="sac-nebula-2" cx="70%" cy="65%" r="45%">
              <stop offset="0%" stopColor="rgba(100,140,255,0.06)" />
              <stop offset="50%" stopColor="rgba(80,60,200,0.025)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="sac-core" cx="50%" cy="55%" r="40%">
              <stop offset="0%" stopColor={isDark ? 'rgba(180,140,255,0.07)' : 'rgba(140,100,220,0.05)'}>
                <animate attributeName="stopColor" values={isDark ? 'rgba(180,140,255,0.05);rgba(200,160,255,0.1);rgba(180,140,255,0.05)' : 'rgba(140,100,220,0.03);rgba(160,120,240,0.07);rgba(140,100,220,0.03)'} dur="6s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#sac-nebula-1)" />
          <rect width="100%" height="100%" fill="url(#sac-nebula-2)" />
          <rect width="100%" height="100%" fill="url(#sac-core)" />
          {Array.from({ length: 18 }).map((_, i) => {
            const cx = 8 + (i * 37 + i * i * 7) % 84
            const cy = 8 + (i * 29 + i * i * 11) % 84
            const r = i % 5 === 0 ? 0.8 : i % 3 === 0 ? 0.5 : 0.3
            const dur = 3 + (i % 5) * 1.5
            const delay = i * 0.7
            return (
              <g key={i}>
                <circle cx={`${cx}%`} cy={`${cy}%`} r={r} fill={i % 4 === 0 ? '#c4b5fd' : i % 3 === 0 ? '#a5b4fc' : '#e0d0ff'}>
                  <animate attributeName="opacity" values="0;0.7;0" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
                </circle>
                {i % 5 === 0 && <>
                  <line x1={`${cx - 0.8}%`} y1={`${cy}%`} x2={`${cx + 0.8}%`} y2={`${cy}%`} stroke="#d4b8ff" strokeWidth="0.3">
                    <animate attributeName="opacity" values="0;0.4;0" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
                  </line>
                  <line x1={`${cx}%`} y1={`${cy - 0.8}%`} x2={`${cx}%`} y2={`${cy + 0.8}%`} stroke="#d4b8ff" strokeWidth="0.3">
                    <animate attributeName="opacity" values="0;0.4;0" dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
                  </line>
                </>}
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  return null
}

const PLANT_DESCRIPTIONS: Record<string, string> = {
  tangerine: 'The classic starter. Humble, reliable, and surprisingly sweet — every grove starts here.',
  lemon: 'Bright and tart. Thrives on neglect and rewards patience with a citrus kick.',
  plum: 'Deep purple and brooding. Quietly productive, with a richness that sneaks up on you.',
  pineapple: 'Spiky on the outside, golden on the inside. Takes its sweet time but worth the wait.',
  passionfruit: 'Exotic and elusive. The vine twists in ways no one can predict.',
  coconut: 'Tall, breezy, and impossible to rush. Island vibes in tree form.',
  sunflower: 'Always facing the light. A cheerful giant that towers over the rest.',
  grape: 'Grows in clusters, aged to perfection. The longer you wait, the finer it gets.',
  pear: 'Elegant and understated. The kind of tree that looks good in any orchard.',
  melon: 'Round, heavy, and satisfying. Grows low to the ground like it owns the place.',
  mushroom: 'Not technically a tree and doesn\'t care. Thrives in the dark, produces in silence.',
  cactus: 'Stores everything it needs inside. Goes weeks without attention and still delivers.',
  sage: 'Aromatic and wise. The old soul of the grove — ask it anything.',
  lychee: 'Delicate shell, explosive flavor. A rare find that makes every harvest feel special.',
  papaya: 'Tropical royalty. Grows fast, fruits heavy, and looks incredible doing it.',
  coral: 'Shouldn\'t exist on land, yet here it is. Pulses with an otherworldly glow.',
  whirlpool: 'Bends light and water around its trunk. Stare too long and you\'ll forget the time.',
  bloom: 'Flowers that never wilt. Each petal holds a little piece of forever.',
  lotus: 'Rises clean from murky waters. Proof that beauty comes from unlikely places.',
  birch: 'White bark, gold leaves. Elegant in every season, impossible to ignore.',
  pine: 'Evergreen and steadfast. Stands tall through every storm without complaint.',
  ivy: 'Climbs everything. Give it a wall and it\'ll turn it into a garden.',
  oak: 'The backbone of any forest. Slow, massive, and absolutely unshakeable.',
  sakura: 'Blooms once and makes the whole world stop to watch.',
  cattail: 'Grows where water meets land. Quiet, fuzzy, and strangely calming.',
  cypress: 'Tall and narrow like a green flame. Guards the orchard with silent dignity.',
  bamboo: 'Grows an inch while you blink. Hollow inside but stronger than steel.',
  mangrove: 'Roots in chaos, thrives in salt. The survivor of the plant kingdom.',
  bonsai: 'A whole forest compressed into a single pot. Patience made visible.',
  juniper: 'Twisted, ancient, and aromatic. Looks like it knows secrets about the wind.',
  cedarwood: 'Smells like a cabin in the mountains. Sturdy wood, deep roots, lasting impression.',
  baobab: 'Upside-down tree that stores water in its belly. A living water tower.',
  winterveil: 'Frosted branches that shimmer in moonlight. Winter\'s most beautiful secret.',
  agave: 'Waits a lifetime to bloom once. When it does, the whole desert watches.',
  abyss: 'Grows downward into nothing. The gems it produces shouldn\'t exist.',
  starweaver: 'Threads starlight into its branches. Each leaf is a tiny constellation.',
  leviathan: 'Something ancient sleeps in its roots. The gems it surfaces glow with deep-sea pressure.',
  prismatic: 'Refracts all light that touches it. No two people see the same tree.',
  spoiled: 'Withered and forgotten. A reminder that not every seed makes it.',
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
    stock[picked] = 1
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

  const palette = getPalette(isDark)
  const { bg, cardBg, cardBorder, textPrimary, textSecondary, textMuted } = palette
  const type = getType(palette)
  const dividerColor = cardBorder

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
    const crackDur = rarity === 'sacred' ? 3500 : rarity === 'true rare' ? 2800 : rarity === 'rare' ? 1400 : 1100
    setTimeout(() => {
      const next = new Set(revealedCards)
      next.add(index)
      setRevealedCards(next)
      localStorage.setItem('pulp_revealed_cards', JSON.stringify([...next]))
      setCrackingCard(null)
      setRevealEffect({ index, rarity })
      const effectDur = rarity === 'sacred' ? 6000 : rarity === 'true rare' ? 4000 : rarity === 'rare' ? 1500 : rarity === 'uncommon' ? 1000 : 600
      setTimeout(() => setRevealEffect(null), effectDur)
    }, crackDur)
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

  const getGrowthTime = (type: string) => {
    return TREE_TYPES[type]?.growthMinutes || 25
  }

  const formatGrowthTime = (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
    return `${minutes}m`
  }

  const buySeed = (type: string) => {
    if ((shopStock[type] || 0) <= 0) return
    if (inventory.length >= MAX_SEEDS) { setSatchelFullPopup(true); return }
    const seedCost = TREE_TYPES[type]?.cost || 0
    if (seedCost > sap) return
    if (seedCost > 0) setSap((s: number) => s - seedCost)
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
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 400, fontFamily: font,
      color: isDark ? '#d4c4a0' : '#4a3a20',
      background: isDark ? 'rgba(217,119,6,0.08)' : 'rgba(217,119,6,0.06)',
      border: `1px solid ${isDark ? 'rgba(217,119,6,0.2)' : 'rgba(217,119,6,0.15)'}`,
      borderRadius: 20, padding: '4px 12px',
    }}>
      <PulpIcon size={12} />
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
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        @keyframes seed-wobble {
          0% { transform: rotate(0deg) scale(1); }
          12% { transform: rotate(-1deg) scale(1.008); }
          25% { transform: rotate(1.2deg) scale(1.015); }
          37% { transform: rotate(-1.5deg) scale(1.02); }
          50% { transform: rotate(1.8deg) scale(1.025); }
          65% { transform: rotate(-1.2deg) scale(1.018); }
          80% { transform: rotate(0.6deg) scale(1.008); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes seed-crack-fade {
          0% { opacity: 1; transform: scale(1); }
          65% { opacity: 0.95; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.01); }
        }
        @keyframes sprout-emerge {
          0% { transform: scaleY(0) scaleX(0.5) translateY(30px); transform-origin: center bottom; opacity: 0; }
          25% { transform: scaleY(0) scaleX(0.5) translateY(30px); transform-origin: center bottom; opacity: 0; }
          50% { transform: scaleY(0.4) scaleX(0.7) translateY(8px); transform-origin: center bottom; opacity: 0.6; }
          72% { transform: scaleY(1.08) scaleX(1.02) translateY(-3px); transform-origin: center bottom; opacity: 1; }
          86% { transform: scaleY(0.97) scaleX(0.99) translateY(1px); transform-origin: center bottom; opacity: 1; }
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
          0% { transform: scale(1); }
          100% { transform: scale(1); }
        }
        @keyframes pop-common {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pop-uncommon {
          0% { transform: scale(0); opacity: 0; }
          45% { transform: scale(1.1); opacity: 1; }
          75% { transform: scale(0.97); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pop-rare {
          0% { transform: scale(0) rotate(-3deg); opacity: 0; }
          40% { transform: scale(1.15) rotate(1deg); opacity: 1; }
          70% { transform: scale(0.96) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pop-true-rare {
          0% { transform: scale(0) rotate(-5deg); opacity: 0; }
          35% { transform: scale(1.2) rotate(2deg); opacity: 1; }
          60% { transform: scale(0.94) rotate(-0.5deg); }
          80% { transform: scale(1.03) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pop-sacred {
          0% { transform: scale(0) rotate(-6deg); opacity: 0; filter: brightness(2.5); }
          30% { transform: scale(1.25) rotate(2deg); opacity: 1; filter: brightness(1.8); }
          55% { transform: scale(0.92) rotate(-1deg); filter: brightness(1.2); }
          75% { transform: scale(1.05) rotate(0deg); filter: brightness(1); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1); }
        }
        @keyframes pop-ring {
          0% { transform: scale(0); opacity: 0.8; }
          50% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes pop-particle {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          15% { transform: translate(var(--pp-x1), var(--pp-y1)) scale(1.2); opacity: 1; }
          100% { transform: translate(var(--pp-x2), var(--pp-y2)) scale(0); opacity: 0; }
        }
        @keyframes sacred-nova {
          0% { transform: scale(0); opacity: 0; }
          20% { transform: scale(0.6); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes sacred-star {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; transform: translate(var(--ss-x1), var(--ss-y1)) scale(1) rotate(90deg); }
          60% { opacity: 0.7; transform: translate(var(--ss-x2), var(--ss-y2)) scale(0.6) rotate(200deg); }
          100% { opacity: 0; transform: translate(var(--ss-x3), var(--ss-y3)) scale(0) rotate(360deg); }
        }
        @keyframes sacred-shimmer {
          0% { opacity: 0; }
          20% { opacity: 0.3; }
          50% { opacity: 0.15; }
          100% { opacity: 0; }
        }
        @keyframes rarity-color-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes rarity-color-cinematic {
          0% { opacity: 0; transform: scale(1.15); filter: brightness(2); }
          40% { opacity: 0.8; transform: scale(1.02); filter: brightness(1.3); }
          100% { opacity: 1; transform: scale(1); filter: brightness(1); }
        }
        @keyframes sacred-bg-ignite {
          0% { opacity: 0; transform: scale(1.5); filter: brightness(1) blur(16px); }
          25% { opacity: 0.6; transform: scale(1.1); filter: brightness(2.5) blur(4px); }
          50% { opacity: 0.9; transform: scale(1); filter: brightness(1.5) blur(0px); }
          100% { opacity: 1; transform: scale(1); filter: brightness(1); }
        }
        @keyframes sacred-flash {
          0% { opacity: 0; }
          15% { opacity: 0.7; }
          100% { opacity: 0; }
        }
        @keyframes rarity-pulse {
          0%, 100% { box-shadow: 0 0 8px var(--pulse-col), 0 4px 16px var(--pulse-col20); }
          50% { box-shadow: 0 0 14px var(--pulse-col), 0 4px 24px var(--pulse-col40); }
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
        @keyframes card-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(var(--float-y, -6px)); } }
        .seed-packet { transition: box-shadow 0.3s ease; }
        .seed-card-wrap { transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease; }
        .seed-card-wrap:hover { transform: translateY(-8px) scale(1.02); filter: brightness(1.05); }
        .seed-cracking { animation: seed-wobble var(--crack-dur, 1.1s) ease-in-out !important; will-change: transform; }
        .seed-revealed { }
        .daily-deal { }
      `}</style>
      <div
        onWheel={e => { if (e.ctrlKey || e.metaKey) e.preventDefault() }}
        style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: isDark ? '#0e0c09' : '#ede6d8', touchAction: 'pan-x pan-y' }}
      >
        {/* Sap — top right */}
        <div style={{ position: 'absolute', top: 12, right: 20, zIndex: 10 }}>
          <CurrencyPill amount={sap} />
        </div>


        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* SHOP */}
          {activeTab === 'shop' && (
            <div style={{ padding: '0 40px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              {/* Terraced landscape background */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                {/* Terrain background */}
                {(() => {
                  const groundY = 165
                  const hillPts: string[] = []
                  for (let x = -10; x <= 410; x += 10) hillPts.push(`${x},${getMarketHillY(x).toFixed(1)}`)
                  const hillPath = `M${hillPts[0]} ${hillPts.slice(1).map(p => `L${p}`).join(' ')} L410,${groundY} L-10,${groundY} Z`
                  const hillRidge = `M${hillPts[0]} ${hillPts.slice(1).map(p => `L${p}`).join(' ')}`
                  return (
                <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDark ? '#08060a' : '#c8b8a0'} />
                      <stop offset="50%" stopColor={isDark ? '#10100e' : '#d8c8b0'} />
                      <stop offset="100%" stopColor={isDark ? '#1e1a12' : '#e4d8c0'} />
                    </linearGradient>
                    <linearGradient id="m-hill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDark ? '#162018' : '#6a8060'} />
                      <stop offset="40%" stopColor={isDark ? '#0e1610' : '#7a9070'} />
                      <stop offset="100%" stopColor={isDark ? '#0a0e0c' : '#7a8870'} />
                    </linearGradient>
                    <linearGradient id="m-ground" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDark ? '#1a2014' : '#3e4e34'} />
                      <stop offset="100%" stopColor={isDark ? '#141810' : '#2e3e24'} />
                    </linearGradient>
                    <radialGradient id="m-star-g">
                      <stop offset="0%" stopColor="#ffeedd" stopOpacity="1" />
                      <stop offset="40%" stopColor="#ffeedd" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#ffeedd" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <style>{`
                    @keyframes m-twinkle { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                    @keyframes m-firefly { 0% { transform: translate(0,0); opacity: 0; } 8% { opacity: 0.6; } 25% { transform: translate(4px,-6px); opacity: 0.7; } 50% { transform: translate(8px,-12px); opacity: 0.5; } 75% { transform: translate(2px,-3px); opacity: 0.7; } 92% { opacity: 0.6; } 100% { transform: translate(-4px,6px); opacity: 0; } }
                    @keyframes m-firefly2 { 0% { transform: translate(0,0); opacity: 0; } 10% { opacity: 0.5; } 30% { transform: translate(-5px,-4px); opacity: 0.6; } 55% { transform: translate(-10px,-8px); opacity: 0.4; } 75% { transform: translate(-3px,-2px); opacity: 0.6; } 90% { opacity: 0.5; } 100% { transform: translate(5px,10px); opacity: 0; } }
                    @keyframes m-cloud-drift { 0% { transform: translateX(0); } 100% { transform: translateX(400px); } }
                  `}</style>

                  {/* Sky */}
                  <rect width="400" height="300" fill="url(#m-sky)" />

                  {/* Stars */}
                  {isDark && <>
                    {[[32,18,1.2],[78,12,0.8],[125,28,1.0],[168,8,0.7],[210,22,1.1],[258,15,0.9],[305,25,0.7],[350,10,1.0],[55,40,0.6],[145,42,0.8],[240,38,0.7],[310,35,0.9],[380,42,0.6],[20,55,0.5],[95,50,0.7],[195,52,0.6],[280,48,0.8],[365,55,0.5],[12,8,0.9],[48,32,0.7],[110,5,1.0],[175,38,0.6],[225,8,0.8],[270,30,0.9],[340,42,0.7],[390,18,0.8],[65,22,0.5],[155,15,0.7],[295,12,0.6],[370,32,0.8],[42,48,0.6],[200,28,0.9],[330,8,0.7],[115,58,0.5],[250,55,0.6],[380,58,0.5]].map(([x,y,r], i) => (
                      <circle key={`st${i}`} cx={x} cy={y} r={r as number} fill="url(#m-star-g)" opacity={0.75 + (i % 3) * 0.08} style={{ animation: `m-twinkle ${3 + (i % 4) * 1.5}s ease-in-out ${(i * 0.7) % 4}s infinite` }} />
                    ))}
                  </>}

                  {/* Moon */}
                  {isDark && (() => {
                    const mx = 310, my = 55, sc = 4
                    return (
                      <g>
                        <defs>
                          <radialGradient id="bg-moon-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#c0cee0" stopOpacity="0.15" />
                            <stop offset="30%" stopColor="#a0b0c8" stopOpacity="0.06" />
                            <stop offset="70%" stopColor="#8090b0" stopOpacity="0.02" />
                            <stop offset="100%" stopColor="#8090b0" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="bg-moon-edge" cx="20%" cy="45%" r="80%">
                            <stop offset="0%" stopColor="#f0f4ff" />
                            <stop offset="40%" stopColor="#dde4f0" />
                            <stop offset="100%" stopColor="#b8c4d8" />
                          </radialGradient>
                          <mask id="bg-moon-mask">
                            <circle cx={mx} cy={my} r={1.2 * sc} fill="white" />
                            <circle cx={mx + 0.9 * sc} cy={my - 0.1 * sc} r={1.1 * sc} fill="black" />
                          </mask>
                        </defs>
                        <ellipse cx={mx} cy={my} rx={5 * sc} ry={3.5 * sc} fill="url(#bg-moon-glow)" />
                        <circle cx={mx} cy={my} r={1.2 * sc} fill="url(#bg-moon-edge)" mask="url(#bg-moon-mask)" />
                        <circle cx={mx - 0.4 * sc} cy={my - 0.2 * sc} r={0.15 * sc} fill="rgba(160,170,190,0.35)" mask="url(#bg-moon-mask)" />
                        <circle cx={mx - 0.2 * sc} cy={my + 0.33 * sc} r={0.1 * sc} fill="rgba(155,165,185,0.3)" mask="url(#bg-moon-mask)" />
                        <ellipse cx={mx - 0.57 * sc} cy={my + 0.03 * sc} rx={0.07 * sc} ry={0.05 * sc} fill="rgba(150,162,182,0.28)" mask="url(#bg-moon-mask)" />
                      </g>
                    )
                  })()}

                  {/* Clouds */}
                  {[
                    { y: 50, rx: 30, ry: 5, opacity: 0.04, dur: 700, delay: 0 },
                    { y: 60, rx: 22, ry: 4, opacity: 0.035, dur: 560, delay: -200 },
                    { y: 45, rx: 25, ry: 4.5, opacity: 0.03, dur: 480, delay: -350 },
                  ].map((c, i) => (
                    <ellipse key={`cloud${i}`} cx={-60} cy={c.y} rx={c.rx} ry={c.ry} fill={isDark ? '#8090a0' : '#f0e8d8'} opacity={isDark ? c.opacity : c.opacity * 2} style={{ animation: `m-cloud-drift ${c.dur}s linear ${c.delay}s infinite` }} />
                  ))}

                  {/* Distant far hill — left side */}
                  <defs>
                    <linearGradient id="m-far-hill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDark ? '#0a0e0c' : '#7a8870'} />
                      <stop offset="100%" stopColor={isDark ? '#080c0a' : '#6a7860'} />
                    </linearGradient>
                  </defs>
                  <path d="M-10,130 C10,118 40,100 80,92 C110,86 140,88 170,95 C190,100 210,108 230,118 L230,170 L-10,170 Z" fill="url(#m-far-hill)" opacity="0.8" />
                  <path d="M-10,130 C10,118 40,100 80,92 C110,86 140,88 170,95 C190,100 210,108 230,118" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  <path d="M-10,133 C10,121 40,104 80,96 C110,90 140,92 170,99 C190,104 210,112 230,122" fill="none" stroke={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} strokeWidth="0.3" />
                  {/* Boulders on far hill */}
                  {(() => {
                    const rng = marketSeededRng(7712)
                    const farPts: [number,number][] = [[-10,130],[10,118],[40,100],[80,92],[110,86],[140,88],[170,95],[190,100],[210,108],[230,118]]
                    const getFarY = (x: number) => {
                      for (let j = 0; j < farPts.length - 1; j++) {
                        if (x >= farPts[j][0] && x <= farPts[j+1][0]) {
                          const t = (x - farPts[j][0]) / (farPts[j+1][0] - farPts[j][0])
                          return farPts[j][1] + t * (farPts[j+1][1] - farPts[j][1])
                        }
                      }
                      return 120
                    }
                    const rocks: string[] = []
                    const rockDark: string[] = []
                    const highlightsP: string[] = []
                    const cracksP: string[] = []
                    const baseC = isDark ? '#141816' : '#6a7462'
                    const darkC = isDark ? '#0e1210' : '#586858'
                    const lightC = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'
                    const crackC = isDark ? '#0c0e0c' : '#4a5a44'
                    const sizes = [0.5, 0.15, 0.9, 0.25, 1.2, 0.2, 0.65, 0.35, 1.5, 0.3, 0.75, 0.18, 1.0, 0.4]
                    for (let i = 0; i < 14; i++) {
                      const rx = 5 + (i / 14) * 220 + (rng() - 0.5) * 25
                      const ry = getFarY(rx) + 2 + rng() * 18
                      const sizeMul = sizes[i]
                      const w = sizeMul * (2 + rng() * 3), h = sizeMul * (1.5 + rng() * 2.5)
                      const tilt = (rng() - 0.5) * 0.8
                      const jL = rng() * 0.3, jR = rng() * 0.3, jT = rng() * 0.2
                      rocks.push(`M${(rx - w).toFixed(1)},${ry.toFixed(1)}Q${(rx - w * (0.7 + jL)).toFixed(1)},${(ry - h * (0.5 + jL)).toFixed(1)} ${(rx - w * 0.3 + tilt).toFixed(1)},${(ry - h * (0.9 + jT)).toFixed(1)}Q${(rx + tilt).toFixed(1)},${(ry - h * (1.05 + jT)).toFixed(1)} ${(rx + w * 0.35 + tilt).toFixed(1)},${(ry - h * (0.8 + jR)).toFixed(1)}Q${(rx + w * (0.8 + jR)).toFixed(1)},${(ry - h * (0.4 + jR)).toFixed(1)} ${(rx + w).toFixed(1)},${ry.toFixed(1)}Z`)
                      rockDark.push(`M${(rx - w * 0.9).toFixed(1)},${(ry + 0.5).toFixed(1)}Q${rx.toFixed(1)},${(ry + h * 0.15 + 0.5).toFixed(1)} ${(rx + w * 0.9).toFixed(1)},${(ry + 0.5).toFixed(1)}`)
                      highlightsP.push(`M${(rx - w * 0.3 + tilt).toFixed(1)},${(ry - h * (0.9 + jT)).toFixed(1)}Q${(rx + tilt).toFixed(1)},${(ry - h * (1.05 + jT)).toFixed(1)} ${(rx + w * 0.35 + tilt).toFixed(1)},${(ry - h * (0.8 + jR)).toFixed(1)}`)
                      const cx1 = rx + (rng() - 0.5) * w * 0.5, cy1 = ry - h * (0.3 + rng() * 0.4)
                      cracksP.push(`M${cx1.toFixed(1)},${cy1.toFixed(1)}l${(rng() * 1.5 - 0.7).toFixed(1)},${(rng() * 1).toFixed(1)}`)
                      if (w > 4) {
                        const cx2 = rx + (rng() - 0.5) * w * 0.4, cy2 = ry - h * (0.2 + rng() * 0.3)
                        cracksP.push(`M${cx2.toFixed(1)},${cy2.toFixed(1)}l${(rng() - 0.5).toFixed(1)},${(rng() * 0.8).toFixed(1)}`)
                      }
                    }
                    return <g>
                      <path d={rocks.join('')} fill={baseC} />
                      <path d={rockDark.join('')} stroke={darkC} strokeWidth="0.5" fill="none" opacity="0.6" />
                      <path d={highlightsP.join('')} stroke={lightC} strokeWidth="0.5" fill="none" />
                      <path d={cracksP.join('')} stroke={crackC} strokeWidth="0.3" fill="none" opacity="0.5" />
                    </g>
                  })()}

                  {/* Background hill */}
                  <path d={hillPath} fill="url(#m-hill)" />
                  <path d={hillRidge} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" />
                  {/* Shadow band */}
                  {(() => {
                    const shadowPts: string[] = []
                    for (let x = -10; x <= 410; x += 10) shadowPts.push(`${x},${(getMarketHillY(x) + 8).toFixed(1)}`)
                    const shadowPath = `M${shadowPts[0]} ${shadowPts.slice(1).map(p => `L${p}`).join(' ')} L410,${groundY} L-10,${groundY} Z`
                    return <path d={shadowPath} fill="rgba(0,0,0,0.08)" />
                  })()}
                  {/* Contour lines */}
                  {[3, 6].map(offset => {
                    const cPts: string[] = []
                    for (let x = -10; x <= 410; x += 10) cPts.push(`${x},${(getMarketHillY(x) + offset).toFixed(1)}`)
                    return <path key={`c-${offset}`} d={`M${cPts[0]} ${cPts.slice(1).map(p => `L${p}`).join(' ')}`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)'} strokeWidth={offset === 3 ? "0.4" : "0.3"} />
                  })}

                  <MarketHillPaths isDark={isDark} />
                  <MarketTangerineTrees isDark={isDark} />
                  <MarketHillGrass isDark={isDark} />

                  {/* Ground plane */}
                  <path d={`M-10,${groundY} L200,${groundY - 2} L410,${groundY} L410,300 L-10,300 Z`} fill="url(#m-ground)" />
                  <path d={`M-10,${groundY + 3} L200,${groundY + 1} L410,${groundY + 3}`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)'} strokeWidth="0.4" />
                  <path d={`M-10,${groundY + 8} L200,${groundY + 6} L410,${groundY + 8}`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.025)'} strokeWidth="0.3" />
                  <path d={`M-10,${groundY + 15} L200,${groundY + 13} L410,${groundY + 15}`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)'} strokeWidth="0.25" />
                  <path d={`M-10,${groundY + 6} L200,${groundY + 4} L410,${groundY + 6} L410,300 L-10,300 Z`} fill="rgba(0,0,0,0.05)" />
                  <MarketGroundGrass isDark={isDark} groundY={groundY - 1} />

                  {/* Fence */}
                  {(() => {
                    const fenceColor = isDark ? '#4a3e28' : '#6a5a3a'
                    const fenceLight = isDark ? '#5a4e32' : '#7a6a4a'
                    const posts = [60, 200, 340]
                    const postH = 24
                    const postW = 4.5
                    const railYTop = (px: number) => groundY + Math.sin(px / 400 * Math.PI) * -2.5 - postH * 0.7
                    const railYBot = (px: number) => groundY + Math.sin(px / 400 * Math.PI) * -2.5 - postH * 0.25
                    return (
                      <g>
                        <line x1={0} y1={railYTop(0)} x2={400} y2={railYTop(400)} stroke={fenceColor} strokeWidth="1" />
                        <line x1={0} y1={railYBot(0)} x2={400} y2={railYBot(400)} stroke={fenceColor} strokeWidth="0.8" />
                        <line x1={0} y1={railYTop(0)} x2={400} y2={railYTop(400)} stroke={fenceLight} strokeWidth="0.3" opacity="0.3" />
                        {posts.map(px => {
                          const t = px / 400
                          const yOff = Math.sin(t * Math.PI) * -2.5
                          const py = groundY + yOff
                          return (
                            <g key={`fp-${px}`}>
                              <rect x={px - postW / 2} y={py - postH} width={postW} height={postH + 0.5} rx={0.3} fill={fenceColor} />
                              <rect x={px - postW * 0.2} y={py - postH} width={postW * 0.35} height={postH + 0.5} fill={fenceLight} opacity="0.35" />
                              <rect x={px - postW * 0.6} y={py - postH - 0.5} width={postW * 1.2} height={0.8} rx={0.15} fill={fenceColor} />
                            </g>
                          )
                        })}
                      </g>
                    )
                  })()}

                  {/* Lamppost */}
                  {(() => {
                    const lx = 170, ly = groundY, sc = 6
                    const iron = isDark ? '#3a3a3a' : '#4a4a4a'
                    const ironD = isDark ? '#2a2a2a' : '#3a3a3a'
                    const isNight = isDark
                    const glass = isNight ? '#fbbf24' : '#8a8a82'
                    const glassL = isNight ? '#fcd34d' : '#9a9a92'
                    return (
                      <g>
                        <defs>
                          <radialGradient id="bg-lamp-glow" cx="50%" cy="45%" r="50%">
                            <stop offset="0%" stopColor={glassL} stopOpacity="0.3" />
                            <stop offset="50%" stopColor={glass} stopOpacity="0.1" />
                            <stop offset="100%" stopColor={glass} stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="bg-lamp-wash-a" cx="30%" cy="45%" r="55%">
                            <stop offset="0%" stopColor={glassL} stopOpacity="0.09" />
                            <stop offset="30%" stopColor={glass} stopOpacity="0.05" />
                            <stop offset="65%" stopColor={glass} stopOpacity="0.02" />
                            <stop offset="100%" stopColor={glass} stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="bg-lamp-ground" cx="40%" cy="25%" r="55%">
                            <stop offset="0%" stopColor="#d97706" stopOpacity="0.07" />
                            <stop offset="40%" stopColor="#92400e" stopOpacity="0.03" />
                            <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
                          </radialGradient>
                          <linearGradient id="bg-lamp-cone" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={glassL} stopOpacity="0.14" />
                            <stop offset="35%" stopColor={glass} stopOpacity="0.04" />
                            <stop offset="100%" stopColor={glass} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {isNight && <>
                          <ellipse cx={lx + 15 * sc / 0.65} cy={ly + 2 * sc} rx={55 * sc} ry={18 * sc} fill="url(#bg-lamp-wash-a)" style={{ filter: 'blur(8px)' }} />
                          <ellipse cx={lx + 5 * sc / 0.65} cy={ly + 4 * sc} rx={30 * sc} ry={10 * sc} fill="url(#bg-lamp-ground)" style={{ filter: 'blur(12px)' }} />
                          <ellipse cx={lx - 8 * sc} cy={ly + 3 * sc} rx={18 * sc} ry={7 * sc} fill="url(#bg-lamp-ground)" style={{ filter: 'blur(10px)' }} opacity="0.5" />
                          <path d={`M${lx - 1.5 * sc},${ly - 7 * sc} Q${lx + 3 * sc},${ly - 1 * sc} ${lx + 10 * sc},${ly + 6 * sc} L${lx - 5 * sc},${ly + 6 * sc} Q${lx - 4 * sc},${ly - 1 * sc} ${lx - 1.5 * sc},${ly - 7 * sc}`} fill="url(#bg-lamp-cone)" opacity="0.4" style={{ filter: 'blur(3px)' }} />
                          <circle cx={lx - 1.5 * sc} cy={ly - 7.5 * sc} r={5 * sc} fill="url(#bg-lamp-glow)" style={{ filter: 'blur(4px)' }} />
                        </>}
                        <ellipse cx={lx - 4 * sc} cy={ly + 1.5 * sc} rx={6 * sc} ry={1 * sc} fill={isDark ? 'rgba(0,0,0,0.18)' : 'rgba(20,15,5,0.12)'} />
                        <rect x={lx - 0.3 * sc} y={ly - 8 * sc} width={0.6 * sc} height={9 * sc} rx={0.15 * sc} fill={iron} />
                        <ellipse cx={lx} cy={ly + 1 * sc} rx={1.2 * sc} ry={0.4 * sc} fill={ironD} />
                        <path d={`M${lx},${ly - 7.5 * sc} Q${lx - 0.8 * sc},${ly - 8.5 * sc} ${lx - 1.5 * sc},${ly - 8 * sc}`} stroke={iron} strokeWidth={0.3 * sc} fill="none" />
                        <rect x={lx - 2.2 * sc} y={ly - 8.5 * sc} width={1.4 * sc} height={1.8 * sc} rx={0.15 * sc} fill={ironD} />
                        <rect x={lx - 2.05 * sc} y={ly - 8.3 * sc} width={1.1 * sc} height={1.4 * sc} rx={0.1 * sc} fill={glass} opacity="0.8" />
                        <rect x={lx - 1.5 * sc} y={ly - 8.3 * sc} width={0.3 * sc} height={1.4 * sc} fill={glassL} opacity="0.4" />
                        <polygon points={`${lx - 0.6 * sc},${ly - 8.5 * sc} ${lx - 1.5 * sc},${ly - 9.2 * sc} ${lx - 2.4 * sc},${ly - 8.5 * sc}`} fill={iron} />
                      </g>
                    )
                  })()}

                  {/* Fireflies */}
                  {isDark && [[50,140,6],[120,125,8],[180,135,7],[250,120,9],[320,130,6],[80,155,7],[200,150,8],[340,145,6],[150,160,7],[280,155,8],[60,170,6],[230,165,7]].map(([fx,fy,dur], i) => {
                    const ffColor = i % 5 === 0 ? '#6abf5e' : '#d97706'
                    return (
                    <g key={`ff${i}`}>
                      <circle cx={fx} cy={fy} r={0.7} fill={ffColor} opacity="0" style={{ animation: `${i % 2 === 0 ? 'm-firefly' : 'm-firefly2'} ${(dur as number) * 3}s ease-in-out ${(i * 2.5) % 12}s infinite` }} />
                      <circle cx={fx} cy={fy} r={1.8} fill={ffColor} opacity="0" style={{ animation: `${i % 2 === 0 ? 'm-firefly' : 'm-firefly2'} ${(dur as number) * 3}s ease-in-out ${(i * 2.5) % 12}s infinite`, filter: 'blur(1px)' }} />
                    </g>
                    )
                  })}
                </svg>
                  )
                })()}
                {/* Shopkeeper stall SVG */}
                <svg viewBox="0 0 400 265" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', bottom: -8, left: 0, width: '100%', height: '65%' }}>
                  <defs>
                    <radialGradient id="o-body" cx="38%" cy="35%">
                      <stop offset="0%" stopColor="#e8a030" />
                      <stop offset="50%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#b06205" />
                    </radialGradient>
                    <radialGradient id="lantern-glow">
                      <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
                      <stop offset="25%" stopColor="#d97706" stopOpacity="0.18" />
                      <stop offset="50%" stopColor="#d97706" stopOpacity="0.07" />
                      <stop offset="75%" stopColor="#d97706" stopOpacity="0.02" />
                      <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <style>{`
                    @keyframes root-sway-l { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-0.3px,-0.4px); } }
                    @keyframes root-sway-r { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(0.3px,-0.4px); } }
                    @keyframes blink-open { 0%, 90%, 95%, 100% { opacity: 1; } 92.5% { opacity: 0; } }
                    @keyframes blink-shut { 0%, 90%, 95%, 100% { opacity: 0; } 92.5% { opacity: 1; } }
                  `}</style>

                  {/* ============ CANOPY ============ */}
                  {/* Left pole */}
                  <rect x="113" y="103" width="7" height="114" rx="2.5" fill={isDark ? '#3e3018' : '#a89878'} />
                  <rect x="114" y="103" width="5" height="114" rx="2" fill={isDark ? '#5a4a32' : '#b8a888'} />
                  <path d="M115 110 L118 110 M115 125 L118 125 M115 145 L118 145 M115 170 L118 170 M115 195 L118 195" stroke={isDark ? '#6a5a42' : '#c8b898'} strokeWidth="0.3" fill="none" />
                  <path d="M113 132 L120 129 M113 148 L120 145 M113 162 L120 159 M113 178 L120 175" stroke={isDark ? '#7a6a4a' : '#b0a080'} strokeWidth="0.8" fill="none" />
                  <circle cx="117" cy="150" r="1.2" fill={isDark ? '#7a6a4a' : '#b0a080'} />

                  {/* Right pole */}
                  <rect x="279" y="103" width="7" height="114" rx="2.5" fill={isDark ? '#3e3018' : '#a89878'} />
                  <rect x="280" y="103" width="5" height="114" rx="2" fill={isDark ? '#5a4a32' : '#b8a888'} />
                  <path d="M281 110 L284 110 M281 125 L284 125 M281 145 L284 145 M281 170 L284 170 M281 195 L284 195" stroke={isDark ? '#6a5a42' : '#c8b898'} strokeWidth="0.3" fill="none" />
                  <path d="M279 132 L286 129 M279 148 L286 145 M279 162 L286 159 M279 178 L286 175" stroke={isDark ? '#7a6a4a' : '#b0a080'} strokeWidth="0.8" fill="none" />
                  <circle cx="283" cy="150" r="1.2" fill={isDark ? '#7a6a4a' : '#b0a080'} />

                  {/* Pole finials */}
                  <circle cx="117" cy="103" r="5" fill={isDark ? '#5a4a32' : '#b8a888'} />
                  <circle cx="117" cy="103" r="3.5" fill={isDark ? '#6a5a42' : '#c8b898'} />
                  <circle cx="117" cy="103" r="1.8" fill={isDark ? '#5a4a32' : '#b8a888'} />
                  <circle cx="117" cy="103" r="0.6" fill={isDark ? '#7a6a52' : '#d0c0a0'} />
                  <circle cx="283" cy="103" r="5" fill={isDark ? '#5a4a32' : '#b8a888'} />
                  <circle cx="283" cy="103" r="3.5" fill={isDark ? '#6a5a42' : '#c8b898'} />
                  <circle cx="283" cy="103" r="1.8" fill={isDark ? '#5a4a32' : '#b8a888'} />
                  <circle cx="283" cy="103" r="0.6" fill={isDark ? '#7a6a52' : '#d0c0a0'} />

                  {/* String lights between posts — behind canopy */}
                  <path d="M117 125 Q200 158 283 125" stroke={isDark ? '#4a3a28' : '#8a7a60'} strokeWidth="0.5" fill="none" />
                  {[130, 145, 160, 175, 190, 205, 220, 235, 250, 265].map((lx, li) => {
                    const t = (lx - 117) / (283 - 117)
                    const ly = 125 + 2 * t * (1 - t) * 33
                    return (
                      <g key={`sl-${li}`}>
                        <line x1={lx} y1={ly} x2={lx} y2={ly + 4} stroke={isDark ? '#4a3a28' : '#8a7a60'} strokeWidth="0.3" />
                        <circle cx={lx} cy={ly + 4.5} r={1.4} fill="#d97706" opacity="0.8" />
                        <circle cx={lx} cy={ly + 4.5} r={0.6} fill="#f0c050" />
                        <circle cx={lx} cy={ly + 4} r={3} fill="#d97706" opacity="0.06" />
                      </g>
                    )
                  })}

                  {/* Canopy fabric */}
                  <path d="M103 105 Q200 84 297 105 L293 116 Q200 97 107 116 Z" fill="#d97706" />
                  <path d="M120 110 L130 107 M150 107 L160 105 M190 104 L200 103 M230 104 L240 105 M260 106 L270 108 M280 109 L290 112" stroke="#c06e05" strokeWidth="0.3" fill="none" strokeDasharray="2 3" />
                  <path d="M107 116 Q200 97 293 116 L290 125 Q200 108 110 125 Z" fill={isDark ? '#a06820' : '#c8a050'} />
                  <path d="M110 125 Q200 108 290 125 L287 132 Q200 116 113 132 Z" fill="#c48a18" />
                  <path d="M103 105 Q110 112 117 105 Q124 112 131 105 Q138 112 145 105 Q152 112 159 105 Q166 112 173 105 Q180 112 187 105 Q194 112 201 105 Q208 112 215 105 Q222 112 229 105 Q236 112 243 105 Q250 112 257 105 Q264 112 271 105 Q278 112 285 105 Q292 112 297 105" fill="none" stroke="#b07a10" strokeWidth="1.5" />
                  <path d="M110 108 L111 110 M124 108 L125 110 M138 108 L139 110 M152 108 L153 110 M166 108 L167 110 M180 108 L181 110 M194 108 L195 110 M222 108 L223 110 M250 108 L251 110 M278 108 L279 110" stroke="#9a6818" strokeWidth="0.4" fill="none" />

                  {/* ============ LANTERNS ============ */}
                  {/* Left lantern */}
                  <line x1="140" y1="126" x2="140" y2="147" stroke={isDark ? '#3e3018' : '#a89878'} strokeWidth="1" />
                  <circle cx="140" cy="126" r="1" fill={isDark ? '#5a4a32' : '#b8a888'} />
                  <path d="M140 147 L142 147 L140 146 L138 147 Z" fill={isDark ? '#5a4a32' : '#a89878'} />
                  <rect x="131" y="147" width="18" height="22" rx="4.5" fill={isDark ? '#3a3020' : '#988868'} stroke={isDark ? '#2a2418' : '#8a8070'} strokeWidth="0.4" />
                  <rect x="133" y="149" width="14" height="18" rx="3.5" fill={isDark ? '#2a2418' : '#8a8070'} />
                  <line x1="133" y1="158" x2="147" y2="158" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.6" />
                  <line x1="140" y1="149" x2="140" y2="167" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.6" />
                  <line x1="134" y1="150" x2="139" y2="157" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.3" />
                  <line x1="141" y1="150" x2="146" y2="157" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.3" />
                  <line x1="134" y1="159" x2="139" y2="166" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.3" />
                  <line x1="141" y1="159" x2="146" y2="166" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.3" />
                  <circle cx="140" cy="158" r="4.5" fill="#d97706" />
                  <circle cx="140" cy="158" r="2.5" fill="#e8a030" />
                  <circle cx="140" cy="157" r="1" fill="#f0c050" />
                  <circle cx="140" cy="158" r="28" fill="url(#lantern-glow)" style={{ filter: 'blur(8px)' }} />
                  <ellipse cx="140" cy="168" rx="22" ry="10" fill="url(#lantern-glow)" style={{ filter: 'blur(12px)' }} opacity="0.5" />
                  <rect x="136" y="168" width="8" height="2" rx="0.5" fill={isDark ? '#3a3020' : '#988868'} />
                  <circle cx="140" cy="171" r="1" fill={isDark ? '#3a3020' : '#988868'} />

                  {/* Right lantern */}
                  <line x1="260" y1="126" x2="260" y2="147" stroke={isDark ? '#3e3018' : '#a89878'} strokeWidth="1" />
                  <circle cx="260" cy="126" r="1" fill={isDark ? '#5a4a32' : '#b8a888'} />
                  <path d="M260 147 L262 147 L260 146 L258 147 Z" fill={isDark ? '#5a4a32' : '#a89878'} />
                  <rect x="251" y="147" width="18" height="22" rx="4.5" fill={isDark ? '#3a3020' : '#988868'} stroke={isDark ? '#2a2418' : '#8a8070'} strokeWidth="0.4" />
                  <rect x="253" y="149" width="14" height="18" rx="3.5" fill={isDark ? '#2a2418' : '#8a8070'} />
                  <line x1="253" y1="158" x2="267" y2="158" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.6" />
                  <line x1="260" y1="149" x2="260" y2="167" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.6" />
                  <line x1="254" y1="150" x2="259" y2="157" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.3" />
                  <line x1="261" y1="150" x2="266" y2="157" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.3" />
                  <line x1="254" y1="159" x2="259" y2="166" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.3" />
                  <line x1="261" y1="159" x2="266" y2="166" stroke={isDark ? '#3a3020' : '#988868'} strokeWidth="0.3" />
                  <circle cx="260" cy="158" r="4.5" fill="#d97706" />
                  <circle cx="260" cy="158" r="2.5" fill="#e8a030" />
                  <circle cx="260" cy="157" r="1" fill="#f0c050" />
                  <circle cx="260" cy="158" r="28" fill="url(#lantern-glow)" style={{ filter: 'blur(8px)' }} />
                  <ellipse cx="260" cy="168" rx="22" ry="10" fill="url(#lantern-glow)" style={{ filter: 'blur(12px)' }} opacity="0.5" />
                  <rect x="256" y="168" width="8" height="2" rx="0.5" fill={isDark ? '#3a3020' : '#988868'} />
                  <circle cx="260" cy="171" r="1" fill={isDark ? '#3a3020' : '#988868'} />

                  {/* ============ ROOT ARMS ============ */}
                  {/* Left root arm */}
                  <g style={{ animation: 'root-sway-l 6s ease-in-out infinite', transformOrigin: '186px 210px' }}>
                    <path d="M186 212 Q174 213 164 214 Q156 215 150 216" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    <path d="M150 216 Q146 218 144 222 Q142 228 141 235 Q140 242 140 248" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M140 248 Q139 252 139 255" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.1" fill="none" strokeLinecap="round" />
                    <path d="M140 248 Q141 252 142 254" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="0.9" fill="none" strokeLinecap="round" />
                    <path d="M140 248 Q138 251 137 254" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.7" fill="none" strokeLinecap="round" />
                    <path d="M139 255 Q138 257 137 256" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.4" fill="none" strokeLinecap="round" />
                    <path d="M142 254 Q143 256 142 257" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.4" fill="none" strokeLinecap="round" />
                    <path d="M137 254 Q136 256 135 255" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.3" fill="none" strokeLinecap="round" />
                    <path d="M168 214 Q164 211 160 208" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.1" fill="none" strokeLinecap="round" />
                    <path d="M160 208 Q158 206 156 205" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.7" fill="none" strokeLinecap="round" />
                    <path d="M160 208 Q157 208 155 209" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.5" fill="none" strokeLinecap="round" />
                    <path d="M156 205 Q155 203 154 204" fill={isDark ? '#3a5a1a' : '#7a9a5a'} />
                    <path d="M144 226 Q140 224 137 223" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    <path d="M137 223 Q135 222 134 223" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.5" fill="none" strokeLinecap="round" />
                    <path d="M137 223 Q136 221 135 222" fill={isDark ? '#3a5a1a' : '#7a9a5a'} />
                    <path d="M141 238 Q138 236 136 235" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="0.6" fill="none" strokeLinecap="round" />
                    <path d="M136 235 Q134 234 133 235" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.4" fill="none" strokeLinecap="round" />
                    <path d="M178 213 Q176 210 174 209" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="0.6" fill="none" strokeLinecap="round" />
                    <path d="M174 209 Q173 208 172 209" fill={isDark ? '#3a5a1a' : '#7a9a5a'} />
                    <circle cx="172" cy="213.5" r="0.5" fill={isDark ? '#4a3218' : '#7a6040'} />
                    <circle cx="158" cy="215" r="0.5" fill={isDark ? '#3e2a14' : '#6a5030'} />
                    <circle cx="148" cy="218" r="0.4" fill={isDark ? '#4a3218' : '#7a6040'} />
                    <circle cx="143" cy="230" r="0.5" fill={isDark ? '#3e2a14' : '#6a5030'} />
                    <circle cx="141" cy="242" r="0.4" fill={isDark ? '#4a3218' : '#7a6040'} />
                    <path d="M163 214 Q162 215 163 216" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.3" fill="none" />
                    <path d="M145 224 Q144 225 145 226" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.3" fill="none" />
                  </g>

                  {/* Right root arm */}
                  <g style={{ animation: 'root-sway-r 7s ease-in-out infinite', transformOrigin: '214px 210px' }}>
                    <path d="M214 212 Q226 213 236 214 Q244 215 250 216" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M250 216 Q254 218 256 222 Q258 228 259 235 Q260 242 260 248" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="1.6" fill="none" strokeLinecap="round" />
                    <path d="M260 248 Q261 252 261 255" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    <path d="M260 248 Q259 252 258 255" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1" fill="none" strokeLinecap="round" />
                    <path d="M260 248 Q262 251 263 254" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    <path d="M260 248 Q258 250 256 253" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.6" fill="none" strokeLinecap="round" />
                    <path d="M261 255 Q262 257 263 256" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.4" fill="none" strokeLinecap="round" />
                    <path d="M258 255 Q257 257 256 256" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.4" fill="none" strokeLinecap="round" />
                    <path d="M263 254 Q264 256 265 255" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.3" fill="none" strokeLinecap="round" />
                    <path d="M256 253 Q255 255 254 254" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.3" fill="none" strokeLinecap="round" />
                    <path d="M232 214 Q234 210 236 207" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    <path d="M236 207 Q237 205 238 203" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    <path d="M236 207 Q238 207 240 208" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.6" fill="none" strokeLinecap="round" />
                    <path d="M238 203 Q239 201 238 200" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.4" fill="none" strokeLinecap="round" />
                    <path d="M238 200 Q237 198 236 199" fill={isDark ? '#3a5a1a' : '#7a9a5a'} />
                    <path d="M240 208 Q242 207 241 209" fill={isDark ? '#3a5a1a' : '#7a9a5a'} />
                    <path d="M257 226 Q260 224 263 223" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    <path d="M263 223 Q265 222 266 223" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.5" fill="none" strokeLinecap="round" />
                    <path d="M259 240 Q262 238 264 237" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="0.7" fill="none" strokeLinecap="round" />
                    <path d="M264 237 Q266 236 267 237" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.4" fill="none" strokeLinecap="round" />
                    <path d="M264 237 Q265 235 264 234" fill={isDark ? '#3a5a1a' : '#7a9a5a'} />
                    <path d="M222 213 Q224 210 226 209" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="0.6" fill="none" strokeLinecap="round" />
                    <circle cx="230" cy="214" r="0.6" fill={isDark ? '#4a3218' : '#7a6040'} />
                    <circle cx="242" cy="215" r="0.7" fill={isDark ? '#3e2a14' : '#6a5030'} />
                    <circle cx="252" cy="219" r="0.5" fill={isDark ? '#4a3218' : '#7a6040'} />
                    <circle cx="258" cy="232" r="0.5" fill={isDark ? '#3e2a14' : '#6a5030'} />
                    <circle cx="260" cy="244" r="0.4" fill={isDark ? '#4a3218' : '#7a6040'} />
                    <ellipse cx="248" cy="217" rx="0.8" ry="0.5" fill={isDark ? '#3e2a14' : '#6a5030'} />
                    <path d="M238 214 Q237 215 238 216" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.3" fill="none" />
                    <path d="M255 225 Q254 226 255 227" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.3" fill="none" />
                  </g>

                  {/* ============ THE ORANGE ============ */}
                  <circle cx="200" cy="210" r="20" fill="url(#o-body)" stroke={isDark ? '#1a1410' : '#8a7050'} strokeWidth="0.15" />
                  <ellipse cx="194" cy="201" rx="5" ry="7" fill="#e0a830" opacity="0.35" transform="rotate(-15 194 201)" />
                  <rect x="199" y="188" width="2.5" height="4" rx="1" fill="#4a6a2a" stroke={isDark ? '#1a1410' : '#8a7050'} strokeWidth="0.12" />
                  <rect x="199.3" y="188.5" width="1.8" height="1.5" rx="0.5" fill="#5a7a3a" />
                  <path d="M201.5 190 Q206 184 210 186 Q206 189 201.5 190" fill="#4a7a2a" stroke={isDark ? '#1a1410' : '#8a7050'} strokeWidth="0.12" />
                  <path d="M201.5 190 Q206 185.5 209 186" stroke="#3a6a1a" strokeWidth="0.3" fill="none" />

                  {/* Tiny earrings */}
                  <line x1="181" y1="212" x2="179" y2="215" stroke={isDark ? '#5a4a32' : '#b8a888'} strokeWidth="0.4" />
                  <circle cx="179" cy="216" r="1.2" fill="#d97706" />
                  <circle cx="179" cy="216" r="0.5" fill="#e8a030" />
                  <line x1="219" y1="212" x2="221" y2="215" stroke={isDark ? '#5a4a32' : '#b8a888'} strokeWidth="0.4" />
                  <circle cx="221" cy="216" r="1.2" fill="#d97706" />
                  <circle cx="221" cy="216" r="0.5" fill="#e8a030" />

                  {/* Face */}
                  <g style={{ animation: 'blink-open 5s ease-in-out infinite' }}>
                    <circle cx="194" cy="207" r="2.5" fill={isDark ? '#1a1410' : '#3a3020'} />
                    <circle cx="206" cy="207" r="2.5" fill={isDark ? '#1a1410' : '#3a3020'} />
                    <circle cx="195" cy="205.8" r="1" fill="#fff" />
                    <circle cx="207" cy="205.8" r="1" fill="#fff" />
                    <circle cx="194.3" cy="206.8" r="0.5" fill="#fff" />
                    <circle cx="206.3" cy="206.8" r="0.5" fill="#fff" />
                  </g>
                  <g style={{ animation: 'blink-shut 5s ease-in-out infinite' }}>
                    <path d="M192 207 Q194 209 196 207" stroke={isDark ? '#1a1410' : '#3a3020'} strokeWidth="1.3" fill="none" strokeLinecap="round" />
                    <path d="M204 207 Q206 209 208 207" stroke={isDark ? '#1a1410' : '#3a3020'} strokeWidth="1.3" fill="none" strokeLinecap="round" />
                  </g>
                  <ellipse cx="200" cy="216" rx="2.2" ry="2.8" fill="#8a4a05" />
                  <ellipse cx="200" cy="216" rx="1.5" ry="2" fill="#6a3a04" />

                  {/* ============ CART ============ */}
                  {/* Cart body planks */}
                  <rect x="100" y="218" width="200" height="44" rx="3" fill={isDark ? '#3a2e20' : '#a09070'} />
                  <rect x="100" y="218" width="200" height="10" rx="2" fill={isDark ? '#4a3a28' : '#b0a080'} />
                  <path d="M110 220 Q130 221 150 220 Q170 219 190 220 Q210 221 230 220 Q260 219 290 220" stroke={isDark ? '#3e3018' : '#a89878'} strokeWidth="0.3" fill="none" />
                  <path d="M115 224 Q135 225 155 224 Q180 223 200 224 Q230 225 260 224 Q280 223 295 224" stroke={isDark ? '#3e3018' : '#a89878'} strokeWidth="0.3" fill="none" />
                  <circle cx="145" cy="222" r="1.5" fill={isDark ? '#3e3018' : '#a89878'} />
                  <circle cx="145" cy="222" r="0.8" fill={isDark ? '#342a1c' : '#988868'} />
                  <rect x="100" y="228" width="200" height="9" fill={isDark ? '#423626' : '#a89878'} />
                  <path d="M108 231 Q140 232 170 231 Q200 230 240 231 Q270 232 295 231" stroke={isDark ? '#3a2e1e' : '#988868'} strokeWidth="0.3" fill="none" />
                  <path d="M110 234 Q150 235 180 234 Q220 233 260 234 Q285 235 295 234" stroke={isDark ? '#3a2e1e' : '#988868'} strokeWidth="0.3" fill="none" />
                  <ellipse cx="230" cy="232" rx="2" ry="1.2" fill={isDark ? '#3a2e1e' : '#988868'} />
                  <rect x="100" y="237" width="200" height="9" fill={isDark ? '#4a3a28' : '#b0a080'} />
                  <path d="M105 240 Q140 241 175 240 Q210 239 250 240 Q280 241 298 240" stroke={isDark ? '#3e3018' : '#a89878'} strokeWidth="0.3" fill="none" />
                  <circle cx="180" cy="241" r="1.2" fill={isDark ? '#3e3018' : '#a89878'} />
                  <circle cx="180" cy="241" r="0.5" fill={isDark ? '#342a1c' : '#988868'} />
                  <rect x="100" y="246" width="200" height="9" fill={isDark ? '#3e3222' : '#a09070'} />
                  <path d="M108 249 Q145 250 185 249 Q225 248 270 249 Q290 250 298 249" stroke={isDark ? '#342a1a' : '#988868'} strokeWidth="0.3" fill="none" />
                  <ellipse cx="270" cy="250" rx="1.5" ry="1" fill={isDark ? '#342a1a' : '#988868'} />
                  <rect x="100" y="255" width="200" height="7" fill={isDark ? '#4a3a28' : '#b0a080'} />
                  <path d="M110 258 Q150 259 200 258 Q250 257 290 258" stroke={isDark ? '#3e3018' : '#a89878'} strokeWidth="0.3" fill="none" />

                  {/* Vertical plank seams */}
                  <line x1="148" y1="218" x2="147" y2="262" stroke={isDark ? '#342a1c' : '#988868'} strokeWidth="0.6" />
                  <circle cx="148" cy="222" r="0.5" fill={isDark ? '#2a2218' : '#8a8070'} />
                  <circle cx="147" cy="240" r="0.5" fill={isDark ? '#2a2218' : '#8a8070'} />
                  <circle cx="147" cy="255" r="0.5" fill={isDark ? '#2a2218' : '#8a8070'} />
                  <line x1="205" y1="218" x2="204" y2="262" stroke={isDark ? '#342a1c' : '#988868'} strokeWidth="0.6" />
                  <circle cx="205" cy="225" r="0.5" fill={isDark ? '#2a2218' : '#8a8070'} />
                  <circle cx="204" cy="248" r="0.5" fill={isDark ? '#2a2218' : '#8a8070'} />
                  <line x1="260" y1="218" x2="261" y2="262" stroke={isDark ? '#342a1c' : '#988868'} strokeWidth="0.6" />
                  <circle cx="260" cy="230" r="0.5" fill={isDark ? '#2a2218' : '#8a8070'} />
                  <circle cx="261" cy="252" r="0.5" fill={isDark ? '#2a2218' : '#8a8070'} />

                  {/* Top rail */}
                  <rect x="95" y="212" width="210" height="8" rx="3" fill={isDark ? '#4a3a28' : '#b0a080'} />
                  <rect x="95" y="212" width="210" height="4" rx="2" fill={isDark ? '#6a5a42' : '#c8b898'} />
                  <rect x="95" y="212" width="210" height="2" rx="1" fill={isDark ? '#7a6a52' : '#d0c0a0'} />
                  <path d="M120 214 L125 214" stroke={isDark ? '#5a4a32' : '#b8a888'} strokeWidth="0.3" />
                  <path d="M180 215 L188 215" stroke={isDark ? '#5a4a32' : '#b8a888'} strokeWidth="0.3" />
                  <path d="M250 214 L258 214" stroke={isDark ? '#5a4a32' : '#b8a888'} strokeWidth="0.3" />
                  <rect x="109" y="215" width="2" height="2" rx="0.3" fill={isDark ? '#3e3018' : '#a89878'} />
                  <rect x="149" y="215" width="2" height="2" rx="0.3" fill={isDark ? '#3e3018' : '#a89878'} />
                  <rect x="199" y="215" width="2" height="2" rx="0.3" fill={isDark ? '#3e3018' : '#a89878'} />
                  <rect x="249" y="215" width="2" height="2" rx="0.3" fill={isDark ? '#3e3018' : '#a89878'} />
                  <rect x="289" y="215" width="2" height="2" rx="0.3" fill={isDark ? '#3e3018' : '#a89878'} />

                  {/* Iron corner brackets */}
                  <path d="M97 212 L97 230" stroke={isDark ? '#3a3018' : '#9a9080'} strokeWidth="3" strokeLinecap="round" />
                  <path d="M97 212 L112 212" stroke={isDark ? '#3a3018' : '#9a9080'} strokeWidth="3" strokeLinecap="round" />
                  <circle cx="97" cy="215" r="0.8" fill={isDark ? '#4a4028' : '#b0a890'} />
                  <circle cx="97" cy="222" r="0.8" fill={isDark ? '#4a4028' : '#b0a890'} />
                  <circle cx="97" cy="228" r="0.8" fill={isDark ? '#4a4028' : '#b0a890'} />
                  <circle cx="105" cy="212.5" r="0.8" fill={isDark ? '#4a4028' : '#b0a890'} />
                  <path d="M303 212 L303 230" stroke={isDark ? '#3a3018' : '#9a9080'} strokeWidth="3" strokeLinecap="round" />
                  <path d="M288 212 L303 212" stroke={isDark ? '#3a3018' : '#9a9080'} strokeWidth="3" strokeLinecap="round" />
                  <circle cx="303" cy="215" r="0.8" fill={isDark ? '#4a4028' : '#b0a890'} />
                  <circle cx="303" cy="222" r="0.8" fill={isDark ? '#4a4028' : '#b0a890'} />
                  <circle cx="303" cy="228" r="0.8" fill={isDark ? '#4a4028' : '#b0a890'} />
                  <circle cx="295" cy="212.5" r="0.8" fill={isDark ? '#4a4028' : '#b0a890'} />

                  {/* ============ CART GOODS ============ */}
                  {/* Potted plant */}
                  <ellipse cx="287" cy="211" rx="9" ry="2" fill={isDark ? '#1a1410' : '#a09070'} opacity="0.35" />
                  <path d="M278 200 L280 212 L294 212 L296 200 Z" fill="#7a4a2a" />
                  <path d="M278 200 L280 212 L287 212 L285 200 Z" fill="#8a5a3a" opacity="0.3" />
                  <path d="M287 200 L287 212 L294 212 L296 200 Z" fill="#5a3a1a" opacity="0.2" />
                  <rect x="277" y="198" width="20" height="3" rx="0.8" fill="#8a5a3a" />
                  <rect x="277" y="198" width="20" height="1.5" rx="0.5" fill="#9a6a4a" opacity="0.4" />
                  <path d="M278 200 L296 200" stroke="#6a3a1a" strokeWidth="0.5" />
                  <path d="M280 211 L294 211" stroke="#6a3a1a" strokeWidth="0.4" />
                  <path d="M282 210 L292 210" stroke="#6a3a1a" strokeWidth="0.3" opacity="0.5" />
                  <ellipse cx="287" cy="200" rx="7" ry="1.5" fill={isDark ? '#3a2a18' : '#6a5a40'} />
                  <ellipse cx="287" cy="199.5" rx="5" ry="0.8" fill={isDark ? '#4a3a22' : '#7a6a48'} opacity="0.4" />
                  <path d="M287 200 Q283 193 280 188" stroke={isDark ? '#2a4a1a' : '#5a8a4a'} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.3" />
                  <path d="M287 200 Q284 193 281 189" stroke={isDark ? '#3a6a2a' : '#6a9a5a'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M281 189 Q279 187 277 188" fill={isDark ? '#3a6a2a' : '#6a9a5a'} />
                  <path d="M281 189 Q280 186 279 187" fill={isDark ? '#4a7a3a' : '#7aaa6a'} />
                  <path d="M287 200 Q287 192 287 187" stroke={isDark ? '#4a7a3a' : '#7aaa6a'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M287 187 Q286 185 285 186" fill={isDark ? '#4a7a3a' : '#7aaa6a'} />
                  <path d="M287 187 Q288 185 289 186" fill={isDark ? '#3a6a2a' : '#6a9a5a'} />
                  <path d="M287 200 Q290 193 293 189" stroke={isDark ? '#3a6a2a' : '#6a9a5a'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M293 189 Q295 187 297 188" fill={isDark ? '#3a6a2a' : '#6a9a5a'} />
                  <path d="M287 194 Q289 192 291 193" fill={isDark ? '#4a7a3a' : '#7aaa6a'} />
                  <path d="M284 192 Q282 193 281 192" fill={isDark ? '#3a6a2a' : '#6a9a5a'} />
                  <path d="M289 200 Q290 197 291 196" stroke={isDark ? '#5a8a3a' : '#8aaa6a'} strokeWidth="0.6" fill="none" strokeLinecap="round" />
                  <path d="M291 196 Q292 195 293 196" fill={isDark ? '#5a8a3a' : '#8aaa6a'} />

                  {/* Dynamic seed jars matching daily seeds */}
                  <g transform="translate(0,2)">
                    {dailySeeds.map((seedType, si) => {
                      const jx = [155, 170, 185, 240, 255][si]
                      const jh = [12, 14, 10, 13, 11][si]
                      const jw = [14, 12, 10, 12, 11][si]
                      const jy = 212 - jh
                      const sc = TREE_TYPES[seedType]?.color || '#8a7a5a'
                      const sdull = sc + '90'
                      return (
                        <g key={`jar-${si}`}>
                          <ellipse cx={jx} cy={211.5} rx={jw / 2 + 1} ry={1.2} fill={isDark ? '#1a1410' : '#a09070'} opacity="0.3" />
                          <rect x={jx - jw / 2} y={jy} width={jw} height={jh} rx={jw / 2 - 2} fill="#4a5a4a" opacity="0.5" stroke="#3a4a3a" strokeWidth="0.3" />
                          <rect x={jx - jw / 2 + 1} y={jy + 1} width={jw - 2} height={jh - 2} rx={jw / 2 - 2.5} fill="#3a4a3a" opacity="0.4" />
                          <rect x={jx - 3} y={jy - 3} width={6} height={3.5} rx={1.8} fill="#4a5a4a" opacity="0.5" />
                          <rect x={jx - 2.5} y={jy - 4.5} width={5} height={2.5} rx={1.2} fill={isDark ? '#6a5a42' : '#c8b898'} />
                          <ellipse cx={jx} cy={jy + jh / 2} rx={1.8} ry={2.5} fill={sdull} opacity="0.7" />
                          <path d={`M${jx} ${jy + jh / 2 - 2.5} Q${jx} ${jy + jh / 2} ${jx} ${jy + jh / 2 + 2.5}`} stroke={sc} strokeWidth="0.4" fill="none" opacity="0.3" />
                          <path d={`M${jx} ${jy + jh / 2 - 2} Q${jx - 1} ${jy + jh / 2 - 3.5} ${jx} ${jy + jh / 2 - 4.5} Q${jx + 1} ${jy + jh / 2 - 3.5} ${jx} ${jy + jh / 2 - 2}`} fill="#4a6a2a" opacity="0.5" />
                        </g>
                      )
                    })}
                  </g>

                  {/* SEEDS sign */}
                  <line x1="200" y1="220" x2="200" y2="228" stroke={isDark ? '#4a3a28' : '#8a7a60'} strokeWidth="1" />
                  <rect x="170" y="228" width="60" height="18" rx="2.5" fill={isDark ? '#3a3020' : '#988868'} stroke={isDark ? '#2a2418' : '#8a8070'} strokeWidth="0.4" />
                  <path d="M174 232 Q200 231 226 232" stroke={isDark ? '#342a1c' : '#8a7a60'} strokeWidth="0.3" fill="none" />
                  <path d="M174 238 Q200 237 226 238" stroke={isDark ? '#342a1c' : '#8a7a60'} strokeWidth="0.3" fill="none" />
                  <text x="200" y="241" textAnchor="middle" fill={isDark ? '#1a1410' : '#2a2218'} fontSize="6.5" fontFamily="'Inter', system-ui, sans-serif" fontWeight="600" opacity="0.85" letterSpacing="0.3">{countdown || 'Trade'}</text>
                  <circle cx="200" cy="229" r="0.8" fill={isDark ? '#4a3a28' : '#8a7a60'} />

                  {/* Cart base shadow */}
                  <ellipse cx="200" cy="262" rx="60" ry="3" fill={isDark ? '#0a0806' : '#b0a890'} opacity="0.3" />
                </svg>
              </div>


              {(() => { return (<>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginBottom: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
                <span style={{ ...type.viewTitle }}>Market</span>
                {/* Ornamental divider */}
                <svg width="220" height="12" viewBox="0 0 220 12" style={{ marginTop: 10, opacity: isDark ? 0.4 : 0.3 }}>
                  {(() => { const c = isDark ? '#dcd8d0' : '#2a2620'; return (<>
                    <line x1="0" y1="6" x2="95" y2="6" stroke={c} strokeWidth="0.5" />
                    <polygon points="110,2 114,6 110,10 106,6" fill={isDark ? '#e8e4dc' : '#4a4640'} opacity="0.6" />
                    <line x1="125" y1="6" x2="220" y2="6" stroke={c} strokeWidth="0.5" />
                  </>)})()}
                </svg>
                {/* Nav buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <button
                    onClick={() => { setActiveTab('satchel'); setSelectedPlant(null) }}
                    className="transition-all hover:scale-105 active:scale-95"
                    style={{ ...chipButton(palette) }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2h8l2 4H6l2-4z"/><path d="M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6"/><path d="M9 6v2a3 3 0 006 0V6"/></svg>
                    Satchel
                  </button>
                  <button
                    onClick={() => { setActiveTab('catalog'); setIsRenderingCatalog(true); setSelectedPlant(null); setTimeout(() => setIsRenderingCatalog(false), 20) }}
                    className="transition-all hover:scale-105 active:scale-95"
                    style={{ ...chipButton(palette) }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                    Catalog
                  </button>
                </div>
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
              <div style={{ display: 'flex', gap: 72, justifyContent: 'center', flex: 1, alignItems: 'flex-start', paddingTop: 60, position: 'relative', zIndex: 2 }}>
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
                  const growthMins = TREE_TYPES[type]?.growthMinutes || 25
                  if (i >= 4) return null
                  const cardW = 160
                  const cardH = 270
                  const arcOffset = [18, 0, 0, 18][i] || 0
                  const arcRotate = [-7, -2.5, 2.5, 7][i] || 0

                  return (
                    <div key={`${type}-${i}`} className="seed-card-wrap" style={{ position: 'relative', width: cardW, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: arcOffset, rotate: `${arcRotate}deg`, ['--float-y' as string]: `${-5 - i * 1.2}px`, animation: `card-float ${5 + i * 0.6}s ease-in-out ${i * 0.4}s infinite` }}>
                      {/* Daily deal label */}
                      {isDailyDeal && (
                        <div style={{
                          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                          fontSize: 7, fontWeight: 400, color: '#dc2626', letterSpacing: '0.1em',
                          textTransform: 'uppercase', whiteSpace: 'nowrap', zIndex: 20,
                          background: isDark ? 'rgba(220,38,38,0.1)' : 'rgba(220,38,38,0.08)',
                          padding: '2px 8px', borderRadius: 4,
                          border: `1px solid ${isDark ? 'rgba(220,38,38,0.25)' : 'rgba(220,38,38,0.2)'}`,
                        }}>Daily Deal</div>
                      )}
                      {/* Seed card */}
                      <div
                        className={`seed-packet ${isCracking ? 'seed-cracking' : ''} ${isRevealed ? 'seed-revealed' : ''} ${isDailyDeal && !isRevealed ? 'daily-deal' : ''}`}
                        onClick={() => !isRevealed && revealCard(i)}
                        style={{
                          width: cardW, height: cardH, borderRadius: 12,
                          position: 'relative', overflow: 'hidden',
                          cursor: 'pointer',
                          ['--crack-dur' as string]: t.rarity === 'sacred' ? '3.5s' : t.rarity === 'true rare' ? '2.8s' : t.rarity === 'rare' ? '1.4s' : '1.1s',
                          boxShadow: isDailyDeal
                            ? (isDark ? '0 2px 16px rgba(220,38,38,0.25)' : '0 2px 16px rgba(220,38,38,0.15)')
                            : (isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.06)'),
                          border: isDailyDeal
                            ? `1.5px solid ${isDark ? 'rgba(220,38,38,0.4)' : 'rgba(220,38,38,0.35)'}`
                            : `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                        }}
                      >
                        {!isRevealed ? (
                          /* Unrevealed — neutral, no rarity hint */
                          <div
                            onClick={() => revealCard(i)}
                            style={{
                              width: '100%', height: '100%', borderRadius: 'inherit',
                              background: isDark
                                ? 'linear-gradient(180deg, #1a1816 0%, #14120f 50%, #100e0c 100%)'
                                : 'linear-gradient(180deg, #e8e2d8 0%, #ddd6c8 50%, #d4ccbc 100%)',
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
                              const seedCol = t.rarity === 'sacred' ? (isDark ? '#9a80c0' : '#7a60a0')
                                : t.rarity === 'true rare' ? (isDark ? '#8a7aaa' : '#6a5a8a')
                                : isDark ? '#8a7a6a' : '#6a5a4a'
                              const sproutCol = t.rarity === 'sacred' ? (isDark ? '#8a6ac0' : '#7050a0')
                                : t.rarity === 'true rare' ? (isDark ? '#7a6aaa' : '#5a4a8a')
                                : isDark ? '#6a8a4a' : '#5a7a3a'
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
                                fontSize: 8, fontWeight: 400, color: '#d97706',
                                opacity: isDark ? 0.4 : 0.35,
                              }}>%</div>
                            )}
                          </div>
                        ) : (
                          /* Revealed — plant on earthy ground */
                          <div
                            onClick={() => {
                              setSelectedPlant(type)
                              setPreviewStage(0)
                            }}
                            style={{
                              width: '100%', height: '100%', borderRadius: 'inherit',
                              background: isDark
                                ? 'linear-gradient(180deg, #1a1816 0%, #14120f 50%, #100e0c 100%)'
                                : 'linear-gradient(180deg, #e8e2d8 0%, #ddd6c8 50%, #d4ccbc 100%)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                              position: 'relative', overflow: 'hidden',
                            }}
                          >
                            {/* Rarity color fade-in */}
                            <div style={{
                              position: 'absolute', inset: 0, borderRadius: 'inherit',
                              background: isDark ? (RARITY_BG[t.rarity] || RARITY_BG.common) : (SHOP_BG[t.rarity] || SHOP_BG.common),
                              animation: revealEffect?.index === i
                                ? t.rarity === 'sacred'
                                  ? 'sacred-bg-ignite 2.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both'
                                  : t.rarity === 'true rare'
                                  ? 'rarity-color-cinematic 2s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both'
                                  : `rarity-color-in ${t.rarity === 'rare' ? '1s' : '0.6s'} cubic-bezier(0.22, 1, 0.36, 1) ${t.rarity === 'rare' ? '0.4s' : '0.2s'} both`
                                : undefined,
                              zIndex: 0,
                            }} />
                            {/* Subtle paper texture */}
                            <div style={{
                              position: 'absolute', inset: 0, borderRadius: 'inherit',
                              backgroundImage: `radial-gradient(circle at 20% 30%, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px), radial-gradient(circle at 70% 60%, ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'} 1px, transparent 1px), radial-gradient(circle at 40% 80%, ${isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.018)'} 1px, transparent 1px)`,
                              backgroundSize: '8px 8px, 12px 12px, 6px 6px',
                              zIndex: 1, pointerEvents: 'none',
                            }} />
                            {/* Sacred white flash */}
                            {revealEffect?.index === i && t.rarity === 'sacred' && (
                              <div style={{
                                position: 'absolute', inset: 0, borderRadius: 'inherit',
                                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(200,180,255,0.4) 40%, transparent 70%)',
                                animation: 'sacred-flash 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
                                zIndex: 1, pointerEvents: 'none',
                              }} />
                            )}
                            {/* True rare flash */}
                            {revealEffect?.index === i && t.rarity === 'true rare' && (
                              <div style={{
                                position: 'absolute', inset: 0, borderRadius: 'inherit',
                                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.6) 0%, rgba(167,139,250,0.2) 50%, transparent 70%)',
                                animation: 'sacred-flash 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
                                zIndex: 1, pointerEvents: 'none',
                              }} />
                            )}
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
                            {/* Tree name */}
                            <div style={{
                              position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)',
                              fontSize: t.rarity === 'sacred' ? 15 : t.rarity === 'true rare' ? 14 : 13,
                              fontWeight: t.rarity === 'sacred' || t.rarity === 'true rare' ? 500 : 400,
                              color: t.rarity === 'sacred' ? '#e0d0ff'
                                : t.rarity === 'true rare' ? (isDark ? '#fcd34d' : '#b45309')
                                : t.rarity === 'rare' ? (isDark ? '#93c5fd' : '#1d4ed8')
                                : t.rarity === 'uncommon' ? (isDark ? '#86efac' : '#15803d')
                                : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'),
                              fontFamily: 'Crimson Pro, serif',
                              letterSpacing: t.rarity === 'sacred' ? '0.12em' : t.rarity === 'true rare' ? '0.08em' : '0.02em',
                              textTransform: t.rarity === 'sacred' || t.rarity === 'true rare' ? 'uppercase' as const : 'none' as const,
                              animation: revealEffect?.index === i
                                ? `rarity-color-in ${t.rarity === 'sacred' ? '1.2s' : t.rarity === 'true rare' ? '1s' : '0.6s'} cubic-bezier(0.22, 1, 0.36, 1) ${t.rarity === 'sacred' ? '0.8s' : t.rarity === 'true rare' ? '0.6s' : '0.25s'} both`
                                : undefined,
                              zIndex: 5, whiteSpace: 'nowrap',
                              ...(t.rarity === 'sacred' ? {
                                textShadow: '0 0 8px rgba(180,140,255,0.6), 0 0 18px rgba(140,100,220,0.3)',
                              } : t.rarity === 'true rare' ? {
                                textShadow: isDark ? '0 0 6px rgba(252,211,77,0.4)' : '0 0 6px rgba(180,119,6,0.2)',
                              } : {}),
                            }}>
                              {t.name}
                            </div>
                            {/* Rarity label */}
                            <div style={{
                              position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)',
                              fontSize: 7, fontWeight: 400, color: t.rarity === 'sacred' ? '#d4b8ff' : rarityCol,
                              letterSpacing: t.rarity === 'sacred' ? '0.14em' : '0.08em', textTransform: 'uppercase',
                              animation: revealEffect?.index === i
                                ? `rarity-color-in ${t.rarity === 'sacred' ? '1.2s' : t.rarity === 'true rare' ? '1s' : '0.6s'} cubic-bezier(0.22, 1, 0.36, 1) ${t.rarity === 'sacred' ? '1s' : t.rarity === 'true rare' ? '0.7s' : '0.3s'} both`
                                : undefined,
                              zIndex: 5, whiteSpace: 'nowrap',
                              ...(t.rarity === 'sacred' ? {
                                textShadow: '0 0 6px rgba(180,140,255,0.8), 0 0 14px rgba(140,100,220,0.5)',
                              } : {}),
                            }}>
                              {t.rarity === 'sacred' ? '✦ ' : ''}{RARITY_LABEL[t.rarity]}{t.rarity === 'sacred' ? ' ✦' : ''}
                            </div>
                            {/* Sold out */}
                            {soldOut && (
                              <div style={{
                                position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
                                fontSize: 7, fontWeight: 400, color: textMuted, textTransform: 'uppercase',
                                background: isDark ? 'rgba(39,39,42,0.8)' : 'rgba(228,228,231,0.9)',
                                padding: '2px 6px', borderRadius: 3,
                                backdropFilter: 'blur(4px)', zIndex: 5,
                              }}>Sold out</div>
                            )}
                            {/* Discount badge - now on price tag */}
                            {discount > 0 && false && (
                              <div style={{
                                position: 'absolute', bottom: 36, right: 18,
                                fontSize: 8, fontWeight: 400, color: '#fff',
                                background: '#d97706', padding: '2px 5px', borderRadius: 3,
                                zIndex: 5,
                              }}>-{discount}%</div>
                            )}
                            {/* Plant — centered, base on ground */}
                            <div style={{
                              position: 'absolute', bottom: (() => { const sh = TREE_TYPES[type]?.shape || ''; return ['coral', 'whirlpool', 'lotus', 'cattail', 'mushroom'].includes(sh) ? '10%' : ['cactus', 'agave', 'sage'].includes(sh) ? '12%' : ['palm', 'papaya', 'bamboo', 'mangrove'].includes(sh) ? '14%' : '15%' })(), left: 0, right: 0,
                              display: 'flex', justifyContent: 'center',
                              zIndex: 2,
                            }}>
                              <div className={rarityPlantClass(t.rarity)} style={{
                                animation: revealEffect?.index === i
                                  ? `pop-${t.rarity === 'true rare' ? 'true-rare' : t.rarity} ${t.rarity === 'sacred' ? '2.2s' : t.rarity === 'true rare' ? '1.6s' : t.rarity === 'rare' ? '1s' : t.rarity === 'uncommon' ? '0.8s' : '0.6s'} cubic-bezier(0.22, 1, 0.36, 1) both`
                                  : undefined,
                                animationDelay: revealEffect?.index === i ? (t.rarity === 'sacred' ? '0.6s' : t.rarity === 'true rare' ? '0.4s' : '0.15s') : undefined,
                                position: 'relative',
                              }}>
                                <PlantIcon type={type} size={120} stage={3} hideGround />
                                {/* Ground blend */}
                                {(() => { const tc = getTerrainColors(type, isDark); return (
                                <div style={{
                                  position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
                                  width: '60%', height: 10, zIndex: 5,
                                  background: `linear-gradient(to top, ${tc.blendBase} 0%, transparent 100%)`,
                                  borderRadius: '50%',
                                }} />
                                )})()}
                              </div>
                            </div>
                            {/* Ground */}
                            {(() => { const tc = getTerrainColors(type, isDark); const gp = getGroundPath(type); return (
                            <svg viewBox="0 0 180 60" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '22%', zIndex: 3 }}>
                              <defs>
                                <linearGradient id={`ground-${i}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={tc.top} />
                                  <stop offset="40%" stopColor={tc.mid} />
                                  <stop offset="100%" stopColor={tc.bottom} />
                                </linearGradient>
                              </defs>
                              <path d={gp.fill} fill={`url(#ground-${i})`} />
                              <path d={gp.edge} fill="none" stroke={tc.edge} strokeWidth="0.6" opacity="0.3" />
                            </svg>
                            )})()}
                          </div>
                        )}
                        {/* Rarity color bleeding through crack */}
                        {isCracking && (
                          <div style={{
                            position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: 5,
                            background: isDark ? (RARITY_BG[t.rarity] || RARITY_BG.common) : (SHOP_BG[t.rarity] || SHOP_BG.common),
                            animation: `rarity-color-in ${t.rarity === 'sacred' ? '3s' : t.rarity === 'true rare' ? '2.4s' : t.rarity === 'rare' ? '1.2s' : '0.8s'} cubic-bezier(0.22, 1, 0.36, 1) ${t.rarity === 'sacred' ? '0.5s' : t.rarity === 'true rare' ? '0.4s' : '0.15s'} both`,
                          }} />
                        )}
                        {/* Crack overlay — fades out to reveal */}
                        {isCracking && (
                          <div style={{
                            position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: 10,
                            background: isDark
                              ? 'linear-gradient(180deg, #1a1816 0%, #14120f 50%, #100e0c 100%)'
                              : 'linear-gradient(180deg, #e8e2d8 0%, #ddd6c8 50%, #d4ccbc 100%)',
                            animation: `seed-crack-fade ${t.rarity === 'sacred' ? '3.5s' : t.rarity === 'true rare' ? '2.8s' : t.rarity === 'rare' ? '1.4s' : '1.1s'} cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                            willChange: 'opacity, transform',
                          }} />
                        )}
                      </div>
                      {/* Hanging parchment price tag */}
                      {(() => {
                        const tagRot = [(-3), 2, (-1.5), 3, (-2.5)][i % 5]
                        const tagOffX = [(-6), 8, 3, (-9), 5][i % 5]
                        const stringH = [26, 34, 18, 40, 22][i % 5]
                        return (
                      <div onClick={(e) => { e.stopPropagation(); if (isRevealed) { setSelectedPlant(type); setPreviewStage(0) } }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', visibility: isRevealed ? 'visible' : 'hidden', marginTop: -2, marginLeft: tagOffX, transform: `rotate(${-arcRotate}deg)`, transformOrigin: 'top center', cursor: isRevealed ? 'pointer' : 'default' }}>
                        <svg width="4" height={stringH} style={{ overflow: 'visible' }}>
                          <line x1="2" y1="0" x2="2" y2={stringH} stroke={isDark ? '#8b7355' : '#6b5335'} strokeWidth="0.8" strokeLinecap="round" />
                          <line x1="2" y1="0" x2="2" y2={stringH} stroke={isDark ? 'rgba(160,130,90,0.25)' : 'rgba(120,90,50,0.2)'} strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                        <div style={{
                          position: 'relative',
                          transform: `rotate(${tagRot}deg)`,
                          background: isDark
                            ? 'linear-gradient(145deg, #2a2418 0%, #1e1a14 50%, #252018 100%)'
                            : 'linear-gradient(145deg, #f2e8d4 0%, #e8dcc4 50%, #f0e4ce 100%)',
                          border: `1px solid ${isDark ? 'rgba(180,160,130,0.15)' : 'rgba(140,120,80,0.2)'}`,
                          borderRadius: 3,
                          padding: '5px 12px 6px',
                          minWidth: 54,
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
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, marginTop: 0 }}>
                            {discount > 0 ? (<>
                              <span style={{ fontSize: 9, fontWeight: 400, color: isDark ? '#8a7a60' : '#8a7a60', fontFamily: font, textDecoration: 'line-through', opacity: 0.7 }}>{(TREE_TYPES[type]?.cost || 0).toLocaleString()}</span>
                              <span style={{ fontSize: 13, fontWeight: 400, color: '#dc2626', fontFamily: font, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{Math.round((TREE_TYPES[type]?.cost || 0) * (1 - discount / 100)).toLocaleString()}<PulpIcon size={11} /></span>
                            </>) : (
                              <span style={{ fontSize: 13, fontWeight: 400, color: isDark ? '#d4c4a0' : '#4a3a20', fontFamily: font, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{(TREE_TYPES[type]?.cost || 0).toLocaleString()}<PulpIcon size={11} /></span>
                            )}
                          </div>
                        </div>
                      </div>
                        )
                      })()}

                      {/* Pop effects on reveal */}
                      {revealEffect?.index === i && (() => {
                        const r = t.rarity
                        const particleCount = r === 'sacred' ? 24 : r === 'true rare' ? 16 : r === 'rare' ? 8 : r === 'uncommon' ? 5 : 3
                        const dur = r === 'sacred' ? 4 : r === 'true rare' ? 3 : r === 'rare' ? 1.2 : r === 'uncommon' ? 0.9 : 0.7
                        const col = r === 'sacred' ? '#c4b5fd' : r === 'true rare' ? '#a78bfa' : r === 'rare' ? '#60a5fa' : r === 'uncommon' ? '#4ade80' : '#d97706'
                        const baseDelay = r === 'sacred' ? 0.8 : r === 'true rare' ? 0.5 : 0.2
                        return (
                          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, overflow: 'visible' }}>
                            {/* Expanding ring */}
                            <div style={{
                              position: 'absolute', top: '62%', left: '50%', transform: 'translate(-50%, -50%)',
                              width: r === 'sacred' ? 240 : r === 'true rare' ? 200 : r === 'rare' ? 120 : 80,
                              height: r === 'sacred' ? 240 : r === 'true rare' ? 200 : r === 'rare' ? 120 : 80,
                              borderRadius: '50%',
                              border: `${r === 'sacred' ? 2.5 : 2}px solid ${col}`,
                              opacity: 0,
                              animation: `pop-ring ${dur * 0.6}s cubic-bezier(0.22, 1, 0.36, 1) ${baseDelay}s forwards`,
                            }} />
                            {/* Particles — staggered in waves for sacred/true rare */}
                            {Array.from({ length: particleCount }).map((_, pi) => {
                              const angle = (pi / particleCount) * Math.PI * 2 + (pi * 0.3)
                              const wave = r === 'sacred' ? Math.floor(pi / 8) : r === 'true rare' ? Math.floor(pi / 8) : 0
                              const dist1 = 15 + Math.sin(pi * 2.1) * 10 + wave * 10
                              const dist2 = 50 + Math.cos(pi * 1.7) * 30 + (r === 'sacred' ? 60 + wave * 20 : r === 'true rare' ? 40 + wave * 15 : 0)
                              const x1 = Math.cos(angle) * dist1
                              const y1 = Math.sin(angle) * dist1
                              const x2 = Math.cos(angle) * dist2
                              const y2 = Math.sin(angle) * dist2
                              const size = r === 'sacred' ? 3 + (pi % 3) : r === 'true rare' ? 2.5 + (pi % 3) * 0.8 : r === 'rare' ? 3 : 2.5
                              const delay = baseDelay + wave * 0.6 + pi * 0.04
                              return (
                                <div key={pi} style={{
                                  position: 'absolute', top: '55%', left: '50%',
                                  width: size, height: size, borderRadius: '50%',
                                  background: pi % 4 === 0 ? '#fff' : pi % 4 === 1 ? col : pi % 4 === 2 ? (r === 'sacred' ? '#e0d0ff' : col) : col,
                                  boxShadow: `0 0 ${size * 3}px ${col}`,
                                  opacity: 0,
                                  ['--pp-x1' as string]: `${x1}px`, ['--pp-y1' as string]: `${y1}px`,
                                  ['--pp-x2' as string]: `${x2}px`, ['--pp-y2' as string]: `${y2}px`,
                                  animation: `pop-particle ${dur * 0.7}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s forwards`,
                                }} />
                              )
                            })}
                            {/* True rare — aurora ring + second wave */}
                            {r === 'true rare' && (<>
                              <div style={{
                                position: 'absolute', top: '62%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: 180, height: 180, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)',
                                animation: `sacred-nova 2.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards`,
                                opacity: 0,
                              }} />
                              <div style={{
                                position: 'absolute', top: '62%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: 260, height: 260, borderRadius: '50%',
                                border: '1px solid rgba(167,139,250,0.2)',
                                opacity: 0,
                                animation: `pop-ring 2.2s cubic-bezier(0.22, 1, 0.36, 1) 1s forwards`,
                              }} />
                            </>)}
                            {/* Sacred galaxy explosion */}
                            {r === 'sacred' && (<>
                              {/* Initial shockwave */}
                              <div style={{
                                position: 'absolute', top: '62%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: 160, height: 160, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.5)',
                                opacity: 0,
                                animation: `pop-ring 1s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards`,
                              }} />
                              {/* Nova burst — first wave */}
                              <div style={{
                                position: 'absolute', top: '62%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: 350, height: 350, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(196,181,253,0.2) 30%, rgba(139,92,246,0.1) 50%, transparent 70%)',
                                animation: `sacred-nova 3s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards`,
                                opacity: 0,
                              }} />
                              {/* Nebula — rotating conic */}
                              <div style={{
                                position: 'absolute', top: '62%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: 300, height: 300, borderRadius: '50%',
                                background: `conic-gradient(from 0deg, rgba(196,181,253,0.2), rgba(139,92,246,0.08), rgba(99,102,241,0.15), rgba(196,181,253,0.05), rgba(167,139,250,0.2), rgba(255,255,255,0.1), rgba(196,181,253,0.15))`,
                                animation: `sacred-shimmer 4s ease-out 0.5s forwards`,
                                filter: 'blur(10px)',
                                opacity: 0,
                              }} />
                              {/* Second nova — delayed */}
                              <div style={{
                                position: 'absolute', top: '62%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: 250, height: 250, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(196,181,253,0.3) 0%, rgba(139,92,246,0.1) 40%, transparent 65%)',
                                animation: `sacred-nova 2.5s cubic-bezier(0.22, 1, 0.36, 1) 1.2s forwards`,
                                opacity: 0,
                              }} />
                              {/* Trailing stars — three waves */}
                              {Array.from({ length: 18 }).map((_, si) => {
                                const a = (si / 18) * Math.PI * 2
                                const wave = Math.floor(si / 6)
                                const r1 = 10 + wave * 8
                                const r2 = 40 + si * 3 + wave * 15
                                const r3 = 80 + si * 5 + wave * 20
                                const starSize = 2 + (si % 3)
                                return (
                                  <div key={`s${si}`} style={{
                                    position: 'absolute', top: '55%', left: '50%',
                                    width: starSize, height: starSize,
                                    background: si % 3 === 0 ? '#fff' : si % 3 === 1 ? '#e0d0ff' : '#c4b5fd',
                                    borderRadius: '50%',
                                    boxShadow: `0 0 ${starSize * 2}px rgba(196,181,253,0.8), 0 0 ${starSize * 4}px rgba(139,92,246,0.4)`,
                                    opacity: 0,
                                    ['--ss-x1' as string]: `${Math.cos(a) * r1}px`, ['--ss-y1' as string]: `${Math.sin(a) * r1}px`,
                                    ['--ss-x2' as string]: `${Math.cos(a) * r2}px`, ['--ss-y2' as string]: `${Math.sin(a) * r2}px`,
                                    ['--ss-x3' as string]: `${Math.cos(a) * r3}px`, ['--ss-y3' as string]: `${Math.sin(a) * r3}px`,
                                    animation: `sacred-star ${2.5 + si * 0.08}s cubic-bezier(0.22, 1, 0.36, 1) ${0.2 + wave * 0.8 + (si % 6) * 0.08}s forwards`,
                                  }} />
                                )
                              })}
                              {/* Outer rings — staggered */}
                              <div style={{
                                position: 'absolute', top: '62%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: 280, height: 280, borderRadius: '50%',
                                border: '1px solid rgba(196,181,253,0.25)',
                                opacity: 0,
                                animation: `pop-ring 2s cubic-bezier(0.22, 1, 0.36, 1) 0.8s forwards`,
                              }} />
                              <div style={{
                                position: 'absolute', top: '62%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: 340, height: 340, borderRadius: '50%',
                                border: '0.5px solid rgba(196,181,253,0.15)',
                                opacity: 0,
                                animation: `pop-ring 2.5s cubic-bezier(0.22, 1, 0.36, 1) 1.5s forwards`,
                              }} />
                            </>)}
                          </div>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
                )
              })()}


              </>)})()}
            </div>
          )}

          {selectedPlant && previewInfo && (() => {
            const stock = shopStock[selectedPlant!] || 0
            const rarityCol = SHOP_RARITY_COLOR[previewInfo.rarity] || '#8a7a6a'
            const cat = previewInfo.category || 'none'
            const desc = PLANT_DESCRIPTIONS[selectedPlant!] || `A ${RARITY_LABEL[previewInfo.rarity].toLowerCase()} specimen. Produces ${previewInfo.sapYield || 2} sap when mature.`
            const seedCost = TREE_TYPES[selectedPlant!]?.cost || 0
            const canAfford = seedCost <= sap

            return (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
              background: isDark ? 'rgba(9,9,11,0.97)' : 'rgba(245,243,239,0.97)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              borderRadius: '16px 16px 0 0',
              boxShadow: isDark ? '0 -8px 32px rgba(0,0,0,0.5)' : '0 -8px 32px rgba(0,0,0,0.1)',
              animation: 'slide-up-panel 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}>
              <style>{`@keyframes slide-up-panel { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
                <div style={{ width: 32, height: 3, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'stretch', padding: '8px 24px 20px', gap: 24 }}>
                {/* Left — compact plant preview */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 140, height: 170, borderRadius: 12, overflow: 'hidden', position: 'relative',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    background: isDark
                      ? (SHOP_BG_DARK[previewInfo.rarity] || SHOP_BG_DARK.common)
                      : (SHOP_BG[previewInfo.rarity] || SHOP_BG.common),
                  }}>
                    <RarityScene rarity={previewInfo.rarity} isDark={isDark} />
                    <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 20px ${isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 12, pointerEvents: 'none', zIndex: 1 }} />
                    <Sparkles rarity={previewInfo.rarity} count={4} />
                    <div className={previewStage >= 4 ? rarityPlantClass(previewInfo.rarity) : ''} style={{ position: 'relative', marginBottom: 10, zIndex: 2 }}>
                      {previewStage === 0
                        ? <PlantIcon type={selectedPlant!} size={90} isSeed />
                        : <PlantIcon type={selectedPlant!} size={90} stage={previewStage - 1} />
                      }
                    </div>
                  </div>
                  {/* Stage nav */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => setPreviewStage(s => Math.max(0, s - 1))}
                      disabled={previewStage === 0}
                      style={{
                        background: 'none', border: 'none', cursor: previewStage === 0 ? 'default' : 'pointer', padding: 2,
                        color: previewStage === 0 ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <span style={{ fontSize: 9, fontFamily: font, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', minWidth: 48, textAlign: 'center' }}>
                      {STAGE_NAMES[previewStage]}
                    </span>
                    <button
                      onClick={() => setPreviewStage(s => Math.min(STAGE_NAMES.length - 1, s + 1))}
                      disabled={previewStage === STAGE_NAMES.length - 1}
                      style={{
                        background: 'none', border: 'none', cursor: previewStage === STAGE_NAMES.length - 1 ? 'default' : 'pointer', padding: 2,
                        color: previewStage === STAGE_NAMES.length - 1 ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                </div>

                {/* Right — info + buy */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 400, color: rarityCol, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font, marginBottom: 4 }}>
                    {RARITY_LABEL[previewInfo.rarity]}
                    {cat !== 'none' && <span style={{ color: CATEGORY_COLOR[cat], marginLeft: 8 }}>{CATEGORY_LABEL[cat]}</span>}
                  </span>
                  <div style={{ fontSize: 20, fontWeight: 400, color: textPrimary, fontFamily: font, letterSpacing: '-0.01em', marginBottom: 6 }}>
                    {previewInfo.name}
                  </div>
                  <p style={{ fontSize: 11, color: textSecondary, fontFamily: font, lineHeight: 1.5, marginBottom: 14, maxWidth: 320 }}>
                    {desc}
                  </p>
                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 8, fontWeight: 400, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font, marginBottom: 1 }}>Sap</div>
                      <div style={{ fontSize: 13, fontWeight: 400, color: textPrimary, fontFamily: font, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <PulpIcon size={10} />{previewInfo.sapYield || 2}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8, fontWeight: 400, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font, marginBottom: 1 }}>Drop</div>
                      <div style={{ fontSize: 13, fontWeight: 400, color: textPrimary, fontFamily: font }}>{getDropChance(previewInfo.weight)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8, fontWeight: 400, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font, marginBottom: 1 }}>Shape</div>
                      <div style={{ fontSize: 13, fontWeight: 400, color: textPrimary, fontFamily: font, textTransform: 'capitalize' }}>{previewInfo.shape}</div>
                    </div>
                  </div>
                  {/* Buy / Sold out */}
                  {stock <= 0 ? (
                    <div style={{ fontSize: 12, fontWeight: 400, fontFamily: font, color: isDark ? '#71717a' : '#a1a1aa' }}>Sold Out</div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => buySeed(selectedPlant!)}
                        disabled={!canAfford}
                        className="transition-all hover:brightness-110"
                        style={{
                          fontFamily: font, cursor: canAfford ? 'pointer' : 'not-allowed', border: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: canAfford ? '#d97706' : (isDark ? '#3f3f46' : '#d4d4d8'), color: canAfford ? '#fff' : (isDark ? '#71717a' : '#a1a1aa'),
                          padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 400,
                          opacity: canAfford ? 1 : 0.7,
                        }}
                      >
                        Buy · {seedCost.toLocaleString()} <PulpIcon size={11} />
                      </button>
                      <span style={{ fontSize: 10, fontWeight: 400, color: textMuted, fontFamily: font }}>×{stock} left</span>
                    </div>
                  )}
                </div>
                {/* Close button */}
                <button
                  onClick={() => setSelectedPlant(null)}
                  style={{
                    position: 'absolute', top: 12, right: 16,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: textMuted, padding: 4,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          )})()}

          {/* SATCHEL */}
          {activeTab === 'satchel' && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setActiveTab('shop')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, fontFamily: font, fontSize: 12, fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Back
                </button>
                <span className={`text-[10px] font-normal uppercase tracking-[0.12em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Satchel</span>
                <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{inventory.length}/{MAX_SEEDS}</span>
              </div>
              {inventory.length === 0 ? (
                <div className={`text-center py-16 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  <div className="text-[32px] mb-3 opacity-40">🌱</div>
                  <div className="text-[14px] font-normal">No seeds yet</div>
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
                          onClick={() => { setSelectedPlant(type); setPreviewStage(0) }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                            border: `1px solid ${t.rarity === 'common' || t.rarity === 'uncommon' ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)') : `${rc}30`}`,
                            backgroundColor: t.rarity === 'common' || t.rarity === 'uncommon' ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : (isDark ? `${rc}10` : `${rc}08`),
                            transition: 'all 0.15s', fontFamily: font, textAlign: 'left',
                            boxShadow: t.rarity === 'common' || t.rarity === 'uncommon' ? `inset 0 0 0 1px ${rc}10` : `inset 0 0 0 1px ${rc}15, 0 0 12px ${rc}08`,
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
                            <div style={{ fontSize: 11, fontWeight: 400, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                            <div style={{ fontSize: 8, fontWeight: 400, color: rc, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>{RARITY_LABEL[t.rarity]}</div>
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
            <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.5)' }} onMouseDown={() => setActiveTab('shop')}>
              <div onMouseDown={e => e.stopPropagation()} style={{ width: '90%', maxWidth: 720, maxHeight: '80vh', overflowY: 'auto', borderRadius: 20, background: isDark ? '#141210' : '#f5f3ef', boxShadow: '0 32px 80px -12px rgba(0,0,0,0.5)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: font, color: textPrimary, letterSpacing: '0.06em' }}>Catalog</span>
                <button
                  onClick={() => setActiveTab('shop')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, fontFamily: font, fontSize: 12, fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
              {isRenderingCatalog ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', opacity: 0.6 }}>
                  <span style={{ fontSize: 24, marginBottom: 12 }}>📖</span>
                  <span style={{ fontSize: 13, fontWeight: 400, color: textMuted, fontFamily: font }}>Opening catalog...</span>
                </div>
              ) : (
                RARITY_ORDER.map(rarity => {
                  const plants = Object.keys(TREE_TYPES).filter(t => TREE_TYPES[t].rarity === rarity && t !== 'spoiled')
                  if (plants.length === 0) return null
                  return (
                  <div key={rarity} style={{ marginBottom: 44 }}>
                    {(() => {
                      const owned = plants.filter(t => inventory.includes(t) || t === 'tangerine').length
                      const total = plants.length
                      const pct = Math.round((owned / total) * 100)
                      const rc = RARITY_COLOR[rarity]
                      const complete = owned === total
                      return (
                    <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${complete ? `${rc}30` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            backgroundColor: rc,
                            boxShadow: rarity === 'sacred'
                              ? `0 0 6px ${rc}, 0 0 14px ${rc}80, 0 0 24px ${rc}40`
                              : (complete ? `0 0 8px ${rc}60` : 'none'),
                            ...(rarity === 'sacred' ? { animation: 'sacred-dot-pulse 2.5s ease-in-out infinite' } : {}),
                          }} />
                          <span style={{ fontSize: 11, fontWeight: 400, color: textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{RARITY_LABEL[rarity]}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 400, color: complete ? rc : textMuted, fontFamily: font }}>{owned}<span style={{ opacity: 0.5 }}>/{total}</span>{complete && <span style={{ marginLeft: 6, fontSize: 9, letterSpacing: '0.06em' }}>COMPLETE</span>}</span>
                      </div>
                      <div style={{ height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: complete ? rc : `linear-gradient(90deg, ${rc}90, ${rc}50)`, borderRadius: 3, transition: 'width 0.4s ease', boxShadow: pct > 0 ? `0 0 8px ${rc}30` : 'none' }} />
                      </div>
                    </div>
                      )
                    })()}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px 16px' }}>
                      {plants.map(type => {
                        const t = TREE_TYPES[type]
                        const owned = inventory.includes(type) || type === 'tangerine'
                        return (
                          <button
                            key={type}
                            className={owned ? rarityCardClass(t.rarity) : ''}
                            onClick={owned ? () => { setSelectedPlant(type); setPreviewStage(3) } : undefined}
                            style={{
                              borderRadius: 10, border: `1px solid ${owned ? cardBorder : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, overflow: 'hidden',
                              backgroundColor: owned ? cardBg : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', cursor: owned ? 'pointer' : 'default', textAlign: 'left',
                              transition: 'all 0.15s', position: 'relative', fontFamily: font,
                            }}
                          >
                            <div style={{
                              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                              width: '100%', position: 'relative', aspectRatio: '1',
                              background: owned ? (RARITY_BG[t.rarity] || RARITY_BG.common) : isDark ? '#0f0f0f' : '#e8e8e8',
                            }}>
                              {owned && <RarityScene rarity={t.rarity} isDark={isDark} />}
                              <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 12px ${isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.06)'}`, pointerEvents: 'none', zIndex: 4 }} />
                              {owned && <Sparkles rarity={t.rarity} count={3} />}
                              <div className={owned ? rarityPlantClass(t.rarity) : ''} style={{ position: 'absolute', left: '50%', bottom: '7%', transform: 'translateX(-50%)', zIndex: 2, filter: owned ? 'none' : `brightness(0) opacity(${isDark ? 0.35 : 0.25})`, }}>
                                <PlantIcon type={type} size={120} stage={3} hideGround />
                              </div>
                              {owned && (
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
                              )}
                              {owned && (
                              <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 7, fontWeight: 400, color: RARITY_COLOR[t.rarity], letterSpacing: '0.04em', background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', padding: '1px 4px', borderRadius: 3, backdropFilter: 'blur(4px)', zIndex: 2 }}>
                                {getDropChance(t.weight)}
                              </div>
                              )}
                              {owned && (type === 'tangerine' ? (
                                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 400, color: '#d97706', letterSpacing: '0.06em', background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)', zIndex: 2, textTransform: 'uppercase' }}>
                                  Default
                                </div>
                              ) : (
                                <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', backgroundColor: isDark ? 'rgba(6,78,59,0.8)' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', zIndex: 2 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#34d399" : "#059669"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              ))}
                            </div>
                            <div style={{ padding: '6px 8px', borderTop: `1px solid ${owned ? dividerColor : 'transparent'}` }}>
                              <div style={{ fontSize: 11, fontWeight: 400, color: owned ? textPrimary : textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: owned ? 1 : 0.4 }}>{owned ? t.name : '???'}</div>
                              <div style={{ marginTop: 2 }}>
                                <span style={{ fontSize: 8, fontWeight: 400, color: owned ? RARITY_COLOR[t.rarity] : textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: owned ? 1 : 0.4 }}>{RARITY_LABEL[t.rarity]}</span>
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
            </div>
          )}

        </div>

        {/* Admin refresh button */}
        {isAdmin && activeTab === 'shop' && !selectedPlant && (
          <button
            onClick={forceRefresh}
            style={{
              position: 'absolute', bottom: 16, left: 16,
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
              <div style={{ fontSize: 15, fontWeight: 400, color: textPrimary, marginBottom: 6 }}>Satchel Full</div>
              <div style={{ fontSize: 12, color: textSecondary, lineHeight: 1.5 }}>
                You have {MAX_SEEDS}/{MAX_SEEDS} seeds. Plant or discard some before buying more.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setSatchelFullPopup(false); setActiveTab('satchel') }}
                  className="px-4 py-1.5 rounded-lg text-[12px] font-normal transition-all"
                  style={{ background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Open Satchel
                </button>
                <button
                  onClick={() => setSatchelFullPopup(false)}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-normal transition-all ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'}`}
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
