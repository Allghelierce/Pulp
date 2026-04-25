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
  onCancel: () => void
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

function MossyHill({ isDark, overlap = 6 }: { isDark: boolean; overlap?: number }) {
  return (
    <svg className="w-full shrink-0" viewBox="0 0 200 40" preserveAspectRatio="none" style={{ height: 40, marginTop: -overlap }}>
      <defs>
        <linearGradient id="hillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#2a3a22' : '#8a9a70'} />
          <stop offset="100%" stopColor={isDark ? '#1a2416' : '#6a7a58'} />
        </linearGradient>
        <linearGradient id="mossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#3a4a30' : '#9aaa80'} />
          <stop offset="100%" stopColor={isDark ? '#2a3620' : '#7a8a64'} />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="22" rx="95" ry="18" fill="url(#hillGrad)" />
      <ellipse cx="80" cy="20" rx="50" ry="10" fill="url(#mossGrad)" opacity="0.6" />
      <ellipse cx="130" cy="21" rx="35" ry="8" fill="url(#mossGrad)" opacity="0.4" />
      {[25, 55, 80, 110, 140, 165].map((x, i) => (
        <g key={i} opacity={isDark ? 0.3 : 0.25}>
          <path d={`M${x},${14 + (i % 2) * 3} q${-1.5},${-3} ${-0.5},${-4.5} M${x},${14 + (i % 2) * 3} q${1},${-2.5} ${2},${-4} M${x},${14 + (i % 2) * 3} q${0.5},${-3} ${-0.8},${-3.8}`} stroke={isDark ? '#5a7a48' : '#7a9a60'} strokeWidth="0.8" fill="none" />
        </g>
      ))}
    </svg>
  )
}

