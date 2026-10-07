"use client"
import { useState, useRef, useEffect, useCallback, memo } from "react"
import type { NoteData } from "@/app/types"
import { extractTextFromHTML } from "@/lib/sanitize"
import { apiFetch } from "@/lib/apiFetch"
import { supabase } from "@/lib/supabase"
import type { CapturedSelection } from "@/lib/pageContext"
import { useNarrow } from "@/app/hooks/useNarrow"
import { readableOn } from "@/lib/accent"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  query?: string
  chunkNoteIds?: string[]
  rating?: 1 | -1
  /** Selection the question was about — an <edit> answer can replace it. */
  target?: CapturedSelection
  applied?: boolean
}

interface Personality {
  id: string
  name: string
  systemPrompt: string
}

interface NotebookChatProps {
  note: NoteData
  theme: "light" | "dark"
  accent: string
  userId?: string
  onClose: () => void
  /** Text of the page the user has open. */
  getPageText?: () => string
  /** Current text selection on the page, if any. */
  captureSelection?: () => CapturedSelection | null
  /** Write text over a captured selection; false if it's no longer on the page. */
  onReplaceSelection?: (sel: CapturedSelection, text: string) => boolean
}

// Answers that edit the selection carry the new text in <edit>…</edit>.
const EDIT_RE = /<edit>([\s\S]*?)<\/edit>/i
function splitEdit(content: string): { note: string; edit: string | null } {
  const m = content.match(EDIT_RE)
  if (!m) return { note: content, edit: null }
  return { note: content.replace(EDIT_RE, "").trim(), edit: m[1].trim() }
}

const QUIZ_PROMPTS = [
  "Quiz me on this material with 5 questions",
  "Give me a practice test on key concepts",
  "Ask me fill-in-the-blank questions",
]

const PRESET_PERSONALITIES: Personality[] = [
  { id: "default", name: "Default", systemPrompt: "" },
  { id: "8th-grader", name: "8th Grader", systemPrompt: "Write like an 8th grader. Use simple vocabulary and short sentences. Make complex ideas sound approachable. Never use dashes or semicolons." },
  { id: "professor", name: "Professor", systemPrompt: "Write like an academic professor. Be thorough, precise, and use proper terminology. Cite reasoning and provide depth." },
  { id: "concise", name: "Concise", systemPrompt: "Be extremely concise. Bullet points over paragraphs. No filler words. Get to the point immediately." },
]

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

