"use client"
import { useState, useRef, useEffect, memo } from "react"

const COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
]

const font: React.CSSProperties = { fontFamily: '"EB Garamond", Georgia, serif', letterSpacing: "0.01em" }

export const FloatingToolbar = memo(function FloatingToolbar({
  accent, activeTool, onToolChange, onClearDrawing, onImageUpload, isVisible,
  strokeColor, onStrokeColorChange, fillColor, onFillColorChange,
  lineWidth, onLineWidthChange, opacity, onOpacityChange,
  dash, onDashChange,
  onUndo, onRedo, canUndo, canRedo, onImproveDrawing, onClose,
}: {
  accent: string
  activeTool: string
  onToolChange: (t: string) => void
  onClearDrawing: () => void
  onImageUpload: (dataUrl: string) => void
  isVisible: boolean
  strokeColor: string
  onStrokeColorChange: (c: string) => void
  fillColor: string
  onFillColorChange: (c: string) => void
  lineWidth: number
  onLineWidthChange: (w: number) => void
  opacity: number
  onOpacityChange: (o: number) => void
  dash: boolean
  onDashChange: (d: boolean) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onImproveDrawing: () => void
  onClose: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [popup, setPopup] = useState<"stroke" | "fill" | null>(null)

  useEffect(() => {
    if (!popup) return
    const h = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPopup(null)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [popup])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => { if (ev.target?.result) onImageUpload(ev.target.result as string) }
    r.readAsDataURL(f)
    e.target.value = ""
  }

  const is = (t: string) => activeTool === t

  const toolBtn = (tool: string, title: string, svg: React.ReactNode) => (
    <button
      onMouseDown={e => { e.preventDefault(); onToolChange(tool) }}
      title={title}
      className="h-7 px-1.5 flex items-center justify-center rounded-[5px] transition-colors cursor-pointer active:scale-[0.96]"
      style={is(tool)
        ? { backgroundColor: "#f4f4f5", borderColor: "#d4d4d8", color: "#18181b", border: "1px solid #d4d4d8" }
        : { color: "#71717a", border: "1px solid transparent" }}
    >
      {svg}
    </button>
  )

  const sep = <div className="w-px h-5 bg-zinc-200/60 shrink-0" />

  const miniBtn = (onClick: () => void, title: string, svg: React.ReactNode, disabled?: boolean) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className="h-6 w-6 flex items-center justify-center rounded-[4px] text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer active:scale-[0.95]"
      style={{ opacity: disabled ? 0.2 : 1, pointerEvents: disabled ? "none" : "auto" }}
    >
      {svg}
    </button>
  )

  const I = (d: string) => (
    <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  )

  const Is = (d: string) => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  )

  return (
    <div
      ref={rootRef}
      className="fixed z-[100] transition-all duration-200 ease-out"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        top: isVisible ? "50px" : "36px",
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-[8px] border border-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Drawing tools */}
        {toolBtn("pen", "Pen", I("M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"))}
        {toolBtn("highlighter", "Highlighter", I("m9 11-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"))}
        <button
          onMouseDown={e => { e.preventDefault(); is("eraser") ? onClearDrawing() : onToolChange("eraser") }}
          title={is("eraser") ? "Clear all" : "Eraser"}
          className="h-7 px-1.5 flex items-center justify-center rounded-[5px] transition-colors cursor-pointer active:scale-[0.96]"
          style={is("eraser")
            ? { backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }
            : { color: "#71717a", border: "1px solid transparent" }}
        >
          {I("m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21M22 21H7M5 11l9 9")}
        </button>

        {sep}

        {/* Shapes */}
        {toolBtn("line", "Line", <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="5" y1="19" x2="19" y2="5" /></svg>)}
        {toolBtn("arrow", "Arrow", <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5" /><polyline points="9 5 19 5 19 15" /></svg>)}
        {toolBtn("rect", "Rectangle", <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>)}
        {toolBtn("circle", "Circle", <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /></svg>)}
        {toolBtn("diamond", "Diamond", I("M12 2l10 10-10 10L2 12z"))}

        {sep}

        {/* Stroke + Fill */}
        <div className="relative flex items-center gap-1 px-0.5">
          <button
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setPopup(popup === "stroke" ? null : "stroke") }}
            className="w-[18px] h-[18px] rounded-[4px] border border-zinc-300/80 cursor-pointer hover:scale-110 transition-transform shrink-0 shadow-[0_0.5px_1px_rgba(0,0,0,0.06)]"
            style={{ backgroundColor: strokeColor }}
            title="Stroke color"
          />
          <button
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setPopup(popup === "fill" ? null : "fill") }}
            className="w-[18px] h-[18px] rounded-[4px] border border-zinc-300/80 cursor-pointer hover:scale-110 transition-transform shrink-0 relative overflow-hidden shadow-[0_0.5px_1px_rgba(0,0,0,0.06)]"
            style={{ backgroundColor: fillColor === "transparent" ? "#fff" : fillColor }}
            title="Fill color"
          >
            {fillColor === "transparent" && <div className="absolute w-[140%] h-[1px] bg-red-400/70 rotate-45 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
          </button>

          {popup && (
            <div className="absolute top-full left-0 mt-1.5 bg-white rounded-[8px] border border-zinc-200 shadow-lg p-2 z-50" style={{ width: 140, ...font }}>
              <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">{popup === "stroke" ? "Stroke" : "Fill"}</div>
              <div className="grid grid-cols-5 gap-1">
                {popup === "fill" && (
                  <button onMouseDown={e => { e.preventDefault(); onFillColorChange("transparent"); setPopup(null) }}
                    className="w-[22px] h-[22px] rounded-[4px] cursor-pointer border border-zinc-300 bg-white relative overflow-hidden hover:scale-110 transition-transform"
                    style={{ outline: fillColor === "transparent" ? `1.5px solid ${accent}` : "none", outlineOffset: 1 }}>
                    <div className="absolute w-[140%] h-[1px] bg-red-400 rotate-45 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </button>
                )}
                {(popup === "fill" ? COLORS.slice(0, 9) : COLORS).map(c => (
                  <button key={c} onMouseDown={e => {
                    e.preventDefault()
                    popup === "stroke" ? onStrokeColorChange(c) : onFillColorChange(c)
                    setPopup(null)
                  }}
                    className="w-[22px] h-[22px] rounded-[4px] cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c,
                      border: c === "#ffffff" ? "1px solid #e4e4e7" : "1px solid transparent",
                      outline: (popup === "stroke" ? strokeColor : fillColor) === c ? `1.5px solid ${accent}` : "none",
                      outlineOffset: 1,
                    }} />
                ))}
              </div>
              <input
                type="color"
                value={popup === "stroke" ? strokeColor : (fillColor === "transparent" ? "#ffffff" : fillColor)}
                onChange={e => popup === "stroke" ? onStrokeColorChange(e.target.value) : onFillColorChange(e.target.value)}
                className="w-full h-5 mt-1.5 rounded-[4px] cursor-pointer border border-zinc-200"
              />
            </div>
          )}
        </div>

        {sep}

        {/* Width */}
        <div className="flex items-center gap-0 px-0.5">
          {[0.5, 1, 2, 4].map(w => (
            <button key={w} onMouseDown={e => { e.preventDefault(); onLineWidthChange(w) }}
              className="w-[18px] h-[18px] flex items-center justify-center rounded-[3px] cursor-pointer transition-colors"
              style={lineWidth === w ? { color: "#b85e22" } : { color: "#d4d4d8" }}
              title={`${w}px`}>
              <div className="rounded-full bg-current" style={{ width: Math.max(2, w * 1.6), height: Math.max(2, w * 1.6) }} />
            </button>
          ))}
        </div>

        {/* Dash */}
        <button onMouseDown={e => { e.preventDefault(); onDashChange(!dash) }}
          className="h-[18px] w-[18px] flex items-center justify-center rounded-[3px] cursor-pointer transition-colors"
          style={dash ? { color: "#b85e22" } : { color: "#a1a1aa" }}
          title={dash ? "Solid" : "Dashed"}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={dash ? "3 3" : "none"}><line x1="4" y1="12" x2="20" y2="12" /></svg>
        </button>

        {/* Opacity slider */}
        <input
          type="range" min="0.1" max="1" step="0.05" value={opacity}
          onChange={e => onOpacityChange(Number(e.target.value))}
          className="w-8 h-px rounded cursor-pointer accent-zinc-400 shrink-0"
          title={`${Math.round(opacity * 100)}%`}
          style={{ opacity: 0.6 }}
        />

        {sep}

        {/* Undo / Redo */}
        {miniBtn(onUndo, "Undo", Is("M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10"), !canUndo)}
        {miniBtn(onRedo, "Redo", Is("M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10"), !canRedo)}

        {sep}

        {miniBtn(onImproveDrawing, "Smooth", Is("M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"))}
        {miniBtn(() => fileRef.current?.click(), "Image", <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>)}

        {sep}

        {/* Close */}
        <button
          onMouseDown={e => { e.preventDefault(); onClose() }}
          title="Done (Esc)"
          className="h-6 px-1.5 flex items-center gap-1 rounded-[5px] text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer active:scale-[0.95] text-[11px]"
          style={font}
        >
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          <span className="text-zinc-300 font-medium">esc</span>
        </button>
      </div>
    </div>
  )
})
