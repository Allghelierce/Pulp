import type { NoteData, TextBox } from "@/app/types"
import { extractTextFromHTML } from "@/lib/sanitize"

// Plain text of a notebook (pages + text boxes) as recall reads it. Decks
// fingerprint this exact text, so ReviewView and session tagging share it.
export function notebookReviewText(note: NoteData | null): string {
  if (!note) return ""
  const pageTexts = (note.pages || []).map((html: string, i: number) => {
    const text = extractTextFromHTML(html)
    return text ? `[Page ${i + 1}]\n${text}` : ""
  }).filter(Boolean)
  const boxTexts: string[] = []
  for (const [pageIdx, boxes] of Object.entries(note.boxes || {}) as [string, TextBox[]][]) {
    for (const box of boxes || []) {
      if (!box?.content?.trim()) continue
      const text = extractTextFromHTML(box.content)
      if (text) boxTexts.push(`[Page ${Number(pageIdx) + 1} - Text Box]\n${text}`)
    }
  }
  return [...pageTexts, ...boxTexts].join("\n\n")
}
