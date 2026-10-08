// Note import parser — turns pasted rich text (Google Docs, Word, Notion, Apple
// Notes, OneNote, web pages), pasted plain text / markdown, and .docx / .md /
// .txt / .html files into sections. Each section becomes a notebook page
// (rich HTML: headings, lists, bold/italic, links, tables) and, via /api/import,
// a recall topic (plain text for the AI).
// Browser-only (DOMParser, Blob, DecompressionStream). No dependencies.

/** `text`: plain text, paragraphs separated by "\n\n" (sent to the AI). `html`: the page body. */
export interface ImportSection { heading?: string; text: string; html?: string }
export interface ImportDoc { title: string; sections: ImportSection[]; words: number; truncated: boolean }

export const ACCEPTED_IMPORT_TYPES = ".docx,.md,.markdown,.txt,.html,.htm";
export const MAX_IMPORT_CHARS = 200_000;

const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MIN_SECTION_CHARS = 300;   // smaller sections merge into the next one
const MAX_SECTION_CHARS = 5000;  // bigger sections split at block boundaries
const CHUNK_TARGET = 3500;       // chunk size when the doc has no headings
const MAX_HEADING_CHARS = 100;
const MAX_TITLE_CHARS = 200;
const DEFAULT_TITLE = "Imported notes";

// A run of content. Headings (level 1–3) split pages; everything else is page body.
// Consecutive blocks sharing a `wrap` (list items, table rows) render inside one
// <ul>/<ol>/<table>, so long lists and tables can split across pages between items.
type Wrap = { id: number; open: string; close: string };
type Block = {
  level?: number;   // 1–3 → section heading (text = heading); html unused
  text: string;     // plain text: AI input + sizing
  html: string;     // page HTML for this block
  gap?: boolean;    // a blank line before it on the page
  wrap?: Wrap;
  meta?: { bold: boolean; size: number }; // HTML sources: infer headings when there are no h1–h3
};
type Parsed = { blocks: Block[]; title?: string };
type ListItem = { level: number; ordered: boolean; html: string; text: string };

const SPACER = "<div><br></div>";
const headingHtml = (t: string) => `<h2 style="font-size:1.75rem;font-weight:700;margin:1rem 0">${escapeHtml(t)}</h2>`;
const subheadHtml = (t: string) => `<h3 style="font-size:1.25rem;font-weight:700;margin:0.75rem 0 0.25rem">${escapeHtml(t)}</h3>`;
const textHtml = (t: string) => `<div>${t.split("\n").map(escapeHtml).join("<br>")}</div>`;
const QUOTE_OPEN = '<blockquote style="border-left:3px solid rgba(128,128,128,.45);margin:0.25rem 0;padding-left:0.75rem">';
const TABLE_OPEN = '<table style="border-collapse:collapse;margin:0.25rem 0">';
const CELL_OPEN = '<td style="border:1px solid rgba(128,128,128,.35);padding:4px 8px;vertical-align:top">';

let wrapSeq = 0;
const listWrap = (ordered: boolean): Wrap => ({ id: ++wrapSeq, open: ordered ? "<ol>" : "<ul>", close: ordered ? "</ol>" : "</ul>" });
const tableWrap = (): Wrap => ({ id: ++wrapSeq, open: TABLE_OPEN, close: "</table>" });
const subBlock = (t: string): Block => ({ text: t, html: subheadHtml(t), gap: true });

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
      throw new Error("That's a Google Docs shortcut. Open it, select all, copy, and use Paste — or File → Download → Microsoft Word (.docx).");
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
  // Pasted markdown (Obsidian, Notion "copy as markdown") gets the markdown treatment.
  let parsed: Parsed;
  if (/^#{1,3}[ \t]+\S/m.test(src)) parsed = markdownBlocks(src);
  else {
    const blocks = plainBlocks(src);
    // "Economics Notes" on its own line right above the first heading is the doc title.
    parsed = { blocks, title: blocks[0]?.level && blocks[1]?.level ? blocks[0].text.trim() : undefined };
  }
  return buildDoc(parsed.blocks, cleanTitle(title ?? "") || cleanTitle(parsed.title ?? "") || DEFAULT_TITLE);
}

/**
 * Rich paste (the clipboard's text/html — Google Docs, Word, Notion, Apple Notes,
 * OneNote, web pages): keeps headings → pages, lists, bold/italic, links, tables,
 * and the source's paragraph spacing. Falls back to the plain text when the HTML
 * carries no structure.
 */
export function parsePastedHtml(html: string, plainText: string, title?: string): ImportDoc {
  if (!hasStructure(html)) return parsePastedText(plainText || htmlToPlain(html), title);
  const parsed = htmlBlocks(html);
  const doc = buildDoc(parsed.blocks, cleanTitle(title ?? "") || cleanTitle(parsed.title ?? "") || DEFAULT_TITLE);
  return doc.sections.length ? doc : parsePastedText(plainText, title);
}

export function sectionToHtml(section: ImportSection): string {
  const head = section.heading ? headingHtml(section.heading) : "";
  if (section.html != null) return head + section.html;
  // Plain sections (older callers): one blank line between paragraphs.
  return head + paragraphs(section.text).map(textHtml).join(SPACER);
}

// ── Sectioning ───────────────────────────────────────────────────────────

type Sec = { heading?: string; blocks: Block[] };
const blocksLen = (bs: Block[]) => bs.reduce((n, b, i) => n + b.text.length + (i ? 2 : 0), 0);

function buildDoc(input: Block[], title: string): ImportDoc {
  // Clean blocks + cap total size.
  const kept: Block[] = [];
  let total = 0;
  let truncated = false;
  for (const b0 of input) {
    const text = b0.level ? cleanHeading(b0.text) : b0.text.replace(/\n{3,}/g, "\n\n").replace(/^\n+|\s+$/g, "");
    if (!text.trim()) continue;
    const b: Block = { ...b0, text };
    if (total + text.length > MAX_IMPORT_CHARS) {
      truncated = true;
      const room = MAX_IMPORT_CHARS - total;
      if (!b.level && room > 200) {
        const t = hardSplit(text, room)[0];
        kept.push({ ...b, text: t, html: plainHtmlLike(b, t) });
      }
      break;
    }
    total += text.length + 2;
    kept.push(b);
  }

  // A leading H1 that's just the doc title (it becomes the notebook name)
  // shouldn't swallow the first real section's heading.
  if (kept.length > 1 && kept[0].level && kept[1].level && kept[0].text === title) kept.shift();

  let secs: Sec[];
  if (!kept.some(b => b.level)) {
    secs = chunkBlocks(kept, CHUNK_TARGET).map(blocks => ({ blocks }));
  } else {
    // Split at headings.
    const raw: Sec[] = [];
    let cur: Sec | null = null;
    for (const b of kept) {
      if (b.level) { if (cur) raw.push(cur); cur = { heading: b.text, blocks: [] }; }
      else { if (!cur) cur = { blocks: [] }; cur.blocks.push(b); }
    }
    if (cur) raw.push(cur);

    // Merge short sections forward.
    const merged: Sec[] = [];
    let carry: Sec | null = null;
    raw.forEach((s, i) => {
      const next: Sec = carry ? mergeForward(carry, s) : s;
      carry = null;
      if (blocksLen(next.blocks) < MIN_SECTION_CHARS && i < raw.length - 1) carry = next;
      else merged.push(next);
    });
    // A short trailing section folds back into the previous one.
    if (merged.length > 1 && blocksLen(merged[merged.length - 1].blocks) < MIN_SECTION_CHARS) {
      const last = merged.pop()!;
      const prev = merged[merged.length - 1];
      merged[merged.length - 1] = { heading: prev.heading, blocks: [...prev.blocks, ...(last.heading ? [subBlock(last.heading)] : []), ...last.blocks] };
    }
    secs = merged.flatMap(splitSection);
  }

  const sections: ImportSection[] = [];
  for (const s of secs) {
    const text = blocksToText(s.blocks).trim();
    if (!text) continue;
    const sec: ImportSection = { text, html: blocksToHtml(s.blocks) };
    if (s.heading) sec.heading = s.heading;
    sections.push(sec);
  }
  const words = sections.reduce((n, s) => n + countWords(s.heading ?? "") + countWords(s.text), 0);
  return { title, sections, words, truncated };
}

