import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { seasonDates, parseId, parseUserId } from "@/lib/social"
import { activePartyOf, seasonOver, capOf, countActive, must, guarded, IN_A_PARTY } from "@/lib/partyServer"

// Your own membership in a party: "active", "pending", or null (declined,
// removed, or the party is gone). Lets a pending request learn its answer.
export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-membership-get:${ip}`, { maxRequests: 40, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const groupId = parseId(new URL(req.url).searchParams.get('groupId'))
  if (!groupId) return NextResponse.json({ error: "Missing groupId" }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('group_members')
    .select('status').eq('group_id', groupId).eq('user_id', user.id).maybeSingle()
  // A failed lookup must not read as "declined": the client keeps waiting on a 500.
  if (error) return NextResponse.json({ error: "Couldn't check" }, { status: 500 })
  return NextResponse.json({ status: data?.status ?? null })
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
const IN_ANOTHER = "They already joined another party."
// What each action does, for its 500 message ("Couldn't ... Try again.").
const ACTIONS: Record<string, string> = {
  join: 'join', approve: 'let them in', decline: 'decline', remove: 'remove them',
  renew: 'renew the season', leave: 'leave', disband: 'end the party',
}

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-membership:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }
  const action = body?.action
  if (typeof action !== 'string' || !Object.hasOwn(ACTIONS, action)) return bad("Unknown action")
  const groupId = parseId(body?.groupId)
  const targetId = parseUserId(body?.userId) // the member an owner acts on
  const members = () => supabaseAdmin.from('group_members')

  // Any DB error below answers 500 (never a false ok).
  return guarded(ACTIONS[action], async () => {
    if (action === 'join') {
      const code = String(body.invite_code ?? '').trim().toUpperCase()
      if (!/^[A-Z0-9]{8}$/.test(code)) return bad("Invalid code", 404)
      const group = must(await supabaseAdmin.from('study_groups')
        .select('*').eq('invite_code', code).maybeSingle(), 'group')
      if (!group) return bad("Invalid code", 404)
      if (group.status !== 'active' || seasonOver(group)) return bad("This party's season is over")

      // Already in (or already asked): don't downgrade an active member to pending.
      const existing = must(await members()
        .select('status').eq('group_id', group.id).eq('user_id', user.id).maybeSingle(), 'membership')
      if (existing) return NextResponse.json({ ok: true, groupId: group.id, status: existing.status })

      // One active party per player.
      if (await activePartyOf(user.id)) return bad(IN_A_PARTY, 409)
      // A request doesn't take a seat; approving re-checks the cap.
      if (await countActive(group.id) >= capOf(group)) return bad("Group full")

      // ignoreDuplicates: a repeat join must never knock an approved member back to pending.
      must(await members().upsert({ group_id: group.id, user_id: user.id, role: 'member', status: 'pending' },
        { onConflict: 'group_id,user_id', ignoreDuplicates: true }), 'join')
      return NextResponse.json({ ok: true, groupId: group.id, status: 'pending' })
    }

    // Everything else names a party (and the owner actions, a member).
    if (!groupId) return bad("Missing groupId")
    const group = must(await supabaseAdmin.from('study_groups')
      .select('owner_id, max_members, status, term_end').eq('id', groupId).maybeSingle(), 'group')
    const isOwner = !!group && group.owner_id === user.id

    if (action === 'approve' || action === 'decline') {
      if (!isOwner) return bad("Not allowed", 403)
      if (!targetId) return bad("Missing userId")
      if (action === 'decline') {
        must(await members().delete().eq('group_id', groupId).eq('user_id', targetId).eq('status', 'pending'), 'decline')
        return NextResponse.json({ ok: true })
      }
      if (group.status !== 'active' || seasonOver(group)) return bad("This party's season is over")
      if (await countActive(groupId) >= capOf(group)) return bad("Group full")
      // They joined another party while waiting: drop the stale request.
      if (await activePartyOf(targetId, groupId)) {
        must(await members().delete().eq('group_id', groupId).eq('user_id', targetId).eq('status', 'pending'), 'drop request')
        return bad(IN_ANOTHER, 409)
      }
      // Only a pending request turns active.
      const hit = must(await members().update({ status: 'active' })
        .eq('group_id', groupId).eq('user_id', targetId).eq('status', 'pending').select('id'), 'approve')
      if (!hit?.length) return bad("That request is no longer there.", 409)
      // Two approvals at once can both pass the checks above, so look again now
      // that the seat is taken, and hand it back if the party went over the cap
      // or they got into another party meanwhile. At worst both step back
      // (the owner tries again); never over the cap or in two parties.
      const over = await countActive(groupId) > capOf(group)
      if (over || await activePartyOf(targetId, groupId)) {
        must(await members().update({ status: 'pending' })
          .eq('group_id', groupId).eq('user_id', targetId).eq('status', 'active'), 'approve rollback')
        return over ? bad("Group full") : bad(IN_ANOTHER, 409)
      }
      return NextResponse.json({ ok: true })
    }

    // Owner removes a member (never themselves — they end the party instead).
    if (action === 'remove') {
      if (!isOwner) return bad("Not allowed", 403)
      if (!targetId || targetId === user.id) return bad("You can't remove yourself")
      must(await members().delete().eq('group_id', groupId).eq('user_id', targetId), 'remove')
      return NextResponse.json({ ok: true })
    }

    // Owner starts a new season: today + 3 months, active again.
    if (action === 'renew') {
      if (!isOwner) return bad("Not allowed", 403)
      if (await activePartyOf(user.id, groupId)) return bad(IN_A_PARTY, 409)
      // Reviving a finished party (archived, or expired but not archived yet):
      // members who moved on to another party stay there. Done before the
      // revive, so a failure here never leaves anyone in two active parties.
      if (group.status !== 'active' || seasonOver(group)) {
        const rows = must(await members()
          .select('user_id').eq('group_id', groupId).eq('status', 'active').neq('user_id', user.id), 'members')
        for (const m of rows ?? []) {
          if (await activePartyOf(m.user_id, groupId)) {
            must(await members().delete().eq('group_id', groupId).eq('user_id', m.user_id), 'renew cleanup')
          }
        }
      }
      must(await supabaseAdmin.from('study_groups')
        .update({ ...seasonDates(), status: 'active' }).eq('id', groupId), 'renew')
      return NextResponse.json({ ok: true })
    }

    // A member leaves (or withdraws a request).
    if (action === 'leave') {
      if (isOwner) return bad("Owner can't leave")
      must(await members().delete().eq('group_id', groupId).eq('user_id', user.id), 'leave')
      return NextResponse.json({ ok: true })
    }

    if (action === 'disband') {
      if (!isOwner) return bad("Not allowed", 403)
      // Members, weekly totals and trees cascade with the group.
      must(await supabaseAdmin.from('study_groups').delete().eq('id', groupId), 'disband')
      return NextResponse.json({ ok: true })
    }

    return bad("Unknown action")
  })
}
