"use client"
import { memo } from "react"
import { motion } from "framer-motion"

export const DrawingToolbar = memo(function DrawingToolbar({
  isOpen,
  onClose,
  activeTool,
  onToolChange,
  onClearDrawing,
}: {
  isOpen: boolean
  onClose: () => void
  activeTool: string
  onToolChange: (tool: string) => void
  onClearDrawing: () => void
  onImageUpload?: (dataUrl: string) => void
  onImproveDrawing?: () => void
}) {
  const tools = [
    {
      id: "pen", label: "Pen",
      icon: <path d="M12 19l7-7 3 3-7 7-3-3z" />,
      iconExtra: <><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="m2 2 7.586 7.586" /><circle cx="11" cy="11" r="2" /></>,
    },
    {
      id: "line", label: "Line",
      icon: <line x1="5" y1="19" x2="19" y2="5" />,
    },
    {
      id: "arrow", label: "Arrow",
      icon: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
      className="absolute top-full left-0 right-0 z-40 bg-white border-b border-zinc-200 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
    >
      <div className="flex items-center gap-1 px-3 py-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
            className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer ${
              activeTool === tool.id
                ? "bg-[rgb(var(--accent-rgb)/0.2)] text-[var(--accent)]"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {tool.icon}
              {tool.iconExtra}
            </svg>
          </button>
        ))}

        <div className="w-px h-5 bg-zinc-200 mx-0.5" />

        {/* Eraser (stroke eraser) */}
        <button
          onClick={() => onToolChange(activeTool === "eraser" ? "pen" : "eraser")}
          title="Eraser"
          className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer ${
            activeTool === "eraser"
              ? "bg-red-500/20 text-red-600"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 21l-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="M5 11l9 9" />
          </svg>
        </button>

        {/* Clear all */}
        <button
          onClick={onClearDrawing}
          title="Clear all drawings"
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          title="Close toolbar"
          className="ml-auto flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6l-12 12M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
})
