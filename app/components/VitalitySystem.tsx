"use client"
import { useState, useRef, useEffect, memo, useCallback } from "react"
import { motion } from "framer-motion"
import { TimerSidebarPanel } from "./TimerSidebarPanel"
import type { Achievement, Tree } from "@/app/types"

interface VitalitySystemProps {
  theme: "light" | "dark"
  accent: string
  totalChars: number
  onSunshineUpdate: (sunshine: number) => void
  onGemsUpdate: (gems: number) => void
  onTimerToggle: (open: boolean) => void
  checkAchievementRef: React.MutableRefObject<((id: string, update?: (a: Achievement) => Partial<Achievement>) => void) | null>
  claimAchievementRef: React.MutableRefObject<((id: string) => void) | null>
}

export const VitalitySystem = memo(function VitalitySystem({ 
  theme, accent, totalChars, onSunshineUpdate, onGemsUpdate, onTimerToggle, checkAchievementRef, claimAchievementRef 
}: VitalitySystemProps) {
  
  // ─── Timer State ───
  const [timerOpen, setTimerOpen] = useState(false)
  const [timerElapsed, setTimerElapsed] = useState(0)
  const [timerTotal, setTimerTotal] = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [timerPreset, setTimerPreset] = useState<"focus" | "short" | "long">("focus")

  // ─── Gamification State ───
  const [sunshine, setSunshine] = useState(1000)
  const [gems, setGems] = useState(5)
  const [grove, setGrove] = useState<Tree[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'caught_in_the_act', title: 'Caught in the Act!', icon: '🎭', description: 'Catch Antigravity making a secret expression.', reward: 10, rewardType: 'gems', completed: false, claimed: false },
    { id: 'novice_writer', title: 'Novice Writer', icon: '✍️', description: 'Write 1,000 characters in your notebook.', reward: 20, rewardType: 'gems', completed: false, claimed: false, progress: 0, goal: 1000 },
    { id: 'binder_buddy', title: 'Binder Buddy', icon: '📁', description: 'Create your first 3 folders.', reward: 50, rewardType: 'sunshine', completed: false, claimed: false, progress: 0, goal: 3 },
    { id: 'archivist', title: 'The Archivist', icon: '🗃️', description: 'Move 5 notes to the archive.', reward: 30, rewardType: 'gems', completed: false, claimed: false, progress: 0, goal: 5 },
    { id: 'night_owl', title: 'Night Owl', icon: '🦉', description: 'Open Pulp after 11 PM.', reward: 25, rewardType: 'sunshine', completed: false, claimed: false },
  ])
  const [lastCharCount, setLastCharCount] = useState(0)

  // Sync timer open state to parent for layout
  useEffect(() => {
    onTimerToggle(timerOpen)
  }, [timerOpen, onTimerToggle])

  // Hydration
  useEffect(() => {
    const saved = localStorage.getItem('pulp-grove')
    if (saved) {
      const data = JSON.parse(saved)
      setSunshine(data.sunshine ?? 1000)
      setGems(data.gems ?? 5)
      setGrove(data.grove || [])
      if (data.achievements) setAchievements(data.achievements)
    }

    const savedTimer = localStorage.getItem('pulp-timer')
    if (savedTimer) {
      const t = JSON.parse(savedTimer)
      setTimerTotal(t.total ?? 25 * 60)
      setTimerPreset(t.preset ?? "focus")
      setTimerDone(t.done ?? false)
      if (t.running && !t.done) {
        const elapsedSinceLast = Math.floor((Date.now() - t.timestamp) / 1000)
        const totalElapsed = (t.elapsed || 0) + elapsedSinceLast
        if (totalElapsed >= (t.total ?? 25 * 60)) {
          setTimerElapsed(t.total ?? 25 * 60)
          setTimerDone(true)
        } else {
          setTimerElapsed(totalElapsed)
          setTimerRunning(true)
        }
      } else {
        setTimerElapsed(t.elapsed ?? 0)
      }
    }
  }, [])

  // Persistence
  useEffect(() => {
    localStorage.setItem('pulp-grove', JSON.stringify({ sunshine, gems, grove, achievements }))
    onSunshineUpdate(sunshine)
    onGemsUpdate(gems)
  }, [sunshine, gems, grove, achievements, onSunshineUpdate, onGemsUpdate])

  useEffect(() => {
    localStorage.setItem('pulp-timer', JSON.stringify({
      elapsed: timerElapsed,
      total: timerTotal,
      running: timerRunning,
      done: timerDone,
      preset: timerPreset,
      timestamp: Date.now()
    }))
  }, [timerElapsed, timerTotal, timerRunning, timerDone, timerPreset])

  // Intervals
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (timerRunning && !timerDone) {
      interval = setInterval(() => {
        setTimerElapsed(prev => {
          if (prev >= timerTotal) {
            setTimerRunning(false)
            setTimerDone(true)
            return timerTotal
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning, timerDone, timerTotal])

  useEffect(() => {
    const timer = setInterval(() => {
      setSunshine(s => s + 1)
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // Achievement Methods
  const checkAchievement = useCallback((id: string, update?: (a: Achievement) => Partial<Achievement>) => {
    setAchievements(prev => prev.map(a => {
      if (a.id !== id || a.completed) return a
      const updated = update ? { ...a, ...update(a) } : { ...a, completed: true }
      if (updated.goal !== undefined && (updated.progress || 0) >= updated.goal) {
        updated.completed = true
      }
      return updated
    }))
  }, [])

  const claimAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const target = prev.find(x => x.id === id)
      if (!target || !target.completed || target.claimed) return prev
      if (target.rewardType === 'gems') setGems(g => g + target.reward)
      else setSunshine(s => s + target.reward)
      return prev.map(x => x.id === id ? { ...x, claimed: true } : x)
    })
  }, [])

  // Expose methods via refs
  useEffect(() => {
    checkAchievementRef.current = checkAchievement
    claimAchievementRef.current = claimAchievement
  }, [checkAchievement, claimAchievement, checkAchievementRef, claimAchievementRef])

  // Char count tracking (gems per 500 chars)
  useEffect(() => {
    if (totalChars > lastCharCount + 500) {
      const earned = Math.floor((totalChars - lastCharCount) / 500)
      setGems(n => n + earned)
      setLastCharCount(totalChars)
      checkAchievement('novice_writer', a => ({ progress: totalChars }))
    }
  }, [totalChars, lastCharCount, checkAchievement])

  return (
    <>
      <TimerSidebarPanel
        isOpen={timerOpen}
        onClose={() => setTimerOpen(false)}
        elapsed={timerElapsed}
        total={timerTotal}
        running={timerRunning}
        done={timerDone}
        preset={timerPreset}
        theme={theme}
        onSetRunning={setTimerRunning}
        onSetElapsed={setTimerElapsed}
        onSetTotal={setTimerTotal}
        onSetPreset={setTimerPreset}
        onSetDone={setTimerDone}
      />

      <motion.button
        onClick={() => setTimerOpen(true)}
        title="Focus Sanctuary"
        initial={{ opacity: 0, x: 20 }}
        animate={{ 
          opacity: timerOpen ? 0 : 1, 
          x: timerOpen ? 40 : 0,
          pointerEvents: timerOpen ? "none" : "auto" 
        }}
        whileHover={{ scale: 1.1, x: -5 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "fixed",
          right: 24,
          top: "50%",
          transform: "translateY(-50%)",
          width: 56,
          height: 56,
          zIndex: 2147483647,
          backgroundColor: theme === "dark" ? "#18181b" : accent,
          border: "2.5px solid white",
          borderRadius: 18,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          boxShadow: `0 10px 40px ${accent}66`,
          backdropFilter: "blur(12px)",
          padding: 0,
        }}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
        </motion.div>
      </motion.button>
    </>
  )
})
