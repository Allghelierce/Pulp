"use client"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { apiFetch } from "@/lib/apiFetch"
import { SCHOOLS } from "@/lib/schools"
import { DEMO_COMPETITORS } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"

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
            +{formatPulp(entries.find(e => e.isYou)?.pulpDelta ?? 0)}
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
    if (entries.length === 0) return emptyState

    // Palette mirrors OrchardView (day for light, dusk for dark) so the scene matches the real orchard.
    const P = isDark
      ? {
          skyTop: '#1e1018', skyMid: '#281614', skyLow: '#321e0e', skyHorizon: '#2e1a08', skyField: '#18140c', skyBottom: '#141008',
          mtnTop: '#1e1810', mtnMid: '#18140c', mtnBot: '#14100a', snowTop: '#3e3628', snowFade: '#1e1810',
          hillMidTop: '#1c2612', hillMidBot: '#18200e', hillNearTop: '#223014', hillNearBot: '#1e2810',
          fieldTop: '#263414', fieldMid1: '#222e12', fieldMid2: '#243012', fieldBot: '#202a0e',
          sunColor: '#d97706', sunGlow: 0.85, starOp: 0.55,
        }
      : {
          skyTop: '#87aacc', skyMid: '#9dbdcc', skyLow: '#b8ccbb', skyHorizon: '#c8d8b8', skyField: '#d4debb', skyBottom: '#dae4c0',
          mtnTop: '#5a6858', mtnMid: '#4a5848', mtnBot: '#3a4838', snowTop: '#e8e8e0', snowFade: '#a0a898',
          hillMidTop: '#4a6a3a', hillMidBot: '#3e5e30', hillNearTop: '#507840', hillNearBot: '#446a34',
          fieldTop: '#5a7a48', fieldMid1: '#527242', fieldMid2: '#4e6e3e', fieldBot: '#4a6838',
          sunColor: '#f4d79a', sunGlow: 0.5, starOp: 0,
        }

    const featuredPos = [
      { left: 50, bottom: 44, size: 132 },
      { left: 24, bottom: 33, size: 98 },
      { left: 76, bottom: 33, size: 98 },
    ]
    const featured = entries.slice(0, 3)
    const rest = entries.slice(3)
    const perRow = 5

    const tree = (p: Entry, left: number, bottom: number, size: number, rankIdx: number, featuredTree: boolean) => {
      const medal = rankIdx < 3 ? MEDAL_COLORS[rankIdx] : accent
      return (
        <div
          key={p.id}
          onClick={() => setSelectedPlayer(entries.indexOf(p))}
          className="absolute flex flex-col items-center cursor-pointer group"
          style={{ left: `${left}%`, bottom: `${bottom}%`, transform: 'translateX(-50%)', zIndex: Math.round(200 - bottom) }}
          title={`${p.name} · +${formatPulp(p.pulpDelta)} pulp`}
        >
          {rankIdx === 0 && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={MEDAL_COLORS[0]} stroke="none" style={{ marginBottom: -4, filter: 'drop-shadow(0 0 6px rgba(217,119,6,0.5))' }}>
              <path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm0 2h14v2H5z" />
            </svg>
          )}
          {p.isYou && rankIdx !== 0 && (
            <span style={{ fontFamily: font, fontSize: 9, color: '#fff', background: accent, padding: '1px 6px', borderRadius: 6, marginBottom: 2, whiteSpace: 'nowrap' }}>You</span>
          )}
          <div className="group-hover:scale-105 transition-transform" style={{ transformOrigin: 'bottom center', filter: p.isYou ? `drop-shadow(0 0 6px ${accent}80)` : undefined }}>
            <PlantIcon type={speciesFor(p.name)} size={size} stage={4} hideGround disableSway={!featuredTree} />
          </div>
          {/* name plate */}
          <div
            className={featuredTree ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}
            style={{
              marginTop: featuredTree ? 0 : 2, display: 'flex', alignItems: 'center', gap: 4,
              background: isDark ? 'rgba(20,16,12,0.8)' : 'rgba(245,243,239,0.85)',
              border: `1px solid ${medal}40`, borderRadius: 8, padding: '2px 7px',
              backdropFilter: 'blur(2px)', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontFamily: font, fontSize: featuredTree ? 11 : 10, color: medal, fontWeight: 600 }}>#{rankIdx + 1}</span>
            <span style={{ fontFamily: font, fontSize: featuredTree ? 11 : 10, color: p.isYou ? accent : textPrimary, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
            <span style={{ fontFamily: font, fontSize: featuredTree ? 10.5 : 9.5, color: textMuted }}>+{formatPulp(p.pulpDelta)}</span>
          </div>
        </div>
      )
    }

    return (
      <>
        <div className="flex-1 relative overflow-hidden">
          {/* Orchard-style terrain: layered sky, mountains, hills, field */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lb-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.skyTop} /><stop offset="20%" stopColor={P.skyMid} />
                <stop offset="40%" stopColor={P.skyLow} /><stop offset="60%" stopColor={P.skyHorizon} />
                <stop offset="80%" stopColor={P.skyField} /><stop offset="100%" stopColor={P.skyBottom} />
              </linearGradient>
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
              <linearGradient id="lb-horizon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.skyHorizon} stopOpacity="0" />
                <stop offset="70%" stopColor={P.skyHorizon} stopOpacity="0" />
                <stop offset="100%" stopColor={P.skyHorizon} stopOpacity={isDark ? 0.25 : 0.15} />
              </linearGradient>
            </defs>
            <rect width="200" height="100" fill="url(#lb-sky)" />
            <rect width="200" height="60" fill="url(#lb-horizon)" />
            {/* stars (dark only) */}
            {P.starOp > 0 && [[18,12],[40,8],[64,16],[92,10],[120,14],[150,9],[176,15],[30,20],[108,7],[140,19],[80,13],[190,11]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r={i%3===0?0.7:0.45} fill="#e8f0ff" opacity={P.starOp*(i%3===0?1:0.6)} />
            ))}
            {/* mountains + snow caps */}
            <path d="M0,54 L14,42 L22,48 L34,36 L44,47 L56,40 L66,50 L80,39 L90,48 L100,43 L114,53 L126,44 L138,38 L150,49 L162,43 L176,52 L188,45 L200,50 L200,72 L0,72 Z" fill="url(#lb-mtn)" />
            <path d="M30,40 L34,36 L38,40 Z M76,43 L80,39 L84,43 Z M134,42 L138,38 L142,42 Z" fill="url(#lb-snow)" />
            {/* mid hills */}
            <path d="M0,60 Q50,52 100,59 Q150,66 200,58 L200,84 L0,84 Z" fill="url(#lb-hillmid)" />
            {/* near field where trees stand */}
            <path d="M0,68 Q60,62 120,68 Q165,72 200,66 L200,100 L0,100 Z" fill="url(#lb-field)" />
          </svg>
          {/* sun glow behind champion */}
          <div className="absolute pointer-events-none" style={{ left: '50%', top: '10%', width: 200, height: 200, transform: 'translateX(-50%)', background: `radial-gradient(circle, ${P.sunColor}${isDark ? '88' : 'cc'} 0%, transparent 70%)`, opacity: P.sunGlow }} />

          {/* trees */}
          {rest.map((p, j) => {
            const row = Math.floor(j / perRow)
            const colsInRow = Math.min(perRow, rest.length - row * perRow)
            const col = j % perRow
            const spread = Math.min(82, 28 + colsInRow * 12)
            const left = colsInRow === 1 ? 50 : (50 - spread / 2 + col * (spread / (colsInRow - 1)))
            const bottom = Math.max(5, 21 - row * 10)
            const size = Math.max(40, 58 - row * 6)
            return tree(p, left, bottom, size, j + 3, false)
          })}
          {featured.map((p, i) => tree(p, featuredPos[i].left, featuredPos[i].bottom, featuredPos[i].size, i, true))}
        </div>
        {renderStickyYou()}
      </>
    )
  }

  const renderBoard = () => {
    const top3 = entries.slice(0, 3)
    const rest = entries.slice(3)
    const podiumOrder = [top3[1], top3[0], top3[2]]
    const podiumHeights = [104, 134, 84]
    const podiumLabels = ['2nd', '1st', '3rd']
    const podiumMedals = [MEDAL_COLORS[1], MEDAL_COLORS[0], MEDAL_COLORS[2]]

    if (entries.length === 0) return emptyState

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

        {renderStickyYou()}
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
              {/* Forest / List toggle */}
              <div className="flex items-center rounded-full shrink-0" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(120,90,40,0.07)', padding: 2 }}>
                {([['forest', 'Forest'], ['list', 'List']] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setBoardView(v)}
                    className="rounded-full transition-colors"
                    style={{
                      fontFamily: font, fontSize: 10.5, padding: '3px 11px',
                      background: boardView === v ? accent : 'transparent',
                      color: boardView === v ? '#fff' : textMuted,
                      fontWeight: boardView === v ? 600 : 400,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="text-[12px]" style={{ color: textMuted, fontFamily: font }}>Loading…</div>
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
