"use client"
import { useState, useRef, useEffect, memo } from "react"

const COLORS_LIGHT = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
]

const COLORS_DARK = [
  "#ffffff", "#000000", "#fca5a5", "#fdba74", "#fde047",
  "#6ee7b7", "#93c5fd", "#c4b5fd", "#f9a8d4", "#d4d4d8",
]

const font: React.CSSProperties = { fontFamily: '"EB Garamond", serif', letterSpacing: "0.01em" }

export const FloatingToolbar = memo(function FloatingToolbar({
  accent, activeTool, onToolChange, onClearDrawing, isVisible,
  strokeColor, onStrokeColorChange,
  lineWidth, onLineWidthChange,
  onUndo, onRedo, canUndo, canRedo, onClose,
  darkPaper,
}: {
  accent: string
  activeTool: string
  onToolChange: (t: string) => void
  onClearDrawing: () => void
  onImageUpload?: (dataUrl: string) => void
  isVisible: boolean
  strokeColor: string
  onStrokeColorChange: (c: string) => void
  fillColor?: string
  onFillColorChange?: (c: string) => void
  lineWidth: number
  onLineWidthChange: (w: number) => void
  opacity?: number
  onOpacityChange?: (o: number) => void
  dash?: boolean
  onDashChange?: (d: boolean) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onImproveDrawing?: () => void
  onClose: () => void
  darkPaper?: boolean
}) {
  const COLORS = darkPaper ? COLORS_DARK : COLORS_LIGHT
  const rootRef = useRef<HTMLDivElement>(null)
  const [popup, setPopup] = useState<"stroke" | null>(null)

  useEffect(() => {
    if (!popup) return
    const h = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPopup(null)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [popup])

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

  const I = (d: string) => (
    <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  )

  const Is = (d: string) => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  )

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
      <div
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-[8px] border border-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Pen */}
        {toolBtn("pen", "Pen", I("M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"))}

        {/* Line */}
        {toolBtn("line", "Line", <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="5" y1="19" x2="19" y2="5" /></svg>)}

        {/* Arrow */}
        {toolBtn("arrow", "Arrow", <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5" /><polyline points="9 5 19 5 19 15" /></svg>)}

        {/* Eraser */}
        <button
          onMouseDown={e => { e.preventDefault(); onToolChange(is("eraser") ? "pen" : "eraser") }}
          title="Eraser"
          className="h-7 px-1.5 flex items-center justify-center rounded-[5px] transition-colors cursor-pointer active:scale-[0.96]"
          style={is("eraser")
            ? { backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }
            : { color: "#71717a", border: "1px solid transparent" }}
        >
          {I("m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21M22 21H7M5 11l9 9")}
        </button>

        {sep}

        {/* Stroke color */}
        <div className="relative flex items-center px-0.5">
          <button
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setPopup(popup === "stroke" ? null : "stroke") }}
            className="w-[18px] h-[18px] rounded-[4px] border border-zinc-300/80 cursor-pointer hover:scale-110 transition-transform shrink-0 shadow-[0_0.5px_1px_rgba(0,0,0,0.06)]"
            style={{ backgroundColor: strokeColor }}
            title="Color"
          />

          {popup && (
            <div className="absolute top-full left-0 mt-1.5 bg-white rounded-[8px] border border-zinc-200 shadow-lg p-2 z-50" style={{ width: 140, ...font }}>
              <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Color</div>
              <div className="grid grid-cols-5 gap-1">
                {COLORS.map(c => (
                  <button key={c} onMouseDown={e => {
                    e.preventDefault()
                    onStrokeColorChange(c)
                    setPopup(null)
                  }}
                    className="w-[22px] h-[22px] rounded-[4px] cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: c,
                      border: c === "#ffffff" ? "1px solid #e4e4e7" : "1px solid transparent",
                      outline: strokeColor === c ? `1.5px solid ${accent}` : "none",
                      outlineOffset: 1,
                    }} />
                ))}
              </div>
              <input
                type="color"
                value={strokeColor}
                onChange={e => onStrokeColorChange(e.target.value)}
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

        {sep}

        {/* Undo / Redo */}
        {miniBtn(onUndo, "Undo", Is("M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10"), !canUndo)}
        {miniBtn(onRedo, "Redo", Is("M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10"), !canRedo)}

        {sep}

        {/* Clear all */}
        {miniBtn(onClearDrawing, "Clear all", <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>)}

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
