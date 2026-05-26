# Stripe Pro Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stripe-powered Pro subscription ($5/mo, $48/yr) with Checkout, webhooks, Customer Portal, and gold logo rind for Pro users.

**Architecture:** Three new API routes handle checkout session creation, billing portal, and webhook processing. Webhooks are the source of truth for subscription state, updating `pro_access`/`pro_expires_at` on Supabase `player_profiles`. Frontend replaces the stub payment modal with real Stripe Checkout redirects and adds a gold rind to the logo SVG for Pro users.

**Tech Stack:** Stripe Node SDK, Next.js App Router API routes, Supabase (existing), Framer Motion (existing)

---

## File Structure

### New Files
- `app/api/stripe/checkout/route.ts` — creates Stripe Checkout Sessions
- `app/api/stripe/portal/route.ts` — creates Stripe Customer Portal Sessions
- `app/api/stripe/webhook/route.ts` — handles Stripe webhook events
- `lib/stripe.ts` — Stripe client singleton + price ID config
- `app/checkout/success/page.tsx` — animated Pro welcome page
- `app/checkout/cancel/page.tsx` — checkout cancellation redirect
- `supabase/migrations/20260526_stripe_columns.sql` — adds stripe columns to player_profiles

### Modified Files
- `package.json` — add `stripe` dependency
- `lib/db.ts` — add Stripe-related profile helpers
- `app/components/settings/SettingsView.tsx` — single Pro tier, real checkout, manage subscription, gold rind
- `components/blocks/pricing-section.tsx` — add `onSelect` callback support for plan buttons

### Deleted Files
- `components/ui/minimal-payment-modal.tsx`

---

### Task 1: Install Stripe SDK and Create Stripe Client

**Goal:** Add the `stripe` npm package and create a server-side Stripe client singleton with price ID configuration.

**Files:**
- Modify: `package.json`
- Create: `lib/stripe.ts`

**Acceptance Criteria:**
- [ ] `stripe` package is in dependencies
- [ ] `lib/stripe.ts` exports a configured Stripe instance and price ID lookup
- [ ] Build succeeds with new dependency

**Verify:** `npm run build` → exits 0

**Steps:**

- [ ] **Step 1: Install stripe**

```bash
npm install stripe
```

- [ ] **Step 2: Create lib/stripe.ts**

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  yearly: process.env.STRIPE_PRICE_YEARLY!,
} as const

export type PlanInterval = keyof typeof PRICE_IDS
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json lib/stripe.ts
git commit -m "feat: add stripe sdk and client singleton"
```

---

### Task 2: Database Migration and Profile Helpers

**Goal:** Add `stripe_customer_id` and `stripe_subscription_id` columns to `player_profiles` and create helper functions in `lib/db.ts`.

**Files:**
- Create: `supabase/migrations/20260526_stripe_columns.sql`
- Modify: `lib/db.ts:6-19` (PlayerProfile interface) and add new functions at end of file

**Acceptance Criteria:**
- [ ] Migration SQL adds two nullable text columns
- [ ] `PlayerProfile` interface includes `stripe_customer_id` and `stripe_subscription_id`
- [ ] Helper functions exist for getting/setting Stripe IDs and Pro status
- [ ] Build succeeds

**Verify:** `npm run build` → exits 0

**Steps:**

- [ ] **Step 1: Create migration file**

```sql
-- Add Stripe integration columns to player_profiles
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
```

- [ ] **Step 2: Update PlayerProfile interface in lib/db.ts**

Add after line 18 (`unlocked_plots: Record<string, number[]>`):

```typescript
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
```

- [ ] **Step 3: Add Stripe helper functions to lib/db.ts**

Append to end of file:

```typescript
// ─── Stripe ───

export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const { data } = await supabase.from('player_profiles').select('stripe_customer_id').eq('user_id', userId).single()
  return data?.stripe_customer_id || null
}

export async function setStripeCustomerId(userId: string, customerId: string) {
  return supabase.from('player_profiles').update({ stripe_customer_id: customerId }).eq('user_id', userId)
}

