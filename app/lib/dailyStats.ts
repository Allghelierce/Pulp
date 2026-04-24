export interface DailyEntry {
  date: string // YYYY-MM-DD
  charsWritten: number
  focusMinutes: number
  sessionsCompleted: number
  sunshineEarned: number
}

const STORAGE_KEY = "pulp-daily-stats"

export function loadDailyStats(): DailyEntry[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}

function saveDailyStats(entries: DailyEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function today(): string {
  return new Date().toISOString().split("T")[0]
}

function getOrCreateToday(entries: DailyEntry[]): [DailyEntry[], DailyEntry] {
  const d = today()
  const existing = entries.find(e => e.date === d)
  if (existing) return [entries, existing]
  const entry: DailyEntry = { date: d, charsWritten: 0, focusMinutes: 0, sessionsCompleted: 0, sunshineEarned: 0 }
  const updated = [...entries, entry]
  return [updated, entry]
}

export function logCharsWritten(count: number) {
  const entries = loadDailyStats()
  const [list, entry] = getOrCreateToday(entries)
  entry.charsWritten += count
  saveDailyStats(list.map(e => e.date === entry.date ? entry : e))
}

export function logFocusSession(minutes: number, sunshine: number) {
  const entries = loadDailyStats()
  const [list, entry] = getOrCreateToday(entries)
  entry.focusMinutes += minutes
  entry.sessionsCompleted += 1
  entry.sunshineEarned += sunshine
  saveDailyStats(list.map(e => e.date === entry.date ? entry : e))
}

export function logSunshine(amount: number) {
  const entries = loadDailyStats()
  const [list, entry] = getOrCreateToday(entries)
  entry.sunshineEarned += amount
  saveDailyStats(list.map(e => e.date === entry.date ? entry : e))
}
