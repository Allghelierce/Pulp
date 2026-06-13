"use client"
import { useState, useEffect, useCallback, useMemo, memo } from "react"
import type { NoteData } from "@/app/types"
import { extractTextFromHTML } from "@/lib/sanitize"
import { apiFetch } from "@/lib/apiFetch"

interface Card { q: string; a: string; hint?: string }
type Grade = "again" | "good"

interface ReviewViewProps {
  note: NoteData
  theme: "light" | "dark"
  accent: string
  onClose: () => void
  onComplete?: (result: { noteId: string; total: number; correct: number; at: number }) => void
}

function gatherNotebookText(note: NoteData): string {
  const pageTexts = note.pages.map((html, i) => {
    const text = extractTextFromHTML(html)
    return text ? `[Page ${i + 1}]\n${text}` : ""
  }).filter(Boolean)

  const boxTexts: string[] = []
  for (const [pageIdx, boxes] of Object.entries(note.boxes)) {
    for (const box of boxes) {
      if (!box.content.trim()) continue
      const text = extractTextFromHTML(box.content)
      if (text) boxTexts.push(`[Page ${Number(pageIdx) + 1} - Text Box]\n${text}`)
    }
  }
  return [...pageTexts, ...boxTexts].join("\n\n")
}

type Phase = "loading" | "error" | "card" | "done"

export const ReviewView = memo(function ReviewView({ note, theme, accent, onClose, onComplete }: ReviewViewProps) {
  const isDark = theme === "dark"
  const [phase, setPhase] = useState<Phase>("loading")
  const [error, setError] = useState("")
  const [cards, setCards] = useState<Card[]>([])
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [grades, setGrades] = useState<Grade[]>([])
  const [reloadKey, setReloadKey] = useState(0)

  const bg = isDark ? "#09090b" : "#fafaf9"
  const fg = isDark ? "#e4e4e7" : "#18181b"
  const muted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)"
  const subtle = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)"
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff"
  const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"

  const noteText = useMemo(() => gatherNotebookText(note), [note])

  useEffect(() => {
    let cancelled = false
    setPhase("loading")
    setError("")
    setCards([])
    setIdx(0)
    setRevealed(false)
    setShowHint(false)
    setGrades([])

    apiFetch("/api/recall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: noteText, title: note.subject, count: 8 }),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Failed to build review")
        return data.cards as Card[]
      })
      .then(loaded => {
        if (cancelled) return
        if (!loaded?.length) throw new Error("No cards returned")
        setCards(loaded)
        setPhase("card")
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Something went wrong")
        setPhase("error")
      })

    return () => { cancelled = true }
  }, [noteText, note.subject, reloadKey])

  const card = cards[idx]
  const correct = grades.filter(g => g === "good").length

  const grade = useCallback((g: Grade) => {
    setGrades(prev => {
      const next = [...prev, g]
      if (idx + 1 >= cards.length) {
        setPhase("done")
        onComplete?.({ noteId: note.id, total: cards.length, correct: next.filter(x => x === "good").length, at: Date.now() })
      } else {
        setIdx(idx + 1)
        setRevealed(false)
        setShowHint(false)
      }
      return next
    })
  }, [idx, cards.length, note.id, onComplete])

  // keyboard: space reveals, 1/2 grade
  useEffect(() => {
    if (phase !== "card") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); if (!revealed) setRevealed(true) }
      else if (revealed && (e.key === "1" || e.key === "j")) grade("again")
      else if (revealed && (e.key === "2" || e.key === "k")) grade("good")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, revealed, grade])

  const font = "'Crimson Pro', serif"

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 60, background: bg,
      display: "flex", flexDirection: "column", fontFamily: font,
    }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${border}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, fontWeight: 500 }}>Recall Review</div>
          <div style={{ fontSize: 15, color: fg, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.subject}</div>
        </div>
        <button onClick={onClose} title="Close" style={{ background: "none", border: "none", cursor: "pointer", color: muted, padding: 6, borderRadius: 6 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Progress bar */}
      {phase === "card" && (
        <div style={{ height: 3, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
          <div style={{ height: "100%", width: `${(idx / cards.length) * 100}%`, background: accent, transition: "width 0.25s ease" }} />
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>

        {phase === "loading" && (
          <div style={{ textAlign: "center", color: subtle }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 18px", borderRadius: "50%", border: `2.5px solid ${accent}30`, borderTopColor: accent, animation: "rv-spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 15, color: fg }}>Reading your notes…</div>
            <div style={{ fontSize: 12.5, color: muted, marginTop: 4 }}>Building active-recall questions</div>
            <style>{`@keyframes rv-spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {phase === "error" && (
          <div style={{ textAlign: "center", maxWidth: 340 }}>
            <div style={{ fontSize: 15, color: fg, marginBottom: 6 }}>Can't review yet</div>
            <div style={{ fontSize: 13, color: muted, lineHeight: 1.5, marginBottom: 18 }}>{error}</div>
            <button onClick={() => setReloadKey(k => k + 1)} style={{ background: accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontFamily: font }}>Try again</button>
          </div>
        )}

        {phase === "card" && card && (
          <div style={{ width: "100%", maxWidth: 560 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 12, textAlign: "center" }}>Card {idx + 1} of {cards.length}</div>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "32px 28px", boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 20, lineHeight: 1.45, color: fg, fontWeight: 500 }}>{card.q}</div>

              {!revealed && card.hint && (
                <div style={{ marginTop: 18 }}>
                  {showHint
                    ? <div style={{ fontSize: 14, color: subtle, fontStyle: "italic" }}>💡 {card.hint}</div>
                    : <button onClick={() => setShowHint(true)} style={{ background: "none", border: "none", color: accent, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: font }}>Show hint</button>}
                </div>
              )}

              {revealed && (
                <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${border}` }}>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 8 }}>Answer</div>
                  <div style={{ fontSize: 17, lineHeight: 1.55, color: subtle }}>{card.a}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10 }}>
              {!revealed ? (
                <button onClick={() => setRevealed(true)} style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500 }}>
                  Reveal answer <span style={{ opacity: 0.6, fontSize: 12 }}>Space</span>
                </button>
              ) : (
                <>
                  <button onClick={() => grade("again")} style={{ flex: 1, maxWidth: 200, background: "transparent", color: isDark ? "#f87171" : "#dc2626", border: `1.5px solid ${isDark ? "#f8717155" : "#dc262655"}`, borderRadius: 10, padding: "11px 0", fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500 }}>
                    Missed it <span style={{ opacity: 0.5, fontSize: 12 }}>1</span>
                  </button>
                  <button onClick={() => grade("good")} style={{ flex: 1, maxWidth: 200, background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500 }}>
                    Got it <span style={{ opacity: 0.6, fontSize: 12 }}>2</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {phase === "done" && (
          <div style={{ textAlign: "center", maxWidth: 380 }}>
            <div style={{ fontSize: 44, fontWeight: 600, color: accent, fontFamily: font }}>{Math.round((correct / cards.length) * 100)}%</div>
            <div style={{ fontSize: 16, color: fg, marginTop: 4 }}>{correct} of {cards.length} recalled</div>
            <div style={{ fontSize: 13, color: muted, marginTop: 8, lineHeight: 1.5 }}>
              {correct === cards.length ? "Perfect — this notebook is fresh in your mind."
                : correct >= cards.length * 0.6 ? "Solid. Review the misses and come back soon."
                : "Shaky. Reread your notes, then run it again."}
            </div>
            <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setReloadKey(k => k + 1)} style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Review again</button>
              <button onClick={onClose} style={{ background: "transparent", color: subtle, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
