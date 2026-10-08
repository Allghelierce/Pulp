// Party — a small real study group (study_groups) raced on focus minutes,
// one season (3-month term) at a time. Backed by /api/groups; the invite code
// is made by the server on create. A player is in at most one active party.
import { apiFetch } from "./apiFetch"
import { supabase } from "./supabase"
import { PARTY_CAP, seasonOverAt, parseInviteCode } from "./social"
import { TREE_TYPES } from "@/app/constants"

export { PARTY_CAP }
const ID_KEY = "pulp-party-id"           // current party's group id (for focus reporting)
const PENDING_KEY = "pulp-party-pending" // { groupId, code } while waiting for the owner
const DECLINED_KEY = "pulp-party-declined" // code of a request that was turned down, until the panel says so
const EVER_KEY = "pulp-party-ever"
const RECAP_DAYS = 14                    // a finished season's final standings show this long

export interface PartyMember {
  id: string
  username: string
  color: string
  weeklyMinutes: number
  termMinutes: number // this season
  weekTrees: number
  termTrees: number
  isYou: boolean
  isOwner: boolean
}

export interface PartyRequest { userId: string; username: string }
export interface PartyTree { type: string; stage: number; userId: string }

export interface Party {
  id: number
  code: string
  name: string
  isOwner: boolean
  termEnd: string     // YYYY-MM-DD, the season's last day
  members: PartyMember[]
  requests: PartyRequest[] // join requests (owner only)
  grove: PartyTree[]  // recent trees, newest first
}

// Final standings of a season that just ended.
export interface PartyRecap {
  id: number
  name: string
  termEnd: string
  isOwner: boolean
  standings: { id: string; username: string; color: string; minutes: number; trees: number; isYou: boolean; rank: number }[]
}

export type PartyState =
  | { kind: "signed-out" }
  | { kind: "none"; recap?: PartyRecap; declined?: string } // declined: code of a request the owner turned down
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

// Your membership in a party; undefined when we couldn't ask.
async function membershipStatus(groupId: number): Promise<"active" | "pending" | null | undefined> {
  try {
    const res = await apiFetch(`/api/groups/membership?groupId=${groupId}`)
    if (!res.ok) return undefined
    return (await res.json()).status ?? null
  } catch { return undefined }
}

type GroupRow = { id: number; status: string; name: string; owner_id: string; term_end: string }
type BoardRow = { user_id: string; username?: string | null; trees?: number }
type Board = { weekly: (BoardRow & { focus_minutes: number })[]; allTime: (BoardRow & { focus_minutes_total: number })[] }

// The newest party whose season ended in the last RECAP_DAYS days.
async function loadRecap(groups: GroupRow[], uid: string): Promise<PartyRecap | undefined> {
  const DAY = 86400000
  const ended = groups
    .filter(g => g.status !== "active" && Date.now() - seasonOverAt(g.term_end) < RECAP_DAYS * DAY)
    .sort((a, b) => b.id - a.id)[0]
  if (!ended) return undefined
  const res = await apiFetch(`/api/groups/leaderboard?id=${ended.id}`)
  if (!res.ok) return undefined
  const board = await res.json() as Board
  return {
    id: ended.id,
    name: ended.name,
    termEnd: ended.term_end,
    isOwner: ended.owner_id === uid,
    standings: (board.allTime || []).map((r, i) => {
      const username = r.username || "writer"
      return { id: r.user_id, username, color: colorFor(username), minutes: r.focus_minutes_total || 0, trees: r.trees || 0, isYou: r.user_id === uid, rank: i + 1 }
    }),
  }
}

