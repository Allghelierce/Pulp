import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { generateInviteCode, validateTerm, PARTY_CAP } from "@/lib/social"
import { archiveIfExpired, activePartyOf, IN_A_PARTY } from "@/lib/partyServer"

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`groups-get:${ip}`, { maxRequests: 40, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (id) {
    const { data: membership } = await supabaseAdmin.from('group_members')
      .select('status').eq('group_id', id).eq('user_id', user.id).maybeSingle()
    if (!membership || membership.status !== 'active') return NextResponse.json({ error: "Not a member" }, { status: 403 })

    const { data: group } = await supabaseAdmin.from('study_groups').select('*').eq('id', id).single()
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await archiveIfExpired(group)

    const { data: members } = await supabaseAdmin.from('group_members')
      .select('user_id, role, status, focus_minutes_total').eq('group_id', id)
    const ids = (members ?? []).map(m => m.user_id)
    const { data: profs } = await supabaseAdmin.from('player_profiles')
      .select('user_id, username, level').in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    const pmap: Record<string, any> = {}; for (const p of profs ?? []) pmap[p.user_id] = p
    const hydrated = (members ?? []).map(m => ({ ...m, ...pmap[m.user_id] }))
    return NextResponse.json({ group, members: hydrated })
  }

  const { data: rows } = await supabaseAdmin.from('group_members')
    .select('study_groups(*)').eq('user_id', user.id).eq('status', 'active')
  const groups = (await Promise.all((rows ?? []).map((r: any) => r.study_groups ? archiveIfExpired(r.study_groups) : null))).filter(Boolean)
  return NextResponse.json({ groups })
}

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`groups-create:${ip}`, { maxRequests: 10, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 60) : ''
  if (name.length < 2) return NextResponse.json({ error: "Name too short" }, { status: 400 })
  const term = validateTerm(body.term_start, body.term_end)
  if (!term.ok) return NextResponse.json({ error: term.error }, { status: 400 })
  // One active party per player.
  if (await activePartyOf(user.id)) return NextResponse.json({ error: IN_A_PARTY }, { status: 409 })

  let group: any = null
  for (let attempt = 0; attempt < 5 && !group; attempt++) {
    const { data, error } = await supabaseAdmin.from('study_groups').insert({
      owner_id: user.id, name, school: body.school ?? null,
      invite_code: generateInviteCode(),
      term_start: body.term_start, term_end: body.term_end,
      max_members: PARTY_CAP,
    }).select().single()
    if (!error) group = data
  }
  if (!group) return NextResponse.json({ error: "Could not create" }, { status: 500 })

  await supabaseAdmin.from('group_members').insert({
    group_id: group.id, user_id: user.id, role: 'owner', status: 'active',
  })
  return NextResponse.json({ group })
}
