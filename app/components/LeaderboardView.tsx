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

// Hand-drawn amber doodles behind the board — trophy, laurels, stars, pennants — matching the notebook aesthetic.
function BoardDoodles({ isDark }: { isDark: boolean }) {
  const stroke = '#d97706'
  const op = isDark ? 0.085 : 0.07
  return (
    <svg
      viewBox="0 0 520 700" preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: op, color: stroke }}
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    >
      {/* pennant garland near the top */}
      <path d="M30 60 Q160 96 260 70 Q380 40 500 78" strokeDasharray="2 5" />
      {[
        [70, 66], [120, 82], [180, 78], [240, 70], [320, 56], [400, 56], [460, 70],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} l14 4 l-9 14 z`} />
      ))}

      {/* big trophy, lower-left */}
      <g transform="translate(40 470) scale(1.1)">
        <path d="M16 6h40v14a20 20 0 0 1-40 0z" />
        <path d="M16 10h-10a10 10 0 0 0 12 14" />
        <path d="M56 10h10a10 10 0 0 1-12 14" />
        <path d="M30 40v8h12v-8" />
        <path d="M24 48h24" />
        <path d="M26 56h20" />
        <path d="M36 26l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5-3.7-3.4 5-.6z" />
      </g>

      {/* laurel wreath, right side */}
      <g transform="translate(420 430)">
        <path d="M0 70 Q-34 36 -26 -10" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <path key={i} d={`M${-26 + i * 5} ${-6 + i * 13} q -16 -6 -22 6 q 14 5 22 -6`} />
        ))}
        <path d="M0 70 Q34 36 26 -10" />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <path key={`r${i}`} d={`M${26 - i * 5} ${-6 + i * 13} q 16 -6 22 6 q -14 5 -22 -6`} />
        ))}
      </g>

      {/* scattered sparkles */}
      {[[460, 180, 9], [70, 250, 7], [250, 600, 8], [150, 520, 6], [410, 620, 7], [300, 150, 6]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d={`M0 ${-r} L0 ${r} M${-r} 0 L${r} 0`} />
        </g>
      ))}

      {/* underline flourish */}
      <path d="M150 120 Q260 138 370 120" strokeDasharray="1 6" />
    </svg>
  )
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
  const [changingSchool, setChangingSchool] = useState(false)
  const [applying, setApplying] = useState(false)
  const [appliedName, setAppliedName] = useState<string | null>(null)

  const accent = '#d97706'
  const accentDeep = isDark ? '#e0922f' : '#b45309'
  const paper = isDark ? '#141210' : '#f5f3ef'
  const textPrimary = isDark ? '#e8e2d6' : '#2a2620'
  const textSecondary = isDark ? '#9a948a' : '#6b6258'
  const textMuted = isDark ? '#6b645a' : '#a89f92'
  const cardBorder = isDark ? 'rgba(217,160,90,0.12)' : 'rgba(120,90,40,0.14)'
  const hoverBg = isDark ? 'rgba(217,119,6,0.06)' : 'rgba(120,90,40,0.05)'
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(120,90,40,0.04)'
  const youBg = isDark ? 'rgba(217,119,6,0.1)' : 'rgba(217,119,6,0.07)'
  const ruled = isDark ? 'rgba(217,119,6,0.045)' : 'rgba(180,120,40,0.06)'

  const applyData = useCallback((data: { school: string; members: LiveMember[]; user_rank: number | null }) => {
    setSchool(data.school)
    setNeedsSchool(false)
    setChangingSchool(false)
    setIsDemo(false)
    const youId = data.user_rank != null ? data.members[data.user_rank - 1]?.user_id : null
    setMembers(data.members.map(m => ({
      id: m.user_id,
      name: m.display_name,
      avatarColor: m.avatar_color,
      level: m.level,
      treesGrown: m.trees_grown,
      pulpDelta: m.pulp_delta,
      totalPulp: m.pulp_current,
      isYou: youId != null && m.user_id === youId,
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
      if (!res.ok) { setIsDemo(true); setNeedsSchool(false); setChangingSchool(false); return }
      const data = await res.json()
      if (data.needs_school) { setNeedsSchool(true); return }
      applyData(data)
    } catch {
      setIsDemo(true); setNeedsSchool(false); setChangingSchool(false)
    } finally {
      setLoading(false)
      setSavingSchool(false)
    }
  }, [sap, userName, avatarColor, level, treesGrown, applyData])

  useEffect(() => {
    if (!isOpen) { setSelectedPlayer(null); setChangingSchool(false); return }
    setLoading(true)
    sync()
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedPlayer !== null) setSelectedPlayer(null)
        else if (changingSchool) setChangingSchool(false)
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
  const schoolLabel = isDemo ? 'Inkwell University' : (school || '')
  const showPicker = needsSchool || changingSchool

  const chooseSchool = useCallback((name: string) => {
    setSavingSchool(true)
    setLoading(true)
    sync(name)
  }, [sync])

  const applyForSchool = useCallback(async (name: string) => {
    setApplying(true)
    try {
      const res = await apiFetch('/api/school-application', {
        method: 'POST',
        body: JSON.stringify({ school_name: name }),
      })
      if (res.ok) setAppliedName(name)
    } catch { /* ignore */ }
    finally { setApplying(false) }
  }, [])

  if (!isOpen) return null

  const filteredSchools = schoolQuery.trim()
    ? SCHOOLS.filter(s => s.toLowerCase().includes(schoolQuery.trim().toLowerCase()))
    : SCHOOLS
  const exactMatch = SCHOOLS.some(s => s.toLowerCase() === schoolQuery.trim().toLowerCase())

  // Sketchy laurel that hugs the champion avatar.
  const ChampionLaurel = ({ color }: { color: string }) => (
    <svg width="84" height="64" viewBox="0 0 84 64" className="absolute -top-1 left-1/2 -translate-x-1/2 pointer-events-none" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28 56 Q8 40 12 16" />
      {[0, 1, 2, 3].map(i => <path key={i} d={`M${12 + i * 3} ${18 + i * 9} q -10 -3 -14 4 q 9 3 14 -4`} />)}
      <path d="M56 56 Q76 40 72 16" />
      {[0, 1, 2, 3].map(i => <path key={`r${i}`} d={`M${72 - i * 3} ${18 + i * 9} q 10 -3 14 4 q -9 3 -14 -4`} />)}
    </svg>
  )

  const renderSchoolPicker = () => (
    <div className="flex-1 flex flex-col px-6 pt-5 pb-4 overflow-hidden relative z-10">
      <div className="flex items-center gap-2.5 mb-1">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
        <p style={{ fontFamily: font, fontSize: 18, color: textPrimary, margin: 0 }}>
          {changingSchool ? 'Switch school' : 'Join your school'}
        </p>
      </div>
      <p style={{ fontFamily: font, fontSize: 12.5, color: textMuted, margin: '0 0 14px 32px' }}>
        Compete with classmates on pulp earned each week.
      </p>
      <input
        autoFocus
        value={schoolQuery}
        onChange={e => setSchoolQuery(e.target.value)}
        placeholder="Search schools…"
        style={{
          fontFamily: font, fontSize: 13.5, color: textPrimary,
          background: inputBg, border: `1px solid ${cardBorder}`,
          borderRadius: 12, padding: '10px 13px', outline: 'none', marginBottom: 10,
        }}
      />
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {!exactMatch && schoolQuery.trim() && (
          appliedName === schoolQuery.trim() ? (
            <div
              className="w-full rounded-xl mb-1.5 flex items-start gap-2"
              style={{ fontFamily: font, fontSize: 12.5, color: textSecondary, padding: '11px 13px', background: youBg, border: `1px solid ${cardBorder}` }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}><path d="M20 6 9 17l-5-5"/></svg>
              <span>Application sent — we’ll review “{appliedName}” and add it soon.</span>
            </div>
          ) : (
            <button
              disabled={applying}
              onClick={() => applyForSchool(schoolQuery.trim())}
              className="w-full text-left rounded-xl mb-1.5 transition-colors flex items-center gap-2"
              style={{ fontFamily: font, fontSize: 13.5, color: accent, padding: '11px 13px', background: youBg, border: `1px dashed ${accent}55`, opacity: applying ? 0.6 : 1 }}
            >
              <span style={{ fontSize: 15 }}>+</span> {applying ? 'Sending…' : `Apply to add “${schoolQuery.trim()}”`}
            </button>
          )
        )}
        {filteredSchools.map(s => (
          <button
            key={s}
            disabled={savingSchool}
            onClick={() => chooseSchool(s)}
            className="w-full text-left rounded-xl mb-0.5 transition-colors"
            style={{ fontFamily: font, fontSize: 13.5, color: textPrimary, padding: '11px 13px', background: school === s ? youBg : 'transparent' }}
            onMouseEnter={e => { if (school !== s) e.currentTarget.style.background = hoverBg }}
            onMouseLeave={e => { if (school !== s) e.currentTarget.style.background = 'transparent' }}
          >
            {s}{school === s ? '  ·  current' : ''}
          </button>
        ))}
      </div>
      {changingSchool && (
        <button
          onClick={() => setChangingSchool(false)}
          className="mt-2 text-[12px] self-start transition-colors"
          style={{ fontFamily: font, color: textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← back to standings
        </button>
      )}
    </div>
  )

  const renderBoard = () => {
    const top3 = entries.slice(0, 3)
    const rest = entries.slice(3)
    const podiumOrder = [top3[1], top3[0], top3[2]]
    const podiumHeights = [104, 134, 84]
    const podiumLabels = ['2nd', '1st', '3rd']
    const podiumMedals = [MEDAL_COLORS[1], MEDAL_COLORS[0], MEDAL_COLORS[2]]

    if (entries.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center flex-col gap-2 px-8 text-center relative z-10">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          <div style={{ fontFamily: font, fontSize: 14, color: textSecondary }}>No one here yet</div>
          <div style={{ fontFamily: font, fontSize: 12, color: textMuted }}>
            Be the first at {schoolLabel} — focus to earn pulp.
          </div>
        </div>
      )
    }

    return (
      <>
        {/* Podium */}
        <div className="px-6 pt-5 pb-2 shrink-0 relative z-10">
          <div className="flex items-end justify-center gap-3" style={{ height: 210 }}>
            {podiumOrder.map((p, i) => {
              if (!p) return <div key={i} style={{ width: 100 }} />
              const height = podiumHeights[i]
              const isFirst = i === 1
              return (
                <div
                  key={p.id}
                  className="flex flex-col items-center cursor-pointer group"
                  style={{ width: isFirst ? 124 : 100 }}
                  onClick={() => setSelectedPlayer(entries.indexOf(p))}
                >
                  <div className="relative mb-2 group-hover:scale-110 transition-transform" style={{ paddingTop: isFirst ? 18 : 0 }}>
                    {isFirst && <ChampionLaurel color={MEDAL_COLORS[0]} />}
                    <div
                      className="rounded-full flex items-center justify-center font-normal shrink-0"
                      style={{
                        width: isFirst ? 50 : 40, height: isFirst ? 50 : 40,
                        background: p.avatarColor, color: '#fff',
                        fontSize: isFirst ? 19 : 15,
                        border: `2.5px solid ${podiumMedals[i]}`,
                        boxShadow: isFirst ? `0 0 22px ${podiumMedals[i]}45` : 'none',
                        fontFamily: font,
                      }}
                    >
                      {p.name[0]?.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 max-w-full">
                    <span className="font-normal tabular-nums shrink-0" style={{ color: podiumMedals[i], fontSize: isFirst ? 16 : 14, fontFamily: font }}>
                      {['#2', '#1', '#3'][i]}
                    </span>
                    <p className="font-normal truncate" style={{ color: p.isYou ? accent : textPrimary, fontFamily: font, fontSize: isFirst ? 14.5 : 12.5 }}>
                      {p.name}{p.isYou ? ' (You)' : ''}
                    </p>
                  </div>
                  <p className="text-[10.5px] font-normal tabular-nums mt-0.5" style={{ color: podiumMedals[i], fontFamily: font }}>
                    +{formatPulp(p.pulpDelta)} pulp
                  </p>

                  <div
                    className="w-full mt-2 rounded-t-xl flex items-start justify-center pt-2 gap-1.5"
                    style={{
                      height,
                      background: isDark
                        ? `linear-gradient(180deg, ${podiumMedals[i]}24 0%, ${podiumMedals[i]}0a 100%)`
                        : `linear-gradient(180deg, ${podiumMedals[i]}1c 0%, ${podiumMedals[i]}08 100%)`,
                      border: `1.5px solid ${podiumMedals[i]}40`,
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
        <div className="flex-1 overflow-y-auto px-4 pb-2 relative z-10">
          {rest.map((p, i) => {
            const rank = i + 4
            const isUser = p.isYou
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-colors cursor-pointer"
                style={{ background: isUser ? youBg : 'transparent', border: `1px solid ${isUser ? cardBorder : 'transparent'}` }}
                onMouseEnter={e => { if (!isUser) e.currentTarget.style.background = hoverBg }}
                onMouseLeave={e => { if (!isUser) e.currentTarget.style.background = 'transparent' }}
                onClick={() => setSelectedPlayer(entries.indexOf(p))}
              >
                <span className="text-[12.5px] font-normal w-6 text-center tabular-nums" style={{ color: isUser ? accent : textMuted, fontFamily: font }}>
                  {rank}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-normal shrink-0" style={{ background: p.avatarColor, color: '#fff', fontFamily: font }}>
                  {p.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-normal truncate" style={{ color: isUser ? accent : textPrimary, fontFamily: font }}>
                    {p.name}{isUser ? ' (You)' : ''}
                  </div>
                  <div className="text-[9.5px]" style={{ color: textMuted, fontFamily: font }}>
                    Lv.{p.level} · {formatPulp(p.totalPulp)} total
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isUser ? accent : textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                  <span className="text-[12.5px] font-normal tabular-nums" style={{ color: isUser ? accent : textSecondary, fontFamily: font }}>
                    +{formatPulp(p.pulpDelta)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* You — sticky bottom */}
        {resolvedRank && (
          <div className="px-4 py-3 shrink-0 relative z-10" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: youBg, border: `1px solid ${isDark ? 'rgba(217,119,6,0.16)' : 'rgba(217,119,6,0.14)'}` }}>
              <span className="text-[12.5px] font-normal w-6 text-center tabular-nums" style={{ color: accent, fontFamily: font }}>#{resolvedRank}</span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-normal shrink-0" style={{ background: avatarColor, color: '#fff', fontFamily: font }}>
                {userName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-normal" style={{ color: accent, fontFamily: font }}>{userName} (You)</div>
                <div className="text-[9.5px]" style={{ color: textMuted, fontFamily: font }}>
                  {resolvedRank === 1 ? 'Top of your school!' : resolvedRank <= 3 ? 'On the podium' : 'Keep focusing to climb'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                <span className="text-[12.5px] font-normal tabular-nums" style={{ color: accent, fontFamily: font }}>
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
          style={{ width: 320, borderRadius: 20, background: paper, boxShadow: isDark ? '0 30px 80px -15px rgba(0,0,0,0.8)' : '0 30px 80px -15px rgba(80,50,10,0.18)', border: `1px solid ${cardBorder}` }}
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
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[10px] font-normal truncate max-w-[180px]" style={{ background: `${accent}18`, color: accentDeep, fontFamily: font }}>{schoolLabel}</div>
          </div>

          <div className="flex flex-col items-center -mt-8 relative z-10">
            <div className="rounded-full flex items-center justify-center font-normal" style={{ width: 56, height: 56, background: entry.avatarColor, color: '#fff', fontSize: 22, border: `3px solid ${paper}`, boxShadow: `0 0 0 2px ${medalColor}, 0 8px 24px rgba(0,0,0,0.2)`, fontFamily: font }}>
              {entry.name[0]?.toUpperCase()}
            </div>
            <p className="text-[14px] font-normal mt-2" style={{ color: textPrimary, fontFamily: font }}>{entry.name}{entry.isYou ? ' (You)' : ''}</p>
            <p className="text-[10px] mt-0.5" style={{ color: textMuted, fontFamily: font }}>Level {entry.level}</p>
          </div>

          <div className="px-5 py-4">
            <div className="grid grid-cols-3 gap-2">
              {statItems.map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1.5 py-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(120,90,40,0.04)', border: `1px solid ${cardBorder}` }}>
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
              className="w-full py-2 rounded-xl text-[11px] font-normal transition-all"
              style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(120,90,40,0.06)', color: textSecondary, fontFamily: font }}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(120,90,40,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(120,90,40,0.06)' }}
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
        className={`relative w-full ${embedded ? '' : 'max-w-[520px]'} rounded-[20px] overflow-hidden flex flex-col ${embedded ? '' : 'border shadow-[0_32px_80px_-12px_rgba(60,40,10,0.45)]'}`}
        style={{ background: paper, height: embedded ? '100%' : 700, borderColor: embedded ? undefined : cardBorder }}
      >
        {/* Hand-drawn background: ruled paper + amber doodles */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `repeating-linear-gradient(transparent, transparent 31px, ${ruled} 31px, ${ruled} 32px)` }} />
        <BoardDoodles isDark={isDark} />

        {/* Header — pennant banner */}
        <div className="px-6 pt-5 pb-4 shrink-0 relative z-10" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill={accent} stroke="none"><path d="M4 2v20l8-5 8 5V2z" /></svg>
                <span style={{ fontFamily: font, fontSize: 11, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                  {isDemo ? 'sample league' : 'weekly standings'}
                </span>
              </div>
              {!showPicker && schoolLabel && (
                <h2 style={{ fontFamily: font, fontSize: 22, fontWeight: 600, color: accentDeep, letterSpacing: '-0.01em', margin: '3px 0 0', lineHeight: 1.15 }} className="truncate flex items-center gap-1.5">
                  {schoolLabel}
                  {isDemo && <span style={{ fontSize: 15 }}>🪶</span>}
                </h2>
              )}
              {!showPicker && (
                <p style={{ fontFamily: font, fontSize: 12, color: textMuted, textTransform: 'lowercase', margin: '5px 0 0' }}>
                  {entries.length} student{entries.length === 1 ? '' : 's'} · ranked by pulp
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                {!embedded && (
                  <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 24, lineHeight: 1 }}>&times;</button>
                )}
              </div>
              {!showPicker && (
                <div
                  className="flex items-center gap-1.5 rounded-full"
                  style={{
                    fontFamily: font, padding: '5px 11px',
                    background: isDark ? 'rgba(217,119,6,0.16)' : 'rgba(217,119,6,0.1)',
                    border: `1px solid ${isDark ? 'rgba(217,119,6,0.3)' : 'rgba(217,119,6,0.22)'}`,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: accentDeep, letterSpacing: '0.01em' }}>
                    {daysLeftInWeek() === 0 ? 'last day' : `${daysLeftInWeek()}d left`}
                  </span>
                </div>
              )}
            </div>
          </div>
          {!showPicker && (
            isDemo ? (
              <p className="mt-2.5 text-[11px]" style={{ fontFamily: font, color: textMuted }}>
                a preview of the standings — sign in to compete at your own school.
              </p>
            ) : school ? (
              <button
                onClick={() => { setSchoolQuery(''); setChangingSchool(true) }}
                className="mt-2 inline-flex items-center gap-1 text-[10.5px] transition-colors"
                style={{ fontFamily: font, color: textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.color = accent }}
                onMouseLeave={e => { e.currentTarget.style.color = textMuted }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                change school
              </button>
            ) : null
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="text-[12px]" style={{ color: textMuted, fontFamily: font }}>Loading…</div>
          </div>
        ) : showPicker ? (
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
