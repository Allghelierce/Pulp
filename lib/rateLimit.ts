// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs?: number // Time window in ms (default: 1 min)
  maxRequests?: number // Max requests per window (default: 10)
}

export function getRateLimitKey(req: Request): string {
  // Use IP address or session ID
  const ip = req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  return ip
}

export function checkRateLimit(key: string, options: RateLimitOptions = {}): boolean {
  const windowMs = options.windowMs ?? 60 * 1000 // 1 minute default
  const maxRequests = options.maxRequests ?? 10

  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count < maxRequests) {
    record.count++
    return true
  }

  return false
}
