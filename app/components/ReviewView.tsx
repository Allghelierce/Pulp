"use client"
import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react"
import type { NoteData } from "@/app/types"
import { extractTextFromHTML } from "@/lib/sanitize"
import { apiFetch } from "@/lib/apiFetch"
import {
  type Deck, type ScheduledCard, type Grade,
  loadDeck, saveDeck, buildDeck, mergeCards, buildSession, applyGrade,
  previewIntervals, deckStats, hashNotes,
} from "@/lib/recallSchedule"

interface ReviewViewProps {
  note: NoteData
  theme: "light" | "dark"
  accent: string
  onClose: () => void
  onComplete?: (result: { noteId: string; reviewed: number; again: number }) => void
  onCorrect?: () => void
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

function relDue(due: number, now: number): string {
  const ms = due - now
  if (ms <= 0) return "now"
  if (ms < 86_400_000) {
    const h = Math.round(ms / 3_600_000)
    return h <= 1 ? "soon" : `${h}h`
  }
  const d = Math.round(ms / 86_400_000)
  if (d < 30) return `${d}d`
  if (d < 365) return `${Math.round(d / 30)}mo`
  return `${(d / 365).toFixed(1)}y`
}

type Phase = "loading" | "generating" | "error" | "card" | "caughtup" | "empty" | "done"

const GRADES: { g: Grade; label: string; key: string }[] = [
  { g: "again", label: "Again", key: "1" },
  { g: "hard", label: "Hard", key: "2" },
  { g: "good", label: "Good", key: "3" },
  { g: "easy", label: "Easy", key: "4" },
]

export const ReviewView = memo(function ReviewView({ note, theme, accent, onClose, onComplete, onCorrect }: ReviewViewProps) {
  const isDark = theme === "dark"
  const font = "'Crimson Pro', serif"

  const noteText = useMemo(() => gatherNotebookText(note), [note])
  const noteHash = useMemo(() => hashNotes(noteText), [noteText])

  const [phase, setPhase] = useState<Phase>("loading")
  const [error, setError] = useState("")
  const [deck, setDeck] = useState<Deck | null>(null)
  const [queue, setQueue] = useState<ScheduledCard[]>([])
  const [revealed, setRevealed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [log, setLog] = useState<Grade[]>([])
  const studied = useRef<Set<string>>(new Set())
  const driftDismissed = useRef(false)

  const bg = isDark ? "#09090b" : "#fafaf9"
  const fg = isDark ? "#e4e4e7" : "#18181b"
  const muted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)"
  const subtle = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)"
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff"
  const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"

  const startSession = useCallback((d: Deck) => {
    const session = buildSession(d, Date.now())
    studied.current = new Set()
    setLog([])
    setRevealed(false)
    setShowHint(false)
    if (!session.length) { setPhase("caughtup"); return }
    setQueue(session)
    setPhase("card")
  }, [])

  const generate = useCallback(async (existing: Deck | null) => {
    setPhase("generating")
    setError("")
    try {
      const res = await apiFetch("/api/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText, title: note.subject, count: 12 }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to build review")
      const cards = data.cards
      if (!cards?.length) throw new Error("No cards returned")
      const now = Date.now()
      const next = existing ? mergeCards(existing, cards, noteText, now) : buildDeck(note.id, cards, noteText, now)
      saveDeck(next)
      setDeck(next)
      driftDismissed.current = true
      startSession(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPhase("error")
    }
  }, [noteText, note.subject, note.id, startSession])

  // initial load
  useEffect(() => {
    const existing = loadDeck(note.id)
    if (!existing || existing.cards.length === 0) {
      setDeck(existing)
      setPhase("empty")
    } else {
      setDeck(existing)
      startSession(existing)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  const current = queue[0]
  const now = Date.now()
  const previews = useMemo(() => (current ? previewIntervals(current, Date.now()) : null), [current])
  const notesDrifted = deck && deck.noteHash !== noteHash && !driftDismissed.current

  const grade = useCallback((g: Grade) => {
    if (!current || !deck) return
    const gnow = Date.now()
    const updated = applyGrade(current, g, gnow)
    studied.current.add(current.id)
    setLog(prev => [...prev, g])
    // A non-"again" grade is a "correct" recall — grows the tree in Recall mode.
    if (g !== "again") onCorrect?.()

    const nextDeck: Deck = { ...deck, cards: deck.cards.map(c => (c.id === updated.id ? updated : c)) }
    saveDeck(nextDeck)
    setDeck(nextDeck)

    const rest = queue.slice(1)
    const nextQueue = g === "again" ? [...rest, updated] : rest
    setRevealed(false)
    setShowHint(false)
    if (nextQueue.length === 0) {
      setPhase("done")
      onComplete?.({ noteId: note.id, reviewed: studied.current.size, again: [...log, g].filter(x => x === "again").length })
    } else {
      setQueue(nextQueue)
    }
  }, [current, deck, queue, log, note.id, onComplete, onCorrect])

  // keyboard
  useEffect(() => {
    if (phase !== "card") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); if (!revealed) setRevealed(true) }
      else if (revealed) { const m = GRADES.find(x => x.key === e.key); if (m) grade(m.g) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, revealed, grade])

  const stats = deck ? deckStats(deck, now) : null
  const gradeColor = (g: Grade): string =>
    g === "again" ? (isDark ? "#f87171" : "#dc2626")
      : g === "hard" ? (isDark ? "#fbbf24" : "#d97706")
        : g === "good" ? accent
          : (isDark ? "#34d399" : "#059669")

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, background: bg, display: "flex", flexDirection: "column", fontFamily: font }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${border}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, fontWeight: 500 }}>Recall Review</div>
          <div style={{ fontSize: 15, color: fg, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.subject}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {stats && phase !== "loading" && (
            <div style={{ fontSize: 12, color: muted, display: "flex", gap: 12 }}>
              <span title="Due now"><b style={{ color: stats.dueNow ? accent : muted }}>{stats.dueNow}</b> due</span>
              <span title="New cards">{stats.newCount} new</span>
              <span title="Mature cards">{stats.mature} mature</span>
            </div>
          )}
          <button onClick={onClose} title="Close" style={{ background: "none", border: "none", cursor: "pointer", color: muted, padding: 6, borderRadius: 6 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>

      {/* drift banner */}
      {notesDrifted && phase === "card" && (
        <div style={{ padding: "8px 24px", background: isDark ? "rgba(251,191,36,0.08)" : "rgba(217,119,6,0.07)", borderBottom: `1px solid ${border}`, fontSize: 12.5, color: subtle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>Your notes changed since this deck was built.</span>
          <span>
            <button onClick={() => generate(deck)} style={{ background: "none", border: "none", color: accent, cursor: "pointer", fontSize: 12.5, fontFamily: font, padding: 0 }}>Regenerate</button>
            <button onClick={() => { driftDismissed.current = true; setDeck(d => (d ? { ...d } : d)) }} style={{ background: "none", border: "none", color: muted, cursor: "pointer", fontSize: 12.5, fontFamily: font, marginLeft: 14, padding: 0 }}>Dismiss</button>
          </span>
        </div>
      )}

      {/* progress */}
      {phase === "card" && (
        <div style={{ height: 3, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
          <div style={{ height: "100%", width: `${(studied.current.size / (studied.current.size + queue.length)) * 100}%`, background: accent, transition: "width 0.25s ease" }} />
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>

        {(phase === "loading" || phase === "generating") && (
          <div style={{ textAlign: "center", color: subtle }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 18px", borderRadius: "50%", border: `2.5px solid ${accent}30`, borderTopColor: accent, animation: "rv-spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 15, color: fg }}>{phase === "generating" ? "Reading your notes…" : "Loading deck…"}</div>
            {phase === "generating" && <div style={{ fontSize: 12.5, color: muted, marginTop: 4 }}>Building active-recall cards</div>}
            <style>{`@keyframes rv-spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {phase === "empty" && (
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 17, color: fg, marginBottom: 6 }}>No review deck yet</div>
            <div style={{ fontSize: 13.5, color: muted, lineHeight: 1.55, marginBottom: 20 }}>Pulp will read this notebook and build active-recall cards, then schedule them so easy ones return less often.</div>
            <button onClick={() => generate(deck)} style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px 26px", fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500 }}>Build deck</button>
          </div>
        )}

        {phase === "error" && (
          <div style={{ textAlign: "center", maxWidth: 340 }}>
            <div style={{ fontSize: 15, color: fg, marginBottom: 6 }}>Can&apos;t review yet</div>
            <div style={{ fontSize: 13, color: muted, lineHeight: 1.5, marginBottom: 18 }}>{error}</div>
            <button onClick={() => generate(deck)} style={{ background: accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontFamily: font }}>Try again</button>
          </div>
        )}

        {phase === "caughtup" && stats && (
          <div style={{ textAlign: "center", maxWidth: 380 }}>
            <div style={{ fontSize: 40 }}>🌿</div>
            <div style={{ fontSize: 18, color: fg, marginTop: 8 }}>All caught up</div>
            <div style={{ fontSize: 13.5, color: muted, marginTop: 8, lineHeight: 1.55 }}>
              Nothing due right now.{stats.nextDue ? ` Next card in ${relDue(stats.nextDue, now)}.` : ""}
            </div>
            <div style={{ fontSize: 12.5, color: muted, marginTop: 6 }}>{stats.mature} mature · {stats.learning} learning · {stats.newCount} new</div>
            <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center" }}>
              {deck && deck.cards.some(c => c.reps > 0) && (
                <button onClick={() => {
                  const ahead = [...deck.cards].filter(c => c.reps > 0).sort((a, b) => a.due - b.due).slice(0, 25)
                  if (ahead.length) { studied.current = new Set(); setLog([]); setRevealed(false); setQueue(ahead); setPhase("card") }
                }} style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Review ahead</button>
              )}
              <button onClick={() => generate(deck)} style={{ background: "transparent", color: subtle, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Add more cards</button>
            </div>
          </div>
        )}

        {phase === "card" && current && previews && (
          <div style={{ width: "100%", maxWidth: 580 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 12, textAlign: "center" }}>
              {studied.current.size + 1} of {studied.current.size + queue.length}
              {current.reps === 0 && <span style={{ color: accent, marginLeft: 8 }}>new</span>}
              {current.reps > 0 && current.lapses > 0 && <span style={{ color: isDark ? "#f87171" : "#dc2626", marginLeft: 8 }}>lapsed</span>}
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "32px 28px", boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 20, lineHeight: 1.45, color: fg, fontWeight: 500 }}>{current.q}</div>
              {!revealed && current.hint && (
                <div style={{ marginTop: 18 }}>
                  {showHint
                    ? <div style={{ fontSize: 14, color: subtle, fontStyle: "italic" }}>💡 {current.hint}</div>
                    : <button onClick={() => setShowHint(true)} style={{ background: "none", border: "none", color: accent, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: font }}>Show hint</button>}
                </div>
              )}
              {revealed && (
                <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${border}` }}>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 8 }}>Answer</div>
                  <div style={{ fontSize: 17, lineHeight: 1.55, color: subtle }}>{current.a}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10 }}>
              {!revealed ? (
                <button onClick={() => setRevealed(true)} style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500 }}>
                  Reveal answer <span style={{ opacity: 0.6, fontSize: 12 }}>Space</span>
                </button>
              ) : (
                GRADES.map(({ g, label, key }) => (
                  <button key={g} onClick={() => grade(g)} style={{
                    flex: 1, maxWidth: 130, background: "transparent", color: gradeColor(g),
                    border: `1.5px solid ${gradeColor(g)}55`, borderRadius: 10, padding: "9px 0",
                    fontSize: 14.5, cursor: "pointer", fontFamily: font, fontWeight: 500,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  }}>
                    <span>{label} <span style={{ opacity: 0.45, fontSize: 11 }}>{key}</span></span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{previews[g]}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {phase === "done" && stats && (
          <div style={{ textAlign: "center", maxWidth: 400 }}>
            <div style={{ fontSize: 18, color: fg }}>Session done</div>
            <div style={{ fontSize: 13.5, color: muted, marginTop: 8 }}>Reviewed {studied.current.size} card{studied.current.size !== 1 ? "s" : ""}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
              {(["again", "hard", "good", "easy"] as Grade[]).map(g => {
                const n = log.filter(x => x === g).length
                return <div key={g} style={{ fontSize: 13, color: gradeColor(g) }}><b>{n}</b> {g}</div>
              })}
            </div>
            <div style={{ fontSize: 12.5, color: muted, marginTop: 18, lineHeight: 1.55 }}>
              {stats.dueNow > 0 ? `${stats.dueNow} still due.` : "Nothing left due."}
              {stats.nextDue ? ` Next card returns in ${relDue(stats.nextDue, now)}.` : ""}
            </div>
            <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center" }}>
              {stats.dueNow > 0 && deck && (
                <button onClick={() => startSession(deck)} style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Keep going</button>
              )}
              <button onClick={onClose} style={{ background: stats.dueNow > 0 ? "transparent" : accent, color: stats.dueNow > 0 ? subtle : "#fff", border: stats.dueNow > 0 ? `1px solid ${border}` : "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
