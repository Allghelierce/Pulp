"use client"
import { forwardRef } from "react"

// Growth vines rooted at the focus button (bottom-left), spreading up the left
// margin and arcing across the page. The colored stroke "fills" from root to tip
// as the focus timer progresses, driven by the CSS var --vine-p (0..1) set
// imperatively on the root — no React re-render per tick.
//
// Each path uses pathLength="1" so dashoffset works in normalized 0..1 space.

// Coordinate space ~ viewport (1440 x 960), anchored bottom-left. Root is at the
// focus button (~150, 910). Vines climb the left margin and arc across the top.
const ROOT_X = 150, ROOT_Y = 912
const VINES: { d: string; delay: number; width: number }[] = [
  // main stem: focus button → up the left margin
  { d: `M${ROOT_X} ${ROOT_Y} C 120 780, 175 700, 150 600 C 128 510, 185 440, 165 340 C 150 250, 200 190, 190 90`, delay: 0, width: 3.2 },
  // branch arcing across the top of the page
  { d: "M172 470 C 300 430, 470 470, 640 400 C 800 335, 940 400, 1120 330", delay: 0.28, width: 2.4 },
  // low branch sweeping right along the base
  { d: `M${ROOT_X} ${ROOT_Y} C 320 890, 560 930, 820 880 C 980 850, 1080 900, 1240 860`, delay: 0.12, width: 2.4 },
  // upper tendril curling right
  { d: "M188 150 C 320 150, 470 180, 560 120 C 630 74, 690 120, 780 96", delay: 0.55, width: 1.8 },
]

// Leaves sit on points along the vines; `at` is when they pop (progress).
const LEAVES: { x: number; y: number; r: number; at: number; rot: number }[] = [
  { x: 150, y: 600, r: 15, at: 0.16, rot: -34 },
  { x: 165, y: 340, r: 14, at: 0.34, rot: 22 },
  { x: 470, y: 470, r: 14, at: 0.45, rot: 14 },
  { x: 640, y: 400, r: 13, at: 0.58, rot: -18 },
  { x: 560, y: 905, r: 13, at: 0.30, rot: 12 },
  { x: 1120, y: 330, r: 14, at: 0.82, rot: -22 },
  { x: 1240, y: 860, r: 13, at: 0.70, rot: 20 },
  { x: 190, y: 90, r: 15, at: 0.66, rot: -8 },
  { x: 780, y: 96, r: 13, at: 0.95, rot: 16 },
]

const GREEN = "#4b9b3a"
const GREEN_DEEP = "#2f6b24"

export const VinesOverlay = forwardRef<HTMLDivElement, { visible: boolean }>(function VinesOverlay({ visible }, ref) {
  return (
    <div
      ref={ref}
      aria-hidden
      data-vines
      style={{
        position: "fixed", inset: 0, zIndex: 5, pointerEvents: "none",
        opacity: visible ? 1 : 0, transition: "opacity 600ms ease",
        // @ts-expect-error custom property
        "--vine-p": 0,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 1440 960" preserveAspectRatio="xMinYMax slice" style={{ display: "block" }}>
        <defs>
          <linearGradient id="vine-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={GREEN_DEEP} />
            <stop offset="100%" stopColor={GREEN} />
          </linearGradient>
        </defs>
        {/* faint always-on outlines */}
        {VINES.map((v, i) => (
          <path key={`o${i}`} d={v.d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={v.width} strokeLinecap="round" pathLength={1} />
        ))}
        {/* colored fill, drawn by progress */}
        {VINES.map((v, i) => (
          <path
            key={`c${i}`}
            d={v.d}
            fill="none"
            stroke="url(#vine-grad)"
            strokeWidth={v.width}
            strokeLinecap="round"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              // remaining branches wait for their delay before drawing
              strokeDashoffset: `calc(1 - max(0, (var(--vine-p) - ${v.delay}) / ${(1 - v.delay).toFixed(3)}))`,
              transition: "stroke-dashoffset 1.1s linear",
            }}
          />
        ))}
        {/* leaves pop in once progress passes their point */}
        {LEAVES.map((l, i) => (
          <g key={`l${i}`} transform={`translate(${l.x} ${l.y}) rotate(${l.rot})`}
            style={{
              transformOrigin: `${l.x}px ${l.y}px`,
              opacity: `clamp(0, calc((var(--vine-p) - ${l.at}) * 12), 1)`,
              scale: `clamp(0, calc((var(--vine-p) - ${l.at}) * 12), 1)`,
              transition: "opacity 500ms ease, scale 500ms cubic-bezier(0.2,1.4,0.4,1)",
            }}
          >
            <path d={`M0 0 C ${l.r * 0.7} ${-l.r * 0.9}, ${l.r} ${-l.r * 0.2}, 0 ${l.r * 0.5} C ${-l.r} ${-l.r * 0.2}, ${-l.r * 0.7} ${-l.r * 0.9}, 0 0 Z`} fill="url(#vine-grad)" />
            <path d={`M0 ${l.r * 0.4} L0 ${-l.r * 0.4}`} stroke={GREEN_DEEP} strokeWidth={0.8} />
          </g>
        ))}
      </svg>
    </div>
  )
})
