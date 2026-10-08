// Orchard signposts: trees that share a topic stand together as a grove, with a
// wooden sign in front naming the topic, a due badge when it has cards to recall,
// and a click that opens that topic's recall. Runs against the dev server at PULP_URL.
// Set SIGNPOST_SHOTS=<dir> to save light/dark screenshots of the grove there.
import { test, expect, type Page } from "@playwright/test"
import { BASE } from "./import-helpers"

const PHOTO = "Photosynthesis"
const MITOSIS = "Mitosis and the Cell Cycle Checkpoints" // long: truncated on the plank
const KREBS = "Krebs Cycle"
const OPTICS = "Optics" // only in the second notebook

type Seed = { theme: "light" | "dark" }

// Guest with two notebooks. Notebook A: topic trees planted interleaved (so the grove
// layout has to gather them) + untagged trees, and 2 Photosynthesis cards due now.
// Notebook B: two Optics trees. "Start Now" resets the grove, so seed after it, before boot.
async function seedOrchard(page: Page, { theme }: Seed) {
  await page.goto(`${BASE}/app`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText("Start Now").first().click()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
  await page.addInitScript(({ theme, PHOTO, MITOSIS, KREBS, OPTICS }) => {
    if (sessionStorage.getItem("seeded")) return
    sessionStorage.setItem("seeded", "1")
    const now = Date.now()
    const a = localStorage.getItem("pulp-active-tab")!
    const notes = JSON.parse(localStorage.getItem("pulp-notes") || "[]")
    const b = "nb-optics"
    const first = notes.find((n: { id: string }) => n.id === a)
    notes.push({ ...first, id: b, subject: "Physics" })
    localStorage.setItem("pulp-notes", JSON.stringify(notes))

    const plan: [string | undefined, string][] = [
      [PHOTO, a], [MITOSIS, a], [undefined, a], [KREBS, a], [PHOTO, a], [MITOSIS, a],
      [PHOTO, a], [undefined, a], [KREBS, a], [OPTICS, b], [MITOSIS, a], [OPTICS, b],
    ]
    const grove = plan.map(([topic, notebookId], i) => ({
      id: 7000 + i, type: "tangerine", stage: 4, progress: 100, plantedAt: now - (plan.length - i) * 3_600_000, notebookId,
      ...(topic ? { topic, recallNeeded: 5, recallDone: 5 } : {}),
    }))
    const saved = JSON.parse(localStorage.getItem("pulp-grove") || "{}")
    delete saved.pulp_g_k // unsigned data is accepted
    localStorage.setItem("pulp-grove", JSON.stringify({ ...saved, juice: 0, gems: 0, grove, inventory: [] }))

    const card = (id: string, q: string, topic: string, due: number) =>
      ({ id, q, a: "x", ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, state: "review", due, last: now - 86_400_000, topic })
    localStorage.setItem(`pulp-recall-${a}`, JSON.stringify({
      noteId: a, generatedAt: now, noteHash: "", cards: [
        card("p1", "What does photosynthesis make?", PHOTO, now - 60_000),
        card("p2", "Where does it happen?", PHOTO, now - 60_000),
        card("m1", "Name the phases of mitosis.", MITOSIS, now + 3 * 86_400_000),
      ],
    }))
    const settings = JSON.parse(localStorage.getItem("pulp-settings") || "{}")
    localStorage.setItem("pulp-settings", JSON.stringify({ ...settings, theme }))
  }, { theme, PHOTO, MITOSIS, KREBS, OPTICS })
  await page.reload()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
}

async function openOrchard(page: Page) {
  const open = page.locator('[title="Open Sidebar"]')
  if (await open.isVisible()) await open.click()
  await page.getByText("grove", { exact: true }).first().click()
  await expect(page.locator("[data-grove-tree]").first()).toBeVisible({ timeout: 15_000 })
}

const sign = (page: Page, topic: string) => page.locator(`[data-grove-sign="${topic.toLowerCase()}"]`)

// Topic of each tree on screen, in reading order (back row first, left to right).
const readingOrder = (page: Page) => page.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>("[data-grove-tree]")]
    .map(el => { const r = el.getBoundingClientRect(); return { topic: el.dataset.groveTopic || "", x: r.left + r.width / 2, y: r.bottom } })
    .sort((p, q) => (Math.abs(p.y - q.y) > 8 ? p.y - q.y : p.x - q.x))
    .map(t => t.topic))

test.use({ viewport: { width: 1440, height: 900 }, screenshot: "only-on-failure" })

