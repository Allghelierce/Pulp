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

// What a player pastes into "invite code" -> the 8-char code: a full
// .../join/<CODE> link, " wxyz2345 ", "WXYZ-2345" or "code: WXYZ2345" all work.
export function parseInviteCode(raw: string): string {
  const v = (raw ?? '').trim()
  const link = v.match(/\/join\/([A-Za-z0-9]{8})(?![A-Za-z0-9])/)
  if (link) return link[1].toUpperCase()
  const clean = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  return clean.length > 8 ? clean.slice(-8) : clean
}

// "#PULP-AB2C" / "pulp-ab2c" -> "PULP-AB2C"; null if it isn't a friend code.
export function parseFriendCode(raw: string): string | null {
  const v = (raw ?? '').trim()
  return /^#?PULP-[A-Z0-9]{4}$/i.test(v) ? v.replace(/^#/, '').toUpperCase() : null
}

// ── Server input rules (the /api/groups routes) ─────────────────────
// Focus minutes come from the client, so the server bounds them: one report is
// at most one timer session, and a player earns at most DAILY_MAX_MINUTES a day.
export const REPORT_MAX_MINUTES = 180 // the longest timer session
export const DAILY_MAX_MINUTES = 16 * 60

// A report's minutes: a whole number from 1 up (anything past one session
// counts as one session). null = reject the report.
export function parseReportMinutes(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1) return null
  return Math.min(raw, REPORT_MAX_MINUTES)
}

// Minutes are stored per week (group_weekly), so the daily cap is kept as "16h
// for each day of the week so far" (week_start is a Monday, UTC).
export function weekCapAt(weekStart: string, now: number = Date.now()): number {
  const days = Math.floor((now - Date.parse(`${weekStart}T00:00:00Z`)) / 86400000) + 1
  return Math.min(7, Math.max(1, days || 1)) * DAILY_MAX_MINUTES
}

// What a report may add, given this week's minutes so far (every party).
export const creditFor = (minutes: number, usedThisWeek: number, weekCap: number): number =>
  Math.max(0, Math.min(minutes, weekCap - usedThisWeek))

// Ids from a request: a positive whole-number row id (party, friendship) / a
// user uuid, else null.
export function parseId(raw: unknown): number | null {
  const n = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw
  return typeof n === 'number' && Number.isSafeInteger(n) && n > 0 ? n : null
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const parseUserId = (raw: unknown): string | null => (typeof raw === 'string' && UUID.test(raw) ? raw : null)
