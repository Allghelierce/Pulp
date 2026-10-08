// Docs-style lists: Tab nests a bullet (new shape per level), Shift+Tab / Backspace un-nest.
import { test, expect, type Page } from "@playwright/test"
import { bootGuest } from "./import-helpers"

// Depth + computed bullet shape of the list item holding the caret.
const caretItem = (page: Page) => page.evaluate(() => {
  const sel = window.getSelection()!
  const n = sel.anchorNode!
  const li = (n.nodeType === 1 ? n as HTMLElement : n.parentElement)!.closest("li")
  if (!li) return null
  let depth = 0
  for (let p: HTMLElement | null = li.parentElement; p && !p.isContentEditable === false && p.matches("ul, ol, li, ul *, ol *"); p = p.parentElement) if (p.matches("ul, ol")) depth++
  return { depth, shape: getComputedStyle(li.parentElement!).listStyleType, text: li.firstChild?.textContent ?? "" }
})

test.use({ viewport: { width: 1440, height: 900 } })

test("Tab nests bullets with new shapes; Shift+Tab and Backspace un-nest", async ({ page }) => {
  await bootGuest(page)
  const editor = page.locator('[contenteditable="true"]').first()
  await editor.click()
  await page.keyboard.type("- one")
  expect(await caretItem(page)).toMatchObject({ depth: 1, shape: "disc" })

  await page.keyboard.press("Enter")
  await page.keyboard.type("two")
  await page.keyboard.press("Tab")
  expect(await caretItem(page)).toMatchObject({ depth: 2, shape: "circle" })

  await page.keyboard.press("Enter")
  await page.keyboard.type("three")
  await page.keyboard.press("Tab")
  expect(await caretItem(page)).toMatchObject({ depth: 3, shape: "square" })
  await expect(editor).toBeFocused() // Tab didn't move focus out of the page

  await page.keyboard.press("Shift+Tab")
  expect(await caretItem(page)).toMatchObject({ depth: 2, shape: "circle" })

  // Backspace at the very start of a nested item un-nests it.
  await page.keyboard.press("Home")
  await page.keyboard.press("Backspace")
  expect(await caretItem(page)).toMatchObject({ depth: 1, shape: "disc" })

  // Shift+Tab at the top level does nothing (stays a bullet).
  await page.keyboard.press("Shift+Tab")
  expect(await caretItem(page)).toMatchObject({ depth: 1, shape: "disc" })
})

test("numbered lists nest 1. -> a. -> i.", async ({ page }) => {
  await bootGuest(page)
  await page.locator('[contenteditable="true"]').first().click()
  await page.keyboard.type("1. first")
  expect((await caretItem(page))?.shape).toBe("decimal")
  await page.keyboard.press("Enter"); await page.keyboard.type("second"); await page.keyboard.press("Tab")
  expect((await caretItem(page))?.shape).toBe("lower-alpha")
  await page.keyboard.press("Enter"); await page.keyboard.type("third"); await page.keyboard.press("Tab")
  expect((await caretItem(page))?.shape).toBe("lower-roman")
})
