"use client"
import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react"
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

const FOCUS_QUOTES = [
  "Focus is the sun that ripens the fruit.",
  "Great things grow in quiet persistence.",
  "The pulp is meant for those who plant focus.",
  "Steady rain grows the orchard.",
  "Each minute is a seed.",
  "Your concentration is the sweetest fruit.",
  "The sun doesn't rush the growth."
]

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

// ── Orchard Helper Components ────────────────────────────────────────────────
function OrchardTree({ x, y, delay, scale = 1, isDark, progress }: { x: number, y: number, delay: number, scale?: number, isDark: boolean, progress: number }) {
  const isGrown = progress > 0.5
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.15, scale: scale }}
      transition={{ delay, duration: 2 }}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="absolute flex flex-col items-center pointer-events-none"
    >
       <div className={`w-8 h-8 rounded-full ${isGrown ? "bg-emerald-600/40" : "bg-emerald-500/20"} border border-emerald-600/10`} />
       <div className={`w-1 h-3 ${isDark ? "bg-amber-900/20" : "bg-amber-900/10"} -mt-1`} />
    </motion.div>
  )
}

function FocusOrchard({ isDark, progress }: { isDark: boolean, progress: number }) {
  const trees = useRef([
    { x: 10, y: 15, delay: 0.2, scale: 0.8 },
    { x: 90, y: 10, delay: 0.5, scale: 1.1 },
    { x: 5, y: 80, delay: 0.8, scale: 0.9 },
    { x: 95, y: 85, delay: 1.1, scale: 1.2 },
    { x: 20, y: 5, delay: 1.4, scale: 0.7 },
    { x: 80, y: 92, delay: 1.7, scale: 1.0 },
    { x: 5, y: 40, delay: 0.4, scale: 1.4 },
    { x: 95, y: 55, delay: 0.9, scale: 0.6 },
  ])

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {trees.current.map((t, i) => (
        <OrchardTree key={i} {...t} isDark={isDark} progress={progress} />
      ))}
    </div>
  )
}

