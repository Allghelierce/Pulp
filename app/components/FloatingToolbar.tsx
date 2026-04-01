"use client"
import { useState, useRef, useEffect, memo } from "react"

export const FloatingToolbar = memo(function FloatingToolbar({ accent, activeTool, onToolChange, onClearDrawing, onImageUpload, isVisible }: {
  accent: string
  activeTool: string
  onToolChange: (t: string) => void
  onClearDrawing: () => void
  onImageUpload: (dataUrl: string) => void
  isVisible: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bounds, setBounds] = useState({ left: 350, right: 350 })

  useEffect(() => {
    if (!isVisible) return
    const calc = () => {
      const tb = document.getElementById('document-toolbar')
      if (!tb) return
      
      const drawBtn = Array.from(tb.querySelectorAll('button')).find(b => b.textContent?.includes('Draw'))
      const zoomSel = tb.querySelector('select')
      
      if (drawBtn && zoomSel) {
        const d = drawBtn.getBoundingClientRect()
        const z = zoomSel.getBoundingClientRect()
        setBounds({ left: d.left, right: window.innerWidth - z.right })
      } else {
        // Fallback positioning if buttons aren't found
        setBounds({ left: 350, right: 350 })
      }
    }
    
    calc()
    const timer = setTimeout(calc, 100)
    window.addEventListener('resize', calc)
    return () => {
      window.removeEventListener('resize', calc)
      clearTimeout(timer)
    }
  }, [isVisible])

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) onImageUpload(ev.target.result as string) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const styles = {
    btn: "relative flex items-center justify-center border border-zinc-200 rounded-[8px] bg-white hover:bg-zinc-50 text-zinc-600 shadow-sm transition-all duration-200 cursor-pointer px-2.5 py-1.5 shrink-0 active:scale-[0.94]",
    icon: "w-[17px] h-[17px]",
  }

  const hideScrollbar = `
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `

  const getBtnStyle = (isActive: boolean) => isActive ? { 
    backgroundColor: "rgba(184,94,34,0.08)", 
    borderColor: "rgba(184,94,34,0.3)",
    color: "#b85e22",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
  } : {}

  const toolbarClasses = `ls-toolbar fixed z-[100] flex items-center justify-between border-x border-b border-zinc-200/80 rounded-b-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] px-4 py-2.5 gap-2.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`

  return (
    <div
      className={toolbarClasses}
      style={{
        left: bounds.left, 
        right: bounds.right, 
        top: isVisible ? '48px' : '20px',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(40px) saturate(160%)",
        WebkitBackdropFilter: "blur(40px) saturate(160%)",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: hideScrollbar }} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar" style={{ minWidth: 0 }}>
        <button onMouseDown={e => { e.preventDefault(); onToolChange('pan') }} className={styles.btn} style={getBtnStyle(activeTool === 'pan')} title="Pan (Space)">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v4M14 11V4a2 2 0 0 0-4 0v6M10 11V5a2 2 0 0 0-4 0v9M6 14v-2a2 2 0 0 0-4 0v5a7 7 0 0 0 7 7h3a6 6 0 0 0 6-6v-7a2 2 0 0 0-4 0"/></svg>
        </button>

        <button onMouseDown={e => { e.preventDefault(); onToolChange('select') }} className={styles.btn} style={getBtnStyle(activeTool === 'select')} title="Selection (V)">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
        </button>

        <div className="w-px h-6 mx-0.5 bg-zinc-200/60 shrink-0" />

        {[
          { id: 'rect', icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>, title: "Rectangle (R)" },
          { id: 'diamond', icon: <path d="M12 2l10 10-10 10L2 12 12 2z"/>, title: "Diamond" },
          { id: 'circle', icon: <circle cx="12" cy="12" r="10"/>, title: "Circle (O)" },
          { id: 'arrow', icon: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>, title: "Arrow (A)" },
          { id: 'line', icon: <path d="M5 12h14"/>, title: "Line (L)" },
        ].map(tool => (
          <button key={tool.id} onMouseDown={e => { e.preventDefault(); onToolChange(tool.id) }} className={styles.btn} style={getBtnStyle(activeTool === tool.id)} title={tool.title}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{tool.icon}</svg>
          </button>
        ))}

        <div className="w-px h-6 mx-0.5 bg-zinc-200/60 shrink-0" />

        <button onMouseDown={e => { e.preventDefault(); onToolChange('pen') }} className={styles.btn} style={getBtnStyle(activeTool === 'pen')} title="Pen (P)">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
        </button>

        <button onMouseDown={e => { e.preventDefault(); onToolChange('text') }} className={styles.btn} style={getBtnStyle(activeTool === 'text')} title="Text Box (T)">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m4 20 8-16 8 16"/><path d="M8 12h8"/></svg>
        </button>

        <button onMouseDown={e => { e.preventDefault(); fileInputRef.current?.click() }} className={styles.btn} style={getBtnStyle(activeTool === 'image')} title="Insert Image">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-zinc-200/60">
        <button onMouseDown={e => { e.preventDefault(); if (activeTool === 'eraser') { onClearDrawing(); } else { onToolChange('eraser') } }} className={`${styles.btn} w-[38px] px-0 shadow-none border-transparent bg-transparent hover:bg-red-50`} style={getBtnStyle(activeTool === 'eraser')} title={activeTool === 'eraser' ? "Click again to clear all drawings" : "Eraser (E or 0)"}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke={activeTool === 'eraser' ? '#ef4444' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
        </button>
        
        <button onMouseDown={e => { e.preventDefault(); onToolChange('shapes') }} className={`${styles.btn} w-[38px] px-0 shadow-none border-transparent bg-transparent`} style={getBtnStyle(activeTool === 'shapes')} title="Shapes Library">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l4 7H8z"/><rect x="4" y="14" width="6" height="6" rx="1"/><circle cx="17" cy="17" r="3"/>
          </svg>
        </button>
      </div>
    </div>
  )
})
