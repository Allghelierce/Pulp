"use client"
import { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getWidgetRegistry, type WidgetInstance } from "./widgetRegistry"

const font = '"EB Garamond", serif'

const categoryLabels: Record<string, string> = {
  progress: 'Progress',
  activity: 'Activity',
  grove: 'Grove',
  analysis: 'Analysis',
}

const categoryOrder = ['progress', 'activity', 'grove', 'analysis']

interface WidgetLibraryProps {
  isOpen: boolean
  isDark: boolean
  widgets: WidgetInstance[]
  onClose: () => void
  onAdd: (widgetId: string, defaultSize: [number, number]) => void
  onRemove: (instanceId: string) => void
}

export const WidgetLibrary = memo(function WidgetLibrary({
  isOpen, isDark, widgets, onClose, onAdd, onRemove,
}: WidgetLibraryProps) {
  const registry = getWidgetRegistry()
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const textMuted = isDark ? '#5a5650' : '#a8a4a0'
  const textSecondary = isDark ? '#8a8680' : '#7a7670'
  const panelBg = isDark ? '#0e0c09' : '#ede6d8'
  const cardBg = isDark ? '#141210' : '#f5f3ef'
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  const grouped = categoryOrder.map(cat => ({
    category: cat,
    label: categoryLabels[cat],
    items: registry.filter(w => w.category === cat),
  })).filter(g => g.items.length > 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 60 }}
          />
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0,
              width: 300, zIndex: 70,
              background: panelBg,
              borderLeft: `1px solid ${borderColor}`,
              overflowY: 'auto',
              padding: '20px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: textPrimary, fontFamily: font }}>Widget Library</span>
              <button
                onClick={onClose}
                style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: textMuted,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {grouped.map(group => (
              <div key={group.category} style={{ marginBottom: 20 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  display: 'block', marginBottom: 8,
                }}>
                  {group.label}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.items.map(def => {
                    const existing = widgets.find(w => w.widgetId === def.id)
                    return (
                      <div
                        key={def.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', borderRadius: 12,
                          background: cardBg,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, fontFamily: font }}>{def.name}</div>
                          <div style={{ fontSize: 9, color: textSecondary, marginTop: 1 }}>{def.description}</div>
                        </div>
                        {existing ? (
                          <button
                            onClick={() => onRemove(existing.instanceId)}
                            style={{
                              flexShrink: 0, marginLeft: 8,
                              fontSize: 9, fontWeight: 600, fontFamily: font,
                              color: isDark ? '#ef4444' : '#dc2626',
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '4px 8px', borderRadius: 6,
                            }}
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => onAdd(def.id, def.defaultSize)}
                            style={{
                              flexShrink: 0, marginLeft: 8,
                              fontSize: 9, fontWeight: 600, fontFamily: font,
                              color: '#d97706',
                              background: isDark ? 'rgba(217,119,6,0.12)' : 'rgba(217,119,6,0.1)',
                              border: 'none', cursor: 'pointer',
                              padding: '4px 10px', borderRadius: 6,
                            }}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
