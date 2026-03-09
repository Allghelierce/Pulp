"use client"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface TextBox { id: string; x: number; y: number; w: number; h: number; content: string }
type BoxesMap = { [pageIdx: number]: TextBox[] }
interface NoteData { 
  id: string; 
  subject: string; 
  pages: string[]; 
  folderId: number | null; 
  boxes: BoxesMap 
}
interface FolderData { id: number; name: string; open: boolean }

// ── Settings primitives ────────────────────────────────────────────────────

function SettingToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 ${checked ? "bg-zinc-800" : "bg-zinc-200"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  )
}

function SettingRow({ title, description, control }: { title: string; description?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-8 py-3.5 border-b border-zinc-100 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-zinc-800">{title}</p>
        {description && <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

function SettingSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      {title && <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{title}</p>}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden px-4">
        {children}
      </div>
    </div>
  )
}

// ── Settings tabs config (add new tabs here) ───────────────────────────────

const SETTINGS_TABS = [
  { id: "general",         label: "General",        group: "App"       },
  { id: "appearance",      label: "Appearance",     group: "App"       },
  { id: "editor",          label: "Editor",         group: "App"       },
  { id: "personalization", label: "Personalization",group: "Customize" },
] as const
type SettingsTabId = typeof SETTINGS_TABS[number]["id"]

const ACCENT_COLORS = [
  { hex: "#600b27", name: "Crimson"  },
  { hex: "#1e3a8a", name: "Cobalt"   },
  { hex: "#166534", name: "Forest"   },
  { hex: "#92400e", name: "Amber"    },
  { hex: "#4c1d95", name: "Violet"   },
  { hex: "#0f4c5c", name: "Teal"     },
  { hex: "#881337", name: "Rose"     },
  { hex: "#374151", name: "Slate"    },
]

// ── Main settings modal ────────────────────────────────────────────────────

function SettingsView({ user, onClose, accentColor, setAccentColor, theme, setTheme }: {
  user: any
  onClose: () => void
  accentColor: string
  setAccentColor: (color: string) => void
  theme: "light" | "dark"
  setTheme: (t: "light" | "dark") => void
}) {
  const [activeTab, setActiveTab]         = useState<SettingsTabId>("general")
  const [searchQuery, setSearchQuery]     = useState("")
  const [autoSave, setAutoSave]           = useState(true)
  const [reduceMotion, setReduceMotion]   = useState(false)
  const [sidebarOnStart, setSidebarOnStart] = useState(true)
  const [showBinding, setShowBinding]     = useState(true)
  const [spellCheck, setSpellCheck]       = useState(true)
  const [editorFont, setEditorFont]       = useState("Playfair Display")
  const [lineSpacing, setLineSpacing]     = useState("normal")
  const [paperStyle, setPaperStyle]       = useState<"lined" | "dotgrid" | "plain">("lined")

  const visibleGroups = searchQuery
    ? [{ name: "Results", tabs: SETTINGS_TABS.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())) }]
    : Array.from(new Set(SETTINGS_TABS.map(t => t.group))).map(g => ({
        name: g,
        tabs: SETTINGS_TABS.filter(t => t.group === g),
      }))

  const SegmentedControl = ({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) => (
    <div className="flex rounded-lg overflow-hidden border border-zinc-200 text-[11px] font-semibold">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`px-3 py-1.5 transition-all ${value === val ? "bg-zinc-800 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-[#F7F4F3] rounded-2xl shadow-2xl border border-zinc-200/80 flex overflow-hidden" style={{ height: 640 }}>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-zinc-200/80 hover:bg-zinc-300 text-zinc-500 hover:text-zinc-800 text-sm transition-colors"
        >&times;</button>

        {/* ── Sidebar ── */}
        <div className="w-52 bg-[#EDE9E7] border-r border-zinc-200/70 flex flex-col shrink-0">
          <div className="px-4 pt-5 pb-3 border-b border-zinc-200/70">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Settings</p>
            <input
              placeholder="Filter…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/80 border border-zinc-200 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:border-zinc-400 transition-colors"
            />
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-3">
            {visibleGroups.map(group => (
              <div key={group.name}>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-1">{group.name}</p>
                {group.tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as SettingsTabId); setSearchQuery("") }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-zinc-200/70">
            <p className="text-[9px] text-zinc-400">Letter Soup · v1.0.0</p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 py-4 border-b border-zinc-200/70 shrink-0">
            <h2 className="text-[15px] font-semibold text-zinc-800">
              {SETTINGS_TABS.find(t => t.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">

            {/* ── General ── */}
            {activeTab === "general" && (<>
              <SettingSection title="Account">
                <div className="flex items-center gap-3 py-4 border-b border-zinc-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg,${accentColor}cc,${accentColor})` }}>
                    {user?.email?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-zinc-800 truncate">{user?.email ?? "Not signed in"}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Free Plan</p>
                  </div>
                </div>
                <SettingRow
                  title="Sign out"
                  description="You'll need to sign back in to access your notes"
                  control={
                    <button
                      onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                      className="text-[11px] font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  }
                />
              </SettingSection>

              <SettingSection title="About">
                <SettingRow title="Version" control={<span className="text-[11px] font-mono text-zinc-400">1.0.0</span>} />
                <SettingRow title="Build" control={<span className="text-[11px] font-mono text-zinc-400">2026.03</span>} />
                <SettingRow
                  title="Check for updates"
                  control={
                    <button className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-400 px-3 py-1.5 rounded-lg transition-colors">
                      Check
                    </button>
                  }
                />
              </SettingSection>
            </>)}

            {/* ── Appearance ── */}
            {activeTab === "appearance" && (<>
              <SettingSection title="Theme">
                <SettingRow
                  title="Color scheme"
                  description="Choose how Letter Soup looks to you"
                  control={<SegmentedControl options={[["light","Light"],["dark","Dark"]]} value={theme} onChange={v => setTheme(v as "light" | "dark")} />}
                />
                <SettingRow
                  title="Reduce motion"
                  description="Minimize animations and transitions across the app"
                  control={<SettingToggle checked={reduceMotion} onChange={setReduceMotion} />}
                />
              </SettingSection>
              <SettingSection title="Layout">
                <SettingRow
                  title="Show sidebar on launch"
                  description="Keep the notes panel open when you start the app"
                  control={<SettingToggle checked={sidebarOnStart} onChange={setSidebarOnStart} />}
                />
              </SettingSection>
            </>)}

            {/* ── Editor ── */}
            {activeTab === "editor" && (<>
              <SettingSection title="Writing">
                <SettingRow
                  title="Auto-save"
                  description="Sync changes to the cloud every 2 seconds"
                  control={<SettingToggle checked={autoSave} onChange={setAutoSave} />}
                />
                <SettingRow
                  title="Spell check"
                  description="Underline possible misspellings while typing"
                  control={<SettingToggle checked={spellCheck} onChange={setSpellCheck} />}
                />
                <SettingRow
                  title="Default font"
                  control={
                    <select
                      value={editorFont}
                      onChange={e => setEditorFont(e.target.value)}
                      className="text-[11px] border border-zinc-200 rounded-lg px-2.5 py-1.5 outline-none bg-white focus:border-zinc-400 transition-colors"
                    >
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Original Surfer">Original Surfer</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Arial">Arial</option>
                    </select>
                  }
                />
                <SettingRow
                  title="Line spacing"
                  control={<SegmentedControl options={[["compact","Compact"],["normal","Normal"],["relaxed","Relaxed"]]} value={lineSpacing} onChange={setLineSpacing} />}
                />
              </SettingSection>
              <SettingSection title="Paper">
                <SettingRow
                  title="Page style"
                  description="Background ruling on your note pages"
                  control={<SegmentedControl options={[["lined","Lined"],["dotgrid","Dot Grid"],["plain","Plain"]]} value={paperStyle} onChange={v => setPaperStyle(v as typeof paperStyle)} />}
                />
                <SettingRow
                  title="Show spiral binding"
                  description="Display the decorative binding on the left edge"
                  control={<SettingToggle checked={showBinding} onChange={setShowBinding} />}
                />
              </SettingSection>
            </>)}

            {/* ── Personalization ── */}
            {activeTab === "personalization" && (<>
              <SettingSection title="Accent Color">
                <div className="py-4 flex flex-wrap gap-4">
                  {ACCENT_COLORS.map(({ hex, name }) => (
                    <button
                      key={hex}
                      onClick={() => setAccentColor(hex + "79")}
                      title={name}
                      className="group flex flex-col items-center gap-1.5"
                    >
                      <div
                        className="w-9 h-9 rounded-full border-[3px] transition-transform hover:scale-110 shadow-sm"
                        style={{ backgroundColor: hex, borderColor: accentColor.startsWith(hex) ? "#1a1a1a" : "transparent" }}
                      />
                      <span className="text-[9px] text-zinc-400 group-hover:text-zinc-600 transition-colors">{name}</span>
                    </button>
                  ))}
                </div>
              </SettingSection>
            </>)}

          </div>
        </div>
      </div>
    </div>
  )
}

