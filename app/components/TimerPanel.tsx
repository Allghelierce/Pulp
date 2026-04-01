"use client"
import { useState, useRef, useEffect, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TimerPanelProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  onSessionComplete: () => void
}

export function TimerPanel({ isOpen, onClose, theme, accent, onSessionComplete }: TimerPanelProps) {
  const [preset, setPreset] = useState<"focus" | "short" | "long">("focus")
  const [totalSecs, setTotalSecs] = useState(25 * 60)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const isDark = theme === "dark"

  // Timer interval effect
  useEffect(() => {
    if (!running || done || !isOpen) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = Math.min(prev + 1, totalSecs)
        if (next >= totalSecs) {
          setRunning(false)
          setDone(true)
          playChime()
          setShowComplete(true)
          onSessionComplete()
          return totalSecs
        }
        return next
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, done, totalSecs, onSessionComplete, isOpen])

  const handlePresetClick = (p: "focus" | "short" | "long") => {
    const times: Record<string, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }
    setPreset(p)
    setTotalSecs(times[p])
    setElapsed(0)
    setRunning(false)
    setDone(false)
    setShowComplete(false)
  }

  const handleReset = () => {
    setElapsed(0)
    setRunning(false)
    setDone(false)
    setShowComplete(false)
  }

  const remaining = totalSecs - elapsed
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const progress = totalSecs > 0 ? (elapsed / totalSecs) : 0
  const circumference = 2 * Math.PI * 72

  const playChime = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const audioContext = new AudioCtx()
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.frequency.setValueAtTime(528, audioContext.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5)
      gain.gain.setValueAtTime(0.15, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5)
      osc.start()
      osc.stop(audioContext.currentTime + 1.5)
    } catch (e) {}
  }

  const PresetBtn = ({ type, label }: { type: "focus" | "short" | "long", label: string }) => (
    <button
      onClick={() => handlePresetClick(type)}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
        preset === type 
          ? `bg-zinc-800 text-white border-zinc-800 shadow-sm` 
          : `${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"} hover:border-zinc-300`
      }`}
    >
      {label}
    </button>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/[0.02] backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 bottom-0 z-50 flex flex-col w-[400px] shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.1)] border-l ${
              isDark ? "bg-[#141416]/95 border-zinc-800" : "bg-[#fdfcf9]/95 border-zinc-200/80"
            } backdrop-blur-3xl`}
          >
            {/* Zen Header */}
            <div className="flex items-center justify-between px-8 pt-10 pb-6">
              <div>
                <h2 className="text-2xl font-medium tracking-tight" style={{ fontFamily: '"EB Garamond", serif' }}>
                  Focus Sanctuary
                </h2>
                <div className={`text-[11px] font-bold uppercase tracking-[0.15em] mt-1 opacity-50`}>
                  Deep Work Engine
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full hover:scale-110 active:scale-95 transition-all ${isDark ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-zinc-100 text-zinc-400"}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 px-8 flex flex-col items-center justify-center -mt-10">
              {/* Presets */}
              <div className="flex gap-2 mb-12">
                <PresetBtn type="short" label="5m Break" />
                <PresetBtn type="focus" label="25m Focus" />
                <PresetBtn type="long" label="15m Deep" />
              </div>

              {/* Main Visualizer */}
              <div className="relative group">
                <svg width="240" height="240" className="transform -rotate-90">
                  <circle cx="120" cy="120" r="72" fill="none" stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} strokeWidth="8" />
                  <motion.circle
                    cx="120" cy="120" r="72" fill="none"
                    stroke={done ? "#10b981" : accent}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: circumference * (1 - progress) }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                  {/* Subtle pulsing background ring when running */}
                  {running && (
                    <motion.circle
                      cx="120" cy="120" r="72" fill="none"
                      stroke={accent}
                      strokeWidth="1"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0, 0.1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </svg>

                {/* Clock Face */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <AnimatePresence mode="wait">
                    {showComplete ? (
                      <motion.div
                        key="complete"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <div className="text-3xl text-emerald-500 mb-1">✨</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-emerald-500">Session Won</div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="time"
                        className="text-6xl font-medium tracking-tighter"
                        style={{ fontFamily: '"EB Garamond", serif', color: isDark ? "#fff" : "#18181b", fontVariantNumeric: "tabular-nums" }}
                      >
                        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Stats / Status */}
              <div className="mt-10 h-6 flex items-center justify-center">
                 <AnimatePresence mode="wait">
                   {running ? (
                      <motion.p key="running" initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -5, opacity: 0 }} className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                        Breathing with you...
                      </motion.p>
                   ) : done ? (
                      <motion.p key="done" initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500">
                        +5 Sunshine Harvested
                      </motion.p>
                   ) : (
                      <motion.p key="idle" initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                        Ready to begin?
                      </motion.p>
                   )}
                 </AnimatePresence>
              </div>
            </div>

            {/* Premium Controls */}
            <div className="px-12 pb-16 space-y-4">
              <button
                onClick={() => setRunning(!running)}
                disabled={done}
                className={`w-full py-5 rounded-2xl font-bold text-sm tracking-[0.1em] transition-all transform active:scale-[0.98] ${
                  done 
                    ? "bg-emerald-500 text-white cursor-default" 
                    : running 
                      ? "bg-zinc-800 text-white hover:bg-zinc-900" 
                      : `hover:shadow-xl hover:-translate-y-1`
                }`}
                style={!running && !done ? { backgroundColor: accent, color: "white" } : {}}
              >
                {done ? "SESSION COMPLETE" : running ? "PAUSE MOMENT" : "START SESSION"}
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className={`flex-1 py-3 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all ${
                    isDark ? "border-zinc-800 text-zinc-500 hover:bg-zinc-900" : "border-zinc-200 text-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  Restart
                </button>
                <button
                  onClick={onClose}
                  className={`flex-1 py-3 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all ${
                    isDark ? "border-zinc-800 text-zinc-500 hover:bg-zinc-900" : "border-zinc-200 text-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Zen Footer */}
            <div className={`px-12 py-8 border-t text-center leading-relaxed ${isDark ? "border-zinc-800 text-zinc-600" : "border-zinc-100 text-zinc-300"}`}>
               <p className="text-[10px] font-serif uppercase tracking-[0.15em]">Stay present. The harvest will follow.</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
