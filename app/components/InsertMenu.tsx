"use client"
import { memo, useEffect, useRef, useState } from "react"
import { ACCENT, accentAlpha } from "@/lib/accent"

// Toolbar "insert" dropdown. Opens instantly on mousedown (keeps the editor
// selection), full keyboard support, Docs-style table size grid, and a
// "click to place" hint while a placement tool is armed (Esc cancels).

const STICKY_COLORS = ["#fef08a", "#fce7f3", "#fed7aa", "#bfdbfe"]
const GRID = 8
const PLACE_TOOLS: Record<string, string> = {
  sticky: "sticky note", hr: "horizontal line", vr: "vertical line", image: "image",
}

interface InsertMenuProps {
  theme: "light" | "dark"
  compact?: boolean
  activeTool: string
  setActiveTool: (t: string) => void
  stickyColor: string
  setStickyColor: (c: string) => void
  insertTable: (rows: number, cols: number) => void
}

type Item = { key: string; label: string; hint: string; icon: React.ReactNode }

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)

const ITEMS: Item[] = [
  { key: "sticky", label: "Sticky note", hint: "click to place", icon: <Icon><path d="M15.5 3h-10A2.5 2.5 0 0 0 3 5.5v13A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-10L15.5 3z" /><path d="M15 3v5.5a2.5 2.5 0 0 0 2.5 2.5h5.5" /></Icon> },
  { key: "hr", label: "Horizontal line", hint: "click to place", icon: <Icon><line x1="3" y1="12" x2="21" y2="12" /></Icon> },
  { key: "vr", label: "Vertical line", hint: "click to place", icon: <Icon><line x1="12" y1="3" x2="12" y2="21" /></Icon> },
  { key: "image", label: "Image or video", hint: "click to place", icon: <Icon><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></Icon> },
  { key: "table", label: "Table", hint: "", icon: <Icon><rect x="3" y="3" width="18" height="18" rx="1.5" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></Icon> },
]

