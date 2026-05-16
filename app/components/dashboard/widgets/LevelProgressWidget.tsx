"use client"
import { memo } from "react"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = 'Crimson Pro, serif'

const TimeBalanceWidget = memo(function TimeBalanceWidget({ isDark, timeBalance = 0, goalStreak = 0 }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const hours = Math.floor(timeBalance / 60)
  const mins = timeBalance % 60
  const multiplier = goalStreak >= 7 ? (new Date().getHours() < 9 ? 3 : 2) : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: 16, gap: 6 }}>
      <span style={{ fontSize: 8, fontWeight: 400, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Time Balance</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {hours > 0 && (
          <>
            <span style={{ fontSize: 28, fontWeight: 400, color: textPrimary, fontFamily: font, lineHeight: 1 }}>{hours}</span>
            <span style={{ fontSize: 12, color: textMuted }}>h</span>
          </>
        )}
        <span style={{ fontSize: hours > 0 ? 18 : 28, fontWeight: 400, color: textPrimary, fontFamily: font, lineHeight: 1 }}>{mins}</span>
        <span style={{ fontSize: 12, color: textMuted }}>m</span>
      </div>
      {multiplier > 1 && (
        <span style={{ fontSize: 9, color: '#d97706' }}>{multiplier}x multiplier active</span>
      )}
    </div>
  )
})

registerWidget({
  id: 'level-progress',
  name: 'Time Balance',
  description: 'Your spendable time currency balance',
  category: 'progress',
  defaultSize: [2, 1],
  minSize: [2, 1],
  maxSize: [3, 1],
  component: TimeBalanceWidget,
})
