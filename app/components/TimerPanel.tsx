"use client"
import { useState, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TimerTreeGrowth } from "./TimerTreeGrowth"

interface TimerPanelProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
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
  sidebarWidth?: number
}

// ── Sketch Filter ────────────────────────────────────────────────────────────
const SketchFilter = () => (
  <svg className="hidden">
    <defs>
      <filter id="hand-drawn">
        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
      </filter>
      <filter id="cozy-sketch">
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" />
        <feDisplacementMap in="SourceGraphic" scale="1.2" />
      </filter>
    </defs>
  </svg>
)

// ── Main Botanical Graphics ──────────────────────────────────────────────────
function OrangeFillTimer({ progress, running }: { progress: number, running: boolean }) {
  const waveHeight = useMemo(() => 100 - (progress * 100), [progress])
  
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <motion.div 
        animate={{ scale: running ? [1, 1.08, 1] : 1, opacity: running ? [0.2, 0.35, 0.2] : 0.15 }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute w-32 h-32 bg-[#d97706] blur-[50px] rounded-full z-0"
      />
      
      <svg viewBox="0 0 100 100" className="w-full h-full z-10 drop-shadow-[0_20px_40px_rgba(234,88,12,0.2)] overflow-visible">
        <defs>
          <clipPath id="orange-liquid-clip">
            <motion.path 
              animate={{ 
                d: [
                  `M -20 ${waveHeight} Q 15 ${waveHeight - 4}, 50 ${waveHeight} T 120 ${waveHeight} V 120 H -20 Z`,
                  `M -20 ${waveHeight} Q 15 ${waveHeight + 4}, 50 ${waveHeight} T 120 ${waveHeight} V 120 H -20 Z`,
                  `M -20 ${waveHeight} Q 15 ${waveHeight - 4}, 50 ${waveHeight} T 120 ${waveHeight} V 120 H -20 Z`
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </clipPath>
          <linearGradient id="pulp-gradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="37" fill="rgba(0,0,0,0.02)" filter="blur(2px)" />

        <path 
          d="M50 15 C30 15 15 30 15 50 C15 70 30 85 50 85 C70 85 85 70 85 50 C85 30 70 15 50 15 Z" 
          fill="none" 
          stroke="#d97706" 
          strokeOpacity="0.1"
          strokeWidth="1.2"
          filter="url(#hand-drawn)"
        />

        <g clipPath="url(#orange-liquid-clip)">
          <path 
            d="M50 15 C30 15 15 30 15 50 C15 70 30 85 50 85 C70 85 85 70 85 50 C85 30 70 15 50 15 Z" 
            fill="url(#pulp-gradient)"
            opacity="0.96"
            stroke="#d97706"
            strokeWidth="0.6"
            filter="url(#hand-drawn)"
          />
        </g>

        <g className="translate-y-[-2px]">
           <path d="M50 15 L50 8" stroke="#3e2723" strokeWidth="2.5" strokeLinecap="round" />
           <motion.path 
             animate={{ rotate: [ -4, 4, -4 ] }} transition={{ duration: 5, repeat: Infinity }}
             d="M50 10 C62 10 76 2 76 2 C76 2 71 15 55 15 L50 10" 
             fill="#059669" 
             style={{ transformOrigin: '50px 10px' }}
           />
        </g>
      </svg>
    </div>
  )
}

// ── Preset times ─────────────────────────────────────────────────────────────
const PRESET_TIMES: Record<"focus" | "short" | "long", number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
}
const PRESET_LABELS: Record<"focus" | "short" | "long", string> = {
  short: "5m",
  focus: "25m",
  long: "15m",
}

// ── Main TimerPanel Component ────────────────────────────────────────────────
export const TimerPanel = memo(function TimerPanel({
  isOpen, onClose, theme, accent,
  elapsed, total, running, done, preset,
  onSetRunning, onSetElapsed, onSetTotal, onSetPreset, onSetDone
}: TimerPanelProps) {
  const [confirmGiveUp, setConfirmGiveUp] = useState(false)
  const [isStopwatch, setIsStopwatch] = useState(false)
  const isDark = theme === "dark"

  const handlePresetClick = (p: "focus" | "short" | "long") => {
    setIsStopwatch(false)
    onSetPreset(p)
    onSetTotal(PRESET_TIMES[p])
    onSetElapsed(0)
    onSetRunning(false)
    onSetDone(false)
  }

  const handleSliderChange = (val: string) => {
    setIsStopwatch(false)
    onSetTotal(parseInt(val) * 60)
    onSetElapsed(0)
    onSetRunning(false)
    onSetDone(false)
  }

  const displayTime = isStopwatch ? elapsed : total - elapsed
  const m = Math.floor(displayTime / 60)
  const s = displayTime % 60
  const timeText = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  const progress = isStopwatch ? Math.min(1, elapsed / 3600) : (total > 0 ? (elapsed / total) : 0)

  const btnBase = `px-4 py-1.5 rounded-full text-[9px] font-normal uppercase tracking-widest transition-all`
  const btnInactive = `${isDark ? "bg-zinc-900 text-zinc-600" : "bg-white text-zinc-300"} hover:text-zinc-500`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden py-12"
        >
          <SketchFilter />
          
          {/* Immersive Paper Texture + Sanctuary Glow */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className={`absolute inset-0 ${isDark ? "bg-[#0c0c0e]" : "bg-[#fcfaf7]"}`} />
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply" 
                 style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />

            <motion.div 
               animate={{ opacity: running ? [0.4, 0.7, 0.4] : 0.3, scale: running ? [1, 1.1, 1] : 1 }}
               transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
               className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(234,88,12,0.15)_0%,_transparent_75%)]" 
            />
          </div>

          <div className="relative z-10 flex flex-col items-center w-full text-center px-6">
            <header className="mb-10" style={{ filter: 'url(#cozy-sketch)' }}>
              <span className={`text-[10px] font-normal uppercase tracking-[0.4em] mb-3 block ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>
                Concentration Sanctuary
              </span>
              <h2 className="text-2xl font-normal tracking-tighter" style={{ fontFamily: 'Crimson Pro, serif', color: isDark ? "#fff" : "#1a1a1a" }}>
                Distraction Blocker
              </h2>
              <div className="h-[1px] w-12 bg-orange-500/40 mx-auto mt-4" />
            </header>

            <div className="flex flex-col items-center w-full mb-12">
              <motion.div
                animate={{ scale: running ? [1, 1.02, 1] : 1 }}
                className="text-7xl font-normal tabular-nums mb-8"
                style={{ fontFamily: 'Crimson Pro, serif', color: isDark ? "#fff" : "#1a1a1a", filter: 'url(#cozy-sketch)' }}
              >
                {timeText}
              </motion.div>

              <div className="relative min-h-[300px] flex items-center justify-center">
                <TimerTreeGrowth elapsed={elapsed} total={total} running={running} theme={theme} accent={accent} />
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-8 w-full max-w-sm">
               <div className="flex flex-col items-center w-full gap-4">
                  <div className="flex gap-3 items-center">
                    {(["short", "focus", "long"] as const).map(p => (
                      <button
                        key={p} onClick={() => handlePresetClick(p)}
                        disabled={running}
                        className={`${btnBase} ${preset === p && !isStopwatch ? "bg-[#d97706] text-white shadow-lg" : btnInactive} ${running ? "opacity-50" : ""}`}
                      >
                        {PRESET_LABELS[p]}
                      </button>
                    ))}
                    <button 
                      onClick={() => { setIsStopwatch(!isStopwatch); if(!isStopwatch) { onSetElapsed(0); onSetRunning(false); } }}
                      disabled={running}
                      className={`${btnBase} ${isStopwatch ? "bg-emerald-600 text-white shadow-lg" : `${isDark ? "bg-zinc-900 text-zinc-600" : "bg-white text-zinc-300"} hover:text-zinc-400`} ${running ? "opacity-50" : ""}`}
                    >
                      Stop/W
                    </button>
                  </div>

                  {!isStopwatch && !running && (
                    <div className="w-full flex items-center gap-4 px-4">
                       <input 
                         type="range" min="1" max="120" step="1" 
                         value={total / 60}
                         onChange={(e) => handleSliderChange(e.target.value)}
                         className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#d97706]"
                       />
                       <span className="text-[10px] text-zinc-500 font-normal whitespace-nowrap">{total / 60}m</span>
                    </div>
                  )}
               </div>
               
                <div className="flex flex-col items-center gap-4 w-full relative">
                  <AnimatePresence>
                    {confirmGiveUp && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-full mb-2 bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-4 shadow-xl z-50 flex flex-col items-center gap-2 min-w-[140px]"
                      >
                        <span className="text-[10px] text-zinc-300 font-normal uppercase tracking-wider whitespace-nowrap">Are you sure?</span>
                        <div className="flex gap-4">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation()
                              onSetRunning(false); onSetElapsed(0); onSetDone(false)
                              setConfirmGiveUp(false); onClose()
                            }}
                            className="text-[9px] text-red-500 font-normal uppercase hover:underline"
                          >
                            Yes
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmGiveUp(false) }}
                            className="text-[9px] text-zinc-500 font-normal uppercase hover:underline"
                          >
                            No
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => onSetRunning(!running)} disabled={done}
                    className="w-full relative overflow-hidden group py-3.5 rounded-xl transition-all bg-[#d97706]"
                  >
                    <motion.div 
                      className="absolute inset-0 opacity-80"
                      style={{ background: 'linear-gradient(90deg, #d97706, #d97706, #d97706)', backgroundSize: '200% 100%' }}
                      animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="relative z-10 text-white font-normal text-[11px] tracking-[0.3em] uppercase drop-shadow-sm">
                       {done ? "TAKE REWARD" : running ? "PAUSE SESSION" : "PLANT SEEDS"}
                    </span>
                  </button>

                  <button 
                    onClick={() => setConfirmGiveUp(true)} 
                    className="text-[9px] font-normal uppercase tracking-[0.3em] transition-all opacity-40 hover:opacity-100 hover:text-red-500 hover:underline py-2"
                  >
                    Give Up
                  </button>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
