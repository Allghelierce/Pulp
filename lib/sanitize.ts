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
    // Remove all event handlers
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name)
      }
      // Remove javascript: protocol
      if (attr.value.includes("javascript:")) {
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