function mergeForward(a: Sec, b: Sec): Sec {
  // A heading-less preamble adopts the next heading; otherwise the next
  // heading survives as a sub-heading inside the page.
  if (!a.heading) return { heading: b.heading, blocks: [...a.blocks, ...b.blocks] };
  return { heading: a.heading, blocks: [...a.blocks, ...(b.heading ? [subBlock(b.heading)] : []), ...b.blocks] };
}

function splitSection(s: Sec): Sec[] {
  const len = blocksLen(s.blocks);
  if (len <= MAX_SECTION_CHARS) return [s];
  const n = Math.ceil(len / MAX_SECTION_CHARS);
  const parts = chunkBlocks(s.blocks, Math.ceil(len / n));
  return parts.map((blocks, i) => ({ heading: s.heading && i > 0 ? `${s.heading} (${i + 1})` : s.heading, blocks }));
}

/** Greedy chunking at block boundaries; every chunk ≤ MAX_SECTION_CHARS. */
function chunkBlocks(blocks: Block[], target: number): Block[][] {
  const out: Block[][] = [];
  let cur: Block[] = [];
  let curLen = 0;
  for (const b0 of blocks) {
    for (const b of splitBlock(b0, Math.min(target, MAX_SECTION_CHARS))) {
      const size = curLen + 2 + b.text.length;
      // Break where the chunk lands closest to target; never exceed the max.
      if (cur.length && (size > MAX_SECTION_CHARS || (size > target && size - target > target - curLen))) {
        out.push(cur); cur = [b]; curLen = b.text.length;
      } else {
        curLen = cur.length ? size : b.text.length;
        cur.push(b);
      }
    }
  }
  if (cur.length) {
    const prev = out[out.length - 1];
    if (prev && curLen < MIN_SECTION_CHARS && blocksLen(prev) + 2 + curLen <= MAX_SECTION_CHARS) prev.push(...cur);
    else out.push(cur);
  }
  return out;
}

/** One oversized block → plain pieces (formatting is dropped only for these rare giants). */
function splitBlock(b: Block, max: number): Block[] {
  if (b.text.length <= max) return [b];
  return hardSplit(b.text, max).map((t, i) => ({ ...b, text: t, html: plainHtmlLike(b, t), gap: i === 0 ? b.gap : false }));
}

function plainHtmlLike(b: Block, t: string): string {
  if (b.wrap?.close === "</table>") return `<tr>${CELL_OPEN}${t.split("\n").map(escapeHtml).join("<br>")}</td></tr>`;
  if (b.wrap) return `<li>${t.split("\n").map(escapeHtml).join("<br>")}</li>`;
  return textHtml(t);
}

function blocksToHtml(blocks: Block[]): string {
  let out = "";
  for (let i = 0; i < blocks.length;) {
    const b = blocks[i];
    if (out && b.gap) out += SPACER;
    if (b.wrap) {
      let inner = "";
      let j = i;
      while (j < blocks.length && blocks[j].wrap?.id === b.wrap.id) inner += blocks[j++].html;
      out += b.wrap.open + inner + b.wrap.close;
      i = j;
    } else {
      out += b.html;
      i++;
    }
  }
  return out;
}

