"use client"
import { memo, useMemo } from "react"
import { ACCENT, accentAlpha } from "@/lib/accent"
import { registerWidget, type WidgetProps } from "../widgetRegistry"
import { CountUp, Burst, usePersonalBest, fmtMinutes, fmtInt, fmtKilo, fmtDays } from "../lively"

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

  // Stats load a beat after the page opens; only judge bests once they're in.
  const newBest = usePersonalBest('bestStreak', bestStreak, dailyStats.length > 0)

  const stats: { label: string; value: number; format: (n: number) => string; best?: boolean }[] = [
    { label: 'Total Focus', value: totalMinutes, format: fmtMinutes },
    { label: 'Sessions', value: totalSessions, format: fmtInt },
    { label: 'Chars Written', value: totalChars, format: fmtKilo },
    { label: 'Trees Grown', value: grove.length, format: fmtInt },
    { label: 'Best Streak', value: bestStreak, format: fmtDays, best: newBest },
    { label: 'Active Days', value: activeDays, format: fmtInt },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 16, height: '100%', alignContent: 'center' }}>
      {stats.map(({ label, value, format, best }) => (
        <div key={label}>
          <span style={{ fontSize: 7, fontWeight: 400, color: best ? ACCENT : textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', transition: 'color .4s ease' }}>{label}</span>
          <span style={{ position: 'relative', display: 'inline-block', fontSize: 15, fontWeight: 400, color: best ? ACCENT : textPrimary, fontFamily: font,
            textShadow: best ? `0 0 10px ${accentAlpha(0.35)}` : undefined, transition: 'color .4s ease' }}>
            <CountUp value={value} format={format} />
            {best && <Burst kind="spark" radius={24} delay={0.9} />}
          </span>
          {best && (
            <span className="lively-anim" style={{ marginLeft: 5, fontSize: 8, color: ACCENT, fontStyle: 'italic', fontFamily: font,
              animation: 'livelyFadeUp .5s ease-out 1s both' }}>new best</span>
          )}
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
