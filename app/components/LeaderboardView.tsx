"use client"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { apiFetch } from "@/lib/apiFetch"
import { SCHOOLS } from "@/lib/schools"
import { DEMO_COMPETITORS } from "@/app/constants"

interface LeaderboardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  sap: number
  embedded?: boolean
  userName?: string
  avatarColor?: string
  level?: number
  treesGrown?: number
}

const font = 'Crimson Pro, serif'
const MEDAL_COLORS = ['#d97706', '#9a9590', '#a07050']

function formatPulp(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function daysLeftInWeek(): number {
  const day = new Date().getDay()
  return day === 0 ? 0 : 7 - day
}

interface Entry {
  id: string
  name: string
  avatarColor: string
  level: number
  treesGrown: number
  pulpDelta: number
  totalPulp: number
  isYou?: boolean
}

interface LiveMember {
  user_id: string
  display_name: string
  avatar_color: string
  level: number
  trees_grown: number
  pulp_delta: number
  pulp_current: number
}

function buildDemoEntries(userPulp: number, userName: string, avatarColor: string, level: number, treesGrown: number): Entry[] {
  const start = Math.max(0, userPulp - Math.floor(userPulp * 0.3 + 120))
  const you: Entry = {
    id: 'you',
    name: userName || 'You',
    avatarColor: avatarColor || '#d97706',
    level: level || 1,
    treesGrown: treesGrown || 0,
    pulpDelta: userPulp - start,
    totalPulp: userPulp,
    isYou: true,
  }
  const bots: Entry[] = DEMO_COMPETITORS.map(b => ({
    id: b.name,
    name: b.name,
    avatarColor: b.avatarColor,
    level: b.level,
    treesGrown: b.treesGrown,
    pulpDelta: b.sapDelta,
    totalPulp: b.currentSap,
  }))
  return [...bots, you].sort((a, b) => b.pulpDelta - a.pulpDelta)
}

export const LeaderboardView = memo(function LeaderboardView({
  isOpen, onClose, theme, sap, embedded,
  userName = 'You', avatarColor = '#d97706', level = 1, treesGrown = 0,
}: LeaderboardViewProps) {
  const isDark = theme === "dark"

  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [needsSchool, setNeedsSchool] = useState(false)
  const [school, setSchool] = useState<string | null>(null)
  const [members, setMembers] = useState<Entry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)
  const [schoolQuery, setSchoolQuery] = useState('')
  const [savingSchool, setSavingSchool] = useState(false)

  const accent = '#d97706'
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  const bgColor = isDark ? '#09090b' : '#f5f3ef'
  const hoverBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  const applyData = useCallback((data: { school: string; members: LiveMember[]; user_rank: number | null }) => {
    setSchool(data.school)
    setNeedsSchool(false)
    setIsDemo(false)
    setMembers(data.members.map(m => ({
      id: m.user_id,
      name: m.display_name,
      avatarColor: m.avatar_color,
      level: m.level,
      treesGrown: m.trees_grown,
      pulpDelta: m.pulp_delta,
      totalPulp: m.pulp_current,
      isYou: data.user_rank != null && m.user_id === data.members[data.user_rank - 1]?.user_id,
    })))
    setUserRank(data.user_rank)
  }, [])

  // Report current pulp and fetch standings (POST does both).
  const sync = useCallback(async (chosenSchool?: string) => {
    try {
      const res = await apiFetch('/api/leaderboard', {
        method: 'POST',
        body: JSON.stringify({
          pulp: sap,
          display_name: userName,
          avatar_color: avatarColor,
          level,
          trees_grown: treesGrown,
          ...(chosenSchool ? { school: chosenSchool } : {}),
        }),
      })
      if (res.status === 401) { setIsDemo(true); return }
      if (!res.ok) { setIsDemo(true); return }
      const data = await res.json()
      if (data.needs_school) { setNeedsSchool(true); return }
      applyData(data)
    } catch {
      setIsDemo(true)
    } finally {
      setLoading(false)
      setSavingSchool(false)
    }
  }, [sap, userName, avatarColor, level, treesGrown, applyData])

  useEffect(() => {
    if (!isOpen) { setSelectedPlayer(null); return }
    setLoading(true)
    sync()
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedPlayer !== null) setSelectedPlayer(null)
        else onClose()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const demoEntries = useMemo(
    () => buildDemoEntries(sap, userName, avatarColor, level, treesGrown),
    [sap, userName, avatarColor, level, treesGrown]
  )

  const entries = isDemo ? demoEntries : members
  const resolvedRank = isDemo
    ? (() => { const i = demoEntries.findIndex(e => e.isYou); return i >= 0 ? i + 1 : null })()
    : userRank
  const schoolLabel = isDemo ? 'Demo University' : (school || '')

  const chooseSchool = useCallback((name: string) => {
    setSavingSchool(true)
    setLoading(true)
    sync(name)
  }, [sync])

  if (!isOpen) return null

  const filteredSchools = schoolQuery.trim()
    ? SCHOOLS.filter(s => s.toLowerCase().includes(schoolQuery.trim().toLowerCase()))
    : SCHOOLS
  const exactMatch = SCHOOLS.some(s => s.toLowerCase() === schoolQuery.trim().toLowerCase())

  const renderSchoolPicker = () => (
    <div className="flex-1 flex flex-col px-6 pt-4 pb-4 overflow-hidden">
      <p style={{ fontFamily: font, fontSize: 16, color: textPrimary, margin: 0 }}>Pick your school</p>
      <p style={{ fontFamily: font, fontSize: 12, color: textMuted, margin: '4px 0 12px' }}>
        Compete with classmates on pulp earned each week.
      </p>
      <input
        autoFocus
        value={schoolQuery}
        onChange={e => setSchoolQuery(e.target.value)}
        placeholder="Search schools…"
        style={{
          fontFamily: font, fontSize: 13, color: textPrimary,
          background: inputBg, border: `1px solid ${cardBorder}`,
          borderRadius: 10, padding: '9px 12px', outline: 'none', marginBottom: 10,
        }}
      />
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {!exactMatch && schoolQuery.trim() && (
          <button
            disabled={savingSchool}
            onClick={() => chooseSchool(schoolQuery.trim())}
            className="w-full text-left rounded-lg mb-1 transition-colors"
            style={{ fontFamily: font, fontSize: 13, color: accent, padding: '10px 12px', background: isDark ? 'rgba(234,88,12,0.06)' : 'rgba(234,88,12,0.05)' }}
          >
            Use “{schoolQuery.trim()}”
          </button>
        )}
        {filteredSchools.map(s => (
          <button
            key={s}
            disabled={savingSchool}
            onClick={() => chooseSchool(s)}
            className="w-full text-left rounded-lg mb-0.5 transition-colors"
            style={{ fontFamily: font, fontSize: 13, color: textPrimary, padding: '10px 12px', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = hoverBg }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            {s}
          </button>
        ))}
        {filteredSchools.length === 0 && !schoolQuery.trim() && (
          <p style={{ fontFamily: font, fontSize: 12, color: textMuted, padding: '10px 12px' }}>No schools.</p>
        )}
      </div>
    </div>
  )

  const renderBoard = () => {
    const top3 = entries.slice(0, 3)
    const rest = entries.slice(3)
    const podiumOrder = [top3[1], top3[0], top3[2]]
    const podiumHeights = [100, 130, 80]
    const podiumLabels = ['2nd', '1st', '3rd']
    const podiumMedals = [MEDAL_COLORS[1], MEDAL_COLORS[0], MEDAL_COLORS[2]]

    if (entries.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center flex-col gap-2 px-8 text-center">
          <div style={{ fontFamily: font, fontSize: 13, color: textSecondary }}>No one here yet</div>
          <div style={{ fontFamily: font, fontSize: 11, color: textMuted }}>
            Be the first at {schoolLabel} — focus to earn pulp.
          </div>
        </div>
      )
    }

    return (
      <>
        {/* Subtitle */}
        <div className="px-6 pt-3 pb-1 shrink-0">
          <span style={{ fontFamily: font, fontSize: 10, color: textMuted, textTransform: 'lowercase', letterSpacing: '0.04em' }}>
            ranked by pulp gained this week
          </span>
        </div>

        {/* Podium */}
        <div className="px-6 pt-3 pb-2 shrink-0">
          <div className="flex items-end justify-center gap-3" style={{ height: 200 }}>
            {podiumOrder.map((p, i) => {
              if (!p) return <div key={i} style={{ width: 100 }} />
              const height = podiumHeights[i]
              const isFirst = i === 1
              return (
                <div
                  key={p.id}
                  className="flex flex-col items-center cursor-pointer group"
                  style={{ width: isFirst ? 120 : 100 }}
                  onClick={() => setSelectedPlayer(entries.indexOf(p))}
                >
                  <div className="relative mb-2 group-hover:scale-110 transition-transform">
                    <div
                      className="rounded-full flex items-center justify-center font-normal shrink-0"
                      style={{
                        width: isFirst ? 48 : 40, height: isFirst ? 48 : 40,
                        background: p.avatarColor, color: '#fff',
                        fontSize: isFirst ? 18 : 15,
                        border: `2.5px solid ${podiumMedals[i]}`,
                        boxShadow: isFirst ? `0 0 20px ${podiumMedals[i]}40` : 'none',
                        fontFamily: font,
                      }}
                    >
                      {p.name[0]?.toUpperCase()}
                    </div>
                    {isFirst && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={MEDAL_COLORS[0]} stroke="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 max-w-full">
                    <span className="font-normal tabular-nums shrink-0" style={{ color: podiumMedals[i], fontSize: isFirst ? 16 : 14, fontFamily: font }}>
                      {['#2', '#1', '#3'][i]}
                    </span>
                    <p className="font-normal truncate" style={{ color: p.isYou ? accent : textPrimary, fontFamily: font, fontSize: isFirst ? 14 : 12 }}>
                      {p.name}{p.isYou ? ' (You)' : ''}
                    </p>
                  </div>
                  <p className="text-[10px] font-normal tabular-nums mt-0.5" style={{ color: podiumMedals[i], fontFamily: font }}>
                    +{formatPulp(p.pulpDelta)} pulp
                  </p>

                  <div
                    className="w-full mt-2 rounded-t-lg flex items-start justify-center pt-2 gap-1.5"
                    style={{
                      height,
                      background: isDark
                        ? `linear-gradient(180deg, ${podiumMedals[i]}18 0%, ${podiumMedals[i]}08 100%)`
                        : `linear-gradient(180deg, ${podiumMedals[i]}14 0%, ${podiumMedals[i]}06 100%)`,
                      border: `1px solid ${podiumMedals[i]}20`,
                      borderBottom: 'none',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={podiumMedals[i]} stroke="none" style={{ marginTop: 1 }}>
                      {i === 1
                        ? <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        : <circle cx="12" cy="12" r="10"/>}
                    </svg>
                    <span className="text-[10px] font-normal uppercase tracking-widest" style={{ color: podiumMedals[i], fontFamily: font }}>
                      {podiumLabels[i]}
                    </span>
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
            const isUser = p.isYou
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors cursor-pointer"
                style={{ background: isUser ? (isDark ? 'rgba(234,88,12,0.06)' : 'rgba(234,88,12,0.04)') : 'transparent' }}
                onMouseEnter={e => { if (!isUser) e.currentTarget.style.background = hoverBg }}
                onMouseLeave={e => { if (!isUser) e.currentTarget.style.background = 'transparent' }}
                onClick={() => setSelectedPlayer(entries.indexOf(p))}
              >
                <span className="text-[12px] font-normal w-6 text-center tabular-nums" style={{ color: isUser ? accent : textMuted, fontFamily: font }}>
                  {rank}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-normal shrink-0" style={{ background: p.avatarColor, color: '#fff', fontFamily: font }}>
                  {p.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-normal truncate" style={{ color: isUser ? accent : textPrimary, fontFamily: font }}>
                    {p.name}{isUser ? ' (You)' : ''}
                  </div>
                  <div className="text-[9px]" style={{ color: textMuted, fontFamily: font }}>
                    Lv.{p.level} · {formatPulp(p.totalPulp)} total
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isUser ? accent : textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                  <span className="text-[12px] font-normal tabular-nums" style={{ color: isUser ? accent : textSecondary, fontFamily: font }}>
                    +{formatPulp(p.pulpDelta)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* You — sticky bottom */}
        {resolvedRank && (
          <div className="px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: isDark ? 'rgba(234,88,12,0.06)' : 'rgba(234,88,12,0.05)', border: `1px solid ${isDark ? 'rgba(234,88,12,0.1)' : 'rgba(234,88,12,0.12)'}` }}>
              <span className="text-[12px] font-normal w-6 text-center tabular-nums" style={{ color: accent, fontFamily: font }}>#{resolvedRank}</span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-normal shrink-0" style={{ background: avatarColor, color: '#fff', fontFamily: font }}>
                {userName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-normal" style={{ color: accent, fontFamily: font }}>{userName} (You)</div>
                <div className="text-[9px]" style={{ color: textMuted, fontFamily: font }}>
                  {resolvedRank === 1 ? 'Top of your school!' : resolvedRank <= 3 ? 'On the podium' : 'Keep focusing to climb'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                <span className="text-[12px] font-normal tabular-nums" style={{ color: accent, fontFamily: font }}>
                  +{formatPulp(entries.find(e => e.isYou)?.pulpDelta ?? 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  const renderPlayerPopup = () => {
    if (selectedPlayer === null) return null
    const entry = entries[selectedPlayer]
    if (!entry) return null
    const rank = selectedPlayer + 1
    const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : accent

    const statItems = [
      { label: 'Pulp', value: `+${formatPulp(entry.pulpDelta)}`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg> },
      { label: 'Trees', value: String(entry.treesGrown), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8c0-5-5-5-5-5s-5 0-5 5c0 3 2 5.5 5 8 3-2.5 5-5 5-8z"/><path d="M12 16v6"/></svg> },
      { label: 'Level', value: String(entry.level), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    ]

    return (
      <motion.div
        key="player-popup"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onMouseDown={() => setSelectedPlayer(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          onMouseDown={e => e.stopPropagation()}
          className="relative overflow-hidden"
          style={{ width: 320, borderRadius: 16, background: bgColor, boxShadow: isDark ? '0 30px 80px -15px rgba(0,0,0,0.8)' : '0 30px 80px -15px rgba(0,0,0,0.2)', border: `1px solid ${cardBorder}` }}
        >
          <div className="relative h-20 flex items-end justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${medalColor}30 0%, ${medalColor}10 100%)`, borderBottom: `1px solid ${cardBorder}` }}>
            {rank <= 3 && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 12 }).map((_, j) => (
                  <motion.div
                    key={j} className="absolute rounded-full"
                    style={{ width: 2 + (j % 3), height: 2 + (j % 3), left: `${8 + (j * 8) % 85}%`, top: `${20 + (j * 13) % 60}%`, backgroundColor: medalColor }}
                    animate={{ opacity: [0, 0.6, 0], y: [0, -15], scale: [0.5, 1, 0.5] }}
                    transition={{ duration: 2 + (j % 3), repeat: Infinity, delay: j * 0.3, ease: "easeOut" }}
                  />
                ))}
              </div>
            )}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[10px] font-normal" style={{ background: `${medalColor}20`, color: medalColor, fontFamily: font }}>#{rank}</div>
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[10px] font-normal truncate max-w-[180px]" style={{ background: `${accent}18`, color: accent, fontFamily: font }}>{schoolLabel}</div>
          </div>

          <div className="flex flex-col items-center -mt-8 relative z-10">
            <div className="rounded-full flex items-center justify-center font-normal" style={{ width: 56, height: 56, background: entry.avatarColor, color: '#fff', fontSize: 22, border: `3px solid ${bgColor}`, boxShadow: `0 0 0 2px ${medalColor}, 0 8px 24px rgba(0,0,0,0.2)`, fontFamily: font }}>
              {entry.name[0]?.toUpperCase()}
            </div>
            <p className="text-[14px] font-normal mt-2" style={{ color: textPrimary, fontFamily: font }}>{entry.name}{entry.isYou ? ' (You)' : ''}</p>
            <p className="text-[10px] mt-0.5" style={{ color: textMuted, fontFamily: font }}>Level {entry.level}</p>
          </div>

          <div className="px-5 py-4">
            <div className="grid grid-cols-3 gap-2">
              {statItems.map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1.5 py-3 rounded-lg" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: `1px solid ${cardBorder}` }}>
                  {s.icon}
                  <span className="text-[14px] font-normal tabular-nums" style={{ color: textPrimary, fontFamily: font }}>{s.value}</span>
                  <span className="text-[8px] font-normal uppercase tracking-widest" style={{ color: textMuted, fontFamily: font }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 pb-4">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="w-full py-2 rounded-lg text-[11px] font-normal transition-all"
              style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: textSecondary, fontFamily: font }}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  const innerContent = (
    <>
      <div
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        className={`relative w-full ${embedded ? '' : 'max-w-[520px]'} rounded-2xl overflow-hidden flex flex-col ${isDark ? "border-zinc-800/80" : "border-zinc-200/80"} ${embedded ? '' : 'border shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)]'}`}
        style={{ background: embedded ? 'transparent' : bgColor, height: embedded ? '100%' : 700 }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 style={{ fontFamily: font, fontSize: 20, fontWeight: 500, color: accent, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 }} className="truncate">
                {needsSchool ? 'Leaderboard' : (schoolLabel || 'Leaderboard')}
              </h2>
              <p style={{ fontFamily: font, fontSize: 12, color: textMuted, margin: '4px 0 0', textTransform: 'lowercase' }}>
                {needsSchool
                  ? 'join your school to compete'
                  : `${daysLeftInWeek()}d left · ${entries.length} student${entries.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isDemo && (
                <span style={{ fontFamily: font, fontSize: 9, color: isDark ? '#fbbf24' : '#b45309', background: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(180,83,9,0.08)', border: `1px solid ${isDark ? 'rgba(251,191,36,0.2)' : 'rgba(180,83,9,0.15)'}`, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Demo
                </span>
              )}
              {!embedded && (
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 24, lineHeight: 1 }}>&times;</button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-[12px]" style={{ color: textMuted, fontFamily: font }}>Loading…</div>
          </div>
        ) : needsSchool ? (
          renderSchoolPicker()
        ) : (
          renderBoard()
        )}
      </div>

      <AnimatePresence>{renderPlayerPopup()}</AnimatePresence>
    </>
  )

  if (embedded) return innerContent

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/60 p-4" onMouseDown={onClose}>
      {innerContent}
    </div>
  )
})
