import Stripe from 'stripe'

// Server-only Stripe client. Uses the SDK's pinned (latest) API version.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

// One paid plan: Plus, monthly or yearly. Prices are found by lookup key, so
// changing a price in Stripe (with transfer_lookup_key) needs no env change.
// STRIPE_PRICE_PLUS_MONTHLY / _YEARLY override the lookup if set.
export type PlanKey = 'plus_monthly' | 'plus_yearly'
const PLANS: Record<PlanKey, { lookupKey: string; env: string }> = {
  plus_monthly: { lookupKey: 'pulp_plus_monthly', env: 'STRIPE_PRICE_PLUS_MONTHLY' },
  plus_yearly:  { lookupKey: 'pulp_plus_yearly',  env: 'STRIPE_PRICE_PLUS_YEARLY' },
}
// Older links and saved pending checkouts still say pro_*.
const ALIASES: Record<string, PlanKey> = {
  plus_monthly: 'plus_monthly', plus_yearly: 'plus_yearly',
  pro_monthly: 'plus_monthly', pro_yearly: 'plus_yearly',
}

export function normalizePlan(raw: string): PlanKey | null {
  return ALIASES[raw] ?? null
}

const priceCache = new Map<PlanKey, { id: string; at: number }>()
const PRICE_TTL = 10 * 60_000

export async function priceIdForPlan(plan: PlanKey): Promise<string | null> {
  const override = process.env[PLANS[plan].env]
  if (override) return override
  const hit = priceCache.get(plan)
  if (hit && Date.now() - hit.at < PRICE_TTL) return hit.id
  const { data } = await stripe.prices.list({ lookup_keys: [PLANS[plan].lookupKey], active: true, limit: 1 })
  const id = data[0]?.id ?? null
  if (id) priceCache.set(plan, { id, at: Date.now() })
  return id
}

export function siteOrigin(req: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  try { return new URL(req.url).origin } catch { return 'http://localhost:3000' }
}
