"use client"

export function SapIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M12 2 C12 2 7 11 7 15.5 C7 19.5 9.2 22 12 22 C14.8 22 17 19.5 17 15.5 C17 11 12 2 12 2Z" fill="#d97706" stroke="#92400e" strokeWidth="1.2"/>
      <ellipse cx="12" cy="15.5" rx="1.5" ry="1.8" fill="#92400e" opacity="0.6"/>
    </svg>
  )
}

export const PulpIcon = SapIcon

export function TimeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 0 3px currentColor)' }}>
      <line x1="7" y1="3" x2="17" y2="3" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7" y1="21" x2="17" y2="21" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 4 C8 4 8 9 12 12 C8 15 8 20 8 20" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M16 4 C16 4 16 9 12 12 C16 15 16 20 16 20" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export const GemIcon = TimeIcon

export function PaperIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M6 2 L15 2 L20 7 L20 22 L6 22 Z" fill="url(#paper-bg)" stroke="#d4a574" strokeWidth="0.8" />
      <path d="M15 2 L15 7 L20 7" fill="#e8cfa8" stroke="#d4a574" strokeWidth="0.5" />
      <path d="M9 10 L17 10" stroke="#c9a06c" strokeWidth="0.6" opacity="0.4" />
      <path d="M9 13 L17 13" stroke="#c9a06c" strokeWidth="0.6" opacity="0.35" />
      <path d="M9 16 L14 16" stroke="#c9a06c" strokeWidth="0.6" opacity="0.3" />
      <ellipse cx="10" cy="6" rx="3" ry="1.5" fill="white" opacity="0.12" />
      <defs>
        <linearGradient id="paper-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5e6d0" />
          <stop offset="100%" stopColor="#e8d5b8" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function LeafIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M12 22 Q8 18 6 14 C3 8 5 3 12 2 C19 3 21 8 18 14 Q16 18 12 22 Z" fill="url(#leaf-fill)" />
      <path d="M12 22 Q12 14 12 4" stroke="#2d6b3f" strokeWidth="0.7" opacity="0.5" />
      <path d="M12 8 Q9 6 7 7" stroke="#2d6b3f" strokeWidth="0.4" opacity="0.35" />
      <path d="M12 12 Q9 11 7 12" stroke="#2d6b3f" strokeWidth="0.4" opacity="0.3" />
      <path d="M12 8 Q15 6 17 7" stroke="#2d6b3f" strokeWidth="0.4" opacity="0.35" />
      <path d="M12 12 Q15 11 17 12" stroke="#2d6b3f" strokeWidth="0.4" opacity="0.3" />
      <ellipse cx="10" cy="8" rx="2.5" ry="3" fill="white" opacity="0.12" transform="rotate(-15 10 8)" />
      <defs>
        <linearGradient id="leaf-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
    </svg>
  )
}
