"use client"
import { useState, useEffect, useRef, memo, useCallback } from "react"
import { TimerSidebarPanel } from "./TimerSidebarPanel"
import type { Achievement, Tree } from "@/app/types"
import { TREE_TYPES } from "@/app/constants"
import { logFocusSession, logCharsWritten } from "@/app/lib/dailyStats"
import { apiFetch } from "@/lib/apiFetch"

interface VitalitySystemProps {
  theme: "light" | "dark"
  totalChars: number
  sidebarWidth: number
  timerOpen: boolean
  onSetTimerOpen: (open: boolean) => void
  onRunningChange?: (running: boolean) => void
  sap: number
  grove: Tree[]
  achievements: Achievement[]
  setSap: React.Dispatch<React.SetStateAction<number>>
  setGrove: React.Dispatch<React.SetStateAction<Tree[]>>
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
  lastCharCount: number
  setLastCharCount: React.Dispatch<React.SetStateAction<number>>
  checkAchievementRef: React.RefObject<((id: string, update?: (a: Achievement) => Partial<Achievement>) => void) | null>
  claimAchievementRef: React.RefObject<((id: string) => void) | null>
  inventory: string[]
  setInventory: React.Dispatch<React.SetStateAction<string[]>>
  activeTabId: string | null
  initialNotes: any[]
  onOpenSatchel?: () => void
  onOpenStats?: () => void
  goalStreak: number
  setGoalStreak: React.Dispatch<React.SetStateAction<number>>
  goalStreakLastDate: string
  setGoalStreakLastDate: React.Dispatch<React.SetStateAction<string>>
  dailyGoalMinutes: number
  quotaTier: 'monthly' | 'weekly' | 'daily'
  isHibernating?: boolean
  hidden?: boolean
  onStartReview?: () => void
  activeGroupId?: number | null
}

