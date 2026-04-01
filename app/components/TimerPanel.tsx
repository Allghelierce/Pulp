"use client"
import { useRef, useEffect, useCallback, memo } from "react"
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
  onSetElapsed: (v: number | ((prev: number) => number)) => void
  onSetTotal: (v: number) => void
  onSetPreset: (v: "focus" | "short" | "long") => void
  onSetDone: (v: boolean) => void
  onSessionCancel?: (ratio: number) => void
}

export const TimerPanel = memo(function TimerPanel({
  isOpen, onClose, theme, accent,
  elapsed, total, running, done, preset,
  onSetRunning, onSetElapsed, onSetTotal, onSetPreset, onSetDone, onSessionCancel
}: TimerPanelProps) {
  const isDark = theme === "dark"
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const remainingTime = total - elapsed
  const m = Math.floor(remainingTime / 60)
  const s = remainingTime % 60
  const timeText = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`

  const playChime = useCallback(() => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 528
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
      osc.start()
      osc.stop(ctx.currentTime + 2)
    } catch (e) {}
  }, [])

  // Timer interval
  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      onSetElapsed((prev: number) => {
        const newElapsed = prev + 1
        if (newElapsed >= total) {
          onSetRunning(false)
          onSetDone(true)
          playChime()
          return total
        }
        return newElapsed
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [running, total, onSetElapsed, onSetRunning, onSetDone, playChime])

  const handlePresetClick = (p: "focus" | "short" | "long") => {
    const times: Record<string, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }
    onSetPreset(p)
    onSetTotal(times[p])
    onSetElapsed(0)
    onSetRunning(false)
    onSetDone(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className={`fixed right-0 top-0 bottom-0 z-40 w-80 flex flex-col ${isDark ? "bg-[#151518] border-l border-zinc-800" : "bg-white border-l border-zinc-200"} shadow-2xl`}
        >
          {/* Header */}
          <div className={`px-6 py-4 border-b ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wide" style={{ fontFamily: '"EB Garamond", serif' }}>
                Focus
              </h2>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-zinc-800 text-zinc-500" : "hover:bg-zinc-100 text-zinc-400"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-8">
            {/* Timer Display */}
            <div className="text-center">
              <motion.div
                animate={{ scale: running ? [1, 1.02, 1] : 1 }}
                transition={{ duration: 1, repeat: running ? Infinity : 0 }}
                className="text-5xl font-bold tabular-nums mb-4"
                style={{ fontFamily: '"EB Garamond", serif', color: isDark ? "#fff" : "#1a1a1a" }}
              >
                {timeText}
              </motion.div>

              {/* Progress Ring */}
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke={isDark ? "#27272a" : "#e4e4e7"} strokeWidth="2" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={accent}
                    strokeWidth="2"
                    strokeDasharray={`${Math.PI * 90} ${Math.PI * 90}`}
                    strokeDashoffset={Math.PI * 90 * (1 - elapsed / total)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
              </div>
            </div>

            {/* Presets */}
            <div className="w-full flex gap-2 justify-center">
              {(["short", "focus", "long"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => handlePresetClick(p)}
                  disabled={running}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                    preset === p && !running
                      ? `text-white`
                      : isDark
                      ? "text-zinc-500 hover:text-zinc-300"
                      : "text-zinc-400 hover:text-zinc-600"
                  } ${running ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={preset === p && !running ? { backgroundColor: accent } : {}}
                >
                  {p === "short" ? "5m" : p === "focus" ? "25m" : "15m"}
                </button>
              ))}
            </div>

            {/* Control Button */}
            <button
              onClick={() => {
                if (done) {
                  onSetElapsed(0)
                  onSetRunning(false)
                  onSetDone(false)
                  onClose()
                } else {
                  onSetRunning(!running)
                }
              }}
              className="w-full py-3 rounded-lg font-bold text-white text-sm uppercase tracking-wider transition-all active:scale-95"
              style={{ backgroundColor: accent }}
            >
              {done ? "Done" : running ? "Pause" : "Start"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
