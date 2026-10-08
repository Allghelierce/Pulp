"use client"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { ACCENT } from "@/lib/accent"

// A small bubble that appears right above highlighted text on the page or in a
// text box: A− · size · A+ and a list of sizes, plus "Card" (highlight-to-card,
// when `onMakeCard` is given). Buttons keep the selection (mousedown is
// prevented), so you can click several times in a row.
const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64]
const SIZE_W = 132
const CARD_W = 74

type Pos = { top: number; left: number; size: number } | null

// The contenteditable on the paper that holds the whole selection, or null.
export function selectionHost(): { host: HTMLElement; range: Range } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  if (!range.toString().trim()) return null
  const node = range.commonAncestorContainer
  const el = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement
  const host = el?.closest<HTMLElement>('[contenteditable="true"]') ?? null
  if (!host || !host.closest("#editor-paper")) return null
  if (el?.closest(".pulp-code-block, pre, code")) return null
  return { host, range }
}

function sizeAt(range: Range): number {
  const n = range.startContainer
  const el = n.nodeType === Node.ELEMENT_NODE ? n as HTMLElement : n.parentElement
  return el ? Math.round(parseFloat(getComputedStyle(el).fontSize) || 16) : 16
}

// Wrap the selection in one span with the new size (inner font sizes removed),
// keep it selected, and fire `input` so the page / box saves it as usual.
function applySize(px: number) {
  const found = selectionHost()
  if (!found) return
  const { host, range } = found
  const span = document.createElement("span")
  span.style.fontSize = `${px}px`
  const tmp = document.createElement("div")
  tmp.appendChild(range.extractContents())
  tmp.querySelectorAll<HTMLElement>("[style]").forEach(el => {
    el.style.removeProperty("font-size")
    if (!el.getAttribute("style")) el.removeAttribute("style")
  })
  tmp.querySelectorAll<HTMLElement>("span:not([class]):not([style])").forEach(el => el.replaceWith(...Array.from(el.childNodes)))
  while (tmp.firstChild) span.appendChild(tmp.firstChild)
  range.insertNode(span)
  const sel = window.getSelection()!
  const nr = document.createRange()
  nr.selectNodeContents(span)
  sel.removeAllRanges()
  sel.addRange(nr)
  host.dispatchEvent(new Event("input", { bubbles: true }))
}

export const SelectionFontSize = memo(function SelectionFontSize({ theme, onMakeCard, cardBusy, cardShortcut }: {
  theme: "light" | "dark"
  onMakeCard?: () => void
  cardBusy?: boolean
  cardShortcut?: string // already formatted, e.g. "⌘⇧C"
}) {
  const [pos, setPos] = useState<Pos>(null)
  const [listOpen, setListOpen] = useState(false)
  const raf = useRef(0)
  const isDark = theme === "dark"
  const W = SIZE_W + (onMakeCard ? CARD_W : 0)

  const update = useCallback(() => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const found = selectionHost()
      if (!found) { setPos(null); setListOpen(false); return }
      const r = found.range.getBoundingClientRect()
      if (!r.width && !r.height) { setPos(null); return }
      const above = r.top - 44
      const top = above > 8 ? above : r.bottom + 8
      const left = Math.min(window.innerWidth - W - 8, Math.max(8, r.left + r.width / 2 - W / 2))
      setPos({ top, left, size: sizeAt(found.range) })
    })
  }, [W])

  useEffect(() => {
    document.addEventListener("selectionchange", update)
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      cancelAnimationFrame(raf.current)
      document.removeEventListener("selectionchange", update)
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [update])

  if (!pos) return null
  const set = (px: number) => { applySize(px); setListOpen(false); update() }
  const smaller = [...SIZES].reverse().find(s => s < pos.size) ?? SIZES[0]
  const bigger = SIZES.find(s => s > pos.size) ?? SIZES[SIZES.length - 1]
  const fg = isDark ? "#e4e4e7" : "#27272a"
  const sub = isDark ? "#a1a1aa" : "#71717a"
  const btn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: fg, padding: "4px 8px", borderRadius: 6, fontFamily: "Crimson Pro, serif", lineHeight: 1 }

  return (
    <div onMouseDown={e => e.preventDefault()}
      style={{ position: "fixed", top: pos.top, left: pos.left, width: W, zIndex: 9990, display: "flex", alignItems: "center",
        padding: 3, borderRadius: 10, background: isDark ? "rgba(24,24,27,0.96)" : "rgba(255,255,255,0.98)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)", backdropFilter: "blur(12px)" }}>
      <div role="toolbar" aria-label="Text size" style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button aria-label="Smaller text" title="Smaller" onClick={() => set(smaller)} style={{ ...btn, fontSize: 13 }}>A<span style={{ fontSize: 10 }}>−</span></button>
        <button aria-label={`Text size ${pos.size}px — choose`} aria-expanded={listOpen} onClick={() => setListOpen(v => !v)}
          style={{ ...btn, fontSize: 13, minWidth: 40, fontVariantNumeric: "tabular-nums", background: listOpen ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") : "none" }}>
          {pos.size}<span style={{ color: sub, fontSize: 9, marginLeft: 2 }}>▾</span>
        </button>
        <button aria-label="Bigger text" title="Bigger" onClick={() => set(bigger)} style={{ ...btn, fontSize: 17 }}>A<span style={{ fontSize: 11 }}>+</span></button>
        {listOpen && (
          <div role="listbox" aria-label="Text sizes" style={{ position: "absolute", top: "calc(100% + 7px)", left: "50%", transform: "translateX(-50%)", width: 84, maxHeight: 220, overflowY: "auto",
            padding: 3, borderRadius: 10, background: isDark ? "rgba(24,24,27,0.98)" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)" }}>
            {SIZES.map(s => (
              <button key={s} role="option" aria-selected={s === pos.size} onClick={() => set(s)}
                style={{ ...btn, display: "block", width: "100%", textAlign: "left", fontSize: 13, padding: "5px 10px",
                  color: s === pos.size ? "#d97706" : fg, background: s === pos.size ? "rgba(217,119,6,0.1)" : "none" }}>{s}</button>
            ))}
          </div>
        )}
      </div>
      {onMakeCard && (<>
        <div aria-hidden style={{ width: 1, alignSelf: "stretch", margin: "3px 3px", background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} />
        {/* Highlight-to-card: a recall card from the selection (the note isn't changed). */}
        <button aria-label="Make card" aria-busy={!!cardBusy} title={`Make a recall card${cardShortcut ? ` (${cardShortcut})` : ""}`}
          onClick={() => { if (!cardBusy) onMakeCard() }}
          style={{ ...btn, width: CARD_W - 10, fontSize: 14, padding: "4px 7px", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: ACCENT, cursor: cardBusy ? "progress" : "pointer" }}>
          {cardBusy ? (
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="7" width="14" height="14" rx="2" /><path d="M7 3h12a2 2 0 0 1 2 2v12" /><path d="M10 11v6M7 14h6" />
            </svg>
          )}
          Card
        </button>
      </>)}
    </div>
  )
})
