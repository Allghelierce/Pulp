"use client"

import { getRemainingLimits, type UserUsage } from "@/app/lib/tierLimits"

interface UsageLimitIndicatorProps {
  usage: UserUsage
  isDark?: boolean
  accent?: string
}

export function UsageLimitIndicator({ usage, isDark = false, accent = "#b85c20" }: UsageLimitIndicatorProps) {
  const limits = getRemainingLimits(usage)

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return "#ef4444" // red
    if (percentage >= 70) return "#f59e0b" // amber
    return "#10b981" // green
  }

  return (
    <div className={`rounded-lg p-4 ${isDark ? "bg-zinc-900/50" : "bg-white"} border ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
      <div className="space-y-3">
        {/* Sketches limit */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`text-xs font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
              AI Sketches
            </label>
            <span className={`text-xs font-medium ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
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
            <label className={`text-xs font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
              AI Tokens
            </label>
            <span className={`text-xs font-medium ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
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
        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span className={`text-xs font-semibold capitalize ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
            {usage.tier} tier
          </span>
        </div>
      </div>
    </div>
  )
}
