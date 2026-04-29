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

export function PlantIcon({ type, size = 40, stage = 0, isSeed = false, hideGround = false }: { type: string, size?: number, stage?: number, isSeed?: boolean, hideGround?: boolean }) {
  const typeInfo = TREE_TYPES[type] || TREE_TYPES.tangerine
  const color = typeInfo.color
  const shape = typeInfo.shape || 'oak'
  const rarity = typeInfo.rarity || 'common'
  const dark = darken(color, 40)
  const light = lighten(color, rarity === 'legendary' ? 50 : 25)
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
            <path d="M21 46 Q20 38 20 32 L28 32 Q28 38 27 46 Z" fill={trunk} />
            <path d="M23.5 46 Q23 38 23 32 L25 32 L25 46 Z" fill={dark} opacity="0.15" />
            <path d="M21.5 38 L26.5 37.8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <path d="M22 42 L26 41.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M22.5 35 L25.5 34.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M21 34 Q14 30 10 28" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M27 32 Q34 28 37 26" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 34 Q18 32 14 31" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
            <path d="M8 22 C7 16 10 10 16 8 Q19 6.5 24 7 Q29 6.5 32 8 C38 10 41 16 40 22 C41 26 38 30 34 32 Q30 33.5 24 34 Q18 33.5 14 32 C10 30 7 26 8 22 Z" fill={color} />
            <path d="M10 14 Q8.5 12 10.5 11 Q12 12.5 10 14" fill={color} opacity="0.8" />
            <path d="M36 12 Q38 10.5 38.5 12.5 Q37 13.5 36 12" fill={color} opacity="0.8" />
            <path d="M7.5 24 Q5.5 23 6.5 21 Q8 22 7.5 24" fill={color} opacity="0.7" />
            <path d="M40.5 20 Q42 18.5 42.5 20.5 Q41 21.5 40.5 20" fill={color} opacity="0.7" />
            <path d="M15 32.5 Q13 33 13.5 31 Q15 31.5 15 32.5" fill={color} opacity="0.6" />
            <path d="M33 32.5 Q35 33 34.5 31 Q33 31.5 33 32.5" fill={color} opacity="0.6" />
            <path d="M24 20 Q20 18 16 20" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M24 20 Q28 17 32 18" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.1" />
            <path d="M24 20 Q22 24 20 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M18 14 Q16 17 14 20" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.08" />
            <circle cx="18" cy="26" r="1.8" fill={color} opacity="0.5" />
            <circle cx="30" cy="24" r="1.5" fill={color} opacity="0.4" />
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
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M22.5 40 L25.5 39.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23 43 L25.5 42.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M24 6 L14 20 L34 20 Z" fill={color} />
            <path d="M24 14 L12 28 L36 28 Z" fill={color} />
            <path d="M24 22 L10 36 L38 36 Z" fill={color} />
            <path d="M24 6 L19 14 L29 14 Z" fill={light} opacity="0.3" />
            <path d="M24 14 L18 22 L30 22 Z" fill={light} opacity="0.2" />
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
            <path d="M5 24 Q4.5 20 7 19.5 Q9 18.5 12 19 Q16.5 19.5 16 23 Q15.8 26.5 13 28.5 Q10 29.5 7 28.5 Q4.8 27.5 5 24Z" fill={color} opacity="0.8" />
            <path d="M29.5 16 Q29 12 32 11 Q35 10 39 11.5 Q43 13 42.5 16.5 Q42 19.5 39 20.8 Q35.5 22 32 20.5 Q29.5 19 29.5 16Z" fill={color} opacity="0.8" />
            <path d="M5.5 10 Q5 7 8 6.5 Q10.5 6 13 7 Q15.5 8.5 14.5 11 Q13.5 13.5 11 14 Q8 14 6 12.5 Q5.2 11.8 5.5 10Z" fill={color} opacity="0.7" />
            <path d="M18.5 6 Q19 3 22 2.5 Q25 2 28 3 Q30.5 4.5 30 7 Q29.5 9.5 27 10 Q24 10.5 21 9.5 Q18.8 8.5 18.5 6Z" fill={light} opacity="0.5" />
            <path d="M30.5 9 Q30 7 32 6.5 Q34 6 36.5 7 Q38.5 8.5 38 10.5 Q37 12 35 12 Q32.5 12 31 11 Q30.3 10.2 30.5 9Z" fill={color} opacity="0.4" />
            <path d="M6 21 Q7 19.5 8 21 Q7 22 6 21Z" fill={light} opacity="0.22" />
            <path d="M13 20 Q14 18.5 14.5 20 Q14 21 13 20Z" fill={light} opacity="0.18" />
            <path d="M31 13 Q32.5 11.5 33 13 Q32 14 31 13Z" fill={light} opacity="0.2" />
            <path d="M38 14 Q39 12.5 39.5 14 Q39 15.2 38 14Z" fill={light} opacity="0.18" />
            <path d="M7 8 Q8 6.5 9 8 Q8 9 7 8Z" fill={light} opacity="0.18" />
            <path d="M12 7.5 Q13 6 13.5 7.5 Q13 8.5 12 7.5Z" fill={light} opacity="0.15" />
            <path d="M21 4.5 Q22 3 23 4.5 Q22 5.5 21 4.5Z" fill={light} opacity="0.22" />
            <path d="M27 4 Q28 2.5 28.5 4 Q28 5 27 4Z" fill={light} opacity="0.18" />
            <path d="M8 22 Q10 21 12 22.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M10 25 Q11 24 13 24.5" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M33 14 Q35 13 37 14" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M35 17 Q37 16 39 17" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M8 9 Q10 8 12 9" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M22 5 Q24 4 26 5" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M8 27 Q10 28.5 14 28 Q12 29 9 28.5Z" fill={dark} opacity="0.08" />
            <path d="M35 19 Q37 20.5 41 19.5 Q39 20.5 36 20Z" fill={dark} opacity="0.08" />
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
            <path d="M24 46 Q23.5 42 22.5 38 Q22 36 21 34" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M21 34 Q18 31 16 30" stroke="#5c4a3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M15 29 C13 27 14 25 17 25.5 C19 26 20 28 18 30 C16 31 14 30 15 29 Z" fill="#f9a8d4" opacity="0.65" />
            <path d="M17 27 Q16.5 26 17.5 25.5 L18.5 26.5 Q18 28 17 27 Z" fill="#ffe0ec" opacity="0.4" />
            <path d="M14 28 L14.5 27 L15.5 27.5 L15 28.5 L14 28 Z" fill="#ffc0d8" opacity="0.35" />
            <circle cx="16.5" cy="27.5" r="0.5" fill="#fbbf24" opacity="0.35" />
            <path d="M23 38 C22 36 23 35 24 36.5 Q23.5 37.5 23 38 Z" fill="#f9a8d4" opacity="0.45" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q23 40 22 34 Q21.5 31 22 28" stroke="#5c4a3a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M22.5 38 L24 37.6" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.3" />
            <ellipse cx="22.5" cy="36" rx="1" ry="0.7" fill="#4a3a2a" opacity="0.2" />
            <path d="M22 32 Q15 26 10 24" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M22 30 Q27 26 32 24" stroke="#5c4a3a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M22 28 Q20 24 18 22" stroke="#5c4a3a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M7 22 C5 19 6 16 10 15 C14 14 17 17 16 21 C15 24 10 25 7 22 Z" fill="#f9a8d4" opacity="0.6" />
            <path d="M9 18 C8 16 10 14.5 12 16 C14 17 13 20 10 20 Z" fill="#ffc0d8" opacity="0.5" />
            <ellipse cx="12" cy="22" rx="3" ry="2" fill="#ffe0ec" opacity="0.25" />
            <path d="M10 19 L10.5 18 L11.5 18.5 L11 19.5 L10 19 Z" fill="#ffc0d8" opacity="0.3" />
            <circle cx="10" cy="20" r="0.5" fill="#fbbf24" opacity="0.3" />
            <path d="M16 20 C14 17 15 14 19 14 C23 14 24 18 21 21 C18 23 15 22 16 20 Z" fill="#ffc0d8" opacity="0.7" />
            <path d="M18 16 Q17 15 18.5 14.5 L19.5 15.5 Q19 17 18 16 Z" fill="#ffe0ec" opacity="0.35" />
            <ellipse cx="20" cy="19" rx="1.5" ry="2.5" fill="#e890b8" opacity="0.15" />
            <circle cx="18" cy="19" r="0.5" fill="#fbbf24" opacity="0.25" />
            <path d="M29 22 C27 19 29 16 33 17 C36 18 37 21 34 23 C31 25 28 24 29 22 Z" fill="#f9a8d4" opacity="0.6" />
            <path d="M32 19 L32.5 18 L33.5 18.5 L33 19.5 L32 19 Z" fill="#ffe0ec" opacity="0.3" />
            <circle cx="32" cy="21" r="0.4" fill="#fbbf24" opacity="0.2" />
            <path d="M21 25 C19 22 21 20 24 20.5 C26 21 26 24 23 26 Z" fill="#ffc0d8" opacity="0.55" />
            <ellipse cx="28" cy="36" rx="0.9" ry="0.5" fill="#f9a8d4" opacity="0.2" transform="rotate(-25 28 36)" />
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
            <path d="M23 46 Q21.5 40 22 34 Q22.5 30 23 28" stroke="#5c4a3a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M21.8 38 L24 37.6" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.3" />
            <ellipse cx="22.5" cy="36" rx="1.2" ry="0.8" fill="#4a3a2a" opacity="0.18" />
            <path d="M23 30 Q14 24 7 22" stroke="#5c4a3a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 28 Q32 20 38 18" stroke="#5c4a3a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q17 20 13 16" stroke="#5c4a3a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 28 Q26 24 30 22" stroke="#5c4a3a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M4 20 C2 17 3 13 7 12 C12 11 16 14 16 18 C16 22 12 24 8 23 C5 22 3 21 4 20 Z" fill="#f9a8d4" opacity="0.55" />
            <path d="M6 16 C5 14 7 12 10 13 C12 14 12 17 9 18 Z" fill="#ffc0d8" opacity="0.5" />
            <ellipse cx="10" cy="20" rx="2.5" ry="1.5" fill="#e890b8" opacity="0.2" />
            <path d="M11 14 C9 11 11 8 15 9 C19 10 20 14 17 16 C14 18 10 17 11 14 Z" fill="#ffc0d8" opacity="0.7" />
            <path d="M14 11 Q13 10 14.5 9 L16 10.5 Q15 12 14 11 Z" fill="#ffe0ec" opacity="0.3" />
            <ellipse cx="17" cy="15" rx="1.5" ry="2.5" fill="#e890b8" opacity="0.15" />
            <path d="M16 12 C14 9 17 7 20 9 C23 11 21 15 18 15 Z" fill="#f9a8d4" opacity="0.5" />
            <path d="M20 19 C17 15 20 12 24 13 C28 14 28 19 24 21 C21 22 18 21 20 19 Z" fill="#ffc0d8" opacity="0.75" />
            <path d="M23 15 L23.5 14 L24.5 14.5 L24 15.5 L23 15 Z" fill="#ffe0ec" opacity="0.3" />
            <ellipse cx="22" cy="18" rx="2" ry="1.2" fill="#e890b8" opacity="0.12" />
            <path d="M28 20 C25 16 28 13 32 15 C35 17 34 21 30 22 C27 23 26 22 28 20 Z" fill="#f9a8d4" opacity="0.6" />
            <path d="M31 17 C29 15 31 13 34 15 C36 17 33 20 31 17 Z" fill="#ffe0ec" opacity="0.2" />
            <path d="M35 16 C33 12 37 9 41 11 C44 13 42 17 39 18 C36 19 34 18 35 16 Z" fill="#ffc0d8" opacity="0.6" />
            <path d="M38 13 Q37.5 12 38.5 11.5 L39.5 12.5 Q39 14 38 13 Z" fill="#ffe0ec" opacity="0.25" />
            <circle cx="23" cy="19" r="0.6" fill="#fbbf24" opacity="0.3" />
            <circle cx="13" cy="13" r="0.5" fill="#fbbf24" opacity="0.25" />
            <circle cx="38" cy="15" r="0.4" fill="#fbbf24" opacity="0.2" />
            <circle cx="7" cy="19" r="0.4" fill="#fbbf24" opacity="0.2" />
            <path d="M15 8 Q14.5 7.5 15 7 L15.5 7 L16 7.5 L15.5 8 Z" fill="#f9a8d4" opacity="0.4" style={{animation: `sakuraFall-${uid} 5s linear 0s infinite`, '--sf-x': '4px'} as React.CSSProperties} />
            <path d="M30 6 C30.5 5.5 31 5.5 31 6 C31 6.5 30.5 7 30 6.5 Z" fill="#ffc0d8" opacity="0.35" style={{animation: `sakuraFall-${uid} 6.5s linear 1.2s infinite`, '--sf-x': '-5px'} as React.CSSProperties} />
            <path d="M8 10 Q8.5 9.5 9 10 L8.5 10.5 Z" fill="#ffe0ec" opacity="0.4" style={{animation: `sakuraFall-${uid} 4.5s linear 2.5s infinite`, '--sf-x': '3px'} as React.CSSProperties} />
            <path d="M40 10 C40.5 9.5 41 10 40.5 10.5 Z" fill="#f9a8d4" opacity="0.3" style={{animation: `sakuraFall-${uid} 7s linear 0.8s infinite`, '--sf-x': '-6px'} as React.CSSProperties} />
            <ellipse cx="28" cy="34" rx="1" ry="0.6" fill="#f9a8d4" opacity="0.3" transform="rotate(-20 28 34)" />
            <ellipse cx="16" cy="38" rx="0.8" ry="0.5" fill="#ffc0d8" opacity="0.2" transform="rotate(15 16 38)" />
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
            <path d="M23 46 C22 42 21 38 22 34 C22.5 32 23 30 23 28" stroke="#5c4a3a" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M23 46 C22 42 21 38 22 34 C22.5 32 23 30 23 28" stroke="#4a3a2a" strokeWidth="1.5" opacity="0.12" strokeLinecap="round" fill="none" />
            <path d="M21.5 38 L24.5 37.6" stroke="#4a3a2a" strokeWidth="0.6" opacity="0.3" />
            <ellipse cx="22" cy="36" rx="1.5" ry="1" fill="#4a3a2a" opacity="0.2" />
            <ellipse cx="22" cy="36" rx="0.7" ry="0.5" fill="#3a2a1a" opacity="0.15" />
            <path d="M23 30 Q12 24 5 20" stroke="#5c4a3a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M23 28 Q34 20 42 16" stroke="#5c4a3a" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q16 18 12 12" stroke="#5c4a3a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M23 24 Q30 16 34 10" stroke="#5c4a3a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M8 22 Q6 20 4 22" stroke="#5c4a3a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M16 16 Q14 14 12 16" stroke="#5c4a3a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M38 18 Q40 16 42 18" stroke="#5c4a3a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M2 19 C0 15 2 11 7 11 C11 11 14 14 14 18 C14 22 10 24 6 23 C3 22 1 21 2 19 Z" fill="#f9a8d4" opacity="0.55" />
            <path d="M4 16 C3 14 5 12 8 12 C11 12 12 15 10 17 Z" fill="#ffc0d8" opacity="0.45" />
            <ellipse cx="8" cy="20" rx="3" ry="1.8" fill="#e890b8" opacity="0.18" />
            <path d="M8 16 C5 12 8 8 13 9 C18 10 19 15 15 18 C12 20 7 19 8 16 Z" fill="#ffc0d8" opacity="0.65" />
            <path d="M11 12 Q10 11 11.5 10 L13 11.5 Q12 13 11 12 Z" fill="#ffe0ec" opacity="0.3" />
            <ellipse cx="14" cy="16" rx="2" ry="1.2" fill="#e890b8" opacity="0.15" />
            <path d="M10 9 C7 5 10 1 16 3 C21 5 22 10 18 13 C14 15 9 13 10 9 Z" fill="#f9a8d4" opacity="0.75" />
            <path d="M13 6 C11 4 13 2 16 3 C19 4 18 8 15 9 Z" fill="#ffe0ec" opacity="0.25" />
            <path d="M15 5 L15.5 4 L16.5 4.5 L16 5.5 L15 5 Z" fill="#ffc0d8" opacity="0.3" />
            <path d="M21 11 C18 7 21 3 27 4 C32 5 33 10 29 13 C25 15 20 14 21 11 Z" fill="#ffc0d8" opacity="0.8" />
            <path d="M24 7 C22 5 24 3 27 4 C30 5 28 9 25 10 Z" fill="#ffe0ec" opacity="0.3" />
            <ellipse cx="27" cy="11" rx="2.5" ry="1.5" fill="#e890b8" opacity="0.12" />
            <path d="M31 9 C28 5 32 2 37 3 C42 4 42 9 38 12 C34 14 29 13 31 9 Z" fill="#f9a8d4" opacity="0.7" />
            <path d="M34 6 L34.5 5 L35.5 5.5 L35 6.5 L34 6 Z" fill="#ffe0ec" opacity="0.25" />
            <path d="M36 5 C34 3 37 1 40 3 C42 5 40 8 37 8 Z" fill="#ffc0d8" opacity="0.5" />
            <path d="M38 15 C36 11 39 7 44 9 C48 11 47 16 43 18 C40 19 37 18 38 15 Z" fill="#ffc0d8" opacity="0.65" />
            <path d="M41 12 C39 10 41 8 44 9 C46 10 45 14 42 14 Z" fill="#ffe0ec" opacity="0.3" />
            <ellipse cx="43" cy="15" rx="1.5" ry="2" fill="#e890b8" opacity="0.12" />
            <path d="M19 17 C16 13 19 10 24 11 C28 12 28 17 24 19 C21 20 17 19 19 17 Z" fill="#f9a8d4" opacity="0.5" />
            <path d="M29 15 C26 11 30 8 34 10 C37 12 36 16 32 17 Z" fill="#ffc0d8" opacity="0.45" />
            <circle cx="12" cy="9" r="0.7" fill="#fbbf24" opacity="0.3" />
            <circle cx="24" cy="7" r="0.8" fill="#fbbf24" opacity="0.3" />
            <circle cx="34" cy="8" r="0.6" fill="#fbbf24" opacity="0.25" />
            <circle cx="5" cy="17" r="0.5" fill="#fbbf24" opacity="0.2" />
            <circle cx="42" cy="13.5" r="0.5" fill="#fbbf24" opacity="0.2" />
            <circle cx="18" cy="12" r="0.4" fill="#fbbf24" opacity="0.18" />
            <path d="M18 32 C19.5 30 21 31 20 33 Q19 34 18 32 Z" fill="#f9a8d4" opacity="0.4" transform="rotate(30 18 32)" />
            <path d="M32 36 C33 34 34.5 35 34 37 Q33 38 32 36 Z" fill="#ffc0d8" opacity="0.3" transform="rotate(-20 32 36)" />
            <path d="M10 38 C11 37 12 37.5 11.5 39 Q10.5 39.5 10 38 Z" fill="#ffe0ec" opacity="0.25" transform="rotate(10 10 38)" />
            <path d="M28 42 C29 41 30 41.5 29.5 43 Q28.5 43.5 28 42 Z" fill="#f9a8d4" opacity="0.2" transform="rotate(-35 28 42)" />
            <path d="M14 4 Q14.5 3.5 15 4 L14.5 4.5 Z" fill="#f9a8d4" opacity="0.45" style={{animation: `sakuraFall-${uid} 5s linear 0s infinite`, '--sf-x': '5px'} as React.CSSProperties} />
            <path d="M26 2 C26.5 1.5 27 1.5 27 2 C27 2.5 26.5 3 26 2.5 Z" fill="#ffc0d8" opacity="0.4" style={{animation: `sakuraFall-${uid} 6s linear 1.5s infinite`, '--sf-x': '-6px'} as React.CSSProperties} />
            <path d="M6 8 Q6.5 7.5 7 8 L6.5 8.5 Z" fill="#ffe0ec" opacity="0.45" style={{animation: `sakuraFall-${uid} 4.5s linear 2.8s infinite`, '--sf-x': '4px'} as React.CSSProperties} />
            <path d="M40 6 C40.5 5.5 41 6 40.5 6.5 Z" fill="#f9a8d4" opacity="0.35" style={{animation: `sakuraFall-${uid} 7s linear 0.5s infinite`, '--sf-x': '-7px'} as React.CSSProperties} />
            <path d="M20 3 L20.5 2.5 L21 3 L20.5 3.5 Z" fill="#ffc0d8" opacity="0.35" style={{animation: `sakuraFall-${uid} 5.5s linear 3.5s infinite`, '--sf-x': '3px'} as React.CSSProperties} />
            <path d="M22 46 Q19 44.5 16 46" stroke="#5c4a3a" strokeWidth="0.9" fill="none" opacity="0.25" />
            <path d="M24 46 Q27 44.5 30 46" stroke="#5c4a3a" strokeWidth="0.7" fill="none" opacity="0.2" />
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
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      case 'cherry':
        if (s === 0) return (
          <g>
            <path d="M23 46 Q22.5 42 23.5 37" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M23.5 37 Q20 35 18 36" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M23.5 37 Q27 35 29 36" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M16 35 C14 33 16 31 19 32 C21 33 20 36 17 36 Z" fill={color} opacity="0.6" />
            <path d="M17 34 C16 32 18 31 19 32.5 C20 33 18 35 17 34 Z" fill="#ffb7c5" opacity="0.4" />
            <circle cx="18" cy="34" r="0.3" fill="#fbbf24" opacity="0.5" />
            <path d="M27 35 C29 33 31 34 30 36 C29 37 26 36 27 35 Z" fill={color} opacity="0.55" />
            <path d="M28 34 C29 33 30 33.5 29.5 35 Z" fill="#ffb7c5" opacity="0.35" />
            <circle cx="29" cy="34.5" r="0.25" fill="#fbbf24" opacity="0.4" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M23 46 Q22 40 23 30" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M22.5 38 L23.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23 32 Q18 26 13 24 Q11 24 10 26" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M23 30 Q28 24 33 22 Q35 22 36 24" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 28 Q20 24 17 23" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M10 24 C7 21 8 18 12 18 C16 18 17 22 14 25 C12 27 9 26 10 24 Z" fill={color} opacity="0.7" />
            <path d="M11 21 C10 19 12 18 14 20 C15 21 13 24 11 21 Z" fill={color} opacity="0.5" />
            <path d="M12 22 C11 20 13 19 14 21 Z" fill="#ffb7c5" opacity="0.35" />
            <path d="M33 22 C36 19 38 20 37 23 C36 26 33 26 32 24 Z" fill={color} opacity="0.65" />
            <path d="M34 21 C36 20 37 21 36 23 C35 24 33 23 34 21 Z" fill="#ffb7c5" opacity="0.3" />
            <path d="M18 25 C15 22 17 20 20 22 C22 23 20 27 18 25 Z" fill={color} opacity="0.6" />
            <path d="M28 24 C30 21 32 22 31 25 C30 27 27 26 28 24 Z" fill={color} opacity="0.55" />
            <path d="M23 26 C21 24 23 22 25 24 C27 25 25 28 23 26 Z" fill={color} opacity="0.5" />
            <circle cx="12" cy="22" r="0.3" fill="#fbbf24" opacity="0.4" />
            <circle cx="35" cy="22" r="0.25" fill="#fbbf24" opacity="0.35" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M22 46 Q21 40 22 34 L25 34 Q25.5 40 25 46 Z" fill={trunk} />
            <path d="M22.5 38 L24.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M22 36 Q16 30 10 26 Q8 26 7 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M25 34 Q31 28 37 24 Q39 24 40 26" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M23 34 Q23 28 23 24" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q21 24 19 26 Q18 28 20 28" stroke={trunk} strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M15 28 Q13 26 11 28 Q10 30 12 30" stroke={trunk} strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M7 26 C4 22 6 18 10 18 C15 18 17 23 13 27 C10 30 6 29 7 26 Z" fill={color} opacity="0.7" />
            <path d="M9 24 C7 21 9 19 12 20 C14 22 12 26 9 24 Z" fill={color} opacity="0.55" />
            <path d="M10 22 C8 20 10 18 13 20 C14 22 11 24 10 22 Z" fill="#ffb7c5" opacity="0.25" />
            <path d="M37 24 C40 20 42 22 41 26 C40 29 37 29 35 27 C33 25 35 22 37 24 Z" fill={color} opacity="0.7" />
            <path d="M38 23 C40 21 41 23 40 25 C39 27 37 25 38 23 Z" fill="#ffb7c5" opacity="0.2" />
            <path d="M14 28 C11 25 13 22 17 23 C20 24 19 28 16 29 Z" fill={color} opacity="0.65" />
            <path d="M31 26 C34 23 36 24 35 27 C34 29 31 28 31 26 Z" fill={color} opacity="0.6" />
            <path d="M21 25 C18 22 20 19 24 20 C27 21 26 25 23 26 Z" fill={color} opacity="0.6" />
            <path d="M25 24 C27 21 29 22 28 25 C27 27 24 26 25 24 Z" fill={color} opacity="0.5" />
            <path d="M9 29 L8 30 M9 29 L10 30" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="7.5" cy="30.5" r="1.1" fill="#cc2244" />
            <circle cx="10.5" cy="30.5" r="1.1" fill="#cc2244" />
            <circle cx="7.2" cy="30" r="0.3" fill="#ff6688" opacity="0.35" />
            <path d="M37 27 L36 28 M37 27 L38 28" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="35.5" cy="28.5" r="1.0" fill="#cc2244" />
            <circle cx="38.5" cy="28.5" r="1.0" fill="#cc2244" />
            <circle cx="35.2" cy="28" r="0.3" fill="#ff6688" opacity="0.3" />
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M22 46 Q20.5 40 21.5 34 Q22 30 23 28" fill="none" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            <path d="M22 46 Q20.5 40 21.5 34 Q22 30 23 28" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
            <path d="M23 28 Q16 22 9 18 Q6 18 5 21" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M23 28 Q30 22 37 18 Q40 18 41 21" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M23 28 Q23 22 23 16" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M14 22 Q12 20 10 22 Q9 24 10 25" stroke={trunk} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M32 20 Q34 18 36 20 Q37 22 36 23" stroke={trunk} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M23 20 Q20 18 18 20 Q17 22 18 23" stroke={trunk} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M23 18 Q26 16 28 18 Q29 20 28 21" stroke={trunk} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M5 18 C3 15 4 12 7 11 C10 10 13 12 13 16 C13 19 10 22 7 22 C5 22 4 20 5 18 Z" fill={color} opacity="0.7" />
            <path d="M8 14 C7 12 9 11 11 13 C12 15 10 17 8 14 Z" fill={dark} opacity="0.15" />
            <ellipse cx="10" cy="19" rx="2" ry="1.5" fill="#ffb7c5" opacity="0.3" />
            <path d="M6 16 Q5 14 6.5 13 L8 15 Q7 17 6 16 Z" fill={light} opacity="0.2" />
            <path d="M37 17 C39 14 42 15 42 18 C42 22 39 24 36 23 C34 22 34 19 37 17 Z" fill={color} opacity="0.7" />
            <ellipse cx="39" cy="20" rx="1.5" ry="2" fill={dark} opacity="0.12" />
            <path d="M39 16 C40 15 41 16 41 18 Q40 19 39 16 Z" fill="#ffb7c5" opacity="0.25" />
            <path d="M12 21 C10 18 11 16 14 16 C17 16 19 19 17 22 C15 24 12 24 12 21 Z" fill={color} opacity="0.7" />
            <path d="M14 18 C13 17 15 16 16 18 C17 19 15 21 14 18 Z" fill={dark} opacity="0.1" />
            <ellipse cx="16" cy="22" rx="1.8" ry="1" fill="#ffb7c5" opacity="0.2" />
            <path d="M32 19 C34 16 37 17 37 20 C37 23 34 24 32 22 C31 21 31 20 32 19 Z" fill={color} opacity="0.65" />
            <path d="M34 18 Q35 17 36 18 L35 20 Q34 19 34 18 Z" fill="#ffb7c5" opacity="0.2" />
            <path d="M18 19 C16 17 17 15 20 15 C22 15 23 18 21 20 C19 22 17 21 18 19 Z" fill={color} opacity="0.6" />
            <path d="M28 18 C30 16 32 17 31 19 C30 21 28 21 28 18 Z" fill={color} opacity="0.55" />
            <path d="M21 16 C19 14 21 12 24 12 C26 12 27 15 25 17 C23 19 20 18 21 16 Z" fill={color} opacity="0.55" />
            <path d="M24 14 C22 13 23 12 24.5 12 C26 12 26 14 24 14 Z" fill="#ffb7c5" opacity="0.25" />
            <ellipse cx="26" cy="17" rx="1.5" ry="1" fill={dark} opacity="0.08" />
            <path d="M5.5 22 Q5 21 5 20" stroke={color} strokeWidth="0.4" fill="none" opacity="0.3" />
            <ellipse cx="5" cy="22.5" rx="0.8" ry="1.2" fill={color} opacity="0.3" transform="rotate(-15 5 22.5)" />
            <path d="M41 22 Q41.5 21 41.5 20" stroke={color} strokeWidth="0.4" fill="none" opacity="0.3" />
            <ellipse cx="41.5" cy="22.5" rx="0.7" ry="1.1" fill={color} opacity="0.25" transform="rotate(10 41.5 22.5)" />
            <path d="M10 24 Q9.5 23 9.5 22" stroke={color} strokeWidth="0.3" fill="none" opacity="0.25" />
            <ellipse cx="10" cy="24.5" rx="0.6" ry="1" fill={color} opacity="0.2" />
            <path d="M6 23 L5 24.5 M6 23 L7.5 24.5" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="4.5" cy="25" r="1.2" fill="#cc2244" />
            <circle cx="8" cy="25" r="1.2" fill="#cc2244" />
            <circle cx="4.2" cy="24.5" r="0.35" fill="#ff6688" opacity="0.35" />
            <path d="M40 23 L39 24.5 M40 23 L41.5 24.5" stroke={dark} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="38.5" cy="25" r="1.2" fill="#cc2244" />
            <circle cx="42" cy="25" r="1.1" fill="#cc2244" />
            <circle cx="38.2" cy="24.5" r="0.35" fill="#ff6688" opacity="0.35" />
            <path d="M11 25 L10 26.5 M11 25 L12 26.5" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="9.5" cy="27" r="1.1" fill="#cc2244" />
            <circle cx="12.5" cy="27" r="1.0" fill="#cc2244" />
            <circle cx="9.2" cy="26.5" r="0.3" fill="#ff6688" opacity="0.3" />
            <path d="M35 23 L34 24.5 M35 23 L36 24.5" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="33.5" cy="25" r="1.0" fill="#cc2244" />
            <circle cx="36.5" cy="25" r="1.0" fill="#cc2244" />
            <path d="M18 22 L17 23.5 M18 22 L19.5 23.5" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="16.5" cy="24" r="0.9" fill="#cc2244" opacity="0.8" />
            <circle cx="20" cy="24" r="0.9" fill="#cc2244" opacity="0.8" />
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
            <path d="M21 46 C19 45 17 45 15 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 C27 45 29 45 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      case 'apple':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 36" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23.5 41 L24.8 40.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <ellipse cx="24" cy="39" rx="0.5" ry="0.7" fill={dark} opacity="0.15" />
            <path d="M24 38 C20 35 17 33 18 36 C19 38 22 37 24 38 Z" fill={color} opacity="0.7" />
            <path d="M24 38 C28 35 31 33 30 36 C29 38 26 37 24 38 Z" fill={color} opacity="0.6" />
            <path d="M21 35 C20 34 21 33 22 34.5 Z" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M22.5 46 L22.5 28 L25.5 28 L25.5 46 Z" fill={trunk} />
            <path d="M23 42 L25 41.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <ellipse cx="24" cy="36" rx="0.7" ry="1" fill={dark} opacity="0.2" />
            <path d="M23 30 Q18 26 15 24" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M25 30 Q30 26 33 24" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M12 16 C8 10 12 5 20 5 C24 5 28 6 32 8 C38 12 36 20 30 24 C26 26 18 26 14 22 C10 19 10 17 12 16 Z" fill={color} />
            <path d="M16 12 C13 9 16 6 22 7 C26 8 28 10 26 14 C24 17 18 16 16 12 Z" fill={color} opacity="0.8" />
            <path d="M28 14 C30 10 34 12 33 16 C32 20 28 20 28 14 Z" fill={color} opacity="0.7" />
            <path d="M18 10 C16 8 18 6 21 8 C23 10 20 12 18 10 Z" fill={light} opacity="0.15" />
            <path d="M28 20 C30 18 32 19 31 21 Z" fill={dark} opacity="0.1" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M21 46 Q20.5 40 21 34 L27 34 Q27.5 40 27 46 Z" fill={trunk} />
            <path d="M23 42 L26 41.8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            <ellipse cx="24" cy="38" rx="0.8" ry="1.2" fill={dark} opacity="0.2" />
            <ellipse cx="23" cy="42" rx="0.5" ry="0.8" fill={dark} opacity="0.15" />
            <path d="M22 36 Q15 30 11 28" stroke={trunk} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M26 34 Q32 28 37 26" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q24 28 24 24" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M10 14 C6 7 11 1 20 2 C24 2 28 3 33 6 C40 10 38 20 32 24 C28 27 18 28 12 24 C7 20 7 16 10 14 Z" fill={color} />
            <path d="M14 10 C10 6 14 2 22 3 C28 4 30 8 28 14 C26 18 18 18 14 10 Z" fill={color} opacity="0.8" />
            <path d="M30 12 C33 8 38 10 36 16 C34 20 30 20 30 12 Z" fill={color} opacity="0.7" />
            <path d="M18 8 C16 5 18 3 22 5 C24 7 20 10 18 8 Z" fill={light} opacity="0.15" />
            <path d="M30 20 C32 18 35 19 34 22 Z" fill={dark} opacity="0.1" />
            <circle cx="14" cy="22" r="1.6" fill="#cc3333" />
            <path d="M14 20.5 L14.2 19.5" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M14.2 19.5 Q15.2 19 14.8 20" fill="#4a8c3a" opacity="0.6" />
            <circle cx="13.3" cy="21.5" r="0.4" fill="#ff6666" opacity="0.3" />
            <circle cx="33" cy="20" r="1.5" fill="#cc3333" />
            <path d="M33 18.5 L33.2 17.5" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M33.2 17.5 Q34.2 17 33.8 18" fill="#4a8c3a" opacity="0.6" />
            <circle cx="32.3" cy="19.5" r="0.35" fill="#ff6666" opacity="0.3" />
            <path d="M21 46 Q18 45 15 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M27 46 Q30 45 33 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M20 46 Q19 40 20 34 Q20.5 30 22 28" fill="none" stroke={trunk} strokeWidth="5.5" strokeLinecap="round" />
            <path d="M20 46 Q19 40 20 34 Q20.5 30 22 28" fill="none" stroke={dark} strokeWidth="2" opacity="0.12" strokeLinecap="round" />
            <ellipse cx="22" cy="38" rx="1" ry="1.5" fill={dark} opacity="0.2" />
            <ellipse cx="21" cy="42" rx="0.7" ry="1" fill={dark} opacity="0.18" />
            <ellipse cx="23" cy="34" rx="0.6" ry="0.9" fill={dark} opacity="0.15" />
            <path d="M21 32 Q14 26 9 22" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M23 30 Q30 24 36 20" stroke={trunk} strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <path d="M22 28 Q22 22 22 16" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M6 14 C1 4 8 -3 18 -2 C24 -2 30 0 36 4 C44 10 42 22 34 28 C28 32 16 32 10 26 C4 22 3 17 6 14 Z" fill={color} />
            <path d="M10 10 C6 4 10 -1 20 0 C26 1 30 4 28 10 C26 16 16 18 12 14 C8 10 8 8 10 10 Z" fill={color} opacity="0.8" />
            <path d="M30 8 C34 2 40 6 38 14 C36 20 30 22 28 16 C26 10 28 6 30 8 Z" fill={color} opacity="0.75" />
            <path d="M8 6 C4 2 8 -2 14 0 C18 2 16 6 12 8 C9 9 6 8 8 6 Z" fill={color} opacity="0.7" />
            <path d="M34 4 C38 0 42 4 40 10 C38 14 34 14 34 4 Z" fill={color} opacity="0.65" />
            <path d="M18 6 C15 2 18 -1 22 2 C25 4 22 8 18 6 Z" fill={light} opacity="0.12" />
            <path d="M30 22 C33 19 36 20 35 24 C34 26 30 25 30 22 Z" fill={dark} opacity="0.1" />
            <circle cx="10" cy="22" r="1.8" fill="#cc3333" />
            <path d="M10 20.3 L10.2 19" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M10.2 19 Q11.2 18.5 10.8 19.5" fill="#4a8c3a" opacity="0.6" />
            <circle cx="9.2" cy="21.5" r="0.45" fill="#ff6666" opacity="0.3" />
            <circle cx="36" cy="20" r="1.8" fill="#cc3333" />
            <path d="M36 18.3 L36.2 17" stroke={trunk} strokeWidth="0.5" strokeLinecap="round" />
            <path d="M36.2 17 Q37.2 16.5 36.8 17.5" fill="#4a8c3a" opacity="0.6" />
            <circle cx="35.2" cy="19.5" r="0.45" fill="#ff6666" opacity="0.3" />
            <circle cx="16" cy="26" r="1.6" fill="#cc3333" />
            <path d="M16 24.5 L16.2 23.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <path d="M16.2 23.5 Q17 23 16.6 24" fill="#4a8c3a" opacity="0.5" />
            <circle cx="32" cy="24" r="1.6" fill="#cc3333" />
            <path d="M32 22.5 L32.2 21.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <path d="M32.2 21.5 Q33 21 32.6 22" fill="#4a8c3a" opacity="0.5" />
            <circle cx="24" cy="18" r="1.4" fill="#cc3333" opacity="0.8" />
            <path d="M24 16.5 L24.2 15.5" stroke={trunk} strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="20" cy="12" r="1.2" fill="#cc3333" opacity="0.7" />
            <circle cx="30" cy="10" r="1.1" fill="#cc3333" opacity="0.65" />
            <path d="M19 46 Q16 44.5 13 46" stroke={trunk} strokeWidth="1.2" fill="none" opacity="0.3" />
            <path d="M27 46 Q30 44.5 33 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.25" />
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
            <path d="M26 46 Q28 40 27 30" stroke={trunk} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M26.5 38 L27.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M27 34 Q20 30 14 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M27 32 Q31 30 34 29" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M8 18 C7 12 11 8 18 7 Q22 6.5 26 8 C32 10 34 14 33 20 C34 26 30 30 24 30 Q18 30 14 28 C9 26 7 22 8 18 Z" fill={color} />
            <path d="M14 12 C12 9 15 7 19 8 C22 9 22 13 18 15 Z" fill={light} opacity="0.2" />
            <path d="M28 22 C30 19 33 20 32 24 Z" fill={dark} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M25 46 Q27 40 26 34 L29 34 Q30 40 28 46 Z" fill={trunk} />
            <path d="M26 38 L29 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M26 36 Q18 30 10 28" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M29 34 Q33 30 37 29" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M27 34 Q24 28 20 26" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
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
            <path d="M26 46 Q29 40 28 34 Q27 30 26 28" fill="none" stroke={trunk} strokeWidth="4.5" strokeLinecap="round" />
            <path d="M26 46 Q29 40 28 34 Q27 30 26 28" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
            <path d="M26 30 Q18 24 10 20" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M27 28 Q33 24 38 22" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M26 28 Q22 22 18 20" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M26 28 Q26 22 26 16" stroke={trunk} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M11 20 Q8 18 6 20" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M3 12 C2 6 6 1 14 0 Q19 -0.5 24 1 C28 2 32 4 36 8 C40 12 40 20 38 26 C36 30 32 32 28 32 Q22 33 16 30 C10 27 6 22 4 18 C3 16 3 14 3 12 Z" fill={color} />
            <path d="M3 10 Q2 8 3 6 C4 4 6 2 8 4 C10 6 8 10 5 10 Z" fill={color} />
            <path d="M6 14 C5 11 7 9 10 10 C12 11 12 14 9 15 Z" fill={dark} opacity="0.12" />
            <ellipse cx="18" cy="8" rx="5" ry="3" fill={light} opacity="0.12" />
            <path d="M14 6 C12 4 14 2 17 3 Q20 4 20 7 C18 9 14 8 14 6 Z" fill={color} opacity="0.8" />
            <path d="M30 10 C32 7 36 8 36 12 C36 15 33 17 30 15 C28 14 28 12 30 10 Z" fill={dark} opacity="0.1" />
            <ellipse cx="22" cy="24" rx="6" ry="3" fill={dark} opacity="0.1" />
            <path d="M36 20 C38 17 40 18 39 22 C38 24 36 24 36 20 Z" fill={color} opacity="0.7" />
            <path d="M10 22 C8 20 10 18 12 20 C14 22 12 24 10 22 Z" fill={light} opacity="0.1" />
            <path d="M8 20 L8.5 22" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="8" cy="23" r="1.4" fill="#6b2fa0" />
            <circle cx="9.5" cy="23.5" r="1.3" fill="#6b2fa0" opacity="0.9" />
            <path d="M7.5 21.8 Q8 23 7.8 24.2" stroke="#4a1870" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M8 21.8 L8.2 21" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="7.3" cy="22.5" r="0.4" fill="#9b5fc0" opacity="0.35" />
            <path d="M14 28 L14.5 30" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="14.5" cy="31" r="1.3" fill="#6b2fa0" />
            <circle cx="15.8" cy="31.5" r="1.3" fill="#6b2fa0" opacity="0.85" />
            <path d="M14 29.8 Q14.5 31 14.3 32.2" stroke="#4a1870" strokeWidth="0.3" fill="none" opacity="0.25" />
            <path d="M14.5 29.8 L14.7 29" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="13.8" cy="30.5" r="0.35" fill="#9b5fc0" opacity="0.3" />
            <path d="M36 18 L36.5 20" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="36.5" cy="21" r="1.4" fill="#6b2fa0" />
            <circle cx="37.8" cy="21.5" r="1.3" fill="#6b2fa0" opacity="0.9" />
            <path d="M36 19.8 Q36.5 21 36.3 22.2" stroke="#4a1870" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M36.5 19.8 L36.7 19" stroke={dark} strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="35.8" cy="20.5" r="0.4" fill="#9b5fc0" opacity="0.35" />
            <path d="M24 16 L24.5 18" stroke={dark} strokeWidth="0.25" strokeLinecap="round" />
            <circle cx="24.5" cy="19" r="1.3" fill="#6b2fa0" opacity="0.8" />
            <circle cx="25.5" cy="19.5" r="1.2" fill="#6b2fa0" opacity="0.7" />
            <path d="M24 17.8 Q24.5 19 24.3 20.2" stroke="#4a1870" strokeWidth="0.25" fill="none" opacity="0.25" />
            <path d="M24.5 17.8 L24.7 17" stroke={dark} strokeWidth="0.25" strokeLinecap="round" />
            <path d="M20 10 L20.5 12" stroke={dark} strokeWidth="0.25" strokeLinecap="round" />
            <circle cx="20.5" cy="13" r="1.2" fill="#6b2fa0" opacity="0.65" />
            <path d="M20 11.8 Q20.5 13 20.3 14.2" stroke="#4a1870" strokeWidth="0.25" fill="none" opacity="0.2" />
            <path d="M20.5 11.8 L20.7 11" stroke={dark} strokeWidth="0.25" strokeLinecap="round" />
            <path d="M25 46 Q22 44.5 19 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M29 46 Q32 44.5 35 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      case 'blackberry':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q22 44 20 43" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q26 44 28 43" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M22 44 L21.5 43.5" stroke={dark} strokeWidth="0.4" opacity="0.4" />
            <path d="M26 44 L26.5 43.5" stroke={dark} strokeWidth="0.4" opacity="0.4" />
            <path d="M17 42 C15 40 16 38 20 39 C23 40 22 43 19 43 Z" fill={color} opacity="0.6" />
            <path d="M31 42 C33 40 32 38 28 39 C25 40 26 43 29 43 Z" fill={color} opacity="0.55" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q20 42 16 40 Q14 39 12 40" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q28 42 32 40 Q34 39 36 40" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24 42 24 39" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M20 42 L19.3 41.3" stroke={dark} strokeWidth="0.4" opacity="0.4" />
            <path d="M28 42 L28.7 41.3" stroke={dark} strokeWidth="0.4" opacity="0.4" />
            <path d="M16 40 L15.5 39.3" stroke={dark} strokeWidth="0.4" opacity="0.35" />
            <path d="M32 40 L32.5 39.3" stroke={dark} strokeWidth="0.4" opacity="0.35" />
            <path d="M10 39 C7 36 9 33 14 34 C18 35 19 38 16 40 C13 42 9 41 10 39 Z" fill={color} opacity="0.65" />
            <path d="M38 39 C41 36 39 33 34 34 C30 35 29 38 32 40 C35 42 39 41 38 39 Z" fill={color} opacity="0.6" />
            <path d="M22 38 C19 35 21 33 25 34 C28 35 27 38 24 39 Z" fill={color} opacity="0.7" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 Q18 42 12 40 Q8 39 6 41" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q30 42 36 40 Q40 39 42 41" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q22 42 18 40" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q26 42 30 40" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M16 41 L15.3 40.3" stroke={dark} strokeWidth="0.5" opacity="0.4" />
            <path d="M32 41 L32.7 40.3" stroke={dark} strokeWidth="0.5" opacity="0.4" />
            <path d="M10 40 L9.3 39.3" stroke={dark} strokeWidth="0.5" opacity="0.35" />
            <path d="M38 40 L38.7 39.3" stroke={dark} strokeWidth="0.5" opacity="0.35" />
            <path d="M3 40 C0 36 3 32 9 33 C14 34 16 38 12 41 C9 43 4 43 3 40 Z" fill={color} opacity="0.7" />
            <path d="M45 40 C48 36 45 32 39 33 C34 34 32 38 36 41 C39 43 44 43 45 40 Z" fill={color} opacity="0.65" />
            <path d="M14 39 C11 36 13 33 18 34 C22 35 22 38 18 40 Z" fill={color} opacity="0.75" />
            <path d="M34 39 C37 36 35 33 30 34 C26 35 26 38 30 40 Z" fill={color} opacity="0.7" />
            <path d="M22 40 C19 37 21 34 26 35 C30 36 29 40 25 42 Z" fill={color} opacity="0.8" />
            <circle cx="8" cy="38" r="0.7" fill="#2d1b4e" />
            <circle cx="9" cy="37.5" r="0.65" fill="#2d1b4e" />
            <circle cx="8.5" cy="38.5" r="0.6" fill="#2d1b4e" />
            <circle cx="7.5" cy="37.8" r="0.55" fill="#cc3333" opacity="0.7" />
            <circle cx="40" cy="38" r="0.7" fill="#2d1b4e" />
            <circle cx="41" cy="37.5" r="0.65" fill="#cc3333" opacity="0.6" />
            <circle cx="40.5" cy="38.5" r="0.6" fill="#2d1b4e" />
          </g>
        )
        return (
          <g>
            <path d="M4 42 C4 38 6 34 10 32 C14 30 18 30 22 31 C26 30 30 30 34 31 C38 32 42 34 44 38 C46 42 44 46 40 46 L8 46 C4 46 3 44 4 42 Z" fill={color} opacity="0.75" />
            <path d="M8 40 C8 36 12 32 18 31 C22 30 26 31 28 33 C24 35 18 36 14 38 C10 40 8 42 8 40 Z" fill={dark} opacity="0.12" />
            <path d="M36 40 C36 36 34 33 30 32 C28 31 26 31 24 32 C28 34 32 36 35 38 C38 40 38 42 36 40 Z" fill={dark} opacity="0.1" />
            <ellipse cx="16" cy="34" rx="4" ry="2.5" fill={light} opacity="0.12" />
            <ellipse cx="32" cy="35" rx="3.5" ry="2" fill={light} opacity="0.1" />
            <path d="M6 38 Q7 36 9 35 Q8 37 6 38 Z" fill={color} opacity="0.5" />
            <path d="M42 38 Q41 36 39 35 Q40 37 42 38 Z" fill={color} opacity="0.45" />
            <path d="M12 31 Q11 30 12 29 Q13 30 12 31 Z" fill={color} />
            <path d="M20 30 Q19 29 20 28 Q21 29 20 30 Z" fill={color} />
            <path d="M28 30 Q27 29 28 28 Q29 29 28 30 Z" fill={color} />
            <path d="M36 31 Q35 30 36 29 Q37 30 36 31 Z" fill={color} />
            <path d="M16 31 Q15.5 30 16.5 29.5 Q17 30.5 16 31 Z" fill={color} />
            <path d="M32 31 Q31.5 30 32.5 29.5 Q33 30.5 32 31 Z" fill={color} />
            <path d="M24 30 Q23 29 24 28 Q25 29 24 30 Z" fill={color} />
            <path d="M24 46 Q16 40 8 36 Q4 35 3 38" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q32 40 40 36 Q44 35 45 38" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q20 40 14 38 Q10 37 8 39" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q28 40 34 38 Q38 37 40 39" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M6 36 L5 35" stroke={dark} strokeWidth="0.6" opacity="0.5" strokeLinecap="round" />
            <path d="M10 34 L9 33" stroke={dark} strokeWidth="0.5" opacity="0.45" strokeLinecap="round" />
            <path d="M38 34 L39 33" stroke={dark} strokeWidth="0.5" opacity="0.45" strokeLinecap="round" />
            <path d="M42 36 L43 35" stroke={dark} strokeWidth="0.6" opacity="0.5" strokeLinecap="round" />
            <path d="M16 33 L15 32" stroke={dark} strokeWidth="0.4" opacity="0.35" strokeLinecap="round" />
            <path d="M32 33 L33 32" stroke={dark} strokeWidth="0.4" opacity="0.35" strokeLinecap="round" />
            <path d="M20 32 L19.5 31" stroke={dark} strokeWidth="0.4" opacity="0.3" strokeLinecap="round" />
            <path d="M28 32 L28.5 31" stroke={dark} strokeWidth="0.4" opacity="0.3" strokeLinecap="round" />
            <circle cx="9" cy="34" r="0.8" fill="#2d1b4e" />
            <circle cx="10" cy="33.5" r="0.75" fill="#2d1b4e" />
            <circle cx="9.5" cy="34.5" r="0.7" fill="#2d1b4e" />
            <circle cx="8.5" cy="33.8" r="0.65" fill="#cc3333" opacity="0.7" />
            <circle cx="18" cy="32" r="0.85" fill="#2d1b4e" />
            <circle cx="19" cy="31.5" r="0.8" fill="#2d1b4e" />
            <circle cx="18.5" cy="32.5" r="0.75" fill="#2d1b4e" />
            <circle cx="17.5" cy="32" r="0.5" fill="#cc3333" opacity="0.6" />
            <circle cx="24" cy="33" r="0.9" fill="#2d1b4e" />
            <circle cx="25" cy="32.5" r="0.85" fill="#2d1b4e" />
            <circle cx="24.5" cy="33.5" r="0.8" fill="#2d1b4e" />
            <circle cx="23.5" cy="33" r="0.7" fill="#2d1b4e" />
            <circle cx="30" cy="32" r="0.85" fill="#2d1b4e" />
            <circle cx="31" cy="31.5" r="0.8" fill="#cc3333" opacity="0.7" />
            <circle cx="30.5" cy="32.5" r="0.75" fill="#2d1b4e" />
            <circle cx="29.5" cy="32" r="0.65" fill="#2d1b4e" />
            <circle cx="39" cy="34" r="0.8" fill="#2d1b4e" />
            <circle cx="40" cy="33.5" r="0.75" fill="#2d1b4e" />
            <circle cx="39.5" cy="34.5" r="0.7" fill="#2d1b4e" />
          </g>
        )

      case 'peach':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 36" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M23.5 40 L24.5 40" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M24 38 C20 35 17 33 18 36 C19 38 22 37 24 38 Z" fill={color} opacity="0.7" />
            <path d="M24 38 C28 35 31 33 30 36 C29 38 26 37 24 38 Z" fill={color} opacity="0.6" />
            <path d="M24 31 C23 29 23.5 28 24 28 C24.5 28 25 29 24 31 Z" fill="#ffb7c5" opacity="0.5" />
            <circle cx="24" cy="29.5" r="0.4" fill="#fbbf24" opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23.5 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M24 34 Q16 28 10 24" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q32 26 38 22" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q20 24 16 20" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q28 24 32 20" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M7 22 C4 18 7 14 12 16 C16 17 16 22 12 24 C9 26 6 24 7 22 Z" fill={color} opacity="0.7" />
            <path d="M36 20 C39 16 38 12 33 14 C30 15 29 20 33 22 C36 24 38 22 36 20 Z" fill={color} opacity="0.65" />
            <path d="M14 18 C11 15 14 12 18 14 C21 15 20 19 16 20 Z" fill={color} opacity="0.6" />
            <path d="M30 18 C33 15 32 12 28 14 C25 15 26 19 30 18 Z" fill={color} opacity="0.55" />
            <path d="M22 22 C19 19 21 16 25 18 C28 19 27 23 24 24 Z" fill={color} opacity="0.6" />
            <path d="M14 20 C13 18.5 13.5 17.5 14.5 18 C15 18.5 14.5 20 14 20 Z" fill="#ffb7c5" opacity="0.45" />
            <circle cx="14" cy="19" r="0.3" fill="#fbbf24" opacity="0.35" />
            <path d="M34 18 C33 16.5 33.5 15.5 34.5 16 C35 16.5 34.5 18 34 18 Z" fill="#ffb7c5" opacity="0.4" />
            <circle cx="34" cy="17" r="0.25" fill="#fbbf24" opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <radialGradient id={`${uid}-peach`} cx="35%" cy="35%">
                <stop offset="0%" stopColor="#ffe0b2" />
                <stop offset="60%" stopColor="#ffab76" />
                <stop offset="100%" stopColor="#ff8a50" />
              </radialGradient>
            </defs>
            <path d="M22 46 Q21.5 40 22 34 L26 34 Q26.5 40 26 46 Z" fill={trunk} />
            <path d="M23 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M22 36 Q12 28 6 22" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M26 34 Q36 26 42 20" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q18 26 12 20" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q30 26 36 20" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q24 26 24 18" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M3 20 C0 15 3 10 9 12 C14 13 15 19 10 22 C7 24 3 23 3 20 Z" fill={color} opacity="0.7" />
            <path d="M7 18 C5 15 7 12 11 14 C14 16 12 20 8 20 Z" fill={color} opacity="0.6" />
            <path d="M39 18 C42 14 41 10 36 12 C32 13 31 18 36 20 C39 22 42 20 39 18 Z" fill={color} opacity="0.65" />
            <path d="M37 16 C39 14 38 12 35 13 C33 14 34 17 37 16 Z" fill={color} opacity="0.55" />
            <path d="M10 18 C7 14 10 10 16 12 C20 14 19 18 14 20 Z" fill={color} opacity="0.65" />
            <path d="M34 18 C37 14 36 10 31 12 C28 14 29 18 34 18 Z" fill={color} opacity="0.6" />
            <path d="M20 20 C17 16 19 13 24 14 C28 15 27 20 23 22 Z" fill={color} opacity="0.6" />
            <path d="M28 20 C31 16 30 13 26 14 C23 15 24 20 28 20 Z" fill={color} opacity="0.55" />
            <circle cx="8" cy="20" r="2.2" fill={color} opacity="0.12" />
            <circle cx="8" cy="20" r="1.8" fill={`url(#${uid}-peach)`} />
            <path d="M7.5 18.5 Q8 20 7.8 21.5" stroke="#e06030" strokeWidth="0.3" fill="none" opacity="0.3" />
            <circle cx="7.2" cy="19.2" r="0.4" fill="white" opacity="0.22" />
            <circle cx="38" cy="18" r="2" fill={color} opacity="0.12" />
            <circle cx="38" cy="18" r="1.6" fill={`url(#${uid}-peach)`} />
            <path d="M37.5 16.5 Q38 18 37.8 19.5" stroke="#e06030" strokeWidth="0.3" fill="none" opacity="0.3" />
            <circle cx="37.2" cy="17.2" r="0.35" fill="white" opacity="0.2" />
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-peach`} cx="35%" cy="35%">
                <stop offset="0%" stopColor="#ffe0b2" />
                <stop offset="60%" stopColor="#ffab76" />
                <stop offset="100%" stopColor="#ff8a50" />
              </radialGradient>
            </defs>
            <path d="M22 46 Q21.5 42 22 36 Q22.5 32 23 30" fill="none" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            <path d="M22 46 Q21.5 42 22 36 Q22.5 32 23 30" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
            <path d="M23 32 Q12 24 4 16" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M23 30 Q34 22 44 14" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M23 30 Q16 22 10 16" stroke={trunk} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M23 30 Q30 22 38 14" stroke={trunk} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M23 30 Q23 22 23 14" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M23 28 Q19 24 15 22" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M23 28 Q27 24 31 22" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M1 14 C-1 10 1 6 6 6 C10 6 14 9 14 14 C14 18 11 20 7 20 C3 20 1 18 1 14 Z" fill={color} opacity="0.7" />
            <ellipse cx="8" cy="11" rx="3" ry="2" fill={light} opacity="0.15" />
            <path d="M4 16 C3 14 5 13 7 14 C8 15 6 17 4 16 Z" fill={dark} opacity="0.12" />
            <path d="M40 11 C43 8 44 10 44 14 C44 17 42 19 39 18 C36 17 37 13 40 11 Z" fill={color} opacity="0.65" />
            <ellipse cx="42" cy="13" rx="1.5" ry="2.5" fill={dark} opacity="0.1" />
            <path d="M8 13 C5 9 8 5 14 7 C18 8 19 13 15 16 C12 18 8 17 8 13 Z" fill={color} opacity="0.7" />
            <path d="M11 9 C10 8 11 7 13 8 C14 9 13 11 11 9 Z" fill={light} opacity="0.12" />
            <path d="M36 11 C38 7 38 4 34 5 C30 6 30 11 34 13 Z" fill={color} opacity="0.6" />
            <path d="M14 18 C12 15 13 12 17 12 C21 12 23 16 20 19 C17 22 13 21 14 18 Z" fill={color} opacity="0.65" />
            <ellipse cx="18" cy="15" rx="2" ry="1.5" fill={dark} opacity="0.1" />
            <path d="M30 18 C33 14 33 11 29 11 C25 11 24 15 27 18 C29 20 32 20 30 18 Z" fill={color} opacity="0.6" />
            <path d="M20 14 C18 10 20 7 25 8 C30 9 31 14 27 17 C24 19 19 18 20 14 Z" fill={color} opacity="0.6" />
            <path d="M23 10 C21 9 22 8 24 8 C26 8 27 10 25 11 Z" fill={light} opacity="0.1" />
            <path d="M15 23 C13 20 15 17 18 18 C21 19 21 23 18 25 Z" fill={color} opacity="0.55" />
            <ellipse cx="19" cy="22" rx="1.5" ry="1" fill={dark} opacity="0.08" />
            <path d="M31 23 C33 20 32 17 28 18 C25 19 25 23 28 25 Z" fill={color} opacity="0.5" />
            <path d="M2 16 Q1 15 2 13" stroke={color} strokeWidth="0.4" fill="none" opacity="0.3" />
            <ellipse cx="2" cy="17.5" rx="0.6" ry="1" fill={color} opacity="0.3" />
            <path d="M44 15 Q45 14 44 13" stroke={color} strokeWidth="0.4" fill="none" opacity="0.3" />
            <ellipse cx="44.5" cy="16" rx="0.5" ry="0.9" fill={color} opacity="0.25" />
            <circle cx="6" cy="14" r="2.4" fill={color} opacity="0.12" />
            <circle cx="6" cy="14" r="2" fill={`url(#${uid}-peach)`} />
            <path d="M5.5 12.2 Q6 14 5.8 15.8" stroke="#e06030" strokeWidth="0.3" fill="none" opacity="0.3" />
            <circle cx="5.2" cy="13.2" r="0.45" fill="white" opacity="0.22" />
            <circle cx="42" cy="12" r="2.2" fill={color} opacity="0.12" />
            <circle cx="42" cy="12" r="1.8" fill={`url(#${uid}-peach)`} />
            <path d="M41.5 10.2 Q42 12 41.8 13.8" stroke="#e06030" strokeWidth="0.3" fill="none" opacity="0.3" />
            <circle cx="41.2" cy="11.2" r="0.4" fill="white" opacity="0.22" />
            <circle cx="14" cy="18" r="2" fill={color} opacity="0.12" />
            <circle cx="14" cy="18" r="1.6" fill={`url(#${uid}-peach)`} />
            <path d="M13.5 16.5 Q14 18 13.8 19.5" stroke="#e06030" strokeWidth="0.3" fill="none" opacity="0.25" />
            <circle cx="13.2" cy="17.2" r="0.35" fill="white" opacity="0.2" />
            <circle cx="34" cy="16" r="2" fill={color} opacity="0.12" />
            <circle cx="34" cy="16" r="1.6" fill={`url(#${uid}-peach)`} />
            <path d="M33.5 14.5 Q34 16 33.8 17.5" stroke="#e06030" strokeWidth="0.3" fill="none" opacity="0.25" />
            <circle cx="33.2" cy="15.2" r="0.35" fill="white" opacity="0.2" />
            <circle cx="23" cy="20" r="1.8" fill={color} opacity="0.1" />
            <circle cx="23" cy="20" r="1.5" fill={`url(#${uid}-peach)`} opacity="0.8" />
            <circle cx="19" cy="14" r="1.3" fill={`url(#${uid}-peach)`} opacity="0.7" />
            <circle cx="29" cy="12" r="1.2" fill={`url(#${uid}-peach)`} opacity="0.65" />
            <path d="M21 46 Q18 44.5 15 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M26 46 Q29 44.5 32 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      case 'pineapple':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q22 44 20 43 L20.5 42.5 L19.5 42 L20 41.5 L21 43 Q23 44 24 46 Z" fill="#5a8c3f" opacity="0.7" />
            <path d="M24 46 Q26 44 28 43 L27.5 42.5 L28.5 42 L28 41.5 L27 43 Q25 44 24 46 Z" fill="#4a7c35" opacity="0.65" />
            <path d="M24 46 Q24 44 24 42 L24.5 41 L23.5 40.5 L24 40 Q24 43 24 46 Z" fill="#5a8c3f" opacity="0.55" />
            <path d="M22 44 L20.5 42" stroke="#3a6a25" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M26 44 L27.5 42" stroke="#3a6a25" strokeWidth="0.3" fill="none" opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 Q20 44 16 43 L16.5 42 L15.5 41.5 L16 41 L17 42 Q21 44 24 46 Z" fill="#5a8c3f" opacity="0.7" />
            <path d="M24 46 Q28 44 32 43 L31.5 42 L32.5 41.5 L32 41 L31 42 Q27 44 24 46 Z" fill="#4a7c35" opacity="0.65" />
            <path d="M24 46 Q22 44 18 42 L18.5 41 L17.5 40.5 L18 40 L19 41 Q22 43 24 46 Z" fill="#5a8c3f" opacity="0.6" />
            <path d="M24 46 Q26 44 30 42 L29.5 41 L30.5 40.5 L30 40 L29 41 Q26 43 24 46 Z" fill="#4a7c35" opacity="0.55" />
            <path d="M24 46 Q24 44 24 40 L24.5 39 L23.5 38.5 L24 38 Q24 42 24 46 Z" fill="#6ab04c" opacity="0.5" />
            <path d="M20 44 L16.5 42" stroke="#3a6a25" strokeWidth="0.3" fill="none" opacity="0.25" />
            <path d="M28 44 L31.5 42" stroke="#3a6a25" strokeWidth="0.3" fill="none" opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            <defs>
              <linearGradient id={`${uid}-pine`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4a017" />
                <stop offset="100%" stopColor="#b8860b" />
              </linearGradient>
            </defs>
            <path d="M24 46 Q18 44 12 43 L12.5 42 L11.5 41.5 L12 41 L13 42 Q19 44 24 46 Z" fill="#5a8c3f" opacity="0.7" />
            <path d="M24 46 Q30 44 36 43 L35.5 42 L36.5 41.5 L36 41 L35 42 Q29 44 24 46 Z" fill="#4a7c35" opacity="0.65" />
            <path d="M24 46 Q20 44 14 42 L14.5 41 L13.5 40.5 L14 40 L15 41 Q21 43 24 46 Z" fill="#5a8c3f" opacity="0.6" />
            <path d="M24 46 Q28 44 34 42 L33.5 41 L34.5 40.5 L34 40 L33 41 Q27 43 24 46 Z" fill="#4a7c35" opacity="0.55" />
            <path d="M24 46 Q22 44 20 40 L20.5 39 L19.5 38.5 L20 38 L21 39 Q23 43 24 46 Z" fill="#5a8c3f" opacity="0.55" />
            <path d="M24 46 Q26 44 28 40 L27.5 39 L28.5 38.5 L28 38 L27 39 Q25 43 24 46 Z" fill="#4a7c35" opacity="0.5" />
            <path d="M18 44 L12.5 42" stroke="#3a6a25" strokeWidth="0.3" fill="none" opacity="0.2" />
            <path d="M30 44 L35.5 42" stroke="#3a6a25" strokeWidth="0.3" fill="none" opacity="0.2" />
            <ellipse cx="24" cy="38" rx="4" ry="5.5" fill={`url(#${uid}-pine)`} transform="rotate(-5 24 38)" />
            <path d="M21 35 L23 37.5 L21 40" stroke="#a0780a" strokeWidth="0.4" fill="none" opacity="0.4" />
            <path d="M23 34 L25 36.5 L23 39" stroke="#a0780a" strokeWidth="0.4" fill="none" opacity="0.35" />
            <path d="M25 35 L27 37.5 L25 40" stroke="#a0780a" strokeWidth="0.4" fill="none" opacity="0.4" />
            <path d="M20.5 37 L24 35 L27.5 37" stroke="#a0780a" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M20.5 39 L24 37 L27.5 39" stroke="#a0780a" strokeWidth="0.3" fill="none" opacity="0.3" />
            <path d="M24 33 Q23 32 22.5 31 L23 31.5 L22.5 30.5 L23.5 32 Z" fill="#5a8c3f" opacity="0.7" />
            <path d="M24 33 Q25 32 25.5 31 L25 31.5 L25.5 30.5 L24.5 32 Z" fill="#4a7c35" opacity="0.65" />
            <path d="M24 33 Q24 31.5 24 30" stroke="#5a8c3f" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.6" />
            <ellipse cx="23" cy="36" rx="1" ry="0.8" fill="#e8c040" opacity="0.25" />
          </g>
        )
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-pine`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4a017" />
                <stop offset="100%" stopColor="#b8860b" />
              </linearGradient>
            </defs>
            <path d="M24 46 Q16 44 8 43 L8.5 42 L7.5 41.5 L8 41 L9 42 Q17 43 24 46 Z" fill="#5a8c3f" opacity="0.75" />
            <path d="M24 46 Q32 44 40 43 L39.5 42 L40.5 41.5 L40 41 L39 42 Q31 43 24 46 Z" fill="#4a7c35" opacity="0.7" />
            <path d="M24 46 Q18 44 10 42 L10.5 41 L9.5 40.5 L10 40 L11 41 Q19 43 24 46 Z" fill="#5a8c3f" opacity="0.65" />
            <path d="M24 46 Q30 44 38 42 L37.5 41 L38.5 40.5 L38 40 L37 41 Q29 43 24 46 Z" fill="#4a7c35" opacity="0.6" />
            <path d="M24 46 Q20 44 16 40 L16.5 39 L15.5 38.5 L16 38 L17 39 Q21 43 24 46 Z" fill="#5a8c3f" opacity="0.6" />
            <path d="M24 46 Q28 44 32 40 L31.5 39 L32.5 38.5 L32 38 L31 39 Q27 43 24 46 Z" fill="#4a7c35" opacity="0.55" />
            <path d="M24 46 Q22 44 20 38 L20.5 37 L19.5 36.5 L20 36 L21 37 Q23 43 24 46 Z" fill="#6ab04c" opacity="0.55" />
            <path d="M24 46 Q26 44 28 38 L27.5 37 L28.5 36.5 L28 36 L27 37 Q25 43 24 46 Z" fill="#5a9c3f" opacity="0.5" />
            <path d="M16 44 L8.5 42" stroke="#3a6a25" strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M32 44 L39.5 42" stroke="#3a6a25" strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M22 44 L17 40" stroke="#3a6a25" strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M26 44 L31 40" stroke="#3a6a25" strokeWidth="0.3" fill="none" opacity="0.12" />
            <ellipse cx="24" cy="36" rx="5.5" ry="7.5" fill={`url(#${uid}-pine)`} transform="rotate(-3 24 36)" />
            <path d="M20 32 L22.5 35 L20 38 L22.5 41" stroke="#a0780a" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M22.5 31 L25 34 L22.5 37 L25 40" stroke="#a0780a" strokeWidth="0.5" fill="none" opacity="0.35" />
            <path d="M25 32 L27.5 35 L25 38 L27.5 41" stroke="#a0780a" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M19 34 L24 31.5 L29 34" stroke="#a0780a" strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M19 37 L24 34.5 L29 37" stroke="#a0780a" strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M19.5 40 L24 37.5 L28.5 40" stroke="#a0780a" strokeWidth="0.3" fill="none" opacity="0.25" />
            <ellipse cx="22" cy="34" rx="1.2" ry="1" fill="#e8c040" opacity="0.25" />
            <ellipse cx="26" cy="38" rx="1" ry="0.8" fill="#e8c040" opacity="0.2" />
            <path d="M24 29 Q23 28 22.5 27 L23 27.5 L22.5 26.5 L23.5 28 Z" fill="#5a8c3f" opacity="0.7" />
            <path d="M24 29 Q25 28 25.5 27 L25 27.5 L25.5 26.5 L24.5 28 Z" fill="#4a7c35" opacity="0.65" />
            <path d="M24 29 Q24 27.5 24 26" stroke="#5a8c3f" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M24 29 Q22 27 21 26" stroke="#4a7c35" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.4" />
            <path d="M24 29 Q26 27 27 26" stroke="#5a8c3f" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.4" />
          </g>
        )

      case 'passionfruit':
        if (s === 0) return (
          <g>
            <path d="M16 46 L16 40" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M16 40 L16 39" stroke={trunk} strokeWidth="0.8" fill="none" />
            <path d="M15.5 39 L16.5 39 L16 38 Z" fill={trunk} />
            <path d="M32 46 L32 40" stroke={trunk} strokeWidth="1.5" fill="none" />
            <path d="M32 40 L32 39" stroke={trunk} strokeWidth="0.8" fill="none" />
            <path d="M31.5 39 L32.5 39 L32 38 Z" fill={trunk} />
            <path d="M16 42 L32 42" stroke={trunk} strokeWidth="1" />
            <path d="M24 46 Q24 44 22 42 Q20 40 18 40" stroke="#5a8c3f" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M18 40 Q17 38 18 37 Q19 38 20 37 Q19 38 18 40 Z" fill={color} opacity="0.5" />
            <path d="M18 38.5 L18 40" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M14 46 L14 34" stroke={trunk} strokeWidth="1.8" fill="none" />
            <path d="M14 34 L14 33" stroke={trunk} strokeWidth="0.8" fill="none" />
            <path d="M13.5 33 L14.5 33 L14 32 Z" fill={trunk} />
            <path d="M34 46 L34 34" stroke={trunk} strokeWidth="1.8" fill="none" />
            <path d="M34 34 L34 33" stroke={trunk} strokeWidth="0.8" fill="none" />
            <path d="M33.5 33 L34.5 33 L34 32 Z" fill={trunk} />
            <path d="M22 46 L22 34" stroke={trunk} strokeWidth="1" fill="none" />
            <path d="M22 34 L22 33.2" stroke={trunk} strokeWidth="0.6" fill="none" />
            <path d="M21.6 33.2 L22.4 33.2 L22 32.5 Z" fill={trunk} />
            <path d="M28 46 L28 34" stroke={trunk} strokeWidth="1" fill="none" />
            <path d="M28 34 L28 33.2" stroke={trunk} strokeWidth="0.6" fill="none" />
            <path d="M27.6 33.2 L28.4 33.2 L28 32.5 Z" fill={trunk} />
            <path d="M14 40 L34 40" stroke={trunk} strokeWidth="1" />
            <path d="M14 37 L34 37" stroke={trunk} strokeWidth="0.8" />
            <path d="M14 34 L34 34" stroke={trunk} strokeWidth="0.8" />
            <path d="M24 46 Q22 42 18 38" stroke="#5a8c3f" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M20 40 Q24 36 28 34" stroke="#5a8c3f" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M22 38 Q21 37 21.5 36 Q22 36.5 22.5 36 Q22 37 22 38" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.5" />
            <path d="M26 36 Q25.5 35.2 26 34.5 Q26.5 35 27 34.5 Q26.5 35.2 26 36" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.45" />
            <path d="M18 38 Q16 36 18 34 Q20 36 22 34 Q20 36 18 38 Z" fill={color} opacity="0.55" />
            <path d="M18 36 L18 38 M17 36 L18 37 M19 36 L18 37" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.2" />
            <path d="M28 34 Q26 32 28 30 Q30 32 32 30 Q30 32 28 34 Z" fill={color} opacity="0.5" />
            <path d="M28 32 L28 34 M27 32 L28 33 M29 32 L28 33" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.2" />
            <path d="M24 36 Q22.5 34.5 24 33 Q25.5 34.5 27 33 Q25.5 34.5 24 36 Z" fill={color} opacity="0.45" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M12 46 L12 24" stroke={trunk} strokeWidth="2" fill="none" />
            <path d="M12 24 L12 23" stroke={trunk} strokeWidth="0.8" fill="none" />
            <path d="M11.5 23 L12.5 23 L12 22 Z" fill={trunk} />
            <path d="M36 46 L36 24" stroke={trunk} strokeWidth="2" fill="none" />
            <path d="M36 24 L36 23" stroke={trunk} strokeWidth="0.8" fill="none" />
            <path d="M35.5 23 L36.5 23 L36 22 Z" fill={trunk} />
            <path d="M20 46 L20 24" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M20 24 L20 23.2" stroke={trunk} strokeWidth="0.6" fill="none" />
            <path d="M19.6 23.2 L20.4 23.2 L20 22.5 Z" fill={trunk} />
            <path d="M28 46 L28 24" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M28 24 L28 23.2" stroke={trunk} strokeWidth="0.6" fill="none" />
            <path d="M27.6 23.2 L28.4 23.2 L28 22.5 Z" fill={trunk} />
            <path d="M12 38 L36 38" stroke={trunk} strokeWidth="1" />
            <path d="M12 34 L36 34" stroke={trunk} strokeWidth="0.8" />
            <path d="M12 30 L36 30" stroke={trunk} strokeWidth="0.8" />
            <path d="M12 26 L36 26" stroke={trunk} strokeWidth="0.7" />
            <path d="M12 36 Q18 30 24 26 Q30 22 36 24" stroke="#5a8c3f" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M20 36 Q26 30 32 26" stroke="#5a8c3f" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M36 34 Q30 28 24 26" stroke="#5a8c3f" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M18 32 Q17 31 17.5 30 Q18 30.5 18.5 30 Q18 31 18 32" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.5" />
            <path d="M30 28 Q29 27 29.5 26 Q30 26.5 30.5 26 Q30 27 30 28" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.45" />
            <path d="M24 30 Q23.2 29 23.5 28 Q24 28.5 24.5 28 Q24 29 24 30" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.4" />
            <path d="M18 30 Q16 28 18 26 Q20 28 22 26 Q20 28 18 30 Z" fill={color} opacity="0.6" />
            <path d="M18 28 L18 30 M17 28 L18 29 M19 28 L18 29" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.2" />
            <path d="M26 26 Q24 24 26 22 Q28 24 30 22 Q28 24 26 26 Z" fill={color} opacity="0.55" />
            <path d="M14 34 Q12 32 14 30 Q16 32 18 30 Q16 32 14 34 Z" fill={color} opacity="0.5" />
            <path d="M32 28 Q30 26 32 24 Q34 26 36 24 Q34 26 32 28 Z" fill={color} opacity="0.45" />
            <path d="M22 32 Q20.5 30.5 22 29 Q23.5 30.5 25 29 Q23.5 30.5 22 32 Z" fill={color} opacity="0.5" />
            <path d="M20 30 L20 32" stroke="#5a8c3f" strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="20" cy="33" r="1.5" fill={color} />
            <circle cx="19.5" cy="32.5" r="0.4" fill={light} opacity="0.3" />
            <path d="M32 26 L32 28" stroke="#5a8c3f" strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="32" cy="29" r="1.3" fill={color} opacity="0.8" />
            <circle cx="31.5" cy="28.5" r="0.35" fill={light} opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M10 46 L10 16" stroke={trunk} strokeWidth="2.2" fill="none" />
            <path d="M10 16 L10 15" stroke={trunk} strokeWidth="0.8" fill="none" />
            <path d="M9.5 15 L10.5 15 L10 14 Z" fill={trunk} />
            <path d="M38 46 L38 16" stroke={trunk} strokeWidth="2.2" fill="none" />
            <path d="M38 16 L38 15" stroke={trunk} strokeWidth="0.8" fill="none" />
            <path d="M37.5 15 L38.5 15 L38 14 Z" fill={trunk} />
            <path d="M18 46 L18 16" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M18 16 L18 15.2" stroke={trunk} strokeWidth="0.6" fill="none" />
            <path d="M17.6 15.2 L18.4 15.2 L18 14.5 Z" fill={trunk} />
            <path d="M24 46 L24 16" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M24 16 L24 15.2" stroke={trunk} strokeWidth="0.6" fill="none" />
            <path d="M23.6 15.2 L24.4 15.2 L24 14.5 Z" fill={trunk} />
            <path d="M30 46 L30 16" stroke={trunk} strokeWidth="1.2" fill="none" />
            <path d="M30 16 L30 15.2" stroke={trunk} strokeWidth="0.6" fill="none" />
            <path d="M29.6 15.2 L30.4 15.2 L30 14.5 Z" fill={trunk} />
            <path d="M10 36 L38 36" stroke={trunk} strokeWidth="1" />
            <path d="M10 32 L38 32" stroke={trunk} strokeWidth="0.8" />
            <path d="M10 28 L38 28" stroke={trunk} strokeWidth="0.8" />
            <path d="M10 24 L38 24" stroke={trunk} strokeWidth="0.7" />
            <path d="M10 20 L38 20" stroke={trunk} strokeWidth="0.7" />
            <path d="M10 16 L38 16" stroke={trunk} strokeWidth="0.6" />
            <path d="M10 34 Q18 26 26 20 Q34 14 38 16" stroke="#5a8c3f" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M16 34 Q24 26 32 20 Q38 16 40 16" stroke="#5a8c3f" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M38 32 Q30 26 22 22 Q14 18 10 16" stroke="#5a8c3f" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M34 34 Q26 28 20 24 Q14 20 10 18" stroke="#5a8c3f" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M12 30 Q16 24 22 20" stroke="#5a8c3f" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M36 28 Q32 22 26 18" stroke="#5a8c3f" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M16 28 Q15 27 15.5 26 Q16 26.5 16.5 26 Q16 27 16 28" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.5" />
            <path d="M28 22 Q27 21 27.5 20 Q28 20.5 28.5 20 Q28 21 28 22" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.45" />
            <path d="M34 28 Q33 27 33.5 26 Q34 26.5 34.5 26 Q34 27 34 28" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.4" />
            <path d="M20 22 Q19 21 19.5 20 Q20 20.5 20.5 20 Q20 21 20 22" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.4" />
            <path d="M14 24 Q13.2 23 13.5 22 Q14 22.5 14.5 22 Q14 23 14 24" stroke="#5a8c3f" strokeWidth="0.35" fill="none" opacity="0.35" />
            <path d="M32 20 Q31.2 19 31.5 18 Q32 18.5 32.5 18 Q32 19 32 20" stroke="#5a8c3f" strokeWidth="0.35" fill="none" opacity="0.35" />
            <path d="M16 28 Q14 26 16 24 Q18 26 20 24 Q18 26 16 28 Z" fill={color} opacity="0.6" />
            <path d="M16 26 L16 28 M15 26 L16 27 M17 26 L16 27" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.2" />
            <path d="M26 22 Q24 20 26 18 Q28 20 30 18 Q28 20 26 22 Z" fill={color} opacity="0.55" />
            <path d="M34 18 Q32 16 34 14 Q36 16 38 14 Q36 16 34 18 Z" fill={color} opacity="0.5" />
            <path d="M12 32 Q10 30 12 28 Q14 30 16 28 Q14 30 12 32 Z" fill={color} opacity="0.5" />
            <path d="M22 26 Q20 24 22 22 Q24 24 26 22 Q24 24 22 26 Z" fill={color} opacity="0.55" />
            <path d="M30 30 Q28 28 30 26 Q32 28 34 26 Q32 28 30 30 Z" fill={color} opacity="0.5" />
            <path d="M18 20 Q16 18 18 16 Q20 18 22 16 Q20 18 18 20 Z" fill={color} opacity="0.45" />
            <path d="M32 24 Q30 22 32 20 Q34 22 36 20 Q34 22 32 24 Z" fill={color} opacity="0.45" />
            <path d="M14 24 Q12 22 14 20 Q16 22 18 20 Q16 22 14 24 Z" fill={color} opacity="0.4" />
            <path d="M28 18 Q26 16 28 14 Q30 16 32 14 Q30 16 28 18 Z" fill={color} opacity="0.4" />
            <path d="M20 30 Q18.5 28.5 20 27 Q21.5 28.5 23 27 Q21.5 28.5 20 30 Z" fill={color} opacity="0.45" />
            <path d="M18 28 L18 30" stroke="#5a8c3f" strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="18" cy="31.5" r="1.8" fill={color} />
            <circle cx="17.5" cy="30.8" r="0.45" fill={light} opacity="0.3" />
            <path d="M30 26 L30 28" stroke="#5a8c3f" strokeWidth="0.4" strokeLinecap="round" />
            <circle cx="30" cy="29.5" r="1.6" fill={color} />
            <circle cx="29.5" cy="28.8" r="0.4" fill={light} opacity="0.3" />
            <path d="M24 24 L24 26" stroke="#5a8c3f" strokeWidth="0.35" strokeLinecap="round" />
            <circle cx="24" cy="27.5" r="1.5" fill={color} opacity="0.85" />
            <circle cx="23.5" cy="26.8" r="0.35" fill={light} opacity="0.25" />
            <path d="M36 22 L36 24" stroke="#5a8c3f" strokeWidth="0.35" strokeLinecap="round" />
            <circle cx="36" cy="25.5" r="1.4" fill={color} opacity="0.75" />
            <path d="M14 32 L14 34" stroke="#5a8c3f" strokeWidth="0.35" strokeLinecap="round" />
            <circle cx="14" cy="35.5" r="1.3" fill={color} opacity="0.7" />
            <path d="M26 30 L26 32" stroke="#5a8c3f" strokeWidth="0.3" strokeLinecap="round" />
            <circle cx="26" cy="33.5" r="1.2" fill={color} opacity="0.6" />
          </g>
        )

      case 'redwood':
        if (s === 0) return (
          <g>
            <path d="M24 46 Q23.5 42 24 34" stroke="#8b4513" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M23 40 L23 38" stroke="#6b3510" strokeWidth="0.5" opacity="0.3" />
            <path d="M25 42 L25 40" stroke="#6b3510" strokeWidth="0.4" opacity="0.25" />
            <path d="M24 35 C21 33 20 31 22 31 C24 31 24 34 24 35 Z" fill={color} opacity="0.6" />
            <path d="M24 35 C27 33 28 31 26 31 C24 31 24 34 24 35 Z" fill={color} opacity="0.5" />
            <path d="M24 34 C23 32 23 30 24 29 C25 30 25 32 24 34 Z" fill={color} opacity="0.45" />
            <path d="M23 46 Q21 45 19 46" stroke="#8b4513" strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d="M25 46 Q27 45 29 46" stroke="#8b4513" strokeWidth="0.7" fill="none" opacity="0.25" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M22 46 Q22 36 22.5 22 L25.5 22 Q26 36 26 46 Z" fill="#8b4513" />
            <path d="M23 46 Q23 38 23.2 22" stroke="#6b3510" strokeWidth="0.8" opacity="0.25" />
            <path d="M24.5 46 Q24.5 38 24.5 22" stroke="#6b3510" strokeWidth="0.6" opacity="0.2" />
            <path d="M23.8 44 Q23.8 36 24 24" stroke="#a0582a" strokeWidth="0.4" opacity="0.12" />
            <path d="M22 38 L26 37.8" stroke="#6b3510" strokeWidth="0.7" opacity="0.3" />
            <path d="M22.5 30 L25.5 29.8" stroke="#6b3510" strokeWidth="0.6" opacity="0.25" />
            <path d="M23 34 L25 33.8" stroke="#6b3510" strokeWidth="0.5" opacity="0.2" />
            <path d="M23 26 L25 25.8" stroke="#6b3510" strokeWidth="0.4" opacity="0.18" />
            <path d="M22 32 Q17 30 14 32" stroke="#8b4513" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M26 28 Q30 26 32 28" stroke="#8b4513" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M12 32 C10 30 12 28 15 30 C17 31 15 34 12 32 Z" fill={color} opacity="0.5" />
            <path d="M34 28 C36 26 35 24 32 26 C30 27 31 30 34 28 Z" fill={color} opacity="0.45" />
            <path d="M24 12 L18 22 Q21 23 24 22 Q27 23 30 22 Z" fill={color} opacity="0.7" />
            <path d="M24 16 L20 22 Q22 22.5 24 22 Q26 22.5 28 22 Z" fill={color} opacity="0.5" />
            <path d="M24 14 C23 12 23 10 24 10 C25 10 25 12 24 14 Z" fill={color} opacity="0.4" />
            <path d="M22 46 Q19 44.5 16 46" stroke="#8b4513" strokeWidth="1.2" fill="none" opacity="0.3" />
            <path d="M26 46 Q29 44.5 32 46" stroke="#8b4513" strokeWidth="1" fill="none" opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M20 46 Q20 30 21 14 L27 14 Q28 30 28 46 Z" fill="#8b4513" />
            <path d="M21.5 46 Q21.5 30 21.8 14" stroke="#6b3510" strokeWidth="1" opacity="0.25" />
            <path d="M23.5 46 Q23.5 30 23.5 14" stroke="#6b3510" strokeWidth="0.9" opacity="0.22" />
            <path d="M25.5 46 Q25.5 30 25.5 14" stroke="#6b3510" strokeWidth="0.8" opacity="0.2" />
            <path d="M22.5 46 Q22.5 30 22.8 14" stroke="#a0582a" strokeWidth="0.5" opacity="0.12" />
            <path d="M24.5 46 Q24.5 30 24.8 14" stroke="#a0582a" strokeWidth="0.5" opacity="0.1" />
            <path d="M20 40 L28 39.8" stroke="#6b3510" strokeWidth="0.8" opacity="0.3" />
            <path d="M20 32 L28 31.8" stroke="#6b3510" strokeWidth="0.7" opacity="0.25" />
            <path d="M20.5 24 L27.5 23.8" stroke="#6b3510" strokeWidth="0.6" opacity="0.22" />
            <path d="M21 36 L27 35.8" stroke="#6b3510" strokeWidth="0.5" opacity="0.18" />
            <path d="M21 28 L27 27.8" stroke="#6b3510" strokeWidth="0.5" opacity="0.15" />
            <path d="M20 36 Q14 34 10 36" stroke="#8b4513" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M28 32 Q34 30 38 32" stroke="#8b4513" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M20 28 Q16 26 14 28" stroke="#8b4513" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M28 24 Q32 22 34 24" stroke="#8b4513" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M20 20 Q17 18 15 20" stroke="#8b4513" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M28 18 Q31 16 33 18" stroke="#8b4513" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M8 36 C5 33 7 30 11 31 C14 32 14 36 10 37 Z" fill={color} opacity="0.55" />
            <path d="M40 32 C43 29 41 26 37 27 C34 28 34 32 38 33 Z" fill={color} opacity="0.5" />
            <path d="M12 28 C9 26 10 23 14 25 C16 26 15 29 12 28 Z" fill={color} opacity="0.5" />
            <path d="M36 24 C39 22 38 19 34 21 C32 22 33 25 36 24 Z" fill={color} opacity="0.45" />
            <path d="M13 20 C11 18 12 16 15 18 C16 19 15 21 13 20 Z" fill={color} opacity="0.4" />
            <path d="M35 18 C37 16 36 14 33 16 C32 17 33 19 35 18 Z" fill={color} opacity="0.35" />
            <path d="M24 4 L16 14 Q20 15 24 14 Q28 15 32 14 Z" fill={color} opacity="0.75" />
            <path d="M24 8 L18 14 Q21 14.5 24 14 Q27 14.5 30 14 Z" fill={color} opacity="0.6" />
            <path d="M24 2 L20 10 Q22 11 24 10 Q26 11 28 10 Z" fill={color} opacity="0.5" />
            <path d="M24 4 C23 2 23 0 24 0 C25 0 25 2 24 4 Z" fill={light} opacity="0.35" />
            <path d="M20 46 Q16 44 12 46" stroke="#8b4513" strokeWidth="1.5" fill="none" opacity="0.35" />
            <path d="M28 46 Q32 44 36 46" stroke="#8b4513" strokeWidth="1.3" fill="none" opacity="0.3" />
            <path d="M22 46 Q20 45.5 18 46" stroke="#8b4513" strokeWidth="0.8" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            <path d="M18 46 Q18 30 19 10 L29 10 Q30 30 30 46 Z" fill="#8b4513" />
            <path d="M20 46 Q20 30 20.5 10" stroke="#6b3510" strokeWidth="1.2" opacity="0.25" />
            <path d="M22.5 46 Q22.5 30 22.5 10" stroke="#6b3510" strokeWidth="1" opacity="0.22" />
            <path d="M25 46 Q25 30 25 10" stroke="#6b3510" strokeWidth="1" opacity="0.22" />
            <path d="M27.5 46 Q27.5 30 27.5 10" stroke="#6b3510" strokeWidth="0.8" opacity="0.18" />
            <path d="M21.5 46 Q21.5 30 21.8 10" stroke="#a0582a" strokeWidth="0.6" opacity="0.12" />
            <path d="M24 46 Q24 30 24 10" stroke="#a0582a" strokeWidth="0.6" opacity="0.1" />
            <path d="M26.5 46 Q26.5 30 26.5 10" stroke="#7a4510" strokeWidth="0.5" opacity="0.1" />
            <path d="M18 42 L30 41.8" stroke="#6b3510" strokeWidth="0.9" opacity="0.3" />
            <path d="M18 36 L30 35.8" stroke="#6b3510" strokeWidth="0.8" opacity="0.28" />
            <path d="M18 30 L30 29.8" stroke="#6b3510" strokeWidth="0.8" opacity="0.25" />
            <path d="M18.5 24 L29.5 23.8" stroke="#6b3510" strokeWidth="0.7" opacity="0.22" />
            <path d="M19 18 L29 17.8" stroke="#6b3510" strokeWidth="0.7" opacity="0.2" />
            <path d="M19.5 12 L28.5 11.8" stroke="#6b3510" strokeWidth="0.6" opacity="0.18" />
            <path d="M19 44 L29 43.8" stroke="#6b3510" strokeWidth="0.6" opacity="0.15" />
            <path d="M19 38 L29 37.8" stroke="#6b3510" strokeWidth="0.5" opacity="0.15" />
            <path d="M18 38 Q10 36 4 38" stroke="#8b4513" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M30 36 Q38 34 44 36" stroke="#8b4513" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M18 30 Q12 28 8 30" stroke="#8b4513" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M30 28 Q36 26 40 28" stroke="#8b4513" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M18 22 Q14 20 10 22" stroke="#8b4513" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M30 20 Q34 18 38 20" stroke="#8b4513" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M18 16 Q15 14 13 16" stroke="#8b4513" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M30 14 Q33 12 35 14" stroke="#8b4513" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M2 38 C-1 34 2 30 7 32 C11 33 12 38 7 40 C4 41 1 40 2 38 Z" fill={color} opacity="0.55" />
            <path d="M5 36 C3 34 5 31 8 33 C10 34 9 38 6 37 Z" fill={color} opacity="0.45" />
            <path d="M46 36 C49 32 46 28 41 30 C37 31 36 36 41 38 C44 39 47 38 46 36 Z" fill={color} opacity="0.5" />
            <path d="M43 34 C45 32 43 29 40 31 C38 32 39 36 42 35 Z" fill={color} opacity="0.4" />
            <path d="M6 30 C3 27 5 24 10 26 C13 27 13 31 9 32 Z" fill={color} opacity="0.55" />
            <path d="M8 28 C6 26 8 24 11 26 C12 27 10 30 8 28 Z" fill={color} opacity="0.4" />
            <path d="M42 28 C45 25 43 22 38 24 C35 25 35 29 39 30 Z" fill={color} opacity="0.5" />
            <path d="M40 26 C42 24 40 22 37 24 C36 25 38 28 40 26 Z" fill={color} opacity="0.35" />
            <path d="M8 22 C5 19 7 16 12 18 C15 19 14 23 10 24 Z" fill={color} opacity="0.5" />
            <path d="M10 20 C8 18 10 16 13 18 C14 19 12 22 10 20 Z" fill={color} opacity="0.35" />
            <path d="M40 20 C43 17 41 14 36 16 C33 17 34 21 38 22 Z" fill={color} opacity="0.45" />
            <path d="M38 18 C40 16 38 14 35 16 C34 17 36 20 38 18 Z" fill={color} opacity="0.3" />
            <path d="M11 16 C9 14 10 12 13 14 C14 15 13 18 11 16 Z" fill={color} opacity="0.4" />
            <path d="M37 14 C39 12 38 10 35 12 C34 13 35 16 37 14 Z" fill={color} opacity="0.35" />
            <path d="M24 0 L14 10 Q19 11 24 10 Q29 11 34 10 Z" fill={color} opacity="0.75" />
            <path d="M24 4 L16 10 Q20 10.5 24 10 Q28 10.5 32 10 Z" fill={color} opacity="0.6" />
            <path d="M24 -1 L18 8 Q21 9 24 8 Q27 9 30 8 Z" fill={color} opacity="0.5" />
            <path d="M24 2 C23 0 23 -2 24 -2 C25 -2 25 0 24 2 Z" fill={light} opacity="0.35" />
            <path d="M18 46 Q14 44 10 46" stroke="#8b4513" strokeWidth="2" fill="none" opacity="0.4" />
            <path d="M30 46 Q34 44 38 46" stroke="#8b4513" strokeWidth="1.8" fill="none" opacity="0.35" />
            <path d="M20 46 Q18 45.5 16 46" stroke="#8b4513" strokeWidth="1" fill="none" opacity="0.22" />
            <path d="M28 46 Q30 45.5 32 46" stroke="#8b4513" strokeWidth="0.8" fill="none" opacity="0.18" />
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
        {!hideGround && renderGround()}
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
