// Lays imported notes out page by page: each page is filled before the next one starts.
// Content is measured in the real editor styles (body font, ruled line height, list CSS),
// so pages come out full and nothing is clipped at the foot of a page. Long lists split
// between items, tables between rows, paragraphs between words; a heading is never left
// alone at the bottom of a page. Browser-only (falls back to one page per section).

export const PAGE_H = 1250 // #editor-paper height
const TEXT_TOP = 49 // text box y (40) + border (1) + padding (8)
const TEXT_W = 874 // text box w (900) − borders − padding
export const PAGE_FOOT = 40 // same margin at the foot of the page as at the top
const FOOT = PAGE_FOOT

/** Where the text of a page's box starts and how wide it is (unzoomed page px). */
export type TextArea = { top: number; width: number }

const SPLIT_BY_ITEMS = new Set(["UL", "OL", "TABLE"])
const HEADINGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"])
const INLINE = new Set(["A", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "DEL", "MARK", "CODE", "SPAN", "SUB", "SUP", "BR", "SMALL", "IMG"])

type Measurer = { fits: (extra?: Node) => boolean; box: HTMLElement; setArea: (a: TextArea) => void; done: () => void }

function measurer(): Measurer {
  // Measure inside the open page when there is one (it has the editor's CSS).
  let paper = document.getElementById("editor-paper")
  if (paper && !paper.getBoundingClientRect().width) paper = null // hidden behind another view
  let host = paper
  if (!host) {
    // No page open (orchard, stats…): an offscreen stand-in with the editor's list rules.
    host = document.createElement("div")
    host.id = "editor-paper"
    host.style.cssText = "position:fixed;left:-10000px;top:0;width:960px;visibility:hidden"
    host.innerHTML = "<style>#editor-paper ul,#editor-paper ol{padding-left:1.5em;margin:0}#editor-paper li{margin:0}</style>"
    document.body.appendChild(host)
  }
  const box = document.createElement("div")
  box.setAttribute("aria-hidden", "true")
  box.style.cssText = [
    "position:absolute", "left:0", "top:0", `width:${TEXT_W}px`, "visibility:hidden", "pointer-events:none",
    "font-family:var(--pulp-body-font, Georgia, serif)", "font-size:calc(20px * var(--pulp-font-scale, 1))", "font-weight:400",
    "line-height:var(--pulp-rule, var(--pulp-line-height, 1.8))", "letter-spacing:0.1px", "word-wrap:break-word",
  ].join(";")
  host.appendChild(box)
  const rule = parseFloat(getComputedStyle(box).lineHeight) || 32
  let width = TEXT_W
  let cap = 0
  const setArea = (a: TextArea) => {
    width = a.width
    box.style.width = `${a.width}px`
    // Whole rows only, so the last line on a page still sits on a ruled line.
    cap = Math.max(1, Math.floor((PAGE_H - a.top - FOOT) / rule)) * rule + 0.5
  }
  setArea({ top: TEXT_TOP, width: TEXT_W })
  const fits = (extra?: Node) => {
    if (extra) box.appendChild(extra)
    const r = box.getBoundingClientRect()
    // Pages are zoomed (#pulp-page-surface); the width is known, so it gives the scale.
    const h = r.height / (r.width / width || 1)
    if (extra) box.removeChild(extra)
    return h <= cap
  }
  return { fits, box, setArea, done: () => { box.remove(); if (!paper) host!.remove() } }
}

const isSpacer = (n: Node) =>
  n.nodeType === Node.ELEMENT_NODE ? (n as Element).tagName === "DIV" && !(n as Element).textContent!.trim() && !(n as Element).querySelector("img,table,hr")
    : !n.textContent!.trim()
const isHeading = (n: Node) => n.nodeType === Node.ELEMENT_NODE && HEADINGS.has((n as Element).tagName)

/** A section's top-level nodes; runs of loose inline content get a <div> each. */
function topNodes(html: string): Node[] {
  const t = document.createElement("template")
  t.innerHTML = html
  const out: Node[] = []
  let run: HTMLDivElement | null = null
  for (const n of Array.from(t.content.childNodes)) {
    const inline = n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && INLINE.has((n as Element).tagName))
    if (inline) {
      if (!run) { if (n.nodeType === Node.TEXT_NODE && !n.textContent!.trim()) continue; run = document.createElement("div"); out.push(run) }
      run.appendChild(n)
    } else if (n.nodeType === Node.ELEMENT_NODE) { run = null; out.push(n) }
  }
  return out
}

/** Splits a list/table between items: the longest head that still fits, and the rest. */
function splitItems(el: Element, m: Measurer): [Element, Element] | null {
  const body = el.tagName === "TABLE" ? (el.querySelector(":scope > tbody") ?? el) : el
  const items = Array.from(body.children).filter(c => c.tagName === "LI" || c.tagName === "TR")
  if (items.length < 2) return null
  const make = (from: number, to: number) => {
    const shell = el.cloneNode(false) as Element
    let target: Element = shell
    if (body !== el) { target = body.cloneNode(false) as Element; shell.appendChild(target) }
    for (const it of items.slice(from, to)) target.appendChild(it.cloneNode(true))
    return shell
  }
  let lo = 0, hi = items.length - 1 // k items fit; never all (the whole thing didn't)
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (m.fits(make(0, mid))) lo = mid; else hi = mid - 1
  }
  if (!lo) return null
  const tail = make(lo, items.length)
  if (el.tagName === "OL") tail.setAttribute("start", String((parseInt(el.getAttribute("start") || "1", 10) || 1) + lo))
  return [make(0, lo), tail]
}

