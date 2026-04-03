"use client"
import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import type { TextBox as TextBoxType, NoteData, FolderData, DialogConfig, Bookmark, Achievement, Tree, SlashMenuState, User } from "@/app/types"
import { uid } from "@/app/lib/uid"
import { getPaperBg } from "@/app/lib/paperStyle"
import { useEditor } from "@/app/hooks/useEditor"
import { useBoxDrawing } from "@/app/hooks/useBoxDrawing"
import { useDrawing } from "@/app/hooks/useDrawing"
import { AppDialog } from "@/app/components/AppDialog"
import { SettingsView } from "@/app/components/settings/SettingsView"
import { Sidebar } from "@/app/components/Sidebar"
import { DocumentToolbar } from "@/app/components/DocumentToolbar"
import { HangingOrange } from "@/app/components/HangingOrange"
import { GridView } from "@/app/components/GridView"
import { SlashMenu } from "@/app/components/SlashMenu"
import { ShelfView } from "@/app/components/ShelfView"
import { ImageUploadModal } from "@/app/components/ImageUploadModal"
import { CoverModal } from "@/app/components/CoverModal"
import { FlashcardView } from "@/app/components/FlashcardView"
import { AiResultModal } from "@/app/components/AiResultModal"
import { AiInlineMenu } from "@/app/components/AiInlineMenu"
import { AiCommandBar } from "@/app/components/AiCommandBar"
import { TimerSidebarPanel } from "@/app/components/TimerSidebarPanel"
import { PulpLoadingScreen } from "@/app/components/PulpLoadingScreen"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { FloatingToolbar } from "@/app/components/FloatingToolbar"
import { AnimatedCreateButton } from "@/app/components/AnimatedCreateButton"

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
const GlobalStyles = memo(function GlobalStyles({ reduceMotion, reduceVisuals, theme, handwrittenEffect }: { reduceMotion: boolean, reduceVisuals: boolean, theme: "light" | "dark", handwrittenEffect: boolean }) {
  return (<>
    <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Bilbo&family=Licorice&family=Original+Surfer&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Caveat&family=Gochi+Hand&family=Indie+Flower&family=Dancing+Script&display=swap');@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');${reduceMotion ? "*, *::before, *::after { transition: none !important; animation: none !important; }" : ""}${reduceVisuals ? " .animate-pulse, .pulp-pulse, [class*='animate-'] { animation: none !important; } .neon-checkbox__effects, .bg-effect, .smear-effect, [class*='effect'] { filter: none !important; box-shadow: none !important; }" : ""} .ls-toolbar { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; letter-spacing: -0.01em; } @keyframes slide-up-fade { 0% { opacity: 0; transform: translateY(12px); filter: blur(2px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } } @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } } @keyframes leaf-sway { 0% { transform: rotate(-2.2deg) translateX(-0.8px); } 25% { transform: rotate(-0.8deg) translateX(-0.3px); } 50% { transform: rotate(2.2deg) translateX(0.8px); } 75% { transform: rotate(0.8deg) translateX(0.3px); } 100% { transform: rotate(-2.2deg) translateX(-0.8px); } } @keyframes bulb-pull { 0% { transform: translateY(0); } 30% { transform: translateY(15px); } 65% { transform: translateY(-4px); } 100% { transform: translateY(0); } } @keyframes orange-bounce { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } } @keyframes orange-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .anim-slide-up { opacity: 0; animation: slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; } .anim-fade-in { opacity: 0; animation: fade-in 0.4s ease-out forwards; } @keyframes erase-fade { 0% { opacity: 0.6; filter: blur(0.4px); transform: translateY(0.5px) rotate(-1deg); } 15% { opacity: 0.45; filter: blur(1.5px); transform: translateY(1px) rotate(-1.5deg); } 100% { opacity: 0; filter: blur(4px); transform: translateY(2px) rotate(-2deg); } } .erased { text-decoration: line-through; text-decoration-thickness: 1.5pt; text-decoration-color: rgba(0,0,0,0.6); pointer-events: none; user-select: none; display: inline-block; animation: erase-fade 6s forwards cubic-bezier(0.4, 0, 1, 1); vertical-align: baseline; white-space: pre; } [contenteditable] { outline: none !important; cursor: url('/pencil.png'), text; } [data-box-style="margin"], [data-box-style="margin"] * { color: rgba(0,0,0,0.32) !important; }` }} />
    {theme === "dark" && <style dangerouslySetInnerHTML={{ __html: `.ls-toolbar { background-color: rgba(18,18,20,0.85) !important; border-color: rgba(255,255,255,0.08) !important; box-shadow: 0 4px 32px rgba(0,0,0,0.5) !important; backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; } .ls-toolbar .hover\\:bg-zinc-200, .ls-toolbar .hover\\:bg-zinc-100 { color: #A1A1AA !important; background-color: transparent !important; border-color: transparent !important; box-shadow: none !important; } .ls-toolbar .hover\\:bg-zinc-200:hover, .ls-toolbar .hover\\:bg-zinc-100:hover { background-color: rgba(255,255,255,0.08) !important; color: #FAFAFA !important; } .ls-toolbar select, .ls-toolbar input { background-color: rgba(255,255,255,0.05) !important; color: #FAFAFA !important; border-color: rgba(255,255,255,0.08) !important; } .ls-toolbar .text-zinc-600 { color: #A1A1AA !important; } .ls-toolbar .border-zinc-200, .ls-toolbar .border-zinc-200\\/80 { border-color: rgba(255,255,255,0.08) !important; } .ls-toolbar .bg-white, .ls-toolbar .bg-zinc-50 { background-color: transparent !important; }` }} />}
    <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      <filter id="handwritten-jitter" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.08 0.05" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" result="wobble" />
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" result="noise2" />
        <feDisplacementMap in="wobble" in2="noise2" scale="2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="handwritten-jitter-subtle" colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.03" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="pen-ink" colorInterpolationFilters="sRGB" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04 0.07" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="wobble" />
        <feGaussianBlur in="wobble" stdDeviation="0.15" result="blur" />
        <feComponentTransfer in="blur">
          <feFuncA type="gamma" amplitude="1.1" exponent="1.2" />
        </feComponentTransfer>
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
        border: (box.boxOutlineWidth || 0) > 0 ? `${box.boxOutlineWidth}px solid currentColor` : (isSelected ? `1px solid ${accentSolid}44` : "1px solid transparent"),
        color: (box.boxHeadingStyle as string) === "margin" ? "rgba(0,0,0,0.32)" : (theme === "dark" ? "#ffffff" : "#000000"),
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
      {isSelected && !isSticky && (
        <div style={{ position: "absolute", top: 0, right: -34, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, zIndex: 120 }}>
          {/* Rotate button */}
          <div
            title="Rotate"
            className="hover:scale-110 active:scale-95 transition-transform"
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
              width: 17, height: 17, borderRadius: "50%", 
              background: "rgba(0,0,0,0.08)", cursor: "grab", 
              display: "flex", alignItems: "center", justifyContent: "center", 
              color: "rgba(0,0,0,0.5)", flexShrink: 0,
              filter: "url(#handwritten-jitter-subtle)"
            }}
          >
            {/* Wobbly handwritten-style rotate arrow */}
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v5h-5" />
              <path d="M2.5 12a10 10 0 0 1 17-7" />
            </svg>
          </div>
          {/* Delete button (Handwritten style) */}
          <button
            onMouseDown={e => { e.stopPropagation(); deleteBox(box.id) }}
            className="hover:scale-110 active:scale-95 transition-transform"
            style={{ 
              width: 17, height: 17, borderRadius: "50%", 
              background: "rgba(0,0,0,0.08)", border: "none", 
              cursor: "pointer", fontSize: 13, 
              display: "flex", alignItems: "center", justifyContent: "center", 
              lineHeight: 1, color: "rgba(0,0,0,0.5)", flexShrink: 0,
              fontFamily: '"Caveat", cursive', fontWeight: 600,
              filter: "url(#handwritten-jitter-subtle)"
            }}>×</button>
        </div>
      )}
      {isSelected && isSticky && (
        <button
          onMouseDown={e => { e.stopPropagation(); deleteBox(box.id) }}
          className="hover:scale-110 active:scale-95 transition-transform"
          style={{ 
            position: "absolute", top: 10, right: 8, 
            background: "rgba(0,0,0,0.08)", border: "none", 
            cursor: "pointer", fontSize: 13, width: 17, height: 17, 
            display: "flex", alignItems: "center", justifyContent: "center", 
            borderRadius: "50%", lineHeight: 1, color: "rgba(0,0,0,0.5)", 
            zIndex: 120, fontFamily: '"Caveat", cursive', fontWeight: 600,
            filter: "url(#handwritten-jitter-subtle)"
          }}>×</button>
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
            theme={theme}
          />
        )}
      </div>
    </div>
  )
})

