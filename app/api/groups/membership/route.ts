import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { seasonDates } from "@/lib/social"
import { activePartyOf, seasonOver, IN_A_PARTY } from "@/lib/partyServer"

// Your own membership in a party: "active", "pending", or null (declined,
// removed, or the party is gone). Lets a pending request learn its answer.
export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`group-membership-get:${ip}`, { maxRequests: 40, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const groupId = Number(new URL(req.url).searchParams.get('groupId'))
  if (!groupId) return NextResponse.json({ error: "Missing groupId" }, { status: 400 })

  const { data } = await supabaseAdmin.from('group_members')
    .select('status').eq('group_id', groupId).eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ status: data?.status ?? null })
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

  if (body.action === 'join') {
    const { data: group } = await supabaseAdmin.from('study_groups')
      .select('*').eq('invite_code', String(body.invite_code || '').trim()).maybeSingle()
    if (!group) return NextResponse.json({ error: "Invalid code" }, { status: 404 })
    if (group.status !== 'active' || seasonOver(group)) return NextResponse.json({ error: "This party's season is over" }, { status: 400 })

    // Already in (or already asked): don't downgrade an active member to pending.
    const { data: existing } = await supabaseAdmin.from('group_members')
      .select('status').eq('group_id', group.id).eq('user_id', user.id).maybeSingle()
    if (existing) return NextResponse.json({ ok: true, groupId: group.id, status: existing.status })

    // One active party per player.
    if (await activePartyOf(user.id)) return NextResponse.json({ error: IN_A_PARTY }, { status: 409 })

    const { count } = await supabaseAdmin.from('group_members')
      .select('id', { count: 'exact', head: true }).eq('group_id', group.id).eq('status', 'active')
    if ((count ?? 0) >= group.max_members) return NextResponse.json({ error: "Group full" }, { status: 400 })

    const { error } = await supabaseAdmin.from('group_members')
      .upsert({ group_id: group.id, user_id: user.id, role: 'member', status: 'pending' },
              { onConflict: 'group_id,user_id' })
    if (error) return NextResponse.json({ error: "Could not join" }, { status: 500 })
    return NextResponse.json({ ok: true, groupId: group.id, status: 'pending' })
  }

  if (body.action === 'approve' || body.action === 'decline') {
    const { data: group } = await supabaseAdmin.from('study_groups')
      .select('owner_id, max_members').eq('id', body.groupId).single()
    if (!group || group.owner_id !== user.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    if (body.action === 'approve') {
      const { count } = await supabaseAdmin.from('group_members')
        .select('id', { count: 'exact', head: true }).eq('group_id', body.groupId).eq('status', 'active')
      if ((count ?? 0) >= group.max_members) return NextResponse.json({ error: "Group full" }, { status: 400 })
      // They joined another party while waiting: drop the stale request.
      if (await activePartyOf(String(body.userId), Number(body.groupId))) {
        await supabaseAdmin.from('group_members').delete()
          .eq('group_id', body.groupId).eq('user_id', body.userId).eq('status', 'pending')
        return NextResponse.json({ error: "They already joined another party." }, { status: 409 })
      }
      await supabaseAdmin.from('group_members').update({ status: 'active' })
        .eq('group_id', body.groupId).eq('user_id', body.userId)
    } else {
      await supabaseAdmin.from('group_members').delete()
        .eq('group_id', body.groupId).eq('user_id', body.userId).eq('status', 'pending')
    }
    return NextResponse.json({ ok: true })
  }

  // Owner removes a member (never themselves — they end the party instead).
  if (body.action === 'remove') {
    const { data: group } = await supabaseAdmin.from('study_groups')
      .select('owner_id').eq('id', body.groupId).single()
    if (!group || group.owner_id !== user.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    if (!body.userId || body.userId === user.id) return NextResponse.json({ error: "You can't remove yourself" }, { status: 400 })
    await supabaseAdmin.from('group_members').delete().eq('group_id', body.groupId).eq('user_id', body.userId)
    return NextResponse.json({ ok: true })
  }

  // Owner starts a new season: today + 3 months, active again.
  if (body.action === 'renew') {
    const { data: group } = await supabaseAdmin.from('study_groups')
      .select('owner_id, status').eq('id', body.groupId).single()
    if (!group || group.owner_id !== user.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    const groupId = Number(body.groupId)
    if (await activePartyOf(user.id, groupId)) return NextResponse.json({ error: IN_A_PARTY }, { status: 409 })
    const { error } = await supabaseAdmin.from('study_groups')
      .update({ ...seasonDates(), status: 'active' }).eq('id', groupId)
    if (error) return NextResponse.json({ error: "Could not renew" }, { status: 500 })
    // Reviving a finished party: members who moved on to another party stay there.
    if (group.status !== 'active') {
      const { data: members } = await supabaseAdmin.from('group_members')
        .select('user_id').eq('group_id', groupId).eq('status', 'active').neq('user_id', user.id)
      for (const m of members ?? []) {
        if (await activePartyOf(m.user_id, groupId)) {
          await supabaseAdmin.from('group_members').delete().eq('group_id', groupId).eq('user_id', m.user_id)
        }
      }
    }
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'leave') {
    const { data: group } = await supabaseAdmin.from('study_groups')
      .select('owner_id').eq('id', body.groupId).single()
    if (group?.owner_id === user.id) return NextResponse.json({ error: "Owner can't leave" }, { status: 400 })
    await supabaseAdmin.from('group_members').delete().eq('group_id', body.groupId).eq('user_id', user.id)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'disband') {
    const { data: group } = await supabaseAdmin.from('study_groups')
      .select('owner_id').eq('id', body.groupId).single()
    if (!group || group.owner_id !== user.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    // Members, weekly totals and trees cascade with the group.
    await supabaseAdmin.from('study_groups').delete().eq('id', body.groupId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
