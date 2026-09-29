"use client"
import { memo } from "react"
import { CachedPlantIcon } from "../CachedPlantIcon"
const font = 'Crimson Pro, serif'

export const PastWinnersStrip = memo(function PastWinnersStrip({
  winners, isDark,
}: { winners: { name: string; species: string }[]; isDark: boolean }) {
  if (!winners.length) return null
  return (
    <div style={{ padding: '8px 12px', margin: '10px 8px 0', borderTop: `1px solid ${isDark ? '#ffffff14' : '#00000014'}` }}>
      <p style={{ fontFamily: font, fontSize: 12, color: isDark ? '#8a8278' : '#8a8278', margin: '0 0 6px' }}>Past champions</p>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto' }}>
        {winners.map((w, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <CachedPlantIcon type={w.species} size={40} stage={3} hideGround disableSway />
            <span style={{ fontFamily: font, fontSize: 11, color: isDark ? '#c8c0b4' : '#4a453e', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
})
