"use client"
import { memo, useMemo } from "react"
import { motion } from "framer-motion"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = 'Crimson Pro, serif'

function FlameIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <motion.path
        d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-5-5-11-5-11z"
        fill="url(#flameGrad)"
        animate={{ d: [
          "M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-5-5-11-5-11z",
          "M12 3C12 3 6 9 6 13.5a6 6 0 0 0 12 0c0-4.5-6-10.5-6-10.5z",
          "M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-5-5-11-5-11z",
        ] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M12 10c0 0-2 2.5-2 4.5a2 2 0 0 0 4 0c0-2-2-4.5-2-4.5z"
        fill="#fef3c7"
        opacity={0.8}
        animate={{ d: [
          "M12 10c0 0-2 2.5-2 4.5a2 2 0 0 0 4 0c0-2-2-4.5-2-4.5z",
          "M12 11c0 0-1.5 2-1.5 3.8a1.5 1.5 0 0 0 3 0c0-1.8-1.5-3.8-1.5-3.8z",
          "M12 10c0 0-2 2.5-2 4.5a2 2 0 0 0 4 0c0-2-2-4.5-2-4.5z",
        ] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
      />
    </svg>
  )
}

const StreakCardWidget = memo(function StreakCardWidget({ isDark, dailyStats, goalStreak = 0 }: WidgetProps) {
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'

  const { current, best } = useMemo(() => {
    const sorted = [...dailyStats]
      .filter(d => (d.focusMinutes ?? 0) > 0 || (d.charsWritten ?? 0) > 0)
      .map(d => d.date).sort()

    let bestStreak = 0, run = 0
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { run = 1 } else {
        const prev = new Date(sorted[i - 1]), curr = new Date(sorted[i])
        run = (curr.getTime() - prev.getTime()) / 86400000 === 1 ? run + 1 : 1
      }
      if (run > bestStreak) bestStreak = run
    }

    let currentStreak = 0
    const today = new Date().toISOString().split("T")[0]
    const dateSet = new Set(sorted)
    const cursor = new Date()
    if (!dateSet.has(today)) cursor.setDate(cursor.getDate() - 1)
    while (dateSet.has(cursor.toISOString().split("T")[0])) {
      currentStreak++
      cursor.setDate(cursor.getDate() - 1)
    }

    return { current: currentStreak, best: bestStreak }
  }, [dailyStats])

  const streakColor = current >= 60 ? '#ffd700' : current >= 30 ? '#a855f7' : current >= 14 ? '#4d8cff' : current >= 7 ? '#60a5fa' : current >= 3 ? '#34d399' : '#a1a1aa'
  const multiplier = goalStreak >= 7 ? (new Date().getHours() < 9 ? 3 : 2) : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 12, gap: 2 }}>
      <span style={{ fontSize: 8, fontWeight: 400, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Streak</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span style={{ fontSize: 32, fontWeight: 400, color: streakColor, fontFamily: font, lineHeight: 1 }}>{current}</span>
        <span style={{ fontSize: 11, color: textMuted }}>days</span>
      </div>
      {current > 0 && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${streakColor}66)` }}
        >
          <FlameIcon color={streakColor} size={22} />
        </motion.div>
      )}
      {multiplier > 1 ? (
        <span style={{ fontSize: 9, color: '#d97706', marginTop: 2, fontFamily: font }}>{multiplier}x active</span>
      ) : goalStreak > 0 ? (
        <span style={{ fontSize: 8, color: textMuted, marginTop: 2 }}>{goalStreak}/7 to 2x</span>
      ) : (
        <span style={{ fontSize: 8, color: textMuted, marginTop: 2 }}>best: {best}d</span>
      )}
    </div>
  )
})

registerWidget({
  id: 'streak-card',
  name: 'Streak',
  description: 'Current and best activity streaks',
  category: 'progress',
  defaultSize: [1, 1],
  minSize: [1, 1],
  maxSize: [2, 1],
  component: StreakCardWidget,
})
