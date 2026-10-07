"use client"
import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "react"

// Growth vines for a focus session. They live in the empty gutters beside the
// notebook page: rooted bottom-left, climbing the left gutter, creeping along
// the bottom behind the page, then climbing the right gutter. Leaves, curls and
// (near the end) small blossoms appear as the session progresses.
//
// Progress comes from the CSS var --vine-p (0..1) set on the root by the page,
// so a timer tick never re-renders React. Each path draws inside its own
// progress window [s, e] via stroke-dashoffset on a normalized pathLength.

type Pt = { x: number; y: number }
type Stroke = { d: string; s: number; e: number; w: number }
type Leaf = { x: number; y: number; r: number; rot: number; at: number }
type Bloom = { x: number; y: number; at: number }
type Scene = { strokes: Stroke[]; leaves: Leaf[]; blooms: Bloom[] }

// Small deterministic RNG so a session's vines don't reshuffle on resize.
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Smooth path through points (Catmull-Rom → cubic Bézier).
function smooth(pts: Pt[]): string {
  if (pts.length < 2) return ""
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

// A curl that springs off a stem point, spiralling outward to one side.
function curl(from: Pt, side: 1 | -1, size: number, r: () => number): string {
  const pts: Pt[] = []
  const turns = 1.3 + r() * 0.5
  const steps = 14
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const ang = -Math.PI / 2 + side * t * turns * Math.PI * 2
    const rad = size * (1 - t * 0.75)
    pts.push({ x: from.x + side * size * t * 1.2 + Math.cos(ang) * rad * t, y: from.y - size * t * 0.6 + Math.sin(ang) * rad * t })
  }
  return smooth(pts)
}

interface Gutter { x0: number; x1: number }

// One climbing stem inside a gutter, with leaves and curls, drawn over [s, e].
function climb(g: Gutter, bottom: number, top: number, s: number, e: number, r: () => number, out: Scene) {
  const w = g.x1 - g.x0
  const amp = Math.min(w * 0.22, 26)
  const base = g.x0 + w * (0.35 + r() * 0.3)
  const phase = r() * Math.PI * 2
  const freq = 0.011 + r() * 0.006
  const pts: Pt[] = []
  for (let y = bottom; y >= top; y -= 36) {
    pts.push({ x: base + Math.sin(y * freq + phase) * amp + (r() - 0.5) * 4, y })
  }
  if (pts.length < 3) return
  out.strokes.push({ d: smooth(pts), s, e, w: 2 })
  const span = e - s
  const n = pts.length
  // leaves alternate sides every couple of segments, timed to when the stem reaches them
  let side: 1 | -1 = r() > 0.5 ? 1 : -1
  for (let i = 2; i < n - 1; i += 1 + Math.round(r())) {
    const p = pts[i]
    const at = s + span * (i / (n - 1))
    out.leaves.push({ x: p.x, y: p.y, r: 6 + r() * 4, rot: side * (35 + r() * 30), at })
    if (r() < 0.28 && w > 90) {
      const size = 9 + r() * 7
      out.strokes.push({ d: curl(p, side, size, r), s: at, e: Math.min(1, at + 0.06), w: 1.1 })
    }
    side = side === 1 ? -1 : 1
  }
  const tip = pts[n - 1]
  out.blooms.push({ x: tip.x, y: tip.y, at: Math.max(e, 0.9) })
  // a second, shorter offshoot from the lower third for fullness
  if (w > 110) {
    const j = Math.floor(n * (0.3 + r() * 0.2))
    const from = pts[j]
    const dir = from.x - g.x0 > w / 2 ? -1 : 1
    const branch: Pt[] = [from]
    for (let k = 1; k <= 5; k++) branch.push({ x: from.x + dir * k * Math.min(w * 0.09, 14), y: from.y - k * 26 + (r() - 0.5) * 6 })
    const bs = s + span * (j / (n - 1))
    const be = Math.min(1, bs + span * 0.35)
    out.strokes.push({ d: smooth(branch), s: bs, e: be, w: 1.4 })
    const bt = branch[branch.length - 1]
    out.leaves.push({ x: bt.x, y: bt.y, r: 6 + r() * 3, rot: dir * 50, at: be })
    out.blooms.push({ x: bt.x, y: bt.y, at: Math.max(be, 0.94) })
  }
}

