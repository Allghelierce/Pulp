"use client"
import { memo, useMemo, useState } from "react"
import { registerWidget, type WidgetProps } from "../widgetRegistry"
import type { DailyEntry } from "@/app/lib/dailyStats"
import { accentAlpha } from "@/lib/accent"

const font = 'Crimson Pro, serif'
const RING_GOALS = { focus: 60, writing: 2000, sessions: 3 }

function getMonthGrid(entries: DailyEntry[], monthOffset = 0) {
  const map = new Map(entries.map(e => [e.date, e]))
  const today = new Date()
  const days = 180
  const baseOffset = monthOffset * days
  const grid: { date: string; level: number; minutes: number; dayNum: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i - baseOffset)
    const key = d.toISOString().split("T")[0]
    const entry = map.get(key)
    const minutes = entry?.focusMinutes ?? 0
    const chars = entry?.charsWritten ?? 0
    const sessions = entry?.sessionsCompleted ?? 0
    const score = (Math.min(minutes / RING_GOALS.focus, 1) + Math.min(chars / RING_GOALS.writing, 1) + Math.min(sessions / RING_GOALS.sessions, 1)) / 3
    let level = 0
    if (score > 0) level = 1
    if (score >= 0.25) level = 2
    if (score >= 0.5) level = 3
    if (score >= 0.75) level = 4
    grid.push({ date: key, level, minutes, dayNum: d.getDate() })
  }
  return grid
}

function hasActivityInRange(entries: DailyEntry[], monthOffset: number): boolean {
  const today = new Date()
  const days = 180
  const baseOffset = monthOffset * days
  const map = new Map(entries.map(e => [e.date, e]))
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i - baseOffset)
    const key = d.toISOString().split("T")[0]
    if (map.has(key)) return true
  }
  return false
}

