import { supabase } from './supabase'

export const LEAGUE_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const
export type LeagueTier = typeof LEAGUE_TIERS[number]

export const TIER_CONFIG: Record<LeagueTier, { name: string; color: string; icon: string; promote: number; demote: number }> = {
  bronze:   { name: 'Bronze',   color: '#cd7f32', icon: '🥉', promote: 5, demote: 0 },
  silver:   { name: 'Silver',   color: '#9a9590', icon: '🥈', promote: 5, demote: 5 },
  gold:     { name: 'Gold',     color: '#d97706', icon: '🥇', promote: 5, demote: 5 },
  platinum: { name: 'Platinum', color: '#7cb3d4', icon: '💎', promote: 3, demote: 5 },
  diamond:  { name: 'Diamond',  color: '#b388ff', icon: '👑', promote: 0, demote: 3 },
}

export const TIER_REWARDS: Record<LeagueTier, number[]> = {
  bronze:   [10, 7, 5, 3, 2],
  silver:   [20, 14, 10, 7, 5],
  gold:     [35, 25, 18, 12, 8],
  platinum: [55, 40, 30, 20, 12],
  diamond:  [80, 60, 45, 30, 20],
}

export function getWeekStart(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

export function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

export function getRewardForPlacement(tier: LeagueTier, placement: number): number {
  const rewards = TIER_REWARDS[tier]
  if (placement <= 1) return rewards[0]
  if (placement <= 3) return rewards[1]
  if (placement <= 5) return rewards[2]
  if (placement <= 10) return rewards[3]
  if (placement <= 25) return rewards[4]
  return 0
}

export interface LeagueMember {
  user_id: string
  display_name: string
  avatar_color: string
  level: number
  focus_minutes: number
  trees_grown: number
}

export interface LeagueData {
  league_id: number
  tier: LeagueTier
  week_start: string
  members: LeagueMember[]
  user_rank: number | null
  user_focus: number
}

export async function getUserStanding(userId: string) {
  const { data } = await supabase
    .from('league_standings')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function getCurrentLeague(userId: string): Promise<LeagueData | null> {
  const weekStart = getWeekStart()

  const standing = await getUserStanding(userId)
  if (!standing?.current_league_id) return null

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', standing.current_league_id)
    .single()

  if (!league || league.week_start !== weekStart) return null

  const { data: members } = await supabase
    .from('league_members')
    .select('user_id, display_name, avatar_color, level, focus_minutes, trees_grown')
    .eq('league_id', league.id)
    .order('focus_minutes', { ascending: false })

  const memberList = members || []
  const userIdx = memberList.findIndex(m => m.user_id === userId)

  return {
    league_id: league.id,
    tier: league.tier as LeagueTier,
    week_start: league.week_start,
    members: memberList,
    user_rank: userIdx >= 0 ? userIdx + 1 : null,
    user_focus: userIdx >= 0 ? memberList[userIdx].focus_minutes : 0,
  }
}
