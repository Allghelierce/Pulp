"use client"
import { memo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface FocusViewProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  blockedSites: string[]
  blockedApps: string[]
  onUpdateConfig: (updates: Record<string, any>) => void
}

function BlockListEditable({ items, onChange, placeholder, label, isDark }: {
  items: string[], onChange: (v: string[]) => void, placeholder: string, label: string, isDark: boolean
}) {
  const [input, setInput] = useState("")

  const add = () => {
    const val = input.trim()
    if (val && !items.includes(val)) {
      onChange([...items, val])
      setInput("")
    }
  }

  return (
    <div className="mb-5">
      <div className={`text-[10px] font-bold uppercase tracking-[0.1em] mb-2 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
        {label}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add() }}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2 text-[12px] rounded-lg outline-none transition-colors ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-700 focus:border-zinc-700" : "bg-white border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-300"} border`}
        />
        <button
          onClick={add}
          className={`px-3.5 py-2 text-[11px] font-semibold rounded-lg transition-colors ${isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700" : "bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-800"} border`}
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"} border`}
          >
            {item}
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className={`text-[12px] leading-none ${isDark ? "text-zinc-600 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600"}`}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span className={`text-[11px] italic ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>None added yet</span>
        )}
      </div>
    </div>
  )
}

export const FocusView = memo(function FocusView({
  isOpen, onClose, theme, blockedSites, blockedApps, onUpdateConfig,
}: FocusViewProps) {
  const isDark = theme === "dark"

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            onMouseDown={e => e.stopPropagation()}
            className={`relative w-full max-w-[900px] rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] border overflow-hidden flex flex-col ${isDark ? "bg-[#0a0a0c] border-zinc-800/80" : "bg-[#f5f3f1] border-zinc-200/80"}`}
            style={{ height: 660 }}
          >
            {/* Header */}
            <div className={`px-8 pt-6 pb-4 border-b shrink-0 flex items-center justify-between ${isDark ? "border-zinc-800/80" : "border-zinc-200/70"}`}>
              <div>
                <h2 className={`text-[15px] font-semibold tracking-tight ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>Focus Blocker</h2>
                <p className={`text-[12px] mt-0.5 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Restrict distractions while your Focus Timer is running</p>
              </div>
              <button
                onClick={onClose}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm transition-all ${isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/80"}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className={`rounded-xl p-5 mb-5 ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"} border`}>
                <p className={`text-[12px] leading-relaxed m-0 ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                  Add websites and applications to block while your Focus Timer is active. Requires the Pulp Focus browser extension for website blocking.
                </p>
              </div>

              <div className={`rounded-xl p-6 ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"} border`}>
                <BlockListEditable
                  items={blockedSites}
                  onChange={v => onUpdateConfig({ blockedSites: v })}
                  placeholder="e.g. twitter.com, reddit.com"
                  label="Blocked Websites"
                  isDark={isDark}
                />
                <div className={`h-px my-1 ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`} />
                <BlockListEditable
                  items={blockedApps}
                  onChange={v => onUpdateConfig({ blockedApps: v })}
                  placeholder="e.g. Discord, Slack, Steam"
                  label="Blocked Applications"
                  isDark={isDark}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
