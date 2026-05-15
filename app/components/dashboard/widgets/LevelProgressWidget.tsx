"use client"
import { memo } from "react"
import { getLevel } from "@/app/constants"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = 'Crimson Pro, serif'

const LevelProgressWidget = memo(function LevelProgressWidget({ isDark, xp }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const lvl = getLevel(xp)
  const pct = Math.min(100, Math.floor(lvl.progress * 100))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: 16, gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontSize: 28, fontWeight: 400, color: '#d97706', fontFamily: font, lineHeight: 1,
        }}>{lvl.level}</span>
        <span style={{ fontSize: 14, fontWeight: 400, color: textPrimary, fontFamily: font }}>{lvl.name}</span>
      </div>
      <div style={{
        height: 6, borderRadius: 3, overflow: 'hidden',
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      }}>
        <div style={{ height: '100%', borderRadius: 3, background: '#d97706', width: `${pct}%` }} />
      </div>
      <span style={{ fontSize: 9, color: textMuted }}>
        {lvl.currentXp} / {lvl.nextXp} XP — {pct}% to Lv. {lvl.level + 1}
      </span>
    </div>
  )
})

registerWidget({
  id: 'level-progress',
  name: 'Level Progress',
  description: 'XP bar with current level and rank name',
  category: 'progress',
  defaultSize: [2, 1],
  minSize: [2, 1],
  maxSize: [3, 1],
  component: LevelProgressWidget,
})
