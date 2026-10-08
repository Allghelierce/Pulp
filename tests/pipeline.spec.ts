// E2E for the core economy loop against the running dev server (:3000):
// grove trees make sap -> buy a seed in the market -> it shows in Seeds ->
// pick it in the timer -> finish a session -> that tree is in the grove.
// AI routes need auth, so session tagging is mocked with page.route().
import { test, expect, type Page } from "@playwright/test"

const BASE = process.env.PULP_URL || "http://localhost:3000"
const NOTES = "Photosynthesis converts light energy into chemical energy stored in glucose inside chloroplasts."

type Saved = { juice?: number; inventory?: string[]; grove?: { id: number; type: string; stage: number; notebookId?: string }[] }
const readSaved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("pulp-grove") || "{}") as Saved)

// 40 full-grown high-yield trees (legacy: no recall needed), sap 0, never collected.
// "Start Now" starts a guest fresh (it resets the grove), so seed after it.
async function seedGrove(page: Page) {
  await page.goto(`${BASE}/app`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText("Start Now").first().click()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
  // The app writes its in-memory state on unload, so inject before it boots (once).
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return
    sessionStorage.setItem("seeded", "1")
    const now = Date.now()
    const types = ["abyss", "starweaver", "prismatic"]
    // Trees need a notebook: the app drops unassigned trees on load.
    const notebookId = localStorage.getItem("pulp-active-tab")
    const grove = Array.from({ length: 40 }, (_, i) => ({ id: 1000 + i, type: types[i % 3], stage: 4, progress: 100, plantedAt: now - 86_400_000, notebookId }))
    const saved = JSON.parse(localStorage.getItem("pulp-grove") || "{}")
    delete saved.pulp_g_k // unsigned data is accepted
    localStorage.setItem("pulp-grove", JSON.stringify({ ...saved, juice: 0, gems: 0, grove, inventory: [] }))
  })
  await page.reload()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
  expect((await readSaved(page)).grove?.length).toBe(40)
}

test.use({ screenshot: "only-on-failure", viewport: { width: 1440, height: 900 } })

test("economy loop: grove sap -> market seed -> Seeds -> timer -> grove", async ({ page }) => {
  test.setTimeout(240_000)
  await page.route("**/api/recall/topic", r => r.fulfill({ json: { topic: "Photosynthesis", cards: [{ q: "What does photosynthesis make?", a: "Glucose" }] } }))
  await seedGrove(page)

  // 1. Collect sap from the grove.
  await page.locator("span.tabular-nums", { hasText: /^0$/ }).first().click()
  await page.getByRole("button", { name: "Open Grove" }).click()
  const collect = page.locator('button', { has: page.locator("svg") }).filter({ hasText: /^\+\d+$/ })
  await expect(collect).toBeEnabled({ timeout: 15_000 })
  await collect.click()
  await expect.poll(async () => (await readSaved(page)).juice ?? 0, { timeout: 10_000 }).toBeGreaterThan(1000)
  const sapAfterCollect = (await readSaved(page)).juice!
  await page.keyboard.press("Escape")

  // 2. Buy the first affordable seed in the market.
  const openSidebar = async () => { if (await page.locator('[title="Open Sidebar"]').isVisible()) await page.locator('[title="Open Sidebar"]').click() }
  await openSidebar()
  await page.getByText("market", { exact: true }).first().click()
  const cards = page.locator(".seed-packet")
  await expect(cards.first()).toBeVisible()
  let bought: string | null = null
  // Cards float (never "stable"), so clicks are forced.
  for (let i = 0; i < await cards.count() && !bought; i++) {
    await cards.nth(i).click({ force: true }) // reveal
    await expect(cards.nth(i)).toHaveClass(/seed-revealed/, { timeout: 15_000 })
    await page.waitForTimeout(700) // reveal effect
    await cards.nth(i).locator("> div").first().click({ force: true }) // open preview
    const buy = page.getByRole("button", { name: /^Buy ·/ })
    await buy.waitFor({ timeout: 5_000 }).catch(() => {})
    console.log(`card ${i}:`, await buy.isVisible() ? await buy.innerText() : "no buy button", await buy.isEnabled().catch(() => false))
    if (await buy.isVisible() && await buy.isEnabled()) {
      const before = (await readSaved(page)).inventory?.length ?? 0
      await buy.click()
      await expect.poll(async () => (await readSaved(page)).inventory?.length ?? 0).toBe(before + 1)
      bought = (await readSaved(page)).inventory!.at(-1)!
    }
  }
  expect(bought, "an affordable seed in the market").toBeTruthy()
  expect((await readSaved(page)).juice!).toBeLessThan(sapAfterCollect)

  // 3. It shows in the Seeds collection.
  await page.getByRole("button", { name: "Seeds" }).first().click()
  await expect(page.getByText(/Buy seeds from the market/)).toHaveCount(0)
  await page.keyboard.press("Escape")

  // 4. Plant it in the timer and finish a 30s session.
  await openSidebar()
  await page.locator('[title^="Focus timer"]').first().click()
  await page.locator('div[style*="height: 160px"]').first().click()
  await page.getByText("Choose a plant").waitFor()
  // Tangerine is always offered first; pick the bought seed.
  await page.locator(".grid.grid-cols-4 button").filter({ hasNotText: /free/i }).first().click() // Tangerine (free) is always offered first; pick the bought seed
  await page.getByRole("button", { name: "30s", exact: true }).click()
  await page.getByRole("button", { name: "Start Session" }).click()
  await page.locator('[contenteditable="true"]').first().click()
  await page.keyboard.type(NOTES)
  await page.getByRole("button", { name: "Claim Reward" }).click({ timeout: 60_000 })

  // 5. The bought tree is now in the grove, and the seed was spent.
  await expect.poll(async () => (await readSaved(page)).grove?.filter(t => t.type === bought && t.id >= 2000).length ?? 0, { timeout: 15_000 }).toBe(1)
  expect((await readSaved(page)).inventory ?? []).not.toContain(bought)
})
