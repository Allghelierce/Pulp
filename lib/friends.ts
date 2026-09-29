// Friends — frontend-first MOCK layer (matches lib/party.ts).
// Persists to localStorage. Swap for the real /api/friends + friendships table later.
import { generateFriendCode, FRIEND_CODE_PREFIX } from "./social"

const KEY = "pulp-friends"
const CODE_KEY = "pulp-friend-code"

export interface Friend {
  id: string
  username: string
  color: string
}

const COLORS = ["#e2725b", "#6ea8fe", "#7bb661", "#c77dff", "#f4a261", "#48cae4", "#ff8fab"]

function colorFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

// Deterministic "online" that shifts every ~2 minutes so the list feels live.
export function isOnline(username: string): boolean {
  if (username === "you") return true
  const bucket = Math.floor(Date.now() / 120000)
  let h = bucket
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0
  return h % 3 !== 0 // ~66% online
}

export function getMyCode(): string {
  if (typeof window === "undefined") return FRIEND_CODE_PREFIX + "XXXX"
  try {
    let c = localStorage.getItem(CODE_KEY)
    if (!c) { c = generateFriendCode(); localStorage.setItem(CODE_KEY, c) }
    return c
  } catch { return FRIEND_CODE_PREFIX + "XXXX" }
}

export function getFriends(): Friend[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Friend[]
    // Seed a couple so it isn't empty on first open.
    const seed: Friend[] = [
      { id: "f-mona", username: "mona", color: colorFor("mona") },
      { id: "f-leo", username: "leo", color: colorFor("leo") },
    ]
    save(seed)
    return seed
  } catch { return [] }
}

function save(list: Friend[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    window.dispatchEvent(new Event("pulp-friends-change"))
  } catch {}
}

export type AddResult = { ok: true; friend: Friend } | { ok: false; error: string }

export function addFriend(input: string): AddResult {
  const raw = (input ?? "").trim()
  if (!raw) return { ok: false, error: "Enter a username or friend code" }

  // A code (PULP-XXXX) resolves to a mock username; otherwise treat as @username.
  const isCode = raw.toUpperCase().startsWith(FRIEND_CODE_PREFIX)
  const username = (isCode ? raw.toUpperCase().replace(FRIEND_CODE_PREFIX, "friend_") : raw).toLowerCase().replace(/^@/, "")

  if (!/^[a-z0-9_]{3,20}$/.test(username)) return { ok: false, error: "Use 3–20 letters, numbers, or _" }

  const list = getFriends()
  if (list.some(f => f.username === username)) return { ok: false, error: "Already friends" }

  const friend: Friend = { id: `f-${username}`, username, color: colorFor(username) }
  save([...list, friend])
  return { ok: true, friend }
}

export function removeFriend(id: string) {
  save(getFriends().filter(f => f.id !== id))
}
