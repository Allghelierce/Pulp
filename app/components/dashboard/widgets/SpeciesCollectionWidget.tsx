"use client"
import { memo, useMemo } from "react"
import { TIER_CONFIG, LEAGUE_TIERS } from "@/lib/leagues"
import type { LeagueTier } from "@/lib/leagues"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = '"EB Garamond", serif'

const TIER_ORDER: LeagueTier[] = [...LEAGUE_TIERS]

const LeaderboardWidget = memo(function LeaderboardWidget({ isDark, grove, sap = 0, xp = 0 }: WidgetProps) {
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const textPrimary = isDark ? '#c8c4c0' : '#3a3630'
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  const currentTier: LeagueTier = useMemo(() => {
    if (sap >= 2000) return 'diamond'
    if (sap >= 1000) return 'platinum'
    if (sap >= 400) return 'gold'
    if (sap >= 100) return 'silver'
    return 'bronze'
  }, [sap])

  const tierIdx = TIER_ORDER.indexOf(currentTier)
  const config = TIER_CONFIG[currentTier]
  const weeklySap = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return grove.filter(t => new Date(t.plantedAt).getTime() > weekAgo).length * 12
  }, [grove])

  const rank = useMemo(() => Math.max(1, 16 - Math.floor(weeklySap / 15)), [weeklySap])

  return (
    <div style={{ padding: 14, height: '100%', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: font }}>
          League
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: config.color, fontFamily: font }}>
          {config.name}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `linear-gradient(135deg, ${config.color}30 0%, ${config.color}10 100%)`,
          border: `2px solid ${config.color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, lineHeight: 1,
        }}>
          {config.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 400, color: textPrimary, fontFamily: font, lineHeight: 1 }}>
            #{rank}
          </div>
          <div style={{ fontSize: 8, color: textMuted, marginTop: 2 }}>Current Rank</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {TIER_ORDER.map((t, i) => {
          const tc = TIER_CONFIG[t]
          const active = i <= tierIdx
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: i < 4 ? 1 : undefined }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', fontSize: 7, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? `${tc.color}30` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                border: `1px solid ${active ? tc.color + '50' : 'transparent'}`,
                opacity: active ? 1 : 0.4,
              }}>
                {tc.icon}
              </div>
              {i < 4 && (
                <div style={{
                  flex: 1, height: 2, borderRadius: 1,
                  background: i < tierIdx
                    ? TIER_CONFIG[TIER_ORDER[i + 1]].color + '40'
                    : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flex: 1 }}>
        {[
          { label: 'Weekly Sap', value: `+${weeklySap}`, color: '#d97706' },
          { label: 'Trees This Week', value: String(grove.filter(t => new Date(t.plantedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length), color: '#22c55e' },
          { label: 'Best Rank', value: '#1', color: config.color },
          { label: 'Promotions', value: String(tierIdx), color: '#7cb3d4' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '6px 8px', borderRadius: 8,
            background: cardBg, border: `1px solid ${border}`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 400, color: s.color, fontFamily: font, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 7, color: textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
})

registerWidget({
  id: 'league-standing',
  name: 'League Standing',
  description: 'Your current league rank and stats',
  category: 'grove',
  defaultSize: [3, 2],
  minSize: [2, 2],
  maxSize: [4, 3],
  component: LeaderboardWidget,
})
