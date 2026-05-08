"use client"
import { useState, useEffect, useRef, memo, useCallback } from "react"
import { TimerSidebarPanel } from "./TimerSidebarPanel"
import type { Achievement, Tree } from "@/app/types"
import { logFocusSession, logCharsWritten } from "@/app/lib/dailyStats"
import { apiFetch } from "@/lib/apiFetch"

interface VitalitySystemProps {
  theme: "light" | "dark"
  totalChars: number
  sidebarWidth: number
  timerOpen: boolean
  onSetTimerOpen: (open: boolean) => void
  juice: number
  gems: number
  xp: number
  grove: Tree[]
  achievements: Achievement[]
  setJuice: React.Dispatch<React.SetStateAction<number>>
  setGems: React.Dispatch<React.SetStateAction<number>>
  setXp: React.Dispatch<React.SetStateAction<number>>
  setGrove: React.Dispatch<React.SetStateAction<Tree[]>>
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
  lastCharCount: number
  setLastCharCount: React.Dispatch<React.SetStateAction<number>>
  checkAchievementRef: React.RefObject<((id: string, update?: (a: Achievement) => Partial<Achievement>) => void) | null>
  claimAchievementRef: React.RefObject<((id: string) => void) | null>
  inventory: string[]
  activeTabId: string | null
  notes: any[]
}

export const VitalitySystem = memo(function VitalitySystem({
  theme, totalChars, sidebarWidth, timerOpen, onSetTimerOpen,
  juice, gems, xp, grove, achievements, setJuice, setGems, setXp, setGrove, setAchievements,
  lastCharCount, setLastCharCount,
  checkAchievementRef, claimAchievementRef,
  inventory, activeTabId, notes,
}: VitalitySystemProps) {

  // ─── Marathon tracking (2h continuous session, only ticks when timer running) ───
  const sessionStartRef = useRef(Date.now())

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
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(activeTabId || (notes.length > 0 ? notes[0].id : null))
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

  // Tab-close grace period expired — penalize (unless was in cancel window)
  useEffect(() => {
    if (_isBackup && _backupExpired) {
      if (!_wasInCancelWindow) {
        setJuice(j => Math.floor(j * 0.75))
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

  const WATER_INTERVAL_MS = 8 * 60 * 1000 // 8 minutes (so 10-min sessions need watering at 8 min)
  const WATER_REQUIRED_THRESHOLD = 10 * 60 // sessions ≥ 10 minutes need watering

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
          }
          if (next > 0 && next % 600 === 0 && Math.random() < 0.125) {
            setGems(g => g + 1)
          }
          return next
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning, timerDone, timerTotal])

  const startSession = useCallback(() => {
    setSelectedNotebookId(activeTabId)
    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setDeathReason(null)
    setTimerRunning(true)
    if (timerTotal >= WATER_REQUIRED_THRESHOLD) {
      setWaterDeadline(Date.now() + WATER_INTERVAL_MS)
    } else {
      setWaterDeadline(null)
    }
  }, [timerTotal, activeTabId])

  const [lostJuice, setLostJuice] = useState(0)

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

  const recoverJuice = useCallback(() => {
    const cost = Math.max(1, Math.ceil(lostJuice * 0.02))
    if (gems < cost || lostJuice <= 0) return
    setGems(g => g - cost)
    setJuice(s => s + lostJuice)
    setLostJuice(0)
  }, [lostJuice, gems, setGems, setJuice])

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

  const claimReward = useCallback(async () => {
    if (!timerDone || treeDead) return
    const minutes = timerTotal / 60
    const treeType = selectedSeed || 'tangerine'

    logFocusSession(minutes, 0)

    checkAchievement('iron_will', a => ({ progress: (a.progress || 0) + 1 }))
    if (timerTotal >= 50 * 60) checkAchievement('focus_champion')
    checkAchievement('time_lord', a => ({ progress: Math.min(36000, (a.progress || 0) + timerTotal) }))

    try {
      const res = await apiFetch('/api/grove', {
        method: 'POST',
        body: JSON.stringify({ treeType, notebookId: selectedNotebookId, timerDuration: timerTotal }),
      })
      if (res.ok) {
        const data = await res.json()
        setJuice(data.juice)
        setXp(x => x + data.xpReward)
        if (data.tree) {
          setGrove(g => {
            const next = [...g, data.tree]
            checkAchievement('full_grove', a => ({ progress: next.filter(t => t.type !== 'spoiled').length }))
            checkAchievement('tangerine_grove', a => ({ progress: next.filter(t => t.type === 'tangerine').length }))
            return next
          })
        }
      } else {
        const reward = Math.max(1, Math.round(minutes * 0.4 + Math.pow(minutes / 10, 1.5)))
        setJuice(s => s + reward)
        setXp(x => x + Math.max(5, Math.round(minutes * 2)))
        setGrove(g => [...g, { id: Date.now(), type: treeType, stage: 4, progress: 100, plantedAt: Date.now(), notebookId: selectedNotebookId ?? undefined }])
      }
    } catch {
      const reward = Math.max(1, Math.round(minutes * 0.4 + Math.pow(minutes / 10, 1.5)))
      setJuice(s => s + reward)
      setXp(x => x + Math.max(5, Math.round(minutes * 2)))
      setGrove(g => [...g, { id: Date.now(), type: treeType, stage: 4, progress: 100, plantedAt: Date.now(), notebookId: selectedNotebookId ?? undefined }])
    }

    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setWaterDeadline(null)
  }, [timerDone, treeDead, timerTotal, selectedSeed, setJuice, setXp, setGrove, checkAchievement, activeTabId])

  const dismissDeadTree = useCallback(() => {
    const lost = Math.ceil(juice * 0.25)
    setLostJuice(lost)
    setJuice(j => j - lost)
    setTimerElapsed(0)
    setTimerDone(false)
    setTreeDead(false)
    setDeathReason(null)
    setWaterDeadline(null)
  }, [juice, setJuice])

  const claimAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const target = prev.find(x => x.id === id)
      if (!target || !target.completed || target.claimed) return prev
      if (target.rewardType === 'gems') setGems(g => g + target.reward)
      else setJuice(s => s + target.reward)
      setXp(x => x + target.reward * 5)
      return prev.map(x => x.id === id ? { ...x, claimed: true } : x)
    })
  }, [setGems, setJuice, setXp, setAchievements])

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
        const xpFromWriting = Math.max(1, Math.floor(typedDiff / 10))
        setXp(x => x + xpFromWriting)
        setJuice(s => s + Math.max(1, Math.floor(typedDiff / 15)))
      }

    }
  }, [totalChars, lastCharCount, checkAchievement, setGrove, setGems, setXp, setJuice, setLastCharCount])

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
      deathReason={deathReason}
      onSetTotal={setTimerTotal}
      onSetPreset={setTimerPreset}
      onStart={startSession}
      onGiveUp={giveUp}
      onCancel={cancelSession}
      onWater={waterTree}
      onClaim={claimReward}
      onDismissDead={dismissDeadTree}
      lostJuice={lostJuice}
      gems={gems}
      onRecoverJuice={recoverJuice}
      inventory={inventory}
      selectedSeed={selectedSeed}
      onSelectSeed={setSelectedSeed}
    />
  )
})
