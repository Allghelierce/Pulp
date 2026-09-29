"use client"
import { memo, useState } from "react"

interface WidgetWrapperProps {
  isDark: boolean
  pinned: boolean
  editMode: boolean
  instanceId: string
  onPin: () => void
  onRemove: () => void
  onDragStart: (instanceId: string, e: React.PointerEvent) => void
  transparent?: boolean
  children: React.ReactNode
}

const font = 'Crimson Pro, serif'

export const WidgetWrapper = memo(function WidgetWrapper({
  isDark, pinned, editMode, instanceId, onPin, onRemove, onDragStart, transparent, children,
}: WidgetWrapperProps) {
  const cardBg = isDark ? '#201d18' : '#ffffff'
  // Cards previously sat too close to the page bg with no edge, so they blended in.
  // A lighter surface + a defined border gives each widget a clear boundary.
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.08)'
  const shadow = isDark
    ? '0 4px 20px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)'
    : '0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)'
  const hoverShadow = isDark
    ? '0 8px 30px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.5)'
    : '0 4px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)'

  const [hover, setHover] = useState(false)

  return (
    <div
      style={{
        background: transparent ? 'transparent' : cardBg,
        border: transparent ? 'none' : cardBorder,
        borderRadius: 20,
        boxShadow: transparent ? 'none' : (hover ? hoverShadow : shadow),
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%',
        cursor: editMode ? 'grab' : 'default',
        transition: 'box-shadow 200ms ease',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPointerDown={editMode ? (e) => onDragStart(instanceId, e) : undefined}
    >
      {children}

      {editMode && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          display: 'flex', gap: 4,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            title="Remove"
            style={{
              width: 22, height: 22, borderRadius: 6,
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isDark ? '#8a8680' : '#a8a4a0',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
})
