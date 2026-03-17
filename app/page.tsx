"use client"
import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import type { TextBox as TextBoxType, NoteData, FolderData, DialogConfig } from "@/app/types"
import { uid } from "@/app/lib/uid"
import { getPaperBg } from "@/app/lib/paperStyle"
import { useEditor } from "@/app/hooks/useEditor"
import { useBoxDrawing } from "@/app/hooks/useBoxDrawing"
import { useDrawing } from "@/app/hooks/useDrawing"
import { AppDialog } from "@/app/components/AppDialog"
import { SettingsView } from "@/app/components/settings/SettingsView"
import { Sidebar } from "@/app/components/Sidebar"
import { DocumentToolbar } from "@/app/components/DocumentToolbar"
import { FloatingToolbar } from "@/app/components/FloatingToolbar"
import { RightToolbar } from "@/app/components/RightToolbar"
import { RightSidebar } from "@/app/components/RightSidebar"
import { GridView } from "@/app/components/GridView"
import { SlashMenu } from "@/app/components/SlashMenu"

// ─── Memoized global styles — prevents font flickering on every NoteApp re-render 
const GlobalStyles = memo(function GlobalStyles({ reduceMotion, theme }: { reduceMotion: boolean, theme: "light" | "dark" }) {
  return (<>
    <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Bilbo&family=Licorice&family=Original+Surfer&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');${reduceMotion ? "*, *::before, *::after { transition: none !important; animation: none !important; }" : ""} .ls-toolbar { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; letter-spacing: -0.01em; }` }} />
    {theme === "dark" && <style dangerouslySetInnerHTML={{ __html: `.ls-toolbar { background-color: rgba(18,18,20,0.85) !important; border-color: rgba(255,255,255,0.08) !important; box-shadow: 0 4px 32px rgba(0,0,0,0.5) !important; backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; } .ls-toolbar .hover\\:bg-zinc-200, .ls-toolbar .hover\\:bg-zinc-100 { color: #A1A1AA !important; background-color: transparent !important; border-color: transparent !important; box-shadow: none !important; } .ls-toolbar .hover\\:bg-zinc-200:hover, .ls-toolbar .hover\\:bg-zinc-100:hover { background-color: rgba(255,255,255,0.08) !important; color: #FAFAFA !important; } .ls-toolbar select, .ls-toolbar input { background-color: rgba(255,255,255,0.05) !important; color: #FAFAFA !important; border-color: rgba(255,255,255,0.08) !important; } .ls-toolbar .text-zinc-600 { color: #A1A1AA !important; } .ls-toolbar .border-zinc-200, .ls-toolbar .border-zinc-200\\/80 { border-color: rgba(255,255,255,0.08) !important; } .ls-toolbar .bg-white, .ls-toolbar .bg-zinc-50 { background-color: transparent !important; }` }} />}
  </>)
})

function htmlToPlain(html: string): string {
  return html.replace(/<br\s*\/?>\n/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
}

// ─── Memoized spiral binding — NEVER re-renders during box operations ──────────
const SpiralBinding = memo(function SpiralBinding({ theme, showBinding, bindingCompact }: {
  theme: "light" | "dark"; showBinding: boolean; bindingCompact: boolean
}) {
  if (!showBinding) return null
  if (!bindingCompact) return (
    <div className="absolute left-[-24px] top-0 bottom-0 w-16 z-30 pointer-events-none flex flex-col justify-center overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="relative w-full h-[32px]">
          <div className="absolute left-[34px] top-2 w-4 h-5 rounded-sm bg-[#d7d2d0] shadow-[inset_2px_3px_5px_rgba(0,0,0,0.6)] border border-zinc-200" />
          <div className="absolute left-[12px] top-[14px] w-[28px] h-[10px] border-b-[3px] border-[#8B6914] rounded-full opacity-40 blur-[0.5px]" />
          <div className="absolute left-0 top-[10px] w-[42px] h-[15px] border-y-[3.5px] border-r-[3.5px] border-[#D4AF37] rounded-r-full shadow-[3px_4px_6px_rgba(0,0,0,0.3)] z-10" style={{ borderColor: '#A67C00 #D4AF37 #8B6914 #D4AF37' }} />
          <div className="absolute left-[2px] top-[11px] w-[38px] h-[10px] border-y-[1px] border-r-[1.5px] border-[#FFF3A3] rounded-r-full z-20 opacity-50" />
          <div className="absolute left-[38px] top-[18px] w-[10px] h-[2px] bg-black/10 blur-[2px] z-0" />
        </div>
      ))}
    </div>
  )
  return (
    <div className="absolute top-[-28px] left-0 right-0 h-16 z-30 pointer-events-none flex flex-row pl-[32px]">
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="relative h-full w-[32px]">
          <div className="absolute left-2 top-[34px] w-5 h-4 rounded-sm bg-[#d7d2d0] shadow-[inset_2px_3px_5px_rgba(0,0,0,0.6)] border border-zinc-200" />
          <div className="absolute left-[14px] top-[12px] w-[10px] h-[28px] border-r-[3px] border-[#8B6914] rounded-full opacity-40 blur-[0.5px]" />
          <div className="absolute left-[10px] top-0 w-[15px] h-[42px] border-l-[3.5px] border-r-[3.5px] border-b-[3.5px] border-[#D4AF37] rounded-b-full shadow-[3px_4px_6px_rgba(0,0,0,0.3)] z-10" style={{ borderColor: '#D4AF37 #D4AF37 #8B6914 transparent' }} />
          <div className="absolute left-[11px] top-[2px] w-[10px] h-[38px] border-l-[1px] border-r-[1px] border-b-[1.5px] border-[#FFF3A3] rounded-b-full z-20 opacity-50" />
          <div className="absolute left-[18px] top-[38px] w-[2px] h-[10px] bg-black/10 blur-[2px] z-0" />
        </div>
      ))}
    </div>
  )
})

