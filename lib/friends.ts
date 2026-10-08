// Friends — real friendships via /api/friends (friendships table).
import { apiFetch } from "./apiFetch"
import { supabase } from "./supabase"
import { colorFor } from "./party"
import { parseFriendCode } from "./social"

export interface Friend {
  friendshipId: number
  userId: string
  username: string
  level: number | null
  color: string
}

export type FriendsState =
  | { kind: "signed-out" }
  | { kind: "ok"; me: string | null; code: string | null; friends: Friend[]; incoming: Friend[]; outgoing: Friend[] }

type Row = { friendshipId: number; user_id: string; username?: string | null; level?: number | null }
const toFriend = (r: Row): Friend => {
  const username = r.username || "writer"
  return { friendshipId: r.friendshipId, userId: r.user_id, username, level: r.level ?? null, color: colorFor(username) }
}

function changed() {
  try { window.dispatchEvent(new Event("pulp-friends-change")) } catch {}
}

async function errorOf(res: Response, fallback: string): Promise<string> {
  const d = await res.json().catch(() => ({}))
  return d.error || fallback
}

export async function loadFriends(): Promise<FriendsState> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { kind: "signed-out" }

  const [res, meRes] = await Promise.all([apiFetch("/api/friends"), apiFetch("/api/profile/identity")])
  if (res.status === 401) return { kind: "signed-out" }
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't load friends"))
  const d = await res.json()
  const identity = meRes.ok ? await meRes.json() : {}
  return {
    kind: "ok",
    me: identity.username ?? null,
    code: identity.friend_code ?? null,
    friends: (d.friends || []).map(toFriend).sort((a: Friend, b: Friend) => a.username.localeCompare(b.username)),
    incoming: (d.incoming || []).map(toFriend),
    outgoing: (d.outgoing || []).map(toFriend),
  }
}

// Sends a request by @username or friend code (#PULP-XXXX, as shown in
// Settings), or accepts theirs if they already asked you.
export async function addFriend(input: string): Promise<"pending" | "accepted"> {
  const code = parseFriendCode(input)
  const username = (input ?? "").trim().replace(/^@/, "").toLowerCase()
  if (!code && !/^[a-z0-9_]{3,20}$/.test(username)) throw new Error("Use an @username or a PULP- friend code")
  const res = await apiFetch("/api/friends", {
    method: "POST",
    body: JSON.stringify(code ? { action: "request", friend_code: code } : { action: "request", username }),
  })
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't send the request"))
  const d = await res.json()
  changed()
  return d.status === "accepted" ? "accepted" : "pending"
}

export async function answerFriend(friendshipId: number, accept: boolean): Promise<void> {
  const res = await apiFetch("/api/friends", { method: "POST", body: JSON.stringify({ action: accept ? "accept" : "decline", friendshipId }) })
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't update the request"))
  changed()
}

// Unfriend, or cancel a request you sent.
export async function removeFriend(friendshipId: number): Promise<void> {
  const res = await apiFetch("/api/friends", { method: "POST", body: JSON.stringify({ action: "remove", friendshipId }) })
  if (!res.ok) throw new Error(await errorOf(res, "Couldn't remove"))
  changed()
}
