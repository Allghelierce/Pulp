import { useState, useEffect, useRef, memo } from "react"
import { Sparkles, CornerDownLeft } from "lucide-react"

interface AiCommandBarProps {
  onClose: () => void
  onSubmit: (prompt: string) => void
}

export const AiCommandBar = memo(function AiCommandBar({ onClose, onSubmit }: AiCommandBarProps) {
  const [prompt, setPrompt] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim()) {
      onSubmit(prompt)
      setPrompt("")
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-10 z-[10000] flex justify-center px-6 pointer-events-none animate-fade-in">
      <div
        ref={containerRef}
        className="w-full max-w-[560px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden anim-slide-up pointer-events-auto"
        style={{ borderRadius: 8 }}
      >
        <form onSubmit={handleSubmit} className="relative flex items-center p-4">
          <div className="flex items-center justify-center w-8 h-8 mr-3 text-orange-600/80">
            <Sparkles className="w-5 h-5" />
          </div>
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI to write, edit, or generate..."
              className="flex-1 bg-transparent border-none outline-none text-[17px] dark:text-zinc-100 placeholder-zinc-500 italic"
              style={{ fontFamily: 'Crimson Pro, serif' }}
            />
          <div className="flex items-center gap-2 ml-3">
            <div className="flex items-center gap-1 px-1.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[9px] text-zinc-400 font-normal uppercase tracking-tighter">
              <span>Ctrl</span>
              <span className="opacity-40">+</span>
              <span>Enter</span>
            </div>
            <button 
              type="submit"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-orange-600"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </div>
        </form>
        
        {/* Subtle Bottom Bar */}
        <div className="px-5 py-2.5 bg-zinc-50 border-t border-zinc-100 dark:bg-zinc-900/50 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              AI Search
            </span>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Code
            </span>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Creative
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-normal">ESC to close</span>
        </div>
      </div>
    </div>
  )
})
