"use client"
import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react"
import { requestUpgrade } from "@/lib/billing"
import { playSound } from "@/lib/sound"
import type { NoteData } from "@/app/types"
import { extractTextFromHTML } from "@/lib/sanitize"
import { apiFetch } from "@/lib/apiFetch"
import {
  type Deck, type ScheduledCard, type Grade,
  loadDeck, saveDeck, buildDeck, mergeCards, buildSession, applyGrade, addTopicCards, firstRecallDue,
  previewIntervals, deckStats, hashNotes,
  comesBackThisSession,
} from "@/lib/recallSchedule"
import { MAX_TEXT, type GradeResult, type Verdict } from "@/lib/recallPrompt"
import { normalizeTopic } from "@/lib/topics"
import { readableOn } from "@/lib/accent"
import {
  uncoveredPages, notebookLines, markCovered, seedCoverage, exclusiveCarding, cardsLimitedToday, setCardsLimitedToday,
  shuffled, saveProgress, loadProgress, claimFullReviewSap, MAX_PAGES_PER_START, type TopicScore, type FullTally,
} from "@/lib/fullReview"

const MIX_KEY = "pulp-recall-mix"
const MIX_LIMITED_NOTE = "Free mixed wording is used up today."
// Free accounts past today's mixed-wording sessions: skip the call for the rest of the day (this page load).
let rephraseLimitedDay = ""
const todayStr = () => new Date().toISOString().slice(0, 10)

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
  onComplete?: (result: { noteId: string; reviewed: number; again: number }) => void
  /** Fired after a graded answer with a 0..1 growth weight (correct = 1, partial = 0.5)
   *  and the answered card's topic tag (undefined for untagged cards). */
  onCorrect?: (weight: number, topic?: string, meta?: { cardId: string; full: boolean }) => number | void
  /** "due" = spaced-repetition session (default); "full" = every card in the notebook. */
  mode?: "due" | "full"
  /** Limit the session to cards tagged with this topic ("Review <topic>" from the orchard). */
  topic?: string
  /** Summary "show in orchard" for a topic whose tree grew this session. */
  onShowTopic?: (topic: string) => void
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

