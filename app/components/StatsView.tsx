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

  const todayKey = new Date().toISOString().split("T")[0]
  const todayEntry = dailyStats.find(e => e.date === todayKey)
  const todayFocus = todayEntry?.focusMinutes ?? 0
  const todayChars = todayEntry?.charsWritten ?? 0
  const todaySessions = todayEntry?.sessionsCompleted ?? 0

  const bestFocusDay = useMemo(() => dailyStats.reduce((best, d) => (d.focusMinutes ?? 0) > (best?.focusMinutes ?? 0) ? d : best, dailyStats[0]), [dailyStats])
  const bestWritingDay = useMemo(() => dailyStats.reduce((best, d) => (d.charsWritten ?? 0) > (best?.charsWritten ?? 0) ? d : best, dailyStats[0]), [dailyStats])
  const totalMinutes = dailyStats.reduce((s, d) => s + (d.focusMinutes ?? 0), 0)
  const totalSessions = dailyStats.reduce((s, d) => s + (d.sessionsCompleted ?? 0), 0)
  const totalChars = dailyStats.reduce((s, d) => s + (d.charsWritten ?? 0), 0)

  const thisWeek = monthData.slice(-7)
  const lastWeek = monthData.slice(-14, -7)
  const twFocus = thisWeek.reduce((s, d) => s + d.focusMinutes, 0)
  const lwFocus = lastWeek.reduce((s, d) => s + d.focusMinutes, 0)
  const twChars = thisWeek.reduce((s, d) => s + d.charsWritten, 0)
  const lwChars = lastWeek.reduce((s, d) => s + d.charsWritten, 0)
  const twSessions = thisWeek.reduce((s, d) => s + d.sessions, 0)
  const lwSessions = lastWeek.reduce((s, d) => s + d.sessions, 0)
  const delta = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+∞' : '—'
    const pct = Math.round(((curr - prev) / prev) * 100)
    return pct >= 0 ? `+${pct}%` : `${pct}%`
  }
  const deltaColor = (curr: number, prev: number) => curr >= prev ? '#22c55e' : '#ef4444'

  if (!isOpen) return null

  return (
    <div className={`absolute inset-0 z-40 flex flex-col ${isDark ? "bg-[#09090b] text-zinc-100" : "bg-[#f5f3f1] text-zinc-900"}`}>

      {/* ── CSS keyframes for stats decorations ── */}
      <style>{`
        @keyframes stats-float-0 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(6px,-10px); } }
        @keyframes stats-float-1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-8px,-6px); } }
        @keyframes stats-float-2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(4px,8px); } }
        @keyframes stats-float-3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-5px,-12px); } }
        @keyframes stats-float-4 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(7px,6px); } }
        @keyframes stats-float-5 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-6px,-8px); } }
        .stats-heatmap-cell {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .stats-heatmap-cell:hover {
          transform: scale(1.18);
          box-shadow: 0 0 6px rgba(217,119,6,0.35);
        }
      `}</style>

      {/* ── Top bar ── */}
      <div className={`px-6 pt-4 pb-3 border-b shrink-0 flex items-center gap-3 ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"}`}>
        <button onClick={onClose}
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <h2 className={`text-[15px] font-bold tracking-widest ${isDark ? "text-[#dcd8d0]" : "text-[#2a2620]"}`} style={{ fontFamily: '"EB Garamond", serif' }}>Stats</h2>

        {/* Streak */}
        <div className="relative flex items-center gap-1.5 ml-3">
          <div className="absolute inset-0 -m-1 rounded-lg pointer-events-none" style={{
            background: `radial-gradient(circle at 50% 50%, rgba(217,119,6,${Math.min(0.06 + streak * 0.003, 0.18)}) 0%, transparent 70%)`,
          }} />
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="relative">
            {streak >= 30 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <motion.path d="M12 2C8 7 4 10 4 14a8 8 0 0016 0c0-4-4-7-8-12z" fill="#d97706" fillOpacity="0.9"
                  animate={{ scale: [1, 1.08, 1], filter: ['drop-shadow(0 0 4px #d97706)', 'drop-shadow(0 0 8px #ea580c)', 'drop-shadow(0 0 4px #d97706)'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
                <path d="M12 8c-2 3-4 5-4 7a4 4 0 008 0c0-2-2-4-4-7z" fill="#f59e0b" fillOpacity="0.8" />
                <path d="M12 13c-1 1.5-2 2.5-2 3.5a2 2 0 004 0c0-1-1-2-2-3.5z" fill="#fbbf24" fillOpacity="0.9" />
              </svg>
            ) : streak >= 7 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <motion.path d="M12 2C8 7 4 10 4 14a8 8 0 0016 0c0-4-4-7-8-12z" fill="#d97706" fillOpacity="0.85"
                  animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
                <path d="M12 9c-2 2.5-3.5 4.5-3.5 6.5a3.5 3.5 0 007 0c0-2-1.5-4-3.5-6.5z" fill="#f59e0b" fillOpacity="0.7" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <motion.path d="M12 3C9 7 5 10 5 14a7 7 0 0014 0c0-4-4-7-7-11z" fill="#d97706" fillOpacity="0.7"
                  animate={{ scale: [1, 1.06, 1], opacity: [0.7, 0.9, 0.7] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
              </svg>
            )}
          </motion.div>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="text-[18px] font-extrabold leading-none relative"
            style={{ color: '#d97706', fontFamily: font, textShadow: `0 0 ${Math.min(8 + streak * 0.2, 20)}px rgba(217,119,6,${Math.min(0.25 + streak * 0.004, 0.5)})` }}>
            {streak}
          </motion.span>
          {streak >= 100 ? (
            <div className="flex items-center gap-0.5 px-1.5 py-px rounded-full ml-0.5" style={{ background: 'rgba(217,119,6,0.15)' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="#d97706"><path d="M3 18h18l-2-10-4 4-3-6-3 6-4-4-2 10z"/></svg>
              <span className="text-[7px] font-bold" style={{ color: '#d97706' }}>LEGENDARY</span>
            </div>
          ) : streak >= 30 ? (
            <div className="flex items-center gap-0.5 px-1.5 py-px rounded-full ml-0.5" style={{ background: 'rgba(217,119,6,0.12)' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="#d97706"><polygon points="12,2 15,9 22,9 16.5,13.5 18.5,21 12,17 5.5,21 7.5,13.5 2,9 9,9"/></svg>
              <span className="text-[7px] font-bold" style={{ color: '#d97706' }}>BLAZING</span>
            </div>
          ) : streak >= 7 ? (
            <div className="flex items-center gap-0.5 px-1.5 py-px rounded-full ml-0.5" style={{ background: 'rgba(217,119,6,0.08)' }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="#d97706"><path d="M12 2C8 7 4 10 4 14a8 8 0 0016 0c0-4-4-7-8-12z"/></svg>
              <span className="text-[7px] font-bold" style={{ color: '#d97706' }}>ON FIRE</span>
            </div>
          ) : null}
        </div>

        <div className={`w-px h-5 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`} />

        {/* Level */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-md">
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
            <span className={`text-[11px] font-extrabold leading-none ${isDark ? "text-white" : "text-zinc-900"}`} style={{ fontFamily: font }}>{lvl.level}</span>
          </div>
          <span className={`text-[12px] font-semibold whitespace-nowrap ${isDark ? "text-zinc-200" : "text-zinc-800"}`} style={{ fontFamily: '"EB Garamond", serif' }}>{lvl.name}</span>
          <div className={`flex-1 h-[4px] rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full" style={{ background: levelColor }} />
          </div>
          <span className={`text-[8px] font-semibold whitespace-nowrap shrink-0 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{lvl.currentXp}/{lvl.nextXp} XP</span>
        </div>
      </div>

      {/* ── Dashboard grid ── */}
      <div className={`flex-1 overflow-y-auto px-8 py-6 relative ${isDark ? "bg-[#09090b]" : "bg-[#f5f3f1]"}`}>

        {/* ── Warm ambient glow ── */}
        <div className="absolute top-0 left-0 right-0 h-[280px] pointer-events-none" style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(217,119,6,${isDark ? 0.06 : 0.04}) 0%, transparent 100%)`,
        }} />

        {/* ── Botanical vine SVG background ── */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: isDark ? 0.07 : 0.05 }} preserveAspectRatio="none">
          {/* Left vine */}
          <path d="M0,60 Q20,80 15,120 Q10,160 25,200 Q35,240 20,290 Q10,330 30,380" fill="none" stroke={isDark ? '#d97706' : '#92400e'} strokeWidth="1.5" />
          <ellipse cx="18" cy="110" rx="6" ry="3.5" transform="rotate(-30 18 110)" fill={isDark ? '#d97706' : '#92400e'} />
          <ellipse cx="22" cy="170" rx="5" ry="3" transform="rotate(20 22 170)" fill={isDark ? '#d97706' : '#92400e'} />
          <ellipse cx="12" cy="240" rx="6" ry="3" transform="rotate(-15 12 240)" fill={isDark ? '#d97706' : '#92400e'} />
          <ellipse cx="28" cy="320" rx="5" ry="3" transform="rotate(25 28 320)" fill={isDark ? '#d97706' : '#92400e'} />
          {/* Right vine */}
          <path d="M100%,40 Q96%,70 97%,110 Q98%,150 95%,200 Q93%,250 96%,300" fill="none" stroke={isDark ? '#d97706' : '#92400e'} strokeWidth="1.5"
            style={{ d: 'path("M 100 40 Q 80 70 85 110 Q 90 150 75 200 Q 65 250 80 300")' }} />
          <g transform="translate(-20, 0)">
            <path d="M100,40 Q80,70 85,110 Q90,150 75,200 Q65,250 80,300" fill="none" stroke={isDark ? '#d97706' : '#92400e'} strokeWidth="1.5" transform="translate(920, 0) scale(-1, 1) translate(-1000, 0)" />
          </g>
        </svg>

        {/* ── Floating particles ── */}
        {[
          { left: '12%', top: '15%', size: 3, dur: '8s', idx: 0 },
          { left: '78%', top: '25%', size: 2, dur: '11s', idx: 1 },
          { left: '45%', top: '60%', size: 2.5, dur: '9s', idx: 2 },
          { left: '88%', top: '45%', size: 2, dur: '13s', idx: 3 },
          { left: '25%', top: '75%', size: 3, dur: '10s', idx: 4 },
          { left: '62%', top: '85%', size: 2, dur: '12s', idx: 5 },
        ].map((p) => (
          <div key={p.idx} className="absolute rounded-full pointer-events-none" style={{
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            backgroundColor: '#d97706',
            opacity: isDark ? 0.12 : 0.08,
            animation: `stats-float-${p.idx} ${p.dur} ease-in-out infinite`,
          }} />
        ))}

        <div className="max-w-[1200px] mx-auto relative z-10">

          {/* Row 1: Rings + Heatmap + 30-day stats */}
          <div className="flex gap-5 mb-5">
            {/* Today rings */}
            <div className={`rounded-xl border px-5 py-5 shrink-0 ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200/80"}`}>
              <p className={`text-[9px] font-semibold uppercase tracking-[0.1em] mb-3 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Today</p>
              <ActivityRings focus={todayFocus} writing={todayChars} sessions={todaySessions} isDark={isDark} />
            </div>

            {/* Heatmap */}
            <div className={`rounded-xl border px-5 py-5 flex-1 min-w-0 ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200/80"}`}>
              <div className="flex justify-between items-center mb-3">
                <p className={`text-[9px] font-semibold uppercase tracking-[0.1em] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>30-Day Consistency</p>
                <div className="flex items-center gap-1">
                  <span className={`text-[8px] mr-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Less</span>
                  {heatmapColors.slice(1).map((c, i) => (
                    <div key={i} className="w-2 h-2 rounded-sm" style={{ backgroundColor: c }} />
                  ))}
                  <span className={`text-[8px] ml-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>More</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 3 }}>
                {monthGrid.map((cell) => (
                  <div key={cell.date} title={`${cell.date}: ${cell.minutes > 0 ? `${cell.minutes} min` : 'No activity'}`}
                    className="aspect-square rounded-md flex items-center justify-center text-[7px] font-semibold stats-heatmap-cell"
                    style={{ backgroundColor: heatmapColors[cell.level], color: cell.level >= 3 ? '#fff' : (isDark ? '#5a5650' : '#a8a4a0'), cursor: 'default' }}>
                    {cell.dayNum}
                  </div>
                ))}
              </div>
            </div>

            {/* 30-day summary column */}
            <div className={`rounded-xl border overflow-hidden shrink-0 w-[160px] flex flex-col ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200/80"}`}>
              {[
                { label: "Focus", value: totalFocusMonth, unit: "min", color: focusColor },
                { label: "Sessions", value: totalSessionsMonth, unit: "", color: isDark ? '#dcd8d0' : '#2a2620' },
                { label: "Written", value: totalCharsMonth.toLocaleString(), unit: "ch", color: writingColor },
              ].map((s, i) => (
                <div key={s.label} className={`flex-1 px-4 py-3 ${i > 0 ? (isDark ? 'border-t border-zinc-800' : 'border-t border-zinc-100') : ''}`}>
                  <div className={`text-[8px] font-semibold uppercase tracking-[0.1em] mb-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{s.label}</div>
                  <div className="text-[18px] font-bold leading-tight" style={{ color: s.color, fontFamily: font }}>
                    {s.value}<span className={`text-[9px] ml-1 font-semibold ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Trends chart + Weekly comparison + Records */}
          <div className="flex gap-5 mb-5">
            {/* Line graph */}
            <div className={`rounded-xl border px-5 py-4 flex-1 min-w-0 ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200/80"}`}>
              <div className="flex justify-between items-center mb-3">
                <p className={`text-[9px] font-semibold uppercase tracking-[0.1em] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Activity Trends</p>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-[3px] rounded-sm" style={{ backgroundColor: focusColor }} />
                    <span className={`text-[8px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Focus</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-[3px] rounded-sm" style={{ backgroundColor: writingColor }} />
                    <span className={`text-[8px] font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Writing</span>
                  </div>
                </div>
              </div>
              <div style={{ height: 160 }}>
                <LineGraph data={monthData} isDark={isDark} focusColor={focusColor} writingColor={writingColor} textMuted={isDark ? '#5a5650' : '#a8a4a0'} />
              </div>
            </div>

            {/* Weekly + Records stack */}
            <div className="flex flex-col gap-5 w-[280px] shrink-0">
              {/* Week vs week */}
              <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200/80"}`}>
                <p className={`text-[9px] font-semibold uppercase tracking-[0.1em] px-4 pt-3 pb-2 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>This Week vs Last</p>
                <div className={`flex divide-x ${isDark ? "divide-zinc-800" : "divide-zinc-100"}`}>
                  {[
                    { label: "Focus", value: `${twFocus}`, unit: "min", d: delta(twFocus, lwFocus), c: deltaColor(twFocus, lwFocus) },
                    { label: "Write", value: `${twChars.toLocaleString()}`, unit: "", d: delta(twChars, lwChars), c: deltaColor(twChars, lwChars) },
                    { label: "Sess", value: `${twSessions}`, unit: "", d: delta(twSessions, lwSessions), c: deltaColor(twSessions, lwSessions) },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 px-3 py-2.5">
                      <div className={`text-[7px] font-semibold uppercase tracking-wide ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{s.label}</div>
                      <div className={`text-[14px] font-bold ${isDark ? "text-zinc-100" : "text-zinc-900"}`} style={{ fontFamily: font }}>{s.value}</div>
                      <div className="text-[9px] font-bold" style={{ color: s.c }}>{s.d}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal bests */}
              <div className={`rounded-xl border overflow-hidden divide-y flex-1 ${isDark ? "bg-zinc-900/50 border-zinc-800 divide-zinc-800" : "bg-white border-zinc-200/80 divide-zinc-100"}`}>
                <p className={`text-[9px] font-semibold uppercase tracking-[0.1em] px-4 pt-3 pb-2 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Records</p>
                {[
                  { label: "Best Focus", value: bestFocusDay ? `${bestFocusDay.focusMinutes ?? 0}m` : '—' },
                  { label: "Most Written", value: bestWritingDay ? `${(bestWritingDay.charsWritten ?? 0).toLocaleString()}` : '—' },
                  { label: "Total Focus", value: `${totalMinutes}m` },
                  { label: "Total Sessions", value: `${totalSessions}` },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between px-4 py-2">
                    <span className={`text-[11px] font-medium ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{r.label}</span>
                    <span className="text-[12px] font-bold" style={{ color: focusColor, fontFamily: font }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Recent history */}
          <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200/80"}`}>
            <p className={`text-[9px] font-semibold uppercase tracking-[0.1em] px-5 pt-4 pb-2 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Recent Days</p>
            <div className={`divide-y ${isDark ? "divide-zinc-800" : "divide-zinc-100"}`}>
              {[...dailyStats].reverse().slice(0, 7).map((entry) => (
                <div key={entry.date} className="flex items-center gap-4 px-5 py-2.5">
                  <span className={`text-[11px] font-medium w-20 shrink-0 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{entry.date}</span>
                  <div className="flex-1 flex gap-5">
                    <span className="text-[11px] font-semibold" style={{ color: focusColor }}>{entry.focusMinutes ?? 0}<span className={`text-[9px] ml-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>min</span></span>
                    <span className="text-[11px] font-semibold" style={{ color: writingColor }}>{(entry.charsWritten ?? 0).toLocaleString()}<span className={`text-[9px] ml-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>chars</span></span>
                    <span className={`text-[11px] font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{entry.sessionsCompleted ?? 0}<span className={`text-[9px] ml-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>sessions</span></span>
                  </div>
                </div>
              ))}
              {dailyStats.length === 0 && (
                <div className={`px-5 py-6 text-center text-[12px] ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>No sessions recorded yet</div>
              )}
            </div>
          </div>

          {/* ── Grass / ground strip ── */}
          <div className="mt-10 -mx-8 pointer-events-none" style={{ opacity: isDark ? 0.10 : 0.07 }}>
            <svg width="100%" height="40" viewBox="0 0 1200 40" preserveAspectRatio="none">
              <path d="M0,28 Q50,18 100,24 Q150,30 200,20 Q260,10 320,22 Q380,32 440,18 Q500,8 560,20 Q620,30 680,16 Q740,6 800,22 Q860,32 920,18 Q980,10 1040,24 Q1100,34 1160,20 Q1180,16 1200,22 L1200,40 L0,40 Z"
                fill={isDark ? '#d97706' : '#92400e'} />
              {/* Grass blades */}
              {[40, 95, 160, 230, 310, 380, 460, 540, 610, 690, 760, 840, 920, 990, 1060, 1140].map((x, i) => (
                <g key={i}>
                  <line x1={x} y1={i % 3 === 0 ? 20 : 24} x2={x - 3} y2={i % 3 === 0 ? 10 : 14} stroke={isDark ? '#d97706' : '#92400e'} strokeWidth="1.2" strokeLinecap="round" />
                  <line x1={x + 5} y1={i % 2 === 0 ? 22 : 26} x2={x + 8} y2={i % 2 === 0 ? 12 : 16} stroke={isDark ? '#d97706' : '#92400e'} strokeWidth="1" strokeLinecap="round" />
                </g>
              ))}
            </svg>
          </div>

        </div>
      </div>
    </div>
  )
})
