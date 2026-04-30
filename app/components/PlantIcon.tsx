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
            <circle cx="14" cy="14" r="0.7" fill={light} opacity="0.3" />
            <circle cx="20" cy="10" r="0.6" fill={light} opacity="0.3" />
            <circle cx="28" cy="12" r="0.65" fill={light} opacity="0.3" />
            <circle cx="34" cy="16" r="0.6" fill={light} opacity="0.25" />
            <circle cx="12" cy="20" r="0.55" fill={light} opacity="0.25" />
            <circle cx="36" cy="22" r="0.55" fill={light} opacity="0.2" />
            <circle cx="16" cy="28" r="0.5" fill={light} opacity="0.2" />
            <circle cx="32" cy="26" r="0.55" fill={light} opacity="0.2" />
            <circle cx="24" cy="16" r="0.6" fill={light} opacity="0.25" />
            <circle cx="22" cy="22" r="0.5" fill={light} opacity="0.2" />
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
            <path d="M18.5 6 Q19 3 22 2.5 Q25 2 28 3 Q30.5 4.5 30 7 Q29.5 9.5 27 10 Q24 10.5 21 9.5 Q18.8 8.5 18.5 6Z" fill={light} opacity="0.85" />
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
            {/* Trunk */}
            <path d="M23 46 C22 42 21 38 22 34 C22.5 32 23 30 23 28" stroke="#5c4a3a" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M23 46 C22 42 21 38 22 34 C22.5 32 23 30 23 28" stroke="#4a3a2a" strokeWidth="1.5" opacity="0.12" strokeLinecap="round" fill="none" />
            <ellipse cx="22" cy="36" rx="1.5" ry="1" fill="#4a3a2a" opacity="0.2" />
            {/* Main branches */}
            <path d="M23 30 Q14 25 5 22" stroke="#5c4a3a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M23 28 Q34 20 43 15" stroke="#5c4a3a" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M23 26 Q15 18 10 10" stroke="#5c4a3a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 24 Q30 16 36 8" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23 27 Q20 22 18 18" stroke="#5c4a3a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M23 29 Q28 24 32 20" stroke="#5c4a3a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            {/* Sub-branches left */}
            <path d="M9 24 Q6 22 3 24" stroke="#5c4a3a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M12 20 Q9 18 6 18" stroke="#5c4a3a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M14 16 Q11 14 8 14" stroke="#5c4a3a" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M12 12 Q10 10 7 8" stroke="#5c4a3a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M15 14 Q13 12 10 13" stroke="#5c4a3a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M18 18 Q16 16 14 18" stroke="#5c4a3a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M6 22 Q4 20 2 21" stroke="#5c4a3a" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            {/* Sub-branches right */}
            <path d="M36 18 Q39 16 42 18" stroke="#5c4a3a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M34 14 Q37 12 40 12" stroke="#5c4a3a" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M32 20 Q35 18 38 20" stroke="#5c4a3a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M38 14 Q41 12 44 14" stroke="#5c4a3a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M34 10 Q37 8 40 8" stroke="#5c4a3a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M28 18 Q30 16 33 18" stroke="#5c4a3a" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            {/* Sub-branches top */}
            <path d="M25 10 Q27 8 30 6" stroke="#5c4a3a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M20 10 Q18 8 16 6" stroke="#5c4a3a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            {/* ──── FLOWER CLUSTERS ──── */}
            {/* Bottom-left branch tip */}
            <ellipse cx="5" cy="21" rx="4" ry="3.5" fill="#f9a8d4" opacity="0.6" />
            <ellipse cx="4" cy="20" rx="3" ry="2.5" fill="#ffc0d8" opacity="0.55" />
            <ellipse cx="7" cy="22" rx="2.5" ry="2" fill="#ffe0ec" opacity="0.5" />
            <circle cx="5" cy="21" r="0.8" fill="#fbbf24" opacity="0.25" />
            <circle cx="3.5" cy="19.5" r="0.6" fill="#fbbf24" opacity="0.2" />
            {/* Bottom-left mid */}
            <ellipse cx="11" cy="20" rx="3.5" ry="3" fill="#ffc0d8" opacity="0.55" />
            <ellipse cx="13" cy="21" rx="3" ry="2.5" fill="#f9a8d4" opacity="0.5" />
            <circle cx="11.5" cy="20" r="0.7" fill="#fbbf24" opacity="0.22" />
            {/* Bottom-left near trunk */}
            <ellipse cx="17" cy="24" rx="3" ry="2.5" fill="#ffe0ec" opacity="0.45" />
            <ellipse cx="19" cy="23" rx="2.5" ry="2" fill="#f9a8d4" opacity="0.4" />
            {/* Upper-left branch tip */}
            <ellipse cx="10" cy="10" rx="4" ry="3.5" fill="#ffc0d8" opacity="0.7" />
            <ellipse cx="8" cy="9" rx="3" ry="2.5" fill="#f9a8d4" opacity="0.6" />
            <ellipse cx="12" cy="11" rx="2.5" ry="2" fill="#ffe0ec" opacity="0.5" />
            <circle cx="10" cy="10" r="0.8" fill="#fbbf24" opacity="0.28" />
            <circle cx="8" cy="8.5" r="0.6" fill="#fbbf24" opacity="0.2" />
            {/* Upper-left mid */}
            <ellipse cx="15" cy="15" rx="3.5" ry="3" fill="#f9a8d4" opacity="0.55" />
            <ellipse cx="17" cy="16" rx="3" ry="2.5" fill="#ffc0d8" opacity="0.5" />
            <circle cx="15.5" cy="15" r="0.7" fill="#fbbf24" opacity="0.22" />
            {/* Mid-left */}
            <ellipse cx="19" cy="19" rx="3" ry="2.5" fill="#ffe0ec" opacity="0.45" />
            <circle cx="19" cy="19" r="0.6" fill="#fbbf24" opacity="0.18" />
            {/* Top-right branch tip */}
            <ellipse cx="37" cy="8" rx="4" ry="3.5" fill="#f9a8d4" opacity="0.65" />
            <ellipse cx="39" cy="7" rx="3" ry="2.5" fill="#ffc0d8" opacity="0.55" />
            <ellipse cx="35" cy="9" rx="2.5" ry="2" fill="#ffe0ec" opacity="0.5" />
            <circle cx="37" cy="8" r="0.8" fill="#fbbf24" opacity="0.28" />
            <circle cx="39.5" cy="7" r="0.6" fill="#fbbf24" opacity="0.2" />
            {/* Top-right mid */}
            <ellipse cx="32" cy="12" rx="3.5" ry="3" fill="#ffc0d8" opacity="0.55" />
            <ellipse cx="30" cy="13" rx="3" ry="2.5" fill="#f9a8d4" opacity="0.5" />
            <circle cx="31.5" cy="12" r="0.7" fill="#fbbf24" opacity="0.22" />
            {/* Top-right near trunk */}
            <ellipse cx="27" cy="16" rx="3" ry="2.5" fill="#ffe0ec" opacity="0.45" />
            <circle cx="27" cy="16" r="0.6" fill="#fbbf24" opacity="0.18" />
            {/* Bottom-right branch tip */}
            <ellipse cx="43" cy="15" rx="3.5" ry="3" fill="#f9a8d4" opacity="0.6" />
            <ellipse cx="41" cy="14" rx="3" ry="2.5" fill="#ffc0d8" opacity="0.55" />
            <circle cx="42.5" cy="15" r="0.7" fill="#fbbf24" opacity="0.25" />
            {/* Bottom-right mid */}
            <ellipse cx="38" cy="18" rx="3.5" ry="3" fill="#ffe0ec" opacity="0.55" />
            <ellipse cx="36" cy="19" rx="3" ry="2.5" fill="#f9a8d4" opacity="0.5" />
            <circle cx="37.5" cy="18" r="0.7" fill="#fbbf24" opacity="0.22" />
            {/* Bottom-right near trunk */}
            <ellipse cx="33" cy="21" rx="3" ry="2.5" fill="#ffc0d8" opacity="0.45" />
            <ellipse cx="31" cy="20" rx="2.5" ry="2" fill="#ffe0ec" opacity="0.4" />
            {/* Center crown */}
            <ellipse cx="23" cy="8" rx="4.5" ry="4" fill="#ffc0d8" opacity="0.75" />
            <ellipse cx="21" cy="7" rx="3.5" ry="3" fill="#f9a8d4" opacity="0.6" />
            <ellipse cx="25" cy="9" rx="3.5" ry="3" fill="#ffe0ec" opacity="0.55" />
            <ellipse cx="23" cy="11" rx="3" ry="2.5" fill="#f9a8d4" opacity="0.5" />
            <circle cx="23" cy="8" r="1" fill="#fbbf24" opacity="0.3" />
            <circle cx="21" cy="6.5" r="0.7" fill="#fbbf24" opacity="0.22" />
            <circle cx="25.5" cy="9" r="0.6" fill="#fbbf24" opacity="0.2" />
            {/* Upper sub-branch tips */}
            <ellipse cx="17" cy="6" rx="3" ry="2.5" fill="#ffc0d8" opacity="0.55" />
            <circle cx="17" cy="6" r="0.6" fill="#fbbf24" opacity="0.2" />
            <ellipse cx="29" cy="6" rx="3" ry="2.5" fill="#f9a8d4" opacity="0.55" />
            <circle cx="29" cy="6" r="0.6" fill="#fbbf24" opacity="0.2" />
            {/* Mid trunk flowers */}
            <ellipse cx="24" cy="20" rx="2.5" ry="2" fill="#f9a8d4" opacity="0.35" />
            <ellipse cx="21" cy="22" rx="2" ry="1.5" fill="#ffc0d8" opacity="0.3" />
            {/* Roots */}
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
            <path d="M24 46 Q23 40 24 30" stroke={trunk} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23.5 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M24 32 Q18 28 13 26" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q30 26 35 24" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Back blobs — darker, packed */}
            <path d="M10 24 C8 21 9 18 12 17 C15 16 18 18 17 21 C16 24 12 26 10 24 Z" fill={dark} opacity="0.85" />
            <path d="M30 22 C32 19 35 19 36 22 C37 25 34 27 31 25 C29 24 29 23 30 22 Z" fill={dark} opacity="0.8" />
            <path d="M20 22 C18 19 20 16 23 17 C26 18 26 22 23 24 C21 25 19 24 20 22 Z" fill={dark} opacity="0.75" />
            {/* Front blobs — main color, high opacity */}
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
            <path d="M22 46 Q21 40 22 34 L25 34 Q25.5 40 25 46 Z" fill={trunk} />
            <path d="M22.5 38 L24.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23 36 Q16 30 10 26" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q32 28 38 24" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M23 34 Q23 28 23 22" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Back layer — dark blobs packed tight */}
            <path d="M6 24 C4 20 6 16 10 15 C14 14 17 17 15 21 C13 25 8 27 6 24 Z" fill={dark} opacity="0.85" />
            <path d="M34 22 C36 18 40 18 41 22 C42 26 38 28 35 26 C33 24 33 23 34 22 Z" fill={dark} opacity="0.8" />
            <path d="M18 20 C16 16 19 13 23 14 C27 15 28 19 25 22 C22 24 19 23 18 20 Z" fill={dark} opacity="0.8" />
            <path d="M28 18 C30 15 34 15 35 18 C36 21 33 23 30 22 C28 21 27 19 28 18 Z" fill={dark} opacity="0.75" />
            <path d="M10 20 C9 17 11 14 14 14 C17 14 19 17 17 20 C15 23 11 23 10 20 Z" fill={dark} opacity="0.7" />
            {/* Front layer — main color blobs, solid */}
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
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
          </g>
        )
        return (
          <g>
            <path d="M22 46 Q20.5 40 21.5 34 Q22 30 23 28" fill="none" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            <path d="M22 46 Q20.5 40 21.5 34 Q22 30 23 28" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
            <path d="M23 30 Q14 24 8 20" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M23 28 Q32 22 40 18" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M23 28 Q23 22 23 16" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M15 24 Q13 22 11 24" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M33 20 Q35 18 37 20" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Back layer — dark blobs, high opacity, packed */}
            <path d="M4 18 C2 14 4 10 8 8 C12 6 16 9 14 14 C12 18 6 21 4 18 Z" fill={dark} opacity="0.9" />
            <path d="M14 14 C12 10 15 7 19 7 C23 7 25 10 23 14 C21 17 16 17 14 14 Z" fill={dark} opacity="0.85" />
            <path d="M22 12 C20 8 23 5 28 6 C32 7 33 11 30 14 C27 17 23 16 22 12 Z" fill={dark} opacity="0.85" />
            <path d="M32 14 C34 10 38 10 40 14 C42 18 38 20 35 18 C33 17 31 16 32 14 Z" fill={dark} opacity="0.8" />
            <path d="M8 22 C6 19 8 16 11 16 C14 16 15 19 13 22 C11 24 9 24 8 22 Z" fill={dark} opacity="0.8" />
            <path d="M28 10 C26 7 29 5 33 6 C36 7 37 10 34 12 C32 14 29 13 28 10 Z" fill={dark} opacity="0.75" />
            {/* Front layer — muted red tones */}
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
            {/* Blossom spots — subtle */}
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
            {/* Dot texture — matte */}
            <circle cx="8" cy="11" r="0.5" fill={light} opacity="0.12" />
            <circle cx="16" cy="10" r="0.5" fill={light} opacity="0.12" />
            <circle cx="24" cy="9" r="0.5" fill={light} opacity="0.1" />
            <circle cx="32" cy="11" r="0.45" fill={light} opacity="0.1" />
            <circle cx="38" cy="14" r="0.45" fill={light} opacity="0.1" />
            <circle cx="12" cy="16" r="0.4" fill={light} opacity="0.1" />
            <circle cx="20" cy="15" r="0.4" fill={light} opacity="0.08" />
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
            {/* dot texture */}
            <circle cx="14" cy="12" r="0.45" fill={light} opacity="0.5" />
            <circle cx="18" cy="10" r="0.45" fill={light} opacity="0.5" />
            <circle cx="22" cy="9" r="0.45" fill={light} opacity="0.45" />
            <circle cx="26" cy="10" r="0.4" fill={light} opacity="0.45" />
            <circle cx="30" cy="12" r="0.4" fill={light} opacity="0.4" />
            <circle cx="16" cy="16" r="0.4" fill={light} opacity="0.4" />
            <circle cx="20" cy="15" r="0.4" fill={light} opacity="0.4" />
            <circle cx="28" cy="16" r="0.35" fill={light} opacity="0.35" />
            <circle cx="12" cy="20" r="0.35" fill={light} opacity="0.35" />
            <circle cx="34" cy="14" r="0.35" fill={light} opacity="0.35" />
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
            <path d="M24 32 Q16 26 10 22" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 30 Q32 24 38 20" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Back blobs — dark, packed */}
            <path d="M8 22 C6 18 8 15 12 15 C16 15 18 19 15 22 C13 25 9 24 8 22 Z" fill={dark} opacity="0.85" />
            <path d="M28 20 C30 16 34 16 35 20 C36 23 33 25 30 23 C28 22 27 21 28 20 Z" fill={dark} opacity="0.8" />
            <path d="M18 20 C16 16 19 14 23 15 C26 16 26 20 23 22 C20 24 18 23 18 20 Z" fill={dark} opacity="0.75" />
            {/* Front blobs — main color, solid */}
            <path d="M7 23 C5 19 7 16 11 16 C15 16 17 19 14 23 C12 26 8 25 7 23 Z" fill={color} />
            <path d="M14 20 C12 16 15 14 19 14 C22 14 24 18 21 21 C18 24 15 23 14 20 Z" fill={color} />
            <path d="M22 18 C20 15 23 13 27 14 C30 15 30 19 27 21 C24 23 22 22 22 18 Z" fill={color} opacity="0.95" />
            <path d="M32 20 C34 17 37 18 37 21 C37 24 34 25 32 23 C31 22 31 21 32 20 Z" fill={color} opacity="0.9" />
            <path d="M16 24 C15 22 16 20 18 20 C20 20 21 22 20 24 C19 25 17 25 16 24 Z" fill={color} opacity="0.85" />
            {/* Dot texture */}
            <circle cx="12" cy="18" r="0.4" fill={light} opacity="0.3" />
            <circle cx="22" cy="16" r="0.4" fill={light} opacity="0.25" />
            <circle cx="30" cy="19" r="0.35" fill={light} opacity="0.25" />
            <circle cx="17" cy="22" r="0.35" fill={light} opacity="0.2" />
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
            <path d="M22 36 Q14 30 8 24" stroke={trunk} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M26 34 Q34 28 40 22" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q24 26 24 18" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* Back blobs — dark green, packed */}
            <path d="M5 22 C3 18 5 14 9 14 C13 14 16 18 13 22 C10 25 6 24 5 22 Z" fill="#2e5e1e" opacity="0.85" />
            <path d="M16 18 C14 14 17 11 21 12 C25 13 26 17 23 20 C20 22 17 21 16 18 Z" fill="#2e5e1e" opacity="0.85" />
            <path d="M28 16 C30 12 34 12 36 16 C38 20 34 22 31 20 C29 19 27 18 28 16 Z" fill="#2e5e1e" opacity="0.8" />
            <path d="M10 26 C8 23 10 20 13 20 C16 20 18 23 15 26 C13 28 11 28 10 26 Z" fill="#2e5e1e" opacity="0.8" />
            <path d="M34 22 C36 18 40 19 40 23 C40 26 37 27 35 25 C33 24 33 23 34 22 Z" fill="#2e5e1e" opacity="0.75" />
            <path d="M22 14 C20 10 23 8 27 9 C30 10 30 14 27 16 C24 18 22 17 22 14 Z" fill="#2e5e1e" opacity="0.8" />
            {/* Front blobs — green, solid */}
            <path d="M4 23 C2 19 4 15 8 14 C12 13 15 17 12 21 C10 24 5 25 4 23 Z" fill="#4a8c3a" />
            <path d="M12 19 C10 15 13 12 17 12 C21 12 23 16 20 20 C17 23 13 22 12 19 Z" fill="#4a8c3a" />
            <path d="M22 16 C20 12 23 10 28 11 C32 12 33 16 29 19 C26 21 23 20 22 16 Z" fill="#4a8c3a" />
            <path d="M32 20 C34 16 38 17 39 21 C40 24 37 26 34 24 C32 23 31 22 32 20 Z" fill="#4a8c3a" opacity="0.95" />
            <path d="M8 27 C7 25 8 23 10 22 C12 22 14 24 12 27 C11 29 9 29 8 27 Z" fill="#3a6e28" opacity="0.9" />
            <path d="M18 24 C17 22 18 20 20 20 C22 20 23 22 22 24 C21 26 19 26 18 24 Z" fill="#4a8c3a" opacity="0.9" />
            <path d="M28 24 C27 22 28 20 30 20 C32 20 33 22 32 24 C31 26 29 26 28 24 Z" fill="#3a6e28" opacity="0.85" />
            <path d="M16 14 C14 11 16 9 19 10 C21 11 21 14 18 15 C16 16 15 15 16 14 Z" fill="#4a8c3a" opacity="0.85" />
            {/* Peach fruits */}
            <circle cx="8" cy="22" r="1.8" fill={`url(#${uid}-peach)`} />
            <circle cx="7.2" cy="21.2" r="0.4" fill="white" opacity="0.22" />
            <circle cx="38" cy="20" r="1.6" fill={`url(#${uid}-peach)`} />
            <circle cx="37.3" cy="19.2" r="0.35" fill="white" opacity="0.2" />
            {/* Dot texture */}
            <circle cx="10" cy="16" r="0.4" fill="#6ab04c" opacity="0.15" />
            <circle cx="20" cy="14" r="0.4" fill="#6ab04c" opacity="0.15" />
            <circle cx="30" cy="14" r="0.4" fill="#6ab04c" opacity="0.12" />
            <circle cx="14" cy="20" r="0.35" fill="#6ab04c" opacity="0.12" />
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
            <path d="M23 30 Q23 22 23 14" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M23 28 Q17 24 12 20" stroke={trunk} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M23 26 Q29 22 35 18" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Back layer — dark green blobs, packed */}
            <path d="M2 16 C0 12 2 8 6 7 C10 6 13 9 11 13 C9 17 4 19 2 16 Z" fill="#2e5e1e" opacity="0.9" />
            <path d="M10 12 C8 8 11 5 16 6 C20 7 21 11 18 14 C15 17 11 16 10 12 Z" fill="#2e5e1e" opacity="0.9" />
            <path d="M20 10 C18 6 21 3 26 4 C30 5 32 9 28 12 C25 15 21 14 20 10 Z" fill="#2e5e1e" opacity="0.85" />
            <path d="M30 8 C32 4 36 5 38 8 C40 12 36 14 33 12 C31 11 29 10 30 8 Z" fill="#2e5e1e" opacity="0.85" />
            <path d="M38 12 C40 8 44 9 44 13 C44 16 41 18 39 16 C37 14 37 13 38 12 Z" fill="#2e5e1e" opacity="0.8" />
            <path d="M6 20 C4 17 6 14 9 14 C12 14 14 17 11 20 C9 22 7 22 6 20 Z" fill="#2e5e1e" opacity="0.8" />
            <path d="M26 14 C24 10 27 8 31 9 C34 10 34 14 31 16 C29 18 27 17 26 14 Z" fill="#2e5e1e" opacity="0.8" />
            <path d="M16 18 C14 15 16 12 19 12 C22 12 24 15 21 18 C19 20 17 20 16 18 Z" fill="#2e5e1e" opacity="0.75" />
            {/* Front layer — green blobs, solid, dense */}
            <path d="M1 17 C-1 13 1 9 5 8 C9 7 12 10 10 14 C8 18 3 19 1 17 Z" fill="#4a8c3a" />
            <path d="M8 13 C6 9 9 6 14 7 C18 8 19 12 16 15 C13 18 9 17 8 13 Z" fill="#4a8c3a" />
            <path d="M16 10 C14 6 17 3 22 4 C27 5 28 10 24 13 C21 16 17 14 16 10 Z" fill="#4a8c3a" />
            <path d="M26 8 C28 4 32 4 34 8 C36 12 33 14 30 12 C28 11 25 10 26 8 Z" fill="#4a8c3a" />
            <path d="M36 12 C38 8 42 9 43 13 C44 16 40 18 38 16 C36 14 35 13 36 12 Z" fill="#4a8c3a" opacity="0.95" />
            <path d="M5 21 C3 18 5 15 8 15 C11 15 13 18 10 21 C8 23 6 23 5 21 Z" fill="#3a6e28" opacity="0.95" />
            <path d="M14 18 C12 14 14 12 18 12 C22 12 23 16 20 19 C17 21 15 20 14 18 Z" fill="#4a8c3a" opacity="0.9" />
            <path d="M24 14 C22 10 25 8 29 9 C33 10 33 14 30 16 C27 18 25 17 24 14 Z" fill="#4a8c3a" opacity="0.9" />
            <path d="M34 16 C36 13 39 13 40 16 C41 19 38 21 36 19 C34 18 33 17 34 16 Z" fill="#3a6e28" opacity="0.85" />
            <path d="M10 22 C9 20 10 18 12 18 C14 18 15 20 14 22 C13 24 11 24 10 22 Z" fill="#4a8c3a" opacity="0.85" />
            <path d="M20 20 C19 18 20 16 22 16 C24 16 25 18 24 20 C23 22 21 22 20 20 Z" fill="#4a8c3a" opacity="0.8" />
            <path d="M30 20 C29 18 30 16 32 16 C34 16 35 18 34 20 C33 22 31 22 30 20 Z" fill="#3a6e28" opacity="0.8" />
            {/* Peach fruits hanging */}
            <circle cx="6" cy="16" r="2" fill={`url(#${uid}-peach)`} />
            <circle cx="5.2" cy="15.2" r="0.45" fill="white" opacity="0.22" />
            <circle cx="42" cy="14" r="1.8" fill={`url(#${uid}-peach)`} />
            <circle cx="41.2" cy="13.2" r="0.4" fill="white" opacity="0.22" />
            <circle cx="14" cy="20" r="1.6" fill={`url(#${uid}-peach)`} />
            <circle cx="13.2" cy="19.2" r="0.35" fill="white" opacity="0.2" />
            <circle cx="34" cy="18" r="1.6" fill={`url(#${uid}-peach)`} />
            <circle cx="33.2" cy="17.2" r="0.35" fill="white" opacity="0.2" />
            <circle cx="23" cy="20" r="1.5" fill={`url(#${uid}-peach)`} opacity="0.8" />
            {/* Dot texture */}
            <circle cx="10" cy="10" r="0.5" fill="#6ab04c" opacity="0.15" />
            <circle cx="18" cy="7" r="0.5" fill="#6ab04c" opacity="0.15" />
            <circle cx="26" cy="6" r="0.5" fill="#6ab04c" opacity="0.12" />
            <circle cx="34" cy="9" r="0.45" fill="#6ab04c" opacity="0.12" />
            <circle cx="40" cy="12" r="0.45" fill="#6ab04c" opacity="0.1" />
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
                <stop offset="0%" stopColor="#d4a017" />
                <stop offset="100%" stopColor="#b8860b" />
              </linearGradient>
            </defs>
            {/* Rosette leaves */}
            <path d="M24 46 Q14 42 6 40" stroke="#5a8c3f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q34 42 42 40" stroke="#4a7c35" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q18 42 10 38" stroke="#4a7c35" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q30 42 38 38" stroke="#5a8c3f" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q22 42 16 37" stroke="#6ab04c" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q26 42 32 37" stroke="#6ab04c" strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Fruit body */}
            <ellipse cx="24" cy="36" rx="4.5" ry="6" fill={`url(#${uid}-pine)`} />
            {/* Diamond pattern */}
            <path d="M20.5 33 L27.5 33 M20 35 L28 35 M20 37 L28 37 M20.5 39 L27.5 39" stroke="#a0780a" strokeWidth="0.35" fill="none" opacity="0.4" />
            <path d="M22 30.5 L22 41 M24 30 L24 42 M26 30.5 L26 41" stroke="#a0780a" strokeWidth="0.35" fill="none" opacity="0.35" />
            {/* Crown leaves */}
            <path d="M24 30 Q22 26 20 24" stroke="#5a8c3f" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            <path d="M24 30 Q26 26 28 24" stroke="#4a7c35" strokeWidth="0.9" fill="none" strokeLinecap="round" />
            <path d="M24 30 Q24 26 24 23" stroke="#6ab04c" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M24 30 Q21 27 19 26" stroke="#4a7c35" strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M24 30 Q27 27 29 26" stroke="#5a8c3f" strokeWidth="0.6" fill="none" strokeLinecap="round" />
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
            {/* Wide rosette leaves */}
            <path d="M24 46 Q12 40 2 38" stroke="#5a8c3f" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q36 40 46 38" stroke="#4a7c35" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q16 42 6 36" stroke="#4a7c35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q32 42 42 36" stroke="#5a8c3f" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q20 42 12 35" stroke="#6ab04c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q28 42 36 35" stroke="#6ab04c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 46 Q24 40 24 34" stroke="#5a8c3f" strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Fruit body — large oval */}
            <ellipse cx="24" cy="32" rx="6" ry="8.5" fill={`url(#${uid}-pine)`} />
            <ellipse cx="22" cy="28" rx="2" ry="3" fill="#e8c040" opacity="0.12" />
            {/* Diamond crosshatch */}
            <path d="M19 27 L29 27 M18.5 30 L29.5 30 M18.5 33 L29.5 33 M19 36 L29 36 M19.5 39 L28.5 39" stroke="#a0780a" strokeWidth="0.4" fill="none" opacity="0.4" />
            <path d="M21 24 L21 40 M24 23.5 L24 40.5 M27 24 L27 40" stroke="#a0780a" strokeWidth="0.4" fill="none" opacity="0.35" />
            {/* Crown — spiky leaves at top */}
            <path d="M24 23.5 Q20 18 16 14" stroke="#5a8c3f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 23.5 Q28 18 32 14" stroke="#4a7c35" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 23.5 Q24 18 24 12" stroke="#6ab04c" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M24 23.5 Q22 19 18 16" stroke="#4a7c35" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M24 23.5 Q26 19 30 16" stroke="#5a8c3f" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M24 23.5 Q21 20 20 18" stroke="#6ab04c" strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M24 23.5 Q27 20 28 18" stroke="#5a8c3f" strokeWidth="0.6" fill="none" strokeLinecap="round" />
            {/* Dot texture */}
            <circle cx="22" cy="28" r="0.5" fill={light} opacity="0.3" />
            <circle cx="26" cy="32" r="0.5" fill={light} opacity="0.25" />
            <circle cx="22" cy="36" r="0.45" fill={light} opacity="0.2" />
            <circle cx="26" cy="26" r="0.45" fill={light} opacity="0.25" />
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
            {/* Two weathered stakes */}
            <path d="M10 46 L10 16" stroke={trunk} strokeWidth="2.2" fill="none" />
            <path d="M38 46 L38 16" stroke={trunk} strokeWidth="2.2" fill="none" />
            {/* Thin wire supports */}
            <path d="M10 34 L38 34" stroke={trunk} strokeWidth="0.5" opacity="0.3" />
            <path d="M10 26 L38 26" stroke={trunk} strokeWidth="0.5" opacity="0.3" />
            <path d="M10 20 L38 20" stroke={trunk} strokeWidth="0.5" opacity="0.3" />
            {/* Varied organic vines — thick and thin, S and C curves */}
            <path d="M10 32 Q14 28 18 24 Q22 20 28 18 Q34 16 38 20" stroke="#5a8c3f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M38 30 Q34 26 28 22 Q22 18 16 18 Q12 18 10 20" stroke="#4a7c35" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M12 36 C16 34 20 28 24 26 C28 24 34 22 38 24" stroke="#6ab04c" strokeWidth="0.7" strokeLinecap="round" fill="none" />
            <path d="M38 34 C34 30 28 26 24 24 C20 22 16 22 12 24" stroke="#5a8c3f" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            <path d="M10 24 C14 22 18 18 24 16 C28 14 32 16 36 18" stroke="#4a7c35" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            <path d="M14 38 Q18 36 22 32" stroke="#5a8c3f" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            <path d="M36 32 Q32 28 26 26" stroke="#4a7c35" strokeWidth="0.5" strokeLinecap="round" fill="none" />
            {/* Tendrils — varied spiral shapes */}
            <path d="M16 26 Q14 24 15 22.5 Q15.5 24 16.5 23.5 Q16 25 17 24" stroke="#5a8c3f" strokeWidth="0.4" fill="none" opacity="0.5" />
            <path d="M30 20 Q32 18 31 17 Q30 19 31.5 19.5" stroke="#4a7c35" strokeWidth="0.35" fill="none" opacity="0.45" />
            <path d="M22 28 Q20 26.5 21 25.5 Q21.5 27 22.5 26" stroke="#6ab04c" strokeWidth="0.3" fill="none" opacity="0.4" />
            <path d="M34 24 Q36 22 35 21 Q34.5 23 36 23" stroke="#5a8c3f" strokeWidth="0.3" fill="none" opacity="0.4" />
            <path d="M18 32 Q16.5 30.5 17.5 30 Q17 31.5 18.5 31" stroke="#4a7c35" strokeWidth="0.3" fill="none" opacity="0.35" />
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
