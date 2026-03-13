"use client"
import React from "react"

export function SettingSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      {title && <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{title}</p>}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden px-4">
        {children}
      </div>
    </div>
  )
}
