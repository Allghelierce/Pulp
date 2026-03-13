"use client"

interface RightToolbarProps {
  theme: "light" | "dark"
  accent: string
  gridView: boolean
  sketchMode: boolean
  rightSidebarOpen: boolean
  currentPageIdx: number
  setRightSidebarOpen: (fn: (v: boolean) => boolean) => void
  setGridView: (fn: (v: boolean) => boolean) => void
  setCarouselIdx: (idx: number) => void
  setSketchMode: (v: boolean) => void
  setBoxMode: (v: boolean) => void
  setSketchPrompt: (v: string) => void
  openAlert: (title: string, message?: string) => void
  clearPage: () => void
}

export function RightToolbar({
  theme, accent, gridView, sketchMode, rightSidebarOpen, currentPageIdx,
  setRightSidebarOpen, setGridView, setCarouselIdx,
  setSketchMode, setBoxMode, setSketchPrompt, openAlert, clearPage,
}: RightToolbarProps) {
  return (
    <div style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 40, display: "flex", alignItems: "center" }}>
      {/* Toggle arrow */}
      <button
        onClick={() => setRightSidebarOpen(v => !v)}
        style={{
          background: theme === "dark" ? "rgba(44,44,46,0.80)" : "rgba(215,215,220,0.80)",
          border: "none", cursor: "pointer", padding: "5px 3px",
          borderRadius: "6px 0 0 6px",
          color: theme === "dark" ? "#A1A1AA" : "#71717a",
          fontSize: 13, lineHeight: 1,
          boxShadow: "-1px 0 4px rgba(0,0,0,0.08)",
          backdropFilter: "blur(8px)",
        }}
      >
        {rightSidebarOpen ? "›" : "‹"}
      </button>

      {/* Panel */}
      <div style={{
        width: rightSidebarOpen ? 44 : 0,
        overflow: "hidden",
        transition: "width 0.25s ease",
      }}>
        <div style={{
          width: 44,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          padding: "12px 0",
          borderRadius: "0 8px 8px 0",
          background: theme === "dark"
            ? "linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px) 0 0/12px 12px, linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px) 0 0/12px 12px, rgba(38,38,40,0.82)"
            : "linear-gradient(rgba(0,0,0,0.022) 1px,transparent 1px) 0 0/12px 12px, linear-gradient(90deg,rgba(0,0,0,0.022) 1px,transparent 1px) 0 0/12px 12px, rgba(225,225,230,0.82)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
          backdropFilter: "blur(12px)",
        }}>
          {/* Grid */}
          <button
            onMouseDown={e => { e.preventDefault(); setCarouselIdx(currentPageIdx); setGridView(v => !v) }}
            title="Page grid"
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              ...(gridView ? { backgroundColor: accent, color: "white" } : { backgroundColor: theme === "dark" ? "#3A3A3C" : "#D0D0D4", color: theme === "dark" ? "#A1A1AA" : "#52525b" })
            }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.2"/><rect x="9" y="1" width="6" height="6" rx="1.2"/><rect x="1" y="9" width="6" height="6" rx="1.2"/><rect x="9" y="9" width="6" height="6" rx="1.2"/></svg>
            <span style={{ fontSize: 7, fontWeight: 600 }}>Grid</span>
          </button>

          {/* Sketch */}
          <button
            onMouseDown={e => {
              e.preventDefault()
              const selection = window.getSelection()?.toString()
              if (!selection) { openAlert("Select text first", "Highlight some text in the editor before drawing a sketch box."); return }
              setSketchPrompt(selection); setSketchMode(true); setBoxMode(true)
            }}
            title="AI Sketch"
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              ...(sketchMode ? { backgroundColor: accent, color: "white" } : { backgroundColor: theme === "dark" ? "#3A3A3C" : "#D0D0D4", color: theme === "dark" ? "#A1A1AA" : "#52525b" })
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            <span style={{ fontSize: 7, fontWeight: 600 }}>Sketch</span>
          </button>

          <div style={{ height: 4 }} />

          {/* Trash */}
          <button
            onMouseDown={e => { e.preventDefault(); clearPage() }}
            title="Clear page"
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              backgroundColor: "#FEE2E2", color: "#DC2626",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <span style={{ fontSize: 7, fontWeight: 600 }}>Clear</span>
          </button>
        </div>
      </div>
    </div>
  )
}
