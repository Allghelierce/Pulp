"use client"
import { useEffect, useRef, useState, memo } from "react"
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea"

interface AiInlineMenuProps {
  x: number
  y: number
  selectedText?: string
  isDark: boolean
  onClose: () => void
  onSubmit: (prompt: string, selectedText?: string) => void | Promise<void>
}

export const AiInlineMenu = memo(function AiInlineMenu({
  x, y, selectedText, isDark, onClose, onSubmit
}: AiInlineMenuProps) {
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 36, maxHeight: 160 })

  // Focus on mount
  useEffect(() => { textareaRef.current?.focus() }, [])

  // Click-outside & Escape
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  // Adjust position so menu doesn't overflow viewport
  const menuWidth = 340
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 12)
  const estimatedHeight = selectedText ? 130 : 90
  const adjustedY = y + estimatedHeight > window.innerHeight - 16 ? y - estimatedHeight - 8 : y

  const handleSubmit = async () => {
    if (!value.trim() || loading) return
    setLoading(true)
    await onSubmit(value.trim(), selectedText)
    setValue("")
    adjustHeight(true)
    setLoading(false)
  }

  const bg = isDark ? "rgba(14,14,16,0.97)" : "rgba(255,255,255,0.98)"
  const border = isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)"
  const shadow = isDark
    ? "0 20px 60px -12px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)"
    : "0 8px 32px -8px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)"
  const textColor = isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)"
  const mutedColor = isDark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.32)"
  const placeholderStyle = isDark ? "#52525b" : "#a1a1aa"

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        left: Math.max(8, adjustedX),
        top: adjustedY,
        width: menuWidth,
        zIndex: 9999,
        background: bg,
        border,
        borderRadius: 8,
        boxShadow: shadow,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        animation: "slide-up-fade 0.18s cubic-bezier(0.16,1,0.3,1)",
        overflow: "hidden",
      }}
    >
      {/* Selected text context */}
      {selectedText && (
        <div style={{
          padding: "8px 12px 6px",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: mutedColor, marginBottom: 4 }}>
            Selected text
          </div>
          <div style={{
            fontSize: 11,
            color: mutedColor,
            lineHeight: 1.4,
            maxHeight: 48,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical" as any,
            borderLeft: "2px solid #b85e22",
            paddingLeft: 8,
          }}>
            {selectedText}
          </div>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px" }}>
        {/* Sparkle icon */}
        <div style={{ paddingTop: 7, flexShrink: 0, color: "#b85e22" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); adjustHeight() }}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit() }
            if (e.key === "Escape") { e.preventDefault(); onClose() }
          }}
          placeholder={selectedText ? "Ask AI about selection…" : "Ask AI anything…"}
          disabled={loading}
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: 13,
            color: textColor,
            lineHeight: 1.5,
            paddingTop: 6,
            paddingBottom: 6,
            caretColor: "#b85e22",
            fontFamily: "inherit",
          }}
          // inline placeholder color via CSS
          className="ai-menu-textarea"
        />

        {/* Submit / loading */}
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || loading}
          style={{
            flexShrink: 0,
            marginTop: 4,
            width: 26,
            height: 26,
            borderRadius: 6,
            border: "none",
            cursor: value.trim() && !loading ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: value.trim() && !loading
              ? (isDark ? "rgba(184,94,34,0.2)" : "rgba(184,94,34,0.1)")
              : "transparent",
            color: value.trim() && !loading ? "#b85e22" : mutedColor,
            transition: "all 0.12s ease",
          }}
        >
          {loading ? (
            <div style={{
              width: 12,
              height: 12,
              border: `2px solid ${"#b85e22"}`,
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          )}
        </button>
      </div>

      {/* Footer hint */}
      <div style={{
        padding: "4px 12px 6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 10, color: mutedColor }}>
          {loading ? "AI is thinking…" : "Enter to send · Shift+Enter for new line"}
        </span>
        <span style={{ fontSize: 10, color: mutedColor }}>ESC to close</span>
      </div>

      <style>{`
        .ai-menu-textarea::placeholder { color: ${placeholderStyle}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
})
