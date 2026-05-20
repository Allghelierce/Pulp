"use client"
import { memo, useMemo } from "react"
import { TREE_TYPES } from "@/app/constants"

const darkenCache = new Map<string, string>()
function darken(hex: string, amount: number) {
  const key = hex + '|' + amount
  let cached = darkenCache.get(key)
  if (cached) return cached
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount)
  cached = `rgb(${r},${g},${b})`
  darkenCache.set(key, cached)
  return cached
}

const lightenCache = new Map<string, string>()
function lighten(hex: string, amount: number) {
  const key = hex + '|' + amount
  let cached = lightenCache.get(key)
  if (cached) return cached
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount)
  cached = `rgb(${r},${g},${b})`
  lightenCache.set(key, cached)
  return cached
}

export const ANIMATED_SHAPES = new Set([
  'sakura', 'mangrove', 'winterveil', 'starweaver', 'leviathan',
  'prismatic', 'whirlpool', 'bloom', 'coral', 'void', 'snowbell', 'wisteria',
])

export const PlantIcon = memo(function PlantIcon({ type, size = 40, stage = 0, isSeed = false, hideGround = false, dirtSeed = 0, dirtDark = false, dirtDepth = 0.5, dirtTilt, disableSway = false }: { type: string, size?: number, stage?: number, isSeed?: boolean, hideGround?: boolean, dirtSeed?: number, dirtDark?: boolean, dirtDepth?: number, dirtTilt?: number, disableSway?: boolean }) {
  const typeInfo = TREE_TYPES[type] || TREE_TYPES.tangerine
  const color = typeInfo.color
  const shape = typeInfo.shape || 'oak'
  const rarity = typeInfo.rarity || 'common'
  const dark = darken(color, 40)
  const light = lighten(color, rarity === 'sacred' ? 50 : rarity === 'true rare' ? 35 : 25)
  const uid = `plant-${type}-${size}-${stage}`

  const swayHash = (type.charCodeAt(0) + (type.charCodeAt(1) || 0)) % 10
  const swayDuration = stage >= 4 ? 8 + (swayHash % 3) : stage >= 3 ? 6 + (swayHash % 3) : 4 + (swayHash % 2)
  const swayDelay = -(swayHash * 0.7)
  const swayDeg = stage >= 4 ? 0.6 : stage >= 3 ? 1.0 : stage >= 2 ? 1.5 : 2.0

  const containerStyle = useMemo(() => ({
    width: size, height: Math.round(size * 1.3), display: 'flex' as const, alignItems: 'flex-end' as const, justifyContent: 'center' as const,
  }), [size])

  const swayStyle = useMemo(() => disableSway ? {
    transformOrigin: '24px 46px',
  } as React.CSSProperties : {
    transformOrigin: '24px 46px',
    '--sway-deg': `${swayDeg}deg`,
    animation: `plantSway ${swayDuration}s ease-in-out ${swayDelay}s infinite`,
  } as React.CSSProperties, [disableSway, swayDeg, swayDuration, swayDelay])

  const seedSwayStyle = useMemo(() => ({
    transformOrigin: '24px 38px',
    '--sway-deg': `${swayDeg}deg`,
    animation: `plantSway ${swayDuration}s ease-in-out ${swayDelay}s infinite`,
  }) as React.CSSProperties, [swayDeg, swayDuration, swayDelay])

  const s = Math.min(3, Math.max(0, stage))
  const trunk = "#6b5b3e"

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shapeElement = useMemo(() => renderShapeInner(), [type, stage, size])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const groundElement = useMemo(() => renderGroundInner(), [type, stage, size])

  const dirtEllipse = useMemo(() => {
    if (!hideGround || dirtSeed <= 0) return null
    const dt = dirtDepth
    const rx = 6 + dt * 10
    const ry = 1.8 + dt * 3
    return <ellipse cx={24} cy={46} rx={rx} ry={ry} fill="#000" opacity={dirtDark ? 0.22 : 0.14} />
  }, [hideGround, dirtSeed, dirtDepth, dirtDark])

  if (isSeed) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <defs>
          <radialGradient id={`${uid}-sg`} cx="40%" cy="35%">
            <stop offset="0%" stopColor={light} />
            <stop offset="100%" stopColor={color} />
          </radialGradient>
        </defs>
        <ellipse cx="24" cy="38" rx="14" ry="4" fill="#8B7355" opacity="0.3" />
        <g style={seedSwayStyle}>
          <ellipse cx="24" cy="28" rx="6" ry="8" fill={`url(#${uid}-sg)`} />
          <ellipse cx="24" cy="28" rx="6" ry="8" fill={dark} opacity="0.15" />
          <path d="M24 20 Q24 28 24 36" stroke={dark} strokeWidth="0.8" fill="none" opacity="0.3" />
          <path d="M24 21 Q22 17 24 14 Q26 17 24 21" fill="#6ab04c" opacity="0.6" />
          <path d="M24 14 L24 21" stroke="#4a8c3f" strokeWidth="0.6" opacity="0.4" />
        </g>
      </svg>
    )
  }

  function renderShapeInner() {
    switch (shape) {
      case 'oak':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="40" rx="3" ry="2" fill="#8B7355" opacity="0.4" />
            <path d="M24 38 Q23 36 24 33" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 33 Q20 30 18 32 Q20 28 24 32" fill={color} opacity="0.7" />
            <path d="M24 33 Q28 30 30 32 Q28 28 24 32" fill={color} opacity="0.6" />
            <path d="M20 30 L18.5 31.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d="M28 30 L29.5 31.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
            <circle cx="22" cy="30" r="0.5" fill={light} opacity="0.25" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23.5 40 24 30" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23.2 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 34 Q18 30 15 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q28 30 30 28" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M14 22 Q14 16 18 14 Q20 13 24 14 Q28 13 30 14 Q34 16 34 22 Q34 26 30 28 Q27 29 24 29 Q21 29 18 28 Q14 26 14 22 Z" fill={color} opacity="0.75" />
            <path d="M17 19 Q19 15 25 16 Q24 19 21 22 Q18 22 17 19 Z" fill={light} opacity="0.2" />
            <path d="M25 24 Q27 21 31 21.5 Q31 24 28 26.5 Q25 26 25 24 Z" fill={dark} opacity="0.12" />
            <circle cx="18" cy="22" r="1" fill={light} opacity="0.15" />
            <circle cx="30" cy="18" r="0.8" fill={light} opacity="0.12" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M22 46 Q21 40 21 34 L27 34 Q27 40 26 46 Z" fill={trunk} />
            <path d="M23 38 L25 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M22.5 42 L25.5 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M22 36 Q16 32 14 30" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 36 Q30 34 32 32" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M12 21 Q12 10 24 10 Q36 10 36 21 Q36 32 24 32 Q12 32 12 21 Z" fill={color} />
            <path d="M14 27 Q18 31 24 31 Q30 31 34 27 Q32 29 24 29 Q16 29 14 27 Z" fill={dark} opacity="0.1" />
            <path d="M14 17 Q16 12 26 12 Q25 17 20 22 Q15 21 14 17 Z" fill={light} opacity="0.2" />
            <path d="M26 24 Q28 21 34 21.5 Q33 25 30 27 Q27 26 26 24 Z" fill={dark} opacity="0.12" />
            <path d="M13 22 Q14 19 19 19.5 Q18 22 16 24.5 Q13 24 13 22 Z" fill={color} opacity="0.3" />
            <path d="M24.5 16 Q26 13 31.5 13.5 Q31 16 28 18.5 Q25 18 24.5 16 Z" fill={color} opacity="0.25" />
            <circle cx="18" cy="18" r="1.5" fill={light} opacity="0.18" />
            <path d="M21 46 Q19 45 17 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M27 46 Q29 45 31 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
                <stop offset="40%" stopColor="#fff" stopOpacity="0" />
                <stop offset="75%" stopColor="#fff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <path d="M21 46 Q20 38 20 32 L28 32 Q28 38 27 46 Z" fill={trunk} />
            <path d="M21 46 Q20 38 20 32 L28 32 Q28 38 27 46 Z" fill={`url(#${uid}-trunk)`} />
            <path d="M23.5 46 Q23 38 23 32 L25 32 L25 46 Z" fill={dark} opacity="0.15" />
            <path d="M21.5 38 L26.5 37.8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <path d="M22 42 L26 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M22.5 35 L25.5 34.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M21 34 Q14 30 10 28" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M27 32 Q34 28 37 26" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 34 Q18 32 14 31" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M8 22 C7 16 10 10 16 8 Q19 6.5 24 7 Q29 6.5 32 8 C38 10 41 16 40 22 C41 26 38 30 34 32 Q30 33.5 24 34 Q18 33.5 14 32 C10 30 7 26 8 22 Z" fill={color} />
            {/* Inner shadow — bottom-right */}
            <path d="M30 28 Q34 30 34 32 Q30 33.5 24 34 Q18 33.5 14 32 Q16 31 20 30" fill={dark} opacity="0.12" />
            <path d="M36 20 Q40 22 40 24 Q40 27 38 29" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.1" />
            <path d="M10 14 Q8.5 12 10.5 11 Q12 12.5 10 14" fill={color} opacity="0.8" />
            <path d="M36 12 Q38 10.5 38.5 12.5 Q37 13.5 36 12" fill={color} opacity="0.8" />
            <path d="M7.5 24 Q5.5 23 6.5 21 Q8 22 7.5 24" fill={color} opacity="0.7" />
            <path d="M40.5 20 Q42 18.5 42.5 20.5 Q41 21.5 40.5 20" fill={color} opacity="0.7" />
            <path d="M15 32.5 Q13 33 13.5 31 Q15 31.5 15 32.5" fill={color} opacity="0.6" />
            <path d="M33 32.5 Q35 33 34.5 31 Q33 31.5 33 32.5" fill={color} opacity="0.6" />
            {/* Texture arcs */}
            <path d="M24 20 Q20 18 16 20" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M24 20 Q28 17 32 18" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.12" />
            <path d="M24 20 Q22 24 20 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M18 14 Q16 17 14 20" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M28 16 Q30 20 32 24" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.08" />
            <path d="M12 24 Q14 26 16 28" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.08" />
            <circle cx="18" cy="26" r="1.8" fill={color} opacity="0.5" />
            <circle cx="30" cy="24" r="1.5" fill={color} opacity="0.4" />
            {/* Highlights — top-left lit side */}
            <circle cx="14" cy="14" r="0.8" fill={light} opacity="0.35" />
            <circle cx="20" cy="10" r="0.7" fill={light} opacity="0.35" />
            <circle cx="16" cy="10" r="0.5" fill={light} opacity="0.25" />
            <circle cx="28" cy="12" r="0.7" fill={light} opacity="0.3" />
            <circle cx="34" cy="16" r="0.6" fill={light} opacity="0.25" />
            <circle cx="12" cy="20" r="0.6" fill={light} opacity="0.3" />
            <circle cx="10" cy="16" r="0.45" fill={light} opacity="0.2" />
            <circle cx="36" cy="22" r="0.55" fill={light} opacity="0.2" />
            <circle cx="16" cy="28" r="0.5" fill={light} opacity="0.18" />
            <circle cx="32" cy="26" r="0.55" fill={light} opacity="0.18" />
            <circle cx="24" cy="16" r="0.7" fill={light} opacity="0.28" />
            <circle cx="22" cy="22" r="0.5" fill={light} opacity="0.2" />
            {/* Lit edge highlight */}
            <path d="M8 22 C7 16 10 10 16 8 Q19 6.5 24 7" stroke={light} strokeWidth="0.5" fill="none" opacity="0.18" />
            {/* Roots */}
            <path d="M20 46 Q17 44.5 14 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M28 46 Q31 44.5 34 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M22 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )

      case 'conifer':
        if (s === 0) return (
          <g>
            <rect x="23" y="38" width="2" height="8" fill={trunk} />
            <path d="M24 26 L19 38 L29 38 Z" fill={color} opacity="0.7" />
            <path d="M24 28 L22 34 L26 34 Z" fill={light} opacity="0.2" />
            <path d="M22 34 L21 35" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M26 34 L27 35" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 30 L24 36" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="36" width="3" height="10" fill={trunk} />
            <path d="M23 40 L25 39.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M24 16 L18 28 L30 28 Z" fill={color} />
            <path d="M24 24 L15 36 L33 36 Z" fill={color} />
            <path d="M24 18 L22 24 L26 24 Z" fill={light} opacity="0.2" />
            <path d="M20 28 L28 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M24 20 L24 32" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M20 26 L19 27" stroke={light} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M28 26 L29 27" stroke={light} strokeWidth="0.4" fill="none" opacity="0.12" />
          </g>
        )
        if (s === 2) return (
          <g>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M22.5 40 L25.5 39.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 43 L25 42.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <path d="M24 8 L17 20 L31 20 Z" fill={color} />
            <path d="M24 16 L14 28 L34 28 Z" fill={color} />
            <path d="M24 24 L11 36 L37 36 Z" fill={color} />
            <path d="M24 10 L21 18 L27 18 Z" fill={light} opacity="0.22" />
            <path d="M19 20 L29 20" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M16 28 L32 28" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.1" />
            <path d="M24 10 L24 34" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M20 18 L19 19" stroke={light} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M28 18 L29 19" stroke={light} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M16 26 L15 27" stroke={light} strokeWidth="0.4" fill="none" opacity="0.1" />
            <path d="M32 26 L33 27" stroke={light} strokeWidth="0.4" fill="none" opacity="0.1" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
                <stop offset="40%" stopColor="#fff" stopOpacity="0" />
                <stop offset="75%" stopColor="#fff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <rect x="22" y="36" width="4" height="10" fill={`url(#${uid}-trunk)`} />
            <path d="M22.5 40 L25.5 39.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 43 L25.5 42.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            {/* Canopy layers */}
            <path d="M24 6 L14 20 L34 20 Z" fill={color} />
            <path d="M24 14 L12 28 L36 28 Z" fill={color} />
            <path d="M24 22 L10 36 L38 36 Z" fill={color} />
            {/* Right shadow on each layer */}
            <path d="M24 6 L34 20 L28 20 Z" fill={dark} opacity="0.1" />
            <path d="M24 14 L36 28 L30 28 Z" fill={dark} opacity="0.1" />
            <path d="M24 22 L38 36 L32 36 Z" fill={dark} opacity="0.1" />
            {/* Left lit highlight on each layer */}
            <path d="M24 6 L19 14 L29 14 Z" fill={light} opacity="0.3" />
            <path d="M24 14 L18 22 L30 22 Z" fill={light} opacity="0.2" />
            {/* Lit edge */}
            <path d="M24 6 L14 20" stroke={light} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M24 14 L12 28" stroke={light} strokeWidth="0.35" fill="none" opacity="0.12" />
            <path d="M24 22 L10 36" stroke={light} strokeWidth="0.3" fill="none" opacity="0.1" />
            {/* Texture lines */}
            <path d="M16 20 L32 20" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.12" />
            <path d="M14 28 L34 28" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.1" />
            <path d="M12 36 L36 36" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.08" />
            <path d="M24 8 L24 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 16 L24 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M17.5 15.5 L19 16.8" stroke={light} strokeWidth="0.5" fill="none" opacity="0.18" />
            <path d="M18.2 17 L17 17.8" stroke={light} strokeWidth="0.4" fill="none" opacity="0.14" />
            <path d="M27.5 13.5 L29 14.2" stroke={light} strokeWidth="0.5" fill="none" opacity="0.15" />
            <path d="M28 15 L27 15.7" stroke={light} strokeWidth="0.35" fill="none" opacity="0.12" />
            <path d="M15.5 23.5 L17 24.5" stroke={light} strokeWidth="0.5" fill="none" opacity="0.14" />
            <path d="M16 25.2 L14.8 25.8" stroke={light} strokeWidth="0.35" fill="none" opacity="0.1" />
            <path d="M29.5 23 L31 24.2" stroke={light} strokeWidth="0.45" fill="none" opacity="0.12" />
            <path d="M30.5 25 L29.2 25.5" stroke={light} strokeWidth="0.35" fill="none" opacity="0.1" />
            <path d="M13.5 31.5 L15 32.5" stroke={light} strokeWidth="0.45" fill="none" opacity="0.12" />
            <path d="M14.2 33.2 L13 33.8" stroke={light} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M31.5 31 L33 32.2" stroke={light} strokeWidth="0.4" fill="none" opacity="0.1" />
            <path d="M32.5 33 L31.2 33.5" stroke={light} strokeWidth="0.3" fill="none" opacity="0.08" />
            <path d="M20 18 Q21 17.5 21.5 18.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M26 22 Q27.5 21.5 27 23" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.08" />
            <path d="M18 30 Q19 29 19.5 30.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.08" />
            <circle cx="18" cy="12" r="0.6" fill={light} opacity="0.3" />
            <circle cx="28" cy="10" r="0.55" fill={light} opacity="0.3" />
            <circle cx="14" cy="22" r="0.5" fill={light} opacity="0.25" />
            <circle cx="32" cy="20" r="0.55" fill={light} opacity="0.25" />
            <circle cx="20" cy="28" r="0.5" fill={light} opacity="0.2" />
            <circle cx="30" cy="30" r="0.5" fill={light} opacity="0.2" />
            <circle cx="24" cy="16" r="0.55" fill={light} opacity="0.25" />
            <circle cx="16" cy="32" r="0.5" fill={light} opacity="0.2" />
            <circle cx="34" cy="28" r="0.5" fill={light} opacity="0.2" />
            <circle cx="22" cy="24" r="0.5" fill={light} opacity="0.2" />
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'birch':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke="#d4cfc8" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 38 L24.5 37.5" stroke="#6b6560" strokeWidth="0.6" />
            <path d="M23.7 41 L24.3 40.8" stroke="#6b6560" strokeWidth="0.4" opacity="0.3" />
            <path d="M24 36 Q21 33 18 32" stroke="#8a8478" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M13 30 Q13.5 28 15.5 28 Q18 28.5 20 29.5 Q20.5 31 19 33 Q16.5 34.5 14.5 33.5 Q13 32.5 13 30 Z" fill={color} opacity="0.6" />
            <path d="M15 29.5 Q16 28.5 17 29.5 Q16 30.5 15 29.5 Z" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 22" stroke="#d4cfc8" strokeWidth="2" strokeLinecap="round" />
            <path d="M24.5 46 L24.5 22" stroke="#b8b0a4" strokeWidth="0.6" opacity="0.3" />
            <path d="M23.5 36 L25 35.5" stroke="#6b6560" strokeWidth="0.6" />
            <path d="M23.5 28 L25 27.5" stroke="#6b6560" strokeWidth="0.6" />
            <path d="M23.8 42 L24.5 41.8" stroke="#6b6560" strokeWidth="0.4" opacity="0.3" />
            <path d="M23.6 32 L24.8 31.8" stroke="#6b6560" strokeWidth="0.4" opacity="0.25" />
            <path d="M24 30 Q18 26 14 25" stroke="#8a8478" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M7 21 Q8 19 10.5 19.5 Q14 20 16 21.5 Q17 23 15.5 25.5 Q13 27.5 10 27 Q7.5 26 7 23.5 Q6.8 22 7 21 Z" fill={color} opacity="0.7" />
            <path d="M24 24 Q28 21 32 20" stroke="#8a8478" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M30 16 Q31 14.5 33.5 15.5 Q36 16.5 37 18 Q37 19.5 35.5 20.5 Q33 21 31 20 Q29.5 19 30 16 Z" fill={color} opacity="0.6" />
            <path d="M9 21 Q10 20 11.5 21 Q10.5 22 9 21 Z" fill={light} opacity="0.2" />
            <path d="M33 16.5 Q34 15.5 34.5 16.8 Q33.5 17.5 33 16.5 Z" fill={light} opacity="0.18" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23.5 46 L23.5 12" stroke="#d4cfc8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 46 L24 12" stroke="#b8b0a4" strokeWidth="0.8" opacity="0.3" />
            <path d="M22.5 36 L25 35.5" stroke="#6b6560" strokeWidth="0.7" />
            <path d="M22.5 28 L25 27.5" stroke="#6b6560" strokeWidth="0.7" />
            <path d="M22.5 20 L25 19.5" stroke="#6b6560" strokeWidth="0.7" />
            <path d="M22.8 42 L24.5 41.8" stroke="#6b6560" strokeWidth="0.5" opacity="0.3" />
            <path d="M22.8 32 L24.8 31.8" stroke="#6b6560" strokeWidth="0.4" opacity="0.25" />
            <path d="M22.8 24 L24.5 23.8" stroke="#6b6560" strokeWidth="0.4" opacity="0.25" />
            <path d="M23 30 Q17 26 13 25" stroke="#8a8478" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M23 22 Q29 18 33 17" stroke="#8a8478" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M23 16 Q18 12 14 12" stroke="#8a8478" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M7 21 Q7.5 19 10 19 Q14 19.5 16 21 Q17 23 15.5 25.5 Q13 27.5 10 27 Q7.5 26 7 23.5 Q6.5 22 7 21 Z" fill={color} opacity="0.7" />
            <path d="M29 13 Q30 11 33 11.5 Q37 12 40 14 Q41 16 39.5 18.5 Q37 20 34 19.5 Q30.5 18.5 29.5 16 Q29 14.5 29 13 Z" fill={color} opacity="0.7" />
            <path d="M8.5 8.5 Q9.5 7 12 7.5 Q14.5 8 16 9.5 Q16 11.5 14 12.5 Q11.5 13 9.5 12 Q8 10.5 8.5 8.5 Z" fill={color} opacity="0.5" />
            <path d="M19 5.5 Q20 3.5 23 3.5 Q26.5 4 28.5 5.5 Q29 7.5 27 9 Q24 10 21.5 9 Q19.5 8 19 5.5 Z" fill={light} opacity="0.4" />
            <path d="M9 21 Q10.5 19.5 12 21 Q10.5 22 9 21 Z" fill={light} opacity="0.2" />
            <path d="M33 13.5 Q34.5 12 35.5 14 Q34 15 33 13.5 Z" fill={light} opacity="0.18" />
            <path d="M11 8.5 Q12 7.5 13 9 Q12 10 11 8.5 Z" fill={light} opacity="0.15" />
            <path d="M22 46 Q20 45 18 46" stroke="#8a8478" strokeWidth="0.6" fill="none" opacity="0.2" />
            <path d="M25 46 Q27 45 29 46" stroke="#8a8478" strokeWidth="0.5" fill="none" opacity="0.18" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a09888" stopOpacity="0.4" />
                <stop offset="35%" stopColor="#e8e4dc" stopOpacity="0" />
                <stop offset="70%" stopColor="#f4f2ee" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#c8c0b4" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Trunk — cylindrical shading */}
            <path d="M23 46 L23 10" stroke="#d4cfc8" strokeWidth="3" strokeLinecap="round" />
            <path d="M23 46 L23 10" stroke={`url(#${uid}-trunk)`} strokeWidth="3" strokeLinecap="round" />
            <path d="M21.6 46 L21.6 10" stroke="#a09888" strokeWidth="0.4" opacity="0.2" />
            {/* Bark marks */}
            <path d="M22 38 L24.5 37.5" stroke="#6b6560" strokeWidth="0.8" />
            <path d="M22 30 L24.5 29.5" stroke="#6b6560" strokeWidth="0.8" />
            <path d="M22 22 L24.5 21.5" stroke="#6b6560" strokeWidth="0.8" />
            <path d="M22 14 L24.5 13.5" stroke="#6b6560" strokeWidth="0.7" opacity="0.7" />
            <path d="M22.2 42 L24.2 41.8" stroke="#6b6560" strokeWidth="0.5" opacity="0.3" />
            <path d="M22.2 34 L24.5 33.8" stroke="#6b6560" strokeWidth="0.5" opacity="0.25" />
            <path d="M22.2 26 L24.5 25.8" stroke="#6b6560" strokeWidth="0.5" opacity="0.25" />
            <path d="M22.5 18 L24.2 17.8" stroke="#6b6560" strokeWidth="0.4" opacity="0.25" />
            {/* Branches — tapered */}
            <path d="M23 32 Q16 28 12 26" stroke="#8a8478" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 32 Q17 29 14 27.5" stroke="#9a9488" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M23 24 Q30 20 34 18" stroke="#8a8478" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 24 Q29 21 33 19" stroke="#9a9488" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M23 16 Q16 12 12 11" stroke="#8a8478" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M23 12 Q28 10 32 10" stroke="#8a8478" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Leaf clusters — base fill */}
            <path d="M5 24 Q4.5 20 7 19.5 Q9 18.5 12 19 Q16.5 19.5 16 23 Q15.8 26.5 13 28.5 Q10 29.5 7 28.5 Q4.8 27.5 5 24Z" fill={color} opacity="0.8" />
            <path d="M29.5 16 Q29 12 32 11 Q35 10 39 11.5 Q43 13 42.5 16.5 Q42 19.5 39 20.8 Q35.5 22 32 20.5 Q29.5 19 29.5 16Z" fill={color} opacity="0.8" />
            <path d="M5.5 10 Q5 7 8 6.5 Q10.5 6 13 7 Q15.5 8.5 14.5 11 Q13.5 13.5 11 14 Q8 14 6 12.5 Q5.2 11.8 5.5 10Z" fill={color} opacity="0.7" />
            <path d="M18.5 6 Q19 3 22 2.5 Q25 2 28 3 Q30.5 4.5 30 7 Q29.5 9.5 27 10 Q24 10.5 21 9.5 Q18.8 8.5 18.5 6Z" fill={light} opacity="0.85" />
            <path d="M30.5 9 Q30 7 32 6.5 Q34 6 36.5 7 Q38.5 8.5 38 10.5 Q37 12 35 12 Q32.5 12 31 11 Q30.3 10.2 30.5 9Z" fill={color} opacity="0.4" />
            {/* Leaf clusters — inner shadow (bottom/right) */}
            <path d="M7 26 Q9 28 13 27.5 Q11 28.5 8 27.5Z" fill={dark} opacity="0.15" />
            <path d="M14 23 Q15 25.5 13 27" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.12" />
            <path d="M34 19 Q37 20 40 19.5 Q38 20.8 35 20Z" fill={dark} opacity="0.15" />
            <path d="M41 15 Q42 18 39 20" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.12" />
            <path d="M8 12.5 Q10 13.5 13 13 Q11 14 8.5 13Z" fill={dark} opacity="0.12" />
            <path d="M25 8 Q27 9.5 27 10 Q24.5 10 22 9" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.1" />
            {/* Leaf clusters — top-left lit highlights */}
            <path d="M6 21 Q7 19.5 8 21 Q7 22 6 21Z" fill={light} opacity="0.3" />
            <path d="M8 20 Q9 19 10 20 Q9 21 8 20Z" fill={light} opacity="0.2" />
            <path d="M13 20 Q14 18.5 14.5 20 Q14 21 13 20Z" fill={light} opacity="0.22" />
            <path d="M31 13 Q32.5 11.5 33 13 Q32 14 31 13Z" fill={light} opacity="0.25" />
            <path d="M35 12 Q36 11 37 12.5 Q36 13 35 12Z" fill={light} opacity="0.18" />
            <path d="M38 14 Q39 12.5 39.5 14 Q39 15.2 38 14Z" fill={light} opacity="0.2" />
            <path d="M7 8 Q8 6.5 9 8 Q8 9 7 8Z" fill={light} opacity="0.22" />
            <path d="M12 7.5 Q13 6 13.5 7.5 Q13 8.5 12 7.5Z" fill={light} opacity="0.18" />
            <path d="M21 4.5 Q22 3 23 4.5 Q22 5.5 21 4.5Z" fill={light} opacity="0.28" />
            <path d="M23 3.5 Q24 2.5 25 3.8 Q24 4.5 23 3.5Z" fill={light} opacity="0.2" />
            <path d="M27 4 Q28 2.5 28.5 4 Q28 5 27 4Z" fill={light} opacity="0.2" />
            {/* Leaf texture arcs */}
            <path d="M8 22 Q10 21 12 22.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M10 25 Q11 24 13 24.5" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M6 22 Q7 23 9 23" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.1" />
            <path d="M33 14 Q35 13 37 14" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M35 17 Q37 16 39 17" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M31 16 Q33 15.5 35 16.5" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.1" />
            <path d="M8 9 Q10 8 12 9" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M22 5 Q24 4 26 5" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M20 6 Q21 5.5 22 6.5" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.1" />
            {/* Leaf cluster edge highlights — lit side */}
            <path d="M5 22 Q4.5 20 7 19.5" stroke={light} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M29.5 15 Q29 12 32 11" stroke={light} strokeWidth="0.4" fill="none" opacity="0.18" />
            <path d="M5.5 9 Q5 7 8 6.5" stroke={light} strokeWidth="0.35" fill="none" opacity="0.15" />
            <path d="M18.5 5.5 Q19 3 22 2.5" stroke={light} strokeWidth="0.35" fill="none" opacity="0.2" />
            {/* Roots */}
            <path d="M21 46 Q18 44.5 15 46" stroke="#8a8478" strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M25 46 Q28 44.5 31 46" stroke="#8a8478" strokeWidth="0.7" fill="none" opacity="0.2" />
            <path d="M23 46 Q21 45.5 19 46" stroke="#8a8478" strokeWidth="0.5" fill="none" opacity="0.18" />
          </g>
        )

      case 'citrus':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 40 L24.5 40" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 36 Q18 30 16 33 Q19 28 24 34 Z" fill="#4a8c3a" opacity="0.8" />
            <path d="M24 36 Q30 30 32 33 Q29 28 24 34 Z" fill="#3a7a2a" opacity="0.7" />
            <path d="M24 35 L19 31" stroke="#2e6e22" strokeWidth="0.3" fill="none" opacity="0.35" />
            <path d="M24 35 L29 31" stroke="#2e6e22" strokeWidth="0.3" fill="none" opacity="0.35" />
            <path d="M24 30 Q23 28.5 24 27.5 Q25 28.5 24 30 Z" fill="white" opacity="0.5" />
            <path d="M24 28.5 Q22.5 28 22.5 29 Q23.5 29 24 28.5 Z" fill="white" opacity="0.35" />
            <path d="M24 28.5 Q25.5 28 25.5 29 Q24.5 29 24 28.5 Z" fill="white" opacity="0.35" />
            <circle cx="24" cy="28.8" r="0.5" fill="#fbbf24" opacity="0.6" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 30" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23.5 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 34 Q18 30 15 28" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M15 24 C14 18 17 14 24 14 C31 14 34 18 33 24 C34 27 31 30 24 30 C17 30 14 27 15 24 Z" fill="#4a8c3a" />
            <path d="M14.5 22 Q13 20 14.5 18.5 Q15.5 20 14.5 22" fill="#4a8c3a" opacity="0.7" />
            <path d="M33.5 20 Q35 18 34 16.5 Q33 18 33.5 20" fill="#4a8c3a" opacity="0.6" />
            <path d="M19 18 Q17 16 18 14.5 Q20 16 19 18 Z" fill="#5a9c4a" opacity="0.3" />
            <path d="M28 20 Q30 18 29 16 Q27 18 28 20 Z" fill="#3a7a2a" opacity="0.2" />
            <path d="M27 17 L27.5 15.5" stroke="#5a8c3a" strokeWidth="0.6" strokeLinecap="round" />
            <path d="M27.5 15.5 Q29 15 28.5 16.5" fill="#4a8c3a" stroke="none" opacity="0.5" />
            <path d="M27 17 C25 17.5 24.5 19 25 20.5 C25.5 22 26.5 22 27 22 C27.5 22 28.5 22 29 20.5 C29.5 19 29 17.5 27 17 Z" fill={color} />
            <path d="M25.8 18 Q26.8 17 28 17.5" stroke={light} strokeWidth="0.5" fill="none" opacity="0.4" />
            <circle cx="26" cy="18.2" r="0.6" fill="white" opacity="0.25" />
            <path d="M26.8 21.5 Q27 22 27.2 21.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 Q22 40 22 34 L26 34 Q26 40 25 46 Z" fill={trunk} />
            <path d="M23 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 42 L25 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 36 Q17 32 14 30" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M25 34 Q30 30 34 28" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M11 22 C10 14 15 9 24 9 C33 9 38 14 37 22 C38 27 34 32 24 33 C14 32 10 27 11 22 Z" fill="#4a8c3a" />
            <path d="M10 18 Q8 16 9.5 14 Q11 16 10 18" fill="#4a8c3a" opacity="0.7" />
            <path d="M37 16 Q39 14 38.5 12 Q37 14 37 16" fill="#4a8c3a" opacity="0.7" />
            <path d="M14 30 Q12 31 13 29 Q14.5 30 14 30" fill="#4a8c3a" opacity="0.6" />
            <path d="M34 30 Q36 31 35 29 Q33.5 30 34 30" fill="#4a8c3a" opacity="0.6" />
            <path d="M18 15 Q16 12 17.5 11 Q19 13 18 15 Z" fill="#5a9c4a" opacity="0.3" />
            <path d="M30 18 Q32 15 31 14 Q29 16 30 18 Z" fill="#3a7a2a" opacity="0.25" />
            <path d="M22 22 Q20 20 21 18 Q23 20 22 22 Z" fill="#5a9c4a" opacity="0.15" />
            <path d="M16 21 L15.5 19" stroke="#5a8c3a" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M15.5 19 Q14 18.5 14.5 20" fill="#4a8c3a" stroke="none" opacity="0.5" />
            <path d="M16 21 C13.5 21.5 13 23.5 13.5 25 C14 27 15.5 27.5 16 27.5 C16.5 27.5 18 27 18.5 25 C19 23.5 18.5 21.5 16 21 Z" fill={color} />
            <path d="M14.2 22.5 Q15.5 21 17.2 21.5" stroke={light} strokeWidth="0.5" fill="none" opacity="0.35" />
            <circle cx="14.5" cy="22.8" r="0.7" fill="white" opacity="0.22" />
            <path d="M15.8 26.5 Q16 27 16.3 26.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d="M31 14 L31.5 12" stroke="#5a8c3a" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M31 14 C29 14.5 28.5 16 29 17.5 C29.5 19 30.5 19.2 31 19.2 C31.5 19.2 32.5 19 33 17.5 C33.5 16 33 14.5 31 14 Z" fill={color} />
            <path d="M29.5 15 Q30.5 14 32 14.5" stroke={light} strokeWidth="0.4" fill="none" opacity="0.3" />
            <circle cx="29.8" cy="15.2" r="0.5" fill="white" opacity="0.2" />
            <path d="M30.8 18.5 Q31 19 31.2 18.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 11 C23 11.2 22.5 12 23 13 C23.3 13.5 24 13.8 24.5 13 C25 12 25 11.2 24 11 Z" fill={color} opacity="0.5" />
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M22 46 C21.5 42 22 38 23 34 C23.5 32 24 31 24 30" fill="none" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            <path d="M22 46 C21.5 42 22 38 23 34 C23.5 32 24 31 24 30" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
            <path d="M22.5 36 C20 34.5 18 35 17 36" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            <ellipse cx="22" cy="39" rx="2" ry="2.5" fill={trunk} />
            <ellipse cx="22" cy="39" rx="1.5" ry="2" fill="#1a1008" />
            <ellipse cx="22" cy="39" rx="0.9" ry="1.3" fill="#0a0604" />
            <path d="M24 30 C20 28 16 28 12 30" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M24 30 C28 28 32 28 36 30" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M14 30 C12 28 10 24 8 22" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M34 30 C36 28 38 24 40 22" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 30 C24 26 24 22 24 18" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M7 22 C6 14 12 7 18 6 Q21 5 24 6 Q27 5 30 6 C36 7 42 14 41 22 C42 28 38 33 32 34 Q28 35 24 34 Q20 35 16 34 C10 33 6 28 7 22 Z" fill="#4a8c3a" />
            <path d="M10 28 C14 33 20 35 24 34 Q28 35 34 33 C38 30 40 26 41 22" fill="#3a7a2a" opacity="0.2" />
            <path d="M14 12 C18 8 22 7 24 6 Q27 5 30 6 C34 8 38 12 40 18" fill="#56a046" opacity="0.15" />
            <path d="M9 14 Q7 12 9 10 Q10.5 12 9 14" fill="#4a8c3a" />
            <path d="M38 12 Q40 10 39.5 8.5 Q38 10 38 12" fill="#4a8c3a" />
            <path d="M6.5 25 Q5 23.5 6 22 Q7.5 23.5 6.5 25" fill="#4a8c3a" />
            <path d="M41.5 24 Q43 22 42 20 Q41 22 41.5 24" fill="#4a8c3a" />
            <path d="M15 34 Q13 34.5 14 33 Q15.5 33.5 15 34" fill="#4a8c3a" />
            <path d="M33 34 Q35 34.5 34 33 Q32.5 33.5 33 34" fill="#4a8c3a" />
            <line x1="11" y1="26.5" x2="11" y2="27" stroke="#3a7a2a" strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="11" cy="28" r="1.1" fill={color} />
            <line x1="14" y1="28.5" x2="14" y2="29" stroke="#3a7a2a" strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="14" cy="30" r="1.0" fill={color} />
            <line x1="24" y1="30.5" x2="24" y2="31" stroke="#3a7a2a" strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="24" cy="32" r="0.9" fill={color} opacity="0.85" />
            <line x1="35" y1="26.5" x2="35" y2="27" stroke="#3a7a2a" strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="35" cy="28" r="1.1" fill={color} />
            <line x1="32" y1="28.5" x2="32" y2="29" stroke="#3a7a2a" strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="32" cy="30" r="1.0" fill={color} />
            <line x1="22" y1="24.5" x2="22" y2="25" stroke="#3a7a2a" strokeWidth="0.25" strokeLinecap="round" />
            <circle cx="22" cy="26" r="0.9" fill={color} opacity="0.75" />
            <line x1="30" y1="23.5" x2="30" y2="24" stroke="#3a7a2a" strokeWidth="0.25" strokeLinecap="round" />
            <circle cx="30" cy="25" r="0.85" fill={color} opacity="0.7" />
            <line x1="18" y1="25.5" x2="18" y2="26" stroke="#3a7a2a" strokeWidth="0.25" strokeLinecap="round" />
            <circle cx="18" cy="27" r="0.8" fill={color} opacity="0.65" />
            <line x1="26" y1="26.5" x2="26" y2="27" stroke="#3a7a2a" strokeWidth="0.25" strokeLinecap="round" />
            <circle cx="26" cy="28" r="0.85" fill={color} opacity="0.7" />
            <line x1="37" y1="23.5" x2="37" y2="24" stroke="#3a7a2a" strokeWidth="0.25" strokeLinecap="round" />
            <circle cx="37" cy="25" r="0.8" fill={color} opacity="0.7" />
            <circle cx="12" cy="21" r="0.7" fill={color} opacity="0.4" />
            <circle cx="33" cy="20" r="0.7" fill={color} opacity="0.4" />
            <circle cx="14" cy="12" r="0.65" fill={light} opacity="0.3" />
            <circle cx="20" cy="10" r="0.6" fill={light} opacity="0.3" />
            <circle cx="28" cy="8" r="0.55" fill={light} opacity="0.25" />
            <circle cx="34" cy="14" r="0.6" fill={light} opacity="0.25" />
            <circle cx="10" cy="20" r="0.55" fill={light} opacity="0.25" />
            <circle cx="38" cy="18" r="0.55" fill={light} opacity="0.2" />
            <circle cx="16" cy="26" r="0.5" fill={light} opacity="0.2" />
            <circle cx="30" cy="24" r="0.55" fill={light} opacity="0.2" />
            <circle cx="24" cy="16" r="0.6" fill={light} opacity="0.25" />
            <circle cx="22" cy="22" r="0.5" fill={light} opacity="0.2" />
            <path d="M21 46 C19 45 17 45 15 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 C27 45 29 45 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      case 'bamboo':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 30" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 46 L24 30" stroke={dark} strokeWidth="0.6" opacity="0.1" />
            <path d="M23 40 L25 40" stroke={dark} strokeWidth="0.7" opacity="0.4" />
            <path d="M23 36 L25 36" stroke={dark} strokeWidth="0.6" opacity="0.35" />
            <path d="M24 36 C22 34 18 32 16 34 C18 31 22 33 24 35" fill={color} opacity="0.5" />
            <path d="M24 36 L20 33" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <path d="M24 46 L24 16" stroke={dark} strokeWidth="0.7" opacity="0.1" />
            <path d="M22.5 40 L25.5 40" stroke={dark} strokeWidth="0.6" opacity="0.4" />
            <path d="M22.5 34 L25.5 34" stroke={dark} strokeWidth="0.6" opacity="0.4" />
            <path d="M22.5 28 L25.5 28" stroke={dark} strokeWidth="0.5" opacity="0.35" />
            <path d="M23 22 L25 22" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <path d="M24 28 C20 26 14 24 12 22 C14 22 20 24 24 27" fill={color} opacity="0.5" />
            <path d="M24 22 C28 20 34 18 36 16 C34 18 28 20 24 21" fill={color} opacity="0.5" />
            <path d="M24 16 C22 14 18 12 16 12 C18 11 22 13 24 15" fill={color} opacity="0.4" />
            <path d="M24 27 L18 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M24 21 L30 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M18 46 L18 14" stroke={dark} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
            <path d="M16.5 38 L19.5 38" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M16.5 30 L19.5 30" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M17 22 L19 22" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            <path d="M24 46 L24 10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M24 46 L24 10" stroke={dark} strokeWidth="0.7" opacity="0.1" />
            <path d="M22 40 L26 40" stroke={dark} strokeWidth="0.6" opacity="0.4" />
            <path d="M22 32 L26 32" stroke={dark} strokeWidth="0.6" opacity="0.4" />
            <path d="M22 24 L26 24" stroke={dark} strokeWidth="0.5" opacity="0.35" />
            <path d="M22.5 16 L25.5 16" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <path d="M24 32 C20 30 14 28 10 26 C14 26 20 28 24 31" fill={color} opacity="0.6" />
            <path d="M24 24 C28 22 34 20 38 18 C34 20 28 22 24 23" fill={color} opacity="0.5" />
            <path d="M24 16 C20 14 14 12 10 10 C14 11 20 13 24 15" fill={color} opacity="0.5" />
            <path d="M24 16 C28 14 32 12 36 12 C32 13 28 14 24 15" fill={color} opacity="0.4" />
            <path d="M18 22 C14 20 10 18 8 18 C10 17 14 19 18 21" fill={color} opacity="0.35" />
          </g>
        )
        return (
          <g>
            <path d="M16 46 L16 14" stroke={dark} strokeWidth="1.7" strokeLinecap="round" opacity="0.8" />
            <path d="M14.5 39 L17.5 39" stroke={dark} strokeWidth="0.4" opacity="0.35" />
            <path d="M14.5 30 L17.5 30" stroke={dark} strokeWidth="0.4" opacity="0.35" />
            <path d="M15 20 L17 20" stroke={dark} strokeWidth="0.3" opacity="0.3" />
            <path d="M24 46 L24 8" stroke={color} strokeWidth="2.3" strokeLinecap="round" />
            <path d="M24 46 L24 8" stroke={dark} strokeWidth="0.7" opacity="0.1" />
            <path d="M22 41 L26 41" stroke={dark} strokeWidth="0.65" opacity="0.4" />
            <path d="M22 33 L26 33" stroke={dark} strokeWidth="0.65" opacity="0.4" />
            <path d="M22.5 25 L25.5 25" stroke={dark} strokeWidth="0.5" opacity="0.35" />
            <path d="M22.5 17 L25.5 17" stroke={dark} strokeWidth="0.5" opacity="0.35" />
            <path d="M23 10 L25 10" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <path d="M24 32 C18 30 10 28 6 24 C10 24 18 28 24 31" fill={color} opacity="0.6" />
            <path d="M24 32 C18 30 12 30 8 28 C12 28 18 29 24 31" fill={color} opacity="0.35" />
            <path d="M24 24 C30 22 38 18 44 16 C38 18 30 21 24 23" fill={color} opacity="0.55" />
            <path d="M24 24 C30 22 36 22 40 20 C36 21 30 22 24 23" fill={color} opacity="0.3" />
            <path d="M24 16 C18 14 10 10 4 8 C10 9 18 12 24 15" fill={color} opacity="0.5" />
            <path d="M24 16 C28 14 34 12 40 12 C34 13 28 14 24 15" fill={color} opacity="0.4" />
            <path d="M24 8 C20 6 14 4 10 4 C14 3 20 5 24 7" fill={color} opacity="0.4" />
            <path d="M24 8 C28 6 34 6 38 6 C34 7 28 7 24 7" fill={color} opacity="0.3" />
            <path d="M16 28 C12 26 8 24 6 22 C8 22 12 25 16 27" fill={color} opacity="0.3" />
            <path d="M16 18 C20 16 24 14 26 12 C24 14 20 16 16 17" fill={color} opacity="0.25" />
            <path d="M16 22 C12 20 8 18 6 16 C8 17 12 19 16 21" fill={color} opacity="0.25" />
            <path d="M24 32 C16 28 8 26 6 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 24 C32 20 40 18 44 16" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 16 C16 12 8 10 4 8" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
          </g>
        )

      case 'sakura':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 22.5 38 Q22 36 21 34" stroke="#5c4a3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M21 34 Q18 31 16 30" stroke="#5c4a3a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M15 29 C13 27 14 25 17 25.5 C19 26 20 28 18 30 C16 31 14 30 15 29Z" fill="#f9a8d4" />
            <path d="M17 27 Q16.5 26 17.5 25.5 L18.5 26.5 Q18 28 17 27Z" fill="#ffe0ec" />
            <path d="M14 28 L14.5 27 L15.5 27.5 L15 28.5 L14 28Z" fill="#ffc0d8" />
            <circle cx="16.5" cy="27.5" r="0.5" fill="#fbbf24" opacity="0.45" />
            <path d="M23 38 C22 36 23 35 24 36.5 Q23.5 37.5 23 38Z" fill="#f9a8d4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23 40 22 34 Q21.5 31 22 28" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M22.5 38 L24 37.6" stroke="#4a3a2a" strokeWidth="0.4" opacity="0.3" />
            <ellipse cx="22.5" cy="36" rx="0.7" ry="0.5" fill="#4a3a2a" opacity="0.15" />
            <path d="M22 32 Q15 26 10 24" stroke="#5c4a3a" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M22 30 Q27 26 32 24" stroke="#5c4a3a" strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M22 28 Q20 24 18 22" stroke="#5c4a3a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M7 22 C5 19 6 16 10 15 C14 14 17 17 16 21 C15 24 10 25 7 22Z" fill="#f9a8d4" />
            <path d="M9 18 C8 16 10 14.5 12 16 C14 17 13 20 10 20Z" fill="#ffc0d8" />
            <path d="M9 22 Q10 20 12 19.5 Q15 20 15 22 Q14 24 12 24.5 Q10 24 9 22 Z" fill="#ffe0ec" />
            <path d="M10 19 L10.5 18 L11.5 18.5 L11 19.5 L10 19Z" fill="#ffc0d8" />
            <circle cx="10" cy="20" r="0.5" fill="#fbbf24" opacity="0.4" />
            <path d="M16 20 C14 17 15 14 19 14 C23 14 24 18 21 21 C18 23 15 22 16 20Z" fill="#ffc0d8" />
            <path d="M18 16 Q17 15 18.5 14.5 L19.5 15.5 Q19 17 18 16Z" fill="#ffe0ec" />
            <path d="M18.5 19 Q19 16.5 20 16.5 Q21.5 17 21.5 19 Q21 21.5 20 21.5 Q18.5 21 18.5 19 Z" fill="#e890b8" opacity="0.7" />
            <circle cx="18" cy="19" r="0.5" fill="#fbbf24" opacity="0.35" />
            <path d="M29 22 C27 19 29 16 33 17 C36 18 37 21 34 23 C31 25 28 24 29 22Z" fill="#f9a8d4" />
            <path d="M32 19 L32.5 18 L33.5 18.5 L33 19.5 L32 19Z" fill="#ffe0ec" />
            <circle cx="32" cy="21" r="0.4" fill="#fbbf24" opacity="0.3" />
            <path d="M21 25 C19 22 21 20 24 20.5 C26 21 26 24 23 26Z" fill="#ffc0d8" />
            <path d="M27 36 Q27.5 35.2 28.5 35.5 Q29 36 28.5 36.8 Q28 37 27 36 Z" fill="#f9a8d4" opacity="0.7" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <style>{`
                @keyframes sakuraFall-${uid} {
                  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.5; }
                  50% { opacity: 0.4; }
                  100% { transform: translate(var(--sf-x), 20px) rotate(180deg); opacity: 0; }
                }
              `}</style>
            </defs>
            <path d="M23 46 Q21.5 40 22 34 Q22.5 30 23 28" stroke="#5c4a3a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M21.8 38 L24 37.6" stroke="#4a3a2a" strokeWidth="0.4" opacity="0.25" />
            <ellipse cx="22.5" cy="36" rx="0.8" ry="0.5" fill="#4a3a2a" opacity="0.15" />
            <path d="M23 30 Q14 24 7 22" stroke="#5c4a3a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d="M23 28 Q32 20 38 18" stroke="#5c4a3a" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q17 20 13 16" stroke="#5c4a3a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 28 Q26 24 30 22" stroke="#5c4a3a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M4 20 C2 17 3 13 7 12 C12 11 16 14 16 18 C16 22 12 24 8 23 C5 22 3 21 4 20Z" fill="#f9a8d4" />
            <path d="M6 16 C5 14 7 12 10 13 C12 14 12 17 9 18Z" fill="#ffc0d8" />
            <path d="M7.5 20 Q8.5 18.5 10 18.5 Q12 18.5 12.5 20 Q12 21.5 10 21.5 Q8 21.5 7.5 20 Z" fill="#e890b8" opacity="0.7" />
            <path d="M11 14 C9 11 11 8 15 9 C19 10 20 14 17 16 C14 18 10 17 11 14Z" fill="#ffc0d8" />
            <path d="M14 11 Q13 10 14.5 9 L16 10.5 Q15 12 14 11Z" fill="#ffe0ec" />
            <path d="M15.5 15 Q16 12.5 17 12.5 Q18.5 13 18.5 15 Q18 17.5 17 17.5 Q15.5 17 15.5 15 Z" fill="#e890b8" opacity="0.7" />
            <path d="M16 12 C14 9 17 7 20 9 C23 11 21 15 18 15Z" fill="#f9a8d4" />
            <path d="M20 19 C17 15 20 12 24 13 C28 14 28 19 24 21 C21 22 18 21 20 19Z" fill="#ffc0d8" />
            <path d="M23 15 L23.5 14 L24.5 14.5 L24 15.5 L23 15Z" fill="#ffe0ec" />
            <path d="M20 18 Q21 16.8 22 16.8 Q23.5 17 24 18 Q23.5 19.2 22 19.2 Q20.5 19 20 18 Z" fill="#e890b8" opacity="0.7" />
            <path d="M28 20 C25 16 28 13 32 15 C35 17 34 21 30 22 C27 23 26 22 28 20Z" fill="#f9a8d4" />
            <path d="M31 17 C29 15 31 13 34 15 C36 17 33 20 31 17Z" fill="#ffe0ec" />
            <path d="M35 16 C33 12 37 9 41 11 C44 13 42 17 39 18 C36 19 34 18 35 16Z" fill="#ffc0d8" />
            <path d="M38 13 Q37.5 12 38.5 11.5 L39.5 12.5 Q39 14 38 13Z" fill="#ffe0ec" />
            <circle cx="23" cy="19" r="0.6" fill="#fbbf24" opacity="0.3" />
            <circle cx="13" cy="13" r="0.5" fill="#fbbf24" opacity="0.25" />
            <circle cx="38" cy="15" r="0.4" fill="#fbbf24" opacity="0.2" />
            <circle cx="7" cy="19" r="0.4" fill="#fbbf24" opacity="0.2" />
            <path d="M15 8 Q14.5 7.5 15 7 L15.5 7 L16 7.5 L15.5 8 Z" fill="#f9a8d4" opacity="0.4" style={{animation: `sakuraFall-${uid} 5s linear 0s infinite`, '--sf-x': '4px'} as React.CSSProperties} />
            <path d="M30 6 C30.5 5.5 31 5.5 31 6 C31 6.5 30.5 7 30 6.5 Z" fill="#ffc0d8" opacity="0.35" style={{animation: `sakuraFall-${uid} 6.5s linear 1.2s infinite`, '--sf-x': '-5px'} as React.CSSProperties} />
            <path d="M8 10 Q8.5 9.5 9 10 L8.5 10.5 Z" fill="#ffe0ec" opacity="0.4" style={{animation: `sakuraFall-${uid} 4.5s linear 2.5s infinite`, '--sf-x': '3px'} as React.CSSProperties} />
            <path d="M40 10 C40.5 9.5 41 10 40.5 10.5 Z" fill="#f9a8d4" opacity="0.3" style={{animation: `sakuraFall-${uid} 7s linear 0.8s infinite`, '--sf-x': '-6px'} as React.CSSProperties} />
            <path d="M27 34 Q27.5 33.2 28.5 33.5 Q29.2 34 28.8 34.8 Q28 35 27 34 Z" fill="#f9a8d4" opacity="0.7" />
            <path d="M15.2 38 Q15.5 37.3 16.5 37.5 Q17 38 16.5 38.8 Q16 39 15.2 38 Z" fill="#ffc0d8" opacity="0.7" />
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes sakuraFall-${uid} {
                  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.5; }
                  50% { opacity: 0.4; }
                  100% { transform: translate(var(--sf-x), 20px) rotate(180deg); opacity: 0; }
                }
              `}</style>
            </defs>
            {/* Trunk — slim elegant S-curve */}
            <path d="M23.5 46 C23 43 21.5 40 21 37 C20.5 34 21.5 31 22.5 28 C23 26.5 23.5 25 23 24" stroke="#5c4a3a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M23.5 46 C23 43 21.5 40 21 37 C20.5 34 21.5 31 22.5 28 C23 26.5 23.5 25 23 24" stroke="#4a3a2a" strokeWidth="1" opacity="0.1" strokeLinecap="round" fill="none" />
            {/* Bark texture */}
            <path d="M22 42 Q21.5 40.5 22.5 39" stroke="#4a3a2a" strokeWidth="0.4" opacity="0.15" fill="none" />
            <path d="M21.5 37 Q22.5 35.5 21.8 34" stroke="#4a3a2a" strokeWidth="0.35" opacity="0.12" fill="none" />
            <ellipse cx="21.8" cy="36" rx="0.8" ry="0.5" fill="#4a3a2a" opacity="0.15" />
            {/* Root flare */}
            <path d="M22.5 46 C21 45 19 44.5 17 46" stroke="#5c4a3a" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M24 46 C25.5 45 27.5 44.5 29 46" stroke="#5c4a3a" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.25" />
            {/* Main branches — sweeping curves, tapered */}
            <path d="M22 32 C18 28 12 25 5 23" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23 27 C28 22 36 18 43 15" stroke="#5c4a3a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M22.5 29 C18 23 14 17 10 10" stroke="#5c4a3a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d="M23 25 C27 20 32 14 36 8" stroke="#5c4a3a" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <path d="M22.5 30 C20 26 18.5 22 18 18" stroke="#5c4a3a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 28 C26 24 29 21 32 20" stroke="#5c4a3a" strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Sub-branches left — delicate arcs */}
            <path d="M9 24 C7 22.5 4 22 2 24" stroke="#5c4a3a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M12 20 C10 18.5 7 18 5 18.5" stroke="#5c4a3a" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M14 16 C12 14.5 9 14 7 14.5" stroke="#5c4a3a" strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M12 12 C10.5 10.5 8 9 6 8" stroke="#5c4a3a" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M15 14 C13.5 12.5 11 12 9 13" stroke="#5c4a3a" strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M18 19 C16.5 17 14 16.5 13 18" stroke="#5c4a3a" strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M6 23 C4.5 21.5 3 21 1.5 21.5" stroke="#5c4a3a" strokeWidth="0.35" strokeLinecap="round" fill="none" />
            {/* Sub-branches right — graceful arcs */}
            <path d="M36 18 C38.5 16 41 16 43 18" stroke="#5c4a3a" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M34 14 C36.5 12 39 11.5 41 12" stroke="#5c4a3a" strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M32 20 C34.5 18 37 18 39 20" stroke="#5c4a3a" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M38 14 C40.5 12 43 12 45 14" stroke="#5c4a3a" strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M34 10 C36 8.5 39 8 41 8.5" stroke="#5c4a3a" strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M28 18 C30 16.5 32 16 34 18" stroke="#5c4a3a" strokeWidth="0.35" strokeLinecap="round" fill="none" />
            {/* Sub-branches top — wispy tips */}
            <path d="M25 10 C27 8 29 6.5 31 6" stroke="#5c4a3a" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M20 10 C18.5 8 17 6.5 15 6" stroke="#5c4a3a" strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M22 12 C21 10 19 9 17 9.5" stroke="#5c4a3a" strokeWidth="0.35" strokeLinecap="round" fill="none" />
            {/* ──── FLOWER CLUSTERS ──── */}
            {/* Bottom-left branch tip */}
            <ellipse cx="5" cy="21" rx="4" ry="3.5" fill="#f9a8d4" />
            <ellipse cx="4" cy="20" rx="3" ry="2.5" fill="#ffc0d8" />
            <ellipse cx="7" cy="22" rx="2.5" ry="2" fill="#ffe0ec" />
            {/* 5-petal flower detail */}
            <path d="M5 18.5 Q4 17.5 5 17 Q6 17.5 5 18.5Z" fill="#ffe0ec" opacity="0.8" />
            <path d="M3 20 Q2 19 3 18.5 Q4 19 3 20Z" fill="#ffe0ec" opacity="0.7" />
            <path d="M7 20 Q6 19 7 18.5 Q8 19 7 20Z" fill="#ffe0ec" opacity="0.7" />
            <path d="M4 22.5 Q3 21.5 4 21 Q5 21.5 4 22.5Z" fill="#ffe0ec" opacity="0.6" />
            <path d="M6.5 23 Q5.5 22 6.5 21.5 Q7.5 22 6.5 23Z" fill="#ffe0ec" opacity="0.6" />
            <circle cx="5" cy="21" r="0.8" fill="#fbbf24" opacity="0.4" />
            <circle cx="5" cy="20.5" r="0.3" fill="#f59e0b" opacity="0.5" />
            <circle cx="5.4" cy="21.3" r="0.25" fill="#f59e0b" opacity="0.4" />
            <circle cx="3.5" cy="19.5" r="0.6" fill="#fbbf24" opacity="0.35" />
            {/* Bottom-left mid */}
            <ellipse cx="11" cy="20" rx="3.5" ry="3" fill="#ffc0d8" />
            <ellipse cx="13" cy="21" rx="3" ry="2.5" fill="#f9a8d4" />
            <path d="M11 17.5 Q10 16.5 11 16 Q12 16.5 11 17.5Z" fill="#ffe0ec" opacity="0.7" />
            <path d="M13 18.5 Q12 17.5 13 17 Q14 17.5 13 18.5Z" fill="#ffe0ec" opacity="0.65" />
            <circle cx="11.5" cy="20" r="0.7" fill="#fbbf24" opacity="0.35" />
            <circle cx="11.5" cy="19.5" r="0.25" fill="#f59e0b" opacity="0.45" />
            {/* Bottom-left near trunk */}
            <ellipse cx="17" cy="24" rx="3" ry="2.5" fill="#ffe0ec" />
            <ellipse cx="19" cy="23" rx="2.5" ry="2" fill="#f9a8d4" />
            {/* Upper-left branch tip */}
            <ellipse cx="10" cy="10" rx="4" ry="3.5" fill="#ffc0d8" />
            <ellipse cx="8" cy="9" rx="3" ry="2.5" fill="#f9a8d4" />
            <ellipse cx="12" cy="11" rx="2.5" ry="2" fill="#ffe0ec" />
            <path d="M10 7 Q9 6 10 5.5 Q11 6 10 7Z" fill="#ffe0ec" opacity="0.8" />
            <path d="M8 7.5 Q7 6.5 8 6 Q9 6.5 8 7.5Z" fill="#ffe0ec" opacity="0.7" />
            <path d="M12 9 Q11 8 12 7.5 Q13 8 12 9Z" fill="#ffe0ec" opacity="0.7" />
            <circle cx="10" cy="10" r="0.8" fill="#fbbf24" opacity="0.4" />
            <circle cx="10" cy="9.5" r="0.3" fill="#f59e0b" opacity="0.5" />
            <circle cx="8" cy="8.5" r="0.6" fill="#fbbf24" opacity="0.35" />
            {/* Upper-left mid */}
            <ellipse cx="15" cy="15" rx="3.5" ry="3" fill="#f9a8d4" />
            <ellipse cx="17" cy="16" rx="3" ry="2.5" fill="#ffc0d8" />
            <circle cx="15.5" cy="15" r="0.7" fill="#fbbf24" opacity="0.35" />
            {/* Mid-left */}
            <ellipse cx="19" cy="19" rx="3" ry="2.5" fill="#ffe0ec" />
            <circle cx="19" cy="19" r="0.6" fill="#fbbf24" opacity="0.3" />
            {/* Top-right branch tip */}
            <ellipse cx="37" cy="8" rx="4" ry="3.5" fill="#f9a8d4" />
            <ellipse cx="39" cy="7" rx="3" ry="2.5" fill="#ffc0d8" />
            <ellipse cx="35" cy="9" rx="2.5" ry="2" fill="#ffe0ec" />
            <path d="M37 5 Q36 4 37 3.5 Q38 4 37 5Z" fill="#ffe0ec" opacity="0.8" />
            <path d="M39 5 Q38 4 39 3.5 Q40 4 39 5Z" fill="#ffe0ec" opacity="0.7" />
            <path d="M35 7 Q34 6 35 5.5 Q36 6 35 7Z" fill="#ffe0ec" opacity="0.7" />
            <circle cx="37" cy="8" r="0.8" fill="#fbbf24" opacity="0.4" />
            <circle cx="37" cy="7.5" r="0.3" fill="#f59e0b" opacity="0.5" />
            <circle cx="39.5" cy="7" r="0.6" fill="#fbbf24" opacity="0.35" />
            {/* Top-right mid */}
            <ellipse cx="32" cy="12" rx="3.5" ry="3" fill="#ffc0d8" />
            <ellipse cx="30" cy="13" rx="3" ry="2.5" fill="#f9a8d4" />
            <circle cx="31.5" cy="12" r="0.7" fill="#fbbf24" opacity="0.35" />
            {/* Top-right near trunk */}
            <ellipse cx="27" cy="16" rx="3" ry="2.5" fill="#ffe0ec" />
            <circle cx="27" cy="16" r="0.6" fill="#fbbf24" opacity="0.3" />
            {/* Bottom-right branch tip */}
            <ellipse cx="43" cy="15" rx="3.5" ry="3" fill="#f9a8d4" />
            <ellipse cx="41" cy="14" rx="3" ry="2.5" fill="#ffc0d8" />
            <circle cx="42.5" cy="15" r="0.7" fill="#fbbf24" opacity="0.4" />
            {/* Bottom-right mid */}
            <ellipse cx="38" cy="18" rx="3.5" ry="3" fill="#ffe0ec" />
            <ellipse cx="36" cy="19" rx="3" ry="2.5" fill="#f9a8d4" />
            <circle cx="37.5" cy="18" r="0.7" fill="#fbbf24" opacity="0.35" />
            {/* Bottom-right near trunk */}
            <ellipse cx="33" cy="21" rx="3" ry="2.5" fill="#ffc0d8" />
            <ellipse cx="31" cy="20" rx="2.5" ry="2" fill="#ffe0ec" />
            {/* Center crown */}
            <ellipse cx="23" cy="8" rx="4.5" ry="4" fill="#ffc0d8" />
            <ellipse cx="21" cy="7" rx="3.5" ry="3" fill="#f9a8d4" />
            <ellipse cx="25" cy="9" rx="3.5" ry="3" fill="#ffe0ec" />
            <ellipse cx="23" cy="11" rx="3" ry="2.5" fill="#f9a8d4" />
            {/* Crown petal details */}
            <path d="M23 4.5 Q22 3.5 23 3 Q24 3.5 23 4.5Z" fill="#ffe0ec" opacity="0.85" />
            <path d="M20.5 5 Q19.5 4 20.5 3.5 Q21.5 4 20.5 5Z" fill="#ffe0ec" opacity="0.75" />
            <path d="M25.5 6 Q24.5 5 25.5 4.5 Q26.5 5 25.5 6Z" fill="#ffe0ec" opacity="0.75" />
            <path d="M21 9 Q20 8 21 7.5 Q22 8 21 9Z" fill="#ffe0ec" opacity="0.6" />
            <path d="M25 10.5 Q24 9.5 25 9 Q26 9.5 25 10.5Z" fill="#ffe0ec" opacity="0.6" />
            <circle cx="23" cy="8" r="1" fill="#fbbf24" opacity="0.45" />
            <circle cx="23" cy="7.5" r="0.35" fill="#f59e0b" opacity="0.55" />
            <circle cx="23.5" cy="8.4" r="0.25" fill="#f59e0b" opacity="0.4" />
            <circle cx="22.5" cy="8.3" r="0.25" fill="#f59e0b" opacity="0.4" />
            <circle cx="21" cy="6.5" r="0.7" fill="#fbbf24" opacity="0.35" />
            <circle cx="25.5" cy="9" r="0.6" fill="#fbbf24" opacity="0.3" />
            {/* Upper sub-branch tips */}
            <ellipse cx="17" cy="6" rx="3" ry="2.5" fill="#ffc0d8" />
            <circle cx="17" cy="6" r="0.6" fill="#fbbf24" opacity="0.3" />
            <ellipse cx="29" cy="6" rx="3" ry="2.5" fill="#f9a8d4" />
            <circle cx="29" cy="6" r="0.6" fill="#fbbf24" opacity="0.3" />
            {/* Mid trunk flowers */}
            <ellipse cx="24" cy="20" rx="2.5" ry="2" fill="#f9a8d4" opacity="0.85" />
            <ellipse cx="21" cy="22" rx="2" ry="1.5" fill="#ffc0d8" opacity="0.8" />
            {/* Roots — thin tendrils */}
            <path d="M20 46 C19 45 17 44.5 15 46" stroke="#5c4a3a" strokeWidth="0.7" fill="none" opacity="0.2" />
            <path d="M25 46 C26 45 28 45 31 46" stroke="#5c4a3a" strokeWidth="0.6" fill="none" opacity="0.15" />
          </g>
        )

      case 'cypress':
        if (s === 0) return (
          <g>
            <rect x="23" y="40" width="2" height="6" fill={trunk} />
            <path d="M24 28 Q27 32 26.5 38 Q26 40 24 40 Q22 40 21.5 38 Q21 32 24 28 Z" fill={color} opacity="0.7" />
            <path d="M24 30 Q25.5 34 25 38 L24 39 L24 30 Z" fill={light} opacity="0.15" />
            <path d="M23 36 Q24 35 25 36" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M23.5 32 Q24 31.5 24.5 32" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="38" width="3" height="8" fill={trunk} />
            <path d="M23 42 L25 41.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M24 16 Q28 22 27.5 30 Q27 36 26.5 38 L21.5 38 Q21 36 20.5 30 Q20 22 24 16 Z" fill={color} />
            <path d="M24 18 Q26 24 25.5 32 L24 36 L24 18 Z" fill={light} opacity="0.15" />
            <path d="M22 34 Q24 33 26 34" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M22.5 28 Q24 27 25.5 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M23 22 Q24 21.5 25 22" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <circle cx="23" cy="24" r="0.5" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M22.5 40 L25.5 39.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 43 L25 42.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <path d="M24 6 Q30 14 29 24 Q28 32 28 36 L20 36 Q20 32 19 24 Q18 14 24 6 Z" fill={color} />
            <path d="M24 8 Q27 14 26.5 22 Q26 30 26 34 L24 36 L24 8 Z" fill={light} opacity="0.18" />
            <path d="M21 30 Q24 29 27 30" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M21.5 22 Q24 21 26.5 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M22.5 14 Q24 13 25.5 14" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <circle cx="22.5" cy="18" r="0.6" fill={light} opacity="0.15" />
            <circle cx="23" cy="26" r="0.5" fill={light} opacity="0.12" />
          </g>
        )
        return (
          <g>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M22.5 40 L25.5 39.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 43 L25.5 42.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M24 4 Q32 14 30 24 Q28 34 28 38 L20 38 Q20 34 18 24 Q16 14 24 4 Z" fill={color} />
            <path d="M24 4 Q28 10 27 18 Q26 26 26 34 L24 36 L24 4 Z" fill={light} opacity="0.2" />
            <path d="M22 38 Q20 34 19 28" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M20 32 Q24 31 28 32" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M20.5 26 Q24 25 27.5 26" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.1" />
            <path d="M21 20 Q24 19 27 20" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.1" />
            <path d="M22 14 Q24 13 26 14" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M23 8 Q24 7 25 8" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.08" />
            <path d="M21.5 15 Q22 13.5 22.8 15 Q22.5 17 21.5 16 Z" fill={light} opacity="0.15" />
            <path d="M22.2 23 Q23 21.5 23.5 23 Q23.2 25 22.2 24 Z" fill={light} opacity="0.12" />
            <path d="M21.8 31 Q22.5 29.5 23.2 31 Q22.8 33 21.8 32 Z" fill={light} opacity="0.1" />
            <path d="M22.5 9 Q23 7.8 23.5 9 Q23.2 10.5 22.5 10 Z" fill={light} opacity="0.12" />
            <path d="M20 28 Q19.5 26 20.2 24 Q20.5 26 20 28 Z" fill={dark} opacity="0.08" />
            <path d="M27.5 20 Q28 18 27.8 16 Q27.2 18 27.5 20 Z" fill={dark} opacity="0.07" />
            <circle cx="22" cy="10" r="0.5" fill={light} opacity="0.3" />
            <circle cx="25" cy="16" r="0.5" fill={light} opacity="0.25" />
            <circle cx="21" cy="22" r="0.45" fill={light} opacity="0.25" />
            <circle cx="26" cy="28" r="0.5" fill={light} opacity="0.2" />
            <circle cx="23" cy="34" r="0.45" fill={light} opacity="0.2" />
            <circle cx="25" cy="8" r="0.45" fill={light} opacity="0.25" />
            <circle cx="21" cy="30" r="0.4" fill={light} opacity="0.2" />
            <circle cx="26" cy="20" r="0.45" fill={light} opacity="0.2" />
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'cherry':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 38 Q20 36 18 37" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M24 38 Q28 36 30 37" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M16 37 C14 35 15 33 17 32 C19 31 21 33 20 35 C19 37 17 38 16 37 Z" fill={color} />
            <path d="M28 37 C30 35 30 33 28 33 C26 33 26 35 28 37 Z" fill={color} opacity="0.9" />
            <circle cx="18" cy="34" r="0.5" fill="#ffb7c5" opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Trunk — tapered with bark hint */}
            <path d="M23.5 46 Q23 42 23.5 36 Q24 32 24 30" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24.5 42 24.2 36" stroke={dark} strokeWidth="0.4" opacity="0.2" fill="none" />
            {/* Branches — thin, forking */}
            <path d="M23.8 34 Q19 30 14 27" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M14 27 Q12 26 10 27" stroke={trunk} strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q29 28 34 25" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M34 25 Q36 24 37 25" stroke={trunk} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M24 31 Q24 27 23 24" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M16 29 Q14 28 13 29" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M30 27 Q32 26 33 27" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            {/* Back blobs */}
            <path d="M10 24 C8 21 9 18 12 17 C15 16 18 18 17 21 C16 24 12 26 10 24 Z" fill={dark} opacity="0.85" />
            <path d="M30 22 C32 19 35 19 36 22 C37 25 34 27 31 25 C29 24 29 23 30 22 Z" fill={dark} opacity="0.8" />
            <path d="M20 22 C18 19 20 16 23 17 C26 18 26 22 23 24 C21 25 19 24 20 22 Z" fill={dark} opacity="0.75" />
            {/* Front blobs */}
            <path d="M8 25 C6 22 8 18 11 18 C14 18 16 20 15 23 C14 26 10 27 8 25 Z" fill={color} />
            <path d="M14 22 C12 19 14 16 18 17 C21 18 21 22 18 24 C16 25 14 24 14 22 Z" fill={color} />
            <path d="M22 20 C20 17 22 15 25 15 C28 15 29 18 27 21 C25 23 22 23 22 20 Z" fill={color} opacity="0.95" />
            <path d="M31 22 C33 19 36 20 36 23 C36 26 33 27 31 25 C30 24 30 23 31 22 Z" fill={color} opacity="0.9" />
            <path d="M18 25 C17 23 18 21 20 21 C22 21 23 23 22 25 C21 27 19 27 18 25 Z" fill={color} opacity="0.85" />
            {/* Blossom hints */}
            <circle cx="12" cy="20" r="0.8" fill="#ffb7c5" opacity="0.4" />
            <circle cx="25" cy="17" r="0.7" fill="#ffb7c5" opacity="0.35" />
            <circle cx="34" cy="22" r="0.6" fill="#ffb7c5" opacity="0.3" />
            {/* Dot texture */}
            <circle cx="14" cy="19" r="0.4" fill={light} opacity="0.3" />
            <circle cx="22" cy="18" r="0.4" fill={light} opacity="0.3" />
            <circle cx="30" cy="21" r="0.35" fill={light} opacity="0.25" />
            <circle cx="17" cy="23" r="0.35" fill={light} opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Trunk — tapered with bark lines */}
            <path d="M22.5 46 Q21.5 42 22 37 Q22.5 34 23 32" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24.5 46 Q25 42 24.5 37" stroke={dark} strokeWidth="0.5" opacity="0.15" fill="none" />
            <path d="M23 40 L23.5 39" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M23 37 L23.8 36.5" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* Branches — thinner, more forks */}
            <path d="M23 34 Q16 28 10 25" stroke={trunk} strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <path d="M10 25 Q8 24 7 25" stroke={trunk} strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M13 27 Q11 26 9 27" stroke={trunk} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q31 26 38 23" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M38 23 Q40 22 41 23" stroke={trunk} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M34 25 Q36 24 38 25" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M23.5 33 Q23.5 27 23 22" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q21 24 19 25" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M23.5 24 Q26 23 28 24" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M16 27 Q14 25 12 26" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M31 25 Q33 23 35 24" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            {/* Back layer */}
            <path d="M6 24 C4 20 6 16 10 15 C14 14 17 17 15 21 C13 25 8 27 6 24 Z" fill={dark} opacity="0.85" />
            <path d="M34 22 C36 18 40 18 41 22 C42 26 38 28 35 26 C33 24 33 23 34 22 Z" fill={dark} opacity="0.8" />
            <path d="M18 20 C16 16 19 13 23 14 C27 15 28 19 25 22 C22 24 19 23 18 20 Z" fill={dark} opacity="0.8" />
            <path d="M28 18 C30 15 34 15 35 18 C36 21 33 23 30 22 C28 21 27 19 28 18 Z" fill={dark} opacity="0.75" />
            <path d="M10 20 C9 17 11 14 14 14 C17 14 19 17 17 20 C15 23 11 23 10 20 Z" fill={dark} opacity="0.7" />
            {/* Front layer */}
            <path d="M5 25 C3 21 5 17 9 16 C13 15 16 18 14 22 C12 26 7 28 5 25 Z" fill={color} />
            <path d="M12 21 C10 17 13 14 17 14 C21 14 23 18 20 22 C17 25 13 24 12 21 Z" fill={color} />
            <path d="M20 18 C18 14 21 12 25 12 C29 12 31 16 28 20 C25 23 21 22 20 18 Z" fill={color} />
            <path d="M28 20 C30 16 34 16 36 20 C38 24 34 26 31 24 C29 23 27 22 28 20 Z" fill={color} opacity="0.95" />
            <path d="M36 22 C38 18 42 19 42 23 C42 27 38 28 36 26 C35 25 35 23 36 22 Z" fill={color} opacity="0.9" />
            <path d="M15 26 C14 24 15 22 17 22 C19 22 20 24 19 26 C18 28 16 28 15 26 Z" fill={color} opacity="0.9" />
            <path d="M25 24 C24 22 25 20 27 20 C29 20 30 22 29 24 C28 26 26 26 25 24 Z" fill={color} opacity="0.85" />
            {/* Blossom hints */}
            <circle cx="10" cy="18" r="1" fill="#ffb7c5" opacity="0.35" />
            <circle cx="24" cy="14" r="0.9" fill="#ffb7c5" opacity="0.3" />
            <circle cx="36" cy="20" r="0.8" fill="#ffb7c5" opacity="0.3" />
            <circle cx="18" cy="16" r="0.7" fill="#ffb7c5" opacity="0.25" />
            {/* Cherry pairs */}
            <path d="M8 27 L7 28.5 M8 27 L9.5 28.5" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="6.5" cy="29.5" r="1.1" fill="#cc2244" />
            <circle cx="10" cy="29.5" r="1.1" fill="#cc2244" />
            <circle cx="6.2" cy="29" r="0.3" fill="#ff6688" opacity="0.35" />
            <path d="M38 25 L37 26.5 M38 25 L39.5 26.5" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="36.5" cy="27.5" r="1" fill="#cc2244" />
            <circle cx="40" cy="27.5" r="1" fill="#cc2244" />
            <circle cx="36.2" cy="27" r="0.3" fill="#ff6688" opacity="0.3" />
            {/* Dot texture */}
            <circle cx="12" cy="17" r="0.4" fill={light} opacity="0.3" />
            <circle cx="22" cy="15" r="0.4" fill={light} opacity="0.3" />
            <circle cx="32" cy="19" r="0.4" fill={light} opacity="0.25" />
            <circle cx="16" cy="22" r="0.35" fill={light} opacity="0.25" />
            <circle cx="28" cy="22" r="0.35" fill={light} opacity="0.25" />
            <circle cx="38" cy="22" r="0.35" fill={light} opacity="0.2" />
            {/* Root hint */}
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
          </g>
        )
        return (
          <g>
            {/* Trunk — tapered with bark texture */}
            <path d="M22 46 Q21 42 21.5 37 Q22 33 23 29" stroke={trunk} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M24.5 46 Q25 42 24.5 37 Q24 34 23.5 31" stroke={dark} strokeWidth="0.6" opacity="0.15" fill="none" />
            <path d="M22.5 42 L23.5 41.5" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M22 39 L23 38.5" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M22 36 L23 35.5" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            {/* Main branches — organic, forking */}
            <path d="M23 31 Q16 25 9 21" stroke={trunk} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M9 21 Q7 20 5 21" stroke={trunk} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M12 23 Q10 21 8 22" stroke={trunk} strokeWidth="0.7" fill="none" strokeLinecap="round" />
            <path d="M15 24 Q13 23 11 24" stroke={trunk} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            <path d="M23 29 Q31 23 39 19" stroke={trunk} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M39 19 Q41 18 42 19" stroke={trunk} strokeWidth="0.7" fill="none" strokeLinecap="round" />
            <path d="M35 21 Q37 20 39 21" stroke={trunk} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M32 22 Q34 21 36 22" stroke={trunk} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            <path d="M23 29 Q23.5 23 23 17" stroke={trunk} strokeWidth="1.1" fill="none" strokeLinecap="round" />
            <path d="M23 21 Q21 19 19 20" stroke={trunk} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            <path d="M23.2 19 Q25 17 27 18" stroke={trunk} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            <path d="M23 24 Q20 22 18 23" stroke={trunk} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            <path d="M23.5 26 Q26 24 28 25" stroke={trunk} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            {/* Back layer — dark blobs */}
            <path d="M4 18 C2 14 4 10 8 8 C12 6 16 9 14 14 C12 18 6 21 4 18 Z" fill={dark} opacity="0.9" />
            <path d="M14 14 C12 10 15 7 19 7 C23 7 25 10 23 14 C21 17 16 17 14 14 Z" fill={dark} opacity="0.85" />
            <path d="M22 12 C20 8 23 5 28 6 C32 7 33 11 30 14 C27 17 23 16 22 12 Z" fill={dark} opacity="0.85" />
            <path d="M32 14 C34 10 38 10 40 14 C42 18 38 20 35 18 C33 17 31 16 32 14 Z" fill={dark} opacity="0.8" />
            <path d="M8 22 C6 19 8 16 11 16 C14 16 15 19 13 22 C11 24 9 24 8 22 Z" fill={dark} opacity="0.8" />
            <path d="M28 10 C26 7 29 5 33 6 C36 7 37 10 34 12 C32 14 29 13 28 10 Z" fill={dark} opacity="0.75" />
            {/* Front layer */}
            <path d="M3 20 C1 15 3 10 7 9 C11 8 14 10 13 14 C12 18 5 22 3 20 Z" fill={color} />
            <path d="M10 16 C8 12 10 8 15 8 C19 8 21 12 18 16 C16 19 11 19 10 16 Z" fill={color} />
            <path d="M17 12 C15 8 18 5 23 6 C27 7 28 11 25 14 C22 17 18 16 17 12 Z" fill={color} />
            <path d="M26 10 C28 6 32 6 34 10 C36 14 32 16 29 14 C27 13 25 12 26 10 Z" fill={color} opacity="0.95" />
            <path d="M34 14 C36 10 40 11 41 15 C42 19 38 21 35 19 C33 18 33 16 34 14 Z" fill={color} opacity="0.95" />
            <path d="M6 22 C5 19 7 17 9 17 C11 17 12 19 11 22 C10 24 7 24 6 22 Z" fill={color} opacity="0.9" />
            <path d="M15 20 C14 17 15 15 18 15 C21 15 22 18 20 21 C18 23 15 23 15 20 Z" fill={color} opacity="0.9" />
            <path d="M24 18 C23 15 24 13 27 13 C30 13 31 16 29 19 C27 21 24 21 24 18 Z" fill={color} opacity="0.9" />
            <path d="M33 18 C35 15 38 16 38 19 C38 22 35 23 33 21 C32 20 32 19 33 18 Z" fill={color} opacity="0.85" />
            <path d="M19 24 C18 22 19 20 21 20 C23 20 24 22 23 24 C22 26 20 26 19 24 Z" fill={color} opacity="0.85" />
            <path d="M28 22 C27 20 28 18 30 18 C32 18 33 20 32 22 C31 24 29 24 28 22 Z" fill={color} opacity="0.8" />
            {/* Leaf vein texture */}
            <path d="M3 20 Q8 14 13 14" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.18" />
            <path d="M5 18 Q7 16 9 14" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M10 16 Q13 12 18 10" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.18" />
            <path d="M12 14 Q14 12 16 10" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M17 12 Q21 8 25 8" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.18" />
            <path d="M19 11 Q21 9 23 8" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M26 10 Q30 8 34 10" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M34 14 Q37 12 41 15" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M36 16 Q38 14 40 14" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M15 20 Q17 18 18 16" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M24 18 Q26 16 27 14" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            {/* Extra vein texture */}
            <path d="M6 22 Q9 18 11 17" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.1" />
            <path d="M15 20 Q17 17 19 16" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.1" />
            <path d="M33 18 Q35 16 37 15" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.1" />
            <path d="M28 22 Q30 19 31 18" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.08" />
            <path d="M8 16 Q10 14 12 12" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.08" />
            {/* Stipple texture on leaves */}
            <circle cx="6" cy="15" r="0.6" fill={dark} opacity="0.08" />
            <circle cx="10" cy="12" r="0.5" fill={dark} opacity="0.07" />
            <circle cx="14" cy="10" r="0.5" fill={dark} opacity="0.07" />
            <circle cx="20" cy="9" r="0.55" fill={dark} opacity="0.08" />
            <circle cx="26" cy="8" r="0.5" fill={dark} opacity="0.07" />
            <circle cx="30" cy="10" r="0.5" fill={dark} opacity="0.06" />
            <circle cx="36" cy="14" r="0.5" fill={dark} opacity="0.07" />
            <circle cx="39" cy="17" r="0.5" fill={dark} opacity="0.06" />
            <circle cx="18" cy="18" r="0.5" fill={dark} opacity="0.06" />
            <circle cx="28" cy="17" r="0.5" fill={dark} opacity="0.06" />
            <circle cx="4" cy="17" r="0.45" fill={dark} opacity="0.06" />
            <circle cx="8" cy="14" r="0.4" fill={dark} opacity="0.06" />
            <circle cx="22" cy="12" r="0.45" fill={dark} opacity="0.06" />
            <circle cx="34" cy="12" r="0.4" fill={dark} opacity="0.05" />
            <circle cx="16" cy="16" r="0.4" fill={dark} opacity="0.05" />
            <circle cx="32" cy="16" r="0.45" fill={dark} opacity="0.05" />
            {/* Blossom spots */}
            <circle cx="9" cy="12" r="1.2" fill="#ffb7c5" opacity="0.2" />
            <circle cx="21" cy="9" r="1" fill="#ffb7c5" opacity="0.18" />
            <circle cx="33" cy="10" r="1" fill="#ffb7c5" opacity="0.18" />
            <circle cx="15" cy="15" r="0.8" fill="#ffb7c5" opacity="0.15" />
            <circle cx="27" cy="14" r="0.8" fill="#ffb7c5" opacity="0.15" />
            {/* Cherry pairs hanging */}
            <path d="M6 23 L5 24.5 M6 23 L7.5 24.5" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="4.5" cy="25.5" r="1.2" fill="#cc2244" />
            <circle cx="8" cy="25.5" r="1.2" fill="#cc2244" />
            <circle cx="4.2" cy="25" r="0.35" fill="#ff6688" opacity="0.35" />
            <path d="M41 19 L40 20.5 M41 19 L42.5 20.5" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="39.5" cy="21.5" r="1.2" fill="#cc2244" />
            <circle cx="43" cy="21.5" r="1.1" fill="#cc2244" />
            <circle cx="39.2" cy="21" r="0.35" fill="#ff6688" opacity="0.35" />
            <path d="M13 25 L12 26.5 M13 25 L14.5 26.5" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="11.5" cy="27.5" r="1" fill="#cc2244" />
            <circle cx="15" cy="27.5" r="1" fill="#cc2244" />
            <circle cx="11.2" cy="27" r="0.3" fill="#ff6688" opacity="0.3" />
            <path d="M35 21 L34 22.5 M35 21 L36.5 22.5" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="33.5" cy="23.5" r="1" fill="#cc2244" />
            <circle cx="37" cy="23.5" r="1" fill="#cc2244" />
            <path d="M22 23 L21 24.5 M22 23 L23.5 24.5" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="20.5" cy="25.5" r="0.9" fill="#cc2244" opacity="0.8" />
            <circle cx="24" cy="25.5" r="0.9" fill="#cc2244" opacity="0.8" />
            {/* Dot texture */}
            <circle cx="8" cy="11" r="0.5" fill={light} opacity="0.12" />
            <circle cx="16" cy="10" r="0.5" fill={light} opacity="0.12" />
            <circle cx="24" cy="9" r="0.5" fill={light} opacity="0.1" />
            <circle cx="32" cy="11" r="0.45" fill={light} opacity="0.1" />
            <circle cx="38" cy="14" r="0.45" fill={light} opacity="0.1" />
            <circle cx="12" cy="16" r="0.4" fill={light} opacity="0.1" />
            <circle cx="20" cy="15" r="0.4" fill={light} opacity="0.08" />
            {/* Root hints */}
            <path d="M20 46 Q17 44.5 14 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M25 46 Q28 44.5 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      case 'lemon':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 35" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 40 L24.5 40" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* Dark pointed leaves */}
            <path d="M24 36 Q21 33 19 34 L24 31 Z" fill="#2e5e1e" opacity="0.8" />
            <path d="M24 36 Q27 33 29 34 L24 31 Z" fill="#3a6e28" opacity="0.7" />
            <path d="M24 31 Q23 28 24 27 Q25 28 24 31 Z" fill="#2e5e1e" opacity="0.6" />
            {/* Leaf veins */}
            <path d="M22 33 L24 35" stroke="#1e4e14" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M26 33 L24 35" stroke="#1e4e14" strokeWidth="0.3" fill="none" opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 26" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23.5 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* Tall oval/columnar canopy — taller than wide */}
            <path d="M18 22 C17 16 19 10 24 8 C29 10 31 16 30 22 C31 26 29 30 24 30 C19 30 17 26 18 22 Z" fill="#2e5e1e" />
            {/* Pointed leaf edges */}
            <path d="M17 20 Q15 18 17 16 Q18 18 17 20" fill="#2e5e1e" opacity="0.7" />
            <path d="M31 18 Q33 16 32 14 Q30 16 31 18" fill="#2e5e1e" opacity="0.6" />
            {/* Individual lancet leaves at edges */}
            <path d="M18 24 Q16 22 17 20 Q19 22 18 24 Z" fill="#3a6e28" opacity="0.5" />
            <path d="M30 14 Q31 12 30 10 Q29 12 30 14 Z" fill="#3a6e28" opacity="0.4" />
            {/* Glossy highlight */}
            <path d="M20 16 Q21 12 22 12 Q23 12 24 16 Q23 20 22 20 Q21 20 20 16 Z" fill="#4a8c3a" opacity="0.15" />
            {/* One lemon */}
            <path d="M27 17.5 Q28.5 18 28.8 20 Q28.5 22 27 22.5 Q25.5 22 25.2 20 Q25.5 18 27 17.5 Z" fill={color} />
            <path d="M27.8 18.2 Q28 17.8 27.5 18" stroke="#c8a800" strokeWidth="0.3" fill="none" opacity="0.2" />
            <circle cx="26.3" cy="19" r="0.4" fill="white" opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 Q22 40 22 34 L26 34 Q26 40 25 46 Z" fill={trunk} />
            <path d="M23 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 42 L25 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            {/* Tall columnar canopy */}
            <path d="M16 20 C15 12 18 6 24 4 C30 6 33 12 32 20 C33 26 30 32 24 33 C18 32 15 26 16 20 Z" fill="#2e5e1e" />
            {/* Pointed leaf edges */}
            <path d="M15 18 Q13 16 15 14 Q16 16 15 18" fill="#2e5e1e" opacity="0.7" />
            <path d="M33 16 Q35 14 34 12 Q32 14 33 16" fill="#2e5e1e" opacity="0.6" />
            <path d="M16 26 Q14 24 15 22 Q17 24 16 26 Z" fill="#3a6e28" opacity="0.5" />
            <path d="M32 10 Q33 8 32 6 Q31 8 32 10 Z" fill="#3a6e28" opacity="0.4" />
            {/* Glossy highlight */}
            <path d="M18.5 14 Q19.5 8 21 8 Q22.5 8 23.5 14 Q22.5 20 21 20 Q19.5 20 18.5 14 Z" fill="#4a8c3a" opacity="0.12" />
            {/* Lemons — oval with pointed tip */}
            <path d="M19 19.2 Q20.6 19.5 20.8 22 Q20.5 24.5 19 24.8 Q17.4 24.5 17.2 22 Q17.4 19.5 19 19.2 Z" fill={color} />
            <path d="M19 19.8 Q18.5 19 19.2 19.5" stroke={light} strokeWidth="0.3" fill="none" opacity="0.3" />
            <circle cx="18.2" cy="21" r="0.4" fill="white" opacity="0.18" />
            <path d="M19.5 24.2 Q19.8 24.8 19.2 24.5" fill="#c8a800" opacity="0.2" />
            <path d="M30 13.5 Q31.4 14 31.6 16 Q31.4 18.2 30 18.5 Q28.6 18 28.4 16 Q28.6 14 30 13.5 Z" fill={color} />
            <circle cx="29.2" cy="15" r="0.35" fill="white" opacity="0.15" />
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            {/* Straight trunk */}
            <path d="M22 46 C22 42 22.5 38 23 34 Q23.5 32 24 30" fill="none" stroke={trunk} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M22 46 C22 42 22.5 38 23 34 Q23.5 32 24 30" fill="none" stroke={dark} strokeWidth="1.2" opacity="0.12" strokeLinecap="round" />
            {/* Short side branches */}
            <path d="M23 36 Q21 34 19 35" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M23 32 Q25 30 27 31" stroke={trunk} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* Tall columnar canopy — distinctly taller than wide */}
            <path d="M14 18 C13 10 16 3 24 1 C32 3 35 10 34 18 C35 26 32 33 24 34 C16 33 13 26 14 18 Z" fill="#2e5e1e" />
            {/* Bottom shadow */}
            <path d="M16 28 C20 34 28 34 32 28" fill="#1e4e14" opacity="0.15" />
            {/* Top highlight */}
            <path d="M20 6 C22 3 26 3 28 6 Q26 4 24 4 Q22 4 20 6 Z" fill="#4a8c3a" opacity="0.12" />
            {/* Pointed leaf edges all around */}
            <path d="M13 16 Q11 14 13 12 Q14 14 13 16" fill="#2e5e1e" />
            <path d="M35 14 Q37 12 36 10 Q34 12 35 14" fill="#2e5e1e" />
            <path d="M14 24 Q12 22 13 20 Q15 22 14 24 Z" fill="#3a6e28" opacity="0.6" />
            <path d="M34 22 Q36 20 35 18 Q33 20 34 22 Z" fill="#3a6e28" opacity="0.5" />
            <path d="M16 8 Q15 6 16 4 Q17 6 16 8 Z" fill="#3a6e28" opacity="0.5" />
            <path d="M32 6 Q33 4 32 2 Q31 4 32 6 Z" fill="#3a6e28" opacity="0.45" />
            {/* Lemons with pointed tips and small leaf at stem */}
            <ellipse cx="18" cy="22" rx="1.8" ry="2.8" fill={color} transform="rotate(-5 18 22)" />
            <path d="M18 19.5 L18.3 18.5" stroke="#3a6e28" strokeWidth="0.4" strokeLinecap="round" />
            <path d="M18.3 18.5 Q19 18 18.8 18.8" fill="#3a6e28" opacity="0.5" />
            <circle cx="17" cy="21" r="0.45" fill="white" opacity="0.2" />
            <ellipse cx="30" cy="18" rx="1.6" ry="2.5" fill={color} transform="rotate(8 30 18)" />
            <path d="M30 15.8 L30.3 14.8" stroke="#3a6e28" strokeWidth="0.4" strokeLinecap="round" />
            <path d="M30.3 14.8 Q31 14.5 30.8 15.2" fill="#3a6e28" opacity="0.5" />
            <circle cx="29" cy="17" r="0.4" fill="white" opacity="0.18" />
            <ellipse cx="24" cy="12" rx="1.5" ry="2.3" fill={color} opacity="0.8" transform="rotate(-3 24 12)" />
            <circle cx="23" cy="11" r="0.35" fill="white" opacity="0.15" />
            <ellipse cx="16" cy="14" rx="1.3" ry="2" fill={color} opacity="0.7" transform="rotate(-10 16 14)" />
            <ellipse cx="32" cy="10" rx="1.2" ry="1.8" fill={color} opacity="0.65" transform="rotate(12 32 10)" />
            <ellipse cx="22" cy="26" rx="1.4" ry="2.2" fill={color} opacity="0.6" />
            <circle cx="14" cy="10" r="0.6" fill={light} opacity="0.3" />
            <circle cx="22" cy="8" r="0.55" fill={light} opacity="0.3" />
            <circle cx="34" cy="12" r="0.55" fill={light} opacity="0.25" />
            <circle cx="10" cy="18" r="0.5" fill={light} opacity="0.25" />
            <circle cx="38" cy="16" r="0.5" fill={light} opacity="0.2" />
            <circle cx="26" cy="14" r="0.55" fill={light} opacity="0.25" />
            <circle cx="16" cy="22" r="0.5" fill={light} opacity="0.2" />
            <circle cx="30" cy="20" r="0.5" fill={light} opacity="0.2" />
            <circle cx="20" cy="16" r="0.5" fill={light} opacity="0.2" />
            <circle cx="36" cy="22" r="0.5" fill={light} opacity="0.2" />
            <path d="M21 46 C19 45 17 45 15 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 C27 45 29 45 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )
      case 'plum':
        if (s === 0) return (
          <g>
            <path d="M26 46 Q27 42 26 37" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M25.5 40 L26.5 40" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M26 38 C22 35 19 33 20 36 C21 38 24 37 26 38 Z" fill={color} opacity="0.7" />
            <path d="M26 38 C30 35 32 34 31 37 C30 38 28 37 26 38 Z" fill={color} opacity="0.5" />
            <path d="M26 36 C25 34 25 32 26 31 C27 32 27 34 26 36 Z" fill={color} opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M26 46 Q28 40 27 30" stroke={trunk} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M26.5 38 L27.8 37.8" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <path d="M27 34 Q20 30 14 28" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M27 32 Q31 30 34 29" stroke={trunk} strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M8 18 C7 12 11 8 18 7 Q22 6.5 26 8 C32 10 34 14 33 20 C34 26 30 30 24 30 Q18 30 14 28 C9 26 7 22 8 18 Z" fill={color} />
            <path d="M14 12 C12 9 15 7 19 8 C22 9 22 13 18 15 Z" fill={light} opacity="0.2" />
            <path d="M28 22 C30 19 33 20 32 24 Z" fill={dark} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M27 46 Q27.5 40 27 34" stroke={trunk} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M27 38 L27.8 37.8" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <path d="M27 36 Q18 30 10 28" stroke={trunk} strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <path d="M27 34 Q33 30 37 29" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M27 34 Q24 28 20 26" stroke={trunk} strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M6 16 C5 8 10 4 18 3 Q22 2.5 26 4 C33 6 36 12 35 18 C36 24 32 30 26 31 Q20 32 14 30 C8 28 5 22 6 16 Z" fill={color} />
            <path d="M12 8 C9 5 12 2 18 4 C22 5 22 10 16 12 Z" fill={light} opacity="0.18" />
            <path d="M30 20 C33 17 36 18 34 24 Z" fill={dark} opacity="0.15" />
            <path d="M10 22 C8 20 10 18 12 20 C14 22 12 24 10 22 Z" fill={light} opacity="0.1" />
            <path d="M12 22 L12.5 24" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <ellipse cx="11.5" cy="25" rx="1.3" ry="1.6" fill="#6b2fa0" />
            <ellipse cx="13" cy="25.5" rx="1.2" ry="1.5" fill="#6b2fa0" opacity="0.9" />
            <circle cx="11" cy="24.5" r="0.35" fill="#c090e0" opacity="0.3" />
            <path d="M32 16 L32.5 18" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <ellipse cx="32" cy="19" rx="1.2" ry="1.5" fill="#6b2fa0" />
            <ellipse cx="33.2" cy="19.5" rx="1.1" ry="1.4" fill="#6b2fa0" opacity="0.85" />
            <path d="M25 46 Q23 45 21 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M29 46 Q31 45 33 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M26 46 Q28 40 27.5 35 Q27 31 26 28" fill="none" stroke={trunk} strokeWidth="3.3" strokeLinecap="round" />
            <path d="M26 46 Q28 40 27.5 35 Q27 31 26 28" fill="none" stroke={dark} strokeWidth="0.7" opacity="0.12" strokeLinecap="round" />
            <path d="M26 30 Q18 24 10 20" stroke={trunk} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M27 28 Q33 24 38 22" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M26 28 Q22 22 18 20" stroke={trunk} strokeWidth="1.1" fill="none" strokeLinecap="round" />
            <path d="M26 28 Q26 22 26 16" stroke={trunk} strokeWidth="0.9" fill="none" strokeLinecap="round" />
            {/* Back layer — dark blobs, packed */}
            <path d="M4 16 C2 12 4 8 8 6 C12 4 16 8 14 12 C12 16 6 18 4 16 Z" fill={dark} opacity="0.9" />
            <path d="M14 10 C12 6 15 3 20 4 C24 5 26 10 22 14 C19 17 15 14 14 10 Z" fill={dark} opacity="0.9" />
            <path d="M24 8 C26 4 30 4 32 8 C34 12 30 14 27 12 C25 11 23 10 24 8 Z" fill={dark} opacity="0.85" />
            <path d="M32 12 C34 8 38 9 38 13 C38 16 35 18 33 16 C31 14 31 13 32 12 Z" fill={dark} opacity="0.85" />
            <path d="M6 22 C4 18 6 16 10 16 C14 16 15 19 12 22 C10 24 7 24 6 22 Z" fill={dark} opacity="0.8" />
            <path d="M18 18 C16 14 18 12 22 12 C25 12 27 16 24 19 C22 21 19 20 18 18 Z" fill={dark} opacity="0.8" />
            <path d="M30 16 C32 12 36 14 36 18 C36 21 33 22 31 20 C29 18 29 17 30 16 Z" fill={dark} opacity="0.75" />
            {/* Front layer — main color, solid, dense blobs */}
            <path d="M3 18 C1 14 3 9 7 7 C11 5 15 8 13 13 C11 17 5 20 3 18 Z" fill={color} />
            <path d="M10 12 C8 8 11 4 16 5 C20 6 22 10 18 14 C15 17 11 16 10 12 Z" fill={color} />
            <path d="M20 8 C18 4 21 2 26 3 C30 4 32 8 28 12 C25 15 21 13 20 8 Z" fill={color} />
            <path d="M30 10 C32 6 36 7 37 11 C38 15 35 17 32 14 C30 13 29 12 30 10 Z" fill={color} opacity="0.95" />
            <path d="M36 16 C38 13 40 14 40 17 C40 20 37 21 36 19 C35 18 35 17 36 16 Z" fill={color} opacity="0.9" />
            <path d="M5 23 C3 20 5 17 9 17 C12 17 14 20 11 23 C9 25 6 25 5 23 Z" fill={color} opacity="0.95" />
            <path d="M14 20 C12 16 14 14 18 14 C22 14 23 18 20 21 C17 23 15 22 14 20 Z" fill={color} opacity="0.9" />
            <path d="M24 16 C22 12 25 10 29 11 C32 12 33 16 29 18 C27 20 25 19 24 16 Z" fill={color} opacity="0.9" />
            <path d="M32 20 C34 17 37 18 37 21 C37 24 34 25 32 23 C31 22 31 21 32 20 Z" fill={color} opacity="0.85" />
            <path d="M10 26 C9 24 10 22 12 22 C14 22 15 24 14 26 C13 28 11 28 10 26 Z" fill={color} opacity="0.85" />
            <path d="M20 24 C19 22 20 20 22 20 C24 20 25 22 24 24 C23 26 21 26 20 24 Z" fill={color} opacity="0.8" />
            {/* Plum fruits */}
            <path d="M8 22 L8.5 24" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="8" cy="25.5" r="1.4" fill="#6b2fa0" />
            <circle cx="9.5" cy="26" r="1.3" fill="#6b2fa0" opacity="0.9" />
            <circle cx="7.3" cy="25" r="0.4" fill="#9b5fc0" opacity="0.35" />
            <path d="M36 18 L36.5 20" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="36.5" cy="21.5" r="1.4" fill="#6b2fa0" />
            <circle cx="37.8" cy="22" r="1.3" fill="#6b2fa0" opacity="0.9" />
            <circle cx="35.8" cy="21" r="0.4" fill="#9b5fc0" opacity="0.35" />
            <path d="M16 24 L15 27" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="14.5" cy="28.5" r="1.3" fill="#6b2fa0" />
            <circle cx="15.8" cy="29" r="1.2" fill="#6b2fa0" opacity="0.85" />
            <circle cx="13.8" cy="28" r="0.35" fill="#9b5fc0" opacity="0.3" />
            <circle cx="24.5" cy="19" r="1.3" fill="#6b2fa0" opacity="0.8" />
            <circle cx="25.5" cy="19.5" r="1.2" fill="#6b2fa0" opacity="0.7" />
            <circle cx="20.5" cy="13" r="1.2" fill="#6b2fa0" opacity="0.65" />
            {/* Dot texture */}
            <circle cx="8" cy="10" r="0.5" fill={light} opacity="0.3" />
            <circle cx="16" cy="7" r="0.5" fill={light} opacity="0.3" />
            <circle cx="24" cy="6" r="0.5" fill={light} opacity="0.3" />
            <circle cx="32" cy="9" r="0.45" fill={light} opacity="0.25" />
            <circle cx="38" cy="14" r="0.45" fill={light} opacity="0.25" />
            <circle cx="12" cy="14" r="0.4" fill={light} opacity="0.25" />
            <circle cx="20" cy="12" r="0.4" fill={light} opacity="0.25" />
            <circle cx="28" cy="14" r="0.4" fill={light} opacity="0.2" />
            <circle cx="14" cy="20" r="0.4" fill={light} opacity="0.2" />
            <path d="M25 46 Q22 44.5 19 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M29 46 Q32 44.5 35 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <circle cx="35" cy="16" r="0.3" fill={light} opacity="0.3" />
          </g>
        )
      case 'pineapple':
        if (s === 0) return (
          <g>
            {/* Small rosette of leaves */}
            <path d="M24 46 Q20 44 16 42" stroke="#5a8c3f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q28 44 32 42" stroke="#4a7c35" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q24 42 24 40" stroke="#5a8c3f" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q22 43 18 41" stroke="#4a7c35" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q26 43 30 41" stroke="#5a8c3f" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Rosette base */}
            <path d="M24 46 Q16 42 10 40" stroke="#5a8c3f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q32 42 38 40" stroke="#4a7c35" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q20 42 14 39" stroke="#4a7c35" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q28 42 34 39" stroke="#5a8c3f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q24 40 24 36" stroke="#6ab04c" strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Small fruit bud */}
            <path d="M21.5 34 Q22 31 24 31 Q26 31 26.5 34 Q26 37 24 37 Q22 37 21.5 34 Z" fill="#d4a017" />
            <path d="M22.5 33 L25.5 33 M22 34.5 L26 34.5" stroke="#a0780a" strokeWidth="0.3" fill="none" opacity="0.4" />
            {/* Tiny crown */}
            <path d="M24 31 L23 29 M24 31 L24 28.5 M24 31 L25 29" stroke="#5a8c3f" strokeWidth="0.6" fill="none" strokeLinecap="round" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-pine`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0a81c" />
                <stop offset="40%" stopColor="#c4891a" />
                <stop offset="100%" stopColor="#9a6b12" />
              </linearGradient>
            </defs>
            {/* Rosette leaves */}
            <path d="M24 46 Q14 42 6 40" stroke="#5a8c3f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q34 42 42 40" stroke="#4a7c35" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q18 42 10 38" stroke="#4a7c35" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q30 42 38 38" stroke="#5a8c3f" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q22 42 16 37" stroke="#6ab04c" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q26 42 32 37" stroke="#6ab04c" strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Fruit body — sits on rosette */}
            <path d="M19.5 38 Q20 32.5 24 32.5 Q28 32.5 28.5 38 Q28 43.5 24 43.5 Q20 43.5 19.5 38 Z" fill={`url(#${uid}-pine)`} />
            <path d="M21 35 Q21.5 33 22.5 33 Q24 33 24 35 Q23.5 37 22.5 37 Q21.5 37 21 35 Z" fill="#e8c040" opacity="0.1" />
            {/* Diamond pattern */}
            <path d="M20.5 35 L27.5 35 M20 37 L28 37 M20 39 L28 39 M20.5 41 L27.5 41" stroke="#8a6510" strokeWidth="0.4" fill="none" opacity="0.45" />
            <path d="M22 33 L22 43 M24 32.5 L24 43.5 M26 33 L26 43" stroke="#8a6510" strokeWidth="0.4" fill="none" opacity="0.4" />
            {/* Crown leaves — curved */}
            <path d="M24 32.5 Q21 28 18 25 Q17 24.5 17.5 25.5" stroke="#5a8c3f" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            <path d="M24 32.5 Q27 28 30 25 Q31 24.5 30.5 25.5" stroke="#4a7c35" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            <path d="M24 32.5 Q23.5 28 23 24 Q23 23 23.5 24" stroke="#6ab04c" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M24 32.5 Q22 29 19.5 27" stroke="#4a7c35" strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M24 32.5 Q26 29 28.5 27" stroke="#5a8c3f" strokeWidth="0.6" fill="none" strokeLinecap="round" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-pine`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0a81c" />
                <stop offset="35%" stopColor="#c4891a" />
                <stop offset="70%" stopColor="#a87315" />
                <stop offset="100%" stopColor="#8a5e10" />
              </linearGradient>
            </defs>
            {/* Wide rosette leaves */}
            <path d="M24 46 Q12 40 2 38" stroke="#5a8c3f" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q36 40 46 38" stroke="#4a7c35" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q16 42 6 36" stroke="#4a7c35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q32 42 42 36" stroke="#5a8c3f" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q20 42 12 35" stroke="#6ab04c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q28 42 36 35" stroke="#6ab04c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q24 40 24 34" stroke="#5a8c3f" strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Fruit body — sitting on rosette base */}
            <ellipse cx="24" cy="35" rx="6" ry="8" fill={`url(#${uid}-pine)`} />
            <ellipse cx="22" cy="31" rx="2" ry="2.5" fill="#e8c040" opacity="0.1" />
            {/* Diamond crosshatch */}
            <path d="M19 30 L29 30 M18.5 33 L29.5 33 M18.5 36 L29.5 36 M19 39 L29 39 M19.5 41.5 L28.5 41.5" stroke="#8a6510" strokeWidth="0.45" fill="none" opacity="0.45" />
            <path d="M21 27.5 L21 43 M24 27 L24 43 M27 27.5 L27 43" stroke="#8a6510" strokeWidth="0.45" fill="none" opacity="0.4" />
            {/* Nub bumps along edges */}
            <circle cx="19.5" cy="31.5" r="0.6" fill="#c4891a" opacity="0.35" />
            <circle cx="28.5" cy="31.5" r="0.6" fill="#c4891a" opacity="0.35" />
            <circle cx="19" cy="36" r="0.6" fill="#a87315" opacity="0.3" />
            <circle cx="29" cy="36" r="0.6" fill="#a87315" opacity="0.3" />
            {/* Crown — curved leaves */}
            <path d="M24 27 Q20 21 15 16 Q13.5 14.5 14 16" stroke="#5a8c3f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 27 Q28 21 33 16 Q34.5 14.5 34 16" stroke="#4a7c35" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 27 Q23.5 21 22.5 14 Q22 12.5 22.5 14" stroke="#6ab04c" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M24 27 Q24.5 21 25.5 14 Q26 12.5 25.5 14" stroke="#5a8c3f" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            <path d="M24 27 Q21 22 17.5 18 Q16.5 17 17 18" stroke="#4a7c35" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M24 27 Q27 22 30.5 18 Q31.5 17 31 18" stroke="#5a8c3f" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M24 27 Q22 23 19.5 20" stroke="#6ab04c" strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M24 27 Q26 23 28.5 20" stroke="#4a7c35" strokeWidth="0.6" fill="none" strokeLinecap="round" />
            {/* Dot texture */}
            <circle cx="22" cy="31" r="0.5" fill={light} opacity="0.25" />
            <circle cx="26" cy="35" r="0.5" fill={light} opacity="0.2" />
            <circle cx="22" cy="39" r="0.45" fill={light} opacity="0.18" />
            <circle cx="26" cy="29" r="0.45" fill={light} opacity="0.2" />
          </g>
        )

      case 'passionfruit':
        if (s === 0) return (
          <g>
            {/* Two simple stakes */}
            <path d="M18 46 L18 40" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M30 46 L30 40" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M18 41 L30 41" stroke={trunk} strokeWidth="0.8" />
            {/* Tiny vine sprout */}
            <path d="M24 46 Q23 44 20 42" stroke="#5a8c3f" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M20 42 Q19 40.5 20 39.5 Q21 40.5 22 39.5 Z" fill={color} opacity="0.6" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Two stakes with wire */}
            <path d="M14 46 L14 34" stroke={trunk} strokeWidth="1.8" fill="none" />
            <path d="M34 46 L34 34" stroke={trunk} strokeWidth="1.8" fill="none" />
            <path d="M14 38 L34 38" stroke={trunk} strokeWidth="0.7" opacity="0.5" />
            <path d="M14 34 L34 34" stroke={trunk} strokeWidth="0.7" opacity="0.5" />
            {/* Vine climbing up left stake, curving across */}
            <path d="M24 46 Q22 43 16 40 Q14 38 14 36 Q14 34 18 34 Q22 33 26 35 Q30 36 34 35" stroke="#5a8c3f" strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Tendril curls */}
            <path d="M20 37 Q19 35.5 20.5 35 Q20 36.5 21 36" stroke="#5a8c3f" strokeWidth="0.5" fill="none" opacity="0.5" />
            <path d="M28 34 Q29 32.5 28 32 Q27.5 33 28.5 33.5" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.4" />
            {/* Lobed leaves */}
            <path d="M17 36 Q15 34 16 32 Q18 34 20 33 Q18 35 17 36 Z" fill={color} opacity="0.6" />
            <path d="M24 34 Q22 32 23 30.5 Q25 32 27 31 Q25 33 24 34 Z" fill={color} opacity="0.55" />
            <path d="M31 35 Q30 33 31 32 Q32 33.5 33 32.5 Q32 34 31 35 Z" fill={color} opacity="0.5" />
            {/* Leaf veins */}
            <path d="M17 35 L16.5 33.5 M17 35 L18.5 34" stroke={dark} strokeWidth="0.2" opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Two stakes */}
            <path d="M12 46 L12 24" stroke={trunk} strokeWidth="2" fill="none" />
            <path d="M36 46 L36 24" stroke={trunk} strokeWidth="2" fill="none" />
            {/* Wires */}
            <path d="M12 34 L36 34" stroke={trunk} strokeWidth="0.6" opacity="0.4" />
            <path d="M12 28 L36 28" stroke={trunk} strokeWidth="0.6" opacity="0.4" />
            {/* Main vine — organic curves across trellis */}
            <path d="M24 46 Q20 42 14 38 Q12 35 12 32 Q12 28 18 26 Q24 24 30 26 Q36 28 36 30" stroke="#5a8c3f" strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M18 36 Q22 32 28 30 Q34 28 36 26" stroke="#5a8c3f" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M12 30 Q16 26 22 26" stroke="#5a8c3f" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            {/* Tendrils */}
            <path d="M16 32 Q14.5 30 15.5 29 Q15 31 16.5 31" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.5" />
            <path d="M30 27 Q31 25.5 30 25 Q29.5 26.5 31 26.5" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.45" />
            {/* Lobed leaves scattered organically */}
            <path d="M15 30 Q13 28 14 26 Q16 28 18 27 Q16 29 15 30 Z" fill={color} opacity="0.6" />
            <path d="M22 27 Q20 25 21 23.5 Q23 25 25 24 Q23 26 22 27 Z" fill={color} opacity="0.55" />
            <path d="M32 28 Q30 26 31 25 Q33 26.5 35 25.5 Q33 27.5 32 28 Z" fill={color} opacity="0.5" />
            <path d="M19 34 Q17 32 18 30.5 Q20 32 22 31 Q20 33 19 34 Z" fill={color} opacity="0.5" />
            <path d="M28 32 Q26 30 27 29 Q29 30.5 31 29.5 Q29 31.5 28 32 Z" fill={color} opacity="0.45" />
            {/* Small fruits forming */}
            <path d="M20 28 L20 30" stroke="#5a8c3f" strokeWidth="0.4" strokeLinecap="round" />
            <path d="M18.8 31.2 Q19.2 29.6 20 29.6 Q20.8 29.6 21.2 31.2 Q20.8 32.8 20 32.8 Q19.2 32.8 18.8 31.2 Z" fill="#9b1b5e" />
            <path d="M19.3 30.6 Q19.4 30.2 19.6 30.2 Q19.9 30.2 19.9 30.6 Q19.9 31 19.6 31 Q19.3 31 19.3 30.6 Z" fill="#ff6b85" opacity="0.7" />
            <path d="M33 26 L33 27.5" stroke="#5a8c3f" strokeWidth="0.35" strokeLinecap="round" />
            <path d="M32 28.7 Q32.2 27.3 33 27.3 Q33.8 27.3 34 28.7 Q33.8 30.1 33 30.1 Q32.2 30.1 32 28.7 Z" fill="#9b1b5e" opacity="0.8" />
          </g>
        )
        return (
          <g>
            {/* Stakes — pointed tops, wood grain */}
            <path d="M10 46 L10 16 L11 14 L10 16" stroke={trunk} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M38 46 L38 16 L39 14 L38 16" stroke={trunk} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {/* Wood grain marks */}
            <path d="M9.5 30 L10.5 30" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            <path d="M9.5 38 L10.5 38" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            <path d="M37.5 32 L38.5 32" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            <path d="M37.5 40 L38.5 40" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            {/* Wire supports with slight sag */}
            <path d="M10 34 Q24 35.5 38 34" stroke={trunk} strokeWidth="0.5" opacity="0.35" fill="none" />
            <path d="M10 26 Q24 27.5 38 26" stroke={trunk} strokeWidth="0.5" opacity="0.35" fill="none" />
            <path d="M10 20 Q24 21 38 20" stroke={trunk} strokeWidth="0.5" opacity="0.35" fill="none" />
            {/* Vines wrapping around left post */}
            <path d="M8.5 36 Q10 35 11.5 36 Q10 37 8.5 36" stroke="#5a8c3f" strokeWidth="0.7" fill="none" opacity="0.5" />
            <path d="M8.5 28 Q10 27 11.5 28 Q10 29 8.5 28" stroke="#5a8c3f" strokeWidth="0.6" fill="none" opacity="0.45" />
            <path d="M8.5 22 Q10 21 11.5 22" stroke="#4a7c35" strokeWidth="0.5" fill="none" opacity="0.4" />
            {/* Vines wrapping around right post */}
            <path d="M36.5 32 Q38 31 39.5 32 Q38 33 36.5 32" stroke="#5a8c3f" strokeWidth="0.7" fill="none" opacity="0.5" />
            <path d="M36.5 24 Q38 23 39.5 24 Q38 25 36.5 24" stroke="#4a7c35" strokeWidth="0.6" fill="none" opacity="0.45" />
            <path d="M36.5 18 Q38 17 39.5 18" stroke="#5a8c3f" strokeWidth="0.5" fill="none" opacity="0.4" />
            {/* Main vines connecting posts organically */}
            <path d="M10 32 Q14 28 18 24 Q22 20 28 18 Q34 16 38 20" stroke="#5a8c3f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M38 30 Q34 26 28 22 Q22 18 16 18 Q12 18 10 20" stroke="#4a7c35" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M10 36 C16 34 20 28 24 26 C28 24 34 22 38 24" stroke="#6ab04c" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M38 34 C34 30 28 26 24 24 C20 22 16 22 10 24" stroke="#5a8c3f" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M10 24 C14 22 18 18 24 16 C28 14 32 16 38 18" stroke="#4a7c35" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            {/* Tendrils */}
            <path d="M16 26 Q14 24 15 22.5 Q15.5 24 16.5 23.5 Q16 25 17 24" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.5" />
            <path d="M30 20 Q32 18 31 17 Q30 19 31.5 19.5" stroke="#4a7c35" strokeWidth="0.35" fill="none" opacity="0.45" />
            <path d="M22 28 Q20 26.5 21 25.5 Q21.5 27 22.5 26" stroke="#6ab04c" strokeWidth="0.3" fill="none" opacity="0.4" />
            <path d="M34 24 Q36 22 35 21 Q34.5 23 36 23" stroke="#5a8c3f" strokeWidth="0.3" fill="none" opacity="0.4" />
            {/* Green lobed leaves — 3-lobed shapes */}
            <path d="M14 26 C12 24 12 22 14 22 C15 22 16 24 14 26 Z" fill="#4a8c3a" opacity="0.6" />
            <path d="M13 25 C11 24 11 22 13 23 Z" fill="#3a6e28" opacity="0.4" />
            <path d="M24 20 C22 18 22 16 24 16 C25 16 26 18 24 20 Z" fill="#4a8c3a" opacity="0.6" />
            <path d="M23 19 C21 18 21 16 23 17 Z" fill="#3a6e28" opacity="0.4" />
            <path d="M34 18 C32 16 32 14 34 14 C35 14 36 16 34 18 Z" fill="#4a8c3a" opacity="0.55" />
            <path d="M18 22 C16 20 16 18 18 18 C19 18 20 20 18 22 Z" fill="#3a6e28" opacity="0.5" />
            <path d="M30 24 C28 22 28 20 30 20 C31 20 32 22 30 24 Z" fill="#4a8c3a" opacity="0.5" />
            <path d="M12 32 C10 30 10 28 12 28 C13 28 14 30 12 32 Z" fill="#3a6e28" opacity="0.45" />
            <path d="M20 30 C18 28 18 26 20 26 C21 26 22 28 20 30 Z" fill="#4a8c3a" opacity="0.5" />
            <path d="M36 22 C34 20 35 18 36 19 C37 19 37 21 36 22 Z" fill="#3a6e28" opacity="0.45" />
            <path d="M26 26 C24 24 24 22 26 22 C27 22 28 24 26 26 Z" fill="#4a8c3a" opacity="0.45" />
            {/* Hanging passion fruits — oval, #9b1b5e */}
            <path d="M17 26 L17 28.5" stroke="#5a8c3f" strokeWidth="0.5" strokeLinecap="round" />
            <ellipse cx="17" cy="30.2" rx="1.6" ry="2.2" fill="#9b1b5e" />
            <ellipse cx="16.3" cy="29.3" rx="0.4" ry="0.55" fill="#ff6b85" opacity="0.3" />
            <path d="M28 22 L28 24.5" stroke="#5a8c3f" strokeWidth="0.5" strokeLinecap="round" />
            <ellipse cx="28" cy="26.2" rx="1.5" ry="2" fill="#9b1b5e" />
            <ellipse cx="27.3" cy="25.3" rx="0.35" ry="0.5" fill="#ff6b85" opacity="0.3" />
            <path d="M22 26 L22 28.5" stroke="#5a8c3f" strokeWidth="0.4" strokeLinecap="round" />
            <ellipse cx="22" cy="30.2" rx="1.3" ry="1.8" fill="#9b1b5e" opacity="0.85" />
            <ellipse cx="21.4" cy="29.4" rx="0.3" ry="0.45" fill="#ff6b85" opacity="0.25" />
            <path d="M35 20 L35 22" stroke="#5a8c3f" strokeWidth="0.4" strokeLinecap="round" />
            <ellipse cx="35" cy="23.7" rx="1.2" ry="1.7" fill="#9b1b5e" opacity="0.75" />
            <path d="M13 30 L13 32" stroke="#5a8c3f" strokeWidth="0.35" strokeLinecap="round" />
            <ellipse cx="13" cy="33.7" rx="1.1" ry="1.6" fill="#9b1b5e" opacity="0.7" />
          </g>
        )

      case 'void':
        if (s === 0) return (
          <g>
            <defs>
              <radialGradient id={`vgrad-${uid}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 Q23 42 24 38" stroke="#2a2a3e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="34" r="5" fill={`url(#vgrad-${uid})`} />
            <circle cx="24" cy="34" r="2.5" fill="#0a0a14" />
            <circle cx="20" cy="32" r="0.6" fill="#6366f1" opacity="0.4">
              <animate attributeName="cx" values="20;23.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="24" cy="34" r="4" fill="none" stroke="#6366f1" strokeWidth="0.3" opacity="0.15">
              <animate attributeName="r" values="4;5;4" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <filter id={`vglow-${uid}`}>
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id={`vgrad-${uid}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="60%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 Q23 40 24 34" stroke="#2a2a3e" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q20 32 16 30" stroke="#2a2a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <g filter={`url(#vglow-${uid})`}>
              <circle cx="24" cy="28" r="8" fill={`url(#vgrad-${uid})`} />
              <circle cx="24" cy="28" r="4" fill="#0a0a14" />
            </g>
            <circle cx="16" cy="26" r="0.7" fill="#6366f1" opacity="0.5">
              <animate attributeName="cx" values="16;22" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="cy" values="26;28" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="32" cy="30" r="0.6" fill="#8b5cf6" opacity="0.4">
              <animate attributeName="cx" values="32;26" dur="2s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <circle cx="24" cy="28" r="6" fill="none" stroke="#6366f1" strokeWidth="0.3" opacity="0.15">
              <animate attributeName="r" values="6;7;6" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <filter id={`vglow-${uid}`} x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id={`vgrad-${uid}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="60%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 Q23 40 24 32" stroke="#2a2a3e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q18 28 14 26" stroke="#2a2a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 30 Q30 24 34 22" stroke="#2a2a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <g filter={`url(#vglow-${uid})`}>
              <circle cx="24" cy="22" r="12" fill={`url(#vgrad-${uid})`} />
              <circle cx="24" cy="22" r="5" fill="#0a0a14" />
            </g>
            <circle cx="12" cy="18" r="0.8" fill="#6366f1" opacity="0.5">
              <animate attributeName="cx" values="12;22" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="cy" values="18;22" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="36" cy="24" r="0.7" fill="#8b5cf6" opacity="0.4">
              <animate attributeName="cx" values="36;26" dur="2s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="cy" values="24;22" dur="2s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <ellipse cx="24" cy="22" rx="8" ry="8" fill="none" stroke="#6366f1" strokeWidth="0.4" opacity="0.15">
              <animate attributeName="rx" values="8;10;8" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.05;0.15" dur="4s" repeatCount="indefinite" />
            </ellipse>
          </g>
        )
        return (
          <g>
            <defs>
              <filter id={`vglow-${uid}`} x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id={`vgrad-${uid}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="40%" stopColor="#0a0a14" />
                <stop offset="70%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id={`vring-${uid}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="70%" stopColor="#6366f1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 C22.5 42 25.5 37 23.5 31 C21 25 25.5 21 24 16" stroke="#2a2a3e" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 C25.5 42 22.5 37 24.5 31 C27 25 22.5 21 24 16" stroke="#1a1a2e" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M24 30 C18 26 12 28 8 22" stroke="#2a2a3e" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 26 C30 22 36 24 40 18" stroke="#2a2a3e" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 23 C20 19 16 15 14 9" stroke="#2a2a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <g filter={`url(#vglow-${uid})`}>
              <circle cx="24" cy="14" r="16" fill={`url(#vgrad-${uid})`} />
              <circle cx="24" cy="14" r="7" fill="#050510" />
              <circle cx="24" cy="14" r="3" fill="#000" />
            </g>
            <ellipse cx="24" cy="14" rx="10" ry="10" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.2">
              <animate attributeName="rx" values="10;12;10" dur="4s" repeatCount="indefinite" />
              <animate attributeName="ry" values="10;8;10" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="24" cy="14" rx="14" ry="12" fill="none" stroke="#8b5cf6" strokeWidth="0.4" opacity="0.12">
              <animate attributeName="rx" values="14;16;14" dur="5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="ry" values="12;10;12" dur="5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="opacity" values="0.12;0.03;0.12" dur="5s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            <ellipse cx="24" cy="14" rx="18" ry="14" fill={`url(#vring-${uid})`} opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="6s" repeatCount="indefinite" />
            </ellipse>
            <circle cx="8" cy="8" r="1" fill="#6366f1" opacity="0.6">
              <animate attributeName="cx" values="8;22" dur="3s" repeatCount="indefinite" />
              <animate attributeName="cy" values="8;14" dur="3s" repeatCount="indefinite" />
              <animate attributeName="r" values="1;0.2" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="18" r="0.9" fill="#8b5cf6" opacity="0.5">
              <animate attributeName="cx" values="40;26" dur="2.8s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="cy" values="18;14" dur="2.8s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="r" values="0.9;0.15" dur="2.8s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="opacity" values="0.5;0" dur="2.8s" repeatCount="indefinite" begin="0.4s" />
            </circle>
            <circle cx="14" cy="28" r="0.8" fill="#a78bfa" opacity="0.4">
              <animate attributeName="cx" values="14;23" dur="3.5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="cy" values="28;16" dur="3.5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="r" values="0.8;0.1" dur="3.5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="opacity" values="0.4;0" dur="3.5s" repeatCount="indefinite" begin="1s" />
            </circle>
            <circle cx="36" cy="4" r="0.7" fill="#6366f1" opacity="0.45">
              <animate attributeName="cx" values="36;25" dur="3.2s" repeatCount="indefinite" begin="1.8s" />
              <animate attributeName="cy" values="4;13" dur="3.2s" repeatCount="indefinite" begin="1.8s" />
              <animate attributeName="r" values="0.7;0.1" dur="3.2s" repeatCount="indefinite" begin="1.8s" />
              <animate attributeName="opacity" values="0.45;0" dur="3.2s" repeatCount="indefinite" begin="1.8s" />
            </circle>
            <circle cx="18" cy="2" r="0.6" fill="#c4b5fd" opacity="0.35">
              <animate attributeName="cx" values="18;23" dur="2.5s" repeatCount="indefinite" begin="2.2s" />
              <animate attributeName="cy" values="2;13" dur="2.5s" repeatCount="indefinite" begin="2.2s" />
              <animate attributeName="r" values="0.6;0.1" dur="2.5s" repeatCount="indefinite" begin="2.2s" />
              <animate attributeName="opacity" values="0.35;0" dur="2.5s" repeatCount="indefinite" begin="2.2s" />
            </circle>
            <circle cx="24" cy="14" r="4" fill="#6366f1" opacity="0.08">
              <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.08;0.02;0.08" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        )

      case 'dead':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 38" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 40 Q22 38 21 39" stroke="#4a4a4a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M23.5 42 L24.5 42" stroke="#3a3a3a" strokeWidth="0.3" opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 32" stroke="#4a4a4a" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 38 Q20 34 18 36" stroke="#4a4a4a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q27 30 29 32" stroke="#4a4a4a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M23.5 40 L24.5 39.8" stroke="#3a3a3a" strokeWidth="0.4" opacity="0.3" />
            <path d="M23.5 36 L24.5 35.8" stroke="#3a3a3a" strokeWidth="0.3" opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 L23 28 Q23 25 24 24 Q25 25 25 28 L25 46 Z" fill="#4a4a4a" />
            <path d="M23 34 Q19 30 17 32" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M25 28 Q29 24 31 26" stroke="#4a4a4a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23.5 38 L25 37.8" stroke="#3a3a3a" strokeWidth="0.4" opacity="0.25" />
            <path d="M23.2 42 L25.2 41.8" stroke="#3a3a3a" strokeWidth="0.3" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M22 46 L22 28 Q22 24 24 22 Q26 24 26 28 L26 46 Z" fill="#4a4a4a" />
            <path d="M22 30 Q18 26 14 28" stroke="#4a4a4a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M26 26 Q30 22 34 24" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 22 L24 18" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )

      case 'pomegranate':
        if (s === 0) return (
          <g>
            <ellipse cx={24} cy={44} rx={3} ry={1} fill="#3a2e1a" opacity={0.3}/>
            <line x1={24} y1={44} x2={24} y2={38} stroke={trunk} strokeWidth={1.8} strokeLinecap="round"/>
            <line x1={24} y1={40} x2={22} y2={37} stroke={trunk} strokeWidth={0.8} strokeLinecap="round"/>
            <path d="M20 36 Q20 32.5 24 32.5 Q28 32.5 28 36 Q28 39.5 24 39.5 Q20 39.5 20 36 Z" fill={color} opacity={0.85}/>
            <path d="M20 35.5 Q21 33.3 22.5 33.3 Q24 33.3 25 35.5 Q24 37.7 22.5 37.7 Q21 37.7 20 35.5 Z" fill={dark} opacity={0.5}/>
            <path d="M23 37 Q23.5 35.2 25 35.2 Q26.5 35.2 27 37 Q26.5 38.8 25 38.8 Q23.5 38.8 23 37 Z" fill={light} opacity={0.7}/>
            <line x1={24} y1={34} x2={24} y2={32.5} stroke={dark} strokeWidth={0.6} strokeLinecap="round"/>
            <path d="M22.8 32 Q23.5 31.2 24 31.2 Q24.5 31.2 25.2 32 Q24.5 32.8 24 32.8 Q23.5 32.8 22.8 32 Z" fill="#2d5a1e" opacity={0.7}/>
            <circle cx={23} cy={36} r={0.4} fill="#fff" opacity={0.25}/>
          </g>
        )
        if (s === 1) return (
          <g>
            <ellipse cx={24} cy={45} rx={5} ry={1.2} fill="#3a2e1a" opacity={0.25}/>
            <path d="M24 45 Q23 38 22.5 34 Q22 30 23 28" stroke={trunk} strokeWidth={2.2} fill="none" strokeLinecap="round"/>
            <path d="M24 45 Q25 40 25.5 36 Q26 33 25 28" stroke={trunk} strokeWidth={1.8} fill="none" strokeLinecap="round"/>
            <line x1={24} y1={45} x2={22} y2={44} stroke={trunk} strokeWidth={1.2} strokeLinecap="round"/>
            <line x1={24} y1={45} x2={26} y2={43.5} stroke={trunk} strokeWidth={1} strokeLinecap="round"/>
            <line x1={22.8} y1={36} x2={19} y2={32} stroke={trunk} strokeWidth={1.2} strokeLinecap="round"/>
            <line x1={25.2} y1={34} x2={29} y2={30} stroke={trunk} strokeWidth={1} strokeLinecap="round"/>
            <line x1={23} y1={32} x2={21} y2={28} stroke={trunk} strokeWidth={0.8} strokeLinecap="round"/>
            <path d="M18 27 Q19 22 24 22 Q29 22 30 27 Q29 32 24 32 Q19 32 18 27 Z" fill={dark} opacity={0.7}/>
            <path d="M17 28 Q18 24.5 21 24.5 Q24 24.5 25 28 Q24 31.5 21 31.5 Q18 31.5 17 28 Z" fill="#2d5a1e" opacity={0.8}/>
            <path d="M23 28 Q24 24.5 27 24.5 Q30 24.5 31 28 Q30 31.5 27 31.5 Q24 31.5 23 28 Z" fill="#3a7a2e" opacity={0.7}/>
            <path d="M16 31 Q17 28.5 19 28.5 Q21 28.5 22 31 Q21 33.5 19 33.5 Q17 33.5 16 31 Z" fill="#2d5a1e" opacity={0.7}/>
            <path d="M26 30 Q27 27.5 29 27.5 Q31 27.5 32 30 Q31 32.5 29 32.5 Q27 32.5 26 30 Z" fill={dark} opacity={0.7}/>
            <path d="M20 25 Q21 22 24 22 Q27 22 28 25 Q27 28 24 28 Q21 28 20 25 Z" fill="#3a7a2e" opacity={0.75}/>
            <circle cx={20} cy={30} r={2.2} fill={color} opacity={0.85}/>
            <circle cx={20} cy={30} r={1.8} fill={dark} opacity={0.3}/>
            <circle cx={20.5} cy={29.5} r={0.5} fill="#fff" opacity={0.2}/>
            <line x1={20} y1={28} x2={20} y2={27} stroke="#5a3a1e" strokeWidth={0.5} strokeLinecap="round"/>
            <circle cx={28} cy={29} r={1.8} fill={color} opacity={0.8}/>
            <circle cx={28.3} cy={28.7} r={0.4} fill="#fff" opacity={0.2}/>
            <line x1={28} y1={27.2} x2={28} y2={26.3} stroke="#5a3a1e" strokeWidth={0.5} strokeLinecap="round"/>
          </g>
        )
        if (s === 2) return (
          <g>
            <ellipse cx={24} cy={45.5} rx={7} ry={1.5} fill="#3a2e1a" opacity={0.2}/>
            <path d="M24 46 Q22.5 40 22 36 Q21.5 32 22 28 Q22.5 24 24 22" stroke={trunk} strokeWidth={2.8} fill="none" strokeLinecap="round"/>
            <path d="M24 46 Q25.5 41 26 37 Q26.5 33 26 29 Q25.5 25 24 22" stroke={trunk} strokeWidth={2.3} fill="none" strokeLinecap="round"/>
            <line x1={23} y1={46} x2={20} y2={44.5} stroke={trunk} strokeWidth={1.5} strokeLinecap="round"/>
            <line x1={25} y1={46} x2={28} y2={44} stroke={trunk} strokeWidth={1.3} strokeLinecap="round"/>
            <path d="M22.5 34 Q19 30 16 27" stroke={trunk} strokeWidth={1.5} fill="none" strokeLinecap="round"/>
            <path d="M25.5 32 Q29 28 32 26" stroke={trunk} strokeWidth={1.3} fill="none" strokeLinecap="round"/>
            <path d="M23 30 Q20 26 18 23" stroke={trunk} strokeWidth={1.1} fill="none" strokeLinecap="round"/>
            <path d="M25 28 Q27 24 30 22" stroke={trunk} strokeWidth={1} fill="none" strokeLinecap="round"/>
            <path d="M23.5 26 Q22 23 20 20" stroke={trunk} strokeWidth={0.9} fill="none" strokeLinecap="round"/>
            <path d="M15 21 Q16 14 24 14 Q32 14 33 21 Q32 28 24 28 Q16 28 15 21 Z" fill={dark} opacity={0.7}/>
            <path d="M13 24 Q14 20 18 20 Q22 20 23 24 Q22 28 18 28 Q14 28 13 24 Z" fill="#2d5a1e" opacity={0.8}/>
            <path d="M25 24 Q26 20 30 20 Q34 20 35 24 Q34 28 30 28 Q26 28 25 24 Z" fill="#3a7a2e" opacity={0.75}/>
            <path d="M12 27 Q13 24 16 24 Q19 24 20 27 Q19 30 16 30 Q13 30 12 27 Z" fill="#2d5a1e" opacity={0.7}/>
            <path d="M28 26 Q29 23 32 23 Q35 23 36 26 Q35 29 32 29 Q29 29 28 26 Z" fill={dark} opacity={0.7}/>
            <path d="M18 18 Q19 13.5 24 13.5 Q29 13.5 30 18 Q29 22.5 24 22.5 Q19 22.5 18 18 Z" fill="#3a7a2e" opacity={0.8}/>
            <path d="M15 20 Q16 16.5 20 16.5 Q24 16.5 25 20 Q24 23.5 20 23.5 Q16 23.5 15 20 Z" fill="#2d5a1e" opacity={0.7}/>
            <path d="M23 20 Q24 16.5 28 16.5 Q32 16.5 33 20 Q32 23.5 28 23.5 Q24 23.5 23 20 Z" fill={dark} opacity={0.7}/>
            <path d="M20 15 Q21 12 24 12 Q27 12 28 15 Q27 18 24 18 Q21 18 20 15 Z" fill="#3a7a2e" opacity={0.7}/>
            <circle cx={17} cy={25} r={2.8} fill={color} opacity={0.9}/>
            <circle cx={17} cy={25} r={2.3} fill={dark} opacity={0.25}/>
            <circle cx={17.5} cy={24.3} r={0.6} fill="#fff" opacity={0.2}/>
            <line x1={17} y1={22.2} x2={17} y2={21} stroke="#5a3a1e" strokeWidth={0.6} strokeLinecap="round"/>
            <circle cx={31} cy={24} r={2.5} fill={color} opacity={0.85}/>
            <circle cx={31.4} cy={23.5} r={0.5} fill="#fff" opacity={0.2}/>
            <line x1={31} y1={21.5} x2={31} y2={20.5} stroke="#5a3a1e" strokeWidth={0.5} strokeLinecap="round"/>
            <circle cx={22} cy={18} r={2.3} fill={color} opacity={0.88}/>
            <circle cx={22.4} cy={17.5} r={0.5} fill="#fff" opacity={0.18}/>
            <line x1={22} y1={15.7} x2={22} y2={14.8} stroke="#5a3a1e" strokeWidth={0.5} strokeLinecap="round"/>
            <circle cx={28} cy={22} r={2} fill={color} opacity={0.8}/>
            <circle cx={28.3} cy={21.6} r={0.4} fill="#fff" opacity={0.15}/>
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-pg0`} cx="40%" cy="35%" r="50%">
                <stop offset="0%" stopColor={light}/>
                <stop offset="100%" stopColor={color}/>
              </radialGradient>
              <radialGradient id={`${uid}-pg1`} cx="45%" cy="30%" r="55%">
                <stop offset="0%" stopColor="#ff6b6b"/>
                <stop offset="70%" stopColor={color}/>
                <stop offset="100%" stopColor={dark}/>
              </radialGradient>
            </defs>
            <path d="M24 46 Q21 42 20.5 38 Q20 34 21 31 Q22 28 23 26 Q24 24 24 22" stroke={trunk} strokeWidth={2.2} fill="none" strokeLinecap="round"/>
            <path d="M24 46 Q27 43 27.5 39 Q28 35 27 32 Q26 29 25 27 Q24 25 24 22" stroke={trunk} strokeWidth={1.8} fill="none" strokeLinecap="round"/>
            <path d="M22 46 Q19 45 17 45.5" stroke={trunk} strokeWidth={1} fill="none" strokeLinecap="round"/>
            <path d="M26 46 Q29 44.5 31 45" stroke={trunk} strokeWidth={0.9} fill="none" strokeLinecap="round"/>
            <path d="M23 30 Q18 26 14 23 Q12 21 10 20" stroke={trunk} strokeWidth={1.2} fill="none" strokeLinecap="round"/>
            <path d="M25 28 Q30 24 34 22 Q36 21 38 20" stroke={trunk} strokeWidth={1.1} fill="none" strokeLinecap="round"/>
            <path d="M23.5 26 Q20 22 17 18 Q15 16 14 14" stroke={trunk} strokeWidth={1} fill="none" strokeLinecap="round"/>
            <path d="M24.5 25 Q28 21 31 18 Q33 16 34 14" stroke={trunk} strokeWidth={0.9} fill="none" strokeLinecap="round"/>
            <path d="M24 22 Q23 18 22 15 Q21 13 21 11" stroke={trunk} strokeWidth={0.8} fill="none" strokeLinecap="round"/>
            <path d="M10 20 Q8 19 7 20" stroke={trunk} strokeWidth={0.5} fill="none" strokeLinecap="round"/>
            <path d="M38 20 Q40 19 41 20" stroke={trunk} strokeWidth={0.5} fill="none" strokeLinecap="round"/>
            {/* Base canopy masses */}
            <ellipse cx={14} cy={18} rx={7} ry={6} fill="#1a4a14" opacity={0.8}/>
            <ellipse cx={34} cy={17} rx={7} ry={6} fill="#1a4a14" opacity={0.8}/>
            <ellipse cx={24} cy={12} rx={7} ry={6} fill="#1a4a14" opacity={0.8}/>
            <ellipse cx={9} cy={20} rx={5} ry={4} fill="#2a5220" opacity={0.75}/>
            <ellipse cx={39} cy={18} rx={5} ry={4} fill="#2a5220" opacity={0.75}/>
            {/* Mid layer */}
            <ellipse cx={14} cy={16} rx={6} ry={5} fill="#2d5a1e" opacity={0.9}/>
            <ellipse cx={34} cy={15} rx={6} ry={5} fill="#2d5a1e" opacity={0.85}/>
            <ellipse cx={24} cy={10} rx={6} ry={5} fill="#2d5a1e" opacity={0.9}/>
            <ellipse cx={20} cy={14} rx={4} ry={3.5} fill="#3a7a2e" opacity={0.8}/>
            <ellipse cx={28} cy={13} rx={4} ry={3.5} fill="#3a7a2e" opacity={0.8}/>
            {/* Highlights */}
            <ellipse cx={13} cy={15} rx={4} ry={3} fill="#3a7a2e" opacity={0.5}/>
            <ellipse cx={33} cy={14} rx={4} ry={3} fill="#3a7a2e" opacity={0.45}/>
            <ellipse cx={24} cy={8} rx={4} ry={3} fill="#3a7a2e" opacity={0.5}/>
            <circle cx={12} cy={22} r={1.8} fill={`url(#${uid}-pg0)`}/>
            <circle cx={12.4} cy={21.4} r={0.4} fill="#fff" opacity={0.18}/>
            <path d="M11.5 20.3 Q12 19.9 12.5 20.3" stroke="#5a3a1e" strokeWidth={0.4} fill="none"/>
            <line x1={12} y1={20.3} x2={12} y2={19.6} stroke="#5a3a1e" strokeWidth={0.35} strokeLinecap="round"/>
            <circle cx={35} cy={19} r={2} fill={`url(#${uid}-pg1)`}/>
            <circle cx={34.5} cy={18.4} r={0.4} fill="#fff" opacity={0.16}/>
            <path d="M34.5 17.2 Q35 16.7 35.5 17.2" stroke="#5a3a1e" strokeWidth={0.4} fill="none"/>
            <line x1={35} y1={17.2} x2={35} y2={16.4} stroke="#5a3a1e" strokeWidth={0.35} strokeLinecap="round"/>
            <circle cx={22} cy={12} r={1.7} fill={`url(#${uid}-pg0)`}/>
            <circle cx={22.3} cy={11.5} r={0.35} fill="#fff" opacity={0.15}/>
            <path d="M21.5 10.5 Q22 10.1 22.5 10.5" stroke="#5a3a1e" strokeWidth={0.35} fill="none"/>
            <line x1={22} y1={10.5} x2={22} y2={9.8} stroke="#5a3a1e" strokeWidth={0.35} strokeLinecap="round"/>
            <circle cx={15} cy={17} r={1.8} fill={`url(#${uid}-pg1)`}/>
            <circle cx={15.3} cy={16.5} r={0.35} fill="#fff" opacity={0.16}/>
            <path d="M14.5 15.4 Q15 15 15.5 15.4" stroke="#5a3a1e" strokeWidth={0.35} fill="none"/>
            <line x1={15} y1={15.4} x2={15} y2={14.7} stroke="#5a3a1e" strokeWidth={0.35} strokeLinecap="round"/>
            <circle cx={33} cy={22} r={1.5} fill={`url(#${uid}-pg0)`}/>
            <circle cx={33.3} cy={21.5} r={0.3} fill="#fff" opacity={0.14}/>
            <circle cx={28} cy={11} r={1.7} fill={`url(#${uid}-pg0)`}/>
            <circle cx={28.3} cy={10.5} r={0.35} fill="#fff" opacity={0.14}/>
            <path d="M27.5 9.5 Q28 9.1 28.5 9.5" stroke="#5a3a1e" strokeWidth={0.35} fill="none"/>
            <line x1={28} y1={9.5} x2={28} y2={8.8} stroke="#5a3a1e" strokeWidth={0.35} strokeLinecap="round"/>
            <circle cx={10} cy={20.5} r={1.3} fill={`url(#${uid}-pg0)`}/>
          </g>
        )

      case 'mangrove':
        if (s === 0) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a8a7a" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#2a5a4a" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <ellipse cx="24" cy="44" rx="10" ry="2" fill={`url(#${uid}-water)`} />
            <path d="M24 46 Q23 43 22.5 40 Q22 38 23 36" stroke="#5a4a38" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 42 Q26 44 28 46" stroke="#5a4a38" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M24 42 Q21 44 19 46" stroke="#5a4a38" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M23 36 Q21 33 20 31" stroke="#4a3a28" strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M20 31 C18 29 19 27 21 27.5 C23 28 22 30 20 31Z" fill="#2d6a4f" />
            <path d="M21 28 Q20 27.5 21 27 Q21.5 27.5 21 28Z" fill="#4a9a7a" opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a8a7a" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#2a5a4a" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <ellipse cx="24" cy="44" rx="14" ry="2.5" fill={`url(#${uid}-water)`} />
            <path d="M24 46 Q23 42 22 38 Q21 35 22 32" stroke="#5a4a38" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 40 Q19 43 16 46" stroke="#5a4a38" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 40 Q27 43 30 46" stroke="#5a4a38" strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M22.5 42 Q21 44 18.5 46" stroke="#4a3a28" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M23.5 41 Q26 44 28.5 46" stroke="#4a3a28" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M22 34 Q18 30 14 28" stroke="#5a4a38" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M22 32 Q26 28 30 26" stroke="#5a4a38" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M12 26 C10 23 11 20 14 20 C17 20 18 24 15 27Z" fill="#2d6a4f" />
            <path d="M14 22 C13 21 14 19.5 15 20.5Z" fill="#4a9a7a" opacity="0.35" />
            <path d="M28 24 C26 21 27 18 30 18.5 C33 19 33 23 30 25Z" fill="#276749" />
            <path d="M30 20 Q29 19 30 18.5 Q31 19.5 30 20Z" fill="#4a9a7a" opacity="0.3" />
            <path d="M19 28 C17 26 18 24 21 24.5 C23 25 22 28 19 28Z" fill="#2d6a4f" opacity="0.8" />
            <ellipse cx="17" cy="44.5" rx="2" ry="0.4" fill="#4a8a7a" opacity="0.15">
              <animate attributeName="rx" values="2;2.5;2" dur="4s" repeatCount="indefinite" />
            </ellipse>
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a8a7a" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#2a5a4a" stopOpacity="0.22" />
              </linearGradient>
            </defs>
            {/* Water surface */}
            <ellipse cx="24" cy="44" rx="18" ry="3" fill={`url(#${uid}-water)`} />
            <ellipse cx="24" cy="44.5" rx="12" ry="1" fill="#4a8a7a" opacity="0.08">
              <animate attributeName="rx" values="12;13;12" dur="5s" repeatCount="indefinite" />
            </ellipse>
            {/* Main trunk — slim */}
            <path d="M24 46 Q22 41 21 37 Q20 34 21 31" stroke="#5a4a38" strokeWidth="1.7" strokeLinecap="round" fill="none" />
            {/* Aerial/prop roots */}
            <path d="M22 39 Q17 42 12 46" stroke="#5a4a38" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 38 Q28 42 33 46" stroke="#5a4a38" strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M22 40 Q19 43 15 46" stroke="#4a3a28" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M23 39 Q26 43 30 46" stroke="#4a3a28" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M21.5 42 Q19 44.5 16.5 46" stroke="#4a3a28" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M24 41 Q27.5 44 31 46" stroke="#4a3a28" strokeWidth="0.35" strokeLinecap="round" fill="none" opacity="0.35" />
            {/* Branches — slim */}
            <path d="M21 33 Q16 28 10 26" stroke="#5a4a38" strokeWidth="1.0" strokeLinecap="round" fill="none" />
            <path d="M21 31 Q27 26 33 24" stroke="#5a4a38" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M21 29 Q19 24 18 20" stroke="#5a4a38" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            {/* Paired oval leaves along left branch (toward 10,26) */}
            <path d="M12 27 Q10.5 25 12 23 Q13.5 25 12 27Z" fill={color} opacity="0.85" />
            <path d="M12 27 L12 23" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            <path d="M10 26 Q8.5 24 10 22 Q11.5 24 10 26Z" fill={color} opacity="0.8" />
            <path d="M10 26 L10 22" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            <path d="M15 30 Q13.5 28 15 26 Q16.5 28 15 30Z" fill={color} opacity="0.85" />
            <path d="M15 30 L15 26" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            <path d="M13.5 29 Q12 27 13.5 25 Q15 27 13.5 29Z" fill={color} opacity="0.75" />
            <path d="M13.5 29 L13.5 25" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            {/* Paired oval leaves along right branch (toward 33,24) */}
            <path d="M31 25 Q29.5 23 31 21 Q32.5 23 31 25Z" fill={color} opacity="0.85" />
            <path d="M31 25 L31 21" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            <path d="M33 24 Q31.5 22 33 20 Q34.5 22 33 24Z" fill={color} opacity="0.8" />
            <path d="M33 24 L33 20" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            <path d="M27 27 Q25.5 25 27 23 Q28.5 25 27 27Z" fill={color} opacity="0.85" />
            <path d="M27 27 L27 23" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            <path d="M29 26 Q27.5 24 29 22 Q30.5 24 29 26Z" fill={color} opacity="0.75" />
            <path d="M29 26 L29 22" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            {/* Paired oval leaves along top branch (toward 18,20) */}
            <path d="M18 21 Q16.5 19 18 17 Q19.5 19 18 21Z" fill={color} opacity="0.85" />
            <path d="M18 21 L18 17" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            <path d="M20 22 Q18.5 20 20 18 Q21.5 20 20 22Z" fill={color} opacity="0.8" />
            <path d="M20 22 L20 18" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            <path d="M19 25 Q17.5 23 19 21 Q20.5 23 19 25Z" fill={color} opacity="0.8" />
            <path d="M19 25 L19 21" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            <path d="M21 24 Q19.5 22 21 20 Q22.5 22 21 24Z" fill={color} opacity="0.7" />
            <path d="M21 24 L21 20" stroke={dark} strokeWidth="0.2" opacity="0.3" fill="none" />
            <ellipse cx="13" cy="44.5" rx="2.5" ry="0.5" fill="#4a8a7a" opacity="0.12">
              <animate attributeName="rx" values="2.5;3;2.5" dur="4.5s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="32" cy="44" rx="2" ry="0.4" fill="#4a8a7a" opacity="0.1">
              <animate attributeName="rx" values="2;2.8;2" dur="5.5s" repeatCount="indefinite" begin="1s" />
            </ellipse>
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a8a7a" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#2a5a4a" stopOpacity="0.2" />
              </linearGradient>
              <radialGradient id={`${uid}-canopy`} cx="45%" cy="40%">
                <stop offset="0%" stopColor="#3a8a5a" />
                <stop offset="50%" stopColor="#2d6a4f" />
                <stop offset="100%" stopColor="#1a4a34" />
              </radialGradient>
              <style>{`
                @keyframes mgRipple-${uid} {
                  0% { rx: 2; opacity: 0.12; }
                  50% { rx: 3.5; opacity: 0.06; }
                  100% { rx: 2; opacity: 0.12; }
                }
              `}</style>
            </defs>
            <ellipse cx="24" cy="44" rx="20" ry="3.5" fill={`url(#${uid}-water)`} />
            <ellipse cx="20" cy="44.5" rx="2" ry="0.4" fill="#4a8a7a" opacity="0.12" style={{animation: `mgRipple-${uid} 4s ease-in-out infinite`} as React.CSSProperties} />
            <ellipse cx="30" cy="44" rx="1.8" ry="0.35" fill="#4a8a7a" opacity="0.1" style={{animation: `mgRipple-${uid} 5s ease-in-out 1.5s infinite`} as React.CSSProperties} />
            <ellipse cx="14" cy="45" rx="1.5" ry="0.3" fill="#4a8a7a" opacity="0.08" style={{animation: `mgRipple-${uid} 6s ease-in-out 3s infinite`} as React.CSSProperties} />
            {/* Main trunk — sinuous curve */}
            <path d="M24 46 C23 42 21 39 20 36 C19 33 20 30 21 27 C21.5 25 22 23 22.5 22" stroke="#5a4a38" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M24 46 C23 42 21 39 20 36 C19 33 20 30 21 27 C21.5 25 22 23 22.5 22" stroke="#4a3a28" strokeWidth="1.2" opacity="0.12" strokeLinecap="round" fill="none" />
            {/* Aerial roots — tangled, organic */}
            <path d="M21 38 Q15 41 9 46" stroke="#5a4a38" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M22 37 Q28 41 35 46" stroke="#5a4a38" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M21 39 Q17 42 13 46" stroke="#4a3a28" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.8" />
            <path d="M22 38 Q26 42 31 46" stroke="#4a3a28" strokeWidth="0.85" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M20.5 40 Q18 43 14.5 46" stroke="#4a3a28" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M23 40 Q27 44 32.5 46" stroke="#4a3a28" strokeWidth="0.55" strokeLinecap="round" fill="none" opacity="0.45" />
            <path d="M20 41 Q16.5 44 12 46" stroke="#4a3a28" strokeWidth="0.35" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M23.5 41 Q28.5 44.5 34 46" stroke="#4a3a28" strokeWidth="0.35" strokeLinecap="round" fill="none" opacity="0.25" />
            {/* Root knees breaking water surface */}
            <path d="M12 45 Q11.5 43.5 12.5 44" stroke="#5a4a38" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M33 44.5 Q33.5 43 34 44" stroke="#5a4a38" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.4" />
            {/* Bark texture on trunk */}
            <path d="M21 36 Q20.5 34 21.5 33" stroke="#4a3a28" strokeWidth="0.4" opacity="0.2" fill="none" />
            <path d="M20.5 30 Q21.5 28.5 21 27" stroke="#4a3a28" strokeWidth="0.35" opacity="0.15" fill="none" />
            <ellipse cx="20.8" cy="34" rx="0.7" ry="0.4" fill="#4a3a28" opacity="0.12" />
            {/* Branches — slim */}
            <path d="M21.5 30 C17 26 11 24 5 22" stroke="#5a4a38" strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M22 27 C27 22 34 18 40 16" stroke="#5a4a38" strokeWidth="1.0" strokeLinecap="round" fill="none" />
            <path d="M21.5 28 C19 23 17 18 16 14" stroke="#5a4a38" strokeWidth="0.85" strokeLinecap="round" fill="none" />
            <path d="M22 25 C25 21 28 18 30 16" stroke="#5a4a38" strokeWidth="0.65" strokeLinecap="round" fill="none" />
            <path d="M22 23 C20 20 18 17 16 16" stroke="#5a4a38" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            {/* Sub-branches */}
            <path d="M8 23 C6 21 4 20 2 21" stroke="#5a4a38" strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M12 21 C10 19 8 18.5 6 19" stroke="#5a4a38" strokeWidth="0.35" strokeLinecap="round" fill="none" />
            <path d="M38 17 C40 15.5 42 15 44 16" stroke="#5a4a38" strokeWidth="0.35" strokeLinecap="round" fill="none" />
            <path d="M34 19 C36 17 38 17 40 18.5" stroke="#5a4a38" strokeWidth="0.3" strokeLinecap="round" fill="none" />
            {/* Connected canopy — overlapping foliage masses */}
            {/* Base dark layer */}
            <ellipse cx="7" cy="21" rx="6" ry="4" fill={dark} opacity="0.9" />
            <ellipse cx="38" cy="15" rx="6" ry="4" fill={dark} opacity="0.9" />
            <ellipse cx="18" cy="14" rx="5" ry="4" fill={dark} opacity="0.9" />
            <ellipse cx="30" cy="15" rx="5" ry="3.5" fill={dark} opacity="0.9" />
            <ellipse cx="23" cy="11" rx="5" ry="3.5" fill={dark} opacity="0.9" />
            {/* Mid color layer */}
            <ellipse cx="6" cy="20" rx="5.5" ry="3.5" fill={color} opacity="0.9" />
            <ellipse cx="12" cy="22" rx="4" ry="3" fill={color} opacity="0.85" />
            <ellipse cx="37" cy="14" rx="5.5" ry="3.5" fill={color} opacity="0.9" />
            <ellipse cx="33" cy="17" rx="4" ry="3" fill={color} opacity="0.85" />
            <ellipse cx="17" cy="13" rx="4.5" ry="3.5" fill={color} opacity="0.9" />
            <ellipse cx="29" cy="14" rx="4" ry="3" fill={color} opacity="0.85" />
            <ellipse cx="23" cy="10" rx="4.5" ry="3" fill={color} opacity="0.9" />
            {/* Highlight layer */}
            <ellipse cx="5" cy="19" rx="3.5" ry="2" fill="#3a8a5a" opacity="0.5" />
            <ellipse cx="36" cy="13" rx="3.5" ry="2" fill="#3a8a5a" opacity="0.45" />
            <ellipse cx="17" cy="12" rx="3" ry="2" fill="#3a8a5a" opacity="0.4" />
            <ellipse cx="23" cy="9" rx="3" ry="1.8" fill="#3a8a5a" opacity="0.4" />
            {/* Leaf vein details */}
            <path d="M5 20 L5 18" stroke={dark} strokeWidth="0.2" opacity="0.2" fill="none" />
            <path d="M9 21 L9 19" stroke={dark} strokeWidth="0.2" opacity="0.2" fill="none" />
            <path d="M37 14 L37 12" stroke={dark} strokeWidth="0.2" opacity="0.2" fill="none" />
            <path d="M23 10 L23 8" stroke={dark} strokeWidth="0.2" opacity="0.2" fill="none" />
            {/* Hanging aerial roots from branches */}
            <path d="M6 22 Q5.5 25 5 28" stroke="#5a4a38" strokeWidth="0.3" strokeLinecap="round" fill="none" opacity="0.25">
              <animate attributeName="d" values="M6 22 Q5.5 25 5 28;M6 22 Q5 25 4.5 28;M6 22 Q5.5 25 5 28" dur="6s" repeatCount="indefinite" />
            </path>
            <path d="M38 16 Q38.5 19 38 22" stroke="#5a4a38" strokeWidth="0.3" strokeLinecap="round" fill="none" opacity="0.2">
              <animate attributeName="d" values="M38 16 Q38.5 19 38 22;M38 16 Q39 19 38.5 22;M38 16 Q38.5 19 38 22" dur="7s" repeatCount="indefinite" />
            </path>
            <path d="M14 14 Q13.5 17 13 20" stroke="#5a4a38" strokeWidth="0.25" strokeLinecap="round" fill="none" opacity="0.2">
              <animate attributeName="d" values="M14 14 Q13.5 17 13 20;M14 14 Q13 17 12.5 20;M14 14 Q13.5 17 13 20" dur="5.5s" repeatCount="indefinite" />
            </path>
            {/* Root system — subtle underwater continuation */}
            <path d="M10 46 Q9 47 8 47.5" stroke="#5a4a38" strokeWidth="0.4" opacity="0.12" fill="none" />
            <path d="M34 46 Q35 47 36 47.5" stroke="#5a4a38" strokeWidth="0.35" opacity="0.1" fill="none" />
          </g>
        )

      case 'winterveil':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 43 24 40" stroke="#6a7a8a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 40 Q22 37 23 35" stroke="#6a7a8a" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M23 35 C21 33 22 31 24 31.5 C26 32 25 34 23 35Z" fill="#8aacca" />
            <path d="M24 32.5 Q23 32 24 31.5 Q24.5 32 24 32.5Z" fill="#c0daea" opacity="0.5" />
            <circle cx="23.5" cy="33" r="0.4" fill="#fff" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-frost`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c0daea" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8aacca" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path d="M24 46 Q23 41 23 36 Q22.5 33 23 29" stroke="#6a7a8a" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <path d="M23 36 Q18 32 14 29" stroke="#6a7a8a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M23 33 Q28 28 32 26" stroke="#6a7a8a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M12 27 C9 24 10 20 14 20 C17 20 18 24 15 27Z" fill="#7a9ab8" />
            <path d="M14 22 C13 21 14 20 15 21Z" fill="#a8cce0" opacity="0.4" />
            <path d="M30 24 C27 21 29 17 33 18 C36 19 35 24 32 25Z" fill="#8aacca" />
            <path d="M33 20 Q32 19 33 18 Q34 19.5 33 20Z" fill="#c0daea" opacity="0.35" />
            <path d="M20 29 C18 27 19 25 22 25.5 C24 26 23 28 20 29Z" fill="#7a9ab8" opacity="0.8" />
            {/* Snow on branches */}
            <path d="M14 29 Q12.5 28 14 27.5" stroke="#e8f0f8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M32 26 Q31 25 32.5 24.5" stroke="#e8f0f8" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.45" />
            {/* Frost sparkles */}
            <circle cx="13" cy="24" r="0.4" fill="#fff" opacity="0.35">
              <animate attributeName="opacity" values="0.35;0.1;0.35" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="32" cy="21" r="0.35" fill="#fff" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="3.5s" repeatCount="indefinite" begin="1s" />
            </circle>
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-ice`} cx="45%" cy="40%">
                <stop offset="0%" stopColor="#a8cce0" />
                <stop offset="50%" stopColor="#7a9ab8" />
                <stop offset="100%" stopColor="#5a7a94" />
              </radialGradient>
              <style>{`
                @keyframes wvSnow-${uid} {
                  0% { transform: translateY(0); opacity: 0.5; }
                  100% { transform: translateY(12px); opacity: 0; }
                }
              `}</style>
            </defs>
            <path d="M24 46 Q22 40 22 34 Q21.5 30 22.5 26" stroke="#6a7a8a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q22 40 22 34" stroke="#5a6a7a" strokeWidth="0.7" opacity="0.12" strokeLinecap="round" fill="none" />
            <path d="M22 34 Q15 27 8 24" stroke="#6a7a8a" strokeWidth="1.0" strokeLinecap="round" fill="none" />
            <path d="M22.5 30 Q29 23 36 20" stroke="#6a7a8a" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M22 28 Q18 21 16 16" stroke="#6a7a8a" strokeWidth="0.75" strokeLinecap="round" fill="none" />
            <path d="M22.5 26 Q26 22 30 18" stroke="#6a7a8a" strokeWidth="0.65" strokeLinecap="round" fill="none" />
            {/* Foliage — icy blue-silver masses */}
            <path d="M5 22 C2 18 3 13 7 12 C11 11 14 16 13 20 C12 23 8 25 5 22Z" fill={`url(#${uid}-ice)`} />
            <path d="M7 14 C6 13 7 11.5 9 12.5Z" fill="#c0daea" opacity="0.35" />
            <path d="M11 18 C8 14 10 10 14 11 C18 12 17 17 13 19Z" fill="#7a9ab8" />
            <path d="M14 13 Q13 12 14 11 Q15 12.5 14 13Z" fill="#c0daea" opacity="0.3" />
            <path d="M34 18 C31 14 33 10 37 11 C41 12 41 17 37 19Z" fill={`url(#${uid}-ice)`} />
            <path d="M37 13 C36 12 37 10.5 39 11.5Z" fill="#c0daea" opacity="0.3" />
            <path d="M28 16 C25 12 27 8 31 9 C35 10 34 15 30 17Z" fill="#7a9ab8" opacity="0.85" />
            <path d="M18 22 C15 18 17 15 21 15.5 C24 16 23 21 19 23Z" fill="#8aacca" opacity="0.8" />
            <path d="M14 14 C12 11 14 8 17 9 C20 10 19 14 16 15Z" fill="#6a8aa4" opacity="0.75" />
            {/* Snow caps on foliage */}
            <path d="M3 13 Q5 11.5 7 12 Q9 11.5 11 12.5" stroke="none" fill="#e8f0f8" opacity="0.5" />
            <path d="M3 13 Q5 12 7 12 Q9 12 11 12.5 Q9 10.5 7 11 Q5 10.5 3 13Z" fill="#f0f6fc" opacity="0.55" />
            <path d="M33 10 Q35 9 37 10 Q39 9 41 10.5" stroke="none" fill="#e8f0f8" opacity="0.45" />
            <path d="M33 10 Q35 9.5 37 10 Q39 9.5 41 10.5 Q39 8.5 37 9 Q35 8.5 33 10Z" fill="#f0f6fc" opacity="0.5" />
            <path d="M12 10 Q14 8.5 16 9.5" fill="#e8f0f8" opacity="0.4" />
            {/* Snow on branches */}
            <path d="M8 24 Q7 23 8 22.5" stroke="#e8f0f8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M36 20 Q35 19 36 18.5" stroke="#e8f0f8" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.45" />
            <path d="M16 16 Q15 15 16 14.5" stroke="#e8f0f8" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
            {/* Icicles hanging from branches */}
            <path d="M7 24 L6.5 26.5" stroke="#c0daea" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M8.5 24 L8 26" stroke="#c0daea" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d="M36.5 20 L36 22.5" stroke="#c0daea" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.38" />
            <path d="M38 20 L37.5 22" stroke="#c0daea" strokeWidth="0.35" strokeLinecap="round" fill="none" opacity="0.3" />
            {/* Frost sparkles */}
            <circle cx="8" cy="18" r="0.45" fill="#fff" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.08;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="35" cy="16" r="0.4" fill="#fff" opacity="0.35">
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="4s" repeatCount="indefinite" begin="1.2s" />
            </circle>
            <circle cx="20" cy="14" r="0.35" fill="#fff" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="3.5s" repeatCount="indefinite" begin="0.6s" />
            </circle>
            {/* Falling snow particles */}
            <circle cx="12" cy="10" r="0.5" fill="#fff" opacity="0.35" style={{animation: `wvSnow-${uid} 4s linear infinite`} as React.CSSProperties} />
            <circle cx="28" cy="8" r="0.4" fill="#e8f0f8" opacity="0.3" style={{animation: `wvSnow-${uid} 5s linear 1.5s infinite`} as React.CSSProperties} />
            <circle cx="38" cy="12" r="0.35" fill="#fff" opacity="0.25" style={{animation: `wvSnow-${uid} 4.5s linear 3s infinite`} as React.CSSProperties} />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-icicle`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b8d8ec" />
                <stop offset="100%" stopColor="#7aacc8" stopOpacity="0.6" />
              </linearGradient>
              <style>{`
                @keyframes wvShimmer-${uid} {
                  0%, 100% { opacity: 0.5; }
                  50% { opacity: 0.15; }
                }
              `}</style>
            </defs>
            {/* Trunk — continuous from root to crown */}
            <path d="M24 46 C23.5 42 23 38 22.5 34 C22 30 22 26 22.5 22 C23 19 23 17 23 15" stroke="#6a7a8a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M24 46 C23.5 42 23 38 22.5 34" stroke="#8a9aaa" strokeWidth="0.6" opacity="0.15" strokeLinecap="round" fill="none" />
            {/* Root flare */}
            <path d="M23.5 46 C22.5 45 20 44.5 17 46" stroke="#6a7a8a" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M24.5 46 C25.5 45 27.5 44.5 30 46" stroke="#6a7a8a" strokeWidth="0.65" strokeLinecap="round" fill="none" opacity="0.25" />
            {/* Main branches — all connected to trunk */}
            <path d="M22.5 30 C19 27 15 25 11 24" stroke="#6a7a8a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M22.5 27 C26 24 30 22 34 21" stroke="#6a7a8a" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M22.5 24 C19 21 16 18 13 16" stroke="#6a7a8a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M23 22 C26 20 29 18 32 17" stroke="#6a7a8a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M23 19 C21 17 19 15 17 14" stroke="#6a7a8a" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M23 17 C25 16 27 15 29 14.5" stroke="#6a7a8a" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            {/* Icicle leaves — hanging from branch tips and along branches */}
            {[
              {x:11,y:24,h:5,w:1.2},{x:13,y:23,h:4,w:1},{x:9,y:25,h:3.5,w:0.9},
              {x:34,y:21,h:5,w:1.2},{x:32,y:21.5,h:4,w:1},{x:36,y:22,h:3.5,w:0.9},
              {x:13,y:16,h:4.5,w:1.1},{x:15,y:17,h:3.5,w:0.9},{x:11,y:17,h:3,w:0.8},
              {x:32,y:17,h:4.5,w:1.1},{x:30,y:17.5,h:3.5,w:0.9},{x:34,y:18,h:3,w:0.8},
              {x:17,y:14,h:4,w:1},{x:15,y:15,h:3,w:0.85},{x:19,y:14.5,h:2.5,w:0.75},
              {x:29,y:14.5,h:4,w:1},{x:27,y:15,h:3,w:0.85},{x:31,y:15.5,h:2.5,w:0.75},
              {x:23,y:15,h:5.5,w:1.3},{x:21,y:16,h:4,w:1},{x:25,y:15.5,h:4.5,w:1.1},
              {x:18,y:20,h:3,w:0.8},{x:28,y:19,h:3,w:0.8},
              {x:20,y:22,h:2.5,w:0.7},{x:26,y:21,h:2.5,w:0.7},
            ].map((ic, i) => (
              <path key={i} d={`M${ic.x} ${ic.y} Q${ic.x - ic.w * 0.3} ${ic.y + ic.h * 0.5} ${ic.x} ${ic.y + ic.h}`} stroke={`url(#${uid}-icicle)`} strokeWidth={ic.w} strokeLinecap="round" fill="none" opacity={0.6 + (i % 3) * 0.1} />
            ))}
            {/* Icicle tips — glinting points */}
            {[
              {x:11,y:29},{x:34,y:26},{x:13,y:20.5},{x:32,y:21.5},
              {x:23,y:20.5},{x:17,y:18},{x:29,y:18.5},
            ].map((tip, i) => (
              <circle key={i} cx={tip.x} cy={tip.y} r="0.4" fill="#fff" opacity="0.45" style={{animation: `wvShimmer-${uid} ${3 + i * 0.7}s ease-in-out ${i * 0.4}s infinite`} as React.CSSProperties} />
            ))}
            {/* Frost on trunk */}
            <path d="M22.5 36 Q21.5 35 22.5 34.5" stroke="#d0e4f0" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.25" />
            <path d="M22.5 28 Q21.5 27 22.5 26.5" stroke="#d0e4f0" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.2" />
            {/* Frozen ground frost */}
            <ellipse cx="24" cy="46" rx="14" ry="2" fill="#c0daea" opacity="0.08" />
          </g>
        )



      case 'palm':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q24 42 24 38" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="40" rx="3" ry="2" fill="#8B7355" opacity="0.4" />
            {/* Two small fronds */}
            <path d="M24 38 Q20 34 16 33 Q20 32 24 36" fill={color} opacity="0.7" />
            <path d="M24 38 Q28 34 32 33 Q28 32 24 36" fill={color} opacity="0.6" />
            <path d="M24 36 Q24 33 24 31" stroke={color} strokeWidth="0.5" fill="none" opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Thin curved trunk */}
            <path d="M24 46 Q23 38 22.5 28" stroke="#a08860" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q23 38 22.5 28" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Ring marks */}
            <path d="M22.8 40 Q23.5 39.5 24.2 40" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M22.5 34 Q23.2 33.5 24 34" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.25" />
            {/* Fronds */}
            <path d="M22.5 28 Q16 24 10 24 Q16 22 22 26" fill={color} opacity="0.7" />
            <path d="M22.5 28 Q28 22 34 22 Q28 20 22.5 25" fill={color} opacity="0.65" />
            <path d="M22.5 28 Q20 22 18 18 Q22 20 23 26" fill={color} opacity="0.6" />
            <path d="M22.5 28 Q26 22 30 18 Q26 20 23 26" fill={color} opacity="0.55" />
            {/* Frond midribs */}
            <path d="M22.5 27 Q16 24 11 24" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M22.5 27 Q28 22 33 22" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.18" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Curved trunk */}
            <path d="M25 46 Q23 36 22 22" stroke="#a08860" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M25 46 Q23 36 22 22" stroke={trunk} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            {/* Ring marks */}
            <path d="M23.5 40 Q24.5 39.5 25.5 40" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M23 34 Q24 33.5 25 34" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.25" />
            <path d="M22.5 28 Q23.5 27.5 24.2 28" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Fronds — 6 total */}
            <path d="M22 22 Q14 18 6 18 Q14 16 21 20" fill={color} opacity="0.7" />
            <path d="M22 22 Q30 16 38 16 Q30 14 22.5 19" fill={color} opacity="0.65" />
            <path d="M22 22 Q17 14 14 10 Q19 14 22 19" fill={color} opacity="0.6" />
            <path d="M22 22 Q27 14 32 10 Q27 14 22.5 19" fill={color} opacity="0.55" />
            <path d="M22 22 Q22 14 24 8 Q24 14 22.5 19" fill={light} opacity="0.4" />
            <path d="M22 22 Q18 16 16 12 Q20 16 22 19" fill={dark} opacity="0.15" />
            {/* Midribs */}
            <path d="M22 21 Q14 18 7 18" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M22 21 Q30 16 37 16" stroke={dark} strokeWidth="0.45" fill="none" opacity="0.18" />
            <path d="M22 21 Q22 14 24 9" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-ptrunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8a7650" />
                <stop offset="50%" stopColor="#bfa87a" />
                <stop offset="100%" stopColor="#8a7650" />
              </linearGradient>
            </defs>
            {/* Curved trunk */}
            <path d="M26 46 Q23 34 21 18" stroke={`url(#${uid}-ptrunk)`} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M26 46 Q23 34 21 18" stroke={trunk} strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Ring marks */}
            <path d="M24 42 Q25.5 41 26.5 42" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.35" />
            <path d="M23.5 36 Q25 35 26 36" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M23 30 Q24.5 29 25.5 30" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.25" />
            <path d="M22 24 Q23 23 24 24" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Fronds — 10 spreading */}
            <path d="M21 18 Q12 14 4 14 Q12 12 20 16" fill={color} opacity="0.7" />
            <path d="M21 18 Q32 12 42 12 Q32 10 21.5 15" fill={color} opacity="0.65" />
            <path d="M21 18 Q14 10 10 6 Q16 10 21 15" fill={color} opacity="0.65" />
            <path d="M21 18 Q28 10 34 6 Q28 10 21.5 15" fill={color} opacity="0.6" />
            <path d="M21 18 Q21 10 23 4 Q23 10 21.5 15" fill={color} opacity="0.6" />
            <path d="M21 18 Q16 12 12 8 Q18 12 21 15" fill={light} opacity="0.25" />
            <path d="M21 18 Q26 12 30 8 Q26 12 21.5 15" fill={dark} opacity="0.1" />
            <path d="M21 18 Q10 16 4 18 Q10 14 20 16" fill={dark} opacity="0.12" />
            <path d="M21 18 Q8 12 2 10 Q8 10 20 15" fill={color} opacity="0.45" />
            <path d="M21 18 Q34 14 44 16 Q34 12 21.5 15" fill={color} opacity="0.4" />
            {/* Midribs */}
            <path d="M21 17 Q12 14 5 14" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.25" />
            <path d="M21 17 Q32 12 41 12" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M21 17 Q14 10 11 7" stroke={dark} strokeWidth="0.45" fill="none" opacity="0.18" />
            <path d="M21 17 Q28 10 33 7" stroke={dark} strokeWidth="0.45" fill="none" opacity="0.18" />
            <path d="M21 17 Q21 10 23 5" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M21 17 Q8 12 3 10" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.15" />
            <path d="M21 17 Q34 14 43 16" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.12" />
            {/* Coconut cluster — detailed */}
            <ellipse cx="19.5" cy="19.5" rx="1.5" ry="1.8" fill="#8d6e47" />
            <ellipse cx="19.5" cy="19.5" rx="1.5" ry="1.8" fill="#a07850" opacity="0.6" />
            <circle cx="19" cy="18.8" r="0.3" fill="#5d4037" opacity="0.6" />
            <circle cx="20" cy="18.8" r="0.25" fill="#5d4037" opacity="0.5" />
            <circle cx="19.5" cy="19.3" r="0.2" fill="#5d4037" opacity="0.4" />
            <ellipse cx="22" cy="20" rx="1.3" ry="1.5" fill="#795548" />
            <ellipse cx="22" cy="20" rx="1.3" ry="1.5" fill="#8d6e47" opacity="0.5" />
            <circle cx="21.7" cy="19.3" r="0.25" fill="#4e342e" opacity="0.5" />
            <circle cx="22.3" cy="19.3" r="0.2" fill="#4e342e" opacity="0.4" />
            <ellipse cx="20.8" cy="21" rx="1.2" ry="1.3" fill="#6d4c41" opacity="0.85" />
            <circle cx="20.5" cy="20.5" r="0.2" fill="#3e2723" opacity="0.4" />
          </g>
        )

      case 'bonsai':
        if (s === 0) return (
          <g>
            <path d="M24 41 Q23 38 24 35" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M19.5 33.5 Q20.5 31.3 23 31.3 Q25.5 31.3 26.5 33.5 Q25.5 35.7 23 35.7 Q20.5 35.7 19.5 33.5 Z" fill="#1b5e20" opacity="0.7" />
            <path d="M22.7 33 Q23.5 31.2 25.5 31.2 Q27.5 31.2 28.3 33 Q27.5 34.8 25.5 34.8 Q23.5 34.8 22.7 33 Z" fill="#2e7d32" opacity="0.7" />
            <rect x="18" y="42" width="12" height="4" rx="1" fill="#8d6048" />
            <rect x="17" y="41" width="14" height="2" rx="1" fill="#a07050" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 41 Q20 36 22 30 Q24 26 26 28" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 34 L24.5 33.5" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <path d="M24 26 Q20 24 17 25 Q19 22 24 24" fill="#1b5e20" opacity="0.65" />
            <path d="M24 26 Q28 22 31 23 Q29 20 24 23" fill="#2e7d32" opacity="0.6" />
            <path d="M17 26 Q20 22 24 21 Q28 22 31 26 Q28 28 24 27 Q20 28 17 26Z" fill="#1b5e20" opacity="0.55" />
            <path d="M25 26 Q27 23 29 22 Q30 23 29 26Z" fill="#2e7d32" opacity="0.35" />
            <rect x="16" y="42" width="16" height="4" rx="1.5" fill="#8d6048" />
            <rect x="15" y="41" width="18" height="2" rx="1" fill="#a07050" />
            <path d="M18 41 L18 42" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
            <path d="M30 41 L30 42" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 41 Q18 36 20 30 Q22 26 28 24 Q30 22 28 18" stroke={trunk} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M22 34 L23.5 33.5" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M26 26 L27.5 25.5" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M22 28 Q16 26 12 24" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M28 16 Q24 14 21 15 Q23 12 28 14" fill="#1b5e20" opacity="0.65" />
            <path d="M28 16 Q32 12 35 13 Q33 10 28 13" fill="#2e7d32" opacity="0.6" />
            <path d="M20 16 Q24 11 28 10 Q33 11 36 16 Q32 18 28 17 Q23 18 20 16Z" fill="#1b5e20" opacity="0.6" />
            <path d="M31 16 Q33 13 34 12 Q36 13 35 16Z" fill="#2e7d32" opacity="0.35" />
            <path d="M12 24 Q10 22 8 23 Q9 20 12 22" fill="#1b5e20" opacity="0.55" />
            <path d="M7 23 Q10 19 12 18 Q15 19 17 23 Q14 25 12 24 Q9 25 7 23Z" fill="#1b5e20" opacity="0.5" />
            <path d="M9 23 Q10 20 11 19 Q12 20 11 23Z" fill="#2e7d32" opacity="0.3" />
            <rect x="14" y="42" width="20" height="4" rx="2" fill="#8d6048" />
            <rect x="13" y="41" width="22" height="2" rx="1" fill="#a07050" />
            <path d="M16 42 L16 45" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
            <path d="M32 42 L32 45" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-bpot`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b07858" />
                <stop offset="100%" stopColor="#6a4430" />
              </linearGradient>
              <linearGradient id={`${uid}-btrunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
                <stop offset="40%" stopColor="#fff" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M24 41 Q17 35 19.5 29 Q22 25 27.5 23 Q31 21 29.5 16 Q28 12 26.5 12" stroke={trunk} strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M24 41 Q17 35 19.5 29 Q22 25 27.5 23 Q31 21 29.5 16 Q28 12 26.5 12" stroke={`url(#${uid}-btrunk)`} strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M22 36 L23.5 35" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M21 38 L22 37.5" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M24 28 L25.5 27" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M29 18 L30.5 17" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M27 22 Q28 21 27.5 20" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M20 32 Q21 31 20.5 30" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M20.5 31 Q15 27 11.5 25.5" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M26.5 21 Q31 19 34.5 17.5" stroke={trunk} strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M26.5 10 Q19.5 6.5 17 8 L18.5 5.5 Q22.5 4.5 26.5 7Z" fill="#1b5e20" />
            <path d="M26.5 10 Q33 6.5 35.5 8 L34 5.5 Q29.5 4.5 26.5 7Z" fill="#2e7d32" />
            <path d="M17 11 Q21 7 26.5 6.5 Q32 7 35.5 11 Q33 12.5 26.5 12 Q20 12.5 17 11Z" fill="#1b5e20" />
            <path d="M18 10 Q16.5 7.5 17 5.5 Q18.5 6.5 18.5 9Z" fill="#2e7d32" />
            <path d="M34.5 10 Q36 7.5 35.5 5.5 Q34 6.5 34 9Z" fill="#1b5e20" />
            <path d="M21 9 Q19.5 6.5 21 5.5 Q23 6.5 22.5 9Z" fill="#2e7d32" opacity="0.85" />
            <path d="M31.5 10 Q33 7.5 32 5.5 Q30.5 6.5 30.5 9Z" fill="#1b5e20" opacity="0.9" />
            <path d="M26.5 8 Q25 5.5 26.5 4.5 Q28 5.5 28 8Z" fill="#245a1c" opacity="0.8" />
            <path d="M20 10 Q18.5 11.5 20 12.5" fill="#2e7d32" opacity="0.7" />
            <path d="M11.5 25.5 Q10 24 8 24.5 Q9 22 11.5 23.5" fill="#1b5e20" />
            <path d="M6 24 Q8.5 20.5 11.5 19.5 Q15 20 16.5 23.5 Q14 25.5 11.5 25.5 Q8 25.5 6 24Z" fill="#1b5e20" />
            <path d="M7 23 Q6 21 7 19.5 Q8.5 20.5 8 23Z" fill="#2e7d32" />
            <path d="M10 23 Q8.5 20.5 9 19.5 Q10.5 20.5 10.5 23Z" fill="#2e7d32" opacity="0.85" />
            <path d="M14 24.5 Q13 22 14 21 Q15.5 22 15 24.5Z" fill="#245a1c" opacity="0.8" />
            <path d="M34.5 17.5 Q33 16 31.5 16.5 Q32.5 14 34.5 15.5" fill="#1b5e20" />
            <path d="M31.5 16.5 Q33 14 34.5 13 Q37 14 38 16.5 Q36.5 18 34.5 18 Q32 18 31.5 16.5Z" fill="#1b5e20" />
            <path d="M33 15.5 Q32 14 33 13 Q34.5 14 34 15.5Z" fill="#2e7d32" opacity="0.85" />
            <path d="M37 16.5 Q38 15 37.5 13 Q36.5 14 36.5 16.5Z" fill="#245a1c" opacity="0.7" />
            <circle cx="20" cy="32" r="1" fill="#7a9a60" opacity="0.3" />
            <circle cx="22" cy="30" r="0.7" fill="#7a9a60" opacity="0.25" />
            <rect x="12" y="42" width="24" height="4" rx="2" fill={`url(#${uid}-bpot)`} />
            <rect x="11" y="41" width="26" height="2" rx="1" fill="#a07050" />
            <path d="M14 42 L14 45" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
            <path d="M34 42 L34 45" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
            <path d="M20 42 L28 42" stroke="#c09070" strokeWidth="0.5" opacity="0.3" />
          </g>
        )

      case 'baobab':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 43 24 40" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="42" rx="3" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 40 Q22 37 20 38 Q22 36 24 39Z" fill={color} />
            <path d="M24 40 Q26 37 28 38 Q26 36 24 39Z" fill={dark} />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M21 46 Q20.5 40 21 34 L27 34 Q27.5 40 27 46 Z" fill={trunk} />
            <path d="M22 38 L26 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M22 42 L26 41.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M17 28 Q17 22 24 22 Q31 22 31 28 Q31 34 24 34 Q17 34 17 28Z" fill={color} />
            <path d="M19 26 Q18 23 21 22 Q23 24 20 27Z" fill={dark} opacity="0.8" />
            <path d="M27 26 Q26 23 28 22 Q30 24 28 27Z" fill={light} opacity="0.8" />
            <path d="M22 30 Q21 28 24 28 Q23 30 22 31Z" fill={dark} opacity="0.75" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-bark`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M18 46 Q17 38 18 28 L30 28 Q31 38 30 46 Z" fill={trunk} />
            <path d="M18 46 Q17 38 18 28 L30 28 Q31 38 30 46 Z" fill={`url(#${uid}-bark)`} />
            {/* Bark horizontal lines */}
            <path d="M19 32 L29 31.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M18.5 36 L29.5 35.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M18.5 40 L29.5 39.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M19 44 L29 43.8" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            {/* Branches */}
            <path d="M20 28 Q16 24 14 20" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M28 28 Q32 24 34 20" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 28 Q24 24 24 20" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Left branch leaf cluster — palmate */}
            <path d="M14 20 Q13 17 14 14 Q15 17 14 20Z" fill={color} opacity="0.85" />
            <path d="M14 20 Q11 18 10 15 Q13 17 14 20Z" fill={dark} opacity="0.8" />
            <path d="M14 20 Q17 18 18 15 Q15 17 14 20Z" fill={light} opacity="0.85" />
            <path d="M14 20 Q12 19 11 17 Q13 18 14 20Z" fill={color} opacity="0.75" />
            <path d="M14 20 Q16 19 17 17 Q15 18 14 20Z" fill={dark} opacity="0.7" />
            {/* Right branch leaf cluster — palmate */}
            <path d="M34 20 Q33 17 34 14 Q35 17 34 20Z" fill={color} opacity="0.85" />
            <path d="M34 20 Q31 18 30 15 Q33 17 34 20Z" fill={dark} opacity="0.8" />
            <path d="M34 20 Q37 18 38 15 Q35 17 34 20Z" fill={light} opacity="0.85" />
            <path d="M34 20 Q32 19 31 17 Q33 18 34 20Z" fill={color} opacity="0.75" />
            <path d="M34 20 Q36 19 37 17 Q35 18 34 20Z" fill={dark} opacity="0.7" />
            {/* Center leaf cluster — palmate */}
            <path d="M24 20 Q23 17 24 14 Q25 17 24 20Z" fill={color} opacity="0.85" />
            <path d="M24 20 Q21 18 20 16 Q23 18 24 20Z" fill={dark} opacity="0.8" />
            <path d="M24 20 Q27 18 28 16 Q25 18 24 20Z" fill={light} opacity="0.8" />
            {/* Roots */}
            <path d="M18 46 Q15 44 13 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M30 46 Q33 44 35 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-bark`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
                <stop offset="35%" stopColor="#fff" stopOpacity="0.05" />
                <stop offset="65%" stopColor="#fff" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            {/* Massive trunk — taller, reaching to y=16 */}
            <path d="M14 46 Q12 36 14 16 L34 16 Q36 36 34 46 Z" fill={trunk} />
            <path d="M14 46 Q12 36 14 16 L34 16 Q36 36 34 46 Z" fill={`url(#${uid}-bark)`} />
            {/* Bark texture — horizontal lines */}
            <path d="M15 20 L33 19.8" stroke={dark} strokeWidth="0.6" opacity="0.25" />
            <path d="M14.5 24 L33.5 23.8" stroke={dark} strokeWidth="0.6" opacity="0.22" />
            <path d="M14 28 L34 27.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M14 32 L34 31.8" stroke={dark} strokeWidth="0.5" opacity="0.18" />
            <path d="M14.5 36 L33.5 35.8" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            <path d="M15 40 L33 39.8" stroke={dark} strokeWidth="0.4" opacity="0.12" />
            <path d="M14.5 44 L33.5 43.8" stroke={dark} strokeWidth="0.35" opacity="0.1" />
            {/* Trunk center line */}
            <path d="M24 46 L24 16" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.08" />
            {/* Branches spreading from top of trunk */}
            <path d="M16 18 Q10 14 6 10" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M32 18 Q38 14 42 10" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M20 16 Q16 12 12 8" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M28 16 Q32 12 36 8" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 16 Q24 12 24 8" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M18 17 Q14 16 10 14" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M30 17 Q34 16 38 14" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Dense canopy clusters at branch tips */}
            <ellipse cx="6" cy="8" rx="5" ry="4" fill={dark} opacity="0.85" />
            <ellipse cx="6" cy="7" rx="4" ry="3" fill={color} opacity="0.9" />
            <ellipse cx="5" cy="6" rx="2.5" ry="2" fill={light} opacity="0.5" />
            <ellipse cx="42" cy="8" rx="5" ry="4" fill={dark} opacity="0.85" />
            <ellipse cx="42" cy="7" rx="4" ry="3" fill={color} opacity="0.9" />
            <ellipse cx="43" cy="6" rx="2.5" ry="2" fill={light} opacity="0.5" />
            <ellipse cx="12" cy="6" rx="5" ry="3.5" fill={dark} opacity="0.85" />
            <ellipse cx="12" cy="5" rx="4" ry="3" fill={color} opacity="0.9" />
            <ellipse cx="11" cy="4.5" rx="2.5" ry="1.8" fill={light} opacity="0.45" />
            <ellipse cx="36" cy="6" rx="5" ry="3.5" fill={dark} opacity="0.85" />
            <ellipse cx="36" cy="5" rx="4" ry="3" fill={color} opacity="0.9" />
            <ellipse cx="37" cy="4.5" rx="2.5" ry="1.8" fill={light} opacity="0.45" />
            <ellipse cx="24" cy="6" rx="5" ry="3.5" fill={dark} opacity="0.85" />
            <ellipse cx="24" cy="5" rx="4" ry="3" fill={color} opacity="0.9" />
            <ellipse cx="24" cy="4" rx="2.5" ry="2" fill={light} opacity="0.5" />
            {/* Lower branch clusters */}
            <ellipse cx="10" cy="12" rx="4" ry="3" fill={dark} opacity="0.8" />
            <ellipse cx="10" cy="11" rx="3" ry="2.5" fill={color} opacity="0.85" />
            <ellipse cx="38" cy="12" rx="4" ry="3" fill={dark} opacity="0.8" />
            <ellipse cx="38" cy="11" rx="3" ry="2.5" fill={color} opacity="0.85" />
            <ellipse cx="18" cy="10" rx="3.5" ry="2.5" fill={dark} opacity="0.75" />
            <ellipse cx="18" cy="9" rx="2.5" ry="2" fill={color} opacity="0.8" />
            <ellipse cx="30" cy="10" rx="3.5" ry="2.5" fill={dark} opacity="0.75" />
            <ellipse cx="30" cy="9" rx="2.5" ry="2" fill={color} opacity="0.8" />
            {/* Roots */}
            <path d="M14 46 Q10 43 8 46" stroke={trunk} strokeWidth="1.2" fill="none" opacity="0.35" />
            <path d="M34 46 Q38 43 40 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M18 46 Q16 44.5 14 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.2" />
            <path d="M30 46 Q32 44.5 34 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.18" />
          </g>
        )

      case 'coral':
        if (s === 0) return (
          <g>
            <ellipse cx="24" cy="46" rx="3" ry="1" fill={dark} opacity="0.25" />
            <path d="M24 47 L24 41 Q22 39 21 37 M24 41 Q26 39 27 38" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="21" cy="37" r="0.5" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <ellipse cx="24" cy="46" rx="4" ry="1.2" fill={dark} opacity="0.25" />
            <path d="M24 47 L24 34 M24 38 Q20 34 18 30 Q16 28 14 26 M24 36 Q28 32 30 28 Q32 26 34 24" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="14" cy="26" r="1" fill={light} opacity="0.4" />
            <circle cx="34" cy="24" r="0.8" fill={light} opacity="0.35" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-crglow`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={light} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0.1" />
              </radialGradient>
            </defs>
            <ellipse cx="24" cy="46" rx="5" ry="1.5" fill={dark} opacity="0.25" />
            <path d="M24 47 L24 30" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <path d="M24 36 Q18 32 14 28 Q12 26 10 22 M14 28 Q16 24 18 20 M24 34 Q30 30 34 26 Q36 24 38 20 M34 26 Q32 22 30 18 M24 32 Q24 26 24 20 M24 24 Q22 20 20 16 M24 24 Q26 20 28 16" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="10" cy="22" r="1.2" fill={light} opacity="0.4" />
            <circle cx="38" cy="20" r="1" fill={light} opacity="0.35" />
            <circle cx="18" cy="20" r="0.8" fill={light} opacity="0.3" />
            <circle cx="30" cy="18" r="0.8" fill={light} opacity="0.3" />
            <circle cx="24" cy="20" r="0.7" fill={light} opacity="0.25" />
            <circle cx="20" cy="16" r="0.6" fill={light} opacity="0.25" />
            <circle cx="28" cy="16" r="0.6" fill={light} opacity="0.22" />
            <circle cx="16" cy="14" r="0.5" fill="#fff" opacity="0.3">
              <animate attributeName="cy" values="14;10;14" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="32" cy="12" r="0.4" fill="#fff" opacity="0.25">
              <animate attributeName="cy" values="12;8;12" dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.1;0.25" dur="3.5s" repeatCount="indefinite" />
            </circle>
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-crglow`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={light} stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
              <filter id={`${uid}-crblur`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
              </filter>
              <linearGradient id={`${uid}-crbranch`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={color} />
              </linearGradient>
            </defs>
            <ellipse cx="24" cy="36" rx="12" ry="10" fill={`url(#${uid}-crglow)`} filter={`url(#${uid}-crblur)`} opacity="0.35" />
            <ellipse cx="24" cy="46" rx="4" ry="1.2" fill={dark} opacity="0.3" />
            <path d="M24 47 L24 36" stroke={`url(#${uid}-crbranch)`} strokeWidth="3" strokeLinecap="round" />
            <path d="M24 42 Q19 38 15 34 Q13 31 11 28 Q10 26 10 23 M15 34 Q16 31 17 28 Q16 27 16 25 M24 40 Q29 36 33 32 Q35 29 37 26 Q38 24 38 22 M33 32 Q32 29 31 26 Q32 25 32 23 M24 38 Q24 34 24 29 M24 32 Q21 28 19 24 Q18 23 18 21 M24 32 Q27 28 29 24 Q30 23 30 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M15 34 Q13 31 11 28 Q10 26 10 23 M15 34 Q16 31 17 28 Q16 27 16 25 M33 32 Q35 29 37 26 Q38 24 38 22 M33 32 Q32 29 31 26 Q32 25 32 23 M24 32 Q21 28 19 24 Q18 23 18 21 M24 32 Q27 28 29 24 Q30 23 30 21" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M24 42 Q19 38 15 34" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M24 40 Q29 36 33 32" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M24 38 Q24 34 24 29" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="10" cy="23" r="0.9" fill={light} opacity="0.45" />
            <circle cx="16" cy="25" r="0.7" fill={light} opacity="0.4" />
            <circle cx="38" cy="22" r="0.8" fill={light} opacity="0.4" />
            <circle cx="32" cy="23" r="0.6" fill={light} opacity="0.35" />
            <circle cx="18" cy="21" r="0.6" fill={light} opacity="0.35" />
            <circle cx="30" cy="21" r="0.55" fill={light} opacity="0.3" />
            <circle cx="24" cy="29" r="0.55" fill={light} opacity="0.28" />
            <circle cx="17" cy="28" r="0.5" fill={light} opacity="0.25" />
            <circle cx="31" cy="26" r="0.5" fill={light} opacity="0.22" />
            <circle cx="14" cy="30" r="0.5" fill="#fff" opacity="0.3">
              <animate attributeName="cy" values="30;22;30" dur="5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="28" cy="26" r="0.45" fill="#fff" opacity="0.25">
              <animate attributeName="cy" values="26;18;26" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.05;0.25" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="34" cy="28" r="0.4" fill="#fff" opacity="0.22">
              <animate attributeName="cy" values="28;20;28" dur="4.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.22;0.05;0.22" dur="4.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="20" cy="24" r="0.35" fill="#fff" opacity="0.2">
              <animate attributeName="cy" values="24;18;24" dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="3.5s" repeatCount="indefinite" />
            </circle>
          </g>
        )

      case 'starweaver':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24.2 38 Q24 36 24 35" stroke="#3e3570" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M24 36.5 Q22.5 35.5 22 35.2" stroke="#3e3570" strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M24 36.5 Q25.5 35.5 26 35.2" stroke="#3e3570" strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M24 34.5 L24 35.2 L24.5 34.5 L24 33.8 L23.5 34.5Z" fill="#e8eaf6" opacity="0.85">
              <animate attributeName="opacity" values="0.85;0.3;0.85" dur="2s" repeatCount="indefinite" />
            </path>
            <path d="M22.2 35.2 Q23.2 35.8 25.8 35.2" stroke="#7986cb" strokeWidth="0.3" opacity="0.2" fill="none" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23.2 40 24.3 34 Q24 31 24 30" stroke="#3e3570" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M24 35 Q20.5 31.5 18 29" stroke="#3e3570" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M24 35 Q27.5 31.5 30 29" stroke="#3e3570" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q22 29.5 20.5 28" stroke="#3e3570" strokeWidth="0.35" strokeLinecap="round" fill="none" />
            <path d="M18 29 Q22 30 24 29 Q26 30 30 29" stroke="#7986cb" strokeWidth="0.35" opacity="0.25" fill="none" />
            <path d="M20.5 28 Q23 28.5 30 29" stroke="#c5cae9" strokeWidth="0.3" opacity="0.2" fill="none" />
            <path d="M18 29 Q19 28.3 20.5 28" stroke="#7986cb" strokeWidth="0.3" opacity="0.18" fill="none" />
            <path d="M24 29 L24.5 28.3 L24 27.6 L23.5 28.3Z" fill="#e8eaf6" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.2s" repeatCount="indefinite" />
            </path>
            <path d="M21 28.8 L21.3 28.4 L21 28 L20.7 28.4Z" fill="#fff" opacity="0.65">
              <animate attributeName="opacity" values="0.65;0.1;0.65" dur="1.9s" repeatCount="indefinite" begin="0.6s" />
            </path>
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a4080" />
                <stop offset="100%" stopColor="#2a2050" />
              </linearGradient>
            </defs>
            <path d="M24 46 Q23 40 24.5 34 Q23.8 28 24 24" stroke={`url(#${uid}-trunk)`} strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q19 29 16 25" stroke="#3e3570" strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q29 29 32 25" stroke="#3e3570" strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M24 29 Q20 24 17.5 21" stroke="#3e3570" strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M24 29 Q28 24 30.5 21" stroke="#3e3570" strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M16 25 Q21 26 24 24.5 Q27 26 32 25" stroke="#7986cb" strokeWidth="0.4" opacity="0.28" fill="none" />
            <path d="M17.5 21 Q22 22 24 21 Q26 22 30.5 21" stroke="#c5cae9" strokeWidth="0.35" opacity="0.22" fill="none" />
            <path d="M16 25 Q16.5 23 17.5 21" stroke="#7986cb" strokeWidth="0.3" opacity="0.2" fill="none" />
            <path d="M32 25 Q31.5 23 30.5 21" stroke="#7986cb" strokeWidth="0.3" opacity="0.2" fill="none" />
            <path d="M16 25 Q22 22.5 30.5 21" stroke="#c5cae9" strokeWidth="0.3" opacity="0.14" fill="none" />
            <path d="M32 25 Q26 22.5 17.5 21" stroke="#c5cae9" strokeWidth="0.3" opacity="0.14" fill="none" />
            <path d="M24 23.5 L24.6 22.5 L24 21.5 L23.4 22.5Z" fill="#fff" opacity="0.85">
              <animate attributeName="opacity" values="0.85;0.15;0.85" dur="2s" repeatCount="indefinite" />
            </path>
            <path d="M19 23.5 L19.4 22.8 L19 22.1 L18.6 22.8Z" fill="#e8eaf6" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2.4s" repeatCount="indefinite" begin="0.4s" />
            </path>
            <path d="M29 23.5 L29.4 22.8 L29 22.1 L28.6 22.8Z" fill="#e8eaf6" opacity="0.75">
              <animate attributeName="opacity" values="0.75;0.1;0.75" dur="1.8s" repeatCount="indefinite" begin="0.8s" />
            </path>
            <path d="M24 21 L24.3 20.5 L24 20 L23.7 20.5Z" fill="#c5cae9" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.6s" repeatCount="indefinite" begin="1.2s" />
            </path>
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes swTwk-${uid} {
                  0%, 100% { opacity: 0.9; }
                  50% { opacity: 0.1; }
                }
                @keyframes swDrift-${uid} {
                  0% { transform: translate(0,0); opacity: 0; }
                  8% { opacity: 0.7; }
                  25% { opacity: 0.7; }
                  30% { transform: translate(8px,3px); opacity: 0; }
                  100% { opacity: 0; }
                }
              `}</style>
              <linearGradient id={`${uid}-swtrk`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a4080" />
                <stop offset="100%" stopColor="#2a2050" />
              </linearGradient>
              <radialGradient id={`${uid}-swgl`} cx="50%" cy="42%">
                <stop offset="0%" stopColor="#3949ab" stopOpacity="0.1" />
                <stop offset="70%" stopColor="#1a237e" stopOpacity="0.04" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M18 20 Q21 18 24 17 Q27 16 30 15 Q28 19 24 20 Q20 21 18 20" fill={`url(#${uid}-swgl)`} opacity="0.5" />
            <path d="M24 46 Q22.8 40 24.5 34 Q23.5 28 24.2 22 Q24 18 24 14" stroke={`url(#${uid}-swtrk)`} strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <path d="M24.3 44 Q24.8 42 24.2 40" stroke="#5a50a0" strokeWidth="0.2" opacity="0.2" fill="none" />
            <path d="M23.8 36 Q23.3 34 24 32" stroke="#5a50a0" strokeWidth="0.2" opacity="0.2" fill="none" />
            <path d="M24 36 Q20 33 15 30 Q12 29 10 28.5" stroke="#3e3570" strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M10 28.5 Q8 30 7 28 Q8.5 26.5 10 28.5" stroke="#3e3570" strokeWidth="0.35" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q28 32 33 30 Q36 29.5 38 30" stroke="#3e3570" strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M38 30 Q40 28 39 26.5" stroke="#3e3570" strokeWidth="0.3" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q19 25 14 21 Q11 19.5 9 20" stroke="#3e3570" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M9 20 Q7 18.5 8 17 Q10 17.5 9 20" stroke="#3e3570" strokeWidth="0.25" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q29 24 35 20 Q38 18 40 17.5" stroke="#3e3570" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M40 17.5 Q42 16 41 14.5" stroke="#3e3570" strokeWidth="0.25" strokeLinecap="round" fill="none" />
            <path d="M24 24 Q18 18 12 14 Q9 12.5 7 13" stroke="#3e3570" strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M7 13 Q5 11 6 9.5" stroke="#3e3570" strokeWidth="0.2" strokeLinecap="round" fill="none" />
            <path d="M24 24 Q30 17 36 13 Q39 11 42 11.5" stroke="#3e3570" strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M42 11.5 Q44 10 43 8.5" stroke="#3e3570" strokeWidth="0.2" strokeLinecap="round" fill="none" />
            <path d="M24 19 Q21 15 18 12 Q16 10.5 15 8" stroke="#3e3570" strokeWidth="0.3" strokeLinecap="round" fill="none" />
            <path d="M24 19 Q27 14 31 11 Q33 9.5 34 8" stroke="#3e3570" strokeWidth="0.3" strokeLinecap="round" fill="none" />
            <path d="M10 28.5 Q17 29 24 27 Q31 29 38 30" stroke="#7986cb" strokeWidth="0.3" opacity="0.22" fill="none" />
            <path d="M9 20 Q16 20.5 24 18.5 Q32 20.5 40 17.5" stroke="#c5cae9" strokeWidth="0.25" opacity="0.18" fill="none" />
            <path d="M7 13 Q15 14 24 12 Q33 14 42 11.5" stroke="#7986cb" strokeWidth="0.2" opacity="0.14" fill="none" />
            <path d="M10 28.5 Q9.5 24 9 20" stroke="#7986cb" strokeWidth="0.2" opacity="0.14" fill="none" />
            <path d="M38 30 Q39 24 40 17.5" stroke="#7986cb" strokeWidth="0.2" opacity="0.14" fill="none" />
            <path d="M9 20 Q8 16.5 7 13" stroke="#c5cae9" strokeWidth="0.2" opacity="0.12" fill="none" />
            <path d="M40 17.5 Q41 14.5 42 11.5" stroke="#c5cae9" strokeWidth="0.2" opacity="0.12" fill="none" />
            <path d="M10 28.5 Q22 22 40 17.5" stroke="#c5cae9" strokeWidth="0.2" opacity="0.1" fill="none" />
            <path d="M38 30 Q26 22 9 20" stroke="#c5cae9" strokeWidth="0.2" opacity="0.1" fill="none" />
            <path d="M24 27 L24.7 25.8 L24 24.6 L23.3 25.8Z" fill="#fff" style={{animation: `swTwk-${uid} 2s ease-in-out infinite`} as React.CSSProperties} />
            <path d="M17 24 L17.5 23.2 L17 22.4 L16.5 23.2Z" fill="#e8eaf6" style={{animation: `swTwk-${uid} 2.4s ease-in-out infinite 0.3s`} as React.CSSProperties} />
            <path d="M31 24 L31.5 23.2 L31 22.4 L30.5 23.2Z" fill="#e8eaf6" style={{animation: `swTwk-${uid} 2.2s ease-in-out infinite 0.7s`} as React.CSSProperties} />
            <path d="M24 18.5 L24.6 17.3 L24 16.1 L23.4 17.3Z" fill="#fff" style={{animation: `swTwk-${uid} 1.8s ease-in-out infinite 1s`} as React.CSSProperties} />
            <path d="M15 19 L15.4 18.3 L15 17.6 L14.6 18.3Z" fill="#c5cae9" style={{animation: `swTwk-${uid} 2.6s ease-in-out infinite 0.5s`} as React.CSSProperties} />
            <path d="M33 19 L33.4 18.3 L33 17.6 L32.6 18.3Z" fill="#c5cae9" style={{animation: `swTwk-${uid} 2.8s ease-in-out infinite 1.3s`} as React.CSSProperties} />
            <path d="M19 14 L19.4 13.2 L19 12.4 L18.6 13.2Z" fill="#e8eaf6" style={{animation: `swTwk-${uid} 2.1s ease-in-out infinite 1.6s`} as React.CSSProperties} />
            <path d="M29 14 L29.4 13.2 L29 12.4 L28.6 13.2Z" fill="#fff" style={{animation: `swTwk-${uid} 2.5s ease-in-out infinite 0.9s`} as React.CSSProperties} />
            <path d="M24 12 L24.7 10.6 L24 9.2 L23.3 10.6Z" fill="#fff" style={{animation: `swTwk-${uid} 1.9s ease-in-out infinite 0.2s`} as React.CSSProperties} />
            <path d="M12 16 Q14 15.5 16 15" stroke="#c5cae9" strokeWidth="0.4" opacity="0.15" fill="none" style={{animation: `swDrift-${uid} 5s linear infinite 1s`} as React.CSSProperties} />
          </g>
        )

      case 'leviathan':
        if (s === 0) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-bio`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 Q23.5 42 24 38 Q24.5 36 24 35" stroke="#004d40" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="35" r="1" fill="#00e5ff" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="24" cy="38" r="0.5" fill="#00e5ff" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </circle>
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <filter id={`${uid}-glow`}>
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id={`${uid}-bio`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.7" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 Q23 40 24 34 Q25 32 24 30" stroke="#004d40" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Tentacle branch */}
            <path d="M24 34 Q20 30 17 28 Q15 27 14 28" stroke="#006064" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Bioluminescent spots */}
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="30" r="0.8" fill="#00e5ff" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.15;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="18" cy="28" r="0.6" fill="#00e5ff" opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" begin="0.4s" />
              </circle>
              <circle cx="14" cy="28" r="0.5" fill="#18ffff" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" begin="0.8s" />
              </circle>
            </g>
            {/* Bubble */}
            <circle cx="22" cy="26" r="0.6" fill="none" stroke="#00e5ff" strokeWidth="0.3" opacity="0.3">
              <animate attributeName="cy" values="26;20" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#004d40" />
                <stop offset="100%" stopColor="#006064" />
              </linearGradient>
            </defs>
            <path d="M24 46 Q22 40 24 34 Q26 30 24 26 Q22 22 24 20" stroke={`url(#${uid}-trunk)`} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Tentacle branches */}
            <path d="M24 30 Q18 26 14 24 Q12 23 10 24 Q8 25 7 24" stroke="#006064" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 26 Q30 22 34 20 Q36 19 38 20" stroke="#006064" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 22 Q20 18 16 16 Q14 16 12 17" stroke="#006064" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            {/* Bioluminescent trail */}
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="20" r="0.8" fill="#00e5ff" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.15;0.7" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="18" cy="26" r="0.7" fill="#00e5ff" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite" begin="0.3s" />
              </circle>
              <circle cx="10" cy="24" r="0.6" fill="#18ffff" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite" begin="0.6s" />
              </circle>
              <circle cx="34" cy="20" r="0.6" fill="#00e5ff" opacity="0.45">
                <animate attributeName="opacity" values="0.45;0.1;0.45" dur="1.8s" repeatCount="indefinite" begin="0.9s" />
              </circle>
              <circle cx="16" cy="16" r="0.5" fill="#18ffff" opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.05;0.4" dur="1.8s" repeatCount="indefinite" begin="1.2s" />
              </circle>
              <circle cx="7" cy="24" r="0.5" fill="#00e5ff" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite" begin="1.5s" />
              </circle>
              <circle cx="38" cy="20" r="0.5" fill="#18ffff" opacity="0.45">
                <animate attributeName="opacity" values="0.45;0.05;0.45" dur="1.8s" repeatCount="indefinite" begin="1.8s" />
              </circle>
            </g>
            {/* Bubbles */}
            <circle cx="20" cy="18" r="0.7" fill="none" stroke="#00e5ff" strokeWidth="0.3" opacity="0.3">
              <animate attributeName="cy" values="18;10" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="28" cy="22" r="0.5" fill="none" stroke="#18ffff" strokeWidth="0.25" opacity="0.25">
              <animate attributeName="cy" values="22;14" dur="3.5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="opacity" values="0.25;0" dur="3.5s" repeatCount="indefinite" begin="1s" />
            </circle>
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes levPulse-${uid} {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 0.1; }
                }
                @keyframes levTravel-${uid} {
                  0% { opacity: 0.7; }
                  25% { opacity: 0.1; }
                  50% { opacity: 0.7; }
                  75% { opacity: 0.1; }
                  100% { opacity: 0.7; }
                }
                @keyframes levBubble-${uid} {
                  0% { transform: translateY(0); opacity: 0.3; }
                  100% { transform: translateY(-12px); opacity: 0; }
                }
                @keyframes levSway-${uid} {
                  0%, 100% { transform: rotate(0deg); }
                  50% { transform: rotate(3deg); }
                }
              `}</style>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#003333" />
                <stop offset="40%" stopColor="#004d40" />
                <stop offset="100%" stopColor="#006064" />
              </linearGradient>
              <radialGradient id={`${uid}-bio`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id={`${uid}-aura`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.15" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id={`${uid}-soft`}>
                <feGaussianBlur stdDeviation="1.5" />
              </filter>
            </defs>
            {/* Deep water aura */}
            <circle cx="24" cy="22" r="20" fill={`url(#${uid}-aura)`} />
            {/* Main trunk — sinuous tentacle */}
            <path d="M22 46 Q20 42 22 38 Q26 34 22 30 Q18 26 22 22 Q24 20 24 18" stroke={`url(#${uid}-trunk)`} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M26 46 Q28 42 26 38 Q22 34 26 30" stroke="#003333" strokeWidth="1.5" fill="none" opacity="0.3" />
            {/* Tentacle branches — swaying */}
            <g style={{transformOrigin: '22px 30px', animation: `levSway-${uid} 4s ease-in-out infinite`} as React.CSSProperties}>
              <path d="M22 30 Q14 26 8 24 Q4 23 2 26 Q4 28 6 26" stroke="#006064" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M8 24 Q6 20 4 18 Q2 17 2 19" stroke="#006064" strokeWidth="1" fill="none" strokeLinecap="round" />
            </g>
            <g style={{transformOrigin: '20px 26px', animation: `levSway-${uid} 5s ease-in-out infinite 0.5s`} as React.CSSProperties}>
              <path d="M20 26 Q30 22 36 18 Q40 16 42 18 Q40 20 38 18" stroke="#006064" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M36 18 Q38 14 40 12" stroke="#006064" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            </g>
            <g style={{transformOrigin: '22px 22px', animation: `levSway-${uid} 4.5s ease-in-out infinite 1s`} as React.CSSProperties}>
              <path d="M22 22 Q14 16 8 14 Q4 13 2 15" stroke="#006064" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </g>
            <g style={{transformOrigin: '24px 20px', animation: `levSway-${uid} 3.5s ease-in-out infinite 1.5s`} as React.CSSProperties}>
              <path d="M24 20 Q30 14 36 12 Q40 10 42 12" stroke="#006064" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </g>
            <path d="M21 24 Q16 20 12 20 Q10 20 8 22" stroke="#006064" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M24 18 Q28 16 32 16 Q34 17 36 16" stroke="#006064" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* Bioluminescent spots along body — sequential pulse */}
            <g filter={`url(#${uid}-glow)`}>
              {/* Trunk spots */}
              <circle cx="23" cy="38" r="0.6" fill="#00e5ff" style={{animation: `levTravel-${uid} 3s ease-in-out infinite 0s`} as React.CSSProperties} />
              <circle cx="25" cy="34" r="0.7" fill="#00e5ff" style={{animation: `levTravel-${uid} 3s ease-in-out infinite 0.3s`} as React.CSSProperties} />
              <circle cx="21" cy="30" r="0.8" fill="#18ffff" style={{animation: `levTravel-${uid} 3s ease-in-out infinite 0.6s`} as React.CSSProperties} />
              <circle cx="23" cy="26" r="0.7" fill="#00e5ff" style={{animation: `levTravel-${uid} 3s ease-in-out infinite 0.9s`} as React.CSSProperties} />
              <circle cx="23" cy="22" r="0.8" fill="#18ffff" style={{animation: `levTravel-${uid} 3s ease-in-out infinite 1.2s`} as React.CSSProperties} />
              <circle cx="24" cy="18" r="0.9" fill="#00e5ff" style={{animation: `levTravel-${uid} 3s ease-in-out infinite 1.5s`} as React.CSSProperties} />
              {/* Branch tip glows */}
              <circle cx="2" cy="26" r="0.7" fill="#18ffff" style={{animation: `levPulse-${uid} 2s ease-in-out infinite`} as React.CSSProperties} />
              <circle cx="4" cy="18" r="0.5" fill="#00e5ff" style={{animation: `levPulse-${uid} 2.3s ease-in-out infinite 0.3s`} as React.CSSProperties} />
              <circle cx="44" cy="18" r="0.7" fill="#18ffff" style={{animation: `levPulse-${uid} 2.5s ease-in-out infinite 0.5s`} as React.CSSProperties} />
              <circle cx="42" cy="12" r="0.5" fill="#00e5ff" style={{animation: `levPulse-${uid} 2.2s ease-in-out infinite 0.8s`} as React.CSSProperties} />
              <circle cx="2" cy="15" r="0.6" fill="#18ffff" style={{animation: `levPulse-${uid} 2.4s ease-in-out infinite 1s`} as React.CSSProperties} />
              <circle cx="42" cy="12" r="0.55" fill="#00e5ff" style={{animation: `levPulse-${uid} 2.1s ease-in-out infinite 1.3s`} as React.CSSProperties} />
              <circle cx="8" cy="22" r="0.5" fill="#18ffff" style={{animation: `levPulse-${uid} 2.6s ease-in-out infinite 0.2s`} as React.CSSProperties} />
              <circle cx="36" cy="16" r="0.5" fill="#00e5ff" style={{animation: `levPulse-${uid} 2.8s ease-in-out infinite 0.7s`} as React.CSSProperties} />
              {/* Mid-branch spots */}
              <circle cx="14" cy="24" r="0.5" fill="#00e5ff" style={{animation: `levPulse-${uid} 2s ease-in-out infinite 0.4s`} as React.CSSProperties} />
              <circle cx="32" cy="20" r="0.5" fill="#18ffff" style={{animation: `levPulse-${uid} 2.3s ease-in-out infinite 0.6s`} as React.CSSProperties} />
            </g>
            {/* Bubbles rising */}
            <circle cx="18" cy="16" r="0.8" fill="none" stroke="#00e5ff" strokeWidth="0.3" style={{animation: `levBubble-${uid} 3s linear infinite`} as React.CSSProperties} />
            <circle cx="30" cy="20" r="0.6" fill="none" stroke="#18ffff" strokeWidth="0.25" style={{animation: `levBubble-${uid} 3.5s linear infinite 0.8s`} as React.CSSProperties} />
            <circle cx="14" cy="18" r="0.5" fill="none" stroke="#00e5ff" strokeWidth="0.2" style={{animation: `levBubble-${uid} 4s linear infinite 1.5s`} as React.CSSProperties} />
            <circle cx="34" cy="14" r="0.7" fill="none" stroke="#18ffff" strokeWidth="0.25" style={{animation: `levBubble-${uid} 3.2s linear infinite 2s`} as React.CSSProperties} />
            <circle cx="22" cy="12" r="0.4" fill="none" stroke="#00e5ff" strokeWidth="0.2" style={{animation: `levBubble-${uid} 4.5s linear infinite 0.5s`} as React.CSSProperties} />
          </g>
        )

      case 'prismatic':
        if (s === 0) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-prism`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff1744" />
                <stop offset="33%" stopColor="#ffea00" />
                <stop offset="66%" stopColor="#00e676" />
                <stop offset="100%" stopColor="#2979ff" />
              </linearGradient>
            </defs>
            <path d="M24 46 Q23.5 42 24 38" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="35" r="3" fill="none" stroke={`url(#${uid}-prism)`} strokeWidth="0.8" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="24" cy="35" r="1.5" fill="#ffffff" opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-prism`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff1744" />
                <stop offset="20%" stopColor="#ff9100" />
                <stop offset="40%" stopColor="#ffea00" />
                <stop offset="60%" stopColor="#00e676" />
                <stop offset="80%" stopColor="#2979ff" />
                <stop offset="100%" stopColor="#d500f9" />
              </linearGradient>
              <filter id={`${uid}-glow`}>
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 46 Q23 40 24 34" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q20 32 18 30" stroke="#bdbdbd" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="28" r="7" fill="none" stroke={`url(#${uid}-prism)`} strokeWidth="1.5" opacity="0.5" />
              <circle cx="24" cy="28" r="4" fill="none" stroke={`url(#${uid}-prism)`} strokeWidth="1" opacity="0.7" />
              <circle cx="24" cy="28" r="2" fill="#ffffff" opacity="0.3" />
            </g>
            <circle cx="20" cy="26" r="0.4" fill="#ff1744" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="28" cy="28" r="0.35" fill="#2979ff" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite" begin="0.5s" />
            </circle>
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-prism`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff1744" />
                <stop offset="16%" stopColor="#ff9100" />
                <stop offset="33%" stopColor="#ffea00" />
                <stop offset="50%" stopColor="#00e676" />
                <stop offset="66%" stopColor="#2979ff" />
                <stop offset="83%" stopColor="#651fff" />
                <stop offset="100%" stopColor="#d500f9" />
              </linearGradient>
              <radialGradient id={`${uid}-white`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 46 Q23 40 24 32" stroke="#e0e0e0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q18 28 14 26" stroke="#bdbdbd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 30 Q30 24 34 22" stroke="#bdbdbd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="22" r="12" fill={`url(#${uid}-white)`} />
              {/* Rainbow bands */}
              <ellipse cx="24" cy="24" rx="10" ry="3" fill="none" stroke="#ff1744" strokeWidth="1.2" opacity="0.5" />
              <ellipse cx="24" cy="22" rx="10" ry="3" fill="none" stroke="#ff9100" strokeWidth="1.2" opacity="0.5" />
              <ellipse cx="24" cy="20" rx="10" ry="3" fill="none" stroke="#ffea00" strokeWidth="1.2" opacity="0.5" />
              <ellipse cx="24" cy="18" rx="10" ry="3" fill="none" stroke="#00e676" strokeWidth="1.2" opacity="0.5" />
              <ellipse cx="24" cy="16" rx="9" ry="3" fill="none" stroke="#2979ff" strokeWidth="1.2" opacity="0.5" />
              <ellipse cx="24" cy="14" rx="8" ry="3" fill="none" stroke="#d500f9" strokeWidth="1.2" opacity="0.5" />
            </g>
            {/* Sparkles */}
            <circle cx="16" cy="20" r="0.4" fill="#ff1744" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="32" cy="18" r="0.35" fill="#00e676" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite" begin="0.3s" />
            </circle>
            <circle cx="24" cy="12" r="0.4" fill="#2979ff" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" begin="0.6s" />
            </circle>
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes prismShift-${uid} {
                  0% { stop-color: #ff1744; }
                  16% { stop-color: #ff9100; }
                  33% { stop-color: #ffea00; }
                  50% { stop-color: #00e676; }
                  66% { stop-color: #2979ff; }
                  83% { stop-color: #d500f9; }
                  100% { stop-color: #ff1744; }
                }
                @keyframes prismShiftB-${uid} {
                  0% { stop-color: #00e676; }
                  16% { stop-color: #2979ff; }
                  33% { stop-color: #d500f9; }
                  50% { stop-color: #ff1744; }
                  66% { stop-color: #ff9100; }
                  83% { stop-color: #ffea00; }
                  100% { stop-color: #00e676; }
                }
                @keyframes prismRay-${uid} {
                  0%, 100% { opacity: 0.15; }
                  50% { opacity: 0.4; }
                }
                @keyframes prismSparkle-${uid} {
                  0%, 100% { opacity: 0.7; transform: scale(1); }
                  50% { opacity: 0.1; transform: scale(0.5); }
                }
                @keyframes prismShimmer-${uid} {
                  0% { opacity: 0.1; }
                  25% { opacity: 0.3; }
                  50% { opacity: 0.1; }
                  75% { opacity: 0.25; }
                  100% { opacity: 0.1; }
                }
              `}</style>
              <linearGradient id={`${uid}-prism`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff1744">
                  <animate attributeName="stop-color" values="#ff1744;#ff9100;#ffea00;#00e676;#2979ff;#d500f9;#ff1744" dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="33%" stopColor="#ffea00">
                  <animate attributeName="stop-color" values="#ffea00;#00e676;#2979ff;#d500f9;#ff1744;#ff9100;#ffea00" dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="66%" stopColor="#2979ff">
                  <animate attributeName="stop-color" values="#2979ff;#d500f9;#ff1744;#ff9100;#ffea00;#00e676;#2979ff" dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#d500f9">
                  <animate attributeName="stop-color" values="#d500f9;#ff1744;#ff9100;#ffea00;#00e676;#2979ff;#d500f9" dur="6s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              <linearGradient id={`${uid}-prism2`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff1744">
                  <animate attributeName="stop-color" values="#d500f9;#ff1744;#ff9100;#ffea00;#00e676;#2979ff;#d500f9" dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#00e676">
                  <animate attributeName="stop-color" values="#00e676;#2979ff;#d500f9;#ff1744;#ff9100;#ffea00;#00e676" dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#2979ff">
                  <animate attributeName="stop-color" values="#ff9100;#ffea00;#00e676;#2979ff;#d500f9;#ff1744;#ff9100" dur="8s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              <radialGradient id={`${uid}-white`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id={`${uid}-aurora`} cx="50%" cy="40%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id={`${uid}-soft`}>
                <feGaussianBlur stdDeviation="2" />
              </filter>
            </defs>
            {/* Trunk — white refracting */}
            <path d="M22 46 C21 42 25 38 23 34 C21 30 25 28 24 22" stroke="#e0e0e0" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M26 46 C27 42 23 38 25 34 C27 30 23 28 24 22" stroke={`url(#${uid}-prism)`} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            {/* Branches */}
            <path d="M24 32 C18 28 12 26 8 22" stroke="#bdbdbd" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 28 C30 24 36 22 40 18" stroke="#bdbdbd" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 26 C20 20 14 16 12 12" stroke="#bdbdbd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 30 C28 26 34 28 38 24" stroke="#bdbdbd" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            {/* Aurora canopy background */}
            <circle cx="24" cy="18" r="18" fill={`url(#${uid}-aurora)`} style={{animation: `prismShimmer-${uid} 3s ease-in-out infinite`} as React.CSSProperties} />
            {/* Prismatic canopy with glow */}
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="18" r="16" fill={`url(#${uid}-white)`} />
              {/* Rainbow layered bands */}
              <ellipse cx="24" cy="26" rx="14" ry="3" fill="none" stroke="#ff1744" strokeWidth="1.5" opacity="0.45" style={{animation: `prismShimmer-${uid} 4s ease-in-out infinite`} as React.CSSProperties} />
              <ellipse cx="24" cy="23" rx="14" ry="3.5" fill="none" stroke="#ff9100" strokeWidth="1.5" opacity="0.45" style={{animation: `prismShimmer-${uid} 4.5s ease-in-out infinite 0.3s`} as React.CSSProperties} />
              <ellipse cx="24" cy="20" rx="13" ry="3.5" fill="none" stroke="#ffea00" strokeWidth="1.5" opacity="0.45" style={{animation: `prismShimmer-${uid} 5s ease-in-out infinite 0.6s`} as React.CSSProperties} />
              <ellipse cx="24" cy="17" rx="12" ry="3.5" fill="none" stroke="#00e676" strokeWidth="1.5" opacity="0.45" style={{animation: `prismShimmer-${uid} 4.2s ease-in-out infinite 0.9s`} as React.CSSProperties} />
              <ellipse cx="24" cy="14" rx="11" ry="3" fill="none" stroke="#2979ff" strokeWidth="1.5" opacity="0.45" style={{animation: `prismShimmer-${uid} 4.8s ease-in-out infinite 1.2s`} as React.CSSProperties} />
              <ellipse cx="24" cy="11" rx="10" ry="3" fill="none" stroke="#651fff" strokeWidth="1.5" opacity="0.45" style={{animation: `prismShimmer-${uid} 5.5s ease-in-out infinite 1.5s`} as React.CSSProperties} />
              <ellipse cx="24" cy="8" rx="8" ry="2.5" fill="none" stroke="#d500f9" strokeWidth="1.5" opacity="0.4" style={{animation: `prismShimmer-${uid} 4s ease-in-out infinite 1.8s`} as React.CSSProperties} />
            </g>
            {/* Light rays emanating outward */}
            <line x1="24" y1="18" x2="4" y2="10" stroke={`url(#${uid}-prism2)`} strokeWidth="0.6" opacity="0.2" style={{animation: `prismRay-${uid} 3s ease-in-out infinite`} as React.CSSProperties} />
            <line x1="24" y1="18" x2="44" y2="10" stroke={`url(#${uid}-prism2)`} strokeWidth="0.6" opacity="0.2" style={{animation: `prismRay-${uid} 3.5s ease-in-out infinite 0.5s`} as React.CSSProperties} />
            <line x1="24" y1="18" x2="2" y2="20" stroke={`url(#${uid}-prism2)`} strokeWidth="0.5" opacity="0.15" style={{animation: `prismRay-${uid} 4s ease-in-out infinite 1s`} as React.CSSProperties} />
            <line x1="24" y1="18" x2="46" y2="20" stroke={`url(#${uid}-prism2)`} strokeWidth="0.5" opacity="0.15" style={{animation: `prismRay-${uid} 4.5s ease-in-out infinite 1.5s`} as React.CSSProperties} />
            <line x1="24" y1="18" x2="8" y2="4" stroke={`url(#${uid}-prism2)`} strokeWidth="0.4" opacity="0.12" style={{animation: `prismRay-${uid} 5s ease-in-out infinite 2s`} as React.CSSProperties} />
            <line x1="24" y1="18" x2="40" y2="4" stroke={`url(#${uid}-prism2)`} strokeWidth="0.4" opacity="0.12" style={{animation: `prismRay-${uid} 3.8s ease-in-out infinite 0.8s`} as React.CSSProperties} />
            {/* Colored sparkles */}
            <circle cx="12" cy="14" r="0.5" fill="#ff1744" style={{animation: `prismSparkle-${uid} 2s ease-in-out infinite`} as React.CSSProperties} />
            <circle cx="36" cy="16" r="0.45" fill="#ff9100" style={{animation: `prismSparkle-${uid} 2.3s ease-in-out infinite 0.3s`} as React.CSSProperties} />
            <circle cx="16" cy="10" r="0.4" fill="#ffea00" style={{animation: `prismSparkle-${uid} 1.8s ease-in-out infinite 0.6s`} as React.CSSProperties} />
            <circle cx="32" cy="12" r="0.5" fill="#00e676" style={{animation: `prismSparkle-${uid} 2.5s ease-in-out infinite 0.9s`} as React.CSSProperties} />
            <circle cx="18" cy="22" r="0.4" fill="#2979ff" style={{animation: `prismSparkle-${uid} 2.1s ease-in-out infinite 1.2s`} as React.CSSProperties} />
            <circle cx="30" cy="24" r="0.45" fill="#d500f9" style={{animation: `prismSparkle-${uid} 2.4s ease-in-out infinite 1.5s`} as React.CSSProperties} />
            <circle cx="10" cy="20" r="0.35" fill="#651fff" style={{animation: `prismSparkle-${uid} 1.9s ease-in-out infinite 1.8s`} as React.CSSProperties} />
            <circle cx="38" cy="22" r="0.4" fill="#ff1744" style={{animation: `prismSparkle-${uid} 2.2s ease-in-out infinite 2.1s`} as React.CSSProperties} />
            <circle cx="24" cy="6" r="0.5" fill="#ffffff" style={{animation: `prismSparkle-${uid} 2s ease-in-out infinite 0.5s`} as React.CSSProperties} />
            {/* Holographic shimmer overlay */}
            <ellipse cx="24" cy="18" rx="14" ry="12" fill="none" stroke={`url(#${uid}-prism)`} strokeWidth="0.5" opacity="0.2">
              <animate attributeName="rx" values="14;16;14" dur="4s" repeatCount="indefinite" />
              <animate attributeName="ry" values="12;10;12" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="24" cy="18" rx="12" ry="10" fill="none" stroke={`url(#${uid}-prism2)`} strokeWidth="0.4" opacity="0.15">
              <animate attributeName="rx" values="12;14;12" dur="5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="ry" values="10;8;10" dur="5s" repeatCount="indefinite" begin="1s" />
            </ellipse>
          </g>
        )

      // ── SPRING COMMON ──

      case 'sunflower':
        if (s === 0) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="41" stroke="#4caf50" strokeWidth="1.5" />
            <path d="M24 42 Q22 40 20 41 Q22 38 24 40" fill="#66bb6a" opacity="0.8" />
            <path d="M24 42 Q26 40 28 41 Q26 38 24 40" fill="#66bb6a" opacity="0.75" />
          </g>
        )
        if (s === 1) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="35" stroke="#4caf50" strokeWidth="2" />
            {/* Leaves on stem */}
            <path d="M24 42 Q21 40 18 41 Q21 38 24 41" fill="#43a047" opacity="0.8" />
            <path d="M24 39 Q27 37 30 38 Q27 35 24 38" fill="#43a047" opacity="0.75" />
            {/* Small flower head */}
            <circle cx="24" cy="33" r="2.5" fill="#795548" />
            {[0,45,90,135,180,225,270,315].map((a,i)=><path key={i} d="M24 28 Q25 30 24 33 Q23 30 24 28Z" fill={color} transform={`rotate(${a},24,33)`} />)}
          </g>
        )
        if (s === 2) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="28" stroke="#4caf50" strokeWidth="2.5" />
            <path d="M24 41 Q20 39 16 40 Q20 36 24 40" fill="#43a047" opacity="0.8" />
            <path d="M24 37 Q28 35 32 36 Q28 33 24 36" fill="#43a047" opacity="0.75" />
            <path d="M24 34 Q21 32 18 33 Q21 30 24 33" fill="#43a047" opacity="0.7" />
            {/* Medium flower */}
            <circle cx="24" cy="25" r="3.5" fill="#5d4037" />
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=><path key={i} d="M24 18 Q25.3 21 24 25 Q22.7 21 24 18Z" fill={color} transform={`rotate(${a},24,25)`} />)}
            <circle cx="24" cy="25" r="2.5" fill="#795548" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}sd`}><stop offset="0%" stopColor="#4e342e" /><stop offset="100%" stopColor="#795548" /></radialGradient>
            </defs>
            {/* Thick stalk */}
            <line x1="24" y1="46" x2="24" y2="22" stroke="#4caf50" strokeWidth="3" />
            {/* Leaves */}
            <path d="M24 42 Q19 39 15 41 Q19 37 24 41Z" fill="#43a047" />
            <path d="M24 38 Q29 35 33 37 Q29 33 24 37Z" fill="#43a047" />
            <path d="M24 34 Q20 31 16 33 Q20 29 24 33Z" fill="#388e3c" />
            <path d="M24 30 Q28 27 31 29 Q28 25 24 29Z" fill="#388e3c" />
            {/* Huge flower head */}
            {[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map((a,i)=>(
              <path key={i} d="M24 11 Q25.5 15 24 19 Q22.5 15 24 11Z" fill={i%2===0?color:dark} transform={`rotate(${a},24,19)`} />
            ))}
            <circle cx="24" cy="19" r="4.5" fill={`url(#${uid}sd)`} />
            {/* Seed texture */}
            {[22,24,26,23,25,24].map((x,i)=><circle key={i} cx={x} cy={[17.5,17,17.5,19.5,19.5,21][i]} r="0.5" fill="#3e2723" opacity="0.4" />)}
          </g>
        )

      // ── AUTUMN COMMON ──

      // ── SUMMER UNCOMMON ──

      case 'papaya':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q24 43 24 39" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="40" rx="2.5" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 39 Q21 36 19 37 Q21 34 24 36" fill={color} opacity="0.7" />
            <path d="M24 39 Q27 36 29 37 Q27 34 24 36" fill={color} opacity="0.6" />
            <circle cx="23" cy="35.5" r="0.4" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Single straight thick trunk */}
            <rect x="22.5" y="28" width="3" height="18" rx="1" fill={trunk} />
            <path d="M23 36 L25 35.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 32 L25 31.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* Palmate leaves from top */}
            <path d="M24 28 Q18 22 14 20 Q16 24 20 27" fill={color} opacity="0.7" stroke={dark} strokeWidth="0.3" />
            <path d="M24 28 Q30 22 34 20 Q32 24 28 27" fill={color} opacity="0.65" stroke={dark} strokeWidth="0.3" />
            <path d="M24 28 Q24 20 24 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M24 18 Q22 16 20 18 Q22 17 24 18" fill={color} opacity="0.5" />
            <circle cx="22" cy="22" r="0.5" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Thick single trunk */}
            <rect x="22" y="24" width="4" height="22" rx="1.5" fill={trunk} />
            <path d="M23 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 32 L25.5 31.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 44 L25.5 43.8" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            {/* Trunk scars */}
            <path d="M22.5 36 Q22 35.5 22.5 35" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M25.5 40 Q26 39.5 25.5 39" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Palmate leaves radiating */}
            <path d="M24 24 Q16 16 10 14 Q14 20 20 24" fill={color} opacity="0.75" stroke={dark} strokeWidth="0.3" />
            <path d="M24 24 Q32 16 38 14 Q34 20 28 24" fill={color} opacity="0.7" stroke={dark} strokeWidth="0.3" />
            <path d="M24 24 Q20 14 18 10 Q22 16 24 22" fill={color} opacity="0.65" stroke={dark} strokeWidth="0.3" />
            <path d="M24 24 Q28 14 30 10 Q26 16 24 22" fill={color} opacity="0.6" stroke={dark} strokeWidth="0.3" />
            <path d="M24 24 Q24 14 24 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M24 10 Q22 8 20 10 Q22 9 24 10" fill={color} opacity="0.5" />
            {/* Leaf veins */}
            <line x1="24" y1="24" x2="14" y2="16" stroke={dark} strokeWidth="0.3" opacity="0.15" />
            <line x1="24" y1="24" x2="34" y2="16" stroke={dark} strokeWidth="0.3" opacity="0.12" />
            {/* Papayas under leaves */}
            <ellipse cx="22" cy="26" rx="1.5" ry="2" fill="#ff9800" opacity="0.85" />
            <ellipse cx="26" cy="26" rx="1.4" ry="1.9" fill="#ffa726" opacity="0.8" />
            <ellipse cx="24" cy="27" rx="1.3" ry="1.8" fill="#ff9800" opacity="0.75" />
            <circle cx="21.5" cy="25.5" r="0.4" fill={light} opacity="0.35" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-ptrunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            {/* Thick single trunk with texture */}
            <rect x="21.5" y="21" width="5.5" height="25" rx="2" fill={trunk} />
            <rect x="21.5" y="21" width="5.5" height="25" rx="2" fill={`url(#${uid}-ptrunk)`} />
            <path d="M22.5 38 L26 37.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M22.5 32 L26 31.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M22.5 44 L26 43.8" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            {/* Trunk scars — old leaf attachment */}
            <path d="M22 36 Q21.5 35 22 34" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M26.5 40 Q27 39 26.5 38" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M22 30 Q21.5 29 22 28" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.18" />
            <path d="M26.5 34 Q27 33 26.5 32" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.18" />
            {/* Large palmate leaves radiating from crown */}
            <path d="M24 21 Q15 12 8 10 Q13 17 21 22" fill={color} stroke={dark} strokeWidth="0.4" />
            <path d="M24 21 Q33 12 40 10 Q35 17 27 22" fill={color} stroke={dark} strokeWidth="0.4" />
            <path d="M24 21 Q19 10 16 6 Q21 13 24 21" fill={color} opacity="0.8" stroke={dark} strokeWidth="0.3" />
            <path d="M24 21 Q29 10 32 6 Q27 13 24 21" fill={color} opacity="0.75" stroke={dark} strokeWidth="0.3" />
            <path d="M24 21 Q24 10 24 6" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 8 Q22 6 20 8 Q22 7 24 8" fill={color} opacity="0.6" />
            <path d="M24 21 Q12 16 6 16 Q12 19 21 22" fill={color} opacity="0.7" stroke={dark} strokeWidth="0.3" />
            <path d="M24 21 Q36 16 42 16 Q36 19 27 22" fill={color} opacity="0.65" stroke={dark} strokeWidth="0.3" />
            {/* Leaf veins */}
            <line x1="24" y1="21" x2="12" y2="12" stroke={dark} strokeWidth="0.35" opacity="0.15" />
            <line x1="24" y1="21" x2="36" y2="12" stroke={dark} strokeWidth="0.35" opacity="0.12" />
            <line x1="24" y1="21" x2="19" y2="8" stroke={dark} strokeWidth="0.3" opacity="0.12" />
            <line x1="24" y1="21" x2="29" y2="8" stroke={dark} strokeWidth="0.3" opacity="0.1" />
            <line x1="24" y1="21" x2="10" y2="16" stroke={dark} strokeWidth="0.3" opacity="0.1" />
            <line x1="24" y1="21" x2="38" y2="16" stroke={dark} strokeWidth="0.3" opacity="0.1" />
            {/* Leaf highlights */}
            <circle cx="15" cy="12" r="0.6" fill={light} opacity="0.3" />
            <circle cx="33" cy="12" r="0.55" fill={light} opacity="0.25" />
            <circle cx="20" cy="10" r="0.5" fill={light} opacity="0.25" />
            <circle cx="10" cy="14" r="0.45" fill={light} opacity="0.2" />
            {/* Cluster of papayas under leaves */}
            <ellipse cx="21.5" cy="24" rx="1.9" ry="2.6" fill="#ff9800" />
            <ellipse cx="26.5" cy="24" rx="1.7" ry="2.4" fill="#ffa726" />
            <ellipse cx="24" cy="25" rx="1.8" ry="2.5" fill="#ff9800" opacity="0.9" />
            <ellipse cx="22.5" cy="27" rx="1.5" ry="2" fill="#ffa726" opacity="0.8" />
            <ellipse cx="25.5" cy="27" rx="1.4" ry="1.9" fill="#ff9800" opacity="0.75" />
            {/* Papaya highlights */}
            <circle cx="20.8" cy="23" r="0.5" fill={light} opacity="0.4" />
            <circle cx="25.8" cy="23" r="0.45" fill={light} opacity="0.35" />
            <circle cx="23.3" cy="24" r="0.4" fill={light} opacity="0.3" />
            {/* Roots */}
            <path d="M21.5 46 Q19.5 44.5 17.5 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M27 46 Q29 44.5 31 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      // ── AUTUMN UNCOMMON ──

      case 'grape':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 43 24 40" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 40 Q22 38 21 36" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M21 36 Q18 34 17 35 Q18 32 21 35" fill="#4caf50" opacity="0.7" />
            <path d="M21 36 Q23 33 25 35 Q24 32 21 35" fill="#4caf50" opacity="0.7" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23 42 23 36" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 36 Q20 32 18 30" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 34 Q26 30 29 28" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M16 26 Q14 22 17 21 Q20 21 21 24 Q20 27 17 28 Q15 28 16 26 Z" fill="#4caf50" opacity="0.7" />
            <path d="M28 24 Q27 21 29 20 Q32 20 33 23 Q32 26 29 26 Q27 26 28 24 Z" fill="#4caf50" opacity="0.7" />
            <path d="M17 22 L18.5 25.5" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M30 21 L30.5 24" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            <path d="M19 30 Q17 29 16 30 Q15.5 31 16.5 31.5" stroke={trunk} strokeWidth="0.5" fill="none" opacity="0.4" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 Q22 40 23 34" stroke={trunk} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M25 46 Q26 42 24 36" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M23 34 Q18 28 15 24" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q28 28 32 26" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 38 Q20 36 18 34" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M13 20 Q11 16 14 15 Q17 15 18 18 Q17 21 14 22 Q12 22 13 20 Z" fill="#4caf50" opacity="0.7" />
            <path d="M30 22 Q29 18 31 17 Q34 17 35 20 Q34 23 31 24 Q29 24 30 22 Z" fill="#4caf50" opacity="0.7" />
            <path d="M20 26 Q18 24 20 22 Q22 23 21 26 Z" fill="#4caf50" opacity="0.7" />
            {/* Cluster 1 — stem connects branch to grapes */}
            <path d="M16 25 L16 26" stroke="#5a4a32" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <circle cx="16" cy="26.5" r="1.4" fill={color} />
            <circle cx="18" cy="27.5" r="1.4" fill={color} />
            <circle cx="17" cy="29" r="1.4" fill={color} />
            <circle cx="15.5" cy="28.5" r="1.2" fill={dark} opacity="0.6" />
            <circle cx="16.5" cy="27" r="0.5" fill={light} opacity="0.3" />
            {/* Cluster 2 — stem from branch */}
            <path d="M32 27 L32 28" stroke="#5a4a32" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <circle cx="31" cy="28.5" r="1.3" fill={color} />
            <circle cx="33" cy="29.5" r="1.3" fill={color} />
            <circle cx="32" cy="30.7" r="1.3" fill={color} />
            <circle cx="31.5" cy="29" r="0.5" fill={light} opacity="0.25" />
            <path d="M15 24 Q13 23 12 24 Q11.5 25 12.5 25.5" stroke="#7a6b4e" strokeWidth="0.5" fill="none" opacity="0.4" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-grape`} cx="35%" cy="30%">
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={color} />
              </radialGradient>
            </defs>
            {/* Twisted vine trunk */}
            <path d="M23 46 Q21 40 22 34" stroke={trunk} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M25 46 Q27 42 25 36" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M22.5 38 L25 37.5" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23 42 L25 41.5" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* Main branches */}
            <path d="M22 34 Q16 28 12 22" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q30 26 36 24" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 36 Q18 34 14 32" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            {/* Leaves growing from branches */}
            <path d="M13 24 Q11 20 14 18 Q17 18 18 21 Q17 24 14 26 Q11 26 13 24 Z" fill="#4caf50" opacity="0.7" />
            <path d="M34 25 Q32 21 34 19 Q37 19 39 22 Q38 25 35 27 Q33 27 34 25 Z" fill="#4caf50" opacity="0.65" />
            <path d="M18 28 Q16 26 18 24 Q20 25 19 28 Z" fill="#4caf50" opacity="0.5" />
            <path d="M30 26 Q32 24 31 22 Q29 23 30 26 Z" fill="#4caf50" opacity="0.45" />
            <path d="M22 32 Q20 30 22 28 Q24 29 23 32 Z" fill="#4caf50" opacity="0.4" />
            <path d="M14 19 L16 23" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M35 20 L37 24" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* Cluster 1 — stem hangs from left branch */}
            <path d="M14 23 Q14 24 14.5 24.5" stroke="#5a4a32" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <circle cx="14" cy="25" r="1.5" fill={`url(#${uid}-grape)`} />
            <circle cx="16" cy="26" r="1.5" fill={`url(#${uid}-grape)`} />
            <circle cx="12.5" cy="26.5" r="1.5" fill={`url(#${uid}-grape)`} />
            <circle cx="15" cy="27.5" r="1.5" fill={color} />
            <circle cx="13" cy="28" r="1.3" fill={dark} opacity="0.5" />
            <circle cx="14.5" cy="25.5" r="0.5" fill={light} opacity="0.35" />
            {/* Cluster 2 — stem from right branch */}
            <path d="M34 25 Q34 26 33.5 26.5" stroke="#5a4a32" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <circle cx="33" cy="27" r="1.4" fill={`url(#${uid}-grape)`} />
            <circle cx="35" cy="28" r="1.4" fill={`url(#${uid}-grape)`} />
            <circle cx="34" cy="29.2" r="1.4" fill={color} />
            <circle cx="32.5" cy="29" r="1.2" fill={dark} opacity="0.5" />
            <circle cx="33.5" cy="27.5" r="0.5" fill={light} opacity="0.3" />
            {/* Cluster 3 — stem from lower left branch */}
            <path d="M16 32 Q17 32 18 32.5" stroke="#5a4a32" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <circle cx="19" cy="33" r="1.3" fill={`url(#${uid}-grape)`} />
            <circle cx="21" cy="34" r="1.3" fill={color} />
            <circle cx="20" cy="35" r="1.3" fill={color} />
            <circle cx="19.5" cy="33.5" r="0.4" fill={light} opacity="0.3" />
            {/* Cluster 4 — small, from right side */}
            <path d="M30 27 Q29 28 28.5 28.5" stroke="#5a4a32" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <circle cx="28" cy="29" r="1.2" fill={color} />
            <circle cx="29.5" cy="30" r="1.2" fill={color} />
            <circle cx="28.8" cy="29.5" r="0.4" fill={light} opacity="0.25" />
            {/* Tendrils curling from branches */}
            <path d="M12 22 Q10 21 9 22 Q8.5 23 9.5 23.5" stroke="#7a6b4e" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M36 24 Q38 23 39 24 Q39 25 38 25" stroke="#7a6b4e" strokeWidth="0.5" fill="none" opacity="0.35" />
            {/* Roots */}
            <path d="M22 46 Q19 45 17 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q29 45 31 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'pear':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="40" rx="3" ry="2" fill="#8B7355" opacity="0.4" />
            <path d="M24 38 Q23 36 24 33" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 33 Q20 30 18 32 Q20 28 24 32" fill="#4caf50" opacity="0.7" />
            <path d="M24 33 Q28 30 30 32 Q28 28 24 32" fill="#4caf50" opacity="0.7" />
            <circle cx="22" cy="30" r="0.4" fill="#81c784" opacity="0.25" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23.5 40 24 28" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23.5 38 L25 37.5" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M23.5 34 L25 33.5" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M24 34 Q18 30 14 28" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q28 28 32 26" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Upright pyramidal canopy */}
            <path d="M24 12 Q16 16 14 22 Q12 26 14 28 Q18 30 24 30 Q30 30 34 28 Q36 26 34 22 Q32 16 24 12 Z" fill="#4caf50" opacity="0.7" />
            <path d="M24 14 Q20 17 18 22" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M18 16 Q17 18 20 20 Q22 18 18 16 Z" fill="#66bb6a" opacity="0.2" />
            <path d="M27 22 Q26 24 28 26 Q30 24 27 22 Z" fill="#388e3c" opacity="0.12" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M22 46 Q21 40 21 34 L27 34 Q27 40 26 46 Z" fill={trunk} />
            <path d="M23 38 L25 37.5" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 42 L25.5 41.5" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M22 36 Q16 32 12 30" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 36 Q32 32 36 30" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Upright pyramidal canopy */}
            <path d="M24 8 Q14 14 11 22 Q10 26 12 28 Q16 32 24 32 Q32 32 36 28 Q38 26 37 22 Q34 14 24 8 Z" fill="#4caf50" opacity="0.75" />
            <path d="M17 14 Q16 16 19 18 Q21 16 17 14 Z" fill="#66bb6a" opacity="0.2" />
            <path d="M29 22 Q28 24 30 26 Q32 24 29 22 Z" fill="#388e3c" opacity="0.12" />
            <path d="M16 28 Q20 26 24 28 Q28 26 32 28" fill="#388e3c" opacity="0.1" />
            {/* Pear fruits — teardrop shapes */}
            <path d="M16 26 Q15 24 16 22.5 Q17 24 16 26 Z" fill={color} />
            <ellipse cx="16" cy="25" rx="1.5" ry="2" fill={color} />
            <circle cx="15.5" cy="24" r="0.4" fill={light} opacity="0.35" />
            <path d="M32 24 Q31 22 32 20.5 Q33 22 32 24 Z" fill={color} />
            <ellipse cx="32" cy="23" rx="1.4" ry="1.8" fill={color} />
            <circle cx="31.5" cy="22" r="0.4" fill={light} opacity="0.3" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
                <stop offset="40%" stopColor="#fff" stopOpacity="0" />
                <stop offset="75%" stopColor="#fff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <path d="M21 46 Q20 38 20 32 L28 32 Q28 38 27 46 Z" fill={trunk} />
            <path d="M21 46 Q20 38 20 32 L28 32 Q28 38 27 46 Z" fill={`url(#${uid}-trunk)`} />
            <path d="M23.5 46 Q23 38 23 32 L25 32 L25 46 Z" fill={dark} opacity="0.12" />
            <path d="M22 38 L26 37.5" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M22.5 42 L26 41.5" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* Branches */}
            <path d="M21 34 Q14 30 10 28" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M27 32 Q34 28 38 26" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 34 Q18 32 14 31" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />
            {/* Upright pyramidal canopy */}
            <path d="M24 6 Q12 12 8 22 Q7 26 10 29 Q14 33 24 34 Q34 33 38 29 Q41 26 40 22 Q36 12 24 6 Z" fill="#4caf50" opacity="0.75" />
            <ellipse cx="18" cy="14" rx="6" ry="4.5" fill="#66bb6a" opacity="0.2" />
            <ellipse cx="32" cy="24" rx="4.5" ry="3.5" fill="#388e3c" opacity="0.12" />
            <ellipse cx="24" cy="30" rx="10" ry="3" fill="#388e3c" opacity="0.1" />
            {/* Leaf veins */}
            <path d="M16 16 Q14 14 16 12" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d="M30 14 Q32 12 30 10" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.18" />
            {/* Pear fruit 1 — large teardrop */}
            <path d="M14 26 Q13 23.5 14 21 Q15 23.5 14 26 Z" fill={color} />
            <ellipse cx="14" cy="24.5" rx="2" ry="2.5" fill={color} />
            <circle cx="13.2" cy="23.5" r="0.5" fill={light} opacity="0.35" />
            <path d="M14 21 L14 20" stroke={trunk} strokeWidth="0.5" fill="none" opacity="0.4" />
            {/* Pear fruit 2 */}
            <path d="M34 24 Q33 21.5 34 19 Q35 21.5 34 24 Z" fill={color} />
            <ellipse cx="34" cy="22.5" rx="1.8" ry="2.3" fill={color} />
            <circle cx="33.3" cy="21.5" r="0.5" fill={light} opacity="0.3" />
            <path d="M34 19 L34 18" stroke={trunk} strokeWidth="0.5" fill="none" opacity="0.35" />
            {/* Pear fruit 3 */}
            <path d="M22 30 Q21 28 22 26 Q23 28 22 30 Z" fill={color} opacity="0.9" />
            <ellipse cx="22" cy="28.5" rx="1.6" ry="2" fill={color} opacity="0.9" />
            <circle cx="21.5" cy="27.8" r="0.4" fill={light} opacity="0.25" />
            {/* Pear fruit 4 */}
            <path d="M30 28 Q29 26 30 24 Q31 26 30 28 Z" fill={color} opacity="0.85" />
            <ellipse cx="30" cy="26.5" rx="1.5" ry="1.8" fill={color} opacity="0.85" />
            <circle cx="29.5" cy="25.8" r="0.35" fill={light} opacity="0.25" />
            {/* Roots */}
            <path d="M20 46 Q17 45 14 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M28 46 Q31 45 34 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'melon':
        if (s === 0) return (
          <g>
            <ellipse cx="24" cy="44" rx="3" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 46 Q24 44 24 42" stroke="#5d8a3c" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M24 42 Q22 40 20 40.5 Q21 38 24 41" fill="#4caf50" opacity="0.7" />
            <path d="M24 42 Q26 40 28 40.5 Q27 38 24 41" fill="#4caf50" opacity="0.7" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q18 45 12 46" stroke="#5d8a3c" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q30 45 36 46" stroke="#5d8a3c" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M20 46 Q20 44 18 43" stroke="#5d8a3c" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M14 42 Q12 38 14 36 Q17 36 18 39 Q17 42 14 43 Z" fill="#4caf50" opacity="0.7" />
            <path d="M34 42 Q32 39 34 37 Q36 37 37 40 Q36 43 34 43 Z" fill="#4caf50" opacity="0.6" />
            <path d="M22 42 Q20 40 22 39 Q24 40 23 42 Z" fill="#4caf50" opacity="0.5" />
            <path d="M28 42 Q30 40 28 39 Q26 40 27 42 Z" fill="#4caf50" opacity="0.45" />
            <path d="M14 37 L16 40" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            <ellipse cx="24" cy="42" rx="3.5" ry="3" fill={color} />
            <ellipse cx="24" cy="43.5" rx="3" ry="1.2" fill={dark} opacity="0.12" />
            <ellipse cx="22.5" cy="40.5" rx="1.2" ry="1.8" fill={light} opacity="0.15" />
            <circle cx="24" cy="44" r="1.5" fill="#ffeb3b" opacity="0.4" />
            <circle cx="24" cy="44" r="0.6" fill="#ff8f00" opacity="0.3" />
            <path d="M16 44 Q15 43 14 43.5 Q13.5 44 14 44.5" stroke="#5d8a3c" strokeWidth="0.3" fill="none" opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 Q16 44 8 46" stroke="#5d8a3c" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q32 44 40 46" stroke="#5d8a3c" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M18 45 Q16 43 14 42" stroke="#5d8a3c" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M30 45 Q32 43 34 42" stroke="#5d8a3c" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M10 42 Q8 38 10 35 Q13 35 15 38 Q14 42 11 43 Z" fill="#4caf50" opacity="0.7" />
            <path d="M36 42 Q34 38 36 36 Q39 36 40 39 Q39 42 37 43 Z" fill="#4caf50" opacity="0.65" />
            <path d="M20 42 Q18 40 20 38 Q22 39 21 42 Z" fill="#4caf50" opacity="0.5" />
            <path d="M28 42 Q30 40 28 38 Q26 39 27 42 Z" fill="#4caf50" opacity="0.45" />
            <path d="M10 36 L12.5 39.5" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            <ellipse cx="24" cy="41" rx="6" ry="5" fill={color} />
            <ellipse cx="24" cy="43.5" rx="5" ry="2" fill={dark} opacity="0.12" />
            <ellipse cx="22" cy="39" rx="1.8" ry="2.5" fill={light} opacity="0.12" />
            <circle cx="16" cy="43" r="1.2" fill="#ffeb3b" opacity="0.35" />
            <path d="M12 43 Q11 42 10 42.5 Q9.5 43 10 43.5" stroke="#5d8a3c" strokeWidth="0.3" fill="none" opacity="0.3" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 Q14 43 4 46" stroke="#5d8a3c" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q34 43 44 46" stroke="#5d8a3c" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M16 44 Q12 42 8 42" stroke="#5d8a3c" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M32 44 Q36 42 40 42" stroke="#5d8a3c" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M12 44 Q10 43 8 43" stroke="#5d8a3c" strokeWidth="0.35" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d="M36 44 Q38 43 40 43" stroke="#5d8a3c" strokeWidth="0.35" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M6 42 Q4 38 6 35 Q9 34 11 37 Q10 41 7 43 Z" fill="#4caf50" opacity="0.7" />
            <path d="M40 42 Q38 38 40 36 Q43 36 44 39 Q43 42 41 43 Z" fill="#4caf50" opacity="0.65" />
            <path d="M14 40 Q12 37 14 36 Q16 37 15 40 Z" fill="#4caf50" opacity="0.6" />
            <path d="M34 40 Q36 37 34 36 Q32 37 33 40 Z" fill="#4caf50" opacity="0.55" />
            <path d="M18 42 Q16 40 18 39 Q20 40 19 42 Z" fill="#4caf50" opacity="0.5" />
            <path d="M30 42 Q32 40 30 39 Q28 40 29 42 Z" fill="#4caf50" opacity="0.45" />
            <path d="M6 36 L8.5 39" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            <path d="M41 37 L42 40" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.2" />
            <ellipse cx="24" cy="39" rx="9" ry="7" fill={color} />
            <ellipse cx="24" cy="43" rx="8" ry="3" fill={dark} opacity="0.12" />
            <ellipse cx="21" cy="36" rx="2.5" ry="3.5" fill={light} opacity="0.12" />
            <ellipse cx="27" cy="37" rx="1.5" ry="2.5" fill={light} opacity="0.08" />
            <path d="M24 32 Q24 31 24.5 30" stroke="#5d8a3c" strokeWidth="0.4" fill="none" />
            <path d="M8 43 Q7 42 6 42.5 Q5.5 43 6 43.5" stroke="#5d8a3c" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M40 43 Q41 42 42 42.5 Q42.5 43 42 43.5" stroke="#5d8a3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            <circle cx="10" cy="42" r="1.3" fill="#ffeb3b" opacity="0.35" />
            <circle cx="10" cy="42" r="0.5" fill="#ff8f00" opacity="0.25" />
            <circle cx="38" cy="42" r="1" fill="#ffeb3b" opacity="0.3" />
          </g>
        )
      case 'mushroom': {
        const capW = [5.5, 11, 18, 27][s];
        const capH = [3.5, 5.5, 8, 12][s];
        const stemW = [1.8, 2.8, 3.6, 5.5][s];
        const stemH = [3.5, 6.5, 9, 13][s];
        const cx = 24;
        const capY = 46 - stemH - capH;
        const stemColor = "#f5f0e8";
        const capColor = color; // #d84315
        const capDark = dark;
        const spotColor = "#f5f0e8";

        return (
          <g>
            {/* Stem — thick, white, no bark texture */}
            <rect x={cx - stemW / 2} y={46 - stemH} width={stemW} height={stemH} rx={stemW * 0.3} fill={stemColor} />
            {s >= 2 && (
              <rect x={cx - stemW / 2 + 0.5} y={46 - stemH + 1} width={stemW - 1} height={stemH - 1} rx={stemW * 0.25} fill="#ede8df" />
            )}
            {/* Stem ring/skirt at stage 3 */}
            {s === 3 && (
              <ellipse cx={cx} cy={46 - stemH + 3} rx={stemW * 0.8} ry={1.5} fill="#ede8df" stroke="#d6d0c4" strokeWidth={0.3} />
            )}

            {/* Cap — wide dome/umbrella */}
            <ellipse cx={cx} cy={capY + capH * 0.55} rx={capW / 2} ry={capH * 0.7} fill={capColor} />
            <ellipse cx={cx} cy={capY + capH * 0.45} rx={capW / 2 - 0.5} ry={capH * 0.55} fill={light} opacity={0.3} />
            {/* Cap underside (gills) */}
            {s >= 1 && (
              <path d={`M${cx - capW / 2 + 1} ${capY + capH * 0.75} Q${cx} ${capY + capH * 1.05} ${cx + capW / 2 - 1} ${capY + capH * 0.75}`} fill="none" stroke={capDark} strokeWidth={0.4} opacity={0.4} />
            )}

            {/* White spots on cap */}
            {s >= 2 && <>
              <circle cx={cx - capW * 0.2} cy={capY + capH * 0.3} r={s === 3 ? 1.8 : 1.2} fill={spotColor} opacity={0.85} />
              <circle cx={cx + capW * 0.15} cy={capY + capH * 0.45} r={s === 3 ? 1.4 : 0.9} fill={spotColor} opacity={0.85} />
              <circle cx={cx + capW * 0.3} cy={capY + capH * 0.25} r={s === 3 ? 1.1 : 0.7} fill={spotColor} opacity={0.8} />
            </>}
            {s === 3 && <>
              <circle cx={cx - capW * 0.35} cy={capY + capH * 0.5} r={1.0} fill={spotColor} opacity={0.75} />
              <circle cx={cx} cy={capY + capH * 0.2} r={1.6} fill={spotColor} opacity={0.85} />
              <circle cx={cx - capW * 0.1} cy={capY + capH * 0.55} r={0.8} fill={spotColor} opacity={0.7} />
            </>}

            {/* Falling spores — stage 2+ */}
            {s >= 2 && <>
              <circle cx={cx - capW * 0.25} cy={capY + capH + 3} r={0.4} fill={spotColor} opacity={0.15}>
                <animate attributeName="cy" values={`${capY + capH + 2};${46}`} dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx={cx + capW * 0.2} cy={capY + capH + 5} r={0.3} fill={spotColor} opacity={0.12}>
                <animate attributeName="cy" values={`${capY + capH + 3};${46}`} dur="5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.15;0" dur="5s" repeatCount="indefinite" />
              </circle>
            </>}
            {s === 3 && <>
              <circle cx={cx - capW * 0.35} cy={capY + capH + 4} r={0.35} fill={spotColor} opacity={0.1}>
                <animate attributeName="cy" values={`${capY + capH + 1};${44}`} dur="6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.12;0" dur="6s" repeatCount="indefinite" />
              </circle>
              <circle cx={cx + capW * 0.32} cy={capY + capH + 6} r={0.3} fill={spotColor} opacity={0.1}>
                <animate attributeName="cy" values={`${capY + capH + 4};${46}`} dur="4.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.13;0" dur="4.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={cx - capW * 0.1} cy={capY + capH + 2} r={0.25} fill={spotColor} opacity={0.08}>
                <animate attributeName="cy" values={`${capY + capH + 2};${45}`} dur="5.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.1;0" dur="5.5s" repeatCount="indefinite" />
              </circle>
            </>}

            {/* Ground shadow */}
            <ellipse cx={cx} cy={46} rx={capW * 0.4} ry={1} fill="black" opacity={0.08} />
          </g>
        );
      }

      // ─── CACTUS ─────────────────────────────────────────────
      case 'cactus': {
        const h = [8, 16, 26, 34][s];
        const w = [3, 4.5, 5.5, 6][s];
        const cx = 24;
        const baseY = 46;
        const topY = baseY - h;
        const ribColor = dark;
        const bodyColor = color; // #2e7d32
        const spineColor = "#a5d6a7";

        return (
          <g>
            {/* Main column */}
            <rect x={cx - w / 2} y={topY} width={w} height={h} rx={w / 2} fill={bodyColor} />
            {/* Ribs — vertical lines */}
            {s >= 1 && Array.from({ length: 3 }).map((_, i) => {
              const rx = cx - w * 0.25 + i * (w * 0.25);
              return <line key={`rib-${i}`} x1={rx} y1={topY + 2} x2={rx} y2={baseY - 2} stroke={ribColor} strokeWidth={0.3} opacity={0.4} />;
            })}

            {/* Left arm — stage 2+ */}
            {s >= 2 && <>
              <path d={`M${cx - w / 2} ${topY + h * 0.5} H${cx - w / 2 - 3} V${topY + h * 0.25}`} fill="none" stroke={bodyColor} strokeWidth={w * 0.6} strokeLinecap="round" strokeLinejoin="round" />
              <rect x={cx - w / 2 - 3 - w * 0.2} y={topY + h * 0.25 - 2} width={w * 0.5} height={h * 0.27} rx={w * 0.2} fill={bodyColor} />
            </>}

            {/* Right arm — stage 3 */}
            {s === 3 && <>
              <path d={`M${cx + w / 2} ${topY + h * 0.35} H${cx + w / 2 + 4} V${topY + h * 0.15}`} fill="none" stroke={bodyColor} strokeWidth={w * 0.55} strokeLinecap="round" strokeLinejoin="round" />
              <rect x={cx + w / 2 + 4 - w * 0.18} y={topY + h * 0.15 - 3} width={w * 0.45} height={h * 0.22} rx={w * 0.18} fill={bodyColor} />
            </>}

            {/* Spines — tiny lines radiating out */}
            {s >= 1 && Array.from({ length: s * 4 + 2 }).map((_, i) => {
              const sy = topY + 3 + i * ((h - 6) / (s * 4 + 1));
              const side = i % 2 === 0 ? -1 : 1;
              return <line key={`sp-${i}`} x1={cx + side * w / 2} y1={sy} x2={cx + side * (w / 2 + 2)} y2={sy - 0.8} stroke={spineColor} strokeWidth={0.3} opacity={0.7} />;
            })}

            {/* Pink flower on top — stage 3 */}
            {s === 3 && <>
              {[0, 60, 120, 180, 240, 300].map((a, i) => {
                const rad = (a * Math.PI) / 180;
                const px = cx + Math.cos(rad) * 2.5;
                const py = topY - 1 + Math.sin(rad) * 2.5;
                return <ellipse key={`fl-${i}`} cx={px} cy={py} rx={1.8} ry={1.2} fill="#f48fb1" transform={`rotate(${a} ${px} ${py})`} opacity={0.9} />;
              })}
              <circle cx={cx} cy={topY - 1} r={1.2} fill="#fff176" />
            </>}

            {/* Ground */}
            <ellipse cx={cx} cy={46} rx={w * 1.2} ry={0.8} fill="black" opacity={0.06} />
          </g>
        );
      }

      // ─── WILLOW ─────────────────────────────────────────────
      case 'ivy': {
        const h = [8, 16, 26, 36][s];
        const leafCount = [3, 8, 16, 28][s];
        const cx = 24;
        const baseY = 46;
        const topY = baseY - h;
        const postColor = "#9e9e9e";

        // Heart-shaped leaf path
        const ivyLeaf = (lx: number, ly: number, size: number, rot: number, fill: string) => (
          <path
            d={`M${lx} ${ly + size} C${lx - size} ${ly + size * 0.2} ${lx - size * 0.8} ${ly - size * 0.3} ${lx} ${ly - size * 0.5} C${lx + size * 0.8} ${ly - size * 0.3} ${lx + size} ${ly + size * 0.2} ${lx} ${ly + size} Z`}
            fill={fill} stroke={dark} strokeWidth={0.15}
            transform={`rotate(${rot} ${lx} ${ly})`}
            opacity={0.85}
          />
        );

        return (
          <g>
            {/* Implied post/wall — thin vertical grey line */}
            <line x1={cx} y1={baseY} x2={cx} y2={topY - 2} stroke={postColor} strokeWidth={1.5} opacity={0.3} />

            {/* Main vine — climbing, slightly wavy */}
            <path
              d={`M${cx + 1} ${baseY} ${Array.from({ length: Math.ceil(h / 4) }).map((_, i) => {
                const vy = baseY - (i + 1) * 4;
                const vx = cx + (i % 2 === 0 ? -1.5 : 1.5);
                return `Q${vx + (i % 2 === 0 ? -2 : 2)} ${vy + 2} ${vx} ${vy}`;
              }).join(" ")}`}
              stroke={dark} strokeWidth={0.8} fill="none" strokeLinecap="round"
            />

            {/* Secondary vine at stage 3 */}
            {s === 3 && (
              <path
                d={`M${cx - 2} ${baseY} ${Array.from({ length: Math.ceil(h / 5) }).map((_, i) => {
                  const vy = baseY - (i + 1) * 5;
                  const vx = cx - 2 + (i % 2 === 0 ? 2 : -1);
                  return `Q${vx + 1} ${vy + 2.5} ${vx} ${vy}`;
                }).join(" ")}`}
                stroke={color} strokeWidth={0.5} fill="none" opacity={0.5} strokeLinecap="round"
              />
            )}

            {/* Heart-shaped leaves climbing up */}
            {Array.from({ length: leafCount }).map((_, i) => {
              const t = i / leafCount;
              const ly = baseY - 3 - t * (h - 4);
              const side = i % 2 === 0 ? -1 : 1;
              const lx = cx + side * (2 + Math.random() * 2);
              const size = s >= 2 ? 2.2 + Math.random() * 0.8 : 1.5;
              const rot = side * (15 + Math.random() * 20);
              const leafFill = i % 3 === 0 ? light : (i % 3 === 1 ? color : dark);
              return (
                <g key={`ivy-${i}`}>
                  {/* Tiny stem to vine */}
                  <line x1={cx + (i % 2 === 0 ? -0.5 : 0.5)} y1={ly} x2={lx} y2={ly} stroke={dark} strokeWidth={0.3} opacity={0.5} />
                  {ivyLeaf(lx + side * size * 0.3, ly, size, rot, leafFill)}
                </g>
              );
            })}

            {/* Tendrils at stage 3 — tiny curly bits */}
            {s === 3 && Array.from({ length: 4 }).map((_, i) => {
              const ty = topY + 2 + i * 6;
              const side = i % 2 === 0 ? 1 : -1;
              return (
                <path key={`tend-${i}`}
                  d={`M${cx + side * 2} ${ty} Q${cx + side * 5} ${ty - 1} ${cx + side * 4} ${ty + 2}`}
                  stroke={color} strokeWidth={0.3} fill="none" opacity={0.4}
                />
              );
            })}

            <ellipse cx={cx} cy={46} rx={2} ry={0.5} fill="black" opacity={0.04} />
          </g>
        );
      }

      // ─── MAPLE ──────────────────────────────────────────────
      case 'whirlpool': {
        // Water vortex tree — spiraling water trunk and swirling canopy
        const water = color; // #0097a7
        const foam = "#e0f7fa";
        const deep = darken(color, 50);
        if (s === 0) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-spin { 0% { opacity: 0.3; } 50% { opacity: 0.7; } 100% { opacity: 0.3; } }`}</style>
            </defs>
            <path d="M24 46 Q22 42 24 38 Q26 42 24 46" fill={water} opacity="0.5" />
            <circle cx="24" cy="36" r="3" fill="none" stroke={water} strokeWidth="0.8" opacity="0.4"
              style={{animation: `fx-${uid}-spin 2s linear infinite`} as React.CSSProperties} />
            <circle cx="24" cy="36" r="1.5" fill={water} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-spin { 0% { opacity: 0.25; } 50% { opacity: 0.6; } 100% { opacity: 0.25; } }
                @keyframes fx-${uid}-spin2 { 0% { opacity: 0.5; } 50% { opacity: 0.2; } 100% { opacity: 0.5; } }`}</style>
            </defs>
            {/* Spiral trunk */}
            <path d="M24 46 Q20 40 22 36 Q26 34 28 38 Q24 40 24 46" fill={water} opacity="0.5" />
            <path d="M22 36 Q20 32 24 28 Q28 32 26 36" fill={water} opacity="0.4" />
            {/* Rings */}
            <ellipse cx="24" cy="24" rx="6" ry="3" fill="none" stroke={water} strokeWidth="0.8" opacity="0.4"
              style={{animation: `fx-${uid}-spin 2s linear infinite`} as React.CSSProperties} />
            <ellipse cx="24" cy="24" rx="4" ry="2" fill="none" stroke={light} strokeWidth="0.6" opacity="0.5"
              style={{animation: `fx-${uid}-spin2 2s linear infinite`} as React.CSSProperties} />
            <ellipse cx="24" cy="24" rx="2" ry="1" fill={water} opacity="0.3" />
            {/* Droplets */}
            <circle cx="18" cy="26" r="0.5" fill={foam} opacity="0.3" />
            <circle cx="30" cy="22" r="0.4" fill={foam} opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-r1 { 0%,100% { opacity: 0.3; } 33% { opacity: 0.7; } }
                @keyframes fx-${uid}-r2 { 0%,100% { opacity: 0.5; } 66% { opacity: 0.2; } }
                @keyframes fx-${uid}-r3 { 0%,100% { opacity: 0.2; } 50% { opacity: 0.6; } }`}</style>
              <linearGradient id={`${uid}-w`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={deep} />
              </linearGradient>
            </defs>
            {/* Spiral water trunk */}
            <path d="M24 46 Q18 40 20 36 Q26 34 28 38 Q22 40 24 46" fill={`url(#${uid}-w)`} opacity="0.55" />
            <path d="M20 36 Q16 32 20 28 Q28 26 30 30 Q24 34 20 36" fill={water} opacity="0.4" />
            <path d="M20 28 Q18 24 22 22 Q28 22 28 26" fill={water} opacity="0.35" />
            {/* Vortex rings */}
            <ellipse cx="24" cy="18" rx="10" ry="5" fill="none" stroke={water} strokeWidth="1" opacity="0.4"
              style={{animation: `fx-${uid}-r1 3s linear infinite`} as React.CSSProperties} />
            <ellipse cx="24" cy="18" rx="7" ry="3.5" fill="none" stroke={light} strokeWidth="0.8" opacity="0.5"
              style={{animation: `fx-${uid}-r2 3s linear infinite`} as React.CSSProperties} />
            <ellipse cx="24" cy="18" rx="4" ry="2" fill="none" stroke={foam} strokeWidth="0.6" opacity="0.45"
              style={{animation: `fx-${uid}-r3 3s linear infinite`} as React.CSSProperties} />
            <ellipse cx="24" cy="18" rx="1.5" ry="0.8" fill={deep} opacity="0.4" />
            {/* Water droplets spiraling outward */}
            {[{x:14,y:16},{x:34,y:16},{x:16,y:22},{x:32,y:14},{x:12,y:20}].map((d,i) => (
              <circle key={i} cx={d.x} cy={d.y} r="0.5" fill={foam} opacity={0.2 + i*0.04} />
            ))}
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes fx-${uid}-r1 { 0%,100% { opacity: 0.25; } 33% { opacity: 0.7; } 66% { opacity: 0.15; } }
                @keyframes fx-${uid}-r2 { 0%,100% { opacity: 0.5; } 33% { opacity: 0.15; } 66% { opacity: 0.65; } }
                @keyframes fx-${uid}-r3 { 0%,100% { opacity: 0.15; } 50% { opacity: 0.6; } }
                @keyframes fx-${uid}-r4 { 0%,100% { opacity: 0.4; } 50% { opacity: 0.1; } }
                @keyframes fx-${uid}-drop { 0% { transform: translate(0,0); opacity: 0.5; } 100% { transform: translate(var(--dx), var(--dy)); opacity: 0; } }
              `}</style>
              <linearGradient id={`${uid}-w`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={foam} stopOpacity="0.4" />
                <stop offset="50%" stopColor={water} />
                <stop offset="100%" stopColor={deep} />
              </linearGradient>
              <radialGradient id={`${uid}-core`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={deep} />
                <stop offset="100%" stopColor={water} stopOpacity="0.5" />
              </radialGradient>
            </defs>
            {/* Spiral water trunk — layered curves */}
            <path d="M24 46 Q16 40 18 36 Q24 32 30 36 Q26 40 24 46" fill={`url(#${uid}-w)`} opacity="0.55" />
            <path d="M18 36 Q12 32 16 28 Q24 24 32 28 Q28 34 18 36" fill={water} opacity="0.45" />
            <path d="M16 28 Q12 24 18 20 Q26 18 30 22 Q24 28 16 28" fill={water} opacity="0.4" />
            <path d="M18 20 Q16 16 22 14 Q28 14 28 18" fill={light} opacity="0.3" />
            {/* Water surface sheen on trunk */}
            <path d="M20 38 Q22 36 24 38" stroke={foam} strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M16 30 Q20 28 24 30" stroke={foam} strokeWidth="0.35" fill="none" opacity="0.25" />
            <path d="M18 22 Q22 20 26 22" stroke={foam} strokeWidth="0.3" fill="none" opacity="0.2" />
            {/* Swirling vortex canopy — concentric rings with staggered opacity pulses */}
            <ellipse cx="24" cy="14" rx="14" ry="7" fill="none" stroke={water} strokeWidth="1.2"
              style={{animation: `fx-${uid}-r1 3s linear infinite`} as React.CSSProperties} />
            <ellipse cx="24" cy="14" rx="11" ry="5.5" fill="none" stroke={light} strokeWidth="1"
              style={{animation: `fx-${uid}-r2 3s linear infinite`} as React.CSSProperties} />
            <ellipse cx="24" cy="14" rx="8" ry="4" fill="none" stroke={water} strokeWidth="0.8"
              style={{animation: `fx-${uid}-r3 3s linear infinite`} as React.CSSProperties} />
            <ellipse cx="24" cy="14" rx="5" ry="2.5" fill="none" stroke={foam} strokeWidth="0.6"
              style={{animation: `fx-${uid}-r4 3s linear infinite`} as React.CSSProperties} />
            <ellipse cx="24" cy="14" rx="2.5" ry="1.2" fill={`url(#${uid}-core)`} />
            {/* Dark vortex hole at center */}
            <ellipse cx="24" cy="14" rx="1" ry="0.5" fill={deep} opacity="0.6" />
            {/* Water droplets spiraling outward */}
            {[
              {x:10,y:12,dx:"-4px",dy:"-2px"},{x:38,y:12,dx:"4px",dy:"-2px"},
              {x:12,y:18,dx:"-3px",dy:"2px"},{x:36,y:18,dx:"3px",dy:"2px"},
              {x:14,y:8,dx:"-2px",dy:"-3px"},{x:34,y:8,dx:"2px",dy:"-3px"},
              {x:8,y:14,dx:"-5px",dy:"0px"},{x:40,y:14,dx:"5px",dy:"0px"},
            ].map((d,i) => (
              <circle key={i} cx={d.x} cy={d.y} r={0.4 + i%3*0.15} fill={foam} opacity="0.35"
                style={{'--dx': d.dx, '--dy': d.dy, animation: `fx-${uid}-drop 3s linear ${i*0.4}s infinite`} as React.CSSProperties} />
            ))}
            {/* Spray mist at edges */}
            <circle cx="8" cy="14" r="0.6" fill={foam} opacity="0.15" />
            <circle cx="40" cy="14" r="0.5" fill={foam} opacity="0.12" />
            <circle cx="24" cy="7" r="0.5" fill={foam} opacity="0.15" />
            {/* Foam flecks on trunk */}
            <circle cx="20" cy="34" r="0.4" fill={foam} opacity="0.2" />
            <circle cx="28" cy="30" r="0.35" fill={foam} opacity="0.18" />
            <circle cx="22" cy="24" r="0.3" fill={foam} opacity="0.15" />
          </g>
        )
      }

      case 'bloom': {
        // Everbloom — the entire thing IS one enormous flower
        const petal = color; // #e91e63
        const petal2 = lighten(color, 30);
        const petal3 = lighten(color, 60);
        const stamen = "#ffd600";
        const stem = "#2e7d32";
        if (s === 0) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
            </defs>
            <path d="M24 46 Q24 42 24 36" stroke={stem} strokeWidth="1.5" fill="none" />
            {/* Tiny bud */}
            <g style={{transformOrigin: '24px 34px', animation: `fx-${uid}-pulse 3s ease-in-out infinite`} as React.CSSProperties}>
              <ellipse cx="24" cy="34" rx="2.5" ry="3" fill={petal} opacity="0.9" />
              <path d="M24 31 Q23 32 24 33 Q25 32 24 31" fill={petal2} opacity="0.85" />
              <circle cx="24" cy="33" r="0.5" fill={stamen} opacity="0.8" />
            </g>
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }`}</style>
            </defs>
            <path d="M24 46 Q24 40 24 32" stroke={stem} strokeWidth="2" fill="none" />
            <path d="M24 38 Q22 36 20 38" stroke={stem} strokeWidth="0.8" fill="none" opacity="0.85" />
            <g style={{transformOrigin: '24px 26px', animation: `fx-${uid}-pulse 3s ease-in-out infinite`} as React.CSSProperties}>
              {/* Outer petals */}
              {[0,72,144,216,288].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 6 * Math.cos(rad);
                const py = 26 + 6 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="3" ry="5" fill={petal} opacity="0.9"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Inner petals */}
              {[36,108,180,252,324].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 3.5 * Math.cos(rad);
                const py = 26 + 3.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="2" ry="3.5" fill={petal2} opacity="0.85"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              <circle cx="24" cy="26" r="2" fill={stamen} opacity="0.9" />
            </g>
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }`}</style>
              <radialGradient id={`${uid}-center`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={stamen} />
                <stop offset="100%" stopColor="#ff6f00" />
              </radialGradient>
            </defs>
            <path d="M24 46 Q23 40 23 30 L25 30 Q25 40 24 46" fill={stem} />
            <path d="M24 38 Q20 36 18 38" stroke={stem} strokeWidth="0.8" fill="none" opacity="0.8" />
            <path d="M24 35 Q28 33 30 35" stroke={stem} strokeWidth="0.7" fill="none" opacity="0.8" />
            <g style={{transformOrigin: '24px 22px', animation: `fx-${uid}-pulse 4s ease-in-out infinite`} as React.CSSProperties}>
              {/* Outer petals — 7 */}
              {[0,51,103,154,206,257,309].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 7.5 * Math.cos(rad);
                const py = 22 + 7.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="3.2" ry="5.5" fill={petal} opacity="0.9"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Middle petals */}
              {[25,77,128,180,231,283,334].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 4.5 * Math.cos(rad);
                const py = 22 + 4.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="2.5" ry="4" fill={petal2} opacity="0.85"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Inner petals */}
              {[0,60,120,180,240,300].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 2.5 * Math.cos(rad);
                const py = 22 + 2.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="1.6" ry="2.8" fill={petal3} opacity="0.85"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              <circle cx="24" cy="22" r="2.5" fill={`url(#${uid}-center)`} />
              {/* Stamen dots */}
              {[0,60,120,180,240,300].map((a,i) => {
                const rad = (a * Math.PI) / 180;
                return <circle key={i} cx={24 + 2 * Math.cos(rad)} cy={22 + 2 * Math.sin(rad)} r="0.4" fill="#fff" opacity="0.8" />;
              })}
            </g>
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes fx-${uid}-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.015); } }
                @keyframes fx-${uid}-drift { 0% { transform: translate(0,0) rotate(0deg); opacity: 0.5; } 100% { transform: translate(var(--dx), 12px) rotate(90deg); opacity: 0; } }
              `}</style>
              <radialGradient id={`${uid}-center`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
                <stop offset="40%" stopColor={stamen} />
                <stop offset="100%" stopColor="#ff6f00" />
              </radialGradient>
              <radialGradient id={`${uid}-glow`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={stamen} stopOpacity="0.3" />
                <stop offset="100%" stopColor={petal} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Stem — longer */}
            <path d="M23 46 Q22 38 22 26 L26 26 Q26 38 25 46" fill={stem} />
            <path d="M23 42 L25 41.5" stroke="#1b5e20" strokeWidth="0.4" opacity="0.2" />
            <path d="M23 36 L25 35.5" stroke="#1b5e20" strokeWidth="0.35" opacity="0.15" />
            {/* Leaves on stem */}
            <path d="M22 40 Q18 38 16 40 Q18 39 22 40" fill={stem} opacity="0.85" />
            <path d="M26 37 Q30 35 32 37 Q30 36 26 37" fill={stem} opacity="0.85" />
            <path d="M22 34 Q19 32 17 34 Q19 33 22 34" fill={stem} opacity="0.7" />
            {/* Central glow */}
            <circle cx="24" cy="18" r="8" fill={`url(#${uid}-glow)`} />
            {/* THE BLOOM — concentric petal layers */}
            <g style={{transformOrigin: '24px 18px', animation: `fx-${uid}-pulse 5s ease-in-out infinite`} as React.CSSProperties}>
              {/* Outermost petals — 8 */}
              {[0,45,90,135,180,225,270,315].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 9.5 * Math.cos(rad);
                const py = 18 + 9.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="4" ry="7" fill={dark} opacity="0.85"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Second layer — 8, offset */}
              {[22,67,112,157,202,247,292,337].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 7.5 * Math.cos(rad);
                const py = 18 + 7.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="3.5" ry="6" fill={petal} opacity="0.85"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Third layer — 7 */}
              {[0,51,103,154,206,257,309].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 5 * Math.cos(rad);
                const py = 18 + 5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="2.8" ry="4.5" fill={petal2} opacity="0.85"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Inner layer — 6, lightest */}
              {[0,60,120,180,240,300].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 2.8 * Math.cos(rad);
                const py = 18 + 2.8 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="2" ry="3.5" fill={petal3} opacity="0.85"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Central stamen glow */}
              <circle cx="24" cy="18" r="3.2" fill={`url(#${uid}-center)`} />
              {/* Stamen filaments */}
              {[0,45,90,135,180,225,270,315].map((a,i) => {
                const rad = (a * Math.PI) / 180;
                return <g key={i}>
                  <line x1={24 + 1.2 * Math.cos(rad)} y1={18 + 1.2 * Math.sin(rad)}
                    x2={24 + 2.5 * Math.cos(rad)} y2={18 + 2.5 * Math.sin(rad)}
                    stroke={stamen} strokeWidth="0.4" opacity="0.85" />
                  <circle cx={24 + 2.5 * Math.cos(rad)} cy={18 + 2.5 * Math.sin(rad)} r="0.45" fill="#fff" opacity="0.85" />
                </g>;
              })}
            </g>
            {/* Drifting petals falling away */}
            {[{x:8,y:32,dx:"-6px"},{x:38,y:34,dx:"5px"},{x:12,y:36,dx:"-4px"}].map((p,i) => (
              <ellipse key={i} cx={p.x} cy={p.y} rx="1.5" ry="2.5" fill={petal} opacity="0.8"
                transform={`rotate(${30+i*40} ${p.x} ${p.y})`}
                style={{'--dx': p.dx, animation: `fx-${uid}-drift ${4+i}s linear ${i*1.5}s infinite`} as React.CSSProperties} />
            ))}
          </g>
        )
      }

      case 'willow':
        if (s === 0) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="34" stroke={trunk} strokeWidth="1.5" />
            <path d="M24 34 Q22 30 20 32 Q22 29 24 34" fill={color} />
            <path d="M24 34 Q26 30 28 32 Q26 29 24 34" fill={dark} />
            <path d="M24 34 Q21 31 19 34 Q20 33 24 34" fill={light} />
            <path d="M24 34 Q27 31 29 34 Q28 33 24 34" fill={color} />
            <path d="M24 34 Q23 30 22 33 Q23 32 24 34" fill={dark} />
            <path d="M24 34 Q25 30 26 33 Q25 32 24 34" fill={light} />
          </g>
        )
        if (s === 1) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="26" stroke={trunk} strokeWidth="2" />
            <path d="M24 28 Q16 25 10 27" stroke={trunk} strokeWidth="1" fill="none" />
            <path d="M24 28 Q32 25 38 27" stroke={trunk} strokeWidth="1" fill="none" />
            {/* Solid curtain — every pixel covered */}
            <path d="M10 27 Q8 32 6 38 Q7 37 10 27" fill={color} />
            <path d="M10 27 Q7 33 5 40 Q6 39 10 27" fill={light} />
            <path d="M10 27 Q9 33 8 40 Q9 39 10 27" fill={dark} />
            <path d="M10 27 Q10 33 10 40 Q11 39 10 27" fill={color} />
            <path d="M10 27 Q11 32 12 39 Q13 38 10 27" fill={light} />
            <path d="M10 27 Q12 33 14 40 Q15 39 10 27" fill={dark} />
            <path d="M10 27 Q13 33 16 40 Q17 39 10 27" fill={color} />
            <path d="M38 27 Q40 32 42 38 Q41 37 38 27" fill={color} />
            <path d="M38 27 Q41 33 43 40 Q42 39 38 27" fill={light} />
            <path d="M38 27 Q39 33 40 40 Q39 39 38 27" fill={dark} />
            <path d="M38 27 Q38 33 38 40 Q37 39 38 27" fill={color} />
            <path d="M38 27 Q37 32 36 39 Q35 38 38 27" fill={light} />
            <path d="M38 27 Q36 33 34 40 Q33 39 38 27" fill={dark} />
            <path d="M38 27 Q35 33 32 40 Q31 39 38 27" fill={color} />
            <path d="M24 26 Q22 30 19 37 Q20 36 24 26" fill={color} />
            <path d="M24 26 Q21 31 17 39 Q18 38 24 26" fill={dark} />
            <path d="M24 26 Q20 30 15 37 Q16 36 24 26" fill={light} />
            <path d="M24 26 Q23 31 21 40 Q22 39 24 26" fill={color} />
            <path d="M24 26 Q26 30 29 37 Q28 36 24 26" fill={color} />
            <path d="M24 26 Q27 31 31 39 Q30 38 24 26" fill={dark} />
            <path d="M24 26 Q28 30 33 37 Q32 36 24 26" fill={light} />
            <path d="M24 26 Q25 31 27 40 Q26 39 24 26" fill={color} />
            <path d="M14 27 Q13 32 12 38 Q13 37 14 27" fill={color} />
            <path d="M14 27 Q14 33 15 40 Q16 39 14 27" fill={light} />
            <path d="M34 27 Q35 32 36 38 Q35 37 34 27" fill={color} />
            <path d="M34 27 Q34 33 33 40 Q32 39 34 27" fill={light} />
            <path d="M18 27 Q17 32 15 39 Q16 38 18 27" fill={dark} />
            <path d="M18 27 Q18 33 19 40 Q20 39 18 27" fill={color} />
            <path d="M30 27 Q31 32 33 39 Q32 38 30 27" fill={dark} />
            <path d="M30 27 Q30 33 29 40 Q28 39 30 27" fill={color} />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 20" stroke={trunk} strokeWidth="3" />
            {/* Top branches */}
            <path d="M24 22 Q14 18 4 21" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M24 22 Q34 18 44 21" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M24 20 Q18 19 10 20" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M24 20 Q30 19 38 20" stroke={trunk} strokeWidth="1.2" fill="none" />
            {/* Canopy cap */}
            <path d="M4 21 Q12 16 24 15 Q36 16 44 21 Q38 18 24 17 Q10 18 4 21Z" fill={dark} opacity={0.85} />
            {/* Wall of strands — left far, every 1-2px */}
            <path d="M4 21 Q2 28 0 38 Q1 37 4 21" fill={color} />
            <path d="M4 21 Q1 29 -1 40 Q0 39 4 21" fill={light} />
            <path d="M4 21 Q3 29 1 41 Q2 40 4 21" fill={dark} />
            <path d="M4 21 Q4 30 3 43 Q4 42 4 21" fill={color} />
            <path d="M4 21 Q5 29 5 42 Q6 41 4 21" fill={light} />
            <path d="M4 21 Q6 30 7 44 Q8 43 4 21" fill={dark} />
            <path d="M4 21 Q7 30 9 44 Q10 43 4 21" fill={color} />
            <path d="M4 21 Q8 31 11 45 Q12 44 4 21" fill={light} />
            <path d="M4 21 Q9 31 13 46 Q14 45 4 21" fill={color} />
            {/* Left inner */}
            <path d="M10 20 Q8 28 5 40 Q6 39 10 20" fill={dark} />
            <path d="M10 20 Q8 30 6 43 Q7 42 10 20" fill={color} />
            <path d="M10 20 Q9 30 8 44 Q9 43 10 20" fill={light} />
            <path d="M10 20 Q10 30 10 44 Q11 43 10 20" fill={color} />
            <path d="M10 20 Q11 30 12 44 Q13 43 10 20" fill={dark} />
            <path d="M10 20 Q12 31 14 45 Q15 44 10 20" fill={color} />
            <path d="M10 20 Q13 31 16 46 Q17 45 10 20" fill={light} />
            <path d="M10 20 Q14 31 18 46 Q19 45 10 20" fill={dark} />
            {/* Right far */}
            <path d="M44 21 Q46 28 48 38 Q47 37 44 21" fill={color} />
            <path d="M44 21 Q47 29 49 40 Q48 39 44 21" fill={light} />
            <path d="M44 21 Q45 29 47 41 Q46 40 44 21" fill={dark} />
            <path d="M44 21 Q44 30 45 43 Q44 42 44 21" fill={color} />
            <path d="M44 21 Q43 29 43 42 Q42 41 44 21" fill={light} />
            <path d="M44 21 Q42 30 41 44 Q40 43 44 21" fill={dark} />
            <path d="M44 21 Q41 30 39 44 Q38 43 44 21" fill={color} />
            <path d="M44 21 Q40 31 37 45 Q36 44 44 21" fill={light} />
            <path d="M44 21 Q39 31 35 46 Q34 45 44 21" fill={color} />
            {/* Right inner */}
            <path d="M38 20 Q40 28 43 40 Q42 39 38 20" fill={dark} />
            <path d="M38 20 Q40 30 42 43 Q41 42 38 20" fill={color} />
            <path d="M38 20 Q39 30 40 44 Q39 43 38 20" fill={light} />
            <path d="M38 20 Q38 30 38 44 Q37 43 38 20" fill={color} />
            <path d="M38 20 Q37 30 36 44 Q35 43 38 20" fill={dark} />
            <path d="M38 20 Q36 31 34 45 Q33 44 38 20" fill={color} />
            <path d="M38 20 Q35 31 32 46 Q31 45 38 20" fill={light} />
            <path d="M38 20 Q34 31 30 46 Q29 45 38 20" fill={dark} />
            {/* Center */}
            <path d="M24 20 Q21 26 16 36 Q17 35 24 20" fill={color} />
            <path d="M24 20 Q20 27 14 38 Q15 37 24 20" fill={dark} />
            <path d="M24 20 Q22 28 18 40 Q19 39 24 20" fill={light} />
            <path d="M24 20 Q23 30 20 44 Q21 43 24 20" fill={color} />
            <path d="M24 20 Q22 31 18 46 Q19 45 24 20" fill={dark} />
            <path d="M24 20 Q27 26 32 36 Q31 35 24 20" fill={color} />
            <path d="M24 20 Q28 27 34 38 Q33 37 24 20" fill={dark} />
            <path d="M24 20 Q26 28 30 40 Q29 39 24 20" fill={light} />
            <path d="M24 20 Q25 30 28 44 Q27 43 24 20" fill={color} />
            <path d="M24 20 Q26 31 30 46 Q29 45 24 20" fill={dark} />
            {/* Gap fillers */}
            <path d="M7 21 Q6 29 4 42 Q5 41 7 21" fill={color} />
            <path d="M7 21 Q8 30 10 44 Q11 43 7 21" fill={light} />
            <path d="M41 21 Q42 29 44 42 Q43 41 41 21" fill={color} />
            <path d="M41 21 Q40 30 38 44 Q37 43 41 21" fill={light} />
            <path d="M16 20 Q14 29 11 42 Q12 41 16 20" fill={dark} />
            <path d="M16 20 Q16 30 17 44 Q18 43 16 20" fill={color} />
            <path d="M16 20 Q17 31 20 46 Q21 45 16 20" fill={light} />
            <path d="M32 20 Q34 29 37 42 Q36 41 32 20" fill={dark} />
            <path d="M32 20 Q32 30 31 44 Q30 43 32 20" fill={color} />
            <path d="M32 20 Q31 31 28 46 Q27 45 32 20" fill={light} />
            <path d="M20 19 Q18 28 15 42 Q16 41 20 19" fill={color} opacity={0.8} />
            <path d="M20 19 Q20 30 21 46 Q22 45 20 19" fill={dark} opacity={0.8} />
            <path d="M28 19 Q30 28 33 42 Q32 41 28 19" fill={color} opacity={0.8} />
            <path d="M28 19 Q28 30 27 46 Q26 45 28 19" fill={dark} opacity={0.8} />
          </g>
        )
        return (
          <g>
            {/* Trunk */}
            <path d="M24 46 L24 16" stroke={trunk} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M24 46 Q22 45 20 46" stroke={trunk} strokeWidth="1.3" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q26 45 28 46" stroke={trunk} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            {/* Only top branches */}
            <path d="M24 18 Q14 14 4 17" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 18 Q34 14 44 17" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 16 Q18 14 10 16" stroke={trunk} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M24 16 Q30 14 38 16" stroke={trunk} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            {/* Top canopy mass */}
            <path d="M4 17 Q12 12 24 11 Q36 12 44 17 Q38 14 24 13 Q10 14 4 17Z" fill={dark} opacity={0.85} />
            {/* Far left strands — from x=4 */}
            <path d="M4 17 Q2 24 0 34 Q1 33 4 17" fill={color} />
            <path d="M4 17 Q1 25 -1 38 Q0 37 4 17" fill={light} />
            <path d="M4 17 Q3 26 1 39 Q2 38 4 17" fill={dark} />
            <path d="M4 17 Q4 27 3 42 Q4 41 4 17" fill={color} />
            <path d="M4 17 Q5 26 5 40 Q6 39 4 17" fill={light} />
            <path d="M4 17 Q6 27 7 43 Q8 42 4 17" fill={color} />
            <path d="M4 17 Q7 28 9 44 Q10 43 4 17" fill={dark} />
            <path d="M4 17 Q8 29 10 46 Q11 45 4 17" fill={light} />
            {/* Far right strands — from x=44 */}
            <path d="M44 17 Q46 24 48 34 Q47 33 44 17" fill={color} />
            <path d="M44 17 Q47 25 49 38 Q48 37 44 17" fill={light} />
            <path d="M44 17 Q45 26 47 39 Q46 38 44 17" fill={dark} />
            <path d="M44 17 Q44 27 45 42 Q44 41 44 17" fill={color} />
            <path d="M44 17 Q43 26 43 40 Q42 39 44 17" fill={light} />
            <path d="M44 17 Q42 27 41 43 Q40 42 44 17" fill={color} />
            <path d="M44 17 Q41 28 39 44 Q38 43 44 17" fill={dark} />
            <path d="M44 17 Q40 29 38 46 Q37 45 44 17" fill={light} />
            {/* Inner left strands — from x=10 */}
            <path d="M10 16 Q7 24 4 36 Q5 35 10 16" fill={dark} />
            <path d="M10 16 Q8 25 5 38 Q6 37 10 16" fill={color} />
            <path d="M10 16 Q8 27 6 42 Q7 41 10 16" fill={light} />
            <path d="M10 16 Q9 28 8 44 Q9 43 10 16" fill={color} />
            <path d="M10 16 Q10 27 9 42 Q10 41 10 16" fill={dark} />
            <path d="M10 16 Q11 28 11 44 Q12 43 10 16" fill={color} />
            <path d="M10 16 Q12 29 13 46 Q14 45 10 16" fill={light} />
            <path d="M10 16 Q13 28 15 44 Q16 43 10 16" fill={dark} />
            {/* Inner right strands — from x=38 */}
            <path d="M38 16 Q41 24 44 36 Q43 35 38 16" fill={dark} />
            <path d="M38 16 Q40 25 43 38 Q42 37 38 16" fill={color} />
            <path d="M38 16 Q40 27 42 42 Q41 41 38 16" fill={light} />
            <path d="M38 16 Q39 28 40 44 Q39 43 38 16" fill={color} />
            <path d="M38 16 Q38 27 39 42 Q38 41 38 16" fill={dark} />
            <path d="M38 16 Q37 28 37 44 Q36 43 38 16" fill={color} />
            <path d="M38 16 Q36 29 35 46 Q34 45 38 16" fill={light} />
            <path d="M38 16 Q35 28 33 44 Q32 43 38 16" fill={dark} />
            {/* Center strands — from top of trunk */}
            <path d="M24 16 Q21 22 17 32 Q18 31 24 16" fill={dark} />
            <path d="M24 16 Q22 24 19 36 Q20 35 24 16" fill={color} />
            <path d="M24 16 Q20 23 15 34 Q16 33 24 16" fill={light} />
            <path d="M24 16 Q23 26 20 40 Q21 39 24 16" fill={color} />
            <path d="M24 16 Q21 27 17 42 Q18 41 24 16" fill={dark} />
            <path d="M24 16 Q22 28 19 44 Q20 43 24 16" fill={light} />
            <path d="M24 16 Q27 22 31 32 Q30 31 24 16" fill={dark} />
            <path d="M24 16 Q26 24 29 36 Q28 35 24 16" fill={color} />
            <path d="M24 16 Q28 23 33 34 Q32 33 24 16" fill={light} />
            <path d="M24 16 Q25 26 28 40 Q27 39 24 16" fill={color} />
            <path d="M24 16 Q27 27 31 42 Q30 41 24 16" fill={dark} />
            <path d="M24 16 Q26 28 29 44 Q28 43 24 16" fill={light} />
            {/* Fill gaps — mid-branch origin strands */}
            <path d="M7 17 Q5 25 3 38 Q4 37 7 17" fill={color} />
            <path d="M7 17 Q8 27 9 42 Q10 41 7 17" fill={light} />
            <path d="M41 17 Q43 25 45 38 Q44 37 41 17" fill={color} />
            <path d="M41 17 Q40 27 39 42 Q38 41 41 17" fill={light} />
            <path d="M14 15 Q11 24 8 38 Q9 37 14 15" fill={dark} />
            <path d="M14 15 Q13 27 12 42 Q13 41 14 15" fill={color} />
            <path d="M14 15 Q15 28 17 44 Q18 43 14 15" fill={light} />
            <path d="M34 15 Q37 24 40 38 Q39 37 34 15" fill={dark} />
            <path d="M34 15 Q35 27 36 42 Q35 41 34 15" fill={color} />
            <path d="M34 15 Q33 28 31 44 Q30 43 34 15" fill={light} />
            {/* Extra density layer */}
            <path d="M18 15 Q15 24 12 38 Q13 37 18 15" fill={color} opacity={0.8} />
            <path d="M18 15 Q17 27 15 44 Q16 43 18 15" fill={dark} opacity={0.8} />
            <path d="M30 15 Q33 24 36 38 Q35 37 30 15" fill={color} opacity={0.8} />
            <path d="M30 15 Q31 27 33 44 Q32 43 30 15" fill={dark} opacity={0.8} />
            <path d="M24 14 Q20 22 16 36 Q17 35 24 14" fill={color} opacity={0.7} />
            <path d="M24 14 Q28 22 32 36 Q31 35 24 14" fill={color} opacity={0.7} />
            <path d="M24 14 Q22 26 20 44 Q21 43 24 14" fill={light} opacity={0.7} />
            <path d="M24 14 Q26 26 28 44 Q27 43 24 14" fill={light} opacity={0.7} />
          </g>
        )

      case 'cattail':
        if (s === 0) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="36" stroke="#7a9a6a" strokeWidth="0.8" />
            <path d="M24 36 Q23 34 24 32 Q25 34 24 36" fill={color} />
          </g>
        )
        if (s === 1) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="26" stroke="#7a9a6a" strokeWidth="1" />
            <path d="M23.5 26 Q23.2 29 23.5 32 Q24 32.3 24.5 32 Q24.8 29 24.5 26 Q24 25.5 23.5 26" fill={color} />
            <circle cx="23.8" cy="27" r="0.3" fill={light} opacity="0.5" />
            <circle cx="24.3" cy="29" r="0.25" fill={light} opacity="0.4" />
            <circle cx="23.6" cy="30.5" r="0.3" fill={light} opacity="0.45" />
            <path d="M24 46 Q20 40 18 34 Q19 35 24 46" fill="#7a9a6a" opacity="0.8" />
            <path d="M24 46 Q28 42 30 38 Q29 39 24 46" fill="#6a8a5a" opacity="0.8" />
          </g>
        )
        if (s === 2) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="20" stroke="#7a9a6a" strokeWidth="1.2" />
            <line x1="20" y1="46" x2="20" y2="28" stroke="#7a9a6a" strokeWidth="0.9" />
            <path d="M23.3 20 Q22.8 24 23.3 28 Q24 28.3 24.7 28 Q25.2 24 24.7 20 Q24 19.5 23.3 20" fill={color} />
            <circle cx="23.6" cy="21" r="0.3" fill={light} opacity="0.5" />
            <circle cx="24.4" cy="23" r="0.25" fill={light} opacity="0.4" />
            <circle cx="23.8" cy="25" r="0.3" fill={light} opacity="0.45" />
            <circle cx="24.2" cy="27" r="0.25" fill={light} opacity="0.4" />
            <path d="M19.5 28 Q19.2 31 19.5 34 Q20 34.2 20.5 34 Q20.8 31 20.5 28 Q20 27.5 19.5 28" fill={dark} />
            <circle cx="19.8" cy="29.5" r="0.25" fill={light} opacity="0.45" />
            <circle cx="20.2" cy="31.5" r="0.2" fill={light} opacity="0.4" />
            <circle cx="19.9" cy="33" r="0.25" fill={light} opacity="0.4" />
            <path d="M24 46 Q19 38 16 30 Q17 32 24 46" fill="#7a9a6a" opacity="0.8" />
            <path d="M24 46 Q29 40 32 34 Q31 36 24 46" fill="#6a8a5a" opacity="0.8" />
            <path d="M20 46 Q17 40 15 36 Q16 37 20 46" fill="#7a9a6a" opacity="0.8" />
          </g>
        )
        return (
          <g>
            <line x1="24" y1="46" x2="24" y2="14" stroke="#7a9a6a" strokeWidth="1.2" />
            <line x1="19" y1="46" x2="19" y2="22" stroke="#7a9a6a" strokeWidth="1" />
            <line x1="29" y1="46" x2="29" y2="24" stroke="#7a9a6a" strokeWidth="1" />
            {/* Main cattail head */}
            <path d="M23 14 Q22.5 18 23 24 Q24 24.5 25 24 Q25.5 18 25 14 Q24 13 23 14" fill={color} />
            <circle cx="23.5" cy="15" r="0.35" fill={light} opacity="0.5" />
            <circle cx="24.5" cy="16.5" r="0.3" fill={light} opacity="0.45" />
            <circle cx="23.3" cy="18" r="0.3" fill={light} opacity="0.5" />
            <circle cx="24.6" cy="19.5" r="0.25" fill={light} opacity="0.4" />
            <circle cx="23.6" cy="21" r="0.3" fill={light} opacity="0.45" />
            <circle cx="24.3" cy="22.5" r="0.25" fill={light} opacity="0.4" />
            <circle cx="23.8" cy="17" r="0.2" fill={light} opacity="0.35" />
            <circle cx="24.2" cy="20" r="0.3" fill={light} opacity="0.4" />
            <circle cx="23.4" cy="23" r="0.25" fill={light} opacity="0.35" />
            {/* Left cattail head */}
            <path d="M18.2 22 Q17.8 25 18.2 30 Q19 30.3 19.8 30 Q20.2 25 19.8 22 Q19 21.5 18.2 22" fill={dark} />
            <circle cx="18.7" cy="23" r="0.3" fill={light} opacity="0.45" />
            <circle cx="19.4" cy="25" r="0.25" fill={light} opacity="0.4" />
            <circle cx="18.9" cy="27" r="0.3" fill={light} opacity="0.45" />
            <circle cx="19.2" cy="29" r="0.25" fill={light} opacity="0.35" />
            <circle cx="18.5" cy="25.5" r="0.2" fill={light} opacity="0.35" />
            <circle cx="19.6" cy="27.5" r="0.2" fill={light} opacity="0.35" />
            {/* Right cattail head */}
            <path d="M28.2 24 Q27.8 27 28.2 32 Q29 32.3 29.8 32 Q30.2 27 29.8 24 Q29 23.5 28.2 24" fill={dark} />
            <circle cx="28.7" cy="25" r="0.3" fill={light} opacity="0.45" />
            <circle cx="29.4" cy="27" r="0.25" fill={light} opacity="0.4" />
            <circle cx="28.9" cy="29" r="0.3" fill={light} opacity="0.45" />
            <circle cx="29.2" cy="31" r="0.25" fill={light} opacity="0.35" />
            <circle cx="28.5" cy="26" r="0.2" fill={light} opacity="0.35" />
            <circle cx="29.5" cy="28.5" r="0.2" fill={light} opacity="0.35" />
            {/* Grass blade leaves */}
            <path d="M24 46 Q18 36 14 26 Q16 29 24 46" fill="#7a9a6a" opacity="0.8" />
            <path d="M24 46 Q30 38 34 30 Q32 33 24 46" fill="#6a8a5a" opacity="0.8" />
            <path d="M19 46 Q15 38 12 30 Q14 33 19 46" fill="#7a9a6a" opacity="0.8" />
            <path d="M29 46 Q33 40 36 34 Q34 37 29 46" fill="#6a8a5a" opacity="0.8" />
            <path d="M24 46 Q21 42 18 38 Q20 40 24 46" fill="#6a8a5a" opacity="0.7" />
            <path d="M24 46 Q27 42 30 38 Q28 40 24 46" fill="#7a9a6a" opacity="0.7" />
          </g>
        )

      case 'sage':
        if (s === 0) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="38" stroke="#6d8764" strokeWidth="1" />
            <path d="M22 38 Q21 36 24 35 Q27 36 26 38Z" fill={color} />
            <path d="M23 38 Q24 36 25 38" fill={light} fillOpacity="0.8" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* short stems */}
            <path d="M22 46 Q20 44 19 40" stroke="#6d8764" strokeWidth="1" fill="none" />
            <path d="M24 46 Q24 43 24 38" stroke="#6d8764" strokeWidth="1.1" fill="none" />
            <path d="M26 46 Q28 44 29 40" stroke="#6d8764" strokeWidth="1" fill="none" />
            {/* narrow elongated leaves */}
            <path d="M17 40 L14 38 L18 37 L19 36 L18 40Z" fill={color} />
            <path d="M22 38 L19 36 L23 35 L24 34 L23 38Z" fill={color} />
            <path d="M25 38 L28 36 L26 35 L25 34 L25 38Z" fill={color} />
            <path d="M29 40 L32 38 L30 37 L29 36 L29 40Z" fill={color} />
            <path d="M20 37 Q22 35 24 37" fill={light} fillOpacity="0.8" />
            <path d="M26 37 Q28 35 30 38" fill={light} fillOpacity="0.8" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* stems from base */}
            <path d="M18 46 Q16 44 15 40 Q14 38 14 36" stroke="#6d8764" strokeWidth="1.2" fill="none" />
            <path d="M21 46 Q19 43 18 38 Q18 36 18 34" stroke="#6d8764" strokeWidth="1.2" fill="none" />
            <path d="M24 46 Q24 42 24 38 Q24 36 24 32" stroke="#6d8764" strokeWidth="1.3" fill="none" />
            <path d="M27 46 Q29 43 30 38 Q30 36 30 34" stroke="#6d8764" strokeWidth="1.2" fill="none" />
            <path d="M30 46 Q32 44 33 40 Q34 38 34 36" stroke="#6d8764" strokeWidth="1.2" fill="none" />
            {/* mounded bushy form with narrow leaves */}
            <path d="M12 36 L9 34 L13 33 L14 31 L13 36Z" fill={color} />
            <path d="M14 34 L11 32 L15 31 L16 29 L15 34Z" fill={color} />
            <path d="M18 34 L15 32 L19 31 L20 29 L19 34Z" fill={color} />
            <path d="M22 32 L19 30 L23 29 L24 27 L23 32Z" fill={color} />
            <path d="M26 32 L29 30 L25 29 L24 27 L25 32Z" fill={color} />
            <path d="M30 34 L33 32 L29 31 L28 29 L29 34Z" fill={color} />
            <path d="M34 34 L37 32 L33 31 L32 29 L33 34Z" fill={color} />
            <path d="M36 36 L39 34 L35 33 L34 31 L35 36Z" fill={color} />
            {/* lighter highlights */}
            <path d="M16 32 Q18 30 20 32" fill={light} fillOpacity="0.8" />
            <path d="M24 30 Q26 28 28 30" fill={light} fillOpacity="0.8" />
            <path d="M32 32 Q34 30 36 33" fill={light} fillOpacity="0.8" />
            {/* darker base layer */}
            <path d="M14 38 Q18 36 22 38" fill={dark} fillOpacity="0.7" />
            <path d="M26 38 Q30 36 34 38" fill={dark} fillOpacity="0.7" />
          </g>
        )
        return (
          <g>
            {/* dense stems from ground */}
            <path d="M14 46 Q12 43 11 38 Q10 35 10 32" stroke="#6d8764" strokeWidth="1.3" fill="none" />
            <path d="M18 46 Q16 42 15 38 Q14 34 14 30" stroke="#6d8764" strokeWidth="1.4" fill="none" />
            <path d="M21 46 Q19 42 18 36 Q18 32 18 28" stroke="#6d8764" strokeWidth="1.4" fill="none" />
            <path d="M24 46 Q24 42 24 36 Q24 32 24 28" stroke="#6d8764" strokeWidth="1.5" fill="none" />
            <path d="M27 46 Q29 42 30 36 Q30 32 30 28" stroke="#6d8764" strokeWidth="1.4" fill="none" />
            <path d="M30 46 Q32 42 33 38 Q34 34 34 30" stroke="#6d8764" strokeWidth="1.4" fill="none" />
            <path d="M34 46 Q36 43 37 38 Q38 35 38 32" stroke="#6d8764" strokeWidth="1.3" fill="none" />
            {/* mounded bushy form - narrow sage leaves */}
            <path d="M8 32 L5 30 L9 29 L10 27 L9 32Z" fill={color} />
            <path d="M10 30 L7 28 L11 27 L12 25 L11 30Z" fill={color} />
            <path d="M14 30 L11 28 L15 27 L16 25 L15 30Z" fill={color} />
            <path d="M16 28 L13 26 L17 25 L18 23 L17 28Z" fill={color} />
            <path d="M20 28 L17 26 L21 25 L22 23 L21 28Z" fill={color} />
            <path d="M24 28 L21 26 L25 25 L26 23 L25 28Z" fill={color} />
            <path d="M26 28 L29 26 L25 25 L24 23 L25 28Z" fill={light} fillOpacity="0.85" />
            <path d="M28 28 L31 26 L27 25 L26 23 L27 28Z" fill={color} />
            <path d="M32 28 L35 26 L31 25 L30 23 L31 28Z" fill={color} />
            <path d="M34 30 L37 28 L33 27 L32 25 L33 30Z" fill={color} />
            <path d="M36 30 L39 28 L35 27 L34 25 L35 30Z" fill={color} />
            <path d="M38 32 L41 30 L37 29 L36 27 L37 32Z" fill={color} />
            <path d="M40 32 L43 30 L39 29 L38 27 L39 32Z" fill={color} />
            {/* top mound layer */}
            <path d="M12 26 L10 24 L14 23 L15 22 L13 26Z" fill={dark} />
            <path d="M18 24 L16 22 L20 21 L21 20 L19 24Z" fill={dark} />
            <path d="M24 24 L22 22 L26 21 L27 20 L25 24Z" fill={dark} />
            <path d="M30 24 L32 22 L28 21 L27 20 L29 24Z" fill={dark} />
            <path d="M34 26 L36 24 L32 23 L31 22 L33 26Z" fill={dark} />
            {/* lighter highlights on top */}
            <path d="M16 24 Q18 22 20 24" fill={light} fillOpacity="0.8" />
            <path d="M24 22 Q26 20 28 22" fill={light} fillOpacity="0.85" />
            <path d="M30 24 Q32 22 34 25" fill={light} fillOpacity="0.8" />
            {/* base fill */}
            <path d="M10 36 Q16 34 22 36" fill={dark} fillOpacity="0.6" />
            <path d="M26 36 Q32 34 38 36" fill={dark} fillOpacity="0.6" />
            {/* tiny flower spikes on top */}
            <path d="M18 22 L17 20 L18 21 L19 20 L18 22Z" fill="#b0bec5" />
            <path d="M24 20 L23 18 L24 19 L25 18 L24 20Z" fill="#b0bec5" />
            <path d="M30 22 L29 20 L30 21 L31 20 L30 22Z" fill="#b0bec5" />
          </g>
        )
      case 'juniper':
        if (s === 0) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="35" stroke={trunk} strokeWidth="1.5" />
            <path d="M24 35 Q21 33 22 31 Q23 33 24 32 Q25 33 26 31 Q27 33 24 35Z" fill={color} />
            <path d="M24 38 Q22 36 23 34 Q24 36 25 34 Q26 36 24 38Z" fill={dark} />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Twisted trunk */}
            <path d="M24 46 Q22 40 23 36 Q24 32 22 28" fill="none" stroke={trunk} strokeWidth="2" />
            <line x1="22" y1="32" x2="18" y2="29" stroke={trunk} strokeWidth="1.2" />
            <line x1="22" y1="30" x2="26" y2="27" stroke={trunk} strokeWidth="1.2" />
            {/* Scale-like foliage clusters */}
            <path d="M22 28 Q19 25 18 27 Q19 23 22 25 Q23 23 22 28Z" fill={color} />
            <path d="M18 29 Q15 26 14 28 Q15 24 18 26 Q19 24 18 29Z" fill={dark} />
            <path d="M26 27 Q29 24 28 26 Q29 22 26 24 Q25 22 26 27Z" fill={color} />
            <path d="M22 28 Q21 26 20 28 Q21 24 22 26" fill={light} />
            <path d="M18 29 Q16 27 15 30 Q16 26 18 28" fill={color} />
            <path d="M26 27 Q27 25 28 28 Q27 23 26 26" fill={dark} />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Twisted gnarled trunk */}
            <path d="M24 46 Q21 40 22 35 Q23 30 20 26 Q19 22 20 18" fill="none" stroke={trunk} strokeWidth="2.5" />
            <path d="M22 35 Q25 32 26 28 Q27 24 28 20" fill="none" stroke={trunk} strokeWidth="1.5" />
            <line x1="20" y1="26" x2="15" y2="23" stroke={trunk} strokeWidth="1.2" />
            <line x1="26" y1="28" x2="31" y2="25" stroke={trunk} strokeWidth="1.2" />
            <line x1="20" y1="22" x2="16" y2="18" stroke={trunk} strokeWidth="1" />
            <line x1="28" y1="20" x2="32" y2="17" stroke={trunk} strokeWidth="1" />
            {/* Dense scale foliage */}
            <path d="M20 18 Q17 14 16 17 Q17 12 20 15 Q21 13 20 18Z" fill={color} />
            <path d="M16 18 Q13 15 12 18 Q13 13 16 15 Q17 13 16 18Z" fill={dark} />
            <path d="M15 23 Q12 20 11 23 Q12 18 15 20 Q16 18 15 23Z" fill={color} />
            <path d="M28 20 Q31 17 30 19 Q31 15 28 17 Q27 15 28 20Z" fill={dark} />
            <path d="M31 25 Q34 22 33 24 Q34 20 31 22 Q30 20 31 25Z" fill={color} />
            <path d="M32 17 Q35 14 34 16 Q35 12 32 14 Q31 12 32 17Z" fill={color} />
            <path d="M20 26 Q18 24 17 26 Q18 22 20 24" fill={light} />
            <path d="M26 28 Q28 26 29 28 Q28 24 26 26" fill={dark} />
            <path d="M20 22 Q18 20 17 22 Q18 18 20 20" fill={color} />
            <path d="M22 16 Q20 13 19 15 Q20 11 22 14" fill={light} />
            <path d="M26 18 Q28 15 27 17 Q28 13 26 16" fill={color} />
            <path d="M24 20 Q22 17 21 20 Q22 15 24 18" fill={dark} />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-jun`} cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={dark} />
              </radialGradient>
            </defs>
            {/* Heavily twisted ancient trunk */}
            <path d="M25 46 Q21 42 20 37 Q19 32 17 28 Q16 24 17 20 Q18 16 18 13" fill="none" stroke={trunk} strokeWidth="3" />
            <path d="M23 46 Q25 40 26 35 Q27 30 29 26 Q30 22 30 18" fill="none" stroke={trunk} strokeWidth="2" />
            <path d="M20 37 Q18 35 16 33" fill="none" stroke={trunk} strokeWidth="1.5" />
            <line x1="17" y1="28" x2="12" y2="25" stroke={trunk} strokeWidth="1.5" />
            <line x1="29" y1="26" x2="34" y2="22" stroke={trunk} strokeWidth="1.5" />
            <line x1="18" y1="20" x2="13" y2="16" stroke={trunk} strokeWidth="1.2" />
            <line x1="30" y1="18" x2="35" y2="14" stroke={trunk} strokeWidth="1.2" />
            <line x1="18" y1="16" x2="14" y2="12" stroke={trunk} strokeWidth="1" />
            <line x1="18" y1="13" x2="22" y2="10" stroke={trunk} strokeWidth="1" />
            <line x1="12" y1="25" x2="9" y2="22" stroke={trunk} strokeWidth="0.8" />
            <line x1="16" y1="33" x2="12" y2="31" stroke={trunk} strokeWidth="1" />
            {/* Dense connected foliage canopy */}
            <g transform="translate(24,22) scale(1.18) translate(-24,-22)">
            {/* Base canopy blobs — large overlapping masses */}
            <ellipse cx="17" cy="16" rx="7" ry="5" fill={dark} />
            <ellipse cx="14" cy="24" rx="6" ry="5" fill={dark} />
            <ellipse cx="31" cy="18" rx="6" ry="5" fill={dark} />
            <ellipse cx="13" cy="30" rx="5" ry="3.5" fill={dark} />
            <ellipse cx="30" cy="24" rx="5" ry="4" fill={dark} />
            {/* Mid layer — color fill */}
            <ellipse cx="18" cy="14" rx="6" ry="4.5" fill={color} />
            <ellipse cx="13" cy="22" rx="5.5" ry="4" fill={color} />
            <ellipse cx="32" cy="17" rx="5" ry="4" fill={color} />
            <ellipse cx="24" cy="12" rx="4" ry="3.5" fill={color} />
            <ellipse cx="14" cy="29" rx="4" ry="3" fill={color} />
            <ellipse cx="29" cy="23" rx="4.5" ry="3.5" fill={color} />
            {/* Top highlights */}
            <ellipse cx="17" cy="13" rx="4" ry="3" fill={light} opacity="0.6" />
            <ellipse cx="12" cy="21" rx="3.5" ry="2.5" fill={light} opacity="0.5" />
            <ellipse cx="31" cy="15" rx="3.5" ry="2.5" fill={light} opacity="0.5" />
            <ellipse cx="24" cy="11" rx="2.5" ry="2" fill={light} opacity="0.4" />
            {/* Scale texture — small overlapping marks */}
            <path d="M15 14 Q14 12 16 12 Q17 12 15 14Z" fill={dark} opacity="0.4" />
            <path d="M20 13 Q19 11 21 11 Q22 11 20 13Z" fill={dark} opacity="0.35" />
            <path d="M11 23 Q10 21 12 21 Q13 21 11 23Z" fill={dark} opacity="0.4" />
            <path d="M33 18 Q32 16 34 16 Q35 16 33 18Z" fill={dark} opacity="0.35" />
            <path d="M28 22 Q27 20 29 20 Q30 20 28 22Z" fill={dark} opacity="0.3" />
            </g>
            {/* Small blue-toned berries on branches */}
            <circle cx="10" cy="14" r="1" fill="#546e7a" />
            <circle cx="33" cy="20" r="1" fill="#546e7a" />
            <circle cx="15" cy="28" r="1" fill="#546e7a" />
          </g>
        )

      case 'cedarwood':
        if (s === 0) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="35" stroke={trunk} strokeWidth="1.5" />
            <path d="M24 35 Q21 33 19 35 Q21 31 24 33" fill={color} />
            <path d="M24 35 Q27 33 29 35 Q27 31 24 33" fill={dark} />
          </g>
        )
        if (s === 1) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="26" stroke={trunk} strokeWidth="2.2" />
            {/* Horizontal branch layers */}
            <line x1="24" y1="34" x2="16" y2="33" stroke={trunk} strokeWidth="1.2" />
            <line x1="24" y1="34" x2="32" y2="33" stroke={trunk} strokeWidth="1.2" />
            <line x1="24" y1="28" x2="18" y2="27" stroke={trunk} strokeWidth="1" />
            <line x1="24" y1="28" x2="30" y2="27" stroke={trunk} strokeWidth="1" />
            {/* Flat foliage platforms */}
            <path d="M14 33 Q15 30 18 31 Q20 30 22 31 Q24 30 26 31 Q28 30 30 31 Q32 30 34 33 Q30 32 26 32 Q22 32 18 32Z" fill={color} />
            <path d="M16 33 Q18 31 20 32 Q22 31 24 32 Q26 31 28 32 Q30 31 32 33 Q28 33 24 33 Q20 33 16 33Z" fill={dark} />
            <path d="M16 27 Q18 24 20 25 Q22 24 24 25 Q26 24 28 25 Q30 24 32 27 Q28 26 24 26 Q20 26 16 27Z" fill={color} />
            <path d="M18 27 Q20 25 22 26 Q24 25 26 26 Q28 25 30 27 Q26 27 22 27Z" fill={light} />
          </g>
        )
        if (s === 2) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="18" stroke={trunk} strokeWidth="2.8" />
            {/* Four horizontal branch layers */}
            <line x1="24" y1="38" x2="12" y2="37" stroke={trunk} strokeWidth="1.5" />
            <line x1="24" y1="38" x2="36" y2="37" stroke={trunk} strokeWidth="1.5" />
            <line x1="24" y1="32" x2="14" y2="31" stroke={trunk} strokeWidth="1.3" />
            <line x1="24" y1="32" x2="34" y2="31" stroke={trunk} strokeWidth="1.3" />
            <line x1="24" y1="26" x2="16" y2="25" stroke={trunk} strokeWidth="1.2" />
            <line x1="24" y1="26" x2="32" y2="25" stroke={trunk} strokeWidth="1.2" />
            <line x1="24" y1="20" x2="19" y2="19" stroke={trunk} strokeWidth="1" />
            <line x1="24" y1="20" x2="29" y2="19" stroke={trunk} strokeWidth="1" />
            {/* Layer 1 — widest */}
            <path d="M10 37 Q12 34 16 35 Q20 34 24 35 Q28 34 32 35 Q36 34 38 37 Q34 36 28 36 Q20 36 14 36Z" fill={color} />
            <path d="M12 37 Q16 35 20 36 Q24 35 28 36 Q32 35 36 37 Q30 37 24 37 Q18 37 12 37Z" fill={dark} />
            {/* Layer 2 */}
            <path d="M12 31 Q14 28 18 29 Q22 28 26 29 Q30 28 32 29 Q36 28 36 31 Q32 30 28 30 Q20 30 14 30Z" fill={color} />
            <path d="M14 31 Q18 29 22 30 Q26 29 30 30 Q34 29 34 31 Q28 31 22 31Z" fill={light} />
            {/* Layer 3 */}
            <path d="M14 25 Q16 22 20 23 Q24 22 28 23 Q32 22 34 25 Q30 24 24 24 Q18 24 14 25Z" fill={color} />
            <path d="M16 25 Q20 23 24 24 Q28 23 32 25 Q26 25 20 25Z" fill={dark} />
            {/* Layer 4 — top */}
            <path d="M18 19 Q20 16 22 17 Q24 16 26 17 Q28 16 30 19 Q26 18 22 18Z" fill={color} />
            <path d="M19 19 Q22 17 24 18 Q26 17 29 19 Q25 19 21 19Z" fill={light} />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-ced`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={dark} />
                <stop offset="50%" stopColor={color} />
                <stop offset="100%" stopColor={dark} />
              </linearGradient>
            </defs>
            {/* Thick trunk */}
            <rect x="22" y="30" width="4" height="16" fill={trunk} rx="1" />
            <line x1="24" y1="46" x2="24" y2="12" stroke={trunk} strokeWidth="3.5" />
            {/* Five horizontal branch layers — classic cedar */}
            <line x1="24" y1="40" x2="8" y2="39" stroke={trunk} strokeWidth="1.8" />
            <line x1="24" y1="40" x2="40" y2="39" stroke={trunk} strokeWidth="1.8" />
            <line x1="24" y1="34" x2="10" y2="33" stroke={trunk} strokeWidth="1.5" />
            <line x1="24" y1="34" x2="38" y2="33" stroke={trunk} strokeWidth="1.5" />
            <line x1="24" y1="28" x2="12" y2="27" stroke={trunk} strokeWidth="1.3" />
            <line x1="24" y1="28" x2="36" y2="27" stroke={trunk} strokeWidth="1.3" />
            <line x1="24" y1="22" x2="15" y2="21" stroke={trunk} strokeWidth="1.2" />
            <line x1="24" y1="22" x2="33" y2="21" stroke={trunk} strokeWidth="1.2" />
            <line x1="24" y1="16" x2="18" y2="15" stroke={trunk} strokeWidth="1" />
            <line x1="24" y1="16" x2="30" y2="15" stroke={trunk} strokeWidth="1" />
            {/* Layer 1 — widest bottom */}
            <path d="M6 39 Q8 36 14 37 Q20 36 24 37 Q28 36 34 37 Q40 36 42 39 Q36 38 28 38 Q20 38 12 38Z" fill={`url(#${uid}-ced)`} />
            <path d="M8 39 Q14 37 20 38 Q24 37 28 38 Q34 37 40 39 Q32 39 24 39 Q16 39 8 39Z" fill={dark} />
            {/* Layer 2 */}
            <path d="M8 33 Q10 30 16 31 Q22 30 24 31 Q26 30 32 31 Q38 30 40 33 Q34 32 28 32 Q18 32 10 32Z" fill={color} />
            <path d="M10 33 Q16 31 22 32 Q26 31 32 32 Q38 31 38 33 Q30 33 22 33Z" fill={dark} />
            {/* Layer 3 */}
            <path d="M10 27 Q12 24 18 25 Q22 24 24 25 Q26 24 30 25 Q36 24 38 27 Q32 26 24 26 Q16 26 10 27Z" fill={`url(#${uid}-ced)`} />
            <path d="M12 27 Q18 25 24 26 Q30 25 36 27 Q28 27 18 27Z" fill={light} />
            {/* Layer 4 */}
            <path d="M14 21 Q16 18 20 19 Q24 18 28 19 Q32 18 34 21 Q30 20 24 20 Q18 20 14 21Z" fill={color} />
            <path d="M15 21 Q20 19 24 20 Q28 19 33 21 Q26 21 18 21Z" fill={dark} />
            {/* Layer 5 — top */}
            <path d="M17 15 Q18 12 21 13 Q24 12 27 13 Q30 12 31 15 Q27 14 24 14 Q21 14 17 15Z" fill={color} />
            <path d="M18 15 Q22 13 24 14 Q26 13 30 15 Q25 15 19 15Z" fill={light} />
            {/* Crown tip */}
            <path d="M22 12 Q23 9 24 8 Q25 9 26 12 Q25 10 24 10 Q23 10 22 12Z" fill={color} />
          </g>
        )

      case 'lotus':
        if (s === 0) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="36" stroke={trunk} strokeWidth="1.2" />
            <path d="M24 36 Q22 34 20 36 Q22 33 24 36Z" fill={color} />
            <path d="M24 36 Q26 34 28 36 Q26 33 24 36Z" fill={color} />
            <ellipse cx="24" cy="46" rx="6" ry="1.5" fill="#5d8a5e" opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            <ellipse cx="24" cy="44" rx="10" ry="2.5" fill="#3e7d44" opacity="0.7" />
            <line x1="24" y1="44" x2="24" y2="36" stroke={trunk} strokeWidth="1.5" />
            <path d="M24 36 Q20 32 17 36 Q20 30 24 36Z" fill={color} />
            <path d="M24 36 Q28 32 31 36 Q28 30 24 36Z" fill={color} />
            <path d="M24 36 Q24 30 24 28 Q26 32 24 36Z" fill={light} />
            <path d="M14 46 Q18 44 24 44 Q30 44 34 46Z" fill="#4a90a0" opacity="0.3" />
            <line x1="16" y1="45.5" x2="32" y2="45.5" stroke="#6ab0c0" strokeWidth="0.3" opacity="0.5" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M10 46 Q14 43 24 43 Q34 43 38 46Z" fill="#4a90a0" opacity="0.35" />
            <ellipse cx="24" cy="43.5" rx="12" ry="3" fill="#3e7d44" opacity="0.75" />
            <line x1="24" y1="43" x2="24" y2="33" stroke={trunk} strokeWidth="1.8" />
            <path d="M24 33 Q18 28 14 33 Q18 26 24 33Z" fill={color} />
            <path d="M24 33 Q30 28 34 33 Q30 26 24 33Z" fill={color} />
            <path d="M24 33 Q21 26 19 30 Q21 24 24 33Z" fill={dark} />
            <path d="M24 33 Q27 26 29 30 Q27 24 24 33Z" fill={dark} />
            <path d="M24 33 Q24 26 24 23 Q26 28 24 33Z" fill={light} />
            <path d="M24 33 Q22 24 24 22 Q26 24 24 33Z" fill={light} opacity="0.8" />
            <line x1="12" y1="45" x2="36" y2="45" stroke="#6ab0c0" strokeWidth="0.4" opacity="0.4" />
            <line x1="14" y1="45.8" x2="34" y2="45.8" stroke="#6ab0c0" strokeWidth="0.3" opacity="0.3" />
          </g>
        )
        return (
          <g>
            <defs>
              <filter id={`${uid}-glow`}>
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path d="M6 46 Q12 42 24 42 Q36 42 42 46Z" fill="#3a7ea8" opacity="0.4" />
            <path d="M8 46 Q14 43.5 24 43.5 Q34 43.5 40 46Z" fill="#4a90b8" opacity="0.3" />
            <line x1="10" y1="45" x2="38" y2="45" stroke="#7ac0d8" strokeWidth="0.5" opacity="0.4">
              <animate attributeName="x1" values="10;12;10" dur="3s" repeatCount="indefinite" />
              <animate attributeName="x2" values="38;36;38" dur="3s" repeatCount="indefinite" />
            </line>
            <line x1="12" y1="45.7" x2="36" y2="45.7" stroke="#7ac0d8" strokeWidth="0.4" opacity="0.3">
              <animate attributeName="x1" values="12;10;12" dur="4s" repeatCount="indefinite" />
              <animate attributeName="x2" values="36;38;36" dur="4s" repeatCount="indefinite" />
            </line>
            <ellipse cx="24" cy="43" rx="13" ry="3.5" fill="#2e6b3a" opacity="0.8" />
            <path d="M11 43 Q15 42 18 43 Q14 41 11 43Z" fill="#3a7d46" opacity="0.7" />
            <path d="M30 43 Q33 42 37 43 Q34 41 30 43Z" fill="#3a7d46" opacity="0.7" />
            <line x1="24" y1="42.5" x2="24" y2="30" stroke={trunk} strokeWidth="2" />
            <path d="M24 30 Q16 24 11 30 Q16 20 24 30Z" fill={color} filter={`url(#${uid}-glow)`}>
              <animate attributeName="d" values="M24 30 Q16 24 11 30 Q16 20 24 30Z;M24 30 Q15 23 10 30 Q15 19 24 30Z;M24 30 Q16 24 11 30 Q16 20 24 30Z" dur="5s" repeatCount="indefinite" />
            </path>
            <path d="M24 30 Q32 24 37 30 Q32 20 24 30Z" fill={color} filter={`url(#${uid}-glow)`}>
              <animate attributeName="d" values="M24 30 Q32 24 37 30 Q32 20 24 30Z;M24 30 Q33 23 38 30 Q33 19 24 30Z;M24 30 Q32 24 37 30 Q32 20 24 30Z" dur="5s" repeatCount="indefinite" />
            </path>
            <path d="M24 30 Q19 22 16 26 Q19 18 24 30Z" fill={dark} />
            <path d="M24 30 Q29 22 32 26 Q29 18 24 30Z" fill={dark} />
            <path d="M24 30 Q21 20 18 22 Q21 16 24 30Z" fill={light} opacity="0.8" />
            <path d="M24 30 Q27 20 30 22 Q27 16 24 30Z" fill={light} opacity="0.8" />
            <path d="M24 30 Q24 22 24 18 Q26 24 24 30Z" fill={light} filter={`url(#${uid}-glow)`}>
              <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
            </path>
            <path d="M24 30 Q22 18 24 15 Q26 18 24 30Z" fill="#fff" opacity="0.3">
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite" />
            </path>
            <circle cx="24" cy="28" r="1.2" fill="#ffd54f" opacity="0.9">
              <animate attributeName="r" values="1.2;1.5;1.2" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        )

      case 'agave':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q22 44 21 46 Q22 42 24 44Z" fill={color} />
            <path d="M24 46 Q26 44 27 46 Q26 42 24 44Z" fill={dark} />
            <path d="M24 44 Q24 40 24 37 L24.5 38 Q24 41 24 44Z" fill={color} />
            <path d="M24 37 Q23.5 36 24 35 Q24.5 36 24 37Z" fill={light} />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q19 43 16 46 Q19 40 24 44Z" fill={color} />
            <path d="M24 46 Q29 43 32 46 Q29 40 24 44Z" fill={dark} />
            <path d="M24 44 Q23 42 22 44 Q23 40 24 44Z" fill={light} />
            <path d="M24 44 Q25 42 26 44 Q25 40 24 44Z" fill={light} />
            <path d="M24 44 Q24 38 24 32 L24.5 34 Q24 39 24 44Z" fill="#5a8040" strokeWidth="0" />
            <path d="M24 32 Q23.5 30 24 29 Q24.5 30 24 32Z" fill={light} />
            <path d="M24 36 Q22 34 20 36 Q22 33 24 36Z" fill={color} opacity="0.8" />
            <path d="M24 36 Q26 34 28 36 Q26 33 24 36Z" fill={color} opacity="0.8" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 Q17 42 12 46 Q17 38 24 42Z" fill={color} />
            <path d="M24 46 Q31 42 36 46 Q31 38 24 42Z" fill={dark} />
            <path d="M24 42 Q21 40 18 43 Q21 38 24 42Z" fill={light} />
            <path d="M24 42 Q27 40 30 43 Q27 38 24 42Z" fill={light} />
            <path d="M24 42 Q23 40 22 42 Q23 39 24 42Z" fill={color} />
            <path d="M24 42 Q25 40 26 42 Q25 39 24 42Z" fill={color} />
            <line x1="24" y1="42" x2="24" y2="18" stroke="#5a8040" strokeWidth="1.8" />
            <path d="M24 26 Q22 24 20 26 Q22 23 24 26Z" fill={color} opacity="0.8" />
            <path d="M24 26 Q26 24 28 26 Q26 23 24 26Z" fill={color} opacity="0.8" />
            <path d="M24 22 Q22 20 21 22 Q22 19 24 22Z" fill={color} opacity="0.8" />
            <path d="M24 22 Q26 20 27 22 Q26 19 24 22Z" fill={color} opacity="0.8" />
            <path d="M24 18 Q23 16 24 15 Q25 16 24 18Z" fill="#f0e68c" />
            <path d="M23 18 Q22 16 23 15 Q23.5 17 23 18Z" fill="#f0e68c" />
            <path d="M25 18 Q26 16 25 15 Q24.5 17 25 18Z" fill="#f0e68c" />
          </g>
        )
        return (
          <g>
            <defs>
              <filter id={`${uid}-glow`}>
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path d="M24 46 Q14 40 8 46 Q14 35 24 40Z" fill={color} />
            <path d="M24 46 Q34 40 40 46 Q34 35 24 40Z" fill={dark} />
            <path d="M24 42 Q18 38 14 43 Q18 35 24 40Z" fill={light} />
            <path d="M24 42 Q30 38 34 43 Q30 35 24 40Z" fill={light} />
            <path d="M24 42 Q21 39 18 42 Q21 37 24 42Z" fill={color} opacity="0.9" />
            <path d="M24 42 Q27 39 30 42 Q27 37 24 42Z" fill={color} opacity="0.9" />
            <path d="M24 40 Q23 38 22 40 Q23 37 24 40Z" fill={dark} />
            <path d="M24 40 Q25 38 26 40 Q25 37 24 40Z" fill={dark} />
            <line x1="24" y1="40" x2="24" y2="10" stroke="#5a8040" strokeWidth="2.2" />
            <path d="M24 30 Q21 27 18 30 Q21 25 24 30Z" fill={color} opacity="0.8" />
            <path d="M24 30 Q27 27 30 30 Q27 25 24 30Z" fill={color} opacity="0.8" />
            <path d="M24 24 Q21 21 19 24 Q21 19 24 24Z" fill={color} opacity="0.8" />
            <path d="M24 24 Q27 21 29 24 Q27 19 24 24Z" fill={color} opacity="0.8" />
            <path d="M24 18 Q22 16 20 18 Q22 14 24 18Z" fill={color} opacity="0.8" />
            <path d="M24 18 Q26 16 28 18 Q26 14 24 18Z" fill={color} opacity="0.8" />
            <path d="M24 14 Q22 12 21 14 Q22 11 24 14Z" fill="#f0e68c" filter={`url(#${uid}-glow)`}>
              <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
            </path>
            <path d="M24 14 Q26 12 27 14 Q26 11 24 14Z" fill="#f0e68c" filter={`url(#${uid}-glow)`}>
              <animate attributeName="opacity" values="0.8;1;0.8" dur="3.5s" repeatCount="indefinite" />
            </path>
            <path d="M24 12 Q23 10 24 9 Q25 10 24 12Z" fill="#ffd54f" filter={`url(#${uid}-glow)`}>
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            </path>
            <path d="M22 13 Q21 11 22 10 Q23 12 22 13Z" fill="#f0e68c" opacity="0.8" />
            <path d="M26 13 Q27 11 26 10 Q25 12 26 13Z" fill="#f0e68c" opacity="0.8" />
            <path d="M23 11 Q22.5 9.5 23 9 Q23.5 10 23 11Z" fill="#ffd54f" opacity="0.8" />
            <path d="M25 11 Q25.5 9.5 25 9 Q24.5 10 25 11Z" fill="#ffd54f" opacity="0.8" />
          </g>
        )

      case 'lychee':
        if (s === 0) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="37" stroke={trunk} strokeWidth="1.2" />
            <path d="M24 37 Q22 35 20 37 Q22 33 24 37Z" fill="#5a8a4e" />
            <path d="M24 37 Q26 35 28 37 Q26 33 24 37Z" fill="#4a7a3e" />
          </g>
        )
        if (s === 1) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="30" stroke={trunk} strokeWidth="1.8" />
            <path d="M24 30 Q20 28 17 31 Q20 25 24 30Z" fill="#5a8a4e" />
            <path d="M24 30 Q28 28 31 31 Q28 25 24 30Z" fill="#4a7a3e" />
            <path d="M24 34 Q19 32 16 35 Q19 29 24 34Z" fill="#5a8a4e" />
            <path d="M24 34 Q29 32 32 35 Q29 29 24 34Z" fill="#4a7a3e" />
            <path d="M24 38 Q19 36 16 39 Q19 33 24 38Z" fill="#4a7a3e" />
            <path d="M24 38 Q29 36 32 39 Q29 33 24 38Z" fill="#5a8a4e" />
            <path d="M24 30 Q24 28 24 26 Q25 29 24 30Z" fill="#4a7a3e" />
            <path d="M22 32 Q21.5 31 22 30.5 Q22.5 31 22 32Z" fill={color} />
            <path d="M27 31 Q26.5 30 27 29.5 Q27.5 30 27 31Z" fill={color} />
          </g>
        )
        if (s === 2) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="22" stroke={trunk} strokeWidth="2.2" />
            <path d="M24 26 Q20 22 14 26" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M24 26 Q28 22 34 26" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M24 22 Q20 19 16 23 Q19 16 24 22Z" fill="#5a8a4e" />
            <path d="M24 22 Q28 19 32 23 Q29 16 24 22Z" fill="#4a7a3e" />
            <path d="M24 28 Q18 26 14 30 Q17 22 24 28Z" fill="#5a8a4e" />
            <path d="M24 28 Q30 26 34 30 Q31 22 24 28Z" fill="#4a7a3e" />
            <path d="M24 34 Q17 32 13 36 Q16 28 24 34Z" fill="#4a7a3e" />
            <path d="M24 34 Q31 32 35 36 Q32 28 24 34Z" fill="#5a8a4e" />
            <path d="M24 40 Q18 38 14 42 Q17 35 24 40Z" fill="#5a8a4e" />
            <path d="M24 40 Q30 38 34 42 Q31 35 24 40Z" fill="#4a7a3e" />
            {/* Lychee fruit clusters on branches */}
            <path d="M15 26 Q14 24.5 15 24 Q16 24.5 15 26Z" fill={color} />
            <path d="M17 25 Q16 23.5 17 23 Q18 23.5 17 25Z" fill={color} />
            <path d="M16 24 Q15 22.5 16 22 Q17 22.5 16 24Z" fill={dark} />
            <path d="M33 26 Q32 24.5 33 24 Q34 24.5 33 26Z" fill={color} />
            <path d="M31 25 Q30 23.5 31 23 Q32 23.5 31 25Z" fill={color} />
            <path d="M32 24 Q31 22.5 32 22 Q33 22.5 32 24Z" fill={dark} />
          </g>
        )
        return (
          <g>
            <defs>
              <filter id={`${uid}-glow`}>
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <style>{`
                @keyframes shimmer-${uid} {
                  0%, 100% { opacity: 0.7; }
                  50% { opacity: 1; }
                }
                @keyframes drip-${uid} {
                  0%, 100% { opacity: 0; transform: translateY(0); }
                  10% { opacity: 0.8; }
                  90% { opacity: 0.2; }
                  100% { transform: translateY(4px); }
                }
              `}</style>
            </defs>
            <line x1="24" y1="46" x2="24" y2="16" stroke={trunk} strokeWidth="2.8" />
            <path d="M24 20 Q16 16 10 20" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M24 20 Q32 16 38 20" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M24 28 Q17 24 12 28" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M24 28 Q31 24 36 28" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M24 34 Q18 31 14 34" stroke={trunk} strokeWidth="1" fill="none" />
            <path d="M24 34 Q30 31 34 34" stroke={trunk} strokeWidth="1" fill="none" />
            {/* Foliage */}
            <path d="M24 16 Q18 13 14 17 Q18 10 24 16Z" fill="#5a8a4e" />
            <path d="M24 16 Q30 13 34 17 Q30 10 24 16Z" fill="#4a7a3e" />
            <path d="M24 22 Q16 19 11 24 Q15 15 24 22Z" fill="#5a8a4e" />
            <path d="M24 22 Q32 19 37 24 Q33 15 24 22Z" fill="#4a7a3e" />
            <path d="M24 30 Q16 27 10 32 Q14 23 24 30Z" fill="#4a7a3e" />
            <path d="M24 30 Q32 27 38 32 Q34 23 24 30Z" fill="#5a8a4e" />
            <path d="M24 36 Q17 33 12 38 Q15 30 24 36Z" fill="#5a8a4e" />
            <path d="M24 36 Q31 33 36 38 Q33 30 24 36Z" fill="#4a7a3e" />
            <path d="M24 42 Q18 39 14 44 Q17 36 24 42Z" fill="#4a7a3e" />
            <path d="M24 42 Q30 39 34 44 Q31 36 24 42Z" fill="#5a8a4e" />
            {/* Lychee fruit clusters - left branch */}
            <g style={{animation: `shimmer-${uid} 3s ease-in-out infinite`}}>
              <path d="M11 20 Q10 18 11 17.5 Q12 18 11 20Z" fill={color} filter={`url(#${uid}-glow)`} />
              <path d="M13 19 Q12 17 13 16.5 Q14 17 13 19Z" fill={color} filter={`url(#${uid}-glow)`} />
              <path d="M12 18 Q11 16 12 15.5 Q13 16 12 18Z" fill={dark} filter={`url(#${uid}-glow)`} />
              <path d="M10 19 Q9 17.5 10 17 Q11 17.5 10 19Z" fill={dark} />
            </g>
            {/* Right branch cluster */}
            <g style={{animation: `shimmer-${uid} 3.5s ease-in-out 0.5s infinite`}}>
              <path d="M37 20 Q36 18 37 17.5 Q38 18 37 20Z" fill={color} filter={`url(#${uid}-glow)`} />
              <path d="M35 19 Q34 17 35 16.5 Q36 17 35 19Z" fill={color} filter={`url(#${uid}-glow)`} />
              <path d="M36 18 Q35 16 36 15.5 Q37 16 36 18Z" fill={dark} filter={`url(#${uid}-glow)`} />
              <path d="M38 19 Q37 17.5 38 17 Q39 17.5 38 19Z" fill={dark} />
            </g>
            {/* Mid-left cluster */}
            <g style={{animation: `shimmer-${uid} 2.8s ease-in-out 1s infinite`}}>
              <path d="M13 28 Q12 26 13 25.5 Q14 26 13 28Z" fill={color} filter={`url(#${uid}-glow)`} />
              <path d="M15 27 Q14 25 15 24.5 Q16 25 15 27Z" fill={color} filter={`url(#${uid}-glow)`} />
              <path d="M14 26 Q13 24 14 23.5 Q15 24 14 26Z" fill={dark} filter={`url(#${uid}-glow)`} />
            </g>
            {/* Mid-right cluster */}
            <g style={{animation: `shimmer-${uid} 3.2s ease-in-out 1.5s infinite`}}>
              <path d="M35 28 Q34 26 35 25.5 Q36 26 35 28Z" fill={color} filter={`url(#${uid}-glow)`} />
              <path d="M33 27 Q32 25 33 24.5 Q34 25 33 27Z" fill={color} filter={`url(#${uid}-glow)`} />
              <path d="M34 26 Q33 24 34 23.5 Q35 24 34 26Z" fill={dark} filter={`url(#${uid}-glow)`} />
            </g>
            {/* Lower clusters */}
            <g style={{animation: `shimmer-${uid} 4s ease-in-out 0.8s infinite`}}>
              <path d="M15 34 Q14 32 15 31.5 Q16 32 15 34Z" fill={color} />
              <path d="M17 33 Q16 31 17 30.5 Q18 31 17 33Z" fill={dark} />
            </g>
            <g style={{animation: `shimmer-${uid} 3.8s ease-in-out 1.2s infinite`}}>
              <path d="M33 34 Q32 32 33 31.5 Q34 32 33 34Z" fill={color} />
              <path d="M31 33 Q30 31 31 30.5 Q32 31 31 33Z" fill={dark} />
            </g>
            {/* Sap drip particles */}
            <circle cx="12" cy="21" r="0.3" fill={light} style={{animation: `drip-${uid} 5s ease-in 0s infinite`}} />
            <circle cx="36" cy="21" r="0.3" fill={light} style={{animation: `drip-${uid} 6s ease-in 2s infinite`}} />
            <circle cx="14" cy="29" r="0.3" fill={light} style={{animation: `drip-${uid} 4.5s ease-in 1s infinite`}} />
            <circle cx="34" cy="29" r="0.3" fill={light} style={{animation: `drip-${uid} 5.5s ease-in 3s infinite`}} />
          </g>
        )

      default:
        return (
          <g>
            <path d="M22 46 Q21 38 21 32 L27 32 Q27 38 26 46 Z" fill={trunk} />
            <ellipse cx="24" cy="20" rx="14" ry="12" fill={color} />
            <ellipse cx="20" cy="16" rx="8" ry="6" fill={light} opacity="0.3" />
          </g>
        )
    }
  }

  function renderGroundInner() {
    const r = 10 + s * 4
    switch (shape) {
      case 'void':
        return (
          <g>
            <circle cx="38" cy="8" r="4" fill="#2a2a3e" opacity="0.3" />
            <circle cx="37" cy="7" r="1.5" fill="#1a1a2e" opacity="0.4" />
            <ellipse cx="24" cy="46" rx={r} ry="2.5" fill="#1a1a2e" opacity="0.3" />
            <path d={`M${24 - r} 46 Q24 ${44 - s} ${24 + r} 46`} fill="#12121a" opacity="0.15" />
          </g>
        )
      case 'dead':
        return (
          <g>
            <ellipse cx="24" cy="46" rx={r} ry="2" fill="#4a4a4a" opacity="0.12" />
            <path d={`M${24 - r} 46 Q24 ${45 - s * 0.3} ${24 + r} 46`} fill="#3a3a3a" opacity="0.08" />
          </g>
        )
      case 'mangrove':
        return (
          <g>
            <ellipse cx="24" cy="46" rx={r + 2} ry="3" fill="#2a5a4a" opacity="0.15" />
            <path d={`M${24 - r} 46 Q24 ${43 - s} ${24 + r} 46`} fill="#3a7a5a" opacity="0.1" />
            {s >= 2 && <>
              <ellipse cx={24 - r + 4} cy="45.5" rx="1.5" ry="0.5" fill="#4a8a6a" opacity="0.12" />
              <ellipse cx={24 + r - 4} cy="45.5" rx="1.2" ry="0.4" fill="#4a8a6a" opacity="0.1" />
            </>}
          </g>
        )
      case 'winterveil':
        return (
          <g>
            <ellipse cx="24" cy="46" rx={r + 1} ry="2.5" fill="#8aacca" opacity="0.1" />
            <path d={`M${24 - r} 46 Q24 ${44 - s * 0.5} ${24 + r} 46`} fill="#c0daea" opacity="0.08" />
            {s >= 1 && <>
              <circle cx={24 - r + 3} cy="45.5" r="0.5" fill="#d0e4f0" opacity="0.12" />
              <circle cx={24 + r - 3} cy="45.5" r="0.4" fill="#d0e4f0" opacity="0.1" />
            </>}
          </g>
        )
      default:
        return (
          <g>
            <ellipse cx="24" cy="46" rx={r} ry="3" fill="#3a5a2a" opacity="0.2" />
            <path d={`M${24 - r} 46 Q24 ${43 - s} ${24 + r} 46`} fill="#4a6a3a" opacity="0.15" />
            {s >= 2 && <>
              <path d={`M${24 - r + 2} 46 Q${24 - r + 4} 44 ${24 - r + 6} 46`} fill="#5a7a4a" opacity="0.2" />
              <path d={`M${24 + r - 6} 46 Q${24 + r - 4} 44 ${24 + r - 2} 46`} fill="#5a7a4a" opacity="0.18" />
            </>}
            {s >= 1 && <>
              <circle cx={24 - r + 3} cy="45.5" r="0.6" fill="#6a8a5a" opacity="0.2" />
              <circle cx={24 + r - 3} cy="45.5" r="0.5" fill="#6a8a5a" opacity="0.15" />
            </>}
          </g>
        )
    }
  }

  const mainFilter = s >= 2 ? `url(#${uid}-3d)` : `url(#${uid}-edge)`
  const edgeFilter = `url(#${uid}-edge)`

  return (
    <div style={containerStyle}>
      <svg width="100%" height="100%" viewBox="0 6 48 42" preserveAspectRatio="xMidYMax meet" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={`${uid}-edge`} x="-5%" y="-5%" width="110%" height="110%">
            <feMorphology operator="dilate" radius="0.1" in="SourceAlpha" result="expanded"/>
            <feFlood floodColor="#1a1a1a" floodOpacity="0.18" result="color"/>
            <feComposite in="color" in2="expanded" operator="in" result="outline"/>
            <feMerge>
              <feMergeNode in="outline"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          {s >= 2 &&
            <filter id={`${uid}-3d`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="shadow"/>
              <feOffset dx="0.8" dy="1.2" in="shadow" result="offsetShadow"/>
              <feFlood floodColor="#000" floodOpacity="0.06" result="shadowColor"/>
              <feComposite in="shadowColor" in2="offsetShadow" operator="in" result="compositeShadow"/>
              <feMerge>
                <feMergeNode in="compositeShadow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          }
        </defs>
        {!hideGround && groundElement}
        {dirtEllipse}
        <g style={swayStyle} filter={mainFilter}>
          <g filter={edgeFilter}>
            {shapeElement}
          </g>
        </g>
      </svg>
    </div>
  )
}, (prev, next) =>
  prev.type === next.type &&
  prev.size === next.size &&
  prev.stage === next.stage &&
  prev.isSeed === next.isSeed &&
  prev.hideGround === next.hideGround &&
  prev.dirtSeed === next.dirtSeed &&
  prev.dirtDark === next.dirtDark &&
  prev.dirtDepth === next.dirtDepth &&
  prev.dirtTilt === next.dirtTilt &&
  prev.disableSway === next.disableSway
)
