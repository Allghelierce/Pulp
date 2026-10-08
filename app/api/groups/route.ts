import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { generateInviteCode, seasonDates, parseId, PARTY_CAP } from "@/lib/social"
import { archiveIfExpired, activePartyOf, must, guarded, IN_A_PARTY } from "@/lib/partyServer"

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`groups-get:${ip}`, { maxRequests: 40, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rawId = new URL(req.url).searchParams.get('id')
  if (rawId) {
    const id = parseId(rawId)
    if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return guarded("load the party", async () => {
      const membership = must(await supabaseAdmin.from('group_members')
        .select('status').eq('group_id', id).eq('user_id', user.id).maybeSingle(), 'membership')
      if (!membership || membership.status !== 'active') return NextResponse.json({ error: "Not a member" }, { status: 403 })

      const group = must(await supabaseAdmin.from('study_groups').select('*').eq('id', id).maybeSingle(), 'group')
      if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 })
      await archiveIfExpired(group)

      const members = must(await supabaseAdmin.from('group_members')
        .select('user_id, role, status, focus_minutes_total').eq('group_id', id), 'members')
      const ids = (members ?? []).map(m => m.user_id)
      const profs = must(await supabaseAdmin.from('player_profiles')
        .select('user_id, username, level').in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']), 'profiles')
      const pmap: Record<string, any> = {}; for (const p of profs ?? []) pmap[p.user_id] = p
      const hydrated = (members ?? []).map(m => ({ ...m, ...pmap[m.user_id] }))
      return NextResponse.json({ group, members: hydrated })
    })
  }

  const { data: rows, error } = await supabaseAdmin.from('group_members')
    .select('study_groups(*)').eq('user_id', user.id).eq('status', 'active')
  // An empty list means "no party" to the client, so a failed lookup must not look like one.
  if (error) return NextResponse.json({ error: "Couldn't load your party" }, { status: 500 })
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

  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 60) : ''
  if (name.length < 2) return NextResponse.json({ error: "Name too short" }, { status: 400 })
  const school = typeof body.school === 'string' ? body.school.trim().slice(0, 80) || null : null

  return guarded("create the party", async () => {
    // One active party per player.
    if (await activePartyOf(user.id)) return NextResponse.json({ error: IN_A_PARTY }, { status: 409 })

    let group: any = null
    for (let attempt = 0; attempt < 5 && !group; attempt++) {
      const { data, error } = await supabaseAdmin.from('study_groups').insert({
        owner_id: user.id, name, school,
        invite_code: generateInviteCode(),
        ...seasonDates(), // every party gets a fresh 3-month season; client dates are ignored
        max_members: PARTY_CAP,
      }).select().single()
      if (!error) group = data
      else if (error.code !== '23505') throw new Error(`create: ${error.message}`) // only an invite-code clash retries
    }
    if (!group) throw new Error('create: no free invite code')

    const undo = async () => must(await supabaseAdmin.from('study_groups').delete().eq('id', group.id), 'create rollback')
    const { error } = await supabaseAdmin.from('group_members').insert({
      group_id: group.id, user_id: user.id, role: 'owner', status: 'active',
    })
    // A party with no owner row would be invisible to its owner: take it back.
    if (error) { await undo(); throw new Error(`create owner: ${error.message}`) }
    // Two creates at once can both pass the check above, so look again and
    // step back if there's another party now (at worst both do; never two).
    if (await activePartyOf(user.id, group.id)) {
      await undo()
      return NextResponse.json({ error: IN_A_PARTY }, { status: 409 })
    }
    return NextResponse.json({ group })
  })
}
