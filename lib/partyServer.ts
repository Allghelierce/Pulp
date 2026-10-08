// Server-only Party rules (study_groups): seasons end on time, and a player
// is in at most one active party.
import { NextResponse } from "next/server"
import { supabaseAdmin } from "./supabase-server"
import { seasonOverAt, PARTY_CAP } from "./social"

export const seasonOver = (group: { term_end: string }) => seasonOverAt(group.term_end) <= Date.now()

// The cap is PARTY_CAP even if a row's max_members says more.
export const capOf = (group: { max_members: number | null }) => Math.min(group.max_members ?? PARTY_CAP, PARTY_CAP)

// A Supabase result's data; a DB error throws, and guarded() answers 500.
export function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`)
  return res.data
}

// Runs a route's body so any DB error is a clean 500, never a crash or a false "ok".
export async function guarded(what: string, body: () => Promise<Response>): Promise<Response> {
  try {
    return await body()
  } catch (e) {
    console.error(`${what}:`, e instanceof Error ? e.message : e)
    return NextResponse.json({ error: `Couldn't ${what}. Try again.` }, { status: 500 })
  }
}

// How many active members a party has. Throws on a DB error.
export async function countActive(groupId: number): Promise<number> {
  const { count, error } = await supabaseAdmin.from('group_members')
    .select('id', { count: 'exact', head: true }).eq('group_id', groupId).eq('status', 'active')
  if (error) throw new Error(`countActive: ${error.message}`)
  return count ?? 0
}

// Archive a party whose season is over. Mutates and returns the row. A failed
// archive is only logged: every rule also checks seasonOver(), and the next
// load tries again.
export async function archiveIfExpired<T extends { id: number; status: string; term_end: string }>(group: T): Promise<T> {
  if (group.status === 'active' && seasonOver(group)) {
    const { error } = await supabaseAdmin.from('study_groups').update({ status: 'archived' }).eq('id', group.id)
    if (error) console.error('archiveIfExpired:', error.message)
    group.status = 'archived'
  }
  return group
}

// The id of an active party this user already belongs to (ignoring `except`), or null.
// Throws when the lookup fails, so the one-party rule fails closed (a 500).
export async function activePartyOf(userId: string, except?: number): Promise<number | null> {
  const { data, error } = await supabaseAdmin.from('group_members')
    .select('study_groups(id, status, term_end)').eq('user_id', userId).eq('status', 'active')
  if (error) throw new Error(`activePartyOf: ${error.message}`)
  type Group = { id: number; status: string; term_end: string }
  for (const row of (data ?? []) as unknown as { study_groups: Group | Group[] | null }[]) {
    // Many-to-one embeds come back as an object (typed as an array without generated types).
    const g = Array.isArray(row.study_groups) ? row.study_groups[0] : row.study_groups
    if (g && g.id !== except && g.status === 'active' && !seasonOver(g)) return g.id
  }
  return null
}

export const IN_A_PARTY = "You're already in a party. Leave it first to join another."
