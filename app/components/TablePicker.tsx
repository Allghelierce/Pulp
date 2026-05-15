"use client"
import { useState } from "react"

export function TablePicker({ onSelect, accent }: { onSelect: (rows: number, cols: number) => void; accent: string }) {
  const [hover, setHover] = useState({ r: 0, c: 0 })
  const MAX = 8
  return (
    <div className="select-none">
      <p className="text-[11px] font-normal text-zinc-500 mb-2.5 text-center tracking-wide">
        {hover.r > 0 && hover.c > 0 ? `${hover.c} × ${hover.r}` : "Insert Table"}
      </p>
      <div onMouseLeave={() => setHover({ r: 0, c: 0 })}>
        {Array.from({ length: MAX }, (_, r) => (
          <div key={r} className="flex gap-[3px] mb-[3px]">
            {Array.from({ length: MAX }, (_, c) => {
              const active = r < hover.r && c < hover.c
              return (
                <div
                  key={c}
                  onMouseEnter={() => setHover({ r: r + 1, c: c + 1 })}
                  onMouseDown={(e) => { e.preventDefault(); onSelect(r + 1, c + 1) }}
                  className="w-[18px] h-[18px] border rounded-[2px] cursor-pointer transition-all"
                  style={active
                    ? { backgroundColor: accent + "22", borderColor: accent }
                    : { backgroundColor: "#f4f4f5", borderColor: "#d4d4d8" }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
