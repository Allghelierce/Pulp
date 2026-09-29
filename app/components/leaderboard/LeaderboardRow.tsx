"use client"
import { memo } from "react"

const font = 'Crimson Pro, serif'
function formatPulp(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export interface RowEntry {
  id: string
  name: string
  avatarColor: string
  pulpDelta: number
  totalPulp: number
  isYou?: boolean
  rankChange?: number
}

export const LeaderboardRow = memo(function LeaderboardRow({
  rank, entry, metric, accent, textPrimary, textMuted, onClick,
}: {
  rank: number
  entry: RowEntry
  metric: "delta" | "total"
  accent: string
  textPrimary: string
  textMuted: string
  onClick?: () => void
}) {
  const value = metric === "delta" ? entry.pulpDelta : entry.totalPulp
  const change = entry.rankChange
  const changeGlyph = change == null ? "•" : change > 0 ? "▲" : change < 0 ? "▼" : "•"
  const changeColor = change == null || change === 0 ? textMuted : change > 0 ? "#5faf4e" : "#c0563f"
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
      style={{
        fontFamily: font,
        background: entry.isYou ? `${accent}1f` : 'transparent',
        border: entry.isYou ? `1px solid ${accent}55` : '1px solid transparent',
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
      }}
    >
      <span style={{ width: 22, textAlign: 'right', color: textMuted, fontSize: 13 }}>{rank}</span>
      <span style={{ width: 14, color: changeColor, fontSize: 10 }}>{changeGlyph}</span>
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: entry.avatarColor, flexShrink: 0 }} />
      <span style={{ flex: 1, color: textPrimary, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.name}{entry.isYou ? ' (you)' : ''}
      </span>
      <span style={{ color: accent, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{formatPulp(value)}</span>
    </button>
  )
})
