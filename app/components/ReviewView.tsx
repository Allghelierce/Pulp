"use client"
import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react"
import type { NoteData } from "@/app/types"
import { notebookReviewText } from "@/lib/notebookText"
import { apiFetch } from "@/lib/apiFetch"
import {
  type Deck, type ScheduledCard, type Grade,
  loadDeck, saveDeck, buildDeck, mergeCards, buildSession, applyGrade,
  previewIntervals, deckStats, hashNotes, isNew, sessionDueCount,
} from "@/lib/recallSchedule"
import type { GradeResult, Verdict } from "@/lib/recallPrompt"
import { normalizeTopic } from "@/lib/topics"

// Growth weight per AI verdict — growth comes from actual retrieval, not the clicked grade.
const VERDICT_WEIGHT: Record<Verdict, number> = { correct: 1, partial: 0.5, wrong: 0 }
// Scheduling grades the student may pick for each verdict (first = suggested default).
const ALLOWED_GRADES: Record<Verdict, Grade[]> = {
  correct: ["good", "easy", "hard"],
  partial: ["hard", "again"],
  wrong: ["again"],
}

interface ReviewViewProps {
  note: NoteData
  theme: "light" | "dark"
  accent: string
  onClose: () => void
  /** `practice` is true for "Review ahead" sessions, which earn nothing. */
  onComplete?: (result: { noteId: string; reviewed: number; again: number; practice: boolean }) => void
  /** Fired after a graded answer with a 0..1 growth weight (correct = 1, partial = 0.5)
   *  the answered card's topic tag (undefined for untagged cards), and the tree its session planted. */
  onCorrect?: (weight: number, topic?: string, treeId?: number) => void
  /** Limit the session to cards tagged with this topic ("Review <topic>" from the orchard). */
  topic?: string
  /** Summary "show in orchard" for a topic whose tree grew this session. */
  onShowTopic?: (topic: string) => void
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

export const ReviewView = memo(function ReviewView({ note, theme, accent, onClose, onComplete, onCorrect, topic, onShowTopic }: ReviewViewProps) {
  const isDark = theme === "dark"
  const font = "'Crimson Pro', serif"

  const noteText = useMemo(() => notebookReviewText(note), [note])
  const noteHash = useMemo(() => hashNotes(noteText), [noteText])

  // Topic mode: only cards tagged with `topic` are studied/counted.
  const topicKey = topic?.trim() ? normalizeTopic(topic) : null
  const inScope = useCallback(
    (c: ScheduledCard) => !topicKey || (!!c.topic && normalizeTopic(c.topic) === topicKey),
    [topicKey],
  )
  const scoped = useCallback((d: Deck): Deck => (topicKey ? { ...d, cards: d.cards.filter(inScope) } : d), [topicKey, inScope])

  const [phase, setPhase] = useState<Phase>("loading")
  const [error, setError] = useState("")
  const [deck, setDeck] = useState<Deck | null>(null)
  const [queue, setQueue] = useState<ScheduledCard[]>([])
  const [revealed, setRevealed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [log, setLog] = useState<Grade[]>([])
  // Topics whose trees this session fed, so mixed review keeps the card -> tree link.
  const [grown, setGrown] = useState<Record<string, number>>({})
  const [flash, setFlash] = useState<{ topic: string; id: number } | null>(null)
  // Produce-then-grade: the student types an answer, AI judges it.
  const [answer, setAnswer] = useState("")
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<GradeResult | null>(null)
  const [gradeFailed, setGradeFailed] = useState(false)
  const answerRef = useRef<HTMLTextAreaElement>(null)
  const studied = useRef<Set<string>>(new Set())
  // Cards already sent back once this session; a second "again" lets them go
  // (they're due again in 10 min) so an unanswerable card can't loop forever.
  const requeued = useRef<Set<string>>(new Set())
  // "Review ahead" re-studies cards early — practice only, no growth.
  const reviewingAhead = useRef(false)
  const driftDismissed = useRef(false)

  const bg = isDark ? "#09090b" : "#fafaf9"
  const fg = isDark ? "#e4e4e7" : "#18181b"
  const muted = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)"
  const subtle = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)"
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff"
  const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"

  // Clear the per-card attempt state when moving to a new card.
  const resetAttempt = useCallback(() => {
    setRevealed(false)
    setShowHint(false)
    setAnswer("")
    setResult(null)
    setGrading(false)
    setGradeFailed(false)
  }, [])

  const startSession = useCallback((d: Deck) => {
    const session = buildSession(scoped(d), Date.now(), !!topicKey)
    studied.current = new Set()
    requeued.current = new Set()
    reviewingAhead.current = false
    setLog([])
    setGrown({})
    resetAttempt()
    if (!session.length) { setPhase("caughtup"); return }
    setQueue(session)
    setPhase("card")
  }, [resetAttempt, scoped])

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
    if (!existing || !existing.cards.some(inScope)) {
      setDeck(existing)
      setPhase("empty")
    } else {
      setDeck(existing)
      startSession(existing)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id, topicKey])

