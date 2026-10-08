// Split screen: the sidebar stays closed through brief width flickers (desktop switches).
import { test, expect, type Page } from "@playwright/test"
import { bootGuest } from "./import-helpers"

const sidebarOpen = async (page: Page) => (await page.locator('[title="Open Sidebar"]').count()) === 0

test("sidebar stays closed through a brief wide flicker, follows real resizes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await bootGuest(page)
  await page.setViewportSize({ width: 760, height: 900 })
  await expect.poll(() => sidebarOpen(page)).toBe(false)

  // Desktop-switch style flicker: wide for 120ms, then back.
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(120)
  await page.setViewportSize({ width: 760, height: 900 })
  await page.waitForTimeout(800)
  expect(await sidebarOpen(page)).toBe(false)

  // A real widen brings it back; a real narrow hides it again.
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect.poll(() => sidebarOpen(page), { timeout: 3000 }).toBe(true)
  await page.setViewportSize({ width: 760, height: 900 })
  await expect.poll(() => sidebarOpen(page), { timeout: 3000 }).toBe(false)

  // Open by hand, close by hand, then a flicker: stays closed.
  await page.locator('[title="Open Sidebar"]').click()
  await expect.poll(() => sidebarOpen(page)).toBe(true)
  await page.mouse.click(700, 450) // tap outside the overlay sidebar to close it
  await expect.poll(() => sidebarOpen(page)).toBe(false)
  await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(120)
  await page.setViewportSize({ width: 760, height: 900 }); await page.waitForTimeout(800)
  expect(await sidebarOpen(page)).toBe(false)
})
