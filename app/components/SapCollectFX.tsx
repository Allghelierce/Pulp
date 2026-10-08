"use client"
import { memo, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"

export interface SapCollectRun {
  id: number
  sources: { x: number; y: number }[]   // screen positions of producing trees
  center: { x: number; y: number }      // where the sap gathers (screen center of the grove)
  sap: number
  gems: number
  startTotal: number                    // sap balance before this collect
}

const MAX_DROPS = 28
const HOLD_MS = 1100      // how long the result stays after the last drop lands

// Seeded by the run id so a run's beads are stable across re-renders.
function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

type Drop = { sx: number; sy: number; mx: number; my: number; delay: number; dur: number; size: number }

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const STEPS = 18 // keyframes per bead curve — transform-only, so it runs on the compositor

// A bead's flight as transform keyframes along its quadratic curve: eased in and
// out along the path, fading/scaling in at the start and shrinking into the center.
function flight(d: Drop, cx: number, cy: number): Keyframe[] {
  const frames: Keyframe[] = []
  for (let i = 0; i <= STEPS; i++) {
    const u = i / STEPS
    const t = easeInOutCubic(u)
    const x = (1 - t) * (1 - t) * d.sx + 2 * (1 - t) * t * d.mx + t * t * cx
    const y = (1 - t) * (1 - t) * d.sy + 2 * (1 - t) * t * d.my + t * t * cy
    const scale = u < 0.2 ? 0.55 + (u / 0.2) * 0.5 : u > 0.8 ? 1.05 - ((u - 0.8) / 0.2) * 0.65 : 1.05 - ((u - 0.2) / 0.6) * 0.15
    const opacity = u < 0.15 ? u / 0.15 : u > 0.88 ? Math.max(0, (1 - u) / 0.12) : 1
    frames.push({ offset: u, transform: `translate(${(x - d.size / 2).toFixed(1)}px, ${(y - d.size / 2).toFixed(1)}px) scale(${scale.toFixed(3)})`, opacity })
  }
  return frames
}

// "Collect all": sap beads curve in from the trees (CSS motion path, so the
// browser animates them, not React). "+N sap" and the new balance count up as
// beads actually land, the center glows with each one, then it floats away.
// The sap itself is added once, via onLanded, when the drops arrive (or on
// unmount if the user leaves early) so the app re-renders once, not per frame.
export const SapCollectFX = memo(function SapCollectFX({ run, reduceMotion, onLanded, onDone }: {
  run: SapCollectRun | null
  reduceMotion?: boolean
  onLanded: (run: SapCollectRun) => void
  onDone: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const plusRef = useRef<HTMLSpanElement>(null)
  const totalRef = useRef<HTMLSpanElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  // Runs whose sap was already handed over (effects can re-run, e.g. React dev double-mount)
  const committedRef = useRef<Set<number>>(new Set())
  // Latest callbacks without restarting the animation when the parent re-renders
  // (landing the sap re-renders the orchard, which hands us new functions).
  const landedCb = useRef(onLanded)
  const doneCb = useRef(onDone)
  useEffect(() => { landedCb.current = onLanded; doneCb.current = onDone }, [onLanded, onDone])

  const drops = useMemo<Drop[]>(() => {
    if (!run || reduceMotion || !run.sources.length) return []
    const perTree = Math.max(1, Math.min(2, Math.floor(MAX_DROPS / run.sources.length)))
    const out: Drop[] = []
    const random = rng(run.id)
    run.sources.slice(0, MAX_DROPS).forEach(s => {
      for (let k = 0; k < perTree && out.length < MAX_DROPS; k++) {
        const dx = run.center.x - s.x, dy = run.center.y - s.y
        const dist = Math.hypot(dx, dy) || 1
        // Bow the curve sideways and up so beads swirl in rather than fly straight.
        const bow = (0.2 + random() * 0.2) * dist * (random() < 0.5 ? -1 : 1)
        out.push({
          sx: s.x + (random() - 0.5) * 14, sy: s.y - 8 - random() * 16,
          mx: s.x + dx * 0.5 + (-dy / dist) * bow,
          my: s.y + dy * 0.5 + (dx / dist) * bow - 30 - random() * 50,
          delay: random() * 420 + k * 120,
          dur: 820 + Math.min(460, dist * 0.45),
          size: 5 + random() * 3.5,
        })
      }
    })
    return out
  }, [run, reduceMotion])

  useEffect(() => {
    if (!run) return
    const fmt = (n: number) => Math.round(n).toLocaleString()
    const commit = () => {
      if (committedRef.current.has(run.id)) return
      committedRef.current.add(run.id)
      landedCb.current(run)
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    const anims: Animation[] = []
    let raf = 0

    // Count up smoothly over a time window (eased), not in steps per landing.
    const showValue = (v: number) => {
      if (plusRef.current) plusRef.current.textContent = `+${fmt(v)}`
      if (totalRef.current) totalRef.current.textContent = fmt(run.startTotal + v)
    }
    const countUp = (from: number, ms: number) => {
      const t0 = performance.now() + from
      const tick = (now: number) => {
        const p = Math.min(1, Math.max(0, (now - t0) / ms))
        showValue(run.sap * easeOutCubic(p))
        raf = p < 1 ? requestAnimationFrame(tick) : 0
      }
      raf = requestAnimationFrame(tick)
    }

    const label = labelRef.current
    if (label) anims.push(label.animate(
      [{ opacity: 0, transform: "translateY(8px) scale(.92)" }, { opacity: 1, transform: "none" }],
      { duration: reduceMotion ? 1 : 260, delay: reduceMotion ? 0 : 150, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" },
    ))

    let finish = 0
    if (!drops.length) {
      // Nothing to fly in (reduced motion, or no trees on screen): just count.
      const wait = reduceMotion ? 0 : 350
      if (reduceMotion) { showValue(run.sap); commit() } else { countUp(wait, 600); timers.push(setTimeout(commit, wait + 600)) }
      finish = wait + (reduceMotion ? 0 : 600) + HOLD_MS
    } else {
      const els = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-sap-drop]") || [])
      const lands = drops.map(d => d.delay + d.dur)
      const firstLand = Math.min(...lands), lastLand = Math.max(...lands)
      drops.forEach((d, i) => {
        const el = els[i]
        if (!el) return
        anims.push(el.animate(flight(d, run.center.x, run.center.y), { duration: d.dur, delay: d.delay, easing: "linear", fill: "both" }))
      })
      // The count runs from the first landing to just after the last, eased.
      countUp(firstLand, lastLand - firstLand + 350)
      // One continuous swell of the center glow while sap pours in, then a soft settle.
      const glow = glowRef.current
      if (glow) anims.push(glow.animate(
        [{ transform: "scale(.8)", opacity: 0.35 }, { transform: "scale(1.18)", opacity: 0.9, offset: 0.75 }, { transform: "scale(1)", opacity: 0.65 }],
        { duration: lastLand - firstLand + 700, delay: Math.max(0, firstLand - 150), easing: "cubic-bezier(.4,0,.2,1)", fill: "both" },
      ))
      timers.push(setTimeout(commit, lastLand + 350))
      finish = lastLand + 350 + HOLD_MS
    }

    // Float away and finish
    timers.push(setTimeout(() => {
      const root = rootRef.current
      if (root) anims.push(root.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-14px)" }], { duration: reduceMotion ? 150 : 450, easing: "ease-in", fill: "forwards" }))
    }, finish))
    timers.push(setTimeout(() => doneCb.current(), finish + (reduceMotion ? 160 : 470)))

    return () => {
      timers.forEach(clearTimeout)
      anims.forEach(a => a.cancel())
      if (raf) cancelAnimationFrame(raf)
      commit() // never lose sap if the view closes mid-animation
    }
  }, [run, drops, reduceMotion])

  if (!run || typeof document === "undefined") return null
  const { x: cx, y: cy } = run.center

  return createPortal(
    <div ref={rootRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }}>
      {drops.map((d, i) => (
        <div
          key={`${run.id}-${i}`}
          data-sap-drop
          style={{
            position: "absolute", left: 0, top: 0, width: d.size, height: d.size, borderRadius: "50%",
            opacity: 0, willChange: "transform, opacity",
            background: "radial-gradient(circle at 35% 35%, #fde68a, #f59e0b 60%, #d97706)",
            boxShadow: "0 0 6px 1px rgba(245,158,11,0.45)",
          } as React.CSSProperties}
        />
      ))}

      {/* soft glow where the sap gathers; pulses as each bead lands */}
      <div ref={glowRef} style={{
        position: "absolute", left: cx - 36, top: cy - 36, width: 72, height: 72, borderRadius: "50%", opacity: 0.6,
        background: "radial-gradient(circle, rgba(253,230,138,0.45), rgba(245,158,11,0.12) 55%, transparent 70%)",
      }} />

      <div style={{ position: "absolute", left: cx, top: cy - 14, width: 0, display: "flex", justifyContent: "center" }}>
        <div ref={labelRef} style={{ textAlign: "center", fontFamily: "Crimson Pro, serif", whiteSpace: "nowrap", opacity: 0 }}>
          <div style={{ fontSize: 24, lineHeight: 1, color: "#fde68a", textShadow: "0 1px 6px rgba(0,0,0,0.6)", fontVariantNumeric: "tabular-nums" }}>
            <span ref={plusRef}>+0</span> <span style={{ fontSize: 14 }}>sap</span>
          </div>
          <div style={{ marginTop: 5, fontSize: 13, color: "rgba(255,247,230,0.85)", textShadow: "0 1px 5px rgba(0,0,0,0.6)", fontVariantNumeric: "tabular-nums" }}>
            <span ref={totalRef}>{run.startTotal.toLocaleString()}</span> total
          </div>
          {run.gems > 0 && (
            <div style={{ marginTop: 4, fontSize: 14, color: "#67e8f9", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>+{run.gems} gems</div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
})
