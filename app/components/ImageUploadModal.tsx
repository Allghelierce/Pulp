"use client"

import { useCallback, useState } from "react"
import { useImageUpload } from "@/app/hooks/use-image-upload"
import { ImagePlus, Upload, Trash2, X } from "lucide-react"
import Image from "next/image"

interface ImageUploadModalProps {
  onConfirm: (htmlOrUrl: string, isHtml: boolean) => void
  onClose: () => void
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ")
}

export function ImageUploadModal({ onConfirm, onClose }: ImageUploadModalProps) {
  const {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  } = useImageUpload()

  const [tab, setTab] = useState<"upload" | "link">("upload")
  const [linkUrl, setLinkUrl] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation()
  }
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
        const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>
        handleFileChange(fakeEvent)
      }
    },
    [handleFileChange],
  )

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Card */}
      <div
        className="relative flex flex-col gap-5 rounded-2xl p-6 shadow-2xl"
        style={{
          width: 420,
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(0,0,0,0.08)",
          animation: "slide-up-fade 0.18s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header Tabs */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setTab("upload")}
              className={cn("pb-2 text-base font-semibold transition-colors", tab === "upload" ? "border-b-2 border-gray-900 text-gray-900" : "border-b-2 border-transparent text-gray-400 hover:text-gray-600")}
            >
              Upload
            </button>
            <button
              onClick={() => setTab("link")}
              className={cn("pb-2 text-base font-semibold transition-colors", tab === "link" ? "border-b-2 border-gray-900 text-gray-900" : "border-b-2 border-transparent text-gray-400 hover:text-gray-600")}
            >
              Link
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
          accept="image/*,video/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {tab === "upload" ? (
          <>
            <p className="text-xs text-gray-400 -mt-2">Supported formats: Images, Videos, GIFs</p>
            {/* Drop zone or Preview */}
            {!previewUrl ? (
              <div
                onClick={handleThumbnailClick}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors",
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
                <div className="group relative h-52 overflow-hidden rounded-xl border border-gray-200">
                  {fileName?.match(/\.(mp4|webm|ogg|mov)$/i) || previewUrl.startsWith("data:video") || previewUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                    <video src={previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} autoPlay muted loop />
                  ) : (
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="420px"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={handleThumbnailClick}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 shadow hover:bg-white transition-colors"
                    >
                      <Upload className="h-4 w-4 text-gray-700" />
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
          <div className="flex flex-col gap-3 py-4 border border-transparent">
            <input
              type="text"
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Paste URL (Image, Video, YouTube...)"
              className="w-full text-sm p-3 rounded-lg border border-gray-300 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && linkUrl.trim()) {
                  triggerLinkEmbed()
                }
              }}
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
            disabled={tab === "upload" ? !previewUrl : !linkUrl.trim()}
            onClick={() => { 
              if (tab === "upload" && previewUrl) { 
                const isVideo = (fileName && fileName.match(/\.(mp4|webm|ogg|mov)$/i)) || previewUrl.startsWith("data:video") || previewUrl.match(/\.(mp4|webm|ogg|mov)$/i)
                const html = isVideo 
                  ? `<video src="${previewUrl}" controls style="max-width:100%;height:auto;border-radius:6px;display:block;margin:4px 0"></video><br/>`
                  : `<img src="${previewUrl}" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:4px 0" alt="Uploaded image" /><br/>`
                onConfirm(html, true)
                onClose() 
              } else if (tab === "link" && linkUrl.trim()) {
                triggerLinkEmbed()
              }
            }}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: (tab === "upload" ? previewUrl : linkUrl.trim()) ? "linear-gradient(135deg, #e8701a, #c04a08)" : undefined, backgroundColor: (tab === "upload" ? previewUrl : linkUrl.trim()) ? undefined : "#d1d5db" }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  )

  function triggerLinkEmbed() {
    const url = linkUrl.trim()
    if (!url) return
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
    const vmMatch = url.match(/vimeo\.com\/(\d+)/)
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i)
    
    let html = ""
    if (ytMatch) {
      const embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
      html = `<div contenteditable="false" style="margin:8px 0;border-radius:8px;overflow:hidden;aspect-ratio:16/9;max-width:560px"><iframe src="${embedUrl}" style="width:100%;height:100%;border:none" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div><br/>`
    } else if (vmMatch) {
      const embedUrl = `https://player.vimeo.com/video/${vmMatch[1]}`
      html = `<div contenteditable="false" style="margin:8px 0;border-radius:8px;overflow:hidden;aspect-ratio:16/9;max-width:560px"><iframe src="${embedUrl}" style="width:100%;height:100%;border:none" allowfullscreen></iframe></div><br/>`
    } else if (isImage) {
      html = `<img src="${url}" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:4px 0" /><br/>`
    } else {
      html = `<video src="${url}" controls style="max-width:100%;height:auto;border-radius:6px;display:block;margin:4px 0"></video><br/>`
    }
    onConfirm(html, true)
    onClose()
  }
}
