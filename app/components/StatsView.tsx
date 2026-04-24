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
  xp: number
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
  isOpen, onClose, theme, accent, xp,
}: StatsViewProps) {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week")
  const [dailyStats, setDailyStats] = useState<DailyEntry[]>([])

  const isDark = theme === 'dark'
  const bg = isDark ? '#0a0a0c' : '#f5f3f1'
  const textPrimary = isDark ? '#e4e4e7' : '#2c2417'
  const textSecondary = isDark ? '#71717a' : '#8c8278'
  const textMuted = isDark ? '#52525b' : '#b5ada5'
  const accentColor = accent || '#d4a84a'
  const barSecondary = `${accentColor}99`
  const barSecondaryLight = `${accentColor}55`
  const subtleBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const cardBorder = isDark ? '#27272a' : '#e5e5e5'

  const heatmapColors = useMemo(() => [
    isDark ? `${accentColor}0F` : `${accentColor}14`,
    isDark ? `${accentColor}38` : `${accentColor}33`,
    isDark ? `${accentColor}6B` : `${accentColor}59`,
    isDark ? `${accentColor}A6` : `${accentColor}8C`,
    isDark ? `${accentColor}EB` : `${accentColor}CC`,
  ], [isDark, accentColor])

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

              {/* XP Level Bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200 }}
                      style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 17, fontWeight: 800, color: "#fff",
                        boxShadow: "0 4px 16px rgba(34,197,94,0.4)",
                      }}
                    >
                      {lvl.level}
                    </motion.div>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>{lvl.name}</span>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>{lvl.currentXp} / {lvl.nextXp} XP</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: textSecondary, fontWeight: 600 }}>
                    Level {lvl.level + 1}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2.5" strokeLinecap="round" style={{ display: "inline", marginLeft: 4 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
                <div style={{
                  height: 12, borderRadius: 6, position: "relative",
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  overflow: "hidden",
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                      height: "100%", borderRadius: 6, position: "relative",
                      background: "linear-gradient(90deg, #16a34a, #22c55e, #4ade80)",
                      boxShadow: "0 0 12px rgba(34,197,94,0.5)",
                    }}
                  >
                    <div style={{
                      position: "absolute", right: 0, top: 0, bottom: 0, width: 20,
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3))",
                      borderRadius: "0 6px 6px 0",
                    }} />
                  </motion.div>
                </div>
              </div>

              {/* Consistency Heatmap — GitHub style */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>Consistency</span>
                  <span style={{ fontSize: 10, color: textMuted }}>Last 6 months</span>
                </div>

                <div style={{ position: "relative", height: 14, marginBottom: 2 }}>
                  {heatmapMonths.map((m, i) => (
                    <span key={i} style={{ position: "absolute", left: m.col * 13, fontSize: 9, color: textMuted }}>{m.label}</span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 3, overflow: "hidden", width: "100%" }}>
                  {Array.from({ length: Math.ceil(heatmapGrid.length / 7) }).map((_, col) => (
                    <div key={col} style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                      {heatmapGrid.slice(col * 7, col * 7 + 7).map((cell) => (
                        <div
                          key={cell.date}
                          title={`${cell.date}: ${cell.level === 0 ? "No activity" : `Level ${cell.level} activity`}`}
                          style={{
                            width: "100%", aspectRatio: "1", borderRadius: 3,
                            backgroundColor: heatmapColors[cell.level],
                            transition: "background-color 0.2s",
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 9, color: textMuted, marginRight: 4 }}>Less</span>
                  {heatmapColors.map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
                  ))}
                  <span style={{ fontSize: 9, color: textMuted, marginLeft: 4 }}>More</span>
                </div>
              </div>

              {/* Activity Chart */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>Activity</span>
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
                          border: "none", cursor: "pointer",
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
                  <div style={{ display: "flex", alignItems: "flex-end", gap: timeRange === "week" ? 8 : 2, height: 220 }}>
                    {timeData.map((d, i) => {
                      const focusH = Math.max(0, (d.focusMinutes / maxFocus) * 100)
                      const charsH = Math.max(0, (d.charsWritten / maxChars) * 100)
                      const showLabel = timeRange === "week" || i % 5 === 0
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 200, width: "100%" }}>
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
                        <span style={{ fontSize: 11, color: textPrimary, fontWeight: 600 }}>{timeData[0].focusMinutes} min</span>
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
                        <span style={{ fontSize: 11, color: textPrimary, fontWeight: 600 }}>{timeData[0].charsWritten.toLocaleString()}</span>
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
                        <span style={{ fontSize: 11, color: textPrimary, fontWeight: 600 }}>{timeData[0].sessions}</span>
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
