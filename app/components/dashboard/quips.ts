import type { DailyEntry } from "@/app/lib/dailyStats"

// Friendly real-world comparisons for the Stats page subtitle. One is shown
// per visit, rotating through whichever ones the user's numbers support.

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`
const kilo = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : n.toLocaleString())
const hm = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`)

export function buildQuips(dailyStats: DailyEntry[], treeCount: number): string[] {
  const minutes = Math.round(dailyStats.reduce((s, d) => s + (d.focusMinutes ?? 0), 0))
  const chars = dailyStats.reduce((s, d) => s + (d.charsWritten ?? 0), 0)
  const sessions = dailyStats.reduce((s, d) => s + (d.sessionsCompleted ?? 0), 0)
  const days = dailyStats.filter(d => (d.focusMinutes ?? 0) > 0 || (d.charsWritten ?? 0) > 0).length
  const q: string[] = []

  // Writing — ~1,800 characters fill a paperback page; flash fiction runs ~4k.
  if (chars >= 4000) q.push(`You've written ${kilo(chars)} characters — about ${plural(Math.round(chars / 4000), 'short story', 'short stories')}.`)
  else if (chars >= 1800) q.push(`You've written ${kilo(chars)} characters — roughly ${plural(Math.round(chars / 1800), 'paperback page')}.`)
  else if (chars >= 280) q.push(`You've written ${chars.toLocaleString()} characters — ${plural(Math.floor(chars / 280), 'tweet')} worth, but better.`)

  // Focus time
  if (minutes >= 600) q.push(`${hm(minutes)} of focus — you could've flown coast to coast ${plural(Math.round(minutes / 330), 'time')}.`)
  if (minutes >= 120) q.push(`${hm(minutes)} of focus — that's ${plural(Math.round(minutes / 120), 'feature film')} you didn't watch.`)
  else if (minutes >= 25) q.push(`${hm(minutes)} of focus — ${plural(Math.round(minutes / 25), 'tomato')} on the pomodoro vine.`)
  if (minutes >= 50) q.push(`${hm(minutes)} of focus — about ${plural(Math.round(minutes / 50), 'college lecture')}, minus the dozing.`)

  // Trees and habits
  if (treeCount >= 12) q.push(`${treeCount} trees grown — enough to line a quiet street.`)
  else if (treeCount >= 3) q.push(`${treeCount} trees grown — the start of a proper orchard.`)
  else if (treeCount >= 1) q.push(`${plural(treeCount, 'tree')} grown. Every orchard starts here.`)
  if (sessions >= 10) q.push(`${sessions} sessions finished — that's ${sessions} times you didn't check your phone.`)
  if (days >= 14) q.push(`You've shown up ${days} days — about ${plural(Math.floor(days / 7), 'week')} of habit.`)

  return q
}

// Advances once per page visit so the line changes each time Stats opens.
const QUIP_KEY = 'pulp-stats-quip'
export function nextQuipIndex(): number {
  try {
    const n = (parseInt(localStorage.getItem(QUIP_KEY) || '0', 10) || 0) + 1
    localStorage.setItem(QUIP_KEY, String(n))
    return n
  } catch { return 0 }
}
