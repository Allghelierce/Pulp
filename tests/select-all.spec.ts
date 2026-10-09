// Ctrl/Cmd+A selects text or text boxes, never the app's buttons and labels: in a box it
// selects that box's text; on the page it selects the page's boxes; on a page with no boxes,
// or with the page hidden behind another view, it selects nothing.
import { test, expect, type Page } from "@playwright/test"
import { bootGuest } from "./import-helpers"

test.use({ viewport: { width: 1280, height: 900 } })

type Box = { id: string; x: number; y: number; w: number; h: number; content: string }
const box = (id: string, y: number, content: string): Box => ({ id, x: 160, y, w: 500, h: 32, content })

async function seed(page: Page, boxes: Box[], flag: string) {
  await page.addInitScript(d => {
    if (sessionStorage.getItem(d.flag)) return
    sessionStorage.setItem(d.flag, "1")
    const notes = JSON.parse(localStorage.getItem("pulp-notes") || "[]")
    if (notes[0]) { notes[0].pages = [""]; notes[0].boxes = { 0: d.boxes } }
    localStorage.setItem("pulp-notes", JSON.stringify(notes))
  }, { boxes, flag })
  await page.reload()
  await expect(page.locator("#editor-paper")).toBeVisible()
}
const selected = (page: Page) => page.evaluate(() => getSelection()?.toString() ?? "")
async function clickGutter(page: Page) {
  const r = (await page.locator("#editor-paper").boundingBox())!
  await page.mouse.click(Math.max(5, r.x - 40), r.y + 300)
}
const boxCount = (page: Page) => page.locator('[id^="box-"]').count()

test("select-all on a page without boxes highlights nothing", async ({ page }) => {
  await bootGuest(page)
  await seed(page, [], "select-all-empty")
  await clickGutter(page)
  await page.keyboard.press("ControlOrMeta+a")
  expect(await selected(page)).toBe("")
  // Whatever the shortcut does, buttons never take part in a text selection.
  const userSelect = await page.locator("button:visible").first().evaluate(b => getComputedStyle(b).userSelect)
  expect(userSelect).toBe("none")
})

test("select-all in a box selects its text; on the page it selects the boxes", async ({ page }) => {
  await bootGuest(page)
  await seed(page, [box("a", 300, "First box"), box("b", 400, "Second box")], "select-all-boxes")
  await page.locator("#box-a [contenteditable]").first().click()
  await page.keyboard.press("ControlOrMeta+a")
  expect(await selected(page)).toBe("First box")

  await clickGutter(page)
  await page.keyboard.press("ControlOrMeta+a")
  expect(await selected(page)).toBe("")
  // Both boxes are selected: one Delete removes them.
  await page.keyboard.press("Backspace")
  await expect(page.locator('[id^="box-"]')).toHaveCount(0)
})

test("select-all with the page hidden (market) selects nothing, so Delete can't wipe boxes", async ({ page }) => {
  await bootGuest(page)
  await seed(page, [box("a", 300, "Keep me")], "select-all-market")
  expect(await boxCount(page)).toBe(1)
  const open = page.locator('[title="Open Sidebar"]'); if (await open.isVisible()) await open.click()
  await page.getByText("market", { exact: true }).first().click()
  await expect(page.locator(".seed-packet").first()).toBeVisible()
  await page.mouse.click(640, 140)
  await page.keyboard.press("ControlOrMeta+a")
  expect(await selected(page)).toBe("")
  await page.keyboard.press("Backspace")
  await page.keyboard.press("Escape")
  await page.getByText("market", { exact: true }).first().click().catch(() => {})
  await expect(page.locator("#box-a")).toBeAttached()
})
