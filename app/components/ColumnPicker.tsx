"use client"
import { useState } from "react"

export function ColumnPicker({ onSelect }: { onSelect: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div>
      <p className="text-[11px] font-medium text-zinc-500 mb-2.5 text-center">Insert columns</p>
      <div className="flex gap-2">
        {[1, 2, 3].map(n => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onMouseDown={e => { e.preventDefault(); onSelect(n) }}
            className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${hovered === n ? "bg-blue-50" : "hover:bg-zinc-50"}`}
          >
            <div className="flex gap-[3px] h-9 w-11">
              {Array.from({ length: n }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-[2px] border transition-colors ${hovered === n ? "border-blue-400 bg-blue-100" : "border-zinc-300 bg-zinc-100"}`}
                />
              ))}
            </div>
            <span className={`text-[10px] font-medium transition-colors ${hovered === n ? "text-blue-600" : "text-zinc-400"}`}>
              {n === 1 ? "One" : n === 2 ? "Two" : "Three"}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
 