// Keyboard shortcut strings like "ctrl+alt+t". One function turns a key event
// into that string so the Settings recorder and every handler agree.
// Letters/digits/slashes come from the physical key (e.code): on macOS Option
// changes e.key (Option+T types "†"), which made alt shortcuts unmatchable.

export const DEFAULT_SHORTCUTS = {
  ai: "ctrl+j", slash: "/", newNote: "ctrl+n", search: "ctrl+k", toggleSidebar: "ctrl+\\",
  aiCommand: "\\", timer: "ctrl+alt+t", prevPage: "alt+arrowleft", nextPage: "alt+arrowright",
  drawMode: "ctrl+d", cycleHeader: "alt+1",
}
export type Shortcuts = typeof DEFAULT_SHORTCUTS

const CODE_KEYS: Record<string, string> = {
  Backslash: "\\", Slash: "/", Period: ".", Comma: ",", Semicolon: ";", Quote: "'",
  BracketLeft: "[", BracketRight: "]", Minus: "-", Equal: "=", Backquote: "`",
}

function baseKey(e: KeyboardEvent): string {
  const code = e.code || ""
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase()
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (CODE_KEYS[code]) return CODE_KEYS[code]
  return (e.key || "").toLowerCase()
}

export const isModifierKey = (e: KeyboardEvent) => ["Control", "Meta", "Alt", "Shift"].includes(e.key)

export function shortcutFromEvent(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push("ctrl")
  if (e.altKey) parts.push("alt")
  if (e.shiftKey) parts.push("shift")
  if (!isModifierKey(e)) parts.push(baseKey(e))
  return parts.join("+")
}

// Older saves may have recorded the Option-mangled character; normalise "alt+†" style keys away.
export function withDefaults(saved: unknown): Shortcuts {
  const s = saved && typeof saved === "object" ? (saved as Record<string, unknown>) : {}
  const out = { ...DEFAULT_SHORTCUTS }
  for (const k of Object.keys(out) as (keyof Shortcuts)[]) {
    const v = s[k]
    if (typeof v === "string" && v && /^[\x20-\x7e]+$/.test(v)) out[k] = v
  }
  return out
}

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

// "ctrl+alt+t" -> "⌘⌥T" on Mac, "Ctrl+Alt+T" elsewhere
export function formatShortcut(sc: string): string {
  const names: Record<string, [string, string]> = {
    ctrl: ["⌘", "Ctrl"], alt: ["⌥", "Alt"], shift: ["⇧", "Shift"],
    arrowleft: ["←", "←"], arrowright: ["→", "→"], arrowup: ["↑", "↑"], arrowdown: ["↓", "↓"],
    enter: ["↵", "Enter"], escape: ["Esc", "Esc"], " ": ["Space", "Space"],
  }
  const parts = sc.split("+").map(p => names[p] ? names[p][IS_MAC ? 0 : 1] : p.length === 1 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1))
  return IS_MAC ? parts.join("") : parts.join("+")
}

// Single-character shortcuts ("/", "\") also match the typed character, so they
// keep working on layouts where that character needs Shift or sits elsewhere.
export function matchesShortcut(e: KeyboardEvent, sc: string | undefined): boolean {
  if (!sc) return false
  if (shortcutFromEvent(e) === sc) return true
  return sc.length === 1 && e.key === sc && !e.ctrlKey && !e.metaKey && !e.altKey
}
