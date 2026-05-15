"use client"
import { memo, useMemo } from "react"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = 'Crimson Pro, serif'

const AchievementProgressWidget = memo(function AchievementProgressWidget({ isDark, achievements }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'

  const closest = useMemo(() => {
    return [...achievements]
      .filter(a => !a.completed && (a.progress ?? 0) > 0)
      .sort((a, b) => {
        const pa = (a.goal ?? 1) > 0 ? (a.progress ?? 0) / (a.goal ?? 1) : 0
        const pb = (b.goal ?? 1) > 0 ? (b.progress ?? 0) / (b.goal ?? 1) : 0
        return pb - pa
      })
      .slice(0, 4)
  }, [achievements])

  const completed = achievements.filter(a => a.completed).length

  return (
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 400, color: isDark ? '#5a5650' : '#a8a4a0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: font }}>
          Achievements
        </span>
        <span style={{ fontSize: 9, fontWeight: 400, color: '#d97706' }}>
          {completed}/{achievements.length}
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        {closest.length === 0 ? (
          <span style={{ fontSize: 10, color: textMuted, fontStyle: 'italic', textAlign: 'center' }}>Start earning achievements!</span>
        ) : closest.map(a => {
          const pct = (a.goal ?? 1) > 0 ? Math.min(100, Math.round(((a.progress ?? 0) / (a.goal ?? 1)) * 100)) : 0
          return (
            <div key={a.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 400, color: textPrimary }}>{a.title}</span>
                <span style={{ fontSize: 8, color: textSecondary }}>{pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: '#d97706', transition: 'width 500ms ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

registerWidget({
  id: 'achievement-progress',
  name: 'Achievements',
  description: 'Closest-to-completion achievements',
  category: 'progress',
  defaultSize: [2, 2],
  minSize: [2, 1],
  maxSize: [3, 2],
  component: AchievementProgressWidget,
})
