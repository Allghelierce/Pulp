# Security Developer Guide

Quick reference for using the new security utilities in your code.

## 1. Using Encrypted localStorage

### Basic Usage
```typescript
import { useEncryptedStorage } from '@/lib/useEncryptedStorage'

export function MyComponent() {
  // Hook automatically encrypts/decrypts data
  const [userData, setUserData, clearData, isLoading] = useEncryptedStorage(
    'user-data',
    { name: '', email: '' }
  )

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <input
        value={userData.name}
        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
      />
      <button onClick={clearData}>Clear Data</button>
    </div>
  )
}
```

### Direct localStorage Encryption
```typescript
import { saveEncrypted, loadEncrypted, deleteEncrypted } from '@/lib/localStorageEncrypt'

const encryptionKey = 'user-session-id'

// Save
saveEncrypted('my-secret', { password: '...' }, encryptionKey)

// Load
const data = loadEncrypted('my-secret', encryptionKey, { password: '' })

// Delete
deleteEncrypted('my-secret')
```

---

## 2. HTML Sanitization

### Sanitize User Content
```typescript
import { sanitizeHTML, escapeHTML } from '@/lib/sanitize'

// For displaying HTML (safe)
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userHTML) }} />

// For displaying as text
<div>{escapeHTML(userText)}</div>

// In components
export function UserContent({ html }: { html: string }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }} />
  )
}
```

---

## 3. Rate Limiting (Server-Side)

### Check Rate Limit in API Route
```typescript
import { NextResponse } from 'next/server'
import { getRateLimitKey, checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: Request) {
  // Get client identifier (IP address)
  const key = getRateLimitKey(req)

  // Check rate limit: 20 requests per minute
  if (!checkRateLimit(key, { windowMs: 60000, maxRequests: 20 })) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Process request...
}
```

### Custom Rate Limiting
```typescript
const key = getRateLimitKey(req)

// 10 requests per 2 minutes
if (!checkRateLimit(key, { windowMs: 120000, maxRequests: 10 })) {
  return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
}

// 5 requests per 5 minutes
if (!checkRateLimit(key, { windowMs: 300000, maxRequests: 5 })) {
  return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
}
```

---

## 4. Input Validation

### Validate API Input
```typescript
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const MAX_LENGTH = 1000

  try {
    const { text } = await req.json()

    // Type check
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Length check
    if (text.length > MAX_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds ${MAX_LENGTH} characters` },
        { status: 400 }
      )
    }

    // Process...
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
```

---

## 5. CSRF Protection

### Protect Form Submissions
```typescript
import { fetchWithCSRF, createFormDataWithCSRF } from '@/lib/csrfForm'

// Method 1: Using fetchWithCSRF
async function deleteAccount(password: string) {
  const response = await fetchWithCSRF(
    '/api/account/delete',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    }
  )
  return response.json()
}

// Method 2: Using FormData
async function submitForm(data: Record<string, any>) {
  const formData = createFormDataWithCSRF(data)
  const response = await fetch('/api/form', {
    method: 'POST',
    body: formData
  })
  return response.json()
}
```

### Validate CSRF Token (Server-Side)
```typescript
import { validateCSRFToken } from '@/lib/csrfForm'

export async function POST(request: Request) {
  // Verify CSRF token
  const isValid = await validateCSRFToken(request)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }

  // Process request...
}
```

---

## 6. Error Handling - Safe Pattern

### ❌ DON'T - Leaks information
```typescript
catch (error) {
  console.error(error)
  return NextResponse.json(
    { error: error.toString() }, // ❌ Leaks stack trace
    { status: 500 }
  )
}
```

### ✅ DO - Generic message to client
```typescript
catch (error) {
  console.error('Database error:', error) // ✅ Log details server-side
  return NextResponse.json(
    { error: 'Failed to process request' }, // ✅ Generic message
    { status: 500 }
  )
}
```

---

## 7. SSRF Prevention

### Validate URLs Before Fetching
```typescript
import { isValidURL } from '@/lib/urlValidation'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!isValidURL(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const response = await fetch(url)
  // ...
}
```

The validator blocks:
- Private IP ranges (192.168.*, 10.*, 127.*)
- Non-HTTP protocols (file://, gopher://)
- Cloud metadata endpoints (AWS, GCP, Azure)
- Invalid URLs

---

## 8. Password Verification (Server-Side)

### Verify Password on Sensitive Operations
```typescript
// app/actions/deleteAccount.ts
'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function verifyPasswordAndDelete(
  userId: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify password
    const { error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password
    })

    if (error) {
      return { success: false, error: 'Invalid password' }
    }

    // Delete account
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    return deleteError
      ? { success: false, error: 'Failed to delete' }
      : { success: true }
  } catch (error) {
    return { success: false, error: 'An error occurred' }
  }
}
```

### Call from Client
```typescript
// In client component
const result = await verifyPasswordAndDelete(userId, password)

