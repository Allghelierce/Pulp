"use client"
import React from "react"
import { getPalette, getType } from "@/app/theme/palette"

export function SettingSection({ title, children, isDark }: { title?: string; children: React.ReactNode; isDark: boolean }) {
  const type = getType(getPalette(isDark))
  return (
    <div className="mb-7">
      {title && (
        <p className="mb-2.5 px-0.5" style={{ ...type.sectionHeader }}>
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
