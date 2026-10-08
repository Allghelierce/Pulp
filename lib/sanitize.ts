import DOMPurify from "dompurify"

export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== "string") return ""
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "s", "p", "br", "span", "div", "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code", "img", "table", "thead", "tbody", "tr", "td", "th", "sub", "sup", "hr"],
    ALLOWED_ATTR: ["href", "src", "alt", "class", "style", "target", "rel", "colspan", "rowspan", "start"],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "select", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
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
