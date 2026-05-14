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

export function MiniRings({ isDark, onClick }: { isDark: boolean; onClick?: () => void }) {
  const [today, setToday] = useState<DailyEntry | null>(getTodayEntry)

  useEffect(() => {
    const refresh = () => setToday(getTodayEntry())
    const id = setInterval(refresh, 30000)
    window.addEventListener("storage", refresh)
    return () => { clearInterval(id); window.removeEventListener("storage", refresh) }
  }, [])

  const size = 56
  const cx = size / 2, cy = size / 2
  const strokeW = 2.5
  const gap = 2

  const rings = [
    { value: today?.focusMinutes ?? 0, goal: RING_GOALS.focus, color: '#ea580c', radius: (size - strokeW) / 2 },
    { value: today?.charsWritten ?? 0, goal: RING_GOALS.writing, color: '#d97706', radius: (size - strokeW) / 2 - strokeW - gap },
    { value: today?.sessionsCompleted ?? 0, goal: RING_GOALS.sessions, color: '#f59e0b', radius: (size - strokeW) / 2 - (strokeW + gap) * 2 },
  ]

  return (
    <button
      onClick={onClick}
      title="Today's progress"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', padding: 0,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring, i) => {
          const circ = 2 * Math.PI * ring.radius
          const gapLen = circ * 0.04
          const trackLen = circ - gapLen
          const pct = Math.min(ring.value / ring.goal, 1)
          const fillLen = trackLen * pct
          const track = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'
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
      </svg>
    </button>
  )
}

function ActivityRings({ focus, writing, sessions, isDark, goals, onEditGoals }: {
  focus: number; writing: number; sessions: number; isDark: boolean
  goals: typeof DEFAULT_GOALS; onEditGoals: () => void
}) {
  const size = 190
  const cx = size / 2, cy = size / 2
  const strokeW = 4
  const gap = 5

  const rings = [
    { value: focus, goal: goals.focus, color: '#ea580c', label: 'Focus', unit: 'min', radius: (size - strokeW) / 2 },
    { value: writing, goal: goals.writing, color: '#d97706', label: 'Write', unit: 'chars', radius: (size - strokeW) / 2 - strokeW - gap },
    { value: sessions, goal: goals.sessions, color: '#f59e0b', label: 'Sessions', unit: '', radius: (size - strokeW) / 2 - (strokeW + gap) * 2 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: isDark ? '#5a5650' : '#a8a4a0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Daily Goals</span>
        <button
          onClick={onEditGoals}
          title="Edit goals"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isDark ? '#5a5650' : '#a8a4a0', display: 'flex' }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
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
                strokeDasharray={`${trackLen} ${gapLen}`}
                strokeDashoffset={-gapLen / 2}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
              <motion.circle
                cx={cx} cy={cy} r={ring.radius} fill="none"
                stroke={ring.color} strokeWidth={strokeW} strokeLinecap="round"
                strokeDasharray={`${fillLen} ${circ - fillLen}`}
                initial={{ strokeDashoffset: 0, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                transform={`rotate(${-90 + (gapLen / circ) * 180} ${cx} ${cy})`}
                style={{ filter: `drop-shadow(0 0 4px ${ring.color}66)` }}
              />
              {complete && (
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 1.2 + i * 0.1 }}
                  style={{ transformOrigin: `${checkX}px ${checkY}px` }}
                >
                  <circle cx={checkX} cy={checkY} r={strokeW + 2.5} fill="none" stroke={ring.color} strokeWidth={0.5} opacity={0.35} />
                  <circle cx={checkX} cy={checkY} r={strokeW + 1} fill={ring.color} />
                  <path
                    d={`M${checkX - 2.5} ${checkY + 0.5} l2 2 l3.5 -4`}
                    fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                </motion.g>
              )}
            </g>
          )
        })}
        {rings.map((ring, i) => {
          const pct = Math.min(Math.round((ring.value / ring.goal) * 100), 999)
          const abbr = ['mins', 'char', 'sesh'][i]
          const y = cy - 10 + i * 13
          return (
            <text key={`label-${i}`} x={cx} y={y} textAnchor="middle" dominantBaseline="central">
              <tspan style={{ fontSize: 9, fontWeight: 600, fill: ring.color }}>{pct}% {abbr}</tspan>
            </text>
          )
        })}
      </svg>
    </div>
  )
}

