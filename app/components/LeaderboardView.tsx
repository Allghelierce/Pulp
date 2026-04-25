"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface LeaderboardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  sunshine: number
}

type Tab = 'sunshine' | 'time'

function seededRng(seed: number) {
  let s = Math.abs(seed) || 1
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000 }
}

function generatePlayers(count: number) {
  const rng = seededRng(42069)
  const adjectives = ['midnight','velvet','silent','ember','frost','golden','iron','swift','crimson','lunar','sage','silver','wild','pale','dark','bright','deep','lost','brave','lone']
  const nouns = ['quill','moth','ink','fox','owl','cedar','fern','ash','drift','plume','prose','wolf','crow','reed','thorn','spark','rune','veil','tide','stone']
  const avatarColors = ['#e07840','#8b7aaa','#c06878','#5a9a6a','#5a88b0','#b07850','#6a8a5a','#9a6a8a','#5a7aaa','#aa7a5a','#7a9a7a','#8a6aaa','#aa8a5a','#6a7a9a','#9a8a6a']

  const players: { name: string; level: number; sunshine: number; focusHours: number; streak: number; trees: number; avatar: string }[] = []
  const usedNames = new Set<string>()

  for (let i = 0; i < count; i++) {
    let name = ''
    while (!name || usedNames.has(name)) {
      name = adjectives[Math.floor(rng() * adjectives.length)] + '_' + nouns[Math.floor(rng() * nouns.length)]
    }
    usedNames.add(name)

    const rank = i + 1
    const base = Math.pow(0.92, rank)
    const sunshine = Math.round((90000 + rng() * 30000) * base)
    const focusHours = Math.round((420 + rng() * 180) * base)
    const level = Math.max(1, Math.round(10 + (50 - rank) * 0.85 + rng() * 5))
    const streak = Math.max(1, Math.round((90 - rank * 1.2) + rng() * 15))
    const trees = Math.max(3, Math.round((60 - rank * 0.8) + rng() * 10))
    const avatar = avatarColors[Math.floor(rng() * avatarColors.length)]

    players.push({ name, level, sunshine, focusHours, streak, trees, avatar })
  }
  return players
}

const ALL_PLAYERS = generatePlayers(50)

const font = '"EB Garamond", Georgia, serif'

