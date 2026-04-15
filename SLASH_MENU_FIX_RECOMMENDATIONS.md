# SlashMenu Theme Fixes - Code Examples

## Helper Function (Add Near Top of File)

Add this utility function to handle hex-to-rgba conversion for accent colors:

```typescript
/**
 * Converts a hex color to RGB values for use in rgba() strings
 * @param hex - Color hex code (e.g. "#b85e22" or "#4a081eff")
 * @returns RGB string like "74,94,34" or null if invalid
 */
function hexToRgb(hex: string): string | null {
  // Remove # if present
  const cleaned = hex.replace('#', '')
  
  // Handle 8-char (with alpha) and 6-char hex codes
  const hexCode = cleaned.length === 8 ? cleaned.slice(0, 6) : cleaned
  
  const r = parseInt(hexCode.substring(0, 2), 16)
  const g = parseInt(hexCode.substring(2, 4), 16)
  const b = parseInt(hexCode.substring(4, 6), 16)
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return `${r},${g},${b}`
}
```

---

## Fix #1: Replace Hardcoded ORANGE Constant (Line 49)

### BEFORE:
```typescript
const ORANGE = "#b85e22"
```

### AFTER:
```typescript
// Compute accent RGB once for use in multiple places
const accentRgb = useMemo(() => hexToRgb(accent) || "184,94,34", [accent])
```

---

## Fix #2: Update OIcon Component (Lines 51-65)

### BEFORE:
```typescript
function OIcon({ children, isActive, mode }: { children: React.ReactNode; isActive: boolean; mode: "@" | "/" }) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: isActive
        ? (mode === "/" ? "rgba(184,94,34,0.12)" : "rgba(184,94,34,0.18)")
        : "transparent",
      color: ORANGE,
      transition: "background 0.1s ease",
    }}>
      {children}
    </div>
  )
}
```

### AFTER:
```typescript
function OIcon({ children, isActive, mode }: { children: React.ReactNode; isActive: boolean; mode: "@" | "/" }) {
  const isLight = mode === "/"
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: isActive
        ? (isLight ? `rgba(${accentRgb},0.12)` : `rgba(${accentRgb},0.18)`)
        : "transparent",
      color: accent,
      transition: "background 0.1s ease",
    }}>
      {children}
    </div>
  )
}
```

---

## Fix #3: Update Blockquote Block (Line 633)

### BEFORE:
```typescript
action: () => insertHTML(`<blockquote style="border-left:4px solid ${accent};padding:8px 16px;margin:8px 0;color:#666;font-style:italic;background:#f5f5f5;border-radius:0 8px 8px 0" contenteditable="true">Quote…</blockquote><br/>`)
```

