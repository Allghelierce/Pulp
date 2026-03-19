import { useState, useEffect, useRef, memo } from "react"

interface SlashItem {
  id: string
  label: string
  shortcut?: string
  hint?: string
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
  const [activeIdx, setActiveIdx] = useState<number | null>(0)
  const ref = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)

  const allItems: SlashItem[] = [
    {
      id: "bold", label: "Bold", shortcut: "⌘B", group: "Typography",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>,
      action: () => execCmd("bold")
    },
    {
      id: "italic", label: "Italic", shortcut: "⌘I", group: "Typography",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>,
      action: () => execCmd("italic")
    },
    {
      id: "underline", label: "Underline", shortcut: "⌘U", group: "Typography",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>,
      action: () => execCmd("underline")
    },
    {
      id: "strikethrough", label: "Strikethrough", group: "Typography",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" y1="12" x2="20" y2="12" /></svg>,
      action: () => execCmd("strikeThrough")
    },
    {
      id: "highlight", label: "Highlight", group: "Typography", hint: "Yellow",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>,
      action: () => execCmd("hiliteColor", "#fef08a")
    },

    {
      id: "bullet", label: "Bulleted list", shortcut: "-", group: "Structure",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
      action: () => execCmd("insertUnorderedList")
    },
    {
      id: "numbered", label: "Numbered list", shortcut: "1.", group: "Structure",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="10 6 21 6" /><polyline points="10 12 21 12" /><polyline points="10 18 21 18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></svg>,
      action: () => execCmd("insertOrderedList")
    },
    {
      id: "todo", label: "To-do list", shortcut: "[]", group: "Structure", hint: "Interactive",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><polyline points="9 11 12 14 22 4" /></svg>,
      action: () => insertHTML(`<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><input type="checkbox" style="width:15px;height:15px;accent-color:${accent}"/><span>Task</span></div><br/>`)
    },
    {
      id: "toggle", label: "Toggle list", shortcut: ">>", group: "Structure",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>,
      action: () => {
        const id = "toggle-" + Math.random().toString(36).slice(2, 9)
        insertHTML(`
          <details class="toggle-block" style="margin: 8px 0;">
            <summary style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; outline: none; list-style: none;">
              <div contenteditable="false" style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.05); border-radius: 6px; flex-shrink: 0;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="toggle-caret-icon" style="transition: transform 0.2s ease; color: #111;">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span id="${id}" data-placeholder="Toggle list" style="font-size: 1.1em; font-weight: 500; color: #111; display: inline-block; outline: none; flex: 1; min-height: 1.4em;"></span>
            </summary>
            <div data-placeholder="Enter content here..." style="margin-left: 13px; padding: 6px 0 6px 24px; border-left: 2px solid rgba(0,0,0,0.04); margin-top: 2px; color: #444; font-size: 0.95em; min-height: 1.4em;"></div>
          </details>
          <p><br/></p>
        `)
        setTimeout(() => {
          const el = document.getElementById(id)
          if (el) {
            const range = document.createRange()
            range.setStart(el, 0)
            range.collapse(true)
            const sel = window.getSelection()
            sel?.removeAllRanges()
            sel?.addRange(range)
            el.removeAttribute('id')
          }
        }, 0)
      }
    },

    {
      id: "quote", label: "Blockquote", shortcut: ">", group: "Structure",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
      action: () => insertHTML(`<blockquote style="border-left:4px solid ${accent};padding:8px 16px;margin:8px 0;color:#888;font-style:italic;background:#f7f0f2;border-radius:0 8px 8px 0">Quote…</blockquote><br/>`)
    },
    {
      id: "divider", label: "Separator", shortcut: "---", group: "Structure",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>,
      action: () => insertHTML('<hr style="border:none;border-top:2px solid #ddd;margin:16px 0"/><br/>')
    },

    {
      id: "backlink", label: "Create Backlink", shortcut: "@", group: "Reference", hint: "Create subpage",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>,
      action: () => insertBacklink()
    },
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
      if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setActiveIdx(i => Math.min((i ?? -1) + 1, filtered.length - 1)) }
      else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setActiveIdx(i => Math.max((i ?? -1) - 1, 0)) }
      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (activeIdx !== null && filtered[activeIdx]) onSelect(filtered[activeIdx].action) }
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
  const adjustedY = y + menuHeight > window.innerHeight - 20 ? y - menuHeight - 24 : y
  const animationStyles = `
    .slash-menu-scroll::-webkit-scrollbar { display: none; }
    .slash-menu-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  `

  return (
    <>
      <style>{animationStyles}</style>
      <div
        ref={ref}
        onMouseLeave={() => setActiveIdx(null)}
        className="slash-menu-scroll"
        style={{
          position: "fixed", left: Math.max(8, x), top: adjustedY, zIndex: 9999,
          background: "rgba(10, 10, 11, 0.9)",
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 6, padding: "5px 0",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
          minWidth: 280, maxHeight: 400, overflowY: "auto",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: "10px 14px", fontSize: 12, color: "#a1a1aa" }}>No results</div>
        ) : (() => {
          let globalIdx = 0
          return groups.map((group, gi) => (
            <div key={group.label}>
              {group.label && (
                <div style={{
                  fontSize: 10.5, fontWeight: 650, color: "rgba(255,255,255,0.45)", letterSpacing: "0.02em",
                  padding: "12px 14px 6px",
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
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "6px 14px", margin: 0,
                      cursor: "pointer",
                      background: isActive ? "rgba(212, 175, 55, 0.18)" : "transparent",
                      transition: "background 0.05s ease",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isActive ? "#ffffff" : "#D4AF37",
                    }}>{item.icon}</div>

                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: isActive ? "#ffffff" : "#e4e4e7", letterSpacing: "-0.01em" }}>
                        {item.label}
                      </span>
                      {item.hint && (
                        <span style={{
                          fontSize: 10,
                          background: isActive ? "rgba(255,255,255,0.15)" : "rgba(212, 175, 55, 0.1)",
                          color: isActive ? "#ffffff" : "#D4AF37",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontWeight: 650,
                          letterSpacing: "0.02em"
                        }}>
                          {item.hint.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {item.shortcut && (
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.02em", fontWeight: 500, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' }}>
                        {item.shortcut}
                      </div>
                    )}
                  </div>
                )
              })}
              {gi < groups.length - 1 && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "8px 14px 4px" }} />
              )}
            </div>
          ))
        })()}

        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)", margin: "4px 0 0",
          padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 500, letterSpacing: "0.01em" }}>Type &apos;@&apos; to search</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>ESC</span>
        </div>
      </div>
    </>
  )
})
