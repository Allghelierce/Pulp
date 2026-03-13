"use client"

const btnBase = "w-7 h-7 rounded-[4px] flex items-center justify-center transition-colors hover:bg-zinc-200"

interface FormattingToolbarProps {
  accent: string
  execCmd: (cmd: string, value?: string) => void
  saveSelection: () => void
  toggleScript: (cmd: "superscript" | "subscript") => void
  insertHTML: (html: string) => void
  openAlert: (title: string, message?: string) => void
  downloadNote: () => void
  editorRef: React.RefObject<HTMLDivElement | null>
}

export function FormattingToolbar({
  accent, execCmd, saveSelection, toggleScript, insertHTML, openAlert, downloadNote, editorRef,
}: FormattingToolbarProps) {
  return (
    <div className="ls-toolbar h-14 bg-white border-b border-zinc-200/80 flex items-center pl-10 pr-3 z-30 shrink-0 overflow-x-auto gap-0.5 justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
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

        {/* Indent */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-zinc-200">
          <button onMouseDown={e=>{e.preventDefault();execCmd("outdent")}} className={`${btnBase} text-sm`} title="Outdent">⇤</button>
          <button onMouseDown={e=>{e.preventDefault();execCmd("indent")}} className={`${btnBase} text-sm`} title="Indent">⇥</button>
        </div>

        {/* Blocks */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-zinc-200">
          <button onMouseDown={e=>{e.preventDefault();insertHTML(`<blockquote style="border-left:4px solid ${accent};padding:8px 16px;margin:8px 0;color:#888;font-style:italic;background:#f7f0f2;border-radius:0 8px 8px 0">Quote…</blockquote><br/>`)}} className={`${btnBase} text-base`} title="Blockquote">❝</button>
          <button onMouseDown={e=>{e.preventDefault();insertHTML('<hr style="border:none;border-top:2px solid #ddd;margin:16px 0"/><br/>')}} className={`${btnBase} font-bold text-xs`} title="Divider">—</button>
        </div>

      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 shrink-0 pl-2">
        <button onMouseDown={e=>{e.preventDefault();openAlert("Full Access","Subscription options coming soon!")}} className="h-7 px-4 rounded-[5px] text-[13px] font-bold tracking-wide text-[#3B4A3E] bg-[#E4E9E0] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-[#A1B3A5]/60 hover:shadow hover:-translate-y-[0.5px] hover:bg-[#D4DBCF] active:translate-y-[0px] mr-10" style={{ fontFamily: '"EB Garamond", serif' }} title="Upgrade to Full Access">+ Full Access</button>
        <button onMouseDown={e=>{e.preventDefault();openAlert("Share note","Sharing is coming soon!")}} className="h-8 px-4 rounded-[5px] text-[12px] font-semibold text-white bg-blue-600/90 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow hover:bg-blue-600 hover:-translate-y-[0.5px] active:translate-y-[0px]" title="Share">Share</button>
        <button onMouseDown={e=>{e.preventDefault();downloadNote()}} className="h-8 px-4 rounded-[5px] text-[12px] font-semibold text-white bg-blue-600/90 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow hover:bg-blue-600 hover:-translate-y-[0.5px] active:translate-y-[0px]" title="Download note">Save</button>
      </div>
    </div>
  )
}
