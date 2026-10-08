"use client"
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { SelectionFontSize, selectionHost } from "@/app/components/SelectionFontSize"
import { ACCENT, accentAlpha } from "@/lib/accent"
import { supabase } from "@/lib/supabase"
import { addTopicCards, cardId, editCard, firstRecallDue, hashNotes, loadDeck, removeCard, saveDeck } from "@/lib/recallSchedule"
import { clozeCard, lineCard, localCard, paragraphOf, pickTopic, readHighlight, dueLabel, type Highlight } from "@/lib/highlightCard"
import { notebookReviewText } from "@/lib/fullReview"
import { buildTopicIndex } from "@/lib/topicIndex"
import { normalizeTopic } from "@/lib/topics"
import { formatShortcut, matchesShortcut } from "@/lib/shortcuts"
import { useGroveStore } from "@/app/store/useGroveStore"
import { HIGHLIGHT_MIN, type Card } from "@/lib/recallPrompt"
import type { NoteData } from "@/app/types"

// Highlight-to-card ("notes that quiz you"): select text in a text box, hit Card in
// the selection bubble (or the shortcut) and it becomes a recall card in this
// notebook's deck, first due tomorrow morning like session cards. A toast confirms,
// with Undo and the Q/A editable in place. The note's HTML is never touched.

const HIDE_MS = 8000
const AI_TIMEOUT_MS = 12_000

interface Made {
  key: number
  src: string      // notebook + highlighted text: pressing again on it keeps this toast
  place: "top" | "bottom"  // away from the highlight, so the lines around it stay in view
  noteId: string
  id: string
  q: string
  a: string
  topic: string
  due: number
  dueText: string  // "due tomorrow"
  added: boolean   // false: the deck already had this card
  ai: boolean
  note?: string    // why the AI wasn't used (e.g. today's free allowance is spent)
  hint?: string    // no card: why, and what to highlight instead
  undone?: boolean
  nudge?: number   // pressed again while showing: re-arm and flash
}

// Q/A as saved: spaces tidied, line breaks (Shift+Enter) kept.
const tidyField = (s: string) => s.replace(/[^\S\n]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim()

const queued = (detail: Record<string, unknown>) => {
  try { window.dispatchEvent(new CustomEvent("pulp-cards-queued", { detail })) } catch { }
}

// Signed-in only. Plain fetch (not apiFetch): a spent allowance shouldn't pop the
// upgrade dialog over the page — the card is made locally instead.
async function aiCard(h: Highlight, title: string): Promise<{ card?: Card; limited?: boolean }> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return {}
    const res = await fetch("/api/recall", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ mode: "highlight", text: h.selected, context: paragraphOf(h), title }),
      signal: ctrl.signal,
    })
    if (res.status === 402) return { limited: true }
    if (!res.ok) return {}
    const data = await res.json().catch(() => null)
    const c = data?.cards?.[0]
    if (typeof c?.q !== "string" || typeof c?.a !== "string" || !c.q.trim() || !c.a.trim()) return {}
    return { card: { q: c.q.trim(), a: c.a.trim(), hint: typeof c.hint === "string" ? c.hint.trim() : "" } }
  } catch { return {} } finally { clearTimeout(t) }
}

// This notebook's topics (trees + tagged cards), best match for the highlight first.
function topicFor(noteId: string, subject: string, context: string): string {
  const rows = buildTopicIndex(useGroveStore.getState().grove).filter(r => r.notebookIds.includes(noteId))
  const cards = loadDeck(noteId)?.cards ?? []
  return pickTopic(rows.map(r => ({
    name: r.name,
    text: cards.filter(c => c.topic && normalizeTopic(c.topic) === r.key).map(c => `${c.q} ${c.a}`).join(" ").slice(0, 4000),
    growing: r.saplings > 0,
    last: r.lastStudied,
  })), context, subject)
}