// ─── Memoized single box — only re-renders when THIS box data or selection changes ─
const BoxItem = memo(function BoxItem({ box, isSelected, loadingBoxId, accentSolid, startDrag, startResize, deleteBox, updateBox, updateBoxContent, setSelectedBoxIds, onKeyDown, onInput }: {
  box: TextBoxType; isSelected: boolean; loadingBoxId: string | null; accentSolid: string
  startDrag: (e: React.MouseEvent, box: TextBoxType) => void
  startResize: (e: React.MouseEvent, box: TextBoxType, handle: string) => void
  deleteBox: (id: string) => void
  updateBox: (id: string, updates: Partial<TextBoxType>) => void
  updateBoxContent: (id: string, v: string) => void
  setSelectedBoxIds: (v: Set<string> | ((p: Set<string>) => Set<string>)) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  onInput: (e: React.FormEvent<HTMLElement>) => void
}) {
  const corners: [string, React.CSSProperties][] = [
    ["nw", { top: -4, left: -4, cursor: "nw-resize" }],
    ["ne", { top: -4, right: -4, cursor: "ne-resize" }],
    ["sw", { bottom: -4, left: -4, cursor: "sw-resize" }],
    ["se", { bottom: -4, right: -4, cursor: "se-resize" }],
  ]
  const isImage = box.content.includes("http") || box.content.startsWith("data:image")
  return (
    <div
      id={`box-${box.id}`}
      onMouseDown={e => startDrag(e, box)}
      style={{
        position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h,
        border: isSelected ? `1px solid ${accentSolid}44` : "1px solid transparent",
        borderRadius: 2, backgroundColor: "transparent",
        zIndex: 50, overflow: "visible", cursor: "grab",
      }}
    >
      {isSelected && (<>
        <div style={{ position: "absolute", inset: 0, border: `1.5px solid ${accentSolid}`, borderRadius: 2, animation: "box-ripple 0.45s ease-out forwards", pointerEvents: "none", zIndex: 55 }} />
        <div style={{ position: "absolute", inset: 0, border: `1px solid ${accentSolid}`, borderRadius: 2, animation: "box-ripple-2 0.7s 0.05s ease-out forwards", pointerEvents: "none", zIndex: 54 }} />
      </>)}
      {isSelected && corners.map(([h, pos]) => (
        <div key={h} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); startResize(e, box, h) }}
          style={{ position: "absolute", width: 6, height: 6, borderRadius: "50%", background: "white", border: `1px solid ${accentSolid}88`, zIndex: 20, ...pos }} />
      ))}
      {isSelected && (
        <button onMouseDown={e => { e.stopPropagation(); deleteBox(box.id) }}
          style={{ position: "absolute", top: 3, right: 5, background: "none", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1, color: `${accentSolid}66`, zIndex: 30, padding: 0 }}>×</button>
      )}
      {isSelected && !isImage && (
        <BoxToolbar box={box} accentSolid={accentSolid} onUpdateBox={updateBox} />
      )}
      <div style={{ position: "absolute", inset: 0, padding: "5px 7px", overflow: "hidden" }}>
        {loadingBoxId === box.id ? (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#a1a1aa", fontSize: 10, fontFamily: "monospace" }}>generating…</div>
        ) : isImage ? (
          <img src={box.content} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "grayscale(1)", mixBlendMode: "multiply", opacity: 0.9 }} alt="sketch" />
        ) : (
          <BoxTextarea
            id={box.id}
            content={box.content}
            textAlign={box.textAlign}
            boxFontFamily={box.boxFontFamily}
            boxFontSize={box.boxFontSize}
            boxHeadingStyle={box.boxHeadingStyle}
            onUpdate={updateBoxContent}
            onFocus={() => setSelectedBoxIds(new Set([box.id]))}
            onKeyDown={onKeyDown}
            onInput={onInput}
          />
        )}
      </div>
    </div>
  )
})

const BOX_HEADING_SIZES: Record<string, number> = { h1: 28, h2: 22, h3: 18, default: 14 }
const BOX_HEADING_WEIGHTS: Record<string, number> = { h1: 800, h2: 700, h3: 700, default: 400 }
const BOX_FONTS = [
  { value: "", label: "Garamond" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: '"Courier New", monospace', label: "Mono" },
]
const BOX_SIZES = [8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72]
const BOX_STYLES = [
  { value: "default", label: "Default" },
  { value: "h1", label: "H1" },
  { value: "h2", label: "H2" },
  { value: "h3", label: "H3" },
]

