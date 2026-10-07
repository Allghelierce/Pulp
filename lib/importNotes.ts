// Note import parser — turns .docx / .md / .txt / .html files (and pasted
// text) into plain-text sections. Each section becomes a notebook page and,
// via /api/import, a recall topic with cards.
// Browser-only (DOMParser, Blob, DecompressionStream). No dependencies.

export interface ImportSection { heading?: string; text: string } // plain text, paragraphs separated by "\n\n"
export interface ImportDoc { title: string; sections: ImportSection[]; words: number; truncated: boolean }

export const ACCEPTED_IMPORT_TYPES = ".docx,.md,.markdown,.txt,.html,.htm";
export const MAX_IMPORT_CHARS = 200_000;

const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MIN_SECTION_CHARS = 300;   // smaller sections merge into the next one
const MAX_SECTION_CHARS = 5000;  // bigger sections split at paragraph boundaries
const CHUNK_TARGET = 3500;       // chunk size when the doc has no headings
const MAX_HEADING_CHARS = 100;
const MAX_TITLE_CHARS = 200;
const DEFAULT_TITLE = "Imported notes";

type Block = { heading: boolean; text: string };
type Parsed = { blocks: Block[]; title?: string };

// ── Public API ───────────────────────────────────────────────────────────

export async function parseImportFile(file: File): Promise<ImportDoc> {
  const name = file.name || "";
  const ext = (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();
  const base = cleanTitle(name.replace(/\.[^.]+$/, ""));
  if (file.size > MAX_FILE_BYTES) throw new Error("That file is too big to import (max 30 MB).");
  if (file.size === 0) throw new Error("That file is empty.");

  let parsed: Parsed;
  switch (ext) {
    case "docx":
      parsed = await docxBlocks(await file.arrayBuffer());
      break;
    case "md":
    case "markdown":
      parsed = markdownBlocks(await readText(file));
      break;
    case "txt":
      parsed = { blocks: plainBlocks(await readText(file)) };
      break;
    case "html":
    case "htm":
      parsed = htmlBlocks(await readText(file));
      break;
    case "doc":
      throw new Error("Old .doc files aren't supported — open it in Word or Google Docs and save as .docx.");
    case "pdf":
      throw new Error("PDFs aren't supported yet — copy the text and use Paste instead.");
    case "gdoc":
      throw new Error("That's a Google Docs shortcut. In Google Docs use File → Download → Microsoft Word (.docx).");
    case "pages":
    case "odt":
    case "rtf":
      throw new Error(`.${ext} files aren't supported — export as .docx, or copy the text and use Paste.`);
    default:
      if (file.type.startsWith("text/")) { parsed = { blocks: plainBlocks(await readText(file)) }; break; }
      throw new Error("Unsupported file type. Try .docx, .md, .txt or .html.");
  }

  const doc = buildDoc(parsed.blocks, cleanTitle(parsed.title ?? "") || base || DEFAULT_TITLE);
  if (!doc.sections.length) throw new Error("Couldn't find any text in that file.");
  return doc;
}

export function parsePastedText(text: string, title?: string): ImportDoc {
  const src = normalize(text);
  // Pasted markdown (Notion / Obsidian copy) gets the markdown treatment.
  const parsed: Parsed = /^#{1,3}[ \t]+\S/m.test(src) ? markdownBlocks(src) : { blocks: plainBlocks(src) };
  return buildDoc(parsed.blocks, cleanTitle(title ?? "") || cleanTitle(parsed.title ?? "") || DEFAULT_TITLE);
}

export function sectionToHtml(section: ImportSection): string {
  const parts: string[] = [];
  if (section.heading) parts.push(`<h2 style="font-size:1.75rem;font-weight:700;margin:1rem 0">${escapeHtml(section.heading)}</h2>`);
  const paras = section.text.split(/\n{2,}/).map(p => p.replace(/^\n+|\s+$/g, "")).filter(p => p.trim());
  paras.forEach((p, i) => {
    if (i > 0) parts.push("<div><br></div>"); // blank line between paragraphs
    parts.push(`<div>${p.split("\n").map(escapeHtml).join("<br>")}</div>`);
  });
  return parts.join("");
}

// ── Sectioning ───────────────────────────────────────────────────────────

function buildDoc(blocks: Block[], title: string): ImportDoc {
  // Clean blocks + cap total size.
  const kept: Block[] = [];
  let total = 0;
  let truncated = false;
  for (const b of blocks) {
    const text = b.heading ? cleanHeading(b.text) : b.text.replace(/\n{3,}/g, "\n\n").replace(/^\n+|\s+$/g, "");
    if (!text.trim()) continue;
    if (total + text.length > MAX_IMPORT_CHARS) {
      truncated = true;
      const room = MAX_IMPORT_CHARS - total;
      if (!b.heading && room > 200) kept.push({ heading: false, text: hardSplit(text, room)[0] });
      break;
    }
    total += text.length + 2;
    // Consecutive bullet paragraphs read as one list.
    const prev = kept[kept.length - 1];
    if (prev && !prev.heading && !b.heading && text.startsWith("• ") && /(^|\n)• [^\n]*$/.test(prev.text) && prev.text.length + text.length < 1500) {
      prev.text += "\n" + text;
    } else {
      kept.push({ heading: b.heading, text });
    }
  }

  // A leading H1 that's just the doc title (it becomes the notebook name)
  // shouldn't swallow the first real section's heading.
  if (kept.length > 1 && kept[0].heading && kept[1].heading && kept[0].text === title) kept.shift();

  let sections: ImportSection[];
  if (!kept.some(b => b.heading)) {
    sections = chunkParagraphs(kept.flatMap(b => paragraphs(b.text)), CHUNK_TARGET).map(text => ({ text }));
  } else {
    // Split at headings.
    const raw: ImportSection[] = [];
    let cur: ImportSection | null = null;
    for (const b of kept) {
      if (b.heading) { if (cur) raw.push(cur); cur = { heading: b.text, text: "" }; }
      else { if (!cur) cur = { text: "" }; cur.text = join(cur.text, b.text); }
    }
    if (cur) raw.push(cur);

    // Merge short sections forward.
    const merged: ImportSection[] = [];
    let carry: ImportSection | null = null;
    raw.forEach((s, i) => {
      const next: ImportSection = carry ? mergeForward(carry, s) : s;
      carry = null;
      if (next.text.length < MIN_SECTION_CHARS && i < raw.length - 1) carry = next;
      else merged.push(next);
    });
    // A short trailing section folds back into the previous one.
    if (merged.length > 1 && merged[merged.length - 1].text.length < MIN_SECTION_CHARS) {
      const last = merged.pop()!;
      const prev = merged[merged.length - 1];
      merged[merged.length - 1] = section(prev.heading, join(prev.text, last.heading, last.text));
    }
    sections = merged.flatMap(splitSection);
  }

  sections = sections
    .map(s => section(s.heading, s.text.trim()))
    .filter(s => s.text);
  const words = sections.reduce((n, s) => n + countWords(s.heading ?? "") + countWords(s.text), 0);
  return { title, sections, words, truncated };
}

function mergeForward(a: ImportSection, b: ImportSection): ImportSection {
  // A heading-less preamble adopts the next heading; otherwise the next
  // heading survives as a line of text.
  if (!a.heading) return section(b.heading, join(a.text, b.text));
  return section(a.heading, join(a.text, b.heading, b.text));
}

function splitSection(s: ImportSection): ImportSection[] {
  if (s.text.length <= MAX_SECTION_CHARS) return [s];
  const n = Math.ceil(s.text.length / MAX_SECTION_CHARS);
  const parts = chunkParagraphs(paragraphs(s.text), Math.ceil(s.text.length / n));
  return parts.map((text, i) => section(s.heading && i > 0 ? `${s.heading} (${i + 1})` : s.heading, text));
}

/** Greedy chunking at paragraph boundaries; every chunk ≤ MAX_SECTION_CHARS. */
function chunkParagraphs(paras: string[], target: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const p0 of paras) {
    for (const p of hardSplit(p0, Math.min(target, MAX_SECTION_CHARS))) {
      const size = cur.length + 2 + p.length;
      // Break where the chunk lands closest to target; never exceed the max.
      if (cur && (size > MAX_SECTION_CHARS || (size > target && size - target > target - cur.length))) { out.push(cur); cur = p; }
      else cur = cur ? cur + "\n\n" + p : p;
    }
  }
  if (cur) {
    const prev = out[out.length - 1];
    if (prev && cur.length < MIN_SECTION_CHARS && prev.length + 2 + cur.length <= MAX_SECTION_CHARS) out[out.length - 1] = prev + "\n\n" + cur;
    else out.push(cur);
  }
  return out;
}

