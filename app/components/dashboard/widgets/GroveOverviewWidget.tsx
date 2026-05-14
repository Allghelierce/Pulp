"use client"
import { memo, useMemo } from "react"
import { TREE_TYPES } from "@/app/constants"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = '"EB Garamond", serif'

const rarityColors: Record<string, string> = {
  common: '#a1a1aa',
  uncommon: '#34d399',
  rare: '#60a5fa',
  'true rare': '#a855f7',
  sacred: '#ffd700',
  premium: '#f472b6',
  extinct: '#ef4444',
  chroma: '#e879f9',
}

const GroveOverviewWidget = memo(function GroveOverviewWidget({ isDark, grove }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'

  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of grove) {
      const rarity = TREE_TYPES[t.type]?.rarity ?? 'common'
      counts[rarity] = (counts[rarity] ?? 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [grove])

  const total = grove.length

  return (
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: textPrimary, fontFamily: font, lineHeight: 1 }}>{total}</span>
        <span style={{ fontSize: 10, color: textMuted }}>total trees</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {breakdown.map(([rarity, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={rarity} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: rarityColors[rarity] ?? textMuted, textTransform: 'capitalize', width: 55, flexShrink: 0 }}>
                {rarity}
              </span>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: rarityColors[rarity] ?? textMuted, transition: 'width 500ms ease' }} />
              </div>
              <span style={{ fontSize: 8, fontWeight: 600, color: textMuted, width: 20, textAlign: 'right' }}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
})

registerWidget({
  id: 'grove-overview',
  name: 'Grove Overview',
  description: 'Total trees with rarity breakdown',
  category: 'grove',
  defaultSize: [2, 1],
  minSize: [2, 1],
  maxSize: [3, 2],
  component: GroveOverviewWidget,
})
