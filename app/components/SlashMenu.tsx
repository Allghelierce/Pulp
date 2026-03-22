import { useState, useEffect, useRef, memo } from "react"
import { createPortal } from "react-dom"
import { format } from "date-fns"
import { DatetimePicker } from "@/components/ui/datetime-picker"// ─── Types ─────────────────────────────────────────────────────────────────────

interface SubOption {
  label: string
  swatch?: string       // css color for color swatches
  action: () => void
}

interface SlashItem {
  id: string
  label: string
  shortcut?: string
  hint?: string
  group: string
  icon: React.ReactNode
  action: () => void
  subOptions?: SubOption[]   // if present, clicking opens a submenu panel
  customContent?: React.ReactNode // if present, clicking opens custom react node
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

// ─── Shared icon style ──────────────────────────────────────────────────────

const ORANGE = "#b85e22"

function OIcon({ children, isActive, mode }: { children: React.ReactNode; isActive: boolean; mode: "@" | "/" }) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: isActive
        ? (mode === "/" ? "rgba(184,94,34,0.12)" : "rgba(184,94,34,0.18)")
        : "transparent",
      color: ORANGE,
      transition: "background 0.1s ease",
    }}>
      {children}
    </div>
  )
}

// ─── Custom Date Wrapper ────────────────────────────────────────────────────────

function CustomDateWrapper({ onInsert, onClose, mode }: { onInsert: (str: string) => void, onClose: () => void, mode: "@" | "/" }) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showTime, setShowTime] = useState(false)
  const isLight = mode === "/"

  return (
    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 12 }}>
      <DatetimePicker
        value={date}
        onChange={setDate}
        format={[
          ["months", "days", "years"],
          ...(showTime ? [["hours", "minutes", "am/pm"]] : [])
        ] as any}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)", cursor: "pointer", userSelect: "none" }}>
          <input type="checkbox" checked={showTime} onChange={e => setShowTime(e.target.checked)} style={{ cursor: "pointer" }} />
          Include Time
        </label>
        <button
          onClick={() => {
            if (!date) return
            const str = format(date, showTime ? "MM-dd-yyyy hh:mm a" : "MM-dd-yyyy")
            onInsert(str)
            onClose()
          }}
          style={{
            background: "#b85e22", color: "white", padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: "pointer",
            border: "none"
          }}
        >
          Insert
        </button>
      </div>
    </div>
  )
}

// ─── Submenu flyout ────────────────────────────────────────────────────────────

function Submenu({
  options, onSelect, onClose, mode, parentRef,
}: {
  options: SubOption[]
  onSelect: (action: () => void) => void
  onClose: () => void
  mode: "@" | "/"
  parentRef: React.RefObject<HTMLDivElement | null>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(0)

  useEffect(() => {
    // Position submenu aligned with parent row
    if (parentRef.current && ref.current) {
      const pr = parentRef.current.getBoundingClientRect()
      const rh = ref.current.getBoundingClientRect()
      let t = pr.top
      if (t + rh.height > window.innerHeight - 8) t = window.innerHeight - rh.height - 8
      setTop(t)
    }
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node) && !parentRef.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose, parentRef])

  const isLight = mode === "/"
  const isDark = !isLight

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: (parentRef.current?.getBoundingClientRect().right ?? 0) + 4,
        top,
        zIndex: 10000,
        minWidth: 170,
        background: isLight ? "rgba(255,255,255,0.97)" : "rgba(14,14,16,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.12)",
        borderRadius: 5,
        boxShadow: isLight
          ? "0 8px 32px -8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)"
          : "0 16px 48px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
        padding: "4px 0",
        animation: "slide-up-fade 0.15s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {options.map((opt) => (
        <div
          key={opt.label}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); opt.action(); onSelect(() => { }); onClose() }}
          style={{
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: 11.5,
            fontWeight: 500,
            color: isLight ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.88)",
            transition: "background 0.08s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.07)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          {opt.swatch && (
            <div style={{
              width: 12, height: 12, borderRadius: 3, flexShrink: 0,
              background: opt.swatch,
              border: opt.swatch === "transparent" ? "1px solid #ccc" : `1px solid ${opt.swatch}88`,
              backgroundImage: opt.swatch === "transparent"
                ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='2' height='2' fill='%23ccc'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23ccc'/%3E%3C/svg%3E")`
                : undefined,
            }} />
          )}
          {opt.label}
        </div>
      ))}
    </div>,
    document.body
  )
}

