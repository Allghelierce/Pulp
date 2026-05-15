"use client"

import { useRef, useEffect } from "react"

interface TimerTreeGrowthProps {
  elapsed: number
  total: number
  running: boolean
  theme: "light" | "dark"
  accent: string
}

export function TimerTreeGrowth({ elapsed, total, running, theme, accent }: TimerTreeGrowthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const progress = total > 0 ? Math.min(1, elapsed / total) : 0
  const isDark = theme === "dark"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw tree based on progress
    const centerX = width / 2
    const baseY = height * 0.75

    // Trunk - always visible
    const trunkThickness = Math.max(2, 8 - progress * 2)
    ctx.strokeStyle = `hsl(25, 60%, ${isDark ? 40 : 35}%)`
    ctx.lineWidth = trunkThickness
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(centerX, baseY)
    ctx.lineTo(centerX, baseY - 60)
    ctx.stroke()

    // Left branch - appears at 20% progress
    if (progress > 0.2) {
      const branchProgress = Math.min(1, (progress - 0.2) / 0.8)
      const leftLen = 40 * branchProgress
      const leftThickness = 5 * branchProgress
      ctx.strokeStyle = `hsl(25, 55%, ${isDark ? 45 : 40}%)`
      ctx.lineWidth = leftThickness
      ctx.beginPath()
      ctx.moveTo(centerX, baseY - 35)
      ctx.lineTo(centerX - leftLen, baseY - 35 + leftLen * 0.5)
      ctx.stroke()

      // Sub-branches on left
      if (branchProgress > 0.5) {
        const subProgress = (branchProgress - 0.5) / 0.5
        ctx.strokeStyle = `hsl(100, 50%, ${isDark ? 50 : 45}%)`
        ctx.lineWidth = Math.max(1, 3 * subProgress)
        ctx.beginPath()
        ctx.moveTo(centerX - leftLen * 0.6, baseY - 35 + leftLen * 0.3)
        ctx.lineTo(centerX - leftLen * 0.8, baseY - 35 + leftLen * 0.15)
        ctx.stroke()
      }
    }

    // Right branch - appears at 40% progress
    if (progress > 0.4) {
      const branchProgress = Math.min(1, (progress - 0.4) / 0.6)
      const rightLen = 40 * branchProgress
      const rightThickness = 5 * branchProgress
      ctx.strokeStyle = `hsl(25, 55%, ${isDark ? 45 : 40}%)`
      ctx.lineWidth = rightThickness
      ctx.beginPath()
      ctx.moveTo(centerX, baseY - 50)
      ctx.lineTo(centerX + rightLen, baseY - 50 + rightLen * 0.5)
      ctx.stroke()

      // Sub-branches on right
      if (branchProgress > 0.5) {
        const subProgress = (branchProgress - 0.5) / 0.5
        ctx.strokeStyle = `hsl(100, 50%, ${isDark ? 50 : 45}%)`
        ctx.lineWidth = Math.max(1, 3 * subProgress)
        ctx.beginPath()
        ctx.moveTo(centerX + rightLen * 0.6, baseY - 50 + rightLen * 0.3)
        ctx.lineTo(centerX + rightLen * 0.8, baseY - 50 + rightLen * 0.15)
        ctx.stroke()
      }
    }

    // Crown/foliage - appears at 60% progress
    if (progress > 0.6) {
      const foliageProgress = Math.min(1, (progress - 0.6) / 0.4)
      const cx = centerX
      const cy = baseY - 75

      // Draw an organic, jagged canopy using a closed path (no circles)
      const spread = 55 * foliageProgress
      const height = 60 * foliageProgress

      ctx.fillStyle = `hsla(120, 45%, ${isDark ? 28 : 38}%, ${0.55 * foliageProgress})`
      ctx.strokeStyle = `hsla(120, 40%, ${isDark ? 25 : 32}%, ${0.3 * foliageProgress})`
      ctx.lineWidth = 1.2

      ctx.beginPath()
      ctx.moveTo(cx, cy - height)                          // top point
      ctx.lineTo(cx + spread * 0.35, cy - height * 0.55)  // upper right
      ctx.lineTo(cx + spread * 0.6, cy - height * 0.3)    // mid right
      ctx.lineTo(cx + spread * 0.8, cy - height * 0.1)    // lower right notch
      ctx.lineTo(cx + spread * 0.55, cy + height * 0.15)  // bottom right
      ctx.lineTo(cx, cy + height * 0.2)                   // bottom center
      ctx.lineTo(cx - spread * 0.55, cy + height * 0.15)  // bottom left
      ctx.lineTo(cx - spread * 0.8, cy - height * 0.1)    // lower left notch
      ctx.lineTo(cx - spread * 0.6, cy - height * 0.3)    // mid left
      ctx.lineTo(cx - spread * 0.35, cy - height * 0.55)  // upper left
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Inner highlight layer for depth
      if (foliageProgress > 0.5) {
        const innerP = (foliageProgress - 0.5) / 0.5
        ctx.fillStyle = `hsla(130, 50%, ${isDark ? 35 : 45}%, ${0.2 * innerP})`
        ctx.beginPath()
        ctx.moveTo(cx, cy - height * 0.8)
        ctx.lineTo(cx + spread * 0.25, cy - height * 0.4)
        ctx.lineTo(cx + spread * 0.4, cy)
        ctx.lineTo(cx, cy + height * 0.05)
        ctx.lineTo(cx - spread * 0.4, cy)
        ctx.lineTo(cx - spread * 0.25, cy - height * 0.4)
        ctx.closePath()
        ctx.fill()
      }
    }
  }, [progress, isDark])

  return (
    <div className="relative flex flex-col items-center gap-4">
      <div
        className="rounded-xl p-3"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
          backdropFilter: 'blur(24px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.5)',
          boxShadow: isDark
            ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)'
            : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="w-72 h-72 rounded-lg"
          style={{ opacity: 0.95 }}
        />
      </div>
      <div className="text-sm opacity-60" style={{ fontFamily: 'Crimson Pro, serif' }}>
        Growth: {Math.round(progress * 100)}%
      </div>
    </div>
  )
}
