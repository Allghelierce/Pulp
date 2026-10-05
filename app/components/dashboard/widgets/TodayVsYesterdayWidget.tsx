"use client"
import { memo } from "react"
import { registerWidget, type WidgetProps } from "../widgetRegistry"
import { localDayKey } from "@/lib/day"

const font = 'Crimson Pro, serif'

const TodayVsYesterdayWidget = memo(function TodayVsYesterdayWidget({ isDark, dailyStats }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'

  const todayKey = localDayKey()
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = localDayKey(yesterday)

  const todayFocus = dailyStats.find(e => e.date === todayKey)?.focusMinutes ?? 0
  const yesterdayFocus = dailyStats.find(e => e.date === yesterdayKey)?.focusMinutes ?? 0
  const delta = todayFocus - yesterdayFocus

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 12, gap: 4 }}>
      <span style={{ fontSize: 8, fontWeight: 400, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Today</span>
      <span style={{ fontSize: 28, fontWeight: 400, color: textPrimary, fontFamily: font, lineHeight: 1 }}>{todayFocus}m</span>
      <span style={{
        fontSize: 12, fontWeight: 400,
        color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : textMuted,
      }}>
        {delta > 0 ? `+${delta}m` : delta < 0 ? `${delta}m` : '—'}
      </span>
      <span style={{ fontSize: 7, color: textMuted }}>vs yesterday ({yesterdayFocus}m)</span>
    </div>
  )
})

registerWidget({
  id: 'today-vs-yesterday',
  name: 'Today vs Yesterday',
  description: 'Focus time comparison',
  category: 'activity',
  defaultSize: [1, 1],
  minSize: [1, 1],
  maxSize: [2, 1],
  component: TodayVsYesterdayWidget,
})
