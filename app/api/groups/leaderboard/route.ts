import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getWeekStart } from "@/lib/leagues"

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-lb:${ip}`, { maxRequests: 40, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { data: membership } = await supabaseAdmin.from('group_members')
    .select('status').eq('group_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership || membership.status !== 'active') return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const { data: members } = await supabaseAdmin.from('group_members')
    .select('user_id, focus_minutes_total').eq('group_id', id).eq('status', 'active')
  const ids = (members ?? []).map(m => m.user_id)
  const safeIds = ids.length ? ids : ['00000000-0000-0000-0000-000000000000']

  const { data: profs } = await supabaseAdmin.from('player_profiles').select('user_id, username').in('user_id', safeIds)
  const uname: Record<string, string> = {}; for (const p of profs ?? []) uname[p.user_id] = p.username ?? 'writer'

  const { data: week } = await supabaseAdmin.from('group_weekly')
    .select('user_id, focus_minutes').eq('group_id', id).eq('week_start', getWeekStart())
  const weekMap: Record<string, number> = {}; for (const w of week ?? []) weekMap[w.user_id] = w.focus_minutes

  const { data: trees } = await supabaseAdmin.from('group_trees').select('user_id').eq('group_id', id)
  const treeCount: Record<string, number> = {}; for (const t of trees ?? []) treeCount[t.user_id] = (treeCount[t.user_id] || 0) + 1

  const byName = (a: any, b: any, key: string) => (b[key] - a[key]) || uname[a.user_id].localeCompare(uname[b.user_id])
  const weekly = (members ?? []).map(m => ({ user_id: m.user_id, username: uname[m.user_id], focus_minutes: weekMap[m.user_id] || 0 }))
    .sort((a, b) => byName(a, b, 'focus_minutes'))
  const allTime = (members ?? []).map(m => ({ user_id: m.user_id, username: uname[m.user_id], focus_minutes_total: m.focus_minutes_total, trees: treeCount[m.user_id] || 0 }))
    .sort((a, b) => byName(a, b, 'focus_minutes_total'))

  return NextResponse.json({ weekly, allTime })
}
