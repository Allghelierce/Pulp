import { useState, useEffect, useRef, memo, useMemo } from "react"
import { createPortal } from "react-dom"
import { format } from "date-fns"
import katex from "katex"
import { DatetimePicker } from "@/components/ui/datetime-picker"
import type { TextBox } from "@/app/types"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SubOption {
  label: string
  swatch?: string       // css color for color swatches
  fontPreview?: string  // css font-family for font previews
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
  box?: TextBox
  onUpdateBox?: (id: string, updates: Partial<TextBox>) => void
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
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (parentRef.current && ref.current) {
      const pr = parentRef.current.getBoundingClientRect()
      const rh = ref.current.getBoundingClientRect()
      let t = pr.top
      if (t + rh.height > window.innerHeight - 8) t = window.innerHeight - rh.height - 8
      setCoords({ top: t, left: pr.right + 8 })
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node) && !parentRef.current?.contains(e.target as Node)) onClose()
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      if (!ref.current || !parentRef.current) return
      const submenuRect = ref.current.getBoundingClientRect()
      const parentRect = parentRef.current.getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY
      const gap = 20
      const inSubmenu = x >= submenuRect.left && x <= submenuRect.right && y >= submenuRect.top && y <= submenuRect.bottom
      const inParent = x >= parentRect.left && x <= parentRect.right && y >= parentRect.top && y <= parentRect.bottom
      const inGap = x >= parentRect.right && x <= submenuRect.left + gap && y >= Math.min(parentRect.top, submenuRect.top) && y <= Math.max(parentRect.bottom, submenuRect.bottom)
      if (!inSubmenu && !inParent && !inGap) {
        closeTimeoutRef.current = setTimeout(() => onClose(), 100)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    return () => {
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mousemove", handleMouseMove)
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [onClose, parentRef])

  const isLight = mode === "/"

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: coords.left,
        top: coords.top,
        zIndex: 10000,
        minWidth: 180,
        background: isLight ? "rgba(255,255,255,0.85)" : "rgba(20,20,22,0.82)",
        backdropFilter: "blur(40px) saturate(150%)",
        WebkitBackdropFilter: "blur(40px) saturate(150%)",
        border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        boxShadow: isLight
          ? "0 12px 40px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(255,255,255,0.5)"
          : "0 24px 80px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.05)",
        padding: "6px 0",
        animation: "slash-pop 0.2s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {options.map((opt) => (
        <div
          key={opt.label}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); opt.action(); onSelect(() => { }); onClose() }}
          style={{
            padding: "6px 12px",
            margin: "0 5px",
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            fontSize: 11.5,
            fontWeight: 500,
            color: isLight ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.85)",
            transition: "all 0.1s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.05)"
            e.currentTarget.style.color = isLight ? "#000" : "#fff"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.color = isLight ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.85)"
          }}
        >
          {opt.swatch && (
            <div style={{
              width: 13, height: 13, borderRadius: 4, flexShrink: 0,
              background: opt.swatch,
              border: opt.swatch === "transparent" ? "1px solid rgba(150,150,150,0.4)" : `1px solid ${opt.swatch}88`,
              backgroundImage: opt.swatch === "transparent"
                ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='2' height='2' fill='%23ccc'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23ccc'/%3E%3C/svg%3E")`
                : undefined,
            }} />
          )}
          <span style={opt.fontPreview ? { fontFamily: opt.fontPreview } : {}}>
            {opt.label}
          </span>
        </div>
      ))}
    </div>,
    document.body
  )
}

// ─── Custom Flyout Wrapper ──────────────────────────────────────────────────

