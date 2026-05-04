"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import { useImageUpload } from "@/app/hooks/use-image-upload"
import { ImagePlus, Trash2, X, Pencil, Eraser, RotateCcw, Upload, Image as ImageIcon } from "lucide-react"
import NextImage from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface CoverModalProps {
  existingCover?: string
  onConfirm: (dataUrl: string) => void
  onClose: () => void
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ")
}

export function CoverModal({ existingCover, onConfirm, onClose }: CoverModalProps) {
  const {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  } = useImageUpload()

  const [tab, setTab] = useState<"import" | "draw">("import")
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawColor, setDrawColor] = useState("#d97706")
  const [tool, setTool] = useState<"pen" | "eraser">("pen")
  const isDrawingRef = useRef(false)

  const pulpOrange = "#d97706"

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  useEffect(() => {
    if (tab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#18181b" // zinc-900 (dark canvas)
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (existingCover && existingCover.startsWith("data:image")) {
        const img = new (window as any).Image()
        img.src = existingCover
        img.onload = () => ctx.drawImage(img, 0, 0)
      }
    }
  }, [tab, existingCover])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation() }
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith("image/")) {
        const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>
        handleFileChange(fakeEvent)
      }
    },
    [handleFileChange],
  )

  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>, type: "down" | "move" | "up") => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    const ctx = canvas.getContext("2d")!

    if (type === "down") {
      isDrawingRef.current = true
      ctx.beginPath()
      ctx.moveTo(x, y)
    } else if (type === "move" && isDrawingRef.current) {
      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out"
        ctx.arc(x, y, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = "source-over"
      } else {
        ctx.lineTo(x, y)
        ctx.strokeStyle = drawColor
        ctx.lineWidth = 3
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.stroke()
      }
    } else if (type === "up") {
      isDrawingRef.current = false
      ctx.closePath()
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#18181b"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-zinc-800 border border-zinc-700/50 rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.8)] w-full max-w-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
          <div className="flex gap-6">
            <button
              onClick={() => setTab("import")}
              className={cn("pb-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative", tab === "import" ? "text-white" : "text-zinc-500 hover:text-zinc-300")}
            >
              {tab === "import" && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
              Import
            </button>
            <button
              onClick={() => setTab("draw")}
              className={cn("pb-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative", tab === "draw" ? "text-white" : "text-zinc-500 hover:text-zinc-300")}
            >
              {tab === "draw" && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
              Draw
            </button>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-700/50 transition-colors">
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        <div className="p-8">
          {tab === "import" ? (
            <div className="flex flex-col gap-6">
              <div className="space-y-1">
                <h3 className="text-xl text-white tracking-widest" style={{ fontFamily: '"EB Garamond", serif' }}>Notebook Cover</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-serif italic">Supported formats: PNG, JPG, WebP</p>
              </div>

              {!previewUrl ? (
                <div
                  onClick={handleThumbnailClick}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "flex h-72 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all",
                    isDragging
                      ? "border-orange-500 bg-orange-500/5 shadow-[0_0_40px_rgba(245,160,48,0.1)]"
                      : "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-600"
                  )}
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center shadow-lg border border-zinc-700">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-300">Click to upload cover</p>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">or drag and drop here</p>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="relative h-72 overflow-hidden rounded-2xl border border-zinc-700 group shadow-2xl">
                    <NextImage
                      src={previewUrl}
                      alt="Cover Preview"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={handleThumbnailClick}
                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all border border-white/20"
                      >
                        <ImageIcon className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={handleRemove}
                        className="w-10 h-10 rounded-xl bg-red-500/80 backdrop-blur-md flex items-center justify-center hover:bg-red-500 hover:scale-110 transition-all border border-red-400/20 shadow-lg shadow-red-500/20"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] text-zinc-500 text-center uppercase tracking-widest">{fileName ?? "Selected Cover"}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 p-1 bg-zinc-900/50 rounded-xl border border-zinc-700">
                  <button
                    onClick={() => setTool("pen")}
                    className={cn("p-2 rounded-lg transition-all", tool === "pen" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-zinc-500 hover:text-zinc-300")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setTool("eraser")}
                    className={cn("p-2 rounded-lg transition-all", tool === "eraser" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-zinc-500 hover:text-zinc-300")}
                  >
                    <Eraser className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex gap-2 items-center px-4 py-1.5 bg-zinc-900/50 rounded-xl border border-zinc-700">
                  {["#d97706", "#EF4444", "#3B82F6", "#10B981", "#FFFFFF"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setDrawColor(c)}
                      className={cn("w-5 h-5 rounded-full border-2 transition-all", drawColor === c ? "border-white scale-125 shadow-lg" : "border-transparent opacity-60 hover:opacity-100")}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <button onClick={clearCanvas} className="p-2 rounded-lg hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onPointerDown={(e) => handleCanvasPointer(e, "down")}
                onPointerMove={(e) => handleCanvasPointer(e, "move")}
                onPointerUp={(e) => handleCanvasPointer(e, "up")}
                className="w-full h-[288px] rounded-2xl border border-zinc-700 bg-zinc-900 shadow-inner cursor-crosshair touch-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex flex-col gap-3">
          <button
            disabled={tab === "import" ? !previewUrl : false}
            onClick={() => {
              if (tab === "import" && previewUrl) onConfirm(previewUrl)
              else if (tab === "draw" && canvasRef.current) onConfirm(canvasRef.current.toDataURL("image/png"))
            }}
            className="w-full py-4 rounded-xl text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
            style={{ backgroundColor: pulpOrange, boxShadow: `0 8px 24px -6px ${pulpOrange}44` }}
          >
            Apply Cover Decoration
          </button>
          <button onClick={onClose} className="w-full py-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] hover:text-zinc-300 transition-all">
            Cancel
          </button>
        </div>

        {/* Hidden file input */}
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      </motion.div>
    </div>
  )
}
