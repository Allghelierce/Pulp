import { useState, useEffect, useRef, memo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface SlashItem {
  id: string
  label: string
  shortcut?: string
  hint?: string
  group: string
  icon: React.ReactNode
  action: () => void
  isColor?: boolean
}

interface SlashMenuProps {
  x: number
  y: number
  filter: string
  accent: string
  isSelectionMode?: boolean
  onSelect: (action: () => void) => void
  onClose: () => void
  execCmd: (cmd: string, value?: string) => void
  insertHTML: (html: string) => void
  toggleScript: (cmd: "superscript" | "subscript") => void
  insertBacklink: () => void
  onInsertImage?: () => void
  mode: "@" | "/"
  box?: any
  onUpdateBox?: (id: string, updates: any) => void
}

export const SlashMenu = memo(function SlashMenu({
  x, y, filter, accent, isSelectionMode, onSelect, onClose, execCmd, insertHTML, toggleScript: _toggleScript, insertBacklink,
  onInsertImage, mode, box, onUpdateBox
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
      id: "todo", label: "To-do list", shortcut: "[]", group: "Structure", hint: "Interactive",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><polyline points="9 11 12 14 22 4" /></svg>,
      action: () => {
        const id = "todo-" + Math.random().toString(36).slice(2, 9)
        insertHTML(
          `<div class="task-item" style="display:flex;align-items:flex-start;gap:10px;margin:4px 0">` +
            `<div contenteditable="false" style="user-select:none;display:flex;align-items:center;padding-top:2px;flex-shrink:0;">` +
              `<label class="neon-cb">` +
                `<input type="checkbox" class="neon-cb__input"/>` +
                `<div class="neon-cb__box">` +
                  `<svg viewBox="0 0 24 24" class="neon-cb__check"><path d="M3,12.5l7,7L21,5"/></svg>` +
                  `<div class="neon-cb__glow"></div>` +
                  `<span class="neon-cb__border neon-cb__border--t"></span>` +
                  `<span class="neon-cb__border neon-cb__border--r"></span>` +
                  `<span class="neon-cb__border neon-cb__border--b"></span>` +
                  `<span class="neon-cb__border neon-cb__border--l"></span>` +
                `</div>` +
              `</label>` +
            `</div>` +
            `<span id="${id}" style="flex:1;outline:none;min-height:1.2em;">&#8203;</span>` +
          `</div>`
        )
        setTimeout(() => {
          const el = document.getElementById(id)
          if (el && el.firstChild) {
            const range = document.createRange()
            range.setStart(el.firstChild, 1)
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
    {
      id: "image", label: "Image", group: "Media", hint: "Upload from device",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
      action: () => onInsertImage?.()
    },
  ]

  const settingsItems: SlashItem[] = box ? [
    {
      id: "align-left", label: "Align Left", group: "Alignment",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>,
      action: () => onUpdateBox?.(box.id, { textAlign: "left" })
    },
    {
      id: "align-center", label: "Align Center", group: "Alignment",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" /></svg>,
      action: () => onUpdateBox?.(box.id, { textAlign: "center" })
    },
    {
      id: "align-right", label: "Align Right", group: "Alignment",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" /></svg>,
      action: () => onUpdateBox?.(box.id, { textAlign: "right" })
    },
    {
      id: "outline-0", label: "Remove Outline", group: "Outline",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="21" x2="21" y2="3" /></svg>,
      action: () => onUpdateBox?.(box.id, { boxOutlineWidth: 0 })
    },
    {
      id: "outline-1", label: "Thin Outline (1px)", group: "Outline",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>,
      action: () => onUpdateBox?.(box.id, { boxOutlineWidth: 1 })
    },
    {
      id: "outline-2", label: "Medium Outline (2px)", group: "Outline",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>,
      action: () => onUpdateBox?.(box.id, { boxOutlineWidth: 2 })
    },
    {
      id: "outline-4", label: "Thick Outline (4px)", group: "Outline",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>,
      action: () => onUpdateBox?.(box.id, { boxOutlineWidth: 4 })
    },
    {
      id: "fill-trans", label: "Transparent Fill", group: "Background",
      isColor: true, icon: <div style={{ width: 14, height: 14, border: "1px solid #ccc", background: "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIElEQVQYV2Nk+M/AwMDEwMDIwAjmAxXBBf8f4FMBXAsAkREKAu7/vUoAAAAASUVORK5CYII=)" }} />,
      action: () => onUpdateBox?.(box.id, { boxHighlightColor: "transparent" })
    },
    {
      id: "fill-paper", label: "Paper Fill", group: "Background",
      isColor: true, icon: <div style={{ width: 14, height: 14, border: "1px solid #ccc", background: "#fdf6e3" }} />,
      action: () => onUpdateBox?.(box.id, { boxHighlightColor: "#fdf6e3" })
    },
    {
      id: "fill-yellow", label: "Yellow Fill", group: "Background",
      isColor: true, icon: <div style={{ width: 14, height: 14, background: "#fef08a" }} />,
      action: () => onUpdateBox?.(box.id, { boxHighlightColor: "#fef08a" })
    },
    {
      id: "fill-green", label: "Green Fill", group: "Background",
      isColor: true, icon: <div style={{ width: 14, height: 14, background: "#bbf7d0" }} />,
      action: () => onUpdateBox?.(box.id, { boxHighlightColor: "#bbf7d0" })
    },
    {
      id: "fill-blue", label: "Blue Fill", group: "Background",
      isColor: true, icon: <div style={{ width: 14, height: 14, background: "#bae6fd" }} />,
      action: () => onUpdateBox?.(box.id, { boxHighlightColor: "#bae6fd" })
    },
  ] : []

  const itemsToDisplay = mode === "/"
    ? settingsItems
    : (isSelectionMode
        ? allItems.filter(item => item.group === "Typography" || item.group === "Reference")
        : allItems)

  const filtered = filter
    ? itemsToDisplay.filter(item => item.label.toLowerCase().includes(filter.toLowerCase()))
    : itemsToDisplay

  useEffect(() => { setActiveIdx(0) }, [filter])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" })
  }, [activeIdx])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setActiveIdx(i => Math.min((i ?? -1) + 1, filtered.length - 1)) }
      else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setActiveIdx(i => Math.max((i ?? -1) - 1, 0)) }
      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); if (activeIdx !== null && filtered[activeIdx]) onSelect(filtered[activeIdx].action) }
      else if (e.key === "Escape" || e.key === "Tab") { if (filtered.length > 0) e.stopPropagation(); onClose() }
    }
    document.addEventListener("keydown", handler, true)
    return () => document.removeEventListener("keydown", handler, true)
  }, [activeIdx, filtered, onSelect, onClose])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  const groups: { label: string; items: SlashItem[] }[] = []
  for (const item of filtered) {
    const existing = groups.find(g => g.label === item.group)
    if (existing) existing.items.push(item)
    else groups.push({ label: item.group, items: [item] })
  }

  const menuHeight = Math.min(filtered.length * 40 + 80, 340)
  const adjustedY = y + menuHeight > window.innerHeight - 20 ? y - menuHeight - 24 : y

  return (
    <div
      ref={ref}
      onMouseLeave={() => setActiveIdx(null)}
      style={{
        position: "fixed", left: Math.max(8, x), top: adjustedY, zIndex: 9999,
        background: mode === "/" ? "rgba(255, 255, 255, 0.95)" : "rgba(10, 10, 11, 0.9)",
        backgroundImage: mode === "/"
          ? `linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)`
          : `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: mode === "/" ? "1px solid rgba(0, 0, 0, 0.15)" : "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: 12,
        width: 240,
        boxShadow: mode === "/"
          ? "0 10px 40px -10px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.2)"
          : "0 20px 70px -15px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.3)",
        animation: "slide-up-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflow: "hidden",
      }}
    >
      <div style={{ maxHeight: 340, overflowY: "auto", overscrollBehavior: "contain" }}>
        <div style={{ padding: "6px 0" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 14px", fontSize: 12, color: "#a1a1aa" }}>No results</div>
          ) : (
            groups.map((group, gIdx) => (
              <div key={group.label}>
                {gIdx > 0 && (
                  <Separator
                    className="my-1 mx-3"
                    style={{
                      background: mode === "/" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                    }}
                  />
                )}
                <div style={{
                  padding: "8px 14px 4px", fontSize: 10, fontWeight: 700,
                  color: mode === "/" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.3)",
                  textTransform: "uppercase", letterSpacing: "0.08em"
                }}>
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const actualIdx = filtered.indexOf(item)
                  const isActive = activeIdx === actualIdx
                  return (
                    <div
                      key={item.id}
                      ref={isActive ? activeRef : null}
                      onMouseEnter={() => setActiveIdx(actualIdx)}
                      onClick={() => onSelect(item.action)}
                      style={{
                        padding: "8px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        background: isActive ? (mode === "/" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)") : "transparent",
                        transition: "all 0.1s ease",
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? (mode === "/" ? "white" : "rgba(255,255,255,0.1)") : (mode === "/" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)"),
                        color: mode === "/" ? (isActive ? accent : "rgba(0,0,0,0.7)") : (isActive ? "white" : "rgba(255,255,255,0.5)"),
                        boxShadow: (isActive && mode === "/") ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                      }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: mode === "/" ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)" }}>
                          {item.label}
                        </div>
                        {item.hint && (
                          <div style={{ fontSize: 10, color: mode === "/" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}>
                            {item.hint}
                          </div>
                        )}
                      </div>
                      {item.shortcut && (
                        <div style={{
                          fontSize: 10, padding: "2px 6px", borderRadius: 4,
                          background: mode === "/" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)",
                          color: mode === "/" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.3)",
                          fontFamily: "monospace"
                        }}>
                          {item.shortcut}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
})
