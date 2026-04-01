import { NextResponse } from "next/server"
import { canGenerateSketch, canUseTokens, type UserUsage } from "@/app/lib/tierLimits"

/**
 * Check if user has reached sketch generation limit
 * Returns error response if limit exceeded, otherwise returns null
 */
export function checkSketchLimit(usage: UserUsage) {
  if (!canGenerateSketch(usage)) {
    return NextResponse.json(
      {
        error: "AI Sketch limit exceeded",
        message: `You've reached your monthly limit of ${usage.tier === "free" ? 100 : usage.tier === "creator" ? 500 : "unlimited"} sketches. Upgrade your plan or wait for the next billing cycle.`,
        code: "SKETCH_LIMIT_EXCEEDED",
      },
      { status: 429 }
    )
  }
  return null
}

/**
 * Check if user has enough tokens for AI operation
 * Returns error response if insufficient, otherwise returns null
 */
export function checkTokenLimit(usage: UserUsage, tokensNeeded: number) {
  const { allowed, remaining } = canUseTokens(usage, tokensNeeded)
  if (!allowed) {
    return NextResponse.json(
      {
        error: "AI Token limit exceeded",
        message: `You need ${tokensNeeded} tokens but only have ${remaining} remaining. Upgrade your plan or wait for the next billing cycle.`,
        code: "TOKEN_LIMIT_EXCEEDED",
        tokensNeeded,
        tokensRemaining: remaining,
      },
      { status: 429 }
    )
  }
  return null
}

/**
 * Get estimated token cost for a rewrite operation
 * Based on input length
 */
export function estimateRewriteTokens(textLength: number): number {
  // Rough estimate: ~4 characters per token, add 50% for output
  const inputTokens = Math.ceil(textLength / 4)
  const outputTokens = Math.ceil(inputTokens * 0.5)
  return inputTokens + outputTokens
}

/**
 * Get estimated token cost for AI sketch generation
 */
export function estimateSketchTokens(): number {
  // Sketch generation uses fewer tokens
  return 50
}

/**
 * Get usage info from localStorage (for client-side checks)
 * This is a simplified client version - in production, you'd fetch from server
 */
export function getClientUsage(): UserUsage {
  try {
    const stored = localStorage.getItem("userUsage")
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error("Failed to parse stored usage:", e)
  }
  // Default to free tier
  return {
    tier: "free",
    aiSketchesUsed: 0,
    aiTokensUsed: 0,
    lastSketchResetTime: Date.now(),
    lastTokenResetTime: Date.now(),
  }
}

/**
 * Save usage to localStorage
 */
export function saveClientUsage(usage: UserUsage) {
  try {
    localStorage.setItem("userUsage", JSON.stringify(usage))
  } catch (e) {
    console.error("Failed to save usage:", e)
  }
}