function buildScene(vw: number, vh: number, left: Gutter | null, right: Gutter | null, seed: number): Scene {
  const r = rng(seed)
  const out: Scene = { strokes: [], leaves: [], blooms: [] }
  const bottom = vh - 6
  const top = vh * (0.1 + r() * 0.06)
  if (left) climb(left, bottom, top, 0, 0.5, r, out)
  // creeping runner along the bottom, passing behind the page
  if (left && right) {
    const startX = left.x0 + (left.x1 - left.x0) * 0.45
    const endX = right.x0 + (right.x1 - right.x0) * 0.5
    const pts: Pt[] = []
    const steps = Math.max(6, Math.round((endX - startX) / 60))
    for (let i = 0; i <= steps; i++) {
      const x = startX + ((endX - startX) * i) / steps
      pts.push({ x, y: bottom - 6 - Math.sin(i * 1.3 + seed) * 5 - (r() * 3) })
    }
    out.strokes.push({ d: smooth(pts), s: 0.3, e: 0.62, w: 1.6 })
    for (let i = 1; i < steps; i += 2) {
      const p = pts[i]
      out.leaves.push({ x: p.x, y: p.y, r: 5 + r() * 3, rot: -90 + (r() - 0.5) * 70, at: 0.3 + 0.32 * (i / steps) })
    }
  }
  if (right) climb(right, bottom, top + vh * 0.05, left ? 0.55 : 0, left ? 0.95 : 0.6, r, out)
  return out
}

type Rect = { x: number; y: number; w: number; h: number }
type Box = { vw: number; vh: number; left: Gutter | null; right: Gutter | null; holes: Rect[] }

// Vines pass *behind* the page and the timer panel: those rects are masked out.
function holesFor(page: DOMRect): Rect[] {
  const rects = [page, ...Array.from(document.querySelectorAll<HTMLElement>("[data-vine-avoid]")).map(el => el.getBoundingClientRect())]
  return rects.filter(r => r.width > 0 && r.height > 0).map(r => ({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }))
}

function measure(leftInset: number): Box {
  const vw = window.innerWidth, vh = window.innerHeight
  const page = document.getElementById("pulp-page-surface") || document.getElementById("editor-paper")
  if (!page) return { vw, vh, left: null, right: null, holes: [] }
  const pr = page.getBoundingClientRect()
  // left gutter starts where the sidebar ends
  const pad = 14
  const lg = { x0: leftInset + pad, x1: pr.left - pad }
  const rg = { x0: pr.right + pad, x1: vw - pad }
  return { vw, vh, left: lg.x1 - lg.x0 >= 56 ? lg : null, right: rg.x1 - rg.x0 >= 56 ? rg : null, holes: holesFor(pr) }
}

