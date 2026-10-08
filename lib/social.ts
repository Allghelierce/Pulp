// Pure helpers for the social (friends + study groups) feature.
export const FRIEND_CODE_PREFIX = 'PULP-'

// Unambiguous base32 alphabet (no 0/O/1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomCode(len: number): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

export function generateFriendCode(): string {
  return FRIEND_CODE_PREFIX + randomCode(4)
}

export function generateInviteCode(): string {
  return randomCode(8)
}

export type UsernameResult =
  | { ok: true; value: string }
  | { ok: false; error: string }

export function validateUsername(raw: string): UsernameResult {
  // Keep capitals as typed ("ClammyElm823"); uniqueness checks ignore case.
  const value = (raw ?? '').trim()
  if (value.length < 3) return { ok: false, error: 'Username must be at least 3 characters' }
  if (value.length > 20) return { ok: false, error: 'Username must be 20 characters or fewer' }
  if (!/^[A-Za-z0-9_]+$/.test(value)) return { ok: false, error: 'Use only letters, numbers, and underscores' }
  return { ok: true, value }
}

export type TermResult = { ok: true } | { ok: false; error: string }

export function validateTerm(startISO: string, endISO: string): TermResult {
  const start = new Date(startISO)
  const end = new Date(endISO)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { ok: false, error: 'Invalid dates' }
  if (end.getTime() <= start.getTime()) return { ok: false, error: 'Term end must be after start' }
  const max = new Date(start)
  max.setMonth(max.getMonth() + 4)
  if (end.getTime() > max.getTime()) return { ok: false, error: 'Term cannot exceed 4 months' }
  return { ok: true }
}

// ── Party rules (shared by the API routes and the Party panel) ──────
export const PARTY_CAP = 5
export const SEASON_MONTHS = 3

// A new season: today through SEASON_MONTHS from now (ISO dates).
export function seasonDates(from: Date = new Date()): { term_start: string; term_end: string } {
  const end = new Date(from)
  end.setMonth(end.getMonth() + SEASON_MONTHS)
  return { term_start: from.toISOString().slice(0, 10), term_end: end.toISOString().slice(0, 10) }
}

// When a season is over: the END of its term_end day, anywhere on Earth
// (UTC-12), so no time zone sees it close early. Parsing the bare date gives
// UTC midnight, which archived parties a day early.
export function seasonOverAt(termEnd: string): number {
  return Date.parse(`${termEnd}T00:00:00Z`) + 36 * 3600 * 1000
}

// "#PULP-AB2C" / "pulp-ab2c" -> "PULP-AB2C"; null if it isn't a friend code.
export function parseFriendCode(raw: string): string | null {
  const v = (raw ?? '').trim()
  return /^#?PULP-[A-Z0-9]{4}$/i.test(v) ? v.replace(/^#/, '').toUpperCase() : null
}
