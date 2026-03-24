"use client"
import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import type { TextBox as TextBoxType, NoteData, FolderData, DialogConfig, Bookmark } from "@/app/types"
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
import { RightSidebar } from "@/app/components/RightSidebar"
import { GridView } from "@/app/components/GridView"
import { SlashMenu } from "@/app/components/SlashMenu"
import { ShelfView } from "@/app/components/ShelfView"
import { ImageUploadModal } from "@/app/components/ImageUploadModal"
import { AiInlineMenu } from "@/app/components/AiInlineMenu"
import { PulpLoadingScreen } from "@/app/components/PulpLoadingScreen"
import { AnimatedCounter } from "@/components/ui/animated-counter"

function PageNumberInput({ currentPageIdx, totalPages, theme, onNavigate }: {
  currentPageIdx: number; totalPages: number; theme: "light" | "dark"; onNavigate: (idx: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const color = theme === "dark" ? "#9ca3af" : "#4b5563"
  const fontStyle: React.CSSProperties = { color, fontFamily: '"SF Mono","Fira Code","Roboto Mono",monospace', fontWeight: 600, fontSize: 13 }

  const commit = (val: string) => {
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 1) onNavigate(Math.min(n, totalPages) - 1)
    setEditing(false)
  }

  if (editing) return (
    <div className="relative px-1 cursor-text" style={fontStyle}>
      {/* Hidden real input captures keyboard */}
      <input
        ref={inputRef}
        value={draft}
        onChange={e => {
          const raw = e.target.value.replace(/\D/g, "").slice(0, 3)
          setDraft(raw)
        }}
        onBlur={() => commit(draft)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(draft) } if (e.key === "Escape") setEditing(false) }}
        inputMode="numeric"
        className="absolute inset-0 opacity-0 w-full"
        style={{ caretColor: "transparent" }}
      />
      {/* Visual display */}
      <span style={{ opacity: 0.9 }}>{draft || ""}</span>
      <span
        className="inline-block w-[1px] h-[1em] align-middle ml-[1px]"
        style={{ backgroundColor: color, animation: "pulp-blink 1s step-end infinite" }}
      />
      <style>{`@keyframes pulp-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  )

  return (
    <div
      className="px-1 cursor-text select-none"
      title="Click to jump to page"
      style={{ ...fontStyle, opacity: 0.8 }}
      onClick={() => { setDraft(""); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0) }}
    >
      <AnimatedCounter value={currentPageIdx + 1} />
    </div>
  )
}

// ─── Memoized global styles — prevents font flickering on every NoteApp re-render
const GlobalStyles = memo(function GlobalStyles({ reduceMotion, theme, handwrittenEffect }: { reduceMotion: boolean, theme: "light" | "dark", handwrittenEffect: boolean }) {
  return (<>
    <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Bilbo&family=Licorice&family=Original+Surfer&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Caveat&family=Gochi+Hand&family=Indie+Flower&family=Dancing+Script&display=swap');@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');${reduceMotion ? "*, *::before, *::after { transition: none !important; animation: none !important; }" : ""} .ls-toolbar { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; letter-spacing: -0.01em; } @keyframes slide-up-fade { 0% { opacity: 0; transform: translateY(12px); filter: blur(2px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } } @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } } @keyframes leaf-sway { 0%, 100% { transform: rotate(-1deg); } 50% { transform: rotate(1deg); } } @keyframes bulb-pull { 0% { transform: translateY(0); } 30% { transform: translateY(6px); } 65% { transform: translateY(-2px); } 100% { transform: translateY(0); } } @keyframes orange-bounce { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } } @keyframes orange-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .anim-slide-up { opacity: 0; animation: slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; } .anim-fade-in { opacity: 0; animation: fade-in 0.4s ease-out forwards; } @keyframes erase-fade { 0% { opacity: 0.6; filter: blur(0.4px); transform: translateY(0.5px) rotate(-1deg); } 15% { opacity: 0.45; filter: blur(1.5px); transform: translateY(1px) rotate(-1.5deg); } 100% { opacity: 0; filter: blur(4px); transform: translateY(2px) rotate(-2deg); } } .erased { text-decoration: line-through; text-decoration-thickness: 1.5pt; text-decoration-color: rgba(0,0,0,0.6); pointer-events: none; user-select: none; display: inline-block; animation: erase-fade 6s forwards cubic-bezier(0.4, 0, 1, 1); vertical-align: baseline; white-space: pre; } [contenteditable] { ${handwrittenEffect ? "filter: url(#handwritten-jitter);" : ""} outline: none !important; cursor: url('/pencil.png'), text; } [data-box-style="margin"], [data-box-style="margin"] * { color: rgba(0,0,0,0.32) !important; }` }} />
    {theme === "dark" && <style dangerouslySetInnerHTML={{ __html: `.ls-toolbar { background-color: rgba(18,18,20,0.85) !important; border-color: rgba(255,255,255,0.08) !important; box-shadow: 0 4px 32px rgba(0,0,0,0.5) !important; backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; } .ls-toolbar .hover\\:bg-zinc-200, .ls-toolbar .hover\\:bg-zinc-100 { color: #A1A1AA !important; background-color: transparent !important; border-color: transparent !important; box-shadow: none !important; } .ls-toolbar .hover\\:bg-zinc-200:hover, .ls-toolbar .hover\\:bg-zinc-100:hover { background-color: rgba(255,255,255,0.08) !important; color: #FAFAFA !important; } .ls-toolbar select, .ls-toolbar input { background-color: rgba(255,255,255,0.05) !important; color: #FAFAFA !important; border-color: rgba(255,255,255,0.08) !important; } .ls-toolbar .text-zinc-600 { color: #A1A1AA !important; } .ls-toolbar .border-zinc-200, .ls-toolbar .border-zinc-200\\/80 { border-color: rgba(255,255,255,0.08) !important; } .ls-toolbar .bg-white, .ls-toolbar .bg-zinc-50 { background-color: transparent !important; }` }} />}
    <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      <filter id="handwritten-jitter" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.08 0.05" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" result="wobble" />
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" result="noise2" />
        <feDisplacementMap in="wobble" in2="noise2" scale="2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  </>)
})

