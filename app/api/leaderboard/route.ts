import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getWeekStart } from "@/lib/leagues"

// School competition leaderboard — students ranked within their school by pulp gained this week.

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`leaderboard:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('player_profiles')
    .select('school')
    .eq('user_id', user.id)
    .single()

  if (!profile?.school) {
    return NextResponse.json({ needs_school: true })
  }

  return buildResponse(user.id, profile.school)
}

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`leaderboard-post:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { pulp, school, display_name, avatar_color, level, trees_grown } = body

  // Set / update the player's school if provided.
  if (typeof school === 'string' && school.trim()) {
    await supabaseAdmin
      .from('player_profiles')
      .upsert({ user_id: user.id, school: school.trim().slice(0, 80) }, { onConflict: 'user_id' })
  }

  const { data: profile } = await supabaseAdmin
    .from('player_profiles')
    .select('school')
    .eq('user_id', user.id)
    .single()

  if (!profile?.school) {
    return NextResponse.json({ needs_school: true })
  }

  const weekStart = getWeekStart()
  const pulpValue = typeof pulp === 'number' && pulp >= 0 ? Math.floor(pulp) : 0

  const { data: existing } = await supabaseAdmin
    .from('pulp_weekly')
    .select('id, pulp_start')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single()

  const fields: Record<string, any> = {
    school: profile.school,
    pulp_current: pulpValue,
    updated_at: new Date().toISOString(),
  }
  if (typeof display_name === 'string' && display_name.trim()) fields.display_name = display_name.trim().slice(0, 40)
  if (typeof avatar_color === 'string') fields.avatar_color = avatar_color
  if (typeof level === 'number') fields.level = level
  if (typeof trees_grown === 'number') fields.trees_grown = trees_grown

  if (existing) {
    // Keep the week's starting baseline; never let it rise above current.
    await supabaseAdmin.from('pulp_weekly').update(fields).eq('id', existing.id)
  } else {
    await supabaseAdmin.from('pulp_weekly').insert({
      user_id: user.id,
      week_start: weekStart,
      pulp_start: pulpValue,
      ...fields,
    })
  }

  return buildResponse(user.id, profile.school)
}

async function buildResponse(userId: string, school: string) {
  const weekStart = getWeekStart()

  const { data: rows } = await supabaseAdmin
    .from('pulp_weekly')
    .select('user_id, display_name, avatar_color, level, trees_grown, pulp_start, pulp_current')
    .eq('school', school)
    .eq('week_start', weekStart)

  const members = (rows || [])
    .map(r => ({
      user_id: r.user_id,
      display_name: r.display_name,
      avatar_color: r.avatar_color,
      level: r.level,
      trees_grown: r.trees_grown,
      pulp_delta: Math.max(0, (r.pulp_current ?? 0) - (r.pulp_start ?? 0)),
      pulp_current: r.pulp_current ?? 0,
    }))
    .sort((a, b) => b.pulp_delta - a.pulp_delta)

  const userIdx = members.findIndex(m => m.user_id === userId)

  return NextResponse.json({
    school,
    week_start: weekStart,
    members,
    user_rank: userIdx >= 0 ? userIdx + 1 : null,
    user_pulp: userIdx >= 0 ? members[userIdx].pulp_delta : 0,
  })
}
