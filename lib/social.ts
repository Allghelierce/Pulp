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
  const value = (raw ?? '').trim().toLowerCase()
  if (value.length < 3) return { ok: false, error: 'Username must be at least 3 characters' }
  if (value.length > 20) return { ok: false, error: 'Username must be 20 characters or fewer' }
  if (!/^[a-z0-9_]+$/.test(value)) return { ok: false, error: 'Use only letters, numbers, and underscores' }
  return { ok: true, value }
}

const FOUR_MONTHS_MS = 4 * 31 * 24 * 60 * 60 * 1000

export type TermResult = { ok: true } | { ok: false; error: string }

export function validateTerm(startISO: string, endISO: string): TermResult {
  const start = new Date(startISO).getTime()
  const end = new Date(endISO).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return { ok: false, error: 'Invalid dates' }
  if (end <= start) return { ok: false, error: 'Term end must be after start' }
  if (end - start > FOUR_MONTHS_MS) return { ok: false, error: 'Term cannot exceed 4 months' }
  return { ok: true }
}