  const current = queue[0]
  const now = Date.now()
  const previews = useMemo(() => (current ? previewIntervals(current, Date.now()) : null), [current])
  const notesDrifted = deck && deck.noteHash !== noteHash && !driftDismissed.current

  // Grades the student may pick: limited by the AI verdict so a wrong answer
  // can't be rated "Good". If grading failed, fall back to all four (self-grade).
  const allowedGrades: Grade[] = useMemo(
    () => (result ? ALLOWED_GRADES[result.verdict] : GRADES.map(x => x.g)),
    [result],
  )
  const suggestedGrade: Grade = allowedGrades[0]

  const grade = useCallback((g: Grade) => {
    if (!current || !deck) return
    const gnow = Date.now()
    const updated = applyGrade(current, g, gnow)
    const firstAttempt = !studied.current.has(current.id)
    studied.current.add(current.id)
    setLog(prev => [...prev, g])
    // Growth comes from the AI verdict (actual retrieval), not the clicked grade.
    // Ungraded (AI unavailable) answers grow nothing. Only a card's first attempt
    // per session counts ("again" requeues can't be farmed), and never when reviewing ahead.
    const weight = result ? VERDICT_WEIGHT[result.verdict] : 0
    if (weight > 0 && firstAttempt && !reviewingAhead.current) {
      onCorrect?.(weight, current.topic, current.treeId)
      const t = current.topic
      if (t) {
        // Keyed by normalized topic so "Photosynthesis"/"photosynthesis" share a chip.
        setGrown(prev => {
          const k = Object.keys(prev).find(x => normalizeTopic(x) === normalizeTopic(t)) ?? t
          return { ...prev, [k]: (prev[k] || 0) + weight }
        })
        setFlash({ topic: t, id: gnow })
      }
    }

    const nextDeck: Deck = { ...deck, cards: deck.cards.map(c => (c.id === updated.id ? updated : c)) }
    saveDeck(nextDeck)
    setDeck(nextDeck)

    const rest = queue.slice(1)
    const requeue = g === "again" && !requeued.current.has(updated.id)
    if (requeue) requeued.current.add(updated.id)
    const nextQueue = requeue ? [...rest, updated] : rest
    resetAttempt()
    if (nextQueue.length === 0) {
      setPhase("done")
      onComplete?.({ noteId: note.id, reviewed: studied.current.size, again: [...log, g].filter(x => x === "again").length, practice: reviewingAhead.current })
    } else {
      setQueue(nextQueue)
    }
  }, [current, deck, queue, log, note.id, onComplete, onCorrect, result, resetAttempt])

