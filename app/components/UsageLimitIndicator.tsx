"use client"

import { getRemainingLimits, type UserUsage } from "@/app/lib/tierLimits"
import { ACCENT } from "@/lib/accent"

interface UsageLimitIndicatorProps {
  usage: UserUsage
  isDark?: boolean
  accent?: string
}

export function UsageLimitIndicator({ usage, isDark = false, accent = ACCENT }: UsageLimitIndicatorProps) {
  const limits = getRemainingLimits(usage)

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return "#ef4444" // red
    if (percentage >= 70) return "#f59e0b" // amber
    return "#10b981" // green
  }

  return (
    <div
      className={`rounded-lg p-4 ${isDark ? "bg-zinc-900/50" : "bg-white"} border ${isDark ? "border-zinc-800" : "border-zinc-200"}`}
      style={{
        filter: "url(#handwritten-jitter-subtle)",
        transform: `rotate(${Math.random() * 0.3 - 0.15}deg)`,
      }}
    >
      <div className="space-y-3">
        {/* Sketches limit */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              className={`text-xs font-normal ${isDark ? "text-zinc-300" : "text-zinc-700"}`}
              style={{ transform: `rotate(${Math.random() * 0.5 - 0.25}deg)` }}
            >
              AI Sketches
            </label>
            <span
              className={`text-xs font-normal ${isDark ? "text-zinc-500" : "text-zinc-500"}`}
              style={{ transform: `rotate(${Math.random() * 0.4 - 0.2}deg)` }}
            >
              {limits.sketchesRemaining === Infinity ? "∞" : Math.floor(limits.sketchesRemaining)} remaining
            </span>
          </div>
          {limits.sketchesRemaining !== Infinity && (
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(limits.sketchPercentage, 100)}%`,
                  backgroundColor: getBarColor(limits.sketchPercentage),
                }}
              />
            </div>
          )}
        </div>

        {/* Token limit */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              className={`text-xs font-normal ${isDark ? "text-zinc-300" : "text-zinc-700"}`}
              style={{ transform: `rotate(${Math.random() * 0.5 - 0.25}deg)` }}
            >
              AI Tokens
            </label>
            <span
              className={`text-xs font-normal ${isDark ? "text-zinc-500" : "text-zinc-500"}`}
              style={{ transform: `rotate(${Math.random() * 0.4 - 0.2}deg)` }}
            >
              {limits.tokensRemaining.toLocaleString()} remaining
            </span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
            <div
              className="h-full transition-all"
              style={{
                width: `${Math.min(limits.tokenPercentage, 100)}%`,
                backgroundColor: getBarColor(limits.tokenPercentage),
              }}
            />
          </div>
        </div>

        {/* Tier badge */}
        <div
          className="flex items-center gap-2 pt-2 border-t"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            transform: `rotate(${Math.random() * 0.2 - 0.1}deg)`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: accent,
              transform: `scale(${0.9 + Math.random() * 0.2}) rotate(${Math.random() * 5 - 2.5}deg)`,
            }}
          />
          <span
            className={`text-xs font-normal capitalize ${isDark ? "text-zinc-400" : "text-zinc-600"}`}
            style={{ transform: `rotate(${Math.random() * 0.4 - 0.2}deg)` }}
          >
            {usage.tier} tier
          </span>
        </div>
      </div>
    </div>
  )
}
