/**
 * Sanitizes HTML to prevent XSS attacks
 * Removes script tags, event handlers, and dangerous attributes
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== "string") {
    return ""
  }

  // Create a temporary DOM element
  const temp = document.createElement("div")
  temp.innerHTML = html

  // Remove script and style tags
  const scripts = temp.querySelectorAll("script, style")
  scripts.forEach(el => el.remove())

  // Remove event handlers and dangerous attributes
  const allElements = temp.querySelectorAll("*")
  allElements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.toLowerCase().startsWith("on")) {
        el.removeAttribute(attr.name)
      }
      const val = attr.value.replace(/[\s\u0000-\u001f]/g, '').toLowerCase()
      if (val.includes("javascript:") || val.includes("vbscript:") || val.includes("data:text/html")) {
        el.removeAttribute(attr.name)
      }
    })
  })

  return temp.innerHTML
}

/**
 * Escapes HTML special characters to prevent XSS
 * Use this when you need to display user content as text
 */
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
