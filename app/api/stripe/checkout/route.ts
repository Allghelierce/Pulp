import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { hasPro } from "@/lib/aiQuota"
import { stripe, normalizePlan, priceIdForPlan, siteOrigin } from "@/lib/stripe"

// POST { plan: "plus_monthly" | "plus_yearly" } -> { url } of a Stripe Checkout page.
// Already on Plus -> { url } of the billing portal instead (no double subscriptions).
export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`checkout:${ip}`, { maxRequests: 10, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { plan?: unknown; from?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const plan = normalizePlan(String(body.plan ?? ''))
  const priceId = plan ? await priceIdForPlan(plan) : null
  if (!plan || !priceId) return NextResponse.json({ error: "Unknown or unconfigured plan" }, { status: 400 })

  // Reuse the saved Stripe customer or create one tied to this user.
  const { data: profile } = await supabaseAdmin
    .from('player_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id as string | null
  const origin = siteOrigin(req)

  if (customerId && await hasPro(user.id)) {
    const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/app` })
    return NextResponse.json({ url: portal.url, alreadyPlus: true })
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await supabaseAdmin.from('player_profiles')
      .update({ stripe_customer_id: customerId }).eq('user_id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    // Never set payment_method_types — let Stripe pick dynamically.
    subscription_data: { metadata: { user_id: user.id, plan } },
    metadata: { user_id: user.id, plan },
    integration_identifier: 'pulp_plus_checkout_qzmwkrtd',
    success_url: `${origin}/app?upgraded=1`,
    // Started from the website: a cancelled checkout returns to the site's pricing, not the app.
    cancel_url: body.from === 'site' ? `${origin}/?upgrade_cancelled=1#pricing` : `${origin}/app?upgrade_cancelled=1`,
  })

  return NextResponse.json({ url: session.url })
}
