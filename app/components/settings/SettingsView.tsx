"use client"
import { useState } from "react"
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
  { id: "editor", label: "Editor", group: "App" },
  { id: "personalization", label: "Personalization", group: "Customize" },
  { id: "subscription", label: "Subscription", group: "Premium" },
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
  reduceMotion, setReduceMotion, sidebarOnStart, setSidebarOnStart, bgEffect, setBgEffect,
  smearEffect, setSmearEffect, handwrittenEffect, setHandwrittenEffect,
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
  paperStyle: "lined" | "dotgrid" | "plain" | "stenopad" | "parchment" | "kraft" | "ledger"; setPaperStyle: (v: "lined" | "dotgrid" | "plain" | "stenopad" | "parchment" | "kraft" | "ledger") => void
  showBinding: boolean; setShowBinding: (v: boolean) => void
  reduceMotion: boolean; setReduceMotion: (v: boolean) => void
  sidebarOnStart: boolean; setSidebarOnStart: (v: boolean) => void
  bgEffect: boolean; setBgEffect: (v: boolean) => void
  smearEffect: boolean; setSmearEffect: (v: boolean) => void
  handwrittenEffect: boolean; setHandwrittenEffect: (v: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("general")
  const [searchQuery, setSearchQuery] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
              {activeTab === "appearance" && "Customize how Pulp looks and feels"}
              {activeTab === "editor" && "Configure your writing environment"}
              {activeTab === "personalization" && "Make Pulp uniquely yours"}
              {activeTab === "subscription" && "Manage your plan and billing"}
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
                <SettingRow
                  title="Delete all notes"
                  isDark={isDark}
                  description="Permanently erase every note and page. This cannot be undone."
                  control={
                    <DestructiveButton onClick={() => setShowDeleteConfirm(true)}>
                      Delete All
                    </DestructiveButton>
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
              </SettingSection>
              <SettingSection title="Layout" isDark={isDark}>
                <SettingRow
                  title="Show sidebar on launch"
                  isDark={isDark}
                  description="Keep the notes panel open when you start the app"
                  control={<SettingToggle checked={sidebarOnStart} onChange={setSidebarOnStart} isDark={isDark} />}
                />
                <SettingRow
                  title="Background texture"
                  isDark={isDark}
                  description="Show a subtle noise texture on the app background"
                  control={<SettingToggle checked={bgEffect} onChange={setBgEffect} isDark={isDark} />}
                />
              </SettingSection>
              <SettingSection title="Paper" isDark={isDark}>
                <SettingRow
                  title="Page style"
                  isDark={isDark}
                  description="Background ruling on your note pages"
                  control={<SegmentedControl options={[["lined", "Lined"], ["dotgrid", "Grid"], ["plain", "Plain"], ["stenopad", "Steno"], ["parchment", "Vintage"], ["kraft", "Kraft"], ["ledger", "Ledger"]]} value={paperStyle} onChange={v => setPaperStyle(v as any)} />}
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
                <SettingRow
                  title="Default font"
                  isDark={isDark}
                  control={
                    <select
                      value={editorFont}
                      onChange={e => setEditorFont(e.target.value)}
                      className={`text-[11px] border ${isDark ? "bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-zinc-500" : "bg-white border-zinc-200 text-zinc-800 focus:border-zinc-400"} rounded-none px-2.5 py-1.5 outline-none transition-colors`}
                    >
                      <option value="EB Garamond">EB Garamond</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Original Surfer">Original Surfer</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Arial">Arial</option>
                    </select>
                  }
                />
                <SettingRow
                  title="Line spacing"
                  isDark={isDark}
                  control={<SegmentedControl options={[["compact", "Compact"], ["normal", "Normal"], ["relaxed", "Relaxed"]]} value={lineSpacing} onChange={v => setLineSpacing(v as "compact" | "normal" | "relaxed")} />}
                />
              </SettingSection>
            </>)}

            {/* ── Personalization ── */}
            {activeTab === "personalization" && (<>
              <SettingSection title="Accent Color" isDark={isDark}>
                <div className="py-4 flex flex-wrap gap-4">
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
                      price: { monthly: 8, yearly: 72 },
                      description: "For power users who want it all",
                      buttonLabel: "Upgrade to Pro",
                      highlight: true,
                      badge: "Most Popular",
                      icon: <Sparkles className="w-5 h-5" style={{ color: accentColor }} />,
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

                <div className={`mt-4 p-4 rounded-2xl border flex items-center justify-between ${isDark ? "bg-amber-950/20 border-amber-900/30" : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-base shadow-md shadow-amber-500/20">✦</div>
                    <div>
                      <p className={`text-[12.5px] font-semibold ${isDark ? "text-amber-200" : "text-amber-900"}`}>Education Discount</p>
                      <p className={`text-[11px] ${isDark ? "text-amber-500/70" : "text-amber-700/60"}`}>Students & teachers get Pro for $4/mo</p>
                    </div>
                  </div>
                  <button className={`text-[11.5px] font-semibold px-3.5 py-1.5 rounded-lg transition-all active:scale-[0.97] ${isDark ? "text-amber-400 bg-amber-950/60 hover:bg-amber-950 border border-amber-900/50" : "text-amber-800 bg-white hover:bg-amber-50 border border-amber-200 shadow-sm"}`}>
                    Verify →
                  </button>
                </div>
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
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-md rounded-2xl">
          <div className={`w-[340px] ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"} border rounded-2xl shadow-2xl p-7 flex flex-col gap-5`}>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </div>
              <p className="text-[15px] font-semibold">Delete all notes?</p>
              <p className={`text-[12.5px] leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                Every note, page, and drawing will be permanently erased. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 text-[12.5px] font-semibold py-2.5 rounded-xl border transition-all ${isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={() => { localStorage.clear(); setShowDeleteConfirm(false); window.location.reload() }}
                className="flex-1 text-[12.5px] font-semibold py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all active:scale-[0.97]"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

