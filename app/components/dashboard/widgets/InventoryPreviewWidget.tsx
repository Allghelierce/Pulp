"use client"
import { memo, useMemo } from "react"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "../../PlantIcon"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = 'Crimson Pro, serif'

const InventoryPreviewWidget = memo(function InventoryPreviewWidget({ isDark, inventory }: WidgetProps) {
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'

  const seeds = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of inventory) counts[s] = (counts[s] ?? 0) + 1
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count, name: TREE_TYPES[type]?.name ?? type }))
      .sort((a, b) => b.count - a.count)
  }, [inventory])

  if (seeds.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span style={{ fontSize: 10, color: textMuted, fontStyle: 'italic' }}>No seeds</span>
      </div>
    )
  }

  return (
    <div style={{ padding: 14, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <span style={{ fontSize: 10, fontWeight: 400, color: isDark ? '#5a5650' : '#a8a4a0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: font, marginBottom: 8 }}>
        Seeds
      </span>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'start' }}>
        {seeds.map(({ type, count, name }) => (
          <div key={type} title={name} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: 42, gap: 2,
          }}>
            <PlantIcon type={type} size={24} stage={0} hideGround disableSway />
            <span style={{ fontSize: 7, fontWeight: 400, color: textSecondary, textAlign: 'center' }}>
              {count > 1 ? `${name} ×${count}` : name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})

registerWidget({
  id: 'inventory-preview',
  name: 'Seeds',
  description: 'Seeds you own',
  category: 'grove',
  defaultSize: [2, 1],
  minSize: [1, 1],
  maxSize: [3, 2],
  component: InventoryPreviewWidget,
})
