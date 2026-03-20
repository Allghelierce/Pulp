"use client"
import { useEffect, useRef, useState } from "react"

const ICON_CATEGORIES: { label: string; icons: string[] }[] = [
  {
    label: "Documents",
    icons: ["📄", "📝", "📃", "📋", "📊", "📈", "📉", "📑", "🗒️", "🗓️", "📅", "📆", "📇", "🗂️", "🗃️", "🗄️", "📁", "📂", "🗑️", "📌", "📍"],
  },
  {
    label: "Writing",
    icons: ["✏️", "🖊️", "🖋️", "📖", "📚", "📓", "📔", "📒", "📕", "📗", "📘", "📙", "🔖", "🏷️"],
  },
  {
    label: "Ideas & Work",
    icons: ["💡", "🔑", "🗝️", "🔍", "🔎", "💼", "🧰", "⚙️", "🔧", "🔨", "🛠️", "📐", "📏", "🧮", "🖥️", "💻", "📱", "⌨️", "🖱️"],
  },
  {
    label: "Learning",
    icons: ["🎓", "🏫", "🧪", "🔬", "🔭", "🧬", "📡", "🧩", "🎯", "🏆", "🥇", "🎖️", "🏅"],
  },
  {
    label: "Creative",
    icons: ["🎨", "🖌️", "🎭", "🎬", "🎤", "🎵", "🎶", "🎸", "🎹", "🎺", "🎻", "🥁", "🎧", "📷", "📸", "🎥", "🎞️"],
  },
  {
    label: "Nature",
    icons: ["🌟", "⭐", "🌙", "☀️", "🌈", "🌸", "🌺", "🌻", "🌹", "🍀", "🌿", "🍃", "🌱", "🌲", "🌳", "🌵", "🍄", "🌊", "🔥", "⚡", "❄️"],
  },
  {
    label: "Places",
    icons: ["🏠", "🏡", "🏢", "🏛️", "🏗️", "🌍", "🌎", "🌏", "🗺️", "🧭", "🏔️", "🏖️", "🏕️", "🌆", "🌇", "🌃"],
  },
  {
    label: "People & Hearts",
    icons: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💖", "💗", "💓", "💞", "💝", "😊", "🤔", "💪", "👀", "🙏", "👋"],
  },
  {
    label: "Symbols",
    icons: ["✅", "❌", "⚠️", "💬", "💭", "📣", "📢", "🔔", "🔕", "🚀", "⏰", "⏳", "🔒", "🔓", "💰", "💎", "🎁", "🎉", "🎊", "🎀"],
  },
]

const ALL_ICONS = ICON_CATEGORIES.flatMap(c => c.icons)

interface IconPickerProps {
  x: number
  y: number
  onSelect: (icon: string) => void
  onClose: () => void
}