/** Splits any element between words (or after a line break), keeping its formatting on both sides. */
function splitWords(el: Element, m: Measurer): [Node, Node] | null {
  const cuts: [Node, number][] = []
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) {
      const s = n.textContent!
      for (const match of s.matchAll(/\s+/g)) {
        const at = match.index! + match[0].length
        if (at < s.length) cuts.push([n, at])
      }
    } else if ((n as Element).tagName === "BR" && n.parentNode) {
      cuts.push([n.parentNode, Array.prototype.indexOf.call(n.parentNode.childNodes, n) + 1])
    }
  }
  if (!cuts.length) return null
  const piece = (from: [Node, number] | null, to: [Node, number] | null) => {
    const r = document.createRange()
    if (from) r.setStart(from[0], from[1]); else r.setStart(el, 0)
    if (to) r.setEnd(to[0], to[1]); else r.setEnd(el, el.childNodes.length)
    const shell = el.cloneNode(false) as Element
    shell.appendChild(r.cloneContents())
    return shell
  }
  let lo = -1, hi = cuts.length - 1 // index of the last cut whose head fits
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (m.fits(piece(null, cuts[mid]))) lo = mid; else hi = mid - 1
  }
  if (lo < 0) return null
  const head = piece(null, cuts[lo])
  const tail = piece(cuts[lo], null)
  // A list split mid-item: the continuation shouldn't get a second bullet/number.
  const li = tail.nodeName === "LI" ? tail as HTMLElement : tail.querySelector(":scope > li") as HTMLElement | null
  if (li) li.style.listStyleType = "none"
  if (tail.nodeName === "OL") {
    const start = parseInt(el.getAttribute("start") || "1", 10) || 1
    tail.setAttribute("start", String(start + Math.max(0, head.querySelectorAll(":scope > li").length - 1)))
  }
  return [head, tail]
}

function split(n: Node, m: Measurer, pageEmpty: boolean): [Node, Node] | null {
  if (n.nodeType !== Node.ELEMENT_NODE) return null
  const el = n as Element
  if (HEADINGS.has(el.tagName)) return null
  if (SPLIT_BY_ITEMS.has(el.tagName)) {
    const parts = splitItems(el, m)
    // Not even one whole item fits: start it on the next page, or, if this page
    // is already empty, split inside the item.
    if (parts || !pageEmpty) return parts
  }
  return splitWords(el, m)
}

/**
 * One HTML string per page, filled in order. Every page's text goes in a default text box;
 * `first` = where the text area on the first page is instead (a box lower on the page or
 * narrower), e.g. when a paste overflows the box it went into.
 */
export function paginateImport(sectionsHtml: string[], first?: TextArea): string[] {
  if (typeof document === "undefined") return sectionsHtml
  const m = measurer()
  if (first) m.setArea(first)
  try {
    const queue: Node[] = []
    sectionsHtml.forEach((html, i) => {
      const nodes = topNodes(html)
      // Headingless sections are chunks of one long text: keep a paragraph gap between them.
      if (i && nodes.length && !isHeading(nodes[0])) queue.push(Object.assign(document.createElement("div"), { innerHTML: "<br>" }))
      queue.push(...nodes)
    })
    const pages: string[] = []
    let onPage: Node[] = []
    const flush = () => {
      // Keep a heading with what follows it: carry trailing headings over to the next page.
      const carry: Node[] = []
      while (onPage.length > 1 && (isHeading(onPage[onPage.length - 1]) || isSpacer(onPage[onPage.length - 1]))) {
        const last = onPage.pop()!
        m.box.removeChild(last)
        if (!isSpacer(last)) carry.unshift(last)
      }
      pages.push(m.box.innerHTML)
      m.box.replaceChildren()
      m.setArea({ top: TEXT_TOP, width: TEXT_W })
      onPage = []
      queue.unshift(...carry)
    }
    const place = (n: Node) => { m.box.appendChild(n); onPage.push(n) }
    while (queue.length) {
      const n = queue.shift()!
      if (!onPage.length && isSpacer(n)) continue
      // A heading at the top of a page doesn't need the blank row above it.
      if (!onPage.length && isHeading(n)) (n as HTMLElement).style.paddingTop = "0"
      if (m.fits(n)) { place(n); continue }
      const parts = split(n, m, !onPage.length)
      if (parts) { place(parts[0]); queue.unshift(parts[1]); flush(); continue }
      if (!onPage.length && first && !pages.length) { queue.unshift(n); flush(); continue } // no room left in that first box
      if (!onPage.length) { place(n); flush(); continue } // too big to split: give it a page
      queue.unshift(n)
      flush()
    }
    if (onPage.length) flush()
    return pages.length ? pages : [""]
  } finally {
    m.done()
  }
}