function CustomMenuFlyout({ children, parentRef, mode }: { children: React.ReactNode, parentRef: React.RefObject<HTMLDivElement | null>, mode: "@" | "/" }) {
  const ref = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (parentRef.current && ref.current) {
      const pr = parentRef.current.getBoundingClientRect()
      const rh = ref.current.getBoundingClientRect()
      let t = pr.top
      if (t + rh.height > window.innerHeight - 8) t = window.innerHeight - rh.height - 8
      setCoords({ top: t, left: pr.right + 8 })
    }
  }, [parentRef, children])

  const isLight = mode === "/"

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: coords.left,
        top: coords.top,
        zIndex: 10000,
        background: isLight ? "rgba(255,255,255,0.85)" : "rgba(20,20,22,0.82)",
        backdropFilter: "blur(40px) saturate(150%)",
        WebkitBackdropFilter: "blur(40px) saturate(150%)",
        border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        boxShadow: isLight
          ? "0 12px 40px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(255,255,255,0.5)"
          : "0 24px 80px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.05)",
        animation: "slash-pop 0.2s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        overflow: "hidden",
      }}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  )
}

// ─── Block helpers ─────────────────────────────────────────────────────────────

function makeTable(rows: number, cols: number): string {
  const headerRow = `<tr>${Array.from({ length: cols }, () => `<th contenteditable="true" style="border:1.5px solid rgba(0,0,0,0.4);padding:8px 12px;background:none;font-size:13px;font-weight:600;min-width:100px;outline:none;text-align:left;"><br></th>`).join("")}</tr>`
  const bodyRows = Array.from({ length: rows - 1 }, () =>
    `<tr>${Array.from({ length: cols }, () => `<td contenteditable="true" style="border:1.5px solid rgba(0,0,0,0.4);padding:8px 12px;font-size:13px;min-width:100px;outline:none;"></td>`).join("")}</tr>`
  ).join("")
  return `<table style="border-collapse:collapse;margin:12px 0;width:100%;filter:url(#handwritten-jitter-subtle);">${headerRow}${bodyRows}</table><br/>`
}

function makeColumns(num: number): string {
  const cols = Array.from({ length: num }, (_, i) => {
    const isLast = i === num - 1;
    return `
      <div contenteditable="true" style="flex:1;min-height:60px;padding:8px 16px;font-size:inherit;font-family:inherit;outline:none;"></div>
      ${isLast ? '' : '<div style="width:2px;background:rgba(0,0,0,0.3);margin:12px 4px;filter:url(#handwritten-jitter-subtle);"></div>'}
    `
  }).join("")
  return `<div contenteditable="false" style="display:flex;gap:4px;margin:12px 0">${cols}</div><br/>`
}

function makeTOC(): string {
  const headers = Array.from(document.querySelectorAll("[contenteditable]:not([data-box-style]) h1"))
  if (headers.length === 0) return `<div contenteditable="false" style="border:1px solid #e4e4e7;border-radius:6px;padding:16px;margin:8px 0;background:#fafafa"><div style="font-family:'Caveat',cursive;font-size:20px;font-weight:700;color:#5a4a3a;margin-bottom:12px">Table of Contents</div><div style="color:#999;font-size:13px;font-style:italic">none</div></div><br/>`
  const items = headers.map(h => {
    return `<div style="padding:6px 0;font-family:'Caveat',cursive;font-size:16px;color:#374151">${(h.textContent || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`
  }).join("")
  return `<div contenteditable="false" style="border:1px solid #e4e4e7;border-radius:6px;padding:16px;margin:8px 0;background:#fafafa"><div style="font-family:'Caveat',cursive;font-size:20px;font-weight:700;color:#5a4a3a;margin-bottom:12px">Table of Contents</div>${items}</div><br/>`
}

const CODE_BLOCK_HTML = `<div class="pulp-code-block" contenteditable="false" style="margin:8px 0;border-radius:8px;overflow:hidden;font-family:'Courier New',monospace;background:#1e1e2e"><div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#16161e;border-bottom:1px solid rgba(255,255,255,0.08)"><span style="font-size:10px;color:#6c7086;font-family:-apple-system,sans-serif">Code</span><button onclick="const pre=this.closest('.pulp-code-block').querySelector('pre');navigator.clipboard.writeText(pre.textContent||'');this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1500)" style="font-size:10px;color:#cdd6f4;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:4px;padding:2px 8px;cursor:pointer;font-family:-apple-system,sans-serif">Copy</button></div><pre contenteditable="true" spellcheck="false" style="margin:0;padding:14px 16px;color:#cdd6f4;font-size:12.5px;line-height:1.6;outline:none;white-space:pre-wrap;min-height:2.5em">// Your code here</pre></div><br/>`

