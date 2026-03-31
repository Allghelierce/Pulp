"use client"

import { X } from "lucide-react"

interface AiResultModalProps {
  title: string
  result: string
  loading: boolean
  onClose: () => void
  onInsert?: (text: string) => void
}

export function AiResultModal({ title, result, loading, onClose, onInsert }: AiResultModalProps) {
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
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(0,0,0,0.08)",
          animation: "slide-up-fade 0.18s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="ml-4 flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Content Area */}
        <div
          className="min-h-40 max-h-96 overflow-y-auto rounded-lg border border-gray-200 p-4 bg-gray-50 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed"
        >
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Generating...</span>
              </div>
            </div>
          ) : (
            result || "No result"
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Close
          </button>
          {onInsert && !loading && result && (
            <button
              onClick={() => onInsert(result)}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #e8701a, #c04a08)" }}
            >
              Insert into note
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
