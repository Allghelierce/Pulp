"use client"
import { memo, useState } from "react"
import { registerWidget, type WidgetProps } from "../widgetRegistry"
import { localDayKey } from "@/lib/day"

const font = 'Crimson Pro, serif'

const ActivityRingsWidget = memo(function ActivityRingsWidget({ isDark, dailyStats, goalStreak = 0, dailyGoalMinutes = 30, quotaTier = 'monthly' }: WidgetProps) {
  const todayKey = localDayKey()
  const todayEntry = dailyStats.find(e => e.date === todayKey)
  const focus = todayEntry?.focusMinutes ?? 0

  const hour = typeof window !== 'undefined' ? new Date().getHours() : 12
  const isEarlyBird = hour >= 6 && (hour < 10 || (hour === 10 && new Date().getMinutes() <= 30))
  const earlyBirdProgress = isEarlyBird ? Math.min(1, focus / 10) : 0
  const quotaBonus = quotaTier === 'daily' ? 2 : quotaTier === 'weekly' ? 1 : 0
  const streakBonus = Math.min(1, goalStreak / 30)
  const multiplier = Math.min(5, 1 + (isEarlyBird ? 1 : 0) + quotaBonus + streakBonus)

  // Quota tracks focus across the tier's window vs the goal scaled to that window.
  const periodDays = quotaTier === 'daily' ? 1 : quotaTier === 'weekly' ? 7 : 30
  const periodFocus = (() => {
    if (periodDays === 1) return focus
    const map = new Map(dailyStats.map(e => [e.date, e.focusMinutes ?? 0]))
    const now = new Date()
    let sum = 0
    for (let i = 0; i < periodDays; i++) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      sum += map.get(localDayKey(d)) ?? 0
    }
    return sum
  })()
  const quotaTarget = dailyGoalMinutes * periodDays
  const quotaProgress = Math.min(1, periodFocus / Math.max(1, quotaTarget))
  const streakProgress = Math.min(1, goalStreak / 30)

  const [editing, setEditing] = useState(false)
  const [hover, setHover] = useState(false)
  const [draft, setDraft] = useState(String(dailyGoalMinutes))
  const [draftTier, setDraftTier] = useState(quotaTier)

  const size = 200
  const cx = size / 2, cy = size / 2
  const strokeW = 6
  const gap = 6

  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'

  const rings = [
    { value: quotaProgress, label: 'quota', display: `${Math.round(quotaProgress * 100)}%`, color: '#ea580c', radius: (size - strokeW) / 2 },
    { value: streakProgress, label: 'streak', display: `${goalStreak}d`, color: '#d97706', radius: (size - strokeW) / 2 - strokeW - gap },
    { value: isEarlyBird ? earlyBirdProgress : 0, label: 'early bird', display: isEarlyBird ? `${Math.round(earlyBirdProgress * 100)}%` : 'off', color: '#60a5fa', radius: (size - strokeW) / 2 - (strokeW + gap) * 2 },
  ]

  const saveQuota = () => {
    const val = parseInt(draft)
    if (!val || val < 1) { setEditing(false); return }
    try {
      const raw = localStorage.getItem('pulp-grove')
      if (raw) {
        const data = JSON.parse(raw)
        data.dailyGoalMinutes = val
        if (draftTier !== quotaTier) {
          const lockDays = draftTier === 'monthly' ? 30 : 7
          const lockDate = new Date()
          lockDate.setDate(lockDate.getDate() + lockDays)
          data.quotaTier = draftTier
          data.quotaLockedUntil = localDayKey(lockDate)
        }
        localStorage.setItem('pulp-grove', JSON.stringify(data))
      }
    } catch {}
    setEditing(false)
    window.location.reload()
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 8, gap: 2 }}
    >
      {!editing && (
        <button
          onClick={() => { setDraft(String(dailyGoalMinutes)); setEditing(true) }}
          title={`Edit Quota · ${dailyGoalMinutes}min`}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 2,
            background: 'none', border: 'none', cursor: 'pointer',
            color: textMuted, padding: 4, borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
        </button>
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {rings.map((ring, i) => {
          const circ = 2 * Math.PI * ring.radius
          const gapLen = circ * 0.04
          const trackLen = circ - gapLen
          const pct = Math.min(ring.value, 1)
          const fillLen = trackLen * pct
          const trackColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          const complete = pct >= 1
          const checkR = ring.radius
          const checkX = cx + Math.cos(-Math.PI / 2) * checkR
          const checkY = cy + Math.sin(-Math.PI / 2) * checkR
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={ring.radius} fill="none" stroke={trackColor} strokeWidth={strokeW} strokeLinecap="round"
                strokeDasharray={`${trackLen} ${gapLen}`} strokeDashoffset={-gapLen / 2} transform={`rotate(-90 ${cx} ${cy})`} />
              <circle
                cx={cx} cy={cy} r={ring.radius} fill="none"
                stroke={ring.color} strokeWidth={strokeW} strokeLinecap="round"
                strokeDasharray={`${fillLen} ${circ - fillLen}`}
                transform={`rotate(${-90 + (gapLen / circ) * 180} ${cx} ${cy})`}
                style={{ filter: `drop-shadow(0 0 4px ${ring.color}66)` }}
              />
              {complete && (
                <g>
                  <circle cx={checkX} cy={checkY} r={strokeW + 2.5} fill="none" stroke={ring.color} strokeWidth={0.5} opacity={0.35} />
                  <circle cx={checkX} cy={checkY} r={strokeW + 1} fill={ring.color} />
                  <path d={`M${checkX - 2.5} ${checkY + 0.5} l2 2 l3.5 -4`} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
            </g>
          )
        })}
        <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.03em',
            fill: multiplier >= 4.5 ? '#ea580c' : multiplier >= 4 ? '#ea580c' : multiplier >= 3 ? '#d97706' : multiplier >= 2 ? '#4ade80' : '#94a3b8' }}>
          {multiplier.toFixed(1)}x
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 10, fontWeight: 400, fill: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {quotaTier} · {goalStreak}d
        </text>
      </svg>
      {/* Ring legend — hidden until hover, like the timer rings */}
      {!editing && (
        <div style={{
          position: 'absolute', bottom: 6, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          opacity: hover ? 1 : 0, transition: 'opacity 0.18s ease', pointerEvents: 'none',
        }}>
          {rings.map((ring, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ring.color, flexShrink: 0 }} />
              <span style={{ fontSize: 8, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', width: 52 }}>{ring.label}</span>
              <span style={{ fontSize: 8, fontWeight: 500, color: textPrimary, fontFamily: 'Inter, system-ui, sans-serif' }}>{ring.display}</span>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['monthly', 'weekly', 'daily'] as const).map(t => {
              const active = draftTier === t
              const locked = !!(() => { try { const d = JSON.parse(localStorage.getItem('pulp-grove') || '{}'); return d.quotaLockedUntil && localDayKey() < d.quotaLockedUntil && t !== quotaTier } catch { return false } })()
              const labels = { monthly: '0x', weekly: '+1x', daily: '+2x' }
              return (
                <button key={t} disabled={locked}
                  onClick={() => setDraftTier(t)}
                  style={{
                    fontSize: 9, fontWeight: active ? 600 : 400, fontFamily: 'Inter, system-ui, sans-serif',
                    padding: '3px 8px', borderRadius: 5, cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.35 : 1,
                    background: active ? 'rgba(217,119,6,0.15)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(217,119,6,0.3)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    color: active ? '#d97706' : textMuted,
                  }}>
                  {t} {labels[t]}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              autoFocus type="number" min={5} max={480}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveQuota(); if (e.key === 'Escape') setEditing(false) }}
              style={{
                width: 50, fontSize: 12, fontWeight: 400, fontFamily: font,
                textAlign: 'center', borderRadius: 6, border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: textPrimary, padding: '3px 5px', outline: 'none',
              }}
            />
            <span style={{ fontSize: 9, color: textMuted }}>min/day</span>
            <button onClick={saveQuota} style={{
              fontSize: 9, fontWeight: 500, fontFamily: font, color: '#fff',
              background: '#d97706', border: 'none', borderRadius: 5,
              padding: '3px 10px', cursor: 'pointer',
            }}>Save</button>
          </div>
        </div>
      )}
    </div>
  )
})

registerWidget({
  id: 'activity-rings',
  name: 'Activity Rings',
  description: 'Daily progress toward focus, writing, and session goals',
  category: 'progress',
  defaultSize: [2, 2],
  minSize: [2, 2],
  maxSize: [3, 3],
  transparent: true,
  component: ActivityRingsWidget,
})
