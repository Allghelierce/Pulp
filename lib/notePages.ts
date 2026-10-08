// Page-level edits on a notebook. Per-page data (text boxes, ruled lines, drawings) is
// keyed by page index, so inserting pages shifts every later page's keys along.
import type { NoteData } from "@/app/types"
import { uid } from "@/app/lib/uid"

type PageKeyed<T> = { [pageIdx: number]: T } | undefined

function shift<T>(map: PageKeyed<T>, after: number, by: number): PageKeyed<T> {
  if (!map) return map
  const out: { [pageIdx: number]: T } = {}
  for (const [k, v] of Object.entries(map)) {
    const i = Number(k)
    out[i > after ? i + by : i] = v
  }
  return out
}

/** Inserts pages right after `after`, each holding one default text box with that HTML. */
export function insertPagesAfter(note: NoteData, after: number, contents: string[]): NoteData {
  if (!contents.length) return note
  const n = contents.length
  const pages = [...note.pages.slice(0, after + 1), ...contents.map(() => ""), ...note.pages.slice(after + 1)]
  const boxes = shift(note.boxes, after, n)!
  contents.forEach((html, i) => { boxes[after + 1 + i] = [{ id: uid(), x: 40, y: 40, w: 900, h: 32, content: html }] })
  return {
    ...note,
    pages,
    boxes,
    lines: shift(note.lines, after, n),
    hlines: shift(note.hlines, after, n),
    drawings: shift(note.drawings, after, n),
  }
}