const ConsistencyHeatmapWidget = memo(function ConsistencyHeatmapWidget({ isDark, dailyStats, hibernation, hibernationScheduled }: WidgetProps) {
  const isHibernationDate = (date: string) => {
    if (hibernation && date >= hibernation.startDate && date <= hibernation.endDate) return true
    if (hibernationScheduled && date >= hibernationScheduled.startDate && date <= hibernationScheduled.endDate) return true
    return false
  }
  const [heatmapOffset, setHeatmapOffset] = useState(0)
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'

  const emptyCell = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
  const heatmapColors = useMemo(() => [
    emptyCell,
    isDark ? accentAlpha(0.35) : accentAlpha(0.25),
    isDark ? accentAlpha(0.55) : accentAlpha(0.45),
    isDark ? accentAlpha(0.78) : accentAlpha(0.65),
    isDark ? accentAlpha(1) : accentAlpha(0.9),
  ], [isDark, emptyCell])

  const monthGrid = useMemo(() => getMonthGrid(dailyStats, heatmapOffset), [dailyStats, heatmapOffset])
  const canGoBack = useMemo(() => hasActivityInRange(dailyStats, heatmapOffset + 1), [dailyStats, heatmapOffset])

  let currentStreak = 0
  for (let i = monthGrid.length - 1; i >= 0; i--) {
    if (monthGrid[i].level > 0) currentStreak++
    else break
  }

  const streakColorTiers = [
    { min: 0, color: '#a1a1aa' }, { min: 3, color: '#34d399' }, { min: 7, color: '#60a5fa' },
    { min: 14, color: '#4d8cff' }, { min: 30, color: '#a855f7' }, { min: 45, color: '#c4a6ff' }, { min: 60, color: '#ffd700' },
  ]
  const getStreakColor = (len: number) => {
    let c = streakColorTiers[0].color
    for (const t of streakColorTiers) if (len >= t.min) c = t.color
    return c
  }

  const weekMap = new Map<string, typeof monthGrid[0]>()
  for (const c of monthGrid) weekMap.set(c.date, c)

  const today = new Date()
  const baseOffset = heatmapOffset * 180
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() - baseOffset)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 179)
  const startDay = startDate.getDay()
  const adjustedStart = new Date(startDate)
  adjustedStart.setDate(adjustedStart.getDate() - startDay)

  const grid: (typeof monthGrid[0] | null)[][] = []
  const dateOrder: { cell: typeof monthGrid[0]; col: number; row: number }[] = []
  const cursor = new Date(adjustedStart)
  let col = 0
  while (cursor <= endDate) {
    const week: (typeof monthGrid[0] | null)[] = []
    for (let dow = 0; dow < 7; dow++) {
      const key = cursor.toISOString().split("T")[0]
      const c = weekMap.get(key) ?? null
      week.push(c)
      if (c) dateOrder.push({ cell: c, col, row: dow })
      cursor.setDate(cursor.getDate() + 1)
    }
    grid.push(week)
    col++
  }

  const numCols = grid.length
  const cellSize = 8, colGap = 4, rowGap = 2
  const colStep = cellSize + colGap, rowStep = cellSize + rowGap
  const labelW = 20
  const svgW = labelW + numCols * colStep - colGap, svgH = 7 * rowStep - rowGap
  const px = (c: number) => labelW + c * colStep + cellSize / 2
  const py = (r: number) => r * rowStep + cellSize / 2

  const runs: { start: number; length: number }[] = []
  let runStart = -1
  for (let i = 0; i < dateOrder.length; i++) {
    if (dateOrder[i].cell.level > 0) {
      if (runStart === -1) runStart = i
    } else {
      if (runStart !== -1 && i - runStart >= 2) runs.push({ start: runStart, length: i - runStart })
      runStart = -1
    }
  }
  if (runStart !== -1 && dateOrder.length - runStart >= 2) runs.push({ start: runStart, length: dateOrder.length - runStart })

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 400, color: isDark ? '#5a5650' : '#a8a4a0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: font }}>Consistency</span>
          {currentStreak > 0 && (
            <span style={{ fontSize: 10, fontWeight: 400, color: getStreakColor(currentStreak), fontFamily: font }}>
              {currentStreak}d streak
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {canGoBack && (
            <button onClick={() => setHeatmapOffset(o => o + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: textMuted, display: 'flex' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <span style={{ fontSize: 9, color: textMuted }}>{heatmapOffset === 0 ? 'Last 180 days' : `${heatmapOffset * 180 + 180}–${heatmapOffset * 180 + 1}d ago`}</span>
          {heatmapOffset > 0 && (
            <button onClick={() => setHeatmapOffset(o => o - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: textMuted, display: 'flex' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', flex: 1 }}>
        {dayLabels.map((l, i) => (
          <text key={i} x={4} y={py(i)} textAnchor="middle" dominantBaseline="central" fill={textMuted} fontSize="4" fontWeight="600">{l}</text>
        ))}
        {runs.map((run, ri) => {
          const color = getStreakColor(run.length)
          const segments: React.ReactNode[] = []
          for (let j = run.start; j < run.start + run.length - 1; j++) {
            const a = dateOrder[j], b = dateOrder[j + 1]
            const x1 = px(a.col), y1 = py(a.row), x2 = px(b.col), y2 = py(b.row)
            const dx = x2 - x1, dy = y2 - y1
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist === 0) continue
            const rA = a.cell.level === 0 ? 1.6 : [0, 2.5, 3, 3.8, 4.5][a.cell.level]
            const rB = b.cell.level === 0 ? 1.6 : [0, 2.5, 3, 3.8, 4.5][b.cell.level]
            const nx = dx / dist, ny = dy / dist
            segments.push(
              <line key={`${ri}-${j}`} x1={x1 + nx * rA} y1={y1 + ny * rA} x2={x2 - nx * rB} y2={y2 - ny * rB}
                stroke={color} strokeWidth="0.3" strokeLinecap="round" opacity={0.4} />
            )
          }
          return <g key={ri}>{segments}</g>
        })}
        {grid.map((week, col) => week.map((c, row) => {
          if (!c) return null
          const isHiber = isHibernationDate(c.date)
          if (isHiber) {
            return (
              <g key={c.date}>
                <circle cx={px(col)} cy={py(row)} r={4}
                  fill={isDark ? 'rgba(161,161,170,0.15)' : 'rgba(161,161,170,0.2)'} />
                <line x1={px(col) - 2.5} y1={py(row) - 2.5} x2={px(col) + 2.5} y2={py(row) + 2.5}
                  stroke={isDark ? '#71717a' : '#52525b'} strokeWidth="0.8" strokeLinecap="round" />
              </g>
            )
          }
          const isEmpty = c.level === 0
          const r = isEmpty ? 1.6 : [0, 2.5, 3, 3.8, 4.5][c.level]
          return (
            <circle key={c.date} cx={px(col)} cy={py(row)} r={r}
              style={{ fill: isEmpty ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') : heatmapColors[c.level] }} />
          )
        }))}
      </svg>

      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, justifyContent: "flex-start" }}>
        <span style={{ fontSize: 8, color: textMuted }}>Less</span>
        {heatmapColors.slice(1).map((c, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c }} />
        ))}
        <span style={{ fontSize: 8, color: textMuted }}>More</span>
        {(hibernation || hibernationScheduled) && (
          <>
            <span style={{ fontSize: 8, color: textMuted, marginLeft: 8 }}>|</span>
            <svg width="8" height="8" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="4" fill={isDark ? 'rgba(161,161,170,0.15)' : 'rgba(161,161,170,0.2)'} />
              <line x1="1.5" y1="1.5" x2="6.5" y2="6.5" stroke={isDark ? '#71717a' : '#52525b'} strokeWidth="0.8" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 8, color: textMuted }}>Hibernating</span>
          </>
        )}
      </div>
    </div>
  )
})

registerWidget({
  id: 'consistency-heatmap',
  name: 'Consistency',
  description: '180-day activity heatmap with streak tracking',
  category: 'analysis',
  defaultSize: [3, 2],
  minSize: [3, 2],
  maxSize: [6, 3],
  component: ConsistencyHeatmapWidget,
})
