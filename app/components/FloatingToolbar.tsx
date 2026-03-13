"use client"
import { useState, useRef, useEffect } from "react"

export function FloatingToolbar({ accent }: { accent: string }) {
  const [isVertical, setIsVertical] = useState(false)
  const [isLocked, setIsLocked] = useState(true) // Locked by default as per image (active)
  const [activeTool, setActiveTool] = useState('pen')
  const [size, setSize] = useState<{ width: number | 'auto', height: number | 'auto' }>({ width: 'auto', height: 'auto' })
  
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)
  const resizing = useRef(false)

  // Initialize position to bottom center
  useEffect(() => {
    if (toolbarRef.current) {
      setPos({
        x: window.innerWidth / 2 - toolbarRef.current.offsetWidth / 2,
        y: window.innerHeight - toolbarRef.current.offsetHeight - 40
      })
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (isLocked) return
    // Only drag if clicking the toolbar background (not an interactive element)
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'button' || (e.target as HTMLElement).closest('button')) {
      return
    }
    
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    setPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragging.current) {
      dragging.current = false
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    }
  }

  const snapToEdge = () => {
    if (!toolbarRef.current) return
    const rect = toolbarRef.current.getBoundingClientRect()
    const padding = 20
    
    let newX = pos.x
    let newY = pos.y

    if (isVertical) {
      const candidateX: number[] = []
      
      // Left of screen (accounting for sidebar)
      const sidebar = document.getElementById('app-sidebar')
      const sidebarRight = sidebar ? sidebar.getBoundingClientRect().right : 0
      candidateX.push(sidebarRight + padding)
      
      // Right of screen
      candidateX.push(window.innerWidth - rect.width - padding)
      
      // Page constraints
      const paper = document.getElementById('editor-paper')
      if (paper) {
        const paperRect = paper.getBoundingClientRect()
        candidateX.push(paperRect.left - rect.width - padding)
        candidateX.push(paperRect.right + padding)
      }
      
      // Find closest candidate X
      let closestX = pos.x
      let minDiffX = Infinity
      for (const x of candidateX) {
        const diffX = Math.abs(pos.x - x)
        if (diffX < minDiffX) {
          minDiffX = diffX
          closestX = x
        }
      }
      newX = closestX
    } else {
      // Horizontal mode: snap top or bottom
      const docToolbar = document.getElementById('document-toolbar')
      const topSnap = docToolbar ? docToolbar.getBoundingClientRect().bottom + padding : padding
      const candidateY = [
        topSnap,
        window.innerHeight - rect.height - padding
      ]
      let closestY = pos.y
      let minDiffY = Infinity
      for (const y of candidateY) {
        const diffY = Math.abs(pos.y - y)
        if (diffY < minDiffY) {
          minDiffY = diffY
          closestY = y
        }
      }
      newY = closestY
    }

    // Keep within viewport bounds
    newX = Math.min(Math.max(padding, newX), window.innerWidth - rect.width - padding)
    newY = Math.min(Math.max(padding, newY), window.innerHeight - rect.height - padding)

    setPos({ x: newX, y: newY })
  }

  const onResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    resizing.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!resizing.current || !toolbarRef.current) return
    const rect = toolbarRef.current.getBoundingClientRect()
    setSize({
      width: Math.max(80, e.clientX - rect.left + 10),
      height: Math.max(48, e.clientY - rect.top + 10)
    })
  }

  const onResizePointerUp = (e: React.PointerEvent) => {
    if (resizing.current) {
      resizing.current = false
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    }
  }

  const styles = {
    btn: "relative flex items-center justify-center rounded-xl transition-colors hover:bg-zinc-100 shrink-0",
    icon: "w-5 h-5",
    shortcut: "absolute bottom-1 right-1 text-[8px] font-semibold text-zinc-400 pointer-events-none"
  }

  const getBtnStyle = (isActive: boolean) => isActive ? { color: accent, backgroundColor: `${accent}25` } : {}
  const btnSize = isVertical ? "w-10 h-10" : "w-10 h-10"

  const svgPattern = encodeURIComponent(`
    <svg width="40" height="69.28" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0L40 69.28M0 34.64L20 69.28M20 0L40 34.64M40 0L0 69.28M40 34.64L20 69.28M20 0L0 34.64M0 34.64L40 34.64M0 69.28L40 69.28" stroke="${accent}" stroke-width="1" opacity="0.15"/>
      <circle cx="20" cy="34.64" r="2.5" fill="${accent}" opacity="0.3"/>
      <circle cx="0" cy="0" r="2.5" fill="${accent}" opacity="0.3"/>
      <circle cx="20" cy="0" r="2.5" fill="${accent}" opacity="0.3"/>
      <circle cx="0" cy="34.64" r="2.5" fill="${accent}" opacity="0.3"/>
    </svg>
  `)
  
  return (
    <div
      ref={toolbarRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={() => { dragging.current = false }}
      className={`ls-toolbar fixed z-[100] flex bg-zinc-50 border border-zinc-200/80 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.05)] p-2 gap-1 select-none touch-none flex-wrap overflow-hidden ${!isLocked ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${isVertical ? 'flex-col items-center content-start' : 'flex-row items-center content-start'}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        transition: dragging.current ? 'none' : 'left 0.15s cubic-bezier(0.2, 0, 0, 1), top 0.15s cubic-bezier(0.2, 0, 0, 1)',
        backgroundImage: `url("data:image/svg+xml,${svgPattern}")`,
        backgroundSize: "40px 69.28px",
        backgroundPosition: "0 0",
        backgroundColor: "rgba(250, 250, 250, 0.95)",
        backdropFilter: "blur(12px)"
      }}
    >
      {/* ── Control Buttons ── */}
      <button 
        onClick={() => setIsLocked(!isLocked)} 
        className={`${btnSize} ${styles.btn} px-2`}
        style={getBtnStyle(isLocked)}
        title="Lock toolbar position"
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isLocked ? (
            <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></>
          ) : (
            <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></>
          )}
        </svg>
      </button>

      <button onClick={() => setIsVertical(!isVertical)} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(false)} title="Rotate toolbar">
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-12.28l5.67-5.67"/>
        </svg>
      </button>

      <button onClick={snapToEdge} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(false)} title="Snap to edge">
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16v16H4z"/><path d="M4 12h16"/><path d="M12 4v16"/>
        </svg>
      </button>

      <div className={`${isVertical ? 'w-full h-px my-1' : 'w-px h-8 mx-1'} bg-zinc-200/70 shrink-0`} />

      {/* ── Tools ── */}
      <button onClick={() => setActiveTool('pan')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'pan')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v4M14 11V4a2 2 0 0 0-4 0v6M10 11V5a2 2 0 0 0-4 0v9M6 14v-2a2 2 0 0 0-4 0v5a7 7 0 0 0 7 7h3a6 6 0 0 0 6-6v-7a2 2 0 0 0-4 0"/></svg>
      </button>

      <button onClick={() => setActiveTool('select')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'select')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
        <span className={styles.shortcut}>1</span>
      </button>

      <button onClick={() => setActiveTool('rect')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'rect')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
        <span className={styles.shortcut}>2</span>
      </button>

      <button onClick={() => setActiveTool('diamond')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'diamond')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l10 10-10 10L2 12 12 2z"/></svg>
        <span className={styles.shortcut}>3</span>
      </button>

      <button onClick={() => setActiveTool('circle')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'circle')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
        <span className={styles.shortcut}>4</span>
      </button>

      <button onClick={() => setActiveTool('arrow')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'arrow')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        <span className={styles.shortcut}>5</span>
      </button>

      <button onClick={() => setActiveTool('line')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'line')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
        <span className={styles.shortcut}>6</span>
      </button>

      <button onClick={() => setActiveTool('pen')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'pen')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
        <span className={styles.shortcut}>7</span>
      </button>

      <button onClick={() => setActiveTool('text')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'text')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4 20 8-16 8 16"/><path d="M8 12h8"/></svg>
        <span className={styles.shortcut}>8</span>
      </button>

      <button onClick={() => setActiveTool('image')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'image')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <span className={styles.shortcut}>9</span>
      </button>

      <button onClick={() => setActiveTool('eraser')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'eraser')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
        <span className={styles.shortcut}>0</span>
      </button>

      <div className={`${isVertical ? 'w-full h-px my-1' : 'w-px h-8 mx-1'} bg-zinc-200/70 shrink-0`} />

      <button onClick={() => setActiveTool('shapes')} className={`${btnSize} ${styles.btn}`} style={getBtnStyle(activeTool === 'shapes')}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l4 7H8z"/><rect x="4" y="14" width="6" height="6" rx="1"/><circle cx="17" cy="17" r="3"/>
        </svg>
      </button>

      {/* ── Resize Handle ── */}
      <div 
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
        onLostPointerCapture={() => { resizing.current = false }}
        className="absolute bottom-1 right-1 w-3 h-3 cursor-nwse-resize opacity-20 hover:opacity-100 transition-opacity"
        style={{ color: accent }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15l-6 6"/><path d="M21 8l-13 13"/>
        </svg>
      </div>
    </div>
  )
}
