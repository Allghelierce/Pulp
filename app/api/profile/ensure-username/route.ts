import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { generateFriendCode } from "@/lib/social"
import { generateUsername, ilikeExact } from "@/lib/usernames"

// Every account gets a name the moment it exists: if the profile has no username,
// assign a generated one ("ClammyElm823"), flagged so it can be renamed for free.
export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`ensure-username:${ip}`, { maxRequests: 10, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('player_profiles').select('username, friend_code, identity_changed_at').eq('user_id', user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 404 })
  if (profile.username) return NextResponse.json({ username: profile.username, friend_code: profile.friend_code, auto: false })

  let username: string | null = null
  for (let i = 0; i < 12 && !username; i++) {
    const candidate = generateUsername()
    const { data: taken } = await supabaseAdmin.from('player_profiles').select('user_id').ilike('username', ilikeExact(candidate)).maybeSingle()
    if (!taken) username = candidate
  }
  if (!username) return NextResponse.json({ error: "Could not pick a name" }, { status: 500 })

  const changed = { ...((profile.identity_changed_at ?? {}) as Record<string, string>), username_auto: '1' }
  let friendCode = profile.friend_code as string | null
  for (let i = 0; i < 5; i++) {
    const { error } = await supabaseAdmin.from('player_profiles')
      .update({ username, identity_changed_at: changed, ...(friendCode ? {} : { friend_code: generateFriendCode() }) })
      .eq('user_id', user.id).is('username', null)
    if (!error) break
    friendCode = null // friend code collided (unique) — try a new one
  }
  const { data: after } = await supabaseAdmin.from('player_profiles').select('username, friend_code').eq('user_id', user.id).single()
  return NextResponse.json({ username: after?.username, friend_code: after?.friend_code, auto: after?.username === username })
}
