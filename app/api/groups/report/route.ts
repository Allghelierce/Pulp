import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getWeekStart } from "@/lib/leagues"
import { TREE_TYPES } from "@/app/constants"
import { seasonOver, must, guarded } from "@/lib/partyServer"
import { parseId, parseReportMinutes, weekCapAt } from "@/lib/social"
import { creditFocus } from "@/lib/partyCredit"

// Only a known species at a real stage goes into the communal grove.
function cleanTree(raw: unknown): { type: string; stage: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const { type, stage } = raw as { type?: unknown; stage?: unknown }
  if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(TREE_TYPES, type)) return null
  if (typeof stage !== 'number' || !Number.isInteger(stage) || stage < 0 || stage > 4) return null
  return { type, stage }
}

// A report must credit at least this many minutes to plant a tree (a real session),
// so 1-minute reports can't fill the grove.
const PLANT_MIN_MINUTES = 10

// A finished focus session, credited to your party. The client says how long
// it was, so the minutes are bounded here: one session per report at most, and
// about 16h a day (see parseReportMinutes / weekCapAt).
export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-report:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const groupId = parseId(body?.groupId)
  const minutes = parseReportMinutes(body?.minutes)
  if (!groupId || minutes == null) return NextResponse.json({ error: "Bad input" }, { status: 400 })

  return guarded("record your focus", async () => {
    const group = must(await supabaseAdmin.from('study_groups').select('status, term_end').eq('id', groupId).maybeSingle(), 'group')
    if (!group || group.status !== 'active' || seasonOver(group)) return NextResponse.json({ error: "Inactive group" }, { status: 400 })

    const week = getWeekStart()
    const credited = await creditFocus(supabaseAdmin, { groupId, userId: user.id, week, minutes, cap: weekCapAt(week) })
    if (credited == null) return NextResponse.json({ error: "Not a member" }, { status: 403 })

    // Short or capped-out reports plant nothing.
    const tree = credited >= PLANT_MIN_MINUTES ? cleanTree(body.tree) : null
    if (tree) must(await supabaseAdmin.from('group_trees').insert({ group_id: groupId, user_id: user.id, tree }), 'group_trees')
    return NextResponse.json({ ok: true, credited })
  })
}