/** Splits one oversized paragraph at sentence ends / whitespace. */
function hardSplit(p: string, max: number): string[] {
  const out: string[] = [];
  let rest = p;
  while (rest.length > max) {
    const window = rest.slice(0, max);
    const floor = Math.floor(max * 0.6);
    let cut = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "), window.lastIndexOf("\n"));
    if (cut >= floor) cut += 1;
    else {
      cut = window.lastIndexOf(" ");
      if (cut < floor) cut = max;
    }
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out.filter(Boolean);
}

// ── .docx ────────────────────────────────────────────────────────────────

async function docxBlocks(buf: ArrayBuffer): Promise<Parsed> {
  const data = await readZipEntry(buf, "word/document.xml");
  if (!data) throw new Error("That .docx looks damaged (no document inside).");
  const xml = new TextDecoder("utf-8").decode(data);
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("That .docx looks damaged and couldn't be read.");

  const blocks: Block[] = [];
  let title: string | undefined;
  let firstH1: string | undefined;

  const handlePara = (p: Element) => {
    const { text, nested } = docxParaText(p);
    const pPr = childByTag(p, "w:pPr");
    const style = (pPr && childByTag(pPr, "w:pStyle")?.getAttribute("w:val")) || "";
    const isList = !!(pPr && childByTag(pPr, "w:numPr"));
    if (text.trim()) {
      if (/^title$/i.test(style)) {
        if (!title) title = text; // the doc title, not a section
        else blocks.push({ heading: true, text });
      } else if (/^heading/i.test(style)) {
        if (!firstH1 && /^heading\s*1$/i.test(style)) firstH1 = text;
        blocks.push({ heading: true, text });
      } else {
        blocks.push({ heading: false, text: isList ? "• " + text.trim() : text });
      }
    }
    nested.forEach(visit); // text boxes
  };

  const visit = (el: Element) => {
    for (const c of Array.from(el.children)) {
      switch (c.tagName) {
        case "w:p": handlePara(c); break;
        case "w:tr": {
          // Table row → one "a | b | c" line (vocab tables stay readable).
          const cells = Array.from(c.children)
            .filter(tc => tc.tagName === "w:tc")
            .map(tc => Array.from(tc.getElementsByTagName("w:p")).map(p => docxParaText(p).text.trim()).filter(Boolean).join(" "));
          if (cells.some(Boolean)) blocks.push({ heading: false, text: cells.join(" | ") });
          break;
        }
        case "w:sectPr": case "mc:Fallback": case "w:del": break;
        default: visit(c);
      }
    }
  };

  visit(doc.getElementsByTagName("w:body")[0] ?? doc.documentElement);
  return { blocks, title: title ?? firstH1 };
}

function docxParaText(p: Element): { text: string; nested: Element[] } {
  let out = "";
  const nested: Element[] = [];
  const walk = (el: Element) => {
    for (const c of Array.from(el.children)) {
      switch (c.tagName) {
        case "w:t": out += c.textContent ?? ""; break;
        case "w:tab": out += "\t"; break;
        case "w:br": case "w:cr": out += "\n"; break;
        case "w:noBreakHyphen": out += "-"; break;
        case "w:txbxContent": nested.push(c); break;
        case "w:pPr": case "w:rPr": case "mc:Fallback": case "w:del": case "w:delText": case "w:instrText": break;
        default: walk(c);
      }
    }
  };
  walk(p);
  return { text: out.replace(/[ \t]+$/gm, "").replace(/\s+$/, ""), nested };
}

function childByTag(el: Element, tag: string): Element | null {
  for (const c of Array.from(el.children)) if (c.tagName === tag) return c;
  return null;
}

/** Minimal zip reader: EOCD → central directory → local header → data. */
async function readZipEntry(buf: ArrayBuffer, wanted: string): Promise<Uint8Array | null> {
  const bytes = new Uint8Array(buf);
  const dv = new DataView(buf);
  const notDocx = () => new Error("That doesn't look like a real .docx file.");
  const damaged = () => new Error("That .docx looks damaged and couldn't be read.");
  if (bytes.length < 22 || dv.getUint32(0, true) !== 0x04034b50) throw notDocx();

  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw damaged();

  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder("utf-8");
  for (let n = 0; n < count; n++) {
    if (p + 46 > bytes.length || dv.getUint32(p, true) !== 0x02014b50) throw damaged();
    const flags = dv.getUint16(p + 8, true);
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    if (name === wanted) {
      if (flags & 1) throw new Error("That .docx is password-protected — remove the password and try again.");
      if (local + 30 > bytes.length || dv.getUint32(local, true) !== 0x04034b50) throw damaged();
      const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
      const data = bytes.subarray(start, start + csize);
      if (data.length !== csize) throw damaged();
      if (method === 0) return data;
      if (method === 8) return inflateRaw(data);
      throw damaged();
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser can't open .docx files — try a newer Chrome, Edge, Firefox or Safari, or paste the text instead.");
  }
  try {
    const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    throw new Error("That .docx looks damaged and couldn't be read.");
  }
}

// ── Markdown ─────────────────────────────────────────────────────────────

function markdownBlocks(src: string): Parsed {
  let lines = normalize(src).split("\n");
  // YAML front matter (Obsidian / Notion exports).
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((l, i) => i > 0 && /^(---|\.\.\.)\s*$/.test(l));
    if (end > 0) lines = lines.slice(end + 1);
  }

  const blocks: Block[] = [];
  let title: string | undefined;
  let para: string[] = [];
  let inFence = false;
  const flush = () => {
    const t = para.join("\n").replace(/^\n+|\s+$/g, "");
    if (t.trim()) blocks.push({ heading: false, text: t });
    para = [];
  };

  for (const raw of lines) {
    if (/^\s*(```|~~~)/.test(raw)) { inFence = !inFence; continue; } // keep code, drop fences
    if (inFence) { para.push(raw.replace(/\s+$/, "")); continue; }
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) { flush(); continue; }

    const h = line.match(/^\s{0,3}(#{1,6})\s+(.*?)(\s+#+)?$/);
    if (h) {
      flush();
      const text = inlineMd(h[2]).trim();
      if (!text) continue;
      if (h[1].length <= 3) {
        if (h[1].length === 1 && !title) title = text;
        blocks.push({ heading: true, text });
      } else {
        blocks.push({ heading: false, text });
      }
      continue;
    }
    if (/^\s{0,3}([-*_])(\s*\1){2,}$/.test(line)) { flush(); continue; }       // horizontal rule
    if (/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line)) continue;  // table separator row

    let l = line.replace(/^(\s{0,3}>\s?)+/, "");                                // blockquote
    const bullet = l.match(/^(\s*)[-*+]\s+(?:\[[ xX]\]\s+)?(.*)$/);
    if (bullet) l = bullet[1] + "• " + bullet[2];
    else l = l.replace(/^\s*\|(.*)\|$/, (_, row: string) => row.split("|").map(c => c.trim()).join(" | ")); // table row
    para.push(inlineMd(l));
  }
  flush();
  return { blocks, title };
}

function inlineMd(s: string): string {
  return s
    .replace(/!\[\[[^\]]*\]\]/g, "")                               // Obsidian embeds
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")                  // [[page|alias]]
    .replace(/\[\[([^\]]+)\]\]/g, "$1")                              // [[page]]
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")                        // images → alt
    .replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, "$1")          // [text](url)
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")                        // [text][ref]
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(?=\S)(.*?\S)\1/g, "$2")
    .replace(/(^|[^\w*])\*(?=\S)([^*]*?\S)\*(?!\w)/g, "$1$2")
    .replace(/(^|[^\w])_(?=\S)([^_]*?\S)_(?!\w)/g, "$1$2")
    .replace(/~~(?=\S)(.*?\S)~~/g, "$1")
    .replace(/==(?=\S)(.*?\S)==/g, "$1")                             // Obsidian highlight
    .replace(/<\/?(?:span|div|br|b|i|u|em|strong|mark|sup|sub|font|a|p|img|kbd|code|s|del|ins|small|hr)(?:\s+[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s<>]+))*\s*\/?>/gi, "") // stray inline HTML: known tags with attr=value only, so "x<y and y>z" / "x<a or b>c" survive
    .replace(/\\([\\`*_{}[\]()#+\-.!|~])/g, "$1");                   // escapes
}

// ── Plain text ───────────────────────────────────────────────────────────

function plainBlocks(src: string): Block[] {
  const paras = normalize(src)
    .split(/\n[ \t]*\n+/)
    .map(p => p.replace(/^\n+|\s+$/g, ""))
    .filter(p => p.trim());
  // Heading = a lone short line between blank lines, not ending like a sentence.
  const isCandidate = (p: string, i: number) =>
    i < paras.length - 1 &&
    !p.includes("\n") &&
    p.trim().length <= 60 &&
    !/[.,;]$/.test(p) &&
    !/^\s*[•\-*]/.test(p) &&
    /\p{L}/u.test(p);
  const flags = paras.map(isCandidate);
  const count = flags.filter(Boolean).length;
  // Mostly short lines (poems, lists) → no headings, just chunk.
  const useHeadings = count > 0 && count * 2 <= paras.length;
  return paras.map((text, i) => ({ heading: useHeadings && flags[i], text: useHeadings && flags[i] ? text.trim() : text }));
}

// ── HTML ─────────────────────────────────────────────────────────────────

const HTML_BLOCK = new Set([
  "P", "DIV", "SECTION", "ARTICLE", "MAIN", "HEADER", "FOOTER", "ASIDE", "NAV", "UL", "OL", "DL", "DT", "DD",
  "BLOCKQUOTE", "FIGURE", "FIGCAPTION", "TABLE", "THEAD", "TBODY", "TFOOT", "H4", "H5", "H6", "HR", "ADDRESS",
  "DETAILS", "SUMMARY", "FORM", "FIELDSET", "CENTER", "BODY",
]);
const HTML_SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "SVG", "IFRAME", "OBJECT", "HEAD", "TITLE", "BUTTON", "SELECT", "CANVAS", "IMG"]);

function htmlBlocks(src: string): Parsed {
  const doc = new DOMParser().parseFromString(src, "text/html");
  const blocks: Block[] = [];
  let firstH1: string | undefined;
  let pTitle: string | undefined;
  let buf = "";

  const flush = () => {
    const t = buf.split("\n").map(l => l.replace(/\s+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (t && t !== "•") blocks.push({ heading: false, text: t });
    buf = "";
  };
  const textOf = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ").trim();

  const walk = (node: Node) => {
    for (const c of Array.from(node.childNodes)) {
      if (c.nodeType === Node.TEXT_NODE) { buf += (c.textContent ?? "").replace(/\s+/g, " "); continue; }
      if (c.nodeType !== Node.ELEMENT_NODE) continue;
      const el = c as Element;
      const tag = el.tagName.toUpperCase();
      if (HTML_SKIP.has(tag)) continue;
      if (tag === "BR") { buf += "\n"; continue; }
      if (tag === "H1" || tag === "H2" || tag === "H3") {
        flush();
        const t = textOf(el);
        if (t) { if (tag === "H1" && !firstH1) firstH1 = t; blocks.push({ heading: true, text: t }); }
        continue;
      }
      if (tag === "PRE") { flush(); const t = (el.textContent ?? "").replace(/\s+$/, ""); if (t.trim()) blocks.push({ heading: false, text: t }); continue; }
      if (tag === "LI") { flush(); buf = "• "; walk(el); flush(); continue; }
      if (tag === "TR") {
        flush();
        const cells = Array.from(el.children).filter(td => /^T[DH]$/i.test(td.tagName)).map(textOf);
        if (cells.some(Boolean)) blocks.push({ heading: false, text: cells.join(" | ") });
        continue;
      }
      if (tag === "P" && el.classList.contains("title") && !pTitle) { flush(); pTitle = textOf(el); continue; } // Google Docs "Title" style
      if (HTML_BLOCK.has(tag)) { flush(); walk(el); flush(); continue; }
      walk(el); // inline
    }
  };

  walk(doc.body ?? doc.documentElement);
  flush();
  const docTitle = doc.querySelector("title")?.textContent?.trim();
  return { blocks, title: pTitle || firstH1 || docTitle || undefined };
}

// ── Helpers ──────────────────────────────────────────────────────────────

async function readText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Word's "Save as .txt" can produce UTF-16.
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes);
  // Strict UTF-8 first (strips a BOM); Notepad/old Word "Save as .txt" is often
  // Windows-1252, which would otherwise turn accents/smart quotes into U+FFFD.
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { return new TextDecoder("windows-1252").decode(bytes); }
}

function normalize(s: string): string {
  return s.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/\u00A0/g, " ").replace(/[\u200B\u200C\u200D\u2060]/g, "");
}

function paragraphs(text: string): string[] {
  return text.split(/\n{2,}/).map(p => p.replace(/^\n+|\s+$/g, "")).filter(p => p.trim());
}

function join(...parts: (string | undefined)[]): string {
  return parts.filter((p): p is string => !!p && !!p.trim()).join("\n\n");
}

function section(heading: string | undefined, text: string): ImportSection {
  return heading ? { heading, text } : { text };
}

function cleanHeading(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > MAX_HEADING_CHARS ? t.slice(0, MAX_HEADING_CHARS - 1).trimEnd() + "…" : t;
}

function cleanTitle(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE_CHARS);
}

function countWords(s: string): number {
  return s.match(/\S+/g)?.length ?? 0;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
