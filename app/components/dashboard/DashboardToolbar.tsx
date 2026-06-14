"use client"
import { memo } from "react"

const font = 'Crimson Pro, serif'

interface DashboardToolbarProps {
  isDark: boolean
  editMode: boolean
  onClose: () => void
  onToggleEdit: () => void
  onOpenLibrary: () => void
  onResetLayout?: () => void
}

export const DashboardToolbar = memo(function DashboardToolbar({
  isDark, editMode, onClose, onToggleEdit, onOpenLibrary, onResetLayout,
}: DashboardToolbarProps) {
  const textMuted = isDark ? '#8a8680' : '#7a7670'
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const btnBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const btnHover = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const dividerC = isDark ? '#dcd8d0' : '#2a2620'

  return (
    <div style={{ position: 'relative', padding: '16px 24px 8px', flexShrink: 0 }}>
      {/* Centered title + ornamental divider — matches the market */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <span style={{ fontFamily: font, fontSize: 26, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: textPrimary }}>
          Stats
        </span>
        <svg width="220" height="12" viewBox="0 0 220 12" style={{ marginTop: 10, opacity: isDark ? 0.4 : 0.3 }}>
          <line x1="0" y1="6" x2="95" y2="6" stroke={dividerC} strokeWidth="0.5" />
          <polygon points="110,2 114,6 110,10 106,6" fill={isDark ? '#e8e4dc' : '#4a4640'} opacity="0.6" />
          <line x1="125" y1="6" x2="220" y2="6" stroke={dividerC} strokeWidth="0.5" />
        </svg>
      </div>

      <div style={{ position: 'absolute', top: 16, right: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onOpenLibrary}
          style={{
            height: 30, borderRadius: 10, padding: '0 12px',
            background: btnBg, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            color: textMuted, fontSize: 11, fontWeight: 400, fontFamily: font,
            transition: 'background 150ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = btnHover)}
          onMouseLeave={e => (e.currentTarget.style.background = btnBg)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add
        </button>
        {editMode && onResetLayout && (
          <button
            onClick={onResetLayout}
            style={{
              height: 30, borderRadius: 10, padding: '0 12px',
              background: btnBg, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: textMuted, fontSize: 11, fontWeight: 400, fontFamily: font,
              transition: 'background 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = btnHover)}
            onMouseLeave={e => (e.currentTarget.style.background = btnBg)}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reset
          </button>
        )}
        <button
          onClick={onToggleEdit}
          style={{
            height: 30, borderRadius: 10, padding: '0 12px',
            background: editMode ? (isDark ? 'rgba(217,119,6,0.2)' : 'rgba(217,119,6,0.12)') : btnBg,
            border: editMode ? '1px solid rgba(217,119,6,0.3)' : '1px solid transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            color: editMode ? '#d97706' : textMuted,
            fontSize: 11, fontWeight: 400, fontFamily: font,
            transition: 'all 150ms',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>
    </div>
  )
})
