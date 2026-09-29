"use client"
import { memo } from "react"
import { motion } from "framer-motion"
import { CachedPlantIcon } from "../CachedPlantIcon"
import type { RowEntry } from "./LeaderboardRow"

const font = 'Crimson Pro, serif'
const MEDAL_COLORS = ['#d97706', '#9a9590', '#a07050']
const FOREST_SPECIES = ['oak', 'pine', 'sakura', 'tangerine', 'plum', 'bamboo', 'cedarwood', 'birch', 'bonsai', 'pear']

function speciesFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return FOREST_SPECIES[h % FOREST_SPECIES.length]
}
function formatPulp(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function Slot({ entry, place, metric, isDark }: {
  entry: RowEntry | undefined; place: 0 | 1 | 2; metric: "delta" | "total"; isDark: boolean
}) {
  if (!entry) return <div style={{ flex: place === 0 ? 1.2 : 1 }} />
  const size = place === 0 ? 96 : 72
  const value = metric === "delta" ? entry.pulpDelta : entry.totalPulp
  const medal = MEDAL_COLORS[place]
  return (
    <motion.div
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.08 * place, type: "spring", stiffness: 220, damping: 22 }}
      style={{ flex: place === 0 ? 1.2 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
    >
      <div style={{ height: place === 0 ? 128 : 100, display: 'flex', alignItems: 'flex-end' }}>
        <CachedPlantIcon type={speciesFor(entry.name)} size={size} stage={3} hideGround disableSway />
      </div>
      <div style={{ position: 'relative', width: 30, height: 30 }}>
        <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: medal, opacity: 0.4, filter: 'blur(6px)' }} />
        <div style={{ position: 'relative', width: 30, height: 30, borderRadius: '50%', background: entry.avatarColor, border: `2px solid ${medal}` }} />
      </div>
      <span style={{ fontFamily: font, fontSize: 13, color: isDark ? '#e8e0d4' : '#2a2620', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.name}{entry.isYou ? ' (you)' : ''}
      </span>
      <span style={{ fontFamily: font, fontSize: 13, color: medal, fontVariantNumeric: 'tabular-nums' }}>{formatPulp(value)}</span>
    </motion.div>
  )
}

export const Podium = memo(function Podium({ entries, metric, isDark }: {
  entries: RowEntry[]; metric: "delta" | "total"; isDark: boolean
}) {
  const [first, second, third] = entries
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, padding: '4px 8px 12px' }}>
      <Slot entry={second} place={1} metric={metric} isDark={isDark} />
      <Slot entry={first} place={0} metric={metric} isDark={isDark} />
      <Slot entry={third} place={2} metric={metric} isDark={isDark} />
    </div>
  )
})
