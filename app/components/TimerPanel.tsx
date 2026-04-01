"use client"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"

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

  // Timer interval effect
  useEffect(() => {
    if (!running || done) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (next >= totalSecs) {
          setRunning(false)
          setDone(true)
          playChime()
          setShowComplete(true)
          onSessionComplete()
          setTimeout(() => setShowComplete(false), 3000)
          return totalSecs
        }
        return next
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, done, totalSecs, onSessionComplete])

  // Preset change handler
  const handlePresetClick = (p: "focus" | "short" | "long") => {
    const times: Record<string, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }
    setPreset(p)
    setTotalSecs(times[p])
    setElapsed(0)
    setRunning(false)
    setDone(false)
  }

  const handleReset = () => {
    setElapsed(0)
    setRunning(false)
    setDone(false)
  }

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const percent = totalSecs > 0 ? (elapsed / totalSecs) * 100 : 0
  const circumference = 2 * Math.PI * 54

  const playChime = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const audioContext = new AudioCtx()
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.frequency.value = 528
      gain.gain.setValueAtTime(0.25, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2)
      osc.start()
      osc.stop(audioContext.currentTime + 2)
    } catch (e) {
      // Audio context not available
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed right-0 top-12 bottom-0 z-40 flex flex-col w-80 shadow-2xl border-l ${
        theme === "dark"
          ? "bg-[#0f0f12] border-zinc-800"
          : "bg-[#fdfcf9] border-zinc-200"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        theme === "dark" ? "border-zinc-800" : "border-zinc-200"
      }`}>
        <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-dancing), cursive', color: accent }}>
          Focus Timer
        </h2>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
        {/* Preset Buttons */}
        <div className="space-y-3">
          <p className={`text-xs font-bold uppercase tracking-widest ${
            theme === "dark" ? "text-zinc-500" : "text-zinc-600"
          }`}>
            Presets
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePresetClick("short")}
              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                preset === "short"
                  ? `bg-orange-500 text-white border-orange-500`
                  : `${theme === "dark" ? "bg-zinc-900 border-zinc-700 hover:border-zinc-600" : "bg-white border-zinc-200 hover:border-zinc-300"}`
              }`}
            >
              Short 5
            </button>
            <button
              onClick={() => handlePresetClick("focus")}
              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                preset === "focus"
                  ? `bg-orange-500 text-white border-orange-500`
                  : `${theme === "dark" ? "bg-zinc-900 border-zinc-700 hover:border-zinc-600" : "bg-white border-zinc-200 hover:border-zinc-300"}`
              }`}
            >
              Focus 25
            </button>
            <button
              onClick={() => handlePresetClick("long")}
              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                preset === "long"
                  ? `bg-orange-500 text-white border-orange-500`
                  : `${theme === "dark" ? "bg-zinc-900 border-zinc-700 hover:border-zinc-600" : "bg-white border-zinc-200 hover:border-zinc-300"}`
              }`}
            >
              Long 15
            </button>
          </div>
        </div>

        {/* Circular Timer */}
        <div className="flex flex-col items-center justify-center space-y-6 flex-1">
          <div className="relative w-40 h-40">
            <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
              {/* Background ring */}
              <circle
                cx="80"
                cy="80"
                r="54"
                fill="none"
                stroke={theme === "dark" ? "#27272a" : "#e4e4e7"}
                strokeWidth="3"
              />
              {/* Progress ring */}
              <motion.circle
                cx="80"
                cy="80"
                r="54"
                fill="none"
                stroke={done ? "#10b981" : accent}
                strokeWidth="3"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
                transition={{ duration: 0.3 }}
                strokeLinecap="round"
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-4xl font-bold font-serif" style={{ color: accent }}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <div className={`text-xs uppercase tracking-widest font-bold mt-1 ${
                theme === "dark" ? "text-zinc-500" : "text-zinc-600"
              }`}>
                {preset === "focus" ? "Focus" : preset === "short" ? "Break" : "Long Break"}
              </div>
            </div>
          </div>

          {/* Completion flash */}
          {showComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute text-center"
            >
              <div className={`text-lg font-bold ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                ✓ Session Complete!
              </div>
              <div className={`text-sm mt-1 ${theme === "dark" ? "text-emerald-300" : "text-emerald-600"}`}>
                +5 ☀️ Sunshine
              </div>
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setRunning(!running)}
            disabled={done}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all text-white ${
              done
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 active:scale-95"
            }`}
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={handleReset}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold border transition-all ${
              theme === "dark"
                ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-6 py-3 border-t text-center text-xs ${
        theme === "dark" ? "border-zinc-800 text-zinc-500" : "border-zinc-200 text-zinc-600"
      }`}>
        Stay focused, grow your grove
      </div>
    </motion.div>
  )
}
