"use client"
import { useState, memo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TREE_TYPES } from "@/app/constants"
import type { Tree } from "@/app/types"
import { PlantIcon } from "./PlantIcon"
import { PulpIcon, LeafIcon } from '@/app/components/CurrencyIcons'
import { MiniRings } from './StatsView'
import { isFullyGrown, isTopicTree } from "@/lib/topics"
import { StageBurst, useStageTransition, stageEntrance, stageExit, type VisualStage } from "./StageGrowth"

// Growth stages along the focus bar (ratio of the tree's grow time). Matches timerStage in lib/topics.
const FOCUS_STAGES = [
  { name: 'Seed', at: 0 }, { name: 'Sprout', at: 0.4 }, { name: 'Sapling', at: 1 },
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
  /** Watering is overdue: the tree droops and the session is paused until watered. */
  wilting?: boolean
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
  onStartReview?: () => void
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
  // Running: the timer grows seed -> sprout -> sapling over the full grow time (recall does the rest).
  const stage = idle ? idleStage : p < 0.15 ? 0 : p < 0.4 ? 1 : p < 1 ? 2 : 3
  const plantSize = (idle && idleStage === -1) ? 60 : stage === 0 ? 50 : 70 + Math.max(0, stage) * 12

  // Each stage change replays the plant's entrance and fires a themed burst.
  // Idle shows PlantIcon stage idleStage, running shows stage - 1, so align them.
  const visual = (idle ? idleStage + 1 : stage) as VisualStage
  const burst = useStageTransition(visual, !idle)
  const entrance = stageEntrance(visual)
  const animateEntrance = !idle && burst !== null

  const plant = idle && idleStage === -1 ? (
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
  )

  return (
    <div className="relative w-full h-full">
      {/* Hill — fixed position, never moves; nudges when the plant grows */}
      <motion.div
        key={burst ? `hill-${burst.seed}` : 'hill'}
        className="absolute bottom-[4px] left-0 w-full z-0"
        initial={false}
        animate={burst ? { y: [0, 2, -1, 0] } : { y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <MossyHill isDark={isDark ?? true} overlap={0} />
      </motion.div>

      {/* Plant — positioned from the bottom so it sits on the hill */}
      <div className="absolute left-1/2 z-10" style={{ bottom: (stage <= 0) ? 18 : 30, width: 0, height: 0 }}>
        {!idle && (
          <div
            className="absolute w-20 h-3 rounded-full blur-xl"
            style={{ backgroundColor: color + '33', bottom: -4, left: -40 }}
          />
        )}
        <AnimatePresence initial={false}>
          <motion.div
            key={`${plantType}-${visual}`}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: 0, x: "-50%", transformOrigin: "50% 100%" }}
            initial={animateEntrance ? entrance.initial : false}
            animate={animateEntrance ? entrance.animate : { opacity: 1 }}
            transition={animateEntrance ? entrance.transition : undefined}
            exit={stageExit}
          >
            {plant}
          </motion.div>
        </AnimatePresence>
      </div>

      {burst && <StageBurst key={burst.seed} type={plantType} from={burst.from} to={burst.to} seed={burst.seed} />}

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
                duration: shape === 'ethereal' ? 3 : 2 + (i % 3) * 0.4,
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

// Watering can whose water level drops as the next watering becomes due.
function WateringCan({ frac, urgent, stroke }: { frac: number; urgent: boolean; stroke: string }) {
  const f = Math.max(0, Math.min(1, frac))
  // Body interior runs from y≈19 (under the rim) to y≈35 (bottom).
  const topY = 19, botY = 35
  const fillY = botY - f * (botY - topY)
  const waterTop = urgent ? "#fca5a5" : "#7dd3fc"
  const waterBot = urgent ? "#ef4444" : "#0ea5e9"
  // Slightly tapered tub with rounded bottom corners.
  const body = "M17 18 H31 Q32.4 18 32.2 19.4 L30.7 33 Q30.4 35.5 27.9 35.5 H20.1 Q17.6 35.5 17.3 33 L15.8 19.4 Q15.6 18 17 18 Z"
  return (
    <svg width="42" height="40" viewBox="0 0 44 42" fill="none">
      <defs>
        <linearGradient id="pulp-water-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={waterTop} />
          <stop offset="1" stopColor={waterBot} />
        </linearGradient>
        <clipPath id="pulp-can-clip"><path d={body} /></clipPath>
      </defs>
      {/* water fill */}
      <g clipPath="url(#pulp-can-clip)">
        <rect x="14" width="20" y={fillY} height="42" fill="url(#pulp-water-grad)" style={{ transition: "y 600ms cubic-bezier(0.4,0,0.2,1)" }} />
      </g>
      {/* tub */}
      <path d={body} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      {/* rim */}
      <path d="M16.5 18 Q24 15.6 31.5 18" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      {/* arched handle */}
      <path d="M20 17 Q24 9 28 17" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      {/* spout (tapered tube) */}
      <path d="M16.5 22.5 L7 13.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.5 26 L5 17" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      {/* sprinkler rose */}
      <path d="M5 17 L7 13.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 18.5 L8.5 12.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export const TimerSidebarPanel = memo(function TimerSidebarPanel({
  isOpen, onClose, elapsed, total, running, done, theme, sidebarWidth,
  waterDeadline, wilting = false, treeDead, deathReason, onSetTotal, onStart, onGiveUp, onCancel, onWater, onClaim, onDismissDead,
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
  // Focus mode: hovering the timer reveals Cancel / Give Up.
  const [timerHover, setTimerHover] = useState(false)
  // Left edge of the centered notebook page, measured live so the panel can sit in the gap beside it.
  const [pageLeft, setPageLeft] = useState<number | null>(null)
  useEffect(() => {
    const measure = () => {
      const el = document.getElementById("pulp-page-surface")
      setPageLeft(el ? el.getBoundingClientRect().left : null)
    }
    measure()
    window.addEventListener("resize", measure)
    const id = setInterval(measure, 400) // catch sidebar drags / zoom / layout shifts
    return () => { window.removeEventListener("resize", measure); clearInterval(id) }
  }, [])

  // Center the panel in the gap between the sidebar (or window edge) and the page.
  const sidebarRight = sidebarWidth > 40 ? sidebarWidth : 0
  const minLeft = sidebarWidth > 40 ? sidebarWidth + 10 : 78
  const panelLeftFor = (panelW: number) => {
    if (pageLeft == null) return minLeft
    const gap = pageLeft - sidebarRight
    const centered = sidebarRight + (gap - panelW) / 2
    // If the gap can't fit the panel, keep it pinned left instead of overlapping the page.
    if (centered < minLeft) return minLeft
    return centered
  }

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
  const hour = new Date().getHours()
  const isEarlyBird = hour >= 6 && (hour < 10 || (hour === 10 && new Date().getMinutes() <= 30))
  const quotaBonus = quotaTier === 'daily' ? 2 : quotaTier === 'weekly' ? 1 : 0
  const streakBonus = Math.min(1, goalStreak / 30)
  const multiplier = Math.min(5, 1 + (isEarlyBird ? 1 : 0) + quotaBonus + streakBonus)
  // Same rule as claimReward: only pre-topic (legacy) partial trees keep absorbing minutes;
  // every new session starts a fresh tree, so the bar starts empty.
  const existingPartial = grove.find(t => !isTopicTree(t) && t.type === treeType && t.growthTarget && (t.focusMinutes || 0) < t.growthTarget)
  const priorMinutes = existingPartial?.focusMinutes || 0
  const sessionMin = total > 0 ? Math.round(total / 60) : 0
  // Matches VitalitySystem's per-minute payout: only fully grown trees make sap.
  const groveSap = grove.reduce((sum, t) => sum + (isFullyGrown(t) ? (TREE_TYPES[t.type]?.sapYield || 0) : 0), 0)
  const sapPerMinute = isHibernating ? 0 : Math.max(1, Math.round((groveSap / 60) * multiplier))
  const effectiveSap = sapPerMinute * sessionMin
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
  const bgColor = isDark ? "rgba(4,4,5,0.85)" : "rgba(255,255,255,0.75)"
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
  // The deadline includes a 90s grace, so this shows the can ~2 min before watering is due.
  // Show the can from 2 min before watering is due, and while it's overdue.
  const waterUrgent = waterDeadline !== null && now > waterDeadline - 120_000
  const showWaterWidget = running && waterDeadline !== null
  const waterWindowMs = Math.floor(total / 3) * 1000 + 90_000
  const waterFrac = waterWindowMs > 0 ? Math.max(0, Math.min(1, waterMsLeft / waterWindowMs)) : 0
  const waterColor = "#0ea5e9"
  // Sap accrued so far this session — ramps toward the projected payout as time passes.
  const liveSap = sapPerMinute * Math.floor(elapsed / 60)

  const focusMode = running && !done && !treeDead
  // Stage the plant reaches by this point in the session (same thresholds as claimReward's computeStage).
  const focusStage = (() => {
    let k = 0
    for (let n = 1; n < FOCUS_STAGES.length; n++) if (cumulativeRatio >= FOCUS_STAGES[n].at) k = n
    return { name: FOCUS_STAGES[k].name, next: FOCUS_STAGES[k + 1]?.name }
  })()
  // The focus bar shows THIS session (fills to 100% at the end). Stage dots sit where the
  // session reaches each stage; stages it won't reach before it ends aren't shown.
  const sessionTotalMin = total > 0 ? total / 60 : 0
  const sessionRatio = total > 0 ? Math.min(1, elapsed / total) : 0
  const stageMarks = FOCUS_STAGES.slice(1)
    .map(st => ({ ...st, pos: sessionTotalMin > 0 ? (st.at * growthTarget - priorMinutes) / sessionTotalMin : 2 }))
    .filter(st => st.pos > 0 && st.pos <= 1)
  const nextMark = stageMarks.find(st => sessionRatio < st.pos)
  const minsToNext = nextMark ? Math.max(1, Math.ceil((nextMark.pos - sessionRatio) * sessionTotalMin)) : 0
  // In focus mode the panel shrinks to fit the gap beside the page (the hill scales with it).
  const panelW = focusMode && pageLeft != null ? Math.max(100, Math.min(250, pageLeft - sidebarRight - 16)) : 250
  const onFocusGiveUp = () => {
    if (elapsed < 60) { onCancel(); return }
    if (giveUpStage === 2) { onGiveUp(); setGiveUpStage(0) }
    else setGiveUpStage(s => s + 1)
  }

  // Tree + watering can as reusable blocks so they can swap places while running.
  const treeVisual = (
    <div
      className="relative w-full mx-auto"
      style={{
        height: 160, marginTop: running ? 24 : 8, cursor: !running && !done && !treeDead && inventory.length > 0 ? 'pointer' : undefined,
        // Wilting: the plant droops and loses color until it's watered.
        filter: wilting ? 'saturate(0.35) brightness(0.8)' : undefined,
        transform: wilting ? 'rotate(-4deg) translateY(4px)' : undefined, transformOrigin: 'bottom center',
        transition: 'filter 1.2s ease, transform 1.2s ease',
      }}
      onClick={() => { if (!running && !done && !treeDead && inventory.length > 0) { setSeedPage(0); setSeedTrayOpen(true) } }}
    >
      <div className="w-full h-full" style={{ filter: treeDead ? "grayscale(1) brightness(0.5)" : undefined, opacity: treeDead ? 0.55 : 1, transition: "filter 0.5s, opacity 0.5s" }}>
        <TreeVisualization progress={cumulativeRatio} type={selectedSeed} idle={!running && !done && !treeDead} isDark={isDark} priorRatio={priorRatio} />
      </div>
    </div>
  )
  const waterWidget = showWaterWidget && !treeDead ? (
    <button
      onClick={onWater}
      title={waterUrgent ? "Water the tree soon!" : "Water the tree"}
      className="mb-3 flex flex-col items-center gap-0.5 transition-transform hover:scale-[1.06] active:scale-[0.96]"
      style={{ background: "none", border: "none", color: waterUrgent ? "#ef4444" : waterColor, fontFamily: serifFont, animation: waterUrgent ? "pulp-water-pulse 1.2s ease-in-out infinite" : undefined }}
    >
      <WateringCan frac={waterFrac} urgent={waterUrgent} stroke={isDark ? "#cbd5e1" : "#64748b"} />
      <span className="text-[13px] tabular-nums tracking-[0.04em]" style={{ opacity: 0.9, fontWeight: 500 }}>{String(waterMin).padStart(1, "0")}:{String(waterSec).padStart(2, "0")}</span>
    </button>
  ) : null

  const sliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const snapPoints = [30, 60, 90, 120]
    const snapThreshold = 0.025
    const updateTime = (clientX: number) => {
      let percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      for (const sp of snapPoints) {
        const spPct = (sp - 5) / 175
        if (Math.abs(percent - spPct) < snapThreshold) { percent = spPct; break }
      }
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
          left: panelLeftFor(160),
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
              backgroundColor: waterUrgent ? "rgba(239,68,68,0.15)" : "rgba(14,165,233,0.1)",
              color: waterUrgent ? "#fca5a5" : waterColor,
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed z-40 flex flex-col select-none"
          style={{
            left: panelLeftFor(panelW),
            bottom: 12,
            transition: "left 160ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 420ms ease, min-height 420ms cubic-bezier(0.16, 1, 0.3, 1)",
            display: hidden ? 'none' : undefined,
            width: panelW,
            height: "auto",
            // When running, the panel settles into the page — squish only slightly.
            minHeight: running ? 540 : 560,
            maxHeight: "calc(100vh - 24px)",
            // Floating card before start; once running it dissolves into the page (no chrome).
            backgroundColor: running ? "transparent" : bgColor,
            backdropFilter: running ? "none" : "blur(24px)",
            WebkitBackdropFilter: running ? "none" : "blur(24px)",
            border: running ? "1px solid transparent" : `1px solid ${borderColor}`,
            borderRadius: 24,
            boxShadow: running ? "none" : `0 25px 50px -12px rgba(0,0,0,0.45)`,
            fontFamily: serifFont,
            userSelect: 'none',
          }}
        >
          {/* Header — minimal, no title */}
          <div
            className="flex items-center justify-between px-3 py-1.5 shrink-0"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            <div />
            <div className="flex items-center gap-0.5">
              {!(running && !done) && (
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
                            {(() => {
                              const partial = grove.find(t => t.type === type && t.growthTarget && (t.focusMinutes || 0) < t.growthTarget)
                              if (!partial) return null
                              const ratio = Math.min(1, (partial.focusMinutes || 0) / (partial.growthTarget || 1))
                              const r = 5, cx = 7, cy = 7, circ = 2 * Math.PI * r
                              return (
                                <svg className="absolute top-0 right-0" width="14" height="14" viewBox="0 0 14 14" style={{ transform: 'rotate(-90deg)' }}>
                                  <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth="1.5" />
                                  <circle cx={cx} cy={cy} r={r} fill="none" stroke={info.color} strokeWidth="1.5" strokeDasharray={`${circ * ratio} ${circ * (1 - ratio)}`} strokeLinecap="round" />
                                </svg>
                              )
                            })()}
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
            <motion.div key="timer-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col items-center flex-1">
              {focusMode ? (
                // Focus mode: growth bar above the plot (hover it for time left), give up below.
                <div className="flex flex-col items-center justify-end flex-1 w-full">
                  {waterUrgent && waterWidget}
                  <div
                    className="w-full text-center"
                    style={{ marginBottom: 30, cursor: 'default' }}
                    onMouseEnter={() => setTimerHover(true)}
                    onMouseLeave={() => setTimerHover(false)}
                    onClick={() => setTimerHover(h => !h)}
                    title="Hover to see time left"
                  >
                    <div style={{ height: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 10 }}>
                      {wilting && !timerHover ? (
                        // Shown directly (no swap animation) so it can't get stuck behind an exit.
                        <span style={{ fontFamily: serifFont, fontSize: 14, color: '#f87171', lineHeight: 1 }}>Wilting — water it!</span>
                      ) : (
                      <AnimatePresence mode="wait" initial={false}>
                        {timerHover ? (
                          <motion.span key="time" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.15 }}
                            className="tabular-nums" style={{ fontFamily: serifFont, fontSize: 20, color: textColor, lineHeight: 1 }}>
                            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")} <span style={{ fontSize: 12, color: subtleColor }}>left</span>
                          </motion.span>
                        ) : (
                          <motion.span key="stage" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.15 }}
                            style={{ fontFamily: serifFont, fontSize: 14, color: textColor, lineHeight: 1, letterSpacing: '0.02em' }}>
                            {focusStage.name}{nextMark && <span style={{ fontSize: 11.5, color: subtleColor }}> · {nextMark.name.toLowerCase()} in {minsToNext}m</span>}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      )}
                    </div>
                    <div className="relative mx-auto" style={{ width: '82%', height: 12 }}>
                      <div style={{ position: 'absolute', top: 4, left: 0, right: 0, height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
                      <div style={{ position: 'absolute', top: 4, left: 0, width: `${sessionRatio * 100}%`, height: 4, borderRadius: 2, background: mainColor, boxShadow: `0 0 8px ${mainColor}66`, transition: 'width 1s linear' }} />
                      {stageMarks.map(st => (
                        <div key={st.at} title={st.name} style={{ position: 'absolute', left: `${st.pos * 100}%`, top: 2, width: 8, height: 8, borderRadius: '50%', transform: 'translateX(-4px)', background: sessionRatio >= st.pos ? mainColor : (isDark ? '#27272a' : '#e4e4e7'), boxShadow: `0 0 0 2px ${isDark ? '#0a0a0b' : '#fdfcf9'}`, transition: 'background 0.3s' }} />
                      ))}
                    </div>
                  </div>
                  {treeVisual}
                  <button
                    onClick={onFocusGiveUp}
                    onMouseLeave={() => { if (giveUpStage < 2) setGiveUpStage(0) }}
                    className="w-full py-2 rounded-[6px] text-[11px] font-normal"
                    style={{
                      marginTop: 22, fontFamily: serifFont, letterSpacing: '0.01em',
                      backgroundColor: elapsed < 60 ? (isDark ? "rgba(255,255,255,0.04)" : "#f4f4f5") : "rgba(239,68,68,0.08)",
                      color: elapsed < 60 ? dimColor : "#ef4444",
                      border: `1px solid ${elapsed < 60 ? borderColor : "rgba(239,68,68,0.22)"}`,
                      textDecoration: giveUpStage === 2 ? "underline" : "none",
                    }}
                  >
                    {elapsed < 60 ? `Cancel (${60 - elapsed}s)` : giveUpStage === 2 ? "Are you sure?" : giveUpStage === 1 ? "You will lose your seed" : "Give Up"}
                  </button>
                </div>
              ) : (<>
              {/* Timer display */}
              <div className="text-center mb-5">
                <div
                  className="tabular-nums"
                  style={{
                    fontFamily: serifFont,
                    fontWeight: 300,
                    fontSize: 44,
                    lineHeight: 1,
                    color: textColor,
                  }}
                >
                  {String(minutes).padStart(2, "0")}
                  <span>:{String(seconds).padStart(2, "0")}</span>
                </div>
                <p className="text-[11px] uppercase tracking-[0.18em] mt-4" style={{ color: treeDead ? "#ef4444" : subtleColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {treeDead ? "tree withered" : done
                  ? <span style={{ fontFamily: serifFont, letterSpacing: '0.02em', textTransform: 'none', fontSize: 12, color: mainColor }}>complete</span>
                  : running
                  ? <span style={{ fontFamily: serifFont, letterSpacing: '0.02em', textTransform: 'none', fontSize: 11, color: subtleColor }}>
                      lock in
                    </span>
                  : null}
                </p>
                {!treeDead && (
                  <div className="mt-3 flex flex-col items-center gap-2">
                    <MiniRings isDark={isDark} onClick={onOpenStats} quotaTier={quotaTier} goalStreak={goalStreak} dailyGoalMinutes={dailyGoalMinutes} sapDisplay={effectiveSap} />
                    {running && !done && (
                      <div className="flex items-center justify-center gap-1.5">
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: mainColor, display: "inline-block" }} />
                        <span className="tabular-nums" style={{ fontFamily: serifFont, fontSize: 15, color: mainColor, lineHeight: 1 }}>+{liveSap}</span>
                        <span style={{ fontFamily: serifFont, fontSize: 11, color: subtleColor }}>sap</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {treeDead && (
                <div className="flex justify-center mt-3">
                  <svg width="22" height="18" viewBox="0 0 22 18">
                    <line x1="2" y1="2" x2="6" y2="6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="6" y1="2" x2="2" y2="6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="16" y1="2" x2="20" y2="6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="20" y1="2" x2="16" y2="6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M7 14 Q11 11 15 14" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              {/* Tree view (click to change plant) — swaps with the watering can while running */}
              {(running && showWaterWidget) ? waterWidget : treeVisual}

              {/* Growth status — below tree, replaces change plant */}
              {!running && !done && !treeDead && (() => {
                const remaining = Math.ceil(growthTarget - priorMinutes)
                const willFinish = sessionMin + priorMinutes >= growthTarget
                return (
                  <div className="text-center" style={{ marginTop: 4 }}>
                    <span style={{ fontFamily: serifFont, letterSpacing: '0.02em', fontSize: 11, color: willFinish ? mainColor : subtleColor }}>
                      {willFinish
                        ? priorMinutes > 0 ? `${remaining} min left — grows a sapling` : `${growthTarget} min — grows a sapling`
                        : priorMinutes > 0 ? `${remaining} min left · ${sessionMin}min set — grows ${Math.round(sessionMin / remaining * 100)}%` : `${growthTarget} min to grow · ${sessionMin}min set — grows ${Math.round(sessionMin / growthTarget * 100)}%`}
                    </span>
                    <div style={{ fontFamily: serifFont, fontSize: 10, fontStyle: 'italic', color: subtleColor, opacity: 0.8, marginTop: 2 }}>
                      focus grows a sapling · recall finishes it
                    </div>
                  </div>
                )
              })()}


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

              {/* Death reason */}
              {treeDead && deathReason && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-center"
                >
                  <p className="text-[12px]" style={{ color: subtleColor, fontFamily: 'Crimson Pro, serif' }}>
                    {deathReason}
                  </p>
                </motion.div>
              )}
              </>)}



            </motion.div>
            )}
            </AnimatePresence>

            {/* Bottom controls — pushed down */}
            <div className="flex flex-col items-center mt-auto">
              {/* Tree drops here while running (swapped with the watering can above) */}
              {running && showWaterWidget && !treeDead && !focusMode && treeVisual}
              <style>{`@keyframes pulp-water-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes pulp-timer-shimmer { 0% { background-position: 100% 0; } 50% { background-position: 0% 0; } 100% { background-position: 100% 0; } }`}</style>

              {/* Duration slider (hidden while running) */}
              {!running && (
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {/* Dev-only 30s preset for quick testing */}
                    {process.env.NODE_ENV === 'development' && (
                      <button
                        onClick={() => onSetTotal(30)}
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-normal transition-all"
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          color: total === 30 ? textColor : subtleColor,
                          backgroundColor: total === 30 ? `${mainColor}20` : 'transparent',
                          border: `1px solid ${total === 30 ? `${mainColor}40` : 'transparent'}`,
                        }}
                      >
                        30s
                      </button>
                    )}
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
                        width: `${Math.max(0, (total / 60 - 5) / 175) * 100}%`,
                      }}
                    />
                    {[30, 60, 90, 120].map(sp => (
                      <div key={sp} className="absolute top-1/2 -translate-y-1/2 rounded-full" style={{
                        width: 3, height: 3,
                        left: `${((sp - 5) / 175) * 100}%`, marginLeft: -1.5,
                        backgroundColor: Math.floor(total / 60) === sp ? mainColor : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'),
                      }} />
                    ))}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: 11,
                        height: 11,
                        marginLeft: -5.5,
                        backgroundColor: mainColor,
                        left: `${Math.max(0, (total / 60 - 5) / 175) * 100}%`,
                        boxShadow: `0 0 0 2px ${bgColor}, 0 0 6px ${mainColor}55`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] uppercase tracking-[0.1em]" style={{ color: subtleColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    <span>5m</span>
                    <span className="tabular-nums" style={{ color: textColor, fontWeight: 400 }}>
                      {total < 60 ? `${total} sec` : `${Math.floor(total / 60)} min`}
                    </span>
                    <span>180m</span>
                  </div>
                </div>
              )}
            </div>

            {/* Main button (in focus mode it lives under the timer, on hover) */}
            {!focusMode && <div className="pt-5 mt-auto w-full">
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
            </div>}
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
                { icon: '💀', text: 'Quit early → tree gone for good.' },
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
