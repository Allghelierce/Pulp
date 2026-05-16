"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion"

const faces = [
  { eyes: "circle", eyeSize: 2.5, mouth: "curve-up", label: "happy" },
  { eyes: "circle-happy", eyeSize: 2, mouth: "line-up", label: "excited" },
  { eyes: "line", eyeSize: 2, mouth: "line-straight", label: "serious" },
  { eyes: "circle-big", eyeSize: 3, mouth: "o", label: "surprised" },
  { eyes: "x", eyeSize: 2.5, mouth: "x", label: "dizzy" },
  { eyes: "circle", eyeSize: 2.5, mouth: "curve-down", label: "sad" },
  { eyes: "line-closed", eyeSize: 1.5, mouth: "line-straight", label: "sleepy" },
  { eyes: "heart", eyeSize: 2, mouth: "curve-up", label: "love" },
]

type FaceState = "idle" | "attentive" | "thinking" | "streaming" | "error" | "happy" | "sad" | "sleepy"
const FACE_MAP: Record<FaceState, number> = { idle: 0, attentive: 2, thinking: 2, streaming: 1, error: 4, happy: 7, sad: 5, sleepy: 6 }

function FlexTwine({ bow }: { bow: import("framer-motion").MotionValue<number> }) {
  const [b, setB] = useState(0)
  useEffect(() => bow.on("change", setB), [bow])
  const d1 = `M8 -100 Q${8 + b} 60 8 120`
  const d2 = `M8 -100 Q${8 + b * 0.7} 60 8 120`
  return (
    <svg width="16" height="220" viewBox="0 -100 16 220" style={{ overflow: "visible", display: "block", marginTop: -100 }}>
      <path d={d1} stroke="rgba(0,0,0,0.1)" strokeWidth="1.2" fill="none" />
      <path d={d1} stroke="#e5e5e5" strokeWidth="0.8" fill="none" strokeDasharray="3 2" />
      <path d={d2} stroke="#b85e22" strokeWidth="0.6" fill="none" strokeDasharray="2 3" strokeDashoffset="2" />
    </svg>
  )
}