function TreeVisualization({ progress, type, idle, isDark }: { progress: number; type: string | null; idle?: boolean; isDark?: boolean }) {
  const p = Math.max(0, Math.min(1, progress))
  const plantType = type || 'heartwood'
  const typeInfo = TREE_TYPES[plantType] || TREE_TYPES.heartwood
  const color = typeInfo.color
  const shape = typeInfo.shape || 'oak'

  if (idle) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center" style={{ marginTop: -20 }}>
        <PlantIcon type={plantType} size={100} stage={4} />
        <MossyHill isDark={isDark ?? true} overlap={10} />
      </div>
    )
  }

  const stage = p < 0.1 ? 0 : p < 0.3 ? 1 : p < 0.6 ? 2 : p < 0.85 ? 3 : 4

  const plantSize = stage === 0 ? 50 : 70 + stage * 12
  const hillOverlap = stage === 0 ? 4 : stage <= 2 ? 8 : 10

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center" style={{ marginTop: -20 }}>
      <div
        className="absolute left-1/2 -translate-x-1/2 w-20 h-3 rounded-full blur-xl transition-colors duration-1000 z-0"
        style={{ backgroundColor: color + '33', bottom: '38%' }}
      />

      <div className="relative z-10">
        {stage === 0 ? (
          <div className="relative">
            <PlantIcon type={plantType} size={plantSize} isSeed={true} />
            <motion.div
               animate={{ opacity: [0.2, 0.5, 0.2] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 blur-md"
            >
              <PlantIcon type={plantType} size={plantSize} isSeed={true} />
            </motion.div>
          </div>
        ) : (
          <PlantIcon type={plantType} size={plantSize} stage={stage - 1} />
        )}
      </div>

      <MossyHill isDark={isDark ?? true} overlap={hillOverlap} />

      {stage >= 3 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              animate={{
                y: shape === 'ethereal' ? [-20, -100] : [-20, -60],
                x: [0, (i - 2.5) * 20],
                opacity: [0, 1, 0],
                scale: [0, shape === 'crystal' ? 1.8 : 1.2, 0],
                rotate: shape === 'crystal' ? [0, 180] : 0
              }}
              transition={{
                duration: shape === 'ethereal' ? 3 : 2 + Math.random(),
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut"
              }}
              style={{
                left: '50%',
                top: '30%',
                backgroundColor: shape === 'crystal' ? '#fff' : color,
                boxShadow: shape === 'ethereal' ? `0 0 8px ${color}` : 'none'
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
  waterDeadline, treeDead, onSetTotal, onStart, onGiveUp, onCancel, onWater, onClaim, onDismissDead,
  lostSunshine, gems, onRecoverSunshine,
  inventory, selectedSeed, onSelectSeed,
}: TimerSidebarPanelProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [confirmGiveUp, setConfirmGiveUp] = useState(false)
  const [seedTrayOpen, setSeedTrayOpen] = useState(false)

  useEffect(() => {
    if (!running || done || treeDead) setConfirmGiveUp(false)
    if (running) setSeedTrayOpen(false)
  }, [running, done, treeDead])

  useEffect(() => {
    if (!confirmGiveUp) return
    const timer = setTimeout(() => setConfirmGiveUp(false), 10000)
    return () => clearTimeout(timer)
  }, [confirmGiveUp])

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
          className="fixed z-50 flex flex-col select-none shadow-2xl"
          style={{
            left: sidebarWidth + 10,
            bottom: 12,
            width: 250,
            height: "auto",
            minHeight: 560,
            maxHeight: "calc(100vh - 40px)",
            backgroundColor: bgColor,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: `1px solid ${borderColor}`,
            borderRadius: 24,
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
          <div className="flex-1 flex flex-col px-4 py-6 overflow-visible">
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

              {/* Tree + progress ring OR inline seed inventory */}
              <AnimatePresence mode="wait">
                {seedTrayOpen && !running && !done && !treeDead ? (
                  <motion.div
                    key="seed-tray"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full mx-auto mb-5"
                    style={{ minHeight: 256 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: dimColor, fontFamily: 'Inter, system-ui, sans-serif' }}>My Seeds</span>
                      <button
                        onClick={() => setSeedTrayOpen(false)}
                        className="text-[9px] font-semibold uppercase tracking-[0.1em] hover:underline"
                        style={{ color: mainColor, fontFamily: 'Inter, system-ui, sans-serif' }}
                      >
                        Back
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2.5 overflow-y-auto" style={{ maxHeight: 280 }}>
                      {inventory.map((type, idx) => {
                        const info = TREE_TYPES[type]
                        if (!info) return null
                        const isSelected = selectedSeed === type
                        const rarityColor = info.rarity === 'common' ? '#a1a1aa' : info.rarity === 'uncommon' ? '#34d399' : info.rarity === 'rare' ? '#60a5fa' : info.rarity === 'true rare' ? '#a78bfa' : info.rarity === 'premium' ? '#fbbf24' : info.rarity === 'chroma' ? '#f472b6' : '#f87171'
                        return (
                          <motion.button
                            key={`${type}-${idx}`}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => { onSelectSeed(isSelected ? null : type); setSeedTrayOpen(false) }}
                            title={info.name}
                            className="relative"
                            style={{
                              width: 48, height: 48, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              backgroundColor: isDark ? 'rgba(39,39,42,0.4)' : 'rgba(255,255,255,0.9)',
                              border: `1.5px solid ${isSelected ? info.color : isDark ? 'rgba(63,63,70,0.6)' : 'rgba(228,228,231,0.8)'}`,
                              boxShadow: isSelected ? `0 0 0 2px ${info.color}40, 0 0 12px ${info.color}20` : `0 0 0 2px ${rarityColor}15`,
                              cursor: 'pointer',
                              transition: 'border-color 0.15s, box-shadow 0.15s',
                            }}
                          >
                            <PlantIcon type={type} size={28} isSeed />
                            {isSelected && (
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ backgroundColor: info.color, borderColor: isDark ? '#18181b' : '#fafafa', boxShadow: `0 0 6px ${info.color}` }} />
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`tree-view-${selectedSeed || 'none'}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full mx-auto mb-2"
                    style={{ height: 200 }}
                  >
                    <div className="w-full h-full" style={{ filter: treeDead ? "grayscale(1) brightness(0.5)" : undefined, opacity: treeDead ? 0.55 : 1, transition: "filter 0.5s, opacity 0.5s" }}>
                      <TreeVisualization progress={progress} type={selectedSeed} idle={!running && !done && !treeDead} isDark={isDark} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Change Plant button — visible only when idle */}
              {!running && !done && !treeDead && !seedTrayOpen && inventory.length > 0 && (
                <button
                  onClick={() => setSeedTrayOpen(true)}
                  className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all hover:underline"
                  style={{ color: mainColor, fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  Change Plant
                </button>
              )}

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

            {/* Main button */}
            <div className="mt-7">
              <button
                onClick={() => {
                  if (running && !done && !treeDead) {
                    if (elapsed < 60) { onCancel(); return }
                    if (confirmGiveUp) { onGiveUp(); setConfirmGiveUp(false) }
                    else setConfirmGiveUp(true)
                  } else {
                    handleMainButton()
                  }
                }}
                className="w-full py-2 rounded-[6px] transition-all text-[11px] font-semibold"
                style={{
                  fontFamily: serifFont,
                  letterSpacing: '0.01em',
                  backgroundColor: treeDead ? "rgba(239,68,68,0.1)"
                    : running && !done && elapsed < 60
                      ? isDark ? "rgba(255,255,255,0.04)" : "#f4f4f5"
                      : running && !done
                        ? "rgba(239,68,68,0.1)"
                        : done
                          ? `${mainColor}1a`
                          : isDark ? "rgba(255,255,255,0.04)" : "#f4f4f5",
                  color: treeDead ? "#ef4444"
                    : running && !done && elapsed < 60
                      ? dimColor
                      : running && !done
                        ? "#ef4444"
                        : done ? mainColor : textColor,
                  border: `1px solid ${treeDead ? "rgba(239,68,68,0.25)" : running && !done && elapsed < 60 ? (isDark ? borderColor : "#d4d4d8") : running && !done ? "rgba(239,68,68,0.25)" : done ? `${mainColor}40` : isDark ? borderColor : "#d4d4d8"}`,
                  textDecoration: confirmGiveUp ? "underline" : "none",
                }}
              >
                {treeDead ? "Try Again" : done ? "Claim Reward" : confirmGiveUp ? "Are you sure?" : running && elapsed < 60 ? `Cancel (${60 - elapsed}s)` : running ? "Give Up" : "Start Session"}
              </button>

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
