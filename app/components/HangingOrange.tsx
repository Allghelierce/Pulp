"use client"
import { useState, useEffect, useRef, useCallback, memo } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"

function FlexTwine({ bow }: { bow: import("framer-motion").MotionValue<number> }) {
  const [b, setB] = useState(0)
  useEffect(() => bow.on("change", (v: number) => setB(v)), [bow])
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

function WizardFace({ faceScale }: { faceScale: import("framer-motion").MotionValue<number> }) {
  return (
    <motion.div style={{ scale: faceScale }} className="absolute inset-0">
      <svg width="100%" height="100%" viewBox="0 0 30 30" style={{ pointerEvents: "none" }}>
        <circle cx="10" cy="11" r="3.5" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
        <circle cx="10" cy="11" r="1.2" fill="rgba(100,200,255,0.7)" />
        <circle cx="9" cy="10" r="0.5" fill="rgba(255,255,255,0.6)" />
        <path d="M 18 11 Q 20 9.5 22 11" stroke="rgba(0,0,0,0.55)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <polygon points="15 -6, 10 3, 20 3" fill="rgba(0,0,0,0.45)" />
        <line x1="10" y1="3" x2="20" y2="3" stroke="rgba(0,0,0,0.45)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="15" cy="-2" r="1" fill="rgba(100,200,255,0.6)" />
        <path d="M 11 19 Q 14 21 18 18" stroke="rgba(0,0,0,0.5)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  )
}

function NormalFace({ faceIndex, faceScale }: { faceIndex: number; faceScale: import("framer-motion").MotionValue<number> }) {
  const f = faces[faceIndex]
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

const HINT_DISMISSED_KEY = "pulp-ai-hint-dismissed"

// Occasional "press \ for AI" bubble beside the orange. Shows ~40s in, then
// every 4-7 min for ~8s. Never while hidden or with AI open; the × hides it for good.
function AiHint({ suppressed, aiMode }: { suppressed: boolean; aiMode: boolean }) {
  // Bubble starts hidden either way, so reading storage here can't cause a hydration mismatch.
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true
    try { return localStorage.getItem(HINT_DISMISSED_KEY) === "1" } catch { return false }
  })
  const [visible, setVisible] = useState(false)
  const suppressedRef = useRef(suppressed)
  const usedAiRef = useRef(false)
  useEffect(() => { suppressedRef.current = suppressed }, [suppressed])
  // Once they've opened the AI this session, they know the shortcut.
  useEffect(() => { if (aiMode) usedAiRef.current = true }, [aiMode])

  useEffect(() => {
    if (dismissed) return
    let showTimer: ReturnType<typeof setTimeout>
    let hideTimer: ReturnType<typeof setTimeout>
    const schedule = (delay: number) => {
      showTimer = setTimeout(() => {
        if (!suppressedRef.current && !usedAiRef.current) {
          setVisible(true)
          hideTimer = setTimeout(() => setVisible(false), 8000)
        }
        schedule(240_000 + Math.random() * 180_000)
      }, delay)
    }
    schedule(40_000)
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
  }, [dismissed])

  const dismissForever = () => {
    setVisible(false)
    setDismissed(true)
    try { localStorage.setItem(HINT_DISMISSED_KEY, "1") } catch {}
  }

  return (
    <AnimatePresence>
      {visible && !dismissed && !suppressed && !aiMode && (
        <motion.div
          className="fixed z-[9999]"
          initial={{ opacity: 0, x: 6, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 6, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ top: 120, right: 66, transformOrigin: "right center" }}
          role="status"
        >
          <div
            onClick={() => setVisible(false)}
            style={{
              position: "relative", display: "flex", alignItems: "center", gap: 8,
              padding: "6px 8px 6px 12px", borderRadius: 12,
              background: "rgba(24,24,27,0.92)", border: "1px solid rgba(217,119,6,0.35)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)", backdropFilter: "blur(6px)",
              fontFamily: "Crimson Pro, serif", fontSize: 13, color: "#e4e4e7",
              whiteSpace: "nowrap", cursor: "default",
            }}
          >
            <span>
              press{" "}
              <kbd style={{
                fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#d97706",
                padding: "1px 5px", borderRadius: 4, border: "1px solid rgba(217,119,6,0.4)",
                background: "rgba(217,119,6,0.08)",
              }}>{"\\"}</kbd>{" "}
              for AI
            </span>
            <button
              onClick={e => { e.stopPropagation(); dismissForever() }}
              aria-label="Don't show this again"
              title="Don't show again"
              style={{
                width: 18, height: 18, borderRadius: 9, border: "none", padding: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", color: "#a1a1aa", cursor: "pointer", fontSize: 13, lineHeight: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#d97706" }}
              onMouseLeave={e => { e.currentTarget.style.color = "#a1a1aa" }}
            >×</button>
            {/* Tail pointing at the orange */}
            <span style={{
              position: "absolute", right: -5, top: "50%", width: 8, height: 8,
              transform: "translateY(-50%) rotate(45deg)",
              background: "rgba(24,24,27,0.92)",
              borderTop: "1px solid rgba(217,119,6,0.35)", borderRight: "1px solid rgba(217,119,6,0.35)",
            }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// The orange speaks up when cards are ready to recall. Click -> orchard, which
// points at what's due. × hides it until the count changes.
function RecallBubble({ due, topic, suppressed, onOpen }: { due: number; topic?: string; suppressed: boolean; onOpen: () => void }) {
  const [hiddenAt, setHiddenAt] = useState<number | null>(null)
  const show = due > 0 && !suppressed && hiddenAt !== due
  const lines = ["Time to remember!", "Ready to recall?", "Your trees are thirsty!", "Quick memory check?"]
  const line = lines[due % lines.length]
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed z-[9999]"
          initial={{ opacity: 0, x: 8, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 8, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 380, damping: 26, delay: 0.6 }}
          style={{ top: 112, right: 66, transformOrigin: "right center" }}
          role="status"
        >
          <div
            onClick={onOpen}
            title="Open the orchard"
            style={{
              position: "relative", display: "flex", alignItems: "center", gap: 8,
              padding: "7px 8px 7px 13px", borderRadius: 14,
              background: "rgba(24,24,27,0.94)", border: "1px solid rgba(217,119,6,0.55)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3), 0 0 0 3px rgba(217,119,6,0.08)", backdropFilter: "blur(6px)",
              fontFamily: "Crimson Pro, serif", color: "#e4e4e7", cursor: "pointer", maxWidth: 260,
            }}
          >
            <span style={{ lineHeight: 1.25 }}>
              <span style={{ fontSize: 13.5, color: "#fbbf24" }}>{line}</span><br />
              <span style={{ fontSize: 12.5, color: "#d4d4d8" }}>
                {due} card{due === 1 ? "" : "s"} to recall{topic ? <> · <span style={{ color: "#fff" }}>{topic}</span></> : null}
              </span>
            </span>
            <button
              onClick={e => { e.stopPropagation(); setHiddenAt(due) }}
              aria-label="Hide for now"
              title="Hide for now"
              style={{ width: 18, height: 18, borderRadius: 9, border: "none", padding: 0, alignSelf: "flex-start", background: "transparent", color: "#a1a1aa", cursor: "pointer", fontSize: 13, lineHeight: 1 }}
            >×</button>
            <span style={{
              position: "absolute", right: -5, top: 22, width: 8, height: 8, transform: "rotate(45deg)",
              background: "rgba(24,24,27,0.94)",
              borderTop: "1px solid rgba(217,119,6,0.55)", borderRight: "1px solid rgba(217,119,6,0.55)",
            }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const HangingOrange = memo(function HangingOrange({ onClick, onHover, retracted, aiMode, recallDue = 0, recallTopic }: { onClick: () => void; onHover?: () => void; retracted?: boolean; aiMode?: boolean; recallDue?: number; recallTopic?: string }) {
  const angle = useMotionValue(0)
  const [faceIndex, setFaceIndex] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const faceScaleMotion = useMotionValue(1)
  const faceScaleSpring = useSpring(faceScaleMotion, { stiffness: 200, damping: 15 })

  const dragTriggered = useRef(false)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "pulp-timer-state") setTimerRunning(!!e.data.timerRunning)
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  const springAngle = useSpring(angle, { stiffness: 80, damping: 12, mass: 0.8 })
  const lagAngle = useSpring(angle, { stiffness: 60, damping: 10, mass: 0.9 })
  const stringBow = useTransform(lagAngle, v => v * 0.8)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const changeFace = useCallback(() => {
    let newIndex = Math.floor(Math.random() * faces.length)
    while (newIndex === faceIndex) {
      newIndex = Math.floor(Math.random() * faces.length)
    }
    setFaceIndex(newIndex)
    faceScaleMotion.set(0.7)
    setTimeout(() => faceScaleMotion.set(1), 50)
  }, [faceIndex, faceScaleMotion])

  useEffect(() => {
    const runNudge = () => {
      const mag = 0.3 + Math.random() * 0.5
      const dir = Math.random() > 0.5 ? 1 : -1
      angle.set(mag * dir)
      timerRef.current = setTimeout(runNudge, 2500 + Math.random() * 3500)
    }
    runNudge()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [angle])

  return (<>
    <RecallBubble due={recallDue} topic={recallTopic} suppressed={timerRunning || !!retracted || !!aiMode} onOpen={onClick} />
    <AiHint suppressed={timerRunning || !!retracted || recallDue > 0} aiMode={!!aiMode} />
    <motion.div
      className="fixed z-[9999]"
      style={{
        top: 0, right: 24, width: 32, height: 180,
        display: "flex", flexDirection: "column", alignItems: "center",
        cursor: "grab", transformOrigin: "top center",
        rotate: springAngle,
      }}
      initial={{ y: -180, opacity: 0 }}
      animate={timerRunning || retracted ? { y: -180, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 50, damping: 14, mass: 1 }}
      whileHover={timerRunning || retracted ? {} : { y: 4 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 45 }}
      dragElastic={0.05}
      onDrag={(_, info) => {
        if (info.offset.y > 40 && !dragTriggered.current) {
          dragTriggered.current = true
          changeFace()
        }
      }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 40) onClick()
        dragTriggered.current = false
      }}
      onHoverStart={onHover}
      onClick={() => { changeFace(); onClick() }}
    >
      {/* Twine behind orange */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 0 }}>
        <FlexTwine bow={stringBow} />
      </div>

      <div className="relative flex flex-col items-center" style={{ marginTop: 118, zIndex: 1 }}>
        {/* Orange ball */}
        <motion.div
          animate={aiMode ? {
            boxShadow: [
              "0 8px 24px rgba(234,88,12,0.3), inset -4px -4px 10px rgba(0,0,0,0.2), inset 4px 4px 8px rgba(255,255,255,0.3), 0 0 16px rgba(217,119,6,0.5)",
              "0 8px 24px rgba(234,88,12,0.3), inset -4px -4px 10px rgba(0,0,0,0.2), inset 4px 4px 8px rgba(255,255,255,0.3), 0 0 28px rgba(217,119,6,0.3)",
              "0 8px 24px rgba(234,88,12,0.3), inset -4px -4px 10px rgba(0,0,0,0.2), inset 4px 4px 8px rgba(255,255,255,0.3), 0 0 16px rgba(217,119,6,0.5)",
            ],
          } : {
            boxShadow: "0 8px 24px rgba(234,88,12,0.3), inset -4px -4px 10px rgba(0,0,0,0.2), inset 4px 4px 8px rgba(255,255,255,0.3)",
          }}
          transition={aiMode ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #d97706 0%, #d97706 100%)",
            position: "relative", overflow: "hidden",
            border: "1.5px solid rgba(255,255,255,0.1)",
          }}
        >
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          />
          <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.15 }}>
            <filter id="orange-noise"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" /></filter>
            <rect width="100%" height="100%" filter="url(#orange-noise)" />
          </svg>
          <div style={{ position: "absolute", top: 5, left: 6, width: 8, height: 4, background: "rgba(255,255,255,0.4)", borderRadius: "50%", rotate: "-35deg", filter: "blur(1px)" }} />

          {aiMode
            ? <WizardFace faceScale={faceScaleSpring} />
            : <NormalFace faceIndex={faceIndex} faceScale={faceScaleSpring} />
          }
        </motion.div>

        {/* Leaf */}
        <div style={{
          position: "absolute", top: -2, right: -4, width: 15, height: 8,
          background: "linear-gradient(to bottom right, #16a34a, #166534)",
          borderRadius: "100% 0% 100% 0%", rotate: "15deg",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          border: "0.2px solid rgba(255,255,255,0.05)", zIndex: 15,
        }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 0.5, background: "rgba(255,255,255,0.1)", opacity: 0.5 }} />
        </div>
      </div>
    </motion.div>
  </>)
})
