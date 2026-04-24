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
  const typeInfo = TREE_TYPES[type] || TREE_TYPES.navel
  const color = typeInfo.color
  const shape = typeInfo.shape || 'classic'
  const dark = darken(color, 40)
  const light = lighten(color, 50)
  const uid = `plant-${type}-${size}-${stage}`

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
        <ellipse cx="24" cy="28" rx="6" ry="8" fill={`url(#${uid}-sg)`} />
        <ellipse cx="24" cy="28" rx="6" ry="8" fill={dark} opacity="0.15" />
        <path d="M24 20 Q24 28 24 36" stroke={dark} strokeWidth="0.8" fill="none" opacity="0.3" />
        <path d="M24 21 Q22 17 24 14 Q26 17 24 21" fill="#6ab04c" opacity="0.6" />
        <path d="M24 14 L24 21" stroke="#4a8c3f" strokeWidth="0.6" opacity="0.4" />
      </svg>
    )
  }

  const s = Math.min(3, Math.max(0, stage))

  const renderShape = () => {
    const trunk = "#6b5b3e"
    switch (shape) {
      case 'classic':
        return (
          <g>
            <path d="M22 44 Q21 36 21 30 L27 30 Q27 36 26 44 Z" fill={trunk} />
            <path d="M23 44 Q23 36 23 30 L24.5 30 L24.5 44 Z" fill={dark} opacity="0.15" />
            <path d="M22 32 Q16 28 13 26" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 30 Q32 26 34 24" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="18" rx="14" ry="12" fill={color} />
            <ellipse cx="20" cy="14" rx="8" ry="6" fill={light} opacity="0.3" />
            <ellipse cx="30" cy="20" rx="6" ry="5" fill={dark} opacity="0.15" />
            <circle cx="18" cy="22" r="2" fill={light} opacity="0.25" />
            <circle cx="30" cy="16" r="1.8" fill={light} opacity="0.2" />
          </g>
        )
      case 'bushy':
        return (
          <g>
            <path d="M24 44 L24 30" stroke={trunk} strokeWidth="5" strokeLinecap="round" />
            <circle cx="24" cy="22" r="13" fill={color} />
            <circle cx="14" cy="26" r="9" fill={color} />
            <circle cx="34" cy="26" r="9" fill={color} />
            <circle cx="18" cy="16" r="7" fill={light} opacity="0.3" />
            <circle cx="14" cy="26" r="2" fill={dark} opacity="0.2" />
            <circle cx="34" cy="26" r="2" fill={dark} opacity="0.2" />
          </g>
        )
      case 'spire':
        return (
          <g>
            <path d="M24 44 L24 36" stroke={trunk} strokeWidth="4" />
            <path d="M24 6 L10 40 L38 40 Z" fill={color} />
            <path d="M24 6 L16 28 L32 28 Z" fill={light} opacity="0.3" />
          </g>
        )
      case 'weeping':
        return (
          <g>
            <path d="M24 44 L24 22" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            <path d="M24 18 Q24 10 12 22 T 8 40" stroke={color} fill="none" strokeWidth="5" strokeLinecap="round" />
            <path d="M24 18 Q24 10 36 22 T 40 40" stroke={color} fill="none" strokeWidth="5" strokeLinecap="round" />
            <circle cx="8" cy="40" r="3" fill={light} />
            <circle cx="40" cy="40" r="3" fill={light} />
          </g>
        )
      case 'exotic':
        return (
          <g>
            <path d="M24 44 C 24 36, 32 32, 32 24" stroke={trunk} strokeWidth="3" fill="none" />
            <path d="M24 44 C 24 36, 16 32, 16 24" stroke={trunk} strokeWidth="3" fill="none" />
            <path d="M32 24 Q 40 20 32 12 Q 24 20 32 24" fill={color} />
            <path d="M16 24 Q 8 20 16 12 Q 24 20 16 24" fill={color} />
            <circle cx="24" cy="16" r="6" fill={light} />
          </g>
        )
      case 'tropical':
        return (
          <g>
            <path d="M24 44 Q 28 36 24 18" stroke={trunk} strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M24 18 L6 14 Q 15 22 24 18" fill={color} />
            <path d="M24 18 L42 14 Q 33 22 24 18" fill={color} />
            <path d="M24 18 L24 2 Q 32 10 24 18" fill={color} />
            <path d="M24 18 L12 6 Q 18 12 24 18" fill={color} />
          </g>
        )
      case 'succulent':
        return (
          <g>
            <rect x="20" y="36" width="8" height="12" rx="2" fill={trunk} />
            <path d="M24 36 Q 10 32 10 20 Q 10 8 24 12 Q 38 8 38 20 Q 38 32 24 36" fill={color} />
            <circle cx="24" cy="22" r="4" fill={light} opacity="0.3" />
          </g>
        )
      case 'ethereal':
        return (
          <g>
            <defs>
              <filter id={`glow-${uid}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 44 L24 32" stroke={trunk} strokeWidth="2" strokeDasharray="2 2" />
            <g filter={`url(#glow-${uid})`}>
              <circle cx="24" cy="22" r="12" fill={color} opacity="0.6" />
              <circle cx="24" cy="22" r="6" fill={light} opacity="0.8" />
              <path d="M16 30 Q24 24 32 30" stroke={light} fill="none" strokeWidth="1" opacity="0.5" />
            </g>
          </g>
        )
      case 'crystal':
        return (
          <g>
            <path d="M24 44 L24 36" stroke={trunk} strokeWidth="3" />
            <path d="M24 8 L36 20 L24 40 L12 20 Z" fill={color} />
            <path d="M24 8 L24 40" stroke={light} strokeWidth="1" opacity="0.5" />
            <path d="M12 20 L36 20" stroke={light} strokeWidth="1" opacity="0.5" />
            <circle cx="30" cy="14" r="1.5" fill="white">
              <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="18" cy="28" r="1.2" fill="white">
              <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" begin="1s" />
            </circle>
          </g>
        )
      case 'prehistoric':
        return (
          <g>
            <path d="M24 44 C 20 36, 28 28, 24 16" stroke={trunk} strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M24 16 L8 12 Q 16 20 24 16" fill={color} />
            <path d="M24 16 L40 12 Q 32 20 24 16" fill={color} />
            <path d="M24 16 L24 2 Q 30 10 24 16" fill={color} />
            <circle cx="24" cy="16" r="4" fill={dark} opacity="0.5" />
          </g>
        )
      case 'flower':
        return (
          <g>
            <path d="M24 44 L24 26" stroke="#5a8c3f" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 34 Q18 30 14 28" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M14 28 Q12 24 14 22 Q16 26 14 28" fill="#6ab04c" />
            <path d="M24 36 Q30 32 33 30" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M33 30 Q35 26 33 24 Q31 28 33 30" fill="#6ab04c" />
            {/* Petals */}
            <circle cx="24" cy="18" r="5" fill={color} />
            <circle cx="18" cy="20" r="5" fill={color} />
            <circle cx="30" cy="20" r="5" fill={color} />
            <circle cx="20" cy="14" r="5" fill={color} />
            <circle cx="28" cy="14" r="5" fill={color} />
            <circle cx="24" cy="18" r="3" fill={light} />
            {/* Center */}
            <circle cx="24" cy="18" r="2.5" fill="#fbbf24" />
          </g>
        )
      case 'fern':
        return (
          <g>
            {/* Central stalk */}
            <path d="M24 44 L24 12" stroke="#4a8c3f" strokeWidth="2" strokeLinecap="round" />
            {/* Fronds - alternating left/right */}
            <path d="M24 38 Q16 34 10 36 Q16 32 24 36" fill={color} />
            <path d="M24 34 Q32 30 38 32 Q32 28 24 32" fill={color} />
            <path d="M24 30 Q14 26 8 28 Q14 24 24 28" fill={color} />
            <path d="M24 26 Q34 22 40 24 Q34 20 24 24" fill={color} />
            <path d="M24 22 Q16 18 10 20 Q16 16 24 20" fill={color} />
            <path d="M24 18 Q32 14 36 16 Q32 12 24 16" fill={light} opacity="0.7" />
            <path d="M24 14 Q18 10 14 12 Q18 8 24 12" fill={light} opacity="0.5" />
          </g>
        )
      case 'bonsai':
        return (
          <g>
            {/* Pot */}
            <path d="M14 44 L16 38 L32 38 L34 44 Z" fill="#8B6543" />
            <rect x="14" y="36" width="20" height="3" rx="1" fill="#A0774A" />
            {/* Trunk - curved, gnarled */}
            <path d="M24 36 Q18 30 20 24 Q22 18 26 20" stroke={trunk} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M20 24 Q14 22 12 20" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Canopy pads */}
            <ellipse cx="26" cy="16" rx="8" ry="5" fill={color} />
            <ellipse cx="12" cy="18" rx="6" ry="4" fill={color} />
            <ellipse cx="22" cy="12" rx="5" ry="3.5" fill={light} opacity="0.4" />
            <circle cx="10" cy="17" r="2" fill={light} opacity="0.3" />
          </g>
        )
      default:
        return (
          <g>
            <path d="M22 44 Q21 36 21 30 L27 30 Q27 36 26 44 Z" fill={trunk} />
            <ellipse cx="24" cy="18" rx="14" ry="12" fill={color} />
            <ellipse cx="20" cy="14" rx="8" ry="6" fill={light} opacity="0.3" />
          </g>
        )
    }
  }

  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ground shadow */}
        <ellipse cx="24" cy="44" rx={8 + s * 3} ry={2 + s * 0.5} fill="#5c4a32" opacity="0.15" />

        {s === 0 && (
          <g>
            {/* Seedling: tiny brown stem with two green leaves */}
            <path d="M24 44 L24 30" stroke="#6b5b3e" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 33 Q20 29 18 25 Q22 27 24 31" fill="#7bc67e" />
            <path d="M24 31 Q28 27 30 24 Q26 26 24 30" fill="#5ea862" />
            <circle cx="24" cy="25" r="1.5" fill={color} opacity="0.7" />
          </g>
        )}
        {s === 1 && (
          <g>
            {/* Sprout: thicker stem, small canopy bud */}
            <path d="M24 44 L24 24" stroke="#6b5b3e" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 30 Q18 26 15 22" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M15 22 Q13 18 15 16 Q17 20 15 22" fill="#7bc67e" />
            <path d="M24 28 Q30 24 33 21" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M33 21 Q35 17 33 15 Q31 19 33 21" fill="#5ea862" />
            <ellipse cx="24" cy="19" rx="8" ry="7" fill={color} opacity="0.8" />
            <ellipse cx="22" cy="17" rx="4" ry="3" fill={light} opacity="0.25" />
          </g>
        )}
        {s === 2 && (
          <g>
            {/* Young tree: visible trunk, medium canopy with leaves */}
            <rect x="22" y="26" width="4" height="18" rx="1.5" fill="#7a6543" />
            <rect x="22.5" y="26" width="1.5" height="18" rx="0.5" fill="#6b5b3e" opacity="0.4" />
            <path d="M23 32 Q18 28 15 26" stroke="#7a6543" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M25 30 Q30 26 32 25" stroke="#7a6543" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="18" rx="12" ry="10" fill={color} />
            <ellipse cx="19" cy="14" rx="5" ry="4" fill={light} opacity="0.25" />
            <ellipse cx="28" cy="20" rx="4" ry="3" fill={dark} opacity="0.12" />
            <circle cx="16" cy="17" r="3" fill={color} opacity="0.3" />
            <circle cx="30" cy="15" r="2.5" fill={dark} opacity="0.15" />
          </g>
        )}
        {s === 3 && renderShape()}
      </svg>
    </div>
  )
}