export const HighlightCard = memo(function HighlightCard({ theme, noteId, subject, signedIn, shortcut, getNote }: {
  theme: "light" | "dark"
  noteId: string | null
  subject: string
  signedIn: boolean
  shortcut: string
  getNote: (id: string) => NoteData | null  // the notebook as it is now (to fingerprint a new deck)
}) {
  const [busy, setBusy] = useState(false)
  const [made, setMade] = useState<Made | null>(null)
  // The toast on screen, readable at once (a double-click's second press comes
  // before the first toast renders).
  const shown = useRef<Made | null>(null)
  const show = useCallback((f: (m: Made | null) => Made | null) => { shown.current = f(shown.current); setMade(shown.current) }, [])
  const busyRef = useRef(false)
  // Each toast's card id right now (an edited question changes it), read by Undo
  // and later edits even before the toast re-renders.
  const idOf = useRef(new Map<number, string>())
  const live = useRef({ noteId, subject, signedIn, shortcut, getNote })
  useEffect(() => { live.current = { noteId, subject, signedIn, shortcut, getNote } }, [noteId, subject, signedIn, shortcut, getNote])

  const make = useCallback(async () => {
    if (busyRef.current) return
    const found = selectionHost()
    const { noteId, subject, signedIn, getNote } = live.current
    if (!found || !noteId) return
    const h = readHighlight(found.range, found.host)
    const text = h.selected.replace(/\s+/g, " ").trim()
    if (!text) return
    const src = `${noteId}\n${text}`
    // Again on what the toast already shows (double-click, held key): keep that toast.
    const cur = shown.current
    if (cur && cur.src === src && !cur.undone) { show(m => m && { ...m, nudge: (m.nudge ?? 0) + 1 }); return }
    const r = found.range.getBoundingClientRect()
    const place = r.top + r.height / 2 > window.innerHeight * 0.55 ? "top" : "bottom"
    const now = Date.now()
    const base = { key: now, src, place, noteId, id: "", q: "", a: "", topic: "", due: 0, dueText: "", added: false, ai: false } as const

    // A heading or lone term with nothing under it: nothing to ask, so say what would work.
    const line = lineCard(h)
    if (line === "none") {
      show(() => ({ ...base, hint: `Highlight the sentence “${text.length > 40 ? `${text.slice(0, 38)}…` : text}” is in, or write what it means on the line below.` }))
      return
    }
    busyRef.current = true
    setBusy(true)
    try {
      let card = clozeCard(h) ?? line
      let ai = false, note: string | undefined
      if (!card && signedIn && text.length >= HIGHLIGHT_MIN) {
        const res = await aiCard(h, subject)
        if (res.card) { card = res.card; ai = true }
        else if (res.limited) note = "AI cards are used up for today — made a quick one"
      }
      if (!card) card = localCard(h)
      const topic = topicFor(noteId, subject, paragraphOf(h))
      const due = firstRecallDue(now)
      const id = cardId(card.q)
      const prev = loadDeck(noteId)
      const had = prev?.cards.find(c => c.id === id)
      // A new deck is in step with the notes as they are (no "notes changed" banner at its first review).
      const fresh = getNote(noteId)
      const hash = !prev && fresh ? hashNotes(notebookReviewText(fresh)) : undefined
      const added = addTopicCards(noteId, [card], topic, now, hash, undefined, due)
      // A deck with no cards before this one isn't "carded": full review should still card the notes.
      if (!prev?.cards.length) { const d = loadDeck(noteId); if (d && !d.covered) saveDeck({ ...d, covered: [] }) }
      const stored = loadDeck(noteId)?.cards.find(c => c.id === id)
      if (added || (had && !had.topic && stored?.topic)) queued({ noteId, topic, count: added })
      idOf.current.set(now, id)
      show(() => ({
        ...base, id, ai, note, added: added > 0,
        q: stored?.q ?? card.q, a: stored?.a ?? card.a, topic: stored?.topic ?? topic,
        due: stored?.due ?? due, dueText: dueLabel(stored?.due ?? due, now),
      }))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }, [show])

  // Shortcut (Settings → Shortcuts): only while text in a text box is selected.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!matchesShortcut(e, live.current.shortcut) || !selectionHost()) return
      e.preventDefault()
      make()
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [make])

  const undo = useCallback((m: Made) => {
    if (m.undone || m.hint) return
    if (removeCard(m.noteId, idOf.current.get(m.key) ?? m.id)) queued({ noteId: m.noteId, topic: m.topic, count: 0, removed: 1 })
    show(cur => (cur && cur.key === m.key ? { ...cur, undone: true } : cur))
  }, [show])

  const commit = useCallback((m: Made, q: string, a: string) => {
    const nq = tidyField(q), na = tidyField(a)
    if (m.undone || m.hint || !nq || !na) return
    const cur = shown.current?.key === m.key ? shown.current : m
    if (nq === cur.q && na === cur.a) return
    const id = editCard(m.noteId, idOf.current.get(m.key) ?? m.id, nq, na)
    if (!id) return
    idOf.current.set(m.key, id)
    queued({ noteId: m.noteId, topic: m.topic, count: 0 })
    show(c => (c && c.key === m.key ? { ...c, id, q: nq, a: na } : c))
  }, [show])

  const close = useCallback(() => show(() => null), [show])

  return (
    <>
      <SelectionFontSize theme={theme} onMakeCard={noteId ? make : undefined} cardBusy={busy} cardShortcut={shortcut ? formatShortcut(shortcut) : undefined} />
      <AnimatePresence>
        {made && <CardToast key={made.key} made={made} theme={theme} onUndo={undo} onCommit={commit} onClose={close} />}
      </AnimatePresence>
    </>
  )
})

