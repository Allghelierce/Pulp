/**
 * CSRF Protection utilities for form submissions
 * Use this to protect POST/PUT/DELETE forms
 */

export function getCSRFTokenFromMeta(): string | null {
  if (typeof document === 'undefined') return null
  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta?.getAttribute('content') || null
}

/**
 * Wrap a fetch request to include CSRF token
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit & { csrfToken?: string } = {}
) {
  const csrfToken = options.csrfToken || getCSRFTokenFromMeta()

  const headers = new Headers(options.headers || {})

  // Add CSRF token to headers for non-GET requests
  if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken)
    }
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Create a FormData object with CSRF token included
 */
export function createFormDataWithCSRF(data: Record<string, any>): FormData {
  const formData = new FormData()

  const csrfToken = getCSRFTokenFromMeta()
  if (csrfToken) {
    formData.append('_csrf', csrfToken)
  }

  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof Blob) {
      formData.append(key, value)
    } else if (Array.isArray(value)) {
      value.forEach((item) => formData.append(`${key}[]`, item))
    } else {
      formData.append(key, String(value))
    }
  })

  return formData
}

/**
 * Validate CSRF token from form submission
 * Call this server-side before processing form data
 */
export async function validateCSRFToken(request: Request): Promise<boolean> {
  const contentType = request.headers.get('content-type') || ''

  let token: string | null = null

  if (contentType.includes('application/json')) {
    try {
      const data = await request.json()
      token = data._csrf || request.headers.get('X-CSRF-Token')
    } catch {
      return false
    }
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const data = await request.text()
    const params = new URLSearchParams(data)
    token = params.get('_csrf') || request.headers.get('X-CSRF-Token')
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    token = formData.get('_csrf') as string | null
    if (!token) {
      token = request.headers.get('X-CSRF-Token')
    }
  }

  // For now, just check that token exists
  // In production, verify against server-side store
  return !!token
}
