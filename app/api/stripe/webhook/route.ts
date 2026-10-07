import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase-server"
import { stripe } from "@/lib/stripe"

export const runtime = 'nodejs'

// Statuses that keep Plus on. past_due = Stripe is still retrying the card.
const PLUS_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing', 'past_due'])

// Grant/revoke Plus. The Checkout session and subscription carry our user_id in
// metadata; otherwise we map back to player_profiles via stripe_customer_id.
async function setPlus(opts: { customerId?: string | null; userId?: string | null; active: boolean; expiresAt: string | null }) {
  const update = { pro_access: opts.active, pro_expires_at: opts.expiresAt }
  const q = supabaseAdmin.from('player_profiles').update(update)
  const { error } = opts.userId ? await q.eq('user_id', opts.userId)
    : opts.customerId ? await q.eq('stripe_customer_id', opts.customerId)
    : { error: null }
  if (error) throw new Error(`profile update failed: ${error.message}`)
}

const idOf = (x: string | { id: string } | null | undefined) => (typeof x === 'string' ? x : x?.id) ?? null

// Sync from the CURRENT subscription (re-fetched, so out-of-order events can't
// leave stale state). On recent API versions the period end lives on the items.
async function syncSubscription(subscriptionId: string, fallbackUserId?: string | null) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const ends = sub.items.data.map(i => i.current_period_end).filter((n): n is number => typeof n === 'number')
  const expiresAt = ends.length ? new Date(Math.max(...ends) * 1000).toISOString() : null
  await setPlus({
    customerId: idOf(sub.customer),
    userId: sub.metadata?.user_id || fallbackUserId,
    active: PLUS_STATUSES.has(sub.status),
    expiresAt,
  })
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature')
  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig || '', secret)
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      // Fulfil only once the money is in: card payments arrive paid on
      // completed; delayed methods (bank debits) arrive on async_payment_succeeded.
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const s = event.data.object
        if (s.payment_status !== 'paid' && s.payment_status !== 'no_payment_required') break
        const userId = s.metadata?.user_id || s.client_reference_id
        const subId = idOf(s.subscription)
        if (s.mode === 'subscription' && subId) await syncSubscription(subId, userId)
        else if (s.mode === 'payment') await setPlus({ customerId: idOf(s.customer), userId, active: true, expiresAt: null }) // legacy lifetime
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(event.data.object.id)
        break
      }
    }
  } catch (err) {
    // 500 -> Stripe retries the event later.
    return NextResponse.json({ error: `Handler error: ${(err as Error).message}` }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
