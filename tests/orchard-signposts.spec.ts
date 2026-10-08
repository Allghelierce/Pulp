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

// One tree per entry: its topic (none = untagged) and notebook ("a" = the first, "b" = Physics).
type Plant = [topic: string | undefined, nb: "a" | "b"]
// Due cards per notebook deck: [topic, how many due now].
type Due = { a?: [string, number][]; b?: [string, number][] }

// Notebook A: topic trees planted interleaved (so the grove layout has to gather them)
// + untagged trees. Notebook B ("Physics"): two Optics trees and one Photosynthesis tree.
// Photosynthesis has 2 cards due in A and 1 in B.
const PLAN: Plant[] = [
  [PHOTO, "a"], [MITOSIS, "a"], [undefined, "a"], [KREBS, "a"], [PHOTO, "a"], [MITOSIS, "a"],
  [PHOTO, "a"], [undefined, "a"], [KREBS, "a"], [OPTICS, "b"], [MITOSIS, "a"], [OPTICS, "b"], [PHOTO, "b"],
]
const DUE: Due = { a: [[PHOTO, 2]], b: [[PHOTO, 1]] }

// "Start Now" resets the grove, so seed after it, before boot.
async function seedOrchard(page: Page, { theme = "light", plan = PLAN, due = DUE }: { theme?: "light" | "dark"; plan?: Plant[]; due?: Due } = {}) {
  await page.goto(`${BASE}/app`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText("Start Now").first().click()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
  await page.addInitScript(({ theme, plan, due, MITOSIS }) => {
    if (sessionStorage.getItem("seeded")) return
    sessionStorage.setItem("seeded", "1")
    const now = Date.now()
    const ids = { a: localStorage.getItem("pulp-active-tab")!, b: "nb-physics" }
    const notes = JSON.parse(localStorage.getItem("pulp-notes") || "[]")
    const first = notes.find((n: { id: string }) => n.id === ids.a)
    notes.push({ ...first, id: ids.b, subject: "Physics" })
    localStorage.setItem("pulp-notes", JSON.stringify(notes))

    const grove = plan.map(([topic, nb], i) => ({
      id: 7000 + i, type: "tangerine", stage: 4, progress: 100, plantedAt: now - (plan.length - i) * 3_600_000, notebookId: ids[nb],
      ...(topic ? { topic, recallNeeded: 5, recallDone: 5 } : {}),
    }))
    const saved = JSON.parse(localStorage.getItem("pulp-grove") || "{}")
    delete saved.pulp_g_k // unsigned data is accepted
    localStorage.setItem("pulp-grove", JSON.stringify({ ...saved, juice: 0, gems: 0, grove, inventory: [] }))

    const card = (id: string, topic: string, due: number) =>
      ({ id, q: `${topic} question ${id}`, a: "x", ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, state: "review", due, last: now - 86_400_000, topic })
    for (const nb of ["a", "b"] as const) {
      const cards = (due[nb] ?? []).flatMap(([topic, n]) => Array.from({ length: n }, (_, i) => card(`${nb}-${topic}-${i}`, topic, now - 60_000)))
      if (nb === "a") cards.push(card("m1", MITOSIS, now + 3 * 86_400_000)) // has cards, none due
      localStorage.setItem(`pulp-recall-${ids[nb]}`, JSON.stringify({ noteId: ids[nb], generatedAt: now, noteHash: "", cards }))
    }
    const settings = JSON.parse(localStorage.getItem("pulp-settings") || "{}")
    localStorage.setItem("pulp-settings", JSON.stringify({ ...settings, theme }))
  }, { theme, plan, due, MITOSIS })
  await page.reload()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
}

async function openOrchard(page: Page) {
  const open = page.locator('[title="Open Sidebar"]')
  if (await open.isVisible()) await open.click()
  await page.getByText("grove", { exact: true }).first().click()
  await expect(page.locator("[data-grove-tree]").first()).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(800) // trees and signs pop in
}

async function filterTo(page: Page, name: RegExp) {
  await page.getByTitle("Filter by notebook").click()
  await page.getByRole("button", { name }).click()
  await page.waitForTimeout(600)
}

const sign = (page: Page, topic: string) => page.locator(`[data-grove-sign="${topic.toLowerCase()}"]`)

// Every tree on screen: id, topic, where its art is drawn (bottom = trunk base) and its inline transform.
type TreeBox = { id: string; topic: string; cx: number; cy: number; left: number; right: number; bottom: number; transform: string }
const trees = (page: Page) => page.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>("[data-grove-tree]")].map(el => {
    const r = el.querySelector("[data-mask-key]")!.getBoundingClientRect()
    return { id: el.dataset.groveTree!, topic: el.dataset.groveTopic || "", cx: r.left + r.width / 2, cy: r.top + r.height / 2, left: r.left, right: r.right, bottom: r.bottom, transform: el.style.transform }
  })) as Promise<TreeBox[]>
