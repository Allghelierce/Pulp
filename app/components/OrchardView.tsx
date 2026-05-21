"use client"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES, getLevel } from "@/app/constants"
const ASCENSION_TIERS = [
  { name: 'Budding', sapMultiplier: 1.5 },
  { name: 'Flourishing', sapMultiplier: 2.0 },
  { name: 'Mythic', sapMultiplier: 3.0 },
] as const
const ASCENSION_COSTS: Record<string, { sap: number[]; sacrifices: number[] }> = {
  common: { sap: [50, 120, 300], sacrifices: [3, 5, 8] },
  uncommon: { sap: [80, 200, 500], sacrifices: [3, 4, 6] },
  rare: { sap: [150, 400, 900], sacrifices: [2, 3, 5] },
  'true rare': { sap: [300, 700, 1500], sacrifices: [2, 3, 4] },
  sacred: { sap: [500, 1200, 2500], sacrifices: [1, 2, 3] },
}
import { PlantIcon } from "./PlantIcon"
import { CachedPlantIcon } from "./CachedPlantIcon"
import { SummerTerrain } from "./SummerTerrain"
import { useTerrainCache } from "@/app/hooks/useTerrainCache"
import { PulpIcon, GemIcon, LeafIcon } from '@/app/components/CurrencyIcons'
import type { NoteData } from "@/app/types"
import * as db from "@/lib/db"
import { toPng } from "html-to-image"

interface OrchardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  sap: number
  gems?: number
  xp: number
  grove: any[]
  inventory: string[]
  setSap: (v: number | ((p: number) => number)) => void
  setGems?: (v: number | ((p: number) => number)) => void
  setInventory: (v: string[] | ((p: string[]) => string[])) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
  notes: NoteData[]
  userId?: string
  activeTabId?: string | null
  orchardTimeMode?: "theme" | "realtime"
  onOpenLeaderboard?: () => void
  onOpenShop?: () => void
  onOpenSatchel?: () => void
  onOpenSettings?: () => void
  goalStreak?: number
  quotaTier?: 'monthly' | 'weekly' | 'daily'
  reduceMotion?: boolean
}

type RGB = [number, number, number]
interface ParticleColors { tail: RGB; head: RGB }
interface Particle { x1:number; y1:number; x2:number; y2:number; cpx:number; cpy:number; toEl:HTMLElement|null; colors:ParticleColors; duration:number; start:number|null; onArrive:(() => void)|null }

const _particles: Particle[] = []
let _rafId: number|null = null, _canvas: HTMLCanvasElement|null = null, _ctx: CanvasRenderingContext2D|null = null

const SAP_COLOR: ParticleColors = { tail:[180,140,40], head:[217,119,6] }

function _initCanvas(): boolean {
  const el = document.getElementById('flyCanvas') as HTMLCanvasElement|null
  if (!el) { _ctx = null; _canvas = null; return false }
  if (_canvas === el && _ctx) return true
  _canvas = el
  _ctx = _canvas.getContext('2d')
  _canvas.width = window.innerWidth; _canvas.height = window.innerHeight
  window.addEventListener('resize', () => { if (_canvas) { _canvas.width = window.innerWidth; _canvas.height = window.innerHeight } })
  return !!_ctx
}

const _easeInOutCubic = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2

function _bezierPoint(x1:number,y1:number,cpx:number,cpy:number,x2:number,y2:number,t:number) {
  const mt = 1-t
  return { x: mt*mt*x1 + 2*mt*t*cpx + t*t*x2, y: mt*mt*y1 + 2*mt*t*cpy + t*t*y2 }
}

function _lerpColor(a:RGB, b:RGB, t:number): RGB {
  return [Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t)]
}

