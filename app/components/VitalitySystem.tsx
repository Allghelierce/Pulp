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
  achievements: Achievement[]
  setSunshine: React.Dispatch<React.SetStateAction<number>>
  setGems: React.Dispatch<React.SetStateAction<number>>
  setGrove: React.Dispatch<React.SetStateAction<Tree[]>>
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
  lastCharCount: number
  setLastCharCount: React.Dispatch<React.SetStateAction<number>>
  checkAchievementRef: React.RefObject<((id: string, update?: (a: Achievement) => Partial<Achievement>) => void) | null>
  claimAchievementRef: React.RefObject<((id: string) => void) | null>
}

export const VitalitySystem = memo(function VitalitySystem({
  theme, totalChars, sidebarWidth, timerOpen, onSetTimerOpen,
  sunshine, gems, grove, achievements, setSunshine, setGems, setGrove, setAchievements,
  lastCharCount, setLastCharCount,
  checkAchievementRef, claimAchievementRef,
}: VitalitySystemProps) {

  // ─── Marathon tracking (2h continuous session) ───
  const sessionStartRef = useRef(Date.now())
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000)
      checkAchievementRef.current?.('marathon', a => ({ progress: Math.min(7200, elapsed) }))
    }, 60000)
    return () => clearInterval(interval)
  }, [checkAchievementRef])

  // ─── Timer State ───
  const [timerElapsed, setTimerElapsed] = useState(0)
  const [timerTotal, setTimerTotal] = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [timerPreset, setTimerPreset] = useState<"focus" | "short" | "long">("focus")
  const [waterDeadline, setWaterDeadline] = useState<number | null>(null)
  const [treeDead, setTreeDead] = useState(false)

  const WATER_INTERVAL_MS = 8 * 60 * 1000 // 8 minutes (so 10-min sessions need watering at 8 min)
  const WATER_REQUIRED_THRESHOLD = 10 * 60 // sessions ≥ 10 minutes need watering

  // Hydration — runs once on mount for session-only data
  useEffect(() => {
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
  }, [])

  useEffect(() => {
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

  // Timer tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (timerRunning && !timerDone) {
      interval = setInterval(() => {
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

  // Achievement Methods — defined before claimReward which depends on them
  const checkAchievement = useCallback((id: string, update?: (a: Achievement) => Partial<Achievement>) => {
    setAchievements(prev => prev.map(a => {
      if (a.id !== id || a.completed) return a
      const updated = update ? { ...a, ...update(a) } : { ...a, completed: true }
      if (updated.goal !== undefined && (updated.progress || 0) >= updated.goal) {
        updated.completed = true
      }
      return updated
    }))
  }, [setAchievements])

  const claimReward = useCallback(() => {
    if (!timerDone || treeDead) return
    const reward = Math.max(1, Math.round(timerTotal / 300))
    setSunshine(s => s + reward)

    // Iron Will — count completed sessions
    checkAchievement('iron_will', a => ({ progress: (a.progress || 0) + 1 }))
    // Focus Champion — complete a 50-minute session
    if (timerTotal >= 50 * 60) checkAchievement('focus_champion')
    // Time Lord — accumulate 10 hours (36000 s) of focus time
    checkAchievement('time_lord', a => ({ progress: Math.min(36000, (a.progress || 0) + timerTotal) }))

    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setWaterDeadline(null)
  }, [timerDone, treeDead, timerTotal, setSunshine, checkAchievement])

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

  const claimAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const target = prev.find(x => x.id === id)
      if (!target || !target.completed || target.claimed) return prev
      if (target.rewardType === 'gems') setGems(g => g + target.reward)
      else setSunshine(s => s + target.reward)
      return prev.map(x => x.id === id ? { ...x, claimed: true } : x)
    })
  }, [setGems, setSunshine, setAchievements])

  useEffect(() => {
    checkAchievementRef.current = checkAchievement
    claimAchievementRef.current = claimAchievement
  }, [checkAchievement, claimAchievement, checkAchievementRef, claimAchievementRef])

  // Daily streak — runs once on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const raw = localStorage.getItem('pulp-streak')
    const { lastOpenDate = null, streak = 0 } = raw ? JSON.parse(raw) : {}
    if (lastOpenDate === today) return
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const newStreak = lastOpenDate === yesterday ? streak + 1 : 1
    localStorage.setItem('pulp-streak', JSON.stringify({ lastOpenDate: today, streak: newStreak }))
    setAchievements(prev => prev.map(a => {
      if (a.id !== 'daily_return' || a.completed) return a
      const p = Math.min(3, newStreak)
      return { ...a, progress: p, completed: p >= 3 }
    }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Leave-page warning when timer is running (focus blocker)
  useEffect(() => {
    if (!timerRunning) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [timerRunning])

  // Char count tracking & Collection Growth
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
        // Cap contribution per update to 30 chars — prevents paste abuse
        const typedDiff = Math.min(diff, 30)
        checkAchievement('dedicated_writer', a => ({ progress: Math.min(50000, (a.progress || 0) + typedDiff) }))
      }

      if (totalChars > lastCharCount + 500) {
        const earned = Math.floor((totalChars - lastCharCount) / 500)
        setGems(g => g + earned)
      }
    }
  }, [totalChars, lastCharCount, checkAchievement, setGrove, setGems, setLastCharCount])

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
