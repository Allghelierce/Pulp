"use client"
import { DotLoader } from "@/components/ui/dot-loader"

const FRAMES = [
  [14, 7, 0, 8, 6, 13, 20],
  [14, 7, 13, 20, 16, 27, 21],
  [14, 20, 27, 21, 34, 24, 28],
  [27, 21, 34, 28, 41, 32, 35],
  [34, 28, 41, 35, 48, 40, 42],
  [34, 28, 41, 35, 48, 42, 46],
  [34, 28, 41, 35, 48, 42, 38],
  [34, 28, 41, 35, 48, 30, 21],
  [34, 28, 41, 48, 21, 22, 14],
  [34, 28, 41, 21, 14, 16, 27],
  [34, 28, 21, 14, 10, 20, 27],
  [28, 21, 14, 4, 13, 20, 27],
  [28, 21, 14, 12, 6, 13, 20],
  [28, 21, 14, 6, 13, 20, 11],
  [28, 21, 14, 6, 13, 20, 10],
  [14, 6, 13, 20, 9, 7, 21],
]

type Variant = "fullscreen" | "panel" | "inline"

const LoaderDots = () => (
  <>
    <DotLoader
      frames={FRAMES}
      duration={90}
      dotClassName="pulp-dot bg-orange-500/25 size-1.5"
      className="gap-0.5"
    />
    <style>{`
      .pulp-dot.active {
        background: transparent !important;
        display: flex; align-items: center; justify-content: center;
        font-size: 6px; line-height: 1;
        animation: pulp-spin 2s linear infinite;
      }
      .pulp-dot.active::after { content: '🍊'; }
      @keyframes pulp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `}</style>
  </>
)

export function PulpLoader({ variant = "panel" }: { variant?: Variant }) {
  if (variant === "fullscreen") {
    return (
      <div className="h-screen bg-[#0e0c0b] flex flex-col items-center justify-center gap-5">
        <LoaderDots />
      </div>
    )
  }
  if (variant === "inline") {
    return (
      <div className="w-full flex items-center justify-center py-6">
        <LoaderDots />
      </div>
    )
  }
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0e0c0b]/70">
      <LoaderDots />
    </div>
  )
}
