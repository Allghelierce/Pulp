"use client"
import { useState, memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES } from "@/app/constants"
import type { Tree } from "@/app/types"
import { PlantIcon } from "./PlantIcon"
import { PulpIcon, LeafIcon } from '@/app/components/CurrencyIcons'
import { MiniRings } from './StatsView'

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
  inventory: string[]
  selectedSeed: string | null
  onSelectSeed: (seed: string | null) => void
  onOpenSatchel?: () => void
  onOpenStats?: () => void
  grove?: Tree[]
  goalStreak?: number
  quotaTier?: 'monthly' | 'weekly' | 'daily'
  dailyGoalMinutes?: number
  isHibernating?: boolean
  hidden?: boolean
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

function TreeVisualization({ progress, type, idle, isDark, priorRatio = 0 }: { progress: number; type: string | null; idle?: boolean; isDark?: boolean; priorRatio?: number }) {
  const p = Math.max(0, Math.min(1, progress))
  const plantType = type || 'tangerine'
  const typeInfo = TREE_TYPES[plantType] || TREE_TYPES.tangerine
  const color = typeInfo.color
  const shape = typeInfo.shape || 'oak'

  const idleStage = priorRatio >= 0.85 ? 3 : priorRatio >= 0.6 ? 2 : priorRatio >= 0.3 ? 1 : priorRatio >= 0.1 ? 0 : -1
  const stage = idle ? idleStage : p < 0.1 ? 0 : p < 0.3 ? 1 : p < 0.6 ? 2 : p < 0.85 ? 3 : 4
  const plantSize = (idle && idleStage === -1) ? 60 : stage === 0 ? 50 : 70 + Math.max(0, stage) * 12

  return (
    <div className="relative w-full h-full">
      {/* Hill — fixed position, never moves */}
      <div className="absolute bottom-[4px] left-0 w-full z-0">
        <MossyHill isDark={isDark ?? true} overlap={0} />
      </div>

      {/* Plant — positioned from the bottom so it sits on the hill */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center" style={{ bottom: (stage <= 0) ? 18 : 30 }}>
        {!idle && (
          <div
            className="absolute left-1/2 -translate-x-1/2 w-20 h-3 rounded-full blur-xl"
            style={{ backgroundColor: color + '33', bottom: -4 }}
          />
        )}

        {idle && idleStage === -1 ? (
          <PlantIcon type={plantType} size={plantSize} isSeed={true} />
        ) : idle ? (
          <PlantIcon type={plantType} size={plantSize} stage={idleStage} />
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
  inventory, selectedSeed, onSelectSeed, onOpenSatchel,
  grove = [], goalStreak = 0, quotaTier = 'monthly', dailyGoalMinutes = 30, isHibernating = false, hidden = false, onOpenStats,
}: TimerSidebarPanelProps) {
  const [now, setNow] = useState(() => Date.now())
  const [giveUpStage, setGiveUpStage] = useState(0)
  const [seedTrayOpen, setSeedTrayOpen] = useState(false)
  const [seedPage, setSeedPage] = useState(0)
  const [showGuide, setShowGuide] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [justWatered, setJustWatered] = useState(false)

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

  const treeType = selectedSeed || 'tangerine'
  const treeInfo = TREE_TYPES[treeType]
  const growthTarget = treeInfo?.growthMinutes || 25
  const existingPartial = grove.find(t => t.type === treeType && t.growthTarget && (t.focusMinutes || 0) < t.growthTarget)
  const priorMinutes = existingPartial?.focusMinutes || 0
  const sessionMinutes = total > 0 ? elapsed / 60 : 0
  const cumulativeMinutes = priorMinutes + sessionMinutes
  const cumulativeRatio = Math.min(1, cumulativeMinutes / growthTarget)
  const priorRatio = priorMinutes / growthTarget

  const remainingTime = Math.max(0, total - elapsed)
  const minutes = Math.floor(remainingTime / 60)
  const seconds = remainingTime % 60
  const progress = total > 0 ? elapsed / total : 0

  const mainColor = "#d97706"
  const isDark = theme === "dark"
  const bgColor = isDark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.75)"
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"
  const textColor = isDark ? "#e4e4e7" : "#27272a"
  const dimColor = isDark ? "#a1a1aa" : "#71717a"
  const subtleColor = isDark ? "#71717a" : "#a1a1aa"
  const serifFont = 'Crimson Pro, serif'
  const monoFont = '"SF Mono", "Fira Code", "JetBrains Mono", ui-monospace, monospace'

  const handleMainButton = () => {
    if (treeDead) onDismissDead()
    else if (done) onClaim()
    else if (running) setGiveUpStage(1)
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
      const mins = Math.max(5, Math.min(180, Math.round((percent * 175 + 5) / 5) * 5))
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
        className="fixed z-40 flex items-center gap-2 select-none shadow-lg"
        style={{
          left: sidebarWidth > 40 ? sidebarWidth + 10 : 78,
          bottom: 12,
          transition: "left 160ms cubic-bezier(0.25, 1, 0.5, 1)",
          display: hidden ? 'none' : undefined,
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
          style={{ fontFamily: serifFont, fontWeight: 400, fontSize: 16, color: mainColor, lineHeight: 1 }}
        >
          {String(minutes).padStart(2, "0")}
          <span style={{ opacity: 0.5 }}>:{String(seconds).padStart(2, "0")}</span>
        </span>

        {showWaterWidget && !treeDead && (
          <button
            onClick={onWater}
            title="Water"
            className="flex items-center gap-1.5 rounded-lg transition-all"
            style={{
              height: 24,
              padding: "0 6px",
              backgroundColor: waterUrgent ? "rgba(239,68,68,0.15)" : "rgba(217,119,6,0.08)",
              color: waterUrgent ? "#fca5a5" : "#d4a574",
              animation: waterUrgent ? "pulp-water-pulse 1.2s ease-in-out infinite" : undefined,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2c0 0-8 7.5-8 12a8 8 0 0 0 16 0c0-4.5-8-12-8-12z" />
            </svg>
            <span className="tabular-nums" style={{ fontSize: 10, fontWeight: 400, letterSpacing: '0.02em' }}>
              {String(waterMin).padStart(1, "0")}:{String(waterSec).padStart(2, "0")}
            </span>
          </button>
        )}

        <button
          onClick={() => setMinimized(false)}
          className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
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
          className="fixed z-40 flex flex-col select-none shadow-2xl"
          style={{
            left: sidebarWidth > 40 ? sidebarWidth + 10 : 78,
            bottom: 12,
            transition: "left 160ms cubic-bezier(0.25, 1, 0.5, 1)",
            display: hidden ? 'none' : undefined,
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
                        stroke={waterUrgent ? "#ef4444" : "#d4a574"}
                        strokeWidth="3" strokeLinecap="round"
                        pathLength="1"
                        strokeDasharray="1"
                        strokeDashoffset={1 - Math.min(1, waterMsLeft / (Math.floor(total / 3) * 1000 + 90_000))}
                      />
                    </svg>
                  </div>
                  <span className="text-[9px] font-normal tabular-nums tracking-[0.05em]" style={{ color: waterUrgent ? "#ef4444" : "#d4a574" }}>
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
                  {(elapsed > 0 || done) && (
                    <button
                      onClick={() => setMinimized(true)}
                      className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-white/5"
                      style={{ color: subtleColor }}
                      title="Minimize"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 15l6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col px-4 pt-2 pb-6 overflow-visible relative">
            <AnimatePresence mode="wait">
            {seedTrayOpen && !running && !done && !treeDead ? (() => {
              const counts = new Map<string, number>()
              inventory.forEach(t => counts.set(t, (counts.get(t) || 0) + 1))
              const uniqueTypes = [...counts.keys()]
              const perPage = 16
              const totalPages = Math.max(1, Math.ceil(uniqueTypes.length / perPage))
              const page = Math.min(seedPage, totalPages - 1)
              const pageSeeds = uniqueTypes.slice(page * perPage, (page + 1) * perPage)

              return (
                <motion.div
                  key="seed-picker"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 flex flex-col"
                  onKeyDown={e => {
                    if (e.key === 'ArrowRight' && page < totalPages - 1) { e.preventDefault(); setSeedPage(page + 1) }
                    if (e.key === 'ArrowLeft' && page > 0) { e.preventDefault(); setSeedPage(page - 1) }
                    if (e.key === 'Escape') { e.preventDefault(); setSeedTrayOpen(false) }
                  }}
                  tabIndex={0}
                  ref={el => el?.focus()}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: dimColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                      Choose a plant
                    </span>
                    <button
                      onClick={() => setSeedTrayOpen(false)}
                      className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                      style={{ color: subtleColor }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    <div className="grid grid-cols-4 gap-1.5">
                      {pageSeeds.map((type) => {
                        const info = TREE_TYPES[type]
                        if (!info) return null
                        const isSelected = selectedSeed === type
                        const count = counts.get(type) || 1
                        const rarityColor = info.rarity === 'common' ? '#a1a1aa' : info.rarity === 'uncommon' ? '#34d399' : info.rarity === 'rare' ? '#60a5fa' : info.rarity === 'true rare' ? '#4d8cff' : info.rarity === 'sacred' ? '#c4a6ff' : '#a1a1aa'
                        return (
                          <motion.button
                            key={type}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => { onSelectSeed(isSelected ? null : type); setSeedTrayOpen(false) }}
                            className="relative flex flex-col items-center justify-end rounded-lg p-1.5 pt-2 transition-all"
                            style={{
                              aspectRatio: '1',
                              backgroundColor: isSelected
                                ? (isDark ? `${info.color}18` : `${info.color}12`)
                                : (isDark ? 'rgba(39,39,42,0.4)' : 'rgba(255,255,255,0.8)'),
                              border: `1.5px solid ${isSelected ? info.color : isDark ? 'rgba(63,63,70,0.5)' : 'rgba(228,228,231,0.7)'}`,
                              boxShadow: isSelected ? `0 0 0 2px ${info.color}30, 0 0 12px ${info.color}15` : 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <div className="flex-1 flex items-center justify-center">
                              <PlantIcon type={type} size={38} stage={3} />
                            </div>
                            {count > 1 && (
                              <span className="absolute bottom-1 right-1 text-[7px] font-normal rounded-full min-w-[14px] h-[14px] flex items-center justify-center" style={{ backgroundColor: isDark ? '#27272a' : '#e4e4e7', color: isDark ? '#a1a1aa' : '#52525b', border: `1px solid ${isDark ? 'rgba(63,63,70,0.5)' : 'rgba(228,228,231,0.7)'}` }}>
                                {count}
                              </span>
                            )}
                            {isSelected && (
                              <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full border-[1.5px]" style={{ backgroundColor: info.color, borderColor: isDark ? '#18181b' : '#fafafa', boxShadow: `0 0 6px ${info.color}` }} />
                            )}
                            <div className="absolute top-1 right-1 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: rarityColor }} />
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-3">
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
            })() : (
            <motion.div key="timer-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col items-center">
              {/* Timer display */}
              <div className="text-center mb-3">
                <div
                  className="tabular-nums"
                  style={{
                    fontFamily: serifFont,
                    fontWeight: 400,
                    fontSize: 44,
                    lineHeight: 1,
                    ...(running && !done ? {
                      backgroundImage: 'linear-gradient(90deg, #d97706 0%, #d97706 30%, #e8a33a 45%, #f0c060 50%, #e8a33a 55%, #d97706 70%, #d97706 100%)',
                      backgroundSize: '400% 100%',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'pulp-timer-shimmer 16s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                    } : {
                      color: done ? mainColor : textColor,
                    }),
                  }}
                >
                  {String(minutes).padStart(2, "0")}
                  <span style={{ color: subtleColor, WebkitTextFillColor: subtleColor, backgroundImage: 'none' }}>:{String(seconds).padStart(2, "0")}</span>
                </div>
                <p className="text-[11px] uppercase tracking-[0.18em] mt-4" style={{ color: treeDead ? "#ef4444" : subtleColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {treeDead ? "tree withered" : done
                  ? <span style={{ fontFamily: serifFont, letterSpacing: '0.02em', textTransform: 'none', fontSize: 12, color: mainColor }}>complete</span>
                  : running
                  ? <span style={{ fontFamily: serifFont, letterSpacing: '0.02em', textTransform: 'none', fontSize: 11, color: subtleColor }}>
                      {Math.floor(cumulativeMinutes)}/{growthTarget} min
                    </span>
                  : priorMinutes > 0
                  ? <span style={{ fontFamily: serifFont, letterSpacing: '0.02em', textTransform: 'none', fontSize: 11, color: subtleColor }}>
                      {Math.floor(priorMinutes)}/{growthTarget} min
                    </span>
                  : <span style={{ fontFamily: serifFont, letterSpacing: '0.02em', textTransform: 'none', fontSize: 11, color: subtleColor }}>lock in</span>}
                </p>
                <div className="mt-3 flex justify-center">
                  <MiniRings isDark={isDark} onClick={onOpenStats} quotaTier={quotaTier} goalStreak={goalStreak} dailyGoalMinutes={dailyGoalMinutes} />
                </div>
              </div>

              {/* Tree view */}
              <div className="relative w-full mx-auto" style={{ height: 160, marginTop: running ? 24 : 8 }}>
                    <div className="w-full h-full" style={{ filter: treeDead ? "grayscale(1) brightness(0.5)" : undefined, opacity: treeDead ? 0.55 : 1, transition: "filter 0.5s, opacity 0.5s" }}>
                      <TreeVisualization progress={cumulativeRatio} type={selectedSeed} idle={!running && !done && !treeDead} isDark={isDark} priorRatio={priorRatio} />
                    </div>
                  </div>

              {/* Growth timeline */}
              {(running || done) && !treeDead && (
                <div className="relative mx-auto" style={{ width: '70%', height: 12, marginTop: 4 }}>
                  <div style={{ position: 'absolute', top: 5, left: 0, right: 0, height: 2, borderRadius: 1, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  {priorRatio > 0 && (
                    <div style={{ position: 'absolute', top: 5, left: 0, width: `${Math.min(100, priorRatio * 100)}%`, height: 2, borderRadius: 1, background: isDark ? 'rgba(217,119,6,0.3)' : 'rgba(217,119,6,0.25)' }} />
                  )}
                  <div style={{ position: 'absolute', top: 5, left: 0, width: `${Math.min(100, cumulativeRatio * 100)}%`, height: 2, borderRadius: 1, background: mainColor, transition: 'width 0.5s ease' }} />
                  {[0.1, 0.3, 0.6, 0.85].map(t => (
                    <div key={t} style={{ position: 'absolute', left: `${t * 100}%`, top: 4, width: 4, height: 4, borderRadius: '50%', transform: 'translateX(-2px)', background: cumulativeRatio >= t ? mainColor : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'), transition: 'background 0.3s', boxShadow: `0 0 0 1.5px ${isDark ? '#18181b' : '#fdfcf9'}` }} />
                  ))}
                </div>
              )}

              {/* Satchel (change plant) */}
              {!running && !done && !treeDead && inventory.length > 0 && (
                <div className="flex justify-center mt-3 relative z-20">
                  <button
                    onClick={() => { setSeedPage(0); setSeedTrayOpen(true) }}
                    className="transition-all hover:opacity-90 active:scale-95"
                    style={{ color: mainColor, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Crimson Pro, serif', fontSize: 12, fontWeight: 400, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    title={`Satchel (${inventory.length} seeds)`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2h8l2 4H6l2-4z"/><path d="M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6"/><path d="M9 6v2a3 3 0 006 0V6"/></svg>
                    Change Plant
                  </button>
                </div>
              )}

              {/* Death reason */}
              {treeDead && deathReason && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-center"
                >
                  <svg width="28" height="28" viewBox="0 0 28 28">
                    <circle cx="14" cy="14" r="13" fill="#ef4444" opacity={0.15} stroke="#ef4444" strokeWidth="1.5" />
                    <line x1="7" y1="9" x2="11" y2="13" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="11" y1="9" x2="7" y2="13" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="17" y1="9" x2="21" y2="13" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="21" y1="9" x2="17" y2="13" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M10 19 Q14 16 18 19" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="14" y1="19" x2="14" y2="23" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-[12px] mt-1" style={{ color: subtleColor, fontFamily: 'Crimson Pro, serif' }}>
                    {deathReason}
                  </p>
                </motion.div>
              )}



            </motion.div>
            )}
            </AnimatePresence>

            {/* Bottom controls — pushed down */}
            <div className="flex flex-col items-center mt-auto">
              {/* Watering can */}
              {showWaterWidget && !treeDead && (
                <button
                  onClick={onWater}
                  title="Water the tree"
                  className="mb-3 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: waterUrgent ? "rgba(239,68,68,0.12)" : "rgba(217,119,6,0.08)",
                    border: `1px solid ${waterUrgent ? "rgba(239,68,68,0.35)" : "rgba(217,119,6,0.2)"}`,
                    color: waterUrgent ? "#fca5a5" : "#d4a574",
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
                  <span className="text-[11px] font-normal">Water</span>
                </button>
              )}
              <style>{`@keyframes pulp-water-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes pulp-timer-shimmer { 0% { background-position: 100% 0; } 50% { background-position: 0% 0; } 100% { background-position: 100% 0; } }`}</style>

              {/* Duration slider (hidden while running) */}
              {!running && (
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {[15, 45, 90].map(m => (
                      <button
                        key={m}
                        onClick={() => onSetTotal(m * 60)}
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-normal transition-all"
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
                    className="relative h-1 rounded-full cursor-grab active:cursor-grabbing mb-1"
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
                    <span className="tabular-nums" style={{ color: textColor, fontWeight: 400 }}>
                      {Math.floor(total / 60)} min
                    </span>
                    <span>180m</span>
                  </div>
                </div>
              )}
            </div>

            {/* Streak + multiplier (hover for breakdown) */}
            {!running && !done && !treeDead && (() => {
              const hour = new Date().getHours()
              const isEarlyBird = hour >= 6 && (hour < 10 || (hour === 10 && new Date().getMinutes() <= 30))
              const quotaBonus = quotaTier === 'daily' ? 2 : quotaTier === 'weekly' ? 1 : 0
              const cappedMult = Math.min(4, 1 + (isEarlyBird ? 1 : 0) + quotaBonus)
              return (
                <div className="relative flex items-center justify-center group" style={{ marginBottom: 4 }}>
                  <div className="flex items-center gap-2 cursor-default" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {goalStreak > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 500, color: goalStreak >= 7 ? '#d97706' : subtleColor }}>
                        {goalStreak}d streak
                      </span>
                    )}
                    {cappedMult > 1 && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, letterSpacing: '-0.02em',
                        color: cappedMult >= 3 ? '#f87171' : cappedMult >= 2 ? '#4ade80' : '#fbbf24',
                      }}>
                        {cappedMult.toFixed(1)}x
                      </span>
                    )}
                    {cappedMult <= 1 && goalStreak === 0 && (
                      <span style={{ fontSize: 10, color: subtleColor }}>1.0x base</span>
                    )}
                  </div>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50"
                    style={{
                      background: isDark ? '#1c1a17' : '#fff',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                      borderRadius: 6, padding: '6px 10px', minWidth: 120,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}>
                    <div style={{ fontSize: 9, fontWeight: 500, color: subtleColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Multiplier</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
                        <span style={{ color: isDark ? '#a1a1aa' : '#71717a' }}>base</span>
                        <span style={{ color: isDark ? '#d4d4d8' : '#3f3f46', fontWeight: 500 }}>1.0x</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
                        <span style={{ color: isEarlyBird ? '#fbbf24' : (isDark ? '#52524e' : '#c4c4c0') }}>early bird</span>
                        <span style={{ color: isEarlyBird ? '#fbbf24' : (isDark ? '#52524e' : '#c4c4c0'), fontWeight: 500 }}>{isEarlyBird ? '+1.0x' : '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
                        <span style={{ color: quotaBonus > 0 ? (quotaTier === 'daily' ? '#f87171' : '#4ade80') : (isDark ? '#52524e' : '#c4c4c0') }}>{quotaTier} quota</span>
                        <span style={{ color: quotaBonus > 0 ? (quotaTier === 'daily' ? '#f87171' : '#4ade80') : (isDark ? '#52524e' : '#c4c4c0'), fontWeight: 500 }}>{quotaBonus > 0 ? `+${quotaBonus}.0x` : '—'}</span>
                      </div>
                      <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, marginTop: 2, paddingTop: 3, display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
                        <span style={{ color: isDark ? '#d4d4d8' : '#3f3f46', fontWeight: 600 }}>total</span>
                        <span style={{ color: cappedMult >= 3 ? '#f87171' : cappedMult >= 2 ? '#4ade80' : '#fbbf24', fontWeight: 700 }}>{cappedMult.toFixed(1)}x</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Main button */}
            <div className="pt-5">
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
                className="w-full py-2 rounded-[6px] transition-all text-[11px] font-normal"
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
                          : isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.1)",
                  color: treeDead ? "#ef4444"
                    : running && !done && elapsed < 60
                      ? dimColor
                      : running && !done
                        ? "#ef4444"
                        : done ? mainColor : isDark ? "#4ade80" : "#16a34a",
                  border: `1px solid ${treeDead ? "rgba(239,68,68,0.25)" : running && !done && elapsed < 60 ? borderColor : running && !done ? "rgba(239,68,68,0.25)" : done ? `${mainColor}40` : isDark ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.2)"}`,
                  textDecoration: giveUpStage === 2 ? "underline" : "none",
                }}
              >
                {treeDead ? "Try Again" : done ? "Claim Reward" : giveUpStage === 2 ? "Are you sure?" : giveUpStage === 1 ? <span className="inline-flex items-center gap-1" style={{ fontWeight: 400 }}>You will lose your seed</span> : running && elapsed < 60 ? `Cancel (${60 - elapsed}s)` : running ? "Give Up" : "Start Session"}
              </button>
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
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowGuide(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.12 }}
            onClick={e => e.stopPropagation()}
            className="w-full overflow-hidden"
            style={{
              maxWidth: 300,
              borderRadius: 12,
              background: isDark ? '#09090b' : '#fafaf8',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6)',
            }}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <h2 style={{ fontSize: 14, fontWeight: 400, fontFamily: serifFont, color: isDark ? '#e4e0d8' : '#18181b', margin: 0 }}>
                Timer Guide
              </h2>
              <button
                onClick={() => setShowGuide(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full"
                style={{ color: subtleColor }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {[
                { icon: '🌱', text: 'Focus to grow your tree. Rarer trees take multiple sessions.' },
                { icon: '💧', text: 'Sessions 10min+ need watering every 15 min.' },
                { icon: '💀', text: 'Quit or miss water → tree gone for good.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-0.5" style={{ fontSize: 14 }}>{item.icon}</span>
                  <p style={{ fontSize: 12, color: isDark ? '#a1a09c' : '#52524e', fontFamily: serifFont, lineHeight: 1.4, margin: 0 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 pb-4">
              <button
                onClick={() => setShowGuide(false)}
                style={{
                  width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 400,
                  fontFamily: serifFont, color: '#fff', background: mainColor, border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
})
