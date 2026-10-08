// Highlight-to-card: one recall card from text highlighted in a text box, made on
// the spot with no AI. A few words inside a sentence become a cloze ("_____");
// a whole sentence or passage gets the best local card we can find. Signed-in
// users ask the AI first for those (/api/recall mode "highlight") and land here
// if it can't help. Nothing here touches the note itself.
import type { Card } from "@/lib/recallPrompt"

export const CLOZE_MAX_WORDS = 8
export const BLANK = "_____"
const MAX_Q = 400
const MAX_A = 1200
const MAX_DEF_A = 320  // a definition's answer: the definition (+ a little after), not the whole passage
const MAX_BELOW = 300  // notes under a heading / lone term, used as its answer

// The paragraph around a highlight, split at it. `emphasized`: bold / underlined /
// marked bits inside the highlight (the student's own "this matters"). `below`: the
// rest of the text box after the highlight's block; `heading`: it's in an H1–H6.
export interface Highlight { before: string; selected: string; after: string; emphasized?: string[]; below?: string; heading?: boolean }

// Chinese / Japanese run words together, so word edges can't be found by spaces.
const CJK_SRC = "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}"
const CJK = new RegExp(`[${CJK_SRC}]`, "u")
const CJK_ALL = new RegExp(`[${CJK_SRC}]`, "gu")
const WORDY = `(?:(?![${CJK_SRC}])[\\p{L}\\p{N}])` // a letter/digit of a spaced language
const isWordy = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c) && !CJK.test(c)

const squash = (s: string) => s.replace(/\s+/g, " ").trim()
// Spaced words, plus ~2 CJK characters a word.
const wordCount = (s: string) =>
  squash(s.replace(CJK_ALL, " ")).split(" ").filter(w => /[\p{L}\p{N}]/u.test(w)).length + Math.ceil((s.match(CJK_ALL)?.length ?? 0) / 2)
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const count = (s: string, c: string) => s.split(c).length - 1
const hasWord = (s: string) => /[\p{L}\p{N}]/u.test(s)

