import { memo } from "react"

const btnBase = "w-7 h-7 rounded-[4px] flex items-center justify-center transition-all hover:bg-zinc-200 hover:scale-[1.12] hover:-translate-y-[1px] active:scale-[0.94] active:translate-y-0"

interface FormattingToolbarProps {
  accent: string
  execCmd: (cmd: string, value?: string) => void
  saveSelection: () => void
  toggleScript: (cmd: "superscript" | "subscript") => void
  insertHTML: (html: string) => void
  openAlert: (title: string, message?: string) => void
  setBoxAlignment: (align: "left" | "center" | "right") => void
  // Using a ref so this component NEVER re-renders when selection changes
  selectedBoxIdsRef: React.RefObject<Set<string>>
  editorRef: React.RefObject<HTMLDivElement | null>
}

export const FormattingToolbar = memo(function FormattingToolbar({
  accent, execCmd, saveSelection, toggleScript, insertHTML, openAlert, setBoxAlignment, selectedBoxIdsRef, editorRef,
}: FormattingToolbarProps) {
  // Read from ref at click time — this fn is never used in render so no re-render happens
  const hasBoxes = () => (selectedBoxIdsRef.current?.size ?? 0) > 0
  return (
    <div className="ls-toolbar h-14 bg-white border-b border-zinc-200/80 flex items-center pl-10 pr-3 z-30 shrink-0 overflow-x-auto gap-0.5 justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)]" style={{ transform: "translateZ(0)" }}>
      <div className="flex items-center gap-0.5">

        {/* Text style */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-zinc-200">
          <button onMouseDown={e=>{e.preventDefault();execCmd("bold")}} className={`${btnBase} font-bold text-[13px]`} title="Bold">B</button>
          <button onMouseDown={e=>{e.preventDefault();execCmd("italic")}} className={`${btnBase} italic font-serif text-[14px]`} title="Italic">I</button>
          <button onMouseDown={e=>{e.preventDefault();execCmd("underline")}} className={`${btnBase} underline text-[13px]`} title="Underline">U</button>
          <button onMouseDown={e=>{e.preventDefault();execCmd("strikeThrough")}} className={`${btnBase} line-through text-[13px]`} title="Strikethrough">S</button>
        </div>

        {/* Color */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-zinc-200">
          <div className="relative" title="Text color">
            <input type="color" onMouseDown={saveSelection} onInput={e => execCmd("foreColor", (e.target as HTMLInputElement).value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            <div className={`${btnBase} text-[11px] font-bold pointer-events-none`}>A</div>
          </div>
          <button
            onMouseDown={e=>{
              e.preventDefault()
              const sel = window.getSelection()
              let highlighted = false
              if (sel && sel.rangeCount > 0) {
                const node = sel.getRangeAt(0).startContainer
                const el: HTMLElement | null = node.nodeType === 3
                  ? (node as Text).parentElement
                  : node as HTMLElement
                const bg = el?.style?.backgroundColor ?? ""
                highlighted = bg !== "" && bg !== "transparent"
              }
              document.execCommand("hiliteColor", false, highlighted ? "transparent" : "#fef08a")
              saveSelection()
              editorRef.current?.focus()
            }}
            className={`${btnBase} text-[10px] font-bold`}
            style={{ backgroundColor: "#fef08a" }}
            title="Highlight (click again to remove)"
          >H</button>
        </div>

        {/* Super/sub */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-zinc-200">
          <button onMouseDown={e=>{e.preventDefault();toggleScript("superscript")}} className={`${btnBase} text-[10px]`} title="Superscript">x²</button>
          <button onMouseDown={e=>{e.preventDefault();toggleScript("subscript")}} className={`${btnBase} text-[10px]`} title="Subscript">x₂</button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-zinc-200">
          <button onMouseDown={e=>{e.preventDefault();execCmd("insertUnorderedList")}} className={`${btnBase} text-base leading-none`} title="Bullet list">•≡</button>
          <button onMouseDown={e=>{e.preventDefault();execCmd("insertOrderedList")}} className={`${btnBase} text-[10px]`} title="Numbered list">1≡</button>
          <button onMouseDown={e=>{e.preventDefault();insertHTML(`<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><input type="checkbox" style="width:15px;height:15px;accent-color:${accent}"/><span>Task</span></div><br/>`)}} className={`${btnBase} text-sm`} title="Checklist">☑</button>
        </div>

        {/* Indent & Align */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-zinc-200">
          <button onMouseDown={e=>{e.preventDefault();execCmd("outdent")}} className={`${btnBase} text-sm`} title="Outdent">⇤</button>
          <button onMouseDown={e=>{e.preventDefault();execCmd("indent")}} className={`${btnBase} text-sm`} title="Indent">⇥</button>
          <div className="w-[1px] h-4 bg-zinc-200 mx-1"></div>
          <button onMouseDown={e=>{e.preventDefault(); hasBoxes() ? setBoxAlignment("left") : execCmd("justifyLeft")}} className={`${btnBase} text-xs`} title="Align Left">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm0 4h8v2H2V7zm0 4h12v2H2v-2z"/></svg>
          </button>
          <button onMouseDown={e=>{e.preventDefault(); hasBoxes() ? setBoxAlignment("center") : execCmd("justifyCenter")}} className={`${btnBase} text-xs`} title="Align Center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm2 4h8v2H4V7zm-2 4h12v2H2v-2z"/></svg>
          </button>
          <button onMouseDown={e=>{e.preventDefault(); hasBoxes() ? setBoxAlignment("right") : execCmd("justifyRight")}} className={`${btnBase} text-xs`} title="Align Right">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2V3zm4 4h8v2H6V7zm-4 4h12v2H2v-2z"/></svg>
          </button>
        </div>

        {/* Blocks */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-zinc-200">
          <button onMouseDown={e=>{e.preventDefault();insertHTML(`<blockquote style="border-left:4px solid ${accent};padding:8px 16px;margin:8px 0;color:#888;font-style:italic;background:#f7f0f2;border-radius:0 8px 8px 0">Quote…</blockquote><br/>`)}} className={`${btnBase} text-base`} title="Blockquote">❝</button>
          <button onMouseDown={e=>{e.preventDefault();insertHTML('<hr style="border:none;border-top:2px solid #ddd;margin:16px 0"/><br/>')}} className={`${btnBase} font-bold text-xs`} title="Divider">—</button>
        </div>

      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 shrink-0 pl-2 pr-1" style={{ fontFamily: 'Georgia, serif' }}>
        

        {/* Share Button */}
        <button onClick={()=>openAlert("Share note","Sharing is coming soon!")} className="flex items-center h-[30px] px-3 rounded-[6px] text-[13.5px] font-normal tracking-wide text-[#6b6b72] bg-transparent border border-[#e4e4e7]/60 transition-all hover:bg-[#f9f9f9] hover:border-[#d4d4d8] hover:text-zinc-700 hover:scale-[1.07] hover:-translate-y-[1px] active:scale-[0.96]" title="Share note">
          <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="#b85e22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          Share
        </button>
      </div>
    </div>
  )
})
