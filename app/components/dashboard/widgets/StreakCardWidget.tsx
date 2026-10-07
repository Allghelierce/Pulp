"use client"
import { memo, useMemo } from "react"
import { StreakFlame } from "@/app/components/StreakFlame"
import { registerWidget, type WidgetProps } from "../widgetRegistry"
import { CountUp, Burst, usePersonalBest, fmtInt } from "../lively"

const font = 'Crimson Pro, serif'

// The streak flame: real, moving fire that grows with the streak. While today's
// goal is still open it flickers hard (the streak is at risk); once met it burns calmer.
function Flame({ color, size, flicker, lit }: { color: string; size: number; flicker: boolean; lit: boolean }) {
  return <StreakFlame color={color} size={size} lit={lit} calm={!flicker} />
}

// Current and best day-streaks (any focus or writing counts as a day).
export function useStreak(dailyStats: WidgetProps['dailyStats']) {
  return useMemo(() => {
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
}

const streakColorFor = (n: number) => n >= 60 ? '#ffd700' : n >= 30 ? '#a855f7' : n >= 14 ? '#4d8cff' : n >= 7 ? '#60a5fa' : n >= 3 ? '#34d399' : n > 0 ? '#d97706' : '#a1a1aa'

// Compact streak for the Stats header: animated flame + "N days", with a hint
// to keep it lit while today's goal is still open.
export const StreakBadge = memo(function StreakBadge({ isDark, dailyStats, dailyGoalMinutes = 30 }: Pick<WidgetProps, 'isDark' | 'dailyStats' | 'dailyGoalMinutes'>) {
  const { current, best } = useStreak(dailyStats)
  const todayKey = new Date().toISOString().split("T")[0]
  const todayFocus = dailyStats.find(e => e.date === todayKey)?.focusMinutes ?? 0
  const goalMet = todayFocus >= dailyGoalMinutes
  const newBest = usePersonalBest('bestStreak', best, dailyStats.length > 0) && current === best && current > 0
  const color = streakColorFor(current)
  const muted = isDark ? '#7a7670' : '#8a8680'
  const hint = current === 0 ? 'focus today to light it'
    : newBest ? 'longest yet'
    : !goalMet ? `${Math.max(0, Math.ceil(dailyGoalMinutes - todayFocus))}m to keep it lit`
    : 'lit for today'
  return (
    <div title={`Streak: ${current} day${current === 1 ? '' : 's'} · best ${best}`} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <Flame color={current > 0 ? color : '#a1a1aa'} size={Math.round(24 + Math.min(current, 30) * 0.4)} flicker={current > 0 && !goalMet} lit={current > 0} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontFamily: font, fontSize: 20, color: current > 0 ? (current < 3 ? (isDark ? '#dcd8d0' : '#2a2620') : color) : muted }}>
          <CountUp value={current} format={fmtInt} /> <span style={{ fontSize: 11, color: muted }}>{current === 1 ? 'day' : 'days'}</span>
        </span>
        <span style={{ fontFamily: font, fontStyle: 'italic', fontSize: 10.5, color: newBest ? '#d97706' : muted, marginTop: 3, letterSpacing: 0 }}>{hint}</span>
        {newBest && <Burst kind="spark" left="20%" top="40%" radius={26} count={10} delay={1} />}
      </div>
    </div>
  )
})

const StreakCardWidget = memo(function StreakCardWidget({ isDark, dailyStats, goalStreak = 0, dailyGoalMinutes = 30 }: WidgetProps) {
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'

  const { current, best } = useStreak(dailyStats)

  const todayKey = new Date().toISOString().split("T")[0]
  const todayFocus = dailyStats.find(e => e.date === todayKey)?.focusMinutes ?? 0
  const goalMet = todayFocus >= dailyGoalMinutes
  const minutesLeft = Math.max(0, Math.ceil(dailyGoalMinutes - todayFocus))

  // Shares the best-streak record with Stats Summary; burst only on the card
  // whose current run is the record.
  const newBest = usePersonalBest('bestStreak', best, dailyStats.length > 0) && current === best

  const streakColor = streakColorFor(current)
  const numberColor = current > 0 && current < 3 ? (isDark ? '#dcd8d0' : '#2a2620') : streakColor
  const multiplier = goalStreak >= 7 ? (new Date().getHours() < 9 ? 3 : 2) : 1
  // 18px for a fresh streak, growing to ~44px around a month in.
  const flameSize = Math.round(18 + Math.min(current, 30) * 0.87)

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 12, gap: 2 }}>
      <span style={{ fontSize: 8, fontWeight: 400, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Streak</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <Flame color={current > 0 ? streakColor : '#a1a1aa'} size={flameSize} flicker={!goalMet} lit={current > 0} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontSize: 32, fontWeight: 400, color: numberColor, fontFamily: font, lineHeight: 1 }}>
            <CountUp value={current} format={fmtInt} />
          </span>
          <span style={{ fontSize: 11, color: textMuted }}>days</span>
          {newBest && <Burst kind="spark" left="30%" top="50%" radius={30} count={12} delay={1} />}
        </div>
      </div>
      {newBest ? (
        <span className="lively-anim" style={{ fontSize: 9, color: '#d97706', marginTop: 2, fontFamily: font, fontStyle: 'italic', animation: 'livelyFadeUp .5s ease-out 1.1s both' }}>longest yet</span>
      ) : current > 0 && !goalMet ? (
        <span style={{ fontSize: 8, color: textMuted, marginTop: 2 }}>{minutesLeft}m to keep it lit</span>
      ) : multiplier > 1 ? (
        <span style={{ fontSize: 9, color: '#d97706', marginTop: 2, fontFamily: font }}>{multiplier}x active</span>
      ) : goalStreak > 0 ? (
        <span style={{ fontSize: 8, color: textMuted, marginTop: 2 }}>{goalStreak}/7 to 2x</span>
      ) : current === 0 ? (
        <span style={{ fontSize: 8, color: textMuted, marginTop: 2 }}>focus today to light it</span>
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
