import { NextResponse } from "next/server"
import { ilikeExact } from "@/lib/usernames"
import { parseFriendCode, parseId } from "@/lib/social"
import { must, guarded } from "@/lib/partyServer"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"

// Hydrate a set of user_ids into public profile cards.
async function profiles(ids: string[]) {
  if (ids.length === 0) return {} as Record<string, any>
  const data = must(await supabaseAdmin
    .from('player_profiles')
    .select('user_id, username, level, friend_code')
    .in('user_id', ids), 'profiles')
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

  return guarded("load your friends", async () => {
    // An empty list would read as "no friends", so a failed lookup is a 500.
    const rows = must(await supabaseAdmin
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`), 'friendships')

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
  })
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
  if (!body || typeof body !== 'object') return NextResponse.json({ error: "Bad input" }, { status: 400 })

  return guarded("update your friends", async () => {
    if (body.action === 'request') {
      // Resolve target by friend_code or username.
      let target: any = null
      if (typeof body.friend_code === 'string') {
        const code = parseFriendCode(body.friend_code)
        if (!code) return NextResponse.json({ error: "That isn't a friend code" }, { status: 400 })
        target = must(await supabaseAdmin.from('player_profiles')
          .select('user_id').eq('friend_code', code).maybeSingle(), 'profile')
      } else if (typeof body.username === 'string') {
        target = must(await supabaseAdmin.from('player_profiles')
          .select('user_id').ilike('username', ilikeExact(body.username.trim())).maybeSingle(), 'profile')
      }
      if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
      if (target.user_id === user.id) return NextResponse.json({ error: "That's you" }, { status: 400 })

      // If they already requested me, accept instead.
      const reverse = must(await supabaseAdmin.from('friendships')
        .select('id').eq('requester_id', target.user_id).eq('addressee_id', user.id).maybeSingle(), 'friendship')
      if (reverse) {
        must(await supabaseAdmin.from('friendships').update({ status: 'accepted' }).eq('id', reverse.id), 'accept')
        return NextResponse.json({ ok: true, status: 'accepted' })
      }

      const forward = must(await supabaseAdmin.from('friendships')
        .select('id, status').eq('requester_id', user.id).eq('addressee_id', target.user_id).maybeSingle(), 'friendship')
      if (forward) return NextResponse.json({ ok: true, status: forward.status })

      const { error } = await supabaseAdmin.from('friendships')
        .upsert({ requester_id: user.id, addressee_id: target.user_id, status: 'pending' },
                { onConflict: 'requester_id,addressee_id' })
      if (error) return NextResponse.json({ error: "Could not send" }, { status: 500 })
      return NextResponse.json({ ok: true, status: 'pending' })
    }

    const friendshipId = parseId(body.friendshipId)
    if (body.action === 'accept' || body.action === 'decline') {
      const row = friendshipId && must(await supabaseAdmin.from('friendships')
        .select('*').eq('id', friendshipId).maybeSingle(), 'friendship')
      if (!row || row.addressee_id !== user.id) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 })
      }
      if (body.action === 'accept') {
        must(await supabaseAdmin.from('friendships').update({ status: 'accepted' }).eq('id', row.id), 'accept')
      } else {
        must(await supabaseAdmin.from('friendships').delete().eq('id', row.id), 'decline')
      }
      return NextResponse.json({ ok: true })
    }

    if (body.action === 'remove') {
      const row = friendshipId && must(await supabaseAdmin.from('friendships')
        .select('*').eq('id', friendshipId).maybeSingle(), 'friendship')
      if (!row || (row.requester_id !== user.id && row.addressee_id !== user.id)) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 })
      }
      must(await supabaseAdmin.from('friendships').delete().eq('id', row.id), 'remove')
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  })
}
