// Party — a small real study group (study_groups) raced on weekly focus minutes.
// Backed by /api/groups; the invite code is made by the server on create.
import { apiFetch } from "./apiFetch"
import { supabase } from "./supabase"

export const PARTY_CAP = 5
const ID_KEY = "pulp-party-id"           // current party's group id (for focus reporting)
const PENDING_KEY = "pulp-party-pending" // { groupId, code } while waiting for the owner
const EVER_KEY = "pulp-party-ever"

export interface PartyMember {
  id: string
  username: string
  color: string
  weeklyMinutes: number
  isYou: boolean
  isOwner: boolean
}

export interface PartyRequest { userId: string; username: string }

export interface Party {
  id: number
  code: string
  name: string
  isOwner: boolean
  members: PartyMember[]
  requests: PartyRequest[] // join requests (owner only)
}

export type PartyState =
  | { kind: "signed-out" }
  | { kind: "none" }
  | { kind: "pending"; code: string }
  | { kind: "in"; party: Party; me: { id: string; username: string } }

const COLORS = ["#e2725b", "#6ea8fe", "#7bb661", "#c77dff", "#f4a261", "#48cae4", "#ff8fab"]
export function colorFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

function read<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : null } catch { return null }
}
function write(key: string, value: unknown) {
  try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)) } catch {}
}
function changed() {
  try { window.dispatchEvent(new Event("pulp-party-change")) } catch {}
}

export function hasJoinedBefore(): boolean {
  try { return localStorage.getItem(EVER_KEY) === "1" } catch { return true }
}
function markJoined() {
  try { localStorage.setItem(EVER_KEY, "1") } catch {}
}

async function myUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user.id ?? null
}

async function errorOf(res: Response, fallback: string): Promise<string> {
  const d = await res.json().catch(() => ({}))
  return d.error || fallback
}

export async function loadParty(): Promise<PartyState> {
  const uid = await myUserId()
  if (!uid) return { kind: "signed-out" }

  const res = await apiFetch("/api/groups")
  if (res.status === 401) return { kind: "signed-out" }
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't load your party"))
  const groups = ((await res.json()).groups || []) as { id: number; status: string }[]
  const active = groups.filter(g => g.status === "active").sort((a, b) => b.id - a.id)

  if (active.length === 0) {
    write(ID_KEY, null)
    const pending = read<{ groupId: number; code: string }>(PENDING_KEY)
    return pending ? { kind: "pending", code: pending.code } : { kind: "none" }
  }

  // Newest active group is the party. Approved from pending? Clear the wait.
  const id = active[0].id
  write(ID_KEY, id)
  write(PENDING_KEY, null)
  markJoined()

  const [detailRes, boardRes] = await Promise.all([
    apiFetch(`/api/groups?id=${id}`),
    apiFetch(`/api/groups/leaderboard?id=${id}`),
  ])
  if (!detailRes.ok) throw new Error(await errorOf(detailRes, "Couldn't load your party"))
  const detail = await detailRes.json()
  const board = boardRes.ok ? await boardRes.json() : { weekly: [] }
  const weekly: Record<string, number> = {}
  for (const w of board.weekly || []) weekly[w.user_id] = w.focus_minutes || 0

  const group = detail.group
  const rows = (detail.members || []) as { user_id: string; status: string; role: string; username?: string | null }[]
  const name = (r: { user_id: string; username?: string | null }) => r.username || "writer"
  const members: PartyMember[] = rows.filter(r => r.status === "active").map(r => ({
    id: r.user_id,
    username: name(r),
    color: colorFor(name(r)),
    weeklyMinutes: weekly[r.user_id] || 0,
    isYou: r.user_id === uid,
    isOwner: r.user_id === group.owner_id,
  }))
  const isOwner = group.owner_id === uid
  const requests = isOwner
    ? rows.filter(r => r.status === "pending").map(r => ({ userId: r.user_id, username: name(r) }))
    : []
  const meRow = members.find(m => m.isYou)

  return {
    kind: "in",
    party: { id, code: group.invite_code, name: group.name, isOwner, members, requests },
    me: { id: uid, username: meRow?.username || "you" },
  }
}

export async function createParty(name: string): Promise<void> {
  const start = new Date()
  const end = new Date(start)
  end.setMonth(end.getMonth() + 3) // groups run a term; 3 months fits the 4-month cap
  const res = await apiFetch("/api/groups", {
    method: "POST",
    body: JSON.stringify({
      name: name.trim(),
      term_start: start.toISOString().slice(0, 10),
      term_end: end.toISOString().slice(0, 10),
      max_members: PARTY_CAP,
    }),
  })
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't create the party"))
  markJoined()
  changed()
}

// Joining asks the owner; returns "active" if you were already in.
export async function joinParty(code: string): Promise<"pending" | "active"> {
  const clean = code.trim().toUpperCase()
  const res = await apiFetch("/api/groups/membership", {
    method: "POST",
    body: JSON.stringify({ action: "join", invite_code: clean }),
  })
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't join"))
  const d = await res.json()
  if (d.status !== "active") write(PENDING_KEY, { groupId: d.groupId, code: clean })
  markJoined()
  changed()
  return d.status === "active" ? "active" : "pending"
}

export async function cancelJoin(): Promise<void> {
  const pending = read<{ groupId: number }>(PENDING_KEY)
  if (pending) {
    await apiFetch("/api/groups/membership", { method: "POST", body: JSON.stringify({ action: "leave", groupId: pending.groupId }) })
  }
  write(PENDING_KEY, null)
  changed()
}

export async function answerRequest(groupId: number, userId: string, approve: boolean): Promise<void> {
  const res = await apiFetch("/api/groups/membership", {
    method: "POST",
    body: JSON.stringify({ action: approve ? "approve" : "decline", groupId, userId }),
  })
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't update the request"))
  changed()
}

// Members leave; the owner ends the party for everyone.
export async function leaveParty(party: Party): Promise<void> {
  const res = await apiFetch("/api/groups/membership", {
    method: "POST",
    body: JSON.stringify({ action: party.isOwner ? "disband" : "leave", groupId: party.id }),
  })
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't leave"))
  write(ID_KEY, null)
  changed()
}

// Credit a finished focus session to your party. Skips the group the
// session was already reported to (VitalitySystem's activeGroupId).
export function recordFocus(minutes: number, alreadyReportedGroupId?: number | null) {
  const id = read<number>(ID_KEY)
  const mins = Math.round(minutes)
  if (!id || mins < 1 || id === alreadyReportedGroupId) return
  apiFetch("/api/groups/report", { method: "POST", body: JSON.stringify({ groupId: id, minutes: mins }) })
    .then(() => changed())
    .catch(() => {})
}

// Standings sorted high → low, with rank attached.
export function standings(p: Party): (PartyMember & { rank: number })[] {
  return [...p.members]
    .sort((a, b) => b.weeklyMinutes - a.weeklyMinutes || a.username.localeCompare(b.username))
    .map((m, i) => ({ ...m, rank: i + 1 }))
}
