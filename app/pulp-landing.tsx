"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { PlantIcon } from "./components/PlantIcon"
import { LandingTerrain } from "./components/LandingTerrain"

const SHOWCASE_TREES = [
  { type: 'tangerine', name: 'tangerine', rarity: 'default' },
  { type: 'lemon', name: 'lemon', rarity: 'common' },
  { type: 'apple', name: 'apple', rarity: 'uncommon' },
  { type: 'peach', name: 'peach', rarity: 'rare' },
  { type: 'pineapple', name: 'pineapple', rarity: 'rare' },
  { type: 'passionfruit', name: 'passionfruit', rarity: 'rare' },

  { type: 'sakura', name: 'sakura', rarity: 'sacred' },
  { type: 'abyss', name: 'abyss maw', rarity: 'sacred' },
]

const FEATURES = [
  { label: 'focus timer', desc: 'pomodoro sessions that grow trees as you write. stay focused, watch your orchard grow.', icon: '⏱' },
  { label: 'living orchard', desc: 'every notebook grows its own orchard — harvest sap and cut trees for paper.', icon: '🌳' },
  { label: 'site blocker', desc: 'when the timer is running, distracting sites are blocked. no willpower required — just focus.', icon: '🚫' },
  { label: 'notebooks', desc: 'multiple types — standard, single page, cornell, and encrypted vaults.', icon: '📓' },
  { label: 'achievements', desc: 'unlock milestones as you write. earn sap, gems, and xp to level up.', icon: '🏆' },
  { label: 'seed shop', desc: 'spend sap on seeds. grow fruit trees, lumber trees, and rare gem-producing trees.', icon: '🌱' },
]

function AnimatedCounter({ target, suffix = '', delay = 0 }: { target: number, suffix?: string, delay?: number }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); obs.disconnect() }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const t = setTimeout(() => {
      const duration = 1500
      const steps = 30
      const inc = target / steps
      let current = 0
      const interval = setInterval(() => {
        current += inc
        if (current >= target) { setCount(target); clearInterval(interval) }
        else setCount(Math.floor(current))
      }, duration / steps)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(t)
  }, [started, target, delay])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

const RARITY_COLOR: Record<string, string> = {
  default: '#d97706',
  common: '#a1a1aa',
  uncommon: '#34d399',
  rare: '#60a5fa',
  sacred: '#c4a6ff',
}

