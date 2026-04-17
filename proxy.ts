import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // Content Security Policy - prevents XSS and injection attacks
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net *.anthropic.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com cdn.jsdelivr.net",
      "img-src 'self' data: https: blob:",
      "font-src 'self' fonts.gstatic.com data:",
      "connect-src 'self' https: wss: api.groq.com api-inference.huggingface.co router.huggingface.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS protection (for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy - control how much referrer info is shared
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy - limit what APIs can be used
  response.headers.set(
    'Permissions-Policy',
    [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
    ].join(', ')
  )

  // Strict Transport Security - enforce HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return response
}

// Apply middleware to all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
