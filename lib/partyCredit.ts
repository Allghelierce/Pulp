// Credit a focus report to a party member (POST /api/groups/report). Takes the
// DB client as a parameter so tests can run it against a fake.
import type { SupabaseClient } from "@supabase/supabase-js"
import { creditFor } from "./social"

export interface FocusReport {
  groupId: number
  userId: string
  week: string    // group_weekly.week_start (Monday)
  minutes: number // already bounded by parseReportMinutes
  cap: number     // most this player may have this week (weekCapAt)
}

type DbError = { code?: string; message: string }

// The RPC isn't there yet (migration not applied): PostgREST can't find it.
export const isMissingRpc = (e: DbError) => e.code === 'PGRST202' || e.code === '42883'

let warnedMissing = false

// Minutes actually credited (0 = capped for today), or null when they aren't an
// active member. Throws on a DB error.
//
// party_report_focus (supabase/migrations/20261009_social_hardening.sql) does it
// in one locked step, so parallel reports add up instead of overwriting each
// other. Until that's applied, a compare-and-swap path with the same rules.
export async function creditFocus(db: SupabaseClient, r: FocusReport): Promise<number | null> {
  const { data, error } = await db.rpc('party_report_focus', {
    p_group: r.groupId, p_user: r.userId, p_week: r.week, p_minutes: r.minutes, p_cap: r.cap,
  })
  if (!error) return data == null ? null : Number(data)
  if (!isMissingRpc(error)) throw new Error(`party_report_focus: ${error.message}`)
  if (!warnedMissing) {
    warnedMissing = true
    console.warn('party_report_focus is missing; crediting focus without it. Apply supabase/migrations/20261009_social_hardening.sql.')
  }
  return creditFocusFallback(db, r)
}

const TRIES = 5

// Each write only lands if the row still holds what we read; otherwise read
// again. A new week row that a parallel report created first is a unique
// violation (23505), also a re-read.
async function creditFocusFallback(db: SupabaseClient, r: FocusReport): Promise<number | null> {
  for (let i = 0; i < TRIES; i++) {
    const { data: member, error: mErr } = await db.from('group_members')
      .select('status').eq('group_id', r.groupId).eq('user_id', r.userId).maybeSingle()
    if (mErr) throw new Error(`group_members: ${mErr.message}`)
    if (member?.status !== 'active') return null

    const { data: rows, error } = await db.from('group_weekly')
      .select('id, group_id, focus_minutes').eq('user_id', r.userId).eq('week_start', r.week)
    if (error) throw new Error(`group_weekly: ${error.message}`)
    const week = (rows ?? []) as { id: number; group_id: number; focus_minutes: number }[]
    const credit = creditFor(r.minutes, week.reduce((sum, w) => sum + (w.focus_minutes || 0), 0), r.cap)
    if (credit === 0) return 0

    const mine = week.find(w => w.group_id === r.groupId)
    if (mine) {
      const { data: hit, error } = await db.from('group_weekly')
        .update({ focus_minutes: mine.focus_minutes + credit })
        .eq('id', mine.id).eq('focus_minutes', mine.focus_minutes).select('id')
      if (error) throw new Error(`group_weekly: ${error.message}`)
      if (!hit?.length) continue
    } else {
      const { error } = await db.from('group_weekly')
        .insert({ group_id: r.groupId, user_id: r.userId, week_start: r.week, focus_minutes: credit })
      if (error?.code === '23505') continue
      if (error) throw new Error(`group_weekly: ${error.message}`)
    }
    await addToTotal(db, r, credit)
    return credit
  }
  throw new Error('creditFocus: too many reports at once')
}

// group_members.focus_minutes_total (lifetime in this party), same swap.
async function addToTotal(db: SupabaseClient, r: FocusReport, credit: number): Promise<void> {
  for (let i = 0; i < TRIES; i++) {
    const { data: m, error } = await db.from('group_members')
      .select('focus_minutes_total').eq('group_id', r.groupId).eq('user_id', r.userId).maybeSingle()
    if (error) throw new Error(`group_members: ${error.message}`)
    if (!m) return // they left meanwhile
    const { data: hit, error: uErr } = await db.from('group_members')
      .update({ focus_minutes_total: (m.focus_minutes_total || 0) + credit })
      .eq('group_id', r.groupId).eq('user_id', r.userId).eq('focus_minutes_total', m.focus_minutes_total).select('id')
    if (uErr) throw new Error(`group_members: ${uErr.message}`)
    if (hit?.length) return
  }
  throw new Error('creditFocus: too many reports at once')
}
