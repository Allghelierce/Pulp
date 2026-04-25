"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"

interface LeaderboardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  sunshine: number
}

const PLAYERS = [
  { rank: 1, name: "inkwell_sage", level: 42, sunshine: 84200, streak: 87, trees: 34, avatar: "#e07840" },
  { rank: 2, name: "midnight_quill", level: 38, sunshine: 67500, streak: 63, trees: 28, avatar: "#8b7aaa" },
  { rank: 3, name: "paper_moth", level: 35, sunshine: 51300, streak: 55, trees: 25, avatar: "#c06878" },
  { rank: 4, name: "velvet_prose", level: 31, sunshine: 42100, streak: 41, trees: 21, avatar: "#5a9a6a" },
  { rank: 5, name: "cedar_drafts", level: 28, sunshine: 33800, streak: 34, trees: 18, avatar: "#5a88b0" },
]

const TREE_KEYS = Object.keys(TREE_TYPES).filter(k => k !== 'spoiled')

function seededRng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => {
    s ^= s << 13
    s ^= s >> 17
    s ^= s << 5
    return ((s >>> 0) % 10000) / 10000
  }
}

function generateFakeGrove(playerIdx: number, treeCount: number) {
  const rng = seededRng(playerIdx * 311 + 1337)
  const trees: { type: string; stage: number; x: number; y: number }[] = []
  for (let i = 0; i < treeCount; i++) {
    const typeIdx = Math.floor(rng() * TREE_KEYS.length)
    trees.push({
      type: TREE_KEYS[typeIdx],
      stage: Math.min(4, Math.floor(rng() * 3) + 2),
      x: 8 + rng() * 84,
      y: 10 + rng() * 75,
    })
  }
  return trees.sort((a, b) => a.y - b.y)
}