function TablePicker({ onSelect }: { onSelect: (rows: number, cols: number) => void }) {
  const [hover, setHover] = useState({ r: 0, c: 0 })
  const MAX = 8
  return (
    <div>
      <p className="text-[11px] font-medium text-zinc-500 mb-2.5 text-center">
        {hover.r > 0 && hover.c > 0 ? `${hover.c} × ${hover.r} table` : "Insert table"}
      </p>
      <div onMouseLeave={() => setHover({ r: 0, c: 0 })}>
        {Array.from({ length: MAX }, (_, r) => (
          <div key={r} className="flex gap-[3px] mb-[3px]">
            {Array.from({ length: MAX }, (_, c) => (
              <div
                key={c}
                onMouseEnter={() => setHover({ r: r + 1, c: c + 1 })}
                onMouseDown={(e) => { e.preventDefault(); onSelect(r + 1, c + 1) }}
                className={`w-[17px] h-[17px] border rounded-[2px] cursor-pointer transition-colors ${
                  r < hover.r && c < hover.c
                    ? "bg-blue-100 border-blue-400"
                    : "bg-zinc-50 border-zinc-300 hover:bg-zinc-100"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ColumnPicker({ onSelect }: { onSelect: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div>
      <p className="text-[11px] font-medium text-zinc-500 mb-2.5 text-center">Insert columns</p>
      <div className="flex gap-2">
        {[1, 2, 3].map(n => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onMouseDown={e => { e.preventDefault(); onSelect(n) }}
            className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${hovered === n ? "bg-blue-50" : "hover:bg-zinc-50"}`}
          >
            <div className="flex gap-[3px] h-9 w-11">
              {Array.from({ length: n }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-[2px] border transition-colors ${hovered === n ? "border-blue-400 bg-blue-100" : "border-zinc-300 bg-zinc-100"}`}
                />
              ))}
            </div>
            <span className={`text-[10px] font-medium transition-colors ${hovered === n ? "text-blue-600" : "text-zinc-400"}`}>
              {n === 1 ? "One" : n === 2 ? "Two" : "Three"}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ItemMenu({ actions }: { actions: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-zinc-400 hover:text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >⋮</button>
      {open && (
        <div className="absolute right-0 top-6 bg-[#1f1f1f] border border-white/10 rounded-lg shadow-xl z-50 py-1 min-w-[120px]">
          {actions.map(a => (
            <button
              key={a.label}
              onClick={e => { e.stopPropagation(); a.onClick(); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/10 transition-colors ${a.danger ? "text-red-400" : "text-zinc-300"}`}
            >{a.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}



const START_ID = "00000000-0000-0000-0000-000000000001"

export default function NoteApp() {
  const uid = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const [notes, setNotes] = useState<NoteData[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [accent, setAccent] = useState("#600b2779")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [folders, setFolders] = useState<FolderData[]>([])
  const [isLoading, setIsLoading] = useState(true) // Add this
  const [activeTabId, setActiveTabId] = useState<string | null>(null) // Start null
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [zoom, setZoom] = useState("0.9")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [gridView, setGridView] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<number | null>(null)
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)
  const [boxMode, setBoxMode] = useState(false)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [draftBox, setDraftBox] = useState<TextBox | null>(null)
  const [draggingBox, setDraggingBox] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const [customSize, setCustomSize] = useState("16")
  // 1. Add these two states near the other useState declarations
  const [sketchMode, setSketchMode] = useState(false)
  const [sketchPrompt, setSketchPrompt] = useState("")
  const [loadingBoxId, setLoadingBoxId] = useState<string | null>(null)
  // 2. Refactor generateSketch
const generateSketch = async (prompt: string, boxId: string) => {
  if (!prompt.trim() || !activeTabId) return;

  setLoadingBoxId(boxId);

  try {
    const res = await fetch("/api/sketch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (!data.url) {
      console.warn("No image URL returned from /api/sketch", data);
      return;
    }

    // Update using functional updater → safer with async
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === activeTabId
          ? {
              ...note,
              boxes: {
                ...note.boxes,
                [currentPageIdx]: (note.boxes[currentPageIdx] || []).map(box =>
                  box.id === boxId ? { ...box, content: data.url } : box
                )
              }
            }
          : note
      )
    );
  } catch (err) {
    console.error("Sketch generation failed:", err);
    // Optional: show toast / mark box as failed
  } finally {
    setLoadingBoxId(null);
  }
};


  const editorRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const activeNote = (notes.find(n => n.id === activeTabId) ?? notes[0]) as NoteData

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 1. Check if someone is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })


    // 2. Listen for changes (using 'any' to stop the red lines)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: any) => {
      setUser(session?.user ?? null)
    })


    return () => subscription.unsubscribe()
  }, [])


  useEffect(() => {
    const saveToCloud = async () => {
      if (isLoading || !activeNote || !user) return
      if (!activeNote || !user) return // Don't save if no one is logged in!


      const { error } = await supabase
        .from('notes')
        .upsert({
          id: activeNote.id,
          subject: activeNote.subject,
          pages: activeNote.pages,
          boxes: activeNote.boxes,
          folder_id: activeNote.folderId,  // add this
          user_id: user.id // Uses the ID from the ✅ checkmark
        })


      if (error) console.error("Save failed:", error.message)
      else console.log("Autosaved to cloud!")
    }


    const timer = setTimeout(saveToCloud, 2000)
    return () => clearTimeout(timer)
  }, [activeNote, user]) // Critical: user must be here!


  useEffect(() => {
    if (!activeNote) return
    if (!gridView && editorRef.current &&
        editorRef.current.innerHTML !== activeNote.pages[currentPageIdx]) {
      editorRef.current.innerHTML = activeNote.pages[currentPageIdx] || ""
    }
  }, [activeTabId, currentPageIdx, gridView, activeNote])


  useEffect(() => {
      const fetchNotes = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', currentUser.id)

        if (!error && data && data.length > 0) {
          setNotes(data.map(n => ({
            id: n.id,
            subject: n.subject,
            pages: n.pages ?? [""],
            boxes: n.boxes ?? {},
            folderId: n.folder_id ?? null,   // ← this is the key fix
          })))
          setActiveTabId(data[0].id)
        } else {
          setNotes([])
          setActiveTabId(null)
        }
        setIsLoading(false)
      }

      fetchNotes()
    }, [user])


  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange()
  }


  const restoreSelection = () => {
    editorRef.current?.focus()
    const sel = window.getSelection()
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current) }
  }


  const execCmd = (cmd: string, value?: string) => {
    restoreSelection()
    document.execCommand(cmd, false, value)
    saveSelection()
    editorRef.current?.focus()
  }


  const insertHTML = (html: string) => {
    restoreSelection()
    document.execCommand("insertHTML", false, html)
    saveSelection()
    editorRef.current?.focus()
  }


  const applyFontSize = (sizePx: string) => {
    if (!sizePx || isNaN(Number(sizePx))) return
    restoreSelection()

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) { editorRef.current?.focus(); return }

    const range = sel.getRangeAt(0)
    if (range.collapsed) { editorRef.current?.focus(); return }

    // Extract selected content, wrap in a new span, strip nested font-size overrides,
    // then re-insert and re-select — same pattern as Google Docs
    const span = document.createElement("span")
    span.style.fontSize = sizePx + "px"
    const fragment = range.extractContents()
    // Strip any existing font-size styles from moved nodes so the outer span wins
    const tmp = document.createElement("div")
    tmp.appendChild(fragment)
    tmp.querySelectorAll<HTMLElement>("[style]").forEach(el => el.style.removeProperty("font-size"))
    // Also unwrap any empty font-size-only spans left behind
    tmp.querySelectorAll<HTMLElement>("span").forEach(el => {
      if (!el.getAttribute("style") && el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE) {
        el.replaceWith(el.firstChild)
      }
    })
    while (tmp.firstChild) span.appendChild(tmp.firstChild)

    range.insertNode(span)

    // Re-select the span contents so the selection stays visible (like Google Docs)
    const newRange = document.createRange()
    newRange.selectNodeContents(span)
    sel.removeAllRanges()
    sel.addRange(newRange)
    savedRange.current = newRange.cloneRange()

    editorRef.current?.focus()
  }


  const applyBlockStyle = (tag: string) => {
    restoreSelection()

    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) { editorRef.current?.focus(); return }

    // Find the nearest block-level ancestor of the cursor
    const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "DIV", "BLOCKQUOTE", "PRE", "LI"])
    let block: HTMLElement | null = null
    let node: Node | null = sel.getRangeAt(0).commonAncestorContainer
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode
    while (node && node !== editorRef.current) {
      if (BLOCK_TAGS.has((node as HTMLElement).tagName)) { block = node as HTMLElement; break }
      node = node.parentNode
    }

    if (!block) { editorRef.current?.focus(); return }

    // Replace the block element with the new tag in-place
    const newEl = document.createElement(tag)
    newEl.innerHTML = block.innerHTML
    // Strip any old heading-related inline styles from children
    newEl.querySelectorAll<HTMLElement>("[style]").forEach(el => {
      el.style.removeProperty("font-size")
      el.style.removeProperty("font-weight")
    })
    // Apply block-level visual styles (needed because Tailwind resets heading defaults)
    const styles: Record<string, { fontSize: string; fontWeight: string; margin: string }> = {
      h1: { fontSize: "2em",    fontWeight: "700", margin: "0.4em 0" },
      h2: { fontSize: "1.5em",  fontWeight: "700", margin: "0.4em 0" },
      h3: { fontSize: "1.17em", fontWeight: "700", margin: "0.4em 0" },
      p:  { fontSize: "",       fontWeight: "",    margin: "" },
    }
    if (styles[tag]) {
      const s = styles[tag]
      newEl.style.fontSize   = s.fontSize
      newEl.style.fontWeight = s.fontWeight
      newEl.style.margin     = s.margin
    }

    block.parentNode?.replaceChild(newEl, block)

    // Re-select the full content of the new element (keeps text highlighted like Google Docs)
    const newRange = document.createRange()
    newRange.selectNodeContents(newEl)
    sel.removeAllRanges()
    sel.addRange(newRange)
    savedRange.current = newRange.cloneRange()

    editorRef.current?.focus()
  }


  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)

    // Find if cursor is inside a blockquote
    let blockquote: HTMLElement | null = null
    let n: Node | null = range.startContainer
    while (n && n !== editorRef.current) {
      if ((n as HTMLElement).tagName === "BLOCKQUOTE") { blockquote = n as HTMLElement; break }
      n = n.parentNode
    }

    if (blockquote) {
      if (e.key === "Enter") {
        // Stay inside the quote box on Enter instead of breaking out
        e.preventDefault()
        document.execCommand("insertHTML", false, "<br>")
        return
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        // If blockquote is effectively empty, remove it cleanly to avoid
        // the browser merging it and leaving residual background-color on text
        const text = (blockquote.textContent ?? "").replace(/\u00a0/g, "").trim()
        if (text === "") {
          e.preventDefault()
          const afterNode = blockquote.nextSibling
          blockquote.remove()
          const newRange = document.createRange()
          if (afterNode) { newRange.setStart(afterNode, 0) }
          else if (editorRef.current) { newRange.setStart(editorRef.current, editorRef.current.childNodes.length) }
          newRange.collapse(true)
          sel.removeAllRanges()
          sel.addRange(newRange)
          return
        }
      }
    }

    // Space → list autocomplete
    if (e.key !== " ") return
    const node = range.startContainer
    if (node.nodeType !== Node.TEXT_NODE) return
    const before = (node.textContent ?? "").slice(0, range.startOffset)
    const tryConvert = (cmd: string) => {
      e.preventDefault()
      const del = document.createRange()
      del.setStart(node, 0); del.setEnd(node, range.startOffset)
      sel.removeAllRanges(); sel.addRange(del)
      document.execCommand("delete", false)
      document.execCommand(cmd, false)
    }
    if (before === "*") tryConvert("insertUnorderedList")
    else if (/^\d+\.$/.test(before)) tryConvert("insertOrderedList")
  }


  const insertTable = (rows: number, cols: number) => {
    let html = `<table style="border-collapse:collapse;width:100%;margin:16px 0">`
    for (let r = 0; r < rows; r++) {
      html += `<tr>`
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? "th" : "td"
        const style = `border:1px solid #a1a1aa;padding:8px 12px;text-align:left;${r === 0 ? "background:#f9fafb;font-weight:bold;" : ""}`
        html += `<${tag} style="${style}">${r === 0 ? `Col ${c + 1}` : ""}</${tag}>`
      }
      html += `</tr>`
    }
    html += `</table><br/>`
    setShowTableMenu(false)
    insertHTML(html)
  }


  const insertColumns = (num: number) => {
    let html = `<div style="display:grid;grid-template-columns:repeat(${num},1fr);gap:16px;margin:16px 0">`
    for (let i = 0; i < num; i++) html += `<div style="border:1px dashed #e4e4e7;padding:12px;min-height:80px;">Column ${i + 1} content…</div>`
    html += `</div><br/>`
    insertHTML(html)
  }


  const getPaperXY = (e: React.MouseEvent): { x: number; y: number } => {
    const r = paperRef.current!.getBoundingClientRect()
    const s = parseFloat(zoom)
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }
  }


  const onPaperMouseDown = (e: React.MouseEvent) => {
    if (!boxMode) return
    e.preventDefault()
    const { x, y } = getPaperXY(e)
    setDrawStart({ x, y })
  setDraftBox({ id: uid(), x, y, w: 0, h: 0, content: "" })
    setSelectedBoxId(null)
  }


  const onPaperMouseMove=(e:React.MouseEvent)=>{
    if(draggingBox){
      const {x,y}=getPaperXY(e)
      const b={...activeNote.boxes}
      b[currentPageIdx]=b[currentPageIdx].map(bb=>bb.id===draggingBox.id?{...bb,x:x-draggingBox.offsetX,y:y-draggingBox.offsetY}:bb)
      setNotes(notes.map(n=>n.id===activeTabId?{...n,boxes:b}:n))
      return
    }
    if(!boxMode||!drawStart)return
    const {x,y}=getPaperXY(e)
    setDraftBox({id:draftBox?.id??uid(), x:drawStart.x, y:drawStart.y, w:x-drawStart.x, h:y-drawStart.y, content:""})
  }


  // 4. Replace onPaperMouseUp

 const onPaperMouseUp = () => {
  if (draggingBox) { setDraggingBox(null); return }
  if (!boxMode || !draftBox) return
  if (Math.abs(draftBox.w) > 15 && Math.abs(draftBox.h) > 15) {
    const committed = { ...draftBox, id: uid() }
    const b = { ...activeNote.boxes }
    if (!b[currentPageIdx]) b[currentPageIdx] = []
    b[currentPageIdx] = [...b[currentPageIdx], committed]
    setNotes(notes.map(n => n.id === activeTabId ? { ...n, boxes: b } : n))
    setSelectedBoxId(committed.id)

if (sketchMode) {
  const newBoxId = committed.id;           // fresh id
  setSelectedBoxId(newBoxId);

    // Give React one render cycle to include the new box in state
    requestAnimationFrame(() => {
      generateSketch(sketchPrompt, newBoxId);
    });

    setSketchMode(false);
    setBoxMode(false);
    setSketchPrompt("");   // optional cleanup
  }
    }
    setDrawStart(null)
    setDraftBox(null)
  }


  const deleteBox = (boxId: string) => {
    const updatedBoxes = { ...activeNote.boxes }
    updatedBoxes[currentPageIdx] = updatedBoxes[currentPageIdx].filter(b => b.id !== boxId)
    setNotes(notes.map(n => n.id === activeTabId ? { ...n, boxes: updatedBoxes } : n))
    setSelectedBoxId(null)
  }


  const updateBoxContent = (boxId: string, text: string) => {
    const updatedBoxes = { ...activeNote.boxes }
    updatedBoxes[currentPageIdx] = updatedBoxes[currentPageIdx].map(b => b.id === boxId ? { ...b, content: text } : b)
    setNotes(notes.map(n => n.id === activeTabId ? { ...n, boxes: updatedBoxes } : n))
  }


  const onBoxMouseDown = (e: React.MouseEvent<HTMLDivElement>, box: TextBox) => {
    // 1. If clicking delete button, exit
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    // 2. If clicking the RESIZE HANDLE (bottom-right 20px), don't start a drag
    const rect = e.currentTarget.getBoundingClientRect();
    const isResizeZone = (e.clientX > rect.right - 20) && (e.clientY > rect.bottom - 20);
    if (isResizeZone) return;

    e.stopPropagation();
    setSelectedBoxId(box.id);
    e.currentTarget.focus();

    // 3. Start drag only if in boxMode OR clicking the container border
    if (boxMode || e.target === e.currentTarget) {
      const { x, y } = getPaperXY(e);
      setDraggingBox({ id: box.id, offsetX: x - box.x, offsetY: y - box.y });
    }
  };


  const handleDropNote = (e: React.DragEvent, targetFolderId: number | null, targetNoteId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedNoteId || draggedNoteId === targetNoteId) return
    setNotes(prev => {
      const copy = [...prev]
      const draggedIdx = copy.findIndex(n => n.id === draggedNoteId)
      if (draggedIdx === -1) return prev
      const draggedNote = { ...copy[draggedIdx], folderId: targetFolderId }
      copy.splice(draggedIdx, 1)
      if (targetNoteId) {
        const targetIdx = copy.findIndex(n => n.id === targetNoteId)
        copy.splice(targetIdx, 0, draggedNote)
      } else copy.push(draggedNote)
      return copy
    })
    setDraggedNoteId(null)
  }


  const addNote = (folderId: number | null = null) => {
    const name = prompt("Name your new note:", "New Note")
    if (!name) return

    const id = uid() // ← was broken Math.random() hack

    

    setNotes(prev => [...prev, { id, subject: name, pages: [""], folderId, boxes: {} }])
    setActiveTabId(id)
    setCurrentPageIdx(0)
  }

  const clearPage = () => {
  if (!confirm("Clear everything on this page? This cannot be undone.")) return;

  // 1. Clear the Main Text Editor
  if (editorRef.current) editorRef.current.innerHTML = "";

  // 2. Clear the Boxes and the Text Content in State
  setNotes(prev => prev.map(n => {
    if (n.id !== activeTabId) return n;
    
    // Clear the specific page string
    const newPages = [...n.pages];
    newPages[currentPageIdx] = "";

    // Clear the boxes for this specific page
    const newBoxes = { ...n.boxes };
    newBoxes[currentPageIdx] = [];

    return { ...n, pages: newPages, boxes: newBoxes };
  }));
};


  const renameNote = (id: string, currentName: string) => {
    const newName = prompt("Rename note:", currentName)
    if (newName) setNotes(prev => prev.map(n => n.id === id ? { ...n, subject: newName } : n))
  }

    const deleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeTabId === id) setActiveTabId(notes.find(n => n.id !== id)?.id ?? null)
    if (user) await supabase.from('notes').delete().eq('id', id)
  }

  const deleteFolder = (id: number) => {
    if (!confirm("Delete folder? Notes inside will move to root.")) return
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n))
    setFolders(prev => prev.filter(f => f.id !== id))
  }


  const addFolder = () => {
    const id = Date.now()
    setFolders(prev => [...prev, { id, name: "New Folder", open: true }])
    setRenamingFolder(id)
  }


  const toggleFolder = (id: number) => setFolders(prev => prev.map(f => f.id === id ? { ...f, open: !f.open } : f))
  const renameFolder = (id: number, name: string) => setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))


  const downloadNote = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${activeNote.subject}</title>
    <style>body{font-family:Georgia,serif;max-width:720px;margin:0 auto;padding:48px;color:#1a1a1a}
    h1{color:${accent};margin-bottom:32px}hr{border:none;border-top:1px solid #ddd;margin:32px 0}
    h3{color:${accent}88;font-size:12px;text-transform:uppercase;letter-spacing:.1em}</style>
    </head><body><h1>${activeNote.subject}</h1>
    ${activeNote.pages.map((p, i) => `<section><h3>Page ${i + 1}</h3><div>${p || "<em style='color:#bbb'>Empty page</em>"}</div></section>`).join("<hr/>")}</body></html>`
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }))
    a.download = `${activeNote.subject.replace(/[^a-z0-9]/gi, "_")}.html`
    a.click()
  }


  const topLevelNotes = notes.filter(n => n.folderId === null)
  const notesInFolder = (fid: number) => notes.filter(n => n.folderId === fid)
  const btnBase = "w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-zinc-200"


      if (isLoading) {
      return (
        <div className="h-screen bg-[#110d0e] flex items-center justify-center text-white font-sans">
          <div className="animate-pulse text-xl">Loading Letter Soup...</div>
        </div>
      )
    }

  return (
    <div className="flex h-screen bg-[#F0ECEA] text-[#1A1A1A] overflow-hidden font-sans" onClick={() => { setShowTableMenu(false); setShowColumnMenu(false) }}>
      {showSettings && <SettingsView user={user} onClose={() => setShowSettings(false)} accentColor={accent} setAccentColor={setAccent} theme={theme} setTheme={setTheme} />}
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Bilbo&family=Licorice&family=Original+Surfer&display=swap');" }} />
      <div className={`${sidebarOpen ? "w-64" : "w-0"} bg-[#110d0e] text-white flex flex-col shrink-0 transition-all duration-300 overflow-hidden border-r border-white/5`}>
        <div className="p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 mb-5 cursor-default">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg,${accent}88,${accent})` }}>
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M4 22C4 22 10 6 24 6"/><path d="M18 13C24 13 24 23 18 23"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: '"Licorice", cursive' }}> Letter Soup </h1>
          </div>
          <input placeholder="Search…" className="w-full bg-zinc-900/60 border border-white/10 rounded-full px-3 py-1.5 text-xs outline-none focus:border-white/30 transition-colors" />
        </div>


    <div className="flex-1 overflow-y-auto overflow-x-visible p-3 space-y-0.5" onDragOver={e => e.preventDefault()} onDrop={e => handleDropNote(e, null)}>
        <>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 px-2">Binder</p>

          {topLevelNotes.map(n => (
            <div key={n.id}
              role="button"
              draggable
              onDragStart={() => setDraggedNoteId(n.id)}
              onDragEnd={() => setDraggedNoteId(null)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDropNote(e, null, n.id)}
              onClick={() => { setActiveTabId(n.id); setCurrentPageIdx(0) }}
              className={`group w-full text-left px-3 py-1.5 text-xs rounded-full transition-all flex items-center justify-between cursor-pointer ${draggedNoteId === n.id ? 'opacity-50' : ''}`}
              style={activeTabId === n.id ? { backgroundColor: accent, color: "white" } : { color: "#a1a1aa" }}
              onMouseEnter={e => { if (activeTabId !== n.id) (e.currentTarget as HTMLElement).style.backgroundColor = "#1f1f1f" }}
              onMouseLeave={e => { if (activeTabId !== n.id) (e.currentTarget as HTMLElement).style.backgroundColor = "" }}>
              <span>📄 {n.subject}</span>
              <ItemMenu actions={[
                { label: "Rename", onClick: () => renameNote(n.id, n.subject) },
                { label: "Delete 🗑️", onClick: () => deleteNote(n.id), danger: true },
              ]} />
            </div>
          ))}

          {folders.map(f => (
            <div key={f.id} onDragOver={e => e.preventDefault()} onDrop={e => handleDropNote(e, f.id)}>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-zinc-900/60 group" onClick={() => toggleFolder(f.id)}>
                <span className="text-[10px] text-zinc-600">{f.open ? "▾" : "▸"}</span>
                {renamingFolder === f.id ? (
                  <input autoFocus className="flex-1 bg-white/10 text-white text-xs rounded px-1.5 outline-none min-w-0" defaultValue={f.name} onBlur={e => { renameFolder(f.id, e.target.value); setRenamingFolder(null) }} onKeyDown={e => { if (e.key === "Enter") { renameFolder(f.id, (e.target as HTMLInputElement).value); setRenamingFolder(null) } }} onClick={e => e.stopPropagation()} />
                ) : (
                  <span className="flex-1 text-xs text-zinc-300 truncate">📁 {f.name}</span>
                )}
                <ItemMenu actions={[
                  { label: "Rename", onClick: () => setRenamingFolder(f.id) },
                  { label: "Delete 🗑️", onClick: () => deleteFolder(f.id), danger: true },
                ]} />
              </div>
              {f.open && (
                <div className="pl-5 space-y-0.5">
                  {notesInFolder(f.id).map(n => (
                    <div key={n.id}
                      role="button"
                      draggable
                      onDragStart={() => setDraggedNoteId(n.id)}
                      onDragEnd={() => setDraggedNoteId(null)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDropNote(e, f.id, n.id)}
                      onClick={() => { setActiveTabId(n.id); setCurrentPageIdx(0) }}
                      className={`group w-full text-left px-3 py-1 text-[11px] rounded-full transition-all flex items-center justify-between cursor-pointer ${draggedNoteId === n.id ? 'opacity-50' : ''}`}
                      style={activeTabId === n.id ? { backgroundColor: accent, color: "white" } : { color: "#71717a" }}>
                      <span>📄 {n.subject}</span>
                      <ItemMenu actions={[
                        { label: "Rename", onClick: () => renameNote(n.id, n.subject) },
                        { label: "Delete 🗑️", onClick: () => deleteNote(n.id), danger: true },
                      ]} />
                    </div>
                  ))}
                  <button onClick={() => addNote(f.id)} className="text-[11px] text-zinc-600 hover:text-white px-3 py-0.5 block">+ Note</button>
                </div>
              )}
            </div>
          ))}
        </>
    </div>


        <div className="border-t border-white/5 px-3 pt-2 pb-1 flex gap-1 shrink-0">
          <button onClick={() => addNote(null)} className="flex-1 text-center text-[11px] text-zinc-500 hover:text-white hover:bg-zinc-800 py-1.5 rounded transition-colors">+ Note</button>
          <button onClick={addFolder} className="flex-1 text-center text-[11px] text-zinc-500 hover:text-white hover:bg-zinc-800 py-1.5 rounded transition-colors">+ Folder</button>
        </div>
        <div className="border-t border-white/5 px-3 py-2 shrink-0">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors hover:bg-zinc-800/70 group">
            <span className="text-[13px] shrink-0">⚙️</span>
            <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 truncate min-w-0">{user?.email ?? "Settings"}</span>
          </button>
        </div>
      </div>


      <div className="flex-1 flex flex-col overflow-hidden relative">
        <button onClick={() => setSidebarOpen(v => !v)} className="absolute left-2 top-[54px] z-50 text-zinc-400 hover:text-zinc-700 transition-colors p-1 text-2xl leading-none">
          {sidebarOpen ? "‹" : "›"}
        </button>

      {notes.length > 0 && <>
        {/* ── Formatting toolbar ── */}
        <div className="h-10 bg-white border-b border-zinc-200/80 flex items-center pl-10 pr-3 z-30 shrink-0 overflow-x-auto gap-0.5 justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-0.5">

            {/* Text style */}
            <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-zinc-200">
              <button onMouseDown={e=>{e.preventDefault();execCmd("bold")}} className={`${btnBase} font-bold text-sm`} title="Bold">B</button>
              <button onMouseDown={e=>{e.preventDefault();execCmd("italic")}} className={`${btnBase} italic text-sm`} title="Italic">I</button>
              <button onMouseDown={e=>{e.preventDefault();execCmd("underline")}} className={`${btnBase} underline text-sm`} title="Underline">U</button>
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
                  // Don't restoreSelection — on mousedown the editor selection is still active.
                  // Check the actual DOM node's inline backgroundColor (reliable; queryCommandValue is not).
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
              <button onMouseDown={e=>{e.preventDefault();execCmd("superscript")}} className={`${btnBase} text-[10px]`} title="Superscript (click again to remove)">x²</button>
              <button onMouseDown={e=>{e.preventDefault();execCmd("subscript")}} className={`${btnBase} text-[10px]`} title="Subscript (click again to remove)">x₂</button>
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

            {/* Sketch */}
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                const selection = window.getSelection()?.toString()
                if (!selection) return alert("Highlight text first, then draw a box")
                setSketchPrompt(selection); setSketchMode(true); setBoxMode(true)
              }}
              className="h-7 px-2.5 rounded text-[10px] font-semibold border transition-colors shrink-0"
              style={sketchMode ? { backgroundColor: accent, color: "white", borderColor: accent } : { borderColor: "#e4e4e7", color: accent }}
              title="AI Sketch"
            >
              {sketchMode ? "Draw Box…" : "Sketch"}
            </button>
          </div>

          {/* Right: Grid + Save */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <button onMouseDown={e=>{e.preventDefault();setGridView(v=>!v)}} className="h-7 px-2.5 rounded text-[10px] font-semibold border transition-colors" style={gridView ? { backgroundColor: accent, color: "white", borderColor: accent } : { borderColor: "#e4e4e7", color: "#52525b" }} title="Page grid">Grid</button>
            <button onMouseDown={e=>{e.preventDefault();downloadNote()}} className="h-7 px-3 rounded text-[10px] font-semibold text-white transition-opacity hover:opacity-80" style={{ backgroundColor: accent }} title="Download note">Save</button>
          </div>
        </div>

        {/* ── Document toolbar ── */}
        <div className="h-10 bg-zinc-50 border-b border-zinc-200/80 flex items-center pl-10 pr-3 gap-2 z-20 shrink-0 overflow-x-auto justify-between">
          <div className="flex items-center gap-2">
            <select onMouseDown={saveSelection} onChange={e=>execCmd("fontName",e.target.value)} className="text-[11px] border border-zinc-200 rounded px-2 py-1 outline-none bg-white shrink-0 text-zinc-600">
              <option value="Original Surfer">Default</option>
              <option value="Fredoka">Bubbly</option>
              <option value="Georgia">Serif</option>
              <option value="Arial">Sans</option>
            </select>

            <div className="flex items-center gap-1 border-r border-zinc-200 pr-2 shrink-0">
              <select onMouseDown={saveSelection} defaultValue="" onChange={e=>{const v=e.target.value; if(v){setCustomSize(v);applyFontSize(v);e.target.value=""}}} className="text-[11px] border border-zinc-200 rounded px-2 py-1 outline-none bg-white text-zinc-600">
                <option value="" disabled>Size</option>
                {[8,10,11,12,14,16,18,20,24,28,32,36,48,64,72].map(s=><option key={s} value={String(s)}>{s}px</option>)}
              </select>
              <input type="number" min={1} max={400} value={customSize} onChange={e=>setCustomSize(e.target.value)} onMouseDown={saveSelection} onKeyDown={e=>{if(e.key==="Enter")applyFontSize(customSize)}} className="w-12 text-[11px] border border-zinc-200 rounded px-1.5 py-1 outline-none bg-white text-center text-zinc-600" />
            </div>

            <select onMouseDown={saveSelection} defaultValue="" onChange={e=>{const v=e.target.value; if(!v) return; applyBlockStyle(v); e.target.value=""}} className="text-[11px] border border-zinc-200 rounded px-2 py-1 outline-none bg-white shrink-0 text-zinc-600">
              <option value="" disabled>Style</option>
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>

            <div className="w-px h-5 bg-zinc-200 shrink-0" />

            {/* Table picker */}
            <div className="relative shrink-0">
              <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveSelection(); setShowTableMenu(v => !v); setShowColumnMenu(false) }} className="text-[11px] border border-zinc-200 rounded px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-600 whitespace-nowrap transition-colors">
                Table
              </button>
              {showTableMenu && (
                <div className="absolute top-8 left-0 bg-white border border-zinc-200 rounded-xl shadow-xl p-3 z-50" onClick={e => e.stopPropagation()}>
                  <TablePicker onSelect={(rows, cols) => { insertTable(rows, cols); setShowTableMenu(false) }} />
                </div>
              )}
            </div>

            {/* Column picker */}
            <div className="relative shrink-0">
              <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveSelection(); setShowColumnMenu(v => !v); setShowTableMenu(false) }} className="text-[11px] border border-zinc-200 rounded px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-600 whitespace-nowrap transition-colors">
                Columns
              </button>
              {showColumnMenu && (
                <div className="absolute top-8 left-0 bg-white border border-zinc-200 rounded-xl shadow-xl p-3 z-50" onClick={e => e.stopPropagation()}>
                  <ColumnPicker onSelect={n => { insertColumns(n); setShowColumnMenu(false) }} />
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-zinc-200 shrink-0" />

            <select value={zoom} onChange={e=>setZoom(e.target.value)} className="text-[11px] border border-zinc-200 rounded px-2 py-1 outline-none bg-white shrink-0 text-zinc-600">
              {["0.5","0.75","0.9","1.0","1.25","1.5"].map(v=><option key={v} value={v}>{Math.round(parseFloat(v)*100)}%</option>)}
            </select>
          </div>

          {/* Trash (right-aligned) */}
          <button
            onMouseDown={(e) => { e.preventDefault(); clearPage() }}
            className="h-7 w-7 flex items-center justify-center rounded border border-zinc-200 hover:border-red-200 hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
            title="Clear page"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </>}

          {notes.length === 0 ? (
            <main className="flex-1 flex items-center justify-center bg-[#EDE8E6]">
              <div className="text-center">
                <p
                  className="text-5xl font-bold mb-6"
                  style={{ fontFamily: '"Licorice", cursive', color: accent }}
                >
                  Ready?
                </p>
                <button
                  onClick={() => addNote(null)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white mx-auto transition-all hover:scale-110"
                  style={{ backgroundColor: accent }}
                >
                  +
                </button>
              </div>
            </main>
          ) : gridView ? (
          <main className="flex-1 overflow-auto p-8 bg-[#EDE8E6]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{color:accent}}>{activeNote.subject} — All Pages</h2>
              <button onClick={()=>setGridView(false)} className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">← Back</button>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {activeNote.pages.map((page,idx)=>(
                <div key={idx} onClick={()=>{setGridView(false);setCurrentPageIdx(idx)}} className="bg-white shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all border-t-[5px]" style={{borderTopColor:accent}}>
                  <div className="px-4 py-2 border-b border-zinc-100"><p className="text-[9px] font-bold uppercase tracking-widest" style={{color:accent}}>Page {idx+1}</p></div>
                  <div className="p-4 h-44 overflow-hidden text-[9px] text-zinc-500 leading-relaxed pointer-events-none [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6" dangerouslySetInnerHTML={{__html: page||"<em style='color:#ccc'>Empty</em>"}} />
                </div>
              ))}
              <div onClick={()=>{const np=[...activeNote.pages,""]; setNotes(prev=>prev.map(n=>n.id===activeTabId?{...n,pages:np}:n)); setGridView(false); setCurrentPageIdx(activeNote.pages.length)}} className="bg-white/40 border-2 border-dashed border-zinc-300 flex items-center justify-center h-[200px] cursor-pointer hover:border-zinc-400 hover:bg-white/60 transition-all">
                <span className="text-zinc-400 text-sm">+ New Page</span>
              </div>
            </div>
          </main>
        ) : (
          <main className="flex-1 overflow-auto p-8 flex justify-center bg-[#EDE8E6]">
            <div style={{transform:`scale(${zoom})`,transformOrigin:"top center"}} className="w-full max-w-5xl shrink-0">
              <div
                ref={paperRef}
                className="bg-white shadow-2xl relative"
                style={{
                  minHeight:"1300px",
                  cursor: boxMode ? "crosshair" : "default",
                  backgroundImage: `linear-gradient(transparent 31px, #e4e4e7 32px)`,
                  backgroundSize: `100% 32px`
                }}
                onMouseDown={onPaperMouseDown}
                onMouseMove={onPaperMouseMove}
                onMouseUp={onPaperMouseUp}
                onMouseLeave={onPaperMouseUp}
              >
                
{/* ── REALISTIC BRONZE SPIRAL BINDING ── */}
              <div className="absolute left-[-24px] top-0 bottom-0 w-16 z-30 pointer-events-none flex flex-col pt-[32px]">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="relative w-full h-[32px]">
                    
                    {/* 1. The Punched Hole: Styled to look like a physical cutout */}
                    <div className="absolute left-[34px] top-2 w-4 h-5 rounded-sm bg-[#d7d2d0] shadow-[inset_2px_3px_5px_rgba(0,0,0,0.6)] border border-zinc-200" />
                    
                    {/* 2. The Back Wire: Creates the illusion of the ring wrapping behind the paper */}
                    <div className="absolute left-[12px] top-[14px] w-[28px] h-[10px] border-b-[3px] border-[#8B6914] rounded-full opacity-40 blur-[0.5px]" />

                    {/* 3. The Main Bronze Wire: The visible outer C-shape */}
                    <div className="absolute left-0 top-[10px] w-[42px] h-[15px] border-y-[3.5px] border-r-[3.5px] border-[#D4AF37] rounded-r-full shadow-[3px_4px_6px_rgba(0,0,0,0.3)] z-10" 
                         style={{ borderColor: '#A67C00 #D4AF37 #8B6914 #D4AF37' }} />
                    
                    {/* 4. Metallic Highlight: Provides the reflective sheen seen in the photo */}
                    <div className="absolute left-[2px] top-[11px] w-[38px] h-[10px] border-y-[1px] border-r-[1.5px] border-[#FFF3A3] rounded-r-full z-20 opacity-50" />
                    
                    {/* 5. Shadow on Paper: Soft shadow cast by the ring onto the page */}
                    <div className="absolute left-[38px] top-[18px] w-[10px] h-[2px] bg-black/10 blur-[2px] z-0" />
                  </div>
                ))}
              </div>
                              
                {/* Margin Line */}
                <div className="absolute left-28 top-0 bottom-0 w-[1px] bg-red-300/60 z-20 pointer-events-none" />


                <div className="pl-36 pr-12 pt-[32px] pb-14" style={{pointerEvents: boxMode ? "none" : "auto", position: 'relative', zIndex: 10}}>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={saveSelection}
                    onMouseUp={saveSelection}
                    onFocus={saveSelection}
                    onSelect={saveSelection}
                    onInput={()=>{saveSelection(); const content = editorRef.current?.innerHTML||""; setNotes(prev=>prev.map(n=>n.id===activeTabId?{...n,pages:n.pages.map((p,i)=>i===currentPageIdx?content:p)}:n))}}
                    style={{fontFamily:'"Playfair Display", serif', pointerEvents: boxMode?"none":"auto", lineHeight: "32px"}}
                    className="w-full min-h-[1000px] outline-none text-xl break-words [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
                  />
                </div>


