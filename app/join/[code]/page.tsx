"use client"
import { useEffect, useState, use } from "react"
import { supabase } from "@/lib/supabase"
import { joinParty } from "@/lib/party"
import { GroveBackdrop, SCENE_CSS } from "@/app/components/community/PartyPanel"
import { PENDING_INVITE_KEY } from "@/app/components/community/PartyPresence"

const accent = "#d97706"
type Preview = { name: string; members: number; max: number }

// Invite link landing: /join/ABCD2345 → "Join <party>?"
export default function JoinPartyPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent(use(params).code).trim().toUpperCase()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [state, setState] = useState<"idle" | "busy" | "pending" | "active">("idle")

  useEffect(() => {
    fetch(`/api/groups/invite?code=${encodeURIComponent(code)}`)
      .then(async r => { const d = await r.json(); if (r.ok) setPreview(d); else setError(d.error || "This invite doesn't work") })
      .catch(() => setError("Couldn't load this invite"))
    supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session))
  }, [code])

  const join = async () => {
    setState("busy"); setError(null)
    try {
      const r = await joinParty(code)
      if (r === "active") { window.location.href = "/app?party=open"; return }
      setState("pending")
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't join"); setState("idle") }
  }
  const signIn = () => {
    try { localStorage.setItem(PENDING_INVITE_KEY, code) } catch {}
    window.location.href = "/login"
  }

  const full = preview ? preview.members >= preview.max : false
  const btn = { padding: "12px 22px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "Crimson Pro, serif", fontSize: 16,
    background: `linear-gradient(135deg, ${accent}, #b45309)`, color: "#fff", boxShadow: "0 8px 20px -10px rgba(217,119,6,0.7)" } as const

  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      background: "#0c0c0e", fontFamily: "Crimson Pro, serif", color: "#fafafa" }}>
      <div style={{ width: "100%", maxWidth: 420, borderRadius: 20, overflow: "hidden", background: "#18181b",
        border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 60px -12px rgba(0,0,0,0.6)" }}>
        <div style={{ position: "relative", height: 150 }}>
          <style>{SCENE_CSS}</style>
          <GroveBackdrop isDark height={150} />
        </div>
        <div style={{ padding: "22px 24px 26px", textAlign: "center" }}>
          {error && !preview ? (
            <>
              <h1 style={{ fontSize: 22, margin: "0 0 8px", fontWeight: 500 }}>Invite not found</h1>
              <p style={{ color: "#a1a1aa", margin: "0 0 18px" }}>{error}</p>
              <a href="/app" style={{ color: accent }}>Open Pulp</a>
            </>
          ) : !preview ? (
            <p style={{ color: "#a1a1aa" }}>Loading invite…</p>
          ) : state === "pending" ? (
            <>
              <h1 style={{ fontSize: 22, margin: "0 0 8px", fontWeight: 500 }}>Request sent 🌱</h1>
              <p style={{ color: "#a1a1aa", margin: "0 0 18px" }}>The owner of <b style={{ color: accent }}>{preview.name}</b> needs to let you in.</p>
              <a href="/app?party=open" style={{ ...btn, display: "inline-block", textDecoration: "none" }}>Open Pulp</a>
            </>
          ) : (
            <>
              <p style={{ color: "#a1a1aa", margin: "0 0 4px", fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>You&apos;re invited to</p>
              <h1 style={{ fontSize: 26, margin: "0 0 6px", fontWeight: 500 }}>{preview.name}</h1>
              <p style={{ color: "#a1a1aa", margin: "0 0 20px", fontSize: 15 }}>
                {preview.members}/{preview.max} players · race your friends on focus minutes each week
              </p>
              {full ? (
                <p style={{ color: "#ef4444" }}>This party is full.</p>
              ) : signedIn === false ? (
                <button onClick={signIn} style={btn}>Sign in to join</button>
              ) : (
                <button onClick={join} disabled={state === "busy" || signedIn === null} style={{ ...btn, opacity: state === "busy" ? 0.6 : 1 }}>
                  {state === "busy" ? "Joining…" : "Join party"}
                </button>
              )}
              {error && <p style={{ color: "#ef4444", fontSize: 14, marginTop: 12 }}>{error}</p>}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
