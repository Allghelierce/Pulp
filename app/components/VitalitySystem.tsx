"use client"
import { useState, useEffect, useRef, memo, useCallback } from "react"
import { TimerSidebarPanel } from "./TimerSidebarPanel"
import type { Achievement, Tree } from "@/app/types"

interface VitalitySystemProps {
  theme: "light" | "dark"
  totalChars: number
  sidebarWidth: number
  timerOpen: boolean
  onSetTimerOpen: (open: boolean) => void
  sunshine: number
  gems: number
  grove: Tree[]
  setSunshine: React.Dispatch<React.SetStateAction<number>>
  setGems: React.Dispatch<React.SetStateAction<number>>
  setGrove: React.Dispatch<React.SetStateAction<Tree[]>>
  checkAchievementRef: React.RefObject<((id: string, update?: (a: Achievement) => Partial<Achievement>) => void) | null>
  claimAchievementRef: React.RefObject<((id: string) => void) | null>
}

export const VitalitySystem = memo(function VitalitySystem({
  theme, totalChars, sidebarWidth, timerOpen, onSetTimerOpen,
  sunshine, gems, grove, setSunshine, setGems, setGrove,
  checkAchievementRef, claimAchievementRef,
}: VitalitySystemProps) {

  // ─── Timer State ───
  const [timerElapsed, setTimerElapsed] = useState(0)
  const [timerTotal, setTimerTotal] = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [timerPreset, setTimerPreset] = useState<"focus" | "short" | "long">("focus")
  const [waterDeadline, setWaterDeadline] = useState<number | null>(null)
  const [treeDead, setTreeDead] = useState(false)

  const WATER_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes
  const WATER_REQUIRED_THRESHOLD = 10 * 60 // sessions ≥ 10 minutes need watering

  // ─── Achievements State ───
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'caught_in_the_act', title: 'Caught in the Act!', icon: '🎭', description: 'Catch Antigravity making a secret expression.', reward: 10, rewardType: 'gems', completed: false, claimed: false },
    { id: 'novice_writer', title: 'Novice Writer', icon: '✍️', description: 'Write 1,000 characters in your notebook.', reward: 20, rewardType: 'gems', completed: false, claimed: false, progress: 0, goal: 1000 },
    { id: 'binder_buddy', title: 'Binder Buddy', icon: '📁', description: 'Create your first 3 folders.', reward: 50, rewardType: 'sunshine', completed: false, claimed: false, progress: 0, goal: 3 },
    { id: 'archivist', title: 'The Archivist', icon: '🗃️', description: 'Move 5 notes to the archive.', reward: 30, rewardType: 'gems', completed: false, claimed: false, progress: 0, goal: 5 },
    { id: 'night_owl', title: 'Night Owl', icon: '🦉', description: 'Open Pulp after 11 PM.', reward: 25, rewardType: 'sunshine', completed: false, claimed: false },
  ])
  const [lastCharCount, setLastCharCount] = useState(0)
  const hydratedRef = useRef(false)

  // Hydration — runs once on mount before persistence is allowed to write
  useEffect(() => {
    const saved = localStorage.getItem('pulp-grove')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.achievements) setAchievements(data.achievements)
    }

    // Active timer lives in sessionStorage so closing the tab forfeits the session
    const savedTimer = sessionStorage.getItem('pulp-timer')
    if (savedTimer) {
      const t = JSON.parse(savedTimer)
      setTimerTotal(t.total ?? 25 * 60)
      setTimerPreset(t.preset ?? "focus")
      setTimerDone(t.done ?? false)
      setWaterDeadline(t.waterDeadline ?? null)
      if (t.running && !t.done) {
        const elapsedSinceLast = Math.floor((Date.now() - t.timestamp) / 1000)
        const totalElapsed = (t.elapsed || 0) + elapsedSinceLast
        const totalCap = t.total ?? 25 * 60
        if (totalElapsed >= totalCap) {
          setTimerElapsed(totalCap)
          setTimerDone(true)
        } else if (t.waterDeadline && Date.now() > t.waterDeadline) {
          // Missed the watering window while tab was reloading
          setTimerElapsed(totalElapsed)
          setTreeDead(true)
        } else {
          setTimerElapsed(totalElapsed)
          setTimerRunning(true)
        }
      } else {
        setTimerElapsed(t.elapsed ?? 0)
      }
    }
    hydratedRef.current = true
  }, [])

  // Persistence — gated by hydratedRef so the initial render doesn't overwrite saved state
  useEffect(() => {
    if (!hydratedRef.current) return
    localStorage.setItem('pulp-grove', JSON.stringify({ sunshine, gems, grove, achievements }))
  }, [sunshine, gems, grove, achievements])

  useEffect(() => {
    if (!hydratedRef.current) return
    sessionStorage.setItem('pulp-timer', JSON.stringify({
      elapsed: timerElapsed,
      total: timerTotal,
      running: timerRunning,
      done: timerDone,
      preset: timerPreset,
      waterDeadline,
      timestamp: Date.now()
    }))
  }, [timerElapsed, timerTotal, timerRunning, timerDone, timerPreset, waterDeadline])

  // Timer tick — advances elapsed and checks the water deadline each second
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (timerRunning && !timerDone) {
      interval = setInterval(() => {
        // Watering check first — if missed, kill the tree and stop the session
        if (waterDeadline && Date.now() > waterDeadline) {
          setTimerRunning(false)
          setTreeDead(true)
          return
        }
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
  }, [timerRunning, timerDone, timerTotal, waterDeadline])

  // Session control handlers passed down to the panel
  const startSession = useCallback(() => {
    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setTimerRunning(true)
    if (timerTotal >= WATER_REQUIRED_THRESHOLD) {
      setWaterDeadline(Date.now() + WATER_INTERVAL_MS)
    } else {
      setWaterDeadline(null)
    }
  }, [timerTotal])

  const giveUp = useCallback(() => {
    setTimerRunning(false)
    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setWaterDeadline(null)
  }, [])

  const waterTree = useCallback(() => {
    if (!timerRunning || treeDead) return
    setWaterDeadline(Date.now() + WATER_INTERVAL_MS)
  }, [timerRunning, treeDead])

  const claimReward = useCallback(() => {
    if (!timerDone || treeDead) return
    const reward = timerTotal === 15 * 60 ? 2 : timerTotal === 25 * 60 ? 5 : 3
    setSunshine(s => s + reward)
    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setWaterDeadline(null)
  }, [timerDone, treeDead, timerTotal, setSunshine])

  const dismissDeadTree = useCallback(() => {
    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setWaterDeadline(null)
  }, [])

  // Passive sunshine gain
  useEffect(() => {
    const timer = setInterval(() => {
      setSunshine(s => s + 1)
    }, 30000)
    return () => clearInterval(timer)
  }, [setSunshine])

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
  }, [setGems, setSunshine])

  // Expose methods via refs
  useEffect(() => {
    checkAchievementRef.current = checkAchievement
    claimAchievementRef.current = claimAchievement
  }, [checkAchievement, claimAchievement, checkAchievementRef, claimAchievementRef])

  // Char count tracking & Tree Growth
  useEffect(() => {
    if (totalChars > lastCharCount) {
      const diff = totalChars - lastCharCount
      if (diff >= 100) {
        setGrove(prev => prev.map(tree => {
          if (tree.type === 'spoiled' || tree.stage >= 4) return tree
          const newProgress = (tree.progress || 0) + (diff / 100) * 5
          const newStage = Math.min(4, Math.floor(newProgress / 25))
          return { ...tree, progress: newProgress, stage: newStage }
        }))
        setLastCharCount(totalChars)
      }

      if (totalChars > lastCharCount + 500) {
        const earned = Math.floor((totalChars - lastCharCount) / 500)
        setGems(g => g + earned)
        checkAchievement('novice_writer', () => ({ progress: totalChars }))
      }
    }
  }, [totalChars, lastCharCount, checkAchievement, setGrove, setGems])

  return (
    <TimerSidebarPanel
      isOpen={timerOpen}
      onClose={() => onSetTimerOpen(false)}
      elapsed={timerElapsed}
      total={timerTotal}
      running={timerRunning}
      done={timerDone}
      preset={timerPreset}
      theme={theme}
      sidebarWidth={sidebarWidth}
      waterDeadline={waterDeadline}
      treeDead={treeDead}
      onSetTotal={setTimerTotal}
      onSetPreset={setTimerPreset}
      onStart={startSession}
      onGiveUp={giveUp}
      onWater={waterTree}
      onClaim={claimReward}
      onDismissDead={dismissDeadTree}
    />
  )
})
