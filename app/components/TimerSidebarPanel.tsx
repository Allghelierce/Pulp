"use client"
import { useState, memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"

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
  lostSunshine: number
  gems: number
  onRecoverSunshine: () => void
  inventory: string[]
  selectedSeed: string | null
  onSelectSeed: (seed: string | null) => void
}

const PRESET_TIMES: Record<"focus" | "short" | "long", number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
}

function TreeVisualization({ progress, type, idle }: { progress: number; type: string | null; idle?: boolean }) {
  const p = Math.max(0, Math.min(1, progress))
  const plantType = type || 'navel'
  const color = TREE_TYPES[plantType]?.color || '#b85e22'

  // Idle state: show a default sprout
  if (idle) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-3 rounded-full blur-xl"
          style={{ backgroundColor: '#4ade8044' }}
        />
        <motion.div
          animate={{ y: [0, -3, 0], rotate: [0, 1, -1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="80" height="80" viewBox="0 0 24 24" className="overflow-visible">
            {/* Stem */}
            <path d="M12 22 L12 13" stroke="#5c2d0b" strokeWidth="1.8" strokeLinecap="round" />
            {/* Leaf left */}
            <path d="M12 15 Q7 12 8 8 Q10 10 12 13" fill="#4ade80" opacity="0.8" />
            {/* Leaf right */}
            <path d="M12 14 Q17 11 16 7 Q14 9 12 12" fill="#22c55e" opacity="0.7" />
            {/* Small bud */}
            <circle cx="12" cy="8" r="2.5" fill="#86efac" opacity="0.6" />
          </svg>
        </motion.div>
      </div>
    )
  }

  // Stages: 0 (Planted) | 1 (Seedling) | 2 (Sprout) | 3 (Young) | 4 (Mature)
  const stage = p < 0.1 ? 0 : p < 0.3 ? 1 : p < 0.6 ? 2 : p < 0.85 ? 3 : 4

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Ground Glow */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full blur-xl transition-colors duration-1000"
        style={{ backgroundColor: color + '33' }}
      />

      <motion.div
        animate={{
          scale: stage === 0 ? 0.9 : 1 + (stage * 0.08),
          y: stage === 0 ? 5 : 0
        }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        {stage === 0 ? (
          <div className="relative">
            <PlantIcon type={plantType} size={60} isSeed={true} />
            <motion.div
               animate={{ opacity: [0.2, 0.5, 0.2] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 blur-md"
            >
              <PlantIcon type={plantType} size={60} isSeed={true} />
            </motion.div>
          </div>
        ) : (
          <PlantIcon type={plantType} size={120} stage={stage - 1} />
        )}
      </motion.div>

      {/* Decorative Particles for higher stages */}
      {stage >= 3 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              animate={{
                y: [-20, -60],
                x: [0, (i - 2) * 15],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: i * 0.4
              }}
              style={{
                left: '50%',
                top: '50%',
                backgroundColor: color
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const TimerSidebarPanel = memo(function TimerSidebarPanel({
  isOpen, onClose, elapsed, total, running, done, theme, sidebarWidth,
  waterDeadline, treeDead, onSetTotal, onStart, onGiveUp, onWater, onClaim, onDismissDead,
  lostSunshine, gems, onRecoverSunshine,
  inventory, selectedSeed, onSelectSeed,
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
            maxHeight: "calc(100vh - 20px)",
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
                    <TreeVisualization progress={progress} type={selectedSeed} idle={!running && !done && !treeDead} />
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

                  <p className="text-center mt-2 text-[11px]" style={{ color: mainColor, fontFamily: serifFont, fontWeight: 600 }}>
                    +{Math.max(1, Math.round(total / 300))} ☀
                  </p>
                </div>
              )}
            </div>

            {/* Seed selection UI — only before starting */}
            {!running && !done && !treeDead && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: subtleColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    Select Crop
                  </p>
                  {inventory.length === 0 && (
                    <span className="text-[9px]" style={{ color: '#ef4444' }}>No seeds available</span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {/* Common Seed (always available if inventory empty? or just show what they have) */}
                  {[...new Set(inventory)].length === 0 && (
                    <div className="text-[10px] italic p-2 rounded bg-white/5 border border-white/10 w-full text-center" style={{ color: subtleColor }}>
                      Visit the Shop to buy seeds
                    </div>
                  )}

                  {[...new Set(inventory)].map(type => {
                    const count = inventory.filter(s => s === type).length
                    const isSelected = selectedSeed === type
                    const info = TREE_TYPES[type]
                    if (!info) return null
                    
                    return (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectSeed(isSelected ? null : type)}
                        className="relative flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all"
                        style={{
                          backgroundColor: isSelected ? `${info.color}25` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isSelected ? `${info.color}80` : "rgba(255,255,255,0.08)"}`,
                          boxShadow: isSelected ? `0 4px 12px ${info.color}20` : 'none',
                        }}
                      >
                        <PlantIcon type={type} size={18} isSeed={true} />
                        <div className="flex flex-col items-start leading-none">
                           <span className="text-[10px] font-bold" style={{ color: isSelected ? info.color : textColor }}>
                             {info.name.split(' ')[0]}
                           </span>
                           <span className="text-[8px] opacity-60" style={{ color: isSelected ? info.color : dimColor }}>
                             {count} held
                           </span>
                        </div>
                        {isSelected && (
                          <motion.div 
                            layoutId="activeSeed"
                            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center shadow-lg"
                          >
                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }} />
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Main button */}
            <div className="mt-7">
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

              {lostSunshine > 0 && !running && !done && (
                <div
                  className="w-full rounded-[6px] px-3 py-2.5 mt-2 flex flex-col items-center gap-1.5"
                  style={{
                    backgroundColor: isDark ? "rgba(251,191,36,0.06)" : "rgba(251,191,36,0.08)",
                    border: `1px solid ${isDark ? "rgba(251,191,36,0.15)" : "rgba(251,191,36,0.25)"}`,
                    fontFamily: serifFont,
                  }}
                >
                  <span className="text-[10px] tracking-[0.04em]" style={{ color: isDark ? "#fbbf24" : "#b45309" }}>
                    You lost {lostSunshine} ☀️
                  </span>
                  <button
                    onClick={onRecoverSunshine}
                    disabled={gems < Math.max(5, Math.ceil(lostSunshine * 0.5))}
                    className="text-[9px] font-black uppercase tracking-[0.15em] hover:underline disabled:opacity-30 disabled:no-underline"
                    style={{ color: "#a78bfa" }}
                  >
                    Recover for {Math.max(5, Math.ceil(lostSunshine * 0.5))} 💎
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