const BOX_HEADING_SIZES: Record<string, number> = { h1: 28, h2: 22, h3: 18, default: 20, margin: 26 }
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
  isSticky?: boolean; theme: "light" | "dark"
  onUpdate: (id: string, updates: Partial<TextBoxType>) => void
  onFocus: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  onInput: (e: React.FormEvent<HTMLElement>) => void
}

const BoxTextarea = memo(function BoxTextarea({
  id, content, textAlign, boxFontFamily, boxFontSize, boxHeadingStyle, isSticky, theme, onUpdate, onFocus, onKeyDown, onInput
}: BoxTextareaProps) {
  const ref = useRef<HTMLDivElement>(null)
  const timerRef = useRef<any>(null)
  const prevContentRef = useRef<string>('')

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== content) {
      ref.current.innerHTML = content
      prevContentRef.current = content
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
  const resolvedFont = isMarginStyle ? "'Shadows Into Light', cursive" : (boxFontFamily || "'Indie Flower', cursive")
  const inkColor = isMarginStyle
    ? (theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.32)")
    : "#1a1a1a"

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-box-style={styleKey}
      onKeyDown={e => {
        // Erase animation for selected text deletion only
        if ((e.key === 'Backspace' || e.key === 'Delete') && ref.current && !e.defaultPrevented) {
          const sel = window.getSelection()
          if (sel && sel.toString()) {
            // Selected text - show erase animation
            e.preventDefault()
            const range = sel.getRangeAt(0)
            const contents = range.extractContents()
            const span = document.createElement('span')
            span.className = 'erased'
            span.style.pointerEvents = 'none'
            span.style.userSelect = 'none'
            span.appendChild(contents)
            range.insertNode(span)
            setTimeout(() => { span.remove(); syncState() }, 6100)
          }
        }
        // Call parent handler
        if (!e.defaultPrevented) {
          onKeyDown(e)
        }
        if (!e.defaultPrevented) e.stopPropagation()
      }}
      onInput={e => {
        // Move cursor out of erased spans so user can continue typing/deleting
        if (ref.current) {
          const sel = window.getSelection()
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0)
            let node: Node | null = range.commonAncestorContainer
            while (node) {
              if (node.nodeType === Node.ELEMENT_NODE && (node as Element).className === 'erased') {
                range.setStartAfter(node)
                range.collapse(true)
                sel.removeAllRanges()
                sel.addRange(range)
                break
              }
              node = node.parentNode
            }
          }
        }

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
        fontFamily: resolvedFont, fontSize: resolvedSize, fontWeight: 500,
        lineHeight: 1.45, color: inkColor, cursor: "text",
        letterSpacing: "0.1px",
        fontStyle: isMarginStyle ? "italic" : "normal",
        transform: isMarginStyle ? "rotate(-1.2deg) skewX(-2deg)" : undefined,
        transformOrigin: "top left",
        WebkitFontSmoothing: isMarginStyle ? ("antialiased" as any) : undefined,
        textAlign: (textAlign || "left") as any, wordWrap: "break-word",
        overflow: isSticky ? "hidden" : "visible",
        backgroundColor: "transparent",
        filter: "url(#pen-ink)",
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
  const [user, setUser] = useState<User | null>(null)
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
  const [socials, setSocials] = useState<{ twitter?: string; instagram?: string; github?: string; linkedin?: string; website?: string }>({})
  const [showDrawToolbar, setShowDrawToolbar] = useState(false)
  const [showCoverModal, setShowCoverModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [timerOpen, setTimerOpen] = useState(false)
  const [timerElapsed, setTimerElapsed] = useState(0)
  const [timerTotal, setTimerTotal] = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [timerPreset, setTimerPreset] = useState<"focus" | "short" | "long">("focus")
  const [customSize, setCustomSize] = useState("16")
  const [allCompacted, setAllCompacted] = useState(false)
  const [toolbarFormattingOpen, setToolbarFormattingOpen] = useState(false)
  const [toolbarAiOpen, setToolbarAiOpen] = useState(false)
  const [aiResult, setAiResult] = useState<{ title: string; result: string; loading: boolean } | null>(null)
  const [currentView, setCurrentView] = useState<"editor" | "shelf">("editor")
  const [isAnyBoxDragging, setIsAnyBoxDragging] = useState(false)
  const unlockedVaults = useRef<Set<string>>(new Set())

  // ─── Pulp Grove Gamification State ───
  const [sunshine, setSunshine] = useState(1000) // Main currency: Earned by time spent (1 per 30s)
  const [gems, setGems] = useState(5)   // Secondary: Earned by writing (1 per 500 chars)
  const [grove, setGrove] = useState<Tree[]>([]) // Your planted trees
  const [lastCharCount, setLastCharCount] = useState(0)
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'caught_in_the_act', title: 'Caught in the Act!', icon: '🎭', description: 'Catch Antigravity making a secret expression.', reward: 10, rewardType: 'gems', completed: false, claimed: false },
    { id: 'novice_writer', title: 'Novice Writer', icon: '✍️', description: 'Write 1,000 characters in your notebook.', reward: 20, rewardType: 'gems', completed: false, claimed: false, progress: 0, goal: 1000 },
    { id: 'binder_buddy', title: 'Binder Buddy', icon: '📁', description: 'Create your first 3 folders.', reward: 50, rewardType: 'sunshine', completed: false, claimed: false, progress: 0, goal: 3 },
    { id: 'archivist', title: 'The Archivist', icon: '🗃️', description: 'Move 5 notes to the archive.', reward: 30, rewardType: 'gems', completed: false, claimed: false, progress: 0, goal: 5 },
    { id: 'night_owl', title: 'Night Owl', icon: '🦉', description: 'Open Pulp after 11 PM.', reward: 25, rewardType: 'sunshine', completed: false, claimed: false },
  ])

  // Restore Grove from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('pulp-grove')
    if (saved) {
      const data = JSON.parse(saved)
      setSunshine(data.sunshine ?? 1000)
      setGems(data.gems ?? 5)
      setGrove(data.grove || [])
      if (data.achievements) setAchievements(data.achievements)
    }

    // Restore Timer Session
    const savedTimer = localStorage.getItem('pulp-timer')
    if (savedTimer) {
      const t = JSON.parse(savedTimer)
      setTimerTotal(t.total ?? 25 * 60)
      setTimerPreset(t.preset ?? "focus")
      setTimerDone(t.done ?? false)
      
      if (t.running && !t.done) {
        const elapsedSinceLast = Math.floor((Date.now() - t.timestamp) / 1000)
        const totalElapsed = t.elapsed + elapsedSinceLast
        if (totalElapsed >= (t.total ?? 25 * 60)) {
          setTimerElapsed(t.total ?? 25 * 60)
          setTimerRunning(false)
          setTimerDone(true)
        } else {
          setTimerElapsed(totalElapsed)
          setTimerRunning(true)
        }
      } else {
        setTimerElapsed(t.elapsed ?? 0)
        setTimerRunning(false)
      }
    }
    
    // Night Owl Check
    const hour = new Date().getHours()
    if (hour >= 23 || hour <= 4) {
      setAchievements(prev => prev.map(a => a.id === 'night_owl' ? { ...a, completed: true } : a))
    }
  }, [])

  // Persist Grove
  useEffect(() => {
    localStorage.setItem('pulp-grove', JSON.stringify({ sunshine, gems, grove, achievements }))
  }, [sunshine, gems, grove, achievements])

  // Persist Timer
  useEffect(() => {
    localStorage.setItem('pulp-timer', JSON.stringify({
      elapsed: timerElapsed,
      total: timerTotal,
      running: timerRunning,
      done: timerDone,
      preset: timerPreset,
      timestamp: Date.now()
    }))
  }, [timerElapsed, timerTotal, timerRunning, timerDone, timerPreset])

  const checkAchievement = useCallback((id: string, update?: (a: Achievement) => Partial<Achievement>) => {
    setAchievements(prev => prev.map(a => {
      if (a.id !== id || a.completed) return a
      const updated = update ? { ...a, ...update(a) } : { ...a, completed: true }
      // Progress behavior
      if (updated.goal !== undefined && (updated.progress || 0) >= updated.goal) {
        updated.completed = true
      }
      return updated
    }))
  }, [])

  const claimAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const target = prev.find(x => x.id === id)
      if (!target || !target.completed || target.claimed) return prev
      
      if (target.rewardType === 'gems') setGems(g => g + target.reward)
      else setSunshine(s => s + target.reward)
      
      return prev.map(x => x.id === id ? { ...x, claimed: true } : x)
    })
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (timerRunning && !timerDone) {
      interval = setInterval(() => {
        setTimerElapsed(prev => {
          if (prev >= timerTotal) {
            setTimerRunning(false)
            setTimerDone(true)
            return timerTotal
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning, timerDone, timerTotal])

  // Earn Sunshine over time (1 every 30 seconds of activity)
  useEffect(() => {
    const timer = setInterval(() => {
      setSunshine(s => s + 1)
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // Earn Gems via writing
  const totalChars = useMemo(() => {
    const activeNote = notes.find(n => n.id === activeTabId)
    if (!activeNote) return 0
    return Object.values(activeNote.boxes).flat().reduce((acc, b) => acc + (b.content ? b.content.length : 0), 0)
  }, [notes, activeTabId])

  useEffect(() => {
    if (totalChars > lastCharCount + 500) {
      setGems(n => n + Math.floor((totalChars - lastCharCount) / 500))
      setLastCharCount(totalChars)
      checkAchievement('novice_writer', a => ({ progress: totalChars }))
    }
  }, [totalChars, lastCharCount, checkAchievement])


  // Settings
  const [settings, setSettings] = useState<any>({
    accent: "#600b27",
    theme: "light",
    autoSave: true,
    spellCheck: true,
    autoCorrect: true,
    autoCapitalize: true,
    editorFont: "EB Garamond",
    headingFont: "Playfair Display",
    lineSpacing: "normal",
    paperStyle: "lined",
    showBinding: true,
    reduceMotion: false,
    reduceVisuals: false,
    sidebarOnStart: true,
    bgEffect: true,
    smearEffect: true,
    handwrittenEffect: true,
    language: "english",
    defaultSort: "modified",
    wordCountVisible: true,
    focusMode: false,
    baseFontSize: "medium",
    shortcuts: { ai: "ctrl+j", slash: "/" },
    blockedSites: [],
    blockedApps: [],
    devMode: false,
    isDevUnlocked: false
  })
  
  const updateSettings = (updates: any) => setSettings((prev: any) => ({ ...prev, ...updates }))

  const {
    accent, theme, autoSave, spellCheck, autoCorrect, autoCapitalize, editorFont, headingFont,
    lineSpacing, paperStyle, showBinding, reduceMotion, reduceVisuals, sidebarOnStart, bgEffect, 
    smearEffect, handwrittenEffect, language, defaultSort, wordCountVisible, focusMode, baseFontSize,
    shortcuts, blockedSites, blockedApps, devMode, isDevUnlocked 
  } = settings
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [trashNotes, setTrashNotes] = useState<NoteData[]>([])
  const [skipDeleteConfirmation, setSkipDeleteConfirmation] = useState(false)

  const [activeTool, setActiveTool] = useState('select')
  const [stickyColor, setStickyColor] = useState('#fef08a')

  const setCover = useCallback((dataUrl: string) => {
    setNotes(ns => ns.map(n => n.id === activeTabId ? { ...n, cover: dataUrl } : n))
    setShowCoverModal(false)
  }, [activeTabId])

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
      x: 64, y: y - 4, w: width, h: 8,
      content: `<div contenteditable="false" style="height:8px;width:100%;display:flex;align-items:center;pointer-events:none;"><svg width="100%" height="4" viewBox="0 0 100 4" preserveAspectRatio="none" style="filter:url(#handwritten-jitter);overflow:visible;"><line x1="0" y1="2" x2="100" y2="2" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" /></svg></div>`,
      boxHeadingStyle: 'default'
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
    () => (notes.find(n => n.id === activeTabId) ?? notes.filter(n => !n.archived)[0]) as NoteData,
    [notes, activeTabId]
  )

  const wordCount = useMemo(() => {
    if (!activeNote) return 0
    let text = activeNote.pages[currentPageIdx] || ""
    const boxText = (activeNote.boxes[currentPageIdx] || []).map(b => htmlToPlain(b.content)).join(" ")
    text = htmlToPlain(text) + " " + boxText
    return text.split(/\s+/).filter(Boolean).length
  }, [activeNote, currentPageIdx])

  // Dialog helpers
  const openPrompt = useCallback((title: string, defaultValue: string, placeholder: string, confirmLabel: string, onConfirm: (v: string) => void, icon?: string) => setDialog({ type: "prompt", title, defaultValue, placeholder, confirmLabel, onConfirm, icon }), [])
  const openConfirm = useCallback((title: string, message: string, onConfirm: (checked?: boolean) => void, confirmLabel?: string, danger?: boolean, showCheckbox?: boolean, checkboxLabel?: string) => setDialog({ type: "confirm", title, message, onConfirm, confirmLabel, danger, showCheckbox, checkboxLabel }), [])
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
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [aiMenu, setAiMenu] = useState<{ x: number; y: number; selectedText?: string } | null>(null)
  const [showAiCommandBar, setShowAiCommandBar] = useState(false)
  const [aiExpression, setAiExpression] = useState<"normal" | "wink" | "sleepy" | "heart" | "surprised">("normal")
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
            // Handle the case where @ was inserted: delete the character right after anchor.offset
            if (anchor.offset <= textNode.length) {
              const r = document.createRange()
              r.setStart(textNode, anchor.offset)
              r.setEnd(textNode, Math.min(anchor.offset + 1, textNode.length))
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
      const isBox = (e.currentTarget as HTMLElement) !== editorRef.current
      if (isBox) {
        (e.currentTarget as HTMLElement).blur()
        boxes.setSelectedBoxIds(new Set())
        e.preventDefault()
      }
      return
    }
    const isMeta = e.metaKey || e.ctrlKey
    const isAlt = e.altKey
    const isShift = e.shiftKey
    const modParts = []
    if (isMeta) modParts.push("cmd")
    if (isAlt) modParts.push("alt")
    if (isShift) modParts.push("shift")
    if (!["Meta", "Control", "Alt", "Shift", "Escape"].includes(e.key)) {
      modParts.push(e.key.toLowerCase())
    }
    const eventKeyStr = modParts.join("+")

    if (eventKeyStr === shortcuts.ai) {
      e.preventDefault()
      const sel = window.getSelection()
      const selectedText = sel && !sel.isCollapsed ? sel.toString().trim() : undefined
      let x = 200, y = 200
      if (sel && sel.rangeCount > 0) {
        let rect = sel.getRangeAt(0).getBoundingClientRect()
        // If it's a collapsed selection, getBoundingClientRect might have 0 width/height giving wrong pos
        if (rect.x === 0 && rect.y === 0) {
          const span = document.createElement("span")
          span.textContent = "\u200b"
          sel.getRangeAt(0).insertNode(span)
          rect = span.getBoundingClientRect()
          span.parentNode?.removeChild(span)
        }
        x = rect.left
        y = rect.top - 12 // open a bit higher so it's clearly above the line
      }
      setAiMenu({ x, y, selectedText })
      return
    }

    if (e.key === shortcuts.slash || e.key === "@") {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const isBox = (e.currentTarget as HTMLElement) !== editorRef.current
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
        setSlashMenu(m)
        return
      }

      e.preventDefault()

      // Insert @ character at cursor position
      const range = sel.getRangeAt(0)
      const textNode = range.startContainer.nodeType === Node.TEXT_NODE
        ? (range.startContainer as Text)
        : null

      if (textNode) {
        // Insert @ into existing text node
        textNode.insertData(range.startOffset, "@")
        range.setStart(textNode, range.startOffset + 1)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        // Update anchor to point to the correct position
        slashAnchorRef.current = { node: textNode, offset: range.startOffset - 1 }
      } else {
        // Create new text node for @
        const newText = document.createTextNode("@")
        range.insertNode(newText)
        range.setStart(newText, 1)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        // Update anchor to point to the new text node
        slashAnchorRef.current = { node: newText, offset: 0 }
      }

      // Sync content if in editor
      if ((e.currentTarget as HTMLElement) === editorRef.current) {
        editor.syncContent()
      }

      // Measure menu position
      const clonedRange = sel.getRangeAt(0).cloneRange()
      clonedRange.collapse(true)
      const span = document.createElement("span")
      span.textContent = "\u200b"
      clonedRange.insertNode(span)
      const rect = span.getBoundingClientRect()
      span.parentNode?.removeChild(span)

      const m = {
        x: rect.left,
        y: rect.bottom + 14,
        filter: "",
        type: isBox ? ("textarea" as const) : ("editor" as const),
        mode: "@" as const,
        target: e.currentTarget as HTMLElement
      }
      slashMenuRef.current = m
      setSlashMenu(m)
    }
  }, [editor.handleEditorKeyDown, closeSlashMenu])

  const handleEditorInput = useCallback((e: React.FormEvent<HTMLElement>) => {
    if ((e.currentTarget as HTMLElement) === editorRef.current) {
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

  useEffect(() => {
    const checkViewport = () => {
      const isNarrow = window.innerWidth < 1000
      updateSettings({ wordCountVisible: !isNarrow })
    }
    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  // Global keyboard shortcuts (Ctrl+N, Ctrl+K, \)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const isCmd = e.ctrlKey

      // Cmd/Ctrl+N - Create new note
      if (isCmd && e.key === 'n') {
        e.preventDefault()
        addNote(null)
        return
      }

      // Cmd/Ctrl+K - Search
      if (isCmd && e.key === 'k') {
        e.preventDefault()
        setSlashMenu(null)
        // Focus search or trigger search UI
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) searchInput.focus()
        return
      }

      // \ - AI editing command
      if (e.key === "\\") {
        const active = document.activeElement as HTMLElement | null
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
          return // Let the editor or inputs handle it
        }
        e.preventDefault()
        setShowAiCommandBar(true)
      }

      // Cmd+Option+T (Mac) / Ctrl+Alt+T (Windows) - Toggle Timer
      if (isCmd && e.altKey && e.key === 't') {
        e.preventDefault()
        setTimerOpen(!timerOpen)
      }
    }
    window.addEventListener("keydown", handleGlobalKey)
    return () => window.removeEventListener("keydown", handleGlobalKey)
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
        updateSettings(s)
      } catch (e) { console.error("Local settings load failed:", e) }
    }
  }, [])

  // Load settings from cloud
  useEffect(() => {
    if (!user) return
    supabase.from("user_settings").select("settings").eq("user_id", user.id).single().then(({ data }) => {
      if (!data?.settings) return
      const s = data.settings
      updateSettings(s)
      if (s.trashNotes) setTrashNotes(s.trashNotes)
      if (s.skipDeleteConfirmation !== undefined) setSkipDeleteConfirmation(s.skipDeleteConfirmation)
    })
  }, [user])

  // Save settings to localStorage (immediate) and cloud (debounced)
  useEffect(() => {
    const settings = { accent, theme, autoSave, spellCheck, autoCorrect, autoCapitalize, editorFont, lineSpacing, paperStyle, showBinding, reduceMotion, reduceVisuals, sidebarOnStart, bgEffect, bookmarks, language, defaultSort, wordCountVisible, focusMode, baseFontSize, trashNotes, skipDeleteConfirmation }
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
  }, [accent, theme, autoSave, spellCheck, autoCorrect, autoCapitalize, editorFont, lineSpacing, paperStyle, showBinding, reduceMotion, reduceVisuals, sidebarOnStart, bgEffect, bookmarks, language, defaultSort, wordCountVisible, focusMode, baseFontSize, trashNotes, skipDeleteConfirmation, user])

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
    if (!activeTabId || gridView) return
    const key = `${activeTabId}:${currentPageIdx}:${gridView}`
    if (!gridView && editorRef.current && lastSyncKey.current !== key) {
      editorRef.current.innerHTML = activeNote?.pages[currentPageIdx] || ""
      lastSyncKey.current = key
    }
  }, [activeTabId, currentPageIdx, gridView, activeNote?.pages])

  // AI Easter Egg Expression Loop
  useEffect(() => {
    const expressions: Array<typeof aiExpression> = ["wink", "sleepy", "heart", "surprised"]
    const scheduleNext = () => {
      // Random delay: 1–3 hours (3,600,000 – 10,800,000 ms)
      const delay = 3600000 + Math.random() * 7200000 
      return setTimeout(() => {
        const next = expressions[Math.floor(Math.random() * expressions.length)]
        setAiExpression(next)
        
        // Reset to normal after 5-8 seconds
        setTimeout(() => setAiExpression("normal"), 5000 + Math.random() * 3000)
        
        scheduleNext() // Loop
      }, delay)
    }
    const timer = scheduleNext()
    return () => clearTimeout(timer)
  }, [])

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
    localStorage.setItem("pulp-notes", JSON.stringify(notes))
    localStorage.setItem("pulp-folders", JSON.stringify(folders))
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
    openPrompt("Name your notebook", "New Notebook", "Notebook name…", "Create", name => {
      const finalName = name.trim() || "New Notebook"
      const id = uid()
      const newNote = { id, subject: finalName, pages: [""], folderId, boxes: {} }
      setNotes(prev => [...prev, newNote])
      setActiveTabId(id); setCurrentPageIdx(0)
    }, "📓")

  const addFirstNotebook = () => {
    const id = uid()
    const newNote = { id, subject: "My First Notebook", pages: [""], folderId: null, boxes: {} }
    setNotes(prev => [...prev, newNote])
    setActiveTabId(id); setCurrentPageIdx(0)
  }

  const addTypedNote = (folderId: number | null = null, noteType?: NoteData["noteType"]) => {
    let title = "New Notebook"
    let placeholder = "Notebook name…"
    let promptTitle = "Name your notebook"
    let icon = "📓"

    if (noteType === "singlepage") { 
      title = "New Page"; placeholder = "Page name…"; promptTitle = "Name your page"; icon = "📄"
    } else if (noteType === "flashcard") { 
      title = "New Deck"; placeholder = "Deck name…"; promptTitle = "Name your deck"; icon = "🃏"
    } else if (noteType === "vault") { 
      title = "New Vault"; placeholder = "Vault name…"; promptTitle = "Name your vault"; icon = "🔐"
    }
    
    const finishCreate = (name: string, pwd?: string) => {
      const id = uid()
      const baseNote = { id, subject: name.trim(), folderId, boxes: {}, noteType, password: pwd }
      const newNote: NoteData = noteType === "flashcard"
        ? { ...baseNote, pages: [""], flashcards: [{ id: uid(), front: "", back: "", interval: 1, easeFactor: 2.5, repetitions: 0, nextReviewDate: Date.now() }] }
        : noteType === "singlepage"
        ? { ...baseNote, pages: [""], icon: "📄" }
        : noteType === "vault"
        ? { ...baseNote, pages: [""], icon: "🔐" }
        : { ...baseNote, pages: [""] }
        
      if (noteType === "vault") unlockedVaults.current.add(id)
      setNotes(prev => [...prev, newNote])
      setActiveTabId(id); setCurrentPageIdx(0)
    }

    openPrompt(promptTitle, title, placeholder, "Create", name => {
      if (!name.trim() && !title) return
      const finalName = name.trim() || title
      if (noteType === "vault") {
        setTimeout(() => {
          openPrompt("Set Password", "Vault Password", "Enter a password...", "Create", pwd => {
            if (!pwd) { openAlert("Error", "Password is required for a vault."); return }
            finishCreate(finalName, pwd)
          }, "🔑")
        }, 150)
      } else {
        finishCreate(finalName)
      }
    }, icon)
  }

  const AI_ACTIONS = [
    { id: "quiz", label: "Quiz me" },
    { id: "summarize", label: "Summarize" },
    { id: "explain", label: "Explain" },
    { id: "outline", label: "Outline" },
    { id: "improve", label: "Improve writing" },
  ]

  const handleAiAction = useCallback(async (action: string) => {
    const pageText = editorRef.current?.innerText?.trim() || ""
    if (!pageText) { openAlert("Nothing to process", "Add some text to your note first."); return }
    const actionLabel = AI_ACTIONS.find(a => a.id === action)?.label || action
    setAiResult({ title: actionLabel, result: "", loading: true })
    try {
      const res = await fetch("/api/ai", { method: "POST", body: JSON.stringify({ action, text: pageText }) })
      if (!res.ok) throw new Error("API error")
      const data = await res.json()
      setAiResult(prev => prev ? { ...prev, result: data.result || "", loading: false } : null)
    } catch {
      setAiResult(null); openAlert("AI Error", "Could not process your request.")
    }
  }, [AI_ACTIONS])

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

  const deleteNote = (id: string) => {
    const note = notes.find(n => n.id === id)
    if (!note) return
    setNotes(ns => ns.filter(n => n.id !== id))
    setTrashNotes(ts => [...ts, { ...note, deletedAt: new Date().toISOString() }])
    if (activeTabId === id) setActiveTabId(null)
    if (user) supabase.from("notes").delete().eq("id", id)
  }

  const restoreNote = (id: string) => {
    const note = trashNotes.find(n => n.id === id)
    if (!note) return
    setTrashNotes(ts => ts.filter(n => n.id !== id))
    setNotes(ns => [...ns, { ...note, deletedAt: undefined }])
  }

  const permanentlyDeleteNote = (id: string) => {
    setTrashNotes(ts => ts.filter(n => n.id !== id))
  }

  const archiveNote = (id: string) => {
    if (activeTabId === id) setActiveTabId(null)
    setNotes(ns => ns.map(n => n.id === id ? { ...n, archived: true } : n))
    checkAchievement('archivist', a => ({ progress: (a.progress || 0) + 1 }))
  }

  const unarchiveNote = (id: string) => {
    setNotes(ns => ns.map(n => n.id === id ? { ...n, archived: false } : n))
  }

  const archivedNotes = notes.filter(n => n.archived)

  // Periodic cleanup of trash older than 30 days
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now()
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
      setTrashNotes(ts => ts.filter(tn => {
        if (!tn.deletedAt) return true
        return (now - new Date(tn.deletedAt).getTime()) < thirtyDaysMs
      }))
    }
    const timer = setInterval(cleanup, 1000 * 60 * 60) // Check every hour
    cleanup()
    return () => clearInterval(timer)
  }, [])

  const clearPage = () =>
    openConfirm("Clear this page?", "All content on this page will be deleted. This cannot be undone.", () => {
      if (editorRef.current) editorRef.current.innerHTML = ""
      setNotes(prev => prev.map(n => {
        if (n.id !== activeTabId) return n
        const newPages = [...n.pages]; newPages[currentPageIdx] = ""
        const newBoxes = { ...n.boxes }; newBoxes[currentPageIdx] = []
        return { ...n, pages: newPages, boxes: newBoxes }
      }))
    })

  const insertCornell = () =>
    openConfirm("Apply Cornell Layout?", "This will clear everything currently on this page.", () => {
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

  const addFolder = () => {
    const id = Date.now()
    setFolders(prev => [...prev, { id, name: "New Folder", open: true }])
    setRenamingFolder(id)
    checkAchievement('binder_buddy', a => ({ progress: (a.progress || 0) + 1 }))
  }
  const toggleFolder = (id: number) => setFolders(prev => prev.map(f => f.id === id ? { ...f, open: !f.open } : f))
  const renameFolder = (id: number, name: string) => setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  const deleteFolder = (id: number) =>
    openConfirm("Delete folder?", "Notes inside will be moved to root.", () => {
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

  const handleUnlockDev = () => {
    updateSettings({ isDevUnlocked: true })
  }

  const handleOpenShop = () => {
    openAlert("Coming Soon", "The Pulp Boutique is currently in development.")
  }

  const { backgroundColor: paperBg, backgroundImage: paperImg, backgroundSize: paperSize } = getPaperBg(lineSpacing, paperStyle, theme === "dark")


  return (
    <div className="flex h-screen overflow-hidden font-sans relative" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#F0ECEA", color: theme === "dark" ? "#FAFAFA" : "#1A1A1A", backgroundImage: bgEffect ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='${theme === "dark" ? "0.035" : "0.045"}'/%3E%3C/svg%3E")` : undefined, backgroundRepeat: "repeat" }}>
      {dialog && <AppDialog config={dialog} accent={accent} onClose={() => setDialog(null)} />}
      {showSettings && (
        <SettingsView 
          user={user} 
          onClose={() => setShowSettings(false)} 
          config={{ ...settings, accentColor: accent }} 
          onUpdateConfig={updates => updateSettings({ ...updates, accent: updates.accentColor || accent })}
          achievements={achievements} 
          onClaimAchievement={claimAchievement} 
          trashNotes={trashNotes} 
          onRestoreNote={restoreNote} 
          onPermanentlyDeleteNote={permanentlyDeleteNote} 
        />
      )}
      <GlobalStyles reduceMotion={reduceMotion} reduceVisuals={reduceVisuals} theme={theme} handwrittenEffect={handwrittenEffect} />



      {!gridView && sidebarWidth > 40 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          style={{ display: gridView ? 'none' : 'flex', position: 'relative', height: '100%' }}
        >
          <Sidebar
          notes={notes}
          folders={folders}
          activeTabId={activeTabId}
          accent={accent}
          draggedNoteId={draggedNoteId}
          renamingFolder={renamingFolder}
          user={user}
          sidebarWidth={200}
          isDragging={isSidebarDragging}
          onAddNote={addNote}
          onAddTypedNote={addTypedNote}
          onAddFolder={addFolder}
          onSelectNote={id => {
            const n = notes.find(x => x.id === id)
            if (n?.noteType === "vault" && !unlockedVaults.current.has(id)) {
              openPrompt("Enter Password", "Vault Locked", "Password...", "Unlock", pwd => {
                if (pwd === (n.password || "")) {
                  unlockedVaults.current.add(id)
                  editor.flushSync(); setActiveTabId(id); setCurrentPageIdx(0); setCurrentView("editor")
                } else {
                  openAlert("Access Denied", "Incorrect password.")
                }
              })
              return
            }
            editor.flushSync(); setActiveTabId(id); setCurrentPageIdx(0); setCurrentView("editor")
          }}
          onRenameNote={renameNote}
          onDeleteNote={deleteNote}
          archivedNotes={archivedNotes}
          onArchiveNote={archiveNote}
          onUnarchiveNote={unarchiveNote}
          unlockedIds={unlockedVaults.current}
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
          onUnlockDev={handleUnlockDev}
        />

        </motion.div>
      )}

      {/* Sidebar edge resize handle - disabled for compact collapsible sidebar */}

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


        {/* ── Bookmark ribbon — placed next to the lightbulb ── */}
        {notes.filter(n => !n.archived).length > 0 && activeNote && (() => {
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
                width: 14,
                zIndex: 30,
                cursor: "pointer",
                transformOrigin: "top",
                filter: isBookmarked ? "drop-shadow(0 4px 8px rgba(225,29,72,0.5))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
              }}
            >
              <div style={{
                width: "100%",
                height: 52,
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

        {notes.filter(n => !n.archived).length > 0 && (
          <div className="relative">
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
              rightSidebarOpen={timerOpen}
              setRightSidebarOpen={setTimerOpen}
              allCompacted={allCompacted}
              onCompactAll={handleCompactAll}
              onInsertHR={() => editor.insertHTML('<hr style="all:unset;display:block;height:2px;background:#1a1a1a;width:90%;margin:16px auto;box-sizing:border-box;border-radius:1px"><br>')}
              isVault={activeNote?.noteType === "vault"}
              isUnlocked={activeNote ? unlockedVaults.current.has(activeNote.id) : false}
              onLock={() => {
                if (activeNote) {
                  unlockedVaults.current.delete(activeNote.id)
                  setNotes(prev => [...prev])
                }
              }}
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
              onStartSidebarDrag={startSidebarDrag}
              sidebarWidth={sidebarWidth}
              isSidebarDragging={isSidebarDragging}
              sunshine={devMode ? 999999 : sunshine}
              gems={devMode ? 999999 : gems}
              sidebarOpen={sidebarWidth > 40}
              onSidebarToggle={() => setSidebarWidth(sidebarWidth > 40 ? 0 : 256)}
              onTimerOpen={() => setTimerOpen(!timerOpen)}
              onOpenShop={handleOpenShop}
            />
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          {notes.filter(n => !n.archived).length === 0 ? (
            <main className="flex-1 flex items-center justify-center px-4 overflow-hidden" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#EDE8E6" }}>
              <div className="text-center max-w-md overflow-hidden">
                {/* Heading */}
                <h1 className="text-4xl font-medium tracking-tight mb-8" style={{ fontFamily: '"EB Garamond", serif', color: theme === "dark" ? "#fafafa" : "#1a1a1a" }}>Create your first notebook now.</h1>

                {/* Primary Button */}
                <AnimatedCreateButton onClick={addFirstNotebook} accent={accent} theme={theme} />

                {/* Quick Tips */}
                <div className="mt-8 pt-6" style={{ borderTop: theme === "dark" ? "1px solid #333" : "1px solid #ddd" }}>
                  <p className="text-xs font-medium mb-3" style={{ color: theme === "dark" ? "#888" : "#999" }}>Quick Tips</p>
                  <ul className="text-xs space-y-2 flex flex-col items-center" style={{ color: theme === "dark" ? "#999" : "#777" }}>
                    <li className="flex items-center gap-2">📝 <span style={{ opacity: 0.3 }}>|</span> Press <code style={{ background: theme === "dark" ? "#1a1a1a" : "#f0f0f0", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace", marginLeft: "4px" }}>Ctrl+N</code> to create notes</li>
                    <li className="flex items-center gap-2">🔍 <span style={{ opacity: 0.3 }}>|</span> Press <code style={{ background: theme === "dark" ? "#1a1a1a" : "#f0f0f0", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace", marginLeft: "4px" }}>Ctrl+K</code> to search</li>
                    <li className="flex items-center gap-2">🤖 <span style={{ opacity: 0.3 }}>|</span> Press <code style={{ background: theme === "dark" ? "#1a1a1a" : "#f0f0f0", padding: "2px 6px", borderRadius: "3px", fontFamily: "monospace", marginLeft: "4px" }}>\</code> for AI editing</li>
                  </ul>
                </div>

                {/* Theme Toggle */}
                <div className="mt-6 flex items-center justify-center">
                  <div
                    onClick={() => updateSettings({ theme: theme === "light" ? "dark" : "light" })}
                    className="relative flex items-center rounded-full px-1 py-1 transition-all cursor-pointer"
                    style={{
                      backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                      border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"}`,
                      width: 72,
                      height: 32,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ flex: 1, display: "flex", justifyContent: "center", color: theme === "light" ? "#fbbf24" : "#888", zIndex: 10, position: "relative" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2" stroke="currentColor" />
                        <line x1="12" y1="21" x2="12" y2="23" strokeWidth="2" stroke="currentColor" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="2" stroke="currentColor" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="2" stroke="currentColor" />
                        <line x1="1" y1="12" x2="3" y2="12" strokeWidth="2" stroke="currentColor" />
                        <line x1="21" y1="12" x2="23" y2="12" strokeWidth="2" stroke="currentColor" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="2" stroke="currentColor" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="2" stroke="currentColor" />
                      </svg>
                    </div>
                    <motion.div
                      animate={{ x: theme === "dark" ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                        position: "absolute",
                        left: 2,
                        zIndex: 0
                      }}
                    />
                    <div style={{ flex: 1, display: "flex", justifyContent: "center", color: theme === "dark" ? "#fbbf24" : "#888", zIndex: 10, position: "relative" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          ) : gridView ? (
            <GridView activeNote={activeNote} activeTabId={activeTabId} carouselIdx={carouselIdx} lineSpacing={lineSpacing} paperStyle={paperStyle} theme={theme} editorFont={editorFont} accent={accent} setCarouselIdx={setCarouselIdx} setGridView={setGridView} setCurrentPageIdx={setCurrentPageIdx} setNotes={setNotes} />
          ) : activeNote?.noteType === "flashcard" ? (
            <main className="flex-1 overflow-y-scroll flex justify-center items-center" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#EDE8E6", scrollbarGutter: "stable" }}>
              <FlashcardView
                cards={activeNote.flashcards || []}
                onChange={cards => setNotes(ns => ns.map(n => n.id === activeTabId ? {...n, flashcards: cards} : n))}
                noteTitle={activeNote.subject}
                theme={theme}
                accent={accent}
              />
            </main>
          ) : (
            <main className="flex-1 overflow-y-scroll px-8 pt-16 pb-8 flex justify-center items-start transition-all" style={{ backgroundColor: theme === "dark" ? "#09090b" : "#F5F5F5", scrollbarGutter: "stable", paddingRight: timerOpen ? "calc(2rem + 320px)" : "2rem" }}>
              <div style={{ zoom: zoom, transformOrigin: "top center", contain: "layout style", margin: "0 auto" }} className="w-full max-w-5xl shrink-0">
                <div style={{ position: "relative" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 4, right: -4, bottom: -2, backgroundColor: theme === "dark" ? "#1f1f23" : "#FCFBF9", borderRadius: 2, zIndex: 1, boxShadow: "2px 2px 10px rgba(0,0,0,0.08)" }} />
                    <div style={{ position: "absolute", top: 0, left: 8, right: -8, bottom: -4, backgroundColor: theme === "dark" ? "#1a1a1e" : "#FAFAFA", borderRadius: 2, zIndex: 0, boxShadow: "2px 4px 12px rgba(0,0,0,0.06)" }} />
                    <div style={{ position: "absolute", top: 0, left: 12, right: -12, bottom: -6, backgroundColor: theme === "dark" ? "#151518" : "#F8F8F8", borderRadius: 2, zIndex: -1 }} />

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
                      {activeNote.noteType === "vault" && !unlockedVaults.current.has(activeNote.id) ? (
                        <div className="absolute inset-0 z-[60] bg-zinc-900/5 backdrop-blur-[1px] flex flex-col items-center justify-start pt-60 p-10 select-none pointer-events-none">
                          <div className="bg-white/90 dark:bg-zinc-900/90 p-10 rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center gap-5 text-center anim-fade-in pointer-events-auto" style={{ filter: 'url(#handwritten-jitter-subtle)' }}>
                            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 dark:text-zinc-300"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-widest" style={{ fontFamily: 'var(--font-italiana)' }}>Vault Locked</h3>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-[200px]">This notebook is securely encrypted.</p>
                            </div>
                            <button 
                              onClick={() => {
                                const n = notes.find(x => x.id === activeNote.id)
                                if (n) {
                                  openPrompt("Enter Password", "Vault Locked", "Password...", "Unlock", pwd => {
                                    if (pwd === (n.password || "")) {
                                      unlockedVaults.current.add(n.id)
                                      setNotes(prev => [...prev])
                                    } else {
                                      openAlert("Access Denied", "Incorrect password.")
                                    }
                                  })
                                }
                              }}
                              className="mt-2 px-8 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-full shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                            >
                              Unlock Now
                            </button>
                          </div>
                        </div>
                       ) : (
                         <>
                           <div className="absolute left-28 top-0 bottom-0 w-[1px] z-20 pointer-events-none" style={{ backgroundColor: theme === "dark" ? "rgba(248,113,113,0.3)" : "rgba(252,165,165,0.6)" }} />
                           {smearEffect && <div className="absolute top-0 left-0 bottom-0 pointer-events-none" style={{ width: 220, background: "linear-gradient(to right, rgba(0,0,0,0.065) 0%, rgba(0,0,0,0.018) 50%, transparent 100%)", zIndex: 21 }} />}

                           {/* Render custom user-drawn lines */}
                           {(() => {
                             // Use lineSelectionVersion to force re-render on line selection change
                             boxes.lineSelectionVersion
                             return (activeNote.lines?.[currentPageIdx] || []).map((lx, idx) => {
                               const isSelected = boxes.selectedLineRef.current === lx
                               return (
                                 <div key={idx} className="absolute top-0 bottom-0 z-20 pointer-events-none transition-all" style={{
                                   left: lx,
                                   width: isSelected ? "3px" : "1.5px",
                                   backgroundColor: isSelected ? accent : (theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"),
                                   borderLeft: isSelected ? `2px solid ${accent}` : `1px dashed ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                                   opacity: isSelected ? 1 : 0.6,
                                   boxShadow: isSelected ? `0 0 12px ${accent}33` : undefined
                                 }} />
                               )
                             })
                           })()}

                           {/* Cover display on first page */}
                           {activeNote.cover && currentPageIdx === 0 && (
                             <div style={{ width: "100%", marginBottom: 16, borderRadius: 6, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
                               <img src={activeNote.cover} style={{ width: "100%", display: "block" }} alt="Notebook Cover" />
                             </div>
                           )}

                           <div
                             ref={editorRef}
                             className={`w-full min-h-[1000px] outline-none pointer-events-none transition-opacity duration-300 ${focusMode ? "opacity-40 focus-within:opacity-100" : ""}`}
                             style={{
                               fontFamily: `"${editorFont}", "Indie Flower", Georgia, serif`,
                               fontSize: baseFontSize === "small" ? 14 : baseFontSize === "large" ? 22 : 18,
                               filter: "url(#handwritten-jitter-subtle)",
                               fontWeight: 400,
                               letterSpacing: "0.1px",
                               lineHeight: 1.8,
                             }}
                             spellCheck={spellCheck}
                             autoCorrect={autoCorrect ? "on" : "off"}
                             autoCapitalize={autoCapitalize ? "on" : "off"}
                           />

                           <style>{`
                             #editor-paper [contenteditable] {
                               color: #1a1a1a !important;
                               caret-color: ${accent.length > 7 ? accent.slice(0, 7) : accent} !important;
                               opacity: 1 !important;
                               font-family: "${editorFont}", "Indie Flower", "Caveat", cursive, Georgia, serif !important;
                               font-weight: 500 !important;
                               letter-spacing: 0.1px !important;
                               line-height: 1.8 !important;
                               text-rendering: optimizeLegibility !important;
                               filter: ${handwrittenEffect ? 'url(#handwritten-jitter)' : 'none'} !important;
                             }
                             .erased {
                               text-decoration: line-through;
                               text-decoration-thickness: 1.5pt;
                               text-decoration-color: rgba(0,0,0,0.6);
                               pointer-events: none;
                               user-select: none;
                               display: inline-block;
                               animation: erase-fade 6s forwards cubic-bezier(0.4, 0, 1, 1);
                               vertical-align: baseline;
                               white-space: pre;
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
                               backgroundColor: `${accent}18`,
                               border: `1.5px dashed ${accent}`,
                               boxShadow: `0 0 20px -5px ${accent}44`,
                               borderRadius: "4px",
                               pointerEvents: "none",
                               zIndex: 10000,
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
                         </>
                       )}

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

                        {/* Cover button — subtle, top-right corner */}
                        <button
                          onClick={() => setShowCoverModal(true)}
                          className="absolute top-4 right-4 p-1.5 opacity-0 hover:opacity-100 transition-opacity rounded-md hover:bg-black/5"
                          style={{ color: theme === "dark" ? "#9ca3af" : "#4b5563" }}
                          title={activeNote?.cover ? "Edit cover" : "Add cover"}
                        >
                          {activeNote?.cover ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity="0.6"><path d="M3 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><circle cx="8.5" cy="8.5" r="1.5" fill="white"/><path d="M21 15l-5-5L5 21" stroke="white" strokeWidth="2" fill="none"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5a2.5 2.5 0 0 0-2 2.5v1a2.5 2.5 0 0 0 2.5 2.5H20"/></svg>
                          )}
                        </button>
                      </div>{/* end deadzone */}

                    </div>
                  </div>
                  <div style={{ height: 60, marginTop: -8, background: "radial-gradient(ellipse 90% 55% at 46% 0%, rgba(0,0,0,0.22) 0%, transparent 70%)", pointerEvents: "none", position: "relative", zIndex: 0 }} />
                </div>
              </div>
            </main>
          )}

        </div>

        {notes.filter(n => !n.archived).length > 0 && !gridView && (
          <>
            <FloatingToolbar accent={accent} activeTool={activeTool} onToolChange={setActiveTool} onClearDrawing={drawing.clearCanvas} onImageUpload={handleImageUpload} isVisible={showDrawToolbar} />
            <HangingOrange onClick={() => {/* Opens garden page (coming soon) */}} />
          </>
        )}
      </div>


      {slashMenu && (
        <SlashMenu
          {...slashMenu}
          accent={accent}
          box={slashMenu.target?.closest('[id^="box-"]') ? activeNote.boxes[currentPageIdx]?.find(b => b.id === slashMenu.target?.closest('[id^="box-"]')?.id.replace("box-", "")) : undefined}
          onUpdateBox={boxes.updateBox}
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

      {showCoverModal && (
        <CoverModal
          existingCover={activeNote?.cover}
          onConfirm={setCover}
          onClose={() => setShowCoverModal(false)}
        />
      )}

      {aiMenu && (
        <AiInlineMenu
          x={aiMenu.x}
          y={aiMenu.y}
          selectedText={aiMenu.selectedText}
          isDark={theme === "dark"}
          onClose={() => setAiMenu(null)}
          onSubmit={async (prompt: string, selectedText?: string) => {
            setAiMenu(null)

            try {
              const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, text: selectedText || "" })
              })

              const data = await response.json()

              if (!response.ok) {
                const errorMsg = data.error || `Request failed with status ${response.status}`
                throw new Error(errorMsg)
              }

              const result = data.result || ""
              if (!result) {
                throw new Error("No response from AI")
              }

              // Insert inline: replace selected text or insert at cursor
              if (selectedText) {
                editor.execCmd("insertText", result)
              } else {
                editor.insertHTML(result)
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : "Unknown error"
              console.error("AI error:", errorMsg)
              openAlert("AI Error", errorMsg)
            }
          }}
        />
      )}

      {aiResult && (
        <AiResultModal
          title={aiResult.title}
          result={aiResult.result}
          loading={aiResult.loading}
          onClose={() => setAiResult(null)}
          onInsert={text => { editor.insertHTML(`<p>${text}</p>`); setAiResult(null) }}
        />
      )}

      {showAiCommandBar && (
        <AiCommandBar
          onClose={() => setShowAiCommandBar(false)}
          onSubmit={async (prompt) => {
            setShowAiCommandBar(false)
            setAiResult({ title: "AI Generation", result: "", loading: true })
            try {
              const res = await fetch("/api/ai", { method: "POST", body: JSON.stringify({ action: "generate", text: prompt }) })
              if (!res.ok) throw new Error("API error")
              const data = await res.json()
              setAiResult(prev => prev ? { ...prev, result: data.result || "", loading: false } : null)
            } catch {
              setAiResult(null); openAlert("AI Error", "Could not process your request.")
            }
          }}
        />
      )}

      {/* Sign In to Sync - Bottom Right */}
      {!user && (
        <button
          onClick={() => window.location.href = "/login"}
          className="fixed bottom-6 right-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all bg-[#F5A030]/10 hover:bg-[#F5A030]/20 border border-[#F5A030]/20 text-[#F5A030] shadow-lg hover:shadow-xl z-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          <span className="text-[11px] font-bold tracking-[0.05em] uppercase">Sign In to Sync</span>
        </button>
      )}

      <TimerSidebarPanel
        isOpen={timerOpen}
        onClose={() => setTimerOpen(false)}
        elapsed={timerElapsed}
        total={timerTotal}
        running={timerRunning}
        done={timerDone}
        preset={timerPreset}
        theme={theme}
        onSetRunning={setTimerRunning}
        onSetElapsed={setTimerElapsed}
        onSetTotal={setTimerTotal}
        onSetPreset={setTimerPreset}
        onSetDone={setTimerDone}
      />

      {/* Timer Toggle Icon */}
      {!timerOpen && (
        <motion.button
          onClick={() => setTimerOpen(true)}
          title="Open Timer (Cmd+Shift+T)"
          whileHover={{ scale: 1.15, x: -5 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            position: "fixed",
            right: 24,
            top: "50%",
            transform: "translateY(-50%)",
            width: 52,
            height: 52,
            zIndex: 99999,
            backgroundColor: theme === "dark" ? "rgba(30,30,35,0.95)" : accent,
            border: theme === "dark" ? `2px solid ${accent}` : "2px solid white",
            borderRadius: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme === "dark" ? accent : "white",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 8px 24px ${accent}44`,
            backdropFilter: "blur(12px)",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 0 30px ${accent}66`;
            e.currentTarget.style.transform = "translateY(-50%) scale(1.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `0 8px 24px ${accent}44`;
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </motion.div>
        </motion.button>
      )}
    </div>
  )
}