const Scenery = memo(function Scenery({ scene, dark, reduceMotion }: { scene: Scene; dark: boolean; reduceMotion?: boolean }) {
  const stem = dark ? "rgba(120,170,100,0.42)" : "rgba(62,110,48,0.55)"
  const leaf = dark ? "rgba(110,175,90,0.38)" : "rgba(76,132,56,0.5)"
  const bloom = dark ? "rgba(245,180,90,0.75)" : "rgba(217,119,6,0.6)"
  const ease = reduceMotion ? "none" : undefined
  return (
    <>
      {scene.strokes.map((st, i) => (
        <path key={`s${i}`} d={st.d} fill="none" stroke={stem} strokeWidth={st.w} strokeLinecap="round" pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: `calc(1 - clamp(0, (var(--vine-p) - ${st.s.toFixed(3)}) / ${Math.max(0.001, st.e - st.s).toFixed(3)}, 1))`,
            transition: ease ?? "stroke-dashoffset 1.1s linear",
          }}
        />
      ))}
      {scene.leaves.map((l, i) => (
        <g key={`l${i}`} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(0)})`}>
          <path
            d={`M0 0 C ${l.r * 0.65} ${-l.r * 0.5}, ${l.r * 0.9} ${-l.r * 1.4}, 0 ${-l.r * 1.9} C ${-l.r * 0.9} ${-l.r * 1.4}, ${-l.r * 0.65} ${-l.r * 0.5}, 0 0 Z`}
            fill={leaf}
            style={{
              transformOrigin: "0 0",
              transform: `scale(clamp(0, calc((var(--vine-p) - ${l.at.toFixed(3)}) * 14), 1))`,
              transition: ease ?? "transform 700ms cubic-bezier(0.2,1.3,0.4,1)",
            }}
          />
        </g>
      ))}
      {scene.blooms.map((b, i) => (
        <g key={`b${i}`} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
          <g style={{
            transformOrigin: "0 0",
            transform: `scale(clamp(0, calc((var(--vine-p) - ${b.at.toFixed(3)}) * 20), 1))`,
            transition: ease ?? "transform 900ms cubic-bezier(0.2,1.4,0.4,1)",
          }}>
            {[0, 72, 144, 216, 288].map(a => (
              <ellipse key={a} cx={0} cy={-3.2} rx={2.1} ry={3.4} fill={bloom} transform={`rotate(${a})`} />
            ))}
            <circle r={1.6} fill={dark ? "#fde68a" : "#fbbf24"} />
          </g>
        </g>
      ))}
    </>
  )
})

export const VinesOverlay = forwardRef<HTMLDivElement, { visible: boolean; theme?: "light" | "dark"; reduceMotion?: boolean; leftInset?: number }>(
  function VinesOverlay({ visible, theme = "dark", reduceMotion, leftInset = 0 }, ref) {
    const [box, setBox] = useState<(Box & { seed: number }) | null>(null)
    const seedRef = useRef(1)

    // New shape each session (only when it turns on, not on every resize).
    useEffect(() => { if (visible) seedRef.current = Math.floor(Math.random() * 1e9) }, [visible])

    // Keep measuring the gutters while showing: sidebar toggles, zoom and
    // resizes move the page around.
    useEffect(() => {
      if (!visible) return
      let last = ""
      const update = () => {
        const m = measure(leftInset)
        const key = `${seedRef.current}|${m.vw}|${m.vh}|${m.left?.x0}|${m.left?.x1}|${m.right?.x0}|${m.right?.x1}|${m.holes.map(h => `${h.x},${h.y},${h.w},${h.h}`).join(";")}`
        if (key !== last) { last = key; setBox({ ...m, seed: seedRef.current }) }
      }
      const first = requestAnimationFrame(update)
      const id = setInterval(update, 700)
      window.addEventListener("resize", update)
      return () => { cancelAnimationFrame(first); clearInterval(id); window.removeEventListener("resize", update) }
    }, [visible, leftInset])

    const scene = useMemo(
      () => (box ? buildScene(box.vw, box.vh, box.left, box.right, box.seed) : null),
      [box],
    )

    return (
      <div
        ref={ref}
        aria-hidden
        data-vines
        style={{
          position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
          opacity: visible ? 1 : 0, transition: "opacity 1.2s ease",
          // @ts-expect-error custom property
          "--vine-p": 0,
        }}
      >
        {scene && (
          <svg width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
            <defs>
              <mask id="pulp-vine-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={box!.vw} height={box!.vh}>
                <rect x="0" y="0" width={box!.vw} height={box!.vh} fill="white" />
                {box!.holes.map((h, i) => <rect key={i} x={h.x - 2} y={h.y - 2} width={h.w + 4} height={h.h + 4} rx={8} fill="black" />)}
              </mask>
            </defs>
            <g mask="url(#pulp-vine-mask)">
              <Scenery scene={scene} dark={theme === "dark"} reduceMotion={reduceMotion} />
            </g>
          </svg>
        )}
      </div>
    )
  },
)
