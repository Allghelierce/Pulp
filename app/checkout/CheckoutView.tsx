"use client"
import { memo, useEffect, useRef, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import type { Appearance, StripeCheckoutLoadActionsSuccess, StripeCheckoutSession } from "@stripe/stripe-js"
import { supabase } from "@/lib/supabase"
import { apiFetch } from "@/lib/apiFetch"
import { PLUS_PRICE, type PlusPlan } from "@/lib/billing"
import { PlantIcon } from "@/app/components/PlantIcon"

const ACCENT = "#d97706"
const INK = "#1c1917"
const MUTED = "#8a847b"
const LINE = "#e8e0d2"
const PAPER = "#fffdf8"
const serif = '"Georgia", Georgia, serif'
const display = "var(--font-fraunces), Georgia, serif"
const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

const PERKS = ["ai cards from every session", "ai-graded answers", "unlimited imports (docs, notion…)", "unlimited writing ai"]

// Stripe's form, dressed in Pulp: warm paper, amber focus, soft corners.
const APPEARANCE: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: ACCENT,
    colorBackground: "#ffffff",
    colorText: INK,
    colorTextSecondary: MUTED,
    colorDanger: "#c2410c",
    borderRadius: "8px",
    fontSizeBase: "15px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: `1px solid ${LINE}`, boxShadow: "none" },
    ".Input:focus": { borderColor: ACCENT, boxShadow: "0 0 0 3px rgba(217,119,6,0.14)" },
    ".Tab": { border: `1px solid ${LINE}`, boxShadow: "none" },
    ".Tab--selected": { borderColor: ACCENT, boxShadow: "0 0 0 1px rgba(217,119,6,0.5)" },
    ".Label": { color: "#6b6560" },
  },
}

function readParams(): { plan: PlusPlan; fromSite: boolean } {
  const q = new URLSearchParams(window.location.search)
  const p = q.get("plan")
  return { plan: p === "plus_monthly" ? "plus_monthly" : "plus_yearly", fromSite: q.get("from") === "site" }
}

