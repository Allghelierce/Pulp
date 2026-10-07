"use client"
import { memo } from "react"
import { useReducedMotion } from "./lively"

// Now and then a single leaf drifts down across the Stats page, swaying and
// turning as it falls. Pure CSS: each leaf falls for part of its cycle and
// rests (invisible) for the rest, with staggered cycles so only one or two
// are ever in the air. Off with reduced motion.

const LEAVES = [
  // left %, cycle s, delay s, size px, sway px, tint
  { left: 14, cycle: 26, delay: 2, size: 21, sway: 46, tint: 0 },
  { left: 63, cycle: 31, delay: 11, size: 18, sway: 38, tint: 1 },
  { left: 38, cycle: 29, delay: 20, size: 23, sway: 54, tint: 2 },
  { left: 86, cycle: 34, delay: 6, size: 19, sway: 40, tint: 1 },
  { left: 24, cycle: 37, delay: 27, size: 17, sway: 34, tint: 0 },
]

const TINTS_DARK = ["rgba(206,150,70,0.75)", "rgba(130,172,96,0.7)", "rgba(226,128,20,0.72)"]
const TINTS_LIGHT = ["rgba(176,112,40,0.72)", "rgba(92,134,64,0.68)", "rgba(217,119,6,0.7)"]

const CSS = `
@keyframes leafFall {
  0%   { transform: translateY(-40px); opacity: 0 }
  3%   { opacity: 1 }
  42%  { opacity: 1 }
  46%  { transform: translateY(calc(100vh + 40px)); opacity: 0 }
  100% { transform: translateY(calc(100vh + 40px)); opacity: 0 }
}
@keyframes leafSway {
  0%, 100% { transform: translateX(calc(var(--sway) * -0.5)) rotate(-28deg) }
  50%      { transform: translateX(calc(var(--sway) * 0.5)) rotate(32deg) }
}
@keyframes leafSpin {
  0%, 100% { transform: rotateY(0deg) }
  50%      { transform: rotateY(70deg) }
}
`

export const DriftingLeaves = memo(function DriftingLeaves({ isDark }: { isDark: boolean }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  const tints = isDark ? TINTS_DARK : TINTS_LIGHT
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 5 }}>
      <style>{CSS}</style>
      {LEAVES.map((l, i) => (
        <div key={i} style={{
          position: "absolute", top: 0, left: `${l.left}%`,
          animation: `leafFall ${l.cycle}s linear ${l.delay}s infinite both`,
        }}>
          <div style={{
            ["--sway" as string]: `${l.sway}px`,
            animation: `leafSway ${(l.cycle * 0.46 / 3).toFixed(2)}s ease-in-out ${l.delay}s infinite`,
          } as React.CSSProperties}>
            <svg width={l.size} height={l.size} viewBox="0 0 20 20" style={{ display: "block", animation: `leafSpin ${(l.cycle * 0.46 / 5).toFixed(2)}s ease-in-out infinite` }}>
              <path d="M10 1 C 16 4, 18 11, 10 19 C 2 11, 4 4, 10 1 Z" fill={tints[l.tint]} />
              <path d="M10 3 L10 17" stroke={isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.18)"} strokeWidth="0.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
})
