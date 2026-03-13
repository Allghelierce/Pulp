"use client"
import { useState, useRef, useEffect } from "react"

export function ItemMenu({ actions }: { actions: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-zinc-400 hover:text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >⋮</button>
      {open && (
        <div className="absolute right-0 top-6 bg-[#1f1f1f] border border-white/10 rounded-lg shadow-xl z-50 py-1 min-w-[120px]">
          {actions.map(a => (
            <button
              key={a.label}
              onClick={e => { e.stopPropagation(); a.onClick(); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/10 transition-colors ${a.danger ? "text-red-400" : "text-zinc-300"}`}
            >{a.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}
