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
          delay: random() * 380 + k * 110,
          dur: 700 + Math.min(420, dist * 0.4),
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

    // Smoothly tween the shown numbers toward a target (eases between landings).
    let shown = 0, target = 0
    const render = () => {
      shown += (target - shown) * 0.22
      if (Math.abs(target - shown) < 0.5) shown = target
      if (plusRef.current) plusRef.current.textContent = `+${fmt(shown)}`
      if (totalRef.current) totalRef.current.textContent = fmt(run.startTotal + shown)
      if (shown !== target) raf = requestAnimationFrame(render)
      else raf = 0
    }
    const setTarget = (v: number) => { target = v; if (!raf) raf = requestAnimationFrame(render) }

    const label = labelRef.current
    if (label) anims.push(label.animate(
      [{ opacity: 0, transform: "translateY(8px) scale(.92)" }, { opacity: 1, transform: "none" }],
      { duration: reduceMotion ? 1 : 260, delay: reduceMotion ? 0 : 150, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" },
    ))

    let finish = 0
    if (!drops.length) {
      // Nothing to fly in (reduced motion, or no trees on screen): just count.
      timers.push(setTimeout(() => { setTarget(run.sap); commit() }, reduceMotion ? 0 : 350))
      finish = (reduceMotion ? 0 : 350) + HOLD_MS + 300
    } else {
      const els = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-sap-drop]") || [])
      const lands = drops.map(d => d.delay + d.dur).sort((a, b) => a - b)
      const per = run.sap / drops.length
      drops.forEach((d, i) => {
        const el = els[i]
        if (!el) return
        el.style.offsetPath = `path("M${d.sx.toFixed(1)} ${d.sy.toFixed(1)} Q${d.mx.toFixed(1)} ${d.my.toFixed(1)} ${run.center.x.toFixed(1)} ${run.center.y.toFixed(1)}")`
        anims.push(el.animate(
          [
            { offsetDistance: "0%", opacity: 0, transform: "scale(.5)" },
            { offset: 0.15, opacity: 1, transform: "scale(1.1)" },
            { offset: 0.85, opacity: 1, transform: "scale(.85)" },
            { offsetDistance: "100%", opacity: 0, transform: "scale(.4)" },
          ],
          { duration: d.dur, delay: d.delay, easing: "cubic-bezier(.45,.05,.75,.45)", fill: "both" },
        ))
      })
      // Each landing adds its share and pulses the center glow.
      lands.forEach((t, i) => timers.push(setTimeout(() => {
        setTarget(i === lands.length - 1 ? run.sap : per * (i + 1))
        glowRef.current?.animate(
          [{ transform: "scale(.85)", opacity: 0.55 }, { transform: "scale(1.15)", opacity: 0.9 }, { transform: "scale(1)", opacity: 0.6 }],
          { duration: 320, easing: "ease-out" },
        )
        if (i === lands.length - 1) commit()
      }, t)))
      finish = lands[lands.length - 1] + HOLD_MS
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
            offsetRotate: "0deg", offsetAnchor: "center", opacity: 0, willChange: "offset-distance, transform, opacity",
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