function blocksToText(blocks: Block[]): string {
  return blocks.map((b, i) => {
    if (i === 0) return b.text;
    const prev = blocks[i - 1];
    return (prev.wrap && b.wrap && prev.wrap.id === b.wrap.id ? "\n" : "\n\n") + b.text;
  }).join("");
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

// ── Lists (shared by every source) ───────────────────────────────────────

/**
 * Flat items with nesting levels (any numbers — only their order matters) →
 * one block per top-level item; deeper items nest inside it. A switch between
 * bullets and numbers at the top level starts a new list.
 */
function listBlocks(items: ListItem[], gap?: boolean): Block[] {
  type Node = ListItem & { kids: Node[] };
  const roots: Node[] = [];
  const stack: Node[] = [];
  for (const it of items) {
    const node: Node = { ...it, kids: [] };
    while (stack.length && stack[stack.length - 1].level >= it.level) stack.pop();
    if (stack.length) stack[stack.length - 1].kids.push(node);
    else roots.push(node);
    stack.push(node);
  }
  const renderKids = (kids: Node[]): string => {
    if (!kids.length) return "";
    const ordered = kids[0].ordered;
    return (ordered ? "<ol>" : "<ul>") + kids.map(k => `<li>${k.html}${renderKids(k.kids)}</li>`).join("") + (ordered ? "</ol>" : "</ul>");
  };
  const textOf = (n: Node, depth: number, idx: number): string =>
    `${"  ".repeat(depth)}${n.ordered ? `${idx + 1}.` : depth ? "◦" : "•"} ${n.text}` +
    n.kids.map((k, i) => "\n" + textOf(k, depth + 1, i)).join("");

  const out: Block[] = [];
  let wrap: Wrap | null = null;
  let idx = 0;
  roots.forEach((r, i) => {
    if (!wrap || (wrap.open === "<ol>") !== r.ordered) { wrap = listWrap(r.ordered); idx = 0; }
    out.push({ text: textOf(r, 0, idx++), html: `<li>${r.html}${renderKids(r.kids)}</li>`, wrap, gap: i === 0 ? gap : undefined });
  });
  return out;
}

// ── .docx ────────────────────────────────────────────────────────────────

const HEADING_STYLE = /^(heading|berschrift|titre|t[ií]tulo|titolo|kop)\s*(\d)/i;

async function docxBlocks(buf: ArrayBuffer): Promise<Parsed> {
  const data = await readZipEntry(buf, "word/document.xml");
  if (!data) throw new Error("That .docx looks damaged (no document inside).");
  const doc = parseXml(data);
  if (!doc) throw new Error("That .docx looks damaged and couldn't be read.");
  // Optional parts: list formats, hyperlink targets, paragraph spacing.
  const numbering = parseXml(await readZipEntry(buf, "word/numbering.xml").catch(() => null));
  const rels = parseXml(await readZipEntry(buf, "word/_rels/document.xml.rels").catch(() => null));
  const styles = parseXml(await readZipEntry(buf, "word/styles.xml").catch(() => null));
  const isOrdered = numberingFormats(numbering);
  const links = relTargets(rels);
  const spacingFor = styleSpacing(styles);

  const blocks: Block[] = [];
  let title: string | undefined;
  let firstH1: string | undefined;
  let items: ListItem[] = [];
  let listGap = false;
  let prevAfter = 0;
  let pendingGap = false;

  const flushList = () => {
    if (items.length) blocks.push(...listBlocks(items, listGap));
    items = [];
  };
  const gapNow = (before: number) => {
    const g = blocks.length > 0 && (pendingGap || prevAfter >= 100 || before >= 100); // twips (100 ≈ 5pt)
    pendingGap = false;
    return g;
  };

  const handlePara = (p: Element) => {
    const { text, html, nested } = docxPara(p, links);
    const pPr = childByTag(p, "w:pPr");
    const style = (pPr && childByTag(pPr, "w:pStyle")?.getAttribute("w:val")) || "";
    const numPr = pPr && childByTag(pPr, "w:numPr");
    const sp = spacingFor(style, pPr);
    if (text.trim()) {
      const h = HEADING_STYLE.exec(style);
      if (/^title$/i.test(style)) {
        flushList();
        if (!title) title = text.trim(); // the doc title, not a section
        else blocks.push({ level: 1, text, html: "" });
      } else if (h) {
        flushList();
        const level = Number(h[2]) || 1;
        if (level === 1 && !firstH1) firstH1 = text.trim();
        if (level <= 3) blocks.push({ level, text, html: "" });
        else { gapNow(sp.before); blocks.push(subBlock(text.trim())); }
      } else if (/^subtitle$/i.test(style)) {
        flushList();
        blocks.push({ ...subBlock(text.trim()), gap: gapNow(sp.before) });
      } else if (numPr) {
        const ilvl = Number(childByTag(numPr, "w:ilvl")?.getAttribute("w:val") ?? 0);
        const numId = childByTag(numPr, "w:numId")?.getAttribute("w:val") ?? "";
        if (!items.length) listGap = gapNow(sp.before);
        items.push({ level: ilvl, ordered: isOrdered(numId, ilvl), html, text: text.trim() });
      } else {
        flushList();
        blocks.push({ text, html: `<div>${html}</div>`, gap: gapNow(sp.before) });
      }
      prevAfter = sp.after;
    } else {
      pendingGap = blocks.length > 0 || items.length > 0; // an empty paragraph is a blank line
    }
    nested.forEach(visit); // text boxes
  };

  const handleTable = (tbl: Element) => {
    flushList();
    const wrap = tableWrap();
    let first = true;
    for (const tr of Array.from(tbl.children).filter(c => c.tagName === "w:tr")) {
      const cells = Array.from(tr.children)
        .filter(tc => tc.tagName === "w:tc")
        .map(tc => Array.from(tc.getElementsByTagName("w:p")).map(p => docxPara(p, links)).filter(x => x.text.trim()));
      if (!cells.some(c => c.length)) continue;
      blocks.push({
        text: cells.map(c => c.map(x => x.text.trim()).join(" ")).join(" | "),
        html: `<tr>${cells.map(c => CELL_OPEN + c.map(x => x.html).join("<br>") + "</td>").join("")}</tr>`,
        wrap,
        gap: first ? gapNow(0) || blocks.length > 0 : undefined,
      });
      first = false;
    }
    prevAfter = 100;
  };

  const visit = (el: Element) => {
    for (const c of Array.from(el.children)) {
      switch (c.tagName) {
        case "w:p": handlePara(c); break;
        case "w:tbl": handleTable(c); break;
        case "w:sectPr": case "mc:Fallback": case "w:del": break;
        default: visit(c);
      }
    }
  };

  visit(doc.getElementsByTagName("w:body")[0] ?? doc.documentElement);
  flushList();
  return { blocks, title: title ?? firstH1 };
}

function docxPara(p: Element, links: Record<string, string>): { text: string; html: string; nested: Element[] } {
  let text = "";
  let html = "";
  const nested: Element[] = [];
  const findBoxes = (el: Element) => {
    for (const c of Array.from(el.children)) {
      if (c.tagName === "w:txbxContent") nested.push(c);
      else if (c.tagName !== "mc:Fallback") findBoxes(c);
    }
  };
  const run = (r: Element, inLink: boolean) => {
    const rPr = childByTag(r, "w:rPr");
    const on = (tag: string) => {
      const e = rPr && childByTag(rPr, tag);
      if (!e) return false;
      const v = e.getAttribute("w:val");
      return v === null || !/^(0|false|none|off)$/i.test(v);
    };
    let t = "";
    let h = "";
    for (const c of Array.from(r.children)) {
      switch (c.tagName) {
        case "w:t": t += c.textContent ?? ""; h += escapeHtml(c.textContent ?? ""); break;
        case "w:tab": t += "\t"; h += "\t"; break;
        case "w:br": case "w:cr": t += "\n"; h += "<br>"; break;
        case "w:noBreakHyphen": t += "-"; h += "-"; break;
        case "w:rPr": case "w:delText": case "w:instrText": case "mc:Fallback": break;
        default: findBoxes(c);
      }
    }
    if (!t) return;
    text += t;
    const va = rPr && childByTag(rPr, "w:vertAlign")?.getAttribute("w:val");
    if (va === "superscript") h = `<sup>${h}</sup>`;
    else if (va === "subscript") h = `<sub>${h}</sub>`;
    if (on("w:strike") || on("w:dstrike")) h = `<s>${h}</s>`;
    if (on("w:u") && !inLink) h = `<u>${h}</u>`;
    if (on("w:i")) h = `<i>${h}</i>`;
    if (on("w:b")) h = `<b>${h}</b>`;
    html += h;
  };
  const walk = (el: Element, inLink: boolean) => {
    for (const c of Array.from(el.children)) {
      switch (c.tagName) {
        case "w:r": run(c, inLink); break;
        case "w:hyperlink": {
          const id = c.getAttribute("r:id");
          const href = safeHref(id ? links[id] : "");
          if (href && !inLink) html += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">`;
          walk(c, inLink || !!href);
          if (href && !inLink) html += "</a>";
          break;
        }
        case "w:txbxContent": nested.push(c); break;
        case "w:pPr": case "w:rPr": case "mc:Fallback": case "w:del": case "w:delText": case "w:instrText": break;
        default: walk(c, inLink);
      }
    }
  };
  walk(p, false);
  return { text: text.replace(/[ \t]+$/gm, "").replace(/\s+$/, ""), html: tidyInline(html), nested };
}

/** (numId, ilvl) → numbered list? From word/numbering.xml; unknown → bullets. */
function numberingFormats(doc: Document | null): (numId: string, ilvl: number) => boolean {
  if (!doc) return () => false;
  const abstract: Record<string, Record<number, string>> = {};
  for (const a of Array.from(doc.getElementsByTagName("w:abstractNum"))) {
    const id = a.getAttribute("w:abstractNumId") ?? "";
    abstract[id] = {};
    for (const lvl of Array.from(a.getElementsByTagName("w:lvl"))) {
      abstract[id][Number(lvl.getAttribute("w:ilvl") ?? 0)] = childByTag(lvl, "w:numFmt")?.getAttribute("w:val") ?? "bullet";
    }
  }
  const num: Record<string, string> = {};
  for (const n of Array.from(doc.getElementsByTagName("w:num"))) {
    num[n.getAttribute("w:numId") ?? ""] = childByTag(n, "w:abstractNumId")?.getAttribute("w:val") ?? "";
  }
  return (numId, ilvl) => {
    const fmt = abstract[num[numId]]?.[ilvl] ?? "bullet";
    return fmt !== "bullet" && fmt !== "none";
  };
}

function relTargets(doc: Document | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!doc) return out;
  for (const r of Array.from(doc.getElementsByTagName("Relationship"))) {
    if (/hyperlink$/i.test(r.getAttribute("Type") ?? "")) out[r.getAttribute("Id") ?? ""] = r.getAttribute("Target") ?? "";
  }
  return out;
}

