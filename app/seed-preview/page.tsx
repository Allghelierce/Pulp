"use client"

export default function SeedPreview() {
  const seeds = [
    {
      name: 'Mushroom',
      render: (uid: string) => (
        <svg width={120} height={120} viewBox="0 0 48 48">
          <defs>
            <radialGradient id={`${uid}-g`} cx="40%" cy="40%">
              <stop offset="0%" stopColor="#eee8d6" />
              <stop offset="100%" stopColor="#d4c8a8" />
            </radialGradient>
          </defs>
          <ellipse cx="24" cy="38" rx="14" ry="4" fill="#8B7355" opacity="0.3" />
          <g style={{ transformOrigin: '24px 38px', animation: 'plantSway 4.5s ease-in-out -2s infinite' }}>
            {/* Spore — round, pale, with tiny spots hinting at cap */}
            <circle cx="24" cy="29" r="6" fill={`url(#${uid}-g)`} />
            <circle cx="24" cy="29" r="6" fill="#bf360c" opacity="0.06" />
            {/* Spore dots */}
            <circle cx="22" cy="27" r="1" fill="#d84315" opacity="0.25" />
            <circle cx="26" cy="28" r="0.8" fill="#d84315" opacity="0.2" />
            <circle cx="24" cy="31" r="0.7" fill="#d84315" opacity="0.15" />
            <circle cx="21" cy="30" r="0.5" fill="#d84315" opacity="0.18" />
            <circle cx="27" cy="26" r="0.6" fill="#d84315" opacity="0.12" />
            {/* Tiny mycelium threads */}
            <path d="M22 35 Q20 37 18 38" stroke="#d4c8a8" strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M26 35 Q28 37 30 38" stroke="#d4c8a8" strokeWidth="0.4" fill="none" opacity="0.3" />
            <path d="M24 35 Q24 37 24 38" stroke="#d4c8a8" strokeWidth="0.3" fill="none" opacity="0.25" />
            {/* Highlight */}
            <ellipse cx="22" cy="27" rx="2" ry="1.5" fill="white" opacity="0.15" />
          </g>
        </svg>
      ),
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0e0c09',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 40,
      padding: 40,
      fontFamily: 'Crimson Pro, serif',
    }}>
      <style>{`@keyframes plantSway { 0%, 100% { transform: rotate(-1.5deg) } 50% { transform: rotate(1.5deg) } }`}</style>
      <h1 style={{ color: '#d97706', fontSize: 24, fontWeight: 400, letterSpacing: '0.12em' }}>SEED DESIGNS</h1>
      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
        {seeds.map((seed, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 140, height: 140,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {seed.render(`seed-${i}`)}
            </div>
            <span style={{ color: '#8a8680', fontSize: 13, letterSpacing: '0.08em' }}>{seed.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
