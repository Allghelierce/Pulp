"use client"
import { memo } from "react"
import { getPalette, chipButton } from "@/app/theme/palette"

const font = 'Crimson Pro, serif'

interface DashboardToolbarProps {
  isDark: boolean
  /** A rotating real-world comparison shown under the title. */
  quip?: string | null
  editMode: boolean
  onClose: () => void
  onToggleEdit: () => void
  onOpenLibrary: () => void
  onResetLayout?: () => void
}

export const DashboardToolbar = memo(function DashboardToolbar({
  isDark, quip, editMode, onClose, onToggleEdit, onOpenLibrary, onResetLayout,
}: DashboardToolbarProps) {
  const textPrimary = isDark ? '#dcd8d0' : '#2a2620'
  const dividerC = isDark ? '#dcd8d0' : '#2a2620'
  const palette = getPalette(isDark)
  const chip = chipButton(palette)

  return (
    <div style={{ position: 'relative', padding: '16px 24px 8px', flexShrink: 0 }}>
      {/* Centered title + ornamental divider — matches the market */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <span style={{ fontFamily: font, fontSize: 32, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: textPrimary }}>
          Stats
        </span>
        <svg width="220" height="12" viewBox="0 0 220 12" style={{ marginTop: 10, opacity: isDark ? 0.4 : 0.3 }}>
          <line x1="0" y1="6" x2="95" y2="6" stroke={dividerC} strokeWidth="0.5" />
          <polygon points="110,2 114,6 110,10 106,6" fill={isDark ? '#e8e4dc' : '#4a4640'} opacity="0.6" />
          <line x1="125" y1="6" x2="220" y2="6" stroke={dividerC} strokeWidth="0.5" />
        </svg>
        {/* Height reserved so the grid doesn't jump when the line arrives. */}
        <div style={{ minHeight: 20, marginTop: 6, maxWidth: 'min(560px, 100%)', textAlign: 'center' }}>
          {quip && (
            <span key={quip} className="lively-anim" style={{ display: 'inline-block', fontFamily: font, fontStyle: 'italic', fontSize: 14,
              color: isDark ? '#8a8680' : '#7a7670', animation: 'livelyFadeUp .6s ease-out .3s both' }}>
              {quip}
            </span>
          )}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 16, right: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onOpenLibrary} style={chip}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add
        </button>
        {editMode && onResetLayout && (
          <button onClick={onResetLayout} style={chip}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reset
          </button>
        )}
        <button onClick={onToggleEdit} style={chipButton(palette, editMode)}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>
    </div>
  )
})
