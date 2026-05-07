"use client"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES, getLevel } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"
import { PulpIcon, GemIcon, LeafIcon } from '@/app/components/CurrencyIcons'
import type { NoteData } from "@/app/types"
import * as db from "@/lib/db"

interface OrchardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  juice: number
  gems: number
  xp: number
  grove: any[]
  inventory: string[]
  setJuice: (v: number | ((p: number) => number)) => void
  setGems: (v: number | ((p: number) => number)) => void
  setInventory: (v: string[] | ((p: string[]) => string[])) => void
  setGrove: (v: any[] | ((p: any[]) => any[])) => void
  notes: NoteData[]
  userId?: string
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary']
const RARITY_META: Record<string, { label: string; color: string }> = {
  common: { label: 'Common', color: '#8a8a8f' },
  uncommon: { label: 'Uncommon', color: '#6b9a6b' },
  rare: { label: 'Rare', color: '#6888a8' },
  legendary: { label: 'Legendary', color: '#b89860' },
}

function seededRng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

function orchardPlacement(trees: any[]): { x: number; y: number; tree: any; col: number }[] {
  if (trees.length === 0) return []

  const results: { x: number; y: number; tree: any; col: number }[] = []
  const cols = Math.min(7, Math.max(3, Math.ceil(Math.sqrt(trees.length * 1.1))))
  const rows = Math.ceil(trees.length / cols)
  const colStart = 6
  const colEnd = 94
  const rowStart = 46
  const rowEnd = 95

  for (let i = 0; i < trees.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const colRows = Math.min(rows, Math.ceil((trees.length - col) / cols))
    const rowSpacing = colRows > 1 ? (rowEnd - rowStart) / (colRows - 1) : 0
    const y = colRows === 1 ? 60 : rowStart + row * rowSpacing
    const depthT = (y - rowStart) / Math.max(1, rowEnd - rowStart)
    const pinch = (1 - depthT) * 18 - depthT * 4
    const trapLeft = colStart + pinch
    const trapRight = colEnd - pinch
    const baseX = cols === 1 ? 50 : trapLeft + col * ((trapRight - trapLeft) / (cols - 1))
    const farInwardFactor = row === 0 ? 0.12 : row === 1 ? 0.08 : row === 2 ? 0.06 : 0
    const nearRank = colRows - 1 - row
    const nearInwardFactor = nearRank === 0 ? 0.1 : nearRank === 1 ? 0.07 : 0
    const inwardFactor = Math.min(0.24, farInwardFactor + nearInwardFactor)
    const x = baseX + (50 - baseX) * inwardFactor
    results.push({ x: Math.max(6, Math.min(94, x)), y: Math.max(42, Math.min(94, y)), tree: trees[i], col })
  }

  return results.sort((a, b) => a.y - b.y)
}

function getRarityPlantClass(type: string): string {
  const rarity = TREE_TYPES[type]?.rarity
  switch (rarity) {
    case 'uncommon': return 'rarity-uncommon'
    case 'rare': return 'rarity-rare'
    case 'legendary': return 'rarity-premium'
    default: return ''
  }
}

const PLOT_COST = [0, 5, 12]

function getSapYield(tree: any): number {
  const info = TREE_TYPES[tree.type]
  if (!info) return 1
  const base = info.juiceYield || Math.max(1, Math.floor(info.cost * 0.3))
  const stageBonus = tree.stage >= 4 ? 1.5 : tree.stage >= 3 ? 1.2 : tree.stage >= 2 ? 1 : 0.5
  return Math.max(1, Math.round(base * stageBonus))
}

// Time-of-day phases: night(0-5), dawn(5-7), morning(7-10), day(10-16), dusk(16-19), night(19-24)
function getTimePhase(hourOverride?: number): { phase: string; t: number; hour: number } {
  const hour = hourOverride ?? (new Date().getHours() + new Date().getMinutes() / 60)
  if (hour < 5) return { phase: 'night', t: hour / 5, hour }
  if (hour < 7) return { phase: 'dawn', t: (hour - 5) / 2, hour }
  if (hour < 10) return { phase: 'morning', t: (hour - 7) / 3, hour }
  if (hour < 16) return { phase: 'day', t: (hour - 10) / 6, hour }
  if (hour < 19) return { phase: 'dusk', t: (hour - 16) / 3, hour }
  return { phase: 'night', t: (hour - 19) / 5, hour }
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
    skyTop: '#0a0a14', skyMid: '#0e0e1a', skyLow: '#121220', skyHorizon: '#141424', skyField: '#101018', skyBottom: '#0c0c14',
    oceanTop: '#0a0a18', oceanMid: '#080814', oceanBot: '#0c0c1a',
    mtnTop: '#12121a', mtnMid: '#0e0e14', mtnBot: '#0a0a10',
    snowTop: '#2a2a34', snowFade: '#12121a',
    hillMidTop: '#0c180e', hillMidBot: '#0a140c',
    hillNearTop: '#0e1e0c', hillNearBot: '#0c180a',
    fieldTop: '#101e0c', fieldMid1: '#0e1a0a', fieldMid2: '#0c180a', fieldBot: '#0a1408',
    sunGlow: 0, sunColor: '#000000', sunY: 32,
    moonGlow: 0.7, moonY: 4,
    starOpacity: 1,
    mtnLightOpacity: 0, mtnLightColor: 'rgba(0,0,0,0)',
    groveOpacity: 0.8,
    ambientOverlay: 'rgba(10,10,30,0.3)', ambientOpacity: 0.3,
  },
  dawn: {
    skyTop: '#1a1028', skyMid: '#2a1830', skyLow: '#4a2030', skyHorizon: '#8a4830', skyField: '#2a2028', skyBottom: '#1a1820',
    oceanTop: '#3a2828', oceanMid: '#2a1c20', oceanBot: '#3a2a28',
    mtnTop: '#1a1820', mtnMid: '#141418', mtnBot: '#101014',
    snowTop: '#3a3040', snowFade: '#1a1820',
    hillMidTop: '#142016', hillMidBot: '#101a12',
    hillNearTop: '#1a2818', hillNearBot: '#162214',
    fieldTop: '#1a2c16', fieldMid1: '#182814', fieldMid2: '#1a2814', fieldBot: '#162210',
    sunGlow: 0.5, sunColor: '#d97706', sunY: 18,
    moonGlow: 0.15, moonY: 30,
    starOpacity: 0.15,
    mtnLightOpacity: 0.08, mtnLightColor: 'rgba(217,119,6,0.08)',
    groveOpacity: 0.85,
    ambientOverlay: 'rgba(40,20,30,0.15)', ambientOpacity: 0.15,
  },
  morning: {
    skyTop: '#8a5828', skyMid: '#a06830', skyLow: '#b07838', skyHorizon: '#a08040', skyField: '#788a78', skyBottom: '#6a8080',
    oceanTop: '#8a7850', oceanMid: '#7a6a42', oceanBot: '#907a58',
    mtnTop: '#5a6878', mtnMid: '#4a5868', mtnBot: '#3e4e5e',
    snowTop: '#b0b8c0', snowFade: '#6a7480',
    hillMidTop: '#3e6e34', hillMidBot: '#34602c',
    hillNearTop: '#486a3c', hillNearBot: '#3e5e34',
    fieldTop: '#4a6e38', fieldMid1: '#446634', fieldMid2: '#3e5e30', fieldBot: '#38562c',
    sunGlow: 0.6, sunColor: '#d97706', sunY: 6,
    moonGlow: 0, moonY: 32,
    starOpacity: 0,
    mtnLightOpacity: 0.12, mtnLightColor: 'rgba(255,200,100,0.12)',
    groveOpacity: 0.9,
    ambientOverlay: 'rgba(0,0,0,0)', ambientOpacity: 0,
  },
  day: {
    skyTop: '#4a7898', skyMid: '#5a88a0', skyLow: '#6a94a8', skyHorizon: '#7aa0b0', skyField: '#6a8a78', skyBottom: '#608880',
    oceanTop: '#3e6a80', oceanMid: '#345e74', oceanBot: '#4a7488',
    mtnTop: '#586878', mtnMid: '#4a5a6a', mtnBot: '#3e4e5e',
    snowTop: '#b8c0c8', snowFade: '#6a7888',
    hillMidTop: '#3a6a32', hillMidBot: '#305c28',
    hillNearTop: '#44723a', hillNearBot: '#3a6430',
    fieldTop: '#4a7238', fieldMid1: '#446a34', fieldMid2: '#3e6230', fieldBot: '#385a2c',
    sunGlow: 0.4, sunColor: '#d0a848', sunY: 3,
    moonGlow: 0, moonY: 32,
    starOpacity: 0,
    mtnLightOpacity: 0.05, mtnLightColor: 'rgba(255,255,200,0.05)',
    groveOpacity: 0.9,
    ambientOverlay: 'rgba(0,0,0,0)', ambientOpacity: 0,
  },
  dusk: {
    skyTop: '#1a0c06', skyMid: '#241208', skyLow: '#2e1a0a', skyHorizon: '#281608', skyField: '#141a1e', skyBottom: '#101820',
    oceanTop: '#1a1408', oceanMid: '#161006', oceanBot: '#1e180a',
    mtnTop: '#1a1a20', mtnMid: '#141418', mtnBot: '#101014',
    snowTop: '#3a3a44', snowFade: '#1a1a20',
    hillMidTop: '#142416', hillMidBot: '#101e12',
    hillNearTop: '#1a2e18', hillNearBot: '#162614',
    fieldTop: '#1e3218', fieldMid1: '#1a2c16', fieldMid2: '#1c2e16', fieldBot: '#182812',
    sunGlow: 1, sunColor: '#d97706', sunY: 20,
    moonGlow: 0.15, moonY: 28,
    starOpacity: 0.1,
    mtnLightOpacity: 0.15, mtnLightColor: 'rgba(255,180,80,0.15)',
    groveOpacity: 0.85,
    ambientOverlay: 'rgba(20,10,5,0.1)', ambientOpacity: 0.1,
  },
}