function TypewriterHeadline({ serif, onComplete }: { serif: string, onComplete?: () => void }) {
  const text = "grow while you write."
  const [charIdx, setCharIdx] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (charIdx >= text.length) {
      const t = setTimeout(() => { setShowCursor(false); onComplete?.() }, 800)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCharIdx(i => i + 1), 55)
    return () => clearTimeout(t)
  }, [charIdx, text.length])

  const cursorEl = showCursor ? (
    <span style={{ display: 'inline-block', width: 3, height: '0.75em', background: '#d97706', marginLeft: 2, verticalAlign: 'baseline', animation: 'cursorBlink 0.5s step-end infinite' }} />
  ) : null

  return (
    <h1 style={{
      fontFamily: serif, fontSize: 'clamp(2.4rem, 6vw, 5rem)', fontWeight: 400,
      lineHeight: 1, letterSpacing: '-0.03em', textTransform: 'lowercase' as const,
      color: '#0f0f10', margin: '0 0 0 0', whiteSpace: 'nowrap',
    }}>
      {text.slice(0, charIdx)}
      {cursorEl}
      <style>{`@keyframes cursorBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </h1>
  )
}

const ORCHARD_TREES = [
  { type: 'tangerine', x: 12, y: 0, delay: 0.3 },
  { type: 'sakura', x: 28, y: 4, delay: 1.0 },
  { type: 'birch', x: 44, y: -2, delay: 0.6 },
  { type: 'apple', x: 62, y: 3, delay: 1.4 },
  { type: 'abyss', x: 78, y: -1, delay: 1.8 },
  { type: 'peach', x: 92, y: 5, delay: 2.2 },
] as const

function DemoOrchard({ fullscreen = false }: { fullscreen?: boolean }) {
  const [growStages, setGrowStages] = useState<number[]>(ORCHARD_TREES.map(() => -1))

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    ORCHARD_TREES.forEach((tree, i) => {
      for (let s = 0; s <= 4; s++) {
        timers.push(setTimeout(() => {
          setGrowStages(prev => { const next = [...prev]; next[i] = s; return next })
        }, (tree.delay + s * 0.7) * 1000))
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      width: fullscreen ? '100%' : 480,
      height: fullscreen ? '100%' : 320,
      position: fullscreen ? 'absolute' : 'relative',
      inset: fullscreen ? 0 : undefined,
      userSelect: 'none', overflow: 'hidden',
      borderRadius: fullscreen ? 0 : 16,
    }}>
      <style>{`
        @keyframes cloudDrift { 0% { transform: translateX(-10%) } 100% { transform: translateX(110%) } }
        @keyframes treeGrow { 0% { transform: scale(0) translateY(8px); opacity: 0 } 100% { transform: scale(1) translateY(0); opacity: 1 } }
        @keyframes sapFloat { 0% { opacity: 0; transform: translateY(0) } 20% { opacity: 1 } 100% { opacity: 0; transform: translateY(-24px) } }
      `}</style>

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 -4 200 104" preserveAspectRatio={fullscreen ? 'xMidYMid slice' : 'xMidYMid slice'}>
        <defs>
          <linearGradient id="orc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#87aacc" />
            <stop offset="20%" stopColor="#9dbdcc" />
            <stop offset="40%" stopColor="#b8ccbb" />
            <stop offset="60%" stopColor="#c8d8b8" />
            <stop offset="80%" stopColor="#d4debb" />
            <stop offset="100%" stopColor="#dae4c0" />
          </linearGradient>
          <linearGradient id="orc-hill-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a6858" />
            <stop offset="60%" stopColor="#4a5848" />
            <stop offset="100%" stopColor="#3a4838" />
          </linearGradient>
          <linearGradient id="orc-mtn-snow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8e8e0" />
            <stop offset="100%" stopColor="#a0a898" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orc-hill-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a6a3a" />
            <stop offset="100%" stopColor="#3e5e30" />
          </linearGradient>
          <linearGradient id="orc-hill-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#507840" />
            <stop offset="100%" stopColor="#446a34" />
          </linearGradient>
          <linearGradient id="orc-field" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a7a48" />
            <stop offset="30%" stopColor="#527242" />
            <stop offset="70%" stopColor="#4e6e3e" />
            <stop offset="100%" stopColor="#4a6838" />
          </linearGradient>
          <radialGradient id="orc-haze-1" cx="25%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#b8c8e8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#b8c8e8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orc-haze-2" cx="72%" cy="28%" r="40%">
            <stop offset="0%" stopColor="#c8b8d8" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#c8b8d8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="orc-horizon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8d8b8" stopOpacity="0" />
            <stop offset="60%" stopColor="#c8d8b8" stopOpacity="0" />
            <stop offset="85%" stopColor="#c8d8b8" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#c8d8b8" stopOpacity="0.15" />
          </linearGradient>
          <radialGradient id="orc-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd080" stopOpacity="1" />
            <stop offset="20%" stopColor="#ffd080" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#ffd080" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffd080" stopOpacity="0" />
          </radialGradient>
          <pattern id="orc-brick" width="2.4" height="1.2" patternUnits="userSpaceOnUse">
            <rect width="2.4" height="1.2" fill="#8a6a48" />
            <rect x="0" y="0" width="1.1" height="0.5" rx="0.05" fill="#9a7a55" />
            <rect x="1.3" y="0" width="1.1" height="0.5" rx="0.05" fill="#927252" />
            <rect x="0.6" y="0.6" width="1.1" height="0.5" rx="0.05" fill="#967656" />
          </pattern>
        </defs>

        {/* Sky */}
        <rect x="-10" y="-4" width="220" height="108" fill="url(#orc-sky)" />
        <rect x="-10" y="-4" width="220" height="44" fill="url(#orc-haze-1)" />
        <rect x="-10" y="-4" width="220" height="44" fill="url(#orc-haze-2)" />
        <rect x="-10" y="-4" width="220" height="44" fill="url(#orc-horizon)" />

        {/* Sun */}
        <ellipse cx="85" cy="-2" rx="8" ry="8" fill="url(#orc-sun-glow)" />
        <ellipse cx="85" cy="-2" rx="3" ry="3" fill="#ffd080" />
        <ellipse cx="85" cy="-2" rx="1.8" ry="1.8" fill="#fff4d0" />

        {/* Distant cliff hills */}
        <path d="M-10,24 L-5,22 L2,6 L6,5 L10,8 L14,4 L18,6 L22,18 L28,16 L32,8 L36,6 L38,9 L42,22 L48,20 L52,14 L56,6 L60,4 L62,7 L66,18 L72,22 L80,20 L86,16 L90,12 L94,14 L100,20 L106,18 L110,8 L114,5 L116,3 L120,6 L124,16 L130,22 L138,18 L144,10 L148,6 L152,8 L156,14 L160,20 L168,22 L176,16 L180,10 L184,12 L190,20 L196,18 L200,14 L204,16 L210,22 L210,34 L-10,34 Z" fill="#8898a8" opacity="0.25" />

        {/* Mountain range — 3 layers */}
        <path d="M-10,28 L5,18 L15,22 L25,10 L35,16 L42,8 L52,14 L60,6 L72,12 L82,4 L92,10 L100,2 L110,8 L118,12 L126,5 L136,10 L145,16 L152,9 L162,14 L170,20 L180,14 L190,18 L195,12 L205,20 L210,28 L210,34 L-10,34 Z" fill="url(#orc-hill-far)" opacity="0.5" />
        <path d="M-10,30 L8,22 L20,26 L32,15 L45,20 L55,12 L68,18 L78,8 L88,16 L98,6 L108,14 L118,18 L128,10 L140,16 L150,22 L160,14 L172,20 L182,24 L192,18 L202,24 L210,30 L210,34 L-10,34 Z" fill="#3a4838" opacity="0.6" />

        {/* Snow caps */}
        <path d="M25,10 L22,16 L28,16 Z" fill="url(#orc-mtn-snow)" />
        <path d="M42,8 L39,14 L45,14 Z" fill="url(#orc-mtn-snow)" />
        <path d="M60,6 L56,13 L64,13 Z" fill="url(#orc-mtn-snow)" />
        <path d="M82,4 L78,12 L86,12 Z" fill="url(#orc-mtn-snow)" />
        <path d="M100,2 L96,10 L104,10 Z" fill="url(#orc-mtn-snow)" />
        <path d="M126,5 L122,13 L130,13 Z" fill="url(#orc-mtn-snow)" />

        {/* Extra rolling hills */}
        <path d="M-10,33 C-5,31 5,26 15,23 C22,21 28,22 35,26 C42,30 50,32 58,30 C64,28 68,25 72,23 C78,22 85,24 90,28 C95,31 100,33 110,34 L210,36 L210,42 L-10,42 Z" fill="#3e5e30" />

        {/* Back hill — broad dome */}
        <path d="M-10,36 C10,34 40,30 70,26 C90,22 115,19 140,19 C160,20 180,23 200,26 C205,27 208,28 210,29 L210,42 L-10,42 Z" fill="url(#orc-hill-mid)" />
        <path d="M-10,36 C10,34 40,30 70,26 C90,22 115,19 140,19 C160,20 180,23 200,26" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
        <path d="M-10,39 C10,38 40,36 70,33 C90,30 115,28 140,28 C160,29 180,31 200,33 L210,35 L210,42 L-10,42 Z" fill="rgba(0,0,0,0.06)" />

        {/* Winding path on hills */}
        {(() => {
          const mainD = "M-5,36.5 Q10,34.5 25,32 Q35,30 45,29 Q55,28 65,27.5 Q80,25.5 95,23.5 Q110,21.5 125,20.5 Q140,20 155,20 Q165,20.5 175,22.5 Q185,24.5 200,27.5"
          const branchD = "M65,32 Q70,34 75,36 Q80,37 90,38 Q100,38.5 115,39"
          return <g>
            <path d={mainD} fill="none" stroke="#6a5030" strokeWidth="0.6" strokeLinecap="round" opacity="0.08" />
            <path d={mainD} fill="none" stroke="#8a7050" strokeWidth="0.35" strokeLinecap="round" opacity="0.14" />
            <path d={branchD} fill="none" stroke="#6a5030" strokeWidth="0.5" strokeLinecap="round" opacity="0.06" />
            <path d={branchD} fill="none" stroke="#8a7050" strokeWidth="0.25" strokeLinecap="round" opacity="0.12" />
          </g>
        })()}

        {/* Lake on back hill */}
        {(() => {
          const cx = 30, cy = 33
          const shorePath = `M${cx - 10},${cy + 0.5} Q${cx - 8},${cy - 2.5} ${cx - 3},${cy - 2.8} Q${cx + 2},${cy - 3} ${cx + 6},${cy - 2} Q${cx + 9},${cy - 1} ${cx + 10},${cy + 0.8} Q${cx + 8},${cy + 2.5} ${cx + 4},${cy + 3} Q${cx - 1},${cy + 3.5} ${cx - 5},${cy + 2.8} Q${cx - 9},${cy + 2} ${cx - 10},${cy + 0.5}Z`
          const waterPath = `M${cx - 8.5},${cy + 0.3} Q${cx - 7},${cy - 2} ${cx - 2.5},${cy - 2.3} Q${cx + 2},${cy - 2.5} ${cx + 5},${cy - 1.5} Q${cx + 7.5},${cy - 0.5} ${cx + 8.5},${cy + 0.6} Q${cx + 7},${cy + 2} ${cx + 3.5},${cy + 2.5} Q${cx - 1},${cy + 3} ${cx - 4.5},${cy + 2.3} Q${cx - 7.5},${cy + 1.5} ${cx - 8.5},${cy + 0.3}Z`
          return <g>
            <path d={shorePath} fill="#6a8a5a" opacity="0.25" />
            <path d={waterPath} fill="#5a8ab0" opacity="0.45" />
            <path d={`M${cx - 5},${cy} Q${cx},${cy - 0.5} ${cx + 5},${cy}`} stroke="rgba(255,255,255,0.25)" strokeWidth="0.12" fill="none" />
            <path d={`M${cx - 3},${cy + 1} Q${cx},${cy + 0.5} ${cx + 3},${cy + 1}`} stroke="rgba(255,255,255,0.15)" strokeWidth="0.1" fill="none" />
          </g>
        })()}

        {/* Distant orange grove on mid-hill */}
        {(() => {
          const trunks: string[] = [], canopies: string[] = [], fruits: string[] = []
          const getHillY = (x: number) => {
            if (x < 70) return 36 - (x + 10) * 10 / 80
            if (x < 140) return 26 - (x - 70) * 7 / 70
            return 19 + (x - 140) * 10 / 70
          }
          for (let i = 0; i < 60; i++) {
            const seed = ((i * 71 + 303) * 16807 + 12345) % 2147483647
            const r = () => { let s = seed + i * 1000; s = ((s * 16807) % 2147483647); return (s & 0x7fffffff) / 2147483647 }
            const x = -5 + (i / 60) * 215
            const baseY = getHillY(x) + (r() * 3 + 1.5)
            const sz = 0.4 + r() * 0.5
            const cy = baseY - sz * 1.3
            const lean = (r() - 0.5) * 0.2
            const tx = x + lean
            trunks.push(`M${x.toFixed(1)},${baseY.toFixed(1)}L${tx.toFixed(1)},${(cy + sz * 0.3).toFixed(1)}`)
            const r1 = sz * 0.9, r2 = sz * 0.7
            canopies.push(`M${(tx - r1).toFixed(1)},${cy.toFixed(1)}A${r1.toFixed(1)},${r2.toFixed(1)} 0 1 1 ${(tx + r1).toFixed(1)},${cy.toFixed(1)}A${r1.toFixed(1)},${r2.toFixed(1)} 0 1 1 ${(tx - r1).toFixed(1)},${cy.toFixed(1)}Z`)
            for (let f = 0; f < 4; f++) {
              const a = f * Math.PI / 2 + i * 0.7
              const fx = tx + Math.cos(a) * r1 * 0.5, fy = cy + Math.sin(a) * r2 * 0.5
              fruits.push(`M${(fx + 0.06).toFixed(2)},${fy.toFixed(2)}a0.06,0.06 0 1 1 -0.12,0a0.06,0.06 0 1 1 0.12,0Z`)
            }
          }
          return <g opacity="0.45">
            <path d={trunks.join('')} stroke="#5a3a1a" strokeWidth="0.3" fill="none" />
            <path d={canopies.join('')} fill="#2e5a2c" />
            <path d={fruits.join('')} fill="#d97706" opacity="0.7" />
          </g>
        })()}

        {/* House 1 — cottage */}
        <g transform="translate(90,28) scale(0.4) translate(-90,-28)">
          <path d="M87.8,28.1 L88,26.2 L91.5,26.2 L91.7,28.1 Z" fill="#b0987a" />
          <path d="M91.5,26.2 L92.8,26.6 L92.9,28.1 L91.7,28.1 Z" fill="#968060" />
          <rect x="88.6" y="26.7" width="0.7" height="0.7" rx="0.08" fill="#d4b870" opacity="0.6" />
          <rect x="90.8" y="26.8" width="0.6" height="1.3" rx="0.08" fill="#5a4028" />
          <polygon points="87.3,26.4 93.2,26.4 89.8,24.2" fill="#7a5838" />
          <polygon points="89.8,24.2 93.2,26.4 89.8,26.4" fill="#6a4a30" />
          <rect x="88.3" y="24.4" width="0.6" height="1.8" fill="#8a8a90" />
          <g opacity="0.25">
            <ellipse cx="88.6" cy="23" rx="0.45" ry="0.25" fill="#b5b5b8" />
            <ellipse cx="88.5" cy="21.5" rx="0.6" ry="0.2" fill="#b5b5b8" opacity="0.15" />
          </g>
        </g>

        {/* House 2 — tower */}
        <g transform="translate(131,24) scale(0.4) translate(-131,-24)">
          <path d="M129.8,24.4 L129.9,22 L132,22 L132.1,24.4 Z" fill="#a89070" />
          <path d="M132,22 L132.8,22.3 L132.9,24.4 L132.1,24.4 Z" fill="#8a7458" />
          <rect x="130.4" y="22.5" width="0.5" height="0.5" rx="0.06" fill="#c8b068" opacity="0.5" />
          <path d="M130.8,24.4 L130.8,23.5 A0.4,0.4 0 0 1 131.6,23.5 L131.6,24.4 Z" fill="#4a3220" />
          <polygon points="129.3,22 132.2,22 130.95,20" fill="#6a4e30" />
        </g>

        {/* House 3 — barn */}
        <g transform="translate(173,26) scale(0.4) translate(-173,-26)">
          <path d="M170.5,26.3 L170.6,25.1 L175.2,25.1 L175.3,26.3 Z" fill="#988060" />
          <rect x="172" y="25.4" width="1.2" height="0.9" fill="#4a3018" />
          <polygon points="170,25.3 175.8,25.3 172.9,23.8" fill="#6a4a2e" />
          <rect x="174.2" y="22.8" width="0.7" height="2.3" fill="#8a8a90" />
          <g opacity="0.35">
            <ellipse cx="174.5" cy="21.5" rx="0.5" ry="0.3" fill="#b5b5b8" />
          </g>
        </g>

        {/* Front hill */}
        <path d="M-10,34 C0,32 15,29 35,27 C50,26 60,27 75,30 C90,33 110,36 140,38 C165,38 190,38 210,38 L210,100 L-10,100 Z" fill="url(#orc-hill-near)" />
        <path d="M-10,34 C0,32 15,29 35,27 C50,26 60,27 75,30 C90,33 110,36 140,38" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.3" />
        <path d="M-10,37 C0,36 15,34 35,33 C50,32 60,33 75,35 C90,37 110,39 140,40 L210,40 L210,100 L-10,100 Z" fill="rgba(0,0,0,0.05)" />

        {/* Front hill trees */}
        {(() => {
          const trunks: string[] = [], canopies: string[] = [], fruits: string[] = []
          const getFrontY = (x: number) => {
            if (x < 35) return 34 - (x + 10) * 7 / 45
            if (x < 75) return 27 + (x - 35) * 3 / 40
            return 30 + (x - 75) * 8 / 65
          }
          const seeds = [1,8,15,22,28,35,42,48,55,62,68,75,82,88,95]
          seeds.forEach((bx, i) => {
            const sz = 0.9 + (i % 3) * 0.4
            const by = getFrontY(bx) + 0.3
            const th = sz * 1.3
            const cy = by - th
            const lean = ((i * 17) % 7 - 3) * 0.08
            const tx = bx + lean
            trunks.push(`M${bx.toFixed(1)},${by.toFixed(1)}L${tx.toFixed(1)},${(cy + sz * 0.25).toFixed(1)}`)
            const r1 = sz * 0.95, r2 = sz * 0.7
            canopies.push(`M${(tx - r1).toFixed(1)},${cy.toFixed(1)}A${r1.toFixed(1)},${r2.toFixed(1)} 0 1 1 ${(tx + r1).toFixed(1)},${cy.toFixed(1)}A${r1.toFixed(1)},${r2.toFixed(1)} 0 1 1 ${(tx - r1).toFixed(1)},${cy.toFixed(1)}Z`)
            for (let f = 0; f < 5; f++) {
              const a = f * Math.PI * 0.4 + i * 1.1
              const fx = tx + Math.cos(a) * r1 * 0.5, fy = cy + Math.sin(a) * r2 * 0.5
              fruits.push(`M${(fx + 0.12).toFixed(2)},${fy.toFixed(2)}a0.12,0.12 0 1 1 -0.24,0a0.12,0.12 0 1 1 0.24,0Z`)
            }
          })
          return <g opacity="0.5">
            <path d={trunks.join('')} stroke="#5a3a1a" strokeWidth="0.35" fill="none" />
            <path d={canopies.join('')} fill="#3e7236" />
            <path d={fruits.join('')} fill="#d97706" opacity="0.65" />
          </g>
        })()}

        {/* Front dirt path */}
        <path d="M -5,35 C 5,33 12,30 22,28.5 C 30,27.5 38,27 45,27.5 C 55,28 62,29 72,31 C 82,33.5 90,36 100,37.5" fill="none" stroke="#6a5030" strokeWidth="0.5" strokeLinecap="round" opacity="0.08" />
        <path d="M -5,35 C 5,33 12,30 22,28.5 C 30,27.5 38,27 45,27.5 C 55,28 62,29 72,31 C 82,33.5 90,36 100,37.5" fill="none" stroke="#8a7050" strokeWidth="0.3" strokeLinecap="round" opacity="0.14" />

        {/* Main field */}
        <path d="M-10,38 Q50,36 100,37 Q150,38 210,38 L210,100 L-10,100 Z" fill="url(#orc-field)" />

        {/* Main road */}
        <path d="M60,100 Q65,80 58,65 Q50,52 55,42" stroke="#8a7a5a" strokeWidth="2.5" fill="none" opacity="0.15" strokeLinecap="round" />
        <path d="M60,100 Q65,80 58,65 Q50,52 55,42" stroke="#a09070" strokeWidth="0.4" fill="none" opacity="0.12" strokeDasharray="1 2" />
        <path d="M58,65 Q70,60 85,62" stroke="#8a7a5a" strokeWidth="1.5" fill="none" opacity="0.1" strokeLinecap="round" />

        {/* Lower lake */}
        <ellipse cx="160" cy="65" rx="18" ry="7" fill="#5a8ab0" opacity="0.35" />
        <ellipse cx="160" cy="64" rx="14" ry="5" fill="#6a9aaa" opacity="0.2" />
        <path d="M150,65 Q160,63 170,65" stroke="rgba(255,255,255,0.2)" strokeWidth="0.15" fill="none" />
        <path d="M145,62 Q144,59 145,56" stroke="#5a7a48" strokeWidth="0.3" fill="none" opacity="0.4" />
        <path d="M176,63 Q177,60 175,57" stroke="#5a7a48" strokeWidth="0.25" fill="none" opacity="0.35" />

        {/* Grass tufts on field */}
        {[15,35,55,80,105,125,145,175,190].map((gx, i) => (
          <g key={i} opacity={0.3}>
            <path d={`M${gx},${48 + (i % 3) * 8} q-0.5,-1.5 0,-2.5 M${gx},${48 + (i % 3) * 8} q0.5,-1.2 0.8,-2.2`} stroke="#6a8a50" strokeWidth="0.2" fill="none" />
          </g>
        ))}

        {/* Wildflowers */}
        {[20,40,70,90,120,140,170,185].map((fx, i) => (
          <circle key={i} cx={fx} cy={45 + (i % 4) * 6} r={0.15} fill="#e08010" opacity="0.3" />
        ))}

        {/* Windmills on mountain slopes */}
        {[
          { x: 30, baseY: 26, h: 8, bladeR: 3.2 },
          { x: 160, baseY: 22, h: 8.5, bladeR: 3.3 },
        ].map((m, i) => {
          const topY = m.baseY - m.h
          const phase = (i * 127 + 331) % 360
          return <g key={i} opacity={0.6}>
            <path d={`M${m.x - 0.5},${m.baseY} L${m.x - 0.3},${topY + 1} L${m.x + 0.3},${topY + 1} L${m.x + 0.5},${m.baseY}Z`} fill="#b0a898" />
            <circle cx={m.x} cy={topY + 1} r="0.45" fill="#988a78" />
            <g>
              <animateTransform attributeName="transform" type="rotate" from={`0 ${m.x} ${topY + 1}`} to={`360 ${m.x} ${topY + 1}`} dur={`${18 + i * 4}s`} repeatCount="indefinite" />
              {[0, 1, 2, 3].map(b => {
                const ang = (phase + b * 90) * Math.PI / 180
                const ex = m.x + Math.cos(ang) * m.bladeR
                const ey = topY + 1 + Math.sin(ang) * m.bladeR
                const px = m.x + Math.cos(ang + 0.12) * m.bladeR * 0.35
                const py = topY + 1 + Math.sin(ang + 0.12) * m.bladeR * 0.35
                return <path key={b} d={`M${m.x},${topY + 1} L${px.toFixed(1)},${py.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}Z`} fill={b % 2 === 0 ? '#d8d0c8' : '#c0b8a8'} />
              })}
            </g>
          </g>
        })}

        {/* Foreground windmill */}
        {(() => {
          const wmX = 178, wmY = 44, sc = 0.95
          const bw = 3.5 * sc, tw = 1.5 * sc, h = 14 * sc
          const hubY = wmY + 1.5 * sc, bladeLen = 7 * sc
          return <g>
            <path d={`M${wmX - bw},${wmY + h} C${wmX - bw},${wmY + h * 0.6} ${wmX - tw},${wmY + h * 0.2} ${wmX - tw},${wmY + sc * 2} L${wmX + tw},${wmY + sc * 2} C${wmX + tw},${wmY + h * 0.2} ${wmX + bw},${wmY + h * 0.6} ${wmX + bw},${wmY + h} Z`} fill="url(#orc-brick)" />
            <circle cx={wmX} cy={wmY + h * 0.4} r={1 * sc} fill="#4a3a28" />
            <path d={`M${wmX - 1 * sc},${wmY + h} L${wmX - 1 * sc},${wmY + h - 2.2 * sc} A${1 * sc},${1 * sc} 0 0 1 ${wmX + 1 * sc},${wmY + h - 2.2 * sc} L${wmX + 1 * sc},${wmY + h} Z`} fill="#3a2a1a" />
            <polygon points={`${wmX - tw - 0.8 * sc},${wmY + sc * 2} ${wmX + tw + 0.8 * sc},${wmY + sc * 2} ${wmX},${wmY - 1 * sc}`} fill="#5a4a32" />
            <circle cx={wmX} cy={hubY} r={1.4 * sc} fill="#7a6a52" />
            <circle cx={wmX} cy={hubY} r={0.5 * sc} fill="#5a4a32" />
            <g>
              <animateTransform attributeName="transform" type="rotate" from={`0 ${wmX} ${hubY}`} to={`360 ${wmX} ${hubY}`} dur="25s" repeatCount="indefinite" />
              {[0, 90, 180, 270].map(angle => (
                <g key={angle} transform={`rotate(${angle} ${wmX} ${hubY})`}>
                  <polygon points={`${wmX - 0.4 * sc},${hubY} ${wmX + 0.4 * sc},${hubY} ${wmX + 1 * sc},${hubY - bladeLen} ${wmX - 0.15 * sc},${hubY - bladeLen}`} fill="#8a7a66" opacity="0.8" />
                </g>
              ))}
            </g>
          </g>
        })()}

        {/* Second foreground windmill */}
        {(() => {
          const wmX = 194, wmY = 42, sc = 0.75
          const bw = 3.5 * sc, tw = 1.5 * sc, h = 14 * sc
          const hubY = wmY + 1.5 * sc, bladeLen = 7 * sc
          return <g>
            <path d={`M${wmX - bw},${wmY + h} C${wmX - bw},${wmY + h * 0.6} ${wmX - tw},${wmY + h * 0.2} ${wmX - tw},${wmY + sc * 2} L${wmX + tw},${wmY + sc * 2} C${wmX + tw},${wmY + h * 0.2} ${wmX + bw},${wmY + h * 0.6} ${wmX + bw},${wmY + h} Z`} fill="url(#orc-brick)" />
            <polygon points={`${wmX - tw - 0.8 * sc},${wmY + sc * 2} ${wmX + tw + 0.8 * sc},${wmY + sc * 2} ${wmX},${wmY - 1 * sc}`} fill="#5a4a32" />
            <circle cx={wmX} cy={hubY} r={1.4 * sc} fill="#7a6a52" />
            <circle cx={wmX} cy={hubY} r={0.5 * sc} fill="#5a4a32" />
            <g>
              <animateTransform attributeName="transform" type="rotate" from={`0 ${wmX} ${hubY}`} to={`-360 ${wmX} ${hubY}`} dur="32s" repeatCount="indefinite" />
              {[0, 90, 180, 270].map(angle => (
                <g key={angle} transform={`rotate(${angle} ${wmX} ${hubY})`}>
                  <polygon points={`${wmX - 0.4 * sc},${hubY} ${wmX + 0.4 * sc},${hubY} ${wmX + 1 * sc},${hubY - bladeLen} ${wmX - 0.15 * sc},${hubY - bladeLen}`} fill="#8a7a66" opacity="0.8" />
                </g>
              ))}
            </g>
          </g>
        })()}
      </svg>

      {/* Clouds */}
      {[
        { y: '6%', s: 1, d: 45 },
        { y: '12%', s: 0.7, d: 55 },
        { y: '3%', s: 0.55, d: 38 },
        { y: '18%', s: 0.85, d: 60 },
        { y: '8%', s: 0.4, d: 50 },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', top: c.y, left: 0, width: '100%',
          opacity: 0.3, animation: `cloudDrift ${c.d}s linear infinite`,
          animationDelay: `${-i * 11}s`, pointerEvents: 'none',
        }}>
          <svg width={fullscreen ? '8%' : 65 * c.s} height={fullscreen ? '4%' : 22 * c.s} viewBox="0 0 65 22" style={{ marginLeft: `${i * 15}%` }}>
            <ellipse cx="32" cy="13" rx="30" ry="8" fill="white" />
            <ellipse cx="22" cy="11" rx="17" ry="9" fill="white" />
            <ellipse cx="44" cy="11" rx="19" ry="7" fill="white" />
          </svg>
        </div>
      ))}

      {/* Trees growing on field — hero widget only */}
      {!fullscreen && ORCHARD_TREES.map((tree, i) => {
        const stage = growStages[i]
        if (stage < 0) return null
        const size = stage === 0 ? 24 : 32 + stage * 9
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${tree.x}%`,
            bottom: 58 + tree.y,
            transform: 'translateX(-50%)',
            animation: 'treeGrow 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            zIndex: 10 + i,
          }}>
            {stage === 0 ? (
              <PlantIcon type={tree.type} size={size} isSeed hideGround />
            ) : (
              <PlantIcon type={tree.type} size={size} stage={Math.min(stage - 1, 3)} hideGround />
            )}
            {stage >= 4 && (
              <div style={{
                position: 'absolute', top: -6, left: '50%', marginLeft: -5,
                animation: 'sapFloat 2.5s ease-out infinite',
                animationDelay: `${i * 0.5}s`,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24">
                  <path d="M12 2 C12 2 5 12 5 16 C5 20 8 23 12 23 C16 23 19 20 19 16 C19 12 12 2 12 2Z" fill="#d97706" opacity="0.8" />
                </svg>
              </div>
            )}
          </div>
        )
      })}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: fullscreen ? 0 : 16, pointerEvents: 'none',
        boxShadow: fullscreen ? 'inset 0 0 100px rgba(0,0,0,0.08)' : 'inset 0 0 60px rgba(0,0,0,0.12)',
      }} />
    </div>
  )
}

