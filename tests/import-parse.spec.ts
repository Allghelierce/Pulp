// Parser checks through the real ImportModal UI (a browser page has File,
// DOMParser and DecompressionStream). Guest = signed out, so no AI calls:
// every section is saved as a page and we inspect the stored notebook.
import { test, expect, type Page } from "@playwright/test"
import { bootGuest, openImport, readNotes, pageHtml, docxFixture, filler } from "./import-helpers"

test.use({ screenshot: "only-on-failure", viewport: { width: 1440, height: 900 } })

type Fixture = { name: string; mimeType: string; buffer: Buffer }

async function importFile(page: Page, file: Fixture) {
  const dialog = await openImport(page)
  await dialog.locator('input[type="file"]').setInputFiles(file)
  await expect(dialog.getByText(/sections? ·/)).toBeVisible()
  const title = await dialog.locator("input").first().inputValue()
  const summary = await dialog.getByText(/sections? ·/).innerText()
  await expect(dialog.getByText(/sign in to get recall cards/)).toBeVisible()
  await dialog.getByRole("button", { name: "Import", exact: true }).click()
  await expect(dialog.getByText("Notes imported.")).toBeVisible()
  const rows = await dialog.locator("div.flex.flex-col > div > span:first-child").allInnerTexts()
  await dialog.getByRole("button", { name: "Done" }).click()
  await expect(dialog).toHaveCount(0)
  // Notes save on a debounce; titles are unique per fixture.
  await expect.poll(async () => (await readNotes(page)).filter(n => n.subject === title).length).toBe(1)
  const note = (await readNotes(page)).find(n => n.subject === title)!
  return { title, summary, rows, note }
}

test("parser: docx / md / html / txt through the modal", async ({ page }) => {
  test.setTimeout(120_000)
  await page.route("**/api/import", r => r.fulfill({ status: 401, json: { error: "Unauthorized" } }))
  await bootGuest(page)

  // .docx — Title + Heading1/Heading2, w:tab, w:br, escaped "<script>".
  const docx = await importFile(page, { name: "bio.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: docxFixture() })
  expect(docx.title).toBe("Biology Notes")
  expect(docx.summary).toMatch(/^3 sections ·/)
  expect(docx.rows).toEqual(["Cells", "Mitochondria", "Photosynthesis"])
  expect(docx.note.subject).toBe("Biology Notes")
  // Three short sections flow onto one page (pages fill before the next starts).
  expect(docx.note.pages).toHaveLength(1)
  expect(pageHtml(docx.note)[0]).toMatch(/^<h2 style="[^"]*">Cells<\/h2>/)
  expect(pageHtml(docx.note)[0]).toContain("Term\tDefinition<br>Line after break &lt;script&gt;alert(1)&lt;/script&gt;")
  expect(pageHtml(docx.note).join("")).not.toContain("<script>")
  // Rendered as text in the editor, not as a tag.
  // Rendered as editable text in the page's box, in paper ink (not the theme's white).
  const box = page.locator('[contenteditable="true"]').filter({ hasText: "Line after break <script>alert(1)</script>" }).first()
  await expect(box).toBeVisible()
  expect(await box.evaluate(el => getComputedStyle(el).color)).not.toBe("rgb(255, 255, 255)")
  await expect(box.locator("h2", { hasText: "Cells" })).toBeVisible()

  // .md — "#" headings; H1 is the title; bold, links and bullet lists kept as real formatting.
  const md = [
    "# Chem Notes", "",
    "## Atoms", "", `**Atoms** are tiny. See [the textbook](https://example.com). ${filler("Atoms")}`, "", "- protons", "- neutrons", "",
    "## Bonds", "", filler("Bonds"), "",
    "### Ionic", "", filler("Ionic bonds"), "",
  ].join("\n")
  const m = await importFile(page, { name: "chem.md", mimeType: "text/markdown", buffer: Buffer.from(md) })
  expect(m.title).toBe("Chem Notes")
  expect(m.summary).toMatch(/^3 sections ·/)
  expect(m.rows).toEqual(["Atoms", "Bonds", "Ionic"])
  expect(pageHtml(m.note)[0]).toContain('<b>Atoms</b> are tiny. See <a href="https://example.com"')
  expect(pageHtml(m.note)[0]).toContain(">the textbook</a>.")
  expect(pageHtml(m.note)[0]).toContain("<ul><li>protons</li><li>neutrons</li></ul>")
  expect(pageHtml(m.note).join("")).not.toMatch(/\*\*|\]\(/)

  // .html — h1/h2, scripts dropped, literal "<script>" text escaped.
  const html = `<html><head><title>Ignored</title><script>window.__pwned = 1</script></head><body>
    <h1>History</h1><h2>Rome</h2><p>${filler("Rome")} Watch for &lt;script&gt; tags.</p>
    <h2>Greece</h2><p>${filler("Greece")}</p><ul><li>Athens</li><li>Sparta</li></ul><script>window.__pwned = 2</script></body></html>`
  const h = await importFile(page, { name: "history.html", mimeType: "text/html", buffer: Buffer.from(html) })
  expect(h.title).toBe("History")
  expect(h.summary).toMatch(/^2 sections ·/)
  expect(h.rows).toEqual(["Rome", "Greece"])
  expect(pageHtml(h.note)[0]).toContain("Watch for &lt;script&gt; tags.")
  expect(pageHtml(h.note).join("")).toContain("<ul><li>Athens</li><li>Sparta</li></ul>")
  expect(pageHtml(h.note).join("")).not.toContain("__pwned")
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined()

  // .txt — no headings -> ~3500-char chunks, title from the file name.
  const txt = Array.from({ length: 24 }, (_, i) => filler(`Point ${i + 1}`) + ".").join("\n\n")
  const t = await importFile(page, { name: "lecture-3.txt", mimeType: "text/plain", buffer: Buffer.from(txt) })
  expect(t.title).toBe("lecture-3")
  const n = Number(t.summary.match(/^(\d+) sections/)?.[1])
  expect(n).toBeGreaterThanOrEqual(2)
  expect(t.rows).toEqual(Array.from({ length: n }, (_, i) => `Section ${i + 1}`))
  for (const p of pageHtml(t.note)) expect(p.length).toBeLessThan(6500)
  expect(pageHtml(t.note).join("")).toContain("Point 24")

  // Unsupported file -> friendly error, stays on the picker.
  const dialog = await openImport(page)
  await dialog.locator('input[type="file"]').setInputFiles({ name: "slides.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") })
  await expect(dialog.getByText(/PDFs aren't supported yet/)).toBeVisible()
  // Corrupt docx -> friendly error.
  await dialog.locator('input[type="file"]').setInputFiles({ name: "bad.docx", mimeType: "application/octet-stream", buffer: Buffer.from("not a zip at all, just text") })
  await expect(dialog.getByText(/doesn't look like a real \.docx/)).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
})
