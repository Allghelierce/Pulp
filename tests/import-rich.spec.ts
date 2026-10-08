// Rich paste: the clipboard's text/html from Google Docs / Word / Notion keeps
// headings (→ sections), lists, bold, links, tables and the source's spacing.
// Guest = signed out, so no AI calls; we inspect the stored notebook.
import { test, expect, type Page } from "@playwright/test"
import { bootGuest, openImport, readNotes, pageHtml, filler } from "./import-helpers"

test.use({ screenshot: "only-on-failure", viewport: { width: 1440, height: 900 } })

const GDOCS = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1">
<p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:3pt;"><span style="font-size:26pt;font-weight:400;">Biology Unit 3</span></p>
<h1 dir="ltr" style="margin-top:20pt;margin-bottom:6pt;"><span style="font-size:20pt;font-weight:400;">Cell Structure</span></h1>
<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-weight:400;">The </span><span style="font-size:11pt;font-weight:700;">nucleus</span><span style="font-size:11pt;font-weight:400;"> holds DNA. ${filler("Cells")}</span></p>
<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;">Second line, right below.</span></p><br>
<ul style="margin-top:0;margin-bottom:0;"><li dir="ltr" aria-level="1"><p role="presentation" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;">Mitochondria</span></p></li>
<ul><li aria-level="2"><p role="presentation" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-style:italic;">the powerhouse</span></p></li></ul>
<li aria-level="1"><p role="presentation" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;">Ribosomes</span></p></li></ul>
<h1 dir="ltr" style="margin-top:20pt;margin-bottom:6pt;"><span style="font-size:20pt;">Photosynthesis</span></h1>
<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;">${filler("Photosynthesis")}</span></p>
<ol style="margin-top:0;margin-bottom:0;"><li aria-level="1"><p role="presentation" style="margin-top:0pt;margin-bottom:0pt;"><span>Light reactions</span></p></li><li aria-level="1"><p role="presentation" style="margin-top:0pt;margin-bottom:0pt;"><span>Calvin cycle</span></p></li></ol>
<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;"><a href="https://khanacademy.org"><span style="text-decoration:underline;">Khan Academy</span></a><span> <script>window.__pwned=1</script>&lt;b&gt;literal&lt;/b&gt;</span></p>
</b>`
const GDOCS_PLAIN = "Biology Unit 3\nCell Structure\nThe nucleus holds DNA.\nSecond line, right below.\n\nMitochondria\nthe powerhouse\nRibosomes\nPhotosynthesis\nLight reactions\nCalvin cycle\nKhan Academy"

const WORD = `<html><body><!--StartFragment--><h1>Chemistry</h1><p class=MsoNormal>${filler("Atoms")}</p>
<p class=MsoListParagraphCxSpFirst style='mso-list:l0 level1 lfo1'><span style='mso-list:Ignore'>·<span>&nbsp;&nbsp;</span></span>Protons<o:p></o:p></p>
<p class=MsoListParagraphCxSpMiddle style='mso-list:l0 level2 lfo1'><span style='mso-list:Ignore'>o<span>&nbsp;</span></span><b>positive</b> charge<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='mso-list:l0 level1 lfo1'><span style='mso-list:Ignore'>·<span>&nbsp;</span></span>Neutrons<o:p></o:p></p>
<p class=MsoNormal><o:p>&nbsp;</o:p></p>
<p class=MsoListParagraph style='mso-list:l1 level1 lfo2'><span style='mso-list:Ignore'>1.<span>&nbsp;</span></span>First step</p>
<p class=MsoListParagraph style='mso-list:l1 level1 lfo2'><span style='mso-list:Ignore'>2.<span>&nbsp;</span></span>Second step</p>
<h1>Bonds</h1><p class=MsoNormal>${filler("Bonds")}</p><!--EndFragment--></body></html>`

const NOTION = `<meta charset="utf-8"><h1>History</h1><p>${filler("Rome")}</p>
<ul><li>Caesar<ul><li>crossed the <strong>Rubicon</strong></li></ul></li><li>Augustus</li></ul>
<ul class="to-do-list"><li><div class="checkbox checkbox-on"></div> <span>Read chapter 4</span></li><li><div class="checkbox checkbox-off"></div> <span>Make flashcards</span></li></ul>
<h2>Greece</h2><p>${filler("Greece")}</p>
<table><thead><tr><th>Term</th><th>Meaning</th></tr></thead><tbody><tr><td>Polis</td><td>City-state</td></tr></tbody></table>`

/** Paste like a user would: the box gets the plain text, the handler reads text/html. */
async function richPaste(page: Page, html: string, plain: string) {
  const dialog = await openImport(page)
  await dialog.getByRole("button", { name: "Paste", exact: true }).click()
  const box = dialog.getByPlaceholder("Paste your notes…")
  await box.fill(plain)
  await box.evaluate((ta: HTMLTextAreaElement, data: { html: string; plain: string }) => {
    ta.select()
    const dt = new DataTransfer()
    dt.setData("text/html", data.html)
    dt.setData("text/plain", data.plain)
    ta.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }))
  }, { html, plain })
  await expect(dialog.getByText(/Formatting kept/)).toBeVisible()
  return dialog
}

async function importAndRead(page: Page, dialog: ReturnType<Page["getByRole"]>) {
  await dialog.getByRole("button", { name: "Continue" }).click()
  await expect(dialog.getByText(/sections? ·/)).toBeVisible()
  const title = await dialog.locator("input").first().inputValue()
  const summary = await dialog.getByText(/sections? ·/).innerText()
  await dialog.getByRole("button", { name: "Import", exact: true }).click()
  await expect(dialog.getByText("Notes imported.")).toBeVisible()
  const rows = await dialog.locator("div.flex.flex-col > div > span:first-child").allInnerTexts()
  await dialog.getByRole("button", { name: "Done" }).click()
  await expect.poll(async () => (await readNotes(page)).filter(n => n.subject === title).length).toBe(1)
  const note = (await readNotes(page)).find(n => n.subject === title)!
  return { title, summary, rows, note, html: pageHtml(note) }
}

test("rich paste: Google Docs, Word and Notion keep their structure", async ({ page }) => {
  test.setTimeout(180_000)
  await page.route("**/api/import", r => r.fulfill({ status: 401, json: { error: "Unauthorized" } }))
  await bootGuest(page)

  // Google Docs: big first line is the title; H1s start sections; bold, nested list,
  // numbered list, link; tight lines stay tight, the blank line becomes one spacer.
  const g = await importAndRead(page, await richPaste(page, GDOCS, GDOCS_PLAIN))
  expect(g.title).toBe("Biology Unit 3")
  expect(g.summary).toMatch(/^2 sections ·/)
  expect(g.rows).toEqual(["Cell Structure", "Photosynthesis"])
  expect(g.html[0]).toContain("The <b>nucleus</b> holds DNA.")
  expect(g.html[0]).toMatch(/<\/div><div>Second line, right below\.<\/div><div><br><\/div><ul>/)
  expect(g.html[0]).toContain("<ul><li>Mitochondria<ul><li><i>the powerhouse</i></li></ul></li><li>Ribosomes</li></ul>")
  expect(g.html.join("")).toContain("<ol><li>Light reactions</li><li>Calvin cycle</li></ol>")
  expect(g.html.join("")).toContain('<a href="https://khanacademy.org"')
  expect(g.html.join("")).toContain("&lt;b&gt;literal&lt;/b&gt;")
  expect(g.html.join("")).not.toContain("__pwned")
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined()
  // The list renders as a real list in the page's text box.
  await expect(page.locator('[contenteditable="true"] ul li', { hasText: "Mitochondria" }).first()).toBeVisible()

  // Word: mso-list paragraphs become real nested / numbered lists; separate lists stay separate.
  const w = await importAndRead(page, await richPaste(page, WORD, "Chemistry\nProtons\nNeutrons"))
  expect(w.rows).toEqual(["Chemistry", "Bonds"])
  expect(w.html[0]).toContain("<ul><li>Protons<ul><li><b>positive</b> charge</li></ul></li><li>Neutrons</li></ul><div><br></div><ol><li>First step</li><li>Second step</li></ol>")
  expect(w.html.join("")).not.toContain("·")

  // Notion: nested lists, checklists, tables.
  const n = await importAndRead(page, await richPaste(page, NOTION, "History\nCaesar"))
  expect(n.rows).toEqual(["History", "Greece"])
  expect(n.html[0]).toContain("<ul><li>Caesar<ul><li>crossed the <b>Rubicon</b></li></ul></li><li>Augustus</li></ul>")
  // Unstyled lists hug the paragraph above them (no blank row from default <ul> margins).
  expect(n.html[0]).toMatch(/<\/div><ul><li>Caesar/)
  expect(n.html[0]).toContain("<li>☑ Read chapter 4</li><li>☐ Make flashcards</li>")
  expect(n.html.join("")).toMatch(/<table[^>]*>(<tbody>)?<tr><td[^>]*><b>Term<\/b><\/td><td[^>]*><b>Meaning<\/b><\/td><\/tr><tr><td[^>]*>Polis<\/td>/)
})

test("rich paste: editing the text afterwards falls back to the edited plain text", async ({ page }) => {
  test.setTimeout(90_000)
  await page.route("**/api/import", r => r.fulfill({ status: 401, json: { error: "Unauthorized" } }))
  await bootGuest(page)
  const dialog = await richPaste(page, NOTION, "History\nCaesar")
  await dialog.getByPlaceholder("Paste your notes…").fill(`Edited by hand\n\n${filler("Edits")}`)
  await expect(dialog.getByText(/Formatting kept/)).toHaveCount(0)
  const r = await importAndRead(page, dialog)
  expect(r.html.join("")).toContain("Edits is an important idea")
  expect(r.html.join("")).not.toContain("Caesar")
})

test("plain paste without blank lines: headings, one list, title from the first line", async ({ page }) => {
  test.setTimeout(90_000)
  await page.route("**/api/import", r => r.fulfill({ status: 401, json: { error: "Unauthorized" } }))
  await bootGuest(page)
  const dialog = await openImport(page)
  await dialog.getByRole("button", { name: "Paste", exact: true }).click()
  const text = [
    "Economics Notes", "Supply and Demand", filler("Supply"), "- shortage", "- surplus",
    "Elasticity", filler("Elasticity"), "Inelastic goods barely change when price changes.",
  ].join("\n")
  await dialog.getByPlaceholder("Paste your notes…").fill(text)
  const r = await importAndRead(page, dialog)
  expect(r.title).toBe("Economics Notes")
  expect(r.rows).toEqual(["Supply and Demand", "Elasticity"])
  expect(r.html[0]).toContain("<ul><li>shortage</li><li>surplus</li></ul>")
})

test("Docs bold lines stay bold; headings set at body size become bold lines, not big headings", async ({ page }) => {
  test.setTimeout(90_000)
  await page.route("**/api/import", r => r.fulfill({ status: 401, json: { error: "Unauthorized" } }))
  await bootGuest(page)
  const P = (t: string, bold = false) => `<p dir="ltr" style="margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-weight:${bold ? 700 : 400};">${t}</span></p>`
  // Bold lines only (no heading styles): nothing becomes a heading.
  const bold = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-4">${P("Psych Notes", true)}${P("Types of reasoning:", true)}${P(filler("Reasoning"))}${P("Science", true)}${P(filler("Science"))}</b>`
  const d1 = await richPaste(page, bold, "Psych Notes\nTypes of reasoning:\nScience")
  await d1.getByPlaceholder("Title (optional)").fill("Bold Lines")
  const b = await importAndRead(page, d1)
  expect(b.html.join("")).not.toMatch(/<h[1-6]/)
  expect(b.html.join("")).toContain("<b>Types of reasoning:</b>")
  expect(b.html.join("")).toContain("<b>Science</b>")
  // Heading styles shrunk to body size in Docs: still split topics, but look like bold text.
  const H = (tag: string, t: string) => `<${tag} dir="ltr" style="margin-top:12pt;margin-bottom:0pt;"><span style="font-size:11pt;font-weight:700;">${t}</span></${tag}>`
  const small = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-5">${H("h2", "Memory")}${P(filler("Memory"))}${H("h2", "Attention")}${P(filler("Attention"))}</b>`
  const d2 = await richPaste(page, small, "Memory\nAttention")
  await d2.getByPlaceholder("Title (optional)").fill("Small Headings")
  const s = await importAndRead(page, d2)
  expect(s.rows).toEqual(["Memory", "Attention"])
  expect(s.html.join("")).not.toMatch(/<h[1-6]/)
  expect(s.html.join("")).toContain("<b>Attention</b>")
})
