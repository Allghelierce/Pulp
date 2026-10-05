// "YYYY-MM-DD" for the user's local calendar day. Stats, streaks and goals roll
// over at local midnight — toISOString() would roll them over at UTC midnight.
export function localDayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}
