// Shared sky/terrain palette — mirrors OrchardView so other views (leaderboard) can match the orchard exactly.

export interface SkyPalette {
  skyTop: string; skyMid: string; skyLow: string; skyHorizon: string; skyField: string; skyBottom: string
  oceanTop: string; oceanMid: string; oceanBot: string
  mtnTop: string; mtnMid: string; mtnBot: string
  snowTop: string; snowFade: string
  hillMidTop: string; hillMidBot: string
  hillNearTop: string; hillNearBot: string
  fieldTop: string; fieldMid1: string; fieldMid2: string; fieldBot: string
  sunGlow: number; sunColor: string; sunY: number
  moonGlow: number; moonY: number
  starOpacity: number
  mtnLightOpacity: number; mtnLightColor: string
  groveOpacity: number
  ambientOverlay: string; ambientOpacity: number
}

export const PALETTES: Record<string, SkyPalette> = {
  night: {
    skyTop: '#0a0a0c', skyMid: '#0a0a0c', skyLow: '#0c0b0a', skyHorizon: '#0c0b0a', skyField: '#0c0b0a', skyBottom: '#0c0b0a',
    oceanTop: '#0c0a08', oceanMid: '#0a0806', oceanBot: '#0e0c08',
    mtnTop: '#12100c', mtnMid: '#0e0c0a', mtnBot: '#0c0a08',
    snowTop: '#2a2820', snowFade: '#12100c',
    hillMidTop: '#121808', hillMidBot: '#0e1406',
    hillNearTop: '#161e08', hillNearBot: '#121806',
    fieldTop: '#161e08', fieldMid1: '#141a06', fieldMid2: '#121806', fieldBot: '#0e1404',
    sunGlow: 0, sunColor: '#000000', sunY: 32,
    moonGlow: 0.25, moonY: 4,
    starOpacity: 1,
    mtnLightOpacity: 0, mtnLightColor: 'rgba(0,0,0,0)',
    groveOpacity: 0.8,
    ambientOverlay: 'rgba(16,8,22,0.2)', ambientOpacity: 0.2,
  },
  dawn: {
    skyTop: '#1a1208', skyMid: '#2a1c0c', skyLow: '#4a2c10', skyHorizon: '#8a4820', skyField: '#2a2010', skyBottom: '#1a1608',
    oceanTop: '#3a2818', oceanMid: '#2a1c10', oceanBot: '#3a2a18',
    mtnTop: '#1a1610', mtnMid: '#14120c', mtnBot: '#100e0a',
    snowTop: '#3a3020', snowFade: '#1a1610',
    hillMidTop: '#182012', hillMidBot: '#141a0e',
    hillNearTop: '#1e2814', hillNearBot: '#1a2210',
    fieldTop: '#1e2c12', fieldMid1: '#1c2810', fieldMid2: '#1e2810', fieldBot: '#1a220c',
    sunGlow: 0.5, sunColor: '#d97706', sunY: 18,
    moonGlow: 0.15, moonY: 30,
    starOpacity: 0.15,
    mtnLightOpacity: 0.08, mtnLightColor: 'rgba(217,119,6,0.08)',
    groveOpacity: 0.85,
    ambientOverlay: 'rgba(40,20,8,0.15)', ambientOpacity: 0.15,
  },
  morning: {
    skyTop: '#8a6838', skyMid: '#a07840', skyLow: '#b89050', skyHorizon: '#b8a868', skyField: '#9aaa80', skyBottom: '#8a9a78',
    oceanTop: '#8a8860', oceanMid: '#7a7a50', oceanBot: '#9a9068',
    mtnTop: '#5a6260', mtnMid: '#4e5854', mtnBot: '#44504a',
    snowTop: '#c8c8c0', snowFade: '#8a8e88',
    hillMidTop: '#446a34', hillMidBot: '#3a5e2c',
    hillNearTop: '#4e7040', hillNearBot: '#426434',
    fieldTop: '#4e6e38', fieldMid1: '#486834', fieldMid2: '#446430', fieldBot: '#3e5e2c',
    sunGlow: 0.6, sunColor: '#d97706', sunY: 6,
    moonGlow: 0, moonY: 32,
    starOpacity: 0,
    mtnLightOpacity: 0.12, mtnLightColor: 'rgba(255,200,100,0.12)',
    groveOpacity: 0.92,
    ambientOverlay: 'rgba(0,0,0,0)', ambientOpacity: 0,
  },
  day: {
    skyTop: '#87aacc', skyMid: '#9dbdcc', skyLow: '#b8ccbb', skyHorizon: '#c8d8b8', skyField: '#d4debb', skyBottom: '#dae4c0',
    oceanTop: '#6a9aaa', oceanMid: '#5a8a9a', oceanBot: '#7aaab0',
    mtnTop: '#5a6858', mtnMid: '#4a5848', mtnBot: '#3a4838',
    snowTop: '#e8e8e0', snowFade: '#a0a898',
    hillMidTop: '#4a6a3a', hillMidBot: '#3e5e30',
    hillNearTop: '#507840', hillNearBot: '#446a34',
    fieldTop: '#5a7a48', fieldMid1: '#527242', fieldMid2: '#4e6e3e', fieldBot: '#4a6838',
    sunGlow: 0.2, sunColor: '#b09048', sunY: 3,
    moonGlow: 0, moonY: 32,
    starOpacity: 0,
    mtnLightOpacity: 0.05, mtnLightColor: 'rgba(255,240,180,0.05)',
    groveOpacity: 0.95,
    ambientOverlay: 'rgba(0,0,0,0)', ambientOpacity: 0,
  },
  dusk: {
    skyTop: '#1e1018', skyMid: '#281614', skyLow: '#321e0e', skyHorizon: '#2e1a08', skyField: '#18140c', skyBottom: '#141008',
    oceanTop: '#1e1608', oceanMid: '#1a1206', oceanBot: '#221a0a',
    mtnTop: '#1e1810', mtnMid: '#18140c', mtnBot: '#14100a',
    snowTop: '#3e3628', snowFade: '#1e1810',
    hillMidTop: '#1c2612', hillMidBot: '#18200e',
    hillNearTop: '#223014', hillNearBot: '#1e2810',
    fieldTop: '#263414', fieldMid1: '#222e12', fieldMid2: '#243012', fieldBot: '#202a0e',
    sunGlow: 1, sunColor: '#d97706', sunY: 20,
    moonGlow: 0.15, moonY: 28,
    starOpacity: 0.1,
    mtnLightOpacity: 0.15, mtnLightColor: 'rgba(255,180,80,0.15)',
    groveOpacity: 0.85,
    ambientOverlay: 'rgba(20,10,5,0.1)', ambientOpacity: 0.1,
  },
}

