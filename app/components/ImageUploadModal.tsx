"use client"

import { useCallback, useState } from "react"
import { useImageUpload } from "@/app/hooks/use-image-upload"
import { ImagePlus, Upload, Trash2, X, Link as LinkIcon, Globe } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

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

  const pulpOrange = "#d97706"

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
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-zinc-800 border border-zinc-700/50 rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.8)] w-full max-w-sm overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-right from-transparent via-orange-500/20 to-transparent" />

        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div className="flex gap-6">
            <button
              onClick={() => setTab("upload")}
              className={cn("pb-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative", tab === "upload" ? "text-white" : "text-zinc-500 hover:text-zinc-300")}
            >
              {tab === "upload" && <motion.div layoutId="mediaTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
              Upload
            </button>
            <button
              onClick={() => setTab("link")}
              className={cn("pb-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative", tab === "link" ? "text-white" : "text-zinc-500 hover:text-zinc-300")}
            >
              {tab === "link" && <motion.div layoutId="mediaTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
              Embed
            </button>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-700/50 transition-colors">
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        <div className="p-8">
          {tab === "upload" ? (
            <div className="flex flex-col gap-6">
              <div className="space-y-1">
                <h3 className="text-xl text-white tracking-widest uppercase" style={{ fontFamily: '"Didot", "Bodoni MT", "Noto Serif Display", "URW Palladio L", P052, Sylfaen, serif' }}>Insert Media</h3>
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
                    "flex h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all",
                    isDragging
                      ? "border-orange-500 bg-orange-500/5 shadow-[0_0_40px_rgba(245,160,48,0.1)]"
                      : "border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-600"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shadow-lg border border-zinc-700">
                    <Upload className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-300">Choose File</p>
                    <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">or drop here</p>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="relative h-48 overflow-hidden rounded-2xl border border-zinc-700 group shadow-2xl">
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
                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/20"
                      >
                        <Upload className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={handleRemove}
                        className="w-10 h-10 rounded-xl bg-red-500/80 backdrop-blur-md flex items-center justify-center hover:bg-red-500 transition-all border border-red-400/20"
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
                <h3 className="text-xl text-white tracking-widest uppercase" style={{ fontFamily: '"Didot", "Bodoni MT", "Noto Serif Display", "URW Palladio L", P052, Sylfaen, serif' }}>External Link</h3>
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-zinc-600"
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
            className="w-full py-4 rounded-xl text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
            style={{ backgroundColor: pulpOrange, boxShadow: `0 8px 24px -6px ${pulpOrange}44` }}
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
