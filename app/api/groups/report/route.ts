import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getWeekStart } from "@/lib/leagues"
import { TREE_TYPES } from "@/app/constants"
import { seasonOver } from "@/lib/partyServer"

// Only a known species at a real stage goes into the communal grove.
function cleanTree(raw: unknown): { type: string; stage: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const { type, stage } = raw as { type?: unknown; stage?: unknown }
  if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(TREE_TYPES, type)) return null
  if (typeof stage !== 'number' || !Number.isInteger(stage) || stage < 0 || stage > 4) return null
  return { type, stage }
}

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-report:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const groupId = Number(body.groupId)
  const minutes = Math.max(0, Math.min(600, Math.floor(Number(body.minutes) || 0)))
  if (!groupId || minutes <= 0) return NextResponse.json({ error: "Bad input" }, { status: 400 })

  const { data: group } = await supabaseAdmin.from('study_groups').select('status, term_end').eq('id', groupId).single()
  if (!group || group.status !== 'active' || seasonOver(group)) return NextResponse.json({ error: "Inactive group" }, { status: 400 })

  const { data: membership } = await supabaseAdmin.from('group_members')
    .select('focus_minutes_total, status').eq('group_id', groupId).eq('user_id', user.id).maybeSingle()
  if (!membership || membership.status !== 'active') return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const weekStart = getWeekStart()
  const { data: weekly } = await supabaseAdmin.from('group_weekly')
    .select('focus_minutes').eq('group_id', groupId).eq('user_id', user.id).eq('week_start', weekStart).maybeSingle()
  await supabaseAdmin.from('group_weekly').upsert({
    group_id: groupId, user_id: user.id, week_start: weekStart,
    focus_minutes: (weekly?.focus_minutes || 0) + minutes,
  }, { onConflict: 'group_id,user_id,week_start' })

  await supabaseAdmin.from('group_members')
    .update({ focus_minutes_total: (membership.focus_minutes_total || 0) + minutes })
    .eq('group_id', groupId).eq('user_id', user.id)

  const tree = cleanTree(body.tree)
  if (tree) {
    await supabaseAdmin.from('group_trees').insert({ group_id: groupId, user_id: user.id, tree })
  }
  return NextResponse.json({ ok: true })
}
