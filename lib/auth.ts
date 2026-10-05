import { createClient } from '@supabase/supabase-js'

export async function getAuthUser(req: Request): Promise<{ id: string; email?: string } | null> {
  const auth = req.headers.get('authorization')
  // Local dev only: DEV_SKIP_AUTH=1 in .env.local lets signed-out requests through as a fake user.
  if (!auth?.startsWith('Bearer ') && process.env.NODE_ENV === 'development' && process.env.DEV_SKIP_AUTH === '1') {
    return { id: '00000000-0000-0000-0000-000000000000', email: 'dev@localhost' }
  }
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return { id: user.id, email: user.email }
}
