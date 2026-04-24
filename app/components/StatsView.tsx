"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getLevel } from "@/app/constants"
import { loadDailyStats, type DailyEntry } from "@/app/lib/dailyStats"

interface StatsViewProps {
  isOpen: boolean
  onClose: () => void
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

const HEATMAP_COLORS = [
  "rgba(255,255,255,0.03)",
  "rgba(180,140,60,0.25)",
  "rgba(180,140,60,0.45)",
  "rgba(200,160,70,0.7)",
  "rgba(212,168,74,0.95)",
]

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

export const StatsView = memo(function StatsView({
  isOpen, onClose, sunshine, gems, xp, totalNotes, totalChars, grove, achievements,
}: StatsViewProps) {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week")
  const [dailyStats, setDailyStats] = useState<DailyEntry[]>([])

  useEffect(() => {
    if (!isOpen) return
    setDailyStats(loadDailyStats())
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const lvl = getLevel(xp)
  const xpProgress = Math.floor(lvl.progress * 100)

  const completedAchievements = achievements.filter((a: any) => a.completed).length
  const totalAchievements = achievements.length
  const matureTrees = grove.filter((t: any) => t && t.stage >= 3).length
  const totalTrees = grove.filter(Boolean).length
  const totalWords = Math.round(totalChars / 5)

  const streakRaw = typeof window !== "undefined" ? localStorage.getItem("pulp-streak") : null
  const streak = streakRaw ? JSON.parse(streakRaw).streak || 0 : 0

  const stats = useMemo(() => [
    { label: "Level", value: lvl.level, icon: "star" },
    { label: "Total XP", value: xp.toLocaleString(), icon: "zap" },
    { label: "Sunshine", value: sunshine.toLocaleString(), icon: "sun" },
    { label: "Gems", value: gems.toLocaleString(), icon: "gem" },
    { label: "Notes", value: totalNotes, icon: "file" },
    { label: "Characters", value: totalChars.toLocaleString(), icon: "type" },
    { label: "Words", value: totalWords.toLocaleString(), icon: "align" },
    { label: "Day Streak", value: streak, icon: "flame" },
    { label: "Trees Planted", value: totalTrees, icon: "tree" },
    { label: "Mature Trees", value: matureTrees, icon: "tree2" },
    { label: "Achievements", value: `${completedAchievements}/${totalAchievements}`, icon: "trophy" },
  ], [lvl.level, xp, sunshine, gems, totalNotes, totalChars, totalWords, streak, totalTrees, matureTrees, completedAchievements, totalAchievements])

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

  const serif = '"EB Garamond", Georgia, serif'
  const dim = "#6a6258"
  const text = "#e8e0d4"
  const gold = "#d4a84a"
  const cardBg = "rgba(255,255,255,0.02)"
  const cardBorder = "rgba(255,255,255,0.05)"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] overflow-hidden"
        >
          <div className="absolute inset-0 bg-[#0c0a09]">
            <div className="absolute inset-0 opacity-20" style={{
              background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(180,140,80,0.2) 0%, transparent 70%)",
            }} />
          </div>

          <div className="relative z-10 h-full flex flex-col">
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-between px-8 py-5 border-b border-white/[0.04] bg-black/20 backdrop-blur-md shrink-0"
            >
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: text, fontFamily: serif, margin: 0 }}>
                  Your Stats
                </h1>
                <p style={{ fontSize: 12, color: dim, marginTop: 2 }}>
                  Level {lvl.level} — {lvl.name}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: `1px solid ${cardBorder}`,
                  background: cardBg, color: "#8a8078", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.header>

            <div className="flex-1 overflow-y-auto" style={{ padding: "32px 48px" }}>
              {/* XP Progress */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#c4b8a8", fontFamily: serif }}>
                    Progress to Level {lvl.level + 1}
                  </span>
                  <span style={{ fontSize: 11, color: dim }}>
                    {lvl.currentXp} / {lvl.nextXp} XP
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, xpProgress)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, #b8943a, ${gold})` }}
                  />
                </div>
              </motion.div>

