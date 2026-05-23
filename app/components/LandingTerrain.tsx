"use client"
import { memo, useEffect, useRef } from "react"
import { PlantIcon } from "./PlantIcon"

function seededRng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

const FIREFLIES = Array.from({ length: 15 }, (_, i) => {
  const rng = seededRng(i * 37 + 777)
  const x = 10 + rng() * 80
  const y = 35 + rng() * 55
  const dx = (rng() - 0.5) * 40
  const dy = (rng() - 0.5) * 25
  const glowDur = 6 + rng() * 6
  const driftDur = 12 + rng() * 10
  const delay = -rng() * 10
  return { x, y, dx, dy, glowDur, driftDur, delay }
})

const GRID_COLS = 5
const GRID_SLOTS_PER_COL = 2
const GRID_TOTAL_SLOTS = GRID_COLS * GRID_SLOTS_PER_COL
const GRID_ROWS: number = 3
const GRID_COL_START = 17
const GRID_COL_END = 83
const GRID_ROW_START = 47
const GRID_ROW_END = 85
const GRID_TILL_OFFSET = 1.5

function gridSlotPos(slotIndex: number) {
  const slot = slotIndex % GRID_TOTAL_SLOTS
  const row = Math.floor(slotIndex / GRID_TOTAL_SLOTS)
  const col = Math.floor(slot / GRID_SLOTS_PER_COL)
  const side = slot % GRID_SLOTS_PER_COL
  const rowSpacing = GRID_ROWS > 1 ? (GRID_ROW_END - GRID_ROW_START) / (GRID_ROWS - 1) : 0
  const y = GRID_ROWS === 1 ? 65 : GRID_ROW_START + row * rowSpacing
  const depthT = (y - GRID_ROW_START) / Math.max(1, GRID_ROW_END - GRID_ROW_START)
  const pinch = (1 - depthT) * 10 - depthT * 2
  const trapLeft = GRID_COL_START + pinch
  const trapRight = GRID_COL_END - pinch
  const tillX = trapLeft + col * ((trapRight - trapLeft) / (GRID_COLS - 1))
  const midCol = (GRID_COLS - 1) / 2
  const inwardShift = col === midCol ? 0 : (col < midCol ? 0.5 : -0.5)
  const leftPush = col < 2 ? -4 : col > 2 ? 4 : 0
  const pairSpread = (side === 0 ? -1 : 1) * (row <= 1 ? 2 : 1)
  const x = tillX + (side === 0 ? -GRID_TILL_OFFSET : GRID_TILL_OFFSET) + inwardShift + leftPush + pairSpread
  return { x: Math.max(4, Math.min(96, x)), y: Math.max(42, Math.min(94, y)), row }
}

const TREE_TYPES_LIST = [
  'tangerine', 'plum', 'passionfruit', 'coconut', 'grape',
  'mushroom', 'sage', 'coral', 'bloom', 'lotus',
  'pine', 'oak', 'sakura', 'bamboo', 'bonsai',
  'cedarwood', 'mangrove', 'sunflower', 'lychee', 'pear',
  'baobab', 'winterveil', 'abyss', 'starweaver', 'prismatic',
  'birch', 'whirlpool', 'cactus', 'cypress', 'agave',
]

const LANDING_TREES = TREE_TYPES_LIST.map((type, i) => {
  const pos = gridSlotPos(i)
  const rng = seededRng(i * 53 + 137)
  const jitterY = (rng() - 0.5) * 1.5
  const depthT = Math.max(0, Math.min(1, (pos.y - 40) / 55))
  const depthScale = 0.55 + depthT * 0.55
  const shrink = (type === 'birch' || type === 'baobab') ? 0.75 : 1
  const size = Math.round(112 * depthScale * shrink / 16) * 16 || 16
  const rowStart = 0.15 + pos.row * 0.22
  const scaleY = 0.7 + depthT * 0.3
  const y = Math.max(42, Math.min(94, pos.y + jitterY))
  return { type, x: pos.x, y, row: pos.row, size, depthT, rowStart, scaleY }
}).sort((a, b) => a.y - b.y)

