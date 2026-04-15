"use client"
import { useState, memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const QUOTES = [
  "Every moment is a fresh beginning.",
  "The only way out is through.",
  "Progress, not perfection.",
  "Your future self will thank you.",
  "Focus on what you can control.",
  "This too shall pass.",
  "Keep going, you're doing great.",
  "One step at a time.",
  "Breathe. You've got this.",
  "The best time to start was yesterday. The second best time is now."
]

interface TimerSidebarPanelProps {
  isOpen: boolean
  onClose: () => void
  elapsed: number
  total: number
  running: boolean
  done: boolean
  preset: "focus" | "short" | "long"
  theme: "light" | "dark"
  sidebarWidth: number
  waterDeadline: number | null
  treeDead: boolean
  onSetTotal: (v: number) => void
  onSetPreset: (v: "focus" | "short" | "long") => void
  onStart: () => void
  onGiveUp: () => void
  onWater: () => void
  onClaim: () => void
  onDismissDead: () => void
}

const PRESET_TIMES: Record<"focus" | "short" | "long", number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
}

function TreeVisualization({ progress }: { progress: number; running: boolean; elapsed: number; total: number }) {
  // Forest-style staged growth: 0 = seed, 1 = mature tree
  // Stage thresholds:  sprout (0–0.15) → sapling (0.15–0.35) → young (0.35–0.6) → growing (0.6–0.85) → mature (0.85–1)
  const p = Math.max(0, Math.min(1, progress))

  // Discrete stages — always visible once reached
  // 0 sprout | 1 sapling | 2 young | 3 growing | 4 mature
  const stage = p < 0.2 ? 0 : p < 0.4 ? 1 : p < 0.6 ? 2 : p < 0.85 ? 3 : 4
  // Scale ramps per stage so each is clearly larger than the last
  const scale = [0.35, 0.55, 0.75, 0.9, 1.05][stage]
  const showSprout = stage === 0
  const showTree = stage >= 1

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="leafGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" style={{ stopColor: "#4a8a4f" }} />
          <stop offset="100%" style={{ stopColor: "#1B3022" }} />
        </radialGradient>
        <radialGradient id="sproutGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "#7ab87f" }} />
          <stop offset="100%" style={{ stopColor: "#386641" }} />
        </radialGradient>
      </defs>

      {/* Ground line */}
      <ellipse cx="50" cy="93" rx="22" ry="1.5" fill="rgba(0,0,0,0.25)" />

      {/* Everything below is drawn relative to (0,0) = trunk base, then translated to (50, 95). */}
      <g transform="translate(50 95)">
        {/* Sprout — stage 0 */}
        {showSprout && (
          <g>
            <path d="M0 -2 Q0 -9 0 -15" stroke="#5a8a3f" strokeWidth="1.6" strokeLinecap="round" />
            <ellipse cx="-5" cy="-14" rx="3.5" ry="1.8" fill="url(#sproutGrad)" transform="rotate(-25 -5 -14)" />
            <ellipse cx="5" cy="-14" rx="3.5" ry="1.8" fill="url(#sproutGrad)" transform="rotate(25 5 -14)" />
          </g>
        )}

        {/* Tree — stages 1–4, anchored at (0,0) and scaled per stage */}
        {showTree && (
          <g transform={`scale(${scale})`}>
            {/* Trunk */}
            <path d="M0 0 L0 -50 Q0 -60 5 -67" stroke="#7a5a3a" strokeWidth="4.5" strokeLinecap="round" />
            {/* Branches — stage 2+ */}
            {stage >= 2 && (
              <>
                <path d="M0 -30 Q-7 -37 -14 -37" stroke="#7a5a3a" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M0 -40 Q7 -47 14 -45" stroke="#7a5a3a" strokeWidth="2.4" strokeLinecap="round" />
              </>
            )}

            {/* Main canopy */}
            <motion.circle
              cx="0" cy="-63" r="14"
              fill="url(#leafGrad)"
              animate={{ r: [14, 15, 14] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            {/* Side canopies */}
            <circle cx="-8" cy="-53" r="10" fill="url(#leafGrad)" />
            {stage >= 2 && <circle cx="8" cy="-53" r="11" fill="url(#leafGrad)" />}
            {stage >= 3 && <circle cx="0" cy="-47" r="13" fill="url(#leafGrad)" opacity={0.95} />}
            {stage >= 4 && (
              <>
                <circle cx="-14" cy="-60" r="8" fill="url(#leafGrad)" opacity={0.9} />
                <circle cx="14" cy="-60" r="8" fill="url(#leafGrad)" opacity={0.9} />
              </>
            )}

            {/* Oranges — stage 4 */}
            {stage >= 4 && (
              <g>
                <circle cx="-6" cy="-57" r="1.4" fill="#EA8C55" />
                <circle cx="6" cy="-55" r="1.3" fill="#EA8C55" />
                <circle cx="0" cy="-61" r="1.2" fill="#EA8C55" />
              </g>
            )}
          </g>
        )}
      </g>
    </svg>
  )
}

const QUICK_PRESETS = [5, 10, 15, 25]

export const TimerSidebarPanel = memo(function TimerSidebarPanel({
  isOpen, onClose, elapsed, total, running, done, theme, sidebarWidth,
  waterDeadline, treeDead, onSetTotal, onStart, onGiveUp, onWater, onClaim, onDismissDead,
}: TimerSidebarPanelProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [confirmGiveUp, setConfirmGiveUp] = useState(false)

  useEffect(() => {
    if (!running || done || treeDead) setConfirmGiveUp(false)
  }, [running, done, treeDead])

  // Tick once a second so the water countdown stays fresh
  useEffect(() => {
    if (!running || !waterDeadline) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running, waterDeadline])

  // Rotate quotes every 20 minutes
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % QUOTES.length)
    }, 20 * 60 * 1000) // 20 minutes
    return () => clearInterval(interval)
  }, [running])

  const remainingTime = Math.max(0, total - elapsed)
  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60
  const progress = total > 0 ? elapsed / total : 0

  const mainColor = "#EA8C55"
  const isDark = theme === "dark"
  const bgColor = isDark ? "rgba(0,0,0,0.72)" : "rgba(10,10,12,0.68)"
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)"
  const textColor = "#e4e4e7"
  const dimColor = "#a1a1aa"
  const subtleColor = "#71717a"
  const serifFont = '"EB Garamond", Georgia, serif'

  const handleMainButton = () => {
    if (treeDead) onDismissDead()
    else if (done) onClaim()
    else if (running) setConfirmGiveUp(true)
    else onStart()
  }

  // Water countdown — only meaningful when running with a deadline set
  const waterMsLeft = waterDeadline ? Math.max(0, waterDeadline - now) : 0
  const waterSecLeft = Math.ceil(waterMsLeft / 1000)
  const waterMin = Math.floor(waterSecLeft / 60)
  const waterSec = waterSecLeft % 60
  const waterUrgent = waterMsLeft > 0 && waterMsLeft < 60_000
  const showWaterWidget = running && waterDeadline !== null

  const sliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const updateTime = (clientX: number) => {
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const mins = Math.round((percent * 175 + 5) / 5) * 5
      onSetTotal(mins * 60)
    }
    updateTime(e.clientX)
    const handleMove = (m: MouseEvent) => updateTime(m.clientX)
    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleUp)
    }
    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseup", handleUp)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed z-50 flex flex-col select-none overflow-hidden shadow-2xl"
          style={{
            left: sidebarWidth + 10,
            bottom: 12,
            width: 260,
            maxHeight: "calc(100vh - 80px)",
            backgroundColor: bgColor,
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: `1px solid ${borderColor}`,
            fontFamily: serifFont,
            userSelect: 'none',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2 shrink-0"
            style={{ borderBottom: `1px solid ${borderColor}`, fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            <div className="flex items-center gap-2">
              {/* Water countdown — small ring + tabular MM:SS */}
              {showWaterWidget ? (
                <div
                  className="flex items-center gap-1.5"
                  title={waterUrgent ? "Water the tree soon!" : "Time until next watering"}
                >
                  <div className="relative w-3.5 h-3.5">
                    <svg viewBox="0 0 24 24" className="w-full h-full -rotate-90">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <circle
                        cx="12" cy="12" r="10" fill="none"
                        stroke={waterUrgent ? "#ef4444" : "#60a5fa"}
                        strokeWidth="3" strokeLinecap="round"
                        pathLength="1"
                        strokeDasharray="1"
                        strokeDashoffset={1 - Math.min(1, waterMsLeft / (10 * 60 * 1000))}
                      />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold tabular-nums tracking-[0.05em]" style={{ color: waterUrgent ? "#ef4444" : "#cbd5e1" }}>
                    {String(waterMin).padStart(1, "0")}:{String(waterSec).padStart(2, "0")}
                  </span>
                </div>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: dimColor }}>
                    <circle cx="12" cy="13" r="8" />
                    <path d="M12 9v4l2 2" />
                    <path d="M9 2h6" />
                  </svg>
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: dimColor }}>
                    Focus Timer
                  </span>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-white/5"
              style={{ color: subtleColor }}
              title="Close (⌘⌥T)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex flex-col px-4 py-5">
            <div className="flex flex-col items-center">
              {/* Timer display */}
              <div className="text-center mb-3">
                <div
                  className="tabular-nums"
                  style={{
                    fontFamily: serifFont,
                    fontWeight: 500,
                    fontSize: 44,
                    color: running || done ? mainColor : textColor,
                    lineHeight: 1,
                  }}
                >
                  {String(minutes).padStart(2, "0")}
                  <span style={{ opacity: 0.55 }}>:{String(seconds).padStart(2, "0")}</span>
                </div>
                <p className="text-[9px] uppercase tracking-[0.18em] mt-2" style={{ color: treeDead ? "#ef4444" : subtleColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {treeDead ? "tree withered" : running ? "in session" : done ? "complete" : "ready"}
                </p>
              </div>

              {/* Tree + progress ring */}
              <div className="relative w-52 h-60 mx-auto mb-5">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 240">
                  <defs>
                    <linearGradient id="timerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#D4A574" />
                      <stop offset="100%" stopColor="#EA8C55" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 100, 10 A 85, 105 0 1, 1 99.9, 10 Z"
                    fill="transparent"
                    stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                    strokeWidth="2"
                  />
                  <motion.path
                    d="M 100, 10 A 85, 105 0 1, 1 99.9, 10 Z"
                    fill="transparent"
                    stroke="url(#timerGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    pathLength="1"
                    strokeDasharray="1"
                    animate={{ strokeDashoffset: 1 - progress }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center p-3 mt-3">
                  <div className="w-full h-full scale-[1.15]" style={{ filter: treeDead ? "grayscale(1) brightness(0.5)" : undefined, opacity: treeDead ? 0.55 : 1, transition: "filter 0.5s, opacity 0.5s" }}>
                    <TreeVisualization progress={progress} running={running} elapsed={elapsed} total={total} />
                  </div>
                </div>
              </div>

              {/* Watering can — visible during a session that requires it */}
              {showWaterWidget && !treeDead && (
                <button
                  onClick={onWater}
                  title="Water the tree"
                  className="mb-3 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: waterUrgent ? "rgba(239,68,68,0.12)" : "rgba(96,165,250,0.1)",
                    border: `1px solid ${waterUrgent ? "rgba(239,68,68,0.35)" : "rgba(96,165,250,0.3)"}`,
                    color: waterUrgent ? "#fca5a5" : "#93c5fd",
                    fontFamily: serifFont,
                    animation: waterUrgent ? "pulp-water-pulse 1.2s ease-in-out infinite" : undefined,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 11v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
                    <path d="M3 11h12" />
                    <path d="M15 13l5-3v8l-5-3" />
                    <path d="M7 8c0-2 2-3 2-3" />
                  </svg>
                  <span className="text-[11px] font-semibold">Water</span>
                </button>
              )}
              <style>{`@keyframes pulp-water-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>

              {/* Quote when running */}
              {running && (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={quoteIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-[11px] italic text-center px-1 mb-3"
                    style={{ color: dimColor, lineHeight: 1.4, fontFamily: serifFont }}
                  >
                    "{QUOTES[quoteIndex]}"
                  </motion.p>
                </AnimatePresence>
              )}

              {/* Duration slider (hidden while running) */}
              {!running && (
                <div className="w-full">
                  {/* Quick preset chips */}
                  <div className="flex gap-1.5 mb-3 justify-center">
                    {QUICK_PRESETS.map(mins => {
                      const active = total === mins * 60
                      return (
                        <button
                          key={mins}
                          onClick={() => onSetTotal(mins * 60)}
                          className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all"
                          style={{
                            backgroundColor: active ? mainColor : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
                            color: active ? "#fff" : subtleColor,
                            border: `1px solid ${active ? mainColor : borderColor}`,
                            fontFamily: 'Inter, system-ui, sans-serif',
                          }}
                        >
                          {mins}m
                        </button>
                      )
                    })}
                  </div>
                  <div
                    className="relative h-1 rounded-full cursor-grab active:cursor-grabbing mb-1.5"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                    onMouseDown={sliderMouseDown}
                  >
                    <div
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{
                        backgroundColor: `${mainColor}40`,
                        width: `${((total / 60 - 5) / 175) * 100}%`,
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: 11,
                        height: 11,
                        marginLeft: -5.5,
                        backgroundColor: mainColor,
                        left: `${((total / 60 - 5) / 175) * 100}%`,
                        boxShadow: `0 0 0 2px ${bgColor}, 0 0 6px ${mainColor}55`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] uppercase tracking-[0.1em]" style={{ color: subtleColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    <span>5m</span>
                    <span className="tabular-nums" style={{ color: textColor, fontWeight: 600 }}>
                      {Math.floor(total / 60)} min
                    </span>
                    <span>180m</span>
                  </div>

                  <div
                    className="text-[10px] text-center mt-3 py-1.5 px-2 rounded-[6px]"
                    style={{
                      color: dimColor,
                      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${borderColor}`,
                      fontFamily: serifFont,
                    }}
                  >
                    Complete for{' '}
                    <span style={{ color: mainColor, fontWeight: 600 }}>
                      +{total === 15 * 60 ? 2 : total === 25 * 60 ? 5 : 3} ☀
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Main button */}
            <div className="mt-3">
              {confirmGiveUp ? (
                <div
                  className="w-full rounded-[6px] px-3 py-2.5 flex flex-col items-center gap-2"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    fontFamily: serifFont,
                  }}
                >
                  <span className="text-[10px] tracking-[0.08em]" style={{ color: "#ef4444" }}>
                    Abandon this session?
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => { onGiveUp(); setConfirmGiveUp(false) }}
                      className="text-[9px] font-black uppercase tracking-[0.2em] hover:underline"
                      style={{ color: "#ef4444" }}
                    >
                      Yes, give up
                    </button>
                    <span style={{ color: subtleColor }}>·</span>
                    <button
                      onClick={() => setConfirmGiveUp(false)}
                      className="text-[9px] font-black uppercase tracking-[0.2em] hover:underline"
                      style={{ color: dimColor }}
                    >
                      Keep going
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleMainButton}
                  className="w-full py-2 rounded-[6px] transition-colors text-[11px] font-semibold"
                  style={{
                    fontFamily: serifFont,
                    letterSpacing: '0.01em',
                    backgroundColor: treeDead || (running && !done)
                      ? "rgba(239,68,68,0.1)"
                      : done
                        ? `${mainColor}1a`
                        : isDark ? "rgba(255,255,255,0.04)" : "#f4f4f5",
                    color: treeDead || (running && !done) ? "#ef4444" : done ? mainColor : textColor,
                    border: `1px solid ${treeDead || (running && !done) ? "rgba(239,68,68,0.25)" : done ? `${mainColor}40` : isDark ? borderColor : "#d4d4d8"}`,
                  }}
                >
                  {treeDead ? "Try Again" : done ? "Claim Reward" : running ? "Give Up" : "Start Session"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