// ─── Custom Flyout Wrapper ──────────────────────────────────────────────────

function CustomMenuFlyout({ children, parentRef, mode }: { children: React.ReactNode, parentRef: React.RefObject<HTMLDivElement | null>, mode: "@" | "/" }) {
  const ref = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(0)

  useEffect(() => {
    if (parentRef.current && ref.current) {
      const pr = parentRef.current.getBoundingClientRect()
      const rh = ref.current.getBoundingClientRect()
      let t = pr.top
      if (t + rh.height > window.innerHeight - 8) t = window.innerHeight - rh.height - 8
      setTop(t)
    }
  }, [parentRef, children])

  const isLight = mode === "/"

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: (parentRef.current?.getBoundingClientRect().right ?? 0) + 4,
        top,
        zIndex: 10000,
        background: isLight ? "rgba(255,255,255,0.97)" : "rgba(14,14,16,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.12)",
        borderRadius: 5,
        boxShadow: isLight
          ? "0 8px 32px -8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)"
          : "0 16px 48px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
        animation: "slide-up-fade 0.15s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export const SlashMenu = memo(function SlashMenu({
  x, y, filter, accent, isSelectionMode, onSelect, onClose, execCmd, insertHTML,
  toggleScript: _toggleScript, insertBacklink, onInsertImage, mode, box, onUpdateBox
}: SlashMenuProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(0)
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const submenuRowRef = useRef<HTMLDivElement | null>(null)

  // ── @ menu items ──────────────────────────────────────────────────────────
  const allItems: SlashItem[] = [
    {
      id: "bold", label: "Bold", shortcut: "⌘B", group: "Typography",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>,
      action: () => execCmd("bold")
    },
    {
      id: "italic", label: "Italic", shortcut: "⌘I", group: "Typography",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>,
      action: () => execCmd("italic")
    },
    {
      id: "underline", label: "Underline", shortcut: "⌘U", group: "Typography",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>,
      action: () => execCmd("underline")
    },
    {
      id: "strikethrough", label: "Strikethrough", group: "Typography",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" y1="12" x2="20" y2="12" /></svg>,
      action: () => execCmd("strikeThrough")
    },
    {
      id: "highlight", label: "Highlight", group: "Typography",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>,
      action: () => execCmd("hiliteColor", "#fef08a"),
      subOptions: [
        { label: "Yellow", swatch: "#fef08a", action: () => execCmd("hiliteColor", "#fef08a") },
        { label: "Orange", swatch: "#fed7aa", action: () => execCmd("hiliteColor", "#fed7aa") },
        { label: "Green", swatch: "#bbf7d0", action: () => execCmd("hiliteColor", "#bbf7d0") },
        { label: "Blue", swatch: "#bae6fd", action: () => execCmd("hiliteColor", "#bae6fd") },
        { label: "Pink", swatch: "#fce7f3", action: () => execCmd("hiliteColor", "#fce7f3") },
        { label: "Purple", swatch: "#e9d5ff", action: () => execCmd("hiliteColor", "#e9d5ff") },
        { label: "None", swatch: "transparent", action: () => execCmd("hiliteColor", "transparent") },
      ]
    },
    {
      id: "todo", label: "To-do list", shortcut: "[]", group: "Structure",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><polyline points="9 11 12 14 22 4" /></svg>,
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
            const range = document.createRange(); range.setStart(el.firstChild, 1); range.collapse(true)
            const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range)
            el.removeAttribute("id")
          }
        }, 0)
      }
    },
    {
      id: "toggle", label: "Toggle list", shortcut: ">>", group: "Structure",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>,
      action: () => {
        const id = "toggle-" + Math.random().toString(36).slice(2, 9)
        insertHTML(`
          <details class="toggle-block" style="margin: 8px 0;">
            <summary style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; outline: none; list-style: none;">
              <div contenteditable="false" style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.05); border-radius: 6px; flex-shrink: 0;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="toggle-caret-icon" style="transition: transform 0.2s ease; color: #111;"><path d="M8 5v14l11-7z" /></svg>
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
            const range = document.createRange(); range.setStart(el, 0); range.collapse(true)
            const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range)
            el.removeAttribute("id")
          }
        }, 0)
      }
    },
    {
      id: "quote", label: "Blockquote", shortcut: ">", group: "Structure",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
      action: () => insertHTML(`<blockquote style="border-left:4px solid ${accent};padding:8px 16px;margin:8px 0;color:#888;font-style:italic;background:#f7f0f2;border-radius:0 8px 8px 0">Quote…</blockquote><br/>`)
    },
    {
      id: "divider", label: "Separator", shortcut: "---", group: "Structure",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>,
      action: () => insertHTML('<hr style="border:none;border-top:2px solid #000;margin:16px auto;width:90%"/><br/>')
    },
    {
      id: "backlink", label: "Create Backlink", shortcut: "@", group: "Reference",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>,
      action: () => insertBacklink()
    },
    {
      id: "image", label: "Image", group: "Media",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
      action: () => onInsertImage?.()
    },
    {
      id: "date", label: "Today's Date", shortcut: "today", group: "Accessories",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
      action: () => {
        const str = format(new Date(), "MM-dd-yyyy")
        insertHTML(`<span>${str}</span>`)
      }
    },
    {
      id: "date-custom", label: "Custom Date", group: "Accessories",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
      action: () => {}, 
      customContent: <CustomDateWrapper onInsert={(str) => {
        onSelect(() => insertHTML(`<span>${str}</span>`))
      }} onClose={onClose} mode={mode} />
    },
  ]

  // ── / menu items ──────────────────────────────────────────────────────────
  const settingsItems: SlashItem[] = box ? [
    {
      id: "heading", label: "Heading level", group: "Typography",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 12h12M6 20V4M18 20V4" /></svg>,
      action: () => onUpdateBox?.(box.id, { boxHeadingStyle: "h1" }),
      subOptions: [
        { label: "Normal text", action: () => onUpdateBox?.(box.id, { boxHeadingStyle: "default" }) },
        { label: "Heading 1 (L)", action: () => onUpdateBox?.(box.id, { boxHeadingStyle: "h1" }) },
        { label: "Heading 2 (M)", action: () => onUpdateBox?.(box.id, { boxHeadingStyle: "h2" }) },
        { label: "Heading 3 (S)", action: () => onUpdateBox?.(box.id, { boxHeadingStyle: "h3" }) },
      ]
    },
    {
      id: "font", label: "Font family", group: "Typography",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 7V4h16v3M9 20h6M12 4v16" /></svg>,
      action: () => onUpdateBox?.(box.id, { boxFontFamily: "" }),
      subOptions: [
        { label: "Garamond (Elegant)", action: () => onUpdateBox?.(box.id, { boxFontFamily: "" }) },
        { label: "Georgia (Modern)", action: () => onUpdateBox?.(box.id, { boxFontFamily: "Georgia, serif" }) },
        { label: "Arial (Clean)", action: () => onUpdateBox?.(box.id, { boxFontFamily: "Arial, sans-serif" }) },
        { label: "Monospace (Code)", action: () => onUpdateBox?.(box.id, { boxFontFamily: '"Courier New", monospace' }) },
      ]
    },
    {
      id: "alignment", label: "Text alignment", group: "Typography",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>,
      action: () => onUpdateBox?.(box.id, { textAlign: "left" }),
      subOptions: [
        { label: "Align Left", action: () => onUpdateBox?.(box.id, { textAlign: "left" }) },
        { label: "Align Center", action: () => onUpdateBox?.(box.id, { textAlign: "center" }) },
        { label: "Align Right", action: () => onUpdateBox?.(box.id, { textAlign: "right" }) },
      ]
    },
    {
      id: "size", label: "Font size", group: "Typography",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4v16M14 8v12M18 12v8M10 4v16M2 8v12" /></svg>,
      action: () => onUpdateBox?.(box.id, { boxFontSize: 16 }),
      subOptions: [
        { label: "Very Small (10)", action: () => onUpdateBox?.(box.id, { boxFontSize: 10 }) },
        { label: "Small (12)", action: () => onUpdateBox?.(box.id, { boxFontSize: 12 }) },
        { label: "Normal (14)", action: () => onUpdateBox?.(box.id, { boxFontSize: 14 }) },
        { label: "Medium (16)", action: () => onUpdateBox?.(box.id, { boxFontSize: 16 }) },
        { label: "Large (20)", action: () => onUpdateBox?.(box.id, { boxFontSize: 20 }) },
        { label: "Extra Large (24)", action: () => onUpdateBox?.(box.id, { boxFontSize: 24 }) },
        { label: "Headline (32)", action: () => onUpdateBox?.(box.id, { boxFontSize: 32 }) },
      ]
    },
    {
      id: "outline", label: "Outline weight", group: "Style",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>,
      action: () => onUpdateBox?.(box.id, { boxOutlineWidth: 1 }),
      subOptions: [
        { label: "No outline (0px)", action: () => onUpdateBox?.(box.id, { boxOutlineWidth: 0 }) },
        { label: "Hairline (1px)", action: () => onUpdateBox?.(box.id, { boxOutlineWidth: 1 }) },
        { label: "Medium (2px)", action: () => onUpdateBox?.(box.id, { boxOutlineWidth: 2 }) },
        { label: "Bold (4px)", action: () => onUpdateBox?.(box.id, { boxOutlineWidth: 4 }) },
      ]
    },
    {
      id: "fill", label: "Fill color", group: "Style",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 11H5" /><path d="M12 5l7 7-7 7" /></svg>,
      action: () => onUpdateBox?.(box.id, { boxHighlightColor: "#fdf6e3" }),
      subOptions: [
        { label: "Transparent", swatch: "transparent", action: () => onUpdateBox?.(box.id, { boxHighlightColor: "transparent" }) },
        { label: "Clean Paper", swatch: "#fdf6e3", action: () => onUpdateBox?.(box.id, { boxHighlightColor: "#fdf6e3" }) },
        { label: "Yellow Tint", swatch: "#fef08a", action: () => onUpdateBox?.(box.id, { boxHighlightColor: "#fef08a" }) },
        { label: "Green Tint", swatch: "#bbf7d0", action: () => onUpdateBox?.(box.id, { boxHighlightColor: "#bbf7d0" }) },
        { label: "Blue Tint", swatch: "#bae6fd", action: () => onUpdateBox?.(box.id, { boxHighlightColor: "#bae6fd" }) },
        { label: "Pink Tint", swatch: "#fce7f3", action: () => onUpdateBox?.(box.id, { boxHighlightColor: "#fce7f3" }) },
      ]
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
      if (openSubmenuId) { if (e.key === "Escape") { e.stopPropagation(); setOpenSubmenuId(null) }; return }
      if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setActiveIdx(i => Math.min((i ?? -1) + 1, filtered.length - 1)) }
      else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setActiveIdx(i => Math.max((i ?? -1) - 1, 0)) }
      else if (e.key === "Enter") {
        e.preventDefault(); e.stopPropagation(); 
        if (activeIdx !== null && filtered[activeIdx]) {
          const item = filtered[activeIdx];
          if (item.subOptions || item.customContent) {
            setOpenSubmenuId(item.id)
          } else {
            onSelect(item.action)
          }
        }
      }
      else if (e.key === "Escape" || e.key === "Tab") { if (filtered.length > 0) e.stopPropagation(); onClose() }
    }
    document.addEventListener("keydown", handler, true)
    return () => document.removeEventListener("keydown", handler, true)
  }, [activeIdx, filtered, onSelect, onClose, openSubmenuId])

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

  const menuHeight = Math.min(filtered.length * 32 + 60, 320)
  const adjustedY = y + menuHeight > window.innerHeight - 20 ? y - menuHeight - 24 : y

  const isLight = mode === "/"

  return (
    <div
      ref={ref}
      onMouseLeave={() => setActiveIdx(null)}
      style={{
        position: "fixed", left: Math.max(8, x), top: adjustedY, zIndex: 9999,
        background: isLight ? "rgba(255,255,255,0.97)" : "rgba(12,12,14,0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 5,
        width: 220,
        boxShadow: isLight
          ? "0 8px 32px -8px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)"
          : "0 20px 60px -12px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)",
        animation: "slide-up-fade 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflow: "hidden",
      }}
    >
      <div
        className="hide-scroll"
        onScroll={() => setOpenSubmenuId(null)}
        style={{ maxHeight: 320, overflowY: "auto", overscrollBehavior: "contain" }}
      >
        <style dangerouslySetInnerHTML={{ __html: `.hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }` }} />
        <div style={{ padding: "4px 0" }}>
          <div style={{
            padding: "10px 14px 4px",
            fontSize: 9,
            fontWeight: 700,
            color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}>
            {mode === "/" ? "text box presets" : "inline options"}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: "8px 12px", fontSize: 11, color: isLight ? "#a1a1aa" : "#52525b" }}>No results</div>
          ) : (
            groups.map((group, gIdx) => (
              <div key={group.label}>
                {gIdx > 0 && (
                  <div style={{ height: 1, margin: "3px 10px", background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)" }} />
                )}
                <div style={{
                  padding: "6px 12px 2px",
                  fontSize: 9,
                  fontWeight: 700,
                  color: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.28)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}>
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const actualIdx = filtered.indexOf(item)
                  const isActive = activeIdx === actualIdx
                  const hasSubmenu = !!item.subOptions?.length || !!item.customContent
                  const submenuOpen = openSubmenuId === item.id

                  return (
                    <div
                      key={item.id}
                      ref={el => {
                        if (isActive) (activeRef as any).current = el
                        if (submenuOpen) (submenuRowRef as any).current = el
                      }}
                      onMouseEnter={() => setActiveIdx(actualIdx)}
                      onClick={(e) => {
                        if (hasSubmenu) {
                          e.stopPropagation()
                          setOpenSubmenuId(submenuOpen ? null : item.id)
                        } else {
                          onSelect(item.action)
                        }
                      }}
                      style={{
                        padding: "5px 10px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        background: isActive
                          ? (isLight ? "rgba(184,94,34,0.06)" : "rgba(184,94,34,0.1)")
                          : "transparent",
                        transition: "background 0.08s ease",
                        userSelect: "none",
                      }}
                    >
                      <OIcon isActive={isActive} mode={mode}>{item.icon}</OIcon>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 11.5,
                          fontWeight: 500,
                          color: isLight ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.88)",
                          lineHeight: "1.2",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {item.label}
                        </div>
                      </div>

                      {/* Right side: either submenu chevron OR shortcut */}
                      {hasSubmenu ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)"} strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      ) : item.shortcut ? (
                        <div style={{
                          fontSize: 9.5,
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)",
                          color: isLight ? "rgba(0,0,0,0.38)" : "rgba(255,255,255,0.3)",
                          fontFamily: "monospace",
                          flexShrink: 0,
                        }}>
                          {item.shortcut}
                        </div>
                      ) : null}

                      {/* Render submenu flyout inline (portalled visually via fixed positioning) */}
                      {submenuOpen && item.subOptions && (
                        <Submenu
                          options={item.subOptions}
                          onSelect={onSelect}
                          onClose={() => setOpenSubmenuId(null)}
                          mode={mode}
                          parentRef={submenuRowRef}
                        />
                      )}
                      
                      {submenuOpen && item.customContent && (
                        <CustomMenuFlyout parentRef={submenuRowRef} mode={mode}>
                          {item.customContent}
                        </CustomMenuFlyout>
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
