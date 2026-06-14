// Shared UI palette — one source of truth for panel/view colors.
// Accent is #d97706 (Pulp amber). Dark theme uses neutral zinc; borders are neutral.
// Views (Stats, Boutique, Leaderboard, Settings) should read from getPalette()
// instead of hardcoding hexes, so colors stay coherent across the app.

export const ACCENT = '#d97706'

export interface Palette {
  bg: string
  cardBg: string
  cardBorder: string
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

export function getType(p: Palette) {
  return {
    // Big title at the top of a tab (Market, Leaderboard, etc.)
    viewTitle: {
      fontFamily: FONT_SERIF,
      fontSize: 26,
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