function interpolatePalette(phase: string, t: number): SkyPalette {
  const order = ['night', 'dawn', 'morning', 'day', 'dusk', 'night']
  const idx = order.indexOf(phase)
  const from = PALETTES[phase] || PALETTES.day
  const nextPhase = order[Math.min(idx + 1, order.length - 1)]
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

const STAR_POSITIONS = Array.from({ length: 80 }, (_, i) => {
  const rng = seededRng(i * 47 + 199)
  const brightness = rng()
  return { x: rng() * 200, y: rng() * 28, r: 0.12 + rng() * 0.28, twinkle: rng(), brightness, warm: rng() > 0.7 }
})

const CONSTELLATION_STARS = [
  { x: 60, y: 5 }, { x: 63, y: 3.5 }, { x: 67, y: 4.2 }, { x: 70, y: 2 },
  { x: 72, y: 5.5 }, { x: 68, y: 7.5 }, { x: 64, y: 8 },
]
const CONSTELLATION_LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
]

const Terrain = memo(function Terrain({ isDark, treeCount, treeBases, chopMode, onToggleChop, showChopHint }: { isDark: boolean; treeCount: number; treeBases: { x: number; y: number; col: number }[]; chopMode: boolean; onToggleChop: () => void; showChopHint: boolean }) {
  const [timeOverride, setTimeOverride] = useState<number | null>(null)
  const timeOverrideRef = useRef<number | null>(null)
  const [timeState, setTimeState] = useState(getTimePhase)

  useEffect(() => {
    timeOverrideRef.current = timeOverride
    if (timeOverride !== null) {
      setTimeState(getTimePhase(timeOverride))
      return
    }
    setTimeState(getTimePhase())
    const id = setInterval(() => setTimeState(getTimePhase()), 60000)
    return () => clearInterval(id)
  }, [timeOverride])

  const onCelestialDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startHour = timeOverrideRef.current ?? getTimePhase().hour
    const onMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX
      let newHour = startHour + deltaX * 0.05
      newHour = ((newHour % 24) + 24) % 24
      setTimeOverride(newHour)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const onCelestialDblClick = useCallback(() => {
    setTimeOverride(null)
  }, [])

  const p = useMemo(() => interpolatePalette(timeState.phase, timeState.t), [timeState.phase, timeState.t])

  const dirtColor = isDark ? '#2a2418' : '#8a7a5a'
  const dirtLight = isDark ? '#322c1e' : '#9a8a6a'

  const cols = Math.min(7, Math.max(3, Math.ceil(Math.sqrt(treeCount * 1.1))))
  const colStart = 6
  const colEnd = 94
  const tillCols = cols


  return (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 100" preserveAspectRatio="none" style={{ willChange: 'transform', contain: 'strict', transition: 'filter 2s' }}>
        <defs>
          <linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.skyTop} />
            <stop offset="20%" stopColor={p.skyMid} />
            <stop offset="40%" stopColor={p.skyLow} />
            <stop offset="60%" stopColor={p.skyHorizon} />
            <stop offset="80%" stopColor={p.skyField} />
            <stop offset="100%" stopColor={p.skyBottom} />
          </linearGradient>
          <linearGradient id="ocean-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.oceanTop} />
            <stop offset="50%" stopColor={p.oceanMid} />
            <stop offset="100%" stopColor={p.oceanBot} />
          </linearGradient>
          <filter id="ocean-soft" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
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

        {/* Stars — visible at night/dawn/dusk, brightest when moon is highest */}
        {p.starOpacity > 0.01 && (() => {
          const moonHeight = Math.max(0, 1 - p.moonY / 28)
          const moonBoost = p.moonGlow * moonHeight
          const masterBrightness = Math.min(1, p.starOpacity + moonBoost * 0.6)
          return (
          <g>
            <defs>
              <filter id="star-glow">
                <feGaussianBlur in="SourceGraphic" stdDeviation={0.4 + masterBrightness * 0.6} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="star-glow-strong">
                <feGaussianBlur in="SourceGraphic" stdDeviation={0.6 + masterBrightness * 0.8} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {STAR_POSITIONS.map((s, i) => {
              const glowIntensity = Math.min(1, 0.6 + masterBrightness * 0.5)
              const starColor = s.warm ? '#ffeedd' : '#e8f0ff'
              const isBright = s.brightness > 0.6
              const dimOp = Math.min(1, 0.55 + masterBrightness * 0.45)
              return (
                <g key={i} filter={isBright ? 'url(#star-glow)' : undefined} opacity={masterBrightness}>
                  {isBright ? (
                    <>
                      <line x1={s.x - s.r * 2.5} y1={s.y} x2={s.x + s.r * 2.5} y2={s.y} stroke={starColor} strokeWidth={s.r * 0.45} opacity={glowIntensity}>
                        <animate attributeName="opacity" values={`${glowIntensity};${glowIntensity * 0.35};${glowIntensity}`} dur={`${2 + s.twinkle * 3}s`} repeatCount="indefinite" />
                      </line>
                      <line x1={s.x} y1={s.y - s.r * 2.5} x2={s.x} y2={s.y + s.r * 2.5} stroke={starColor} strokeWidth={s.r * 0.45} opacity={glowIntensity}>
                        <animate attributeName="opacity" values={`${glowIntensity};${glowIntensity * 0.35};${glowIntensity}`} dur={`${2 + s.twinkle * 3}s`} begin={`${s.twinkle * 0.5}s`} repeatCount="indefinite" />
                      </line>
                      <circle cx={s.x} cy={s.y} r={s.r * 0.6} fill={starColor} opacity={glowIntensity}>
                        <animate attributeName="opacity" values={`${glowIntensity};${glowIntensity * 0.45};${glowIntensity}`} dur={`${2.5 + s.twinkle * 2.5}s`} repeatCount="indefinite" />
                      </circle>
                    </>
                  ) : (
                    <circle cx={s.x} cy={s.y} r={s.r * 0.5} fill={starColor} opacity={dimOp}>
                      <animate attributeName="opacity" values={`${dimOp};${dimOp * 0.3};${dimOp}`} dur={`${3 + s.twinkle * 4}s`} begin={`${s.twinkle * 2}s`} repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              )
            })}
            {/* Constellation */}
            <g filter="url(#star-glow-strong)" opacity={masterBrightness}>
              {CONSTELLATION_LINES.map(([a, b], i) => (
                <line key={`cl${i}`} x1={CONSTELLATION_STARS[a].x} y1={CONSTELLATION_STARS[a].y} x2={CONSTELLATION_STARS[b].x} y2={CONSTELLATION_STARS[b].y} stroke="#e8f0ff" strokeWidth="0.12" opacity={0.2 + moonBoost * 0.3}>
                  <animate attributeName="opacity" values={`${0.2 + moonBoost * 0.3};${0.08 + moonBoost * 0.1};${0.2 + moonBoost * 0.3}`} dur="6s" repeatCount="indefinite" />
                </line>
              ))}
              {CONSTELLATION_STARS.map((s, i) => {
                const cOp = Math.min(1, 0.8 + moonBoost * 0.3)
                const rayOp = 0.6 + moonBoost * 0.4
                return (
                <g key={`cs${i}`}>
                  <circle cx={s.x} cy={s.y} r={0.4} fill="#e8f0ff" opacity={cOp}>
                    <animate attributeName="opacity" values={`${cOp};${cOp * 0.4};${cOp}`} dur={`${3 + i * 0.7}s`} repeatCount="indefinite" />
                  </circle>
                  <line x1={s.x - 0.7} y1={s.y} x2={s.x + 0.7} y2={s.y} stroke="#e8f0ff" strokeWidth="0.16" opacity={rayOp}>
                    <animate attributeName="opacity" values={`${rayOp};${rayOp * 0.3};${rayOp}`} dur={`${3.5 + i * 0.6}s`} repeatCount="indefinite" />
                  </line>
                  <line x1={s.x} y1={s.y - 0.7} x2={s.x} y2={s.y + 0.7} stroke="#e8f0ff" strokeWidth="0.16" opacity={rayOp}>
                    <animate attributeName="opacity" values={`${rayOp};${rayOp * 0.3};${rayOp}`} dur={`${3.5 + i * 0.6}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
                  </line>
                </g>
                )
              })}
            </g>
          </g>
          )
        })()}


        {/* Ocean band — rippling top edge */}
        <path fill="url(#ocean-g)" opacity="0.92">
          <animate attributeName="d" dur="18s" repeatCount="indefinite" values="
            M-5,14.2 C20,13.6 45,14.5 70,13.9 C95,13.3 120,14.4 150,13.8 C175,14.3 195,13.7 205,14.1 L205,28 L-5,28 Z;
            M-5,13.8 C25,14.4 50,13.5 80,14.2 C105,14.6 130,13.4 160,14 C185,13.5 200,14.3 205,13.9 L205,28 L-5,28 Z;
            M-5,14 C15,14.5 40,13.4 65,14.1 C90,14.5 115,13.6 145,14.3 C170,13.7 190,14.4 205,14 L205,28 L-5,28 Z;
            M-5,14.2 C20,13.6 45,14.5 70,13.9 C95,13.3 120,14.4 150,13.8 C175,14.3 195,13.7 205,14.1 L205,28 L-5,28 Z
          " />
        </path>
        {/* Ocean shimmer — soft blurred filled bands */}
        <g filter="url(#ocean-soft)">
          <path fill="rgba(255,255,250,0.06)" opacity="0.8">
            <animate attributeName="d" dur="22s" repeatCount="indefinite" values="
              M-5,15 C30,14.3 60,15.8 100,14.8 C140,15.5 170,14.5 205,15.2 L205,16.2 C170,15.5 140,16.5 100,15.8 C60,16.8 30,15.3 -5,16 Z;
              M-5,15.3 C25,15.8 55,14.5 95,15.5 C135,14.6 165,15.6 205,14.9 L205,15.9 C165,16.6 135,15.6 95,16.5 C55,15.5 25,16.8 -5,16.3 Z;
              M-5,14.8 C35,15.4 65,14.2 105,15.2 C145,14.4 175,15.4 205,15 L205,16 C175,16.4 145,15.4 105,16.2 C65,15.2 35,16.4 -5,15.8 Z;
              M-5,15 C30,14.3 60,15.8 100,14.8 C140,15.5 170,14.5 205,15.2 L205,16.2 C170,15.5 140,16.5 100,15.8 C60,16.8 30,15.3 -5,16 Z
            " />
          </path>
          <path fill="rgba(255,255,250,0.045)" opacity="0.7">
            <animate attributeName="d" dur="28s" repeatCount="indefinite" values="
              M-5,17.5 C40,16.8 80,18 120,17.2 C160,17.8 190,17 205,17.5 L205,18.3 C190,17.8 160,18.6 120,18 C80,18.8 40,17.6 -5,18.3 Z;
              M-5,17.8 C35,18.3 75,17 115,18 C155,17.2 185,18.2 205,17.6 L205,18.4 C185,19 155,18 115,18.8 C75,17.8 35,19.1 -5,18.6 Z;
              M-5,17.3 C45,17.9 85,17 125,17.8 C165,17.1 195,18 205,17.4 L205,18.2 C195,18.8 165,17.9 125,18.6 C85,17.8 45,18.7 -5,18.1 Z;
              M-5,17.5 C40,16.8 80,18 120,17.2 C160,17.8 190,17 205,17.5 L205,18.3 C190,17.8 160,18.6 120,18 C80,18.8 40,17.6 -5,18.3 Z
            " />
          </path>
          <path fill="rgba(255,255,250,0.03)" opacity="0.6">
            <animate attributeName="d" dur="36s" repeatCount="indefinite" values="
              M-5,20.5 C50,19.8 100,20.8 150,20 C185,20.6 205,20.2 205,20.5 L205,21.2 C185,21.4 150,20.8 100,21.6 C50,20.6 -5,21.5 -5,21.2 Z;
              M-5,20.8 C45,21.2 95,20 145,20.8 C180,20.2 205,20.9 205,20.8 L205,21.5 C180,21 145,21.6 95,20.8 C45,22 -5,21.2 -5,21.5 Z;
              M-5,20.3 C55,20.9 105,20.2 155,20.7 C190,20.1 205,20.6 205,20.3 L205,21 C190,20.9 155,21.5 105,21 C55,21.7 -5,21.2 -5,21 Z;
              M-5,20.5 C50,19.8 100,20.8 150,20 C185,20.6 205,20.2 205,20.5 L205,21.2 C185,21.4 150,20.8 100,21.6 C50,20.6 -5,21.5 -5,21.2 Z
            " />
          </path>
          <path fill="rgba(255,255,250,0.015)" opacity="0.5">
            <animate attributeName="d" dur="48s" repeatCount="indefinite" values="
              M-5,23.5 C60,23 120,24 180,23.3 L205,23.5 L205,24.3 C180,24.1 120,24.8 60,23.8 L-5,24.3 Z;
              M-5,23.8 C55,24.2 115,23.2 175,24 L205,23.8 L205,24.6 C175,24.8 115,24 55,25 L-5,24.6 Z;
              M-5,23.3 C65,23.8 125,23 185,23.7 L205,23.3 L205,24.1 C185,24.5 125,23.8 65,24.6 L-5,24.1 Z;
              M-5,23.5 C60,23 120,24 180,23.3 L205,23.5 L205,24.3 C180,24.1 120,24.8 60,23.8 L-5,24.3 Z
            " />
          </path>
        </g>
        <g filter="url(#ocean-soft)">
          <circle cx="80" cy="16.5" r="0.5" fill="rgba(255,255,248,0.07)">
            <animate attributeName="opacity" values="0;0.07;0.02;0.05;0" dur="12s" repeatCount="indefinite" />
            <animate attributeName="cx" values="80;86;80" dur="20s" repeatCount="indefinite" />
          </circle>
          <circle cx="140" cy="18.5" r="0.4" fill="rgba(255,255,248,0.05)">
            <animate attributeName="opacity" values="0;0.05;0;0.03;0" dur="16s" begin="4s" repeatCount="indefinite" />
            <animate attributeName="cx" values="140;136;140" dur="24s" repeatCount="indefinite" />
          </circle>
          <circle cx="45" cy="20" r="0.35" fill="rgba(255,255,248,0.04)">
            <animate attributeName="opacity" values="0;0.04;0;0" dur="18s" begin="7s" repeatCount="indefinite" />
            <animate attributeName="cx" values="45;49;45" dur="28s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Mountain range — back layer (darker, depth) */}
        <path d="M-10,30 L0,26 L12,18 L22,24 L32,14 L40,20 L48,12 L56,18 L65,14 L75,22 L82,17 L92,24 L102,13 L112,20 L122,16 L132,24 L142,18 L152,13 L162,22 L172,18 L182,24 L192,20 L210,26 L210,36 L-10,36 Z" fill={p.mtnBot} />
        {/* Mountain range — main */}
        <path d="M-10,28 L5,24 L15,12 L25,22 L35,10 L42,18 L50,8 L58,16 L68,11 L78,20 L85,14 L95,22 L105,9 L115,18 L125,13 L135,22 L145,16 L155,10 L165,20 L175,15 L185,22 L195,18 L210,24 L210,34 L-10,34 Z" fill="url(#hill-far)" />
        {/* Left-facing slopes — shadow for depth */}
        <polygon points="15,12 25,22 15,22" fill="rgba(0,0,0,0.12)" />
        <polygon points="50,8 58,16 50,16" fill="rgba(0,0,0,0.1)" />
        <polygon points="68,11 78,20 68,20" fill="rgba(0,0,0,0.12)" />
        <polygon points="105,9 115,18 105,18" fill="rgba(0,0,0,0.1)" />
        <polygon points="155,10 165,20 155,20" fill="rgba(0,0,0,0.12)" />
        {/* Right-facing slopes — lighter for 3D relief */}
        <polygon points="15,12 5,24 15,22" fill="rgba(255,255,255,0.04)" />
        <polygon points="35,10 25,22 35,20" fill="rgba(255,255,255,0.05)" />
        <polygon points="50,8 42,18 50,16" fill="rgba(255,255,255,0.04)" />
        <polygon points="105,9 95,22 105,18" fill="rgba(255,255,255,0.05)" />
        <polygon points="125,13 115,18 125,18" fill="rgba(255,255,255,0.04)" />
        <polygon points="155,10 145,16 155,16" fill="rgba(255,255,255,0.05)" />
        {/* Ridge highlights — thin bright edge along peaks */}
        <path d="M15,12 L25,22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
        <path d="M35,10 L42,18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.25" />
        <path d="M50,8 L58,16" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.3" />
        <path d="M105,9 L115,18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
        <path d="M155,10 L165,20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.25" />
        {/* (snow removed) */}
        {/* Base shadow — atmospheric haze at mountain feet */}
        <path d="M-10,30 L210,30 L210,34 L-10,34 Z" fill="rgba(0,0,0,0.06)" />
        {/* Sunlit faces — soft warm wash across upper mountain faces */}
        {p.mtnLightOpacity > 0.01 && (
          <g>
            <defs>
              <linearGradient id="mtn-light-wash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.sunColor || '#ffc864'} stopOpacity={p.mtnLightOpacity * 2.5} />
                <stop offset="40%" stopColor={p.sunColor || '#ffc864'} stopOpacity={p.mtnLightOpacity * 1.2} />
                <stop offset="100%" stopColor={p.sunColor || '#ffc864'} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M-10,8 L210,8 L210,34 L-10,34 Z" fill="url(#mtn-light-wash)" opacity={p.mtnLightOpacity * 0.6} />
          </g>
        )}

        {/* Rolling hills — back hill broad dome on right, front hill steep hump on left */}
        {/* Back hill — broad dome peaking center-right */}
        <path d="M-10,36 C10,34 40,30 70,26 C90,22 115,19 140,19 C160,20 180,23 200,26 C205,27 208,28 210,29 L210,42 L-10,42 Z" fill="url(#hill-mid)" />
        {/* Back hill — ridge highlight for roundness */}
        <path d="M-10,36 C10,34 40,30 70,26 C90,22 115,19 140,19 C160,20 180,23 200,26 C205,27 208,28 210,29" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
        {/* Back hill — shadow band along bottom for depth */}
        <path d="M-10,39 C10,38 40,36 70,33 C90,30 115,28 140,28 C160,29 180,31 200,33 L210,35 L210,42 L-10,42 Z" fill="rgba(0,0,0,0.06)" />
        {/* Back hill — organic bushes along ridge */}
        {(() => {
          const bushes: string[] = []
          const bushSeeds = [12,28,45,62,78,95,108,122,138,152,168,185]
          bushSeeds.forEach((bx, i) => {
            const rng = seededRng(i * 53 + 191)
            const sz = 0.6 + rng() * 0.8
            const by = (() => {
              if (bx < 70) return 36 - (bx + 10) * 10 / 80
              if (bx < 140) return 26 - (bx - 70) * 7 / 70
              return 19 + (bx - 140) * 10 / 70
            })() + 0.5
            const l = bx - sz, r = bx + sz, h = sz * 0.7
            const m1 = l + (r - l) * (0.25 + rng() * 0.15)
            const m2 = l + (r - l) * (0.55 + rng() * 0.2)
            bushes.push(`M${l.toFixed(1)},${by.toFixed(1)}C${(l + 0.2).toFixed(1)},${(by - h * 0.6).toFixed(1)} ${(m1 - 0.3).toFixed(1)},${(by - h * (0.8 + rng() * 0.3)).toFixed(1)} ${m1.toFixed(1)},${(by - h).toFixed(1)}C${(m1 + 0.3).toFixed(1)},${(by - h * (0.7 + rng() * 0.2)).toFixed(1)} ${(m2 - 0.2).toFixed(1)},${(by - h * (0.9 + rng() * 0.2)).toFixed(1)} ${m2.toFixed(1)},${(by - h * 0.85).toFixed(1)}C${(m2 + 0.3).toFixed(1)},${(by - h * 0.5).toFixed(1)} ${(r - 0.1).toFixed(1)},${(by - h * 0.3).toFixed(1)} ${r.toFixed(1)},${by.toFixed(1)}Z`)
          })
          return <path d={bushes.join('')} fill={isDark ? '#1a3018' : '#3a6a30'} opacity="0.5" />
        })()}
        {/* Back hill — grass tufts along contour */}
        {(() => {
          const tufts: string[] = []
          for (let i = 0; i < 30; i++) {
            const rng = seededRng(i * 37 + 449)
            const x = -5 + rng() * 215
            const baseY = (() => {
              if (x < 70) return 36 - (x + 10) * 10 / 80
              if (x < 140) return 26 - (x - 70) * 7 / 70
              return 19 + (x - 140) * 10 / 70
            })() + rng() * 4
            const h = 0.5 + rng() * 0.8
            tufts.push(`M${x.toFixed(1)},${baseY.toFixed(1)}l${(-0.3).toFixed(1)},${(-h).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.15).toFixed(1)},${(-h * 0.9).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.4).toFixed(1)},${(-h * 0.7).toFixed(1)}`)
          }
          return <path d={tufts.join('')} stroke={isDark ? '#1e3818' : '#4a7a3a'} strokeWidth="0.2" fill="none" opacity="0.4" />
        })()}

        {/* Distant tangerine grove — placed on mid-hill contour */}
        {(() => {
          // Back rolling hill: M-10,36 C10,34 40,30 70,26 C90,22 115,19 140,19 C160,20 180,23 200,26 C205,27 208,28 210,29
          const midSegs: [number,number,number,number,number,number,number,number][] = [
            [-10,36, 10,34, 40,30, 70,26],
            [70,26, 90,22, 115,19, 140,19],
            [140,19, 160,20, 180,23, 200,26],
            [200,26, 205,27, 208,28, 210,29],
          ]
          const cubicY = (t: number, p0: number, p1: number, p2: number, p3: number) => {
            const u = 1 - t
            return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3
          }
          const cubicX = cubicY
          const getHillY = (x: number) => {
            for (const s of midSegs) {
              if (x >= Math.min(s[0], s[6]) - 2 && x <= Math.max(s[0], s[6]) + 2) {
                for (let ti = 0; ti <= 20; ti++) {
                  const t = ti / 20
                  const sx = cubicX(t, s[0], s[2], s[4], s[6])
                  if (Math.abs(sx - x) < 2) return cubicY(t, s[1], s[3], s[5], s[7])
                }
              }
            }
            return 26
          }
          const trunks: string[] = []
          const canopies: string[] = []
          const fruits: string[] = []
          for (let i = 0; i < 70; i++) {
            const rng = seededRng(i * 71 + 303)
            const x = -5 + rng() * 210
            const baseY = getHillY(x) + rng() * 3 + 0.5
            const sz = 0.8 + rng() * 1.2
            const cx = x
            const cy = baseY - sz * 1.2 - sz * 0.5
            trunks.push(`M${x.toFixed(1)},${baseY.toFixed(1)}L${cx.toFixed(1)},${cy.toFixed(1)}`)
            canopies.push(`M${(cx + sz).toFixed(1)},${cy.toFixed(1)}A${sz.toFixed(1)},${(sz * 0.85).toFixed(1)} 0 1 1 ${(cx - sz).toFixed(1)},${cy.toFixed(1)}A${sz.toFixed(1)},${(sz * 0.85).toFixed(1)} 0 1 1 ${(cx + sz).toFixed(1)},${cy.toFixed(1)}Z`)
            for (let f = 0; f < 2; f++) {
              const a = rng() * Math.PI * 2
              const r = sz * 0.35 * rng()
              fruits.push(`M${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r * 0.8).toFixed(1)}a0.18,0.18 0 1 1 0.01,0Z`)
            }
          }
          return (
            <g opacity={p.groveOpacity}>
              <path d={trunks.join('')} stroke={isDark ? '#2a1a0e' : '#5a3a1a'} strokeWidth="0.4" fill="none" />
              <path d={canopies.join('')} fill={isDark ? '#142e18' : '#2a5428'} />
              <path d={fruits.join('')} fill={isDark ? '#b06810' : '#ea580c'} />
            </g>
          )
        })()}

        {/* Winding paths on mid hills — follow back hill contour */}
        <path d="M20,35 Q30,33 40,31 Q50,30 60,31" fill="none" stroke={isDark ? '#2a2014' : '#8a7050'} strokeWidth="0.6" opacity="0.3" strokeLinecap="round" />
        <path d="M90,24 Q100,22 110,21 Q120,20 130,20" fill="none" stroke={isDark ? '#2a2014' : '#8a7050'} strokeWidth="0.5" opacity="0.25" strokeLinecap="round" />
        <path d="M155,20 Q162,20 170,22 Q176,23 184,24" fill="none" stroke={isDark ? '#2a2014' : '#8a7050'} strokeWidth="0.45" opacity="0.22" strokeLinecap="round" />

        {/* Houses on mid hills — each unique, positioned on hill contour */}
        {/* House 1 — cottage with chimney, on back hill slope (x~54, y~31) */}
        <g>
          <ellipse cx="54" cy="31.2" rx="2.8" ry="0.4" fill="rgba(0,0,0,0.08)" />
          <path d={`M51.8,31.1 L52,29.2 L55.5,29.2 L55.7,31.1 Z`} fill={isDark ? '#3a3028' : '#b0987a'} />
          <path d={`M55.5,29.2 L56.8,29.6 L56.9,31.1 L55.7,31.1 Z`} fill={isDark ? '#2e2418' : '#968060'} />
          <rect x="52.6" y="29.7" width="0.7" height="0.7" rx="0.08" fill={isDark ? '#5a4a20' : '#d4b870'} opacity="0.6" />
          <rect x="53.8" y="29.7" width="0.7" height="0.7" rx="0.08" fill={isDark ? '#5a4a20' : '#d4b870'} opacity="0.45" />
          <rect x="54.8" y="29.8" width="0.6" height="1.3" rx="0.08" fill={isDark ? '#241a10' : '#5a4028'} />
          <polygon points="51.3,29.4 56.2,29.4 53.8,27.2" fill={isDark ? '#2a2018' : '#7a5838'} />
          <polygon points="53.8,27.2 56.2,29.4 53.8,29.4" fill={isDark ? '#221a14' : '#6a4a30'} />
          <rect x="52.3" y="27.4" width="0.6" height="1.8" fill={isDark ? '#3a3028' : '#7a6848'} />
          <rect x="52.2" y="27.2" width="0.8" height="0.3" fill={isDark ? '#3a3028' : '#7a6848'} />
          <g opacity="0.35">
            <ellipse cx="52.6" cy="26.6" rx="0.35" ry="0.25" fill={isDark ? '#4a4a55' : '#b5b5b8'}>
              <animate attributeName="cy" values="26.6;25.8;25" dur="4s" repeatCount="indefinite" />
              <animate attributeName="rx" values="0.35;0.55;0.7" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.18;0" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="52.8" cy="25.2" rx="0.3" ry="0.2" fill={isDark ? '#4a4a55' : '#b5b5b8'}>
              <animate attributeName="cy" values="25.2;24.2;23.2" dur="5.5s" repeatCount="indefinite" />
              <animate attributeName="rx" values="0.3;0.6;0.9" dur="5.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.1;0" dur="5.5s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="52.4" cy="23.6" rx="0.25" ry="0.18" fill={isDark ? '#4a4a55' : '#b5b5b8'}>
              <animate attributeName="cy" values="23.6;22.4;21.4" dur="7s" repeatCount="indefinite" />
              <animate attributeName="rx" values="0.25;0.7;1.2" dur="7s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.05;0" dur="7s" repeatCount="indefinite" />
            </ellipse>
          </g>
        </g>

        {/* House 2 — tall tower, on back hill crest (x~130, y~20) */}
        <g>
          <ellipse cx="131" cy="20.5" rx="1.8" ry="0.3" fill="rgba(0,0,0,0.07)" />
          <path d={`M129.8,20.4 L129.9,18 L132,18 L132.1,20.4 Z`} fill={isDark ? '#352a1c' : '#a89070'} />
          <path d={`M132,18 L132.8,18.3 L132.9,20.4 L132.1,20.4 Z`} fill={isDark ? '#2a2014' : '#8a7458'} />
          <rect x="130.4" y="18.5" width="0.5" height="0.5" rx="0.06" fill={isDark ? '#4a4020' : '#c8b068'} opacity="0.5" />
          <path d="M130.8,20.4 L130.8,19.5 A0.4,0.4 0 0 1 131.6,19.5 L131.6,20.4 Z" fill={isDark ? '#1a1208' : '#4a3220'} />
          <polygon points="129.4,18.2 132.5,18.2 130.95,16.3" fill={isDark ? '#281e14' : '#6a4e30'} />
          <polygon points="130.95,16.3 132.5,18.2 130.95,18.2" fill={isDark ? '#221812' : '#5e4428'} />
        </g>

        {/* House 3 — wide barn, on back hill right slope (x~172, y~26) */}
        <g>
          <ellipse cx="173" cy="26.5" rx="2.5" ry="0.35" fill="rgba(0,0,0,0.06)" />
          <path d={`M170.5,26.3 L170.6,25.1 L175.2,25.1 L175.3,26.3 Z`} fill={isDark ? '#38281a' : '#988060'} />
          <rect x="172" y="25.4" width="1.2" height="0.9" fill={isDark ? '#1e1408' : '#4a3018'} />
          <line x1="172.6" y1="25.4" x2="172.6" y2="26.3" stroke={isDark ? '#2a1e10' : '#5a3820'} strokeWidth="0.1" />
          <polygon points="171.2,25.3 171.8,25.3 171.5,25" fill={isDark ? '#1e1408' : '#4a3018'} />
          <polygon points="170,25.3 175.8,25.3 172.9,23.8" fill={isDark ? '#2a1e12' : '#6a4a2e'} />
          <polygon points="172.9,23.8 175.8,25.3 172.9,25.3" fill={isDark ? '#241a10' : '#5e4226'} />
        </g>

        {/* Front hill — steep hump on left, drops low on right to reveal back hill */}
        <path d="M-10,34 C0,32 15,29 35,27 C50,26 60,27 75,30 C90,33 110,36 140,38 C165,38 190,38 210,38 L210,42 L-10,42 Z" fill="url(#hill-near)" />
        {/* Front hill — ridge highlight */}
        <path d="M-10,34 C0,32 15,29 35,27 C50,26 60,27 75,30 C90,33 110,36 140,38" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.3" />
        {/* Front hill — shadow band */}
        <path d="M-10,37 C0,36 15,34 35,33 C50,32 60,33 75,35 C90,37 110,39 140,40 L210,40 L210,42 L-10,42 Z" fill="rgba(0,0,0,0.05)" />
        {/* Front hill — organic bushes */}
        {(() => {
          const bushes: string[] = []
          const seeds = [5,18,30,42,55,68,82,96]
          seeds.forEach((bx, i) => {
            const rng = seededRng(i * 67 + 331)
            const sz = 0.7 + rng() * 1.0
            const by = (() => {
              if (bx < 35) return 34 - (bx + 10) * 7 / 45
              if (bx < 75) return 27 + (bx - 35) * 3 / 40
              return 30 + (bx - 75) * 8 / 65
            })() + 0.3
            const l = bx - sz, r = bx + sz, h = sz * 0.65
            const m1 = l + (r - l) * (0.3 + rng() * 0.1)
            const m2 = l + (r - l) * (0.6 + rng() * 0.15)
            bushes.push(`M${l.toFixed(1)},${by.toFixed(1)}C${(l + 0.15).toFixed(1)},${(by - h * 0.5).toFixed(1)} ${(m1 - 0.3).toFixed(1)},${(by - h * (0.7 + rng() * 0.4)).toFixed(1)} ${m1.toFixed(1)},${(by - h).toFixed(1)}C${(m1 + 0.25).toFixed(1)},${(by - h * (0.6 + rng() * 0.3)).toFixed(1)} ${(m2 - 0.2).toFixed(1)},${(by - h * (0.85 + rng() * 0.25)).toFixed(1)} ${m2.toFixed(1)},${(by - h * 0.8).toFixed(1)}C${(m2 + 0.25).toFixed(1)},${(by - h * 0.4).toFixed(1)} ${(r - 0.15).toFixed(1)},${(by - h * 0.25).toFixed(1)} ${r.toFixed(1)},${by.toFixed(1)}Z`)
          })
          return <path d={bushes.join('')} fill={isDark ? '#1c3820' : '#3e7236'} opacity="0.45" />
        })()}
        {/* Front hill — grass tufts */}
        {(() => {
          const tufts: string[] = []
          for (let i = 0; i < 25; i++) {
            const rng = seededRng(i * 41 + 557)
            const x = -5 + rng() * 150
            const baseY = (() => {
              if (x < 35) return 34 - (x + 10) * 7 / 45
              if (x < 75) return 27 + (x - 35) * 3 / 40
              return 30 + (x - 75) * 8 / 65
            })() + rng() * 3
            const h = 0.4 + rng() * 0.7
            tufts.push(`M${x.toFixed(1)},${baseY.toFixed(1)}l${(-0.25).toFixed(2)},${(-h).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.2).toFixed(1)},${(-h * 0.85).toFixed(1)}M${x.toFixed(1)},${baseY.toFixed(1)}l${(0.35).toFixed(2)},${(-h * 0.65).toFixed(1)}`)
          }
          return <path d={tufts.join('')} stroke={isDark ? '#223e1e' : '#527e42'} strokeWidth="0.22" fill="none" opacity="0.4" />
        })()}

        {/* Drag overlay for sky — scrub time left/right */}
        <rect x="0" y="0" width="200" height="30" fill="transparent" style={{ cursor: 'grab', pointerEvents: 'auto' }} onMouseDown={onCelestialDown} onDoubleClick={onCelestialDblClick} />
        {/* Sun on arc */}
        {(() => {
          const sunT = Math.max(0, Math.min(1, (timeState.hour - 6) / 12))
          const t = sunT
          const sx = (1-t)*(1-t)*50 + 2*(1-t)*t*85 + t*t*120
          const sy = (1-t)*(1-t)*16 + 2*(1-t)*t*0 + t*t*20
          const visible = timeState.hour >= 6 && timeState.hour < 18
          if (!visible) return null
          const horizonFade = t < 0.08 ? t / 0.08 : t > 0.92 ? (1 - t) / 0.08 : 1
          const reflOpacity = horizonFade * (1 - p.sunGlow * 0.3)
          return (
            <g opacity={horizonFade} style={{ pointerEvents: 'none' }}>
              <defs>
                <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={p.sunColor} stopOpacity="0.9" />
                  <stop offset="20%" stopColor={p.sunColor} stopOpacity="0.4" />
                  <stop offset="50%" stopColor={p.sunColor} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={p.sunColor} stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx={sx} cy={sy} rx="18" ry="8" fill="url(#sun-glow)" />
              <circle cx="0" cy="0" r="1.2" fill={p.sunColor} opacity="0.7" transform={`translate(${sx},${sy}) scale(2.5,2)`} />
              <circle cx="0" cy="0" r="0.8" fill="#fff4d0" opacity="0.9" transform={`translate(${sx},${sy}) scale(2.5,2)`} />
            </g>
          )
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
                  <stop offset="0%" stopColor="#c8d8f0" stopOpacity="0.4" />
                  <stop offset="40%" stopColor="#b0c4e4" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#90a8d0" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="moon-face-bg" cx="40%" cy="38%" r="58%">
                  <stop offset="0%" stopColor="#f4f6fc" />
                  <stop offset="40%" stopColor="#eaeff8" />
                  <stop offset="100%" stopColor="#c0c8d8" />
                </radialGradient>
              </defs>
              <ellipse cx={mx} cy={my} rx="8" ry="5" fill="url(#moon-glow-bg)" />
              <circle cx="0" cy="0" r="0.9" fill="url(#moon-face-bg)" transform={`translate(${mx},${my}) scale(2.5,2)`} />
              <circle cx="0" cy="0" r="0.12" fill="rgba(140,155,180,0.2)" transform={`translate(${mx - 0.3},${my - 0.3}) scale(2.5,2)`} />
              <circle cx="0" cy="0" r="0.15" fill="rgba(130,145,170,0.15)" transform={`translate(${mx + 0.2},${my + 0.2}) scale(2.5,2)`} />
            </g>
          )
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
          const canopies: string[] = []
          const fruits: string[] = []
          for (let i = 0; i < 50; i++) {
            const rng = seededRng(i * 89 + 707)
            const x = -5 + rng() * 210
            const baseY = getNearY(x) + rng() * 2.5 - 0.3
            const sz = 1 + rng() * 1.4
            const cx = x
            const cy = baseY - sz * 1.3 - sz * 0.5
            trunks.push(`M${x.toFixed(1)},${baseY.toFixed(1)}L${cx.toFixed(1)},${cy.toFixed(1)}`)
            canopies.push(`M${(cx + sz).toFixed(1)},${cy.toFixed(1)}A${sz.toFixed(1)},${(sz * 0.85).toFixed(1)} 0 1 1 ${(cx - sz).toFixed(1)},${cy.toFixed(1)}A${sz.toFixed(1)},${(sz * 0.85).toFixed(1)} 0 1 1 ${(cx + sz).toFixed(1)},${cy.toFixed(1)}Z`)
            for (let f = 0; f < 3; f++) {
              const a = rng() * Math.PI * 2
              const r = sz * 0.4 * rng()
              fruits.push(`M${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r * 0.8).toFixed(1)}a0.22,0.22 0 1 1 0.01,0Z`)
            }
          }
          return (
            <g opacity={p.groveOpacity}>
              <path d={trunks.join('')} stroke={isDark ? '#2a1a0e' : '#5a3a1a'} strokeWidth="0.5" fill="none" />
              <path d={canopies.join('')} fill={isDark ? '#1a3420' : '#2e5a2a'} />
              <path d={fruits.join('')} fill={isDark ? '#b06810' : '#ea580c'} />
            </g>
          )
        })()}

        {/* Main field */}
        <path d="M-5,38 Q20,39 50,38 Q80,37 100,38 Q130,39 160,38 Q185,39 205,38 L205,100 L-5,100 Z" fill="url(#field-g)" />

        {/* Field texture */}
        <path d="M0,50 Q50,48 100,50 Q150,52 200,50" fill="none" stroke="rgba(40,60,30,0.15)" strokeWidth="0.4" />
        <path d="M0,62 Q40,60 80,62 Q120,64 160,62 Q180,60 200,62" fill="none" stroke="rgba(40,60,30,0.12)" strokeWidth="0.35" />
        <path d="M0,74 Q60,72 120,74 Q160,76 200,74" fill="none" stroke="rgba(40,60,30,0.1)" strokeWidth="0.3" />
        <path d="M0,86 Q50,84.5 100,86 Q150,87.5 200,86" fill="none" stroke="rgba(40,60,30,0.08)" strokeWidth="0.25" />

        {/* Tilled dirt columns — use actual tree x positions for alignment */}
        {Array.from({ length: tillCols }).map((_, ci) => {
          const colTrees = treeBases.filter(t => t.col === ci).sort((a, b) => a.y - b.y)
          const rng = seededRng(ci * 137 + 42)
          const steps = 12
          const points: string[] = []

          // Helper: get x at a given y by interpolating/extrapolating from tree positions in this column
          const getXAtY = (y: number): number => {
            if (colTrees.length === 0) {
              // Fallback: use orchardPlacement math directly
              const depthT = (y - 40) / 57
              const pinch = (1 - depthT) * 18 - depthT * 4
              const trapLeft = colStart + pinch
              const trapRight = colEnd - pinch
              const baseX = tillCols === 1 ? 50 : trapLeft + ci * ((trapRight - trapLeft) / Math.max(1, tillCols - 1))
              return baseX * 2
            }
            if (colTrees.length === 1) {
              return colTrees[0].x * 2
            }
            // Find surrounding trees for interpolation
            let below = colTrees[0]
            let above = colTrees[colTrees.length - 1]
            for (let i = 0; i < colTrees.length - 1; i++) {
              if (colTrees[i].y <= y && colTrees[i + 1].y >= y) {
                below = colTrees[i]
                above = colTrees[i + 1]
                const t = (y - below.y) / Math.max(0.1, above.y - below.y)
                return (below.x + (above.x - below.x) * t) * 2
              }
            }
            // Extrapolate: y is outside tree range
            if (y < colTrees[0].y) {
              if (colTrees.length >= 2) {
                const t = (y - colTrees[0].y) / Math.max(0.1, colTrees[1].y - colTrees[0].y)
                return (colTrees[0].x + (colTrees[1].x - colTrees[0].x) * t) * 2
              }
              return colTrees[0].x * 2
            }
            // y > last tree
            if (colTrees.length >= 2) {
              const last = colTrees[colTrees.length - 1]
              const prev = colTrees[colTrees.length - 2]
              const t = (y - prev.y) / Math.max(0.1, last.y - prev.y)
              return (prev.x + (last.x - prev.x) * t) * 2
            }
            return colTrees[colTrees.length - 1].x * 2
          }

          for (let s = 0; s <= steps; s++) {
            const t = s / steps
            const y = 40 + t * 57
            const x = getXAtY(y)
            const wobble = (rng() - 0.5) * 1.2
            points.push(`${(x + wobble).toFixed(1)},${y.toFixed(1)}`)
          }
          const d = points.length > 1 ? `M${points[0]} ` + points.slice(1).map((p, i) => {
            if (i === 0) return `L${p}`
            return `Q${points[i]} ${p}`
          }).join(' ') : ''
          return (
            <g key={`till-${ci}`}>
              <path d={d} fill="none" stroke={dirtColor} strokeWidth="2.4" opacity={isDark ? 0.2 : 0.12} strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} fill="none" stroke={dirtLight} strokeWidth="0.7" opacity={isDark ? 0.09 : 0.06} strokeLinecap="round" transform="translate(0.3, 0.5)" />
            </g>
          )
        })}

        {/* Grass tufts — baked */}
        {(() => {
          const grassColor = isDark ? '#3a5a2e' : '#6a9a50'
          const d1: string[] = []
          const d2: string[] = []
          for (let i = 0; i < 50; i++) {
            const rng = seededRng(i * 53 + 101)
            const x = 6 + rng() * 188
            const y = 40 + rng() * 56
            const h = 0.4 + rng() * 0.6
            d1.push(`M${x.toFixed(1)},${y.toFixed(1)}L${(x-0.4).toFixed(1)},${(y-h).toFixed(1)}`)
            d2.push(`M${x.toFixed(1)},${y.toFixed(1)}L${(x+0.3).toFixed(1)},${(y-h*0.8).toFixed(1)}`)
          }
          return (
            <g opacity={isDark ? 0.15 : 0.1}>
              <path d={d1.join('')} stroke={grassColor} strokeWidth="0.3" fill="none" />
              <path d={d2.join('')} stroke={grassColor} strokeWidth="0.25" fill="none" />
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

        {/* Windmills */}
        {[{ x: 178, y: 42, s: 1 }, { x: 190, y: 38, s: 0.75 }].map((wm, wi) => {
          const wmX = wm.x
          const wmY = wm.y
          const sc = wm.s
          const wmColor = isDark ? '#3a3028' : '#6a5a42'
          const wmLight = isDark ? '#4a4032' : '#7a6a52'
          const bladeColor = isDark ? '#4a4236' : '#8a7a66'
          const bladeLight = isDark ? '#5a5040' : '#a09080'
          const bw = 3.5 * sc
          const tw = 1.5 * sc
          const h = 14 * sc
          const hubY = wmY + 1.5 * sc
          const bladeLen = 7 * sc
          const roofColor = isDark ? '#2a2218' : '#5a4a32'
          const roofLight = isDark ? '#342a1e' : '#6a5a40'
          return (
            <g key={`wm-${wi}`}>
              {/* Base platform */}
              <ellipse cx={wmX} cy={wmY + h + 0.5 * sc} rx={bw + 1 * sc} ry={0.8 * sc} fill={isDark ? '#2a2418' : '#5a4a38'} opacity="0.4" />
              {/* Tower body — brick */}
              <path d={`M${wmX - bw},${wmY + h} C${wmX - bw},${wmY + h * 0.6} ${wmX - tw},${wmY + h * 0.2} ${wmX - tw},${wmY + sc * 2} L${wmX + tw},${wmY + sc * 2} C${wmX + tw},${wmY + h * 0.2} ${wmX + bw},${wmY + h * 0.6} ${wmX + bw},${wmY + h} Z`} fill="url(#brick-pat)" />
              {/* Subtle shading */}
              <path d={`M${wmX - bw},${wmY + h} C${wmX - bw},${wmY + h * 0.6} ${wmX - tw},${wmY + h * 0.2} ${wmX - tw},${wmY + sc * 2} L${wmX + tw},${wmY + sc * 2} C${wmX + tw},${wmY + h * 0.2} ${wmX + bw},${wmY + h * 0.6} ${wmX + bw},${wmY + h} Z`} fill={isDark ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.03)'} />
              {/* Mortar band lines */}
              {[0.35, 0.55, 0.7, 0.85].map(t => {
                const bandY = wmY + sc * 2 + (h - sc * 2) * t
                const bw2 = tw + (bw - tw) * t
                return <line key={t} x1={wmX - bw2 + 0.3} y1={bandY} x2={wmX + bw2 - 0.3} y2={bandY} stroke={isDark ? 'rgba(60,50,35,0.3)' : 'rgba(100,80,50,0.15)'} strokeWidth={0.2 * sc} />
              })}
              {/* Window with frame */}
              <circle cx={wmX} cy={wmY + h * 0.4} r={1 * sc} fill={isDark ? '#1a1410' : '#4a3a28'} />
              <circle cx={wmX} cy={wmY + h * 0.4} r={1 * sc} fill="none" stroke={isDark ? '#4a3e28' : '#6a5a3a'} strokeWidth={0.3 * sc} />
              <line x1={wmX - 0.8 * sc} y1={wmY + h * 0.4} x2={wmX + 0.8 * sc} y2={wmY + h * 0.4} stroke={isDark ? '#4a3e28' : '#6a5a3a'} strokeWidth={0.2 * sc} />
              <line x1={wmX} y1={wmY + h * 0.4 - 0.8 * sc} x2={wmX} y2={wmY + h * 0.4 + 0.8 * sc} stroke={isDark ? '#4a3e28' : '#6a5a3a'} strokeWidth={0.2 * sc} />
              {/* Window glow */}
              <circle cx={wmX} cy={wmY + h * 0.4} r={0.6 * sc} fill={isDark ? 'rgba(255,200,100,0.15)' : 'rgba(255,220,140,0.2)'} />
              {/* Door with arch */}
              <path d={`M${wmX - 1 * sc},${wmY + h} L${wmX - 1 * sc},${wmY + h - 2.2 * sc} A${1 * sc},${1 * sc} 0 0 1 ${wmX + 1 * sc},${wmY + h - 2.2 * sc} L${wmX + 1 * sc},${wmY + h} Z`} fill={isDark ? '#1a1410' : '#3a2a1a'} />
              <line x1={wmX} y1={wmY + h - 2.8 * sc} x2={wmX} y2={wmY + h} stroke={isDark ? '#2a2018' : '#4a3a28'} strokeWidth={0.15 * sc} />
              {/* Conical roof */}
              <polygon points={`${wmX - tw - 0.8 * sc},${wmY + sc * 2} ${wmX + tw + 0.8 * sc},${wmY + sc * 2} ${wmX},${wmY - 1 * sc}`} fill={roofColor} />
              <polygon points={`${wmX},${wmY - 1 * sc} ${wmX + tw + 0.8 * sc},${wmY + sc * 2} ${wmX + 0.3 * sc},${wmY + sc * 2}`} fill={roofLight} opacity="0.3" />
              {/* Hub on roof */}
              <circle cx={wmX} cy={hubY} r={1.4 * sc} fill={wmLight} />
              <circle cx={wmX} cy={hubY} r={0.9 * sc} fill={roofColor} />
              <circle cx={wmX} cy={hubY} r={0.4 * sc} fill={wmLight} />
              {/* Spinning blades */}
              <g>
                <animateTransform attributeName="transform" type="rotate" from={`0 ${wmX} ${hubY}`} to={`${wi === 0 ? 360 : -360} ${wmX} ${hubY}`} dur={wi === 0 ? '8s' : '11s'} repeatCount="indefinite" />
                {[0, 90, 180, 270].map(angle => (
                  <g key={angle} transform={`rotate(${angle} ${wmX} ${hubY})`}>
                    {/* Blade frame */}
                    <polygon points={`${wmX - 0.4 * sc},${hubY} ${wmX + 0.4 * sc},${hubY} ${wmX + 1 * sc},${hubY - bladeLen} ${wmX - 0.15 * sc},${hubY - bladeLen}`} fill={bladeColor} opacity="0.8" />
                    {/* Lattice cross-bars */}
                    {[0.25, 0.5, 0.75].map(t => {
                      const ly = hubY - bladeLen * t
                      const lw = (0.4 + (1 - 0.4) * t * 0.6) * sc
                      return <line key={t} x1={wmX - 0.1 * sc} y1={ly} x2={wmX + lw} y2={ly} stroke={bladeLight} strokeWidth={0.15 * sc} opacity="0.5" />
                    })}
                    {/* Spine */}
                    <line x1={wmX + 0.2 * sc} y1={hubY} x2={wmX + 0.4 * sc} y2={hubY - bladeLen} stroke={bladeLight} strokeWidth={0.2 * sc} opacity="0.35" />
                  </g>
                ))}
              </g>
            </g>
          )
        })}

        {/* Paths between windmills and off-screen */}
        <path d={`M178,${42 + 14} Q184,${42 + 15} 190,${38 + 14 * 0.75}`} fill="none" stroke={isDark ? '#2e2418' : '#7a6a4a'} strokeWidth="1.8" opacity="0.25" strokeLinecap="round" />
        <path d={`M178,${42 + 14} Q184,${42 + 15} 190,${38 + 14 * 0.75}`} fill="none" stroke={isDark ? '#3a3020' : '#8a7a5a'} strokeWidth="0.6" opacity="0.15" strokeLinecap="round" />
        <path d={`M190,${38 + 14 * 0.75} Q196,${38 + 10} 210,${36}`} fill="none" stroke={isDark ? '#2e2418' : '#7a6a4a'} strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />

        {/* Chopping stump + pine — field left side */}
        <g
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          onClick={onToggleChop}
        >
          {/* === Pine tree — natural conifer, offset left and slightly higher === */}
          <ellipse cx="11" cy="61.8" rx="2.5" ry="0.4" fill="rgba(0,0,0,0.07)" />
          <path d="M10.8,61.7 L10.8,53.2 L11.2,53.2 L11.2,61.7 Z" fill={isDark ? '#2e1a0c' : '#5a3a1a'} />
          <path d="M11,61.2 Q9,59.2 8.5,58.2 Q9.2,58.5 9,57.7 Q8,56.2 8.2,55.7 Q9,56.2 9.5,55.7 Q9,54.7 9.5,54.2 Q10,54.7 10.2,54.4 Q10.5,53.7 11,52.7 Q11.5,53.7 11.8,54.4 Q12,54.7 12.5,54.2 Q13,54.7 13,55.7 Q13,56.2 13.8,55.7 Q14,56.2 13,57.7 Q12.8,58.5 13.5,58.2 Q13,59.2 11,61.2 Z" fill={isDark ? '#1a3818' : '#2a5e2a'} />
          <path d="M11,61.2 Q9,59.2 8.5,58.2 Q9.2,58.5 9,57.7 Q8,56.2 8.2,55.7 Q9,56.2 9.5,55.7 Q9,54.7 9.5,54.2 Q10,54.7 10.2,54.4 Q10.5,53.7 11,52.7 L11,61.2 Z" fill="rgba(0,0,0,0.06)" />
          <path d="M11,52.7 Q11.5,53.7 11.8,54.4 Q12,54.7 12.5,54.2 Q13,54.7 13,55.7 Q13,56.2 13.8,55.7 Q14,56.2 13,57.7 Q12.8,58.5 13.5,58.2 Q13,59.2 11,61.2 L11,52.7 Z" fill={isDark ? '#224e22' : '#348034'} opacity="0.3" />

          {/* === Stump === */}
          <ellipse cx="19.5" cy="63.4" rx="2.2" ry="0.4" fill="rgba(0,0,0,0.06)" />
          <path d="M18,61.8 L18,63.2 Q18.7,63.6 19.5,63.6 Q20.3,63.6 21,63.2 L21,61.8 Z" fill={isDark ? '#3a2818' : '#7a5a38'} />
          <line x1="18.8" y1="62" x2="18.8" y2="63" stroke={isDark ? '#2e1e10' : '#6a4a28'} strokeWidth="0.1" opacity="0.3" />
          <line x1="20.2" y1="62.1" x2="20.2" y2="62.9" stroke={isDark ? '#2e1e10' : '#6a4a28'} strokeWidth="0.1" opacity="0.3" />
          <ellipse cx="19.5" cy="61.8" rx="1.5" ry="0.5" fill={isDark ? '#4a3820' : '#9a7a55'} />
          <ellipse cx="19.5" cy="61.8" rx="0.7" ry="0.25" fill="none" stroke={isDark ? '#3e3018' : '#8a6a45'} strokeWidth="0.08" opacity="0.4" />

          {/* === Axe — blade embedded in stump top === */}
          <line x1="19.8" y1="61" x2="22.5" y2="59" stroke={isDark ? '#3a2810' : '#6a4a28'} strokeWidth="0.4" strokeLinecap="round" />
          {/* Blade head — sharp end down into stump */}
          <path d="M19.6,60.3 L19.9,62 L20.6,61 Z" fill={isDark ? '#5a5a68' : '#9090a0'} />
          <path d="M19.9,62 L19.2,61.7 L19.6,60.3 Z" fill={isDark ? '#484855' : '#7a7a88'} />
          <path d="M19.2,61.7 L19.6,60.3" stroke={isDark ? '#6a6a78' : '#b0b0be'} strokeWidth="0.15" fill="none" />

          {chopMode && (
            <>
              <ellipse cx="17" cy="60" rx="6" ry="4" fill="rgba(217,119,6,0.1)" />
              <ellipse cx="17" cy="60" rx="4" ry="2.5" fill="rgba(217,119,6,0.06)" />
            </>
          )}

          <rect x="10" y="52" width="16" height="12" fill="transparent" />

        </g>

        {/* Dirt path */}
        <path d="M-5,96 Q50,93 100,95 Q150,93 205,96 L205,100 L-5,100 Z" fill={dirtColor} opacity="0.2" />
      </svg>

      {/* (sun and moon now rendered inside SVG before mountains) */}

      {/* Time override indicator */}
      {timeOverride !== null && (
        <div
          className="absolute top-2 right-2 z-[46] flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', pointerEvents: 'auto', cursor: 'pointer', fontFamily: 'EB Garamond, serif', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}
          onClick={onCelestialDblClick}
        >
          <span>{`${Math.floor(timeOverride)}:${String(Math.floor((timeOverride % 1) * 60)).padStart(2, '0')}`}</span>
          <span style={{ fontSize: 9, opacity: 0.5 }}>✕</span>
        </div>
      )}

      {/* Soft vignette — heavier on left for sidebar blend */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: isDark
          ? 'inset 40px 0 50px -8px rgba(8,10,8,0.5), inset 0 0 40px 10px rgba(8,12,8,0.25)'
          : 'inset 30px 0 40px -5px rgba(40,35,25,0.15), inset 0 0 30px 8px rgba(80,100,60,0.08)',
      }} />
      {/* Time-of-day ambient overlay */}
      {p.ambientOpacity > 0.01 && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundColor: p.ambientOverlay,
          opacity: p.ambientOpacity,
          transition: 'opacity 10s, background-color 10s',
        }} />
      )}
    </>
  )
})

const NOTE_TYPE_ICONS: Record<string, string> = {
  notebook: '📓',
  singlepage: '📄',
  flashcard: '🃏',
  vault: '🔒',
  cornell: '📋',
}

export const OrchardView = memo(function OrchardView({
  isOpen, onClose, theme,
  juice, gems, xp, grove, notes, setGems, setJuice, setGrove, userId,
}: OrchardViewProps) {

  const activeNotesForDefault = useMemo(() => notes.filter(n => !n.archived && !n.deletedAt), [notes])
  const [selectedNotebook, setSelectedNotebook] = useState<string>(activeNotesForDefault.length > 0 ? activeNotesForDefault[0].id : '_unassigned')
  const [plotPage, setPlotPage] = useState(0)
  useEffect(() => {
    setPlotPage(0)
  }, [selectedNotebook])

  const [nbDropOpen, setNbDropOpen] = useState(false)
  const [chopMode, setChopMode] = useState(false)
  const [chopTarget, setChopTarget] = useState<{ tree: any; sap: number } | null>(null)
  const [showChopHint, setShowChopHint] = useState(() => {
    if (typeof window === 'undefined') return true
    return !localStorage.getItem('pulp-chop-hint-dismissed')
  })

  const lvl = getLevel(xp)
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
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

  const TREES_PER_PLOT = 30
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
    if (gems < cost) return
    setGems((g: number) => g - cost)
    const updated = { ...unlockedPlots, [selectedNotebook]: nextPlot }
    setUnlockedPlots(updated)
    localStorage.setItem('pulp-unlocked-plots', JSON.stringify(updated))
    if (userId) db.unlockPlot(userId, selectedNotebook, nextPlot)
    setPlotPage(nextPlot - 1)
  }

  const confirmChop = useCallback(() => {
    if (!chopTarget) return
    const { tree, sap } = chopTarget
    setJuice((j: number) => j + sap)
    setGrove((g: any[]) => g.filter(t => t.id !== tree.id))
    if (userId) db.deleteTree(userId, tree.id).catch(() => {})
    setChopTarget(null)
  }, [chopTarget, setJuice, setGrove, userId])

  // Auto-convert overflow trees to sap
  useEffect(() => {
    const maxCapacity = nbUnlocked * TREES_PER_PLOT
    if (filteredTrees.length <= maxCapacity) return
    const overflow = filteredTrees.slice(maxCapacity)
    let totalSap = 0
    const overflowIds = new Set(overflow.map((t: any) => { totalSap += getSapYield(t); return t.id }))
    if (overflowIds.size === 0) return
    setJuice((j: number) => j + totalSap)
    setGrove((g: any[]) => g.filter(t => !overflowIds.has(t.id)))
    if (userId) overflow.forEach((t: any) => db.deleteTree(userId, t.id).catch(() => {}))
  }, [filteredTrees.length, nbUnlocked, selectedNotebook])

  const currentPlotTrees = useMemo(() => {
    const start = plotPage * TREES_PER_PLOT
    return filteredTrees.slice(start, start + TREES_PER_PLOT)
  }, [filteredTrees, plotPage])

  const placed = useMemo(() => orchardPlacement(currentPlotTrees), [currentPlotTrees])

  const rarityCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredTrees.forEach(t => {
      const r = TREE_TYPES[t.type]?.rarity || 'common'
      counts[r] = (counts[r] || 0) + 1
    })
    return counts
  }, [filteredTrees])

  const archivedNotes = useMemo(() => notes.filter(n => n.archived && !n.deletedAt), [notes])

  if (!isOpen) return null

  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
  const textPrimary = isDark ? '#d4d0c8' : '#3a3630'
  const textSecondary = isDark ? '#6b6860' : '#9a9590'
  const textMuted = isDark ? '#4a4840' : '#b8b4ae'

  const baseSize = filteredTrees.length <= 6 ? 105 :
    filteredTrees.length <= 15 ? 95 :
    filteredTrees.length <= 30 ? 85 : 72

  return (
    <div
      className="absolute inset-0 z-40 flex"
      onWheel={(e) => { if (e.ctrlKey || e.metaKey) e.preventDefault() }}
    >
      <style>{`@keyframes tree-pop { 0% { transform: translate(-50%,-85%) scale(0.5); opacity:0 } 100% { transform: translate(-50%,-85%) scale(1); opacity:1 } }`}</style>
      <div
        onWheel={(e) => { if (e.ctrlKey || e.metaKey) e.preventDefault() }}
        className="relative flex overflow-hidden w-full h-full"
      >
        {/* Main orchard area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 z-50 pointer-events-none" style={{ boxShadow: `inset 30px 0 40px -10px ${isDark ? 'rgba(9,9,11,0.7)' : 'rgba(60,50,40,0.25)'}, inset 0 0 20px 5px ${isDark ? 'rgba(9,9,11,0.3)' : 'rgba(240,236,234,0.3)'}` }} />
          <div className="absolute left-0 top-0 bottom-0 z-50 pointer-events-none" style={{ width: 60, background: `linear-gradient(to right, ${isDark ? 'rgba(9,9,11,0.55)' : 'rgba(50,45,38,0.18)'} 0%, transparent 100%)` }} />
          <Terrain isDark={isDark} treeCount={currentPlotTrees.length} treeBases={placed} chopMode={chopMode} showChopHint={showChopHint} onToggleChop={() => { setChopMode(m => !m); setChopTarget(null); if (showChopHint) { setShowChopHint(false); localStorage.setItem('pulp-chop-hint-dismissed', '1') } }} />

          {/* Orchard scene */}
          <div className="flex-1 relative overflow-hidden" style={{
            perspective: '800px',
          }}>
            {/* Notebook switcher dropdown — top left */}
            <div className="absolute top-3 left-3 z-30">
              <div className="relative">
                <button
                  onClick={() => setNbDropOpen(o => !o)}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 pointer-events-auto transition-all"
                  style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)' }}
                >
                  {(() => {
                    const note = activeNotes.find(n => n.id === selectedNotebook)
                    const icon = note ? (note.icon || NOTE_TYPE_ICONS[note.noteType || 'notebook'] || '📓') : '🌿'
                    const label = note ? (note.subject || 'Untitled') : 'Unassigned'
                    const count = notebookTreeCounts[selectedNotebook] || notebookTreeCounts['_unassigned'] || 0
                    return (
                      <>
                        <span className="text-[11px]">{icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[160px]" style={{ color: 'rgba(255,255,255,0.8)' }}>{label}</span>
                        {count > 0 && <span className="text-[9px] tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>{count}</span>}
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.5)', transform: nbDropOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}><path d="M6 9l6 6 6-6"/></svg>
                      </>
                    )
                  })()}
                </button>
                {nbDropOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setNbDropOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-30 rounded-lg overflow-hidden py-1 min-w-[220px]" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
                      {activeNotes.map(note => {
                        const isSelected = selectedNotebook === note.id
                        const icon = note.icon || NOTE_TYPE_ICONS[note.noteType || 'notebook'] || '📓'
                        const count = notebookTreeCounts[note.id] || 0
                        return (
                          <button
                            key={note.id}
                            onClick={() => { setSelectedNotebook(note.id); setNbDropOpen(false) }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/10"
                          >
                            <span className="text-[11px]">{icon}</span>
                            <span className="text-[10px] font-medium truncate flex-1" style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)' }}>{note.subject || 'Untitled'}</span>
                            {count > 0 && <span className="text-[9px] tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>{count}</span>}
                          </button>
                        )
                      })}
                      {(notebookTreeCounts['_unassigned'] || 0) > 0 && (
                        <button
                          onClick={() => { setSelectedNotebook('_unassigned'); setNbDropOpen(false) }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/10"
                        >
                          <span className="opacity-60"><LeafIcon size={10} /></span>
                          <span className="text-[10px] font-medium truncate flex-1" style={{ color: selectedNotebook === '_unassigned' ? '#fff' : 'rgba(255,255,255,0.6)' }}>Unassigned</span>
                          <span className="text-[9px] tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>{notebookTreeCounts['_unassigned']}</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Plot switcher overlay */}
            <div className="absolute top-3 left-0 right-0 z-30 flex items-center justify-center gap-3 pointer-events-none">
              {(filteredTrees.length > TREES_PER_PLOT || nbUnlocked > 1) && (
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5 pointer-events-auto" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)' }}>
                  <button onClick={() => setPlotPage(p => Math.max(0, p - 1))} disabled={plotPage === 0} className="p-0.5 disabled:opacity-30 hover:opacity-100 opacity-70 transition-opacity" style={{ color: '#fff' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="text-[9px] tabular-nums font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Plot {plotPage + 1} <span className="opacity-50">/ {nbUnlocked}</span>
                  </span>
                  {plotPage + 1 < nbUnlocked ? (
                    <button onClick={() => setPlotPage(p => Math.min(nbUnlocked - 1, p + 1))} className="p-0.5 hover:opacity-100 opacity-70 transition-opacity" style={{ color: '#fff' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  ) : nbUnlocked < MAX_PLOTS ? (
                    <button
                      onClick={unlockNextPlot}
                      disabled={gems < (PLOT_COST[nbUnlocked] || 0)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
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
            <div className="absolute inset-0" style={{
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
              >
                {filteredTrees.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 relative z-10">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: isDark ? '#8a8780' : '#7a7670' }}>
                      <path d="M7 20h10" />
                      <path d="M12 20v-8" />
                      <path d="M12 12C12 8 8 6 4 7c0 4 2.5 7 8 5" />
                      <path d="M12 12c0-4 4-6 8-5 0 4-2.5 7-8 5" />
                    </svg>
                    <p className="text-[12px]" style={{ color: isDark ? '#8a8780' : '#7a7670' }}>
                      {selectedNotebook === null ? 'Your orchard is empty.' :
                       selectedNotebook === '_unassigned' ? 'No unassigned trees.' :
                       'No trees grown for this notebook yet.'}
                    </p>
                    <p className="text-[10px]" style={{ color: isDark ? '#6a6760' : '#9a9690' }}>
                      Complete focus sessions with a seed selected to grow your collection.
                    </p>
                  </div>
                ) : (
                  <>
                    {placed.map(({ x, y, tree }, renderIdx) => {
                      const typeInfo = TREE_TYPES[tree.type]
                      const rarity = typeInfo?.rarity || 'common'
                      const meta = RARITY_META[rarity] || RARITY_META.common
                      const shape = typeInfo?.shape || 'oak'
                      const shapeScale = ({ oak: 1.25, conifer: 1.3, birch: 1.2, cypress: 1.3, sakura: 1.25, bamboo: 1.15, void: 1.1 } as Record<string, number>)[shape] || 0.95
                      const depthT = Math.max(0, Math.min(1, (y - 40) / 55))
                      const depthScale = 0.55 + depthT * 0.55
                      const treeSize = Math.round(baseSize * depthScale * shapeScale)
                      const scaleY = 0.75 + depthT * 0.25
                      const dimAmount = Math.round((1 - depthT) * 25)
                      const skewX = ((x - 50) / 50) * (1 - depthT) * -2

                      return (
                        <div
                          key={`${tree.id ?? 'tree'}-${renderIdx}`}
                          className="absolute flex flex-col items-center group"
                          onClick={chopMode ? () => setChopTarget({ tree, sap: getSapYield(tree) }) : undefined}
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: `translate(-50%, -85%) scaleY(${scaleY.toFixed(3)}) skewX(${skewX.toFixed(1)}deg)`,
                            transformOrigin: 'center bottom',
                            zIndex: Math.round(y),
                            animation: `tree-pop 0.3s ease-out ${renderIdx * 12}ms both`,
                            willChange: 'transform, opacity',
                            cursor: chopMode ? 'pointer' : undefined,
                          }}
                        >
                          <div className={tree.stage >= 3 ? getRarityPlantClass(tree.type) : ''} style={{
                            filter: chopMode
                              ? `brightness(${100 - dimAmount}%) drop-shadow(0 0 6px rgba(217,119,6,0.6))`
                              : dimAmount > 2 ? `brightness(${100 - dimAmount}%)` : undefined,
                            transition: 'filter 0.2s',
                          }}>
                            <PlantIcon type={tree.type} size={treeSize} stage={tree.stage} hideGround dirtSeed={(renderIdx + 1) * 983 + Math.round(x * 17) + Math.round(y * 29)} dirtDark={isDark} dirtDepth={depthT} dirtTilt={skewX * 3} />
                          </div>

                          <div className="mt-0.5 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ zIndex: 300 }}>
                            <div className="px-2.5 py-1.5 rounded-lg" style={{
                              backgroundColor: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.96)',
                              border: `1px solid ${cardBorder}`,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}>
                              <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap block" style={{ color: textPrimary }}>
                                {typeInfo?.name || tree.type}
                              </span>
                              <span className="text-[8px] font-semibold uppercase tracking-widest whitespace-nowrap block mt-0.5" style={{ color: meta.color }}>
                                {meta.label}
                              </span>
                              {tree.stage < 4 && (
                                <div className="w-full h-[2px] rounded-full mt-1 overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, tree.progress)}%`, background: '#8ba870' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            </div>
          </div>

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
                  className="rounded-xl p-5 flex flex-col items-center gap-3 min-w-[220px]"
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
                  <span className="text-[13px] font-bold" style={{ color: isDark ? '#d4d0c8' : '#3a3630', fontFamily: 'EB Garamond, serif' }}>
                    Chop {TREE_TYPES[chopTarget.tree.type]?.name || chopTarget.tree.type}?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PulpIcon size={14} />
                    <span className="text-[14px] font-bold" style={{ color: '#d97706' }}>+{chopTarget.sap} sap</span>
                  </div>
                  <div className="flex gap-2 mt-1 w-full">
                    <button
                      onClick={() => setChopTarget(null)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        color: isDark ? '#8a8780' : '#7a7670',
                      }}
                    >
                      Keep
                    </button>
                    <button
                      onClick={confirmChop}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
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
        </div>
      </div>
    </div>
  )
})