// Rows by trunk line, back to front, each left to right.
function rows(boxes: TreeBox[]): TreeBox[][] {
  const out: TreeBox[][] = []
  for (const b of [...boxes].sort((p, q) => p.bottom - q.bottom)) {
    const row = out[out.length - 1]
    if (row && Math.abs(row[0].bottom - b.bottom) < 12) row.push(b); else out.push([b])
  }
  return out.map(r => r.sort((p, q) => p.cx - q.cx))
}
// Topic of each tree in reading order (back row first, left to right).
const readingOrder = async (page: Page) => rows(await trees(page)).flat().map(t => t.topic)
// Grove order as shown: each topic once, in reading order.
const groveSequence = async (page: Page) => [...new Set((await readingOrder(page)).filter(Boolean))]

// Each sign hangs in front of the row of its grove it labels: plank below those trunks, centred on them.
async function expectSignsInFront(page: Page, topics: string[]) {
  const all = await trees(page)
  for (const t of topics) {
    const s = (await sign(page, t).boundingBox())!
    const mine = all.filter(b => b.topic === t.toLowerCase())
    const row = rows(mine).reduce((a, r) => (r.length >= a.length ? r : a))
    const cx = s.x + s.width / 2
    expect(cx, `${t} sign centred on its grove`).toBeGreaterThan(Math.min(...row.map(b => b.left)))
    expect(cx, `${t} sign centred on its grove`).toBeLessThan(Math.max(...row.map(b => b.right)))
    expect(s.y, `${t} plank below its trunks`).toBeGreaterThan(Math.max(...row.map(b => b.bottom)) - 3)
  }
}

// Edit-mode drag from one tree to a point (the grove layer hit-tests the drawn canopy).
async function drag(page: Page, from: TreeBox, to: { x: number; y: number }) {
  await page.mouse.move(from.cx, from.cy + 10)
  await page.mouse.down()
  await page.mouse.move(from.cx + 20, from.cy + 10, { steps: 4 })
  await page.mouse.move(to.x, to.y, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(700)
}

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
    await expect(sign(page, PHOTO)).toHaveAttribute("aria-label", `${PHOTO} grove, open recall (3 due)`)

    // Topic trees planted interleaved (and across notebooks) now stand together: one unbroken run each.
    const order = (await readingOrder(page)).filter(Boolean)
    const seen = new Set<string>()
    order.forEach((t, i) => {
      if (i > 0 && order[i - 1] !== t) expect(seen.has(t), `${t} split: ${order.join(" | ")}`).toBe(false)
      seen.add(t)
    })

    // Each sign stands in front of its own grove — never over its trunks — and signs don't overlap.
    await expectSignsInFront(page, [PHOTO, MITOSIS, KREBS, OPTICS])
    const boxes = await signs.evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON() as DOMRect))
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const p = boxes[i], q = boxes[j]
      const overlap = p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom
      expect(overlap, `signs ${i} and ${j} overlap`).toBe(false)
    }

    // Due badge only where cards are due; in the All view it counts every notebook (2 + 1).
    await expect(sign(page, PHOTO).locator("[data-sign-due]")).toHaveText("3")
    for (const t of [MITOSIS, KREBS, OPTICS]) await expect(sign(page, t).locator("[data-sign-due]")).toHaveCount(0)

    // Hover a tree, then move onto a sign: the tree lets go (no card left hanging), the
    // plank lifts, and its grove lights up while the rest fade.
    const photo = sign(page, PHOTO)
    const plank = photo.locator(".grove-sign-plank")
    expect(await plank.evaluate(el => getComputedStyle(el).cursor)).toBe("pointer")
    const krebsTree = (await trees(page)).find(b => b.topic === KREBS.toLowerCase())!
    await page.mouse.move(krebsTree.cx, krebsTree.cy)
    await expect(page.locator(".grove-tree.is-hovered")).toHaveCount(1)
    const before = (await plank.boundingBox())!
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2, { steps: 6 })
    await expect(page.locator(".grove-tree.is-hovered")).toHaveCount(0)
    await expect.poll(async () => (await plank.boundingBox())!.y).toBeLessThan(before.y - 1)
    await expect(page.locator(".grove-lit")).toHaveCount(4)
    await expect(page.locator('[data-grove-topic="photosynthesis"].grove-lit')).toHaveCount(4)
    // Only the wood takes the pointer: beside the post is the field (and the trees) again.
    const post = (await photo.boundingBox())!
    await page.mouse.move(post.x + 3, post.y + post.height - 2)
    await expect(page.locator(".grove-lit")).toHaveCount(0)

    const dir = process.env.SIGNPOST_SHOTS
    if (dir) {
      await page.mouse.move(5, 450)
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${dir}/signposts-${theme}.png` })
      await photo.hover()
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${dir}/signposts-${theme}-hover.png` })
    }

    // A screenshot hides the UI chrome (badges included) and puts it back as it was.
    const badge = sign(page, PHOTO).locator("[data-sign-due]")
    expect(await badge.evaluate(el => getComputedStyle(el).display)).toBe("flex")
    await page.getByTitle("Screenshot").click()
    await page.getByRole("button", { name: "Close", exact: true }).click({ timeout: 30_000 })
    expect(await badge.evaluate(el => getComputedStyle(el).display)).toBe("flex")

    // Click opens recall for that topic, where most of its cards are due (notebook A).
    await photo.click()
    await expect(page.getByText(`Review ${PHOTO}`)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(`${PHOTO} question a-${PHOTO}-0`).or(page.getByText(`${PHOTO} question a-${PHOTO}-1`)).first()).toBeVisible()
  })
}

