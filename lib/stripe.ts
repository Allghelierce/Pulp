import Stripe from 'stripe'

// Server-only Stripe client. Uses the SDK's pinned (latest) API version.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

// Plan keys → env price IDs. Create these prices in the Stripe Dashboard and
// fill the env vars. Lifetime is a one-time price; the rest are recurring.
export const PLAN_PRICES: Record<string, { env: string; mode: 'subscription' | 'payment' }> = {
  pro_monthly: { env: 'STRIPE_PRICE_PRO_MONTHLY', mode: 'subscription' },
  pro_yearly:  { env: 'STRIPE_PRICE_PRO_YEARLY',  mode: 'subscription' },
  lifetime:    { env: 'STRIPE_PRICE_LIFETIME',    mode: 'payment' },
}

export function priceForPlan(plan: string): { priceId: string; mode: 'subscription' | 'payment' } | null {
  const entry = PLAN_PRICES[plan]
  if (!entry) return null
  const priceId = process.env[entry.env]
  if (!priceId) return null
  return { priceId, mode: entry.mode }
}

export function siteOrigin(req: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  try { return new URL(req.url).origin } catch { return 'http://localhost:3000' }
}
