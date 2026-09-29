import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { stripe, priceForPlan, siteOrigin } from "@/lib/stripe"

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

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const plan = priceForPlan(String(body.plan ?? ''))
  if (!plan) return NextResponse.json({ error: "Unknown or unconfigured plan" }, { status: 400 })

  // Reuse the saved Stripe customer or create one tied to this user.
  const { data: profile } = await supabaseAdmin
    .from('player_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await supabaseAdmin.from('player_profiles')
      .update({ stripe_customer_id: customerId }).eq('user_id', user.id)
  }

  const origin = siteOrigin(req)
  const session = await stripe.checkout.sessions.create({
    mode: plan.mode,
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    // Never set payment_method_types — let Stripe pick dynamically.
    ...(plan.mode === 'subscription'
      ? { subscription_data: { metadata: { user_id: user.id, plan: String(body.plan) } } }
      : { payment_intent_data: { metadata: { user_id: user.id, plan: String(body.plan) } } }),
    metadata: { user_id: user.id, plan: String(body.plan) },
    success_url: `${origin}/app?upgraded=1`,
    cancel_url: `${origin}/app?upgrade_cancelled=1`,
  })

  return NextResponse.json({ url: session.url })
}
