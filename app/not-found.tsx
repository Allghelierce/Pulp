"use client"

import Link from "next/link"

export default function NotFound() {
  const serif = '"Georgia", Georgia, serif'
  const mono = '"JetBrains Mono", ui-monospace, monospace'
  const accent = '#d97706'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#E0D7C1', color: '#0f0f10',
      fontFamily: serif, textAlign: 'center',
      padding: 24,
    }}>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        {/* Big 404 */}
        <div style={{
          fontSize: 'clamp(8rem, 20vw, 14rem)', fontWeight: 400,
          letterSpacing: '-0.04em', lineHeight: 1,
          color: 'rgba(15,15,16,0.06)',
          fontFamily: serif,
          userSelect: 'none',
        }}>
          404
        </div>

        {/* Orange with face — centered on the 0 */}
        <svg
          width="120" height="120" viewBox="0 0 120 120"
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Orange body */}
          <circle cx="60" cy="62" r="44" fill="#e8930c" />
          <circle cx="60" cy="62" r="44" fill="url(#orange-shade)" />

          {/* Subtle texture bumps */}
          <circle cx="42" cy="50" r="1.2" fill="rgba(255,255,255,0.12)" />
          <circle cx="72" cy="48" r="1" fill="rgba(255,255,255,0.1)" />
          <circle cx="55" cy="78" r="0.9" fill="rgba(255,255,255,0.08)" />
          <circle cx="68" cy="72" r="1.1" fill="rgba(255,255,255,0.1)" />
          <circle cx="48" cy="68" r="0.8" fill="rgba(255,255,255,0.08)" />

          {/* Highlight */}
          <ellipse cx="48" cy="46" rx="14" ry="10" fill="rgba(255,255,255,0.15)" />

          {/* Stem */}
          <path d="M58,18 Q56,14 58,10 Q60,8 62,10 Q64,14 62,18" fill="#5a7a3a" />
          <ellipse cx="60" cy="18" rx="3" ry="1.5" fill="#6a8a44" />

          {/* Leaf */}
          <path d="M62,14 Q70,8 74,12 Q70,16 62,14Z" fill="#5a8a38" />
          <path d="M62,14 Q68,11 74,12" fill="none" stroke="#4a7a2e" strokeWidth="0.5" />

          {/* Face — eyes */}
          <ellipse cx="47" cy="56" rx="4" ry="5" fill="#1a1008" />
          <ellipse cx="73" cy="56" rx="4" ry="5" fill="#1a1008" />
          {/* Eye shine */}
          <circle cx="48.5" cy="54" r="1.5" fill="rgba(255,255,255,0.7)" />
          <circle cx="74.5" cy="54" r="1.5" fill="rgba(255,255,255,0.7)" />

          {/* Worried mouth — wavy line */}
          <path d="M46,72 Q50,68 54,72 Q58,76 62,72 Q66,68 70,72" fill="none" stroke="#1a1008" strokeWidth="2.2" strokeLinecap="round" />

          {/* Eyebrows — worried angle */}
          <path d="M41,48 Q44,45 50,47" fill="none" stroke="#1a1008" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M79,48 Q76,45 70,47" fill="none" stroke="#1a1008" strokeWidth="1.8" strokeLinecap="round" />

          {/* Blush */}
          <ellipse cx="40" cy="64" rx="5" ry="3" fill="rgba(200,60,20,0.15)" />
          <ellipse cx="80" cy="64" rx="5" ry="3" fill="rgba(200,60,20,0.15)" />

          <defs>
            <radialGradient id="orange-shade" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <p style={{
        fontFamily: serif, fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
        color: '#6b6864', textTransform: 'lowercase',
        marginBottom: 32, maxWidth: 360,
      }}>
        this page got lost in the orchard.
      </p>

      <Link href="/" style={{
        fontFamily: mono, fontSize: '0.76rem', letterSpacing: '0.06em',
        padding: '10px 28px', borderRadius: 8, textDecoration: 'none',
        textTransform: 'lowercase',
        background: accent, color: '#fff',
        boxShadow: '0 4px 20px -4px rgba(234,88,12,0.3)',
      }}>
        go home
      </Link>
    </div>
  )
}
