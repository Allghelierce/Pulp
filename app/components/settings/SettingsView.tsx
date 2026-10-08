"use client"
import { shortcutFromEvent, isModifierKey, formatShortcut } from "@/lib/shortcuts"
import { useState, useEffect, useRef, useCallback, memo } from "react"
import { fetchPlan, startCheckout as startPlusCheckout, openBillingPortal as openPlusPortal, PLUS_PRICE, type PlanStatus, type PlusPlan } from "@/lib/billing"
import { generateUsername } from "@/lib/usernames"
import { getSoundPrefs, setSoundPrefs, playSound, type SoundPrefs } from "@/lib/sound"
import { supabase } from "@/lib/supabase"
import { SettingToggle } from "./SettingToggle"
import { SettingRow } from "./SettingRow"
import type { PaperStyle } from "@/app/lib/paperStyle"
import { PulpIcon, GemIcon } from '@/app/components/CurrencyIcons'
import { SettingSection } from "./SettingSection"
import { PricingSection } from "@/components/blocks/pricing-section"
import { Zap, Sparkles } from "lucide-react"
import { ACCENT, ACCENT_CONTRAST, accentAlpha, accentForTheme, BRAND_ORANGE } from "@/lib/accent"
import { DestructiveButton } from "@/components/ui/destructive-button"
import { verifyPasswordAndDelete } from "@/app/actions/deleteAccount"
import { changePassword } from "@/app/actions/changePassword"
import { apiFetch } from "@/lib/apiFetch"
import { SCHOOLS } from "@/lib/schools"
import { GRADES } from "@/lib/term"
import { signGrove } from "@/app/lib/groveIntegrity"
import type { Achievement, NoteData } from "@/app/types"

// ── Settings tabs config ───────────────────────────────────────────────────

const TAB_DESCRIPTIONS: Record<string, string> = {
  general: "Account, shortcuts, and application preferences",
  appearance: "Theme, fonts, paper style, and visual customization",
  editor: "Writing tools, layout, and focus mode",
  archive: "Archived notebooks and notes",
  data: "Sync, storage, and trash",
  subscription: "Unlimited AI recall — your plan and billing",
  help: "Welcome guide, support, and bug reports",
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  general: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  appearance: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 0 20 4 4 0 0 0 0-8 4 4 0 0 1 0-8"/><circle cx="12" cy="9" r="1" fill="currentColor"/></svg>,
  editor: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  archive: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>,
  data: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>,
  subscription: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>,
  help: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
}

export const SETTINGS_TABS = [
  { id: "subscription", label: "Plus", group: "Premium" },
  { id: "general", label: "General", group: "App" },
  { id: "appearance", label: "Appearance", group: "App" },
  { id: "editor", label: "Editor", group: "Writing" },
  { id: "archive", label: "Archive", group: "Advanced" },
  { id: "data", label: "Data & Storage", group: "Advanced" },
  { id: "help", label: "Help", group: "Support" },
] as const
export type SettingsTabId = typeof SETTINGS_TABS[number]["id"]