export const VitalitySystem = memo(function VitalitySystem({
  theme, totalChars, sidebarWidth, timerOpen, onSetTimerOpen, onRunningChange,
  sap, grove, achievements, setSap, setGrove, setAchievements,
  lastCharCount, setLastCharCount,
  checkAchievementRef, claimAchievementRef,
  inventory, setInventory, activeTabId, initialNotes, onOpenSatchel, onOpenStats,
  goalStreak, setGoalStreak,
  goalStreakLastDate, setGoalStreakLastDate, dailyGoalMinutes,
  quotaTier,
  isHibernating = false, hidden = false, onStartReview, activeGroupId,
}: VitalitySystemProps) {

  // ─── Marathon tracking (2h continuous session, only ticks when timer running) ───
  const sessionStartRef = useRef(Date.now())
  const groveRef = useRef(grove)
  groveRef.current = grove
  const isHibernatingRef = useRef(isHibernating)
  isHibernatingRef.current = isHibernating
  const setSapRef = useRef(setSap)
  setSapRef.current = setSap

  // ─── Timer State ───
  const GRACE_PERIOD_MS = 15 * 60 * 1000
  const _st = useRef<any>(() => {
    if (typeof window === "undefined") return null
    try {
      const s = sessionStorage.getItem('pulp-timer')
      if (s) return { ...JSON.parse(s), _source: 'session' }
      const b = localStorage.getItem('pulp-timer-backup')
      if (b) return { ...JSON.parse(b), _source: 'backup' }
    } catch { }
    return null
  })
  const _saved = useRef(_st.current())
  const _isBackup = _saved.current?._source === 'backup'
  const _backupExpired = _isBackup && _saved.current?.timestamp && (Date.now() - _saved.current.timestamp > GRACE_PERIOD_MS)
  const _wasInCancelWindow = _backupExpired && (_saved.current?.elapsed ?? 0) < 60

  const [timerElapsed, setTimerElapsed] = useState(() => {
    const t = _saved.current
    if (!t) return 0
    if (_backupExpired) return 0
    if (t.running && !t.done) {
      const elapsed = (t.elapsed || 0) + Math.floor((Date.now() - (t.timestamp || Date.now())) / 1000)
      return Math.min(elapsed, t.total ?? 25 * 60)
    }
    return t.elapsed ?? 0
  })
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(activeTabId || (initialNotes.length > 0 ? initialNotes[0].id : null))
  const [timerTotal, setTimerTotal] = useState(() => _backupExpired ? 25 * 60 : (_saved.current?.total ?? 25 * 60))
  const [timerRunning, setTimerRunning] = useState(() => {
    const t = _saved.current
    if (!t || !t.running || t.done || _backupExpired) return false
    const elapsed = (t.elapsed || 0) + Math.floor((Date.now() - (t.timestamp || Date.now())) / 1000)
    if (elapsed >= (t.total ?? 25 * 60)) return false
    if (t.waterDeadline && Date.now() > t.waterDeadline) return false
    return true
  })
  const [timerDone, setTimerDone] = useState(() => {
    const t = _saved.current
    if (!t || _backupExpired) return false
    if (t.done) return true
    if (t.running) {
      const elapsed = (t.elapsed || 0) + Math.floor((Date.now() - (t.timestamp || Date.now())) / 1000)
      return elapsed >= (t.total ?? 25 * 60)
    }
    return false
  })
  const [timerPreset, setTimerPreset] = useState<"focus" | "short" | "long">(() => _backupExpired ? "focus" : (_saved.current?.preset ?? "focus"))
  const [waterDeadline, setWaterDeadline] = useState<number | null>(() => _backupExpired ? null : (_saved.current?.waterDeadline ?? null))
  const waterDeadlineRef = useRef<number | null>(_backupExpired ? null : (_saved.current?.waterDeadline ?? null))
  const [treeDead, setTreeDead] = useState(() => {
    const t = _saved.current
    if (!t) return false
    if (_wasInCancelWindow) return false
    if (_backupExpired) return true
    return !!(t.running && !t.done && t.waterDeadline && Date.now() > t.waterDeadline)
  })
  const [deathReason, setDeathReason] = useState<string | null>(() => {
    if (_wasInCancelWindow) return null
    if (_backupExpired) return "You were away too long"
    const t = _saved.current
    if (t && t.running && !t.done && t.waterDeadline && Date.now() > t.waterDeadline) return "Your tree wasn't watered in time"
    return null
  })
  const [selectedSeed, setSelectedSeed] = useState<string | null>(() => _backupExpired ? null : (_saved.current?.selectedSeed ?? null))

  // Tab-close grace period expired — tree dies (unless was in cancel window)
  useEffect(() => {
    if (_isBackup && _backupExpired) {
      if (!_wasInCancelWindow) {
        setDeathReason("You were away too long")
      }
      localStorage.removeItem('pulp-timer-backup')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Remove unassigned trees (admin trees) globally
  useEffect(() => {
    setGrove(g => {
      const filtered = g.filter(t => t.notebookId && t.notebookId !== '_unassigned')
      return filtered.length !== g.length ? filtered : g
    })
  }, [setGrove])

  const WATER_REQUIRED_THRESHOLD = 10 * 60
  const WATER_INTERVAL_SEC = 15 * 60
  const WATER_GRACE_SEC = 90

  // Timer state is now initialized from sessionStorage in useState initializers above

  useEffect(() => {
    const data = JSON.stringify({
      elapsed: timerElapsed,
      total: timerTotal,
      running: timerRunning,
      done: timerDone,
      preset: timerPreset,
      waterDeadline,
      selectedSeed,
      timestamp: Date.now()
    })
    sessionStorage.setItem('pulp-timer', data)
    if (timerRunning) localStorage.setItem('pulp-timer-backup', data)
    else localStorage.removeItem('pulp-timer-backup')
  }, [timerElapsed, timerTotal, timerRunning, timerDone, timerPreset, waterDeadline, selectedSeed])

  useEffect(() => { waterDeadlineRef.current = waterDeadline }, [waterDeadline])

  // Report run state up so the page can lock the focus toggle while a session is live
  useEffect(() => { onRunningChange?.(timerRunning && !timerDone) }, [timerRunning, timerDone, onRunningChange])

  // Streak break detection — lose 25% sap if goal streak is broken
  const streakCheckedRef = useRef(false)
  useEffect(() => {
    if (streakCheckedRef.current || !goalStreakLastDate || isHibernating) return
    streakCheckedRef.current = true
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (goalStreakLastDate !== today && goalStreakLastDate !== yesterday && goalStreak > 0) {
      setSap(prev => Math.floor(prev * 0.75))
      setGoalStreak(0)
    }
  }, [goalStreakLastDate, goalStreak, setSap, setGoalStreak, isHibernating])

  // Request notification permission when a session starts
  useEffect(() => {
    if (timerRunning && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [timerRunning])

  // Send water reminder notification when tab is hidden
  const waterNotiSentRef = useRef(false)
  useEffect(() => {
    if (!timerRunning || !waterDeadline) { waterNotiSentRef.current = false; return }
    const check = () => {
      if (!document.hidden) { waterNotiSentRef.current = false; return }
      const wd = waterDeadlineRef.current
      if (!wd || waterNotiSentRef.current) return
      const msLeft = wd - Date.now()
      if (msLeft > 0 && msLeft < 90_000) {
        waterNotiSentRef.current = true
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const n = new Notification('Your tree needs water!', {
            body: `${Math.ceil(msLeft / 1000)}s left — come back before it wilts.`,
            icon: '/pulp_logo.svg',
            tag: 'pulp-water',
          })
          n.onclick = () => { window.focus(); n.close() }
        }
      }
    }
    document.addEventListener('visibilitychange', check)
    const interval = setInterval(check, 10_000)
    return () => { document.removeEventListener('visibilitychange', check); clearInterval(interval) }
  }, [timerRunning, waterDeadline])

  // Timer tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (timerRunning && !timerDone) {
      interval = setInterval(() => {
        const wd = waterDeadlineRef.current
        if (wd && Date.now() > wd) {
          setTimerRunning(false)
          setTreeDead(true)
          setDeathReason("Your tree wasn't watered in time")
          return
        }
        setTimerElapsed((prev: number) => {
          if (prev >= timerTotal) {
            setTimerRunning(false)
            setTimerDone(true)
            return timerTotal
          }
          const next = prev + 1
          if (next > 0 && next % 60 === 0) {
            const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000)
            checkAchievementRef.current?.('marathon', () => ({ progress: Math.min(7200, elapsed) }))
            if (!isHibernatingRef.current) {
              const groveSap = groveRef.current.reduce((sum, t) => sum + (TREE_TYPES[t.type]?.sapYield || 0), 0)
              const hour = new Date().getHours()
              const earlyBird = (hour >= 6 && (hour < 10 || (hour === 10 && new Date().getMinutes() <= 30))) ? 1 : 0
              const quotaBonus = quotaTier === 'daily' ? 2 : quotaTier === 'weekly' ? 1 : 0
              const streakBonus = Math.min(1, goalStreak / 30)
              const mult = Math.min(5, 1 + earlyBird + quotaBonus + streakBonus)
              const perMinute = Math.max(1, Math.round((groveSap / 60) * mult))
              setSapRef.current(s => s + perMinute)
            }
          }
          return next
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning, timerDone, timerTotal])

  const startSession = useCallback(() => {
    if (selectedSeed && selectedSeed !== 'tangerine') {
      const idx = inventory.indexOf(selectedSeed)
      if (idx === -1) {
        setSelectedSeed(null)
      } else {
        setInventory(inv => { const next = [...inv]; next.splice(next.indexOf(selectedSeed!), 1); return next })
      }
    }
    setSelectedNotebookId(activeTabId)
    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setDeathReason(null)
    setTimerRunning(true)
    if (activeGroupId) {
      try { window.dispatchEvent(new CustomEvent('pulp-group-session', { detail: { kind: 'start', groupId: activeGroupId, timerEnd: Date.now() + timerTotal * 1000 } })) } catch {}
    }
    setWaterCount(0)
    // Watering feature removed — sessions never require watering.
    setWaterDeadline(null)
  }, [timerTotal, activeTabId, selectedSeed, inventory, setInventory, activeGroupId])

  const [waterCount, setWaterCount] = useState(0)

  const giveUp = useCallback(() => {
    setTimerRunning(false)
    setTreeDead(true)
    setDeathReason("You gave up on your session")
    setWaterDeadline(null)
  }, [])

  const cancelSession = useCallback(() => {
    setTimerRunning(false)
    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setWaterDeadline(null)
  }, [])


  const waterClicksRef = useRef<number[]>([])
  const waterTree = useCallback(() => {
    if (!timerRunning || treeDead) return

    const now = Date.now()
    waterClicksRef.current = waterClicksRef.current.filter(t => now - t < 5000)
    waterClicksRef.current.push(now)
    if (waterClicksRef.current.length >= 10) {
      setTimerRunning(false)
      setTreeDead(true)
      setDeathReason("You overwatered your tree lol")
      waterClicksRef.current = []
      return
    }

    setWaterCount(c => c + 1)
    const remainingSec = timerTotal - timerElapsed
    if (remainingSec > WATER_INTERVAL_SEC) {
      setWaterDeadline(Date.now() + (WATER_INTERVAL_SEC + WATER_GRACE_SEC) * 1000)
    } else {
      setWaterDeadline(null)
    }
  }, [timerRunning, treeDead, timerTotal, timerElapsed])

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

  const getMultiplier = useCallback(() => {
    const hour = new Date().getHours()
    const earlyBird = (hour >= 6 && (hour < 10 || (hour === 10 && new Date().getMinutes() <= 30))) ? 1 : 0
    const quotaBonus = quotaTier === 'daily' ? 2 : quotaTier === 'weekly' ? 1 : 0
    const streakBonus = Math.min(1, goalStreak / 30)
    return Math.min(5, 1 + earlyBird + quotaBonus + streakBonus)
  }, [quotaTier, goalStreak])

  const updateGoalStreak = useCallback((sessionMinutes: number) => {
    const todayStr = new Date().toISOString().split('T')[0]
    if (goalStreakLastDate === todayStr) return

    const stats = JSON.parse(localStorage.getItem('pulp-daily-stats') || '[]')
    const todayStats = stats.find((e: any) => e.date === todayStr)
    const totalToday = (todayStats?.focusMinutes || 0) + sessionMinutes

    if (totalToday >= dailyGoalMinutes) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const isConsecutive = goalStreakLastDate === yesterday || goalStreakLastDate === ''
      if (!isConsecutive && goalStreak > 0) {
        const penalty = quotaTier === 'daily' ? 0.75 : quotaTier === 'weekly' ? 0.80 : 0.90
        setSap(prev => Math.floor(prev * penalty))
      }
      const newStreak = isConsecutive ? goalStreak + 1 : 1
      setGoalStreak(newStreak)
      setGoalStreakLastDate(todayStr)
    }
  }, [goalStreak, goalStreakLastDate, dailyGoalMinutes, quotaTier, setGoalStreak, setGoalStreakLastDate, setSap, setGrove])

  const claimReward = useCallback(async () => {
    if (!timerDone || treeDead) return
    const sessionMinutes = timerTotal / 60
    const treeType = selectedSeed || 'tangerine'
    const treeInfo = TREE_TYPES[treeType]
    const growthTarget = treeInfo?.growthMinutes || 25

    updateGoalStreak(sessionMinutes)
    logFocusSession(sessionMinutes, 0)

    checkAchievement('iron_will', a => ({ progress: (a.progress || 0) + 1 }))
    if (timerTotal >= 50 * 60) checkAchievement('focus_champion')
    checkAchievement('time_lord', a => ({ progress: Math.min(36000, (a.progress || 0) + timerTotal) }))

    const existingPartial = grove.find(t => t.type === treeType && t.growthTarget && (t.focusMinutes || 0) < t.growthTarget)

    const computeStage = (ratio: number) => ratio >= 1 ? 4 : ratio >= 0.6 ? 3 : ratio >= 0.3 ? 2 : ratio >= 0.1 ? 1 : 0

    if (activeGroupId) {
      const treeSnapshot = { type: treeType, stage: computeStage(Math.min(1, sessionMinutes / growthTarget)) }
      apiFetch('/api/groups/report', {
        method: 'POST',
        body: JSON.stringify({ groupId: activeGroupId, minutes: Math.round(sessionMinutes), tree: treeSnapshot }),
      }).catch(() => {})
      try { window.dispatchEvent(new CustomEvent('pulp-group-session', { detail: { kind: 'complete', groupId: activeGroupId } })) } catch {}
    }

    if (existingPartial) {
      const newFocus = Math.min(growthTarget, (existingPartial.focusMinutes || 0) + sessionMinutes)
      const ratio = newFocus / growthTarget
      const next = grove.map(t => t.id === existingPartial.id
        ? { ...t, focusMinutes: newFocus, stage: computeStage(ratio), progress: ratio * 100 }
        : t)
      setGrove(next)
      checkAchievement('full_grove', () => ({ progress: next.filter(t => t.type !== 'spoiled').length }))
    } else {
      const ratio = Math.min(1, sessionMinutes / growthTarget)
      const newTree = {
        id: Date.now(), type: treeType,
        stage: computeStage(ratio), progress: ratio * 100,
        plantedAt: Date.now(), notebookId: selectedNotebookId ?? undefined,
        focusMinutes: sessionMinutes, growthTarget,
      }
      const next = [...grove, newTree]
      setGrove(next)
      checkAchievement('full_grove', () => ({ progress: next.filter(t => t.type !== 'spoiled').length }))
      checkAchievement('tangerine_grove', () => ({ progress: next.filter(t => t.type === 'tangerine').length }))
    }

    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setWaterDeadline(null)
  }, [timerDone, treeDead, timerTotal, selectedSeed, setGrove, checkAchievement, activeTabId, grove, setSap, updateGoalStreak, isHibernating, activeGroupId])

  const handleClose = useCallback(() => onSetTimerOpen(false), [onSetTimerOpen])

  const dismissDeadTree = useCallback(() => {
    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setDeathReason(null)
    setWaterDeadline(null)
  }, [])

  const claimAchievement = useCallback((id: string) => {
    const target = achievements.find(x => x.id === id)
    if (!target || !target.completed || target.claimed) return
    setSap(s => s + target.reward)
    setAchievements(prev => prev.map(x => x.id === id && !x.claimed ? { ...x, claimed: true } : x))
  }, [achievements, setSap, setAchievements])

  useEffect(() => {
    checkAchievementRef.current = checkAchievement
    claimAchievementRef.current = claimAchievement
  }, [checkAchievement, claimAchievement, checkAchievementRef, claimAchievementRef])


  // Clean up localStorage backup when timer stops
  useEffect(() => {
    if (!timerRunning) localStorage.removeItem('pulp-timer-backup')
  }, [timerRunning])

  // Notify extension of timer state for site blocking
  useEffect(() => {
    window.postMessage({ type: "pulp-timer-state", timerRunning }, "*")
  }, [timerRunning])

  // Char count tracking & Collection Growth
  useEffect(() => {
    if (totalChars > lastCharCount) {
      const diff = totalChars - lastCharCount
      if (diff >= 100) {
        setGrove(prev => prev.filter(Boolean).map(tree => {
          if (tree.type === 'spoiled' || tree.stage >= 4) return tree
          const newProgress = (tree.progress || 0) + (diff / 100) * 5
          const newStage = Math.min(4, Math.floor(newProgress / 25))
          return { ...tree, progress: newProgress, stage: newStage }
        }))
        setLastCharCount(totalChars)
        logCharsWritten(diff)
        const typedDiff = Math.min(diff, 30)
        checkAchievement('dedicated_writer', a => ({ progress: Math.min(50000, (a.progress || 0) + typedDiff) }))
        checkAchievement('wordsmith', a => ({ progress: Math.min(200000, (a.progress || 0) + typedDiff) }))
      }

    }
  }, [totalChars, lastCharCount, checkAchievement, setGrove, setLastCharCount])

  return (
    <TimerSidebarPanel
      isOpen={timerOpen}
      onClose={handleClose}
      elapsed={timerElapsed}
      total={timerTotal}
      running={timerRunning}
      done={timerDone}
      preset={timerPreset}
      theme={theme}
      sidebarWidth={sidebarWidth}
      waterDeadline={waterDeadline}
      treeDead={treeDead}
      deathReason={deathReason}
      onSetTotal={setTimerTotal}
      onSetPreset={setTimerPreset}
      onStart={startSession}
      onGiveUp={giveUp}
      onCancel={cancelSession}
      onWater={waterTree}
      onClaim={claimReward}
      onDismissDead={dismissDeadTree}
      inventory={inventory}
      selectedSeed={selectedSeed}
      onSelectSeed={setSelectedSeed}
      onOpenSatchel={onOpenSatchel}
      grove={grove}
      goalStreak={goalStreak}
      quotaTier={quotaTier}
      dailyGoalMinutes={dailyGoalMinutes}
      onOpenStats={onOpenStats}
      isHibernating={isHibernating}
      hidden={hidden}
      onStartReview={onStartReview}
    />
  )
})
