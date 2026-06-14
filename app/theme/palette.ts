// Shared UI palette — one source of truth for panel/view colors.
// Accent is #d97706 (Pulp amber). Dark theme uses neutral zinc; borders are neutral.
// Views (Stats, Boutique, Leaderboard, Settings) should read from getPalette()
// instead of hardcoding hexes, so colors stay coherent across the app.

export const ACCENT = '#d97706'

export interface Palette {
  bg: string
  cardBg: string
  cardBorder: string
  chipBg: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  accent: string
  accentDeep: string
}

const DARK: Palette = {
  bg: '#09090b',
  cardBg: 'rgba(24,24,27,0.5)',
  cardBorder: 'rgba(255,255,255,0.06)',
  chipBg: 'rgba(255,255,255,0.04)',
  textPrimary: '#dcd8d0',
  textSecondary: '#8a8680',
  textMuted: '#5a5650',
  accent: ACCENT,
  accentDeep: '#e0922f',
}

const LIGHT: Palette = {
  bg: '#f5f3ef',
  cardBg: '#ffffff',
  cardBorder: 'rgba(0,0,0,0.07)',
  chipBg: 'rgba(0,0,0,0.04)',
  textPrimary: '#2a2620',
  textSecondary: '#7a7670',
  textMuted: '#a8a4a0',
  accent: ACCENT,
  accentDeep: '#b45309',
}

export function getPalette(isDark: boolean): Palette {
  return isDark ? DARK : LIGHT
}

// Shared panel-shell shadow (neutral). Use for full-screen modal panels.
export const PANEL_SHADOW = '0 32px 80px -12px rgba(0,0,0,0.5)'

// Typography — one source of truth for heading levels across the panel views.
// Spread these into inline style props, e.g. style={{ ...type.viewTitle }}.
export const FONT_SERIF = 'Crimson Pro, serif'

// Chip button — the subtle bordered button style from the Market (Catalog/Satchel).
// active=true fills with the amber accent (use for the selected item in a toggle group).
export function chipButton(p: Palette, active = false) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 14px',
    borderRadius: 5,
    fontFamily: FONT_SERIF,
    fontSize: 10,
    fontWeight: 400 as const,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    backgroundColor: active ? p.accent : p.chipBg,
    border: `1px solid ${active ? p.accent : p.cardBorder}`,
    color: active ? '#fff' : p.textPrimary,
  }
}

export function getType(p: Palette) {
  return {
    // Big title at the top of a tab (Market, Leaderboard, etc.)
    viewTitle: {
      fontFamily: FONT_SERIF,
      fontSize: 32,
      fontWeight: 400,
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      color: p.textPrimary,
    },
    // Sub-heading within a tab (group/section labels)
    sectionHeader: {
      fontFamily: FONT_SERIF,
      fontSize: 10,
      fontWeight: 400,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      color: p.textMuted,
    },
    // Small uppercase eyebrow / micro-label
    eyebrow: {
      fontFamily: FONT_SERIF,
      fontSize: 8,
      fontWeight: 400,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      color: p.textMuted,
    },
  }
}