export const LeaderboardView = memo(function LeaderboardView({ isOpen, onClose, theme, sunshine }: LeaderboardViewProps) {
  const isDark = theme === "dark"
  const [tab, setTab] = useState<Tab>('sunshine')
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) { setSelectedPlayer(null); return }
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { if (selectedPlayer !== null) setSelectedPlayer(null); else onClose() } }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose, selectedPlayer])

  const sorted = useMemo(() => {
    const copy = [...ALL_PLAYERS]
    if (tab === 'time') copy.sort((a, b) => b.focusHours - a.focusHours)
    return copy
  }, [tab])

  const accent = '#ea580c'
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  const bgColor = isDark ? '#0c0e10' : '#f5f3ef'
  const hoverBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'

  const MEDAL_COLORS = ['#ea580c', '#9a9590', '#a07050']

  const formatVal = (p: typeof ALL_PLAYERS[0]) => {
    if (tab === 'sunshine') {
      const v = p.sunshine
      return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
    }
    return `${p.focusHours}h`
  }

  if (!isOpen) return null

  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)
  const podiumOrder = [top3[1], top3[0], top3[2]]
  const podiumHeights = [100, 130, 80]
  const podiumLabels = ['2nd', '1st', '3rd']
  const podiumMedals = [MEDAL_COLORS[1], MEDAL_COLORS[0], MEDAL_COLORS[2]]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        className="relative w-full overflow-hidden flex flex-col"
        style={{
          maxWidth: 520,
          maxHeight: 720,
          borderRadius: 16,
          background: bgColor,
          boxShadow: isDark ? "0 25px 80px -15px rgba(0,0,0,0.7)" : "0 25px 80px -15px rgba(0,0,0,0.15)",
          border: `1px solid ${cardBorder}`,
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 shrink-0 flex items-center justify-between" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: textPrimary, fontFamily: font }}>Leaderboard</h2>
            <p className="text-[11px] mt-0.5" style={{ color: textMuted, fontFamily: font }}>Top writers this season</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className={`flex rounded-lg overflow-hidden border p-0.5 gap-0.5 ${isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-100"} text-[10px] font-semibold`}>
              {([['sunshine', 'Sunshine'], ['time', 'Focus Time']] as [Tab, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    tab === id
                      ? (isDark ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-zinc-900 shadow-sm")
                      : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700")
                  }`}
                  style={{ fontFamily: font }}
                >
                  <span className="opacity-80">
                    {id === 'sunshine'
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    }
                  </span>
                  {label}
                </button>
              ))}
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
        </div>

        {/* Podium */}
        <div className="px-6 pt-5 pb-2 shrink-0">
          <div className="flex items-end justify-center gap-3" style={{ height: 200 }}>
            {podiumOrder.map((p, i) => {
              if (!p) return null
              const height = podiumHeights[i]
              const isFirst = i === 1
              return (
                <div
                  key={p.name}
                  className="flex flex-col items-center cursor-pointer group"
                  style={{ width: isFirst ? 120 : 100 }}
                  onClick={() => { const realIdx = sorted.indexOf(p); setSelectedPlayer(realIdx) }}
                >
                  {/* Avatar */}
                  <div className="relative mb-2 group-hover:scale-110 transition-transform">
                    <div
                      className="rounded-full flex items-center justify-center font-bold shrink-0"
                      style={{
                        width: isFirst ? 48 : 40,
                        height: isFirst ? 48 : 40,
                        background: p.avatar,
                        color: '#fff',
                        fontSize: isFirst ? 18 : 15,
                        border: `2.5px solid ${podiumMedals[i]}`,
                        boxShadow: isFirst ? `0 0 20px ${podiumMedals[i]}40` : 'none',
                        fontFamily: font,
                      }}
                    >
                      {p.name[0].toUpperCase()}
                    </div>
                    {isFirst && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={MEDAL_COLORS[0]} stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold truncate max-w-full" style={{ color: textPrimary, fontFamily: font }}>{p.name}</p>
                  <p className="text-[10px] font-bold tabular-nums mt-0.5" style={{ color: podiumMedals[i], fontFamily: font }}>{formatVal(p)}</p>

                  {/* Podium block */}
                  <div
                    className="w-full mt-2 rounded-t-lg flex items-start justify-center pt-2"
                    style={{
                      height,
                      background: isDark
                        ? `linear-gradient(180deg, ${podiumMedals[i]}18 0%, ${podiumMedals[i]}08 100%)`
                        : `linear-gradient(180deg, ${podiumMedals[i]}14 0%, ${podiumMedals[i]}06 100%)`,
                      border: `1px solid ${podiumMedals[i]}20`,
                      borderBottom: 'none',
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: podiumMedals[i], fontFamily: font }}>{podiumLabels[i]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {rest.map((p, i) => {
            const rank = i + 4
            return (
              <div
                key={p.name}
                className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-colors cursor-pointer"
                style={{ background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => { const realIdx = sorted.indexOf(p); setSelectedPlayer(realIdx) }}
              >
                <span
                  className="text-[12px] font-bold w-6 text-center tabular-nums"
                  style={{ color: textMuted, fontFamily: font }}
                >
                  {rank}
                </span>

                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: p.avatar, color: '#fff', fontFamily: font }}
                >
                  {p.name[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate" style={{ color: textPrimary, fontFamily: font }}>{p.name}</div>
                  <div className="text-[9px]" style={{ color: textMuted, fontFamily: font }}>Lv.{p.level} · {p.streak}d streak · {p.trees} trees</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="opacity-70">
                    {tab === 'sunshine'
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    }
                  </span>
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: accent, fontFamily: font }}>
                    {formatVal(p)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* You — sticky bottom */}
        <div className="px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${cardBorder}` }}>
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: isDark ? 'rgba(234,88,12,0.06)' : 'rgba(234,88,12,0.05)', border: `1px solid ${isDark ? 'rgba(234,88,12,0.1)' : 'rgba(234,88,12,0.12)'}` }}
          >
            <span className="text-[12px] font-bold w-6 text-center" style={{ color: textMuted, fontFamily: font }}>—</span>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ background: accent, color: '#fff', fontFamily: font }}
            >
              Y
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold" style={{ color: accent, fontFamily: font }}>You</div>
              <div className="text-[9px]" style={{ color: textMuted, fontFamily: font }}>Keep writing to climb</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="opacity-70">
                {tab === 'sunshine'
                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                }
              </span>
              <span className="text-[12px] font-bold tabular-nums" style={{ color: accent, fontFamily: font }}>
                {sunshine >= 1000 ? `${(sunshine / 1000).toFixed(1)}k` : sunshine}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Player profile popup */}
      <AnimatePresence>
        {selectedPlayer !== null && sorted[selectedPlayer] && (() => {
          const p = sorted[selectedPlayer]
          const rank = selectedPlayer + 1
          const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : accent
          const statItems = [
            { label: 'Sunshine', value: p.sunshine.toLocaleString(), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> },
            { label: 'Focus Time', value: `${p.focusHours}h`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'Streak', value: `${p.streak}d`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3.5-7.5 .67 2.5 1.73 4.2 3 5.5 2 2.08 2.5 4.5 1 7.5-1 2-3 3.5-5.5 3.5s-4-1-5-3.5c-.56-1.41-.56-3.18 0-4.5"/></svg> },
            { label: 'Trees', value: String(p.trees), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8c0-5-5-5-5-5s-5 0-5 5c0 3 2 5.5 5 8 3-2.5 5-5 5-8z"/><path d="M12 16v6"/></svg> },
            { label: 'Level', value: String(p.level), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
          ]
          return (
            <motion.div
              key="player-popup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[200] flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
              onMouseDown={() => setSelectedPlayer(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                onMouseDown={e => e.stopPropagation()}
                className="relative overflow-hidden"
                style={{
                  width: 320,
                  borderRadius: 16,
                  background: bgColor,
                  boxShadow: isDark ? '0 30px 80px -15px rgba(0,0,0,0.8)' : '0 30px 80px -15px rgba(0,0,0,0.2)',
                  border: `1px solid ${cardBorder}`,
                }}
              >
                {/* Banner */}
                <div
                  className="relative h-20 flex items-end justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${medalColor}30 0%, ${medalColor}10 100%)`,
                    borderBottom: `1px solid ${cardBorder}`,
                  }}
                >
                  {rank <= 3 && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {Array.from({ length: 12 }).map((_, j) => (
                        <motion.div
                          key={j}
                          className="absolute rounded-full"
                          style={{
                            width: 2 + (j % 3),
                            height: 2 + (j % 3),
                            left: `${8 + (j * 8) % 85}%`,
                            top: `${20 + (j * 13) % 60}%`,
                            backgroundColor: medalColor,
                          }}
                          animate={{
                            opacity: [0, 0.6, 0],
                            y: [0, -15],
                            scale: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 2 + (j % 3),
                            repeat: Infinity,
                            delay: j * 0.3,
                            ease: "easeOut",
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Rank badge */}
                  <div
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{ background: `${medalColor}20`, color: medalColor, fontFamily: font }}
                  >
                    #{rank}
                  </div>
                </div>

                {/* Avatar — overlaps banner */}
                <div className="flex flex-col items-center -mt-8 relative z-10">
                  <div
                    className="rounded-full flex items-center justify-center font-bold"
                    style={{
                      width: 56,
                      height: 56,
                      background: p.avatar,
                      color: '#fff',
                      fontSize: 22,
                      border: `3px solid ${bgColor}`,
                      boxShadow: `0 0 0 2px ${medalColor}, 0 8px 24px rgba(0,0,0,0.2)`,
                      fontFamily: font,
                    }}
                  >
                    {p.name[0].toUpperCase()}
                  </div>
                  <p className="text-[14px] font-semibold mt-2" style={{ color: textPrimary, fontFamily: font }}>{p.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: textMuted, fontFamily: font }}>
                    Level {p.level} · {p.streak} day streak
                  </p>
                </div>

                {/* Stats grid */}
                <div className="px-5 py-4">
                  <div className="grid grid-cols-3 gap-2">
                    {statItems.slice(0, 3).map(s => (
                      <div
                        key={s.label}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                          border: `1px solid ${cardBorder}`,
                        }}
                      >
                        {s.icon}
                        <span className="text-[14px] font-bold tabular-nums" style={{ color: textPrimary, fontFamily: font }}>{s.value}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: textMuted, fontFamily: font }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {statItems.slice(3).map(s => (
                      <div
                        key={s.label}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                          border: `1px solid ${cardBorder}`,
                        }}
                      >
                        {s.icon}
                        <span className="text-[14px] font-bold tabular-nums" style={{ color: textPrimary, fontFamily: font }}>{s.value}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: textMuted, fontFamily: font }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Close */}
                <div className="px-5 pb-4">
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="w-full py-2 rounded-xl text-[11px] font-semibold transition-all"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      color: textSecondary,
                      fontFamily: font,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
})
