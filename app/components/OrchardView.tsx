"use client"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
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
function getTimePhase(): { phase: string; t: number; hour: number } {
  const now = new Date()
  const hour = now.getHours() + now.getMinutes() / 60
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
    sunGlow: 0, sunColor: '#000000', sunY: 30,
    moonGlow: 0.7, moonY: 4,
    starOpacity: 0.8,
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
    sunGlow: 0.5, sunColor: '#d97706', sunY: 16,
    moonGlow: 0.2, moonY: 20,
    starOpacity: 0.15,
    mtnLightOpacity: 0.08, mtnLightColor: 'rgba(217,119,6,0.08)',
    groveOpacity: 0.85,
    ambientOverlay: 'rgba(40,20,30,0.15)', ambientOpacity: 0.15,
  },
  morning: {
    skyTop: '#c46820', skyMid: '#d98030', skyLow: '#e89838', skyHorizon: '#daa048', skyField: '#a0b8a0', skyBottom: '#88aaaa',
    oceanTop: '#c4a868', oceanMid: '#b89850', oceanBot: '#d0b078',
    mtnTop: '#8090a0', mtnMid: '#6a7a8a', mtnBot: '#5a6a7a',
    snowTop: '#d0d8e0', snowFade: '#8a94a0',
    hillMidTop: '#5a9a4a', hillMidBot: '#4a8a3a',
    hillNearTop: '#6aaa58', hillNearBot: '#5a9a48',
    fieldTop: '#7db860', fieldMid1: '#72aa56', fieldMid2: '#6a9e50', fieldBot: '#5e9248',
    sunGlow: 0.8, sunColor: '#d97706', sunY: 8,
    moonGlow: 0, moonY: 30,
    starOpacity: 0,
    mtnLightOpacity: 0.18, mtnLightColor: 'rgba(255,200,100,0.18)',
    groveOpacity: 0.9,
    ambientOverlay: 'rgba(0,0,0,0)', ambientOpacity: 0,
  },
  day: {
    skyTop: '#5a9aca', skyMid: '#6aaad0', skyLow: '#88bcd8', skyHorizon: '#a0cce0', skyField: '#90c0a8', skyBottom: '#80b8b0',
    oceanTop: '#5898b8', oceanMid: '#4888a8', oceanBot: '#68a0c0',
    mtnTop: '#7888a0', mtnMid: '#687890', mtnBot: '#586878',
    snowTop: '#d8e0e8', snowFade: '#8a98a8',
    hillMidTop: '#5aa04a', hillMidBot: '#4a903a',
    hillNearTop: '#68b058', hillNearBot: '#58a048',
    fieldTop: '#7ec062', fieldMid1: '#72b058', fieldMid2: '#6aa450', fieldBot: '#5e9848',
    sunGlow: 0.6, sunColor: '#f0c860', sunY: 3,
    moonGlow: 0, moonY: 30,
    starOpacity: 0,
    mtnLightOpacity: 0.08, mtnLightColor: 'rgba(255,255,200,0.08)',
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
    sunGlow: 1, sunColor: '#d97706', sunY: 14,
    moonGlow: 0.1, moonY: 18,
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

const STAR_POSITIONS = Array.from({ length: 60 }, (_, i) => {
  const rng = seededRng(i * 47 + 199)
  return { x: rng() * 200, y: rng() * 26, r: 0.15 + rng() * 0.3, twinkle: rng() }
})

const Terrain = memo(function Terrain({ isDark, treeCount, treeBases }: { isDark: boolean; treeCount: number; treeBases: { x: number; y: number; col: number }[] }) {
  const [timeState, setTimeState] = useState(getTimePhase)
  useEffect(() => {
    const id = setInterval(() => setTimeState(getTimePhase()), 60000)
    return () => clearInterval(id)
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

        {/* Stars — visible at night/dawn/dusk */}
        {p.starOpacity > 0.01 && (
          <g opacity={p.starOpacity}>
            {STAR_POSITIONS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff">
                {s.twinkle > 0.6 && <animate attributeName="opacity" values="1;0.3;1" dur={`${2 + s.twinkle * 3}s`} repeatCount="indefinite" />}
              </circle>
            ))}
          </g>
        )}

        {/* Moon — soft organic glow */}
        {p.moonGlow > 0.05 && (
          <g opacity={p.moonGlow}>
            <defs>
              <radialGradient id="moon-haze" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(200,215,240,0.12)" />
                <stop offset="30%" stopColor="rgba(180,200,230,0.06)" />
                <stop offset="60%" stopColor="rgba(160,180,220,0.02)" />
                <stop offset="100%" stopColor="rgba(140,160,200,0)" />
              </radialGradient>
              <radialGradient id="moon-face" cx="45%" cy="42%" r="55%">
                <stop offset="0%" stopColor="#f0f4fc" />
                <stop offset="40%" stopColor="#e4eaf6" />
                <stop offset="70%" stopColor="#d0d8ea" />
                <stop offset="100%" stopColor="#b8c4da" />
              </radialGradient>
            </defs>
            <ellipse cx="100" cy={p.moonY} rx="28" ry="14" fill="url(#moon-haze)">
              <animate attributeName="rx" values="28;30;28" dur="6s" repeatCount="indefinite" />
              <animate attributeName="ry" values="14;15;14" dur="6s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="100" cy={p.moonY} rx="14" ry="7" fill="rgba(190,205,235,0.04)">
              <animate attributeName="rx" values="14;16;14" dur="8s" repeatCount="indefinite" />
            </ellipse>
            <circle cx="100" cy={p.moonY} r="3.2" fill="url(#moon-face)" />
            <circle cx="99.3" cy={p.moonY - 0.6} r="0.4" fill="rgba(170,180,200,0.2)" />
            <circle cx="100.7" cy={p.moonY + 0.5} r="0.55" fill="rgba(160,170,190,0.15)" />
            <circle cx="99.6" cy={p.moonY + 0.9} r="0.25" fill="rgba(170,180,200,0.12)" />
            <circle cx="100.3" cy={p.moonY - 0.3} r="0.2" fill="rgba(180,190,210,0.1)" />
          </g>
        )}

        {/* Sun glow — centered, rises/sets vertically */}
        {p.sunGlow > 0.05 && (
          <g opacity={p.sunGlow}>
            <ellipse cx="100" cy={p.sunY} rx="80" ry="12" fill="rgba(220,140,40,0.15)" />
            <ellipse cx="100" cy={p.sunY} rx="50" ry="8" fill="rgba(240,160,50,0.2)" />
            <ellipse cx="100" cy={p.sunY} rx="25" ry="5" fill="rgba(255,200,80,0.3)" />
            <ellipse cx="100" cy={p.sunY} rx="12" ry="3.5" fill="rgba(255,220,100,0.4)" />
            <ellipse cx="100" cy={p.sunY} rx="5" ry="2" fill="rgba(255,240,140,0.5)" />
            <ellipse cx="100" cy={p.sunY} rx="2" ry="1" fill="rgba(255,250,200,0.6)" />
          </g>
        )}

        {/* Ocean band */}
        <path d="M-5,14 L205,14 L205,28 L-5,28 Z" fill="url(#ocean-g)" />
        {/* Sun reflection on water */}
        {p.sunGlow > 0.1 && (
          <g opacity={p.sunGlow * 0.6}>
            <ellipse cx="100" cy="16" rx="8" ry="1.5" fill="rgba(255,240,160,0.4)" />
            <ellipse cx="100" cy="19" rx="12" ry="2" fill="rgba(255,220,120,0.3)" />
            <ellipse cx="100" cy="22" rx="16" ry="2.5" fill="rgba(255,200,100,0.2)" />
            <ellipse cx="100" cy="25" rx="20" ry="2" fill="rgba(255,180,80,0.12)" />
            <ellipse cx="100" cy="20" rx="50" ry="5" fill="rgba(255,180,80,0.1)" />
          </g>
        )}
        {/* Moon reflection on water */}
        {p.moonGlow > 0.1 && (
          <g opacity={p.moonGlow * 0.4}>
            <ellipse cx="100" cy="17" rx="4" ry="1" fill="rgba(200,215,240,0.2)" />
            <ellipse cx="100" cy="20" rx="8" ry="1.5" fill="rgba(180,200,230,0.1)" />
            <ellipse cx="100" cy="23" rx="12" ry="2" fill="rgba(160,180,210,0.05)" />
          </g>
        )}
        {/* Ocean ripples — animated waves */}
        <g>
          {/* Wave 1 — near surface */}
          <path fill="none" stroke="rgba(255,255,240,0.12)" strokeWidth="0.25">
            <animate attributeName="d" dur="7s" repeatCount="indefinite" values="
              M-5,15.8 Q15,15.2 35,15.8 Q55,16.4 75,15.8 Q95,15.2 115,15.8 Q135,16.4 155,15.8 Q175,15.2 195,15.8 L205,15.8;
              M-5,15.8 Q20,16.3 40,15.6 Q60,14.9 80,15.8 Q100,16.7 120,15.6 Q140,14.9 160,15.8 Q180,16.5 200,15.4 L205,15.8;
              M-5,15.8 Q10,15 30,15.9 Q50,16.8 70,15.7 Q90,14.8 110,15.8 Q130,16.6 150,15.5 Q170,15 190,15.8 L205,15.8;
              M-5,15.8 Q15,15.2 35,15.8 Q55,16.4 75,15.8 Q95,15.2 115,15.8 Q135,16.4 155,15.8 Q175,15.2 195,15.8 L205,15.8
            " />
          </path>
          {/* Wave 2 */}
          <path fill="none" stroke="rgba(255,255,240,0.14)" strokeWidth="0.3">
            <animate attributeName="d" dur="9s" repeatCount="indefinite" values="
              M-5,17.5 Q20,17 45,17.5 Q70,18 95,17.5 Q120,17 145,17.5 Q170,18 195,17.5 L205,17.5;
              M-5,17.5 Q25,18.1 50,17.3 Q75,16.8 100,17.6 Q125,18.2 150,17.4 Q175,16.9 200,17.5 L205,17.5;
              M-5,17.5 Q15,16.9 40,17.7 Q65,18.3 90,17.4 Q115,16.8 140,17.6 Q165,18.1 190,17.3 L205,17.5;
              M-5,17.5 Q20,17 45,17.5 Q70,18 95,17.5 Q120,17 145,17.5 Q170,18 195,17.5 L205,17.5
            " />
          </path>
          {/* Wave 3 */}
          <path fill="none" stroke="rgba(255,255,240,0.1)" strokeWidth="0.22">
            <animate attributeName="d" dur="12s" repeatCount="indefinite" values="
              M-5,20 Q30,19.4 60,20 Q90,20.6 120,20 Q150,19.4 180,20 L205,20;
              M-5,20 Q25,20.5 55,19.5 Q85,19 115,20.2 Q145,20.8 175,19.6 L205,20;
              M-5,20 Q35,19.2 65,20.3 Q95,20.9 125,19.7 Q155,19.1 185,20.1 L205,20;
              M-5,20 Q30,19.4 60,20 Q90,20.6 120,20 Q150,19.4 180,20 L205,20
            " />
          </path>
          {/* Wave 4 — deep */}
          <path fill="none" stroke="rgba(255,255,240,0.07)" strokeWidth="0.18">
            <animate attributeName="d" dur="16s" repeatCount="indefinite" values="
              M-5,22.5 Q40,22 80,22.5 Q120,23 160,22.5 Q190,22 205,22.5;
              M-5,22.5 Q35,23 75,22.2 Q115,21.8 155,22.6 Q185,23.1 205,22.5;
              M-5,22.5 Q45,21.9 85,22.8 Q125,23.2 165,22.3 Q195,22 205,22.5;
              M-5,22.5 Q40,22 80,22.5 Q120,23 160,22.5 Q190,22 205,22.5
            " />
          </path>
          {/* Wave 5 — deepest, slow swell */}
          <path fill="none" stroke="rgba(255,255,240,0.05)" strokeWidth="0.15">
            <animate attributeName="d" dur="20s" repeatCount="indefinite" values="
              M-5,25 Q50,24.5 100,25 Q150,25.5 200,25 L205,25;
              M-5,25 Q45,25.4 95,24.7 Q145,24.3 195,25.2 L205,25;
              M-5,25 Q55,24.6 105,25.3 Q155,25.7 200,24.8 L205,25;
              M-5,25 Q50,24.5 100,25 Q150,25.5 200,25 L205,25
            " />
          </path>
          {/* Glints — tiny bright spots that catch light */}
          <circle cx="80" cy="17" r="0.3" fill="rgba(255,255,240,0.15)">
            <animate attributeName="opacity" values="0;0.15;0;0" dur="4s" repeatCount="indefinite" />
            <animate attributeName="cx" values="80;84;80" dur="7s" repeatCount="indefinite" />
          </circle>
          <circle cx="120" cy="19" r="0.25" fill="rgba(255,255,240,0.12)">
            <animate attributeName="opacity" values="0;0.12;0;0" dur="5s" begin="1.5s" repeatCount="indefinite" />
            <animate attributeName="cx" values="120;117;120" dur="9s" repeatCount="indefinite" />
          </circle>
          <circle cx="60" cy="21" r="0.2" fill="rgba(255,255,240,0.1)">
            <animate attributeName="opacity" values="0;0.1;0;0" dur="6s" begin="3s" repeatCount="indefinite" />
            <animate attributeName="cx" values="60;63;60" dur="11s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Mountain range */}
        <path d="M-10,28 L5,24 L15,12 L25,22 L35,10 L42,18 L50,8 L58,16 L68,11 L78,20 L85,14 L95,22 L105,9 L115,18 L125,13 L135,22 L145,16 L155,10 L165,20 L175,15 L185,22 L195,18 L210,24 L210,34 L-10,34 Z" fill="url(#hill-far)" />
        {/* Snow caps */}
        <path d="M15,12 L12,16 L18,16 Z" fill="url(#mtn-snow)" opacity="0.4" />
        <path d="M35,10 L32,15 L38,15 Z" fill="url(#mtn-snow)" opacity="0.35" />
        <path d="M50,8 L47,13 L53,13 Z" fill="url(#mtn-snow)" opacity="0.45" />
        <path d="M68,11 L65,15 L71,15 Z" fill="url(#mtn-snow)" opacity="0.3" />
        <path d="M105,9 L102,14 L108,14 Z" fill="url(#mtn-snow)" opacity="0.45" />
        <path d="M155,10 L152,15 L158,15 Z" fill="url(#mtn-snow)" opacity="0.4" />
        {/* Mountain shadow */}
        <path d="M-10,28 L5,24 L15,12 L25,22 L35,10 L42,18 L50,8 L58,16 L68,11 L78,20 L85,14 L95,22 L105,9 L115,18 L125,13 L135,22 L145,16 L155,10 L165,20 L175,15 L185,22 L195,18 L210,24 L210,34 L-10,34 Z" fill="rgba(0,0,0,0.06)" />
        {/* Sunlit mountain faces — intensity and side based on sun position */}
        {p.mtnLightOpacity > 0.01 && (() => {
          const faces = [
                { points: "50,8 58,16 50,16", o: 1 },
                { points: "105,9 115,18 105,18", o: 1.1 },
                { points: "85,14 95,22 88,22", o: 0.9 },
                { points: "68,11 78,20 70,20", o: 0.8 },
                { points: "35,10 42,18 37,18", o: 0.7 },
                { points: "155,10 165,20 158,20", o: 0.8 },
              ]
          return (
            <g>
              {faces.map((f, i) => (
                <polygon key={i} points={f.points} fill={p.mtnLightColor} opacity={p.mtnLightOpacity * f.o} />
              ))}
            </g>
          )
        })()}

        {/* Mid hills */}
        <path d="M-10,32 C8,28 18,23 30,26 C40,28 48,22 60,24 C72,26 80,20 95,23 C108,25 116,21 130,24 C142,26 152,22 165,25 C176,27 186,23 200,26 L210,28 L210,40 L-10,40 Z" fill="url(#hill-mid)" />
        <path d="M-10,32 C8,28 18,23 30,26 C40,28 48,22 60,24 C72,26 80,20 95,23 C108,25 116,21 130,24 C142,26 152,22 165,25 C176,27 186,23 200,26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />

        {/* Distant tangerine grove */}
        {(() => {
          const trunks: string[] = []
          const canopies: string[] = []
          const fruits: string[] = []
          for (let i = 0; i < 70; i++) {
            const rng = seededRng(i * 71 + 303)
            const x = -5 + rng() * 210
            const baseY = 26 + rng() * 12
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
              <path d={trunks.join('')} stroke={isDark ? '#2a1a0e' : '#6a4a2a'} strokeWidth="0.4" fill="none" />
              <path d={canopies.join('')} fill={isDark ? '#0e1c10' : '#3a6a35'} />
              <path d={fruits.join('')} fill={isDark ? '#b06810' : '#ea580c'} />
            </g>
          )
        })()}

        {/* Near hills */}
        <path d="M-10,37 C10,33 25,30 40,32 C52,33.5 60,28 75,30 C88,31.5 96,27 112,29 C126,30.5 135,27 150,29.5 C162,31 172,28 188,30 L210,32 L210,42 L-10,42 Z" fill="url(#hill-near)" />
        <path d="M-10,37 C10,33 25,30 40,32 C52,33.5 60,28 75,30 C88,31.5 96,27 112,29 C126,30.5 135,27 150,29.5 C162,31 172,28 188,30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

        {/* Tangerine grove on near hills */}
        {(() => {
          const trunks: string[] = []
          const canopies: string[] = []
          const fruits: string[] = []
          for (let i = 0; i < 50; i++) {
            const rng = seededRng(i * 89 + 707)
            const x = -5 + rng() * 210
            const baseY = 32 + rng() * 8
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
              <path d={trunks.join('')} stroke={isDark ? '#2a1a0e' : '#6a4a2a'} strokeWidth="0.5" fill="none" />
              <path d={canopies.join('')} fill={isDark ? '#122216' : '#3a7a38'} />
              <path d={fruits.join('')} fill={isDark ? '#b06810' : '#ea580c'} />
            </g>
          )
        })()}

        {/* Main field */}
        <path d="M-5,36 Q20,39 50,37 Q80,35 100,37 Q130,39 160,36 Q185,38 205,37 L205,100 L-5,100 Z" fill="url(#field-g)" />

        {/* Field texture */}
        <path d="M0,50 Q50,48 100,50 Q150,52 200,50" fill="none" stroke="rgba(40,60,30,0.15)" strokeWidth="0.4" />
        <path d="M0,62 Q40,60 80,62 Q120,64 160,62 Q180,60 200,62" fill="none" stroke="rgba(40,60,30,0.12)" strokeWidth="0.35" />
        <path d="M0,74 Q60,72 120,74 Q160,76 200,74" fill="none" stroke="rgba(40,60,30,0.1)" strokeWidth="0.3" />
        <path d="M0,86 Q50,84.5 100,86 Q150,87.5 200,86" fill="none" stroke="rgba(40,60,30,0.08)" strokeWidth="0.25" />

        {/* Tilled dirt columns — smooth curves through actual tree positions */}
        {Array.from({ length: tillCols }).map((_, ci) => {
          const colTrees = treeBases.filter(t => t.col === ci).sort((a, b) => a.y - b.y)
          const rng = seededRng(ci * 137 + 42)
          const steps = 16
          const pts: [number, number][] = []
          for (let s = 0; s <= steps; s++) {
            const t = s / steps
            const y = 40 + t * 57
            const depthT = t
            const pinch = (1 - depthT) * 18 - depthT * 4
            const trapL = colStart + pinch
            const trapR = colEnd - pinch
            let x = (tillCols === 1 ? 50 : trapL + ci * ((trapR - trapL) / Math.max(1, tillCols - 1))) * 2

            const nearby = colTrees.find(tb => Math.abs(tb.y - y) < 8)
            if (nearby) x += (nearby.x * 2 - x) * 0.7

            const wobble = (rng() - 0.5) * 0.4
            pts.push([x + wobble, y])
          }
          let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
          for (let i = 1; i < pts.length; i++) {
            const [px, py] = pts[i - 1]
            const [cx, cy] = pts[i]
            const mx = ((px + cx) / 2).toFixed(1)
            const my = ((py + cy) / 2).toFixed(1)
            d += ` Q${px.toFixed(1)},${py.toFixed(1)} ${mx},${my}`
          }
          const [lx, ly] = pts[pts.length - 1]
          d += ` L${lx.toFixed(1)},${ly.toFixed(1)}`
          return (
            <g key={`till-${ci}`}>
              <path d={d} fill="none" stroke={isDark ? '#1a1408' : '#5a4a30'} strokeWidth="2.5" opacity={isDark ? 0.16 : 0.09} strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} fill="none" stroke={dirtColor} strokeWidth="1.5" opacity={isDark ? 0.35 : 0.22} strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} fill="none" stroke={dirtLight} strokeWidth="0.4" opacity={isDark ? 0.15 : 0.1} strokeLinecap="round" transform="translate(-0.3, -0.2)" />
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

        {/* Dirt path */}
        <path d="M-5,96 Q50,93 100,95 Q150,93 205,96 L205,100 L-5,100 Z" fill={dirtColor} opacity="0.2" />
      </svg>

      {/* Soft vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: isDark
          ? 'inset 0 0 60px 15px rgba(8,12,8,0.4)'
          : 'inset 0 0 40px 10px rgba(80,100,60,0.12)',
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

  const [chopMode, setChopMode] = useState(false)
  const [chopTarget, setChopTarget] = useState<{ tree: any; sap: number } | null>(null)

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
          <div className="absolute inset-0 z-50 pointer-events-none" style={{ boxShadow: `inset 0 0 30px 10px ${isDark ? 'rgba(9,9,11,0.6)' : 'rgba(240,236,234,0.5)'}` }} />
          <Terrain isDark={isDark} treeCount={currentPlotTrees.length} treeBases={placed} />

          {/* Orchard scene */}
          <div className="flex-1 relative overflow-hidden" style={{
            perspective: '800px',
          }}>
            {/* Notebook switcher overlay */}
            <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 pointer-events-auto" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)' }}>
                {activeNotes.map(note => {
                  const isSelected = selectedNotebook === note.id
                  const icon = note.icon || NOTE_TYPE_ICONS[note.noteType || 'notebook'] || '📓'
                  const count = notebookTreeCounts[note.id] || 0
                  return (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNotebook(note.id)}
                      className="px-2 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1.5"
                      style={{
                        backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)') : 'transparent',
                        color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
                      }}
                      title={note.subject || 'Untitled'}
                    >
                      <span className="text-[11px]">{icon}</span>
                      {isSelected && <span className="truncate max-w-[80px]">{note.subject || 'Untitled'}</span>}
                      {isSelected && count > 0 && <span className="opacity-50 text-[9px]">{count}</span>}
                    </button>
                  )
                })}
                {(notebookTreeCounts['_unassigned'] || 0) > 0 && (
                  <button
                    onClick={() => setSelectedNotebook('_unassigned')}
                    className="px-2 py-1 rounded-full text-[10px] font-medium transition-all flex items-center gap-1.5"
                    style={{
                      backgroundColor: selectedNotebook === '_unassigned' ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)') : 'transparent',
                      color: selectedNotebook === '_unassigned' ? '#fff' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <span className="opacity-60"><LeafIcon size={10} /></span>
                    {selectedNotebook === '_unassigned' && <span>Unassigned</span>}
                  </button>
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
              <button onClick={onClose} className="absolute right-3 p-1.5 rounded-full transition-opacity hover:opacity-100 opacity-70 pointer-events-auto" style={{ color: '#fff', backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
              {/* Axe / chop mode toggle */}
              <button
                onClick={() => { setChopMode(m => !m); setChopTarget(null) }}
                className="absolute left-3 p-1.5 rounded-full transition-all pointer-events-auto"
                style={{
                  color: chopMode ? '#d97706' : '#fff',
                  backgroundColor: chopMode ? (isDark ? 'rgba(217,119,6,0.25)' : 'rgba(217,119,6,0.2)') : (isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'),
                  opacity: chopMode ? 1 : 0.7,
                  boxShadow: chopMode ? '0 0 8px rgba(217,119,6,0.4)' : 'none',
                }}
                title={chopMode ? 'Exit chop mode' : 'Chop trees for sap'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 7L8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
                  <path d="M8 6l2-2" />
                  <path d="M18 15l-8-8" />
                  <path d="M15 18l5.3 2.7a2.41 2.41 0 0 0 3.4-3.4L21 12" />
                </svg>
              </button>
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
