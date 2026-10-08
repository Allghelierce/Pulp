// Imported notes fill each page before starting the next, nothing is cut off at the foot
// of a page, and body text sits on the ruled lines. Guest = signed out, no AI calls.
import { test, expect, type Page } from "@playwright/test"
import { bootGuest, openImport, readNotes, pageHtml, filler } from "./import-helpers"

test.use({ screenshot: "only-on-failure", viewport: { width: 1440, height: 900 } })

const P = (t: string) => `<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;">${t}</span></p>`
const LI = (t: string) => `<li aria-level="1"><p role="presentation" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;">${t}</span></p></li>`
const TOPICS = ["Motion", "Forces", "Energy", "Waves"]
// Google Docs-style clipboard HTML: a title, then four sections of paragraphs + lists.
const DOC = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-2">` +
  P(`<span style="font-size:26pt">Physics Unit</span>`) +
  TOPICS.map(t =>
    `<h1 style="margin-top:20pt;margin-bottom:6pt;"><span style="font-size:20pt;">${t}</span></h1>` +
    [1, 2, 3].map(i => P(`${filler(`${t} part ${i}`)}`)).join("") + "<br>" +
    `<ul style="margin:0">${Array.from({ length: 6 }, (_, i) => LI(`${t} fact ${i + 1}: ${filler(t).slice(0, 90)}`)).join("")}</ul><br>` +
    `<ol style="margin:0">${Array.from({ length: 10 }, (_, i) => LI(`${t} step ${i + 1}`)).join("")}</ol>`,
  ).join("") + "</b>"
const PLAIN = ["Physics Unit", ...TOPICS.flatMap(t => [t, filler(t)])].join("\n")

/** Layout of the open page, in unzoomed page px. */
const measure = (page: Page) => page.evaluate(() => {
  const paper = document.getElementById("editor-paper")!
  const ed = paper.querySelector<HTMLElement>('[contenteditable="true"]')!
  const pr = paper.getBoundingClientRect()
  const k = pr.width / 960
  const y = (r: DOMRect) => (r.top - pr.top) / k
  const rule = parseFloat(getComputedStyle(ed).lineHeight)
  const lines = Array.from(ed.querySelectorAll<HTMLElement>(":scope > div, li"))
    .filter(e => e.textContent!.trim() && !e.querySelector("li"))
    .map(e => y(e.getBoundingClientRect()))
  return {
    rule,
    top: y(ed.getBoundingClientRect()),
    bottom: (ed.getBoundingClientRect().bottom - pr.top) / k,
    bgPos: getComputedStyle(paper).backgroundPosition,
    lines,
  }
})

test("import fills pages, keeps text on the lines", async ({ page }) => {
  test.setTimeout(120_000)
  await page.route("**/api/import", r => r.fulfill({ status: 401, json: { error: "Unauthorized" } }))
  await bootGuest(page)
  const dialog = await openImport(page)
  await dialog.getByRole("button", { name: "Paste", exact: true }).click()
  const box = dialog.getByPlaceholder("Paste your notes…")
  await box.fill(PLAIN)
  await box.evaluate((ta: HTMLTextAreaElement, data: { html: string; plain: string }) => {
    ta.select()
    const dt = new DataTransfer()
    dt.setData("text/html", data.html)
    dt.setData("text/plain", data.plain)
    ta.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }))
  }, { html: DOC, plain: PLAIN })
  await dialog.getByRole("button", { name: "Continue" }).click()
  await expect(dialog.getByText(/^4 sections ·/)).toBeVisible()
  await dialog.getByRole("button", { name: "Import", exact: true }).click()
  await expect(dialog.getByText("Notes imported.")).toBeVisible()
  await dialog.getByRole("button", { name: "Done" }).click()
  await expect.poll(async () => (await readNotes(page)).filter(n => n.subject === "Physics Unit").length).toBe(1)
  const note = (await readNotes(page)).find(n => n.subject === "Physics Unit")!
  const html = pageHtml(note)

  // Sections flow together onto filled pages; everything is there, in order.
  expect(html.length).toBeGreaterThanOrEqual(2)
  const all = html.join("")
  for (const t of TOPICS) expect(all).toContain(`>${t}</h2>`)
  expect(all.indexOf(">Motion</h2>")).toBeLessThan(all.indexOf(">Waves</h2>"))
  for (const t of TOPICS) expect(all).toContain(`${t} step 10`)
  // No page ends on a heading; a numbered list split across pages keeps counting.
  for (const h of html) expect(h).not.toMatch(/<\/h[23]>\s*$/)
  const continued = html.slice(1).map(h => h.match(/^<ol start="(\d+)"/)?.[1]).filter(Boolean).map(Number)
  for (const n of continued) expect(n).toBeGreaterThan(1)

  for (let i = 0; i < html.length; i++) {
    if (i) {
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
      await page.keyboard.press("Alt+ArrowRight")
    }
    await expect(page.locator('#editor-paper [contenteditable="true"]').first()).toContainText(
      (await page.evaluate(h => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent!.trim().slice(0, 30) }, html[i])))
    const m = await measure(page)
    // A list continued from the previous page keeps counting on screen too.
    const startAt = html[i].match(/^<ol start="(\d+)"/)?.[1]
    if (startAt) expect(await page.locator('#editor-paper [contenteditable="true"] > ol').first().evaluate(ol => (ol as HTMLOListElement).start)).toBe(Number(startAt))
    expect(m.rule).toBe(32)
    expect(Math.round(m.top)).toBe(49)
    expect(m.bgPos).toBe("0px 17px")
    // Every line of text starts on a row of the ruling.
    for (const top of m.lines) {
      const off = (top - 49) % m.rule
      expect(Math.min(off, m.rule - off)).toBeLessThan(1.5)
    }
    // Nothing runs past the foot of the page; every page but the last is (nearly) full.
    expect(m.bottom).toBeLessThanOrEqual(1250 - 30)
    if (i < html.length - 1) expect(m.bottom).toBeGreaterThan(1250 - 40 - m.rule * 4)
  }
})