const MODAL_CONFIG: Record<string, { subtitle: string, hasSubject: boolean, subjectPlaceholder: string, bodyPlaceholder: string, bodyLabel: string }> = {
  'report a bug': { subtitle: 'help me squash it.', hasSubject: true, subjectPlaceholder: "what's broken?", bodyPlaceholder: 'steps to reproduce, what you expected, etc.', bodyLabel: 'details (optional)' },
  'request a feature': { subtitle: "i want to hear it. i'll let you know if i add it.", hasSubject: true, subjectPlaceholder: "what's the feature?", bodyPlaceholder: 'why would this be useful? any details help.', bodyLabel: 'description (optional)' },
  'feedback': { subtitle: 'i read everything.', hasSubject: false, subjectPlaceholder: '', bodyPlaceholder: "whats up?", bodyLabel: '' },
}

function ReachOutModal({ type, onClose }: { type: string, onClose: () => void }) {
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const mono = '"JetBrains Mono", ui-monospace, monospace'
  const serif = '"Georgia", Georgia, serif'
  const accent = '#d97706'
  const config = MODAL_CONFIG[type] || MODAL_CONFIG['feedback']
  const canSend = config.hasSubject ? subject.trim().length > 0 : text.trim().length > 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 420, borderRadius: 12, background: '#fff',
          border: '1px solid rgba(15,15,16,0.08)',
          boxShadow: '0 20px 60px -12px rgba(0,0,0,0.2)',
          padding: 32,
          animation: 'modalIn 0.25s ease',
        }}
      >
        <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }`}</style>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontFamily: serif, fontSize: '1.3rem', color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 8px 0' }}>
              thank you for your support.
            </p>
            <p style={{ fontFamily: serif, fontSize: '0.9rem', color: '#6b6864', textTransform: 'lowercase', margin: '0 0 24px 0' }}>
              we'll get back to you as soon as we can.
            </p>
            <a
              onClick={onClose}
              style={{
                fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em',
                padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
                background: accent, color: '#fff', textDecoration: 'none', textTransform: 'lowercase',
              }}
            >close</a>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: serif, fontSize: '1.2rem', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 4px 0' }}>
              {type}
            </h3>
            <p style={{ fontFamily: serif, fontSize: '0.85rem', color: '#a1a1aa', textTransform: 'lowercase', margin: '0 0 20px 0' }}>
              {config.subtitle}
            </p>
            {config.hasSubject && (
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder={config.subjectPlaceholder}
                autoFocus
                style={{
                  width: '100%', borderRadius: 8, border: '1px solid rgba(15,15,16,0.1)',
                  padding: 14, fontFamily: serif, fontSize: '0.92rem', color: '#0f0f10',
                  outline: 'none', background: 'rgba(0,0,0,0.02)', marginBottom: 12,
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = accent)}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(15,15,16,0.1)')}
              />
            )}
            {config.hasSubject && (
              <p style={{ fontFamily: mono, fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'lowercase', margin: '0 0 6px 0', letterSpacing: '0.06em' }}>
                {config.bodyLabel}
              </p>
            )}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={config.bodyPlaceholder}
              autoFocus={!config.hasSubject}
              style={{
                width: '100%', height: config.hasSubject ? 100 : 140, borderRadius: 8, border: '1px solid rgba(15,15,16,0.1)',
                padding: 14, fontFamily: serif, fontSize: '0.92rem', color: '#0f0f10',
                resize: 'vertical', outline: 'none',
                background: 'rgba(0,0,0,0.02)', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = accent)}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(15,15,16,0.1)')}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
              <a
                onClick={onClose}
                style={{
                  fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em',
                  padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                  color: '#6b6864', textDecoration: 'none', textTransform: 'lowercase',
                }}
              >cancel</a>
              <a
                onClick={() => {
                  if (!canSend) return
                  const emailSubject = encodeURIComponent(config.hasSubject ? `${type}: ${subject} — Pulp` : `${type} — Pulp`)
                  const body = encodeURIComponent(config.hasSubject && text.trim() ? `${subject}\n\n${text}` : text || subject)
                  window.open(`mailto:pulpsupport@gmail.com?subject=${emailSubject}&body=${body}`, '_self')
                  setSent(true)
                }}
                style={{
                  fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em',
                  padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
                  background: canSend ? accent : '#e5e5e5',
                  color: canSend ? '#fff' : '#a1a1aa',
                  textDecoration: 'none', textTransform: 'lowercase',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >send</a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PulpLanding() {
  const [heroDone, setHeroDone] = useState(false)
  const [reachOutOpen, setReachOutOpen] = useState(false)
  const [modalType, setModalType] = useState<string | null>(null)
  const [orchardProgress, setOrchardProgress] = useState(0)
  const orchardSectionRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      const el = orchardSectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const scrollable = el.offsetHeight - window.innerHeight
      if (scrollable <= 0) return
      const raw = -rect.top / (el.offsetHeight - window.innerHeight)
      setOrchardProgress(Math.max(0, Math.min(1, raw)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!reachOutOpen) return
    const close = () => setReachOutOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [reachOutOpen])

  const mono = '"JetBrains Mono", ui-monospace, monospace'
  const serif = '"Georgia", Georgia, serif'
  const accent = '#d97706'

  const heroTextOpacity = Math.max(0, 1 - orchardProgress * 3)

  return (
    <div style={{ background: '#fff', color: '#0f0f10' }}>
      {/* Nav — fixed */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center',
        padding: '12px 80px',
        background: scrolled ? 'rgba(255,255,255,0.4)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(15,15,16,0.06)' : '1px solid transparent',
        transition: 'background 0.4s, backdrop-filter 0.4s, border-bottom 0.4s',
      }}>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          style={{ fontFamily: serif, fontSize: 18, fontWeight: 400, color: accent, letterSpacing: '-0.02em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <img src="/pulp_logo.svg" alt="pulp" style={{ width: 22, height: 22 }} />
          <span style={{ transform: 'translateY(-2px)' }}>pulp</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginLeft: 48 }}>
          <div style={{ position: 'relative' }}>
            <a
              onClick={(e) => { e.stopPropagation(); setReachOutOpen(o => !o) }}
              style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: '#6b6864', textDecoration: 'none', textTransform: 'lowercase', cursor: 'pointer', userSelect: 'none' }}
            >reach out</a>
            <div style={{
              position: 'absolute', top: '100%', left: '50%',
              marginTop: 10, minWidth: 160, borderRadius: 8,
              background: '#fff', border: '1px solid rgba(15,15,16,0.08)',
              boxShadow: '0 8px 30px -8px rgba(0,0,0,0.12)',
              padding: '6px 0',
              opacity: reachOutOpen ? 1 : 0,
              pointerEvents: reachOutOpen ? 'auto' : 'none',
              transform: reachOutOpen ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-6px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}>
              {[
                { label: 'contact me!', action: 'contact' },
                { label: 'report a bug', action: 'bug' },
                { label: 'request a feature', action: 'feature' },
                { label: 'feedback', action: 'feedback' },
              ].map(item => (
                <a
                  key={item.label}
                  onClick={() => {
                    setReachOutOpen(false)
                    if (item.action === 'contact') {
                      window.open('https://www.cesarvillegas.me', '_blank')
                    } else {
                      setModalType(item.label)
                    }
                  }}
                  style={{
                    display: 'block', padding: '8px 16px',
                    fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.06em',
                    color: '#6b6864', textDecoration: 'none', textTransform: 'lowercase', cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >{item.label}</a>
              ))}
            </div>
          </div>
          <a href="/login" style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em', color: '#6b6864', textDecoration: 'none', textTransform: 'lowercase' }}>log in</a>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <a href="/login" style={{
            fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.08em',
            padding: '6px 16px', borderRadius: 6,
            background: accent, color: '#fff', textDecoration: 'none', textTransform: 'lowercase',
            display: 'inline-block',
          }}>get started</a>
        </div>
      </nav>

      {/* Subtle grid texture — fixed behind hero */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(15,15,16,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(15,15,16,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '38px 38px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
        opacity: Math.max(0, 1 - orchardProgress * 2),
      }} />

      {/* ===== Hero ===== */}
      <section style={{ height: '80vh', display: 'flex', alignItems: 'center', padding: '0 80px', maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 100, width: '100%', marginTop: '-6vh' }}>
          <div style={{ flex: 1, opacity: heroTextOpacity, transform: `translateY(${orchardProgress * -40}px)`, transition: 'opacity 0.05s, transform 0.05s' }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
            >
              <span style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 32 }}>
                -- made for students, by a student
              </span>

              <TypewriterHeadline serif={serif} onComplete={() => setHeroDone(true)} />

              <div style={{
                marginTop: 36,
                opacity: heroDone ? 1 : 0,
                transform: heroDone ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.8s cubic-bezier(0.2,0.8,0.2,1), transform 0.8s cubic-bezier(0.2,0.8,0.2,1)',
              }}>
                <p style={{
                  fontFamily: serif, fontSize: '1.05rem', lineHeight: 1.7,
                  color: '#6b6864', maxWidth: 460, textTransform: 'lowercase', margin: '0 0 16px 0',
                  paddingLeft: 24,
                }}>
                  pulp is a gamified notes webapp that keeps up with you in class — because note-taking should be fast, fun, and distraction-free.
                </p>
                <ul style={{
                  fontFamily: serif, fontSize: '1.05rem', lineHeight: 1.9,
                  color: '#6b6864', textTransform: 'lowercase', margin: '0 0 0 0',
                  paddingLeft: 42, listStyleType: "'·  '",
                }}>
                  <li>focus timer + site blocker</li>
                  <li>real stakes. quit a session = lose all your progress</li>
                  <li>hyperproductive shortcut setup</li>
                  <li>an orchard that grows as you write</li>
                </ul>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 56 }}>
                  <a href="/login" style={{
                    fontFamily: mono, fontSize: '0.76rem', letterSpacing: '0.06em',
                    padding: '10px 28px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
                    background: accent, color: '#fff',
                    boxShadow: '0 4px 20px -4px rgba(234,88,12,0.3)',
                  }}>
                    start writing — free
                  </a>
                  <a href="/app" style={{
                    fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em',
                    padding: '9px 22px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
                    background: 'transparent', color: '#6b6864',
                    border: '1px solid rgba(15,15,16,0.12)',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,15,16,0.3)'; e.currentTarget.style.color = '#0f0f10' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,15,16,0.12)'; e.currentTarget.style.color = '#6b6864' }}
                  >
                    try without account
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: heroDone ? 1 : 0,
            transform: heroDone ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
            transition: 'opacity 1s cubic-bezier(0.2,0.8,0.2,1) 0.2s, transform 1s cubic-bezier(0.2,0.8,0.2,1) 0.2s',
          }}>
            {heroDone && <DemoOrchard />}
          </div>
        </div>

      </section>

      {/* ===== Orchard expansion zone — tall scroll spacer with pinned orchard ===== */}
      <div ref={orchardSectionRef} style={{ height: '200vh', position: 'relative' }}>
        <div style={{
          position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
        }}>
          {/* Fullscreen orchard terrain — fades in as user scrolls */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: Math.min(1, orchardProgress * 4),
            transition: 'opacity 0.05s',
          }}>
            <LandingTerrain />
          </div>

          {/* Overlay text that fades in as orchard fills screen */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 10,
            opacity: orchardProgress > 0.15 ? Math.min(1, (orchardProgress - 0.15) * 3) : 0,
          }}>
            <h2 style={{
              fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 3.6rem)', fontWeight: 400,
              color: '#fff', textTransform: 'lowercase', letterSpacing: '-0.03em',
              textShadow: '0 2px 20px rgba(0,0,0,0.3)',
              margin: '0 0 12px 0',
              transform: `translateY(${(1 - Math.min(1, (orchardProgress - 0.15) * 3)) * 30}px)`,
            }}>
              your orchard awaits.
            </h2>
            <p style={{
              fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.7)', textTransform: 'lowercase',
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
              transform: `translateY(${(1 - Math.min(1, (orchardProgress - 0.15) * 3)) * 20}px)`,
            }}>
              every tree grown through focus
            </p>
          </div>
        </div>
      </div>

      {/* ===== Content sections — normal flow ===== */}
      <div style={{ background: '#fff', position: 'relative', zIndex: 2 }}>

        {/* Animated stats banner */}
        <section style={{ padding: '80px 80px 48px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 80 }}>
            {[
              { value: 40, suffix: '+', label: 'tree species' },
              { value: 30, suffix: '+', label: 'achievements' },
              { value: 5, suffix: '', label: 'notebook types' },
              { value: 100, suffix: '%', label: 'free to use' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ fontFamily: serif, fontSize: '2.4rem', fontWeight: 400, color: '#0f0f10', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} delay={i * 200} />
                </div>
                <span style={{ fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.15em', color: '#bdb9b2', textTransform: 'lowercase', marginTop: 6, display: 'block' }}>
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why not docs */}
        <section style={{ borderTop: '1px solid rgba(15,15,16,0.08)', padding: '80px 80px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 16 }}>
                -- why pulp
              </span>
              <h2 style={{ fontFamily: serif, fontSize: '1.8rem', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
                docs wasn't built for this.
              </h2>
              <p style={{ fontFamily: serif, fontSize: '0.95rem', lineHeight: 1.7, color: '#6b6864', textTransform: 'lowercase', margin: 0 }}>
                google docs is a word processor pretending to be a notebook. it's slow, cluttered, and built for collaboration. not for you sitting in lecture trying to keep up.
                pulp is different. it loads instantly, stays out of your way, and rewards you for staying focused. no toolbar maze, no 2-second load times, no distractions.
              </p>
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, padding: '0 12px' }}>
                <span style={{ fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.15em', color: '#bdb9b2', textTransform: 'lowercase' }}>others</span>
                <span style={{ fontFamily: mono, fontSize: '0.62rem', letterSpacing: '0.15em', color: accent, textTransform: 'lowercase' }}>pulp</span>
              </div>
              {[
                ['no focus tools', 'focus timer + site blocker'],
                ['no consequences', 'real stakes — quit = lose progress'],
                ['clunky ui', 'shortcut-driven workflow'],
                ['just a doc', 'an orchard that grows as you write'],
              ].map(([l, r], i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 12px', borderRadius: 8,
                    background: i % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                  }}
                >
                  <span style={{ fontFamily: serif, fontSize: '0.85rem', color: '#bdb9b2', textTransform: 'lowercase', textDecoration: 'line-through', textDecorationColor: 'rgba(15,15,16,0.15)' }}>{l}</span>
                  <span style={{ fontFamily: serif, fontSize: '0.85rem', color: '#0f0f10', textTransform: 'lowercase', fontWeight: 400 }}>{r}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" ref={featuresRef} style={{ padding: '48px 80px 100px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <motion.span
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 48 }}
            >
              -- features
            </motion.span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '48px 48px' }}>
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 60, scale: 0.92, rotateX: 8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
                  style={{
                    padding: '24px 20px', borderRadius: 12,
                    border: '1px solid rgba(15,15,16,0.06)',
                    background: 'rgba(0,0,0,0.015)',
                    transformOrigin: 'center bottom',
                  }}
                >
                  <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: 12 }}>{f.icon}</span>
                  <h3 style={{ fontFamily: serif, fontSize: '1.1rem', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 8px 0' }}>
                    {f.label}
                  </h3>
                  <p style={{ fontFamily: serif, fontSize: '0.88rem', lineHeight: 1.65, color: '#6b6864', textTransform: 'lowercase', margin: 0 }}>
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tree collection */}
        <section id="collection" style={{ borderTop: '1px solid rgba(15,15,16,0.08)', borderBottom: '1px solid rgba(15,15,16,0.08)', padding: '80px 80px', background: 'rgba(0,0,0,0.015)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <span style={{ fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.28em', color: accent, textTransform: 'lowercase', display: 'block', marginBottom: 12 }}>
                  -- collection
                </span>
                <h2 style={{ fontFamily: serif, fontSize: '1.8rem', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                  40+ species to collect
                </h2>
                <p style={{ fontFamily: serif, fontSize: '0.92rem', color: '#6b6864', textTransform: 'lowercase', margin: 0 }}>
                  each hand-drawn and earned through focus.
                </p>
              </motion.div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['common', 'uncommon', 'rare', 'sacred'].map((r, i) => (
                  <motion.span
                    key={r}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{
                      fontFamily: mono, fontSize: '0.55rem', letterSpacing: '0.1em',
                      padding: '4px 10px', borderRadius: 20,
                      background: RARITY_COLOR[r] + '15',
                      color: RARITY_COLOR[r],
                      textTransform: 'lowercase',
                      border: `1px solid ${RARITY_COLOR[r]}30`,
                      display: 'inline-block',
                    }}
                  >{r}</motion.span>
                ))}
              </div>
            </div>

            <div style={{ overflow: 'hidden', width: '100%', maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 40, width: 'max-content',
                animation: 'conveyorScroll 50s linear infinite',
                willChange: 'transform',
              }}>
                {[...SHOWCASE_TREES, ...SHOWCASE_TREES, ...SHOWCASE_TREES].map((t, i) => (
                  <div
                    key={`${t.type}-${i}`}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0,
                      padding: '16px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(15,15,16,0.04)',
                    }}
                  >
                    <PlantIcon type={t.type} size={72} stage={3} hideGround />
                    <span style={{ fontFamily: serif, fontSize: '0.82rem', color: '#0f0f10', textTransform: 'lowercase' }}>{t.name}</span>
                    <span style={{
                      fontFamily: mono, fontSize: '0.55rem', letterSpacing: '0.1em',
                      color: RARITY_COLOR[t.rarity] || '#a1a1aa', textTransform: 'lowercase',
                      padding: '2px 8px', borderRadius: 10,
                      background: (RARITY_COLOR[t.rarity] || '#a1a1aa') + '12',
                    }}>{t.rarity}</span>
                  </div>
                ))}
              </div>
              <style>{`@keyframes conveyorScroll { 0% { transform: translateX(0) } 100% { transform: translateX(-33.33%) } }`}</style>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '120px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(217,119,6,0.04) 0%, transparent 70%)',
          }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <h2 style={{ fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 400, color: '#0f0f10', textTransform: 'lowercase', margin: '0 0 16px 0', letterSpacing: '-0.02em' }}>
                your orchard is waiting.
              </h2>
              <p style={{ fontFamily: serif, fontSize: '1rem', color: '#6b6864', textTransform: 'lowercase', margin: '0 0 40px 0' }}>
                start writing, stay focused, and grow something beautiful.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                <a href="/login" style={{
                  fontFamily: mono, fontSize: '0.76rem', letterSpacing: '0.06em',
                  padding: '12px 32px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
                  background: accent, color: '#fff',
                  boxShadow: '0 4px 20px -4px rgba(234,88,12,0.3)',
                }}>
                  start growing — free
                </a>
                <a href="/app" style={{
                  fontFamily: mono, fontSize: '0.72rem', letterSpacing: '0.06em',
                  padding: '11px 24px', borderRadius: 8, textDecoration: 'none', textTransform: 'lowercase',
                  background: 'transparent', color: '#6b6864',
                  border: '1px solid rgba(15,15,16,0.12)',
                }}>
                  try without account
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(15,15,16,0.08)',
          padding: '24px 80px',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: serif, fontSize: 14, fontWeight: 400, color: accent }}>pulp</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <a href="/privacy" style={{ fontFamily: mono, fontSize: '0.65rem', color: '#bdb9b2', textDecoration: 'none', textTransform: 'lowercase', letterSpacing: '0.06em' }}>privacy</a>
              <a href="/terms" style={{ fontFamily: mono, fontSize: '0.65rem', color: '#bdb9b2', textDecoration: 'none', textTransform: 'lowercase', letterSpacing: '0.06em' }}>terms</a>
            </div>
          </div>
        </footer>
      </div>

      {modalType && <ReachOutModal type={modalType} onClose={() => setModalType(null)} />}
    </div>
  )
}
