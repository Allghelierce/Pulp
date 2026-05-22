"use client"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { getLevel, TREE_TYPES } from "@/app/constants"
import type { Tree } from "@/app/types"
import { PlantIcon } from "./PlantIcon"
import { loadDailyStats, type DailyEntry } from "@/app/lib/dailyStats"

const DEFAULT_GOALS = { focus: 60, writing: 2000, sessions: 3 }

function loadGoals(): typeof DEFAULT_GOALS {
  if (typeof window === 'undefined') return DEFAULT_GOALS
  try {
    const saved = localStorage.getItem('pulp-ring-goals')
    if (saved) return { ...DEFAULT_GOALS, ...JSON.parse(saved) }
  } catch {}
  return DEFAULT_GOALS
}

const RING_GOALS = loadGoals()

function getTodayEntry(): DailyEntry | null {
  if (typeof window === 'undefined') return null
  const key = new Date().toISOString().split("T")[0]
  return loadDailyStats().find(e => e.date === key) ?? null
}

export function MiniRings({ isDark, onClick, stretch, quotaTier = 'monthly', goalStreak = 0, dailyGoalMinutes = 30, hideCenter = false, ringSize, sapDisplay }: {
  isDark: boolean; onClick?: () => void; stretch?: boolean
  quotaTier?: 'monthly' | 'weekly' | 'daily'; goalStreak?: number; dailyGoalMinutes?: number
  hideCenter?: boolean; ringSize?: number; sapDisplay?: number
}) {
  const [today, setToday] = useState<DailyEntry | null>(getTodayEntry)

  useEffect(() => {
    const refresh = () => setToday(getTodayEntry())
    const id = setInterval(refresh, 30000)
    window.addEventListener("storage", refresh)
    return () => { clearInterval(id); window.removeEventListener("storage", refresh) }
  }, [])

  const hour = typeof window !== 'undefined' ? new Date().getHours() : 12
  const isEarlyBird = hour >= 6 && (hour < 10 || (hour === 10 && new Date().getMinutes() <= 30))
  const earlyBirdProgress = isEarlyBird ? 1 : 0
  const quotaBonus = quotaTier === 'daily' ? 2 : quotaTier === 'weekly' ? 1 : 0
  const streakBonus = Math.min(1, goalStreak / 30)
  const multiplier = Math.min(5, 1 + (isEarlyBird ? 1 : 0) + quotaBonus + streakBonus)

  const quotaGoal = quotaTier === 'daily' ? dailyGoalMinutes : quotaTier === 'weekly' ? dailyGoalMinutes * 7 : dailyGoalMinutes * 30
  const quotaProgress = Math.min(1, (today?.focusMinutes ?? 0) / Math.max(1, quotaTier === 'daily' ? quotaGoal : quotaTier === 'weekly' ? quotaGoal / 7 : quotaGoal / 30))
  const streakProgress = Math.min(1, goalStreak / 30)

  const size = ringSize || 64
  const cx = size / 2, cy = size / 2
  const strokeW = 3
  const gap = 2

  const rings = [
    { value: quotaProgress, color: '#ea580c', label: 'quota', radius: (size - strokeW) / 2 },
    { value: streakProgress, color: '#d97706', label: 'streak', radius: (size - strokeW) / 2 - strokeW - gap },
    { value: isEarlyBird ? earlyBirdProgress : 0, color: '#60a5fa', label: 'early bird', radius: (size - strokeW) / 2 - (strokeW + gap) * 2 },
  ]

  const multColor = multiplier >= 4.5 ? 'gradient' : multiplier >= 4 ? '#ea580c' : multiplier >= 3 ? '#d97706' : multiplier >= 2 ? '#4ade80' : '#94a3b8'

  return (
    <div className="relative group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...(stretch ? { width: '100%' } : {}) }}>
      <button
        onClick={onClick}
        title={`${quotaTier} quota · ${goalStreak}d streak · ${multiplier.toFixed(1)}x`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', padding: 0,
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <svg width={stretch ? '100%' : size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {rings.map((ring, i) => {
            const circ = 2 * Math.PI * ring.radius
            const gapLen = circ * 0.04
            const trackLen = circ - gapLen
            const pct = Math.min(ring.value, 1)
            const fillLen = trackLen * pct
            const track = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={ring.radius} fill="none" stroke={track} strokeWidth={strokeW} strokeLinecap="round"
                  strokeDasharray={`${trackLen} ${gapLen}`}
                  strokeDashoffset={-gapLen / 2}
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
                <circle
                  cx={cx} cy={cy} r={ring.radius} fill="none"
                  stroke={ring.color} strokeWidth={strokeW} strokeLinecap="round"
                  strokeDasharray={`${fillLen} ${circ - fillLen}`}
                  transform={`rotate(${-90 + (gapLen / circ) * 180} ${cx} ${cy})`}
                />
              </g>
            )
          })}
          {!hideCenter && (sapDisplay != null ? (
            <g>
              <text x={cx - 3} y={cy + 1} textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.03em',
                  fill: '#d97706' }}>
                +{sapDisplay}
              </text>
              <g transform={`translate(${cx + (sapDisplay >= 10 ? 8 : 5)}, ${cy - 4}) scale(0.35)`}>
                <path d="M12 2 C12 2 5 12 5 16 C5 20 8 23 12 23 C16 23 19 20 19 16 C19 12 12 2 12 2Z" fill="#d97706" stroke="#92400e" strokeWidth="1.5"/>
              </g>
            </g>
          ) : multColor === 'gradient' ? (
            <>
              <defs>
                <linearGradient id="mult-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fcd34d" />
                </linearGradient>
              </defs>
              <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.03em',
                  fill: 'url(#mult-grad)' }}>
                {multiplier.toFixed(1)}x
              </text>
            </>
          ) : (
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.03em',
                fill: multColor }}>
              {multiplier.toFixed(1)}x
            </text>
          ))}
        </svg>
      </button>
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50"
        style={{
          background: isDark ? '#1c1a17' : '#fff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: 6, padding: '6px 10px', minWidth: 120,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
        <div style={{ fontSize: 9, fontWeight: 500, color: isDark ? '#71717a' : '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Multiplier</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <span style={{ color: isDark ? '#a1a1aa' : '#71717a' }}>base</span>
            <span style={{ color: isDark ? '#d4d4d8' : '#3f3f46', fontWeight: 500 }}>1.0x</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <span style={{ color: isEarlyBird ? '#60a5fa' : (isDark ? '#52524e' : '#c4c4c0') }}>early bird</span>
            <span style={{ color: isEarlyBird ? '#60a5fa' : (isDark ? '#52524e' : '#c4c4c0'), fontWeight: 500 }}>{isEarlyBird ? '+1.0x' : '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <span style={{ color: quotaBonus > 0 ? '#ea580c' : (isDark ? '#52524e' : '#c4c4c0') }}>{quotaTier} quota</span>
            <span style={{ color: quotaBonus > 0 ? '#ea580c' : (isDark ? '#52524e' : '#c4c4c0'), fontWeight: 500 }}>{quotaBonus > 0 ? `+${quotaBonus}.0x` : '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <span style={{ color: streakBonus > 0 ? '#d97706' : (isDark ? '#52524e' : '#c4c4c0') }}>streak ({goalStreak}d)</span>
            <span style={{ color: streakBonus > 0 ? '#d97706' : (isDark ? '#52524e' : '#c4c4c0'), fontWeight: 500 }}>{streakBonus > 0 ? `+${streakBonus.toFixed(1)}x` : '—'}</span>
          </div>
          <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, marginTop: 2, paddingTop: 3, display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <span style={{ color: isDark ? '#d4d4d8' : '#3f3f46', fontWeight: 600 }}>total</span>
            <span style={{ color: typeof multColor === 'string' && multColor !== '#94a3b8' ? multColor : '#94a3b8', fontWeight: 700 }}>{multiplier.toFixed(1)}x</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityRings({ focus, isDark, goalStreak = 0, dailyGoalMinutes = 30, quotaTier = 'monthly' }: {
  focus: number; isDark: boolean; goalStreak?: number; dailyGoalMinutes?: number; quotaTier?: 'monthly' | 'weekly' | 'daily'
}) {
  const hour = typeof window !== 'undefined' ? new Date().getHours() : 12
  const isEarlyBird = hour >= 6 && (hour < 10 || (hour === 10 && new Date().getMinutes() <= 30))
  const earlyBirdProgress = isEarlyBird ? 1 : 0
  const quotaBonus = quotaTier === 'daily' ? 2 : quotaTier === 'weekly' ? 1 : 0
  const streakBonus = Math.min(1, goalStreak / 30)
  const multiplier = Math.min(5, 1 + (isEarlyBird ? 1 : 0) + quotaBonus + streakBonus)
  const quotaProgress = Math.min(1, focus / Math.max(1, dailyGoalMinutes))
  const streakProgress = Math.min(1, goalStreak / 30)

  const size = 200
  const cx = size / 2, cy = size / 2
  const strokeW = 5
  const gap = 4

  const track = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  const rings = [
    { value: quotaProgress, color: '#ea580c', label: 'Quota', radius: (size - strokeW) / 2 },
    { value: streakProgress, color: '#d97706', label: 'Streak', radius: (size - strokeW) / 2 - strokeW - gap },
    { value: isEarlyBird ? earlyBirdProgress : 0, color: '#60a5fa', label: 'Early Bird', radius: (size - strokeW) / 2 - (strokeW + gap) * 2 },
  ]

  const multColor = multiplier >= 4.5 ? 'gradient' : multiplier >= 4 ? '#ea580c' : multiplier >= 3 ? '#d97706' : multiplier >= 2 ? '#4ade80' : '#94a3b8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: 6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring, i) => {
          const circ = 2 * Math.PI * ring.radius
          const gapLen = circ * 0.04
          const trackLen = circ - gapLen
          const pct = Math.min(ring.value, 1)
          const fillLen = trackLen * pct
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={ring.radius} fill="none" stroke={track} strokeWidth={strokeW} strokeLinecap="round"
                strokeDasharray={`${trackLen} ${gapLen}`}
                strokeDashoffset={-gapLen / 2}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
              <circle
                cx={cx} cy={cy} r={ring.radius} fill="none"
                stroke={ring.color} strokeWidth={strokeW} strokeLinecap="round"
                strokeDasharray={`${fillLen} ${circ - fillLen}`}
                transform={`rotate(${-90 + (gapLen / circ) * 180} ${cx} ${cy})`}
              />
            </g>
          )
        })}
        {multColor === 'gradient' ? (
          <>
            <defs>
              <linearGradient id="mult-grad-lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fcd34d" />
              </linearGradient>
            </defs>
            <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: 26, fontWeight: 400, fontFamily: 'Crimson Pro, serif', letterSpacing: '0.02em',
                fill: 'url(#mult-grad-lg)' }}>
              {multiplier.toFixed(1)}x
            </text>
          </>
        ) : (
          <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 26, fontWeight: 400, fontFamily: 'Crimson Pro, serif', letterSpacing: '0.02em',
              fill: multColor }}>
            {multiplier.toFixed(1)}x
          </text>
        )}
        <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 9, fontWeight: 400, fill: isDark ? '#5a5650' : '#a8a4a0', letterSpacing: '0.04em', fontFamily: 'Crimson Pro, serif' }}>
          {quotaTier} · {goalStreak}d streak
        </text>
      </svg>
    </div>
  )
}

