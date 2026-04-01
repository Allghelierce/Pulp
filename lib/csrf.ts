import crypto from "crypto"

// Store CSRF tokens in memory (in production, use database/session storage)
const csrfTokens = new Map<string, { token: string; timestamp: number }>()

// Token expiry time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000

/**
 * Generate a CSRF token for a session/user
 */
export function generateCSRFToken(sessionId: string): string {
  // Invalidate old tokens
  const existing = csrfTokens.get(sessionId)
  if (existing && Date.now() - existing.timestamp > TOKEN_EXPIRY) {
    csrfTokens.delete(sessionId)
  }

  // Generate new token
  const token = crypto.randomBytes(32).toString("hex")
  csrfTokens.set(sessionId, { token, timestamp: Date.now() })

  return token
}

/**
 * Verify a CSRF token
 */
export function verifyCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId)

  if (!stored) {
    return false
  }

  // Check if token has expired
  if (Date.now() - stored.timestamp > TOKEN_EXPIRY) {
    csrfTokens.delete(sessionId)
    return false
  }

  // Verify token matches using timing-safe comparison
  const match = crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  )

  return match
}

/**
 * Invalidate CSRF token after use
 */
export function invalidateCSRFToken(sessionId: string): void {
  csrfTokens.delete(sessionId)
}