/** Space before/after a paragraph in twips: direct formatting → style (+ basedOn) → doc defaults. */
function styleSpacing(doc: Document | null): (styleId: string, pPr: Element | null) => { before: number; after: number } {
  type Sp = { before?: number; after?: number; basedOn?: string };
  const read = (pPr: Element | null | undefined): Sp => {
    const s = pPr && childByTag(pPr, "w:spacing");
    const num = (a: string) => { const v = s?.getAttribute(a); return v != null && /^\d+$/.test(v) ? Number(v) : undefined; };
    return { before: num("w:before"), after: num("w:after") };
  };
  const byId: Record<string, Sp> = {};
  let defaults: Sp = { before: 0, after: 0 };
  let normal = "";
  if (doc) {
    const pd = doc.getElementsByTagName("w:pPrDefault")[0];
    const d = read(pd ? childByTag(pd, "w:pPr") : null);
    defaults = { before: d.before ?? 0, after: d.after ?? 0 };
    for (const st of Array.from(doc.getElementsByTagName("w:style"))) {
      if (st.getAttribute("w:type") !== "paragraph") continue;
      const id = st.getAttribute("w:styleId") ?? "";
      if (st.getAttribute("w:default") === "1") normal = id;
      byId[id] = { ...read(childByTag(st, "w:pPr")), basedOn: childByTag(st, "w:basedOn")?.getAttribute("w:val") ?? undefined };
    }
  }
  const resolve = (id: string): { before: number; after: number } => {
    let before: number | undefined, after: number | undefined;
    for (let cur: string | undefined = id || normal, n = 0; cur && n < 8; cur = byId[cur]?.basedOn, n++) {
      before ??= byId[cur]?.before;
      after ??= byId[cur]?.after;
    }
    return { before: before ?? defaults.before ?? 0, after: after ?? defaults.after ?? 0 };
  };
  return (styleId, pPr) => {
    const direct = read(pPr);
    const base = resolve(styleId);
    return { before: direct.before ?? base.before, after: direct.after ?? base.after };
  };
}

