"use client"
import { TREE_TYPES } from "@/app/constants"

export function PlantIcon({ type, size = 40, stage = 0, isSeed = false }: { type: string, size?: number, stage?: number, isSeed?: boolean }) {
  const typeInfo = TREE_TYPES[type] || TREE_TYPES.navel
  const color = typeInfo.color

  if (isSeed) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="overflow-visible">
        <defs>
          <filter id="seed-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Unique seed shapes based on rarity/type */}
        {typeInfo.rarity === 'common' && <ellipse cx="12" cy="12" rx="4" ry="6" fill={color} opacity="0.8" />}
        {typeInfo.rarity === 'uncommon' && <path d="M12 6 Q 16 12 12 18 Q 8 12 12 6" fill={color} opacity="0.9" />}
        {typeInfo.rarity === 'rare' && <path d="M12 4 L15 12 L12 20 L9 12 Z" fill={color} filter="url(#seed-glow)" />}
        {typeInfo.rarity === 'true rare' && (
          <g filter="url(#seed-glow)">
            <circle cx="12" cy="12" r="6" fill="none" stroke={color} strokeWidth="2" strokeDasharray="2 2" />
            <circle cx="12" cy="12" r="3" fill={color} />
          </g>
        )}
        {(typeInfo.rarity === 'premium' || typeInfo.rarity === 'chroma' || typeInfo.rarity === 'extinct') && (
          <g filter="url(#seed-glow)">
            <path d="M12 4 L14 10 L20 12 L14 14 L12 20 L10 14 L4 12 L10 10 Z" fill={color} />
            <circle cx="12" cy="12" r="2" fill="white" />
          </g>
        )}
        {type === 'void' && <circle cx="12" cy="12" r="5" fill="#000" stroke="#fff" strokeWidth="0.5" />}
      </svg>
    )
  }

  // Plant stage logic
  const scale = 0.5 + (stage * 0.125) // 0.5 to 1.0
  const isRound = ['navel', 'valencia', 'tangerine', 'neon', 'ghost', 'elderberry', 'pomelo', 'navel'].includes(type)
  const isSharp = ['blood', 'lime', 'meyer', 'finger_lime', 'blood_lemon', 'void'].includes(type)
  const isCluster = ['clementine', 'bergamot', 'dragonfruit', 'prehistoric'].includes(type)
  const isOval = ['kumquat', 'gold_kumquat'].includes(type)
  const isExotic = ['buddha', 'starfruit', 'rainbow'].includes(type)

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="overflow-visible">
      <g transform={`translate(12, 12) scale(${scale}) translate(-12, -12)`}>
        {/* Stem */}
        <path d="M12 22 L12 16" stroke={type === 'void' ? "#222" : "#5c2d0b"} strokeWidth="2" strokeLinecap="round" />
        
        {/* Foliage */}
        <g opacity="0.9">
          {isRound && <circle cx="12" cy="11" r="7" fill={color} />}
          {isSharp && <path d="M12 4 Q19 11 12 18 Q5 11 12 4" fill={color} />}
          {isCluster && (
            <g fill={color}>
              <circle cx="12" cy="8" r="4" />
              <circle cx="8" cy="13" r="4" />
              <circle cx="16" cy="13" r="4" />
            </g>
          )}
          {isOval && <ellipse cx="12" cy="11" rx="5" ry="8" fill={color} />}
          {isExotic && (
            <path 
              d={type === 'starfruit' 
                ? "M12 4 L14 9 L19 9 L15 12 L16 17 L12 15 L8 17 L9 12 L5 9 L10 9 Z" 
                : "M12 4 Q14 2 16 4 L18 10 Q20 18 12 20 Q4 18 6 10 L8 4 Q10 2 12 4"} 
              fill={color} 
            />
          )}
        </g>

        {/* Fruit Detail (only in later stages) */}
        {stage >= 3 && (
          <g>
            <circle cx="12" cy="11" r="1.5" fill="white" opacity="0.6" />
            <circle cx="9" cy="14" r="1.2" fill="white" opacity="0.4" />
            <circle cx="15" cy="14" r="1.2" fill="white" opacity="0.4" />
          </g>
        )}
      </g>
    </svg>
  )
}