function htmlToPlain(html: string): string {
  return html.replace(/<br\s*\/?>\n/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
}

// ─── Memoized spiral binding — NEVER re-renders during box operations ──────────
const SpiralBinding = memo(function SpiralBinding({ theme, showBinding, bindingCompact, paperBg }: {
  theme: "light" | "dark"; showBinding: boolean; bindingCompact: boolean; paperBg: string
}) {
  if (!showBinding) return null
  if (!bindingCompact) return (
    <div className="absolute left-[-24px] top-0 bottom-0 w-16 z-30 pointer-events-none flex flex-col justify-center overflow-visible">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="relative w-full h-[32px]">
          <div className="absolute left-[34px] top-2 w-4 h-5 rounded-sm shadow-[inset_2px_3px_5px_rgba(0,0,0,0.5)]" style={{ backgroundColor: paperBg }} />
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

const BoxItem = memo(function BoxItem({
  box, isSelected, selectedCount, loadingBoxId, accentSolid, theme,
  startDrag, startResize, deleteBox, updateBox, updateBoxContent, setSelectedBoxIds,
  onKeyDown, onInput, onRewrite, onImageGen,
  formattingOpen, setFormattingOpen, aiOpen, setAiOpen,
  onDragStart, onDragEnd
}: {
  box: TextBoxType; isSelected: boolean; selectedCount: number; loadingBoxId: string | null; accentSolid: string; theme: "light" | "dark"
  startDrag: (e: React.MouseEvent, box: TextBoxType) => void
  startResize: (e: React.MouseEvent, box: TextBoxType, handle: string) => void
  deleteBox: (id: string) => void
  updateBox: (id: string, updates: Partial<TextBoxType>) => void
  updateBoxContent: (id: string, v: string) => void
  setSelectedBoxIds: (v: Set<string> | ((p: Set<string>) => Set<string>)) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  onInput: (e: React.FormEvent<HTMLElement>) => void
  onRewrite: (text: string, id: string) => void
  onImageGen: (text: string, id: string) => void
  formattingOpen: boolean; setFormattingOpen: (v: boolean) => void
  aiOpen: boolean; setAiOpen: (v: boolean) => void
  onDragStart: () => void; onDragEnd: () => void
}) {
  const [localDragging, setLocalDragging] = useState(false)
  const resizeHandles: [string, React.CSSProperties][] = [
    ["nw", { top: -4, left: -4, width: 6, height: 6, borderRadius: "50%", background: "white", border: `1px solid ${accentSolid}88`, cursor: "nw-resize" }],
    ["ne", { top: -4, right: -4, width: 6, height: 6, borderRadius: "50%", background: "white", border: `1px solid ${accentSolid}88`, cursor: "ne-resize" }],
    ["sw", { bottom: -4, left: -4, width: 6, height: 6, borderRadius: "50%", background: "white", border: `1px solid ${accentSolid}88`, cursor: "sw-resize" }],
    ["se", { bottom: -4, right: -4, width: 6, height: 6, borderRadius: "50%", background: "white", border: `1px solid ${accentSolid}88`, cursor: "se-resize" }],
    ["n", { top: -2, left: 4, right: 4, height: 5, cursor: "n-resize", background: "transparent" }],
    ["s", { bottom: -2, left: 4, right: 4, height: 5, cursor: "s-resize", background: "transparent" }],
    ["e", { top: 4, bottom: 4, right: -2, width: 5, cursor: "e-resize", background: "transparent" }],
    ["w", { top: 4, bottom: 4, left: -2, width: 5, cursor: "w-resize", background: "transparent" }],
  ]
  const isImage = box.content.includes("http") || box.content.startsWith("data:image")
  const isSticky = !!box.boxHighlightColor
  return (
    <div
      id={`box-${box.id}`}
      onMouseDown={e => {
        setLocalDragging(true); onDragStart(); startDrag(e, box);
        const up = () => { setLocalDragging(false); onDragEnd(); window.removeEventListener('mouseup', up) }
        window.addEventListener('mouseup', up)
      }}
      onClick={e => {
        // Clicking anywhere on a sticky focuses its text area
        if (isSticky) {
          const ta = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[contenteditable]')
          ta?.focus()
        }
      }}
      style={{
        position: "absolute", left: box.x, top: box.y, width: box.w,
        // Sticky: always fixed height. Regular: auto-grow.
        height: isSticky ? box.h : "auto", minHeight: isSticky ? undefined : box.h,
        transform: `rotate(${box.boxRotation || 0}deg)`,
        border: (box.boxOutlineWidth || 0) > 0 ? `${box.boxOutlineWidth}px solid ${theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}` : (isSelected ? `1px solid ${accentSolid}44` : "1px solid transparent"),
        borderRadius: 2, backgroundColor: box.boxHighlightColor || "transparent",
        zIndex: isSelected ? 100 : 50, overflow: isSticky ? "hidden" : "visible", cursor: "grab",
        boxShadow: isSticky
          ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          : "none",
        transition: localDragging ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {isSelected && (<>
        <div style={{ position: "absolute", inset: 0, border: `1.5px solid ${accentSolid}`, borderRadius: 2, animation: "box-ripple 0.45s ease-out forwards", pointerEvents: "none", zIndex: 55 }} />
        <div style={{ position: "absolute", inset: 0, border: `1px solid ${accentSolid}`, borderRadius: 2, animation: "box-ripple-2 0.7s 0.05s ease-out forwards", pointerEvents: "none", zIndex: 54 }} />
      </>)}
      {/* Resize handles — hidden for sticky notes */}
      {isSelected && !isSticky && resizeHandles.map(([h, pos]) => (
        <div key={h} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onDragStart(); startResize(e, box, h) }}
          style={{ position: "absolute", zIndex: 20, ...pos }} />
      ))}
      {isSelected && (
        <button
          onMouseDown={e => { e.stopPropagation(); deleteBox(box.id) }}
          className="hover:scale-110 active:scale-95 transition-transform"
          style={{ position: "absolute", top: isSticky ? 10 : 6, right: 8, background: "rgba(0,0,0,0.12)", border: "none", cursor: "pointer", fontSize: 14, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", lineHeight: 1, color: "rgba(0,0,0,0.5)", zIndex: 120 }}>×</button>
      )}
      {/* Rotation handle — to the right of the × button */}
      {isSelected && !isSticky && (
        <div
          title="Rotate"
          onMouseDown={e => {
            e.preventDefault(); e.stopPropagation()
            const el = document.getElementById(`box-${box.id}`)
            if (!el) return
            const rect = el.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI
            const startRotation = box.boxRotation || 0
            const onMove = (me: MouseEvent) => {
              const a = Math.atan2(me.clientY - cy, me.clientX - cx) * 180 / Math.PI
              updateBox(box.id, { boxRotation: startRotation + (a - startAngle) })
            }
            const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
          }}
          style={{
            position: "absolute", top: 6, right: -22,
            width: 14, height: 14, borderRadius: "50%",
            background: "white", border: `1.5px solid ${accentSolid}`,
            cursor: "grab", zIndex: 120,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={accentSolid} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6" /><path d="M2.5 12a10 10 0 0 1 18-6" />
          </svg>
        </div>
      )}
      {isSelected && selectedCount === 1 && !isImage && !isSticky && (
        <BoxToolbar box={box} accentSolid={accentSolid} theme={theme} onUpdateBox={updateBox} onRewrite={onRewrite} onImageGen={onImageGen}
          formattingOpen={formattingOpen} setFormattingOpen={setFormattingOpen} aiOpen={aiOpen} setAiOpen={setAiOpen} />
      )}

      {/* Drag handle — hidden for sticky (whole surface is draggable) */}
      {isSelected && !isSticky && (
        <div
          onMouseDown={e => startDrag(e, box)}
          style={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", width: 40, height: 12, background: accentSolid, opacity: 0.15, borderRadius: "0 0 6px 6px", cursor: "grab", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <div style={{ width: 14, height: 2, background: "rgba(0,0,0,0.5)", borderRadius: 1 }} />
        </div>
      )}

      {/* Sticky note top strip */}
      {isSticky && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 32,
          background: "rgba(255,255,255,0.18)",
          borderRadius: "2px 2px 0 0",
          zIndex: 10, pointerEvents: "none",
        }} />
      )}

      <div style={{ padding: isSticky ? "40px 10px 10px" : "5px 7px", height: isSticky ? "100%" : undefined, boxSizing: isSticky ? "border-box" : undefined, overflowY: isSticky ? "auto" : undefined }}>
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
            boxHighlightColor={box.boxHighlightColor}
            isSticky={isSticky}
            onUpdate={(id, updates) => updateBox(id, updates)}
            onFocus={() => setSelectedBoxIds(new Set([box.id]))}
            onKeyDown={onKeyDown}
            onInput={onInput}
          />
        )}
      </div>
    </div>
  )
})

const BOX_HEADING_SIZES: Record<string, number> = { h1: 28, h2: 22, h3: 18, default: 18, margin: 26 }
const BOX_HEADING_WEIGHTS: Record<string, number> = { h1: 800, h2: 700, h3: 700, default: 400, margin: 400 }
const BOX_FONTS = [
  { value: "'Caveat', cursive", label: "Handwritten" },
  { value: "'Gochi Hand', cursive", label: "Gochi Hand" },
  { value: "'Indie Flower', cursive", label: "Marker" },
  { value: "'Dancing Script', cursive", label: "Script" },
  { value: "", label: "Garamond" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: '"Courier New", monospace', label: "Mono" },
]
const BOX_SIZES = [8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72]
const BOX_STYLES = [
  { value: "default", label: "NA" },
  { value: "h1", label: "H1" },
  { value: "h2", label: "H2" },
  { value: "h3", label: "H3" },
  { value: "margin", label: "Mg" },
]

const BoxToolbar = memo(function BoxToolbar({ box, accentSolid, theme, onUpdateBox, onRewrite, onImageGen, formattingOpen, setFormattingOpen, aiOpen, setAiOpen }: {
  box: TextBoxType; accentSolid: string; theme: "light" | "dark"
  onUpdateBox: (id: string, updates: Partial<TextBoxType>) => void
  onRewrite: (text: string, id: string) => void
  onImageGen: (text: string, id: string) => void
  formattingOpen: boolean; setFormattingOpen: (v: boolean) => void
  aiOpen: boolean; setAiOpen: (v: boolean) => void
}) {
  const [open, setOpen] = useState<"style" | "font" | "size" | "color" | "textColor" | null>(null)
  const [anchorLeft, setAnchorLeft] = useState(0)
  const [customSize, setCustomSize] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const styleBtnRef = useRef<HTMLButtonElement>(null)
  const fontBtnRef = useRef<HTMLButtonElement>(null)
  const sizeBtnRef = useRef<HTMLButtonElement>(null)
  const colorBtnRef = useRef<HTMLButtonElement>(null)
  const textColorBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(null) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const openDropdown = (type: any) => {
    const btnRef = type === "style" ? styleBtnRef : type === "font" ? fontBtnRef : type === "size" ? sizeBtnRef : type === "textColor" ? textColorBtnRef : colorBtnRef
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

  const dk = theme === "dark"
  const dropdownBase: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 4px)", left: anchorLeft,
    background: dk ? "#1f1f23" : "#ffffff", border: `1px solid ${dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.09)"}`,
    borderRadius: 6, padding: 3,
    boxShadow: dk ? "0 4px 12px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
    zIndex: 400, minWidth: 90,
  }
  const optionBtn = (active: boolean): React.CSSProperties => ({
    display: "block", width: "100%", textAlign: "left", paddingTop: 5, paddingBottom: 5, paddingLeft: 9, paddingRight: 9,
    fontSize: 10, fontWeight: active ? 600 : 400, border: "none",
    background: active ? (dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)") : "transparent",
    cursor: "pointer", color: dk ? "#e4e4e7" : "#18181b", borderRadius: 4,
    fontFamily: "'Inter', sans-serif",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  })
  const triggerStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 500, fontStyle: "italic", color: "#71717a", background: "none", border: "none",
    cursor: "pointer", paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6, borderRadius: 4,
    display: "flex", alignItems: "center", gap: 3, letterSpacing: "0.01em",
    fontFamily: "'EB Garamond', serif",
  }
  const chevron = <svg width="7" height="5" viewBox="0 0 10 6" fill="currentColor" style={{ opacity: 0.45, flexShrink: 0 }}><path d="M0 0l5 6 5-6z" /></svg>
  // Handlers
  const highlightColors = ["transparent", "rgba(239,68,68,0.15)", "rgba(249,115,22,0.15)", "rgba(234,179,8,0.15)", "rgba(34,197,94,0.15)", "rgba(14,165,233,0.15)", "rgba(59,130,246,0.15)", "rgba(168,85,247,0.15)", "rgba(236,72,153,0.15)", "rgba(156,163,175,0.15)"]
  const textColors = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#52525b", "#d4d4d8"]
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {e.stopPropagation()}, [])

  const applyInlineCSS = useCallback((css: string): boolean => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false
    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    span.setAttribute('style', css)
    try {
      range.surroundContents(span)
    } catch {
      const frag = range.extractContents()
      span.appendChild(frag)
      range.insertNode(span)
    }
    const ce = span.closest('[contenteditable]')
    if (ce) ce.dispatchEvent(new InputEvent('input', { bubbles: true }))
    return true
  }, [])

  return (
    <div ref={ref} onMouseDown={e => e.stopPropagation()} style={{
      position: "absolute", top: -22, left: -24,
      display: "flex", alignItems: "center", gap: 6,
      background: "transparent",
      zIndex: 9999, whiteSpace: "nowrap",
      pointerEvents: "auto",
    }}>
      <button onClick={() => { setFormattingOpen(!formattingOpen); setAiOpen(false); setOpen(null) }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", justifyContent: "center", color: formattingOpen ? accentSolid : "#a1a1aa", opacity: formattingOpen ? 1 : 0.6, borderRadius: 4, transition: "all 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = formattingOpen ? "1" : "0.6"}>
        {!formattingOpen ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        )}
      </button>


      <div style={{
        overflow: "hidden",
        maxWidth: !formattingOpen ? 0 : 400,
        opacity: !formattingOpen ? 0 : 1,
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        background: formattingOpen ? (dk ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : "transparent",
        borderRadius: 6,
        padding: formattingOpen ? "0 2px" : 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 1, whiteSpace: "nowrap" }}>
          <button ref={styleBtnRef} style={triggerStyle} onMouseDown={e => { e.preventDefault(); openDropdown("style") }}>
            {BOX_STYLES.find(s => s.value === styleKey)?.label} {chevron}
          </button>
          <button ref={fontBtnRef} style={{ ...triggerStyle, fontFamily: currentFont.value || "'EB Garamond', serif" }} onMouseDown={e => { e.preventDefault(); openDropdown("font") }}>
            {currentFont.label.toLowerCase()} {chevron}
          </button>
          <button ref={sizeBtnRef} style={triggerStyle} onMouseDown={e => { e.preventDefault(); openDropdown("size") }}>
            {currentSize}px {chevron}
          </button>

          <button ref={textColorBtnRef} style={{ ...triggerStyle, color: "#a1a1aa", marginLeft: 4 }} onMouseDown={e => { e.preventDefault(); openDropdown("textColor") }} title="Text color">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h16"></path>
              <path d="m6 16 6-12 6 12"></path>
              <path d="M8 12h8"></path>
            </svg>
          </button>

          <button style={{ ...triggerStyle, color: "#a1a1aa", marginLeft: 4 }} onMouseDown={e => {
            e.preventDefault()
            const temp = document.createElement("div");
            temp.innerHTML = box.content;
            const plain = temp.textContent || temp.innerText || "";
            onUpdateBox(box.id, {
              content: plain,
              boxFontFamily: "",
              boxFontSize: 14,
              boxHeadingStyle: "default",
              boxHighlightColor: "transparent",
              textAlign: "left"
            });
            setOpen(null)
          }} title="Clear formatting">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path>
              <path d="M22 21H7"></path>
              <path d="m5 11 9 9"></path>
            </svg>
          </button>

          {open === "style" && (
            <div style={dropdownBase}>
              {BOX_STYLES.map(s => {
                const sizeMap: Record<string, number> = { h1: 28, h2: 22, h3: 18, default: 18, margin: 26 }
                const weightMap: Record<string, number> = { h1: 800, h2: 700, h3: 700, default: 400, margin: 400 }
                const css = s.value === "margin"
                  ? `font-family: 'Shadows Into Light', cursive; font-size: 26px; font-style: italic`
                  : `font-size: ${sizeMap[s.value]}px; font-weight: ${weightMap[s.value]}`
                return (
                  <button key={s.value} style={optionBtn(styleKey === s.value)} onMouseDown={e => {
                    e.preventDefault()
                    if (!applyInlineCSS(css)) onUpdateBox(box.id, { boxHeadingStyle: s.value as any })
                    setOpen(null)
                  }}>{s.label}</button>
                )
              })}
            </div>
          )}
          {open === "font" && (
            <div style={dropdownBase}>
              {BOX_FONTS.map(f => (
                <button key={f.value} style={{ ...optionBtn(currentFont.value === f.value), fontFamily: f.value || "'EB Garamond', serif" }} onMouseDown={e => {
                  e.preventDefault()
                  if (!applyInlineCSS(`font-family: ${f.value || "'EB Garamond', serif"}`)) onUpdateBox(box.id, { boxFontFamily: f.value })
                  setOpen(null)
                }}>{f.label.toLowerCase()}</button>
              ))}
            </div>
          )}
          {open === "size" && (
            <div style={{ ...dropdownBase, display: "flex", flexDirection: "column", maxHeight: 220 }}>
              <div style={{ padding: "4px 6px 6px", borderBottom: "1px solid rgba(0,0,0,0.06)", marginBottom: 3, flexShrink: 0 }}>
                <input type="number" min={1} max={400} placeholder="Custom…" value={customSize} onChange={e => setCustomSize(e.target.value)} onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter" && customSize) { const n = parseInt(customSize); if (n > 0) { if (!applyInlineCSS(`font-size: ${n}px`)) onUpdateBox(box.id, { boxFontSize: n }); setOpen(null); setCustomSize("") } } }} style={{ width: "100%", border: `1px solid ${dk ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.10)"}`, borderRadius: 4, padding: "3px 7px", fontSize: 11, outline: "none", color: dk ? "#e4e4e7" : "#18181b", background: dk ? "#2a2a2e" : "#fafafa" }} />
              </div>
              <div style={{ overflowY: "auto" }}>
                {BOX_SIZES.map(sz => <button key={sz} style={optionBtn(currentSize === sz)} onMouseDown={e => { e.preventDefault(); if (!applyInlineCSS(`font-size: ${sz}px`)) onUpdateBox(box.id, { boxFontSize: sz }); setOpen(null) }}>{sz}px</button>)}
              </div>
            </div>
          )}
          {open === "color" && (
            <div style={{ ...dropdownBase, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, padding: 6 }}>
              {highlightColors.map(c => <button key={c} onClick={() => { onUpdateBox(box.id, { boxHighlightColor: c }); setOpen(null) }} style={{ width: 18, height: 18, borderRadius: 3, background: c, border: c === "transparent" ? "1px solid rgba(150,150,150,0.4)" : `1px solid ${c.replace("0.15)", "0.45)")}`, cursor: "pointer" }} />)}
            </div>
          )}
          {open === "textColor" && (
            <div style={{ ...dropdownBase, minWidth: 140, padding: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, marginBottom: 8 }}>
                {textColors.map(c => (
                  <button
                    key={c}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      document.execCommand('foreColor', false, c)
                      setOpen(null)
                    }}
                    style={{ width: 22, height: 22, borderRadius: 4, background: c, border: `1px solid ${dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, cursor: "pointer" }}
                  />
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, paddingTop: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", paddingLeft: 2 }}>
                  <input
                    type="color"
                    onMouseDown={(e) => e.preventDefault()}
                    onInput={e => {
                      document.execCommand('foreColor', false, (e.target as HTMLInputElement).value)
                    }}
                    style={{ width: 16, height: 16, padding: 0, border: "none", borderRadius: 3, cursor: "pointer", background: "transparent" }}
                  />
                  <span style={{ fontSize: 10, color: dk ? "#a1a1aa" : "#71717a", fontWeight: 500 }}>Custom color</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Menu */}
      <div style={{
        overflow: "hidden",
        maxWidth: aiOpen ? 400 : 0,
        opacity: aiOpen ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        background: aiOpen ? (dk ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : "transparent",
        borderRadius: 6,
        padding: aiOpen ? "0 2px" : 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
          <button style={triggerStyle} onClick={() => { onRewrite(box.content, box.id); setAiOpen(false) }}>Rewrite</button>
          <button style={triggerStyle} onClick={() => { onImageGen(box.content, box.id); setAiOpen(false) }}>Img Gen</button>
          <div style={{ width: 1, height: 12, background: dk ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", margin: "0 6px", transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }} />
          {(["left", "center", "right"] as const).map(align => (
            <button key={align} style={{ ...triggerStyle, padding: "2px 4px", color: box.textAlign === align ? accentSolid : triggerStyle.color }}
              onClick={() => onUpdateBox(box.id, { textAlign: align })}>
              {align === "left" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>}
              {align === "center" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" /></svg>}
              {align === "right" && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" /></svg>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

interface BoxTextareaProps {
  id: string; content: string; textAlign?: string
  boxFontFamily?: string; boxFontSize?: number; boxHeadingStyle?: string; boxHighlightColor?: string
  isSticky?: boolean
  onUpdate: (id: string, updates: Partial<TextBoxType>) => void
  onFocus: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  onInput: (e: React.FormEvent<HTMLElement>) => void
}

const BoxTextarea = memo(function BoxTextarea({
  id, content, textAlign, boxFontFamily, boxFontSize, boxHeadingStyle, isSticky, onUpdate, onFocus, onKeyDown, onInput
}: BoxTextareaProps) {
  const ref = useRef<HTMLDivElement>(null)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== content) {
      ref.current.innerHTML = content
    }
  }, [content])

  const syncState = useCallback(() => {
    if (!ref.current) return
    const v = ref.current.innerHTML
    // Sticky notes never auto-resize — only save content
    if (isSticky) {
      onUpdate(id, { content: v })
    } else {
      const sh = ref.current.scrollHeight
      onUpdate(id, { content: v, h: Math.max(sh, 32) })
    }
  }, [id, isSticky, onUpdate])

  const styleKey = boxHeadingStyle || "default"
  const isMarginStyle = styleKey === "margin"
  const resolvedSize = boxFontSize ?? BOX_HEADING_SIZES[styleKey]
  const resolvedWeight = BOX_HEADING_WEIGHTS[styleKey]
  const resolvedFont = isMarginStyle ? "'Shadows Into Light', cursive" : (boxFontFamily || "'Caveat', cursive")

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-box-style={styleKey}
      onKeyDown={e => {
        onKeyDown(e)
        if (!e.defaultPrevented) e.stopPropagation()
      }}
      onInput={e => {
        onInput(e)
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(syncState, 500)
      }}
      onMouseDown={e => e.stopPropagation()}
      onFocus={() => { onFocus() }}
      onBlur={() => {
        clearTimeout(timerRef.current)
        syncState()
      }}
      style={{
        width: "100%", outline: "none",
        height: isSticky ? "100%" : undefined,
        minHeight: isSticky ? undefined : "100%",
        fontFamily: resolvedFont, fontSize: resolvedSize, fontWeight: resolvedWeight,
        lineHeight: 1.45, color: isMarginStyle ? "rgba(0,0,0,0.32)" : "#1a1a1a", cursor: "text",
        fontStyle: isMarginStyle ? "italic" : "normal",
        transform: isMarginStyle ? "rotate(-1.2deg) skewX(-2deg)" : undefined,
        transformOrigin: "top left",
        WebkitFontSmoothing: isMarginStyle ? ("antialiased" as any) : undefined,
        textAlign: (textAlign || "left") as any, wordWrap: "break-word",
        overflow: isSticky ? "hidden" : "visible",
        backgroundColor: "transparent",
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
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [isSidebarDragging, setIsSidebarDragging] = useState(false)
  const sidebarDragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const startSidebarDrag = useCallback((startX: number) => {
    const startWidth = sidebarWidth
    sidebarDragRef.current = { startX, startWidth }
    setIsSidebarDragging(true)
    const onMove = (ev: MouseEvent) => {
      if (!sidebarDragRef.current) return
      const dx = ev.clientX - sidebarDragRef.current.startX
      setSidebarWidth(Math.max(0, Math.min(400, sidebarDragRef.current.startWidth + dx)))
    }
    const onUp = (ev: MouseEvent) => {
      sidebarDragRef.current = null
      setIsSidebarDragging(false)
      const dx = Math.abs(ev.clientX - startX)
      if (dx < 5) {
        setSidebarWidth(prev => prev > 0 ? 0 : 256)
      } else {
        setSidebarWidth(w => w < 100 ? 0 : w)
      }
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [sidebarWidth])
  const [gridView, setGridView] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [bindingCompact, setBindingCompact] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<number | null>(null)
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)
  const [sketchMode, setSketchMode] = useState(false)
  const [sketchPrompt, setSketchPrompt] = useState("")
  const [drawLineMode, setDrawLineMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDrawToolbar, setShowDrawToolbar] = useState(false)
  const [contentSidebarOpen, setContentSidebarOpen] = useState(false)
  const [customSize, setCustomSize] = useState("16")
  const [allCompacted, setAllCompacted] = useState(false)
  const [toolbarFormattingOpen, setToolbarFormattingOpen] = useState(false)
  const [toolbarAiOpen, setToolbarAiOpen] = useState(false)
  const [currentView, setCurrentView] = useState<"editor" | "shelf">("editor")
  const [isAnyBoxDragging, setIsAnyBoxDragging] = useState(false)


  // Settings
  const [accent, setAccent] = useState("#600b2779")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [autoSave, setAutoSave] = useState(true)
  const [spellCheck, setSpellCheck] = useState(true)
  const [editorFont, setEditorFont] = useState("Caveat")
  const [lineSpacing, setLineSpacing] = useState<"compact" | "normal" | "relaxed">("normal")
  const [paperStyle, setPaperStyle] = useState<"lined" | "dotgrid" | "plain" | "stenopad" | "parchment" | "kraft" | "ledger">("lined")
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [showBinding, setShowBinding] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [sidebarOnStart, setSidebarOnStart] = useState(true)
  const [bgEffect, setBgEffect] = useState(true)
  const [smearEffect, setSmearEffect] = useState(true)
  const [handwrittenEffect, setHandwrittenEffect] = useState(true)

  const [activeTool, setActiveTool] = useState('select')
  const [stickyColor, setStickyColor] = useState('#fef08a')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const editorRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)

  const placeHorizontalLine = useCallback((e: React.MouseEvent) => {
    if (!paperRef.current || !activeTabId) return
    e.preventDefault()
    const r = paperRef.current.getBoundingClientRect()
    const scale = Number(zoom) || 1
    const y = (e.clientY - r.top) / scale
    const id = uid()
    const width = paperRef.current.clientWidth - 128
    const newBox: TextBoxType = {
      id,
      x: 64, y: y - 10, w: width, h: 24,
      content: `<hr style="border:none;border-top:2px solid currentColor;width:100%;opacity:0.6" />`,
      boxHighlightColor: 'transparent',
      boxOutlineWidth: 0,
      boxFontSize: 16,
    }
    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
      ...n,
      boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), newBox] }
    }))
    setActiveTool('select')
  }, [activeTabId, currentPageIdx, setNotes, zoom])

  // ─── Sticky note placement — handled directly in page to avoid stale hook state ─
  const placeStickyNote = useCallback((e: React.MouseEvent) => {
    if (!paperRef.current || !activeTabId) return
    e.preventDefault()
    const r = paperRef.current.getBoundingClientRect()
    const scale = Number(zoom) || 1
    const x = (e.clientX - r.left) / scale
    const y = (e.clientY - r.top) / scale
    const id = uid()
    const rotation = parseFloat((Math.random() * 4 - 2).toFixed(1))
    const newBox: TextBoxType = {
      id,
      x: x - 150, y: y - 150, w: 300, h: 300,
      content: '',
      boxHighlightColor: stickyColor,
      boxFontFamily: '"Bilbo", cursive',
      boxFontSize: 24,
      boxOutlineWidth: 0,
      boxRotation: rotation,
    }
    setNotes(prev => prev.map(n => n.id !== activeTabId ? n : {
      ...n,
      boxes: { ...n.boxes, [currentPageIdx]: [...(n.boxes[currentPageIdx] || []), newBox] }
    }))
    setActiveTool('select')
    setTimeout(() => {
      const node = document.getElementById(`box-${id}`)
      if (node) {
        node.animate([
          { transform: `scale(0.6) rotate(${newBox.boxRotation}deg)`, opacity: 0 },
          { transform: `scale(1.08) rotate(${newBox.boxRotation}deg)`, opacity: 1, offset: 0.7 },
          { transform: `scale(1) rotate(${newBox.boxRotation}deg)`, opacity: 1 },
        ], { duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' })
      }
    }, 0)
  }, [activeTabId, currentPageIdx, stickyColor, zoom, setNotes])

  const activeNote = useMemo(
    () => (notes.find(n => n.id === activeTabId) ?? notes[0]) as NoteData,
    [notes, activeTabId]
  )

  // Dialog helpers
  const openPrompt = useCallback((title: string, defaultValue: string, placeholder: string, confirmLabel: string, onConfirm: (v: string) => void) => setDialog({ type: "prompt", title, defaultValue, placeholder, confirmLabel, onConfirm }), [])
  const openConfirm = useCallback((title: string, message: string, confirmLabel: string, danger: boolean, onConfirm: () => void) => setDialog({ type: "confirm", title, message, confirmLabel, danger, onConfirm }), [])
  const openAlert = useCallback((title: string, message?: string) => setDialog({ type: "alert", title, message }), [])

  // Hooks
  const editor = useEditor({ editorRef, activeTabId, currentPageIdx, setNotes, accent })
  const boxes = useBoxDrawing({
    activeTabId, currentPageIdx, zoom, accent, notes, setNotes, paperRef,
    sketchMode, sketchPrompt, setSketchMode, setSketchPrompt,
    drawLineMode, setDrawLineMode, activeTool, setActiveTool, stickyColor
  })
  const drawing = useDrawing({ canvasRef, activeTool, accent, zoom, currentPageIdx, setNotes, activeTabId, notes })

  // Slash (@ and /) menu
  const [slashMenu, setSlashMenu] = useState<{ x: number; y: number; filter: string; type: "editor" | "textarea"; mode: "@" | "/"; target?: HTMLElement; isSelectionMode?: boolean } | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [aiMenu, setAiMenu] = useState<{ x: number; y: number; selectedText?: string } | null>(null)
  const slashMenuRef = useRef<{ x: number; y: number; filter: string; type: "editor" | "textarea"; mode: "@" | "/"; target?: HTMLElement; isSelectionMode?: boolean } | null>(null)
  const slashAnchorRef = useRef<{ node: Node; offset: number } | null>(null)
  const slashFilterSpanRef = useRef<HTMLSpanElement | null>(null)

  const closeSlashMenu = useCallback(() => {
    if (slashFilterSpanRef.current) {
      slashFilterSpanRef.current.remove()
      slashFilterSpanRef.current = null
    }
    slashMenuRef.current = null
    slashAnchorRef.current = null
    setSlashMenu(null)
  }, [])

  const handleCompactAll = useCallback(() => {
    const allDetails = Array.from(
      document.querySelectorAll('details.toggle-block')
    ) as HTMLDetailsElement[]
    const anyOpen = allDetails.some(d => d.open)
    allDetails.forEach(d => { d.open = !anyOpen })
    setAllCompacted(anyOpen)
    editor.syncContent()
  }, [editor])


  const executeSlashItem = useCallback((action: () => void) => {
    const m = slashMenuRef.current
    const anchor = slashAnchorRef.current
    const filter = m?.filter ?? ""

    if (!m?.isSelectionMode) {
      if (m?.type === "textarea" && anchor) {
        try {
          const textNode = anchor.node as Text
          if (textNode.nodeType === Node.TEXT_NODE) {
            // Delete "@" plus ghost span (filter chars were not typed into the box)
            const r = document.createRange()
            r.setStart(textNode, anchor.offset)
            if (slashFilterSpanRef.current?.isConnected) {
              r.setEndAfter(slashFilterSpanRef.current)
            } else {
              r.setEnd(textNode, Math.min(anchor.offset + 1, textNode.length))
            }
            const sel = window.getSelection()
            sel?.removeAllRanges()
            sel?.addRange(r)
            document.execCommand("delete")
            slashFilterSpanRef.current = null
          }
        } catch { }
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
        } catch { }
      }
    }

    closeSlashMenu()
    if (m?.type === "editor") editorRef.current?.focus()
    else if (m?.target) m.target.focus()

    editor.saveSelection()
    action()
  }, [closeSlashMenu, editorRef, editor])

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    // Intercept typing while @ menu is open in a box (non-selection mode)
    if (slashMenuRef.current?.type === "textarea" && slashMenuRef.current?.mode === "@" && !slashMenuRef.current?.isSelectionMode) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
        closeSlashMenu()
        // fall through to let cursor move
      } else if (e.key === "Backspace") {
        e.preventDefault()
        const f = slashMenuRef.current.filter ?? ""
        if (f.length > 0) {
          const newFilter = f.slice(0, -1)
          if (slashFilterSpanRef.current) {
            if (newFilter === "") {
              slashFilterSpanRef.current.remove()
              slashFilterSpanRef.current = null
            } else {
              slashFilterSpanRef.current.textContent = newFilter
            }
          }
          const updated = { ...slashMenuRef.current, filter: newFilter }
          slashMenuRef.current = updated
          setSlashMenu(updated)
        } else {
          // Filter empty — Backspace deletes "@" and closes menu
          const anchor = slashAnchorRef.current
          if (anchor && anchor.node.nodeType === Node.TEXT_NODE) {
            const textNode = anchor.node as Text
            if (anchor.offset < textNode.length) {
              const r = document.createRange()
              r.setStart(textNode, anchor.offset)
              r.setEnd(textNode, anchor.offset + 1)
              const sel = window.getSelection()
              sel?.removeAllRanges()
              sel?.addRange(r)
              document.execCommand("delete")
            }
          }
          closeSlashMenu()
        }
        return
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        const newFilter = (slashMenuRef.current.filter ?? "") + e.key
        if (!slashFilterSpanRef.current) {
          const anchor = slashAnchorRef.current
          if (anchor && anchor.node.nodeType === Node.TEXT_NODE) {
            const textNode = anchor.node as Text
            const span = document.createElement("span")
            span.setAttribute("contenteditable", "false")
            span.setAttribute("data-slash-ghost", "1")
            span.style.cssText = "color:rgba(0,0,0,0.32);pointer-events:none;"
            slashFilterSpanRef.current = span
            const r = document.createRange()
            r.setStart(textNode, Math.min(anchor.offset + 1, textNode.length))
            r.collapse(true)
            r.insertNode(span)
            const s = window.getSelection()
            const after = document.createRange()
            after.setStartAfter(span)
            after.collapse(true)
            s?.removeAllRanges()
            s?.addRange(after)
          }
        }
        if (slashFilterSpanRef.current) slashFilterSpanRef.current.textContent = newFilter
        const updated = { ...slashMenuRef.current, filter: newFilter }
        slashMenuRef.current = updated
        setSlashMenu(updated)
        return
      }
    }

    editor.handleEditorKeyDown(e)

    if (e.key === "Escape") {
      const isBox = (e.currentTarget as any) !== editorRef.current
      if (isBox) {
        (e.currentTarget as HTMLElement).blur()
        boxes.setSelectedBoxIds(new Set())
        e.preventDefault()
      }
      return
    }
    if (e.key === "\\") {
      e.preventDefault()
      const sel = window.getSelection()
      const selectedText = sel && !sel.isCollapsed ? sel.toString().trim() : undefined
      let x = 200, y = 200
      if (sel && sel.rangeCount > 0) {
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        x = rect.left
        y = rect.bottom + 8
      }
      setAiMenu({ x, y, selectedText })
      return
    }

    if (e.key === "@") {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const isBox = (e.currentTarget as any) !== editorRef.current
      const isSelectionMode = !sel.isCollapsed

      // For boxes: store cursor position before any DOM changes
      if (isBox) {
        const r = sel.getRangeAt(0)
        slashAnchorRef.current = {
          node: r.startContainer,
          offset: r.startContainer.nodeType === Node.TEXT_NODE ? r.startOffset : -1,
        }
      }

      if (isSelectionMode) {
        e.preventDefault()
        const r = sel.getRangeAt(0)
        const rect = r.getBoundingClientRect()
        const m = {
          x: rect.right - 20,
          y: rect.bottom + 14,
          filter: "",
          type: isBox ? ("textarea" as const) : ("editor" as const),
          mode: "@" as const,
          target: e.currentTarget as HTMLElement,
          isSelectionMode: true
        }
        slashMenuRef.current = m
        setSlashMenu(m as any)
        return
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

      const m = {
        x: rect.left,
        y: rect.bottom + 14,
        filter: "",
        type: isBox ? ("textarea" as const) : ("editor" as const),
        mode: "@" as const,
        target: e.currentTarget as HTMLElement
      }
      slashMenuRef.current = m
      setSlashMenu(m as any)
    }
  }, [editor.handleEditorKeyDown, closeSlashMenu])

  const handleEditorInput = useCallback((e: React.FormEvent<HTMLElement>) => {
    if ((e.currentTarget as any) === editorRef.current) {
      editor.syncContent()
    }

    if (!slashMenuRef.current) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) { closeSlashMenu(); return }
    const range = sel.getRangeAt(0)
    const node = range.startContainer

    // Box menu: "@" is now printed; filter chars are intercepted in keydown (not typed)
    if (slashMenuRef.current.type === "textarea") {
      // Ghost span exists: filter is managed via keydown intercept; ignore input events
      if (slashFilterSpanRef.current) return
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
        // +1 to skip the "@" character itself
        if (range.startOffset <= anchorOffset) { closeSlashMenu(); return }
        const filter = textNode.textContent?.slice(anchorOffset + 1, range.startOffset) ?? ""
        if (filter.includes(" ")) { closeSlashMenu(); return }
        const updated = { ...slashMenuRef.current, filter }
        slashMenuRef.current = updated
        setSlashMenu(updated)
      } else {
        closeSlashMenu()
      }
      return
    }

    // Main editor: search for @ before cursor
    if (node.nodeType !== Node.TEXT_NODE) { closeSlashMenu(); return }
    const textNode = node as Text
    const textBefore = (textNode.textContent ?? "").slice(0, range.startOffset)
    const atIdx = textBefore.lastIndexOf("@")
    const lastIdx = atIdx
    if (lastIdx === -1) { closeSlashMenu(); return }
    const filter = textBefore.slice(lastIdx + 1)
    if (filter.includes(" ")) { closeSlashMenu(); return }
    slashAnchorRef.current = { node: textNode, offset: lastIdx }
    const updated = { ...slashMenuRef.current, filter }
    slashMenuRef.current = updated
    setSlashMenu(updated as any)
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

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("pulp-settings")
    if (saved) {
      try {
        const s = JSON.parse(saved)
        if (s.accent) setAccent(s.accent)
        if (s.theme) setTheme(s.theme)
        if (s.autoSave !== undefined) setAutoSave(s.autoSave)
        if (s.spellCheck !== undefined) setSpellCheck(s.spellCheck)
        if (s.editorFont) setEditorFont(s.editorFont)
        if (s.lineSpacing) setLineSpacing(s.lineSpacing)
        if (s.paperStyle) setPaperStyle(s.paperStyle)
        if (s.showBinding !== undefined) setShowBinding(s.showBinding)
        if (s.reduceMotion !== undefined) setReduceMotion(s.reduceMotion)
        if (s.sidebarOnStart !== undefined) setSidebarOnStart(s.sidebarOnStart)
        if (s.bgEffect !== undefined) setBgEffect(s.bgEffect)
      } catch (e) { console.error("Local settings load failed:", e) }
    }
  }, [])

  // Load settings from cloud
  useEffect(() => {
    if (!user) return
    supabase.from("user_settings").select("settings").eq("user_id", user.id).single().then(({ data }) => {
      if (!data?.settings) return
      const s = data.settings
      if (s.accent) setAccent(s.accent)
      if (s.theme) setTheme(s.theme)
      if (s.autoSave !== undefined) setAutoSave(s.autoSave)
      if (s.spellCheck !== undefined) setSpellCheck(s.spellCheck)
      if (s.editorFont) setEditorFont(s.editorFont)
      if (s.lineSpacing) setLineSpacing(s.lineSpacing)
      if (s.paperStyle) setPaperStyle(s.paperStyle)
      if (s.showBinding !== undefined) setShowBinding(s.showBinding)
      if (s.reduceMotion !== undefined) setReduceMotion(s.reduceMotion)
      if (s.sidebarOnStart !== undefined) setSidebarOnStart(s.sidebarOnStart)
      if (s.bgEffect !== undefined) setBgEffect(s.bgEffect)
    })
  }, [user])

  // Save settings to localStorage (immediate) and cloud (debounced)
  useEffect(() => {
    const settings = { accent, theme, autoSave, spellCheck, editorFont, lineSpacing, paperStyle, showBinding, reduceMotion, sidebarOnStart, bgEffect, bookmarks }
    localStorage.setItem("pulp-settings", JSON.stringify(settings))

    if (!user) return
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        settings
      })
      if (error) console.error("Settings save failed:", error.message, error.code)
    }, 1000)
    return () => clearTimeout(timer)
  }, [accent, theme, autoSave, spellCheck, editorFont, lineSpacing, paperStyle, showBinding, reduceMotion, sidebarOnStart, bgEffect, bookmarks, user])

  // Cloud autosave
  useEffect(() => {
    if (!autoSave || isLoading || !activeNote || !user) return
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("notes").upsert({ id: activeNote.id, subject: activeNote.subject, pages: activeNote.pages, boxes: activeNote.boxes, folder_id: activeNote.folderId, icon: activeNote.icon ?? null, user_id: user.id })
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

  // LocalStorage Persistence — load once on mount
  useEffect(() => {
    const saved = localStorage.getItem("pulp-notes")
    const savedFolders = localStorage.getItem("pulp-folders")
    const savedActiveTab = localStorage.getItem("pulp-active-tab")
    if (saved) {
      const parsed: NoteData[] = JSON.parse(saved)
      setNotes(parsed)
      // Restore last opened note, or fall back to the first note in the list
      if (parsed.length > 0) {
        const lastId = savedActiveTab && parsed.find(n => n.id === savedActiveTab) ? savedActiveTab : parsed[0].id
        setActiveTabId(lastId)
      }
    }
    if (savedFolders) setFolders(JSON.parse(savedFolders))
  }, [])

  // Save to localStorage whenever notes, folders, or active tab changes
  useEffect(() => {
    if (notes.length > 0) localStorage.setItem("pulp-notes", JSON.stringify(notes))
    if (folders.length > 0) localStorage.setItem("pulp-folders", JSON.stringify(folders))
  }, [notes, folders])

  useEffect(() => {
    if (activeTabId) localStorage.setItem("pulp-active-tab", activeTabId)
  }, [activeTabId])

  // Fetch notes from cloud — runs once on mount only
  // Only hydrates from cloud if localStorage has no data (local always wins)
  useEffect(() => {
    const fetchNotes = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { setUser(null); setIsLoading(false); return }
      setUser(u)
      const hasLocal = !!localStorage.getItem("pulp-notes")
      if (!hasLocal) {
        const { data, error } = await supabase.from("notes").select("*").eq("user_id", u.id)
        if (!error && data?.length) {
          setNotes(data.map(n => ({ id: n.id, subject: n.subject, pages: n.pages ?? [""], boxes: n.boxes ?? {}, folderId: n.folder_id ?? null, parentId: n.parent_id ?? undefined, icon: n.icon ?? undefined })))
          if (!activeTabId) setActiveTabId(data[0].id)
        }
      }
      setIsLoading(false)
    }
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // [] — run once on mount only, not on every user change


  // Note/folder actions
  const addNote = (folderId: number | null = null) =>
    openPrompt("Name your note", "New Note", "Note name…", "Create", name => {
      if (!name.trim()) return
      const id = uid()
      const newNote = { id, subject: name.trim(), pages: [""], folderId, boxes: {} }
      setNotes(prev => [...prev, newNote])
      setActiveTabId(id); setCurrentPageIdx(0)
    })

  const insertBacklink = useCallback(() => {
    editor.saveSelection()
    openPrompt("Name your subpage", "Subpage", "Subpage name…", "Create", async name => {
      if (!name.trim()) return
      const newId = uid()
      const parentId = activeTabId ?? undefined
      const newNote: NoteData = { id: newId, subject: name.trim(), pages: [""], folderId: null, parentId, boxes: {} }

      const color = accent.length > 7 ? accent.slice(0, 7) : accent
      const linkHtml = `<span data-backlink-id="${newId}" contenteditable="false" style="display:inline-flex;align-items:center;gap:4px;background:${color}18;color:${color};border:1px solid ${color}44;padding:1px 8px;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;margin:0 2px;user-select:none;-webkit-user-modify:read-only;text-decoration:none;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>${name.trim()}</span>&nbsp;`

      // Insert into DOM first, then capture the updated innerHTML before any React re-render
      editor.insertHTML(linkHtml)

      const focused = document.activeElement as HTMLElement | null
      const isBox = focused?.isContentEditable === true && focused !== editorRef.current
      if (isBox && focused) {
        const boxWrapper = focused.closest('[id^="box-"]')
        const boxId = boxWrapper?.id.replace('box-', '')
        const updatedContent = focused.innerHTML
        setNotes(prev => {
          const updated = prev.map(n => {
            if (n.id !== activeTabId || !boxId) return n
            return { ...n, boxes: { ...n.boxes, [currentPageIdx]: (n.boxes[currentPageIdx] || []).map(b => b.id === boxId ? { ...b, content: updatedContent } : b) } }
          })
          return [...updated, newNote]
        })
      } else {
        editor.flushSync()
        setNotes(prev => [...prev, newNote])
      }

      if (user) {
        await supabase.from("notes").insert({
          id: newId, subject: name.trim(), pages: [""], boxes: {}, folder_id: null, parent_id: parentId ?? null, user_id: user.id
        })
      }
    })
  }, [accent, activeTabId, currentPageIdx, editor, editorRef, openPrompt, user])

  const setNoteParent = useCallback((id: string, parentId: string | undefined) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, parentId } : n))
  }, [])

  const changeNoteIcon = useCallback((id: string, icon: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, icon } : n))
    if (user) supabase.from("notes").update({ icon }).eq("id", id).then(({ error }) => { if (error) console.error("Icon save failed:", error.message) })
  }, [user])

  const renameNote = (id: string, currentName: string) =>
    openPrompt("Rename note", currentName, "Note name…", "Rename", newName => {
      if (newName.trim()) setNotes(prev => prev.map(n => n.id === id ? { ...n, subject: newName.trim() } : n))
    })

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeTabId === id) setActiveTabId(notes.find(n => n.id !== id)?.id ?? null)
    if (user) await supabase.from("notes").delete().eq("id", id)
  }

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


  if (isLoading) return <PulpLoadingScreen />

  const { backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize } = getPaperBg(lineSpacing, paperStyle, theme === "dark")


  return (
    <div className="flex h-screen overflow-hidden font-sans relative" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#F0ECEA", color: theme === "dark" ? "#FAFAFA" : "#1A1A1A", backgroundImage: bgEffect ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='${theme === "dark" ? "0.035" : "0.045"}'/%3E%3C/svg%3E")` : undefined, backgroundRepeat: "repeat" }}>
      {dialog && <AppDialog config={dialog} accent={accent} onClose={() => setDialog(null)} />}
      {showSettings && <SettingsView user={user} onClose={() => setShowSettings(false)} accentColor={accent} setAccentColor={setAccent} theme={theme} setTheme={setTheme} autoSave={autoSave} setAutoSave={setAutoSave} spellCheck={spellCheck} setSpellCheck={setSpellCheck} editorFont={editorFont} setEditorFont={setEditorFont} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} paperStyle={paperStyle} setPaperStyle={setPaperStyle} showBinding={showBinding} setShowBinding={setShowBinding} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} sidebarOnStart={sidebarOnStart} setSidebarOnStart={setSidebarOnStart} bgEffect={bgEffect} setBgEffect={setBgEffect} smearEffect={smearEffect} setSmearEffect={setSmearEffect} handwrittenEffect={handwrittenEffect} setHandwrittenEffect={setHandwrittenEffect} />}
      <GlobalStyles reduceMotion={reduceMotion} theme={theme} handwrittenEffect={handwrittenEffect} />

      <Sidebar
        notes={notes}
        folders={folders}
        activeTabId={activeTabId}
        accent={accent}
        draggedNoteId={draggedNoteId}
        renamingFolder={renamingFolder}
        user={user}
        sidebarWidth={sidebarWidth}
        isDragging={isSidebarDragging}
        onAddNote={addNote}
        onAddFolder={addFolder}
        onSelectNote={id => { editor.flushSync(); setActiveTabId(id); setCurrentPageIdx(0); setCurrentView("editor") }}
        onRenameNote={renameNote}
        onDeleteNote={deleteNote}
        onToggleFolder={toggleFolder}
        onRenameFolder={renameFolder}
        onDeleteFolder={deleteFolder}
        onSetRenamingFolder={setRenamingFolder}
        onSetDraggedNoteId={setDraggedNoteId}
        onDropNote={handleDropNote}
        onOpenSettings={() => setShowSettings(true)}
        onSetNoteParent={setNoteParent}
        onChangeNoteIcon={changeNoteIcon}
        onGoToShelf={() => setCurrentView("shelf")}
        bookmarks={bookmarks}
        onJumpToBookmark={(b) => { editor.flushSync(); setActiveTabId(b.noteId); setCurrentPageIdx(b.pageIdx); setCurrentView("editor") }}
        onReorderBookmarks={(newB) => setBookmarks(newB)}
        onDeleteBookmark={(id) => setBookmarks(prev => prev.filter(b => b.id !== id))}
        onRenameBookmark={(id, current) => {
          openPrompt("Rename Bookmark", current, "Enter new title...", "Rename", (val: string) => {
            if (val) setBookmarks(prev => prev.map(b => b.id === id ? { ...b, noteTitle: val } : b))
          })
        }}
      />

      {/* Sidebar edge resize handle */}
      <div
        onMouseDown={e => { e.preventDefault(); startSidebarDrag(e.clientX) }}
        style={{
          position: "absolute", top: 0, bottom: 0,
          left: sidebarWidth - 3, width: 6,
          cursor: "ew-resize", zIndex: 40,
          transition: isSidebarDragging ? "none" : "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {currentView === "shelf" && (
        <div className="absolute inset-0 z-50 anim-fade-in bg-white dark:bg-[#09090b]">
          <ShelfView
            notes={notes}
            onOpenNote={id => { editor.flushSync(); setActiveTabId(id); setCurrentPageIdx(0); setCurrentView("editor") }}
            onCreateNote={() => { addNote(null); setCurrentView("editor") }}
            theme={theme}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative anim-fade-in" style={{ display: currentView === "shelf" ? "none" : undefined }}>
        <button
          title={sidebarWidth > 0 ? "Close Menu" : "Open Menu"}
          onMouseDown={e => { e.preventDefault(); startSidebarDrag(e.clientX) }}
          className="absolute left-8 top-[48px] z-[30] flex flex-col items-center opacity-95 hover:opacity-100 outline-none cursor-pointer transition-all active:scale-95 translate-y-[-2px]"
          style={{ transformOrigin: "top center", animation: "leaf-sway 18s ease-in-out infinite" }}
        >
          {/* Textured rope from topbar */}
          <div style={{
            width: "1.8px",
            height: "120px",
            background: theme === 'dark'
              ? "linear-gradient(to right, #C6A664 0%, #78350f 40%, #C6A664 100%)"
              : "linear-gradient(to right, #78350f 0%, #C6A664 40%, #78350f 100%)",
            boxShadow: theme === 'dark' ? "0 0 4px rgba(198, 166, 100, 0.4)" : "1px 0 3px rgba(0,0,0,0.3)",
            marginBottom: "-25px",
            position: "relative",
            zIndex: 0
          }} />
          <img
            src="/lightbulb.png"
            alt="Toggle Menu"
            style={{
              width: 72,
              height: "auto",
              objectFit: "contain",
              pointerEvents: "none",
              position: "relative",
              zIndex: 10,
              filter: sidebarWidth > 0
                ? "drop-shadow(0 0 15px rgba(251, 191, 36, 0.7)) drop-shadow(0 0 30px rgba(251, 191, 36, 0.3)) brightness(1.2) contrast(1.1)"
                : (theme === "dark"
                  ? "brightness(0.85) contrast(1.1)"
                  : "brightness(0.85) grayscale(0.1)"),
              transition: "filter 0.4s ease-in-out"
            }}
          />
        </button>

        {/* ── Bookmark ribbon — placed next to the lightbulb ── */}
        {(() => {
          const isBookmarked = (bookmarks || []).some(b => b.noteId === activeTabId && b.pageIdx === currentPageIdx)
          const ribbonColor = isBookmarked ? "#E11D48" : (theme === "dark" ? "#3f3f46" : "#c4c4c8")
          return (
            <motion.div
              onClick={() => {
                const existing = (bookmarks || []).find(b => b.noteId === activeTabId && b.pageIdx === currentPageIdx)
                if (existing) setBookmarks(prev => prev.filter(b => b.id !== existing.id))
                else setBookmarks(prev => [...prev, { id: uid(), noteId: activeTabId!, pageIdx: currentPageIdx, noteTitle: activeNote.subject, icon: activeNote.icon }])
              }}
              animate={{ scaleY: isBookmarked ? 1 : 0.6, opacity: isBookmarked ? 1 : 0.45 }}
              whileHover={{ scaleY: 1, opacity: 1 }}
              whileTap={{ scaleY: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              style={{
                position: "absolute",
                top: 48,
                left: 104,
                width: 22,
                zIndex: 30,
                cursor: "pointer",
                transformOrigin: "top",
                filter: isBookmarked ? "drop-shadow(0 4px 8px rgba(225,29,72,0.5))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
              }}
            >
              <div style={{
                width: "100%",
                height: 64,
                backgroundColor: ribbonColor,
                clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 50% 88%, 0% 100%)",
                position: "relative",
              }}>
                <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 5 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: isBookmarked ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.18)" }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })()}

        {notes.length > 0 && (
          <DocumentToolbar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            stickyColor={stickyColor}
            setStickyColor={setStickyColor}
            accent={accent}
            theme={theme}
            zoom={zoom}
            setZoom={setZoom}
            gridView={gridView}
            setGridView={setGridView}
            setCarouselIdx={setCarouselIdx}
            sketchMode={sketchMode}
            setSketchMode={setSketchMode}
            setSketchPrompt={setSketchPrompt}
            drawLineMode={drawLineMode}
            setDrawLineMode={setDrawLineMode}

            currentPageIdx={currentPageIdx}
            saveSelection={editor.saveSelection}
            insertTable={editor.insertTable}
            insertColumns={editor.insertColumns}
            openAlert={openAlert}
            clearPage={clearPage}
            autoAlign={boxes.autoAlign}
            verticalAlign={boxes.verticalAlign}
            insertCornell={insertCornell}
            showDrawToolbar={showDrawToolbar}
            onToggleDrawToolbar={() => setShowDrawToolbar(!showDrawToolbar)}
            rightSidebarOpen={contentSidebarOpen}
            setRightSidebarOpen={setContentSidebarOpen}
            allCompacted={allCompacted}
            onCompactAll={handleCompactAll}
            onInsertHR={() => editor.insertHTML('<div contenteditable="false" style="height:2px;background:#000;width:90%;margin:14px auto;border-radius:1px;display:block"></div><br/>')}
            onDownload={() => {
              if (!activeNote) return
              const blob = new Blob([JSON.stringify(activeNote, null, 2)], { type: "application/json" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `${activeNote.subject || "note"}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
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
                    <div style={{ position: "absolute", top: 0, left: 4, right: -4, bottom: -2, backgroundColor: theme === "dark" ? "#1f1f23" : "#f0e9e0", borderRadius: 2, zIndex: 1, boxShadow: "2px 2px 10px rgba(0,0,0,0.12)" }} />
                    <div style={{ position: "absolute", top: 0, left: 8, right: -8, bottom: -4, backgroundColor: theme === "dark" ? "#1a1a1e" : "#e8e0d4", borderRadius: 2, zIndex: 0, boxShadow: "2px 4px 12px rgba(0,0,0,0.10)" }} />
                    <div style={{ position: "absolute", top: 0, left: 12, right: -12, bottom: -6, backgroundColor: theme === "dark" ? "#151518" : "#dfd6c8", borderRadius: 2, zIndex: -1 }} />

                    <SpiralBinding theme={theme} showBinding={showBinding} bindingCompact={bindingCompact} paperBg={paperBg} />


                    <div ref={paperRef} id="editor-paper" className="relative" style={{ minHeight: "1300px", overflow: "hidden", contain: "layout style", cursor: activeTool === 'pan' ? 'grab' : activeTool === 'sticky' || activeTool === 'hr' ? 'crosshair' : activeTool === 'text' || activeTool === 'select' ? 'default' : 'crosshair', backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize, zIndex: 2, boxShadow: theme === "dark" ? "0 25px 50px -12px rgba(0,0,0,0.7), 0 8px 24px -8px rgba(0,0,0,0.6)" : "1px 1px 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.05), 0 8px 16px rgba(0,0,0,0.05), 0 16px 32px rgba(0,0,0,0.05), 0 32px 64px rgba(0,0,0,0.05)" }}
                      onMouseDown={e => {
                        if (activeTool === 'sticky' || activeTool === 'hr') {
                          // Handled by onClick below to ensure clean single-click placement
                          return
                        }
                        if (activeTool !== 'select' && activeTool !== 'text') return
                        const target = e.target as HTMLElement
                        const boxEl = target.closest('[id^="box-"]') as HTMLElement | null
                        if (boxEl) {
                          const boxId = boxEl.id.replace('box-', '')
                          const box = (activeNote.boxes[currentPageIdx] || []).find(b => b.id === boxId)
                          if (!box || box.content.trim() !== '' || box.boxHighlightColor) return
                          // Empty box — treat click as paper click so it gets replaced
                        }
                        boxes.onPaperMouseDown(e)
                      }}
                      onClick={e => {
                        const target = e.target as HTMLElement
                        if (target.closest('[id^="box-"]')) return
                        if (activeTool === 'sticky') {
                          placeStickyNote(e)
                        } else if (activeTool === 'hr') {
                          placeHorizontalLine(e)
                        }
                      }}
                    >

                      <div className="absolute left-28 top-0 bottom-0 w-[1px] z-20 pointer-events-none" style={{ backgroundColor: theme === "dark" ? "rgba(248,113,113,0.3)" : "rgba(252,165,165,0.6)" }} />
                      {smearEffect && <div className="absolute top-0 left-0 bottom-0 pointer-events-none" style={{ width: 220, background: "linear-gradient(to right, rgba(0,0,0,0.065) 0%, rgba(0,0,0,0.018) 50%, transparent 100%)", zIndex: 21 }} />}

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
                        #editor-paper ul { list-style-type: disc !important; padding-left: 1.5em !important; margin: 0.25em 0 !important; }
                        #editor-paper ol { list-style-type: decimal !important; padding-left: 1.5em !important; margin: 0.25em 0 !important; }
                        #editor-paper li { margin-bottom: 0.15em !important; }
                      `}</style>

                      {/* Selection rectangle — always in DOM, shown/hidden via direct DOM style */}
                      <div
                        ref={boxes.selectionRectRef}
                        style={{
                          display: "none",
                          position: "absolute",
                          left: 0, top: 0, width: 0, height: 0,
                          backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)",
                          border: `1px solid ${theme === "dark" ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.2)"}`,
                          boxShadow: "none",
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
                          selectedCount={boxes.selectedBoxIdsRef.current.size}
                          loadingBoxId={boxes.loadingBoxId}
                          accentSolid={accent.length > 7 ? accent.slice(0, 7) : accent}
                          theme={theme}
                          startDrag={boxes.startDrag}
                          startResize={boxes.startResize}
                          deleteBox={boxes.deleteBox}
                          updateBox={boxes.updateBox}
                          updateBoxContent={boxes.updateBoxContent}
                          setSelectedBoxIds={boxes.setSelectedBoxIds}
                          onKeyDown={handleEditorKeyDown}
                          onInput={handleEditorInput}
                          onRewrite={boxes.rewriteBox}
                          onImageGen={boxes.generateSketch}
                          formattingOpen={toolbarFormattingOpen}
                          setFormattingOpen={setToolbarFormattingOpen}
                          aiOpen={toolbarAiOpen}
                          setAiOpen={setToolbarAiOpen}
                          onDragStart={() => setIsAnyBoxDragging(true)}
                          onDragEnd={() => setIsAnyBoxDragging(false)}
                        />
                      ))}

                      {/* Page Navigation + Bookmark — generous deadzone prevents accidental textbox creation */}
                      <div
                        className="absolute top-0 right-0 z-50 no-print select-none"
                        style={{ padding: "32px 20px 48px 60px" }}
                        onMouseDown={e => e.stopPropagation()}
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                      >
                        <div
                          className="flex items-center gap-0.5"
                          onMouseDown={e => e.stopPropagation()}
                          onPointerDown={e => e.stopPropagation()}
                        >
                          {/* Skip to first */}
                          <button
                            disabled={currentPageIdx === 0}
                            onClick={() => { editor.flushSync(); setCurrentPageIdx(0) }}
                            className={`p-1.5 rounded-md transition-all ${currentPageIdx === 0 ? "opacity-20" : "hover:bg-black/8 hover:scale-110 active:scale-95"}`}
                            style={{ color: theme === "dark" ? "#9ca3af" : "#4b5563" }}
                            title="First Page"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 20-4-8 4-8"/><path d="m11 20-4-8 4-8"/></svg>
                          </button>
                          {/* Previous */}
                          <button
                            disabled={currentPageIdx === 0}
                            onClick={() => { editor.flushSync(); setCurrentPageIdx(p => p - 1) }}
                            className={`p-1.5 rounded-md transition-all ${currentPageIdx === 0 ? "opacity-20" : "hover:bg-black/8 hover:scale-110 active:scale-95"}`}
                            style={{ color: theme === "dark" ? "#9ca3af" : "#4b5563" }}
                            title="Previous Page"
                          >
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m14 20-4-8 4-8" /></svg>
                          </button>
                          <PageNumberInput
                            currentPageIdx={currentPageIdx}
                            totalPages={activeNote.pages.length}
                            theme={theme}
                            onNavigate={(idx: number) => { editor.flushSync(); setCurrentPageIdx(idx) }}
                          />
                          {/* Next */}
                          <button
                            onClick={() => {
                              editor.flushSync();
                              if (currentPageIdx < activeNote.pages.length - 1) setCurrentPageIdx(p => p + 1);
                              else {
                                const np = [...activeNote.pages, ""];
                                setNotes(prev => prev.map(n => n.id === activeTabId ? { ...n, pages: np } : n));
                                setCurrentPageIdx(activeNote.pages.length)
                              }
                            }}
                            className="p-1.5 hover:bg-black/8 hover:scale-110 active:scale-95 rounded-md transition-all"
                            style={{ color: theme === "dark" ? "#9ca3af" : "#4b5563" }}
                            title="Next Page / Add Page"
                          >
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10 20 4-8-4-8" /></svg>
                          </button>
                          {/* Skip to last */}
                          <button
                            disabled={currentPageIdx === activeNote.pages.length - 1}
                            onClick={() => { editor.flushSync(); setCurrentPageIdx(activeNote.pages.length - 1) }}
                            className={`p-1.5 rounded-md transition-all ${currentPageIdx === activeNote.pages.length - 1 ? "opacity-20" : "hover:bg-black/8 hover:scale-110 active:scale-95"}`}
                            style={{ color: theme === "dark" ? "#9ca3af" : "#4b5563" }}
                            title="Last Page"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 20 4-8-4-8"/><path d="m13 20 4-8-4-8"/></svg>
                          </button>
                        </div>{/* end inner flex */}
                      </div>{/* end deadzone */}

                    </div>
                  </div>
                  <div style={{ height: 60, marginTop: -8, background: "radial-gradient(ellipse 90% 55% at 46% 0%, rgba(0,0,0,0.22) 0%, transparent 70%)", pointerEvents: "none", position: "relative", zIndex: 0 }} />
                </div>
              </div>
            </main>
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
          mode={slashMenu.mode}
          box={slashMenu.target?.closest('[id^="box-"]') ? activeNote.boxes[currentPageIdx]?.find(b => b.id === slashMenu.target?.closest('[id^="box-"]')?.id.replace("box-", "")) : undefined}
          onUpdateBox={boxes.updateBox}
          isSelectionMode={slashMenu.isSelectionMode}
          onSelect={executeSlashItem}
          onClose={closeSlashMenu}
          execCmd={editor.execCmd}
          insertHTML={editor.insertHTML}
          toggleScript={editor.toggleScript}
          insertBacklink={insertBacklink}
          onInsertImage={() => { closeSlashMenu(); setShowImageModal(true) }}
        />
      )}

      {showImageModal && (
        <ImageUploadModal
          onConfirm={(htmlOrUrl, isHtml) => {
            if (isHtml) {
              editor.insertHTML(htmlOrUrl)
            } else {
              editor.insertHTML(`<img src="${htmlOrUrl}" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:4px 0" alt="Media" /><br/>`)
            }
          }}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {aiMenu && (
        <AiInlineMenu
          x={aiMenu.x}
          y={aiMenu.y}
          selectedText={aiMenu.selectedText}
          isDark={theme === "dark"}
          onClose={() => setAiMenu(null)}
          onSubmit={(prompt: string) => {
            openAlert("AI", `Processing: "${prompt}"`)
            setAiMenu(null)
          }}
        />
      )}
    </div>
  )
}
