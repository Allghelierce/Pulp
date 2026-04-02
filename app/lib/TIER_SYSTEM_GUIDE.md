# Tier System & Usage Limiter Guide

## Overview

The tier system has three pricing tiers with different AI feature limits:

### Tier Pricing & Limits

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  FREE              │  CREATOR            │  PRO                              │
│  $0/month          │  $6/month           │  $12/month                        │
│  ────────────────  │  ──────────────────  │  ──────────────────              │
│  100 sketches/mo   │  500 sketches/mo    │  Unlimited sketches              │
│  5K tokens/mo      │  50K tokens/mo      │  500K tokens/mo                  │
│  1 GB storage      │  5 GB storage       │  50 GB storage                   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Integration Guide

### 1. Store User Tier

Add to your user data structure:

```typescript
// In your user/note type
interface UserData {
  // ... existing fields
  tier: "free" | "creator" | "pro"
  usage: UserUsage
}
```

### 2. Initialize Usage on Sign Up

```typescript
import { initializeUserUsage } from "@/app/lib/tierLimits"

// When user creates account
const userUsage = initializeUserUsage("free") // Start everyone on free
saveToDatabase(userId, { usage: userUsage })
```

### 3. Check Limits Before API Calls

#### Example: Sketch Generation

```typescript
// app/api/sketch/route.ts
import { checkSketchLimit, addSketchUsage } from "@/app/lib/limitEnforcer"
import type { UserUsage } from "@/app/lib/tierLimits"

export async function POST(req: Request) {
  const { prompt, userId } = await req.json()

  // Get user's usage
  const userUsage = await getUserUsageFromDB(userId) // Your DB fetch

  // Check limit
  const limitError = checkSketchLimit(userUsage)
  if (limitError) return limitError

  // Generate sketch...
  const imageUrl = await generateSketch(prompt)

  // Update usage after successful generation
  const updatedUsage = addSketchUsage(userUsage)
  await saveUsageToDatabase(userId, updatedUsage)

  return NextResponse.json({ url: imageUrl })
}
```

#### Example: Text Rewrite with Token Counting

```typescript
// app/api/rewrite/route.ts
import { checkTokenLimit, estimateRewriteTokens, addTokenUsage } from "@/app/lib/limitEnforcer"

export async function POST(req: Request) {
  const { text, userId } = await req.json()

  const userUsage = await getUserUsageFromDB(userId)

  // Estimate tokens needed
  const tokensNeeded = estimateRewriteTokens(text.length)

  // Check token limit
  const limitError = checkTokenLimit(userUsage, tokensNeeded)
  if (limitError) return limitError

  // Perform rewrite...
  const rewritten = await rewriteText(text)

  // Update token usage
  const updatedUsage = addTokenUsage(userUsage, tokensNeeded)
  await saveUsageToDatabase(userId, updatedUsage)

  return NextResponse.json({ rewritten })
}
```

### 4. Display Usage to User

```typescript
import { UsageLimitIndicator } from "@/app/components/UsageLimitIndicator"

// In your component
<UsageLimitIndicator
  usage={userUsage}
  isDark={isDark}
  accent={accentColor}
/>
```

### 5. Handle Limit Reached

Show user a helpful message when they hit a limit:

```typescript
import { getRemainingLimits } from "@/app/lib/tierLimits"

const { sketchesRemaining, tokensRemaining } = getRemainingLimits(usage)

const tierLimits = { free: 100, creator: 500, pro: Infinity }
if (sketchesRemaining === 0) {
  openAlert(
    "Sketch Limit Reached",
    `You've used all ${tierLimits[usage.tier]} sketches this month. Upgrade to Creator ($6) or Pro ($12) for more!`
  )
}
```

## Token Estimation

### Text Generation Operations

- **Rewrite/Improve**: ~25% of input tokens for output
- **Summarize**: ~10% of input tokens for output
- **Explain**: ~50% of input tokens for output
- **Quiz Generation**: ~30% of input tokens for output

**Formula**: `(textLength / 4) + (textLength / 4 * outputPercentage)`

### Sketch Generation

Fixed cost of **50 tokens** per sketch.

## Monthly Reset

Limits reset automatically after 30 days. Use the utility:

```typescript
import { shouldResetMonthlyLimits, resetMonthlyLimits } from "@/app/lib/tierLimits"

if (shouldResetMonthlyLimits(usage)) {
  const resetUsage = resetMonthlyLimits(usage)
  await saveUsageToDatabase(userId, resetUsage)
}
```

## Tier Upgrades

When user upgrades tier:

```typescript
import { upgradeTier } from "@/app/lib/tierLimits"

const updatedUsage = upgradeTier(currentUsage, "creator") // or "pro"
await saveUsageToDatabase(userId, updatedUsage)
```

## Client-Side Quick Checks

For quick client-side checks before making requests:

```typescript
import { getClientUsage, canGenerateSketch, getRemainingLimits } from "@/app/lib/tierLimits"

const usage = getClientUsage()

if (!canGenerateSketch(usage)) {
  // Show upgrade prompt
}

const { sketchesRemaining } = getRemainingLimits(usage)
// Show: "3 sketches remaining this month"
```

## Error Responses

API routes return standardized error responses:

```json
{
  "error": "AI Sketch limit exceeded",
  "message": "You've reached your monthly limit...",
  "code": "SKETCH_LIMIT_EXCEEDED",
  "status": 429
}
```

Handle these in your client:

```typescript
if (response.status === 429) {
  const { code } = await response.json()

  if (code === "SKETCH_LIMIT_EXCEEDED") {
    // Show sketch-specific message
  } else if (code === "TOKEN_LIMIT_EXCEEDED") {
    // Show token-specific message
  }
}
```

## Database Schema

Recommended fields to store per user:

```typescript
{
  userId: string
  tier: "free" | "creator" | "pro"
  // Usage tracking
  aiSketchesUsed: number
  aiTokensUsed: number
  // Reset tracking
  lastSketchResetTime: number // unix ms
  lastTokenResetTime: number // unix ms
  // Audit trail (optional)
  totalSketchesGenerated: number // lifetime
  totalTokensUsed: number // lifetime
}
```

## Testing

To test limits locally:

```typescript
import { getClientUsage, saveClientUsage, getRemainingLimits } from "@/app/lib/tierLimits"

// Simulate a free user with 99 sketches used
const usage = {
  tier: "free",
  aiSketchesUsed: 99,
  aiTokensUsed: 4900,
  lastSketchResetTime: Date.now(),
  lastTokenResetTime: Date.now(),
}

saveClientUsage(usage)

const limits = getRemainingLimits(usage)
console.log(limits)
// { sketchesRemaining: 1, tokensRemaining: 100, ... }
```