function _drawDrop(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, alpha: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(size / 12, size / 12)
  ctx.beginPath()
  ctx.moveTo(0, -6)
  ctx.quadraticCurveTo(0, -6, -3.6, 0.6)
  ctx.bezierCurveTo(-5.1, 3.3, -3.6, 6, 0, 6)
  ctx.bezierCurveTo(3.6, 6, 5.1, 3.3, 3.6, 0.6)
  ctx.quadraticCurveTo(0, -6, 0, -6)
  ctx.closePath()
  const g = ctx.createLinearGradient(0, -6, 0, 6)
  g.addColorStop(0, `rgba(245,158,11,${alpha})`)
  g.addColorStop(0.5, `rgba(217,119,6,${alpha})`)
  g.addColorStop(1, `rgba(180,83,9,${alpha})`)
  ctx.fillStyle = g; ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-1.5, 0, 1.2, 2, -0.25, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255,255,255,${0.2 * alpha})`; ctx.fill()
  ctx.restore()
}

function _loop(timestamp: number): void {
  if (!_ctx || !_canvas) return
  _ctx.clearRect(0,0,_canvas.width,_canvas.height)
  for (let i = _particles.length-1; i >= 0; i--) {
    const p = _particles[i]
    if (!p.start) p.start = timestamp
    const raw = Math.min((timestamp-p.start)/p.duration, 1)
    const t = _easeInOutCubic(raw)
    const fadeOut = raw < 0.85 ? 1 : (1-raw)/0.15
    for (let s = 0; s <= 12; s++) {
      const pt = _bezierPoint(p.x1,p.y1,p.cpx,p.cpy,p.x2,p.y2, Math.max(0, t-0.25*(1-s/12)))
      const frac = s/12
      _drawDrop(_ctx, pt.x, pt.y, 2 + frac * 3, frac * frac * 0.25 * fadeOut)
    }
    const head = _bezierPoint(p.x1,p.y1,p.cpx,p.cpy,p.x2,p.y2,t)
    _drawDrop(_ctx, head.x, head.y, 7, 0.9 * fadeOut)
    if (raw >= 1) {
      _particles.splice(i,1)
      if (p.onArrive) p.onArrive()
    }
  }
  if (_particles.length > 0) _rafId = requestAnimationFrame(_loop)
  else { _rafId = null; _ctx.clearRect(0,0,_canvas.width,_canvas.height) }
}

function flyParticle(x1:number, y1:number, toEl:HTMLElement|null, colors:ParticleColors, onArrive?:() => void): void {
  if (!_initCanvas() || !toEl) return
  const r = toEl.getBoundingClientRect()
  const x2 = r.left+r.width/2, y2 = r.top+r.height/2
  const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy)||1
  const arc = len*(0.15+Math.random()*0.35)*(Math.random()<0.5?1:-1)
  const ms = 0.35+Math.random()*0.3
  const cpx = (x1+dx*ms)-(dy/len)*arc, cpy = (y1+dy*ms)+(dx/len)*arc
  _particles.push({ x1,y1,x2,y2,cpx,cpy,toEl,colors, duration:600+Math.random()*300, start:null, onArrive:onArrive??null })
  if (!_rafId) _rafId = requestAnimationFrame(_loop)
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'sacred']
const RARITY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  common: { label: 'Common', color: '#8a8a8f', bg: 'rgba(138,138,143,0.08)', border: 'rgba(138,138,143,0.2)' },
  uncommon: { label: 'Uncommon', color: '#6b9a6b', bg: 'rgba(107,154,107,0.1)', border: 'rgba(107,154,107,0.25)' },
  rare: { label: 'Rare', color: '#6888a8', bg: 'rgba(104,136,168,0.12)', border: 'rgba(104,136,168,0.3)' },
  'true rare': { label: 'True Rare', color: '#4d8cff', bg: 'rgba(77,140,255,0.12)', border: 'rgba(77,140,255,0.3)' },
  sacred: { label: 'Sacred', color: '#c4a6ff', bg: 'rgba(196,166,255,0.12)', border: 'rgba(196,166,255,0.3)' },
}

function seededRng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

const GRID_COLS = 5
const GRID_SLOTS_PER_COL = 2
const GRID_TOTAL_SLOTS = GRID_COLS * GRID_SLOTS_PER_COL
const GRID_ROWS = 4
const GRID_COL_START = 17
const GRID_COL_END = 83
const GRID_ROW_START = 47
const GRID_ROW_END = 85
const GRID_TILL_OFFSET = 2.5

function gridSlotPos(slotIndex: number): { x: number; y: number; col: number; side: number; row: number } {
  const slot = slotIndex % GRID_TOTAL_SLOTS
  const row = Math.floor(slotIndex / GRID_TOTAL_SLOTS)
  const col = Math.floor(slot / GRID_SLOTS_PER_COL)
  const side = slot % GRID_SLOTS_PER_COL
  const rowSpacing = GRID_ROWS > 1 ? (GRID_ROW_END - GRID_ROW_START) / (GRID_ROWS - 1) : 0
  const y = (GRID_ROWS as number) === 1 ? 65 : GRID_ROW_START + row * rowSpacing
  const depthT = (y - GRID_ROW_START) / Math.max(1, GRID_ROW_END - GRID_ROW_START)
  const pinch = (1 - depthT) * 10 - depthT * 2
  const trapLeft = GRID_COL_START + pinch
  const trapRight = GRID_COL_END - pinch
  const tillX = trapLeft + col * ((trapRight - trapLeft) / (GRID_COLS - 1))
  const midCol = (GRID_COLS - 1) / 2
  const inwardShift = col === midCol ? 0 : (col < midCol ? 0.5 : -0.5)
  const x = tillX + (side === 0 ? -GRID_TILL_OFFSET : GRID_TILL_OFFSET) + inwardShift
  return { x: Math.max(4, Math.min(96, x)), y: Math.max(42, Math.min(94, y)), col, side, row }
}

function getTillX(col: number, y: number): number {
  const depthT = (y - GRID_ROW_START) / Math.max(1, GRID_ROW_END - GRID_ROW_START)
  const pinch = (1 - depthT) * 10 - depthT * 2
  const trapLeft = GRID_COL_START + pinch
  const trapRight = GRID_COL_END - pinch
  return trapLeft + col * ((trapRight - trapLeft) / (GRID_COLS - 1))
}

const ALL_SLOTS = Array.from({ length: 40 }, (_, i) => ({ ...gridSlotPos(i), slotIndex: i }))

function orchardPlacement(trees: any[]): { x: number; y: number; tree: any; col: number; slotIndex: number }[] {
  if (trees.length === 0) return []
  return trees.map((tree, i) => {
    const slot = ALL_SLOTS[i]
    return { x: slot.x, y: slot.y, tree, col: slot.col, slotIndex: slot.slotIndex }
  }).sort((a, b) => a.y - b.y)
}

function getRarityPlantClass(type: string): string {
  const rarity = TREE_TYPES[type]?.rarity
  switch (rarity) {
    case 'uncommon': return 'rarity-uncommon'
    case 'rare': return 'rarity-rare'
    case 'sacred': return 'rarity-premium'
    default: return ''
  }
}

const PLOT_COST = [0, 5, 12]

function getSapYield(tree: any): number {
  const info = TREE_TYPES[tree.type]
  if (!info) return 1
  const base = info.sapYield || Math.max(1, Math.floor(info.cost * 0.3))
  const stageBonus = tree.stage >= 4 ? 1.5 : tree.stage >= 3 ? 1.2 : tree.stage >= 2 ? 1 : 0.5
  const ascensionMultiplier = tree.ascension ? ASCENSION_TIERS[tree.ascension - 1]?.sapMultiplier || 1 : 1
  return Math.max(1, Math.round(base * stageBonus * ascensionMultiplier))
}

// Time-of-day phases: night(0-5), dawn(5-7), morning(7-10), day(10-16), dusk(16-19), night(19-24)
function getTimePhase(hourOverride?: number): { phase: string; t: number; hour: number } {
  const hour = hourOverride ?? (new Date().getHours() + new Date().getMinutes() / 60)
  if (hour < 4) return { phase: 'night', t: 0, hour }
  if (hour < 6) return { phase: 'night', t: (hour - 4) / 2, hour }
  if (hour < 8) return { phase: 'dawn', t: (hour - 6) / 2, hour }
  if (hour < 10) return { phase: 'morning', t: (hour - 8) / 2, hour }
  if (hour < 16) return { phase: 'day', t: 0, hour }
  if (hour < 18) return { phase: 'day', t: (hour - 16) / 2, hour }
  if (hour < 20) return { phase: 'dusk', t: (hour - 18) / 2, hour }
  return { phase: 'night', t: 0, hour }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

interface SkyPalette {
  skyTop: string; skyMid: string; skyLow: string; skyHorizon: string; skyField: string; skyBottom: string
  oceanTop: string; oceanMid: string; oceanBot: string
  mtnTop: string; mtnMid: string; mtnBot: string
  snowTop: string; snowFade: string
  hillMidTop: string; hillMidBot: string
  hillNearTop: string; hillNearBot: string
  fieldTop: string; fieldMid1: string; fieldMid2: string; fieldBot: string
  sunGlow: number; sunColor: string; sunY: number
  moonGlow: number; moonY: number
  starOpacity: number
  mtnLightOpacity: number; mtnLightColor: string
  groveOpacity: number
  ambientOverlay: string; ambientOpacity: number
}

const PALETTES: Record<string, SkyPalette> = {
  night: {
    skyTop: '#0a0a0c', skyMid: '#0a0a0c', skyLow: '#0c0b0a', skyHorizon: '#0c0b0a', skyField: '#0c0b0a', skyBottom: '#0c0b0a',
    oceanTop: '#0c0a08', oceanMid: '#0a0806', oceanBot: '#0e0c08',
    mtnTop: '#12100c', mtnMid: '#0e0c0a', mtnBot: '#0c0a08',
    snowTop: '#2a2820', snowFade: '#12100c',
    hillMidTop: '#121808', hillMidBot: '#0e1406',
    hillNearTop: '#161e08', hillNearBot: '#121806',
    fieldTop: '#161e08', fieldMid1: '#141a06', fieldMid2: '#121806', fieldBot: '#0e1404',
    sunGlow: 0, sunColor: '#000000', sunY: 32,
    moonGlow: 0.25, moonY: 4,
    starOpacity: 1,
    mtnLightOpacity: 0, mtnLightColor: 'rgba(0,0,0,0)',
    groveOpacity: 0.8,
    ambientOverlay: 'rgba(16,8,22,0.2)', ambientOpacity: 0.2,
  },
  dawn: {
    skyTop: '#1a1208', skyMid: '#2a1c0c', skyLow: '#4a2c10', skyHorizon: '#8a4820', skyField: '#2a2010', skyBottom: '#1a1608',
    oceanTop: '#3a2818', oceanMid: '#2a1c10', oceanBot: '#3a2a18',
    mtnTop: '#1a1610', mtnMid: '#14120c', mtnBot: '#100e0a',
    snowTop: '#3a3020', snowFade: '#1a1610',
    hillMidTop: '#182012', hillMidBot: '#141a0e',
    hillNearTop: '#1e2814', hillNearBot: '#1a2210',
    fieldTop: '#1e2c12', fieldMid1: '#1c2810', fieldMid2: '#1e2810', fieldBot: '#1a220c',
    sunGlow: 0.5, sunColor: '#d97706', sunY: 18,
    moonGlow: 0.15, moonY: 30,
    starOpacity: 0.15,
    mtnLightOpacity: 0.08, mtnLightColor: 'rgba(217,119,6,0.08)',
    groveOpacity: 0.85,
    ambientOverlay: 'rgba(40,20,8,0.15)', ambientOpacity: 0.15,
  },
  morning: {
    skyTop: '#8a5828', skyMid: '#a06830', skyLow: '#b07838', skyHorizon: '#a08040', skyField: '#7a8870', skyBottom: '#6a7868',
    oceanTop: '#8a7850', oceanMid: '#7a6a42', oceanBot: '#907a58',
    mtnTop: '#5a6068', mtnMid: '#4a5458', mtnBot: '#3e4a4e',
    snowTop: '#b0b0a8', snowFade: '#6a6e70',
    hillMidTop: '#3e6430', hillMidBot: '#345828',
    hillNearTop: '#4a6438', hillNearBot: '#3e5830',
    fieldTop: '#4a6834', fieldMid1: '#446030', fieldMid2: '#3e5a2c', fieldBot: '#385228',
    sunGlow: 0.6, sunColor: '#d97706', sunY: 6,
    moonGlow: 0, moonY: 32,
    starOpacity: 0,
    mtnLightOpacity: 0.12, mtnLightColor: 'rgba(255,200,100,0.12)',
    groveOpacity: 0.9,
    ambientOverlay: 'rgba(0,0,0,0)', ambientOpacity: 0,
  },
  day: {
    skyTop: '#6a7a82', skyMid: '#7a8888', skyLow: '#8a9690', skyHorizon: '#90a08a', skyField: '#7a8868', skyBottom: '#728060',
    oceanTop: '#4a6258', oceanMid: '#3e584c', oceanBot: '#5a6e5e',
    mtnTop: '#5a6460', mtnMid: '#4e5a54', mtnBot: '#44524c',
    snowTop: '#a8a89e', snowFade: '#6a6c66',
    hillMidTop: '#304828', hillMidBot: '#2a4222',
    hillNearTop: '#385030', hillNearBot: '#324a2a',
    fieldTop: '#364c2c', fieldMid1: '#324828', fieldMid2: '#304426', fieldBot: '#2c4022',
    sunGlow: 0.2, sunColor: '#b09048', sunY: 3,
    moonGlow: 0, moonY: 32,
    starOpacity: 0,
    mtnLightOpacity: 0.05, mtnLightColor: 'rgba(255,240,180,0.05)',
    groveOpacity: 0.9,
    ambientOverlay: 'rgba(0,0,0,0)', ambientOpacity: 0,
  },
  dusk: {
    skyTop: '#1e1018', skyMid: '#281614', skyLow: '#321e0e', skyHorizon: '#2e1a08', skyField: '#18140c', skyBottom: '#141008',
    oceanTop: '#1e1608', oceanMid: '#1a1206', oceanBot: '#221a0a',
    mtnTop: '#1e1810', mtnMid: '#18140c', mtnBot: '#14100a',
    snowTop: '#3e3628', snowFade: '#1e1810',
    hillMidTop: '#1c2612', hillMidBot: '#18200e',
    hillNearTop: '#223014', hillNearBot: '#1e2810',
    fieldTop: '#263414', fieldMid1: '#222e12', fieldMid2: '#243012', fieldBot: '#202a0e',
    sunGlow: 1, sunColor: '#d97706', sunY: 20,
    moonGlow: 0.15, moonY: 28,
    starOpacity: 0.1,
    mtnLightOpacity: 0.15, mtnLightColor: 'rgba(255,180,80,0.15)',
    groveOpacity: 0.85,
    ambientOverlay: 'rgba(20,10,5,0.1)', ambientOpacity: 0.1,
  },
}

function interpolatePalette(phase: string, t: number): SkyPalette {
  const transitions: Record<string, string> = { night: 'dawn', dawn: 'morning', morning: 'day', day: 'dusk', dusk: 'night' }
  const from = PALETTES[phase] || PALETTES.day
  const nextPhase = transitions[phase] || 'day'
  const to = PALETTES[nextPhase] || PALETTES.day

  const result: any = {}
  for (const key of Object.keys(from) as (keyof SkyPalette)[]) {
    const a = from[key]
    const b = to[key]
    if (typeof a === 'string' && typeof b === 'string') {
      if (a.startsWith('#') && b.startsWith('#')) result[key] = lerpColor(a, b, t)
      else result[key] = t < 0.5 ? a : b
    } else if (typeof a === 'number' && typeof b === 'number') {
      result[key] = lerpNum(a, b, t)
    } else {
      result[key] = a
    }
  }
  return result as SkyPalette
}

const STAR_POSITIONS = Array.from({ length: 50 }, (_, i) => {
  const rng = seededRng(i * 47 + 199)
  const brightness = rng()
  return { x: rng() * 200, y: rng() * 6, r: 0.12 + rng() * 0.28, twinkle: rng(), brightness, warm: rng() > 0.7 }
})
const SPECK_STARS = Array.from({ length: 70 }, (_, i) => {
  const rng = seededRng(i * 31 + 503)
  return { x: rng() * 200, y: rng() * 6, r: 0.04 + rng() * 0.08, op: 0.15 + rng() * 0.35 }
})

const CONSTELLATION_STARS = [
  { x: 66.8, y: 6.5 },   // 0: left
  { x: 68.4, y: 5.8 },   // 1: upper-left
  { x: 70.2, y: 6.1 },   // 2: top-right
  { x: 71.0, y: 7.0 },   // 3: right
  { x: 70.4, y: 8.2 },   // 4: lower-right
  { x: 68.1, y: 8.6 },   // 5: bottom
  { x: 69.1, y: 5.0 },   // 6: stem
]
const CONSTELLATION_LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
  [1, 6],
]

const Terrain = memo(function Terrain({ isDark: isDarkProp, treeCount, treeBases, chopMode, onToggleChop, showChopHint, orchardTimeMode, onOpenShop }: { isDark: boolean; treeCount: number; treeBases: { x: number; y: number; col: number }[]; chopMode: boolean; onToggleChop: () => void; showChopHint: boolean; orchardTimeMode?: "theme" | "realtime"; onOpenShop?: () => void }) {
  const [realtimeState, setRealtimeState] = useState(getTimePhase)
  useEffect(() => {
    if (orchardTimeMode !== 'realtime') return
    setRealtimeState(getTimePhase())
    const id = setInterval(() => setRealtimeState(getTimePhase()), 60000)
    return () => clearInterval(id)
  }, [orchardTimeMode])

  const timeState = orchardTimeMode === 'realtime'
    ? realtimeState
    : isDarkProp ? { phase: 'night', t: 0, hour: 0 } : { phase: 'day', t: 0.5, hour: 13 }

  const isDark = orchardTimeMode === 'realtime'
    ? (timeState.phase === 'night' || timeState.phase === 'dusk' || (timeState.phase === 'dawn' && timeState.t < 0.3))
    : isDarkProp

  const p = useMemo(() => interpolatePalette(timeState.phase, timeState.t), [timeState.phase, timeState.t])

  const paletteKey = `${timeState.phase}:${Math.round(timeState.t * 5)}:${isDark ? 1 : 0}`
  const { svgRef: terrainCacheSvgRef, cachedUrl: terrainCachedUrl } = useTerrainCache(paletteKey)

  const terrainSvgRef = useRef<SVGSVGElement>(null)
  const combinedTerrainRef = useCallback((el: SVGSVGElement | null) => {
    (terrainSvgRef as React.MutableRefObject<SVGSVGElement | null>).current = el;
    (terrainCacheSvgRef as React.MutableRefObject<SVGSVGElement | null>).current = el
  }, [terrainCacheSvgRef])

  const [svgAspect, setSvgAspect] = useState(2)
  useEffect(() => {
    const el = terrainSvgRef.current
    if (!el) return
    let debounce: ReturnType<typeof setTimeout>
    const measure = () => {
      clearTimeout(debounce)
      debounce = setTimeout(() => {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) setSvgAspect(r.width / r.height)
      }, 150)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => { ro.disconnect(); clearTimeout(debounce) }
  }, [])

  const dirtColor = isDark ? '#2a2418' : '#8a7a5a'
  const dirtLight = isDark ? '#322c1e' : '#9a8a6a'

  const isNight = timeState.hour >= 18 || timeState.hour < 6
  const lightX = (() => {
    if (isNight) {
      const nightHour = timeState.hour >= 18 ? timeState.hour - 18 : timeState.hour + 6
      const t = Math.max(0, Math.min(1, nightHour / 12))
      return (1-t)*(1-t)*50 + 2*(1-t)*t*85 + t*t*120
    }
    const t = Math.max(0, Math.min(1, (timeState.hour - 6) / 12))
    return (1-t)*(1-t)*50 + 2*(1-t)*t*85 + t*t*120
  })()
  const shadowOp = isDark ? 0.1 : 0.07

  const renderWindmill = (wm: { x: number; y: number; s: number }, wi: number) => {
    const wmX = wm.x, wmY = wm.y, sc = wm.s
    const wmColor = isDark ? '#3a3028' : '#6a5a42'
    const wmLight = isDark ? '#4a4032' : '#7a6a52'
    const bladeColor = isDark ? '#4a4236' : '#8a7a66'
    const bladeLight = isDark ? '#5a5040' : '#a09080'
    const bw = 3.5 * sc, tw = 1.5 * sc, h = 14 * sc
    const hubY = wmY + 1.5 * sc, bladeLen = 7 * sc
    const roofColor = isDark ? '#2a2218' : '#5a4a32'
    const roofLight = isDark ? '#342a1e' : '#6a5a40'
    const isFg = sc >= 0.5
    return (
      <g key={`wm-${wi}`}>
        {/* Cast shadow */}
        {(() => {
          const dir = wmX < lightX ? -1 : 1
          const stretch = Math.abs(wmX - lightX) / 100
          const offX = dir * h * (0.3 + stretch * 0.4)
          return <ellipse cx={wmX + offX} cy={wmY + h + 0.5 * sc} rx={h * (0.4 + stretch * 0.3)} ry={0.6 * sc} fill={`rgba(0,0,0,${shadowOp})`} />
        })()}
        <path d={`M${wmX - bw},${wmY + h} C${wmX - bw},${wmY + h * 0.6} ${wmX - tw},${wmY + h * 0.2} ${wmX - tw},${wmY + sc * 2} L${wmX + tw},${wmY + sc * 2} C${wmX + tw},${wmY + h * 0.2} ${wmX + bw},${wmY + h * 0.6} ${wmX + bw},${wmY + h} Z`} fill="url(#brick-pat)" />
        <path d={`M${wmX - bw},${wmY + h} C${wmX - bw},${wmY + h * 0.6} ${wmX - tw},${wmY + h * 0.2} ${wmX - tw},${wmY + sc * 2} L${wmX + tw},${wmY + sc * 2} C${wmX + tw},${wmY + h * 0.2} ${wmX + bw},${wmY + h * 0.6} ${wmX + bw},${wmY + h} Z`} fill={isDark ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.03)'} />
        {[0.35, 0.55, 0.7, 0.85].map(t => {
          const bandY = wmY + sc * 2 + (h - sc * 2) * t
          const bw2 = tw + (bw - tw) * t
          return <line key={t} x1={wmX - bw2 + 0.3} y1={bandY} x2={wmX + bw2 - 0.3} y2={bandY} stroke={isDark ? 'rgba(60,50,35,0.3)' : 'rgba(100,80,50,0.15)'} strokeWidth={0.2 * sc} />
        })}
        {isFg && <circle cx={wmX} cy={wmY + h * 0.4} r={1 * sc} fill={isDark ? '#1a1410' : '#4a3a28'} />}
        {isFg && <circle cx={wmX} cy={wmY + h * 0.4} r={1 * sc} fill="none" stroke={isDark ? '#4a3e28' : '#6a5a3a'} strokeWidth={0.3 * sc} />}
        {isFg && <line x1={wmX - 0.8 * sc} y1={wmY + h * 0.4} x2={wmX + 0.8 * sc} y2={wmY + h * 0.4} stroke={isDark ? '#4a3e28' : '#6a5a3a'} strokeWidth={0.2 * sc} />}
        {isFg && <line x1={wmX} y1={wmY + h * 0.4 - 0.8 * sc} x2={wmX} y2={wmY + h * 0.4 + 0.8 * sc} stroke={isDark ? '#4a3e28' : '#6a5a3a'} strokeWidth={0.2 * sc} />}
        {isFg && <circle cx={wmX} cy={wmY + h * 0.4} r={0.6 * sc} fill={isDark ? 'rgba(255,200,100,0.15)' : 'rgba(255,220,140,0.2)'} />}
        {isFg && <path d={`M${wmX - 1 * sc},${wmY + h} L${wmX - 1 * sc},${wmY + h - 2.2 * sc} A${1 * sc},${1 * sc} 0 0 1 ${wmX + 1 * sc},${wmY + h - 2.2 * sc} L${wmX + 1 * sc},${wmY + h} Z`} fill={isDark ? '#1a1410' : '#3a2a1a'} />}
        {isFg && <line x1={wmX} y1={wmY + h - 2.8 * sc} x2={wmX} y2={wmY + h} stroke={isDark ? '#2a2018' : '#4a3a28'} strokeWidth={0.15 * sc} />}
        <polygon points={`${wmX - tw - 0.8 * sc},${wmY + sc * 2} ${wmX + tw + 0.8 * sc},${wmY + sc * 2} ${wmX},${wmY - 1 * sc}`} fill={roofColor} />
        <polygon points={`${wmX},${wmY - 1 * sc} ${wmX + tw + 0.8 * sc},${wmY + sc * 2} ${wmX + 0.3 * sc},${wmY + sc * 2}`} fill={roofLight} opacity="0.3" />
        <circle cx={wmX} cy={hubY} r={1.4 * sc} fill={wmLight} />
        <circle cx={wmX} cy={hubY} r={0.9 * sc} fill={roofColor} />
        <circle cx={wmX} cy={hubY} r={0.4 * sc} fill={wmLight} />
        <g>
          <animateTransform attributeName="transform" type="rotate" from={`0 ${wmX} ${hubY}`} to={`${wi % 2 === 0 ? 360 : -360} ${wmX} ${hubY}`} dur={`${isFg ? (wi === 0 ? 25 : 32) : 35 + wi * 5}s`} repeatCount="indefinite" />
          {[0, 90, 180, 270].map(angle => (
            <g key={angle} transform={`rotate(${angle} ${wmX} ${hubY})`}>
              <polygon points={`${wmX - 0.4 * sc},${hubY} ${wmX + 0.4 * sc},${hubY} ${wmX + 1 * sc},${hubY - bladeLen} ${wmX - 0.15 * sc},${hubY - bladeLen}`} fill={bladeColor} opacity="0.8" />
              {[0.25, 0.5, 0.75].map(t => {
                const ly = hubY - bladeLen * t
                const lw = (0.4 + (1 - 0.4) * t * 0.6) * sc
                return <line key={t} x1={wmX - 0.1 * sc} y1={ly} x2={wmX + lw} y2={ly} stroke={bladeLight} strokeWidth={0.15 * sc} opacity="0.5" />
              })}
              <line x1={wmX + 0.2 * sc} y1={hubY} x2={wmX + 0.4 * sc} y2={hubY - bladeLen} stroke={bladeLight} strokeWidth={0.2 * sc} opacity="0.35" />
            </g>
          ))}
        </g>
      </g>
    )
  }

  const cols = Math.min(7, Math.max(3, Math.ceil(Math.sqrt(treeCount * 1.1))))
  const colStart = 6
  const colEnd = 94
  const tillCols = cols


  const terrainContent = useMemo(() => (<>
        <defs>
          <linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.skyTop} />
            <stop offset="20%" stopColor={p.skyMid} />
            <stop offset="40%" stopColor={p.skyLow} />
            <stop offset="60%" stopColor={p.skyHorizon} />
            <stop offset="80%" stopColor={p.skyField} />
            <stop offset="100%" stopColor={p.skyBottom} />
          </linearGradient>
          <linearGradient id="hill-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.mtnTop} />
            <stop offset="60%" stopColor={p.mtnMid} />
            <stop offset="100%" stopColor={p.mtnBot} />
          </linearGradient>
          <linearGradient id="mtn-snow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.snowTop} />
            <stop offset="100%" stopColor={p.snowFade} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hill-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.hillMidTop} />
            <stop offset="100%" stopColor={p.hillMidBot} />
          </linearGradient>
          <linearGradient id="hill-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.hillNearTop} />
            <stop offset="100%" stopColor={p.hillNearBot} />
          </linearGradient>
          <linearGradient id="field-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.fieldTop} />
            <stop offset="30%" stopColor={p.fieldMid1} />
            <stop offset="70%" stopColor={p.fieldMid2} />
            <stop offset="100%" stopColor={p.fieldBot} />
          </linearGradient>
          <pattern id="brick-pat" width="2.4" height="1.2" patternUnits="userSpaceOnUse">
            <rect width="2.4" height="1.2" fill={isDark ? '#3a2818' : '#8a6a48'} />
            <rect x="0" y="0" width="1.1" height="0.5" rx="0.05" fill={isDark ? '#4a3420' : '#9a7a55'} />
            <rect x="1.3" y="0" width="1.1" height="0.5" rx="0.05" fill={isDark ? '#42301c' : '#927252'} />
            <rect x="0.6" y="0.6" width="1.1" height="0.5" rx="0.05" fill={isDark ? '#46321e' : '#967656'} />
            <rect x="1.9" y="0.6" width="0.5" height="0.5" rx="0.05" fill={isDark ? '#4a3420' : '#9a7a55'} />
            <rect x="0" y="0.6" width="0.5" height="0.5" rx="0.05" fill={isDark ? '#42301c' : '#927252'} />
          </pattern>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width="200" height="100" fill="url(#sky-g)" />

        {/* Atmospheric haze layers */}
        <defs>
          <radialGradient id="sky-haze-1" cx="25%" cy="35%" r="50%" fx="25%" fy="35%">
            <stop offset="0%" stopColor={isDark ? '#1a1040' : '#b8c8e8'} stopOpacity={isDark ? 0.12 : 0.08} />
            <stop offset="100%" stopColor={isDark ? '#1a1040' : '#b8c8e8'} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sky-haze-2" cx="72%" cy="28%" r="40%" fx="72%" fy="28%">
            <stop offset="0%" stopColor={isDark ? '#201830' : '#c8b8d8'} stopOpacity={isDark ? 0.1 : 0.06} />
            <stop offset="100%" stopColor={isDark ? '#201830' : '#c8b8d8'} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="horizon-wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.skyHorizon} stopOpacity="0" />
            <stop offset="60%" stopColor={p.skyHorizon} stopOpacity="0" />
            <stop offset="85%" stopColor={p.skyHorizon} stopOpacity={isDark ? '0.15' : '0.1'} />
            <stop offset="100%" stopColor={p.skyHorizon} stopOpacity={isDark ? '0.25' : '0.15'} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="200" height="40" fill="url(#sky-haze-1)" />
        <rect x="0" y="0" width="200" height="40" fill="url(#sky-haze-2)" />
        <rect x="0" y="0" width="200" height="40" fill="url(#horizon-wash)" />

        {/* Stars — soft radial dots, brightest when moon is highest */}
        {p.starOpacity > 0.01 && (() => {
          const moonHeight = Math.max(0, 1 - p.moonY / 28)
          const moonBoost = p.moonGlow * moonHeight
          const mb = Math.min(1, p.starOpacity + moonBoost * 0.6)
          return (
          <g>
            <defs>
              {STAR_POSITIONS.map((s, i) => {
                const col = s.warm ? '#ffeedd' : '#e8f0ff'
                const bright = s.brightness > 0.6
                return (
                <radialGradient key={`sg${i}`} id={`sg${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={col} stopOpacity={bright ? 1 : 0.9} />
                  <stop offset={bright ? '30%' : '45%'} stopColor={col} stopOpacity={bright ? 0.45 : 0.25} />
                  <stop offset="100%" stopColor={col} stopOpacity="0" />
                </radialGradient>
                )
              })}
              <radialGradient id="csg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e8f0ff" stopOpacity="1" />
                <stop offset="25%" stopColor="#e8f0ff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#e8f0ff" stopOpacity="0" />
              </radialGradient>
              <clipPath id="sky-clip">
                <path d="M-10,-5 L210,-5 L210,28 L195,18 L185,22 L175,15 L165,20 L155,10 L145,16 L135,22 L125,13 L115,18 L105,9 L95,22 L85,14 L78,20 L68,11 L58,16 L50,8 L42,18 L35,10 L25,22 L15,12 L5,24 L-10,28 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#sky-clip)">
            {STAR_POSITIONS.map((s, i) => {
              const bright = s.brightness > 0.6
              const sz = bright ? s.r * 2.5 : s.r * 1.5
              const op = Math.min(1, (bright ? 0.75 : 0.5) + mb * 0.4)
              return (
                <circle key={i} cx={s.x} cy={s.y} r={sz} fill={`url(#sg${i})`} opacity={op} />
              )
            })}
            {SPECK_STARS.map((s, i) => (
              <circle key={`sp${i}`} cx={s.x} cy={s.y} r={s.r} fill="#e0e8f4" opacity={s.op * mb} />
            ))}
            {/* Constellation */}
            <g opacity={mb}>
              {CONSTELLATION_LINES.map(([a, b], i) => {
                const lo = 0.1 + moonBoost * 0.2
                return (
                <line key={`cl${i}`} x1={CONSTELLATION_STARS[a].x} y1={CONSTELLATION_STARS[a].y} x2={CONSTELLATION_STARS[b].x} y2={CONSTELLATION_STARS[b].y} stroke="#e8f0ff" strokeWidth="0.08" opacity={lo} />
                )
              })}
              {CONSTELLATION_STARS.map((s, i) => {
                const co = Math.min(1, 0.8 + moonBoost * 0.3)
                return (
                <circle key={`cs${i}`} cx={s.x} cy={s.y} r={0.8} fill="url(#csg)" opacity={co} />
                )
              })}
            </g>
            </g>
          </g>
          )
        })()}




        {/* Distant cliff hills — behind mountains, angular and steep */}
        <path d="M-10,24 L-5,22 L2,6 L6,5 L10,8 L14,4 L18,6 L22,18 L28,16 L32,8 L36,6 L38,9 L42,22 L48,20 L52,14 L56,6 L60,4 L62,7 L66,18 L72,22 L80,20 L86,16 L90,12 L94,14 L100,20 L106,18 L110,8 L114,5 L116,3 L120,6 L124,16 L130,22 L138,18 L144,10 L148,6 L152,8 L156,14 L160,20 L168,22 L176,16 L180,10 L184,12 L190,20 L196,18 L200,14 L204,16 L210,22 L210,34 L-10,34 Z" fill={isDark ? '#161820' : '#8898a8'} opacity={isDark ? 0.7 : 0.25} />

        {/* Sun — between distant cliffs and mountains */}
        {(() => {
          const sunT = Math.max(0, Math.min(1, (timeState.hour - 6) / 12))
          const t = sunT
          const sx = (1-t)*(1-t)*50 + 2*(1-t)*t*85 + t*t*120
          const sy = (1-t)*(1-t)*10 + 2*(1-t)*t*(-8) + t*t*14
          const visible = timeState.hour >= 6 && timeState.hour < 18
          if (!visible) return null
          const horizonFade = t < 0.08 ? t / 0.08 : t > 0.92 ? (1 - t) / 0.08 : 1
          const vbAspect = 200 / 104
          const squeeze = svgAspect / vbAspect
          return (
            <g opacity={horizonFade} style={{ pointerEvents: 'none' }}>
              <defs>
                <radialGradient id="sun-glow-bg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={p.sunColor} stopOpacity="1" />
                  <stop offset="20%" stopColor={p.sunColor} stopOpacity="0.5" />
                  <stop offset="50%" stopColor={p.sunColor} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={p.sunColor} stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx={sx} cy={sy} rx={8 / squeeze} ry={8} fill="url(#sun-glow-bg)" />
              <ellipse cx={sx} cy={sy} rx={3 / squeeze} ry={3} fill={p.sunColor} />
              <ellipse cx={sx} cy={sy} rx={1.8 / squeeze} ry={1.8} fill="#fff4d0" />
            </g>
          )
        })()}

        {/* Windmills — behind hills, on mountain slopes */}
        {(() => {
          const mills = [
            { x: 30, baseY: 26, h: 8, bladeR: 3.2 },
            { x: 160, baseY: 22, h: 8.5, bladeR: 3.3 },
          ]
          const towerC = isDark ? '#2a2a30' : '#b0a898'
          const towerCd = isDark ? '#20202a' : '#988a78'
          const bladeC = isDark ? '#3a3a42' : '#d8d0c8'
          const bladeCd = isDark ? '#2e2e36' : '#c0b8a8'
          return <g opacity={isDark ? 0.5 : 0.6}>
            {mills.map((m, i) => {
              const topY = m.baseY - m.h
              const rng = seededRng(i * 127 + 331)
              const phase = rng() * 360
              return <g key={i}>
                <path d={`M${m.x - 0.5},${m.baseY} L${m.x - 0.3},${topY + 1} L${m.x + 0.3},${topY + 1} L${m.x + 0.5},${m.baseY}Z`} fill={towerC} />
                <path d={`M${m.x},${m.baseY} L${m.x + 0.15},${topY + 1}`} stroke={towerCd} strokeWidth="0.15" opacity="0.4" />
                <circle cx={m.x} cy={topY + 1} r="0.45" fill={towerCd} />
                <g style={{ transformOrigin: `${m.x}px ${topY + 1}px`, animation: `spin ${18 + i * 4}s linear infinite` }}>
                  {[0, 1, 2, 3].map(b => {
                    const ang = (phase + b * 90) * Math.PI / 180
                    const ex = m.x + Math.cos(ang) * m.bladeR
                    const ey = topY + 1 + Math.sin(ang) * m.bladeR
                    const px = m.x + Math.cos(ang + 0.12) * m.bladeR * 0.35
                    const py = topY + 1 + Math.sin(ang + 0.12) * m.bladeR * 0.35
                    return <path key={b} d={`M${m.x},${topY + 1} L${px.toFixed(1)},${py.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}Z`} fill={b % 2 === 0 ? bladeC : bladeCd} />
                  })}
                </g>
              </g>
            })}
          </g>
        })()}

        {/* Background windmills — behind hills, mostly occluded */}
        {[{ x: 45, y: 27, s: 0.12 }, { x: 110, y: 19, s: 0.06 }, { x: 155, y: 20, s: 0.07 }].map((wm, wi) => <g key={`bgwm-${wi}`} opacity={0.35}>{renderWindmill(wm, wi + 10)}</g>)}

        {/* Extra rolling hills — left side, between mountains and back hill */}
        <path d="M-10,33 C-5,31 5,26 15,23 C22,21 28,22 35,26 C42,30 50,32 58,30 C64,28 68,25 72,23 C78,22 85,24 90,28 C95,31 100,33 110,34 L210,36 L210,42 L-10,42 Z" fill={p.hillMidBot} />
        <path d="M-10,33 C-5,31 5,26 15,23 C22,21 28,22 35,26" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.25" />
        <path d="M58,30 C64,28 68,25 72,23 C78,22 85,24 90,28" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.2" />

        {/* Far left hill — scattered boulders */}
        {(() => {
          const rng = seededRng(7713)
          const baseC = isDark ? '#282c2a' : '#808878'
          const darkC = isDark ? '#1a1e1c' : '#686e64'
          const lightC = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'
          const crackC = isDark ? '#1e2220' : '#585e54'
          const rocks: string[] = []
          const rockDark: string[] = []
          const highlights: string[] = []
          const cracks: string[] = []
          const farPts: [number,number][] = [[-10,33],[5,26],[15,23],[22,21],[28,22],[35,26],[42,30],[50,32],[58,30],[68,25],[72,23],[85,24],[90,28],[100,33],[110,34]]
          const getFarY = (x: number) => {
            for (let j = 0; j < farPts.length - 1; j++) {
              if (x >= farPts[j][0] && x <= farPts[j+1][0]) {
                const t = (x - farPts[j][0]) / (farPts[j+1][0] - farPts[j][0])
                return farPts[j][1] + t * (farPts[j+1][1] - farPts[j][1])
              }
            }
            return 33
          }
          const sizes = [1.2, 0.4, 2, 0.6, 2.5, 0.5, 1.5, 0.7, 1.8, 0.35]
          for (let i = 0; i < 10; i++) {
            const rx = -5 + (i / 10) * 115 + (rng() - 0.5) * 8
            const ry = getFarY(rx) + 0.5 + rng() * 5
            const sizeMul = sizes[i]
            const w = sizeMul * (0.4 + rng() * 0.5), h = sizeMul * (0.3 + rng() * 0.4)
            const tilt = (rng() - 0.5) * 0.12
            const jL = rng() * 0.3, jR = rng() * 0.3, jT = rng() * 0.2
            rocks.push(`M${(rx - w).toFixed(2)},${ry.toFixed(2)}Q${(rx - w * (0.7 + jL)).toFixed(2)},${(ry - h * (0.5 + jL)).toFixed(2)} ${(rx - w * 0.3 + tilt).toFixed(2)},${(ry - h * (0.9 + jT)).toFixed(2)}Q${(rx + tilt).toFixed(2)},${(ry - h * (1.05 + jT)).toFixed(2)} ${(rx + w * 0.35 + tilt).toFixed(2)},${(ry - h * (0.8 + jR)).toFixed(2)}Q${(rx + w * (0.8 + jR)).toFixed(2)},${(ry - h * (0.4 + jR)).toFixed(2)} ${(rx + w).toFixed(2)},${ry.toFixed(2)}Z`)
            rockDark.push(`M${(rx - w * 0.9).toFixed(2)},${(ry + 0.06).toFixed(2)}Q${rx.toFixed(2)},${(ry + h * 0.15 + 0.06).toFixed(2)} ${(rx + w * 0.9).toFixed(2)},${(ry + 0.06).toFixed(2)}`)
            highlights.push(`M${(rx - w * 0.3 + tilt).toFixed(2)},${(ry - h * (0.9 + jT)).toFixed(2)}Q${(rx + tilt).toFixed(2)},${(ry - h * (1.05 + jT)).toFixed(2)} ${(rx + w * 0.35 + tilt).toFixed(2)},${(ry - h * (0.8 + jR)).toFixed(2)}`)
            if (w > 0.3) {
              const cx1 = rx + (rng() - 0.5) * w * 0.5, cy1 = ry - h * (0.3 + rng() * 0.4)
              cracks.push(`M${cx1.toFixed(2)},${cy1.toFixed(2)}l${(rng() * 0.25 - 0.12).toFixed(2)},${(rng() * 0.15).toFixed(2)}`)
            }
          }
          return <g>
            <path d={rocks.join('')} fill={baseC} />
            <path d={rockDark.join('')} stroke={darkC} strokeWidth="0.06" fill="none" opacity="0.6" />
            <path d={highlights.join('')} stroke={lightC} strokeWidth="0.05" fill="none" />
            <path d={cracks.join('')} stroke={crackC} strokeWidth="0.03" fill="none" opacity="0.5" />
          </g>
        })()}

        {/* Rolling hills — back hill broad dome on right, front hill steep hump on left */}
        {/* Back hill — broad dome peaking center-right */}
        <path d="M-10,36 C10,34 40,30 70,26 C90,22 115,19 140,19 C160,20 180,23 200,26 C205,27 208,28 210,29 L210,42 L-10,42 Z" fill="url(#hill-mid)" />
        {/* Back hill — ridge highlight for roundness */}
        <path d="M-10,36 C10,34 40,30 70,26 C90,22 115,19 140,19 C160,20 180,23 200,26 C205,27 208,28 210,29" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
        {/* Back hill — shadow band along bottom for depth */}
        <path d="M-10,39 C10,38 40,36 70,33 C90,30 115,28 140,28 C160,29 180,31 200,33 L210,35 L210,42 L-10,42 Z" fill="rgba(0,0,0,0.06)" />
        {/* Back hill — contour lines for rolling terrain detail */}
        <path d="M-10,35 C20,33 50,29 80,25 C100,22 120,20 145,20 C165,21 185,24 210,28" fill="none" stroke={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'} strokeWidth="0.2" />
        <path d="M-10,37 C20,35 50,31 80,28 C100,25 120,23 145,23 C165,24 185,27 210,30" fill="none" stroke={isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.025)'} strokeWidth="0.15" />
        {/* Back hill — wildflower patches */}
        {(() => {
          const dots: string[] = []
          for (let i = 0; i < 15; i++) {
            const rng = seededRng(i * 53 + 877)
            const fx = 5 + rng() * 195
            const fy = (() => {
              if (fx < 70) return 36 - (fx + 10) * 10 / 80
              if (fx < 140) return 26 - (fx - 70) * 7 / 70
              return 19 + (fx - 140) * 10 / 70
            })() + 0.5 + rng() * 3
            dots.push(`M${fx.toFixed(1)},${fy.toFixed(1)}a0.06,0.06 0 1 1 0.01,0Z`)
          }
          return <path d={dots.join('')} fill={isDark ? '#b07010' : '#e08010'} opacity="0.35" />
        })()}

        {/* Winding paths on hills — layered for terrain integration */}
        {(() => {
          const mainD = "M-5,36.5 Q10,34.5 25,32 Q35,30 45,29 Q55,28 65,27.5 Q80,25.5 95,23.5 Q110,21.5 125,20.5 Q140,20 155,20 Q165,20.5 175,22.5 Q185,24.5 200,27.5"
          const branchD = "M65,32 Q70,34 75,36 Q80,37 90,38 Q100,38.5 115,39"
          const spurD = "M45,31 Q48,31.5 52,32"
          const house1D = "M95,30.5 C94,29.5 92.5,29.3 91.1,28.6"
          const house2D = "M125,22.5 C127,23 129,24 131.2,24.9"
          const dirtBase = isDark ? '#2a2014' : '#8a7050'
          const dirtDark = isDark ? '#1a1408' : '#6a5030'
          const dirtLight = isDark ? '#342a1a' : '#a08a60'
          const edgeGrass = isDark ? '#1a2c14' : '#4a7a3a'
          const rng = seededRng(5599)
          const pebbles: string[] = []
          const grassEdge: string[] = []
          const ruts: string[] = []
          const pts = [[-5,36.5],[10,34.5],[25,32],[35,30],[45,29],[55,28],[65,27.5],[80,25.5],[95,23.5],[110,21.5],[125,20.5],[140,20],[155,20],[165,20.5],[175,22.5],[185,24.5],[200,27.5]]
          const wornPatches: string[] = []
          for (let i = 0; i < 25; i++) {
            const t = rng()
            const idx = Math.floor(t * (pts.length - 1))
            const frac = t * (pts.length - 1) - idx
            const nxt = Math.min(idx + 1, pts.length - 1)
            const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
            const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
            const ox = (rng() - 0.5) * 0.9
            const oy = (rng() - 0.5) * 0.5
            const pr = 0.03 + rng() * 0.06
            pebbles.push(`M${(px + ox + pr).toFixed(2)},${(py + oy).toFixed(2)}a${pr.toFixed(2)},${(pr * 0.7).toFixed(2)} 0 1 1 -${(pr * 2).toFixed(2)},0a${pr.toFixed(2)},${(pr * 0.7).toFixed(2)} 0 1 1 ${(pr * 2).toFixed(2)},0Z`)
          }
          for (let i = 0; i < 15; i++) {
            const t = rng()
            const idx = Math.floor(t * (pts.length - 1))
            const frac = t * (pts.length - 1) - idx
            const nxt = Math.min(idx + 1, pts.length - 1)
            const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
            const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
            const side = rng() > 0.5 ? 1 : -1
            const gx = px + side * (0.35 + rng() * 0.4)
            const gy = py + side * (0.08 + rng() * 0.2)
            const gh = 0.2 + rng() * 0.4
            const gsway = (rng() - 0.5) * 0.25
            grassEdge.push(`M${gx.toFixed(1)},${gy.toFixed(1)}q${gsway.toFixed(2)},${(-gh * 0.5).toFixed(2)} ${(gsway * 0.3).toFixed(2)},${(-gh).toFixed(2)}`)
            if (rng() > 0.5) {
              grassEdge.push(`M${(gx + 0.1).toFixed(2)},${gy.toFixed(1)}q${((rng() - 0.5) * 0.2).toFixed(2)},${(-gh * 0.3).toFixed(2)} ${((rng() - 0.5) * 0.1).toFixed(2)},${(-gh * 0.6).toFixed(2)}`)
            }
          }
          for (let i = 0; i < 8; i++) {
            const t = 0.05 + rng() * 0.9
            const idx = Math.floor(t * (pts.length - 1))
            const frac = t * (pts.length - 1) - idx
            const nxt = Math.min(idx + 1, pts.length - 1)
            const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
            const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
            const dx = (pts[nxt][0] - pts[idx][0]) * 0.12
            const dy = (pts[nxt][1] - pts[idx][1]) * 0.12
            ruts.push(`M${(px - dx).toFixed(1)},${(py - dy + 0.1).toFixed(1)}L${(px + dx).toFixed(1)},${(py + dy + 0.1).toFixed(1)}`)
          }
          for (let i = 0; i < 6; i++) {
            const t = rng()
            const idx = Math.floor(t * (pts.length - 1))
            const frac = t * (pts.length - 1) - idx
            const nxt = Math.min(idx + 1, pts.length - 1)
            const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
            const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
            const wr = 0.2 + rng() * 0.4
            wornPatches.push(`M${(px - wr).toFixed(1)},${py.toFixed(1)}a${wr.toFixed(2)},${(wr * 0.35).toFixed(2)} 0 1 1 ${(wr * 2).toFixed(2)},0a${wr.toFixed(2)},${(wr * 0.35).toFixed(2)} 0 1 1 -${(wr * 2).toFixed(2)},0Z`)
          }
          return <g>
            <path d={mainD} fill="none" stroke={dirtDark} strokeWidth="0.6" strokeLinecap="round" opacity={isDark ? 0.12 : 0.08} />
            <path d={mainD} fill="none" stroke={dirtBase} strokeWidth="0.35" strokeLinecap="round" opacity={isDark ? 0.2 : 0.14} />
            <path d={wornPatches.join('')} fill={dirtLight} opacity={isDark ? 0.06 : 0.04} />
            <path d={ruts.join('')} stroke={dirtDark} strokeWidth="0.08" fill="none" opacity={isDark ? 0.12 : 0.08} strokeLinecap="round" />
            <path d={pebbles.join('')} fill={dirtDark} opacity={isDark ? 0.15 : 0.1} />
            <path d={grassEdge.join('')} stroke={edgeGrass} strokeWidth="0.1" fill="none" opacity={isDark ? 0.18 : 0.1} />
            <path d={branchD} fill="none" stroke={dirtDark} strokeWidth="0.5" strokeLinecap="round" opacity={isDark ? 0.1 : 0.06} />
            <path d={branchD} fill="none" stroke={dirtBase} strokeWidth="0.25" strokeLinecap="round" opacity={isDark ? 0.18 : 0.12} />
            <path d={spurD} fill="none" stroke={dirtBase} strokeWidth="0.2" opacity={isDark ? 0.15 : 0.1} strokeLinecap="round" />
            <path d={house1D} fill="none" stroke={dirtDark} strokeWidth="0.35" strokeLinecap="round" opacity={isDark ? 0.08 : 0.05} />
            <path d={house1D} fill="none" stroke={dirtBase} strokeWidth="0.2" strokeLinecap="round" opacity={isDark ? 0.15 : 0.1} />
            <path d={house2D} fill="none" stroke={dirtDark} strokeWidth="0.3" strokeLinecap="round" opacity={isDark ? 0.08 : 0.05} />
            <path d={house2D} fill="none" stroke={dirtBase} strokeWidth="0.18" strokeLinecap="round" opacity={isDark ? 0.15 : 0.1} />
          </g>
        })()}

        {/* Back hill — tangerine trees along ridge */}
        {(() => {
          const trunks: string[] = []
          const branches: string[] = []
          const canopies: string[] = []
          const canopyDark: string[] = []
          const fruits: string[] = []
          const bushSeeds = [2,5,9,12,16,20,24,28,32,36,40,45,49,52,56,60,62,66,70,74,78,82,86,90,95,99,102,106,108,112,115,119,122,126,130,134,138,142,145,149,152,156,160,164,168,172,176,180,185,190,195,200]
          const trunkC = isDark ? '#2a1a0e' : '#5a3a1a'
          bushSeeds.forEach((bx, i) => {
            const rng = seededRng(i * 53 + 191)
            const sz = 0.35 + rng() * 0.45
            const by = (() => {
              if (bx < 70) return 36 - (bx + 10) * 10 / 80
              if (bx < 140) return 26 - (bx - 70) * 7 / 70
              return 19 + (bx - 140) * 10 / 70
            })() + 0.5
            const th = sz * 1.1
            const cy = by - th
            const lean = (rng() - 0.5) * 0.2
            const tx = bx + lean
            trunks.push(`M${bx.toFixed(1)},${by.toFixed(1)}Q${(bx + lean * 0.5).toFixed(1)},${(by - th * 0.5).toFixed(1)} ${tx.toFixed(1)},${(cy + sz * 0.2).toFixed(1)}`)
            const bdir = rng() > 0.5 ? 1 : -1
            branches.push(`M${tx.toFixed(1)},${(cy + sz * 0.5).toFixed(1)}Q${(tx + bdir * sz * 0.4).toFixed(1)},${(cy + sz * 0.2).toFixed(1)} ${(tx + bdir * sz * 0.6).toFixed(1)},${(cy + sz * 0.1).toFixed(1)}`)
            const r1 = sz * 0.9, r2 = sz * 0.7
            const wobble = rng() * 0.15
            canopies.push(`M${(tx - r1).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)}Q${(tx - r1 * 0.6).toFixed(1)},${(cy - r2 - wobble).toFixed(1)} ${tx.toFixed(1)},${(cy - r2).toFixed(1)}Q${(tx + r1 * 0.7).toFixed(1)},${(cy - r2 + wobble).toFixed(1)} ${(tx + r1).toFixed(1)},${(cy + r2 * 0.15).toFixed(1)}Q${(tx + r1 * 0.5).toFixed(1)},${(cy + r2 * 0.6).toFixed(1)} ${tx.toFixed(1)},${(cy + r2 * 0.4).toFixed(1)}Q${(tx - r1 * 0.4).toFixed(1)},${(cy + r2 * 0.5).toFixed(1)} ${(tx - r1).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)}Z`)
            canopyDark.push(`M${(tx + r1 * 0.2).toFixed(1)},${(cy + r2 * 0.3).toFixed(1)}Q${(tx + r1 * 0.6).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)} ${(tx + r1 * 0.8).toFixed(1)},${(cy + r2 * 0.15).toFixed(1)}`)
            const fruitCount = 4 + Math.floor(rng() * 5)
            for (let f = 0; f < fruitCount; f++) {
              const a = rng() * Math.PI * 2
              const d = r1 * (0.15 + rng() * 0.5)
              const fx = tx + Math.cos(a) * d, fy = cy + Math.sin(a) * d * (r2 / r1)
              fruits.push(`M${(fx + 0.05).toFixed(2)},${fy.toFixed(2)}a0.05,0.05 0 1 1 -0.10,0a0.05,0.05 0 1 1 0.10,0Z`)
            }
          })
          return <g opacity="0.35">
            <path d={trunks.join('')} stroke={trunkC} strokeWidth="0.3" fill="none" strokeLinecap="round" />
            <path d={branches.join('')} stroke={trunkC} strokeWidth="0.2" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d={canopies.join('')} fill={isDark ? '#1a3018' : '#3a6a30'} />
            <path d={canopyDark.join('')} stroke={isDark ? '#0e200c' : '#2a5020'} strokeWidth="0.2" fill="none" opacity="0.3" />
            <path d={fruits.join('')} fill={isDark ? '#b06810' : '#d97706'} opacity={0.4} />
          </g>
        })()}
        {/* Back hill — lake on slope */}
        {(() => {
          const lakeC = isDark ? '#0e1e2e' : '#5a8ab0'
          const shoreC = isDark ? '#1a2a1a' : '#6a8a5a'
          const sparkle = isDark ? 'rgba(120,180,255,0.12)' : 'rgba(255,255,255,0.25)'
          const mudC = isDark ? '#1a1a10' : '#7a7050'
          const rng = seededRng(8811)
          const cx = 30, cy = 33
          const shorePath = `M${cx - 10},${cy + 0.5} Q${cx - 8},${cy - 2.5} ${cx - 3},${cy - 2.8} Q${cx + 2},${cy - 3} ${cx + 6},${cy - 2} Q${cx + 9},${cy - 1} ${cx + 10},${cy + 0.8} Q${cx + 8},${cy + 2.5} ${cx + 4},${cy + 3} Q${cx - 1},${cy + 3.5} ${cx - 5},${cy + 2.8} Q${cx - 9},${cy + 2} ${cx - 10},${cy + 0.5}Z`
          const waterPath = `M${cx - 8.5},${cy + 0.3} Q${cx - 7},${cy - 2} ${cx - 2.5},${cy - 2.3} Q${cx + 2},${cy - 2.5} ${cx + 5},${cy - 1.5} Q${cx + 7.5},${cy - 0.5} ${cx + 8.5},${cy + 0.6} Q${cx + 7},${cy + 2} ${cx + 3.5},${cy + 2.5} Q${cx - 1},${cy + 3} ${cx - 4.5},${cy + 2.3} Q${cx - 7.5},${cy + 1.5} ${cx - 8.5},${cy + 0.3}Z`
          const deepPath = `M${cx - 5},${cy} Q${cx - 3},${cy - 1.2} ${cx},${cy - 1} Q${cx + 3},${cy - 0.8} ${cx + 5},${cy + 0.2} Q${cx + 3},${cy + 1.2} ${cx},${cy + 1.5} Q${cx - 3},${cy + 1.2} ${cx - 5},${cy}Z`
          const reeds: string[] = []
          for (let i = 0; i < 10; i++) {
            const a = rng() * Math.PI * 2
            const d = 8 + rng() * 3
            const rx = cx + Math.cos(a) * d
            const ry = cy + Math.sin(a) * d * 0.3
            const h = 0.5 + rng() * 0.7
            const sw = (rng() - 0.5) * 0.25
            reeds.push(`M${rx.toFixed(1)},${ry.toFixed(1)}q${sw.toFixed(2)},${(-h * 0.5).toFixed(2)} ${(sw * 0.3).toFixed(2)},${(-h).toFixed(2)}`)
          }
          const ripples: string[] = []
          for (let i = 0; i < 8; i++) {
            const rx = cx - 5 + rng() * 10
            const ry = cy - 1.5 + rng() * 3
            const w = 0.6 + rng() * 1.2
            ripples.push(`M${(rx - w).toFixed(1)},${ry.toFixed(1)}Q${rx.toFixed(1)},${(ry - 0.12).toFixed(2)} ${(rx + w).toFixed(1)},${ry.toFixed(1)}`)
          }
          const mudPts: string[] = []
          for (let i = 0; i < 6; i++) {
            const a = rng() * Math.PI * 2
            const d = 9 + rng() * 2
            const mx = cx + Math.cos(a) * d
            const my = cy + Math.sin(a) * d * 0.3
            const mr = 0.15 + rng() * 0.2
            mudPts.push(`M${(mx + mr).toFixed(2)},${my.toFixed(2)}a${mr.toFixed(2)},${(mr * 0.6).toFixed(2)} 0 1 1 -${(mr * 2).toFixed(2)},0a${mr.toFixed(2)},${(mr * 0.6).toFixed(2)} 0 1 1 ${(mr * 2).toFixed(2)},0Z`)
          }
          return <g>
            <path d={mudPts.join('')} fill={mudC} opacity={isDark ? 0.2 : 0.12} />
            <path d={shorePath} fill={shoreC} opacity={isDark ? 0.35 : 0.25} />
            <path d={waterPath} fill={lakeC} opacity={isDark ? 0.65 : 0.45} />
            <path d={deepPath} fill={isDark ? '#0a1828' : '#4a7aa0'} opacity={isDark ? 0.4 : 0.25} />
            <path d={ripples.join('')} stroke={sparkle} strokeWidth="0.12" fill="none" />
            <path d={reeds.join('')} stroke={isDark ? '#1a3018' : '#4a7a3a'} strokeWidth="0.2" fill="none" opacity="0.5" />
          </g>
        })()}
        {/* Back hill — grass tufts along contour */}
        {(() => {
          const tufts: string[] = []
          const bushPaths: string[] = []
          const bladesPaths: string[] = []
          const getBackY = (x: number) => {
            if (x < 70) return 36 - (x + 10) * 10 / 80
            if (x < 140) return 26 - (x - 70) * 7 / 70
            return 19 + (x - 140) * 10 / 70
          }
          for (let i = 0; i < 20; i++) {
            const rng = seededRng(i * 37 + 449)
            const x = -5 + rng() * 215
            const ridgeY = getBackY(x)
            const baseY = ridgeY + 1 + rng() * 5
            const h = 0.25 + rng() * 0.5
            tufts.push(`M${x.toFixed(1)},${baseY.toFixed(1)}l${(-0.15).toFixed(2)},${(-h).toFixed(2)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.08).toFixed(2)},${(-h * 0.9).toFixed(2)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.2).toFixed(2)},${(-h * 0.7).toFixed(2)}`)
          }
          for (let i = 0; i < 12; i++) {
            const rng = seededRng(i * 67 + 3311)
            const x = 5 + rng() * 200
            const ridgeY = getBackY(x)
            const by = ridgeY + 2 + rng() * 4
            const bw = 0.3 + rng() * 0.6
            const bh = 0.15 + rng() * 0.3
            bushPaths.push(`M${(x - bw).toFixed(1)},${by.toFixed(1)}Q${(x - bw * 0.3).toFixed(1)},${(by - bh * 1.5).toFixed(1)} ${x.toFixed(1)},${(by - bh).toFixed(1)}Q${(x + bw * 0.4).toFixed(1)},${(by - bh * 1.4).toFixed(1)} ${(x + bw).toFixed(1)},${by.toFixed(1)}Z`)
          }
          for (let i = 0; i < 15; i++) {
            const rng = seededRng(i * 51 + 7723)
            const x = 5 + rng() * 200
            const ridgeY = getBackY(x)
            const by = ridgeY + 1.5 + rng() * 5
            const bh = 0.4 + rng() * 0.7
            const curve = (rng() - 0.5) * 0.5
            bladesPaths.push(`M${x.toFixed(1)},${by.toFixed(1)}C${(x + curve * 0.2).toFixed(1)},${(by - bh * 0.3).toFixed(1)} ${(x + curve * 0.7).toFixed(1)},${(by - bh * 0.6).toFixed(1)} ${(x + curve * 0.5).toFixed(1)},${(by - bh).toFixed(1)}`)
          }
          return <>
            <path d={bushPaths.join('')} fill={isDark ? '#142810' : '#3a6a2e'} opacity={isDark ? 0.08 : 0.05} />
            <path d={tufts.join('')} stroke={isDark ? '#1e3818' : '#4a7a3a'} strokeWidth="0.2" fill="none" opacity={isDark ? 0.15 : 0.1} />
            <path d={bladesPaths.join('')} stroke={isDark ? '#1a3416' : '#3a6830'} strokeWidth="0.15" fill="none" opacity={isDark ? 0.12 : 0.08} />
          </>
        })()}

        {/* Distant orange grove — all orange trees on mid-hill contour */}
        {(() => {
          const midSegs: [number,number,number,number,number,number,number,number][] = [
            [-10,36, 10,34, 40,30, 70,26],
            [70,26, 90,22, 115,19, 140,19],
            [140,19, 160,20, 180,23, 200,26],
            [200,26, 205,27, 208,28, 210,29],
          ]
          const cubic = (t: number, p0: number, p1: number, p2: number, p3: number) => {
            const u = 1 - t
            return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3
          }
          const getHillY = (x: number) => {
            for (const s of midSegs) {
              if (x >= Math.min(s[0], s[6]) - 2 && x <= Math.max(s[0], s[6]) + 2) {
                for (let ti = 0; ti <= 20; ti++) {
                  const t = ti / 20
                  const sx = cubic(t, s[0], s[2], s[4], s[6])
                  if (Math.abs(sx - x) < 2) return cubic(t, s[1], s[3], s[5], s[7])
                }
              }
            }
            return 26
          }
          const shadows: string[] = []
          const trunks: string[] = []
          const branches: string[] = []
          const canopies: string[] = []
          const canopyDark: string[] = []
          const highlights: string[] = []
          const fruits: string[] = []
          const trunkColor = isDark ? '#2a1a0e' : '#5a3a1a'
          for (let i = 0; i < 80; i++) {
            const rng = seededRng(i * 71 + 303)
            const x = -5 + rng() * 210
            const baseY = getHillY(x) + rng() * 3 + 1.5
            const sz = 0.4 + rng() * 0.6
            const trunkH = sz * (1.2 + rng() * 0.4)
            const cy = baseY - trunkH
            const lean = (rng() - 0.5) * 0.3
            const tx = x + lean
            shadows.push(`M${(x - sz * 0.8).toFixed(1)},${baseY.toFixed(1)}a${(sz * 0.8).toFixed(1)},${(sz * 0.2).toFixed(1)} 0 1 0 ${(sz * 1.6).toFixed(1)},0a${(sz * 0.8).toFixed(1)},${(sz * 0.2).toFixed(1)} 0 1 0 ${(-sz * 1.6).toFixed(1)},0Z`)
            trunks.push(`M${x.toFixed(1)},${baseY.toFixed(1)}Q${(x + lean * 0.5).toFixed(1)},${(baseY - trunkH * 0.5).toFixed(1)} ${tx.toFixed(1)},${(cy + sz * 0.3).toFixed(1)}`)
            const bdir = rng() > 0.5 ? 1 : -1
            const bCount = 1 + Math.floor(rng() * 2)
            for (let b = 0; b < bCount; b++) {
              const bh = cy + sz * (0.3 + rng() * 0.4)
              const bd = b === 0 ? bdir : -bdir
              branches.push(`M${tx.toFixed(1)},${bh.toFixed(1)}Q${(tx + bd * sz * 0.4).toFixed(1)},${(bh - sz * 0.2).toFixed(1)} ${(tx + bd * sz * 0.7).toFixed(1)},${(bh - sz * 0.1).toFixed(1)}`)
            }
            const r1 = sz * (0.9 + rng() * 0.3)
            const r2 = sz * (0.7 + rng() * 0.2)
            const w1 = (rng() - 0.5) * r2 * 0.3
            const w2 = (rng() - 0.5) * r2 * 0.3
            canopies.push(`M${(tx - r1).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)}Q${(tx - r1 * 0.5).toFixed(1)},${(cy - r2 + w1).toFixed(1)} ${tx.toFixed(1)},${(cy - r2).toFixed(1)}Q${(tx + r1 * 0.6).toFixed(1)},${(cy - r2 + w2).toFixed(1)} ${(tx + r1).toFixed(1)},${(cy + r2 * 0.15).toFixed(1)}Q${(tx + r1 * 0.4).toFixed(1)},${(cy + r2 * 0.55).toFixed(1)} ${tx.toFixed(1)},${(cy + r2 * 0.4).toFixed(1)}Q${(tx - r1 * 0.35).toFixed(1)},${(cy + r2 * 0.5).toFixed(1)} ${(tx - r1).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)}Z`)
            canopyDark.push(`M${(tx + r1 * 0.15).toFixed(1)},${(cy + r2 * 0.25).toFixed(1)}Q${(tx + r1 * 0.5).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)} ${(tx + r1 * 0.7).toFixed(1)},${(cy + r2 * 0.15).toFixed(1)}`)
            const hx = tx - r1 * 0.3, hy = cy - r2 * 0.6
            highlights.push(`M${hx.toFixed(1)},${hy.toFixed(1)}a${(r1 * 0.3).toFixed(1)},${(r2 * 0.25).toFixed(1)} 0 1 1 ${(r1 * 0.5).toFixed(1)},${(r2 * 0.1).toFixed(1)}`)
            const fruitCount = 5 + Math.floor(rng() * 6)
            for (let f = 0; f < fruitCount; f++) {
              const a = rng() * Math.PI * 2
              const dist = (0.15 + rng() * 0.55) * r1
              const fx = tx + Math.cos(a) * dist
              const fy = cy + Math.sin(a) * dist * (r2 / r1) * 0.8
              const fr = 0.05 + rng() * 0.04
              fruits.push(`M${(fx + fr).toFixed(2)},${fy.toFixed(2)}a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 -${(fr * 2).toFixed(2)},0a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 ${(fr * 2).toFixed(2)},0Z`)
            }
          }
          return (
            <g opacity={p.groveOpacity}>
              <path d={shadows.join('')} fill="rgba(0,0,0,0.06)" />
              <path d={trunks.join('')} stroke={trunkColor} strokeWidth="0.35" fill="none" strokeLinecap="round" />
              <path d={branches.join('')} stroke={trunkColor} strokeWidth="0.2" fill="none" strokeLinecap="round" opacity="0.6" />
              <path d={canopies.join('')} fill={isDark ? '#163018' : '#2e5a2c'} />
              <path d={canopyDark.join('')} stroke={isDark ? '#0e200c' : '#1e4a1c'} strokeWidth="0.25" fill="none" opacity="0.25" />
              <path d={highlights.join('')} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
              <path d={fruits.join('')} fill={isDark ? '#b06810' : '#d97706'} opacity={0.7} />
              <path d={fruits.join('')} fill="none" stroke={isDark ? '#8a4e08' : '#b56a04'} strokeWidth="0.08" opacity={0.4} />
            </g>
          )
        })()}

        {/* Houses on mid hills — each unique, positioned on hill contour */}
        {/* House 1 — cottage with chimney, on back hill (x~90, y~28) */}
        <g transform="translate(90,28) scale(0.4) translate(-90,-28)">
          <ellipse cx="90" cy="28.2" rx="2.8" ry="0.4" fill="rgba(0,0,0,0.08)" />
          {/* Stone chimney — behind house */}
          <rect x="88.3" y="24.4" width="0.6" height="1.8" fill={isDark ? '#3a3a3e' : '#8a8a90'} />
          <rect x="88.2" y="24.2" width="0.8" height="0.3" fill={isDark ? '#444448' : '#9a9aa0'} />
          <line x1="88.3" y1="24.8" x2="88.9" y2="24.8" stroke={isDark ? '#2e2e32' : '#7a7a80'} strokeWidth="0.08" />
          <line x1="88.3" y1="25.3" x2="88.9" y2="25.3" stroke={isDark ? '#2e2e32' : '#7a7a80'} strokeWidth="0.08" />
          <line x1="88.3" y1="25.8" x2="88.9" y2="25.8" stroke={isDark ? '#2e2e32' : '#7a7a80'} strokeWidth="0.08" />
          {/* Front wall */}
          <path d="M87.8,28.1 L88,26.2 L91.5,26.2 L91.7,28.1 Z" fill={isDark ? '#3a3028' : '#b0987a'} />
          {/* Side wall */}
          <path d="M91.5,26.2 L92.8,26.6 L92.9,28.1 L91.7,28.1 Z" fill={isDark ? '#2e2418' : '#968060'} />
          {/* Windows */}
          <rect x="88.6" y="26.7" width="0.7" height="0.7" rx="0.08" fill={isDark ? '#5a4a20' : '#d4b870'} opacity="0.6" />
          <rect x="89.8" y="26.7" width="0.7" height="0.7" rx="0.08" fill={isDark ? '#5a4a20' : '#d4b870'} opacity="0.45" />
          {/* Door */}
          <rect x="90.8" y="26.8" width="0.6" height="1.3" rx="0.08" fill={isDark ? '#241a10' : '#5a4028'} />
          {/* Roof — covers front and side walls */}
          <polygon points="87.3,26.4 93.2,26.4 89.8,24.2" fill={isDark ? '#2a2018' : '#7a5838'} />
          <polygon points="89.8,24.2 93.2,26.4 89.8,26.4" fill={isDark ? '#221a14' : '#6a4a30'} />
          {/* Smoke — static wisps */}
          <g opacity="0.25">
            <ellipse cx="88.6" cy="23" rx="0.45" ry="0.25" fill={isDark ? '#4a4a55' : '#b5b5b8'} />
            <ellipse cx="88.5" cy="21.5" rx="0.6" ry="0.2" fill={isDark ? '#4a4a55' : '#b5b5b8'} opacity="0.15" />
            <ellipse cx="88.4" cy="20" rx="0.8" ry="0.18" fill={isDark ? '#4a4a55' : '#b5b5b8'} opacity="0.07" />
          </g>
        </g>

        {/* House 2 — tall tower, on back hill (x~130, y~24) */}
        <g transform="translate(131,24) scale(0.4) translate(-131,-24)">
          <ellipse cx="131" cy="24.5" rx="1.8" ry="0.3" fill="rgba(0,0,0,0.07)" />
          {/* Front wall */}
          <path d="M129.8,24.4 L129.9,22 L132,22 L132.1,24.4 Z" fill={isDark ? '#352a1c' : '#a89070'} />
          {/* Side wall */}
          <path d="M132,22 L132.8,22.3 L132.9,24.4 L132.1,24.4 Z" fill={isDark ? '#2a2014' : '#8a7458'} />
          {/* Window */}
          <rect x="130.4" y="22.5" width="0.5" height="0.5" rx="0.06" fill={isDark ? '#4a4020' : '#c8b068'} opacity="0.5" />
          {/* Door */}
          <path d="M130.8,24.4 L130.8,23.5 A0.4,0.4 0 0 1 131.6,23.5 L131.6,24.4 Z" fill={isDark ? '#1a1208' : '#4a3220'} />
          {/* Roof front face */}
          <polygon points="129.3,22 132.2,22 130.95,20" fill={isDark ? '#281e14' : '#6a4e30'} />
          {/* Roof side face */}
          <polygon points="132.2,22 133,22.3 130.95,20" fill={isDark ? '#221812' : '#5e4428'} />
        </g>

        {/* House 3 — wide barn with stone chimney, on back hill right slope (x~172, y~26) */}
        <g transform="translate(173,26) scale(0.4) translate(-173,-26)">
          <ellipse cx="173" cy="26.5" rx="2.5" ry="0.35" fill="rgba(0,0,0,0.06)" />
          {/* Stone chimney — behind house */}
          <rect x="174.2" y="22.8" width="0.7" height="2.3" fill={isDark ? '#3a3a3e' : '#8a8a90'} />
          <rect x="174.1" y="22.6" width="0.9" height="0.3" fill={isDark ? '#444448' : '#9a9aa0'} />
          <line x1="174.2" y1="23.3" x2="174.9" y2="23.3" stroke={isDark ? '#2e2e32' : '#7a7a80'} strokeWidth="0.08" />
          <line x1="174.2" y1="23.8" x2="174.9" y2="23.8" stroke={isDark ? '#2e2e32' : '#7a7a80'} strokeWidth="0.08" />
          <line x1="174.2" y1="24.3" x2="174.9" y2="24.3" stroke={isDark ? '#2e2e32' : '#7a7a80'} strokeWidth="0.08" />
          <line x1="174.55" y1="23" x2="174.55" y2="23.3" stroke={isDark ? '#2e2e32' : '#7a7a80'} strokeWidth="0.06" />
          <line x1="174.55" y1="23.8" x2="174.55" y2="24.3" stroke={isDark ? '#2e2e32' : '#7a7a80'} strokeWidth="0.06" />
          {/* Walls */}
          <path d="M170.5,26.3 L170.6,25.1 L175.2,25.1 L175.3,26.3 Z" fill={isDark ? '#38281a' : '#988060'} />
          <rect x="172" y="25.4" width="1.2" height="0.9" fill={isDark ? '#1e1408' : '#4a3018'} />
          <line x1="172.6" y1="25.4" x2="172.6" y2="26.3" stroke={isDark ? '#2a1e10' : '#5a3820'} strokeWidth="0.1" />
          <polygon points="171.2,25.3 171.8,25.3 171.5,25" fill={isDark ? '#1e1408' : '#4a3018'} />
          {/* Roof */}
          <polygon points="170,25.3 175.8,25.3 172.9,23.8" fill={isDark ? '#2a1e12' : '#6a4a2e'} />
          <polygon points="172.9,23.8 175.8,25.3 172.9,25.3" fill={isDark ? '#241a10' : '#5e4226'} />
          {/* Smoke — static wisps */}
          <g opacity="0.35">
            <ellipse cx="174.5" cy="21.5" rx="0.5" ry="0.3" fill={isDark ? '#4a4a55' : '#b5b5b8'} />
            <ellipse cx="174.4" cy="19.5" rx="0.8" ry="0.3" fill={isDark ? '#4a4a55' : '#b5b5b8'} opacity="0.2" />
            <ellipse cx="174.5" cy="17" rx="1.2" ry="0.3" fill={isDark ? '#4a4a55' : '#b5b5b8'} opacity="0.08" />
          </g>
        </g>

        {/* Windmills on front hill — bottom clipped behind ridge */}
        <defs>
          <clipPath id="front-hill-clip">
            <path d="M-10,0 L210,0 L210,34 C0,32 15,29 35,27 C50,26 60,27 75,30 C90,33 110,36 140,38 C165,38 190,38 210,38 L210,0 Z" />
          </clipPath>
        </defs>
        <g clipPath="url(#front-hill-clip)">
          {[{ x: 18, y: 28, s: 0.35 }, { x: 52, y: 26.5, s: 0.28 }, { x: 88, y: 32, s: 0.32 }].map((wm, wi) => (
            <g key={`fhwm-${wi}`} opacity={0.55}>{renderWindmill(wm, wi + 20)}</g>
          ))}
        </g>

        {/* Front hill — steep hump on left, drops low on right to reveal back hill */}
        <path d="M-10,34 C0,32 15,29 35,27 C50,26 60,27 75,30 C90,33 110,36 140,38 C165,38 190,38 210,38 L210,42 L-10,42 Z" fill="url(#hill-near)" />
        {/* Front hill — ridge highlight */}
        <path d="M-10,34 C0,32 15,29 35,27 C50,26 60,27 75,30 C90,33 110,36 140,38" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.3" />
        {/* Front hill — shadow band */}
        <path d="M-10,37 C0,36 15,34 35,33 C50,32 60,33 75,35 C90,37 110,39 140,40 L210,40 L210,42 L-10,42 Z" fill="rgba(0,0,0,0.05)" />
        {/* Front hill — contour texture lines */}
        <path d="M-10,35 C5,33 20,31 40,29 C55,28 65,29 80,32 C95,35 115,38 145,39" fill="none" stroke={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'} strokeWidth="0.2" />
        <path d="M-10,36 C5,35 20,33 40,31 C55,30 65,31 80,34 C95,36 115,39 145,40" fill="none" stroke={isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)'} strokeWidth="0.15" />
        {/* Front hill — rocks and wildflowers */}
        {(() => {
          const rocks: string[] = []
          const flowers: string[] = []
          for (let i = 0; i < 8; i++) {
            const rng = seededRng(i * 97 + 941)
            const rx = rng() * 130
            const ry = (() => {
              if (rx < 35) return 34 - (rx + 10) * 7 / 45
              if (rx < 75) return 27 + (rx - 35) * 3 / 40
              return 30 + (rx - 75) * 8 / 65
            })() + 0.5 + rng() * 2
            const w = 0.4 + rng() * 0.6, h = 0.25 + rng() * 0.35
            rocks.push(`M${(rx - w).toFixed(1)},${ry.toFixed(1)}Q${(rx - w * 0.2).toFixed(1)},${(ry - h).toFixed(1)} ${rx.toFixed(1)},${(ry - h * 0.9).toFixed(1)}Q${(rx + w * 0.3).toFixed(1)},${(ry - h).toFixed(1)} ${(rx + w).toFixed(1)},${ry.toFixed(1)}Z`)
          }
          for (let i = 0; i < 12; i++) {
            const rng = seededRng(i * 61 + 1013)
            const fx = rng() * 120
            const fy = (() => {
              if (fx < 35) return 34 - (fx + 10) * 7 / 45
              if (fx < 75) return 27 + (fx - 35) * 3 / 40
              return 30 + (fx - 75) * 8 / 65
            })() + 0.3 + rng() * 2.5
            flowers.push(`M${fx.toFixed(1)},${fy.toFixed(1)}a0.14,0.14 0 1 1 0.01,0Z`)
          }
          return <>
            <path d={rocks.join('')} fill={isDark ? '#1c1c1e' : '#929288'} opacity="0.22" />
            <path d={flowers.join('')} fill={isDark ? '#b07010' : '#e08010'} opacity="0.3" />
          </>
        })()}
        {/* Front hill — tangerine trees */}
        {(() => {
          const trunks: string[] = []
          const branches: string[] = []
          const canopies: string[] = []
          const canopyDark: string[] = []
          const fruits: string[] = []
          const seeds = [1,5,10,14,18,22,25,28,30,33,36,39,42,45,48,52,55,58,62,65,68,72,75,78,82,86,90,93,96,100]
          const trunkC = isDark ? '#2a1a0e' : '#5a3a1a'
          seeds.forEach((bx, i) => {
            const rng = seededRng(i * 67 + 331)
            const sz = 0.9 + rng() * 1.1
            const by = (() => {
              if (bx < 35) return 34 - (bx + 10) * 7 / 45
              if (bx < 75) return 27 + (bx - 35) * 3 / 40
              return 30 + (bx - 75) * 8 / 65
            })() + 0.3
            const th = sz * 1.3
            const cy = by - th
            const lean = (rng() - 0.5) * 0.3
            const tx = bx + lean
            trunks.push(`M${bx.toFixed(1)},${by.toFixed(1)}Q${(bx + lean * 0.4).toFixed(1)},${(by - th * 0.5).toFixed(1)} ${tx.toFixed(1)},${(cy + sz * 0.25).toFixed(1)}`)
            const bCount = 1 + Math.floor(rng() * 3)
            for (let b = 0; b < bCount; b++) {
              const bdir = rng() > 0.5 ? 1 : -1
              const bh = cy + sz * (0.2 + rng() * 0.5)
              branches.push(`M${tx.toFixed(1)},${bh.toFixed(1)}Q${(tx + bdir * sz * 0.35).toFixed(1)},${(bh - sz * 0.15).toFixed(1)} ${(tx + bdir * sz * 0.6).toFixed(1)},${(bh - sz * 0.05).toFixed(1)}`)
            }
            const r1 = sz * (0.85 + rng() * 0.3), r2 = sz * (0.65 + rng() * 0.25)
            const w1 = (rng() - 0.5) * r2 * 0.4
            const w2 = (rng() - 0.5) * r2 * 0.35
            canopies.push(`M${(tx - r1).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)}Q${(tx - r1 * 0.5).toFixed(1)},${(cy - r2 + w1).toFixed(1)} ${tx.toFixed(1)},${(cy - r2).toFixed(1)}Q${(tx + r1 * 0.6).toFixed(1)},${(cy - r2 + w2).toFixed(1)} ${(tx + r1).toFixed(1)},${(cy + r2 * 0.15).toFixed(1)}Q${(tx + r1 * 0.4).toFixed(1)},${(cy + r2 * 0.55).toFixed(1)} ${tx.toFixed(1)},${(cy + r2 * 0.4).toFixed(1)}Q${(tx - r1 * 0.35).toFixed(1)},${(cy + r2 * 0.5).toFixed(1)} ${(tx - r1).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)}Z`)
            canopyDark.push(`M${(tx + r1 * 0.1).toFixed(1)},${(cy + r2 * 0.2).toFixed(1)}Q${(tx + r1 * 0.5).toFixed(1)},${cy.toFixed(1)} ${(tx + r1 * 0.8).toFixed(1)},${(cy + r2 * 0.1).toFixed(1)}`)
            const fruitCount = 5 + Math.floor(rng() * 6)
            for (let f = 0; f < fruitCount; f++) {
              const a = rng() * Math.PI * 2
              const d = r1 * (0.15 + rng() * 0.55)
              const fx = tx + Math.cos(a) * d, fy = cy + Math.sin(a) * d * (r2 / r1)
              fruits.push(`M${(fx + 0.12).toFixed(2)},${fy.toFixed(2)}a0.12,0.12 0 1 1 -0.24,0a0.12,0.12 0 1 1 0.24,0Z`)
            }
          })
          return <g opacity="0.5">
            <path d={trunks.join('')} stroke={trunkC} strokeWidth="0.35" fill="none" strokeLinecap="round" />
            <path d={branches.join('')} stroke={trunkC} strokeWidth="0.2" fill="none" strokeLinecap="round" opacity="0.6" />
            <path d={canopies.join('')} fill={isDark ? '#1c3820' : '#3e7236'} />
            <path d={canopyDark.join('')} stroke={isDark ? '#0e2810' : '#2a5a24'} strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d={fruits.join('')} fill={isDark ? '#b06810' : '#d97706'} opacity={0.65} />
          </g>
        })()}
        {/* Front hill — grass tufts and brush */}
        {(() => {
          const tufts: string[] = []
          const bushPaths: string[] = []
          const bladesPaths: string[] = []
          const getFrontY = (x: number) => {
            if (x < 35) return 34 - (x + 10) * 7 / 45
            if (x < 75) return 27 + (x - 35) * 3 / 40
            return 30 + (x - 75) * 8 / 65
          }
          for (let i = 0; i < 18; i++) {
            const rng = seededRng(i * 41 + 557)
            const x = -5 + rng() * 150
            const ridgeY = getFrontY(x)
            const baseY = ridgeY + 1 + rng() * 4
            const h = 0.4 + rng() * 0.7
            tufts.push(`M${x.toFixed(1)},${baseY.toFixed(1)}l${(-0.25).toFixed(2)},${(-h).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.2).toFixed(1)},${(-h * 0.85).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.35).toFixed(2)},${(-h * 0.65).toFixed(1)}`)
          }
          for (let i = 0; i < 12; i++) {
            const rng = seededRng(i * 73 + 4411)
            const x = 0 + rng() * 140
            const ridgeY = getFrontY(x)
            const by = ridgeY + 2 + rng() * 4
            const bw = 0.4 + rng() * 0.8
            const bh = 0.2 + rng() * 0.4
            bushPaths.push(`M${(x - bw).toFixed(1)},${by.toFixed(1)}Q${(x - bw * 0.3).toFixed(1)},${(by - bh * 1.5).toFixed(1)} ${x.toFixed(1)},${(by - bh).toFixed(1)}Q${(x + bw * 0.4).toFixed(1)},${(by - bh * 1.4).toFixed(1)} ${(x + bw).toFixed(1)},${by.toFixed(1)}Z`)
          }
          for (let i = 0; i < 12; i++) {
            const rng = seededRng(i * 47 + 8833)
            const x = 0 + rng() * 140
            const ridgeY = getFrontY(x)
            const by = ridgeY + 1.5 + rng() * 5
            const bh = 0.5 + rng() * 0.9
            const curve = (rng() - 0.5) * 0.6
            bladesPaths.push(`M${x.toFixed(1)},${by.toFixed(1)}C${(x + curve * 0.2).toFixed(1)},${(by - bh * 0.3).toFixed(1)} ${(x + curve * 0.7).toFixed(1)},${(by - bh * 0.6).toFixed(1)} ${(x + curve * 0.5).toFixed(1)},${(by - bh).toFixed(1)}`)
          }
          return <>
            <path d={bushPaths.join('')} fill={isDark ? '#182c12' : '#3a6a2e'} opacity={isDark ? 0.2 : 0.12} />
            <path d={tufts.join('')} stroke={isDark ? '#223e1e' : '#527e42'} strokeWidth="0.22" fill="none" opacity="0.4" />
            <path d={bladesPaths.join('')} stroke={isDark ? '#1e3818' : '#3e6e34'} strokeWidth="0.16" fill="none" opacity="0.3" />
          </>
        })()}

        {/* Front hill — dirt paths */}
        {(() => {
          const mainPath = "M -5,35 C 5,33 12,30 22,28.5 C 30,27.5 38,27 45,27.5 C 55,28 62,29 72,31 C 82,33.5 90,36 100,37.5"
          const branchPath = "M 45,27.5 C 48,29 50,31 50,34 C 50,36.5 48,38.5 47,40"
          const branchPath2 = "M 72,31 C 75,33 76,35 75,38 C 74,39.5 73,40.5 72,41"
          const dirtBase = isDark ? '#2a2418' : '#8a7a5a'
          const dirtDark = isDark ? '#1a1408' : '#6a5030'
          const dirtLight = isDark ? '#342a1a' : '#a08a60'
          const edgeGrass = isDark ? '#1a2e14' : '#4a7a3a'
          const rng = seededRng(7733)
          const pebbles: string[] = []
          const grassEdge: string[] = []
          const ruts: string[] = []
          const pts = [[-5,35],[5,33],[12,30],[22,28.5],[30,27.5],[38,27],[45,27.5],[55,28],[62,29],[72,31],[82,33.5],[90,36],[100,37.5]]
          for (let i = 0; i < 12; i++) {
            const t = rng()
            const idx = Math.floor(t * (pts.length - 1))
            const frac = t * (pts.length - 1) - idx
            const nxt = Math.min(idx + 1, pts.length - 1)
            const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
            const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
            const ox = (rng() - 0.5) * 1.0
            const oy = (rng() - 0.5) * 0.5
            const pr = 0.05 + rng() * 0.08
            pebbles.push(`M${(px + ox + pr).toFixed(2)},${(py + oy).toFixed(2)}a${pr.toFixed(2)},${(pr * 0.7).toFixed(2)} 0 1 1 -${(pr * 2).toFixed(2)},0a${pr.toFixed(2)},${(pr * 0.7).toFixed(2)} 0 1 1 ${(pr * 2).toFixed(2)},0Z`)
          }
          for (let i = 0; i < 10; i++) {
            const t = rng()
            const idx = Math.floor(t * (pts.length - 1))
            const frac = t * (pts.length - 1) - idx
            const nxt = Math.min(idx + 1, pts.length - 1)
            const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
            const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
            const side = rng() > 0.5 ? 1 : -1
            const gx = px + side * (0.5 + rng() * 0.4)
            const gy = py + side * (0.12 + rng() * 0.2)
            const gh = 0.25 + rng() * 0.45
            const gsway = (rng() - 0.5) * 0.25
            grassEdge.push(`M${gx.toFixed(1)},${gy.toFixed(1)}q${gsway.toFixed(2)},${(-gh * 0.5).toFixed(2)} ${(gsway * 0.3).toFixed(2)},${(-gh).toFixed(2)}`)
          }
          for (let i = 0; i < 6; i++) {
            const t = 0.1 + rng() * 0.8
            const idx = Math.floor(t * (pts.length - 1))
            const frac = t * (pts.length - 1) - idx
            const nxt = Math.min(idx + 1, pts.length - 1)
            const px = pts[idx][0] + (pts[nxt][0] - pts[idx][0]) * frac
            const py = pts[idx][1] + (pts[nxt][1] - pts[idx][1]) * frac
            const dx = (pts[nxt][0] - pts[idx][0]) * 0.12
            const dy = (pts[nxt][1] - pts[idx][1]) * 0.12
            ruts.push(`M${(px - dx).toFixed(1)},${(py - dy + 0.12).toFixed(1)}L${(px + dx).toFixed(1)},${(py + dy + 0.12).toFixed(1)}`)
          }
          return <g>
            <path d={mainPath} fill="none" stroke={dirtDark} strokeWidth="0.7" strokeLinecap="round" opacity={isDark ? 0.12 : 0.08} />
            <path d={mainPath} fill="none" stroke={dirtBase} strokeWidth="0.4" strokeLinecap="round" opacity={isDark ? 0.22 : 0.15} />
            <path d={ruts.join('')} stroke={dirtDark} strokeWidth="0.08" fill="none" opacity={isDark ? 0.1 : 0.06} strokeLinecap="round" />
            <path d={pebbles.join('')} fill={dirtDark} opacity={isDark ? 0.12 : 0.08} />
            <path d={grassEdge.join('')} stroke={edgeGrass} strokeWidth="0.1" fill="none" opacity={isDark ? 0.15 : 0.1} />
            <path d={branchPath} fill="none" stroke={dirtDark} strokeWidth="0.5" strokeLinecap="round" opacity={isDark ? 0.1 : 0.06} />
            <path d={branchPath} fill="none" stroke={dirtBase} strokeWidth="0.3" strokeLinecap="round" opacity={isDark ? 0.18 : 0.12} />
            <path d={branchPath2} fill="none" stroke={dirtDark} strokeWidth="0.45" strokeLinecap="round" opacity={isDark ? 0.08 : 0.05} />
            <path d={branchPath2} fill="none" stroke={dirtBase} strokeWidth="0.25" strokeLinecap="round" opacity={isDark ? 0.18 : 0.1} />
          </g>
        })()}

        {/* Moon on arc */}
        {(() => {
          const nightHour = timeState.hour >= 18 ? timeState.hour - 18 : timeState.hour + 6
          const moonT = Math.max(0, Math.min(1, nightHour / 12))
          const t = moonT
          const mx = (1-t)*(1-t)*50 + 2*(1-t)*t*85 + t*t*120
          const my = (1-t)*(1-t)*16 + 2*(1-t)*t*0 + t*t*20
          const visible = timeState.hour >= 18 || timeState.hour < 6
          if (!visible) return null
          const horizonFade = t < 0.08 ? t / 0.08 : t > 0.92 ? (1 - t) / 0.08 : 1
          return (
            <g opacity={horizonFade} style={{ pointerEvents: 'none' }}>
              <defs>
                <radialGradient id="moon-glow-bg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c0cee0" stopOpacity="0.15" />
                  <stop offset="30%" stopColor="#a0b0c8" stopOpacity="0.06" />
                  <stop offset="70%" stopColor="#8090b0" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#8090b0" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="moon-face-bg" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#eef0f5" />
                  <stop offset="35%" stopColor="#e0e4ec" />
                  <stop offset="70%" stopColor="#cdd2dc" />
                  <stop offset="100%" stopColor="#b0b8c8" />
                </radialGradient>
                <mask id="moon-crescent-mask">
                  <circle cx={mx} cy={my} r="1.2" fill="white" />
                  <circle cx={mx + 0.9} cy={my - 0.1} r="1.1" fill="black" />
                </mask>
                <radialGradient id="moon-edge-glow" cx="20%" cy="45%" r="80%">
                  <stop offset="0%" stopColor="#f0f4ff" />
                  <stop offset="40%" stopColor="#dde4f0" />
                  <stop offset="100%" stopColor="#b8c4d8" />
                </radialGradient>
              </defs>
              <ellipse cx={mx} cy={my} rx="4" ry="2.8" fill="url(#moon-glow-bg)" />
              <circle cx={mx} cy={my} r="1.2" fill="url(#moon-edge-glow)" mask="url(#moon-crescent-mask)" />
              {/* Craters — subtle darkening baked into the surface */}
              <circle cx={mx - 0.4} cy={my - 0.2} r="0.15" fill="rgba(160,170,190,0.35)" mask="url(#moon-crescent-mask)" />
              <circle cx={mx - 0.2} cy={my + 0.33} r="0.1" fill="rgba(155,165,185,0.3)" mask="url(#moon-crescent-mask)" />
              <ellipse cx={mx - 0.57} cy={my + 0.03} rx="0.07" ry="0.05" fill="rgba(150,162,182,0.28)" mask="url(#moon-crescent-mask)" />
              <circle cx={mx - 0.3} cy={my - 0.5} r="0.06" fill="rgba(158,168,188,0.25)" mask="url(#moon-crescent-mask)" />
              <circle cx={mx - 0.1} cy={my - 0.07} r="0.08" fill="rgba(165,174,192,0.18)" mask="url(#moon-crescent-mask)" />
              <path d={`M${mx-0.37} ${my-1.1} Q${mx-0.73} ${my} ${mx-0.37} ${my+1.1}`} fill="none" stroke="rgba(240,245,255,0.06)" strokeWidth="0.08" mask="url(#moon-crescent-mask)" />
              {/* Wispy clouds around moon */}
              <ellipse cx={mx - 1.7} cy={my + 0.4} rx="1.5" ry="0.35" fill="rgba(180,195,220,0.08)" />
              <ellipse cx={mx - 0.9} cy={my + 0.27} rx="1.1" ry="0.25" fill="rgba(170,185,210,0.1)" />
              <ellipse cx={mx + 1.8} cy={my - 0.2} rx="2" ry="0.45" fill="rgba(175,190,215,0.07)" />
              <ellipse cx={mx + 1.1} cy={my + 0.9} rx="2.5" ry="0.6" fill="rgba(165,180,205,0.09)" />
              <ellipse cx={mx - 0.7} cy={my - 1.1} rx="1.5" ry="0.35" fill="rgba(180,192,218,0.06)" />
            </g>
          )
        })()}

        {/* Moonlight on hills */}
        {(() => {
          const isNight = timeState.hour >= 18 || timeState.hour < 6
          if (!isNight) return null
          const nightHour = timeState.hour >= 18 ? timeState.hour - 18 : timeState.hour + 6
          const moonT = Math.max(0, Math.min(1, nightHour / 12))
          const intensity = moonT < 0.15 ? moonT / 0.15 : moonT > 0.85 ? (1 - moonT) / 0.15 : 1
          const mx = (1-moonT)*(1-moonT)*50 + 2*(1-moonT)*moonT*85 + moonT*moonT*120
          const glowId = 'moonlight-hill-glow'
          return <g opacity={intensity} style={{ pointerEvents: 'none' }}>
            <defs>
              <radialGradient id={glowId} cx="50%" cy="20%" r="70%">
                <stop offset="0%" stopColor="rgba(200,220,255,0.35)" />
                <stop offset="25%" stopColor="rgba(180,205,240,0.22)" />
                <stop offset="55%" stopColor="rgba(160,190,230,0.1)" />
                <stop offset="80%" stopColor="rgba(140,175,220,0.03)" />
                <stop offset="100%" stopColor="rgba(120,160,210,0)" />
              </radialGradient>
              <clipPath id="moonlight-clip-back">
                <path d="M-10,36 C10,34 40,30 70,26 C90,22 115,19 140,19 C160,20 180,23 200,26 C205,27 208,28 210,29 L210,42 L-10,42 Z" />
              </clipPath>
              <clipPath id="moonlight-clip-front">
                <path d="M-10,34 C0,32 15,29 35,27 C50,26 60,27 75,30 C90,33 110,36 140,38 C165,38 190,38 210,38 L210,42 L-10,42 Z" />
              </clipPath>
              <clipPath id="moonlight-clip-field">
                <path d="M-5,38 Q20,39 50,38 Q80,37 100,38 Q130,39 160,38 Q185,39 205,38 L205,100 L-5,100 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#moonlight-clip-back)" opacity={0.12}>
              <ellipse cx={mx} cy="26" rx="55" ry="20" fill={`url(#${glowId})`} />
            </g>
            <g clipPath="url(#moonlight-clip-front)" opacity={0.25}>
              <ellipse cx={mx} cy="30" rx="50" ry="18" fill={`url(#${glowId})`} />
            </g>
          </g>
        })()}

        {/* Tangerine grove on near hills — placed on near-hill contour */}
        {(() => {
          // Front hill: M-10,34 C0,32 15,29 35,27 C50,26 60,27 75,30 C90,33 110,36 140,38 C165,38 190,38 210,38
          const nearSegs: [number,number,number,number,number,number,number,number][] = [
            [-10,34, 0,32, 15,29, 35,27],
            [35,27, 50,26, 60,27, 75,30],
            [75,30, 90,33, 110,36, 140,38],
            [140,38, 165,38, 190,38, 210,38],
          ]
          const cubicB = (t: number, p0: number, p1: number, p2: number, p3: number) => {
            const u = 1 - t
            return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3
          }
          const getNearY = (x: number) => {
            for (const s of nearSegs) {
              if (x >= Math.min(s[0], s[6]) - 2 && x <= Math.max(s[0], s[6]) + 2) {
                for (let ti = 0; ti <= 20; ti++) {
                  const t = ti / 20
                  const sx = cubicB(t, s[0], s[2], s[4], s[6])
                  if (Math.abs(sx - x) < 2) return cubicB(t, s[1], s[3], s[5], s[7])
                }
              }
            }
            return 32
          }
          const trunks: string[] = []
          const trunkBark: string[] = []
          const knots: string[] = []
          const branchesL: string[] = []
          const branchesR: string[] = []
          const subBranches: string[] = []
          const canopies: string[] = []
          const canopyShade: string[] = []
          const canopyHighlight: string[] = []
          const leafTexture: string[] = []
          const fruitStems: string[] = []
          const fruits: string[] = []
          const fruitShine: string[] = []
          const shadows: string[] = []
          const trunkC = isDark ? '#2a1a0e' : '#5a3a1a'
          const trunkD = isDark ? '#1a0e06' : '#3a2210'
          const canopyFills = isDark
            ? ['#1a3420', '#1c3622', '#16301c', '#203a26', '#142c18', '#1e3824']
            : ['#2e5a2a', '#326030', '#2a5424', '#386834', '#264e20', '#3c6c38']
          const canopyFillIdx: number[] = []
          for (let i = 0; i < 50; i++) {
            const rng = seededRng(i * 89 + 707)
            const x = -5 + rng() * 210
            const baseY = getNearY(x) + rng() * 2.5 + 0.8
            const sz = 0.8 + rng() * 1.6
            const th = sz * (1.2 + rng() * 0.5)
            const lean = (rng() - 0.5) * 0.25
            const tx = x + lean
            const cy = baseY - th
            const fillI = Math.floor(rng() * canopyFills.length)
            canopyFillIdx.push(fillI)
            const tw = sz * 0.1
            trunks.push(`M${(x - tw).toFixed(2)},${baseY.toFixed(1)}C${(x - tw * 0.7).toFixed(2)},${(baseY - th * 0.4).toFixed(1)} ${(tx - tw * 0.4).toFixed(2)},${(baseY - th * 0.7).toFixed(1)} ${tx.toFixed(1)},${(cy + sz * 0.2).toFixed(1)}L${(tx + tw * 0.8).toFixed(2)},${(cy + sz * 0.2).toFixed(1)}C${(tx + tw * 0.6).toFixed(2)},${(baseY - th * 0.6).toFixed(1)} ${(x + tw * 1.1).toFixed(2)},${(baseY - th * 0.3).toFixed(1)} ${(x + tw).toFixed(2)},${baseY.toFixed(1)}Z`)
            const barkY1 = baseY - th * (0.25 + rng() * 0.15)
            const barkY2 = baseY - th * (0.45 + rng() * 0.15)
            trunkBark.push(`M${(x - tw * 0.3).toFixed(2)},${barkY1.toFixed(1)}L${(x + tw * 0.5).toFixed(2)},${(barkY1 - sz * 0.05).toFixed(2)}`)
            trunkBark.push(`M${(x - tw * 0.2).toFixed(2)},${barkY2.toFixed(1)}L${(x + tw * 0.4).toFixed(2)},${(barkY2 + sz * 0.03).toFixed(2)}`)
            if (rng() > 0.5) {
              const knotY = baseY - th * (0.3 + rng() * 0.2)
              knots.push(`M${(x + tw * 0.3).toFixed(2)},${(knotY - sz * 0.04).toFixed(2)}a${(sz * 0.05).toFixed(2)},${(sz * 0.07).toFixed(2)} 0 1 1 -${(sz * 0.01).toFixed(3)},0Z`)
            }
            shadows.push(`M${(x - sz * 0.7).toFixed(1)},${baseY.toFixed(1)}a${(sz * 0.7).toFixed(1)},${(sz * 0.15).toFixed(1)} 0 1 0 ${(sz * 1.4).toFixed(1)},0a${(sz * 0.7).toFixed(1)},${(sz * 0.15).toFixed(1)} 0 1 0 -${(sz * 1.4).toFixed(1)},0Z`)
            const branchY = cy + sz * 0.3
            branchesL.push(`M${tx.toFixed(1)},${branchY.toFixed(1)}C${(tx - sz * 0.25).toFixed(1)},${(branchY - sz * 0.12).toFixed(1)} ${(tx - sz * 0.5).toFixed(1)},${(branchY - sz * 0.08).toFixed(1)} ${(tx - sz * 0.8).toFixed(1)},${(branchY + sz * 0.04).toFixed(1)}`)
            branchesR.push(`M${tx.toFixed(1)},${branchY.toFixed(1)}C${(tx + sz * 0.25).toFixed(1)},${(branchY - sz * 0.12).toFixed(1)} ${(tx + sz * 0.5).toFixed(1)},${(branchY - sz * 0.08).toFixed(1)} ${(tx + sz * 0.8).toFixed(1)},${(branchY + sz * 0.04).toFixed(1)}`)
            if (rng() > 0.35) {
              const sbDir = rng() > 0.5 ? 1 : -1
              const sbY = cy + sz * (0.05 + rng() * 0.25)
              subBranches.push(`M${(tx + sbDir * sz * 0.35).toFixed(1)},${(branchY - sz * 0.03).toFixed(1)}C${(tx + sbDir * sz * 0.5).toFixed(1)},${(sbY + sz * 0.08).toFixed(1)} ${(tx + sbDir * sz * 0.7).toFixed(1)},${sbY.toFixed(1)} ${(tx + sbDir * sz * 1.0).toFixed(1)},${(sbY - sz * 0.06).toFixed(1)}`)
            }
            const r1 = sz * (0.8 + rng() * 0.4)
            const r2 = sz * (0.6 + rng() * 0.3)
            const w1 = (rng() - 0.5) * r2 * 0.5
            const w2 = (rng() - 0.5) * r2 * 0.45
            const w3 = (rng() - 0.5) * r2 * 0.3
            const w4 = (rng() - 0.5) * r2 * 0.35
            const w5 = (rng() - 0.5) * r2 * 0.25
            const w6 = (rng() - 0.5) * r2 * 0.3
            canopies.push(`M${(tx - r1).toFixed(1)},${(cy + r2 * 0.15 + w3).toFixed(1)}Q${(tx - r1 * 0.7).toFixed(1)},${(cy - r2 * 0.4 + w5).toFixed(1)} ${(tx - r1 * 0.35).toFixed(1)},${(cy - r2 + w1).toFixed(1)}Q${(tx - r1 * 0.1).toFixed(1)},${(cy - r2 * 1.1).toFixed(1)} ${tx.toFixed(1)},${(cy - r2).toFixed(1)}Q${(tx + r1 * 0.15).toFixed(1)},${(cy - r2 * 1.05).toFixed(1)} ${(tx + r1 * 0.4).toFixed(1)},${(cy - r2 + w2).toFixed(1)}Q${(tx + r1 * 0.75).toFixed(1)},${(cy - r2 * 0.35 + w6).toFixed(1)} ${(tx + r1).toFixed(1)},${(cy + r2 * 0.1 + w4).toFixed(1)}Q${(tx + r1 * 0.5).toFixed(1)},${(cy + r2 * 0.55).toFixed(1)} ${(tx + r1 * 0.15).toFixed(1)},${(cy + r2 * 0.5).toFixed(1)}Q${tx.toFixed(1)},${(cy + r2 * 0.48).toFixed(1)} ${(tx - r1 * 0.15).toFixed(1)},${(cy + r2 * 0.5).toFixed(1)}Q${(tx - r1 * 0.45).toFixed(1)},${(cy + r2 * 0.55).toFixed(1)} ${(tx - r1).toFixed(1)},${(cy + r2 * 0.15 + w3).toFixed(1)}Z`)
            canopyShade.push(`M${(tx - r1 * 0.1).toFixed(1)},${(cy + r2 * 0.3).toFixed(1)}C${(tx + r1 * 0.2).toFixed(1)},${(cy + r2 * 0.5).toFixed(1)} ${(tx + r1 * 0.6).toFixed(1)},${(cy + r2 * 0.4).toFixed(1)} ${(tx + r1 * 0.8).toFixed(1)},${(cy + r2 * 0.15).toFixed(1)}`)
            canopyHighlight.push(`M${(tx - r1 * 0.5).toFixed(1)},${(cy - r2 * 0.5).toFixed(1)}C${(tx - r1 * 0.2).toFixed(1)},${(cy - r2 * 0.8).toFixed(1)} ${(tx + r1 * 0.1).toFixed(1)},${(cy - r2 * 0.7).toFixed(1)} ${(tx + r1 * 0.3).toFixed(1)},${(cy - r2 * 0.4).toFixed(1)}`)
            for (let lt = 0; lt < 3; lt++) {
              const la = rng() * Math.PI * 2
              const ld = r1 * (0.3 + rng() * 0.35)
              const lx = tx + Math.cos(la) * ld
              const ly = cy + Math.sin(la) * ld * (r2 / r1) * 0.8
              const lsz = sz * (0.15 + rng() * 0.15)
              leafTexture.push(`M${lx.toFixed(2)},${ly.toFixed(2)}Q${(lx + lsz * 0.5).toFixed(2)},${(ly - lsz * 0.3).toFixed(2)} ${(lx + lsz).toFixed(2)},${ly.toFixed(2)}`)
            }
            const fruitCount = 5 + Math.floor(rng() * 7)
            for (let f = 0; f < fruitCount; f++) {
              const fa = rng() * Math.PI * 2
              const fd = r1 * (0.1 + rng() * 0.6)
              const fx = tx + Math.cos(fa) * fd
              const fy = cy + Math.sin(fa) * fd * (r2 / r1)
              const fr = sz * 0.04 + rng() * sz * 0.035
              fruitStems.push(`M${fx.toFixed(2)},${(fy - fr).toFixed(2)}L${fx.toFixed(2)},${(fy - fr - sz * 0.08).toFixed(2)}`)
              fruits.push(`M${(fx + fr).toFixed(2)},${fy.toFixed(2)}a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 -${(fr * 2).toFixed(2)},0a${fr.toFixed(2)},${fr.toFixed(2)} 0 1 1 ${(fr * 2).toFixed(2)},0Z`)
              fruitShine.push(`M${(fx - fr * 0.3).toFixed(2)},${(fy - fr * 0.3).toFixed(2)}a${(fr * 0.25).toFixed(2)},${(fr * 0.25).toFixed(2)} 0 1 1 ${(fr * 0.01).toFixed(3)},0Z`)
            }
          }
          return (
            <g opacity={p.groveOpacity}>
              <path d={shadows.join('')} fill="rgba(0,0,0,0.06)" />
              <path d={trunks.join('')} fill={trunkC} />
              <path d={trunks.join('')} fill={trunkD} opacity="0.12" />
              <path d={trunkBark.join('')} stroke={trunkD} strokeWidth="0.15" fill="none" opacity="0.3" />
              <path d={knots.join('')} fill="#0a0604" opacity="0.45" />
              <path d={branchesL.join('')} stroke={trunkC} strokeWidth="0.3" fill="none" strokeLinecap="round" />
              <path d={branchesR.join('')} stroke={trunkC} strokeWidth="0.3" fill="none" strokeLinecap="round" />
              <path d={subBranches.join('')} stroke={trunkC} strokeWidth="0.18" fill="none" strokeLinecap="round" opacity="0.6" />
              {canopies.map((c, i) => <path key={i} d={c} fill={canopyFills[canopyFillIdx[i]]} />)}
              <path d={canopyShade.join('')} fill={isDark ? '#0e200c' : '#1e4a1c'} opacity="0.18" />
              <path d={canopyHighlight.join('')} fill={isDark ? '#2a4a22' : '#4a8a42'} opacity="0.12" />
              <path d={leafTexture.join('')} stroke={isDark ? '#142c10' : '#225018'} strokeWidth="0.15" fill="none" opacity="0.2" />
              <path d={fruitStems.join('')} stroke={isDark ? '#3a7a2a' : '#3a7a2a'} strokeWidth="0.1" fill="none" strokeLinecap="round" />
              <path d={fruits.join('')} fill={isDark ? '#b06810' : '#d97706'} />
              <path d={fruitShine.join('')} fill="rgba(255,255,255,0.25)" />
            </g>
          )
        })()}

        {/* Main field */}
        <path d="M-5,38 Q20,39 50,38 Q80,37 100,38 Q130,39 160,38 Q185,39 205,38 L205,100 L-5,100 Z" fill="url(#field-g)" />

        {/* Small wildflowers across main hill */}
        {(() => {
          const svgParts: string[] = []
          const stems: string[] = []
          const petalCols = isDark
            ? ['#d08520', '#c07010', '#e09830', '#b06a08']
            : ['#e88510', '#f09a20', '#d97706', '#f5a835']
          const centerCols = isDark
            ? ['#e8a840', '#d09020', '#e0a038', '#c88018']
            : ['#f5b840', '#f0a828', '#ffc038', '#e89820']
          for (let i = 0; i < 40; i++) {
            const rng = seededRng(i * 67 + 1237)
            const inField = rng() < 0.75
            const fx = inField ? 12 + rng() * 76 : 2 + rng() * 196
            const fy = inField ? 44 + rng() * 40 : 39 + rng() * 56
            const tillX = fx / 2
            if (tillX >= 14 && tillX <= 86 && fy >= 42 && fy <= 84) continue
            const ci = Math.floor(rng() * petalCols.length)
            const sh = 0.5 + rng() * 0.6
            const tx = fx + (rng() * 0.08 - 0.04)
            const ty = fy - sh
            const pr = 0.25 + rng() * 0.15
            const petals = 4 + Math.floor(rng() * 3)
            stems.push(`M${fx.toFixed(1)},${fy.toFixed(1)}L${tx.toFixed(2)},${ty.toFixed(2)}`)
            for (let p = 0; p < petals; p++) {
              const ang = (p / petals) * Math.PI * 2 + rng() * 0.3
              const px = tx + Math.cos(ang) * pr
              const py = ty + Math.sin(ang) * pr * 0.7
              svgParts.push(`<ellipse cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" rx="${(pr * 0.5).toFixed(2)}" ry="${(pr * 0.35).toFixed(2)}" fill="${petalCols[ci]}" transform="rotate(${(ang * 180 / Math.PI).toFixed(0)} ${px.toFixed(2)} ${py.toFixed(2)})" />`)
            }
            svgParts.push(`<circle cx="${tx.toFixed(2)}" cy="${ty.toFixed(2)}" r="${(pr * 0.25).toFixed(2)}" fill="${centerCols[ci]}" />`)
          }
          return <g opacity={isDark ? 0.5 : 0.4}>
            <path d={stems.join('')} stroke={isDark ? '#2a4a1a' : '#6a9a50'} strokeWidth="0.1" fill="none" opacity={0.5} />
            <g dangerouslySetInnerHTML={{ __html: svgParts.join('') }} />
          </g>
        })()}

        {/* Moonlight on main field */}
        {(() => {
          const isNight = timeState.hour >= 18 || timeState.hour < 6
          if (!isNight) return null
          const nightHour = timeState.hour >= 18 ? timeState.hour - 18 : timeState.hour + 6
          const moonT = Math.max(0, Math.min(1, nightHour / 12))
          const intensity = moonT < 0.15 ? moonT / 0.15 : moonT > 0.85 ? (1 - moonT) / 0.15 : 1
          const mx = (1-moonT)*(1-moonT)*50 + 2*(1-moonT)*moonT*85 + moonT*moonT*120
          return <g opacity={intensity} style={{ pointerEvents: 'none' }}>
            <rect x="-5" y="38" width="210" height="62" fill="rgba(160,185,220,0.06)" />
            <defs>
              <radialGradient id="moonlight-field-spot" cx="50%" cy="0%" r="100%">
                <stop offset="0%" stopColor="rgba(180,205,240,0.14)" />
                <stop offset="40%" stopColor="rgba(170,195,230,0.07)" />
                <stop offset="100%" stopColor="rgba(160,185,220,0)" />
              </radialGradient>
            </defs>
            <ellipse cx={mx} cy="38" rx="120" ry="50" fill="url(#moonlight-field-spot)" />
          </g>
        })()}

        {/* Field texture */}
        <path d="M0,50 Q50,48 100,50 Q150,52 200,50" fill="none" stroke="rgba(40,60,30,0.15)" strokeWidth="0.4" />
        <path d="M0,62 Q40,60 80,62 Q120,64 160,62 Q180,60 200,62" fill="none" stroke="rgba(40,60,30,0.12)" strokeWidth="0.35" />
        <path d="M0,74 Q60,72 120,74 Q160,76 200,74" fill="none" stroke="rgba(40,60,30,0.1)" strokeWidth="0.3" />
        <path d="M0,86 Q50,84.5 100,86 Q150,87.5 200,86" fill="none" stroke="rgba(40,60,30,0.08)" strokeWidth="0.25" />

        {/* Grass tufts and ground texture — baked */}
        {(() => {
          const grassC = isDark ? '#3a5a2e' : '#6a9a50'
          const grassL = isDark ? '#4a6a3a' : '#7aaa60'
          const grassD = isDark ? '#2a4a20' : '#5a8a40'
          const dirtC = isDark ? '#2a2418' : '#8a7a5a'
          const d1: string[] = []
          const d2: string[] = []
          const d3: string[] = []
          const patches: string[] = []
          const dirtSpots: string[] = []
          for (let i = 0; i < 40; i++) {
            const rng = seededRng(i * 53 + 101)
            const x = 6 + rng() * 188
            const y = 40 + rng() * 56
            const h = 0.4 + rng() * 0.7
            const sway = (rng() - 0.5) * 0.3
            d1.push(`M${x.toFixed(1)},${y.toFixed(1)}q${sway.toFixed(2)},${(-h * 0.5).toFixed(2)} ${(sway * 0.3).toFixed(2)},${(-h).toFixed(2)}`)
            d2.push(`M${(x + 0.15).toFixed(2)},${y.toFixed(1)}q${((rng() - 0.5) * 0.25).toFixed(2)},${(-h * 0.4).toFixed(2)} ${((rng() - 0.5) * 0.12).toFixed(2)},${(-h * 0.8).toFixed(2)}`)
            if (rng() > 0.5) {
              d3.push(`M${(x - 0.1).toFixed(2)},${y.toFixed(1)}q${((rng() - 0.5) * 0.2).toFixed(2)},${(-h * 0.3).toFixed(2)} ${((rng() - 0.5) * 0.1).toFixed(2)},${(-h * 0.6).toFixed(2)}`)
            }
          }
          for (let i = 0; i < 10; i++) {
            const rng = seededRng(i * 71 + 3311)
            const px = 10 + rng() * 180
            const py = 42 + rng() * 52
            const pw = 1.5 + rng() * 3
            const ph = 0.5 + rng() * 1.5
            patches.push(`M${(px - pw).toFixed(1)},${py.toFixed(1)}Q${(px - pw * 0.3).toFixed(1)},${(py - ph).toFixed(1)} ${px.toFixed(1)},${(py - ph * 0.8).toFixed(1)}Q${(px + pw * 0.4).toFixed(1)},${(py - ph).toFixed(1)} ${(px + pw).toFixed(1)},${py.toFixed(1)}Z`)
          }
          for (let i = 0; i < 8; i++) {
            const rng = seededRng(i * 93 + 5511)
            const dx = 10 + rng() * 180
            const dy = 42 + rng() * 52
            const dr = 0.3 + rng() * 0.5
            dirtSpots.push(`M${(dx + dr).toFixed(2)},${dy.toFixed(2)}a${dr.toFixed(2)},${(dr * 0.4).toFixed(2)} 0 1 1 -${(dr * 2).toFixed(2)},0a${dr.toFixed(2)},${(dr * 0.4).toFixed(2)} 0 1 1 ${(dr * 2).toFixed(2)},0Z`)
          }
          return (
            <g>
              <path d={patches.join('')} fill={grassD} opacity={isDark ? 0.08 : 0.05} />
              <path d={dirtSpots.join('')} fill={dirtC} opacity={isDark ? 0.06 : 0.04} />
              <path d={d1.join('')} stroke={grassC} strokeWidth="0.25" fill="none" opacity={isDark ? 0.18 : 0.12} />
              <path d={d2.join('')} stroke={grassL} strokeWidth="0.2" fill="none" opacity={isDark ? 0.14 : 0.09} />
              <path d={d3.join('')} stroke={grassD} strokeWidth="0.18" fill="none" opacity={isDark ? 0.12 : 0.07} />
            </g>
          )
        })()}

        {/* Fence — posts with cross rails, 2 gaps */}
        {(() => {
          const fenceColor = isDark ? '#4a3e28' : '#6a5a3a'
          const fenceLight = isDark ? '#5a4e32' : '#7a6a4a'
          const fenceOp = 1
          const posts = [6, 22, 38, 54, 70, 86, 102, 118, 134, 150, 166, 182, 196]
          const gapAfter = new Set([54, 134])
          return (
            <g>
              {posts.map((px, pi) => {
                const t = pi / (posts.length - 1)
                const yOff = t < 0.15 ? (0.15 - t) / 0.15 * 2.5 : t > 0.85 ? (t - 0.85) / 0.15 * 2.5 : 0
                const py = 38 + yOff
                return (
                  <g key={`fp-${px}`} opacity={fenceOp}>
                    <rect x={px - 0.3} y={py} width="0.6" height="2.2" rx="0.1" fill={fenceColor} />
                    <rect x={px - 0.15} y={py} width="0.2" height="2.2" fill={fenceLight} opacity="0.4" />
                    <rect x={px - 0.4} y={py - 0.2} width="0.8" height="0.3" rx="0.08" fill={fenceColor} />
                  </g>
                )
              })}
              {posts.slice(0, -1).map((px, i) => {
                const nx = posts[i + 1]
                if (gapAfter.has(px)) return null
                const t1 = i / (posts.length - 1)
                const t2 = (i + 1) / (posts.length - 1)
                const yOff1 = t1 < 0.15 ? (0.15 - t1) / 0.15 * 2.5 : t1 > 0.85 ? (t1 - 0.85) / 0.15 * 2.5 : 0
                const yOff2 = t2 < 0.15 ? (0.15 - t2) / 0.15 * 2.5 : t2 > 0.85 ? (t2 - 0.85) / 0.15 * 2.5 : 0
                return (
                  <g key={`fr-${px}`} opacity={fenceOp * 0.8}>
                    <line x1={px} y1={38.8 + yOff1} x2={nx} y2={38.8 + yOff2} stroke={fenceColor} strokeWidth="0.25" />
                    <line x1={px} y1={39.6 + yOff1} x2={nx} y2={39.6 + yOff2} stroke={fenceColor} strokeWidth="0.2" />
                    <line x1={px} y1={38.8 + yOff1} x2={nx} y2={38.8 + yOff2} stroke={fenceLight} strokeWidth="0.1" opacity="0.3" />
                  </g>
                )
              })}
            </g>
          )
        })()}

                {/* Lamppost */}
        {(() => {
          const lx = 170, ly = 46, sc = 0.65
          const iron = isDark ? '#3a3a3a' : '#4a4a4a'
          const ironD = isDark ? '#2a2a2a' : '#3a3a3a'
          const isNight = isDark
          const glass = isNight ? '#fbbf24' : '#8a8a82'
          const glassL = isNight ? '#fcd34d' : '#9a9a92'
          return (
            <g>
              <defs>
                <radialGradient id="lamp-glow" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor={glassL} stopOpacity="0.3" />
                  <stop offset="50%" stopColor={glass} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={glass} stopOpacity="0" />
                </radialGradient>
                <radialGradient id="lamp-wash-a" cx="30%" cy="45%" r="55%">
                  <stop offset="0%" stopColor={glassL} stopOpacity="0.09" />
                  <stop offset="30%" stopColor={glass} stopOpacity="0.05" />
                  <stop offset="65%" stopColor={glass} stopOpacity="0.02" />
                  <stop offset="100%" stopColor={glass} stopOpacity="0" />
                </radialGradient>
                <radialGradient id="lamp-wash-b" cx="55%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={glassL} stopOpacity="0.07" />
                  <stop offset="40%" stopColor={glass} stopOpacity="0.03" />
                  <stop offset="100%" stopColor={glass} stopOpacity="0" />
                </radialGradient>
                <radialGradient id="lamp-ground" cx="40%" cy="25%" r="55%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.07" />
                  <stop offset="40%" stopColor="#92400e" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="lamp-cone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={glassL} stopOpacity="0.14" />
                  <stop offset="35%" stopColor={glass} stopOpacity="0.04" />
                  <stop offset="100%" stopColor={glass} stopOpacity="0" />
                </linearGradient>
              </defs>
              {isNight && <>
              <ellipse cx={lx + 14} cy={ly} rx={42 * sc} ry={17 * sc} fill="url(#lamp-wash-a)" />
              <ellipse cx={lx + 22} cy={ly + 1} rx={30 * sc} ry={13 * sc} fill="url(#lamp-wash-b)" />
              <ellipse cx={lx + 8} cy={ly + 6} rx={20 * sc} ry={6 * sc} fill="url(#lamp-ground)" />
              <ellipse cx={lx + 20} cy={ly + 5} rx={16 * sc} ry={5 * sc} fill="url(#lamp-ground)" opacity="0.7" />
              <path d={`M${lx + 0.5},${ly - 7 * sc} L${lx - 4 * sc},${ly + 4 * sc} L${lx + 6 * sc},${ly + 4 * sc} Z`} fill="url(#lamp-cone)" opacity="0.5" />
              <circle cx={lx + 1.5 * sc} cy={ly - 7.5 * sc} r={5 * sc} fill="url(#lamp-glow)" />
              <circle cx={lx + 1.5 * sc} cy={ly - 7.5 * sc} r={2 * sc} fill={glassL} opacity="0.08" />
              </>}
              {/* Cast shadow */}
              {(() => {
                const dir = lx < lightX ? -1 : 1
                const stretch = Math.abs(lx - lightX) / 100
                const offX = dir * 8 * sc * (0.3 + stretch * 0.5)
                return <ellipse cx={lx + offX} cy={ly + 1 * sc} rx={4 * sc * (0.5 + stretch * 0.4)} ry={0.4 * sc} fill={`rgba(0,0,0,${shadowOp})`} />
              })()}
              {/* Pole */}
              <rect x={lx - 0.3 * sc} y={ly - 8 * sc} width={0.6 * sc} height={9 * sc} rx={0.15 * sc} fill={iron} />
              {/* Base */}
              <ellipse cx={lx} cy={ly + 1 * sc} rx={1.2 * sc} ry={0.4 * sc} fill={ironD} />
              {/* Arm */}
              <path d={`M${lx},${ly - 7.5 * sc} Q${lx + 0.8 * sc},${ly - 8.5 * sc} ${lx + 1.5 * sc},${ly - 8 * sc}`} stroke={iron} strokeWidth={0.3 * sc} fill="none" />
              {/* Lantern housing */}
              <rect x={lx + 0.8 * sc} y={ly - 8.5 * sc} width={1.4 * sc} height={1.8 * sc} rx={0.15 * sc} fill={ironD} />
              <rect x={lx + 0.95 * sc} y={ly - 8.3 * sc} width={1.1 * sc} height={1.4 * sc} rx={0.1 * sc} fill={glass} opacity="0.8" />
              <rect x={lx + 1.2 * sc} y={ly - 8.3 * sc} width={0.3 * sc} height={1.4 * sc} fill={glassL} opacity="0.4" />
              {/* Top cap */}
              <polygon points={`${lx + 0.6 * sc},${ly - 8.5 * sc} ${lx + 1.5 * sc},${ly - 9.2 * sc} ${lx + 2.4 * sc},${ly - 8.5 * sc}`} fill={iron} />
            </g>
          )
        })()}

        {/* Shopkeeper stall — scaled from BoutiqueView */}
        {(() => {
          const eyeC = isDark ? '#1a1410' : '#3a3020'
          return (
            <g transform="translate(10, 38) scale(0.065)" style={{ cursor: 'pointer', pointerEvents: 'all', filter: `drop-shadow(0px 2px 4px rgba(0,0,0,${isDark ? '0.2' : '0.1'}))` }} onClick={onOpenShop}>
              <defs>
                <radialGradient id="o-body-orch" cx="38%" cy="35%">
                  <stop offset="0%" stopColor="#e8a030" />
                  <stop offset="50%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#b06205" />
                </radialGradient>
              </defs>
              {/* Canopy poles */}
              <rect x="113" y="103" width="7" height="114" rx="2.5" fill={isDark ? '#3e3018' : '#a89878'} />
              <rect x="114" y="103" width="5" height="114" rx="2" fill={isDark ? '#5a4a32' : '#b8a888'} />
              <path d="M115 110 L118 110 M115 125 L118 125 M115 145 L118 145 M115 170 L118 170 M115 195 L118 195" stroke={isDark ? '#6a5a42' : '#c8b898'} strokeWidth="0.3" fill="none" />
              <path d="M113 132 L120 129 M113 148 L120 145 M113 162 L120 159 M113 178 L120 175" stroke={isDark ? '#7a6a4a' : '#b0a080'} strokeWidth="0.8" fill="none" />
              <circle cx="117" cy="150" r="1.2" fill={isDark ? '#7a6a4a' : '#b0a080'} />
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
              {/* String lights */}
              <path d="M117 125 Q200 158 283 125" stroke={isDark ? '#4a3a28' : '#8a7a60'} strokeWidth="0.5" fill="none" />
              {[130, 145, 160, 175, 190, 205, 220, 235, 250, 265].map((slx, sli) => {
                const t = (slx - 117) / (283 - 117)
                const sly = 125 + 2 * t * (1 - t) * 33
                return (
                  <g key={`osl-${sli}`}>
                    <line x1={slx} y1={sly} x2={slx} y2={sly + 4} stroke={isDark ? '#4a3a28' : '#8a7a60'} strokeWidth="0.3" />
                    <circle cx={slx} cy={sly + 4.5} r={1.4} fill="#d97706" opacity="0.8" />
                    <circle cx={slx} cy={sly + 4.5} r={0.6} fill="#f0c050" />
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
              {/* Lanterns */}
              <defs>
                <radialGradient id="lantern-glow-orch">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
                  <stop offset="25%" stopColor="#d97706" stopOpacity="0.18" />
                  <stop offset="50%" stopColor="#d97706" stopOpacity="0.07" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </radialGradient>
              </defs>
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
              <circle cx="140" cy="158" r="35" fill="url(#lantern-glow-orch)" />
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
              <circle cx="260" cy="158" r="35" fill="url(#lantern-glow-orch)" />
              <rect x="256" y="168" width="8" height="2" rx="0.5" fill={isDark ? '#3a3020' : '#988868'} />
              <circle cx="260" cy="171" r="1" fill={isDark ? '#3a3020' : '#988868'} />
              {/* The Orange (shopkeeper) */}
              <circle cx="200" cy="210" r="20" fill="url(#o-body-orch)" stroke={isDark ? '#1a1410' : '#8a7050'} strokeWidth="0.15" />
              <ellipse cx="194" cy="201" rx="5" ry="7" fill="#e0a830" opacity="0.35" transform="rotate(-15 194 201)" />
              <rect x="199" y="188" width="2.5" height="4" rx="1" fill="#4a6a2a" />
              <rect x="199.3" y="188.5" width="1.8" height="1.5" rx="0.5" fill="#5a7a3a" />
              <path d="M201.5 190 Q206 184 210 186 Q206 189 201.5 190" fill="#4a7a2a" />
              <path d="M201.5 190 Q206 185.5 209 186" stroke="#3a6a1a" strokeWidth="0.3" fill="none" />
              {/* Earrings */}
              <line x1="181" y1="212" x2="179" y2="215" stroke={isDark ? '#5a4a32' : '#b8a888'} strokeWidth="0.4" />
              <circle cx="179" cy="216" r="1.2" fill="#d97706" />
              <circle cx="179" cy="216" r="0.5" fill="#e8a030" />
              <line x1="219" y1="212" x2="221" y2="215" stroke={isDark ? '#5a4a32' : '#b8a888'} strokeWidth="0.4" />
              <circle cx="221" cy="216" r="1.2" fill="#d97706" />
              <circle cx="221" cy="216" r="0.5" fill="#e8a030" />
              {/* Eyes */}
              <circle cx="194" cy="207" r="2.5" fill={eyeC} />
              <circle cx="206" cy="207" r="2.5" fill={eyeC} />
              <circle cx="195" cy="205.8" r="1" fill="#fff" />
              <circle cx="207" cy="205.8" r="1" fill="#fff" />
              <circle cx="194.3" cy="206.8" r="0.5" fill="#fff" />
              <circle cx="206.3" cy="206.8" r="0.5" fill="#fff" />
              {/* Mouth */}
              <ellipse cx="200" cy="216" rx="2.2" ry="2.8" fill="#8a4a05" />
              <ellipse cx="200" cy="216" rx="1.5" ry="2" fill="#6a3a04" />
              {/* Cart body — 3D side face and bottom edge */}
              <path d="M300 218 L310 224 L310 268 L300 262 Z" fill={isDark ? '#2a2018' : '#7a6a4a'} />
              <path d="M100 262 L110 268 L310 268 L300 262 Z" fill={isDark ? '#221a12' : '#6a5a3a'} />
              <path d="M300 218 L310 224" stroke={isDark ? '#1a1408' : '#5a4a30'} strokeWidth="0.5" />
              <rect x="100" y="218" width="200" height="44" rx="3" fill={isDark ? '#3a2e20' : '#a09070'} />
              <rect x="100" y="218" width="200" height="10" rx="2" fill={isDark ? '#4a3a28' : '#b0a080'} />
              <path d="M110 220 Q130 221 150 220 Q170 219 190 220 Q210 221 230 220 Q260 219 290 220" stroke={isDark ? '#3e3018' : '#a89878'} strokeWidth="0.3" fill="none" />
              <path d="M115 224 Q135 225 155 224 Q180 223 200 224 Q230 225 260 224 Q280 223 295 224" stroke={isDark ? '#3e3018' : '#a89878'} strokeWidth="0.3" fill="none" />
              <circle cx="145" cy="222" r="1.5" fill={isDark ? '#3e3018' : '#a89878'} />
              <circle cx="145" cy="222" r="0.8" fill={isDark ? '#342a1c' : '#988868'} />
              <rect x="100" y="228" width="200" height="9" fill={isDark ? '#423626' : '#a89878'} />
              <path d="M108 231 Q140 232 170 231 Q200 230 240 231 Q270 232 295 231" stroke={isDark ? '#3a2e1e' : '#988868'} strokeWidth="0.3" fill="none" />
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
              {/* Top rail — 3D side */}
              <path d="M305 212 L315 218 L315 226 L305 220 Z" fill={isDark ? '#3a2a18' : '#8a7a58'} />
              <path d="M95 220 L105 226 L315 226 L305 220 Z" fill={isDark ? '#2a2014' : '#7a6a48'} />
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
              {/* Potted plant */}
              <ellipse cx="287" cy="211" rx="9" ry="2" fill={isDark ? '#1a1410' : '#a09070'} opacity="0.35" />
              <path d="M278 200 L280 212 L294 212 L296 200 Z" fill="#7a4a2a" />
              <path d="M278 200 L280 212 L287 212 L285 200 Z" fill="#8a5a3a" opacity="0.3" />
              <path d="M287 200 L287 212 L294 212 L296 200 Z" fill="#5a3a1a" opacity="0.2" />
              <rect x="277" y="198" width="20" height="3" rx="0.8" fill="#8a5a3a" />
              <rect x="277" y="198" width="20" height="1.5" rx="0.5" fill="#9a6a4a" opacity="0.4" />
              <path d="M278 200 L296 200" stroke="#6a3a1a" strokeWidth="0.5" />
              <ellipse cx="287" cy="200" rx="7" ry="1.5" fill={isDark ? '#3a2a18' : '#6a5a40'} />
              <path d="M287 200 Q284 193 281 189" stroke={isDark ? '#3a6a2a' : '#6a9a5a'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M281 189 Q279 187 277 188" fill={isDark ? '#3a6a2a' : '#6a9a5a'} />
              <path d="M287 200 Q287 192 287 187" stroke={isDark ? '#4a7a3a' : '#7aaa6a'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M287 187 Q286 185 285 186" fill={isDark ? '#4a7a3a' : '#7aaa6a'} />
              <path d="M287 187 Q288 185 289 186" fill={isDark ? '#3a6a2a' : '#6a9a5a'} />
              <path d="M287 200 Q290 193 293 189" stroke={isDark ? '#3a6a2a' : '#6a9a5a'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M293 189 Q295 187 297 188" fill={isDark ? '#3a6a2a' : '#6a9a5a'} />
              <path d="M287 194 Q289 192 291 193" fill={isDark ? '#4a7a3a' : '#7aaa6a'} />
              <path d="M284 192 Q282 193 281 192" fill={isDark ? '#3a6a2a' : '#6a9a5a'} />
              {/* Seed jars on counter */}
              {[[155,12,14],[170,14,12],[185,10,10],[240,13,12],[255,11,11]].map(([jx,jh,jw], si) => {
                const jy = 212 - jh
                return (
                  <g key={`oj-${si}`}>
                    <ellipse cx={jx} cy={211.5} rx={jw / 2 + 1} ry={1.2} fill={isDark ? '#1a1410' : '#a09070'} opacity="0.3" />
                    <rect x={jx - jw / 2} y={jy} width={jw} height={jh} rx={jw / 2 - 2} fill="#4a5a4a" opacity="0.5" stroke="#3a4a3a" strokeWidth="0.3" />
                    <rect x={jx - jw / 2 + 1} y={jy + 1} width={jw - 2} height={jh - 2} rx={jw / 2 - 2.5} fill="#3a4a3a" opacity="0.4" />
                    <rect x={jx - 3} y={jy - 3} width={6} height={3.5} rx={1.8} fill="#4a5a4a" opacity="0.5" />
                    <rect x={jx - 2.5} y={jy - 4.5} width={5} height={2.5} rx={1.2} fill={isDark ? '#6a5a42' : '#c8b898'} />
                  </g>
                )
              })}
              {/* Trade sign */}
              <line x1="200" y1="220" x2="200" y2="228" stroke={isDark ? '#4a3a28' : '#8a7a60'} strokeWidth="1" />
              <rect x="178" y="228" width="44" height="18" rx="2.5" fill={isDark ? '#3a3020' : '#988868'} stroke={isDark ? '#2a2418' : '#8a8070'} strokeWidth="0.4" />
              <path d="M182 232 Q200 231 218 232" stroke={isDark ? '#342a1c' : '#8a7a60'} strokeWidth="0.3" fill="none" />
              <path d="M182 238 Q200 237 218 238" stroke={isDark ? '#342a1c' : '#8a7a60'} strokeWidth="0.3" fill="none" />
              <circle cx="200" cy="229" r="0.8" fill={isDark ? '#4a3a28' : '#8a7a60'} />
              {/* Root arms */}
              <path d="M186 212 Q174 213 164 214 Q156 215 150 216" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M150 216 Q146 218 144 222 Q142 228 141 235 Q140 242 140 248" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M140 248 Q139 252 139 255" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.1" fill="none" strokeLinecap="round" />
              <path d="M140 248 Q141 252 142 254" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="0.9" fill="none" strokeLinecap="round" />
              <path d="M168 214 Q164 211 160 208" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.1" fill="none" strokeLinecap="round" />
              <path d="M160 208 Q158 206 156 205" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.7" fill="none" strokeLinecap="round" />
              <path d="M214 212 Q226 213 236 214 Q244 215 250 216" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M250 216 Q254 218 256 222 Q258 228 259 235 Q260 242 260 248" stroke={isDark ? '#5a3e1e' : '#8a7050'} strokeWidth="1.6" fill="none" strokeLinecap="round" />
              <path d="M260 248 Q261 252 261 255" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M260 248 Q259 252 258 255" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1" fill="none" strokeLinecap="round" />
              <path d="M232 214 Q234 210 236 207" stroke={isDark ? '#4a3218' : '#7a6040'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M236 207 Q237 205 238 203" stroke={isDark ? '#3e2a14' : '#6a5030'} strokeWidth="0.8" fill="none" strokeLinecap="round" />
              {/* Cast shadow */}
              {(() => {
                const stallWorldX = 10 + 175 * 0.065
                const dir = stallWorldX < lightX ? -1 : 1
                const stretch = Math.abs(stallWorldX - lightX) / 100
                const offX = dir * 60 * (0.3 + stretch * 0.5)
                return <ellipse cx={175 + offX} cy="268" rx={70 + stretch * 40} ry="6" fill={`rgba(0,0,0,${shadowOp})`} />
              })()}
            </g>
          )
        })()}

        {/* Left lamppost — mirrored, lamp points outward (left), over shop */}
        {(() => {
          const lx = 22, ly = 42, sc = 0.65
          const iron = isDark ? '#3a3a3a' : '#4a4a4a'
          const ironD = isDark ? '#2a2a2a' : '#3a3a3a'
          const isNight = isDark
          const glass = isNight ? '#fbbf24' : '#8a8a82'
          const glassL = isNight ? '#fcd34d' : '#9a9a92'
          return (
            <g>
              {isNight && <>
              <ellipse cx={lx - 14} cy={ly} rx={42 * sc} ry={17 * sc} fill="url(#lamp-wash-a)" />
              <ellipse cx={lx - 22} cy={ly + 1} rx={30 * sc} ry={13 * sc} fill="url(#lamp-wash-b)" />
              <ellipse cx={lx - 8} cy={ly + 6} rx={20 * sc} ry={6 * sc} fill="url(#lamp-ground)" />
              <ellipse cx={lx - 20} cy={ly + 5} rx={16 * sc} ry={5 * sc} fill="url(#lamp-ground)" opacity="0.7" />
              <path d={`M${lx - 0.5},${ly - 7 * sc} L${lx + 4 * sc},${ly + 4 * sc} L${lx - 6 * sc},${ly + 4 * sc} Z`} fill="url(#lamp-cone)" opacity="0.5" />
              <circle cx={lx - 1.5 * sc} cy={ly - 7.5 * sc} r={5 * sc} fill="url(#lamp-glow)" />
              <circle cx={lx - 1.5 * sc} cy={ly - 7.5 * sc} r={2 * sc} fill={glassL} opacity="0.08" />
              </>}
              {/* Cast shadow */}
              {(() => {
                const dir = lx < lightX ? -1 : 1
                const stretch = Math.abs(lx - lightX) / 100
                const offX = dir * 8 * sc * (0.3 + stretch * 0.5)
                return <ellipse cx={lx + offX} cy={ly + 1 * sc} rx={4 * sc * (0.5 + stretch * 0.4)} ry={0.4 * sc} fill={`rgba(0,0,0,${shadowOp})`} />
              })()}
              {/* Pole */}
              <rect x={lx - 0.3 * sc} y={ly - 8 * sc} width={0.6 * sc} height={9 * sc} rx={0.15 * sc} fill={iron} />
              {/* Base */}
              <ellipse cx={lx} cy={ly + 1 * sc} rx={1.2 * sc} ry={0.4 * sc} fill={ironD} />
              {/* Arm — flipped to point left */}
              <path d={`M${lx},${ly - 7.5 * sc} Q${lx - 0.8 * sc},${ly - 8.5 * sc} ${lx - 1.5 * sc},${ly - 8 * sc}`} stroke={iron} strokeWidth={0.3 * sc} fill="none" />
              {/* Lantern housing — flipped */}
              <rect x={lx - 2.2 * sc} y={ly - 8.5 * sc} width={1.4 * sc} height={1.8 * sc} rx={0.15 * sc} fill={ironD} />
              <rect x={lx - 2.05 * sc} y={ly - 8.3 * sc} width={1.1 * sc} height={1.4 * sc} rx={0.1 * sc} fill={glass} opacity="0.8" />
              <rect x={lx - 1.5 * sc} y={ly - 8.3 * sc} width={0.3 * sc} height={1.4 * sc} fill={glassL} opacity="0.4" />
              {/* Top cap — flipped */}
              <polygon points={`${lx - 0.6 * sc},${ly - 8.5 * sc} ${lx - 1.5 * sc},${ly - 9.2 * sc} ${lx - 2.4 * sc},${ly - 8.5 * sc}`} fill={iron} />
            </g>
          )
        })()}

        {/* Dirt ground and flowers around windmills */}
        {(() => {
          const dirtBase = isDark ? '#2a2418' : '#8a7a5a'
          const dirtDark = isDark ? '#1a1408' : '#6a5030'
          const rng = seededRng(6677)
          const petalCols = isDark
            ? ['#d08520', '#c07010', '#e09830', '#b06a08']
            : ['#e88510', '#f09a20', '#d97706', '#f5a835']
          const centerCols = isDark
            ? ['#e8a840', '#d09020', '#e0a038', '#c88018']
            : ['#f5b840', '#f0a828', '#ffc038', '#e89820']
          const flowerSvg: string[] = []
          const flowerStems: string[] = []
          const spots: [number, number][] = [
            [168, 44], [171, 40], [175, 38], [180, 42], [183, 39],
            [186, 44], [190, 40], [193, 38], [197, 41], [201, 43],
            [174, 50], [180, 52], [186, 50], [192, 48], [198, 50],
            [160, 50], [184, 46], [196, 45], [203, 40], [166, 42],
          ]
          for (let i = 0; i < spots.length; i++) {
            const [bx, by] = spots[i]
            const sr = seededRng(i * 43 + 8899)
            const ci = Math.floor(sr() * petalCols.length)
            const sz = 0.25 + sr() * 0.2
            const sh = 0.5 + sr() * 0.5
            const tx = bx + (sr() * 0.1 - 0.05)
            const ty = by - sh
            const petals = 4 + Math.floor(sr() * 3)
            flowerStems.push(`M${bx.toFixed(1)},${by.toFixed(1)}L${tx.toFixed(2)},${ty.toFixed(2)}`)
            for (let p = 0; p < petals; p++) {
              const ang = (p / petals) * Math.PI * 2 + sr() * 0.3
              const px = tx + Math.cos(ang) * sz
              const py = ty + Math.sin(ang) * sz * 0.7
              flowerSvg.push(`<ellipse cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" rx="${(sz * 0.5).toFixed(2)}" ry="${(sz * 0.35).toFixed(2)}" fill="${petalCols[ci]}" transform="rotate(${(ang * 180 / Math.PI).toFixed(0)} ${px.toFixed(2)} ${py.toFixed(2)})" />`)
            }
            flowerSvg.push(`<circle cx="${tx.toFixed(2)}" cy="${ty.toFixed(2)}" r="${(sz * 0.25).toFixed(2)}" fill="${centerCols[ci]}" />`)
          }
          return <g>
            <g opacity={isDark ? 0.5 : 0.4}>
              <path d={flowerStems.join('')} stroke={isDark ? '#2a4a1a' : '#6a9a50'} strokeWidth="0.1" fill="none" opacity={0.5} />
              <g dangerouslySetInnerHTML={{ __html: flowerSvg.join('') }} />
            </g>
          </g>
        })()}

                {/* Foreground windmills */}
        {[{ x: 178, y: 44, s: 0.95 }, { x: 194, y: 42, s: 0.75 }].map((wm, wi) => renderWindmill(wm, wi))}

        {/* Sap barrels around foreground windmills */}
        {(() => {
          const bC = isDark ? '#2e2418' : '#5a4a32'
          const bL = isDark ? '#3a3020' : '#6a5a40'
          const bD = isDark ? '#2a2016' : '#50402a'
          const bDL = isDark ? '#342a1e' : '#5a4a34'
          const bStrap = isDark ? '#1e1a12' : '#3a3020'
          const sapColor = isDark ? '#b06810' : '#d97706'
          const sapDark = isDark ? '#8a5008' : '#b56a04'
          const barrels = [
            { cx: 172, bot: 58, rx: 1.3, h: 3.6, open: false },
            { cx: 174.5, bot: 57.5, rx: 1.1, h: 3.2, open: true },
            { cx: 188, bot: 55, rx: 1, h: 2.8, open: false },
            { cx: 195, bot: 54, rx: 1.1, h: 3, open: true },
          ]
          return (
            <g>
              {barrels.map((b, bi) => {
                const top = b.bot - b.h
                const midY = top + b.h * 0.4
                const fill = bi % 2 === 0 ? bC : bD
                const lid = bi % 2 === 0 ? bL : bDL
                return (
                  <g key={`barrel-${bi}`}>
                    {/* Barrel body — flat bottom */}
                    <rect x={b.cx - b.rx} y={top + 0.3} width={b.rx * 2} height={b.h - 0.3} rx={0.15} fill={fill} />
                    {/* Slight bulge via wider middle */}
                    <ellipse cx={b.cx} cy={top + b.h * 0.5} rx={b.rx + 0.15} ry={b.h * 0.35} fill={fill} />
                    {/* Bottom flat edge */}
                    <line x1={b.cx - b.rx + 0.1} y1={b.bot} x2={b.cx + b.rx - 0.1} y2={b.bot} stroke={bi % 2 === 0 ? bStrap : bStrap} strokeWidth="0.2" />
                    {/* Metal straps */}
                    <line x1={b.cx - b.rx - 0.05} y1={top + b.h * 0.25} x2={b.cx + b.rx + 0.05} y2={top + b.h * 0.25} stroke={bStrap} strokeWidth="0.2" />
                    <line x1={b.cx - b.rx - 0.05} y1={top + b.h * 0.75} x2={b.cx + b.rx + 0.05} y2={top + b.h * 0.75} stroke={bStrap} strokeWidth="0.2" />
                    {/* Plank lines */}
                    <line x1={b.cx - 0.4} y1={top + 0.3} x2={b.cx - 0.4} y2={b.bot} stroke={isDark ? 'rgba(60,50,35,0.2)' : 'rgba(80,60,40,0.1)'} strokeWidth="0.1" />
                    <line x1={b.cx + 0.4} y1={top + 0.3} x2={b.cx + 0.4} y2={b.bot} stroke={isDark ? 'rgba(60,50,35,0.2)' : 'rgba(80,60,40,0.1)'} strokeWidth="0.1" />
                    {b.open ? (
                      <>
                        {/* Outer rim */}
                        <ellipse cx={b.cx} cy={top + 0.3} rx={b.rx + 0.08} ry={0.45} fill={lid} />
                        {/* Inner wall shadow — dark ring */}
                        <ellipse cx={b.cx} cy={top + 0.32} rx={b.rx - 0.1} ry={0.35} fill={isDark ? '#1a1208' : '#3a2a18'} />
                        {/* Sap pool */}
                        <ellipse cx={b.cx} cy={top + 0.35} rx={b.rx - 0.2} ry={0.28} fill={sapDark} />
                        {/* Sap surface highlight — off-center for depth */}
                        <ellipse cx={b.cx - 0.15} cy={top + 0.3} rx={b.rx * 0.5} ry={0.18} fill={sapColor} opacity="0.7" />
                        {/* Specular glint */}
                        <ellipse cx={b.cx - 0.35} cy={top + 0.18} rx={0.18} ry={0.06} fill="rgba(255,240,200,0.5)" />
                        {/* Subtle ripple */}
                        <ellipse cx={b.cx + 0.2} cy={top + 0.38} rx={0.3} ry={0.08} fill="none" stroke={sapColor} strokeWidth="0.05" opacity="0.4" />
                        {/* Rim thickness — top edge highlight */}
                        <path d={`M${b.cx - b.rx},${top + 0.3} A${b.rx},0.45 0 0 1 ${b.cx + b.rx},${top + 0.3}`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)'} strokeWidth="0.12" />
                        {/* Wood grain on inner wall visible above sap */}
                        <path d={`M${b.cx - b.rx + 0.15},${top + 0.15} Q${b.cx},${top - 0.05} ${b.cx + b.rx - 0.15},${top + 0.15}`} fill="none" stroke={isDark ? 'rgba(60,50,35,0.15)' : 'rgba(80,60,40,0.1)'} strokeWidth="0.06" />
                      </>
                    ) : (
                      <>
                        {/* Closed lid */}
                        <ellipse cx={b.cx} cy={top + 0.3} rx={b.rx} ry={0.4} fill={lid} />
                        {/* Lid planks */}
                        <line x1={b.cx - b.rx + 0.2} y1={top + 0.3} x2={b.cx + b.rx - 0.2} y2={top + 0.3} stroke={isDark ? 'rgba(60,50,35,0.25)' : 'rgba(80,60,40,0.12)'} strokeWidth="0.08" />
                        {/* Center knob */}
                        <circle cx={b.cx} cy={top + 0.3} r={0.15} fill={fill} />
                        {/* Rim highlight */}
                        <path d={`M${b.cx - b.rx},${top + 0.3} A${b.rx},0.4 0 0 1 ${b.cx + b.rx},${top + 0.3}`} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'} strokeWidth="0.1" />
                      </>
                    )}
                    {/* Ground shadow */}
                    {(() => {
                      const dir = b.cx < lightX ? -1 : 1
                      const stretch = Math.abs(b.cx - lightX) / 100
                      const offX = dir * (b.rx + 0.3) * (0.2 + stretch * 0.4)
                      return <ellipse cx={b.cx + offX} cy={b.bot + 0.2} rx={b.rx + 0.3 + stretch * 0.3} ry={0.2} fill={`rgba(0,0,0,${shadowOp})`} />
                    })()}
                  </g>
                )
              })}
              {/* Cart off to the right */}
              {/* Cart bed */}
              <rect x={197} y={52.5} width={7} height={2.8} rx={0.3} fill={isDark ? '#2e2418' : '#6a5a3a'} />
              <rect x={197} y={52.5} width={7} height={0.5} rx={0.2} fill={isDark ? '#3a3020' : '#7a6a4a'} />
              {/* Plank lines */}
              <line x1={199} y1={52.5} x2={199} y2={55.3} stroke={isDark ? 'rgba(60,50,35,0.3)' : 'rgba(80,60,40,0.15)'} strokeWidth="0.15" />
              <line x1={201} y1={52.5} x2={201} y2={55.3} stroke={isDark ? 'rgba(60,50,35,0.3)' : 'rgba(80,60,40,0.15)'} strokeWidth="0.15" />
              <line x1={202.5} y1={52.5} x2={202.5} y2={55.3} stroke={isDark ? 'rgba(60,50,35,0.3)' : 'rgba(80,60,40,0.15)'} strokeWidth="0.15" />
              {/* Wheels */}
              <circle cx={198.5} cy={56} r={1.2} fill="none" stroke={isDark ? '#2a2016' : '#4a3a28'} strokeWidth="0.5" />
              <circle cx={198.5} cy={56} r={0.3} fill={isDark ? '#2a2016' : '#4a3a28'} />
              <circle cx={202.5} cy={56} r={1.2} fill="none" stroke={isDark ? '#2a2016' : '#4a3a28'} strokeWidth="0.5" />
              <circle cx={202.5} cy={56} r={0.3} fill={isDark ? '#2a2016' : '#4a3a28'} />
              {/* Wheel spokes */}
              {[0, 60, 120].map(a => {
                const rad = a * Math.PI / 180
                return <g key={`sp-${a}`}>
                  <line x1={198.5} y1={56} x2={198.5 + Math.cos(rad) * 1} y2={56 + Math.sin(rad) * 1} stroke={isDark ? '#2a2016' : '#4a3a28'} strokeWidth="0.15" />
                  <line x1={202.5} y1={56} x2={202.5 + Math.cos(rad) * 1} y2={56 + Math.sin(rad) * 1} stroke={isDark ? '#2a2016' : '#4a3a28'} strokeWidth="0.15" />
                </g>
              })}
              {/* Hitch bar */}
              <line x1={197} y1={54} x2={195} y2={54.5} stroke={isDark ? '#2a2016' : '#5a4a32'} strokeWidth="0.4" strokeLinecap="round" />
              {/* Barrel on cart */}
              <ellipse cx={200.5} cy={52} rx={1.2} ry={0.9} fill={bC} />
              <ellipse cx={200.5} cy={51.3} rx={1.2} ry={0.35} fill={bL} />
              {/* Cart shadow */}
              {(() => {
                const dir = 200 < lightX ? -1 : 1
                const stretch = Math.abs(200 - lightX) / 100
                const offX = dir * 3 * (0.3 + stretch * 0.5)
                return <ellipse cx={200.5 + offX} cy={57} rx={3 + stretch * 2} ry={0.4} fill={`rgba(0,0,0,${shadowOp})`} />
              })()}
            </g>
          )
        })()}


        {/* Dirt path */}
        <path d="M-5,96 Q50,93 100,95 Q150,93 205,96 L205,100 L-5,100 Z" fill={dirtColor} opacity="0.2" />
      </>), [p, isDark, svgAspect, lightX, shadowOp, dirtColor, dirtLight, timeState.phase, timeState.t, timeState.hour])

  return (
    <>
      {terrainCachedUrl && (
        <img
          src={terrainCachedUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none', objectFit: 'fill' }}
        />
      )}
      <svg ref={combinedTerrainRef} className="absolute inset-0 w-full h-full" viewBox="0 -4 200 100" preserveAspectRatio="none" style={{
        willChange: terrainCachedUrl ? undefined : 'transform',
        contain: 'strict',
        pointerEvents: 'none',
        ...(terrainCachedUrl ? { opacity: 0, zIndex: -9999 } : { transition: 'filter 2s' }),
      }}>
        {terrainContent}
      </svg>
      {/* Windmill overlay — rendered outside cached terrain so animations stay live */}
      {terrainCachedUrl && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 -4 200 100" preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
          {[{ x: 45, y: 27, s: 0.12 }, { x: 110, y: 19, s: 0.06 }, { x: 155, y: 20, s: 0.07 }].map((wm, wi) => <g key={`bgwm-${wi}`} opacity={0.35}>{renderWindmill(wm, wi + 10)}</g>)}
          {[{ x: 76, y: 43, s: 0.22 }, { x: 128, y: 40, s: 0.18 }].map((wm, wi) => <g key={`fhwm-${wi}`} opacity={0.55}>{renderWindmill(wm, wi + 20)}</g>)}
          {[{ x: 178, y: 44, s: 0.95 }, { x: 194, y: 42, s: 0.75 }].map((wm, wi) => renderWindmill(wm, wi))}
        </svg>
      )}

      {/* (sun and moon now rendered inside SVG before mountains) */}

      {/* ── Ambient animations ── */}
      {<>
      {/* Clouds — high distant layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: timeState.phase === 'night' ? 0.35 : 0.45 }}>
        {[0,1,2,3,4].map(i => {
          const r = seededRng(i * 41 + 77)
          const y = 1 + r() * 14
          const w = 50 + r() * 70
          const h = 12 + r() * 10
          const dur = 400 + r() * 300
          const delay = -(r() * dur)
          return (
            <svg key={`cloud-hi-${i}`} className="absolute" style={{
              top: `${y}%`, width: `${w}px`, height: `${h}px`,
              animation: `cloud-drift ${dur}s linear ${delay}s infinite`,
              opacity: 0.25 + r() * 0.25,
            }} viewBox="0 0 100 30" preserveAspectRatio="none">
              <ellipse cx="50" cy="18" rx="48" ry="10" fill={isDark ? '#3a4458' : '#b8b4aa'} />
              <ellipse cx="35" cy="14" rx="28" ry="12" fill={isDark ? '#404c60' : '#c4c0b6'} />
              <ellipse cx="65" cy="15" rx="24" ry="9" fill={isDark ? '#384454' : '#bfbbb2'} />
            </svg>
          )
        })}
      </div>
      {/* Clouds — mid layer around sun/moon level */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: timeState.phase === 'night' ? 0.4 : 0.55 }}>
        {[0,1,2,3].map(i => {
          const r = seededRng(i * 53 + 149)
          const y = 4 + r() * 18
          const w = 80 + r() * 120
          const h = 16 + r() * 14
          const dur = 320 + r() * 240
          const delay = -(r() * dur)
          return (
            <svg key={`cloud-mid-${i}`} className="absolute" style={{
              top: `${y}%`, width: `${w}px`, height: `${h}px`,
              animation: `cloud-drift ${dur}s linear ${delay}s infinite`,
              opacity: 0.3 + r() * 0.25,
            }} viewBox="0 0 120 35" preserveAspectRatio="none">
              <ellipse cx="60" cy="20" rx="55" ry="12" fill={isDark ? '#323e54' : '#c0bcb2'} />
              <ellipse cx="40" cy="16" rx="32" ry="13" fill={isDark ? '#3a4660' : '#c8c4ba'} />
              <ellipse cx="80" cy="17" rx="28" ry="11" fill={isDark ? '#354050' : '#bcb8ae'} />
            </svg>
          )
        })}
      </div>
      {/* Clouds — low close layer, bigger, faster, overlaps hills */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: timeState.phase === 'night' ? 0.6 : 0.85 }}>
        {[0,1,2,3,4].map(i => {
          const r = seededRng(i * 67 + 233)
          const y = 12 + r() * 18
          const w = 120 + r() * 180
          const h = 28 + r() * 22
          const dur = 220 + r() * 160
          const delay = -(r() * dur)
          return (
            <svg key={`cloud-lo-${i}`} className="absolute" style={{
              top: `${y}%`, width: `${w}px`, height: `${h}px`,
              animation: `cloud-drift ${dur}s linear ${delay}s infinite`,
              opacity: 0.4 + r() * 0.3,
            }} viewBox="0 0 140 40" preserveAspectRatio="none">
              <ellipse cx="70" cy="24" rx="65" ry="14" fill={isDark ? '#2a3448' : '#b4b0a6'} />
              <ellipse cx="45" cy="18" rx="38" ry="16" fill={isDark ? '#303c50' : '#bfbbb2'} />
              <ellipse cx="95" cy="20" rx="34" ry="13" fill={isDark ? '#2c384c' : '#b8b4aa'} />
              <ellipse cx="60" cy="14" rx="28" ry="11" fill={isDark ? '#343e52' : '#c4c0b8'} />
              <ellipse cx="110" cy="22" rx="22" ry="10" fill={isDark ? '#2a3448' : '#b8b4aa'} />
            </svg>
          )
        })}
      </div>

      {/* Fireflies — night only */}
      {(timeState.phase === 'night' || (timeState.phase === 'dusk' && timeState.t > 0.5)) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 10 }, (_, i) => {
            const r = seededRng(i * 59 + 131)
            const x = 5 + r() * 90
            const y = 30 + r() * 55
            const glowDur = 6 + r() * 8
            const driftDur = 25 + r() * 20
            const delay = r() * 10
            const dx1 = -40 + r() * 80
            const dy1 = -30 + r() * 60
            const dx2 = -40 + r() * 80
            const dy2 = -30 + r() * 60
            const dx3 = -40 + r() * 80
            const dy3 = -30 + r() * 60
            const name = `firefly-drift-${i}`
            return (
              <div key={`fly-${i}`}>
                <style>{`
                  @keyframes ${name} {
                    0% { transform: translate(0, 0); }
                    25% { transform: translate(${dx1}px, ${dy1}px); }
                    50% { transform: translate(${dx2}px, ${dy2}px); }
                    75% { transform: translate(${dx3}px, ${dy3}px); }
                    100% { transform: translate(0, 0); }
                  }
                `}</style>
                <div className="absolute rounded-full" style={{
                  left: `${x}%`, top: `${y}%`,
                  width: 4, height: 4,
                  background: 'radial-gradient(circle, rgba(240,160,40,1) 0%, rgba(217,119,6,0.8) 40%, rgba(217,119,6,0) 70%)',
                  boxShadow: '0 0 10px 4px rgba(217,119,6,0.7), 0 0 20px 6px rgba(217,119,6,0.25)',
                  animation: `firefly-glow ${glowDur}s ease-in-out ${delay}s infinite both, ${name} ${driftDur}s ease-in-out ${delay}s infinite both`,
                }} />
              </div>
            )
          })}
        </div>
      )}

      {/* Birds — swoop in/out of trees */}
      {(timeState.phase === 'day' || timeState.phase === 'morning') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Swooping birds — fly across, dip to trees, fly out */}
          {[0,1,2,3,4,5].map(i => {
            const r = seededRng(i * 47 + 211)
            const sz = 8 + r() * 6
            const dur = 14 + r() * 12
            const delay = r() * dur
            const fromRight = r() > 0.5
            const treeY = 42 + r() * 28
            const skyY = 3 + r() * 18
            const treeX = 15 + r() * 70
            const name = `bird-swoop-${i}`
            return (
              <svg key={`bird-${i}`} className="absolute" style={{
                width: sz, height: sz * 0.5,
                opacity: 0.35 + r() * 0.25,
                animation: `${name} ${dur}s ease-in-out ${delay}s infinite`,
                transform: fromRight ? 'scaleX(-1)' : undefined,
              }} viewBox="0 0 20 10">
                <path d="M0,5 Q5,0 10,4 Q15,0 20,5" fill="none" stroke={isDark ? '#3a3a3a' : '#4a4440'} strokeWidth="1.5" strokeLinecap="round">
                  <animate attributeName="d" values="M0,5 Q5,0 10,4 Q15,0 20,5;M0,4 Q5,3 10,4 Q15,3 20,4;M0,5 Q5,0 10,4 Q15,0 20,5" dur="0.5s" repeatCount="indefinite" />
                </path>
                <style>{`
                  @keyframes ${name} {
                    0% { left: ${fromRight ? '105%' : '-5%'}; top: ${skyY}%; }
                    25% { left: ${treeX}%; top: ${skyY + 5}%; }
                    35% { left: ${treeX + (fromRight ? -3 : 3)}%; top: ${treeY}%; }
                    55% { left: ${treeX + (fromRight ? -2 : 2)}%; top: ${treeY - 1}%; }
                    70% { left: ${treeX + (fromRight ? -5 : 5)}%; top: ${skyY + 8}%; }
                    100% { left: ${fromRight ? '-5%' : '105%'}; top: ${skyY - 3}%; }
                  }
                `}</style>
              </svg>
            )
          })}
          {/* High soaring birds — slow lazy circles in the sky */}
          {[0,1,2].map(i => {
            const r = seededRng(i * 83 + 771)
            const sz = 5 + r() * 4
            const cx = 20 + r() * 60
            const cy = 5 + r() * 12
            const rx = 8 + r() * 12
            const ry = 3 + r() * 4
            const dur = 20 + r() * 15
            const delay = r() * 10
            const name = `bird-soar-${i}`
            return (
              <svg key={`soar-${i}`} className="absolute" style={{
                width: sz, height: sz * 0.45,
                opacity: 0.2 + r() * 0.15,
                animation: `${name} ${dur}s linear ${delay}s infinite`,
              }} viewBox="0 0 20 10">
                <path d="M0,5 Q5,1 10,4 Q15,1 20,5" fill="none" stroke={isDark ? '#2e2e2e' : '#5a5650'} strokeWidth="1.2" strokeLinecap="round">
                  <animate attributeName="d" values="M0,5 Q5,1 10,4 Q15,1 20,5;M0,4.5 Q5,3 10,4 Q15,3 20,4.5;M0,5 Q5,1 10,4 Q15,1 20,5" dur="0.7s" repeatCount="indefinite" />
                </path>
                <style>{`
                  @keyframes ${name} {
                    0% { left: ${cx - rx}%; top: ${cy}%; }
                    25% { left: ${cx}%; top: ${cy - ry}%; }
                    50% { left: ${cx + rx}%; top: ${cy}%; }
                    75% { left: ${cx}%; top: ${cy + ry}%; }
                    100% { left: ${cx - rx}%; top: ${cy}%; }
                  }
                `}</style>
              </svg>
            )
          })}
          {/* Distant flock — tiny V formation drifting across */}
          {[0,1].map(i => {
            const r = seededRng(i * 113 + 997)
            const dur = 35 + r() * 20
            const delay = r() * 20
            const skyY = 4 + r() * 8
            const fromRight = i % 2 === 0
            const name = `flock-${i}`
            const birdC = isDark ? '#2a2a2a' : '#6a6460'
            return (
              <div key={`flock-${i}`} className="absolute" style={{
                opacity: 0.2 + r() * 0.1,
                animation: `${name} ${dur}s linear ${delay}s infinite`,
              }}>
                <svg width="30" height="12" viewBox="0 0 50 20">
                  {[[-8,2],[- 4,0],[0,1],[4,0],[8,2]].map(([ox, oy], bi) => (
                    <path key={bi} d={`M${22 + ox * 2},${10 + oy * 2} q2,-2 4,0 q2,-2 4,0`} fill="none" stroke={birdC} strokeWidth="0.8" strokeLinecap="round">
                      <animate attributeName="d" values={`M${22 + ox * 2},${10 + oy * 2} q2,-2 4,0 q2,-2 4,0;M${22 + ox * 2},${10 + oy * 2} q2,-0.5 4,0 q2,-0.5 4,0;M${22 + ox * 2},${10 + oy * 2} q2,-2 4,0 q2,-2 4,0`} dur={`${0.4 + bi * 0.05}s`} repeatCount="indefinite" />
                    </path>
                  ))}
                </svg>
                <style>{`
                  @keyframes ${name} {
                    0% { left: ${fromRight ? '110%' : '-15%'}; top: ${skyY}%; }
                    100% { left: ${fromRight ? '-15%' : '110%'}; top: ${skyY + 2}%; }
                  }
                `}</style>
              </div>
            )
          })}
        </div>
      )}

      {/* Easter egg UFO — erratic night flyby */}
      {(timeState.phase === 'night' || (timeState.phase === 'dusk' && timeState.t > 0.7)) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute',
            width: 14, height: 7,
            animation: 'ufo-path 12s ease-in-out 300s infinite, ufo-appear 300s ease-in-out 0s infinite',
            opacity: 0,
          }}>
            <svg width="14" height="7" viewBox="0 0 20 10" style={{ animation: 'ufo-spin 0.8s linear infinite' }}>
              <ellipse cx="10" cy="5" rx="9" ry="3" fill="#3a3a4a" />
              <ellipse cx="10" cy="3.5" rx="4.5" ry="3" fill="#4a4a5a" opacity="0.6" />
              <ellipse cx="10" cy="5.5" rx="9" ry="1.2" fill="rgba(100,200,255,0.2)" />
              <circle cx="5" cy="5.5" r="0.7" fill="#4af" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.15s" repeatCount="indefinite" />
              </circle>
              <circle cx="10" cy="6" r="0.7" fill="#4af" opacity="0.8">
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur="0.15s" repeatCount="indefinite" />
              </circle>
              <circle cx="15" cy="5.5" r="0.7" fill="#4af" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.15s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <style>{`
            @keyframes ufo-path {
              0%   { left: -5%; top: 8%; }
              8%   { left: 25%; top: 3%; }
              15%  { left: 22%; top: 12%; }
              22%  { left: 55%; top: 5%; }
              30%  { left: 40%; top: 15%; }
              38%  { left: 70%; top: 3%; }
              45%  { left: 65%; top: 18%; }
              52%  { left: 85%; top: 6%; }
              60%  { left: 50%; top: 10%; }
              68%  { left: 30%; top: 4%; }
              76%  { left: 60%; top: 14%; }
              85%  { left: 90%; top: 8%; }
              92%  { left: 95%; top: 3%; }
              100% { left: 110%; top: 6%; }
            }
            @keyframes ufo-appear {
              0%, 95% { opacity: 0; }
              96% { opacity: 0.55; }
              99.5% { opacity: 0.55; }
              100% { opacity: 0; }
            }
            @keyframes ufo-spin {
              0%   { transform: rotateY(0deg) rotateZ(0deg); }
              25%  { transform: rotateY(90deg) rotateZ(8deg); }
              50%  { transform: rotateY(180deg) rotateZ(-5deg); }
              75%  { transform: rotateY(270deg) rotateZ(10deg); }
              100% { transform: rotateY(360deg) rotateZ(0deg); }
            }
          `}</style>
        </div>
      )}

      {/* Falling leaves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => {
          const r = seededRng(i * 37 + 519)
          const x = 10 + r() * 80
          const dur = 12 + r() * 10
          const delay = -(r() * dur)
          const sz = 4 + r() * 3
          const leafColors = isDark
            ? ['#3a5030', '#4a3820', '#2e4428']
            : ['#7a9a50', '#a08040', '#6a8a3a']
          const fill = leafColors[Math.floor(r() * leafColors.length)]
          return (
            <svg key={`leaf-${i}`} className="absolute" style={{
              left: `${x}%`, top: '-3%',
              width: sz, height: sz,
              animation: `leaf-fall ${dur}s linear ${delay}s infinite`,
              opacity: 0.5 + r() * 0.3,
            }} viewBox="0 0 10 10">
              <path d="M5,0 Q8,3 7,7 Q5,10 3,7 Q2,3 5,0Z" fill={fill} />
              <line x1="5" y1="1" x2="5" y2="8" stroke={fill} strokeWidth="0.3" opacity="0.5" />
            </svg>
          )
        })}
      </div>

      {/* Butterflies — day only */}
      {(timeState.phase === 'day' || timeState.phase === 'morning') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0,1,2].map(i => {
            const r = seededRng(i * 67 + 389)
            const x = 15 + r() * 70
            const y = 35 + r() * 40
            const dur = 8 + r() * 6
            const delay = r() * 8
            const sz = 6 + r() * 3
            const colors = ['#d4a050', '#a0805a', '#c09060', '#8a6a40']
            const fill = colors[Math.floor(r() * colors.length)]
            return (
              <svg key={`bfly-${i}`} className="absolute" style={{
                left: `${x}%`, top: `${y}%`,
                width: sz, height: sz,
                animation: `butterfly-path ${dur}s ease-in-out ${delay}s infinite`,
                opacity: 0.55 + r() * 0.25,
              }} viewBox="0 0 14 10">
                <g>
                  <ellipse cx="5" cy="5" rx="3.5" ry="4" fill={fill} opacity="0.7">
                    <animate attributeName="rx" values="3.5;1;3.5" dur="0.3s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="9" cy="5" rx="3.5" ry="4" fill={fill} opacity="0.7">
                    <animate attributeName="rx" values="3.5;1;3.5" dur="0.3s" repeatCount="indefinite" />
                  </ellipse>
                  <rect x="6.5" y="2" width="1" height="7" rx="0.5" fill={isDark ? '#1a1610' : '#3a3020'} />
                </g>
              </svg>
            )
          })}
        </div>
      )}
      </>}

      <style>{`
        @keyframes cloud-drift { 0% { transform: translateX(-25vw); } 100% { transform: translateX(110vw); } }
        @keyframes firefly-glow {
          0% { opacity: 0; box-shadow: 0 0 2px 0px rgba(217,119,6,0); }
          15% { opacity: 0.06; }
          30% { opacity: 0.2; box-shadow: 0 0 4px 1px rgba(57,255,20,0.2); }
          45% { opacity: 0.6; }
          50% { opacity: 0.85; box-shadow: 0 0 8px 3px rgba(217,119,6,0.5); }
          55% { opacity: 0.6; }
          70% { opacity: 0.2; box-shadow: 0 0 4px 1px rgba(57,255,20,0.2); }
          85% { opacity: 0.06; }
          100% { opacity: 0; box-shadow: 0 0 2px 0px rgba(217,119,6,0); }
        }
        @keyframes firefly-drift { 0% { transform: translate(0, 0); } 25% { transform: translate(var(--drift-x), var(--drift-y)); } 50% { transform: translate(calc(var(--drift-x) * -0.5), calc(var(--drift-y) * 0.5)); } 75% { transform: translate(calc(var(--drift-x) * 0.7), calc(var(--drift-y) * -0.3)); } 100% { transform: translate(0, 0); } }
@keyframes leaf-fall { 0% { top: -5%; transform: rotate(0deg) translateX(0); } 25% { transform: rotate(40deg) translateX(15px); } 50% { transform: rotate(-20deg) translateX(-10px); } 75% { transform: rotate(30deg) translateX(12px); } 100% { top: 95%; transform: rotate(10deg) translateX(5px); } }
        @keyframes butterfly-path { 0% { transform: translate(0, 0); } 20% { transform: translate(20px, -12px); } 40% { transform: translate(-10px, -20px); } 60% { transform: translate(15px, 8px); } 80% { transform: translate(-15px, -5px); } 100% { transform: translate(0, 0); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      {/* Soft vignette — heavier on left for sidebar blend */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: isDark
          ? 'inset 25px 0 35px -10px rgba(8,10,8,0.3)'
          : 'inset 20px 0 30px -8px rgba(40,35,25,0.1)',
      }} />
      {/* Time-of-day ambient overlay */}
      {p.ambientOpacity > 0.01 && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundColor: p.ambientOverlay,
          opacity: p.ambientOpacity,
          transition: 'opacity 10s, background-color 10s',
        }} />
      )}
      {/* Stall click zone */}
      {onOpenShop && (
        <div
          className="absolute z-[70] cursor-pointer"
          style={{ left: '0%', top: '30%', width: '14%', height: '35%' }}
          onClick={onOpenShop}
        />
      )}
    </>
  )
})

const NOTE_TYPE_ICONS: Record<string, string> = {
  notebook: '📓',
  singlepage: '📄',
  vault: '🔒',
  cornell: '📋',
}

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme,
  sap, gems, xp, grove, inventory, notes, setGems, setSap, setGrove, userId, activeTabId, orchardTimeMode,
  onOpenLeaderboard, onOpenShop, onOpenSatchel, goalStreak = 0, quotaTier = 'monthly', reduceMotion = false,
}: OrchardViewProps) {

  const activeNotesForDefault = useMemo(() => notes.filter(n => !n.archived && !n.deletedAt), [notes])
  const selectedNotebook = activeTabId && activeNotesForDefault.some(n => n.id === activeTabId) ? activeTabId : (activeNotesForDefault.length > 0 ? activeNotesForDefault[0].id : '_unassigned')
  const [plotPage, setPlotPage] = useState(0)
  useEffect(() => {
    setPlotPage(0)
  }, [selectedNotebook])

  const [chopMode, setChopMode] = useState(false)
  const [chopTarget, setChopTarget] = useState<{ tree: any; sap: number } | null>(null)
  const [showChopHint, setShowChopHint] = useState(() => {
    if (typeof window === 'undefined') return true
    return !localStorage.getItem('pulp-chop-hint-dismissed')
  })
  const [activeTool, setActiveTool] = useState<'none' | 'bucket' | 'axe'>('none')
  const [editMode, setEditMode] = useState(false)
  const [orchardMode, setOrchardMode] = useState<'xp' | 'seasonal'>('xp')
  const [focusedTree, setFocusedTree] = useState<{ tree: any; x: number; y: number } | null>(null)
  const [ascensionMode, setAscensionMode] = useState(false)
  const [selectedSacrifices, setSelectedSacrifices] = useState<number[]>([])
  const hoveredElRef = useRef<HTMLElement | null>(null)
  const hoveredZRef = useRef<string>('')
  const [collectAllAnim, setCollectAllAnim] = useState<{ total: number; current: number; active: boolean }>({ total: 0, current: 0, active: false })
  const collectBtnRef = useRef<HTMLButtonElement>(null)
  const sapCounterRef = useRef<HTMLDivElement>(null)

  const [slotOrder, setSlotOrder] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem('pulp-slot-order') || '{}') } catch { return {} }
  })
  const orchardRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const [screenshotData, setScreenshotData] = useState<string | null>(null)
  const [screenshotBusy, setScreenshotBusy] = useState(false)

  const captureOrchard = useCallback(async () => {
    const el = captureRef.current
    if (!el || screenshotBusy) return
    setScreenshotBusy(true)
    const overlays = el.querySelectorAll<HTMLElement>('[data-orchard-ui]')
    overlays.forEach(o => o.style.visibility = 'hidden')
    try {
      const url = await toPng(el, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        filter: (node: any) => {
          if (node.tagName === 'LINK' && node.rel === 'stylesheet') return false
          return true
        },
      })
      setScreenshotData(url)
    } catch { /* ignore */ }
    overlays.forEach(o => o.style.visibility = '')
    setScreenshotBusy(false)
  }, [screenshotBusy])

  const shareScreenshot = useCallback(async () => {
    if (!screenshotData) return
    const blob = await (await fetch(screenshotData)).blob()
    const file = new File([blob], 'my-orchard.png', { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My Pulp Orchard', text: 'Check out my orchard on Pulp!' }).catch(() => {})
    } else {
      const a = document.createElement('a')
      a.href = screenshotData
      a.download = 'my-orchard.png'
      a.click()
    }
  }, [screenshotData])

  const SAP_FILL_DURATION = 30 * 60 * 1000
  const SAP_TICK_INTERVAL = 10 * 1000

  const getTreeSapMax = (tree: any) => {
    const info = TREE_TYPES[tree.type]
    if (!info) return 1
    const base = info.sapYield || Math.max(1, Math.floor((info.cost || 5) * 0.3))
    const stageBonus = tree.stage >= 4 ? 1.5 : tree.stage >= 3 ? 1.2 : tree.stage >= 2 ? 1.0 : 0.5
    const ascensionMultiplier = tree.ascension ? ASCENSION_TIERS[tree.ascension - 1]?.sapMultiplier || 1 : 1
    return Math.max(1, Math.round(base * stageBonus * ascensionMultiplier))
  }

  const lvl = getLevel(xp)
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    const preventZoom = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault() }
    const preventGesture = (e: Event) => e.preventDefault()
    const preventWheelZoom = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) e.preventDefault() }
    document.addEventListener('touchmove', preventZoom, { passive: false })
    document.addEventListener('gesturestart', preventGesture, { passive: false })
    document.addEventListener('gesturechange', preventGesture, { passive: false })
    document.addEventListener('wheel', preventWheelZoom, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.removeEventListener('touchmove', preventZoom)
      document.removeEventListener('gesturestart', preventGesture)
      document.removeEventListener('gesturechange', preventGesture)
      document.removeEventListener('wheel', preventWheelZoom)
    }
  }, [onClose, isOpen])

  const activeNotes = useMemo(() => notes.filter(n => !n.archived && !n.deletedAt), [notes])

  const notebookTreeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    grove.filter(Boolean).forEach(t => {
      const nid = t.notebookId || '_unassigned'
      counts[nid] = (counts[nid] || 0) + 1
    })
    return counts
  }, [grove])

  const filteredTrees = useMemo(() => {
    const all = grove.filter(t => t !== null)
    if (selectedNotebook === '_unassigned') return all.filter(t => !t.notebookId)
    return all.filter(t => t.notebookId === selectedNotebook)
  }, [grove, selectedNotebook])

  const filteredTreesRef = useRef(filteredTrees)
  filteredTreesRef.current = filteredTrees

  const sapStartTimeRef = useRef<number>(Date.now())
  const [sapFillProgress, setSapFillProgress] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    sapStartTimeRef.current = Date.now()
    setSapFillProgress(0)
    const tick = () => {
      const elapsed = Date.now() - sapStartTimeRef.current
      setSapFillProgress(Math.min(1, elapsed / SAP_FILL_DURATION))
    }
    const interval = setInterval(tick, SAP_TICK_INTERVAL)
    return () => clearInterval(interval)
  }, [isOpen])

  const [sapDrops, setSapDrops] = useState<{ id: string; x: number; y: number; delay: number }[]>([])
  const [sapFunnelTarget, setSapFunnelTarget] = useState<{ x: number; y: number } | null>(null)

  const sapMultiplier = useMemo(() => {
    const hour = new Date().getHours()
    const earlyBird = (hour >= 6 && (hour < 10 || (hour === 10 && new Date().getMinutes() <= 30))) ? 1 : 0
    const quotaBonus = quotaTier === 'daily' ? 2 : quotaTier === 'weekly' ? 1 : 0
    return Math.min(4, 1 + earlyBird + quotaBonus)
  }, [quotaTier])

  const getAvailableSap = useCallback(() => {
    const allTrees = grove.filter(t => t && t.type !== 'spoiled')
    const maxSap = allTrees.reduce((s: number, t: any) => s + getTreeSapMax(t), 0)
    return Math.floor(maxSap * sapFillProgress * sapMultiplier)
  }, [sapFillProgress, grove, sapMultiplier])

  const getGlobalMaxSap = useCallback(() => {
    return grove.filter(t => t && t.type !== 'spoiled').reduce((s: number, t: any) => s + getTreeSapMax(t), 0)
  }, [grove])

  const getAvailableGems = useCallback(() => {
    const gemTrees = grove.filter(t => t && TREE_TYPES[t.type]?.gemYield)
    return gemTrees.reduce((sum: number, t: any) => {
      const info = TREE_TYPES[t.type]
      const stageBonus = t.stage >= 4 ? 1 : t.stage >= 3 ? 0.5 : 0
      return sum + Math.floor((info.gemYield || 0) * stageBonus * sapFillProgress)
    }, 0)
  }, [sapFillProgress, grove])

  const collectAllSap = useCallback(() => {
    const amount = getAvailableSap()
    if (amount <= 0) return

    const gemAmount = getAvailableGems()
    if (gemAmount > 0) setGems?.((g: number) => g + gemAmount)

    const counterEl = sapCounterRef.current
    const btnEl = collectBtnRef.current
    if (counterEl && btnEl) {
      const counterRect = counterEl.getBoundingClientRect()
      const tx = counterRect.left + counterRect.width / 2
      const ty = counterRect.top + counterRect.height / 2
      const btnRect = btnEl.getBoundingClientRect()
      const sx = btnRect.left + btnRect.width / 2
      const sy = btnRect.top + btnRect.height / 2
      const dropCount = Math.min(40, Math.max(8, Math.round(amount * 0.8)))
      const drops: { id: string; x: number; y: number; delay: number }[] = []
      for (let i = 0; i < dropCount; i++) {
        const spread = 80 + Math.random() * 120
        const angle = Math.random() * Math.PI * 2
        drops.push({
          id: `${Date.now()}-${i}`,
          x: sx + Math.cos(angle) * spread,
          y: sy + Math.sin(angle) * spread,
          delay: Math.random() * 400,
        })
      }
      setSapDrops(drops)
      setSapFunnelTarget({ x: tx, y: ty })
      setTimeout(() => { setSapDrops([]); setSapFunnelTarget(null) }, 1800)
    }

    setCollectAllAnim({ total: amount, current: 0, active: true })
    const rampSteps = 20
    const rampDuration = 800
    let added = 0
    for (let i = 1; i <= rampSteps; i++) {
      setTimeout(() => {
        const target = Math.round(amount * (i / rampSteps))
        const delta = target - added
        if (delta > 0) {
          added = target
          setSap((j: number) => j + delta)
          setCollectAllAnim(prev => ({ ...prev, current: target }))
        }
      }, 200 + i * (rampDuration / rampSteps))
    }

    sapStartTimeRef.current = Date.now()
    setSapFillProgress(0)

    setTimeout(() => {
      setCollectAllAnim({ total: 0, current: 0, active: false })
    }, 200 + rampDuration + 600)
  }, [getAvailableSap, getAvailableGems, setSap, setGems])

  const TREES_PER_PLOT = 40
  const MAX_PLOTS = 3

  const [unlockedPlots, setUnlockedPlots] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('pulp-unlocked-plots') || '{}') } catch { return {} }
  })

  useEffect(() => {
    if (!userId) return
    db.getUnlockedPlots(userId).then(plots => {
      const mapped: Record<string, number> = {}
      for (const [nbId, indices] of Object.entries(plots)) mapped[nbId] = Math.max(...indices, 1)
      if (Object.keys(mapped).length) setUnlockedPlots(mapped)
    })
  }, [userId])

  const nbUnlocked = unlockedPlots[selectedNotebook] || 1
  const totalPlots = Math.min(MAX_PLOTS, Math.max(1, Math.ceil(filteredTrees.length / TREES_PER_PLOT)))
  const accessiblePlots = Math.min(totalPlots, nbUnlocked)

  const unlockNextPlot = () => {
    const nextPlot = nbUnlocked + 1
    if (nextPlot > MAX_PLOTS) return
    const cost = PLOT_COST[nextPlot - 1] || 0
    if ((gems ?? 0) < cost) return
    setGems?.((g: number) => g - cost)
    const updated = { ...unlockedPlots, [selectedNotebook]: nextPlot }
    setUnlockedPlots(updated)
    localStorage.setItem('pulp-unlocked-plots', JSON.stringify(updated))
    if (userId) db.unlockPlot(userId, selectedNotebook, nextPlot)
    setPlotPage(nextPlot - 1)
  }

  const confirmChop = useCallback(() => {
    if (!chopTarget) return
    const { tree, sap } = chopTarget
    setSap((j: number) => j + sap)
    setGrove((g: any[]) => g.filter(t => t.id !== tree.id))
    if (userId) db.deleteTree(userId, tree.id).catch(() => {})
    setChopTarget(null)
  }, [chopTarget, setSap, setGrove, userId])

  // Auto-convert overflow trees to sap
  useEffect(() => {
    const maxCapacity = nbUnlocked * TREES_PER_PLOT
    if (filteredTrees.length <= maxCapacity) return
    const overflow = filteredTrees.slice(maxCapacity)
    let totalSap = 0
    const overflowIds = new Set(overflow.map((t: any) => { totalSap += getSapYield(t); return t.id }))
    if (overflowIds.size === 0) return
    setSap((j: number) => j + totalSap)
    setGrove((g: any[]) => g.filter(t => !overflowIds.has(t.id)))
    if (userId) overflow.forEach((t: any) => db.deleteTree(userId, t.id).catch(() => {}))
  }, [filteredTrees.length, nbUnlocked, selectedNotebook])

  const currentPlotTrees = useMemo(() => {
    const start = plotPage * TREES_PER_PLOT
    return filteredTrees.slice(start, start + TREES_PER_PLOT)
  }, [filteredTrees, plotPage])

  const placed = useMemo(() => {
    const order = slotOrder[selectedNotebook ?? '_all']
    if (!order || order.length === 0) return orchardPlacement(currentPlotTrees)
    const treeById = new Map(currentPlotTrees.map(t => [t.id, t]))
    const result: { x: number; y: number; tree: any; col: number; slotIndex: number }[] = []
    const assigned = new Set<string>()
    for (const treeId of order) {
      const tree = treeById.get(treeId)
      if (tree && result.length < ALL_SLOTS.length) {
        const slot = ALL_SLOTS[result.length]
        result.push({ x: slot.x, y: slot.y, tree, col: slot.col, slotIndex: slot.slotIndex })
        assigned.add(treeId)
      }
    }
    for (const tree of currentPlotTrees) {
      if (!assigned.has(tree.id) && result.length < ALL_SLOTS.length) {
        const slot = ALL_SLOTS[result.length]
        result.push({ x: slot.x, y: slot.y, tree, col: slot.col, slotIndex: slot.slotIndex })
      }
    }
    return result.sort((a, b) => a.y - b.y)
  }, [currentPlotTrees, slotOrder, selectedNotebook])

  const occupiedSlots = useMemo(() => new Set(placed.map(p => p.slotIndex)), [placed])

  const emptySlots = useMemo(() => ALL_SLOTS.filter(s => !occupiedSlots.has(s.slotIndex)), [occupiedSlots])

  const dragRef = useRef<{ treeId: string; startX: number; startY: number; currentX: number; currentY: number; slotIdx: number; active: boolean } | null>(null)
  const dragElRef = useRef<HTMLElement | null>(null)
  const placedRef = useRef(placed)
  placedRef.current = placed
  const slotOrderRef = useRef(slotOrder)
  slotOrderRef.current = slotOrder
  const currentPlotTreesRef = useRef(currentPlotTrees)
  currentPlotTreesRef.current = currentPlotTrees
  const prevPlotPageRef = useRef(-1)
  const selectedNotebookRef = useRef(selectedNotebook)
  selectedNotebookRef.current = selectedNotebook

  const handleDragStart = useCallback((treeId: string, slotIdx: number, clientX: number, clientY: number) => {
    if (activeTool !== 'none') return
    dragRef.current = { treeId, startX: clientX, startY: clientY, currentX: clientX, currentY: clientY, slotIdx, active: false }
    const onMove = (e: PointerEvent) => {
      const ds = dragRef.current
      if (!ds) return
      const dx = e.clientX - ds.startX
      const dy = e.clientY - ds.startY
      ds.active = ds.active || (dx * dx + dy * dy > 64)
      ds.currentX = e.clientX
      ds.currentY = e.clientY
      if (dragElRef.current) {
        dragElRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-85% + ${dy}px)) scale(1.08)`
        dragElRef.current.style.zIndex = '999'
        dragElRef.current.style.opacity = '0.85'
        dragElRef.current.style.cursor = 'grabbing'
      }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const ds = dragRef.current
      if (dragElRef.current) {
        dragElRef.current.style.transform = ''
        dragElRef.current.style.zIndex = ''
        dragElRef.current.style.opacity = ''
        dragElRef.current.style.cursor = ''
        dragElRef.current = null
      }
      dragRef.current = null
      if (!ds || !ds.active || !orchardRef.current) return
      const rect = orchardRef.current.getBoundingClientRect()
      const dropX = ((ds.currentX - rect.left) / rect.width) * 100
      const dropY = ((ds.currentY - rect.top) / rect.height) * 100
      let closest = -1
      let closestDist = Infinity
      for (const slot of ALL_SLOTS) {
        const ddx = slot.x - dropX
        const ddy = (slot.y - 3) - dropY
        const dist = ddx * ddx + ddy * ddy
        if (dist < closestDist) { closestDist = dist; closest = slot.slotIndex }
      }
      if (closest >= 0 && closestDist < 200) {
        const key = selectedNotebookRef.current ?? '_all'
        const currentOrder = slotOrderRef.current[key] || currentPlotTreesRef.current.map((t: any) => t.id)
        const dragIdx = currentOrder.indexOf(ds.treeId)
        if (dragIdx >= 0) {
          const targetTreeId = placedRef.current.find(p => p.slotIndex === closest)?.tree?.id
          const newOrder = [...currentOrder]
          newOrder.splice(dragIdx, 1)
          if (targetTreeId) {
            const targetIdx = newOrder.indexOf(targetTreeId)
            if (targetIdx >= 0) newOrder.splice(targetIdx, 0, ds.treeId)
            else newOrder.push(ds.treeId)
          } else {
            const insertAt = Math.min(closest, newOrder.length)
            newOrder.splice(insertAt, 0, ds.treeId)
          }
          const updated = { ...slotOrderRef.current, [key]: newOrder }
          setSlotOrder(updated)
          localStorage.setItem('pulp-slot-order', JSON.stringify(updated))
        }
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [activeTool])

  const tillSvg = useMemo(() => {
    const dk = isDark
    const dirtDark = dk ? '#1e1a10' : '#6a5a3a'
    const dirtMid = dk ? '#2a2418' : '#8a7a5a'
    const dirtLight = dk ? '#382e1e' : '#9a8a6a'
    const yTop = 44
    const yBot = 88
    const steps = 16
    const makePath = (pts: { x: number; y: number }[], xOff: number, yOff: number, seed: number) => {
      const r = seededRng(seed)
      const mapped = pts.map(p => ({ x: p.x + xOff + (r() - 0.5) * 0.15, y: p.y + yOff + (r() - 0.5) * 0.1 }))
      let path = `M${mapped[0].x.toFixed(1)},${mapped[0].y.toFixed(1)}`
      for (let i = 1; i < mapped.length; i++) {
        if (i < mapped.length - 1) {
          const c = mapped[i], n = mapped[i + 1]
          path += ` Q${c.x.toFixed(1)},${c.y.toFixed(1)} ${((c.x + n.x) / 2).toFixed(1)},${((c.y + n.y) / 2).toFixed(1)}`
        } else {
          path += ` L${mapped[i].x.toFixed(1)},${mapped[i].y.toFixed(1)}`
        }
      }
      return path
    }
    const furrows = [
      { xOff: -0.4, yOff: -0.12, color: dirtDark, width: 0.7, op: dk ? 0.35 : 0.2 },
      { xOff: 0, yOff: 0.05, color: dirtMid, width: 1.0, op: dk ? 0.4 : 0.24 },
      { xOff: 0.25, yOff: 0, color: dirtDark, width: 0.6, op: dk ? 0.3 : 0.16 },
      { xOff: 0.4, yOff: 0.12, color: dirtLight, width: 0.4, op: dk ? 0.22 : 0.12 },
    ]
    const r0 = seededRng(777)
    const clumps: { cx: number; cy: number; rx: number; ry: number; color: string; op: number }[] = []
    for (let ci = 0; ci < GRID_COLS; ci++) {
      const rc = seededRng(ci * 311 + 47)
      for (let j = 0; j < 8; j++) {
        const y = yTop + rc() * (yBot - yTop)
        const tx = getTillX(ci, y)
        clumps.push({
          cx: tx + (rc() - 0.5) * 1.8,
          cy: y + (rc() - 0.5) * 1.2,
          rx: 0.3 + rc() * 0.5,
          ry: 0.15 + rc() * 0.25,
          color: rc() > 0.5 ? dirtDark : dirtMid,
          op: dk ? 0.15 + rc() * 0.15 : 0.08 + rc() * 0.1,
        })
      }
    }
    const crossHatches: { x1: number; y1: number; x2: number; y2: number; color: string; op: number }[] = []
    for (let ci = 0; ci < GRID_COLS - 1; ci++) {
      const rc = seededRng(ci * 193 + 83)
      for (let j = 0; j < 3; j++) {
        const y = yTop + 8 + rc() * (yBot - yTop - 16)
        const lx = getTillX(ci, y)
        const rx2 = getTillX(ci + 1, y)
        crossHatches.push({
          x1: lx + 0.5, y1: y + (rc() - 0.5) * 2,
          x2: rx2 - 0.5, y2: y + (rc() - 0.5) * 2,
          color: dirtDark, op: dk ? 0.12 + rc() * 0.08 : 0.06 + rc() * 0.05,
        })
      }
    }
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="till-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="8%" stopColor="white" stopOpacity="1" />
            <stop offset="90%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="till-mask">
            <rect x="0" y={yTop} width="100" height={yBot - yTop} fill="url(#till-fade)" />
          </mask>
        </defs>
        <g mask="url(#till-mask)">
          {crossHatches.map((h, i) => (
            <line key={`xh-${i}`} x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} stroke={h.color} strokeWidth={0.25} opacity={h.op} strokeDasharray="0.8 1.5" />
          ))}
          {clumps.map((c, i) => (
            <ellipse key={`clump-${i}`} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={c.color} opacity={c.op} />
          ))}
          {Array.from({ length: GRID_COLS }, (_, ci) => {
            const pts = Array.from({ length: steps + 1 }, (_, si) => {
              const y = yTop + si * (yBot - yTop) / steps
              return { x: getTillX(ci, y), y }
            })
            return (
              <g key={`till-${ci}`}>
                {furrows.map((f, fi) => (
                  <path key={fi} d={makePath(pts, f.xOff, f.yOff, ci * 99 + fi * 71)} fill="none" stroke={f.color} strokeWidth={f.width} opacity={f.op} strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </g>
            )
          })}
        </g>
      </svg>
    )
  }, [isDark])

  const rarityCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredTrees.forEach(t => {
      const r = TREE_TYPES[t.type]?.rarity || 'common'
      counts[r] = (counts[r] || 0) + 1
    })
    return counts
  }, [filteredTrees])

  const archivedNotes = useMemo(() => notes.filter(n => n.archived && !n.deletedAt), [notes])

  const handleToggleChop = useCallback(() => {
    setActiveTool(t => t === 'axe' ? 'none' : 'axe')
    setChopTarget(null)
    if (showChopHint) { setShowChopHint(false); localStorage.setItem('pulp-chop-hint-dismissed', '1') }
  }, [showChopHint])

  if (!isOpen) {
    prevPlotPageRef.current = -1
    return null
  }

  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  const textPrimary = isDark ? '#d4d0c8' : '#3a3630'
  const textSecondary = isDark ? '#6b6860' : '#9a9590'
  const textMuted = isDark ? '#4a4840' : '#b8b4ae'

  const plotCount = currentPlotTrees.length
  const baseSize = plotCount <= 6 ? 150 :
    plotCount <= 15 ? 132 :
    plotCount <= 24 ? 120 :
    plotCount <= 36 ? 110 : 98
  prevPlotPageRef.current = plotPage

  return (
    <div
      className="absolute inset-0 z-40 flex"
      style={{ touchAction: 'manipulation' }}
      onWheel={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.stopPropagation() } }}
    >
      <style>{`
        @keyframes tree-pop { 0% { transform: scale(0.7); opacity:0 } 70% { transform: scale(1.03); opacity:1 } 100% { transform: scale(1); opacity:1 } }
        @keyframes sap-collect { 0% { transform: translateY(0); opacity:1 } 100% { transform: translateY(-30px); opacity:0 } }
        @keyframes sap-drop-burst { 0% { opacity:0; transform: scale(0) translateY(0) } 15% { opacity:1; transform: scale(1.3) translateY(-5px) } 40% { opacity:0.9; transform: scale(1) translateY(-15px) } 100% { opacity:0; transform: scale(0.5) translateY(-40px) } }
        @keyframes sap-funnel { 0% { opacity:0; transform: scale(0.3) translate(0,0) } 20% { opacity:1; transform: scale(1.2) translate(0,0) } 100% { opacity:0; transform: scale(0.4) translate(var(--funnel-tx), var(--funnel-ty)) } }
        @keyframes sap-bounce { 0% { transform: scale(1) } 20% { transform: scale(0.92) translateY(2px) } 50% { transform: scale(1.06) translateY(-3px) } 100% { transform: scale(1) } }
        @keyframes sap-pop { 0% { transform: translate(-50%, 10px) scale(0.3); opacity: 0 } 40% { transform: translate(-50%, -5px) scale(2); opacity: 1 } 100% { transform: translate(-50%, 0) scale(1.8); opacity: 1 } }
        @keyframes sap-ramp { 0% { opacity:0; transform: translateY(4px) } 15% { opacity:1; transform: translateY(0) } 85% { opacity:1; transform: translateY(0) } 100% { opacity:0; transform: translateY(-4px) } }
        @keyframes sap-merge { 0% { opacity:0.85; transform: translateY(0) scale(1) } 50% { opacity:0.6; transform: translateY(-8px) scale(0.8) } 100% { opacity:0; transform: translateY(-14px) scale(0.5) } }
        @keyframes sap-drip {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          8% { transform: translateY(0) scale(1); opacity: 0.9; }
          15% { transform: translateY(0) scale(1.2); opacity: 0.9; }
          20% { transform: translateY(1px) scale(0.9); opacity: 0.85; }
          80% { transform: translateY(var(--drip-dist)) scale(0.7); opacity: 0.7; }
          90% { transform: translateY(var(--drip-dist)) scale(0.3); opacity: 0.3; }
          100% { transform: translateY(var(--drip-dist)) scale(0); opacity: 0; }
        }
        @keyframes dash-spin { 0% { stroke-dashoffset: 0 } 100% { stroke-dashoffset: -34.56 } }
        @keyframes ascension-pulse { 0%,100% { opacity: 0.4; transform: scale(1) } 50% { opacity: 0.7; transform: scale(1.08) } }
        .ascension-aura { animation: ascension-pulse 3s ease-in-out infinite; }
        .ascension-tier-1 { background: radial-gradient(circle, rgba(168,216,168,0.25) 0%, transparent 70%); }
        .ascension-tier-2 { background: radial-gradient(circle, rgba(110,184,224,0.3) 0%, transparent 70%); }
        .ascension-tier-3 { background: radial-gradient(circle, rgba(232,196,74,0.4) 0%, rgba(232,196,74,0.1) 40%, transparent 70%); box-shadow: 0 0 12px rgba(232,196,74,0.15); }
      `}</style>
      <div
        onWheel={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.stopPropagation() } }}
        className="relative flex overflow-hidden w-full h-full"
      >
        {/* Main orchard area */}
        <div ref={captureRef} className="flex-1 flex flex-col relative overflow-hidden">
          {/* Topbar with sap count */}
          <div data-orchard-ui className="absolute top-0 left-0 right-0 h-10 z-[60] flex items-center justify-center" style={{
            backgroundColor: isDark ? 'rgba(24,24,27,0.85)' : 'rgba(250,250,250,0.9)',
            backdropFilter: 'blur(20px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
          }}>
            <div className="flex items-center justify-center w-full h-full gap-2.5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              {/* Hidden collect target for sap animation */}
              <span ref={collectBtnRef} className="absolute left-2 opacity-0 pointer-events-none">
                <span ref={sapCounterRef}>{sap}</span>
              </span>

              <button
                onClick={() => { setActiveTool(t => t === 'axe' ? 'none' : 'axe'); setChopTarget(null); setEditMode(false) }}
                className="flex items-center justify-center rounded-md transition-all"
                style={{
                  width: 30, height: 30,
                  backgroundColor: activeTool === 'axe' ? (isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)') : 'transparent',
                  color: activeTool === 'axe' ? '#ef4444' : (isDark ? 'rgba(161,161,170,0.7)' : 'rgba(113,113,122,0.7)'),
                }}
                title="Chop"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M11 6v16c0 0-.5-1-1.5-1.5" /><rect x="9.5" y="1" width="3" height="1.5" rx="0.3" /><path d="M9.5 2.5L9.5 8.5L20 8.5L18 2.5Z" /></svg>
              </button>
              <button
                onClick={() => { setEditMode(e => !e); setActiveTool('none'); setChopTarget(null) }}
                className="flex items-center justify-center rounded-md transition-all"
                style={{
                  width: 30, height: 30,
                  backgroundColor: editMode ? (isDark ? 'rgba(217,119,6,0.2)' : 'rgba(217,119,6,0.1)') : 'transparent',
                  color: editMode ? '#d97706' : (isDark ? 'rgba(161,161,170,0.7)' : 'rgba(113,113,122,0.7)'),
                }}
                title="Edit layout"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button
                onClick={captureOrchard}
                className="flex items-center justify-center rounded-md transition-all"
                style={{
                  width: 30, height: 30,
                  backgroundColor: 'transparent',
                  color: screenshotBusy ? '#d97706' : (isDark ? 'rgba(161,161,170,0.7)' : 'rgba(113,113,122,0.7)'),
                  opacity: screenshotBusy ? 0.5 : 1,
                }}
                title="Screenshot"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>

              {sapMultiplier > 1 && (
                <>
                  <div className="w-px h-4" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
                  <span className="text-[10px] tabular-nums" style={{ color: '#4ade80', fontWeight: 600 }}>{sapMultiplier.toFixed(1)}x</span>
                </>
              )}
            </div>
          </div>
          {/* Sap drop animations */}
          <div data-orchard-ui className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-none" style={{ fontFamily: 'Crimson Pro, serif' }}>
              {collectAllAnim.active && collectAllAnim.current >= collectAllAnim.total && collectAllAnim.total > 0 && (
                <div style={{
                  pointerEvents: 'none', zIndex: 999,
                  fontFamily: 'Crimson Pro, serif', fontWeight: 400, fontSize: 20,
                  color: '#d97706', textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                  animation: 'sap-collect 1.2s ease-out forwards',
                  textAlign: 'center',
                }}>
                  +{collectAllAnim.total}
                </div>
              )}
              {sapDrops.map(drop => (
                <div key={drop.id} className="fixed pointer-events-none" style={{
                  left: drop.x, top: drop.y, zIndex: 9998,
                  opacity: 0,
                  '--funnel-tx': sapFunnelTarget ? `${sapFunnelTarget.x - drop.x}px` : '0px',
                  '--funnel-ty': sapFunnelTarget ? `${sapFunnelTarget.y - drop.y}px` : '-40px',
                  animation: `sap-funnel 0.9s cubic-bezier(0.4, 0, 0.2, 1) ${drop.delay}ms forwards`,
                } as React.CSSProperties}>
                  <PulpIcon size={10} />
                </div>
              ))}
          </div>
          <canvas data-orchard-ui id="flyCanvas" className="fixed inset-0 pointer-events-none z-[9999]" />
          <div className="absolute inset-0 z-50 pointer-events-none" style={{ boxShadow: `inset 12px 0 20px -8px ${isDark ? 'rgba(9,9,11,0.25)' : 'rgba(60,50,40,0.1)'}` }} />
          <div data-orchard-ui className="absolute left-0 top-0 bottom-0 z-50 pointer-events-none" style={{ width: 80, background: `linear-gradient(to right, ${isDark ? 'rgba(9,9,11,0.3)' : 'rgba(50,45,38,0.12)'} 0%, transparent 100%)` }} />
          <Terrain isDark={isDark} treeCount={currentPlotTrees.length} treeBases={placed} chopMode={activeTool === 'axe'} showChopHint={showChopHint} orchardTimeMode={orchardTimeMode} onToggleChop={handleToggleChop} onOpenShop={onOpenShop} />


          {/* Orchard scene */}
          <div className="flex-1 relative overflow-hidden" style={{
            perspective: '800px',
          }}>

            {/* Plot switcher overlay */}
            <div data-orchard-ui className="absolute top-3 left-0 right-0 z-30 flex items-center justify-center gap-3 pointer-events-none">
              {(filteredTrees.length > TREES_PER_PLOT || nbUnlocked > 1) && (
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5 pointer-events-auto" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                  <button onClick={() => setPlotPage(p => Math.max(0, p - 1))} disabled={plotPage === 0} className="p-0.5 disabled:opacity-30 hover:opacity-100 opacity-70 transition-opacity" style={{ color: '#fff' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="text-[9px] tabular-nums font-normal uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Plot {plotPage + 1} <span className="opacity-50">/ {nbUnlocked}</span>
                  </span>
                  {plotPage + 1 < nbUnlocked ? (
                    <button onClick={() => setPlotPage(p => Math.min(nbUnlocked - 1, p + 1))} className="p-0.5 hover:opacity-100 opacity-70 transition-opacity" style={{ color: '#fff' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  ) : nbUnlocked < MAX_PLOTS ? (
                    <button
                      onClick={unlockNextPlot}
                      disabled={(gems ?? 0) < (PLOT_COST[nbUnlocked] || 0)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-normal uppercase tracking-wider transition-all disabled:opacity-40"
                      style={{ color: '#d97706' }}
                      title={`Unlock plot ${nbUnlocked + 1} for ${PLOT_COST[nbUnlocked]} gems`}
                    >
                      <GemIcon size={9} /> {PLOT_COST[nbUnlocked]}
                    </button>
                  ) : (
                    <span className="p-0.5 opacity-30" style={{ color: '#fff' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </span>
                  )}
                </div>
              )}
              {/* Axe chop toggle is now the stump in the terrain */}
            </div>
            <div ref={orchardRef} className="absolute inset-0" style={{
              transform: 'rotateX(8deg)',
              transformOrigin: 'center 40%',
            }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedNotebook ?? 'all'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
                style={{ paddingLeft: 0 }}
              >
                {(() => { return (
                  <>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 0 }}>
                      {(() => {
                        const pad = 3
                        const yT = 38, yB = 100, steps = 24
                        const getL = (_y: number) => 0
                        const getR = (_y: number) => 100

                        const rngE = seededRng(4477)
                        let pathD = ''
                        const rightSeg: string[] = []
                        for (let i = 0; i <= steps; i++) {
                          const y = yT - pad + i * (yB - yT + pad * 2) / steps
                          const lx = getL(y) - pad + (rngE() - 0.5) * 1.0
                          const rx = getR(y) + pad + (rngE() - 0.5) * 1.0
                          if (i === 0) pathD += `M${lx.toFixed(1)},${y.toFixed(1)}`
                          else pathD += ` L${lx.toFixed(1)},${y.toFixed(1)}`
                          rightSeg.push(`${rx.toFixed(1)},${y.toFixed(1)}`)
                        }
                        for (let i = rightSeg.length - 1; i >= 0; i--) pathD += ` L${rightSeg[i]}`
                        pathD += 'Z'

                        const tufts: string[] = []
                        const blades: string[] = []
                        const clover: string[] = []
                        const bushes: string[] = []
                        for (let i = 0; i < 400; i++) {
                          const rng = seededRng(i * 43 + 997)
                          const ty = yT - pad + rng() * (yB - yT + pad * 2)
                          const lE = getL(ty) - pad
                          const rE = getR(ty) + pad
                          const tx = lE + rng() * (rE - lE)
                          const edgeDist = Math.min(tx - lE, rE - tx, ty - (yT - pad), (yB + pad) - ty)
                          const fade = Math.min(1, edgeDist / 5)
                          if (fade < 0.05) continue
                          const h = (0.4 + rng() * 0.8) * fade
                          const sway = (rng() - 0.5) * 0.4
                          tufts.push(`M${tx.toFixed(1)},${ty.toFixed(1)}q${sway.toFixed(2)},${(-h * 0.5).toFixed(2)} ${(sway * 0.3).toFixed(2)},${(-h).toFixed(2)}`)
                          tufts.push(`M${(tx + 0.1).toFixed(2)},${ty.toFixed(1)}q${((rng() - 0.5) * 0.4).toFixed(2)},${(-h * 0.4).toFixed(2)} ${((rng() - 0.5) * 0.2).toFixed(2)},${(-h * 0.85).toFixed(2)}`)
                          tufts.push(`M${(tx - 0.1).toFixed(2)},${ty.toFixed(1)}q${((rng() - 0.5) * 0.35).toFixed(2)},${(-h * 0.35).toFixed(2)} ${((rng() - 0.5) * 0.15).toFixed(2)},${(-h * 0.7).toFixed(2)}`)
                        }
                        for (let i = 0; i < 150; i++) {
                          const rng = seededRng(i * 59 + 1231)
                          const by = yT - pad + 1 + rng() * (yB - yT + pad * 2 - 2)
                          const lE = getL(by) - pad + 1
                          const rE = getR(by) + pad - 1
                          const bx = lE + rng() * (rE - lE)
                          const edgeDist = Math.min(bx - lE, rE - bx, by - (yT - pad), (yB + pad) - by)
                          const fade = Math.min(1, edgeDist / 4)
                          if (fade < 0.08) continue
                          const bh = (0.5 + rng() * 1.0) * fade
                          const curve = (rng() - 0.5) * 0.7
                          blades.push(`M${bx.toFixed(1)},${by.toFixed(1)}C${(bx + curve * 0.2).toFixed(1)},${(by - bh * 0.3).toFixed(1)} ${(bx + curve * 0.7).toFixed(1)},${(by - bh * 0.6).toFixed(1)} ${(bx + curve * 0.5).toFixed(1)},${(by - bh).toFixed(1)}`)
                        }
                        for (let i = 0; i < 20; i++) {
                          const rng = seededRng(i * 37 + 2099)
                          const cy = yT - pad + 3 + rng() * (yB - yT + pad * 2 - 6)
                          const lE = getL(cy) - pad + 3
                          const rE = getR(cy) + pad - 3
                          const cx = lE + rng() * (rE - lE)
                          const cs = 0.12 + rng() * 0.1
                          for (let l = 0; l < 3; l++) {
                            const la = (l / 3) * Math.PI * 2 + rng() * 0.4
                            clover.push(`M${cx.toFixed(2)},${cy.toFixed(2)}Q${(cx + Math.cos(la) * cs * 1.3).toFixed(2)},${(cy + Math.sin(la) * cs * 1.3).toFixed(2)} ${(cx + Math.cos(la + 0.35) * cs * 0.7).toFixed(2)},${(cy + Math.sin(la + 0.35) * cs * 0.7).toFixed(2)}`)
                          }
                        }
                        for (let i = 0; i < 30; i++) {
                          const rng = seededRng(i * 83 + 6601)
                          const by = yT - pad + 2 + rng() * (yB - yT + pad * 2 - 4)
                          const lE = getL(by) - pad + 2
                          const rE = getR(by) + pad - 2
                          const bx = lE + rng() * (rE - lE)
                          const edgeDist = Math.min(bx - lE, rE - bx, by - (yT - pad), (yB + pad) - by)
                          const fade = Math.min(1, edgeDist / 5)
                          if (fade < 0.1) continue
                          const bw = (0.5 + rng() * 0.9) * fade
                          const bh2 = (0.25 + rng() * 0.5) * fade
                          bushes.push(`M${(bx - bw).toFixed(1)},${by.toFixed(1)}Q${(bx - bw * 0.4).toFixed(1)},${(by - bh2 * 1.4).toFixed(1)} ${bx.toFixed(1)},${(by - bh2).toFixed(1)}Q${(bx + bw * 0.5).toFixed(1)},${(by - bh2 * 1.3).toFixed(1)} ${(bx + bw).toFixed(1)},${by.toFixed(1)}Z`)
                        }
                        return <>
                          <path d={bushes.join('')} fill={isDark ? '#1e3414' : '#3a7a2e'} opacity={isDark ? 0.06 : 0.035} />
                          <path d={tufts.join('')} stroke={isDark ? '#2a5a1e' : '#4a8a3a'} strokeWidth="0.12" fill="none" opacity={isDark ? 0.12 : 0.07} />
                          <path d={blades.join('')} stroke={isDark ? '#3a6a2a' : '#5a9a48'} strokeWidth="0.08" fill="none" opacity={isDark ? 0.1 : 0.06} />
                          <path d={clover.join('')} stroke={isDark ? '#3a6a2a' : '#4a8a38'} strokeWidth="0.06" fill={isDark ? '#2a4a1e' : '#3a7a2e'} opacity={isDark ? 0.08 : 0.04} />
                        </>
                      })()}
                    </svg>
                    {tillSvg}
                    {filteredTrees.length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 pointer-events-none">
                        <p className="text-[11px] font-normal" style={{ color: isDark ? '#8a8780' : '#7a7670' }}>
                          {selectedNotebook === null ? 'Your orchard is empty.' :
                           selectedNotebook === '_unassigned' ? 'No unassigned trees.' :
                           'No trees grown for this notebook yet.'}
                        </p>
                      </div>
                    )}
                    {emptySlots.map(slot => {
                      const depthT = Math.max(0, Math.min(1, (slot.y - 40) / 55))
                      const s = 20 + depthT * 16
                      const holeNudge = slot.col < 2 ? -0.8 : slot.col > 2 ? 0.8 : 0
                      return (
                        <div
                          key={`empty-${slot.slotIndex}`}
                          className="absolute group/spot"
                          style={{
                            left: `${slot.x + holeNudge}%`,
                            top: `${slot.y + 1.5}%`,
                            width: s,
                            height: s * 0.45,
                            transform: 'translate(-50%, -50%)',
                            zIndex: Math.round(slot.y) - 1,
                          }}
                        >
                          <svg viewBox="0 0 40 18" className="w-full h-full overflow-visible">
                            <ellipse
                              cx={20} cy={9} rx={18} ry={7}
                              fill={isDark ? 'rgba(217,119,6,0.05)' : 'rgba(217,119,6,0.07)'}
                              stroke={isDark ? 'rgba(217,119,6,0.28)' : 'rgba(217,119,6,0.33)'}
                              strokeWidth={1.2}
                              strokeDasharray="3 2.5"
                              className="group-hover/spot:animate-[dash-spin_4s_linear_infinite]"
                            />
                          </svg>
                        </div>
                      )
                    })}
                    {placed.map(({ x, y, tree, slotIndex }, renderIdx) => {
                      const typeInfo = TREE_TYPES[tree.type]
                      const rarity = typeInfo?.rarity || 'common'
                      const meta = RARITY_META[rarity] || RARITY_META.common
                      const shape = typeInfo?.shape || 'oak'
                      const shapeScale = ({ oak: 1.14, conifer: 1.19, birch: 1.1, cypress: 1.19, sakura: 1.14, bamboo: 1.05, void: 1.0 } as Record<string, number>)[shape] || 0.91
                      const depthT = Math.max(0, Math.min(1, (y - 40) / 55))
                      const depthScale = 0.55 + depthT * 0.55
                      const treeSize = Math.round((baseSize * depthScale * shapeScale) / 16) * 16 || 16
                      const scaleY = 0.75 + depthT * 0.25
                      const dimAmount = Math.round((1 - depthT) * 25)
                      const skewX = ((x - 50) / 50) * (1 - depthT) * -2
                      const glowColor = meta.color

                      return (
                        <div
                          key={`${tree.id ?? 'tree'}-${renderIdx}`}
                          className="absolute flex flex-col items-center group"
                          onMouseEnter={(e) => {
                            if (hoveredElRef.current) hoveredElRef.current.style.zIndex = hoveredZRef.current
                            hoveredElRef.current = e.currentTarget
                            hoveredZRef.current = e.currentTarget.style.zIndex
                            e.currentTarget.style.zIndex = '998'
                          }}
                          onMouseLeave={(e) => {
                            if (hoveredElRef.current === e.currentTarget) {
                              e.currentTarget.style.zIndex = hoveredZRef.current
                              hoveredElRef.current = null
                            }
                          }}
                          onPointerDown={(e) => {
                            if (editMode) {
                              e.preventDefault()
                              dragElRef.current = e.currentTarget as HTMLElement
                              handleDragStart(tree.id, slotIndex, e.clientX, e.clientY)
                              return
                            }
                            if (activeTool === 'axe') {
                              setChopTarget({ tree, sap: getSapYield(tree) })
                              return
                            }
                            setFocusedTree({ tree, x, y })
                          }}
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: `translate(-50%, -${(75 + depthT * 10).toFixed(0)}%) scaleY(${scaleY.toFixed(3)}) skewX(${skewX.toFixed(1)}deg)`,
                            transformOrigin: 'center bottom',
                            zIndex: Math.round(y),
                            cursor: editMode ? 'grab' : activeTool === 'axe' ? 'crosshair' : undefined,
                            opacity: 1,
                          }}
                        >
                          <div style={{
                            position: 'relative',
                            transform: reduceMotion ? undefined : `perspective(200px) rotateY(${((x - 50) / 50 * -2).toFixed(1)}deg)`,
                            transformOrigin: 'center bottom',
                            animation: reduceMotion ? undefined : `tree-pop 0.3s ease-out ${renderIdx * 12}ms backwards`,
                          }}>
                            <div className={tree.stage >= 3 ? getRarityPlantClass(tree.type) : ''} style={{
                              filter: dimAmount > 0 ? `brightness(${100 - dimAmount}%)` : undefined,
                              position: 'relative',
                            }}>
                              {(tree.ascension || 0) > 0 && (
                                <div className={`ascension-aura ascension-tier-${tree.ascension}`} style={{
                                  position: 'absolute', inset: -6, borderRadius: '50%', pointerEvents: 'none', zIndex: -1,
                                }} />
                              )}
                              <CachedPlantIcon type={tree.type} size={treeSize} stage={tree.stage} hideGround dirtSeed={(renderIdx + 1) * 983 + Math.round(x * 17) + Math.round(y * 29)} dirtDark={isDark} dirtDepth={depthT} dirtTilt={skewX * 3} disableSway={reduceMotion || placed.length > 30} />
                            </div>
                            {/* Dirt mound */}
                            <svg style={{ position: 'absolute', left: '50%', bottom: -2, transform: 'translateX(-50%)', width: treeSize * 0.7, height: treeSize * 0.18, zIndex: -1, pointerEvents: 'none', overflow: 'visible' }} viewBox="0 0 40 10">
                              <ellipse cx="20" cy="8" rx="18" ry="4" fill={isDark ? '#1e1a10' : '#7a6a4a'} opacity={(0.35 + depthT * 0.15) * (isDark ? 0.35 : 1)} />
                              <ellipse cx="20" cy="7.5" rx="14" ry="3" fill={isDark ? '#2a2418' : '#8a7a5a'} opacity={(0.25 + depthT * 0.1) * (isDark ? 0.35 : 1)} />
                            </svg>
                            {/* Ground shadow — simple ellipse instead of blur */}
                            <div style={{
                              position: 'absolute',
                              left: '50%',
                              bottom: -4,
                              transform: 'translateX(-50%)',
                              width: treeSize * 1.4,
                              height: treeSize * 0.2,
                              borderRadius: '50%',
                              zIndex: -1,
                              background: isDark
                                ? 'radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)'
                                : 'radial-gradient(ellipse, rgba(30,25,15,0.2) 0%, transparent 70%)',
                              pointerEvents: 'none',
                            }} />
                          </div>

                          {(() => {
                            const popLeft = x > 50
                            const planted = tree.plantedAt ? new Date(tree.plantedAt) : null
                            const plantedStr = planted ? planted.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null
                            const ageMs = planted ? Date.now() - planted.getTime() : 0
                            const ageDays = Math.floor(ageMs / 86400000)
                            const ageHrs = Math.floor(ageMs / 3600000)
                            const ageStr = ageDays > 0 ? `${ageDays}d ago` : ageHrs > 0 ? `${ageHrs}h ago` : 'Just now'
                            return (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{
                              zIndex: 300, position: 'absolute',
                              top: '100%', left: '50%', transform: 'translateX(-50%)',
                              marginTop: 4,
                            }}>
                              <div className="px-3 py-2 rounded-lg" style={{
                                backgroundColor: isDark ? 'rgba(12,12,14,0.95)' : 'rgba(255,255,255,0.97)',
                                border: `1.5px solid ${meta.border}`,
                                boxShadow: `0 4px 16px rgba(0,0,0,0.2), inset 0 0 0 0.5px ${meta.border}`,
                                minWidth: 110,
                              }}>
                                <div className="flex items-center gap-1.5">
                                  <div className="rounded-full" style={{ width: 5, height: 5, backgroundColor: meta.color, flexShrink: 0 }} />
                                  <span className="text-[10px] font-normal tracking-wide whitespace-nowrap" style={{ color: meta.color }}>
                                    {typeInfo?.name || tree.type}
                                  </span>
                                </div>
                                {plantedStr && (
                                  <div className="mt-1.5 flex flex-col gap-0.5">
                                    <span className="text-[8px] whitespace-nowrap" style={{ color: textSecondary }}>
                                      Planted {plantedStr}
                                    </span>
                                    <span className="text-[8px] whitespace-nowrap" style={{ color: textMuted }}>
                                      {ageStr}
                                    </span>
                                  </div>
                                )}
                                {tree.stage < 4 && (
                                  <div className="w-full h-[2px] rounded-full mt-1.5 overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, tree.progress)}%`, background: meta.color }} />
                                  </div>
                                )}
                              </div>
                            </div>
                            )
                          })()}
                        </div>
                      )
                    })}
                  </>
                ); })()}
              </motion.div>
            </AnimatePresence>
            </div>
          </div>

          {/* Tool hint labels */}
          {(activeTool === 'axe' || editMode) && (
            <div data-orchard-ui className="absolute left-1/2 -translate-x-1/2 top-12 z-50">
              {activeTool === 'axe' && (
                <span className="text-[9px] font-normal uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: '#ef4444', backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)' }}>
                  Tap tree to chop
                </span>
              )}
              {editMode && (
                <span className="text-[9px] font-normal uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: '#d97706', backgroundColor: isDark ? 'rgba(217,119,6,0.15)' : 'rgba(217,119,6,0.1)' }}>
                  Drag to move
                </span>
              )}
            </div>
          )}

          {/* Chop confirmation popup */}
          <AnimatePresence>
            {chopTarget && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 z-50 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={() => setChopTarget(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-lg p-5 flex flex-col items-center gap-3 min-w-[220px]"
                  style={{
                    backgroundColor: isDark ? '#1a1816' : '#faf8f5',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ transform: 'scale(0.8)' }}>
                    <PlantIcon type={chopTarget.tree.type} size={80} stage={chopTarget.tree.stage} hideGround />
                  </div>
                  <span className="text-[13px] font-normal" style={{ color: isDark ? '#d4d0c8' : '#3a3630', fontFamily: 'EB Garamond, serif' }}>
                    Chop {TREE_TYPES[chopTarget.tree.type]?.name || chopTarget.tree.type}?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PulpIcon size={14} />
                    <span className="text-[14px] font-normal" style={{ color: '#d97706' }}>+{chopTarget.sap} sap</span>
                  </div>
                  <div className="flex gap-2 mt-1 w-full">
                    <button
                      onClick={() => setChopTarget(null)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-normal uppercase tracking-wider transition-colors"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        color: isDark ? '#8a8780' : '#7a7670',
                      }}
                    >
                      Keep
                    </button>
                    <button
                      onClick={confirmChop}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-normal uppercase tracking-wider transition-colors"
                      style={{
                        backgroundColor: 'rgba(217,119,6,0.15)',
                        color: '#d97706',
                      }}
                    >
                      Chop
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {focusedTree && (() => {
              const ft = focusedTree.tree
              const typeInfo = TREE_TYPES[ft.type]
              const rarity = typeInfo?.rarity || 'common'
              const meta = RARITY_META[rarity] || RARITY_META.common
              const planted = ft.plantedAt ? new Date(ft.plantedAt) : null
              const plantedStr = planted ? planted.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : null
              const ageMs = planted ? Date.now() - planted.getTime() : 0
              const ageDays = Math.floor(ageMs / 86400000)
              const ageHrs = Math.floor(ageMs / 3600000)
              const ageMins = Math.floor(ageMs / 60000)
              const ageStr = ageDays > 0 ? `${ageDays} day${ageDays > 1 ? 's' : ''} old` : ageHrs > 0 ? `${ageHrs} hour${ageHrs > 1 ? 's' : ''} old` : `${ageMins} min old`
              const stageNames = ['Seed', 'Sprout', 'Sapling', 'Young', 'Mature']
              const sapPerTick = getTreeSapMax(ft)
              const notebook = ft.notebookId ? notes.find(n => n.id === ft.notebookId) : null
              const currentAscension = ft.ascension || 0
              const canAscend = ft.stage === 4 && currentAscension < 3 && ft.type !== 'spoiled'
              const nextTier = currentAscension < 3 ? ASCENSION_TIERS[currentAscension] : null
              const costs = ASCENSION_COSTS[rarity] || ASCENSION_COSTS.common
              const sapCost = canAscend ? costs.sap[currentAscension] : 0
              const sacrificeCount = canAscend ? costs.sacrifices[currentAscension] : 0
              const RARITY_RANK: Record<string, number> = { common: 0, uncommon: 1, rare: 2, 'true rare': 3, sacred: 4 }
              const targetRarityRank = RARITY_RANK[rarity] ?? 0
              const eligibleSacrifices = grove.filter(t =>
                t.id !== ft.id &&
                t.stage === 4 &&
                t.type !== 'spoiled' &&
                (RARITY_RANK[TREE_TYPES[t.type]?.rarity] ?? 0) >= targetRarityRank &&
                !selectedSacrifices.includes(t.id)
              )
              const canAfford = sap >= sapCost && (selectedSacrifices.length >= sacrificeCount)

              const doAscend = () => {
                if (!canAfford || !canAscend) return
                setSap((s: number) => s - sapCost)
                const sacrificeIds = new Set(selectedSacrifices.slice(0, sacrificeCount))
                setGrove((g: any[]) => g.filter(t => !sacrificeIds.has(t.id)).map(t =>
                  t.id === ft.id ? { ...t, ascension: currentAscension + 1 } : t
                ))
                setFocusedTree(prev => prev ? { ...prev, tree: { ...prev.tree, ascension: currentAscension + 1 } } : null)
                setAscensionMode(false)
                setSelectedSacrifices([])
              }

              const tierColors = ['#a8d8a8', '#6eb8e0', '#e8c44a']
              const tierGlow = currentAscension > 0 ? tierColors[currentAscension - 1] : undefined

              return (
                <motion.div
                  key="tree-focus"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-50 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                  onClick={() => { setFocusedTree(null); setAscensionMode(false); setSelectedSacrifices([]) }}
                >
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="rounded-xl flex flex-col items-center gap-4"
                    style={{
                      padding: '28px 32px 24px',
                      backgroundColor: isDark ? '#141316' : '#fdfcfa',
                      border: `1.5px solid ${tierGlow || meta.border}`,
                      boxShadow: tierGlow
                        ? `0 20px 60px rgba(0,0,0,0.4), 0 0 ${currentAscension * 12}px ${tierGlow}40, 0 0 0 1px ${tierGlow}60`
                        : `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${meta.border}`,
                      minWidth: ascensionMode ? 360 : 240, maxWidth: ascensionMode ? 400 : 300,
                      fontFamily: 'Crimson Pro, serif',
                      transition: 'min-width 0.2s, max-width 0.2s',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ position: 'relative' }}>
                      {currentAscension > 0 && (
                        <div style={{
                          position: 'absolute', inset: -12, borderRadius: '50%',
                          background: `radial-gradient(circle, ${tierGlow}20 0%, transparent 70%)`,
                          animation: 'ascension-pulse 2s ease-in-out infinite',
                          pointerEvents: 'none',
                        }} />
                      )}
                      <PlantIcon type={ft.type} size={100} stage={ft.stage} hideGround />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-full" style={{ width: 7, height: 7, backgroundColor: tierGlow || meta.color }} />
                      <span className="text-[16px] font-normal tracking-wide" style={{ color: isDark ? '#e8e4dc' : '#2a2620' }}>
                        {typeInfo?.name || ft.type}
                      </span>
                      {currentAscension > 0 && (
                        <span style={{
                          fontSize: 9, fontWeight: 400, letterSpacing: '0.08em',
                          padding: '1px 6px', borderRadius: 4,
                          backgroundColor: `${tierGlow}20`, color: tierGlow,
                          textTransform: 'uppercase',
                        }}>
                          {ASCENSION_TIERS[currentAscension - 1].name}
                        </span>
                      )}
                    </div>

                    {!ascensionMode ? (
                      <>
                        <div className="w-full flex flex-col gap-2 mt-1" style={{ color: isDark ? '#8a8680' : '#7a7670', fontSize: 11 }}>
                          <div className="flex justify-between">
                            <span>Stage</span>
                            <span style={{ color: meta.color, fontWeight: 400 }}>{stageNames[ft.stage] || 'Unknown'}</span>
                          </div>
                          {ft.stage < 4 && (
                            <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, ft.progress)}%`, background: meta.color }} />
                            </div>
                          )}
                          {plantedStr && (
                            <div className="flex justify-between">
                              <span>Planted</span>
                              <span style={{ color: isDark ? '#b0aca4' : '#5a5650' }}>{plantedStr}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Age</span>
                            <span style={{ color: isDark ? '#b0aca4' : '#5a5650' }}>{ageStr}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sap rate</span>
                            <span style={{ color: '#d97706', fontWeight: 400 }}>{sapPerTick}/cycle</span>
                          </div>
                          {currentAscension > 0 && (
                            <div className="flex justify-between">
                              <span>Ascension</span>
                              <span style={{ color: tierGlow, fontWeight: 400 }}>{ASCENSION_TIERS[currentAscension - 1].name}</span>
                            </div>
                          )}
                          {notebook && (
                            <div className="flex justify-between">
                              <span>Notebook</span>
                              <span className="truncate max-w-[120px]" style={{ color: isDark ? '#b0aca4' : '#5a5650' }}>{notebook.subject || 'Untitled'}</span>
                            </div>
                          )}
                        </div>
                        <div className="w-full flex flex-col gap-2 mt-1">
                          {canAscend && (
                            <button
                              onClick={() => { setAscensionMode(true); setSelectedSacrifices([]) }}
                              className="w-full py-2 rounded-lg text-[11px] font-normal uppercase tracking-wider transition-all"
                              style={{
                                background: `linear-gradient(135deg, ${tierColors[currentAscension]}30, ${tierColors[currentAscension]}15)`,
                                border: `1px solid ${tierColors[currentAscension]}40`,
                                color: tierColors[currentAscension],
                              }}
                            >
                              Ascend to {nextTier?.name}
                            </button>
                          )}
                          <button
                            onClick={() => { setFocusedTree(null); setAscensionMode(false); setSelectedSacrifices([]) }}
                            className="w-full py-1.5 rounded-lg text-[11px] font-normal uppercase tracking-wider"
                            style={{
                              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                              color: isDark ? '#6a6860' : '#9a9690',
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-full" style={{ fontSize: 11, color: isDark ? '#8a8680' : '#7a7670' }}>
                          <div style={{
                            padding: '8px 10px', borderRadius: 8, marginBottom: 8,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          }}>
                            <div className="flex justify-between mb-1">
                              <span>Sap cost</span>
                              <span style={{ color: sap >= sapCost ? '#d97706' : '#ef4444', fontWeight: 400 }}>{sapCost} <span style={{ opacity: 0.5 }}>({sap} owned)</span></span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sacrifices needed</span>
                              <span style={{ color: selectedSacrifices.length >= sacrificeCount ? '#6b9a6b' : '#ef4444', fontWeight: 400 }}>
                                {selectedSacrifices.length}/{sacrificeCount} <span style={{ opacity: 0.5 }}>({rarity}+ mature)</span>
                              </span>
                            </div>
                            {nextTier && (
                              <div className="flex justify-between mt-1" style={{ opacity: 0.6 }}>
                                <span>Sap rate after</span>
                                <span style={{ color: '#d97706' }}>{Math.round(sapPerTick * nextTier.sapMultiplier / (currentAscension > 0 ? ASCENSION_TIERS[currentAscension - 1].sapMultiplier : 1))}/cycle</span>
                              </div>
                            )}
                          </div>

                          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {grove.filter(t =>
                              t.id !== ft.id &&
                              t.stage === 4 &&
                              t.type !== 'spoiled' &&
                              (RARITY_RANK[TREE_TYPES[t.type]?.rarity] ?? 0) >= targetRarityRank
                            ).length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '16px 0', opacity: 0.4, fontStyle: 'italic' }}>
                                No eligible mature trees to sacrifice
                              </div>
                            ) : (
                              grove.filter(t =>
                                t.id !== ft.id &&
                                t.stage === 4 &&
                                t.type !== 'spoiled' &&
                                (RARITY_RANK[TREE_TYPES[t.type]?.rarity] ?? 0) >= targetRarityRank
                              ).map(t => {
                                const ti = TREE_TYPES[t.type]
                                const selected = selectedSacrifices.includes(t.id)
                                return (
                                  <button
                                    key={t.id}
                                    onClick={() => {
                                      if (selected) setSelectedSacrifices(s => s.filter(id => id !== t.id))
                                      else if (selectedSacrifices.length < sacrificeCount) setSelectedSacrifices(s => [...s, t.id])
                                    }}
                                    className="flex items-center gap-3 w-full rounded-lg transition-all"
                                    style={{
                                      padding: '6px 8px',
                                      backgroundColor: selected
                                        ? (isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)')
                                        : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                                      border: `1px solid ${selected ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
                                      opacity: !selected && selectedSacrifices.length >= sacrificeCount ? 0.3 : 1,
                                    }}
                                  >
                                    <PlantIcon type={t.type} size={28} stage={4} hideGround />
                                    <div className="flex-1 text-left">
                                      <div style={{ fontWeight: 400, color: isDark ? '#d0ccc4' : '#3a3630', fontSize: 11 }}>{ti?.name}</div>
                                      <div style={{ fontSize: 9, opacity: 0.5 }}>{ti?.rarity}{t.ascension ? ` · ${ASCENSION_TIERS[t.ascension - 1]?.name}` : ''}</div>
                                    </div>
                                    <div style={{
                                      width: 16, height: 16, borderRadius: 4,
                                      border: `1.5px solid ${selected ? '#ef4444' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                                      backgroundColor: selected ? '#ef4444' : 'transparent',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                                    </div>
                                  </button>
                                )
                              })
                            )}
                          </div>
                        </div>

                        <div className="w-full flex gap-2 mt-1">
                          <button
                            onClick={() => { setAscensionMode(false); setSelectedSacrifices([]) }}
                            className="flex-1 py-1.5 rounded-lg text-[11px] font-normal uppercase tracking-wider"
                            style={{
                              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                              color: isDark ? '#6a6860' : '#9a9690',
                            }}
                          >
                            Back
                          </button>
                          <button
                            onClick={doAscend}
                            disabled={!canAfford}
                            className="flex-1 py-1.5 rounded-lg text-[11px] font-normal uppercase tracking-wider transition-all"
                            style={{
                              background: canAfford
                                ? `linear-gradient(135deg, ${tierColors[currentAscension]}, ${tierColors[currentAscension]}cc)`
                                : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                              color: canAfford ? '#000' : (isDark ? '#4a4840' : '#b0aca4'),
                              cursor: canAfford ? 'pointer' : 'not-allowed',
                            }}
                          >
                            Ascend
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )
            })()}
          </AnimatePresence>

          {/* Screenshot preview modal */}
          <AnimatePresence>
            {screenshotData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-[70] flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                onClick={() => setScreenshotData(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl flex flex-col items-center gap-3 p-4"
                  style={{
                    backgroundColor: isDark ? '#1a1816' : '#faf8f5',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    maxWidth: '85vw', maxHeight: '80vh',
                    fontFamily: 'Crimson Pro, serif',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <img
                    src={screenshotData}
                    alt="Orchard screenshot"
                    className="rounded-lg"
                    style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                  />
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setScreenshotData(null)}
                      className="flex-1 py-2 rounded-lg text-[11px] font-normal uppercase tracking-wider"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        color: isDark ? '#8a8780' : '#7a7670',
                      }}
                    >
                      Close
                    </button>
                    <button
                      onClick={shareScreenshot}
                      className="flex-1 py-2 rounded-lg text-[11px] font-normal uppercase tracking-wider flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: 'rgba(217,119,6,0.15)',
                        color: '#d97706',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                      Share
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
})
