"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getLevel } from "@/app/constants"
import { loadDailyStats, type DailyEntry } from "@/app/lib/dailyStats"

interface StatsViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  sunshine: number
  gems: number
  xp: number
  totalNotes: number
  totalChars: number
  grove: any[]
  achievements: any[]
}

function getWeeksGrid(entries: DailyEntry[]): { date: string; level: number }[] {
  const map = new Map(entries.map(e => [e.date, e]))
  const today = new Date()
  const grid: { date: string; level: number }[] = []
  for (let i = 182; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    const entry = map.get(key)
    let level = 0
    if (entry) {
      const activity = entry.charsWritten + entry.focusMinutes * 10 + entry.sessionsCompleted * 50
      if (activity > 0) level = 1
      if (activity > 100) level = 2
      if (activity > 500) level = 3
      if (activity > 1500) level = 4
    }
    grid.push({ date: key, level })
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

export const StatsView = memo(function StatsView({
  isOpen, onClose, theme, accent, sunshine, gems, xp, totalNotes, totalChars, grove, achievements,
}: StatsViewProps) {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week")
  const [dailyStats, setDailyStats] = useState<DailyEntry[]>([])

  const isDark = theme === 'dark'
  const bg = isDark ? '#0a0a0c' : '#f5f3f1'
  const cardBg = isDark ? '#1c1c20' : '#ffffff'
  const cardBorder = isDark ? '#27272a' : '#e5e5e5'
  const textPrimary = isDark ? '#e4e4e7' : '#2c2417'
  const textSecondary = isDark ? '#71717a' : '#8c8278'
  const textMuted = isDark ? '#52525b' : '#b5ada5'
  const dividerColor = isDark ? '#27272a' : '#e8e5e0'
  const accentColor = accent || '#d4a84a'
  const barSecondary = isDark ? 'rgba(140,180,220,0.6)' : 'rgba(100,140,200,0.5)'
  const barSecondaryLight = isDark ? 'rgba(140,180,220,0.35)' : 'rgba(100,140,200,0.25)'
  const subtleBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'

  const heatmapColors = useMemo(() => [
    isDark ? 'rgba(180,140,60,0.06)' : 'rgba(180,140,60,0.08)',
    isDark ? 'rgba(180,140,60,0.22)' : 'rgba(180,140,60,0.2)',
    isDark ? 'rgba(190,150,60,0.42)' : 'rgba(190,150,60,0.35)',
    isDark ? 'rgba(210,165,70,0.65)' : 'rgba(210,165,70,0.55)',
    isDark ? 'rgba(220,175,60,0.92)' : 'rgba(200,160,50,0.8)',
  ], [isDark])

  useEffect(() => {
    if (!isOpen) return
    setDailyStats(loadDailyStats())
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const lvl = getLevel(xp)
  const xpProgress = Math.min(100, Math.floor(lvl.progress * 100))

  const completedAchievements = achievements.filter((a: any) => a.completed).length
  const totalAchievements = achievements.length
  const matureTrees = grove.filter((t: any) => t && t.stage >= 3).length
  const totalTrees = grove.filter(Boolean).length
  const totalWords = Math.round(totalChars / 5)

  const streakRaw = typeof window !== "undefined" ? localStorage.getItem("pulp-streak") : null
  const streak = streakRaw ? JSON.parse(streakRaw).streak || 0 : 0

  const StatIcon = ({ d, color }: { d: string; color: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  )

  const stats = useMemo(() => [
    { label: "Level", value: lvl.level, color: accentColor, iconPath: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    { label: "Total XP", value: xp.toLocaleString(), color: "#c4956a", iconPath: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
    { label: "Sunshine", value: sunshine.toLocaleString(), color: "#e8a830", iconPath: "M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42M12 7a5 5 0 100 10 5 5 0 000-10z" },
    { label: "Gems", value: gems.toLocaleString(), color: "#8b7acd", iconPath: "M6 3h12l4 6-10 13L2 9l4-6zM12 22L2 9h20L12 22z" },
    { label: "Notes", value: totalNotes, color: "#7aaa8a", iconPath: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
    { label: "Words", value: totalWords.toLocaleString(), color: "#8a9a7a", iconPath: "M4 19.5A2.5 2.5 0 016.5 17H20 M4 19.5V5a2 2 0 012-2h14v14H6.5A2.5 2.5 0 004 19.5z" },
    { label: "Characters", value: totalChars.toLocaleString(), color: "#a0886a", iconPath: "M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" },
    { label: "Day Streak", value: streak, color: "#d48040", iconPath: "M12 2c1 3-2 6-2 6s3-1.5 3 2c0 2-2 4-2 4s3-1 3 3c0 3-4 5-4 5s-4-2-4-5c0-4 3-3 3-3s-2-2-2-4c0-3.5 3-2 3-2s-3-3-2-6h2z" },
    { label: "Trees", value: totalTrees, color: "#5a9a5a", iconPath: "M12 22V8 M5 12l7-10 7 10H5z M7 17l5-5 5 5H7z" },
    { label: "Mature Trees", value: matureTrees, color: "#3a8a5a", iconPath: "M12 22v-7 M17 22H7 M12 15a7 7 0 100-14 7 7 0 000 14z" },
    { label: "Achievements", value: `${completedAchievements}/${totalAchievements}`, color: "#c49a5a", iconPath: "M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7 M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-0.85-3.25-2.03-3.79A1.07 1.07 0 0114 17v-2.34" },
  ], [lvl.level, xp, sunshine, gems, totalNotes, totalChars, totalWords, streak, totalTrees, matureTrees, completedAchievements, totalAchievements, accentColor])

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

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            onMouseDown={e => e.stopPropagation()}
            className={`relative w-full max-w-[900px] rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border overflow-hidden flex flex-col ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"}`}
            style={{ backgroundColor: bg, height: 660 }}
          >
            {/* Header */}
            <div className={`px-8 pt-6 pb-4 border-b shrink-0 flex items-center justify-between ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"}`}>
              <div>
                <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>Stats</h2>
                <p className={`text-[12px] mt-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Level {lvl.level} — {lvl.name}</p>
              </div>
              <button
                onClick={onClose}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

              {/* XP Progress */}
              <div style={{
                backgroundColor: cardBg, border: `1px solid ${cardBorder}`,
                borderRadius: 12, padding: "20px 22px", marginBottom: 16,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      backgroundColor: subtleBg, border: `1px solid ${cardBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 700, color: textPrimary, fontFamily: font,
                    }}>
                      {lvl.level}
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary, fontFamily: font }}>
                        Level {lvl.level}
                      </span>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>{lvl.name}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: textSecondary, fontWeight: 600, fontFamily: font }}>
                    {lvl.currentXp} / {lvl.nextXp} XP
                  </span>
                </div>
                <div style={{
                  height: 6, borderRadius: 3,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  overflow: "hidden",
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                      height: "100%", borderRadius: 3,
                      background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
                    }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 10, marginBottom: 16,
              }}>
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05 + i * 0.025 }}
                    style={{
                      backgroundColor: cardBg, border: `1px solid ${cardBorder}`,
                      borderRadius: 10, padding: "14px 16px",
                      position: "relative", overflow: "hidden",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: -6, right: -4, opacity: 0.06, pointerEvents: "none",
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={stat.iconPath} /></svg>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <StatIcon d={stat.iconPath} color={stat.color} />
                      <span style={{
                        fontSize: 10, color: stat.color, textTransform: "uppercase",
                        letterSpacing: "0.08em", fontWeight: 700, opacity: 0.7,
                      }}>
                        {stat.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: textPrimary, fontFamily: font, position: "relative" }}>
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Consistency Heatmap */}
              <div style={{
                backgroundColor: cardBg, border: `1px solid ${cardBorder}`,
                borderRadius: 12, padding: "20px 22px", marginBottom: 16,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary, fontFamily: font }}>Consistency</span>
                  <span style={{ fontSize: 10, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Last 6 months</span>
                </div>

                <div style={{ position: "relative", height: 14, marginBottom: 4, marginLeft: 2 }}>
                  {heatmapMonths.map((m, i) => (
                    <span key={i} style={{ position: "absolute", left: m.col * 13, fontSize: 9, color: textMuted }}>{m.label}</span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 2, overflow: "hidden" }}>
                  {Array.from({ length: Math.ceil(heatmapGrid.length / 7) }).map((_, col) => (
                    <div key={col} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {heatmapGrid.slice(col * 7, col * 7 + 7).map((cell) => (
                        <div
                          key={cell.date}
                          title={`${cell.date}: ${cell.level === 0 ? "No activity" : `Level ${cell.level} activity`}`}
                          style={{
                            width: 11, height: 11, borderRadius: 3,
                            backgroundColor: heatmapColors[cell.level],
                            transition: "background-color 0.2s",
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 9, color: textMuted, marginRight: 4 }}>Less</span>
                  {heatmapColors.map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
                  ))}
                  <span style={{ fontSize: 9, color: textMuted, marginLeft: 4 }}>More</span>
                </div>
              </div>

              {/* Activity Chart */}
              <div style={{
                backgroundColor: cardBg, border: `1px solid ${cardBorder}`,
                borderRadius: 12, padding: "20px 22px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary, fontFamily: font }}>Activity</span>
                  <div style={{
                    display: "flex", gap: 2, padding: 2, borderRadius: 8,
                    backgroundColor: subtleBg, border: `1px solid ${cardBorder}`,
                  }}>
                    {(["day", "week", "month"] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        style={{
                          padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: "none", cursor: "pointer", fontFamily: font,
                          backgroundColor: timeRange === r
                            ? (isDark ? '#27272a' : '#2c2417')
                            : 'transparent',
                          color: timeRange === r
                            ? (isDark ? '#e4e4e7' : '#fff')
                            : textSecondary,
                          transition: "all 0.15s",
                        }}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div style={{ display: "flex", gap: 24, marginBottom: 18, marginTop: 12 }}>
                  {[
                    { label: "Focus", value: totalFocusThisRange, unit: "min" },
                    { label: "Sessions", value: totalSessionsThisRange, unit: "" },
                    { label: "Written", value: totalCharsThisRange.toLocaleString(), unit: "chars" },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{
                        fontSize: 9, color: textMuted, textTransform: "uppercase",
                        letterSpacing: "0.1em", fontWeight: 700, marginBottom: 3,
                      }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: textPrimary, fontFamily: font }}>
                        {s.value}
                        {s.unit && <span style={{ fontSize: 11, color: textMuted, marginLeft: 3 }}>{s.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                {timeRange !== "day" ? (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: timeRange === "week" ? 8 : 2, height: 120 }}>
                    {timeData.map((d, i) => {
                      const focusH = Math.max(0, (d.focusMinutes / maxFocus) * 100)
                      const charsH = Math.max(0, (d.charsWritten / maxChars) * 100)
                      const showLabel = timeRange === "week" || i % 5 === 0
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 100, width: "100%" }}>
                            <div
                              title={`${d.focusMinutes} min focus`}
                              style={{
                                flex: 1, borderRadius: "3px 3px 0 0",
                                minHeight: d.focusMinutes > 0 ? 4 : 0,
                                height: focusH,
                                background: `linear-gradient(to top, ${accentColor}99, ${accentColor})`,
                                transition: "height 0.3s ease",
                              }}
                            />
                            <div
                              title={`${d.charsWritten} chars`}
                              style={{
                                flex: 1, borderRadius: "3px 3px 0 0",
                                minHeight: d.charsWritten > 0 ? 4 : 0,
                                height: charsH,
                                background: `linear-gradient(to top, ${barSecondaryLight}, ${barSecondary})`,
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
                        <span style={{ fontSize: 11, color: textPrimary, fontFamily: font }}>{timeData[0].focusMinutes} min</span>
                      </div>
                      <div style={{
                        height: 6, borderRadius: 3, overflow: "hidden",
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      }}>
                        <div style={{
                          height: "100%", borderRadius: 3, transition: "width 0.5s",
                          width: `${Math.min(100, (timeData[0].focusMinutes / 120) * 100)}%`,
                          background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})`,
                        }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: textSecondary }}>Characters written</span>
                        <span style={{ fontSize: 11, color: textPrimary, fontFamily: font }}>{timeData[0].charsWritten.toLocaleString()}</span>
                      </div>
                      <div style={{
                        height: 6, borderRadius: 3, overflow: "hidden",
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      }}>
                        <div style={{
                          height: "100%", borderRadius: 3, transition: "width 0.5s",
                          width: `${Math.min(100, (timeData[0].charsWritten / 5000) * 100)}%`,
                          background: `linear-gradient(90deg, ${barSecondaryLight}, ${barSecondary})`,
                        }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: textSecondary }}>Sessions completed</span>
                        <span style={{ fontSize: 11, color: textPrimary, fontFamily: font }}>{timeData[0].sessions}</span>
                      </div>
                    </div>
                  </div>
                )}

                {timeRange !== "day" && (
                  <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: accentColor }} />
                      <span style={{ fontSize: 9, color: textMuted }}>Focus (min)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: barSecondary }} />
                      <span style={{ fontSize: 9, color: textMuted }}>Writing (chars)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
