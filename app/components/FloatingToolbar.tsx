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
  const [strokeColor, setStrokeColor] = useState("#000000")
  const [fillColor, setFillColor] = useState("transparent")
  const [lineWidth, setLineWidth] = useState(2)

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

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" style={{ minWidth: 0 }}>
        {/* Pen Tool */}
        <button onMouseDown={e => { e.preventDefault(); onToolChange('pen') }} className={styles.btn} style={getBtnStyle(activeTool === 'pen')} title="Pen (P)">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
        </button>

        {/* Eraser Tool */}
        <button onMouseDown={e => { e.preventDefault(); if (activeTool === 'eraser') { onClearDrawing(); } else { onToolChange('eraser') } }} className={styles.btn} style={getBtnStyle(activeTool === 'eraser')} title={activeTool === 'eraser' ? "Click again to clear all drawings" : "Eraser (E)"}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke={activeTool === 'eraser' ? '#ef4444' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
        </button>

        <div className="w-px h-6 mx-0.5 bg-zinc-200/60 shrink-0" />

        {/* Stroke Color */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-zinc-600">Stroke:</label>
          <input
            type="color"
            value={strokeColor}
            onChange={e => setStrokeColor(e.target.value)}
            className={`w-7 h-7 rounded cursor-pointer border border-zinc-200 shadow-sm hover:shadow-md transition-shadow`}
            title="Stroke color"
          />
        </div>

        {/* Fill Color */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-zinc-600">Fill:</label>
          <input
            type="color"
            value={fillColor === 'transparent' ? '#ffffff' : fillColor}
            onChange={e => setFillColor(e.target.value)}
            className={`w-7 h-7 rounded cursor-pointer border border-zinc-200 shadow-sm hover:shadow-md transition-shadow`}
            title="Fill color"
          />
        </div>

        {/* Line Width */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-zinc-600">Width:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={e => setLineWidth(Number(e.target.value))}
            className="w-20 h-1 rounded cursor-pointer"
            title="Line width"
          />
          <span className="text-[10px] text-zinc-500 min-w-[20px]">{lineWidth}px</span>
        </div>
      </div>
    </div>
  )
})
