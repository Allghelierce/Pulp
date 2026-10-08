// Highlighting text shows a size bubble next to it; changes apply and persist.
import { test, expect, type Page } from "@playwright/test"
import { bootGuest } from "./import-helpers"

const wordSize = (page: Page, word: string) => page.evaluate(w => {
  const root = document.getElementById("editor-paper")
  if (!root) return null
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent?.includes(w)) return Math.round(parseFloat(getComputedStyle(n.parentElement!).fontSize))
  return null
}, word)

test.use({ viewport: { width: 1440, height: 900 } })

test("select text -> bubble -> A+ and a preset size; it persists", async ({ page }) => {
  await bootGuest(page)
  const r = (await page.locator("#editor-paper").boundingBox())!
  await page.mouse.click(r.x + 120, r.y + 240)
  await page.keyboard.type("Mitochondria make ATP")
  const bubble = page.getByRole("toolbar", { name: "Text size" })
  await expect(bubble).toHaveCount(0)

  // select the word "make"
  await page.getByText("Mitochondria make ATP").dblclick({ position: { x: 125, y: 10 } })
  await expect(bubble).toBeVisible()
  const before = (await wordSize(page, "make"))!
  await bubble.getByRole("button", { name: "Bigger text" }).click()
  await expect.poll(() => wordSize(page, "make")).toBeGreaterThan(before)
  await expect(bubble).toBeVisible() // still there for more clicks

  await bubble.getByRole("button", { name: /^Text size/ }).click()
  await page.getByRole("option", { name: "36" }).click()
  await expect.poll(() => wordSize(page, "make")).toBe(36)
  expect(await wordSize(page, "Mitochondria")).toBe(before) // only the selection changed

  // click away (saves), reload, still 36
  await page.mouse.click(Math.max(5, r.x - 40), r.y + 300)
  await page.waitForTimeout(400)
  await page.reload()
  await expect(page.locator("#editor-paper")).toBeVisible()
  await expect.poll(() => wordSize(page, "make")).toBe(36)
})