{(activeNote.boxes[currentPageIdx] || []).map((box) => (
  <div 
    key={box.id}
    tabIndex={0} 
    onKeyDown={(e) => {
      if (e.target instanceof HTMLTextAreaElement) return; 
      if (e.key === 'Backspace' || e.key === 'Delete') deleteBox(box.id);
    }}
    onMouseDown={(e) => onBoxMouseDown(e, box)}
    className={`absolute p-2 transition-shadow outline-none z-50 group bg-white/90 shadow-sm ${selectedBoxId === box.id ? 'ring-2 ring-offset-2' : 'border border-dashed hover:border-zinc-500'}`}
    style={{ 
      left: box.x, top: box.y, width: box.w, height: box.h,
      boxShadow: selectedBoxId === box.id ? `0 0 0 2px white, 0 0 0 4px ${accent}` : 'none',
      borderColor: selectedBoxId === box.id ? accent : "#a1a1aa",
      cursor: boxMode || draggingBox?.id === box.id ? "grab" : "default",
      resize: selectedBoxId === box.id ? 'both' : 'none',
      overflow: 'hidden'
    }}
onMouseUp={(e) => {
  if (!paperRef.current) return;
  
  const rect = e.currentTarget.getBoundingClientRect();
  const paperRect = paperRef.current.getBoundingClientRect();
  const s = parseFloat(zoom);

  // Convert screen pixels back to internal paper coordinates
  const newX = (rect.left - paperRect.left) / s;
  const newY = (rect.top - paperRect.top) / s;
  const newW = rect.width / s;
  const newH = rect.height / s;

  // Only update if change is > 1px to avoid jitter
  if (Math.abs(box.w - newW) > 1 || Math.abs(box.h - newH) > 1 || 
      Math.abs(box.x - newX) > 1 || Math.abs(box.y - newY) > 1) {
    
    setNotes(prev => prev.map(n => {
      if (n.id !== activeTabId) return n;
      const bMap = { ...n.boxes };
      bMap[currentPageIdx] = bMap[currentPageIdx].map(b => 
        b.id === box.id ? { ...b, x: newX, y: newY, w: newW, h: newH } : b
      );
      return { ...n, boxes: bMap };
    }));
  }
}}
  >
    {selectedBoxId === box.id && (
      <button 
        onMouseDown={(e) => { e.stopPropagation(); deleteBox(box.id); }}
        className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-lg hover:bg-red-600 z-[60]"
      >✕</button>
    )}

    {loadingBoxId === box.id ? (
      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs animate-pulse font-mono">GENERATING...</div>
    ) : box.content.includes("http") || box.content.startsWith("data:image") ? (
      <div className="w-full h-full pointer-events-none flex items-center justify-center p-1">
        <img 
          src={box.content} 
          className="w-full h-full object-contain filter grayscale mix-blend-multiply opacity-90" 
          alt="sketch"
        />
      </div>
    ) : (
      <textarea
        onKeyDown={e => e.stopPropagation()}
        className="w-full h-full bg-transparent outline-none resize-none text-lg leading-tight overflow-hidden"
        style={{ fontFamily: '"Original Surfer", cursive', pointerEvents: boxMode ? "none" : "auto" }}
        value={box.content}
        onChange={(e) => updateBoxContent(box.id, e.target.value)}
      />
    )}
  </div>
))}


                {draftBox && draftBox.w > 2 && (
                  <div style={{ position:"absolute", left:draftBox.x, top:draftBox.y, width:draftBox.w, height:draftBox.h, border:`2px dashed ${accent}`, background:`${accent}10`, borderRadius:4, pointerEvents:"none", zIndex:60 }} />
                )}


                <div className="flex justify-center items-center gap-10 py-10 relative z-20">
                  <button disabled={currentPageIdx===0} onClick={()=>setCurrentPageIdx(p=>p-1)} className="text-3xl disabled:opacity-10 hover:scale-110 transition-transform bg-white rounded-full px-2" style={{color:accent}}>&larr;</button>
                  <span className="px-4 py-1 bg-zinc-50 rounded-full text-[10px] font-bold text-zinc-400">PAGE {currentPageIdx+1} / {activeNote.pages.length}</span>
                  <button onClick={()=>{ if(currentPageIdx<activeNote.pages.length-1) setCurrentPageIdx(p=>p+1); else { const np=[...activeNote.pages,""]; setNotes(prev=>prev.map(n=>n.id===activeTabId?{...n,pages:np}:n)); setCurrentPageIdx(activeNote.pages.length); } }} className="text-3xl hover:scale-110 transition-transform bg-white rounded-full px-2" style={{color:accent}}>&rarr;</button>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