  // Send the typed answer to the AI grader, then reveal the expected answer.
  const submitAnswer = useCallback(async (giveUp = false) => {
    if (!current || grading || revealed) return
    const typed = giveUp ? "" : answer.trim()
    if (!typed) {
      setResult({ verdict: "wrong", feedback: giveUp ? "" : "No answer given — try retrieving it next time." })
      setRevealed(true)
      return
    }
    setGrading(true)
    try {
      const res = await apiFetch("/api/recall/grade", {
        method: "POST",
        body: JSON.stringify({ q: current.q, a: current.a, answer: typed }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.verdict) {
        setResult({ verdict: data.verdict, feedback: data.feedback || "" })
      } else {
        setGradeFailed(true)
      }
    } catch {
      setGradeFailed(true)
    } finally {
      setGrading(false)
      setRevealed(true)
    }
  }, [current, grading, revealed, answer])

  // Focus the answer box on each new card.
  useEffect(() => {
    if (phase === "card" && !revealed) answerRef.current?.focus()
  }, [phase, revealed, current?.id])

  // keyboard (only once revealed — before that, the textarea owns typing)
  useEffect(() => {
    if (phase !== "card" || !revealed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); grade(suggestedGrade); return }
      const m = GRADES.find(x => x.key === e.key)
      if (m && allowedGrades.includes(m.g)) grade(m.g)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, revealed, grade, suggestedGrade, allowedGrades])

  // Esc closes — unless a typed answer would be lost.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      if (phase === "card" && !revealed && answer.trim()) return
      if (grading || phase === "generating") return
      e.preventDefault()
      onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, revealed, answer, grading, onClose])

  const stats = deck ? deckStats(scoped(deck), now) : null
  // Notebook sessions pace new cards, so show what this session will actually cover.
  const dueShown = !stats || !deck ? 0 : topicKey ? stats.dueNow : sessionDueCount(deck, now)
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
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic?.trim() ? `Review ${topic.trim()}` : "Recall Review"}</div>
          <div style={{ fontSize: 15, color: fg, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.subject}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {stats && phase !== "loading" && (
            <div style={{ fontSize: 12, color: muted, display: "flex", gap: 12 }}>
              <span title="Due now"><b style={{ color: dueShown ? accent : muted }}>{dueShown}</b> due</span>
              {stats.total > stats.dueNow && <span title="Scheduled for later">{stats.total - stats.dueNow} later</span>}
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

        {phase === "empty" && topicKey && (
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 17, color: fg, marginBottom: 6 }}>No cards for {topic!.trim()} yet</div>
            <div style={{ fontSize: 13.5, color: muted, lineHeight: 1.55, marginBottom: 20 }}>Cards for this topic are made when a focus session on it ends. Reviewing this notebook&apos;s untagged cards can still grow it.</div>
            <button onClick={onClose} style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px 26px", fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500 }}>Close</button>
          </div>
        )}

        {phase === "empty" && !topicKey && (
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
              {deck && deck.cards.some(c => inScope(c) && !isNew(c)) && (
                <button onClick={() => {
                  const ahead = deck.cards.filter(c => inScope(c) && !isNew(c)).sort((a, b) => a.due - b.due).slice(0, 25)
                  if (ahead.length) { studied.current = new Set(); requeued.current = new Set(); reviewingAhead.current = true; setLog([]); resetAttempt(); setQueue(ahead); setPhase("card") }
                }} style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Review ahead</button>
              )}
              {/* Topic mode: new notebook-wide cards wouldn't belong to this topic. */}
              {!topicKey && <button onClick={() => generate(deck)} style={{ background: "transparent", color: subtle, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Add more cards</button>}
              {topicKey && !deck?.cards.some(c => inScope(c) && !isNew(c)) && (
                <button onClick={onClose} style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Done</button>
              )}
            </div>
          </div>
        )}

        {phase === "card" && current && previews && (
          <div style={{ width: "100%", maxWidth: 580 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 12, textAlign: "center" }}>
              {studied.current.size + 1} of {studied.current.size + queue.length}
              {isNew(current) && <span style={{ color: accent, marginLeft: 8 }}>new</span>}
              {!isNew(current) && current.lapses > 0 && <span style={{ color: isDark ? "#f87171" : "#dc2626", marginLeft: 8 }}>lapsed</span>}
              {current.topic && !topicKey && <span style={{ color: subtle, marginLeft: 8 }}>· {current.topic}</span>}
            </div>
            <div style={{ height: 18, marginTop: -6, marginBottom: 6, textAlign: "center" }}>
              {flash && (
                <span key={flash.id} style={{ fontSize: 12.5, color: accent, animation: "pulpGrowFlash 1.8s ease forwards" }}>+ {flash.topic} 🌱</span>
              )}
            </div>
            <style>{`@keyframes pulpGrowFlash { 0% { opacity: 0; transform: translateY(4px) } 15% { opacity: 1; transform: none } 75% { opacity: 1 } 100% { opacity: 0 } }`}</style>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "32px 28px", boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 20, lineHeight: 1.45, color: fg, fontWeight: 500 }}>{current.q}</div>
              {!revealed && current.hint && (
                <div style={{ marginTop: 18 }}>
                  {showHint
                    ? <div style={{ fontSize: 14, color: subtle, fontStyle: "italic" }}>💡 {current.hint}</div>
                    : <button onClick={() => setShowHint(true)} style={{ background: "none", border: "none", color: accent, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: font }}>Show hint</button>}
                </div>
              )}
              {/* Produce: type the answer from memory */}
              {!revealed && (
                <textarea
                  ref={answerRef}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer() } }}
                  disabled={grading}
                  placeholder="Type your answer from memory…"
                  rows={3}
                  maxLength={2000}
                  style={{
                    marginTop: 20, width: "100%", boxSizing: "border-box", resize: "vertical",
                    background: isDark ? "rgba(255,255,255,0.03)" : "#fafaf9", color: fg,
                    border: `1px solid ${border}`, borderRadius: 10, padding: "12px 14px",
                    fontSize: 16, lineHeight: 1.5, fontFamily: font, outline: "none",
                    opacity: grading ? 0.6 : 1,
                  }}
                />
              )}

              {revealed && (
                <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${border}` }}>
                  {result && (
                    <div style={{ marginBottom: 16 }}>
                      <span style={{
                        display: "inline-block", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                        fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                        color: result.verdict === "correct" ? gradeColor("easy") : result.verdict === "partial" ? gradeColor("hard") : gradeColor("again"),
                        background: `${result.verdict === "correct" ? gradeColor("easy") : result.verdict === "partial" ? gradeColor("hard") : gradeColor("again")}1a`,
                      }}>
                        {result.verdict === "correct" ? "Correct" : result.verdict === "partial" ? "Partly right" : "Not quite"}
                      </span>
                      {result.feedback && <div style={{ fontSize: 14.5, color: subtle, marginTop: 8, lineHeight: 1.5 }}>{result.feedback}</div>}
                    </div>
                  )}
                  {gradeFailed && (
                    <div style={{ fontSize: 12.5, color: muted, marginBottom: 12 }}>Couldn&apos;t auto-grade this one — rate yourself below.</div>
                  )}
                  {answer.trim() && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 6 }}>Your answer</div>
                      <div style={{ fontSize: 15.5, lineHeight: 1.5, color: subtle, whiteSpace: "pre-wrap" }}>{answer.trim()}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 8 }}>Answer</div>
                  <div style={{ fontSize: 17, lineHeight: 1.55, color: fg }}>{current.a}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 10 }}>
              {!revealed ? (
                <>
                  <button onClick={() => submitAnswer(true)} disabled={grading} style={{ background: "transparent", color: muted, border: `1px solid ${border}`, borderRadius: 10, padding: "11px 20px", fontSize: 14.5, cursor: grading ? "default" : "pointer", fontFamily: font }}>
                    I don&apos;t know
                  </button>
                  <button onClick={() => submitAnswer()} disabled={grading} style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 15, cursor: grading ? "default" : "pointer", fontFamily: font, fontWeight: 500, opacity: grading ? 0.75 : 1 }}>
                    {grading ? "Checking…" : <>Check answer <span style={{ opacity: 0.6, fontSize: 12 }}>⏎</span></>}
                  </button>
                </>
              ) : (
                GRADES.filter(({ g }) => allowedGrades.includes(g)).map(({ g, label, key }) => {
                  const suggested = g === suggestedGrade
                  return (
                    <button key={g} onClick={() => grade(g)} style={{
                      flex: 1, maxWidth: 130,
                      background: suggested ? gradeColor(g) : "transparent",
                      color: suggested ? "#fff" : gradeColor(g),
                      border: `1.5px solid ${suggested ? gradeColor(g) : `${gradeColor(g)}55`}`, borderRadius: 10, padding: "9px 0",
                      fontSize: 14.5, cursor: "pointer", fontFamily: font, fontWeight: 500,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    }}>
                      <span>{label} <span style={{ opacity: 0.55, fontSize: 11 }}>{suggested ? "⏎" : key}</span></span>
                      <span style={{ fontSize: 11, opacity: 0.75 }}>{previews[g]}</span>
                    </button>
                  )
                })
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
            {Object.keys(grown).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginBottom: 8 }}>Trees that grew</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {Object.entries(grown).map(([t, w]) => (
                    <button key={t} onClick={() => onShowTopic?.(t)} disabled={!onShowTopic} title={onShowTopic ? "Show in orchard" : undefined} style={{
                      background: `${accent}14`, color: accent, border: `1px solid ${accent}40`, borderRadius: 999,
                      padding: "5px 12px", fontSize: 13, fontFamily: font, cursor: onShowTopic ? "pointer" : "default",
                    }}>🌱 {t} <span style={{ opacity: 0.7 }}>+{Math.round(w * 10) / 10}</span></button>
                  ))}
                </div>
              </div>
            )}
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