export const LeaderboardView = memo(function LeaderboardView({ isOpen, onClose, theme, sunshine }: LeaderboardViewProps) {
  const isDark = theme === "dark"
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { if (selectedPlayer !== null) setSelectedPlayer(null); else onClose() } }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose, selectedPlayer])

  useEffect(() => {
    if (!isOpen) setSelectedPlayer(null)
  }, [isOpen])

  const selectedGrove = useMemo(() => {
    if (selectedPlayer === null) return []
    const p = PLAYERS[selectedPlayer]
    return generateFakeGrove(selectedPlayer, p.trees)
  }, [selectedPlayer])

  const accent = '#ea580c'
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  const bgColor = isDark ? '#0c0e10' : '#f5f3ef'
  const cardBg = isDark ? '#141618' : '#eae7e1'
  const hoverBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'

  const MEDAL_COLORS = ['#ea580c', '#9a9590', '#a07050']

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onMouseDown={() => { if (selectedPlayer !== null) setSelectedPlayer(null); else onClose() }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        className="relative w-full overflow-hidden flex flex-col"
        style={{
          maxWidth: selectedPlayer !== null ? 780 : 480,
          borderRadius: 16,
          background: bgColor,
          boxShadow: isDark ? "0 25px 80px -15px rgba(0,0,0,0.7)" : "0 25px 80px -15px rgba(0,0,0,0.15)",
          border: `1px solid ${cardBorder}`,
          transition: 'max-width 0.3s ease',
        }}
      >
            <AnimatePresence mode="wait">
              {selectedPlayer !== null ? (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col"
                >
                  {(() => {
                    const p = PLAYERS[selectedPlayer]
                    return (
                      <>
                        {/* Profile header */}
                        <div className="px-6 py-4 flex items-center gap-4 shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                          <button
                            onClick={() => setSelectedPlayer(null)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: textMuted }}
                            onMouseEnter={e => e.currentTarget.style.color = textPrimary}
                            onMouseLeave={e => e.currentTarget.style.color = textMuted}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                          </button>
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                            style={{ background: p.avatar, color: '#fff' }}
                          >
                            {p.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold" style={{ color: textPrimary }}>{p.name}</div>
                            <div className="text-[10px]" style={{ color: textSecondary }}>Lv.{p.level} · {p.streak}d streak</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-[14px] font-bold" style={{ color: accent }}>{p.sunshine.toLocaleString()}</div>
                              <div className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>sunshine</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[14px] font-bold" style={{ color: textPrimary }}>{p.trees}</div>
                              <div className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>trees</div>
                            </div>
                          </div>
                        </div>

                        {/* Orchard */}
                        <div className="px-6 py-4" style={{ height: 380 }}>
                          <div
                            className="relative w-full h-full rounded-xl overflow-hidden"
                            style={{
                              background: isDark
                                ? 'linear-gradient(180deg, #10140e 0%, #1a1e16 40%, #222820 100%)'
                                : 'linear-gradient(180deg, #ede9e0 0%, #e2ddd4 40%, #d8d2c8 100%)',
                              border: `1px solid ${cardBorder}`,
                            }}
                          >
                            {/* Subtle grid */}
                            <svg className="absolute inset-0 w-full h-full" style={{ opacity: isDark ? 0.04 : 0.06 }}>
                              {Array.from({ length: 8 }).map((_, i) => (
                                <line key={`h-${i}`} x1="0" y1={`${(i + 1) * 11}%`} x2="100%" y2={`${(i + 1) * 11}%`} stroke={isDark ? '#fff' : '#000'} strokeWidth="0.5" />
                              ))}
                            </svg>

                            {selectedGrove.map((tree, i) => {
                              const depthT = tree.y / 100
                              const scale = 0.65 + depthT * 0.4
                              const size = Math.round(32 * scale)
                              return (
                                <div
                                  key={i}
                                  className="absolute flex flex-col items-center"
                                  style={{
                                    left: `${tree.x}%`,
                                    top: `${tree.y}%`,
                                    transform: 'translate(-50%, -85%)',
                                    zIndex: 10 + i,
                                  }}
                                >
                                  <PlantIcon type={tree.type} size={size} stage={tree.stage} />
                                  <div
                                    className="rounded-full -mt-0.5"
                                    style={{
                                      width: size * 0.45,
                                      height: Math.max(2, size * 0.08),
                                      backgroundColor: isDark ? `rgba(0,0,0,${0.2 + depthT * 0.1})` : `rgba(0,0,0,${0.06 + depthT * 0.04})`,
                                      filter: 'blur(1px)',
                                    }}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col"
                >
                  {/* Header */}
                  <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <div>
                      <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: textPrimary }}>Leaderboard</h2>
                      <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>Top writers this season</p>
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

                  {/* Top 5 */}
                  <div className="px-4 py-3">
                    {PLAYERS.map((p, i) => (
                      <motion.div
                        key={p.rank}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.04 * i }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1 cursor-pointer transition-colors"
                        style={{ background: 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => setSelectedPlayer(i)}
                      >
                        {/* Rank */}
                        <span
                          className="text-[14px] font-bold w-6 text-center tabular-nums"
                          style={{ color: i < 3 ? MEDAL_COLORS[i] : textMuted }}
                        >
                          {p.rank}
                        </span>

                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                          style={{ background: p.avatar, color: '#fff' }}
                        >
                          {p.name[0].toUpperCase()}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold" style={{ color: textPrimary }}>{p.name}</div>
                          <div className="text-[10px]" style={{ color: textMuted }}>Lv.{p.level} · {p.streak}d streak · {p.trees} trees</div>
                        </div>

                        {/* Sunshine — prominent */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: isDark ? 'rgba(234,88,12,0.08)' : 'rgba(234,88,12,0.06)' }}>
                          <span className="text-[11px]">☀️</span>
                          <span className="text-[13px] font-bold tabular-nums" style={{ color: accent }}>
                            {p.sunshine >= 1000 ? `${(p.sunshine / 1000).toFixed(1)}k` : p.sunshine}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="px-6"><div style={{ height: 1, background: cardBorder }} /></div>

                  {/* You */}
                  <div className="px-4 py-3">
                    <div
                      className="flex items-center gap-3 px-3 py-3 rounded-xl"
                      style={{ background: isDark ? 'rgba(234,88,12,0.06)' : 'rgba(234,88,12,0.05)', border: `1px solid ${isDark ? 'rgba(234,88,12,0.1)' : 'rgba(234,88,12,0.12)'}` }}
                    >
                      <span className="text-[14px] font-bold w-6 text-center" style={{ color: textMuted }}>—</span>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                        style={{ background: accent, color: '#fff' }}
                      >
                        Y
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold" style={{ color: accent }}>You</div>
                        <div className="text-[10px]" style={{ color: textMuted }}>Keep writing to climb</div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: isDark ? 'rgba(234,88,12,0.1)' : 'rgba(234,88,12,0.08)' }}>
                        <span className="text-[11px]">☀️</span>
                        <span className="text-[13px] font-bold tabular-nums" style={{ color: accent }}>
                          {sunshine >= 1000 ? `${(sunshine / 1000).toFixed(1)}k` : sunshine}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 pb-4">
                    <p className="text-[9px] text-center" style={{ color: textMuted }}>
                      Rankings reset each season · Earn sunshine by writing and completing focus sessions
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
  )
})
