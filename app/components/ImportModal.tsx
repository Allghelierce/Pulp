"use client"
import { useState, useEffect, useRef, useCallback, memo } from "react"
import { markCovered, htmlLines } from "@/lib/fullReview"
import { motion } from "framer-motion"
import { parseImportFile, parsePastedText, parsePastedHtml, ACCEPTED_IMPORT_TYPES, type ImportDoc, sectionToHtml } from "@/lib/importNotes"
import { apiFetch } from "@/lib/apiFetch"
import { addTopicCards } from "@/lib/recallSchedule"
import { playSound } from "@/lib/sound"
import type { Card } from "@/lib/recallPrompt"
import { ACCENT, ACCENT_CONTRAST, accentAlpha } from "@/lib/accent"

// Import notes (Docs/Word/Notion/Obsidian) -> a notebook, then AI recall cards
// for the first few sections. Notes are always saved first; carding is capped
// server-side (/api/import) and per-import here.

const font = 'Crimson Pro, serif'
export const MAX_SECTIONS_PER_IMPORT = 8

type Allowance = { remaining: number | null; limit: number; pro: boolean }
type RowStatus = "pending" | "running" | "ok" | "nocards" | "limit" | "upgrade" | "error"
interface Row { status: RowStatus; topic?: string; count?: number; msg?: string }

