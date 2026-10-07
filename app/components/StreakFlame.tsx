"use client"
import { memo } from "react"

// A real-looking, moving flame: outer flame in the streak color, an amber middle,
// a pale core, each flickering at its own pace, plus a few rising embers.
// `calm` burns slower (e.g. today's goal is met); unlit = still and gray.
// Pure CSS keyframes (cheap); holds still for prefers-reduced-motion.
const FLAME_CSS = `
.pulp-flame .pf { transform-box: fill-box; transform-origin: 50% 100%; }
.pulp-flame .pf-outer { animation: pf-flick-a 1.3s ease-in-out infinite alternate; }
.pulp-flame .pf-mid { animation: pf-flick-b 0.9s ease-in-out infinite alternate; }
.pulp-flame .pf-core { animation: pf-flick-c 0.6s ease-in-out infinite alternate; }
.pulp-flame .pf-glow { animation: pf-glow 1.6s ease-in-out infinite alternate; }
.pulp-flame .pf-ember { animation: pf-ember 1.8s ease-out infinite; opacity: 0; }
.pulp-flame.calm .pf-outer { animation-duration: 2.2s; }
.pulp-flame.calm .pf-mid { animation-duration: 1.6s; }
.pulp-flame.calm .pf-core { animation-duration: 1.1s; }
.pulp-flame.calm .pf-ember { animation-duration: 2.8s; }
@keyframes pf-flick-a {
  0% { transform: scale(1, 1) skewX(0deg) }
  30% { transform: scale(0.95, 1.07) skewX(-4deg) }
  60% { transform: scale(1.03, 0.96) skewX(3deg) }
  100% { transform: scale(0.98, 1.05) skewX(-2deg) }
}
@keyframes pf-flick-b {
  0% { transform: scale(1, 1) skewX(2deg) }
  40% { transform: scale(0.92, 1.1) skewX(-5deg) }
  100% { transform: scale(1.05, 0.94) skewX(4deg) }
}
@keyframes pf-flick-c {
  0% { transform: scale(1, 0.95) translateX(0) }
  50% { transform: scale(0.9, 1.12) translateX(-0.3px) }
  100% { transform: scale(1.06, 0.98) translateX(0.3px) }
}
@keyframes pf-glow { from { opacity: 0.35 } to { opacity: 0.75 } }
@keyframes pf-ember {
  0% { opacity: 0; transform: translate(0, 0) scale(1) }
  15% { opacity: 1 }
  100% { opacity: 0; transform: translate(var(--pf-dx), -9px) scale(0.4) }
}
@media (prefers-reduced-motion: reduce) {
  .pulp-flame .pf, .pulp-flame .pf-glow, .pulp-flame .pf-ember { animation: none; }
}`

const EMBERS = [{ x: 9, d: "-2px", delay: "0s" }, { x: 14.5, d: "2px", delay: "0.6s" }, { x: 12, d: "0.5px", delay: "1.2s" }]

export const StreakFlame = memo(function StreakFlame({ color, size = 18, glow, lit = true, calm = false }: {
  color: string
  size?: number
  glow?: number      // drop-shadow radius; defaults to scale with size
  lit?: boolean
  calm?: boolean
}) {
  const g = glow ?? Math.round(size / 7)
  const h = Math.round(size * 1.16)
  return (
    <span className={`pulp-flame${calm ? " calm" : ""}`} style={{ position: "relative", display: "inline-flex", width: size, height: h, flexShrink: 0 }}>
      <style>{FLAME_CSS}</style>
      <svg width={size} height={h} viewBox="0 0 24 28" style={{ overflow: "visible", opacity: lit ? 1 : 0.35,
        filter: lit ? (g > 0 ? `drop-shadow(0 0 ${g}px ${color})` : undefined) : "grayscale(1)" }}>
        {lit && <ellipse className="pf-glow" cx="12" cy="22" rx="8" ry="5" fill={color} opacity="0.5" style={{ filter: "blur(3px)" }} />}
        <path className={lit ? "pf pf-outer" : undefined} fill={color}
          d="M12 27c-5 0-8.5-3.4-8.5-8 0-3.7 2.3-6.3 4.1-8.6.5 1.8 1.6 3 3 3.5-.4-4.1 1.4-8.1 4.9-10.7-.2 3.6 1.3 5.9 3 8.1 1.4 1.8 2.7 3.8 2.7 7C21.2 23.2 17.3 27 12 27z" />
        <path className={lit ? "pf pf-mid" : undefined} fill="#f59e0b"
          d="M12 26.2c-3.3 0-5.6-2.3-5.6-5.4 0-2.4 1.5-4.2 2.7-5.8.4 1.2 1.1 2 2 2.3-.2-2.8.9-5.4 3.2-7.2-.1 2.4.9 3.9 2 5.4.9 1.2 1.8 2.6 1.8 4.7 0 3.4-2.6 6-6.1 6z" />
        <path className={lit ? "pf pf-core" : undefined} fill="#fff4cc"
          d="M12 25.4c-1.8 0-3.1-1.3-3.1-3 0-1.5.9-2.6 1.7-3.6.3.7.7 1.1 1.2 1.3-.1-1.6.6-3 1.8-4-.1 1.4.5 2.3 1.1 3.1.5.7 1 1.5 1 2.6 0 2-1.5 3.6-3.7 3.6z" />
        {lit && EMBERS.map((e, i) => (
          <circle key={i} className="pf-ember" cx={e.x} cy="9" r="0.9" fill="#fde68a" style={{ ["--pf-dx" as string]: e.d, animationDelay: e.delay }} />
        ))}
      </svg>
    </span>
  )
})
