import { useState, useEffect, useRef, memo } from "react"

interface SlashItem {
  id: string
  label: string
  shortcut?: string
  group: string
  icon: React.ReactNode
  action: () => void
}

interface SlashMenuProps {
  x: number
  y: number
  filter: string
  accent: string
  onSelect: (action: () => void) => void
  onClose: () => void
  execCmd: (cmd: string, value?: string) => void
  insertHTML: (html: string) => void
  toggleScript: (cmd: "superscript" | "subscript") => void
  insertBacklink: () => void
}

export const SlashMenu = memo(function SlashMenu({
  x, y, filter, accent, onSelect, onClose, execCmd, insertHTML, toggleScript, insertBacklink,
}: SlashMenuProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)

  const allItems: SlashItem[] = [
    { id: "bold", label: "Bold", shortcut: "B", group: "Style",
      icon: <span style={{ fontWeight: 800, fontSize: 13 }}>B</span>,
      action: () => execCmd("bold") },
    { id: "italic", label: "Italic", shortcut: "I", group: "Style",
      icon: <span style={{ fontStyle: "italic", fontFamily: "Georgia, serif", fontSize: 14 }}>I</span>,
      action: () => execCmd("italic") },
    { id: "underline", label: "Underline", shortcut: "U", group: "Style",
      icon: <span style={{ textDecoration: "underline", fontSize: 13 }}>U</span>,
      action: () => execCmd("underline") },
    { id: "strikethrough", label: "Strikethrough", shortcut: "S", group: "Style",
      icon: <span style={{ textDecoration: "line-through", fontSize: 13 }}>S</span>,
      action: () => execCmd("strikeThrough") },
    { id: "highlight", label: "Highlight", shortcut: "H", group: "Style",
      icon: <span style={{ background: "#fef08a", padding: "0 3px", fontSize: 11, fontWeight: 700 }}>H</span>,
      action: () => execCmd("hiliteColor", "#fef08a") },
    { id: "superscript", label: "Superscript", group: "Style",
      icon: <span style={{ fontSize: 11 }}>x²</span>,
      action: () => toggleScript("superscript") },
    { id: "subscript", label: "Subscript", group: "Style",
      icon: <span style={{ fontSize: 11 }}>x₂</span>,
      action: () => toggleScript("subscript") },

    { id: "bullet", label: "Bulleted list", shortcut: "–", group: "List",
      icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><circle cx="2.5" cy="4.5" r="1.5"/><rect x="5" y="3.5" width="10" height="2" rx="1"/><circle cx="2.5" cy="9" r="1.5"/><rect x="5" y="8" width="10" height="2" rx="1"/><circle cx="2.5" cy="13.5" r="1.5"/><rect x="5" y="12.5" width="10" height="2" rx="1"/></svg>,
      action: () => execCmd("insertUnorderedList") },
    { id: "numbered", label: "Numbered list", shortcut: "1.", group: "List",
      icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><text x="0" y="6" fontSize="6" fontWeight="700">1.</text><rect x="6" y="4" width="9" height="2" rx="1"/><text x="0" y="11" fontSize="6" fontWeight="700">2.</text><rect x="6" y="9" width="9" height="2" rx="1"/><text x="0" y="16" fontSize="6" fontWeight="700">3.</text><rect x="6" y="14" width="9" height="2" rx="1"/></svg>,
      action: () => execCmd("insertOrderedList") },
    { id: "todo", label: "To-do list", shortcut: "[ ]", group: "List",
      icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="6" height="6" rx="1"/><polyline points="2.5,4 4,5.5 6.5,2.5"/><rect x="1" y="9" width="6" height="6" rx="1"/><line x1="9" y1="4" x2="15" y2="4"/><line x1="9" y1="12" x2="15" y2="12"/></svg>,
      action: () => insertHTML(`<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><input type="checkbox" style="width:15px;height:15px;accent-color:${accent}"/><span>Task</span></div><br/>`) },

    { id: "quote", label: "Quote", shortcut: '"', group: "Block",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>,
      action: () => insertHTML(`<blockquote style="border-left:4px solid ${accent};padding:8px 16px;margin:8px 0;color:#888;font-style:italic;background:#f7f0f2;border-radius:0 8px 8px 0">Quote…</blockquote><br/>`) },
    { id: "divider", label: "Divider", shortcut: "—", group: "Block",
      icon: <svg width="13" height="4" viewBox="0 0 16 4" fill="none"><line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      action: () => insertHTML('<hr style="border:none;border-top:2px solid #ddd;margin:16px 0"/><br/>') },
    
    { id: "backlink", label: "Backlink", group: "Block",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
      action: () => insertBacklink() },
  ]

  const filtered = filter
    ? allItems.filter(item => item.label.toLowerCase().includes(filter.toLowerCase()))
    : allItems

  useEffect(() => { setActiveIdx(0) }, [filter])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [activeIdx])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
      else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setActiveIdx(i => Math.max(i - 1, 0)) }
      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (filtered[activeIdx]) onSelect(filtered[activeIdx].action) }
      else if (e.key === "Escape" || e.key === "Tab") { e.stopPropagation(); onClose() }
    }
    document.addEventListener("keydown", handler, true)
    return () => document.removeEventListener("keydown", handler, true)
  }, [activeIdx, filtered, onSelect, onClose])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  // Group items
  const groups: { label: string; items: SlashItem[] }[] = []
  for (const item of filtered) {
    const existing = groups.find(g => g.label === item.group)
    if (existing) existing.items.push(item)
    else groups.push({ label: item.group, items: [item] })
  }

  // Flip upward if too close to bottom of viewport
  const menuHeight = Math.min(filtered.length * 40 + 80, 340)
  const adjustedY = y + menuHeight > window.innerHeight - 20 ? y - menuHeight - 12 : y

  return (
    <div ref={ref} style={{
      position: "fixed", left: Math.max(8, x), top: adjustedY, zIndex: 9999,
      background: "#ffffff", border: "1px solid rgba(0,0,0,0.09)",
      borderRadius: 10, padding: "4px 0",
      boxShadow: "0 8px 28px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
      minWidth: 240, maxHeight: 340, overflowY: "auto",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {filtered.length === 0 ? (
        <div style={{ padding: "10px 14px", fontSize: 12, color: "#a1a1aa" }}>No results</div>
      ) : (() => {
        let globalIdx = 0
        return groups.map((group, gi) => (
          <div key={group.label}>
            {group.label && (
              <div style={{
                fontSize: 10, fontWeight: 600, color: "#a1a1aa", letterSpacing: "0.06em",
                textTransform: "uppercase", padding: "8px 12px 3px",
                ...(gi > 0 ? { borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 4, paddingTop: 10 } : {}),
              }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const idx = globalIdx++
              const isActive = idx === activeIdx
              return (
                <div key={item.id}
                  ref={isActive ? activeRef : undefined}
                  onMouseDown={e => { e.preventDefault(); onSelect(item.action) }}
                  onMouseEnter={() => setActiveIdx(idx)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "5px 10px", margin: "1px 4px", borderRadius: 6,
                    cursor: "pointer",
                    background: isActive ? "rgba(0,0,0,0.05)" : "transparent",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: "#f4f4f5", border: "1px solid rgba(0,0,0,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "#3f3f46",
                  }}>{item.icon}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 450, color: "#18181b", letterSpacing: "-0.01em" }}>
                    {item.label}
                  </div>
                  {item.shortcut && (
                    <div style={{ fontSize: 11, color: "#a1a1aa" }}>{item.shortcut}</div>
                  )}
                </div>
              )
            })}
          </div>
        ))
      })()}
      <div style={{
        borderTop: "1px solid rgba(0,0,0,0.06)", margin: "4px 0 0",
        padding: "5px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 10.5, color: "#a1a1aa" }}>Type &apos;@&apos; or &apos;/&apos; to search</span>
        <span style={{ fontSize: 10.5, color: "#a1a1aa" }}>esc to close</span>
      </div>
    </div>
  )
})
