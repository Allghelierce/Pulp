"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { SettingToggle } from "./SettingToggle"
import { SettingRow } from "./SettingRow"
import { SettingSection } from "./SettingSection"
import { PricingSection } from "@/components/blocks/pricing-section"
import { Zap, Sparkles } from "lucide-react"

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
  sidebarOnStart: boolean; setSidebarOnStart: (v: boolean) => void
  bgEffect: boolean; setBgEffect: (v: boolean) => void
}) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("general")
  const [searchQuery, setSearchQuery] = useState("")
  const isDark = theme === "dark"

  const visibleGroups = searchQuery
    ? [{ name: "Results", tabs: SETTINGS_TABS.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())) }]
    : Array.from(new Set(SETTINGS_TABS.map(t => t.group))).map(g => ({
      name: g,
      tabs: SETTINGS_TABS.filter(t => t.group === g),
    }))

  const SegmentedControl = ({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) => (
    <div className={`flex rounded-none overflow-hidden border ${isDark ? "border-zinc-800" : "border-zinc-200"} text-[11px] font-semibold`}>
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`px-3 py-1.5 transition-all ${value === val 
            ? (isDark ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800 text-white") 
            : (isDark ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-500 hover:bg-zinc-50")}`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`relative w-full max-w-4xl ${isDark ? "bg-[#0c0c0e] text-zinc-100 border-zinc-800" : "bg-[#F7F4F3] text-zinc-900 border-zinc-200/80"} rounded-none shadow-2xl border flex overflow-hidden`} style={{ height: 640 }}>

        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-3.5 right-3.5 z-20 w-7 h-7 flex items-center justify-center rounded-none ${isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400" : "bg-zinc-200/80 hover:bg-zinc-300 text-zinc-500"} hover:text-white text-sm transition-colors`}
        >&times;</button>
        <button
          onClick={onClose}
          className="absolute bottom-4 right-6 z-20 px-5 py-2 rounded-none text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: accentColor }}
        >Save & Close</button>

        {/* ── Sidebar ── */}
        <div className={`w-52 ${isDark ? "bg-[#050505] border-zinc-800" : "bg-[#EDE9E7] border-zinc-200/70"} border-r flex flex-col shrink-0`}>
          <div className={`px-4 pt-5 pb-3 border-b ${isDark ? "border-zinc-800" : "border-zinc-200/70"}`}>
            <p className={`text-[11px] font-bold ${isDark ? "text-zinc-600" : "text-zinc-500"} uppercase tracking-widest mb-3`}>Settings</p>
            <input
              placeholder="Filter…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full ${isDark ? "bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-zinc-500" : "bg-white/80 border-zinc-200 text-zinc-800 focus:border-zinc-400"} border rounded-none px-3 py-1.5 text-[11px] outline-none transition-colors`}
            />
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-3">
            {visibleGroups.map(group => (
              <div key={group.name} className={group.name === "Premium" ? (isDark ? "pt-2 mt-2 border-t border-zinc-800" : "pt-2 mt-2 border-t border-zinc-200/50") : ""}>
                <p className={`text-[9px] font-bold ${isDark ? "text-zinc-600" : "text-zinc-400"} uppercase tracking-widest px-2 mb-1`}>{group.name}</p>
                {group.tabs.map(tab => {
                  const isPremium = tab.id === "subscription";
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id as SettingsTabId); setSearchQuery("") }}
                      className={`w-full text-left px-3 py-1.5 rounded-none text-[12px] font-medium transition-all ${activeTab === tab.id
                          ? (isPremium 
                              ? (isDark ? "bg-amber-950 text-amber-200 shadow-sm" : "bg-amber-100 text-amber-900 shadow-sm") 
                              : (isDark ? "bg-white/10 text-white shadow-sm" : "bg-white text-zinc-900 shadow-sm"))
                          : (isPremium 
                              ? "text-amber-600 hover:text-amber-800 hover:bg-amber-50/10" 
                              : (isDark ? "text-zinc-500 hover:text-zinc-100 hover:bg-white/5" : "text-zinc-500 hover:text-zinc-800 hover:bg-white/60"))
                        }`}
                    >
                      {isPremium ? "✨ " : ""}{tab.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className={`px-4 py-3 border-t ${isDark ? "border-zinc-800" : "border-zinc-200/70"}`}>
            <p className={`text-[9px] ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Pulp · v1.0.0</p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`px-8 py-4 border-b ${isDark ? "border-zinc-800" : "border-zinc-200/70"} shrink-0`}>
            <h2 className={`text-[22px] ${isDark ? "text-zinc-200" : "text-zinc-800"}`} style={{ fontFamily: 'var(--font-dancing), cursive', fontWeight: 600 }}>
              {SETTINGS_TABS.find(t => t.id === activeTab)?.label}
            </h2>


          </div>

          <div className={`flex-1 overflow-y-auto px-8 py-6 ${isDark ? "bg-[#0c0c0e]" : ""}`}>

            {/* ── General ── */}
            {activeTab === "general" && (<>
              <SettingSection title="Account" isDark={isDark}>
                <div className={`flex items-center gap-3 py-4 border-b ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>
                  <div className="w-10 h-10 rounded-none flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg,${accentColor}cc,${accentColor})` }}>
                    {user?.email?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-medium ${isDark ? "text-zinc-200" : "text-zinc-800"} truncate`}>{user?.email ?? "Not signed in"}</p>
                    <p className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-400"} mt-0.5`}>Free Plan</p>
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
                        className={`text-[11px] font-semibold text-red-500 hover:text-red-400 border ${isDark ? "border-red-900 hover:border-red-700" : "border-red-100 hover:border-red-400"} px-3 py-1.5 rounded-none transition-colors`}
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
                        className={`text-[11px] font-semibold text-green-600 hover:text-green-500 border ${isDark ? "border-green-900 hover:border-green-700" : "border-green-200 hover:border-green-400"} px-3 py-1.5 rounded-none transition-colors`}
                      >
                        Sign In
                      </button>
                    }
                  />
                )}
              </SettingSection>

              <SettingSection title="About" isDark={isDark}>
                <SettingRow title="Version" isDark={isDark} control={<span className={`text-[11px] font-mono ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>1.0.0</span>} />
                <SettingRow title="Build" isDark={isDark} control={<span className={`text-[11px] font-mono ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>2026.03</span>} />
                <SettingRow
                  title="Check for updates"
                  isDark={isDark}
                  control={
                    <button className={`text-[11px] font-semibold ${isDark ? "text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-600" : "text-zinc-600 hover:text-zinc-900 border-zinc-200 hover:border-zinc-400"} border px-3 py-1.5 rounded-none transition-colors`}>
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
                  control={<SegmentedControl options={[["lined", "Lined"], ["dotgrid", "Dot Grid"], ["plain", "Plain"], ["stenopad", "Steno"]]} value={paperStyle} onChange={v => setPaperStyle(v as typeof paperStyle)} />}
                />
                <SettingRow
                  title="Show spiral binding"
                  isDark={isDark}
                  description="Display the decorative binding on the left edge"
                  control={<SettingToggle checked={showBinding} onChange={setShowBinding} isDark={isDark} />}
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
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-center space-y-1 mb-2">
                  <h3 className={`text-3xl ${isDark ? "text-zinc-100" : "text-zinc-800"}`} style={{ fontFamily: 'var(--font-dancing), cursive', fontWeight: 600 }}>Choose your plan</h3>
                  <p className={`text-[13px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>Unlock the full power of Pulp</p>
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

                <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? "bg-amber-950/20 border-amber-900/40" : "bg-amber-50 border-amber-100"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white text-sm">✨</div>
                    <div>
                      <p className={`text-[12px] font-semibold ${isDark ? "text-amber-200" : "text-amber-900"}`}>Education Discount</p>
                      <p className={`text-[11px] ${isDark ? "text-amber-500/80" : "text-amber-700/70"}`}>Student or teacher? Get Pro for $4/mo.</p>
                    </div>
                  </div>
                  <button className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${isDark ? "text-amber-500 border-amber-900/50 hover:bg-amber-900/20" : "text-amber-700 border-amber-200 hover:bg-amber-100"}`}>
                    Verify
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