// Textarea that grows with its text (up to ~5 lines, then scrolls).
function AutoText({ value, onChange, onFocus, onDone, label, color, size, italic }: {
  value: string; onChange: (v: string) => void; onFocus: () => void; onDone: () => void; label: string; color: string; size: number; italic?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "0px"
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <textarea ref={ref} aria-label={label} value={value} rows={1} spellCheck={false}
      onChange={e => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onDone}
      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() } }}
      className="pulp-card-field"
      style={{ width: "100%", maxHeight: Math.round(size * 1.35 * 5 + 4), resize: "none", overflowX: "hidden", overflowY: "auto", border: "none", outline: "none", background: "transparent", padding: "2px 4px", margin: "0 -4px",
        borderRadius: 5, color, fontFamily: "Crimson Pro, serif", fontSize: size, lineHeight: 1.35, fontStyle: italic ? "italic" : "normal" }} />
  )
}

const CardToast = memo(function CardToast({ made, theme, onUndo, onCommit, onClose }: {
  made: Made; theme: "light" | "dark"
  onUndo: (m: Made) => void
  onCommit: (m: Made, q: string, a: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState(made.q)
  const [a, setA] = useState(made.a)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hovering = useRef(false)
  const editing = useRef(false)
  const latest = useRef({ made, q, a, onCommit })
  useEffect(() => { latest.current = { made, q, a, onCommit } })
  const isDark = theme === "dark"
  const fg = isDark ? "#e4e4e7" : "#27272a"
  const muted = isDark ? "#a1a1aa" : "#71717a"
  const top = made.place === "top"

  // Stays while hovered or being edited; "Card removed" and hints just go.
  const brief = !!(made.undone || made.hint)
  const arm = useCallback((ms: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => { if (made.undone || (!hovering.current && !editing.current)) onClose() }, ms)
  }, [onClose, made.undone])
  useEffect(() => { arm(made.undone ? 1600 : made.hint ? 5000 : HIDE_MS); return () => { if (hideTimer.current) clearTimeout(hideTimer.current) } }, [arm, made.undone, made.hint])
  // Pressed again: keep it up a while longer (and it flashes, below).
  useEffect(() => { if (made.nudge) arm(made.hint ? 5000 : HIDE_MS) }, [made.nudge, made.hint, arm])
  // Edits still in the fields when the toast goes (timeout, ×, a newer card) are kept.
  useEffect(() => () => { const l = latest.current; l.onCommit(l.made, l.q, l.a) }, [])

  const startEdit = () => { editing.current = true }
  // A field cleared out goes back to the card's text (a card needs both sides).
  const save = () => {
    editing.current = false
    const nq = q.trim() ? q : made.q, na = a.trim() ? a : made.a
    if (nq !== q) setQ(nq)
    if (na !== a) setA(na)
    onCommit(made, nq, na)
    arm(4000)
  }
  const fieldHover = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)"
  const title = made.hint ? "No card made" : made.undone ? "Card removed" : made.added ? "Card added" : "Already a card"

  return (
    <motion.div
      data-pulp-float
      role="status" aria-live="polite" aria-label={title}
      initial={{ opacity: 0, y: top ? -20 : 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: top ? -14 : 16, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      onMouseEnter={() => { hovering.current = true }}
      onMouseLeave={() => { hovering.current = false; arm(brief ? 1200 : 4000) }}
      style={{
        // Under the selection bubble (9990), so the next highlight's buttons stay reachable.
        position: "fixed", left: "50%", ...(top ? { top: 60 } : { bottom: 28 }), translateX: "-50%", zIndex: 9989,
        width: 400, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 88px)", overflowY: "auto", boxSizing: "border-box", padding: "11px 12px 12px 14px",
        background: isDark ? "rgba(18,18,20,0.97)" : "rgba(255,255,255,0.98)",
        border: `1px solid ${accentAlpha(0.28)}`, borderRadius: 14,
        boxShadow: isDark ? `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${accentAlpha(0.08)}` : "0 12px 40px rgba(0,0,0,0.12)",
        fontFamily: "Crimson Pro, serif", color: fg,
      }}
    >
      <style>{`.pulp-card-field:hover,.pulp-card-field:focus{background:${fieldHover}!important}.pulp-card-field:focus{box-shadow:inset 0 -1.5px 0 ${accentAlpha(0.55)}}@keyframes pulpCardFlash{from{opacity:1}to{opacity:0}}`}</style>
      {!!made.nudge && <span key={made.nudge} aria-hidden style={{ position: "absolute", inset: 0, borderRadius: 13, boxShadow: `inset 0 0 0 1.5px ${ACCENT}`, pointerEvents: "none", animation: "pulpCardFlash 0.7s ease-out forwards" }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden style={{ width: 22, height: 22, borderRadius: 6, background: accentAlpha(0.12), color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {made.undone ? <path d="M3 12h18" /> : made.hint ? <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></> : <><rect x="3" y="7" width="14" height="14" rx="2" /><path d="M7 3h12a2 2 0 0 1 2 2v12" /></>}
          </svg>
        </span>
        <div style={{ fontSize: 15.5, fontWeight: 600, minWidth: 0, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title}{!made.undone && !made.hint && <span style={{ color: muted, fontWeight: 400 }}> · {made.dueText}</span>}
        </div>
        {!made.undone && !made.hint && made.added && (
          <button onClick={() => onUndo(made)} style={{ background: "none", border: "none", cursor: "pointer", color: ACCENT, fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "2px 6px", borderRadius: 6 }}>Undo</button>
        )}
        <button onClick={onClose} aria-label="Dismiss" style={{ background: "none", border: "none", color: muted, fontSize: 18, cursor: "pointer", padding: "0 2px 0 4px", lineHeight: 1 }}>×</button>
      </div>
      {made.hint && <div style={{ marginTop: 5, paddingLeft: 30, fontSize: 14, lineHeight: 1.4, color: muted }}>{made.hint}</div>}
      {!made.undone && !made.hint && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "16px 1fr", columnGap: 8, rowGap: 3, alignItems: "baseline", marginTop: 8, paddingLeft: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.04em" }}>Q</span>
            <AutoText label="Question" value={q} onChange={setQ} onFocus={startEdit} onDone={save} color={fg} size={15} />
            <span style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: "0.04em" }}>A</span>
            <AutoText label="Answer" value={a} onChange={setA} onFocus={startEdit} onDone={save} color={fg} size={15} italic />
          </div>
          <div style={{ marginTop: 7, paddingLeft: 26, fontSize: 12.5, color: muted, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span>in <span style={{ color: ACCENT }}>{made.topic}</span></span>
            {made.ai && <span>· written by AI</span>}
            {made.note && <span>· {made.note}</span>}
            <span style={{ marginLeft: "auto", opacity: 0.8 }}>click to edit</span>
          </div>
        </>
      )}
    </motion.div>
  )
})