export const LandingTerrain = memo(function LandingTerrain({ progress = 0 }: { progress?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.style.setProperty('--p', String(progress))
  }, [progress])

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden', ['--p' as string]: '0' }}>
      <style>{`
        @keyframes cloudDrift { 0% { transform: translateX(-10%) } 100% { transform: translateX(110%) } }
        @keyframes firefly-glow { 0% { opacity: 0; } 15% { opacity: 0.3; } 30% { opacity: 0.06; } 45% { opacity: 0.6; } 50% { opacity: 0.85; box-shadow: 0 0 8px 3px rgba(217,119,6,0.5); } 55% { opacity: 0.6; } 70% { opacity: 0.2; } 85% { opacity: 0.06; } 100% { opacity: 0; } }
        @keyframes firefly-drift { 0% { transform: translate(0,0) } 25% { transform: translate(var(--drift-x),var(--drift-y)) } 50% { transform: translate(calc(var(--drift-x)*-0.5),calc(var(--drift-y)*0.5)) } 75% { transform: translate(calc(var(--drift-x)*0.7),calc(var(--drift-y)*-0.3)) } 100% { transform: translate(0,0) } }
        @keyframes wm-spin-cw { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes wm-spin-ccw { from { transform: rotate(0deg) } to { transform: rotate(-360deg) } }
        .lt-pop {
          transform: translate(-50%, -76%) scaleY(var(--sy)) scale(clamp(0, calc((var(--p) - var(--rs)) * 10), 1));
          opacity: clamp(0, calc((var(--p) - var(--rs)) * 10), 1);
          transform-origin: center bottom;
          filter: brightness(0.82) saturate(0.85);
        }
      `}</style>

      <img
        src="/landing-terrain.png"
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          pointerEvents: 'none',
        }}
      />

      {LANDING_TREES.map((tree, i) => (
        <div
          key={i}
          className="lt-pop"
          style={{
            position: 'absolute',
            left: `${tree.x}%`,
            top: `${tree.y}%`,
            zIndex: Math.round(tree.y),
            pointerEvents: 'none',
            ['--rs' as string]: String(tree.rowStart),
            ['--sy' as string]: String(tree.scaleY),
          }}
        >
          <PlantIcon type={tree.type} size={tree.size} stage={3} hideGround />
          <div style={{
            position: 'absolute', left: '50%', bottom: -2,
            width: tree.size * 0.6, height: tree.size * 0.08,
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.13) 0%, transparent 70%)',
          }} />
        </div>
      ))}

      {[
        { y: '4%', s: 1, d: 50 },
        { y: '10%', s: 0.7, d: 65 },
        { y: '2%', s: 0.5, d: 42 },
        { y: '14%', s: 0.8, d: 70 },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', top: c.y, left: 0, width: '100%',
          opacity: 0.15, animation: `cloudDrift ${c.d}s linear infinite`,
          animationDelay: `${-i * 13}s`, pointerEvents: 'none',
        }}>
          <svg width="8%" height="3%" viewBox="0 0 65 22" style={{ marginLeft: `${i * 18}%` }}>
            <ellipse cx="32" cy="13" rx="30" ry="8" fill="rgba(180,195,220,0.4)" />
            <ellipse cx="22" cy="11" rx="17" ry="9" fill="rgba(180,195,220,0.3)" />
            <ellipse cx="44" cy="11" rx="19" ry="7" fill="rgba(180,195,220,0.35)" />
          </svg>
        </div>
      ))}

      {FIREFLIES.map((f, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${f.x}%`, top: `${f.y}%`,
          width: 3, height: 3, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,119,6,0.8), rgba(217,119,6,0) 70%)',
          animation: `firefly-glow ${f.glowDur}s ease-in-out infinite, firefly-drift ${f.driftDur}s ease-in-out infinite`,
          animationDelay: `${f.delay}s`,
          ['--drift-x' as string]: `${f.dx}px`,
          ['--drift-y' as string]: `${f.dy}px`,
          pointerEvents: 'none',
        }} />
      ))}

      {[
        { left: 89, top: 47.5, size: '3.5%', dur: 25, dir: 'cw' },
        { left: 97, top: 45.3, size: '2.8%', dur: 32, dir: 'ccw' },
      ].map((wm, i) => (
        <svg key={`wm-${i}`} style={{
          position: 'absolute',
          left: `${wm.left}%`, top: `${wm.top}%`,
          width: wm.size, height: wm.size,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          overflow: 'visible',
        }} viewBox="0 0 20 20">
          <g style={{ transformOrigin: '10px 10px', animation: `wm-spin-${wm.dir} ${wm.dur}s linear infinite` }}>
            {[0, 90, 180, 270].map(angle => (
              <polygon key={angle}
                points="9.6,10 10.4,10 10.8,3 9.85,3"
                fill="#4a4236" opacity="0.85"
                transform={`rotate(${angle} 10 10)`}
              />
            ))}
          </g>
        </svg>
      ))}

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        boxShadow: 'inset 25px 0 35px -10px rgba(8,10,8,0.3), inset 0 0 100px rgba(0,0,0,0.15)',
      }} />
    </div>
  )
})
