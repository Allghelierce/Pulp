"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { getLevel } from "@/app/constants"
import { loadDailyStats, type DailyEntry } from "@/app/lib/dailyStats"

interface StatsViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  xp: number
  streak?: number
}

function getWeeksGrid(entries: DailyEntry[]): { date: string; level: number; minutes: number }[] {
  const map = new Map(entries.map(e => [e.date, e]))
  const today = new Date()
  const dayOfWeek = today.getDay()
  const totalDays = 364 + dayOfWeek + 1
  const grid: { date: string; level: number; minutes: number }[] = []
  for (let i = totalDays - 1; i >= 0; i--) {
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
    grid.push({ date: key, level, minutes })
  }
  return grid
}

function getTimeData(entries: DailyEntry[], range: "day" | "week" | "month") {
  const today = new Date()
  const map = new Map(entries.map(e => [e.date, e]))

  if (range === "day") {
    const key = today.toISOString().split("T")[0]
    const entry = map.get(key)
    return [{
      label: "Today",
      focusMinutes: entry?.focusMinutes ?? 0,
      charsWritten: entry?.charsWritten ?? 0,
      sessions: entry?.sessionsCompleted ?? 0,
    }]
  }

  const days = range === "week" ? 7 : 30
  const result: { label: string; focusMinutes: number; charsWritten: number; sessions: number }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    const entry = map.get(key)
    const label = range === "week"
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]
      : `${d.getMonth() + 1}/${d.getDate()}`
    result.push({
      label,
      focusMinutes: entry?.focusMinutes ?? 0,
      charsWritten: entry?.charsWritten ?? 0,
      sessions: entry?.sessionsCompleted ?? 0,
    })
  }
  return result
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const font = '"EB Garamond", Georgia, serif'

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
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week")
  const [dailyStats, setDailyStats] = useState<DailyEntry[]>([])

  const isDark = theme === 'dark'
  const bg = isDark ? '#0c0e10' : '#f5f3ef'
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'

  const focusColor = '#ea580c'
  const writingColor = isDark ? '#60a5fa' : '#3b82f6'
  const levelColor = '#ea580c'
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

  const heatmapGrid = useMemo(() => getWeeksGrid(dailyStats), [dailyStats])
  const timeData = useMemo(() => getTimeData(dailyStats, timeRange), [dailyStats, timeRange])
  const maxFocus = Math.max(1, ...timeData.map(d => d.focusMinutes))
  const maxChars = Math.max(1, ...timeData.map(d => d.charsWritten))

  const heatmapMonths = useMemo(() => {
    const months: { label: string; col: number }[] = []
    let lastMonth = -1
    heatmapGrid.forEach((cell, i) => {
      const d = new Date(cell.date)
      const col = Math.floor(i / 7)
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth()
        months.push({ label: MONTH_LABELS[lastMonth], col })
      }
    })
    return months
  }, [heatmapGrid])

  const totalFocusThisRange = timeData.reduce((s, d) => s + d.focusMinutes, 0)
  const totalSessionsThisRange = timeData.reduce((s, d) => s + d.sessions, 0)
  const totalCharsThisRange = timeData.reduce((s, d) => s + d.charsWritten, 0)

  const totalMinutes = dailyStats.reduce((s, d) => s + (d.focusMinutes ?? 0), 0)
  const totalSessions = dailyStats.reduce((s, d) => s + (d.sessionsCompleted ?? 0), 0)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        className="relative w-full max-w-[900px] rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: bg, height: 660,
          boxShadow: isDark ? '0 25px 80px -15px rgba(0,0,0,0.7)' : '0 25px 80px -15px rgba(0,0,0,0.15)',
          border: `1px solid ${cardBorder}`,
        }}
      >
        {/* Header with stats */}
        <div className="px-6 pt-4 pb-3 shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: levelColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <LevelIcon level={lvl.level} size={18} />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold tracking-tight" style={{ color: textPrimary }}>{lvl.name}</h2>
                <p className="text-[9px] mt-0.5" style={{ color: textSecondary }}>{lvl.currentXp} / {lvl.nextXp} XP to Level {lvl.level + 1}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: textMuted }}
              onMouseEnter={e => e.currentTarget.style.color = textPrimary}
              onMouseLeave={e => e.currentTarget.style.color = textMuted}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Summary stats */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1" style={{
              background: isDark ? 'rgba(251,146,60,0.06)' : 'rgba(251,146,60,0.08)',
              border: `1px solid ${isDark ? 'rgba(251,146,60,0.12)' : 'rgba(251,146,60,0.15)'}`,
            }}>
              <span className="text-[14px]" style={{ lineHeight: 1 }}>🔥</span>
              <div>
                <span className="text-[14px] font-bold tabular-nums block" style={{ color: '#fb923c', lineHeight: 1 }}>{streak}</span>
                <span className="text-[8px] font-medium" style={{ color: isDark ? '#a1856a' : '#b8956a' }}>day streak</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1" style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${cardBorder}`,
            }}>
              <span className="text-[14px]" style={{ lineHeight: 1 }}>⏱️</span>
              <div>
                <span className="text-[14px] font-bold tabular-nums block" style={{ color: textPrimary, lineHeight: 1 }}>{totalMinutes}</span>
                <span className="text-[8px] font-medium" style={{ color: textMuted }}>total min</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1" style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${cardBorder}`,
            }}>
              <span className="text-[14px]" style={{ lineHeight: 1 }}>✅</span>
              <div>
                <span className="text-[14px] font-bold tabular-nums block" style={{ color: textPrimary, lineHeight: 1 }}>{totalSessions}</span>
                <span className="text-[8px] font-medium" style={{ color: textMuted }}>sessions</span>
              </div>
            </div>
          </div>

          {/* XP bar */}
          <div>
            <div style={{
              height: 5, borderRadius: 3, position: "relative",
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              overflow: "hidden",
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  height: "100%", borderRadius: 3,
                  background: levelColor,
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              <span style={{ fontSize: 8, color: textMuted, fontWeight: 600 }}>{xpProgress}%</span>
              <span style={{ fontSize: 8, color: textMuted, fontWeight: 600 }}>Lv. {lvl.level + 1}</span>
            </div>
          </div>
        </div>

        {/* Content — no scroll, both graphs visible */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 24px", overflow: "hidden" }}>

          {/* Consistency Heatmap */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Consistency</span>
              <span style={{ fontSize: 9, color: textMuted }}>Past year</span>
            </div>

            {/* Month labels */}
            <div style={{ display: "flex", marginLeft: 28, marginBottom: 4 }}>
              {heatmapMonths.map((m, i) => {
                const totalCols = Math.ceil(heatmapGrid.length / 7)
                const nextCol = i < heatmapMonths.length - 1 ? heatmapMonths[i + 1].col : totalCols
                const span = nextCol - m.col
                return (
                  <div key={i} style={{ width: `${(span / totalCols) * 100}%`, minWidth: 0 }}>
                    <span style={{ fontSize: 8, color: textMuted }}>{m.label}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: "flex", gap: 0 }}>
              {/* Day of week labels */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingRight: 6, width: 24, flexShrink: 0 }}>
                {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                  <span key={i} style={{ fontSize: 7, color: textMuted, height: 10, lineHeight: '10px' }}>{d}</span>
                ))}
              </div>

              {/* Grid */}
              <div style={{ display: "flex", gap: 2, overflow: "hidden", flex: 1 }}>
                {Array.from({ length: Math.ceil(heatmapGrid.length / 7) }).map((_, col) => (
                  <div key={col} style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                    {heatmapGrid.slice(col * 7, col * 7 + 7).map((cell) => (
                      <div
                        key={cell.date}
                        title={`${cell.date}: ${cell.minutes > 0 ? `${cell.minutes} min focus` : 'No activity'}`}
                        style={{
                          width: "100%", aspectRatio: "1", borderRadius: 2,
                          backgroundColor: heatmapColors[cell.level],
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 6, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 8, color: textMuted, marginRight: 2 }}>Less</span>
              {heatmapColors.slice(1).map((c, i) => (
                <div key={i} style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: c }} />
              ))}
              <span style={{ fontSize: 8, color: textMuted, marginLeft: 2 }}>More</span>
            </div>
          </div>

          {/* Activity Chart */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>Activity</span>
              <div style={{ display: "flex", gap: 1 }}>
                {(["day", "week", "month"] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    style={{
                      padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                      border: 'none', cursor: "pointer",
                      backgroundColor: timeRange === r ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent',
                      color: timeRange === r ? textPrimary : textMuted,
                      transition: "all 0.15s",
                    }}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ display: "flex", gap: 0, marginBottom: 12 }}>
              {[
                { label: "Focus", value: totalFocusThisRange, unit: "min", color: focusColor },
                { label: "Sessions", value: totalSessionsThisRange, unit: "", color: textPrimary },
                { label: "Written", value: totalCharsThisRange.toLocaleString(), unit: "chars", color: writingColor },
              ].map((s, i) => (
                <div key={s.label} style={{
                  flex: 1,
                  paddingLeft: i > 0 ? 16 : 0,
                  borderLeft: i > 0 ? `1px solid ${cardBorder}` : 'none',
                }}>
                  <div style={{
                    fontSize: 8, color: textMuted, textTransform: "uppercase",
                    letterSpacing: "0.1em", fontWeight: 700, marginBottom: 2,
                  }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: s.color, fontFamily: font }}>
                    {s.value}
                    {s.unit && <span style={{ fontSize: 10, color: textMuted, marginLeft: 3 }}>{s.unit}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            {timeRange !== "day" ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: timeRange === "week" ? 8 : 2, flex: 1, minHeight: 0 }}>
                {timeData.map((d, i) => {
                  const focusH = Math.max(0, (d.focusMinutes / maxFocus) * 100)
                  const charsH = Math.max(0, (d.charsWritten / maxChars) * 100)
                  const showLabel = timeRange === "week" || i % 5 === 0
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0, height: "100%" }}>
                      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", flex: 1, width: "100%", minHeight: 0 }}>
                        <div
                          title={`${d.focusMinutes} min focus`}
                          style={{
                            flex: 1, borderRadius: "3px 3px 0 0",
                            minHeight: d.focusMinutes > 0 ? 4 : 0,
                            height: focusH,
                            backgroundColor: focusColor,
                            transition: "height 0.3s ease",
                          }}
                        />
                        <div
                          title={`${d.charsWritten} chars`}
                          style={{
                            flex: 1, borderRadius: "3px 3px 0 0",
                            minHeight: d.charsWritten > 0 ? 4 : 0,
                            height: charsH,
                            backgroundColor: writingColor,
                            transition: "height 0.3s ease",
                          }}
                        />
                      </div>
                      {showLabel && (
                        <span style={{ fontSize: 8, color: textMuted, marginTop: 4, whiteSpace: "nowrap" }}>{d.label}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: textSecondary }}>Focus time</span>
                    <span style={{ fontSize: 11, color: focusColor, fontWeight: 600 }}>{timeData[0].focusMinutes} min</span>
                  </div>
                  <div style={{
                    height: 6, borderRadius: 3, overflow: "hidden",
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  }}>
                    <div style={{
                      height: "100%", borderRadius: 3, transition: "width 0.5s",
                      width: `${Math.min(100, (timeData[0].focusMinutes / 120) * 100)}%`,
                      backgroundColor: focusColor,
                    }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: textSecondary }}>Characters written</span>
                    <span style={{ fontSize: 11, color: writingColor, fontWeight: 600 }}>{timeData[0].charsWritten.toLocaleString()}</span>
                  </div>
                  <div style={{
                    height: 6, borderRadius: 3, overflow: "hidden",
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  }}>
                    <div style={{
                      height: "100%", borderRadius: 3, transition: "width 0.5s",
                      width: `${Math.min(100, (timeData[0].charsWritten / 5000) * 100)}%`,
                      backgroundColor: writingColor,
                    }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: textSecondary }}>Sessions completed</span>
                    <span style={{ fontSize: 11, color: textPrimary, fontWeight: 600 }}>{timeData[0].sessions}</span>
                  </div>
                </div>
              </div>
            )}

            {timeRange !== "day" && (
              <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "flex-end" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: focusColor }} />
                  <span style={{ fontSize: 8, color: textMuted }}>Focus (min)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: writingColor }} />
                  <span style={{ fontSize: 8, color: textMuted }}>Writing (chars)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
