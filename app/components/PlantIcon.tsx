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
  const typeInfo = TREE_TYPES[type] || TREE_TYPES.heartwood
  const color = typeInfo.color
  const shape = typeInfo.shape || 'oak'
  const rarity = typeInfo.rarity || 'common'
  const dark = darken(color, 40)
  const light = lighten(color, rarity === 'chroma' ? 50 : 25)
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
            {/* acorn splitting open with curved sprout */}
            <path d="M24 46 Q23.5 42 24 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <ellipse cx="24" cy="40" rx="3" ry="2" fill="#8B7355" opacity="0.4" />
            <path d="M24 38 Q23 36 24 33" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* two round baby oak leaves */}
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
            {/* two branches from trunk */}
            <path d="M24 34 Q18 30 15 28" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 32 Q28 30 30 28" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* broad bumpy canopy */}
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
            {/* irregular canopy outline */}
            <path d="M8 22 C7 16 10 10 16 8 Q19 6.5 24 7 Q29 6.5 32 8 C38 10 41 16 40 22 C41 26 38 30 34 32 Q30 33.5 24 34 Q18 33.5 14 32 C10 30 7 26 8 22 Z" fill={color} />
            {/* leaf bumps along canopy edge */}
            <path d="M10 14 Q8.5 12 10.5 11 Q12 12.5 10 14" fill={color} opacity="0.8" />
            <path d="M36 12 Q38 10.5 38.5 12.5 Q37 13.5 36 12" fill={color} opacity="0.8" />
            <path d="M7.5 24 Q5.5 23 6.5 21 Q8 22 7.5 24" fill={color} opacity="0.7" />
            <path d="M40.5 20 Q42 18.5 42.5 20.5 Q41 21.5 40.5 20" fill={color} opacity="0.7" />
            <path d="M15 32.5 Q13 33 13.5 31 Q15 31.5 15 32.5" fill={color} opacity="0.6" />
            <path d="M33 32.5 Q35 33 34.5 31 Q33 31.5 33 32.5" fill={color} opacity="0.6" />
            {/* subtle leaf texture */}
            {/* vein/branch texture strokes */}
            <path d="M24 20 Q20 18 16 20" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M24 20 Q28 17 32 18" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.1" />
            <path d="M24 20 Q22 24 20 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M18 14 Q16 17 14 20" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.08" />
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
            {/* slender stem with a single tiny maple leaf */}
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 40 L24.5 40" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* mini 5-pointed maple leaf */}
            <path d="M24 28 L22 31 L19 30 L21 33 L19 35 L22 34 L24 36 L26 34 L29 35 L27 33 L29 30 L26 31 Z" fill={color} opacity="0.7" />
            <path d="M24 28 L23 31 L24 33 L25 31 Z" fill={light} opacity="0.25" />
            <path d="M24 33 L24 36" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 30" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M23.5 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* branch from trunk */}
            <path d="M24 34 Q18 30 14 28" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* angular maple canopy connected to trunk top */}
            <path d="M24 18 L20 22 L16 21 L19 25 L16 28 L21 27 L24 30 L27 27 L32 28 L29 25 L32 21 L28 22 Z" fill={color} opacity="0.75" />
            <path d="M24 18 L22 22 L24 26 L26 22 Z" fill={light} opacity="0.25" />
            {/* leaf veins */}
            <path d="M24 22 L20 25" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.18" />
            <path d="M24 22 L28 25" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.18" />
            <circle cx="22" cy="23" r="0.8" fill={light} opacity="0.15" />
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
            {/* angular shadow patches */}
            <path d="M16 19 L19 18 L20 21 L17 22 Z" fill={dark} opacity="0.18" />
            <path d="M29 18 L32 19 L31 22 L28 21 Z" fill={dark} opacity="0.18" />
            <path d="M13 23 L15 22.5 L15.5 25 L12.8 25.2 Z" fill={dark} opacity="0.13" />
            <path d="M33 22.5 L35.2 23 L35 25.2 L32.5 25 Z" fill={dark} opacity="0.13" />
            {/* vein-end blobs */}
            <path d="M19.5 13 Q20.2 12.5 21 13.2 Q20.5 14 19.5 13.5 Z" fill={light} opacity="0.2" />
            <path d="M27 13 Q28 12.5 28.5 13.5 Q28 14.2 27.2 13.8 Z" fill={light} opacity="0.17" />
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
            {/* low bushy sprout with multiple little bumps */}
            <path d="M24 46 L24 38" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 38 Q20 36 18 38" stroke={trunk} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M24 38 Q28 36 30 38" stroke={trunk} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* three overlapping small domes */}
            <ellipse cx="19" cy="35" rx="4" ry="3.5" fill={color} opacity="0.6" />
            <ellipse cx="29" cy="35" rx="4" ry="3.5" fill={color} opacity="0.55" />
            <ellipse cx="24" cy="34" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="22" cy="33" rx="2" ry="1.5" fill={light} opacity="0.25" />
            <circle cx="27" cy="34" r="0.6" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            {/* branches split from trunk into dome centers */}
            <path d="M24 38 Q18 34 16 32" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M24 38 Q30 34 32 32" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* three connected domes */}
            <ellipse cx="16" cy="29" rx="6" ry="5" fill={color} opacity="0.65" />
            <ellipse cx="32" cy="29" rx="6" ry="5" fill={color} opacity="0.6" />
            <ellipse cx="24" cy="27" rx="8" ry="6.5" fill={color} opacity="0.8" />
            <ellipse cx="22" cy="25" rx="3" ry="2" fill={light} opacity="0.25" />
            <ellipse cx="28" cy="30" rx="3" ry="2" fill={dark} opacity="0.1" />
            <circle cx="15" cy="28" r="0.8" fill={light} opacity="0.15" />
            <circle cx="30" cy="27" r="0.7" fill={light} opacity="0.12" />
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
            {/* left dome - lumpy bezier */}
            <path d="M2 34 C1 30 3 24 8 22 Q10 21 13 22 Q16 21 18 23 C20 25 21 30 20 34 Q16 35 12 35 Q6 35 2 34 Z" fill={color} />
            {/* right dome - lumpy bezier */}
            <path d="M28 34 C27 30 29 24 34 22 Q36 21 38 22 Q41 21 43 24 C45 27 46 31 44 34 Q40 35 36 35 Q32 35 28 34 Z" fill={color} />
            {/* center dome - lumpy bezier, overlaps */}
            <path d="M12 34 C11 28 13 20 18 18 Q21 16.5 24 17 Q27 16.5 30 18 C35 20 37 28 36 34 Q30 35.5 24 35 Q18 35.5 12 34 Z" fill={color} />
            {/* leaf bumps along dome edges */}
            <path d="M4 26 Q2.5 24.5 4 23.5 Q5 25 4 26" fill={color} opacity="0.8" />
            <path d="M42 26 Q43.5 24.5 43 23 Q41.5 24.5 42 26" fill={color} opacity="0.8" />
            <path d="M20 18 Q19 16 21 16.5 Q20.5 17.5 20 18" fill={color} opacity="0.7" />
            <path d="M28 18 Q29 16 27 16.5 Q27.5 17.5 28 18" fill={color} opacity="0.7" />
            {/* vein/branch strokes */}
            <path d="M24 22 Q20 24 16 28" stroke={dark} strokeWidth="0.35" fill="none" opacity="0.12" />
            <path d="M24 22 Q28 24 32 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M12 26 Q10 28 8 32" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M36 26 Q38 28 40 32" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
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
            {/* thin green stem with a closed bud at top */}
            <path d="M24 46 L24 34" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" />
            {/* small leaf pair on stem */}
            <path d="M24 38 Q21 36 20 38 Q22 35 24 37" fill="#6ab04c" opacity="0.5" />
            <path d="M24 38 Q27 36 28 38 Q26 35 24 37" fill="#5ea862" opacity="0.45" />
            {/* closed bud - teardrop shape with petal hints */}
            <path d="M24 34 Q22 32 22.5 29 Q23 27 24 27 Q25 27 25.5 29 Q26 32 24 34 Z" fill={color} opacity="0.65" />
            <path d="M24 28 Q23.5 27.5 24 27 Q24.5 27.5 24 28 Z" fill={light} opacity="0.3" />
            <path d="M23 30 L25 30" stroke={dark} strokeWidth="0.3" opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke="#5a8c3f" strokeWidth="2" strokeLinecap="round" />
            {/* leaf branch */}
            <path d="M24 36 Q19 32 16 30" stroke="#5a8c3f" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M16 30 Q14 27 16 25 Q18 28 16 30" fill="#6ab04c" />
            <path d="M16 27.5 L16 25.5" stroke="#4a7c35" strokeWidth="0.4" opacity="0.3" />
            {/* opening flower - petals spreading */}
            <path d="M24 22 Q22 19 24 17 Q26 19 24 22 Z" fill={color} opacity="0.6" />
            <path d="M24 22 Q20 21 19 23 Q21 24 24 22 Z" fill={color} opacity="0.55" />
            <path d="M24 22 Q28 21 29 23 Q27 24 24 22 Z" fill={color} opacity="0.55" />
            <path d="M24 22 Q22 24 21 26 Q23 25 24 22 Z" fill={color} opacity="0.5" />
            <path d="M24 22 Q26 24 27 26 Q25 25 24 22 Z" fill={color} opacity="0.5" />
            {/* yellow center */}
            <circle cx="24" cy="22" r="2" fill="#fbbf24" opacity="0.7" />
            <circle cx="23.5" cy="21.5" r="0.7" fill="#fde68a" opacity="0.3" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 C24 40 23.8 34 24 26" stroke="#5a8c3f" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23.5 40 L24.8 39.8" stroke="#4a7c35" strokeWidth="0.4" opacity="0.2" />
            {/* left leaf branch - connected to stem */}
            <path d="M24 36 Q18 32 14 30" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M14 30 Q12 26 14 24 Q16 28 14 30" fill="#6ab04c" />
            <path d="M14 27 L14 24.5" stroke="#4a7c35" strokeWidth="0.4" opacity="0.3" />
            {/* right leaf branch */}
            <path d="M24 34 Q30 30 33 28" stroke="#5a8c3f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M33 28 Q35 25 33 23 Q31 26 33 28" fill="#6ab04c" />
            <path d="M33 25.5 L33 23.5" stroke="#4a7c35" strokeWidth="0.4" opacity="0.3" />
            {/* full flower with teardrop petals - connected at center */}
            <path d="M24 20 Q20 17 18 20 Q20 22 24 20 Z" fill={color} opacity="0.8" />
            <path d="M24 20 Q28 17 30 20 Q28 22 24 20 Z" fill={color} opacity="0.8" />
            <path d="M24 20 Q22 16 24 14 Q26 16 24 20 Z" fill={color} opacity="0.75" />
            <path d="M24 20 Q20 22 19 25 Q22 23 24 20 Z" fill={color} opacity="0.7" />
            <path d="M24 20 Q28 22 29 25 Q26 23 24 20 Z" fill={color} opacity="0.7" />
            {/* petal highlights */}
            <circle cx="19" cy="19" r="0.8" fill={light} opacity="0.2" />
            <circle cx="29" cy="19" r="0.7" fill={light} opacity="0.15" />
            <circle cx="24" cy="15" r="0.6" fill={light} opacity="0.15" />
            {/* yellow center */}
            <circle cx="24" cy="20" r="2.5" fill="#fbbf24" />
            <circle cx="23.2" cy="19.2" r="1" fill="#fde68a" opacity="0.5" />
            <circle cx="25" cy="19.5" r="0.4" fill="#fde68a" opacity="0.3" />
          </g>
        )
        return (
          <g>
            {/* stem — extends up to flower center */}
            <path d="M24 46 C24 40 23.5 30 24 17" stroke="#5a8c3f" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M23.5 40 L25 39.8" stroke="#4a7c35" strokeWidth="0.5" opacity="0.2" />
            <path d="M23.5 36 L25 35.8" stroke="#4a7c35" strokeWidth="0.4" opacity="0.18" />
            {/* leaf branches */}
            <path d="M24 36 Q17 32 13 30" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M13 30 Q10 26 12 22 Q14 26 13 30" fill="#6ab04c" />
            <path d="M12 26.5 L12.5 23" stroke="#4a7c35" strokeWidth="0.4" opacity="0.3" />
            <path d="M24 38 Q31 34 34 32" stroke="#5a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M34 32 Q37 28 35 24 Q33 28 34 32" fill="#6ab04c" />
            <path d="M35 28 L35.2 25" stroke="#4a7c35" strokeWidth="0.4" opacity="0.3" />
            <path d="M24 42 Q19 39 16 37 Q19 36 24 40" fill="#6ab04c" opacity="0.4" />
            <path d="M24 34 Q29 31 32 29 Q29 30 24 33" fill="#6ab04c" opacity="0.3" />
            {/* petals — organic teardrop shapes */}
            <path d="M24 17 Q18 14 16 8 Q18 6 24 10 Z" fill={color} />
            <path d="M24 17 Q30 14 32 8 Q30 6 24 10 Z" fill={color} />
            <path d="M24 17 Q17 18 12 18 Q12 15 18 14 Z" fill={color} />
            <path d="M24 17 Q31 18 36 18 Q36 15 30 14 Z" fill={color} />
            <path d="M24 17 Q20 22 17 24 Q16 21 20 17 Z" fill={color} opacity="0.9" />
            <path d="M24 17 Q28 22 31 24 Q32 21 28 17 Z" fill={color} opacity="0.9" />
            <path d="M24 10 Q22 5 24 3 Q26 5 24 10" fill={light} opacity="0.5" />
            {/* petal depth */}
            <path d="M18 14 Q16 11 18 8" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M30 14 Q32 11 30 8" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            {/* petal highlights */}
            <circle cx="18" cy="10" r="1.2" fill={light} opacity="0.2" />
            <circle cx="30" cy="10" r="1" fill={light} opacity="0.18" />
            <circle cx="14" cy="16" r="0.8" fill={light} opacity="0.15" />
            <circle cx="34" cy="16" r="0.8" fill={light} opacity="0.15" />
            <circle cx="24" cy="5" r="1" fill={light} opacity="0.2" />
            {/* center */}
            <circle cx="24" cy="17" r="3.5" fill="#fbbf24" />
            <path d="M22 16 Q24 14 26 16 Q24 18 22 16" fill="#fde68a" opacity="0.5" />
            <circle cx="23" cy="16" r="1.2" fill="#fde68a" opacity="0.6" />
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
            {/* single curled fiddlehead emerging */}
            <path d="M24 46 Q23.5 42 24 38" stroke="#4a8c3f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* fiddlehead spiral */}
            <path d="M24 38 Q24 34 22 32 Q20 30 20 28 Q20 26 22 26 Q24 26 24 28 Q24 30 22 30" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <circle cx="22" cy="30" r="1" fill={color} opacity="0.6" />
            <circle cx="22" cy="28" r="0.5" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* central spine with alternating leaflets */}
            <path d="M24 46 Q23 40 24 26" stroke="#4a8c3f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            {/* paired leaflets - alternating sides, connected to stem */}
            <path d="M24 38 Q17 34 12 36 Q17 31 24 36" fill={color} />
            <path d="M24 33 Q31 29 36 31 Q31 26 24 31" fill={color} />
            <path d="M24 28 Q19 24 14 26 Q19 21 24 26" fill={light} opacity="0.6" />
            {/* curled tip at top */}
            <path d="M24 26 Q22 24 22 22 Q22 20 24 20" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
            {/* frond midribs */}
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
            {/* thin trunk with tiny round green canopy */}
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M23.5 42 L24.5 42" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* tiny perfectly round green canopy */}
            <circle cx="24" cy="32" r="4.5" fill="#3a7a2a" opacity="0.7" />
            <circle cx="22.5" cy="30.5" r="2" fill="#4a8c3a" opacity="0.4" />
            <circle cx="25.5" cy="33.5" r="1.5" fill="#2a6a1e" opacity="0.15" />
            {/* one tiny fruit */}
            <circle cx="26" cy="30" r="1" fill={color} opacity="0.5" />
            <circle cx="25.5" cy="29.5" r="0.3" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 32" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M23.5 38 L24.8 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* branch from trunk */}
            <path d="M24 36 Q20 34 18 32" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* round canopy connected to trunk top */}
            <circle cx="24" cy="24" r="9" fill="#3a7a2a" opacity="0.8" />
            <circle cx="21" cy="21" r="4" fill="#4a8c3a" opacity="0.5" />
            <circle cx="27" cy="27" r="3" fill="#2a6a1e" opacity="0.15" />
            {/* two visible fruits */}
            <circle cx="27" cy="20" r="1.5" fill={color} opacity="0.6" />
            <circle cx="20" cy="26" r="1.3" fill={color} opacity="0.5" />
            <circle cx="26.5" cy="19.5" r="0.4" fill={light} opacity="0.2" />
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
            {/* irregular canopy outline */}
            <path d="M10 22 C9 15 13 9 19 8 Q22 7 24 8 Q26 7 29 8 C35 9 39 15 38 22 C39 27 36 32 31 34 Q28 35 24 35 Q20 35 17 34 C12 32 9 27 10 22 Z" fill="#3a7a2a" />
            {/* leaf bumps along edge */}
            <path d="M11 15 Q9.5 13 11.5 12.5 Q12.5 14 11 15" fill="#3a7a2a" opacity="0.8" />
            <path d="M36 12 Q37.5 10.5 38 12 Q37 13 36 12" fill="#3a7a2a" opacity="0.8" />
            <path d="M9.5 25 Q8 23.5 9.5 22.5 Q10.5 24 9.5 25" fill="#3a7a2a" opacity="0.7" />
            <path d="M38 19 Q39.5 17.5 39.5 19.5 Q38.5 20 38 19" fill="#3a7a2a" opacity="0.7" />
            <path d="M18 34 Q16.5 34.5 17 33 Q18 33 18 34" fill="#3a7a2a" opacity="0.6" />
            <path d="M30 34 Q31.5 34.5 31 33 Q30 33 30 34" fill="#3a7a2a" opacity="0.6" />
            {/* organic shadow patches */}
            <path d="M20 28 Q24 30 28 28 Q27 33 24 34 Q21 33 20 28 Z" fill="#2a6a1e" opacity="0.12" />
            <path d="M28 20 Q32 18 34 22 Q32 26 28 24 Q27 22 28 20 Z" fill="#2a6a1e" opacity="0.4" />
            <path d="M14 20 Q12 18 13 16 Q16 17 16 20 Q15 21 14 20 Z" fill="#2a6a1e" opacity="0.2" />
            {/* highlight cluster - upper left */}
            <path d="M16 14 Q19 11 23 13 Q21 16 17 17 Q15 16 16 14 Z" fill="#4a8c3a" opacity="0.6" />
            <path d="M20 17 Q22 15 24 17 Q22 19 20 17 Z" fill="#4a8c3a" opacity="0.3" />
            {/* fruit-like accents as teardrop leaves */}
            <path d="M17 24 Q16 22 18.5 22.5 Q18.5 24.5 17 24 Z" fill={color} />
            <path d="M27 13 Q26 11.5 28 12 Q28.5 13.5 27 13 Z" fill={color} />
            <path d="M31 21 Q30 19.5 32 20 Q32 21.5 31 21 Z" fill={color} />
            <path d="M14 18 Q13 17 15 17 Q14.5 18.5 14 18 Z" fill={color} opacity="0.8" />
            <path d="M22 11 Q21 10 23 10.5 Q22.5 11.5 22 11 Z" fill={color} opacity="0.6" />
            {/* vein/branch texture strokes */}
            <path d="M24 20 Q20 18 16 20" stroke="#2a6a1e" strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M24 20 Q28 17 32 18" stroke="#2a6a1e" strokeWidth="0.35" fill="none" opacity="0.1" />
            <path d="M24 20 Q22 24 20 28" stroke="#2a6a1e" strokeWidth="0.3" fill="none" opacity="0.1" />
            {/* small teardrop leaves at edges */}
            <path d="M24 9 Q23 7.5 25 8 Q24.5 9.5 24 9 Z" fill="#4a8c3a" opacity="0.3" />
            <path d="M12 22 Q11 20.5 13 21 Q12.5 22.5 12 22 Z" fill="#5a9c4a" opacity="0.2" />
            <path d="M34 18 Q35 16.5 35.5 18 Q34.5 19 34 18 Z" fill="#5a9c4a" opacity="0.15" />
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
            {/* short trunk with single small triangle */}
            <rect x="23" y="38" width="2" height="8" fill={trunk} />
            <path d="M24 26 L19 38 L29 38 Z" fill={color} opacity="0.7" />
            {/* inner highlight triangle */}
            <path d="M24 28 L22 34 L26 34 Z" fill={light} opacity="0.2" />
            {/* tiny needle marks */}
            <path d="M22 34 L21 35" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M26 34 L27 35" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 30 L24 36" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="36" width="3" height="10" fill={trunk} />
            <path d="M23 40 L25 39.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* two layered triangles touching trunk at base */}
            <path d="M24 16 L18 28 L30 28 Z" fill={color} />
            <path d="M24 24 L15 36 L33 36 Z" fill={color} />
            {/* highlight */}
            <path d="M24 18 L22 24 L26 24 Z" fill={light} opacity="0.2" />
            {/* layer edge shadow */}
            <path d="M20 28 L28 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            {/* needle texture */}
            <path d="M24 20 L24 32" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M20 26 L19 27" stroke={light} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M28 26 L29 27" stroke={light} strokeWidth="0.4" fill="none" opacity="0.12" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* trunk connects directly to bottom triangle */}
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M22.5 40 L25.5 39.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 43 L25 42.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            {/* three layered triangles - each overlaps at base */}
            <path d="M24 8 L17 20 L31 20 Z" fill={color} />
            <path d="M24 16 L14 28 L34 28 Z" fill={color} />
            <path d="M24 24 L11 36 L37 36 Z" fill={color} />
            {/* highlight on top layer */}
            <path d="M24 10 L21 18 L27 18 Z" fill={light} opacity="0.22" />
            {/* layer edge shadows */}
            <path d="M19 20 L29 20" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.12" />
            <path d="M16 28 L32 28" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.1" />
            {/* center spine */}
            <path d="M24 10 L24 34" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            {/* needle marks */}
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
            {/* layer shadows */}
            <path d="M16 20 L32 20" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.12" />
            <path d="M14 28 L34 28" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.1" />
            <path d="M12 36 L36 36" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.08" />
            {/* texture details — needle marks */}
            <path d="M24 8 L24 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 16 L24 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            {/* irregular needle dashes */}
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
            {/* dark needle texture patches */}
            <path d="M20 18 Q21 17.5 21.5 18.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M26 22 Q27.5 21.5 27 23" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.08" />
            <path d="M18 30 Q19 29 19.5 30.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.08" />
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
            {/* lavender spike — layered floret bumps */}
            <path d="M24 32 Q22.2 30.5 22.5 29 Q22.8 27.5 24 27 Q25.2 27.5 25.5 29 Q25.8 30.5 24 32 Z" fill={color} opacity="0.55" />
            <path d="M24 28.5 Q22.5 27 22.8 25.5 Q23.2 24.2 24 24 Q24.8 24.2 25.2 25.5 Q25.5 27 24 28.5 Z" fill={color} opacity="0.65" />
            <path d="M24 25.5 Q23 24.5 23.2 23.5 Q23.5 22.5 24 22.5 Q24.5 22.5 24.8 23.5 Q25 24.5 24 25.5 Z" fill={color} opacity="0.5" />
            {/* tiny floret petals */}
            <path d="M23.3 26 Q24 25 24.7 26 Q24 26.8 23.3 26 Z" fill={light} opacity="0.3" />
            <path d="M23.5 29 Q24 28.2 24.5 29 Q24 29.6 23.5 29 Z" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 26" stroke="#5a8c3f" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 46 L20 32" stroke="#4a7c35" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M24 34 Q20 30 18 32" stroke="#5a8c3f" strokeWidth="0.8" fill="none" />
            {/* center spike — stacked floret bumps */}
            <path d="M24 28 Q21.8 26 22 24 Q22.3 22 24 21 Q25.7 22 26 24 Q26.2 26 24 28 Z" fill={color} opacity="0.8" />
            <path d="M24 23 Q22.5 21.5 22.8 19.5 Q23.2 17.8 24 17 Q24.8 17.8 25.2 19.5 Q25.5 21.5 24 23 Z" fill={color} opacity="0.85" />
            <path d="M24 19 Q23.2 18 23.4 16.5 Q23.7 15.2 24 15 Q24.3 15.2 24.6 16.5 Q24.8 18 24 19 Z" fill={color} opacity="0.7" />
            {/* left spike */}
            <path d="M20 33 Q18.5 31.5 18.6 30 Q18.8 28.5 20 28 Q21.2 28.5 21.4 30 Q21.5 31.5 20 33 Z" fill={color} opacity="0.6" />
            <path d="M20 29.5 Q19 28 19.2 26.5 Q19.5 25.2 20 25 Q20.5 25.2 20.8 26.5 Q21 28 20 29.5 Z" fill={color} opacity="0.65" />
            {/* floret petal highlights */}
            <path d="M23.3 20 Q24 19 24.7 20 Q24 20.8 23.3 20 Z" fill={light} opacity="0.3" />
            <path d="M23.5 25 Q24 24.2 24.5 25 Q24 25.6 23.5 25 Z" fill={light} opacity="0.25" />
            <path d="M19.5 27 Q20 26.3 20.5 27 Q20 27.6 19.5 27 Z" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 24" stroke="#5a8c3f" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 46 L18 30" stroke="#4a7c35" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M30 46 L30 28" stroke="#4a7c35" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M24 34 Q20 30 17 32" stroke="#5a8c3f" strokeWidth="0.8" fill="none" />
            {/* center spike */}
            <path d="M24 27 Q21.5 25 21.8 22.5 Q22 20 24 18 Q26 20 26.2 22.5 Q26.5 25 24 27 Z" fill={color} />
            <path d="M24 20 Q22.8 18.5 23 16.5 Q23.3 14.5 24 13.5 Q24.7 14.5 25 16.5 Q25.2 18.5 24 20 Z" fill={color} opacity="0.85" />
            <path d="M24 15.5 Q23.4 14.5 23.6 13 Q23.8 11.5 24 11 Q24.2 11.5 24.4 13 Q24.6 14.5 24 15.5 Z" fill={color} opacity="0.7" />
            {/* left spike */}
            <path d="M18 31 Q16.2 29 16.4 27 Q16.7 25 18 24 Q19.3 25 19.6 27 Q19.8 29 18 31 Z" fill={color} opacity="0.7" />
            <path d="M18 26 Q17 24.5 17.2 22.5 Q17.5 20.8 18 20 Q18.5 20.8 18.8 22.5 Q19 24.5 18 26 Z" fill={color} opacity="0.75" />
            {/* right spike */}
            <path d="M30 29 Q28.2 27 28.4 25 Q28.7 23 30 22 Q31.3 23 31.6 25 Q31.8 27 30 29 Z" fill={color} opacity="0.7" />
            <path d="M30 24 Q29 22.5 29.2 20.8 Q29.5 19 30 18 Q30.5 19 30.8 20.8 Q31 22.5 30 24 Z" fill={color} opacity="0.75" />
            {/* floret petal highlights */}
            <path d="M23.3 17 Q24 16 24.7 17 Q24 17.8 23.3 17 Z" fill={light} opacity="0.3" />
            <path d="M23.5 22 Q24 21.2 24.5 22 Q24 22.6 23.5 22 Z" fill={light} opacity="0.25" />
            <path d="M17.5 23 Q18 22.3 18.5 23 Q18 23.6 17.5 23 Z" fill={light} opacity="0.22" />
            <path d="M29.5 21 Q30 20.3 30.5 21 Q30 21.6 29.5 21 Z" fill={light} opacity="0.22" />
            <path d="M17.6 27.5 Q18 26.8 18.4 27.5 Q18 28 17.6 27.5 Z" fill={light} opacity="0.18" />
            <path d="M29.6 25.5 Q30 24.8 30.4 25.5 Q30 26 29.6 25.5 Z" fill={light} opacity="0.18" />
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
            {/* center spike — organic bumpy shape */}
            <path d="M24 26 Q21 24 21.2 20 Q21.5 16 24 10 Q26.5 16 26.8 20 Q27 24 24 26 Z" fill={color} />
            <path d="M24 22 Q22.5 20 22.8 17 Q23 14 24 12 Q25 14 25.2 17 Q25.5 20 24 22 Z" fill={light} opacity="0.35" />
            {/* left spike */}
            <path d="M18 29 Q15.8 27 16 23 Q16.2 19 18 15 Q19.8 19 20 23 Q20.2 27 18 29 Z" fill={color} opacity="0.8" />
            <path d="M18 25 Q17 23 17.2 20 Q17.5 17.5 18 16 Q18.5 17.5 18.8 20 Q19 23 18 25 Z" fill={light} opacity="0.28" />
            {/* right spike */}
            <path d="M30 27 Q27.8 25 28 21 Q28.2 17 30 13 Q31.8 17 32 21 Q32.2 25 30 27 Z" fill={color} opacity="0.8" />
            <path d="M30 23 Q29 21 29.2 18 Q29.5 15.5 30 14 Q30.5 15.5 30.8 18 Q31 21 30 23 Z" fill={light} opacity="0.28" />
            {/* irregular floret clusters — 3-petal bezier shapes */}
            <path d="M24 11.5 Q24.6 10.8 24.2 11 Q25 11.2 24.5 11.8 Q23.5 11.3 24 11.5Z" fill={light} opacity="0.3" />
            <path d="M23.6 12.8 L24.4 12.2 L24.1 13.2Z" fill={light} opacity="0.25" />
            <path d="M24 15.5 Q24.8 15 24.3 15.3 Q24.6 16.2 24 16 Q23.5 15.8 24 15.5Z" fill={light} opacity="0.2" />
            <path d="M23.5 16.3 L24.3 15.9 L24 16.7Z" fill={light} opacity="0.18" />
            <path d="M24.2 21.5 Q24.8 21 24.5 21.5 Q24.8 22.2 24.2 22 Q23.7 21.8 24.2 21.5Z" fill={light} opacity="0.18" />
            <path d="M23.6 22.3 L24.2 21.8 L24 22.6Z" fill={light} opacity="0.15" />
            {/* left spike florets */}
            <path d="M18 16.5 Q18.6 16 18.3 16.3 Q18.7 17.1 18 17 Q17.5 16.7 18 16.5Z" fill={light} opacity="0.22" />
            <path d="M17.6 17.4 L18.3 16.9 L18 17.7Z" fill={light} opacity="0.18" />
            <path d="M18 20.5 Q18.5 20 18.2 20.3 Q18.5 21 18 21 Q17.6 20.7 18 20.5Z" fill={light} opacity="0.18" />
            <path d="M17.7 21.2 L18.3 20.8 L18 21.5Z" fill={light} opacity="0.15" />
            <path d="M18.2 24.5 Q18.7 24 18.4 24.3 Q18.7 25 18.2 25 Q17.8 24.7 18.2 24.5Z" fill={light} opacity="0.15" />
            {/* right spike florets */}
            <path d="M30 14.5 Q30.6 14 30.3 14.3 Q30.7 15.1 30 15 Q29.5 14.7 30 14.5Z" fill={light} opacity="0.22" />
            <path d="M29.7 15.3 L30.3 14.8 L30 15.6Z" fill={light} opacity="0.18" />
            <path d="M30 18.5 Q30.5 18 30.2 18.3 Q30.5 19 30 19 Q29.6 18.7 30 18.5Z" fill={light} opacity="0.18" />
            <path d="M29.8 19.3 L30.3 18.8 L30 19.6Z" fill={light} opacity="0.15" />
            <path d="M30.2 22.5 Q30.6 22 30.4 22.3 Q30.6 23 30.2 23 Q29.8 22.7 30.2 22.5Z" fill={light} opacity="0.15" />
            {/* depth shadow — irregular patches */}
            <path d="M22.5 24 Q24 24.8 25.5 24 Q24.5 25.2 23 25Z" fill={dark} opacity="0.1" />
            <path d="M17 27 Q18 27.6 19.2 27 Q18.3 27.8 17.5 27.5Z" fill={dark} opacity="0.08" />
            <path d="M29 25 Q30 25.6 31.2 25 Q30.3 25.8 29.3 25.5Z" fill={dark} opacity="0.08" />
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
            {/* organic leaf clusters */}
            <path d="M7 21 Q7.5 19 10 19 Q14 19.5 16 21 Q17 23 15.5 25.5 Q13 27.5 10 27 Q7.5 26 7 23.5 Q6.5 22 7 21 Z" fill={color} opacity="0.7" />
            <path d="M29 13 Q30 11 33 11.5 Q37 12 40 14 Q41 16 39.5 18.5 Q37 20 34 19.5 Q30.5 18.5 29.5 16 Q29 14.5 29 13 Z" fill={color} opacity="0.7" />
            <path d="M8.5 8.5 Q9.5 7 12 7.5 Q14.5 8 16 9.5 Q16 11.5 14 12.5 Q11.5 13 9.5 12 Q8 10.5 8.5 8.5 Z" fill={color} opacity="0.5" />
            <path d="M19 5.5 Q20 3.5 23 3.5 Q26.5 4 28.5 5.5 Q29 7.5 27 9 Q24 10 21.5 9 Q19.5 8 19 5.5 Z" fill={light} opacity="0.4" />
            {/* leaf highlights */}
            <path d="M9 21 Q10.5 19.5 12 21 Q10.5 22 9 21 Z" fill={light} opacity="0.2" />
            <path d="M33 13.5 Q34.5 12 35.5 14 Q34 15 33 13.5 Z" fill={light} opacity="0.18" />
            <path d="M11 8.5 Q12 7.5 13 9 Q12 10 11 8.5 Z" fill={light} opacity="0.15" />
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
            {/* irregular leaf cluster blobs */}
            <path d="M5 24 Q4.5 20 7 19.5 Q9 18.5 12 19 Q16.5 19.5 16 23 Q15.8 26.5 13 28.5 Q10 29.5 7 28.5 Q4.8 27.5 5 24Z" fill={color} opacity="0.8" />
            <path d="M29.5 16 Q29 12 32 11 Q35 10 39 11.5 Q43 13 42.5 16.5 Q42 19.5 39 20.8 Q35.5 22 32 20.5 Q29.5 19 29.5 16Z" fill={color} opacity="0.8" />
            <path d="M5.5 10 Q5 7 8 6.5 Q10.5 6 13 7 Q15.5 8.5 14.5 11 Q13.5 13.5 11 14 Q8 14 6 12.5 Q5.2 11.8 5.5 10Z" fill={color} opacity="0.7" />
            <path d="M18.5 6 Q19 3 22 2.5 Q25 2 28 3 Q30.5 4.5 30 7 Q29.5 9.5 27 10 Q24 10.5 21 9.5 Q18.8 8.5 18.5 6Z" fill={light} opacity="0.5" />
            <path d="M30.5 9 Q30 7 32 6.5 Q34 6 36.5 7 Q38.5 8.5 38 10.5 Q37 12 35 12 Q32.5 12 31 11 Q30.3 10.2 30.5 9Z" fill={color} opacity="0.4" />
            {/* teardrop leaf details along edges */}
            <path d="M6 21 Q7 19.5 8 21 Q7 22 6 21Z" fill={light} opacity="0.22" />
            <path d="M13 20 Q14 18.5 14.5 20 Q14 21 13 20Z" fill={light} opacity="0.18" />
            <path d="M31 13 Q32.5 11.5 33 13 Q32 14 31 13Z" fill={light} opacity="0.2" />
            <path d="M38 14 Q39 12.5 39.5 14 Q39 15.2 38 14Z" fill={light} opacity="0.18" />
            <path d="M7 8 Q8 6.5 9 8 Q8 9 7 8Z" fill={light} opacity="0.18" />
            <path d="M12 7.5 Q13 6 13.5 7.5 Q13 8.5 12 7.5Z" fill={light} opacity="0.15" />
            <path d="M21 4.5 Q22 3 23 4.5 Q22 5.5 21 4.5Z" fill={light} opacity="0.22" />
            <path d="M27 4 Q28 2.5 28.5 4 Q28 5 27 4Z" fill={light} opacity="0.18" />
            {/* vein/branch strokes inside clusters */}
            <path d="M8 22 Q10 21 12 22.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M10 25 Q11 24 13 24.5" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M33 14 Q35 13 37 14" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M35 17 Q37 16 39 17" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M8 9 Q10 8 12 9" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M22 5 Q24 4 26 5" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            {/* depth shadows — irregular patches */}
            <path d="M8 27 Q10 28.5 14 28 Q12 29 9 28.5Z" fill={dark} opacity="0.08" />
            <path d="M35 19 Q37 20.5 41 19.5 Q39 20.5 36 20Z" fill={dark} opacity="0.08" />
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
            {/* neat stick with perfectly trimmed small ball */}
            <rect x="23" y="38" width="2" height="8" rx="0.5" fill={trunk} />
            {/* trimmed sphere outline */}
            <circle cx="24" cy="33" r="5.5" fill={color} opacity="0.65" />
            {/* trim lines suggesting manicured shape */}
            <path d="M20 35 Q24 34 28 35" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M21 31 Q24 30 27 31" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <circle cx="22" cy="31" r="2" fill={light} opacity="0.2" />
            <circle cx="26" cy="35" r="1.5" fill={dark} opacity="0.1" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="36" width="3" height="10" rx="0.8" fill={trunk} />
            <path d="M23 40 L25 39.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* larger manicured sphere */}
            <circle cx="24" cy="27" r="10" fill={color} opacity="0.8" />
            {/* subtle trim texture */}
            <path d="M16 30 Q24 28 32 30" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M18 24 Q24 22 30 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <circle cx="20" cy="23" r="4" fill={light} opacity="0.2" />
            <circle cx="29" cy="30" r="3" fill={dark} opacity="0.15" />
            <circle cx="24" cy="20" r="1" fill={light} opacity="0.15" />
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
            {/* slightly wobbly sphere outline */}
            <path d="M10 22 C9.5 14 13 8.5 18 8 Q21 7 24 8 Q27 7 30 8 C35 8.5 38.5 14 38 22 C38.5 28 35 33.5 30 35 Q27 36 24 35.5 Q21 36 18 35 C13 33.5 9.5 28 10 22 Z" fill={color} />
            {/* leaf bumps - subtle topiary edges */}
            <path d="M11 14 Q9.5 12.5 11.5 12 Q12 13.5 11 14" fill={color} opacity="0.8" />
            <path d="M37 13 Q38.5 11.5 38.5 13.5 Q37.5 14 37 13" fill={color} opacity="0.8" />
            <path d="M9.5 26 Q8 24.5 10 24 Q10.5 25.5 9.5 26" fill={color} opacity="0.7" />
            <path d="M38.5 24 Q40 22.5 39.5 24.5 Q38.5 25 38.5 24" fill={color} opacity="0.7" />
            {/* organic shadow patches */}
            <path d="M20 28 Q24 31 28 28 Q27 34 24 35 Q21 34 20 28 Z" fill={dark} opacity="0.1" />
            <path d="M28 20 Q32 18 34 22 Q32 26 28 24 Q27 22 28 20 Z" fill={dark} opacity="0.2" />
            <path d="M14 24 Q13 22 15 21 Q16 23 15 25 Q14 25 14 24 Z" fill={dark} opacity="0.15" />
            <path d="M30 16 Q33 14 34 17 Q32 19 30 17 Q30 16.5 30 16 Z" fill={dark} opacity="0.15" />
            {/* highlight patches - upper left */}
            <path d="M16 14 Q19 11 23 13 Q21 16 17 17 Q15 16 16 14 Z" fill={light} opacity="0.25" />
            <path d="M20 17 Q22 15 24 17 Q22 19 20 17 Z" fill={light} opacity="0.15" />
            {/* interior leaf texture */}
            <path d="M20 24 Q18 22 20 21 Q21 23 20 24 Z" fill={color} opacity="0.15" />
            <path d="M28 12 Q27 10.5 29 11 Q28.5 12.5 28 12 Z" fill={light} opacity="0.12" />
            <path d="M12 18 Q11 17 13 17 Q12.5 18.5 12 18 Z" fill={light} opacity="0.1" />
            {/* trimmed texture lines - vein strokes */}
            <path d="M12 22 Q14 19.5 16 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M32 22 Q34 19.5 36 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M20 10 Q22 8.5 24 10" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <path d="M18 32 Q20 30 22 32" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
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
            {/* glossy citrus leaves — pointed almond shapes */}
            <path d="M24 36 Q18 30 16 33 Q19 28 24 34 Z" fill="#4a8c3a" opacity="0.8" />
            <path d="M24 36 Q30 30 32 33 Q29 28 24 34 Z" fill="#3a7a2a" opacity="0.7" />
            <path d="M24 35 L19 31" stroke="#2e6e22" strokeWidth="0.3" fill="none" opacity="0.35" />
            <path d="M24 35 L29 31" stroke="#2e6e22" strokeWidth="0.3" fill="none" opacity="0.35" />
            {/* tiny white blossom */}
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
            {/* organic canopy */}
            <path d="M15 24 C14 18 17 14 24 14 C31 14 34 18 33 24 C34 27 31 30 24 30 C17 30 14 27 15 24 Z" fill="#4a8c3a" />
            <path d="M14.5 22 Q13 20 14.5 18.5 Q15.5 20 14.5 22" fill="#4a8c3a" opacity="0.7" />
            <path d="M33.5 20 Q35 18 34 16.5 Q33 18 33.5 20" fill="#4a8c3a" opacity="0.6" />
            <path d="M19 18 Q17 16 18 14.5 Q20 16 19 18 Z" fill="#5a9c4a" opacity="0.3" />
            <path d="M28 20 Q30 18 29 16 Q27 18 28 20 Z" fill="#3a7a2a" opacity="0.2" />
            {/* single orange — pear-shaped with dimple */}
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
            {/* organic bumpy canopy */}
            <path d="M11 22 C10 14 15 9 24 9 C33 9 38 14 37 22 C38 27 34 32 24 33 C14 32 10 27 11 22 Z" fill="#4a8c3a" />
            <path d="M10 18 Q8 16 9.5 14 Q11 16 10 18" fill="#4a8c3a" opacity="0.7" />
            <path d="M37 16 Q39 14 38.5 12 Q37 14 37 16" fill="#4a8c3a" opacity="0.7" />
            <path d="M14 30 Q12 31 13 29 Q14.5 30 14 30" fill="#4a8c3a" opacity="0.6" />
            <path d="M34 30 Q36 31 35 29 Q33.5 30 34 30" fill="#4a8c3a" opacity="0.6" />
            {/* inner leaf clusters */}
            <path d="M18 15 Q16 12 17.5 11 Q19 13 18 15 Z" fill="#5a9c4a" opacity="0.3" />
            <path d="M30 18 Q32 15 31 14 Q29 16 30 18 Z" fill="#3a7a2a" opacity="0.25" />
            <path d="M22 22 Q20 20 21 18 Q23 20 22 22 Z" fill="#5a9c4a" opacity="0.15" />
            {/* left orange — organic shape */}
            <path d="M16 21 L15.5 19" stroke="#5a8c3a" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M15.5 19 Q14 18.5 14.5 20" fill="#4a8c3a" stroke="none" opacity="0.5" />
            <path d="M16 21 C13.5 21.5 13 23.5 13.5 25 C14 27 15.5 27.5 16 27.5 C16.5 27.5 18 27 18.5 25 C19 23.5 18.5 21.5 16 21 Z" fill={color} />
            <path d="M14.2 22.5 Q15.5 21 17.2 21.5" stroke={light} strokeWidth="0.5" fill="none" opacity="0.35" />
            <circle cx="14.5" cy="22.8" r="0.7" fill="white" opacity="0.22" />
            <path d="M15.8 26.5 Q16 27 16.3 26.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.2" />
            {/* right orange */}
            <path d="M31 14 L31.5 12" stroke="#5a8c3a" strokeWidth="0.5" strokeLinecap="round" />
            <path d="M31 14 C29 14.5 28.5 16 29 17.5 C29.5 19 30.5 19.2 31 19.2 C31.5 19.2 32.5 19 33 17.5 C33.5 16 33 14.5 31 14 Z" fill={color} />
            <path d="M29.5 15 Q30.5 14 32 14.5" stroke={light} strokeWidth="0.4" fill="none" opacity="0.3" />
            <circle cx="29.8" cy="15.2" r="0.5" fill="white" opacity="0.2" />
            <path d="M30.8 18.5 Q31 19 31.2 18.5" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* small half-hidden orange */}
            <path d="M24 11 C23 11.2 22.5 12 23 13 C23.3 13.5 24 13.8 24.5 13 C25 12 25 11.2 24 11 Z" fill={color} opacity="0.5" />
            {/* roots */}
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            {/* trunk */}
            <path d="M22 46 C21.5 42 22 38 23 34 C23.5 32 24 31 24 30" fill="none" stroke={trunk} strokeWidth="4" strokeLinecap="round" />
            {/* trunk shading — subtle dark side */}
            <path d="M22 46 C21.5 42 22 38 23 34 C23.5 32 24 31 24 30" fill="none" stroke={dark} strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
            {/* small branch */}
            <path d="M22.5 36 C20 34.5 18 35 17 36" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* critter hole */}
            <ellipse cx="22" cy="39" rx="2" ry="2.5" fill={trunk} />
            <ellipse cx="22" cy="39" rx="1.5" ry="2" fill="#1a1008" />
            <ellipse cx="22" cy="39" rx="0.9" ry="1.3" fill="#0a0604" />
            {/* branches */}
            <path d="M24 30 C20 28 16 28 12 30" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M24 30 C28 28 32 28 36 30" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M14 30 C12 28 10 24 8 22" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M34 30 C36 28 38 24 40 22" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 30 C24 26 24 22 24 18" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* canopy */}
            <path d="M7 22 C6 14 12 7 18 6 Q21 5 24 6 Q27 5 30 6 C36 7 42 14 41 22 C42 28 38 33 32 34 Q28 35 24 34 Q20 35 16 34 C10 33 6 28 7 22 Z" fill="#4a8c3a" />
            {/* canopy shading — darker bottom edge */}
            <path d="M10 28 C14 33 20 35 24 34 Q28 35 34 33 C38 30 40 26 41 22" fill="#3a7a2a" opacity="0.2" />
            {/* canopy highlight — lighter top */}
            <path d="M14 12 C18 8 22 7 24 6 Q27 5 30 6 C34 8 38 12 40 18" fill="#56a046" opacity="0.15" />
            {/* leaf bumps */}
            <path d="M9 14 Q7 12 9 10 Q10.5 12 9 14" fill="#4a8c3a" />
            <path d="M38 12 Q40 10 39.5 8.5 Q38 10 38 12" fill="#4a8c3a" />
            <path d="M6.5 25 Q5 23.5 6 22 Q7.5 23.5 6.5 25" fill="#4a8c3a" />
            <path d="M41.5 24 Q43 22 42 20 Q41 22 41.5 24" fill="#4a8c3a" />
            <path d="M15 34 Q13 34.5 14 33 Q15.5 33.5 15 34" fill="#4a8c3a" />
            <path d="M33 34 Q35 34.5 34 33 Q32.5 33.5 33 34" fill="#4a8c3a" />
            {/* tangerines with stems */}
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
            {/* roots */}
            <path d="M21 46 C19 45 17 45 15 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 C27 45 29 45 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      // ── Whisper Bamboo: segmented stalks ──
      case 'bamboo':
        if (s === 0) return (
          <g>
            {/* single bamboo shoot with visible nodes */}
            <path d="M24 46 L24 30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24 46 L24 30" stroke={dark} strokeWidth="0.6" opacity="0.1" />
            {/* node rings */}
            <path d="M23 40 L25 40" stroke={dark} strokeWidth="0.7" opacity="0.4" />
            <path d="M23 36 L25 36" stroke={dark} strokeWidth="0.6" opacity="0.35" />
            {/* single small leaf from node */}
            <path d="M24 36 C22 34 18 32 16 34 C18 31 22 33 24 35" fill={color} opacity="0.5" />
            <path d="M24 36 L20 33" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 16" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <path d="M24 46 L24 16" stroke={dark} strokeWidth="1" opacity="0.1" />
            {/* node rings */}
            <path d="M22.5 40 L25.5 40" stroke={dark} strokeWidth="0.8" opacity="0.4" />
            <path d="M22.5 34 L25.5 34" stroke={dark} strokeWidth="0.8" opacity="0.4" />
            <path d="M22.5 28 L25.5 28" stroke={dark} strokeWidth="0.7" opacity="0.35" />
            <path d="M23 22 L25 22" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            {/* alternating leaves from nodes */}
            <path d="M24 28 C20 26 14 24 12 22 C14 22 20 24 24 27" fill={color} opacity="0.5" />
            <path d="M24 22 C28 20 34 18 36 16 C34 18 28 20 24 21" fill={color} opacity="0.5" />
            <path d="M24 16 C22 14 18 12 16 12 C18 11 22 13 24 15" fill={color} opacity="0.4" />
            {/* leaf veins */}
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
            {/* back stalks */}
            <path d="M16 46 L16 12" stroke={dark} strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
            <path d="M14.5 38 L17.5 38" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M14.5 28 L17.5 28" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M15 18 L17 18" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <path d="M32 46 L32 16" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            <path d="M30.5 38 L33.5 38" stroke={dark} strokeWidth="0.5" opacity="0.18" />
            <path d="M31 30 L33 30" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            <path d="M31 22 L33 22" stroke={dark} strokeWidth="0.4" opacity="0.15" />
            {/* main stalk */}
            <path d="M24 46 L24 6" stroke={color} strokeWidth="4" strokeLinecap="round" />
            <path d="M24 46 L24 6" stroke={dark} strokeWidth="1.2" opacity="0.1" />
            {/* node rings */}
            <path d="M21.5 40 L26.5 40" stroke={dark} strokeWidth="1" opacity="0.4" />
            <path d="M21.5 32 L26.5 32" stroke={dark} strokeWidth="1" opacity="0.4" />
            <path d="M22 24 L26 24" stroke={dark} strokeWidth="0.8" opacity="0.35" />
            <path d="M22 16 L26 16" stroke={dark} strokeWidth="0.8" opacity="0.35" />
            <path d="M22.5 8 L25.5 8" stroke={dark} strokeWidth="0.6" opacity="0.3" />
            {/* leaf sprays — long pointed leaves from nodes */}
            <path d="M24 32 C18 30 10 28 6 24 C10 24 18 28 24 31" fill={color} opacity="0.6" />
            <path d="M24 32 C18 30 12 30 8 28 C12 28 18 29 24 31" fill={color} opacity="0.35" />
            <path d="M24 24 C30 22 38 18 44 16 C38 18 30 21 24 23" fill={color} opacity="0.55" />
            <path d="M24 24 C30 22 36 22 40 20 C36 21 30 22 24 23" fill={color} opacity="0.3" />
            <path d="M24 16 C18 14 10 10 4 8 C10 9 18 12 24 15" fill={color} opacity="0.5" />
            <path d="M24 16 C28 14 34 12 40 12 C34 13 28 14 24 15" fill={color} opacity="0.4" />
            <path d="M24 8 C20 6 14 4 10 4 C14 3 20 5 24 7" fill={color} opacity="0.4" />
            <path d="M24 8 C28 6 34 6 38 6 C34 7 28 7 24 7" fill={color} opacity="0.3" />
            {/* back stalk leaves */}
            <path d="M16 28 C12 26 8 24 6 22 C8 22 12 25 16 27" fill={color} opacity="0.3" />
            <path d="M16 18 C20 16 24 14 26 12 C24 14 20 16 16 17" fill={color} opacity="0.25" />
            <path d="M32 30 C36 28 40 26 42 24 C40 26 36 28 32 29" fill={color} opacity="0.25" />
            <path d="M32 22 C28 20 24 18 22 16 C24 17 28 19 32 21" fill={color} opacity="0.2" />
            {/* leaf vein details */}
            <path d="M24 32 C16 28 8 26 6 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 24 C32 20 40 18 44 16" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 16 C16 12 8 10 4 8" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
          </g>
        )

      // ── Cherry Blossom: sakura ──
      case 'sakura':
        if (s === 0) return (
          <g>
            {/* dark gnarled sakura branch */}
            <path d="M24 46 Q23 42 23 38" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23 38 Q20 34 17 32" stroke="#5c4a3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* small blossom at branch tip - connected */}
            <path d="M17 32 Q15 30 17 29 Q19 30 20 29 Q19 31 17 32 Z" fill={color} opacity="0.6" />
            <circle cx="17.5" cy="30.5" r="0.5" fill="#fbbf24" opacity="0.3" />
            {/* tiny bud on trunk */}
            <path d="M23 36 Q22 34.5 23.5 34 Q24 35 23 36 Z" fill={color} opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* sakura trunk with characteristic lean */}
            <path d="M24 46 Q23 40 23 32" stroke="#5c4a3a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M23 38 L24.5 37.8" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.3" />
            {/* two spreading branches */}
            <path d="M23 34 Q16 28 12 26" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23 32 Q28 28 32 26" stroke="#5c4a3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* blossom cluster - left branch */}
            <path d="M12 26 Q9.5 23.5 12 22 Q14.5 23.5 16 22 Q14.5 25 12 26 Z" fill={color} opacity="0.65" />
            <circle cx="12" cy="24" r="0.6" fill="#fbbf24" opacity="0.3" />
            {/* blossom cluster - center */}
            <path d="M23 28 Q20.5 25 23 23.5 Q25.5 25 27 23.5 Q25.5 26.5 23 28 Z" fill={color} opacity="0.7" />
            <path d="M22.5 26 Q23 25 23.8 26 Q23.2 26.8 22.5 26 Z" fill={light} opacity="0.35" />
            <circle cx="23" cy="26" r="0.5" fill="#fbbf24" opacity="0.25" />
            {/* blossom - right branch */}
            <path d="M32 26 Q30 24 32 23 Q34 24 35 23 Q34 25.5 32 26 Z" fill={color} opacity="0.55" />
            <circle cx="32.5" cy="24.5" r="0.4" fill="#fbbf24" opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* sakura trunk - connected from ground through branches */}
            <path d="M23 46 Q22 40 23 30" stroke="#5c4a3a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M22.2 38 L24.5 37.8" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.3" />
            <path d="M22.5 34 L24.5 33.8" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.25" />
            {/* main branches from trunk */}
            <path d="M23 32 Q14 26 8 24" stroke="#5c4a3a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M23 30 Q32 22 38 20" stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M23 28 Q18 22 14 18" stroke="#5c4a3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* blossom clusters at branch ends - connected */}
            <path d="M8 24 Q5 21 8 19.5 Q11 21 13 19.5 Q11 23 8 24 Z" fill={color} opacity="0.65" />
            <path d="M14 18 Q11 15 14 13 Q17 15 19 13 Q17 16.5 14 18 Z" fill={color} opacity="0.75" />
            <path d="M23 24 Q20 21 23 19 Q26 21 28 19 Q26 22.5 23 24 Z" fill={color} opacity="0.8" />
            <path d="M38 20 Q35 17.5 38 15.5 Q41 17.5 43 15.5 Q41 19 38 20 Z" fill={color} opacity="0.65" />
            {/* petal highlights */}
            <path d="M22 21 Q23 19.5 24.5 21 Q23.2 22 22 21 Z" fill={light} opacity="0.35" />
            <path d="M13 15 Q14 13.8 15 15 Q14 16 13 15 Z" fill={light} opacity="0.25" />
            <path d="M37 17 Q38 16 39 17 Q38 18 37 17 Z" fill={light} opacity="0.2" />
            {/* blossom centers */}
            <circle cx="23" cy="22" r="0.6" fill="#fbbf24" opacity="0.3" />
            <circle cx="14" cy="16" r="0.5" fill="#fbbf24" opacity="0.25" />
            <circle cx="8" cy="22" r="0.5" fill="#fbbf24" opacity="0.2" />
            <circle cx="38" cy="18" r="0.4" fill="#fbbf24" opacity="0.2" />
            {/* falling petal */}
            <ellipse cx="28" cy="38" rx="1" ry="0.6" fill={color} opacity="0.25" transform="rotate(-15 28 38)" />
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
            {/* 5-petal blossom clusters */}
            <path d="M6 18 Q3 15 6 13 Q9 15 12 13 Q9 16 12 19 Q9 17 6 20 Q3 17 6 18 Z" fill={color} opacity="0.7" />
            <path d="M14 12 Q10 8 14 5 Q18 8 22 5 Q18 9 22 13 Q18 11 14 15 Q10 11 14 12 Z" fill={color} opacity="0.8" />
            <path d="M24 10 Q20 6 24 3 Q28 6 32 3 Q28 7 32 11 Q28 9 24 13 Q20 9 24 10 Z" fill={color} />
            <path d="M34 14 Q30 10 34 7 Q38 10 42 7 Q38 11 42 15 Q38 13 34 17 Q30 13 34 14 Z" fill={color} opacity="0.8" />
            <path d="M42 16 Q39 13 42 11 Q45 13 47 11 Q45 14 47 17 Q44 15 42 18 Q39 15 42 16 Z" fill={color} opacity="0.7" />
            <path d="M32 10 Q29 8 32 6 Q34 8 36 6 Q34 9 36 11 Q34 10 32 12 Q29 10 32 10 Z" fill={color} opacity="0.5" />
            {/* petal highlight accents */}
            <path d="M12 9 Q13.5 7 15 8.5 Q13.5 10.5 12 9 Z" fill={light} opacity="0.4" />
            <path d="M23 7 Q24.5 5 26 7 Q24.5 8.5 23 7 Z" fill={light} opacity="0.5" />
            <path d="M35 11 Q36.5 9.5 38 11 Q36.5 12.5 35 11 Z" fill={light} opacity="0.3" />
            <path d="M5 15 Q6.5 13 8 14.5 Q6.5 16 5 15 Z" fill={light} opacity="0.25" />
            <path d="M40 13 Q41.5 11.5 43 13 Q41.5 14.5 40 13 Z" fill={light} opacity="0.2" />
            {/* blossom centers */}
            <path d="M6 17.5 L6.6 16.8 L7.2 17.5 L6.6 18.2 Z" fill="#fbbf24" opacity="0.3" />
            <path d="M14 11.5 L14.6 10.8 L15.2 11.5 L14.6 12.2 Z" fill="#fbbf24" opacity="0.3" />
            <path d="M24 9.5 L24.6 8.8 L25.2 9.5 L24.6 10.2 Z" fill="#fbbf24" opacity="0.25" />
            <path d="M34 13.5 L34.6 12.8 L35.2 13.5 L34.6 14.2 Z" fill="#fbbf24" opacity="0.25" />
            {/* organic shadow patches */}
            <path d="M3 21 Q6 19.5 9 22 Q6 23.5 3 22 Z" fill={dark} opacity="0.08" />
            <path d="M39 19 Q42 17.5 45 20 Q42 21 39 20 Z" fill={dark} opacity="0.08" />
            {/* falling petal shapes */}
            <path d="M18 34 Q19.5 32.5 20.5 34 Q19 35.5 18 34 Z" fill={color} opacity="0.4" transform="rotate(30 18 34)" />
            <path d="M32 38 Q33.2 36.5 34 38 Q33 39.5 32 38 Z" fill={color} opacity="0.3" transform="rotate(-20 32 38)" />
            <path d="M12 40 Q13 38.8 13.8 40 Q12.8 41 12 40 Z" fill={color} opacity="0.25" transform="rotate(10 12 40)" />
            {/* roots */}
            <path d="M22 46 Q19 44.5 16 46" stroke="#5c4a3a" strokeWidth="0.9" fill="none" opacity="0.25" />
            <path d="M24 46 Q27 44.5 30 46" stroke="#5c4a3a" strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      // ── Finger Lime: tall cypress column ──
      case 'cypress':
        if (s === 0) return (
          <g>
            {/* short trunk with narrow flame-shaped canopy */}
            <rect x="23" y="40" width="2" height="6" fill={trunk} />
            <path d="M24 28 Q27 32 26.5 38 Q26 40 24 40 Q22 40 21.5 38 Q21 32 24 28 Z" fill={color} opacity="0.7" />
            {/* inner highlight */}
            <path d="M24 30 Q25.5 34 25 38 L24 39 L24 30 Z" fill={light} opacity="0.15" />
            {/* texture bands */}
            <path d="M23 36 Q24 35 25 36" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M23.5 32 Q24 31.5 24.5 32" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
          </g>
        )
        if (s === 1) return (
          <g>
            <rect x="22.5" y="38" width="3" height="8" fill={trunk} />
            <path d="M23 42 L25 41.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* taller narrow column - connected to trunk */}
            <path d="M24 16 Q28 22 27.5 30 Q27 36 26.5 38 L21.5 38 Q21 36 20.5 30 Q20 22 24 16 Z" fill={color} />
            <path d="M24 18 Q26 24 25.5 32 L24 36 L24 18 Z" fill={light} opacity="0.15" />
            {/* texture bands */}
            <path d="M22 34 Q24 33 26 34" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M22.5 28 Q24 27 25.5 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.1" />
            <path d="M23 22 Q24 21.5 25 22" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.1" />
            <circle cx="23" cy="24" r="0.5" fill={light} opacity="0.15" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* trunk connects into column base */}
            <rect x="22" y="36" width="4" height="10" fill={trunk} />
            <path d="M22.5 40 L25.5 39.8" stroke={dark} strokeWidth="0.5" opacity="0.2" />
            <path d="M23 43 L25 42.8" stroke={dark} strokeWidth="0.4" opacity="0.18" />
            {/* tall narrow cypress column - seamless from trunk */}
            <path d="M24 6 Q30 14 29 24 Q28 32 28 36 L20 36 Q20 32 19 24 Q18 14 24 6 Z" fill={color} />
            <path d="M24 8 Q27 14 26.5 22 Q26 30 26 34 L24 36 L24 8 Z" fill={light} opacity="0.18" />
            {/* texture bands */}
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
            {/* needle cluster patches */}
            <path d="M21.5 15 Q22 13.5 22.8 15 Q22.5 17 21.5 16 Z" fill={light} opacity="0.15" />
            <path d="M22.2 23 Q23 21.5 23.5 23 Q23.2 25 22.2 24 Z" fill={light} opacity="0.12" />
            <path d="M21.8 31 Q22.5 29.5 23.2 31 Q22.8 33 21.8 32 Z" fill={light} opacity="0.1" />
            <path d="M22.5 9 Q23 7.8 23.5 9 Q23.2 10.5 22.5 10 Z" fill={light} opacity="0.12" />
            {/* irregular needle edge accents */}
            <path d="M20 28 Q19.5 26 20.2 24 Q20.5 26 20 28 Z" fill={dark} opacity="0.08" />
            <path d="M27.5 20 Q28 18 27.8 16 Q27.2 18 27.5 20 Z" fill={dark} opacity="0.07" />
            {/* roots */}
            <path d="M22 46 Q20 45 18 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
            <path d="M26 46 Q28 45 30 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.2" />
          </g>
        )

      // ── Buddha's Hand: exotic twin trunks ──
      case 'exotic':
        if (s === 0) return (
          <g>
            {/* single thick stem with exotic unfurling leaf */}
            <path d="M24 46 L24 36" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M23.5 42 L24.5 42" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* two exotic leaves curving outward from stem top */}
            <path d="M24 36 Q28 30 30 26 Q28 32 24 35" fill={color} opacity="0.6" />
            <path d="M24 36 Q20 30 18 26 Q20 32 24 35" fill={color} opacity="0.55" />
            {/* leaf veins */}
            <path d="M24 35 L28 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24 35 L20 28" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* tiny orchid bud at center */}
            <path d="M24 32 Q23 30.5 24 30 Q25 30.5 24 32 Z" fill={light} opacity="0.45" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* twin stems curving from shared base */}
            <path d="M24 46 C24 40 28 38 28 30" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 46 C24 40 20 38 20 30" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M27 36 L28.5 35.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M20.5 36 L22 35.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* exotic leaves from each stem end */}
            <path d="M28 30 Q33 24 30 20 Q27 24 28 30" fill={color} opacity="0.7" />
            <path d="M20 30 Q15 24 18 20 Q21 24 20 30" fill={color} opacity="0.7" />
            {/* leaf veins */}
            <path d="M28 28 L31 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M20 28 L17 22" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* orchid bloom center */}
            <path d="M24 24 Q21.5 22 24 20 Q26.5 22 24 24 Z" fill={light} opacity="0.5" />
            <path d="M24 24 Q22 25 21 23.5 Q22.5 22 24 24 Z" fill={light} opacity="0.35" />
            <path d="M24 24 Q26 25 27 23.5 Q25.5 22 24 24 Z" fill={light} opacity="0.35" />
            <circle cx="24" cy="22.5" r="0.5" fill="#fff" opacity="0.2" />
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
            {/* organic orchid bloom center - irregular petal ring */}
            <path d="M24 18 Q21 16 24 14 Q27 16 24 18 Z" fill={light} opacity="0.5" />
            <path d="M24 18 Q21.5 19.5 20.5 17.5 Q22 15.5 24 18 Z" fill={light} opacity="0.4" />
            <path d="M24 18 Q26.5 19.5 27.5 17.5 Q26 15.5 24 18 Z" fill={light} opacity="0.4" />
            <path d="M24 17.5 Q23 16.5 24 16 Q25 16.5 24 17.5 Z" fill="#fff" opacity="0.25" />
            {/* leaf veins */}
            <path d="M30 24 L32 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M18 24 L16 18" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* organic petal-tip highlights */}
            <path d="M32 16 Q32.5 15.2 33 16 Q32.5 16.6 32 16 Z" fill={light} opacity="0.18" />
            <path d="M16 16 Q16.5 15.2 17 16 Q16.5 16.6 16 16 Z" fill={light} opacity="0.15" />
            {/* roots */}
            <path d="M23 46 Q21 45 19 46" stroke={trunk} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M25 46 Q27 45 29 46" stroke={trunk} strokeWidth="0.6" fill="none" opacity="0.2" />
          </g>
        )
        return (
          <g>
            {/* three stems — left, center, right */}
            <path d="M24 46 C24 38 32 34 32 24" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M24 46 C24 38 16 34 16 24" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M24 46 C24 40 24 34 24 22" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* bark texture */}
            <path d="M30 34 L32.5 33.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M16.5 34 L19 33.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M31 28 L33 27.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M15.5 28 L18 27.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M23.5 32 L24.8 31.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            <path d="M23.5 28 L25 27.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* large ornate petals - right */}
            <path d="M32 24 Q42 18 36 8 Q28 14 32 24" fill={color} />
            <path d="M32 24 Q38 22 40 16" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M32 20 Q38 14 34 8 Q30 14 32 20" fill={light} opacity="0.45" />
            <path d="M34 12 Q36 10 34 8" stroke={light} strokeWidth="0.3" fill="none" opacity="0.2" />
            {/* large ornate petals - left */}
            <path d="M16 24 Q6 18 12 8 Q20 14 16 24" fill={color} />
            <path d="M16 24 Q10 22 8 16" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M16 20 Q10 14 14 8 Q18 14 16 20" fill={light} opacity="0.45" />
            <path d="M14 12 Q12 10 14 8" stroke={light} strokeWidth="0.3" fill="none" opacity="0.2" />
            {/* center branch leaves */}
            <path d="M24 22 Q30 16 26 10 Q22 16 24 22" fill={color} opacity="0.75" />
            <path d="M24 22 Q18 16 22 10 Q26 16 24 22" fill={color} opacity="0.7" />
            <path d="M24 18 Q28 12 26 8 Q23 13 24 18" fill={light} opacity="0.4" />
            <path d="M24 18 Q20 12 22 8 Q25 13 24 18" fill={light} opacity="0.35" />
            <path d="M24 20 L27 14" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M24 20 L21 14" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            {/* top petal */}
            <path d="M24 16 Q20 8 24 2 Q28 8 24 16" fill={color} opacity="0.9" />
            <path d="M24 10 Q22 6 24 4 Q26 6 24 10" fill={light} opacity="0.5" />
            {/* central flower - organic petal ring */}
            <path d="M24 17 Q20 14 24 11 Q28 14 24 17 Z" fill={color} opacity="0.35" />
            <path d="M24 17 Q19 16 18.5 13 Q21 14.5 24 17 Z" fill={color} opacity="0.3" />
            <path d="M24 17 Q29 16 29.5 13 Q27 14.5 24 17 Z" fill={color} opacity="0.3" />
            <path d="M24 17 Q20.5 19 19 17 Q21 15.5 24 17 Z" fill={color} opacity="0.25" />
            <path d="M24 17 Q27.5 19 29 17 Q27 15.5 24 17 Z" fill={color} opacity="0.25" />
            {/* inner bloom */}
            <path d="M24 17 Q22 15.5 24 14 Q26 15.5 24 17 Z" fill={light} opacity="0.55" />
            <path d="M24 17 Q22 17.5 21.5 16 Q23 15 24 17 Z" fill={light} opacity="0.45" />
            <path d="M24 17 Q26 17.5 26.5 16 Q25 15 24 17 Z" fill={light} opacity="0.45" />
            {/* stigma center */}
            <path d="M24 16.8 Q23.2 16 24 15.5 Q24.8 16 24 16.8 Z" fill="#fff" opacity="0.35" />
            {/* stamen details - teardrop filaments */}
            <path d="M22 16 Q21.5 15.2 22 15 Q22.5 15.2 22 16 Z" fill={color} opacity="0.6" />
            <path d="M26 16 Q25.5 15.2 26 15 Q26.5 15.2 26 16 Z" fill={color} opacity="0.6" />
            <path d="M24 14.5 Q23.5 13.8 24 13.5 Q24.5 13.8 24 14.5 Z" fill={color} opacity="0.5" />
            <path d="M24 18.5 Q23.5 17.8 24 17.5 Q24.5 17.8 24 18.5 Z" fill={color} opacity="0.4" />
            {/* hanging aerial roots */}
            <path d="M20 36 Q19 40 18 44" stroke={trunk} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M28 36 Q29 40 30 44" stroke={trunk} strokeWidth="0.5" fill="none" opacity="0.18" />
            <path d="M22 38 Q21 42 20 46" stroke={trunk} strokeWidth="0.4" fill="none" opacity="0.15" />
            {/* petal edge highlights */}
            <path d="M38 12 Q38.5 11 39 12 Q38.5 12.8 38 12 Z" fill={light} opacity="0.2" />
            <path d="M10 12 Q10.5 11 11 12 Q10.5 12.8 10 12 Z" fill={light} opacity="0.18" />
            <path d="M24 4 Q24.3 3.3 24.7 4 Q24.3 4.5 24 4 Z" fill={light} opacity="0.2" />
            {/* roots */}
            <path d="M23 46 Q20 44.5 17 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 Q28 44.5 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      // ── Wisteria: cascading flowers ──
      case 'cascade':
        if (s === 0) return (
          <g>
            {/* wisteria trunk with one branch */}
            <path d="M24 46 L24 34" stroke={trunk} strokeWidth="2" strokeLinecap="round" />
            <path d="M24 36 Q20 32 18 34" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* hanging teardrop clusters from branch + trunk top */}
            <path d="M18 32 Q16.5 34 17 37 Q17.5 38.5 18 38.5 Q18.5 38.5 19 37 Q19.5 34 18 32 Z" fill={color} opacity="0.6" />
            <path d="M24 30 Q22.5 32 23 34.5 Q23.5 35.5 24 35.5 Q24.5 35.5 25 34.5 Q25.5 32 24 30 Z" fill={color} opacity="0.7" />
            {/* floret highlights */}
            <path d="M17.5 34 Q18 33.2 18.5 34 Q18 34.6 17.5 34 Z" fill={light} opacity="0.25" />
            <path d="M23.5 32 Q24 31.2 24.5 32 Q24 32.6 23.5 32 Z" fill={light} opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 28" stroke={trunk} strokeWidth="3" strokeLinecap="round" />
            <path d="M23.2 38 L25 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.5 34 L25 33.8" stroke={dark} strokeWidth="0.4" opacity="0.25" />
            {/* branches from trunk */}
            <path d="M24 30 Q18 26 14 28" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 28 Q30 24 34 26" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* hanging teardrop clusters from branch ends */}
            <path d="M14 26 Q11.5 30 12.5 34 Q13 35.5 14 35.5 Q15 35.5 15.5 34 Q16.5 30 14 26 Z" fill={color} opacity="0.6" />
            <path d="M24 22 Q21.5 26 22.5 30 Q23 31.5 24 31.5 Q25 31.5 25.5 30 Q26.5 26 24 22 Z" fill={color} opacity="0.7" />
            <path d="M34 24 Q31.5 28 32.5 32 Q33 33.5 34 33.5 Q35 33.5 35.5 32 Q36.5 28 34 24 Z" fill={color} opacity="0.6" />
            {/* floret highlights */}
            <path d="M23.5 25 Q24 24.2 24.5 25 Q24 25.6 23.5 25 Z" fill={light} opacity="0.3" />
            <path d="M13.5 29 Q14 28.2 14.5 29 Q14 29.6 13.5 29 Z" fill={light} opacity="0.22" />
            <path d="M33.5 27 Q34 26.2 34.5 27 Q34 27.6 33.5 27 Z" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* thick wisteria trunk */}
            <path d="M24 46 L24 24" stroke={trunk} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M23 38 L25.5 37.8" stroke={dark} strokeWidth="0.5" opacity="0.3" />
            <path d="M23.2 34 L25.5 33.8" stroke={dark} strokeWidth="0.5" opacity="0.25" />
            <path d="M23.5 28 L25 27.8" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* spreading branches from trunk */}
            <path d="M24 26 Q16 20 10 22" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 24 Q32 18 38 20" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* cascading teardrop clusters hanging from branches */}
            <path d="M10 20 Q7.5 24 8.5 30 Q9 32.5 10 32.5 Q11 32.5 11.5 30 Q12.5 24 10 20 Z" fill={color} opacity="0.6" />
            <path d="M18 18 Q14.5 24 16 30 Q17 33 18 33 Q19 33 20 30 Q21.5 24 18 18 Z" fill={color} opacity="0.7" />
            <path d="M26 16 Q22.5 22 24 28 Q25 31 26 31 Q27 31 28 28 Q29.5 22 26 16 Z" fill={color} opacity="0.8" />
            <path d="M34 18 Q30.5 24 32 30 Q33 33 34 33 Q35 33 36 30 Q37.5 24 34 18 Z" fill={color} opacity="0.7" />
            <path d="M38 18 Q36 22 37 27 Q37.5 29 38 29 Q38.5 29 39 27 Q40 22 38 18 Z" fill={color} opacity="0.5" />
            {/* floret highlights */}
            <path d="M25.5 20 Q26 19.2 26.5 20 Q26 20.6 25.5 20 Z" fill={light} opacity="0.35" />
            <path d="M17.5 22 Q18 21.2 18.5 22 Q18 22.6 17.5 22 Z" fill={light} opacity="0.25" />
            <path d="M33.5 22 Q34 21.2 34.5 22 Q34 22.6 33.5 22 Z" fill={light} opacity="0.22" />
            <path d="M9.5 24 Q10 23.3 10.5 24 Q10 24.6 9.5 24 Z" fill={light} opacity="0.2" />
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
            {/* teardrop wisteria clusters */}
            <path d="M8 14 Q5 18 6 24 Q7 30 8 30 Q9 30 10 24 Q11 18 8 14 Z" fill={color} opacity="0.7" />
            <path d="M14 14 Q10 20 12 28 Q13 34 14 34 Q15 34 16 28 Q18 20 14 14 Z" fill={color} opacity="0.8" />
            <path d="M20 11 Q16 17 18 24 Q19 29 20 29 Q21 29 22 24 Q24 17 20 11 Z" fill={color} />
            <path d="M28 9 Q24 15 26 22 Q27 27 28 27 Q29 27 30 22 Q32 15 28 9 Z" fill={color} />
            <path d="M34 12 Q30 18 32 26 Q33 32 34 32 Q35 32 36 26 Q38 18 34 12 Z" fill={color} opacity="0.8" />
            <path d="M40 12 Q37 16 38 22 Q39 28 40 28 Q41 28 42 22 Q43 16 40 12 Z" fill={color} opacity="0.7" />
            {/* grape-cluster bumps on teardrops */}
            <path d="M19.5 14 Q20.5 12 21 14 Q20 16 19.5 14 Z" fill={light} opacity="0.4" />
            <path d="M27.5 12 Q28.5 10 29 12 Q28 14 27.5 12 Z" fill={light} opacity="0.4" />
            {/* small floret accents */}
            <path d="M7 17 Q8 15.5 9.5 17 Q8.5 18.5 7 17 Z" fill={light} opacity="0.25" />
            <path d="M13 19 Q14 17.5 15.5 19 Q14.5 20.5 13 19 Z" fill={light} opacity="0.22" />
            <path d="M19 15 Q20 13.5 21 15 Q20 16.5 19 15 Z" fill={light} opacity="0.2" />
            <path d="M27 13 Q28 11.5 29 13 Q28 14.5 27 13 Z" fill={light} opacity="0.2" />
            <path d="M33 17 Q34 15.5 35 17 Q34 18.5 33 17 Z" fill={light} opacity="0.18" />
            <path d="M39 15 Q40 13.5 41 15 Q40 16.5 39 15 Z" fill={light} opacity="0.15" />
            {/* organic shadow patches at cluster bases */}
            <path d="M12 30 Q14 29 16 30 Q14 31.5 12 30 Z" fill={dark} opacity="0.08" />
            <path d="M32 28 Q34 27 36 28 Q34 29.5 32 28 Z" fill={dark} opacity="0.08" />
            <path d="M18 26 Q20 25 22 26 Q20 27 18 26 Z" fill={dark} opacity="0.06" />
            <path d="M26 24 Q28 23 30 24 Q28 25 26 24 Z" fill={dark} opacity="0.06" />
            {/* roots */}
            <path d="M23 46 Q20 44.5 17 46" stroke={trunk} strokeWidth="0.9" fill="none" opacity="0.3" />
            <path d="M25 46 Q28 44.5 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      // ── Starfruit: curved palm ──
      case 'palm':
        if (s === 0) return (
          <g>
            {/* slightly curved trunk */}
            <path d="M24 46 Q25 42 24.5 36" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* bark ring */}
            <path d="M23.5 42 Q24.5 41.5 25 42" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.25" />
            {/* three small fronds from crown */}
            <path d="M24.5 36 L18 30 Q22 34 24.5 36" fill={color} />
            <path d="M24.5 36 L30 30 Q26 34 24.5 36" fill={color} />
            <path d="M24.5 36 L24 27 Q26 32 24.5 36" fill={color} opacity="0.8" />
            {/* frond midribs */}
            <path d="M24.5 36 L20 32" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M24.5 36 L28 32" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* taller curved trunk with bark rings */}
            <path d="M24 46 Q26 40 25 30" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M23.5 40 Q25.5 39.5 26 40" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M24 36 Q25.5 35.5 26 36" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.25" />
            {/* five fronds radiating from crown */}
            <path d="M25 30 L12 24 Q18 30 25 30" fill={color} />
            <path d="M25 30 L36 24 Q30 30 25 30" fill={color} />
            <path d="M25 30 L24 16 Q28 22 25 30" fill={color} opacity="0.8" />
            <path d="M25 30 L16 18 Q20 24 25 30" fill={color} opacity="0.7" />
            <path d="M25 30 L34 18 Q30 24 25 30" fill={light} opacity="0.35" />
            {/* frond midribs */}
            <path d="M25 30 L18 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M25 30 L30 24" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M25 30 L25 18" stroke={dark} strokeWidth="0.25" fill="none" opacity="0.12" />
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
            {/* trunk with slight lean and bark rings */}
            <path d="M23 46 Q28 38 26 20" stroke={trunk} strokeWidth="5.5" fill="none" strokeLinecap="round" />
            <path d="M24.5 22 Q26 30 23 46" stroke={dark} strokeWidth="1.5" fill="none" opacity="0.2" />
            <path d="M22 42 Q26 41 28.5 42" stroke={dark} strokeWidth="0.7" fill="none" opacity="0.3" />
            <path d="M22 38 Q26 37 28.5 38" stroke={dark} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M22.5 34 Q26 33 28 34" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.25" />
            <path d="M23 30 Q26 29 27.5 30" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.2" />
            <path d="M24 26 Q26 25.5 27 26" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            {/* 7 fronds radiating out */}
            <path d="M26 20 L2 16 Q12 24 26 20" fill={color} />
            <path d="M26 20 L46 16 Q36 24 26 20" fill={color} />
            <path d="M26 20 L26 1 Q34 10 26 20" fill={color} />
            <path d="M26 20 L8 4 Q16 14 26 20" fill={color} opacity="0.85" />
            <path d="M26 20 L42 4 Q34 14 26 20" fill={color} opacity="0.85" />
            <path d="M26 20 L2 8 Q12 16 26 20" fill={light} opacity="0.3" />
            <path d="M26 20 L46 8 Q36 16 26 20" fill={light} opacity="0.25" />
            {/* frond midribs */}
            <path d="M26 20 L6 16" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M26 20 L44 16" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M26 20 L28 4" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M26 20 L12 6" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.15" />
            <path d="M26 20 L40 6" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.12" />
            {/* leaflet serrations on each frond */}
            <path d="M16 18 L14 16 M12 18 L10 16 M8 17 L6 15" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M34 18 L36 16 M38 17 L40 15 M42 17 L44 15" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            {/* frond tip highlights */}
            <circle cx="4" cy="16" r="0.8" fill={light} opacity="0.2" />
            <circle cx="44" cy="16" r="0.8" fill={light} opacity="0.18" />
            <circle cx="28" cy="3" r="0.6" fill={light} opacity="0.15" />
            <circle cx="10" cy="5" r="0.6" fill={light} opacity="0.15" />
            <circle cx="40" cy="5" r="0.6" fill={light} opacity="0.12" />
            {/* coconuts cluster */}
            <circle cx="25" cy="20" r="1.8" fill="#8B6543" opacity="0.5" />
            <circle cx="27.5" cy="21" r="1.5" fill="#8B6543" opacity="0.4" />
            <circle cx="24" cy="21.5" r="1.3" fill="#8B6543" opacity="0.35" />
            <circle cx="25.5" cy="19.5" r="0.5" fill={light} opacity="0.15" />
            {/* root flare */}
            <path d="M22 46 Q19 44 16 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M25 46 Q28 44 31 46" stroke={trunk} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        )

      // ── Dragonfruit: cactus ──
      case 'cactus':
        if (s === 0) return (
          <g>
            {/* small round cactus column */}
            <path d="M22 46 Q21 40 21 36 Q21 30 24 28 Q27 30 27 36 Q27 40 26 46 Z" fill={color} />
            {/* rib lines */}
            <path d="M24 28 L24 46" stroke={dark} strokeWidth="0.6" opacity="0.2" />
            <path d="M22.5 30 Q22.5 36 22 42" stroke={light} strokeWidth="0.8" fill="none" opacity="0.1" />
            <path d="M25.5 30 Q25.5 36 26 42" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.08" />
            {/* spine clusters */}
            <path d="M21.5 34 L20 33.5" stroke={light} strokeWidth="0.4" opacity="0.3" />
            <path d="M26.5 36 L28 35.5" stroke={light} strokeWidth="0.4" opacity="0.25" />
            <path d="M21.5 38 L20 38.5" stroke={light} strokeWidth="0.3" opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* taller cactus with one arm bud */}
            <path d="M21 46 Q20 40 20 32 Q20 22 24 18 Q28 22 28 32 Q28 40 27 46 Z" fill={color} />
            {/* rib lines */}
            <path d="M24 18 L24 46" stroke={dark} strokeWidth="0.7" opacity="0.2" />
            <path d="M22 20 Q22 30 21.5 40" stroke={light} strokeWidth="1" fill="none" opacity="0.1" />
            <path d="M26 20 Q26 30 26.5 40" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.08" />
            {/* one arm bud - connected to body */}
            <path d="M20 30 Q16 28 15 25" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M15 25 L15.5 24.5" stroke={dark} strokeWidth="0.3" opacity="0.2" />
            {/* spine clusters */}
            <path d="M20.5 26 L19 25.5" stroke={light} strokeWidth="0.4" opacity="0.3" />
            <path d="M27.5 28 L29 27.5" stroke={light} strokeWidth="0.4" opacity="0.25" />
            <path d="M20.5 36 L19 36.5" stroke={light} strokeWidth="0.3" opacity="0.2" />
            <path d="M27.5 38 L29 38.5" stroke={light} strokeWidth="0.3" opacity="0.18" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* tall cactus with two arms */}
            <path d="M20 46 Q19 38 19 28 Q19 16 24 12 Q29 16 29 28 Q29 38 28 46 Z" fill={color} />
            {/* left arm - connected to body at y=30 */}
            <path d="M19 30 Q14 28 12 24 Q12 20 14 18" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* right arm - connected to body at y=28 */}
            <path d="M29 28 Q34 26 36 22 Q36 18 34 16" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* rib lines */}
            <path d="M24 12 L24 46" stroke={dark} strokeWidth="0.7" opacity="0.2" />
            <path d="M22 14 Q22 24 21.5 36" stroke={light} strokeWidth="1.2" fill="none" opacity="0.1" />
            <path d="M26 14 Q26 24 26.5 36" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.08" />
            {/* arm ribs */}
            <path d="M14 22 L14 18" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            <path d="M34 20 L34 16" stroke={dark} strokeWidth="0.4" opacity="0.2" />
            {/* spine clusters */}
            <path d="M19.5 22 L18 21.5" stroke={light} strokeWidth="0.4" opacity="0.3" />
            <path d="M28.5 24 L30 23.5" stroke={light} strokeWidth="0.4" opacity="0.25" />
            <path d="M19.5 34 L18 34.5" stroke={light} strokeWidth="0.3" opacity="0.2" />
            <path d="M28.5 36 L30 36.5" stroke={light} strokeWidth="0.3" opacity="0.18" />
            {/* small flower bud at top */}
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
            {/* fading ghostly trunk */}
            <path d="M24 46 L24 36" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4" />
            {/* wispy branch hint */}
            <path d="M24 38 Q22 36 20 36" stroke={color} strokeWidth="0.5" strokeDasharray="1 2" fill="none" opacity="0.2" />
            <g filter={`url(#glow-${uid})`}>
              <ellipse cx="24" cy="32" rx="5" ry="4.5" fill={color} opacity="0.25" />
              <ellipse cx="24" cy="32" rx="3" ry="2.5" fill={light} opacity="0.5" />
            </g>
            {/* floating motes */}
            <circle cx="22" cy="30" r="0.5" fill={light} opacity="0.3" />
            <circle cx="26" cy="34" r="0.4" fill={light} opacity="0.2" />
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
            {/* ghostly trunk */}
            <path d="M24 46 L24 32" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.4" />
            {/* wispy branch tendrils */}
            <path d="M24 34 Q20 30 18 28" stroke={color} strokeWidth="0.5" strokeDasharray="1.5 2" fill="none" opacity="0.2" />
            <path d="M24 32 Q28 28 30 26" stroke={color} strokeWidth="0.5" strokeDasharray="1.5 2" fill="none" opacity="0.2" />
            <g filter={`url(#glow-${uid})`}>
              <ellipse cx="24" cy="24" rx="9" ry="8" fill={color} opacity="0.2" />
              <ellipse cx="24" cy="24" rx="5.5" ry="4.5" fill={color} opacity="0.35" />
              <ellipse cx="24" cy="24" rx="3" ry="2.5" fill={light} opacity="0.6" />
            </g>
            {/* floating motes */}
            <circle cx="20" cy="22" r="0.6" fill={light} opacity="0.25">
              <animate attributeName="cy" values="22;20;22" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="28" cy="26" r="0.5" fill={light} opacity="0.2" />
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
            {/* ghostly trunk */}
            <path d="M24 46 L24 28" stroke={color} strokeWidth="2" strokeDasharray="3 2" opacity="0.45" />
            {/* wispy branch tendrils */}
            <path d="M24 32 Q18 28 14 26" stroke={color} strokeWidth="0.6" strokeDasharray="2 2" fill="none" opacity="0.2" />
            <path d="M24 30 Q30 26 34 24" stroke={color} strokeWidth="0.6" strokeDasharray="2 2" fill="none" opacity="0.2" />
            <path d="M24 28 Q20 24 18 20" stroke={color} strokeWidth="0.4" strokeDasharray="1.5 2" fill="none" opacity="0.15" />
            <g filter={`url(#glow-${uid})`}>
              <ellipse cx="24" cy="20" rx="12" ry="10" fill={color} opacity="0.2" />
              <ellipse cx="24" cy="20" rx="7" ry="6" fill={color} opacity="0.35" />
              <ellipse cx="24" cy="20" rx="4" ry="3" fill={light} opacity="0.6" />
            </g>
            {/* floating motes */}
            <circle cx="18" cy="18" r="0.7" fill={light} opacity="0.25">
              <animate attributeName="cy" values="18;15;18" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="30" cy="22" r="0.6" fill={light} opacity="0.2">
              <animate attributeName="cy" values="22;19;22" dur="3.5s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <circle cx="24" cy="14" r="0.5" fill={light} opacity="0.2" />
            <path d="M18 26 Q24 22 30 26" stroke={light} fill="none" strokeWidth="0.4" opacity="0.12" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-eglow`} cx="50%" cy="40%">
                <stop offset="0%" stopColor={light} stopOpacity="0.9" />
                <stop offset="40%" stopColor={color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* soft radial glow — no filter, no square artifact */}
            <ellipse cx="24" cy="18" rx="18" ry="16" fill={`url(#${uid}-eglow)`} opacity="0.3" />
            {/* fading trunk made of light */}
            <path d="M24 46 C24 40 23 34 24 28" stroke={color} strokeWidth="2" strokeDasharray="3 2" opacity="0.5" />
            <path d="M24 46 C24 42 25 36 24 28" stroke={light} strokeWidth="0.8" strokeDasharray="1 3" opacity="0.3" />
            {/* wispy branch tendrils — curved, organic */}
            <path d="M24 30 C20 28 16 26 12 24" stroke={color} strokeWidth="0.6" strokeDasharray="2 2" fill="none" opacity="0.25" />
            <path d="M24 28 C28 26 32 24 36 22" stroke={color} strokeWidth="0.6" strokeDasharray="2 2" fill="none" opacity="0.25" />
            <path d="M24 26 C22 22 18 18 14 16" stroke={color} strokeWidth="0.5" strokeDasharray="1.5 2.5" fill="none" opacity="0.18" />
            <path d="M24 26 C26 22 30 18 34 16" stroke={color} strokeWidth="0.5" strokeDasharray="1.5 2.5" fill="none" opacity="0.18" />
            <path d="M24 24 C22 20 20 16 18 12" stroke={light} strokeWidth="0.3" strokeDasharray="1 3" fill="none" opacity="0.12" />
            <path d="M24 24 C26 20 28 16 30 12" stroke={light} strokeWidth="0.3" strokeDasharray="1 3" fill="none" opacity="0.12" />
            {/* layered translucent canopy — radial gradient fills, no blur filter */}
            <ellipse cx="24" cy="18" rx="16" ry="14" fill={color} opacity="0.15" />
            <ellipse cx="24" cy="18" rx="12" ry="10" fill={color} opacity="0.25" />
            <ellipse cx="24" cy="18" rx="8" ry="6" fill={color} opacity="0.4" />
            <ellipse cx="24" cy="18" rx="4" ry="3" fill={light} opacity="0.8" />
            {/* canopy ring outlines — wispy edges */}
            <path d="M8 18 C8 10 15 4 24 4 C33 4 40 10 40 18 C40 26 33 32 24 32 C15 32 8 26 8 18" fill="none" stroke={light} strokeWidth="0.3" opacity="0.1" strokeDasharray="3 4" />
            <path d="M12 18 C12 12 17 8 24 8 C31 8 36 12 36 18 C36 24 31 28 24 28 C17 28 12 24 12 18" fill="none" stroke={light} strokeWidth="0.3" opacity="0.15" strokeDasharray="2 3" />
            {/* arc wisps across canopy */}
            <path d="M10 24 C16 20 24 18 38 24" stroke={light} fill="none" strokeWidth="0.7" opacity="0.2" />
            <path d="M14 28 C20 24 28 24 34 28" stroke={light} fill="none" strokeWidth="0.5" opacity="0.15" />
            <path d="M16 10 C20 7 28 7 32 10" stroke={light} fill="none" strokeWidth="0.4" opacity="0.12" />
            {/* inner canopy swirl paths */}
            <path d="M20 20 C18 16 22 12 26 16" stroke={light} fill="none" strokeWidth="0.4" opacity="0.2" />
            <path d="M28 20 C30 16 26 12 22 16" stroke={color} fill="none" strokeWidth="0.3" opacity="0.15" />
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
            {/* small ceramic pot */}
            <path d="M19 46 L20 42 L28 42 L29 46 Z" fill="#8B6543" />
            <rect x="18.5" y="40" width="11" height="2.5" rx="0.8" fill="#A0774A" />
            {/* tiny curved trunk from pot */}
            <path d="M24 40 Q22 36 23 33" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* small foliage pad */}
            <ellipse cx="23" cy="30" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="21.5" cy="29" rx="2" ry="1.5" fill={light} opacity="0.25" />
            {/* soil hint */}
            <ellipse cx="24" cy="40" rx="4" ry="0.8" fill="#4a3a2a" opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* pot */}
            <path d="M17 46 L18 42 L30 42 L31 46 Z" fill="#8B6543" />
            <rect x="16" y="39.5" width="16" height="2.5" rx="1" fill="#A0774A" />
            {/* S-curve trunk */}
            <path d="M24 39 Q20 34 22 28" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* branch from trunk */}
            <path d="M22 30 Q18 28 16 26" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* two foliage pads */}
            <ellipse cx="16" cy="23" rx="5" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="24" cy="24" rx="6" ry="5" fill={color} opacity="0.8" />
            <ellipse cx="14.5" cy="21.5" rx="2" ry="1.5" fill={light} opacity="0.2" />
            <ellipse cx="22" cy="22" rx="2.5" ry="2" fill={light} opacity="0.15" />
            {/* soil */}
            <ellipse cx="24" cy="39.5" rx="6" ry="1" fill="#4a3a2a" opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* wider pot */}
            <path d="M15 46 L17 41 L31 41 L33 46 Z" fill="#8B6543" />
            <rect x="14.5" y="39" width="19" height="2.5" rx="1" fill="#A0774A" />
            {/* gnarled S-curve trunk */}
            <path d="M24 39 Q18 34 20 26 Q22 20 24 22" stroke={trunk} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* branches from trunk */}
            <path d="M20 28 Q14 24 12 22" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M24 22 Q30 18 34 16" stroke={trunk} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {/* bark texture */}
            <path d="M21 32 Q20 30 20 28" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            {/* three foliage pads */}
            <ellipse cx="12" cy="18" rx="6" ry="4" fill={color} opacity="0.8" />
            <ellipse cx="28" cy="16" rx="7" ry="5" fill={color} />
            <ellipse cx="34" cy="12" rx="5" ry="3" fill={color} opacity="0.7" />
            <ellipse cx="10" cy="16.5" rx="2.5" ry="2" fill={light} opacity="0.2" />
            <ellipse cx="26" cy="14" rx="3" ry="2" fill={light} opacity="0.18" />
            {/* soil */}
            <ellipse cx="24" cy="39" rx="7" ry="1" fill="#4a3a2a" opacity="0.25" />
          </g>
        )
        return (
          <g>
            {/* ceramic pot — detailed with rim band and feet */}
            <path d="M13 46 L15.5 40 L32.5 40 L35 46 Z" fill="#7A5A3A" />
            <path d="M14 46 L16 40 L32 40 L34 46 Z" fill="#8B6543" />
            <rect x="13.5" y="38.5" width="21" height="2" rx="1" fill="#A0774A" />
            <path d="M14 39 L34 39" stroke="#B8916A" strokeWidth="0.6" opacity="0.4" />
            <path d="M16 42 L32 42" stroke="#6A4A2A" strokeWidth="0.4" opacity="0.2" />
            {/* pot feet */}
            <path d="M15 46 C14 46 13 47 13 47" stroke="#7A5A3A" strokeWidth="1" strokeLinecap="round" />
            <path d="M33 46 C34 46 35 47 35 47" stroke="#7A5A3A" strokeWidth="1" strokeLinecap="round" />
            {/* soil + moss */}
            <ellipse cx="24" cy="38.5" rx="8" ry="1.2" fill="#4a3a2a" opacity="0.3" />
            <path d="M17 38.5 C18 37.5 20 38 21 38.5" fill="#5a8a4a" opacity="0.25" />
            <path d="M28 38.5 C29 37.8 31 38 31.5 38.5" fill="#5a8a4a" opacity="0.2" />
            {/* gnarled S-curve trunk — the soul of a bonsai */}
            <path d="M24 38 C18 36 16 32 18 26 C20 20 24 22 26 20 C28 18 26 16 24 16" stroke={trunk} strokeWidth="5" fill="none" strokeLinecap="round" />
            {/* bark texture on trunk */}
            <path d="M20 34 C19 32 18 30 18 28" stroke={dark} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M22 28 C21 26 20 24 20 22" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <circle cx="20" cy="30" r="1.5" fill={dark} opacity="0.12" />
            <circle cx="22" cy="24" r="1" fill={dark} opacity="0.1" />
            {/* exposed aerial root */}
            <path d="M20 36 C18 38 16 39 15 38.5" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
            {/* main branches — asymmetric, cascading */}
            <path d="M18 26 C14 24 10 22 6 20" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M6 20 C4 18 4 16 6 14" stroke={trunk} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M24 16 C30 14 34 12 38 12" stroke={trunk} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M38 12 C40 10 42 8 42 6" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M22 20 C18 18 14 16 12 14" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M26 18 C30 18 32 16 34 16" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
            {/* foliage pads — flat cloud-like shapes */}
            <path d="M2 18 C2 12 6 10 10 10 C14 10 16 12 16 16 C16 20 12 22 8 22 C4 22 2 20 2 18 Z" fill={color} />
            <path d="M10 14 C10 8 16 4 24 4 C32 4 40 6 40 10 C40 14 34 18 26 18 C18 18 10 16 10 14 Z" fill={color} />
            <path d="M34 10 C34 6 38 4 42 4 C46 4 46 8 44 10 C42 12 36 14 34 10 Z" fill={color} opacity="0.8" />
            <path d="M6 14 C4 12 4 10 6 8 C8 6 12 8 12 10 C12 12 10 14 8 14 Z" fill={color} opacity="0.6" />
            {/* foliage depth + highlights */}
            <path d="M4 14 C4 12 6 10 8 12 C10 14 8 16 6 14 Z" fill={light} opacity="0.25" />
            <path d="M16 8 C18 6 22 6 24 8 C22 10 18 10 16 8 Z" fill={light} opacity="0.2" />
            <path d="M34 6 C36 4 40 4 42 6 C40 8 36 8 34 6 Z" fill={light} opacity="0.2" />
            {/* leaf edge detail */}
            <circle cx="4" cy="18" r="1.5" fill={color} opacity="0.4" />
            <circle cx="14" cy="16" r="1.2" fill={color} opacity="0.35" />
            <circle cx="44" cy="6" r="1" fill={color} opacity="0.3" />
            <circle cx="16" cy="6" r="1" fill={color} opacity="0.3" />
            <circle cx="32" cy="6" r="0.8" fill={color} opacity="0.25" />
            {/* small highlight dots */}
            <circle cx="6" cy="12" r="0.8" fill={light} opacity="0.2" />
            <circle cx="22" cy="6" r="0.6" fill={light} opacity="0.18" />
            <circle cx="40" cy="6" r="0.5" fill={light} opacity="0.15" />
          </g>
        )

      // ── Rainbow Willow: crystal diamond ──
      case 'crystal':
        if (s === 0) return (
          <g>
            {/* small base */}
            <path d="M24 46 L24 40" stroke={trunk} strokeWidth="2" />
            {/* small diamond crystal */}
            <path d="M24 28 L29 36 L24 44 L19 36 Z" fill={color} opacity="0.6" />
            {/* inner facet */}
            <path d="M24 30 L27 35 L24 40 L21 35 Z" fill={light} opacity="0.25" />
            {/* facet lines */}
            <path d="M24 28 L24 44" stroke={light} strokeWidth="0.5" opacity="0.3" />
            <path d="M19 36 L29 36" stroke={light} strokeWidth="0.4" opacity="0.25" />
            {/* sparkle */}
            <circle cx="27" cy="32" r="0.6" fill="white" opacity="0.5" />
          </g>
        )
        if (s === 1) return (
          <g>
            <path d="M24 46 L24 40" stroke={trunk} strokeWidth="2.5" />
            {/* taller diamond */}
            <path d="M24 16 L32 28 L24 42 L16 28 Z" fill={color} opacity="0.6" />
            {/* inner facet */}
            <path d="M24 18 L28 24 L24 34 L20 24 Z" fill={light} opacity="0.25" />
            {/* facet lines */}
            <path d="M24 16 L24 42" stroke={light} strokeWidth="0.6" opacity="0.35" />
            <path d="M16 28 L32 28" stroke={light} strokeWidth="0.5" opacity="0.3" />
            {/* sparkle */}
            <circle cx="28" cy="22" r="1" fill="white">
              <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        )
        if (s === 2) return (
          <g>
            <path d="M24 46 L24 38" stroke={trunk} strokeWidth="3" />
            {/* large diamond */}
            <path d="M24 6 L38 22 L24 44 L10 22 Z" fill={color} opacity="0.6" />
            {/* inner facet */}
            <path d="M24 8 L32 18 L24 34 L16 18 Z" fill={light} opacity="0.25" />
            {/* facet lines */}
            <path d="M24 6 L24 44" stroke={light} strokeWidth="0.7" opacity="0.35" />
            <path d="M10 22 L38 22" stroke={light} strokeWidth="0.6" opacity="0.3" />
            <path d="M17 13 L31 31" stroke={light} strokeWidth="0.4" opacity="0.15" />
            <path d="M31 13 L17 31" stroke={light} strokeWidth="0.4" opacity="0.15" />
            {/* small shard */}
            <path d="M8 28 L5 20 L10 22 Z" fill={color} opacity="0.4" />
            {/* sparkles */}
            <circle cx="28" cy="16" r="1.2" fill="white">
              <animate attributeName="opacity" values="0;0.9;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="16" cy="26" r="1" fill="white">
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
            {/* thin stalk connects directly to cap */}
            <rect x="23" y="36" width="2" height="10" rx="1" fill="#d4cfc4" />
            {/* small mushroom cap */}
            <path d="M18 36 Q18 30 24 28 Q30 30 30 36 Z" fill={color} opacity="0.65" />
            {/* cap underside line */}
            <path d="M20 36 Q24 35 28 36" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* spots */}
            <circle cx="22" cy="32" r="1.2" fill={light} opacity="0.3" />
            <circle cx="26" cy="31" r="0.8" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* thicker stalk */}
            <rect x="22" y="32" width="4" height="14" rx="1.5" fill="#d4cfc4" />
            <rect x="23" y="32" width="1.5" height="14" rx="0.5" fill="#b8b0a4" opacity="0.25" />
            {/* wider cap */}
            <path d="M12 32 Q12 20 24 16 Q36 20 36 32 Z" fill={color} opacity="0.7" />
            {/* cap inner highlight */}
            <path d="M16 30 Q16 22 24 18 Q32 22 32 30 Z" fill={light} opacity="0.12" />
            {/* gill line */}
            <path d="M14 32 Q24 30 34 32" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* spots */}
            <circle cx="20" cy="24" r="2" fill={light} opacity="0.3" />
            <circle cx="28" cy="22" r="1.5" fill={light} opacity="0.25" />
            <circle cx="24" cy="19" r="1" fill={light} opacity="0.2" />
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
            {/* stalk connects into cap */}
            <rect x="21.5" y="30" width="5" height="16" rx="2" fill="#d4cfc4" />
            <rect x="22.5" y="30" width="1.5" height="16" rx="0.5" fill="#b8b0a4" opacity="0.25" />
            {/* stalk ring */}
            <path d="M22 40 Q24 39 26 40" stroke="#b8b0a4" strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* large glowing cap */}
            <g filter={`url(#mglow-${uid})`}>
              <path d="M6 30 Q6 14 24 8 Q42 14 42 30 Z" fill={color} opacity="0.7" />
            </g>
            {/* cap highlight */}
            <path d="M12 28 Q12 16 24 12 Q36 16 36 28 Z" fill={light} opacity="0.12" />
            {/* gill lines */}
            <path d="M10 30 Q24 28 38 30" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M18 30 L18 26" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.1" />
            <path d="M30 30 L30 26" stroke={dark} strokeWidth="0.2" fill="none" opacity="0.1" />
            {/* spots */}
            <circle cx="18" cy="22" r="2.2" fill={light} opacity="0.35" />
            <circle cx="28" cy="20" r="1.8" fill={light} opacity="0.3" />
            <circle cx="24" cy="14" r="1.2" fill={light} opacity="0.25" />
          </g>
        )
        return (
          <g>
            <defs>
              <filter id={`mglow-${uid}`} filterUnits="userSpaceOnUse" x="-2" y="0" width="52" height="50">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* stalk — extends up into cap */}
            <path d="M22 46 Q21.5 40 22 30 Q22.5 26 24 24 Q25.5 26 26 30 Q26.5 40 26 46 Z" fill="#d4cfc4" />
            <path d="M23 46 Q23 38 23.5 28 Q24 26 24 26 Q24.5 28 24.5 36 Q24.5 42 24 46 Z" fill="#b8b0a4" opacity="0.25" />
            {/* stalk ring details */}
            <path d="M22.5 40 Q24 39 25.5 40" stroke="#b8b0a4" strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M22.3 36 Q24 35.2 25.7 36" stroke="#b8b0a4" strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* skirt/volva at base */}
            <path d="M20 44 Q22 42 24 43 Q26 42 28 44 Q26 46 24 45 Q22 46 20 44" fill="#d4cfc4" opacity="0.4" />
            {/* cap — organic mushroom shape */}
            <g filter={`url(#mglow-${uid})`}>
              <path d="M4 30 C4 18 12 8 24 6 C36 8 44 18 44 30 C38 32 30 32 24 32 C18 32 10 32 4 30 Z" fill={color} opacity="0.8" />
            </g>
            {/* cap underside gills */}
            <path d="M8 30 Q16 28 24 30 Q32 28 40 30" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M12 30 L14 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            <path d="M20 31 L20 27" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M28 31 L28 27" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.12" />
            <path d="M34 30 L34 26" stroke={dark} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* cap inner highlight */}
            <path d="M10 26 C12 16 18 10 24 9 C30 10 36 16 38 26 C32 24 26 23 24 24 C22 23 16 24 10 26 Z" fill={light} opacity="0.15" />
            {/* spots */}
            <circle cx="16" cy="18" r="2.5" fill={light} opacity="0.4" />
            <circle cx="30" cy="16" r="2" fill={light} opacity="0.35" />
            <circle cx="22" cy="12" r="1.8" fill={light} opacity="0.3" />
            <circle cx="34" cy="22" r="1.5" fill={light} opacity="0.25" />
            <circle cx="10" cy="24" r="1.2" fill={light} opacity="0.2" />
            <circle cx="38" cy="26" r="1" fill={light} opacity="0.18" />
            {/* spot highlights */}
            <circle cx="15.5" cy="17" r="0.6" fill="white" opacity="0.15" />
            <circle cx="29.5" cy="15" r="0.5" fill="white" opacity="0.12" />
          </g>
        )

      // ── Golden Kumquat: baobab ──
      case 'baobab':
        if (s === 0) return (
          <g>
            {/* characteristically fat bulgy trunk even as sprout */}
            <path d="M22 46 Q20 42 21 38 Q22 35 24 34 Q26 35 27 38 Q28 42 26 46 Z" fill={trunk} />
            {/* tiny upward branches */}
            <path d="M24 34 Q23 30 22 28" stroke={trunk} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q25 30 26 28" stroke={trunk} strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* small canopy tufts */}
            <circle cx="22" cy="26" r="2.5" fill={color} opacity="0.6" />
            <circle cx="26" cy="26" r="2.5" fill={color} opacity="0.55" />
            <circle cx="21.5" cy="25" r="0.8" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* wider fat trunk */}
            <path d="M20 46 Q18 40 19 34 Q21 28 24 28 Q27 28 29 34 Q30 40 28 46 Z" fill={trunk} />
            <path d="M22 46 Q21 40 22 34 Q23 30 24 28 L24 46 Z" fill={dark} opacity="0.1" />
            {/* upward branches */}
            <path d="M24 28 Q24 22 24 18" stroke={trunk} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M22 30 Q16 26 14 24" stroke={trunk} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* canopy tufts */}
            <ellipse cx="14" cy="21" rx="4.5" ry="3.5" fill={color} opacity="0.65" />
            <ellipse cx="12.5" cy="19.5" rx="2" ry="1.5" fill={light} opacity="0.2" />
            <ellipse cx="24" cy="14" rx="5.5" ry="4.5" fill={color} opacity="0.7" />
            <ellipse cx="22" cy="12" rx="2.5" ry="2" fill={light} opacity="0.2" />
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
            {/* two thorny vine sprouts from ground */}
            <path d="M24 46 Q22 42 22 38" stroke="#4a3828" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q26 42 26 38" stroke="#4a3828" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* tiny thorns */}
            <path d="M22 40 L20 39" stroke={color} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            <path d="M26 40 L28 39" stroke={color} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            {/* dark foliage with berries */}
            <ellipse cx="24" cy="34" rx="6" ry="5" fill="#2a4a2a" opacity="0.65" />
            <circle cx="22" cy="33" r="1.3" fill={color} opacity="0.6" />
            <circle cx="26" cy="35" r="1" fill={color} opacity="0.5" />
            <circle cx="21.5" cy="32.5" r="0.4" fill="white" opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* intertwining thorny vines */}
            <path d="M24 46 Q22 40 20 36" stroke="#4a3828" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q26 40 28 36" stroke="#4a3828" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24 40 24 34" stroke="#4a3828" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* thorns on vines */}
            <path d="M22 40 L20 38.5" stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M26 40 L28 38.5" stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M21 36 L19 35" stroke={color} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            {/* dark foliage mass */}
            <ellipse cx="24" cy="28" rx="10" ry="8" fill="#2a4a2a" opacity="0.7" />
            <ellipse cx="20" cy="26" rx="5" ry="4" fill="#1e3e1e" opacity="0.4" />
            {/* glowing berries */}
            <circle cx="18" cy="26" r="1.5" fill={color} opacity="0.65" />
            <circle cx="28" cy="24" r="1.5" fill={color} opacity="0.55" />
            <circle cx="24" cy="22" r="1.3" fill={light} opacity="0.55" />
            <circle cx="17.5" cy="25.5" r="0.4" fill="white" opacity="0.25" />
            <circle cx="23.5" cy="21.5" r="0.4" fill="white" opacity="0.2" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* thick intertwining vines */}
            <path d="M24 46 Q20 40 18 34" stroke="#4a3828" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q28 40 30 34" stroke="#4a3828" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M24 46 Q24 38 24 32" stroke="#4a3828" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* spreading branches */}
            <path d="M18 34 Q14 30 10 28" stroke="#4a3828" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M30 34 Q34 30 38 28" stroke="#4a3828" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* thorns */}
            <path d="M20 40 L17 38" stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M28 40 L31 38" stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M16 32 L13 30.5" stroke={color} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            <path d="M32 32 L35 30.5" stroke={color} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            {/* dark foliage */}
            <ellipse cx="24" cy="24" rx="14" ry="10" fill="#2a4a2a" />
            <ellipse cx="18" cy="22" rx="6" ry="5" fill="#1e3e1e" opacity="0.4" />
            <ellipse cx="30" cy="22" rx="6" ry="5" fill="#1e3e1e" opacity="0.4" />
            {/* glowing berries */}
            <circle cx="16" cy="20" r="1.8" fill={color} opacity="0.7" />
            <circle cx="28" cy="18" r="1.8" fill={color} opacity="0.7" />
            <circle cx="32" cy="24" r="1.5" fill={color} opacity="0.6" />
            <circle cx="24" cy="16" r="1.5" fill={light} opacity="0.6" />
            {/* berry highlights */}
            <circle cx="15.5" cy="19.5" r="0.5" fill="white" opacity="0.25" />
            <circle cx="27.5" cy="17.5" r="0.5" fill="white" opacity="0.22" />
          </g>
        )
        return (
          <g>
            <defs>
              <radialGradient id={`${uid}-thorn`} cx="50%" cy="50%">
                <stop offset="0%" stopColor={light} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* twisted dark vine stems — intertwining */}
            <path d="M24 46 C20 42 16 38 14 32 C12 26 10 20 8 14" stroke="#4a3828" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M24 46 C28 42 32 38 34 32 C36 26 38 20 40 14" stroke="#4a3828" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M24 46 C22 40 24 34 22 28 C20 22 22 16 24 10" stroke="#4a3828" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* vine twists crossing over */}
            <path d="M14 32 C18 30 22 32 26 28 C30 24 34 26 38 22" stroke="#4a3828" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
            <path d="M12 24 C16 22 20 24 24 20 C28 16 32 18 36 16" stroke="#4a3828" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" />
            {/* thorns — sharp barbs along vines, glowing tips */}
            <path d="M18 38 L14 36 L16 35" stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M30 38 L34 36 L32 35" stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M12 28 L8 26 L10 25" stroke={color} strokeWidth="0.7" fill="none" strokeLinecap="round" />
            <path d="M36 28 L40 26 L38 25" stroke={color} strokeWidth="0.7" fill="none" strokeLinecap="round" />
            <path d="M10 20 L6 18 L8 17" stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M38 20 L42 18 L40 17" stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M22 24 L18 22 L20 21" stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M26 24 L30 22 L28 21" stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round" />
            <path d="M24 16 L22 12 L24 13" stroke={color} strokeWidth="0.5" fill="none" strokeLinecap="round" />
            {/* thorn glow dots */}
            <circle cx="14" cy="36" r="1" fill={`url(#${uid}-thorn)`} opacity="0.6" />
            <circle cx="34" cy="36" r="1" fill={`url(#${uid}-thorn)`} opacity="0.6" />
            <circle cx="8" cy="26" r="0.8" fill={`url(#${uid}-thorn)`} opacity="0.5" />
            <circle cx="40" cy="26" r="0.8" fill={`url(#${uid}-thorn)`} opacity="0.5" />
            <circle cx="6" cy="18" r="0.7" fill={`url(#${uid}-thorn)`} opacity="0.4" />
            <circle cx="42" cy="18" r="0.7" fill={`url(#${uid}-thorn)`} opacity="0.4" />
            {/* dark foliage mass with jagged edge */}
            <path d="M4 20 C4 14 8 8 14 6 C16 5 18 6 20 4 C22 2 24 3 26 4 C28 6 30 5 34 6 C40 8 44 14 44 20 C44 26 40 30 36 32 C32 34 28 32 24 34 C20 32 16 34 12 32 C8 30 4 26 4 20 Z" fill="#1e2e1e" />
            <path d="M8 20 C8 14 12 10 18 8 C20 10 24 8 28 8 C34 8 40 14 40 20 C40 26 36 28 30 30 C26 28 22 30 18 30 C12 28 8 26 8 20 Z" fill="#2a3e2a" opacity="0.5" />
            {/* enchanted berries — glowing */}
            <circle cx="12" cy="16" r="2.2" fill={color} />
            <circle cx="12" cy="16" r="3.5" fill={color} opacity="0.15" />
            <circle cx="36" cy="16" r="2.2" fill={color} />
            <circle cx="36" cy="16" r="3.5" fill={color} opacity="0.15" />
            <circle cx="24" cy="8" r="2.5" fill={light} />
            <circle cx="24" cy="8" r="4" fill={light} opacity="0.12" />
            <circle cx="18" cy="22" r="1.8" fill={color} opacity="0.8" />
            <circle cx="30" cy="22" r="1.8" fill={color} opacity="0.8" />
            <circle cx="8" cy="22" r="1.5" fill={color} opacity="0.6" />
            <circle cx="40" cy="22" r="1.5" fill={color} opacity="0.6" />
            <circle cx="20" cy="12" r="1.5" fill={light} opacity="0.6" />
            <circle cx="32" cy="10" r="1.5" fill={light} opacity="0.5" />
            {/* berry highlights */}
            <circle cx="11" cy="15" r="0.7" fill="white" opacity="0.35" />
            <circle cx="35" cy="15" r="0.7" fill="white" opacity="0.35" />
            <circle cx="23" cy="7" r="0.8" fill="white" opacity="0.3" />
          </g>
        )

      // ── Ancient Pine: massive gnarled trunk ──
      case 'ancient':
        if (s === 0) return (
          <g>
            {/* thick gnarled sprout - already old-looking */}
            <path d="M24 46 Q22 42 21 38" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* gnarled branch */}
            <path d="M21 38 Q18 35 16 34" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* bark crack texture */}
            <path d="M22 42 L23 41.5" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.2" />
            {/* mineral vein */}
            <path d="M22 40 Q21.5 38 22 36" stroke={color} strokeWidth="0.3" fill="none" opacity="0.3" />
            {/* foliage tufts */}
            <ellipse cx="16" cy="31.5" rx="4" ry="3" fill={color} opacity="0.55" />
            <ellipse cx="22" cy="34" rx="3" ry="2.5" fill={color} opacity="0.45" />
            <circle cx="15" cy="30.5" r="1" fill={light} opacity="0.2" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* thick twisted trunk */}
            <path d="M22 46 C20 40 22 36 22 30" stroke={trunk} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            {/* bark texture */}
            <path d="M20 40 L24 39" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M20 36 L23 35.5" stroke={dark} strokeWidth="0.4" fill="none" opacity="0.18" />
            {/* mineral vein */}
            <path d="M21 42 C22 38 20 34 21 30" stroke={color} strokeWidth="0.4" fill="none" opacity="0.25" />
            {/* branches */}
            <path d="M22 32 Q16 28 12 26" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M22 28 Q26 24 30 22" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* foliage clusters */}
            <ellipse cx="12" cy="23" rx="5" ry="4" fill={color} opacity="0.6" />
            <ellipse cx="30" cy="19" rx="5" ry="3.5" fill={color} opacity="0.55" />
            <ellipse cx="22" cy="26" rx="4" ry="3" fill={color} opacity="0.5" />
            <circle cx="10.5" cy="21.5" r="1.2" fill={light} opacity="0.2" />
            <circle cx="29" cy="17.5" r="1" fill={light} opacity="0.18" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* massive gnarled trunk */}
            <path d="M21 46 C18 38 22 32 20 24" stroke={trunk} strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* bark texture */}
            <path d="M19 40 L25 39" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.22" />
            <path d="M18.5 36 L24 35" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M19 32 L24 31" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.18" />
            {/* mineral veins */}
            <path d="M20 42 C21 38 19 34 20 28" stroke={color} strokeWidth="0.4" fill="none" opacity="0.3" />
            {/* spreading branches */}
            <path d="M22 26 Q14 22 10 20" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M20 22 Q26 16 32 14" stroke={trunk} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M20 18 Q16 12 14 10" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* foliage clusters */}
            <ellipse cx="10" cy="17" rx="5.5" ry="4" fill={color} opacity="0.65" />
            <ellipse cx="32" cy="11" rx="6" ry="4" fill={color} opacity="0.7" />
            <ellipse cx="14" cy="8" rx="4.5" ry="3" fill={color} opacity="0.55" />
            <ellipse cx="24" cy="14" rx="5" ry="3.5" fill={color} opacity="0.7" />
            {/* frost highlights */}
            <circle cx="9" cy="15.5" r="1.2" fill={light} opacity="0.25" />
            <circle cx="30" cy="9.5" r="1" fill={light} opacity="0.2" />
            <circle cx="22" cy="12.5" r="0.8" fill={light} opacity="0.18" />
          </g>
        )
        return (
          <g>
            {/* massive petrified trunk — centered more */}
            <path d="M22 46 C18 38 22 32 22 22" stroke={trunk} strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M24 24 C25 32 24 40 24 46" stroke={dark} strokeWidth="2" fill="none" opacity="0.15" />
            {/* bark fossil texture — rings and cracks */}
            <path d="M19 40 L25 39" stroke={dark} strokeWidth="0.7" fill="none" opacity="0.25" />
            <path d="M18 36 L24 35" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.22" />
            <path d="M19 32 L25 31" stroke={dark} strokeWidth="0.6" fill="none" opacity="0.2" />
            <path d="M20 28 L24 27" stroke={dark} strokeWidth="0.5" fill="none" opacity="0.18" />
            {/* mineral veins — crystallized sap */}
            <path d="M20 38 C21 34 19 30 20 26" stroke={color} strokeWidth="0.5" fill="none" opacity="0.35" />
            <path d="M23 42 C24 38 22 34 23 30" stroke={color} strokeWidth="0.4" fill="none" opacity="0.25" />
            {/* major branches — ancient, thick, reaching */}
            <path d="M22 24 C18 22 12 20 8 20" stroke={trunk} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M22 20 C28 16 34 12 38 12" stroke={trunk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M22 16 C18 12 14 8 12 6" stroke={trunk} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M22 22 C26 18 30 16 34 16" stroke={trunk} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M10 20 C8 18 8 16 8 14" stroke={trunk} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" />
            {/* foliage — icy/mineralized, pulled inward */}
            <ellipse cx="8" cy="16" rx="6" ry="4.5" fill={color} opacity="0.7" />
            <ellipse cx="36" cy="10" rx="7" ry="4.5" fill={color} opacity="0.8" />
            <ellipse cx="12" cy="5" rx="5" ry="3.5" fill={color} opacity="0.6" />
            <ellipse cx="24" cy="12" rx="6" ry="4.5" fill={color} />
            <ellipse cx="32" cy="14" rx="4" ry="3" fill={color} opacity="0.5" />
            <ellipse cx="16" cy="12" rx="4" ry="3" fill={color} opacity="0.4" />
            {/* frost crystal highlights */}
            <ellipse cx="34" cy="8" rx="3" ry="2" fill={light} opacity="0.35" />
            <ellipse cx="8" cy="14" rx="2.5" ry="1.8" fill={light} opacity="0.3" />
            <ellipse cx="22" cy="10" rx="2.5" ry="1.8" fill={light} opacity="0.25" />
            <circle cx="14" cy="4" r="1.2" fill={light} opacity="0.25" />
            <circle cx="40" cy="10" r="1" fill={light} opacity="0.2" />
            {/* mineral sparkles */}
            <circle cx="36" cy="8" r="0.6" fill="#fff" opacity="0.3" />
            <circle cx="10" cy="14" r="0.5" fill="#fff" opacity="0.25" />
            <circle cx="24" cy="8" r="0.5" fill="#fff" opacity="0.2" />
            <circle cx="16" cy="6" r="0.4" fill="#fff" opacity="0.18" />
            {/* ice crystal accents */}
            <path d="M38 8 L40 6 L38 4" stroke={light} strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M6 14 L4 12 L6 10" stroke={light} strokeWidth="0.4" fill="none" opacity="0.25" />
            {/* exposed roots */}
            <path d="M20 46 C18 45 16 45 14 46" stroke={trunk} strokeWidth="1.2" fill="none" opacity="0.35" />
            <path d="M26 46 C28 45 30 45 32 46" stroke={trunk} strokeWidth="1" fill="none" opacity="0.3" />
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
            {/* dark twisted stem */}
            <path d="M24 46 Q23 42 24 38" stroke="#2a2a3e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* void seed - dark sphere */}
            <circle cx="24" cy="34" r="5" fill={`url(#vgrad-${uid})`} />
            <circle cx="24" cy="34" r="2.5" fill="#0a0a14" />
            {/* particle being pulled in */}
            <circle cx="20" cy="32" r="0.6" fill="#6366f1" opacity="0.4">
              <animate attributeName="cx" values="20;23.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* distortion ring hint */}
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
            {/* warped trunk */}
            <path d="M24 46 Q23 40 24 34" stroke="#2a2a3e" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* warped branch */}
            <path d="M24 36 Q20 32 16 30" stroke="#2a2a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* void core */}
            <g filter={`url(#vglow-${uid})`}>
              <circle cx="24" cy="28" r="8" fill={`url(#vgrad-${uid})`} />
              <circle cx="24" cy="28" r="4" fill="#0a0a14" />
            </g>
            {/* particles */}
            <circle cx="16" cy="26" r="0.7" fill="#6366f1" opacity="0.5">
              <animate attributeName="cx" values="16;22" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="cy" values="26;28" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="32" cy="30" r="0.6" fill="#8b5cf6" opacity="0.4">
              <animate attributeName="cx" values="32;26" dur="2s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.4;0" dur="2s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            {/* distortion ring */}
            <circle cx="24" cy="28" r="6" fill="none" stroke="#6366f1" strokeWidth="0.3" opacity="0.15">
              <animate attributeName="r" values="6;7;6" dur="3s" repeatCount="indefinite" />
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
            {/* warped trunk */}
            <path d="M24 46 Q23 40 24 32" stroke="#2a2a3e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* warped branches */}
            <path d="M24 34 Q18 28 14 26" stroke="#2a2a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M24 30 Q30 24 34 22" stroke="#2a2a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* void core */}
            <g filter={`url(#vglow-${uid})`}>
              <circle cx="24" cy="22" r="12" fill={`url(#vgrad-${uid})`} />
              <circle cx="24" cy="22" r="5" fill="#0a0a14" />
            </g>
            {/* particles being pulled in */}
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
            {/* distortion rings */}
            <ellipse cx="24" cy="22" rx="8" ry="8" fill="none" stroke="#6366f1" strokeWidth="0.4" opacity="0.15">
              <animate attributeName="rx" values="8;10;8" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.05;0.15" dur="4s" repeatCount="indefinite" />
            </ellipse>
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
            {/* tiny dead stick */}
            <path d="M24 46 L24 38" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" />
            {/* broken twig */}
            <path d="M24 40 Q22 38 21 39" stroke="#4a4a4a" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            {/* dry bark mark */}
            <path d="M23.5 42 L24.5 42" stroke="#3a3a3a" strokeWidth="0.3" opacity="0.3" />
          </g>
        )
        if (s === 1) return (
          <g>
            {/* taller dead trunk */}
            <path d="M24 46 L24 32" stroke="#4a4a4a" strokeWidth="2" strokeLinecap="round" />
            {/* broken branches */}
            <path d="M24 38 Q20 34 18 36" stroke="#4a4a4a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M24 34 Q27 30 29 32" stroke="#4a4a4a" strokeWidth="1" strokeLinecap="round" fill="none" />
            {/* bark cracks */}
            <path d="M23.5 40 L24.5 39.8" stroke="#3a3a3a" strokeWidth="0.4" opacity="0.3" />
            <path d="M23.5 36 L24.5 35.8" stroke="#3a3a3a" strokeWidth="0.3" opacity="0.25" />
          </g>
        )
        if (s === 2) return (
          <g>
            {/* thicker dead stump */}
            <path d="M23 46 L23 28 Q23 25 24 24 Q25 25 25 28 L25 46 Z" fill="#4a4a4a" />
            {/* broken branches */}
            <path d="M23 34 Q19 30 17 32" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M25 28 Q29 24 31 26" stroke="#4a4a4a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            {/* bark cracks */}
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
