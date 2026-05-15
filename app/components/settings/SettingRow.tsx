"use client"
import React from "react"

export function SettingRow({ title, description, control, isDark }: { title: React.ReactNode; description?: string; control: React.ReactNode; isDark: boolean }) {
  return (
    <div className="flex items-center justify-between gap-8 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-normal leading-snug ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>{title}</p>
        {description && (
          <p className={`text-[11.5px] mt-0.5 leading-relaxed ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}
