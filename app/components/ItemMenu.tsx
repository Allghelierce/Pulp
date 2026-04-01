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
        <div className="absolute right-0 top-6 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-50 py-0.5 min-w-max overflow-hidden">
          {actions.map(a => (
            <button
              key={a.label}
              onClick={e => { e.stopPropagation(); a.onClick(); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-[10px] transition-colors whitespace-nowrap ${a.danger ? "text-red-500 hover:bg-red-900/30" : "text-zinc-300 hover:bg-zinc-700 hover:text-white"}`}
            >{a.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}
