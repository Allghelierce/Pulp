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
        {/* Soil mound */}
        <ellipse cx="24" cy="38" rx="14" ry="4" fill="#8B7355" opacity="0.3" />
        {/* Seed body */}
        <ellipse cx="24" cy="28" rx="6" ry="8" fill={`url(#${uid}-sg)`} />
        <ellipse cx="24" cy="28" rx="6" ry="8" fill={dark} opacity="0.15" />
        {/* Seed line */}
        <path d="M24 20 Q24 28 24 36" stroke={dark} strokeWidth="0.8" fill="none" opacity="0.3" />
        {/* Tiny sprout hint */}
        <path d="M24 21 Q22 17 24 14 Q26 17 24 21" fill="#6ab04c" opacity="0.6" />
        <path d="M24 14 L24 21" stroke="#4a8c3f" strokeWidth="0.6" opacity="0.4" />
      </svg>
    )
  }

  // stage: 0=seedling, 1=sprout, 2=young, 3=mature
  const s = Math.min(3, Math.max(0, stage))

  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <defs>
        <radialGradient id={`${uid}-cg`} cx="40%" cy="30%">
          <stop offset="0%" stopColor={light} />
          <stop offset="80%" stopColor={color} />
        </radialGradient>
        <radialGradient id={`${uid}-sh`} cx="35%" cy="30%">
          <stop offset="0%" stopColor={light} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="24" cy="44" rx={8 + s * 3} ry={2 + s * 0.5} fill="#5c4a32" opacity="0.15" />

      {s === 0 && (<>
        {/* Seedling: tiny stem with two leaves */}
        <path d="M24 44 L24 30" stroke="#6b5b3e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M24 33 Q20 29 18 25 Q22 27 24 31" fill="#7bc67e" />
        <path d="M24 31 Q28 27 30 24 Q26 26 24 30" fill="#5ea862" />
        <circle cx="24" cy="25" r="1.5" fill={color} opacity="0.7" />
      </>)}

      {s === 1 && (<>
        {/* Sprout: thicker stem, small canopy */}
        <path d="M24 44 L24 24" stroke="#6b5b3e" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 28 Q19 24 16 20 Q20 22 24 26" fill="#7bc67e" />
        <path d="M24 26 Q29 22 32 19 Q28 21 24 25" fill="#5ea862" />
        {/* Small canopy */}
        <ellipse cx="24" cy="19" rx="8" ry="7" fill={`url(#${uid}-cg)`} />
        <ellipse cx="22" cy="17" rx="4" ry="3" fill={light} opacity="0.25" />
      </>)}

      {s === 2 && (<>
        {/* Young tree: visible trunk, medium canopy */}
        <rect x="22" y="26" width="4" height="18" rx="1.5" fill="#7a6543" />
        <rect x="22.5" y="26" width="1.5" height="18" rx="0.5" fill="#6b5b3e" opacity="0.4" />
        {/* Branch left */}
        <path d="M23 32 Q18 28 15 26" stroke="#7a6543" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Branch right */}
        <path d="M25 30 Q30 26 32 25" stroke="#7a6543" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* Canopy */}
        <ellipse cx="24" cy="18" rx="12" ry="10" fill={`url(#${uid}-cg)`} />
        <ellipse cx="19" cy="14" rx="5" ry="4" fill={light} opacity="0.2" />
        <ellipse cx="28" cy="20" rx="4" ry="3" fill={dark} opacity="0.12" />
        {/* Leaf details */}
        <circle cx="16" cy="17" r="3" fill={color} opacity="0.3" />
        <circle cx="30" cy="15" r="2.5" fill={dark} opacity="0.15" />
      </>)}

      {s === 3 && (<>
        {/* Mature tree: full trunk, lush canopy, fruits */}
        {/* Trunk */}
        <path d="M22 44 Q21 36 20 30 Q20 28 22 26 L26 26 Q28 28 28 30 Q27 36 26 44 Z" fill="#7a6543" />
        <path d="M23 44 Q22.5 36 22 30 L24 26 L24 44 Z" fill="#6b5b3e" opacity="0.3" />
        {/* Roots */}
        <path d="M22 43 Q18 44 16 45" stroke="#7a6543" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
        <path d="M26 43 Q30 44 32 45" stroke="#7a6543" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
        {/* Branches */}
        <path d="M22 30 Q16 26 12 24" stroke="#7a6543" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M26 28 Q32 24 35 22" stroke="#7a6543" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M23 27 Q20 22 18 19" stroke="#7a6543" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* Canopy layers (back to front for depth) */}
        <ellipse cx="28" cy="16" rx="9" ry="8" fill={dark} opacity="0.35" />
        <ellipse cx="18" cy="17" rx="10" ry="9" fill={`url(#${uid}-cg)`} />
        <ellipse cx="26" cy="13" rx="11" ry="9" fill={`url(#${uid}-cg)`} />
        <ellipse cx="22" cy="11" rx="9" ry="7" fill={color} />
        {/* Highlight */}
        <ellipse cx="20" cy="10" rx="5" ry="4" fill={light} opacity="0.3" />
        {/* Leaf cluster details */}
        <circle cx="14" cy="18" r="4" fill={color} opacity="0.5" />
        <circle cx="32" cy="14" r="3.5" fill={color} opacity="0.4" />
        <circle cx="24" cy="8" r="3" fill={light} opacity="0.2" />
        {/* Fruits */}
        <circle cx="17" cy="22" r="1.8" fill={lighten(color, 80)} stroke={color} strokeWidth="0.5" />
        <circle cx="30" cy="18" r="1.5" fill={lighten(color, 80)} stroke={color} strokeWidth="0.5" />
        <circle cx="22" cy="20" r="1.3" fill={lighten(color, 60)} stroke={color} strokeWidth="0.4" />
      </>)}
    </svg>
  )
}