for (const theme of ["light", "dark"] as const) {
  test(`groves get one signpost per topic, with due badge and recall on click (${theme})`, async ({ page }) => {
    test.setTimeout(120_000)
    await seedOrchard(page, { theme })
    await openOrchard(page)

    // One sign per topic in the "All notebooks" view; untagged trees get none.
    const signs = page.locator("[data-grove-sign]")
    await expect(signs).toHaveCount(4)
    for (const t of [PHOTO, KREBS, OPTICS]) await expect(sign(page, t).locator("[data-sign-label]")).toHaveText(t)
    // Long names are truncated on the plank but kept whole in the title.
    await expect(sign(page, MITOSIS)).toHaveAttribute("title", MITOSIS)
    const label = sign(page, MITOSIS).locator("[data-sign-label]")
    expect(await label.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)

    // Topic trees planted interleaved now stand together: each topic is one unbroken run.
    const order = (await readingOrder(page)).filter(Boolean)
    const seen = new Set<string>()
    order.forEach((t, i) => {
      if (i > 0 && order[i - 1] !== t) expect(seen.has(t), `${t} split: ${order.join(" | ")}`).toBe(false)
      seen.add(t)
    })

    // Each sign stands in front of its own grove: under its front row, within its span.
    for (const t of [PHOTO, MITOSIS, KREBS, OPTICS]) {
      const s = await sign(page, t).boundingBox()
      const trees = await page.locator(`[data-grove-topic="${t.toLowerCase()}"]`).evaluateAll(els => els.map(el => {
        const r = el.getBoundingClientRect(); return { l: r.left, r: r.right, b: r.bottom }
      }))
      const frontB = Math.max(...trees.map(r => r.b))
      const front = trees.filter(r => Math.abs(r.b - frontB) < 12)
      const cx = s!.x + s!.width / 2
      expect(cx).toBeGreaterThan(Math.min(...front.map(r => r.l)))
      expect(cx).toBeLessThan(Math.max(...front.map(r => r.r)))
      expect(s!.y + s!.height).toBeGreaterThan(frontB) // foot past the trunks
    }

    // Signs don't overlap each other.
    const boxes = await signs.evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON() as DOMRect))
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const p = boxes[i], q = boxes[j]
      const overlap = p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom
      expect(overlap, `signs ${i} and ${j} overlap`).toBe(false)
    }

    // Due badge only where cards are due.
    await expect(sign(page, PHOTO).locator("[data-sign-due]")).toHaveText("2")
    for (const t of [MITOSIS, KREBS, OPTICS]) await expect(sign(page, t).locator("[data-sign-due]")).toHaveCount(0)

    // Hover: pointer cursor, the plank lifts, and its grove lights up while the rest fade.
    const photo = sign(page, PHOTO)
    expect(await photo.evaluate(el => getComputedStyle(el).cursor)).toBe("pointer")
    const before = await photo.locator(".grove-sign-plank").boundingBox()
    await photo.hover()
    await expect.poll(async () => (await photo.locator(".grove-sign-plank").boundingBox())!.y).toBeLessThan(before!.y - 1)
    await expect(page.locator(".grove-lit")).toHaveCount(3)
    await expect(page.locator('[data-grove-topic="photosynthesis"].grove-lit')).toHaveCount(3)

    const dir = process.env.SIGNPOST_SHOTS
    if (dir) {
      await page.mouse.move(5, 450)
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${dir}/signposts-${theme}.png` })
      await photo.hover()
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${dir}/signposts-${theme}-hover.png` })
    }

    // Click opens recall for that topic.
    await photo.click()
    await expect(page.getByText(`Review ${PHOTO}`)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText("What does photosynthesis make?").or(page.getByText("Where does it happen?")).first()).toBeVisible()
  })
}

test("per-notebook filter shows only that notebook's groves, and the tree card's Recall still works", async ({ page }) => {
  test.setTimeout(120_000)
  await seedOrchard(page, { theme: "dark" })
  await openOrchard(page)
  await expect(page.locator("[data-grove-sign]")).toHaveCount(4)

  await page.getByTitle("Filter by notebook").click()
  await page.getByRole("button", { name: /^Physics\s*2$/ }).click()
  await expect(page.locator("[data-grove-sign]")).toHaveCount(1)
  await expect(sign(page, OPTICS).locator("[data-sign-label]")).toHaveText(OPTICS)
  await expect(page.locator("[data-grove-tree]")).toHaveCount(2)

  // Arranging trees: signs step aside so drags reach the trees under them.
  await page.getByTitle("Edit layout").click()
  expect(await sign(page, OPTICS).evaluate(el => getComputedStyle(el).pointerEvents)).toBe("none")
  await page.getByTitle("Edit layout").click()
  expect(await sign(page, OPTICS).evaluate(el => getComputedStyle(el).pointerEvents)).toBe("auto")

  // Back to all notebooks; the focused-tree card keeps its own Recall button.
  await page.getByTitle("Filter by notebook").click()
  await page.getByRole("button", { name: /^All notebooks\s*12$/ }).click()
  await expect(page.locator("[data-grove-sign]")).toHaveCount(4)
  await page.getByRole("button", { name: /^Photosynthesis · 2$/ }).click() // "Ready to recall" chip focuses a tree
  await page.getByRole("button", { name: /^Recall Photosynthesis/ }).click()
  await expect(page.getByText(`Review ${PHOTO}`)).toBeVisible({ timeout: 15_000 })
})
