"use client"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { apiFetch } from "@/lib/apiFetch"
import { SCHOOLS } from "@/lib/schools"
import { DEMO_COMPETITORS } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"
import { PulpLoader } from "@/app/components/PulpLoader"
import { ContestBanner } from "./leaderboard/ContestBanner"
import { PastWinnersStrip } from "./leaderboard/PastWinnersStrip"
import { getPalette, getType, chipButton } from "@/app/theme/palette"
import { themePalette } from "@/lib/orchardSky"

// Deterministic tree species per student so a name always grows the same tree.
const FOREST_SPECIES = ['oak', 'pine', 'sakura', 'tangerine', 'plum', 'bamboo', 'cedarwood', 'birch', 'bonsai', 'pear']
function speciesFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return FOREST_SPECIES[h % FOREST_SPECIES.length]
}

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
const CONTEST_PRIZE_SAP = 500

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

// One quiet, centered trophy watermark behind the board — coherent, not cluttered.
function BoardDoodles({ isDark }: { isDark: boolean }) {
  const op = isDark ? 0.055 : 0.05
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ opacity: op }}>
      <svg width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    </div>
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
  const [boardView, setBoardView] = useState<'forest' | 'list'>('forest')
  const [timeframe, setTimeframe] = useState<'weekly' | 'season'>('weekly')

  const palette = getPalette(isDark)
  const { bg: paper, cardBorder, textPrimary, textSecondary, textMuted, accent, accentDeep } = palette
  const type = getType(palette)
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
  const metric: 'delta' | 'total' = timeframe === 'season' ? 'total' : 'delta'
  const orderedEntries = useMemo(() => {
    const arr = [...entries]
    arr.sort((a, b) => metric === 'total' ? b.totalPulp - a.totalPulp : b.pulpDelta - a.pulpDelta)
    return arr
  }, [entries, metric])
  const metricText = (p: Entry) => metric === 'total' ? formatPulp(p.totalPulp) : `+${formatPulp(p.pulpDelta)}`
  const pastWinners = useMemo(() => {
    // Placeholder until weekly history persists (see spec non-goals). Empty renders nothing.
    return [] as { name: string; species: string }[]
  }, [])
  const resolvedRank = (() => {
    const i = orderedEntries.findIndex(e => e.isYou)
    if (i >= 0) return i + 1
    return isDemo ? null : userRank
  })()
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

  const renderStickyYou = () => resolvedRank ? (
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
            {(() => { const you = orderedEntries.find(e => e.isYou); return you ? metricText(you) : '+0' })()}
          </span>
        </div>
      </div>
    </div>
  ) : null

  const emptyState = (
    <div className="flex-1 flex items-center justify-center flex-col gap-2 px-8 text-center relative z-10">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
      <div style={{ fontFamily: font, fontSize: 14, color: textSecondary }}>No one here yet</div>
      <div style={{ fontFamily: font, fontSize: 12, color: textMuted }}>
        Be the first at {schoolLabel} — focus to grow your tree.
      </div>
    </div>
  )

  const renderForest = () => {
    if (orderedEntries.length === 0) return emptyState

    // Exact orchard theme-mode palette (night for dark, day↔dusk blend for light).
    const P = themePalette(isDark)
    const cliff = isDark ? '#161820' : '#8898a8'
    const cliffOp = isDark ? 0.7 : 0.25
    const roadCol = isDark ? '#2a2418' : '#b89a6a'
    const grassCol = isDark ? P.hillNearTop : P.fieldMid1

    const featured = orderedEntries.slice(0, 3)
    const rest = orderedEntries.slice(3)
    const perRow = 6

    // A planted tree: anchored by its BASE on the ground line (top% + translateY(-100%)),
    // so every tree actually sits on the field. Depth: front = bigger/brighter/on top.
    const tree = (p: Entry, xPct: number, groundY: number, size: number, rankIdx: number, featuredTree: boolean, dim: number) => {
      const medal = rankIdx < 3 ? MEDAL_COLORS[rankIdx] : accent
      const showPlate = featuredTree || p.isYou
      return (
        <div
          key={p.id}
          onClick={() => setSelectedPlayer(orderedEntries.indexOf(p))}
          className="absolute cursor-pointer group"
          style={{ left: `${xPct}%`, top: `${groundY}%`, transform: 'translate(-50%, -100%)', zIndex: Math.round(groundY * 10) }}
          title={`#${rankIdx + 1} · ${p.name} · ${metricText(p)} ${metric === 'total' ? 'total' : 'pulp'}`}
        >
          <div className="relative flex flex-col items-center">
            {/* floating plate + crown, above the canopy */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ bottom: '100%', marginBottom: 1 }}>
              {rankIdx === 0 && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill={MEDAL_COLORS[0]} stroke="none" style={{ filter: 'drop-shadow(0 0 5px rgba(217,119,6,0.55))' }}>
                  <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm0 2h14v2H5z" />
                </svg>
              )}
              <div
                className={showPlate ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, marginTop: 1,
                  background: isDark ? 'rgba(20,16,12,0.82)' : 'rgba(245,243,239,0.9)',
                  border: `1px solid ${(p.isYou ? accent : medal)}55`, borderRadius: 8, padding: '1.5px 7px',
                  backdropFilter: 'blur(2px)', whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontFamily: font, fontSize: featuredTree ? 11 : 10, color: medal, fontWeight: 600 }}>#{rankIdx + 1}</span>
                <span style={{ fontFamily: font, fontSize: featuredTree ? 11 : 10, color: p.isYou ? accent : textPrimary, maxWidth: 76, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                <span style={{ fontFamily: font, fontSize: featuredTree ? 10 : 9, color: textMuted }}>{metricText(p)}</span>
              </div>
            </div>
            {/* tree */}
            <div className="group-hover:scale-105 transition-transform" style={{ transformOrigin: 'bottom center', filter: `brightness(${dim})${p.isYou ? ` drop-shadow(0 0 7px ${accent})` : ''}` }}>
              <PlantIcon type={speciesFor(p.name)} size={size} stage={4} hideGround disableSway={!featuredTree} />
            </div>
            {/* ground shadow — anchors the tree to the field */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -1, width: size * 0.5, height: size * 0.11, background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 72%)', borderRadius: '50%' }} />
          </div>
        </div>
      )
    }

    // Featured trio sits at the front (largest, lowest, top of z-order). #1 most forward.
    const featuredPlace = [
      { x: 50, groundY: 91, size: 124 }, // #1
      { x: 27, groundY: 85, size: 92 },  // #2
      { x: 73, groundY: 85, size: 92 },  // #3
    ]
    // The rest recede in rows behind the trio: higher up the field, smaller, dimmer.
    const restRows = Math.max(1, Math.ceil(rest.length / perRow))
    const yRestFront = 80, yRestBack = 67

    return (
      <>
        <div className="flex-1 relative overflow-hidden">
          {/* Orchard-style terrain: sky, haze, cliffs, mountains, hills, lake, road, field, grass */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lb-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.skyTop} /><stop offset="20%" stopColor={P.skyMid} />
                <stop offset="40%" stopColor={P.skyLow} /><stop offset="60%" stopColor={P.skyHorizon} />
                <stop offset="80%" stopColor={P.skyField} /><stop offset="100%" stopColor={P.skyBottom} />
              </linearGradient>
              <radialGradient id="lb-haze1" cx="25%" cy="35%" r="50%"><stop offset="0%" stopColor={isDark ? '#1a1040' : '#b8c8e8'} stopOpacity={isDark ? 0.12 : 0.08} /><stop offset="100%" stopColor={isDark ? '#1a1040' : '#b8c8e8'} stopOpacity="0" /></radialGradient>
              <radialGradient id="lb-haze2" cx="72%" cy="28%" r="40%"><stop offset="0%" stopColor={isDark ? '#201830' : '#c8b8d8'} stopOpacity={isDark ? 0.1 : 0.06} /><stop offset="100%" stopColor={isDark ? '#201830' : '#c8b8d8'} stopOpacity="0" /></radialGradient>
              <linearGradient id="lb-mtn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.mtnTop} /><stop offset="60%" stopColor={P.mtnMid} /><stop offset="100%" stopColor={P.mtnBot} />
              </linearGradient>
              <linearGradient id="lb-snow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.snowTop} /><stop offset="100%" stopColor={P.snowFade} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lb-hillmid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.hillMidTop} /><stop offset="100%" stopColor={P.hillMidBot} />
              </linearGradient>
              <linearGradient id="lb-field" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.fieldTop} /><stop offset="30%" stopColor={P.fieldMid1} />
                <stop offset="70%" stopColor={P.fieldMid2} /><stop offset="100%" stopColor={P.fieldBot} />
              </linearGradient>
              <linearGradient id="lb-lake" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.oceanTop} /><stop offset="60%" stopColor={P.oceanMid} /><stop offset="100%" stopColor={P.oceanBot} />
              </linearGradient>
              <linearGradient id="lb-horizon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.skyHorizon} stopOpacity="0" />
                <stop offset="70%" stopColor={P.skyHorizon} stopOpacity="0" />
                <stop offset="100%" stopColor={P.skyHorizon} stopOpacity={isDark ? 0.25 : 0.15} />
              </linearGradient>
            </defs>
            <rect width="200" height="100" fill="url(#lb-sky)" />
            <rect width="200" height="44" fill="url(#lb-haze1)" /><rect width="200" height="44" fill="url(#lb-haze2)" />
            <rect width="200" height="60" fill="url(#lb-horizon)" />
            {/* stars (dark only) */}
            {P.starOpacity > 0.2 && [[18,10],[40,7],[64,14],[92,9],[120,12],[150,8],[176,13],[30,18],[108,6],[140,17],[80,11],[190,9],[52,16],[164,5],[10,15]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r={i%3===0?0.7:0.4} fill="#e8f0ff" opacity={(i%3===0?0.85:0.5)} />
            ))}
            {/* distant cliffs behind mountains — angular, faint */}
            <path d="M0,40 L10,30 L18,34 L28,24 L38,32 L48,26 L60,34 L72,27 L84,33 L96,28 L110,36 L122,29 L134,24 L148,32 L160,28 L176,35 L188,30 L200,34 L200,52 L0,52 Z" fill={cliff} opacity={cliffOp} />
            {/* mountains + snow caps */}
            <path d="M0,54 L14,42 L22,48 L34,36 L44,47 L56,40 L66,50 L80,39 L90,48 L100,43 L114,53 L126,44 L138,38 L150,49 L162,43 L176,52 L188,45 L200,50 L200,72 L0,72 Z" fill="url(#lb-mtn)" />
            <path d="M30,40 L34,36 L38,40 L35,40.5 Z M76,43 L80,39 L84,43 L80.5,43.5 Z M134,42 L138,38 L142,42 L138.5,42.5 Z" fill="url(#lb-snow)" />
            {/* mid hills */}
            <path d="M0,60 Q50,52 100,59 Q150,66 200,58 L200,84 L0,84 Z" fill="url(#lb-hillmid)" />
            {/* near field where trees stand */}
            <path d="M0,64 Q60,58 120,64 Q165,68 200,62 L200,100 L0,100 Z" fill="url(#lb-field)" />
            {/* lake — tucked in the back so trees stand in front of it */}
            <ellipse cx="166" cy="70" rx="26" ry="3.4" fill="url(#lb-lake)" />
            <ellipse cx="166" cy="69.2" rx="22" ry="2.4" fill={P.oceanTop} opacity="0.5" />
            {[69, 71].map((y, i) => <path key={i} d={`M${154 + i * 5},${y} q6,-1 12,0`} stroke={isDark ? '#3a4a44' : '#cfe4e8'} strokeWidth="0.3" fill="none" opacity="0.5" />)}
            {/* a quiet back road on the left slope */}
            <path d="M14,100 Q24,88 18,78 Q12,71 26,66" stroke={roadCol} strokeWidth="3.4" fill="none" opacity={isDark ? 0.4 : 0.55} strokeLinecap="round" />
            {/* grass tufts — edges + foreground only, clear of the trees */}
            {[[6,96],[14,90],[190,94],[182,88],[4,86],[196,90],[22,98]].map(([x,y],i)=>(
              <path key={i} d={`M${x},${y} l-1,-3 M${x},${y} l0,-3.6 M${x},${y} l1,-3`} stroke={grassCol} strokeWidth="0.4" fill="none" opacity="0.5" strokeLinecap="round" />
            ))}
          </svg>
          {/* sun/moon glow */}
          <div className="absolute pointer-events-none" style={{ left: '50%', top: '8%', width: 210, height: 210, transform: 'translateX(-50%)', background: `radial-gradient(circle, ${P.sunColor} 0%, transparent 70%)`, opacity: isDark ? 0.3 : Math.max(0.35, P.sunGlow) }} />

          {/* trees — far rows first so near rows paint over them */}
          {rest.map((p, j) => {
            const row = Math.floor(j / perRow)
            const colsInRow = Math.min(perRow, rest.length - row * perRow)
            const col = j % perRow
            const t = restRows <= 1 ? 0 : row / (restRows - 1)   // 0 front .. 1 back
            const groundY = yRestFront - (yRestFront - yRestBack) * t
            const margin = 12 + t * 16                            // back rows pull inward (perspective)
            const x = colsInRow === 1 ? 50 : margin + col * ((100 - 2 * margin) / (colsInRow - 1))
            const size = Math.round(58 - t * 22)                  // 58 front .. 36 back
            const dim = 1 - t * 0.18                              // atmospheric fade
            return tree(p, x, groundY, size, j + 3, false, dim)
          })}
          {featured.map((p, i) => tree(p, featuredPlace[i].x, featuredPlace[i].groundY, featuredPlace[i].size, i, true, 1))}
        </div>
        {renderStickyYou()}
      </>
    )
  }

  const renderBoard = () => {
    const top3 = orderedEntries.slice(0, 3)
    const rest = orderedEntries.slice(3)
    const podiumOrder = [top3[1], top3[0], top3[2]]
    const podiumHeights = [104, 134, 84]
    const podiumLabels = ['2nd', '1st', '3rd']
    const podiumMedals = [MEDAL_COLORS[1], MEDAL_COLORS[0], MEDAL_COLORS[2]]

    if (orderedEntries.length === 0) return emptyState

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
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 220, damping: 22 }}
                  className="flex flex-col items-center cursor-pointer group"
                  style={{ width: isFirst ? 124 : 100 }}
                  onClick={() => setSelectedPlayer(orderedEntries.indexOf(p))}
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
                    {metricText(p)} {metric === 'total' ? 'total' : 'pulp'}
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
                </motion.div>
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
                onClick={() => setSelectedPlayer(orderedEntries.indexOf(p))}
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
                    {metricText(p)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {renderStickyYou()}
      </>
    )
  }

  const renderPlayerPopup = () => {
    if (selectedPlayer === null) return null
    const entry = orderedEntries[selectedPlayer]
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
        className={`relative w-full ${embedded ? '' : 'max-w-[520px]'} rounded-2xl overflow-hidden flex flex-col ${embedded ? '' : 'border shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)]'}`}
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
                <span style={{ ...type.eyebrow }}>
                  {isDemo ? 'sample league' : 'weekly standings'}
                </span>
              </div>
              {!showPicker && schoolLabel && (
                <h2 style={{ ...type.viewTitle, margin: '3px 0 0', lineHeight: 1.15 }} className="truncate flex items-center gap-1.5">
                  {schoolLabel}
                  {isDemo && <span style={{ fontSize: 15 }}>🪶</span>}
                </h2>
              )}
              {!showPicker && (
                <p style={{ fontFamily: font, fontSize: 12, color: textMuted, textTransform: 'lowercase', margin: '5px 0 0' }}>
                  {orderedEntries.length} student{orderedEntries.length === 1 ? '' : 's'} · {timeframe === 'season' ? 'all-time total' : 'this week'}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                {!embedded && (
                  <button onClick={onClose} className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
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
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                {isDemo ? (
                  <p className="text-[11px]" style={{ fontFamily: font, color: textMuted, margin: 0 }}>
                    a preview — sign in to compete at your own school.
                  </p>
                ) : school ? (
                  <button
                    onClick={() => { setSchoolQuery(''); setChangingSchool(true) }}
                    className="inline-flex items-center gap-1 text-[10.5px] transition-colors"
                    style={{ fontFamily: font, color: textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.color = accent }}
                    onMouseLeave={e => { e.currentTarget.style.color = textMuted }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    change school
                  </button>
                ) : null}
              </div>
              {/* Timeframe + Forest/List toggles */}
              <div className="flex items-center gap-2 shrink-0">
                {([['weekly', 'Weekly'], ['season', 'Season']] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setTimeframe(v)}
                    className="transition-all hover:scale-105 active:scale-95"
                    style={{ ...chipButton(palette, timeframe === v) }}
                  >
                    {label}
                  </button>
                ))}
                <span style={{ width: 1, height: 16, background: cardBorder, margin: '0 1px' }} />
                {([['forest', 'Forest'], ['list', 'List']] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setBoardView(v)}
                    className="transition-all hover:scale-105 active:scale-95"
                    style={{ ...chipButton(palette, boardView === v) }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!loading && !showPicker && timeframe === 'weekly' && orderedEntries.length > 0 && (
          <>
            <ContestBanner prizeSap={CONTEST_PRIZE_SAP} daysLeft={daysLeftInWeek()} accent={accent} isDark={isDark} />
            <PastWinnersStrip winners={pastWinners} isDark={isDark} />
          </>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <PulpLoader variant="inline" />
          </div>
        ) : showPicker ? (
          renderSchoolPicker()
        ) : boardView === 'forest' ? (
          renderForest()
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
