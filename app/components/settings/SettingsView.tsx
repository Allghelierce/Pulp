"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { SettingToggle } from "./SettingToggle"
import { SettingRow } from "./SettingRow"
import { SettingSection } from "./SettingSection"
import { PricingSection } from "@/components/blocks/pricing-section"
import MinimalPaymentModal from "@/components/ui/minimal-payment-modal"
import { Zap, Sparkles } from "lucide-react"
import { DestructiveButton } from "@/components/ui/destructive-button"
import { verifyPasswordAndDelete } from "@/app/actions/deleteAccount"
import type { Achievement, NoteData } from "@/app/types"

// ── Settings tabs config ───────────────────────────────────────────────────

const TAB_DESCRIPTIONS: Record<string, string> = {
  general: "Account, shortcuts, and application preferences",
  appearance: "Theme, fonts, paper style, and visual customization",
  achievements: "Track your progress and claim rewards",
  editor: "Writing tools, layout, and focus mode",
  focus: "Block distracting websites and apps",
  data: "Storage, exports, and account management",
  subscription: "Manage your plan and billing",
  help: "Welcome guide, support, and bug reports",
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  general: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  appearance: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 0 20 4 4 0 0 0 0-8 4 4 0 0 1 0-8"/><circle cx="12" cy="9" r="1" fill="currentColor"/></svg>,
  achievements: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 22V8a4 4 0 0 0-4-4H4v9a4 4 0 0 0 4 4h2"/><path d="M14 22V8a4 4 0 0 1 4-4h2v9a4 4 0 0 1-4 4h-2"/></svg>,
  focus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  editor: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  data: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>,
  subscription: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>,
  help: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
}

export const SETTINGS_TABS = [
  { id: "general", label: "General", group: "App" },
  { id: "appearance", label: "Appearance", group: "App" },
  { id: "achievements", label: "Achievements", group: "App" },
  { id: "editor", label: "Editor", group: "Writing" },
  { id: "data", label: "Data & Storage", group: "Advanced" },
  { id: "subscription", label: "Pro", group: "Premium" },
  { id: "help", label: "Help", group: "Support" },
] as const
export type SettingsTabId = typeof SETTINGS_TABS[number]["id"]

export const ACCENT_COLORS: { hex: string; name: string; cost?: number; pro?: boolean }[] = [
  { hex: "#71717a", name: "Gray" },
  { hex: "#f97316", name: "Orange", cost: 1 },
  { hex: "#ef4444", name: "Red", cost: 1 },
  { hex: "#ec4899", name: "Pink", cost: 2 },
  { hex: "#a855f7", name: "Purple", cost: 2 },
  { hex: "#3b82f6", name: "Blue", cost: 2 },
  { hex: "#06b6d4", name: "Cyan", cost: 2 },
  { hex: "#22c55e", name: "Green", pro: true },
  { hex: "#64748b", name: "Slate", pro: true },
]

export const FONT_OPTIONS: { value: string; label: string; cost?: number; pro?: boolean }[] = [
  { value: "EB Garamond", label: "EB Garamond" },
  { value: "Playfair Display", label: "Playfair Display", cost: 2 },
  { value: "Georgia", label: "Georgia", cost: 1 },
  { value: "Arial", label: "Arial", cost: 1 },
]

export const HEADING_FONT_OPTIONS: { value: string; label: string; cost?: number; pro?: boolean }[] = [
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "EB Garamond", label: "EB Garamond", cost: 1 },
  { value: "Italiana", label: "Italiana", cost: 2 },
  { value: "Bodoni", label: "Bodoni", pro: true },
]

export const PAGE_STYLE_OPTIONS: { value: string; label: string; cost?: number; pro?: boolean }[] = [
  { value: "lined", label: "Lined" },
  { value: "dotgrid", label: "Grid", cost: 1 },
  { value: "plain", label: "Plain", cost: 2 },
  { value: "steno", label: "Steno", pro: true },
]

// ── Sub-components ──────────────────────────────────────────────────────────

