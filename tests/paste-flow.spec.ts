// Pasting straight into a page (no Import dialog): Docs formatting is kept, bold stays
// bold, and a paste longer than the page continues on new pages instead of being cut off.
import { test, expect, type Page } from "@playwright/test"
import { bootGuest, readNotes, pageHtml, filler } from "./import-helpers"

test.use({ screenshot: "only-on-failure", viewport: { width: 1440, height: 900 } })

const P = (t: string) => `<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;">${t}</span></p>`
const BOLD = (t: string) => `<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-weight:700;">${t}</span></p>`
const LI = (t: string) => `<li aria-level="1"><p role="presentation" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;">${t}</span></p></li>`
const TOPICS = ["Motion", "Forces", "Energy", "Waves"]
// Google Docs clipboard: bold lines (not heading styles) above paragraphs and lists.
const DOC = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-3">` +
  TOPICS.map(t =>
    BOLD(`${t}:`) +
    [1, 2, 3].map(i => P(filler(`${t} part ${i}`))).join("") +
    `<ul style="margin-top:0;margin-bottom:0;">${Array.from({ length: 6 }, (_, i) => LI(`${t} fact ${i + 1}`)).join("")}</ul>` +
    `<ol style="margin-top:0;margin-bottom:0;">${Array.from({ length: 10 }, (_, i) => LI(`${t} step ${i + 1}`)).join("")}</ol><br>`,
  ).join("") + "</b>"
const PLAIN = TOPICS.map(t => `${t}:\n${filler(t)}`).join("\n")

async function pasteInto(page: Page, html: string, plain: string) {
  const box = page.locator('#editor-paper [contenteditable="true"]').first()
  await box.click()
  await box.evaluate((el, data: { html: string; plain: string }) => {
    const dt = new DataTransfer()
    dt.setData("text/html", data.html)
    dt.setData("text/plain", data.plain)
    el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }))
  }, { html, plain })
}

const pageBottom = (page: Page) => page.evaluate(() => {
  const paper = document.getElementById("editor-paper")!
  const ed = paper.querySelector<HTMLElement>('[contenteditable="true"]')!
  const pr = paper.getBoundingClientRect()
  return (ed.getBoundingClientRect().bottom - pr.top) / (pr.width / 960)
})

test("paste from Docs into a page: formatting kept, overflow continues on new pages", async ({ page }) => {
  test.setTimeout(120_000)
  await bootGuest(page)
  await pasteInto(page, DOC, PLAIN)

  await expect.poll(async () => (await readNotes(page))[0]?.pages.length ?? 0).toBeGreaterThanOrEqual(3)
  const note = (await readNotes(page))[0]
  const html = pageHtml(note)
  const all = html.join("")
  // Bold lines stay bold text — no headings made up.
  expect(all).not.toMatch(/<h[1-6]/)
  expect(all).toContain("<b>Motion:</b>")
  expect(all).toMatch(/<ul><li>Motion fact 1<\/li>/)
  expect(all).toMatch(/<ol[^>]*><li>Motion step 1<\/li>/)
  // Everything is there, in order, and every page has text.
  for (const t of TOPICS) expect(all).toContain(`${t} step 10`)
  expect(all.indexOf("Motion:")).toBeLessThan(all.indexOf("Waves:"))
  for (const h of html) expect(h.replace(/<[^>]+>/g, "").trim().length).toBeGreaterThan(0)

  // Nothing runs past the foot of any page.
  for (let i = 0; i < html.length; i++) {
    if (i) {
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
      await page.keyboard.press("Alt+ArrowRight")
    }
    const head = await page.evaluate(h => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent!.trim().slice(0, 24) }, html[i])
    await expect(page.locator('#editor-paper [contenteditable="true"]').first()).toContainText(head)
    expect(await pageBottom(page)).toBeLessThanOrEqual(1250 - 30)
  }
})

test("short paste stays inline on the page", async ({ page }) => {
  test.setTimeout(60_000)
  await bootGuest(page)
  const box = page.locator('#editor-paper [contenteditable="true"]').first()
  await box.click()
  await page.keyboard.type("Start ")
  await pasteInto(page, `<meta charset="utf-8"><p><span style="font-weight:700">bold phrase</span> and more</p>`, "bold phrase and more")
  await page.keyboard.type(" end")
  await expect(box).toContainText("Start bold phrase and more end")
  await expect.poll(async () => { const n = (await readNotes(page))[0]; return n ? pageHtml(n)[0] : "" }).toContain("<b>bold phrase</b>")
  expect((await readNotes(page))[0].pages).toHaveLength(1)
})