interface StatsViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  xp: number
  grove?: Tree[]
}

function getMonthGrid(entries: DailyEntry[], monthOffset = 0): { date: string; level: number; minutes: number; dayNum: number }[] {
  const map = new Map(entries.map(e => [e.date, e]))
  const today = new Date()
  const days = 90
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
  const days = 90
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

function getMonthData(entries: DailyEntry[]) {
  const today = new Date()
  const map = new Map(entries.map(e => [e.date, e]))
  const result: { label: string; focusMinutes: number; charsWritten: number; sessions: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    const entry = map.get(key)
    result.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      focusMinutes: entry?.focusMinutes ?? 0,
      charsWritten: entry?.charsWritten ?? 0,
      sessions: entry?.sessionsCompleted ?? 0,
    })
  }
  return result
}

function LineGraph({ data, isDark, focusColor, writingColor, textMuted }: {
  data: { label: string; focusMinutes: number; charsWritten: number }[]
  isDark: boolean; focusColor: string; writingColor: string; textMuted: string
}) {
  const W = 400, H = 140, padL = 30, padR = 8, padT = 12, padB = 20
  const gW = W - padL - padR, gH = H - padT - padB
  const maxF = Math.max(1, ...data.map(d => d.focusMinutes))
  const maxC = Math.max(1, ...data.map(d => d.charsWritten))

  const buildPath = (values: number[], max: number) => {
    if (values.length < 2) return ''
    const pts = values.map((v, i) => ({
      x: padL + (i / (values.length - 1)) * gW,
      y: padT + gH - (v / max) * gH,
    }))
    let d = `M${pts[0].x},${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1], curr = pts[i]
      const cpx = (prev.x + curr.x) / 2
      d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
    }
    return d
  }

  const buildArea = (path: string) => {
    if (!path) return ''
    return path + ` L${padL + gW},${padT + gH} L${padL},${padT + gH} Z`
  }

  const focusPath = buildPath(data.map(d => d.focusMinutes), maxF)
  const charsPath = buildPath(data.map(d => d.charsWritten), maxC)

  const gridLines = 4
  const labelInterval = Math.ceil(data.length / 6)

  const niceStep = (max: number, ticks: number) => {
    const raw = max / ticks
    const mag = Math.pow(10, Math.floor(Math.log10(raw)))
    const norm = raw / mag
    const step = norm <= 1.5 ? 1 : norm <= 3 ? 2 : norm <= 7 ? 5 : 10
    return step * mag
  }
  const focusStep = niceStep(maxF, 3)
  const focusTicks: number[] = []
  for (let v = focusStep; v <= maxF; v += focusStep) focusTicks.push(v)

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = padT + (i / gridLines) * gH
        return <line key={i} x1={padL} y1={y} x2={padL + gW} y2={y} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth="0.5" />
      })}
      {focusTicks.map(v => {
        const y = padT + gH - (v / maxF) * gH
        return <text key={`fy-${v}`} x={padL - 4} y={y + 2.5} textAnchor="end" fontSize="6.5" fill={textMuted}>{v >= 1000 ? `${(v/1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v}</text>
      })}
      {data.map((d, i) => {
        if (i % labelInterval !== 0 && i !== data.length - 1) return null
        const x = padL + (i / (data.length - 1)) * gW
        return <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="7" fill={textMuted}>{d.label}</text>
      })}
      <defs>
        <linearGradient id="focus-area-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={focusColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={focusColor} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="chars-area-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={writingColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={writingColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {charsPath && <path d={buildArea(charsPath)} fill="url(#chars-area-g)" />}
      {focusPath && <path d={buildArea(focusPath)} fill="url(#focus-area-g)" />}
      {charsPath && <path d={charsPath} fill="none" stroke={writingColor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />}
      {focusPath && <path d={focusPath} fill="none" stroke={focusColor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

const font = '"EB Garamond", serif'

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
  isOpen, onClose, theme, xp, grove = [],
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

  const focusColor = '#d97706'
  const writingColor = '#ea580c'
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

  const lvl = getLevel(xp)
  const xpProgress = Math.min(100, Math.floor(lvl.progress * 100))

  const monthGrid = useMemo(() => getMonthGrid(dailyStats, heatmapOffset), [dailyStats, heatmapOffset])
  const canGoBack = useMemo(() => hasActivityInRange(dailyStats, heatmapOffset + 1), [dailyStats, heatmapOffset])
  const monthData = useMemo(() => getMonthData(dailyStats), [dailyStats])

  const totalFocusMonth = monthData.reduce((s, d) => s + d.focusMinutes, 0)
  const totalSessionsMonth = monthData.reduce((s, d) => s + d.sessions, 0)
  const totalCharsMonth = monthData.reduce((s, d) => s + d.charsWritten, 0)

  const totalMinutes = dailyStats.reduce((s, d) => s + (d.focusMinutes ?? 0), 0)


  const todayKey = new Date().toISOString().split("T")[0]
  const todayEntry = dailyStats.find(e => e.date === todayKey)
  const todayFocus = todayEntry?.focusMinutes ?? 0
  const todayChars = todayEntry?.charsWritten ?? 0
  const todaySessions = todayEntry?.sessionsCompleted ?? 0

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/60 p-4"
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        className={`relative w-full max-w-[1050px] rounded-2xl overflow-hidden flex flex-col ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"} border shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)]`}
        style={{ backgroundColor: bg, maxHeight: '72vh' }}
      >
        {/* Header with stats */}
        <div className="px-8 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3" style={{ flex: 1 }}>
              <button
                onClick={onClose}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1.5px solid ${levelColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: levelColor, fontFamily: font, lineHeight: 1 }}>{lvl.level}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <h2 className="text-[15px] font-bold tracking-widest" style={{ color: textPrimary, fontFamily: '"EB Garamond", serif', whiteSpace: 'nowrap', lineHeight: 1 }}>{lvl.name}</h2>
                    <span style={{ fontSize: 8, color: textMuted, fontWeight: 500 }}>{lvl.currentXp} / {lvl.nextXp} XP</span>
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
                  <span style={{ fontSize: 9, color: textMuted, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>Lv. {lvl.level + 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Rings + Consistency */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ flex: '0 0 280px', display: 'flex', justifyContent: 'center' }}>
              <ActivityRings focus={todayFocus} writing={todayChars} sessions={todaySessions} isDark={isDark} goals={goals} onEditGoals={() => { setDraftGoals(goals); setEditingGoals(e => !e) }} />
            </div>

            <svg width="24" height="14" viewBox="0 0 24 14" style={{ flexShrink: 0, opacity: 0.08, marginLeft: -28, marginRight: -12 }}>
              <path d="M0 7 L18 7" stroke={isDark ? '#fff' : '#000'} strokeWidth="1" strokeLinecap="round" />
              <path d="M15 3 L21 7 L15 11" fill="none" stroke={isDark ? '#fff' : '#000'} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

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
              const baseOffset = heatmapOffset * 90
              const endDate = new Date(today)
              endDate.setDate(endDate.getDate() - baseOffset)
              const startDate = new Date(endDate)
              startDate.setDate(startDate.getDate() - 89)

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
              const cellSize = 11, colGap = 10, rowGap = 2
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
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: isDark ? '#111110' : '#edeae4', borderRadius: 10, padding: '12px 14px', margin: '-12px -14px' }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: '"EB Garamond", serif' }}>Consistency</span>
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
                          <span style={{ fontSize: 12, fontWeight: 800, color: fireColor, fontFamily: '"EB Garamond", serif' }}>{currentStreak}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {canGoBack && (
                        <button onClick={() => setHeatmapOffset(o => o + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: textMuted, display: 'flex' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                      )}
                      <span style={{ fontSize: 9, color: textMuted }}>{heatmapOffset === 0 ? '90 days' : `${heatmapOffset * 90 + 60}–${heatmapOffset * 90 + 1}d ago`}</span>
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
                            fill={isEmpty ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)') : heatmapColors[c.level]} />
                          {isEmpty && (
                            <text x={px(col)} y={py(row)} textAnchor="middle" dominantBaseline="central"
                              fill={isDark ? '#6a6660' : '#8a8680'} fontSize="3" fontWeight="600">{c.dayNum}</text>
                          )}
                        </g>
                      )
                    }))}
                  </svg>

                  <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 6, justifyContent: "flex-start" }}>
                    <span style={{ fontSize: 7, color: textMuted, marginRight: 1 }}>Less</span>
                    {heatmapColors.slice(1).map((c, i) => {
                      const s = [6, 8, 10, 12][i]
                      return <div key={i} style={{ width: s, height: s, borderRadius: '50%', backgroundColor: c }} />
                    })}
                    <span style={{ fontSize: 7, color: textMuted, marginLeft: 2 }}>More</span>
                  </div>
                </div>
              )
            })()}
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
                  <label style={{ fontSize: 8, fontWeight: 600, color: color, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 3 }}>{label}</label>
                  <input
                    type="number"
                    min={1}
                    value={draftGoals[key]}
                    onChange={e => setDraftGoals(g => ({ ...g, [key]: Math.max(1, parseInt(e.target.value) || 1) }))}
                    style={{
                      width: '100%', fontSize: 13, fontWeight: 700, fontFamily: font,
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
                  fontSize: 10, fontWeight: 700, fontFamily: font,
                }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderBottom: `1px solid ${cardBorder}` }}>
        </div>

        <div style={{ flex: 1, display: "flex", gap: 24, padding: "24px 32px", overflowY: "auto", minHeight: 0 }}>
              {/* Stats summary + Collection */}
              <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10,
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${cardBorder}`,
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: textPrimary, fontFamily: font, display: 'block', lineHeight: 1 }}>{totalMinutes}</span>
                    <span style={{ fontSize: 8, fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2, display: 'block' }}>total min</span>
                  </div>
                  <div style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10,
                    background: isDark ? 'rgba(217,119,6,0.06)' : 'rgba(217,119,6,0.08)',
                    border: `1px solid ${isDark ? 'rgba(217,119,6,0.12)' : 'rgba(217,119,6,0.15)'}`,
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#d97706', fontFamily: font, display: 'block', lineHeight: 1 }}>{new Set(grove.map(t => t.type)).size}/{Object.keys(TREE_TYPES).length}</span>
                    <span style={{ fontSize: 8, fontWeight: 600, color: isDark ? '#a1856a' : '#b8956a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2, display: 'block' }}>collected</span>
                  </div>
                </div>

              </div>

              {/* Activity Line Graph */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: '"EB Garamond", serif' }}>Activity</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 3, borderRadius: 2, backgroundColor: focusColor }} />
                      <span style={{ fontSize: 8, color: textMuted }}>Focus</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 3, borderRadius: 2, backgroundColor: writingColor }} />
                      <span style={{ fontSize: 8, color: textMuted }}>Writing</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
                  {[
                    { label: "Focus", value: totalFocusMonth, unit: "min", color: focusColor },
                    { label: "Sessions", value: totalSessionsMonth, unit: "", color: textPrimary },
                    { label: "Written", value: totalCharsMonth.toLocaleString(), unit: "chars", color: writingColor },
                  ].map((s, i) => (
                    <div key={s.label} style={{
                      flex: 1,
                      paddingLeft: i > 0 ? 14 : 0,
                      borderLeft: i > 0 ? `1px solid ${cardBorder}` : 'none',
                    }}>
                      <div style={{ fontSize: 8, color: textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: s.color, fontFamily: font }}>
                        {s.value}
                        {s.unit && <span style={{ fontSize: 9, color: textMuted, marginLeft: 3 }}>{s.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ flex: 1, minHeight: 140 }}>
                  <LineGraph data={monthData} isDark={isDark} focusColor={focusColor} writingColor={writingColor} textMuted={textMuted} />
                </div>
              </div>
        </div>

        <div style={{
          height: 3, flexShrink: 0,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
        }} />

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
            <div style={{
              position: 'relative', height: 90, flexShrink: 0, overflow: 'hidden',
            }}>
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
