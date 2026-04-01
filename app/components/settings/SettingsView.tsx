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

// ── Settings tabs config ───────────────────────────────────────────────────

export const SETTINGS_TABS = [
  { id: "general", label: "General", group: "App" },
  { id: "appearance", label: "Appearance", group: "App" },
  { id: "typography", label: "Typography", group: "App" },
  { id: "interface", label: "Interface", group: "App" },
  { id: "editor", label: "Editor", group: "Writing" },
  { id: "ai", label: "AI Antigravity", group: "Writing" },
  { id: "data", label: "Data & Storage", group: "Advanced" },
  { id: "shortcuts", label: "Shortcuts", group: "Advanced" },
  { id: "subscription", label: "Pro", group: "Premium" },
  { id: "danger", label: "Danger Zone", group: "Advanced" },
] as const
export type SettingsTabId = typeof SETTINGS_TABS[number]["id"]

export const ACCENT_COLORS = [
  { hex: "#4a081eff", name: "Crimson" },
  { hex: "#1e3a8a", name: "Cobalt" },
  { hex: "#166534", name: "Forest" },
  { hex: "#92400e", name: "Amber" },
  { hex: "#4c1d95", name: "Violet" },
  { hex: "#0f4c5c", name: "Teal" },
  { hex: "#881337", name: "Rose" },
  { hex: "#374151", name: "Slate" },
]

// ── Main settings modal ────────────────────────────────────────────────────

