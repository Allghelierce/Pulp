import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { stripe } from "@/lib/stripe"

export const runtime = 'nodejs'

// Grant/revoke Pro based on Stripe events. The Checkout customer carries our
// user_id in metadata; we map back to player_profiles via stripe_customer_id.
async function setPro(opts: { customerId?: string | null; userId?: string | null; active: boolean; expiresAt: string | null }) {
  const update = { pro_access: opts.active, pro_expires_at: opts.expiresAt }
  if (opts.userId) {
    await supabaseAdmin.from('player_profiles').update(update).eq('user_id', opts.userId)
  } else if (opts.customerId) {
    await supabaseAdmin.from('player_profiles').update(update).eq('stripe_customer_id', opts.customerId)
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const sig = req.headers.get('stripe-signature')
  const raw = await req.text()
  let event
  try {
    event = stripe.webhooks.constructEvent(raw, sig || '', secret)
  } catch (err: any) {
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as any
        const userId = s.metadata?.user_id || s.client_reference_id
        if (s.mode === 'payment') {
          // One-time lifetime — permanent Pro.
          await setPro({ customerId: s.customer, userId, active: true, expiresAt: null })
        } else {
          // Subscription — expiry set by the subscription.* events below; grant now too.
          await setPro({ customerId: s.customer, userId, active: true, expiresAt: null })
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const active = sub.status === 'active' || sub.status === 'trialing'
        const expiresAt = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
        await setPro({ customerId: sub.customer, userId: sub.metadata?.user_id, active, expiresAt })
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        await setPro({ customerId: sub.customer, userId: sub.metadata?.user_id, active: false, expiresAt: null })
        break
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Handler error: ${err.message}` }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
