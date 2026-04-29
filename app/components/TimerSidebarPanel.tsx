"use client"
import { useState, memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES } from "@/app/constants"
import { PlantIcon } from "./PlantIcon"
import { PulpIcon, GemIcon, LeafIcon } from '@/app/components/CurrencyIcons'

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
  deathReason: string | null
  onSetTotal: (v: number) => void
  onSetPreset: (v: "focus" | "short" | "long") => void
  onStart: () => void
  onGiveUp: () => void
  onCancel: () => void
  onWater: () => void
  onClaim: () => void
  onDismissDead: () => void
  lostJuice: number
  gems: number
  onRecoverJuice: () => void
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
  const plantType = type || 'tangerine'
  const typeInfo = TREE_TYPES[plantType] || TREE_TYPES.tangerine
  const color = typeInfo.color
  const shape = typeInfo.shape || 'oak'

  const stage = idle ? -1 : p < 0.1 ? 0 : p < 0.3 ? 1 : p < 0.6 ? 2 : p < 0.85 ? 3 : 4
  const plantSize = idle ? 100 : stage === 0 ? 50 : 70 + stage * 12

  return (
    <div className="relative w-full h-full">
      {/* Hill — fixed position, never moves */}
      <div className="absolute bottom-[4px] left-0 w-full z-0">
        <MossyHill isDark={isDark ?? true} overlap={0} />
      </div>

      {/* Plant — positioned from the bottom so it sits on the hill */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center" style={{ bottom: stage === 0 ? 18 : 30 }}>
        {!idle && (
          <div
            className="absolute left-1/2 -translate-x-1/2 w-20 h-3 rounded-full blur-xl"
            style={{ backgroundColor: color + '33', bottom: -4 }}
          />
        )}

        {idle ? (
          <PlantIcon type={plantType} size={plantSize} stage={4} />
        ) : stage === 0 ? (
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

      {stage >= 3 && (
        <div className="absolute inset-0 pointer-events-none z-20">
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
  waterDeadline, treeDead, deathReason, onSetTotal, onStart, onGiveUp, onCancel, onWater, onClaim, onDismissDead,
  lostJuice, gems, onRecoverJuice,
  inventory, selectedSeed, onSelectSeed,
}: TimerSidebarPanelProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [giveUpStage, setGiveUpStage] = useState(0)
  const [seedTrayOpen, setSeedTrayOpen] = useState(false)
  const [seedPage, setSeedPage] = useState(0)
  const [showGuide, setShowGuide] = useState(false)
  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    if (!running || done || treeDead) setGiveUpStage(0)
    if (running) setSeedTrayOpen(false)
    if (!running) setMinimized(false)
  }, [running, done, treeDead])

  useEffect(() => {
    if (!isOpen) setShowGuide(false)
  }, [isOpen])

  useEffect(() => {
    if (!giveUpStage) return
    const timer = setTimeout(() => setGiveUpStage(0), 10000)
    return () => clearTimeout(timer)
  }, [giveUpStage])

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

  if (isOpen && minimized && running) {
    return (
      <>
      <motion.div
        key="timer-mini"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-50 flex items-center gap-2 select-none shadow-lg"
        style={{
          left: sidebarWidth + 10,
          bottom: 12,
          backgroundColor: bgColor,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${borderColor}`,
          borderRadius: 14,
          fontFamily: serifFont,
          userSelect: 'none',
          padding: "6px 10px",
        }}
      >
        <span
          className="tabular-nums"
          style={{ fontFamily: serifFont, fontWeight: 600, fontSize: 16, color: mainColor, lineHeight: 1 }}
        >
          {String(minutes).padStart(2, "0")}
          <span style={{ opacity: 0.5 }}>:{String(seconds).padStart(2, "0")}</span>
        </span>

        {showWaterWidget && !treeDead && (
          <button
            onClick={onWater}
            title="Water"
            className="flex items-center justify-center rounded-md transition-all"
            style={{
              width: 24, height: 24,
              backgroundColor: waterUrgent ? "rgba(239,68,68,0.15)" : "rgba(96,165,250,0.12)",
              color: waterUrgent ? "#fca5a5" : "#93c5fd",
              animation: waterUrgent ? "pulp-water-pulse 1.2s ease-in-out infinite" : undefined,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2c0 0-8 7.5-8 12a8 8 0 0 0 16 0c0-4.5-8-12-8-12z" />
            </svg>
          </button>
        )}

        <button
          onClick={() => setMinimized(false)}
          className="flex items-center justify-center rounded-md transition-colors hover:bg-white/10"
          style={{ width: 24, height: 24, color: subtleColor }}
          title="Expand"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </motion.div>
      <style>{`@keyframes pulp-water-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
      </>
    )
  }

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="timer-panel"
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
          {/* Header — minimal, no title */}
          <div
            className="flex items-center justify-between px-3 py-1.5 shrink-0"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            <div className="flex items-center gap-2">
              {showWaterWidget && (
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
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {running && !done ? (
                <button
                  onClick={() => setMinimized(true)}
                  className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-white/5"
                  style={{ color: subtleColor }}
                  title="Minimize"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              ) : (
                <>
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
                  <button
                    onClick={() => setShowGuide(true)}
                    className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-white/5"
                    style={{ color: subtleColor }}
                    title="How to use"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col px-4 pt-2 pb-6 overflow-visible relative">
            {(running || done || treeDead) && (() => {
              const borderColor_ = treeDead ? '#ef4444' : done ? '#22c55e' : '#ea580c'
              const pct = (1 - progress) * 100
              return (
                <>
                  {/* Track */}
                  <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, zIndex: 1 }} />
                  {/* Progress border via conic gradient */}
                  <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
                    zIndex: 1,
                    background: `conic-gradient(from 0deg, ${borderColor_} ${pct}%, transparent ${pct}%)`,
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                    padding: '1.5px',
                    transition: 'background 1s linear',
                  }} />
                </>
              )
            })()}
            <div className="flex flex-col items-center">
              {/* Timer display */}
              <div className="text-center mb-3">
                <div
                  className="tabular-nums"
                  style={{
                    fontFamily: serifFont,
                    fontWeight: 500,
                    fontSize: 44,
                    lineHeight: 1,
                    ...(running && !done ? {
                      backgroundImage: 'linear-gradient(90deg, #EA8C55 0%, #EA8C55 38%, #f0a87a 50%, #EA8C55 62%, #EA8C55 100%)',
                      backgroundSize: '300% 100%',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'pulp-timer-shimmer 6s ease-in-out infinite',
                    } : {
                      color: done ? mainColor : textColor,
                    }),
                  }}
                >
                  {String(minutes).padStart(2, "0")}
                  <span style={{ opacity: running ? undefined : 0.55, ...(running && !done ? { WebkitTextFillColor: 'transparent' } : {}) }}>:{String(seconds).padStart(2, "0")}</span>
                </div>
                <p className="text-[9px] uppercase tracking-[0.18em] mt-2" style={{ color: treeDead ? "#ef4444" : subtleColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {treeDead ? "tree withered" : running ? "in session" : done ? "complete" : "ready"}
                </p>
                {treeDead && deathReason && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] mt-1 text-center"
                    style={{ color: '#ef4444', fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', opacity: 0.8 }}
                  >
                    {deathReason}
                  </motion.p>
                )}
              </div>

              {/* Tree view */}
              <div className="relative w-full mx-auto" style={{ height: 160 }}>
                    <div className="w-full h-full" style={{ filter: treeDead ? "grayscale(1) brightness(0.5)" : undefined, opacity: treeDead ? 0.55 : 1, transition: "filter 0.5s, opacity 0.5s" }}>
                      <TreeVisualization progress={progress} type={selectedSeed} idle={!running && !done && !treeDead} isDark={isDark} />
                    </div>
                    {/* Juice depletion animation on death */}
                    <AnimatePresence>
                      {treeDead && (
                        <motion.div
                          initial={{ opacity: 1, y: 0 }}
                          animate={{ opacity: 0, y: -30 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', fontFamily: '"EB Garamond", Georgia, serif', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                            −50% 🧃
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Seed tray overlay */}
                    <AnimatePresence>
                      {seedTrayOpen && !running && !done && !treeDead && (() => {
                        const counts = new Map<string, number>()
                        inventory.forEach(t => counts.set(t, (counts.get(t) || 0) + 1))
                        const uniqueTypes = [...counts.keys()]
                        const perPage = 15
                        const totalPages = Math.max(1, Math.ceil(uniqueTypes.length / perPage))
                        const page = Math.min(seedPage, totalPages - 1)
                        const pageSeeds = uniqueTypes.slice(page * perPage, (page + 1) * perPage)

                        return (
                          <motion.div
                            key="seed-tray"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 z-30 flex flex-col rounded-lg"
                            style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.88)' : 'rgba(10,10,12,0.88)', backdropFilter: 'blur(8px)' }}
                            onKeyDown={e => {
                              if (e.key === 'ArrowRight' && page < totalPages - 1) { e.preventDefault(); setSeedPage(page + 1) }
                              if (e.key === 'ArrowLeft' && page > 0) { e.preventDefault(); setSeedPage(page - 1) }
                              if (e.key === 'Escape') { e.preventDefault(); setSeedTrayOpen(false) }
                            }}
                            tabIndex={0}
                            ref={el => el?.focus()}
                          >
                            <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: dimColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                                Seeds
                              </span>
                              <button
                                onClick={() => setSeedTrayOpen(false)}
                                className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                                style={{ color: subtleColor }}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                              </button>
                            </div>

                            <div className="flex-1 flex items-center px-3">
                              <div className="grid grid-cols-4 gap-2 w-full">
                                {pageSeeds.map((type) => {
                                  const info = TREE_TYPES[type]
                                  if (!info) return null
                                  const isSelected = selectedSeed === type
                                  const count = counts.get(type) || 1
                                  const rarityColor = info.rarity === 'common' ? '#a1a1aa' : info.rarity === 'uncommon' ? '#34d399' : info.rarity === 'rare' ? '#60a5fa' : info.rarity === 'legendary' ? '#f59e0b' : '#a1a1aa'
                                  return (
                                    <motion.button
                                      key={type}
                                      whileHover={{ scale: 1.08 }}
                                      whileTap={{ scale: 0.92 }}
                                      onClick={() => { onSelectSeed(isSelected ? null : type); setSeedTrayOpen(false) }}
                                      title={`${info.name} (×${count})`}
                                      className="relative flex items-center justify-center mx-auto"
                                      style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        backgroundColor: isDark ? 'rgba(39,39,42,0.5)' : 'rgba(255,255,255,0.9)',
                                        border: `1.5px solid ${isSelected ? info.color : isDark ? 'rgba(63,63,70,0.6)' : 'rgba(228,228,231,0.8)'}`,
                                        boxShadow: isSelected ? `0 0 0 2px ${info.color}40, 0 0 12px ${info.color}20` : `0 0 0 2px ${rarityColor}15`,
                                        cursor: 'pointer',
                                        transition: 'border-color 0.15s, box-shadow 0.15s',
                                      }}
                                    >
                                      <PlantIcon type={type} size={28} isSeed />
                                      {count > 1 && (
                                        <span className="absolute -bottom-1 -right-1 text-[7px] font-bold rounded-full min-w-[13px] h-[13px] flex items-center justify-center" style={{ backgroundColor: isDark ? '#27272a' : '#e4e4e7', color: isDark ? '#a1a1aa' : '#52525b', border: `1px solid ${isDark ? 'rgba(63,63,70,0.6)' : 'rgba(228,228,231,0.8)'}` }}>
                                          {count}
                                        </span>
                                      )}
                                      {isSelected && (
                                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px]" style={{ backgroundColor: info.color, borderColor: isDark ? '#18181b' : '#fafafa', boxShadow: `0 0 6px ${info.color}` }} />
                                      )}
                                    </motion.button>
                                  )
                                })}
                              </div>
                            </div>

                            {totalPages > 1 && (
                              <div className="flex items-center justify-center gap-3 px-3 pb-2">
                                <button onClick={() => setSeedPage(Math.max(0, page - 1))} disabled={page === 0} className="w-5 h-5 flex items-center justify-center rounded transition-colors disabled:opacity-20" style={{ color: dimColor }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                                </button>
                                <div className="flex gap-1">
                                  {Array.from({ length: totalPages }).map((_, i) => (
                                    <div key={i} className="w-1 h-1 rounded-full transition-colors" style={{ backgroundColor: i === page ? mainColor : 'rgba(255,255,255,0.15)' }} />
                                  ))}
                                </div>
                                <button onClick={() => setSeedPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} className="w-5 h-5 flex items-center justify-center rounded transition-colors disabled:opacity-20" style={{ color: dimColor }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )
                      })()}
                    </AnimatePresence>
                  </div>

              {/* Change Plant and Notebook Selector */}
              {!running && !done && !treeDead && !seedTrayOpen && (
                <div className="flex flex-col items-center gap-3 mt-3 relative z-20">
                  {inventory.length > 0 && (
                    <button
                      onClick={() => { setSeedPage(0); setSeedTrayOpen(true) }}
                      className="text-[10px] font-semibold uppercase tracking-[0.1em] transition-all underline decoration-current/40 hover:decoration-current"
                      style={{ color: mainColor, fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      Change Plant
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* Bottom controls — pushed down */}
            <div className="flex flex-col items-center mt-auto">
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
              <style>{`@keyframes pulp-water-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes pulp-timer-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

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
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[15, 45, 90].map(m => (
                      <button
                        key={m}
                        onClick={() => onSetTotal(m * 60)}
                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all"
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          color: Math.floor(total / 60) === m ? textColor : subtleColor,
                          backgroundColor: Math.floor(total / 60) === m ? `${mainColor}20` : 'transparent',
                          border: `1px solid ${Math.floor(total / 60) === m ? `${mainColor}40` : 'transparent'}`,
                        }}
                      >
                        {m}m
                      </button>
                    ))}
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

                  <p className="text-center mt-2 text-[11px]" style={{ color: mainColor, fontFamily: serifFont, fontWeight: 600 }}>
                    +{Math.max(1, Math.round(total / 300))} <PulpIcon size={11} />
                  </p>
                </div>
              )}
            </div>

            {/* Main button */}
            <div className="pt-4">
              <button
                onClick={() => {
                  if (running && !done && !treeDead) {
                    if (elapsed < 60) { onCancel(); return }
                    if (giveUpStage === 2) { onGiveUp(); setGiveUpStage(0) }
                    else setGiveUpStage(s => s + 1)
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
                  textDecoration: giveUpStage === 2 ? "underline" : "none",
                }}
              >
                {treeDead ? "Try Again" : done ? "Claim Reward" : giveUpStage === 2 ? "Are you sure?" : giveUpStage === 1 ? <span className="inline-flex items-center gap-1">You will lose 50% of <PulpIcon size={11} /></span> : running && elapsed < 60 ? `Cancel (${60 - elapsed}s)` : running ? "Give Up" : "Start Session"}
              </button>

              {lostJuice > 0 && !running && !done && (
                <div
                  className="w-full rounded-[6px] px-3 py-2.5 mt-2 flex flex-col items-center gap-1.5"
                  style={{
                    backgroundColor: isDark ? "rgba(251,191,36,0.06)" : "rgba(251,191,36,0.08)",
                    border: `1px solid ${isDark ? "rgba(251,191,36,0.15)" : "rgba(251,191,36,0.25)"}`,
                    fontFamily: serifFont,
                  }}
                >
                  <span className="text-[10px] tracking-[0.04em]" style={{ color: isDark ? "#fbbf24" : "#b45309" }}>
                    You lost {lostJuice} <PulpIcon size={10} />
                  </span>
                  <button
                    onClick={onRecoverJuice}
                    disabled={gems < Math.max(5, Math.ceil(lostJuice * 0.5))}
                    className="text-[9px] font-black uppercase tracking-[0.15em] hover:underline disabled:opacity-30 disabled:no-underline"
                    style={{ color: "#a78bfa" }}
                  >
                    Recover for {Math.max(5, Math.ceil(lostJuice * 0.5))} <GemIcon size={9} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

    </AnimatePresence>

    <AnimatePresence>
      {showGuide && (
        <motion.div
          key="timer-guide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowGuide(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="w-[340px] max-h-[80vh] overflow-y-auto rounded-2xl border shadow-2xl"
            style={{
              background: isDark ? '#141416' : '#fafaf8',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            }}
          >
            <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <h2 className="text-[15px] font-bold" style={{ fontFamily: serifFont, color: isDark ? '#e4e4e7' : '#18181b' }}>
                How the Timer Works
              </h2>
              <button
                onClick={() => setShowGuide(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                style={{ color: subtleColor }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {[
                {
                  icon: '🌱',
                  title: 'Pick a Seed',
                  body: 'Before starting, choose a seed from your inventory. Each seed grows into a unique plant as you focus. Rarer seeds produce rarer plants.',
                },
                {
                  icon: '⏱️',
                  title: 'Set Your Timer',
                  body: 'Choose Focus (25 min), Short Break (5 min), or Long Break (15 min). You can also adjust the time with the + and − buttons.',
                },
                {
                  icon: '🌳',
                  title: 'Watch It Grow',
                  body: 'Your plant grows through 4 stages as the timer progresses. Stay focused — if you leave or give up, the plant dies!',
                },
                {
                  icon: '💧',
                  title: 'Water Your Plant',
                  body: 'A water prompt will appear during longer sessions. Tap it before the countdown expires or your plant will wilt. This keeps you engaged.',
                },
                {
                  icon: <PulpIcon size={18} />,
                  title: 'Earn Sap & XP',
                  body: 'Completing a session earns you sap and XP. Sap is used to buy new seeds in the shop. XP levels up your gardener rank.',
                },
                {
                  icon: <LeafIcon size={18} />,
                  title: 'Your Orchard',
                  body: 'Every plant you grow is added to your orchard — a visual garden of all your focus sessions. Mature plants can be harvested for bonus sap.',
                },
                {
                  icon: <GemIcon size={18} />,
                  title: 'Gems & Recovery',
                  body: 'If a plant dies, you can spend gems to recover lost sap. Gems are also used to remove sites from your focus blocker.',
                },
                {
                  icon: '🚫',
                  title: 'Focus Blocker',
                  body: 'Block distracting websites while the timer runs. The Chrome extension enforces blocks automatically. Removing a site costs 50 gems.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-[18px] shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <h3 className="text-[12px] font-bold" style={{ fontFamily: serifFont, color: isDark ? '#d4d4d8' : '#27272a' }}>
                      {item.title}
                    </h3>
                    <p className="text-[11px] leading-relaxed mt-0.5" style={{ fontFamily: serifFont, color: isDark ? '#71717a' : '#a1a1aa' }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: mainColor, fontFamily: serifFont }}
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
})