export const NotebookChat = memo(function NotebookChat({ note, theme, accent, userId, onClose, getPageText, captureSelection, onReplaceSelection }: NotebookChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [indexing, setIndexing] = useState(true)
  const [indexProgress, setIndexProgress] = useState(0)
  const notebookTextRef = useRef("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isDark = theme === "dark"
  const isNarrow = useNarrow()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // Track the page selection (it survives focus moving into this panel).
  const [selection, setSelection] = useState<CapturedSelection | null>(null)
  useEffect(() => {
    if (!captureSelection) return
    const update = () => setSelection(captureSelection())
    update()
    document.addEventListener("selectionchange", update)
    return () => document.removeEventListener("selectionchange", update)
  }, [captureSelection])

  const [personalities, setPersonalities] = useState<Personality[]>(PRESET_PERSONALITIES)
  const [activePersonality, setActivePersonality] = useState<Personality>(PRESET_PERSONALITIES[0])
  const [showPersonalityPanel, setShowPersonalityPanel] = useState(false)
  const [editingPersonality, setEditingPersonality] = useState<Personality | null>(null)
  const [editName, setEditName] = useState("")
  const [editPrompt, setEditPrompt] = useState("")

  useEffect(() => {
    if (!userId) return
    supabase.from("player_profiles").select("chat_personalities").eq("user_id", userId).single().then(({ data }) => {
      if (data?.chat_personalities?.length) {
        setPersonalities([...PRESET_PERSONALITIES, ...data.chat_personalities])
      }
    })
  }, [userId])

  const savePersonalities = useCallback(async (custom: Personality[]) => {
    if (!userId) return
    await supabase.from("player_profiles").upsert({ user_id: userId, chat_personalities: custom })
  }, [userId])

  const handleSavePersonality = useCallback(() => {
    if (!editName.trim() || !editPrompt.trim()) return
    const isEdit = editingPersonality && !PRESET_PERSONALITIES.some(p => p.id === editingPersonality.id)
    let custom: Personality[]
    if (isEdit && editingPersonality) {
      custom = personalities.filter(p => !PRESET_PERSONALITIES.some(pp => pp.id === p.id)).map(p =>
        p.id === editingPersonality.id ? { ...p, name: editName.trim(), systemPrompt: editPrompt.trim() } : p
      )
    } else {
      const newP: Personality = { id: crypto.randomUUID(), name: editName.trim(), systemPrompt: editPrompt.trim() }
      custom = [...personalities.filter(p => !PRESET_PERSONALITIES.some(pp => pp.id === p.id)), newP]
    }
    setPersonalities([...PRESET_PERSONALITIES, ...custom])
    savePersonalities(custom)
    setEditingPersonality(null)
    setEditName("")
    setEditPrompt("")
  }, [editName, editPrompt, editingPersonality, personalities, savePersonalities])

  const handleDeletePersonality = useCallback((id: string) => {
    if (PRESET_PERSONALITIES.some(p => p.id === id)) return
    const custom = personalities.filter(p => !PRESET_PERSONALITIES.some(pp => pp.id === p.id) && p.id !== id)
    setPersonalities([...PRESET_PERSONALITIES, ...custom])
    savePersonalities(custom)
    if (activePersonality.id === id) setActivePersonality(PRESET_PERSONALITIES[0])
  }, [personalities, activePersonality, savePersonalities])

  useEffect(() => {
    let cancelled = false
    const totalPages = note.pages.length
    const boxPages = Object.keys(note.boxes).length
    const totalSteps = totalPages + boxPages + 1
    let step = 0

    const advance = () => {
      step++
      if (!cancelled) setIndexProgress(Math.min(step / totalSteps, 0.95))
    }

    const run = async () => {
      const parts: string[] = []

      for (let i = 0; i < note.pages.length; i++) {
        const text = extractTextFromHTML(note.pages[i])
        if (text) parts.push(`[Page ${i + 1}]\n${text}`)
        advance()
        await new Promise(r => setTimeout(r, 60))
      }

      for (const [pageIdx, boxes] of Object.entries(note.boxes)) {
        for (const box of boxes) {
          if (!box.content.trim()) continue
          const text = extractTextFromHTML(box.content)
          if (text) parts.push(`[Page ${Number(pageIdx) + 1} - Text Box]\n${text}`)
        }
        advance()
        await new Promise(r => setTimeout(r, 40))
      }

      notebookTextRef.current = parts.join("\n\n")
      if (!cancelled) {
        setIndexProgress(1)
        await new Promise(r => setTimeout(r, 300))
        setIndexing(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [note])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  useEffect(() => { if (!indexing) inputRef.current?.focus() }, [indexing])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading || indexing) return
    const target = selection ?? undefined
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      let ragContext = ""
      let chunkNoteIds: string[] = []
      try {
        const ragRes = await apiFetch("/api/semantic-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: text.trim() }) })
        if (ragRes.ok) {
          const ragData = await ragRes.json()
          const results = (ragData.results || []).slice(0, 6)
          const chunks = results.map((r: { chunk_text: string }) => r.chunk_text)
          chunkNoteIds = [...new Set(results.map((r: { note_id: string }) => r.note_id))] as string[]
          if (chunks.length) ragContext = `\n\n[RELATED KNOWLEDGE FROM ALL NOTEBOOKS]:\n${chunks.join("\n---\n")}`
        }
      } catch { /* RAG optional */ }

      const notebookContent = notebookTextRef.current || gatherNotebookText(note)
      const history = [...messages, userMsg].slice(-10).map(m => `${m.role}: ${m.content}`).join("\n")

      const pageText = getPageText?.() || ""
      const pageBlock = pageText ? `[CURRENT PAGE — what the student has open right now]:\n${pageText}\n\n` : ""
      const contextPayload = `[NOTEBOOK TITLE: ${note.subject}]\n\n${pageBlock}[NOTEBOOK CONTENT]:\n${notebookContent}${ragContext}\n\n[CONVERSATION HISTORY]:\n${history}`

      const response = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text.trim(),
          text: contextPayload.length > 12000 ? contextPayload.slice(0, contextPayload.lastIndexOf("\n", 12000) || 12000) + "\n[...truncated]" : contextPayload,
          personality: activePersonality.systemPrompt || undefined,
          selection: target?.text,
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Request failed")
      const result = data.result || "I couldn't generate a response."
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: result, query: text.trim(), chunkNoteIds, target }])
    } catch (err) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}` }])
    }
    setLoading(false)
  }, [loading, messages, note, activePersonality, indexing, selection, getPageText])

  const applyEdit = useCallback((msg: Message, edit: string) => {
    if (!msg.target || !onReplaceSelection) return
    if (onReplaceSelection(msg.target, edit)) setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, applied: true } : m))
  }, [onReplaceSelection])

  const rateMessage = useCallback((msgId: string, rating: 1 | -1) => {
    setMessages(prev => {
      const msg = prev.find(m => m.id === msgId)
      if (msg) {
        apiFetch("/api/chat-feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: msg.query || "", response: msg.content, chunkNoteIds: msg.chunkNoteIds || [], rating }) }).catch(() => {})
      }
      return prev.map(m => m.id === msgId ? { ...m, rating } : m)
    })
  }, [])

  const bg = isDark ? "#09090b" : "#ffffff"
  const onAccent = readableOn(accent) // text on accent-filled buttons/bubbles
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
  const mutedText = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"
  const subtleText = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)"

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: isNarrow ? "100%" : 380, zIndex: 9998,
      background: bg, borderLeft: `1px solid ${borderColor}`,
      display: "flex", flexDirection: "column",
      fontFamily: 'Crimson Pro, serif',
      boxShadow: isDark ? "-8px 0 32px rgba(0,0,0,0.4)" : "-4px 0 24px rgba(0,0,0,0.06)",
    }}>

      {/* Header */}
      <div style={{
        padding: "14px 16px", borderBottom: `1px solid ${borderColor}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 400, color: isDark ? "#e4e4e7" : "#18181b", letterSpacing: "0.01em" }}>
            Notebook Chat
          </div>
          <div style={{ fontSize: 11, color: mutedText, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{note.subject}"</span>
            <button
              onClick={() => setShowPersonalityPanel(v => !v)}
              style={{
                background: activePersonality.id !== "default" ? `${accent}20` : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                border: activePersonality.id !== "default" ? `1px solid ${accent}40` : `1px solid ${borderColor}`,
                borderRadius: 4, padding: "1px 6px", fontSize: 9, fontWeight: 400,
                color: activePersonality.id !== "default" ? accent : mutedText,
                cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em",
                fontFamily: 'Crimson Pro, serif', whiteSpace: "nowrap",
              }}
            >
              {activePersonality.name}
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: mutedText, borderRadius: 4, flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
          onMouseLeave={e => { e.currentTarget.style.background = "none" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Personality panel */}
      {showPersonalityPanel && (
        <div style={{ borderBottom: `1px solid ${borderColor}`, padding: "10px 16px", maxHeight: 320, overflowY: "auto" }}>
          <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase", color: mutedText, marginBottom: 8 }}>
            AI Personality
          </div>

          {editingPersonality !== null ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Personality name..."
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${borderColor}`, borderRadius: 6, padding: "6px 10px",
                  fontSize: 12, color: isDark ? "#e4e4e7" : "#18181b", outline: "none",
                  fontFamily: 'Crimson Pro, serif',
                }}
              />
              <textarea
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                placeholder="Instructions for the AI... e.g. 'Write like an 8th grader. No dashes. Simple words.'"
                rows={3}
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${borderColor}`, borderRadius: 6, padding: "6px 10px",
                  fontSize: 12, color: isDark ? "#e4e4e7" : "#18181b", outline: "none", resize: "none",
                  fontFamily: 'Crimson Pro, serif', lineHeight: 1.5,
                }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={handleSavePersonality}
                  disabled={!editName.trim() || !editPrompt.trim()}
                  style={{
                    flex: 1, padding: "5px 0", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 400,
                    background: editName.trim() && editPrompt.trim() ? accent : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                    color: editName.trim() && editPrompt.trim() ? onAccent : mutedText, cursor: "pointer",
                    fontFamily: 'Crimson Pro, serif',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingPersonality(null); setEditName(""); setEditPrompt("") }}
                  style={{
                    padding: "5px 12px", borderRadius: 6, border: `1px solid ${borderColor}`, fontSize: 11,
                    background: "transparent", color: subtleText, cursor: "pointer",
                    fontFamily: 'Crimson Pro, serif',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {personalities.map(p => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6,
                      background: activePersonality.id === p.id ? `${accent}15` : "transparent",
                      border: activePersonality.id === p.id ? `1px solid ${accent}30` : "1px solid transparent",
                      cursor: "pointer", transition: "all 0.1s",
                    }}
                    onClick={() => { setActivePersonality(p); setShowPersonalityPanel(false) }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 400, color: activePersonality.id === p.id ? accent : (isDark ? "#d4d4d8" : "#3f3f46") }}>{p.name}</div>
                      {p.systemPrompt && (
                        <div style={{ fontSize: 10, color: mutedText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.systemPrompt}</div>
                      )}
                    </div>
                    {!PRESET_PERSONALITIES.some(pp => pp.id === p.id) && (
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        <button
                          onClick={e => { e.stopPropagation(); setEditingPersonality(p); setEditName(p.name); setEditPrompt(p.systemPrompt) }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: mutedText, fontSize: 10 }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeletePersonality(p.id) }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: mutedText, fontSize: 10 }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setEditingPersonality({ id: "", name: "", systemPrompt: "" }); setEditName(""); setEditPrompt("") }}
                style={{
                  width: "100%", marginTop: 8, padding: "6px 0", borderRadius: 6,
                  border: `1px dashed ${borderColor}`, background: "transparent",
                  fontSize: 11, fontWeight: 400, color: subtleText, cursor: "pointer",
                  fontFamily: 'Crimson Pro, serif', display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Personality
              </button>
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {indexing ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "40px 20px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 400, color: isDark ? "#d4d4d8" : "#3f3f46", marginBottom: 4 }}>Reading your notebook...</div>
              <div style={{ fontSize: 11, color: mutedText, maxWidth: 220, lineHeight: 1.5 }}>Indexing {note.pages.length} page{note.pages.length !== 1 ? "s" : ""} for context</div>
            </div>
            <div style={{ width: "100%", maxWidth: 200, height: 4, borderRadius: 2, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, background: accent,
                width: `${indexProgress * 100}%`,
                transition: "width 0.15s ease-out",
              }} />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "40px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 400, color: isDark ? "#d4d4d8" : "#3f3f46", marginBottom: 4 }}>Chat with your notebook</div>
              <div style={{ fontSize: 11, color: mutedText, maxWidth: 220, lineHeight: 1.5 }}>Ask questions, get summaries, or quiz yourself on your notes.</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase", color: mutedText, paddingLeft: 2 }}>Quick Actions</div>
              {QUIZ_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  style={{
                    textAlign: "left", fontSize: 12, fontWeight: 400, padding: "8px 12px", borderRadius: 8,
                    border: `1px solid ${borderColor}`, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    color: subtleText, cursor: "pointer", transition: "all 0.1s",
                    fontFamily: 'Crimson Pro, serif',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.color = subtleText }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map(msg => (
          <div key={msg.id} className="group/msg" style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%", position: "relative",
          }}>
            <div style={{
              padding: "8px 12px",
              borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: msg.role === "user"
                ? accent
                : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
              color: msg.role === "user" ? onAccent : (isDark ? "#d4d4d8" : "#27272a"),
              fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {(() => {
                const { note: said, edit } = msg.role === "assistant" ? splitEdit(msg.content) : { note: msg.content, edit: null }
                if (edit === null) return msg.content
                return (<>
                  {said && <div style={{ marginBottom: 6 }}>{said}</div>}
                  <div style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 8, color: isDark ? "#fafafa" : "#18181b" }}>{edit}</div>
                  {msg.target && onReplaceSelection && (
                    <button
                      onClick={() => applyEdit(msg, edit)}
                      disabled={msg.applied}
                      style={{
                        marginTop: 8, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontFamily: 'Crimson Pro, serif',
                        border: `1px solid ${accent}`, background: msg.applied ? "transparent" : accent,
                        color: msg.applied ? accent : onAccent, cursor: msg.applied ? "default" : "pointer",
                      }}
                    >{msg.applied ? "Replaced ✓" : "Replace selection"}</button>
                  )}
                </>)
              })()}
            </div>
            {msg.role === "assistant" && !msg.content.startsWith("Error:") && (
              <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity" style={{ display: "flex", gap: 2, marginTop: 3 }}>
                <button
                  onClick={() => rateMessage(msg.id, 1)}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 4,
                    color: msg.rating === 1 ? accent : mutedText, opacity: msg.rating === 1 ? 1 : 0.6,
                    transition: "all 0.15s",
                  }}
                  title="Helpful"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={msg.rating === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                </button>
                <button
                  onClick={() => rateMessage(msg.id, -1)}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 4,
                    color: msg.rating === -1 ? "#ef4444" : mutedText, opacity: msg.rating === -1 ? 1 : 0.6,
                    transition: "all 0.15s",
                  }}
                  title="Not helpful"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={msg.rating === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: "flex-start", padding: "8px 14px", borderRadius: "12px 12px 12px 2px",
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            display: "flex", gap: 4, alignItems: "center",
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%", background: accent,
                animation: `chat-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
            <style>{`@keyframes chat-dot { 0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); } 30% { opacity: 1; transform: scale(1); } }`}</style>
          </div>
        )}
      </div>

      {/* Selection the next question is about */}
      {selection && (
        <div style={{ margin: "0 16px", padding: "6px 10px", borderTop: `1px solid ${borderColor}`, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: mutedText }}>
          <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 9, color: accent, flexShrink: 0 }}>Selected</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: `2px solid ${accent}`, paddingLeft: 6 }}>{selection.text}</span>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${borderColor}`, display: "flex", gap: 8, alignItems: "flex-end" }}>
        {messages.filter(m => m.role === "assistant").length > 0 && (
          <button
            onClick={() => {
              const aiMsgs = messages.filter(m => m.role === "assistant").slice(-3).map(m => m.content).join("\n")
              const desc = aiMsgs.length > 200 ? aiMsgs.slice(0, 200) : aiMsgs
              setEditingPersonality({ id: "", name: "", systemPrompt: "" })
              setEditName("")
              setEditPrompt(`Write in this style: ${desc}`)
              setShowPersonalityPanel(true)
            }}
            title="Save current AI style as personality"
            style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${borderColor}`, flexShrink: 0,
              background: "transparent", color: mutedText, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
          </button>
        )}
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
          placeholder={selection ? "Ask about or change the selection..." : activePersonality.id !== "default" ? `Ask (${activePersonality.name})...` : "Ask about your notes..."}
          disabled={loading}
          rows={1}
          style={{
            flex: 1, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${borderColor}`, borderRadius: 10, padding: "8px 12px",
            fontSize: 13, color: isDark ? "#e4e4e7" : "#18181b", outline: "none", resize: "none",
            fontFamily: 'Crimson Pro, serif', lineHeight: 1.5,
            maxHeight: 100, overflowY: "auto",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{
            width: 32, height: 32, borderRadius: 8, border: "none", flexShrink: 0,
            background: input.trim() && !loading ? accent : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
            color: input.trim() && !loading ? onAccent : mutedText,
            cursor: input.trim() && !loading ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
})