function SegmentedControl({ options, value, onChange, isDark }: { 
  options: [string, string][]; 
  value: string; 
  onChange: (v: string) => void;
  isDark: boolean;
}) {
  return (
    <div className={`flex rounded-lg overflow-hidden border p-0.5 gap-0.5 ${isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-100"} text-[11px] font-semibold`}>
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
  lineSpacing: "compact" | "normal" | "relaxed"; paperStyle: "lined" | "dotgrid" | "plain" | "steno"
  showBinding: boolean; reduceMotion: boolean; reduceVisuals: boolean; sidebarOnStart: boolean
  bgEffect: boolean; smearEffect: boolean; handwrittenEffect: boolean
  language: string; defaultSort: string; wordCountVisible: boolean
  focusMode: boolean; baseFontSize: "small" | "medium" | "large"
  pageLayout: "paginated" | "scroll"
  shortcuts: Record<string, string>
  blockedSites: string[]; blockedApps: string[]
  devMode: boolean; isDevUnlocked: boolean
}

export function SettingsView({ user, onClose, config, onUpdateConfig, achievements, onClaimAchievement, trashNotes, onRestoreNote, onPermanentlyDeleteNote, unlockedCosmetics, gems, setGems, setUnlockedCosmetics, onOpenShopItem }: {
  user: { email?: string } | null
  onClose: () => void
  config: PulpConfig
  onUpdateConfig: (updates: Partial<PulpConfig>) => void
  achievements: Achievement[]
  onClaimAchievement: (id: string) => void
  trashNotes: NoteData[]
  onRestoreNote: (id: string) => void
  onPermanentlyDeleteNote: (id: string) => void
  unlockedCosmetics: string[]
  gems: number
  setGems: React.Dispatch<React.SetStateAction<number>>
  setUnlockedCosmetics: React.Dispatch<React.SetStateAction<string[]>>
  onOpenShopItem?: (itemId: string) => void
}) {
  const { 
    accentColor, theme, autoSave, spellCheck, autoCorrect, autoCapitalize, editorFont, headingFont,
    lineSpacing, paperStyle, showBinding, reduceMotion, reduceVisuals, sidebarOnStart, bgEffect,
    smearEffect, handwrittenEffect, language, defaultSort, wordCountVisible, focusMode, baseFontSize,
    pageLayout, shortcuts, blockedSites, blockedApps, devMode, isDevUnlocked
  } = config
  const isDark = theme === "dark"
  const isPremium = user?.email?.includes("pro") || false
  const [activeTab, setActiveTab] = useState<SettingsTabId>("general")

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
      <div onMouseDown={e => e.stopPropagation()} className={`relative w-full max-w-[900px] ${isDark ? "bg-[#0a0a0c] text-zinc-100 border-zinc-800/80" : "bg-[#f5f3f1] text-zinc-900 border-zinc-200/80"} rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border flex overflow-hidden`} style={{ height: 660 }}>

        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-20 w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        {/* ── Sidebar ── */}
        <div className={`w-[200px] ${isDark ? "bg-[#060608] border-zinc-800/80" : "bg-[#ece8e5] border-zinc-200/70"} border-r flex flex-col shrink-0`}>
          <div className="px-5 pt-6 pb-4">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-zinc-400"}`} style={{ fontFamily: 'var(--font-italiana)' }}>Settings</p>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
            {visibleGroups.map(group => (
              <div key={group.name} className={group.name === "Premium" ? (isDark ? "pt-3 mt-3 border-t border-zinc-800" : "pt-3 mt-3 border-t border-zinc-300/40") : "mb-1"}>
                <p className={`text-[9.5px] font-bold uppercase tracking-widest px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`} style={{ fontFamily: 'var(--font-italiana)' }}>{group.name}</p>
                {group.tabs.map(tab => {
                  const isPremium = tab.id === "subscription"
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id as SettingsTabId); setSearchQuery("") }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
                        isActive
                          ? isPremium
                            ? isDark ? "bg-[#ea580c]/10 text-[#ea580c]" : "bg-[#ea580c]/10 text-[#ea580c]"
                            : isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                          : isPremium
                            ? isDark ? "text-[#ea580c]/70 hover:bg-[#ea580c]/5" : "text-[#ea580c]/70 hover:bg-[#ea580c]/5"
                            : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                      }`}
                      style={{ fontFamily: 'var(--font-italiana)' }}
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
            <p className={`text-[10px] font-medium ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Pulp · v1.0.0</p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`px-8 pt-6 pb-4 border-b ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"} shrink-0`}>
            <h2 className="text-[15px] font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-italiana)', color: isDark ? '#dcd8d0' : '#2a2620' }}>
              {SETTINGS_TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ fontFamily: 'var(--font-italiana)', color: isDark ? '#5a5650' : '#a8a4a0' }}>
              {TAB_DESCRIPTIONS[activeTab] ?? ""}
            </p>
          </div>

          <div className={`flex-1 overflow-y-auto px-8 py-6 ${isDark ? "bg-[#0a0a0c]" : "bg-[#f5f3f1]"}`}>

            {/* ── General ── */}
            {activeTab === "general" && (<>
              <SettingSection title="Account" isDark={isDark}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold text-white shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, #ea580c99, #ea580c)' }}>
                    {user?.email?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-semibold truncate ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{user?.email ?? "Not signed in"}</p>
                    <span className={`inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"}`}>Free Plan</span>
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
                        className={`text-[11.5px] font-semibold px-3.5 py-1.5 rounded-lg transition-all ${isDark ? "text-red-400 bg-red-950/40 hover:bg-red-950/70 border border-red-900/50" : "text-red-600 bg-red-50 hover:bg-red-100 border border-red-100"}`}
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
                        className={`text-[11.5px] font-semibold px-3.5 py-1.5 rounded-lg transition-all ${isDark ? "text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-900/50" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100"}`}
                      >
                        Sign In
                      </button>
                    }
                  />
                )}
              </SettingSection>

              <SettingSection title="Preferences" isDark={isDark}>
                <SettingRow
                  title="Default Sort Order"
                  isDark={isDark}
                  description="How your notes are sorted in the sidebar"
                  control={
                    <select
                      value={defaultSort}
                      onChange={e => onUpdateConfig({ defaultSort: e.target.value })}
                      className={`text-[11px] border ${isDark ? "bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-zinc-500" : "bg-white border-zinc-200 text-zinc-800 focus:border-zinc-400"} rounded-none px-2.5 py-1.5 outline-none transition-colors`}
                    >
                      <option value="modified">Date Modified</option>
                      <option value="created">Date Created</option>
                      <option value="title">Alphabetical (A-Z)</option>
                    </select>
                  }
                />
              </SettingSection>

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
                </div>
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

              <SettingSection title="Personalization" isDark={isDark}>
                <div className="px-5 py-4">
                  <p className={`text-[12px] font-semibold mb-3 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Accent Color</p>
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
                            goToShop(id)
                          }}
                          title={unlocked ? name : pro ? `${name} — Pro only` : `${name} — Unlock in Shop`}
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
                                <span className="text-[7px] font-black bg-amber-500 text-white px-1 rounded-full leading-tight">PRO</span>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#a1a1aa" : "#71717a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              )}
                            </div>
                          )}
                          <span className={`text-[9px] font-medium transition-colors ${selected ? (isDark ? "text-zinc-200" : "text-zinc-700") : isDark ? "text-zinc-600 group-hover:text-zinc-400" : "text-zinc-400 group-hover:text-zinc-600"}`}>{name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </SettingSection>

              <SettingSection title="Interface" isDark={isDark}>
                <SettingRow
                  title="Show sidebar on launch"
                  isDark={isDark}
                  control={<SettingToggle checked={sidebarOnStart} onChange={v => onUpdateConfig({ sidebarOnStart: v })} isDark={isDark} />}
                />
                <SettingRow
                  title="Status bar"
                  isDark={isDark}
                  description="Show word count and stats in the bottom-right"
                  control={<SettingToggle checked={wordCountVisible} onChange={v => onUpdateConfig({ wordCountVisible: v })} isDark={isDark} />}
                />
              </SettingSection>

              <SettingSection title="Font Selection" isDark={isDark}>
                <div className="px-5 py-4">
                  <p className={`text-[12px] font-semibold mb-2 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Heading Font</p>
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
                            goToShop(id)
                          }}
                          className={`relative px-3 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
                            selected
                              ? isDark ? "bg-zinc-700 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-900 text-white"
                              : unlocked
                                ? isDark ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                : isDark ? "bg-zinc-900/50 border-zinc-800/50 text-zinc-600 cursor-pointer" : "bg-zinc-50 border-zinc-200/50 text-zinc-400 cursor-pointer"
                          }`}
                          style={{ fontFamily: `"${value}", serif` }}
                          title={unlocked ? label : pro ? `${label} — Pro only` : `${label} — Unlock in Shop`}
                        >
                          {label}
                          {!unlocked && (
                            <span className="absolute -top-1.5 -right-1.5">
                              {pro ? (
                                <span className="text-[7px] font-black bg-amber-500 text-white px-1 rounded-full leading-tight">PRO</span>
                              ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#a1a1aa" : "#71717a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              )}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className={`text-[12px] font-semibold mb-2 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Body Copy Font</p>
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
                            goToShop(id)
                          }}
                          className={`relative px-3 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
                            selected
                              ? isDark ? "bg-zinc-700 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-900 text-white"
                              : unlocked
                                ? isDark ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                : isDark ? "bg-zinc-900/50 border-zinc-800/50 text-zinc-600 cursor-pointer" : "bg-zinc-50 border-zinc-200/50 text-zinc-400 cursor-pointer"
                          }`}
                          style={{ fontFamily: `"${value}", serif` }}
                          title={unlocked ? label : pro ? `${label} — Pro only` : `${label} — Unlock in Shop`}
                        >
                          {label}
                          {!unlocked && (
                            <span className="absolute -top-1.5 -right-1.5">
                              {pro ? (
                                <span className="text-[7px] font-black bg-amber-500 text-white px-1 rounded-full leading-tight">PRO</span>
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
                  <p className={`text-[12px] font-semibold mb-2 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Page Style</p>
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
                            goToShop(id)
                          }}
                          className={`relative px-3 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
                            selected
                              ? isDark ? "bg-zinc-700 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-900 text-white"
                              : unlocked
                                ? isDark ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                : isDark ? "bg-zinc-900/50 border-zinc-800/50 text-zinc-600 cursor-pointer" : "bg-zinc-50 border-zinc-200/50 text-zinc-400 cursor-pointer"
                          }`}
                          title={unlocked ? label : pro ? `${label} — Pro only` : `${label} — Unlock in Shop`}
                        >
                          {label}
                          {!unlocked && (
                            <span className="absolute -top-1.5 -right-1.5">
                              {pro ? (
                                <span className="text-[7px] font-black bg-amber-500 text-white px-1 rounded-full leading-tight">PRO</span>
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
                  title="Show spiral binding"
                  isDark={isDark}
                  description="Display the decorative binding on the left edge"
                  control={<SettingToggle checked={showBinding} onChange={v => onUpdateConfig({ showBinding: v })} isDark={isDark} />}
                />
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
              </SettingSection>
            </>)}


            {/* ── Editor ── */}
            {activeTab === "editor" && (<>
              <SettingSection title="Writing" isDark={isDark}>
                <SettingRow
                  title="Auto-save"
                  isDark={isDark}
                  description="Sync changes to the cloud every 2 seconds"
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

              <SettingSection title="Layout" isDark={isDark}>
                <SettingRow
                  title="Page layout"
                  isDark={isDark}
                  description="Paginated shows one page at a time. Scroll mode stacks all pages vertically like a document."
                  control={
                    <SegmentedControl
                      options={[["paginated", "Paginated"], ["scroll", "Scroll"]]}
                      value={pageLayout || "paginated"}
                      onChange={v => onUpdateConfig({ pageLayout: v as "paginated" | "scroll" })}
                      isDark={isDark}
                    />
                  }
                />
              </SettingSection>

              <SettingSection title="Focus" isDark={isDark}>
                <SettingRow
                  title="Focus mode"
                  isDark={isDark}
                  description="Dim interface elements when typing to minimize distractions"
                  control={<SettingToggle checked={focusMode} onChange={v => onUpdateConfig({ focusMode: v })} isDark={isDark} />}
                />
              </SettingSection>
            </>)}


            {/* ── Achievements ── */}
            {activeTab === "achievements" && (<>
              <div className="px-5 py-4 grid gap-3">
                {achievements.map((a: Achievement) => {
                  const isClaimable = a.completed && !a.claimed
                  const isClaimed = a.claimed
                  const progress = a.goal ? Math.min(100, Math.floor(((a.progress || 0) / a.goal) * 100)) : (a.completed ? 100 : 0)
                  
                  return (
                    <div 
                      key={a.id} 
                      className={`relative overflow-hidden rounded-xl border p-4 transition-all ${isDark ? (isClaimable ? "bg-orange-500/10 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]" : "bg-zinc-900 border-zinc-800") : (isClaimable ? "bg-orange-50 border-orange-100 shadow-[0_4px_12px_rgba(249,115,22,0.1)]" : "bg-white border-zinc-200 shadow-sm")}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-colors ${
                          isClaimable
                            ? isDark ? "bg-orange-500/20" : "bg-orange-100/60"
                            : isClaimed
                            ? isDark ? "bg-green-500/20" : "bg-green-100/40"
                            : isDark ? "bg-zinc-800" : "bg-zinc-100/80"
                        }`}>
                          {a.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-[13px] font-bold ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>{a.title}</h4>
                            {isClaimed && <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest text-[9px]">Claimed ✓</span>}
                          </div>
                          <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{a.description}</p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${isClaimable ? (isDark ? "bg-orange-500/20 border-orange-500/40 text-orange-400" : "bg-orange-100 border-orange-200 text-orange-600") : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-zinc-100 border-zinc-200 text-zinc-400")}`}>
                            {a.rewardType === 'gems' ? '💎' : '🧃'} {a.reward}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar for goals */}
                      {a.goal && !a.completed && (
                        <div className="mb-4 mt-1">
                          <div className="flex justify-between text-[9px] font-mono mb-1.5 opacity-50">
                            <span className="uppercase tracking-tighter">Progress</span>
                            <span>{Math.floor(a.progress || 0)} / {a.goal}</span>
                          </div>
                          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-zinc-100 shadow-inner"}`}>
                            <div 
                              className={`h-full transition-all duration-700 ease-out ${isDark ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.2)]"}`} 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                        </div>
                      )}

                      {isClaimed ? (
                        <div className={`text-[10px] font-bold uppercase tracking-[0.2em] text-center py-2.5 rounded-lg ${isDark ? "bg-zinc-800/20 text-zinc-600" : "bg-zinc-50 text-zinc-300"}`}>
                          Claimed
                        </div>
                      ) : isClaimable ? (
                        <button 
                          onClick={() => onClaimAchievement(a.id)}
                          className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.98] ring-1 ring-white/20"
                        >
                          Claim Reward
                        </button>
                      ) : (
                        <div className={`text-[10px] font-bold uppercase tracking-[0.2em] text-center py-2.5 rounded-lg border border-dashed transition-colors ${isDark ? "border-zinc-800/80 text-zinc-700" : "border-zinc-200/60 text-zinc-300"}`}>
                          {a.goal ? "In Progress" : "Locked"}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>)}

            {/* ── Data ── */}
            {activeTab === "data" && (<>
               <SettingSection title="Local Storage" isDark={isDark}>
                 <StorageBar isDark={isDark} />
               </SettingSection>
               <SettingSection title="Exports" isDark={isDark}>
                 <div className="flex flex-col gap-2 p-5">
                   <button className={`w-full py-2.5 rounded-lg border text-[12px] font-semibold transition-all ${isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 shadow-sm"}`}>
                     Export Binder as JSON
                   </button>
                   <button 
                     onClick={() => { if (confirm("Clear all local storage? This cannot be undone.")) { localStorage.clear(); window.location.reload(); } }}
                     className={`w-full py-2.5 rounded-lg border text-[12px] font-semibold transition-all ${isDark ? "bg-red-900/20 border-red-900/30 hover:bg-red-900/30 text-red-400" : "bg-red-50 border-red-100 hover:bg-red-100/50 text-red-600 shadow-sm"}`}
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
                       <div key={tn.id} className={`group flex items-center justify-between gap-3 p-3 rounded border-b ${isDark ? "border-zinc-800/50 hover:bg-zinc-800/30" : "border-zinc-200/50 hover:bg-zinc-50/50"} transition-colors last:border-b-0`}>
                         <span className={`text-[12px] truncate ${isDark ? "text-zinc-400 group-hover:text-zinc-300" : "text-zinc-600 group-hover:text-zinc-700"}`}>
                           {tn.subject || "Untitled"}
                         </span>
                         <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button
                             onClick={() => onRestoreNote(tn.id)}
                             className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${isDark ? "text-green-400 hover:bg-green-500/20" : "text-green-600 hover:bg-green-100/50"}`}
                           >
                             Restore
                           </button>
                           <button
                             onClick={() => onPermanentlyDeleteNote(tn.id)}
                             className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-600 hover:bg-red-100/50"}`}
                           >
                             Delete
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </SettingSection>
               )}

               {isDevUnlocked && (
                 <SettingSection title="Developer" isDark={isDark}>
                   <SettingRow
                     title={
                       <div className="flex items-center gap-2">
                         Dev Mode
                         <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-500 text-[8px] font-black uppercase tracking-tighter border border-orange-500/30">
                           Verified Authority
                         </span>
                       </div>
                     }
                     isDark={isDark}
                     description="Grant infinite Juice and Gems for testing"
                     control={<SettingToggle checked={devMode} onChange={v => onUpdateConfig({ devMode: v })} isDark={isDark} />}
                   />
                   <div className="px-5 pb-3">
                     <p className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-400"} italic`}>Note: Infinite balances won't affect stored achievement progress.</p>
                   </div>
                 </SettingSection>
               )}

               <div className="mb-7">
                <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] mb-2.5 px-0.5 ${isDark ? "text-red-500/70" : "text-red-500/60"}`}>
                  Danger Zone
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
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden">
                {/* Fun doodles */}
                <svg className="absolute -top-2 -right-4 pointer-events-none" width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ opacity: isDark ? 0.12 : 0.1 }}>
                  <path d="M20 60 Q25 20 40 15 Q55 10 60 40 Q65 55 50 65 Q35 72 20 60Z" stroke={isDark ? '#ea580c' : '#ea580c'} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M35 35 L38 28 M42 33 L44 26" stroke={isDark ? '#ea580c' : '#ea580c'} strokeWidth="1" strokeLinecap="round" />
                  <circle cx="37" cy="42" r="1.5" fill={isDark ? '#ea580c' : '#ea580c'} />
                  <circle cx="45" cy="40" r="1.5" fill={isDark ? '#ea580c' : '#ea580c'} />
                  <path d="M38 48 Q41 51 44 48" stroke={isDark ? '#ea580c' : '#ea580c'} strokeWidth="1" fill="none" strokeLinecap="round" />
                </svg>
                <svg className="absolute top-16 -left-6 pointer-events-none" width="70" height="70" viewBox="0 0 70 70" fill="none" style={{ opacity: isDark ? 0.1 : 0.08 }}>
                  <path d="M35 8 L38 22 L52 18 L42 28 L55 35 L42 38 L48 52 L35 42 L22 52 L28 38 L15 35 L28 28 L18 18 L32 22Z" stroke={isDark ? '#facc15' : '#eab308'} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <svg className="absolute bottom-24 -right-2 pointer-events-none" width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ opacity: isDark ? 0.1 : 0.08 }}>
                  <path d="M30 10 Q35 25 45 30 Q35 35 30 50 Q25 35 15 30 Q25 25 30 10Z" stroke={isDark ? '#22c55e' : '#16a34a'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M30 20 L30 40 M22 30 L38 30" stroke={isDark ? '#22c55e' : '#16a34a'} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
                </svg>
                <svg className="absolute bottom-8 left-4 pointer-events-none" width="90" height="40" viewBox="0 0 90 40" fill="none" style={{ opacity: isDark ? 0.08 : 0.06 }}>
                  <path d="M5 30 Q15 8 30 20 Q45 32 55 12 Q65 0 85 18" stroke={isDark ? '#c084fc' : '#a855f7'} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <circle cx="15" cy="16" r="2" stroke={isDark ? '#c084fc' : '#a855f7'} strokeWidth="1" fill="none" />
                  <circle cx="55" cy="10" r="1.5" stroke={isDark ? '#c084fc' : '#a855f7'} strokeWidth="1" fill="none" />
                  <circle cx="78" cy="20" r="2.5" stroke={isDark ? '#c084fc' : '#a855f7'} strokeWidth="1" fill="none" />
                </svg>
                <svg className="absolute top-40 right-8 pointer-events-none" width="50" height="50" viewBox="0 0 50 50" fill="none" style={{ opacity: isDark ? 0.09 : 0.07 }}>
                  <path d="M10 25 Q15 10 25 8 Q35 6 40 20" stroke={isDark ? '#f97316' : '#ea580c'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M25 8 L25 42" stroke={isDark ? '#8b6914' : '#78590f'} strokeWidth="1" strokeLinecap="round" />
                  <path d="M25 42 Q22 44 18 42 M25 42 Q28 44 32 42" stroke={isDark ? '#8b6914' : '#78590f'} strokeWidth="0.8" fill="none" strokeLinecap="round" />
                </svg>

                <div className="relative z-10">
                  <h3 className={`text-[14px] font-bold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>Upgrade to Pro</h3>
                  <p className={`text-[11px] mt-0.5 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Unlimited AI, more storage, and priority support</p>
                </div>

                <PricingSection
                  className="relative z-10"
                  isDark={isDark}
                  accentColor="#ea580c"
                  tiers={[
                    {
                      name: "Creator",
                      price: { monthly: 4, yearly: 36 },
                      description: "Write smarter with AI",
                      buttonLabel: "Upgrade to Creator",
                      icon: <Sparkles className="w-5 h-5" style={{ color: '#ea580c' }} />,
                      ctaOverride: (props) => <MinimalPaymentModal><button {...props} /></MinimalPaymentModal>,
                      features: [
                        { name: "Cloud Sync", description: "Access notes from any device", included: true },
                        { name: "Grove & Achievements", description: "Plant trees, earn juice, unlock rewards", included: true },
                        { name: "Focus Timer Rewards", description: "Grow plants and earn XP while you study", included: true },
                        { name: "Unlimited Storage", description: "No limits on notes, images, or media", included: true },
                      ],
                    },
                    {
                      name: "Pro",
                      price: { monthly: 8, yearly: 72 },
                      description: "The full Pulp experience",
                      buttonLabel: "Upgrade to Pro",
                      highlight: true,
                      badge: "Most Popular",
                      icon: <Sparkles className="w-5 h-5" style={{ color: '#ea580c' }} />,
                      ctaOverride: (props) => <MinimalPaymentModal><button {...props} /></MinimalPaymentModal>,
                      features: [
                        { name: "Everything in Creator", description: "AI, sync, and all gamification", included: true },
                        { name: "Season Pass", description: "Exclusive seasonal seeds, cosmetics, and challenges", included: true },
                        { name: "Rare Seed Drops", description: "Bonus rare & legendary seeds every month", included: true },
                        { name: "Unlimited AI", description: "Summaries, quizzes, and rewrites", included: true },
                      ],
                    },
                  ]}
                />

                <div className={`relative z-10 px-4 py-3 rounded-lg border flex items-center gap-3 ${isDark ? "bg-zinc-900/40 border-zinc-800/80" : "bg-zinc-50 border-zinc-200/70"}`}>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[11.5px] font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Enterprise & Education</span>
                    <span className={`text-[11px] ml-1.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>· Custom volume licensing</span>
                  </div>
                  <button className={`px-3.5 py-1.5 rounded-lg ${isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-zinc-200/80 text-zinc-700 hover:bg-zinc-300/80"} text-[10px] font-semibold transition-all shrink-0`}>
                    Contact Sales
                  </button>
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
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>, title: "Juice & Gems", desc: "Juice is earned by writing and completing focus sessions — use it to buy seeds in the shop. Gems are a premium currency for cosmetics, orchard expansion, and accent colors." },
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: "Focus Blocker", desc: "Block distracting websites while your timer is running. Add sites in the focus blocker panel. Removing a site costs 50 gems to discourage impulsive unblocking. Install the Chrome extension for enforcement." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isDark ? "bg-zinc-800/80 text-zinc-400" : "bg-zinc-200/80 text-zinc-500"}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[12px] font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{item.title}</p>
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
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M2 9h20"/></svg>, title: "Seeds & Rarity", desc: "Seeds come in different rarities — common, uncommon, rare, and legendary. Fruit trees produce juice, paper trees yield lumber, and gem trees produce gems. Find seeds in the boutique." },
                    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>, title: "Watering", desc: "Sessions 10 minutes or longer require watering. A watering can appears in the timer — click it before the deadline or your plant dies and you lose all juice earned that session." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isDark ? "bg-zinc-800/80 text-zinc-400" : "bg-zinc-200/80 text-zinc-500"}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[12px] font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{item.title}</p>
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
                      ["Cmd + Opt + T", "Toggle focus timer"],
                      ["Cmd + A", "Select all text boxes"],
                      ["Cmd + Z", "Undo"],
                      ["Cmd + Shift + Z", "Redo"],
                      ["Arrow keys", "Nudge selected boxes"],
                      ["Opt + Arrow", "Snap box to edge"],
                      ["Delete / Backspace", "Delete selected box"],
                      ["/", "Open slash commands"],
                      ["Escape", "Close modals & panels"],
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
                      <p className={`text-[12px] font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>General Support</p>
                      <a href="mailto:pulpsupport@gmail.com" className="text-[11.5px] text-[#ea580c] hover:underline">pulpsupport@gmail.com</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-zinc-800/80 text-zinc-400" : "bg-zinc-200/80 text-zinc-500"}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[12px] font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>Report a Bug</p>
                      <p className={`text-[11.5px] mt-0.5 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                        Found something broken? Email us at{" "}
                        <a href="mailto:pulpsupport@gmail.com?subject=Bug%20Report" className="text-[#ea580c] hover:underline">pulpsupport@gmail.com</a>
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
              className="px-6 py-2 rounded-xl text-[12.5px] font-bold text-white transition-all hover:scale-105 active:scale-[0.97] shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
              style={{ backgroundColor: '#ea580c' }}
            >Save changes</button>
          </div>
        </div>
      </div>

      {/* Delete confirmation popup */}
      {deleteConfirmType && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-md rounded-2xl">
          <div className={`w-[340px] ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"} border rounded-2xl shadow-2xl p-7 flex flex-col gap-5`}>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-1 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </div>
              <p className="text-[15px] font-semibold">
                {deleteConfirmType === "notes" ? "Delete all notes?" : "Delete account?"}
              </p>
              <p className={`text-[12.5px] leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                {deleteConfirmType === "notes"
                  ? "Every note, page, and drawing will be permanently erased. This action cannot be undone."
                  : "Your account and all associated data will be permanently erased. This action cannot be undone."}
              </p>

              <div className="mt-2 space-y-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Verify Username or Email</label>
                  <input
                    type="text"
                    value={deleteUsername}
                    onChange={(e) => setDeleteUsername(e.target.value)}
                    className={`w-full text-[12px] px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-zinc-800/50 border-zinc-700 focus:border-red-500/50" : "bg-white border-zinc-200 focus:border-red-400/50"}`}
                    placeholder="Enter username"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Verify Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className={`w-full text-[12px] px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-zinc-800/50 border-zinc-700 focus:border-red-500/50" : "bg-white border-zinc-200 focus:border-red-400/50"}`}
                    placeholder="Enter password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-2">
              <button
                onClick={() => { setDeleteConfirmType(null); setDeleteUsername(""); setDeletePassword(""); }}
                className={`flex-1 text-[12.5px] font-semibold py-2.5 rounded-xl border transition-all ${isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
              >
                Cancel
              </button>
              <button
                disabled={!deleteUsername || !deletePassword}
                onClick={async () => {
                  if (!deleteUsername || !deletePassword) return;

                  const user = (await supabase.auth.getUser()).data.user
                  if (!user) {
                    alert("Authentication error. Please try again.");
                    return;
                  }

                  // Verify password server-side
                  const result = await verifyPasswordAndDelete(
                    user.id,
                    deletePassword,
                    deleteConfirmType as "account" | "notes"
                  )

                  if (!result.success) {
                    alert(result.error || "Verification failed");
                    setDeletePassword("");
                    return;
                  }

                  if (deleteConfirmType === "notes") {
                    localStorage.clear();
                  }

                  setDeleteConfirmType(null);
                  setDeleteUsername("");
                  setDeletePassword("");
                  window.location.reload();
                }}
                className={`flex-1 text-[12.5px] font-semibold py-2.5 rounded-xl transition-all active:scale-[0.97] ${(!deleteUsername || !deletePassword) ? "bg-red-500/50 text-white/50 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}
              >
                {deleteConfirmType === "notes" ? "Delete All" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
        <span className={`text-[12px] font-medium ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Used space</span>
        <span className={`text-[11px] font-mono tabular-nums ${isHigh ? "text-amber-500 font-semibold" : (isDark ? "text-zinc-500" : "text-zinc-400")}`}>
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

function formatShortcutDisplay(key: string) {
  return key.split("+").map(p => {
    if (p === "ctrl") return "⌘"
    if (p === "alt") return "⌥"
    if (p === "shift") return "⇧"
    if (p === "arrowleft") return "←"
    if (p === "arrowright") return "→"
    if (p === "arrowup") return "↑"
    if (p === "arrowdown") return "↓"
    if (p === "\\") return "\\"
    return p.toUpperCase()
  }).join(" ")
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

      const parts: string[] = []
      if (e.ctrlKey || e.metaKey) parts.push("ctrl")
      if (e.altKey) parts.push("alt")
      if (e.shiftKey) parts.push("shift")

      const isModifierOnly = ["Control", "Meta", "Alt", "Shift"].includes(e.key)

      if (!isModifierOnly) {
        parts.push(e.key.toLowerCase())
        const hasModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
        if (!hasModifier && e.key.length === 1 && !['/', '\\'].includes(e.key)) return
        onUpdate(id, parts.join("+"))
        setIsRecording(false)
      }
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
          className={`min-w-[40px] px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all active:scale-95 ${isRecording ? (isDark ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-600") : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500" : "bg-white border-zinc-200 text-zinc-600 shadow-sm hover:border-zinc-400")}`}
        >
          {isRecording ? "Press keys..." : formatShortcutDisplay(currentKey)}
        </button>
      </div>
    </div>
  )
}

function BlockList({ placeholder, items, onChange, isDark, description }: {
  placeholder: string; items: string[]; onChange: (v: string[]) => void; isDark: boolean; description: string
}) {
  const [val, setVal] = useState("")
  
  const add = () => {
    if (!val.trim()) return
    if (items.includes(val.trim())) return
    onChange([...items, val.trim()])
    setVal("")
  }

  return (
    <div className="p-5 flex flex-col gap-4">
       <p className={`text-[11.5px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{description}</p>
       <div className="flex flex-wrap gap-2">
          {items.map((it, i) => (
             <div key={i} className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-lg border text-[11px] font-bold group ${
                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"
             }`}>
                {it}
                <button 
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                >
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
             </div>
          ))}
       </div>
       <div className="flex gap-2">
          <input 
            value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder={placeholder}
            className={`flex-1 text-[12px] px-4 py-2.5 rounded-xl border outline-none ${
               isDark ? "bg-zinc-900 border-zinc-800 focus:border-zinc-500" : "bg-white border-zinc-200 focus:border-zinc-400"
            }`}
          />
          <button 
            onClick={add}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest ${
               isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 shadow-sm"
            }`}
          >
             Add
          </button>
       </div>
    </div>
  )
}


