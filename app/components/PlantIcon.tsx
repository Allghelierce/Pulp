"use client"
import { memo } from "react"
import { TREE_TYPES } from "@/app/constants"

function darken(hex: string, amount: number) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount)
  return `rgb(${r},${g},${b})`
}

function lighten(hex: string, amount: number) {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount)
  return `rgb(${r},${g},${b})`
}

export const PlantIcon = memo(function PlantIcon({ type, size = 40, stage = 0, isSeed = false, hideGround = false, dirtSeed = 0, dirtDark = false, dirtDepth = 0.5, dirtTilt }: { type: string, size?: number, stage?: number, isSeed?: boolean, hideGround?: boolean, dirtSeed?: number, dirtDark?: boolean, dirtDepth?: number, dirtTilt?: number }) {
  const typeInfo = TREE_TYPES[type] || TREE_TYPES.tangerine
  const color = typeInfo.color
  const shape = typeInfo.shape || 'oak'
  const rarity = typeInfo.rarity || 'common'
  const dark = darken(color, 40)
  const light = lighten(color, rarity === 'legendary' ? 50 : rarity === 'epic' ? 35 : 25)
  const uid = `plant-${type}-${size}-${stage}`

  const swayHash = (type.charCodeAt(0) + (type.charCodeAt(1) || 0)) % 10
  const swayDuration = stage >= 4 ? 8 + (swayHash % 3) : stage >= 3 ? 6 + (swayHash % 3) : 4 + (swayHash % 2)
  const swayDelay = -(swayHash * 0.7)
  const swayDeg = stage >= 4 ? 0.6 : stage >= 3 ? 1.0 : stage >= 2 ? 1.5 : 2.0

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
        <g style={{
          transformOrigin: '24px 38px',
          '--sway-deg': `${swayDeg}deg`,
          animation: `plantSway ${swayDuration}s ease-in-out ${swayDelay}s infinite`,
        } as React.CSSProperties}>
          <ellipse cx="24" cy="28" rx="6" ry="8" fill={`url(#${uid}-sg)`} />
          <ellipse cx="24" cy="28" rx="6" ry="8" fill={dark} opacity="0.15" />
          <path d="M24 20 Q24 28 24 36" stroke={dark} strokeWidth="0.8" fill="none" opacity="0.3" />
          <path d="M24 21 Q22 17 24 14 Q26 17 24 21" fill="#6ab04c" opacity="0.6" />
          <path d="M24 14 L24 21" stroke="#4a8c3f" strokeWidth="0.6" opacity="0.4" />
        </g>
      </svg>
    )
  }

  const s = Math.min(3, Math.max(0, stage))
  const trunk = "#6b5b3e"

  const renderShape = () => {
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
            <ellipse cx="21" cy="19" rx="4" ry="3" fill={light} opacity="0.2" />
            <ellipse cx="28" cy="24" rx="3" ry="2.5" fill={dark} opacity="0.12" />
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
            <ellipse cx="24" cy="21" rx="12" ry="11" fill={color} />
            <ellipse cx="24" cy="27" rx="10" ry="4" fill={dark} opacity="0.1" />
            <ellipse cx="20" cy="17" rx="6" ry="5" fill={light} opacity="0.2" />
            <ellipse cx="30" cy="24" rx="4" ry="3" fill={dark} opacity="0.12" />
            <ellipse cx="16" cy="22" rx="3" ry="2.5" fill={color} opacity="0.3" />
            <ellipse cx="28" cy="16" rx="3.5" ry="2.5" fill={color} opacity="0.25" />
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
            <path d="M23 46 L23 8" stroke="#d4cfc8" strokeWidth="3" strokeLinecap="round" />
            <path d="M23 46 L23 8" stroke={`url(#${uid}-trunk)`} strokeWidth="3" strokeLinecap="round" />
            <path d="M21.6 46 L21.6 8" stroke="#a09888" strokeWidth="0.4" opacity="0.2" />
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
            <path d="M24 46 L24 30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 46 L24 30" stroke={dark} strokeWidth="0.6" opacity="0.1" />
            <path d="M23 40 L25 40" stroke={dark} strokeWidth="0.7" opacity="0.4" />
            <path d="M23 36 L25 36" stroke={dark} strokeWidth="0.6" opacity="0.35" />
            <path d="M24 36 C22 34 18 32 16 34 C18 31 22 33 24 35" fill={color} opacity="0.5" />
            <path d="M24 36 L20 33" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 16" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <path d="M24 46 L24 16" stroke={dark} strokeWidth="1" opacity="0.1" />
            <path d="M22.5 40 L25.5 40" stroke={dark} strokeWidth="0.8" opacity="0.4" />
            <path d="M22.5 34 L25.5 34" stroke={dark} strokeWidth="0.8" opacity="0.4" />
            <path d="M22.5 28 L25.5 28" stroke={dark} strokeWidth="0.7" opacity="0.35" />
            <path d="M23 22 L25 22" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <path d="M24 28 C20 26 14 24 12 22 C14 22 20 24 24 27" fill={color} opacity="0.5" />
            <path d="M24 22 C28 20 34 18 36 16 C34 18 28 20 24 21" fill={color} opacity="0.5" />
            <path d="M24 16 C22 14 18 12 16 12 C18 11 22 13 24 15" fill={color} opacity="0.4" />
            <path d="M24 27 L18 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M24 21 L30 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M18 46 L18 14" stroke={dark} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
            <path d="M16.5 38 L19.5 38" stroke={dark} strokeWidth="0.6" opacity="0.25" />
            <path d="M16.5 30 L19.5 30" stroke={dark} strokeWidth="0.6" opacity="0.25" />
            <path d="M17 22 L19 22" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M24 46 L24 10" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M24 46 L24 10" stroke={dark} strokeWidth="1" opacity="0.1" />
            <path d="M22 40 L26 40" stroke={dark} strokeWidth="0.8" opacity="0.4" />
            <path d="M22 32 L26 32" stroke={dark} strokeWidth="0.8" opacity="0.4" />
            <path d="M22 24 L26 24" stroke={dark} strokeWidth="0.7" opacity="0.35" />
            <path d="M22.5 16 L25.5 16" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <path d="M24 32 C20 30 14 28 10 26 C14 26 20 28 24 31" fill={color} opacity="0.6" />
            <path d="M24 24 C28 22 34 20 38 18 C34 20 28 22 24 23" fill={color} opacity="0.5" />
            <path d="M24 16 C20 14 14 12 10 10 C14 11 20 13 24 15" fill={color} opacity="0.5" />
            <path d="M24 16 C28 14 32 12 36 12 C32 13 28 14 24 15" fill={color} opacity="0.4" />
            <path d="M18 22 C14 20 10 18 8 18 C10 17 14 19 18 21" fill={color} opacity="0.35" />
          </g>
        )
        return (
          <g>
            <path d="M16 46 L16 12" stroke={dark} strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
            <path d="M14.5 38 L17.5 38" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M14.5 28 L17.5 28" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M15 18 L17 18" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <path d="M32 46 L32 16" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            <path d="M30.5 38 L33.5 38" stroke={dark} strokeWidth="0.5" opacity="0.18" />
            <path d="M31 30 L33 30" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <path d="M31 22 L33 22" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            <path d="M24 46 L24 6" stroke={color} strokeWidth="4" strokeLinecap="round" />
            <path d="M24 46 L24 6" stroke={dark} strokeWidth="1.2" opacity="0.1" />
            <path d="M21.5 40 L26.5 40" stroke={dark} strokeWidth="1" opacity="0.4" />
            <path d="M21.5 32 L26.5 32" stroke={dark} strokeWidth="1" opacity="0.4" />
            <path d="M22 24 L26 24" stroke={dark} strokeWidth="0.8" opacity="0.35" />
            <path d="M22 16 L26 16" stroke={dark} strokeWidth="0.8" opacity="0.35" />
            <path d="M22.5 8 L25.5 8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
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
            <path d="M32 30 C36 28 40 26 42 24 C40 26 36 28 32 29" fill={color} opacity="0.25" />
            <path d="M32 22 C28 20 24 18 22 16 C24 17 28 19 32 21" fill={color} opacity="0.2" />
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
            <ellipse cx="12" cy="22" rx="3" ry="2" fill="#ffe0ec" />
            <path d="M10 19 L10.5 18 L11.5 18.5 L11 19.5 L10 19Z" fill="#ffc0d8" />
            <circle cx="10" cy="20" r="0.5" fill="#fbbf24" opacity="0.4" />
            <path d="M16 20 C14 17 15 14 19 14 C23 14 24 18 21 21 C18 23 15 22 16 20Z" fill="#ffc0d8" />
            <path d="M18 16 Q17 15 18.5 14.5 L19.5 15.5 Q19 17 18 16Z" fill="#ffe0ec" />
            <ellipse cx="20" cy="19" rx="1.5" ry="2.5" fill="#e890b8" opacity="0.25" />
            <circle cx="18" cy="19" r="0.5" fill="#fbbf24" opacity="0.35" />
            <path d="M29 22 C27 19 29 16 33 17 C36 18 37 21 34 23 C31 25 28 24 29 22Z" fill="#f9a8d4" />
            <path d="M32 19 L32.5 18 L33.5 18.5 L33 19.5 L32 19Z" fill="#ffe0ec" />
            <circle cx="32" cy="21" r="0.4" fill="#fbbf24" opacity="0.3" />
            <path d="M21 25 C19 22 21 20 24 20.5 C26 21 26 24 23 26Z" fill="#ffc0d8" />
            <ellipse cx="28" cy="36" rx="0.9" ry="0.5" fill="#f9a8d4" transform="rotate(-25 28 36)" />
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
            <ellipse cx="10" cy="20" rx="2.5" ry="1.5" fill="#e890b8" opacity="0.35" />
            <path d="M11 14 C9 11 11 8 15 9 C19 10 20 14 17 16 C14 18 10 17 11 14Z" fill="#ffc0d8" />
            <path d="M14 11 Q13 10 14.5 9 L16 10.5 Q15 12 14 11Z" fill="#ffe0ec" />
            <ellipse cx="17" cy="15" rx="1.5" ry="2.5" fill="#e890b8" opacity="0.25" />
            <path d="M16 12 C14 9 17 7 20 9 C23 11 21 15 18 15Z" fill="#f9a8d4" />
            <path d="M20 19 C17 15 20 12 24 13 C28 14 28 19 24 21 C21 22 18 21 20 19Z" fill="#ffc0d8" />
            <path d="M23 15 L23.5 14 L24.5 14.5 L24 15.5 L23 15Z" fill="#ffe0ec" />
            <ellipse cx="22" cy="18" rx="2" ry="1.2" fill="#e890b8" opacity="0.2" />
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
            <ellipse cx="28" cy="34" rx="1" ry="0.6" fill="#f9a8d4" opacity="0.7" transform="rotate(-20 28 34)" />
            <ellipse cx="16" cy="38" rx="0.8" ry="0.5" fill="#ffc0d8" opacity="0.6" transform="rotate(15 16 38)" />
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
            <circle cx="5" cy="21" r="0.8" fill="#fbbf24" opacity="0.4" />
            <circle cx="3.5" cy="19.5" r="0.6" fill="#fbbf24" opacity="0.35" />
            {/* Bottom-left mid */}
            <ellipse cx="11" cy="20" rx="3.5" ry="3" fill="#ffc0d8" />
            <ellipse cx="13" cy="21" rx="3" ry="2.5" fill="#f9a8d4" />
            <circle cx="11.5" cy="20" r="0.7" fill="#fbbf24" opacity="0.35" />
            {/* Bottom-left near trunk */}
            <ellipse cx="17" cy="24" rx="3" ry="2.5" fill="#ffe0ec" />
            <ellipse cx="19" cy="23" rx="2.5" ry="2" fill="#f9a8d4" />
            {/* Upper-left branch tip */}
            <ellipse cx="10" cy="10" rx="4" ry="3.5" fill="#ffc0d8" />
            <ellipse cx="8" cy="9" rx="3" ry="2.5" fill="#f9a8d4" />
            <ellipse cx="12" cy="11" rx="2.5" ry="2" fill="#ffe0ec" />
            <circle cx="10" cy="10" r="0.8" fill="#fbbf24" opacity="0.4" />
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
            <circle cx="37" cy="8" r="0.8" fill="#fbbf24" opacity="0.4" />
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
            <circle cx="23" cy="8" r="1" fill="#fbbf24" opacity="0.45" />
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
            <ellipse cx="22" cy="16" rx="2" ry="4" fill="#4a8c3a" opacity="0.15" />
            {/* One lemon */}
            <ellipse cx="27" cy="20" rx="1.5" ry="2.2" fill={color} transform="rotate(-15 27 20)" />
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
            <ellipse cx="21" cy="14" rx="2.5" ry="6" fill="#4a8c3a" opacity="0.12" />
            {/* Lemons — oval with pointed tip */}
            <ellipse cx="19" cy="22" rx="1.6" ry="2.5" fill={color} transform="rotate(-8 19 22)" />
            <path d="M19 19.8 Q18.5 19 19.2 19.5" stroke={light} strokeWidth="0.3" fill="none" opacity="0.3" />
            <circle cx="18.2" cy="21" r="0.4" fill="white" opacity="0.18" />
            <path d="M19.5 24.2 Q19.8 24.8 19.2 24.5" fill="#c8a800" opacity="0.2" />
            <ellipse cx="30" cy="16" rx="1.4" ry="2.2" fill={color} transform="rotate(10 30 16)" />
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

      case 'apple':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 36" stroke={trunk} strokeWidth="1.7" strokeLinecap="round" fill="none" />
            <path d="M23.5 41 L24.8 40.8" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <path d="M24 38 C20 35 17 33 18 36 C19 38 22 37 24 38Z" fill={color} opacity="0.7" />
            <path d="M24 38 C28 35 31 33 30 36 C29 38 26 37 24 38Z" fill={color} opacity="0.6" />
            <path d="M21 35 C20 34 21 33 22 34.5Z" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23.5 40 24 32 Q24 29 24 28" stroke={trunk} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M23.8 42 L24.8 41.8" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <path d="M23.8 30 Q18 26 15 24" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M24.2 30 Q30 26 33 24" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M12 16 C8 10 12 5 20 5 C24 5 28 6 32 8 C38 12 36 20 30 24 C26 26 18 26 14 22 C10 19 10 17 12 16Z" fill={color} />
            <path d="M16 12 C13 9 16 6 22 7 C26 8 28 10 26 14 C24 17 18 16 16 12Z" fill={color} opacity="0.8" />
            <path d="M28 14 C30 10 34 12 33 16 C32 20 28 20 28 14Z" fill={color} opacity="0.7" />
            <path d="M18 10 C16 8 18 6 21 8 C23 10 20 12 18 10Z" fill={light} opacity="0.15" />
            <path d="M28 20 C30 18 32 19 31 21Z" fill={dark} opacity="0.1" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 Q23.5 40 24 34" stroke={trunk} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M24 42 L24.8 41.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <ellipse cx="24" cy="38" rx="0.6" ry="1" fill={dark} opacity="0.2" />
            <path d="M24 36 Q15 30 11 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q32 28 37 26" stroke={trunk} strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q24 28 24 24" stroke={trunk} strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M10 14 C6 7 11 1 20 2 C24 2 28 3 33 6 C40 10 38 20 32 24 C28 27 18 28 12 24 C7 20 7 16 10 14Z" fill={color} />
            <path d="M14 10 C10 6 14 2 22 3 C28 4 30 8 28 14 C26 18 18 18 14 10Z" fill={color} opacity="0.8" />
            <path d="M30 12 C33 8 38 10 36 16 C34 20 30 20 30 12Z" fill={color} opacity="0.7" />
            <path d="M18 8 C16 5 18 3 22 5 C24 7 20 10 18 8Z" fill={light} opacity="0.15" />
            <path d="M30 20 C32 18 35 19 34 22Z" fill={dark} opacity="0.1" />
            <circle cx="14" cy="22" r="1.6" fill="#cc3333" />
            <path d="M14 20.5 L14.2 19.5" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M14.2 19.5 Q15.2 19 14.8 20" fill="#4a8c3a" opacity="0.6" />
            <circle cx="13.3" cy="21.5" r="0.4" fill="#ff6666" opacity="0.3" />
            <circle cx="33" cy="20" r="1.5" fill="#cc3333" />
            <path d="M33 18.5 L33.2 17.5" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M33.2 17.5 Q34.2 17 33.8 18" fill="#4a8c3a" opacity="0.6" />
            <circle cx="32.3" cy="19.5" r="0.35" fill="#ff6666" opacity="0.3" />
            <path d="M23 46 Q20 45 17 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.25" />
            <path d="M25 46 Q28 45 31 46" stroke={trunk} strokeWidth="0.5" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            {/* Trunk — slim with bark lines */}
            <path d="M22 46 Q21 42 21.5 37 Q22 33 23 29" fill="none" stroke={trunk} strokeWidth="3.3" strokeLinecap="round" />
            <path d="M22 46 Q21 42 21.5 37 Q22 33 23 29" fill="none" stroke={dark} strokeWidth="0.7" opacity="0.12" strokeLinecap="round" />
            <ellipse cx="22" cy="38" rx="0.7" ry="1.1" fill={dark} opacity="0.2" />
            <ellipse cx="21.5" cy="42" rx="0.5" ry="0.8" fill={dark} opacity="0.18" />
            {/* Branches */}
            <path d="M22 32 Q14 26 9 22" stroke={trunk} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M23 30 Q30 24 36 20" stroke={trunk} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M22.5 29 Q22 22 22 16" stroke={trunk} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M10 22 Q7 18 5 14" stroke={trunk} strokeWidth="0.9" fill="none" strokeLinecap="round" />
            <path d="M35 20 Q38 16 40 14" stroke={trunk} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* Back canopy blobs — dark */}
            <path d="M4 16 C2 10 5 6 10 5 C14 4 18 8 16 12 C14 16 6 18 4 16Z" fill={dark} opacity="0.9" />
            <path d="M14 8 C12 4 16 1 22 2 C26 3 28 8 24 12 C20 15 15 12 14 8Z" fill={dark} opacity="0.85" />
            <path d="M26 6 C28 2 34 3 34 8 C34 12 30 14 28 10 C26 8 25 7 26 6Z" fill={dark} opacity="0.85" />
            <path d="M34 10 C36 6 40 8 40 12 C40 16 36 18 34 14 C33 12 33 11 34 10Z" fill={dark} opacity="0.8" />
            <path d="M6 22 C4 18 6 16 10 16 C14 16 15 19 12 22 C10 24 7 24 6 22Z" fill={dark} opacity="0.8" />
            <path d="M20 18 C18 14 20 12 24 12 C27 12 28 16 25 19 C23 21 21 20 20 18Z" fill={dark} opacity="0.75" />
            {/* Front canopy blobs — main color */}
            <path d="M3 18 C1 12 4 7 9 6 C13 5 17 9 15 14 C13 18 5 20 3 18Z" fill={color} />
            <path d="M12 10 C10 6 13 2 18 3 C22 4 24 8 20 12 C17 15 13 14 12 10Z" fill={color} />
            <path d="M22 6 C20 2 24 0 29 1 C33 2 34 6 30 10 C27 13 23 10 22 6Z" fill={color} />
            <path d="M32 8 C34 4 38 6 38 10 C38 14 35 16 33 12 C32 11 31 10 32 8Z" fill={color} opacity="0.95" />
            <path d="M38 14 C40 11 42 12 42 16 C42 19 39 20 38 18 C37 17 37 15 38 14Z" fill={color} opacity="0.9" />
            <path d="M5 24 C3 20 5 17 9 17 C13 17 15 20 12 24 C10 26 6 26 5 24Z" fill={color} opacity="0.95" />
            <path d="M16 20 C14 16 16 14 20 14 C24 14 25 18 22 22 C19 24 17 22 16 20Z" fill={color} opacity="0.9" />
            <path d="M26 16 C24 12 27 10 31 11 C34 12 35 16 31 18 C28 20 27 19 26 16Z" fill={color} opacity="0.9" />
            <path d="M34 18 C36 15 39 16 39 20 C39 23 36 24 34 22 C33 21 33 19 34 18Z" fill={color} opacity="0.85" />
            <path d="M12 26 C10 24 12 22 14 22 C16 22 17 24 16 26 C15 28 13 28 12 26Z" fill={color} opacity="0.85" />
            <path d="M22 24 C20 22 22 20 24 20 C26 20 27 22 26 24 C25 26 23 26 22 24Z" fill={color} opacity="0.8" />
            {/* Highlight dots */}
            <circle cx="10" cy="8" r="0.5" fill={light} opacity="0.35" />
            <circle cx="18" cy="6" r="0.5" fill={light} opacity="0.3" />
            <circle cx="26" cy="4" r="0.5" fill={light} opacity="0.3" />
            <circle cx="34" cy="8" r="0.45" fill={light} opacity="0.25" />
            <circle cx="14" cy="14" r="0.4" fill={light} opacity="0.25" />
            <circle cx="22" cy="12" r="0.4" fill={light} opacity="0.25" />
            <circle cx="30" cy="14" r="0.4" fill={light} opacity="0.2" />
            <circle cx="8" cy="20" r="0.4" fill={light} opacity="0.2" />
            {/* Apples — each with stem, leaf, highlight */}
            <circle cx="8" cy="22" r="1.8" fill="#cc3333" />
            <path d="M8 20.3 L8.2 19" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M8.2 19 Q9.2 18.5 8.8 19.5" fill="#4a8c3a" opacity="0.6" />
            <circle cx="7.2" cy="21.5" r="0.45" fill="#ff6666" opacity="0.3" />
            <circle cx="38" cy="18" r="1.8" fill="#cc3333" />
            <path d="M38 16.3 L38.2 15" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M38.2 15 Q39.2 14.5 38.8 15.5" fill="#4a8c3a" opacity="0.6" />
            <circle cx="37.2" cy="17.5" r="0.45" fill="#ff6666" opacity="0.3" />
            <circle cx="16" cy="26" r="1.6" fill="#cc3333" />
            <path d="M16 24.5 L16.2 23.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <path d="M16.2 23.5 Q17 23 16.6 24" fill="#4a8c3a" opacity="0.5" />
            <circle cx="15.3" cy="25.5" r="0.4" fill="#ff6666" opacity="0.25" />
            <circle cx="34" cy="22" r="1.6" fill="#cc3333" />
            <path d="M34 20.5 L34.2 19.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <path d="M34.2 19.5 Q35 19 34.6 20" fill="#4a8c3a" opacity="0.5" />
            <circle cx="33.3" cy="21.5" r="0.4" fill="#ff6666" opacity="0.25" />
            <circle cx="24" cy="16" r="1.5" fill="#cc3333" opacity="0.85" />
            <path d="M24 14.5 L24.2 13.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="23.3" cy="15.5" r="0.35" fill="#ff6666" opacity="0.25" />
            <circle cx="18" cy="10" r="1.3" fill="#cc3333" opacity="0.75" />
            <circle cx="30" cy="8" r="1.2" fill="#cc3333" opacity="0.7" />
            <circle cx="12" cy="14" r="1.2" fill="#cc3333" opacity="0.7" />
            {/* Root flare */}
            <path d="M21 46 Q18 44.5 15 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M25 46 Q28 44.5 31 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
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

      case 'blackberry':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23 43 22 40" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M22 42 Q24 41 26 42" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M20 40 Q18 38 19 37 Q21 38 23 37 Q21 39 20 40 Z" fill={color} opacity="0.7" />
            <path d="M25 41 Q27 39 26 38 Q24 39 25 41 Z" fill={color} opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q21 42 20 38" stroke={trunk} strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q27 42 28 38" stroke={trunk} strokeWidth="1.4" strokeLinecap="round" fill="none" />
            {/* Back blobs — dark, packed */}
            <path d="M14 36 C12 33 14 31 17 31 C20 31 21 34 19 37 C17 39 15 38 14 36 Z" fill={dark} opacity="0.85" />
            <path d="M26 36 C28 33 31 33 32 36 C33 39 30 40 28 38 C26 37 25 37 26 36 Z" fill={dark} opacity="0.8" />
            <path d="M20 34 C19 32 20 30 23 30 C26 30 27 33 25 35 C23 37 21 36 20 34 Z" fill={dark} opacity="0.75" />
            {/* Front blobs — main color, solid */}
            <path d="M13 37 C11 34 13 32 16 32 C19 32 20 35 18 38 C16 40 14 39 13 37 Z" fill={color} />
            <path d="M19 35 C18 33 19 31 22 31 C25 31 26 34 24 36 C22 38 20 37 19 35 Z" fill={color} />
            <path d="M27 36 C29 33 32 34 32 37 C32 39 29 40 27 38 C26 37 26 37 27 36 Z" fill={color} opacity="0.95" />
            <path d="M23 38 C22 36 23 35 25 35 C27 35 28 37 26 39 C25 40 24 39 23 38 Z" fill={color} opacity="0.9" />
            {/* Dot texture */}
            <circle cx="17" cy="34" r="0.4" fill={light} opacity="0.3" />
            <circle cx="23" cy="33" r="0.4" fill={light} opacity="0.3" />
            <circle cx="29" cy="35" r="0.35" fill={light} opacity="0.25" />
            {/* Berries */}
            <circle cx="15" cy="36" r="0.7" fill="#2d1b4e" />
            <circle cx="15.6" cy="35.5" r="0.6" fill="#3d2060" />
            <circle cx="30" cy="37" r="0.65" fill="#2d1b4e" />
            <circle cx="30.5" cy="36.5" r="0.55" fill="#3d2060" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Canes */}
            <path d="M24 46 Q20 42 18 36" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q28 42 30 36" stroke={trunk} strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24 42 24 37" stroke={trunk} strokeWidth="1.4" strokeLinecap="round" fill="none" />
            {/* Back blobs — dark, packed tight */}
            <path d="M8 34 C6 31 8 28 11 27 C14 26 16 29 14 32 C12 35 9 36 8 34 Z" fill={dark} opacity="0.9" />
            <path d="M18 32 C16 29 18 26 21 26 C24 26 26 29 24 32 C22 34 19 34 18 32 Z" fill={dark} opacity="0.85" />
            <path d="M28 32 C30 29 33 28 35 31 C37 34 34 36 31 34 C29 33 27 33 28 32 Z" fill={dark} opacity="0.85" />
            <path d="M14 36 C12 33 14 30 17 30 C20 30 22 33 20 36 C18 38 15 38 14 36 Z" fill={dark} opacity="0.8" />
            <path d="M32 36 C34 33 37 33 38 36 C39 38 36 40 34 38 C32 37 31 37 32 36 Z" fill={dark} opacity="0.75" />
            {/* Front blobs — main color, solid */}
            <path d="M7 35 C5 32 7 29 10 28 C13 27 15 30 13 33 C11 36 8 37 7 35 Z" fill={color} />
            <path d="M14 33 C12 30 14 27 18 27 C22 27 24 30 21 33 C19 35 15 35 14 33 Z" fill={color} />
            <path d="M22 31 C21 28 23 26 27 26 C30 26 32 29 29 32 C27 34 23 34 22 31 Z" fill={color} />
            <path d="M30 33 C32 30 36 30 37 33 C38 36 35 38 33 36 C31 35 29 34 30 33 Z" fill={color} opacity="0.95" />
            <path d="M12 38 C10 36 12 34 15 34 C18 34 19 36 17 38 C15 40 13 40 12 38 Z" fill={color} opacity="0.95" />
            <path d="M24 36 C23 34 24 32 27 32 C29 32 30 34 29 36 C28 38 25 38 24 36 Z" fill={color} opacity="0.9" />
            <path d="M34 38 C36 36 38 36 38 38 C38 40 36 41 34 40 C33 39 33 38 34 38 Z" fill={color} opacity="0.85" />
            <path d="M18 39 C17 37 18 36 20 36 C22 36 23 38 21 40 C20 41 19 40 18 39 Z" fill={color} opacity="0.85" />
            {/* Dot texture */}
            <circle cx="12" cy="30" r="0.4" fill={light} opacity="0.3" />
            <circle cx="20" cy="29" r="0.4" fill={light} opacity="0.3" />
            <circle cx="28" cy="29" r="0.4" fill={light} opacity="0.25" />
            <circle cx="35" cy="32" r="0.35" fill={light} opacity="0.25" />
            <circle cx="16" cy="34" r="0.35" fill={light} opacity="0.25" />
            <circle cx="26" cy="34" r="0.35" fill={light} opacity="0.2" />
            {/* Berry clusters */}
            <circle cx="10" cy="32" r="0.9" fill="#2d1b4e" />
            <circle cx="10.7" cy="31.4" r="0.7" fill="#3d2060" />
            <circle cx="10.3" cy="32.8" r="0.65" fill="#2d1b4e" opacity="0.85" />
            <circle cx="36" cy="34" r="0.85" fill="#2d1b4e" />
            <circle cx="36.6" cy="33.4" r="0.7" fill="#3d2060" />
            <circle cx="36.2" cy="34.7" r="0.6" fill="#2d1b4e" opacity="0.8" />
            <circle cx="24" cy="35" r="0.8" fill="#2d1b4e" />
            <circle cx="24.6" cy="34.4" r="0.65" fill="#3d2060" />
          </g>
        )
        return (
          <g>
            {/* Canes at base */}
            <path d="M24 46 Q19 40 16 32" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q29 40 32 32" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24 40 24 34" stroke={trunk} strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q17 42 12 38" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q31 42 36 38" stroke={trunk} strokeWidth="1.1" strokeLinecap="round" fill="none" />
            {/* Back layer — dark blobs, high opacity, packed */}
            <path d="M4 30 C2 26 4 22 8 21 C12 20 15 23 13 27 C11 31 6 33 4 30 Z" fill={dark} opacity="0.9" />
            <path d="M14 26 C12 22 15 19 19 19 C23 19 25 23 22 27 C19 30 15 29 14 26 Z" fill={dark} opacity="0.9" />
            <path d="M24 24 C22 20 25 18 29 18 C33 18 35 22 32 26 C29 29 25 28 24 24 Z" fill={dark} opacity="0.85" />
            <path d="M34 28 C36 24 40 24 41 28 C42 32 38 34 35 32 C33 31 33 29 34 28 Z" fill={dark} opacity="0.85" />
            <path d="M8 36 C6 33 8 30 12 30 C16 30 18 33 15 36 C13 38 9 38 8 36 Z" fill={dark} opacity="0.8" />
            <path d="M28 34 C30 31 34 30 36 34 C38 37 34 39 31 37 C29 36 27 35 28 34 Z" fill={dark} opacity="0.8" />
            <path d="M18 34 C16 31 18 28 22 28 C25 28 27 31 24 34 C22 36 19 36 18 34 Z" fill={dark} opacity="0.75" />
            {/* Front layer — main color blobs, solid, dense */}
            <path d="M3 32 C1 28 3 24 7 22 C11 20 14 24 12 28 C10 32 5 34 3 32 Z" fill={color} />
            <path d="M12 27 C10 23 12 20 17 20 C21 20 23 24 20 28 C17 31 13 30 12 27 Z" fill={color} />
            <path d="M22 25 C20 21 23 18 28 18 C32 18 34 22 31 26 C28 29 23 28 22 25 Z" fill={color} />
            <path d="M32 28 C34 24 38 24 40 28 C42 32 38 34 35 32 C33 31 31 30 32 28 Z" fill={color} />
            <path d="M6 36 C4 33 6 30 10 30 C14 30 16 33 13 36 C11 38 7 38 6 36 Z" fill={color} opacity="0.95" />
            <path d="M15 34 C13 31 15 28 19 28 C23 28 25 31 22 34 C20 36 16 36 15 34 Z" fill={color} opacity="0.95" />
            <path d="M26 32 C28 29 32 29 34 32 C36 35 32 37 29 36 C27 35 25 34 26 32 Z" fill={color} opacity="0.9" />
            <path d="M37 34 C39 31 42 32 42 35 C42 38 39 39 37 37 C36 36 36 35 37 34 Z" fill={color} opacity="0.9" />
            <path d="M10 39 C8 37 10 35 13 35 C16 35 17 37 15 39 C13 41 11 41 10 39 Z" fill={color} opacity="0.9" />
            <path d="M20 38 C19 36 20 34 23 34 C26 34 27 36 25 38 C23 40 21 40 20 38 Z" fill={color} opacity="0.85" />
            <path d="M30 38 C32 36 35 36 35 38 C35 40 33 41 31 40 C29 39 29 38 30 38 Z" fill={color} opacity="0.85" />
            {/* Dot texture */}
            <circle cx="10" cy="24" r="0.5" fill={light} opacity="0.3" />
            <circle cx="18" cy="22" r="0.5" fill={light} opacity="0.3" />
            <circle cx="26" cy="21" r="0.5" fill={light} opacity="0.3" />
            <circle cx="34" cy="26" r="0.45" fill={light} opacity="0.25" />
            <circle cx="14" cy="29" r="0.45" fill={light} opacity="0.25" />
            <circle cx="22" cy="28" r="0.45" fill={light} opacity="0.25" />
            <circle cx="38" cy="30" r="0.4" fill={light} opacity="0.2" />
            <circle cx="12" cy="35" r="0.4" fill={light} opacity="0.2" />
            <circle cx="28" cy="34" r="0.4" fill={light} opacity="0.2" />
            {/* Berry clusters */}
            <circle cx="8" cy="28" r="1" fill="#2d1b4e" />
            <circle cx="8.8" cy="27.3" r="0.8" fill="#3d2060" />
            <circle cx="8.3" cy="28.8" r="0.75" fill="#2d1b4e" opacity="0.85" />
            <circle cx="7.4" cy="27.7" r="0.55" fill="#4a2878" opacity="0.5" />
            <circle cx="38" cy="30" r="0.95" fill="#2d1b4e" />
            <circle cx="38.7" cy="29.3" r="0.8" fill="#3d2060" />
            <circle cx="38.3" cy="30.8" r="0.7" fill="#2d1b4e" opacity="0.85" />
            <circle cx="24" cy="26" r="1" fill="#2d1b4e" />
            <circle cx="24.8" cy="25.3" r="0.85" fill="#3d2060" />
            <circle cx="24.3" cy="26.8" r="0.75" fill="#2d1b4e" opacity="0.85" />
            <circle cx="14" cy="35" r="0.85" fill="#2d1b4e" />
            <circle cx="14.7" cy="34.4" r="0.7" fill="#3d2060" />
            <circle cx="14.2" cy="35.7" r="0.65" fill="#2d1b4e" opacity="0.8" />
            <circle cx="32" cy="36" r="0.85" fill="#2d1b4e" />
            <circle cx="32.7" cy="35.4" r="0.7" fill="#3d2060" />
            <circle cx="32.2" cy="36.7" r="0.65" fill="#2d1b4e" opacity="0.8" />
            <circle cx="22" cy="37" r="0.8" fill="#2d1b4e" />
            <circle cx="22.6" cy="36.4" r="0.65" fill="#3d2060" />
          </g>
        )

      case 'peach':
        if (s === 0) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-stem`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3a5a2e" />
                <stop offset="100%" stopColor={trunk} />
              </linearGradient>
            </defs>
            <path d="M24 46 Q23.3 43 23.6 39 Q23.8 36 24.2 34" stroke={`url(#${uid}-stem)`} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23.8 40 Q24.2 39.8 24.5 40.1" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            <path d="M24 37 C21 34.5 18.5 33 18 35 C17.5 37 21 37.5 24 37 Z" fill="#2a5a1e" opacity="0.75" />
            <path d="M24 37 C20.5 34 18 32.5 18.8 35.5 C19.5 37.5 22.5 37 24 37 Z" fill="#3a7a2e" opacity="0.4" />
            <path d="M24 37 C27 34.5 29.5 33 30 35 C30.5 37 27 37.5 24 37 Z" fill="#1e4a14" opacity="0.65" />
            <path d="M24 37 C27.5 34 30 32.5 29.2 35.5 C28.5 37.5 25.5 37 24 37 Z" fill="#2a5a1e" opacity="0.35" />
            <path d="M24 31 C23.2 29.5 23.5 28 24 27.5 C24.5 28 24.8 29.5 24 31 Z" fill="#ffb7c5" opacity="0.55" />
            <path d="M23.6 29.5 C23.8 29 24.2 29 24.4 29.5" fill="#ffd6e0" opacity="0.3" />
            <circle cx="24" cy="29" r="0.35" fill="#fbbf24" opacity="0.45" />
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-bark`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={trunk} />
                <stop offset="50%" stopColor={dark} stopOpacity="0.15" />
                <stop offset="100%" stopColor={trunk} />
              </linearGradient>
              <radialGradient id={`${uid}-canopy-light`} cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#4a8a30" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1a3a10" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d="M24 46 Q23.5 40 24 32 Q24.2 29 24.5 27" stroke={trunk} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M23.2 42 Q24 41.5 24.8 42" stroke={dark} strokeWidth="0.35" opacity="0.15" />
            <path d="M23.5 38 Q24.3 37.6 24.9 38.2" stroke={dark} strokeWidth="0.3" opacity="0.12" />
            <path d="M24.2 31 Q16.5 25.5 10.5 21" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24.3 29 Q31.5 23.5 37 19.5" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M6 22 C3.5 18 5.5 14 9.5 14 C13.5 14 16 17 13.5 21 C11 24.5 7.5 24.5 6 22 Z" fill="#1a3a10" opacity="0.8" />
            <path d="M15 18 C13 14.5 15.5 11.5 19.5 12.5 C23.5 13.5 24.5 17.5 21.5 20 C18.5 22.5 16 21 15 18 Z" fill="#1a3a10" opacity="0.75" />
            <path d="M26 17 C27.5 13.5 31.5 13.5 33.5 17 C35.5 21 32 23.5 29 21.5 C27 20 25 19 26 17 Z" fill="#1a3a10" opacity="0.75" />
            <path d="M5 23 C3 19.5 4.5 15.5 8.5 14.5 C12.5 13.5 15.5 16.5 13.5 20.5 C11.5 24.5 7 25.5 5 23 Z" fill="#2a5a1e" />
            <path d="M12 19 C10 15.5 12.5 12.5 16.5 12.5 C20.5 12.5 22.5 16.5 19.5 19.5 C16.5 22.5 13 22 12 19 Z" fill="#2a5a1e" />
            <path d="M20 16 C18 12.5 20.5 10.5 24.5 11.5 C28.5 12.5 29.5 16.5 26.5 19 C23.5 21.5 21 20 20 16 Z" fill="#2a5a1e" opacity="0.95" />
            <path d="M30 18 C31.5 14.5 35.5 15.5 36.5 19 C37.5 22.5 34.5 24.5 32 22.5 C30 21 29 20 30 18 Z" fill="#2a5a1e" opacity="0.9" />
            <ellipse cx="18" cy="17" rx="12" ry="6" fill={`url(#${uid}-canopy-light)`} />
            <path d="M9 24 C8 22 8.5 20.5 10.5 20 C12.5 19.5 14 21 13 24 C12 26 10 26.5 9 24 Z" fill="#1e4a14" opacity="0.8" />
            <path d="M18 22 C17 20 17.5 18.5 19.5 18 C21.5 17.5 23 19.5 22 22 C21 24 19 24.5 18 22 Z" fill="#2a5a1e" opacity="0.8" />
            <path d="M27 21 C26 19 26.5 17.5 28.5 17 C30.5 16.5 32 18.5 31 21 C30 23 28 23.5 27 21 Z" fill="#1e4a14" opacity="0.75" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-peach`} cx="30%" cy="30%">
                <stop offset="0%" stopColor="#ffe0b2" />
                <stop offset="50%" stopColor="#ffab76" />
                <stop offset="100%" stopColor="#e8825a" />
              </radialGradient>
            </defs>
            <path d="M22 46 Q21.5 40 22 34 L26 34 Q26.5 40 26 46 Z" fill={trunk} />
            <path d="M23 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M22 36 Q14 30 8 24" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M26 34 Q34 28 40 22" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q24 26 24 18" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M4 23 C2 19 4 14 8 13 C12 12 16 15 14 20 C12 24 6 26 4 23 Z" fill="#1a3a10" opacity="0.85" />
            <path d="M14 17 C12 13 15 10 19 10 C23 10 26 14 23 18 C20 21 15 20 14 17 Z" fill="#1a3a10" opacity="0.85" />
            <path d="M26 15 C28 11 32 11 35 15 C38 19 34 22 30 20 C27 18 25 17 26 15 Z" fill="#1a3a10" opacity="0.8" />
            <path d="M8 27 C6 24 8 21 11 20 C14 19 16 22 14 25 C12 28 9 29 8 27 Z" fill="#1a3a10" opacity="0.8" />
            <path d="M34 22 C36 18 40 19 40 23 C40 26 37 27 35 25 C33 24 33 23 34 22 Z" fill="#1a3a10" opacity="0.75" />
            <path d="M3 24 C1 20 3 15 7 14 C11 13 15 16 13 21 C11 25 5 26 3 24 Z" fill="#2a5a1e" />
            <path d="M11 18 C9 14 12 11 16 11 C20 11 23 15 20 19 C17 22 12 21 11 18 Z" fill="#2a5a1e" />
            <path d="M20 15 C18 11 21 9 26 10 C30 11 32 15 28 18 C25 21 21 19 20 15 Z" fill="#2a5a1e" />
            <path d="M31 19 C33 15 37 16 38 20 C39 23 36 25 33 23 C31 22 30 21 31 19 Z" fill="#2a5a1e" opacity="0.95" />
            <path d="M7 26 C6 24 7 22 9 21 C11 20 13 22 12 25 C11 27 8 28 7 26 Z" fill="#1e4a14" opacity="0.9" />
            <path d="M16 22 C15 20 16 18 18 18 C20 18 22 20 21 22 C20 24 17 24 16 22 Z" fill="#2a5a1e" opacity="0.9" />
            <path d="M26 22 C25 20 26 18 28 18 C30 18 31 20 30 22 C29 24 27 24 26 22 Z" fill="#1e4a14" opacity="0.85" />
            <path d="M22 13 C20 10 22 8 25 9 C27 10 28 13 25 15 C23 16 22 15 22 13 Z" fill="#3a7a2e" opacity="0.8" />
            <g transform="translate(9,23)">
              <path d="M0,-1.8 C-1.2,-1.8 -2,0 -1.6,1.2 C-1,2 0,2.2 0,2.2 C0,2.2 1,2 1.6,1.2 C2,0 1.2,-1.8 0,-1.8 Z" fill={`url(#${uid}-peach)`} />
              <path d="M0,-1.8 C0,0 0,2.2 0,2.2" stroke="#e87040" strokeWidth="0.3" opacity="0.3" fill="none" />
              <circle cx="-0.5" cy="-0.5" r="0.4" fill="white" opacity="0.2" />
            </g>
            <g transform="translate(35,21)">
              <path d="M0,-1.6 C-1.1,-1.6 -1.8,0 -1.4,1 C-0.9,1.8 0,2 0,2 C0,2 0.9,1.8 1.4,1 C1.8,0 1.1,-1.6 0,-1.6 Z" fill={`url(#${uid}-peach)`} />
              <path d="M0,-1.6 C0,0 0,2 0,2" stroke="#e87040" strokeWidth="0.25" opacity="0.3" fill="none" />
              <circle cx="-0.4" cy="-0.4" r="0.35" fill="white" opacity="0.18" />
            </g>
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-peach`} cx="30%" cy="30%">
                <stop offset="0%" stopColor="#ffe0b2" />
                <stop offset="50%" stopColor="#ffab76" />
                <stop offset="100%" stopColor="#e8825a" />
              </radialGradient>
            </defs>
            <path d="M22 46 Q21.5 42 22 36 Q22.5 32 23 30" fill="none" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            <path d="M23 38 L25 37.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 32 Q12 24 4 16" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M23 30 Q34 22 44 14" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M23 30 Q23 22 23 14" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M23 28 Q17 24 12 20" stroke={trunk} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M23 26 Q29 22 35 18" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M2 16 C0 12 2 8 6 7 C10 6 13 9 11 13 C9 17 4 19 2 16 Z" fill="#1a3a10" opacity="0.9" />
            <path d="M10 12 C8 8 11 5 16 6 C20 7 21 11 18 14 C15 17 11 16 10 12 Z" fill="#1a3a10" opacity="0.9" />
            <path d="M20 10 C18 6 21 3 26 4 C30 5 32 9 28 12 C25 15 21 14 20 10 Z" fill="#1a3a10" opacity="0.85" />
            <path d="M30 8 C32 4 36 5 38 8 C40 12 36 14 33 12 C31 11 29 10 30 8 Z" fill="#1a3a10" opacity="0.85" />
            <path d="M38 12 C40 8 44 9 44 13 C44 16 41 18 39 16 C37 14 37 13 38 12 Z" fill="#1a3a10" opacity="0.8" />
            <path d="M6 20 C4 17 6 14 9 14 C12 14 14 17 11 20 C9 22 7 22 6 20 Z" fill="#1a3a10" opacity="0.8" />
            <path d="M26 14 C24 10 27 8 31 9 C34 10 34 14 31 16 C29 18 27 17 26 14 Z" fill="#1a3a10" opacity="0.8" />
            <path d="M16 18 C14 15 16 12 19 12 C22 12 24 15 21 18 C19 20 17 20 16 18 Z" fill="#1a3a10" opacity="0.75" />
            <path d="M1 17 C-1 13 1 9 5 8 C9 7 12 10 10 14 C8 18 3 19 1 17 Z" fill="#2a5a1e" />
            <path d="M8 13 C6 9 9 6 14 7 C18 8 19 12 16 15 C13 18 9 17 8 13 Z" fill="#2a5a1e" />
            <path d="M16 10 C14 6 17 3 22 4 C27 5 28 10 24 13 C21 16 17 14 16 10 Z" fill="#2a5a1e" />
            <path d="M26 8 C28 4 32 4 34 8 C36 12 33 14 30 12 C28 11 25 10 26 8 Z" fill="#2a5a1e" />
            <path d="M36 12 C38 8 42 9 43 13 C44 16 40 18 38 16 C36 14 35 13 36 12 Z" fill="#2a5a1e" opacity="0.95" />
            <path d="M5 21 C3 18 5 15 8 15 C11 15 13 18 10 21 C8 23 6 23 5 21 Z" fill="#1e4a14" opacity="0.95" />
            <path d="M14 18 C12 14 14 12 18 12 C22 12 23 16 20 19 C17 21 15 20 14 18 Z" fill="#2a5a1e" opacity="0.9" />
            <path d="M24 14 C22 10 25 8 29 9 C33 10 33 14 30 16 C27 18 25 17 24 14 Z" fill="#2a5a1e" opacity="0.9" />
            <path d="M34 16 C36 13 39 13 40 16 C41 19 38 21 36 19 C34 18 33 17 34 16 Z" fill="#1e4a14" opacity="0.85" />
            <path d="M10 22 C9 20 10 18 12 18 C14 18 15 20 14 22 C13 24 11 24 10 22 Z" fill="#2a5a1e" opacity="0.85" />
            <path d="M20 20 C19 18 20 16 22 16 C24 16 25 18 24 20 C23 22 21 22 20 20 Z" fill="#3a7a2e" opacity="0.8" />
            <path d="M30 20 C29 18 30 16 32 16 C34 16 35 18 34 20 C33 22 31 22 30 20 Z" fill="#1e4a14" opacity="0.8" />
            <g transform="translate(6,18)">
              <path d="M0,-2 C-1.4,-2 -2.2,0.2 -1.8,1.4 C-1.2,2.3 0,2.5 0,2.5 C0,2.5 1.2,2.3 1.8,1.4 C2.2,0.2 1.4,-2 0,-2 Z" fill={`url(#${uid}-peach)`} />
              <path d="M0,-2 C0,0 0,2.5 0,2.5" stroke="#e87040" strokeWidth="0.3" opacity="0.35" fill="none" />
              <circle cx="-0.6" cy="-0.5" r="0.45" fill="white" opacity="0.2" />
            </g>
            <g transform="translate(40,11)">
              <path d="M0,-1.8 C-1.2,-1.8 -2,0 -1.6,1.2 C-1,2 0,2.2 0,2.2 C0,2.2 1,2 1.6,1.2 C2,0 1.2,-1.8 0,-1.8 Z" fill={`url(#${uid}-peach)`} />
              <path d="M0,-1.8 C0,0 0,2.2 0,2.2" stroke="#e87040" strokeWidth="0.25" opacity="0.3" fill="none" />
              <circle cx="-0.5" cy="-0.4" r="0.4" fill="white" opacity="0.2" />
            </g>
            <g transform="translate(12,15)">
              <path d="M0,-1.6 C-1.1,-1.6 -1.8,0 -1.4,1 C-0.9,1.8 0,2 0,2 C0,2 0.9,1.8 1.4,1 C1.8,0 1.1,-1.6 0,-1.6 Z" fill={`url(#${uid}-peach)`} />
              <path d="M0,-1.6 C0,0 0,2 0,2" stroke="#e87040" strokeWidth="0.25" opacity="0.3" fill="none" />
              <circle cx="-0.4" cy="-0.3" r="0.35" fill="white" opacity="0.18" />
            </g>
            <g transform="translate(32,20)">
              <path d="M0,-1.6 C-1.1,-1.6 -1.8,0 -1.4,1 C-0.9,1.8 0,2 0,2 C0,2 0.9,1.8 1.4,1 C1.8,0 1.1,-1.6 0,-1.6 Z" fill={`url(#${uid}-peach)`} />
              <path d="M0,-1.6 C0,0 0,2 0,2" stroke="#e87040" strokeWidth="0.25" opacity="0.3" fill="none" />
              <circle cx="-0.4" cy="-0.3" r="0.35" fill="white" opacity="0.18" />
            </g>
            <g transform="translate(21,13) scale(0.85)">
              <path d="M0,-1.5 C-1,-1.5 -1.6,0 -1.3,1 C-0.8,1.6 0,1.8 0,1.8 C0,1.8 0.8,1.6 1.3,1 C1.6,0 1,-1.5 0,-1.5 Z" fill={`url(#${uid}-peach)`} opacity="0.85" />
              <path d="M0,-1.5 C0,0 0,1.8 0,1.8" stroke="#e87040" strokeWidth="0.2" opacity="0.25" fill="none" />
            </g>
            <path d="M21 46 Q18 44.5 15 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M26 46 Q29 44.5 32 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
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
            <ellipse cx="24" cy="34" rx="2.5" ry="3" fill="#d4a017" />
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
            <ellipse cx="24" cy="38" rx="4.5" ry="5.5" fill={`url(#${uid}-pine)`} />
            <ellipse cx="22.5" cy="35" rx="1.5" ry="2" fill="#e8c040" opacity="0.1" />
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
            <ellipse cx="20" cy="31.2" rx="1.2" ry="1.6" fill="#9b1b5e" />
            <ellipse cx="19.6" cy="30.6" rx="0.3" ry="0.4" fill="#ff6b85" opacity="0.3" />
            <path d="M33 26 L33 27.5" stroke="#5a8c3f" strokeWidth="0.35" strokeLinecap="round" />
            <ellipse cx="33" cy="28.7" rx="1" ry="1.4" fill="#9b1b5e" opacity="0.8" />
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
              <filter id={`vglow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
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
              <filter id={`vglow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
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
            <path d="M24 46 C22 42 26 38 23 34 C20 30 26 28 24 24" stroke="#2a2a3e" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 C26 42 22 38 25 34 C28 30 22 28 24 24" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M24 32 C18 28 12 30 8 24" stroke="#2a2a3e" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 28 C30 24 36 26 40 20" stroke="#2a2a3e" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 26 C20 22 16 18 14 12" stroke="#2a2a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <g filter={`url(#vglow-${uid})`}>
              <circle cx="24" cy="18" r="16" fill={`url(#vgrad-${uid})`} />
              <circle cx="24" cy="18" r="7" fill="#050510" />
              <circle cx="24" cy="18" r="3" fill="#000" />
            </g>
            <ellipse cx="24" cy="18" rx="10" ry="10" fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.2">
              <animate attributeName="rx" values="10;12;10" dur="4s" repeatCount="indefinite" />
              <animate attributeName="ry" values="10;8;10" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="24" cy="18" rx="14" ry="12" fill="none" stroke="#8b5cf6" strokeWidth="0.4" opacity="0.12">
              <animate attributeName="rx" values="14;16;14" dur="5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="ry" values="12;10;12" dur="5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="opacity" values="0.12;0.03;0.12" dur="5s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            <ellipse cx="24" cy="18" rx="18" ry="14" fill={`url(#vring-${uid})`} opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="6s" repeatCount="indefinite" />
            </ellipse>
            <circle cx="8" cy="12" r="1" fill="#6366f1" opacity="0.6">
              <animate attributeName="cx" values="8;22" dur="3s" repeatCount="indefinite" />
              <animate attributeName="cy" values="12;18" dur="3s" repeatCount="indefinite" />
              <animate attributeName="r" values="1;0.2" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="22" r="0.9" fill="#8b5cf6" opacity="0.5">
              <animate attributeName="cx" values="40;26" dur="2.8s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="cy" values="22;18" dur="2.8s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="r" values="0.9;0.15" dur="2.8s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="opacity" values="0.5;0" dur="2.8s" repeatCount="indefinite" begin="0.4s" />
            </circle>
            <circle cx="14" cy="32" r="0.8" fill="#a78bfa" opacity="0.4">
              <animate attributeName="cx" values="14;23" dur="3.5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="cy" values="32;20" dur="3.5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="r" values="0.8;0.1" dur="3.5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="opacity" values="0.4;0" dur="3.5s" repeatCount="indefinite" begin="1s" />
            </circle>
            <circle cx="36" cy="8" r="0.7" fill="#6366f1" opacity="0.45">
              <animate attributeName="cx" values="36;25" dur="3.2s" repeatCount="indefinite" begin="1.8s" />
              <animate attributeName="cy" values="8;17" dur="3.2s" repeatCount="indefinite" begin="1.8s" />
              <animate attributeName="r" values="0.7;0.1" dur="3.2s" repeatCount="indefinite" begin="1.8s" />
              <animate attributeName="opacity" values="0.45;0" dur="3.2s" repeatCount="indefinite" begin="1.8s" />
            </circle>
            <circle cx="18" cy="6" r="0.6" fill="#c4b5fd" opacity="0.35">
              <animate attributeName="cx" values="18;23" dur="2.5s" repeatCount="indefinite" begin="2.2s" />
              <animate attributeName="cy" values="6;17" dur="2.5s" repeatCount="indefinite" begin="2.2s" />
              <animate attributeName="r" values="0.6;0.1" dur="2.5s" repeatCount="indefinite" begin="2.2s" />
              <animate attributeName="opacity" values="0.35;0" dur="2.5s" repeatCount="indefinite" begin="2.2s" />
            </circle>
            <circle cx="24" cy="18" r="4" fill="#6366f1" opacity="0.08">
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
            <ellipse cx={24} cy={36} rx={4} ry={3.5} fill={color} opacity={0.85}/>
            <ellipse cx={22.5} cy={35.5} rx={2.5} ry={2.2} fill={dark} opacity={0.5}/>
            <ellipse cx={25} cy={37} rx={2} ry={1.8} fill={light} opacity={0.4}/>
            <line x1={24} y1={34} x2={24} y2={32.5} stroke={dark} strokeWidth={0.6} strokeLinecap="round"/>
            <ellipse cx={24} cy={32} rx={1.2} ry={0.8} fill="#2d5a1e" opacity={0.7}/>
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
            <ellipse cx={24} cy={27} rx={6} ry={5} fill={dark} opacity={0.7}/>
            <ellipse cx={21} cy={28} rx={4} ry={3.5} fill="#2d5a1e" opacity={0.8}/>
            <ellipse cx={27} cy={28} rx={4} ry={3.5} fill="#3a7a2e" opacity={0.7}/>
            <ellipse cx={19} cy={31} rx={3} ry={2.5} fill="#2d5a1e" opacity={0.65}/>
            <ellipse cx={29} cy={30} rx={3} ry={2.5} fill={dark} opacity={0.6}/>
            <ellipse cx={24} cy={25} rx={4} ry={3} fill="#3a7a2e" opacity={0.75}/>
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
            <ellipse cx={24} cy={21} rx={9} ry={7} fill={dark} opacity={0.6}/>
            <ellipse cx={18} cy={24} rx={5} ry={4} fill="#2d5a1e" opacity={0.8}/>
            <ellipse cx={30} cy={24} rx={5} ry={4} fill="#3a7a2e" opacity={0.75}/>
            <ellipse cx={16} cy={27} rx={4} ry={3} fill="#2d5a1e" opacity={0.7}/>
            <ellipse cx={32} cy={26} rx={4} ry={3} fill={dark} opacity={0.65}/>
            <ellipse cx={24} cy={18} rx={6} ry={4.5} fill="#3a7a2e" opacity={0.8}/>
            <ellipse cx={20} cy={20} rx={5} ry={3.5} fill="#2d5a1e" opacity={0.7}/>
            <ellipse cx={28} cy={20} rx={5} ry={3.5} fill={dark} opacity={0.65}/>
            <ellipse cx={24} cy={15} rx={4} ry={3} fill="#3a7a2e" opacity={0.6}/>
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
            <path d="M24 46 Q21 42 20.5 38 Q20 34 21 31 Q22 28 23 26 Q24 24 24 22" stroke={trunk} strokeWidth={3.3} fill="none" strokeLinecap="round"/>
            <path d="M24 46 Q27 43 27.5 39 Q28 35 27 32 Q26 29 25 27 Q24 25 24 22" stroke={trunk} strokeWidth={2.7} fill="none" strokeLinecap="round"/>
            <path d="M22 46 Q19 45 17 45.5" stroke={trunk} strokeWidth={1.5} fill="none" strokeLinecap="round"/>
            <path d="M26 46 Q29 44.5 31 45" stroke={trunk} strokeWidth={1.3} fill="none" strokeLinecap="round"/>
            <path d="M23 30 Q18 26 14 23 Q12 21 10 20" stroke={trunk} strokeWidth={1.8} fill="none" strokeLinecap="round"/>
            <path d="M25 28 Q30 24 34 22 Q36 21 38 20" stroke={trunk} strokeWidth={1.6} fill="none" strokeLinecap="round"/>
            <path d="M23.5 26 Q20 22 17 18 Q15 16 14 14" stroke={trunk} strokeWidth={1.4} fill="none" strokeLinecap="round"/>
            <path d="M24.5 25 Q28 21 31 18 Q33 16 34 14" stroke={trunk} strokeWidth={1.2} fill="none" strokeLinecap="round"/>
            <path d="M24 22 Q23 18 22 15 Q21 13 21 11" stroke={trunk} strokeWidth={1.1} fill="none" strokeLinecap="round"/>
            <path d="M10 20 Q8 19 7 20" stroke={trunk} strokeWidth={0.7} fill="none" strokeLinecap="round"/>
            <path d="M38 20 Q40 19 41 20" stroke={trunk} strokeWidth={0.6} fill="none" strokeLinecap="round"/>
            <ellipse cx={24} cy={16} rx={12} ry={8} fill="#1a4a12" opacity={0.55}/>
            <ellipse cx={16} cy={20} rx={7} ry={5} fill="#2d5a1e" opacity={0.75}/>
            <ellipse cx={32} cy={20} rx={7} ry={5} fill="#2d5a1e" opacity={0.7}/>
            <ellipse cx={12} cy={22} rx={5} ry={3.5} fill="#1a4a12" opacity={0.7}/>
            <ellipse cx={36} cy={21} rx={5} ry={3.5} fill="#1a4a12" opacity={0.65}/>
            <ellipse cx={24} cy={13} rx={8} ry={5.5} fill="#3a7a2e" opacity={0.7}/>
            <ellipse cx={19} cy={16} rx={6} ry={4} fill="#2d5a1e" opacity={0.75}/>
            <ellipse cx={29} cy={16} rx={6} ry={4} fill="#2d5a1e" opacity={0.7}/>
            <ellipse cx={24} cy={10} rx={5} ry={3.5} fill="#3a7a2e" opacity={0.6}/>
            <ellipse cx={14} cy={18} rx={5} ry={3.5} fill="#2a5220" opacity={0.65}/>
            <ellipse cx={34} cy={18} rx={5} ry={3.5} fill="#2a5220" opacity={0.6}/>
            <circle cx={12} cy={22} r={2.8} fill={`url(#${uid}-pg0)`}/>
            <circle cx={12.6} cy={21.2} r={0.6} fill="#fff" opacity={0.18}/>
            <path d="M11.2 19.3 Q12 18.8 12.8 19.3" stroke="#5a3a1e" strokeWidth={0.5} fill="none"/>
            <line x1={12} y1={19.3} x2={12} y2={18.5} stroke="#5a3a1e" strokeWidth={0.4} strokeLinecap="round"/>
            <circle cx={35} cy={19} r={3} fill={`url(#${uid}-pg1)`}/>
            <circle cx={34.3} cy={18.2} r={0.6} fill="#fff" opacity={0.16}/>
            <path d="M34.3 16.2 Q35 15.5 35.7 16.2" stroke="#5a3a1e" strokeWidth={0.5} fill="none"/>
            <line x1={35} y1={16.2} x2={35} y2={15.2} stroke="#5a3a1e" strokeWidth={0.4} strokeLinecap="round"/>
            <circle cx={22} cy={12} r={2.5} fill={`url(#${uid}-pg0)`}/>
            <circle cx={22.5} cy={11.3} r={0.5} fill="#fff" opacity={0.15}/>
            <path d="M21.3 9.7 Q22 9.2 22.7 9.7" stroke="#5a3a1e" strokeWidth={0.45} fill="none"/>
            <line x1={22} y1={9.7} x2={22} y2={8.9} stroke="#5a3a1e" strokeWidth={0.4} strokeLinecap="round"/>
            <circle cx={15} cy={17} r={2.7} fill={`url(#${uid}-pg1)`}/>
            <circle cx={15.5} cy={16.3} r={0.5} fill="#fff" opacity={0.16}/>
            <path d="M14.3 14.6 Q15 14 15.7 14.6" stroke="#5a3a1e" strokeWidth={0.45} fill="none"/>
            <line x1={15} y1={14.6} x2={15} y2={13.8} stroke="#5a3a1e" strokeWidth={0.4} strokeLinecap="round"/>
            <circle cx={33} cy={22} r={2.3} fill={`url(#${uid}-pg0)`}/>
            <circle cx={33.4} cy={21.4} r={0.45} fill="#fff" opacity={0.14}/>
            <path d="M32.3 19.8 Q33 19.3 33.7 19.8" stroke="#5a3a1e" strokeWidth={0.45} fill="none"/>
            <line x1={33} y1={19.8} x2={33} y2={19} stroke="#5a3a1e" strokeWidth={0.4} strokeLinecap="round"/>
            <circle cx={28} cy={11} r={2.6} fill={`url(#${uid}-pg0)`}/>
            <circle cx={28.5} cy={10.3} r={0.5} fill="#fff" opacity={0.14}/>
            <path d="M27.3 8.6 Q28 8 28.7 8.6" stroke="#5a3a1e" strokeWidth={0.45} fill="none"/>
            <line x1={28} y1={8.6} x2={28} y2={7.8} stroke="#5a3a1e" strokeWidth={0.4} strokeLinecap="round"/>
            <circle cx={10} cy={20.5} r={2} fill={`url(#${uid}-pg0)`}/>
            <circle cx={10.4} cy={19.9} r={0.4} fill="#fff" opacity={0.14}/>
          </g>
        )

      case 'fig':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 36" stroke="#8a8a8e" strokeWidth={1.7} strokeLinecap="round"/>
            <path d="M24 38 Q21 35 19 36" stroke="#8a8a8e" strokeWidth={0.7} fill="none" strokeLinecap="round"/>
            <path d="M24 36 Q21 32 19 30 Q18 29 20 28 Q22 29 24 33Z" fill="#2d5a1e" opacity={0.8}/>
            <path d="M24 36 Q27 32 29 30 Q30 29 28 28 Q26 29 24 33Z" fill="#1a4a14" opacity={0.7}/>
            <path d="M22 31 Q21 30 22 29" fill="#3a7a2e" opacity={0.3}/>
            <ellipse cx={24} cy={34} rx={1.8} ry={2.2} fill={color}/>
            <ellipse cx={24} cy={34} rx={1.2} ry={1.5} fill={dark} opacity={0.2}/>
            <circle cx={23.3} cy={33.5} r={0.4} fill={light} opacity={0.3}/>
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23.5 40 23.5 34 Q23.5 30 24 28" stroke="#8a8a8e" strokeWidth={2.2} fill="none" strokeLinecap="round"/>
            <path d="M24 46 Q24.5 41 24.5 35" stroke="#7a7a7e" strokeWidth={0.4} opacity={0.15} fill="none"/>
            <path d="M23.8 36 Q19 32 15 28" stroke="#8a8a8e" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
            <path d="M24.2 32 Q28 28 32 26" stroke="#8a8a8e" strokeWidth={1} fill="none" strokeLinecap="round"/>
            <path d="M15 28 Q12 25 11 23 Q10 21 12 20 Q14 21 15 24 Q16 26 15 28Z" fill="#2d5a1e" opacity={0.8}/>
            <path d="M15 28 Q18 25 19 22 Q20 20 18 19 Q16 20 15 23 Q14 26 15 28Z" fill="#1a4a14" opacity={0.7}/>
            <path d="M13 22 Q12 21 13 20" fill="#3a7a2e" opacity={0.25}/>
            <path d="M32 26 Q34 23 35 21 Q36 19 34 18 Q32 19 31 22 Q30 24 32 26Z" fill="#2d5a1e" opacity={0.75}/>
            <path d="M32 26 Q29 23 28 21 Q27 19 29 18 Q31 19 32 22Z" fill="#1a4a14" opacity={0.65}/>
            <path d="M24 28 Q21 24 19 21 Q18 19 20 18 Q22 19 24 23Z" fill="#2d5a1e" opacity={0.7}/>
            <path d="M24 28 Q27 24 29 21 Q30 19 28 18 Q26 19 24 23Z" fill="#1a4a14" opacity={0.6}/>
            <ellipse cx={17} cy={26} rx={2} ry={2.5} fill={color}/>
            <circle cx={16.3} cy={25.5} r={0.5} fill={light} opacity={0.25}/>
            <ellipse cx={30} cy={24} rx={1.8} ry={2.2} fill={color} opacity={0.8}/>
            <circle cx={29.4} cy={23.5} r={0.4} fill={light} opacity={0.2}/>
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 Q23.5 40 24 34 Q24 28 24 24" stroke="#8a8a8e" strokeWidth={2.8} fill="none" strokeLinecap="round"/>
            <path d="M24 40 L24.8 39.8" stroke="#7a7a7e" strokeWidth={0.4} opacity={0.3}/>
            <path d="M23.8 43 L24.5 42.8" stroke="#7a7a7e" strokeWidth={0.35} opacity={0.25}/>
            <path d="M24 36 Q17 32 12 30" stroke="#8a8a8e" strokeWidth={1.4} fill="none" strokeLinecap="round"/>
            <path d="M24 34 Q30 30 36 28" stroke="#8a8a8e" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
            <path d="M12 30 Q10 28 9 28" stroke="#8a8a8e" strokeWidth={0.8} fill="none" strokeLinecap="round"/>
            <path d="M36 28 Q38 26 39 26" stroke="#8a8a8e" strokeWidth={0.7} fill="none" strokeLinecap="round"/>
            <path d="M10 28 Q7 24 6 21 Q5 18 7 17 Q9 18 10 22 Q11 25 10 28Z" fill="#2d5a1e" opacity={0.8}/>
            <path d="M10 28 Q13 25 14 22 Q15 19 13 17 Q11 18 10 22 Q9 25 10 28Z" fill="#1a4a14" opacity={0.7}/>
            <path d="M10 28 Q11 26 11 24 Q10 22 10 24Z" fill="#3a7a2e" opacity={0.2}/>
            <path d="M38 26 Q40 23 41 20 Q42 17 40 16 Q38 17 37 20 Q36 23 38 26Z" fill="#2d5a1e" opacity={0.75}/>
            <path d="M38 26 Q35 23 34 20 Q33 17 35 16 Q37 17 38 20Z" fill="#1a4a14" opacity={0.65}/>
            <path d="M24 24 Q20 20 18 16 Q17 13 19 12 Q21 13 22 17 Q23 20 24 24Z" fill="#2d5a1e" opacity={0.75}/>
            <path d="M24 24 Q28 20 30 16 Q31 13 29 12 Q27 13 26 17Z" fill="#1a4a14" opacity={0.65}/>
            <path d="M12 30 Q10 28 8 26 Q7 24 9 23 Q11 24 12 27Z" fill="#2d5a1e" opacity={0.6}/>
            <path d="M36 28 Q38 26 40 24 Q41 22 39 21 Q37 22 36 25Z" fill="#1a4a14" opacity={0.55}/>
            <path d="M14 16 Q12 14 11 12 Q10 10 12 9 Q14 10 15 13Z" fill="#2d5a1e" opacity={0.5}/>
            <path d="M34 16 Q36 14 37 12 Q38 10 36 9 Q34 10 33 13Z" fill="#1a4a14" opacity={0.45}/>
            <ellipse cx={9} cy={26} rx={2.2} ry={2.8} fill={color}/>
            <ellipse cx={9} cy={26} rx={1.3} ry={1.7} fill={dark} opacity={0.2}/>
            <circle cx={8.3} cy={25.3} r={0.5} fill={light} opacity={0.25}/>
            <ellipse cx={36} cy={24} rx={2} ry={2.5} fill={color} opacity={0.85}/>
            <circle cx={35.4} cy={23.5} r={0.45} fill={light} opacity={0.2}/>
            <ellipse cx={22} cy={20} rx={1.8} ry={2.3} fill={color} opacity={0.8}/>
            <ellipse cx={28} cy={18} rx={1.5} ry={2} fill={color} opacity={0.7}/>
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-fg0`} cx="40%" cy="35%"><stop offset="0%" stopColor={light}/><stop offset="100%" stopColor={color}/></radialGradient>
            </defs>
            <path d="M23.5 46 C23 42 22.5 38 23 34 Q23.5 30 24 26 Q24 23 24 20" stroke="#8a8a8e" strokeWidth={3.3} fill="none" strokeLinecap="round"/>
            <path d="M23.5 46 C24 43 24.5 39 24.3 35" stroke="#7a7a7e" strokeWidth={0.7} opacity={0.12} fill="none"/>
            <path d="M22.5 46 Q19.5 45 17.5 45.5" stroke="#8a8a8e" strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.4}/>
            <path d="M25.5 46 Q28 45 30 45.5" stroke="#8a8a8e" strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.35}/>
            <path d="M24 30 Q18 26 12 22 Q10 20 8 18" stroke="#8a8a8e" strokeWidth={1.8} fill="none" strokeLinecap="round"/>
            <path d="M24 28 Q30 24 36 20 Q38 18 40 16" stroke="#8a8a8e" strokeWidth={1.6} fill="none" strokeLinecap="round"/>
            <path d="M24 26 Q20 22 16 18 Q14 16 12 14" stroke="#8a8a8e" strokeWidth={1.3} fill="none" strokeLinecap="round"/>
            <path d="M24 24 Q28 20 32 16 Q34 14 36 12" stroke="#8a8a8e" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
            <path d="M24 22 Q22 18 20 14" stroke="#8a8a8e" strokeWidth={1} fill="none" strokeLinecap="round"/>
            <path d="M8 18 Q6 17 5 18" stroke="#8a8a8e" strokeWidth={0.7} fill="none" strokeLinecap="round"/>
            <path d="M40 16 Q42 15 43 16" stroke="#8a8a8e" strokeWidth={0.6} fill="none" strokeLinecap="round"/>
            <path d="M12 14 Q10 13 9 14" stroke="#8a8a8e" strokeWidth={0.6} fill="none" strokeLinecap="round"/>
            <path d="M36 12 Q38 11 39 12" stroke="#8a8a8e" strokeWidth={0.5} fill="none" strokeLinecap="round"/>
            <path d="M6 18 Q3 14 2 11 Q1 8 3 7 Q5 8 6 12 Q7 15 6 18Z" fill="#2d5a1e" opacity={0.8}/>
            <path d="M6 18 Q9 15 10 12 Q11 9 9 7 Q7 8 6 12Z" fill="#1a4a14" opacity={0.7}/>
            <path d="M6 18 Q4 16 3 14 Q5 13 6 15Z" fill="#3a7a2e" opacity={0.25}/>
            <path d="M42 16 Q44 12 45 9 Q46 6 44 5 Q42 6 41 10 Q40 13 42 16Z" fill="#2d5a1e" opacity={0.75}/>
            <path d="M42 16 Q39 13 38 10 Q37 7 39 6 Q41 7 42 10Z" fill="#1a4a14" opacity={0.65}/>
            <path d="M10 14 Q7 10 6 7 Q5 4 7 3 Q9 4 10 8 Q11 11 10 14Z" fill="#2d5a1e" opacity={0.7}/>
            <path d="M10 14 Q13 11 14 8 Q15 5 13 4 Q11 5 10 8Z" fill="#1a4a14" opacity={0.6}/>
            <path d="M38 12 Q40 9 41 6 Q42 3 40 2 Q38 3 37 7Z" fill="#2d5a1e" opacity={0.65}/>
            <path d="M38 12 Q35 9 34 6 Q33 3 35 2 Q37 3 38 7Z" fill="#1a4a14" opacity={0.55}/>
            <path d="M20 14 Q17 10 16 7 Q15 4 17 3 Q19 4 20 8Z" fill="#2d5a1e" opacity={0.6}/>
            <path d="M20 14 Q23 11 24 8 Q25 5 23 4 Q21 5 20 8Z" fill="#1a4a14" opacity={0.5}/>
            <path d="M15 14.5 Q13 12 12 11 Q14 10 15 12Z" fill="#2d5a1e" opacity={0.5}/>
            <path d="M33 12.5 Q35 10.5 36 10 Q35 12 33 12.5Z" fill="#1a4a14" opacity={0.45}/>
            <path d="M34 16 Q36 13 37 10 Q38 7 36 6 Q34 7 33 10 Q32 13 34 16Z" fill="#2d5a1e" opacity={0.6}/>
            <path d="M34 16 Q31 13 30 10 Q29 7 31 6 Q33 7 34 10Z" fill="#1a4a14" opacity={0.5}/>
            <path d="M24 20 Q22 17 21 14 Q20 11 22 10 Q24 11 24 14Z" fill="#2d5a1e" opacity={0.55}/>
            <path d="M24 20 Q26 17 27 14 Q28 11 26 10 Q24 11 24 14Z" fill="#1a4a14" opacity={0.45}/>
            <ellipse cx={7} cy={16} rx={2.5} ry={3} fill={`url(#${uid}-fg0)`}/>
            <ellipse cx={7} cy={16} rx={1.5} ry={1.8} fill={dark} opacity={0.2}/>
            <circle cx={6.3} cy={15.2} r={0.6} fill={light} opacity={0.25}/>
            <ellipse cx={40} cy={14} rx={2.2} ry={2.8} fill={`url(#${uid}-fg0)`}/>
            <circle cx={39.4} cy={13.2} r={0.5} fill={light} opacity={0.22}/>
            <ellipse cx={12} cy={12} rx={2} ry={2.5} fill={color}/>
            <circle cx={11.4} cy={11.3} r={0.45} fill={light} opacity={0.2}/>
            <ellipse cx={36} cy={10} rx={1.8} ry={2.3} fill={color} opacity={0.85}/>
            <ellipse cx={20} cy={12} rx={1.5} ry={2} fill={color} opacity={0.7}/>
            <ellipse cx={28} cy={10} rx={1.3} ry={1.8} fill={color} opacity={0.6}/>
            <ellipse cx={16} cy={20} rx={3} ry={2} fill="#2d5a1e" opacity={0.35}/>
            <ellipse cx={32} cy={18} rx={3} ry={2} fill="#1a4a14" opacity={0.3}/>
            {/* Extra leaf clusters filling canopy gaps */}
            <path d="M8 12 Q6 9 5 7 Q4 5 6 4 Q8 5 8 8 Q8 10 8 12Z" fill="#2d5a1e" opacity={0.55}/>
            <path d="M8 12 Q10 10 11 7 Q12 5 10 4 Q8 5 8 8Z" fill="#1a4a14" opacity={0.45}/>
            <path d="M28 18 Q26 15 25 12 Q24 9 26 8 Q28 9 28 12 Q28 15 28 18Z" fill="#2d5a1e" opacity={0.5}/>
            <path d="M28 18 Q30 15 31 12 Q32 9 30 8 Q28 9 28 12Z" fill="#1a4a14" opacity={0.4}/>
            <path d="M16 10 Q14 7 13 5 Q12 3 14 2 Q16 3 16 6Z" fill="#2d5a1e" opacity={0.45}/>
            <path d="M16 10 Q18 8 19 5 Q20 3 18 2 Q16 3 16 6Z" fill="#1a4a14" opacity={0.38}/>
            <path d="M32 20 Q30 18 29 16 Q30 15 32 17Z" fill="#2d5a1e" opacity={0.4}/>
            <path d="M12 22 Q10 20 9 18 Q10 17 12 19Z" fill="#1a4a14" opacity={0.35}/>
            <path d="M22 8 Q20 5 20 3 Q22 2 23 4 Q24 6 22 8Z" fill="#3a7a2e" opacity={0.4}/>
            <path d="M26 6 Q28 4 29 2 Q27 1 25 3 Q24 5 26 6Z" fill="#2d5a1e" opacity={0.35}/>
            <path d="M40 10 Q42 8 43 6 Q41 5 39 7 Q38 9 40 10Z" fill="#2d5a1e" opacity={0.4}/>
            <path d="M4 14 Q3 12 3 10 Q4 9 5 11 Q5 13 4 14Z" fill="#1a4a14" opacity={0.35}/>
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
              <radialGradient id={`${uid}-canopy`} cx="45%" cy="40%">
                <stop offset="0%" stopColor="#3a8a5a" />
                <stop offset="50%" stopColor="#2d6a4f" />
                <stop offset="100%" stopColor="#1a4a34" />
              </radialGradient>
            </defs>
            <ellipse cx="24" cy="44" rx="18" ry="3" fill={`url(#${uid}-water)`} />
            <ellipse cx="24" cy="44.5" rx="12" ry="1" fill="#4a8a7a" opacity="0.08">
              <animate attributeName="rx" values="12;13;12" dur="5s" repeatCount="indefinite" />
            </ellipse>
            <path d="M24 46 Q22 41 21 37 Q20 34 21 31" stroke="#5a4a38" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M22 39 Q17 42 12 46" stroke="#5a4a38" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 38 Q28 42 33 46" stroke="#5a4a38" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d="M22 40 Q19 43 15 46" stroke="#4a3a28" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M23 39 Q26 43 30 46" stroke="#4a3a28" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M21.5 42 Q19 44.5 16.5 46" stroke="#4a3a28" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M24 41 Q27.5 44 31 46" stroke="#4a3a28" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d="M21 33 Q16 28 10 26" stroke="#5a4a38" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M21 31 Q27 26 33 24" stroke="#5a4a38" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M21 29 Q19 24 18 20" stroke="#5a4a38" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M7 24 C4 21 5 17 9 16 C13 15 16 19 14 23 C12 26 8 26 7 24Z" fill={`url(#${uid}-canopy)`} />
            <path d="M9 18 C8 17 9 15.5 11 16.5Z" fill="#4a9a7a" opacity="0.35" />
            <path d="M14 22 C11 18 13 14 17 14.5 C21 15 21 20 17 22Z" fill="#276749" />
            <path d="M17 16 Q16 15 17 14.5 Q18 15.5 17 16Z" fill="#4a9a7a" opacity="0.3" />
            <path d="M31 22 C28 18 30 14 34 15 C38 16 38 21 34 23Z" fill={`url(#${uid}-canopy)`} />
            <path d="M34 17 C33 16 34 14.5 36 15.5Z" fill="#4a9a7a" opacity="0.3" />
            <path d="M19 26 C16 23 18 20 22 20.5 C25 21 24 25 20 27Z" fill="#2d6a4f" opacity="0.85" />
            <path d="M16 18 C14 15 16 12 19 13 C22 14 21 18 18 19Z" fill="#276749" opacity="0.8" />
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
            <path d="M21 38 Q15 41 9 46" stroke="#5a4a38" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M22 37 Q28 41 35 46" stroke="#5a4a38" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M21 39 Q17 42 13 46" stroke="#4a3a28" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.8" />
            <path d="M22 38 Q26 42 31 46" stroke="#4a3a28" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M20.5 40 Q18 43 14.5 46" stroke="#4a3a28" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M23 40 Q27 44 32.5 46" stroke="#4a3a28" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.45" />
            <path d="M20 41 Q16.5 44 12 46" stroke="#4a3a28" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M23.5 41 Q28.5 44.5 34 46" stroke="#4a3a28" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.25" />
            {/* Root knees breaking water surface */}
            <path d="M12 45 Q11.5 43.5 12.5 44" stroke="#5a4a38" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M33 44.5 Q33.5 43 34 44" stroke="#5a4a38" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.4" />
            {/* Bark texture on trunk */}
            <path d="M21 36 Q20.5 34 21.5 33" stroke="#4a3a28" strokeWidth="0.4" opacity="0.2" fill="none" />
            <path d="M20.5 30 Q21.5 28.5 21 27" stroke="#4a3a28" strokeWidth="0.35" opacity="0.15" fill="none" />
            <ellipse cx="20.8" cy="34" rx="0.7" ry="0.4" fill="#4a3a28" opacity="0.12" />
            {/* Branches */}
            <path d="M21.5 30 C17 26 11 24 5 22" stroke="#5a4a38" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M22 27 C27 22 34 18 40 16" stroke="#5a4a38" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d="M21.5 28 C19 23 17 18 16 14" stroke="#5a4a38" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M22 25 C25 21 28 18 30 16" stroke="#5a4a38" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M22 23 C20 20 18 17 16 16" stroke="#5a4a38" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Sub-branches */}
            <path d="M8 23 C6 21 4 20 2 21" stroke="#5a4a38" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M12 21 C10 19 8 18.5 6 19" stroke="#5a4a38" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M38 17 C40 15.5 42 15 44 16" stroke="#5a4a38" strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M34 19 C36 17 38 17 40 18.5" stroke="#5a4a38" strokeWidth="0.45" strokeLinecap="round" fill="none" />
            {/* Canopy — dense, layered leaf masses with depth */}
            <path d="M2 20 C0 16 1 12 5 11 C10 10 14 14 14 18 C14 22 10 24 6 23 C3 22 1 21 2 20Z" fill={`url(#${uid}-canopy)`} />
            <path d="M4 14 C3 13 4 11.5 6 12 C8 12.5 7.5 14.5 5 14.5Z" fill="#4a9a7a" opacity="0.3" />
            <path d="M10 14 C8 10 10 7 14 7.5 C18 8 19 13 15 16 C12 18 9 17 10 14Z" fill="#276749" />
            <path d="M14 9 Q13 8 14 7.5 Q15 8.5 14 9Z" fill="#5aaa7a" opacity="0.25" />
            <path d="M36 14 C33 10 35 6 39 7 C43 8 44 13 40 16 C37 18 34 16 36 14Z" fill={`url(#${uid}-canopy)`} />
            <path d="M39 9 C38 8 39 6.5 41 7.5Z" fill="#4a9a7a" opacity="0.28" />
            <path d="M30 16 C27 12 29 8 33 9 C37 10 37 15 33 18 C30 20 28 18 30 16Z" fill="#276749" />
            <path d="M33 11 Q32 10 33 9 Q34 10.5 33 11Z" fill="#5aaa7a" opacity="0.22" />
            <path d="M17 20 C14 16 16 12 20 12.5 C24 13 24 18 20 21 C17 23 15 22 17 20Z" fill="#2d6a4f" opacity="0.9" />
            <path d="M20 14 Q19 13 20 12.5 Q21 13.5 20 14Z" fill="#4a9a7a" opacity="0.25" />
            <path d="M25 18 C22 14 24 10 28 11 C32 12 32 17 28 19Z" fill="#276749" opacity="0.85" />
            <path d="M14 16 C12 13 14 10 17 11 C20 12 19 16 16 17Z" fill="#2d6a4f" opacity="0.75" />
            <path d="M22 12 C20 8 22 5 25 6 C28 7 28 12 25 14Z" fill="#276749" opacity="0.7" />
            {/* Epiphytes — small ferns/orchids on branches */}
            <path d="M8 22 Q7 20.5 8.5 21 Q9 22 8 22Z" fill="#5aaa7a" opacity="0.5" />
            <path d="M34 17 Q33 15.5 34.5 16 Q35 17 34 17Z" fill="#5aaa7a" opacity="0.4" />
            <path d="M18 18 Q17 16.5 18.5 17 Q19 18 18 18Z" fill="#6aba8a" opacity="0.35" />
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
            <path d="M24 46 Q23 41 23 36 Q22.5 33 23 30" stroke="#6a7a8a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 36 Q19 33 16 30" stroke="#6a7a8a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 33 Q27 29 30 27" stroke="#6a7a8a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M14 28 C11 25 12 22 16 22 C19 22 20 26 17 28Z" fill="#7a9ab8" />
            <path d="M16 24 C15 23 16 22 17 23Z" fill="#a8cce0" opacity="0.4" />
            <path d="M28 25 C25 22 27 19 31 20 C34 21 33 25 30 26Z" fill="#8aacca" />
            <path d="M31 22 Q30 21 31 20 Q32 21.5 31 22Z" fill="#c0daea" opacity="0.35" />
            <path d="M20 30 C18 28 19 26 22 26.5 C24 27 23 29 20 30Z" fill="#7a9ab8" opacity="0.8" />
            {/* Snow on branches */}
            <path d="M16 30 Q14.5 29 16 28.5" stroke="#e8f0f8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M30 27 Q29 26 30.5 25.5" stroke="#e8f0f8" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.45" />
            {/* Frost sparkles */}
            <circle cx="15" cy="26" r="0.4" fill="#fff" opacity="0.35">
              <animate attributeName="opacity" values="0.35;0.1;0.35" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="30" cy="23" r="0.35" fill="#fff" opacity="0.3">
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
            <path d="M24 46 Q22 40 22 34 Q21.5 30 22.5 27" stroke="#6a7a8a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q22 40 22 34" stroke="#5a6a7a" strokeWidth="1" opacity="0.12" strokeLinecap="round" fill="none" />
            <path d="M22 34 Q16 28 10 26" stroke="#6a7a8a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d="M22.5 30 Q28 24 34 22" stroke="#6a7a8a" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <path d="M22 28 Q19 22 18 18" stroke="#6a7a8a" strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M22.5 27 Q25 23 28 20" stroke="#6a7a8a" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            {/* Foliage — icy blue-silver masses */}
            <path d="M7 24 C4 20 5 16 9 15 C13 14 16 18 15 22 C14 25 10 26 7 24Z" fill={`url(#${uid}-ice)`} />
            <path d="M9 17 C8 16 9 14.5 11 15.5Z" fill="#c0daea" opacity="0.35" />
            <path d="M13 20 C10 16 12 12 16 13 C20 14 19 19 15 21Z" fill="#7a9ab8" />
            <path d="M16 15 Q15 14 16 13 Q17 14.5 16 15Z" fill="#c0daea" opacity="0.3" />
            <path d="M32 20 C29 16 31 12 35 13 C39 14 39 19 35 21Z" fill={`url(#${uid}-ice)`} />
            <path d="M35 15 C34 14 35 12.5 37 13.5Z" fill="#c0daea" opacity="0.3" />
            <path d="M26 18 C23 14 25 10 29 11 C33 12 32 17 28 19Z" fill="#7a9ab8" opacity="0.85" />
            <path d="M19 24 C16 20 18 17 22 17.5 C25 18 24 23 20 25Z" fill="#8aacca" opacity="0.8" />
            <path d="M16 16 C14 13 16 10 19 11 C22 12 21 16 18 17Z" fill="#6a8aa4" opacity="0.75" />
            {/* Snow caps on foliage */}
            <path d="M5 15 Q7 13.5 9 14 Q11 13.5 13 14.5" stroke="none" fill="#e8f0f8" opacity="0.5" />
            <path d="M5 15 Q7 14 9 14 Q11 14 13 14.5 Q11 12.5 9 13 Q7 12.5 5 15Z" fill="#f0f6fc" opacity="0.55" />
            <path d="M31 12 Q33 11 35 12 Q37 11 39 12.5" stroke="none" fill="#e8f0f8" opacity="0.45" />
            <path d="M31 12 Q33 11.5 35 12 Q37 11.5 39 12.5 Q37 10.5 35 11 Q33 10.5 31 12Z" fill="#f0f6fc" opacity="0.5" />
            <path d="M14 12 Q16 10.5 18 11.5" fill="#e8f0f8" opacity="0.4" />
            {/* Snow on branches */}
            <path d="M10 26 Q9 25 10 24.5" stroke="#e8f0f8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M34 22 Q33 21 34 20.5" stroke="#e8f0f8" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.45" />
            <path d="M18 18 Q17 17 18 16.5" stroke="#e8f0f8" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
            {/* Icicles hanging from branches */}
            <path d="M9 26 L8.5 28.5" stroke="#c0daea" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M10.5 26 L10 28" stroke="#c0daea" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d="M34.5 22 L34 24.5" stroke="#c0daea" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.38" />
            <path d="M36 22 L35.5 24" stroke="#c0daea" strokeWidth="0.35" strokeLinecap="round" fill="none" opacity="0.3" />
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
              <radialGradient id={`${uid}-ice`} cx="45%" cy="40%">
                <stop offset="0%" stopColor="#b8d8ec" />
                <stop offset="40%" stopColor="#8aacca" />
                <stop offset="100%" stopColor="#5a7a94" />
              </radialGradient>
              <filter id={`${uid}-frostglow`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <style>{`
                @keyframes wvSnow-${uid} {
                  0% { transform: translateY(0); opacity: 0.5; }
                  100% { transform: translateY(16px); opacity: 0; }
                }
                @keyframes wvShimmer-${uid} {
                  0%, 100% { opacity: 0.5; }
                  50% { opacity: 0.1; }
                }
              `}</style>
            </defs>
            {/* Trunk — silvery bark with frost */}
            <path d="M24 46 C23 42 21 38 20.5 34 C20 30 21 27 22 24 C22.5 22 23 20 23 19" stroke="#6a7a8a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M24 46 C23 42 21 38 20.5 34 C20 30 21 27 22 24" stroke="#8a9aaa" strokeWidth="1" opacity="0.15" strokeLinecap="round" fill="none" />
            {/* Bark detail */}
            <path d="M21 36 Q20.5 34 21.5 33" stroke="#5a6a7a" strokeWidth="0.4" opacity="0.2" fill="none" />
            <path d="M20.8 30 Q21.5 28.5 21 27" stroke="#5a6a7a" strokeWidth="0.35" opacity="0.15" fill="none" />
            <ellipse cx="21" cy="34" rx="0.7" ry="0.4" fill="#5a6a7a" opacity="0.12" />
            {/* Root flare with frost */}
            <path d="M22.5 46 C21 45 18 44 15 46" stroke="#6a7a8a" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M25 46 C26.5 45 29 44.5 31 46" stroke="#6a7a8a" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.25" />
            {/* Frost on trunk */}
            <path d="M21 38 Q20 37 21 36.5" stroke="#d0e4f0" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M20.5 32 Q20 31 20.5 30.5" stroke="#d0e4f0" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.25" />
            {/* Main branches */}
            <path d="M21 30 C17 26 11 23 4 21" stroke="#6a7a8a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M22 25 C27 20 34 16 42 14" stroke="#6a7a8a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M21.5 27 C18 22 15 16 14 10" stroke="#6a7a8a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M22 23 C25 19 29 16 33 14" stroke="#6a7a8a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M22 21 C20 17 18 14 16 12" stroke="#6a7a8a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M22.5 19 C24 17 26 15 28 14" stroke="#6a7a8a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            {/* Sub-branches */}
            <path d="M7 22 C5 20 3 19 1 20" stroke="#6a7a8a" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M11 20 C9 18 7 17.5 5 18" stroke="#6a7a8a" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M39 15 C41 13.5 43 13 45 14" stroke="#6a7a8a" strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M35 17 C37 15.5 39 15 41 16" stroke="#6a7a8a" strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M15 12 C13 10 11 9 9 9.5" stroke="#6a7a8a" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M17 14 C15 12 13 11.5 11 12" stroke="#6a7a8a" strokeWidth="0.4" strokeLinecap="round" fill="none" />
            {/* Canopy — icy blue foliage with frosted edges */}
            <g filter={`url(#${uid}-frostglow)`}>
              <path d="M1 19 C-1 15 0 11 4 10 C9 9 13 13 13 17 C13 21 9 23 5 22 C2 21 0 20 1 19Z" fill={`url(#${uid}-ice)`} />
              <path d="M9 13 C7 10 9 7 13 8 C17 9 18 14 14 16 C11 18 8 16 9 13Z" fill="#7a9ab8" />
              <path d="M34 12 C31 8 33 4 37 5 C41 6 42 11 38 14 C35 16 32 14 34 12Z" fill={`url(#${uid}-ice)`} />
              <path d="M28 14 C25 10 27 6 31 7 C35 8 35 13 31 16 C28 18 26 16 28 14Z" fill="#7a9ab8" opacity="0.9" />
              <path d="M18 18 C15 14 17 10 21 11 C25 12 25 17 21 20 C18 22 16 20 18 18Z" fill="#8aacca" opacity="0.85" />
              <path d="M13 10 C11 7 13 4 16 5 C19 6 19 10 16 12 C13 13 12 12 13 10Z" fill="#6a8aa4" opacity="0.8" />
              <path d="M24 12 C22 8 24 5 27 6 C30 7 30 12 27 14Z" fill="#7a9ab8" opacity="0.75" />
              <path d="M40 14 C38 11 40 8 43 9 C46 10 45 14 42 16Z" fill="#8aacca" opacity="0.7" />
            </g>
            {/* Snow caps — thick, sculpted, sitting on top of foliage */}
            <path d="M0 10 Q2 8 4 9 Q6 7.5 8 8.5 Q10 7 12 8.5 Q14 9 13 11 Q11 9.5 9 10 Q7 8.5 5 10 Q3 9 1 11Z" fill="#f0f6fc" opacity="0.6" />
            <path d="M0 10 Q2 8.5 4 9 Q6 8 8 8.5 Q10 7.5 12 8.5 L13 10 Q11 9 9 9.5 Q7 9 5 9.5 Q3 9.5 1 10.5Z" fill="#fff" opacity="0.35" />
            <path d="M9 7 Q11 5.5 13 7 Q15 5.5 17 7 Q15 6 13 6.5 Q11 6 9 7Z" fill="#f0f6fc" opacity="0.55" />
            <path d="M32 5 Q34 3.5 36 4.5 Q38 3 40 4 Q42 3.5 44 5 Q42 4 40 4.5 Q38 3.5 36 4.5 Q34 4 32 5Z" fill="#f0f6fc" opacity="0.55" />
            <path d="M32 5 Q34 4 36 4.5 Q38 3.5 40 4.5 L42 5 Q40 4.5 38 4 Q36 4.5 34 4.5 Q33 4.5 32 5.5Z" fill="#fff" opacity="0.3" />
            <path d="M25 6 Q27 4.5 29 5.5 Q31 4 33 5.5 Q31 4.5 29 5 Q27 5 25 6Z" fill="#f0f6fc" opacity="0.5" />
            {/* Snow on branches */}
            <path d="M4 21 Q3 20 4 19.5 Q5.5 19 6 20" stroke="none" fill="#e8f0f8" opacity="0.5" />
            <path d="M39 15 Q38 14 39 13.5 Q40.5 13 41 14" stroke="none" fill="#e8f0f8" opacity="0.45" />
            <path d="M14 10 Q13 9 14 8.5 Q15 8.5 15 9.5" stroke="none" fill="#e8f0f8" opacity="0.4" />
            <path d="M18 18 Q17 17 18 16.5 Q19 16.5 19 17.5" stroke="none" fill="#e8f0f8" opacity="0.35" />
            {/* Icicles — translucent, tapered */}
            <path d="M4 22 Q3.8 24 3.5 26.5" stroke="#b0d0e4" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d="M5.5 22 Q5.3 24 5 25.5" stroke="#b0d0e4" strokeWidth="0.45" strokeLinecap="round" fill="none" opacity="0.3" />
            <path d="M7 22 Q6.8 23.5 6.5 24.5" stroke="#b0d0e4" strokeWidth="0.35" strokeLinecap="round" fill="none" opacity="0.25" />
            <path d="M40 15 Q39.8 17 39.5 19" stroke="#b0d0e4" strokeWidth="0.55" strokeLinecap="round" fill="none" opacity="0.33" />
            <path d="M41.5 15 Q41.3 16.5 41 17.5" stroke="#b0d0e4" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.28" />
            <path d="M15 10.5 Q14.8 12 14.5 13.5" stroke="#b0d0e4" strokeWidth="0.45" strokeLinecap="round" fill="none" opacity="0.3" />
            {/* Frost sparkles across canopy */}
            <circle cx="6" cy="14" r="0.5" fill="#fff" opacity="0.5" style={{animation: `wvShimmer-${uid} 3s ease-in-out infinite`} as React.CSSProperties} />
            <circle cx="36" cy="8" r="0.45" fill="#fff" opacity="0.45" style={{animation: `wvShimmer-${uid} 4s ease-in-out 1s infinite`} as React.CSSProperties} />
            <circle cx="16" cy="8" r="0.4" fill="#fff" opacity="0.4" style={{animation: `wvShimmer-${uid} 3.5s ease-in-out 0.5s infinite`} as React.CSSProperties} />
            <circle cx="27" cy="10" r="0.35" fill="#fff" opacity="0.35" style={{animation: `wvShimmer-${uid} 4.5s ease-in-out 2s infinite`} as React.CSSProperties} />
            <circle cx="42" cy="12" r="0.3" fill="#fff" opacity="0.3" style={{animation: `wvShimmer-${uid} 3s ease-in-out 1.5s infinite`} as React.CSSProperties} />
            <circle cx="12" cy="16" r="0.35" fill="#fff" opacity="0.35" style={{animation: `wvShimmer-${uid} 5s ease-in-out 3s infinite`} as React.CSSProperties} />
            {/* Falling snowflakes */}
            <circle cx="10" cy="6" r="0.6" fill="#fff" opacity="0.4" style={{animation: `wvSnow-${uid} 5s linear infinite`} as React.CSSProperties} />
            <circle cx="30" cy="4" r="0.5" fill="#e8f0f8" opacity="0.35" style={{animation: `wvSnow-${uid} 6s linear 2s infinite`} as React.CSSProperties} />
            <circle cx="20" cy="3" r="0.45" fill="#fff" opacity="0.3" style={{animation: `wvSnow-${uid} 4.5s linear 1s infinite`} as React.CSSProperties} />
            <circle cx="40" cy="8" r="0.4" fill="#e8f0f8" opacity="0.25" style={{animation: `wvSnow-${uid} 7s linear 3.5s infinite`} as React.CSSProperties} />
            <circle cx="5" cy="10" r="0.35" fill="#fff" opacity="0.3" style={{animation: `wvSnow-${uid} 5.5s linear 4s infinite`} as React.CSSProperties} />
            {/* Frozen ground frost */}
            <ellipse cx="24" cy="46" rx="16" ry="2" fill="#c0daea" opacity="0.08" />
            <path d="M12 46 Q14 45 16 46" stroke="#d0e4f0" strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M30 46 Q32 45 34 46" stroke="#d0e4f0" strokeWidth="0.3" fill="none" opacity="0.12" />
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
            {/* Fronds — 8 spreading */}
            <path d="M21 18 Q12 14 4 14 Q12 12 20 16" fill={color} opacity="0.7" />
            <path d="M21 18 Q32 12 42 12 Q32 10 21.5 15" fill={color} opacity="0.65" />
            <path d="M21 18 Q14 10 10 6 Q16 10 21 15" fill={color} opacity="0.65" />
            <path d="M21 18 Q28 10 34 6 Q28 10 21.5 15" fill={color} opacity="0.6" />
            <path d="M21 18 Q21 10 23 4 Q23 10 21.5 15" fill={color} opacity="0.6" />
            <path d="M21 18 Q16 12 12 8 Q18 12 21 15" fill={light} opacity="0.25" />
            <path d="M21 18 Q26 12 30 8 Q26 12 21.5 15" fill={dark} opacity="0.1" />
            <path d="M21 18 Q10 16 4 18 Q10 14 20 16" fill={dark} opacity="0.12" />
            {/* Midribs */}
            <path d="M21 17 Q12 14 5 14" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.25" />
            <path d="M21 17 Q32 12 41 12" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M21 17 Q14 10 11 7" stroke={dark} strokeWidth="0.45" fill="none" opacity="0.18" />
            <path d="M21 17 Q28 10 33 7" stroke={dark} strokeWidth="0.45" fill="none" opacity="0.18" />
            <path d="M21 17 Q21 10 23 5" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            {/* Coconut cluster at crown */}
            <circle cx="20" cy="19" r="1.2" fill="#c89040" opacity="0.7" />
            <circle cx="22.5" cy="19.5" r="1" fill="#b07830" opacity="0.6" />
          </g>
        )

      case 'olivetree':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 23 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="41" rx="3" ry="2" fill="#8B7355" opacity="0.4" />
            <path d="M23 38 Q22 36 23.5 34" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Small silver-green leaves */}
            <ellipse cx="21" cy="33" rx="3" ry="1.5" fill={color} opacity="0.6" transform="rotate(-30 21 33)" />
            <ellipse cx="26" cy="34" rx="2.5" ry="1.3" fill={color} opacity="0.55" transform="rotate(20 26 34)" />
            <ellipse cx="22" cy="33" rx="1.5" ry="0.8" fill={light} opacity="0.25" transform="rotate(-30 22 33)" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Slightly twisted trunk */}
            <path d="M24 46 Q22 40 21 34 Q20 30 22 28" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 36 L24.5 35.5" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            {/* Sparse foliage */}
            <ellipse cx="22" cy="22" rx="7" ry="5" fill={color} opacity="0.55" />
            <ellipse cx="20" cy="20" rx="3" ry="2.5" fill={light} opacity="0.2" />
            <ellipse cx="26" cy="24" rx="3" ry="2" fill={dark} opacity="0.12" />
            {/* Silver leaf highlights */}
            <ellipse cx="18" cy="22" rx="2" ry="1" fill={light} opacity="0.3" transform="rotate(-15 18 22)" />
            <ellipse cx="26" cy="20" rx="2" ry="1" fill={light} opacity="0.25" transform="rotate(10 26 20)" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Twisted trunk */}
            <path d="M25 46 Q22 40 20 34 Q18 30 19 26 Q20 24 22 22" stroke={trunk} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q23 42 22 38" stroke={dark} strokeWidth="1" fill="none" opacity="0.15" />
            <path d="M22 32 L24 31.5" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M21 28 L23 27.5" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            {/* Branch */}
            <path d="M21 28 Q28 24 32 22" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Sparse canopy — multiple clusters */}
            <ellipse cx="22" cy="18" rx="8" ry="6" fill={color} opacity="0.5" />
            <ellipse cx="30" cy="20" rx="5" ry="4" fill={color} opacity="0.45" />
            <ellipse cx="16" cy="20" rx="4" ry="3.5" fill={color} opacity="0.4" />
            {/* Silver highlights */}
            <ellipse cx="19" cy="16" rx="3" ry="1.5" fill={light} opacity="0.3" transform="rotate(-10 19 16)" />
            <ellipse cx="28" cy="18" rx="2.5" ry="1.2" fill={light} opacity="0.25" transform="rotate(15 28 18)" />
            <ellipse cx="14" cy="20" rx="2" ry="1" fill={light} opacity="0.2" transform="rotate(-20 14 20)" />
            {/* Small olives */}
            <circle cx="26" cy="22" r="1" fill="#3a4a30" opacity="0.6" />
            <circle cx="18" cy="20" r="0.8" fill="#3a4a30" opacity="0.5" />
            <path d="M24 46 Q21 44.5 18 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-otrunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            {/* Gnarled twisted trunk */}
            <path d="M26 46 Q22 40 19 34 Q16 28 18 24 Q19 20 22 18" stroke={trunk} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M26 46 Q22 40 19 34 Q16 28 18 24 Q19 20 22 18" stroke={`url(#${uid}-otrunk)`} strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Trunk texture — knots */}
            <path d="M22 36 Q24 35 25 36" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.3" />
            <path d="M20 30 Q22 29 23 30" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.25" />
            <ellipse cx="21" cy="33" rx="1.2" ry="0.8" fill={dark} opacity="0.15" />
            {/* Branches */}
            <path d="M20 26 Q14 22 10 20" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M21 22 Q28 18 34 16" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M22 20 Q20 16 18 12" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Sparse canopy clusters */}
            <ellipse cx="22" cy="14" rx="9" ry="6" fill={color} opacity="0.5" />
            <ellipse cx="10" cy="18" rx="6" ry="4" fill={color} opacity="0.45" />
            <ellipse cx="34" cy="14" rx="5" ry="4" fill={color} opacity="0.4" />
            <ellipse cx="16" cy="10" rx="5" ry="3.5" fill={color} opacity="0.45" />
            <ellipse cx="28" cy="10" rx="4" ry="3" fill={color} opacity="0.4" />
            {/* Silver leaf highlights — olive tree shimmer */}
            <ellipse cx="18" cy="12" rx="3.5" ry="1.5" fill={light} opacity="0.35" transform="rotate(-10 18 12)" />
            <ellipse cx="30" cy="12" rx="3" ry="1.3" fill={light} opacity="0.3" transform="rotate(15 30 12)" />
            <ellipse cx="10" cy="16" rx="2.5" ry="1.2" fill={light} opacity="0.25" transform="rotate(-20 10 16)" />
            <ellipse cx="36" cy="14" rx="2" ry="1" fill={light} opacity="0.2" transform="rotate(10 36 14)" />
            <ellipse cx="24" cy="8" rx="3" ry="1.2" fill={light} opacity="0.3" />
            {/* Olives */}
            <circle cx="14" cy="18" r="1.2" fill="#3a4a30" opacity="0.65" />
            <circle cx="28" cy="14" r="1" fill="#3a4a30" opacity="0.6" />
            <circle cx="20" cy="16" r="0.9" fill="#3a4a30" opacity="0.55" />
            <circle cx="34" cy="16" r="0.8" fill="#3a4a30" opacity="0.5" />
            {/* Shadow arcs */}
            <path d="M14 18 Q18 16 22 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M28 12 Q32 10 34 12" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            {/* Roots */}
            <path d="M25 46 Q22 44.5 18 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M27 46 Q30 44.5 33 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )



      case 'bonsai':
        if (s === 0) return (
          <g>
            {/* Bonsai pot */}
            <rect x="18" y="42" width="12" height="4" rx="1" fill="#8d6048" />
            <rect x="17" y="41" width="14" height="2" rx="1" fill="#a07050" />
            <path d="M24 41 Q23 38 24 35" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Tiny leaves */}
            <ellipse cx="22" cy="34" rx="3" ry="2" fill={color} opacity="0.7" />
            <ellipse cx="26" cy="33" rx="2.5" ry="1.8" fill={color} opacity="0.6" />
            <ellipse cx="23" cy="33.5" rx="1.5" ry="1" fill={light} opacity="0.25" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Bonsai pot */}
            <rect x="16" y="42" width="16" height="4" rx="1.5" fill="#8d6048" />
            <rect x="15" y="41" width="18" height="2" rx="1" fill="#a07050" />
            <path d="M18 41 L18 42" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
            <path d="M30 41 L30 42" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
            {/* Curved trunk */}
            <path d="M24 41 Q20 36 22 30 Q24 26 26 28" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 34 L24.5 33.5" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            {/* Flat canopy plate */}
            <ellipse cx="24" cy="26" rx="8" ry="3.5" fill={color} opacity="0.7" />
            <ellipse cx="21" cy="25" rx="3" ry="2" fill={light} opacity="0.25" />
            <ellipse cx="28" cy="27" rx="2.5" ry="1.5" fill={dark} opacity="0.12" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Bonsai pot */}
            <rect x="14" y="42" width="20" height="4" rx="2" fill="#8d6048" />
            <rect x="13" y="41" width="22" height="2" rx="1" fill="#a07050" />
            <path d="M16 42 L16 45" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
            <path d="M32 42 L32 45" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
            {/* S-curved trunk */}
            <path d="M24 41 Q18 36 20 30 Q22 26 28 24 Q30 22 28 18" stroke={trunk} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M22 34 L23.5 33.5" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M26 26 L27.5 25.5" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* Two flat canopy plates */}
            <ellipse cx="28" cy="16" rx="9" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="24" cy="15" rx="4" ry="2.5" fill={light} opacity="0.25" />
            <ellipse cx="34" cy="17" rx="3" ry="2" fill={dark} opacity="0.12" />
            {/* Lower branch plate */}
            <path d="M22 28 Q16 26 12 24" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="12" cy="22" rx="6" ry="3" fill={color} opacity="0.6" />
            <ellipse cx="10" cy="21" rx="2.5" ry="1.5" fill={light} opacity="0.2" />
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
            {/* Decorative pot */}
            <rect x="12" y="42" width="24" height="4" rx="2" fill={`url(#${uid}-bpot)`} />
            <rect x="11" y="41" width="26" height="2" rx="1" fill="#a07050" />
            <path d="M14 42 L14 45" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
            <path d="M34 42 L34 45" stroke="#7a5038" strokeWidth="0.5" opacity="0.3" />
            <path d="M20 42 L28 42" stroke="#c09070" strokeWidth="0.5" opacity="0.3" />
            {/* Dramatic S-curved trunk */}
            <path d="M24 41 Q16 34 19 28 Q22 24 28 22 Q32 20 30 14 Q28 10 26 10" stroke={trunk} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M24 41 Q16 34 19 28 Q22 24 28 22 Q32 20 30 14 Q28 10 26 10" stroke={`url(#${uid}-btrunk)`} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Bark detail */}
            <path d="M22 36 L23.5 35" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M24 28 L25.5 27" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M29 18 L30.5 17" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* Main canopy plate — flat */}
            <ellipse cx="26" cy="8" rx="12" ry="4.5" fill={color} opacity="0.75" />
            <ellipse cx="22" cy="7" rx="5" ry="3" fill={light} opacity="0.25" />
            <ellipse cx="34" cy="9" rx="3.5" ry="2" fill={dark} opacity="0.12" />
            {/* Canopy texture */}
            <path d="M18 8 Q22 6 26 8" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.15" />
            <path d="M28 7 Q32 5 36 7" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            {/* Lower branch with plate */}
            <path d="M20 30 Q14 26 10 24" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="10" cy="22" rx="7" ry="3.5" fill={color} opacity="0.65" />
            <ellipse cx="7" cy="21" rx="3" ry="2" fill={light} opacity="0.22" />
            <ellipse cx="14" cy="23" rx="2.5" ry="1.5" fill={dark} opacity="0.12" />
            {/* Mid branch plate */}
            <path d="M26 20 Q32 18 36 16" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="36" cy="14" rx="5" ry="2.5" fill={color} opacity="0.55" />
            <ellipse cx="34" cy="13.5" rx="2" ry="1.5" fill={light} opacity="0.2" />
            {/* Moss on trunk */}
            <circle cx="20" cy="32" r="1" fill="#7a9a60" opacity="0.3" />
            <circle cx="22" cy="30" r="0.7" fill="#7a9a60" opacity="0.25" />
            {/* Highlight dots */}
            <circle cx="18" cy="6" r="0.7" fill={light} opacity="0.35" />
            <circle cx="30" cy="6" r="0.6" fill={light} opacity="0.3" />
            <circle cx="8" cy="20" r="0.5" fill={light} opacity="0.3" />
          </g>
        )

      case 'aspen':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 36" stroke="#e0ddd6" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.7 40 L24.3 39.8" stroke="#3a3a3a" strokeWidth="0.5" opacity="0.4" />
            <ellipse cx="24" cy="42" rx="2.5" ry="1.5" fill="#8B7355" opacity="0.3" />
            {/* Small leaves */}
            <path d="M24 36 Q21 33 19 34 Q21 31 24 35" fill={color} opacity="0.7" />
            <path d="M24 36 Q27 33 29 34 Q27 31 24 35" fill={color} opacity="0.6" />
            <circle cx="22" cy="33" r="0.5" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* White bark trunk */}
            <path d="M24 46 L24 22" stroke="#e0ddd6" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M24.5 46 L24.5 22" stroke="#c8c4bc" strokeWidth="0.5" opacity="0.3" />
            {/* Eye marks */}
            <ellipse cx="24" cy="36" rx="1" ry="0.5" fill="#3a3a3a" opacity="0.4" />
            <ellipse cx="23.5" cy="30" rx="0.8" ry="0.4" fill="#3a3a3a" opacity="0.35" />
            <ellipse cx="24.2" cy="26" rx="0.7" ry="0.35" fill="#3a3a3a" opacity="0.3" />
            {/* Canopy — shimmering ovals */}
            <ellipse cx="24" cy="18" rx="8" ry="6" fill={color} opacity="0.6" />
            <ellipse cx="20" cy="16" rx="3.5" ry="2.5" fill={light} opacity="0.3" />
            <ellipse cx="28" cy="20" rx="3" ry="2" fill={dark} opacity="0.12" />
            {/* Shimmer */}
            <circle cx="18" cy="16" r="0.6" fill={light} opacity="0.4" />
            <circle cx="26" cy="14" r="0.5" fill={light} opacity="0.35" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* White trunk */}
            <path d="M23.5 46 L23.5 12" stroke="#e0ddd6" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M24 46 L24 12" stroke="#c8c4bc" strokeWidth="0.7" opacity="0.3" />
            {/* Eye marks */}
            <ellipse cx="24" cy="38" rx="1.2" ry="0.5" fill="#3a3a3a" opacity="0.45" />
            <ellipse cx="23.5" cy="30" rx="1" ry="0.45" fill="#3a3a3a" opacity="0.4" />
            <ellipse cx="24" cy="22" rx="0.9" ry="0.4" fill="#3a3a3a" opacity="0.35" />
            <ellipse cx="23.8" cy="16" rx="0.7" ry="0.35" fill="#3a3a3a" opacity="0.3" />
            {/* Branches */}
            <path d="M23 20 Q18 16 14 14" stroke="#c8c4bc" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 16 Q28 12 32 10" stroke="#c8c4bc" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Canopy */}
            <ellipse cx="24" cy="12" rx="11" ry="8" fill={color} opacity="0.55" />
            <ellipse cx="16" cy="14" rx="5" ry="4" fill={color} opacity="0.4" />
            <ellipse cx="32" cy="12" rx="4" ry="3.5" fill={color} opacity="0.35" />
            <ellipse cx="20" cy="10" rx="4" ry="3" fill={light} opacity="0.3" />
            {/* Shimmer dots */}
            <circle cx="16" cy="12" r="0.7" fill={light} opacity="0.45" />
            <circle cx="22" cy="8" r="0.6" fill={light} opacity="0.4" />
            <circle cx="28" cy="10" r="0.6" fill={light} opacity="0.4" />
            <circle cx="32" cy="12" r="0.5" fill={light} opacity="0.35" />
            <circle cx="14" cy="16" r="0.5" fill={light} opacity="0.3" />
            <path d="M22 46 Q20 45 18 46" stroke="#c8c4bc" strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-atrunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#b0aca4" stopOpacity="0.3" />
                <stop offset="35%" stopColor="#f0ece4" stopOpacity="0" />
                <stop offset="70%" stopColor="#f8f6f2" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#c0bab2" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {/* Slender white trunk */}
            <path d="M23 46 L23 8" stroke="#e0ddd6" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M23 46 L23 8" stroke={`url(#${uid}-atrunk)`} strokeWidth="3.2" strokeLinecap="round" />
            <path d="M21.5 46 L21.5 8" stroke="#b0aca4" strokeWidth="0.4" opacity="0.15" />
            {/* Eye marks — distinct black */}
            <ellipse cx="23.5" cy="40" rx="1.3" ry="0.6" fill="#2a2a2a" opacity="0.5" />
            <ellipse cx="23" cy="32" rx="1.1" ry="0.5" fill="#2a2a2a" opacity="0.45" />
            <ellipse cx="23.5" cy="24" rx="1" ry="0.45" fill="#2a2a2a" opacity="0.4" />
            <ellipse cx="23" cy="18" rx="0.8" ry="0.4" fill="#2a2a2a" opacity="0.35" />
            <ellipse cx="23.3" cy="12" rx="0.7" ry="0.35" fill="#2a2a2a" opacity="0.3" />
            {/* Branches */}
            <path d="M22 22 Q16 18 12 16" stroke="#c8c4bc" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 18 Q30 14 34 12" stroke="#c8c4bc" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M22 14 Q18 10 14 8" stroke="#c8c4bc" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M24 12 Q28 8 32 6" stroke="#c8c4bc" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Airy canopy — light teal shimmer */}
            <ellipse cx="24" cy="10" rx="14" ry="9" fill={color} opacity="0.5" />
            <ellipse cx="14" cy="14" rx="6" ry="4.5" fill={color} opacity="0.4" />
            <ellipse cx="34" cy="12" rx="5" ry="4" fill={color} opacity="0.35" />
            <ellipse cx="20" cy="6" rx="5" ry="3.5" fill={light} opacity="0.35" />
            <ellipse cx="30" cy="8" rx="4" ry="3" fill={color} opacity="0.4" />
            {/* Lots of shimmer highlights */}
            <circle cx="14" cy="12" r="0.8" fill={light} opacity="0.5" />
            <circle cx="18" cy="8" r="0.7" fill={light} opacity="0.5" />
            <circle cx="22" cy="6" r="0.6" fill={light} opacity="0.45" />
            <circle cx="26" cy="8" r="0.7" fill={light} opacity="0.45" />
            <circle cx="30" cy="6" r="0.6" fill={light} opacity="0.4" />
            <circle cx="34" cy="10" r="0.6" fill={light} opacity="0.4" />
            <circle cx="12" cy="16" r="0.5" fill={light} opacity="0.35" />
            <circle cx="16" cy="14" r="0.5" fill={light} opacity="0.4" />
            <circle cx="28" cy="12" r="0.6" fill={light} opacity="0.4" />
            <circle cx="32" cy="14" r="0.5" fill={light} opacity="0.35" />
            <circle cx="20" cy="14" r="0.5" fill={light} opacity="0.35" />
            <circle cx="24" cy="4" r="0.5" fill={light} opacity="0.4" />
            {/* Leaf flutter lines */}
            <path d="M16 10 Q17 9 18 10" stroke={light} strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M28 8 Q29 7 30 8" stroke={light} strokeWidth="0.3" fill="none" opacity="0.25" />
            <path d="M12 14 Q13 13 14 14" stroke={light} strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* Roots */}
            <path d="M22 46 Q20 45 17 46" stroke="#c8c4bc" strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M25 46 Q27 45 30 46" stroke="#c8c4bc" strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'baobab':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 43 24 40" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="42" rx="3" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 40 Q22 38 20 39 Q22 37 24 39" fill={color} opacity="0.6" />
            <path d="M24 40 Q26 38 28 39 Q26 37 24 39" fill={color} opacity="0.5" />
            <circle cx="22" cy="38" r="0.4" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M21 46 Q20.5 40 21 34 L27 34 Q27.5 40 27 46 Z" fill={trunk} />
            <path d="M22 38 L26 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M22 42 L26 41.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <ellipse cx="24" cy="28" rx="7" ry="6" fill={color} opacity="0.7" />
            <ellipse cx="22" cy="26" rx="3" ry="2.5" fill={light} opacity="0.15" />
            <ellipse cx="27" cy="30" rx="2.5" ry="2" fill={dark} opacity="0.1" />
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
            {/* Small canopy on top */}
            <ellipse cx="24" cy="22" rx="10" ry="7" fill={color} />
            <ellipse cx="20" cy="20" rx="4" ry="3" fill={light} opacity="0.18" />
            <ellipse cx="28" cy="24" rx="3" ry="2.5" fill={dark} opacity="0.1" />
            <circle cx="18" cy="18" r="0.6" fill={light} opacity="0.2" />
            <circle cx="30" cy="20" r="0.5" fill={light} opacity="0.15" />
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
              <radialGradient id={`${uid}-canopy`} cx="40%" cy="35%">
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={color} />
              </radialGradient>
            </defs>
            {/* Massive trunk */}
            <path d="M14 46 Q12 38 14 24 L34 24 Q36 38 34 46 Z" fill={trunk} />
            <path d="M14 46 Q12 38 14 24 L34 24 Q36 38 34 46 Z" fill={`url(#${uid}-bark)`} />
            {/* Bark texture — horizontal lines */}
            <path d="M15 28 L33 27.8" stroke={dark} strokeWidth="0.6" opacity="0.25" />
            <path d="M14.5 32 L33.5 31.8" stroke={dark} strokeWidth="0.6" opacity="0.22" />
            <path d="M14 36 L34 35.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M14 40 L34 39.8" stroke={dark} strokeWidth="0.5" opacity="0.18" />
            <path d="M14.5 44 L33.5 43.8" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            <path d="M15.5 30 L32.5 29.8" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            <path d="M15 34 L33 33.8" stroke={dark} strokeWidth="0.4" opacity="0.12" />
            <path d="M14.5 38 L33.5 37.8" stroke={dark} strokeWidth="0.35" opacity="0.12" />
            <path d="M14.5 42 L33.5 41.8" stroke={dark} strokeWidth="0.35" opacity="0.1" />
            {/* Trunk center line */}
            <path d="M24 46 L24 24" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.08" />
            {/* Branches going out */}
            <path d="M16 26 Q10 22 8 18" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M32 26 Q38 22 40 18" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M20 24 Q16 20 14 16" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M28 24 Q32 20 34 16" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Small flat canopy on top */}
            <ellipse cx="24" cy="16" rx="14" ry="6" fill={`url(#${uid}-canopy)`} />
            <ellipse cx="10" cy="16" rx="5" ry="4" fill={color} opacity="0.8" />
            <ellipse cx="38" cy="16" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="24" cy="12" rx="8" ry="3.5" fill={color} opacity="0.6" />
            {/* Canopy shadow */}
            <ellipse cx="24" cy="20" rx="12" ry="3" fill={dark} opacity="0.1" />
            {/* Canopy highlights */}
            <circle cx="18" cy="14" r="0.7" fill={light} opacity="0.3" />
            <circle cx="28" cy="12" r="0.6" fill={light} opacity="0.25" />
            <circle cx="12" cy="15" r="0.5" fill={light} opacity="0.2" />
            <circle cx="34" cy="14" r="0.5" fill={light} opacity="0.2" />
            <circle cx="24" cy="10" r="0.6" fill={light} opacity="0.25" />
            <circle cx="8" cy="16" r="0.4" fill={light} opacity="0.18" />
            <circle cx="40" cy="16" r="0.4" fill={light} opacity="0.15" />
            {/* Roots */}
            <path d="M14 46 Q10 43 8 46" stroke={trunk} strokeWidth="1.2" fill="none" opacity="0.35" />
            <path d="M34 46 Q38 43 40 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M18 46 Q16 44.5 14 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.2" />
            <path d="M30 46 Q32 44.5 34 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.18" />
          </g>
        )

      case 'banyan':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 43 24 39" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="42" rx="3" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 39 Q22 37 19 38 Q21 36 24 38" fill={color} opacity="0.7" />
            <path d="M24 39 Q26 37 29 38 Q27 36 24 38" fill={color} opacity="0.6" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23.5 40 24 30" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 38 L25 37.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* Aerial roots starting */}
            <path d="M20 34 Q19 40 19 46" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />
            {/* Canopy */}
            <ellipse cx="24" cy="24" rx="10" ry="7" fill={color} opacity="0.7" />
            <ellipse cx="20" cy="22" rx="4" ry="3" fill={light} opacity="0.15" />
            <ellipse cx="28" cy="26" rx="3" ry="2.5" fill={dark} opacity="0.1" />
            <circle cx="18" cy="22" r="0.5" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-bcanopy`} cx="40%" cy="35%">
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={color} />
              </radialGradient>
            </defs>
            <path d="M22 46 Q21 40 22 28 L26 28 Q27 40 26 46 Z" fill={trunk} />
            <path d="M23 36 L25 35.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M23 40 L25 39.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            {/* Aerial roots */}
            <path d="M16 26 Q15 36 15 46" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M32 26 Q33 36 33 46" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M18 28 Q17 38 17.5 46" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.35" />
            {/* Wide canopy */}
            <ellipse cx="24" cy="18" rx="14" ry="10" fill={`url(#${uid}-bcanopy)`} />
            <ellipse cx="18" cy="14" rx="5" ry="4" fill={light} opacity="0.15" />
            <ellipse cx="30" cy="22" rx="4" ry="3" fill={dark} opacity="0.1" />
            <circle cx="14" cy="14" r="0.6" fill={light} opacity="0.2" />
            <circle cx="32" cy="14" r="0.5" fill={light} opacity="0.18" />
            <circle cx="24" cy="10" r="0.5" fill={light} opacity="0.22" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-bcanopy`} cx="40%" cy="30%">
                <stop offset="0%" stopColor={light} />
                <stop offset="60%" stopColor={color} />
                <stop offset="100%" stopColor={dark} />
              </radialGradient>
              <linearGradient id={`${uid}-btrunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {/* Main trunk */}
            <path d="M21 46 Q20 38 21 26 L27 26 Q28 38 27 46 Z" fill={trunk} />
            <path d="M21 46 Q20 38 21 26 L27 26 Q28 38 27 46 Z" fill={`url(#${uid}-btrunk)`} />
            <path d="M22 34 L26 33.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M22 38 L26 37.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M22 42 L26 41.8" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            {/* Aerial root trunks — the signature banyan feature */}
            <path d="M12 22 Q11 34 10 46" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M36 22 Q37 34 38 46" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.65" />
            <path d="M16 24 Q15 36 14 46" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.55" />
            <path d="M32 24 Q33 36 34 46" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M8 20 Q7 34 7 46" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d="M40 20 Q41 34 41 46" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.3" />
            {/* Thickened root bases */}
            <ellipse cx="10" cy="45" rx="1.5" ry="1" fill={trunk} opacity="0.5" />
            <ellipse cx="38" cy="45" rx="1.2" ry="0.8" fill={trunk} opacity="0.45" />
            <ellipse cx="14" cy="45" rx="1" ry="0.7" fill={trunk} opacity="0.35" />
            <ellipse cx="34" cy="45" rx="1" ry="0.7" fill={trunk} opacity="0.3" />
            {/* Branches */}
            <path d="M22 28 Q14 24 8 20" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M26 28 Q34 24 40 20" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q18 22 12 20" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M25 26 Q30 22 36 20" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Wide spreading canopy */}
            <ellipse cx="24" cy="14" rx="16" ry="10" fill={`url(#${uid}-bcanopy)`} />
            <ellipse cx="8" cy="18" rx="6" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="40" cy="18" rx="6" ry="4" fill={color} opacity="0.6" />
            <ellipse cx="24" cy="8" rx="8" ry="4" fill={color} opacity="0.5" />
            {/* Canopy texture */}
            <circle cx="16" cy="10" r="0.7" fill={light} opacity="0.3" />
            <circle cx="28" cy="8" r="0.6" fill={light} opacity="0.25" />
            <circle cx="12" cy="14" r="0.6" fill={light} opacity="0.22" />
            <circle cx="34" cy="12" r="0.5" fill={light} opacity="0.2" />
            <circle cx="24" cy="6" r="0.5" fill={light} opacity="0.25" />
            <circle cx="8" cy="16" r="0.4" fill={light} opacity="0.18" />
            <circle cx="40" cy="16" r="0.4" fill={light} opacity="0.15" />
            <circle cx="20" cy="12" r="0.5" fill={light} opacity="0.2" />
            <circle cx="32" cy="16" r="0.5" fill={light} opacity="0.18" />
            {/* Shadow */}
            <ellipse cx="24" cy="22" rx="14" ry="3" fill={dark} opacity="0.1" />
            {/* Roots */}
            <path d="M21 46 Q18 44 15 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M27 46 Q30 44 33 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'ember':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 43 24 39" stroke="#3e2723" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="42" rx="2.5" ry="1" fill="#5d4037" opacity="0.4" />
            <path d="M24 39 Q22 37 20 38 Q22 36 24 38" fill={color} opacity="0.6" />
            <path d="M24 39 Q26 37 28 38 Q26 36 24 38" fill="#ff8f00" opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23.5 40 24 30" stroke="#3e2723" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 38 L25 37.8" stroke="#1b1210" strokeWidth="0.5" opacity="0.3" />
            <path d="M24 34 Q18 30 14 28" stroke="#3e2723" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Ember canopy */}
            <ellipse cx="24" cy="22" rx="8" ry="7" fill="#4e342e" opacity="0.7" />
            <ellipse cx="24" cy="22" rx="5" ry="4" fill={color} opacity="0.3" />
            <circle cx="20" cy="20" r="0.8" fill="#ffab00" opacity="0.5" />
            <circle cx="28" cy="24" r="0.6" fill={color} opacity="0.4" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-eglow`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4e342e" stopOpacity="0.8" />
              </radialGradient>
            </defs>
            <path d="M22 46 Q21.5 40 22 30 L26 30 Q26.5 40 26 46 Z" fill="#3e2723" />
            <path d="M23 36 L25 35.8" stroke="#1b1210" strokeWidth="0.5" opacity="0.3" />
            <path d="M23 40 L25 39.8" stroke="#1b1210" strokeWidth="0.4" opacity="0.25" />
            <path d="M23 30 Q16 26 12 24" stroke="#3e2723" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M25 30 Q32 26 36 24" stroke="#3e2723" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Dark charred canopy with inner glow */}
            <ellipse cx="24" cy="16" rx="12" ry="9" fill={`url(#${uid}-eglow)`} />
            <ellipse cx="20" cy="14" rx="4" ry="3" fill={color} opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="28" cy="18" rx="3" ry="2.5" fill="#ffab00" opacity="0.25">
              <animate attributeName="opacity" values="0.25;0.4;0.25" dur="2.5s" repeatCount="indefinite" />
            </ellipse>
            {/* Floating embers */}
            <circle cx="18" cy="10" r="0.5" fill="#ffab00" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="30" cy="8" r="0.4" fill={color} opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="14" cy="12" r="0.35" fill="#ffab00" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.8s" repeatCount="indefinite" />
            </circle>
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-eglow`} cx="50%" cy="45%">
                <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                <stop offset="40%" stopColor="#bf360c" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3e2723" stopOpacity="0.9" />
              </radialGradient>
              <radialGradient id={`${uid}-ecore`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#ffab00" stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
              <filter id={`${uid}-eblur`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
              </filter>
              <linearGradient id={`${uid}-etrunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#4e342e" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {/* Charred trunk */}
            <path d="M21 46 Q19 40 20 28 L28 28 Q29 40 27 46 Z" fill="#2e1a12" />
            <path d="M21 46 Q19 40 20 28 L28 28 Q29 40 27 46 Z" fill={`url(#${uid}-etrunk)`} />
            {/* Charcoal cracks */}
            <path d="M22 34 L26 33.8" stroke="#1a0e08" strokeWidth="0.6" opacity="0.4" />
            <path d="M22 38 L26 37.8" stroke="#1a0e08" strokeWidth="0.5" opacity="0.35" />
            <path d="M22 42 L26 41.8" stroke="#1a0e08" strokeWidth="0.5" opacity="0.3" />
            <path d="M23 30 L23 44" stroke={color} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M25 32 L25 42" stroke="#ffab00" strokeWidth="0.2" fill="none" opacity="0.1" />
            {/* Branches */}
            <path d="M21 30 Q14 26 8 22" stroke="#2e1a12" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M27 30 Q34 26 40 22" stroke="#2e1a12" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M22 28 Q18 24 14 20" stroke="#2e1a12" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M26 28 Q30 24 34 20" stroke="#2e1a12" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Fire glow behind canopy */}
            <ellipse cx="24" cy="16" rx="16" ry="11" fill={`url(#${uid}-ecore)`} filter={`url(#${uid}-eblur)`} />
            {/* Dark charred canopy */}
            <ellipse cx="24" cy="16" rx="14" ry="10" fill={`url(#${uid}-eglow)`} />
            <ellipse cx="10" cy="20" rx="5" ry="4" fill="#3e2723" opacity="0.7" />
            <ellipse cx="38" cy="20" rx="5" ry="4" fill="#3e2723" opacity="0.6" />
            {/* Inner fire glow spots */}
            <ellipse cx="20" cy="14" rx="4" ry="3" fill={color} opacity="0.35">
              <animate attributeName="opacity" values="0.35;0.55;0.35" dur="2s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="28" cy="16" rx="3.5" ry="2.5" fill="#ffab00" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2.5s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="24" cy="10" rx="3" ry="2" fill="#bf360c" opacity="0.25">
              <animate attributeName="opacity" values="0.25;0.45;0.25" dur="1.8s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="14" cy="18" rx="3" ry="2" fill={color} opacity="0.2">
              <animate attributeName="opacity" values="0.2;0.35;0.2" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="34" cy="14" rx="2.5" ry="2" fill="#ffab00" opacity="0.2">
              <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2.8s" repeatCount="indefinite" />
            </ellipse>
            {/* Floating ember particles */}
            <circle cx="16" cy="6" r="0.6" fill="#ffab00" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="cy" values="6;4;6" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="30" cy="4" r="0.5" fill={color} opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="cy" values="4;2;4" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="22" cy="3" r="0.4" fill="#ffab00" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.05;0.5" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="cy" values="3;1;3" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="34" cy="8" r="0.45" fill="#ff8f00" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="cy" values="8;5;8" dur="3.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="12" cy="8" r="0.35" fill="#ffab00" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="cy" values="8;6;8" dur="3.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="26" cy="2" r="0.3" fill={color} opacity="0.35">
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="cy" values="2;0;2" dur="4.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="38" cy="10" r="0.3" fill="#ff8f00" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="8" cy="12" r="0.3" fill="#ffab00" opacity="0.25">
              <animate attributeName="opacity" values="0.25;0.05;0.25" dur="3s" repeatCount="indefinite" />
            </circle>
            {/* Roots */}
            <path d="M21 46 Q18 44 14 46" stroke="#2e1a12" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M27 46 Q30 44 34 46" stroke="#2e1a12" strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      case 'coral':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 41" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="24" cy="43" rx="2.5" ry="1" fill="#8B7355" opacity="0.3" />
            {/* Tiny coral branch */}
            <path d="M24 41 Q22 39 21 37" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 41 Q26 39 27 38" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
            <circle cx="21" cy="37" r="0.5" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Coral branching structure */}
            <path d="M24 46 L24 34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 38 Q20 34 18 30" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q28 32 30 28" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M18 30 Q16 28 14 26" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M30 28 Q32 26 34 24" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Coral tips */}
            <circle cx="14" cy="26" r="1" fill={light} opacity="0.4" />
            <circle cx="34" cy="24" r="0.8" fill={light} opacity="0.35" />
            <circle cx="18" cy="30" r="0.6" fill={light} opacity="0.3" />
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
            {/* Main coral trunk */}
            <path d="M24 46 L24 30" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Branching coral */}
            <path d="M24 36 Q18 32 14 28" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q30 30 34 26" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M14 28 Q12 26 10 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M14 28 Q16 24 18 20" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M34 26 Q36 24 38 20" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M34 26 Q32 22 30 18" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q24 26 24 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 24 Q22 20 20 16" stroke={color} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M24 24 Q26 20 28 16" stroke={color} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Coral tips */}
            <circle cx="10" cy="22" r="1.2" fill={light} opacity="0.4" />
            <circle cx="38" cy="20" r="1" fill={light} opacity="0.35" />
            <circle cx="18" cy="20" r="0.8" fill={light} opacity="0.3" />
            <circle cx="30" cy="18" r="0.8" fill={light} opacity="0.3" />
            <circle cx="24" cy="20" r="0.7" fill={light} opacity="0.25" />
            <circle cx="20" cy="16" r="0.6" fill={light} opacity="0.25" />
            <circle cx="28" cy="16" r="0.6" fill={light} opacity="0.22" />
            {/* Bubbles */}
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
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
              </filter>
              <linearGradient id={`${uid}-crbranch`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={color} />
              </linearGradient>
            </defs>
            {/* Underwater ambient glow */}
            <ellipse cx="24" cy="26" rx="18" ry="14" fill={`url(#${uid}-crglow)`} filter={`url(#${uid}-crblur)`} opacity="0.4" />
            {/* Main coral trunk */}
            <path d="M24 46 L24 28" stroke={`url(#${uid}-crbranch)`} strokeWidth="3.5" strokeLinecap="round" />
            {/* Primary branching */}
            <path d="M24 36 Q16 30 10 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q32 28 38 22" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q24 26 24 18" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Secondary branching */}
            <path d="M10 24 Q8 20 6 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M10 24 Q12 20 14 16" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M38 22 Q40 18 42 14" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M38 22 Q36 18 34 14" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 24 Q20 18 16 12" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 24 Q28 18 32 12" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Tertiary twigs */}
            <path d="M6 16 Q4 14 4 10" stroke={color} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M6 16 Q8 14 10 12" stroke={color} strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M14 16 Q12 14 12 12" stroke={color} strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M42 14 Q44 12 44 10" stroke={color} strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M42 14 Q40 12 38 10" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M34 14 Q36 12 36 10" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M16 12 Q14 10 14 8" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M32 12 Q34 10 34 8" stroke={color} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            {/* Coral polyp tips */}
            <circle cx="4" cy="10" r="1" fill={light} opacity="0.45" />
            <circle cx="10" cy="12" r="0.8" fill={light} opacity="0.4" />
            <circle cx="12" cy="12" r="0.7" fill={light} opacity="0.35" />
            <circle cx="44" cy="10" r="0.9" fill={light} opacity="0.4" />
            <circle cx="38" cy="10" r="0.7" fill={light} opacity="0.35" />
            <circle cx="36" cy="10" r="0.6" fill={light} opacity="0.3" />
            <circle cx="14" cy="8" r="0.7" fill={light} opacity="0.35" />
            <circle cx="34" cy="8" r="0.6" fill={light} opacity="0.3" />
            <circle cx="24" cy="18" r="0.6" fill={light} opacity="0.28" />
            <circle cx="16" cy="16" r="0.5" fill={light} opacity="0.25" />
            <circle cx="34" cy="14" r="0.5" fill={light} opacity="0.22" />
            {/* Animated bubbles floating up */}
            <circle cx="12" cy="20" r="0.6" fill="#fff" opacity="0.35">
              <animate attributeName="cy" values="20;8;20" dur="5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="28" cy="16" r="0.5" fill="#fff" opacity="0.3">
              <animate attributeName="cy" values="16;6;16" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="36" cy="18" r="0.45" fill="#fff" opacity="0.25">
              <animate attributeName="cy" values="18;8;18" dur="4.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.05;0.25" dur="4.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="20" cy="12" r="0.4" fill="#fff" opacity="0.2">
              <animate attributeName="cy" values="12;4;12" dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="14" r="0.35" fill="#fff" opacity="0.2">
              <animate attributeName="cy" values="14;6;14" dur="5.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="5.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="8" cy="16" r="0.3" fill="#fff" opacity="0.18">
              <animate attributeName="cy" values="16;8;16" dur="6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.18;0.05;0.18" dur="6s" repeatCount="indefinite" />
            </circle>
          </g>
        )

      case 'starweaver':
        if (s === 0) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-sky`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#1a237e" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 Q23.5 42 24 38" stroke="#3e3570" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="35" r="4" fill={`url(#${uid}-sky)`} />
            <circle cx="23" cy="34" r="0.4" fill="#e8eaf6" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="25" cy="35.5" r="0.3" fill="#e8eaf6" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.8s" repeatCount="indefinite" begin="0.5s" />
            </circle>
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-sky`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#1a237e" />
                <stop offset="70%" stopColor="#0d1147" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <filter id={`${uid}-glow`}>
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 46 Q23 40 24 34" stroke="#3e3570" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q20 32 18 30" stroke="#3e3570" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="28" r="8" fill={`url(#${uid}-sky)`} />
            </g>
            {/* Stars */}
            <circle cx="21" cy="26" r="0.5" fill="#e8eaf6" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="27" cy="28" r="0.4" fill="#c5cae9" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.15;0.7" dur="1.8s" repeatCount="indefinite" begin="0.6s" />
            </circle>
            <circle cx="24" cy="24" r="0.35" fill="#ffffff" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.5s" repeatCount="indefinite" begin="1s" />
            </circle>
            {/* Constellation line */}
            <line x1="21" y1="26" x2="24" y2="24" stroke="#7986cb" strokeWidth="0.2" opacity="0.3" />
            <line x1="24" y1="24" x2="27" y2="28" stroke="#7986cb" strokeWidth="0.2" opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-sky`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#1a237e" />
                <stop offset="60%" stopColor="#0d1147" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id={`${uid}-nebula`} cx="30%" cy="40%">
                <stop offset="0%" stopColor="#5c6bc0" stopOpacity="0.2" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 46 Q23 40 24 32" stroke="#3e3570" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q18 28 14 26" stroke="#3e3570" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 30 Q30 24 34 22" stroke="#3e3570" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="22" r="12" fill={`url(#${uid}-sky)`} />
              <circle cx="20" cy="18" r="5" fill={`url(#${uid}-nebula)`} />
            </g>
            {/* Stars */}
            <circle cx="18" cy="18" r="0.5" fill="#e8eaf6" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.15;0.9" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="28" cy="20" r="0.45" fill="#ffffff" opacity="0.85">
              <animate attributeName="opacity" values="0.85;0.1;0.85" dur="2.4s" repeatCount="indefinite" begin="0.3s" />
            </circle>
            <circle cx="24" cy="16" r="0.5" fill="#c5cae9" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.7s" repeatCount="indefinite" begin="0.7s" />
            </circle>
            <circle cx="22" cy="24" r="0.35" fill="#e8eaf6" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2.6s" repeatCount="indefinite" begin="1.2s" />
            </circle>
            <circle cx="30" cy="16" r="0.4" fill="#ffffff" opacity="0.75">
              <animate attributeName="opacity" values="0.75;0.15;0.75" dur="1.9s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            {/* Constellation lines */}
            <line x1="18" y1="18" x2="24" y2="16" stroke="#7986cb" strokeWidth="0.2" opacity="0.25" />
            <line x1="24" y1="16" x2="28" y2="20" stroke="#7986cb" strokeWidth="0.2" opacity="0.25" />
            <line x1="28" y1="20" x2="30" y2="16" stroke="#7986cb" strokeWidth="0.2" opacity="0.25" />
            <line x1="22" y1="24" x2="18" y2="18" stroke="#7986cb" strokeWidth="0.2" opacity="0.2" />
            {/* Shooting star */}
            <circle cx="14" cy="14" r="0.4" fill="#ffffff" opacity="0.6">
              <animate attributeName="cx" values="14;32" dur="3s" repeatCount="indefinite" />
              <animate attributeName="cy" values="14;22" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.8;0" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes starTwinkle-${uid} {
                  0%, 100% { opacity: 0.9; }
                  50% { opacity: 0.1; }
                }
                @keyframes shootingStar-${uid} {
                  0% { transform: translate(0, 0); opacity: 0; }
                  10% { opacity: 0.9; }
                  90% { opacity: 0.9; }
                  100% { transform: translate(18px, 6px); opacity: 0; }
                }
                @keyframes nebulaWisp-${uid} {
                  0%, 100% { opacity: 0.15; }
                  50% { opacity: 0.3; }
                }
              `}</style>
              <radialGradient id={`${uid}-sky`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#1a237e" />
                <stop offset="40%" stopColor="#0d1147" />
                <stop offset="80%" stopColor="#050824" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id={`${uid}-neb1`} cx="30%" cy="35%">
                <stop offset="0%" stopColor="#5c6bc0" stopOpacity="0.25" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id={`${uid}-neb2`} cx="70%" cy="55%">
                <stop offset="0%" stopColor="#7c4dff" stopOpacity="0.15" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a4080" />
                <stop offset="100%" stopColor="#2a2050" />
              </linearGradient>
              <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id={`${uid}-starglow`}>
                <feGaussianBlur stdDeviation="1" />
              </filter>
            </defs>
            {/* Trunk */}
            <path d="M22 46 C21 42 25 38 23 34 C21 30 25 28 24 22" stroke={`url(#${uid}-trunk)`} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M26 46 C27 42 23 38 25 34" stroke="#1a1540" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
            {/* Branches */}
            <path d="M24 32 C18 28 12 26 8 22" stroke="#3e3570" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 28 C30 24 36 22 40 18" stroke="#3e3570" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 26 C20 20 14 16 12 12" stroke="#3e3570" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 30 C28 26 34 28 38 24" stroke="#3e3570" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            {/* Canopy - dark sky dome */}
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="18" r="16" fill={`url(#${uid}-sky)`} />
              {/* Nebula wisps */}
              <ellipse cx="18" cy="14" rx="6" ry="4" fill={`url(#${uid}-neb1)`} style={{animation: `nebulaWisp-${uid} 4s ease-in-out infinite`} as React.CSSProperties} />
              <ellipse cx="30" cy="20" rx="5" ry="3" fill={`url(#${uid}-neb2)`} style={{animation: `nebulaWisp-${uid} 5s ease-in-out infinite 1s`} as React.CSSProperties} />
            </g>
            {/* Constellation 1 - triangle */}
            <circle cx="16" cy="16" r="0.55" fill="#e8eaf6" style={{animation: `starTwinkle-${uid} 2.2s ease-in-out infinite`} as React.CSSProperties} />
            <circle cx="22" cy="12" r="0.5" fill="#ffffff" style={{animation: `starTwinkle-${uid} 2.8s ease-in-out infinite 0.4s`} as React.CSSProperties} />
            <circle cx="18" cy="20" r="0.45" fill="#c5cae9" style={{animation: `starTwinkle-${uid} 2s ease-in-out infinite 0.8s`} as React.CSSProperties} />
            <line x1="16" y1="16" x2="22" y2="12" stroke="#7986cb" strokeWidth="0.2" opacity="0.3" />
            <line x1="22" y1="12" x2="18" y2="20" stroke="#7986cb" strokeWidth="0.2" opacity="0.3" />
            <line x1="18" y1="20" x2="16" y2="16" stroke="#7986cb" strokeWidth="0.2" opacity="0.3" />
            {/* Constellation 2 - arc */}
            <circle cx="28" cy="14" r="0.5" fill="#ffffff" style={{animation: `starTwinkle-${uid} 1.9s ease-in-out infinite 0.2s`} as React.CSSProperties} />
            <circle cx="32" cy="18" r="0.4" fill="#e8eaf6" style={{animation: `starTwinkle-${uid} 2.5s ease-in-out infinite 1s`} as React.CSSProperties} />
            <circle cx="30" cy="22" r="0.5" fill="#c5cae9" style={{animation: `starTwinkle-${uid} 2.1s ease-in-out infinite 0.6s`} as React.CSSProperties} />
            <line x1="28" y1="14" x2="32" y2="18" stroke="#7986cb" strokeWidth="0.2" opacity="0.25" />
            <line x1="32" y1="18" x2="30" y2="22" stroke="#7986cb" strokeWidth="0.2" opacity="0.25" />
            {/* Constellation 3 - cross */}
            <circle cx="24" cy="8" r="0.6" fill="#ffffff" style={{animation: `starTwinkle-${uid} 2.3s ease-in-out infinite 1.5s`} as React.CSSProperties} />
            <circle cx="20" cy="10" r="0.35" fill="#e8eaf6" style={{animation: `starTwinkle-${uid} 3s ease-in-out infinite 0.3s`} as React.CSSProperties} />
            <circle cx="28" cy="10" r="0.4" fill="#e8eaf6" style={{animation: `starTwinkle-${uid} 2.7s ease-in-out infinite 1.8s`} as React.CSSProperties} />
            <line x1="20" y1="10" x2="28" y2="10" stroke="#7986cb" strokeWidth="0.15" opacity="0.2" />
            <line x1="24" y1="8" x2="24" y2="12" stroke="#7986cb" strokeWidth="0.15" opacity="0.2" />
            {/* Scattered lone stars */}
            <circle cx="12" cy="12" r="0.3" fill="#c5cae9" style={{animation: `starTwinkle-${uid} 3.2s ease-in-out infinite 2s`} as React.CSSProperties} />
            <circle cx="36" cy="14" r="0.35" fill="#e8eaf6" style={{animation: `starTwinkle-${uid} 2.6s ease-in-out infinite 0.9s`} as React.CSSProperties} />
            <circle cx="14" cy="24" r="0.3" fill="#ffffff" style={{animation: `starTwinkle-${uid} 2.9s ease-in-out infinite 1.3s`} as React.CSSProperties} />
            <circle cx="34" cy="24" r="0.25" fill="#c5cae9" style={{animation: `starTwinkle-${uid} 3.5s ease-in-out infinite 0.7s`} as React.CSSProperties} />
            {/* Star glow halos on brightest */}
            <circle cx="24" cy="8" r="2" fill="#7986cb" opacity="0.08" filter={`url(#${uid}-starglow)`} />
            <circle cx="22" cy="12" r="1.5" fill="#7986cb" opacity="0.06" filter={`url(#${uid}-starglow)`} />
            {/* Shooting stars */}
            <circle cx="10" cy="10" r="0.5" fill="#ffffff" style={{animation: `shootingStar-${uid} 4s linear infinite`} as React.CSSProperties} />
            <circle cx="34" cy="8" r="0.4" fill="#e8eaf6" style={{animation: `shootingStar-${uid} 5s linear infinite 2s`} as React.CSSProperties} />
            {/* Orbiting star particles */}
            <circle cx="10" cy="18" r="0.6" fill="#7986cb" opacity="0.5">
              <animate attributeName="cx" values="10;38;10" dur="8s" repeatCount="indefinite" />
              <animate attributeName="cy" values="18;18;18" dur="8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur="8s" repeatCount="indefinite" />
            </circle>
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
            <g style={{transformOrigin: '24px 30px', animation: `levSway-${uid} 4s ease-in-out infinite`} as React.CSSProperties}>
              <path d="M22 30 Q14 26 8 24 Q4 23 2 26 Q4 28 6 26" stroke="#006064" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M8 24 Q6 20 4 18 Q2 17 2 19" stroke="#006064" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </g>
            <g style={{transformOrigin: '24px 26px', animation: `levSway-${uid} 5s ease-in-out infinite 0.5s`} as React.CSSProperties}>
              <path d="M24 26 Q32 22 38 18 Q42 16 44 18 Q42 20 40 18" stroke="#006064" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M38 18 Q40 14 42 12" stroke="#006064" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </g>
            <g style={{transformOrigin: '24px 22px', animation: `levSway-${uid} 4.5s ease-in-out infinite 1s`} as React.CSSProperties}>
              <path d="M22 22 Q14 16 8 14 Q4 13 2 15" stroke="#006064" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
            <g style={{transformOrigin: '24px 20px', animation: `levSway-${uid} 3.5s ease-in-out infinite 1.5s`} as React.CSSProperties}>
              <path d="M24 20 Q30 14 36 12 Q40 10 42 12" stroke="#006064" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </g>
            <path d="M22 24 Q16 20 12 20 Q10 20 8 22" stroke="#006064" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 18 Q28 16 32 16 Q34 17 36 16" stroke="#006064" strokeWidth="1.2" fill="none" strokeLinecap="round" />
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

      case 'yggdrasil':
        if (s === 0) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-leaf`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#2e7d32" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 Q23.5 42 24 38" stroke="#5d4037" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            {/* Tiny roots */}
            <path d="M24 46 Q22 47 20 47" stroke="#5d4037" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q26 47 28 47" stroke="#5d4037" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <circle cx="24" cy="35" r="4" fill={`url(#${uid}-leaf)`} />
            <circle cx="24" cy="40" r="0.4" fill="#ffd54f" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-leaf`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#2e7d32" />
                <stop offset="70%" stopColor="#1b5e20" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <filter id={`${uid}-glow`}>
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 46 Q23 40 24 34" stroke="#5d4037" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q20 32 18 30" stroke="#5d4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Roots */}
            <path d="M24 46 Q20 48 16 48" stroke="#5d4037" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q28 48 32 48" stroke="#5d4037" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q22 47 18 46" stroke="#4e342e" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <circle cx="24" cy="28" r="8" fill={`url(#${uid}-leaf)`} />
            {/* Golden energy */}
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="38" r="0.5" fill="#ffd54f" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="24" cy="34" r="0.4" fill="#ffab00" opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" begin="0.3s" />
              </circle>
            </g>
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-leaf`} cx="50%" cy="40%">
                <stop offset="0%" stopColor="#43a047" />
                <stop offset="50%" stopColor="#2e7d32" />
                <stop offset="80%" stopColor="#1b5e20" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6d4c41" />
                <stop offset="100%" stopColor="#4e342e" />
              </linearGradient>
              <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 46 Q23 40 24 32" stroke={`url(#${uid}-trunk)`} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q18 28 14 24" stroke="#5d4037" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 30 Q30 24 34 20" stroke="#5d4037" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 28 Q20 22 16 18" stroke="#5d4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Root system */}
            <path d="M24 46 Q18 48 12 48" stroke="#5d4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q30 48 36 48" stroke="#5d4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q20 47 14 46" stroke="#4e342e" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q28 47 34 46" stroke="#4e342e" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M18 48 Q16 48 14 47" stroke="#4e342e" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* Canopy */}
            <circle cx="24" cy="20" r="14" fill={`url(#${uid}-leaf)`} />
            {/* Golden energy veins */}
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="42" r="0.5" fill="#ffd54f" opacity="0.5">
                <animate attributeName="cy" values="42;32" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="24" cy="36" r="0.4" fill="#ffab00" opacity="0.4">
                <animate attributeName="cy" values="36;26" dur="3s" repeatCount="indefinite" begin="1s" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" begin="1s" />
              </circle>
            </g>
            {/* Runic mark */}
            <path d="M23 40 L25 38 L23 36" stroke="#ffd54f" strokeWidth="0.4" fill="none" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" />
            </path>
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes yggEnergy-${uid} {
                  0% { opacity: 0.6; }
                  50% { opacity: 0.15; }
                  100% { opacity: 0.6; }
                }
                @keyframes yggLeaf-${uid} {
                  0% { transform: translate(0, 0); opacity: 0.5; }
                  50% { transform: translate(3px, -6px); opacity: 0.3; }
                  100% { transform: translate(6px, -12px); opacity: 0; }
                }
                @keyframes yggPulse-${uid} {
                  0%, 100% { opacity: 0.3; }
                  50% { opacity: 0.6; }
                }
                @keyframes yggRune-${uid} {
                  0%, 100% { opacity: 0.15; }
                  50% { opacity: 0.45; }
                }
              `}</style>
              <radialGradient id={`${uid}-canopy`} cx="50%" cy="40%">
                <stop offset="0%" stopColor="#4caf50" stopOpacity="0.9" />
                <stop offset="30%" stopColor="#388e3c" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#2e7d32" stopOpacity="0.6" />
                <stop offset="85%" stopColor="#1b5e20" stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id={`${uid}-canopy2`} cx="30%" cy="35%">
                <stop offset="0%" stopColor="#66bb6a" stopOpacity="0.5" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <radialGradient id={`${uid}-canopy3`} cx="70%" cy="45%">
                <stop offset="0%" stopColor="#43a047" stopOpacity="0.4" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#795548" />
                <stop offset="50%" stopColor="#5d4037" />
                <stop offset="100%" stopColor="#4e342e" />
              </linearGradient>
              <linearGradient id={`${uid}-gold`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffd54f" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ffab00" stopOpacity="0.1" />
              </linearGradient>
              <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id={`${uid}-soft`}>
                <feGaussianBlur stdDeviation="1.5" />
              </filter>
              <filter id={`${uid}-runeglow`}>
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Massive root system */}
            <path d="M24 46 Q16 48 6 48" stroke="#5d4037" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q32 48 42 48" stroke="#5d4037" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q18 47 10 46" stroke="#4e342e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q30 47 38 46" stroke="#4e342e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M20 47 Q14 48 8 46" stroke="#4e342e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M28 47 Q34 48 40 46" stroke="#4e342e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M16 48 Q12 47 8 48" stroke="#3e2723" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M32 48 Q36 47 40 48" stroke="#3e2723" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* Golden energy in roots */}
            <g filter={`url(#${uid}-soft)`}>
              <path d="M24 46 Q18 47 10 46" stroke="#ffd54f" strokeWidth="0.4" fill="none" opacity="0.2" style={{animation: `yggEnergy-${uid} 3s ease-in-out infinite`} as React.CSSProperties} />
              <path d="M24 46 Q30 47 38 46" stroke="#ffd54f" strokeWidth="0.4" fill="none" opacity="0.2" style={{animation: `yggEnergy-${uid} 3.5s ease-in-out infinite 0.5s`} as React.CSSProperties} />
            </g>
            {/* Main trunk — massive ancient */}
            <path d="M20 46 C18 42 22 38 20 34 C18 30 22 28 21 24 Q20 20 22 18" stroke={`url(#${uid}-trunk)`} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M28 46 C30 42 26 38 28 34 C30 30 26 28 27 24 Q28 20 26 18" stroke={`url(#${uid}-trunk)`} strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* Trunk texture */}
            <path d="M22 44 L26 44" stroke="#4e342e" strokeWidth="0.3" opacity="0.3" />
            <path d="M21 40 L27 40" stroke="#4e342e" strokeWidth="0.3" opacity="0.3" />
            <path d="M20 36 L28 36" stroke="#4e342e" strokeWidth="0.3" opacity="0.25" />
            <path d="M20 32 L28 32" stroke="#4e342e" strokeWidth="0.3" opacity="0.2" />
            {/* Golden energy veins through trunk */}
            <g filter={`url(#${uid}-glow)`}>
              <path d="M23 44 C22 40 25 36 23 32 C21 28 24 24 24 20" stroke={`url(#${uid}-gold)`} strokeWidth="0.8" fill="none" style={{animation: `yggEnergy-${uid} 4s ease-in-out infinite`} as React.CSSProperties} />
              <path d="M25 44 C26 40 23 36 25 32 C27 28 24 24 24 20" stroke={`url(#${uid}-gold)`} strokeWidth="0.6" fill="none" style={{animation: `yggEnergy-${uid} 4s ease-in-out infinite 1s`} as React.CSSProperties} />
            </g>
            {/* Runic marks on bark */}
            <g filter={`url(#${uid}-runeglow)`}>
              <path d="M22 42 L24 40 L22 38" stroke="#ffd54f" strokeWidth="0.5" fill="none" style={{animation: `yggRune-${uid} 4s ease-in-out infinite`} as React.CSSProperties} />
              <path d="M25 36 L27 34 L25 32" stroke="#ffd54f" strokeWidth="0.4" fill="none" style={{animation: `yggRune-${uid} 4.5s ease-in-out infinite 1s`} as React.CSSProperties} />
              <path d="M22 28 L24 26 L22 24" stroke="#ffab00" strokeWidth="0.4" fill="none" style={{animation: `yggRune-${uid} 5s ease-in-out infinite 2s`} as React.CSSProperties} />
            </g>
            {/* Major branches */}
            <path d="M22 30 C14 24 6 22 2 18" stroke="#5d4037" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M26 30 C34 24 42 22 46 18" stroke="#5d4037" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M22 24 C16 18 10 14 6 10" stroke="#5d4037" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M26 24 C32 18 38 14 42 10" stroke="#5d4037" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 20 C20 14 16 10 12 6" stroke="#5d4037" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M24 20 C28 14 32 10 36 6" stroke="#5d4037" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M22 26 C18 24 12 26 8 24" stroke="#5d4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M26 26 C30 24 36 26 40 24" stroke="#5d4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Enormous canopy — filling viewbox */}
            <circle cx="24" cy="14" r="20" fill={`url(#${uid}-canopy)`} />
            <ellipse cx="16" cy="12" rx="10" ry="8" fill={`url(#${uid}-canopy2)`} />
            <ellipse cx="32" cy="16" rx="10" ry="7" fill={`url(#${uid}-canopy3)`} />
            {/* Canopy depth layers */}
            <circle cx="20" cy="10" r="6" fill="#2e7d32" opacity="0.15" />
            <circle cx="30" cy="12" r="5" fill="#1b5e20" opacity="0.12" />
            <circle cx="24" cy="8" r="4" fill="#4caf50" opacity="0.1" />
            {/* Golden energy particles flowing upward */}
            <g filter={`url(#${uid}-glow)`}>
              <circle cx="24" cy="40" r="0.6" fill="#ffd54f" opacity="0.6">
                <animate attributeName="cy" values="40;18" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.1;0.6;0.1" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="22" cy="36" r="0.5" fill="#ffab00" opacity="0.5">
                <animate attributeName="cy" values="36;14" dur="4.5s" repeatCount="indefinite" begin="1s" />
                <animate attributeName="opacity" values="0.5;0.1;0.5;0.1" dur="4.5s" repeatCount="indefinite" begin="1s" />
              </circle>
              <circle cx="26" cy="38" r="0.45" fill="#ffd54f" opacity="0.45">
                <animate attributeName="cy" values="38;16" dur="3.8s" repeatCount="indefinite" begin="2s" />
                <animate attributeName="opacity" values="0.45;0.05;0.45;0.05" dur="3.8s" repeatCount="indefinite" begin="2s" />
              </circle>
              <circle cx="23" cy="34" r="0.4" fill="#ffcc02" opacity="0.4">
                <animate attributeName="cy" values="34;12" dur="5s" repeatCount="indefinite" begin="0.5s" />
                <animate attributeName="opacity" values="0.4;0.05;0.4;0.05" dur="5s" repeatCount="indefinite" begin="0.5s" />
              </circle>
            </g>
            {/* Floating leaf particles */}
            <ellipse cx="14" cy="10" rx="1" ry="0.5" fill="#66bb6a" opacity="0.4" style={{animation: `yggLeaf-${uid} 5s linear infinite`} as React.CSSProperties} />
            <ellipse cx="34" cy="14" rx="0.8" ry="0.4" fill="#4caf50" opacity="0.35" style={{animation: `yggLeaf-${uid} 6s linear infinite 1s`} as React.CSSProperties} />
            <ellipse cx="10" cy="16" rx="0.9" ry="0.45" fill="#81c784" opacity="0.3" style={{animation: `yggLeaf-${uid} 5.5s linear infinite 2s`} as React.CSSProperties} />
            <ellipse cx="38" cy="12" rx="0.7" ry="0.35" fill="#66bb6a" opacity="0.35" style={{animation: `yggLeaf-${uid} 4.5s linear infinite 3s`} as React.CSSProperties} />
            <ellipse cx="20" cy="8" rx="0.8" ry="0.4" fill="#a5d6a7" opacity="0.3" style={{animation: `yggLeaf-${uid} 7s linear infinite 1.5s`} as React.CSSProperties} />
            {/* Ancient power aura */}
            <circle cx="24" cy="18" r="18" fill="none" stroke="#ffd54f" strokeWidth="0.3" opacity="0.1" style={{animation: `yggPulse-${uid} 5s ease-in-out infinite`} as React.CSSProperties} />
            <circle cx="24" cy="18" r="22" fill="none" stroke="#ffab00" strokeWidth="0.2" opacity="0.06" style={{animation: `yggPulse-${uid} 6s ease-in-out infinite 1s`} as React.CSSProperties} />
          </g>
        )
      // Seasonal tree shapes for PlantIcon.tsx
      // viewBox="0 6 48 42", ground at y=46
      // Variables: color, dark, light, uid, trunk="#6b5b3e", s=stage 0-3

      // ── SPRING COMMON ──

      case 'sunflower':
        if (s === 0) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="41" stroke="#4caf50" strokeWidth="1.5" />
            <ellipse cx="23" cy="40" rx="1.5" ry="2" fill="#66bb6a" />
            <ellipse cx="25" cy="40.5" rx="1.5" ry="2" fill="#66bb6a" />
          </g>
        )
        if (s === 1) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="35" stroke="#4caf50" strokeWidth="2" />
            {/* Leaves on stem */}
            <ellipse cx="21" cy="41" rx="2.5" ry="1.2" fill="#43a047" transform="rotate(-20,21,41)" />
            <ellipse cx="27" cy="38" rx="2.5" ry="1.2" fill="#43a047" transform="rotate(20,27,38)" />
            {/* Small flower head */}
            <circle cx="24" cy="33" r="2.5" fill="#795548" />
            {[0,45,90,135,180,225,270,315].map((a,i)=><ellipse key={i} cx="24" cy="30.5" rx="1.2" ry="2.5" fill={color} transform={`rotate(${a},24,33)`} />)}
          </g>
        )
        if (s === 2) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="28" stroke="#4caf50" strokeWidth="2.5" />
            <ellipse cx="20" cy="40" rx="3" ry="1.5" fill="#43a047" transform="rotate(-25,20,40)" />
            <ellipse cx="28" cy="36" rx="3" ry="1.5" fill="#43a047" transform="rotate(20,28,36)" />
            <ellipse cx="21" cy="33" rx="2.5" ry="1.3" fill="#43a047" transform="rotate(-15,21,33)" />
            {/* Medium flower */}
            <circle cx="24" cy="25" r="3.5" fill="#5d4037" />
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=><ellipse key={i} cx="24" cy="21.5" rx="1.3" ry="3.5" fill={color} transform={`rotate(${a},24,25)`} />)}
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
            <ellipse cx="19" cy="41" rx="4" ry="1.8" fill="#43a047" transform="rotate(-30,19,41)" />
            <ellipse cx="29" cy="37" rx="4" ry="1.8" fill="#43a047" transform="rotate(25,29,37)" />
            <ellipse cx="20" cy="33" rx="3.5" ry="1.5" fill="#388e3c" transform="rotate(-20,20,33)" />
            <ellipse cx="28" cy="29" rx="3" ry="1.3" fill="#388e3c" transform="rotate(15,28,29)" />
            {/* Huge flower head */}
            {[0,22.5,45,67.5,90,112.5,135,157.5,180,202.5,225,247.5,270,292.5,315,337.5].map((a,i)=>(
              <ellipse key={i} cx="24" cy="15" rx="1.5" ry="4.5" fill={i%2===0?color:dark} transform={`rotate(${a},24,19)`} />
            ))}
            <circle cx="24" cy="19" r="4.5" fill={`url(#${uid}sd)`} />
            {/* Seed texture */}
            {[22,24,26,23,25,24].map((x,i)=><circle key={i} cx={x} cy={[17.5,17,17.5,19.5,19.5,21][i]} r="0.5" fill="#3e2723" opacity="0.4" />)}
          </g>
        )

      // ── AUTUMN COMMON ──

      case 'coconut':
        if (s === 0) return (
          <g>
            <line x1="24" y1="46" x2="24" y2="41" stroke={trunk} strokeWidth="1.8" />
            <path d="M22 41 Q24 39 26 41" stroke="#4caf50" strokeWidth="1" fill="none" />
            <path d="M21 42 Q24 40 27 42" stroke="#388e3c" strokeWidth="0.8" fill="none" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Slightly curved trunk */}
            <path d="M24 46 Q23 40 23 34" stroke="#8d6e63" strokeWidth="2.5" fill="none" />
            {/* Small fronds */}
            <path d="M23 34 Q17 30 12 32" stroke="#4caf50" strokeWidth="1.2" fill="none" />
            <path d="M23 34 Q29 30 34 32" stroke="#4caf50" strokeWidth="1.2" fill="none" />
            <path d="M23 34 Q22 28 20 26" stroke="#388e3c" strokeWidth="1" fill="none" />
            <path d="M23 34 Q24 28 26 26" stroke="#388e3c" strokeWidth="1" fill="none" />
            {/* Leaf detail */}
            {[14,16,18,30,32,34].map((x,i)=><line key={i} x1={x} y1={[32,31,31,31,31,32][i]} x2={x+(i<3?-1:1)} y2={[31,30,30,30,30,31][i]} stroke="#66bb6a" strokeWidth="0.5" />)}
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Taller curved trunk */}
            <path d="M24 46 Q22 38 22 28" stroke="#8d6e63" strokeWidth="3" fill="none" />
            {/* Ring marks on trunk */}
            {[44,41,38,35,32].map((y,i)=><line key={i} x1={23-i*0.2} y1={y} x2={25-i*0.2} y2={y} stroke="#795548" strokeWidth="0.5" opacity="0.4" />)}
            {/* Arching fronds */}
            <path d="M22 28 Q14 22 8 25" stroke={color} strokeWidth="1.5" fill="none" />
            <path d="M22 28 Q30 22 36 25" stroke={color} strokeWidth="1.5" fill="none" />
            <path d="M22 28 Q18 20 14 19" stroke="#388e3c" strokeWidth="1.3" fill="none" />
            <path d="M22 28 Q26 20 30 19" stroke="#388e3c" strokeWidth="1.3" fill="none" />
            <path d="M22 28 Q22 22 22 18" stroke="#43a047" strokeWidth="1.2" fill="none" />
            {/* Leaflets */}
            {[10,12,14,34,32,30,15,17,28,26,22].map((x,i)=><line key={i} x1={x} y1={[25,23,22,23,22,20,20,19,19,18,18][i]} x2={x+(i<3?-1.5:i<6?1.5:i<8?-1:i<10?1:0)} y2={[24,22,21,22,21,19,19,18,18,17,17][i]} stroke="#66bb6a" strokeWidth="0.6" />)}
            {/* Coconuts */}
            <circle cx="21" cy="29" r="1.3" fill="#6d4c41" />
            <circle cx="23" cy="29.5" r="1.3" fill="#795548" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}ct`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a1887f" /><stop offset="100%" stopColor="#6d4c41" /></linearGradient>
            </defs>
            {/* Tall curved trunk */}
            <path d="M25 46 Q22 38 21 30 Q20 24 20 20" stroke={`url(#${uid}ct)`} strokeWidth="3.5" fill="none" />
            {/* Ring marks */}
            {[44,41,38,35,32,29,26,23].map((y,i)=>{
              const xOff = i * 0.3;
              return <line key={i} x1={24-xOff} y1={y} x2={26-xOff} y2={y} stroke="#5d4037" strokeWidth="0.5" opacity="0.35" />;
            })}
            {/* Arching palm fronds */}
            <path d="M20 20 Q10 14 5 18" stroke={color} strokeWidth="1.8" fill="none" />
            <path d="M20 20 Q30 14 37 18" stroke={color} strokeWidth="1.8" fill="none" />
            <path d="M20 20 Q12 12 8 11" stroke="#388e3c" strokeWidth="1.5" fill="none" />
            <path d="M20 20 Q28 12 34 11" stroke="#388e3c" strokeWidth="1.5" fill="none" />
            <path d="M20 20 Q16 10 14 8" stroke="#43a047" strokeWidth="1.3" fill="none" />
            <path d="M20 20 Q24 10 27 8" stroke="#43a047" strokeWidth="1.3" fill="none" />
            <path d="M20 20 Q20 12 20 9" stroke={color} strokeWidth="1.2" fill="none" />
            {/* Leaflets on each frond */}
            {[7,9,11,13,35,33,31,29,10,12,14,32,30,28,15,17,26,24,20].map((x,i)=>{
              const y = [18,16,14,13,16,14,13,12,12,10,9,11,10,9,9,8,8,8,9][i];
              const dx = i<4?-1.8:i<8?1.8:i<11?-1.5:i<14?1.5:i<16?-1:i<18?1:0;
              return <line key={i} x1={x} y1={y} x2={x+dx} y2={y-0.8} stroke="#66bb6a" strokeWidth="0.5" />;
            })}
            {/* Brown coconut clusters */}
            <circle cx="19" cy="21" r="1.5" fill="#5d4037" />
            <circle cx="21" cy="21.5" r="1.5" fill="#6d4c41" />
            <circle cx="20" cy="22.5" r="1.5" fill="#795548" />
          </g>
        )
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
            <rect x="21" y="20" width="6" height="26" rx="2" fill={trunk} />
            <rect x="21" y="20" width="6" height="26" rx="2" fill={`url(#${uid}-ptrunk)`} />
            <path d="M22 38 L26 37.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M22 32 L26 31.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M22 44 L26 43.8" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            <path d="M22 26" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            {/* Trunk scars — old leaf attachment */}
            <path d="M21.5 36 Q21 35 21.5 34" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M26.5 40 Q27 39 26.5 38" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M21.5 30 Q21 29 21.5 28" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.18" />
            <path d="M26.5 34 Q27 33 26.5 32" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.18" />
            {/* Large palmate leaves radiating from crown */}
            <path d="M24 20 Q14 10 6 8 Q12 16 20 22" fill={color} stroke={dark} strokeWidth="0.4" />
            <path d="M24 20 Q34 10 42 8 Q36 16 28 22" fill={color} stroke={dark} strokeWidth="0.4" />
            <path d="M24 20 Q18 8 14 4 Q20 12 24 20" fill={color} opacity="0.8" stroke={dark} strokeWidth="0.3" />
            <path d="M24 20 Q30 8 34 4 Q28 12 24 20" fill={color} opacity="0.75" stroke={dark} strokeWidth="0.3" />
            <path d="M24 20 Q24 8 24 4" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 6 Q22 4 20 6 Q22 5 24 6" fill={color} opacity="0.6" />
            <path d="M24 20 Q10 14 4 14 Q10 18 20 22" fill={color} opacity="0.7" stroke={dark} strokeWidth="0.3" />
            <path d="M24 20 Q38 14 44 14 Q38 18 28 22" fill={color} opacity="0.65" stroke={dark} strokeWidth="0.3" />
            {/* Leaf veins */}
            <line x1="24" y1="20" x2="10" y2="10" stroke={dark} strokeWidth="0.35" opacity="0.15" />
            <line x1="24" y1="20" x2="38" y2="10" stroke={dark} strokeWidth="0.35" opacity="0.12" />
            <line x1="24" y1="20" x2="18" y2="6" stroke={dark} strokeWidth="0.3" opacity="0.12" />
            <line x1="24" y1="20" x2="30" y2="6" stroke={dark} strokeWidth="0.3" opacity="0.1" />
            <line x1="24" y1="20" x2="8" y2="14" stroke={dark} strokeWidth="0.3" opacity="0.1" />
            <line x1="24" y1="20" x2="40" y2="14" stroke={dark} strokeWidth="0.3" opacity="0.1" />
            {/* Leaf highlights */}
            <circle cx="14" cy="10" r="0.6" fill={light} opacity="0.3" />
            <circle cx="34" cy="10" r="0.55" fill={light} opacity="0.25" />
            <circle cx="20" cy="8" r="0.5" fill={light} opacity="0.25" />
            <circle cx="8" cy="12" r="0.45" fill={light} opacity="0.2" />
            {/* Cluster of papayas under leaves */}
            <ellipse cx="21" cy="23" rx="2" ry="2.8" fill="#ff9800" />
            <ellipse cx="27" cy="23" rx="1.8" ry="2.6" fill="#ffa726" />
            <ellipse cx="24" cy="24" rx="1.9" ry="2.7" fill="#ff9800" opacity="0.9" />
            <ellipse cx="22" cy="26" rx="1.6" ry="2.2" fill="#ffa726" opacity="0.8" />
            <ellipse cx="26" cy="26" rx="1.5" ry="2.1" fill="#ff9800" opacity="0.75" />
            {/* Papaya highlights */}
            <circle cx="20.3" cy="22" r="0.5" fill={light} opacity="0.4" />
            <circle cx="26.3" cy="22" r="0.45" fill={light} opacity="0.35" />
            <circle cx="23.3" cy="23" r="0.4" fill={light} opacity="0.3" />
            {/* Roots */}
            <path d="M21 46 Q19 44.5 17 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M27 46 Q29 44.5 31 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      // ── AUTUMN UNCOMMON ──

      case 'snowbell':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 43 24 40" stroke="#b0bec5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="44" rx="2" ry="0.8" fill="#cfd8dc" opacity="0.3" />
            {/* Tiny bell bud */}
            <path d="M23 39 Q24 37 25 39" stroke={color} strokeWidth="0.8" fill="none" />
            <ellipse cx="24" cy="39.5" rx="1.2" ry="0.8" fill={color} opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-sbell`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <path d="M24 46 Q23 40 24 30" stroke="#b0bec5" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Arched branches */}
            <path d="M24 34 Q18 30 14 32" stroke="#b0bec5" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q28 28 32 30" stroke="#b0bec5" strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Hanging bell flowers */}
            <path d="M14 32 L14 34" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M13 34.5 Q14 33 15 34.5" stroke={`url(#${uid}-sbell)`} strokeWidth="0.8" fill={color} opacity="0.5" />
            <path d="M32 30 L32 32" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M31 32.5 Q32 31 33 32.5" stroke={`url(#${uid}-sbell)`} strokeWidth="0.8" fill={color} opacity="0.5" />
            {/* Small canopy */}
            <ellipse cx="24" cy="26" rx="5" ry="4" fill="#cfd8dc" opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-sbell`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="50%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor="#bdbdbd" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id={`${uid}-sbark`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#9e9e9e" />
                <stop offset="50%" stopColor="#b0bec5" />
                <stop offset="100%" stopColor="#9e9e9e" />
              </linearGradient>
            </defs>
            {/* Silvery trunk */}
            <path d="M22.5 46 Q22 40 22.5 28 L25.5 28 Q26 40 25.5 46 Z" fill={`url(#${uid}-sbark)`} />
            {/* Arched branches */}
            <path d="M23 30 Q16 24 10 26" stroke="#b0bec5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M25 30 Q32 24 38 26" stroke="#b0bec5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 28 Q20 20 16 22" stroke="#b0bec5" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 28 Q28 20 32 22" stroke="#b0bec5" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Gentle canopy */}
            <ellipse cx="24" cy="20" rx="10" ry="7" fill="#cfd8dc" opacity="0.2" />
            {/* Hanging bell flowers */}
            <path d="M10 26 L10 28.5" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M8.5 29 Q10 27.5 11.5 29 L11 30 Q10 29 9 30 Z" fill={`url(#${uid}-sbell)`} opacity="0.7" />
            <path d="M38 26 L38 28.5" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M36.5 29 Q38 27.5 39.5 29 L39 30 Q38 29 37 30 Z" fill={`url(#${uid}-sbell)`} opacity="0.7" />
            <path d="M16 22 L16 24.5" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M14.5 25 Q16 23.5 17.5 25 L17 26 Q16 25 15 26 Z" fill={`url(#${uid}-sbell)`} opacity="0.6" />
            <path d="M32 22 L32 24.5" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M30.5 25 Q32 23.5 33.5 25 L33 26 Q32 25 31 26 Z" fill={`url(#${uid}-sbell)`} opacity="0.6" />
            <path d="M20 20 L20 22" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M18.5 22.5 Q20 21 21.5 22.5 L21 23.5 Q20 22.5 19 23.5 Z" fill={`url(#${uid}-sbell)`} opacity="0.5" />
            <path d="M28 20 L28 22" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M26.5 22.5 Q28 21 29.5 22.5 L29 23.5 Q28 22.5 27 23.5 Z" fill={`url(#${uid}-sbell)`} opacity="0.5" />
            {/* Snow on top */}
            <ellipse cx="24" cy="14" rx="6" ry="1.5" fill="#ffffff" opacity="0.4" />
            <ellipse cx="18" cy="16" rx="3" ry="1" fill="#ffffff" opacity="0.3" />
            <ellipse cx="30" cy="16" rx="3" ry="1" fill="#ffffff" opacity="0.3" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-sbell`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="40%" stopColor={color} stopOpacity="0.85" />
                <stop offset="100%" stopColor="#bdbdbd" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id={`${uid}-sbark`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#9e9e9e" />
                <stop offset="50%" stopColor="#bdbdbd" />
                <stop offset="100%" stopColor="#9e9e9e" />
              </linearGradient>
              <radialGradient id={`${uid}-ssnow`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#eceff1" stopOpacity="0.2" />
              </radialGradient>
            </defs>
            {/* Silvery bark trunk */}
            <path d="M21 46 Q20 40 21 26 L27 26 Q28 40 27 46 Z" fill={`url(#${uid}-sbark)`} />
            {/* Bark detail */}
            <path d="M22 36 L26 35.8" stroke="#90a4ae" strokeWidth="0.4" opacity="0.3" />
            <path d="M22 40 L26 39.8" stroke="#90a4ae" strokeWidth="0.4" opacity="0.25" />
            <path d="M22 44 L26 43.8" stroke="#90a4ae" strokeWidth="0.3" opacity="0.2" />
            {/* Elegant arched branches */}
            <path d="M22 28 Q14 22 6 24" stroke="#b0bec5" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M26 28 Q34 22 42 24" stroke="#b0bec5" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M22 26 Q16 18 10 20" stroke="#b0bec5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 26 Q32 18 38 20" stroke="#b0bec5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q20 16 16 16" stroke="#b0bec5" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M25 26 Q28 16 32 16" stroke="#b0bec5" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 26 Q24 14 24 10" stroke="#b0bec5" strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Delicate canopy outline */}
            <ellipse cx="24" cy="16" rx="14" ry="8" fill="#cfd8dc" opacity="0.12" />
            {/* Hanging bell-shaped flowers - many */}
            <path d="M6 24 L6 27" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M4 27.5 Q6 25.5 8 27.5 L7.5 29 Q6 27.5 4.5 29 Z" fill={`url(#${uid}-sbell)`} opacity="0.75" />
            <path d="M42 24 L42 27" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M40 27.5 Q42 25.5 44 27.5 L43.5 29 Q42 27.5 40.5 29 Z" fill={`url(#${uid}-sbell)`} opacity="0.75" />
            <path d="M10 20 L10 23" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M8 23.5 Q10 21.5 12 23.5 L11.5 25 Q10 23.5 8.5 25 Z" fill={`url(#${uid}-sbell)`} opacity="0.7" />
            <path d="M38 20 L38 23" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M36 23.5 Q38 21.5 40 23.5 L39.5 25 Q38 23.5 36.5 25 Z" fill={`url(#${uid}-sbell)`} opacity="0.7" />
            <path d="M16 16 L16 19" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M14 19.5 Q16 17.5 18 19.5 L17.5 21 Q16 19.5 14.5 21 Z" fill={`url(#${uid}-sbell)`} opacity="0.65" />
            <path d="M32 16 L32 19" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M30 19.5 Q32 17.5 34 19.5 L33.5 21 Q32 19.5 30.5 21 Z" fill={`url(#${uid}-sbell)`} opacity="0.65" />
            <path d="M20 14 L20 17" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M18 17.5 Q20 15.5 22 17.5 L21.5 19 Q20 17.5 18.5 19 Z" fill={`url(#${uid}-sbell)`} opacity="0.6" />
            <path d="M28 14 L28 17" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M26 17.5 Q28 15.5 30 17.5 L29.5 19 Q28 17.5 26.5 19 Z" fill={`url(#${uid}-sbell)`} opacity="0.6" />
            <path d="M24 10 L24 13" stroke="#b0bec5" strokeWidth="0.3" />
            <path d="M22 13.5 Q24 11.5 26 13.5 L25.5 15 Q24 13.5 22.5 15 Z" fill={`url(#${uid}-sbell)`} opacity="0.55" />
            {/* Additional smaller bells */}
            <path d="M8 26 L8 27.5" stroke="#b0bec5" strokeWidth="0.2" />
            <path d="M7 28 Q8 26.5 9 28 L8.7 29 Q8 28 7.3 29 Z" fill={`url(#${uid}-sbell)`} opacity="0.5" />
            <path d="M40 26 L40 27.5" stroke="#b0bec5" strokeWidth="0.2" />
            <path d="M39 28 Q40 26.5 41 28 L40.7 29 Q40 28 39.3 29 Z" fill={`url(#${uid}-sbell)`} opacity="0.5" />
            <path d="M14 18 L14 19.5" stroke="#b0bec5" strokeWidth="0.2" />
            <path d="M13 20 Q14 18.5 15 20 L14.7 21 Q14 20 13.3 21 Z" fill={`url(#${uid}-sbell)`} opacity="0.45" />
            <path d="M34 18 L34 19.5" stroke="#b0bec5" strokeWidth="0.2" />
            <path d="M33 20 Q34 18.5 35 20 L34.7 21 Q34 20 33.3 21 Z" fill={`url(#${uid}-sbell)`} opacity="0.45" />
            {/* Snow settling on top of canopy */}
            <ellipse cx="24" cy="9" rx="8" ry="2" fill={`url(#${uid}-ssnow)`} />
            <ellipse cx="16" cy="12" rx="5" ry="1.5" fill="#ffffff" opacity="0.35" />
            <ellipse cx="32" cy="12" rx="5" ry="1.5" fill="#ffffff" opacity="0.35" />
            <ellipse cx="10" cy="18" rx="4" ry="1.2" fill="#ffffff" opacity="0.25" />
            <ellipse cx="38" cy="18" rx="4" ry="1.2" fill="#ffffff" opacity="0.25" />
            <ellipse cx="6" cy="22" rx="3" ry="1" fill="#ffffff" opacity="0.2" />
            <ellipse cx="42" cy="22" rx="3" ry="1" fill="#ffffff" opacity="0.2" />
            {/* Ground snow */}
            <ellipse cx="24" cy="46" rx="12" ry="1.2" fill="#ffffff" opacity="0.2" />
            {/* Roots */}
            <path d="M21 46 Q18 44 14 46" stroke="#9e9e9e" strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M27 46 Q30 44 34 46" stroke="#9e9e9e" strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      // ============================================================
      // EPIC — animated
      // ============================================================

      case 'monsoon':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 43 24 39" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="44" rx="2" ry="0.8" fill="#5d4037" opacity="0.3" />
            {/* Small tropical leaf */}
            <ellipse cx="23" cy="38" rx="2.5" ry="1.5" fill="#1b5e20" opacity="0.6" />
            <ellipse cx="25.5" cy="38.5" rx="2" ry="1" fill={color} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23.5 40 24 30" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q20 30 18 26" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q28 28 30 24" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Lush canopy */}
            <ellipse cx="24" cy="22" rx="8" ry="6" fill="#1b5e20" opacity="0.7" />
            <ellipse cx="20" cy="20" rx="4" ry="3" fill="#2e7d32" opacity="0.5" />
            <ellipse cx="28" cy="22" rx="3.5" ry="2.5" fill={color} opacity="0.3" />
            {/* Rain hint */}
            <line x1="20" y1="12" x2="20" y2="16" stroke="#b0bec5" strokeWidth="0.3" opacity="0.3" />
            <line x1="28" y1="10" x2="28" y2="14" stroke="#b0bec5" strokeWidth="0.3" opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-mcan`} cx="50%" cy="40%">
                <stop offset="0%" stopColor="#2e7d32" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1b5e20" stopOpacity="0.8" />
              </radialGradient>
              <filter id={`${uid}-mrain`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
              </filter>
            </defs>
            <path d="M22 46 Q21 40 22 28 L26 28 Q27 40 26 46 Z" fill={trunk} />
            <path d="M22 28 Q16 24 12 20" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 28 Q32 24 36 20" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            {/* Lush canopy */}
            <ellipse cx="24" cy="16" rx="13" ry="10" fill={`url(#${uid}-mcan)`} />
            <ellipse cx="18" cy="14" rx="4" ry="3" fill="#388e3c" opacity="0.5" />
            <ellipse cx="30" cy="16" rx="4" ry="3" fill="#1b5e20" opacity="0.5" />
            {/* Water droplets on leaves */}
            <circle cx="16" cy="12" r="0.5" fill="#b3e5fc" opacity="0.5" />
            <circle cx="30" cy="10" r="0.4" fill="#b3e5fc" opacity="0.4" />
            <circle cx="24" cy="8" r="0.4" fill="#b3e5fc" opacity="0.45" />
            {/* Rain streaks */}
            <g filter={`url(#${uid}-mrain)`}>
              <line x1="10" y1="4" x2="10" y2="10" stroke="#90a4ae" strokeWidth="0.4" opacity="0.3">
                <animate attributeName="y1" values="4;30" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="y2" values="10;36" dur="0.8s" repeatCount="indefinite" />
              </line>
              <line x1="20" y1="2" x2="20" y2="8" stroke="#90a4ae" strokeWidth="0.3" opacity="0.25">
                <animate attributeName="y1" values="2;28" dur="0.7s" repeatCount="indefinite" />
                <animate attributeName="y2" values="8;34" dur="0.7s" repeatCount="indefinite" />
              </line>
              <line x1="34" y1="6" x2="34" y2="12" stroke="#90a4ae" strokeWidth="0.35" opacity="0.3">
                <animate attributeName="y1" values="6;32" dur="0.9s" repeatCount="indefinite" />
                <animate attributeName="y2" values="12;38" dur="0.9s" repeatCount="indefinite" />
              </line>
            </g>
            {/* Puddle at base */}
            <ellipse cx="24" cy="46" rx="6" ry="1" fill="#b3e5fc" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes mrain-${uid} {
                  0% { transform: translateY(-10px); opacity: 0; }
                  10% { opacity: 0.4; }
                  90% { opacity: 0.3; }
                  100% { transform: translateY(40px); opacity: 0; }
                }
                @keyframes mripple-${uid} {
                  0% { r: 0; opacity: 0.5; }
                  100% { r: 3; opacity: 0; }
                }
              `}</style>
              <radialGradient id={`${uid}-mcan`} cx="50%" cy="40%">
                <stop offset="0%" stopColor="#388e3c" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#2e7d32" stopOpacity="0.85" />
                <stop offset="80%" stopColor="#1b5e20" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0d3311" stopOpacity="0.8" />
              </radialGradient>
              <radialGradient id={`${uid}-mgloss`} cx="40%" cy="30%">
                <stop offset="0%" stopColor="#a5d6a7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#2e7d32" stopOpacity="0" />
              </radialGradient>
              <filter id={`${uid}-mrainblur`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" />
              </filter>
              <linearGradient id={`${uid}-mtrunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3e2723" />
                <stop offset="50%" stopColor="#5d4037" />
                <stop offset="100%" stopColor="#3e2723" />
              </linearGradient>
            </defs>
            {/* Trunk - wet appearance */}
            <path d="M21 46 Q20 40 21 26 L27 26 Q28 40 27 46 Z" fill={`url(#${uid}-mtrunk)`} />
            <path d="M22 36 L26 35.8" stroke="#2e1a12" strokeWidth="0.5" opacity="0.3" />
            <path d="M22 40 L26 39.8" stroke="#2e1a12" strokeWidth="0.4" opacity="0.25" />
            <path d="M22 44 L26 43.8" stroke="#2e1a12" strokeWidth="0.4" opacity="0.2" />
            {/* Wet sheen on trunk */}
            <path d="M23 28 L23 46" stroke="#a5d6a7" strokeWidth="0.3" opacity="0.1" />
            <path d="M25 30 L25 44" stroke="#a5d6a7" strokeWidth="0.2" opacity="0.08" />
            {/* Branches */}
            <path d="M22 28 Q14 22 6 18" stroke="#5d4037" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M26 28 Q34 22 42 18" stroke="#5d4037" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M22 26 Q16 18 10 12" stroke="#5d4037" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 26 Q32 18 38 12" stroke="#5d4037" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 26 Q24 16 24 8" stroke="#5d4037" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            {/* Lush dark green canopy - glistening */}
            <ellipse cx="24" cy="14" rx="16" ry="11" fill={`url(#${uid}-mcan)`} />
            <ellipse cx="6" cy="16" rx="5" ry="3.5" fill="#1b5e20" opacity="0.7" />
            <ellipse cx="42" cy="16" rx="5" ry="3.5" fill="#1b5e20" opacity="0.7" />
            <ellipse cx="14" cy="10" rx="5" ry="3.5" fill="#2e7d32" opacity="0.5" />
            <ellipse cx="34" cy="10" rx="5" ry="3.5" fill="#2e7d32" opacity="0.5" />
            <ellipse cx="24" cy="6" rx="5" ry="3.5" fill="#388e3c" opacity="0.4" />
            <ellipse cx="18" cy="16" rx="4" ry="3" fill="#0d3311" opacity="0.5" />
            <ellipse cx="30" cy="16" rx="4" ry="3" fill="#0d3311" opacity="0.5" />
            <ellipse cx="10" cy="18" rx="4" ry="2.5" fill="#1b5e20" opacity="0.6" />
            <ellipse cx="38" cy="18" rx="4" ry="2.5" fill="#1b5e20" opacity="0.6" />
            {/* Glossy wet sheen on canopy */}
            <ellipse cx="20" cy="10" rx="5" ry="3" fill={`url(#${uid}-mgloss)`} />
            <ellipse cx="30" cy="12" rx="4" ry="2.5" fill={`url(#${uid}-mgloss)`} />
            {/* Water droplets on leaves */}
            <circle cx="12" cy="10" r="0.6" fill="#b3e5fc" opacity="0.5" />
            <circle cx="28" cy="6" r="0.5" fill="#b3e5fc" opacity="0.45" />
            <circle cx="36" cy="12" r="0.5" fill="#b3e5fc" opacity="0.4" />
            <circle cx="20" cy="8" r="0.4" fill="#b3e5fc" opacity="0.4" />
            <circle cx="16" cy="14" r="0.45" fill="#b3e5fc" opacity="0.35" />
            <circle cx="32" cy="8" r="0.4" fill="#b3e5fc" opacity="0.35" />
            <circle cx="24" cy="4" r="0.5" fill="#b3e5fc" opacity="0.4" />
            {/* Animated rain streaks */}
            <g filter={`url(#${uid}-mrainblur)`}>
              <line x1="8" y1="0" x2="8" y2="5" stroke="#90a4ae" strokeWidth="0.4" style={{animation: `mrain-${uid} 0.6s linear infinite`} as React.CSSProperties} />
              <line x1="14" y1="2" x2="14" y2="7" stroke="#90a4ae" strokeWidth="0.35" style={{animation: `mrain-${uid} 0.7s linear infinite 0.1s`} as React.CSSProperties} />
              <line x1="20" y1="0" x2="20" y2="5" stroke="#90a4ae" strokeWidth="0.3" style={{animation: `mrain-${uid} 0.65s linear infinite 0.2s`} as React.CSSProperties} />
              <line x1="28" y1="2" x2="28" y2="7" stroke="#90a4ae" strokeWidth="0.35" style={{animation: `mrain-${uid} 0.55s linear infinite 0.15s`} as React.CSSProperties} />
              <line x1="34" y1="0" x2="34" y2="5" stroke="#90a4ae" strokeWidth="0.3" style={{animation: `mrain-${uid} 0.75s linear infinite 0.3s`} as React.CSSProperties} />
              <line x1="40" y1="2" x2="40" y2="7" stroke="#90a4ae" strokeWidth="0.4" style={{animation: `mrain-${uid} 0.6s linear infinite 0.25s`} as React.CSSProperties} />
              <line x1="11" y1="4" x2="11" y2="9" stroke="#90a4ae" strokeWidth="0.3" style={{animation: `mrain-${uid} 0.8s linear infinite 0.35s`} as React.CSSProperties} />
              <line x1="24" y1="0" x2="24" y2="5" stroke="#90a4ae" strokeWidth="0.35" style={{animation: `mrain-${uid} 0.5s linear infinite 0.4s`} as React.CSSProperties} />
              <line x1="37" y1="4" x2="37" y2="9" stroke="#90a4ae" strokeWidth="0.3" style={{animation: `mrain-${uid} 0.7s linear infinite 0.05s`} as React.CSSProperties} />
              <line x1="17" y1="0" x2="17" y2="5" stroke="#90a4ae" strokeWidth="0.25" style={{animation: `mrain-${uid} 0.85s linear infinite 0.45s`} as React.CSSProperties} />
              <line x1="31" y1="2" x2="31" y2="7" stroke="#90a4ae" strokeWidth="0.3" style={{animation: `mrain-${uid} 0.58s linear infinite 0.2s`} as React.CSSProperties} />
              <line x1="6" y1="6" x2="6" y2="11" stroke="#90a4ae" strokeWidth="0.35" style={{animation: `mrain-${uid} 0.72s linear infinite 0.5s`} as React.CSSProperties} />
              <line x1="42" y1="4" x2="42" y2="9" stroke="#90a4ae" strokeWidth="0.3" style={{animation: `mrain-${uid} 0.62s linear infinite 0.08s`} as React.CSSProperties} />
            </g>
            {/* Puddle at base with animated ripples */}
            <ellipse cx="24" cy="46" rx="10" ry="1.5" fill="#b3e5fc" opacity="0.15" />
            <ellipse cx="20" cy="46.5" rx="8" ry="0.8" fill="#80deea" opacity="0.1" />
            {/* Animated ripple circles */}
            <circle cx="18" cy="46" fill="none" stroke="#b3e5fc" strokeWidth="0.3" style={{animation: `mripple-${uid} 2s ease-out infinite`} as React.CSSProperties} />
            <circle cx="28" cy="46" fill="none" stroke="#b3e5fc" strokeWidth="0.3" style={{animation: `mripple-${uid} 2.5s ease-out infinite 0.5s`} as React.CSSProperties} />
            <circle cx="22" cy="46.5" fill="none" stroke="#b3e5fc" strokeWidth="0.25" style={{animation: `mripple-${uid} 2.2s ease-out infinite 1s`} as React.CSSProperties} />
            <circle cx="32" cy="46" fill="none" stroke="#b3e5fc" strokeWidth="0.25" style={{animation: `mripple-${uid} 1.8s ease-out infinite 1.5s`} as React.CSSProperties} />
            <circle cx="14" cy="46.5" fill="none" stroke="#b3e5fc" strokeWidth="0.2" style={{animation: `mripple-${uid} 2.8s ease-out infinite 0.3s`} as React.CSSProperties} />
            {/* Roots */}
            <path d="M21 46 Q17 44 12 46" stroke="#5d4037" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M27 46 Q31 44 36 46" stroke="#5d4037" strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )
      case 'grape':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 43 24 40" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="42" rx="2.5" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 40 Q22 38 21 36" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M21 36 Q18 34 17 35 Q18 32 21 35" fill="#4caf50" opacity="0.6" />
            <path d="M21 36 Q23 33 25 35 Q24 32 21 35" fill="#4caf50" opacity="0.5" />
            <path d="M19 33.5 L18 34.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23 42 23 36" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 36 Q20 32 18 30" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 34 Q26 30 29 28" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Leaves */}
            <path d="M16 26 Q14 22 17 21 Q20 21 21 24 Q20 27 17 28 Q15 28 16 26 Z" fill="#4caf50" opacity="0.7" />
            <path d="M28 24 Q27 21 29 20 Q32 20 33 23 Q32 26 29 26 Q27 26 28 24 Z" fill="#4caf50" opacity="0.6" />
            <path d="M20 30 Q18 28 20 26 Q22 27 21 30 Z" fill="#4caf50" opacity="0.5" />
            {/* Leaf veins */}
            <path d="M17 22 L18.5 25.5" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M30 21 L30.5 24" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* Tendrils */}
            <path d="M19 30 Q17 29 16 30 Q15.5 31 16.5 31.5" stroke={trunk} strokeWidth="0.5" fill="none" opacity="0.4" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Trunk — twisted vine */}
            <path d="M24 46 Q22 40 23 34" stroke={trunk} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M25 46 Q26 42 24 36" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M23 34 Q18 28 15 24" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q28 28 32 26" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 38 Q20 36 18 34" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
            {/* Leaves */}
            <path d="M13 20 Q11 16 14 15 Q17 15 18 18 Q17 21 14 22 Q12 22 13 20 Z" fill="#4caf50" opacity="0.7" />
            <path d="M30 22 Q29 18 31 17 Q34 17 35 20 Q34 23 31 24 Q29 24 30 22 Z" fill="#4caf50" opacity="0.65" />
            <path d="M20 26 Q18 24 20 22 Q22 23 21 26 Z" fill="#4caf50" opacity="0.5" />
            <path d="M26 28 Q28 26 27 24 Q25 25 26 28 Z" fill="#4caf50" opacity="0.45" />
            {/* Grape cluster 1 */}
            <circle cx="16" cy="26" r="1.4" fill={color} />
            <circle cx="18" cy="27" r="1.4" fill={color} />
            <circle cx="17" cy="28.5" r="1.4" fill={color} />
            <circle cx="15.5" cy="28" r="1.2" fill={dark} opacity="0.6" />
            <circle cx="16.5" cy="26.5" r="0.5" fill={light} opacity="0.3" />
            {/* Grape cluster 2 */}
            <circle cx="31" cy="28" r="1.3" fill={color} />
            <circle cx="33" cy="29" r="1.3" fill={color} />
            <circle cx="32" cy="30.2" r="1.3" fill={color} />
            <circle cx="31.5" cy="28.5" r="0.5" fill={light} opacity="0.25" />
            {/* Tendrils */}
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
            {/* Leaves */}
            <path d="M10 18 Q8 14 11 12 Q14 12 16 15 Q15 18 12 20 Q9 20 10 18 Z" fill="#4caf50" opacity="0.7" />
            <path d="M34 20 Q32 16 34 14 Q37 14 39 17 Q38 20 35 22 Q33 22 34 20 Z" fill="#4caf50" opacity="0.65" />
            <path d="M18 24 Q16 22 18 20 Q20 21 19 24 Z" fill="#4caf50" opacity="0.5" />
            <path d="M28 22 Q30 20 29 18 Q27 19 28 22 Z" fill="#4caf50" opacity="0.45" />
            <path d="M22 28 Q20 26 22 24 Q24 25 23 28 Z" fill="#4caf50" opacity="0.4" />
            {/* Leaf veins */}
            <path d="M11 13 L13.5 17.5" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M35 15 L36.5 19" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* Grape cluster 1 — large */}
            <circle cx="14" cy="24" r="1.5" fill={`url(#${uid}-grape)`} />
            <circle cx="16" cy="25" r="1.5" fill={`url(#${uid}-grape)`} />
            <circle cx="12.5" cy="25.5" r="1.5" fill={`url(#${uid}-grape)`} />
            <circle cx="15" cy="26.5" r="1.5" fill={color} />
            <circle cx="13" cy="27" r="1.3" fill={dark} opacity="0.5" />
            <circle cx="14.5" cy="24.5" r="0.5" fill={light} opacity="0.35" />
            <circle cx="16.5" cy="25.5" r="0.4" fill={light} opacity="0.25" />
            {/* Grape cluster 2 */}
            <circle cx="33" cy="26" r="1.4" fill={`url(#${uid}-grape)`} />
            <circle cx="35" cy="27" r="1.4" fill={`url(#${uid}-grape)`} />
            <circle cx="34" cy="28.2" r="1.4" fill={color} />
            <circle cx="32.5" cy="28" r="1.2" fill={dark} opacity="0.5" />
            <circle cx="33.5" cy="26.5" r="0.5" fill={light} opacity="0.3" />
            {/* Grape cluster 3 */}
            <circle cx="20" cy="30" r="1.3" fill={`url(#${uid}-grape)`} />
            <circle cx="22" cy="31" r="1.3" fill={color} />
            <circle cx="21" cy="32" r="1.3" fill={color} />
            <circle cx="20.5" cy="30.5" r="0.4" fill={light} opacity="0.3" />
            {/* Grape cluster 4 */}
            <circle cx="28" cy="30" r="1.2" fill={color} />
            <circle cx="29.5" cy="31" r="1.2" fill={color} />
            <circle cx="28.8" cy="30.5" r="0.4" fill={light} opacity="0.25" />
            {/* Tendrils */}
            <path d="M12 22 Q10 21 9 22 Q8.5 23 9.5 23.5" stroke="#7a6b4e" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M36 24 Q38 23 39 24 Q39 25 38 25" stroke="#7a6b4e" strokeWidth="0.5" fill="none" opacity="0.35" />
            {/* Roots */}
            <path d="M22 46 Q19 45 17 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q29 45 31 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'strawberry':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q24 44 24 42" stroke="#5d8a3c" strokeWidth="1" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="43" rx="2.5" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 42 Q22 40 20 40 Q21 38 24 40" fill="#5d8a3c" opacity="0.6" />
            <path d="M24 42 Q26 40 28 40 Q27 38 24 40" fill="#5d8a3c" opacity="0.5" />
            <circle cx="23" cy="39.5" r="0.3" fill="#7cb342" opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q24 43 24 40" stroke="#5d8a3c" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Leaves */}
            <path d="M24 40 Q20 36 16 36 Q18 33 22 35 Q24 37 24 40 Z" fill="#4caf50" opacity="0.7" />
            <path d="M24 40 Q28 36 32 36 Q30 33 26 35 Q24 37 24 40 Z" fill="#4caf50" opacity="0.6" />
            <path d="M24 40 Q24 35 24 32 Q22 34 24 37" fill="#4caf50" opacity="0.5" />
            {/* White flowers */}
            <circle cx="19" cy="35" r="2" fill="white" opacity="0.7" />
            <circle cx="19" cy="35" r="0.8" fill="#ffeb3b" opacity="0.6" />
            <circle cx="29" cy="34" r="1.8" fill="white" opacity="0.6" />
            <circle cx="29" cy="34" r="0.7" fill="#ffeb3b" opacity="0.5" />
            {/* Leaf veins */}
            <path d="M20 36 L18 35" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            <path d="M28 36 L30 35" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Bush stems */}
            <path d="M24 46 Q23 42 22 38" stroke="#5d8a3c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q25 42 26 38" stroke="#5d8a3c" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M22 40 Q18 36 14 36" stroke="#5d8a3c" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M26 40 Q30 36 34 36" stroke="#5d8a3c" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Leaves */}
            <path d="M12 32 Q10 28 13 27 Q16 27 18 30 Q17 33 14 34 Q11 34 12 32 Z" fill="#4caf50" opacity="0.7" />
            <path d="M30 30 Q29 27 31 26 Q34 26 36 29 Q35 32 32 33 Q29 33 30 30 Z" fill="#4caf50" opacity="0.65" />
            <path d="M20 34 Q18 32 20 30 Q22 31 21 34 Z" fill="#4caf50" opacity="0.5" />
            <path d="M28 34 Q30 32 29 30 Q27 31 28 34 Z" fill="#4caf50" opacity="0.45" />
            {/* White flower */}
            <circle cx="22" cy="30" r="1.8" fill="white" opacity="0.6" />
            <circle cx="22" cy="30" r="0.6" fill="#ffeb3b" opacity="0.5" />
            {/* Strawberry 1 */}
            <path d="M16 36 Q14 34 16 32 Q18 34 16 36 Z" fill={color} />
            <circle cx="15.5" cy="33.5" r="0.3" fill="#ffeb3b" opacity="0.5" />
            <circle cx="16.5" cy="34.5" r="0.3" fill="#ffeb3b" opacity="0.4" />
            <circle cx="15.8" cy="35" r="0.3" fill="#ffeb3b" opacity="0.4" />
            <path d="M15 32 L17 32" stroke="#4caf50" strokeWidth="0.6" fill="none" />
            {/* Strawberry 2 */}
            <path d="M32 37 Q30 35 32 33 Q34 35 32 37 Z" fill={color} />
            <circle cx="31.5" cy="34.5" r="0.3" fill="#ffeb3b" opacity="0.4" />
            <circle cx="32.5" cy="35.5" r="0.3" fill="#ffeb3b" opacity="0.4" />
            <path d="M31 33 L33 33" stroke="#4caf50" strokeWidth="0.6" fill="none" />
          </g>
        )
        return (
          <g>
            {/* Bush structure */}
            <path d="M24 46 Q22 42 20 38" stroke="#5d8a3c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q26 42 28 38" stroke="#5d8a3c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M20 40 Q16 36 12 34" stroke="#5d8a3c" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M28 40 Q32 36 36 34" stroke="#5d8a3c" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M22 38 Q20 36 18 36" stroke="#5d8a3c" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
            {/* Dense leaves */}
            <path d="M10 30 Q8 26 11 24 Q14 24 16 27 Q15 30 12 32 Q9 32 10 30 Z" fill="#4caf50" opacity="0.7" />
            <path d="M32 28 Q31 24 33 23 Q36 23 38 26 Q37 29 34 30 Q31 30 32 28 Z" fill="#4caf50" opacity="0.65" />
            <path d="M20 32 Q18 28 21 27 Q24 28 23 31 Q22 33 20 32 Z" fill="#4caf50" opacity="0.6" />
            <path d="M26 30 Q28 27 26 25 Q24 26 25 29 Z" fill="#4caf50" opacity="0.5" />
            <path d="M16 34 Q14 32 16 30 Q18 31 17 34 Z" fill="#4caf50" opacity="0.45" />
            <path d="M30 34 Q32 32 31 30 Q29 31 30 34 Z" fill="#4caf50" opacity="0.4" />
            {/* Leaf veins */}
            <path d="M11 25 L13.5 29" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M34 24 L35.5 27.5" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* White flowers */}
            <circle cx="24" cy="28" r="1.5" fill="white" opacity="0.6" />
            <circle cx="24" cy="28" r="0.5" fill="#ffeb3b" opacity="0.5" />
            {/* Strawberry 1 — large */}
            <path d="M14 38 Q12 35 14 32 Q16 35 14 38 Z" fill={color} />
            <circle cx="13.3" cy="34" r="0.35" fill="#ffeb3b" opacity="0.5" />
            <circle cx="14.5" cy="35" r="0.35" fill="#ffeb3b" opacity="0.45" />
            <circle cx="13.8" cy="36" r="0.35" fill="#ffeb3b" opacity="0.4" />
            <circle cx="14.5" cy="33.5" r="0.3" fill="#ffeb3b" opacity="0.4" />
            <path d="M13 32 L15 32" stroke="#4caf50" strokeWidth="0.7" fill="none" />
            <circle cx="13.5" cy="33.2" r="0.4" fill={light} opacity="0.25" />
            {/* Strawberry 2 */}
            <path d="M34 38 Q32 35.5 34 33 Q36 35.5 34 38 Z" fill={color} />
            <circle cx="33.5" cy="35" r="0.3" fill="#ffeb3b" opacity="0.45" />
            <circle cx="34.5" cy="36" r="0.3" fill="#ffeb3b" opacity="0.4" />
            <circle cx="34" cy="34.5" r="0.3" fill="#ffeb3b" opacity="0.4" />
            <path d="M33 33 L35 33" stroke="#4caf50" strokeWidth="0.6" fill="none" />
            {/* Strawberry 3 */}
            <path d="M22 40 Q20.5 38 22 36 Q23.5 38 22 40 Z" fill={color} opacity="0.9" />
            <circle cx="21.5" cy="37.5" r="0.3" fill="#ffeb3b" opacity="0.4" />
            <circle cx="22.5" cy="38.5" r="0.3" fill="#ffeb3b" opacity="0.35" />
            <path d="M21.3 36 L22.7 36" stroke="#4caf50" strokeWidth="0.5" fill="none" />
            {/* Strawberry 4 */}
            <path d="M28 40 Q26.5 38.5 28 37 Q29.5 38.5 28 40 Z" fill={color} opacity="0.85" />
            <circle cx="27.8" cy="38" r="0.25" fill="#ffeb3b" opacity="0.35" />
            <path d="M27.3 37 L28.7 37" stroke="#4caf50" strokeWidth="0.5" fill="none" />
          </g>
        )

      case 'pear':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="40" rx="3" ry="2" fill="#8B7355" opacity="0.4" />
            <path d="M24 38 Q23 36 24 33" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 33 Q20 30 18 32 Q20 28 24 32" fill="#4caf50" opacity="0.7" />
            <path d="M24 33 Q28 30 30 32 Q28 28 24 32" fill="#4caf50" opacity="0.6" />
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
            <ellipse cx="20" cy="18" rx="4" ry="3" fill="#66bb6a" opacity="0.2" />
            <ellipse cx="28" cy="24" rx="3.5" ry="2.5" fill="#388e3c" opacity="0.12" />
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
            <ellipse cx="19" cy="16" rx="5" ry="4" fill="#66bb6a" opacity="0.2" />
            <ellipse cx="30" cy="24" rx="4" ry="3" fill="#388e3c" opacity="0.12" />
            <ellipse cx="24" cy="28" rx="8" ry="2.5" fill="#388e3c" opacity="0.1" />
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
            {/* Leaf highlights */}
            <circle cx="16" cy="10" r="0.6" fill="#81c784" opacity="0.3" />
            <circle cx="28" cy="8" r="0.5" fill="#81c784" opacity="0.25" />
            <circle cx="12" cy="20" r="0.5" fill="#81c784" opacity="0.25" />
            {/* Roots */}
            <path d="M20 46 Q17 45 14 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M28 46 Q31 45 34 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'melon':
        if (s === 0) return (
          <g>
            <ellipse cx="24" cy="44" rx="3" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 46 Q24 44 24 42" stroke="#5d8a3c" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M24 42 Q22 40 20 40.5 Q21 38 24 41" fill="#4caf50" opacity="0.6" />
            <path d="M24 42 Q26 40 28 40.5 Q27 38 24 41" fill="#4caf50" opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Trailing vine on ground */}
            <path d="M24 46 Q18 45 12 46" stroke="#5d8a3c" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q30 45 36 46" stroke="#5d8a3c" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M20 46 Q20 44 18 43" stroke="#5d8a3c" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.5" />
            {/* Broad leaves */}
            <path d="M14 42 Q12 38 14 36 Q17 36 18 39 Q17 42 14 43 Z" fill="#4caf50" opacity="0.7" />
            <path d="M34 42 Q32 39 34 37 Q36 37 37 40 Q36 43 34 43 Z" fill="#4caf50" opacity="0.6" />
            <path d="M22 42 Q20 40 22 39 Q24 40 23 42 Z" fill="#4caf50" opacity="0.5" />
            <path d="M28 42 Q30 40 28 39 Q26 40 27 42 Z" fill="#4caf50" opacity="0.45" />
            {/* Leaf veins */}
            <path d="M14 37 L16 40" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            <path d="M34 38 L35 41" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.2" />
            {/* Small flower */}
            <circle cx="24" cy="44" r="1.5" fill="#ffeb3b" opacity="0.4" />
            <circle cx="24" cy="44" r="0.6" fill="#ff8f00" opacity="0.3" />
            {/* Tendrils */}
            <path d="M16 44 Q15 43 14 43.5 Q13.5 44 14 44.5" stroke="#5d8a3c" strokeWidth="0.4" fill="none" opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Trailing vines */}
            <path d="M24 46 Q16 44 8 46" stroke="#5d8a3c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q32 44 40 46" stroke="#5d8a3c" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M18 45 Q16 43 14 42" stroke="#5d8a3c" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M30 45 Q32 43 34 42" stroke="#5d8a3c" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.4" />
            {/* Broad leaves */}
            <path d="M10 42 Q8 38 10 35 Q13 35 15 38 Q14 42 11 43 Z" fill="#4caf50" opacity="0.7" />
            <path d="M36 42 Q34 38 36 36 Q39 36 40 39 Q39 42 37 43 Z" fill="#4caf50" opacity="0.65" />
            <path d="M20 42 Q18 40 20 38 Q22 39 21 42 Z" fill="#4caf50" opacity="0.5" />
            <path d="M28 42 Q30 40 28 38 Q26 39 27 42 Z" fill="#4caf50" opacity="0.45" />
            {/* Leaf veins */}
            <path d="M10 36 L12.5 39.5" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            <path d="M37 37 L38 40" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.2" />
            {/* Melon — striped */}
            <ellipse cx="24" cy="42" rx="5" ry="4" fill={color} />
            <ellipse cx="24" cy="42" rx="5" ry="4" fill={dark} opacity="0.1" />
            {/* Stripes */}
            <path d="M21 38.5 Q21 42 21 45.5" stroke="#2e7d32" strokeWidth="0.6" fill="none" opacity="0.3" />
            <path d="M24 38 Q24 42 24 46" stroke="#2e7d32" strokeWidth="0.6" fill="none" opacity="0.25" />
            <path d="M27 38.5 Q27 42 27 45.5" stroke="#2e7d32" strokeWidth="0.6" fill="none" opacity="0.3" />
            {/* Highlight */}
            <ellipse cx="22" cy="40" rx="1.5" ry="1" fill={light} opacity="0.25" />
            {/* Flower */}
            <circle cx="16" cy="43" r="1.2" fill="#ffeb3b" opacity="0.35" />
            {/* Tendril */}
            <path d="M12 43 Q11 42 10 42.5 Q9.5 43 10 43.5" stroke="#5d8a3c" strokeWidth="0.4" fill="none" opacity="0.3" />
          </g>
        )
        return (
          <g>
            {/* Trailing vines — extensive */}
            <path d="M24 46 Q14 43 4 46" stroke="#5d8a3c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q34 43 44 46" stroke="#5d8a3c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M16 44 Q12 42 8 42" stroke="#5d8a3c" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M32 44 Q36 42 40 42" stroke="#5d8a3c" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M12 44 Q10 43 8 43" stroke="#5d8a3c" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d="M36 44 Q38 43 40 43" stroke="#5d8a3c" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.3" />
            {/* Broad leaves */}
            <path d="M6 42 Q4 38 6 35 Q9 34 11 37 Q10 41 7 43 Z" fill="#4caf50" opacity="0.7" />
            <path d="M40 42 Q38 38 40 36 Q43 36 44 39 Q43 42 41 43 Z" fill="#4caf50" opacity="0.65" />
            <path d="M14 40 Q12 37 14 36 Q16 37 15 40 Z" fill="#4caf50" opacity="0.6" />
            <path d="M34 40 Q36 37 34 36 Q32 37 33 40 Z" fill="#4caf50" opacity="0.55" />
            <path d="M18 42 Q16 40 18 39 Q20 40 19 42 Z" fill="#4caf50" opacity="0.5" />
            <path d="M30 42 Q32 40 30 39 Q28 40 29 42 Z" fill="#4caf50" opacity="0.45" />
            {/* Leaf veins */}
            <path d="M6 36 L8.5 39" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            <path d="M41 37 L42 40" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.2" />
            {/* Large melon — striped watermelon style */}
            <ellipse cx="24" cy="41" rx="7" ry="5" fill={color} />
            <ellipse cx="24" cy="43" rx="6" ry="2" fill={dark} opacity="0.12" />
            {/* Stripes */}
            <path d="M19 36.5 Q19 41 19 45.5" stroke="#2e7d32" strokeWidth="0.7" fill="none" opacity="0.3" />
            <path d="M22 36 Q22 41 22 46" stroke="#2e7d32" strokeWidth="0.6" fill="none" opacity="0.25" />
            <path d="M24 36 Q24 41 24 46" stroke="#1b5e20" strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M26 36 Q26 41 26 46" stroke="#2e7d32" strokeWidth="0.6" fill="none" opacity="0.25" />
            <path d="M29 36.5 Q29 41 29 45.5" stroke="#2e7d32" strokeWidth="0.7" fill="none" opacity="0.3" />
            {/* Highlight */}
            <ellipse cx="21" cy="39" rx="2" ry="1.3" fill={light} opacity="0.25" />
            <circle cx="20" cy="38" r="0.5" fill={light} opacity="0.2" />
            {/* Stem nub */}
            <path d="M24 36 Q24 35 24.5 34.5" stroke="#5d8a3c" strokeWidth="0.6" fill="none" />
            {/* Tendrils */}
            <path d="M8 43 Q7 42 6 42.5 Q5.5 43 6 43.5" stroke="#5d8a3c" strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M40 43 Q41 42 42 42.5 Q42.5 43 42 43.5" stroke="#5d8a3c" strokeWidth="0.4" fill="none" opacity="0.25" />
            {/* Yellow flowers */}
            <circle cx="10" cy="42" r="1.3" fill="#ffeb3b" opacity="0.35" />
            <circle cx="10" cy="42" r="0.5" fill="#ff8f00" opacity="0.25" />
            <circle cx="38" cy="42" r="1" fill="#ffeb3b" opacity="0.3" />
          </g>
        )
      case 'gooseberry':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 38" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" />
            <ellipse cx="24" cy="44" rx="2.5" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 38 Q21 35 19 36.5 Q21 33 24 36" fill="#4a8c3a" opacity="0.7" />
            <path d="M24 38 Q27 35 29 36.5 Q27 33 24 36" fill="#3a7a2a" opacity="0.6" />
            {/* Tiny thorns */}
            <line x1="21" y1="35.5" x2="20" y2="34.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <line x1="27" y1="35.5" x2="28" y2="34.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            {/* Arching branches */}
            <path d="M24 38 Q18 34 14 36" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q30 32 34 34" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q20 30 16 28" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q28 30 32 28" stroke={trunk} strokeWidth="0.9" strokeLinecap="round" fill="none" />
            {/* Thorns */}
            <line x1="20" y1="35" x2="19" y2="33.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <line x1="28" y1="33" x2="29" y2="31.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <line x1="18" y1="31" x2="17" y2="29.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            {/* Foliage clusters */}
            <ellipse cx="15" cy="30" rx="5" ry="4" fill="#4a8c3a" opacity="0.7" />
            <ellipse cx="24" cy="28" rx="6" ry="5" fill="#3a7a2a" opacity="0.8" />
            <ellipse cx="33" cy="30" rx="5" ry="4" fill="#4a8c3a" opacity="0.65" />
            <circle cx="18" cy="26" r="0.5" fill={light} opacity="0.15" />
            <circle cx="30" cy="26" r="0.4" fill={light} opacity="0.12" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-gb`} cx="40%" cy="35%">
                <stop offset="0%" stopColor={light} stopOpacity="0.7" />
                <stop offset="100%" stopColor={color} stopOpacity="0.6" />
              </radialGradient>
            </defs>
            <path d="M24 46 L24 32" stroke={trunk} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M24 40 Q16 35 10 37" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M24 38 Q32 33 38 35" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q18 28 12 26" stroke={trunk} strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q30 28 36 26" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q24 26 24 22" stroke={trunk} strokeWidth="0.9" strokeLinecap="round" fill="none" />
            {/* Thorns */}
            <line x1="18" y1="33" x2="17" y2="31.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <line x1="30" y1="31" x2="31" y2="29.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <line x1="14" y1="29" x2="13" y2="27.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <line x1="34" y1="28" x2="35" y2="26.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            {/* Bush foliage */}
            <ellipse cx="11" cy="32" rx="6" ry="5" fill="#4a8c3a" opacity="0.7" />
            <ellipse cx="24" cy="26" rx="8" ry="6" fill="#3a7a2a" opacity="0.8" />
            <ellipse cx="37" cy="31" rx="6" ry="5" fill="#4a8c3a" opacity="0.65" />
            <ellipse cx="18" cy="28" rx="5" ry="4" fill="#3a7a2a" opacity="0.5" />
            <ellipse cx="30" cy="28" rx="5" ry="4" fill="#3a7a2a" opacity="0.45" />
            {/* Translucent berries with veins */}
            <circle cx="14" cy="30" r="1.3" fill={`url(#${uid}-gb)`} />
            <line x1="13" y1="29" x2="15" y2="31" stroke={color} strokeWidth="0.3" opacity="0.4" />
            <line x1="13" y1="31" x2="15" y2="29" stroke={color} strokeWidth="0.3" opacity="0.4" />
            <circle cx="34" cy="29" r="1.2" fill={`url(#${uid}-gb)`} />
            <line x1="33.2" y1="28.2" x2="34.8" y2="29.8" stroke={color} strokeWidth="0.3" opacity="0.4" />
            <line x1="33.2" y1="29.8" x2="34.8" y2="28.2" stroke={color} strokeWidth="0.3" opacity="0.4" />
            <circle cx="24" cy="28" r="1.1" fill={`url(#${uid}-gb)`} opacity="0.8" />
            <line x1="23.3" y1="27.3" x2="24.7" y2="28.7" stroke={color} strokeWidth="0.25" opacity="0.35" />
            <circle cx="20" cy="26" r="0.5" fill={light} opacity="0.15" />
            <circle cx="30" cy="24" r="0.45" fill={light} opacity="0.12" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-gb2`} cx="40%" cy="35%">
                <stop offset="0%" stopColor={light} stopOpacity="0.75" />
                <stop offset="100%" stopColor={color} stopOpacity="0.6" />
              </radialGradient>
            </defs>
            <path d="M24 46 L24 30" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" />
            {/* Arching branches */}
            <path d="M24 42 Q14 36 6 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 40 Q34 34 42 36" stroke={trunk} strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q16 30 8 28" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q32 30 40 28" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q18 24 14 20" stroke={trunk} strokeWidth="1.1" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q30 24 34 20" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 30 L24 18" stroke={trunk} strokeWidth="0.9" strokeLinecap="round" fill="none" />
            {/* Thorns */}
            <line x1="16" y1="35" x2="15" y2="33.5" stroke={trunk} strokeWidth="0.45" strokeLinecap="round" />
            <line x1="32" y1="33" x2="33" y2="31.5" stroke={trunk} strokeWidth="0.45" strokeLinecap="round" />
            <line x1="12" y1="31" x2="11" y2="29.5" stroke={trunk} strokeWidth="0.45" strokeLinecap="round" />
            <line x1="36" y1="30" x2="37" y2="28.5" stroke={trunk} strokeWidth="0.45" strokeLinecap="round" />
            <line x1="18" y1="26" x2="17" y2="24.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <line x1="30" y1="25" x2="31" y2="23.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            {/* Dense bush foliage */}
            <ellipse cx="7" cy="34" rx="7" ry="5.5" fill="#4a8c3a" opacity="0.7" />
            <ellipse cx="41" cy="33" rx="7" ry="5.5" fill="#4a8c3a" opacity="0.65" />
            <ellipse cx="9" cy="26" rx="6" ry="5" fill="#3a7a2a" opacity="0.6" />
            <ellipse cx="39" cy="26" rx="6" ry="5" fill="#3a7a2a" opacity="0.55" />
            <ellipse cx="24" cy="24" rx="10" ry="7" fill="#3a7a2a" opacity="0.75" />
            <ellipse cx="16" cy="20" rx="6" ry="5" fill="#4a8c3a" opacity="0.5" />
            <ellipse cx="32" cy="20" rx="6" ry="5" fill="#4a8c3a" opacity="0.45" />
            {/* Translucent berries with veins */}
            <circle cx="10" cy="32" r="1.5" fill={`url(#${uid}-gb2)`} />
            <line x1="9" y1="31" x2="11" y2="33" stroke={color} strokeWidth="0.3" opacity="0.4" />
            <line x1="9" y1="33" x2="11" y2="31" stroke={color} strokeWidth="0.3" opacity="0.4" />
            <circle cx="38" cy="31" r="1.4" fill={`url(#${uid}-gb2)`} />
            <line x1="37" y1="30" x2="39" y2="32" stroke={color} strokeWidth="0.3" opacity="0.4" />
            <line x1="37" y1="32" x2="39" y2="30" stroke={color} strokeWidth="0.3" opacity="0.4" />
            <circle cx="14" cy="28" r="1.3" fill={`url(#${uid}-gb2)`} />
            <line x1="13.2" y1="27.2" x2="14.8" y2="28.8" stroke={color} strokeWidth="0.3" opacity="0.35" />
            <line x1="13.2" y1="28.8" x2="14.8" y2="27.2" stroke={color} strokeWidth="0.3" opacity="0.35" />
            <circle cx="34" cy="27" r="1.3" fill={`url(#${uid}-gb2)`} />
            <line x1="33.2" y1="26.2" x2="34.8" y2="27.8" stroke={color} strokeWidth="0.3" opacity="0.35" />
            <line x1="33.2" y1="27.8" x2="34.8" y2="26.2" stroke={color} strokeWidth="0.3" opacity="0.35" />
            <circle cx="24" cy="26" r="1.4" fill={`url(#${uid}-gb2)`} opacity="0.8" />
            <line x1="23" y1="25" x2="25" y2="27" stroke={color} strokeWidth="0.3" opacity="0.35" />
            <line x1="23" y1="27" x2="25" y2="25" stroke={color} strokeWidth="0.3" opacity="0.35" />
            <circle cx="19" cy="22" r="1.1" fill={`url(#${uid}-gb2)`} opacity="0.6" />
            <line x1="18.3" y1="21.3" x2="19.7" y2="22.7" stroke={color} strokeWidth="0.25" opacity="0.3" />
            <circle cx="29" cy="22" r="1.1" fill={`url(#${uid}-gb2)`} opacity="0.55" />
            <line x1="28.3" y1="21.3" x2="29.7" y2="22.7" stroke={color} strokeWidth="0.25" opacity="0.3" />
            <circle cx="6" cy="36" r="1.0" fill={`url(#${uid}-gb2)`} opacity="0.5" />
            <circle cx="42" cy="35" r="1.0" fill={`url(#${uid}-gb2)`} opacity="0.45" />
            <circle cx="16" cy="16" r="0.5" fill={light} opacity="0.15" />
            <circle cx="28" cy="16" r="0.45" fill={light} opacity="0.12" />
          </g>
        )

      case 'tamarind':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="42" rx="2.5" ry="1" fill="#8B7355" opacity="0.4" />
            {/* Feathery compound leaves */}
            <path d="M24 38 Q21 35 20 36" fill="#4a7a38" opacity="0.5" />
            <path d="M20 36 L19 35.5 L20 35 L19 34.5 L20 34" stroke="#4a7a38" strokeWidth="0.5" fill="none" opacity="0.6" />
            <path d="M24 38 Q27 35 28 36" fill="#3a6a28" opacity="0.5" />
            <path d="M28 36 L29 35.5 L28 35 L29 34.5 L28 34" stroke="#3a6a28" strokeWidth="0.5" fill="none" opacity="0.5" />
            <path d="M24 37 Q23 34 24 32 Q25 34 24 37" fill="#4a7a38" opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Twisted trunk */}
            <path d="M24 46 Q22 40 23 30 Q24 28 25 30 Q26 40 24 46" fill={color} opacity="0.9" />
            <path d="M23.2 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* Feathery canopy */}
            <ellipse cx="24" cy="20" rx="10" ry="7" fill="#4a7a38" opacity="0.6" />
            {/* Feathery leaf fronds */}
            <path d="M16 18 L14 17 L16 16 L14 15 L16 14" stroke="#4a7a38" strokeWidth="0.5" fill="none" opacity="0.5" />
            <path d="M32 18 L34 17 L32 16 L34 15 L32 14" stroke="#3a6a28" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M20 14 L18 13 L20 12 L18 11 L20 10" stroke="#4a7a38" strokeWidth="0.4" fill="none" opacity="0.4" />
            <path d="M28 14 L30 13 L28 12 L30 11 L28 10" stroke="#3a6a28" strokeWidth="0.4" fill="none" opacity="0.35" />
            <ellipse cx="20" cy="18" rx="5" ry="3.5" fill="#4a7a38" opacity="0.4" />
            <ellipse cx="28" cy="20" rx="4" ry="3" fill="#3a6a28" opacity="0.35" />
            {/* One pod */}
            <path d="M26 24 Q28 23 30 24 Q28 25 26 24" fill={color} />
            <path d="M27 24 L29 24" stroke={dark} strokeWidth="0.3" opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Twisted trunk */}
            <path d="M22 46 Q20 40 21 28 Q22 26 24 26 Q26 26 27 28 Q28 40 26 46 Z" fill={color} opacity="0.85" />
            <path d="M23 36 L25.5 35.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23 40 L25 39.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            {/* Twisted texture */}
            <path d="M22 32 Q24 30 26 32" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M22 36 Q24 34 26 36" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* Branches */}
            <path d="M22 28 Q16 24 10 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.85" />
            <path d="M26 28 Q32 24 38 22" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.8" />
            {/* Feathery canopy */}
            <ellipse cx="24" cy="14" rx="14" ry="9" fill="#4a7a38" opacity="0.5" />
            <ellipse cx="17" cy="12" rx="6" ry="4" fill="#4a7a38" opacity="0.4" />
            <ellipse cx="31" cy="16" rx="5" ry="3.5" fill="#3a6a28" opacity="0.35" />
            {/* Feathery fronds */}
            <path d="M10 14 L8 13 L10 12 L8 11 L10 10" stroke="#4a7a38" strokeWidth="0.5" fill="none" opacity="0.5" />
            <path d="M38 14 L40 13 L38 12 L40 11 L38 10" stroke="#3a6a28" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M14 8 L12 7 L14 6 L12 5 L14 4" stroke="#4a7a38" strokeWidth="0.4" fill="none" opacity="0.4" />
            <path d="M34 8 L36 7 L34 6 L36 5 L34 4" stroke="#3a6a28" strokeWidth="0.4" fill="none" opacity="0.35" />
            <path d="M20 18 L18 17 L20 16 L18 15" stroke="#4a7a38" strokeWidth="0.4" fill="none" opacity="0.35" />
            <path d="M28 18 L30 17 L28 16 L30 15" stroke="#3a6a28" strokeWidth="0.4" fill="none" opacity="0.3" />
            {/* Pod clusters */}
            <path d="M14 20 Q17 19 20 20 Q17 21 14 20" fill={color} />
            <path d="M15 20 L19 20" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            <path d="M16 20 L16 20.5" stroke={dark} strokeWidth="0.2" opacity="0.15" />
            <path d="M18 20 L18 20.5" stroke={dark} strokeWidth="0.2" opacity="0.15" />
            <path d="M30 18 Q33 17 36 18 Q33 19 30 18" fill={color} opacity="0.9" />
            <path d="M31 18 L35 18" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            <path d="M32 18 L32 18.5" stroke={dark} strokeWidth="0.2" opacity="0.15" />
            <path d="M34 18 L34 18.5" stroke={dark} strokeWidth="0.2" opacity="0.15" />
            {/* Roots */}
            <path d="M22 46 Q19 44 16 46" stroke={color} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q29 44 32 46" stroke={color} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            {/* Gnarled twisted trunk */}
            <path d="M21 46 Q18 40 19 28 Q20 24 22 22" fill={color} opacity="0.85" />
            <path d="M27 46 Q30 40 29 28 Q28 24 26 22" fill={color} opacity="0.8" />
            <path d="M19 28 Q22 26 29 28" fill={color} opacity="0.7" />
            {/* Twist texture */}
            <path d="M20 34 Q24 32 28 34" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M20 38 Q24 36 28 38" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M21 42 Q24 40 27 42" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M22 30 L26 29.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            {/* Branches */}
            <path d="M20 26 Q12 22 6 18" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
            <path d="M28 26 Q36 22 42 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8" />
            <path d="M21 28 Q16 26 10 24" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M27 28 Q32 26 38 24" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.65" />
            {/* Feathery canopy — light, airy */}
            <ellipse cx="24" cy="12" rx="16" ry="9" fill="#4a7a38" opacity="0.45" />
            <ellipse cx="14" cy="10" rx="7" ry="4.5" fill="#4a7a38" opacity="0.35" />
            <ellipse cx="34" cy="14" rx="6" ry="4" fill="#3a6a28" opacity="0.35" />
            <ellipse cx="24" cy="6" rx="6" ry="3" fill="#4a7a38" opacity="0.25" />
            <ellipse cx="8" cy="16" rx="4" ry="3" fill="#4a7a38" opacity="0.3" />
            <ellipse cx="40" cy="16" rx="4" ry="3" fill="#3a6a28" opacity="0.25" />
            {/* Feathery fronds all around */}
            <path d="M6 16 L4 15 L6 14 L4 13 L6 12" stroke="#4a7a38" strokeWidth="0.5" fill="none" opacity="0.5" />
            <path d="M42 16 L44 15 L42 14 L44 13 L42 12" stroke="#3a6a28" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M12 6 L10 5 L12 4 L10 3 L12 2" stroke="#4a7a38" strokeWidth="0.4" fill="none" opacity="0.4" />
            <path d="M36 6 L38 5 L36 4 L38 3 L36 2" stroke="#3a6a28" strokeWidth="0.4" fill="none" opacity="0.35" />
            <path d="M16 20 L14 19 L16 18 L14 17" stroke="#4a7a38" strokeWidth="0.4" fill="none" opacity="0.35" />
            <path d="M32 20 L34 19 L32 18 L34 17" stroke="#3a6a28" strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M20 4 L18 3 L20 2" stroke="#4a7a38" strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M28 4 L30 3 L28 2" stroke="#3a6a28" strokeWidth="0.4" fill="none" opacity="0.25" />
            {/* Pod clusters — hanging bean-shaped pods */}
            <path d="M12 20 Q16 18.5 20 20 Q16 21.5 12 20" fill={color} />
            <path d="M13 20 L19 20" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            <path d="M14 20 L14 20.5" stroke={dark} strokeWidth="0.2" opacity="0.15" />
            <path d="M16 20 L16 20.5" stroke={dark} strokeWidth="0.2" opacity="0.15" />
            <path d="M18 20 L18 20.5" stroke={dark} strokeWidth="0.2" opacity="0.15" />
            <path d="M30 16 Q34 14.5 38 16 Q34 17.5 30 16" fill={color} opacity="0.9" />
            <path d="M31 16 L37 16" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            <path d="M32 16 L32 16.5" stroke={dark} strokeWidth="0.2" opacity="0.15" />
            <path d="M34 16 L34 16.5" stroke={dark} strokeWidth="0.2" opacity="0.15" />
            <path d="M36 16 L36 16.5" stroke={dark} strokeWidth="0.2" opacity="0.15" />
            <path d="M20 14 Q23 13 26 14 Q23 15 20 14" fill={color} opacity="0.8" />
            <path d="M21 14 L25 14" stroke={dark} strokeWidth="0.3" opacity="0.18" />
            <path d="M22 14 L22 14.5" stroke={dark} strokeWidth="0.2" opacity="0.12" />
            <path d="M24 14 L24 14.5" stroke={dark} strokeWidth="0.2" opacity="0.12" />
            {/* Smaller pods */}
            <path d="M8 18 Q10 17 12 18 Q10 19 8 18" fill={color} opacity="0.7" />
            <path d="M36 20 Q38 19 40 20 Q38 21 36 20" fill={color} opacity="0.65" />
            <path d="M14 10 Q16 9 18 10 Q16 11 14 10" fill={color} opacity="0.6" />
            {/* Roots — exposed, twisted */}
            <path d="M21 46 Q17 44 12 46" stroke={color} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M27 46 Q31 44 36 46" stroke={color} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M19 46 Q16 43 14 44" stroke={color} strokeWidth="0.6" fill="none" opacity="0.15" />
          </g>
        )

      // Wave 3 Common Trees — 8 radically different silhouettes
      // SVG viewBox="0 6 48 42", ground at y=46
      // Variables: color, dark, light, uid, trunk="#6b5b3e", s (0-3)

      // ─── MUSHROOM ───────────────────────────────────────────
      case 'mushroom': {
        const capW = [6, 12, 20, 30][s];
        const capH = [4, 6, 9, 13][s];
        const stemW = [2, 3, 4, 6][s];
        const stemH = [4, 7, 10, 14][s];
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

            {/* Baby mushrooms at base — stage 3 */}
            {s === 3 && <>
              <rect x={cx - 10} y={42} width={2} height={4} rx={0.8} fill={stemColor} />
              <ellipse cx={cx - 9} cy={41.5} rx={3.5} ry={2.5} fill={capColor} opacity={0.8} />
              <circle cx={cx - 9.5} cy={41} r={0.6} fill={spotColor} opacity={0.7} />

              <rect x={cx + 9} y={43} width={1.5} height={3} rx={0.6} fill={stemColor} />
              <ellipse cx={cx + 9.75} cy={42.8} rx={2.8} ry={2} fill={capColor} opacity={0.75} />
              <circle cx={cx + 9.2} cy={42.3} r={0.5} fill={spotColor} opacity={0.7} />
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
      case 'willow': {
        const h = [6, 14, 22, 30][s];
        const spread = [4, 10, 16, 22][s];
        const strandCount = [2, 5, 9, 16][s];
        const cx = 24;
        const baseY = 46;
        const topY = baseY - h;
        const branchY = topY + h * 0.2;

        return (
          <g>
            {/* Trunk — slightly curved */}
            <path d={`M${cx} ${baseY} Q${cx - 1} ${baseY - h * 0.5} ${cx} ${topY}`} stroke={trunk} strokeWidth={s >= 2 ? 2.5 : 1.5} fill="none" strokeLinecap="round" />
            {s >= 2 && (
              <path d={`M${cx} ${baseY} Q${cx + 0.5} ${baseY - h * 0.5} ${cx + 0.3} ${topY + 2}`} stroke={trunk} strokeWidth={1} fill="none" opacity={0.4} />
            )}

            {/* Small crown mass at top */}
            <ellipse cx={cx} cy={branchY} rx={spread * 0.35} ry={h * 0.15} fill={color} opacity={0.5} />

            {/* THE DEFINING FEATURE: hanging strands/curtain */}
            {Array.from({ length: strandCount }).map((_, i) => {
              const angle = -90 + (180 / (strandCount + 1)) * (i + 1);
              const rad = (angle * Math.PI) / 180;
              const startX = cx + Math.cos(rad) * spread * 0.35;
              const startY = branchY + Math.sin(rad) * h * 0.1;
              const endX = startX + (Math.cos(rad) * spread * 0.5);
              const hangLen = Math.min(baseY - startY, h * 0.85 + Math.random() * 3);
              const endY = Math.min(startY + hangLen, baseY - (s === 3 ? 0 : 2));
              const midX = startX + (endX - startX) * 0.3;
              const sway = (i % 3 - 1) * 1.5;
              return (
                <path
                  key={`strand-${i}`}
                  d={`M${startX} ${startY} C${midX + sway} ${startY + hangLen * 0.3} ${endX + sway * 0.5} ${startY + hangLen * 0.6} ${endX + sway} ${endY}`}
                  stroke={i % 3 === 0 ? light : color}
                  strokeWidth={0.5}
                  fill="none"
                  opacity={0.7 + (i % 3) * 0.1}
                />
              );
            })}

            {/* Extra leaf dots along strands at stage 3 */}
            {s === 3 && Array.from({ length: 12 }).map((_, i) => {
              const angle = -80 + (160 / 12) * i;
              const rad = (angle * Math.PI) / 180;
              const lx = cx + Math.cos(rad) * spread * 0.4;
              const ly = branchY + 4 + i * 1.8;
              return ly < 45 ? <circle key={`lf-${i}`} cx={lx + (i % 3 - 1)} cy={ly} r={0.6} fill={light} opacity={0.5} /> : null;
            })}

            <ellipse cx={cx} cy={46} rx={spread * 0.3} ry={0.7} fill="black" opacity={0.06} />
          </g>
        );
      }

      // ─── ACORN (wide oak) ───────────────────────────────────
      case 'acorn': {
        const h = [5, 10, 16, 20][s];
        const canopyW = [8, 16, 28, 38][s];
        const canopyH = [4, 7, 10, 14][s];
        const cx = 24;
        const baseY = 46;
        const trunkH = h - canopyH * 0.6;
        const canopyY = baseY - h;

        return (
          <g>
            {/* Trunk — short and thick */}
            <rect x={cx - (s >= 2 ? 2 : 1)} y={baseY - trunkH} width={s >= 2 ? 4 : 2} height={trunkH} rx={0.8} fill={trunk} />
            {s >= 2 && <>
              {/* Major branches going wide */}
              <path d={`M${cx - 1} ${canopyY + canopyH * 0.6} L${cx - canopyW * 0.35} ${canopyY + canopyH * 0.3}`} stroke={trunk} strokeWidth={1.5} strokeLinecap="round" />
              <path d={`M${cx + 1} ${canopyY + canopyH * 0.6} L${cx + canopyW * 0.35} ${canopyY + canopyH * 0.3}`} stroke={trunk} strokeWidth={1.5} strokeLinecap="round" />
            </>}

            {/* Wide spreading canopy — very horizontal, low */}
            <ellipse cx={cx} cy={canopyY + canopyH * 0.5} rx={canopyW / 2} ry={canopyH * 0.5} fill={color} />
            {/* Canopy bumps for organic shape */}
            {s >= 1 && <>
              <circle cx={cx - canopyW * 0.25} cy={canopyY + canopyH * 0.3} r={canopyH * 0.35} fill={color} />
              <circle cx={cx + canopyW * 0.25} cy={canopyY + canopyH * 0.3} r={canopyH * 0.35} fill={color} />
              <circle cx={cx} cy={canopyY + canopyH * 0.2} r={canopyH * 0.3} fill={light} opacity={0.3} />
            </>}
            {s >= 2 && <>
              <circle cx={cx - canopyW * 0.38} cy={canopyY + canopyH * 0.45} r={canopyH * 0.28} fill={dark} opacity={0.3} />
              <circle cx={cx + canopyW * 0.38} cy={canopyY + canopyH * 0.45} r={canopyH * 0.28} fill={dark} opacity={0.3} />
            </>}

            {/* ACORNS — teardrop with cap, hanging visible */}
            {s >= 2 && <>
              <g transform={`translate(${cx - canopyW * 0.2}, ${canopyY + canopyH * 0.7})`}>
                <rect x={-1.2} y={-1} width={2.4} height={1.2} rx={0.6} fill="#8d6e63" />
                <ellipse cx={0} cy={1} rx={1.5} ry={2} fill="#a1887f" />
                <ellipse cx={0} cy={0.8} rx={1} ry={1.5} fill="#795548" opacity={0.4} />
              </g>
              <g transform={`translate(${cx + canopyW * 0.15}, ${canopyY + canopyH * 0.75})`}>
                <rect x={-1} y={-0.8} width={2} height={1} rx={0.5} fill="#8d6e63" />
                <ellipse cx={0} cy={0.8} rx={1.2} ry={1.6} fill="#a1887f" />
              </g>
            </>}
            {s === 3 && <>
              <g transform={`translate(${cx + canopyW * 0.32}, ${canopyY + canopyH * 0.65})`}>
                <rect x={-1.3} y={-1} width={2.6} height={1.3} rx={0.6} fill="#8d6e63" />
                <ellipse cx={0} cy={1.2} rx={1.6} ry={2.2} fill="#a1887f" />
                <ellipse cx={0} cy={1} rx={1} ry={1.6} fill="#795548" opacity={0.3} />
              </g>
              <g transform={`translate(${cx - canopyW * 0.35}, ${canopyY + canopyH * 0.8})`}>
                <rect x={-1} y={-0.8} width={2} height={1} rx={0.5} fill="#8d6e63" />
                <ellipse cx={0} cy={0.8} rx={1.2} ry={1.6} fill="#a1887f" />
              </g>
              {/* Fallen acorn on ground */}
              <g transform={`translate(${cx + 8}, 43) rotate(25)`}>
                <rect x={-0.8} y={-0.6} width={1.6} height={0.8} rx={0.4} fill="#8d6e63" />
                <ellipse cx={0} cy={0.7} rx={1} ry={1.3} fill="#a1887f" />
              </g>
            </>}

            <ellipse cx={cx} cy={46} rx={canopyW * 0.35} ry={1} fill="black" opacity={0.07} />
          </g>
        );
      }

      // ─── FERN ───────────────────────────────────────────────
      case 'fern': {
        const frondCount = [2, 4, 6, 9][s];
        const frondLen = [6, 10, 14, 18][s];
        const cx = 24;
        const baseY = 46;

        // Fiddlehead spiral for early stages
        const fiddlehead = (fx: number, fy: number, size: number, rot: number) => (
          <path
            d={`M${fx} ${fy} C${fx + size * 0.3} ${fy - size * 0.5} ${fx + size * 0.6} ${fy - size * 0.8} ${fx + size * 0.4} ${fy - size} C${fx + size * 0.2} ${fy - size * 1.1} ${fx} ${fy - size * 0.9} ${fx + size * 0.1} ${fy - size * 0.7}`}
            stroke={color} strokeWidth={1} fill="none" strokeLinecap="round"
            transform={`rotate(${rot} ${fx} ${fy})`}
          />
        );

        return (
          <g>
            {/* Central rosette point */}
            <circle cx={cx} cy={baseY - 1} r={s >= 2 ? 2 : 1} fill={dark} opacity={0.4} />

            {/* Fronds radiating from base */}
            {Array.from({ length: frondCount }).map((_, i) => {
              const angle = -90 + (180 / (frondCount + 1)) * (i + 1) - 90;
              const spreadAngle = -160 + (320 / (frondCount + 1)) * (i + 1);
              const rad = (spreadAngle * Math.PI) / 180;
              const tipX = cx + Math.cos(rad) * frondLen;
              const tipY = baseY - 2 - Math.abs(Math.sin(rad)) * frondLen;
              const midX = cx + Math.cos(rad) * frondLen * 0.5;
              const midY = baseY - 2 - Math.abs(Math.sin(rad)) * frondLen * 0.6;

              if (s <= 1 && i < 2) {
                // Fiddlehead curls for young stages
                return <g key={`fid-${i}`}>{fiddlehead(cx, baseY - 2, frondLen * 0.5, spreadAngle + 90)}</g>;
              }

              return (
                <g key={`frond-${i}`}>
                  {/* Main rachis (stem of frond) */}
                  <path
                    d={`M${cx} ${baseY - 2} Q${midX} ${midY} ${tipX} ${tipY}`}
                    stroke={dark} strokeWidth={0.6} fill="none" strokeLinecap="round"
                  />
                  {/* Pinnate leaflets — alternating tiny lines */}
                  {s >= 2 && Array.from({ length: Math.floor(frondLen * 0.6) }).map((_, j) => {
                    const t = (j + 1) / (frondLen * 0.6 + 1);
                    const px = cx + (tipX - cx) * t;
                    const py = (baseY - 2) + (tipY - (baseY - 2)) * t;
                    const perpX = -(tipY - (baseY - 2));
                    const perpY = (tipX - cx);
                    const pLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
                    const leafSize = 2.5 * (1 - t * 0.5);
                    const side = j % 2 === 0 ? 1 : -1;
                    return (
                      <line
                        key={`pin-${i}-${j}`}
                        x1={px} y1={py}
                        x2={px + (perpX / pLen) * leafSize * side}
                        y2={py + (perpY / pLen) * leafSize * side}
                        stroke={j % 3 === 0 ? light : color}
                        strokeWidth={0.5}
                        opacity={0.8}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Stage 0-1: fiddlehead curls */}
            {s <= 1 && <>
              {fiddlehead(cx - 2, baseY - 2, frondLen * 0.4, -30)}
              {fiddlehead(cx + 2, baseY - 2, frondLen * 0.4, 30)}
            </>}

            <ellipse cx={cx} cy={46} rx={3} ry={0.6} fill="black" opacity={0.05} />
          </g>
        );
      }

      // ─── LAVENDER ───────────────────────────────────────────
      case 'lavender': {
        const spikeCount = [1, 3, 5, 7][s];
        const spikeH = [6, 10, 15, 20][s];
        const baseW = [4, 8, 12, 16][s];
        const baseH = [3, 5, 6, 8][s];
        const cx = 24;
        const baseY = 46;
        const foliageColor = "#8a9a7b"; // silvery grey-green

        return (
          <g>
            {/* Silvery-green foliage mound at base */}
            <ellipse cx={cx} cy={baseY - baseH * 0.3} rx={baseW / 2} ry={baseH * 0.5} fill={foliageColor} />
            {s >= 1 && <>
              <ellipse cx={cx - baseW * 0.2} cy={baseY - baseH * 0.4} rx={baseW * 0.25} ry={baseH * 0.35} fill="#96a88a" opacity={0.6} />
              <ellipse cx={cx + baseW * 0.2} cy={baseY - baseH * 0.35} rx={baseW * 0.2} ry={baseH * 0.3} fill="#7d8e6e" opacity={0.5} />
            </>}
            {/* Thin leaves in foliage */}
            {s >= 2 && Array.from({ length: 6 }).map((_, i) => {
              const lx = cx - baseW * 0.3 + i * (baseW * 0.12);
              return (
                <line key={`leaf-${i}`} x1={lx} y1={baseY - baseH * 0.1} x2={lx + (i % 2 ? 1 : -1)} y2={baseY - baseH * 0.7} stroke="#7d8e6e" strokeWidth={0.4} opacity={0.5} />
              );
            })}

            {/* Flower spikes — tall narrow purple */}
            {Array.from({ length: spikeCount }).map((_, i) => {
              const spikeX = cx + (i - (spikeCount - 1) / 2) * (baseW / (spikeCount + 1));
              const spikeTop = baseY - baseH - spikeH + (Math.abs(i - (spikeCount - 1) / 2) * 2);
              const stemBot = baseY - baseH * 0.3;

              return (
                <g key={`spike-${i}`}>
                  {/* Thin stem */}
                  <line x1={spikeX} y1={stemBot} x2={spikeX} y2={spikeTop + 2} stroke="#6b7d5e" strokeWidth={0.5} />
                  {/* Flower cluster — stack of tiny buds */}
                  {Array.from({ length: s >= 2 ? 6 : 3 }).map((_, j) => {
                    const by = spikeTop + j * 1.4;
                    const bSize = s >= 2 ? 1.4 : 1;
                    return (
                      <g key={`bud-${i}-${j}`}>
                        <ellipse cx={spikeX - bSize * 0.4} cy={by} rx={bSize * 0.6} ry={bSize * 0.4} fill={j % 2 === 0 ? color : light} opacity={0.9} />
                        <ellipse cx={spikeX + bSize * 0.4} cy={by} rx={bSize * 0.6} ry={bSize * 0.4} fill={j % 2 === 0 ? light : color} opacity={0.9} />
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Tiny flying petal at stage 3 */}
            {s === 3 && (
              <ellipse cx={cx + 10} cy={baseY - spikeH - 3} rx={0.8} ry={0.5} fill={light} opacity={0.4} transform={`rotate(30 ${cx + 10} ${baseY - spikeH - 3})`} />
            )}

            <ellipse cx={cx} cy={46} rx={baseW * 0.3} ry={0.6} fill="black" opacity={0.05} />
          </g>
        );
      }

      // ─── IVY ────────────────────────────────────────────────
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
      case 'maple': {
        const h = [7, 14, 22, 30][s];
        const canopyR = [4, 8, 12, 16][s];
        const cx = 24;
        const baseY = 46;
        const topY = baseY - h;
        const canopyCY = topY + canopyR * 0.6;

        // 5-pointed star/maple leaf shape
        const mapleLeaf = (lx: number, ly: number, size: number, fill: string, opacity: number = 1) => {
          const pts = Array.from({ length: 5 }).map((_, i) => {
            const angle = (-90 + i * 72) * Math.PI / 180;
            const innerAngle = (-90 + i * 72 + 36) * Math.PI / 180;
            return `${lx + Math.cos(angle) * size} ${ly + Math.sin(angle) * size} ${lx + Math.cos(innerAngle) * size * 0.4} ${ly + Math.sin(innerAngle) * size * 0.4}`;
          });
          return (
            <polygon
              points={pts.map(p => p).join(" ")}
              fill={fill} opacity={opacity}
            />
          );
        };

        const leafColors = [color, dark, "#ff6f00", "#d84315", light];

        return (
          <g>
            {/* Trunk */}
            <rect x={cx - (s >= 2 ? 1.5 : 0.8)} y={canopyCY + canopyR * 0.3} width={s >= 2 ? 3 : 1.6} height={baseY - canopyCY - canopyR * 0.3} rx={0.6} fill={trunk} />
            {s >= 2 && <>
              <path d={`M${cx - 1} ${canopyCY + canopyR * 0.4} L${cx - canopyR * 0.4} ${canopyCY}`} stroke={trunk} strokeWidth={1.2} strokeLinecap="round" />
              <path d={`M${cx + 1} ${canopyCY + canopyR * 0.4} L${cx + canopyR * 0.4} ${canopyCY}`} stroke={trunk} strokeWidth={1.2} strokeLinecap="round" />
            </>}

            {/* Canopy made of star-shaped leaf clusters instead of circles */}
            {Array.from({ length: s >= 2 ? (s === 3 ? 18 : 10) : (s === 1 ? 5 : 3) }).map((_, i) => {
              const angle = (i * 137.5) * Math.PI / 180; // golden angle
              const dist = (i / (s === 3 ? 18 : 10)) * canopyR * 0.85;
              const lx = cx + Math.cos(angle) * dist;
              const ly = canopyCY + Math.sin(angle) * dist * 0.7;
              const size = 2 + Math.random() * 1.5;
              const leafColor = leafColors[i % leafColors.length];
              return <g key={`ml-${i}`}>{mapleLeaf(lx, ly, size, leafColor, 0.8)}</g>;
            })}

            {/* Extra canopy volume */}
            <ellipse cx={cx} cy={canopyCY} rx={canopyR * 0.6} ry={canopyR * 0.5} fill={color} opacity={0.15} />

            {/* Falling leaves at stage 3 */}
            {s === 3 && <>
              {[
                { x: cx + 10, y: canopyCY + canopyR + 4, rot: 25 },
                { x: cx - 8, y: canopyCY + canopyR + 7, rot: -40 },
                { x: cx + 6, y: canopyCY + canopyR + 10, rot: 60 },
              ].map((fl, i) => (
                <g key={`fall-${i}`} transform={`rotate(${fl.rot} ${fl.x} ${fl.y})`} opacity={0.5 - i * 0.1}>
                  {mapleLeaf(fl.x, fl.y, 1.8, leafColors[(i + 2) % leafColors.length])}
                </g>
              ))}
            </>}

            <ellipse cx={cx} cy={46} rx={canopyR * 0.3} ry={0.8} fill="black" opacity={0.07} />
          </g>
        );
      }
      // ─── UNCOMMON WAVE 3 ───

      case 'bougainvillea':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 39" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="41" rx="2.5" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 39 Q22 37 23 35" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M23 35 L21.5 34 L22.5 33.5 L23 35" fill={color} opacity="0.6" />
            <path d="M23 35 L24.5 33 L25 34.5 L23 35" fill={light} opacity="0.5" />
            <circle cx="23" cy="34" r="0.4" fill="#fff" opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23 40 23 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23 36 Q19 32 17 30" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q28 31 30 30" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* bract clusters */}
            <path d="M17 30 L15 28 L16.5 28 L17 30" fill={color} opacity="0.7" />
            <path d="M17 30 L18 27.5 L18.5 29 L17 30" fill={light} opacity="0.6" />
            <path d="M30 30 L31.5 28 L32 29.5 L30 30" fill={color} opacity="0.7" />
            <path d="M30 30 L28.5 28 L29.5 27.5 L30 30" fill={light} opacity="0.6" />
            <path d="M23 34 L21 32 L22 31.5 L23 34" fill={color} opacity="0.65" />
            <path d="M24 34 L26 32 L25 31.5 L24 34" fill={light} opacity="0.55" />
            <circle cx="17" cy="29" r="0.5" fill="#fff" opacity="0.3" />
            <circle cx="30" cy="29" r="0.4" fill="#fff" opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 Q22 40 22 32 L26 32 Q26 40 25 46 Z" fill={trunk} />
            <path d="M22 34 Q16 30 12 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 33 Q30 30 34 28" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q20 28 18 26" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* bract clusters left */}
            <path d="M12 28 L10 26 L11.5 25.5 L12 28" fill={color} opacity="0.75" />
            <path d="M12 28 L13 25.5 L13.5 27 L12 28" fill={light} opacity="0.6" />
            <path d="M12 28 L10.5 27.5 L11 26 L12 28" fill={dark} opacity="0.4" />
            <path d="M18 26 L16 24 L17.5 23.5 L18 26" fill={color} opacity="0.7" />
            <path d="M18 26 L19 23.5 L19.5 25 L18 26" fill={light} opacity="0.55" />
            {/* bract clusters right */}
            <path d="M34 28 L36 26 L35 25.5 L34 28" fill={color} opacity="0.75" />
            <path d="M34 28 L33 25.5 L32.5 27 L34 28" fill={light} opacity="0.6" />
            <path d="M34 28 L35.5 27 L35 25.5 L34 28" fill={dark} opacity="0.4" />
            {/* top cluster */}
            <path d="M24 32 L22 29.5 L23 29 L24 32" fill={color} opacity="0.7" />
            <path d="M24 32 L26 29.5 L25 29 L24 32" fill={light} opacity="0.6" />
            <circle cx="12" cy="27" r="0.5" fill="#fff" opacity="0.3" />
            <circle cx="34" cy="27" r="0.5" fill="#fff" opacity="0.25" />
            <circle cx="18" cy="25" r="0.4" fill="#fff" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            {/* Arching woody frame */}
            <path d="M22 46 Q21 40 21 32 L27 32 Q27 40 26 46 Z" fill={trunk} />
            <path d="M22 46 Q21 40 21 32 L27 32 Q27 40 26 46 Z" fill={`url(#${uid}-trunk)`} />
            <path d="M22 34 Q14 28 8 24" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M26 33 Q34 27 40 24" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 33 Q17 29 12 27" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M25 32 Q31 28 36 26" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q22 26 20 22" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q26 26 28 22" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Papery bract clusters — 3 overlapping triangles per cluster */}
            {/* cluster 1 — far left */}
            <path d="M8 24 L5.5 21 L7 21 L8 24" fill={color} opacity="0.8" />
            <path d="M8 24 L9.5 20.5 L10 22.5 L8 24" fill={light} opacity="0.7" />
            <path d="M8 24 L6 22.5 L7.5 22 L8 24" fill={dark} opacity="0.45" />
            {/* cluster 2 — left mid */}
            <path d="M12 27 L9.5 24 L11 24 L12 27" fill={color} opacity="0.8" />
            <path d="M12 27 L13.5 23.5 L14 25.5 L12 27" fill={light} opacity="0.65" />
            <path d="M12 27 L10.5 25 L12 24.5 L12 27" fill={dark} opacity="0.4" />
            {/* cluster 3 — inner left */}
            <path d="M16 25 L14 22.5 L15.5 22 L16 25" fill={color} opacity="0.75" />
            <path d="M16 25 L17.5 22 L18 24 L16 25" fill={light} opacity="0.6" />
            <path d="M16 25 L14.5 23.5 L16 23 L16 25" fill={dark} opacity="0.35" />
            {/* cluster 4 — top left */}
            <path d="M20 22 L18 19 L19.5 19 L20 22" fill={color} opacity="0.8" />
            <path d="M20 22 L21.5 18.5 L22 20.5 L20 22" fill={light} opacity="0.7" />
            <path d="M20 22 L18.5 20 L20 19.5 L20 22" fill={dark} opacity="0.4" />
            {/* cluster 5 — top center */}
            <path d="M24 20 L22 17 L23.5 17 L24 20" fill={color} opacity="0.85" />
            <path d="M24 20 L25.5 16.5 L26 18.5 L24 20" fill={light} opacity="0.7" />
            <path d="M24 20 L22.5 18 L24 17.5 L24 20" fill={dark} opacity="0.45" />
            {/* cluster 6 — top right */}
            <path d="M28 22 L30 19 L28.5 19 L28 22" fill={color} opacity="0.8" />
            <path d="M28 22 L26.5 18.5 L26 20.5 L28 22" fill={light} opacity="0.65" />
            <path d="M28 22 L29.5 20 L28 19.5 L28 22" fill={dark} opacity="0.4" />
            {/* cluster 7 — inner right */}
            <path d="M32 25 L34 22.5 L32.5 22 L32 25" fill={color} opacity="0.75" />
            <path d="M32 25 L30.5 22 L30 24 L32 25" fill={light} opacity="0.6" />
            <path d="M32 25 L33.5 23.5 L32 23 L32 25" fill={dark} opacity="0.35" />
            {/* cluster 8 — right mid */}
            <path d="M36 26 L38.5 23 L37 23.5 L36 26" fill={color} opacity="0.8" />
            <path d="M36 26 L34.5 23 L34 25 L36 26" fill={light} opacity="0.65" />
            <path d="M36 26 L38 24.5 L36.5 24 L36 26" fill={dark} opacity="0.4" />
            {/* cluster 9 — far right */}
            <path d="M40 24 L42.5 21 L41 21.5 L40 24" fill={color} opacity="0.8" />
            <path d="M40 24 L38.5 21 L38 23 L40 24" fill={light} opacity="0.7" />
            <path d="M40 24 L41.5 22 L40 21.5 L40 24" fill={dark} opacity="0.45" />
            {/* cluster 10 — cascading low left */}
            <path d="M10 30 L8 27.5 L9.5 27 L10 30" fill={color} opacity="0.65" />
            <path d="M10 30 L11.5 27 L12 29 L10 30" fill={light} opacity="0.55" />
            {/* cluster 11 — cascading low right */}
            <path d="M38 29 L40 26.5 L38.5 26 L38 29" fill={color} opacity="0.65" />
            <path d="M38 29 L36.5 26 L36 28 L38 29" fill={light} opacity="0.55" />
            {/* Tiny white flower centers */}
            <circle cx="8" cy="22.5" r="0.5" fill="#fff" opacity="0.4" />
            <circle cx="12" cy="25" r="0.5" fill="#fff" opacity="0.35" />
            <circle cx="20" cy="20" r="0.5" fill="#fff" opacity="0.35" />
            <circle cx="24" cy="18" r="0.6" fill="#fff" opacity="0.4" />
            <circle cx="28" cy="20" r="0.5" fill="#fff" opacity="0.35" />
            <circle cx="36" cy="24.5" r="0.5" fill="#fff" opacity="0.35" />
            <circle cx="40" cy="22.5" r="0.5" fill="#fff" opacity="0.3" />
            <circle cx="16" cy="23" r="0.4" fill="#fff" opacity="0.3" />
            <circle cx="32" cy="23" r="0.4" fill="#fff" opacity="0.3" />
            {/* Roots */}
            <path d="M21 46 Q18 44.5 15 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M27 46 Q30 44.5 33 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'wisteria':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 38" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="41" rx="2.5" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 38 Q23 36 24 34" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* tiny bud */}
            <ellipse cx="24" cy="33" rx="2" ry="1.5" fill={color} opacity="0.5" />
            <circle cx="23.5" cy="33" r="0.8" fill={light} opacity="0.3" />
            <circle cx="24" cy="35" r="0.6" fill={color} opacity="0.6" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23 40 23 32" stroke={trunk} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M23 34 Q18 30 16 28" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q29 29 31 28" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Small arch canopy */}
            <ellipse cx="24" cy="28" rx="9" ry="4" fill={color} opacity="0.3" />
            {/* Short hanging chains */}
            <circle cx="16" cy="30" r="1" fill={color} opacity="0.6" />
            <circle cx="16" cy="32" r="0.8" fill={color} opacity="0.5" />
            <circle cx="16" cy="33.5" r="0.6" fill={light} opacity="0.4" />
            <circle cx="24" cy="30" r="1" fill={color} opacity="0.6" />
            <circle cx="24" cy="32" r="0.8" fill={light} opacity="0.5" />
            <circle cx="31" cy="30" r="0.9" fill={color} opacity="0.55" />
            <circle cx="31" cy="31.8" r="0.7" fill={light} opacity="0.4" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M22.5 46 Q22 40 22 30 L26 30 Q26 40 25.5 46 Z" fill={trunk} />
            <path d="M22 32 Q14 26 10 24" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M26 31 Q32 26 36 24" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q20 26 17 24" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Arch canopy */}
            <path d="M8 22 Q8 16 16 14 Q24 12 32 14 Q40 16 40 22 Q40 26 32 26 Q24 28 16 26 Q8 26 8 22 Z" fill="#5a8a5a" opacity="0.35" />
            {/* Hanging chains — 6 chains */}
            {/* chain 1 */}
            <circle cx="11" cy="26" r="1.1" fill={color} opacity="0.7" />
            <circle cx="11" cy="28.2" r="1" fill={color} opacity="0.6" />
            <circle cx="11" cy="30" r="0.85" fill={color} opacity="0.5" />
            <circle cx="11" cy="31.5" r="0.7" fill={light} opacity="0.45" />
            <circle cx="11" cy="32.8" r="0.55" fill={light} opacity="0.35" />
            {/* chain 2 */}
            <circle cx="17" cy="26" r="1.2" fill={color} opacity="0.7" />
            <circle cx="17" cy="28.4" r="1" fill={color} opacity="0.6" />
            <circle cx="17" cy="30.2" r="0.85" fill={color} opacity="0.5" />
            <circle cx="17" cy="31.8" r="0.7" fill={light} opacity="0.4" />
            <circle cx="17" cy="33" r="0.5" fill={light} opacity="0.3" />
            {/* chain 3 */}
            <circle cx="24" cy="27" r="1.2" fill={color} opacity="0.7" />
            <circle cx="24" cy="29.2" r="1" fill={color} opacity="0.6" />
            <circle cx="24" cy="31" r="0.8" fill={light} opacity="0.5" />
            <circle cx="24" cy="32.5" r="0.6" fill={light} opacity="0.35" />
            {/* chain 4 */}
            <circle cx="31" cy="26" r="1.2" fill={color} opacity="0.7" />
            <circle cx="31" cy="28.2" r="1" fill={color} opacity="0.6" />
            <circle cx="31" cy="30" r="0.85" fill={color} opacity="0.5" />
            <circle cx="31" cy="31.5" r="0.7" fill={light} opacity="0.4" />
            {/* chain 5 */}
            <circle cx="37" cy="26" r="1" fill={color} opacity="0.65" />
            <circle cx="37" cy="28" r="0.85" fill={color} opacity="0.55" />
            <circle cx="37" cy="29.5" r="0.7" fill={light} opacity="0.4" />
            <circle cx="37" cy="30.8" r="0.5" fill={light} opacity="0.3" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            {/* Twisted trunk */}
            <path d="M21 46 Q20 38 20 28 L28 28 Q28 38 27 46 Z" fill={trunk} />
            <path d="M21 46 Q20 38 20 28 L28 28 Q28 38 27 46 Z" fill={`url(#${uid}-trunk)`} />
            <path d="M23 42 L25.5 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M22.5 36 L26 35.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* Graceful arching branches */}
            <path d="M21 30 Q12 22 6 20" stroke={trunk} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M27 29 Q36 22 42 20" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M22 30 Q16 24 10 22" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M26 29 Q32 24 38 22" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 28 Q24 22 24 18" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Light leaf canopy arch */}
            <path d="M4 18 Q4 10 14 8 Q24 6 34 8 Q44 10 44 18 Q44 22 34 22 Q24 24 14 22 Q4 22 4 18 Z" fill="#5a8a5a" opacity="0.3" />
            <path d="M8 16 Q12 12 20 10" stroke="#6a9a6a" strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* HANGING FLOWER CHAINS — 10 chains, graduated circles */}
            {/* chain 1 — far left */}
            <circle cx="7" cy="22" r="1.2" fill={color} opacity="0.75" />
            <circle cx="7" cy="24.5" r="1.1" fill={color} opacity="0.7" />
            <circle cx="7" cy="26.8" r="1" fill={color} opacity="0.6" />
            <circle cx="7" cy="28.8" r="0.85" fill={color} opacity="0.5" />
            <circle cx="7" cy="30.5" r="0.7" fill={light} opacity="0.45" />
            <circle cx="7" cy="32" r="0.55" fill={light} opacity="0.35" />
            <circle cx="7" cy="33.2" r="0.4" fill={light} opacity="0.25" />
            {/* chain 2 */}
            <circle cx="12" cy="22" r="1.3" fill={color} opacity="0.8" />
            <circle cx="12" cy="24.6" r="1.15" fill={color} opacity="0.7" />
            <circle cx="12" cy="27" r="1" fill={color} opacity="0.6" />
            <circle cx="12" cy="29" r="0.85" fill={color} opacity="0.5" />
            <circle cx="12" cy="30.8" r="0.7" fill={light} opacity="0.4" />
            <circle cx="12" cy="32.2" r="0.55" fill={light} opacity="0.3" />
            <circle cx="12" cy="33.5" r="0.4" fill={light} opacity="0.22" />
            <circle cx="12" cy="34.5" r="0.3" fill={light} opacity="0.15" />
            {/* chain 3 */}
            <circle cx="17" cy="22" r="1.3" fill={color} opacity="0.8" />
            <circle cx="17" cy="24.6" r="1.15" fill={color} opacity="0.7" />
            <circle cx="17" cy="27" r="1" fill={color} opacity="0.6" />
            <circle cx="17" cy="29.2" r="0.85" fill={color} opacity="0.5" />
            <circle cx="17" cy="31" r="0.7" fill={light} opacity="0.4" />
            <circle cx="17" cy="32.5" r="0.5" fill={light} opacity="0.3" />
            <circle cx="17" cy="33.8" r="0.35" fill={light} opacity="0.2" />
            {/* chain 4 */}
            <circle cx="21" cy="23" r="1.2" fill={color} opacity="0.75" />
            <circle cx="21" cy="25.4" r="1.05" fill={color} opacity="0.65" />
            <circle cx="21" cy="27.5" r="0.9" fill={color} opacity="0.55" />
            <circle cx="21" cy="29.3" r="0.75" fill={light} opacity="0.45" />
            <circle cx="21" cy="30.8" r="0.6" fill={light} opacity="0.35" />
            <circle cx="21" cy="32" r="0.45" fill={light} opacity="0.25" />
            {/* chain 5 — center */}
            <circle cx="24" cy="20" r="1.3" fill={color} opacity="0.8" />
            <circle cx="24" cy="22.6" r="1.15" fill={color} opacity="0.7" />
            <circle cx="24" cy="25" r="1" fill={color} opacity="0.6" />
            <circle cx="24" cy="27.2" r="0.85" fill={color} opacity="0.5" />
            <circle cx="24" cy="29" r="0.7" fill={light} opacity="0.4" />
            <circle cx="24" cy="30.5" r="0.55" fill={light} opacity="0.3" />
            <circle cx="24" cy="31.8" r="0.4" fill={light} opacity="0.2" />
            {/* chain 6 */}
            <circle cx="27" cy="23" r="1.2" fill={color} opacity="0.75" />
            <circle cx="27" cy="25.4" r="1" fill={color} opacity="0.65" />
            <circle cx="27" cy="27.4" r="0.85" fill={color} opacity="0.55" />
            <circle cx="27" cy="29.2" r="0.7" fill={light} opacity="0.4" />
            <circle cx="27" cy="30.6" r="0.55" fill={light} opacity="0.3" />
            {/* chain 7 */}
            <circle cx="31" cy="22" r="1.3" fill={color} opacity="0.8" />
            <circle cx="31" cy="24.6" r="1.1" fill={color} opacity="0.7" />
            <circle cx="31" cy="26.8" r="0.95" fill={color} opacity="0.6" />
            <circle cx="31" cy="28.8" r="0.8" fill={color} opacity="0.5" />
            <circle cx="31" cy="30.5" r="0.65" fill={light} opacity="0.4" />
            <circle cx="31" cy="31.8" r="0.5" fill={light} opacity="0.3" />
            <circle cx="31" cy="33" r="0.35" fill={light} opacity="0.2" />
            {/* chain 8 */}
            <circle cx="36" cy="22" r="1.3" fill={color} opacity="0.78" />
            <circle cx="36" cy="24.5" r="1.1" fill={color} opacity="0.68" />
            <circle cx="36" cy="26.8" r="0.95" fill={color} opacity="0.55" />
            <circle cx="36" cy="28.8" r="0.8" fill={color} opacity="0.45" />
            <circle cx="36" cy="30.5" r="0.65" fill={light} opacity="0.35" />
            <circle cx="36" cy="31.8" r="0.5" fill={light} opacity="0.25" />
            <circle cx="36" cy="33" r="0.35" fill={light} opacity="0.18" />
            <circle cx="36" cy="34" r="0.25" fill={light} opacity="0.12" />
            {/* chain 9 */}
            <circle cx="41" cy="22" r="1.2" fill={color} opacity="0.75" />
            <circle cx="41" cy="24.4" r="1" fill={color} opacity="0.65" />
            <circle cx="41" cy="26.4" r="0.85" fill={color} opacity="0.5" />
            <circle cx="41" cy="28.2" r="0.7" fill={light} opacity="0.4" />
            <circle cx="41" cy="29.6" r="0.55" fill={light} opacity="0.3" />
            <circle cx="41" cy="30.8" r="0.4" fill={light} opacity="0.2" />
            {/* Roots */}
            <path d="M20 46 Q17 44.5 14 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.25" />
            <path d="M28 46 Q31 44.5 34 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.2" />
          </g>
        )

      case 'ginkgo':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q24 42 24 38" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="41" rx="2.5" ry="1.5" fill="#8B7355" opacity="0.3" />
            {/* Single fan leaf */}
            <path d="M24 38 L24 35" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M20 32 Q22 30 24 31 Q26 30 28 32 Q26 34 24 35 Q22 34 20 32 Z" fill={color} opacity="0.6" />
            <path d="M24 31 L24 33" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q24 40 24 28" stroke={trunk} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M23.5 36 L25 35.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* Narrow columnar shape */}
            <path d="M20 18 Q20 14 22 12 Q24 10 26 12 Q28 14 28 18 Q28 24 26 28 Q24 29 22 28 Q20 24 20 18 Z" fill={color} opacity="0.65" />
            {/* Fan leaf textures */}
            <path d="M22 16 Q23 14 24 16" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d="M24 20 Q25 18 26 20" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.18" />
            <path d="M22 22 Q23 20 24 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <circle cx="23" cy="15" r="0.5" fill={light} opacity="0.25" />
            <circle cx="25" cy="19" r="0.5" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 Q23 40 23 24 L25 24 Q25 40 25 46 Z" fill={trunk} />
            <path d="M23.5 38 L25 37.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M23.5 32 L25 31.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            {/* Tall narrow column */}
            <path d="M19 12 Q19 8 22 7 Q24 6 26 7 Q29 8 29 12 Q30 18 30 24 Q30 28 28 30 Q26 31 24 31 Q22 31 20 30 Q18 28 18 24 Q18 18 19 12 Z" fill={color} opacity="0.7" />
            {/* Fan-shaped leaf impressions */}
            <path d="M21 10 Q22.5 8.5 24 10" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.2" />
            <path d="M24 10 Q25.5 8.5 27 10" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.18" />
            <path d="M20 16 Q22 14 24 16" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.18" />
            <path d="M24 16 Q26 14 28 16" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M20 22 Q22 20 24 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 22 Q26 20 28 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <ellipse cx="22" cy="12" rx="1.5" ry="2" fill={light} opacity="0.2" />
            <ellipse cx="26" cy="18" rx="1.5" ry="2" fill={light} opacity="0.15" />
            <circle cx="22" cy="24" r="0.6" fill={light} opacity="0.18" />
            {/* Drifting leaf */}
            <path d="M30 28 Q31 27 32 28 Q31 29.5 30 28 Z" fill={color} opacity="0.5" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            {/* Tall straight trunk */}
            <path d="M22.5 46 Q22 38 22 20 L26 20 Q26 38 25.5 46 Z" fill={trunk} />
            <path d="M22.5 46 Q22 38 22 20 L26 20 Q26 38 25.5 46 Z" fill={`url(#${uid}-trunk)`} />
            <path d="M23 42 L25.5 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 36 L25.5 35.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M23 30 L25.5 29.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            {/* Tall narrow COLUMNAR canopy — unique silhouette */}
            <path d="M18 8 Q18 4 21 3 Q24 2 27 3 Q30 4 30 8 Q31 14 31 22 Q31 28 30 32 Q28 35 24 36 Q20 35 18 32 Q17 28 17 22 Q17 14 18 8 Z" fill={color} />
            {/* Inner shadow — right side */}
            <path d="M27 28 Q30 30 30 32 Q28 35 24 36 Q22 35.5 21 34" fill={dark} opacity="0.1" />
            {/* Fan-shaped leaf textures — semicircles with center notch */}
            <path d="M20 8 Q22 6 24 8 L23.8 7 Q22 5 20.2 7 Z" fill={dark} opacity="0.12" />
            <path d="M24 8 Q26 6 28 8 L27.8 7 Q26 5 24.2 7 Z" fill={dark} opacity="0.1" />
            <path d="M19 14 Q21 12 23 14 L22.8 13 Q21 11 19.2 13 Z" fill={dark} opacity="0.1" />
            <path d="M25 14 Q27 12 29 14 L28.8 13 Q27 11 25.2 13 Z" fill={dark} opacity="0.08" />
            <path d="M19 20 Q21 18 23 20 L22.8 19 Q21 17 19.2 19 Z" fill={dark} opacity="0.1" />
            <path d="M25 20 Q27 18 29 20 L28.8 19 Q27 17 25.2 19 Z" fill={dark} opacity="0.08" />
            <path d="M19 26 Q21 24 23 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M25 26 Q27 24 29 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M20 32 Q22 30 24 32" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            {/* Highlights — top-left */}
            <circle cx="21" cy="6" r="0.6" fill={light} opacity="0.35" />
            <circle cx="20" cy="12" r="0.6" fill={light} opacity="0.3" />
            <circle cx="20" cy="18" r="0.6" fill={light} opacity="0.28" />
            <circle cx="20" cy="24" r="0.5" fill={light} opacity="0.25" />
            <circle cx="21" cy="30" r="0.5" fill={light} opacity="0.2" />
            <circle cx="27" cy="10" r="0.5" fill={light} opacity="0.2" />
            <circle cx="27" cy="22" r="0.5" fill={light} opacity="0.18" />
            {/* Lit edge */}
            <path d="M18 8 Q18 4 21 3 Q24 2 27 3" stroke={light} strokeWidth="0.5" fill="none" opacity="0.18" />
            {/* Drifting fallen fan-leaves */}
            <path d="M14 38 Q15.5 36.5 17 38 Q15.5 39.5 14 38 Z" fill={color} opacity="0.45" />
            <path d="M14.8 37.5 L15.5 38.5" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.2" />
            <path d="M32 36 Q33.5 34.5 35 36 Q33.5 37.5 32 36 Z" fill={color} opacity="0.4" />
            <path d="M33 35.5 L33.7 36.5" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.18" />
            <path d="M30 42 Q31 41 32 42 Q31 43 30 42 Z" fill={color} opacity="0.3" />
            {/* Roots */}
            <path d="M22 46 Q19 44.5 16 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q29 44.5 32 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'lotus':
        if (s === 0) return (
          <g>
            {/* Water surface */}
            <path d="M10 44 Q17 42 24 44 Q31 42 38 44" stroke="#4fc3f7" strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M8 46 Q16 44 24 46 Q32 44 40 46" stroke="#4fc3f7" strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Small lily pad */}
            <ellipse cx="24" cy="43" rx="5" ry="2" fill="#4caf50" opacity="0.5" />
            <path d="M24 43 L24 41" stroke="#4caf50" strokeWidth="0.3" fill="none" opacity="0.3" />
            {/* Closed bud */}
            <path d="M23 43 Q23 40 24 38 Q25 40 25 43" fill={color} opacity="0.6" />
            <path d="M22.5 42 Q24 39 25.5 42" fill={light} opacity="0.4" />
            <path d="M24 38 L24 37.5" stroke={color} strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.7" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Water ripples */}
            <path d="M8 44 Q16 42 24 44 Q32 42 40 44" stroke="#4fc3f7" strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M6 46 Q14 44 24 46 Q34 44 42 46" stroke="#4fc3f7" strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Lily pad */}
            <ellipse cx="24" cy="42" rx="7" ry="2.5" fill="#4caf50" opacity="0.55" />
            <path d="M24 42 L24 39.5" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* Half-open bud */}
            <path d="M22 42 Q21 38 24 34 Q27 38 26 42" fill={color} opacity="0.6" />
            <path d="M20 42 Q19 39 24 35 Q29 39 28 42" fill={light} opacity="0.35" />
            <path d="M23 42 Q24 37 25 42" fill={dark} opacity="0.15" />
            <circle cx="24" cy="36" r="0.8" fill="#ffeb3b" opacity="0.4" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* Water ripples */}
            <ellipse cx="24" cy="46" rx="14" ry="1.5" fill="none" stroke="#4fc3f7" strokeWidth="0.4" opacity="0.25" />
            <ellipse cx="24" cy="46" rx="10" ry="1" fill="none" stroke="#4fc3f7" strokeWidth="0.3" opacity="0.2" />
            {/* Lily pad */}
            <ellipse cx="24" cy="42" rx="9" ry="3" fill="#4caf50" opacity="0.55" />
            <ellipse cx="22" cy="41.5" rx="3" ry="1" fill="#66bb6a" opacity="0.2" />
            <path d="M24 42 L24 39" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.2" />
            {/* Opening petals — layered */}
            {/* outer petals */}
            <path d="M14 42 Q13 36 18 32 Q20 40 14 42 Z" fill={color} opacity="0.5" />
            <path d="M34 42 Q35 36 30 32 Q28 40 34 42 Z" fill={color} opacity="0.5" />
            <path d="M16 41 Q14 36 20 33 Q21 39 16 41 Z" fill={light} opacity="0.4" />
            <path d="M32 41 Q34 36 28 33 Q27 39 32 41 Z" fill={light} opacity="0.4" />
            {/* inner petals */}
            <path d="M19 41 Q18 36 22 32 Q23 38 19 41 Z" fill={color} opacity="0.65" />
            <path d="M29 41 Q30 36 26 32 Q25 38 29 41 Z" fill={color} opacity="0.65" />
            <path d="M22 40 Q21 35 24 30 Q27 35 26 40 Z" fill={light} opacity="0.5" />
            {/* Center */}
            <circle cx="24" cy="36" r="2" fill="#ffeb3b" opacity="0.6" />
            <circle cx="24" cy="36" r="1.2" fill="#fbc02d" opacity="0.5" />
            <circle cx="23.5" cy="35.5" r="0.4" fill="#fff" opacity="0.3" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-water`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#4fc3f7" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#4fc3f7" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Water surface glow */}
            <ellipse cx="24" cy="44" rx="18" ry="4" fill={`url(#${uid}-water)`} />
            {/* Water ripple rings */}
            <ellipse cx="24" cy="46" rx="16" ry="2" fill="none" stroke="#4fc3f7" strokeWidth="0.4" opacity="0.25" />
            <ellipse cx="24" cy="46" rx="12" ry="1.5" fill="none" stroke="#4fc3f7" strokeWidth="0.35" opacity="0.2" />
            <ellipse cx="24" cy="46" rx="8" ry="1" fill="none" stroke="#4fc3f7" strokeWidth="0.3" opacity="0.15" />
            {/* Large lily pad */}
            <ellipse cx="24" cy="42" rx="11" ry="3.5" fill="#4caf50" opacity="0.55" />
            <ellipse cx="21" cy="41.5" rx="4" ry="1.2" fill="#66bb6a" opacity="0.2" />
            <path d="M24 42 L24 38.5" stroke="#388e3c" strokeWidth="0.3" fill="none" opacity="0.2" />
            {/* Second small pad */}
            <ellipse cx="36" cy="44" rx="4" ry="1.5" fill="#4caf50" opacity="0.35" />
            {/* FULL OPEN LOTUS — layered petals */}
            {/* outermost petals — splayed wide */}
            <path d="M10 42 Q8 34 16 28 Q18 38 10 42 Z" fill={color} opacity="0.45" />
            <path d="M38 42 Q40 34 32 28 Q30 38 38 42 Z" fill={color} opacity="0.45" />
            <path d="M12 41 Q10 34 18 29 Q19 38 12 41 Z" fill={light} opacity="0.35" />
            <path d="M36 41 Q38 34 30 29 Q29 38 36 41 Z" fill={light} opacity="0.35" />
            {/* mid petals */}
            <path d="M15 41 Q13 34 20 28 Q21 37 15 41 Z" fill={color} opacity="0.6" />
            <path d="M33 41 Q35 34 28 28 Q27 37 33 41 Z" fill={color} opacity="0.6" />
            <path d="M17 40 Q15 34 22 29 Q22 37 17 40 Z" fill={light} opacity="0.45" />
            <path d="M31 40 Q33 34 26 29 Q26 37 31 40 Z" fill={light} opacity="0.45" />
            {/* inner petals — upright */}
            <path d="M20 40 Q18 32 24 24 Q30 32 28 40 Z" fill={color} opacity="0.7" />
            <path d="M21 39 Q20 33 24 26 Q28 33 27 39 Z" fill={light} opacity="0.5" />
            {/* back petals peeking */}
            <path d="M18 38 Q20 30 24 25 L24 26 Q21 31 19 38 Z" fill={dark} opacity="0.12" />
            {/* Central seed pod */}
            <circle cx="24" cy="34" r="3" fill="#ffeb3b" opacity="0.65" />
            <circle cx="24" cy="34" r="2" fill="#fbc02d" opacity="0.55" />
            {/* Seed dots on pod */}
            <circle cx="23" cy="33" r="0.4" fill="#f57f17" opacity="0.4" />
            <circle cx="25" cy="33" r="0.4" fill="#f57f17" opacity="0.35" />
            <circle cx="24" cy="34.5" r="0.4" fill="#f57f17" opacity="0.35" />
            <circle cx="22.5" cy="34.5" r="0.3" fill="#f57f17" opacity="0.3" />
            <circle cx="25.5" cy="34.5" r="0.3" fill="#f57f17" opacity="0.3" />
            {/* Pod highlight */}
            <circle cx="23" cy="33" r="0.6" fill="#fff" opacity="0.25" />
            {/* Petal highlights */}
            <circle cx="16" cy="34" r="0.5" fill={light} opacity="0.3" />
            <circle cx="32" cy="34" r="0.5" fill={light} opacity="0.25" />
            <circle cx="22" cy="30" r="0.5" fill={light} opacity="0.3" />
            <circle cx="26" cy="30" r="0.4" fill={light} opacity="0.25" />
            {/* Reed stalks */}
            <path d="M6 46 L5 38" stroke="#8d6e63" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.25" />
            <path d="M42 46 L43 39" stroke="#8d6e63" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.2" />
          </g>
        )

      case 'acacia':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q24 42 24 38" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="41" rx="2.5" ry="1.5" fill="#8B7355" opacity="0.3" />
            <path d="M24 38 L24 35" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* Tiny feathery leaves */}
            <path d="M22 35 L26 35" stroke={color} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M21.5 34 L26.5 34" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.4" />
            <circle cx="24" cy="34" r="1" fill={color} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q24 40 24 30" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23.5 38 L25 37.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* Starting to flatten out */}
            <path d="M24 30 Q20 28 16 28" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q28 28 32 28" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* Wide flat canopy forming */}
            <path d="M12 26 Q16 22 24 22 Q32 22 36 26 Q32 28 24 28 Q16 28 12 26 Z" fill={color} opacity="0.6" />
            <ellipse cx="20" cy="24" rx="3" ry="1.5" fill={light} opacity="0.2" />
            <ellipse cx="30" cy="25" rx="2.5" ry="1" fill={dark} opacity="0.1" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 Q23 40 23 26 L25 26 Q25 40 25 46 Z" fill={trunk} />
            <path d="M23.5 38 L25 37.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M23.5 32 L25 31.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            {/* Branches splay out flat */}
            <path d="M23 28 Q16 24 10 22" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M25 28 Q32 24 38 22" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            {/* Flat umbrella canopy */}
            <path d="M6 18 Q8 14 16 13 Q24 12 32 13 Q40 14 42 18 Q40 22 32 23 Q24 24 16 23 Q8 22 6 18 Z" fill={color} opacity="0.65" />
            {/* Flat top emphasis */}
            <path d="M8 16 L40 16" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.1" />
            <ellipse cx="18" cy="16" rx="5" ry="2" fill={light} opacity="0.2" />
            <ellipse cx="32" cy="18" rx="4" ry="1.5" fill={dark} opacity="0.1" />
            {/* Feathery leaf texture */}
            <path d="M14 18 L18 17" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M28 17 L32 18" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M20 46 Q17 44.5 14 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            {/* Thin trunk — characteristic of acacia */}
            <path d="M22.5 46 Q22 38 22 22 L26 22 Q26 38 25.5 46 Z" fill={trunk} />
            <path d="M22.5 46 Q22 38 22 22 L26 22 Q26 38 25.5 46 Z" fill={`url(#${uid}-trunk)`} />
            <path d="M23 42 L25.5 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 36 L25.5 35.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M23 30 L25.5 29.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            {/* Branches splay out — flat horizontal */}
            <path d="M22 24 Q14 18 4 16" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M26 24 Q34 18 44 16" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 24 Q18 20 10 18" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M25 24 Q30 20 38 18" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />
            {/* FLAT-TOPPED UMBRELLA CANOPY — the iconic shape */}
            <path d="M2 14 Q4 8 14 7 Q24 6 34 7 Q44 8 46 14 Q44 18 34 19 Q24 20 14 19 Q4 18 2 14 Z" fill={color} />
            {/* Flat top line — this is what makes it an acacia */}
            <path d="M4 10 L44 10" stroke={color} strokeWidth="0.5" fill="none" opacity="0.3" />
            {/* Shadow — bottom */}
            <path d="M10 18 Q16 19 24 20 Q32 19 38 18 Q34 19 24 19.5 Q14 19 10 18 Z" fill={dark} opacity="0.12" />
            {/* Feathery leaf textures — mimosa-like */}
            <path d="M8 12 L14 11" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M16 11 L22 10" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M26 10 L32 11" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M34 11 L40 12" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M12 14 L18 13" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.08" />
            <path d="M30 13 L36 14" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.08" />
            {/* Highlights — top face */}
            <circle cx="12" cy="10" r="0.6" fill={light} opacity="0.3" />
            <circle cx="20" cy="9" r="0.5" fill={light} opacity="0.3" />
            <circle cx="28" cy="9" r="0.5" fill={light} opacity="0.28" />
            <circle cx="36" cy="10" r="0.5" fill={light} opacity="0.25" />
            <circle cx="8" cy="12" r="0.5" fill={light} opacity="0.2" />
            <circle cx="40" cy="12" r="0.4" fill={light} opacity="0.18" />
            <circle cx="24" cy="8" r="0.6" fill={light} opacity="0.3" />
            {/* Lit edge */}
            <path d="M2 14 Q4 8 14 7 Q24 6 34 7" stroke={light} strokeWidth="0.5" fill="none" opacity="0.15" />
            {/* Roots */}
            <path d="M22 46 Q18 44.5 14 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q30 44.5 34 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'venus':
        if (s === 0) return (
          <g>
            <ellipse cx="24" cy="45" rx="4" ry="1.5" fill="#8B7355" opacity="0.3" />
            {/* Single small closed trap */}
            <path d="M24 46 Q24 44 24 42" stroke="#558b2f" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M22 42 Q24 40 26 42" fill={color} opacity="0.5" />
            <path d="M22 42 Q24 44 26 42" fill="#558b2f" opacity="0.4" />
            <path d="M22.5 42 L23.3 41.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d="M25.5 42 L24.7 41.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <ellipse cx="24" cy="45.5" rx="5" ry="1.5" fill="#8B7355" opacity="0.3" />
            {/* Two traps on stems */}
            <path d="M22 46 Q21 42 20 38" stroke="#558b2f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 46 Q27 42 28 38" stroke="#558b2f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            {/* Trap 1 — half open */}
            <path d="M17 38 Q20 35 23 38" fill={color} opacity="0.6" />
            <path d="M17 38 Q20 41 23 38" fill="#c62828" opacity="0.4" />
            {/* teeth */}
            <path d="M17.5 38 L17 37" stroke={color} strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M19 37.5 L18.5 36.5" stroke={color} strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M21 37.5 L21 36.5" stroke={color} strokeWidth="0.4" strokeLinecap="round" fill="none" />
            <path d="M22.5 38 L23 37" stroke={color} strokeWidth="0.4" strokeLinecap="round" fill="none" />
            {/* Trap 2 — closed */}
            <path d="M25.5 38 Q28 36 30.5 38" fill={color} opacity="0.55" />
            <path d="M25.5 38 Q28 40 30.5 38" fill="#558b2f" opacity="0.4" />
            <path d="M26 38 L25.5 37.2" stroke={color} strokeWidth="0.3" strokeLinecap="round" fill="none" />
            <path d="M30 38 L30.5 37.2" stroke={color} strokeWidth="0.3" strokeLinecap="round" fill="none" />
          </g>
        )
        if (s === 2) return (
          <g>
            <ellipse cx="24" cy="45.5" rx="6" ry="1.8" fill="#8B7355" opacity="0.3" />
            {/* Three stems */}
            <path d="M20 46 Q18 40 16 34" stroke="#558b2f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24 40 24 34" stroke="#558b2f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M28 46 Q30 40 32 34" stroke="#558b2f" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            {/* Trap 1 — wide open */}
            <path d="M12 34 Q16 30 20 34" fill={color} opacity="0.65" />
            <path d="M12 34 Q16 38 20 34" fill="#c62828" opacity="0.45" />
            <path d="M12.5 34 L11.5 32.5" stroke={color} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M14.5 33 L14 31.5" stroke={color} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M16.5 32.5 L16.5 31" stroke={color} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M18.5 33 L19 31.5" stroke={color} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M19.5 34 L20.5 32.5" stroke={color} strokeWidth="0.5" strokeLinecap="round" fill="none" />
            {/* Trap 2 — open */}
            <path d="M20 34 Q24 30.5 28 34" fill={color} opacity="0.6" />
            <path d="M20 34 Q24 37.5 28 34" fill="#c62828" opacity="0.4" />
            <path d="M21 33.5 L20.5 32" stroke={color} strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M23 33 L23 31.5" stroke={color} strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M25 33 L25 31.5" stroke={color} strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M27 33.5 L27.5 32" stroke={color} strokeWidth="0.45" strokeLinecap="round" fill="none" />
            {/* Trap 3 — closing */}
            <path d="M28 34 Q32 31.5 36 34" fill={color} opacity="0.6" />
            <path d="M28 34 Q32 36.5 36 34" fill="#c62828" opacity="0.35" />
            <path d="M29 34 L28.5 32.5" stroke={color} strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M31 33.5 L31 32" stroke={color} strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M33 33.5 L33 32" stroke={color} strokeWidth="0.45" strokeLinecap="round" fill="none" />
            <path d="M35 34 L35.5 32.5" stroke={color} strokeWidth="0.45" strokeLinecap="round" fill="none" />
            {/* trigger hairs inside */}
            <circle cx="16" cy="35" r="0.3" fill="#c62828" opacity="0.5" />
            <circle cx="24" cy="35" r="0.3" fill="#c62828" opacity="0.45" />
            <circle cx="32" cy="35" r="0.3" fill="#c62828" opacity="0.4" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-glow`} cx="50%" cy="60%">
                <stop offset="0%" stopColor={color} stopOpacity="0.1" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Soil mound */}
            <ellipse cx="24" cy="45.5" rx="8" ry="2" fill="#8B7355" opacity="0.35" />
            {/* Menacing glow */}
            <ellipse cx="24" cy="36" rx="14" ry="10" fill={`url(#${uid}-glow)`} />
            {/* Four stems — curved and predatory */}
            <path d="M18 46 Q14 38 10 30" stroke="#558b2f" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M22 46 Q20 38 18 32" stroke="#558b2f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M26 46 Q28 38 30 32" stroke="#558b2f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M30 46 Q34 38 38 30" stroke="#558b2f" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Trap 1 — far left, wide open, menacing */}
            <path d="M5 30 Q10 25 15 30" fill={color} opacity="0.7" />
            <path d="M5 30 Q10 35 15 30" fill="#c62828" opacity="0.5" />
            {/* teeth — spiky */}
            <path d="M5.5 30 L4 27.5" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M7.5 28.5 L6.5 26" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M10 27.5 L10 25" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M12.5 28.5 L13.5 26" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M14.5 30 L16 27.5" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            {/* bottom teeth */}
            <path d="M6 31 L5 33" stroke={color} strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M10 32.5 L10 34.5" stroke={color} strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M14 31 L15 33" stroke={color} strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.5" />
            {/* red interior detail */}
            <circle cx="10" cy="30.5" r="0.5" fill="#d32f2f" opacity="0.5" />
            <circle cx="8" cy="30" r="0.3" fill="#d32f2f" opacity="0.4" />
            <circle cx="12" cy="30" r="0.3" fill="#d32f2f" opacity="0.4" />
            {/* Trap 2 — inner left */}
            <path d="M14 32 Q18 28 22 32" fill={color} opacity="0.65" />
            <path d="M14 32 Q18 36 22 32" fill="#c62828" opacity="0.45" />
            <path d="M14.5 32 L13.5 30" stroke={color} strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M16.5 31 L16 29" stroke={color} strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M18.5 30.5 L18.5 28.5" stroke={color} strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M20.5 31 L21 29" stroke={color} strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M21.5 32 L22.5 30" stroke={color} strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <circle cx="18" cy="32.5" r="0.4" fill="#d32f2f" opacity="0.45" />
            {/* Trap 3 — inner right */}
            <path d="M26 32 Q30 28 34 32" fill={color} opacity="0.65" />
            <path d="M26 32 Q30 36 34 32" fill="#c62828" opacity="0.45" />
            <path d="M26.5 32 L25.5 30" stroke={color} strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M28.5 31 L28 29" stroke={color} strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M30.5 30.5 L30.5 28.5" stroke={color} strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M32.5 31 L33 29" stroke={color} strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <path d="M33.5 32 L34.5 30" stroke={color} strokeWidth="0.55" strokeLinecap="round" fill="none" />
            <circle cx="30" cy="32.5" r="0.4" fill="#d32f2f" opacity="0.45" />
            {/* Trap 4 — far right, wide open */}
            <path d="M33 30 Q38 25 43 30" fill={color} opacity="0.7" />
            <path d="M33 30 Q38 35 43 30" fill="#c62828" opacity="0.5" />
            <path d="M33.5 30 L32 27.5" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M35.5 28.5 L34.5 26" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M38 27.5 L38 25" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M40.5 28.5 L41.5 26" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M42.5 30 L44 27.5" stroke={color} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <circle cx="38" cy="30.5" r="0.5" fill="#d32f2f" opacity="0.5" />
            {/* Highlights on trap edges */}
            <circle cx="6" cy="28" r="0.4" fill={light} opacity="0.3" />
            <circle cx="16" cy="29.5" r="0.35" fill={light} opacity="0.25" />
            <circle cx="28" cy="29.5" r="0.35" fill={light} opacity="0.25" />
            <circle cx="42" cy="28" r="0.4" fill={light} opacity="0.3" />
          </g>
        )

      case 'holly':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 39" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="42" rx="2.5" ry="1.5" fill="#8B7355" opacity="0.3" />
            {/* Single spiky leaf */}
            <path d="M24 39 L24 36" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M21 35 L23 33.5 L22 32 L24 33 L26 32 L25 33.5 L27 35 L25 34.5 L24 36 L23 34.5 Z" fill="#2e7d32" opacity="0.6" />
            <circle cx="24" cy="34" r="0.6" fill={color} opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23.5 40 24 32" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23.5 38 L25 37.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* Spiky bush forming */}
            <path d="M18 30 L20 27 L19 25 L22 27 L24 24 L26 27 L29 25 L28 27 L30 30 L28 29 L26 31 L24 29 L22 31 L20 29 Z" fill="#2e7d32" opacity="0.65" />
            <path d="M19 28 L21 26 L20 24.5 L23 26.5 L24 23.5 L25 26.5 L28 24.5 L27 26 L29 28" fill="#388e3c" opacity="0.3" />
            {/* Berry cluster */}
            <circle cx="22" cy="28" r="0.8" fill={color} opacity="0.7" />
            <circle cx="23.5" cy="27.5" r="0.7" fill={color} opacity="0.6" />
            <circle cx="25" cy="28.5" r="0.7" fill={color} opacity="0.65" />
            <circle cx="22" cy="28" r="0.3" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 Q22 40 22 28 L26 28 Q26 40 25 46 Z" fill={trunk} />
            <path d="M23.5 38 L25 37.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* Larger spiky bush */}
            <path d="M14 26 L16 22 L15 19 L18 22 L20 18 L22 21 L24 16 L26 21 L28 18 L30 22 L33 19 L32 22 L34 26 L32 24.5 L30 27 L28 24 L26 27 L24 24 L22 27 L20 24 L18 27 L16 24.5 Z" fill="#2e7d32" opacity="0.7" />
            {/* Second layer */}
            <path d="M16 24 L18 20 L17 18 L20 20.5 L22 17.5 L24 20 L26 17.5 L28 20.5 L31 18 L30 20 L32 24" fill="#388e3c" opacity="0.35" />
            {/* Berry clusters */}
            <circle cx="18" cy="24" r="0.9" fill={color} opacity="0.75" />
            <circle cx="19.5" cy="23" r="0.8" fill={color} opacity="0.7" />
            <circle cx="17.5" cy="22.5" r="0.7" fill={color} opacity="0.65" />
            <circle cx="28" cy="23" r="0.9" fill={color} opacity="0.75" />
            <circle cx="29.5" cy="22" r="0.7" fill={color} opacity="0.65" />
            <circle cx="24" cy="20" r="0.8" fill={color} opacity="0.7" />
            <circle cx="18" cy="24" r="0.3" fill={light} opacity="0.3" />
            <circle cx="28" cy="23" r="0.3" fill={light} opacity="0.25" />
            <path d="M22 46 Q19 44.5 16 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            {/* Short thick trunk */}
            <path d="M22 46 Q21 40 21 30 L27 30 Q27 40 26 46 Z" fill={trunk} />
            <path d="M22 46 Q21 40 21 30 L27 30 Q27 40 26 46 Z" fill={`url(#${uid}-trunk)`} />
            <path d="M23 42 L25.5 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 36 L25.5 35.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* AGGRESSIVELY SPIKY SILHOUETTE — star/spike-edged holly bush */}
            {/* Outer spike ring */}
            <path d="M10 24 L12 18 L10 14 L14 17 L18 12 L19 16 L24 10 L29 16 L30 12 L34 17 L38 14 L36 18 L38 24 L36 22 L34 26 L32 22 L30 28 L28 23 L26 28 L24 22 L22 28 L20 23 L18 28 L16 22 L14 26 L12 22 Z" fill="#2e7d32" />
            {/* Inner spike layer */}
            <path d="M14 22 L16 17 L14 14 L18 16.5 L20 12.5 L22 16 L24 11 L26 16 L28 12.5 L30 16.5 L34 14 L32 17 L34 22" fill="#388e3c" opacity="0.4" />
            {/* Bottom fill */}
            <path d="M10 24 Q12 28 16 30 Q20 31 24 30 Q28 31 32 30 Q36 28 38 24 L36 26 L34 28 Q30 30 24 30 Q18 30 14 28 L12 26 Z" fill="#2e7d32" opacity="0.8" />
            {/* Dark interior */}
            <ellipse cx="24" cy="22" rx="8" ry="6" fill={dark} opacity="0.1" />
            {/* Spike leaf textures */}
            <path d="M16 20 L18 18.5 L16 17 L18.5 18 L20 16 L20 18 L16 20" fill="#1b5e20" opacity="0.15" />
            <path d="M28 20 L30 18.5 L32 17 L29.5 18 L28 16 L28 18 L28 20" fill="#1b5e20" opacity="0.12" />
            {/* BRIGHT RED BERRY CLUSTERS — the defining ornament */}
            {/* cluster 1 — left */}
            <circle cx="16" cy="22" r="1.1" fill={color} />
            <circle cx="17.8" cy="21" r="1" fill={color} opacity="0.9" />
            <circle cx="15.5" cy="20.5" r="0.9" fill={color} opacity="0.85" />
            <circle cx="17" cy="23" r="0.8" fill={color} opacity="0.8" />
            {/* cluster 2 — center */}
            <circle cx="24" cy="18" r="1.1" fill={color} />
            <circle cx="22.5" cy="17" r="0.9" fill={color} opacity="0.9" />
            <circle cx="25.5" cy="17.5" r="0.9" fill={color} opacity="0.85" />
            <circle cx="24" cy="19.5" r="0.8" fill={color} opacity="0.8" />
            {/* cluster 3 — right */}
            <circle cx="32" cy="22" r="1.1" fill={color} />
            <circle cx="30.5" cy="21" r="0.9" fill={color} opacity="0.9" />
            <circle cx="33" cy="20.5" r="0.9" fill={color} opacity="0.85" />
            <circle cx="31.5" cy="23" r="0.8" fill={color} opacity="0.8" />
            {/* Berry highlights */}
            <circle cx="15.5" cy="21.5" r="0.35" fill="#fff" opacity="0.4" />
            <circle cx="23.5" cy="17.5" r="0.35" fill="#fff" opacity="0.4" />
            <circle cx="31.5" cy="21.5" r="0.35" fill="#fff" opacity="0.35" />
            <circle cx="17.5" cy="20.5" r="0.25" fill="#fff" opacity="0.3" />
            <circle cx="25" cy="17" r="0.25" fill="#fff" opacity="0.3" />
            <circle cx="33" cy="20" r="0.25" fill="#fff" opacity="0.25" />
            {/* Leaf highlights */}
            <circle cx="12" cy="16" r="0.5" fill={light} opacity="0.2" />
            <circle cx="20" cy="13" r="0.5" fill={light} opacity="0.22" />
            <circle cx="28" cy="13" r="0.45" fill={light} opacity="0.2" />
            <circle cx="36" cy="16" r="0.45" fill={light} opacity="0.18" />
            {/* Lit edge */}
            <path d="M10 24 L12 18 L10 14 L14 17 L18 12 L19 16 L24 10" stroke={light} strokeWidth="0.4" fill="none" opacity="0.15" />
            {/* Roots */}
            <path d="M21 46 Q18 44.5 15 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M27 46 Q30 44.5 33 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'bonfire':
        if (s === 0) return (
          <g>
            {/* Charred base */}
            <ellipse cx="24" cy="45" rx="3" ry="1" fill="#3e2723" opacity="0.4" />
            <path d="M24 46 Q24 43 24 40" stroke="#3e2723" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Tiny flame */}
            <path d="M23 40 Q24 37 25 40" fill={color} opacity="0.6" />
            <path d="M23.5 40 Q24 38 24.5 40" fill="#ffab00" opacity="0.5" />
            <circle cx="24" cy="38.5" r="0.5" fill="#fff176" opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <ellipse cx="24" cy="45" rx="4" ry="1.5" fill="#3e2723" opacity="0.4" />
            {/* Charred trunk */}
            <path d="M23 46 Q22.5 40 23 34" stroke="#3e2723" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M25 46 Q25.5 40 25 34" stroke="#3e2723" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            {/* Flame tongues */}
            <path d="M20 34 Q22 28 24 26 Q26 28 28 34 Z" fill={color} opacity="0.6" />
            <path d="M21 34 Q23 29 25 27 Q26 30 27 34 Z" fill="#ffab00" opacity="0.5" />
            <path d="M22 34 Q24 30 26 34 Z" fill="#fff176" opacity="0.4" />
            <path d="M19 34 Q18 30 20 28 Q22 32 19 34" fill={color} opacity="0.4" />
            <path d="M29 34 Q30 30 28 28 Q26 32 29 34" fill={color} opacity="0.4" />
            <circle cx="24" cy="29" r="1" fill="#fff176" opacity="0.35" />
          </g>
        )
        if (s === 2) return (
          <g>
            <ellipse cx="24" cy="45" rx="5" ry="1.8" fill="#3e2723" opacity="0.4" />
            {/* Dark charred trunk */}
            <path d="M22 46 Q21 40 21 32 L27 32 Q27 40 26 46 Z" fill="#3e2723" />
            <path d="M21 34 Q18 32 16 30" stroke="#3e2723" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M27 33 Q30 31 32 30" stroke="#3e2723" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Flame canopy — overlapping flame tongues */}
            <path d="M14 32 Q12 26 16 20 Q18 28 14 32" fill={color} opacity="0.55" />
            <path d="M16 30 Q14 22 18 16 Q20 24 16 30" fill={color} opacity="0.6" />
            <path d="M18 32 Q16 24 20 14 Q22 22 18 32" fill="#ffab00" opacity="0.55" />
            <path d="M20 32 Q18 22 22 12 Q24 20 20 32" fill={color} opacity="0.65" />
            <path d="M22 32 Q20 20 24 10 Q28 20 26 32" fill="#ffab00" opacity="0.6" />
            <path d="M26 32 Q28 22 26 12 Q24 22 26 32" fill={color} opacity="0.6" />
            <path d="M28 32 Q30 24 28 16 Q26 24 28 32" fill="#ffab00" opacity="0.55" />
            <path d="M30 30 Q32 22 30 18 Q28 26 30 30" fill={color} opacity="0.5" />
            <path d="M32 30 Q34 24 32 20 Q30 26 32 30" fill={color} opacity="0.45" />
            {/* Hot core */}
            <path d="M21 30 Q22 22 24 16 Q26 22 27 30 Z" fill="#fff176" opacity="0.4" />
            <circle cx="24" cy="20" r="1.5" fill="#fff176" opacity="0.35" />
            <circle cx="22" cy="24" r="0.8" fill="#fff176" opacity="0.25" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-glow`} cx="50%" cy="60%">
                <stop offset="0%" stopColor="#ffab00" stopOpacity="0.2" />
                <stop offset="60%" stopColor={color} stopOpacity="0.08" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`${uid}-trunk`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#4e342e" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {/* Warm glow */}
            <ellipse cx="24" cy="24" rx="18" ry="16" fill={`url(#${uid}-glow)`} />
            {/* Charred black trunk */}
            <path d="M21 46 Q20 38 20 28 L28 28 Q28 38 27 46 Z" fill="#3e2723" />
            <path d="M21 46 Q20 38 20 28 L28 28 Q28 38 27 46 Z" fill={`url(#${uid}-trunk)`} />
            {/* Charred branches */}
            <path d="M21 30 Q14 26 8 24" stroke="#3e2723" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M27 29 Q34 25 40 24" stroke="#3e2723" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M22 30 Q18 28 14 27" stroke="#3e2723" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M26 29 Q30 27 34 26" stroke="#3e2723" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />
            {/* Ember cracks on trunk */}
            <path d="M22 38 L24 37 L23 40" stroke={color} strokeWidth="0.4" fill="none" opacity="0.35" />
            <path d="M25 42 L26 40" stroke={color} strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* FLAME CANOPY — overlapping wavy flame-tongue paths */}
            {/* Far left flames */}
            <path d="M6 26 Q4 20 8 14 Q10 20 6 26" fill={color} opacity="0.5" />
            <path d="M8 24 Q6 18 10 12 Q12 18 8 24" fill={color} opacity="0.55" />
            {/* Left flames */}
            <path d="M10 28 Q8 20 12 12 Q14 20 10 28" fill="#ffab00" opacity="0.5" />
            <path d="M12 28 Q10 18 14 10 Q16 18 12 28" fill={color} opacity="0.6" />
            <path d="M14 28 Q12 16 16 8 Q18 16 14 28" fill="#ffab00" opacity="0.55" />
            {/* Center-left */}
            <path d="M16 28 Q14 14 18 6 Q20 14 16 28" fill={color} opacity="0.65" />
            <path d="M18 28 Q16 12 20 6 Q22 14 18 28" fill="#ffab00" opacity="0.6" />
            {/* Center — tallest flames */}
            <path d="M20 28 Q18 10 22 4 Q24 8 20 28" fill={color} opacity="0.7" />
            <path d="M22 28 Q20 8 24 2 Q28 8 26 28" fill="#ffab00" opacity="0.65" />
            <path d="M24 28 Q22 10 26 4 Q28 12 24 28" fill={color} opacity="0.7" />
            {/* Center-right */}
            <path d="M28 28 Q30 12 28 6 Q26 14 28 28" fill="#ffab00" opacity="0.6" />
            <path d="M30 28 Q32 14 30 6 Q28 16 30 28" fill={color} opacity="0.65" />
            {/* Right flames */}
            <path d="M32 28 Q34 16 32 8 Q30 18 32 28" fill="#ffab00" opacity="0.55" />
            <path d="M34 28 Q36 18 34 10 Q32 20 34 28" fill={color} opacity="0.6" />
            <path d="M36 28 Q38 20 36 12 Q34 22 36 28" fill="#ffab00" opacity="0.5" />
            {/* Far right flames */}
            <path d="M38 24 Q40 18 38 12 Q36 20 38 24" fill={color} opacity="0.55" />
            <path d="M40 26 Q42 20 40 14 Q38 22 40 26" fill={color} opacity="0.5" />
            {/* HOT WHITE-YELLOW CORE */}
            <path d="M19 26 Q18 14 22 8 Q24 12 26 8 Q30 14 29 26 Z" fill="#fff176" opacity="0.35" />
            <path d="M21 24 Q20 16 24 10 Q28 16 27 24 Z" fill="#fff9c4" opacity="0.25" />
            {/* Floating embers/sparks */}
            <circle cx="14" cy="8" r="0.5" fill="#ffab00" opacity="0.5" />
            <circle cx="34" cy="6" r="0.4" fill={color} opacity="0.45" />
            <circle cx="10" cy="12" r="0.35" fill="#fff176" opacity="0.4" />
            <circle cx="38" cy="10" r="0.35" fill="#ffab00" opacity="0.4" />
            <circle cx="20" cy="4" r="0.3" fill="#fff176" opacity="0.35" />
            <circle cx="28" cy="3" r="0.3" fill="#ffab00" opacity="0.35" />
            <circle cx="8" cy="16" r="0.3" fill={color} opacity="0.3" />
            <circle cx="40" cy="16" r="0.3" fill={color} opacity="0.3" />
            {/* Highlights on flame edges */}
            <circle cx="18" cy="10" r="0.5" fill={light} opacity="0.3" />
            <circle cx="30" cy="10" r="0.5" fill={light} opacity="0.28" />
            <circle cx="24" cy="6" r="0.5" fill={light} opacity="0.35" />
            {/* Charred roots */}
            <path d="M20 46 Q17 44.5 14 46" stroke="#3e2723" strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M28 46 Q31 44.5 34 46" stroke="#3e2723" strokeWidth="0.7" fill="none" opacity="0.25" />
          </g>
        )
      // Wave 3: Rare (7) + Epic (5) tree shapes
      // Paste these case blocks into the renderShape() switch in PlantIcon.tsx

      // ============================================================
      // RARE TREES (7)
      // ============================================================

      case 'totem': {
        // Carved totem pole — NOT a tree. Stacked carved faces on wooden pole.
        const twood = "#5d4037";
        const tlight = lighten(twood, 30);
        const tdark = darken(twood, 30);
        const red = "#c62828";
        const green = "#2e7d32";
        const gold = "#f9a825";
        if (s === 0) return (
          <g>
            <rect x="22" y="38" width="4" height="8" rx="1" fill={twood} />
            <rect x="22" y="38" width="4" height="8" rx="1" fill={tdark} opacity="0.15" />
            <ellipse cx="24" cy="37" rx="3" ry="2" fill={twood} />
            <circle cx="23" cy="36.5" r="0.6" fill="#111" />
            <circle cx="25" cy="36.5" r="0.6" fill="#111" />
            <path d="M22.8 38 Q24 39 25.2 38" stroke="#111" strokeWidth="0.5" fill="none" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="21.5" y="30" width="5" height="16" rx="1" fill={twood} />
            <rect x="21.5" y="30" width="5" height="16" rx="1" fill={`url(#${uid}-tw)`} />
            <defs>
              <linearGradient id={`${uid}-tw`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {/* Face 1 — bottom */}
            <ellipse cx="24" cy="40" rx="3.5" ry="3" fill={tlight} opacity="0.3" />
            <circle cx="22.8" cy="39" r="0.8" fill="#111" />
            <circle cx="25.2" cy="39" r="0.8" fill="#111" />
            <path d="M22.5 41 Q24 42.5 25.5 41" stroke={red} strokeWidth="0.7" fill="none" />
            {/* Face 2 — top */}
            <ellipse cx="24" cy="33" rx="3.5" ry="3" fill={tlight} opacity="0.3" />
            <path d="M22 32 L21 31 L23 32" fill={green} />
            <path d="M26 32 L27 31 L25 32" fill={green} />
            <circle cx="23" cy="32.5" r="0.7" fill="#111" />
            <circle cx="25" cy="32.5" r="0.7" fill="#111" />
            <path d="M22.8 34.5 Q24 33.5 25.2 34.5" stroke="#111" strokeWidth="0.6" fill="none" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-tw`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <rect x="21" y="22" width="6" height="24" rx="1" fill={twood} />
            <rect x="21" y="22" width="6" height="24" rx="1" fill={`url(#${uid}-tw)`} />
            {/* Face 1 — bottom */}
            <circle cx="23" cy="41" r="0.9" fill="#111" />
            <circle cx="25" cy="41" r="0.9" fill="#111" />
            <path d="M22 43 Q24 44.5 26 43" stroke={red} strokeWidth="0.8" fill={red} opacity="0.6" />
            {/* Face 2 — middle */}
            <rect x="20" y="31" width="8" height="1" fill={gold} opacity="0.5" />
            <circle cx="22.5" cy="34" r="0.9" fill="#111" />
            <circle cx="25.5" cy="34" r="0.9" fill="#111" />
            <ellipse cx="24" cy="36.5" rx="1.5" ry="0.8" fill="#111" opacity="0.7" />
            {/* Wings at middle */}
            <path d="M21 33 L17 31 L17 35 Z" fill={green} opacity="0.7" />
            <path d="M27 33 L31 31 L31 35 Z" fill={green} opacity="0.7" />
            {/* Face 3 — top */}
            <ellipse cx="24" cy="25" rx="4" ry="3.5" fill={tlight} opacity="0.25" />
            <circle cx="22.5" cy="24.5" r="1" fill="#111" />
            <circle cx="25.5" cy="24.5" r="1" fill="#111" />
            <path d="M22 27 Q24 28.5 26 27" stroke={red} strokeWidth="0.8" fill="none" />
            <path d="M22 23 L20 21 L22.5 22.5" fill={gold} opacity="0.6" />
            <path d="M26 23 L28 21 L25.5 22.5" fill={gold} opacity="0.6" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-tw`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            {/* Main pole */}
            <rect x="20" y="14" width="8" height="32" rx="1.5" fill={twood} />
            <rect x="20" y="14" width="8" height="32" rx="1.5" fill={`url(#${uid}-tw)`} />
            {/* Carved rings */}
            <rect x="19.5" y="22" width="9" height="1" fill={gold} opacity="0.4" />
            <rect x="19.5" y="32" width="9" height="1" fill={gold} opacity="0.4" />
            {/* Face 1 — bottom (mouth open, round eyes) */}
            <circle cx="22.5" cy="40" r="1" fill="#111" />
            <circle cx="25.5" cy="40" r="1" fill="#111" />
            <circle cx="22.5" cy="40" r="0.4" fill="#fff" opacity="0.4" />
            <circle cx="25.5" cy="40" r="0.4" fill="#fff" opacity="0.4" />
            <ellipse cx="24" cy="43" rx="1.8" ry="1.2" fill={red} opacity="0.7" />
            <ellipse cx="24" cy="43" rx="1" ry="0.6" fill="#111" opacity="0.5" />
            {/* Teeth */}
            <rect x="23" y="42.2" width="0.5" height="0.6" fill="#eee" opacity="0.5" />
            <rect x="24.5" y="42.2" width="0.5" height="0.6" fill="#eee" opacity="0.5" />
            {/* Face 2 — middle (angry brow, frown) */}
            <path d="M21 28 L23 26.5" stroke="#111" strokeWidth="0.8" />
            <path d="M27 28 L25 26.5" stroke="#111" strokeWidth="0.8" />
            <circle cx="22.5" cy="28.5" r="0.9" fill="#111" />
            <circle cx="25.5" cy="28.5" r="0.9" fill="#111" />
            <path d="M22.5 30.5 Q24 29.5 25.5 30.5" stroke={red} strokeWidth="0.7" fill="none" />
            {/* Wings/arms at middle face */}
            <path d="M20 27 L15 24 L15 30 Z" fill={green} opacity="0.7" />
            <path d="M28 27 L33 24 L33 30 Z" fill={green} opacity="0.7" />
            <path d="M15 26 L13 25 L14 28" stroke={green} strokeWidth="0.6" fill="none" opacity="0.5" />
            <path d="M33 26 L35 25 L34 28" stroke={green} strokeWidth="0.6" fill="none" opacity="0.5" />
            {/* Face 3 — top (wide eyes, crown) */}
            <ellipse cx="24" cy="18" rx="5" ry="4" fill={tlight} opacity="0.2" />
            <circle cx="22" cy="17.5" r="1.2" fill="#fff" opacity="0.6" />
            <circle cx="26" cy="17.5" r="1.2" fill="#fff" opacity="0.6" />
            <circle cx="22" cy="17.5" r="0.6" fill="#111" />
            <circle cx="26" cy="17.5" r="0.6" fill="#111" />
            <path d="M22 20.5 Q24 21.5 26 20.5" stroke={red} strokeWidth="0.8" fill={red} opacity="0.5" />
            {/* Crown/headdress */}
            <path d="M20 14 L18 10 L21 13" fill={gold} opacity="0.7" />
            <path d="M24 14 L24 9 L24.5 13" fill={red} opacity="0.6" />
            <path d="M28 14 L30 10 L27 13" fill={gold} opacity="0.7" />
            <circle cx="24" cy="9" r="1" fill={gold} opacity="0.8" />
            {/* Nose on top face */}
            <path d="M24 18 L23.2 19.5 L24.8 19.5 Z" fill={tdark} opacity="0.3" />
            {/* Bark texture */}
            <path d="M21 36 L27 35.8" stroke={tdark} strokeWidth="0.4" opacity="0.15" />
            <path d="M21 38 L27 37.8" stroke={tdark} strokeWidth="0.3" opacity="0.12" />
            {/* Root base */}
            <path d="M20 46 Q17 44 14 46" stroke={twood} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M28 46 Q31 44 34 46" stroke={twood} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )
      }

      case 'lantern': {
        // Paper lantern tree — delicate branches with glowing lanterns
        if (s === 0) return (
          <g>
            <path d="M24 46 Q24 42 24 38" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M24 38 Q22 36 24 34" stroke={trunk} strokeWidth="1" fill="none" />
            <rect x="22" y="33" width="4" height="3" rx="1" fill={color} opacity="0.6" />
            <rect x="22.5" y="32.5" width="3" height="0.8" fill={dark} opacity="0.4" />
            <circle cx="24" cy="34.5" r="1" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q24 40 24 32" stroke={trunk} strokeWidth="2" fill="none" />
            <path d="M24 34 Q18 30 16 28" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M24 32 Q30 28 32 26" stroke={trunk} strokeWidth="1" fill="none" />
            {/* Lantern 1 */}
            <rect x="14" y="26" width="4" height="5" rx="1.5" fill={color} opacity="0.7" />
            <line x1="16" y1="25.5" x2="16" y2="28" stroke={dark} strokeWidth="0.5" />
            <rect x="14.5" y="25" width="3" height="1" rx="0.3" fill={dark} opacity="0.5" />
            <circle cx="16" cy="28.5" r="1.2" fill={light} opacity="0.35" />
            {/* Lantern 2 */}
            <rect x="30" y="24" width="3.5" height="4.5" rx="1.2" fill={color} opacity="0.7" />
            <rect x="30.5" y="23.5" width="2.5" height="0.8" rx="0.3" fill={dark} opacity="0.5" />
            <circle cx="31.7" cy="26.5" r="1" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-glow`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={light} stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d="M23 46 Q22 40 22 32 L26 32 Q26 40 25 46" fill={trunk} />
            <path d="M23 34 Q16 28 12 26" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M25 32 Q30 26 34 24" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M24 30 Q20 24 18 20" stroke={trunk} strokeWidth="1" fill="none" />
            <path d="M24 30 Q28 22 30 18" stroke={trunk} strokeWidth="0.8" fill="none" />
            {/* Lanterns (4) */}
            {[{x:11,y:24},{x:18,y:18},{x:30,y:16},{x:33,y:22}].map((l,i) => (
              <g key={i}>
                <circle cx={l.x+2} cy={l.y+2} r="4" fill={`url(#${uid}-glow)`} />
                <rect x={l.x} y={l.y} width="4" height="5.5" rx="1.5" fill={color} opacity="0.75" />
                <rect x={l.x+0.5} y={l.y-0.5} width="3" height="0.8" rx="0.3" fill={dark} opacity="0.5" />
                <line x1={l.x+2} y1={l.y-0.5} x2={l.x+2} y2={l.y-2} stroke={trunk} strokeWidth="0.5" />
                <path d={`M${l.x+0.8} ${l.y+2} L${l.x+3.2} ${l.y+2}`} stroke={dark} strokeWidth="0.3" opacity="0.2" />
                <circle cx={l.x+2} cy={l.y+2.5} r="1" fill={light} opacity="0.4" />
              </g>
            ))}
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-glow`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#fff3e0" stopOpacity="0.6" />
                <stop offset="60%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Trunk */}
            <path d="M22 46 Q21 40 21 32 L27 32 Q27 40 26 46" fill={trunk} />
            <path d="M23 42 L25 41.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* Branches — thin, arching */}
            <path d="M22 34 Q14 28 10 24" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M26 32 Q32 24 36 20" stroke={trunk} strokeWidth="1.3" fill="none" />
            <path d="M23 30 Q18 22 16 16" stroke={trunk} strokeWidth="1" fill="none" />
            <path d="M25 30 Q28 20 30 14" stroke={trunk} strokeWidth="0.8" fill="none" />
            <path d="M24 28 Q22 20 24 14" stroke={trunk} strokeWidth="0.7" fill="none" />
            {/* 6 Lanterns */}
            {[
              {x:8,y:22,w:4.5,h:6},{x:14,y:14,w:4,h:5.5},{x:22,y:12,w:3.5,h:5},
              {x:28,y:12,w:4,h:5.5},{x:34,y:18,w:4.5,h:6},{x:20,y:20,w:3,h:4}
            ].map((l,i) => (
              <g key={i}>
                <circle cx={l.x+l.w/2} cy={l.y+l.h/2} r={l.w+1} fill={`url(#${uid}-glow)`} />
                <rect x={l.x} y={l.y} width={l.w} height={l.h} rx={l.w*0.35} fill={color} opacity="0.8" />
                <rect x={l.x+0.5} y={l.y-0.5} width={l.w-1} height="1" rx="0.3" fill={dark} opacity="0.5" />
                <rect x={l.x+0.5} y={l.y+l.h-0.5} width={l.w-1} height="0.8" rx="0.3" fill={dark} opacity="0.4" />
                <line x1={l.x+l.w/2} y1={l.y-0.5} x2={l.x+l.w/2} y2={l.y-2.5} stroke={trunk} strokeWidth="0.5" />
                {/* Cross struts */}
                <path d={`M${l.x+0.3} ${l.y+l.h*0.35} L${l.x+l.w-0.3} ${l.y+l.h*0.35}`} stroke={dark} strokeWidth="0.3" opacity="0.2" />
                <path d={`M${l.x+0.3} ${l.y+l.h*0.65} L${l.x+l.w-0.3} ${l.y+l.h*0.65}`} stroke={dark} strokeWidth="0.3" opacity="0.2" />
                <ellipse cx={l.x+l.w/2} cy={l.y+l.h/2} rx={l.w*0.3} ry={l.h*0.25} fill={light} opacity="0.35" />
              </g>
            ))}
            {/* Roots */}
            <path d="M21 46 Q18 44.5 15 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M27 46 Q30 44.5 33 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )
      }

      case 'seafan': {
        // Sea fan coral — flat fan-shaped coral with branching/dendritic pattern
        const coral = color; // #ff7043
        if (s === 0) return (
          <g>
            <ellipse cx="24" cy="44" rx="4" ry="2" fill="#a1887f" opacity="0.4" />
            <rect x="23" y="40" width="2" height="6" rx="0.5" fill={coral} opacity="0.6" />
            <path d="M24 40 Q22 38 21 36" stroke={coral} strokeWidth="0.8" fill="none" opacity="0.5" />
            <path d="M24 40 Q26 38 27 36" stroke={coral} strokeWidth="0.8" fill="none" opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            <ellipse cx="24" cy="44" rx="5" ry="2" fill="#a1887f" opacity="0.4" />
            <rect x="23" y="36" width="2" height="10" rx="0.5" fill={coral} />
            <path d="M24 36 Q20 32 16 28" stroke={coral} strokeWidth="1.2" fill="none" />
            <path d="M24 36 Q28 32 32 28" stroke={coral} strokeWidth="1.2" fill="none" />
            <path d="M20 32 Q18 30 16 32" stroke={coral} strokeWidth="0.7" fill="none" opacity="0.7" />
            <path d="M28 32 Q30 30 32 32" stroke={coral} strokeWidth="0.7" fill="none" opacity="0.7" />
            <path d="M24 34 Q22 30 20 26" stroke={light} strokeWidth="0.6" fill="none" opacity="0.5" />
            <path d="M24 34 Q26 30 28 26" stroke={light} strokeWidth="0.6" fill="none" opacity="0.5" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-fan`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={coral} />
              </linearGradient>
            </defs>
            <ellipse cx="24" cy="44" rx="6" ry="2.5" fill="#a1887f" opacity="0.4" />
            <rect x="22.5" y="34" width="3" height="12" rx="1" fill={dark} />
            {/* Fan outline */}
            <path d="M24 34 Q16 28 10 18 Q12 16 14 18 Q16 14 18 16 Q20 12 22 14 Q24 10 26 14 Q28 12 30 16 Q32 14 34 18 Q36 16 38 18 Q32 28 24 34 Z" fill={`url(#${uid}-fan)`} opacity="0.8" />
            {/* Branching veins */}
            <path d="M24 34 L24 14" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.3" />
            <path d="M24 30 L18 20" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.25" />
            <path d="M24 30 L30 20" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.25" />
            <path d="M24 26 L14 18" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M24 26 L34 18" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M20 24 L16 20" stroke={light} strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d="M28 24 L32 20" stroke={light} strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d="M18 22 L12 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M30 22 L36 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-fan`} x1="0.2" y1="0" x2="0.8" y2="1">
                <stop offset="0%" stopColor={light} />
                <stop offset="50%" stopColor={coral} />
                <stop offset="100%" stopColor={dark} />
              </linearGradient>
              <radialGradient id={`${uid}-glow`} cx="50%" cy="40%">
                <stop offset="0%" stopColor={light} stopOpacity="0.15" />
                <stop offset="100%" stopColor={coral} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Rock base */}
            <ellipse cx="24" cy="45" rx="7" ry="2.5" fill="#8d6e63" opacity="0.5" />
            <path d="M20 46 Q22 43.5 24 44 Q26 43.5 28 46" fill="#a1887f" opacity="0.4" />
            {/* Central stalk */}
            <path d="M23 46 L23 32 L25 32 L25 46" fill={dark} />
            <path d="M23 40 L25 39.8" stroke={coral} strokeWidth="0.3" opacity="0.3" />
            {/* Main fan shape — wide, flat */}
            <path d="M24 32 Q14 26 6 14 Q8 10 10 12 Q12 8 14 10 Q16 7 18 9 Q20 6 22 8 Q24 5 26 8 Q28 6 30 9 Q32 7 34 10 Q36 8 38 12 Q40 10 42 14 Q34 26 24 32 Z" fill={`url(#${uid}-fan)`} opacity="0.85" />
            <path d="M24 32 Q14 26 6 14 Q8 10 10 12 Q12 8 14 10 Q16 7 18 9 Q20 6 22 8 Q24 5 26 8 Q28 6 30 9 Q32 7 34 10 Q36 8 38 12 Q40 10 42 14 Q34 26 24 32 Z" fill={`url(#${uid}-glow)`} />
            {/* Dense branching veins (dendritic pattern) */}
            <path d="M24 32 L24 8" stroke={dark} strokeWidth="0.7" fill="none" opacity="0.3" />
            <path d="M24 28 L16 16" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.25" />
            <path d="M24 28 L32 16" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.25" />
            <path d="M24 24 L12 12" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M24 24 L36 12" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M24 20 L10 14" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.18" />
            <path d="M24 20 L38 14" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.18" />
            {/* Secondary branches */}
            <path d="M20 24 L14 18" stroke={light} strokeWidth="0.35" fill="none" opacity="0.2" />
            <path d="M28 24 L34 18" stroke={light} strokeWidth="0.35" fill="none" opacity="0.2" />
            <path d="M18 20 L10 16" stroke={light} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M30 20 L38 16" stroke={light} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M16 18 L8 14" stroke={coral} strokeWidth="0.25" fill="none" opacity="0.15" />
            <path d="M32 18 L40 14" stroke={coral} strokeWidth="0.25" fill="none" opacity="0.15" />
            {/* Tertiary fine veins */}
            <path d="M14 20 L12 22" stroke={coral} strokeWidth="0.2" fill="none" opacity="0.12" />
            <path d="M34 20 L36 22" stroke={coral} strokeWidth="0.2" fill="none" opacity="0.12" />
            <path d="M16 16 L14 14" stroke={light} strokeWidth="0.2" fill="none" opacity="0.1" />
            <path d="M32 16 L34 14" stroke={light} strokeWidth="0.2" fill="none" opacity="0.1" />
            {/* Polyp dots along edges */}
            {[{x:10,y:13},{x:14,y:10},{x:18,y:9},{x:22,y:7},{x:26,y:7},{x:30,y:9},{x:34,y:10},{x:38,y:13},{x:8,y:15},{x:40,y:15}].map((p,i) => (
              <circle key={i} cx={p.x} cy={p.y} r="0.5" fill={light} opacity="0.3" />
            ))}
          </g>
        )
      }

      case 'clockwork': {
        // Mechanical/steampunk tree with gears
        const metal = color; // #78909c
        const copper = "#b87333";
        const bronze = "#cd7f32";
        if (s === 0) return (
          <g>
            <rect x="23" y="38" width="2" height="8" fill="#888" />
            <circle cx="24" cy="36" r="3" fill="none" stroke={metal} strokeWidth="1" />
            <circle cx="24" cy="36" r="1" fill={metal} />
            {/* Gear teeth */}
            {[0,60,120,180,240,300].map((a,i) => {
              const rad = (a * Math.PI) / 180;
              const x1 = 24 + 2.5 * Math.cos(rad);
              const y1 = 36 + 2.5 * Math.sin(rad);
              const x2 = 24 + 3.8 * Math.cos(rad);
              const y2 = 36 + 3.8 * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={metal} strokeWidth="1" />;
            })}
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="34" width="3" height="12" fill="#777" />
            <rect x="23" y="38" width="2" height="0.5" fill="#555" opacity="0.3" />
            {/* Main gear */}
            <circle cx="24" cy="30" r="5" fill="none" stroke={metal} strokeWidth="1.2" />
            <circle cx="24" cy="30" r="1.5" fill={copper} />
            {[0,45,90,135,180,225,270,315].map((a,i) => {
              const rad = (a * Math.PI) / 180;
              const x1 = 24 + 4.2 * Math.cos(rad);
              const y1 = 30 + 4.2 * Math.sin(rad);
              const x2 = 24 + 6 * Math.cos(rad);
              const y2 = 30 + 6 * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={metal} strokeWidth="1.2" strokeLinecap="round" />;
            })}
            {/* Small gear */}
            <circle cx="30" cy="26" r="2.5" fill="none" stroke={bronze} strokeWidth="0.8" />
            <circle cx="30" cy="26" r="0.8" fill={bronze} />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-pipe`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#666" />
                <stop offset="50%" stopColor="#999" />
                <stop offset="100%" stopColor="#666" />
              </linearGradient>
            </defs>
            {/* Pipe trunk */}
            <rect x="22" y="28" width="4" height="18" fill={`url(#${uid}-pipe)`} />
            <rect x="21" y="32" width="6" height="1.5" rx="0.5" fill="#888" />
            <rect x="21" y="40" width="6" height="1.5" rx="0.5" fill="#888" />
            {/* Large gear */}
            <circle cx="24" cy="22" r="7" fill="none" stroke={metal} strokeWidth="1.5" />
            <circle cx="24" cy="22" r="4" fill={metal} opacity="0.15" />
            <circle cx="24" cy="22" r="2" fill={copper} />
            {[0,40,80,120,160,200,240,280,320].map((a,i) => {
              const rad = (a * Math.PI) / 180;
              return <rect key={i} x={24 + 6 * Math.cos(rad) - 1} y={22 + 6 * Math.sin(rad) - 1} width="2" height="2"
                fill={metal} transform={`rotate(${a} ${24 + 6 * Math.cos(rad)} ${22 + 6 * Math.sin(rad)})`} opacity="0.7" />;
            })}
            {/* Medium gear */}
            <circle cx="14" cy="24" r="4" fill="none" stroke={bronze} strokeWidth="1" />
            <circle cx="14" cy="24" r="1.2" fill={bronze} />
            {/* Small gear */}
            <circle cx="33" cy="18" r="3" fill="none" stroke={copper} strokeWidth="0.8" />
            <circle cx="33" cy="18" r="0.8" fill={copper} />
            {/* Spokes */}
            <line x1="24" y1="22" x2="24" y2="15" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <line x1="24" y1="22" x2="18" y2="22" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <line x1="24" y1="22" x2="24" y2="29" stroke={dark} strokeWidth="0.4" opacity="0.3" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-pipe`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#555" />
                <stop offset="30%" stopColor="#999" />
                <stop offset="70%" stopColor="#888" />
                <stop offset="100%" stopColor="#555" />
              </linearGradient>
              <linearGradient id={`${uid}-cop`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={copper} />
                <stop offset="100%" stopColor={bronze} />
              </linearGradient>
            </defs>
            {/* Pipe trunk with rivets */}
            <rect x="21" y="24" width="6" height="22" fill={`url(#${uid}-pipe)`} />
            <rect x="20" y="28" width="8" height="2" rx="0.5" fill="#777" />
            <rect x="20" y="36" width="8" height="2" rx="0.5" fill="#777" />
            <rect x="20" y="43" width="8" height="2" rx="0.5" fill="#777" />
            <circle cx="21.5" cy="29" r="0.5" fill="#aaa" />
            <circle cx="26.5" cy="29" r="0.5" fill="#aaa" />
            <circle cx="21.5" cy="37" r="0.5" fill="#aaa" />
            <circle cx="26.5" cy="37" r="0.5" fill="#aaa" />
            {/* Large main gear */}
            <circle cx="24" cy="18" r="9" fill="none" stroke={metal} strokeWidth="1.8" />
            <circle cx="24" cy="18" r="6" fill={metal} opacity="0.1" />
            <circle cx="24" cy="18" r="3" fill={`url(#${uid}-cop)`} />
            <circle cx="24" cy="18" r="1" fill="#333" />
            {/* Teeth on large gear */}
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => {
              const rad = (a * Math.PI) / 180;
              const cx = 24 + 8 * Math.cos(rad);
              const cy = 18 + 8 * Math.sin(rad);
              return <rect key={i} x={cx-1.2} y={cy-1.2} width="2.4" height="2.4"
                fill={metal} transform={`rotate(${a} ${cx} ${cy})`} opacity="0.75" />;
            })}
            {/* Spokes of large gear */}
            {[0,60,120,180,240,300].map((a,i) => {
              const rad = (a * Math.PI) / 180;
              return <line key={i} x1={24 + 3 * Math.cos(rad)} y1={18 + 3 * Math.sin(rad)}
                x2={24 + 6 * Math.cos(rad)} y2={18 + 6 * Math.sin(rad)}
                stroke={dark} strokeWidth="0.6" opacity="0.3" />;
            })}
            {/* Medium gear — left */}
            <circle cx="12" cy="22" r="5" fill="none" stroke={bronze} strokeWidth="1.2" />
            <circle cx="12" cy="22" r="2" fill={bronze} opacity="0.4" />
            <circle cx="12" cy="22" r="0.8" fill="#333" />
            {[0,45,90,135,180,225,270,315].map((a,i) => {
              const rad = (a * Math.PI) / 180;
              const cx = 12 + 4.3 * Math.cos(rad);
              const cy = 22 + 4.3 * Math.sin(rad);
              return <rect key={i} x={cx-0.8} y={cy-0.8} width="1.6" height="1.6"
                fill={bronze} transform={`rotate(${a} ${cx} ${cy})`} opacity="0.6" />;
            })}
            {/* Small gear — right */}
            <circle cx="35" cy="14" r="4" fill="none" stroke={copper} strokeWidth="1" />
            <circle cx="35" cy="14" r="1.5" fill={copper} opacity="0.4" />
            <circle cx="35" cy="14" r="0.6" fill="#333" />
            {[0,60,120,180,240,300].map((a,i) => {
              const rad = (a * Math.PI) / 180;
              const cx = 35 + 3.3 * Math.cos(rad);
              const cy = 14 + 3.3 * Math.sin(rad);
              return <rect key={i} x={cx-0.7} y={cy-0.7} width="1.4" height="1.4"
                fill={copper} transform={`rotate(${a} ${cx} ${cy})`} opacity="0.6" />;
            })}
            {/* Tiny gear — top */}
            <circle cx="30" cy="8" r="2.5" fill="none" stroke={metal} strokeWidth="0.8" />
            <circle cx="30" cy="8" r="0.7" fill={metal} />
            {/* Connecting rods */}
            <line x1="17" y1="20" x2="15" y2="18" stroke="#666" strokeWidth="0.8" opacity="0.4" />
            <line x1="29" y1="14" x2="31" y2="12" stroke="#666" strokeWidth="0.6" opacity="0.3" />
            {/* Steam wisps */}
            <path d="M28 24 Q30 22 29 20" stroke="#ccc" strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M20 24 Q18 22 19 20" stroke="#ccc" strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Root pipes */}
            <path d="M21 46 Q18 44 15 46" stroke="#777" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M27 46 Q30 44 33 46" stroke="#777" strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )
      }

      case 'carnivore': {
        // Giant pitcher plant (Nepenthes) — tall tubular pitcher traps
        const pitcher = color; // #b71c1c
        const lip = lighten(color, 50);
        const liquid = "#4a148c";
        if (s === 0) return (
          <g>
            <path d="M24 46 Q24 42 24 38" stroke="#2e7d32" strokeWidth="1.5" fill="none" />
            <path d="M22 38 Q22 34 23 32 L25 32 Q26 34 26 38 Z" fill={pitcher} opacity="0.6" />
            <ellipse cx="24" cy="32" rx="2.5" ry="1" fill={lip} opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* Vine */}
            <path d="M24 46 Q22 40 22 36" stroke="#2e7d32" strokeWidth="1.8" fill="none" />
            <path d="M24 46 Q26 42 28 38" stroke="#2e7d32" strokeWidth="1.2" fill="none" />
            {/* Pitcher 1 */}
            <path d="M19 36 Q18 30 19 26 L25 26 Q26 30 25 36 Z" fill={pitcher} opacity="0.75" />
            <ellipse cx="22" cy="26" rx="4" ry="1.5" fill={lip} opacity="0.6" />
            <ellipse cx="22" cy="34" rx="2.5" ry="1" fill={liquid} opacity="0.3" />
            {/* Pitcher 2 — small */}
            <path d="M27 38 Q26.5 34 27 32 L31 32 Q31.5 34 31 38 Z" fill={pitcher} opacity="0.6" />
            <ellipse cx="29" cy="32" rx="2.5" ry="1" fill={lip} opacity="0.5" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-pit`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lip} />
                <stop offset="30%" stopColor={pitcher} />
                <stop offset="100%" stopColor={dark} />
              </linearGradient>
            </defs>
            {/* Vines */}
            <path d="M24 46 Q20 38 18 34" stroke="#2e7d32" strokeWidth="2" fill="none" />
            <path d="M24 46 Q28 40 30 36" stroke="#2e7d32" strokeWidth="1.5" fill="none" />
            <path d="M24 46 Q24 40 24 34" stroke="#2e7d32" strokeWidth="1.2" fill="none" />
            {/* Pitcher 1 — tall */}
            <path d="M14 34 Q13 26 14 18 L22 18 Q23 26 22 34 Z" fill={`url(#${uid}-pit)`} opacity="0.8" />
            <ellipse cx="18" cy="18" rx="5" ry="2" fill={lip} />
            <path d="M14 18 Q13 16 14 14 L22 14 Q23 16 22 18" fill={lip} opacity="0.4" />
            <ellipse cx="18" cy="30" rx="3" ry="1.5" fill={liquid} opacity="0.3" />
            {/* Pitcher 2 */}
            <path d="M26 36 Q25 30 26 22 L34 22 Q35 30 34 36 Z" fill={`url(#${uid}-pit)`} opacity="0.75" />
            <ellipse cx="30" cy="22" rx="5" ry="2" fill={lip} />
            <path d="M26 22 Q25 20 26 18 L34 18 Q35 20 34 22" fill={lip} opacity="0.35" />
            <ellipse cx="30" cy="32" rx="3" ry="1.5" fill={liquid} opacity="0.25" />
            {/* Small pitcher 3 */}
            <path d="M22 36 Q21.5 32 22 28 L26 28 Q26.5 32 26 36 Z" fill={pitcher} opacity="0.6" />
            <ellipse cx="24" cy="28" rx="2.5" ry="1" fill={lip} opacity="0.5" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-pit`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lip} />
                <stop offset="20%" stopColor={pitcher} />
                <stop offset="100%" stopColor={dark} />
              </linearGradient>
              <radialGradient id={`${uid}-liq`} cx="50%" cy="80%">
                <stop offset="0%" stopColor={liquid} stopOpacity="0.5" />
                <stop offset="100%" stopColor={liquid} stopOpacity="0.15" />
              </radialGradient>
            </defs>
            {/* Vines/stems */}
            <path d="M24 46 Q18 38 14 32" stroke="#2e7d32" strokeWidth="2.5" fill="none" />
            <path d="M24 46 Q30 40 34 34" stroke="#2e7d32" strokeWidth="2" fill="none" />
            <path d="M24 46 Q24 38 24 30" stroke="#2e7d32" strokeWidth="1.5" fill="none" />
            <path d="M24 46 Q20 42 16 40" stroke="#2e7d32" strokeWidth="1" fill="none" opacity="0.5" />
            {/* Tendril curls */}
            <path d="M14 32 Q12 30 13 28" stroke="#388e3c" strokeWidth="0.7" fill="none" opacity="0.5" />
            <path d="M34 34 Q36 32 35 30" stroke="#388e3c" strokeWidth="0.6" fill="none" opacity="0.4" />
            {/* Pitcher 1 — tallest, left */}
            <path d="M10 32 Q9 22 10 12 L20 12 Q21 22 20 32 Z" fill={`url(#${uid}-pit)`} opacity="0.85" />
            <ellipse cx="15" cy="12" rx="6" ry="2.5" fill={lip} />
            <path d="M10 12 Q9 9 11 7 L19 7 Q21 9 20 12" fill={lip} opacity="0.5" />
            {/* Flared lip ridges */}
            <path d="M11 8 Q15 6 19 8" stroke={light} strokeWidth="0.4" fill="none" opacity="0.3" />
            <ellipse cx="15" cy="26" rx="4" ry="2" fill={`url(#${uid}-liq)`} />
            {/* Veins on pitcher 1 */}
            <path d="M12 14 L12 28" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M15 14 L15 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M18 14 L18 28" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Pitcher 2 — right */}
            <path d="M28 34 Q27 26 28 16 L38 16 Q39 26 38 34 Z" fill={`url(#${uid}-pit)`} opacity="0.8" />
            <ellipse cx="33" cy="16" rx="6" ry="2.5" fill={lip} />
            <path d="M28 16 Q27 13 29 11 L37 11 Q39 13 38 16" fill={lip} opacity="0.45" />
            <ellipse cx="33" cy="28" rx="4" ry="2" fill={`url(#${uid}-liq)`} />
            <path d="M30 18 L30 30" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M33 18 L33 30" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M36 18 L36 30" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Pitcher 3 — center small */}
            <path d="M20 32 Q19.5 26 20 20 L28 20 Q28.5 26 28 32 Z" fill={pitcher} opacity="0.65" />
            <ellipse cx="24" cy="20" rx="4.5" ry="2" fill={lip} opacity="0.7" />
            <path d="M20 20 Q19.5 18 21 16 L27 16 Q28.5 18 28 20" fill={lip} opacity="0.35" />
            <ellipse cx="24" cy="28" rx="3" ry="1.5" fill={liquid} opacity="0.2" />
            {/* Pitcher 4 — tiny background */}
            <path d="M16 40 Q15.5 36 16 34 L20 34 Q20.5 36 20 40 Z" fill={pitcher} opacity="0.4" />
            <ellipse cx="18" cy="34" rx="2.5" ry="1" fill={lip} opacity="0.3" />
            {/* Drip drops from lips */}
            <circle cx="12" cy="14" r="0.4" fill={liquid} opacity="0.3" />
            <circle cx="35" cy="18" r="0.35" fill={liquid} opacity="0.25" />
            {/* Root tendrils */}
            <path d="M22 46 Q18 44 14 46" stroke="#2e7d32" strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M26 46 Q30 44 34 46" stroke="#2e7d32" strokeWidth="0.7" fill="none" opacity="0.25" />
          </g>
        )
      }

      case 'jellyfish': {
        // Bell-shaped translucent dome with trailing tentacles
        const bell = color; // #b39ddb
        if (s === 0) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-bell`} cx="50%" cy="30%">
                <stop offset="0%" stopColor={light} stopOpacity="0.7" />
                <stop offset="100%" stopColor={bell} stopOpacity="0.3" />
              </radialGradient>
            </defs>
            <path d="M20 38 Q20 34 24 32 Q28 34 28 38" fill={`url(#${uid}-bell)`} />
            <path d="M20 38 Q22 39 24 38 Q26 39 28 38" stroke={bell} strokeWidth="0.6" fill="none" />
            <line x1="22" y1="38" x2="21" y2="44" stroke={bell} strokeWidth="0.5" opacity="0.4" />
            <line x1="24" y1="38" x2="24" y2="45" stroke={bell} strokeWidth="0.5" opacity="0.4" />
            <line x1="26" y1="38" x2="27" y2="44" stroke={bell} strokeWidth="0.5" opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-bell`} cx="50%" cy="30%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
                <stop offset="50%" stopColor={light} stopOpacity="0.4" />
                <stop offset="100%" stopColor={bell} stopOpacity="0.25" />
              </radialGradient>
            </defs>
            <path d="M16 34 Q16 26 24 24 Q32 26 32 34" fill={`url(#${uid}-bell)`} />
            <path d="M16 34 Q20 36 24 34 Q28 36 32 34" stroke={bell} strokeWidth="0.7" fill="none" />
            <ellipse cx="24" cy="28" rx="3" ry="2" fill={light} opacity="0.15" />
            {/* Tentacles */}
            {[18,20,22,24,26,28,30].map((x,i) => (
              <path key={i} d={`M${x} 34 Q${x + (i%2?1:-1)} ${38+i%3} ${x + (i%2?-1:1)} ${44+i%2}`}
                stroke={bell} strokeWidth="0.5" fill="none" opacity={0.3 + i*0.03} />
            ))}
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-bell`} cx="45%" cy="30%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
                <stop offset="40%" stopColor={light} stopOpacity="0.35" />
                <stop offset="100%" stopColor={bell} stopOpacity="0.2" />
              </radialGradient>
            </defs>
            <path d="M12 32 Q12 20 24 16 Q36 20 36 32" fill={`url(#${uid}-bell)`} />
            <path d="M12 32 Q18 34 24 32 Q30 34 36 32" stroke={bell} strokeWidth="0.8" fill="none" />
            <ellipse cx="22" cy="22" rx="4" ry="3" fill={light} opacity="0.12" />
            {/* Internal structure */}
            <path d="M20 28 Q24 22 28 28" stroke={bell} strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* 8 tentacles */}
            {[14,16,18,20,24,28,30,32,34].map((x,i) => (
              <path key={i} d={`M${x} 32 Q${x+(i%2?1.5:-1.5)} ${36+i%4} ${x+(i%2?-1:2)} ${44+i%3}`}
                stroke={bell} strokeWidth={0.4 + (i%3)*0.1} fill="none" opacity={0.25 + i*0.02} />
            ))}
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-bell`} cx="45%" cy="25%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
                <stop offset="30%" stopColor={light} stopOpacity="0.4" />
                <stop offset="70%" stopColor={bell} stopOpacity="0.25" />
                <stop offset="100%" stopColor={dark} stopOpacity="0.15" />
              </radialGradient>
              <radialGradient id={`${uid}-inner`} cx="50%" cy="40%">
                <stop offset="0%" stopColor={light} stopOpacity="0.2" />
                <stop offset="100%" stopColor={bell} stopOpacity="0.05" />
              </radialGradient>
            </defs>
            {/* Bell dome */}
            <path d="M8 30 Q8 14 24 10 Q40 14 40 30" fill={`url(#${uid}-bell)`} />
            {/* Bell edge ruffle */}
            <path d="M8 30 Q12 32 16 30 Q20 32 24 30 Q28 32 32 30 Q36 32 40 30" stroke={bell} strokeWidth="0.8" fill="none" opacity="0.6" />
            {/* Internal radial pattern */}
            <ellipse cx="24" cy="20" rx="8" ry="6" fill={`url(#${uid}-inner)`} />
            <path d="M24 14 L24 28" stroke={bell} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M18 16 L30 26" stroke={bell} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M30 16 L18 26" stroke={bell} strokeWidth="0.25" fill="none" opacity="0.12" />
            <path d="M14 20 L34 20" stroke={bell} strokeWidth="0.2" fill="none" opacity="0.1" />
            {/* Oral arms — thicker center tentacles */}
            <path d="M22 30 Q20 36 18 44" stroke={bell} strokeWidth="0.8" fill="none" opacity="0.35" />
            <path d="M24 30 Q24 38 24 46" stroke={bell} strokeWidth="0.9" fill="none" opacity="0.4" />
            <path d="M26 30 Q28 36 30 44" stroke={bell} strokeWidth="0.8" fill="none" opacity="0.35" />
            {/* Trailing tentacles — thin, flowing */}
            {[10,12,14,16,20,28,32,34,36,38].map((x,i) => {
              const sway = (i % 2 ? 2 : -2);
              const len = 42 + (i % 4) * 1.5;
              return (
                <path key={i} d={`M${x} 30 Q${x+sway} ${34 + i%3} ${x-sway*0.5} ${len}`}
                  stroke={bell} strokeWidth={0.3 + (i%3)*0.1} fill="none" opacity={0.2 + (i%4)*0.04} />
              );
            })}
            {/* Bioluminescent dots */}
            <circle cx="20" cy="18" r="0.6" fill={light} opacity="0.3" />
            <circle cx="28" cy="18" r="0.5" fill={light} opacity="0.25" />
            <circle cx="24" cy="14" r="0.5" fill="#fff" opacity="0.3" />
            <circle cx="16" cy="22" r="0.4" fill={light} opacity="0.2" />
            <circle cx="32" cy="22" r="0.4" fill={light} opacity="0.2" />
            <circle cx="24" cy="22" r="0.7" fill={light} opacity="0.2" />
            {/* Edge highlights */}
            <path d="M8 30 Q8 14 24 10" stroke={light} strokeWidth="0.4" fill="none" opacity="0.15" />
          </g>
        )
      }

      case 'fossil': {
        // Petrified/fossil tree — stone with fossil imprints
        const stone = color; // #a1887f
        const crack = "#5d4037";
        const fossil_c = "#8d6e63";
        if (s === 0) return (
          <g>
            <rect x="22" y="38" width="4" height="8" rx="1" fill={stone} />
            <path d="M23 40 L25 42" stroke={crack} strokeWidth="0.5" opacity="0.3" />
            <circle cx="24" cy="36" r="2" fill={stone} opacity="0.6" />
            <path d="M23 35 Q24 36 25 35" stroke={crack} strokeWidth="0.4" fill="none" opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="21" y="30" width="6" height="16" rx="1" fill={stone} />
            <path d="M22 34 L26 36" stroke={crack} strokeWidth="0.5" opacity="0.3" />
            <path d="M23 40 L25 38" stroke={crack} strokeWidth="0.4" opacity="0.25" />
            {/* Stone canopy */}
            <ellipse cx="24" cy="28" rx="7" ry="5" fill={stone} opacity="0.7" />
            <ellipse cx="22" cy="26" rx="3" ry="2" fill={light} opacity="0.15" />
            {/* Fossil imprint — ammonite spiral */}
            <path d="M23 36 Q22 35 22.5 34 Q23 33 24 33.5 Q25 34 24.5 35 Q24 36 23 36" stroke={fossil_c} strokeWidth="0.5" fill="none" opacity="0.4" />
            {/* Cracks */}
            <path d="M21 32 L19 30" stroke={crack} strokeWidth="0.4" opacity="0.2" />
            <path d="M27 32 L29 30" stroke={crack} strokeWidth="0.3" opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-stone`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={stone} />
              </linearGradient>
            </defs>
            <path d="M21 46 Q20 38 20 30 L28 30 Q28 38 27 46" fill={stone} />
            <path d="M22 38 L26 36" stroke={crack} strokeWidth="0.5" opacity="0.3" />
            <path d="M21 42 L27 40" stroke={crack} strokeWidth="0.4" opacity="0.25" />
            {/* Stone canopy — angular, broken */}
            <path d="M10 22 L14 14 L20 10 L24 8 L28 10 L34 14 L38 22 L36 28 L30 30 L24 31 L18 30 L12 28 Z" fill={`url(#${uid}-stone)`} opacity="0.8" />
            <path d="M14 14 L18 18" stroke={crack} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M34 14 L30 18" stroke={crack} strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Ammonite fossil — larger */}
            <path d="M22 36 Q20 34 21 32 Q22 30 24 31 Q26 32 25 34 Q24 36 22 36" stroke={fossil_c} strokeWidth="0.6" fill="none" opacity="0.4" />
            <circle cx="23" cy="34" r="0.5" fill={fossil_c} opacity="0.3" />
            {/* Leaf fossil in canopy */}
            <path d="M18 18 L16 22 M18 18 L20 22 M18 18 L18 22" stroke={fossil_c} strokeWidth="0.4" fill="none" opacity="0.3" />
            {/* Stone texture */}
            <circle cx="14" cy="20" r="0.5" fill={dark} opacity="0.15" />
            <circle cx="30" cy="16" r="0.4" fill={dark} opacity="0.12" />
            <circle cx="24" cy="14" r="0.6" fill={dark} opacity="0.1" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-stone`} x1="0.2" y1="0" x2="0.8" y2="1">
                <stop offset="0%" stopColor={light} />
                <stop offset="50%" stopColor={stone} />
                <stop offset="100%" stopColor={dark} />
              </linearGradient>
            </defs>
            {/* Stone trunk — thick, cracked */}
            <path d="M20 46 Q19 38 19 30 L29 30 Q29 38 28 46" fill={stone} />
            <path d="M20 46 Q19 38 19 30 L29 30 Q29 38 28 46" fill={`url(#${uid}-stone)`} opacity="0.5" />
            {/* Major cracks in trunk */}
            <path d="M20 34 L22 36 L21 40 L22 44" stroke={crack} strokeWidth="0.6" fill="none" opacity="0.35" />
            <path d="M28 32 L26 35 L27 38 L26 42" stroke={crack} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M22 36 L26 38" stroke={crack} strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Mineralized canopy — angular stone branches */}
            <path d="M8 20 L12 12 L18 8 L24 6 L30 8 L36 12 L40 20 L38 26 L32 30 L24 31 L16 30 L10 26 Z" fill={`url(#${uid}-stone)`} opacity="0.85" />
            {/* Stone branch structures */}
            <path d="M19 30 Q14 26 10 24" stroke={stone} strokeWidth="2" fill="none" />
            <path d="M29 30 Q34 26 38 24" stroke={stone} strokeWidth="1.8" fill="none" />
            {/* Canopy cracks */}
            <path d="M18 10 L20 16 L18 22" stroke={crack} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M30 10 L28 16 L30 22" stroke={crack} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M14 16 L20 18 L26 16 L32 18" stroke={crack} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M12 22 L18 20 L24 22 L30 20 L36 22" stroke={crack} strokeWidth="0.35" fill="none" opacity="0.18" />
            {/* Ammonite fossil — prominent spiral in trunk */}
            <path d="M22 38 Q20 36 21 34 Q22 32 24 33 Q26 34 25 36 Q24 38 22 38" stroke={fossil_c} strokeWidth="0.7" fill="none" opacity="0.45" />
            <path d="M23 37 Q22 36 22.5 35 Q23 34.5 23.5 35" stroke={fossil_c} strokeWidth="0.4" fill="none" opacity="0.35" />
            <circle cx="23" cy="35.5" r="0.4" fill={fossil_c} opacity="0.3" />
            {/* Leaf fossil pressed into canopy */}
            <path d="M16 18 Q14 14 16 12" stroke={fossil_c} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M16 18 L14 16 M16 18 L15 14 M16 18 L16 14 M16 18 L17 14" stroke={fossil_c} strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* Trilobite fossil in canopy */}
            <ellipse cx="30" cy="16" rx="2" ry="1.2" fill="none" stroke={fossil_c} strokeWidth="0.4" opacity="0.3" />
            <line x1="30" y1="14.8" x2="30" y2="17.2" stroke={fossil_c} strokeWidth="0.3" opacity="0.25" />
            <line x1="28.5" y1="16" x2="31.5" y2="16" stroke={fossil_c} strokeWidth="0.3" opacity="0.25" />
            {/* Stone texture dots */}
            {[{x:12,y:14},{x:20,y:10},{x:28,y:10},{x:36,y:14},{x:10,y:22},{x:38,y:22},{x:16,y:24},{x:32,y:24},{x:24,y:8}].map((p,i) => (
              <circle key={i} cx={p.x} cy={p.y} r={0.3+i%3*0.15} fill={dark} opacity={0.1+i%3*0.05} />
            ))}
            {/* Lit edge */}
            <path d="M8 20 L12 12 L18 8 L24 6" stroke={light} strokeWidth="0.4" fill="none" opacity="0.15" />
            {/* Roots — stone */}
            <path d="M19 46 Q16 44 13 46" stroke={stone} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M29 46 Q32 44 35 46" stroke={stone} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )
      }


      // ============================================================
      // EPIC TREES (5) — animated, complex
      // ============================================================

      case 'inferno': {
        // Tree fully engulfed in fire
        const charred = "#1a1a1a";
        const flame1 = color; // #dd2c00
        const flame2 = "#ff6d00";
        const flame3 = "#ffab00";
        if (s === 0) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-flk { 0%,100% { opacity: 0.5; } 50% { opacity: 0.9; } }`}</style>
            </defs>
            <path d="M24 46 Q24 42 24 38" stroke={charred} strokeWidth="1.5" fill="none" />
            <path d="M24 38 Q22 34 24 30 Q26 34 24 38" fill={flame1} opacity="0.6"
              style={{animation: `fx-${uid}-flk 1.5s ease-in-out infinite`} as React.CSSProperties} />
            <path d="M23 36 Q24 32 25 36" fill={flame3} opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-flk { 0%,100% { opacity: 0.4; } 50% { opacity: 0.85; } }
                @keyframes fx-${uid}-rise { 0% { transform: translateY(0); opacity: 0.7; } 100% { transform: translateY(-4px); opacity: 0; } }`}</style>
            </defs>
            <path d="M24 46 Q24 40 24 32" stroke={charred} strokeWidth="2.5" fill="none" />
            <path d="M24 36 Q20 34 18 32" stroke={charred} strokeWidth="1.2" fill="none" />
            {/* Flames */}
            <path d="M18 32 Q16 26 18 22 Q20 26 22 28 Q24 22 26 28 Q28 26 30 22 Q32 26 30 32 Z" fill={flame1} opacity="0.7"
              style={{animation: `fx-${uid}-flk 1.2s ease-in-out infinite`} as React.CSSProperties} />
            <path d="M20 30 Q22 24 24 28 Q26 24 28 30" fill={flame2} opacity="0.5"
              style={{animation: `fx-${uid}-flk 1s ease-in-out 0.3s infinite`} as React.CSSProperties} />
            <path d="M22 28 Q24 22 26 28" fill={flame3} opacity="0.4" />
            {/* Ember */}
            <circle cx="20" cy="24" r="0.5" fill={flame3}
              style={{animation: `fx-${uid}-rise 2s linear infinite`} as React.CSSProperties} />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-flk { 0%,100% { opacity: 0.35; } 50% { opacity: 0.9; } }
                @keyframes fx-${uid}-flk2 { 0%,100% { opacity: 0.3; } 40% { opacity: 0.8; } }
                @keyframes fx-${uid}-rise { 0% { transform: translateY(0); opacity: 0.8; } 100% { transform: translateY(-6px); opacity: 0; } }`}</style>
              <radialGradient id={`${uid}-heat`} cx="50%" cy="60%">
                <stop offset="0%" stopColor={flame3} stopOpacity="0.2" />
                <stop offset="100%" stopColor={flame1} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Charred trunk */}
            <path d="M22 46 Q21 40 21 32 L27 32 Q27 40 26 46" fill={charred} />
            <path d="M22 36 Q16 32 12 30" stroke={charred} strokeWidth="1.8" fill="none" />
            <path d="M26 34 Q32 30 36 28" stroke={charred} strokeWidth="1.5" fill="none" />
            {/* Heat glow */}
            <circle cx="24" cy="24" r="14" fill={`url(#${uid}-heat)`} />
            {/* Flame layers */}
            <path d="M10 28 Q8 20 12 14 Q14 18 16 16 Q18 12 20 16 Q22 10 24 14 Q26 10 28 16 Q30 12 32 16 Q34 18 36 14 Q40 20 38 28 Q34 32 24 34 Q14 32 10 28 Z"
              fill={flame1} opacity="0.75" style={{animation: `fx-${uid}-flk 1.5s ease-in-out infinite`} as React.CSSProperties} />
            <path d="M14 26 Q12 18 16 14 Q18 18 20 14 Q22 10 24 14 Q26 10 28 14 Q30 18 32 14 Q36 18 34 26 Q30 30 24 30 Q18 30 14 26 Z"
              fill={flame2} opacity="0.6" style={{animation: `fx-${uid}-flk2 1.2s ease-in-out 0.2s infinite`} as React.CSSProperties} />
            <path d="M18 24 Q16 16 20 12 Q22 16 24 12 Q26 16 28 12 Q32 16 30 24 Q28 28 24 28 Q20 28 18 24 Z"
              fill={flame3} opacity="0.45" style={{animation: `fx-${uid}-flk 1s ease-in-out 0.5s infinite`} as React.CSSProperties} />
            {/* Embers */}
            {[{x:16,y:14,d:1.8},{x:28,y:12,d:2.2},{x:20,y:10,d:2.5},{x:32,y:16,d:1.5}].map((e,i) => (
              <circle key={i} cx={e.x} cy={e.y} r="0.5" fill={flame3}
                style={{animation: `fx-${uid}-rise ${e.d}s linear ${i*0.5}s infinite`} as React.CSSProperties} />
            ))}
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes fx-${uid}-flk { 0%,100% { opacity: 0.3; } 30% { opacity: 0.9; } 70% { opacity: 0.5; } }
                @keyframes fx-${uid}-flk2 { 0%,100% { opacity: 0.25; } 50% { opacity: 0.85; } }
                @keyframes fx-${uid}-flk3 { 0%,100% { opacity: 0.2; } 60% { opacity: 0.7; } }
                @keyframes fx-${uid}-rise { 0% { transform: translateY(0); opacity: 0.9; } 100% { transform: translateY(-8px); opacity: 0; } }
                @keyframes fx-${uid}-glow { 0%,100% { opacity: 0.15; } 50% { opacity: 0.3; } }
              `}</style>
              <radialGradient id={`${uid}-heat`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={flame3} stopOpacity="0.25" />
                <stop offset="50%" stopColor={flame1} stopOpacity="0.1" />
                <stop offset="100%" stopColor={flame1} stopOpacity="0" />
              </radialGradient>
              <filter id={`${uid}-blur`}>
                <feGaussianBlur stdDeviation="0.8" />
              </filter>
            </defs>
            {/* Charred trunk */}
            <path d="M21 46 Q20 38 20 30 L28 30 Q28 38 27 46" fill={charred} />
            <path d="M22 38 L26 37" stroke="#333" strokeWidth="0.5" opacity="0.3" />
            <path d="M21 42 L27 41" stroke="#333" strokeWidth="0.4" opacity="0.25" />
            {/* Charred branches */}
            <path d="M21 32 Q14 28 10 26" stroke={charred} strokeWidth="2" fill="none" />
            <path d="M27 30 Q34 26 38 24" stroke={charred} strokeWidth="1.8" fill="none" />
            <path d="M23 30 Q18 26 14 24" stroke={charred} strokeWidth="1" fill="none" opacity="0.5" />
            {/* Heat shimmer glow */}
            <ellipse cx="24" cy="20" rx="18" ry="16" fill={`url(#${uid}-heat)`}
              style={{animation: `fx-${uid}-glow 3s ease-in-out infinite`} as React.CSSProperties} />
            {/* Outer flame layer */}
            <path d="M6 24 Q4 16 8 10 Q10 14 12 10 Q14 6 16 10 Q18 4 20 8 Q22 2 24 6 Q26 2 28 8 Q30 4 32 10 Q34 6 36 10 Q38 14 40 10 Q44 16 42 24 Q40 30 34 32 Q28 34 24 34 Q20 34 14 32 Q8 30 6 24 Z"
              fill={flame1} opacity="0.7" style={{animation: `fx-${uid}-flk 2s ease-in-out infinite`} as React.CSSProperties} />
            {/* Mid flame layer */}
            <path d="M10 22 Q8 14 12 10 Q14 14 16 10 Q18 6 20 10 Q22 4 24 8 Q26 4 28 10 Q30 6 32 10 Q34 14 36 10 Q40 14 38 22 Q34 28 24 30 Q14 28 10 22 Z"
              fill={flame2} opacity="0.6" style={{animation: `fx-${uid}-flk2 1.6s ease-in-out 0.3s infinite`} as React.CSSProperties} />
            {/* Inner flame layer — hottest */}
            <path d="M16 20 Q14 12 18 8 Q20 12 22 8 Q24 4 26 8 Q28 12 30 8 Q34 12 32 20 Q28 26 24 26 Q20 26 16 20 Z"
              fill={flame3} opacity="0.5" style={{animation: `fx-${uid}-flk3 1.2s ease-in-out 0.6s infinite`} as React.CSSProperties} />
            {/* White-hot core */}
            <path d="M20 18 Q22 10 24 14 Q26 10 28 18 Q26 22 24 22 Q22 22 20 18 Z"
              fill="#fff" opacity="0.15" filter={`url(#${uid}-blur)`}
              style={{animation: `fx-${uid}-flk 1s ease-in-out infinite`} as React.CSSProperties} />
            {/* Fire tongues flicking upward */}
            <path d="M18 10 Q17 6 18 4" stroke={flame2} strokeWidth="0.6" fill="none" opacity="0.4"
              style={{animation: `fx-${uid}-flk2 1.4s ease-in-out 0.1s infinite`} as React.CSSProperties} />
            <path d="M30 10 Q31 6 30 4" stroke={flame2} strokeWidth="0.5" fill="none" opacity="0.35"
              style={{animation: `fx-${uid}-flk 1.6s ease-in-out 0.4s infinite`} as React.CSSProperties} />
            <path d="M24 6 Q24 2 24 0" stroke={flame3} strokeWidth="0.5" fill="none" opacity="0.3"
              style={{animation: `fx-${uid}-flk3 1.3s ease-in-out 0.2s infinite`} as React.CSSProperties} />
            {/* Rising embers */}
            {[{x:14,y:8,d:2},{x:20,y:4,d:2.5},{x:28,y:6,d:1.8},{x:34,y:10,d:2.2},{x:10,y:12,d:3},{x:38,y:14,d:2.8},{x:24,y:2,d:2.3},{x:16,y:14,d:1.6}].map((e,i) => (
              <circle key={i} cx={e.x} cy={e.y} r={0.4 + i%3*0.15} fill={i%2 ? flame3 : flame2}
                style={{animation: `fx-${uid}-rise ${e.d}s linear ${i*0.35}s infinite`} as React.CSSProperties} />
            ))}
            {/* Scorched roots */}
            <path d="M20 46 Q17 44 14 46" stroke={charred} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M28 46 Q31 44 34 46" stroke={charred} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )
      }

      case 'thunderstrike': {
        // Lightning-struck split tree with frozen lightning bolt
        const bark = "#4e342e";
        const scorch = "#1a1a1a";
        const bolt = color; // #ffd600
        const spark = "#fff9c4";
        if (s === 0) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-sp { 0%,80%,100% { opacity: 0; } 85% { opacity: 0.8; } }`}</style>
            </defs>
            <path d="M24 46 Q24 42 24 38" stroke={bark} strokeWidth="1.5" fill="none" />
            <path d="M23 38 L22 36 L24 34 L26 36 L25 38" stroke={bolt} strokeWidth="0.8" fill={bolt} opacity="0.5" />
            <circle cx="24" cy="33" r="0.5" fill={spark}
              style={{animation: `fx-${uid}-sp 2s linear infinite`} as React.CSSProperties} />
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-sp { 0%,70%,100% { opacity: 0; } 75%,80% { opacity: 0.9; } }
                @keyframes fx-${uid}-gl { 0%,100% { opacity: 0.3; } 50% { opacity: 0.6; } }`}</style>
            </defs>
            {/* Split trunk */}
            <path d="M22 46 Q20 40 19 34" stroke={bark} strokeWidth="2.5" fill="none" />
            <path d="M26 46 Q28 40 29 34" stroke={bark} strokeWidth="2.5" fill="none" />
            {/* Scorch mark */}
            <path d="M24 46 L24 34" stroke={scorch} strokeWidth="1" opacity="0.3" />
            {/* Lightning bolt in crack */}
            <path d="M24 34 L22 30 L25 28 L23 24" stroke={bolt} strokeWidth="1.2" fill="none" />
            <path d="M24 34 L22 30 L25 28 L23 24" stroke={spark} strokeWidth="0.5" fill="none" opacity="0.5"
              style={{animation: `fx-${uid}-gl 1.5s ease-in-out infinite`} as React.CSSProperties} />
            {/* Sparse singed canopy */}
            <path d="M16 28 Q14 24 16 20 Q18 22 20 20 Q22 18 24 20" fill={dark} opacity="0.4" />
            <path d="M24 20 Q26 18 28 20 Q30 22 32 20 Q34 24 32 28" fill={dark} opacity="0.35" />
            {/* Spark */}
            <circle cx="22" cy="26" r="0.5" fill={spark}
              style={{animation: `fx-${uid}-sp 1.8s linear infinite`} as React.CSSProperties} />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-sp { 0%,65%,100% { opacity: 0; } 70%,78% { opacity: 0.9; } 82% { opacity: 0; } }
                @keyframes fx-${uid}-gl { 0%,100% { opacity: 0.25; } 50% { opacity: 0.7; } }`}</style>
              <filter id={`${uid}-glow`}>
                <feGaussianBlur stdDeviation="1" />
              </filter>
            </defs>
            {/* Split trunk — dramatic V */}
            <path d="M21 46 Q18 38 14 30 L18 30 Q20 38 22 46 Z" fill={bark} />
            <path d="M27 46 Q30 38 34 30 L30 30 Q28 38 26 46 Z" fill={bark} />
            {/* Scorch in center */}
            <rect x="22" y="34" width="4" height="12" fill={scorch} opacity="0.4" />
            {/* Lightning bolt — frozen */}
            <path d="M24 30 L21 24 L26 22 L22 16 L27 14 L24 10" stroke={bolt} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
            <path d="M24 30 L21 24 L26 22 L22 16 L27 14 L24 10" stroke={spark} strokeWidth="0.7" fill="none" opacity="0.6"
              filter={`url(#${uid}-glow)`} style={{animation: `fx-${uid}-gl 2s ease-in-out infinite`} as React.CSSProperties} />
            {/* Singed canopy on both halves */}
            <ellipse cx="14" cy="24" rx="6" ry="5" fill={dark} opacity="0.35" />
            <ellipse cx="34" cy="24" rx="6" ry="5" fill={dark} opacity="0.3" />
            <path d="M10 22 Q12 18 14 20" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M38 22 Q36 18 34 20" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* Sparks */}
            {[{x:22,y:20},{x:26,y:18},{x:20,y:16},{x:28,y:14}].map((sp,i) => (
              <circle key={i} cx={sp.x} cy={sp.y} r="0.5" fill={spark}
                style={{animation: `fx-${uid}-sp 1.5s linear ${i*0.4}s infinite`} as React.CSSProperties} />
            ))}
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes fx-${uid}-sp { 0%,60%,100% { opacity: 0; } 65%,72% { opacity: 1; } 80% { opacity: 0; } }
                @keyframes fx-${uid}-gl { 0%,100% { opacity: 0.2; } 30% { opacity: 0.8; } 60% { opacity: 0.3; } }
                @keyframes fx-${uid}-arc { 0%,80%,100% { opacity: 0; } 85% { opacity: 0.7; } 90% { opacity: 0; } }
              `}</style>
              <filter id={`${uid}-glow`}>
                <feGaussianBlur stdDeviation="1.2" />
              </filter>
              <linearGradient id={`${uid}-bark`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={bark} />
                <stop offset="50%" stopColor={scorch} stopOpacity="0.5" />
                <stop offset="100%" stopColor={bark} />
              </linearGradient>
            </defs>
            {/* Dramatically split trunk — wide V */}
            <path d="M20 46 Q16 38 10 28 L14 26 Q18 36 21 46 Z" fill={bark} />
            <path d="M28 46 Q32 38 38 28 L34 26 Q30 36 27 46 Z" fill={bark} />
            {/* Inner scorch */}
            <path d="M21 46 L22 34 L26 34 L27 46" fill={scorch} opacity="0.5" />
            {/* Bark texture */}
            <path d="M12 30 L16 32" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M36 30 L32 32" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M14 34 L18 36" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <path d="M34 34 L30 36" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            {/* THE LIGHTNING BOLT — centerpiece, frozen in crack */}
            <path d="M24 32 L20 26 L26 22 L21 16 L27 12 L23 8 L28 6" stroke={bolt} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            {/* Bolt glow halo */}
            <path d="M24 32 L20 26 L26 22 L21 16 L27 12 L23 8 L28 6" stroke={bolt} strokeWidth="4" fill="none" opacity="0.15"
              filter={`url(#${uid}-glow)`} style={{animation: `fx-${uid}-gl 2.5s ease-in-out infinite`} as React.CSSProperties} />
            {/* Bolt hot-white core */}
            <path d="M24 32 L20 26 L26 22 L21 16 L27 12 L23 8 L28 6" stroke={spark} strokeWidth="0.8" fill="none" opacity="0.7"
              style={{animation: `fx-${uid}-gl 2.5s ease-in-out infinite`} as React.CSSProperties} />
            {/* Branch bolt forks */}
            <path d="M20 26 L16 24" stroke={bolt} strokeWidth="1" fill="none" opacity="0.5" />
            <path d="M26 22 L30 20" stroke={bolt} strokeWidth="1" fill="none" opacity="0.5" />
            <path d="M21 16 L17 14" stroke={bolt} strokeWidth="0.8" fill="none" opacity="0.4" />
            <path d="M27 12 L31 10" stroke={bolt} strokeWidth="0.8" fill="none" opacity="0.4" />
            {/* Singed canopy — split across both halves */}
            <path d="M6 22 Q6 14 12 12 Q14 14 10 18 Q8 20 6 22 Z" fill={dark} opacity="0.35" />
            <path d="M8 24 Q10 20 14 18 Q16 16 18 18 Q16 22 14 24 Q12 26 8 24 Z" fill={dark} opacity="0.3" />
            <path d="M42 22 Q42 14 36 12 Q34 14 38 18 Q40 20 42 22 Z" fill={dark} opacity="0.3" />
            <path d="M40 24 Q38 20 34 18 Q32 16 30 18 Q32 22 34 24 Q36 26 40 24 Z" fill={dark} opacity="0.28" />
            {/* Electrical sparks jumping around the bolt */}
            {[{x:18,y:24,d:0},{x:28,y:20,d:0.3},{x:19,y:14,d:0.6},{x:29,y:10,d:0.9},{x:25,y:6,d:1.2},{x:22,y:28,d:1.5}].map((sp,i) => (
              <circle key={i} cx={sp.x} cy={sp.y} r="0.6" fill={spark}
                style={{animation: `fx-${uid}-sp 2s linear ${sp.d}s infinite`} as React.CSSProperties} />
            ))}
            {/* Arcing electricity between halves */}
            <path d="M16 30 Q18 28 20 30" stroke={bolt} strokeWidth="0.5" fill="none"
              style={{animation: `fx-${uid}-arc 3s linear infinite`} as React.CSSProperties} />
            <path d="M28 30 Q30 28 32 30" stroke={bolt} strokeWidth="0.5" fill="none"
              style={{animation: `fx-${uid}-arc 3s linear 1s infinite`} as React.CSSProperties} />
            <path d="M14 26 Q16 24 18 26" stroke={bolt} strokeWidth="0.4" fill="none"
              style={{animation: `fx-${uid}-arc 3s linear 2s infinite`} as React.CSSProperties} />
            {/* Scorched ground */}
            <ellipse cx="24" cy="46" rx="8" ry="1.5" fill={scorch} opacity="0.15" />
            {/* Roots */}
            <path d="M20 46 Q16 44 12 46" stroke={bark} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M28 46 Q32 44 36 46" stroke={bark} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )
      }

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
              <ellipse cx="24" cy="34" rx="2.5" ry="3" fill={petal} opacity="0.6" />
              <path d="M24 31 Q23 32 24 33 Q25 32 24 31" fill={petal2} opacity="0.5" />
              <circle cx="24" cy="33" r="0.5" fill={stamen} opacity="0.4" />
            </g>
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }`}</style>
            </defs>
            <path d="M24 46 Q24 40 24 32" stroke={stem} strokeWidth="2" fill="none" />
            <path d="M24 38 Q22 36 20 38" stroke={stem} strokeWidth="0.8" fill="none" opacity="0.5" />
            <g style={{transformOrigin: '24px 26px', animation: `fx-${uid}-pulse 3s ease-in-out infinite`} as React.CSSProperties}>
              {/* Outer petals */}
              {[0,72,144,216,288].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 6 * Math.cos(rad);
                const py = 26 + 6 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="3" ry="5" fill={petal} opacity="0.6"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Inner petals */}
              {[36,108,180,252,324].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 3.5 * Math.cos(rad);
                const py = 26 + 3.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="2" ry="3.5" fill={petal2} opacity="0.5"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              <circle cx="24" cy="26" r="2" fill={stamen} opacity="0.6" />
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
            <path d="M24 46 Q23 40 23 32 L25 32 Q25 40 24 46" fill={stem} />
            <path d="M24 38 Q20 36 18 38" stroke={stem} strokeWidth="0.8" fill="none" opacity="0.4" />
            <path d="M24 36 Q28 34 30 36" stroke={stem} strokeWidth="0.7" fill="none" opacity="0.35" />
            <g style={{transformOrigin: '24px 22px', animation: `fx-${uid}-pulse 4s ease-in-out infinite`} as React.CSSProperties}>
              {/* Outer petals — 7 */}
              {[0,51,103,154,206,257,309].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 9 * Math.cos(rad);
                const py = 22 + 9 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="4" ry="7" fill={petal} opacity="0.55"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Middle petals */}
              {[25,77,128,180,231,283,334].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 5.5 * Math.cos(rad);
                const py = 22 + 5.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="3" ry="5" fill={petal2} opacity="0.5"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Inner petals */}
              {[0,60,120,180,240,300].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 3 * Math.cos(rad);
                const py = 22 + 3 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="2" ry="3.5" fill={petal3} opacity="0.45"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              <circle cx="24" cy="22" r="3" fill={`url(#${uid}-center)`} />
              {/* Stamen dots */}
              {[0,60,120,180,240,300].map((a,i) => {
                const rad = (a * Math.PI) / 180;
                return <circle key={i} cx={24 + 2 * Math.cos(rad)} cy={22 + 2 * Math.sin(rad)} r="0.4" fill="#fff" opacity="0.4" />;
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
            {/* Stem */}
            <path d="M23 46 Q22 40 22 30 L26 30 Q26 40 25 46" fill={stem} />
            <path d="M23 42 L25 41.5" stroke="#1b5e20" strokeWidth="0.4" opacity="0.2" />
            {/* Leaves on stem */}
            <path d="M22 38 Q18 36 16 38 Q18 37 22 38" fill={stem} opacity="0.5" />
            <path d="M26 36 Q30 34 32 36 Q30 35 26 36" fill={stem} opacity="0.45" />
            {/* Central glow */}
            <circle cx="24" cy="20" r="10" fill={`url(#${uid}-glow)`} />
            {/* THE BLOOM — concentric petal layers */}
            <g style={{transformOrigin: '24px 20px', animation: `fx-${uid}-pulse 5s ease-in-out infinite`} as React.CSSProperties}>
              {/* Outermost petals — 8, large, darkest pink */}
              {[0,45,90,135,180,225,270,315].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 12 * Math.cos(rad);
                const py = 20 + 12 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="5" ry="9" fill={dark} opacity="0.45"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Second layer — 8, offset */}
              {[22,67,112,157,202,247,292,337].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 9.5 * Math.cos(rad);
                const py = 20 + 9.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="4.5" ry="8" fill={petal} opacity="0.5"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Third layer — 7 */}
              {[0,51,103,154,206,257,309].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 6.5 * Math.cos(rad);
                const py = 20 + 6.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="3.5" ry="6" fill={petal2} opacity="0.5"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Inner layer — 6, lightest */}
              {[0,60,120,180,240,300].map((a,i) => {
                const rad = (a - 90) * Math.PI / 180;
                const px = 24 + 3.5 * Math.cos(rad);
                const py = 20 + 3.5 * Math.sin(rad);
                return <ellipse key={i} cx={px} cy={py} rx="2.5" ry="4.5" fill={petal3} opacity="0.5"
                  transform={`rotate(${a} ${px} ${py})`} />;
              })}
              {/* Central stamen glow */}
              <circle cx="24" cy="20" r="4" fill={`url(#${uid}-center)`} />
              {/* Stamen filaments */}
              {[0,45,90,135,180,225,270,315].map((a,i) => {
                const rad = (a * Math.PI) / 180;
                return <g key={i}>
                  <line x1={24 + 1.5 * Math.cos(rad)} y1={20 + 1.5 * Math.sin(rad)}
                    x2={24 + 3.2 * Math.cos(rad)} y2={20 + 3.2 * Math.sin(rad)}
                    stroke={stamen} strokeWidth="0.4" opacity="0.5" />
                  <circle cx={24 + 3.2 * Math.cos(rad)} cy={20 + 3.2 * Math.sin(rad)} r="0.5" fill="#fff" opacity="0.5" />
                </g>;
              })}
            </g>
            {/* Drifting petals falling away */}
            {[{x:8,y:32,dx:"-6px"},{x:38,y:34,dx:"5px"},{x:12,y:36,dx:"-4px"}].map((p,i) => (
              <ellipse key={i} cx={p.x} cy={p.y} rx="1.5" ry="2.5" fill={petal} opacity="0.4"
                transform={`rotate(${30+i*40} ${p.x} ${p.y})`}
                style={{'--dx': p.dx, animation: `fx-${uid}-drift ${4+i}s linear ${i*1.5}s infinite`} as React.CSSProperties} />
            ))}
          </g>
        )
      }

      case 'petrified': {
        // Ancient petrified tree turning to crystal — stone cracking to reveal crystal
        const stone_c = color; // #607d8b
        const crystal = "#00bcd4";
        const crystal_light = "#e0f7fa";
        const crack_c = "#37474f";
        if (s === 0) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-shim { 0%,100% { opacity: 0.2; } 50% { opacity: 0.6; } }`}</style>
            </defs>
            <rect x="22" y="38" width="4" height="8" rx="1" fill={stone_c} />
            <path d="M23 40 L25 42" stroke={crack_c} strokeWidth="0.5" opacity="0.3" />
            {/* Tiny crystal peek */}
            <rect x="24.5" y="40" width="1" height="1.5" fill={crystal} opacity="0.4"
              style={{animation: `fx-${uid}-shim 2s ease-in-out infinite`} as React.CSSProperties} />
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-shim { 0%,100% { opacity: 0.15; } 50% { opacity: 0.55; } }`}</style>
            </defs>
            <rect x="21" y="30" width="6" height="16" rx="1" fill={stone_c} />
            {/* Cracks */}
            <path d="M22 34 L24 36 L23 40" stroke={crack_c} strokeWidth="0.6" fill="none" opacity="0.4" />
            <path d="M26 32 L25 35" stroke={crack_c} strokeWidth="0.5" fill="none" opacity="0.3" />
            {/* Crystal showing through cracks */}
            <path d="M23.5 35 L24.5 34 L25 36 Z" fill={crystal} opacity="0.4"
              style={{animation: `fx-${uid}-shim 2.5s ease-in-out infinite`} as React.CSSProperties} />
            {/* Stone canopy */}
            <ellipse cx="24" cy="28" rx="7" ry="5" fill={stone_c} opacity="0.7" />
            <path d="M20 26 L22 28" stroke={crack_c} strokeWidth="0.4" fill="none" opacity="0.25" />
            {/* Crystal shard growing from top */}
            <path d="M26 24 L27 20 L28 24 Z" fill={crystal} opacity="0.35"
              style={{animation: `fx-${uid}-shim 2s ease-in-out 0.5s infinite`} as React.CSSProperties} />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <style>{`@keyframes fx-${uid}-shim { 0%,100% { opacity: 0.15; } 40% { opacity: 0.6; } 80% { opacity: 0.2; } }`}</style>
              <linearGradient id={`${uid}-crys`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={crystal_light} />
                <stop offset="100%" stopColor={crystal} />
              </linearGradient>
            </defs>
            {/* Stone trunk */}
            <path d="M20 46 Q19 38 19 30 L29 30 Q29 38 28 46" fill={stone_c} />
            {/* Major cracks revealing crystal */}
            <path d="M21 34 L23 36 L22 40 L23 44" stroke={crack_c} strokeWidth="0.7" fill="none" opacity="0.4" />
            <path d="M27 32 L25 35 L26 40" stroke={crack_c} strokeWidth="0.6" fill="none" opacity="0.35" />
            {/* Crystal veins in cracks */}
            <path d="M22 36 L23.5 37 L22.5 40" stroke={crystal} strokeWidth="0.8" fill="none" opacity="0.4"
              style={{animation: `fx-${uid}-shim 3s ease-in-out infinite`} as React.CSSProperties} />
            <path d="M26 34 L25.5 36" stroke={crystal} strokeWidth="0.6" fill="none" opacity="0.35"
              style={{animation: `fx-${uid}-shim 3s ease-in-out 0.5s infinite`} as React.CSSProperties} />
            {/* Stone canopy */}
            <path d="M10 20 L14 12 L20 8 L24 7 L28 8 L34 12 L38 20 L36 26 L30 30 L24 31 L18 30 L12 26 Z" fill={stone_c} opacity="0.8" />
            <path d="M16 14 L20 18 L18 24" stroke={crack_c} strokeWidth="0.5" fill="none" opacity="0.25" />
            <path d="M32 14 L28 18 L30 24" stroke={crack_c} strokeWidth="0.5" fill="none" opacity="0.25" />
            {/* Crystal shards growing from branches */}
            <path d="M30 10 L32 6 L34 10 Z" fill={`url(#${uid}-crys)`} opacity="0.45"
              style={{animation: `fx-${uid}-shim 2.5s ease-in-out infinite`} as React.CSSProperties} />
            <path d="M14 16 L12 12 L16 14 Z" fill={crystal} opacity="0.35"
              style={{animation: `fx-${uid}-shim 2.5s ease-in-out 0.8s infinite`} as React.CSSProperties} />
            <path d="M24 7 L23 3 L25 3 Z" fill={crystal_light} opacity="0.3"
              style={{animation: `fx-${uid}-shim 2s ease-in-out 1.2s infinite`} as React.CSSProperties} />
          </g>
        )
        return (
          <g>
            <defs>
              <style>{`
                @keyframes fx-${uid}-shim { 0%,100% { opacity: 0.1; } 30% { opacity: 0.7; } 60% { opacity: 0.15; } }
                @keyframes fx-${uid}-shim2 { 0%,100% { opacity: 0.15; } 50% { opacity: 0.6; } }
                @keyframes fx-${uid}-glow { 0%,100% { opacity: 0.1; } 50% { opacity: 0.25; } }
              `}</style>
              <linearGradient id={`${uid}-crys`} x1="0" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor={crystal_light} stopOpacity="0.8" />
                <stop offset="100%" stopColor={crystal} />
              </linearGradient>
              <linearGradient id={`${uid}-crys2`} x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
                <stop offset="100%" stopColor={crystal} />
              </linearGradient>
              <radialGradient id={`${uid}-cglow`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={crystal} stopOpacity="0.3" />
                <stop offset="100%" stopColor={crystal} stopOpacity="0" />
              </radialGradient>
              <filter id={`${uid}-blur`}>
                <feGaussianBlur stdDeviation="0.6" />
              </filter>
            </defs>
            {/* Stone trunk — half transformed */}
            <path d="M19 46 Q18 38 18 28 L30 28 Q30 38 29 46" fill={stone_c} />
            {/* Stone texture */}
            <path d="M20 34 L28 33" stroke={crack_c} strokeWidth="0.5" opacity="0.2" />
            <path d="M19 38 L29 37" stroke={crack_c} strokeWidth="0.4" opacity="0.18" />
            <path d="M20 42 L28 41" stroke={crack_c} strokeWidth="0.4" opacity="0.15" />
            {/* MAJOR CRACKS revealing crystal underneath */}
            <path d="M20 30 L22 34 L21 38 L22 42 L21 46" stroke={crack_c} strokeWidth="0.8" fill="none" opacity="0.5" />
            <path d="M28 30 L26 33 L27 37 L26 42 L27 46" stroke={crack_c} strokeWidth="0.7" fill="none" opacity="0.45" />
            <path d="M22 32 L26 34" stroke={crack_c} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M21 40 L27 38" stroke={crack_c} strokeWidth="0.4" fill="none" opacity="0.25" />
            {/* Crystal showing through trunk cracks */}
            <path d="M21.5 34 L23 32 L24 35 L22 38 Z" fill={`url(#${uid}-crys)`} opacity="0.5"
              style={{animation: `fx-${uid}-shim 3.5s ease-in-out infinite`} as React.CSSProperties} />
            <path d="M26 33 L27.5 35 L26.5 38 L25.5 36 Z" fill={crystal} opacity="0.4"
              style={{animation: `fx-${uid}-shim 3.5s ease-in-out 0.7s infinite`} as React.CSSProperties} />
            <path d="M22 40 L23 38 L24 41 L22.5 42 Z" fill={crystal} opacity="0.35"
              style={{animation: `fx-${uid}-shim2 3s ease-in-out 1.4s infinite`} as React.CSSProperties} />
            {/* Crystal glow from cracks */}
            <path d="M21.5 34 L23 32 L24 35 L22 38 Z" fill={crystal} opacity="0.15" filter={`url(#${uid}-blur)`}
              style={{animation: `fx-${uid}-glow 3.5s ease-in-out infinite`} as React.CSSProperties} />
            {/* Stone canopy — angular, broken */}
            <path d="M8 18 L12 10 L18 6 L24 4 L30 6 L36 10 L40 18 L38 24 L32 28 L24 30 L16 28 L10 24 Z" fill={stone_c} opacity="0.8" />
            {/* Canopy cracks */}
            <path d="M16 10 L20 16 L18 22" stroke={crack_c} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M32 10 L28 16 L30 22" stroke={crack_c} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M24 6 L24 16" stroke={crack_c} strokeWidth="0.4" fill="none" opacity="0.25" />
            <path d="M12 16 L20 18 L28 16 L36 18" stroke={crack_c} strokeWidth="0.35" fill="none" opacity="0.2" />
            {/* Crystal shards growing from branches — the transformation */}
            {/* Large shard — right */}
            <path d="M34 10 L38 4 L40 6 L36 12 Z" fill={`url(#${uid}-crys)`} opacity="0.55"
              style={{animation: `fx-${uid}-shim 3s ease-in-out infinite`} as React.CSSProperties} />
            {/* Medium shard — top */}
            <path d="M24 4 L22 -2 L24 -3 L26 -2 Z" fill={`url(#${uid}-crys2)`} opacity="0.5"
              style={{animation: `fx-${uid}-shim2 2.8s ease-in-out 0.4s infinite`} as React.CSSProperties} />
            {/* Left shard */}
            <path d="M14 12 L10 6 L8 8 L12 14 Z" fill={crystal} opacity="0.45"
              style={{animation: `fx-${uid}-shim 3.2s ease-in-out 0.8s infinite`} as React.CSSProperties} />
            {/* Small shards */}
            <path d="M30 8 L32 4 L33 6 Z" fill={crystal_light} opacity="0.4"
              style={{animation: `fx-${uid}-shim2 2.5s ease-in-out 1.2s infinite`} as React.CSSProperties} />
            <path d="M16 8 L14 4 L15 6 Z" fill={crystal} opacity="0.35"
              style={{animation: `fx-${uid}-shim 2.5s ease-in-out 1.6s infinite`} as React.CSSProperties} />
            <path d="M28 6 L29 2 L30 4 Z" fill={crystal_light} opacity="0.3"
              style={{animation: `fx-${uid}-shim2 2.2s ease-in-out 2s infinite`} as React.CSSProperties} />
            {/* Crystal glow halos on shards */}
            <circle cx="38" cy="5" r="3" fill={`url(#${uid}-cglow)`}
              style={{animation: `fx-${uid}-glow 3s ease-in-out infinite`} as React.CSSProperties} />
            <circle cx="24" cy="-1" r="3" fill={`url(#${uid}-cglow)`}
              style={{animation: `fx-${uid}-glow 3s ease-in-out 0.5s infinite`} as React.CSSProperties} />
            <circle cx="10" cy="7" r="2.5" fill={`url(#${uid}-cglow)`}
              style={{animation: `fx-${uid}-glow 3s ease-in-out 1s infinite`} as React.CSSProperties} />
            {/* Crystal shimmer highlights on canopy surface */}
            <circle cx="20" cy="12" r="0.5" fill={crystal_light} opacity="0.3"
              style={{animation: `fx-${uid}-shim 2s ease-in-out 0.3s infinite`} as React.CSSProperties} />
            <circle cx="28" cy="14" r="0.4" fill={crystal_light} opacity="0.25"
              style={{animation: `fx-${uid}-shim 2s ease-in-out 0.9s infinite`} as React.CSSProperties} />
            <circle cx="24" cy="10" r="0.5" fill={crystal_light} opacity="0.3"
              style={{animation: `fx-${uid}-shim2 2s ease-in-out 1.5s infinite`} as React.CSSProperties} />
            <circle cx="14" cy="18" r="0.4" fill={crystal_light} opacity="0.2"
              style={{animation: `fx-${uid}-shim 2s ease-in-out 1.8s infinite`} as React.CSSProperties} />
            <circle cx="34" cy="18" r="0.4" fill={crystal_light} opacity="0.2"
              style={{animation: `fx-${uid}-shim2 2s ease-in-out 2.1s infinite`} as React.CSSProperties} />
            {/* Stone roots — also cracking */}
            <path d="M18 46 Q14 44 10 46" stroke={stone_c} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M30 46 Q34 44 38 46" stroke={stone_c} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M12 46 L13 44" stroke={crystal} strokeWidth="0.3" fill="none" opacity="0.2" />
          </g>
        )
      }
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

  const renderGround = () => {
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

  return (
    <div style={{ width: size, height: Math.round(size * 1.3), display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <svg width="100%" height="100%" viewBox="0 6 48 42" preserveAspectRatio="xMidYMax meet" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={`${uid}-edge`} x="-5%" y="-5%" width="110%" height="110%">
            <feMorphology operator="dilate" radius="0.35" in="SourceAlpha" result="expanded"/>
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
        {!hideGround && renderGround()}
        {hideGround && dirtSeed > 0 && (() => {
          const dt = dirtDepth
          const rx = 6 + dt * 10
          const ry = 1.8 + dt * 3
          return (
            <ellipse cx={24} cy={46} rx={rx} ry={ry} fill="#000" opacity={dirtDark ? 0.22 : 0.14} />
          )
        })()}
        <g style={{
          transformOrigin: '24px 46px',
          '--sway-deg': `${swayDeg}deg`,
          animation: `plantSway ${swayDuration}s ease-in-out ${swayDelay}s infinite`,
        } as React.CSSProperties} filter={s >= 2 ? `url(#${uid}-3d)` : `url(#${uid}-edge)`}>
          <g filter={`url(#${uid}-edge)`}>
            {renderShape()}
          </g>
        </g>
      </svg>
    </div>
  )
})