test("per-notebook filter shows only that notebook's groves and counts; signs go inert in edit mode", async ({ page }) => {
  test.setTimeout(120_000)
  await seedOrchard(page, { theme: "dark" })
  await openOrchard(page)
  await expect(page.locator("[data-grove-sign]")).toHaveCount(4)

  // Edit mode: signs step aside (and say so) so drags reach the trees under them.
  await page.getByTitle("Edit layout").click()
  expect(await sign(page, OPTICS).locator(".grove-sign-plank").evaluate(el => getComputedStyle(el).pointerEvents)).toBe("none")
  await expect(sign(page, OPTICS)).toHaveAttribute("aria-disabled", "true")
  await page.getByTitle("Edit layout").click()
  expect(await sign(page, OPTICS).locator(".grove-sign-plank").evaluate(el => getComputedStyle(el).pointerEvents)).toBe("auto")
  await expect(sign(page, OPTICS)).not.toHaveAttribute("aria-disabled")

  // The focused-tree card keeps its own Recall button.
  await page.getByRole("button", { name: /^Photosynthesis · 3$/ }).click() // "Ready to recall" chip focuses a tree
  await expect(page.getByRole("button", { name: /^Recall Photosynthesis/ })).toBeVisible()
  await page.mouse.click(150, 880) // backdrop
  await expect(page.getByRole("button", { name: /^Recall Photosynthesis/ })).toHaveCount(0)

  // Physics only: its two groves, and the badge counts what's due in Physics — what a click opens.
  await filterTo(page, /^Physics\s*3$/)
  await expect(page.locator("[data-grove-sign]")).toHaveCount(2)
  await expect(page.locator("[data-grove-tree]")).toHaveCount(3)
  await expect(sign(page, OPTICS).locator("[data-sign-label]")).toHaveText(OPTICS)
  await expect(sign(page, PHOTO).locator("[data-sign-due]")).toHaveText("1")
  await sign(page, PHOTO).click()
  await expect(page.getByText(`Review ${PHOTO}`)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(`${PHOTO} question b-${PHOTO}-0`)).toBeVisible()
})