function parseXml(data: Uint8Array | null): Document | null {
  if (!data) return null;
  const doc = new DOMParser().parseFromString(new TextDecoder("utf-8").decode(data), "application/xml");
  return doc.getElementsByTagName("parsererror").length ? null : doc;
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
  let items: ListItem[] = [];
  let quote: string[] = [];
  let table: { cells: string[]; head: boolean }[] = [];
  let code: string[] | null = null;
  let pendingGap = false;
  // Each block's gap is decided when it STARTS (blank lines inside a list don't end it).
  let paraGap = false, listGap = false, quoteGap = false, tableGap = false;
  const gap = () => { const g = pendingGap && blocks.length > 0; pendingGap = false; return g; };

  const flushPara = () => {
    if (para.length) {
      blocks.push({ text: para.map(inlineMd).join("\n"), html: `<div>${para.map(inlineMdHtml).join("<br>")}</div>`, gap: paraGap });
    }
    para = [];
  };
  const flushList = () => { if (items.length) blocks.push(...listBlocks(items, listGap)); items = []; };
  const flushQuote = () => {
    if (quote.length) {
      blocks.push({ text: quote.map(inlineMd).join("\n"), html: QUOTE_OPEN + quote.map(inlineMdHtml).join("<br>") + "</blockquote>", gap: quoteGap });
    }
    quote = [];
  };
  const flushTable = () => {
    if (table.length) {
      const wrap = tableWrap();
      const g = tableGap;
      table.forEach((row, i) => blocks.push({
        text: row.cells.map(inlineMd).join(" | "),
        html: `<tr>${row.cells.map(c => CELL_OPEN + (row.head ? `<b>${inlineMdHtml(c)}</b>` : inlineMdHtml(c)) + "</td>").join("")}</tr>`,
        wrap,
        gap: i === 0 ? g : undefined,
      }));
    }
    table = [];
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable(); };

  for (const raw of lines) {
    if (/^\s*(```|~~~)/.test(raw)) {
      if (code) {
        const t = code.join("\n").replace(/\s+$/, "");
        if (t.trim()) blocks.push({ text: t, html: `<pre><code>${escapeHtml(t)}</code></pre>`, gap: gap() || blocks.length > 0 });
        code = null;
      } else { flushAll(); code = []; }
      continue;
    }
    if (code) { code.push(raw.replace(/\s+$/, "")); continue; }
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) { flushPara(); flushQuote(); flushTable(); pendingGap = true; continue; } // an open list continues

    const h = line.match(/^\s{0,3}(#{1,6})\s+(.*?)(\s+#+)?$/);
    if (h) {
      flushAll();
      const text = inlineMd(h[2]).trim();
      if (!text) continue;
      if (h[1].length <= 3) {
        if (h[1].length === 1 && !title) title = text;
        blocks.push({ level: h[1].length, text, html: "" });
        pendingGap = false;
      } else {
        blocks.push(subBlock(text));
      }
      continue;
    }
    if (/^\s{0,3}([-*_])(\s*\1){2,}$/.test(line)) { flushAll(); pendingGap = true; continue; } // horizontal rule
    if (/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line)) {                         // table separator row
      if (table.length) table[table.length - 1].head = true;
      continue;
    }
    const row = line.match(/^\s*\|(.*)\|\s*$/);
    if (row) {
      flushPara(); flushList(); flushQuote();
      if (!table.length) tableGap = gap();
      table.push({ cells: row[1].split("|").map(c => c.trim()), head: false });
      continue;
    }
    flushTable();

    const q = line.match(/^\s{0,3}>\s?(.*)$/);
    if (q) {
      flushPara(); flushList();
      if (!quote.length) quoteGap = gap();
      const body = q[1].replace(/^(>\s?)+/, "").replace(/^\[!(\w+)\][+-]?\s*/, (_, kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase() + ": ");
      quote.push(body);
      continue;
    }
    flushQuote();

    const li = line.match(/^(\s*)([-*+]|\d{1,3}[.)])\s+(?:\[([ xX])\]\s+)?(.*)$/);
    if (li) {
      flushPara();
      if (!items.length) listGap = gap();
      else pendingGap = false;
      const check = li[3] === undefined ? "" : li[3].trim() ? "☑ " : "☐ ";
      items.push({ level: indentWidth(li[1]), ordered: /\d/.test(li[2]), html: escapeHtml(check) + inlineMdHtml(li[4]), text: check + inlineMd(li[4]) });
      continue;
    }
    if (items.length && /^\s{2,}\S/.test(raw)) {
      // Indented continuation of the previous list item.
      const last = items[items.length - 1];
      last.html += "<br>" + inlineMdHtml(line.trim());
      last.text += " " + inlineMd(line.trim());
      continue;
    }
    flushList();
    if (!para.length) paraGap = gap();
    para.push(line.trim());
  }
  if (code) {
    const t = (code as string[]).join("\n").replace(/\s+$/, "");
    if (t.trim()) blocks.push({ text: t, html: `<pre><code>${escapeHtml(t)}</code></pre>`, gap: blocks.length > 0 });
  }
  flushAll();
  return { blocks, title };
}

const STRAY_HTML = /<\/?(?:span|div|br|b|i|u|em|strong|mark|sup|sub|font|a|p|img|kbd|code|s|del|ins|small|hr)(?:\s+[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s<>]+))*\s*\/?>/gi; // known tags with attr=value only, so "x<y and y>z" survive

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
    .replace(STRAY_HTML, "")
    .replace(/\\([\\`*_{}[\]()#+\-.!|~])/g, "$1");                   // escapes
}

/** Markdown inline → safe HTML (bold, italic, strike, highlight, code, links). */
function inlineMdHtml(s: string): string {
  const slots: string[] = [];
  const keep = (html: string) => `\u0000${slots.push(html) - 1}\u0000`;
  let t = s
    .replace(/\\([\\`*_{}[\]()#+\-.!|~])/g, (_, c: string) => keep(escapeHtml(c)))  // escapes
    .replace(/`([^`]+)`/g, (_, c: string) => keep(`<code>${escapeHtml(c)}</code>`))
    .replace(/!\[\[[^\]]*\]\]/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^)]*\))*)(?:\s+"[^"]*")?\)/g, (_, label: string, url: string) => {
      const href = safeHref(url);
      const inner = inlineMdHtml(label);
      return href ? keep(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`) : keep(inner);
    })
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(STRAY_HTML, "");
  t = escapeHtml(t)
    .replace(/(\*\*|__)(?=\S)(.*?\S)\1/g, "<b>$2</b>")
    .replace(/(^|[^\w*])\*(?=\S)([^*]*?\S)\*(?!\w)/g, "$1<i>$2</i>")
    .replace(/(^|[^\w])_(?=\S)([^_]*?\S)_(?!\w)/g, "$1<i>$2</i>")
    .replace(/~~(?=\S)(.*?\S)~~/g, "<s>$1</s>")
    .replace(/==(?=\S)(.*?\S)==/g, '<span style="background:rgba(250,204,21,.35)">$1</span>');
  return t.replace(/\u0000(\d+)\u0000/g, (_, i: string) => slots[Number(i)] ?? "");
}

// ── Plain text ───────────────────────────────────────────────────────────

// "• x", "- x", "* x", "1. x", "a) x" (letters only with ")" so "A. Lincoln" stays prose).
const PLAIN_LIST = /^(\s*)(?:([•◦▪▫▸►‣⁃●○■□*\-–+])|(\d{1,3}[.)]|[a-z]\)))\s+(?:\[([ xX])\]\s+)?(.*)$/;

function plainBlocks(src: string): Block[] {
  const text = normalize(src);
  let paras = text.split(/\n[ \t]*\n+/).map(p => p.replace(/^\n+|\s+$/g, "")).filter(p => p.trim());
  // Copies from Docs/Word often have no blank lines at all: then each line is a paragraph.
  const lines = text.split("\n").filter(l => l.trim());
  const lineMode = paras.length <= 2 && lines.length >= 6;
  if (lineMode) {
    // Each line is its own paragraph — except runs of list lines, which stay one list.
    paras = [];
    for (const l of lines.map(x => x.replace(/\s+$/, ""))) {
      const prev = paras[paras.length - 1];
      const lastLine = prev?.split("\n").pop() ?? "";
      if (prev !== undefined && PLAIN_LIST.test(lastLine) && (PLAIN_LIST.test(l) || /^\s{2,}\S/.test(l))) paras[paras.length - 1] = prev + "\n" + l;
      else paras.push(l);
    }
  }

  // Heading = a lone short line, not ending like a sentence, not a list item.
  const isCandidate = (p: string, i: number) =>
    i < paras.length - 1 &&
    !p.includes("\n") &&
    p.trim().length <= 60 &&
    !/[.,;]$/.test(p) &&
    !PLAIN_LIST.test(p) &&
    /\p{L}/u.test(p) &&
    // Line mode: a heading is followed by a list or by a longer line.
    (!lineMode || PLAIN_LIST.test(paras[i + 1]) || paras[i + 1].trim().length > p.trim().length);
  const flags = paras.map(isCandidate);
  const count = flags.filter(Boolean).length;
  // Mostly short lines (poems, lists) → no headings, just chunk.
  const useHeadings = count > 0 && count * 2 <= paras.length;

  const blocks: Block[] = [];
  paras.forEach((p, pi) => {
    if (useHeadings && flags[pi]) { blocks.push({ level: 1, text: p.trim(), html: "" }); return; }
    const gap = !lineMode && blocks.length > 0 && !blocks[blocks.length - 1].level;
    let first = true;
    const ls = p.split("\n");
    for (let i = 0; i < ls.length;) {
      if (PLAIN_LIST.test(ls[i])) {
        const items: ListItem[] = [];
        while (i < ls.length && (PLAIN_LIST.test(ls[i]) || (items.length && /^\s{2,}\S/.test(ls[i])))) {
          const m = PLAIN_LIST.exec(ls[i]);
          if (m) {
            const check = m[4] === undefined ? "" : m[4].trim() ? "☑ " : "☐ ";
            items.push({ level: indentWidth(m[1]), ordered: !!m[3], html: escapeHtml(check + m[5]), text: check + m[5] });
          } else {
            const last = items[items.length - 1];
            last.html += "<br>" + escapeHtml(ls[i].trim());
            last.text += " " + ls[i].trim();
          }
          i++;
        }
        blocks.push(...listBlocks(items, first ? gap : false));
      } else {
        const run: string[] = [];
        while (i < ls.length && !PLAIN_LIST.test(ls[i])) run.push(ls[i++]);
        const t = run.join("\n");
        if (t.trim()) blocks.push({ text: t, html: textHtml(t), gap: first ? gap : false });
      }
      first = false;
    }
  });
  return blocks;
}

// ── HTML (files + rich paste) ────────────────────────────────────────────

const BLOCK_TAGS = new Set([
  "P", "DIV", "SECTION", "ARTICLE", "MAIN", "HEADER", "FOOTER", "ASIDE", "NAV", "UL", "OL", "LI", "DL", "DT", "DD",
  "BLOCKQUOTE", "FIGURE", "FIGCAPTION", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TD", "TH", "H1", "H2", "H3", "H4", "H5", "H6",
  "HR", "PRE", "ADDRESS", "DETAILS", "SUMMARY", "FORM", "FIELDSET", "CENTER", "BODY", "HTML",
]);
const BLOCK_SELECTOR = Array.from(BLOCK_TAGS).filter(t => t !== "BODY" && t !== "HTML").map(t => t.toLowerCase()).join(",");
const HTML_SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "SVG", "IFRAME", "OBJECT", "HEAD", "TITLE", "BUTTON", "SELECT", "CANVAS", "IMG", "INPUT", "META", "LINK", "VIDEO", "AUDIO", "MATH"]);
const DEFAULT_GAP_TAGS = new Set(["P", "UL", "OL", "TABLE", "BLOCKQUOTE", "PRE", "DL", "FIGURE", "H4", "H5", "H6"]);

function hasStructure(html: string): boolean {
  if (typeof DOMParser === "undefined") return false;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return !!doc.body && !!doc.body.querySelector(BLOCK_SELECTOR + ",br");
}

function htmlToPlain(html: string): string {
  return new DOMParser().parseFromString(html, "text/html").body?.textContent ?? "";
}

function htmlBlocks(src: string): Parsed {
  const doc = new DOMParser().parseFromString(src, "text/html");
  const out: Block[] = [];
  let firstH1: string | undefined;
  let pTitle: string | undefined;
  let pendingGap = false;
  let prevBottom = 0;   // margin-bottom (pt) of the previous block
  let inline: Node[] = [];
  let wordItems: ListItem[] = [];
  let wordGap = false;
  let wordListId = "";

  const flushWordList = () => {
    if (wordItems.length) out.push(...listBlocks(wordItems, wordGap));
    wordItems = [];
  };
  const gapFor = (el: Element | null): boolean => {
    const m = el ? marginsPt(el) : null;
    const defaultGap = !!el && DEFAULT_GAP_TAGS.has(el.tagName);
    const top = m?.top ?? (defaultGap ? 12 : 0);
    const g = out.length > 0 && (pendingGap || top >= 5 || prevBottom >= 5);
    prevBottom = m?.bottom ?? (defaultGap ? 12 : 0);
    pendingGap = false;
    return g;
  };
  const emit = (b: Block, el: Element | null) => {
    flushWordList();
    if (b.gap === undefined) b.gap = gapFor(el);
    out.push(b);
  };
  const flushInline = () => {
    if (!inline.length) return;
    const wrapper = doc.createElement("div");
    inline.forEach(n => wrapper.appendChild(n.cloneNode(true)));
    inline = [];
    const s = serializeInline(wrapper);
    if (s.text.trim()) emit({ text: s.text, html: `<div>${s.html}</div>`, meta: { bold: s.bold, size: s.size } }, null);
  };

  const handleBlock = (el: HTMLElement) => {
    const tag = el.tagName;
    switch (tag) {
      case "H1": case "H2": case "H3": {
        const t = textOf(el);
        if (t) {
          if (tag === "H1" && !firstH1) firstH1 = t;
          flushWordList();
          out.push({ level: Number(tag[1]), text: t, html: "" });
          pendingGap = false;
          prevBottom = 0;
        }
        return;
      }
      case "H4": case "H5": case "H6": {
        const t = textOf(el);
        if (t) emit({ ...subBlock(t), gap: undefined }, el);
        return;
      }
      case "UL": case "OL": {
        const items: ListItem[] = [];
        collectList(el, 0, tag === "OL", items);
        if (items.length) { flushWordList(); out.push(...listBlocks(items, gapFor(el))); }
        return;
      }
      case "LI": {
        const items: ListItem[] = [];
        collectList(el.parentElement ?? el, 0, el.parentElement?.tagName === "OL", items, el);
        if (items.length) { flushWordList(); out.push(...listBlocks(items, gapFor(el))); }
        return;
      }
      case "TABLE": {
        const rows = Array.from(el.querySelectorAll("tr")).filter(tr => tr.closest("table") === el);
        const wrap = tableWrap();
        let first = true;
        rows.forEach((tr, ri) => {
          const cells = Array.from(tr.children).filter(td => /^T[DH]$/.test(td.tagName));
          const ser = cells.map(td => serializeInline(td));
          if (!ser.some(s => s.text.trim())) return;
          const head = ri === 0 && (tr.parentElement?.tagName === "THEAD" || cells.every(c => c.tagName === "TH"));
          const b: Block = {
            text: ser.map(s => s.text.replace(/\s+/g, " ").trim()).join(" | "),
            html: `<tr>${ser.map((s, ci) => CELL_OPEN + (head && cells[ci].tagName !== "TH" ? `<b>${s.html}</b>` : s.html) + "</td>").join("")}</tr>`,
            wrap,
          };
          if (first) { emit(b, el); first = false; } else out.push(b);
        });
        return;
      }
      case "PRE": {
        const t = (el.textContent ?? "").replace(/\s+$/, "");
        if (t.trim()) emit({ text: t, html: `<pre><code>${escapeHtml(t)}</code></pre>` }, el);
        return;
      }
      case "BLOCKQUOTE": {
        const parts = el.querySelector(BLOCK_SELECTOR)
          ? Array.from(el.children).map(c => serializeInline(c)).filter(s => s.text.trim())
          : [serializeInline(el)];
        const text = parts.map(s => s.text).join("\n");
        if (text.trim()) emit({ text, html: QUOTE_OPEN + parts.map(s => s.html).join("<br>") + "</blockquote>" }, el);
        return;
      }
      case "HR":
        pendingGap = out.length > 0;
        return;
    }

    // Containers (DIV wrappers, SECTION, Word's WordSection1, Notion's page body…).
    if (el.querySelector(BLOCK_SELECTOR)) { walk(el); return; }

    // A paragraph.
    const style = el.getAttribute("style") ?? "";
    const cls = el.getAttribute("class") ?? "";
    if (/mso-list\s*:/i.test(style) && !/mso-list\s*:\s*ignore/i.test(style)) { addWordListItem(el, style); return; }
    const t = textOf(el);
    if (!t) { const had = out.length > 0 || wordItems.length > 0; flushWordList(); pendingGap = had; return; } // empty paragraph = blank line
    if (/\b(title|MsoTitle)\b/.test(cls) && !pTitle) { pTitle = t; return; }   // Docs / Word "Title" style
    if (/\b(subtitle|MsoSubtitle)\b/.test(cls)) { emit({ ...subBlock(t), gap: undefined }, el); return; }
    const s = serializeInline(el);
    emit({ text: s.text, html: `<div>${s.html}</div>`, meta: { bold: s.bold, size: s.size } }, el);
  };

  // Word's clipboard HTML: list items are <p style="mso-list:l0 level2 lfo1"> with the
  // bullet/number in a <span style="mso-list:Ignore">.
  const addWordListItem = (el: HTMLElement, style: string) => {
    const level = Number(/level(\d+)/i.exec(style)?.[1] ?? 1) - 1;
    const listId = /mso-list\s*:\s*(l\d+)/i.exec(style)?.[1] ?? "";
    if (wordItems.length && listId !== wordListId) flushWordList(); // a different Word list
    wordListId = listId;
    const glyphEl = Array.from(el.querySelectorAll("span")).find(sp => /mso-list\s*:\s*ignore/i.test(sp.getAttribute("style") ?? ""));
    const glyph = (glyphEl?.textContent ?? "").replace(/\s+/g, "");
    const ordered = /^\(?[0-9a-zA-Z]{1,4}[.)]$/.test(glyph);
    const s = serializeInline(el);
    if (!s.text.trim()) return;
    if (!wordItems.length) wordGap = gapFor(el);
    wordItems.push({ level, ordered, html: s.html, text: s.text.trim() });
  };

  const walk = (parent: Node) => {
    for (const c of Array.from(parent.childNodes)) {
      if (c.nodeType === Node.TEXT_NODE) {
        if ((c.textContent ?? "").trim() || inline.length) inline.push(c);
        continue;
      }
      if (c.nodeType !== Node.ELEMENT_NODE) continue;
      const el = c as HTMLElement;
      const tag = el.tagName;
      if (HTML_SKIP.has(tag) || isHidden(el)) continue;
      if (tag === "BR") {
        if (inline.length) inline.push(el);
        else pendingGap = out.length > 0; // Google Docs: a blank line between paragraphs
        continue;
      }
      if (!BLOCK_TAGS.has(tag)) {
        // Inline element — unless it wraps blocks (Google Docs wraps the whole doc in <b>).
        if (el.querySelector(BLOCK_SELECTOR)) { flushInline(); walk(el); }
        else inline.push(el);
        continue;
      }
      flushInline();
      handleBlock(el);
    }
  };

  walk(doc.body ?? doc.documentElement);
  flushInline();
  flushWordList();

  // A big first line above everything (Docs/Notes title, set in a large font) is the title.
  const sizes = out.filter(b => !b.level && !b.wrap && b.meta && b.meta.size > 0).map(b => b.meta!.size).sort((a, b) => a - b);
  const median = sizes.length ? sizes[Math.floor(sizes.length / 2)] : 0;
  const first = out[0];
  if (!pTitle && first && !first.level && !first.wrap && first.meta && median && first.meta.size >= median * 1.3 &&
      first.text.length <= MAX_HEADING_CHARS && !first.text.includes("\n") && out.length > 1) {
    pTitle = first.text.trim();
    out.shift();
    if (out[0]) out[0].gap = false;
  }

  // No h1–h3 at all (Apple Notes, OneNote, many web pages): short lines set larger
  // than the body text — or bold lines in a doc with regular text — become headings.
  if (!out.some(b => b.level)) {
    const paras = out.filter(b => !b.wrap && b.meta);
    const hasRegular = paras.some(b => !b.meta!.bold);
    const isCandidate = (b: Block) =>
      !b.wrap && !!b.meta && b.text.trim().length <= MAX_HEADING_CHARS && !b.text.includes("\n") &&
      !/[.,;]$/.test(b.text.trim()) && /\p{L}/u.test(b.text) &&
      ((median > 0 && b.meta.size >= median * 1.2) || (b.meta.bold && hasRegular));
    const flags = out.map(isCandidate);
    const count = flags.filter(Boolean).length;
    if (count > 0 && count * 2 <= paras.length) {
      out.forEach((b, i) => { if (flags[i]) { b.level = 2; b.text = b.text.trim(); b.html = ""; } });
    }
  }

  const docTitle = doc.querySelector("title")?.textContent?.trim();
  return { blocks: out, title: pTitle || firstH1 || docTitle || undefined };
}

/** Flattens a (possibly nested) list into items with levels. `only` = a single stray <li>. */
function collectList(list: Element, depth: number, ordered: boolean, items: ListItem[], only?: Element) {
  const kids = only ? [only] : Array.from(list.children);
  for (const c of kids) {
    const tag = c.tagName;
    if (tag === "LI") {
      // Google Docs marks depth with aria-level on flat lists.
      const aria = Number(c.getAttribute("aria-level"));
      const level = aria > 0 ? aria - 1 : depth;
      const clone = c.cloneNode(true) as Element;
      for (const n of Array.from(clone.children)) if (n.tagName === "UL" || n.tagName === "OL") n.remove();
      const check = checkState(c);
      const s = serializeInline(clone);
      if (s.text.trim() || check) items.push({ level, ordered, html: escapeHtml(check) + s.html, text: check + s.text.trim() });
      for (const n of Array.from(c.children)) {
        if (n.tagName === "UL" || n.tagName === "OL") collectList(n, level + 1, n.tagName === "OL", items);
      }
    } else if (tag === "UL" || tag === "OL") {
      collectList(c, depth + 1, tag === "OL", items); // lists nested directly in lists (Google Docs)
    } else if (!HTML_SKIP.has(tag)) {
      collectList(c, depth, ordered, items); // wrappers inside a list
    }
  }
}

function checkState(li: Element): string {
  const aria = li.getAttribute("aria-checked");
  if (aria === "true") return "☑ ";
  if (aria === "false") return "☐ ";
  const box = li.querySelector('input[type="checkbox"]');
  if (box) return box.hasAttribute("checked") ? "☑ " : "☐ ";
  const notion = li.querySelector('[class*="checkbox-on"], [class*="checkbox-off"]');
  if (notion) return /checkbox-on/.test(notion.getAttribute("class") ?? "") ? "☑ " : "☐ ";
  return "";
}

type Fmt = { b: boolean; i: boolean; u: boolean; s: boolean; sup: boolean; sub: boolean; code: boolean; link: boolean; pre: boolean; size: number };

/**
 * An element's content → safe inline HTML (b/i/u/s/sup/sub/code/a/br only) + plain
 * text, reading formatting from tags AND inline styles (Google Docs puts bold in
 * `font-weight:700` spans and wraps everything in `<b style="font-weight:normal">`).
 */
function serializeInline(root: Element): { html: string; text: string; bold: boolean; size: number } {
  let html = "";
  let text = "";
  let chars = 0;
  let boldChars = 0;
  let maxSize = 0;
  const visit = (node: Node, f: Fmt) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let t = (node.textContent ?? "").replace(/[​‌‍⁠﻿]/g, "");
      if (!f.pre) t = t.replace(/[\s ]+/g, " ");
      else t = t.replace(/ /g, " ");
      if (!t) return;
      if (!f.pre && t === " " && (!text || text.endsWith(" ") || text.endsWith("\n"))) return;
      text += t;
      html += escapeHtml(t);
      const n = t.replace(/\s/g, "").length;
      chars += n;
      if (f.b) boldChars += n;
      if (n && f.size > maxSize) maxSize = f.size;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toUpperCase();
    if (HTML_SKIP.has(tag) || isHidden(el)) return;
    const style = el.getAttribute("style") ?? "";
    if (/mso-list\s*:\s*ignore/i.test(style)) return; // Word's literal bullet glyph
    if (tag === "BR") { html += "<br>"; text += "\n"; return; }
    const block = BLOCK_TAGS.has(tag) && el !== root;
    if (block && text && !text.endsWith("\n")) { html += "<br>"; text += "\n"; }

    const n: Fmt = { ...f };
    const fw = /font-weight\s*:\s*([^;]+)/i.exec(style)?.[1]?.trim().toLowerCase();
    if (tag === "B" || tag === "STRONG") n.b = !(fw && /^(normal|lighter|[1-5]00)$/.test(fw));
    else if (fw) n.b = /^(bold|bolder|[6-9]00)$/.test(fw) ? true : /^(normal|lighter|[1-5]00)$/.test(fw) ? false : n.b;
    if (/^H[1-6]$/.test(tag) || tag === "TH" || tag === "DT") n.b = true;
    if (tag === "I" || tag === "EM" || tag === "CITE" || tag === "VAR") n.i = true;
    const fs = /font-style\s*:\s*([^;]+)/i.exec(style)?.[1];
    if (fs) n.i = /italic|oblique/i.test(fs);
    if (tag === "U" || tag === "INS") n.u = true;
    if (tag === "S" || tag === "STRIKE" || tag === "DEL") n.s = true;
    const td = /text-decoration(?:-line)?\s*:\s*([^;]+)/i.exec(style)?.[1];
    if (td) { n.u = /underline/i.test(td); n.s = /line-through/i.test(td) || (n.s && !/none/i.test(td)); }
    if (tag === "SUP") n.sup = true;
    if (tag === "SUB") n.sub = true;
    const va = /vertical-align\s*:\s*([^;]+)/i.exec(style)?.[1];
    if (va) { if (/super/i.test(va)) n.sup = true; if (/sub/i.test(va)) n.sub = true; }
    if (tag === "CODE" || tag === "KBD" || tag === "SAMP" || tag === "TT") n.code = true;
    if (/white-space\s*:\s*pre/i.test(style)) n.pre = true;
    const fz = /font-size\s*:\s*([\d.]+)\s*(px|pt|em|rem|%)?/i.exec(style);
    if (fz) n.size = toPt(Number(fz[1]), (fz[2] ?? "px").toLowerCase(), f.size || 12);

    const opens: string[] = [];
    const closes: string[] = [];
    const wrap = (on: boolean, was: boolean, o: string, c: string) => { if (on && !was) { opens.push(o); closes.unshift(c); } };
    if (tag === "A" && !f.link) {
      const href = safeHref(el.getAttribute("href"));
      if (href) { opens.push(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">`); closes.unshift("</a>"); n.link = true; }
    }
    wrap(n.b, f.b, "<b>", "</b>");
    wrap(n.i, f.i, "<i>", "</i>");
    wrap(n.u && !n.link, f.u && !f.link, "<u>", "</u>");
    wrap(n.s, f.s, "<s>", "</s>");
    wrap(n.sup, f.sup, "<sup>", "</sup>");
    wrap(n.sub, f.sub, "<sub>", "</sub>");
    wrap(n.code, f.code, "<code>", "</code>");
    html += opens.join("");
    for (const c of Array.from(el.childNodes)) visit(c, n);
    html += closes.join("");
    if (block && text && !text.endsWith("\n")) { html += "<br>"; text += "\n"; }
  };
  const base: Fmt = { b: false, i: false, u: false, s: false, sup: false, sub: false, code: false, link: false, pre: false, size: 0 };
  // Formatting set on the paragraph element itself (e.g. <h4>, <p style="font-weight:700">).
  visit(root, base);
  text = text.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").replace(/ {2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  html = tidyInline(html).replace(/^(\s|<br>)+|(\s|<br>)+$/g, "");
  return { html, text, bold: chars > 0 && boldChars / chars > 0.9, size: maxSize };
}

