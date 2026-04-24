"use client"
import { memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface LeaderboardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  xp: number
}

const DUMMY_PLAYERS = [
  { rank: 1, name: "inkwell_sage", level: 42, xp: 128400, streak: 87, trees: 34, avatar: "#d4a84a" },
  { rank: 2, name: "midnight_quill", level: 38, xp: 104200, streak: 63, trees: 28, avatar: "#a78bfa" },
  { rank: 3, name: "paper_moth", level: 35, xp: 92800, streak: 55, trees: 25, avatar: "#f472b6" },
  { rank: 4, name: "velvet_prose", level: 31, xp: 78300, streak: 41, trees: 21, avatar: "#34d399" },
  { rank: 5, name: "cedar_drafts", level: 28, xp: 64100, streak: 34, trees: 18, avatar: "#60a5fa" },
  { rank: 6, name: "amber_letters", level: 25, xp: 51600, streak: 29, trees: 15, avatar: "#fb923c" },
  { rank: 7, name: "foxglove_ink", level: 22, xp: 42300, streak: 22, trees: 12, avatar: "#c084fc" },
  { rank: 8, name: "willow_script", level: 19, xp: 33800, streak: 18, trees: 9, avatar: "#4ade80" },
  { rank: 9, name: "dusk_typist", level: 16, xp: 24500, streak: 14, trees: 7, avatar: "#f87171" },
  { rank: 10, name: "lantern_words", level: 13, xp: 16200, streak: 9, trees: 4, avatar: "#fbbf24" },
]

export const LeaderboardView = memo(function LeaderboardView({ isOpen, onClose, theme, xp }: LeaderboardViewProps) {
  const isDark = theme === "dark"

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const gold = "#d4a84a"

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
            className={`relative w-full max-w-[560px] rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border overflow-hidden flex flex-col ${isDark ? "bg-[#0a0a0c] border-zinc-800/80" : "bg-[#f5f3f1] border-zinc-200/80"}`}
            style={{ height: 660 }}
          >
            {/* Header */}
            <div className={`px-8 pt-6 pb-4 border-b shrink-0 flex items-center justify-between ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"}`}>
              <div>
                <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>Leaderboard</h2>
                <p className={`text-[12px] mt-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Top writers this season</p>
              </div>
              <button
                onClick={onClose}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Podium - Top 3 */}
            <div className="flex justify-center items-end gap-4 px-6 pt-6 pb-4 shrink-0">
              {[DUMMY_PLAYERS[1], DUMMY_PLAYERS[0], DUMMY_PLAYERS[2]].map((p, i) => {
                const heights = [90, 110, 74]
                const sizes = [42, 52, 38]
                const isFirst = i === 1
                return (
                  <div key={p.rank} className="flex flex-col items-center gap-1.5">
                    <div
                      className="rounded-full flex items-center justify-center font-bold"
                      style={{
                        width: sizes[i], height: sizes[i],
                        background: isDark ? `linear-gradient(135deg, ${p.avatar}30, ${p.avatar}10)` : `linear-gradient(135deg, ${p.avatar}25, ${p.avatar}08)`,
                        border: `2px solid ${isFirst ? gold : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                        fontSize: sizes[i] * 0.38, color: p.avatar,
                      }}
                    >
                      {p.name[0].toUpperCase()}
                    </div>
                    <span className={`text-[11px] font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{p.name}</span>
                    <span className={`text-[9px] ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Lv.{p.level}</span>
                    <div
                      className="flex flex-col items-center justify-center gap-0.5"
                      style={{
                        width: 64, height: heights[i], borderRadius: "8px 8px 0 0",
                        background: isFirst
                          ? isDark ? "linear-gradient(180deg, rgba(212,168,74,0.15) 0%, rgba(212,168,74,0.04) 100%)" : "linear-gradient(180deg, rgba(212,168,74,0.12) 0%, rgba(212,168,74,0.03) 100%)"
                          : isDark ? "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)" : "linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.01) 100%)",
                        border: `1px solid ${isFirst ? (isDark ? "rgba(212,168,74,0.12)" : "rgba(212,168,74,0.2)") : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)")}`,
                        borderBottom: "none",
                      }}
                    >
                      <span className="text-[18px] font-bold" style={{ color: isFirst ? gold : isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)" }}>
                        #{p.rank}
                      </span>
                      <span className={`text-[9px] ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>{(p.xp / 1000).toFixed(1)}k XP</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Divider */}
            <div className={`h-px mx-6 ${isDark ? "bg-zinc-800/80" : "bg-zinc-200/70"}`} />

            {/* Rankings list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {DUMMY_PLAYERS.slice(3).map((p, i) => (
                <motion.div
                  key={p.rank}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-colors ${isDark ? "hover:bg-zinc-800/40" : "hover:bg-zinc-200/40"}`}
                >
                  <span className={`text-[13px] font-semibold w-6 text-center tabular-nums ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                    {p.rank}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                    style={{
                      background: isDark ? `linear-gradient(135deg, ${p.avatar}25, ${p.avatar}08)` : `linear-gradient(135deg, ${p.avatar}20, ${p.avatar}06)`,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                      color: p.avatar,
                    }}
                  >
                    {p.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{p.name}</div>
                    <div className={`text-[10px] ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Lv.{p.level} · {p.streak}d streak · {p.trees} trees</div>
                  </div>
                  <span className={`text-[12px] font-semibold tabular-nums ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                    {p.xp.toLocaleString()} XP
                  </span>
                </motion.div>
              ))}

              {/* Current user */}
              <div className={`h-px mx-3 my-3 ${isDark ? "bg-zinc-800/60" : "bg-zinc-200/60"}`} />
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isDark ? "bg-amber-950/20 border border-amber-900/20" : "bg-amber-50/60 border border-amber-200/40"}`}>
                <span className="text-[13px] font-semibold w-6 text-center" style={{ color: gold }}>—</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                  style={{
                    background: isDark ? "linear-gradient(135deg, rgba(212,168,74,0.15), rgba(212,168,74,0.05))" : "linear-gradient(135deg, rgba(212,168,74,0.2), rgba(212,168,74,0.06))",
                    border: `1px solid ${isDark ? "rgba(212,168,74,0.12)" : "rgba(212,168,74,0.2)"}`,
                    color: gold,
                  }}
                >
                  Y
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: gold }}>You</div>
                  <div className={`text-[10px] ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Keep writing to climb the ranks</div>
                </div>
                <span className="text-[12px] font-semibold tabular-nums" style={{ color: gold }}>
                  {xp.toLocaleString()} XP
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-8 py-3 border-t shrink-0 ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"}`}>
              <p className={`text-[10px] text-center ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>
                Rankings reset each season. Earn XP by writing and completing focus sessions.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
