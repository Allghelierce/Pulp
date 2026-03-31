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
      }
    }
    
    // Give it a tiny delay to allow layout to settle
    calc()
    setTimeout(calc, 50)
    
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [isVisible])

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) onImageUpload(ev.target.result as string) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Mimics DocumentToolbar.tsx small button format
  const styles = {
    btn: "relative flex items-center justify-center border border-zinc-200 rounded-[5px] bg-white hover:bg-zinc-100 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors cursor-pointer px-2.5 py-1 shrink-0 active:scale-[0.97]",
    icon: "w-4 h-4",
    shortcut: "absolute bottom-0.5 right-1 text-[8px] font-semibold text-zinc-400 pointer-events-none"
  }

  const getBtnStyle = (isActive: boolean) => isActive ? { backgroundColor: "#f4f4f5", borderColor: "#d4d4d8", color: "#18181b" } : {}

  return (
    <div
      className={`ls-toolbar fixed z-[45] flex items-center justify-between bg-zinc-50 border-x border-b border-zinc-200/80 rounded-b-lg shadow-md px-3 py-2 gap-1.5 transition-all duration-200 ease-in-out`}
      style={{
        left: bounds.left, 
        right: bounds.right, 
        top: isVisible ? '48px' : '36px',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button onClick={() => onToolChange('pan')} className={styles.btn} style={getBtnStyle(activeTool === 'pan')} title="Pan">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v4M14 11V4a2 2 0 0 0-4 0v6M10 11V5a2 2 0 0 0-4 0v9M6 14v-2a2 2 0 0 0-4 0v5a7 7 0 0 0 7 7h3a6 6 0 0 0 6-6v-7a2 2 0 0 0-4 0"/></svg>
        </button>

        <button onClick={() => onToolChange('select')} className={styles.btn} style={getBtnStyle(activeTool === 'select')} title="Select">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
        </button>

        <div className="w-px h-5 mx-1 bg-zinc-200/80 shrink-0" />

        <button onClick={() => onToolChange('rect')} className={styles.btn} style={getBtnStyle(activeTool === 'rect')} title="Rectangle">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
        </button>

        <button onClick={() => onToolChange('diamond')} className={styles.btn} style={getBtnStyle(activeTool === 'diamond')} title="Diamond">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l10 10-10 10L2 12 12 2z"/></svg>
        </button>

        <button onClick={() => onToolChange('circle')} className={styles.btn} style={getBtnStyle(activeTool === 'circle')} title="Circle">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
        </button>

        <button onClick={() => onToolChange('arrow')} className={styles.btn} style={getBtnStyle(activeTool === 'arrow')} title="Arrow">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>

        <button onClick={() => onToolChange('line')} className={styles.btn} style={getBtnStyle(activeTool === 'line')} title="Line">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
        </button>

        <div className="w-px h-5 mx-1 bg-zinc-200/80 shrink-0" />

        <button onClick={() => onToolChange('pen')} className={styles.btn} style={getBtnStyle(activeTool === 'pen')} title="Pen">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
        </button>

        <button onClick={() => onToolChange('text')} className={styles.btn} style={getBtnStyle(activeTool === 'text')} title="Text box">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4 20 8-16 8 16"/><path d="M8 12h8"/></svg>
        </button>

        <button onClick={() => fileInputRef.current?.click()} className={styles.btn} style={getBtnStyle(activeTool === 'image')} title="Insert image">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </button>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-zinc-200/80">
        <button onClick={() => { if (activeTool === 'eraser') { onClearDrawing(); } else { onToolChange('eraser') } }} className={`${styles.btn} w-[34px] px-0`} style={getBtnStyle(activeTool === 'eraser')} title={activeTool === 'eraser' ? "Clear all drawings" : "Eraser"}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke={activeTool === 'eraser' ? '#ef4444' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
        </button>
        
        <button onClick={() => onToolChange('shapes')} className={`${styles.btn} w-[34px] px-0`} style={getBtnStyle(activeTool === 'shapes')} title="Shapes library (coming soon)">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l4 7H8z"/><rect x="4" y="14" width="6" height="6" rx="1"/><circle cx="17" cy="17" r="3"/>
          </svg>
        </button>
      </div>
    </div>
  )
})