export function SettingsView({ user, onClose, accentColor, setAccentColor, theme, setTheme,
  autoSave, setAutoSave, spellCheck, setSpellCheck, editorFont, setEditorFont,
  lineSpacing, setLineSpacing, paperStyle, setPaperStyle, showBinding, setShowBinding,
  reduceMotion, setReduceMotion, reduceVisuals, setReduceVisuals, sidebarOnStart, setSidebarOnStart, bgEffect, setBgEffect,
  smearEffect, setSmearEffect, handwrittenEffect, setHandwrittenEffect,
  language, setLanguage, defaultSort, setDefaultSort, wordCountVisible, setWordCountVisible,
  focusMode, setFocusMode, baseFontSize, setBaseFontSize,
  shortcuts, setShortcuts,
}: {
  user: any
  onClose: () => void
  accentColor: string
  setAccentColor: (color: string) => void
  theme: "light" | "dark"
  setTheme: (t: "light" | "dark") => void
  autoSave: boolean; setAutoSave: (v: boolean) => void
  spellCheck: boolean; setSpellCheck: (v: boolean) => void
  editorFont: string; setEditorFont: (v: string) => void
  lineSpacing: "compact" | "normal" | "relaxed"; setLineSpacing: (v: "compact" | "normal" | "relaxed") => void
  paperStyle: "lined" | "dotgrid" | "plain" | "stenopad"; setPaperStyle: (v: "lined" | "dotgrid" | "plain" | "stenopad") => void
  showBinding: boolean; setShowBinding: (v: boolean) => void
  reduceMotion: boolean; setReduceMotion: (v: boolean) => void
  reduceVisuals: boolean; setReduceVisuals: (v: boolean) => void
  sidebarOnStart: boolean; setSidebarOnStart: (v: boolean) => void
  bgEffect: boolean; setBgEffect: (v: boolean) => void
  smearEffect: boolean; setSmearEffect: (v: boolean) => void
  handwrittenEffect: boolean; setHandwrittenEffect: (v: boolean) => void
  language: string; setLanguage: (v: string) => void
  defaultSort: string; setDefaultSort: (v: string) => void
  wordCountVisible: boolean; setWordCountVisible: (v: boolean) => void
  focusMode: boolean; setFocusMode: (v: boolean) => void
  baseFontSize: "small" | "medium" | "large"; setBaseFontSize: (v: "small" | "medium" | "large") => void
  shortcuts: { ai: string; slash: string; sidebar: string; newNote: string; search: string }
  setShortcuts: (s: any) => void
}) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("general")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteConfirmType, setDeleteConfirmType] = useState<"notes" | "account" | null>(null)
  const [deleteUsername, setDeleteUsername] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const isDark = theme === "dark"

  const visibleGroups = searchQuery
    ? [{ name: "Results", tabs: SETTINGS_TABS.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())) }]
    : Array.from(new Set(SETTINGS_TABS.map(t => t.group))).map(g => ({
      name: g,
      tabs: SETTINGS_TABS.filter(t => t.group === g),
    }))

  const SegmentedControl = ({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) => (
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className={`relative w-full max-w-[900px] ${isDark ? "bg-[#0a0a0c] text-zinc-100 border-zinc-800/80" : "bg-[#f5f3f1] text-zinc-900 border-zinc-200/80"} rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border flex overflow-hidden`} style={{ height: 660 }}>

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
            <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Settings</p>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
            {visibleGroups.map(group => (
              <div key={group.name} className={group.name === "Premium" ? (isDark ? "pt-3 mt-3 border-t border-zinc-800" : "pt-3 mt-3 border-t border-zinc-300/40") : "mb-1"}>
                <p className={`text-[9.5px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>{group.name}</p>
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
                            ? isDark ? "bg-amber-950/60 text-amber-300" : "bg-amber-100 text-amber-900"
                            : isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm"
                          : isPremium
                            ? isDark ? "text-amber-600 hover:bg-amber-950/30" : "text-amber-600 hover:bg-amber-50"
                            : isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/70"
                      }`}
                    >
                      {isPremium ? "✦ " : ""}{tab.label}
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
            <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
              {SETTINGS_TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
              {activeTab === "general" && "Manage your account and application preferences"}
              {activeTab === "appearance" && "Customize accent colors, themes, and layouts"}
              {activeTab === "typography" && "Fine-tune your writing aesthetics"}
              {activeTab === "interface" && "Customize the Pulp application shell"}
              {activeTab === "editor" && "Configure your writing environment"}
              {activeTab === "ai" && "Optimize your intelligence partner"}
              {activeTab === "data" && "Manage your local data and backups"}
              {activeTab === "shortcuts" && "Master Pulp with keyboard acceleration"}
              {activeTab === "subscription" && "Manage your plan and billing"}
              {activeTab === "danger" && "Irreversible and destructive actions"}
            </p>
          </div>

          <div className={`flex-1 overflow-y-auto px-8 py-6 ${isDark ? "bg-[#0a0a0c]" : "bg-[#f5f3f1]"}`}>

            {/* ── General ── */}
            {activeTab === "general" && (<>
              <SettingSection title="Account" isDark={isDark}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold text-white shrink-0 shadow-md" style={{ background: `linear-gradient(135deg, ${accentColor}99, ${accentColor})` }}>
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

              <SettingSection title="System" isDark={isDark}>
                <SettingRow
                  title="Language"
                  isDark={isDark}
                  description="Choose the language for the user interface"
                  control={
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className={`text-[11px] border ${isDark ? "bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-zinc-500" : "bg-white border-zinc-200 text-zinc-800 focus:border-zinc-400"} rounded-none px-2.5 py-1.5 outline-none transition-colors`}
                    >
                      <option value="english">English (US)</option>
                      <option value="spanish">Español</option>
                      <option value="french">Français</option>
                      <option value="german">Deutsch</option>
                      <option value="japanese">日本語</option>
                      <option value="chinese">中文</option>
                    </select>
                  }
                />
                <SettingRow
                  title="Default Sort Order"
                  isDark={isDark}
                  description="How your notes are sorted in the sidebar"
                  control={
                    <select
                      value={defaultSort}
                      onChange={e => setDefaultSort(e.target.value)}
                      className={`text-[11px] border ${isDark ? "bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-zinc-500" : "bg-white border-zinc-200 text-zinc-800 focus:border-zinc-400"} rounded-none px-2.5 py-1.5 outline-none transition-colors`}
                    >
                      <option value="modified">Date Modified</option>
                      <option value="created">Date Created</option>
                      <option value="title">Alphabetical (A-Z)</option>
                    </select>
                  }
                />
              </SettingSection>

              <SettingSection title="About" isDark={isDark}>
                <SettingRow title="Version" isDark={isDark} control={<span className={`text-[11.5px] font-mono tabular-nums ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>1.0.0</span>} />
                <SettingRow title="Build" isDark={isDark} control={<span className={`text-[11.5px] font-mono tabular-nums ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>2026.03</span>} />
                <SettingRow
                  title="Check for updates"
                  isDark={isDark}
                  control={
                    <button className={`text-[11.5px] font-semibold px-3.5 py-1.5 rounded-lg transition-all ${isDark ? "text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700" : "text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200"}`}>
                      Check
                    </button>
                  }
                />
              </SettingSection>
            </>)}

            {/* ── Appearance ── */}
            {activeTab === "appearance" && (<>
              <SettingSection title="Theme" isDark={isDark}>
                <SettingRow
                  title="Color scheme"
                  isDark={isDark}
                  description="Choose how Pulp looks to you"
                  control={<SegmentedControl options={[["light", "Light"], ["dark", "Dark"]]} value={theme} onChange={v => setTheme(v as "light" | "dark")} />}
                />
                <SettingRow
                  title="Reduce motion"
                  isDark={isDark}
                  description="Minimize animations and transitions across the app"
                  control={<SettingToggle checked={reduceMotion} onChange={setReduceMotion} isDark={isDark} />}
                />
                <SettingRow
                  title="Reduce visuals"
                  isDark={isDark}
                  description="Disable pulsating effects, glows, and background animations"
                  control={<SettingToggle checked={reduceVisuals} onChange={setReduceVisuals} isDark={isDark} />}
                />
              </SettingSection>
              <SettingSection title="Effects" isDark={isDark}>
                <SettingRow
                  title="Background texture"
                  isDark={isDark}
                  description="Show a subtle noise texture on the app background"
                  control={<SettingToggle checked={bgEffect} onChange={setBgEffect} isDark={isDark} />}
                />
              </SettingSection>

              <SettingSection title="Personalization" isDark={isDark}>
                <div className="px-5 py-4">
                  <p className={`text-[12px] font-semibold mb-3 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Accent Color</p>
                  <div className="flex flex-wrap gap-4">
                    {ACCENT_COLORS.map(({ hex, name }) => (
                      <button
                        key={hex}
                        onClick={() => setAccentColor(hex)}
                        title={name}
                        className="group flex flex-col items-center gap-1.5"
                      >
                        <div
                          className={`w-9 h-9 rounded-none border-[3px] transition-transform hover:scale-110 shadow-sm`}
                          style={{ backgroundColor: hex, borderColor: accentColor.startsWith(hex) ? (isDark ? "#ffffff" : "#1a1a1a") : "transparent" }}
                        />
                        <span className={`text-[9px] ${isDark ? "text-zinc-600 group-hover:text-zinc-400" : "text-zinc-400 group-hover:text-zinc-600"} transition-colors`}>{name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </SettingSection>
            </>)}

            {/* ── Typography ── */}
            {activeTab === "typography" && (<>
              <SettingSection title="Font Selection" isDark={isDark}>
                 <SettingRow
                  title="Heading Font"
                  isDark={isDark}
                  description="Used for large titles and notebook covers"
                  control={
                    <select className={`text-[11px] border ${isDark ? "bg-zinc-900 border-zinc-700 text-zinc-100" : "bg-white border-zinc-200 text-zinc-800"} rounded-none px-2.5 py-1.5 outline-none`}>
                      <option>Playfair Display</option>
                      <option>EB Garamond</option>
                      <option>Italiana</option>
                      <option>Bodoni</option>
                    </select>
                  }
                />
                <SettingRow
                  title="Body Copy Font"
                  isDark={isDark}
                  description="The default font for notes and boxes"
                  control={
                    <select 
                      value={editorFont}
                      onChange={e => setEditorFont(e.target.value)}
                      className={`text-[11px] border ${isDark ? "bg-zinc-900 border-zinc-700 text-zinc-100" : "bg-white border-zinc-200 text-zinc-800"} rounded-none px-2.5 py-1.5 outline-none`}
                    >
                      <option value="EB Garamond">EB Garamond</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Arial">Arial</option>
                    </select>
                  }
                />
              </SettingSection>
              <SettingSection title="Sizing & Spacing" isDark={isDark}>
                <SettingRow
                  title="Base Font Size"
                  isDark={isDark}
                  control={<SegmentedControl options={[["small", "Small"], ["medium", "Medium"], ["large", "Large"]]} value={baseFontSize} onChange={v => setBaseFontSize(v as any)} />}
                />
                <SettingRow
                  title="Line Spacing"
                  isDark={isDark}
                  control={<SegmentedControl options={[["compact", "Comp"], ["normal", "Norm"], ["relaxed", "Relax"]]} value={lineSpacing} onChange={v => setLineSpacing(v as any)} />}
                />
              </SettingSection>

              <SettingSection title="Paper & Page" isDark={isDark}>
                <SettingRow
                  title="Page style"
                  isDark={isDark}
                  description="Background ruling on your note pages"
                  control={<SegmentedControl options={[["lined", "Lined"], ["dotgrid", "Grid"], ["plain", "Plain"], ["stenopad", "Steno"]]} value={paperStyle} onChange={v => setPaperStyle(v as any)} />}
                />
                <SettingRow
                  title="Show spiral binding"
                  isDark={isDark}
                  description="Display the decorative binding on the left edge"
                  control={<SettingToggle checked={showBinding} onChange={setShowBinding} isDark={isDark} />}
                />
                <SettingRow
                  title="Smear effect"
                  isDark={isDark}
                  description="Show a subtle ink smear shadow along the left margin"
                  control={<SettingToggle checked={smearEffect} onChange={setSmearEffect} isDark={isDark} />}
                />
                <SettingRow
                  title="Handwritten effect"
                  isDark={isDark}
                  description="Apply a slight wobble filter to text for a hand-drawn look"
                  control={<SettingToggle checked={handwrittenEffect} onChange={setHandwrittenEffect} isDark={isDark} />}
                />
              </SettingSection>
            </>)}

            {/* ── Interface ── */}
            {activeTab === "interface" && (<>
               <SettingSection title="Sidebar" isDark={isDark}>
                <SettingRow
                  title="Show sidebar on launch"
                  isDark={isDark}
                  control={<SettingToggle checked={sidebarOnStart} onChange={setSidebarOnStart} isDark={isDark} />}
                />
              </SettingSection>
              <SettingSection title="Toolbars" isDark={isDark}>
                <SettingRow
                  title="Status bar"
                  isDark={isDark}
                  description="Show word count and stats in the bottom-right"
                  control={<SettingToggle checked={wordCountVisible} onChange={setWordCountVisible} isDark={isDark} />}
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
                  control={<SettingToggle checked={autoSave} onChange={setAutoSave} isDark={isDark} />}
                />
                <SettingRow
                  title="Spell check"
                  isDark={isDark}
                  description="Underline possible misspellings while typing"
                  control={<SettingToggle checked={spellCheck} onChange={setSpellCheck} isDark={isDark} />}
                />
              </SettingSection>

              <SettingSection title="Reading & Focus" isDark={isDark}>
                <SettingRow
                  title="Focus mode"
                  isDark={isDark}
                  description="Dim interface elements when typing to minimize distractions"
                  control={<SettingToggle checked={focusMode} onChange={setFocusMode} isDark={isDark} />}
                />
              </SettingSection>
            </>)}

            {/* ── AI ── */}
            {activeTab === "ai" && (<>
              <SettingSection title="Antigravity Intelligence" isDark={isDark}>
                <SettingRow
                  title="Inline suggestions"
                  isDark={isDark}
                  description="Antigravity predicts your next words as you write"
                  control={<SettingToggle checked={true} onChange={() => {}} isDark={isDark} />}
                />
              </SettingSection>
            </>)}

            {/* ── Data ── */}
            {activeTab === "data" && (<>
               <SettingSection title="Local Storage" isDark={isDark}>
                 <SettingRow title="Used space" isDark={isDark} control={<span className="text-[11px] font-mono opacity-50">14.2 MB</span>} />
               </SettingSection>
               <SettingSection title="Exports" isDark={isDark}>
                 <div className="flex flex-col gap-2 p-5">
                   <button className={`w-full py-2.5 rounded-lg border text-[12px] font-semibold transition-all ${isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 shadow-sm"}`}>
                     Export Binder as JSON
                   </button>
                 </div>
               </SettingSection>
            </>)}

            {/* ── Shortcuts ── */}
            {activeTab === "shortcuts" && (<>
              <SettingSection title="Global Shortcuts" isDark={isDark}>
                <div className="flex flex-col gap-0.5 px-3 py-2">
                  <ShortcutKey label="AI Intelligence" id="ai" currentKey={shortcuts.ai} isDark={isDark} onUpdate={(id, k) => setShortcuts({ ...shortcuts, [id]: k })} />
                  <ShortcutKey label="Slash Command" id="slash" currentKey={shortcuts.slash} isDark={isDark} onUpdate={(id, k) => setShortcuts({ ...shortcuts, [id]: k })} />
                  
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"}`}>
                    <span className={`text-[12px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>New Note</span>
                    <kbd className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-white border-zinc-200 text-zinc-600 shadow-sm"}`}>⌘ N</kbd>
                  </div>
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"}`}>
                    <span className={`text-[12px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>Toggle Sidebar</span>
                    <kbd className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-white border-zinc-200 text-zinc-600 shadow-sm"}`}>⌘ \</kbd>
                  </div>
                </div>
              </SettingSection>
            </>)}


            {/* ── Danger Zone ── */}
            {activeTab === "danger" && (<>
              <SettingSection title="Danger Zone" isDark={isDark}>
                <SettingRow
                  title="Delete all notes"
                  isDark={isDark}
                  description="Permanently erase every note and page. This cannot be undone."
                  control={
                    <DestructiveButton onClick={() => setDeleteConfirmType("notes")}>
                      Delete All
                    </DestructiveButton>
                  }
                />
                <SettingRow
                  title="Delete account"
                  isDark={isDark}
                  description="Permanently delete your account and all associated data."
                  control={
                    <DestructiveButton onClick={() => setDeleteConfirmType("account")}>
                      Delete Account
                    </DestructiveButton>
                  }
                />
              </SettingSection>
            </>)}

            {/* ── Subscription ── */}
            {activeTab === "subscription" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-0.5">
                  <h3 className={`text-[15px] font-bold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>Upgrade to Pro</h3>
                  <p className={`text-[12px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>Unlimited AI, more storage, and priority support</p>
                </div>

                <PricingSection
                  isDark={isDark}
                  accentColor={accentColor}
                  tiers={[
                    {
                      name: "Free",
                      price: { monthly: 0, yearly: 0 },
                      description: "For individuals getting started",
                      buttonLabel: "Current Plan",
                      buttonDisabled: true,
                      icon: <Zap className="w-5 h-5 text-zinc-500" />,
                      features: [
                        { name: "Unlimited Notes", description: "Create as many notes as you need", included: true },
                        { name: "100 AI Sketches / month", description: "Generate images with AI prompts", included: true },
                        { name: "1 GB Cloud Storage", description: "Sync notes across devices", included: true },
                        { name: "Basic Page Styles", description: "Lined, dotgrid, and plain paper", included: true },
                        { name: "Priority Support", description: "Fast-track email & chat support", included: false },
                        { name: "Advanced Export", description: "PDF, Markdown, and HTML export", included: false },
                      ],
                    },
                    {
                      name: "Pro",
                      price: { monthly: 6, yearly: 54 },
                      description: "For power users who want it all",
                      buttonLabel: "Upgrade to Pro",
                      highlight: true,
                      icon: <Sparkles className="w-5 h-5" style={{ color: "#3b82f6" }} />,
                      ctaOverride: (props) => <MinimalPaymentModal><button {...props} /></MinimalPaymentModal>,
                      features: [
                        { name: "Unlimited Notes", description: "Create as many notes as you need", included: true },
                        { name: "Unlimited AI Sketches", description: "No monthly cap on AI generations", included: true },
                        { name: "10 GB Cloud Storage", description: "Ample space for all your notes", included: true },
                        { name: "All Page Styles", description: "Including stenopad and custom layouts", included: true },
                        { name: "Priority Support", description: "Fast-track email & chat support", included: true },
                        { name: "Advanced Export", description: "PDF, Markdown, and HTML export", included: true },
                      ],
                    },
                  ]}
                />

              </div>
            )}

          </div>
          <div className={`px-8 py-3.5 border-t ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"} shrink-0 flex items-center justify-between`}>
            <p className={`text-[11px] ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>Changes save automatically</p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-[12.5px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-md"
              style={{ backgroundColor: accentColor }}
            >Done</button>
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
                  
                  if (deleteConfirmType === "account") {
                    await supabase.auth.signOut();
                  } else {
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

function ShortcutKey({ label, id, currentKey, onUpdate, isDark }: { 
  label: string; id: string; currentKey: string; onUpdate: (id: string, key: string) => void; isDark: boolean 
}) {
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    if (!isRecording) return
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === "Escape") { setIsRecording(false); return }
      // We only want single character keys or specialized ones
      if (e.key.length === 1 || ["Enter", "Tab", "Escape", "Backspace"].includes(e.key)) {
        onUpdate(id, e.key)
        setIsRecording(false)
      }
    }
    window.addEventListener("keydown", handler, true)
    return () => window.removeEventListener("keydown", handler, true)
  }, [isRecording, id, onUpdate])

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"}`}>
      <span className={`text-[12px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{label}</span>
      <button
        onClick={() => setIsRecording(true)}
        className={`min-w-[40px] px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all active:scale-95 ${isRecording ? (isDark ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-600") : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500" : "bg-white border-zinc-200 text-zinc-600 shadow-sm hover:border-zinc-400")}`}
      >
        {isRecording ? "Press key..." : currentKey.toUpperCase()}
      </button>
    </div>
  )
}