// ─── Table Grid Picker ──────────────────────────────────────────────────────

function TableGridPicker({ onInsert, onClose }: { onInsert: (html: string, cols: number) => void; onClose: () => void }) {
  const [hover, setHover] = useState<[number, number]>([0, 0])
  const ROWS = 5, COLS = 5
  return (
    <div style={{ padding: 12 }} onMouseLeave={() => setHover([0, 0])}>
      <div style={{ fontSize: 11, color: "rgba(0,0,0,0.5)", marginBottom: 8, textAlign: "center" }}>
        {hover[0] > 0 ? `${hover[1]} × ${hover[0]} table` : "Select table size"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 20px)`, gap: 3, justifyContent: "center" }}>
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const r = Math.floor(i / COLS) + 1
          const c = (i % COLS) + 1
          const active = r <= hover[0] && c <= hover[1]
          return (
            <div
              key={i}
              onMouseEnter={() => setHover([r, c])}
              onClick={() => { onInsert(makeTable(r, c), c); onClose() }}
              style={{
                width: 20, height: 20, borderRadius: 2, cursor: "pointer",
                background: active ? "rgba(184,94,34,0.5)" : "rgba(184,94,34,0.15)",
                border: active ? "1.5px solid rgba(184,94,34,0.8)" : "1px solid rgba(184,94,34,0.3)",
                transition: "all 0.05s",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Media Input ──────────────────────────────────────────────────────────────

function MediaInput({ onInsert, onUpload, onClose }: { onInsert: (html: string) => void; onUpload?: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<"upload" | "link">("upload")
  const [url, setUrl] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => { if (tab === "link") setTimeout(() => inputRef.current?.focus(), 50) }, [tab])

  const handleInsert = () => {
    if (!url.trim()) return
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
    const vmMatch = url.match(/vimeo\.com\/(\d+)/)
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i)
    
    let html = ""
    if (ytMatch) {
      const embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
      html = `<div contenteditable="false" style="margin:8px 0;border-radius:8px;overflow:hidden;aspect-ratio:16/9;max-width:560px"><iframe src="${embedUrl}" style="width:100%;height:100%;border:none" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div><br/>`
    } else if (vmMatch) {
      const embedUrl = `https://player.vimeo.com/video/${vmMatch[1]}`
      html = `<div contenteditable="false" style="margin:8px 0;border-radius:8px;overflow:hidden;aspect-ratio:16/9;max-width:560px"><iframe src="${embedUrl}" style="width:100%;height:100%;border:none" allowfullscreen></iframe></div><br/>`
    } else if (isImage) {
      html = `<img src="${url.trim()}" style="max-width:100%;margin:8px 0;border-radius:8px;display:block" /><br/>`
    } else {
      html = `<video src="${url.trim()}" controls style="max-width:100%;margin:8px 0;border-radius:8px;display:block"></video><br/>`
    }
    onInsert(html)
    onClose()
  }

  return (
    <div style={{ padding: 12, width: 280 }}>
      <div style={{ display: "flex", gap: 16, borderBottom: "1px solid rgba(0,0,0,0.1)", marginBottom: 12 }}>
        <button 
          onClick={() => setTab("upload")} 
          style={{ background: "none", border: "none", padding: "0 0 6px 0", fontSize: 13, fontWeight: tab === "upload" ? 600 : 400, color: tab === "upload" ? "#111" : "#777", borderBottom: tab === "upload" ? "2px solid #111" : "2px solid transparent", cursor: "pointer", transform: "translateY(1px)" }}
        >Upload</button>
        <button 
          onClick={() => setTab("link")} 
          style={{ background: "none", border: "none", padding: "0 0 6px 0", fontSize: 13, fontWeight: tab === "link" ? 600 : 400, color: tab === "link" ? "#111" : "#777", borderBottom: tab === "link" ? "2px solid #111" : "2px solid transparent", cursor: "pointer", transform: "translateY(1px)" }}
        >Link</button>
      </div>

      {tab === "upload" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => { onUpload?.(); onClose(); }} style={{ width: "100%", padding: "8px 0", background: "white", color: "#111", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Choose File
          </button>
          <div style={{ fontSize: 10, color: "#888", textAlign: "center", fontStyle: "italic", marginTop: 2 }}>Accepts Images, Videos & GIFs</div>
        </div>
      )}

      {tab === "link" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            ref={inputRef}
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleInsert(); if (e.key === "Escape") onClose() }}
            placeholder="Paste Link (Image, Video, YouTube)"
            style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.15)", outline: "none", boxSizing: "border-box" }}
          />
          <button onClick={handleInsert} style={{ width: "100%", padding: "6px 0", background: "#b85e22", color: "white", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Embed Link
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Equation Input ───────────────────────────────────────────────────────────

function EquationInput({ onInsert, onClose }: { onInsert: (html: string) => void; onClose: () => void }) {
  const [latex, setLatex] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { setTimeout(() => textareaRef.current?.focus(), 50) }, [])

  const renderedLatex = useMemo(() => {
    if (!latex.trim()) return ""
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: true })
    } catch {
      return latex.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    }
  }, [latex])

  const handleInsert = () => {
    if (!latex.trim()) return
    const html = `<div contenteditable="false" style="margin:16px auto;text-align:center;padding:12px 24px;border-radius:6px;color:#1a1a2e;display:block">${renderedLatex}</div><br/>`
    onInsert(html)
    onClose()
  }

  return (
    <div style={{ padding: 12, width: 340 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.6)", marginBottom: 8 }}>Equation (LaTeX)</div>
      <textarea
        ref={textareaRef}
        value={latex}
        onChange={e => setLatex(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && e.metaKey) { e.preventDefault(); handleInsert() }; if (e.key === "Escape") onClose() }}
        placeholder="e.g. E = mc^2"
        rows={3}
        style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.15)", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "monospace", marginBottom: 8 }}
      />
      {latex.trim() && (
        <div style={{ padding: "8px 10px", background: "#fdfdfd", border: "1px solid #e4e4e7", borderRadius: 4, marginBottom: 8, color: "#1a1a2e", overflowX: "auto" }} dangerouslySetInnerHTML={{ __html: renderedLatex }} />
      )}
      <button onClick={handleInsert} style={{ width: "100%", padding: "5px 0", background: "#b85e22", color: "white", border: "none", borderRadius: 4, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
        Insert (⌘↵)
      </button>
    </div>
  )
}

