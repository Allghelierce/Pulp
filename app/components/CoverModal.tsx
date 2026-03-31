"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import { useImageUpload } from "@/app/hooks/use-image-upload"
import { ImagePlus, Trash2, X } from "lucide-react"
import Image from "next/image"

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
  const [drawColor, setDrawColor] = useState("#000000")
  const [tool, setTool] = useState<"pen" | "eraser">("pen")
  const isDrawingRef = useRef(false)

  useEffect(() => {
    if (tab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (existingCover && existingCover.startsWith("data:image")) {
        const img = new (window as any).Image()
        img.src = existingCover
        img.onload = () => ctx.drawImage(img, 0, 0)
      }
    }
  }, [tab, existingCover])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

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
        ctx.clearRect(x - 8, y - 8, 16, 16)
        ctx.globalCompositeOperation = "source-over"
      } else {
        ctx.lineTo(x, y)
        ctx.strokeStyle = drawColor
        ctx.lineWidth = 2
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
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex flex-col gap-5 rounded-2xl p-6 shadow-2xl"
        style={{
          width: 520,
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(0,0,0,0.08)",
          animation: "slide-up-fade 0.18s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header Tabs */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setTab("import")}
              className={cn("pb-2 text-base font-semibold transition-colors", tab === "import" ? "border-b-2 border-gray-900 text-gray-900" : "border-b-2 border-transparent text-gray-400 hover:text-gray-600")}
            >
              Import
            </button>
            <button
              onClick={() => setTab("draw")}
              className={cn("pb-2 text-base font-semibold transition-colors", tab === "draw" ? "border-b-2 border-gray-900 text-gray-900" : "border-b-2 border-transparent text-gray-400 hover:text-gray-600")}
            >
              Draw
            </button>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {tab === "import" ? (
          <>
            <p className="text-xs text-gray-400 -mt-2">Supported formats: PNG, JPG, GIF, WebP</p>
            {!previewUrl ? (
              <div
                onClick={handleThumbnailClick}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex h-80 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors",
                  isDragging
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <ImagePlus className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Click to select</p>
                  <p className="text-xs text-gray-400">or drag and drop here</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="group relative h-80 overflow-hidden rounded-xl border border-gray-200">
                  <Image
                    src={previewUrl}
                    alt="Cover Preview"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="520px"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={handleThumbnailClick}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 shadow hover:bg-white transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    </button>
                    <button
                      onClick={handleRemove}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 shadow hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
                {fileName && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span className="truncate">{fileName}</span>
                    <button
                      onClick={handleRemove}
                      className="ml-auto flex h-5 w-5 items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Drawing toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setTool("pen")}
                  className={cn("px-3 py-1 rounded text-sm font-medium transition-colors", tool === "pen" ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100")}
                >
                  Pen
                </button>
                <button
                  onClick={() => setTool("eraser")}
                  className={cn("px-3 py-1 rounded text-sm font-medium transition-colors", tool === "eraser" ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100")}
                >
                  Eraser
                </button>
              </div>

              {tool === "pen" && (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-500">Color:</span>
                  <div className="flex gap-1">
                    {["#000000", "#ff0000", "#0000ff", "#00aa00", "#FFA500"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setDrawColor(color)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all",
                          drawColor === color ? "border-gray-400 scale-110" : "border-gray-300"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={clearCanvas}
                className="ml-auto px-3 py-1 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={300}
              height={400}
              onPointerDown={(e) => handleCanvasPointer(e, "down")}
              onPointerMove={(e) => handleCanvasPointer(e, "move")}
              onPointerUp={(e) => handleCanvasPointer(e, "up")}
              className="w-full border border-gray-200 rounded-lg bg-white cursor-crosshair"
              style={{ maxHeight: "400px" }}
            />
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            disabled={tab === "import" ? !previewUrl : false}
            onClick={() => {
              if (tab === "import" && previewUrl) {
                onConfirm(previewUrl)
              } else if (tab === "draw" && canvasRef.current) {
                onConfirm(canvasRef.current.toDataURL("image/png"))
              }
            }}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: (tab === "import" ? previewUrl : true) ? "linear-gradient(135deg, #e8701a, #c04a08)" : undefined, backgroundColor: (tab === "import" ? previewUrl : true) ? undefined : "#d1d5db" }}
          >
            Set Cover
          </button>
        </div>
      </div>
    </div>
  )
}
