"use client"
import { TREE_TYPES } from "@/app/constants"

export function PlantIcon({ type, size = 40, stage = 0 }: { type: string, size?: number, stage?: number }) {
  const typeInfo = TREE_TYPES[type] || TREE_TYPES.navel
  
  // Define shape categories
  const isRound = ['navel', 'valencia', 'tangerine', 'neon', 'ghost', 'elderberry', 'pomelo'].includes(type)
  const isSharp = ['blood', 'lime', 'meyer', 'finger_lime', 'blood_lemon', 'void'].includes(type)
  const isCluster = ['clementine', 'bergamot', 'dragonfruit', 'prehistoric'].includes(type)
  const isOval = ['kumquat', 'gold_kumquat'].includes(type)
  const isExotic = ['buddha', 'starfruit', 'rainbow'].includes(type)

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="overflow-visible">
      {/* Dynamic Gradients for Chroma/Rainbow */}
      {type === 'rainbow' && (
        <defs>
          <linearGradient id="rainbow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#eab308" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="75%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      )}

      {/* Trunk / Stem */}
      <rect x="11.2" y="15" width="1.6" height="5" fill={type === 'void' ? "#222" : "#5c2d0b"} rx="0.4" />
      
      {/* Foliage Silhouettes */}
      <g>
        {isRound && (
          <circle cx="12" cy="11.5" r={4.5 + (stage * 1.5)} fill={type === 'rainbow' ? 'url(#rainbow-grad)' : typeInfo.color} opacity="0.9" />
        )}
        {isSharp && (
          <path 
            d={`M12 ${11.5 - (5 + stage * 1.5)} Q ${12 + (5 + stage * 1.5)} 11.5 12 ${11.5 + (5 + stage * 1.5)} Q ${12 - (5 + stage * 1.5)} 11.5 12 ${11.5 - (5 + stage * 1.5)}`} 
            fill={type === 'rainbow' ? 'url(#rainbow-grad)' : typeInfo.color} 
            opacity="0.9" 
          />
        )}
        {isCluster && (
          <g opacity="0.9" fill={type === 'rainbow' ? 'url(#rainbow-grad)' : typeInfo.color}>
            <circle cx="12" cy={11.5 - (stage * 1)} r={2.5 + stage} />
            <circle cx={12 - (2.5 + stage)} cy="11.5" r={2.5 + stage} />
            <circle cx={12 + (2.5 + stage)} cy="11.5" r={2.5 + stage} />
          </g>
        )}
        {isOval && (
          <ellipse cx="12" cy="11.5" rx={2.5 + stage} ry={4.5 + stage * 1.5} fill={type === 'rainbow' ? 'url(#rainbow-grad)' : typeInfo.color} opacity="0.9" />
        )}
        {isExotic && (
           <path 
             d={type === 'starfruit' 
                ? "M12 6 L14 10 L18 10 L15 13 L16 17 L12 15 L8 17 L9 13 L6 10 L10 10 Z" 
                : "M10 10 Q 12 5 14 10 L 16 15 Q 18 18 14 20 Q 12 22 10 20 Q 6 18 8 15 Z"} 
             fill={type === 'rainbow' ? 'url(#rainbow-grad)' : typeInfo.color} 
             opacity="0.9" 
           />
        )}
      </g>
    </svg>
  )
}
