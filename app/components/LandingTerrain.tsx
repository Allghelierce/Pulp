"use client"
import { memo } from "react"

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

export const LandingTerrain = memo(function LandingTerrain() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes cloudDrift { 0% { transform: translateX(-10%) } 100% { transform: translateX(110%) } }
        @keyframes firefly-glow { 0% { opacity: 0; } 15% { opacity: 0.3; } 30% { opacity: 0.06; } 45% { opacity: 0.6; } 50% { opacity: 0.85; box-shadow: 0 0 8px 3px rgba(217,119,6,0.5); } 55% { opacity: 0.6; } 70% { opacity: 0.2; } 85% { opacity: 0.06; } 100% { opacity: 0; } }
        @keyframes firefly-drift { 0% { transform: translate(0,0) } 25% { transform: translate(var(--drift-x),var(--drift-y)) } 50% { transform: translate(calc(var(--drift-x)*-0.5),calc(var(--drift-y)*0.5)) } 75% { transform: translate(calc(var(--drift-x)*0.7),calc(var(--drift-y)*-0.3)) } 100% { transform: translate(0,0) } }
      `}</style>

      {/* Static terrain PNG */}
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

      {/* Clouds */}
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

      {/* Fireflies */}
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

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        boxShadow: 'inset 25px 0 35px -10px rgba(8,10,8,0.3), inset 0 0 100px rgba(0,0,0,0.15)',
      }} />
    </div>
  )
})
