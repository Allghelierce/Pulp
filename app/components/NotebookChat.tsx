"use client"
import { useState, useRef, useEffect, useCallback, memo } from "react"
import type { NoteData } from "@/app/types"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface NotebookChatProps {
  note: NoteData
  theme: "light" | "dark"
  accent: string
  onClose: () => void
}

const QUIZ_PROMPTS = [
  "Quiz me on this material with 5 questions",
  "Give me a practice test on key concepts",
  "Ask me fill-in-the-blank questions",
  "Create true/false questions from this content",
  "Quiz me with increasing difficulty",
]

function gatherNotebookText(note: NoteData): string {
  const pageTexts = note.pages.map((html, i) => {
    const div = document.createElement("div")
    div.innerHTML = html
    const text = div.textContent?.trim() || ""
    return text ? `[Page ${i + 1}]\n${text}` : ""
  }).filter(Boolean)

  const boxTexts: string[] = []
  for (const [pageIdx, boxes] of Object.entries(note.boxes)) {
    for (const box of boxes) {
      if (!box.content.trim()) continue
      const div = document.createElement("div")
      div.innerHTML = box.content
      const text = div.textContent?.trim()
      if (text) boxTexts.push(`[Page ${Number(pageIdx) + 1} - Text Box]\n${text}`)
    }
  }

  return [...pageTexts, ...boxTexts].join("\n\n")
}

export const NotebookChat = memo(function NotebookChat({ note, theme, accent, onClose }: NotebookChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isDark = theme === "dark"

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  useEffect(() => { inputRef.current?.focus() }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const notebookContent = gatherNotebookText(note)
      const history = [...messages, userMsg].slice(-10).map(m => `${m.role}: ${m.content}`).join("\n")
      const contextPayload = `[NOTEBOOK TITLE: ${note.subject}]\n\n[NOTEBOOK CONTENT]:\n${notebookContent}\n\n[CONVERSATION HISTORY]:\n${history}`

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text.trim(), text: contextPayload.length > 9500 ? contextPayload.slice(0, contextPayload.lastIndexOf("\n", 9500) || 9500) + "\n[...truncated]" : contextPayload })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Request failed")
      const result = data.result || "I couldn't generate a response."
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: result }])
    } catch (err) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}` }])
    }
    setLoading(false)
  }, [loading, messages, note])

  const bg = isDark ? "#0f0f12" : "#ffffff"
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
  const mutedText = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"
  const subtleText = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)"

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 380, zIndex: 9998,
      background: bg, borderLeft: `1px solid ${borderColor}`,
      display: "flex", flexDirection: "column",
      fontFamily: '"EB Garamond", Georgia, serif',
      boxShadow: isDark ? "-8px 0 32px rgba(0,0,0,0.4)" : "-4px 0 24px rgba(0,0,0,0.06)",
      animation: "chat-slide-in 0.2s ease-out",
    }}>
      <style>{`
        @keyframes chat-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "14px 16px", borderBottom: `1px solid ${borderColor}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#e4e4e7" : "#18181b", letterSpacing: "0.01em" }}>
            Notebook Chat
          </div>
          <div style={{ fontSize: 11, color: mutedText, marginTop: 2 }}>
            Ask anything about "{note.subject}"
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: mutedText, borderRadius: 4 }}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
          onMouseLeave={e => { e.currentTarget.style.background = "none" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "40px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#d4d4d8" : "#3f3f46", marginBottom: 4 }}>Chat with your notebook</div>
              <div style={{ fontSize: 11, color: mutedText, maxWidth: 220, lineHeight: 1.5 }}>Ask questions, get summaries, or quiz yourself on your notes.</div>
            </div>

            {/* Quiz Me shortcuts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: mutedText, paddingLeft: 2 }}>Quick Actions</div>
              {QUIZ_PROMPTS.slice(0, 3).map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  style={{
                    textAlign: "left", fontSize: 12, fontWeight: 500, padding: "8px 12px", borderRadius: 8,
                    border: `1px solid ${borderColor}`, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    color: subtleText, cursor: "pointer", transition: "all 0.1s",
                    fontFamily: '"EB Garamond", Georgia, serif',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.color = subtleText }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            padding: "8px 12px",
            borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
            background: msg.role === "user"
              ? accent
              : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
            color: msg.role === "user" ? "#fff" : (isDark ? "#d4d4d8" : "#27272a"),
            fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {msg.content}
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

      {/* Input */}
      <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${borderColor}`, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
          placeholder="Ask about your notes..."
          disabled={loading}
          rows={1}
          style={{
            flex: 1, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${borderColor}`, borderRadius: 10, padding: "8px 12px",
            fontSize: 13, color: isDark ? "#e4e4e7" : "#18181b", outline: "none", resize: "none",
            fontFamily: '"EB Garamond", Georgia, serif', lineHeight: 1.5,
            maxHeight: 100, overflowY: "auto",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{
            width: 32, height: 32, borderRadius: 8, border: "none", flexShrink: 0,
            background: input.trim() && !loading ? accent : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
            color: input.trim() && !loading ? "#fff" : mutedText,
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
