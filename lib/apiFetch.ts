import { supabase } from './supabase'

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  const res = await fetch(url, { ...options, headers })
  // A free-plan limit (402 with a code) opens the Plus upgrade prompt app-wide.
  if (res.status === 402 && typeof window !== 'undefined') {
    res.clone().json().then((j: { code?: string; error?: string }) => {
      if (j?.code) window.dispatchEvent(new CustomEvent('pulp-upgrade', { detail: { code: j.code, message: j.error } }))
    }).catch(() => {})
  }
  return res
}
