import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getRateLimitKey, checkRateLimit } from "@/lib/rateLimit"
import { getWeekStart, LEAGUE_TIERS, TIER_REWARDS, getRewardForPlacement } from "@/lib/leagues"
import type { LeagueTier } from "@/lib/leagues"

const LEAGUE_SIZE = 50

export async function GET(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`league:${ip}`, { maxRequests: 30, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const weekStart = getWeekStart()

  const { data: standing } = await supabaseAdmin
    .from('league_standings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!standing) {
    const league = await findOrCreateLeague('bronze', weekStart)
    await joinLeague(user.id, league.id)
    await supabaseAdmin.from('league_standings').upsert({
      user_id: user.id,
      current_tier: 'bronze',
      current_league_id: league.id,
      total_weeks: 1,
      best_tier: 'bronze',
    })
    return getLeagueResponse(user.id, league.id, 'bronze', weekStart)
  }

  if (standing.current_league_id) {
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', standing.current_league_id)
      .single()

    if (league && league.week_start === weekStart) {
      return getLeagueResponse(user.id, league.id, standing.current_tier, weekStart)
    }
  }

  const league = await findOrCreateLeague(standing.current_tier as LeagueTier, weekStart)
  await joinLeague(user.id, league.id)
  await supabaseAdmin.from('league_standings').update({
    current_league_id: league.id,
    total_weeks: (standing.total_weeks || 0) + 1,
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  return getLeagueResponse(user.id, league.id, standing.current_tier, weekStart)
}

export async function POST(req: Request) {
  const ip = getRateLimitKey(req)
  if (!checkRateLimit(`league-update:${ip}`, { maxRequests: 20, windowMs: 60000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { focus_minutes, display_name, avatar_color, level } = body

  const weekStart = getWeekStart()
  const { data: standing } = await supabaseAdmin
    .from('league_standings')
    .select('current_league_id')
    .eq('user_id', user.id)
    .single()

  if (!standing?.current_league_id) {
    return NextResponse.json({ error: "Not in a league" }, { status: 400 })
  }

  const update: Record<string, any> = {}
  if (typeof focus_minutes === 'number') update.focus_minutes = focus_minutes
  if (display_name) update.display_name = display_name
  if (avatar_color) update.avatar_color = avatar_color
  if (typeof level === 'number') update.level = level

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  await supabaseAdmin
    .from('league_members')
    .update(update)
    .eq('league_id', standing.current_league_id)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}

async function findOrCreateLeague(tier: LeagueTier, weekStart: string) {
  const { data: existing } = await supabaseAdmin
    .from('leagues')
    .select('id')
    .eq('tier', tier)
    .eq('week_start', weekStart)

  if (existing?.length) {
    for (const league of existing) {
      const { count } = await supabaseAdmin
        .from('league_members')
        .select('id', { count: 'exact', head: true })
        .eq('league_id', league.id)

      if ((count ?? 0) < LEAGUE_SIZE) return league
    }
  }

  const { data: newLeague } = await supabaseAdmin
    .from('leagues')
    .insert({ tier, week_start: weekStart })
    .select('id')
    .single()

  return newLeague!
}

async function joinLeague(userId: string, leagueId: number) {
  const { data: profile } = await supabaseAdmin
    .from('player_profiles')
    .select('xp')
    .eq('user_id', userId)
    .single()

  const level = profile?.xp ? Math.floor(Math.sqrt(profile.xp / 100)) + 1 : 1

  await supabaseAdmin.from('league_members').upsert({
    league_id: leagueId,
    user_id: userId,
    display_name: 'Writer',
    level,
    focus_minutes: 0,
    trees_grown: 0,
  }, { onConflict: 'league_id,user_id' })
}

async function getLeagueResponse(userId: string, leagueId: number, tier: string, weekStart: string) {
  const { data: members } = await supabaseAdmin
    .from('league_members')
    .select('user_id, display_name, avatar_color, level, focus_minutes, trees_grown')
    .eq('league_id', leagueId)
    .order('focus_minutes', { ascending: false })

  const memberList = members || []
  const userIdx = memberList.findIndex(m => m.user_id === userId)
  const tierConfig = LEAGUE_TIERS

  const tierIdx = tierConfig.indexOf(tier as LeagueTier)
  const promoteCount = tier === 'diamond' ? 0 : [5, 5, 5, 3, 0][tierIdx]
  const demoteCount = tier === 'bronze' ? 0 : [0, 5, 5, 5, 3][tierIdx]

  return NextResponse.json({
    league_id: leagueId,
    tier,
    week_start: weekStart,
    members: memberList,
    user_rank: userIdx >= 0 ? userIdx + 1 : null,
    user_focus: userIdx >= 0 ? memberList[userIdx].focus_minutes : 0,
    promote_count: promoteCount,
    demote_count: demoteCount,
  })
}
