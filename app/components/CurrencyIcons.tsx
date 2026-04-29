"use client"

export function SapIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M12 2 Q12 2 6 13 C3.5 17.5 6 22 12 22 C18 22 20.5 17.5 18 13 Q12 2 12 2 Z" fill="url(#sap-body)" />
      <path d="M12 2 Q12 2 6 13 C3.5 17.5 6 22 12 22 C18 22 20.5 17.5 18 13 Q12 2 12 2 Z" fill="url(#sap-shine)" />
      <ellipse cx="9.5" cy="13" rx="2.5" ry="3.5" fill="white" opacity="0.18" transform="rotate(-15 9.5 13)" />
      <ellipse cx="8.5" cy="12" rx="1" ry="1.5" fill="white" opacity="0.12" transform="rotate(-10 8.5 12)" />
      <defs>
        <linearGradient id="sap-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id="sap-shine" cx="35%" cy="40%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export const PulpIcon = SapIcon

export function GemIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M12 2 L4 9 L12 22 L20 9 Z" fill="url(#gem-body)" />
      <path d="M4 9 L12 2 L20 9" fill="url(#gem-top)" />
      <path d="M4 9 L12 13 L20 9" fill="#7dd3fc" opacity="0.3" />
      <path d="M4 9 L12 22 L12 13 Z" fill="#38bdf8" opacity="0.4" />
      <path d="M20 9 L12 22 L12 13 Z" fill="#0284c7" opacity="0.3" />
      <path d="M8 5.5 L12 2 L16 5.5" stroke="#bae6fd" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M4 9 L20 9" stroke="#7dd3fc" strokeWidth="0.4" opacity="0.4" />
      <path d="M12 2 L12 9" stroke="#bae6fd" strokeWidth="0.3" opacity="0.3" />
      <path d="M7 7 L9 5" stroke="white" strokeWidth="0.6" opacity="0.3" strokeLinecap="round" />
      <defs>
        <linearGradient id="gem-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="gem-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
    </svg>
  )
}

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