interface StatsViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  xp?: number
  grove?: Tree[]
  activeNotebookId?: string
  activeNotebookName?: string
}

function getMonthGrid(entries: DailyEntry[], monthOffset = 0): { date: string; level: number; minutes: number; dayNum: number }[] {
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

const font = 'Crimson Pro, serif'

function LevelIcon({ level, size = 20 }: { level: number; size?: number }) {
  const s = size
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  switch (level) {
    case 1: // Seedling — a seed
      return <svg {...props}><ellipse cx="12" cy="14" rx="4" ry="5" fill="#fff" stroke="none" /><path d="M12 9V5" /><path d="M10 7c0-2 2-4 4-3" /></svg>
    case 2: // Sprout
      return <svg {...props}><path d="M12 20V12" /><path d="M8 16c0-4 4-6 4-6s4 2 4 6" /><path d="M10 8c-1-3 2-5 2-5s3 2 2 5" /></svg>
    case 3: // Sapling
      return <svg {...props}><path d="M12 22V10" /><path d="M7 14c0-5 5-7 5-7s5 2 5 7" /><path d="M9 10c0-4 3-6 3-6s3 2 3 6" /><path d="M10 22h4" /></svg>
    case 4: // Scribe — quill pen
      return <svg {...props}><path d="M20 4c-2 0-6 4-8 8l-1 4 4-1c4-2 8-6 8-8 0-1-1-3-3-3z" /><path d="M11 16l-4 4" /><path d="M7 20h0" /></svg>
    case 5: // Wordsmith — anvil/hammer
      return <svg {...props}><path d="M6 18h12" /><path d="M8 18v-4h8v4" /><path d="M10 14V10l2-4 2 4v4" /><path d="M12 6V3" /></svg>
    case 6: // Inkweaver — thread/loom
      return <svg {...props}><path d="M5 5c4 4 6 8 7 14" /><path d="M19 5c-4 4-6 8-7 14" /><path d="M5 12h14" /><path d="M7 8h10" /><path d="M8 16h8" /></svg>
    case 7: // Chronicler — scroll
      return <svg {...props}><path d="M8 4a2 2 0 00-2 2v1a2 2 0 002 2" /><path d="M16 4a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V9" /><path d="M10 12h4" /><path d="M10 15h4" /></svg>
    case 8: // Storyteller — open book
      return <svg {...props}><path d="M2 6c2-1 4-1 6 0 2-1 4-1 6 0" transform="translate(2 3)" /><path d="M4 9v9c2-1 4-1 6 0 2-1 4-1 6 0V9" transform="translate(2 3)" /><path d="M10 9v9" transform="translate(2 3)" /></svg>
    case 9: // Lorekeeper — key
      return <svg {...props}><circle cx="8" cy="8" r="4" /><path d="M12 12l8 8" /><path d="M17 17l2-2" /><path d="M15 19l2-2" /></svg>
    case 10: // Sage — crystal ball
      return <svg {...props}><circle cx="12" cy="11" r="7" /><path d="M12 4c-2 3-2 6 0 7s2 4 0 7" strokeWidth="1.5" /><path d="M7 19h10" /><path d="M9 21h6" /></svg>
    case 11: // Archivist — filing cabinet
      return <svg {...props}><rect x="4" y="3" width="16" height="6" rx="1" /><rect x="4" y="11" width="16" height="6" rx="1" /><path d="M10 6h4" /><path d="M10 14h4" /><path d="M8 19h8v2H8z" fill="#fff" stroke="none" /></svg>
    case 12: // Oracle — eye
      return <svg {...props}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
    case 13: // Pulp Legend — crown
      return <svg {...props}><path d="M3 18h18" /><path d="M3 18l2-10 4 4 3-6 3 6 4-4 2 10" fill="#fff" fillOpacity="0.2" /></svg>
    default:
      return <svg {...props}><polygon points="12,3 15,10 22,10 16.5,14.5 18.5,21 12,17 5.5,21 7.5,14.5 2,10 9,10" fill="#fff" fillOpacity="0.2" /></svg>
  }
}

export const StatsView = memo(function StatsView({
  isOpen, onClose, theme, xp, grove = [], activeNotebookId, activeNotebookName,
}: StatsViewProps) {
  const [dailyStats, setDailyStats] = useState<DailyEntry[]>([])
  const [heatmapOffset, setHeatmapOffset] = useState(0)
  const [goals, setGoals] = useState(loadGoals)
  const [editingGoals, setEditingGoals] = useState(false)
  const [draftGoals, setDraftGoals] = useState(loadGoals)

  const isDark = theme === 'dark'
  const bg = isDark ? '#09090b' : '#f5f3ef'
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'

  const levelColor = '#d97706'
  const emptyCell = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'

  const heatmapColors = useMemo(() => [
    emptyCell,
    isDark ? 'rgba(234,88,12,0.35)' : 'rgba(234,88,12,0.25)',
    isDark ? 'rgba(234,88,12,0.55)' : 'rgba(234,88,12,0.45)',
    isDark ? 'rgba(234,88,12,0.78)' : 'rgba(234,88,12,0.65)',
    isDark ? 'rgba(234,88,12,1)' : 'rgba(234,88,12,0.9)',
  ], [isDark, emptyCell])

  useEffect(() => {
    if (!isOpen) return
    setDailyStats(loadDailyStats())
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const lvl = getLevel(xp ?? 0)
  const xpProgress = Math.min(100, Math.floor(lvl.progress * 100))

  const monthGrid = useMemo(() => getMonthGrid(dailyStats, heatmapOffset), [dailyStats, heatmapOffset])
  const canGoBack = useMemo(() => hasActivityInRange(dailyStats, heatmapOffset + 1), [dailyStats, heatmapOffset])

  const totalMinutes = dailyStats.reduce((s, d) => s + (d.focusMinutes ?? 0), 0)
  const totalSessions = dailyStats.reduce((s, d) => s + (d.sessionsCompleted ?? 0), 0)
  const totalChars = dailyStats.reduce((s, d) => s + (d.charsWritten ?? 0), 0)
  const activeDays = dailyStats.filter(d => (d.focusMinutes ?? 0) > 0 || (d.charsWritten ?? 0) > 0).length

  const bestStreak = useMemo(() => {
    const sorted = [...dailyStats].filter(d => (d.focusMinutes ?? 0) > 0 || (d.charsWritten ?? 0) > 0).map(d => d.date).sort()
    let best = 0, run = 0
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { run = 1 } else {
        const prev = new Date(sorted[i - 1]), curr = new Date(sorted[i])
        const diff = (curr.getTime() - prev.getTime()) / 86400000
        run = diff === 1 ? run + 1 : 1
      }
      if (run > best) best = run
    }
    return best
  }, [dailyStats])

  const todayKey = new Date().toISOString().split("T")[0]
  const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayKey = yesterdayDate.toISOString().split("T")[0]
  const todayEntry = dailyStats.find(e => e.date === todayKey)
  const yesterdayEntry = dailyStats.find(e => e.date === yesterdayKey)
  const todayFocus = todayEntry?.focusMinutes ?? 0
  const todayChars = todayEntry?.charsWritten ?? 0
  const todaySessions = todayEntry?.sessionsCompleted ?? 0
  const yesterdayFocus = yesterdayEntry?.focusMinutes ?? 0
  const focusDelta = todayFocus - yesterdayFocus

  const notebookTrees = useMemo(() => activeNotebookId ? grove.filter(t => t.notebookId === activeNotebookId) : [], [grove, activeNotebookId])
  const notebookFocus = useMemo(() => {
    if (!activeNotebookId) return 0
    return notebookTrees.length * 25
  }, [notebookTrees, activeNotebookId])
  const notebookSpecies = useMemo(() => new Set(notebookTrees.map(t => t.type)).size, [notebookTrees])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[1050px] flex flex-col gap-3"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        {/* Card: Level + Rings + Stats */}
        <div
          className={`rounded-2xl ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"} border`}
          style={{ backgroundColor: bg, padding: '24px 28px', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1.5px solid ${levelColor}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 400, color: levelColor, fontFamily: font, lineHeight: 1 }}>{lvl.level}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <h2 className="text-[15px] font-normal tracking-widest" style={{ color: textPrimary, fontFamily: 'Crimson Pro, serif', whiteSpace: 'nowrap', lineHeight: 1 }}>{lvl.name}</h2>
                  <span style={{ fontSize: 8, color: textMuted, fontWeight: 400 }}>{lvl.currentXp} / {lvl.nextXp} XP</span>
                </div>
                <div style={{ flex: 1, minWidth: 60, padding: '4px 0', cursor: 'default' }} title={`${lvl.currentXp} / ${lvl.nextXp} XP`}>
                  <div style={{
                    height: 5, borderRadius: 3,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    overflow: "hidden",
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 3, background: levelColor }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: 9, color: textMuted, fontWeight: 400, whiteSpace: 'nowrap', flexShrink: 0 }}>Lv. {lvl.level + 1}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ActivityRings focus={todayFocus} isDark={isDark} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  [
                    { label: 'Total Focus', value: totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m` },
                    { label: 'Sessions', value: totalSessions.toLocaleString() },
                  ],
                  [
                    { label: 'Chars Written', value: totalChars >= 1000 ? `${(totalChars / 1000).toFixed(1)}k` : totalChars.toLocaleString() },
                    { label: 'Trees Grown', value: grove.length.toLocaleString() },
                  ],
                  [
                    { label: 'Best Streak', value: `${bestStreak}d` },
                    { label: 'Active Days', value: activeDays.toLocaleString() },
                  ],
                ].map((col, ci) => (
                  <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {col.map(({ label, value }) => (
                      <div key={label}>
                        <span style={{ fontSize: 7, fontWeight: 400, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>{label}</span>
                        <span style={{ fontSize: 14, fontWeight: 400, color: textPrimary, fontFamily: font }}>{value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Today vs Yesterday */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 8, fontWeight: 400, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</span>
                <span style={{ fontSize: 13, fontWeight: 400, color: textPrimary, fontFamily: font }}>{todayFocus}m</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: focusDelta > 0 ? '#22c55e' : focusDelta < 0 ? '#ef4444' : textMuted }}>
                  {focusDelta > 0 ? `+${focusDelta}m` : focusDelta < 0 ? `${focusDelta}m` : '—'}
                </span>
                <span style={{ fontSize: 7, color: textMuted }}>vs yesterday</span>
              </div>

              {/* Notebook Stats */}
              {activeNotebookId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 7, fontWeight: 400, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{activeNotebookName || 'Notebook'}</span>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, fontWeight: 400, color: textPrimary, fontFamily: font }}>{notebookTrees.length} trees</span>
                    <span style={{ fontSize: 13, fontWeight: 400, color: textPrimary, fontFamily: font }}>{notebookSpecies} species</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {editingGoals && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginTop: 12,
              padding: '10px 14px', borderRadius: 10,
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${cardBorder}`,
            }}>
              {([
                { key: 'focus' as const, label: 'Focus (min)', color: '#ea580c' },
                { key: 'writing' as const, label: 'Writing (chars)', color: '#d97706' },
                { key: 'sessions' as const, label: 'Sessions', color: '#f59e0b' },
              ]).map(({ key, label, color }) => (
                <div key={key} style={{ flex: 1 }}>
                  <label style={{ fontSize: 8, fontWeight: 400, color: color, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 3 }}>{label}</label>
                  <input
                    type="number"
                    min={1}
                    value={draftGoals[key]}
                    onChange={e => setDraftGoals(g => ({ ...g, [key]: Math.max(1, parseInt(e.target.value) || 1) }))}
                    style={{
                      width: '100%', fontSize: 13, fontWeight: 400, fontFamily: font,
                      color: textPrimary, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                      borderRadius: 6, padding: '4px 8px', outline: 'none',
                    }}
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  setGoals(draftGoals)
                  localStorage.setItem('pulp-ring-goals', JSON.stringify(draftGoals))
                  setEditingGoals(false)
                }}
                style={{
                  alignSelf: 'flex-end', padding: '5px 14px', borderRadius: 6,
                  background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 400, fontFamily: font,
                }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Card: Consistency Graph */}
        <div
          className={`rounded-2xl ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"} border`}
          style={{ backgroundColor: bg, padding: '20px 28px', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.3)' }}
        >
                {/* Consistency Graph */}
                {(() => {
                  let currentStreak = 0
                  for (let i = monthGrid.length - 1; i >= 0; i--) {
                    if (monthGrid[i].level > 0) currentStreak++
                    else break
                  }

                  const streakColorTiers = [
                    { min: 0,  color: '#a1a1aa' },
                    { min: 3,  color: '#34d399' },
                    { min: 7,  color: '#60a5fa' },
                    { min: 14, color: '#4d8cff' },
                    { min: 30, color: '#a855f7' },
                    { min: 45, color: '#c4a6ff' },
                    { min: 60, color: '#ffd700' },
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

                  const endDay = endDate.getDay()
                  const adjustedEnd = new Date(endDate)
                  adjustedEnd.setDate(adjustedEnd.getDate() + (6 - endDay))

                  const grid: (typeof monthGrid[0] | null)[][] = []
                  const dateOrder: { col: number; row: number; cell: typeof monthGrid[0] }[] = []
                  const d = new Date(adjustedStart)
                  let col = 0
                  while (d <= adjustedEnd) {
                    const week: (typeof monthGrid[0] | null)[] = []
                    for (let dow = 0; dow < 7; dow++) {
                      const key = d.toISOString().split('T')[0]
                      const entry = weekMap.get(key) ?? null
                      week.push(entry)
                      if (entry) dateOrder.push({ col, row: dow, cell: entry })
                      d.setDate(d.getDate() + 1)
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
                      if (runStart !== -1) { runs.push({ start: runStart, length: i - runStart }); runStart = -1 }
                    }
                  }
                  if (runStart !== -1) runs.push({ start: runStart, length: dateOrder.length - runStart })

                  const fireColor = currentStreak > 0 ? getStreakColor(currentStreak) : '#d97706'
                  const fireGlow = currentStreak >= 60 ? 12 : currentStreak >= 30 ? 8 : currentStreak >= 14 ? 5 : currentStreak >= 7 ? 3 : 0
                  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 400, color: isDark ? '#5a5650' : '#a8a4a0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Crimson Pro, serif' }}>Consistency</span>
                          {currentStreak > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <motion.svg
                                width="14" height="14" viewBox="0 0 24 24" fill={fireColor} stroke="none"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ filter: fireGlow > 0 ? `drop-shadow(0 0 ${fireGlow}px ${fireColor})` : undefined }}
                              >
                                <path d="M12 2c0 4-4 6-4 10a4 4 0 008 0c0-4-4-6-4-10z" />
                                <path d="M12 12c0 2-1.5 3-1.5 4.5a1.5 1.5 0 003 0c0-1.5-1.5-2.5-1.5-4.5z" fill="#fbbf24" />
                              </motion.svg>
                              <span style={{ fontSize: 12, fontWeight: 400, color: fireColor, fontFamily: 'Crimson Pro, serif' }}>{currentStreak}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {canGoBack && (
                            <button onClick={() => setHeatmapOffset(o => o + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: textMuted, display: 'flex' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            </button>
                          )}
                          <span style={{ fontSize: 9, color: textMuted }}>{heatmapOffset === 0 ? '180 days' : `${heatmapOffset * 180 + 120}–${heatmapOffset * 180 + 1}d ago`}</span>
                          {heatmapOffset > 0 && (
                            <button onClick={() => setHeatmapOffset(o => o - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: textMuted, display: 'flex' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%' }}>
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
                            const rA = a.cell.level === 0 ? 4 : [0, 2.5, 3, 3.8, 4.5][a.cell.level]
                            const rB = b.cell.level === 0 ? 4 : [0, 2.5, 3, 3.8, 4.5][b.cell.level]
                            const nx = dx / dist, ny = dy / dist
                            segments.push(
                              <line key={`${ri}-${j}`}
                                x1={x1 + nx * rA} y1={y1 + ny * rA}
                                x2={x2 - nx * rB} y2={y2 - ny * rB}
                                stroke={color} strokeWidth="0.5" strokeLinecap="round" />
                            )
                          }
                          return <g key={ri}>{segments}</g>
                        })}
                        {grid.map((week, col) => week.map((c, row) => {
                          if (!c) return null
                          const isEmpty = c.level === 0
                          const r = isEmpty ? 4 : [0, 2.5, 3, 3.8, 4.5][c.level]
                          return (
                            <g key={c.date}>
                              <circle cx={px(col)} cy={py(row)} r={r}
                                fill={isEmpty ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)') : heatmapColors[c.level]} />
                              {isEmpty && (
                                <text x={px(col)} y={py(row)} textAnchor="middle" dominantBaseline="central"
                                  fill={isDark ? '#6a6660' : '#8a8680'} fontSize="3" fontWeight="600">{c.dayNum}</text>
                              )}
                            </g>
                          )
                        }))}
                      </svg>

                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-start" }}>
                        <span style={{ fontSize: 8, color: textMuted }}>Less</span>
                        {heatmapColors.slice(1).map((c, i) => (
                          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c }} />
                        ))}
                        <span style={{ fontSize: 8, color: textMuted }}>More</span>
                      </div>
                    </div>
                  )
                })()}
        </div>

        {/* Card: Recently Grown */}
        {grove.length > 0 && (() => {
          const recent = [...grove].sort((a, b) => new Date(b.plantedAt).getTime() - new Date(a.plantedAt).getTime()).slice(0, 10)
          const itemW = 80
          const styled = recent.map((tree, i) => {
            const seed = ((tree.type.charCodeAt(0) * 7 + i * 13) % 100) / 100
            return { tree, yOff: Math.round(seed * 8 - 2), tilt: ((seed * 6) - 3) * 0.7, size: 38 + Math.round(seed * 6) }
          })
          const halfW = styled.length * itemW
          const doubled = [...styled, ...styled]
          return (
            <div
              className={`rounded-2xl ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"} border`}
              style={{ position: 'relative', height: 90, overflow: 'hidden', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.3)' }}
            >
              <span style={{ position: 'absolute', top: 6, left: 12, fontSize: 10, fontWeight: 400, color: isDark ? '#5a5650' : '#a8a4a0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Crimson Pro, serif', zIndex: 2 }}>Recently Grown</span>
              <div style={{
                position: 'absolute', inset: 0,
                background: isDark
                  ? 'linear-gradient(180deg, #09090b 0%, #110f0a 30%, #1a1610 55%, #2a2418 80%, #1e1a12 100%)'
                  : 'linear-gradient(180deg, #f5f3ef 0%, #ebe5d8 30%, #ddd5c4 55%, #c8b890 80%, #b0a078 100%)',
              }} />
              <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 30 }} preserveAspectRatio="none" viewBox="0 0 100 10">
                <ellipse cx="15" cy="6" rx="18" ry="5" fill={isDark ? '#2e2818' : '#c0a878'} />
                <ellipse cx="50" cy="7" rx="30" ry="4.5" fill={isDark ? '#2a2414' : '#baa470'} />
                <ellipse cx="85" cy="5.5" rx="20" ry="5.5" fill={isDark ? '#2c2616' : '#c4ac7c'} />
                <rect y="8" width="100" height="3" fill={isDark ? '#1a1610' : '#b09a68'} />
              </svg>
              <div style={{
                position: 'absolute', bottom: 12, left: 0, right: 0, height: 60,
                overflow: 'hidden',
                maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-end', width: halfW * 2,
                  animation: 'conveyorScroll 40s linear infinite',
                  willChange: 'transform',
                }}>
                  {doubled.map(({ tree, yOff, tilt, size }, i) => (
                    <div key={`t-${i}`} title={TREE_TYPES[tree.type]?.name ?? tree.type} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      width: itemW, flexShrink: 0,
                      marginBottom: yOff,
                      transform: `rotate(${tilt}deg)`,
                    }}>
                      <PlantIcon type={tree.type} size={size} stage={tree.stage} hideGround disableSway />
                      <div style={{
                        width: size * 0.6, height: 4, borderRadius: '50%', marginTop: -2,
                        background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)',
                        filter: 'blur(1.5px)',
                      }} />
                    </div>
                  ))}
                </div>
              </div>
              <style>{`@keyframes conveyorScroll { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
            </div>
          )
        })()}
      </div>
    </div>
  )
})
