"use client"
import { memo, useState } from "react"

interface RightSidebarProps {
  isOpen: boolean
  onClose: () => void
  theme: "light" | "dark"
  accent: string
  sketchMode: boolean
  setSketchMode: (v: boolean) => void
  setSketchPrompt: (v: string) => void
  openAlert: (title: string, message?: string) => void
}

export const RightSidebar = memo(function RightSidebar({
  isOpen, onClose, theme, accent,
  sketchMode, setSketchMode, setSketchPrompt, openAlert
}: RightSidebarProps) {
  const [llmRequest, setLlmRequest] = useState("")

  const handleAiSketch = () => {
    const selection = window.getSelection()?.toString()
    if (!selection) {
      openAlert("Select text first", "Highlight some text in the editor before using AI Sketch.")
      return
    }
    setSketchPrompt(selection)
    setSketchMode(true)
  }

  const handleLlmSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!llmRequest.trim()) return
      openAlert("Smart LLM", "Thinking about: " + llmRequest)
      setLlmRequest("")
    }
  }

  return (
    <div
      className={`fixed right-0 top-12 bottom-0 z-40 flex transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ width: 320 }}
    >
      {/* Sidebar Content */}
      <div className={`flex-1 h-full border-l flex flex-col shadow-2xl ${theme === 'dark' ? 'bg-[#151518] border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="p-4 border-b border-zinc-200/50 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight uppercase" style={{ color: accent, opacity: 0.8 }}>Insights & Tools</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* AI Assistance Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-1.5 px-1">
              <h3 className="text-[9px] font-normal uppercase tracking-widest text-zinc-300">Smart AI Hub</h3>
            </div>

            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} space-y-4`}>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">AI Request</label>
                <textarea
                  value={llmRequest}
                  onChange={(e) => setLlmRequest(e.target.value)}
                  onKeyDown={handleLlmSubmit}
                  placeholder="Ask anything about your notes..."
                  className={`w-full p-3 rounded-lg text-xs leading-relaxed resize-none h-24 outline-none border transition-all ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800 text-zinc-300 focus:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-600 focus:border-zinc-300'}`}
                />
                <div className="flex justify-between items-center">
                   <span className="text-[9px] text-zinc-400 font-medium italic">Press Enter to send</span>
                   <button
                    onClick={() => { if(llmRequest.trim()) { openAlert("Smart LLM", "Thinking about: " + llmRequest); setLlmRequest("") } }}
                    className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                   >
                     <svg className="w-4 h-4" style={{ color: accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                   </button>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={handleAiSketch}
                  className={`w-full py-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm ${sketchMode ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'}`}
                  style={{ backgroundColor: sketchMode ? accent : 'transparent', border: sketchMode ? 'none' : `1px solid ${theme === 'dark' ? '#333' : '#e4e4e7'}` }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  AI Sketch Generation
                </button>
                <p className="mt-2 text-[9px] text-zinc-400 text-center italic">Highlight text to visualize ideas</p>
              </div>
            </div>
          </section>

          {/* Quick Stats Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-zinc-300" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Document Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Words', value: '428' },
                { label: 'Diagrams', value: '12' },
                { label: 'Created', value: '11:00 AM' },
                { label: 'Mood', value: 'Focused' }
              ].map((stat, i) => (
                <div key={i} className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-100'} flex flex-col`}>
                  <span className="text-[9px] text-zinc-400 uppercase font-medium tracking-tight">{stat.label}</span>
                  <span className="text-[12px] font-bold" style={{ color: theme === 'dark' ? '#eee' : '#333' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Brand Label */}
        <div className="p-6 text-center">
          <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-300 dark:text-zinc-700 uppercase">Pulp AI</span>
        </div>
      </div>
    </div>
  )
})
