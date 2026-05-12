"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { apiFetch } from "@/lib/apiFetch"

interface AiResultModalProps {
  title: string
  result: string
  loading: boolean
  prompt?: string
  onClose: () => void
  onInsert?: (text: string) => void
  theme?: "light" | "dark"
}

export function AiResultModal({ title, result, loading, prompt, onClose, onInsert, theme }: AiResultModalProps) {
  const [rating, setRating] = useState<1 | -1 | null>(null)
  const isDark = theme === "dark"

  const rate = (r: 1 | -1) => {
    setRating(r)
    apiFetch("/api/chat-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: prompt || title, response: result, chunkNoteIds: [], rating: r }),
    }).catch(() => {})
  }

  const bg = isDark ? "rgba(20,20,22,0.97)" : "rgba(255,255,255,0.97)"
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
  const textColor = isDark ? "#d4d4d8" : "#374151"
  const mutedColor = isDark ? "#71717a" : "#9ca3af"
  const contentBg = isDark ? "rgba(255,255,255,0.04)" : "#f9fafb"
  const contentBorder = isDark ? "rgba(255,255,255,0.06)" : "#e5e7eb"

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex flex-col gap-4 rounded-2xl p-6 shadow-2xl"
        style={{
          width: "90%",
          maxWidth: 600,
          background: bg,
          border: `1px solid ${border}`,
          animation: "slide-up-fade 0.18s cubic-bezier(0.16,1,0.3,1)",
          fontFamily: '"EB Garamond", serif',
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: isDark ? "#e4e4e7" : "#111827" }}>{title}</h2>
          <button
            onClick={onClose}
            className="ml-4 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            style={{ color: mutedColor }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="min-h-40 max-h-96 overflow-y-auto rounded-lg border p-4 whitespace-pre-wrap text-sm leading-relaxed"
          style={{ backgroundColor: contentBg, borderColor: contentBorder, color: textColor }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <span className="text-xs" style={{ color: mutedColor }}>Generating...</span>
              </div>
            </div>
          ) : (
            result || "No result"
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          {!loading && result && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => rate(1)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 4,
                  color: rating === 1 ? "#d97706" : mutedColor, opacity: rating === 1 ? 1 : 0.5,
                  transition: "all 0.15s",
                }}
                title="Helpful"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={rating === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
              </button>
              <button
                onClick={() => rate(-1)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 4,
                  color: rating === -1 ? "#ef4444" : mutedColor, opacity: rating === -1 ? 1 : 0.5,
                  transition: "all 0.15s",
                }}
                title="Not helpful"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={rating === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                </svg>
              </button>
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: mutedColor }}
            >
              Close
            </button>
            {onInsert && !loading && result && (
              <button
                onClick={() => onInsert(result)}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
              >
                Insert into note
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