// ── sentences ─────────────────────────────────────────────────────────
// A sentence ends at a newline, at . ! ? (plus closing quotes) before a space —
// so "3.14" and "e.g.x" don't split — or at 。！？.
function lastSentenceStart(text: string): number {
  let cut = 0
  const re = /\n|[.!?]["'”’)\]]*(?=\s)|[。！？]/g
  for (let m = re.exec(text); m; m = re.exec(text)) cut = m.index + m[0].length
  return cut
}
function firstSentenceEnd(text: string): number {
  const m = /\n|[.!?]["'”’)\]]*(?=\s|$)|[。！？]/.exec(text)
  if (!m) return text.length
  return m[0] === "\n" ? m.index : m.index + m[0].length
}

// Quotes, spaces and stray punctuation off the answer's edges (moved into pre/post).
// Brackets go only when they don't belong to the term: "(CO2)" -> "CO2", but
// "O(log n)", "f(x)" and "arr[i]" stay whole.
const OPENER: Record<string, string> = { ")": "(", "]": "[" }
const CLOSER: Record<string, string> = { "(": ")", "[": "]" }
function trimTerm(pre: string, sel: string, post: string): { pre: string; sel: string; post: string } {
  for (let guard = 0; sel && guard < 50; guard++) {
    const lead = /^[\s"'“‘]+/.exec(sel)?.[0]
    if (lead) { pre += lead; sel = sel.slice(lead.length); continue }
    const trail = /[\s.,;:!?"'”’]+$/.exec(sel)?.[0]
    if (trail) { post = trail + post; sel = sel.slice(0, -trail.length); continue }
    const first = sel[0], last = sel[sel.length - 1]
    const inner = sel.slice(1, -1)
    if (CLOSER[first] && last === CLOSER[first] && count(inner, first) === count(inner, last)) {
      pre += first; post = last + post; sel = inner; continue
    }
    if (OPENER[last] && count(sel, last) > count(sel, OPENER[last])) { post = last + post; sel = sel.slice(0, -1); continue }
    if (CLOSER[first] && count(sel, first) > count(sel, CLOSER[first])) { pre += first; sel = sel.slice(1); continue }
    break
  }
  return { pre, sel, post }
}

// Whole words only, and no stray spaces/punctuation on the answer's edges.
const HEAD_RE = new RegExp(`(?:${WORDY}|['’-])+$`, "u")
const TAIL_RE = new RegExp(`^(?:${WORDY}|['’-])+`, "u")
function tidy(h: Highlight): { pre: string; sel: string; post: string } {
  let pre = h.before, sel = h.selected, post = h.after
  const head = HEAD_RE.exec(pre)
  if (head && isWordy(sel[0])) { sel = head[0] + sel; pre = pre.slice(0, head.index) }
  const tail = TAIL_RE.exec(post)
  if (tail && isWordy(sel[sel.length - 1])) { sel += tail[0]; post = post.slice(tail[0].length) }
  // "O(log n" with the ")" just outside: take it in.
  for (const [o, c] of [["(", ")"], ["[", "]"]]) if (count(sel, o) > count(sel, c) && post.startsWith(c)) { sel += c; post = post.slice(1) }
  const t = trimTerm(pre, sel, post)
  return { pre: t.pre, sel: squash(t.sel), post: t.post }
}

// Every whole-word copy of `term` blanked, so the question never gives it away.
function blankAll(text: string, term: string): string {
  const edge = (c: string) => (isWordy(c) ? `(?<!${WORDY})` : "")
  const tail = (c: string) => (isWordy(c) ? `(?!${WORDY})` : "")
  const re = new RegExp(edge(term[0]) + escapeRe(term).replace(/\s+/g, "\\s+") + tail(term[term.length - 1]), "giu")
  return text.replace(re, BLANK)
}

// Long questions keep the part around the first blank.
function clipQ(q: string): string {
  if (q.length <= MAX_Q) return q
  const i = q.indexOf(BLANK)
  const from = Math.max(0, i - 180), to = Math.min(q.length, i + BLANK.length + 180)
  return `${from > 0 ? "…" : ""}${q.slice(from, to).trim()}${to < q.length ? "…" : ""}`
}
const clipA = (a: string, max = MAX_A) => (a.length <= max ? a : a.slice(0, a.lastIndexOf(" ", max) > 0 ? a.lastIndexOf(" ", max) : max) + "…")

// ── cards ─────────────────────────────────────────────────────────────
// A short highlight inside a longer sentence: Q = the sentence with it blanked.
// null when the highlight is long, or is (nearly) the whole sentence.
export function clozeCard(h: Highlight): Card | null {
  const { pre, sel, post } = tidy(h)
  if (!sel || wordCount(sel) > CLOZE_MAX_WORDS) return null
  const sPre = pre.slice(lastSentenceStart(pre))
  const sPost = post.slice(0, firstSentenceEnd(post))
  // Nothing around it to ask with — except one side of "term - meaning",
  // "E = mc²" or a table row ("Mitochondria — _____").
  const paired = /(?:\s[-–—=]|:)\s*$/.test(sPre) || /^\s*(?:[-–—=]\s|:)/.test(sPost)
  if (wordCount(`${sPre} ${sPost}`) < (paired ? 1 : 2)) return null
  const q = squash(blankAll(sPre, sel) + BLANK + blankAll(sPost, sel))
  return { q: clipQ(q), a: sel, hint: "" }
}

// Cloze `term` inside a passage (all copies blanked); null if too little is left.
function clozeIn(passage: string, term: string): Card | null {
  const t = squash(trimTerm("", squash(term), "").sel)
  if (!t || wordCount(t) > CLOZE_MAX_WORDS) return null
  const q = blankAll(passage, t)
  if (!q.includes(BLANK) || wordCount(q.split(BLANK).join(" ")) < 2) return null
  return { q: clipQ(squash(q)), a: t, hint: "" }
}

// "Osmosis is the movement of water…" -> "What is osmosis?"
const PRONOUN = /^(it|this|that|these|those|they|he|she|there|here|which|what|who|we|you|i|one|some|many|most|all)\b/i
function definitionCard(passage: string): Card | null {
  const first = passage.slice(0, firstSentenceEnd(passage))
  const rest = squash(passage.slice(first.length))
  const m = /^(.{2,60}?)\s+(is|are|was|were|means|refers to)\s+(.+?)[.!?]*$/i.exec(first)
  if (!m) return null
  const [, subjectRaw, verbRaw, predicate] = m
  const subject = subjectRaw.replace(/^(The|A|An)\b/, w => w.toLowerCase()).replace(/[,:;]+$/, "")
  const verb = verbRaw.toLowerCase()
  if (wordCount(subject) > 5 || PRONOUN.test(subject) || /[,;]/.test(subject)) return null
  // "X is a/the …" reads as a definition; "X is released when…" doesn't.
  if (/^(is|are|was|were)$/.test(verb) && !/^(a|an|the|one of|any|each|called|known as|defined as)\b/i.test(predicate)) return null
  const q = verb === "means" ? `What does ${subject} mean?` : verb === "refers to" ? `What does ${subject} refer to?` : `What ${verb} ${subject}?`
  return { q, a: clipA(squash(`${predicate}${rest ? `. ${rest}` : ""}`), MAX_DEF_A), hint: "" }
}

const DULL = new Set(("important different something everything anything because therefore however although " +
  "including especially actually basically probably remember understand following example examples between " +
  "through without another several usually generally particular specific certain information describes described " +
  "question questions answer answers lecture chapter section definition definitions sometimes otherwise whatever " +
  "according together whenever wherever").split(" "))

// The term that looks most like the point: an acronym, a capitalised name mid-
// sentence, a number or year, else the longest uncommon word.
function keyTerm(passage: string): string | null {
  let best: { term: string; score: number; at: number } | null = null
  const consider = (term: string, score: number, at: number) => {
    if (!best || score > best.score || (score === best.score && at < best.at)) best = { term, score, at }
  }
  const sentenceStart = (at: number) => at === 0 || /(?:[.!?]["'”’)\]]*\s+|\n\s*)$/.test(passage.slice(0, at))
  for (const m of passage.matchAll(/\b[A-Z]{2,6}s?\b/g)) consider(m[0], 3.5, m.index ?? 0)
  for (const m of passage.matchAll(/\b[A-Z][\p{L}\p{N}'’-]*(?:\s+[A-Z][\p{L}\p{N}'’-]*){0,2}/gu)) {
    const at = m.index ?? 0
    if (!sentenceStart(at)) consider(m[0], 3 + m[0].split(/\s+/).length * 0.2, at)
  }
  for (const m of passage.matchAll(/\b\d{3,4}\b|\b\d+(?:\.\d+)?%/g)) consider(m[0], 2.5, m.index ?? 0)
  for (const m of passage.matchAll(/[\p{L}][\p{L}'’-]{7,}/gu)) {
    if (!DULL.has(m[0].toLowerCase())) consider(m[0], 1 + m[0].length / 10, m.index ?? 0)
  }
  const found = best as { term: string } | null
  return found && squash(found.term) !== squash(passage) ? found.term : null
}

// A whole sentence or passage, no AI: cloze an emphasized term, else a definition,
// else the key term, else ask what the notes say about it.
export function localCard(h: Highlight): Card {
  const t0 = tidy(h)
  const passage = squash(t0.sel ? t0.sel + (/^[.!?]+/.exec(t0.post)?.[0] ?? "") : h.selected) // keep its full stop
  for (const t of h.emphasized ?? []) { const c = clozeIn(passage, t); if (c) return c }
  const d = definitionCard(passage)
  if (d) return d
  const t = keyTerm(passage)
  const c = t ? clozeIn(passage, t) : null
  if (c) return c
  let head = passage.split(" ").slice(0, 6).join(" ")
  const max = CJK.test(head) ? 12 : 48 // CJK: ~12 characters, not 6 "words"
  if (head.length > max) head = head.slice(0, max === 12 ? 12 : 40)
  const cut = head.length < passage.length
  head = head.replace(/[.,;:!?。，；：！？]+$/u, "")
  return { q: `What do your notes say about “${head}${cut ? "…" : ""}”?`, a: clipA(passage), hint: "" }
}

// ── a whole line on its own ──────────────────────────────────────────
// "Lecture 7", "Ch. 3", "Week 2 notes": a heading, not the meaning of a term.
const HEADINGISH = /^(?:lecture|lec|chapter|ch|week|wk|unit|part|section|sec|module|lesson|session|class|day|exam|quiz|midterm|hw|lab)\.?\s*(?:\d+|[ivx]+\b)/i

// The notes under a line: the next few lines of the same text box.
function linesBelow(h: Highlight): string {
  const nl = h.after.indexOf("\n")
  const out: string[] = []
  for (const raw of `${nl >= 0 ? h.after.slice(nl) : ""}\n${h.below ?? ""}`.split("\n")) {
    const l = squash(raw)
    if (!hasWord(l)) continue
    out.push(l)
    if (out.length >= 4 || out.join(" ").length >= MAX_BELOW) break
  }
  return clipA(out.join("\n"), MAX_BELOW)
}

// A short highlight that is a whole line by itself — a heading, a lone term,
// "la manzana - the apple", "E = mc²" — where a cloze would have nothing left to
// ask with and the passage would answer itself:
//   "term - meaning" / "term: meaning" -> What does “term” mean? / meaning
//   "E = mc²"                          -> E = _____ / mc²
//   a heading or term                  -> What do your notes say about “X”? / the lines under it
// "none": a heading/term with nothing under it (no card worth making).
// null: not a whole short line, or it's a sentence (the usual cards handle those).
export function lineCard(h: Highlight): Card | "none" | null {
  const { pre, sel, post } = tidy(h)
  if (!sel || wordCount(sel) > CLOZE_MAX_WORDS) return null
  const lineAfter = post.split("\n")[0]
  if (hasWord(pre.slice(pre.lastIndexOf("\n") + 1)) || hasWord(lineAfter)) return null
  const dash = /^(.{1,60}?)\s+([-–—=])\s+(.+)$/u.exec(sel), colon = /^([^:]{1,60}?):\s+(.+)$/u.exec(sel)
  const pair = dash ? { left: dash[1], sep: dash[2], right: dash[3] } : colon ? { left: colon[1], sep: ":", right: colon[2] } : null
  const heading = !!h.heading || (!!pair && (HEADINGISH.test(pair.left) || HEADINGISH.test(pair.right)))
  if (pair && !heading && hasWord(pair.left) && hasWord(pair.right)) {
    const { left, sep, right } = pair
    // A formula or a date/number ("Battle of Hastings - 1066") reads best as a cloze.
    return sep === "=" || !/\p{L}{2}/u.test(right)
      ? { q: `${left}${sep === ":" ? ":" : ` ${sep}`} ${BLANK}`, a: right, hint: "" }
      : { q: `What does “${left}” mean?`, a: right, hint: "" }
  }
  // A full sentence on its own line ("Mitochondria make ATP.") isn't a term.
  if (!heading && (wordCount(sel) > 4 || /^[.!?。！？]/.test(lineAfter))) return null
  const below = linesBelow(h)
  return below ? { q: `What do your notes say about “${sel}”?`, a: below, hint: "" } : "none"
}

// The highlight's paragraph as plain text (AI context, topic matching).
export function paragraphOf(h: Highlight, max = 1500): string {
  const side = Math.floor((max - Math.min(h.selected.length, max)) / 2)
  return squash(`${side > 0 ? h.before.slice(-side) : ""}${h.selected.slice(0, max)}${h.after.slice(0, side)}`)
}

// ── topic ─────────────────────────────────────────────────────────────
export interface TopicCandidate { name: string; text: string; growing: boolean; last: number }

const STOP = new Set(("the and for are was were with that this from into have has had not but you your they them " +
  "their its our can will would could should about which what when where why how who than then also very more most " +
  "some such only each other these those there here been being does did just like").split(" "))
const stem = (w: string) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w)
function keywords(s: string): Set<string> {
  return new Set((s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter(w => !STOP.has(w)).map(stem))
}

// The notebook topic this highlight belongs to: the one whose name (most) and cards
// share words with it; ties go to a tree still growing, then the latest studied.
// No topic shares a word with it -> the notebook's own name.
export function pickTopic(cands: TopicCandidate[], context: string, fallback: string): string {
  const ctx = keywords(context)
  const overlap = (s: string) => { let n = 0; for (const w of keywords(s)) if (ctx.has(w)) n++; return n }
  const ranked = cands.filter(c => c.name.trim())
    .map(c => ({ c, score: 3 * overlap(c.name) + Math.min(5, overlap(c.text)) }))
    .filter(r => r.score > 0) // sharing nothing isn't "about" it: don't feed an unrelated tree
    .sort((x, y) => (y.score - x.score) || (Number(y.c.growing) - Number(x.c.growing)) || (y.c.last - x.c.last))
  return ranked[0]?.c.name.trim() || fallback.trim() || "Notes"
}

// "due tomorrow" / "due Friday" for the toast.
export function dueLabel(due: number, now: number): string {
  const day = (t: number) => { const d = new Date(t); d.setHours(12, 0, 0, 0); return d.getTime() }
  const days = Math.round((day(due) - day(now)) / 86_400_000)
  if (days <= 0) return "due today"
  if (days === 1) return "due tomorrow"
  return `due ${new Date(due).toLocaleDateString(undefined, { weekday: "long" })}`
}

// ── reading the highlight from the page (browser only) ────────────────
const BLOCK = /^(P|DIV|LI|H[1-6]|BLOCKQUOTE|PRE|TR|UL|OL|TABLE)$/

// Plain text of a node: <br> and block edges become newlines; table cells in a
// row are joined with " — " ("Mitochondria — Powerhouse of the cell").
function nodeText(root: Node): string {
  let out = ""
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) { out += n.nodeValue ?? ""; return }
    const el = n as HTMLElement
    if (el.tagName === "BR") { out += "\n"; return }
    if ((el.tagName === "TD" || el.tagName === "TH") && el.previousElementSibling) out += " — "
    const block = !!el.tagName && BLOCK.test(el.tagName)
    if (block) out += "\n"
    n.childNodes.forEach(walk)
    if (block) out += "\n"
  }
  walk(root)
  return out.replace(/ /g, " ")
}

// The highlight in `host` (a text box) with the rest of its paragraph. Reads only.
export function readHighlight(range: Range, host: HTMLElement): Highlight {
  const anc = range.commonAncestorContainer
  const start = anc.nodeType === Node.ELEMENT_NODE ? anc as HTMLElement : anc.parentElement
  let block: HTMLElement = host
  for (let el = start; el && el !== host && host.contains(el); el = el.parentElement) {
    if (BLOCK.test(el.tagName)) { block = el; break }
  }
  const side = (from: [Node, number], to: [Node, number]) => {
    const r = document.createRange()
    r.setStart(...from); r.setEnd(...to)
    return nodeText(r.cloneContents())
  }
  const before = side([block, 0], [range.startContainer, range.startOffset])
  const after = side([range.endContainer, range.endOffset], [block, block.childNodes.length])
  const below = block === host ? "" : side([block, block.childNodes.length], [host, host.childNodes.length]).slice(0, 2000)
  let heading = false
  for (let n: Node | null = range.startContainer; n && n !== host; n = n.parentNode) if (/^H[1-6]$/.test((n as HTMLElement).tagName ?? "")) heading = true
  const frag = range.cloneContents()
  const emphasized: string[] = []
  frag.querySelectorAll?.("b, strong, u, mark, [style*='background']").forEach(el => {
    const t = squash(el.textContent || "")
    if (t.length >= 2 && !emphasized.includes(t)) emphasized.push(t)
  })
  return { before, selected: nodeText(frag), after, emphasized, below, heading }
}