export const CheckoutView = memo(function CheckoutView() {
  const [plan, setPlan] = useState<PlusPlan | null>(null)
  const [fromSite, setFromSite] = useState(false)
  const [ready, setReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")
  const [session, setSession] = useState<StripeCheckoutSession | null>(null)
  const actionsRef = useRef<StripeCheckoutLoadActionsSuccess | null>(null)
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { plan, fromSite } = readParams()
    setPlan(plan); setFromSite(fromSite)
    let cancelled = false
    ;(async () => {
      try {
        const { data: { session: auth } } = await supabase.auth.getSession()
        if (!auth) { window.location.href = `/login?checkout=${plan}`; return }
        // No publishable key configured: fall back to Stripe's hosted page.
        const res = await apiFetch("/api/stripe/checkout", { method: "POST", body: JSON.stringify({ plan, from: fromSite ? "site" : undefined, ui: PK ? "elements" : undefined }) })
        if (res.status === 401) { window.location.href = `/login?checkout=${plan}`; return }
        const json = await res.json().catch(() => ({}))
        if (json.url) { window.location.href = json.url; return }
        if (!json.clientSecret || !PK) throw new Error(json.error || "no session")
        const stripe = await loadStripe(PK)
        if (!stripe || cancelled) return
        const checkout = stripe.initCheckoutElementsSdk({ clientSecret: json.clientSecret, elementsOptions: { appearance: APPEARANCE } })
        checkout.on("change", s => setSession(s))
        const loaded = await checkout.loadActions()
        if (loaded.type !== "success") throw new Error(loaded.error.message)
        if (cancelled) return
        actionsRef.current = loaded.actions
        setSession(loaded.actions.getSession())
        const el = checkout.createPaymentElement({ layout: { type: "tabs" } })
        el.on("ready", () => setReady(true))
        if (mountRef.current) el.mount(mountRef.current)
      } catch {
        if (!cancelled) setError("Couldn't open checkout. Refresh to try again.")
      }
    })()
    return () => { cancelled = true }
  }, [])

  const pay = async () => {
    const actions = actionsRef.current
    if (!actions || paying) return
    setPaying(true); setError("")
    const result = await actions.confirm()
    // Success redirects to the app; we only land here on an error.
    if (result.type === "error") { setError(result.error.message); setPaying(false) }
  }

  const yearly = plan === "plus_yearly"
  const fallbackTotal = yearly ? `$${PLUS_PRICE.yearly}` : `$${PLUS_PRICE.monthly}`
  const total = session?.total.total.amount?.replace(/\.00$/, "") ?? fallbackTotal
  const per = yearly ? "yr" : "mo"
  const backHref = fromSite ? "/#pricing" : "/app"
  const otherPlan: PlusPlan = yearly ? "plus_monthly" : "plus_yearly"

  return (
    <div style={{
      minHeight: "100dvh", background: "#f5efe4", color: INK, fontFamily: serif,
      backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(217,119,6,0.10), transparent 70%), repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(120,90,50,0.06) 31px, rgba(120,90,50,0.06) 32px)",
      display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 48px",
    }}>
      <div style={{ width: "100%", maxWidth: 880, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <a href={backHref} style={{ color: MUTED, fontSize: 14, textDecoration: "none" }}>← back</a>
        <span style={{ fontFamily: display, fontSize: 20, letterSpacing: "-0.01em" }}>pulp</span>
        <span style={{ width: 44 }} />
      </div>

      <div className="pulp-checkout-card" style={{
        width: "100%", maxWidth: 880, display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 6fr)",
        borderRadius: 16, overflow: "hidden", background: PAPER,
        boxShadow: "0 1px 2px rgba(60,40,10,0.06), 0 12px 40px -12px rgba(60,40,10,0.22)", border: `1px solid ${LINE}`,
      }}>
        {/* Summary */}
        <div style={{ position: "relative", padding: "36px 32px", color: "#fff", background: "linear-gradient(160deg, #e08a1a 0%, #d97706 45%, #b45309 100%)", overflow: "hidden", minHeight: 420 }}>
          <div style={{ fontSize: 13, opacity: 0.8, letterSpacing: "0.04em" }}>pulp plus</div>
          <div style={{ fontFamily: display, fontSize: 44, lineHeight: 1.1, margin: "10px 0 2px" }}>
            {total}<span style={{ fontSize: 18, opacity: 0.75 }}>/{per}</span>
          </div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>{yearly ? "$5/mo, billed yearly" : "billed monthly"} · cancel anytime</div>
          <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {PERKS.map(item => (
              <li key={item} style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 9, opacity: 0.95 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                {item}
              </li>
            ))}
          </ul>
          {plan && (
            <a href={`/checkout?plan=${otherPlan}${fromSite ? "&from=site" : ""}`} style={{ display: "inline-block", marginTop: 22, fontSize: 13, color: "#fff", opacity: 0.85, textDecoration: "underline", textUnderlineOffset: 3 }}>
              {yearly ? "switch to monthly" : "switch to yearly — save $24"}
            </a>
          )}
          <div aria-hidden style={{ position: "absolute", right: 22, bottom: 14, opacity: 0.95, pointerEvents: "none" }}>
            <PlantIcon type="tangerine" size={84} stage={4} />
          </div>
        </div>

        {/* Payment */}
        <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: display, fontSize: 22, marginBottom: 4 }}>Payment</div>
          <div style={{ fontSize: 14, color: MUTED, marginBottom: 22 }}>
            {session?.email ? <>for {session.email}</> : "Your card is charged today, then every " + (yearly ? "year" : "month") + "."}
          </div>

          <div style={{ position: "relative", minHeight: 230 }}>
            {!ready && !error && (
              <div aria-hidden style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {[44, 44, 44].map((h, i) => (
                  <div key={i} className="pulp-checkout-shimmer" style={{ height: h, borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff" }} />
                ))}
              </div>
            )}
            <div ref={mountRef} style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s" }} />
          </div>

          {error && <p role="alert" style={{ color: "#c2410c", fontSize: 14, margin: "14px 0 0" }}>{error}</p>}

          <button
            type="button"
            onClick={pay}
            disabled={!ready || paying || session?.canConfirm === false}
            style={{
              marginTop: 22, width: "100%", padding: "13px 20px", borderRadius: 999, border: "none",
              background: ACCENT, color: "#fff", fontFamily: display, fontSize: 16,
              cursor: !ready || paying ? "default" : "pointer", opacity: !ready || paying ? 0.6 : 1,
              boxShadow: "0 2px 0 #b45309, 0 6px 16px -6px rgba(217,119,6,0.6)", transition: "opacity 0.2s, transform 0.1s",
            }}
            onMouseDown={e => { e.currentTarget.style.transform = "translateY(1px)" }}
            onMouseUp={e => { e.currentTarget.style.transform = "" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "" }}
          >
            {paying ? "processing…" : `Start Plus · ${total}/${per}`}
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, fontSize: 12.5, color: MUTED }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            Secure payment by Stripe · Pulp never sees your card
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 12.5, color: MUTED }}>
            Cancel anytime in Settings. <a href="/terms" style={{ color: MUTED }}>Terms</a> · <a href="/privacy" style={{ color: MUTED }}>Privacy</a>
          </div>
        </div>
      </div>

      <style>{`
        .pulp-checkout-shimmer { background: linear-gradient(90deg, #fff 0%, #faf5ec 50%, #fff 100%) !important; background-size: 200% 100% !important; animation: pulpShimmer 1.4s ease-in-out infinite; }
        @keyframes pulpShimmer { from { background-position: 100% 0 } to { background-position: -100% 0 } }
        @media (max-width: 720px) { .pulp-checkout-card { grid-template-columns: 1fr !important; } .pulp-checkout-card > div:first-child { min-height: 0 !important; padding-bottom: 96px !important; } }
        @media (prefers-reduced-motion: reduce) { .pulp-checkout-shimmer { animation: none; } }
      `}</style>
    </div>
  )
})
