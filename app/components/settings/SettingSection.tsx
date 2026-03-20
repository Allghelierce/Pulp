"use client"
import React from "react"

export function SettingSection({ title, children, isDark }: { title?: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <div className="mb-5">
      {title && <p className={`text-[9px] font-bold ${isDark ? "text-zinc-600" : "text-zinc-400"} uppercase tracking-widest mb-2`}>{title}</p>}
      <div className={`${isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-100"} rounded-none border overflow-hidden px-4`}>
        {children}
      </div>
    </div>
  )
}