// ── Main Botanical Graphics ──────────────────────────────────────────────────
function OrangeFillTimer({ progress, running }: { progress: number, running: boolean }) {
  const waveHeight = useMemo(() => 100 - (progress * 100), [progress])
  
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <motion.div 
        animate={{ scale: running ? [1, 1.08, 1] : 1, opacity: running ? [0.2, 0.35, 0.2] : 0.15 }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute w-32 h-32 bg-[#ea580c] blur-[50px] rounded-full z-0"
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
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="37" fill="rgba(0,0,0,0.02)" filter="blur(2px)" />

        <path 
          d="M50 15 C30 15 15 30 15 50 C15 70 30 85 50 85 C70 85 85 70 85 50 C85 30 70 15 50 15 Z" 
          fill="none" 
          stroke="#ea580c" 
          strokeOpacity="0.1"
          strokeWidth="1.2"
          filter="url(#hand-drawn)"
        />

        <g clipPath="url(#orange-liquid-clip)">
          <path 
            d="M50 15 C30 15 15 30 15 50 C15 70 30 85 50 85 C70 85 85 70 85 50 C85 30 70 15 50 15 Z" 
            fill="url(#pulp-gradient)"
            opacity="0.96"
            stroke="#ea580c"
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

function BotanicalGrowthFragment({ progress }: { progress: number }) {
  const isSeed = progress < 0.2
  const isSprout = progress >= 0.2 && progress < 0.7
  const isTree = progress >= 0.7

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <AnimatePresence mode="wait">
        {isSeed && (
          <motion.div key="seed" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }} className="flex flex-col items-center">
            <div className="w-4 h-6 bg-[#4a2c2a] rounded-full rotate-12 shadow-sm" style={{ filter: 'url(#hand-drawn)' }} />
          </motion.div>
        )}
        {isSprout && (
          <motion.div key="sprout" initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 1.2, opacity: 0 }} className="flex flex-col items-center">
             <div className="w-1 h-8 bg-emerald-700/60 rounded-full" />
             <div className="flex gap-1 -mt-6">
                <div className="w-4 h-2 bg-emerald-500 rounded-full" style={{ borderRadius: '100% 0' }} />
                <div className="w-4 h-2 bg-emerald-600 rounded-full" style={{ borderRadius: '0 100%' }} />
             </div>
          </motion.div>
        )}
        {isTree && (
          <motion.div key="tree" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
             <div className="w-10 h-10 bg-emerald-600/80 rounded-full border border-emerald-700/20 shadow-inner blur-[1px]" />
             <div className="w-1.5 h-5 bg-[#4a2c2a]/40 rounded-sm -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main TimerPanel Component ────────────────────────────────────────────────
export const TimerPanel = memo(function TimerPanel({
  isOpen, onClose, theme, accent,
  elapsed, total, running, done, preset,
  onSetRunning, onSetElapsed, onSetTotal, onSetPreset, onSetDone
}: TimerPanelProps) {
  const [currentQuote, setCurrentQuote] = useState(FOCUS_QUOTES[0])
  const [isStopwatch, setIsStopwatch] = useState(false)
  const isDark = theme === "dark"

  useEffect(() => {
    if (isOpen) setCurrentQuote(FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)])
  }, [isOpen])

  const handlePresetClick = (p: "focus" | "short" | "long") => {
    setIsStopwatch(false)
    const times: Record<string, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }
    onSetPreset(p)
    onSetTotal(times[p])
    onSetElapsed(0)
    onSetRunning(false)
    onSetDone(false)
  }

  const handleSliderChange = (val: string) => {
    setIsStopwatch(false)
    const mins = parseInt(val)
    onSetTotal(mins * 60)
    onSetElapsed(0)
    onSetRunning(false)
    onSetDone(false)
  }

  const remainingTime = total - elapsed
  const m = Math.floor((isStopwatch ? elapsed : remainingTime) / 60)
  const s = (isStopwatch ? elapsed : remainingTime) % 60
  const timeText = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  const progress = isStopwatch ? Math.min(1, elapsed / 3600) : (total > 0 ? (elapsed / total) : 0)

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
            
            <FocusOrchard isDark={isDark} progress={progress} />
          </div>

          <div className="relative z-10 flex flex-col items-center w-full text-center px-6">
            <header className="mb-10" style={{ filter: 'url(#cozy-sketch)' }}>
              <span className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 block ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>
                Concentration Sanctuary
              </span>
              <h2 className="text-2xl font-medium tracking-tighter" style={{ fontFamily: '"EB Garamond", serif', color: isDark ? "#fff" : "#1a1a1a" }}>
                Distraction Blocker
              </h2>
              <div className="h-[1px] w-12 bg-orange-500/40 mx-auto mt-4" />
            </header>

            <div className="flex flex-col items-center w-full mb-12">
              <motion.div
                animate={{ scale: running ? [1, 1.02, 1] : 1 }}
                className="text-7xl font-bold tabular-nums mb-8"
                style={{ fontFamily: '"EB Garamond", serif', color: isDark ? "#fff" : "#1a1a1a", filter: 'url(#cozy-sketch)' }}
              >
                {timeText}
              </motion.div>

              <div className="relative">
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
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                          preset === p && !isStopwatch
                            ? `bg-[#ea580c] text-white shadow-lg` 
                            : `${isDark ? "bg-zinc-900 text-zinc-600" : "bg-white text-zinc-300"} hover:text-zinc-500`
                        } ${running ? "opacity-50" : ""}`}
                      >
                        {p === "short" ? "5m" : p === "focus" ? "25m" : "15m"}
                      </button>
                    ))}
                    <button 
                      onClick={() => { setIsStopwatch(!isStopwatch); if(!isStopwatch) { onSetElapsed(0); onSetRunning(false); } }}
                      disabled={running}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                        isStopwatch 
                          ? `bg-emerald-600 text-white shadow-lg` 
                          : `${isDark ? "bg-zinc-900 text-zinc-600" : "bg-white text-zinc-300"} hover:text-zinc-400`
                      } ${running ? "opacity-50" : ""}`}
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
                         className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#ea580c]"
                       />
                       <span className="text-[10px] text-zinc-500 font-bold whitespace-nowrap">{total / 60}m</span>
                    </div>
                  )}
               </div>
               
               <div className="flex flex-col items-center gap-4 w-full">
                  <button
                    onClick={() => onSetRunning(!running)} disabled={done}
                    className="w-full relative overflow-hidden group py-3.5 rounded-xl transition-all bg-[#ea580c]"
                  >
                    <motion.div 
                      className="absolute inset-0 opacity-80"
                      style={{ background: 'linear-gradient(90deg, #ea580c, #fb923c, #ea580c)', backgroundSize: '200% 100%' }}
                      animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="relative z-10 text-white font-black text-[11px] tracking-[0.3em] uppercase drop-shadow-sm">
                       {done ? "TAKE REWARD" : running ? "PAUSE SESSION" : "PLANT SEEDS"}
                    </span>
                  </button>

                  <button 
                    onClick={() => { onSetRunning(false); onSetElapsed(0); onSetDone(false); onClose() }} 
                    className="text-[9px] font-black uppercase tracking-[0.3em] transition-all opacity-40 hover:opacity-100 hover:text-red-500 py-2"
                  >
                    Abandon
                  </button>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
