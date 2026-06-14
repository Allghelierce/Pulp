import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-grove:${ip}`, { maxRequests: 40, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { data: membership } = await supabaseAdmin.from('group_members')
    .select('status').eq('group_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership || membership.status !== 'active') return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const { data } = await supabaseAdmin.from('group_trees')
    .select('tree').eq('group_id', id).order('planted_at', { ascending: true }).limit(200)
  return NextResponse.json({ trees: (data ?? []).map(r => r.tree) })
}
