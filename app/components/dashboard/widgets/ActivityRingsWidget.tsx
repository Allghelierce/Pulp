"use client"
import { memo, useState } from "react"
import { motion } from "framer-motion"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = 'Crimson Pro, serif'
const DEFAULT_GOALS = { focus: 60, writing: 2000, sessions: 3 }

function loadGoals() {
  if (typeof window === 'undefined') return DEFAULT_GOALS
  try {
    const saved = localStorage.getItem('pulp-ring-goals')
    if (saved) return { ...DEFAULT_GOALS, ...JSON.parse(saved) }
  } catch {}
  return DEFAULT_GOALS
}

const ActivityRingsWidget = memo(function ActivityRingsWidget({ isDark, dailyStats, goals }: WidgetProps) {
  const [editingGoals, setEditingGoals] = useState(false)
  const [draftGoals, setDraftGoals] = useState(loadGoals)

  const todayKey = new Date().toISOString().split("T")[0]
  const todayEntry = dailyStats.find(e => e.date === todayKey)
  const focus = todayEntry?.focusMinutes ?? 0
  const writing = todayEntry?.charsWritten ?? 0
  const sessions = todayEntry?.sessionsCompleted ?? 0

  const size = 160
  const cx = size / 2, cy = size / 2
  const strokeW = 5
  const gap = 5.5

  const textMuted = isDark ? '#5a5650' : '#a8a4a0'

  const rings = [
    { value: focus, goal: goals.focus, color: '#ea580c', radius: (size - strokeW) / 2 },
    { value: writing, goal: goals.writing, color: '#d97706', radius: (size - strokeW) / 2 - strokeW - gap },
    { value: sessions, goal: goals.sessions, color: '#f59e0b', radius: (size - strokeW) / 2 - (strokeW + gap) * 2 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 12, gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 400, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Daily Goals</span>
        <button
          onClick={() => { setDraftGoals(goals); setEditingGoals(e => !e) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: textMuted, display: 'flex' }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
        </button>
      </div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring, i) => {
          const circ = 2 * Math.PI * ring.radius
          const gapLen = circ * 0.04
          const trackLen = circ - gapLen
          const pct = Math.min(ring.value / ring.goal, 1)
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
              <motion.circle
                cx={cx} cy={cy} r={ring.radius} fill="none"
                stroke={ring.color} strokeWidth={strokeW} strokeLinecap="round"
                strokeDasharray={`${fillLen} ${circ - fillLen}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                transform={`rotate(${-90 + (gapLen / circ) * 180} ${cx} ${cy})`}
                style={{ filter: `drop-shadow(0 0 4px ${ring.color}66)` }}
              />
              {complete && (
                <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 1.2 + i * 0.1 }}
                  style={{ transformOrigin: `${checkX}px ${checkY}px` }}>
                  <circle cx={checkX} cy={checkY} r={strokeW + 2.5} fill="none" stroke={ring.color} strokeWidth={0.5} opacity={0.35} />
                  <circle cx={checkX} cy={checkY} r={strokeW + 1} fill={ring.color} />
                  <path d={`M${checkX - 2.5} ${checkY + 0.5} l2 2 l3.5 -4`} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </motion.g>
              )}
            </g>
          )
        })}
        {rings.map((ring, i) => {
          const pct = Math.min(Math.round((ring.value / ring.goal) * 100), 999)
          const abbr = ['mins', 'char', 'sesh'][i]
          return (
            <text key={`l-${i}`} x={cx} y={cy - 10 + i * 13} textAnchor="middle" dominantBaseline="central">
              <tspan style={{ fontSize: 10, fontWeight: 400, fill: ring.color }}>{pct}% {abbr}</tspan>
            </text>
          )
        })}
      </svg>
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
  component: ActivityRingsWidget,
})
