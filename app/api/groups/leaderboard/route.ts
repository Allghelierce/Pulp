import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getWeekStart } from "@/lib/leagues"

// Party standings: this week and this season ("allTime" = since term_start),
// each with the trees the member planted in that span.
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

  const { data: group } = await supabaseAdmin.from('study_groups').select('term_start').eq('id', id).single()
  const termStart: string = group?.term_start ?? '1970-01-01'
  const weekStart = getWeekStart()

  const { data: members } = await supabaseAdmin.from('group_members')
    .select('user_id').eq('group_id', id).eq('status', 'active')
  const ids = (members ?? []).map(m => m.user_id)
  const safeIds = ids.length ? ids : ['00000000-0000-0000-0000-000000000000']

  // Members without a profile row still get a name (ties sort by it).
  const { data: profs } = await supabaseAdmin.from('player_profiles').select('user_id, username').in('user_id', safeIds)
  const uname: Record<string, string> = {}; for (const p of profs ?? []) uname[p.user_id] = p.username || 'writer'
  const nameOf = (uid: string) => uname[uid] || 'writer'

  // Weekly rows since the season's first week. A renewed season starts mid-week,
  // so that one week can carry a few minutes (and trees) from the season before.
  const seasonStart = getWeekStart(new Date(`${termStart}T12:00:00Z`))
  const { data: weeks } = await supabaseAdmin.from('group_weekly')
    .select('user_id, week_start, focus_minutes').eq('group_id', id).gte('week_start', seasonStart)
  const weekMin: Record<string, number> = {}
  const termMin: Record<string, number> = {}
  for (const w of weeks ?? []) {
    termMin[w.user_id] = (termMin[w.user_id] || 0) + (w.focus_minutes || 0)
    if (w.week_start === weekStart) weekMin[w.user_id] = (weekMin[w.user_id] || 0) + (w.focus_minutes || 0)
  }

  const { data: trees } = await supabaseAdmin.from('group_trees')
    .select('user_id, planted_at').eq('group_id', id).gte('planted_at', seasonStart)
  const weekTrees: Record<string, number> = {}
  const termTrees: Record<string, number> = {}
  for (const t of trees ?? []) {
    termTrees[t.user_id] = (termTrees[t.user_id] || 0) + 1
    if (String(t.planted_at).slice(0, 10) >= weekStart) weekTrees[t.user_id] = (weekTrees[t.user_id] || 0) + 1
  }

  const rank = <T extends { username: string }>(key: keyof T) => (a: T, b: T) =>
    (Number(b[key]) - Number(a[key])) || a.username.localeCompare(b.username)
  const weekly = ids.map(uid => ({ user_id: uid, username: nameOf(uid), focus_minutes: weekMin[uid] || 0, trees: weekTrees[uid] || 0 }))
    .sort(rank('focus_minutes'))
  const allTime = ids.map(uid => ({ user_id: uid, username: nameOf(uid), focus_minutes_total: termMin[uid] || 0, trees: termTrees[uid] || 0 }))
    .sort(rank('focus_minutes_total'))

  return NextResponse.json({ weekly, allTime })
}
