"use client"
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

export function PlantIcon({ type, size = 40, stage = 0, isSeed = false }: { type: string, size?: number, stage?: number, isSeed?: boolean }) {
  const typeInfo = TREE_TYPES[type] || TREE_TYPES.heartwood
  const color = typeInfo.color
  const shape = typeInfo.shape || 'oak'
  const dark = darken(color, 40)
  const light = lighten(color, 50)
  const uid = `plant-${type}-${size}-${stage}`

  const swayHash = (type.charCodeAt(0) + (type.charCodeAt(1) || 0)) % 10
  const swayDuration = 6 + (swayHash % 4)
  const swayDelay = -(swayHash * 0.7)

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
          animation: `plantSway ${swayDuration}s ease-in-out ${swayDelay}s infinite`,
        }}>
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
      // ── Navel Orange: broad oak ──
      case 'oak':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 40 L24.5 40" stroke={dark} strokeWidth="0.4" opacity="0.3" />
            <path d="M24 37 Q20 33 18 30 Q22 32 24 35" fill={color} opacity="0.6" />
            <path d="M24 35 Q28 31 30 29 Q26 31 24 34" fill={dark} opacity="0.5" />
            <circle cx="24" cy="30" r="2" fill={color} opacity="0.5" />
            <circle cx="23" cy="30" r="0.8" fill={light} opacity="0.25" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23.2 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 34 Q18 30 15 27" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="22" rx="8" ry="7" fill={color} opacity="0.7" />
            <ellipse cx="22" cy="20" rx="4" ry="3" fill={light} opacity="0.2" />
            <ellipse cx="26" cy="24" rx="3" ry="2.5" fill={dark} opacity="0.12" />
            <circle cx="20" cy="22" r="1.2" fill={light} opacity="0.15" />
            <circle cx="27" cy="19" r="1" fill={light} opacity="0.12" />
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
            {/* roots */}
            <path d="M21 46 Q19 45 17 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M27 46 Q29 45 31 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M21 46 Q20 38 20 32 L28 32 Q28 38 27 46 Z" fill={trunk} />
            <path d="M23.5 46 Q23 38 23 32 L25 32 L25 46 Z" fill={dark} opacity="0.15" />
            <path d="M21.5 38 L26.5 37.8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <path d="M22 42 L26 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M22.5 35 L25.5 34.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M21 34 Q14 30 10 28" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M27 32 Q34 28 37 26" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 34 Q18 32 14 31" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            <ellipse cx="24" cy="20" rx="16" ry="14" fill={color} />
            <ellipse cx="24" cy="28" rx="14" ry="5" fill={dark} opacity="0.1" />
            <ellipse cx="18" cy="14" rx="9" ry="7" fill={light} opacity="0.25" />
            <ellipse cx="32" cy="22" rx="6" ry="5" fill={dark} opacity="0.15" />
            <ellipse cx="14" cy="20" rx="4" ry="3.5" fill={color} opacity="0.3" />
            <ellipse cx="30" cy="12" rx="5" ry="3.5" fill={color} opacity="0.25" />
            <ellipse cx="20" cy="24" rx="3.5" ry="3" fill={color} opacity="0.2" />
            <circle cx="16" cy="24" r="2.5" fill={light} opacity="0.2" />
            <circle cx="30" cy="16" r="2" fill={light} opacity="0.15" />
            <circle cx="22" cy="12" r="1.5" fill={light} opacity="0.18" />
            <circle cx="34" cy="18" r="1.2" fill={light} opacity="0.12" />
            <circle cx="12" cy="16" r="1" fill={light} opacity="0.1" />
            {/* fruits */}
            <circle cx="18" cy="26" r="1.8" fill={color} opacity="0.5" />
            <circle cx="30" cy="24" r="1.5" fill={color} opacity="0.4" />
            {/* roots */}
            <path d="M20 46 Q17 44.5 14 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M28 46 Q31 44.5 34 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M22 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )

      // ── Blood Orange: angular maple ──
      case 'maple':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 40 L24.5 40" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 36 Q21 32 19 30 Q22 31 24 34" fill={color} opacity="0.6" />
            <path d="M24 34 Q27 30 29 28 Q26 30 24 33" fill={dark} opacity="0.5" />
            <path d="M24 32 L22 28 L24 30 L26 28 Z" fill={color} opacity="0.4" />
            <circle cx="23" cy="29" r="0.6" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M23.5 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 34 Q18 30 14 28" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 22 L20 26 L16 24 L20 28 L24 32 L28 28 L32 24 L28 26 Z" fill={color} opacity="0.7" />
            <path d="M24 22 L22 26 L24 28 L26 26 Z" fill={light} opacity="0.3" />
            <path d="M20 28 L16 24" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M28 28 L32 24" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <circle cx="22" cy="25" r="0.8" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 L23 30 L25 30 L25 46 Z" fill={trunk} />
            <path d="M23.5 38 L25 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.2 42 L25.2 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 34 Q17 30 12 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M25 32 Q31 28 36 27" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 12 L18 18 L12 17 L16 22 L12 26 L20 25 L24 30 L28 25 L36 26 L32 22 L36 17 L30 18 Z" fill={color} opacity="0.85" />
            <path d="M24 12 L22 16 L24 20 L26 16 Z" fill={light} opacity="0.25" />
            <path d="M24 20 L20 25" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M24 20 L28 25" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M18 18 L16 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M30 18 L32 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <circle cx="20" cy="22" r="1" fill={light} opacity="0.15" />
            <circle cx="28" cy="22" r="1" fill={light} opacity="0.12" />
            {/* roots */}
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M25 46 Q27 45 29 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M23 46 L23 30 L25 30 L25 46 Z" fill={trunk} />
            <path d="M23.5 38 L25.2 37.8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <path d="M23.2 42 L25.5 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 34 Q16 28 8 26" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M25 32 Q32 26 40 25" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q20 24 14 20" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 8 L16 16 L8 14 L14 22 L8 26 L18 26 L24 34 L30 26 L40 26 L34 22 L40 14 L32 16 Z" fill={color} />
            <path d="M24 8 L20 14 L24 20 L28 14 Z" fill={light} opacity="0.3" />
            {/* leaf veins */}
            <path d="M24 12 L18 18" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M24 12 L30 18" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M24 20 L18 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 20 L30 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M14 22 L8 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M34 22 L40 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <circle cx="18" cy="20" r="2" fill={dark} opacity="0.2" />
            <circle cx="30" cy="20" r="2" fill={dark} opacity="0.2" />
            <circle cx="14" cy="24" r="1.2" fill={dark} opacity="0.15" />
            <circle cx="34" cy="24" r="1.2" fill={dark} opacity="0.15" />
            <circle cx="20" cy="14" r="0.8" fill={light} opacity="0.18" />
            <circle cx="28" cy="14" r="0.8" fill={light} opacity="0.15" />
            {/* roots */}
            <path d="M23 46 Q20 44.5 17 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 Q28 44.5 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M24 46 Q22 45.5 20 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )

      // ── Clementine: multi-dome shrub ──
      case 'shrub':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="24" cy="33" rx="5" ry="4" fill={color} opacity="0.6" />
            <ellipse cx="23" cy="32" rx="2" ry="1.5" fill={light} opacity="0.3" />
            <ellipse cx="25" cy="35" rx="1.5" ry="1" fill={dark} opacity="0.12" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M24 36 Q20 34 18 32" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <ellipse cx="18" cy="30" rx="6" ry="5" fill={color} opacity="0.7" />
            <ellipse cx="28" cy="30" rx="6" ry="5" fill={color} opacity="0.6" />
            <ellipse cx="23" cy="28" rx="7" ry="6" fill={color} opacity="0.8" />
            <ellipse cx="21" cy="26" rx="3" ry="2" fill={light} opacity="0.25" />
            <ellipse cx="26" cy="32" rx="3" ry="2" fill={dark} opacity="0.1" />
            <circle cx="17" cy="29" r="1" fill={light} opacity="0.15" />
            <circle cx="28" cy="28" r="0.8" fill={light} opacity="0.12" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23.5 40 L24.8 39.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 38 Q18 36 14 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 38 Q30 36 34 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="14" cy="30" rx="8" ry="7" fill={color} opacity="0.8" />
            <ellipse cx="34" cy="30" rx="8" ry="7" fill={color} opacity="0.8" />
            <ellipse cx="24" cy="27" rx="10" ry="9" fill={color} />
            <ellipse cx="24" cy="32" rx="8" ry="3" fill={dark} opacity="0.1" />
            <ellipse cx="20" cy="24" rx="4" ry="3" fill={light} opacity="0.25" />
            <ellipse cx="30" cy="26" rx="3" ry="2.5" fill={color} opacity="0.3" />
            <ellipse cx="14" cy="28" rx="3" ry="2" fill={color} opacity="0.25" />
            <circle cx="18" cy="25" r="1.2" fill={light} opacity="0.15" />
            <circle cx="32" cy="28" r="1" fill={light} opacity="0.12" />
            {/* roots */}
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M25 46 Q27 45 29 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="3" strokeLinecap="round" />
            <path d="M23.2 42 L25 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23.5 39 L25.2 38.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M24 38 Q16 36 12 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 38 Q32 36 36 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="12" cy="30" rx="10" ry="8" fill={color} />
            <ellipse cx="36" cy="30" rx="10" ry="8" fill={color} />
            <ellipse cx="24" cy="26" rx="12" ry="10" fill={color} />
            <ellipse cx="24" cy="32" rx="10" ry="4" fill={dark} opacity="0.1" />
            <ellipse cx="12" cy="34" rx="8" ry="3" fill={dark} opacity="0.08" />
            <ellipse cx="36" cy="34" rx="8" ry="3" fill={dark} opacity="0.08" />
            <ellipse cx="20" cy="22" rx="5" ry="4" fill={light} opacity="0.3" />
            <ellipse cx="32" cy="24" rx="4" ry="3" fill={color} opacity="0.3" />
            <ellipse cx="16" cy="26" rx="3.5" ry="2.5" fill={color} opacity="0.25" />
            <ellipse cx="38" cy="28" rx="3" ry="2" fill={color} opacity="0.2" />
            <circle cx="12" cy="28" r="2" fill={light} opacity="0.2" />
            <circle cx="36" cy="28" r="2" fill={dark} opacity="0.15" />
            <circle cx="20" cy="28" r="1.2" fill={light} opacity="0.15" />
            <circle cx="28" cy="22" r="1" fill={light} opacity="0.12" />
            <circle cx="8" cy="30" r="0.8" fill={light} opacity="0.1" />
            {/* fruits */}
            <circle cx="14" cy="26" r="1.5" fill={color} opacity="0.4" />
            <circle cx="34" cy="26" r="1.3" fill={color} opacity="0.35" />
            {/* roots */}
            <path d="M23 46 Q20 44.5 17 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 Q28 44.5 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      // ── Daisy: round petals flower ──
      case 'daisy':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 36 Q21 33 19 31 Q22 32 24 35" fill="#6ab04c" opacity="0.6" />
            <path d="M24 35 Q27 32 29 30 Q26 32 24 34" fill="#5ea862" opacity="0.5" />
            <circle cx="24" cy="32" r="2" fill={color} opacity="0.5" />
            <circle cx="23.5" cy="31.5" r="0.6" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke="#5a8c3f" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 34 Q19 30 16 28" stroke="#5a8c3f" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M16 28 Q14 25 16 23 Q18 26 16 28" fill="#6ab04c" />
            <path d="M16 25.5 L16 23.5" stroke="#4a7c35" strokeWidth="0.4" opacity="0.3" />
            <circle cx="24" cy="24" r="4" fill={color} opacity="0.7" />
            <circle cx="21" cy="26" r="3.5" fill={color} opacity="0.5" />
            <circle cx="27" cy="26" r="3.5" fill={color} opacity="0.5" />
            <circle cx="24" cy="24" r="2" fill="#fbbf24" opacity="0.6" />
            <circle cx="23.5" cy="23.5" r="0.8" fill="#fde68a" opacity="0.3" />
            <circle cx="22" cy="25" r="0.5" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 28" stroke="#5a8c3f" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23.5 40 L24.8 39.8" stroke="#4a7c35" strokeWidth="0.4" opacity="0.2" />
            <path d="M24 36 Q18 32 14 30" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M14 30 Q12 26 14 24 Q16 28 14 30" fill="#6ab04c" />
            <path d="M14 27 L14 24.5" stroke="#4a7c35" strokeWidth="0.4" opacity="0.3" />
            <path d="M24 36 Q30 32 33 30" stroke="#5a8c3f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M33 30 Q35 27 33 25 Q31 28 33 30" fill="#6ab04c" />
            <path d="M33 27.5 L33 25.5" stroke="#4a7c35" strokeWidth="0.4" opacity="0.3" />
            <circle cx="24" cy="20" r="5" fill={color} />
            <circle cx="19" cy="22" r="4.5" fill={color} opacity="0.8" />
            <circle cx="29" cy="22" r="4.5" fill={color} opacity="0.8" />
            <circle cx="21" cy="16" r="4" fill={color} opacity="0.7" />
            <circle cx="27" cy="16" r="4" fill={color} opacity="0.7" />
            {/* petal highlights */}
            <circle cx="19" cy="20" r="1.2" fill={light} opacity="0.2" />
            <circle cx="29" cy="20" r="1" fill={light} opacity="0.15" />
            <circle cx="21" cy="14.5" r="0.8" fill={light} opacity="0.15" />
            <circle cx="24" cy="19" r="3" fill="#fbbf24" />
            <circle cx="23" cy="18" r="1.2" fill="#fde68a" opacity="0.5" />
            {/* pollen dots */}
            <circle cx="25" cy="18.5" r="0.5" fill="#fde68a" opacity="0.3" />
            <circle cx="23.5" cy="20" r="0.4" fill="#fde68a" opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 L24 28" stroke="#5a8c3f" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23.5 40 L25 39.8" stroke="#4a7c35" strokeWidth="0.5" opacity="0.2" />
            <path d="M23.5 36 L25 35.8" stroke="#4a7c35" strokeWidth="0.4" opacity="0.18" />
            <path d="M24 36 Q17 32 13 30" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M13 30 Q11 26 13 24 Q15 28 13 30" fill="#6ab04c" />
            <path d="M13 27 L13 24.5" stroke="#4a7c35" strokeWidth="0.4" opacity="0.3" />
            <path d="M24 38 Q31 34 34 32" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M34 32 Q36 28 34 26 Q32 30 34 32" fill="#6ab04c" />
            <path d="M34 29 L34 26.5" stroke="#4a7c35" strokeWidth="0.4" opacity="0.3" />
            {/* extra leaf */}
            <path d="M24 42 Q20 40 18 38 Q20 37 24 40" fill="#6ab04c" opacity="0.4" />
            <circle cx="24" cy="18" r="6" fill={color} />
            <circle cx="17" cy="20" r="5.5" fill={color} />
            <circle cx="31" cy="20" r="5.5" fill={color} />
            <circle cx="19" cy="13" r="5.5" fill={color} />
            <circle cx="29" cy="13" r="5.5" fill={color} />
            <circle cx="24" cy="10" r="5" fill={light} opacity="0.5" />
            {/* petal depth shadows */}
            <ellipse cx="17" cy="23" rx="4" ry="2" fill={dark} opacity="0.1" />
            <ellipse cx="31" cy="23" rx="4" ry="2" fill={dark} opacity="0.1" />
            {/* petal highlights */}
            <circle cx="17" cy="18" r="1.5" fill={light} opacity="0.2" />
            <circle cx="31" cy="18" r="1.2" fill={light} opacity="0.18" />
            <circle cx="19" cy="11" r="1" fill={light} opacity="0.15" />
            <circle cx="29" cy="11" r="1" fill={light} opacity="0.15" />
            <circle cx="24" cy="8" r="1.2" fill={light} opacity="0.2" />
            <circle cx="24" cy="17" r="3.5" fill="#fbbf24" />
            <circle cx="23" cy="16" r="1.5" fill="#fde68a" opacity="0.6" />
            {/* pollen dots */}
            <circle cx="25.5" cy="17" r="0.5" fill="#fde68a" opacity="0.35" />
            <circle cx="23" cy="18.5" r="0.4" fill="#fde68a" opacity="0.3" />
            <circle cx="24.5" cy="15.5" r="0.4" fill="#fde68a" opacity="0.25" />
          </g>
        )

      // ── Fern: alternating fronds ──
      case 'fern':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 40 24 34" stroke="#4a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q20 34 18 36 Q20 32 24 35" fill={color} />
            <path d="M24 34 Q28 32 30 34 Q28 30 24 33" fill={color} opacity="0.8" />
            <path d="M24 36 L22 34" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23 40 24 26" stroke="#4a8c3f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 38 Q17 34 12 36 Q17 31 24 36" fill={color} />
            <path d="M24 33 Q31 29 36 31 Q31 26 24 31" fill={color} />
            <path d="M24 28 Q19 24 14 26 Q19 21 24 26" fill={light} opacity="0.6" />
            {/* frond veins */}
            <path d="M24 37 L17 34" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d="M24 32 L31 29" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d="M24 27 L19 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <circle cx="16" cy="34" r="0.5" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 Q23 38 24 14" stroke="#4a8c3f" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 40 Q15 36 8 38 Q15 33 24 37" fill={color} />
            <path d="M24 35 Q33 31 40 33 Q33 28 24 33" fill={color} />
            <path d="M24 28 Q15 24 10 26 Q15 21 24 26" fill={color} />
            <path d="M24 22 Q31 18 36 20 Q31 15 24 20" fill={light} opacity="0.6" />
            <path d="M24 17 Q20 14 17 16 Q20 12 24 16" fill={light} opacity="0.4" />
            {/* frond veins */}
            <path d="M24 38 L15 36" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M24 34 L33 31" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M24 27 L15 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.18" />
            <path d="M24 21 L31 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* leaflet texture */}
            <circle cx="12" cy="36" r="0.6" fill={light} opacity="0.2" />
            <circle cx="36" cy="31" r="0.5" fill={light} opacity="0.18" />
            <circle cx="14" cy="24" r="0.5" fill={light} opacity="0.15" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 Q23 38 24 10" stroke="#4a8c3f" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 40 Q15 36 8 38 Q15 33 24 37" fill={color} />
            <path d="M24 35 Q33 31 40 33 Q33 28 24 33" fill={color} />
            <path d="M24 30 Q13 26 6 28 Q13 23 24 28" fill={color} />
            <path d="M24 25 Q35 21 42 23 Q35 18 24 23" fill={color} />
            <path d="M24 20 Q15 16 10 18 Q15 13 24 18" fill={light} opacity="0.7" />
            <path d="M24 16 Q31 12 36 14 Q31 9 24 14" fill={light} opacity="0.5" />
            <path d="M24 12 Q20 8 16 10 Q20 6 24 10" fill={light} opacity="0.35" />
            {/* frond veins */}
            <path d="M24 38 L15 36" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M24 34 L33 31" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M24 29 L13 26" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M24 24 L35 21" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.18" />
            <path d="M24 19 L15 16" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 15 L31 12" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* leaflet texture */}
            <circle cx="10" cy="37" r="0.7" fill={light} opacity="0.2" />
            <circle cx="38" cy="32" r="0.6" fill={light} opacity="0.18" />
            <circle cx="8" cy="27" r="0.6" fill={light} opacity="0.18" />
            <circle cx="40" cy="22" r="0.5" fill={light} opacity="0.15" />
            <circle cx="12" cy="17" r="0.5" fill={light} opacity="0.15" />
            <circle cx="34" cy="13" r="0.4" fill={light} opacity="0.12" />
            {/* unfurling tip */}
            <path d="M24 10 Q22 7 24 6" stroke="#4a8c3f" strokeWidth="0.8" fill="none" opacity="0.4" />
          </g>
        )

      // ── Tangerine: round tree with visible fruits ──
      case 'round':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 40 L24.5 40" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 37 Q21 34 19 32" fill="#4a8c3a" opacity="0.5" />
            <path d="M24 36 Q27 33 29 31" fill="#3a7a2a" opacity="0.5" />
            <circle cx="24" cy="32" r="3" fill="#4a8c3a" opacity="0.6" />
            <circle cx="23" cy="31" r="1" fill="#5a9c4a" opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 30" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M23.5 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <circle cx="24" cy="24" r="8" fill="#3a7a2a" opacity="0.8" />
            <circle cx="22" cy="22" r="4" fill="#4a8c3a" opacity="0.5" />
            <circle cx="26" cy="27" r="3" fill="#2a6a1e" opacity="0.15" />
            <circle cx="26" cy="20" r="1.5" fill={color} opacity="0.6" />
            <circle cx="21" cy="26" r="1.2" fill={color} opacity="0.4" />
            <circle cx="20" cy="20" r="0.8" fill="#5a9c4a" opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 Q23 40 23 34 L25 34 Q25 40 25 46 Z" fill={trunk} />
            <path d="M23.5 38 L25 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.2 42 L25.2 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 36 Q19 34 17 32" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M25 36 Q28 34 30 33" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="22" r="12" fill="#3a7a2a" />
            <circle cx="24" cy="29" rx="10" ry="4" fill="#2a6a1e" opacity="0.1" />
            <circle cx="20" cy="18" r="6" fill="#4a8c3a" opacity="0.5" />
            <circle cx="30" cy="24" r="4" fill="#2a6a1e" opacity="0.2" />
            <circle cx="16" cy="24" r="3" fill="#4a8c3a" opacity="0.2" />
            <circle cx="19" cy="26" r="2" fill={color} opacity="0.7" />
            <circle cx="28" cy="16" r="1.8" fill={color} opacity="0.6" />
            <circle cx="30" cy="24" r="1.5" fill={color} opacity="0.5" />
            <circle cx="18" cy="18" r="1" fill="#5a9c4a" opacity="0.2" />
            {/* roots */}
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M25 46 Q27 45 29 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M22 46 Q22 40 22 34 L26 34 Q26 40 26 46 Z" fill={trunk} />
            <path d="M22.5 38 L25.5 37.8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <path d="M23 42 L25.5 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 35 L25 34.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M22 36 Q18 34 16 32" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 36 Q30 34 32 33" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="22" r="14" fill="#3a7a2a" />
            <ellipse cx="24" cy="30" rx="12" ry="4" fill="#2a6a1e" opacity="0.12" />
            <circle cx="20" cy="16" r="8" fill="#4a8c3a" opacity="0.6" />
            <circle cx="30" cy="24" r="6" fill="#2a6a1e" opacity="0.4" />
            <circle cx="14" cy="22" r="4" fill="#4a8c3a" opacity="0.25" />
            <circle cx="28" cy="12" r="3.5" fill="#4a8c3a" opacity="0.2" />
            <circle cx="18" cy="26" r="2.5" fill={color} />
            <circle cx="28" cy="14" r="2.2" fill={color} />
            <circle cx="32" cy="22" r="2" fill={color} />
            <circle cx="14" cy="18" r="1.8" fill={color} opacity="0.8" />
            <circle cx="22" cy="12" r="1.5" fill={color} opacity="0.6" />
            <circle cx="24" cy="10" r="1.5" fill={light} opacity="0.3" />
            <circle cx="18" cy="14" r="1" fill="#5a9c4a" opacity="0.2" />
            <circle cx="32" cy="18" r="0.8" fill="#5a9c4a" opacity="0.15" />
            {/* roots */}
            <path d="M22 46 Q19 44.5 16 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M26 46 Q29 44.5 32 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M24 46 Q22 45.5 20 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )

      // ── Key Lime: layered conifer ──
      case 'conifer':
        if (s === 0) return (
          <g>
            <rect x="23" y="38" width="2" height="8" fill={trunk} />
            <path d="M24 28 L20 38 L28 38 Z" fill={color} opacity="0.7" />
            <path d="M24 28 L22 34 L26 34 Z" fill={light} opacity="0.25" />
            <path d="M24 28 L24 36" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="36" width="3" height="10" fill={trunk} />
            <path d="M23 40 L25 39.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M24 18 L18 30 L30 30 Z" fill={color} />
            <path d="M24 24 L16 36 L32 36 Z" fill={color} />
            <path d="M24 18 L21 24 L27 24 Z" fill={light} opacity="0.25" />
            <path d="M24 24 L24 34" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M20 28 L28 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <circle cx="22" cy="26" r="0.6" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M22.5 40 L25.5 39.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 43 L25 42.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <path d="M24 10 L16 22 L32 22 Z" fill={color} />
            <path d="M24 18 L13 30 L35 30 Z" fill={color} />
            <path d="M24 24 L11 36 L37 36 Z" fill={color} />
            <path d="M24 10 L20 18 L28 18 Z" fill={light} opacity="0.25" />
            {/* layer shadows */}
            <path d="M18 22 L30 22" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M15 30 L33 30" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.1" />
            {/* texture */}
            <path d="M24 12 L24 20" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <circle cx="20" cy="18" r="0.6" fill={light} opacity="0.15" />
            <circle cx="28" cy="26" r="0.5" fill={light} opacity="0.12" />
            <circle cx="16" cy="32" r="0.5" fill={light} opacity="0.1" />
          </g>
        )
        return (
          <g>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M22.5 40 L25.5 39.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 43 L25.5 42.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M24 6 L14 20 L34 20 Z" fill={color} />
            <path d="M24 14 L12 28 L36 28 Z" fill={color} />
            <path d="M24 22 L10 36 L38 36 Z" fill={color} />
            <path d="M24 6 L19 14 L29 14 Z" fill={light} opacity="0.3" />
            <path d="M24 14 L18 22 L30 22 Z" fill={light} opacity="0.2" />
            {/* layer shadows */}
            <path d="M16 20 L32 20" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.12" />
            <path d="M14 28 L34 28" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.1" />
            <path d="M12 36 L36 36" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.08" />
            {/* texture details */}
            <path d="M24 8 L24 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 16 L24 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <circle cx="18" cy="16" r="0.7" fill={light} opacity="0.15" />
            <circle cx="28" cy="14" r="0.6" fill={light} opacity="0.12" />
            <circle cx="16" cy="24" r="0.6" fill={light} opacity="0.12" />
            <circle cx="30" cy="24" r="0.5" fill={light} opacity="0.1" />
            <circle cx="14" cy="32" r="0.5" fill={light} opacity="0.1" />
            <circle cx="32" cy="32" r="0.5" fill={light} opacity="0.08" />
            {/* roots */}
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      // ── Lavender: tall spikes of florets ──
      case 'lavender':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 32" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 36 Q21 34 19 36 Q21 32 24 35" fill="#6ab04c" opacity="0.5" />
            <ellipse cx="24" cy="28" rx="2" ry="5" fill={color} opacity="0.6" />
            <circle cx="24" cy="25" r="0.8" fill={light} opacity="0.25" />
            <circle cx="24" cy="30" r="0.6" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 26" stroke="#5a8c3f" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 46 L20 32" stroke="#4a7c35" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M24 34 Q20 30 18 32" stroke="#5a8c3f" strokeWidth="0.8" fill="none" />
            <ellipse cx="24" cy="22" rx="2.5" ry="6" fill={color} opacity="0.8" />
            <ellipse cx="20" cy="28" rx="2" ry="5" fill={color} opacity="0.6" />
            <ellipse cx="24" cy="20" rx="1.5" ry="3" fill={light} opacity="0.3" />
            {/* floret dots */}
            <circle cx="24" cy="18" r="0.7" fill={light} opacity="0.25" />
            <circle cx="24" cy="24" r="0.6" fill={light} opacity="0.2" />
            <circle cx="20" cy="26" r="0.5" fill={light} opacity="0.2" />
            <circle cx="20" cy="30" r="0.5" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 24" stroke="#5a8c3f" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 46 L18 30" stroke="#4a7c35" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M30 46 L30 28" stroke="#4a7c35" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 34 Q20 30 17 32" stroke="#5a8c3f" strokeWidth="0.8" fill="none" />
            <ellipse cx="24" cy="20" rx="2.5" ry="7" fill={color} />
            <ellipse cx="18" cy="24" rx="2" ry="6" fill={color} opacity="0.7" />
            <ellipse cx="30" cy="22" rx="2" ry="6" fill={color} opacity="0.7" />
            <ellipse cx="24" cy="16" rx="1.5" ry="3" fill={light} opacity="0.3" />
            {/* floret dots */}
            <circle cx="24" cy="15" r="0.7" fill={light} opacity="0.25" />
            <circle cx="24" cy="22" r="0.6" fill={light} opacity="0.2" />
            <circle cx="18" cy="21" r="0.6" fill={light} opacity="0.2" />
            <circle cx="18" cy="27" r="0.5" fill={light} opacity="0.15" />
            <circle cx="30" cy="19" r="0.6" fill={light} opacity="0.2" />
            <circle cx="30" cy="25" r="0.5" fill={light} opacity="0.15" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 L24 24" stroke="#5a8c3f" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 46 L18 28" stroke="#4a7c35" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M30 46 L30 26" stroke="#4a7c35" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 34 Q20 30 16 32" stroke="#5a8c3f" strokeWidth="1" fill="none" />
            <path d="M24 34 Q28 30 32 32" stroke="#5a8c3f" strokeWidth="1" fill="none" />
            {/* extra leaf */}
            <path d="M24 38 Q21 36 19 38 Q21 35 24 37" fill="#6ab04c" opacity="0.35" />
            <ellipse cx="24" cy="18" rx="3" ry="8" fill={color} />
            <ellipse cx="18" cy="22" rx="2.5" ry="7" fill={color} opacity="0.8" />
            <ellipse cx="30" cy="20" rx="2.5" ry="7" fill={color} opacity="0.8" />
            <ellipse cx="24" cy="14" rx="2" ry="4" fill={light} opacity="0.4" />
            <ellipse cx="18" cy="18" rx="1.5" ry="3" fill={light} opacity="0.3" />
            <ellipse cx="30" cy="16" rx="1.5" ry="3" fill={light} opacity="0.3" />
            {/* floret dots */}
            <circle cx="24" cy="12" r="0.8" fill={light} opacity="0.3" />
            <circle cx="24" cy="16" r="0.6" fill={light} opacity="0.2" />
            <circle cx="24" cy="22" r="0.6" fill={light} opacity="0.18" />
            <circle cx="18" cy="17" r="0.6" fill={light} opacity="0.22" />
            <circle cx="18" cy="21" r="0.5" fill={light} opacity="0.18" />
            <circle cx="18" cy="25" r="0.5" fill={light} opacity="0.15" />
            <circle cx="30" cy="15" r="0.6" fill={light} opacity="0.22" />
            <circle cx="30" cy="19" r="0.5" fill={light} opacity="0.18" />
            <circle cx="30" cy="23" r="0.5" fill={light} opacity="0.15" />
            {/* depth shadow on spikes */}
            <ellipse cx="24" cy="24" rx="2" ry="1" fill={dark} opacity="0.1" />
            <ellipse cx="18" cy="27" rx="1.5" ry="0.8" fill={dark} opacity="0.08" />
            <ellipse cx="30" cy="25" rx="1.5" ry="0.8" fill={dark} opacity="0.08" />
          </g>
        )

      // ── Birch: slender white trunk ──
      case 'birch':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke="#d4cfc8" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 38 L24.5 37.5" stroke="#6b6560" strokeWidth="0.6" />
            <path d="M23.7 41 L24.3 40.8" stroke="#6b6560" strokeWidth="0.4" opacity="0.3" />
            <path d="M24 36 Q21 33 18 32" stroke="#8a8478" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <ellipse cx="17" cy="31" rx="4" ry="3" fill={color} opacity="0.6" />
            <ellipse cx="16" cy="30" rx="1.5" ry="1" fill={light} opacity="0.2" />
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
            <ellipse cx="12" cy="23" rx="5" ry="4" fill={color} opacity="0.7" />
            <path d="M24 24 Q28 21 32 20" stroke="#8a8478" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <ellipse cx="34" cy="18" rx="4" ry="3" fill={color} opacity="0.6" />
            <ellipse cx="11" cy="22" rx="2" ry="1.5" fill={light} opacity="0.2" />
            <ellipse cx="33" cy="17" rx="1.5" ry="1" fill={light} opacity="0.18" />
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
            <ellipse cx="11" cy="23" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="35" cy="15" rx="6" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="12" cy="10" rx="4" ry="3" fill={color} opacity="0.5" />
            <ellipse cx="24" cy="8" rx="5" ry="3" fill={light} opacity="0.4" />
            {/* leaf cluster details */}
            <ellipse cx="10" cy="22" rx="2" ry="1.5" fill={light} opacity="0.2" />
            <ellipse cx="34" cy="14" rx="2.5" ry="1.5" fill={light} opacity="0.18" />
            <circle cx="14" cy="10" r="1" fill={light} opacity="0.15" />
            {/* roots */}
            <path d="M22 46 Q20 45 18 46" stroke="#8a8478" strokeWidth="0.6" fill="none" opacity="0.2" />
            <path d="M25 46 Q27 45 29 46" stroke="#8a8478" strokeWidth="0.5" fill="none" opacity="0.18" />
          </g>
        )
        return (
          <g>
            <path d="M23 46 L23 8" stroke="#d4cfc8" strokeWidth="3" strokeLinecap="round" />
            <path d="M23.5 46 L23.5 8" stroke="#b8b0a4" strokeWidth="1" opacity="0.3" />
            <path d="M22 38 L24.5 37.5" stroke="#6b6560" strokeWidth="0.8" />
            <path d="M22 30 L24.5 29.5" stroke="#6b6560" strokeWidth="0.8" />
            <path d="M22 22 L24.5 21.5" stroke="#6b6560" strokeWidth="0.8" />
            <path d="M22 14 L24.5 13.5" stroke="#6b6560" strokeWidth="0.7" opacity="0.7" />
            <path d="M22.2 42 L24.2 41.8" stroke="#6b6560" strokeWidth="0.5" opacity="0.3" />
            <path d="M22.2 34 L24.5 33.8" stroke="#6b6560" strokeWidth="0.5" opacity="0.25" />
            <path d="M22.2 26 L24.5 25.8" stroke="#6b6560" strokeWidth="0.5" opacity="0.25" />
            <path d="M22.5 18 L24.2 17.8" stroke="#6b6560" strokeWidth="0.4" opacity="0.25" />
            <path d="M23 32 Q16 28 12 26" stroke="#8a8478" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 24 Q30 20 34 18" stroke="#8a8478" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 16 Q16 12 12 11" stroke="#8a8478" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M23 12 Q28 10 32 10" stroke="#8a8478" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <ellipse cx="10" cy="24" rx="6" ry="5" fill={color} opacity="0.8" />
            <ellipse cx="36" cy="16" rx="7" ry="5" fill={color} opacity="0.8" />
            <ellipse cx="10" cy="10" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="24" cy="6" rx="6" ry="4" fill={light} opacity="0.5" />
            <ellipse cx="34" cy="9" rx="4" ry="3" fill={color} opacity="0.4" />
            {/* leaf cluster highlights */}
            <ellipse cx="8" cy="22" rx="2.5" ry="2" fill={light} opacity="0.2" />
            <ellipse cx="34" cy="14" rx="3" ry="2" fill={light} opacity="0.2" />
            <ellipse cx="9" cy="9" rx="2" ry="1.5" fill={light} opacity="0.18" />
            <ellipse cx="23" cy="5" rx="2.5" ry="1.5" fill={light} opacity="0.2" />
            {/* depth shadows */}
            <ellipse cx="12" cy="27" rx="4" ry="1.5" fill={dark} opacity="0.08" />
            <ellipse cx="38" cy="19" rx="4" ry="1.5" fill={dark} opacity="0.08" />
            {/* roots */}
            <path d="M21 46 Q18 44.5 15 46" stroke="#8a8478" strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M25 46 Q28 44.5 31 46" stroke="#8a8478" strokeWidth="0.7" fill="none" opacity="0.2" />
            <path d="M23 46 Q21 45.5 19 46" stroke="#8a8478" strokeWidth="0.5" fill="none" opacity="0.18" />
          </g>
        )

      // ── Kumquat: round topiary ball ──
      case 'topiary':
        if (s === 0) return (
          <g>
            <rect x="23" y="38" width="2" height="8" rx="0.5" fill={trunk} />
            <circle cx="24" cy="34" r="5" fill={color} opacity="0.6" />
            <circle cx="22" cy="32" r="2" fill={light} opacity="0.2" />
            <circle cx="25" cy="36" r="1.5" fill={dark} opacity="0.1" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="36" width="3" height="10" rx="0.8" fill={trunk} />
            <path d="M23 40 L25 39.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <circle cx="24" cy="28" r="9" fill={color} opacity="0.8" />
            <circle cx="21" cy="24" r="4" fill={light} opacity="0.2" />
            <circle cx="28" cy="30" r="3" fill={dark} opacity="0.15" />
            <circle cx="20" cy="28" r="2" fill={color} opacity="0.25" />
            <circle cx="28" cy="24" r="1.8" fill={color} opacity="0.2" />
            <circle cx="24" cy="21" r="1" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <rect x="22" y="34" width="4" height="12" rx="1" fill={trunk} />
            <path d="M22.5 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 42 L25 41.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <circle cx="24" cy="24" r="12" fill={color} />
            <ellipse cx="24" cy="32" rx="10" ry="3" fill={dark} opacity="0.1" />
            <circle cx="20" cy="18" r="6" fill={light} opacity="0.2" />
            <circle cx="30" cy="28" r="4" fill={dark} opacity="0.15" />
            <circle cx="16" cy="24" r="3" fill={color} opacity="0.2" />
            <circle cx="30" cy="18" r="2.5" fill={color} opacity="0.18" />
            <circle cx="24" cy="24" r="1.2" fill={dark} opacity="0.12" />
            <circle cx="18" cy="28" r="1" fill={light} opacity="0.12" />
            {/* roots */}
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <rect x="22" y="34" width="4" height="12" rx="1" fill={trunk} />
            <path d="M22.5 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 42 L25.5 41.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 36 L25 35.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <circle cx="24" cy="22" r="14" fill={color} />
            <ellipse cx="24" cy="32" rx="12" ry="3.5" fill={dark} opacity="0.1" />
            <circle cx="19" cy="16" r="7" fill={light} opacity="0.25" />
            <circle cx="30" cy="26" r="5" fill={dark} opacity="0.2" />
            <circle cx="14" cy="22" r="3.5" fill={color} opacity="0.2" />
            <circle cx="32" cy="16" r="3" fill={color} opacity="0.18" />
            <circle cx="20" cy="26" r="2.5" fill={color} opacity="0.15" />
            <circle cx="24" cy="22" r="1.5" fill={dark} opacity="0.15" />
            <circle cx="16" cy="26" r="1.5" fill={dark} opacity="0.15" />
            <circle cx="32" cy="18" r="1.5" fill={dark} opacity="0.15" />
            <circle cx="20" cy="14" r="1.2" fill={light} opacity="0.15" />
            <circle cx="28" cy="12" r="1" fill={light} opacity="0.12" />
            <circle cx="12" cy="18" r="0.8" fill={light} opacity="0.1" />
            {/* trimmed texture lines */}
            <path d="M12 22 Q14 20 16 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M32 22 Q34 20 36 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            {/* roots */}
            <path d="M22 46 Q19 44.5 16 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M26 46 Q29 44.5 32 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      // ── Meyer Lemon: citrus tree ──
      case 'citrus':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 40 L24.5 40" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 37 Q21 34 19 32" fill="#5a9c4a" opacity="0.5" />
            <path d="M24 36 Q27 33 29 31" fill="#4a8c3a" opacity="0.5" />
            <ellipse cx="24" cy="32" rx="4" ry="3" fill="#4a8c3a" opacity="0.6" />
            <circle cx="23" cy="31" r="0.8" fill="#5a9c4a" opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23.5 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 34 Q18 30 15 28" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="22" rx="9" ry="8" fill="#4a8c3a" />
            <ellipse cx="21" cy="20" rx="4" ry="3" fill="#5a9c4a" opacity="0.4" />
            <ellipse cx="27" cy="26" rx="3" ry="2" fill="#3a7a2a" opacity="0.15" />
            <ellipse cx="26" cy="18" rx="2" ry="1.5" fill={color} opacity="0.5" transform="rotate(-10 26 18)" />
            <circle cx="20" cy="22" r="0.8" fill="#5a9c4a" opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 Q22 40 22 34 L26 34 Q26 40 25 46 Z" fill={trunk} />
            <path d="M23 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 42 L25 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 36 Q17 32 14 30" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M25 34 Q30 30 34 28" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="21" rx="13" ry="12" fill="#4a8c3a" />
            <ellipse cx="24" cy="28" rx="11" ry="3.5" fill="#3a7a2a" opacity="0.1" />
            <ellipse cx="19" cy="17" rx="6" ry="4" fill="#5a9c4a" opacity="0.4" />
            <ellipse cx="30" cy="24" rx="4" ry="3" fill="#3a7a2a" opacity="0.2" />
            <ellipse cx="18" cy="24" rx="2.2" ry="1.8" fill={color} transform="rotate(-15 18 24)" />
            <ellipse cx="30" cy="16" rx="2" ry="1.5" fill={color} transform="rotate(10 30 16)" />
            <ellipse cx="24" cy="12" rx="1.5" ry="1.2" fill={color} opacity="0.5" />
            <circle cx="20" cy="18" r="0.8" fill="#5a9c4a" opacity="0.2" />
            {/* roots */}
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M22 46 Q21 40 21 34 L27 34 Q27 40 26 46 Z" fill={trunk} />
            <path d="M22.5 38 L25.5 37.8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <path d="M23 42 L25.5 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 35 L25 34.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M22 36 Q16 32 12 30" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 34 Q32 30 36 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q20 34 16 33" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            <ellipse cx="24" cy="20" rx="15" ry="13" fill="#4a8c3a" />
            <ellipse cx="24" cy="28" rx="13" ry="4" fill="#3a7a2a" opacity="0.1" />
            <ellipse cx="18" cy="16" rx="7" ry="5" fill="#5a9c4a" opacity="0.5" />
            <ellipse cx="30" cy="24" rx="5" ry="4" fill="#3a7a2a" opacity="0.4" />
            <ellipse cx="14" cy="22" rx="4" ry="3" fill="#4a8c3a" opacity="0.2" />
            <ellipse cx="32" cy="14" rx="3.5" ry="2.5" fill="#4a8c3a" opacity="0.18" />
            {/* fruits */}
            <ellipse cx="16" cy="24" rx="2.5" ry="2" fill={color} transform="rotate(-20 16 24)" />
            <ellipse cx="30" cy="16" rx="2.5" ry="2" fill={color} transform="rotate(15 30 16)" />
            <ellipse cx="22" cy="12" rx="2" ry="1.5" fill={light} transform="rotate(-10 22 12)" />
            <ellipse cx="34" cy="22" rx="1.8" ry="1.5" fill={color} opacity="0.6" transform="rotate(10 34 22)" />
            <ellipse cx="14" cy="16" rx="1.5" ry="1.2" fill={color} opacity="0.5" />
            {/* leaf highlights */}
            <circle cx="18" cy="14" r="1.2" fill="#5a9c4a" opacity="0.2" />
            <circle cx="28" cy="12" r="1" fill="#5a9c4a" opacity="0.18" />
            <circle cx="12" cy="20" r="0.8" fill="#5a9c4a" opacity="0.15" />
            {/* roots */}
            <path d="M21 46 Q18 44.5 15 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M27 46 Q30 44.5 33 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M24 46 Q22 45.5 20 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )

      // ── Bergamot: weeping willow ──
      case 'weeping':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M23.5 40 L24.5 40" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 34 Q22 30 20 34 Q18 38 16 40" stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <path d="M24 34 Q26 30 28 34 Q30 38 32 40" stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke={trunk} strokeWidth="3" strokeLinecap="round" />
            <path d="M23.2 38 L25 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 28 Q20 24 16 28 Q14 34 12 40" stroke={color} fill="none" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M24 28 Q28 24 32 28 Q34 34 36 40" stroke={color} fill="none" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M24 26 Q22 24 20 26 Q18 32 16 36" stroke={light} fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            <path d="M24 26 Q26 24 28 26 Q30 32 32 36" stroke={dark} fill="none" strokeWidth="0.8" strokeLinecap="round" opacity="0.12" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 24" stroke={trunk} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M23 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25.5 33.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 30 L25 29.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M24 24 Q18 18 12 24 Q10 30 8 40" stroke={color} fill="none" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M24 24 Q30 18 36 24 Q38 30 40 40" stroke={color} fill="none" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M24 22 Q20 20 18 22 Q16 28 14 36" stroke={light} fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            <path d="M24 22 Q28 20 30 22 Q32 28 34 36" stroke={light} fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            {/* extra cascading strands */}
            <path d="M24 23 Q21 22 20 24 Q18 30 16 38" stroke={color} fill="none" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
            <path d="M24 23 Q27 22 28 24 Q30 30 32 38" stroke={color} fill="none" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
            {/* roots */}
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M25 46 Q27 45 29 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 L24 22" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            <path d="M22.5 38 L26 37.8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <path d="M23 34 L25.5 33.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 30 L25.5 29.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23.5 26 L25 25.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M24 20 Q18 14 10 22 Q8 30 6 40" stroke={color} fill="none" strokeWidth="4" strokeLinecap="round" />
            <path d="M24 20 Q30 14 38 22 Q40 30 42 40" stroke={color} fill="none" strokeWidth="4" strokeLinecap="round" />
            <path d="M24 18 Q20 16 16 20 Q14 28 12 36" stroke={light} fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <path d="M24 18 Q28 16 32 20 Q34 28 36 36" stroke={light} fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            {/* extra cascading strands */}
            <path d="M24 19 Q19 15 14 20 Q12 28 10 38" stroke={color} fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            <path d="M24 19 Q29 15 34 20 Q36 28 38 38" stroke={color} fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            <path d="M24 18 Q22 16 20 18 Q18 26 16 34" stroke={dark} fill="none" strokeWidth="0.8" strokeLinecap="round" opacity="0.12" />
            <path d="M24 18 Q26 16 28 18 Q30 26 32 34" stroke={dark} fill="none" strokeWidth="0.8" strokeLinecap="round" opacity="0.12" />
            <circle cx="6" cy="40" r="2.5" fill={light} opacity="0.5" />
            <circle cx="42" cy="40" r="2.5" fill={light} opacity="0.5" />
            <circle cx="10" cy="38" r="1.5" fill={light} opacity="0.3" />
            <circle cx="38" cy="38" r="1.5" fill={light} opacity="0.3" />
            {/* roots */}
            <path d="M23 46 Q20 44.5 17 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 Q28 44.5 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      // ── Cherry Blossom: sakura ──
      case 'sakura':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" />
            <path d="M23.5 40 L24.5 40" stroke="#4a3a2a" strokeWidth="0.4" opacity="0.25" />
            <path d="M24 36 Q20 32 18 30" stroke="#5c4a3a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <circle cx="18" cy="30" r="3" fill={color} opacity="0.5" />
            <circle cx="24" cy="32" r="2.5" fill={color} opacity="0.6" />
            <circle cx="24" cy="32" r="1" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke="#5c4a3a" strokeWidth="3" strokeLinecap="round" />
            <path d="M23.2 38 L25 37.8" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke="#4a3a2a" strokeWidth="0.4" opacity="0.25" />
            <path d="M24 32 Q16 26 12 24" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 28 Q30 24 34 22" stroke="#5c4a3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="12" cy="22" r="5" fill={color} opacity="0.6" />
            <circle cx="24" cy="20" r="5" fill={color} opacity="0.7" />
            <circle cx="34" cy="20" r="4" fill={color} opacity="0.5" />
            <circle cx="24" cy="18" r="2" fill={light} opacity="0.4" />
            <circle cx="11" cy="20" r="1.5" fill={light} opacity="0.2" />
            <circle cx="33" cy="18" r="1" fill={light} opacity="0.18" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 L23 28" stroke="#5c4a3a" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M22.2 38 L24.5 37.8" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.3" />
            <path d="M22.5 34 L24.5 33.8" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.25" />
            <path d="M23 30 Q14 24 8 22" stroke="#5c4a3a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q32 20 38 18" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23 24 Q18 18 14 16" stroke="#5c4a3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="8" cy="20" r="5" fill={color} opacity="0.6" />
            <circle cx="16" cy="14" r="6" fill={color} opacity="0.7" />
            <circle cx="24" cy="12" r="5" fill={color} opacity="0.8" />
            <circle cx="34" cy="16" r="5" fill={color} opacity="0.7" />
            <circle cx="38" cy="16" r="4" fill={color} opacity="0.5" />
            {/* blossom highlights */}
            <circle cx="24" cy="10" r="2" fill={light} opacity="0.4" />
            <circle cx="15" cy="12" r="1.5" fill={light} opacity="0.25" />
            <circle cx="33" cy="14" r="1.2" fill={light} opacity="0.2" />
            <circle cx="7" cy="18" r="1" fill={light} opacity="0.18" />
            {/* blossom center dots */}
            <circle cx="16" cy="14" r="0.8" fill="#fbbf24" opacity="0.3" />
            <circle cx="24" cy="12" r="0.7" fill="#fbbf24" opacity="0.25" />
            {/* falling petals */}
            <ellipse cx="20" cy="36" rx="1.2" ry="0.8" fill={color} opacity="0.3" transform="rotate(20 20 36)" />
            <ellipse cx="30" cy="40" rx="1" ry="0.6" fill={color} opacity="0.2" transform="rotate(-15 30 40)" />
          </g>
        )
        return (
          <g>
            <path d="M23 46 L23 28" stroke="#5c4a3a" strokeWidth="4" strokeLinecap="round" />
            <path d="M21.5 38 L24.5 37.8" stroke="#4a3a2a" strokeWidth="0.6" opacity="0.3" />
            <path d="M22 34 L24.5 33.8" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.25" />
            <path d="M22.5 30 L24 29.8" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.2" />
            <path d="M23 30 Q12 24 6 20" stroke="#5c4a3a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q34 20 42 18" stroke="#5c4a3a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 24 Q18 18 14 14" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23 22 Q28 16 32 12" stroke="#5c4a3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="6" cy="18" r="6" fill={color} opacity="0.7" />
            <circle cx="14" cy="12" r="7" fill={color} opacity="0.8" />
            <circle cx="24" cy="10" r="6" fill={color} />
            <circle cx="34" cy="14" r="6" fill={color} opacity="0.8" />
            <circle cx="42" cy="16" r="5" fill={color} opacity="0.7" />
            <circle cx="32" cy="10" r="4" fill={color} opacity="0.5" />
            {/* blossom highlights */}
            <circle cx="12" cy="10" r="3" fill={light} opacity="0.4" />
            <circle cx="24" cy="8" r="2.5" fill={light} opacity="0.5" />
            <circle cx="36" cy="12" r="2" fill={light} opacity="0.3" />
            <circle cx="5" cy="16" r="1.8" fill={light} opacity="0.25" />
            <circle cx="41" cy="14" r="1.5" fill={light} opacity="0.2" />
            {/* blossom center dots */}
            <circle cx="6" cy="18" r="0.8" fill="#fbbf24" opacity="0.3" />
            <circle cx="14" cy="12" r="0.8" fill="#fbbf24" opacity="0.3" />
            <circle cx="24" cy="10" r="0.7" fill="#fbbf24" opacity="0.25" />
            <circle cx="34" cy="14" r="0.7" fill="#fbbf24" opacity="0.25" />
            {/* depth shadows */}
            <ellipse cx="6" cy="22" rx="4" ry="1.5" fill={dark} opacity="0.08" />
            <ellipse cx="42" cy="20" rx="3.5" ry="1.2" fill={dark} opacity="0.08" />
            {/* falling petals */}
            <ellipse cx="18" cy="34" rx="1.5" ry="1" fill={color} opacity="0.4" transform="rotate(30 18 34)" />
            <ellipse cx="32" cy="38" rx="1.2" ry="0.8" fill={color} opacity="0.3" transform="rotate(-20 32 38)" />
            <ellipse cx="12" cy="40" rx="1" ry="0.7" fill={color} opacity="0.25" transform="rotate(10 12 40)" />
            {/* roots */}
            <path d="M22 46 Q19 44.5 16 46" stroke="#5c4a3a" strokeWidth="0.9" fill="none" opacity="0.25" />
            <path d="M24 46 Q27 44.5 30 46" stroke="#5c4a3a" strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      // ── Finger Lime: tall cypress column ──
      case 'cypress':
        if (s === 0) return (
          <g>
            <rect x="23" y="40" width="2" height="6" fill={trunk} />
            <path d="M24 30 Q26 34 26 40 L22 40 Q22 34 24 30 Z" fill={color} opacity="0.7" />
            <path d="M24 30 Q25 34 25 38 L24 40 L24 30 Z" fill={light} opacity="0.15" />
            <path d="M23 36 Q24 35 25 36" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="38" width="3" height="8" fill={trunk} />
            <path d="M23 42 L25 41.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M24 18 Q28 24 27 32 Q26 38 26 40 L22 40 Q22 38 21 32 Q20 24 24 18 Z" fill={color} />
            <path d="M24 18 Q26 22 25.5 30 L24 34 L24 18 Z" fill={light} opacity="0.15" />
            <path d="M22 32 Q24 31 26 32" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M22.5 26 Q24 25 25.5 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <circle cx="23" cy="24" r="0.5" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M22.5 40 L25.5 39.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 43 L25 42.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <path d="M24 8 Q30 16 29 24 Q28 32 28 38 L20 38 Q20 32 19 24 Q18 16 24 8 Z" fill={color} />
            <path d="M24 8 Q27 14 26.5 22 Q26 30 26 36 L24 38 L24 8 Z" fill={light} opacity="0.18" />
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
            {/* horizontal texture lines */}
            <path d="M20 32 Q24 31 28 32" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M20.5 26 Q24 25 27.5 26" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.1" />
            <path d="M21 20 Q24 19 27 20" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.1" />
            <path d="M22 14 Q24 13 26 14" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M23 8 Q24 7 25 8" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.08" />
            {/* highlight dots */}
            <circle cx="22" cy="16" r="0.7" fill={light} opacity="0.15" />
            <circle cx="23" cy="24" r="0.6" fill={light} opacity="0.12" />
            <circle cx="22.5" cy="32" r="0.5" fill={light} opacity="0.1" />
            <circle cx="23" cy="10" r="0.5" fill={light} opacity="0.12" />
            {/* roots */}
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      // ── Buddha's Hand: exotic twin trunks ──
      case 'exotic':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M23.5 42 L24.5 42" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 36 Q28 32 30 28 Q26 30 24 34" fill={color} opacity="0.6" />
            <path d="M24 36 Q20 32 18 28 Q22 30 24 34" fill={color} opacity="0.5" />
            <circle cx="24" cy="32" r="2" fill={light} opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 C24 40 28 38 28 30" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 46 C24 40 20 38 20 30" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M27 36 L28.5 35.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M20.5 36 L22 35.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M28 30 Q32 26 28 22 Q26 26 28 30" fill={color} opacity="0.7" />
            <path d="M20 30 Q16 26 20 22 Q22 26 20 30" fill={color} opacity="0.7" />
            <circle cx="24" cy="24" r="3" fill={light} opacity="0.4" />
            <circle cx="28" cy="25" r="0.8" fill={light} opacity="0.2" />
            <circle cx="20" cy="25" r="0.8" fill={light} opacity="0.18" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 C24 38 30 34 30 26" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M24 46 C24 38 18 34 18 26" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M29 34 L30.5 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M17.5 34 L19 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M30 26 Q36 20 32 14 Q28 18 30 26" fill={color} opacity="0.8" />
            <path d="M30 22 Q34 16 30 12 Q28 16 30 22" fill={light} opacity="0.4" />
            <path d="M18 26 Q12 20 16 14 Q20 18 18 26" fill={color} opacity="0.8" />
            <path d="M18 22 Q14 16 18 12 Q20 16 18 22" fill={light} opacity="0.4" />
            <circle cx="24" cy="18" r="4" fill={light} opacity="0.5" />
            {/* leaf veins */}
            <path d="M30 24 L32 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M18 24 L16 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <circle cx="32" cy="16" r="0.6" fill={light} opacity="0.18" />
            <circle cx="16" cy="16" r="0.6" fill={light} opacity="0.15" />
            {/* roots */}
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M25 46 Q27 45 29 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 C24 38 32 34 32 24" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M24 46 C24 38 16 34 16 24" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M30 34 L32.5 33.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M16.5 34 L19 33.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M31 28 L33 27.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M15.5 28 L18 27.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M32 24 Q40 18 34 10 Q26 16 32 24" fill={color} />
            <path d="M32 20 Q38 14 32 8 Q28 14 32 20" fill={light} opacity="0.5" />
            <path d="M16 24 Q8 18 14 10 Q22 16 16 24" fill={color} />
            <path d="M16 20 Q10 14 16 8 Q20 14 16 20" fill={light} opacity="0.5" />
            <circle cx="24" cy="16" r="5" fill={light} opacity="0.6" />
            {/* leaf veins */}
            <path d="M32 22 L36 16" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M16 22 L12 16" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M34 14 L34 10" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M14 14 L14 10" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            {/* highlight dots */}
            <circle cx="36" cy="14" r="0.8" fill={light} opacity="0.2" />
            <circle cx="12" cy="14" r="0.8" fill={light} opacity="0.18" />
            <circle cx="34" cy="10" r="0.6" fill={light} opacity="0.15" />
            <circle cx="14" cy="10" r="0.6" fill={light} opacity="0.15" />
            {/* roots */}
            <path d="M23 46 Q20 44.5 17 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 Q28 44.5 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M24 46 Q22 45.5 20 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )

      // ── Wisteria: cascading flowers ──
      case 'cascade':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 32" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M24 34 Q20 30 18 32" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            <ellipse cx="18" cy="34" rx="2" ry="4" fill={color} opacity="0.5" />
            <ellipse cx="24" cy="30" rx="2" ry="3" fill={color} opacity="0.6" />
            <circle cx="18" cy="33" r="0.6" fill={light} opacity="0.25" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 26" stroke={trunk} strokeWidth="3" strokeLinecap="round" />
            <path d="M23.2 38 L25 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 28 Q18 24 14 26" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 26 Q30 22 34 24" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="14" cy="28" rx="2.5" ry="6" fill={color} opacity="0.6" />
            <ellipse cx="24" cy="24" rx="2.5" ry="6" fill={color} opacity="0.7" />
            <ellipse cx="34" cy="26" rx="2.5" ry="6" fill={color} opacity="0.6" />
            <ellipse cx="24" cy="20" rx="1.5" ry="3" fill={light} opacity="0.3" />
            <circle cx="14" cy="26" r="0.6" fill={light} opacity="0.2" />
            <circle cx="34" cy="24" r="0.6" fill={light} opacity="0.18" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 22" stroke={trunk} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M23 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.2 34 L25.5 33.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23.5 28 L25 27.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M24 24 Q16 18 10 20" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 22 Q32 16 38 18" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="10" cy="24" rx="3" ry="7" fill={color} opacity="0.6" />
            <ellipse cx="18" cy="22" rx="3" ry="8" fill={color} opacity="0.7" />
            <ellipse cx="26" cy="20" rx="3" ry="8" fill={color} opacity="0.8" />
            <ellipse cx="34" cy="22" rx="3" ry="8" fill={color} opacity="0.7" />
            <ellipse cx="38" cy="22" rx="2.5" ry="6" fill={color} opacity="0.5" />
            <ellipse cx="26" cy="16" rx="1.5" ry="3" fill={light} opacity="0.3" />
            {/* flower cluster dots */}
            <circle cx="10" cy="22" r="0.7" fill={light} opacity="0.22" />
            <circle cx="18" cy="19" r="0.6" fill={light} opacity="0.2" />
            <circle cx="34" cy="20" r="0.6" fill={light} opacity="0.18" />
            <circle cx="26" cy="24" r="0.5" fill={light} opacity="0.15" />
            {/* roots */}
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M25 46 Q27 45 29 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 L24 20" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            <path d="M22.5 38 L26 37.8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <path d="M23 34 L25.5 33.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 28 L25.5 27.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M24 22 Q14 16 8 18" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 20 Q34 14 40 16" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 22 Q20 18 16 20" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
            <ellipse cx="8" cy="22" rx="3" ry="8" fill={color} opacity="0.7" />
            <ellipse cx="14" cy="24" rx="3" ry="10" fill={color} opacity="0.8" />
            <ellipse cx="20" cy="20" rx="3" ry="9" fill={color} />
            <ellipse cx="28" cy="18" rx="3" ry="9" fill={color} />
            <ellipse cx="34" cy="22" rx="3" ry="10" fill={color} opacity="0.8" />
            <ellipse cx="40" cy="20" rx="3" ry="8" fill={color} opacity="0.7" />
            <ellipse cx="20" cy="16" rx="1.5" ry="3" fill={light} opacity="0.4" />
            <ellipse cx="28" cy="14" rx="1.5" ry="3" fill={light} opacity="0.4" />
            {/* flower cluster dots */}
            <circle cx="8" cy="18" r="0.8" fill={light} opacity="0.25" />
            <circle cx="14" cy="20" r="0.7" fill={light} opacity="0.22" />
            <circle cx="20" cy="16" r="0.6" fill={light} opacity="0.2" />
            <circle cx="28" cy="14" r="0.6" fill={light} opacity="0.2" />
            <circle cx="34" cy="18" r="0.6" fill={light} opacity="0.18" />
            <circle cx="40" cy="16" r="0.5" fill={light} opacity="0.15" />
            {/* depth shadows on clusters */}
            <ellipse cx="14" cy="30" rx="2" ry="1" fill={dark} opacity="0.08" />
            <ellipse cx="34" cy="28" rx="2" ry="1" fill={dark} opacity="0.08" />
            <ellipse cx="20" cy="26" rx="2" ry="0.8" fill={dark} opacity="0.06" />
            <ellipse cx="28" cy="24" rx="2" ry="0.8" fill={dark} opacity="0.06" />
            {/* roots */}
            <path d="M23 46 Q20 44.5 17 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 Q28 44.5 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      // ── Starfruit: curved palm ──
      case 'palm':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q25 42 24.5 36" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 42 L24.8 41.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24.5 36 L18 32 Q22 36 24.5 36" fill={color} />
            <path d="M24.5 36 L30 32 Q26 36 24.5 36" fill={color} />
            <path d="M24.5 36 L24 28 Q26 32 24.5 36" fill={color} opacity="0.8" />
            <path d="M24.5 36 L21 32" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q26 40 25 30" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M24.5 40 L25.8 39.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M24.8 36 L26 35.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M25 30 L12 24 Q18 30 25 30" fill={color} />
            <path d="M25 30 L36 24 Q30 30 25 30" fill={color} />
            <path d="M25 30 L24 16 Q28 22 25 30" fill={color} opacity="0.8" />
            <path d="M25 30 L16 18 Q20 24 25 30" fill={color} opacity="0.7" />
            <path d="M25 30 L34 18 Q30 24 25 30" fill={light} opacity="0.35" />
            {/* frond veins */}
            <path d="M25 30 L18 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M25 30 L30 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 Q27 38 26 24" stroke={trunk} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M25 26 Q26 32 24 46" stroke={dark} strokeWidth="1" fill="none" opacity="0.2" />
            <path d="M22.5 34 Q26 33 27.5 34" stroke={dark} strokeWidth="0.7" fill="none" opacity="0.3" />
            <path d="M23 38 Q26 37 28 38" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M26 24 L8 18 Q16 26 26 24" fill={color} />
            <path d="M26 24 L40 18 Q32 26 26 24" fill={color} />
            <path d="M26 24 L26 6 Q32 14 26 24" fill={color} />
            <path d="M26 24 L14 10 Q20 18 26 24" fill={color} opacity="0.8" />
            <path d="M26 24 L36 10 Q32 18 26 24" fill={light} opacity="0.35" />
            {/* frond veins */}
            <path d="M26 24 L14 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M26 24 L36 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M26 24 L28 10" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M26 24 L18 12" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 Q28 38 26 20" stroke={trunk} strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M25 22 Q26 30 24 46" stroke={dark} strokeWidth="1.5" fill="none" opacity="0.2" />
            <path d="M22 36 Q26 35 28 36" stroke={dark} strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M22 30 Q26 29 28 30" stroke={dark} strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M22.5 42 Q26 41 28 42" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.2" />
            <path d="M26 20 L4 14 Q14 24 26 20" fill={color} />
            <path d="M26 20 L44 14 Q34 24 26 20" fill={color} />
            <path d="M26 20 L26 2 Q34 12 26 20" fill={color} />
            <path d="M26 20 L10 6 Q18 14 26 20" fill={color} />
            <path d="M26 20 L40 6 Q34 14 26 20" fill={light} opacity="0.4" />
            {/* frond veins */}
            <path d="M26 20 L10 14" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M26 20 L40 14" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M26 20 L30 6" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.12" />
            <path d="M26 20 L14 8" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.12" />
            <path d="M26 20 L36 8" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            {/* frond tip highlights */}
            <circle cx="6" cy="14" r="0.8" fill={light} opacity="0.2" />
            <circle cx="42" cy="14" r="0.8" fill={light} opacity="0.18" />
            <circle cx="28" cy="4" r="0.6" fill={light} opacity="0.15" />
            <circle cx="12" cy="7" r="0.6" fill={light} opacity="0.15" />
            {/* coconuts/fruit */}
            <circle cx="25" cy="20" r="1.5" fill={dark} opacity="0.25" />
            <circle cx="27" cy="21" r="1.3" fill={dark} opacity="0.2" />
          </g>
        )

      // ── Dragonfruit: cactus ──
      case 'cactus':
        if (s === 0) return (
          <g>
            <path d="M22 46 Q21 40 21 36 Q21 30 24 28 Q27 30 27 36 Q27 40 26 46 Z" fill={color} />
            <path d="M24 28 L24 46" stroke={dark} strokeWidth="0.6" opacity="0.25" />
            <path d="M23 30 Q23 36 22.5 42" stroke={light} strokeWidth="1" fill="none" opacity="0.12" />
            {/* spine dots */}
            <circle cx="22" cy="34" r="0.3" fill={light} opacity="0.3" />
            <circle cx="26" cy="36" r="0.3" fill={light} opacity="0.25" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M21 46 Q20 40 20 32 Q20 22 24 18 Q28 22 28 32 Q28 40 27 46 Z" fill={color} />
            <path d="M24 18 L24 46" stroke={dark} strokeWidth="0.7" opacity="0.25" />
            <path d="M22.5 20 Q22.5 30 22 40" stroke={light} strokeWidth="1" fill="none" opacity="0.12" />
            <path d="M25.5 20 Q25.5 30 26 40" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.1" />
            <path d="M20 32 Q16 30 15 26" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* spine dots */}
            <circle cx="21" cy="26" r="0.3" fill={light} opacity="0.3" />
            <circle cx="27" cy="28" r="0.3" fill={light} opacity="0.25" />
            <circle cx="21" cy="36" r="0.3" fill={light} opacity="0.25" />
            <circle cx="27" cy="38" r="0.3" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M20 46 Q19 38 19 28 Q19 16 24 12 Q29 16 29 28 Q29 38 28 46 Z" fill={color} />
            <path d="M19 30 Q14 28 12 24 Q12 20 14 18" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M29 28 Q34 26 36 22 Q36 18 34 16" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M24 12 L24 46" stroke={dark} strokeWidth="0.7" opacity="0.25" />
            <path d="M22 14 Q22 24 21.5 36" stroke={light} strokeWidth="1.2" fill="none" opacity="0.12" />
            <path d="M26 14 Q26 24 26.5 36" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.1" />
            {/* arm ribs */}
            <path d="M14 22 L14 18" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M34 20 L34 16" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* spine dots */}
            <circle cx="20" cy="22" r="0.3" fill={light} opacity="0.3" />
            <circle cx="28" cy="24" r="0.3" fill={light} opacity="0.25" />
            <circle cx="20" cy="34" r="0.3" fill={light} opacity="0.25" />
            <circle cx="28" cy="36" r="0.3" fill={light} opacity="0.2" />
            <circle cx="24" cy="10" r="2" fill={light} opacity="0.6" />
          </g>
        )
        return (
          <g>
            <path d="M20 46 Q18 38 18 28 Q18 14 24 10 Q30 14 30 28 Q30 38 28 46 Z" fill={color} />
            <path d="M18 30 Q12 28 10 22 Q10 16 14 14" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M30 26 Q36 24 38 18 Q38 12 34 10" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M24 10 L24 46" stroke={dark} strokeWidth="0.8" opacity="0.3" />
            <path d="M21 12 L20 46" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M27 12 L28 46" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M22 14 Q22 24 21 36" stroke={light} strokeWidth="1.5" fill="none" opacity="0.15" />
            <path d="M26 14 Q26 24 27 36" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.1" />
            {/* arm ribs */}
            <path d="M12 24 L12 18" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M36 20 L36 14" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M10 20 L14 14" stroke={dark} strokeWidth="0.3" opacity="0.12" />
            <path d="M38 16 L34 10" stroke={dark} strokeWidth="0.3" opacity="0.12" />
            {/* spine dots */}
            <circle cx="19" cy="20" r="0.4" fill={light} opacity="0.3" />
            <circle cx="29" cy="22" r="0.4" fill={light} opacity="0.25" />
            <circle cx="19" cy="30" r="0.4" fill={light} opacity="0.25" />
            <circle cx="29" cy="32" r="0.4" fill={light} opacity="0.2" />
            <circle cx="19" cy="40" r="0.3" fill={light} opacity="0.2" />
            <circle cx="29" cy="40" r="0.3" fill={light} opacity="0.18" />
            <circle cx="24" cy="8" r="3" fill={light} />
            <circle cx="24" cy="8" r="1.5" fill="#fbbf24" />
            {/* flower petals */}
            <circle cx="22" cy="7" r="0.8" fill={light} opacity="0.4" />
            <circle cx="26" cy="7" r="0.8" fill={light} opacity="0.35" />
          </g>
        )

      // ── Ghost Oak: ethereal glow ──
      case 'ethereal':
        if (s === 0) return (
          <g>
            <defs>
              <filter id={`glow-${uid}`}>
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 46 L24 36" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4" />
            <g filter={`url(#glow-${uid})`}>
              <ellipse cx="24" cy="32" rx="5" ry="4" fill={color} opacity="0.3" />
              <ellipse cx="24" cy="32" rx="3" ry="2" fill={light} opacity="0.5" />
            </g>
            <circle cx="22" cy="31" r="0.5" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <defs>
              <filter id={`glow-${uid}`}>
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 46 L24 32" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.4" />
            <g filter={`url(#glow-${uid})`}>
              <ellipse cx="24" cy="26" rx="8" ry="7" fill={color} opacity="0.25" />
              <ellipse cx="24" cy="26" rx="5" ry="4" fill={color} opacity="0.4" />
              <ellipse cx="24" cy="26" rx="2.5" ry="2" fill={light} opacity="0.6" />
            </g>
            <circle cx="20" cy="24" r="0.6" fill={light} opacity="0.25" />
            <circle cx="28" cy="28" r="0.5" fill={light} opacity="0.2" />
            <path d="M22 30 Q24 28 26 30" stroke={light} fill="none" strokeWidth="0.4" opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <filter id={`glow-${uid}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 46 L24 30" stroke={color} strokeWidth="2" strokeDasharray="3 2" opacity="0.45" />
            <g filter={`url(#glow-${uid})`}>
              <ellipse cx="24" cy="22" rx="11" ry="10" fill={color} opacity="0.25" />
              <ellipse cx="24" cy="22" rx="7" ry="6" fill={color} opacity="0.4" />
              <ellipse cx="24" cy="22" rx="4" ry="3" fill={light} opacity="0.65" />
              <path d="M16" cy="28" fill="none" />
            </g>
            <circle cx="18" cy="20" r="0.7" fill={light} opacity="0.25" />
            <circle cx="30" cy="24" r="0.6" fill={light} opacity="0.2" />
            <circle cx="24" cy="16" r="0.5" fill={light} opacity="0.2" />
            <path d="M18 28 Q24 24 30 28" stroke={light} fill="none" strokeWidth="0.5" opacity="0.15" />
            <path d="M20 32 Q24 28 28 32" stroke={light} fill="none" strokeWidth="0.4" opacity="0.1" />
          </g>
        )
        return (
          <g>
            <defs>
              <filter id={`glow-${uid}`}>
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id={`${uid}-eglow`} cx="50%" cy="45%">
                <stop offset="0%" stopColor={light} stopOpacity="0.9" />
                <stop offset="50%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* fading trunk made of light */}
            <path d="M24 46 L24 28" stroke={color} strokeWidth="2" strokeDasharray="3 2" opacity="0.5" />
            <path d="M24 46 L24 28" stroke={light} strokeWidth="0.8" strokeDasharray="1 3" opacity="0.3" />
            {/* wispy branch tendrils */}
            <path d="M24 30 Q18 26 12 24" stroke={color} strokeWidth="0.6" strokeDasharray="2 2" fill="none" opacity="0.25" />
            <path d="M24 28 Q30 24 36 22" stroke={color} strokeWidth="0.6" strokeDasharray="2 2" fill="none" opacity="0.25" />
            <path d="M24 26 Q20 20 14 16" stroke={color} strokeWidth="0.5" strokeDasharray="1.5 2.5" fill="none" opacity="0.18" />
            <path d="M24 26 Q28 20 34 16" stroke={color} strokeWidth="0.5" strokeDasharray="1.5 2.5" fill="none" opacity="0.18" />
            <path d="M24 24 Q22 18 18 12" stroke={light} strokeWidth="0.3" strokeDasharray="1 3" fill="none" opacity="0.12" />
            <path d="M24 24 Q26 18 30 12" stroke={light} strokeWidth="0.3" strokeDasharray="1 3" fill="none" opacity="0.12" />
            {/* layered translucent canopy rings */}
            <g filter={`url(#glow-${uid})`}>
              <ellipse cx="24" cy="18" rx="16" ry="14" fill={color} opacity="0.15" />
              <ellipse cx="24" cy="18" rx="12" ry="10" fill={color} opacity="0.3" />
              <ellipse cx="24" cy="18" rx="8" ry="6" fill={color} opacity="0.45" />
              <ellipse cx="24" cy="18" rx="4" ry="3" fill={light} opacity="0.85" />
            </g>
            {/* canopy ring outlines */}
            <ellipse cx="24" cy="18" rx="16" ry="14" fill="none" stroke={light} strokeWidth="0.3" opacity="0.1" />
            <ellipse cx="24" cy="18" rx="12" ry="10" fill="none" stroke={light} strokeWidth="0.3" opacity="0.15" />
            <ellipse cx="24" cy="18" rx="8" ry="6" fill="none" stroke={light} strokeWidth="0.4" opacity="0.2" />
            {/* arc wisps across canopy */}
            <path d="M12 26 Q24 20 36 26" stroke={light} fill="none" strokeWidth="0.8" opacity="0.25" />
            <path d="M16 30 Q24 24 32 30" stroke={light} fill="none" strokeWidth="0.6" opacity="0.18" />
            <path d="M18 12 Q24 8 30 12" stroke={light} fill="none" strokeWidth="0.5" opacity="0.15" />
            {/* floating wisps / motes with animation */}
            <circle cx="14" cy="16" r="1" fill={light} opacity="0.35">
              <animate attributeName="cy" values="16;13;16" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.15;0.35" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="34" cy="20" r="0.9" fill={light} opacity="0.3">
              <animate attributeName="cy" values="20;17;20" dur="3.5s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3.5s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <circle cx="18" cy="10" r="0.7" fill={light} opacity="0.3">
              <animate attributeName="cy" values="10;7;10" dur="5s" repeatCount="indefinite" begin="1s" />
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="5s" repeatCount="indefinite" begin="1s" />
            </circle>
            <circle cx="30" cy="12" r="0.6" fill={light} opacity="0.25">
              <animate attributeName="cy" values="12;9;12" dur="4.5s" repeatCount="indefinite" begin="1.5s" />
              <animate attributeName="opacity" values="0.25;0.08;0.25" dur="4.5s" repeatCount="indefinite" begin="1.5s" />
            </circle>
            <circle cx="10" cy="24" r="0.5" fill={light} opacity="0.2">
              <animate attributeName="cy" values="24;21;24" dur="3.8s" repeatCount="indefinite" begin="2s" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="3.8s" repeatCount="indefinite" begin="2s" />
            </circle>
            <circle cx="38" cy="14" r="0.5" fill={light} opacity="0.2">
              <animate attributeName="cy" values="14;11;14" dur="4.2s" repeatCount="indefinite" begin="0.8s" />
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="4.2s" repeatCount="indefinite" begin="0.8s" />
            </circle>
            <circle cx="24" cy="6" r="0.8" fill={light} opacity="0.28">
              <animate attributeName="cy" values="6;3;6" dur="5.5s" repeatCount="indefinite" begin="0.3s" />
              <animate attributeName="opacity" values="0.28;0.08;0.28" dur="5.5s" repeatCount="indefinite" begin="0.3s" />
            </circle>
            <circle cx="8" cy="20" r="0.4" fill={light} opacity="0.15">
              <animate attributeName="cy" values="20;17;20" dur="3.2s" repeatCount="indefinite" begin="1.2s" />
            </circle>
          </g>
        )

      // ── Bonsai: gnarled trunk in pot ──
      case 'bonsai':
        if (s === 0) return (
          <g>
            <path d="M18 46 L19 42 L29 42 L30 46 Z" fill="#8B6543" />
            <rect x="18" y="40" width="12" height="2.5" rx="0.8" fill="#A0774A" />
            <path d="M24 40 L24 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="24" cy="31" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="22" cy="30" rx="2" ry="1.5" fill={light} opacity="0.25" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M16 46 L17 42 L31 42 L32 46 Z" fill="#8B6543" />
            <rect x="15" y="39" width="18" height="3" rx="1" fill="#A0774A" />
            <path d="M24 39 Q20 34 22 28" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M22 30 Q18 28 16 26" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="16" cy="23" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="24" cy="24" rx="6" ry="5" fill={color} opacity="0.8" />
            <ellipse cx="15" cy="21" rx="2" ry="1.5" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M14 46 L16 41 L32 41 L34 46 Z" fill="#8B6543" />
            <rect x="14" y="39" width="20" height="3" rx="1" fill="#A0774A" />
            <path d="M24 39 Q18 34 20 26 Q22 20 24 22" stroke={trunk} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M20 28 Q14 24 12 22" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 22 Q30 18 34 16" stroke={trunk} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <ellipse cx="12" cy="18" rx="6" ry="4" fill={color} opacity="0.8" />
            <ellipse cx="28" cy="16" rx="7" ry="5" fill={color} />
            <ellipse cx="34" cy="12" rx="5" ry="3" fill={color} opacity="0.7" />
            <ellipse cx="10" cy="16" rx="2.5" ry="2" fill={light} opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M14 46 L16 40 L32 40 L34 46 Z" fill="#8B6543" />
            <rect x="14" y="38" width="20" height="3" rx="1" fill="#A0774A" />
            <path d="M24 40 Q16 34 18 24 Q20 18 26 20" stroke={trunk} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M18 24 Q12 20 10 18" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M26 20 Q32 16 36 14" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="10" cy="14" rx="7" ry="5" fill={color} />
            <ellipse cx="28" cy="14" rx="9" ry="6" fill={color} />
            <ellipse cx="36" cy="10" rx="6" ry="4" fill={color} />
            <ellipse cx="12" cy="16" rx="4" ry="3" fill={color} opacity="0.6" />
            <ellipse cx="32" cy="12" rx="5" ry="3" fill={color} opacity="0.5" />
            <ellipse cx="8" cy="12" rx="3" ry="2" fill={light} opacity="0.3" />
            <ellipse cx="26" cy="12" rx="4" ry="3" fill={light} opacity="0.25" />
            <circle cx="14" cy="14" r="1" fill={light} opacity="0.2" />
            <circle cx="34" cy="10" r="0.8" fill={light} opacity="0.15" />
          </g>
        )

      // ── Rainbow Willow: crystal diamond ──
      case 'crystal':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 40" stroke={trunk} strokeWidth="2" />
            <path d="M24 30 L28 36 L24 42 L20 36 Z" fill={color} opacity="0.6" />
            <path d="M24 30 L26 34 L24 38 L22 34 Z" fill={light} opacity="0.25" />
            <path d="M24 30 L24 42" stroke={light} strokeWidth="0.5" opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 40" stroke={trunk} strokeWidth="2.5" />
            <path d="M24 18 L32 28 L24 42 L16 28 Z" fill={color} opacity="0.6" />
            <path d="M24 18 L28 24 L24 34 L20 24 Z" fill={light} opacity="0.25" />
            <path d="M24 18 L24 42" stroke={light} strokeWidth="0.6" opacity="0.35" />
            <path d="M16 28 L32 28" stroke={light} strokeWidth="0.5" opacity="0.3" />
            <circle cx="28" cy="22" r="1" fill="white">
              <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 38" stroke={trunk} strokeWidth="3" />
            <path d="M24 8 L36 22 L24 42 L12 22 Z" fill={color} opacity="0.65" />
            <path d="M24 8 L30 18 L24 32 L18 18 Z" fill={light} opacity="0.28" />
            <path d="M24 8 L24 42" stroke={light} strokeWidth="0.7" opacity="0.35" />
            <path d="M12 22 L36 22" stroke={light} strokeWidth="0.6" opacity="0.35" />
            <circle cx="28" cy="16" r="1.2" fill="white">
              <animate attributeName="opacity" values="0;0.9;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="18" cy="26" r="1" fill="white">
              <animate attributeName="opacity" values="0;0.8;0" dur="2.5s" repeatCount="indefinite" begin="0.8s" />
            </circle>
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-prism`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={light} />
                <stop offset="50%" stopColor={color} />
                <stop offset="100%" stopColor={dark} />
              </linearGradient>
              <filter id={`${uid}-sparkle`}>
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* base / trunk */}
            <path d="M24 46 L24 38" stroke={trunk} strokeWidth="3" />
            <path d="M22 46 Q20 44 19 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M26 46 Q28 44 29 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.3" />
            {/* main crystal body */}
            <path d="M24 4 L38 22 L24 44 L10 22 Z" fill={color} opacity="0.55" />
            {/* inner facets */}
            <path d="M24 4 L32 16 L24 32 L16 16 Z" fill={light} opacity="0.3" />
            <path d="M24 4 L28 14 L24 28 Z" fill={`url(#${uid}-prism)`} opacity="0.25" />
            <path d="M24 4 L20 14 L24 28 Z" fill={light} opacity="0.15" />
            {/* facet edge lines */}
            <path d="M24 4 L24 44" stroke={light} strokeWidth="0.8" opacity="0.4" />
            <path d="M10 22 L38 22" stroke={light} strokeWidth="0.7" opacity="0.35" />
            <path d="M17 13 L31 31" stroke={light} strokeWidth="0.5" opacity="0.2" />
            <path d="M31 13 L17 31" stroke={light} strokeWidth="0.5" opacity="0.2" />
            {/* secondary crystal shards */}
            <path d="M8 28 L4 18 L10 22 Z" fill={color} opacity="0.5" />
            <path d="M40 28 L44 18 L38 22 Z" fill={color} opacity="0.5" />
            <path d="M6 18 L8 22 L4 18 Z" fill={light} opacity="0.2" />
            <path d="M42 18 L40 22 L44 18 Z" fill={light} opacity="0.2" />
            {/* small crystal offshoots */}
            <path d="M14 32 L10 38 L12 34 Z" fill={color} opacity="0.4" />
            <path d="M34 32 L38 38 L36 34 Z" fill={color} opacity="0.4" />
            {/* horizontal refraction bands */}
            <path d="M12 16 L36 16" stroke={light} strokeWidth="0.4" opacity="0.15" />
            <path d="M14 28 L34 28" stroke={light} strokeWidth="0.4" opacity="0.15" />
            <path d="M18 10 L30 10" stroke={light} strokeWidth="0.3" opacity="0.12" />
            {/* sparkle glints */}
            <g filter={`url(#${uid}-sparkle)`}>
              <circle cx="30" cy="12" r="1.8" fill="white">
                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="15" cy="28" r="1.4" fill="white">
                <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" begin="0.6s" />
              </circle>
              <circle cx="28" cy="24" r="1.2" fill="white">
                <animate attributeName="opacity" values="0;0.9;0" dur="3s" repeatCount="indefinite" begin="1.2s" />
              </circle>
              <circle cx="20" cy="10" r="1" fill="white">
                <animate attributeName="opacity" values="0;0.8;0" dur="2.2s" repeatCount="indefinite" begin="0.3s" />
              </circle>
              <circle cx="34" cy="18" r="0.9" fill="white">
                <animate attributeName="opacity" values="0;0.7;0" dur="2.8s" repeatCount="indefinite" begin="1.8s" />
              </circle>
            </g>
            {/* prismatic color flashes */}
            <circle cx="18" cy="20" r="0.6" fill="#ff6b9d" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="30" cy="20" r="0.5" fill="#4ecdc4" opacity="0.35">
              <animate attributeName="opacity" values="0;0.35;0" dur="2.5s" repeatCount="indefinite" begin="1s" />
            </circle>
            <circle cx="24" cy="14" r="0.5" fill="#ffe66d" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0;0.3" dur="3.5s" repeatCount="indefinite" begin="0.5s" />
            </circle>
          </g>
        )

      // ── Neon Fern: glowing mushroom ──
      case 'mushroom':
        if (s === 0) return (
          <g>
            <rect x="23" y="36" width="2" height="10" rx="1" fill="#d4cfc4" />
            <path d="M18 36 Q18 30 24 28 Q30 30 30 36 Z" fill={color} opacity="0.6" />
            <circle cx="22" cy="32" r="1.5" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22" y="32" width="4" height="14" rx="1.5" fill="#d4cfc4" />
            <rect x="23" y="32" width="1.5" height="14" rx="0.5" fill="#b8b0a4" opacity="0.3" />
            <path d="M12 32 Q12 20 24 16 Q36 20 36 32 Z" fill={color} opacity="0.7" />
            <path d="M16 30 Q16 22 24 18 Q32 22 32 30 Z" fill={light} opacity="0.15" />
            <circle cx="20" cy="24" r="2" fill={light} opacity="0.3" />
            <circle cx="28" cy="22" r="1.5" fill={light} opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <filter id={`mglow-${uid}`}>
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <rect x="21.5" y="30" width="5" height="16" rx="2" fill="#d4cfc4" />
            <rect x="22.5" y="30" width="1.5" height="16" rx="0.5" fill="#b8b0a4" opacity="0.3" />
            <g filter={`url(#mglow-${uid})`}>
              <path d="M6 30 Q6 14 24 8 Q42 14 42 30 Z" fill={color} opacity="0.7" />
            </g>
            <path d="M12 28 Q12 16 24 12 Q36 16 36 28 Z" fill={light} opacity="0.15" />
            <circle cx="18" cy="22" r="2.2" fill={light} opacity="0.35" />
            <circle cx="28" cy="20" r="1.8" fill={light} opacity="0.3" />
            <circle cx="24" cy="16" r="1.2" fill={light} opacity="0.25" />
          </g>
        )
        return (
          <g>
            <defs>
              <filter id={`mglow-${uid}`}>
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <rect x="21" y="28" width="6" height="18" rx="2" fill="#d4cfc4" />
            <rect x="22" y="28" width="2" height="18" rx="1" fill="#b8b0a4" opacity="0.3" />
            <g filter={`url(#mglow-${uid})`}>
              <path d="M4 28 Q4 10 24 6 Q44 10 44 28 Z" fill={color} opacity="0.8" />
            </g>
            <path d="M10 26 Q10 14 24 10 Q38 14 38 26 Z" fill={light} opacity="0.2" />
            <circle cx="16" cy="20" r="2.5" fill={light} opacity="0.4" />
            <circle cx="30" cy="18" r="2" fill={light} opacity="0.35" />
            <circle cx="22" cy="14" r="1.5" fill={light} opacity="0.3" />
            <circle cx="34" cy="24" r="1.8" fill={light} opacity="0.25" />
          </g>
        )

      // ── Golden Kumquat: baobab ──
      case 'baobab':
        if (s === 0) return (
          <g>
            <path d="M22 46 Q21 40 22 36 Q23 34 24 34 Q25 34 26 36 Q27 40 26 46 Z" fill={trunk} />
            <path d="M24 34 Q24 30 24 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="26" r="3" fill={color} opacity="0.6" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M20 46 Q19 38 20 32 Q22 28 24 28 Q26 28 28 32 Q29 38 28 46 Z" fill={trunk} />
            <path d="M24 28 Q24 22 24 18" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M22 30 Q16 26 14 24" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="14" cy="22" rx="4" ry="3.5" fill={color} opacity="0.6" />
            <ellipse cx="12" cy="20" rx="2" ry="1.5" fill={light} opacity="0.2" />
            <ellipse cx="24" cy="15" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="22" cy="13" rx="2.5" ry="2" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M18 46 Q16 38 18 30 Q20 24 24 22 Q28 24 30 30 Q32 38 30 46 Z" fill={trunk} />
            <path d="M22 46 Q21 38 22 32 Q23 26 24 24 L24 46 Z" fill={dark} opacity="0.12" />
            <path d="M20 26 Q14 22 12 20" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M28 26 Q34 22 36 20" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 22 Q24 16 24 12" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <ellipse cx="12" cy="16" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="10" cy="14" rx="2.5" ry="2" fill={light} opacity="0.2" />
            <ellipse cx="36" cy="16" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="34" cy="14" rx="2.5" ry="2" fill={light} opacity="0.2" />
            <ellipse cx="24" cy="8" rx="6" ry="5" fill={color} />
            <ellipse cx="22" cy="6" rx="3" ry="2.5" fill={light} opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M16 46 Q14 36 16 28 Q18 22 24 20 Q30 22 32 28 Q34 36 32 46 Z" fill={trunk} />
            <path d="M20 46 Q19 36 20 30 Q22 24 24 22 L24 46 Z" fill={dark} opacity="0.15" />
            <path d="M18 24 Q12 18 8 16" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M30 24 Q36 18 40 16" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 20 Q24 14 24 10" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="8" cy="12" rx="6" ry="5" fill={color} />
            <ellipse cx="6" cy="10" rx="3" ry="2.5" fill={light} opacity="0.2" />
            <ellipse cx="10" cy="14" rx="3" ry="2" fill={dark} opacity="0.15" />
            <ellipse cx="40" cy="12" rx="6" ry="5" fill={color} />
            <ellipse cx="38" cy="10" rx="3" ry="2.5" fill={light} opacity="0.2" />
            <ellipse cx="42" cy="14" rx="3" ry="2" fill={dark} opacity="0.15" />
            <ellipse cx="24" cy="6" rx="7" ry="5.5" fill={color} />
            <ellipse cx="22" cy="4" rx="4" ry="3" fill={light} opacity="0.25" />
            <ellipse cx="28" cy="8" rx="3" ry="2.5" fill={dark} opacity="0.12" />
            <circle cx="20" cy="6" r="1" fill={light} opacity="0.18" />
            <circle cx="30" cy="4" r="0.8" fill={light} opacity="0.12" />
          </g>
        )

      // ── Elderberry: bramble bush ──
      case 'bramble':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q22 42 22 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q26 42 26 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="34" rx="6" ry="5" fill="#2a4a2a" opacity="0.6" />
            <circle cx="22" cy="33" r="1.2" fill={color} opacity="0.5" />
            <circle cx="26" cy="35" r="1" fill={color} opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q22 40 20 36" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q26 40 28 36" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24 40 24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="28" rx="10" ry="8" fill="#2a4a2a" opacity="0.7" />
            <ellipse cx="20" cy="26" rx="5" ry="4" fill="#1e3e1e" opacity="0.5" />
            <circle cx="18" cy="26" r="1.5" fill={color} opacity="0.6" />
            <circle cx="28" cy="24" r="1.5" fill={color} opacity="0.5" />
            <circle cx="24" cy="22" r="1.2" fill={light} opacity="0.5" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 Q20 40 18 34" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q28 40 30 34" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24 38 24 32" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M18 34 Q14 30 10 28" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M30 34 Q34 30 38 28" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <ellipse cx="24" cy="24" rx="14" ry="10" fill="#2a4a2a" />
            <ellipse cx="18" cy="22" rx="6" ry="5" fill="#1e3e1e" opacity="0.5" />
            <ellipse cx="30" cy="22" rx="6" ry="5" fill="#1e3e1e" opacity="0.5" />
            <circle cx="16" cy="20" r="1.8" fill={color} opacity="0.7" />
            <circle cx="28" cy="18" r="1.8" fill={color} opacity="0.7" />
            <circle cx="32" cy="24" r="1.5" fill={color} opacity="0.6" />
            <circle cx="24" cy="16" r="1.5" fill={light} opacity="0.6" />
          </g>
        )
        return (
          <g>
            {/* main stems */}
            <path d="M24 46 Q20 40 18 34" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q28 40 30 34" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24 38 24 30" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* sprawling branches */}
            <path d="M18 34 Q12 28 6 22" stroke={trunk} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M30 34 Q36 28 42 22" stroke={trunk} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M20 32 Q16 26 12 28" stroke={trunk} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M28 32 Q32 26 36 28" stroke={trunk} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 30 Q24 24 22 18" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M24 28 Q26 22 28 16" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* thorn details */}
            <path d="M20 38 L18 36" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M28 38 L30 36" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M16 30 L14 28" stroke={trunk} strokeWidth="0.6" strokeLinecap="round" />
            <path d="M32 30 L34 28" stroke={trunk} strokeWidth="0.6" strokeLinecap="round" />
            <path d="M10 26 L8 24" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M38 26 L40 24" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M22 28 L20 26" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M26 28 L28 26" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            {/* dense foliage mass */}
            <ellipse cx="24" cy="20" rx="18" ry="14" fill="#2a4a2a" />
            <ellipse cx="14" cy="18" rx="8" ry="7" fill="#1e3e1e" opacity="0.6" />
            <ellipse cx="34" cy="18" rx="8" ry="7" fill="#1e3e1e" opacity="0.6" />
            <ellipse cx="24" cy="14" rx="6" ry="5" fill="#1e3e1e" opacity="0.5" />
            <ellipse cx="8" cy="22" rx="5" ry="4" fill="#243d24" opacity="0.5" />
            <ellipse cx="40" cy="22" rx="5" ry="4" fill="#243d24" opacity="0.5" />
            {/* berries */}
            <circle cx="12" cy="16" r="2" fill={color} />
            <circle cx="14" cy="22" r="1.8" fill={color} />
            <circle cx="10" cy="20" r="1.5" fill={color} opacity="0.8" />
            <circle cx="30" cy="14" r="2.2" fill={color} />
            <circle cx="34" cy="18" r="1.8" fill={color} />
            <circle cx="36" cy="22" r="1.5" fill={color} opacity="0.8" />
            <circle cx="24" cy="12" r="2" fill={light} />
            <circle cx="20" cy="16" r="1.5" fill={light} opacity="0.7" />
            <circle cx="28" cy="20" r="1.3" fill={color} opacity="0.7" />
            <circle cx="18" cy="24" r="1.2" fill={color} opacity="0.6" />
            {/* berry highlights */}
            <circle cx="11" cy="15" r="0.6" fill={light} opacity="0.4" />
            <circle cx="29" cy="13" r="0.7" fill={light} opacity="0.4" />
            <circle cx="23" cy="11" r="0.6" fill="white" opacity="0.3" />
          </g>
        )

      // ── Ancient Pine: massive gnarled trunk ──
      case 'ancient':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q22 42 22 38" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M22 38 Q18 36 16 34" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <ellipse cx="16" cy="32" rx="4" ry="3" fill={color} opacity="0.5" />
            <ellipse cx="24" cy="34" rx="3" ry="2" fill={color} opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M22 46 C20 40 22 36 22 30" stroke={trunk} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M22 32 Q16 28 12 26" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M22 28 Q26 24 30 22" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <ellipse cx="12" cy="24" rx="5" ry="3.5" fill={color} opacity="0.6" />
            <ellipse cx="30" cy="20" rx="5" ry="3" fill={color} opacity="0.5" />
            <ellipse cx="22" cy="26" rx="4" ry="3" fill={color} opacity="0.5" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M21 46 C18 38 22 32 20 24" stroke={trunk} strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M22 26 Q14 22 10 20" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M20 22 Q26 16 32 14" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M20 18 Q16 12 14 10" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <ellipse cx="10" cy="18" rx="5" ry="4" fill={color} opacity="0.6" />
            <ellipse cx="32" cy="12" rx="6" ry="3.5" fill={color} opacity="0.7" />
            <ellipse cx="14" cy="8" rx="4" ry="3" fill={color} opacity="0.5" />
            <ellipse cx="24" cy="14" rx="5" ry="3.5" fill={color} opacity="0.7" />
          </g>
        )
        return (
          <g>
            <path d="M20 46 C16 36 22 30 20 20" stroke={trunk} strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M22 22 Q24 30 22 46" stroke={dark} strokeWidth="2" fill="none" opacity="0.15" />
            <path d="M20 24 Q12 20 6 18" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M20 18 Q28 12 36 10" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M20 14 Q14 8 10 6" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="6" cy="14" rx="6" ry="5" fill={color} opacity="0.7" />
            <ellipse cx="36" cy="8" rx="7" ry="4" fill={color} opacity="0.8" />
            <ellipse cx="10" cy="4" rx="5" ry="3" fill={color} opacity="0.6" />
            <ellipse cx="24" cy="10" rx="6" ry="4" fill={color} />
            <circle cx="36" cy="6" r="2" fill={light} opacity="0.3" />
          </g>
        )

      // ── Void Tree: dark inversion ──
      case 'void':
        if (s === 0) return (
          <g>
            <defs>
              <radialGradient id={`vgrad-${uid}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 L24 38" stroke="#2a2a3e" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="24" cy="34" r="5" fill={`url(#vgrad-${uid})`} />
            <circle cx="24" cy="34" r="2" fill="#0a0a14" />
            <circle cx="20" cy="32" r="0.6" fill="#6366f1" opacity="0.4">
              <animate attributeName="cx" values="20;23" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" />
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
            <path d="M24 46 L24 34" stroke="#2a2a3e" strokeWidth="2" strokeLinecap="round" />
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
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <filter id={`vglow-${uid}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id={`vgrad-${uid}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#000" />
                <stop offset="60%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 L24 32" stroke="#2a2a3e" strokeWidth="2.5" strokeLinecap="round" />
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
          </g>
        )
        return (
          <g>
            <defs>
              <filter id={`vglow-${uid}`}>
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
            {/* twisted warped trunk */}
            <path d="M24 46 C22 42 26 38 23 34 C20 30 26 28 24 24" stroke="#2a2a3e" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 C26 42 22 38 25 34 C28 30 22 28 24 24" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
            {/* warped branches */}
            <path d="M24 32 C18 28 12 30 8 24" stroke="#2a2a3e" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 28 C30 24 36 26 40 20" stroke="#2a2a3e" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 26 C20 22 16 18 14 12" stroke="#2a2a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* gravity well core */}
            <g filter={`url(#vglow-${uid})`}>
              <circle cx="24" cy="18" r="16" fill={`url(#vgrad-${uid})`} />
              <circle cx="24" cy="18" r="7" fill="#050510" />
              <circle cx="24" cy="18" r="3" fill="#000" />
            </g>
            {/* distortion rings */}
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
            {/* particles being pulled inward */}
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
            {/* eerie inner glow pulse */}
            <circle cx="24" cy="18" r="4" fill="#6366f1" opacity="0.08">
              <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.08;0.02;0.08" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        )

      // ── Spoiled: dead stump ──
      case 'dead':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 38" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 38 Q22 36 21 38" stroke="#4a4a4a" strokeWidth="1" strokeLinecap="round" fill="none" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 32" stroke="#4a4a4a" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 36 Q20 32 18 34" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q26 30 28 32" stroke="#4a4a4a" strokeWidth="1" strokeLinecap="round" fill="none" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 L23 28 Q23 25 24 24 Q25 25 25 28 L25 46 Z" fill="#4a4a4a" />
            <path d="M23 32 Q19 28 16 30" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M25 28 Q28 24 30 26" stroke="#4a4a4a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
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
      case 'ethereal':
        return (
          <g>
            <circle cx="36" cy="10" r="3" fill={color} opacity="0.08" />
            <circle cx="8" cy="14" r="1.5" fill={color} opacity="0.06" />
            <circle cx="40" cy="24" r="1" fill={color} opacity="0.05" />
            <ellipse cx="24" cy="46" rx={r} ry="2" fill={color} opacity="0.08" />
          </g>
        )
      case 'cactus':
        return (
          <g>
            <ellipse cx="24" cy="46" rx={r} ry="2.5" fill="#8a7a5a" opacity="0.2" />
            <path d={`M${24 - r} 46 Q24 ${44 - s * 0.5} ${24 + r} 46`} fill="#a09070" opacity="0.1" />
            <circle cx="10" cy="44" r="1" fill="#8a7a5a" opacity="0.15" />
            <circle cx="38" cy="45" r="0.8" fill="#8a7a5a" opacity="0.12" />
          </g>
        )
      case 'palm':
        return (
          <g>
            <ellipse cx="24" cy="46" rx={r} ry="2.5" fill="#8a7a5a" opacity="0.2" />
            <path d={`M${24 - r} 46 Q24 ${44 - s * 0.5} ${24 + r} 46`} fill="#a09070" opacity="0.1" />
          </g>
        )
      case 'mushroom':
        return (
          <g>
            <ellipse cx="24" cy="46" rx={r} ry="2.5" fill="#3a5a3a" opacity="0.2" />
            <path d={`M${24 - r} 46 Q24 ${44 - s} ${24 + r} 46`} fill="#2a4a2a" opacity="0.15" />
            <circle cx="12" cy="44" r="1.5" fill="#4a6a4a" opacity="0.15" />
            <circle cx="36" cy="45" r="1" fill="#4a6a4a" opacity="0.12" />
          </g>
        )
      case 'bonsai':
        return null
      case 'dead':
        return (
          <g>
            <ellipse cx="24" cy="46" rx={r} ry="2" fill="#4a4a4a" opacity="0.12" />
            <path d={`M${24 - r} 46 Q24 ${45 - s * 0.3} ${24 + r} 46`} fill="#3a3a3a" opacity="0.08" />
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
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {renderGround()}
        <g style={{
          transformOrigin: '24px 46px',
          animation: `plantSway ${swayDuration}s ease-in-out ${swayDelay}s infinite`,
        }}>
          {renderShape()}
        </g>
      </svg>
    </div>
  )
}
