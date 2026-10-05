// E2E for "topics as trees" against the running dev server (:3001).
// AI routes need auth, so they're mocked with page.route() — no DEV_SKIP_AUTH.
import { test, expect, type Page } from "@playwright/test"

const BASE = "http://localhost:3001"
const CARDS = [
  { q: "What does photosynthesis convert light into?", a: "Chemical energy" },
  { q: "Where does photosynthesis happen?", a: "Chloroplasts" },
  { q: "What pigment absorbs light?", a: "Chlorophyll" },
  { q: "What sugar is produced?", a: "Glucose" },
  { q: "What gas is released?", a: "Oxygen" },
]
const NOTES = "Photosynthesis converts light energy into chemical energy stored in glucose inside chloroplasts using chlorophyll."

type GroveTree = { id: number; stage: number; topic?: string; recallNeeded?: number; recallDone?: number }

async function mockAI(page: Page) {
  await page.route("**/api/recall/topic", r => r.fulfill({ json: { topic: "Photosynthesis", cards: CARDS } }))
  await page.route("**/api/recall/grade", r => r.fulfill({ json: { verdict: "correct", feedback: "Nice." } }))
  // Deck (re)generation, in case recall asks for it.
  await page.route("**/api/recall", r => r.fulfill({ json: { cards: CARDS } }))
}

const readGrove = (page: Page) => page.evaluate(() => {
  const raw = localStorage.getItem("pulp-grove")
  return (raw ? JSON.parse(raw).grove ?? [] : []) as GroveTree[]
})
// Session cards first come due the next morning; jump them to "now" for the test.
const makeCardsDueNow = (page: Page) => page.evaluate(() => {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k?.startsWith("pulp-recall-")) continue
    const deck = JSON.parse(localStorage.getItem(k)!)
    deck.cards = deck.cards.map((c: { due: number }) => ({ ...c, due: Date.now() - 1000 }))
    localStorage.setItem(k, JSON.stringify(deck))
  }
  window.dispatchEvent(new Event("pulp-cards-queued"))
})
const topicTrees = async (page: Page) => (await readGrove(page)).filter(t => t.topic === "Photosynthesis")

async function openApp(page: Page) {
  await page.goto(`${BASE}/app`)
  await page.getByText("Start Now").first().click()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
}

async function startTimer(page: Page) {
  await page.locator('[title^="Focus timer"]').first().click()
  await page.getByRole("button", { name: "30s", exact: true }).click()
  await page.getByRole("button", { name: "Start Session" }).click()
  await expect(page.getByTitle("Hover to see time left")).toBeVisible() // focus mode is up
}

// Full loop up to the claim: notes typed during the session get tagged.
async function plantTopicTree(page: Page) {
  await mockAI(page)
  await openApp(page)
  await startTimer(page)
  await page.locator('[contenteditable="true"]').first().click()
  await page.keyboard.type(NOTES)
  await page.getByRole("button", { name: "Claim Reward" }).click({ timeout: 60_000 })
}

test.use({ screenshot: "only-on-failure" })

test.describe("topics as trees (e2e)", () => {
  test.setTimeout(120_000)

  test("1. full loop: 30s session plants a tagged sapling", async ({ page }) => {
    await plantTopicTree(page)
    // Soft: keep checking the rest even if the toast wording is off.
    // A 30s session only reaches seed stage; the timer grows to sapling over the full grow time.
    await expect(page.getByText(/(seed|sprout|sapling) planted/)).toBeVisible()
    await expect(page.getByText(/5 cards ready tomorrow/)).toBeVisible({ timeout: 15_000 })
    await expect.poll(async () => (await topicTrees(page)).length).toBe(1)
    const [t] = await topicTrees(page)
    expect(t.recallNeeded).toBeGreaterThan(0)
    expect(t.stage).toBeLessThanOrEqual(2)
  })

  test("2. recall grows the topic tree to full", async ({ page }) => {
    await plantTopicTree(page)
    await expect.poll(async () => (await topicTrees(page)).length).toBe(1)
    await page.getByRole("button", { name: "Dismiss" }).click().catch(() => {})
    await expect(page.getByText(/5 cards ready tomorrow/)).toBeHidden() // not due yet
    await makeCardsDueNow(page)
    await page.getByRole("button", { name: /^recall · \d+$/ }).click()

    const box = page.getByPlaceholder("Type your answer from memory…")
    const done = page.getByRole("button", { name: "Done", exact: true })
    for (let i = 0; i < 20 && !(await done.isVisible()); i++) {
      await expect(box.or(done).first()).toBeVisible()
      if (await done.isVisible()) break
      await box.fill("answer")
      await box.press("Enter")
      await expect(page.getByText("Correct", { exact: true })).toBeVisible()
      await page.getByRole("button", { name: /^Good/ }).click()
    }
    await expect(page.getByText(/Reviewed \d+ cards?/)).toBeVisible()
    await done.click()
    await expect.poll(async () => (await topicTrees(page))[0]?.stage, { timeout: 10_000 }).toBe(4)
    const [t] = await topicTrees(page)
    expect(t.recallDone).toBeGreaterThanOrEqual(t.recallNeeded!)
    expect(t.stage).toBe(4)
  })

  test("3. due card: shows count, opens recall, × hides it", async ({ page }) => {
    await plantTopicTree(page)
    await page.getByRole("button", { name: "Dismiss" }).click().catch(() => {})
    const due = page.getByText(/\d+ cards? due/)
    await expect.poll(async () => (await topicTrees(page)).length).toBe(1)
    await expect(due).toBeHidden() // session cards wait until tomorrow
    await makeCardsDueNow(page)
    await expect(due).toBeVisible({ timeout: 15_000 })
    const card = due.locator("xpath=../..")
    await card.getByRole("button", { name: "Recall now" }).click()
    await expect(page.getByPlaceholder("Type your answer from memory…")).toBeVisible()
    await page.getByText("Recall Review").locator("xpath=../../..").getByTitle("Close")
      // The hanging mascot's string (z-9999) sits over this button, so a real click is blocked.
      .dispatchEvent("click")
    await expect(due).toBeVisible()
    await card.getByRole("button", { name: "Hide" }).click()
    await expect(due).toBeHidden()
  })

  test("4. focus mode: stage bar above the plot, hover shows time left, give up always shown", async ({ page }) => {
    await mockAI(page)
    await openApp(page)
    await startTimer(page)
    await page.mouse.move(900, 400) // off the bar

    const bar = page.getByTitle("Hover to see time left")
    await expect(bar).toContainText(/Seed|Sprout|Sapling/)
    await expect(page.getByText(/^\d\d:\d\d left$/)).toBeHidden()
    // Setup controls are gone while running.
    for (const name of ["30s", "15m", "45m", "90m", "Start Session"]) {
      await expect(page.getByRole("button", { name, exact: true })).toBeHidden()
    }
    // Cancel/Give Up is always visible.
    await expect(page.getByRole("button", { name: /Cancel \(\d+s\)|Give Up/ })).toBeVisible()
    // Hovering the bar swaps the stage name for the time left.
    await bar.hover()
    await expect(bar).toContainText(/\d\d:\d\d left/)
  })
})
