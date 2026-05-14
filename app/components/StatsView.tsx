"use client"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { getLevel } from "@/app/constants"
import { loadDailyStats, type DailyEntry } from "@/app/lib/dailyStats"

const RING_GOALS = { focus: 60, writing: 2000, sessions: 3 }

export function MiniRings({ isDark, onClick }: { isDark: boolean; onClick?: () => void }) {
  const [today, setToday] = useState<DailyEntry | null>(null)

  const refresh = useCallback(() => {
    const key = new Date().toISOString().split("T")[0]
    const entry = loadDailyStats().find(e => e.date === key)
    setToday(entry ?? null)
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30000)
    window.addEventListener("storage", refresh)
    return () => { clearInterval(id); window.removeEventListener("storage", refresh) }
  }, [refresh])

  const size = 44
  const cx = size / 2, cy = size / 2
  const strokeW = 4
  const gap = 1.5

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
          const pct = Math.min(ring.value / ring.goal, 1)
          const track = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={ring.radius} fill="none" stroke={track} strokeWidth={strokeW} strokeLinecap="round" />
              <circle
                cx={cx} cy={cy} r={ring.radius} fill="none"
                stroke={ring.color} strokeWidth={strokeW} strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            </g>
          )
        })}
      </svg>
    </button>
  )
}

function ActivityRings({ focus, writing, sessions, isDark }: { focus: number; writing: number; sessions: number; isDark: boolean }) {
  const size = 180
  const cx = size / 2, cy = size / 2
  const strokeW = 14
  const gap = 4

  const rings = [
    { value: focus, goal: RING_GOALS.focus, color: '#ea580c', label: 'Focus', unit: 'min', radius: (size - strokeW) / 2 },
    { value: writing, goal: RING_GOALS.writing, color: '#d97706', label: 'Write', unit: 'chars', radius: (size - strokeW) / 2 - strokeW - gap },
    { value: sessions, goal: RING_GOALS.sessions, color: '#f59e0b', label: 'Sessions', unit: '', radius: (size - strokeW) / 2 - (strokeW + gap) * 2 },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {rings.map((ring, i) => {
            const circ = 2 * Math.PI * ring.radius
            const pct = Math.min(ring.value / ring.goal, 1)
            const trackColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={ring.radius} fill="none" stroke={trackColor} strokeWidth={strokeW} strokeLinecap="round" />
                <motion.circle
                  cx={cx} cy={cy} r={ring.radius} fill="none"
                  stroke={ring.color} strokeWidth={strokeW} strokeLinecap="round"
                  strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: circ * (1 - pct) }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ filter: `drop-shadow(0 0 4px ${ring.color}66)` }}
                />
              </g>
            )
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rings.map((ring, i) => {
          const pct = Math.min(Math.round((ring.value / ring.goal) * 100), 999)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: ring.color, flexShrink: 0, boxShadow: `0 0 6px ${ring.color}44` }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: ring.color, lineHeight: 1 }}>
                  {ring.value}{ring.unit ? <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.7 }}> {ring.unit}</span> : null}
                  <span style={{ fontSize: 9, fontWeight: 500, color: isDark ? '#6a6660' : '#a0a0a0', marginLeft: 4 }}>/ {ring.goal}</span>
                </div>
                <div style={{ fontSize: 8, color: isDark ? '#5a5650' : '#a8a4a0', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 1 }}>
                  {ring.label} · {pct}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface StatsViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  xp: number
  streak?: number
}

