// Server-only Party rules (study_groups): seasons end on time, and a player
// is in at most one active party.
import { supabaseAdmin } from "./supabase-server"
import { seasonOverAt } from "./social"

export const seasonOver = (group: { term_end: string }) => seasonOverAt(group.term_end) <= Date.now()

// Archive a party whose season is over. Mutates and returns the row.
export async function archiveIfExpired<T extends { id: number; status: string; term_end: string }>(group: T): Promise<T> {
  if (group.status === 'active' && seasonOver(group)) {
    await supabaseAdmin.from('study_groups').update({ status: 'archived' }).eq('id', group.id)
    group.status = 'archived'
  }
  return group
}

// The id of an active party this user already belongs to (ignoring `except`), or null.
export async function activePartyOf(userId: string, except?: number): Promise<number | null> {
  const { data } = await supabaseAdmin.from('group_members')
    .select('study_groups(id, status, term_end)').eq('user_id', userId).eq('status', 'active')
  type Group = { id: number; status: string; term_end: string }
  for (const row of (data ?? []) as unknown as { study_groups: Group | Group[] | null }[]) {
    // Many-to-one embeds come back as an object (typed as an array without generated types).
    const g = Array.isArray(row.study_groups) ? row.study_groups[0] : row.study_groups
    if (g && g.id !== except && g.status === 'active' && !seasonOver(g)) return g.id
  }
  return null
}

export const IN_A_PARTY = "You're already in a party. Leave it first to join another."
