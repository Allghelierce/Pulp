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
  const shape = typeInfo.shape || 'oak'
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
  const trunk = "#6b5b3e"

  const renderShape = () => {
    switch (shape) {
      // ── Navel Orange: broad oak ──
      case 'oak':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 37 Q20 33 18 30 Q22 32 24 35" fill={color} opacity="0.6" />
            <path d="M24 35 Q28 31 30 29 Q26 31 24 34" fill={dark} opacity="0.5" />
            <circle cx="24" cy="30" r="2" fill={color} opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 34 Q18 30 15 27" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="22" rx="8" ry="7" fill={color} opacity="0.7" />
            <ellipse cx="22" cy="20" rx="4" ry="3" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M22 46 Q21 40 21 34 L27 34 Q27 40 26 46 Z" fill={trunk} />
            <path d="M22 36 Q16 32 14 30" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="21" rx="12" ry="11" fill={color} />
            <ellipse cx="20" cy="17" rx="6" ry="5" fill={light} opacity="0.2" />
            <ellipse cx="30" cy="24" rx="4" ry="3" fill={dark} opacity="0.12" />
          </g>
        )
        return (
          <g>
            <path d="M21 46 Q20 38 20 32 L28 32 Q28 38 27 46 Z" fill={trunk} />
            <path d="M23.5 46 Q23 38 23 32 L25 32 L25 46 Z" fill={dark} opacity="0.15" />
            <path d="M21 34 Q14 30 10 28" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M27 32 Q34 28 37 26" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="20" rx="16" ry="14" fill={color} />
            <ellipse cx="18" cy="14" rx="9" ry="7" fill={light} opacity="0.25" />
            <ellipse cx="32" cy="22" rx="6" ry="5" fill={dark} opacity="0.15" />
            <circle cx="16" cy="24" r="2.5" fill={light} opacity="0.2" />
            <circle cx="30" cy="16" r="2" fill={light} opacity="0.15" />
          </g>
        )

      // ── Blood Orange: angular maple ──
      case 'maple':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 36 Q21 32 19 30 Q22 31 24 34" fill={color} opacity="0.6" />
            <path d="M24 34 Q27 30 29 28 Q26 30 24 33" fill={dark} opacity="0.5" />
            <path d="M24 32 L22 28 L24 30 L26 28 Z" fill={color} opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M24 34 Q18 30 14 28" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 22 L20 26 L16 24 L20 28 L24 32 L28 28 L32 24 L28 26 Z" fill={color} opacity="0.7" />
            <path d="M24 22 L22 26 L24 28 L26 26 Z" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 L23 30 L25 30 L25 46 Z" fill={trunk} />
            <path d="M23 34 Q17 30 12 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M25 32 Q31 28 36 27" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 12 L18 18 L12 17 L16 22 L12 26 L20 25 L24 30 L28 25 L36 26 L32 22 L36 17 L30 18 Z" fill={color} opacity="0.85" />
            <path d="M24 12 L22 16 L24 20 L26 16 Z" fill={light} opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M23 46 L23 30 L25 30 L25 46 Z" fill={trunk} />
            <path d="M23 34 Q16 28 8 26" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M25 32 Q32 26 40 25" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q20 24 14 20" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 8 L16 16 L8 14 L14 22 L8 26 L18 26 L24 34 L30 26 L40 26 L34 22 L40 14 L32 16 Z" fill={color} />
            <path d="M24 8 L20 14 L24 20 L28 14 Z" fill={light} opacity="0.3" />
            <circle cx="18" cy="20" r="2" fill={dark} opacity="0.2" />
            <circle cx="30" cy="20" r="2" fill={dark} opacity="0.2" />
          </g>
        )

      // ── Clementine: multi-dome shrub ──
      case 'shrub':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="24" cy="33" rx="5" ry="4" fill={color} opacity="0.6" />
            <ellipse cx="23" cy="32" rx="2" ry="1.5" fill={light} opacity="0.3" />
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
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 38 Q18 36 14 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 38 Q30 36 34 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="14" cy="30" rx="8" ry="7" fill={color} opacity="0.8" />
            <ellipse cx="34" cy="30" rx="8" ry="7" fill={color} opacity="0.8" />
            <ellipse cx="24" cy="27" rx="10" ry="9" fill={color} />
            <ellipse cx="20" cy="24" rx="4" ry="3" fill={light} opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="3" strokeLinecap="round" />
            <path d="M24 38 Q16 36 12 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 38 Q32 36 36 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="12" cy="30" rx="10" ry="8" fill={color} />
            <ellipse cx="36" cy="30" rx="10" ry="8" fill={color} />
            <ellipse cx="24" cy="26" rx="12" ry="10" fill={color} />
            <ellipse cx="20" cy="22" rx="5" ry="4" fill={light} opacity="0.3" />
            <circle cx="12" cy="28" r="2" fill={light} opacity="0.2" />
            <circle cx="36" cy="28" r="2" fill={dark} opacity="0.15" />
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
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke="#5a8c3f" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 34 Q19 30 16 28" stroke="#5a8c3f" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M16 28 Q14 25 16 23 Q18 26 16 28" fill="#6ab04c" />
            <circle cx="24" cy="24" r="4" fill={color} opacity="0.7" />
            <circle cx="21" cy="26" r="3.5" fill={color} opacity="0.5" />
            <circle cx="27" cy="26" r="3.5" fill={color} opacity="0.5" />
            <circle cx="24" cy="24" r="2" fill="#fbbf24" opacity="0.6" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 28" stroke="#5a8c3f" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 36 Q18 32 14 30" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M14 30 Q12 26 14 24 Q16 28 14 30" fill="#6ab04c" />
            <path d="M24 36 Q30 32 33 30" stroke="#5a8c3f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M33 30 Q35 27 33 25 Q31 28 33 30" fill="#6ab04c" />
            <circle cx="24" cy="20" r="5" fill={color} />
            <circle cx="19" cy="22" r="4.5" fill={color} opacity="0.8" />
            <circle cx="29" cy="22" r="4.5" fill={color} opacity="0.8" />
            <circle cx="21" cy="16" r="4" fill={color} opacity="0.7" />
            <circle cx="27" cy="16" r="4" fill={color} opacity="0.7" />
            <circle cx="24" cy="19" r="3" fill="#fbbf24" />
            <circle cx="23" cy="18" r="1.2" fill="#fde68a" opacity="0.5" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 L24 28" stroke="#5a8c3f" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 36 Q17 32 13 30" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M13 30 Q11 26 13 24 Q15 28 13 30" fill="#6ab04c" />
            <path d="M24 38 Q31 34 34 32" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M34 32 Q36 28 34 26 Q32 30 34 32" fill="#6ab04c" />
            <circle cx="24" cy="18" r="6" fill={color} />
            <circle cx="17" cy="20" r="5.5" fill={color} />
            <circle cx="31" cy="20" r="5.5" fill={color} />
            <circle cx="19" cy="13" r="5.5" fill={color} />
            <circle cx="29" cy="13" r="5.5" fill={color} />
            <circle cx="24" cy="10" r="5" fill={light} opacity="0.5" />
            <circle cx="24" cy="17" r="3.5" fill="#fbbf24" />
            <circle cx="23" cy="16" r="1.5" fill="#fde68a" opacity="0.6" />
          </g>
        )

      // ── Fern: alternating fronds ──
      case 'fern':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 40 24 34" stroke="#4a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 36 Q20 34 18 36 Q20 32 24 35" fill={color} />
            <path d="M24 34 Q28 32 30 34 Q28 30 24 33" fill={color} opacity="0.8" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23 40 24 26" stroke="#4a8c3f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 38 Q17 34 12 36 Q17 31 24 36" fill={color} />
            <path d="M24 33 Q31 29 36 31 Q31 26 24 31" fill={color} />
            <path d="M24 28 Q19 24 14 26 Q19 21 24 26" fill={light} opacity="0.6" />
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
          </g>
        )

      // ── Tangerine: round tree with visible fruits ──
      case 'round':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 37 Q21 34 19 32" fill="#4a8c3a" opacity="0.5" />
            <path d="M24 36 Q27 33 29 31" fill="#3a7a2a" opacity="0.5" />
            <circle cx="24" cy="32" r="3" fill="#4a8c3a" opacity="0.6" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 30" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="24" r="8" fill="#3a7a2a" opacity="0.8" />
            <circle cx="22" cy="22" r="4" fill="#4a8c3a" opacity="0.5" />
            <circle cx="26" cy="20" r="1.5" fill={color} opacity="0.6" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 Q23 40 23 34 L25 34 Q25 40 25 46 Z" fill={trunk} />
            <path d="M23 36 Q19 34 17 32" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="22" r="12" fill="#3a7a2a" />
            <circle cx="20" cy="18" r="6" fill="#4a8c3a" opacity="0.5" />
            <circle cx="19" cy="26" r="2" fill={color} opacity="0.7" />
            <circle cx="28" cy="16" r="1.8" fill={color} opacity="0.6" />
          </g>
        )
        return (
          <g>
            <path d="M22 46 Q22 40 22 34 L26 34 Q26 40 26 46 Z" fill={trunk} />
            <path d="M22 36 Q18 34 16 32" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="22" r="14" fill="#3a7a2a" />
            <circle cx="20" cy="16" r="8" fill="#4a8c3a" opacity="0.6" />
            <circle cx="30" cy="24" r="6" fill="#2a6a1e" opacity="0.4" />
            <circle cx="18" cy="26" r="2.5" fill={color} />
            <circle cx="28" cy="14" r="2.2" fill={color} />
            <circle cx="32" cy="22" r="2" fill={color} />
            <circle cx="14" cy="18" r="1.8" fill={color} opacity="0.8" />
            <circle cx="24" cy="10" r="1.5" fill={light} opacity="0.3" />
          </g>
        )

      // ── Key Lime: layered conifer ──
      case 'conifer':
        if (s === 0) return (
          <g>
            <rect x="23" y="38" width="2" height="8" fill={trunk} />
            <path d="M24 28 L20 38 L28 38 Z" fill={color} opacity="0.7" />
            <path d="M24 28 L22 34 L26 34 Z" fill={light} opacity="0.25" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="36" width="3" height="10" fill={trunk} />
            <path d="M24 18 L18 30 L30 30 Z" fill={color} />
            <path d="M24 24 L16 36 L32 36 Z" fill={color} />
            <path d="M24 18 L21 24 L27 24 Z" fill={light} opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M24 10 L16 22 L32 22 Z" fill={color} />
            <path d="M24 18 L13 30 L35 30 Z" fill={color} />
            <path d="M24 24 L11 36 L37 36 Z" fill={color} />
            <path d="M24 10 L20 18 L28 18 Z" fill={light} opacity="0.25" />
          </g>
        )
        return (
          <g>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M24 6 L14 20 L34 20 Z" fill={color} />
            <path d="M24 14 L12 28 L36 28 Z" fill={color} />
            <path d="M24 22 L10 36 L38 36 Z" fill={color} />
            <path d="M24 6 L19 14 L29 14 Z" fill={light} opacity="0.3" />
            <path d="M24 14 L18 22 L30 22 Z" fill={light} opacity="0.2" />
          </g>
        )

      // ── Lavender: tall spikes of florets ──
      case 'lavender':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 32" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 36 Q21 34 19 36 Q21 32 24 35" fill="#6ab04c" opacity="0.5" />
            <ellipse cx="24" cy="28" rx="2" ry="5" fill={color} opacity="0.6" />
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
          </g>
        )
        return (
          <g>
            <path d="M24 46 L24 24" stroke="#5a8c3f" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 46 L18 28" stroke="#4a7c35" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M30 46 L30 26" stroke="#4a7c35" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 34 Q20 30 16 32" stroke="#5a8c3f" strokeWidth="1" fill="none" />
            <path d="M24 34 Q28 30 32 32" stroke="#5a8c3f" strokeWidth="1" fill="none" />
            <ellipse cx="24" cy="18" rx="3" ry="8" fill={color} />
            <ellipse cx="18" cy="22" rx="2.5" ry="7" fill={color} opacity="0.8" />
            <ellipse cx="30" cy="20" rx="2.5" ry="7" fill={color} opacity="0.8" />
            <ellipse cx="24" cy="14" rx="2" ry="4" fill={light} opacity="0.4" />
            <ellipse cx="18" cy="18" rx="1.5" ry="3" fill={light} opacity="0.3" />
            <ellipse cx="30" cy="16" rx="1.5" ry="3" fill={light} opacity="0.3" />
          </g>
        )

      // ── Birch: slender white trunk ──
      case 'birch':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke="#d4cfc8" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 38 L24.5 37.5" stroke="#6b6560" strokeWidth="0.6" />
            <path d="M24 36 Q21 33 18 32" stroke="#8a8478" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <ellipse cx="17" cy="31" rx="4" ry="3" fill={color} opacity="0.6" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 22" stroke="#d4cfc8" strokeWidth="2" strokeLinecap="round" />
            <path d="M24.5 46 L24.5 22" stroke="#b8b0a4" strokeWidth="0.6" opacity="0.3" />
            <path d="M23.5 36 L25 35.5" stroke="#6b6560" strokeWidth="0.6" />
            <path d="M23.5 28 L25 27.5" stroke="#6b6560" strokeWidth="0.6" />
            <path d="M24 30 Q18 26 14 25" stroke="#8a8478" strokeWidth="1" strokeLinecap="round" fill="none" />
            <ellipse cx="12" cy="23" rx="5" ry="4" fill={color} opacity="0.7" />
            <path d="M24 24 Q28 21 32 20" stroke="#8a8478" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <ellipse cx="34" cy="18" rx="4" ry="3" fill={color} opacity="0.6" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23.5 46 L23.5 12" stroke="#d4cfc8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 46 L24 12" stroke="#b8b0a4" strokeWidth="0.8" opacity="0.3" />
            <path d="M22.5 36 L25 35.5" stroke="#6b6560" strokeWidth="0.7" />
            <path d="M22.5 28 L25 27.5" stroke="#6b6560" strokeWidth="0.7" />
            <path d="M22.5 20 L25 19.5" stroke="#6b6560" strokeWidth="0.7" />
            <path d="M23 30 Q17 26 13 25" stroke="#8a8478" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M23 22 Q29 18 33 17" stroke="#8a8478" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M23 16 Q18 12 14 12" stroke="#8a8478" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <ellipse cx="11" cy="23" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="35" cy="15" rx="6" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="12" cy="10" rx="4" ry="3" fill={color} opacity="0.5" />
            <ellipse cx="24" cy="8" rx="5" ry="3" fill={light} opacity="0.4" />
          </g>
        )
        return (
          <g>
            <path d="M23 46 L23 8" stroke="#d4cfc8" strokeWidth="3" strokeLinecap="round" />
            <path d="M23.5 46 L23.5 8" stroke="#b8b0a4" strokeWidth="1" opacity="0.3" />
            <path d="M22 38 L24.5 37.5" stroke="#6b6560" strokeWidth="0.8" />
            <path d="M22 30 L24.5 29.5" stroke="#6b6560" strokeWidth="0.8" />
            <path d="M22 22 L24.5 21.5" stroke="#6b6560" strokeWidth="0.8" />
            <path d="M23 32 Q16 28 12 26" stroke="#8a8478" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 24 Q30 20 34 18" stroke="#8a8478" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 16 Q16 12 12 11" stroke="#8a8478" strokeWidth="1" strokeLinecap="round" fill="none" />
            <ellipse cx="10" cy="24" rx="6" ry="5" fill={color} opacity="0.8" />
            <ellipse cx="36" cy="16" rx="7" ry="5" fill={color} opacity="0.8" />
            <ellipse cx="10" cy="10" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="24" cy="6" rx="6" ry="4" fill={light} opacity="0.5" />
          </g>
        )

      // ── Kumquat: round topiary ball ──
      case 'topiary':
        if (s === 0) return (
          <g>
            <rect x="23" y="38" width="2" height="8" rx="0.5" fill={trunk} />
            <circle cx="24" cy="34" r="5" fill={color} opacity="0.6" />
            <circle cx="22" cy="32" r="2" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="36" width="3" height="10" rx="0.8" fill={trunk} />
            <circle cx="24" cy="28" r="9" fill={color} opacity="0.8" />
            <circle cx="21" cy="24" r="4" fill={light} opacity="0.2" />
            <circle cx="28" cy="30" r="3" fill={dark} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <rect x="22" y="34" width="4" height="12" rx="1" fill={trunk} />
            <circle cx="24" cy="24" r="12" fill={color} />
            <circle cx="20" cy="18" r="6" fill={light} opacity="0.2" />
            <circle cx="30" cy="28" r="4" fill={dark} opacity="0.15" />
            <circle cx="24" cy="24" r="1.2" fill={dark} opacity="0.12" />
          </g>
        )
        return (
          <g>
            <rect x="22" y="34" width="4" height="12" rx="1" fill={trunk} />
            <circle cx="24" cy="22" r="14" fill={color} />
            <circle cx="19" cy="16" r="7" fill={light} opacity="0.25" />
            <circle cx="30" cy="26" r="5" fill={dark} opacity="0.2" />
            <circle cx="24" cy="22" r="1.5" fill={dark} opacity="0.15" />
            <circle cx="16" cy="26" r="1.5" fill={dark} opacity="0.15" />
            <circle cx="32" cy="18" r="1.5" fill={dark} opacity="0.15" />
          </g>
        )

      // ── Meyer Lemon: citrus tree ──
      case 'citrus':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 37 Q21 34 19 32" fill="#5a9c4a" opacity="0.5" />
            <path d="M24 36 Q27 33 29 31" fill="#4a8c3a" opacity="0.5" />
            <ellipse cx="24" cy="32" rx="4" ry="3" fill="#4a8c3a" opacity="0.6" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 34 Q18 30 15 28" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="22" rx="9" ry="8" fill="#4a8c3a" />
            <ellipse cx="21" cy="20" rx="4" ry="3" fill="#5a9c4a" opacity="0.4" />
            <ellipse cx="26" cy="18" rx="2" ry="1.5" fill={color} opacity="0.5" transform="rotate(-10 26 18)" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 Q22 40 22 34 L26 34 Q26 40 25 46 Z" fill={trunk} />
            <path d="M23 36 Q17 32 14 30" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M25 34 Q30 30 34 28" stroke={trunk} strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="21" rx="13" ry="12" fill="#4a8c3a" />
            <ellipse cx="19" cy="17" rx="6" ry="4" fill="#5a9c4a" opacity="0.4" />
            <ellipse cx="18" cy="24" rx="2.2" ry="1.8" fill={color} transform="rotate(-15 18 24)" />
            <ellipse cx="30" cy="16" rx="2" ry="1.5" fill={color} transform="rotate(10 30 16)" />
          </g>
        )
        return (
          <g>
            <path d="M22 46 Q21 40 21 34 L27 34 Q27 40 26 46 Z" fill={trunk} />
            <path d="M22 36 Q16 32 12 30" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 34 Q32 30 36 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="20" rx="15" ry="13" fill="#4a8c3a" />
            <ellipse cx="18" cy="16" rx="7" ry="5" fill="#5a9c4a" opacity="0.5" />
            <ellipse cx="30" cy="24" rx="5" ry="4" fill="#3a7a2a" opacity="0.4" />
            <ellipse cx="16" cy="24" rx="2.5" ry="2" fill={color} transform="rotate(-20 16 24)" />
            <ellipse cx="30" cy="16" rx="2.5" ry="2" fill={color} transform="rotate(15 30 16)" />
            <ellipse cx="22" cy="12" rx="2" ry="1.5" fill={light} transform="rotate(-10 22 12)" />
          </g>
        )

      // ── Bergamot: weeping willow ──
      case 'weeping':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M24 34 Q22 30 20 34 Q18 38 16 40" stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <path d="M24 34 Q26 30 28 34 Q30 38 32 40" stroke={color} fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke={trunk} strokeWidth="3" strokeLinecap="round" />
            <path d="M24 28 Q20 24 16 28 Q14 34 12 40" stroke={color} fill="none" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M24 28 Q28 24 32 28 Q34 34 36 40" stroke={color} fill="none" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M24 26 Q22 24 20 26 Q18 32 16 36" stroke={light} fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 24" stroke={trunk} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M24 24 Q18 18 12 24 Q10 30 8 40" stroke={color} fill="none" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M24 24 Q30 18 36 24 Q38 30 40 40" stroke={color} fill="none" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M24 22 Q20 20 18 22 Q16 28 14 36" stroke={light} fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            <path d="M24 22 Q28 20 30 22 Q32 28 34 36" stroke={light} fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 L24 22" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            <path d="M24 20 Q18 14 10 22 Q8 30 6 40" stroke={color} fill="none" strokeWidth="4" strokeLinecap="round" />
            <path d="M24 20 Q30 14 38 22 Q40 30 42 40" stroke={color} fill="none" strokeWidth="4" strokeLinecap="round" />
            <path d="M24 18 Q20 16 16 20 Q14 28 12 36" stroke={light} fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <path d="M24 18 Q28 16 32 20 Q34 28 36 36" stroke={light} fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <circle cx="6" cy="40" r="2.5" fill={light} opacity="0.5" />
            <circle cx="42" cy="40" r="2.5" fill={light} opacity="0.5" />
          </g>
        )

      // ── Cherry Blossom: sakura ──
      case 'sakura':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 34" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 36 Q20 32 18 30" stroke="#5c4a3a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <circle cx="18" cy="30" r="3" fill={color} opacity="0.5" />
            <circle cx="24" cy="32" r="2.5" fill={color} opacity="0.6" />
            <circle cx="24" cy="32" r="1" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke="#5c4a3a" strokeWidth="3" strokeLinecap="round" />
            <path d="M24 32 Q16 26 12 24" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 28 Q30 24 34 22" stroke="#5c4a3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="12" cy="22" r="5" fill={color} opacity="0.6" />
            <circle cx="24" cy="20" r="5" fill={color} opacity="0.7" />
            <circle cx="34" cy="20" r="4" fill={color} opacity="0.5" />
            <circle cx="24" cy="18" r="2" fill={light} opacity="0.4" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M23 46 L23 28" stroke="#5c4a3a" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M23 30 Q14 24 8 22" stroke="#5c4a3a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q32 20 38 18" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23 24 Q18 18 14 16" stroke="#5c4a3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="8" cy="20" r="5" fill={color} opacity="0.6" />
            <circle cx="16" cy="14" r="6" fill={color} opacity="0.7" />
            <circle cx="24" cy="12" r="5" fill={color} opacity="0.8" />
            <circle cx="34" cy="16" r="5" fill={color} opacity="0.7" />
            <circle cx="38" cy="16" r="4" fill={color} opacity="0.5" />
            <circle cx="24" cy="10" r="2" fill={light} opacity="0.4" />
            <ellipse cx="20" cy="36" rx="1.2" ry="0.8" fill={color} opacity="0.3" transform="rotate(20 20 36)" />
          </g>
        )
        return (
          <g>
            <path d="M23 46 L23 28" stroke="#5c4a3a" strokeWidth="4" strokeLinecap="round" />
            <path d="M23 30 Q12 24 6 20" stroke="#5c4a3a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q34 20 42 18" stroke="#5c4a3a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 24 Q18 18 14 14" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="6" cy="18" r="6" fill={color} opacity="0.7" />
            <circle cx="14" cy="12" r="7" fill={color} opacity="0.8" />
            <circle cx="24" cy="10" r="6" fill={color} />
            <circle cx="34" cy="14" r="6" fill={color} opacity="0.8" />
            <circle cx="42" cy="16" r="5" fill={color} opacity="0.7" />
            <circle cx="12" cy="10" r="3" fill={light} opacity="0.4" />
            <circle cx="24" cy="8" r="2.5" fill={light} opacity="0.5" />
            <circle cx="36" cy="12" r="2" fill={light} opacity="0.3" />
            <ellipse cx="18" cy="34" rx="1.5" ry="1" fill={color} opacity="0.4" transform="rotate(30 18 34)" />
            <ellipse cx="32" cy="38" rx="1.2" ry="0.8" fill={color} opacity="0.3" transform="rotate(-20 32 38)" />
          </g>
        )

      // ── Finger Lime: tall cypress column ──
      case 'cypress':
        if (s === 0) return (
          <g>
            <rect x="23" y="40" width="2" height="6" fill={trunk} />
            <path d="M24 30 Q26 34 26 40 L22 40 Q22 34 24 30 Z" fill={color} opacity="0.7" />
            <path d="M24 30 Q25 34 25 38 L24 40 L24 30 Z" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="38" width="3" height="8" fill={trunk} />
            <path d="M24 18 Q28 24 27 32 Q26 38 26 40 L22 40 Q22 38 21 32 Q20 24 24 18 Z" fill={color} />
            <path d="M24 18 Q26 22 25.5 30 L24 34 L24 18 Z" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M24 8 Q30 16 29 24 Q28 32 28 38 L20 38 Q20 32 19 24 Q18 16 24 8 Z" fill={color} />
            <path d="M24 8 Q27 14 26.5 22 Q26 30 26 36 L24 38 L24 8 Z" fill={light} opacity="0.18" />
          </g>
        )
        return (
          <g>
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M24 4 Q32 14 30 24 Q28 34 28 38 L20 38 Q20 34 18 24 Q16 14 24 4 Z" fill={color} />
            <path d="M24 4 Q28 10 27 18 Q26 26 26 34 L24 36 L24 4 Z" fill={light} opacity="0.2" />
            <path d="M22 38 Q20 34 19 28" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.3" />
          </g>
        )

      // ── Buddha's Hand: exotic twin trunks ──
      case 'exotic':
        if (s === 0) return (
          <g>
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M24 36 Q28 32 30 28 Q26 30 24 34" fill={color} opacity="0.6" />
            <path d="M24 36 Q20 32 18 28 Q22 30 24 34" fill={color} opacity="0.5" />
            <circle cx="24" cy="32" r="2" fill={light} opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 C24 40 28 38 28 30" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 46 C24 40 20 38 20 30" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M28 30 Q32 26 28 22 Q26 26 28 30" fill={color} opacity="0.7" />
            <path d="M20 30 Q16 26 20 22 Q22 26 20 30" fill={color} opacity="0.7" />
            <circle cx="24" cy="24" r="3" fill={light} opacity="0.4" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 C24 38 30 34 30 26" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M24 46 C24 38 18 34 18 26" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M30 26 Q36 20 32 14 Q28 18 30 26" fill={color} opacity="0.8" />
            <path d="M30 22 Q34 16 30 12 Q28 16 30 22" fill={light} opacity="0.4" />
            <path d="M18 26 Q12 20 16 14 Q20 18 18 26" fill={color} opacity="0.8" />
            <path d="M18 22 Q14 16 18 12 Q20 16 18 22" fill={light} opacity="0.4" />
            <circle cx="24" cy="18" r="4" fill={light} opacity="0.5" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 C24 38 32 34 32 24" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M24 46 C24 38 16 34 16 24" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M32 24 Q40 18 34 10 Q26 16 32 24" fill={color} />
            <path d="M32 20 Q38 14 32 8 Q28 14 32 20" fill={light} opacity="0.5" />
            <path d="M16 24 Q8 18 14 10 Q22 16 16 24" fill={color} />
            <path d="M16 20 Q10 14 16 8 Q20 14 16 20" fill={light} opacity="0.5" />
            <circle cx="24" cy="16" r="5" fill={light} opacity="0.6" />
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
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 26" stroke={trunk} strokeWidth="3" strokeLinecap="round" />
            <path d="M24 28 Q18 24 14 26" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 26 Q30 22 34 24" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="14" cy="28" rx="2.5" ry="6" fill={color} opacity="0.6" />
            <ellipse cx="24" cy="24" rx="2.5" ry="6" fill={color} opacity="0.7" />
            <ellipse cx="34" cy="26" rx="2.5" ry="6" fill={color} opacity="0.6" />
            <ellipse cx="24" cy="20" rx="1.5" ry="3" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 22" stroke={trunk} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M24 24 Q16 18 10 20" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 22 Q32 16 38 18" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="10" cy="24" rx="3" ry="7" fill={color} opacity="0.6" />
            <ellipse cx="18" cy="22" rx="3" ry="8" fill={color} opacity="0.7" />
            <ellipse cx="26" cy="20" rx="3" ry="8" fill={color} opacity="0.8" />
            <ellipse cx="34" cy="22" rx="3" ry="8" fill={color} opacity="0.7" />
            <ellipse cx="38" cy="22" rx="2.5" ry="6" fill={color} opacity="0.5" />
            <ellipse cx="26" cy="16" rx="1.5" ry="3" fill={light} opacity="0.3" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 L24 20" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            <path d="M24 22 Q14 16 8 18" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 20 Q34 14 40 16" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <ellipse cx="8" cy="22" rx="3" ry="8" fill={color} opacity="0.7" />
            <ellipse cx="14" cy="24" rx="3" ry="10" fill={color} opacity="0.8" />
            <ellipse cx="20" cy="20" rx="3" ry="9" fill={color} />
            <ellipse cx="28" cy="18" rx="3" ry="9" fill={color} />
            <ellipse cx="34" cy="22" rx="3" ry="10" fill={color} opacity="0.8" />
            <ellipse cx="40" cy="20" rx="3" ry="8" fill={color} opacity="0.7" />
            <ellipse cx="20" cy="16" rx="1.5" ry="3" fill={light} opacity="0.4" />
            <ellipse cx="28" cy="14" rx="1.5" ry="3" fill={light} opacity="0.4" />
          </g>
        )

      // ── Starfruit: curved palm ──
      case 'palm':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q25 42 24.5 36" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24.5 36 L18 32 Q22 36 24.5 36" fill={color} />
            <path d="M24.5 36 L30 32 Q26 36 24.5 36" fill={color} />
            <path d="M24.5 36 L24 28 Q26 32 24.5 36" fill={color} opacity="0.8" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q26 40 25 30" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M25 30 L12 24 Q18 30 25 30" fill={color} />
            <path d="M25 30 L36 24 Q30 30 25 30" fill={color} />
            <path d="M25 30 L24 16 Q28 22 25 30" fill={color} opacity="0.8" />
            <path d="M25 30 L16 18 Q20 24 25 30" fill={color} opacity="0.7" />
            <path d="M25 30 L34 18 Q30 24 25 30" fill={light} opacity="0.35" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 Q27 38 26 24" stroke={trunk} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M25 26 Q26 32 24 46" stroke={dark} strokeWidth="1" fill="none" opacity="0.2" />
            <path d="M22.5 34 Q26 33 27.5 34" stroke={dark} strokeWidth="0.7" fill="none" opacity="0.3" />
            <path d="M26 24 L8 18 Q16 26 26 24" fill={color} />
            <path d="M26 24 L40 18 Q32 26 26 24" fill={color} />
            <path d="M26 24 L26 6 Q32 14 26 24" fill={color} />
            <path d="M26 24 L14 10 Q20 18 26 24" fill={color} opacity="0.8" />
            <path d="M26 24 L36 10 Q32 18 26 24" fill={light} opacity="0.35" />
          </g>
        )
        return (
          <g>
            <path d="M24 46 Q28 38 26 20" stroke={trunk} strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M25 22 Q26 30 24 46" stroke={dark} strokeWidth="1.5" fill="none" opacity="0.2" />
            <path d="M22 36 Q26 35 28 36" stroke={dark} strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M22 30 Q26 29 28 30" stroke={dark} strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M26 20 L4 14 Q14 24 26 20" fill={color} />
            <path d="M26 20 L44 14 Q34 24 26 20" fill={color} />
            <path d="M26 20 L26 2 Q34 12 26 20" fill={color} />
            <path d="M26 20 L10 6 Q18 14 26 20" fill={color} />
            <path d="M26 20 L40 6 Q34 14 26 20" fill={light} opacity="0.4" />
          </g>
        )

      // ── Dragonfruit: cactus ──
      case 'cactus':
        if (s === 0) return (
          <g>
            <path d="M22 46 Q21 40 21 36 Q21 30 24 28 Q27 30 27 36 Q27 40 26 46 Z" fill={color} />
            <path d="M24 28 L24 46" stroke={dark} strokeWidth="0.6" opacity="0.25" />
            <path d="M23 30 Q23 36 22.5 42" stroke={light} strokeWidth="1" fill="none" opacity="0.12" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M21 46 Q20 40 20 32 Q20 22 24 18 Q28 22 28 32 Q28 40 27 46 Z" fill={color} />
            <path d="M24 18 L24 46" stroke={dark} strokeWidth="0.7" opacity="0.25" />
            <path d="M22.5 20 Q22.5 30 22 40" stroke={light} strokeWidth="1" fill="none" opacity="0.12" />
            <path d="M20 32 Q16 30 15 26" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M20 46 Q19 38 19 28 Q19 16 24 12 Q29 16 29 28 Q29 38 28 46 Z" fill={color} />
            <path d="M19 30 Q14 28 12 24 Q12 20 14 18" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M29 28 Q34 26 36 22 Q36 18 34 16" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M24 12 L24 46" stroke={dark} strokeWidth="0.7" opacity="0.25" />
            <path d="M22 14 Q22 24 21.5 36" stroke={light} strokeWidth="1.2" fill="none" opacity="0.12" />
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
            <circle cx="24" cy="8" r="3" fill={light} />
            <circle cx="24" cy="8" r="1.5" fill="#fbbf24" />
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
          </g>
        )
        return (
          <g>
            <defs>
              <filter id={`glow-${uid}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M24 46 L24 30" stroke={color} strokeWidth="2" strokeDasharray="3 2" opacity="0.5" />
            <g filter={`url(#glow-${uid})`}>
              <ellipse cx="24" cy="20" rx="14" ry="12" fill={color} opacity="0.3" />
              <ellipse cx="24" cy="20" rx="10" ry="8" fill={color} opacity="0.5" />
              <ellipse cx="24" cy="20" rx="5" ry="4" fill={light} opacity="0.8" />
              <path d="M14 28 Q24 22 34 28" stroke={light} fill="none" strokeWidth="1" opacity="0.3" />
              <path d="M18 32 Q24 26 30 32" stroke={light} fill="none" strokeWidth="0.8" opacity="0.2" />
            </g>
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
            <path d="M24 38 Q16 32 18 24 Q20 18 26 20" stroke={trunk} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M18 24 Q12 20 10 18" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M26 20 Q32 16 36 14" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="10" cy="14" rx="7" ry="5" fill={color} />
            <ellipse cx="28" cy="14" rx="9" ry="6" fill={color} />
            <ellipse cx="36" cy="10" rx="6" ry="4" fill={color} />
            <ellipse cx="8" cy="12" rx="3" ry="2" fill={light} opacity="0.3" />
            <ellipse cx="26" cy="12" rx="4" ry="3" fill={light} opacity="0.25" />
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
            <path d="M24 46 L24 38" stroke={trunk} strokeWidth="3" />
            <path d="M24 6 L38 22 L24 42 L10 22 Z" fill={color} opacity="0.7" />
            <path d="M24 6 L32 16 L24 30 L16 16 Z" fill={light} opacity="0.3" />
            <path d="M24 6 L24 42" stroke={light} strokeWidth="0.8" opacity="0.4" />
            <path d="M10 22 L38 22" stroke={light} strokeWidth="0.8" opacity="0.4" />
            <path d="M17 14 L31 30" stroke={light} strokeWidth="0.5" opacity="0.2" />
            <circle cx="30" cy="14" r="1.5" fill="white">
              <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="16" cy="28" r="1.2" fill="white">
              <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" begin="0.8s" />
            </circle>
            <circle cx="28" cy="24" r="1" fill="white">
              <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="1.5s" />
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
            <circle cx="14" cy="22" r="3.5" fill={color} opacity="0.6" />
            <circle cx="24" cy="15" r="4" fill={color} opacity="0.7" />
            <circle cx="24" cy="14" r="2" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M18 46 Q16 38 18 30 Q20 24 24 22 Q28 24 30 30 Q32 38 30 46 Z" fill={trunk} />
            <path d="M22 46 Q21 38 22 32 Q23 26 24 24 L24 46 Z" fill={dark} opacity="0.12" />
            <path d="M20 26 Q14 22 12 20" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M28 26 Q34 22 36 20" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 22 Q24 16 24 12" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <circle cx="12" cy="16" r="4" fill={color} opacity="0.7" />
            <circle cx="36" cy="16" r="4" fill={color} opacity="0.7" />
            <circle cx="24" cy="8" r="5" fill={color} />
            <circle cx="24" cy="6" r="2.5" fill={light} opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M16 46 Q14 36 16 28 Q18 22 24 20 Q30 22 32 28 Q34 36 32 46 Z" fill={trunk} />
            <path d="M20 46 Q19 36 20 30 Q22 24 24 22 L24 46 Z" fill={dark} opacity="0.15" />
            <path d="M18 24 Q12 18 8 16" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M30 24 Q36 18 40 16" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 20 Q24 14 24 10" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="8" cy="12" r="5" fill={color} />
            <circle cx="40" cy="12" r="5" fill={color} />
            <circle cx="24" cy="6" r="6" fill={color} />
            <circle cx="24" cy="4" r="3" fill={light} opacity="0.3" />
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
            <path d="M24 46 Q20 40 18 34" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q28 40 30 34" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24 38 24 30" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M18 34 Q12 28 8 24" stroke={trunk} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M30 34 Q36 28 40 24" stroke={trunk} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <ellipse cx="24" cy="22" rx="16" ry="12" fill="#2a4a2a" />
            <ellipse cx="16" cy="20" rx="8" ry="7" fill="#1e3e1e" opacity="0.6" />
            <ellipse cx="32" cy="20" rx="8" ry="7" fill="#1e3e1e" opacity="0.6" />
            <circle cx="14" cy="18" r="2" fill={color} />
            <circle cx="16" cy="22" r="1.8" fill={color} />
            <circle cx="12" cy="20" r="1.5" fill={color} opacity="0.8" />
            <circle cx="30" cy="16" r="2" fill={color} />
            <circle cx="34" cy="20" r="1.8" fill={color} />
            <circle cx="32" cy="24" r="1.5" fill={color} opacity="0.8" />
            <circle cx="24" cy="14" r="1.8" fill={light} />
            <circle cx="22" cy="18" r="1.5" fill={light} opacity="0.7" />
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
                <stop offset="60%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M24 46 L24 30" stroke="#2a2a3e" strokeWidth="3" strokeLinecap="round" />
            <path d="M24 32 Q16 26 10 24" stroke="#2a2a3e" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 28 Q32 22 38 20" stroke="#2a2a3e" strokeWidth="2" fill="none" strokeLinecap="round" />
            <g filter={`url(#vglow-${uid})`}>
              <circle cx="24" cy="20" r="14" fill={`url(#vgrad-${uid})`} />
              <circle cx="24" cy="20" r="6" fill="#0a0a14" />
            </g>
            <circle cx="10" cy="14" r="1" fill="#6366f1" opacity="0.6">
              <animate attributeName="cx" values="10;22" dur="3s" repeatCount="indefinite" />
              <animate attributeName="cy" values="14;20" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="38" cy="24" r="0.8" fill="#8b5cf6" opacity="0.5">
              <animate attributeName="cx" values="38;26" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="cy" values="24;20" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.5;0" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <circle cx="16" cy="30" r="0.8" fill="#a78bfa" opacity="0.4">
              <animate attributeName="cx" values="16;23" dur="3.5s" repeatCount="indefinite" begin="1.2s" />
              <animate attributeName="cy" values="30;22" dur="3.5s" repeatCount="indefinite" begin="1.2s" />
              <animate attributeName="opacity" values="0.4;0" dur="3.5s" repeatCount="indefinite" begin="1.2s" />
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
        {renderShape()}
      </svg>
    </div>
  )
}
