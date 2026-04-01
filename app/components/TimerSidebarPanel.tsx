"use client"
import { useState, memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HangingOrange } from "./HangingOrange"
import { ShiningText } from "./ui/shining-text"

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
  onSetRunning: (v: boolean) => void
  onSetElapsed: (v: number | ((prev: number) => number)) => void
  onSetTotal: (v: number) => void
  onSetPreset: (v: "focus" | "short" | "long") => void
  onSetDone: (v: boolean) => void
}

const PRESET_TIMES: Record<"focus" | "short" | "long", number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
}

const GROWTH_STAGES = ["Seed", "Sprout", "Seedling", "Sapling", "Young Tree", "Mature Tree"]

function getGrowthStage(progress: number): { stage: string; percent: number } {
  const percent = Math.round(progress * 100)
  const stageIndex = Math.floor(progress * (GROWTH_STAGES.length - 1))
  return {
    stage: GROWTH_STAGES[Math.min(stageIndex, GROWTH_STAGES.length - 1)],
    percent
  }
}

function TreeVisualization({ progress, running, elapsed, total }: { progress: number; running: boolean; elapsed: number; total: number }) {
  // Calculate draw progress (30 minutes per tree, from 0 to 1 for each tree)
  const totalSeconds = total
  const elapsedSeconds = elapsed
  const secondsPerTree = 30 * 60
  const treeProgress = (elapsedSeconds % secondsPerTree) / secondsPerTree
  const numCompleteTrees = Math.floor(elapsedSeconds / secondsPerTree)

  // Clip height: grows from bottom (100) to top (0) as progress increases
  // When not running, show full tree (clipHeight = 0). When running, animate from 100 to 0
  const clipHeight = running ? 100 * (1 - treeProgress) : 0

  const renderTree = (offset: number) => (
    <g key={`tree-${offset}`} transform={`translate(0, ${offset * 120})`}>
      <defs>
        <clipPath id={`treeClip-${offset}`}>
          <rect x="0" y={clipHeight} width="100" height={100 - clipHeight} />
        </clipPath>
        <radialGradient id={`leafGrad-${offset}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "#386641" }} />
          <stop offset="100%" style={{ stopColor: "#1B3022" }} />
        </radialGradient>
      </defs>

      <g clipPath={`url(#treeClip-${offset})`}>
        {/* Trunk */}
        <path d="M50 90 L50 40 Q50 30 55 25" stroke="#8B6F47" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 65 Q45 60 40 62" stroke="#8B6F47" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 55 Q55 50 60 52" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />

        {/* Foliage */}
        <motion.circle cx="50" cy="35" r="15" fill={`url(#leafGrad-${offset})`} opacity={1} animate={{ r: [15, 16, 15] }} transition={{ duration: 2, repeat: Infinity }} />
        <circle cx="38" cy="45" r="12" fill={`url(#leafGrad-${offset})`} opacity={1} />
        <circle cx="62" cy="45" r="12" fill={`url(#leafGrad-${offset})`} opacity={1} />
        <circle cx="50" cy="50" r="14" fill={`url(#leafGrad-${offset})`} opacity={0.95} />

        {/* Orange Fruits - all visible by default */}
        <circle cx="42" cy="35" r="2.5" fill="#EA8C55" opacity={1} />
        <circle cx="58" cy="40" r="2.5" fill="#EA8C55" opacity={1} />
        <circle cx="52" cy="52" r="2.5" fill="#EA8C55" opacity={1} />
        <circle cx="35" cy="48" r="2.5" fill="#EA8C55" opacity={1} />
        <circle cx="65" cy="48" r="2.5" fill="#EA8C55" opacity={1} />

        {/* Orange Fruits - tiny decorative ones */}
        <circle cx="45" cy="50" r="1.2" fill="#EA8C55" opacity={0.8} />
        <circle cx="55" cy="48" r="1.2" fill="#EA8C55" opacity={0.8} />
        <circle cx="48" cy="42" r="1" fill="#EA8C55" opacity={0.7} />
        <circle cx="52" cy="38" r="1" fill="#EA8C55" opacity={0.7} />
        <circle cx="40" cy="40" r="1" fill="#EA8C55" opacity={0.7} />
        <circle cx="60" cy="35" r="1.2" fill="#EA8C55" opacity={0.8} />
        <circle cx="38" cy="55" r="1" fill="#EA8C55" opacity={0.6} />
        <circle cx="62" cy="55" r="1" fill="#EA8C55" opacity={0.6} />
      </g>
    </g>
  )

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      {/* Render active tree being drawn */}
      {renderTree(0)}

      {/* Render completed trees above */}
      {Array.from({ length: numCompleteTrees }).map((_, i) => renderTree(-(i + 1)))}
    </svg>
  )
}

export const TimerSidebarPanel = memo(function TimerSidebarPanel({
  isOpen, onClose, elapsed, total, running, done, preset, theme,
  onSetRunning, onSetElapsed, onSetTotal, onSetPreset, onSetDone
}: TimerSidebarPanelProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)

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
  const { stage, percent } = getGrowthStage(progress)

  const handlePresetClick = (p: "focus" | "short" | "long") => {
    onSetPreset(p)
    onSetTotal(PRESET_TIMES[p])
    onSetElapsed(0)
    onSetRunning(false)
    onSetDone(false)
  }

  const handleMainButton = () => {
    if (done) {
      // Take reward - reset everything
      onSetRunning(false)
      onSetElapsed(0)
      onSetDone(false)
    } else if (running) {
      // Give up - stop the session
      onSetRunning(false)
      onSetElapsed(0)
      onSetDone(false)
    } else {
      // Start session
      if (total === 0) {
        onSetTotal(PRESET_TIMES.focus)
      }
      onSetRunning(true)
    }
  }

  const durationOptions = [
    { label: "15m", value: 15 * 60 },
    { label: "25m", value: 25 * 60 },
    { label: "45m", value: 45 * 60 },
  ]

  const selectedDuration = durationOptions.find(d => d.value === total)
  const selectedIndex = selectedDuration ? durationOptions.indexOf(selectedDuration) : 1

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Hanging Orange - can click/pull to close */}
          <div onClick={onClose} className="fixed top-0 right-12 z-[60] cursor-pointer">
            <HangingOrange onClick={onClose} />
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-80 z-50 shadow-2xl flex flex-col user-select-none"
            style={{
              fontFamily: '"Caveat", cursive',
              backgroundColor: theme === "dark" ? "#0f0f12" : "#FBF7F3",
              backgroundImage: theme === "dark"
                ? "linear-gradient(to bottom, #0f0f12, #1a1a1e)"
                : "linear-gradient(to bottom, #FBF7F3, #F3EDE6)",
              borderLeft: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(255,140,85,0.2)"}`
            }}
          >
            <div
              className="flex-1 backdrop-blur-sm p-8 border-b overflow-y-auto flex flex-col justify-between"
              style={{
                backgroundImage: theme === "dark"
                  ? "linear-gradient(to bottom, rgba(15,15,18,0.95), rgba(15,15,18,0.85))"
                  : "linear-gradient(to bottom, #FBF7F3, rgba(251,247,243,0.95))",
                borderBottomColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(255,140,85,0.2)"
              }}
            >
              {/* Top Section */}
              <div className="flex flex-col items-center">
                {/* Timer at top - always same size */}
                <div className="text-center mb-6 relative z-10">
                  <div className="text-5xl tracking-tight" style={{ fontFamily: '"EB Garamond", serif', fontWeight: 700 }}>
                    <span style={{ color: running ? "#EA8C55" : theme === "dark" ? "rgba(255,255,255,0.9)" : "rgba(120,53,15,0.8)" }}>{String(minutes).padStart(2, "0")}</span><span style={{ color: theme === "dark" ? "rgba(255,255,255,0.6)" : "rgba(120,53,15,0.6)" }}>:{String(seconds).padStart(2, "0")}</span>
                  </div>
                  <p className="text-xs font-light mt-2 tracking-wider" style={{ fontFamily: '"EB Garamond", serif' }}>
                    {running ? (
                      <ShiningText text="session active" className="text-xs font-light tracking-wider" gradientColor="red" />
                    ) : (
                      <span style={{ color: theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(120,53,15,0.5)" }}>
                        remaining
                      </span>
                    )}
                  </p>
                </div>

                {/* Label - always reserve space */}
                <div className="text-center mb-6 relative z-10" style={{ visibility: running ? "hidden" : "visible" }}>
                  <span className="font-light tracking-wider text-sm block" style={{ fontFamily: '"EB Garamond", serif', color: theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(234,112,12,0.7)" }}>
                    focus
                  </span>
                </div>

                {/* Tree with circle animation */}
                <div className="relative w-56 h-56 mx-auto mb-8">
                  {/* SVG Progress Ring - always visible */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <defs>
                      <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D4A574" />
                        <stop offset="100%" stopColor="#EA8C55" />
                      </linearGradient>
                    </defs>
                    {/* Background circle */}
                    <circle cx="100" cy="100" r="92" fill="transparent" stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "#E8DCC8"} strokeWidth="2" />
                    {/* Progress circle */}
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="92"
                      fill="transparent"
                      stroke="url(#timerGradient)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 92}
                      strokeDashoffset={2 * Math.PI * 92 * (1 - progress)}
                      animate={{ strokeDashoffset: 2 * Math.PI * 92 * (1 - progress) }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>

                  {/* Tree inside circle */}
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <TreeVisualization progress={progress} running={running} elapsed={elapsed} total={total} />
                  </div>
                </div>

                {/* Rotating Quote - only when running */}
                {running && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={quoteIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="text-center mb-6 px-4"
                    >
                      <p className="text-sm italic" style={{ fontFamily: '"EB Garamond", serif', color: theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(120,53,15,0.7)", lineHeight: "1.5" }}>
                        "{QUOTES[quoteIndex]}"
                      </p>
                    </motion.div>
                  </AnimatePresence>
                )}

                {!running && (
                  <>
                    {/* Duration Slider */}
                    <div className="mb-8 px-4 mt-6 w-full">
                      <div className="flex flex-col gap-4">
                        {/* Slider Track */}
                        <div
                          className="relative h-1 rounded-full cursor-grab active:cursor-grabbing"
                          style={{
                            backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(120,53,15,0.1)"
                          }}
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const updateTime = (clientX: number) => {
                              const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
                              const minutes = Math.round((percent * 175 + 5) / 5) * 5
                              onSetTotal(minutes * 60)
                              onSetElapsed(0)
                            }
                            updateTime(e.clientX)
                            const handleMove = (moveEvent: MouseEvent) => updateTime(moveEvent.clientX)
                            const handleUp = () => {
                              document.removeEventListener("mousemove", handleMove)
                              document.removeEventListener("mouseup", handleUp)
                            }
                            document.addEventListener("mousemove", handleMove)
                            document.addEventListener("mouseup", handleUp)
                          }}
                          onTouchStart={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const updateTime = (clientX: number) => {
                              const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
                              const minutes = Math.round((percent * 175 + 5) / 5) * 5
                              onSetTotal(minutes * 60)
                              onSetElapsed(0)
                            }
                            updateTime(e.touches[0].clientX)
                            const handleMove = (moveEvent: TouchEvent) => updateTime(moveEvent.touches[0].clientX)
                            const handleUp = () => {
                              document.removeEventListener("touchmove", handleMove)
                              document.removeEventListener("touchend", handleUp)
                            }
                            document.addEventListener("touchmove", handleMove)
                            document.addEventListener("touchend", handleUp)
                          }}
                        >
                          {/* Progress Indicator */}
                          <motion.div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: "#EA8C55",
                              left: `${((total / 60 - 5) / 175) * 100}%`
                            }}
                          />
                          {/* Filled Track */}
                          <div
                            className="absolute top-0 left-0 h-full rounded-full"
                            style={{
                              backgroundColor: "#D4A574",
                              width: `${((total / 60 - 5) / 175) * 100}%`
                            }}
                          />
                        </div>

                        {/* Min/Max Labels */}
                        <div className="flex justify-between text-xs -mt-4" style={{ fontFamily: '"EB Garamond", serif', color: theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(120,53,15,0.5)" }}>
                          <span>5m</span>
                          <span>180m</span>
                        </div>

                        {/* Time Display */}
                        <div className="text-center" style={{ fontFamily: '"EB Garamond", serif', fontSize: "18px", color: theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(120,53,15,0.8)" }}>
                          {Math.floor(total / 60)} min
                        </div>
                      </div>
                    </div>

                    {/* Reward Estimate */}
                    <div className="text-center text-xs mt-4 py-2 px-4 rounded" style={{ fontFamily: '"EB Garamond", serif', color: theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(120,53,15,0.6)", backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(120,53,15,0.05)" }}>
                      <p>Complete for{' '}
                        <span style={{ color: "#fbbf24", fontWeight: 600 }}>
                          {total === 15 * 60 ? "+2" : total === 25 * 60 ? "+5" : "+3"} ☀️
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Section */}
              <div className="flex flex-col">
                {/* Controls - positioned at bottom */}
              <div className="flex flex-col items-center gap-3 relative z-10 mt-auto">
                <button
                  onClick={handleMainButton}
                  className="w-full transition-all py-3 shadow-sm"
                  style={{
                    fontFamily: '"Caveat", cursive',
                    fontSize: '18px',
                    letterSpacing: '0.05em',
                    backgroundColor: running && !done ? "rgba(239,68,68,0.15)" : theme === "dark" ? "rgba(255,255,255,0.1)" : "#FFE5CC",
                    color: running && !done ? "#ef4444" : theme === "dark" ? "rgba(255,255,255,0.9)" : "rgba(120,53,15,0.9)",
                    border: `1px solid ${running && !done ? "rgba(239,68,68,0.3)" : theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(255,140,85,0.2)"}`,
                  }}
                  onMouseEnter={(e) => {
                    if (running && !done) {
                      e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.25)"
                    } else {
                      e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.15)" : "#FFD9B3"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (running && !done) {
                      e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.15)"
                    } else {
                      e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.1)" : "#FFE5CC"
                    }
                  }}
                >
                  {done ? "Take Reward" : running ? "Give Up" : "Start Session"}
                </button>
              </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
