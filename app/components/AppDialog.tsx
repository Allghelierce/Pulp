"use client"
import { useState } from "react"
import type { DialogConfig } from "@/app/types"

export function AppDialog({ config, accent, onClose }: { config: DialogConfig; accent: string; onClose: () => void }) {
  const [val, setVal] = useState(config.type === "prompt" ? (config.defaultValue ?? "") : "")

  const confirm = () => {
    if (config.type === "prompt") config.onConfirm(val)
    else if (config.type === "confirm") config.onConfirm()
    onClose()
  }

  const btnColor = config.type === "confirm" && config.danger ? "#dc2626" : accent

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4" onMouseDown={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-none shadow-[0_8px_40px_rgba(0,0,0,0.18)] w-full max-w-sm border border-zinc-200 dark:border-zinc-700"
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={e => { if (e.key === "Enter" && config.type !== "alert") confirm(); if (e.key === "Escape") onClose() }}
      >
        <div className="px-6 py-6">
          {(config.type === "confirm" || config.type === "alert") && (
            <p
              className="text-[22px] text-zinc-900 dark:text-zinc-100 leading-tight mb-2"
              style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: 'italic', fontWeight: 500 }}
            >
              {config.title}
            </p>
          )}
          {(config.type === "confirm" || config.type === "alert") && config.message && (
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{config.message}</p>
          )}
          {config.type === "prompt" && (
            <input
              autoFocus
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder={config.title}
              className="w-full border-b border-zinc-200 dark:border-zinc-700 px-0 py-1 outline-none bg-transparent text-zinc-800 dark:text-zinc-200 focus:border-zinc-500 dark:focus:border-zinc-400 transition-colors"
              style={{ fontFamily: '"EB Garamond", Georgia, serif', fontStyle: val ? 'normal' : 'italic', fontSize: val ? '15px' : '22px', fontWeight: 500 }}
            />
          )}
          <div className="flex gap-2 mt-5 justify-end">
            {config.type !== "alert" && (
              <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                Cancel
              </button>
            )}
            <button
              onClick={confirm}
              className="px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
              style={{ backgroundColor: btnColor }}
            >
              {config.type === "prompt"  ? (config.confirmLabel ?? "Create") :
               config.type === "confirm" ? (config.confirmLabel ?? "Confirm") : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