function OrangeFace({ faceIndex, faceScale, aiMode }: { faceIndex: number; faceScale: import("framer-motion").MotionValue<number>; aiMode?: boolean }) {
  const f = faces[faceIndex]

  if (aiMode) {
    return (
      <motion.div style={{ scale: faceScale }} className="absolute inset-0">
        <svg width="100%" height="100%" viewBox="0 0 30 30" style={{ pointerEvents: "none" }}>
          {/* Monocle / lens eye — left */}
          <circle cx="10" cy="11" r="3.5" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
          <circle cx="10" cy="11" r="1.2" fill="rgba(100,200,255,0.7)" />
          <circle cx="9" cy="10" r="0.5" fill="rgba(255,255,255,0.6)" />
          {/* Normal eye — right, squinting knowingly */}
          <path d="M 18 11 Q 20 9.5 22 11" stroke="rgba(0,0,0,0.55)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          {/* Little wizard hat */}
          <polygon points="15 -6, 10 3, 20 3" fill="rgba(0,0,0,0.45)" />
          <line x1="10" y1="3" x2="20" y2="3" stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" strokeLinecap="round" />
          {/* Star on hat */}
          <circle cx="15" cy="-2" r="1" fill="rgba(100,200,255,0.6)" />
          {/* Smirk */}
          <path d="M 11 19 Q 14 21 18 18" stroke="rgba(0,0,0,0.5)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </svg>
      </motion.div>
    )
  }

  return (
    <motion.div style={{ scale: faceScale }} className="absolute inset-0">
      <svg width="100%" height="100%" viewBox="0 0 30 30" style={{ pointerEvents: "none" }}>
        {f.eyes === "circle" && <><circle cx="10" cy="10" r={f.eyeSize} fill="rgba(0,0,0,0.6)" /><circle cx="20" cy="10" r={f.eyeSize} fill="rgba(0,0,0,0.6)" /></>}
        {f.eyes === "circle-happy" && <><circle cx="10" cy="11" r={f.eyeSize} fill="rgba(0,0,0,0.6)" /><circle cx="20" cy="11" r={f.eyeSize} fill="rgba(0,0,0,0.6)" /></>}
        {f.eyes === "line" && <><line x1="8" y1="10" x2="12" y2="10" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" /><line x1="18" y1="10" x2="22" y2="10" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" /></>}
        {f.eyes === "circle-big" && <><circle cx="10" cy="10" r={f.eyeSize} fill="rgba(0,0,0,0.6)" /><circle cx="20" cy="10" r={f.eyeSize} fill="rgba(0,0,0,0.6)" /></>}
        {f.eyes === "x" && <><line x1="8" y1="8" x2="12" y2="12" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" /><line x1="12" y1="8" x2="8" y2="12" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" /><line x1="18" y1="8" x2="22" y2="12" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" /><line x1="22" y1="8" x2="18" y2="12" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" /></>}
        {f.eyes === "line-closed" && <><path d="M 8 11 Q 10 9 12 11" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" /><path d="M 18 11 Q 20 9 22 11" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" /></>}
        {f.eyes === "heart" && <><path d="M 8 12 L 10 10 Q 11 9 12 10 L 10 12 Z" fill="rgba(0,0,0,0.6)" /><path d="M 18 12 L 20 10 Q 21 9 22 10 L 20 12 Z" fill="rgba(0,0,0,0.6)" /></>}
        {f.mouth === "curve-up" && <path d="M 10 18 Q 15 22 20 18" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />}
        {f.mouth === "line-up" && <line x1="10" y1="20" x2="20" y2="20" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />}
        {f.mouth === "line-straight" && <line x1="10" y1="19" x2="20" y2="19" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" />}
        {f.mouth === "o" && <circle cx="15" cy="19" r="1.5" fill="rgba(0,0,0,0.6)" />}
        {f.mouth === "x" && <><line x1="13" y1="17" x2="17" y2="21" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" /><line x1="17" y1="17" x2="13" y2="21" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" strokeLinecap="round" /></>}
        {f.mouth === "curve-down" && <path d="M 10 18 Q 15 14 20 18" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />}
      </svg>
    </motion.div>
  )
}

const FAKE_RESPONSE = "Photosynthesis converts light energy into chemical energy through two stages: light-dependent reactions in the thylakoid (splitting water, producing ATP/NADPH) and the Calvin cycle in the stroma (fixing CO₂ into glucose). Key equation: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂."

const FAKE_EDIT_RESPONSE = {
  original: "Light-dependent reactions occur in the thylakoid membrane...",
  edited: "Light-dependent reactions take place in the thylakoid membrane, where chlorophyll captures photons to split water molecules into oxygen, hydrogen ions, and electrons — producing ATP and NADPH as energy carriers.",
}

type AiMode = "plan" | "edit"

export default function PreviewPage() {
  const [chatOpen, setChatOpen] = useState(false)
  const [faceState, setFaceState] = useState<FaceState>("idle")
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState("")
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [selectedContext, setSelectedContext] = useState("")
  const [aiMode, setAiMode] = useState<AiMode>("plan")
  const [pendingEdit, setPendingEdit] = useState<{ original: string; edited: string; streamedEdit: string } | null>(null)
  const [notebookLines, setNotebookLines] = useState([
    "Light-dependent reactions occur in the thylakoid membrane...",
    "The Calvin cycle fixes carbon dioxide into organic molecules...",
    "Chlorophyll absorbs red and blue light, reflecting green...",
    "ATP synthase uses the proton gradient to produce ATP...",
  ])
  const [editApplied, setEditApplied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const angle = useMotionValue(0)
  const faceScaleMotion = useMotionValue(1)
  const faceScaleSpring = useSpring(faceScaleMotion, { stiffness: 200, damping: 15 })
  const springAngle = useSpring(angle, { stiffness: 80, damping: 12, mass: 0.8 })
  const lagAngle = useSpring(angle, { stiffness: 60, damping: 10, mass: 0.9 })
  const stringBow = useTransform(lagAngle, v => v * 0.8)

  const isDark = theme === "dark"
  const accent = "#d97706"

  useEffect(() => {
    const nudge = () => angle.set((0.3 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1))
    const id = setInterval(nudge, 3000 + Math.random() * 2000)
    nudge()
    return () => clearInterval(id)
  }, [angle])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, streamText])

  const changeFace = (state: FaceState) => {
    setFaceState(state)
    faceScaleMotion.set(0.7)
    setTimeout(() => faceScaleMotion.set(1), 50)
  }

  const grabSelection = useCallback(() => {
    const sel = window.getSelection()?.toString().trim() || ""
    if (sel && sel.length > 0) setSelectedContext(sel)
  }, [])

  const openChat = useCallback(() => {
    grabSelection()
    setChatOpen(true)
    changeFace("attentive")
    setTimeout(() => inputRef.current?.focus(), 350)
  }, [faceScaleMotion, grabSelection])

  const closeChat = useCallback(() => {
    setChatOpen(false)
    setSelectedContext("")
    changeFace("sleepy")
    setTimeout(() => changeFace("idle"), 1500)
  }, [faceScaleMotion])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "\\") { e.preventDefault(); chatOpen ? closeChat() : openChat() }
      if (e.key === "Escape" && chatOpen) closeChat()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [chatOpen, openChat, closeChat])

  // Live selection detection while bubble is open
  useEffect(() => {
    if (!chatOpen) return
    const handler = () => {
      const sel = window.getSelection()?.toString().trim() || ""
      if (sel.length > 2) setSelectedContext(sel)
    }
    document.addEventListener("selectionchange", handler)
    return () => document.removeEventListener("selectionchange", handler)
  }, [chatOpen])

  const simulateStream = useCallback((text: string) => {
    setStreaming(true)
    changeFace("streaming")
    setStreamText("")
    let i = 0
    const id = setInterval(() => {
      if (i < text.length) { setStreamText(text.slice(0, i + 1)); i++ }
      else { clearInterval(id); setMessages(prev => [...prev, { role: "assistant", content: text }]); setStreamText(""); setStreaming(false); changeFace("attentive") }
    }, 8)
  }, [faceScaleMotion])

  const simulateEditStream = useCallback((edit: typeof FAKE_EDIT_RESPONSE) => {
    setStreaming(true)
    changeFace("streaming")
    setPendingEdit({ original: edit.original, edited: edit.edited, streamedEdit: "" })
    let i = 0
    const id = setInterval(() => {
      if (i < edit.edited.length) {
        setPendingEdit(prev => prev ? { ...prev, streamedEdit: edit.edited.slice(0, i + 1) } : null)
        i++
      } else {
        clearInterval(id)
        setPendingEdit(prev => prev ? { ...prev, streamedEdit: edit.edited } : null)
        setStreaming(false)
        changeFace("attentive")
      }
    }, 8)
  }, [faceScaleMotion])

  const acceptEdit = useCallback(() => {
    if (!pendingEdit) return
    setNotebookLines(prev => prev.map(l => l === pendingEdit.original ? pendingEdit.edited : l))
    setEditApplied(true)
    setPendingEdit(null)
    setTimeout(() => setEditApplied(false), 1500)
  }, [pendingEdit])

  const rejectEdit = useCallback(() => {
    setPendingEdit(null)
  }, [])

  const handleSend = useCallback((text?: string) => {
    const msg = (text || input).trim()
    if (!msg || streaming) return
    setInput("")
    changeFace("thinking")

    if (aiMode === "edit" && selectedContext) {
      setMessages(prev => [...prev, { role: "user", content: msg }])
      setTimeout(() => simulateEditStream({ original: selectedContext, edited: FAKE_EDIT_RESPONSE.edited }), 400)
    } else if (aiMode === "edit" && !selectedContext) {
      setMessages(prev => [...prev, { role: "user", content: msg }])
      setTimeout(() => simulateEditStream(FAKE_EDIT_RESPONSE), 400)
    } else {
      setMessages(prev => [...prev, { role: "user", content: msg }])
      setTimeout(() => simulateStream(FAKE_RESPONSE), 600)
    }
  }, [input, streaming, simulateStream, simulateEditStream, faceScaleMotion, aiMode, selectedContext])

  const bg = isDark ? "#09090b" : "#fafaf9"
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
  const textColor = isDark ? "#d4d4d8" : "#374151"
  const mutedText = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"
  const aiBubbleBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"

  // Orange center position: right:24 + 16px half-width = right:40 from viewport edge, vertically ~130px from top (twine + ball)
  const ORANGE_RIGHT = 40
  const ORANGE_BOTTOM_Y = 130

  return (
    <div style={{ width: "100vw", height: "100vh", background: bg, position: "relative", overflow: "hidden", fontFamily: "Crimson Pro, Georgia, serif" }}>
      {/* Notebook */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 700, padding: "60px 80px", color: textColor, opacity: 0.6 }}>
          <div style={{ fontSize: 28, fontWeight: 400, marginBottom: 20, color: isDark ? "#e4e4e7" : "#18181b" }}>Photosynthesis Notes</div>
          {notebookLines.map((t, i) => {
            const wasJustEdited = editApplied && t === FAKE_EDIT_RESPONSE.edited
            return (
              <div key={i} style={{
                fontSize: 16, lineHeight: 2,
                borderBottom: `1px solid ${borderColor}`,
                paddingBottom: 8, marginBottom: 8,
                background: wasJustEdited ? `${accent}15` : "transparent",
                borderLeft: wasJustEdited ? `2px solid ${accent}` : "2px solid transparent",
                paddingLeft: wasJustEdited ? 8 : 0,
                borderRadius: wasJustEdited ? 4 : 0,
                transition: "all 0.4s ease",
              }}>{t}</div>
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{
        position: "fixed", bottom: 20, left: 20, zIndex: 100, padding: "8px 16px", borderRadius: 8,
        border: `1px solid ${borderColor}`, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        color: textColor, cursor: "pointer", fontSize: 13, fontFamily: "Crimson Pro, serif",
      }}>
        {isDark ? "Light" : "Dark"}
      </button>
      <div style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 100,
        padding: "8px 20px", borderRadius: 20, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${borderColor}`, color: mutedText, fontSize: 13, fontFamily: "Crimson Pro, serif",
      }}>
        Press <span style={{ color: accent, fontWeight: 500 }}>\</span> to talk to the orange
      </div>

      {/* === ORANGE + BUBBLE AS ONE UNIT === */}
      <div style={{ position: "fixed", top: 0, right: 0, zIndex: 9999, pointerEvents: "none" }}>

        {/* The orange on its twine */}
        <motion.div
          style={{
            position: "absolute", top: 0, right: 24, width: 32, height: 180,
            display: "flex", flexDirection: "column", alignItems: "center",
            cursor: "grab", transformOrigin: "top center",
            rotate: springAngle, pointerEvents: "auto",
          }}
          whileHover={{ y: 4 }}
          onClick={() => chatOpen ? closeChat() : openChat()}
        >
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 0 }}>
            <FlexTwine bow={stringBow} />
          </div>
          <div className="relative flex flex-col items-center" style={{ marginTop: 118, zIndex: 1 }}>
            {/* Orange ball with glow when active */}
            <motion.div
              animate={chatOpen ? {
                boxShadow: [
                  "0 8px 24px rgba(234,88,12,0.3), inset -4px -4px 10px rgba(0,0,0,0.2), inset 4px 4px 8px rgba(255,255,255,0.3), 0 0 16px rgba(217,119,6,0.5)",
                  "0 8px 24px rgba(234,88,12,0.3), inset -4px -4px 10px rgba(0,0,0,0.2), inset 4px 4px 8px rgba(255,255,255,0.3), 0 0 28px rgba(217,119,6,0.3)",
                  "0 8px 24px rgba(234,88,12,0.3), inset -4px -4px 10px rgba(0,0,0,0.2), inset 4px 4px 8px rgba(255,255,255,0.3), 0 0 16px rgba(217,119,6,0.5)",
                ],
              } : {
                boxShadow: "0 8px 24px rgba(234,88,12,0.3), inset -4px -4px 10px rgba(0,0,0,0.2), inset 4px 4px 8px rgba(255,255,255,0.3)",
              }}
              transition={chatOpen ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #d97706 0%, #d97706 100%)",
                marginTop: -4, position: "relative", overflow: "hidden",
                border: "1.5px solid rgba(255,255,255,0.1)",
              }}
            >
              <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
              <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.15 }}><filter id="orange-noise"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" /></filter><rect width="100%" height="100%" filter="url(#orange-noise)" /></svg>
              <div style={{ position: "absolute", top: 5, left: 6, width: 8, height: 4, background: "rgba(255,255,255,0.4)", borderRadius: "50%", rotate: "-35deg", filter: "blur(1px)" }} />
              <OrangeFace faceIndex={FACE_MAP[faceState]} faceScale={faceScaleSpring} aiMode={chatOpen} />
            </motion.div>

            <div style={{ position: "absolute", top: -2, right: -4, width: 15, height: 8, background: "linear-gradient(to bottom right, #16a34a, #166534)", borderRadius: "100% 0% 100% 0%", rotate: "15deg", boxShadow: "0 1px 2px rgba(0,0,0,0.15)", zIndex: 15 }}>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 0.5, background: "rgba(255,255,255,0.1)", opacity: 0.5 }} />
            </div>
          </div>
        </motion.div>

        {/* === THOUGHT BUBBLE — drips down from the orange === */}
        <AnimatePresence>
          {chatOpen && (
            <>
              {/* Thought dots — trail from orange center down to bubble top-right */}
              {[
                { top: ORANGE_BOTTOM_Y + 6, right: 38, size: 5, delay: 0 },
                { top: ORANGE_BOTTOM_Y + 16, right: 40, size: 8, delay: 0.02 },
                { top: ORANGE_BOTTOM_Y + 28, right: 44, size: 11, delay: 0.04 },
              ].map((dot, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ delay: dot.delay, duration: 0.08 }}
                  style={{
                    position: "absolute",
                    top: dot.top, right: dot.right,
                    width: dot.size, height: dot.size, borderRadius: "50%",
                    background: `${accent}50`,
                    border: `1.5px solid ${accent}70`,
                    boxShadow: `0 0 6px ${accent}30`,
                    pointerEvents: "none",
                  }}
                />
              ))}

              {/* The bubble */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: -40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -40 }}
                transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  top: ORANGE_BOTTOM_Y + 38,
                  right: 24,
                  width: 260,
                  transformOrigin: "top right",
                  pointerEvents: "auto",
                  fontFamily: "Crimson Pro, Georgia, serif",
                }}
              >
                <div style={{
                  background: isDark ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.96)",
                  borderRadius: "20px 4px 20px 20px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  borderTop: `1.5px solid ${accent}35`,
                  boxShadow: isDark
                    ? `0 12px 40px rgba(0,0,0,0.5)`
                    : `0 12px 40px rgba(0,0,0,0.07)`,
                  display: "flex", flexDirection: "column",
                  maxHeight: "60vh",
                  overflow: "hidden",
                }}>

                  {/* Selected context chip */}
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
                            fontStyle: "italic",
                            overflow: "hidden",
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

                  {/* Messages */}
                  <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, minHeight: 40, maxHeight: "48vh" }}>

                    {messages.length === 0 && !streaming && (
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
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ maxWidth: "100%" }}
                      >
                        {msg.role === "user" ? (
                          <div style={{ fontSize: 12, color: accent, marginBottom: 2, fontStyle: "italic" }}>
                            {msg.content}
                          </div>
                        ) : (
                          <div style={{
                            fontSize: 13, lineHeight: 1.65, color: textColor,
                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                          }}>
                            {msg.content}
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {streaming && streamText && (
                      <div style={{ fontSize: 13, lineHeight: 1.65, color: textColor, whiteSpace: "pre-wrap" }}>
                        {streamText}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ color: accent }}>▍</motion.span>
                      </div>
                    )}

                    {faceState === "thinking" && !streamText && !pendingEdit && (
                      <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }} style={{ width: 4, height: 4, borderRadius: "50%", background: accent }} />
                        ))}
                      </div>
                    )}

                    {/* Edit diff preview */}
                    {pendingEdit && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {/* Original — strikethrough */}
                        <div style={{
                          fontSize: 12, lineHeight: 1.5, color: isDark ? "rgba(239,68,68,0.6)" : "rgba(220,38,38,0.5)",
                          textDecoration: "line-through", fontStyle: "italic",
                          padding: "6px 8px", borderRadius: 6,
                          background: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)",
                          borderLeft: "2px solid rgba(239,68,68,0.3)",
                        }}>
                          {pendingEdit.original}
                        </div>
                        {/* New — streaming in */}
                        <div style={{
                          fontSize: 12, lineHeight: 1.5, color: isDark ? "rgba(34,197,94,0.8)" : "rgba(22,163,74,0.7)",
                          padding: "6px 8px", borderRadius: 6,
                          background: isDark ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.04)",
                          borderLeft: `2px solid rgba(34,197,94,0.4)`,
                          whiteSpace: "pre-wrap",
                        }}>
                          {pendingEdit.streamedEdit || ""}
                          {streaming && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ color: "#22c55e" }}>▍</motion.span>}
                        </div>
                        {/* Accept / Reject */}
                        {!streaming && pendingEdit.streamedEdit === pendingEdit.edited && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 6 }}>
                            <button onClick={acceptEdit} style={{
                              flex: 1, padding: "5px 0", borderRadius: 8, border: "none",
                              background: "rgba(34,197,94,0.15)", color: "#22c55e",
                              fontSize: 11, cursor: "pointer", fontFamily: "Crimson Pro, serif",
                              transition: "background 0.15s",
                            }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,197,94,0.25)" }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,197,94,0.15)" }}
                            >Apply</button>
                            <button onClick={rejectEdit} style={{
                              flex: 1, padding: "5px 0", borderRadius: 8, border: "none",
                              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                              color: mutedText, fontSize: 11, cursor: "pointer",
                              fontFamily: "Crimson Pro, serif",
                            }}>Discard</button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Mode toggle + Input */}
                  <div style={{ padding: "8px 14px 10px", display: "flex", gap: 6, alignItems: "center", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                    <button
                      onClick={() => setAiMode(m => m === "plan" ? "edit" : "plan")}
                      title={aiMode === "plan" ? "Plan mode — switch to edit" : "Edit mode — switch to plan"}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: 0, flexShrink: 0, display: "flex", alignItems: "center",
                        color: aiMode === "edit" ? "#22c55e" : mutedText,
                        transition: "color 0.15s",
                        fontSize: 11,
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
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSend() } }}
                      placeholder={aiMode === "edit" ? "rewrite..." : "..."}
                      style={{
                        flex: 1, background: "none", border: "none", outline: "none",
                        fontSize: 13, color: isDark ? "#e4e4e7" : "#18181b",
                        fontFamily: "Crimson Pro, serif", padding: 0,
                      }}
                    />
                    <motion.div
                      animate={input.trim() ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      onClick={() => handleSend()}
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: streaming || faceState === "thinking"
                          ? "#eab308"
                          : messages.length > 0 && !streaming
                            ? "#22c55e"
                            : input.trim()
                              ? accent
                              : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"),
                        boxShadow: streaming || faceState === "thinking"
                          ? "0 0 6px rgba(234,179,8,0.5)"
                          : messages.length > 0 && !streaming
                            ? "0 0 6px rgba(34,197,94,0.4)"
                            : "none",
                        cursor: input.trim() ? "pointer" : "default",
                        transition: "background 0.2s, box-shadow 0.2s",
                        flexShrink: 0,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
