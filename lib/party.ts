// Party play — frontend-first MOCK data layer.
// Persists to localStorage so create / join / leave feel real across reloads.
// Swap these functions for real Supabase calls later (study_groups tables already fit).
import { generateInviteCode } from "./social"

export const PARTY_CAP = 5
const KEY = "pulp-party"

export interface PartyMember {
  id: string
  username: string
  color: string
  weeklyMinutes: number
  isYou?: boolean
  isOwner?: boolean
}

export interface Party {
  code: string
  name: string
  weekStart: string // Monday ISO — standings reset weekly
  members: PartyMember[]
}

// ── week helpers ──────────────────────────────────────────────────
function mondayISO(d = new Date()): string {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // 0 = Monday
  x.setDate(x.getDate() - day)
  return x.toISOString().slice(0, 10)
}

// ── seeded friends so standings never feel empty / impersonal ─────
const FRIEND_POOL: { username: string; color: string }[] = [
  { username: "mona", color: "#e2725b" },
  { username: "leo", color: "#6ea8fe" },
  { username: "sage", color: "#7bb661" },
  { username: "juno", color: "#c77dff" },
  { username: "kaz", color: "#f4a261" },
  { username: "remy", color: "#48cae4" },
]

function pick<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

function seededFriends(n: number): PartyMember[] {
  return pick(FRIEND_POOL, n).map(f => ({
    id: `bot-${f.username}`,
    username: f.username,
    color: f.color,
    weeklyMinutes: Math.round((30 + Math.random() * 320) / 5) * 5,
    isOwner: false,
  }))
}

function you(overrides: Partial<PartyMember> = {}): PartyMember {
  return { id: "you", username: "you", color: "#d97706", weeklyMinutes: 0, isYou: true, ...overrides }
}

// ── persistence ───────────────────────────────────────────────────
export function getParty(): Party | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Party
    // Weekly reset
    const wk = mondayISO()
    if (p.weekStart !== wk) {
      p.weekStart = wk
      p.members = p.members.map(m => ({ ...m, weeklyMinutes: m.isYou ? 0 : Math.round((30 + Math.random() * 320) / 5) * 5 }))
      save(p)
    }
    return p
  } catch { return null }
}

function save(p: Party | null) {
  if (typeof window === "undefined") return
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p))
    else localStorage.removeItem(KEY)
    window.dispatchEvent(new Event("pulp-party-change"))
  } catch {}
}

export function createParty(name: string): Party {
  const p: Party = {
    code: generateInviteCode(),
    name: name.trim() || "My Party",
    weekStart: mondayISO(),
    members: [you({ isOwner: true })],
  }
  save(p)
  return p
}

export function joinParty(code: string): Party {
  // Mock: fabricate a party with a few friends already in it.
  const friends = seededFriends(Math.min(PARTY_CAP - 1, 3))
  const p: Party = {
    code: code.trim().toUpperCase(),
    name: "Study Squad",
    weekStart: mondayISO(),
    members: [...friends, you()],
  }
  save(p)
  return p
}

export function leaveParty() {
  save(null)
}

// Bump your weekly minutes (call on focus-session completion).
export function recordFocus(minutes: number) {
  const p = getParty()
  if (!p) return
  p.members = p.members.map(m => (m.isYou ? { ...m, weeklyMinutes: m.weeklyMinutes + Math.max(0, Math.round(minutes)) } : m))
  save(p)
}

// Standings sorted high → low, with rank attached.
export function standings(p: Party): (PartyMember & { rank: number })[] {
  return [...p.members]
    .sort((a, b) => b.weeklyMinutes - a.weeklyMinutes)
    .map((m, i) => ({ ...m, rank: i + 1 }))
}
