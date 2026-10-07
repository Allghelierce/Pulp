"use client"
import { memo, useEffect, useState } from "react"
import { PLUS_PRICE, startCheckout, type PlusPlan } from "@/lib/billing"

const accent = "#d97706"
const font = "Crimson Pro, serif"

// Why the prompt opened (from a 402 limit code) -> one friendly line.
const REASONS: Record<string, string> = {
  ai_upgrade: "You've used your free AI requests.",
  import_limit: "You've used your free imports.",
  cards_limit: "Today's free AI cards are used up.",
  grade_upsell: "Free AI grading resets tomorrow.",
}

const PERKS = [
  ["AI cards from every session", "every focus session turns into recall cards"],
  ["AI-graded answers", "type your answer, get it checked and explained"],
  ["Unlimited imports", "bring in Docs, Word, Notion and Obsidian notes"],
  ["Unlimited writing AI", "the AI shortcut, chat and hub, no counting"],
] as const

export const UpgradeDialog = memo(function UpgradeDialog({ theme, reason, onClose }: {
  theme: "light" | "dark"
  reason?: string
  onClose: () => void
}) {
  const isDark = theme === "dark"
  const text = isDark ? "#fafafa" : "#18181b"
  const sub = isDark ? "#a1a1aa" : "#6b6864"
  const [busy, setBusy] = useState<PlusPlan | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const buy = (plan: PlusPlan) => { if (busy) return; setBusy(plan); startCheckout(plan) }
  const line = (reason && REASONS[reason]) || "Notes that quiz you, powered by AI."

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10050, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label="Upgrade to Plus"
        style={{ width: "100%", maxWidth: 420, borderRadius: 16, padding: "24px 24px 20px", fontFamily: font,
          background: isDark ? "#18181b" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          boxShadow: "0 24px 60px -12px rgba(0,0,0,0.45)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: text }}>Pulp <span style={{ color: accent }}>Plus</span></h2>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: sub, fontSize: 22, lineHeight: 1 }}>&times;</button>
        </div>
        <p style={{ margin: "6px 0 16px", fontSize: 15, color: sub }}>{line} Plus makes the AI side of Pulp unlimited.</p>

        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", display: "flex", flexDirection: "column", gap: 9 }}>
          {PERKS.map(([title, desc]) => (
            <li key={title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: accent, fontSize: 14, lineHeight: "20px" }}>✓</span>
              <span style={{ fontSize: 14.5, color: text, lineHeight: 1.35 }}>{title}<span style={{ display: "block", fontSize: 12.5, color: sub }}>{desc}</span></span>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => buy("plus_yearly")} disabled={!!busy}
            style={{ flex: "1 1 160px", padding: "11px 12px", borderRadius: 10, border: "none", cursor: busy ? "default" : "pointer", background: accent, color: "#fff", fontFamily: font, fontSize: 15, opacity: busy && busy !== "plus_yearly" ? 0.5 : 1 }}>
            {busy === "plus_yearly" ? "Opening checkout…" : <>${PLUS_PRICE.yearly} / year <span style={{ opacity: 0.8, fontSize: 12.5 }}>· ${(PLUS_PRICE.yearly / 12).toFixed(0)}/mo</span></>}
          </button>
          <button onClick={() => buy("plus_monthly")} disabled={!!busy}
            style={{ flex: "1 1 120px", padding: "11px 12px", borderRadius: 10, cursor: busy ? "default" : "pointer", background: "transparent", color: text, border: `1px solid ${isDark ? "#3f3f46" : "#e4e4e7"}`, fontFamily: font, fontSize: 15, opacity: busy && busy !== "plus_monthly" ? 0.5 : 1 }}>
            {busy === "plus_monthly" ? "Opening checkout…" : `$${PLUS_PRICE.monthly} / month`}
          </button>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: sub, textAlign: "center" }}>Timer, trees, grove and recall practice stay free. Cancel anytime.</p>
      </div>
    </div>
  )
})