export const InsertMenu = memo(function InsertMenu({
  theme, compact, activeTool, setActiveTool, stickyColor, setStickyColor, insertTable,
}: InsertMenuProps) {
  const dark = theme === "dark"
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(0)
  const [tableOpen, setTableOpen] = useState(false)
  const [hover, setHover] = useState<[number, number]>([0, 0])
  const rootRef = useRef<HTMLDivElement>(null)

  const c = {
    panel: dark ? "rgba(32,32,36,0.98)" : "rgba(255,255,255,0.98)",
    border: dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)",
    text: dark ? "#e4e4e7" : "#27272a",
    muted: dark ? "#71717a" : "#a1a1aa",
    rowHover: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.045)",
    tile: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    shadow: dark ? "0 24px 64px -12px rgba(0,0,0,0.65)" : "0 18px 48px -12px rgba(0,0,0,0.18)",
  }

  const close = () => { setOpen(false); setTableOpen(false); setHover([0, 0]) }

  const choose = (key: string) => {
    if (key === "table") { setTableOpen(true); setHover([2, 2]); return }
    setActiveTool(activeTool === key ? "select" : key)
    close()
  }

  // Outside click + keyboard while open
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) close() }
    const onKey = (e: KeyboardEvent) => {
      if (tableOpen) {
        const [r, col] = hover
        if (e.key === "Escape" || (e.key === "ArrowLeft" && col <= 1)) { e.preventDefault(); e.stopPropagation(); setTableOpen(false); setHover([0, 0]); return }
        if (e.key === "ArrowRight") { e.preventDefault(); setHover([Math.max(1, r), Math.min(GRID, col + 1)]); return }
        if (e.key === "ArrowLeft") { e.preventDefault(); setHover([Math.max(1, r), Math.max(1, col - 1)]); return }
        if (e.key === "ArrowDown") { e.preventDefault(); setHover([Math.min(GRID, r + 1), Math.max(1, col)]); return }
        if (e.key === "ArrowUp") { e.preventDefault(); setHover([Math.max(1, r - 1), Math.max(1, col)]); return }
        if (e.key === "Enter" && r > 0 && col > 0) { e.preventDefault(); insertTable(r, col); close(); return }
        return
      }
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close() }
      else if (e.key === "ArrowDown") { e.preventDefault(); setFocus(f => (f + 1) % ITEMS.length) }
      else if (e.key === "ArrowUp") { e.preventDefault(); setFocus(f => (f - 1 + ITEMS.length) % ITEMS.length) }
      else if (e.key === "Enter") { e.preventDefault(); choose(ITEMS[focus].key) }
      else if (e.key === "ArrowRight" && ITEMS[focus].key === "table") { e.preventDefault(); choose("table") }
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey, true)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey, true) }
  })

  // Esc disarms a placement tool
  const armed = PLACE_TOOLS[activeTool]
  useEffect(() => {
    if (!armed) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); setActiveTool("select") } }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [armed, setActiveTool])

  return (
    <div ref={rootRef} className="relative flex shrink-0">
      <button
        onMouseDown={e => { e.preventDefault(); if (open) close(); else { setOpen(true); setFocus(0) } }}
        title="Insert"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`text-[12px] font-normal border border-zinc-200 rounded-[5px] ${compact ? "p-1.5" : "px-3 py-1"} bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] whitespace-nowrap transition-colors cursor-pointer active:scale-[0.97] flex items-center gap-1.5 ${open || armed ? "" : "text-zinc-700 hover:bg-zinc-100"}`}
        style={{ fontFamily: "Crimson Pro, serif", letterSpacing: "0.01em", ...(open || armed ? { color: ACCENT, textShadow: `0 0 6px ${accentAlpha(0.3)}` } : {}) }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        {!compact && <><span>insert</span><svg width="8" height="6" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.5 }}><path d="M0 0l5 6 5-6z" /></svg></>}
      </button>

      {open && (
        <div role="menu" className="absolute left-0 z-[300]" style={{
          top: "calc(100% + 6px)", width: 248, padding: 6, borderRadius: 14,
          background: c.panel, border: `1px solid ${c.border}`, boxShadow: c.shadow,
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          animation: "pulpMenuIn .12s cubic-bezier(.2,.8,.2,1)",
        }}>
          <style>{`@keyframes pulpMenuIn { from { opacity: 0; transform: translateY(-4px) scale(.98) } to { opacity: 1; transform: none } }`}</style>
          <div style={{ padding: "6px 10px 6px", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: c.muted, fontFamily: "Inter, system-ui, sans-serif" }}>Insert</div>
          {ITEMS.map((it, i) => {
            const active = activeTool === it.key
            const focused = focus === i
            return (
              <div key={it.key} style={{ position: "relative" }}>
                <button
                  role="menuitem"
                  onMouseDown={e => { e.preventDefault(); setFocus(i); choose(it.key) }}
                  onMouseEnter={() => { setFocus(i); if (it.key === "table") { setTableOpen(true) } else if (tableOpen) { setTableOpen(false); setHover([0, 0]) } }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 9, border: "none",
                    cursor: "pointer", textAlign: "left", background: focused ? c.rowHover : "transparent",
                    color: active ? ACCENT : c.text, fontFamily: "Crimson Pro, serif", fontSize: 15, transition: "background .06s",
                  }}
                >
                  <span style={{ width: 26, height: 26, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: active ? accentAlpha(0.14) : c.tile, color: active ? ACCENT : (dark ? "#a1a1aa" : "#52525b") }}>{it.icon}</span>
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.key === "sticky" ? (
                    <span style={{ display: "flex", gap: 4 }}>
                      {STICKY_COLORS.map(color => (
                        <span key={color}
                          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setStickyColor(color); setActiveTool("sticky"); close() }}
                          title="sticky color"
                          style={{ width: 12, height: 12, borderRadius: "50%", background: color, border: "1px solid rgba(0,0,0,0.12)", cursor: "pointer",
                            boxShadow: stickyColor === color ? `0 0 0 1.5px ${c.panel}, 0 0 0 3px ${ACCENT}` : "none", transition: "transform .1s" }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.2)" }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "" }}
                        />
                      ))}
                    </span>
                  ) : it.key === "table" ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c.muted} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 6 15 12 9 18" /></svg>
                  ) : (
                    <span style={{ fontSize: 11.5, fontStyle: "italic", color: active ? ACCENT : c.muted }}>{active ? "placing…" : it.hint}</span>
                  )}
                </button>

                {it.key === "table" && tableOpen && (
                  <div onMouseLeave={() => setHover([0, 0])} style={{
                    position: "absolute", left: "calc(100% + 8px)", top: -8, padding: 12, borderRadius: 14,
                    background: c.panel, border: `1px solid ${c.border}`, boxShadow: c.shadow,
                    animation: "pulpMenuIn .1s cubic-bezier(.2,.8,.2,1)",
                  }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: c.muted, fontFamily: "Inter, system-ui, sans-serif", marginBottom: 8 }}>Table size</div>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID}, 16px)`, gap: 3 }}>
                      {Array.from({ length: GRID * GRID }, (_, k) => {
                        const r = Math.floor(k / GRID) + 1
                        const col = (k % GRID) + 1
                        const on = r <= hover[0] && col <= hover[1]
                        return (
                          <div key={k}
                            onMouseEnter={() => setHover([r, col])}
                            onMouseDown={e => { e.preventDefault(); insertTable(r, col); close() }}
                            style={{ width: 16, height: 16, borderRadius: 3, cursor: "pointer",
                              background: on ? accentAlpha(0.45) : (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)"),
                              border: `1px solid ${on ? accentAlpha(0.85) : c.border}` }}
                          />
                        )
                      })}
                    </div>
                    <div style={{ marginTop: 8, textAlign: "center", fontFamily: "Crimson Pro, serif", fontSize: 14, color: hover[0] ? c.text : c.muted }}>
                      {hover[0] ? `${hover[0]} × ${hover[1]}` : "pick a size"}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {armed && !open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 300, whiteSpace: "nowrap", pointerEvents: "auto",
          display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 6px 12px", borderRadius: 999,
          background: dark ? "rgba(32,32,36,0.96)" : "rgba(255,255,255,0.96)", border: `1px solid ${c.border}`, boxShadow: c.shadow,
          fontFamily: "Crimson Pro, serif", fontSize: 13.5, color: c.text, animation: "pulpMenuIn .12s ease-out",
        }}>
          <style>{`@keyframes pulpMenuIn { from { opacity: 0; transform: translateY(-4px) scale(.98) } to { opacity: 1; transform: none } }`}</style>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: ACCENT }} />
          Click on the page to place a {armed}
          <button onMouseDown={e => { e.preventDefault(); setActiveTool("select") }}
            style={{ marginLeft: 4, padding: "2px 8px", borderRadius: 999, border: `1px solid ${c.border}`, background: "transparent", color: c.muted, cursor: "pointer", fontSize: 11, fontFamily: "Inter, system-ui, sans-serif" }}>
            Esc
          </button>
        </div>
      )}
    </div>
  )
})