// Cosmetics (accents, fonts, page styles) are free for everyone — Pro is for AI.
export const ACCENT_COLORS: { hex: string; name: string; cost?: number; pro?: boolean }[] = [
  { hex: "#71717a", name: "Gray" },
  { hex: "#d97706", name: "Orange" },
  { hex: "#ef4444", name: "Red" },
  { hex: "#ec4899", name: "Pink" },
  { hex: "#a855f7", name: "Purple" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#06b6d4", name: "Cyan" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#64748b", name: "Slate" },
  { hex: "#2B1D21", name: "Obsidian" },
]

export const FONT_OPTIONS: { value: string; label: string; cost?: number; pro?: boolean }[] = [
  { value: "Crimson Pro", label: "Crimson" },
  { value: "Georgia", label: "Georgia" },
  { value: "Palatino", label: "Palatino" },
  { value: "Arial", label: "Arial" },
  { value: "Courier New", label: "Mono" },
]

export const HEADING_FONT_OPTIONS: { value: string; label: string; cost?: number; pro?: boolean }[] = [
  { value: "Crimson Pro", label: "Crimson" },
  { value: "Georgia", label: "Georgia" },
  { value: "Didot", label: "Didot" },
  { value: "Palatino", label: "Palatino" },
  { value: "Bodoni", label: "Bodoni" },
]

export const PAGE_STYLE_OPTIONS: { value: string; label: string; cost?: number; pro?: boolean }[] = [
  { value: "lined", label: "Lined" },
  { value: "dotgrid", label: "Grid" },
  { value: "plain", label: "Plain" },
  { value: "steno", label: "Steno" },
  { value: "dark-lined", label: "Dark Lined" },
  { value: "dark-grid", label: "Dark Grid" },
  { value: "dark-plain", label: "Dark Plain" },
  { value: "dark-steno", label: "Dark Steno" },
]

// ── Sub-components ──────────────────────────────────────────────────────────

function SegmentedControl({ options, value, onChange, isDark }: { 
  options: [string, string][]; 
  value: string; 
  onChange: (v: string) => void;
  isDark: boolean;
}) {
  return (
    <div className={`flex rounded-lg overflow-hidden border p-0.5 gap-0.5 ${isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-100"} text-[11px] font-normal`}>
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`px-2.5 py-1 rounded-md transition-all ${value === val
            ? (isDark ? "bg-zinc-700 text-zinc-100 shadow-sm" : "bg-white text-zinc-900 shadow-sm")
            : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700")}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Main settings modal ────────────────────────────────────────────────────

export interface PulpConfig {
  accentColor: string; theme: "light" | "dark"
  autoSave: boolean; spellCheck: boolean; autoCorrect: boolean; autoCapitalize: boolean
  editorFont: string; headingFont: string
  lineSpacing: "compact" | "normal" | "relaxed"; paperStyle: PaperStyle
  showBinding: boolean; reduceMotion: boolean; reduceVisuals: boolean; sidebarOnStart: boolean
  bgEffect: boolean; smearEffect: boolean; handwrittenEffect: boolean
  language: string; defaultSort: string; wordCountVisible: boolean
  focusMode: boolean; baseFontSize: "small" | "medium" | "large"
  pageLayout: "paginated" | "scroll"
  shortcuts: Record<string, string>
  blockedSites: string[]; blockedApps: string[]
  orchardTimeMode: "theme" | "realtime"
  devMode: boolean; isDevUnlocked: boolean
  scrollMode: boolean
}


export const SettingsView = memo(function SettingsView({ user, onClose, config, onUpdateConfig, achievements, onClaimAchievement, trashNotes, onRestoreNote, onPermanentlyDeleteNote, unlockedCosmetics, setUnlockedCosmetics, onOpenShopItem, openConfirm, onSyncNow, archivedNotes = [], onUnarchiveNote, xp, dailyGoalMinutes = 30, onChangeDailyGoalMinutes, initialTab }: {
  user: { id: string; email?: string; user_metadata?: { avatar_url?: string; [key: string]: unknown } } | null
  onClose: () => void
  config: PulpConfig
  onUpdateConfig: (updates: Partial<PulpConfig>) => void
  achievements: Achievement[]
  onClaimAchievement: (id: string) => void
  trashNotes: NoteData[]
  onRestoreNote: (id: string) => void
  onPermanentlyDeleteNote: (id: string) => void
  unlockedCosmetics: string[]
  setUnlockedCosmetics: React.Dispatch<React.SetStateAction<string[]>>
  onOpenShopItem?: (itemId: string) => void
  openConfirm?: (title: string, message: string, onConfirm: () => void, confirmLabel?: string, danger?: boolean) => void
  onSyncNow?: () => Promise<{ pushed: number; pulled: number } | null>
  xp?: number
  archivedNotes?: NoteData[]
  onUnarchiveNote?: (id: string) => void
  hibernation?: { startDate: string; endDate: string; streakFrozen: number } | null
  hibernationScheduled?: { startDate: string; endDate: string } | null
  onScheduleHibernation?: (startDate: string, endDate: string) => void
  hibernationCooldownEnd?: string | null
  quotaTier?: 'monthly' | 'weekly' | 'daily'
  quotaLockedUntil?: string
  onChangeQuotaTier?: (tier: 'monthly' | 'weekly' | 'daily') => void
  dailyGoalMinutes?: number
  onChangeDailyGoalMinutes?: (v: number) => void
  initialTab?: SettingsTabId
}) {
  const { 
    accentColor, theme, autoSave, spellCheck, autoCorrect, autoCapitalize, editorFont, headingFont,
    lineSpacing, paperStyle, showBinding, reduceMotion, reduceVisuals, sidebarOnStart, bgEffect,
    smearEffect, handwrittenEffect, language, defaultSort, wordCountVisible, focusMode, baseFontSize,
    pageLayout, shortcuts, blockedSites, blockedApps, orchardTimeMode, devMode, isDevUnlocked, scrollMode
  } = config
  const isDark = theme === "dark"
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab || "general")

  const isUnlocked = (id: string, cost?: number, pro?: boolean) => {
    if (!cost && !pro) return true
    return unlockedCosmetics.includes(id)
  }
  const goToShop = (id: string) => {
    if (onOpenShopItem) { onClose(); onOpenShopItem(id) }
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteConfirmType, setDeleteConfirmType] = useState<"notes" | "account" | null>(null)
  const [deleteUsername, setDeleteUsername] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [pwCurrent, setPwCurrent] = useState("")
  const [pwNew, setPwNew] = useState("")
  const [pwConfirm, setPwConfirm] = useState("")
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url ?? null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [goalDraft, setGoalDraft] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // ── Profile identity (username / school / grade) with one-week edit cooldown ──
  type Identity = { username: string | null; school: string | null; grade: string | null; friend_code: string | null; changed_at: Record<string, string>; cooldown_ms: number; archived_grades?: Record<string, number> }
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [editField, setEditField] = useState<null | 'username' | 'school' | 'grade'>(null)
  const [editDraft, setEditDraft] = useState("")
  const [idBusy, setIdBusy] = useState(false)
  const [idError, setIdError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    apiFetch('/api/profile/identity').then(r => r.ok ? r.json() : null).then(d => { if (d) setIdentity(d) }).catch(() => {})
  }, [user])

  // Generated usernames ("ClammyElm823") can be changed freely until they pick their own.
  const autoUsername = identity?.changed_at?.username_auto === '1'
  const cooldownLeft = useCallback((field: string): number => {
    if (!identity) return 0
    if (field === 'username' && identity.changed_at?.username_auto === '1') return 0
    const last = identity.changed_at?.[field] ? new Date(identity.changed_at[field]).getTime() : 0
    if (!last) return 0
    const rem = last + identity.cooldown_ms - Date.now()
    return rem > 0 ? rem : 0
  }, [identity])

  const fmtCooldown = (ms: number): string => {
    const days = Math.ceil(ms / (24 * 60 * 60 * 1000))
    return days <= 1 ? "1 day" : `${days} days`
  }

  const startEdit = (field: 'username' | 'school' | 'grade') => {
    setIdError(null)
    setEditDraft(identity?.[field] ?? (field === 'school' ? SCHOOLS[0] : field === 'grade' ? GRADES[7] : ''))
    setEditField(field)
  }

  const saveIdentity = async () => {
    if (!editField) return
    setIdBusy(true); setIdError(null)
    try {
      const res = await apiFetch('/api/profile/identity', { method: 'POST', body: JSON.stringify({ field: editField, value: editDraft }) })
      const json = await res.json()
      if (!res.ok) {
        setIdError(json.cooldown_until ? `Locked for ${fmtCooldown(new Date(json.cooldown_until).getTime() - Date.now())}` : (json.error || 'Could not save'))
      } else {
        // Grade change resets/restores the grove server-side. Sync the local cache
        // (the client ignores an empty server grove on load) and reload to apply it.
        if (editField === 'grade' && Array.isArray(json.grove)) {
          try {
            const raw = localStorage.getItem('pulp-grove')
            const data = raw ? JSON.parse(raw) : {}
            data.grove = json.grove
            localStorage.setItem('pulp-grove', JSON.stringify(signGrove(data)))
          } catch { /* ignore */ }
          window.location.reload()
          return
        }
        setIdentity(prev => prev ? { ...prev, [editField]: json.value, changed_at: json.changed_at } : prev)
        setEditField(null)
      }
    } catch { setIdError('Could not save') }
    finally { setIdBusy(false) }
  }

  // ── Plus: plan status, checkout, billing portal ──
  const [plan, setPlan] = useState<PlanStatus | null>(null)
  useEffect(() => {
    if (activeTab !== "subscription" || !user) return
    let alive = true
    fetchPlan().then(p => { if (alive) setPlan(p) })
    return () => { alive = false }
  }, [activeTab, user])
  const startCheckout = useCallback((p: PlusPlan) => {
    if (!user) { window.location.href = '/login'; return }
    startPlusCheckout(p)
  }, [user])
  const openBillingPortal = useCallback(async () => {
    const err = await openPlusPortal()
    if (err) openConfirm?.('Billing', err, () => {})
  }, [openConfirm])

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !user) return
    setAvatarError(null)
    if (!file.type.startsWith("image/")) { setAvatarError("That file isn't an image."); return }
    if (file.size > 2 * 1024 * 1024) { setAvatarError("Images must be under 2 MB."); return }

    setAvatarUploading(true)
    const ext = file.name.split(".").pop() || "png"
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true })

    if (uploadError) { setAvatarUploading(false); setAvatarError("Upload failed. Try again."); return }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path)

    const timestamped = `${publicUrl}?t=${Date.now()}`
    await supabase.auth.updateUser({ data: { avatar_url: timestamped } })
    setAvatarUrl(timestamped)
    setAvatarUploading(false)
  }, [user])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", handleEsc, true)
    return () => window.removeEventListener("keydown", handleEsc, true)
  }, [onClose])

  const groups = Array.from(new Set(SETTINGS_TABS.map(t => t.group))).map(g => ({
    name: g, tabs: SETTINGS_TABS.filter(t => t.group === g),
  }))
  const visibleGroups = searchQuery
    ? [{ name: "Results", tabs: SETTINGS_TABS.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())) }]
    : groups

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onMouseDown={onClose}>
      <div onMouseDown={e => e.stopPropagation()} className={`relative w-full max-w-[900px] ${isDark ? "bg-[#09090b] text-zinc-100 border-zinc-800/80" : "bg-[#f5f3ef] text-zinc-900 border-zinc-200/80"} rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border flex overflow-hidden`} style={{ height: 660 }}>

        {/* ── Sidebar ── */}
        <div className={`w-[200px] ${isDark ? "bg-[#09090b] border-zinc-800/80" : "bg-[#f5f3ef] border-zinc-200/70"} border-r flex flex-col shrink-0`}>
          <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
            <button
              onClick={onClose}
              className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <p className={`text-[11px] font-normal tracking-widest ${isDark ? "text-zinc-600" : "text-zinc-400"}`} style={{ fontFamily: 'Crimson Pro, serif' }}>Settings</p>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
            {visibleGroups.map(group => (
              <div key={group.name} className={group.name === "Premium" ? (isDark ? "pt-3 mt-3 border-t border-zinc-800" : "pt-3 mt-3 border-t border-zinc-300/40") : "mb-1"}>
                <p className={`text-[9.5px] font-normal tracking-wide px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>{group.name}</p>
                {group.tabs.map(tab => {
                  const isPremium = tab.id === "subscription"
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id as SettingsTabId); setSearchQuery("") }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-normal transition-all ${
                        isActive
                          ? isPremium
                            ? isDark ? "bg-[rgb(var(--accent-rgb)/0.1)] text-[var(--accent)]" : "bg-[rgb(var(--accent-rgb)/0.1)] text-[var(--accent)]"
                            : isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                          : isPremium
                            ? isDark ? "text-[rgb(var(--accent-rgb)/0.7)] hover:bg-[rgb(var(--accent-rgb)/0.05)]" : "text-[rgb(var(--accent-rgb)/0.7)] hover:bg-[rgb(var(--accent-rgb)/0.05)]"
                            : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                      }`}
                    >
                      <span className="mr-2 w-4 h-4 flex items-center justify-center">{TAB_ICONS[tab.id]}</span>
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
          <div className={`px-5 py-4 border-t ${isDark ? "border-zinc-800" : "border-zinc-200/60"}`}>
            <p className={`text-[10px] font-normal ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Pulp · v1.0.0</p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`px-8 pt-6 pb-4 border-b ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"} shrink-0 flex items-start justify-between`}>
            <div>
              <h2 className="text-[15px] font-normal tracking-widest" style={{ fontFamily: 'Crimson Pro, serif', color: isDark ? '#dcd8d0' : '#2a2620' }}>
                {SETTINGS_TABS.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-[11px] mt-0.5" style={{ fontFamily: 'Crimson Pro, serif', color: isDark ? '#5a5650' : '#a8a4a0' }}>
                {TAB_DESCRIPTIONS[activeTab] ?? ""}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-0.5">
              <a href="#" title="Instagram" className={`${isDark ? "text-zinc-600 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600"} transition-colors`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="#" title="Discord" className={`${isDark ? "text-zinc-600 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600"} transition-colors`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z"/></svg>
              </a>
              <a href="#" title="YouTube" className={`${isDark ? "text-zinc-600 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600"} transition-colors`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="#" title="Twitter" className={`${isDark ? "text-zinc-600 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600"} transition-colors`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto px-8 py-6 ${isDark ? "bg-[#09090b]" : "bg-[#f5f3ef]"}`}>

            {/* ── General ── */}
            {activeTab === "general" && (<>
              <SettingSection title="Account" isDark={isDark}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  {avatarError && <p className="text-[11px] text-red-500 mt-1">{avatarError}</p>}
                  <button
                    onClick={() => user && avatarInputRef.current?.click()}
                    disabled={avatarUploading || !user}
                    className="relative w-11 h-11 rounded-full shrink-0 shadow-md group overflow-hidden"
                    style={{ background: avatarUrl ? undefined : `linear-gradient(135deg, ${accentAlpha(0.6)}, ${ACCENT})` }}
                    title="Change profile picture"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-[15px] font-normal" style={{ color: ACCENT_CONTRAST }}>
                        {user?.email?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                    <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-opacity ${avatarUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"} ${isDark ? "bg-black/50" : "bg-black/40"}`}>
                      {avatarUploading ? (
                        <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      )}
                    </div>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[18px] font-semibold leading-tight truncate ${isDark ? "text-zinc-50" : "text-zinc-900"}`}>
                      {identity?.username ?? (user ? "—" : "Not signed in")}
                    </p>
                    <p className={`text-[11px] font-normal truncate ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{user?.email ?? ""}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-normal px-1.5 py-0.5 rounded-full ${isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"}`}>Free Plan</span>
                      {identity?.friend_code && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-normal px-1.5 py-0.5 rounded-full ${isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"}`}>#{identity.friend_code}</span>
                      )}
                    </div>
                  </div>
                </div>
                {user ? (
                  <SettingRow
                    title="Sign out"
                    isDark={isDark}
                    description="You'll need to sign back in to access your notes"
                    control={
                      <button
                        onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                        className={`text-[11.5px] font-normal px-3.5 py-1.5 rounded-lg transition-all ${isDark ? "text-red-400 bg-red-950/40 hover:bg-red-950/70 border border-red-900/50" : "text-red-600 bg-red-50 hover:bg-red-100 border border-red-100"}`}
                      >
                        Sign Out
                      </button>
                    }
                  />
                ) : (
                  <SettingRow
                    title="Sign in"
                    isDark={isDark}
                    description="Sign in to save and sync your notes to the cloud"
                    control={
                      <button
                        onClick={() => window.location.href = "/login"}
                        className={`text-[11.5px] font-normal px-3.5 py-1.5 rounded-lg transition-all ${isDark ? "text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-900/50" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100"}`}
                      >
                        Sign In
                      </button>
                    }
                  />
                )}
                {user && (
                  <SettingRow
                    title="Password"
                    description="Update your account password"
                    isDark={isDark}
                    control={
                      <button
                        onClick={() => { setPwOpen(!pwOpen); setPwMsg(null) }}
                        className={`text-[11.5px] font-normal px-3.5 py-1.5 rounded-lg transition-all ${isDark ? "text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700" : "text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200"}`}
                      >
                        {pwOpen ? "Cancel" : "Change"}
                      </button>
                    }
                  />
                )}
                {user && pwOpen && (
                  <div className={`mx-5 mb-4 flex flex-col gap-2 p-3 rounded-lg border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                    <input
                      type="password"
                      value={pwCurrent}
                      onChange={e => setPwCurrent(e.target.value)}
                      placeholder="Current password"
                      autoComplete="current-password"
                      className={`text-[12px] px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"}`}
                    />
                    <input
                      type="password"
                      value={pwNew}
                      onChange={e => setPwNew(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      autoComplete="new-password"
                      className={`text-[12px] px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"}`}
                    />
                    <input
                      type="password"
                      value={pwConfirm}
                      onChange={e => setPwConfirm(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className={`text-[12px] px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"}`}
                    />
                    {pwMsg && (
                      <p className={`text-[11px] font-normal ${pwMsg.ok ? "text-emerald-500" : "text-red-500"}`}>{pwMsg.text}</p>
                    )}
                    <button
                      disabled={pwLoading || !pwCurrent || !pwNew || !pwConfirm}
                      onClick={async () => {
                        if (pwNew !== pwConfirm) { setPwMsg({ ok: false, text: "Passwords don't match" }); return }
                        if (pwNew.length < 6) { setPwMsg({ ok: false, text: "Min 6 characters" }); return }
                        setPwLoading(true); setPwMsg(null)
                        const res = await changePassword(user.id, pwCurrent, pwNew)
                        setPwLoading(false)
                        if (res.success) {
                          setPwMsg({ ok: true, text: "Password updated" })
                          setPwCurrent(""); setPwNew(""); setPwConfirm("")
                          setTimeout(() => setPwOpen(false), 1500)
                        } else {
                          setPwMsg({ ok: false, text: res.error || "Failed" })
                        }
                      }}
                      className={`text-[11.5px] font-normal px-3.5 py-2 rounded-lg transition-all mt-1 ${(!pwCurrent || !pwNew || !pwConfirm || pwLoading) ? (isDark ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : "bg-zinc-100 text-zinc-400 cursor-not-allowed") : "bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-contrast)]"}`}
                    >
                      {pwLoading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                )}
              </SettingSection>

              {user && (
                <SettingSection title="Profile" isDark={isDark}>
                  {([
                    { field: 'username' as const, label: 'Username', value: identity?.username },
                    { field: 'school' as const, label: 'School', value: identity?.school },
                    { field: 'grade' as const, label: 'Grade', value: identity?.grade },
                  ]).map(({ field, label, value }) => {
                    const left = cooldownLeft(field)
                    const locked = left > 0
                    return (
                      <div key={field}>
                        <SettingRow
                          title={label}
                          isDark={isDark}
                          description={locked ? `Editable again in ${fmtCooldown(left)}` : field === 'username' && autoUsername ? "Generated for you — change it free anytime" : "One change per week"}
                          control={
                            <div className="flex items-center gap-2.5">
                              <span className={`text-[12px] font-normal max-w-[140px] truncate ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{value ?? "—"}</span>
                              <button
                                disabled={locked || editField === field}
                                onClick={() => startEdit(field)}
                                className={`text-[11.5px] font-normal px-3.5 py-1.5 rounded-lg transition-all ${(locked || editField === field) ? (isDark ? "text-zinc-600 bg-zinc-800/50 cursor-not-allowed" : "text-zinc-400 bg-zinc-100 cursor-not-allowed") : (isDark ? "text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700" : "text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200")}`}
                              >
                                Edit
                              </button>
                            </div>
                          }
                        />
                        {editField === field && (
                          <div className={`mx-5 mb-4 flex flex-col gap-2 p-3 rounded-lg border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                            {field === 'username' ? (
                              <div className="flex gap-2">
                                <input
                                  autoFocus value={editDraft} onChange={e => setEditDraft(e.target.value)} placeholder="username" maxLength={20}
                                  className={`flex-1 text-[12px] px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"}`}
                                />
                                <button type="button" title="Roll a new name" aria-label="Roll a new name" onClick={() => setEditDraft(generateUsername())}
                                  className={`px-2.5 rounded-lg border text-[14px] ${isDark ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700" : "border-zinc-200 bg-white hover:bg-zinc-100"}`}>🎲</button>
                              </div>
                            ) : (
                              <select
                                autoFocus value={editDraft} onChange={e => setEditDraft(e.target.value)}
                                className={`text-[12px] px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"}`}
                              >
                                {field === 'school'
                                  ? SCHOOLS.map(o => <option key={o} value={o}>{o}</option>)
                                  : (() => {
                                      const curIdx = GRADES.indexOf(identity?.grade ?? '')
                                      const archived = identity?.archived_grades ?? {}
                                      return GRADES.map((o, idx) => {
                                        const isPast = curIdx >= 0 && idx < curIdx
                                        const hasArchive = Object.prototype.hasOwnProperty.call(archived, o)
                                        const disabled = isPast && !hasArchive
                                        return <option key={o} value={o} disabled={disabled}>{o}{hasArchive ? ' · restore' : ''}</option>
                                      })
                                    })()}
                              </select>
                            )}
                            <p className={`text-[10.5px] ${isDark ? "text-amber-500/80" : "text-amber-600"}`}>{field === 'username' && autoUsername ? "Once you pick your own name, changes are limited to once a week." : "Heads up — you can only change this once a week."}</p>
                            {idError && <p className="text-[11px] text-red-500">{idError}</p>}
                            <div className="flex gap-2 mt-0.5">
                              <button
                                disabled={idBusy || !editDraft.trim()}
                                onClick={saveIdentity}
                                className={`flex-1 text-[11.5px] font-normal px-3.5 py-2 rounded-lg transition-all ${(idBusy || !editDraft.trim()) ? (isDark ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : "bg-zinc-100 text-zinc-400 cursor-not-allowed") : "bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-[var(--accent-contrast)]"}`}
                              >
                                {idBusy ? "Saving…" : "Save"}
                              </button>
                              <button
                                onClick={() => { setEditField(null); setIdError(null) }}
                                className={`text-[11.5px] font-normal px-3.5 py-2 rounded-lg transition-all ${isDark ? "text-zinc-400 bg-zinc-800 hover:bg-zinc-700" : "text-zinc-600 bg-zinc-100 hover:bg-zinc-200"}`}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {field === 'grade' && identity?.archived_grades && Object.keys(identity.archived_grades).length > 0 && (
                          <div className={`mx-5 mb-4 flex flex-col gap-1.5 p-3 rounded-lg border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}>
                            <p className={`text-[10.5px] uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Past years</p>
                            {Object.entries(identity.archived_grades).map(([g, n]) => (
                              <div key={g} className={`flex items-center justify-between text-[12px] ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                                <span>{g}</span>
                                <span className={isDark ? "text-zinc-500" : "text-zinc-400"}>{n} {n === 1 ? 'tree' : 'trees'} · archived</span>
                              </div>
                            ))}
                            <p className={`text-[10.5px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Select a past year above to restore its orchard.</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </SettingSection>
              )}


              <SettingSection title="Shortcuts" isDark={isDark}>
                <div className="flex flex-col gap-0.5 px-3 py-2">
                  <ShortcutKey label="New Note" id="newNote" currentKey={shortcuts.newNote || "ctrl+n"} defaultKey="ctrl+n" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="Search" id="search" currentKey={shortcuts.search || "ctrl+k"} defaultKey="ctrl+k" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="Toggle Sidebar" id="toggleSidebar" currentKey={shortcuts.toggleSidebar || "ctrl+\\"} defaultKey="ctrl+\\" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="AI Intelligence" id="ai" currentKey={shortcuts.ai || "ctrl+j"} defaultKey="ctrl+j" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="AI Command" id="aiCommand" currentKey={shortcuts.aiCommand || "\\"} defaultKey="\\" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="Slash Command" id="slash" currentKey={shortcuts.slash || "/"} defaultKey="/" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="Toggle Timer" id="timer" currentKey={shortcuts.timer || "ctrl+alt+t"} defaultKey="ctrl+alt+t" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="Toggle Draw Mode" id="drawMode" currentKey={shortcuts.drawMode || "ctrl+d"} defaultKey="ctrl+d" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="Previous Page" id="prevPage" currentKey={shortcuts.prevPage || "alt+arrowleft"} defaultKey="alt+arrowleft" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="Next Page" id="nextPage" currentKey={shortcuts.nextPage || "alt+arrowright"} defaultKey="alt+arrowright" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="Cycle Heading Style" id="cycleHeader" currentKey={shortcuts.cycleHeader || "alt+1"} defaultKey="alt+1" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                  <ShortcutKey label="Card From Highlight" id="makeCard" currentKey={shortcuts.makeCard || "ctrl+shift+c"} defaultKey="ctrl+shift+c" isDark={isDark} onUpdate={(id, k) => onUpdateConfig({ shortcuts: { ...shortcuts, [id]: k } })} />
                </div>
              </SettingSection>

              <SoundSection isDark={isDark} />

              <SettingSection title="Daily Goal" isDark={isDark}>
                <SettingRow
                  title="Minutes per day"
                  isDark={isDark}
                  description="How many minutes of focus you aim for each day"
                  control={
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={goalDraft ?? String(dailyGoalMinutes ?? 30)}
                      onChange={e => setGoalDraft(e.target.value)}
                      onBlur={() => {
                        // Type freely; clamp to 5-480 when leaving the field
                        const v = parseInt(goalDraft ?? "")
                        if (!Number.isNaN(v)) onChangeDailyGoalMinutes?.(Math.min(480, Math.max(5, v)))
                        setGoalDraft(null)
                      }}
                      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                      className={`text-[11px] w-16 text-center border ${isDark ? "bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-zinc-500" : "bg-white border-zinc-200 text-zinc-800 focus:border-zinc-400"} rounded-none px-2.5 py-1.5 outline-none transition-colors`}
                    />
                  }
                />
              </SettingSection>

              <SettingSection title="About" isDark={isDark}>
                <SettingRow title="Version" isDark={isDark} control={<span className={`text-[11.5px] font-mono tabular-nums ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>1.0.0 (2026.03)</span>} />
              </SettingSection>
            </>)}

            {/* ── Appearance ── */}
            {activeTab === "appearance" && (<>
              <SettingSection title="Theme" isDark={isDark}>
                <SettingRow
                  title="Color scheme"
                  isDark={isDark}
                  description="Choose how Pulp looks to you"
                  control={<SegmentedControl options={[["light", "Light"], ["dark", "Dark"]]} value={theme} onChange={v => onUpdateConfig({ theme: v as "light" | "dark" })} isDark={isDark} />}
                />
                <SettingRow
                  title="Reduce motion"
                  isDark={isDark}
                  description="Minimize animations and transitions across the app"
                  control={<SettingToggle checked={reduceMotion} onChange={v => onUpdateConfig({ reduceMotion: v })} isDark={isDark} />}
                />
                <SettingRow
                  title="Reduce visuals"
                  isDark={isDark}
                  description="Disable pulsating effects, glows, and background animations"
                  control={<SettingToggle checked={reduceVisuals} onChange={v => onUpdateConfig({ reduceVisuals: v })} isDark={isDark} />}
                />
              </SettingSection>
              <SettingSection title="Effects" isDark={isDark}>
                <SettingRow
                  title="Background texture"
                  isDark={isDark}
                  description="Show a subtle noise texture on the app background"
                  control={<SettingToggle checked={bgEffect} onChange={v => onUpdateConfig({ bgEffect: v })} isDark={isDark} />}
                />
                {/* Moved to Paper & Page section for better relevance */}
              </SettingSection>
              <SettingSection title="Orchard" isDark={isDark}>
                <SettingRow
                  title="Time of day"
                  isDark={isDark}
                  description="Set orchard lighting based on your theme or real clock"
                  control={<SegmentedControl options={[["theme", "Theme"], ["realtime", "Clock"]]} value={orchardTimeMode || "theme"} onChange={v => onUpdateConfig({ orchardTimeMode: v as "theme" | "realtime" })} isDark={isDark} />}
                />
              </SettingSection>

              <SettingSection title="Personalization" isDark={isDark}>
                <div className="px-5 py-4">
                  <p className={`text-[12px] font-normal mb-3 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Accent Color</p>
                  <div className="flex flex-wrap gap-3">
                    {ACCENT_COLORS.map(({ hex, name, cost, pro }) => {
                      const id = `accent_${hex}`
                      const unlocked = isUnlocked(id, cost, pro)
                      const selected = accentColor === hex
                      return (
                        <button
                          key={hex}
                          onClick={() => {
                            if (unlocked) { onUpdateConfig({ accentColor: hex }); return }
                            if (pro) return
                            undefined
                          }}
                          title={unlocked ? name : pro ? `${name} — Pro only` : `${name} — Reach ${cost} XP to unlock`}
                          className="group flex flex-col items-center gap-1.5 relative"
                        >
                          <div
                            className="w-8 h-8 rounded-full transition-all duration-150"
                            style={{
                              backgroundColor: hex,
                              boxShadow: selected ? `0 0 0 2px ${isDark ? "#18181b" : "#fff"}, 0 0 0 4px ${hex}` : "none",
                              transform: selected ? "scale(1.1)" : undefined,
                              opacity: unlocked ? 1 : 0.4,
                            }}
                          />
                          {!unlocked && (
                            <div className="absolute -top-1 -right-1 flex items-center justify-center">
                              {pro ? (
                                <span className="text-[7px] font-normal bg-[var(--accent)] text-[var(--accent-contrast)] px-1 rounded-full leading-tight">PRO</span>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#a1a1aa" : "#71717a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              )}
                            </div>
                          )}
                          <span className={`text-[9px] font-normal transition-colors ${selected ? (isDark ? "text-zinc-200" : "text-zinc-700") : isDark ? "text-zinc-600 group-hover:text-zinc-400" : "text-zinc-400 group-hover:text-zinc-600"}`}>{name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </SettingSection>

              <SettingSection title="Interface" isDark={isDark}>
                <SettingRow
                  title="Always open sidebar on launch"
                  isDark={isDark}
                  description="Off: the sidebar opens the way you left it"
                  control={<SettingToggle checked={sidebarOnStart} onChange={v => onUpdateConfig({ sidebarOnStart: v })} isDark={isDark} />}
                />
                <SettingRow
                  title="Status bar"
                  isDark={isDark}
                  description="Show the word count for this page at the bottom of the screen"
                  control={<SettingToggle checked={wordCountVisible} onChange={v => onUpdateConfig({ wordCountVisible: v })} isDark={isDark} />}
                />
              </SettingSection>

              <SettingSection title="Font Selection" isDark={isDark}>
                <div className="px-5 py-4">
                  <p className={`text-[12px] font-normal mb-2 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Heading Font</p>
                  <p className={`text-[10px] mb-3 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Used for large titles and notebook covers</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {HEADING_FONT_OPTIONS.map(({ value, label, cost, pro }) => {
                      const id = `hfont_${value}`
                      const unlocked = isUnlocked(id, cost, pro)
                      const selected = headingFont === value
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            if (unlocked) { onUpdateConfig({ headingFont: value }); return }
                            if (pro) return
                            undefined
                          }}
                          className={`relative px-3 py-1.5 rounded-md text-[11px] font-normal border transition-all ${
                            selected
                              ? isDark ? "bg-zinc-700 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-900 text-white"
                              : unlocked
                                ? isDark ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                : isDark ? "bg-zinc-900/50 border-zinc-800/50 text-zinc-600 cursor-pointer" : "bg-zinc-50 border-zinc-200/50 text-zinc-400 cursor-pointer"
                          }`}
                          style={{ fontFamily: `"${value}", serif` }}
                          title={unlocked ? label : pro ? `${label} — Pro only` : `${label} — Reach ${cost} XP to unlock`}
                        >
                          {label}
                          {!unlocked && (
                            <span className="absolute -top-1.5 -right-1.5">
                              {pro ? (
                                <span className="text-[7px] font-normal bg-[var(--accent)] text-[var(--accent-contrast)] px-1 rounded-full leading-tight">PRO</span>
                              ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#a1a1aa" : "#71717a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              )}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className={`text-[12px] font-normal mb-2 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Body Copy Font</p>
                  <p className={`text-[10px] mb-3 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>The default font for notes and boxes</p>
                  <div className="flex flex-wrap gap-2">
                    {FONT_OPTIONS.map(({ value, label, cost, pro }) => {
                      const id = `bfont_${value}`
                      const unlocked = isUnlocked(id, cost, pro)
                      const selected = editorFont === value
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            if (unlocked) { onUpdateConfig({ editorFont: value }); return }
                            if (pro) return
                            undefined
                          }}
                          className={`relative px-3 py-1.5 rounded-md text-[11px] font-normal border transition-all ${
                            selected
                              ? isDark ? "bg-zinc-700 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-900 text-white"
                              : unlocked
                                ? isDark ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                : isDark ? "bg-zinc-900/50 border-zinc-800/50 text-zinc-600 cursor-pointer" : "bg-zinc-50 border-zinc-200/50 text-zinc-400 cursor-pointer"
                          }`}
                          style={{ fontFamily: `"${value}", serif` }}
                          title={unlocked ? label : pro ? `${label} — Pro only` : `${label} — Reach ${cost} XP to unlock`}
                        >
                          {label}
                          {!unlocked && (
                            <span className="absolute -top-1.5 -right-1.5">
                              {pro ? (
                                <span className="text-[7px] font-normal bg-[var(--accent)] text-[var(--accent-contrast)] px-1 rounded-full leading-tight">PRO</span>
                              ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#a1a1aa" : "#71717a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              )}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </SettingSection>
              <SettingSection title="Sizing & Spacing" isDark={isDark}>
                <SettingRow
                  title="Base Font Size"
                  isDark={isDark}
                  control={<SegmentedControl options={[["small", "Small"], ["medium", "Medium"], ["large", "Large"]]} value={baseFontSize} onChange={(v: string) => onUpdateConfig({ baseFontSize: v as "small" | "medium" | "large" })} isDark={isDark} />}
                />
                <SettingRow
                  title="Line Spacing"
                  isDark={isDark}
                  control={<SegmentedControl options={[["compact", "Comp"], ["normal", "Norm"], ["relaxed", "Relax"]]} value={lineSpacing} onChange={(v: string) => onUpdateConfig({ lineSpacing: v as "compact" | "normal" | "relaxed" })} isDark={isDark} />}
                />
              </SettingSection>

              <SettingSection title="Paper & Page" isDark={isDark}>
                <div className="px-5 py-4">
                  <p className={`text-[12px] font-normal mb-2 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Page Style</p>
                  <p className={`text-[10px] mb-3 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Background ruling on your note pages</p>
                  <div className="flex flex-wrap gap-2">
                    {PAGE_STYLE_OPTIONS.map(({ value, label, cost, pro }) => {
                      const id = `paper_${value}`
                      const unlocked = isUnlocked(id, cost, pro)
                      const selected = paperStyle === value
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            if (unlocked) { onUpdateConfig({ paperStyle: value as any }); return }
                            if (pro) return
                            undefined
                          }}
                          className={`relative px-3 py-1.5 rounded-md text-[11px] font-normal border transition-all ${
                            selected
                              ? isDark ? "bg-zinc-700 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-900 text-white"
                              : unlocked
                                ? isDark ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                : isDark ? "bg-zinc-900/50 border-zinc-800/50 text-zinc-600 cursor-pointer" : "bg-zinc-50 border-zinc-200/50 text-zinc-400 cursor-pointer"
                          }`}
                          title={unlocked ? label : pro ? `${label} — Pro only` : `${label} — Reach ${cost} XP to unlock`}
                        >
                          {label}
                          {!unlocked && (
                            <span className="absolute -top-1.5 -right-1.5">
                              {pro ? (
                                <span className="text-[7px] font-normal bg-[var(--accent)] text-[var(--accent-contrast)] px-1 rounded-full leading-tight">PRO</span>
                              ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#a1a1aa" : "#71717a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              )}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <SettingRow
                  title="Smear effect"
                  isDark={isDark}
                  description="Show a subtle ink smear shadow along the left margin"
                  control={<SettingToggle checked={smearEffect} onChange={v => onUpdateConfig({ smearEffect: v })} isDark={isDark} />}
                />
                <SettingRow
                  title="Ink-ink Filter"
                  isDark={isDark}
                  description="Simulate organic pen-on-paper bleed and wobble using SVG filters"
                  control={<SettingToggle checked={handwrittenEffect} onChange={v => onUpdateConfig({ handwrittenEffect: v })} isDark={isDark} />}
                />
                <SettingRow
                  title="Page navigation"
                  isDark={isDark}
                  description={scrollMode ? "Scroll through every page of a notebook, like a document" : "Flip through pages one at a time"}
                  control={<SegmentedControl options={[["scroll", "Scroll"], ["pages", "One at a time"]]} value={scrollMode ? "scroll" : "pages"} onChange={(v: string) => onUpdateConfig({ scrollMode: v === "scroll" } as any)} isDark={isDark} />}
                />
              </SettingSection>
            </>)}


            {/* ── Editor ── */}
            {activeTab === "editor" && (<>
              <SettingSection title="Writing" isDark={isDark}>
                <SettingRow
                  title="Auto-save"
                  isDark={isDark}
                  description="Sync changes to the cloud a moment after you stop typing"
                  control={<SettingToggle checked={autoSave} onChange={v => onUpdateConfig({ autoSave: v })} isDark={isDark} />}
                />
                <SettingRow
                  title="Spell check"
                  isDark={isDark}
                  description="Underline possible misspellings while typing"
                  control={<SettingToggle checked={spellCheck} onChange={v => onUpdateConfig({ spellCheck: v })} isDark={isDark} />}
                />
                <SettingRow
                  title="Auto-correct"
                  isDark={isDark}
                  description="Fix common spelling mistakes automatically"
                  control={<SettingToggle checked={autoCorrect} onChange={v => onUpdateConfig({ autoCorrect: v })} isDark={isDark} />}
                />
                <SettingRow
                  title="Auto-capitalize"
                  isDark={isDark}
                  description="Automatically capitalize sentences"
                  control={<SettingToggle checked={autoCapitalize} onChange={v => onUpdateConfig({ autoCapitalize: v })} isDark={isDark} />}
                />
              </SettingSection>

              <SettingSection title="Focus" isDark={isDark}>
                <SettingRow
                  title="Focus mode"
                  isDark={isDark}
                  description="Fade everything except the text box you're typing in"
                  control={<SettingToggle checked={focusMode} onChange={v => onUpdateConfig({ focusMode: v })} isDark={isDark} />}
                />
              </SettingSection>
            </>)}


            {/* ── Data ── */}
            {activeTab === "archive" && (<>
               <SettingSection title="Archived Notes" isDark={isDark}>
                 {archivedNotes.length === 0 ? (
                   <div className="px-5 py-8 text-center">
                     <p className={`text-[12px] italic ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>No archived notes.</p>
                   </div>
                 ) : (
                   <div className={`flex flex-col ${isDark ? "bg-zinc-900/30" : "bg-zinc-100/30"} rounded-lg p-4`}>
                     {archivedNotes.map(an => (
                       <div key={`archive-${an.id}`} className={`group flex items-center justify-between gap-3 p-3 rounded border-b ${isDark ? "border-zinc-800/50 hover:bg-zinc-800/30" : "border-zinc-200/50 hover:bg-zinc-50/50"} transition-colors last:border-b-0`}>
                         <span className={`text-[12px] truncate ${isDark ? "text-zinc-400 group-hover:text-zinc-300" : "text-zinc-600 group-hover:text-zinc-700"}`}>
                           {an.subject || "Untitled"}
                         </span>
                         <button
                           onClick={() => onUnarchiveNote?.(an.id)}
                           className={`text-[11px] font-normal px-2.5 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${isDark ? "text-green-400 hover:bg-green-500/20" : "text-green-600 hover:bg-green-100/50"}`}
                         >
                           Unarchive
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
               </SettingSection>
            </>)}

            {activeTab === "data" && (<>
               {user && onSyncNow && <SyncSection isDark={isDark} onSyncNow={onSyncNow} />}
               <SettingSection title="Local Storage" isDark={isDark}>
                 <StorageBar isDark={isDark} />
                 <div className="px-5 pb-5">
                   <button
                     onClick={() => {
                       const clear = () => { localStorage.clear(); window.location.reload() }
                       if (openConfirm) openConfirm("Clear local cache?", "Removes everything Pulp stored in this browser. Synced notebooks reload from the cloud; anything unsynced is lost.", clear, "Clear", true)
                       else if (confirm("Clear all local storage? This cannot be undone.")) clear()
                     }}
                     className={`w-full py-2.5 rounded-lg border text-[12px] font-normal transition-all ${isDark ? "bg-red-900/20 border-red-900/30 hover:bg-red-900/30 text-red-400" : "bg-red-50 border-red-100 hover:bg-red-100/50 text-red-600 shadow-sm"}`}
                   >
                     Clear Local Cache
                   </button>
                 </div>
               </SettingSection>

               {/* Trash Section */}
               {trashNotes.length > 0 && (
                 <SettingSection title="Trash" isDark={isDark}>
                   <div className={`flex flex-col ${isDark ? "bg-zinc-900/30" : "bg-zinc-100/30"} rounded-lg p-4`}>
                     {trashNotes.map(tn => (
                       <div key={`trash-${tn.id}`} className={`group flex items-center justify-between gap-3 p-3 rounded border-b ${isDark ? "border-zinc-800/50 hover:bg-zinc-800/30" : "border-zinc-200/50 hover:bg-zinc-50/50"} transition-colors last:border-b-0`}>
                         <span className={`text-[12px] truncate ${isDark ? "text-zinc-400 group-hover:text-zinc-300" : "text-zinc-600 group-hover:text-zinc-700"}`}>
                           {tn.subject || "Untitled"}
                         </span>
                         <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button
                             onClick={() => onRestoreNote(tn.id)}
                             className={`text-[11px] font-normal px-2.5 py-1 rounded transition-colors ${isDark ? "text-green-400 hover:bg-green-500/20" : "text-green-600 hover:bg-green-100/50"}`}
                           >
                             Restore
                           </button>
                           <button
                             onClick={() => onPermanentlyDeleteNote(tn.id)}
                             className={`text-[11px] font-normal px-2.5 py-1 rounded transition-colors ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-100/50"}`}
                           >
                             Delete
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </SettingSection>
               )}

               <div className="mb-7">
                <p className={`text-[10px] font-normal tracking-wide mb-2.5 px-0.5 ${isDark ? "text-red-500/70" : "text-red-500/60"}`}>
                  Caution
                </p>
                <div className={`rounded-xl border overflow-hidden divide-y ${
                  isDark
                    ? "bg-red-950/20 border-red-900/40 divide-red-900/30"
                    : "bg-red-50/50 border-red-200/60 divide-red-100/60"
                }`}>
                  <SettingRow
                    title={<span className={isDark ? "text-red-300" : "text-red-700"}>Delete all notes</span>}
                    isDark={isDark}
                    description="Permanently erase every note and page. This cannot be undone."
                    control={
                      <DestructiveButton onClick={() => setDeleteConfirmType("notes")}>
                        Delete All
                      </DestructiveButton>
                    }
                  />
                  <SettingRow
                    title={<span className={isDark ? "text-red-300" : "text-red-700"}>Delete account</span>}
                    isDark={isDark}
                    description="Permanently delete your account and all associated data."
                    control={
                      <DestructiveButton onClick={() => setDeleteConfirmType("account")}>
                        Delete Account
                      </DestructiveButton>
                    }
                  />
                </div>
              </div>
            </>)}

            {/* ── Subscription ── */}
            {activeTab === "subscription" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden">
                {/* Hero banner */}
                <div className="relative rounded-xl overflow-hidden" style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #1c1108 0%, #291a06 40%, #1a1206 100%)'
                    : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 40%, #fde68a 100%)',
                }}>
                  <div className="pointer-events-none absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at 80% 20%, rgba(217,119,6,0.2) 0%, transparent 60%)',
                  }} />
                  <div className="relative z-10 px-6 py-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(217,119,6,0.15)' }}>
                        <Sparkles className="w-4.5 h-4.5" style={{ color: '#d97706' }} />
                      </div>
                      <span className="text-[9px] font-normal uppercase tracking-[0.15em] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#d97706' }}>
                        {plan?.plus ? "Active" : "Plus"}
                      </span>
                    </div>
                    <h3 className={`text-[18px] font-normal tracking-tight ${isDark ? "text-zinc-50" : "text-zinc-900"}`}>
                      {plan?.plus ? "You're on Plus" : "Notes that quiz you"}
                    </h3>
                    <p className={`text-[12px] mt-1 max-w-[340px] leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      {plan?.plus
                        ? (plan.plusUntil ? `Renews or ends on ${new Date(plan.plusUntil).toLocaleDateString()}. Every AI feature is unlimited.` : "Every AI feature is unlimited.")
                        : "Pulp's timer, trees, grove and recall practice are free. Plus makes the AI side unlimited: cards from every session, graded answers, imports and writing AI."}
                    </p>
                  </div>
                </div>

                {plan?.plus ? (
                  <button
                    onClick={openBillingPortal}
                    className="w-full py-2.5 rounded-lg text-[12px] font-normal transition-all hover:brightness-110"
                    style={{ backgroundColor: ACCENT, color: ACCENT_CONTRAST, border: 'none', cursor: 'pointer' }}
                  >
                    Manage billing
                  </button>
                ) : (<>
                  {/* What's left of the free AI taste */}
                  {plan?.free && (
                    <div className={`grid grid-cols-2 gap-2`}>
                      {[
                        { label: "AI-carded sessions today", left: plan.free.cardSessionsLeftToday, of: plan.limits.cardSessionsPerDay },
                        { label: "AI-graded answers today", left: plan.free.gradesLeftToday, of: plan.limits.gradesPerDay },
                        { label: "Free AI requests", left: plan.free.writingAiLeft, of: plan.limits.writingAi },
                        { label: "Free imported sections", left: plan.free.importsLeft, of: plan.limits.imports },
                      ].map(u => (
                        <div key={u.label} className={`px-3 py-2.5 rounded-xl border ${isDark ? "bg-zinc-900/60 border-zinc-800/60" : "bg-white/80 border-zinc-200/60"}`}>
                          <div className={`text-[15px] tabular-nums ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>{u.left ?? u.of}<span className={`text-[11px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}> / {u.of} left</span></div>
                          <div className={`text-[10px] mt-0.5 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{u.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <PricingSection
                    className="relative z-10"
                    isDark={isDark}
                    accentColor={accentForTheme(accentColor, isDark ? "dark" : "light")}
                    tiers={[
                      {
                        name: "Plus",
                        price: { monthly: PLUS_PRICE.monthly, yearly: PLUS_PRICE.yearly },
                        description: "Unlimited AI recall",
                        buttonLabel: "Upgrade to Plus",
                        highlight: true,
                        icon: <Sparkles className="w-5 h-5" style={{ color: BRAND_ORANGE }} />, // matches the brand hero above
                        ctaOverride: ({ isYearly, ...props }) => <button {...props} style={{ ...props.style, color: ACCENT_CONTRAST }} onClick={() => startCheckout(isYearly ? 'plus_yearly' : 'plus_monthly')} />,
                        features: [
                          { name: "AI cards from every session", description: "Free: 2 sessions a day", included: true },
                          { name: "AI-graded answers", description: "Free: 15 a day, then grade yourself", included: true },
                          { name: "Unlimited imports", description: "Docs, Word, Notion, Obsidian (free: 12 sections)", included: true },
                          { name: "Unlimited writing AI", description: "Shortcut, chat and hub (free: 50 requests)", included: true },
                        ],
                      },
                    ]}
                  />

                  <button
                    onClick={openBillingPortal}
                    className={`mx-auto block text-[11.5px] font-normal transition-colors ${isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-700"}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Already subscribed? Manage billing →
                  </button>
                </>)}

                <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 ${isDark ? "bg-zinc-900/30 border-zinc-800/50" : "bg-zinc-50 border-zinc-200/60"}`}>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[11px] font-normal ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Schools & classes</span>
                    <span className={`text-[10.5px] ml-1.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>· Plus for a whole class</span>
                  </div>
                  <span className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>pulpsupport@gmail.com</span>
                </div>
              </div>
            )}

            {activeTab === "help" && (<>
              {/* Welcome */}
              <SettingSection title="Welcome to Pulp" isDark={isDark}>
                <div className="px-5 py-4 space-y-3">
                  <p className={`text-[12.5px] leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Pulp is a focused writing app designed to make the act of writing feel rewarding. Every feature is built around one idea: the more you write, the more your world grows.
                  </p>
                </div>
              </SettingSection>

              <SettingSection title="Getting Started" isDark={isDark}>
                <div className="px-5 py-4 space-y-4">
                  {[
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>, title: "Notebooks & Pages", desc: "Create notebooks from the sidebar. Each notebook holds multiple pages you can flip through. Click anywhere on a page to create a text box and start writing." },
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, title: "Text Boxes", desc: "Text boxes are freeform — drag to move, pull corners to resize. Use the toolbar above a selected box to change fonts, sizes, styles, and colors. Type / for quick commands." },
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, title: "Focus Timer", desc: "Open the timer from the sidebar or press Cmd+Opt+T. Pick a duration, select a seed, and start a session. Stay focused to grow your plant — if you leave or give up, it dies." },
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>, title: "Sap & XP", desc: "Sap is earned by writing and completing focus sessions — use it to buy seeds in the shop. XP unlocks cosmetics, accent colors, and other customizations as you level up." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isDark ? "bg-zinc-800/80 text-zinc-400" : "bg-zinc-200/80 text-zinc-500"}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[12px] font-normal ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{item.title}</p>
                        <p className={`text-[11.5px] leading-relaxed mt-0.5 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SettingSection>

              <SettingSection title="Your Orchard" isDark={isDark}>
                <div className="px-5 py-4 space-y-4">
                  {[
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8c0-5-5-5-5-5s-5 0-5 5c0 3 2 5.5 5 8 3-2.5 5-5 5-8z"/><path d="M12 16v6"/></svg>, title: "Growing Plants", desc: "Every completed focus session grows a plant. The plant type depends on the seed you select before starting. Plants are automatically assigned to whichever notebook you had open." },
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M2 9h20"/></svg>, title: "Seeds & Rarity", desc: "Seeds come in different rarities — common, uncommon, rare, true rare, and sacred. Fruit trees produce sap, paper trees yield lumber, and gem trees produce XP. Find seeds in the boutique." },
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>, title: "Watering", desc: "Sessions 10 minutes or longer require watering. A watering can appears in the timer — click it before the deadline or your plant dies and you lose all sap earned that session." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isDark ? "bg-zinc-800/80 text-zinc-400" : "bg-zinc-200/80 text-zinc-500"}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[12px] font-normal ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{item.title}</p>
                        <p className={`text-[11.5px] leading-relaxed mt-0.5 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SettingSection>

              <SettingSection title="Keyboard Shortcuts" isDark={isDark}>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {[
                      [formatShortcut(shortcuts.timer || "ctrl+alt+t"), "Toggle focus timer"],
                      [formatShortcut(shortcuts.newNote || "ctrl+n"), "New notebook"],
                      [formatShortcut(shortcuts.search || "ctrl+k"), "Search"],
                      [formatShortcut(shortcuts.aiCommand || "\\"), "Open AI"],
                      [formatShortcut(shortcuts.prevPage || "alt+arrowleft") + " " + formatShortcut(shortcuts.nextPage || "alt+arrowright"), "Previous / next page"],
                      [formatShortcut("ctrl+a"), "Select all boxes"],
                      [formatShortcut("ctrl+z"), "Undo"],
                      [formatShortcut("ctrl+shift+z"), "Redo"],
                      ["Arrow keys", "Nudge selected boxes or lines"],
                      [formatShortcut("alt") + " + Arrow", "Snap box to edge"],
                      ["Delete", "Delete selection"],
                      [formatShortcut(shortcuts.slash || "/"), "Slash commands"],
                      [formatShortcut(shortcuts.makeCard || "ctrl+shift+c"), "Recall card from highlighted text"],
                      ["Esc", "Close menus and panels"],
                    ].map(([key, desc], i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <span className={`text-[11px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{desc}</span>
                        <kbd className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded ${isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-zinc-100 text-zinc-600 border-zinc-200"} border`}>{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </SettingSection>

              <SettingSection title="Contact & Support" isDark={isDark}>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-zinc-800/80 text-zinc-400" : "bg-zinc-200/80 text-zinc-500"}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[12px] font-normal ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>General Support</p>
                      <a href="mailto:pulpsupport@gmail.com" className="text-[11.5px] text-[var(--accent)] hover:underline">pulpsupport@gmail.com</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-zinc-800/80 text-zinc-400" : "bg-zinc-200/80 text-zinc-500"}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[12px] font-normal ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>Report a Bug</p>
                      <p className={`text-[11.5px] mt-0.5 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                        Found something broken? Email us at{" "}
                        <a href="mailto:pulpsupport@gmail.com?subject=Bug%20Report" className="text-[var(--accent)] hover:underline">pulpsupport@gmail.com</a>
                        {" "}with a description of the issue and steps to reproduce it. Screenshots help!
                      </p>
                    </div>
                  </div>
                </div>
              </SettingSection>
            </>)}

          </div>
          <div className={`px-8 py-3.5 border-t ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"} shrink-0 flex items-center justify-between`}>
            <p className={`text-[11px] ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Changes save automatically</p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-[12.5px] font-normal transition-all hover:scale-105 active:scale-[0.97] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              style={{ backgroundColor: ACCENT, color: ACCENT_CONTRAST }}
            >Save changes</button>
          </div>
        </div>
      </div>

      {/* Delete confirmation popup */}
      {deleteConfirmType && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-md rounded-2xl" onMouseDown={e => e.stopPropagation()}>
          <div className={`w-[340px] ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"} border rounded-2xl shadow-2xl p-7 flex flex-col gap-5`}>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-1 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </div>
              <p className="text-[15px] font-normal">
                {deleteConfirmType === "notes" ? "Delete all notes?" : "Delete account?"}
              </p>
              <p className={`text-[12.5px] leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                {deleteConfirmType === "notes"
                  ? "Every note, page, and drawing will be permanently erased. This action cannot be undone."
                  : "Your account and all associated data will be permanently erased. This action cannot be undone."}
              </p>

              <div className="mt-2 space-y-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-normal ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Verify Username or Email</label>
                  <input
                    type="text"
                    value={deleteUsername}
                    onChange={(e) => setDeleteUsername(e.target.value)}
                    className={`w-full text-[12px] px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-zinc-800/50 border-zinc-700 focus:border-zinc-500/50" : "bg-white border-zinc-200 focus:border-zinc-400/50"}`}
                    placeholder="Your username or email"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-normal ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Verify Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className={`w-full text-[12px] px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-zinc-800/50 border-zinc-700 focus:border-zinc-500/50" : "bg-white border-zinc-200 focus:border-zinc-400/50"}`}
                    placeholder="Enter password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-2">
              <button
                onClick={() => { setDeleteConfirmType(null); setDeleteUsername(""); setDeletePassword(""); }}
                className={`flex-1 text-[12.5px] font-normal py-2.5 rounded-xl border transition-all ${isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
              >
                Cancel
              </button>
              <button
                disabled={!deleteUsername || !deletePassword || deleting}
                onClick={async () => {
                  if (!deleteUsername || !deletePassword) return;
                  setDeleting(true);

                  try {
                    const user = (await supabase.auth.getUser()).data.user
                    if (!user) {
                      alert("Authentication error. Please try again.");
                      setDeleting(false);
                      return;
                    }

                    const result = await verifyPasswordAndDelete(
                      user.id,
                      deletePassword,
                      deleteConfirmType as "account" | "notes",
                      deleteUsername
                    )

                    if (!result.success) {
                      alert(result.error || "Verification failed");
                      setDeletePassword("");
                      setDeleting(false);
                      return;
                    }

                    if (deleteConfirmType === "notes") {
                      localStorage.removeItem("pulp-notes");
                      localStorage.removeItem("pulp-folders");
                      localStorage.removeItem("pulp-active-tab");
                      localStorage.removeItem("pulp-pending-deletes");
                      localStorage.removeItem("pulp-trash");
                    } else {
                      // Account is gone: don't leave its notes or session in this browser
                      await supabase.auth.signOut().catch(() => {});
                      localStorage.clear();
                      sessionStorage.clear();
                    }

                    setDeleteConfirmType(null);
                    setDeleteUsername("");
                    setDeletePassword("");
                    window.location.reload();
                  } catch (err) {
                    console.error("Delete failed:", err);
                    alert("Something went wrong. Check console.");
                    setDeleting(false);
                  }
                }}
                className={`flex-1 text-[12.5px] font-normal py-2.5 rounded-xl transition-all active:scale-[0.97] ${(!deleteUsername || !deletePassword || deleting) ? "bg-red-500/50 text-white/50 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}
              >
                {deleting ? "Deleting..." : (deleteConfirmType === "notes" ? "Delete All" : "Delete Account")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

function SyncSection({ isDark, onSyncNow }: { isDark: boolean; onSyncNow: () => Promise<{ pushed: number; pulled: number } | null> }) {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ pushed: number; pulled: number } | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const r = await onSyncNow()
      setResult(r)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <SettingSection title="Cloud Sync" isDark={isDark}>
      <div className="flex flex-col gap-3 p-5">
        <p className={`text-[11px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
          Merge local and cloud notebooks. Local edits are preserved — missing notebooks are synced in both directions.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className={`w-full py-2.5 rounded-lg border text-[12px] font-normal transition-all flex items-center justify-center gap-2 ${isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 disabled:opacity-50" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 shadow-sm disabled:opacity-50"}`}
        >
          {syncing ? (
            <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Syncing...</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg> Sync Now</>
          )}
        </button>
        {result && (
          <p className={`text-[11px] text-center ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            {result.pushed === 0 && result.pulled === 0
              ? "Everything is in sync."
              : `Pushed ${result.pushed}, pulled ${result.pulled} notebook${result.pulled !== 1 ? "s" : ""}.`}
          </p>
        )}
      </div>
    </SettingSection>
  )
}

function SoundSection({ isDark }: { isDark: boolean }) {
  const [prefs, setPrefs] = useState(getSoundPrefs)
  const update = (patch: Partial<SoundPrefs>) => { setSoundPrefs(patch); setPrefs(getSoundPrefs()) }
  return (
    <SettingSection title="Sound" isDark={isDark}>
      <SettingRow
        title="Sound effects"
        isDark={isDark}
        description="Chimes for the timer, trees, sap, the market, and recall"
        control={<SettingToggle checked={prefs.enabled} onChange={v => { update({ enabled: v }); if (v) playSound("correct") }} isDark={isDark} />}
      />
      {prefs.enabled && (
        <SettingRow
          title="Volume"
          isDark={isDark}
          control={
            <input
              type="range" min={0} max={100} step={5}
              value={Math.round(prefs.volume * 100)}
              onChange={e => update({ volume: Number(e.target.value) / 100 })}
              onPointerUp={() => playSound("correct")}
              onKeyUp={() => playSound("correct")}
              aria-label="Sound volume"
              style={{ width: 120, accentColor: ACCENT }}
            />
          }
        />
      )}
    </SettingSection>
  )
}

function StorageBar({ isDark }: { isDark: boolean }) {
  const [usedBytes, setUsedBytes] = useState(0)

  useEffect(() => {
    let total = 0
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          total += key.length + (localStorage.getItem(key)?.length || 0)
        }
      }
      total *= 2
    } catch { /* ignore */ }
    setUsedBytes(total)
  }, [])

  const QUOTA = 10 * 1024 * 1024 // 10 MB free tier
  const pct = Math.min(100, (usedBytes / QUOTA) * 100)
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1)
  const quotaMB = (QUOTA / (1024 * 1024)).toFixed(0)
  const isHigh = pct > 80

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-[12px] font-normal ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Used space</span>
        <span className={`text-[11px] font-mono tabular-nums ${isHigh ? "text-amber-500 font-normal" : (isDark ? "text-zinc-500" : "text-zinc-400")}`}>
          {usedMB} MB / {quotaMB} MB
        </span>
      </div>
      <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-zinc-200/60"}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHigh
              ? "bg-gradient-to-r from-amber-400 to-red-500"
              : isDark
                ? "bg-gradient-to-r from-zinc-600 to-zinc-500"
                : "bg-gradient-to-r from-zinc-400 to-zinc-300"
          }`}
          style={{ width: `${Math.max(1, pct)}%` }}
        />
      </div>
      <p className={`text-[10px] ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
        Free plan: {quotaMB} MB local storage. Upgrade for more capacity.
      </p>
    </div>
  )
}


function ShortcutKey({ label, id, currentKey, defaultKey, onUpdate, isDark }: {
  label: string; id: string; currentKey: string; defaultKey: string; onUpdate: (id: string, key: string) => void; isDark: boolean
}) {
  const [isRecording, setIsRecording] = useState(false)
  const isCustom = currentKey !== defaultKey

  useEffect(() => {
    if (!isRecording) return
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === "Escape") { setIsRecording(false); return }

      if (!e.key || isModifierKey(e)) return
      const combo = shortcutFromEvent(e)
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
      // A bare letter would fire while typing; only / and \ are allowed alone
      if (!hasModifier && combo.length === 1 && !['/', '\\'].includes(combo)) return
      onUpdate(id, combo)
      setIsRecording(false)
    }
    window.addEventListener("keydown", handler, true)
    return () => window.removeEventListener("keydown", handler, true)
  }, [isRecording, id, onUpdate])

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"}`}>
      <span className={`text-[12px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{label}</span>
      <div className="flex items-center gap-1.5">
        {isCustom && (
          <button
            onClick={() => onUpdate(id, defaultKey)}
            className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${isDark ? "text-zinc-600 hover:text-zinc-400 hover:bg-white/5" : "text-zinc-400 hover:text-zinc-600 hover:bg-black/5"}`}
            title="Reset to default"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        )}
        <button
          onClick={() => setIsRecording(true)}
          className={`min-w-[40px] px-2 py-1 rounded text-[10px] font-mono font-normal border transition-all active:scale-95 ${isRecording ? (isDark ? "bg-[rgb(var(--accent-rgb)/0.2)] border-[var(--accent)] text-[var(--accent)]" : "bg-[rgb(var(--accent-rgb)/0.08)] border-[rgb(var(--accent-rgb)/0.35)] text-[var(--accent)]") : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500" : "bg-white border-zinc-200 text-zinc-600 shadow-sm hover:border-zinc-400")}`}
        >
          {isRecording ? "Press keys..." : formatShortcut(currentKey)}
        </button>
      </div>
    </div>
  )
}