export async function loadParty(): Promise<PartyState> {
  const uid = await myUserId()
  if (!uid) return { kind: "signed-out" }

  const res = await apiFetch("/api/groups")
  if (res.status === 401) return { kind: "signed-out" }
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't load your party"))
  const groups = ((await res.json()).groups || []) as GroupRow[]
  const active = groups.filter(g => g.status === "active").sort((a, b) => b.id - a.id)

  if (active.length === 0) {
    write(ID_KEY, null)
    const pending = read<{ groupId: number; code: string }>(PENDING_KEY)
    if (pending) {
      // Still waiting (or can't tell)? Keep waiting. Otherwise the owner said no,
      // or the party ended — stop waiting.
      const status = await membershipStatus(pending.groupId)
      if (status === "pending" || status === undefined) return { kind: "pending", code: pending.code }
      // The presence sync loads too; whichever load gets here first records the
      // answer, so a later one can't bring back a note the panel already showed.
      if (read<{ groupId: number }>(PENDING_KEY)?.groupId === pending.groupId) {
        write(PENDING_KEY, null)
        if (status === null) write(DECLINED_KEY, pending.code)
      }
    }
    // Kept until shown: the presence sync loads the party too, often first.
    const declined = read<string>(DECLINED_KEY) ?? undefined
    return { kind: "none", recap: await loadRecap(groups, uid).catch(() => undefined), declined }
  }

  // Newest active group is the party (the server allows only one). Approved from pending? Clear the wait.
  const id = active[0].id
  write(ID_KEY, id)
  write(PENDING_KEY, null)
  write(DECLINED_KEY, null)
  markJoined()

  const [detailRes, boardRes, groveRes] = await Promise.all([
    apiFetch(`/api/groups?id=${id}`),
    apiFetch(`/api/groups/leaderboard?id=${id}`),
    apiFetch(`/api/groups/grove?id=${id}`),
  ])
  if (!detailRes.ok) throw new Error(await errorOf(detailRes, "Couldn't load your party"))
  const detail = await detailRes.json()
  const board: Board = boardRes.ok ? await boardRes.json() : { weekly: [], allTime: [] }
  const week: Record<string, BoardRow & { focus_minutes: number }> = {}
  for (const w of board.weekly || []) week[w.user_id] = w
  const term: Record<string, BoardRow & { focus_minutes_total: number }> = {}
  for (const t of board.allTime || []) term[t.user_id] = t
  const groveRows = groveRes.ok ? ((await groveRes.json()).trees || []) as { type?: unknown; stage?: unknown; user_id: string }[] : []

  const group = detail.group
  const rows = (detail.members || []) as { user_id: string; status: string; role: string; username?: string | null }[]
  const name = (r: { user_id: string; username?: string | null }) => r.username || "writer"
  const members: PartyMember[] = rows.filter(r => r.status === "active").map(r => ({
    id: r.user_id,
    username: name(r),
    color: colorFor(name(r)),
    weeklyMinutes: week[r.user_id]?.focus_minutes || 0,
    termMinutes: term[r.user_id]?.focus_minutes_total || 0,
    weekTrees: week[r.user_id]?.trees || 0,
    termTrees: term[r.user_id]?.trees || 0,
    isYou: r.user_id === uid,
    isOwner: r.user_id === group.owner_id,
  }))
  const isOwner = group.owner_id === uid
  const requests = isOwner
    ? rows.filter(r => r.status === "pending").map(r => ({ userId: r.user_id, username: name(r) }))
    : []
  const grove = groveRows
    .filter(t => typeof t.type === "string" && Object.prototype.hasOwnProperty.call(TREE_TYPES, t.type))
    .map(t => ({ type: t.type as string, stage: typeof t.stage === "number" ? t.stage : 3, userId: t.user_id }))
  const meRow = members.find(m => m.isYou)

  return {
    kind: "in",
    party: { id, code: group.invite_code, name: group.name, isOwner, termEnd: group.term_end, members, requests, grove },
    me: { id: uid, username: meRow?.username || "you" },
  }
}

export async function createParty(name: string): Promise<void> {
  const res = await apiFetch("/api/groups", {
    method: "POST",
    body: JSON.stringify({ name: name.trim() }), // the server sets the season
  })
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't create the party"))
  markJoined()
  changed()
}

// Joining asks the owner; returns "active" if you were already in.
// Takes a code or a pasted invite link.
export async function joinParty(code: string): Promise<"pending" | "active"> {
  const clean = parseInviteCode(code)
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

// The panel showed the "wasn't accepted" note.
export function clearDeclined() { write(DECLINED_KEY, null) }

export async function cancelJoin(): Promise<void> {
  const pending = read<{ groupId: number }>(PENDING_KEY)
  if (pending) {
    await apiFetch("/api/groups/membership", { method: "POST", body: JSON.stringify({ action: "leave", groupId: pending.groupId }) })
  }
  write(PENDING_KEY, null)
  changed()
}

async function membership(action: string, fields: Record<string, unknown>, fallback: string): Promise<void> {
  const res = await apiFetch("/api/groups/membership", { method: "POST", body: JSON.stringify({ action, ...fields }) })
  if (!res.ok) {
    const error = await errorOf(res, fallback)
    if (res.status === 409) changed() // the list moved under us (e.g. a request went stale)
    throw new Error(error)
  }
  changed()
}

export const answerRequest = (groupId: number, userId: string, approve: boolean) =>
  membership(approve ? "approve" : "decline", { groupId, userId }, "Couldn't update the request")

// Owner only: take someone out of the party.
export const removeMember = (groupId: number, userId: string) =>
  membership("remove", { groupId, userId }, "Couldn't remove them")

// Owner only: start a new 3-month season (also revives a party whose season ended).
export const renewParty = (groupId: number) =>
  membership("renew", { groupId }, "Couldn't renew the season")

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

// Credit a finished focus session — and the tree it planted, if any — to your party.
export function recordFocus(minutes: number, tree?: { type: string; stage: number }) {
  const id = read<number>(ID_KEY)
  const mins = Math.round(minutes)
  if (!id || mins < 1) return
  apiFetch("/api/groups/report", { method: "POST", body: JSON.stringify({ groupId: id, minutes: mins, ...(tree ? { tree } : {}) }) })
    .then(() => changed())
    .catch(() => {})
}

export type StandingsMode = "week" | "term"
export const minutesIn = (m: PartyMember, mode: StandingsMode) => (mode === "week" ? m.weeklyMinutes : m.termMinutes)
export const treesIn = (m: PartyMember, mode: StandingsMode) => (mode === "week" ? m.weekTrees : m.termTrees)

// Standings sorted high → low, with rank attached.
export function standings(p: Party, mode: StandingsMode = "week"): (PartyMember & { rank: number })[] {
  return [...p.members]
    .sort((a, b) => minutesIn(b, mode) - minutesIn(a, mode) || a.username.localeCompare(b.username))
    .map((m, i) => ({ ...m, rank: i + 1 }))
}

// Whole days from today (local) to the season's last day; 0 = ends today,
// below 0 = your last day has passed but the season is still closing
// (it stays open until term_end is over everywhere on Earth).
export function seasonDaysLeft(termEnd: string, now: Date = new Date()): number {
  const [y, m, d] = termEnd.split("-").map(Number)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000)
}

export function seasonLabel(termEnd: string): string {
  const n = seasonDaysLeft(termEnd)
  return n < 0 ? "season ending" : n === 0 ? "season ends today" : n === 1 ? "season ends tomorrow" : `season ends in ${n}d`
}
