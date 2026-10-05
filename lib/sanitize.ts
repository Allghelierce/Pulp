import DOMPurify from "dompurify"

// Only these embed players may keep an <iframe>; any other frame is removed.
const EMBED_SRC = /^https:\/\/(www\.youtube\.com\/embed\/|player\.vimeo\.com\/video\/)/
let hooked = false
function ensureHooks() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "iframe" && !EMBED_SRC.test((node as Element).getAttribute?.("src") || "")) {
      node.parentNode?.removeChild(node)
    }
  })
}

// Keeps what the editor itself inserts (toggles, embeds, locked blocks, code-copy
// buttons) so reloading a page doesn't flatten it; scripts/handlers stay stripped.
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== "string") return ""
  ensureHooks()
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "s", "p", "br", "span", "div", "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code", "img", "table", "thead", "tbody", "tr", "td", "th", "sub", "sup", "hr", "details", "summary", "iframe", "video", "button"],
    ALLOWED_ATTR: ["href", "src", "alt", "class", "style", "target", "rel", "colspan", "rowspan", "contenteditable", "allow", "allowfullscreen", "controls", "open", "title", "type"],
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "object", "embed", "form", "input", "textarea", "select"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "srcdoc"],
  })
}

export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (char) => map[char] || char)
}

export function extractTextFromHTML(html: string): string {
  if (!html || typeof html !== "string") return ""
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  const div = document.createElement("div")
  div.innerHTML = clean
  return div.textContent?.trim() || ""
}
