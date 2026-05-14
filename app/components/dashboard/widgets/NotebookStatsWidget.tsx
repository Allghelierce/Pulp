"use client"
import { memo, useMemo } from "react"
import { registerWidget, type WidgetProps } from "../widgetRegistry"

const font = '"EB Garamond", serif'

const NotebookStatsWidget = memo(function NotebookStatsWidget({ isDark, grove, activeNotebookId, activeNotebookName }: WidgetProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'

  const notebookTrees = useMemo(() => activeNotebookId ? grove.filter(t => t.notebookId === activeNotebookId) : [], [grove, activeNotebookId])
  const species = useMemo(() => new Set(notebookTrees.map(t => t.type)).size, [notebookTrees])

  if (!activeNotebookId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 16 }}>
        <span style={{ fontSize: 10, color: textMuted, fontStyle: 'italic' }}>No notebook selected</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: 16, gap: 6 }}>
      <span style={{ fontSize: 8, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {activeNotebookName || 'Notebook'}
      </span>
      <div style={{ display: 'flex', gap: 20, alignItems: 'baseline' }}>
        <div>
          <span style={{ fontSize: 24, fontWeight: 700, color: textPrimary, fontFamily: font, lineHeight: 1 }}>{notebookTrees.length}</span>
          <span style={{ fontSize: 10, color: textSecondary, marginLeft: 4 }}>trees</span>
        </div>
        <div>
          <span style={{ fontSize: 24, fontWeight: 700, color: textPrimary, fontFamily: font, lineHeight: 1 }}>{species}</span>
          <span style={{ fontSize: 10, color: textSecondary, marginLeft: 4 }}>species</span>
        </div>
      </div>
    </div>
  )
})

registerWidget({
  id: 'notebook-stats',
  name: 'Notebook Stats',
  description: 'Trees and species for the active notebook',
  category: 'analysis',
  defaultSize: [2, 1],
  minSize: [1, 1],
  maxSize: [3, 1],
  component: NotebookStatsWidget,
})
