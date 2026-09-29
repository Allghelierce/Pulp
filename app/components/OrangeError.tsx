"use client"

// Friendly full-screen error state with the Pulp orange mascot.
// Used by app/error.tsx (thrown errors) and app/oops/page.tsx (redirect target).

export function OrangeError({
  title = "well, that's not ripe yet",
  message = "something went sideways on our end. give it another go.",
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 24, padding: "32px 16px",
      background: "#f5efe1", color: "#0f0f10",
      fontFamily: "'EB Garamond', Georgia, serif", textAlign: "center",
    }}>
      {/* Cute orange mascot */}
      <svg width="140" height="150" viewBox="0 0 140 150" fill="none" aria-hidden style={{ filter: "drop-shadow(0 12px 24px rgba(217,119,6,0.25))" }}>
        {/* leaf */}
        <path d="M70 26c6-12 20-16 30-13-2 11-11 20-23 20-3 0-5-3-7-7z" fill="#4b8b3b" />
        <path d="M70 27c2-4 6-7 11-9" stroke="#3a6e2c" strokeWidth="1.5" strokeLinecap="round" />
        {/* body */}
        <circle cx="70" cy="92" r="52" fill="#e8890c" />
        <circle cx="70" cy="92" r="52" fill="url(#og)" />
        {/* dimples */}
        <circle cx="46" cy="78" r="3" fill="#d97706" opacity="0.5" />
        <circle cx="98" cy="104" r="3.5" fill="#d97706" opacity="0.5" />
        <circle cx="92" cy="70" r="2.5" fill="#d97706" opacity="0.4" />
        {/* eyes (worried) */}
        <circle cx="54" cy="86" r="5" fill="#2a1a08" />
        <circle cx="86" cy="86" r="5" fill="#2a1a08" />
        <circle cx="55.6" cy="84.4" r="1.6" fill="#fff" />
        <circle cx="87.6" cy="84.4" r="1.6" fill="#fff" />
        {/* worried brows */}
        <path d="M48 76c3-2 7-2 10 0" stroke="#2a1a08" strokeWidth="2" strokeLinecap="round" />
        <path d="M82 76c3-2 7-2 10 0" stroke="#2a1a08" strokeWidth="2" strokeLinecap="round" />
        {/* small frown */}
        <path d="M62 106c3-4 13-4 16 0" stroke="#2a1a08" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* blush */}
        <ellipse cx="44" cy="98" rx="6" ry="4" fill="#f7b267" opacity="0.6" />
        <ellipse cx="96" cy="98" rx="6" ry="4" fill="#f7b267" opacity="0.6" />
        <defs>
          <radialGradient id="og" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#fbb04b" />
            <stop offset="60%" stopColor="#ef9412" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>
        </defs>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420 }}>
        <h1 style={{ fontSize: "1.9rem", fontWeight: 500, margin: 0, letterSpacing: "-0.01em" }}>{title}</h1>
        <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "#6b6864", margin: 0 }}>{message}</p>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              fontFamily: "inherit", fontSize: "0.95rem", padding: "10px 24px", borderRadius: 999,
              border: "none", cursor: "pointer", background: "#d97706", color: "#fff", fontWeight: 500,
            }}
          >
            try again
          </button>
        )}
        <a
          href="/app"
          style={{
            fontFamily: "inherit", fontSize: "0.95rem", padding: "10px 24px", borderRadius: 999,
            textDecoration: "none", background: onRetry ? "rgba(0,0,0,0.05)" : "#d97706",
            color: onRetry ? "#0f0f10" : "#fff", fontWeight: 500,
            border: onRetry ? "1px solid rgba(0,0,0,0.08)" : "none",
          }}
        >
          back to pulp
        </a>
      </div>
    </div>
  )
}

export default OrangeError
