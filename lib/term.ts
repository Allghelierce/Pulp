// School grade + academic term helpers. Used to title the grove (e.g. "7th Grade · Fall Semester").
// Term is auto-derived from the date for now; later this can be driven by the student's school schedule.

export const GRADES: string[] = [
  'Kindergarten',
  '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
  '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
  'College · Freshman', 'College · Sophomore', 'College · Junior', 'College · Senior',
]

// Fall: Aug–Dec, Spring: Jan–May, Summer: Jun–Jul.
export function currentTerm(d: Date = new Date()): string {
  const m = d.getMonth()
  if (m >= 7) return 'Fall Semester'
  if (m <= 4) return 'Spring Semester'
  return 'Summer'
}

// Stable key for the active term — used later to archive/reset the grove each semester.
export function termKey(d: Date = new Date()): string {
  const m = d.getMonth()
  const y = d.getFullYear()
  if (m >= 7) return `${y}-fall`
  if (m <= 4) return `${y}-spring`
  return `${y}-summer`
}

export function groveTitle(grade?: string | null, d: Date = new Date()): { eyebrow: string; title: string } {
  const term = currentTerm(d)
  if (!grade) return { eyebrow: 'your grove', title: term }
  return { eyebrow: term, title: grade }
}