/** Collapse empty / adjacent duplicate inline tags left by run-by-run formatting. */
function tidyInline(html: string): string {
  let prev = "";
  let out = html;
  while (prev !== out) {
    prev = out;
    out = out
      .replace(/<(b|i|u|s|sup|sub|code)><\/\1>/g, "")
      .replace(/<\/(b|i|u|s|sup|sub|code)><\1>/g, "");
  }
  return out;
}

function marginsPt(el: Element): { top: number; bottom: number } | null {
  const style = el.getAttribute("style") ?? "";
  let top: number | undefined;
  let bottom: number | undefined;
  const sh = /(?:^|;)\s*margin\s*:\s*([^;]+)/i.exec(style)?.[1];
  if (sh) {
    const v = sh.trim().split(/\s+/).map(lenPt);
    top = v[0];
    bottom = v.length >= 3 ? v[2] : v[0];
  }
  const mt = /margin-top\s*:\s*([^;]+)/i.exec(style)?.[1];
  const mb = /margin-bottom\s*:\s*([^;]+)/i.exec(style)?.[1];
  if (mt) top = lenPt(mt.trim());
  if (mb) bottom = lenPt(mb.trim());
  if (top === undefined && bottom === undefined) return null;
  return { top: top ?? 0, bottom: bottom ?? 0 };
}

