"use client"
import { useState, useEffect, useRef, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { apiFetch } from "@/lib/apiFetch"

type AiMode = "plan" | "edit"
type AiStatus = "idle" | "thinking" | "streaming" | "done" | "error"

interface OrangeAIHubProps {
  open: boolean
  theme: "light" | "dark"
  accent: string
  noteText?: string
  noteName?: string
  userId?: string
  onClose: () => void
  onInsertText?: (text: string) => void
  onReplaceSelection?: (text: string) => void
}

export const OrangeAIHub = memo(function OrangeAIHub({
  open, theme, accent, noteText, noteName, userId, onClose, onInsertText, onReplaceSelection,
}: OrangeAIHubProps) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState("")
  const [status, setStatus] = useState<AiStatus>("idle")
  const [selectedContext, setSelectedContext] = useState("")
  const [aiMode, setAiMode] = useState<AiMode>("plan")
  const [pendingEdit, setPendingEdit] = useState<{ original: string; edited: string; streamedEdit: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const isDark = theme === "dark"
  const textColor = isDark ? "#d4d4d8" : "#374151"
  const mutedText = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"

  useEffect(() => {
    if (open) {
      const sel = window.getSelection()?.toString().trim() || ""
      if (sel.length > 2) setSelectedContext(sel)
      setTimeout(() => inputRef.current?.focus(), 200)
    } else {
      setSelectedContext("")
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = () => {
      const sel = window.getSelection()?.toString().trim() || ""
      if (sel.length > 2) setSelectedContext(sel)
    }
    document.addEventListener("selectionchange", handler)
    return () => document.removeEventListener("selectionchange", handler)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, streamText, pendingEdit?.streamedEdit])

  const streamFromAPI = useCallback(async (prompt: string, context?: string) => {
    setStatus("thinking")
    setStreaming(true)
    setStreamText("")

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const body: Record<string, unknown> = { prompt, stream: true }
      if (context) body.text = context

      const res = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Request failed (${res.status})`)
      }

      setStatus("streaming")
      const reader = res.body?.getReader()
      if (!reader) throw new Error("No stream")

      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue
          try {
            const json = JSON.parse(line.slice(6))
            if (json.token) {
              full += json.token
              setStreamText(full)
            }
          } catch {}
        }
      }

      return full
    } catch (err) {
      if ((err as Error).name === "AbortError") return null
      throw err
    } finally {
      abortRef.current = null
    }
  }, [])

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || streaming) return
    setInput("")

    if (!userId) {
      setMessages(prev => [...prev, { role: "user", content: msg }, { role: "assistant", content: "Sign in to use the AI." }])
      return
    }

    const context = selectedContext || noteText || ""
    setMessages(prev => [...prev, { role: "user", content: msg }])

    if (aiMode === "edit" && (selectedContext || noteText)) {
      const original = selectedContext || (noteText?.slice(0, 200) || "")
      setPendingEdit({ original, edited: "", streamedEdit: "" })

      try {
        setStatus("thinking")
        setStreaming(true)

        const body: Record<string, unknown> = { prompt: msg, text: original, stream: true }
        const res = await apiFetch("/api/ai", {
          method: "POST",
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || `Edit request failed (${res.status})`)
        }

        setStatus("streaming")
        const reader = res.body?.getReader()
        if (!reader) throw new Error("No stream")

        const decoder = new TextDecoder()
        let full = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue
            try {
              const json = JSON.parse(line.slice(6))
              if (json.token) {
                full += json.token
                setPendingEdit(prev => prev ? { ...prev, streamedEdit: full, edited: full } : null)
              }
            } catch {}
          }
        }

        setPendingEdit(prev => prev ? { ...prev, streamedEdit: full, edited: full } : null)
        setStatus("done")
        setStreaming(false)
      } catch (err) {
        console.error("Edit error:", err)
        setStatus("error")
        setStreaming(false)
        setPendingEdit(null)
        setMessages(prev => [...prev, { role: "assistant", content: err instanceof Error ? err.message : "Something went wrong." }])
      }
    } else {
      try {
        const result = await streamFromAPI(msg, context)
        if (result !== null) {
          setMessages(prev => [...prev, { role: "assistant", content: result }])
          setStreamText("")
          setStatus("done")
        }
        setStreaming(false)
      } catch (err) {
        console.error("Chat error:", err)
        setStatus("error")
        setStreaming(false)
        setMessages(prev => [...prev, { role: "assistant", content: err instanceof Error ? err.message : "Something went wrong." }])
      }
    }
  }, [input, streaming, aiMode, selectedContext, noteText, streamFromAPI, userId])

  const acceptEdit = useCallback(() => {
    if (!pendingEdit?.edited) return
    if (selectedContext && onReplaceSelection) {
      onReplaceSelection(pendingEdit.edited)
    } else if (onInsertText) {
      onInsertText(pendingEdit.edited)
    }
    setPendingEdit(null)
  }, [pendingEdit, selectedContext, onReplaceSelection, onInsertText])

  const rejectEdit = useCallback(() => setPendingEdit(null), [])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const ORANGE_BOTTOM_Y = 130

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -40 }}
            transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
            style={{
              position: "fixed", zIndex: 10000,
              top: ORANGE_BOTTOM_Y + 38,
              right: 18,
              width: 260,
              transformOrigin: "top right",
              fontFamily: "Crimson Pro, Georgia, serif",
            }}
          >
            {/* Spike — same bg, no border on inner edge, seamless with bubble */}
            <div style={{
              position: "absolute", top: -8, right: 18, width: 14, height: 14,
              background: isDark ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.96)",
              clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
              zIndex: 1,
            }} />
            <div style={{
              position: "relative",
              background: isDark ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.96)",
              borderRadius: "20px 4px 20px 20px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              borderTop: `1.5px solid ${accent}35`,
              boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.07)",
              display: "flex", flexDirection: "column",
              maxHeight: "60vh", overflow: "hidden",
            }}>

              <AnimatePresence>
                {selectedContext && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      padding: "8px 12px",
                      background: isDark ? `${accent}10` : `${accent}08`,
                      borderBottom: `1px solid ${accent}20`,
                      display: "flex", alignItems: "flex-start", gap: 8,
                    }}>
                      <div style={{
                        width: 3, minHeight: 14, borderRadius: 2,
                        background: accent, opacity: 0.6, flexShrink: 0, marginTop: 1,
                      }} />
                      <div style={{
                        flex: 1, fontSize: 11, lineHeight: 1.5,
                        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
                        fontStyle: "italic", overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                      }}>
                        {selectedContext}
                      </div>
                      <button
                        onClick={() => setSelectedContext("")}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: mutedText, padding: 0, flexShrink: 0, marginTop: 1,
                          fontSize: 10, lineHeight: 1, opacity: 0.5,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={scrollRef} style={{
                flex: 1, overflowY: "auto", padding: "12px 14px",
                display: "flex", flexDirection: "column", gap: 8,
                minHeight: 40, maxHeight: "48vh",
              }}>
                {!userId && messages.length === 0 && (
                  <div style={{ padding: "12px 0", fontSize: 13, color: mutedText, lineHeight: 1.6, fontFamily: "Crimson Pro, serif" }}>
                    Sign in to use the AI.
                  </div>
                )}

                {userId && messages.length === 0 && !streaming && !pendingEdit && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 0" }}>
                    {["Summarize this", "Quiz me", "Explain simply"].map(q => (
                      <button key={q} onClick={() => handleSend(q)} style={{
                        textAlign: "left", padding: "6px 0", fontSize: 13,
                        border: "none", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                        background: "none", color: mutedText, cursor: "pointer",
                        fontFamily: "Crimson Pro, serif", transition: "color 0.15s",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.color = accent }}
                        onMouseLeave={e => { e.currentTarget.style.color = mutedText }}
                      >{q}</button>
                    ))}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "100%" }}>
                    {msg.role === "user" ? (
                      <div style={{ fontSize: 12, color: accent, marginBottom: 2, fontStyle: "italic" }}>{msg.content}</div>
                    ) : (
                      <div style={{ fontSize: 13, lineHeight: 1.65, color: textColor, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</div>
                    )}
                  </motion.div>
                ))}

                {streaming && streamText && (
                  <div style={{ fontSize: 13, lineHeight: 1.65, color: textColor, whiteSpace: "pre-wrap" }}>
                    {streamText}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ color: accent }}>▍</motion.span>
                  </div>
                )}

                {status === "thinking" && !streamText && !pendingEdit && (
                  <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }} style={{ width: 4, height: 4, borderRadius: "50%", background: accent }} />
                    ))}
                  </div>
                )}

                {pendingEdit && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{
                      fontSize: 12, lineHeight: 1.5,
                      color: isDark ? "rgba(239,68,68,0.6)" : "rgba(220,38,38,0.5)",
                      textDecoration: "line-through", fontStyle: "italic",
                      padding: "6px 8px", borderRadius: 6,
                      background: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)",
                      borderLeft: "2px solid rgba(239,68,68,0.3)",
                    }}>
                      {pendingEdit.original}
                    </div>
                    <div style={{
                      fontSize: 12, lineHeight: 1.5,
                      color: isDark ? "rgba(34,197,94,0.8)" : "rgba(22,163,74,0.7)",
                      padding: "6px 8px", borderRadius: 6,
                      background: isDark ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.04)",
                      borderLeft: "2px solid rgba(34,197,94,0.4)",
                      whiteSpace: "pre-wrap",
                    }}>
                      {pendingEdit.streamedEdit || ""}
                      {streaming && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ color: "#22c55e" }}>▍</motion.span>}
                    </div>
                    {!streaming && pendingEdit.streamedEdit === pendingEdit.edited && pendingEdit.edited && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 6 }}>
                        <button onClick={acceptEdit} style={{
                          flex: 1, padding: "5px 0", borderRadius: 8, border: "none",
                          background: "rgba(34,197,94,0.15)", color: "#22c55e",
                          fontSize: 11, cursor: "pointer", fontFamily: "Crimson Pro, serif",
                        }}>Apply</button>
                        <button onClick={rejectEdit} style={{
                          flex: 1, padding: "5px 0", borderRadius: 8, border: "none",
                          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                          color: mutedText, fontSize: 11, cursor: "pointer", fontFamily: "Crimson Pro, serif",
                        }}>Discard</button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              <div style={{
                padding: "8px 14px 10px", display: "flex", gap: 6, alignItems: "center",
                borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
              }}>
                <button
                  onClick={() => setAiMode(m => m === "plan" ? "edit" : "plan")}
                  title={aiMode === "plan" ? "Plan mode" : "Edit mode"}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: 0, flexShrink: 0, display: "flex", alignItems: "center",
                    color: aiMode === "edit" ? "#22c55e" : mutedText,
                    transition: "color 0.15s", fontSize: 11,
                  }}
                >
                  {aiMode === "edit" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  )}
                </button>
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); handleSend() }
                    else if (e.key === "Tab") { e.preventDefault(); setAiMode(m => m === "plan" ? "edit" : "plan") }
                  }}
                  placeholder={aiMode === "edit" ? "rewrite · tab to plan" : "ask anything · tab to edit"}
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    fontSize: 13, color: isDark ? "#e4e4e7" : "#18181b",
                    fontFamily: "Crimson Pro, serif", padding: 0,
                  }}
                />
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: status === "thinking" || status === "streaming"
                    ? "#eab308"
                    : status === "done"
                      ? "#22c55e"
                      : input.trim() ? accent : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"),
                  boxShadow: status === "thinking" || status === "streaming"
                    ? "0 0 6px rgba(234,179,8,0.5)"
                    : status === "done"
                      ? "0 0 6px rgba(34,197,94,0.4)"
                      : "none",
                  transition: "background 0.2s, box-shadow 0.2s",
                }} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
