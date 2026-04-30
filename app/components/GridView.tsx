"use client"
import React, { useEffect } from "react"
import type { NoteData } from "@/app/types"
import { getPaperBg, type PaperStyle } from "@/app/lib/paperStyle"
import { sanitizeHTML } from "@/lib/sanitize"

interface GridViewProps {
  activeNote: NoteData
  activeTabId: string | null
  carouselIdx: number
  lineSpacing: "compact" | "normal" | "relaxed"
  paperStyle: PaperStyle
  theme: "light" | "dark"
  editorFont: string
  accent: string
  setCarouselIdx: React.Dispatch<React.SetStateAction<number>>
  setGridView: React.Dispatch<React.SetStateAction<boolean>>
  setCurrentPageIdx: React.Dispatch<React.SetStateAction<number>>
  setNotes: React.Dispatch<React.SetStateAction<NoteData[]>>
}

export function GridView({ activeNote, theme, accent, setGridView, setCurrentPageIdx, lineSpacing, paperStyle, editorFont, setNotes, activeTabId }: GridViewProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGridView(false)
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [setGridView])

  const lh = ({ compact: 24, normal: 32, relaxed: 40 } as Record<string, number>)[lineSpacing] ?? 32

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-black/90 backdrop-blur-3xl overflow-y-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between px-10 py-5 z-50 pointer-events-none sticky top-0 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold pointer-events-auto">{activeNote.pages.length} Pages</p>
        </div>

        <button
          onClick={() => setGridView(false)}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-none bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 hover:scale-105 group"
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Escape</span>
          <span className="px-1.5 py-0.5 rounded-none bg-white/10 text-[8px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">ESC</span>
        </button>
      </div>

      {/* Pages Grid - 4 columns, tight spacing */}
      <div className="max-w-[1900px] mx-auto w-full px-16 pb-48 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-6">
        {activeNote.pages.map((pageHtml, idx) => {
          const { backgroundColor, backgroundImage, backgroundSize } = getPaperBg(lineSpacing, paperStyle, theme === "dark", true)

          return (
            <div
              key={idx}
              onClick={() => { setCurrentPageIdx(idx); setGridView(false) }}
              className="group relative cursor-pointer flex flex-col items-center"
            >
              <div
                className="relative w-[380px] h-[538px] rounded-none overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/5 bg-white transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_45px_100px_rgba(0,0,0,0.8)]"
                style={{ backgroundColor }}
              >
                {/* 1:1 Scale Simulation (Scaled to ~0.46 to fit 380px width) */}
                <div
                  className="absolute top-0 left-0 w-[827px] h-[1170px] origin-top-left pointer-events-none"
                  style={{
                    transform: 'scale(0.4595)',
                    backgroundImage, backgroundSize,
                    backgroundColor: theme === 'dark' ? backgroundColor : backgroundColor
                  }}
                >
                  {/* Margin Line */}
                  <div className="absolute left-[112px] top-0 bottom-0 w-[1.5px] z-20" style={{ backgroundColor: theme === 'dark' ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.6)' }} />

                  {/* High Fidelity Content Layers */}
                  <div className="absolute inset-0 z-10 overflow-hidden">
                    {/* Main Flowing Text Content */}
                    <div
                      className="w-full h-full"
                      style={{
                        padding: '80px 60px 80px 140px',
                        fontSize: '18px',
                        lineHeight: lh + 'px',
                        fontFamily: `"${editorFont}", serif`,
                        color: "#1A1A1A",
                      }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(pageHtml || "") }}
                    />

                    {/* Drawings Layer (SVG Ink) */}
                    <svg viewBox="0 0 827 1170" className="absolute inset-0 w-full h-full z-20">
                      {(activeNote.drawings?.[idx] || []).map((path, pidx) => (
                        <path
                          key={path.id || pidx}
                          d={`M ${path.points[0]?.x} ${path.points[0]?.y} ${path.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
                          fill="none"
                          stroke={path.color === 'accent' ? accent : path.color}
                          strokeWidth={path.width}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            opacity: path.tool === 'highlighter' ? 0.45 : 1,
                            mixBlendMode: path.tool === 'highlighter' ? (theme === 'dark' ? 'lighten' : 'multiply') : 'normal'
                          }}
                        />
                      ))}
                    </svg>

                    {/* Boxes Layer (Floating notes) */}
                    {(activeNote.boxes[idx] || []).map(box => (
                      <div key={box.id} style={{
                        position: 'absolute',
                        left: box.x, top: box.y, width: box.w, height: box.h,
                        fontFamily: box.boxFontFamily || editorFont || '"EB Garamond", serif',
                        fontSize: (box.boxFontSize || 16) + 'px',
                        textAlign: box.textAlign,
                        color: "#1A1A1A",
                        lineHeight: 1.45,
                        wordWrap: 'break-word',
                        overflow: 'hidden',
                        zIndex: 40
                      }} dangerouslySetInnerHTML={{ __html: sanitizeHTML(box.content) }} />
                    ))}
                  </div>
                </div>

                {/* Subtle Hover selection hint (No popup) */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                <div className="absolute top-4 right-5 z-[50] pointer-events-none">
                  <span className="text-[18px] font-bold text-black transition-colors uppercase tracking-widest" style={{ fontFamily: 'var(--font-italiana)' }}>
                    0{idx + 1}
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {/* Add Page Card */}
        <div
          onClick={() => {
            const np = [...activeNote.pages, ""]
            setNotes(prev => prev.map(n => n.id === activeTabId ? { ...n, pages: np } : n))
            setCurrentPageIdx(activeNote.pages.length)
            setGridView(false)
          }}
          className="group relative cursor-pointer flex flex-col items-center"
        >
          <div className="w-[380px] h-[538px] rounded-none border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 flex flex-col items-center justify-center gap-4 group-hover:scale-[1.02]">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center text-2xl text-white/30 group-hover:text-white transition-colors">
              +
            </div>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em] group-hover:text-white/60 transition-colors">
              New Page
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          overflow: hidden !important;
        }
      `}</style>
    </div>
  )
}