### AFTER:
```typescript
action: () => {
  const isDarkMode = mode === "@"  // Adjust if semantics differ
  const quoteStyle = isDarkMode
    ? `border-left:4px solid ${accent};padding:8px 16px;margin:8px 0;color:#aaa;font-style:italic;background:rgba(255,255,255,0.05);border-radius:0 8px 8px 0`
    : `border-left:4px solid ${accent};padding:8px 16px;margin:8px 0;color:#666;font-style:italic;background:#f5f5f5;border-radius:0 8px 8px 0`
  insertHTML(`<blockquote style="${quoteStyle}" contenteditable="true">Quote…</blockquote><br/>`)
}
```

---

## Fix #4: Update TOC Function (Lines 303-309)

### BEFORE:
```typescript
function makeTOC(): string {
  const headers = Array.from(document.querySelectorAll("[contenteditable]:not([data-box-style]) h1"))
  if (headers.length === 0) return `<div contenteditable="false" style="border:1px solid #e4e4e7;border-radius:6px;padding:16px;margin:8px 0;background:#fafafa"><div style="font-family:'Caveat',cursive;font-size:20px;font-weight:700;color:#5a4a3a;margin-bottom:12px">Table of Contents</div><div style="color:#999;font-size:13px;font-style:italic">none</div></div><br/>`
  const items = headers.map(h => {
    return `<div style="padding:6px 0;font-family:'Caveat',cursive;font-size:16px;color:#374151">${(h.textContent || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`
  }).join("")
  return `<div contenteditable="false" style="border:1px solid #e4e4e7;border-radius:6px;padding:16px;margin:8px 0;background:#fafafa"><div style="font-family:'Caveat',cursive;font-size:20px;font-weight:700;color:#5a4a3a;margin-bottom:12px">Table of Contents</div>${items}</div><br/>`
}
```

### AFTER:
```typescript
function makeTOC(isDarkMode: boolean): string {
  const headers = Array.from(document.querySelectorAll("[contenteditable]:not([data-box-style]) h1"))
  
  const borderColor = isDarkMode ? "rgba(255,255,255,0.1)" : "#e4e4e7"
  const bgColor = isDarkMode ? "rgba(255,255,255,0.05)" : "#fafafa"
  const titleColor = isDarkMode ? "#ccc" : "#5a4a3a"
  const itemColor = isDarkMode ? "#bbb" : "#374151"
  const noneColor = isDarkMode ? "#888" : "#999"
  
  if (headers.length === 0) {
    return `<div contenteditable="false" style="border:1px solid ${borderColor};border-radius:6px;padding:16px;margin:8px 0;background:${bgColor}"><div style="font-family:'Caveat',cursive;font-size:20px;font-weight:700;color:${titleColor};margin-bottom:12px">Table of Contents</div><div style="color:${noneColor};font-size:13px;font-style:italic">none</div></div><br/>`
  }
  const items = headers.map(h => {
    return `<div style="padding:6px 0;font-family:'Caveat',cursive;font-size:16px;color:${itemColor}">${(h.textContent || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`
  }).join("")
  return `<div contenteditable="false" style="border:1px solid ${borderColor};border-radius:6px;padding:16px;margin:8px 0;background:${bgColor}"><div style="font-family:'Caveat',cursive;font-size:20px;font-weight:700;color:${titleColor};margin-bottom:12px">Table of Contents</div>${items}</div><br/>`
}
```

Then update the call:
```typescript
// Find the line that calls makeTOC() and update it:
// OLD: action: () => onSelect(() => insertHTML(makeTOC()))
// NEW:
action: () => onSelect(() => insertHTML(makeTOC(mode === "@")))
```

---

## Fix #5: Update Bookmark Input (Line 489)

The BookmarkInput function needs to be aware of dark mode when creating bookmark HTML.

### BEFORE (line 489):
```typescript
const html = `<div contenteditable="false" onclick="window.open('${safeUrl}','_blank')" style="display:flex;gap:12px;border:1px solid #e4e4e7;border-radius:8px;padding:12px 14px;margin:8px 0;background:#fafafa;max-width:480px;cursor:pointer"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${safeTitle}</div><div style="font-size:11px;color:#666;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${safeDesc}</div><div style="font-size:10px;color:#9ca3af">${safeDomain}</div></div>${imgHtml}</div><br/>`
```

### AFTER (in BookmarkInput function):
```typescript
function BookmarkInput({ onInsert, onClose, mode }: { onInsert: (html: string) => void; onClose: () => void; mode: "@" | "/" }) {
  // ... existing code ...
  const isDarkMode = mode === "@"
  
  // When creating bookmark HTML:
  const borderColor = isDarkMode ? "rgba(255,255,255,0.1)" : "#e4e4e7"
  const bgColor = isDarkMode ? "rgba(255,255,255,0.05)" : "#fafafa"
  const titleColor = isDarkMode ? "#eee" : "#111"
  const descColor = isDarkMode ? "#aaa" : "#666"
  const domainColor = isDarkMode ? "#888" : "#9ca3af"
  
  const html = `<div contenteditable="false" onclick="window.open('${safeUrl}','_blank')" style="display:flex;gap:12px;border:1px solid ${borderColor};border-radius:8px;padding:12px 14px;margin:8px 0;background:${bgColor};max-width:480px;cursor:pointer"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:${titleColor};margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${safeTitle}</div><div style="font-size:11px;color:${descColor};margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${safeDesc}</div><div style="font-size:10px;color:${domainColor}">${safeDomain}</div></div>${imgHtml}</div><br/>`
}
```

---

## Fix #6: Update Active Item CSS (Line 915)

### BEFORE:
```typescript
.slash-item-active { background: ${isLight ? "rgba(184,94,34,0.08)" : "rgba(184,94,34,0.12)"} !important; }
```

### AFTER:
```typescript
.slash-item-active { background: ${isLight ? `rgba(${accentRgb},0.08)` : `rgba(${accentRgb},0.12)`} !important; }
```

---

## Fix #7: Improve Shortcut Badge Contrast (Line 1016)

### BEFORE:
```typescript
color: isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
```

### AFTER:
```typescript
color: isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.65)",  // Increased opacity for better contrast
```

---

## Fix #8: Fix MediaInput and CustomDateWrapper (Lines 384, 388, 507)

These components need to respect dark mode when rendering HTML inputs and tabs.

### In CustomDateWrapper (Line 85):
```typescript
// BEFORE:
color: isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)"

// AFTER - already correct, no change needed ✓
```

### In MediaInput tabs (Lines 384, 388):
```typescript
// BEFORE:
style={{ ... fontSize: 13, fontWeight: tab === "upload" ? 600 : 400, color: tab === "upload" ? "#111" : "#777", ... }}

// AFTER - add mode-awareness:
const isDarkMode = mode === "@"
const activeColor = isDarkMode ? "#eee" : "#111"
const inactiveColor = isDarkMode ? "#666" : "#777"
const borderColor = isDarkMode ? "rgba(255,255,255,0.2)" : "#111"

style={{ ... color: tab === "upload" ? activeColor : inactiveColor, borderBottom: tab === "upload" ? `2px solid ${borderColor}` : "2px solid transparent", ... }}
```

---

## Testing Checklist

After implementing fixes, test with all accent colors:
- [ ] Crimson (#4a081eff)
- [ ] Cobalt (#1e3a8a)
- [ ] Forest (#166534)
- [ ] Amber (#92400e)
- [ ] Violet (#4c1d95)
- [ ] Teal (#0f4c5c)
- [ ] Rose (#881337)
- [ ] Slate (#374151)

For each color, verify:
- [ ] / (light) menu displays correctly
- [ ] @ (dark) menu displays correctly
- [ ] Icons use accent color correctly
- [ ] Active state highlights with accent color
- [ ] Blockquotes visible and readable in both modes
- [ ] TOC visible and readable in both modes
- [ ] Bookmarks visible and readable in both modes
- [ ] Code blocks visible and readable
- [ ] All text has sufficient contrast (WCAG AA)

