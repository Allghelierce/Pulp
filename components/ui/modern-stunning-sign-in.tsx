"use client"

import * as React from "react"

interface SignInProps {
  email: string
  password: string
  error: string
  isSignUp: boolean
  loading?: boolean
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onToggleMode: () => void
  onGoogleSignIn: () => void | Promise<void>
}

const SignIn1: React.FC<SignInProps> = ({
  email, password, error, isSignUp, loading,
  onEmailChange, onPasswordChange, onSubmit, onToggleMode, onGoogleSignIn,
}) => {
  const [googleLoading, setGoogleLoading] = React.useState(false)

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await onGoogleSignIn()
    setGoogleLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0e0c0b] relative overflow-hidden w-full">
      {/* Warm ambient glow — muted amber, not neon */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{
          position: "absolute",
          top: "18%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 560, height: 560,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(160,70,15,0.13) 0%, rgba(120,45,8,0.05) 55%, transparent 75%)",
          filter: "blur(12px)",
        }} />
        <div style={{
          position: "absolute",
          bottom: "12%", right: "18%",
          width: 260, height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(140,60,10,0.06) 0%, transparent 70%)",
        }} />
      </div>


      {/* Glass card */}
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(14,10,8,0.92) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(160,70,15,0.16)",
          boxShadow: "0 32px 80px -16px rgba(0,0,0,0.85), 0 0 0 1px rgba(160,70,15,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Title */}
        <h2 className="text-2xl font-semibold text-white mb-1 text-center tracking-tight">
          {isSignUp ? "Create account" : "Welcome back"}
        </h2>
        <p className="text-sm text-zinc-500 mb-7 text-center">
          {isSignUp ? "Start writing your first note." : "Sign in to your notes."}
        </p>

        {/* Inputs */}
        <div className="flex flex-col w-full gap-3 mb-4">
          <input
            placeholder="Email"
            type="email"
            value={email}
            required
            onChange={e => onEmailChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-white placeholder-zinc-600 text-sm focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(160,80,20,0.5)")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            required
            onChange={e => onPasswordChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-white placeholder-zinc-600 text-sm focus:outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "border-color 0.15s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(160,80,20,0.5)")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          />
          {error && <p className="text-xs text-red-400 text-left">{error}</p>}
        </div>

        <div className="w-full flex flex-col gap-2">
          {/* Primary submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-medium px-5 py-3 rounded-full text-sm transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #b85c20, #8a3e10)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(140,60,16,0.28)",
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 22px rgba(140,60,16,0.42)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(140,60,16,0.28)")}
          >
            {loading ? "…" : isSignUp ? "Create account" : "Sign in"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-xs text-zinc-600">or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-full text-sm font-medium text-white transition-all disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          >
            {googleLoading ? (
              <span className="text-zinc-400">Redirecting…</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Toggle sign up / sign in */}
          <p className="text-center text-xs text-zinc-600 mt-2">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              {isSignUp ? "Sign in" : "Sign up free"}
            </button>
          </p>

          {/* Skip — try without account */}
          <a
            href="/app"
            className="text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-3 block"
            style={{ textDecoration: 'none' }}
          >
            or just try it — no account needed →
          </a>
        </div>
      </form>

      {/* Social proof */}
      <div className="relative z-10 mt-10 flex flex-col items-center text-center">
        <div className="flex mb-2">
          {[
            { letter: "A", bg: "#4285F4" },
            { letter: "M", bg: "#0F9D58" },
            { letter: "J", bg: "#DB4437" },
            { letter: "S", bg: "#8B44AC" },
          ].map(({ letter, bg }, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-medium select-none"
              style={{
                background: bg,
                border: "2px solid #0e0c0b",
                marginLeft: i > 0 ? -8 : 0,
              }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { SignIn1 }
