import { create } from "zustand"
import type { Tree, Achievement } from "@/app/types"

interface GroveState {
  sap: number
  essence: number
  grove: Tree[]
  inventory: string[]
  achievements: Achievement[]
  lastCharCount: number
  unlockedCosmetics: string[]
  goalStreak: number
  goalStreakLastDate: string
  dailyGoalMinutes: number
  quotaTier: 'monthly' | 'weekly' | 'daily'
  quotaLockedUntil: string
  hibernation: { startDate: string; endDate: string; streakFrozen: number } | null
  hibernationScheduled: { startDate: string; endDate: string } | null
  streakNudgeDismissed: boolean

  setSap: (v: number | ((prev: number) => number)) => void
  setEssence: (v: number | ((prev: number) => number)) => void
  setGrove: (v: Tree[] | ((prev: Tree[]) => Tree[])) => void
  setInventory: (v: string[] | ((prev: string[]) => string[])) => void
  setAchievements: (v: Achievement[] | ((prev: Achievement[]) => Achievement[])) => void
  setLastCharCount: (v: number | ((prev: number) => number)) => void
  setUnlockedCosmetics: (v: string[] | ((prev: string[]) => string[])) => void
  setGoalStreak: (v: number | ((prev: number) => number)) => void
  setGoalStreakLastDate: (v: string | ((prev: string) => string)) => void
  setDailyGoalMinutes: (v: number) => void
  setQuotaTier: (v: 'monthly' | 'weekly' | 'daily') => void
  setQuotaLockedUntil: (v: string) => void
  setHibernation: (v: { startDate: string; endDate: string; streakFrozen: number } | null) => void
  setHibernationScheduled: (v: { startDate: string; endDate: string } | null) => void
  setStreakNudgeDismissed: (v: boolean) => void
}

export const useGroveStore = create<GroveState>((set) => ({
  sap: 50,
  essence: 0,
  grove: [],
  inventory: [],
  achievements: [
    { id: 'first_note', title: 'First Leaf', icon: '🌱', description: 'Create your very first notebook in Pulp.', reward: 1, rewardType: 'time', completed: false, claimed: false },
    { id: 'dedicated_writer', title: 'Inkblood', icon: '🩸', description: 'Type 50,000 characters by hand — pasting won\'t count.', reward: 3, rewardType: 'time', completed: false, claimed: false, progress: 0, goal: 50000 },
    { id: 'wordsmith', title: 'Wordsmith', icon: '✒️', description: 'Type 200,000 characters by hand — a small novel.', reward: 6, rewardType: 'time', completed: false, claimed: false, progress: 0, goal: 200000 },
    { id: 'full_grove', title: 'Groundskeeper', icon: '🌳', description: 'Grow 25 trees in your orchard.', reward: 3, rewardType: 'time', completed: false, claimed: false, progress: 0, goal: 25 },
    { id: 'night_owl', title: 'Night Owl', icon: '🦉', description: 'Open Pulp between 3 and 4 AM.', reward: 1, rewardType: 'time', completed: false, claimed: false },
    { id: 'focus_champion', title: 'Focus Champion', icon: '🏆', description: 'Complete a full 50-minute focus session without breaking.', reward: 2, rewardType: 'time', completed: false, claimed: false },
    { id: 'iron_will', title: 'Iron Will', icon: '🔥', description: 'Complete 30 focus sessions of any length.', reward: 3, rewardType: 'time', completed: false, claimed: false, progress: 0, goal: 30 },
    { id: 'daily_return', title: 'Creature of Habit', icon: '📅', description: 'Open Pulp 30 days in a row — no breaks.', reward: 12, rewardType: 'time', completed: false, claimed: false, progress: 0, goal: 30 },
    { id: 'time_lord', title: 'Time Lord', icon: '⏱️', description: 'Accumulate 10 hours of total focus time.', reward: 3, rewardType: 'time', completed: false, claimed: false, progress: 0, goal: 36000 },
    { id: 'marathon', title: 'Marathon', icon: '🏃', description: 'Write continuously for 2 hours in a single session without closing Pulp.', reward: 2, rewardType: 'time', completed: false, claimed: false, progress: 0, goal: 7200 },
    { id: 'tangerine_grove', title: 'Pulp Fiction', icon: '🍊', description: 'Grow 100 tangerine trees — the signature fruit of Pulp.', reward: 10, rewardType: 'time', completed: false, claimed: false, progress: 0, goal: 100 },
  ],
  lastCharCount: 0,
  unlockedCosmetics: [],
  goalStreak: 0,
  goalStreakLastDate: '',
  dailyGoalMinutes: 30,
  quotaTier: 'monthly',
  quotaLockedUntil: '',
  hibernation: null,
  hibernationScheduled: null,
  streakNudgeDismissed: false,

  setSap: (v) => set((s) => ({ sap: typeof v === 'function' ? v(s.sap) : v })),
  setEssence: (v) => set((s) => ({ essence: typeof v === 'function' ? v(s.essence) : v })),
  setGrove: (v) => set((s) => ({ grove: typeof v === 'function' ? v(s.grove) : v })),
  setInventory: (v) => set((s) => ({ inventory: typeof v === 'function' ? v(s.inventory) : v })),
  setAchievements: (v) => set((s) => ({ achievements: typeof v === 'function' ? v(s.achievements) : v })),
  setLastCharCount: (v) => set((s) => ({ lastCharCount: typeof v === 'function' ? v(s.lastCharCount) : v })),
  setUnlockedCosmetics: (v) => set((s) => ({ unlockedCosmetics: typeof v === 'function' ? v(s.unlockedCosmetics) : v })),
  setGoalStreak: (v) => set((s) => ({ goalStreak: typeof v === 'function' ? v(s.goalStreak) : v })),
  setGoalStreakLastDate: (v) => set((s) => ({ goalStreakLastDate: typeof v === 'function' ? v(s.goalStreakLastDate) : v })),
  setDailyGoalMinutes: (v) => set(() => ({ dailyGoalMinutes: v })),
  setQuotaTier: (v) => set(() => ({ quotaTier: v })),
  setQuotaLockedUntil: (v) => set(() => ({ quotaLockedUntil: v })),
  setHibernation: (v) => set(() => ({ hibernation: v })),
  setHibernationScheduled: (v) => set(() => ({ hibernationScheduled: v })),
  setStreakNudgeDismissed: (v) => set(() => ({ streakNudgeDismissed: v })),
}))

export const selectGroveData = (s: GroveState) => ({
  juice: s.sap,
  essence: s.essence,
  grove: s.grove,
  inventory: s.inventory,
  achievements: s.achievements,
  lastCharCount: s.lastCharCount,
  unlockedCosmetics: s.unlockedCosmetics,
  goalStreak: s.goalStreak,
  goalStreakLastDate: s.goalStreakLastDate,
  dailyGoalMinutes: s.dailyGoalMinutes,
  quotaTier: s.quotaTier,
  quotaLockedUntil: s.quotaLockedUntil,
  hibernation: s.hibernation,
  hibernationScheduled: s.hibernationScheduled,
})
