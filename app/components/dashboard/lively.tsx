"use client"
import { memo, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react"

// Small, shared bits of life for the Stats dashboard: numbers that count up,
// one-shot bursts, and a reduce-motion check. Everything animates with CSS or
// writes straight to the DOM, so nothing re-renders React per frame.

export const LIVELY_CSS = `
@keyframes livelyBurst { 0% { transform: translate(-50%,-50%) rotate(0deg) scale(.4); opacity: 0 } 15% { opacity: 1 } 100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(var(--rot)) scale(1); opacity: 0 } }
@keyframes livelyPop { 0% { transform: translate(-50%,-50%) scale(.3); opacity: .7 } 100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0 } }
@keyframes livelyFlicker { 0%,100% { transform: scale(1,1) skewX(0deg) } 20% { transform: scale(.97,1.04) skewX(-2deg) } 45% { transform: scale(1.02,.96) skewX(1.5deg) } 70% { transform: scale(.98,1.03) skewX(-1deg) } }
@keyframes livelyBreathe { 0%,100% { opacity: .55; transform: scale(.94) } 50% { opacity: .9; transform: scale(1.06) } }
@keyframes livelyFadeUp { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .lively-anim { animation: none !important } }
:root[data-reduce-motion="true"] .lively-anim { animation: none !important }
`

// ── Reduce motion ────────────────────────────────────────────────
// True when the OS asks for less motion or the app's own setting is on
// (page.tsx mirrors that setting onto <html data-reduce-motion>).
function readReduced() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.getAttribute('data-reduce-motion') === 'true'
}
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  mq?.addEventListener?.('change', cb)
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduce-motion'] })
  return () => { mq?.removeEventListener?.('change', cb); mo.disconnect() }
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, readReduced, () => false)
}

// ── Count-up number ──────────────────────────────────────────────
// Eases from whatever it showed last to `value`. Text is written to the DOM
// directly; pass a module-level `format` so the effect isn't restarted.
export const CountUp = memo(function CountUp({ value, format = String, duration = 1100 }: {
  value: number; format?: (n: number) => string; duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useRef(0)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    if (ref.current && !ref.current.textContent) ref.current.textContent = format(shown.current)
  }, [format])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = shown.current, to = value
    if (reduce || from === to) { shown.current = to; el.textContent = format(to); return }
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      shown.current = p < 1 ? from + (to - from) * eased : to
      el.textContent = format(p < 1 ? Math.round(shown.current) : to)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, reduce, format, duration])

  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }} />
})

// ── One-shot burst ───────────────────────────────────────────────
// Sparks (amber, for personal bests) or leaves (for closed rings) that fly
// out from the parent's anchor point once and fade. Renders nothing when
// motion is reduced. Position it with left/top on a relative parent.
const SPARK_COLORS = ['#d97706', '#f59e0b', '#fcd34d', '#fbbf24']
const LEAF_COLORS = ['#65a30d', '#84cc16', '#4d7c0f', '#a3e635', '#d97706']

export const Burst = memo(function Burst({ kind = 'spark', count = 10, radius = 26, left = '50%', top = '50%', delay = 0, colors }: {
  kind?: 'spark' | 'leaf'; count?: number; radius?: number; left?: number | string; top?: number | string; delay?: number; colors?: string[]
}) {
  const reduce = useReducedMotion()
  if (reduce) return null
  const palette = colors ?? (kind === 'leaf' ? LEAF_COLORS : SPARK_COLORS)
  return (
    <span aria-hidden style={{ position: 'absolute', left, top, width: 0, height: 0, pointerEvents: 'none', zIndex: 3 }}>
      <span className="lively-anim" style={{ position: 'absolute', left: 0, top: 0, width: radius * 1.3, height: radius * 1.3, borderRadius: '50%',
        border: `1.5px solid ${palette[0]}`, opacity: 0, animation: `livelyPop .7s ease-out ${delay}s both` }} />
      {Array.from({ length: count }, (_, i) => {
        const ang = (i / count) * Math.PI * 2 + (i % 2 ? 0.25 : -0.1)
        const dist = radius * (0.75 + ((i * 37) % 10) / 22)
        const leaf = kind === 'leaf'
        const w = leaf ? 7 : 4, h = leaf ? 4 : 4
        return (
          <span key={i} className="lively-anim" style={{
            position: 'absolute', left: 0, top: 0, width: w, height: h,
            borderRadius: leaf ? '0 80% 0 80%' : '50%',
            background: palette[i % palette.length],
            boxShadow: leaf ? 'none' : `0 0 6px ${palette[i % palette.length]}`,
            opacity: 0,
            ['--dx' as string]: `${Math.cos(ang) * dist}px`,
            ['--dy' as string]: `${Math.sin(ang) * dist + (leaf ? 6 : 0)}px`,
            ['--rot' as string]: `${leaf ? (i % 2 ? 160 : -140) : 0}deg`,
            animation: `livelyBurst ${leaf ? 1.25 : 0.9}s cubic-bezier(.15,.7,.3,1) ${delay + (i % 3) * 0.04}s both`,
          } as React.CSSProperties} />
        )
      })}
    </span>
  )
})

// ── Personal bests ───────────────────────────────────────────────
// Returns true when `value` beats the best stored under `key`. The check runs
// once per value per page load (cached), so two widgets showing the same best
// agree. The very first sighting is stored silently — nothing to celebrate.
const bestCache = new Map<string, boolean>()
const BEST_KEY = 'pulp-stats-bests'

function checkBest(key: string, value: number): boolean {
  const cacheKey = `${key}:${value}`
  const hit = bestCache.get(cacheKey)
  if (hit !== undefined) return hit
  let isNew = false
  try {
    const all = JSON.parse(localStorage.getItem(BEST_KEY) || '{}') as Record<string, number>
    const prev = all[key]
    isNew = prev !== undefined && value > prev
    if (prev === undefined || value > prev) {
      all[key] = value
      localStorage.setItem(BEST_KEY, JSON.stringify(all))
    }
  } catch {}
  bestCache.set(cacheKey, isNew)
  return isNew
}

export function usePersonalBest(key: string, value: number, ready: boolean) {
  const [isNew, setIsNew] = useState(false)
  useEffect(() => {
    if (!ready || value <= 0) return
    if (checkBest(key, value)) {
      const id = requestAnimationFrame(() => setIsNew(true))
      return () => cancelAnimationFrame(id)
    }
  }, [key, value, ready])
  return isNew
}

// ── Shared formatters (module-level so CountUp effects stay stable) ──
export const fmtInt = (n: number) => Math.round(n).toLocaleString()
export const fmtMinutes = (n: number) => {
  const m = Math.round(n)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}
export const fmtKilo = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toLocaleString())
export const fmtDays = (n: number) => `${Math.round(n)}d`
export const fmtMin = (n: number) => `${Math.round(n)}m`
