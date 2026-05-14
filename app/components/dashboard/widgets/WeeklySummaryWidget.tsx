"use client"
import { memo, useMemo } from "react"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = '"EB Garamond", serif'

const WeeklySummaryWidget = memo(function WeeklySummaryWidget({ isDark, dailyStats }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'

  const { thisWeek, lastWeek } = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)

    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const map = new Map(dailyStats.map(e => [e.date, e]))
    let tw = { focus: 0, chars: 0, sessions: 0 }
    let lw = { focus: 0, chars: 0, sessions: 0 }

    for (let i = 0; i < 7; i++) {
      const d1 = new Date(weekStart); d1.setDate(d1.getDate() + i)
      const k1 = d1.toISOString().split("T")[0]
      const e1 = map.get(k1)
      if (e1) { tw.focus += e1.focusMinutes ?? 0; tw.chars += e1.charsWritten ?? 0; tw.sessions += e1.sessionsCompleted ?? 0 }

      const d2 = new Date(lastWeekStart); d2.setDate(d2.getDate() + i)
      const k2 = d2.toISOString().split("T")[0]
      const e2 = map.get(k2)
      if (e2) { lw.focus += e2.focusMinutes ?? 0; lw.chars += e2.charsWritten ?? 0; lw.sessions += e2.sessionsCompleted ?? 0 }
    }
    return { thisWeek: tw, lastWeek: lw }
  }, [dailyStats])

  const rows = [
    { label: 'Focus', this: `${thisWeek.focus}m`, last: `${lastWeek.focus}m`, delta: thisWeek.focus - lastWeek.focus, unit: 'm' },
    { label: 'Writing', this: thisWeek.chars >= 1000 ? `${(thisWeek.chars / 1000).toFixed(1)}k` : `${thisWeek.chars}`, last: lastWeek.chars >= 1000 ? `${(lastWeek.chars / 1000).toFixed(1)}k` : `${lastWeek.chars}`, delta: thisWeek.chars - lastWeek.chars, unit: '' },
    { label: 'Sessions', this: `${thisWeek.sessions}`, last: `${lastWeek.sessions}`, delta: thisWeek.sessions - lastWeek.sessions, unit: '' },
  ]

  return (
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? '#5a5650' : '#a8a4a0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: font }}>This Week</span>
      {rows.map(row => (
        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 8, fontWeight: 600, color: textMuted, width: 42, textTransform: 'uppercase' }}>{row.label}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: textPrimary, fontFamily: font, flex: 1 }}>{row.this}</span>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: row.delta > 0 ? '#22c55e' : row.delta < 0 ? '#ef4444' : textMuted,
          }}>
            {row.delta > 0 ? '+' : ''}{row.delta}{row.unit}
          </span>
        </div>
      ))}
    </div>
  )
})

registerWidget({
  id: 'weekly-summary',
  name: 'Weekly Summary',
  description: 'This week vs last week comparison',
  category: 'activity',
  defaultSize: [2, 1],
  minSize: [2, 1],
  maxSize: [3, 1],
  component: WeeklySummaryWidget,
})
