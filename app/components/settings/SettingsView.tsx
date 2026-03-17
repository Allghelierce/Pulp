"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { SettingToggle } from "./SettingToggle"
import { SettingRow } from "./SettingRow"
import { SettingSection } from "./SettingSection"

// ── Settings tabs config ───────────────────────────────────────────────────

export const SETTINGS_TABS = [
  { id: "general",         label: "General",        group: "App"       },
  { id: "appearance",      label: "Appearance",     group: "App"       },
  { id: "editor",          label: "Editor",         group: "App"       },
  { id: "personalization", label: "Personalization",group: "Customize" },
] as const
export type SettingsTabId = typeof SETTINGS_TABS[number]["id"]

export const ACCENT_COLORS = [
  { hex: "#4a081eff", name: "Crimson"  },
  { hex: "#1e3a8a", name: "Cobalt"   },
  { hex: "#166534", name: "Forest"   },
  { hex: "#92400e", name: "Amber"    },
  { hex: "#4c1d95", name: "Violet"   },
  { hex: "#0f4c5c", name: "Teal"     },
  { hex: "#881337", name: "Rose"     },
  { hex: "#374151", name: "Slate"    },
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
  lineSpacing: "compact"|"normal"|"relaxed"; setLineSpacing: (v: "compact"|"normal"|"relaxed") => void
  paperStyle: "lined"|"dotgrid"|"plain"|"stenopad"; setPaperStyle: (v: "lined"|"dotgrid"|"plain"|"stenopad") => void
  showBinding: boolean; setShowBinding: (v: boolean) => void
  reduceMotion: boolean; setReduceMotion: (v: boolean) => void
  sidebarOnStart: boolean; setSidebarOnStart: (v: boolean) => void
  bgEffect: boolean; setBgEffect: (v: boolean) => void
}) {
  const [activeTab, setActiveTab]         = useState<SettingsTabId>("general")
  const [searchQuery, setSearchQuery]     = useState("")

  const visibleGroups = searchQuery
    ? [{ name: "Results", tabs: SETTINGS_TABS.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())) }]
    : Array.from(new Set(SETTINGS_TABS.map(t => t.group))).map(g => ({
        name: g,
        tabs: SETTINGS_TABS.filter(t => t.group === g),
      }))

  const SegmentedControl = ({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) => (
    <div className="flex rounded-lg overflow-hidden border border-zinc-200 text-[11px] font-semibold">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`px-3 py-1.5 transition-all ${value === val ? "bg-zinc-800 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-[#F7F4F3] rounded-2xl shadow-2xl border border-zinc-200/80 flex overflow-hidden" style={{ height: 640 }}>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-zinc-200/80 hover:bg-zinc-300 text-zinc-500 hover:text-zinc-800 text-sm transition-colors"
        >&times;</button>
        <button
          onClick={onClose}
          className="absolute bottom-4 right-6 z-20 px-5 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: accentColor }}
        >Save & Close</button>

        {/* ── Sidebar ── */}
        <div className="w-52 bg-[#EDE9E7] border-r border-zinc-200/70 flex flex-col shrink-0">
          <div className="px-4 pt-5 pb-3 border-b border-zinc-200/70">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Settings</p>
            <input
              placeholder="Filter…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/80 border border-zinc-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-zinc-400 transition-colors"
            />
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-3">
            {visibleGroups.map(group => (
              <div key={group.name}>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-1">{group.name}</p>
                {group.tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as SettingsTabId); setSearchQuery("") }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-zinc-200/70">
            <p className="text-[9px] text-zinc-400">Letter Soup · v1.0.0</p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 py-4 border-b border-zinc-200/70 shrink-0">
            <h2 className="text-[15px] font-semibold text-zinc-800">
              {SETTINGS_TABS.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">

            {/* ── General ── */}
            {activeTab === "general" && (<>
              <SettingSection title="Account">
                <div className="flex items-center gap-3 py-4 border-b border-zinc-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg,${accentColor}cc,${accentColor})` }}>
                    {user?.email?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-zinc-800 truncate">{user?.email ?? "Not signed in"}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Free Plan</p>
                  </div>
                </div>
                {user ? (
                  <SettingRow
                    title="Sign out"
                    description="You'll need to sign back in to access your notes"
                    control={
                      <button
                        onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                        className="text-[11px] font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Sign Out
                      </button>
                    }
                  />
                ) : (
                  <SettingRow
                    title="Sign in"
                    description="Sign in to save and sync your notes to the cloud"
                    control={
                      <button
                        onClick={() => window.location.href = "/login"}
                        className="text-[11px] font-semibold text-green-600 hover:text-green-800 border border-green-200 hover:border-green-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Sign In
                      </button>
                    }
                  />
                )}
              </SettingSection>

              <SettingSection title="About">
                <SettingRow title="Version" control={<span className="text-[11px] font-mono text-zinc-400">1.0.0</span>} />
                <SettingRow title="Build" control={<span className="text-[11px] font-mono text-zinc-400">2026.03</span>} />
                <SettingRow
                  title="Check for updates"
                  control={
                    <button className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-400 px-3 py-1.5 rounded-lg transition-colors">
                      Check
                    </button>
                  }
                />
              </SettingSection>
            </>)}

            {/* ── Appearance ── */}
            {activeTab === "appearance" && (<>
              <SettingSection title="Theme">
                <SettingRow
                  title="Color scheme"
                  description="Choose how Letter Soup looks to you"
                  control={<SegmentedControl options={[["light","Light"],["dark","Dark"]]} value={theme} onChange={v => setTheme(v as "light" | "dark")} />}
                />
                <SettingRow
                  title="Reduce motion"
                  description="Minimize animations and transitions across the app"
                  control={<SettingToggle checked={reduceMotion} onChange={setReduceMotion} />}
                />
              </SettingSection>
              <SettingSection title="Layout">
                <SettingRow
                  title="Show sidebar on launch"
                  description="Keep the notes panel open when you start the app"
                  control={<SettingToggle checked={sidebarOnStart} onChange={setSidebarOnStart} />}
                />
                <SettingRow
                  title="Background texture"
                  description="Show a subtle noise texture on the app background"
                  control={<SettingToggle checked={bgEffect} onChange={setBgEffect} />}
                />
              </SettingSection>
              <SettingSection title="Paper">
                <SettingRow
                  title="Page style"
                  description="Background ruling on your note pages"
                  control={<SegmentedControl options={[["lined","Lined"],["dotgrid","Dot Grid"],["plain","Plain"],["stenopad","Steno"]]} value={paperStyle} onChange={v => setPaperStyle(v as typeof paperStyle)} />}
                />
                <SettingRow
                  title="Show spiral binding"
                  description="Display the decorative binding on the left edge"
                  control={<SettingToggle checked={showBinding} onChange={setShowBinding} />}
                />
              </SettingSection>
            </>)}

            {/* ── Editor ── */}
            {activeTab === "editor" && (<>
              <SettingSection title="Writing">
                <SettingRow
                  title="Auto-save"
                  description="Sync changes to the cloud every 2 seconds"
                  control={<SettingToggle checked={autoSave} onChange={setAutoSave} />}
                />
                <SettingRow
                  title="Spell check"
                  description="Underline possible misspellings while typing"
                  control={<SettingToggle checked={spellCheck} onChange={setSpellCheck} />}
                />
                <SettingRow
                  title="Default font"
                  control={
                    <select
                      value={editorFont}
                      onChange={e => setEditorFont(e.target.value)}
                      className="text-[11px] border border-zinc-200 rounded-lg px-2.5 py-1.5 outline-none bg-white focus:border-zinc-400 transition-colors"
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
                  control={<SegmentedControl options={[["compact","Compact"],["normal","Normal"],["relaxed","Relaxed"]]} value={lineSpacing} onChange={v => setLineSpacing(v as "compact"|"normal"|"relaxed")} />}
                />
              </SettingSection>
            </>)}

            {/* ── Personalization ── */}
            {activeTab === "personalization" && (<>
              <SettingSection title="Accent Color">
                <div className="py-4 flex flex-wrap gap-4">
                  {ACCENT_COLORS.map(({ hex, name }) => (
                    <button
                      key={hex}
                      onClick={() => setAccentColor(hex)}
                      title={name}
                      className="group flex flex-col items-center gap-1.5"
                    >
                      <div
                        className="w-9 h-9 rounded-full border-[3px] transition-transform hover:scale-110 shadow-sm"
                        style={{ backgroundColor: hex, borderColor: accentColor.startsWith(hex) ? "#1a1a1a" : "transparent" }}
                      />
                      <span className="text-[9px] text-zinc-400 group-hover:text-zinc-600 transition-colors">{name}</span>
                    </button>
                  ))}
                </div>
              </SettingSection>
            </>)}

          </div>
        </div>
      </div>
    </div>
  )
}
