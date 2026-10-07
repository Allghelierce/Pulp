// Shared bits for the import specs: guest boot, opening the modal, fixtures.
import { expect, type Page } from "@playwright/test"
import { deflateRawSync, crc32 } from "node:zlib"

export const BASE = process.env.PULP_URL || "http://localhost:3000"

// ~350 chars of filler so each section clears the 300-char merge threshold.
export const filler = (topic: string) =>
  `${topic} is an important idea in this course. ` +
  `We study how ${topic.toLowerCase()} works, why it matters, and the key terms that go with it. ` +
  `The lecture covered several worked examples and a short quiz about ${topic.toLowerCase()}. ` +
  `Remember the definitions, the main steps, and one real example for the exam next week. ` +
  `Review these notes again before the weekend so the details stick.`

export async function bootGuest(page: Page) {
  await page.goto(`${BASE}/app`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText("Start Now").first().click()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
}

export async function openImport(page: Page) {
  const btn = page.locator('button[title^="Import notes"]')
  if (!(await btn.isVisible())) {
    const open = page.locator('[title="Open Sidebar"]')
    if (await open.isVisible()) await open.click()
  }
  await btn.click()
  await expect(page.getByRole("dialog", { name: "Import notes" })).toBeVisible()
  return page.getByRole("dialog", { name: "Import notes" })
}

export type SavedNote = { id: string; subject: string; pages: string[]; boxes: Record<string, { content: string }[]> }
export const readNotes = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("pulp-notes") || "[]") as SavedNote[])
// Imported text lives in each page's text box(es); one HTML string per page.
export const pageHtml = (note: SavedNote) => note.pages.map((_, i) => (note.boxes[i] ?? []).map(b => b.content).join(""))

// ── .docx fixture: a real zip (deflate) with word/document.xml ──────────
function zip(files: Record<string, string>): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const [name, content] of Object.entries(files)) {
    const raw = Buffer.from(content, "utf8")
    const data = deflateRawSync(raw)
    const crc = crc32(raw)
    const nameBuf = Buffer.from(name, "utf8")
    const lh = Buffer.alloc(30)
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(8, 8)
    lh.writeUInt32LE(0, 10); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(raw.length, 22)
    lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28)
    const ch = Buffer.alloc(46)
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0, 8); ch.writeUInt16LE(8, 10)
    ch.writeUInt32LE(0, 12); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(raw.length, 24)
    ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34)
    ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42)
    locals.push(lh, nameBuf, data)
    centrals.push(ch, nameBuf)
    offset += 30 + nameBuf.length + data.length
  }
  const cd = Buffer.concat(centrals)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(Object.keys(files).length, 8); eocd.writeUInt16LE(Object.keys(files).length, 10)
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, cd, eocd])
}

const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const para = (text: string, style?: string) =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}<w:r><w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r></w:p>`

export function docxFixture(): Buffer {
  const body = [
    para("Biology Notes", "Title"),
    para("Cells", "Heading1"),
    // w:tab + w:br inside one paragraph
    `<w:p><w:r><w:t>Term</w:t><w:tab/><w:t>Definition</w:t><w:br/><w:t xml:space="preserve">Line after break &lt;script&gt;alert(1)&lt;/script&gt;</w:t></w:r></w:p>`,
    para(filler("Cells")),
    para("Mitochondria", "Heading2"),
    para(filler("Mitochondria")),
    para("Photosynthesis", "Heading1"),
    para(filler("Photosynthesis")),
  ].join("")
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><w:body>${body}<w:sectPr/></w:body></w:document>`
  return zip({
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>`,
    "word/document.xml": xml,
  })
}
