"use client"
import { memo } from "react"
import { registerWidget, type WidgetProps } from "../widgetRegistry"
import { PulpIcon } from '@/app/components/CurrencyIcons'
import { ACCENT } from "@/lib/accent"

const font = 'Crimson Pro, serif'

const SapMetricWidget = memo(function SapMetricWidget({ isDark, sap = 0, goalStreak = 0 }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: 16, gap: 6 }}>
      <span style={{ fontSize: 8, fontWeight: 400, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lifetime Sap</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <PulpIcon size={20} />
        <span style={{ fontSize: 28, fontWeight: 400, color: textPrimary, fontFamily: font, lineHeight: 1 }}>{sap.toLocaleString()}</span>
      </div>
      {goalStreak > 0 && (
        <span style={{ fontSize: 9, color: goalStreak >= 7 ? ACCENT : textMuted }}>
          {goalStreak >= 7 ? `${goalStreak}d streak` : `${goalStreak}/7 to streak`}
        </span>
      )}
    </div>
  )
})

registerWidget({
  id: 'level-progress',
  name: 'Sap Metric',
  description: 'Your lifetime sap accumulation',
  category: 'progress',
  defaultSize: [2, 1],
  minSize: [2, 1],
  maxSize: [3, 1],
  component: SapMetricWidget,
})