if (!result.success) {
  alert(result.error)
} else {
  window.location.href = '/login'
}
```

---

## 9. Security Headers

Headers are automatically added by `/middleware.ts`:
- `Content-Security-Policy` - prevents XSS
- `X-Frame-Options: DENY` - prevents clickjacking
- `X-Content-Type-Options: nosniff` - prevents MIME sniffing
- `Strict-Transport-Security` - enforces HTTPS
- `Referrer-Policy` - controls referrer info
- `Permissions-Policy` - limits API access

To customize, edit `/middleware.ts`.

---

## 10. Checklist for New API Endpoints

When creating a new API endpoint, follow this checklist:

```typescript
// ✅ Do all of these:

import { NextResponse } from 'next/server'
import { getRateLimitKey, checkRateLimit } from '@/lib/rateLimit'
import { sanitizeHTML } from '@/lib/sanitize'

export async function POST(request: Request) {
  // 1. Rate limiting
  const key = getRateLimitKey(request)
  if (!checkRateLimit(key, { windowMs: 60000, maxRequests: 10 })) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  try {
    // 2. Input validation
    const { data } = await request.json()

    if (!data || typeof data !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    if (data.length > 1000) {
      return NextResponse.json(
        { error: 'Input too large' },
        { status: 400 }
      )
    }

    // 3. Sanitize if displaying HTML
    const safe = sanitizeHTML(data)

    // 4. Process request
    const result = await processData(safe)

    // 5. Return success
    return NextResponse.json({ result })

  } catch (error) {
    // 6. Log error server-side
    console.error('Endpoint error:', error)

    // 7. Return generic error to client
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
```

---

## 11. Common Security Mistakes

### ❌ Mistake 1: Trusting User Input
```typescript
// ❌ WRONG
const response = await fetch(userUrl) // SSRF vulnerability!
const html = userHtml // XSS vulnerability!
```

### ✅ Solution: Validate & Sanitize
```typescript
// ✅ RIGHT
if (!isValidURL(userUrl)) return error()
const html = sanitizeHTML(userHtml)
```

---

### ❌ Mistake 2: Leaking Errors
```typescript
// ❌ WRONG
catch (error) {
  return { error: error.message } // Leaks info!
}
```

### ✅ Solution: Generic Errors
```typescript
// ✅ RIGHT
catch (error) {
  console.error('Error:', error) // Log details
  return { error: 'Failed' } // Generic message
}
```

---

### ❌ Mistake 3: Client-Side Validation Only
```typescript
// ❌ WRONG
if (password.length > 0) { // Client-side!
  deleteAccount()
}
```

### ✅ Solution: Server-Side Validation
```typescript
// ✅ RIGHT
const result = await verifyPasswordAndDelete(password) // Server-side!
```

---

### ❌ Mistake 4: No Rate Limiting
```typescript
// ❌ WRONG - Expensive operation unprotected
export async function POST(req: Request) {
  const image = await generateImage(req.prompt)
}
```

### ✅ Solution: Add Rate Limiting
```typescript
// ✅ RIGHT
export async function POST(req: Request) {
  if (!checkRateLimit(getRateLimitKey(req))) {
    return error429()
  }
  const image = await generateImage(req.prompt)
}
```

---

## 12. Testing Your Security

### Unit Test Example
```typescript
import { sanitizeHTML } from '@/lib/sanitize'

describe('sanitizeHTML', () => {
  it('should remove script tags', () => {
    const input = '<script>alert("xss")</script>Hello'
    const output = sanitizeHTML(input)
    expect(output).not.toContain('<script>')
    expect(output).toContain('Hello')
  })

  it('should remove event handlers', () => {
    const input = '<img src=x onerror="alert(\'xss\')">'
    const output = sanitizeHTML(input)
    expect(output).not.toContain('onerror')
  })
})
```

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Next.js Security](https://nextjs.org/docs/basic-features/security)

---

**Last Updated**: 2026-04-01
