"use client"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { apiFetch } from "@/lib/apiFetch"
import { TIER_CONFIG, getWeekStart, getRewardForPlacement } from "@/lib/leagues"
import type { LeagueTier, LeagueMember } from "@/lib/leagues"
import { DEMO_COMPETITORS } from "@/app/constants"
import type { DemoCompetitor } from "@/app/constants"

interface LeaderboardViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  sap: number
  embedded?: boolean
}

const font = 'Crimson Pro, serif'

const TIER_ORDER: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond']

function formatSap(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function daysLeftInWeek(): number {
  const now = new Date()
  const day = now.getDay()
  return day === 0 ? 0 : 7 - day
}

interface RankedEntry {
  name: string
  sapAtStart: number
  currentSap: number
  sapDelta: number
  avatarColor: string
  level: number
  treesGrown: number
  isYou?: boolean
}

function buildDemoEntries(userSap: number): RankedEntry[] {
  const sapAtStart = Math.max(0, userSap - Math.floor(Math.random() * 80 + 180))
  const userEntry: RankedEntry = {
    name: 'You',
    sapAtStart,
    currentSap: userSap,
    sapDelta: userSap - sapAtStart,
    avatarColor: '#d97706',
    level: 0,
    treesGrown: 0,
    isYou: true,
  }
  const bots: RankedEntry[] = DEMO_COMPETITORS.map(b => ({ ...b }))
  const all = [...bots, userEntry].sort((a, b) => b.sapDelta - a.sapDelta)
  return all
}

function TierBadge({ tier, size = 'md', isDark }: { tier: LeagueTier; size?: 'sm' | 'md' | 'lg'; isDark: boolean }) {
  const config = TIER_CONFIG[tier]
  const sizes = { sm: 20, md: 28, lg: 40 }
  const s = sizes[size]
  const fontSize = { sm: 9, md: 12, lg: 16 }[size]
  return (
    <div
      style={{
        width: s, height: s, borderRadius: '50%',
        background: `linear-gradient(135deg, ${config.color}40 0%, ${config.color}20 100%)`,
        border: `1.5px solid ${config.color}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, lineHeight: 1,
      }}
    >
      {config.icon}
    </div>
  )
}

function TierProgressBar({ currentTier, isDark }: { currentTier: LeagueTier; isDark: boolean }) {
  const idx = TIER_ORDER.indexOf(currentTier)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {TIER_ORDER.map((t, i) => {
        const config = TIER_CONFIG[t]
        const active = i <= idx
        return (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: i < 4 ? 1 : undefined }}>
            <div
              style={{
                width: 14, height: 14, borderRadius: '50%', fontSize: 8, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? `${config.color}30` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                border: `1px solid ${active ? config.color + '50' : 'transparent'}`,
                opacity: active ? 1 : 0.4,
              }}
            >
              {config.icon}
            </div>
            {i < 4 && (
              <div style={{
                flex: 1, height: 2, borderRadius: 1,
                background: i < idx
                  ? TIER_CONFIG[TIER_ORDER[i + 1]].color + '40'
                  : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export const LeaderboardView = memo(function LeaderboardView({ isOpen, onClose, theme, sap, embedded }: LeaderboardViewProps) {
  const isDark = theme === "dark"
  const [league, setLeague] = useState<{
    league_id: number
    tier: LeagueTier
    week_start: string
    members: LeagueMember[]
    user_rank: number | null
    user_focus: number
    promote_count: number
    demote_count: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)

  const fetchLeague = useCallback(async () => {
    try {
      const res = await apiFetch('/api/league')
      if (res.ok) {
        const data = await res.json()
        setLeague(data)
        setIsDemo(false)
      } else {
        setIsDemo(true)
      }
    } catch {
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) { setSelectedPlayer(null); return }
    fetchLeague()
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedPlayer !== null) setSelectedPlayer(null)
        else onClose()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose, selectedPlayer, fetchLeague])

  const accent = '#d97706'
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  const bgColor = isDark ? '#09090b' : '#f5f3ef'
  const hoverBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'

  const demoEntries = useMemo(() => buildDemoEntries(sap), [sap])
  const demoUserRank = useMemo(() => {
    const idx = demoEntries.findIndex(e => e.isYou)
    return idx >= 0 ? idx + 1 : null
  }, [demoEntries])

  const tierColor = league ? TIER_CONFIG[league.tier].color : TIER_CONFIG['silver'].color
  const tierName = league ? TIER_CONFIG[league.tier].name : 'Silver'
  const currentTier: LeagueTier = league?.tier || 'silver'

  const MEDAL_COLORS = ['#d97706', '#9a9590', '#a07050']

  const promoteCount = league?.promote_count ?? 5
  const demoteCount = league?.demote_count ?? 5

  if (!isOpen) return null

  const renderDemoContent = () => {
    const top3 = demoEntries.slice(0, 3)
    const rest = demoEntries.slice(3)
    const podiumOrder = [top3[1], top3[0], top3[2]]
    const podiumHeights = [100, 130, 80]
    const podiumLabels = ['2nd', '1st', '3rd']
    const podiumMedals = [MEDAL_COLORS[1], MEDAL_COLORS[0], MEDAL_COLORS[2]]

    return (
      <>
        {/* Demo badge */}
        <div className="px-6 pt-3 pb-1 shrink-0 flex items-center gap-2">
          <div
            style={{
              fontFamily: font,
              fontSize: 9,
              color: isDark ? '#fbbf24' : '#b45309',
              background: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(180,83,9,0.08)',
              border: `1px solid ${isDark ? 'rgba(251,191,36,0.2)' : 'rgba(180,83,9,0.15)'}`,
              padding: '3px 8px',
              borderRadius: 6,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
            }}
          >
            Demo Mode
          </div>
          <span style={{ fontFamily: font, fontSize: 9, color: textMuted }}>
            Ranked by sap gained this week
          </span>
        </div>

        {/* Promotion/demotion zone labels */}
        <div className="px-6 pt-2 pb-1 shrink-0 flex gap-4" style={{ fontSize: 9, color: textMuted, fontFamily: font }}>
          <div className="flex items-center gap-1.5">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            <span>Top {promoteCount} promote</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            <span>Bottom {demoteCount} demote</span>
          </div>
        </div>

        {/* Podium */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-end justify-center gap-3" style={{ height: 200 }}>
            {podiumOrder.map((p, i) => {
              if (!p) return <div key={i} style={{ width: 100 }} />
              const height = podiumHeights[i]
              const isFirst = i === 1
              const reward = getRewardForPlacement(currentTier, [2, 1, 3][i])
              return (
                <div
                  key={p.name}
                  className="flex flex-col items-center cursor-pointer group"
                  style={{ width: isFirst ? 120 : 100 }}
                  onClick={() => { const realIdx = demoEntries.indexOf(p); setSelectedPlayer(realIdx) }}
                >
                  <div className="relative mb-2 group-hover:scale-110 transition-transform">
                    <div
                      className="rounded-full flex items-center justify-center font-normal shrink-0"
                      style={{
                        width: isFirst ? 48 : 40,
                        height: isFirst ? 48 : 40,
                        background: p.avatarColor,
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
                  <div className="flex items-center gap-1.5 max-w-full">
                    <span className="font-normal tabular-nums shrink-0" style={{ color: podiumMedals[i], fontSize: isFirst ? 16 : 14, fontFamily: font }}>
                      {['#2', '#1', '#3'][i]}
                    </span>
                    <p className="font-normal truncate" style={{ color: p.isYou ? accent : textPrimary, fontFamily: font, fontSize: isFirst ? 14 : 12 }}>
                      {p.name}{p.isYou ? ' (You)' : ''}
                    </p>
                  </div>
                  <p className="text-[10px] font-normal tabular-nums mt-0.5" style={{ color: podiumMedals[i], fontFamily: font }}>
                    +{formatSap(p.sapDelta)} sap
                  </p>
                  {reward > 0 && (
                    <p className="text-[8px] mt-0.5" style={{ color: textMuted, fontFamily: font }}>+{reward} 💎</p>
                  )}

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
                        : <circle cx="12" cy="12" r="10"/>
                      }
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
            const isPromote = rank <= promoteCount
            const isDemote = rank > demoEntries.length - demoteCount
            const reward = getRewardForPlacement(currentTier, rank)
            const isUser = p.isYou

            return (
              <div
                key={p.name}
                className="flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors cursor-pointer"
                style={{
                  background: isUser
                    ? (isDark ? 'rgba(234,88,12,0.06)' : 'rgba(234,88,12,0.04)')
                    : 'transparent',
                  borderLeft: isPromote ? '2px solid #22c55e30' : isDemote ? '2px solid #ef444430' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!isUser) e.currentTarget.style.background = hoverBg }}
                onMouseLeave={e => { if (!isUser) e.currentTarget.style.background = 'transparent' }}
                onClick={() => setSelectedPlayer(demoEntries.indexOf(p))}
              >
                <span
                  className="text-[12px] font-normal w-6 text-center tabular-nums"
                  style={{ color: isUser ? accent : textMuted, fontFamily: font }}
                >
                  {rank}
                </span>

                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-normal shrink-0"
                  style={{ background: p.avatarColor, color: '#fff', fontFamily: font }}
                >
                  {p.name[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-normal truncate" style={{ color: isUser ? accent : textPrimary, fontFamily: font }}>
                    {p.name}{isUser ? ' (You)' : ''}
                  </div>
                  <div className="text-[9px]" style={{ color: textMuted, fontFamily: font }}>
                    Lv.{p.level} · {formatSap(p.currentSap)} total
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {reward > 0 && (
                    <span className="text-[9px]" style={{ color: textMuted, fontFamily: font }}>+{reward} 💎</span>
                  )}
                  <div className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isUser ? accent : textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6"/>
                    </svg>
                    <span className="text-[12px] font-normal tabular-nums" style={{ color: isUser ? accent : textSecondary, fontFamily: font }}>
                      +{formatSap(p.sapDelta)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* You — sticky bottom */}
        {demoUserRank && (
          <div className="px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: isDark ? 'rgba(234,88,12,0.06)' : 'rgba(234,88,12,0.05)', border: `1px solid ${isDark ? 'rgba(234,88,12,0.1)' : 'rgba(234,88,12,0.12)'}` }}
            >
              <span className="text-[12px] font-normal w-6 text-center tabular-nums" style={{ color: accent, fontFamily: font }}>
                #{demoUserRank}
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-normal shrink-0"
                style={{ background: accent, color: '#fff', fontFamily: font }}
              >
                Y
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-normal" style={{ color: accent, fontFamily: font }}>You</div>
                <div className="text-[9px]" style={{ color: textMuted, fontFamily: font }}>
                  {demoUserRank <= promoteCount
                    ? 'Promotion zone!'
                    : demoUserRank > demoEntries.length - demoteCount
                      ? 'Demotion zone'
                      : 'Keep focusing to climb'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
                <span className="text-[12px] font-normal tabular-nums" style={{ color: accent, fontFamily: font }}>
                  +{formatSap(demoEntries.find(e => e.isYou)?.sapDelta ?? 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  const renderLiveContent = () => {
    if (!league) return null
    const members = league.members
    const top3 = members.slice(0, 3)
    const rest = members.slice(3)
    const podiumOrder = [top3[1], top3[0], top3[2]]
    const podiumHeights = [100, 130, 80]
    const podiumLabels = ['2nd', '1st', '3rd']
    const podiumMedals = [MEDAL_COLORS[1], MEDAL_COLORS[0], MEDAL_COLORS[2]]

    return (
      <>
        {(promoteCount > 0 || demoteCount > 0) && (
          <div className="px-6 pt-3 pb-1 shrink-0 flex gap-4" style={{ fontSize: 9, color: textMuted, fontFamily: font }}>
            {promoteCount > 0 && (
              <div className="flex items-center gap-1.5">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                <span>Top {promoteCount} promote</span>
              </div>
            )}
            {demoteCount > 0 && (
              <div className="flex items-center gap-1.5">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                <span>Bottom {demoteCount} demote</span>
              </div>
            )}
          </div>
        )}

        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-end justify-center gap-3" style={{ height: 200 }}>
            {podiumOrder.map((p, i) => {
              if (!p) return <div key={i} style={{ width: 100 }} />
              const height = podiumHeights[i]
              const isFirst = i === 1
              const reward = getRewardForPlacement(league.tier, [2, 1, 3][i])
              return (
                <div
                  key={p.user_id}
                  className="flex flex-col items-center cursor-pointer group"
                  style={{ width: isFirst ? 120 : 100 }}
                  onClick={() => { const realIdx = members.indexOf(p); setSelectedPlayer(realIdx) }}
                >
                  <div className="relative mb-2 group-hover:scale-110 transition-transform">
                    <div
                      className="rounded-full flex items-center justify-center font-normal shrink-0"
                      style={{
                        width: isFirst ? 48 : 40,
                        height: isFirst ? 48 : 40,
                        background: p.avatar_color,
                        color: '#fff',
                        fontSize: isFirst ? 18 : 15,
                        border: `2.5px solid ${podiumMedals[i]}`,
                        boxShadow: isFirst ? `0 0 20px ${podiumMedals[i]}40` : 'none',
                        fontFamily: font,
                      }}
                    >
                      {p.display_name[0].toUpperCase()}
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
                    <p className="font-normal truncate" style={{ color: textPrimary, fontFamily: font, fontSize: isFirst ? 14 : 12 }}>{p.display_name}</p>
                  </div>
                  <p className="text-[10px] font-normal tabular-nums mt-0.5" style={{ color: podiumMedals[i], fontFamily: font }}>
                    +{formatSap(p.focus_minutes)} sap
                  </p>
                  {reward > 0 && (
                    <p className="text-[8px] mt-0.5" style={{ color: textMuted, fontFamily: font }}>+{reward} 💎</p>
                  )}

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
                        : <circle cx="12" cy="12" r="10"/>
                      }
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

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {rest.map((p, i) => {
            const rank = i + 4
            const isPromote = promoteCount > 0 && rank <= promoteCount
            const isDemote = demoteCount > 0 && rank > members.length - demoteCount
            const reward = getRewardForPlacement(league.tier, rank)
            const isUser = league.user_rank === rank

            return (
              <div
                key={p.user_id}
                className="flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors cursor-pointer"
                style={{
                  background: isUser
                    ? (isDark ? 'rgba(234,88,12,0.06)' : 'rgba(234,88,12,0.04)')
                    : 'transparent',
                  borderLeft: isPromote ? '2px solid #22c55e30' : isDemote ? '2px solid #ef444430' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!isUser) e.currentTarget.style.background = hoverBg }}
                onMouseLeave={e => { if (!isUser) e.currentTarget.style.background = 'transparent' }}
                onClick={() => setSelectedPlayer(members.indexOf(p))}
              >
                <span
                  className="text-[12px] font-normal w-6 text-center tabular-nums"
                  style={{ color: isUser ? accent : textMuted, fontFamily: font }}
                >
                  {rank}
                </span>

                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-normal shrink-0"
                  style={{ background: p.avatar_color, color: '#fff', fontFamily: font }}
                >
                  {p.display_name[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-normal truncate" style={{ color: isUser ? accent : textPrimary, fontFamily: font }}>
                    {p.display_name}{isUser ? ' (You)' : ''}
                  </div>
                  <div className="text-[9px]" style={{ color: textMuted, fontFamily: font }}>Lv.{p.level}</div>
                </div>

                <div className="flex items-center gap-3">
                  {reward > 0 && (
                    <span className="text-[9px]" style={{ color: textMuted, fontFamily: font }}>+{reward} 💎</span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isUser ? accent : textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span className="text-[12px] font-normal tabular-nums" style={{ color: isUser ? accent : textSecondary, fontFamily: font }}>
                      +{formatSap(p.focus_minutes)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {league.user_rank && (
          <div className="px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: isDark ? 'rgba(234,88,12,0.06)' : 'rgba(234,88,12,0.05)', border: `1px solid ${isDark ? 'rgba(234,88,12,0.1)' : 'rgba(234,88,12,0.12)'}` }}
            >
              <span className="text-[12px] font-normal w-6 text-center tabular-nums" style={{ color: accent, fontFamily: font }}>
                #{league.user_rank}
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-normal shrink-0"
                style={{ background: accent, color: '#fff', fontFamily: font }}
              >
                Y
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-normal" style={{ color: accent, fontFamily: font }}>You</div>
                <div className="text-[9px]" style={{ color: textMuted, fontFamily: font }}>
                  {league.user_rank <= promoteCount && promoteCount > 0
                    ? 'Promotion zone!'
                    : league.user_rank > members.length - demoteCount && demoteCount > 0
                      ? 'Demotion zone'
                      : 'Keep focusing to climb'}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-[12px] font-normal tabular-nums" style={{ color: accent, fontFamily: font }}>
                  +{formatSap(league.user_focus)}
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

    const entries = isDemo ? demoEntries : (league?.members || [])
    const entry = entries[selectedPlayer]
    if (!entry) return null

    const rank = selectedPlayer + 1
    const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : accent
    const reward = getRewardForPlacement(currentTier, rank)

    const isRanked = isDemo
    const p = isRanked
      ? entry as RankedEntry
      : null
    const m = !isRanked
      ? entry as LeagueMember
      : null

    const displayName = p ? p.name : m!.display_name
    const avatarColor = p ? p.avatarColor : m!.avatar_color
    const level = p ? p.level : m!.level
    const treesGrown = p ? p.treesGrown : m!.trees_grown
    const sapDelta = p ? p.sapDelta : m!.focus_minutes

    const statItems = [
      { label: 'Sap Gained', value: `+${formatSap(sapDelta)}`, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg> },
      { label: 'Trees', value: String(treesGrown), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8c0-5-5-5-5-5s-5 0-5 5c0 3 2 5.5 5 8 3-2.5 5-5 5-8z"/><path d="M12 16v6"/></svg> },
      { label: 'Level', value: String(level), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={medalColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
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
            <div
              className="absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[10px] font-normal"
              style={{ background: `${medalColor}20`, color: medalColor, fontFamily: font }}
            >
              #{rank}
            </div>
            <div
              className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[10px] font-normal flex items-center gap-1"
              style={{ background: `${tierColor}20`, color: tierColor, fontFamily: font }}
            >
              <TierBadge tier={currentTier} size="sm" isDark={isDark} />
              {tierName}
            </div>
          </div>

          <div className="flex flex-col items-center -mt-8 relative z-10">
            <div
              className="rounded-full flex items-center justify-center font-normal"
              style={{
                width: 56, height: 56,
                background: avatarColor,
                color: '#fff', fontSize: 22,
                border: `3px solid ${bgColor}`,
                boxShadow: `0 0 0 2px ${medalColor}, 0 8px 24px rgba(0,0,0,0.2)`,
                fontFamily: font,
              }}
            >
              {displayName[0].toUpperCase()}
            </div>
            <p className="text-[14px] font-normal mt-2" style={{ color: textPrimary, fontFamily: font }}>{displayName}</p>
            <p className="text-[10px] mt-0.5" style={{ color: textMuted, fontFamily: font }}>
              Level {level}
              {reward > 0 ? ` · Earns ${reward} gems` : ''}
            </p>
          </div>

          <div className="px-5 py-4">
            <div className="grid grid-cols-3 gap-2">
              {statItems.map(s => (
                <div
                  key={s.label}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-lg"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${cardBorder}`,
                  }}
                >
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
        {!embedded && (
          <div className="px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 style={{ fontFamily: font, fontSize: 20, fontWeight: 500, color: tierColor, letterSpacing: '-0.01em', textTransform: 'lowercase', margin: 0, lineHeight: 1.2 }}>
                  {tierName} league
                </h2>
                <p style={{ fontFamily: font, fontSize: 12, color: textMuted, margin: '4px 0 0', textTransform: 'lowercase' }}>
                  {daysLeftInWeek()}d left · {isDemo ? demoEntries.length : (league?.members.length ?? 0)} players
                </p>
              </div>
              <span style={{ fontFamily: font, fontSize: 11, color: textMuted, textTransform: 'lowercase' }}>
                week {Math.ceil((new Date().getTime() - new Date('2025-01-06').getTime()) / (7 * 86400000))}
              </span>
            </div>
            <TierProgressBar currentTier={currentTier} isDark={isDark} />
          </div>
        )}

        {/* Embedded header */}
        {embedded && (
          <div className="px-6 pt-3 pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TierBadge tier={currentTier} size="sm" isDark={isDark} />
                <span className="text-[11px] font-normal" style={{ color: tierColor, fontFamily: font }}>{tierName}</span>
                <span className="text-[9px]" style={{ color: textMuted }}>{daysLeftInWeek()}d left</span>
              </div>
              {isDemo && (
                <span style={{ fontFamily: font, fontSize: 8, color: isDark ? '#fbbf24' : '#b45309', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Demo
                </span>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-[12px]" style={{ color: textMuted, fontFamily: font }}>Loading league...</div>
          </div>
        ) : isDemo ? (
          renderDemoContent()
        ) : league ? (
          renderLiveContent()
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 px-8">
            <div className="text-[13px] font-normal" style={{ color: textSecondary, fontFamily: font }}>No league yet</div>
            <div className="text-[11px] text-center" style={{ color: textMuted, fontFamily: font }}>
              Sign in to join a weekly league and compete with other writers.
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {renderPlayerPopup()}
      </AnimatePresence>
    </>
  )

  if (embedded) return innerContent

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/60 p-4"
      onMouseDown={onClose}
    >
      {innerContent}
    </div>
  )
})
