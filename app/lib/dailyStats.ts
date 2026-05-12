import * as db from "@/lib/db"
import { supabase } from "@/lib/supabase"

export interface DailyEntry {
  date: string // YYYY-MM-DD
  charsWritten: number
  focusMinutes: number
  sessionsCompleted: number
  sapEarned: number
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
  const entry: DailyEntry = { date: d, charsWritten: 0, focusMinutes: 0, sessionsCompleted: 0, sapEarned: 0 }
  const updated = [...entries, entry]
  return [updated, entry]
}

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

export function logCharsWritten(count: number) {
  const entries = loadDailyStats()
  const [list, entry] = getOrCreateToday(entries)
  entry.charsWritten += count
  saveDailyStats(list.map(e => e.date === entry.date ? entry : e))
  getUserId().then(uid => { if (uid) db.incrementDailyStat(uid, 'words_written', count) })
}

export function logFocusSession(minutes: number, sap: number) {
  const entries = loadDailyStats()
  const [list, entry] = getOrCreateToday(entries)
  entry.focusMinutes += minutes
  entry.sessionsCompleted += 1
  entry.sapEarned += sap
  saveDailyStats(list.map(e => e.date === entry.date ? entry : e))
  getUserId().then(uid => {
    if (!uid) return
    db.incrementDailyStat(uid, 'minutes_focused', Math.round(minutes))
    db.incrementDailyStat(uid, 'sessions_completed', 1)
    db.incrementDailyStat(uid, 'trees_grown', 1)
  })
}

export function logSap(amount: number) {
  const entries = loadDailyStats()
  const [list, entry] = getOrCreateToday(entries)
  entry.sapEarned += amount
  saveDailyStats(list.map(e => e.date === entry.date ? entry : e))
}
