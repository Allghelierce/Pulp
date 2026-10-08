"use client"

import { useCallback, useEffect, useState } from "react"
import { useImageUpload } from "@/app/hooks/use-image-upload"
import { ImagePlus, Upload, Trash2, X, Link as LinkIcon, Globe } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ACCENT, accentAlpha } from "@/lib/accent"

interface ImageUploadModalProps {
  onConfirm: (htmlOrUrl: string, isHtml: boolean) => void
  onClose: () => void
  theme?: "light" | "dark"
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ")
}

export function ImageUploadModal({ onConfirm, onClose, theme = "dark" }: ImageUploadModalProps) {
  const dark = theme === "dark"
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


  // Esc closes; pasting an image or video file uploads it, pasting a URL embeds it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose() } }
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files || []).find(f => f.type.startsWith("image/") || f.type.startsWith("video/"))
      if (file) {
        e.preventDefault()
        setTab("upload")
        handleFileChange({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>)
        return
      }
      const text = e.clipboardData?.getData("text")?.trim()
      if (text && /^https?:\/\//.test(text) && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        setTab("link"); setLinkUrl(text)
      }
    }
    document.addEventListener("keydown", onKey, true)
    document.addEventListener("paste", onPaste)
    return () => { document.removeEventListener("keydown", onKey, true); document.removeEventListener("paste", onPaste) }
  }, [onClose, handleFileChange])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation() }
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }

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

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        onClick={onClose}
        className={cn("absolute inset-0", dark ? "bg-black/75" : "bg-black/35")}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={cn("relative rounded-2xl w-full max-w-sm overflow-hidden border", dark ? "bg-zinc-800 border-zinc-700/50 shadow-[0_24px_64px_rgba(0,0,0,0.6)]" : "bg-white border-zinc-200 shadow-[0_24px_64px_rgba(0,0,0,0.18)]")}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[rgb(var(--accent-rgb)/0.4)] to-transparent" />

        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div className="flex gap-6">
            <button
              onClick={() => setTab("upload")}
              className={cn("pb-2 text-[10px] font-normal uppercase tracking-[0.2em] transition-all relative", tab === "upload" ? (dark ? "text-white" : "text-zinc-900") : (dark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"))}
            >
              {tab === "upload" && <motion.div layoutId="mediaTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />}
              Upload
            </button>
            <button
              onClick={() => setTab("link")}
              className={cn("pb-2 text-[10px] font-normal uppercase tracking-[0.2em] transition-all relative", tab === "link" ? (dark ? "text-white" : "text-zinc-900") : (dark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"))}
            >
              {tab === "link" && <motion.div layoutId="mediaTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />}
              Embed
            </button>
          </div>
          <button onClick={onClose} className={cn("p-2 rounded-full transition-colors", dark ? "hover:bg-zinc-700/50" : "hover:bg-zinc-100")}>
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        <div className="p-8">
          {tab === "upload" ? (
            <div className="flex flex-col gap-6">
              <div className="space-y-1">
                <h3 className={cn("text-xl tracking-widest", dark ? "text-white" : "text-zinc-900")} style={{ fontFamily: 'Crimson Pro, serif' }}>Insert Media</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-serif italic">Photos, GIFs, or short videos.</p>
              </div>

              {!previewUrl ? (
                <div
                  onClick={handleThumbnailClick}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "flex h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-all",
                    isDragging
                      ? "border-[var(--accent)] bg-[rgb(var(--accent-rgb)/0.05)] shadow-[0_0_40px_rgb(var(--accent-rgb)/0.1)]"
                      : dark ? "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-600" : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-400"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-lg border", dark ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-200")}>
                    <Upload className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="text-center">
                    <p className={cn("text-xs font-normal uppercase tracking-[0.1em]", dark ? "text-zinc-300" : "text-zinc-700")}>Choose File</p>
                    <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">drop, or paste with ⌘V</p>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className={cn("relative h-48 overflow-hidden rounded-lg border group shadow-2xl", dark ? "border-zinc-700" : "border-zinc-200")}>
                    {fileName?.match(/\.(mp4|webm|ogg|mov)$/i) || previewUrl.startsWith("data:video") ? (
                      <video src={previewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} autoPlay muted loop />
                    ) : (
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={handleThumbnailClick}
                        className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
                      >
                        <Upload className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={handleRemove}
                        className="w-10 h-10 rounded-lg bg-red-500/80 backdrop-blur-md flex items-center justify-center hover:bg-red-500 transition-all border border-red-400/20"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="space-y-1">
                <h3 className={cn("text-xl tracking-widest", dark ? "text-white" : "text-zinc-900")} style={{ fontFamily: 'Crimson Pro, serif' }}>External Link</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-serif italic">YouTube, Vimeo, or direct image URL.</p>
              </div>

              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <input
                  autoFocus
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Paste URL here..."
                  className={cn("w-full border rounded-lg pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[rgb(var(--accent-rgb)/0.5)] focus:ring-4 focus:ring-[color:rgb(var(--accent-rgb)/0.1)] transition-all", dark ? "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600" : "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400")}
                  onKeyDown={e => e.key === "Enter" && triggerLinkEmbed()}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex flex-col gap-3">
          <button
            disabled={tab === "upload" ? !previewUrl : !linkUrl.trim()}
            onClick={() => {
              if (tab === "upload" && previewUrl) {
                const isVideo = (fileName && fileName.match(/\.(mp4|webm|ogg|mov)$/i)) || previewUrl.startsWith("data:video")
                const html = isVideo 
                  ? `<video src="${previewUrl}" controls style="max-width:100%;height:auto;border-radius:6px;display:block;margin:4px 0"></video><br/>`
                  : `<img src="${previewUrl}" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:4px 0" alt="Media" /><br/>`
                onConfirm(html, true)
                onClose()
              } else {
                triggerLinkEmbed()
              }
            }}
            className="w-full py-4 rounded-lg text-[var(--accent-contrast)] text-[10px] font-normal uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
            style={{ backgroundColor: ACCENT, boxShadow: `0 8px 24px -6px ${accentAlpha(0.27)}` }}
          >
            Insert Selection
          </button>
        </div>

        {/* Hidden file input */}
        <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      </motion.div>
    </div>
  )
}
