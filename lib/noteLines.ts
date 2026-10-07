// Cloud packing for page rules. The notes table has a `lines` jsonb column but
// no `hlines` column, so free-standing lines ride along under a reserved key.
import type { NoteData, HLine } from "@/app/types"

const KEY = "_hlines"

export function cloudLines(note: Pick<NoteData, "lines" | "hlines">): Record<string, unknown> | null {
  const hasH = note.hlines && Object.values(note.hlines).some(a => a?.length)
  if (!note.lines && !hasH) return null
  return hasH ? { ...(note.lines || {}), [KEY]: note.hlines } : (note.lines as Record<string, unknown>)
}

export function fromCloudLines(raw: unknown): { lines?: NoteData["lines"]; hlines?: NoteData["hlines"] } {
  if (!raw || typeof raw !== "object") return {}
  const { [KEY]: h, ...rest } = raw as Record<string, unknown>
  return {
    lines: Object.keys(rest).length ? (rest as NoteData["lines"]) : undefined,
    hlines: h && typeof h === "object" ? (h as Record<number, HLine[]>) : undefined,
  }
}

// Lines used to be inserted as text boxes holding an <hr> / thin <div>.
// Convert any of those into real lines, in place. Returns null if none.
const LEGACY_H = '<hr style="border:none;border-top:2px solid rgba(0,0,0,0.15)'
const LEGACY_V = '<div style="width:2px;height:100%;background:rgba(0,0,0,0.15)'

export function migrateLegacyLineBoxes(note: NoteData): NoteData | null {
  let changed = false
  const boxes: NoteData["boxes"] = {}
  const hlines: Record<number, HLine[]> = { ...(note.hlines || {}) }
  for (const [k, list] of Object.entries(note.boxes || {})) {
    const page = Number(k)
    const keep = []
    for (const b of list || []) {
      const c = (b.content || "").trim()
      const isH = c.startsWith(LEGACY_H)
      const isV = c.startsWith(LEGACY_V)
      if (!isH && !isV) { keep.push(b); continue }
      changed = true
      const line: HLine = isH
        ? { id: b.id, x: Math.round(b.x), y: Math.round(b.y + 18), width: Math.max(24, Math.round(b.w)), direction: "horizontal" }
        : { id: b.id, x: Math.round(b.x + b.w / 2), y: Math.round(b.y), width: Math.max(24, Math.round(b.h)), direction: "vertical" }
      hlines[page] = [...(hlines[page] || []), line]
    }
    boxes[page] = keep
  }
  return changed ? { ...note, boxes, hlines } : null
}
