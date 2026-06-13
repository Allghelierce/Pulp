"use client"
import { memo, useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = '"EB Garamond", serif'

function daysLeftInWeek(): number {
  const day = new Date().getDay()
  return day === 0 ? 0 : 7 - day
}

interface Standing {
  school: string
  members: { user_id: string }[]
  user_rank: number | null
  user_pulp: number
}

const StandingsWidget = memo(function StandingsWidget({ isDark, grove }: WidgetProps) {
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const textPrimary = isDark ? '#c8c4c0' : '#3a3630'
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const border = isDark ? 'rgba(217,160,90,0.1)' : 'rgba(120,90,40,0.1)'
  const accent = '#d97706'

  const [data, setData] = useState<Standing | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'nojoin' | 'off'>('loading')

  useEffect(() => {
    let alive = true
    apiFetch('/api/leaderboard')
      .then(async res => {
        if (!alive) return
        if (!res.ok) { setState('off'); return }
        const d = await res.json()
        if (d.needs_school) { setState('nojoin'); return }
        setData(d); setState('ok')
      })
      .catch(() => { if (alive) setState('off') })
    return () => { alive = false }
  }, [])

  const treesThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return grove.filter(t => new Date(t.plantedAt).getTime() > weekAgo).length
  }, [grove])

  const daysLeft = daysLeftInWeek()
  const rank = data?.user_rank ?? null

  return (
    <div style={{ padding: 14, height: '100%', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: font }}>
          Weekly Standings
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, color: accent, fontFamily: font, display: 'flex', alignItems: 'center', gap: 3 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {daysLeft === 0 ? 'last day' : `${daysLeft}d left`}
        </span>
      </div>

      {state === 'nojoin' || state === 'off' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          <div style={{ fontSize: 12, color: textPrimary, fontFamily: font }}>
            {state === 'off' ? 'Sign in to compete' : 'Join your school'}
          </div>
          <div style={{ fontSize: 9, color: textMuted, fontFamily: font }}>
            Rank against classmates by pulp each week.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: `linear-gradient(135deg, ${accent}30 0%, ${accent}10 100%)`,
              border: `2px solid ${accent}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 400, color: textPrimary, fontFamily: font, lineHeight: 1 }}>
                {rank ? `#${rank}` : '—'}
              </div>
              <div style={{ fontSize: 8, color: textMuted, marginTop: 2, fontFamily: font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {data?.school ? `at ${data.school}` : 'your rank'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flex: 1 }}>
            {[
              { label: 'Pulp This Week', value: `+${data?.user_pulp ?? 0}`, color: accent },
              { label: 'Trees This Week', value: String(treesThisWeek), color: '#22c55e' },
              { label: 'Students', value: String(data?.members.length ?? 0), color: '#7cb3d4' },
              { label: 'Days Left', value: String(daysLeft), color: textPrimary },
            ].map(s => (
              <div key={s.label} style={{ padding: '6px 8px', borderRadius: 8, background: cardBg, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 14, fontWeight: 400, color: s.color, fontFamily: font, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 7, color: textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
})

registerWidget({
  id: 'league-standing',
  name: 'Weekly Standings',
  description: 'Your rank among classmates by pulp this week',
  category: 'grove',
  defaultSize: [3, 2],
  minSize: [2, 2],
  maxSize: [4, 3],
  component: StandingsWidget,
})
