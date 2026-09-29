"use client"
import { memo } from "react"
const font = 'Crimson Pro, serif'

export const ContestBanner = memo(function ContestBanner({
  prizeSap, daysLeft, accent, isDark,
}: { prizeSap: number; daysLeft: number; accent: string; isDark: boolean }) {
  const resetLabel = daysLeft <= 0 ? 'Resets today' : `Resets in ${daysLeft}d`
  return (
    <div
      title="Awarded at reset (coming soon)"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', margin: '0 8px 10px',
        borderRadius: 12, fontFamily: font,
        background: isDark ? `${accent}14` : `${accent}12`,
        border: `1px solid ${accent}44`,
      }}
    >
      <span style={{ fontSize: 20 }}>🏆</span>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span style={{ fontSize: 12, color: isDark ? '#b8b0a4' : '#6a6258' }}>This week&apos;s prize</span>
        <span style={{ fontSize: 15, color: accent }}>{prizeSap} sap</span>
      </div>
      <span style={{ marginLeft: 'auto', fontSize: 12.5, color: isDark ? '#b8b0a4' : '#6a6258' }}>{resetLabel}</span>
    </div>
  )
})
