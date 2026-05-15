"use client"
import { memo, useMemo } from "react"
import { TREE_TYPES } from "@/app/constants"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = 'Crimson Pro, serif'

const FocusDistributionWidget = memo(function FocusDistributionWidget({ isDark, grove, notes }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'

  const distribution = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of grove) {
      const nbId = t.notebookId ?? '_none'
      counts[nbId] = (counts[nbId] ?? 0) + 1
    }
    const noteMap = new Map(notes.map(n => [n.id, n.subject || 'Untitled']))
    return Object.entries(counts)
      .map(([id, count]) => ({ name: id === '_none' ? 'Unassigned' : (noteMap.get(id) ?? 'Unknown'), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [grove, notes])

  const max = distribution[0]?.count ?? 1
  const colors = ['#ea580c', '#d97706', '#f59e0b', '#34d399', '#60a5fa', '#a855f7']

  return (
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 400, color: isDark ? '#5a5650' : '#a8a4a0', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: font }}>
        Focus by Notebook
      </span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
        {distribution.map((item, i) => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 8, fontWeight: 400, color: textMuted,
              width: 60, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{item.name}</span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
              <div style={{
                width: `${(item.count / max) * 100}%`, height: '100%', borderRadius: 3,
                background: colors[i % colors.length], transition: 'width 500ms ease',
              }} />
            </div>
            <span style={{ fontSize: 8, fontWeight: 400, color: textMuted, width: 16, textAlign: 'right' }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

registerWidget({
  id: 'focus-distribution',
  name: 'Focus Distribution',
  description: 'Trees grown per notebook',
  category: 'analysis',
  defaultSize: [2, 2],
  minSize: [2, 1],
  maxSize: [3, 2],
  component: FocusDistributionWidget,
})