export async function setSubscriptionActive(userId: string, subscriptionId: string, expiresAt: string) {
  return supabase.from('player_profiles').update({
    pro_access: true,
    pro_expires_at: expiresAt,
    stripe_subscription_id: subscriptionId,
  }).eq('user_id', userId)
}

export async function setSubscriptionInactive(userId: string) {
  return supabase.from('player_profiles').update({
    pro_access: false,
    pro_expires_at: null,
    stripe_subscription_id: null,
  }).eq('user_id', userId)
}

export async function getProfileByStripeCustomerId(customerId: string) {
  const { data } = await supabase.from('player_profiles').select('user_id, stripe_subscription_id, pro_access').eq('stripe_customer_id', customerId).single()
  return data
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260526_stripe_columns.sql lib/db.ts
git commit -m "feat: add stripe columns and profile helpers"
```

---

### Task 3: Checkout API Route

**Goal:** Create POST `/api/stripe/checkout` that creates a Stripe Checkout Session and returns the URL.

**Files:**
- Create: `app/api/stripe/checkout/route.ts`

**Acceptance Criteria:**
- [ ] Authenticates via `getAuthUser()`
- [ ] Accepts `{ plan: 'monthly' | 'yearly' }` body
- [ ] Creates or retrieves Stripe Customer (saves ID if new)
- [ ] Creates Checkout Session with correct price, success/cancel URLs, userId metadata
- [ ] Returns `{ url: string }`

**Verify:** `npm run build` → exits 0

**Steps:**

- [ ] **Step 1: Create the route**

```typescript
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { stripe, PRICE_IDS, type PlanInterval } from "@/lib/stripe"

export async function POST(req: Request) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { plan?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const plan = body.plan as PlanInterval
  if (!plan || !PRICE_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  const { data: profile } = await supabaseAdmin
    .from('player_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await supabaseAdmin
      .from('player_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id)
  }

  const origin = req.headers.get('origin') || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${origin}/checkout/success`,
    cancel_url: `${origin}/checkout/cancel`,
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stripe/checkout/route.ts
git commit -m "feat: add stripe checkout session route"
```

---

### Task 4: Webhook API Route

**Goal:** Create POST `/api/stripe/webhook` that processes Stripe events and updates Pro status.

**Files:**
- Create: `app/api/stripe/webhook/route.ts`

**Acceptance Criteria:**
- [ ] Verifies webhook signature with `stripe.webhooks.constructEvent()`
- [ ] Handles `checkout.session.completed` → activates Pro
- [ ] Handles `customer.subscription.updated` → updates expiry
- [ ] Handles `customer.subscription.deleted` → deactivates Pro
- [ ] Returns 200 for all handled events

**Verify:** `npm run build` → exits 0

**Steps:**

- [ ] **Step 1: Create the route**

```typescript
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase-server"
import type Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription' || !session.subscription) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const customerId = session.customer as string

      const { data: profile } = await supabaseAdmin
        .from('player_profiles')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile) {
        await supabaseAdmin.from('player_profiles').update({
          pro_access: true,
          pro_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_subscription_id: subscription.id,
        }).eq('user_id', profile.user_id)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: profile } = await supabaseAdmin
        .from('player_profiles')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile) {
        const active = subscription.status === 'active' || subscription.status === 'trialing'
        await supabaseAdmin.from('player_profiles').update({
          pro_access: active,
          pro_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq('user_id', profile.user_id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: profile } = await supabaseAdmin
        .from('player_profiles')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile) {
        await supabaseAdmin.from('player_profiles').update({
          pro_access: false,
          pro_expires_at: null,
          stripe_subscription_id: null,
        }).eq('user_id', profile.user_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat: add stripe webhook handler"
```

---

### Task 5: Customer Portal API Route

**Goal:** Create POST `/api/stripe/portal` that creates a Stripe Billing Portal session.

**Files:**
- Create: `app/api/stripe/portal/route.ts`

**Acceptance Criteria:**
- [ ] Authenticates via `getAuthUser()`
- [ ] Looks up `stripe_customer_id` from profile
- [ ] Creates portal session with return URL
- [ ] Returns `{ url: string }`

**Verify:** `npm run build` → exits 0

**Steps:**

- [ ] **Step 1: Create the route**

```typescript
import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('player_profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 })
  }

  const origin = req.headers.get('origin') || 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/app`,
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/stripe/portal/route.ts
git commit -m "feat: add stripe customer portal route"
```

---

### Task 6: Checkout Success and Cancel Pages

**Goal:** Create the success page with gold rind animation and a simple cancel page.

**Files:**
- Create: `app/checkout/success/page.tsx`
- Create: `app/checkout/cancel/page.tsx`

**Acceptance Criteria:**
- [ ] Success page shows Pulp orange logo with rind animating from `#92400e` to `#FFD700`
- [ ] "Welcome to Pro" text fades up
- [ ] Auto-redirects to `/app` after 3 seconds
- [ ] Cancel page has "No worries" message and link back to settings
- [ ] Both pages render without errors

**Verify:** `npm run build` → exits 0

**Steps:**

- [ ] **Step 1: Create success page**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function CheckoutSuccess() {
  const router = useRouter()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 300)
    const t2 = setTimeout(() => router.push('/app'), 3500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090b',
      fontFamily: "'EB Garamond', serif",
    }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        {/* Shimmer burst */}
        <div style={{
          position: 'absolute',
          inset: -20,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
          opacity: show ? 1 : 0,
          transform: show ? 'scale(1.2)' : 'scale(0.8)',
          transition: 'all 0.8s ease-out',
        }} />
        {/* Orange with animated rind */}
        <svg width="120" height="120" viewBox="15 15 90 90" style={{ position: 'relative', zIndex: 1 }}>
          <circle cx="60" cy="60" r="42" fill="#d97706" />
          <circle
            cx="60" cy="60" r="42"
            fill="none"
            stroke={show ? "#FFD700" : "#92400e"}
            strokeWidth="6"
            style={{
              transition: 'stroke 1.2s ease-in-out',
              filter: show ? 'drop-shadow(0 0 8px rgba(255,215,0,0.5))' : 'none',
            }}
          />
          <line x1="60" y1="18" x2="60" y2="102" stroke="#92400e" strokeWidth="2.5" opacity="0.5" />
          <line x1="40" y1="22" x2="80" y2="98" stroke="#92400e" strokeWidth="2.5" opacity="0.5" />
          <line x1="80" y1="22" x2="40" y2="98" stroke="#92400e" strokeWidth="2.5" opacity="0.5" />
          <circle cx="60" cy="60" r="5" fill="#92400e" />
        </svg>
      </div>

      <p style={{
        marginTop: 32,
        fontSize: 28,
        color: '#FFD700',
        letterSpacing: '0.15em',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.6s ease-out 0.5s',
      }}>
        Welcome to Pro
      </p>

      <p style={{
        marginTop: 8,
        fontSize: 14,
        color: '#71717a',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.6s ease-out 1s',
      }}>
        Redirecting...
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create cancel page**

```tsx
"use client"

import Link from "next/link"

export default function CheckoutCancel() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090b',
      fontFamily: "'EB Garamond', serif",
    }}>
      <p style={{ fontSize: 24, color: '#d4d4d8', marginBottom: 12 }}>
        No worries
      </p>
      <p style={{ fontSize: 14, color: '#71717a', marginBottom: 24 }}>
        You can upgrade anytime from Settings.
      </p>
      <Link
        href="/app"
        style={{
          fontSize: 13,
          color: '#d97706',
          textDecoration: 'underline',
          textUnderlineOffset: 4,
        }}
      >
        Back to Pulp
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/checkout/success/page.tsx app/checkout/cancel/page.tsx
git commit -m "feat: add checkout success and cancel pages"
```

---

### Task 7: Update SettingsView — Single Pro Tier with Stripe Checkout

**Goal:** Replace two-tier pricing with single Pro tier, wire up real Stripe Checkout, add manage subscription button, fix `isPremium` check, show gold rind for Pro users, and delete MinimalPaymentModal.

**Files:**
- Modify: `app/components/settings/SettingsView.tsx:271` (isPremium check), `:1194-1236` (PricingSection)
- Delete: `components/ui/minimal-payment-modal.tsx`

**Acceptance Criteria:**
- [ ] Single "Pro" tier at $5/mo, $48/yr
- [ ] Clicking upgrade POSTs to `/api/stripe/checkout` and redirects
- [ ] Active Pro users see "Manage Subscription" button
- [ ] `isPremium` reads `pro_access` from player profile, not email check
- [ ] `MinimalPaymentModal` import and file removed
- [ ] Gold rind on logo SVG where it appears in settings for Pro users

**Verify:** `npm run build` → exits 0

**Steps:**

- [ ] **Step 1: Update isPremium check**

In `SettingsView.tsx`, replace line 271:
```typescript
const isPremium = user?.email?.includes("pro") || false
```
with:
```typescript
const isPremium = proAccess ?? false
```

Add `proAccess` to the component props (the prop will be a `boolean | undefined` passed from the parent based on player profile's `pro_access` field).

- [ ] **Step 2: Add checkout handler function inside SettingsView**

```typescript
const handleCheckout = async (plan: 'monthly' | 'yearly') => {
  const token = (await supabase.auth.getSession()).data.session?.access_token
  if (!token) return
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan }),
  })
  const { url } = await res.json()
  if (url) window.location.href = url
}

const handleManageSubscription = async () => {
  const token = (await supabase.auth.getSession()).data.session?.access_token
  if (!token) return
  const res = await fetch('/api/stripe/portal', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const { url } = await res.json()
  if (url) window.location.href = url
}
```

- [ ] **Step 3: Replace PricingSection with single tier**

Replace lines 1194-1236 with:

```tsx
{isPremium ? (
  <div className="text-center space-y-3">
    <p className="text-[14px]" style={{ fontFamily: 'Crimson Pro, serif', color: '#FFD700' }}>
      You're on Pro
    </p>
    <button
      onClick={handleManageSubscription}
      className={`text-[11px] px-4 py-2 rounded-lg border transition-colors ${
        isDark ? 'border-zinc-700 text-zinc-400 hover:text-zinc-200' : 'border-zinc-300 text-zinc-500 hover:text-zinc-700'
      }`}
      style={{ fontFamily: 'Crimson Pro, serif' }}
    >
      Manage Subscription
    </button>
  </div>
) : (
  <PricingSection
    className="relative z-10"
    isDark={isDark}
    accentColor="#d97706"
    tiers={[
      {
        name: "Pro",
        price: { monthly: 5, yearly: 48 },
        description: "The full Pulp experience",
        buttonLabel: "Upgrade to Pro",
        highlight: true,
        icon: <Sparkles className="w-5 h-5" style={{ color: '#d97706' }} />,
        onSelect: () => {},
        features: [
          { name: "Cloud Sync", description: "Access notes from any device", included: true },
          { name: "Unlimited AI", description: "Summaries, quizzes, and rewrites", included: true },
          { name: "Season Pass", description: "Exclusive seasonal seeds, cosmetics, and challenges", included: true },
          { name: "Rare Seed Drops", description: "Bonus rare & sacred seeds every month", included: true },
          { name: "Pro Cosmetics", description: "Exclusive colors, fonts, and paper styles", included: true },
        ],
      },
    ]}
  />
)}
```

- [ ] **Step 4: Wire PricingSection onSelect to Stripe checkout**

In `components/blocks/pricing-section.tsx`, update the button click to call `onSelect` when present. Find the existing button/CTA render and ensure that when `ctaOverride` is not present and `onSelect` is defined, the button calls `onSelect()` on click.

The `PricingSection` needs to pass the current billing period (monthly/yearly) to the `onSelect` callback. Update `PricingTier` interface to accept `onSelectPlan?: (plan: 'monthly' | 'yearly') => void` and wire it to the button. In `SettingsView`, pass:

```typescript
onSelectPlan: handleCheckout,
```

- [ ] **Step 5: Remove MinimalPaymentModal import and delete file**

Remove the import line from `SettingsView.tsx`:
```typescript
import MinimalPaymentModal from "@/components/ui/minimal-payment-modal"
```

Delete the file:
```bash
rm components/ui/minimal-payment-modal.tsx
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: single Pro tier with stripe checkout, remove payment modal"
```

---

### Task 8: Gold Logo Rind for Pro Users

**Goal:** Wherever the Pulp orange logo SVG is rendered, Pro users see a gold (`#FFD700`) rind instead of the default brown (`#92400e`), with a subtle shimmer on hover.

**Files:**
- Modify: files that render the SVG logo inline (search for `pulp_logo.svg` usage or inline SVG with `#92400e`)

**Acceptance Criteria:**
- [ ] Pro users see gold rind on the logo everywhere it appears
- [ ] Hover shows subtle shimmer (CSS animation)
- [ ] Non-Pro users see the normal brown rind
- [ ] No layout shift or visual regression

**Verify:** `npm run build` → exits 0, then visually check logo in browser

**Steps:**

- [ ] **Step 1: Find all logo render locations**

```bash
grep -rn "pulp_logo\|92400e.*circle\|viewBox.*15 15 90 90" app/ components/ --include="*.tsx"
```

- [ ] **Step 2: For each location, conditionally apply gold stroke**

Where the logo SVG is inline, change the stroke from hardcoded `#92400e` to a prop/variable:

```tsx
const rindColor = isPro ? '#FFD700' : '#92400e'
const rindFilter = isPro ? 'drop-shadow(0 0 4px rgba(255,215,0,0.3))' : 'none'
```

Apply to the outer `<circle>` stroke and add a CSS shimmer keyframe:

```css
@keyframes gold-shimmer {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(255,215,0,0.3)); }
  50% { filter: drop-shadow(0 0 8px rgba(255,215,0,0.5)); }
}
```

For `<img>` tags referencing `pulp_logo.svg`, either convert to inline SVG or wrap with a gold ring via CSS `box-shadow`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: gold logo rind for pro users"
```

---

### Task 9: Wire Pro Status Through the App

**Goal:** Pass `pro_access` from the player profile through the component tree so all Pro gates work.

**Files:**
- Modify: `app/app/page.tsx` — read `pro_access` from profile and pass as prop
- Modify: `app/components/settings/SettingsView.tsx` — accept `proAccess` prop

**Acceptance Criteria:**
- [ ] `proAccess` prop flows from profile data to SettingsView
- [ ] Pro cosmetics in SettingsView respect actual `pro_access` status
- [ ] Build succeeds

**Verify:** `npm run build` → exits 0

**Steps:**

- [ ] **Step 1: Find where player profile is loaded in app/page.tsx**

```bash
grep -n "player_profile\|getPlayerProfile\|pro_access\|proAccess" app/app/page.tsx
```

- [ ] **Step 2: Extract pro_access and pass to SettingsView**

Wherever `<SettingsView>` is rendered, add the `proAccess` prop from the profile data. The exact approach depends on how the profile is currently loaded (likely from a Supabase query or synced state).

```tsx
<SettingsView proAccess={playerProfile?.pro_access} /* ...other props */ />
```

- [ ] **Step 3: Update SettingsView prop types to include proAccess**

Add to the component's props interface:

```typescript
proAccess?: boolean
```

- [ ] **Step 4: Commit**

```bash
git add app/app/page.tsx app/components/settings/SettingsView.tsx
git commit -m "feat: wire pro_access through component tree"
```

---

### Task 10: Environment Variables Setup

**Goal:** Document required environment variables and create `.env.local.example`.

**Files:**
- Create: `.env.local.example` (or update existing)

**Acceptance Criteria:**
- [ ] All 5 Stripe env vars documented with placeholder values
- [ ] Comments explain where to find each value

**Verify:** File exists and contains all required keys

**Steps:**

- [ ] **Step 1: Create .env.local.example**

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...          # Stripe Dashboard > API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Stripe Dashboard > API keys
STRIPE_WEBHOOK_SECRET=whsec_...        # Stripe Dashboard > Webhooks > Signing secret
STRIPE_PRICE_MONTHLY=price_...         # Stripe Dashboard > Products > Pro > Monthly price ID
STRIPE_PRICE_YEARLY=price_...          # Stripe Dashboard > Products > Pro > Yearly price ID
```

- [ ] **Step 2: Commit**

```bash
git add .env.local.example
git commit -m "docs: add stripe env var example"
```
