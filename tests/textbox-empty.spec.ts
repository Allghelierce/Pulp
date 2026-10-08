// Empty text boxes go away when the user clicks off them; typed ones stay.
import { test, expect, type Page } from "@playwright/test"
import { bootGuest } from "./import-helpers"

const boxes = (page: Page) => page.locator('#editor-paper [id^="box-"]')
const emptyBoxes = (page: Page) => page.evaluate(() => [...document.querySelectorAll('#editor-paper [id^="box-"] [contenteditable]')]
  .filter(el => !(el as HTMLElement).innerText.replace(/​/g, "").trim()).length)

async function clickPaper(page: Page, x: number, y: number) {
  const r = (await page.locator("#editor-paper").boundingBox())!
  await page.mouse.click(r.x + x, r.y + y)
}
async function clickAway(page: Page) {
  const r = (await page.locator("#editor-paper").boundingBox())!
  await page.mouse.click(Math.max(5, r.x - 40), r.y + 300) // the dark gutter beside the paper
}

test.use({ viewport: { width: 1440, height: 900 } })

test("empty box is removed on click-away; a typed one stays", async ({ page }) => {
  await bootGuest(page)
  await clickPaper(page, 300, 420)
  await expect(page.locator("#editor-paper [contenteditable]:focus")).toHaveCount(1)
  const withNew = await boxes(page).count()
  await clickAway(page)
  await expect.poll(() => emptyBoxes(page)).toBe(0)
  expect(await boxes(page).count()).toBeLessThan(withNew)

  await clickPaper(page, 300, 520)
  await page.keyboard.type("keep me")
  await clickAway(page)
  await page.waitForTimeout(400)
  await expect(page.locator("#editor-paper").getByText("keep me")).toBeVisible()
})

test("an empty sticky note is kept", async ({ page }) => {
  await bootGuest(page)
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("pulp-notes") || "[]").length)).toBeGreaterThan(0)
  // The app saves notes on unload, so inject the sticky before it boots (once).
  await page.addInitScript(() => {
    if (sessionStorage.getItem("sticky-seeded")) return
    sessionStorage.setItem("sticky-seeded", "1")
    const notes = JSON.parse(localStorage.getItem("pulp-notes") || "[]")
    if (notes[0]) notes[0].boxes = { 0: [{ id: "stickyx", x: 300, y: 300, w: 200, h: 200, content: "", boxHighlightColor: "#fde68a" }] }
    localStorage.setItem("pulp-notes", JSON.stringify(notes))
  })
  await page.reload()
  await page.locator("#box-stickyx [contenteditable]").click()
  await clickAway(page)
  await page.waitForTimeout(400)
  await expect(page.locator("#box-stickyx")).toHaveCount(1)
})
