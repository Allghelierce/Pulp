"use client"
import { memo, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getLevel } from "@/app/constants"

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

export const StatsView = memo(function StatsView({
  isOpen, onClose, sunshine, gems, xp, totalNotes, totalChars, grove, achievements,
}: StatsViewProps) {
  useEffect(() => {
    if (!isOpen) return
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
            {/* Header */}
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-between px-8 py-5 border-b border-white/[0.04] bg-black/20 backdrop-blur-md shrink-0"
            >
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: "#e8e0d4", fontFamily: '"EB Garamond", Georgia, serif', margin: 0 }}>
                  Your Stats
                </h1>
                <p style={{ fontSize: 12, color: "#6a6258", marginTop: 2 }}>
                  Level {lvl.level} — {lvl.name}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.04)", color: "#8a8078", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto" style={{ padding: "32px 48px" }}>
              {/* XP Progress */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 12, padding: "20px 24px", marginBottom: 28,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#c4b8a8", fontFamily: '"EB Garamond", Georgia, serif' }}>
                    Progress to Level {lvl.level + 1}
                  </span>
                  <span style={{ fontSize: 11, color: "#6a6258" }}>
                    {lvl.currentXp} / {lvl.nextXp} XP
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, xpProgress)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #b8943a, #d4a84a)" }}
                  />
                </div>
              </motion.div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.08 + i * 0.03 }}
                    style={{
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 10, padding: "16px 18px",
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#6a6258", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: "#e8e0d4", fontFamily: '"EB Garamond", Georgia, serif' }}>
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
