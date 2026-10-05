import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { escapeLike } from "@/lib/social"

// Hydrate a set of user_ids into public profile cards.
async function profiles(ids: string[]) {
  if (ids.length === 0) return {} as Record<string, any>
  const { data } = await supabaseAdmin
    .from('player_profiles')
    .select('user_id, username, level, friend_code')
    .in('user_id', ids)
  const map: Record<string, any> = {}
  for (const p of data ?? []) map[p.user_id] = p
  return map
}

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`friends-get:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: rows } = await supabaseAdmin
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const all = rows ?? []
  const otherId = (r: any) => (r.requester_id === user.id ? r.addressee_id : r.requester_id)
  const ids = Array.from(new Set(all.map(otherId)))
  const pmap = await profiles(ids)

  const friends = all.filter(r => r.status === 'accepted')
    .map(r => ({ friendshipId: r.id, ...pmap[otherId(r)] }))
  const incoming = all.filter(r => r.status === 'pending' && r.addressee_id === user.id)
    .map(r => ({ friendshipId: r.id, ...pmap[r.requester_id] }))
  const outgoing = all.filter(r => r.status === 'pending' && r.requester_id === user.id)
    .map(r => ({ friendshipId: r.id, ...pmap[r.addressee_id] }))

  return NextResponse.json({ friends, incoming, outgoing })
}

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`friends-post:${ip}`, { maxRequests: 20, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  if (body.action === 'request') {
    // Resolve target by friend_code or username.
    let target: any = null
    if (typeof body.friend_code === 'string') {
      const { data } = await supabaseAdmin.from('player_profiles')
        .select('user_id').eq('friend_code', body.friend_code.trim()).maybeSingle()
      target = data
    } else if (typeof body.username === 'string') {
      const { data } = await supabaseAdmin.from('player_profiles')
        .select('user_id').ilike('username', escapeLike(body.username.trim().replace(/^@/, ''))).maybeSingle()
      target = data
    }
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (target.user_id === user.id) return NextResponse.json({ error: "That's you" }, { status: 400 })

    // If they already requested me, accept instead.
    const { data: reverse } = await supabaseAdmin.from('friendships')
      .select('id').eq('requester_id', target.user_id).eq('addressee_id', user.id).maybeSingle()
    if (reverse) {
      await supabaseAdmin.from('friendships').update({ status: 'accepted' }).eq('id', reverse.id)
      return NextResponse.json({ ok: true, status: 'accepted' })
    }

    const { data: forward } = await supabaseAdmin.from('friendships')
      .select('id, status').eq('requester_id', user.id).eq('addressee_id', target.user_id).maybeSingle()
    if (forward) return NextResponse.json({ ok: true, status: forward.status })

    const { error } = await supabaseAdmin.from('friendships')
      .upsert({ requester_id: user.id, addressee_id: target.user_id, status: 'pending' },
              { onConflict: 'requester_id,addressee_id' })
    if (error) return NextResponse.json({ error: "Could not send" }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'pending' })
  }

  if (body.action === 'accept' || body.action === 'decline') {
    const { data: row } = await supabaseAdmin.from('friendships')
      .select('*').eq('id', body.friendshipId).single()
    if (!row || row.addressee_id !== user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }
    if (body.action === 'accept') {
      await supabaseAdmin.from('friendships').update({ status: 'accepted' }).eq('id', row.id)
    } else {
      await supabaseAdmin.from('friendships').delete().eq('id', row.id)
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