test("edit-mode drags rearrange within groves or trade whole groves, and never strand a tree", async ({ page }) => {
  test.setTimeout(120_000)
  await seedOrchard(page)
  await openOrchard(page) // "All notebooks": drags are saved per filter
  await page.getByTitle("Edit layout").click()
  const savedOrder = () => page.evaluate(() => JSON.parse(localStorage.getItem("pulp-slot-order") || "{}")._all as number[] | undefined)

  // A Photosynthesis tree dropped on a Krebs tree (neither its grove's first): the two groves trade places.
  expect(await groveSequence(page)).toEqual([PHOTO, MITOSIS, KREBS, OPTICS].map(t => t.toLowerCase()))
  let all = await trees(page)
  const krebs = all.filter(b => b.topic === "krebs cycle").sort((p, q) => p.cx - q.cx).at(-1)!
  await drag(page, all.filter(b => b.topic === "photosynthesis").sort((p, q) => p.cx - q.cx).at(-1)!, { x: krebs.cx, y: krebs.cy + 20 })
  expect(await groveSequence(page)).toEqual([KREBS, MITOSIS, PHOTO, OPTICS].map(t => t.toLowerCase()))
  await expect(sign(page, KREBS)).toHaveCount(1)
  await expectSignsInFront(page, [PHOTO, MITOSIS, KREBS, OPTICS])

  // Within a grove, two trees swap places.
  all = await trees(page)
  const [m1, m2] = all.filter(b => b.topic === MITOSIS.toLowerCase()).sort((p, q) => p.cx - q.cx)
  await drag(page, m1, { x: m2.cx, y: m2.cy + 20 })
  let after = await trees(page)
  expect(Math.abs(after.find(b => b.id === m1.id)!.cx - m2.cx)).toBeLessThan(8)
  expect(Math.abs(after.find(b => b.id === m2.id)!.cx - m1.cx)).toBeLessThan(8)
  expect(await groveSequence(page)).toEqual([KREBS, MITOSIS, PHOTO, OPTICS].map(t => t.toLowerCase()))

  // An untagged tree can't join a grove: it goes back to its own spot, drawn there as before.
  all = await trees(page)
  const order = await savedOrder()
  const loner = all.find(b => !b.topic)!
  const photoTree = all.find(b => b.topic === "photosynthesis")!
  await drag(page, loner, { x: photoTree.cx, y: photoTree.cy + 20 })
  after = await trees(page)
  const back = after.find(b => b.id === loner.id)!
  expect(back.transform).toBe(loner.transform)
  expect(Math.abs(back.cx - loner.cx) + Math.abs(back.cy - loner.cy)).toBeLessThan(8) // trees sway a little
  expect(await savedOrder()).toEqual(order)

  // Dropped on open ground: the tree goes to the end of its own grove, nowhere else.
  const lastPhoto = all.filter(b => b.topic === "photosynthesis").sort((p, q) => p.bottom - q.bottom || p.cx - q.cx).at(-1)!
  const firstPhoto = all.filter(b => b.topic === "photosynthesis").sort((p, q) => p.bottom - q.bottom || p.cx - q.cx)[0]
  const vp = page.viewportSize()!
  await drag(page, firstPhoto, { x: vp.width * 0.72, y: vp.height * 0.86 })
  after = await trees(page)
  const moved = after.find(b => b.id === firstPhoto.id)!
  expect(moved.transform).not.toBe("")
  expect(Math.abs(moved.cx - lastPhoto.cx) + Math.abs(moved.bottom - lastPhoto.bottom)).toBeLessThan(8)
  expect(await groveSequence(page)).toEqual([KREBS, MITOSIS, PHOTO, OPTICS].map(t => t.toLowerCase()))

  // The arrangement sticks after a reload.
  await page.reload()
  await openOrchard(page)
  expect(await groveSequence(page)).toEqual([KREBS, MITOSIS, PHOTO, OPTICS].map(t => t.toLowerCase()))
})

test("a busy plot keeps each grove on one row, its sign in front and clear of the recall strip", async ({ page }) => {
  test.setTimeout(120_000)
  // 36 trees: 3 untagged, then groves of 7, 5, 4, 6, 3 and 8, planted round-robin. Packed tight
  // they'd wrap rows; the 4 spare slots are enough to give every grove a row of its own.
  const sizes: [string, number][] = [["Alpha", 7], ["Bravo", 5], ["Charlie", 4], ["Delta", 6], ["Echo", 3], ["Foxtrot", 8]]
  const left = new Map(sizes)
  const plan: Plant[] = [[undefined, "a"], [undefined, "a"], [undefined, "a"]]
  while ([...left.values()].some(n => n > 0)) for (const [t] of sizes) if (left.get(t)! > 0) { plan.push([t, "a"]); left.set(t, left.get(t)! - 1) }
  await seedOrchard(page, { plan, due: { a: [["Alpha", 12]] } })
  await openOrchard(page)
  await expect(page.locator("[data-grove-tree]")).toHaveCount(36)
  await expect(page.locator("[data-grove-sign]")).toHaveCount(6)
  await expect(sign(page, "Alpha").locator("[data-sign-due]")).toHaveText("12")

  const byRow = rows(await trees(page))
  for (const [t] of sizes) {
    const rowsWith = byRow.filter(r => r.some(b => b.topic === t.toLowerCase()))
    expect(rowsWith.length, `${t} wraps across rows`).toBe(1)
  }
  // Back rows: each sign hangs below its grove's trunks. The front row's stands on the open
  // ground before the field, and never under the "Ready to recall" strip.
  await expectSignsInFront(page, ["Alpha", "Bravo", "Charlie", "Delta", "Echo"])
  const strip = (await page.locator("[data-recall-strip]").boundingBox())!
  for (const [t] of sizes) {
    const plank = (await sign(page, t).locator(".grove-sign-plank").boundingBox())!
    const under = plank.x < strip.x + strip.width && strip.x < plank.x + plank.width && plank.y + plank.height > strip.y
    expect(under, `${t} plank under the recall strip`).toBe(false)
  }
})