export function IconPicker({ x, y, onSelect, onClose }: IconPickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState(0)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler, true)
    return () => document.removeEventListener("mousedown", handler, true)
  }, [onClose])

  const filtered = search.trim()
    ? ALL_ICONS.filter(icon => {
        const term = search.toLowerCase()
        // simple name match via CLDR-inspired keyword check
        return icon.includes(term) || getIconKeywords(icon).some(k => k.includes(term))
      })
    : ICON_CATEGORIES[activeCategory].icons

  // Position: keep within viewport
  const PICKER_W = 304
  const PICKER_H = 340
  const left = Math.min(x, window.innerWidth - PICKER_W - 8)
  const top = Math.min(y, window.innerHeight - PICKER_H - 8)

  return (
    <div
      ref={ref}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: "fixed", left, top, zIndex: 9999,
        width: PICKER_W,
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Search */}
      <div style={{ padding: "10px 10px 6px" }}>
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search icons…"
          style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, padding: "6px 10px",
            fontSize: 12, color: "#e4e4e7", outline: "none",
          }}
        />
      </div>

      {/* Category tabs — only shown when not searching */}
      {!search.trim() && (
        <div style={{ display: "flex", gap: 2, padding: "0 8px 6px", overflowX: "auto", scrollbarWidth: "none" }}>
          {ICON_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              style={{
                flexShrink: 0, fontSize: 10, fontWeight: 600,
                padding: "3px 8px", borderRadius: 5, border: "none", cursor: "pointer",
                background: activeCategory === i ? "rgba(255,255,255,0.15)" : "transparent",
                color: activeCategory === i ? "#fff" : "#71717a",
                letterSpacing: "0.04em", textTransform: "uppercase",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Icon grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 10px", maxHeight: 240 }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", fontSize: 12, color: "#52525b", padding: "20px 0" }}>No icons found</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 34px)", gap: 2 }}>
            {filtered.map(icon => (
              <button
                key={icon}
                title={icon}
                onClick={() => { onSelect(icon); onClose() }}
                style={{
                  width: 34, height: 34, fontSize: 20,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "none", border: "none", cursor: "pointer",
                  borderRadius: 6, transition: "background 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reset to default */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "6px 10px" }}>
        <button
          onClick={() => { onSelect("📄"); onClose() }}
          style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            fontSize: 11, color: "#52525b", padding: "4px 0",
          }}
        >
          Reset to default 📄
        </button>
      </div>
    </div>
  )
}

// Very lightweight keyword map for search
function getIconKeywords(icon: string): string[] {
  const map: Record<string, string[]> = {
    "📄": ["document", "file", "page", "note"],
    "📝": ["memo", "write", "note", "edit"],
    "📃": ["page", "document"],
    "📋": ["clipboard", "list", "task"],
    "📊": ["chart", "graph", "data", "bar"],
    "📈": ["chart", "graph", "trend", "up"],
    "📉": ["chart", "graph", "trend", "down"],
    "📑": ["bookmark", "document", "pages"],
    "🗒️": ["notepad", "spiral"],
    "🗓️": ["calendar", "schedule"],
    "📅": ["calendar", "date"],
    "📆": ["calendar", "date"],
    "📌": ["pin", "location", "pushpin"],
    "📍": ["pin", "location", "map"],
    "🗂️": ["folder", "index", "tab"],
    "🗃️": ["box", "file", "card"],
    "🗄️": ["cabinet", "file", "drawer"],
    "📁": ["folder", "directory"],
    "📂": ["folder", "open", "directory"],
    "✏️": ["pencil", "write", "edit"],
    "🖊️": ["pen", "write"],
    "🖋️": ["fountain", "pen", "write"],
    "📖": ["book", "open", "read"],
    "📚": ["books", "library", "study"],
    "📓": ["notebook"],
    "📔": ["notebook", "decorated"],
    "📒": ["ledger", "notebook"],
    "📕": ["book", "closed", "red"],
    "📗": ["book", "green"],
    "📘": ["book", "blue"],
    "📙": ["book", "orange"],
    "🔖": ["bookmark"],
    "🏷️": ["label", "tag"],
    "💡": ["idea", "light", "bulb"],
    "🔑": ["key", "password"],
    "🗝️": ["key", "old"],
    "🔍": ["search", "magnify"],
    "🔎": ["search", "zoom"],
    "💼": ["briefcase", "work", "business"],
    "🧰": ["toolbox"],
    "⚙️": ["gear", "settings", "cog"],
    "🔧": ["wrench", "tool"],
    "🔨": ["hammer", "tool"],
    "🖥️": ["computer", "desktop", "screen"],
    "💻": ["laptop", "computer"],
    "📱": ["phone", "mobile"],
    "⌨️": ["keyboard"],
    "🎓": ["graduation", "school", "education"],
    "🧪": ["test", "lab", "science"],
    "🔬": ["microscope", "science"],
    "🔭": ["telescope", "space"],
    "🧩": ["puzzle", "piece"],
    "🎯": ["target", "goal", "aim"],
    "🏆": ["trophy", "win", "award"],
    "🎨": ["art", "palette", "paint"],
    "🖌️": ["brush", "paint"],
    "🎵": ["music", "note"],
    "🎶": ["music", "notes"],
    "📷": ["camera", "photo"],
    "🌟": ["star", "sparkle"],
    "⭐": ["star"],
    "🌙": ["moon", "night"],
    "☀️": ["sun", "day"],
    "🌈": ["rainbow"],
    "❤️": ["heart", "love", "red"],
    "💙": ["heart", "blue"],
    "💚": ["heart", "green"],
    "✅": ["check", "done", "yes"],
    "❌": ["cross", "no", "error"],
    "⚠️": ["warning", "alert"],
    "🚀": ["rocket", "launch", "fast"],
    "🎉": ["party", "celebrate"],
    "💰": ["money", "cash"],
    "🏠": ["home", "house"],
    "🌍": ["earth", "world", "globe"],
  }
  return map[icon] ?? []
}