export const ImportModal = memo(function ImportModal({ theme, signedIn, onClose, onCreateNotebook, onStartRecall }: {
  theme: "light" | "dark"; signedIn: boolean; onClose: () => void
  onCreateNotebook: (doc: ImportDoc) => string
  onStartRecall: (noteId: string) => void
}) {
  const dark = theme === "dark"
  const c = {
    bg: dark ? '#09090b' : '#faf8f4',
    border: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: dark ? '#e4e0d8' : '#1c1917',
    muted: dark ? '#8a8680' : '#78716c',
    faint: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    field: dark ? 'rgba(0,0,0,0.3)' : '#fff',
    fieldBorder: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
  }

  const [mode, setMode] = useState<"upload" | "paste">("upload")
  const [phase, setPhase] = useState<"pick" | "preview" | "running" | "done">("pick")
  const [doc, setDoc] = useState<ImportDoc | null>(null)
  const [title, setTitle] = useState("")
  const [pasteText, setPasteText] = useState("")
  // The clipboard's rich version (Docs/Word/Notion keep headings, lists, bold, links there).
  // Used only while the box still holds exactly what was pasted.
  const [pasteRich, setPasteRich] = useState<{ html: string; value: string } | null>(null)
  const [pasteTitle, setPasteTitle] = useState("")
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [allowance, setAllowance] = useState<Allowance | null>(null)
  const [allowanceErr, setAllowanceErr] = useState<string | null>(null)
  const [allowanceChecked, setAllowanceChecked] = useState(false) // signed-out check finished without an allowance
  const [rows, setRows] = useState<Row[]>([])
  const [noteId, setNoteId] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const stopRef = useRef(false) // closed mid-import: finish the in-flight section, start no more
  const aliveRef = useRef(true)
  const startedRef = useRef(false)

  // Closing mid-import never aborts the in-flight request: the server already
  // spent that section's credit, so we let it land and still save its cards
  // (addTopicCards is localStorage — no component needed). We only stop
  // starting new sections.
  useEffect(() => {
    aliveRef.current = true
    stopRef.current = false
    return () => { aliveRef.current = false; stopRef.current = true }
  }, [])

  const close = useCallback(() => { stopRef.current = true; onClose() }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close() } }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [close])

  // Allowance. Signed-out users still ask once: a 401 just means "sign in for
  // cards", while a 200 (e.g. a dev DEV_SKIP_AUTH server) means the server will
  // card for this session, so we trust it over the client's auth state.
  useEffect(() => {
    let cancelled = false
    apiFetch("/api/import").then(async r => {
      const j = await r.json().catch(() => ({}))
      if (cancelled) return
      if (r.ok) setAllowance({ remaining: j.remaining ?? null, limit: j.limit ?? 0, pro: !!j.pro })
      else if (signedIn) setAllowanceErr(r.status === 503 ? "Recall cards for imports aren't available right now." : (j.error || "Couldn't check your import allowance."))
      else setAllowanceChecked(true)
    }).catch(() => { if (!cancelled) { if (signedIn) setAllowanceErr("Couldn't check your import allowance."); else setAllowanceChecked(true) } })
    return () => { cancelled = true }
  }, [signedIn])

  const accept = (d: ImportDoc) => {
    if (!d.sections.length) { setError("Nothing to import — that file looks empty."); return }
    setDoc(d); setTitle(d.title); setError(null); setPhase("preview")
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setParsing(true); setError(null)
    try { accept(await parseImportFile(file)) }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't read that file.") }
    finally { if (aliveRef.current) setParsing(false) }
  }

  const handlePaste = () => {
    if (!pasteText.trim()) { setError("Paste some notes first."); return }
    const title = pasteTitle.trim() || undefined
    try { accept(pasteRich && pasteRich.value === pasteText ? parsePastedHtml(pasteRich.html, pasteText, title) : parsePastedText(pasteText, title)) }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't read that text.") }
  }

  const n = doc?.sections.length ?? 0
  const canCard = signedIn || !!allowance // server said yes even if the client has no session
  const allowanceReady = !!allowance || !!allowanceErr || (!signedIn && allowanceChecked)
  const k = !canCard || allowanceErr || !allowance ? 0 : Math.min(n, MAX_SECTIONS_PER_IMPORT, allowance.remaining ?? Infinity)

  const runImport = async () => {
    if (!doc || startedRef.current) return
    startedRef.current = true // one import per open — no double-click duplicates
    const finalDoc: ImportDoc = { ...doc, title: title.trim() || doc.title }
    // Notes first — they're never lost, whatever happens to the AI part.
    const id = onCreateNotebook(finalDoc)
    setNoteId(id)
    // Sections past K: say why they got no cards.
    const skipped: Row = !canCard ? { status: "nocards", msg: "sign in for cards" }
      : allowanceErr ? { status: "nocards", msg: "cards unavailable" }
      : allowance && allowance.remaining !== null && k >= allowance.remaining ? { status: "upgrade" }
      : { status: "limit" }
    setRows(finalDoc.sections.map((_, i) => (i < k ? { status: "pending" } : skipped)))
    if (k === 0) { setPhase("done"); return }
    setPhase("running")

    const topics: string[] = []
    let total = 0
    const set = (i: number, row: Row) => { if (aliveRef.current) setRows(rs => rs.map((r, j) => j === i ? row : r)) }
    const setRest = (from: number, row: Row) => { if (aliveRef.current) setRows(rs => rs.map((r, j) => j >= from && j < k ? row : r)) }

    for (let i = 0; i < k; i++) {
      if (stopRef.current) return
      const s = finalDoc.sections[i]
      set(i, { status: "running" })
      try {
        const r = await apiFetch("/api/import", {
          method: "POST",
          body: JSON.stringify({ text: s.text, title: finalDoc.title, heading: s.heading, topics }),
        })
        const j = await r.json().catch(() => ({}))
        if (r.ok) {
          const topic: string = typeof j.topic === "string" ? j.topic : ""
          const cards: Card[] = Array.isArray(j.cards) ? j.cards : []
          if ((typeof j.remaining === "number" || j.remaining === null) && aliveRef.current) setAllowance(a => a ? { ...a, remaining: j.remaining } : a)
          if (!topic || !cards.length) { set(i, { status: "nocards" }); continue }
          const now = Date.now()
          const added = addTopicCards(id, cards, topic, now, undefined, undefined, now) // due now — studyable immediately
          markCovered(id, htmlLines(sectionToHtml(s))) // full review won't re-card this page
          if (!topics.includes(topic)) topics.push(topic)
          total += added
          set(i, added ? { status: "ok", topic, count: added } : { status: "nocards" })
          if (added) { try { window.dispatchEvent(new CustomEvent("pulp-cards-queued", { detail: { noteId: id, topic, count: added } })) } catch { } }
        } else if (r.status === 402) {
          if (aliveRef.current) setAllowance(a => a ? { ...a, remaining: 0 } : a)
          setRest(i, { status: "upgrade" }); break
        } else if (r.status === 503) {
          setRest(i, { status: "nocards", msg: "cards unavailable" }); break
        } else if (r.status === 429) {
          // Rate limit / daily AI cap — the rest would fail too.
          setRest(i, { status: "error", msg: "saved — AI limit hit, try later" }); break
        } else if (r.status === 400) {
          set(i, { status: "nocards", msg: "too short for cards" })
        } else {
          set(i, { status: "error", msg: j.error ? `saved — ${j.error}` : "saved — cards failed" })
        }
      } catch {
        set(i, { status: "error", msg: "saved — network error" })
      }
    }
    if (!aliveRef.current || stopRef.current) return
    if (total > 0) playSound("correct")
    setPhase("done")
  }

  const cardsTotal = rows.reduce((s, r) => s + (r.status === "ok" ? r.count ?? 0 : 0), 0)
  const topicsTotal = new Set(rows.filter(r => r.status === "ok").map(r => r.topic)).size

  const btn = (primary: boolean, disabled = false): React.CSSProperties => ({
    flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontFamily: font,
    color: primary ? ACCENT_CONTRAST : c.muted, background: primary ? ACCENT : c.faint,
    border: primary ? 'none' : `1px solid ${c.border}`, cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  })
  const field: React.CSSProperties = {
    fontFamily: font, fontSize: 14, width: '100%', padding: '8px 10px', borderRadius: 8,
    border: `1px solid ${c.fieldBorder}`, background: c.field, color: c.text, outline: 'none',
  }

  const allowanceLine = () => {
    if (!signedIn && allowanceChecked) return "Your notes import fine — sign in to get recall cards from them."
    if (allowanceErr) return `${allowanceErr} Your notes still import.`
    if (!allowance) return "Checking your import allowance…"
    if (k === 0) return allowance.remaining === 0 ? "You've used your free imports — notes still import. Upgrade to Pro for recall cards." : "No sections to card."
    const left = allowance.remaining === null ? "" : ` (${allowance.remaining} free import${allowance.remaining === 1 ? "" : "s"} left)`
    return `Recall cards for the first ${k} section${k === 1 ? "" : "s"}${left}`
  }

  const rowText = (r: Row): string => {
    switch (r.status) {
      case "pending": return "waiting…"
      case "running": return "making cards…"
      case "ok": return `✓ ${r.topic} · ${r.count} card${r.count === 1 ? "" : "s"}`
      case "nocards": return r.msg ? `saved — no cards (${r.msg})` : "saved — no cards"
      case "limit": return "saved — no cards (limit)"
      case "upgrade": return "saved — upgrade for cards"
      case "error": return r.msg ?? "saved — cards failed"
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" style={{ padding: 12 }}>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
        onClick={phase === "running" ? undefined : close}
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.12 }}
        role="dialog" aria-modal="true" aria-label="Import notes"
        className="relative overflow-hidden flex flex-col"
        style={{
          width: 'calc(100vw - 24px)', maxWidth: 520, maxHeight: 'calc(100vh - 24px)', borderRadius: 12,
          background: c.bg, border: `1px solid ${c.border}`, boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6)',
          fontFamily: font, color: c.text,
        }}
      >
        <div className="flex items-center justify-between" style={{ padding: '18px 20px 0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Import notes</h2>
          <button onClick={close} aria-label="Close" style={{ background: 'none', border: 'none', color: c.muted, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '14px 20px 20px', overflowY: 'auto' }}>
          {phase === "pick" && (
            <>
              <div className="flex gap-1" style={{ padding: 3, borderRadius: 8, background: c.faint, border: `1px solid ${c.border}`, marginBottom: 14 }}>
                {(["upload", "paste"] as const).map(m => (
                  <button key={m} onClick={() => { setMode(m); setError(null) }}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 13, fontFamily: font, cursor: 'pointer', border: 'none',
                      background: mode === m ? (dark ? 'rgba(255,255,255,0.08)' : '#fff') : 'transparent',
                      color: mode === m ? c.text : c.muted,
                      boxShadow: mode === m && !dark ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    }}>
                    {m === "upload" ? "Upload" : "Paste"}
                  </button>
                ))}
              </div>

              {mode === "upload" ? (
                <>
                  <div
                    role="button" tabIndex={0}
                    onClick={() => !parsing && fileRef.current?.click()}
                    onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && !parsing) { e.preventDefault(); fileRef.current?.click() } }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); if (!parsing) handleFile(e.dataTransfer.files?.[0]) }}
                    style={{
                      border: `1.5px dashed ${dragOver ? ACCENT : c.fieldBorder}`, borderRadius: 10, padding: '30px 16px',
                      textAlign: 'center', cursor: parsing ? 'default' : 'pointer',
                      background: dragOver ? accentAlpha(0.06) : c.faint, transition: 'all 0.12s',
                    }}
                  >
                    <div style={{ fontSize: 15 }}>{parsing ? "Reading…" : "Drop a file here, or click to choose"}</div>
                    <div style={{ fontSize: 12, color: c.muted, marginTop: 6 }}>.docx · .md · .txt · .html</div>
                  </div>
                  <input ref={fileRef} type="file" accept={ACCEPTED_IMPORT_TYPES} hidden
                    onChange={e => { handleFile(e.target.files?.[0]); e.target.value = "" }} />
                  <p style={{ fontSize: 12, color: c.muted, margin: '10px 0 0', lineHeight: 1.5 }}>
                    Or copy everything from Google Docs, Word, Notion, Apple Notes or OneNote (⌘A, ⌘C) and use Paste — headings become pages, formatting is kept.
                  </p>
                </>
              ) : (
                <>
                  <input value={pasteTitle} onChange={e => setPasteTitle(e.target.value)} placeholder="Title (optional)" style={{ ...field, marginBottom: 8 }} />
                  <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste your notes…"
                    onPaste={e => {
                      const html = e.clipboardData.getData("text/html")
                      const ta = e.currentTarget
                      const replacesAll = !ta.value.trim() || (ta.selectionStart === 0 && ta.selectionEnd === ta.value.length)
                      if (!html || !replacesAll) { setPasteRich(null); return }
                      // Let the plain text land in the box, then remember the rich version for it.
                      setTimeout(() => setPasteRich({ html, value: ta.value }), 0)
                    }}
                    style={{ ...field, minHeight: 180, resize: 'vertical', lineHeight: 1.5 }} />
                  {pasteRich && pasteRich.value === pasteText && (
                    <p style={{ fontSize: 12, color: c.muted, margin: '6px 0 0' }}>✓ Formatting kept — headings, lists, bold and links come through.</p>
                  )}
                  <div className="flex gap-2" style={{ marginTop: 12 }}>
                    <button onClick={handlePaste} disabled={!pasteText.trim()} style={btn(true, !pasteText.trim())}>Continue</button>
                  </div>
                </>
              )}
              {error && <p style={{ fontSize: 13, color: '#ef4444', margin: '10px 0 0' }}>{error}</p>}
            </>
          )}

          {phase === "preview" && doc && (
            <>
              <label style={{ fontSize: 12, color: c.muted }}>Notebook title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={{ ...field, marginTop: 4, fontSize: 15 }} />
              <div style={{ fontSize: 13, color: c.muted, marginTop: 10 }}>
                {n} section{n === 1 ? "" : "s"} · {doc.words.toLocaleString()} words{doc.truncated ? " · trimmed to fit" : ""}
              </div>
              <div style={{ fontSize: 14, marginTop: 10, padding: '10px 12px', borderRadius: 8, background: accentAlpha(0.07), border: `1px solid ${accentAlpha(0.19)}`, lineHeight: 1.5 }}>
                {allowanceLine()}
              </div>
              <div className="flex gap-2" style={{ marginTop: 16 }}>
                <button onClick={() => { setPhase("pick"); setDoc(null) }} style={btn(false)}>Back</button>
                <button onClick={runImport} disabled={!allowanceReady} style={btn(true, !allowanceReady)}>Import</button>
              </div>
            </>
          )}

          {(phase === "running" || phase === "done") && doc && (
            <>
              {phase === "done" && (
                <div style={{ fontSize: 16, marginBottom: 12 }}>
                  {cardsTotal > 0
                    ? `${cardsTotal} card${cardsTotal === 1 ? "" : "s"} ready across ${topicsTotal} topic${topicsTotal === 1 ? "" : "s"}`
                    : "Notes imported."}
                </div>
              )}
              <div className="flex flex-col gap-1" style={{ maxHeight: 280, overflowY: 'auto' }}>
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-2" style={{ fontSize: 13, padding: '6px 8px', borderRadius: 6, background: c.faint, minWidth: 0 }}>
                    <span style={{ flex: '0 1 45%', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: c.text }}>
                      {doc.sections[i]?.heading || `Section ${i + 1}`}
                    </span>
                    <span className="flex items-center gap-1.5" style={{ flex: 1, minWidth: 0, justifyContent: 'flex-end', textAlign: 'right',
                      color: r.status === "ok" ? ACCENT : r.status === "error" ? '#ef4444' : c.muted,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.status === "running" && (
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                          style={{ display: 'inline-block', width: 11, height: 11, borderRadius: '50%', border: `1.5px solid ${ACCENT}`, borderTopColor: 'transparent', flexShrink: 0 }} />
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{rowText(r)}</span>
                    </span>
                  </div>
                ))}
              </div>
              {phase === "done" && (
                <div className="flex gap-2" style={{ marginTop: 16 }}>
                  <button onClick={close} style={btn(false)}>Done</button>
                  {cardsTotal > 0 && noteId && (
                    <button onClick={() => onStartRecall(noteId)} style={btn(true)}>Start recalling</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
})
