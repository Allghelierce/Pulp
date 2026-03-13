"use client"
import type { NoteData } from "@/app/types"
import { getPaperBg } from "@/app/lib/paperStyle"

interface GridViewProps {
  activeNote: NoteData
  activeTabId: string | null
  carouselIdx: number
  lineSpacing: "compact" | "normal" | "relaxed"
  paperStyle: "lined" | "dotgrid" | "plain" | "stenopad"
  theme: "light" | "dark"
  editorFont: string
  accent: string
  setCarouselIdx: React.Dispatch<React.SetStateAction<number>>
  setGridView: React.Dispatch<React.SetStateAction<boolean>>
  setCurrentPageIdx: React.Dispatch<React.SetStateAction<number>>
  setNotes: React.Dispatch<React.SetStateAction<NoteData[]>>
}

export function GridView({ activeNote, activeTabId, carouselIdx, lineSpacing, paperStyle, theme, editorFont, accent, setCarouselIdx, setGridView, setCurrentPageIdx, setNotes }: GridViewProps) {
  const lh = ({ compact: 24, normal: 32, relaxed: 40 } as Record<string, number>)[lineSpacing] ?? 32

  return (
    <main className="flex-1 flex flex-col overflow-hidden select-none" style={{ backgroundColor: theme === "dark" ? "#0e0e0e" : "#E8E3E0" }}>
      <div className="flex items-center justify-between px-8 pt-5 pb-0 shrink-0">
        <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>{activeNote.subject}</h2>
        <button onClick={() => setGridView(false)} className="text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors font-medium">← Back to editor</button>
      </div>

      <div className="flex-1 flex items-center justify-center" style={{ perspective: "1400px" }}>
        <div className="relative w-full h-full flex items-center justify-center">
          {[-1, 0, 1].map(offset => {
            const idx = carouselIdx + offset
            const isNewCard = idx === activeNote.pages.length && offset === 1
            if (idx < 0 || (idx >= activeNote.pages.length && !isNewCard)) return null
            const isCenter = offset === 0
            const page = activeNote.pages[idx] ?? ""
            const { backgroundColor, backgroundImage, backgroundSize } = getPaperBg(lineSpacing, paperStyle, true)

            return (
              <div
                key={isNewCard ? "new" : idx}
                onClick={() => { if (!isCenter) setCarouselIdx(isNewCard ? activeNote.pages.length - 1 : idx) }}
                style={{
                  position: "absolute",
                  transform: isCenter ? "translateX(0px) scale(1) rotateY(0deg)"
                    : offset === -1 ? "translateX(-340px) scale(0.72) rotateY(32deg)"
                    : "translateX(340px) scale(0.72) rotateY(-32deg)",
                  zIndex: isCenter ? 20 : 5, opacity: isCenter ? 1 : 0.55,
                  transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease",
                  cursor: isCenter ? "default" : "pointer", transformStyle: "preserve-3d", willChange: "transform",
                }}
              >
                {isNewCard ? (
                  <div
                    onClick={() => { const np = [...activeNote.pages, ""]; setNotes(prev => prev.map(n => n.id === activeTabId ? { ...n, pages: np } : n)); setCarouselIdx(activeNote.pages.length) }}
                    style={{ width: 310, height: 438, borderRadius: 8, border: `2px dashed ${accent}55`, background: `${accent}08`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: accent }}>+</div>
                    <span style={{ color: accent, fontSize: 12, fontWeight: 600 }}>New Page</span>
                  </div>
                ) : (
                  <div style={{ width: 310, height: 438, borderRadius: 8, overflow: "hidden", position: "relative", backgroundColor, backgroundImage, backgroundSize, boxShadow: isCenter ? "0 50px 100px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.07)" : "0 16px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: accent, zIndex: 3 }} />
                    <div style={{ position: "absolute", top: 12, right: 10, zIndex: 4, background: accent, color: "white", fontSize: 8, fontWeight: 800, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 99 }}>PAGE {idx + 1}</div>
                    <div style={{ position: "absolute", left: 58, top: 0, bottom: 0, width: 1, background: "rgba(252,165,165,0.45)", zIndex: 2, pointerEvents: "none" }} />
                    <div style={{ position: "absolute", top: 0, left: 0, width: 827, height: 1170, transform: "scale(0.3745)", transformOrigin: "top left", padding: "52px 80px 80px 160px", fontSize: 20, lineHeight: lh + "px", fontFamily: `"${editorFont}", serif`, color: theme === "dark" ? "#E5E5E7" : "#1A1A1A", pointerEvents: "none" }}
                      dangerouslySetInnerHTML={{ __html: page || `<span style="color:#ccc;font-style:italic;font-size:16px">Empty page</span>` }}
                    />
                    {isCenter && (
                      <div onClick={() => { setCurrentPageIdx(idx); setGridView(false) }} className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-5" style={{ background: "linear-gradient(transparent 55%, rgba(0,0,0,0.18))", cursor: "pointer", zIndex: 10 }}>
                        <span className="text-white text-[11px] font-bold px-5 py-2 rounded-full shadow-lg" style={{ backgroundColor: accent }}>Open Page</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 pb-8 shrink-0">
        <button onClick={() => setCarouselIdx(i => Math.max(0, i - 1))} disabled={carouselIdx === 0} className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all disabled:opacity-20 hover:scale-110 active:scale-95" style={{ backgroundColor: accent, color: "white" }}>‹</button>
        <div className="flex gap-1.5 items-center">
          {activeNote.pages.map((_, i) => (
            <button key={i} onClick={() => setCarouselIdx(i)} className="rounded-full transition-all duration-300" style={{ width: i === carouselIdx ? 22 : 7, height: 7, backgroundColor: i === carouselIdx ? accent : `${accent}44` }} />
          ))}
        </div>
        <button onClick={() => setCarouselIdx(i => Math.min(activeNote.pages.length - 1, i + 1))} disabled={carouselIdx >= activeNote.pages.length - 1} className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all disabled:opacity-20 hover:scale-110 active:scale-95" style={{ backgroundColor: accent, color: "white" }}>›</button>
      </div>
    </main>
  )
}
