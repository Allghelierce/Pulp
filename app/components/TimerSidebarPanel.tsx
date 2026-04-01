"use client"
import { useState, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HangingOrange } from "./HangingOrange"

interface TimerSidebarPanelProps {
  isOpen: boolean
  onClose: () => void
  elapsed: number
  total: number
  running: boolean
  done: boolean
  preset: "focus" | "short" | "long"
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

function TreeVisualization({ progress }: { progress: number }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="leafGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "#386641" }} />
          <stop offset="100%" style={{ stopColor: "#1B3022" }} />
        </radialGradient>
      </defs>

      {/* Trunk */}
      <path d="M50 90 L50 40 Q50 30 55 25" stroke="#8B6F47" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 65 Q45 60 40 62" stroke="#8B6F47" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 55 Q55 50 60 52" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />

      {/* Foliage with opacity based on progress */}
      <g id="foliage-group" opacity={Math.min(0.5 + progress, 1)}>
        <motion.circle cx="50" cy="35" r="15" fill="url(#leafGrad)" opacity={0.95} animate={{ r: [15, 16, 15] }} transition={{ duration: 2, repeat: Infinity }} />
        <circle cx="38" cy="45" r="12" fill="url(#leafGrad)" opacity={0.9} />
        <circle cx="62" cy="45" r="12" fill="url(#leafGrad)" opacity={0.9} />
        <circle cx="50" cy="50" r="14" fill="url(#leafGrad)" opacity={0.85} />

        {/* Orange Fruits */}
        <circle cx="42" cy="35" r="2.5" fill="#EA8C55" opacity={Math.min(progress * 2, 1)} />
        <circle cx="58" cy="40" r="2.5" fill="#EA8C55" opacity={Math.min(progress * 2, 1)} />
        <circle cx="52" cy="52" r="2.5" fill="#EA8C55" opacity={Math.min(Math.max(progress - 0.3, 0) * 2, 1)} />
        <circle cx="35" cy="48" r="2.5" fill="#EA8C55" opacity={Math.min(Math.max(progress - 0.5, 0) * 2, 1)} />
        <circle cx="65" cy="48" r="2.5" fill="#EA8C55" opacity={Math.min(Math.max(progress - 0.7, 0) * 2, 1)} />
      </g>
    </svg>
  )
}

export const TimerSidebarPanel = memo(function TimerSidebarPanel({
  isOpen, onClose, elapsed, total, running, done, preset,
  onSetRunning, onSetElapsed, onSetTotal, onSetPreset, onSetDone
}: TimerSidebarPanelProps) {
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

  const handleStartSession = () => {
    if (total === 0) {
      onSetTotal(PRESET_TIMES.focus)
    }
    onSetRunning(!running)
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

          {/* Hanging Orange - can click to close */}
          <div onClick={onClose} className="fixed top-0 right-12 z-50 cursor-pointer">
            <HangingOrange onClick={() => {}} />
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-96 bg-gradient-to-b from-[#FBF7F3] via-[#FBF7F3] to-[#F3EDE6] border-l border-orange-200/40 overflow-y-auto z-50 shadow-2xl"
            style={{ fontFamily: '"Caveat", cursive' }}
          >
            <div className="sticky top-0 bg-gradient-to-b from-[#FBF7F3] to-[#FBF7F3]/95 backdrop-blur-sm p-8 border-b border-orange-100/40">
              {/* Label */}
              <div className="text-center mb-8 relative z-10">
                <span className="font-light tracking-wider text-orange-600/70 text-sm block" style={{ fontFamily: '"EB Garamond", serif' }}>
                  focus
                </span>
              </div>

              {/* Timer Circle */}
              <div className="relative w-56 h-56 mx-auto mb-10">
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D4A574" />
                      <stop offset="100%" stopColor="#EA8C55" />
                    </linearGradient>
                  </defs>
                  {/* Background circle */}
                  <circle cx="100" cy="100" r="92" fill="transparent" stroke="#E8DCC8" strokeWidth="2" />
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
                  <TreeVisualization progress={progress} />
                </div>
              </div>

              {/* Time Display */}
              <div className="text-center mb-8 relative z-10">
                <div className="text-5xl tracking-tight text-amber-900/80" style={{ fontFamily: '"EB Garamond", serif', fontWeight: 700 }}>
                  {String(minutes).padStart(2, "0")}<span className="text-amber-700/60">:{String(seconds).padStart(2, "0")}</span>
                </div>
                <p className="text-xs font-light text-amber-700/50 mt-2 tracking-wider" style={{ fontFamily: '"EB Garamond", serif' }}>
                  remaining
                </p>
              </div>

              {/* Duration Selector */}
              <div className="mb-8 px-4">
                <div className="flex justify-between items-end gap-1 h-8 mb-3">
                  {durationOptions.map((_, idx) => (
                    <div key={idx} className="flex flex-col gap-1 items-center flex-1">
                      <motion.div
                        initial={false}
                        animate={{
                          height: idx === selectedIndex ? 32 : 18,
                          opacity: idx === selectedIndex ? 1 : 0.35,
                          backgroundColor: idx === selectedIndex ? "#D4A574" : "#E8DCC8"
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-1 rounded-full"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-amber-700/50 px-1 tracking-wide" style={{ fontFamily: '"EB Garamond", serif' }}>
                  {durationOptions.map((opt) => (
                    <span
                      key={opt.label}
                      className={`cursor-pointer transition-colors ${
                        selectedDuration?.label === opt.label
                          ? "text-amber-800 font-semibold"
                          : "hover:text-amber-700/70"
                      }`}
                      onClick={() => {
                        onSetTotal(opt.value)
                        onSetElapsed(0)
                        onSetRunning(false)
                      }}
                    >
                      {opt.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-4 relative z-10">
                <button
                  onClick={handleStartSession}
                  className="w-full bg-amber-100 hover:bg-amber-50 text-amber-900 transition-all py-3 shadow-sm border border-orange-200/40 hover:border-orange-300/40"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '18px', letterSpacing: '0.05em' }}
                >
                  {done ? "take reward" : running ? "pause session" : "start session"}
                </button>
                <button
                  onClick={() => {
                    onSetRunning(false)
                    onSetElapsed(0)
                    onSetDone(false)
                    onClose()
                  }}
                  className="text-xs font-light text-amber-700/60 hover:text-amber-800 transition-all border-b border-transparent hover:border-amber-700/20 pb-1 cursor-pointer tracking-wide"
                  style={{ fontFamily: '"EB Garamond", serif' }}
                >
                  or click the orange to close
                </button>
              </div>

              {/* Tree Growth Stats */}
              <div className="mt-8 pt-6 border-t border-orange-200/30 flex justify-between items-center opacity-70 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-700/60" style={{ fontFamily: '"EB Garamond", serif' }}>
                    stage: {stage.toLowerCase()}
                  </span>
                </div>
                <span className="text-sm text-amber-800/70" style={{ fontFamily: '"Caveat", cursive' }}>
                  {percent}% growth
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
