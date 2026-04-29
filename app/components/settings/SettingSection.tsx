"use client"
import React from "react"

export function SettingSection({ title, children, isDark }: { title?: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <div className="mb-7">
      {title && (
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2.5 px-0.5 ${isDark ? "text-zinc-500" : "text-zinc-400"}`} style={{ fontFamily: 'var(--font-italiana)' }}>
          {title}
        </p>
      )}
      <div className={`rounded-xl border overflow-hidden divide-y ${
        isDark
          ? "bg-zinc-900/50 border-zinc-800 divide-zinc-800"
          : "bg-white border-zinc-200/80 divide-zinc-100"
      }`}>
        {children}
      </div>
    </div>
  )
}
