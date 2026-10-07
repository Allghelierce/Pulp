"use client"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"

export interface SapCollectRun {
  id: number
  sources: { x: number; y: number }[]   // screen positions of producing trees
  center: { x: number; y: number }      // where the sap gathers (screen center of the grove)
  sap: number
  gems: number
}

// Timeline (ms): drops fly in 0–1000, count ramps 400–1200, fade out by DONE_MS.
const DONE_MS = 1800
const MAX_DROPS = 28

// "Collect all": a few small sap beads arc in from the trees, and a modest
// "+N sap" counts up and floats away. Kept light on purpose — no orb or burst.
export const SapCollectFX = memo(function SapCollectFX({ run, reduceMotion, onDone }: {
  run: SapCollectRun | null
  reduceMotion?: boolean
  onDone: () => void
}) {
  const [shown, setShown] = useState(0)
  const raf = useRef<number | null>(null)

  // Drops: a few per tree (capped), each on a curved path into the center.
  const drops = useMemo(() => {
    if (!run || reduceMotion || !run.sources.length) return []
    const perTree = Math.max(1, Math.min(2, Math.floor(MAX_DROPS / run.sources.length)))
    const out: { key: string; sx: number; sy: number; mx: number; my: number; delay: number; dur: number; size: number }[] = []
    run.sources.slice(0, MAX_DROPS).forEach((s, i) => {
      for (let k = 0; k < perTree && out.length < MAX_DROPS; k++) {
        const dx = run.center.x - s.x, dy = run.center.y - s.y
        const dist = Math.hypot(dx, dy) || 1
        // Bow the path sideways (perpendicular) and up, so drops swirl in.
        const bow = (0.18 + Math.random() * 0.22) * dist * (Math.random() < 0.5 ? -1 : 1)
        const mx = s.x + dx * 0.5 + (-dy / dist) * bow
        const my = s.y + dy * 0.5 + (dx / dist) * bow - 40 - Math.random() * 60
        out.push({
          key: `${run.id}-${i}-${k}`,
          sx: s.x + (Math.random() - 0.5) * 16, sy: s.y - 10 - Math.random() * 20,
          mx, my,
          delay: Math.random() * 420 + k * 90,
          dur: 620 + Math.min(380, dist * 0.35),
          size: 5 + Math.random() * 4,
        })
      }
    })
    return out
  }, [run, reduceMotion])

  // Count up as the sap lands, then finish.
  useEffect(() => {
    if (!run) return
    const start = performance.now()
    const from = reduceMotion ? 0 : 400, to = reduceMotion ? 500 : 1200
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start - from) / (to - from)))
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(run.sap * eased))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    const done = setTimeout(onDone, reduceMotion ? 1200 : DONE_MS)
    return () => { if (raf.current) cancelAnimationFrame(raf.current); clearTimeout(done) }
  }, [run, reduceMotion, onDone])

  if (!run || typeof document === "undefined") return null
  const { x: cx, y: cy } = run.center

  return createPortal(
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }}>
      {drops.map(d => (
        <motion.div
          key={d.key}
          initial={{ x: d.sx, y: d.sy, opacity: 0, scale: 0.4 }}
          animate={{ x: [d.sx, d.mx, cx], y: [d.sy, d.my, cy], opacity: [0, 1, 1, 0], scale: [0.4, 1.1, 0.5] }}
          transition={{
            duration: d.dur / 1000, delay: d.delay / 1000, ease: [0.45, 0, 0.85, 0.4],
            opacity: { duration: d.dur / 1000, delay: d.delay / 1000, times: [0, 0.15, 0.85, 1] },
          }}
          style={{
            position: "absolute", left: 0, top: 0, marginLeft: -d.size / 2, marginTop: -d.size / 2,
            width: d.size, height: d.size, borderRadius: "50%",
            background: "#f59e0b",
            boxShadow: "0 0 6px 1px rgba(245,158,11,0.5)",
          }}
        />
      ))}

      {/* Total (static wrapper centers it; the motion child owns transform) */}
      <div style={{ position: "absolute", left: cx, top: cy - 12, width: 0, display: "flex", justifyContent: "center" }}>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -20], scale: [0.9, 1, 1, 1] }}
        transition={{ duration: DONE_MS / 1000, times: [0, 0.2, 0.8, 1], ease: "easeOut" }}
        style={{ textAlign: "center", fontFamily: "Crimson Pro, serif", whiteSpace: "nowrap" }}
      >
        <div style={{ fontSize: 22, lineHeight: 1, color: "#fde68a", textShadow: "0 1px 6px rgba(0,0,0,0.6)", fontVariantNumeric: "tabular-nums" }}>
          +{shown} <span style={{ fontSize: 14 }}>sap</span>
        </div>
        {run.gems > 0 && (
          <div style={{ marginTop: 4, fontSize: 14, color: "#67e8f9", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>+{run.gems} gems</div>
        )}
      </motion.div>
      </div>
    </div>,
    document.body,
  )
})
