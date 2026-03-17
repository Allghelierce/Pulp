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
    <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4 text-zinc-900" onMouseDown={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={e => { if (e.key === "Enter" && config.type !== "alert") confirm(); if (e.key === "Escape") onClose() }}
      >
        <p className="text-[15px] font-semibold text-zinc-800 leading-snug">{config.title}</p>
        {(config.type === "confirm" || config.type === "alert") && config.message && (
          <p className="text-[13px] text-zinc-500 mt-1.5 leading-relaxed">{config.message}</p>
        )}
        {config.type === "prompt" && (
          <input
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder={config.placeholder ?? ""}
            className="mt-4 w-full border border-zinc-200 rounded-lg px-3 py-2 text-[13px] text-zinc-800 outline-none bg-zinc-50 focus:border-zinc-400"
          />
        )}
        <div className="flex gap-2 mt-5 justify-end">
          {config.type !== "alert" && (
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">
              Cancel
            </button>
          )}
          <button
            onClick={confirm}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: btnColor }}
          >
            {config.type === "prompt"  ? (config.confirmLabel ?? "Create") :
             config.type === "confirm" ? (config.confirmLabel ?? "Confirm") : "OK"}
          </button>
        </div>
      </div>
    </div>
  )
}
