import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { validateUsername, generateFriendCode, escapeLike } from "@/lib/social"

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`username:${ip}`, { maxRequests: 10, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const v = validateUsername(body.username ?? '')
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
  const school = typeof body.school === 'string' ? body.school.trim().slice(0, 80) : null
  const grade = typeof body.grade === 'string' ? body.grade.trim().slice(0, 40) : null

  // Uniqueness (case-insensitive) excluding self.
  const { data: existing } = await supabaseAdmin
    .from('player_profiles')
    .select('user_id')
    .ilike('username', escapeLike(v.value))
    .maybeSingle()
  if (existing && existing.user_id !== user.id) {
    return NextResponse.json({ error: "Username taken" }, { status: 409 })
  }

  // Ensure a friend code (generate-and-retry on the rare unique collision).
  const { data: current } = await supabaseAdmin
    .from('player_profiles').select('friend_code').eq('user_id', user.id).single()
  let friendCode = current?.friend_code as string | null
  if (!friendCode) {
    for (let attempt = 0; attempt < 5 && !friendCode; attempt++) {
      const candidate = generateFriendCode()
      const { error } = await supabaseAdmin.from('player_profiles')
        .update({ friend_code: candidate }).eq('user_id', user.id)
      if (!error) friendCode = candidate
    }
  }

  const { error } = await supabaseAdmin.from('player_profiles')
    .update({ username: v.value, school, ...(grade ? { grade } : {}) }).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 })

  return NextResponse.json({ username: v.value, friend_code: friendCode, grade })
}
