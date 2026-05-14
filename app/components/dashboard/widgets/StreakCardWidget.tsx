"use client"
import { memo, useMemo } from "react"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = '"EB Garamond", serif'

const StreakCardWidget = memo(function StreakCardWidget({ isDark, dailyStats }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 12, gap: 2 }}>
      <span style={{ fontSize: 8, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Streak</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: streakColor, fontFamily: font, lineHeight: 1 }}>{current}</span>
        <span style={{ fontSize: 11, color: textMuted }}>days</span>
      </div>
      {current > 0 && (
        <span style={{ fontSize: 16, lineHeight: 1, filter: `drop-shadow(0 0 4px ${streakColor})` }}>🔥</span>
      )}
      <span style={{ fontSize: 8, color: textMuted, marginTop: 2 }}>best: {best}d</span>
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
