"use client"
import { memo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface FocusViewProps {
  isOpen: boolean
  onClose: () => void
  blockedSites: string[]
  blockedApps: string[]
  onUpdateConfig: (updates: Record<string, any>) => void
}

function BlockListEditable({ items, onChange, placeholder, label }: {
  items: string[], onChange: (v: string[]) => void, placeholder: string, label: string
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
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, color: "#6a6258", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add() }}
          placeholder={placeholder}
          style={{
            flex: 1, padding: "8px 12px", fontSize: 12, color: "#e8e0d4",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, outline: "none",
          }}
        />
        <button
          onClick={add}
          style={{
            padding: "8px 14px", fontSize: 11, fontWeight: 600, color: "#b8943a",
            background: "rgba(180,140,80,0.1)", border: "1px solid rgba(180,140,80,0.2)",
            borderRadius: 8, cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", fontSize: 11, color: "#c4b8a8",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 6,
            }}
          >
            {item}
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              style={{ background: "none", border: "none", color: "#6a6258", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}
            >
              x
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span style={{ fontSize: 11, color: "#4a4440", fontStyle: "italic" }}>None added yet</span>
        )}
      </div>
    </div>
  )
}

export const FocusView = memo(function FocusView({
  isOpen, onClose, blockedSites, blockedApps, onUpdateConfig,
}: FocusViewProps) {
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
          className="fixed inset-0 z-[1000] overflow-hidden"
        >
          <div className="absolute inset-0 bg-[#0c0a09]">
            <div className="absolute inset-0 opacity-20" style={{
              background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(80,120,180,0.15) 0%, transparent 70%)",
            }} />
          </div>

          <div className="relative z-10 h-full flex flex-col">
            {/* Header */}
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-between px-8 py-5 border-b border-white/[0.04] bg-black/20 backdrop-blur-md shrink-0"
            >
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: "#e8e0d4", fontFamily: '"EB Garamond", Georgia, serif', margin: 0 }}>
                  Focus Blocker
                </h1>
                <p style={{ fontSize: 12, color: "#6a6258", marginTop: 2 }}>
                  Restrict distractions while your Focus Timer is running
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.04)", color: "#8a8078", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto" style={{ padding: "32px 48px", maxWidth: 640 }}>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 12, padding: "20px 24px", marginBottom: 24,
                }}
              >
                <p style={{ fontSize: 12, color: "#8a8078", lineHeight: 1.6, margin: 0 }}>
                  Add websites and applications to block while your Focus Timer is active. Requires the Pulp Focus browser extension for website blocking.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 12, padding: "24px",
                }}
              >
                <BlockListEditable
                  items={blockedSites}
                  onChange={v => onUpdateConfig({ blockedSites: v })}
                  placeholder="e.g. twitter.com, reddit.com"
                  label="Blocked Websites"
                />
                <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "4px 0 20px" }} />
                <BlockListEditable
                  items={blockedApps}
                  onChange={v => onUpdateConfig({ blockedApps: v })}
                  placeholder="e.g. Discord, Slack, Steam"
                  label="Blocked Applications"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
