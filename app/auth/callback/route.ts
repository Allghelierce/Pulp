import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { flowType: 'pkce' } },
    )
    await supabase.auth.exchangeCodeForSession(code)
  }
  // Only same-site relative paths (no "//host" or absolute URLs).
  const next = req.nextUrl.searchParams.get('next')
  const dest = next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/app'
  return NextResponse.redirect(new URL(dest, req.url))
}
