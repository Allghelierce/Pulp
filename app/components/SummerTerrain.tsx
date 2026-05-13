"use client"
import React, { memo, useRef, useState, useEffect, useMemo } from "react"

function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 }
}

interface SummerTerrainProps {
  isDark: boolean
  treeCount: number
  treeBases: { x: number; y: number; col: number }[]
}

export const SummerTerrain = memo(function SummerTerrain({ isDark, treeCount, treeBases }: SummerTerrainProps) {
  const terrainSvgRef = useRef<SVGSVGElement>(null)
  const [svgAspect, setSvgAspect] = useState(2)
  useEffect(() => {
    const el = terrainSvgRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) setSvgAspect(r.width / r.height)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const sky = isDark
    ? { top: '#0a0e1a', mid: '#0e1428', low: '#141e38', horizon: '#1a2848' }
    : { top: '#1a5276', mid: '#2e86ab', low: '#5dade2', horizon: '#aed6f1' }

  const ocean = isDark
    ? { top: '#0c1824', mid: '#081420', deep: '#06101a' }
    : { top: '#1a7a8a', mid: '#1a6878', deep: '#145868' }

  const sand = isDark
    ? { top: '#2a2418', mid: '#221e14', bot: '#1a1810' }
    : { top: '#e8d5a8', mid: '#dcc898', bot: '#d0bb88' }

  const vbAspect = 200 / 100
  const squeeze = svgAspect / vbAspect

  return (
    <svg ref={terrainSvgRef} className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 -4 200 100" preserveAspectRatio="none" style={{ willChange: 'transform', contain: 'strict' }}>
      <defs>
        <linearGradient id="summer-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky.top} />
          <stop offset="40%" stopColor={sky.mid} />
          <stop offset="75%" stopColor={sky.low} />
          <stop offset="100%" stopColor={sky.horizon} />
        </linearGradient>
        <linearGradient id="summer-ocean" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ocean.top} />
          <stop offset="60%" stopColor={ocean.mid} />
          <stop offset="100%" stopColor={ocean.deep} />
        </linearGradient>
        <linearGradient id="summer-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sand.top} />
          <stop offset="50%" stopColor={sand.mid} />
          <stop offset="100%" stopColor={sand.bot} />
        </linearGradient>
        <linearGradient id="summer-wet-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isDark ? '#1e1c14' : '#c8b888'} />
          <stop offset="100%" stopColor={isDark ? '#1a1a12' : '#baa878'} />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="200" height="100" fill="url(#summer-sky)" />

      {/* Sun */}
      {!isDark && (
        <g style={{ pointerEvents: 'none' }}>
          <defs>
            <radialGradient id="summer-sun-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
              <stop offset="20%" stopColor="#ffd700" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ffd700" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx={150 / squeeze} cy={8} rx={10 / squeeze} ry={10} fill="url(#summer-sun-glow)" />
          <ellipse cx={150 / squeeze} cy={8} rx={3.5 / squeeze} ry={3.5} fill="#ffd700" />
          <ellipse cx={150 / squeeze} cy={8} rx={2 / squeeze} ry={2} fill="#fff8dc" />
        </g>
      )}

      {/* Moon for dark mode */}
      {isDark && (
        <g style={{ pointerEvents: 'none' }}>
          <defs>
            <radialGradient id="summer-moon-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c8d8f0" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#c8d8f0" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#c8d8f0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx={140 / squeeze} cy={6} rx={8 / squeeze} ry={8} fill="url(#summer-moon-glow)" />
          <circle cx={140 / squeeze} cy={6} r={2.5} fill="#e8eef8" />
          <circle cx={(140 + 1.2) / squeeze} cy={5.2} r={2.5} fill={sky.top} />
        </g>
      )}

      {/* Stars — dark mode only */}
      {isDark && (() => {
        const stars: React.ReactElement[] = []
        for (let i = 0; i < 40; i++) {
          const rng = seededRng(i * 67 + 311)
          const sx = rng() * 200
          const sy = rng() * 18
          const sr = 0.08 + rng() * 0.2
          stars.push(<circle key={i} cx={sx} cy={sy} r={sr} fill="#e8f0ff" opacity={0.3 + rng() * 0.5} />)
        }
        return <g>{stars}</g>
      })()}

      {/* Distant islands/headlands */}
      <path d="M-10,28 C0,26 8,22 16,23 C22,24 26,27 30,28 L-10,28 Z" fill={isDark ? '#0e1820' : '#3a6878'} opacity="0.5" />
      <path d="M170,27 C176,24 182,22 188,23 C194,24 198,26 210,27 L210,28 L170,28 Z" fill={isDark ? '#0e1820' : '#3a6878'} opacity="0.4" />

      {/* Ocean */}
      <rect x="0" y="28" width="200" height="24" fill="url(#summer-ocean)" />

      {/* Ocean shimmer / light reflections */}
      {!isDark && (() => {
        const shimmers: React.ReactElement[] = []
        for (let i = 0; i < 20; i++) {
          const rng = seededRng(i * 43 + 557)
          const sx = rng() * 200
          const sy = 30 + rng() * 18
          const sw = 1 + rng() * 3
          shimmers.push(
            <line key={i} x1={sx} y1={sy} x2={sx + sw} y2={sy} stroke="rgba(255,255,255,0.15)" strokeWidth="0.15" strokeLinecap="round" />
          )
        }
        return <g>{shimmers}</g>
      })()}

      {/* Wave lines */}
      <path d="M-10,34 Q0,33 10,34 Q20,35 30,34 Q40,33 50,34 Q60,35 70,34 Q80,33 90,34 Q100,35 110,34 Q120,33 130,34 Q140,35 150,34 Q160,33 170,34 Q180,35 190,34 Q200,33 210,34" fill="none" stroke={isDark ? 'rgba(100,160,200,0.08)' : 'rgba(255,255,255,0.12)'} strokeWidth="0.2" />
      <path d="M-10,38 Q5,37 15,38 Q25,39 35,38 Q45,37 55,38 Q65,39 75,38 Q85,37 95,38 Q105,39 115,38 Q125,37 135,38 Q145,39 155,38 Q165,37 175,38 Q185,39 195,38 Q205,37 210,38" fill="none" stroke={isDark ? 'rgba(100,160,200,0.06)' : 'rgba(255,255,255,0.08)'} strokeWidth="0.15" />

      {/* Sailboat */}
      <g opacity={isDark ? 0.3 : 0.5}>
        <path d="M82,31 L82,27 L86,30 Z" fill={isDark ? '#2a3848' : '#ffffff'} />
        <path d="M82,31 L82,27.5 L79,30.5 Z" fill={isDark ? '#222e3c' : '#e8e8e8'} />
        <path d="M79.5,31 L86.5,31 L85.5,32 L80.5,32 Z" fill={isDark ? '#1a2430' : '#5a4a3a'} />
      </g>

      {/* Shore foam line */}
      <path d="M-10,50 Q0,49.5 10,50.2 Q20,50.8 30,50 Q40,49.3 50,50.1 Q60,50.7 70,49.8 Q80,49.2 90,50 Q100,50.6 110,49.9 Q120,49.4 130,50.3 Q140,50.8 150,50 Q160,49.3 170,50.1 Q180,50.7 190,49.8 Q200,49.3 210,50" fill="none" stroke={isDark ? 'rgba(200,220,240,0.1)' : 'rgba(255,255,255,0.5)'} strokeWidth="0.4" />
      <path d="M-10,50.5 Q5,50 15,50.5 Q25,51 35,50.3 Q45,49.8 55,50.4 Q65,51 75,50.2 Q85,49.7 95,50.3 Q105,50.9 115,50.1 Q125,49.6 135,50.4 Q145,51 155,50.2 Q165,49.6 175,50.3 Q185,50.9 195,50.1 Q205,49.7 210,50.2" fill="none" stroke={isDark ? 'rgba(200,220,240,0.06)' : 'rgba(255,255,255,0.3)'} strokeWidth="0.3" />

      {/* Wet sand strip */}
      <rect x="0" y="50" width="200" height="4" fill="url(#summer-wet-sand)" />

      {/* Main sandy beach */}
      <rect x="0" y="54" width="200" height="50" fill="url(#summer-sand)" />

      {/* Sand texture — scattered dots */}
      {(() => {
        const dots: React.ReactElement[] = []
        for (let i = 0; i < 60; i++) {
          const rng = seededRng(i * 37 + 991)
          const dx = rng() * 200
          const dy = 55 + rng() * 40
          dots.push(<circle key={i} cx={dx} cy={dy} r={0.08 + rng() * 0.12} fill={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} />)
        }
        return <g>{dots}</g>
      })()}

      {/* Shells and pebbles near shore */}
      {(() => {
        const items: React.ReactElement[] = []
        for (let i = 0; i < 12; i++) {
          const rng = seededRng(i * 71 + 443)
          const sx = 5 + rng() * 190
          const sy = 51 + rng() * 5
          const sr = 0.15 + rng() * 0.2
          const col = isDark
            ? `rgba(${180 + rng() * 60},${170 + rng() * 50},${150 + rng() * 40},0.15)`
            : `rgba(${180 + rng() * 60},${170 + rng() * 50},${150 + rng() * 40},0.4)`
          items.push(<ellipse key={i} cx={sx} cy={sy} rx={sr} ry={sr * 0.7} fill={col} transform={`rotate(${rng() * 360} ${sx} ${sy})`} />)
        }
        return <g>{items}</g>
      })()}

      {/* Distant palm tree silhouettes on headlands */}
      <g opacity={isDark ? 0.25 : 0.35}>
        {/* Left headland palms */}
        <line x1="12" y1="23" x2="12" y2="20" stroke={isDark ? '#0a1418' : '#2a5060'} strokeWidth="0.3" />
        <path d="M12,20 Q10,18 8,19 M12,20 Q14,18 16,19 M12,20 Q11,17.5 10,18 M12,20 Q13,17.5 14,18" stroke={isDark ? '#0a1418' : '#2a5060'} strokeWidth="0.25" fill="none" />
        {/* Right headland palm */}
        <line x1="185" y1="23.5" x2="185" y2="20.5" stroke={isDark ? '#0a1418' : '#2a5060'} strokeWidth="0.3" />
        <path d="M185,20.5 Q183,18.5 181,19.5 M185,20.5 Q187,18.5 189,19.5 M185,20.5 Q184,18 183,18.5" stroke={isDark ? '#0a1418' : '#2a5060'} strokeWidth="0.25" fill="none" />
      </g>

      {/* Beach umbrella detail */}
      <g opacity={isDark ? 0.3 : 0.6}>
        <line x1="25" y1="62" x2="25" y2="56" stroke={isDark ? '#3a2a1a' : '#8a6a40'} strokeWidth="0.3" />
        <path d="M21,56.5 Q23,54.5 25,56 Q27,54.5 29,56.5" fill={isDark ? '#6a2020' : '#e04040'} stroke="none" />
        <path d="M23,55.5 Q24,54.8 25,55.8" fill={isDark ? '#802828' : '#f06060'} opacity="0.5" />
      </g>

      {/* Driftwood */}
      <g opacity={isDark ? 0.2 : 0.35}>
        <path d="M60,53 Q62,52.5 65,53 Q66,53.2 67,53" stroke={isDark ? '#3a3028' : '#9a8a70'} strokeWidth="0.3" fill="none" strokeLinecap="round" />
        <path d="M140,54 Q142,53.3 144,53.8" stroke={isDark ? '#3a3028' : '#9a8a70'} strokeWidth="0.25" fill="none" strokeLinecap="round" />
      </g>

      {/* Lighthouse on far right */}
      <g opacity={isDark ? 0.4 : 0.7}>
        <rect x="196" y="42" width="2.5" height="9" rx="0.3" fill={isDark ? '#1a2028' : '#f0ece0'} />
        <rect x="196" y="44" width="2.5" height="1.5" fill={isDark ? '#2a1818' : '#cc3030'} />
        <rect x="196" y="47.5" width="2.5" height="1.5" fill={isDark ? '#2a1818' : '#cc3030'} />
        <rect x="195.5" y="41" width="3.5" height="1.5" rx="0.3" fill={isDark ? '#1a2028' : '#e0dcd0'} />
        <polygon points="195.5,41 199,41 197.25,39" fill={isDark ? '#222830' : '#d0ccc0'} />
        {isDark && <circle cx="197.25" cy="41.5" r="0.5" fill="#ffd700" opacity="0.6" />}
        {isDark && (
          <defs>
            <radialGradient id="lighthouse-beam" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
            </radialGradient>
          </defs>
        )}
        {isDark && <ellipse cx="197.25" cy="41.5" rx="8" ry="6" fill="url(#lighthouse-beam)" />}
      </g>

      {/* Seagulls */}
      <g opacity={isDark ? 0.2 : 0.4} stroke={isDark ? '#4a5a6a' : '#4a5a6a'} strokeWidth="0.2" fill="none" strokeLinecap="round">
        <path d="M40,12 Q41,11 42,12 Q43,11 44,12" />
        <path d="M55,8 Q56,7 57,8 Q58,7 59,8" />
        <path d="M120,14 Q121,13 122,14 Q123,13 124,14" />
        <path d="M90,10 Q91,9.2 92,10" />
      </g>

      {/* Clouds */}
      {!isDark && (
        <g opacity="0.6">
          <ellipse cx="30" cy="10" rx="8" ry="2.5" fill="rgba(255,255,255,0.3)" />
          <ellipse cx="33" cy="9" rx="5" ry="2" fill="rgba(255,255,255,0.25)" />
          <ellipse cx="100" cy="6" rx="10" ry="2.8" fill="rgba(255,255,255,0.2)" />
          <ellipse cx="104" cy="5" rx="6" ry="2" fill="rgba(255,255,255,0.18)" />
        </g>
      )}

      {/* Tills — circular sandy mounds instead of rectangular grid */}
      {(() => {
        const cols = Math.min(8, Math.max(3, Math.ceil(Math.sqrt(treeCount * 1.2))))
        const tillElements: React.ReactElement[] = []
        const startX = 10
        const endX = 185
        const startY = 58
        const rowGap = 7
        const rows = 5
        for (let row = 0; row < rows; row++) {
          const rowOffset = row % 2 === 1 ? ((endX - startX) / cols) * 0.5 : 0
          const y = startY + row * rowGap
          const colCount = row % 2 === 1 ? cols - 1 : cols
          for (let col = 0; col < colCount; col++) {
            const x = startX + rowOffset + col * ((endX - startX) / (colCount - 1 || 1))
            tillElements.push(
              <ellipse
                key={`till-${row}-${col}`}
                cx={x}
                cy={y}
                rx={3.5}
                ry={1.2}
                fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}
                stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}
                strokeWidth="0.15"
                strokeDasharray="0.5 0.8"
              />
            )
          }
        }
        return <g>{tillElements}</g>
      })()}
    </svg>
  )
})