function lenPt(v: string): number {
  const m = /^(-?[\d.]+)\s*(pt|px|in|cm|mm|em|rem|%)?$/i.exec(v);
  if (!m) return 0;
  return toPt(Number(m[1]), (m[2] ?? "px").toLowerCase(), 12);
}

function toPt(n: number, unit: string, base: number): number {
  switch (unit) {
    case "pt": return n;
    case "px": return n * 0.75;
    case "in": return n * 72;
    case "cm": return n * 28.35;
    case "mm": return n * 2.835;
    case "em": return n * base;
    case "rem": return n * 12;
    case "%": return (n / 100) * base;
    default: return n;
  }
}

function isHidden(el: Element): boolean {
  const s = el.getAttribute("style") ?? "";
  return /display\s*:\s*none|visibility\s*:\s*hidden|mso-hide\s*:\s*all/i.test(s) || el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true";
}

function textOf(el: Element): string {
  return (el.textContent ?? "").replace(/[​‌‍⁠﻿]/g, "").replace(/[\s ]+/g, " ").trim();
}

function safeHref(href: string | null | undefined): string {
  const h = (href ?? "").trim();
  return /^(https?:|mailto:)/i.test(h) ? h : "";
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
  return s.replace(/^﻿/, "").replace(/\r\n?/g, "\n").replace(/ /g, " ").replace(/[​‌‍⁠]/g, "");
}

function indentWidth(ws: string): number {
  return ws.replace(/\t/g, "    ").length;
}

function paragraphs(text: string): string[] {
  return text.split(/\n{2,}/).map(p => p.replace(/^\n+|\s+$/g, "")).filter(p => p.trim());
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
