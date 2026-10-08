// Client helpers for Plus: plan status, checkout, billing portal, and the
// "upgrade" event any limit-hit (HTTP 402) raises through apiFetch.
import { apiFetch } from "./apiFetch"

export const PLUS_PRICE = { monthly: 7, yearly: 60 } // keep in sync with Stripe (lookup keys pulp_plus_*)
export const UPGRADE_EVENT = "pulp-upgrade"
export type PlusPlan = "plus_monthly" | "plus_yearly"

export interface PlanStatus {
  plus: boolean
  plusUntil: string | null
  free: { writingAiLeft: number | null; importsLeft: number | null; cardSessionsLeftToday: number | null; gradesLeftToday: number | null } | null
  limits: { writingAi: number; imports: number; cardSessionsPerDay: number; gradesPerDay: number }
}

export async function fetchPlan(): Promise<PlanStatus | null> {
  try {
    const res = await apiFetch("/api/plan")
    return res.ok ? await res.json() : null
  } catch { return null }
}

// Send the user to Pulp's checkout page (it hands off to the billing portal if
// they're already on Plus, or to Stripe's hosted page if Elements isn't set up).
export async function startCheckout(plan: PlusPlan): Promise<void> {
  window.location.href = `/checkout?plan=${plan}`
}

export async function openBillingPortal(): Promise<string | null> {
  try {
    const res = await apiFetch("/api/stripe/portal", { method: "POST" })
    const json = await res.json()
    if (json.url) { window.location.href = json.url; return null }
    return json.error || "No subscription found."
  } catch { return "Couldn't open billing." }
}

export interface UpgradeDetail { code: string; message?: string }
export function requestUpgrade(detail: UpgradeDetail) {
  try { window.dispatchEvent(new CustomEvent<UpgradeDetail>(UPGRADE_EVENT, { detail })) } catch {}
}