export function getTimePhase(hourOverride?: number): { phase: string; t: number; hour: number } {
  const hour = hourOverride ?? (new Date().getHours() + new Date().getMinutes() / 60)
  if (hour < 4) return { phase: 'night', t: 0, hour }
  if (hour < 6) return { phase: 'night', t: (hour - 4) / 2, hour }
  if (hour < 8) return { phase: 'dawn', t: (hour - 6) / 2, hour }
  if (hour < 10) return { phase: 'morning', t: (hour - 8) / 2, hour }
  if (hour < 16) return { phase: 'day', t: 0, hour }
  if (hour < 18) return { phase: 'day', t: (hour - 16) / 2, hour }
  if (hour < 20) return { phase: 'dusk', t: (hour - 18) / 2, hour }
  return { phase: 'night', t: 0, hour }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}
function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function interpolatePalette(phase: string, t: number): SkyPalette {
  const transitions: Record<string, string> = { night: 'dawn', dawn: 'morning', morning: 'day', day: 'dusk', dusk: 'night' }
  const from = PALETTES[phase] || PALETTES.day
  const nextPhase = transitions[phase] || 'day'
  const to = PALETTES[nextPhase] || PALETTES.day
  const result: any = {}
  for (const key of Object.keys(from) as (keyof SkyPalette)[]) {
    const a = from[key]
    const b = to[key]
    if (typeof a === 'string' && typeof b === 'string') {
      if (a.startsWith('#') && b.startsWith('#')) result[key] = lerpColor(a, b, t)
      else result[key] = t < 0.5 ? a : b
    } else if (typeof a === 'number' && typeof b === 'number') {
      result[key] = lerpNum(a, b, t)
    } else {
      result[key] = a
    }
  }
  return result as SkyPalette
}

// Theme-mode palette the orchard uses when not in realtime mode.
export function themePalette(isDark: boolean): SkyPalette {
  return isDark ? interpolatePalette('night', 0) : interpolatePalette('day', 0.5)
}