function getMonthGrid(entries: DailyEntry[]): { date: string; level: number; minutes: number; dayNum: number }[] {
  const map = new Map(entries.map(e => [e.date, e]))
  const today = new Date()
  const grid: { date: string; level: number; minutes: number; dayNum: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    const entry = map.get(key)
    const minutes = entry?.focusMinutes ?? 0
    let level = 0
    if (minutes > 0) level = 1
    if (minutes >= 15) level = 2
    if (minutes >= 45) level = 3
    if (minutes >= 90) level = 4
    grid.push({ date: key, level, minutes, dayNum: d.getDate() })
  }
  return grid
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

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = padT + (i / gridLines) * gH
        return <line key={i} x1={padL} y1={y} x2={padL + gW} y2={y} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth="0.5" />
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
      {charsPath && <path d={charsPath} fill="none" stroke={writingColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />}
      {focusPath && <path d={focusPath} fill="none" stroke={focusColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
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
  isOpen, onClose, theme, xp, streak = 0,
}: StatsViewProps) {
  const [dailyStats, setDailyStats] = useState<DailyEntry[]>([])

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
    isDark ? 'rgba(234,88,12,0.25)' : 'rgba(234,88,12,0.2)',
    isDark ? 'rgba(234,88,12,0.45)' : 'rgba(234,88,12,0.4)',
    isDark ? 'rgba(234,88,12,0.7)' : 'rgba(234,88,12,0.6)',
    isDark ? 'rgba(234,88,12,0.95)' : 'rgba(234,88,12,0.85)',
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

  const monthGrid = useMemo(() => getMonthGrid(dailyStats), [dailyStats])
  const monthData = useMemo(() => getMonthData(dailyStats), [dailyStats])

  const totalFocusMonth = monthData.reduce((s, d) => s + d.focusMinutes, 0)
  const totalSessionsMonth = monthData.reduce((s, d) => s + d.sessions, 0)
  const totalCharsMonth = monthData.reduce((s, d) => s + d.charsWritten, 0)

  const totalMinutes = dailyStats.reduce((s, d) => s + (d.focusMinutes ?? 0), 0)
  const totalSessions = dailyStats.reduce((s, d) => s + (d.sessionsCompleted ?? 0), 0)

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
        className={`relative w-full max-w-[1060px] rounded-2xl overflow-hidden flex flex-col ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"} border shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)]`}
        style={{ backgroundColor: bg, maxHeight: '85vh' }}
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
                  <h2 className="text-[15px] font-bold tracking-widest" style={{ color: textPrimary, fontFamily: '"EB Garamond", serif', whiteSpace: 'nowrap' }}>{lvl.name}</h2>
                  <div style={{ flex: 1, minWidth: 60 }}>
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
                <p className="text-[11px] mt-1" style={{ color: textMuted, fontFamily: '"EB Garamond", serif' }}>{lvl.currentXp} / {lvl.nextXp} XP</p>
              </div>
            </div>
          </div>

          {/* Activity Rings + Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ActivityRings focus={todayFocus} writing={todayChars} sessions={todaySessions} isDark={isDark} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Streak + totals row */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  flex: 1, padding: '8px 10px', borderRadius: 10,
                  background: isDark ? 'rgba(251,146,60,0.06)' : 'rgba(251,146,60,0.08)',
                  border: `1px solid ${isDark ? 'rgba(251,146,60,0.12)' : 'rgba(251,146,60,0.15)'}`,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#d97706', fontFamily: font, display: 'block', lineHeight: 1 }}>{streak}</span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: isDark ? '#a1856a' : '#b8956a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>day streak</span>
                </div>
                <div style={{
                  flex: 1, padding: '8px 10px', borderRadius: 10,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${cardBorder}`,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: textPrimary, fontFamily: font, display: 'block', lineHeight: 1 }}>{totalMinutes}</span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>total min</span>
                </div>
                <div style={{
                  flex: 1, padding: '8px 10px', borderRadius: 10,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${cardBorder}`,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: textPrimary, fontFamily: font, display: 'block', lineHeight: 1 }}>{totalSessions}</span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>sessions</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Content — heatmap left, line graph right */}
        <div style={{ flex: 1, display: "flex", gap: 24, padding: "24px 32px", overflowY: "auto", minHeight: 0 }}>

          {/* Consistency Heatmap — 30 days */}
          <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: textSecondary, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: '"EB Garamond", serif' }}>Consistency</span>
              <span style={{ fontSize: 9, color: textMuted }}>30 days</span>
            </div>

            {/* 30-day grid: 5 rows of 6 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3 }}>
              {monthGrid.map((cell) => (
                <div
                  key={cell.date}
                  title={`${cell.date}: ${cell.minutes > 0 ? `${cell.minutes} min` : 'No activity'}`}
                  style={{
                    aspectRatio: '1', borderRadius: 4,
                    backgroundColor: heatmapColors[cell.level],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7, color: cell.level >= 3 ? '#fff' : textMuted, fontWeight: 600,
                  }}
                >
                  {cell.dayNum}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 8, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 8, color: textMuted, marginRight: 2 }}>Less</span>
              {heatmapColors.slice(1).map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: c }} />
              ))}
              <span style={{ fontSize: 8, color: textMuted, marginLeft: 2 }}>More</span>
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

            {/* Summary row */}
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

            {/* Line chart */}
            <div style={{ flex: 1, minHeight: 140 }}>
              <LineGraph data={monthData} isDark={isDark} focusColor={focusColor} writingColor={writingColor} textMuted={textMuted} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
})
