"use client"
import { useState, useRef, useEffect, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"

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
  onSetElapsed: (v: number) => void
  onSetTotal: (v: number) => void
  onSetPreset: (v: "focus" | "short" | "long") => void
  onSetDone: (v: boolean) => void
  onSessionCancel: (ratio: number) => void
}

const FOCUS_QUOTES = [
  "Focus is the sun that ripens the fruit.",
  "Great things grow in quiet persistence.",
  "The pulp is meant for those who plant focus.",
  "The heart of success is found in the work.",
  "Steady rain grows the orchard; steady work grows the mind.",
  "Each minute is a seed. Deciding how to plant it is everything.",
  "Your concentration is the sweetest fruit.",
  "The sun doesn't rush the growth. Neither should you."
]

/**
 * Botanical Growth Component
 * Animates a seed growing into a lush orange tree
 */
function BotanicalGrowth({ progress, isDark, timeText, running }: { progress: number, isDark: boolean, timeText: string, running: boolean }) {
  // Stages: 0-0.2 (Seed), 0.2-0.7 (Sprout), 0.7-1.0 (Orange)
  const isSeed = progress < 0.2
  const isSprout = progress >= 0.2 && progress < 0.7
  const isOrange = progress >= 0.7

  return (
    <div className="relative w-[360px] h-[360px] flex items-center justify-center">
      {/* Background Glow */}
      <motion.div 
        animate={{ 
          scale: running ? [1, 1.05, 1] : 1,
          opacity: running ? [0.05, 0.1, 0.05] : 0.03 
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-[#ea580c] blur-[80px]"
      />

      {/* Circular Progress Ring - Handcrafted Feel */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
        <defs>
          <filter id="cozy-sketch" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {/* Track */}
        <circle 
          cx="50" cy="50" r="46" 
          fill="none" 
          stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 
          strokeWidth="1.5"
          filter="url(#cozy-sketch)"
        />
        {/* Progress Fill */}
        <motion.circle 
          cx="50" cy="50" r="46" 
          fill="none" 
          stroke="#ea580c" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeDasharray="289"
          animate={{ strokeDashoffset: 289 - (289 * progress) }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 10px rgba(234, 88, 12, 0.4))" }}
          filter="url(#cozy-sketch)"
        />
        {/* Particle Pulse */}
        {running && (
           <motion.circle 
             cx="50" cy="4" r="1.5" 
             fill="#fff" 
             animate={{ opacity: [1, 0.4, 1], scale: [1, 0.8, 1] }} 
             transition={{ duration: 2, repeat: Infinity }}
             style={{ transformOrigin: "50% 50%", transform: `rotate(${progress * 360}deg)` }}
           />
        )}
      </svg>

      {/* The Central Botanical High-Fidelity Asset */}
      <div className="relative z-10 flex items-center justify-center translate-y-[-20px]">
        <AnimatePresence mode="wait">
          {isSeed && (
            <motion.div 
              key="seed"
              initial={{ scale: 0, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0 }}
              className="w-12 h-14 bg-[#4e342e] rounded-full shadow-xl relative"
              style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", borderRadius: '80% 80% 20% 20% / 100% 100% 20% 20%', filter: 'url(#cozy-sketch)' }}
            >
               <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-white/10 rounded-full" />
            </motion.div>
          )}
          {isSprout && (
            <motion.div 
              key="sprout"
              initial={{ scale: 0.5, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 1.4, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="flex gap-1.5 -mb-1.5">
                <motion.div animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 4, repeat: Infinity }} className="w-12 h-6 bg-emerald-500 rounded-full" style={{ borderRadius: '100% 0% 100% 0%', boxShadow: '0 5px 10px rgba(16, 185, 129, 0.2)', filter: 'url(#cozy-sketch)' }} />
                <motion.div animate={{ rotate: [4, -4, 4] }} transition={{ duration: 4.5, repeat: Infinity }} className="w-12 h-6 bg-emerald-600 rounded-full" style={{ borderRadius: '0% 100% 0% 100%', boxShadow: '0 5px 10px rgba(5, 150, 105, 0.2)', filter: 'url(#cozy-sketch)' }} />
              </div>
              <div className="w-2 h-16 bg-emerald-800 rounded-full shadow-lg" style={{ filter: 'url(#cozy-sketch)' }} />
            </motion.div>
          )}
          {isOrange && (
            <motion.div 
              key="orange"
              initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative"
              style={{ filter: "url(#cozy-sketch)" }}
            >
              <div className="w-32 h-32 bg-[#ea580c] rounded-full shadow-[inset_-12px_-12px_40px_rgba(0,0,0,0.3),0_20px_50px_-10px_rgba(234,88,12,0.5)] relative border-2 border-white/10 overflow-hidden">
                {/* Surface Polish Highlight */}
                <div className="absolute top-6 left-6 w-14 h-6 bg-white/20 rounded-full blur-lg transform -rotate-12" />
                {/* Skin Texture */}
                <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.4) 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
              </div>
              {/* Stem / Leaf */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                 <div className="w-2 h-8 bg-[#3e2723] rounded-full shadow-md" />
                 <div className="w-12 h-6 bg-emerald-600 rounded-full -mt-4 shadow-lg border border-white/5" style={{ borderRadius: '100% 0% 100% 0%' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* High-Contrast Precise Clock */}
      <div className="absolute bottom-16 flex flex-col items-center">
        <motion.div 
          animate={{ opacity: running ? 1 : 0.6 }}
          className="text-5xl font-medium tracking-tight tabular-nums" 
          style={{ fontFamily: '"EB Garamond", serif', color: isDark ? "#fff" : "#1a1a1a" }}
        >
          {timeText}
        </motion.div>
        <div className={`text-[10px] font-black uppercase tracking-[0.5em] mt-2 ${isDark ? "text-zinc-600" : "text-zinc-300"}`}>
          {isOrange ? "Essence Perfected" : isSeed ? "Planting Intent" : "Growth in Progress"}
        </div>
      </div>
    </div>
  )
}

export function TimerPanel({ 
  isOpen, onClose, theme, accent, 
  elapsed, total, running, done, preset,
  onSetRunning, onSetElapsed, onSetTotal, onSetPreset, onSetDone, onSessionCancel
}: TimerPanelProps) {
  const [currentQuote, setCurrentQuote] = useState(FOCUS_QUOTES[0])
  const isDark = theme === "dark"

  useEffect(() => {
    if (isOpen) setCurrentQuote(FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)])
  }, [isOpen])

  const playPremiumChime = useCallback(() => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      
      const playNote = (freq: number, startTime: number, length: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + length)
        osc.start(startTime); osc.stop(startTime + length)
      }
      
      const now = ctx.currentTime
      playNote(523.25, now, 2) // C5
      playNote(659.25, now + 0.15, 2.2) // E5
      playNote(783.99, now + 0.3, 2.5) // G5
    } catch (e) {}
  }, [])

  useEffect(() => {
    if (done && isOpen) playPremiumChime()
  }, [done, isOpen, playPremiumChime])

  const handlePresetClick = (p: "focus" | "short" | "long") => {
    const times: Record<string, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }
    onSetPreset(p)
    onSetTotal(times[p])
    onSetElapsed(0)
    onSetRunning(false)
    onSetDone(false)
  }

  const handleCancelClick = () => {
    if (elapsed > 10) onSessionCancel(elapsed / total)
    else {
      onSetElapsed(0); onSetRunning(false); onSetDone(false); onClose()
    }
  }

  const remainingTime = total - elapsed
  const m = Math.floor(remainingTime / 60); const s = remainingTime % 60
  const timeText = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  const progress = total > 0 ? (elapsed / total) : 0

  const PresetButton = ({ type, label }: { type: "focus" | "short" | "long", label: string }) => (
    <button
      onClick={() => handlePresetClick(type)}
      className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.25em] transition-all border-2 ${
        preset === type 
          ? `bg-[#ea580c] text-white border-[#ea580c] shadow-[0_10px_25px_rgba(234,88,12,0.4)] scale-[1.1]` 
          : `${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-600" : "bg-white border-zinc-100 text-zinc-300"} hover:border-zinc-300`
      }`}
    >
      {label}
    </button>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Immersive Darkened World Background */}
          <div className={`absolute inset-0 z-0 ${isDark ? "bg-[#09090b]" : "bg-[#fdfcf9]"}`}>
            <motion.div 
               animate={{ opacity: running ? 0.12 : 0.06 }}
               className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(234,88,12,0.1)_0%,_transparent_70%)]" 
            />
          </div>

          <div className="relative z-10 flex flex-col items-center w-full max-w-4xl text-center">
            {/* Header Ritual Header */}
            <motion.header 
              initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="mb-8 mt-4"
            >
              <h2 className="text-5xl font-medium tracking-tight mb-3" style={{ fontFamily: '"EB Garamond", serif', color: isDark ? "#fff" : "#1a1a1a" }}>The Focus</h2>
              <div className="h-[2px] w-12 bg-[#ea580c] mx-auto opacity-50 mb-6" style={{ filter: 'url(#cozy-sketch)' }} />
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentQuote} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="max-w-md mx-auto"
                >
                  <p className={`text-base italic font-serif leading-relaxed px-8 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                    "{currentQuote}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.header>

            {/* Central Master Botanical View */}
            <BotanicalGrowth progress={progress} isDark={isDark} timeText={timeText} running={running} />

            {/* Immersive Controls Area */}
            <div className="mt-8 flex flex-col items-center space-y-8">
               <div className="flex gap-4"><PresetButton type="short" label="Break" /><PresetButton type="focus" label="Focus" /><PresetButton type="long" label="Deep" /></div>
               
               <div className="flex flex-col items-center gap-5 w-64">
                  <button
                    onClick={() => onSetRunning(!running)} disabled={done}
                    className={`w-full py-5 rounded-[28px] font-black text-[13px] tracking-[0.3em] transition-all transform active:scale-[0.98] shadow-xl relative overflow-hidden group ${
                      done 
                        ? "bg-emerald-500 text-white" 
                        : running 
                          ? `${isDark ? "bg-white text-black" : "bg-black text-white"}` 
                          : "bg-[#ea580c] text-white ring-4 ring-orange-500/10"
                    }`}
                  >
                    {done ? "HARVEST SUCCESSFUL" : running ? "PAUSE" : "PLANT SEED"}
                  </button>

                  <button 
                    onClick={handleCancelClick} 
                    className={`text-[10px] font-black uppercase tracking-[0.3em] transition-opacity opacity-40 hover:opacity-100 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}
                  >
                    {running ? "ABANDON GROWTH" : "EXIT SANCTUARY"}
                  </button>
               </div>
            </div>
          </div>
          
          {/* Subtle Exit Close Button in Corner */}
          <button 
             onClick={onClose}
             className="absolute top-10 right-10 p-4 rounded-full opacity-10 hover:opacity-100 transition-opacity bg-black/10 dark:bg-white/10"
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
