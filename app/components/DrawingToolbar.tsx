"use client"
import { memo, useRef } from "react"
import { motion } from "framer-motion"

export const DrawingToolbar = memo(function DrawingToolbar({
  isOpen,
  onClose,
  activeTool,
  onToolChange,
  onClearDrawing,
  onImageUpload,
  onImproveDrawing,
}: {
  isOpen: boolean
  onClose: () => void
  activeTool: string
  onToolChange: (tool: string) => void
  onClearDrawing: () => void
  onImageUpload: (dataUrl: string) => void
  onImproveDrawing?: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) onImageUpload(ev.target.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const tools = [
    { id: "select", label: "Select", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    { id: "rect", label: "Rectangle", icon: "M3 3h18v18H3z" },
    { id: "diamond", label: "Diamond", icon: "M12 2l10 10-10 10L2 12 12 2z" },
    { id: "circle", label: "Circle", icon: "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" },
    { id: "arrow", label: "Arrow", icon: "M5 12h14M12 5l7 7-7 7" },
    { id: "line", label: "Line", icon: "M5 12h14" },
    { id: "pen", label: "Pen", icon: "M12 19l7-7 3 3-7 7-3-3zm6-6l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" },
    { id: "text", label: "Text", icon: "M4 20l8-16 8 16M8 12h8" },
  ]

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="absolute top-full left-0 right-0 z-40 bg-white border-b border-zinc-200 shadow-[0_4px_16px_rgba(0,0,0,0.08)] pointer-events-none"
        style={{
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <div className="flex items-center gap-0.5 px-3 py-1 overflow-x-auto">
          {/* Drawing tools */}
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
              className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                activeTool === tool.id
                  ? "bg-orange-500/20 text-orange-600"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={tool.icon} />
              </svg>
            </button>
          ))}

          {/* Image upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Insert image"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 transition-all cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Improve drawing */}
          {onImproveDrawing && (
            <button
              onClick={onImproveDrawing}
              title="Smooth and improve drawing"
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 hover:bg-amber-100 transition-all cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                <path d="M8 12l2 2 4-4" />
              </svg>
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-zinc-200 mx-0.5" />

          {/* Eraser */}
          <button
            onClick={() => {
              if (activeTool === "eraser") {
                onClearDrawing()
              } else {
                onToolChange("eraser")
              }
            }}
            title={activeTool === "eraser" ? "Clear all drawings" : "Eraser"}
            className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer ${
              activeTool === "eraser"
                ? "bg-red-500/20 text-red-600"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 21l-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
              <path d="M22 21H7" />
              <path d="M5 11l9 9" />
            </svg>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            title="Close toolbar"
            className="ml-auto flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 transition-all cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6l-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>
    </>
  )
})
