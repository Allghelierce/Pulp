"use client"
import { memo, useCallback, useRef } from "react"
import { motion } from "framer-motion"

interface WidgetWrapperProps {
  isDark: boolean
  pinned: boolean
  editMode: boolean
  instanceId: string
  onPin: () => void
  onRemove: () => void
  onDragStart: (instanceId: string, e: React.PointerEvent) => void
  children: React.ReactNode
}

const font = '"EB Garamond", serif'

export const WidgetWrapper = memo(function WidgetWrapper({
  isDark, pinned, editMode, instanceId, onPin, onRemove, onDragStart, children,
}: WidgetWrapperProps) {
  const cardBg = isDark ? '#141210' : '#f5f3ef'
  const shadow = isDark
    ? '0 2px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)'
    : '0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)'
  const hoverShadow = isDark
    ? '0 4px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)'
    : '0 4px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)'

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        background: cardBg,
        borderRadius: 20,
        boxShadow: shadow,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%',
        cursor: editMode ? 'grab' : 'default',
      }}
      whileHover={{ boxShadow: hoverShadow }}
      onPointerDown={editMode ? (e) => onDragStart(instanceId, e) : undefined}
    >
      {children}

      {/* Controls — visible on hover or edit mode */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        display: 'flex', gap: 4,
        opacity: editMode ? 1 : 0,
        transition: 'opacity 150ms',
        pointerEvents: editMode ? 'auto' : 'none',
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); onPin() }}
          title={pinned ? 'Unpin' : 'Pin'}
          style={{
            width: 22, height: 22, borderRadius: 6,
            background: pinned ? (isDark ? 'rgba(217,119,6,0.25)' : 'rgba(217,119,6,0.15)') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: pinned ? '#d97706' : (isDark ? '#8a8680' : '#a8a4a0'),
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 17v5M9 2h6l-1 7h4l-6 8h-4l1-7H5l4-8z" />
          </svg>
        </button>
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
    </motion.div>
  )
})