const BoxToolbar = memo(function BoxToolbar({ box, accentSolid, onUpdateBox }: {
  box: TextBoxType; accentSolid: string
  onUpdateBox: (id: string, updates: Partial<TextBoxType>) => void
}) {
  const [open, setOpen] = useState<"style" | "font" | "size" | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [anchorLeft, setAnchorLeft] = useState(0)
  const [customSize, setCustomSize] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const styleBtnRef = useRef<HTMLButtonElement>(null)
  const fontBtnRef = useRef<HTMLButtonElement>(null)
  const sizeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(null) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const openDropdown = (type: "style" | "font" | "size") => {
    const btnRef = type === "style" ? styleBtnRef : type === "font" ? fontBtnRef : sizeBtnRef
    if (btnRef.current && ref.current) {
      const b = btnRef.current.getBoundingClientRect()
      const t = ref.current.getBoundingClientRect()
      setAnchorLeft(b.left - t.left)
    }
    setOpen(o => o === type ? null : type)
  }

  const styleKey = box.boxHeadingStyle || "default"
  const currentFont = BOX_FONTS.find(f => f.value === (box.boxFontFamily ?? "")) ?? BOX_FONTS[0]
  const currentSize = box.boxFontSize ?? BOX_HEADING_SIZES[styleKey]

  const dropdownBase: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 4px)", left: anchorLeft,
    background: "#ffffff", border: "1px solid rgba(0,0,0,0.09)",
    borderRadius: 6, padding: 3,
    boxShadow: "0 4px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
    zIndex: 400, minWidth: 90,
  }
  const optionBtn = (active: boolean): React.CSSProperties => ({
    display: "block", width: "100%", textAlign: "left", padding: "5px 9px",
    fontSize: 11.5, fontWeight: active ? 500 : 400, border: "none",
    background: active ? "rgba(0,0,0,0.05)" : "transparent",
    cursor: "pointer", color: "#18181b", borderRadius: 4,
    letterSpacing: "-0.01em",
  })
  const triggerStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: "#3f3f46", background: "none", border: "none",
    cursor: "pointer", padding: "2px 6px", borderRadius: 4,
    display: "flex", alignItems: "center", gap: 3, letterSpacing: "-0.01em",
  }
  const chevron = <svg width="7" height="5" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.45, flexShrink: 0 }}><path d="M0 0l5 6 5-6z"/></svg>

  return (
    <div ref={ref} onMouseDown={e => e.stopPropagation()} style={{
      position: "absolute", bottom: "calc(100% + 5px)", left: -1,
      display: "flex", alignItems: "center", gap: 0,
      background: "#ffffff", border: "1px solid rgba(0,0,0,0.09)",
      borderRadius: 6, padding: "2px 3px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
      zIndex: 200, whiteSpace: "nowrap",
    }}>
      {/* Eye toggle */}
      <button onClick={() => { setCollapsed(c => !c); setOpen(null) }}
        title={collapsed ? "Show formatting" : "Hide formatting"}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 5px", display: "flex", alignItems: "center", color: accentSolid, borderRadius: 4 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)", transform: collapsed ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "50% 50%", display: "block" }}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3"
            style={{ transition: "opacity 0.12s ease", opacity: collapsed ? 0 : 1 } as React.CSSProperties} />
        </svg>
      </button>

      {/* Triggers inside overflow:hidden for the slide animation — NO dropdown panels here */}
      <div style={{ overflow: "hidden", maxWidth: collapsed ? 0 : 320, transition: "max-width 0.32s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 1, paddingLeft: 1,
          opacity: collapsed ? 0 : 1,
          transform: collapsed ? "translateX(-8px)" : "translateX(0)",
          transition: "opacity 0.18s ease, transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <div style={{ width: 1, height: 12, background: "rgba(0,0,0,0.1)", margin: "0 2px 0 1px", flexShrink: 0 }} />
          <button ref={styleBtnRef} style={triggerStyle} onClick={() => openDropdown("style")}>
            {BOX_STYLES.find(s => s.value === styleKey)?.label} {chevron}
          </button>
          <button ref={fontBtnRef} style={triggerStyle} onClick={() => openDropdown("font")}>
            {currentFont.label} {chevron}
          </button>
          <button ref={sizeBtnRef} style={triggerStyle} onClick={() => openDropdown("size")}>
            {currentSize}px {chevron}
          </button>
          <div style={{ width: 1, height: 12, background: "rgba(0,0,0,0.1)", margin: "0 2px", flexShrink: 0 }} />
          {(["left", "center", "right"] as const).map(align => (
            <button key={align} style={{ ...triggerStyle, padding: "2px 4px", ...(box.textAlign === align ? { color: accentSolid, background: "rgba(0,0,0,0.06)" } : {}) }}
              onClick={() => onUpdateBox(box.id, { textAlign: align })}>
              {align === "left"   && <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm0 4h8v2H2V7zm0 4h12v2H2v-2z"/></svg>}
              {align === "center" && <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm2 4h8v2H4V7zm-2 4h12v2H2v-2z"/></svg>}
              {align === "right"  && <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm4 4h8v2H6V7zm-4 4h12v2H2v-2z"/></svg>}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown panels rendered as siblings to the overflow wrapper — not clipped by it */}
      {open === "style" && (
        <div style={dropdownBase}>
          {BOX_STYLES.map(s => (
            <button key={s.value} style={{ ...optionBtn(styleKey === s.value), fontWeight: s.value !== "default" ? 600 : 400 }}
              onClick={() => { onUpdateBox(box.id, { boxHeadingStyle: s.value as TextBoxType["boxHeadingStyle"] }); setOpen(null) }}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      {open === "font" && (
        <div style={dropdownBase}>
          {BOX_FONTS.map(f => (
            <button key={f.value} style={{ ...optionBtn((box.boxFontFamily ?? "") === f.value), fontFamily: f.value || '"EB Garamond", Georgia, serif' }}
              onClick={() => { onUpdateBox(box.id, { boxFontFamily: f.value }); setOpen(null) }}>
              {f.label}
            </button>
          ))}
        </div>
      )}
      {open === "size" && (
        <div style={{ ...dropdownBase, display: "flex", flexDirection: "column", maxHeight: 220 }}>
          <div style={{ padding: "4px 6px 6px", borderBottom: "1px solid rgba(0,0,0,0.06)", marginBottom: 3, flexShrink: 0 }}>
            <input
              type="number" min={1} max={400} placeholder="Custom…"
              value={customSize}
              onChange={e => setCustomSize(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation()
                if (e.key === "Enter" && customSize) {
                  const n = parseInt(customSize)
                  if (n > 0) { onUpdateBox(box.id, { boxFontSize: n }); setOpen(null); setCustomSize("") }
                }
              }}
              style={{ width: "100%", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 4, padding: "3px 7px", fontSize: 11, outline: "none", color: "#18181b", background: "#fafafa" }}
            />
          </div>
          <div style={{ overflowY: "auto" }}>
            {BOX_SIZES.map(sz => (
              <button key={sz} style={optionBtn(currentSize === sz)}
                onClick={() => { onUpdateBox(box.id, { boxFontSize: sz }); setOpen(null) }}>
                {sz}px
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

const BoxTextarea = memo(function BoxTextarea({ id, content, textAlign, boxFontFamily, boxFontSize, boxHeadingStyle, onUpdate, onFocus, onKeyDown, onInput }: {
  id: string; content: string; textAlign?: string
  boxFontFamily?: string; boxFontSize?: number; boxHeadingStyle?: string
  onUpdate: (id: string, v: string) => void
  onFocus: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  onInput: (e: React.FormEvent<HTMLElement>) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const focusedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== content) {
      ref.current.innerHTML = content
    }
  }, [content])

  const styleKey = boxHeadingStyle || "default"
  const resolvedSize = boxFontSize ?? BOX_HEADING_SIZES[styleKey]
  const resolvedWeight = BOX_HEADING_WEIGHTS[styleKey]
  const resolvedFont = boxFontFamily || '"EB Garamond", Georgia, serif'

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={e => {
        onKeyDown(e)
        if (!e.defaultPrevented) e.stopPropagation()
      }}
      onInput={e => {
        onInput(e)
        const v = e.currentTarget.innerHTML
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => onUpdate(id, v), 500)
      }}
      onMouseDown={e => e.stopPropagation()}
      onFocus={() => { focusedRef.current = true; onFocus() }}
      onBlur={() => {
        focusedRef.current = false
        clearTimeout(timerRef.current)
        onUpdate(id, ref.current?.innerHTML || "")
      }}
      style={{
        width: "100%", height: "100%", outline: "none",
        fontFamily: resolvedFont, fontSize: resolvedSize, fontWeight: resolvedWeight,
        lineHeight: 1.45, color: "#1a1a1a", cursor: "text",
        textAlign: (textAlign || "left") as any, wordWrap: "break-word", overflowY: "auto"
      }}
    />
  )
})

export default function NoteApp() {
  const [notes, setNotes] = useState<NoteData[]>([])
  const [folders, setFolders] = useState<FolderData[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [dialog, setDialog] = useState<DialogConfig | null>(null)

  // UI state
  const [zoom, setZoom] = useState("0.85")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [gridView, setGridView] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [bindingCompact, setBindingCompact] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<number | null>(null)
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)
  const [sketchMode, setSketchMode] = useState(false)
  const [sketchPrompt, setSketchPrompt] = useState("")
  const [drawLineMode, setDrawLineMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDrawToolbar, setShowDrawToolbar] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [contentSidebarOpen, setContentSidebarOpen] = useState(false)
  const [customSize, setCustomSize] = useState("16")

  // Settings
  const [accent, setAccent] = useState("#600b2779")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [autoSave, setAutoSave] = useState(true)
  const [spellCheck, setSpellCheck] = useState(true)
  const [editorFont, setEditorFont] = useState("EB Garamond")
  const [lineSpacing, setLineSpacing] = useState<"compact" | "normal" | "relaxed">("normal")
  const [paperStyle, setPaperStyle] = useState<"lined" | "dotgrid" | "plain" | "stenopad">("lined")
  const [showBinding, setShowBinding] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [sidebarOnStart, setSidebarOnStart] = useState(true)
  const [bgEffect, setBgEffect] = useState(true)

  const [activeTool, setActiveTool] = useState('select')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const editorRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)

  const activeNote = useMemo(
    () => (notes.find(n => n.id === activeTabId) ?? notes[0]) as NoteData,
    [notes, activeTabId]
  )

  // Dialog helpers
  const openPrompt  = useCallback((title: string, defaultValue: string, placeholder: string, confirmLabel: string, onConfirm: (v: string) => void) => setDialog({ type: "prompt", title, defaultValue, placeholder, confirmLabel, onConfirm }), [])
  const openConfirm = useCallback((title: string, message: string, confirmLabel: string, danger: boolean, onConfirm: () => void) => setDialog({ type: "confirm", title, message, confirmLabel, danger, onConfirm }), [])
  const openAlert   = useCallback((title: string, message?: string) => setDialog({ type: "alert", title, message }), [])

  // Hooks
  const editor = useEditor({ editorRef, activeTabId, currentPageIdx, setNotes, accent })
  const boxes  = useBoxDrawing({ activeTabId, currentPageIdx, zoom, accent, notes, setNotes, paperRef, sketchMode, sketchPrompt, setSketchMode, setSketchPrompt, drawLineMode, setDrawLineMode })
  const drawing = useDrawing({ canvasRef, activeTool, accent, zoom, currentPageIdx, setNotes, activeTabId, notes })

  // Slash (@) menu
  const [slashMenu, setSlashMenu] = useState<{ x: number; y: number; filter: string; type: "editor" | "textarea"; target?: HTMLElement } | null>(null)
  const slashMenuRef = useRef<{ x: number; y: number; filter: string; type: "editor" | "textarea"; target?: HTMLElement } | null>(null)
  const slashAnchorRef = useRef<{ node: Node; offset: number } | null>(null)

  const closeSlashMenu = useCallback(() => {
    slashMenuRef.current = null
    slashAnchorRef.current = null
    setSlashMenu(null)
  }, [])

  const executeSlashItem = useCallback((action: () => void) => {
    const m = slashMenuRef.current
    const anchor = slashAnchorRef.current
    const filter = m?.filter ?? ""
    
    if (m?.type === "textarea" && anchor) {
      try {
        const textNode = anchor.node as Text
        if (textNode.nodeType === Node.TEXT_NODE) {
          // @ was prevented from being typed — delete only the filter text (no +1 for @)
          const endOffset = Math.min(anchor.offset + filter.length, textNode.length)
          const r = document.createRange()
          r.setStart(textNode, anchor.offset)
          r.setEnd(textNode, endOffset)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(r)
          document.execCommand("delete")
        }
      } catch {}
    } else if (m?.type === "editor" && anchor) {
      try {
        const textNode = anchor.node as Text
        const endOffset = Math.min(anchor.offset + 1 + filter.length, textNode.length)
        const r = document.createRange()
        r.setStart(textNode, anchor.offset)
        r.setEnd(textNode, endOffset)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(r)
        document.execCommand("delete")
      } catch {}
    }

    closeSlashMenu()
    if (m?.type === "editor") editorRef.current?.focus()
    else if (m?.target) m.target.focus()
    
    editor.saveSelection()
    action()
  }, [closeSlashMenu, editorRef, editor])

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    // Only call editor.handleEditorKeyDown if it's the main editor
    if ((e.currentTarget as any) === editorRef.current) {
      editor.handleEditorKeyDown(e)
    }

    if (e.key === "Escape") {
      const isBox = (e.currentTarget as any) !== editorRef.current
      if (isBox) { (e.currentTarget as HTMLElement).blur(); e.preventDefault() }
      return
    }

    if (e.key === "@" || e.key === "/") {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const isBox = (e.currentTarget as any) !== editorRef.current

      // For boxes: store cursor position before any DOM changes — @ won't be typed
      if (isBox) {
        const r = sel.getRangeAt(0)
        slashAnchorRef.current = {
          node: r.startContainer,
          offset: r.startContainer.nodeType === Node.TEXT_NODE ? r.startOffset : -1,
        }
      }

      const range = sel.getRangeAt(0).cloneRange()
      range.collapse(true)
      const span = document.createElement("span")
      span.textContent = "\u200b"
      range.insertNode(span)
      const rect = span.getBoundingClientRect()
      span.parentNode?.removeChild(span)
      sel.removeAllRanges()
      sel.addRange(range)

      const m = { x: rect.left, y: rect.bottom + 8, filter: "", type: isBox ? ("textarea" as const) : ("editor" as const), target: e.currentTarget as HTMLElement }
      slashMenuRef.current = m
      setSlashMenu(m)
      if (isBox) e.preventDefault()
    }
  }, [editor.handleEditorKeyDown])

  const handleEditorInput = useCallback((e: React.FormEvent<HTMLElement>) => {
    if ((e.currentTarget as any) === editorRef.current) {
      editor.syncContent()
    }
    
    if (!slashMenuRef.current) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) { closeSlashMenu(); return }
    const range = sel.getRangeAt(0)
    const node = range.startContainer

    // Box menu: @ was prevented, compute filter from anchor stored at keydown
    if (slashMenuRef.current.type === "textarea") {
      const anchor = slashAnchorRef.current
      if (!anchor) { closeSlashMenu(); return }
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text
        let anchorOffset: number
        if (anchor.node === node) {
          anchorOffset = anchor.offset
        } else if (anchor.offset === -1) {
          // Box was empty when @ was pressed; first text node just created
          anchorOffset = 0
          slashAnchorRef.current = { node: textNode, offset: 0 }
        } else {
          closeSlashMenu(); return
        }
        if (range.startOffset < anchorOffset) { closeSlashMenu(); return }
        const filter = textNode.textContent?.slice(anchorOffset, range.startOffset) ?? ""
        if (filter.includes(" ")) { closeSlashMenu(); return }
        const updated = { ...slashMenuRef.current, filter }
        slashMenuRef.current = updated
        setSlashMenu(updated)
      } else {
        closeSlashMenu()
      }
      return
    }

    // Main editor: search for @ or / before cursor
    if (node.nodeType !== Node.TEXT_NODE) { closeSlashMenu(); return }
    const textNode = node as Text
    const textBefore = (textNode.textContent ?? "").slice(0, range.startOffset)
    const atIdx = textBefore.lastIndexOf("@")
    const slIdx = textBefore.lastIndexOf("/")
    const lastIdx = Math.max(atIdx, slIdx)
    if (lastIdx === -1) { closeSlashMenu(); return }
    const filter = textBefore.slice(lastIdx + 1)
    if (filter.includes(" ")) { closeSlashMenu(); return }
    slashAnchorRef.current = { node: textNode, offset: lastIdx }
    const updated = { ...slashMenuRef.current, filter }
    slashMenuRef.current = updated
    setSlashMenu(updated)
  }, [editor.syncContent, closeSlashMenu])

  // Keyboard shortcuts for tools
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) return
      const map: Record<string, string> = { '1': 'select', '2': 'rect', '3': 'diamond', '4': 'circle', '5': 'arrow', '6': 'line', '7': 'pen', '8': 'text', '9': 'image', '0': 'eraser' }
      if (map[e.key]) setActiveTool(map[e.key])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session: any) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // Resize observer for binding layout
  useEffect(() => {
    const check = () => { if (paperRef.current) setBindingCompact(paperRef.current.offsetWidth < 680) }
    check()
    const ro = new ResizeObserver(check)
    if (paperRef.current) ro.observe(paperRef.current)
    return () => ro.disconnect()
  }, [])

  // Backlink click handler
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest("[data-backlink-id]")
      if (link) {
        const id = link.getAttribute("data-backlink-id")
        if (id) {
          editor.flushSync()
          setActiveTabId(id)
          setCurrentPageIdx(0)
        }
      }
    }
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
  }, [editor])

  // Load settings from cloud
  useEffect(() => {
    if (!user) return
    supabase.from("user_settings").select("settings").eq("user_id", user.id).single().then(({ data }) => {
      if (!data?.settings) return
      const s = data.settings
      if (s.accent)                    setAccent(s.accent)
      if (s.theme)                     setTheme(s.theme)
      if (s.autoSave      !== undefined) setAutoSave(s.autoSave)
      if (s.spellCheck    !== undefined) setSpellCheck(s.spellCheck)
      if (s.editorFont)                setEditorFont(s.editorFont)
      if (s.lineSpacing)               setLineSpacing(s.lineSpacing)
      if (s.paperStyle)                setPaperStyle(s.paperStyle)
      if (s.showBinding   !== undefined) setShowBinding(s.showBinding)
      if (s.reduceMotion  !== undefined) setReduceMotion(s.reduceMotion)
      if (s.sidebarOnStart !== undefined) setSidebarOnStart(s.sidebarOnStart)
      if (s.bgEffect      !== undefined) setBgEffect(s.bgEffect)
    })
  }, [user])

  // Save settings to cloud (debounced)
  useEffect(() => {
    if (!user) return
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        settings: { accent, theme, autoSave, spellCheck, editorFont, lineSpacing, paperStyle, showBinding, reduceMotion, sidebarOnStart, bgEffect }
      })
      if (error) console.error("Settings save failed:", error.message, error.code)
    }, 1000)
    return () => clearTimeout(timer)
  }, [accent, theme, autoSave, spellCheck, editorFont, lineSpacing, paperStyle, showBinding, reduceMotion, sidebarOnStart, bgEffect, user])

  // Cloud autosave
  useEffect(() => {
    if (!autoSave || isLoading || !activeNote || !user) return
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("notes").upsert({ id: activeNote.id, subject: activeNote.subject, pages: activeNote.pages, boxes: activeNote.boxes, folder_id: activeNote.folderId, user_id: user.id })
      if (error) console.error("Save failed:", error.message)
    }, 800)
    return () => clearTimeout(timer)
  }, [activeNote, user])

  // Sync editor DOM with active note/page
  const lastSyncKey = useRef<string>("")
  useEffect(() => {
    if (!activeNote) return
    const key = `${activeTabId}:${currentPageIdx}:${gridView}`
    if (!gridView && editorRef.current && lastSyncKey.current !== key) {
      editorRef.current.innerHTML = activeNote.pages[currentPageIdx] || ""
      lastSyncKey.current = key
    }
  }, [activeTabId, currentPageIdx, gridView, activeNote?.pages])

  // Fetch notes from cloud
  useEffect(() => {
    const fetchNotes = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { setIsLoading(false); return }
      const { data, error } = await supabase.from("notes").select("*").eq("user_id", u.id)
      if (!error && data?.length) {
        setNotes(data.map(n => ({ id: n.id, subject: n.subject, pages: n.pages ?? [""], boxes: n.boxes ?? {}, folderId: n.folder_id ?? null })))
        setActiveTabId(data[0].id)
      } else { setNotes([]); setActiveTabId(null) }
      setIsLoading(false)
    }
    fetchNotes()
  }, [user])

  // Note/folder actions
  const addNote = (folderId: number | null = null) =>
    openPrompt("Name your note", "New Note", "Note name…", "Create", name => {
      if (!name.trim()) return
      const id = uid()
      setNotes(prev => [...prev, { id, subject: name.trim(), pages: [""], folderId, boxes: {} }])
      setActiveTabId(id); setCurrentPageIdx(0)
    })

  const insertBacklink = useCallback(() => {
    editor.saveSelection()
    openPrompt("Name your subpage", "Subpage", "Subpage name…", "Create", name => {
      if (!name.trim()) return
      const newId = uid()
      setNotes(prev => [...prev, { id: newId, subject: name.trim(), pages: [""], folderId: activeNote.folderId, boxes: {} }])
      
      const color = accent.length > 7 ? accent.slice(0, 7) : accent
      const linkHtml = `<span data-backlink-id="${newId}" contenteditable="false" style="display: inline-flex; align-items: center; gap: 4px; background: ${color}15; color: ${color}; border: 1px solid ${color}33; padding: 1px 8px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; margin: 0 2px; transition: all 0.2s; user-select: none; -webkit-user-modify: read-only;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        ${name.trim()}
      </span>&nbsp;`
      
      editor.insertHTML(linkHtml)
    })
  }, [accent, activeNote, editor, openPrompt])

  const renameNote = (id: string, currentName: string) =>
    openPrompt("Rename note", currentName, "Note name…", "Rename", newName => {
      if (newName.trim()) setNotes(prev => prev.map(n => n.id === id ? { ...n, subject: newName.trim() } : n))
    })

  const deleteNote = (id: string) =>
    openConfirm("Delete note?", "This cannot be undone.", "Delete", true, async () => {
      setNotes(prev => prev.filter(n => n.id !== id))
      if (activeTabId === id) setActiveTabId(notes.find(n => n.id !== id)?.id ?? null)
      if (user) await supabase.from("notes").delete().eq("id", id)
    })

  const clearPage = () =>
    openConfirm("Clear this page?", "All content on this page will be deleted. This cannot be undone.", "Clear", true, () => {
      if (editorRef.current) editorRef.current.innerHTML = ""
      setNotes(prev => prev.map(n => {
        if (n.id !== activeTabId) return n
        const newPages = [...n.pages]; newPages[currentPageIdx] = ""
        const newBoxes = { ...n.boxes }; newBoxes[currentPageIdx] = []
        return { ...n, pages: newPages, boxes: newBoxes }
      }))
    })

  const insertCornell = () =>
    openConfirm("Apply Cornell Layout?", "This will clear everything currently on this page.", "Apply", true, () => {
      const topH = 150
      const botH = 800
      const leftW = 280
      const lblStyle = "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(113, 113, 122, 0.7)"

      if (editorRef.current) {
        editorRef.current.innerHTML = `
          <div style="position: absolute; top: ${topH}px; left: 40px; right: 40px; height: 1.5px; background: rgba(0,0,0,0.5);"></div>
          <div style="position: absolute; top: ${topH}px; height: ${botH - topH}px; left: ${leftW}px; width: 1.5px; background: rgba(0,0,0,0.5);"></div>
          <div style="position: absolute; top: ${botH}px; left: 40px; right: 40px; height: 1.5px; background: rgba(0,0,0,0.5);"></div>

          <div style="position: absolute; left: 60px; top: 30px; ${lblStyle}">Title</div>
          <div style="position: absolute; right: 100px; top: 30px; ${lblStyle}">Date</div>
          <div style="position: absolute; left: 60px; top: ${topH + 30}px; ${lblStyle}">Keywords & Questions</div>
          <div style="position: absolute; left: ${leftW + 30}px; top: ${topH + 30}px; ${lblStyle}">Main Notes</div>
          <div style="position: absolute; left: 60px; top: ${botH + 30}px; ${lblStyle}">Summary</div>
        `
      }
      setNotes(prev => prev.map(n => {
        if (n.id !== activeTabId) return n
        const newPages = [...n.pages]; newPages[currentPageIdx] = editorRef.current?.innerHTML || ""
        const newBoxes = { ...n.boxes }

        newBoxes[currentPageIdx] = [
          { id: uid(), x: 50, y: 55, w: 400, h: 50, content: "" }, // Title
          { id: uid(), x: 600, y: 55, w: 150, h: 50, content: "" }, // Date
          { id: uid(), x: 50, y: topH + 55, w: 200, h: 550, content: "" }, // Keywords
          { id: uid(), x: leftW + 20, y: topH + 55, w: 460, h: 550, content: "" }, // Notes
          { id: uid(), x: 50, y: botH + 55, w: 700, h: 100, content: "" }, // Summary
        ]
        return { ...n, pages: newPages, boxes: newBoxes }
      }))
    })

  const addFolder = () => { const id = Date.now(); setFolders(prev => [...prev, { id, name: "New Folder", open: true }]); setRenamingFolder(id) }
  const toggleFolder = (id: number) => setFolders(prev => prev.map(f => f.id === id ? { ...f, open: !f.open } : f))
  const renameFolder = (id: number, name: string) => setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  const deleteFolder = (id: number) =>
    openConfirm("Delete folder?", "Notes inside will be moved to root.", "Delete", true, () => {
      setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n))
      setFolders(prev => prev.filter(f => f.id !== id))
    })

  const handleDropNote = (e: React.DragEvent, targetFolderId: number | null, targetNoteId?: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!draggedNoteId || draggedNoteId === targetNoteId) return
    setNotes(prev => {
      const copy = [...prev]
      const draggedIdx = copy.findIndex(n => n.id === draggedNoteId)
      if (draggedIdx === -1) return prev
      const draggedNote = { ...copy[draggedIdx], folderId: targetFolderId }
      copy.splice(draggedIdx, 1)
      if (targetNoteId) copy.splice(copy.findIndex(n => n.id === targetNoteId), 0, draggedNote)
      else copy.push(draggedNote)
      return copy
    })
    setDraggedNoteId(null)
  }

  const handleImageUpload = useCallback((dataUrl: string) => {
    const paper = paperRef.current
    if (!paper || !activeTabId) return
    const rect = paper.getBoundingClientRect()
    const scale = parseFloat(zoom)
    const x = (window.innerWidth / 2 - rect.left) / scale - 150
    const y = (window.innerHeight / 2 - rect.top) / scale - 100
    const id = uid()
    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
      ...n,
      boxes: {
        ...n.boxes,
        [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), { id, x: Math.max(10, x), y: Math.max(10, y), w: 300, h: 200, content: dataUrl }]
      }
    }))
  }, [activeTabId, currentPageIdx, zoom])

  const downloadNote = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeNote.subject}</title>
    <style>body{font-family:Georgia,serif;max-width:720px;margin:0 auto;padding:48px;color:#1a1a1a}
    h1{color:${accent};margin-bottom:32px}hr{border:none;border-top:1px solid #ddd;margin:32px 0}
    h3{color:${accent}88;font-size:12px;text-transform:uppercase;letter-spacing:.1em}</style>
    </head><body><h1>${activeNote.subject}</h1>
    ${activeNote.pages.map((p, i) => `<section><h3>Page ${i + 1}</h3><div>${p || "<em style='color:#bbb'>Empty page</em>"}</div></section>`).join("<hr/>")}</body></html>`
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }))
    a.download = `${activeNote.subject.replace(/[^a-z0-9]/gi, "_")}.html`
    a.click()
  }


  if (isLoading) return (
    <div className="h-screen bg-[#110d0e] flex items-center justify-center text-white font-sans">
      <div className="animate-pulse text-xl">Loading Letter Soup...</div>
    </div>
  )

  const { backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize } = getPaperBg(lineSpacing, paperStyle, theme === "dark")


  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#F0ECEA", color: theme === "dark" ? "#FAFAFA" : "#1A1A1A", backgroundImage: bgEffect ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='${theme === "dark" ? "0.035" : "0.045"}'/%3E%3C/svg%3E")` : undefined, backgroundRepeat: "repeat" }}>
      {dialog && <AppDialog config={dialog} accent={accent} onClose={() => setDialog(null)} />}
      {showSettings && <SettingsView user={user} onClose={() => setShowSettings(false)} accentColor={accent} setAccentColor={setAccent} theme={theme} setTheme={setTheme} autoSave={autoSave} setAutoSave={setAutoSave} spellCheck={spellCheck} setSpellCheck={setSpellCheck} editorFont={editorFont} setEditorFont={setEditorFont} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} paperStyle={paperStyle} setPaperStyle={setPaperStyle} showBinding={showBinding} setShowBinding={setShowBinding} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} sidebarOnStart={sidebarOnStart} setSidebarOnStart={setSidebarOnStart} bgEffect={bgEffect} setBgEffect={setBgEffect} />}
      <GlobalStyles reduceMotion={reduceMotion} theme={theme} />

      <Sidebar notes={notes} folders={folders} activeTabId={activeTabId} accent={accent} draggedNoteId={draggedNoteId} renamingFolder={renamingFolder} user={user} sidebarOpen={sidebarOpen} onAddNote={addNote} onAddFolder={addFolder} onSelectNote={id => { editor.flushSync(); setActiveTabId(id); setCurrentPageIdx(0) }} onRenameNote={renameNote} onDeleteNote={deleteNote} onToggleFolder={toggleFolder} onRenameFolder={renameFolder} onDeleteFolder={deleteFolder} onSetRenamingFolder={setRenamingFolder} onSetDraggedNoteId={setDraggedNoteId} onDropNote={handleDropNote} onOpenSettings={() => setShowSettings(true)} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <button onClick={() => setSidebarOpen(v => !v)} className="absolute left-2 top-[54px] z-50 text-zinc-400 hover:text-zinc-700 transition-colors p-1 text-2xl leading-none">
          {sidebarOpen ? "‹" : "›"}
        </button>

        {notes.length > 0 && (
          <DocumentToolbar
            accent={accent} zoom={zoom} theme={theme}
            gridView={gridView} drawLineMode={drawLineMode}
            currentPageIdx={currentPageIdx}
            saveSelection={editor.saveSelection} setZoom={setZoom}
            setCarouselIdx={setCarouselIdx} setGridView={setGridView}
            sketchMode={sketchMode} setSketchMode={setSketchMode} setSketchPrompt={setSketchPrompt}
            setDrawLineMode={setDrawLineMode}
            insertTable={editor.insertTable} insertColumns={editor.insertColumns}
            openAlert={openAlert} clearPage={clearPage}
            autoAlign={boxes.autoAlign} insertCornell={insertCornell}
            showDrawToolbar={showDrawToolbar} onToggleDrawToolbar={() => setShowDrawToolbar(v => !v)}
            rightSidebarOpen={contentSidebarOpen} setRightSidebarOpen={setContentSidebarOpen}
          />
        )}

        <div className="flex-1 flex overflow-hidden relative">
          {notes.length === 0 ? (
            <main className="flex-1 flex items-center justify-center" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#EDE8E6" }}>
              <div className="text-center">
                <p className="text-5xl font-bold mb-6" style={{ fontFamily: '"Licorice", cursive', color: accent }}>Ready?</p>
                <button onClick={() => addNote(null)} className="w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white mx-auto transition-all hover:scale-110" style={{ backgroundColor: accent }}>+</button>
              </div>
            </main>
          ) : gridView ? (
            <GridView activeNote={activeNote} activeTabId={activeTabId} carouselIdx={carouselIdx} lineSpacing={lineSpacing} paperStyle={paperStyle} theme={theme} editorFont={editorFont} accent={accent} setCarouselIdx={setCarouselIdx} setGridView={setGridView} setCurrentPageIdx={setCurrentPageIdx} setNotes={setNotes} />
          ) : (
            <main className="flex-1 overflow-y-scroll px-8 pt-16 pb-8 flex justify-center items-start" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#EDE8E6", scrollbarGutter: "stable" }}>
              <div style={{ zoom: zoom, transformOrigin: "top center", contain: "layout style", margin: "0 auto" }} className="w-full max-w-5xl shrink-0">
                <div style={{ position: "relative" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 4, right: -4, bottom: 0, backgroundColor: theme === "dark" ? "#1f1f23" : "#f0e9e0", borderRadius: 2, zIndex: 1, boxShadow: "2px 0 6px rgba(0,0,0,0.10)" }} />
                    <div style={{ position: "absolute", top: 0, left: 8, right: -8, bottom: 0, backgroundColor: theme === "dark" ? "#1a1a1e" : "#e8e0d4", borderRadius: 2, zIndex: 0, boxShadow: "2px 0 6px rgba(0,0,0,0.08)" }} />
                    <div style={{ position: "absolute", top: 0, left: 12, right: -12, bottom: 0, backgroundColor: theme === "dark" ? "#151518" : "#dfd6c8", borderRadius: 2, zIndex: -1 }} />

                    <div ref={paperRef} id="editor-paper" className="relative" style={{ minHeight: "1300px", contain: "layout style", cursor: activeTool === 'pan' ? 'grab' : activeTool === 'text' || activeTool === 'select' ? 'default' : 'crosshair', backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize, zIndex: 2, boxShadow: theme === "dark" ? "0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" : "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)" }} onMouseDown={e => {
                          if (activeTool !== 'select' && activeTool !== 'text') return
                          const target = e.target as HTMLElement
                          if (target !== paperRef.current && target !== editorRef.current && editorRef.current?.contains(target)) return
                          boxes.onPaperMouseDown(e)
                        }}>

                      <SpiralBinding theme={theme} showBinding={showBinding} bindingCompact={bindingCompact} />

                      <div className="absolute left-28 top-0 bottom-0 w-[1px] z-20 pointer-events-none" style={{ backgroundColor: theme === "dark" ? "rgba(248,113,113,0.3)" : "rgba(252,165,165,0.6)" }} />
                      <div className="absolute top-0 left-0 bottom-0 pointer-events-none" style={{ width: 220, background: "linear-gradient(to right, rgba(0,0,0,0.065) 0%, rgba(0,0,0,0.018) 50%, transparent 100%)", zIndex: 21 }} />
                      
                      {/* Render custom user-drawn lines */}
                      {(activeNote.lines?.[currentPageIdx] || []).map((lx, idx) => (
                        <div key={idx} className="absolute top-0 bottom-0 w-[1.5px] z-20 pointer-events-none" style={{ left: lx, backgroundColor: theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", borderLeft: `1px dashed ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }} />
                      ))}

                      <div
                        ref={editorRef}
                        className="w-full min-h-[1000px] outline-none pointer-events-none"
                        style={{ fontFamily: `"${editorFont}", Georgia, serif` }}
                      />

                      <style>{`
                        #editor-paper [contenteditable] {
                          color: #1a1a1a !important;
                          caret-color: ${accent.length > 7 ? accent.slice(0, 7) : accent} !important;
                          opacity: 1 !important;
                        }
                        @keyframes box-ripple {
                          0%   { inset: 0px;   opacity: 0.9; }
                          100% { inset: -22px; opacity: 0; }
                        }
                        @keyframes box-ripple-2 {
                          0%   { inset: 0px;   opacity: 0.45; }
                          100% { inset: -36px; opacity: 0; }
                        }
                      `}</style>

                      {/* Selection rectangle — always in DOM, shown/hidden via direct DOM style */}
                      <div
                        ref={boxes.selectionRectRef}
                        style={{
                          display: "none",
                          position: "absolute",
                          left: 0, top: 0, width: 0, height: 0,
                          backgroundColor: "rgba(255, 255, 255, 0.25)",
                          border: "1px solid rgba(255, 255, 255, 0.45)",
                          backdropFilter: "blur(2.5px)",
                          boxShadow: "0 0 15px rgba(255,255,255,0.1)",
                          borderRadius: "1px",
                          pointerEvents: "none",
                          zIndex: 100,
                        }}
                      />

                      {/* Drawing canvas overlay */}
                      <canvas
                        ref={canvasRef}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: activeTool === 'select' || activeTool === 'pan' || activeTool === 'text' ? 'none' : 'all',
                          cursor: drawing.getCursor(),
                          zIndex: activeTool === 'select' ? 10 : 45,
                          touchAction: "none",
                        }}
                        onPointerDown={drawing.onPointerDown}
                        onPointerMove={drawing.onPointerMove}
                        onPointerUp={drawing.onPointerUp}
                        onPointerCancel={drawing.onPointerUp}
                      />

                      {(activeNote.boxes[currentPageIdx] || []).map(box => (
                        <BoxItem
                          key={box.id}
                          box={box}
                          isSelected={boxes.selectedBoxIdsRef.current.has(box.id)}
                          loadingBoxId={boxes.loadingBoxId}
                          accentSolid={accent.length > 7 ? accent.slice(0, 7) : accent}
                          startDrag={boxes.startDrag}
                          startResize={boxes.startResize}
                          deleteBox={boxes.deleteBox}
                          updateBox={boxes.updateBox}
                          updateBoxContent={boxes.updateBoxContent}
                          setSelectedBoxIds={boxes.setSelectedBoxIds}
                          onKeyDown={handleEditorKeyDown}
                          onInput={handleEditorInput}
                        />
                      ))}

                      <div className="flex justify-center items-center gap-10 py-10 relative z-20">
                        <button disabled={currentPageIdx === 0} onClick={() => { editor.flushSync(); setCurrentPageIdx(p => p - 1) }} className="text-3xl disabled:opacity-10 hover:scale-110 transition-transform bg-white rounded-full px-2" style={{ color: accent }}>&larr;</button>
                        <span className="px-4 py-1 bg-zinc-50 rounded-full text-[10px] font-bold text-zinc-400">PAGE {currentPageIdx + 1} / {activeNote.pages.length}</span>
                        <button onClick={() => { editor.flushSync(); if (currentPageIdx < activeNote.pages.length - 1) setCurrentPageIdx(p => p + 1); else { const np = [...activeNote.pages, ""]; setNotes(prev => prev.map(n => n.id === activeTabId ? { ...n, pages: np } : n)); setCurrentPageIdx(activeNote.pages.length) } }} className="text-3xl hover:scale-110 transition-transform bg-white rounded-full px-2" style={{ color: accent }}>&rarr;</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 60, marginTop: -8, background: "radial-gradient(ellipse 90% 55% at 46% 0%, rgba(0,0,0,0.22) 0%, transparent 70%)", pointerEvents: "none", position: "relative", zIndex: 0 }} />
                </div>
              </div>
            </main>
          )}
          {notes.length > 0 && !gridView && (
            <RightToolbar 
              theme={theme} accent={accent} gridView={gridView} sketchMode={sketchMode} 
              rightSidebarOpen={rightSidebarOpen} setRightSidebarOpen={setRightSidebarOpen}
              setGridView={setGridView} setCarouselIdx={setCarouselIdx} 
              setSketchMode={setSketchMode} setSketchPrompt={setSketchPrompt} 
              openAlert={openAlert} clearPage={clearPage} autoAlign={boxes.autoAlign} 
              insertCornell={insertCornell} drawLineMode={drawLineMode} setDrawLineMode={setDrawLineMode} 
              currentPageIdx={currentPageIdx}
            />
          )}

          <RightSidebar 
            isOpen={contentSidebarOpen} 
            onClose={() => setContentSidebarOpen(false)} 
            theme={theme} 
            accent={accent}
            sketchMode={sketchMode}
            setSketchMode={setSketchMode}
            setSketchPrompt={setSketchPrompt}
            openAlert={openAlert}
          />
        </div>

        {notes.length > 0 && !gridView && (
          <FloatingToolbar accent={accent} activeTool={activeTool} onToolChange={setActiveTool} onClearDrawing={drawing.clearCanvas} onImageUpload={handleImageUpload} isVisible={showDrawToolbar} />
        )}
      </div>

      {slashMenu && (
        <SlashMenu
          x={slashMenu.x}
          y={slashMenu.y}
          filter={slashMenu.filter}
          accent={accent}
          onSelect={executeSlashItem}
          onClose={closeSlashMenu}
          execCmd={editor.execCmd}
          insertHTML={editor.insertHTML}
          toggleScript={editor.toggleScript}
          insertBacklink={insertBacklink}
        />
      )}
    </div>
  )
}