// ─── Bookmark Input ───────────────────────────────────────────────────────────

function BookmarkInput({ onInsert, onClose, mode }: { onInsert: (html: string) => void; onClose: () => void; mode: "@" | "/" }) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50) }, [])
  const isLight = mode === "/"

  const handleFetch = async () => {
    if (!url.trim()) return
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/bookmark?url=${encodeURIComponent(url.trim())}`)
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      const { title, description, image, domain } = data
      const safeUrl = url.trim().replace(/'/g, "\\'")
      const safeTitle = (title || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      const safeDesc = (description || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      const safeDomain = (domain || url).replace(/</g, "&lt;").replace(/>/g, "&gt;")
      const imgHtml = image ? `<img src="${image}" style="width:72px;height:60px;object-fit:cover;border-radius:4px;flex-shrink:0" />` : ""
      const html = `<div contenteditable="false" onclick="window.open('${safeUrl}','_blank')" style="display:flex;gap:12px;border:1px solid #e4e4e7;border-radius:8px;padding:12px 14px;margin:8px 0;background:#fafafa;max-width:480px;cursor:pointer"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${safeTitle}</div><div style="font-size:11px;color:#666;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${safeDesc}</div><div style="font-size:10px;color:#9ca3af">${safeDomain}</div></div>${imgHtml}</div><br/>`
      onInsert(html)
      onClose()
    } catch {
      setError("Failed to fetch URL")
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 12, width: 260 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)", marginBottom: 8 }}>Web Bookmark</div>
      <input
        ref={inputRef}
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleFetch(); if (e.key === "Escape") onClose() }}
        placeholder="Paste a URL..."
        style={{ width: "100%", fontSize: 12, padding: "6px 8px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.15)", outline: "none", boxSizing: "border-box", marginBottom: 8, background: isLight ? "#fff" : "rgba(255,255,255,0.08)", color: isLight ? "#111" : "#eee" }}
      />
      {error && <div style={{ fontSize: 10.5, color: "#ef4444", marginBottom: 6 }}>{error}</div>}
      <button onClick={handleFetch} disabled={loading} style={{ width: "100%", padding: "5px 0", background: loading ? "#d4a87a" : "#b85e22", color: "white", border: "none", borderRadius: 4, fontSize: 11.5, fontWeight: 600, cursor: loading ? "default" : "pointer" }}>
        {loading ? "Fetching…" : "Fetch & Insert"}
      </button>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export const SlashMenu = memo(function SlashMenu({
  x, y, filter, accent, isSelectionMode, onSelect, onClose, execCmd, insertHTML,
  toggleScript: _toggleScript, insertBacklink, onInsertImage, mode, box, onUpdateBox
}: SlashMenuProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(0)
  const [prevFilter, setPrevFilter] = useState(filter)
  if (filter !== prevFilter) {
    setPrevFilter(filter)
    setActiveIdx(0)
  }
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const submenuRowRef = useRef<HTMLDivElement | null>(null)

  // ── @ menu items ──────────────────────────────────────────────────────────
  const allItems: SlashItem[] = useMemo(() => [
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
      action: () => insertHTML(`<blockquote style="border-left:4px solid ${accent};padding:8px 16px;margin:8px 0;color:#666;font-style:italic;background:#f5f5f5;border-radius:0 8px 8px 0" contenteditable="true">Quote…</blockquote><br/>`)
    },
    {
      id: "divider", label: "Separator", shortcut: "---", group: "Structure",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>,
      action: () => insertHTML('<div style="height:2px;background:#1a1a1a;margin:12px 0;display:block;filter:url(#handwritten-jitter);">&#8203;</div><br>')
    },
    {
      id: "backlink", label: "Create Backlink", shortcut: "@", group: "Reference",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>,
      action: () => insertBacklink()
    },
    {
      id: "media", label: "Image / Video / GIF", group: "Media",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
      action: () => { },
      customContent: <MediaInput onInsert={(html) => { onSelect(() => insertHTML(html)) }} onUpload={() => onInsertImage?.()} onClose={onClose} />
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
      action: () => { },
      customContent: <CustomDateWrapper onInsert={(str) => {
        onSelect(() => insertHTML(`<span>${str}</span>`))
      }} onClose={onClose} mode={mode} />
    },
    {
      id: "table", label: "Table", group: "Blocks",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>,
      action: () => { },
      customContent: <TableGridPicker onInsert={(html, cols) => {
        onSelect(() => {
          insertHTML(html)
          if (box && onUpdateBox) {
            const requiredW = (cols * 100) + 48
            if ((box.w || 0) < requiredW) {
              onUpdateBox(box.id, { w: requiredW })
            }
          }
        })
      }} onClose={onClose} />
    },
    {
      id: "equation", label: "Equation", group: "Blocks",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M3 12h12M3 18h9" /></svg>,
      action: () => { },
      customContent: <EquationInput onInsert={(html) => { onSelect(() => insertHTML(html)) }} onClose={onClose} />
    },
    {
      id: "columns", label: "Columns", group: "Blocks",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="18" rx="1" /></svg>,
      action: () => onSelect(() => {
        insertHTML(makeColumns(2))
        if (box && onUpdateBox && (box.w || 0) < 280) onUpdateBox(box.id, { w: 280 })
      }),
      subOptions: [
        { label: "2 Columns", action: () => onSelect(() => { insertHTML(makeColumns(2)); if (box && onUpdateBox && (box.w || 0) < 280) onUpdateBox(box.id, { w: 280 }) }) },
        { label: "3 Columns", action: () => onSelect(() => { insertHTML(makeColumns(3)); if (box && onUpdateBox && (box.w || 0) < 400) onUpdateBox(box.id, { w: 400 }) }) },
        { label: "4 Columns", action: () => onSelect(() => { insertHTML(makeColumns(4)); if (box && onUpdateBox && (box.w || 0) < 520) onUpdateBox(box.id, { w: 520 }) }) },
      ]
    },
    {
      id: "toc", label: "Table of Contents", group: "Blocks",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="21" y2="12" /><line x1="9" y1="18" x2="21" y2="18" /></svg>,
      action: () => onSelect(() => insertHTML(makeTOC()))
    },
    {
      id: "code", label: "Code Block", group: "Blocks",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
      action: () => onSelect(() => insertHTML(CODE_BLOCK_HTML))
    },
    {
      id: "bookmark", label: "Web Bookmark", group: "Blocks",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
      action: () => { },
      customContent: <BookmarkInput onInsert={(html) => { onSelect(() => insertHTML(html)) }} onClose={onClose} mode={mode} />
    },
  ], [execCmd, insertHTML, accent, insertBacklink, onInsertImage, onSelect, onClose, mode, box, onUpdateBox])

  // ── / menu items ──────────────────────────────────────────────────────────
  const settingsItems: SlashItem[] = useMemo(() => box ? [
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
        { label: "garamond (elegant)", fontPreview: "'EB Garamond', serif", action: () => onUpdateBox?.(box.id, { boxFontFamily: "" }) },
        { label: "georgia (modern)", fontPreview: "Georgia, serif", action: () => onUpdateBox?.(box.id, { boxFontFamily: "Georgia, serif" }) },
        { label: "arial (clean)", fontPreview: "Arial, sans-serif", action: () => onUpdateBox?.(box.id, { boxFontFamily: "Arial, sans-serif" }) },
        { label: "monospace (code)", fontPreview: '"Courier New", monospace', action: () => onUpdateBox?.(box.id, { boxFontFamily: '"Courier New", monospace' }) },
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
      action: () => onUpdateBox?.(box.id, { boxHighlightColor: "rgba(234,179,8,0.15)" }),
      customContent: (
        <div style={{ width: 140, padding: "10px 8px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {[
              "transparent",
              "rgba(239,68,68,0.15)",
              "rgba(249,115,22,0.15)",
              "rgba(234,179,8,0.15)",
              "rgba(34,197,94,0.15)",
              "rgba(14,165,233,0.15)",
              "rgba(59,130,246,0.15)",
              "rgba(168,85,247,0.15)",
              "rgba(236,72,153,0.15)",
              "rgba(156,163,175,0.15)"
            ].map(c => (
              <button
                key={c}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateBox?.(box.id, { boxHighlightColor: c }); setOpenSubmenuId(null) }}
                style={{
                  width: 20, height: 20, borderRadius: 4, cursor: "pointer", padding: 0,
                  background: c === "transparent" ? "none" : c,
                  border: c === "transparent" ? "1px solid rgba(150,150,150,0.3)" : `1px solid ${c.replace("0.15)", "0.45)")}`
                }}
                title={c === "transparent" ? "None" : "Tint"}
              >
                {c === "transparent" && <div style={{ width: "100%", height: 1, background: "rgba(150,150,150,0.4)", transform: "rotate(45deg)" }} />}
              </button>
            ))}
          </div>
        </div>
      )
    },
  ] : [], [box, onUpdateBox])
  
  const combinedItems = box ? [...allItems, ...settingsItems] : allItems

  const itemsToDisplay = useMemo(() => isSelectionMode
      ? combinedItems.filter(item => item.group === "Typography" || item.group === "Reference")
      : combinedItems, [combinedItems, isSelectionMode])

  const filtered = useMemo(() => filter
    ? itemsToDisplay.filter(item => item.label.toLowerCase().includes(filter.toLowerCase()))
    : itemsToDisplay, [filter, itemsToDisplay])


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
    const resizer = () => onClose()
    document.addEventListener("mousedown", handler)
    window.addEventListener("resize", resizer)
    return () => {
      document.removeEventListener("mousedown", handler)
      window.removeEventListener("resize", resizer)
    }
  }, [onClose])

  const groups = useMemo(() => {
    const g: { label: string; items: SlashItem[] }[] = []
    for (const item of filtered) {
      const existing = g.find(ex => ex.label === item.group)
      if (existing) existing.items.push(item)
      else g.push({ label: item.group, items: [item] })
    }
    return g
  }, [filtered])

  const menuHeight = filtered.length * 32 + (groups.length * 20) + 12
  const finalHeight = Math.min(menuHeight, 340)
  const adjustedY = y + finalHeight > window.innerHeight - 20 ? y - finalHeight - 24 : y
  
  // Ensure menu doesn't go off right side
  const adjustedX = x + 220 > window.innerWidth - 20 ? window.innerWidth - 240 : Math.max(8, x)

  const isLight = mode === "/"

  return (
    <div
      ref={ref}
      onMouseLeave={() => setActiveIdx(null)}
      className="slash-menu-root"
      style={{
        position: "fixed", 
        left: adjustedX, 
        top: adjustedY, 
        zIndex: 9999,
        background: isLight ? "rgba(255,255,255,0.85)" : "rgba(20,20,22,0.82)",
        backdropFilter: "blur(40px) saturate(150%)",
        WebkitBackdropFilter: "blur(40px) saturate(150%)",
        border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        width: 230,
        boxShadow: isLight
          ? "0 12px 40px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(255,255,255,0.5)"
          : "0 24px 80px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.05)",
        animation: "slash-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflow: "hidden",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slash-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .slash-item-active { background: ${isLight ? "rgba(184,94,34,0.08)" : "rgba(184,94,34,0.12)"} !important; }
      ` }} />
      <div
        className="hide-scroll"
        onScroll={() => setOpenSubmenuId(null)}
        style={{ maxHeight: 340, overflowY: "auto", overscrollBehavior: "contain" }}
      >
        <div style={{ padding: "6px 0" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "12px 16px", fontSize: 11, color: isLight ? "#a1a1aa" : "#52525b", textAlign: "center" }}>No results matching "{filter}"</div>
          ) : (
            groups.map((group, gIdx) => (
              <div key={group.label}>
                {gIdx > 0 && (
                  <div style={{ height: 1, margin: "4px 8px", background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)" }} />
                )}
                <div style={{
                  padding: "8px 14px 4px",
                  fontSize: 9,
                  fontWeight: 800,
                  color: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.25)",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
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
                      onMouseEnter={() => {
                        setActiveIdx(actualIdx)
                        if (hasSubmenu) setOpenSubmenuId(item.id)
                      }}
                      onMouseLeave={() => {
                        // Don't close immediately; let the Submenu component handle closing
                        // via its pointer tracking to prevent closing when cursor moves to the gap
                      }}
                      onMouseDown={(e) => {
                        // Prevent focus loss from editor
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        if (!hasSubmenu) {
                          e.stopPropagation()
                          onSelect(item.action)
                        }
                      }}
                      style={{
                        padding: "6px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        background: isActive
                          ? (isLight ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.06)")
                          : "transparent",
                        transition: "all 0.1s ease",
                        userSelect: "none",
                      }}
                      className={isActive ? "slash-item-active" : ""}
                    >
                      <OIcon isActive={isActive} mode={mode}>{item.icon}</OIcon>
 
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: isLight ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.92)",
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
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"} strokeWidth="3" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      ) : item.shortcut ? (
                        <div style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "1.5px 6px",
                          borderRadius: 6,
                          background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)",
                          color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
                          fontFamily: "var(--font-sf-mono), monospace",
                          opacity: isActive ? 1 : 0.6,
                          flexShrink: 0,
                        }}>
                          {item.shortcut.replace("⌘", "⌘ ")}
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
