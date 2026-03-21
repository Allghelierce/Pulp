"use client"
import React from 'react'
import type { NoteData } from '@/app/types'
import { Plus } from 'lucide-react'

interface ShelfViewProps {
  notes: NoteData[]
  onOpenNote: (id: string | null) => void
  onCreateNote: () => void
  theme: "light" | "dark"
}

const BINDER_COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#71717a", // Zinc (Black/Grey)
]

export function ShelfView({ notes, onOpenNote, onCreateNote, theme }: ShelfViewProps) {
  const dk = theme === "dark"
  
  return (
    <div className={`min-h-screen w-full transition-colors duration-500 overflow-y-auto ${dk ? 'bg-[#121214]' : 'bg-[#f4f1ea]'}`}>
      <div className="max-w-6xl mx-auto px-12 py-20">
        
        {/* Header Section */}
        <div className="flex items-baseline justify-between mb-16 border-b border-black/5 pb-8">
          <div>
            <h1 className={`text-4xl font-serif font-black tracking-tight ${dk ? 'text-zinc-200' : 'text-zinc-900'}`}>My Archives</h1>
            <p className={`mt-2 font-medium opacity-50 ${dk ? 'text-zinc-400' : 'text-zinc-600'}`}>Select a binder to continue your studies</p>
          </div>
          <button 
            onClick={onCreateNote}
            className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-105 transition-all duration-300 active:scale-95"
          >
            <Plus className="w-6 h-6 text-zinc-900" />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">New Binder</div>
          </button>
        </div>

        {/* The Shelf Layered Effect */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-16 gap-x-8">
          {notes.map((note, idx) => {
             const color = BINDER_COLORS[idx % BINDER_COLORS.length]
             return (
               <button 
                key={note.id}
                onClick={() => onOpenNote(note.id)}
                className="group relative h-[280px] w-full text-left focus:outline-none"
               >
                 {/* 3D Binder Perspective Parent */}
                 <div className="relative w-full h-full preserve-3d group-hover:translate-y-[-12px] group-hover:rotate-y-[-10deg] transition-all duration-500 ease-out cursor-pointer">
                    
                    {/* Spine (The Front View on Shelf) */}
                    <div 
                      className="absolute inset-y-0 left-0 w-14 shrink-0 rounded-l-md shadow-[4px_0_15px_rgba(0,0,0,0.3)] z-10 flex flex-col items-center py-6"
                      style={{ backgroundColor: color }}
                    >
                      {/* Spine Label Strip */}
                      <div className="w-8 h-40 bg-white/90 shadow-inner rounded-sm overflow-hidden flex items-center justify-center p-1">
                         <span className="text-zinc-900 text-[10px] font-black uppercase tracking-widest text-center transform -rotate-90 origin-center whitespace-nowrap min-w-[120px]">
                           {note.subject}
                         </span>
                      </div>
                      
                      {/* Decorative Spine Detail */}
                      <div className="mt-auto space-y-4 mb-4 opacity-50">
                        <div className="w-8 h-12 border-2 border-white/30 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white/40" />
                        </div>
                        <div className="w-8 h-[2px] bg-white/20" />
                      </div>
                    </div>

                    {/* Binder Side / "Front Cover" (visible during hover/tilt) */}
                    <div 
                      className="absolute inset-y-0 left-12 right-0 rounded-r-lg bg-zinc-50 shadow-xl overflow-hidden pointer-events-none origin-left flex flex-col p-6 translate-z-[-1px] transition-transform duration-500"
                      style={{ 
                        backgroundColor: dk ? '#1e1e22' : '#fcfcfc',
                        border: dk ? '1px solid #2a2a2e' : '1px solid #e2e2e2',
                        borderLeft: 'none'
                      }}
                    >
                      <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-3 ${dk ? 'text-zinc-500' : 'text-zinc-400'}`}>Volume {idx + 1}</div>
                      <div className={`text-lg font-serif font-black leading-tight mb-auto ${dk ? 'text-zinc-200' : 'text-zinc-800'}`}>
                        {note.subject}
                      </div>

                      <div className={`text-[10px] font-medium opacity-50 ${dk ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {Object.values(note.boxes).reduce((acc, b) => acc + b.length, 0)} Items Added
                      </div>
                    </div>

                    {/* Shadow on Shelf */}
                    <div className="absolute bottom-[-10px] left-2 right-2 h-4 bg-black/20 blur-lg rounded-full z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 </div>
               </button>
             )
          })}

          {/* New Book Placeholder */}
          <button 
            onClick={onCreateNote}
            className="group relative h-[280px] w-full border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all flex flex-col items-center justify-center p-8 gap-4 overflow-hidden"
          >
            <div className="w-12 h-16 rounded shadow-sm border border-zinc-300 dark:border-zinc-700 bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Plus className="w-5 h-5 opacity-40" />
            </div>
            <span className="text-[12px] font-bold uppercase tracking-widest opacity-40">Add Course</span>
          </button>
        </div>

      </div>

      {/* Grid line floor for the Shelf */}
      <style jsx>{`
        .preserve-3d { transform-style: preserve-3d; }
        .translate-z-[-1px] { transform: translateZ(-1px); }
      `}</style>
    </div>
  )
}
