// What the user sees on the open page, for page-aware AI (inline menu + chat).
// #editor-paper wraps the main editor and the page's text boxes.
export const MAX_PAGE_TEXT = 8000

export function getPageText(max = MAX_PAGE_TEXT): string {
  if (typeof document === "undefined") return ""
  const el = document.getElementById("editor-paper")
  const text = (el?.innerText || "").replace(/\n{3,}/g, "\n\n").trim()
  return text.length > max ? text.slice(0, max) + "\n[...truncated]" : text
}

// A selection captured when the user asks the AI, so the answer can replace
// exactly that text later — even after focus has moved into an AI input.
export interface CapturedSelection {
  text: string
  range: Range
}

export function captureRange(range: Range | null | undefined): CapturedSelection | null {
  if (!range || range.collapsed) return null
  const text = range.toString().trim()
  if (!text) return null
  return { text, range: range.cloneRange() }
}

// Still on the page? (switching pages/notebooks detaches the old nodes.)
export function isLive(sel: CapturedSelection): boolean {
  return sel.range.startContainer.isConnected && sel.range.endContainer.isConnected
}
