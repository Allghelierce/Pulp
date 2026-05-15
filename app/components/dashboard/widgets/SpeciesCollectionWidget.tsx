"use client"
import { memo, useMemo } from "react"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "../../PlantIcon"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = 'Crimson Pro, serif'

const LockedPlaceholder = memo(function LockedPlaceholder({ isDark }: { isDark: boolean }) {
  return (
    <svg width={38} height={38} viewBox="0 0 38 38">
      <circle cx={19} cy={22} r={10} fill={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'} />
      <text x={19} y={23} textAnchor="middle" dominantBaseline="central"
        fill={isDark ? '#3a3630' : '#c8c4c0'} fontSize={12} fontWeight={700}>?</text>
    </svg>
  )
})

const SpeciesCollectionWidget = memo(function SpeciesCollectionWidget({ isDark, grove }: WidgetProps) {
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'

  const owned = useMemo(() => new Set(grove.map(t => t.type)), [grove])
  const allTypes = useMemo(() => Object.entries(TREE_TYPES), [])
  const total = allTypes.length
  const collected = owned.has('tangerine') ? owned.size : owned.size + 1
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0

  return (
    <div style={{ padding: 14, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 400, color: isDark ? '#5a5650' : '#a8a4a0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: font }}>
          Collection
        </span>
        <span style={{ fontSize: 10, fontWeight: 400, color: '#d97706', fontFamily: font }}>
          {collected}/{total} ({pct}%)
        </span>
      </div>
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
        gap: 6, alignContent: 'start',
      }}>
        {allTypes.map(([key, tree]) => {
          const has = owned.has(key) || key === 'tangerine'
          return (
            <div
              key={key}
              title={has ? tree.name : '???'}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '4px 2px', borderRadius: 8,
                opacity: has ? 1 : 0.55,
              }}
            >
              {has
                ? <PlantIcon type={key} size={38} stage={4} hideGround disableSway />
                : <LockedPlaceholder isDark={isDark} />
              }
              <span style={{
                fontSize: 6, fontWeight: 400, marginTop: 2,
                color: has ? textSecondary : textMuted,
                textAlign: 'center', lineHeight: 1.1,
                maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {has ? tree.name : '???'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})

registerWidget({
  id: 'species-collection',
  name: 'Species Collection',
  description: 'All tree species — collected vs locked',
  category: 'grove',
  defaultSize: [3, 2],
  minSize: [2, 2],
  maxSize: [6, 3],
  component: SpeciesCollectionWidget,
})
