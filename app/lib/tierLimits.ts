// Tier-based limits for AI features and drawings
export type UserTier = "free" | "creator" | "pro"

export interface TierLimits {
  aiSketches: number
  aiTokens: number
  cloudStorage: number // in GB
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    aiSketches: 100,
    aiTokens: 5000,
    cloudStorage: 1,
  },
  creator: {
    aiSketches: 500,
    aiTokens: 50000,
    cloudStorage: 5,
  },
  pro: {
    aiSketches: Infinity,
    aiTokens: 500000,
    cloudStorage: 50,
  },
}

export interface UserUsage {
  tier: UserTier
  aiSketchesUsed: number
  aiTokensUsed: number
  // Reset timestamps (unix ms)
  lastSketchResetTime: number
  lastTokenResetTime: number
}

/**
 * Initialize user usage tracker
 */
export function initializeUserUsage(tier: UserTier = "free"): UserUsage {
  const now = Date.now()
  return {
    tier,
    aiSketchesUsed: 0,
    aiTokensUsed: 0,
    lastSketchResetTime: now,
    lastTokenResetTime: now,
  }
}

/**
 * Check if sketch limit is exceeded
 */
export function canGenerateSketch(usage: UserUsage): boolean {
  const limits = TIER_LIMITS[usage.tier]
  return usage.aiSketchesUsed < limits.aiSketches
}

/**
 * Check if token limit is exceeded and return remaining
 */
export function canUseTokens(usage: UserUsage, tokensNeeded: number): { allowed: boolean; remaining: number } {
  const limits = TIER_LIMITS[usage.tier]
  const remaining = Math.max(0, limits.aiTokens - usage.aiTokensUsed)
  return {
    allowed: remaining >= tokensNeeded,
    remaining,
  }
}

/**
 * Add sketch usage
 */
export function addSketchUsage(usage: UserUsage): UserUsage {
  return {
    ...usage,
    aiSketchesUsed: usage.aiSketchesUsed + 1,
  }
}

/**
 * Add token usage
 */
export function addTokenUsage(usage: UserUsage, tokensUsed: number): UserUsage {
  return {
    ...usage,
    aiTokensUsed: usage.aiTokensUsed + tokensUsed,
  }
}

/**
 * Get remaining limits
 */
export function getRemainingLimits(usage: UserUsage) {
  const limits = TIER_LIMITS[usage.tier]
  return {
    sketchesRemaining: Math.max(0, limits.aiSketches - usage.aiSketchesUsed),
    tokensRemaining: Math.max(0, limits.aiTokens - usage.aiTokensUsed),
    sketchPercentage: limits.aiSketches === Infinity ? 100 : (usage.aiSketchesUsed / limits.aiSketches) * 100,
    tokenPercentage: (usage.aiTokensUsed / limits.aiTokens) * 100,
  }
}

/**
 * Check if monthly limits should reset (30 days)
 */
export function shouldResetMonthlyLimits(usage: UserUsage): boolean {
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const now = Date.now()
  return now - usage.lastSketchResetTime > thirtyDaysMs || now - usage.lastTokenResetTime > thirtyDaysMs
}

/**
 * Reset monthly limits
 */
export function resetMonthlyLimits(usage: UserUsage): UserUsage {
  const now = Date.now()
  return {
    ...usage,
    aiSketchesUsed: 0,
    aiTokensUsed: 0,
    lastSketchResetTime: now,
    lastTokenResetTime: now,
  }
}

/**
 * Upgrade tier
 */
export function upgradeTier(usage: UserUsage, newTier: UserTier): UserUsage {
  return {
    ...usage,
    tier: newTier,
  }
}

/**
 * Get user-friendly limit description
 */
export function getLimitDescription(tier: UserTier): string {
  const limits = TIER_LIMITS[tier]
  if (limits.aiSketches === Infinity) {
    return `Unlimited AI Sketches • 500K AI Tokens`
  }
  return `${limits.aiSketches} AI Sketches/mo • ${limits.aiTokens.toLocaleString()} AI Tokens/mo`
}
