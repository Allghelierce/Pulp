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
  const animationRef = useRef<number | null>(null)

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
    ctx.fillStyle = isDark ? "rgba(15, 15, 18, 0)" : "rgba(253, 250, 247, 0)"
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
      ctx.fillStyle = `hsla(100, 60%, ${isDark ? 50 : 45}%, ${0.3 * foliageProgress})`
      const radius = 45 * foliageProgress
      ctx.beginPath()
      ctx.arc(centerX, baseY - 80, radius, 0, Math.PI * 2)
      ctx.fill()

      // Additional foliage circles
      if (foliageProgress > 0.3) {
        ctx.fillStyle = `hsla(100, 55%, ${isDark ? 55 : 48}%, ${0.25 * foliageProgress})`
        ctx.beginPath()
        ctx.arc(centerX - 25, baseY - 70, 30 * foliageProgress, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(centerX + 25, baseY - 70, 30 * foliageProgress, 0, Math.PI * 2)
        ctx.fill()
      }

      // Oranges at the base of the tree - appear as progress increases
      if (progress > 0.3) {
        const groundOranges = [
          { x: centerX - 12, y: baseY + 4, p: 0.3 },
          { x: centerX + 15, y: baseY + 2, p: 0.5 },
          { x: centerX + 2, y: baseY + 6, p: 0.7 },
        ]

        groundOranges.forEach(o => {
          if (progress > o.p) {
            const p = Math.min(1, (progress - o.p) / 0.1)
            const size = 5 * p
            
            // Small stem pointing up
            ctx.strokeStyle = `hsl(25, 40%, ${isDark ? 30 : 25}%)`
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.moveTo(o.x, o.y - size)
            ctx.lineTo(o.x + 1, o.y - size - 3)
            ctx.stroke()

            // Orange fruit
            ctx.fillStyle = `hsl(25, 90%, ${isDark ? 55 : 50}%)`
            ctx.beginPath()
            ctx.arc(o.x, o.y, size, 0, Math.PI * 2)
            ctx.fill()
            
            // Highlight
            ctx.fillStyle = "rgba(255,255,255,0.2)"
            ctx.beginPath()
            ctx.arc(o.x - size/3, o.y - size/3, size/4, 0, Math.PI * 2)
            ctx.fill()
          }
        })
      }
    }
  }, [progress, isDark])

  return (
    <div className="relative flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        className="w-72 h-72 rounded-lg"
        style={{ opacity: 0.95 }}
      />
      <div className="text-sm opacity-60" style={{ fontFamily: '"EB Garamond", serif' }}>
        Growth: {Math.round(progress * 100)}%
      </div>
    </div>
  )
}