export const ReviewView = memo(function ReviewView({ note, theme, accent, onClose, onComplete, onCorrect, topic, onShowTopic, mode: initialMode = "due" }: ReviewViewProps) {
  const isDark = theme === "dark"
  const onAccent = readableOn(accent) // text on accent-filled buttons
  const font = "'Crimson Pro', serif"

  const noteText = useMemo(() => gatherNotebookText(note), [note])
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
  // Free accounts out of today's AI grading: skip the call for the rest of the session.
  const [gradeLimited, setGradeLimited] = useState(false)
  const answerRef = useRef<HTMLTextAreaElement>(null)
  const studied = useRef<Set<string>>(new Set())
  // "Review ahead" re-studies cards early — practice only, no growth.
  const reviewingAhead = useRef(false)
  const driftDismissed = useRef(false)

  // ── full review: every card, shuffled, scored per topic, resumable ──
  const [mode, setMode] = useState<"due" | "full">(initialMode)
  const full = mode === "full"
  const [genMsg, setGenMsg] = useState("")
  const [scores, setScores] = useState<Record<string, TopicScore>>({})
  const [missed, setMissed] = useState<string[]>([])
  const [rested, setRested] = useState<{ topic: string; id: number } | null>(null)
  // Sap-eligible first attempts (due, or grew a tree) and their misses.
  const sapCounted = useRef(0)
  const sapAgain = useRef(0)
  // "Drill misses" pass: scored on its own, never saved as resume progress.
  const [drilling, setDrilling] = useState(false)
  // Cards left when a saved full review was resumed (shows "Start over").
  const [resumed, setResumed] = useState(0)
  // Bumped by every session start / mode switch / unmount: a full-review start
  // still making cards checks it after each await and stops if it changed.
  const runRef = useRef(0)
  const skipGen = useRef(false)  // user chose to skip on-demand carding
  // "Mix up wording": show an AI rephrasing so the idea is tested, not the sentence.
  const [mix, setMix] = useState(() => { try { return localStorage.getItem(MIX_KEY) !== "0" } catch { return true } })
  const [mixNote, setMixNote] = useState(() => (rephraseLimitedDay === todayStr() ? MIX_LIMITED_NOTE : ""))
  // Which wording each card shows: stable within a session, reshuffled per session.
  const [wordSeed, setWordSeed] = useState(1)
  const rephraseAsked = useRef(false)               // one rephrase call per session
  const rephraseSent = useRef<Set<string>>(new Set()) // cards already sent (in flight or done)
  // Wording frozen per card the first time it's shown this session (alts arriving
  // later, or toggling Mix, never change a question the student is answering).
  const wording = useRef<{ seed: number; byId: Map<string, string> }>({ seed: 0, byId: new Map() })

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
    runRef.current++ // cancels a full-review start still making cards
    setWordSeed(s => s + 1)
    rephraseAsked.current = false
    const session = buildSession(scoped(d), Date.now())
    studied.current = new Set()
    reviewingAhead.current = false
    setLog([])
    setGrown({})
    setFlash(null); setRested(null)
    resetAttempt()
    if (!session.length) { setPhase("caughtup"); return }
    setQueue(session)
    setPhase("card")
  }, [resetAttempt, scoped])

  // Full review: card any uncarded text first (on demand), then queue every card.
  const startFull = useCallback(async (resume = true) => {
    const run = ++runRef.current
    const stale = () => run !== runRef.current // closed, switched mode, or restarted
    skipGen.current = false
    studied.current = new Set()
    reviewingAhead.current = false
    sapCounted.current = 0
    sapAgain.current = 0
    rephraseAsked.current = false
    setWordSeed(s => s + 1)
    setLog([]); setGrown({}); setScores({}); setMissed([]); setFlash(null); setRested(null); setDrilling(false); setResumed(0)
    resetAttempt()

    if (!topicKey) {
      // One carding run per notebook: a second start (reopened panel) waits for this one.
      await exclusiveCarding(note.id, async () => {
        if (stale()) return
        // Decks from before coverage tracking: their cards stand for the notes as they are.
        const d = seedCoverage(note.id, notebookLines(note))
        if (cardsLimitedToday()) return
        const todo = uncoveredPages(note, d).slice(0, MAX_PAGES_PER_START)
        if (!todo.length) return
        setPhase("generating")
        const topics = [...new Set((d?.cards || []).map(c => c.topic).filter((t): t is string => !!t))]
        const existing = (d?.cards || []).slice(-40).map(c => c.q) // so the AI doesn't repeat cards
        for (let n = 0; n < todo.length; n++) {
          if (stale()) return
          if (skipGen.current) break                       // "Skip — review what's there"
          const { i, text } = todo[n]
          setGenMsg(`Making cards for page ${i + 1} (${n + 1} of ${todo.length})…`)
          try {
            const res = await apiFetch("/api/recall/topic", { method: "POST", body: JSON.stringify({ text, title: note.subject, topics, existing: existing.slice(-40), mode: "page" }) })
            const data = await res.json().catch(() => null)
            if (!res.ok) break                               // 402/429 etc. — review what exists
            if (data?.cardsLimited) { setCardsLimitedToday(); if (!stale()) requestUpgrade({ code: "cards_limit" }); break }
            const t = typeof data?.topic === "string" ? data.topic.trim() : ""
            if (t && Array.isArray(data.cards) && data.cards.length) {
              const now = Date.now()
              // Studied right now in this review; for spacing they first come due tomorrow morning.
              addTopicCards(note.id, data.cards, t, now, d ? undefined : noteHash, undefined, firstRecallDue(now))
              if (!topics.includes(t)) topics.push(t)
              for (const c of data.cards) if (typeof c?.q === "string") existing.push(c.q)
            }
            markCovered(note.id, text.split("\n"))
          } catch { break }
        }
        // Every page has cards now: the deck is in sync with the notes (no drift banner).
        const after = loadDeck(note.id)
        if (after && !uncoveredPages(note, after).length) saveDeck({ ...after, noteHash })
      })
      if (stale()) return
      setGenMsg("")
    }
    const d = loadDeck(note.id)
    setDeck(d)
    const pool = d ? scoped(d).cards : []
    if (!pool.length) { setPhase("empty"); return }
    // Resume: the saved remaining cards + cards added since, with the tallies so far.
    const left = resume ? loadProgress(note.id, pool) : null
    const tally: FullTally = left
      ? { done: left.done, scores: left.scores, missed: left.missed, grown: left.grown, sap: left.sap, sapAgain: left.sapAgain }
      : { done: [], scores: {}, missed: [], grown: {}, sap: 0, sapAgain: 0 }
    if (left) {
      studied.current = new Set(left.done)
      sapCounted.current = left.sap
      sapAgain.current = left.sapAgain
      setScores(left.scores); setMissed(left.missed); setGrown(left.grown); setResumed(left.queue.length)
    }
    const q = left?.queue ?? shuffled(pool)
    saveProgress(note.id, q.map(c => c.id), tally)
    setQueue(q)
    setPhase("card")
  }, [note, noteHash, topicKey, scoped, resetAttempt])

  const switchMode = useCallback((m: "due" | "full") => {
    runRef.current++ // a full-review start still making cards must not take over
    setMode(m)
    if (m === "full") { startFull(); return }
    const d = loadDeck(note.id)
    if (d && d.cards.some(inScope)) { setDeck(d); startSession(d) } else setPhase("empty")
  }, [note.id, inScope, startFull, startSession])

  const generate = useCallback(async () => {
    const run = ++runRef.current
    setPhase("generating")
    setError("")
    setGenMsg("")
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
      // Merge into the deck as stored now (a session or full review may have added cards meanwhile).
      const existing = loadDeck(note.id)
      const merged = existing ? mergeCards(existing, cards, noteText, now) : buildDeck(note.id, cards, noteText, now)
      saveDeck(merged)
      // These cards came from the notebook text the route reads (its first MAX_TEXT chars).
      const sent = noteText.length > MAX_TEXT ? noteText.slice(0, noteText.lastIndexOf("\n", MAX_TEXT) || MAX_TEXT) : noteText
      markCovered(note.id, notebookLines(note).filter(l => sent.includes(l)))
      if (run !== runRef.current) return // closed or switched meanwhile — the cards are saved
      driftDismissed.current = true
      if (full) { startFull(false); return } // whole notebook: every card, not a due session
      const next = loadDeck(note.id) ?? merged
      setDeck(next)
      startSession(next)
    } catch (err) {
      if (run !== runRef.current) return
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPhase("error")
    }
  }, [noteText, note, startSession, startFull, full])

  // initial load
  useEffect(() => {
    if (initialMode === "full") { startFull(); return }
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

  // Closing the review stops a full-review start that's still making cards.
  useEffect(() => { const run = runRef; return () => { run.current++ } }, [])

  // Mix up wording: one rephrase call per session for cards that have no alternates yet.
  useEffect(() => {
    if (!mix || phase !== "card" || rephraseAsked.current || rephraseLimitedDay === todayStr()) return
    const need = queue.filter(c => !c.alts?.length && !rephraseSent.current.has(c.id)).slice(0, 40)
    if (!need.length) return
    rephraseAsked.current = true
    for (const c of need) rephraseSent.current.add(c.id)
    ;(async () => {
      try {
        const res = await apiFetch("/api/recall/rephrase", { method: "POST", body: JSON.stringify({ cards: need.map(c => ({ id: c.id, q: c.q, a: c.a })) }) })
        const data = await res.json().catch(() => null)
        if (res.status === 402) { rephraseLimitedDay = todayStr(); setMixNote(MIX_LIMITED_NOTE); return }
        const alts = (data?.alts || {}) as Record<string, string[]>
        if (!Object.keys(alts).length) return
        const patch = (c: ScheduledCard) => (alts[c.id] ? { ...c, alts: alts[c.id] } : c)
        const d = loadDeck(note.id)
        if (d) { const nd = { ...d, cards: d.cards.map(patch) }; saveDeck(nd); setDeck(nd) }
        setQueue(q => q.map(patch))
      } catch {}
    })()
  }, [mix, phase, queue, note.id])

  const current = queue[0]
  const now = Date.now()
  // The wording shown for this card: picked once per card per session (original or a rephrasing).
  const shownQuestion = useMemo(() => {
    if (!current) return ""
    const w = wording.current
    if (w.seed !== wordSeed) { w.seed = wordSeed; w.byId = new Map() }
    const kept = w.byId.get(current.id)
    if (kept) return kept
    const options = mix && current.alts?.length ? [current.q, ...current.alts] : [current.q]
    let h = wordSeed
    for (let i = 0; i < current.id.length; i++) h = (h * 31 + current.id.charCodeAt(i)) >>> 0
    const pick = options[h % options.length]
    w.byId.set(current.id, pick)
    return pick
  }, [current, mix, wordSeed])
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
    // Full review: cards that weren't due only change schedule on a miss
    // (cramming must not push intervals out); due cards schedule normally.
    const wasDue = current.due <= gnow
    const updated = full && !wasDue ? (g === "again" ? applyGrade(current, "again", gnow) : current) : applyGrade(current, g, gnow)
    const firstAttempt = !studied.current.has(current.id)
    studied.current.add(current.id)
    setLog(prev => [...prev, g])
    // Growth comes from the AI verdict (actual retrieval), not the clicked grade.
    // Ungraded (AI unavailable) answers grow nothing. Only a card's first attempt
    // per session counts ("again" requeues can't be farmed), and never when reviewing ahead.
    const weight = result ? VERDICT_WEIGHT[result.verdict] : 0
    let granted = 0
    let nextGrown = grown
    if (weight > 0 && firstAttempt && !reviewingAhead.current) {
      const r = onCorrect?.(weight, current.topic, { cardId: current.id, full })
      granted = typeof r === "number" ? r : weight
      const t = current.topic
      if (t && granted > 0) {
        nextGrown = { ...grown, [t]: (grown[t] || 0) + granted }
        setGrown(nextGrown)
        setFlash({ topic: t, id: gnow })
      } else if (t && full) {
        setRested({ topic: t, id: gnow })
      }
    }
    let nextScores = scores, nextMissed = missed
    if (full && firstAttempt) {
      // Score: AI verdict when graded, else the self-grade.
      const right = result ? (result.verdict === "correct" ? 1 : result.verdict === "partial" ? 0.5 : 0) : (g === "good" || g === "easy" ? 1 : g === "hard" ? 0.5 : 0)
      const key = current.topic || "Other"
      nextScores = { ...scores, [key]: { right: (scores[key]?.right || 0) + right, total: (scores[key]?.total || 0) + 1 } }
      setScores(nextScores)
      if (right < 1 && !missed.includes(current.id)) { nextMissed = [...missed, current.id]; setMissed(nextMissed) }
      // Sap: cards that were due or grew a tree, each at most once a day (re-runs can't farm it).
      if ((wasDue || granted > 0) && claimFullReviewSap(current.id)) {
        sapCounted.current++
        if (g === "again") sapAgain.current++
      }
    }
    if (resumed) setResumed(0)

    const nextDeck: Deck = { ...deck, cards: deck.cards.map(c => (c.id === updated.id ? updated : c)) }
    saveDeck(nextDeck)
    setDeck(nextDeck)

    const rest = queue.slice(1)
    // Learning steps (1m/10m) come back later in this sitting, like Anki — in full
    // review only misses do (one pass through the notebook, then the ones you missed).
    const comesBack = full ? g === "again" && comesBackThisSession(updated, gnow) : comesBackThisSession(updated, gnow)
    const nextQueue = comesBack ? [...rest, updated] : rest
    resetAttempt()
    if (full && !drilling) {
      saveProgress(note.id, nextQueue.map(c => c.id), {
        done: [...studied.current], scores: nextScores, missed: nextMissed, grown: nextGrown, sap: sapCounted.current, sapAgain: sapAgain.current,
      })
    }
    if (nextQueue.length === 0) {
      setPhase("done")
      // Full review only pays sap for cards that were due or grew a tree (no sap farming),
      // and only their misses count against it.
      onComplete?.({ noteId: note.id, reviewed: full ? sapCounted.current : studied.current.size, again: full ? sapAgain.current : [...log, g].filter(x => x === "again").length })
    } else {
      setQueue(nextQueue)
    }
  }, [current, deck, queue, log, note.id, onComplete, onCorrect, result, resetAttempt, full, grown, scores, missed, resumed, drilling])

  // Send the typed answer to the AI grader, then reveal the expected answer.
  const submitAnswer = useCallback(async (giveUp = false) => {
    if (!current || grading || revealed) return
    const typed = giveUp ? "" : answer.trim()
    if (!typed) {
      setResult({ verdict: "wrong", feedback: giveUp ? "" : "No answer given — try retrieving it next time." })
      setRevealed(true)
      return
    }
    if (gradeLimited) { setGradeFailed(true); setRevealed(true); return }
    setGrading(true)
    try {
      const res = await apiFetch("/api/recall/grade", {
        method: "POST",
        body: JSON.stringify({ q: shownQuestion || current.q, a: current.a, answer: typed }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.verdict) {
        setResult({ verdict: data.verdict, feedback: data.feedback || "" })
        playSound(data.verdict === "correct" ? "correct" : data.verdict === "partial" ? "partial" : "wrong")
      } else {
        if (res.status === 402 && data?.code === "grade_limit") setGradeLimited(true)
        setGradeFailed(true)
      }
    } catch {
      setGradeFailed(true)
    } finally {
      setGrading(false)
      setRevealed(true)
    }
  }, [current, grading, revealed, answer, gradeLimited, shownQuestion])

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

  const stats = deck ? deckStats(scoped(deck), now) : null
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
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic?.trim() ? `Review ${topic.trim()}` : full ? "Full review" : "Recall Review"}</div>
          <div style={{ fontSize: 15, color: fg, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.subject}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {!topicKey && (
            <div role="tablist" style={{ display: "flex", padding: 2, borderRadius: 999, border: `1px solid ${border}` }}>
              {(["due", "full"] as const).map(m => (
                <button key={m} role="tab" aria-selected={mode === m} disabled={phase === "generating"} onClick={() => { if (mode !== m) switchMode(m) }} style={{
                  border: "none", cursor: phase === "generating" ? "default" : "pointer", borderRadius: 999, padding: "4px 12px", fontSize: 12.5, fontFamily: font,
                  background: mode === m ? accent : "transparent", color: mode === m ? onAccent : subtle, opacity: phase === "generating" && mode !== m ? 0.5 : 1,
                }}>{m === "due" ? "Due" : "Whole notebook"}</button>
              ))}
            </div>
          )}
          <button
            onClick={() => { const v = !mix; setMix(v); try { localStorage.setItem(MIX_KEY, v ? "1" : "0") } catch {} }}
            title="Show each question in different words, so you learn the idea instead of the sentence"
            style={{ border: `1px solid ${mix ? `${accent}66` : border}`, background: mix ? `${accent}14` : "transparent", color: mix ? accent : muted, borderRadius: 999, padding: "4px 11px", fontSize: 12, cursor: "pointer", fontFamily: font }}
            aria-pressed={mix}
            onMouseDown={e => e.preventDefault()}
          >{mix ? "✓ " : ""}Mix wording</button>
          {full && phase === "card" && (
            <span style={{ fontSize: 12, color: muted }}><b style={{ color: accent }}>{queue.length}</b> left</span>
          )}
          {stats && phase !== "loading" && !full && (
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
      {notesDrifted && phase === "card" && !full && (
        <div style={{ padding: "8px 24px", background: isDark ? "rgba(251,191,36,0.08)" : "rgba(217,119,6,0.07)", borderBottom: `1px solid ${border}`, fontSize: 12.5, color: subtle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>Your notes changed since this deck was built.</span>
          <span>
            <button onClick={() => generate()} style={{ background: "none", border: "none", color: accent, cursor: "pointer", fontSize: 12.5, fontFamily: font, padding: 0 }}>Regenerate</button>
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

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px" }}>
        {/* auto margins center short content but let tall content start at the top and scroll */}
        <div style={{ margin: "auto 0", width: "100%", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>

        {(phase === "loading" || phase === "generating") && (
          <div style={{ textAlign: "center", color: subtle }}>
            <div style={{ width: 44, height: 44, margin: "0 auto 18px", borderRadius: "50%", border: `2.5px solid ${accent}30`, borderTopColor: accent, animation: "rv-spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 15, color: fg }}>{phase === "generating" ? (genMsg ? "Covering your whole notebook…" : "Reading your notes…") : "Loading deck…"}</div>
            {phase === "generating" && <div style={{ fontSize: 12.5, color: muted, marginTop: 4 }}>{genMsg || "Building active-recall cards"}</div>}
            {phase === "generating" && genMsg && (
              <button onClick={() => { skipGen.current = true; setGenMsg("Finishing this page…") }} style={{ marginTop: 16, background: "none", border: `1px solid ${border}`, color: subtle, borderRadius: 999, padding: "6px 14px", fontSize: 12.5, cursor: "pointer", fontFamily: font }}>Skip — review what&apos;s there</button>
            )}
            <style>{`@keyframes rv-spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {phase === "empty" && topicKey && (
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 17, color: fg, marginBottom: 6 }}>No cards for {topic!.trim()} yet</div>
            <div style={{ fontSize: 13.5, color: muted, lineHeight: 1.55, marginBottom: 20 }}>Cards for this topic are made when a focus session on it ends. Reviewing this notebook&apos;s untagged cards can still grow it.</div>
            <button onClick={onClose} style={{ background: accent, color: onAccent, border: "none", borderRadius: 10, padding: "11px 26px", fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500 }}>Close</button>
          </div>
        )}

        {phase === "empty" && !topicKey && (
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 17, color: fg, marginBottom: 6 }}>No review deck yet</div>
            <div style={{ fontSize: 13.5, color: muted, lineHeight: 1.55, marginBottom: 20 }}>Pulp will read this notebook and build active-recall cards, then schedule them so easy ones return less often.</div>
            <button onClick={() => generate()} style={{ background: accent, color: onAccent, border: "none", borderRadius: 10, padding: "11px 26px", fontSize: 15, cursor: "pointer", fontFamily: font, fontWeight: 500 }}>Build deck</button>
          </div>
        )}

        {phase === "error" && (
          <div style={{ textAlign: "center", maxWidth: 340 }}>
            <div style={{ fontSize: 15, color: fg, marginBottom: 6 }}>Can&apos;t review yet</div>
            <div style={{ fontSize: 13, color: muted, lineHeight: 1.5, marginBottom: 18 }}>{error}</div>
            <button onClick={() => generate()} style={{ background: accent, color: onAccent, border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontFamily: font }}>Try again</button>
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
            <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {!topicKey && (
                <button onClick={() => switchMode("full")} style={{ background: accent, color: onAccent, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Review whole notebook</button>
              )}
              {deck && deck.cards.some(c => inScope(c) && c.reps > 0) && (
                <button onClick={() => {
                  const ahead = deck.cards.filter(c => inScope(c) && c.reps > 0).sort((a, b) => a.due - b.due).slice(0, 25)
                  if (ahead.length) { studied.current = new Set(); reviewingAhead.current = true; setLog([]); resetAttempt(); setQueue(ahead); setPhase("card") }
                }} style={{ background: accent, color: onAccent, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Review ahead</button>
              )}
              <button onClick={() => generate()} style={{ background: "transparent", color: subtle, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Add more cards</button>
            </div>
          </div>
        )}

        {phase === "card" && current && previews && (
          <div style={{ width: "100%", maxWidth: 580 }}>
            <div style={{ fontSize: 12, color: muted, marginBottom: 12, textAlign: "center" }}>
              {studied.current.size + 1} of {studied.current.size + queue.length}
              {current.reps === 0 && <span style={{ color: accent, marginLeft: 8 }}>new</span>}
              {current.reps > 0 && current.lapses > 0 && <span style={{ color: isDark ? "#f87171" : "#dc2626", marginLeft: 8 }}>lapsed</span>}
              {current.topic && !topicKey && <span style={{ color: subtle, marginLeft: 8 }}>· {current.topic}</span>}
            </div>
            {full && resumed > 0 && (
              <div style={{ fontSize: 11.5, color: muted, textAlign: "center", marginTop: -6, marginBottom: 8 }}>
                Resuming where you left off ·{" "}
                <button onClick={() => startFull(false)} style={{ background: "none", border: "none", padding: 0, color: accent, cursor: "pointer", font: "inherit", textDecoration: "underline" }}>Start over</button>
              </div>
            )}
            {mix && mixNote && (
              <div style={{ fontSize: 11.5, color: muted, textAlign: "center", marginTop: -6, marginBottom: 8 }}>
                {mixNote}{" "}
                <button onClick={() => requestUpgrade({ code: "rephrase_upsell" })} style={{ background: "none", border: "none", padding: 0, color: "#d97706", cursor: "pointer", font: "inherit", textDecoration: "underline" }}>Plus mixes every session</button>
              </div>
            )}
            <div style={{ height: 18, marginTop: -6, marginBottom: 6, textAlign: "center" }}>
              {flash && (!rested || flash.id > rested.id) && (
                <span key={flash.id} style={{ fontSize: 12.5, color: accent, animation: "pulpGrowFlash 1.8s ease forwards" }}>+ {flash.topic} 🌱</span>
              )}
              {rested && (!flash || rested.id > flash.id) && (
                <span key={rested.id} style={{ fontSize: 12.5, color: muted, animation: "pulpGrowFlash 2.4s ease forwards" }}>{rested.topic} 🌱 rested for today — still good practice</span>
              )}
            </div>
            <style>{`@keyframes pulpGrowFlash { 0% { opacity: 0; transform: translateY(4px) } 15% { opacity: 1; transform: none } 75% { opacity: 1 } 100% { opacity: 0 } }`}</style>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "32px 28px", boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 20, lineHeight: 1.45, color: fg, fontWeight: 500 }}>{shownQuestion || current.q}</div>
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
                    <div style={{ fontSize: 12.5, color: muted, marginBottom: 12 }}>
                      {gradeLimited ? (<>
                        Today&apos;s free AI grading is used up — rate yourself below.{" "}
                        <button onClick={() => requestUpgrade({ code: "grade_upsell" })} style={{ background: "none", border: "none", padding: 0, color: accent, cursor: "pointer", font: "inherit", textDecoration: "underline" }}>Plus grades every answer</button>
                      </>) : <>Couldn&apos;t auto-grade this one — rate yourself below.</>}
                    </div>
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
                  <button onClick={() => submitAnswer()} disabled={grading} style={{ background: accent, color: onAccent, border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 15, cursor: grading ? "default" : "pointer", fontFamily: font, fontWeight: 500, opacity: grading ? 0.75 : 1 }}>
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
                      color: suggested ? readableOn(gradeColor(g)) : gradeColor(g),
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

        {phase === "done" && full && (() => {
          const rows = Object.entries(scores).map(([t, v]) => ({ t, ...v, pct: v.total ? v.right / v.total : 0 })).sort((a, b) => a.pct - b.pct)
          const right = rows.reduce((n, r) => n + r.right, 0), total = rows.reduce((n, r) => n + r.total, 0)
          const missedCards = (deck?.cards || []).filter(c => missed.includes(c.id))
          return (
            <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
              <div style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: muted }}>{drilling ? "Missed cards" : "Whole notebook"}</div>
              <div style={{ fontSize: 40, color: fg, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{total ? Math.round((right / total) * 100) : 0}%</div>
              <div style={{ fontSize: 13.5, color: muted, marginTop: 2 }}>{Math.round(right * 10) / 10} of {total} right</div>
              <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                {rows.map(r => (
                  <div key={r.t}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: fg }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.t}</span>
                      <span style={{ color: r.pct < 0.6 ? gradeColor("again") : r.pct < 0.85 ? gradeColor("hard") : gradeColor("easy"), fontVariantNumeric: "tabular-nums", flexShrink: 0, marginLeft: 10 }}>{Math.round(r.right * 10) / 10}/{r.total}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, marginTop: 4, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <div style={{ height: "100%", borderRadius: 2, width: `${r.pct * 100}%`, background: r.pct < 0.6 ? gradeColor("again") : r.pct < 0.85 ? gradeColor("hard") : gradeColor("easy") }} />
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(grown).length > 0 && (
                <div style={{ fontSize: 12.5, color: accent, marginTop: 16 }}>🌱 Grew {Object.keys(grown).join(", ")}</div>
              )}
              <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                {missedCards.length > 0 && (
                  <button onClick={() => {
                    studied.current = new Set(); sapCounted.current = 0; sapAgain.current = 0; rephraseAsked.current = false
                    setScores({}); setMissed([]); setLog([]); setFlash(null); setRested(null); setDrilling(true); resetAttempt(); setWordSeed(x => x + 1)
                    setQueue(shuffled(missedCards)); setPhase("card") // a drill isn't saved as resume progress
                  }} style={{ background: accent, color: onAccent, border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Drill misses ({missedCards.length})</button>
                )}
                <button onClick={onClose} style={{ background: missedCards.length ? "transparent" : accent, color: missedCards.length ? subtle : onAccent, border: missedCards.length ? `1px solid ${border}` : "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Done</button>
              </div>
            </div>
          )
        })()}

        {phase === "done" && stats && !full && (
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
                <button onClick={() => startSession(deck)} style={{ background: accent, color: onAccent, border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Keep going</button>
              )}
              <button onClick={onClose} style={{ background: stats.dueNow > 0 ? "transparent" : accent, color: stats.dueNow > 0 ? subtle : onAccent, border: stats.dueNow > 0 ? `1px solid ${border}` : "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, cursor: "pointer", fontFamily: font }}>Done</button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
})
