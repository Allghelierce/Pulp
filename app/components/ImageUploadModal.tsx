"use client"

import { useCallback, useState } from "react"
import { useImageUpload } from "@/app/hooks/use-image-upload"
import { ImagePlus, Upload, Trash2, X } from "lucide-react"
import Image from "next/image"

interface ImageUploadModalProps {
  onConfirm: (url: string) => void
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
      if (file && file.type.startsWith("image/")) {
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
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Insert Image</h3>
            <p className="text-xs text-gray-400 mt-0.5">Supported formats: JPG, PNG, GIF, WebP</p>
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
              <p className="text-xs text-gray-400">or drag and drop an image here</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="group relative h-52 overflow-hidden rounded-xl border border-gray-200">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="420px"
              />
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

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            disabled={!previewUrl}
            onClick={() => { if (previewUrl) { onConfirm(previewUrl); onClose() } }}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: previewUrl ? "linear-gradient(135deg, #e8701a, #c04a08)" : undefined, backgroundColor: previewUrl ? undefined : "#d1d5db" }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  )
}