              {/* Consistency Heatmap */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: text, fontFamily: serif }}>Consistency</span>
                  <span style={{ fontSize: 10, color: dim }}>Last 6 months</span>
                </div>

                {/* Month labels */}
                <div style={{ position: "relative", height: 14, marginBottom: 4, marginLeft: 2 }}>
                  {heatmapMonths.map((m, i) => (
                    <span key={i} style={{ position: "absolute", left: m.col * 13, fontSize: 9, color: dim }}>{m.label}</span>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div style={{ display: "flex", gap: 2, overflow: "hidden" }}>
                  {Array.from({ length: Math.ceil(heatmapGrid.length / 7) }).map((_, col) => (
                    <div key={col} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {heatmapGrid.slice(col * 7, col * 7 + 7).map((cell) => (
                        <div
                          key={cell.date}
                          title={`${cell.date}: ${cell.level === 0 ? "No activity" : `Level ${cell.level} activity`}`}
                          style={{
                            width: 11, height: 11, borderRadius: 2,
                            backgroundColor: HEATMAP_COLORS[cell.level],
                            transition: "background-color 0.2s",
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 9, color: dim, marginRight: 4 }}>Less</span>
                  {HEATMAP_COLORS.map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }} />
                  ))}
                  <span style={{ fontSize: 9, color: dim, marginLeft: 4 }}>More</span>
                </div>
              </motion.div>

              {/* Time Spent Chart */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: text, fontFamily: serif }}>Activity</span>
                  <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${cardBorder}` }}>
                    {(["day", "week", "month"] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        style={{
                          padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer",
                          background: timeRange === r ? "rgba(255,255,255,0.08)" : "transparent",
                          color: timeRange === r ? text : dim,
                          transition: "all 0.15s",
                        }}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary row */}
                <div style={{ display: "flex", gap: 20, marginBottom: 16, marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, color: dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Focus</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: text, fontFamily: serif }}>{totalFocusThisRange}<span style={{ fontSize: 11, color: dim }}> min</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Sessions</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: text, fontFamily: serif }}>{totalSessionsThisRange}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Written</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: text, fontFamily: serif }}>{totalCharsThisRange.toLocaleString()}<span style={{ fontSize: 11, color: dim }}> chars</span></div>
                  </div>
                </div>

                {/* Bar chart */}
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
                                flex: 1, borderRadius: "3px 3px 0 0", minHeight: d.focusMinutes > 0 ? 4 : 0,
                                height: focusH, background: `linear-gradient(to top, #b8943a, ${gold})`,
                                transition: "height 0.3s ease",
                              }}
                            />
                            <div
                              title={`${d.charsWritten} chars`}
                              style={{
                                flex: 1, borderRadius: "3px 3px 0 0", minHeight: d.charsWritten > 0 ? 4 : 0,
                                height: charsH, background: "linear-gradient(to top, rgba(120,160,200,0.4), rgba(140,180,220,0.7))",
                                transition: "height 0.3s ease",
                              }}
                            />
                          </div>
                          {showLabel && (
                            <span style={{ fontSize: 8, color: dim, marginTop: 4, whiteSpace: "nowrap" }}>{d.label}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#c4b8a8" }}>Focus time</span>
                        <span style={{ fontSize: 11, color: text, fontFamily: serif }}>{timeData[0].focusMinutes} min</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(100, (timeData[0].focusMinutes / 120) * 100)}%`, background: `linear-gradient(90deg, #b8943a, ${gold})`, transition: "width 0.5s" }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#c4b8a8" }}>Characters written</span>
                        <span style={{ fontSize: 11, color: text, fontFamily: serif }}>{timeData[0].charsWritten.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 4, width: `${Math.min(100, (timeData[0].charsWritten / 5000) * 100)}%`, background: "linear-gradient(90deg, rgba(120,160,200,0.5), rgba(140,180,220,0.8))", transition: "width 0.5s" }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#c4b8a8" }}>Sessions completed</span>
                        <span style={{ fontSize: 11, color: text, fontFamily: serif }}>{timeData[0].sessions}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legend */}
                {timeRange !== "day" && (
                  <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: gold }} />
                      <span style={{ fontSize: 9, color: dim }}>Focus (min)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(140,180,220,0.7)" }} />
                      <span style={{ fontSize: 9, color: dim }}>Writing (chars)</span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Stats grid */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: text, fontFamily: serif, marginBottom: 12 }}>Overview</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.22 + i * 0.03 }}
                      style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: "16px 18px" }}
                    >
                      <div style={{ fontSize: 10, color: dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: text, fontFamily: serif }}>
                        {stat.value}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
