"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES, getLevel } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"
import { PulpIcon, GemIcon, LeafIcon } from '@/app/components/CurrencyIcons'
import type { NoteData } from "@/app/types"

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
  const rowStart = 44
  const rowEnd = 93

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

const Terrain = memo(function Terrain({ isDark, treeCount, treeBases }: { isDark: boolean; treeCount: number; treeBases: { x: number; y: number; col: number }[] }) {
  const dirtColor = isDark ? '#2a2418' : '#8a7a5a'
  const dirtLight = isDark ? '#322c1e' : '#9a8a6a'

  const cols = Math.min(7, Math.max(3, Math.ceil(Math.sqrt(treeCount * 1.1))))
  const colStart = 6
  const colEnd = 94
  const tillCols = cols
  const rowLevels = Array.from(new Set(treeBases.map(tb => Math.round(tb.y * 10) / 10))).sort((a, b) => a - b)

  return (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 100" preserveAspectRatio="none">
        <defs>
          {/* Sky with sunset */}
          <linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#1a0c06' : '#c46820'} />
            <stop offset="20%" stopColor={isDark ? '#241208' : '#d98030'} />
            <stop offset="40%" stopColor={isDark ? '#2e1a0a' : '#e89838'} />
            <stop offset="60%" stopColor={isDark ? '#281608' : '#daa048'} />
            <stop offset="80%" stopColor={isDark ? '#141a1e' : '#a0b8a0'} />
            <stop offset="100%" stopColor={isDark ? '#101820' : '#88aaaa'} />
          </linearGradient>
          {/* Ocean */}
          <linearGradient id="ocean-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#0a1a2a' : '#4a90b8'} />
            <stop offset="50%" stopColor={isDark ? '#081624' : '#3d7fa8'} />
            <stop offset="100%" stopColor={isDark ? '#0c1e2e' : '#5a9cc4'} />
          </linearGradient>
          {/* Mountain range */}
          <linearGradient id="hill-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#1a1a20' : '#8090a0'} />
            <stop offset="60%" stopColor={isDark ? '#141418' : '#6a7a8a'} />
            <stop offset="100%" stopColor={isDark ? '#101014' : '#5a6a7a'} />
          </linearGradient>
          <linearGradient id="mtn-snow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#3a3a44' : '#d0d8e0'} />
            <stop offset="100%" stopColor={isDark ? '#1a1a20' : '#8a94a0'} stopOpacity="0" />
          </linearGradient>
          {/* Mid hill */}
          <linearGradient id="hill-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#142416' : '#5a9a4a'} />
            <stop offset="100%" stopColor={isDark ? '#101e12' : '#4a8a3a'} />
          </linearGradient>
          {/* Near hill */}
          <linearGradient id="hill-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#1a2e18' : '#6aaa58'} />
            <stop offset="100%" stopColor={isDark ? '#162614' : '#5a9a48'} />
          </linearGradient>
          {/* Field */}
          <linearGradient id="field-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDark ? '#1e3218' : '#7db860'} />
            <stop offset="30%" stopColor={isDark ? '#1a2c16' : '#72aa56'} />
            <stop offset="70%" stopColor={isDark ? '#1c2e16' : '#6a9e50'} />
            <stop offset="100%" stopColor={isDark ? '#182812' : '#5e9248'} />
          </linearGradient>
          {/* Brick pattern */}
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

        {/* Sun glow on horizon */}
        <ellipse cx="100" cy="14" rx="80" ry="12" fill={isDark ? 'rgba(220,140,40,0.1)' : 'rgba(255,180,60,0.25)'} />
        <ellipse cx="100" cy="14" rx="50" ry="8" fill={isDark ? 'rgba(240,160,50,0.12)' : 'rgba(255,200,60,0.35)'} />
        <ellipse cx="100" cy="14" rx="25" ry="5" fill={isDark ? 'rgba(255,200,80,0.15)' : 'rgba(255,230,100,0.5)'} />
        <ellipse cx="100" cy="14" rx="12" ry="3.5" fill={isDark ? 'rgba(255,220,100,0.18)' : 'rgba(255,245,160,0.65)'} />
        <ellipse cx="100" cy="14" rx="5" ry="2" fill={isDark ? 'rgba(255,240,140,0.15)' : 'rgba(255,255,220,0.8)'} />
        <ellipse cx="100" cy="14" rx="2" ry="1" fill={isDark ? 'rgba(255,250,200,0.12)' : 'rgba(255,255,245,0.9)'} />

        {/* Ocean band */}
        <path d="M-5,14 L205,14 L205,28 L-5,28 Z" fill="url(#ocean-g)" />
        {/* Sun reflection column on water */}
        <ellipse cx="100" cy="16" rx="8" ry="1.5" fill={isDark ? 'rgba(255,220,120,0.08)' : 'rgba(255,240,160,0.4)'} />
        <ellipse cx="100" cy="19" rx="12" ry="2" fill={isDark ? 'rgba(255,200,100,0.06)' : 'rgba(255,220,120,0.3)'} />
        <ellipse cx="100" cy="22" rx="16" ry="2.5" fill={isDark ? 'rgba(255,180,80,0.04)' : 'rgba(255,200,100,0.2)'} />
        <ellipse cx="100" cy="25" rx="20" ry="2" fill={isDark ? 'rgba(255,160,60,0.03)' : 'rgba(255,180,80,0.12)'} />
        {/* Broad warm glow on water */}
        <ellipse cx="100" cy="20" rx="50" ry="5" fill={isDark ? 'rgba(200,120,40,0.05)' : 'rgba(255,180,80,0.1)'} />
        {/* Ocean shimmer — staggered waves */}
        <path d="M0,16 Q15,15.4 30,16 Q45,16.6 60,16 Q75,15.4 90,16 Q105,16.6 120,16 Q135,15.4 150,16 Q165,16.6 180,16 Q195,15.4 200,16" fill="none" stroke={isDark ? 'rgba(100,160,220,0.06)' : 'rgba(255,255,255,0.15)'} strokeWidth="0.2" />
        <path d="M10,18 Q25,17.3 40,18 Q55,18.7 70,18 Q85,17.3 100,18 Q115,18.7 130,18 Q145,17.3 160,18 Q175,18.7 190,18" fill="none" stroke={isDark ? 'rgba(100,160,220,0.07)' : 'rgba(255,255,255,0.18)'} strokeWidth="0.25" />
        <path d="M5,20.5 Q30,19.8 55,20.5 Q80,21.2 105,20.5 Q130,19.8 155,20.5 Q180,21.2 200,20.5" fill="none" stroke={isDark ? 'rgba(100,160,220,0.05)' : 'rgba(255,255,255,0.12)'} strokeWidth="0.2" />
        <path d="M0,23 Q35,22.3 70,23 Q105,23.7 140,23 Q175,22.3 200,23" fill="none" stroke={isDark ? 'rgba(100,160,220,0.04)' : 'rgba(255,255,255,0.08)'} strokeWidth="0.18" />
        <path d="M15,25.5 Q50,25 85,25.5 Q120,26 155,25.5 Q190,25 205,25.5" fill="none" stroke={isDark ? 'rgba(100,160,220,0.03)' : 'rgba(255,255,255,0.06)'} strokeWidth="0.15" />

        {/* Mountain range — sharp peaks */}
        <path d="M-10,28 L5,24 L15,12 L25,22 L35,10 L42,18 L50,8 L58,16 L68,11 L78,20 L85,14 L95,22 L105,9 L115,18 L125,13 L135,22 L145,16 L155,10 L165,20 L175,15 L185,22 L195,18 L210,24 L210,34 L-10,34 Z" fill="url(#hill-far)" />
        {/* Snow caps on peaks */}
        <path d="M15,12 L12,16 L18,16 Z" fill="url(#mtn-snow)" opacity={isDark ? '0.3' : '0.5'} />
        <path d="M35,10 L32,15 L38,15 Z" fill="url(#mtn-snow)" opacity={isDark ? '0.25' : '0.45'} />
        <path d="M50,8 L47,13 L53,13 Z" fill="url(#mtn-snow)" opacity={isDark ? '0.35' : '0.55'} />
        <path d="M68,11 L65,15 L71,15 Z" fill="url(#mtn-snow)" opacity={isDark ? '0.2' : '0.4'} />
        <path d="M105,9 L102,14 L108,14 Z" fill="url(#mtn-snow)" opacity={isDark ? '0.35' : '0.55'} />
        <path d="M155,10 L152,15 L158,15 Z" fill="url(#mtn-snow)" opacity={isDark ? '0.3' : '0.5'} />
        {/* Mountain shadow */}
        <path d="M-10,28 L5,24 L15,12 L25,22 L35,10 L42,18 L50,8 L58,16 L68,11 L78,20 L85,14 L95,22 L105,9 L115,18 L125,13 L135,22 L145,16 L155,10 L165,20 L175,15 L185,22 L195,18 L210,24 L210,34 L-10,34 Z" fill={isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)'} />
        {/* Sunlit mountain faces — warm light on sides facing center */}
        <polygon points="50,8 58,16 50,16" fill={isDark ? 'rgba(255,180,80,0.06)' : 'rgba(255,200,100,0.18)'} />
        <polygon points="105,9 115,18 105,18" fill={isDark ? 'rgba(255,180,80,0.07)' : 'rgba(255,200,100,0.2)'} />
        <polygon points="95,22 105,9 100,22" fill={isDark ? 'rgba(255,180,80,0.05)' : 'rgba(255,200,100,0.15)'} />
        <polygon points="85,14 95,22 88,22" fill={isDark ? 'rgba(255,180,80,0.06)' : 'rgba(255,200,100,0.16)'} />
        <polygon points="68,11 78,20 70,20" fill={isDark ? 'rgba(255,180,80,0.05)' : 'rgba(255,200,100,0.14)'} />
        <polygon points="35,10 42,18 37,18" fill={isDark ? 'rgba(255,170,60,0.04)' : 'rgba(255,190,80,0.1)'} />
        <polygon points="125,13 135,22 128,22" fill={isDark ? 'rgba(255,170,60,0.04)' : 'rgba(255,190,80,0.1)'} />

        {/* Mid hills — rounder, softer */}
        <path d="M-10,32 C8,28 18,23 30,26 C40,28 48,22 60,24 C72,26 80,20 95,23 C108,25 116,21 130,24 C142,26 152,22 165,25 C176,27 186,23 200,26 L210,28 L210,40 L-10,40 Z" fill="url(#hill-mid)" />
        {/* Light edge on mid hills */}
        <path d="M-10,32 C8,28 18,23 30,26 C40,28 48,22 60,24 C72,26 80,20 95,23 C108,25 116,21 130,24 C142,26 152,22 165,25 C176,27 186,23 200,26" fill="none" stroke={isDark ? 'rgba(80,140,60,0.15)' : 'rgba(255,255,255,0.12)'} strokeWidth="0.4" />

        {/* Distant tangerine grove on far hills */}
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
            <g opacity={isDark ? 0.6 : 0.5}>
              <path d={trunks.join('')} stroke={isDark ? '#2a1a0e' : '#6a4a2a'} strokeWidth="0.4" fill="none" />
              <path d={canopies.join('')} fill={isDark ? '#0e1c10' : '#3a6a35'} />
              <path d={fruits.join('')} fill={isDark ? '#b06810' : '#ea580c'} />
            </g>
          )
        })()}

        {/* Near hills — the foreground ridge before the field */}
        <path d="M-10,37 C10,33 25,30 40,32 C52,33.5 60,28 75,30 C88,31.5 96,27 112,29 C126,30.5 135,27 150,29.5 C162,31 172,28 188,30 L210,32 L210,42 L-10,42 Z" fill="url(#hill-near)" />
        {/* Highlight on near hill crests */}
        <path d="M-10,37 C10,33 25,30 40,32 C52,33.5 60,28 75,30 C88,31.5 96,27 112,29 C126,30.5 135,27 150,29.5 C162,31 172,28 188,30" fill="none" stroke={isDark ? 'rgba(100,170,80,0.1)' : 'rgba(255,255,255,0.08)'} strokeWidth="0.5" />

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
            <g opacity={isDark ? 0.55 : 0.45}>
              <path d={trunks.join('')} stroke={isDark ? '#2a1a0e' : '#6a4a2a'} strokeWidth="0.5" fill="none" />
              <path d={canopies.join('')} fill={isDark ? '#122216' : '#3a7a38'} />
              <path d={fruits.join('')} fill={isDark ? '#b06810' : '#ea580c'} />
            </g>
          )
        })()}

        {/* Main field — soft top edge blends with hills */}
        <path d="M-5,36 Q20,39 50,37 Q80,35 100,37 Q130,39 160,36 Q185,38 205,37 L205,100 L-5,100 Z" fill="url(#field-g)" />

        {/* Field texture — subtle undulations */}
        <path d="M0,50 Q50,48 100,50 Q150,52 200,50" fill="none" stroke={isDark ? 'rgba(40,60,30,0.25)' : 'rgba(90,140,60,0.12)'} strokeWidth="0.4" />
        <path d="M0,62 Q40,60 80,62 Q120,64 160,62 Q180,60 200,62" fill="none" stroke={isDark ? 'rgba(40,60,30,0.2)' : 'rgba(90,140,60,0.1)'} strokeWidth="0.35" />
        <path d="M0,74 Q60,72 120,74 Q160,76 200,74" fill="none" stroke={isDark ? 'rgba(40,60,30,0.15)' : 'rgba(90,140,60,0.08)'} strokeWidth="0.3" />
        <path d="M0,86 Q50,84.5 100,86 Q150,87.5 200,86" fill="none" stroke={isDark ? 'rgba(40,60,30,0.12)' : 'rgba(90,140,60,0.06)'} strokeWidth="0.25" />

        {/* Tilled dirt columns — match tree columns, bend toward tree bases */}
        {Array.from({ length: tillCols }).map((_, ci) => {
          const colTrees = treeBases.filter(t => t.col === ci).sort((a, b) => a.y - b.y)
          const rng = seededRng(ci * 137 + 42)
          const steps = 12
          const points: string[] = []
          for (let s = 0; s <= steps; s++) {
            const t = s / steps
            const y = 40 + t * 57
            const depthT = t
            const pinch = (1 - depthT) * 18 - depthT * 4
            const trapL = colStart + pinch
            const trapR = colEnd - pinch
            let x = (tillCols === 1 ? 50 : trapL + ci * ((trapR - trapL) / Math.max(1, tillCols - 1))) * 2

            const nearby = colTrees.find(tb => Math.abs(tb.y - y) < 10)
            if (nearby) {
              const pull = (nearby.x * 2 - x) * 0.5
              x += pull
            }

            const wobble = (rng() - 0.5) * 0.8
            points.push(`${(x + wobble).toFixed(1)},${y.toFixed(1)}`)
          }
          const d = points.length > 1 ? `M${points[0]} ` + points.slice(1).map((p, i) => {
            if (i === 0) return `L${p}`
            const prev = points[i].split(',').map(Number)
            const curr = p.split(',').map(Number)
            const cpx = ((prev[0] + curr[0]) / 2).toFixed(1)
            return `Q${points[i]} ${p}`
          }).join(' ') : ''
          return (
            <g key={`till-${ci}`}>
              {/* Shadow/depth side */}
              <path d={d} fill="none" stroke={isDark ? '#1a1408' : '#5a4a30'} strokeWidth="3" opacity={isDark ? 0.18 : 0.1} strokeLinecap="round" strokeLinejoin="round" />
              {/* Main furrow */}
              <path d={d} fill="none" stroke={dirtColor} strokeWidth="1.8" opacity={isDark ? 0.35 : 0.22} strokeLinecap="round" strokeLinejoin="round" />
              {/* Ridge highlight */}
              <path d={d} fill="none" stroke={dirtLight} strokeWidth="0.5" opacity={isDark ? 0.15 : 0.1} strokeLinecap="round" transform="translate(-0.4, -0.3)" />
            </g>
          )
        })}

        {/* Dirt patches under each tree, varied but deterministic */}
        {treeBases.map((tb, idx) => {
          const rng = seededRng((idx + 1) * 983 + Math.round(tb.x * 17) + Math.round(tb.y * 29))
          const depthT = Math.max(0, Math.min(1, (tb.y - 40) / 57))
          const rowKey = Math.round(tb.y * 10) / 10
          const rowIdx = rowLevels.indexOf(rowKey)
          const nearRank = rowLevels.length - 1 - rowIdx
          const isOuter = tb.col === 0 || tb.col === tillCols - 1
          const outwardFactor = rowIdx === 0 ? 0.18 : rowIdx === 1 ? 0.12 : rowIdx === 2 ? 0.08 : 0
          const outwardDelta = (tb.x - 50) * outwardFactor
          const edgeOutward = isOuter ? (nearRank === 0 ? 2.9 : nearRank === 1 ? 2.0 : 0) : 0
          const edgeUpward = isOuter ? (nearRank === 0 ? 1.1 : nearRank === 1 ? 0.65 : 0) : 0
          const edgeDir = tb.x >= 50 ? 1 : -1
          const backInward = rowIdx === 0 ? 0.85 : rowIdx === 1 ? 0.5 : 0
          const cx = Math.max(4, Math.min(196, tb.x * 2 + outwardDelta + edgeDir * (edgeOutward - backInward)))
          const cy = Math.min(98, tb.y - 0.1 + depthT * 0.9 - edgeUpward)

          const rx = 2.3 + depthT * 3.2 + rng() * 1.6
          const ry = 0.65 + depthT * 1.25 + rng() * 0.45
          const tilt = (rng() - 0.5) * 20

          const p0 = `${(-1.05 * rx).toFixed(2)},${(0.05 * ry).toFixed(2)}`
          const c1 = `${(-0.85 * rx).toFixed(2)},${(-1.2 * ry).toFixed(2)}`
          const p1 = `${(-0.15 * rx).toFixed(2)},${(-1.05 * ry).toFixed(2)}`
          const c2 = `${(0.3 * rx).toFixed(2)},${(-1.45 * ry).toFixed(2)}`
          const p2 = `${(0.95 * rx).toFixed(2)},${(-0.15 * ry).toFixed(2)}`
          const c3 = `${(1.15 * rx).toFixed(2)},${(0.85 * ry).toFixed(2)}`
          const p3 = `${(0.3 * rx).toFixed(2)},${(1.15 * ry).toFixed(2)}`
          const c4 = `${(-0.55 * rx).toFixed(2)},${(1.25 * ry).toFixed(2)}`
          const d = `M${p0} Q${c1} ${p1} Q${c2} ${p2} Q${c3} ${p3} Q${c4} ${p0}Z`

          return (
            <g key={`dirt-patch-${idx}`} transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) rotate(${tilt.toFixed(1)})`}>
              <path d={d} fill={isDark ? '#1f160d' : '#5e4a31'} opacity={isDark ? 0.38 : 0.26} />
              <path d={d} fill="none" stroke={isDark ? '#3b2d1b' : '#8f754f'} strokeWidth="0.22" opacity={isDark ? 0.22 : 0.16} />
              <ellipse cx={-0.1 * rx} cy={-0.25 * ry} rx={0.42 * rx} ry={0.24 * ry} fill={isDark ? '#3a2a18' : '#a28761'} opacity={isDark ? 0.12 : 0.11} />
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
  juice, gems, xp, grove, notes, setGems,
}: OrchardViewProps) {

  const activeNotesForDefault = useMemo(() => notes.filter(n => !n.archived && !n.deletedAt), [notes])
  const [selectedNotebook, setSelectedNotebook] = useState<string>(activeNotesForDefault.length > 0 ? activeNotesForDefault[0].id : '_unassigned')
  const [plotPage, setPlotPage] = useState(0)
  useEffect(() => {
    setPlotPage(0)
  }, [selectedNotebook])

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
    setPlotPage(nextPlot - 1)
  }

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

  const baseSize = filteredTrees.length <= 6 ? 95 :
    filteredTrees.length <= 15 ? 85 :
    filteredTrees.length <= 30 ? 75 : 65

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
      onWheel={(e) => { if (e.ctrlKey || e.metaKey) e.preventDefault() }}
    >
      <style>{`@keyframes tree-pop { from { transform: translate(-50%,-85%) scale(0); opacity:0 } }`}</style>
      <div
        onClick={e => e.stopPropagation()}
        onWheel={(e) => { if (e.ctrlKey || e.metaKey) e.preventDefault() }}
        className="relative flex overflow-hidden"
        style={{
          width: "96vw", maxWidth: 1060, height: "92vh", maxHeight: 780,
          borderRadius: 18,
          boxShadow: isDark ? "0 30px 100px -20px rgba(0,0,0,0.8)" : "0 30px 100px -20px rgba(0,0,0,0.2)",
          border: `1px solid ${cardBorder}`,
        }}
      >
        {/* Notebook Sidebar */}
        <div className={`w-[200px] ${isDark ? "bg-[#060608] border-zinc-800/80" : "bg-[#ece8e5] border-zinc-200/70"} border-r flex flex-col shrink-0 z-30`}>
          {/* Sidebar header */}
          <div className="px-5 pt-6 pb-4">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-zinc-400"}`} style={{ fontFamily: 'var(--font-italiana)' }}>Orchard</p>
          </div>

          {/* Notebook list */}
          <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
            <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Notebooks</p>

            {activeNotes.map(note => {
              const count = notebookTreeCounts[note.id] || 0
              const isSelected = selectedNotebook === note.id
              const icon = note.icon || NOTE_TYPE_ICONS[note.noteType || 'notebook'] || '📓'

              return (
                <button
                  key={note.id}
                  onClick={() => setSelectedNotebook(note.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                      : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                  }`}
                >
                  <span className="text-[13px] shrink-0">{icon}</span>
                  <span className="flex-1 min-w-0 truncate">{note.subject || 'Untitled'}</span>
                  {count > 0 && (
                    <span className={`text-[9px] font-bold tabular-nums shrink-0 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{count}</span>
                  )}
                </button>
              )
            })}

            {/* Archived notebooks */}
            {archivedNotes.length > 0 && archivedNotes.some(n => (notebookTreeCounts[n.id] || 0) > 0) && (
              <>
                <div className={`${isDark ? "border-t border-zinc-800" : "border-t border-zinc-300/40"} pt-3 mt-3`}>
                  <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Archived</p>
                </div>
                {archivedNotes.filter(n => (notebookTreeCounts[n.id] || 0) > 0).map(note => {
                  const count = notebookTreeCounts[note.id] || 0
                  const isSelected = selectedNotebook === note.id
                  const icon = note.icon || NOTE_TYPE_ICONS[note.noteType || 'notebook'] || '📓'
                  return (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNotebook(note.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                          : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                      }`}
                      style={{ opacity: isSelected ? 1 : 0.7 }}
                    >
                      <span className="text-[13px] shrink-0">{icon}</span>
                      <span className="flex-1 min-w-0 truncate">{note.subject || 'Untitled'}</span>
                      {count > 0 && (
                        <span className={`text-[9px] font-bold tabular-nums shrink-0 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{count}</span>
                      )}
                    </button>
                  )
                })}
              </>
            )}

            {/* Unassigned trees */}
            {(notebookTreeCounts['_unassigned'] || 0) > 0 && (
              <>
                <div className={`${isDark ? "border-t border-zinc-800" : "border-t border-zinc-300/40"} pt-3 mt-3`}>
                  <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Other</p>
                </div>
                <button
                  onClick={() => setSelectedNotebook('_unassigned')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2.5 ${
                    selectedNotebook === '_unassigned'
                      ? isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                      : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                  }`}
                >
                  <span className="shrink-0 opacity-50"><LeafIcon size={13} /></span>
                  <span className="flex-1 min-w-0 truncate">Unassigned</span>
                  <span className={`text-[9px] font-bold tabular-nums shrink-0 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{notebookTreeCounts['_unassigned']}</span>
                </button>
              </>
            )}
          </nav>

          {/* Sidebar footer — stats */}
          <div className={`px-5 py-4 border-t ${isDark ? "border-zinc-800" : "border-zinc-200/60"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Level {lvl.level}</span>
              <span className={`text-[10px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{lvl.name}</span>
            </div>
            <div className="h-[2px] rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#d97706' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, lvl.progress * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <PulpIcon size={9} />
                <span className={`text-[9px] font-bold tabular-nums ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{juice}</span>
              </div>
              <div className="flex items-center gap-1">
                <GemIcon size={9} />
                <span className={`text-[9px] font-bold tabular-nums ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{gems}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main orchard area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Terrain isDark={isDark} treeCount={currentPlotTrees.length} treeBases={placed} />

          {/* Thin top bar */}
          <div className="relative z-20 flex items-center justify-between px-5 py-2 shrink-0" style={{
            background: isDark ? 'rgba(14,22,12,0.8)' : 'rgba(120,160,90,0.7)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${cardBorder}`,
          }}>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold" style={{ color: textPrimary }}>
                {selectedNotebook === '_unassigned' ? 'Unassigned' :
                 [...activeNotes, ...notes.filter(n => n.archived)].find(n => n.id === selectedNotebook)?.subject || 'Untitled'}
              </span>
              <span className="text-[10px] font-medium tabular-nums" style={{ color: textMuted }}>
                {filteredTrees.length} {filteredTrees.length === 1 ? 'tree' : 'trees'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {(filteredTrees.length > TREES_PER_PLOT || nbUnlocked > 1) && (
                <div className="flex items-center gap-2 mr-4 rounded-lg px-2 py-1" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }}>
                  <button onClick={() => setPlotPage(p => Math.max(0, p - 1))} disabled={plotPage === 0} className="p-0.5 disabled:opacity-30 hover:opacity-100 opacity-70 transition-opacity" style={{ color: textPrimary }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="text-[10px] tabular-nums font-bold uppercase tracking-widest" style={{ color: textSecondary }}>
                    Plot {plotPage + 1} <span className="opacity-50">/ {nbUnlocked}</span>
                  </span>
                  {plotPage + 1 < nbUnlocked ? (
                    <button onClick={() => setPlotPage(p => Math.min(nbUnlocked - 1, p + 1))} className="p-0.5 hover:opacity-100 opacity-70 transition-opacity" style={{ color: textPrimary }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  ) : nbUnlocked < MAX_PLOTS ? (
                    <button
                      onClick={unlockNextPlot}
                      disabled={gems < (PLOT_COST[nbUnlocked] || 0)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                      style={{ color: '#d97706', backgroundColor: isDark ? 'rgba(217,119,6,0.1)' : 'rgba(217,119,6,0.08)' }}
                      title={`Unlock plot ${nbUnlocked + 1} for ${PLOT_COST[nbUnlocked]} gems`}
                    >
                      <GemIcon size={9} /> {PLOT_COST[nbUnlocked]}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </button>
                  ) : (
                    <span className="p-0.5 opacity-30" style={{ color: textPrimary }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </span>
                  )}
                </div>
              )}
              {RARITY_ORDER.filter(r => rarityCounts[r] && r !== 'common').map(r => (
                <span key={r} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RARITY_META[r].color }} />
                  <span className="text-[9px] tabular-nums" style={{ color: RARITY_META[r].color }}>{rarityCounts[r]}</span>
                </span>
              ))}
              <button onClick={onClose} className="ml-2 p-1.5 rounded-full transition-colors" style={{ color: textMuted }} onMouseEnter={e => e.currentTarget.style.color = textPrimary} onMouseLeave={e => e.currentTarget.style.color = textMuted}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Orchard scene */}
          <div className="flex-1 relative overflow-hidden" style={{
            perspective: '800px',
          }}>
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
                    <span className="text-[32px]">🌱</span>
                    <p className="text-[12px]" style={{ color: textMuted }}>
                      {selectedNotebook === null ? 'Your orchard is empty.' :
                       selectedNotebook === '_unassigned' ? 'No unassigned trees.' :
                       'No trees grown for this notebook yet.'}
                    </p>
                    <p className="text-[10px]" style={{ color: textMuted }}>
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
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: `translate(-50%, -85%) scaleY(${scaleY.toFixed(3)}) skewX(${skewX.toFixed(1)}deg)`,
                            transformOrigin: 'center bottom',
                            zIndex: Math.round(y),
                            animation: `tree-pop 0.2s ease-out ${renderIdx * 15}ms both`,
                          }}
                        >
                          <div className={tree.stage >= 3 ? getRarityPlantClass(tree.type) : ''} style={{ filter: dimAmount > 2 ? `brightness(${100 - dimAmount}%)` : undefined }}>
                            <PlantIcon type={tree.type} size={treeSize} stage={tree.stage} hideGround />
                          </div>

                          <div className="mt-0.5 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ zIndex: 300 }}>
                            <div className="px-2.5 py-1.5 rounded-lg" style={{
                              backgroundColor: isDark ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.94)',
                              backdropFilter: 'blur(10px)',
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
        </div>
      </div>
    </div>
  )
})
