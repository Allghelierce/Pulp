"use client"
import { memo, useMemo } from "react"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = 'Crimson Pro, serif'

const StatsSummaryWidget = memo(function StatsSummaryWidget({ isDark, dailyStats, grove }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'

  const totalMinutes = dailyStats.reduce((s, d) => s + (d.focusMinutes ?? 0), 0)
  const totalSessions = dailyStats.reduce((s, d) => s + (d.sessionsCompleted ?? 0), 0)
  const totalChars = dailyStats.reduce((s, d) => s + (d.charsWritten ?? 0), 0)
  const activeDays = dailyStats.filter(d => (d.focusMinutes ?? 0) > 0 || (d.charsWritten ?? 0) > 0).length

  const bestStreak = useMemo(() => {
    const sorted = [...dailyStats].filter(d => (d.focusMinutes ?? 0) > 0 || (d.charsWritten ?? 0) > 0).map(d => d.date).sort()
    let best = 0, run = 0
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { run = 1 } else {
        const prev = new Date(sorted[i - 1]), curr = new Date(sorted[i])
        run = (curr.getTime() - prev.getTime()) / 86400000 === 1 ? run + 1 : 1
      }
      if (run > best) best = run
    }
    return best
  }, [dailyStats])

  const stats = [
    { label: 'Total Focus', value: totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m` },
    { label: 'Sessions', value: totalSessions.toLocaleString() },
    { label: 'Chars Written', value: totalChars >= 1000 ? `${(totalChars / 1000).toFixed(1)}k` : totalChars.toLocaleString() },
    { label: 'Trees Grown', value: grove.length.toLocaleString() },
    { label: 'Best Streak', value: `${bestStreak}d` },
    { label: 'Active Days', value: activeDays.toLocaleString() },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 16, height: '100%', alignContent: 'center' }}>
      {stats.map(({ label, value }) => (
        <div key={label}>
          <span style={{ fontSize: 7, fontWeight: 400, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>{label}</span>
          <span style={{ fontSize: 15, fontWeight: 400, color: textPrimary, fontFamily: font }}>{value}</span>
        </div>
      ))}
    </div>
  )
})

registerWidget({
  id: 'stats-summary',
  name: 'Stats Summary',
  description: 'Key numbers at a glance',
  category: 'activity',
  defaultSize: [2, 1],
  minSize: [2, 1],
  maxSize: [3, 2],
  component: StatsSummaryWidget,
})
