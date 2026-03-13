"use client"
import React from "react"

export function SettingRow({ title, description, control }: { title: string; description?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-8 py-3.5 border-b border-zinc-100 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-zinc-800">{title}</p>
        {description && <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}
