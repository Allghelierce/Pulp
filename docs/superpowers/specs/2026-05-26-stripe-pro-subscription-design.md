# Stripe Pro Subscription Integration

## Overview

Integrate Stripe for a single Pro subscription tier ($5/mo, $48/yr) using Stripe Checkout for purchase and Stripe Customer Portal for billing management. Gems remain in-game currency only.

## What Pro Unlocks

- Season pass (exclusive seasonal seeds, cosmetics, challenges)
- Rare seed drops every month
- Unlimited AI (summaries, quizzes, rewrites)
- Pro-only cosmetics: Green/Slate accent colors, Bodoni heading font, Steno/Dark Steno paper styles
- Gold logo rind (replaces orange)

## Data Model

### Supabase `player_profiles` Changes

Add two columns:

- `stripe_customer_id` — nullable text, created on first checkout
- `stripe_subscription_id` — nullable text, set by webhook

Existing columns used as-is:

- `pro_access` (boolean) — webhook sets true/false
- `pro_expires_at` (timestamp) — webhook sets from subscription period end

### Stripe Dashboard Configuration

- One Product: "Pulp Pro"
- Two Prices: $5/month recurring, $48/year recurring

### Environment Variables

- `STRIPE_SECRET_KEY` — server-side API calls
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — client-side (future Elements use)
- `STRIPE_WEBHOOK_SECRET` — verify webhook signatures
- `STRIPE_PRICE_MONTHLY` — Price ID for $5/month plan (e.g. `price_xxx`)
- `STRIPE_PRICE_YEARLY` — Price ID for $48/year plan (e.g. `price_xxx`)

## API Routes

### POST `/api/stripe/checkout`

- **Auth:** Bearer token via `getAuthUser()`
- **Body:** `{ plan: 'monthly' | 'yearly' }`
- **Logic:**
  1. Get or create Stripe Customer (lookup `stripe_customer_id` from profile; if null, create customer with user email, save ID back)
  2. Create Checkout Session with correct Price ID, `customer`, `success_url` (`/checkout/success`), `cancel_url` (`/checkout/cancel`), `metadata: { userId }`
  3. Return `{ url: session.url }`
- **Client:** `window.location.href = url`

### POST `/api/stripe/portal`

- **Auth:** Bearer token via `getAuthUser()`
- **Logic:**
  1. Lookup `stripe_customer_id` from profile (error if none)
  2. Create Billing Portal Session with `return_url` (settings page)
  3. Return `{ url: session.url }`

### POST `/api/stripe/webhook`

- **Auth:** Stripe signature verification via `stripe.webhooks.constructEvent()`
- **Events handled:**
  - `checkout.session.completed` — set `pro_access = true`, `pro_expires_at` from subscription period end, save `stripe_subscription_id`
  - `customer.subscription.updated` — update `pro_expires_at`, handle plan changes (monthly <-> yearly)
  - `customer.subscription.deleted` — set `pro_access = false`, clear `pro_expires_at` and `stripe_subscription_id`
  - `invoice.payment_failed` — optional: flag for grace period handling
- **Idempotency:** Check `stripe_subscription_id` before updating to avoid double-processing

## Frontend Changes

### SettingsView.tsx — Pricing Section

- Merge two tiers (Creator + Pro) into single "Pro" tier at $5/mo, $48/yr
- Replace `MinimalPaymentModal` wrappers with checkout calls — buttons POST to `/api/stripe/checkout` with plan type, redirect to returned URL
- Add "Manage Subscription" button for active Pro users — hits `/api/stripe/portal`
- Show subscription status badge (active, canceling, expired)

### Pro Status Check

- Replace hardcoded `isPremium = user?.email?.includes("pro")` with actual `pro_access` boolean from player profile
- Pass `isPro` prop down to components gating Pro cosmetics/features

### MinimalPaymentModal

- Delete entirely. Stripe Checkout replaces it.

### Success Page (`/app/checkout/success/page.tsx`)

- Orange Pulp logo appears center screen
- Rind animates from orange (#d97706) to gold (#FFD700) with a sweep/shimmer
- Brief golden shimmer pulse effect
- "Welcome to Pro" text fades up beneath
- Auto-redirects to main app after ~3 seconds

### Cancel Page (`/app/checkout/cancel/page.tsx`)

- Simple "No worries" message
- Button to return to settings

### Gold Logo Rind (Persistent Pro Indicator)

- Wherever the Pulp orange logo appears, Pro users see the rind in gold (#FFD700) instead of orange (#d97706)
- Subtle shimmer animation on hover (CSS gradient rotation)

## Security & Edge Cases

- **Webhook signature verification** — every webhook validated with `stripe.webhooks.constructEvent()` before any processing
- **Idempotent webhooks** — check existing `stripe_subscription_id` before updating to prevent double-processing
- **Server-side Pro gating** — protected API routes (AI endpoints) check `pro_access` server-side; client only hides/shows UI
- **Subscription lapse** — `customer.subscription.deleted` flips `pro_access = false`. User keeps planted Pro trees but loses feature access
- **Webhook race condition** — if user refreshes before webhook fires post-checkout, they briefly see non-Pro state. The success page's 3-second delay covers this naturally

## Files Created/Modified

### New Files

- `app/api/stripe/checkout/route.ts`
- `app/api/stripe/portal/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/checkout/success/page.tsx`
- `app/checkout/cancel/page.tsx`
- `supabase/migrations/XXXXXX_stripe_columns.sql`

### Modified Files

- `app/components/settings/SettingsView.tsx` — single Pro tier, real checkout buttons, manage subscription
- `app/page.tsx` or `app/app/page.tsx` — pass `isPro` from profile instead of hardcoded check
- `lib/db.ts` — add helpers for Stripe customer/subscription ID updates
- `package.json` — add `stripe` dependency

### Deleted Files

- `components/ui/minimal-payment-modal.tsx`

## Out of Scope

- Gem pack purchases (future phase)
- Free trial period
- Coupon/promo codes (can add in Stripe Dashboard later without code changes)
- Email receipts (Stripe handles automatically)
