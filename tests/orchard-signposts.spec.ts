// Orchard signposts: trees that share a topic stand together as a grove, each tree with a
// small wooden marker naming its topic. Tapping a tree (or its marker) shows its topic and
// lets you review that session's cards, the whole topic, or name an untitled tree.
// Runs against the dev server at PULP_URL.
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
// Cards one session made: tree index in the plan -> how many (all due now).
type Sessions = Record<number, number>

// Notebook A: topic trees planted interleaved (so the grove layout has to gather them)
// + untagged trees. Notebook B ("Physics"): two Optics trees and one Photosynthesis tree.
// Photosynthesis has 2 cards due in A and 1 in B.
const PLAN: Plant[] = [
  [PHOTO, "a"], [MITOSIS, "a"], [undefined, "a"], [KREBS, "a"], [PHOTO, "a"], [MITOSIS, "a"],
  [PHOTO, "a"], [undefined, "a"], [KREBS, "a"], [OPTICS, "b"], [MITOSIS, "a"], [OPTICS, "b"], [PHOTO, "b"],
]
const DUE: Due = { a: [[PHOTO, 2]], b: [[PHOTO, 1]] }

// "Start Now" resets the grove, so seed after it, before boot.
async function seedOrchard(page: Page, { theme = "light", plan = PLAN, due = DUE, sessions = {}, extra = {} }: {
  theme?: "light" | "dark"; plan?: Plant[]; due?: Due; sessions?: Sessions; extra?: Record<number, object>
} = {}) {
  await page.goto(`${BASE}/app`)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText("Start Now").first().click()
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
  await page.addInitScript(({ theme, plan, due, sessions, extra, MITOSIS }) => {
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
      ...(extra[i] || {}),
    }))
    const saved = JSON.parse(localStorage.getItem("pulp-grove") || "{}")
    delete saved.pulp_g_k // unsigned data is accepted
    localStorage.setItem("pulp-grove", JSON.stringify({ ...saved, juice: 0, gems: 0, grove, inventory: [] }))

    const card = (id: string, topic: string, due: number): Record<string, unknown> =>
      ({ id, q: `${topic} question ${id}`, a: "x", ease: 2.5, intervalDays: 1, reps: 1, lapses: 0, state: "review", due, last: now - 86_400_000, topic })
    for (const nb of ["a", "b"] as const) {
      const cards = (due[nb] ?? []).flatMap(([topic, n]) => Array.from({ length: n }, (_, i) => card(`${nb}-${topic}-${i}`, topic, now - 60_000)))
      if (nb === "a") cards.push(card("m1", MITOSIS, now + 3 * 86_400_000)) // has cards, none due
      for (const [i, n] of Object.entries(sessions)) {
        const [topic, tnb] = plan[Number(i)]
        if (tnb !== nb) continue
        for (let k = 0; k < n; k++) cards.push({ ...card(`s${i}-${k}`, topic || "", now - 60_000), q: `Session ${i} question ${k}`, treeId: 7000 + Number(i) })
      }
      localStorage.setItem(`pulp-recall-${ids[nb]}`, JSON.stringify({ noteId: ids[nb], generatedAt: now, noteHash: "", cards }))
    }
    const settings = JSON.parse(localStorage.getItem("pulp-settings") || "{}")
    localStorage.setItem("pulp-settings", JSON.stringify({ ...settings, theme }))
  }, { theme, plan, due, sessions, extra, MITOSIS })
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

// Every marker's label box, with its tree.
const markers = (page: Page) => page.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>("[data-tree-marker]")].map(el => {
    const label = el.querySelector("span")!
    const r = label.getBoundingClientRect()
    return { tree: el.closest<HTMLElement>("[data-grove-tree]")!.dataset.groveTree!, text: label.textContent || "", title: label.title, truncated: label.scrollWidth > label.clientWidth, left: r.left, right: r.right, top: r.top, bottom: r.bottom }
  }))

// The open tree card.
const card = (page: Page) => page.locator("[data-tree-card]")
async function openTree(page: Page, id: number) {
  const box = (await trees(page)).find(b => b.id === String(id))!
  await page.mouse.click(box.cx, box.cy + 8)
  await expect(card(page)).toBeVisible()
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
  test(`every topic tree has a small marker naming it, beside its trunk (${theme})`, async ({ page }) => {
    test.setTimeout(120_000)
    await seedOrchard(page, { theme })
    await openOrchard(page)

    // One marker per topic tree (11 of 13); untagged trees get none.
    const all = await markers(page)
    expect(all).toHaveLength(11)
    const boxes = await trees(page)
    for (const m of all) {
      const tree = boxes.find(b => b.id === m.tree)!
      expect(m.text.toLowerCase()).toBe(tree.topic)
      expect(m.title).toBe(m.text)
      // In front of the tree, just below its trunk and centred on it, and small next to it.
      expect(m.top, `${m.text} marker below its trunk`).toBeGreaterThan(tree.bottom - 4)
      expect(m.top, `${m.text} marker near its trunk`).toBeLessThan(tree.bottom + 40)
      expect(Math.abs((m.left + m.right) / 2 - tree.cx), `${m.text} marker centred on its tree`).toBeLessThan(6)
      expect(m.right - m.left, `${m.text} marker no wider than its tree`).toBeLessThan(Math.max(80, tree.right - tree.left))
    }
    // Long names are truncated on the marker but kept whole in the title.
    expect(all.find(m => m.title === MITOSIS)!.truncated).toBe(true)
    // Markers never cover one another.
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const p = all[i], q = all[j]
      const overlap = p.left < q.right - 1 && q.left < p.right - 1 && p.top < q.bottom - 1 && q.top < p.bottom - 1
      expect(overlap, `markers ${p.text} and ${q.text} overlap`).toBe(false)
    }

    // Topic trees planted interleaved (and across notebooks) now stand together: one unbroken run each.
    const order = (await readingOrder(page)).filter(Boolean)
    const seen = new Set<string>()
    order.forEach((t, i) => {
      if (i > 0 && order[i - 1] !== t) expect(seen.has(t), `${t} split: ${order.join(" | ")}`).toBe(false)
      seen.add(t)
    })

    const dir = process.env.SIGNPOST_SHOTS
    if (dir) {
      await page.mouse.move(5, 450)
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${dir}/signposts-${theme}.png` })
    }

    // A marker is part of its tree: hovering it shows the tree's card, tapping it opens the tree.
    const krebs = all.find(m => m.text === KREBS)!
    await page.mouse.move((krebs.left + krebs.right) / 2, (krebs.top + krebs.bottom) / 2)
    await expect(page.locator(`.grove-tree.is-hovered[data-grove-tree="${krebs.tree}"]`)).toHaveCount(1)
    await page.mouse.click((krebs.left + krebs.right) / 2, (krebs.top + krebs.bottom) / 2)
    await expect(card(page).locator("[data-tree-topic]")).toHaveText(KREBS)
    if (dir) await page.screenshot({ path: `${dir}/signposts-${theme}-card.png` })
  })
}

test("a tree's card shows its topic and reviews that session, or all of the topic", async ({ page }) => {
  test.setTimeout(120_000)
  // Tree 4 (Photosynthesis, notebook A) made 3 cards in its session; the topic has 2 more due in A.
  await seedOrchard(page, { theme: "dark", sessions: { 4: 3 } })
  await openOrchard(page)

  await openTree(page, 7004)
  await expect(card(page).locator("[data-tree-topic]")).toHaveText(PHOTO)
  await expect(card(page).getByText("Session cards")).toBeVisible()
  await expect(card(page).locator("[data-review-session]")).toHaveText("Review this session · 3 due")
  // The topic reaches further than this session: all of it, everywhere (2 + 1 + 3 due).
  await expect(card(page).locator("[data-review-topic]")).toHaveText(`All of ${PHOTO} · 6 due`)
  if (process.env.SIGNPOST_SHOTS) await page.screenshot({ path: `${process.env.SIGNPOST_SHOTS}/tree-card-session.png` })

  // Review this session: only the cards this tree's session made.
  await card(page).locator("[data-review-session]").click()
  await expect(page.getByText(`Review session · ${PHOTO}`)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/^Session 4 question \d$/)).toBeVisible()
  await expect(page.getByText(/1 of 3/)).toBeVisible()

  // Another Photosynthesis tree with no session cards: its card recalls the topic.
  await page.getByTitle("Close", { exact: true }).last().click()
  await openOrchard(page)
  await openTree(page, 7000)
  await expect(card(page).locator("[data-review-session]")).toHaveCount(0)
  await expect(card(page).locator("[data-review-topic]")).toHaveText(`Recall ${PHOTO} · 6 due`)
  await card(page).locator("[data-review-topic]").click()
  await expect(page.getByText(`Review ${PHOTO}`)).toBeVisible({ timeout: 15_000 })
})

test("an untitled tree can be named from its card; a guessed topic says so", async ({ page }) => {
  test.setTimeout(120_000)
  // Tree 2 is untitled; tree 7 carries a topic guessed from the notes (the AI couldn't name it).
  await seedOrchard(page, { extra: { 7: { topic: "Cell Membranes", topicGuess: true, recallNeeded: 5, recallDone: 0, stage: 2 } } })
  await openOrchard(page)
  const before = (await markers(page)).length

  await openTree(page, 7002)
  await card(page).getByRole("button", { name: /Untitled session/ }).click()
  await card(page).getByLabel("Topic").fill("Enzymes")
  await card(page).getByRole("button", { name: "Save" }).click()
  await expect(card(page).locator("[data-tree-topic]")).toHaveText("Enzymes")
  await page.mouse.click(150, 880) // backdrop
  await expect(card(page)).toHaveCount(0)
  await expect.poll(async () => (await markers(page)).length).toBe(before + 1)
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("pulp-grove")!).grove.find((t: { id: number }) => t.id === 7002).topic)).toBe("Enzymes")

  await openTree(page, 7007)
  await expect(card(page).locator("[data-tree-topic]")).toHaveText("Cell Membranes")
  await expect(card(page).getByText(/Guessed from your notes/)).toBeVisible()
  await card(page).getByRole("button", { name: "rename" }).click()
  await card(page).getByLabel("Topic").fill("Membranes")
  await card(page).getByRole("button", { name: "Save" }).click()
  await expect(card(page).locator("[data-tree-topic]")).toHaveText("Membranes")
  await expect(card(page).getByText(/Guessed from your notes/)).toHaveCount(0)
})

test("per-notebook filter shows only that notebook's trees; the recall strip opens a tree", async ({ page }) => {
  test.setTimeout(120_000)
  await seedOrchard(page, { theme: "dark" })
  await openOrchard(page)

  // The "Ready to recall" chip focuses that topic's newest tree, whose card recalls it.
  await page.getByRole("button", { name: /^Photosynthesis · 3$/ }).click()
  await expect(card(page).locator("[data-review-topic]")).toHaveText(/^Recall Photosynthesis/)
  await page.mouse.click(150, 880) // backdrop
  await expect(card(page)).toHaveCount(0)

  // Physics only: its three trees, each with its marker.
  await filterTo(page, /^Physics\s*3$/)
  await expect(page.locator("[data-grove-tree]")).toHaveCount(3)
  expect((await markers(page)).map(m => m.text).sort()).toEqual([OPTICS, OPTICS, PHOTO])
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

test("a busy plot keeps each grove on one row, markers clear of each other and the recall strip", async ({ page }) => {
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

  const byRow = rows(await trees(page))
  for (const [t] of sizes) {
    const rowsWith = byRow.filter(r => r.some(b => b.topic === t.toLowerCase()))
    expect(rowsWith.length, `${t} wraps across rows`).toBe(1)
  }
  const all = await markers(page)
  expect(all).toHaveLength(33)
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const p = all[i], q = all[j]
    const overlap = p.left < q.right - 1 && q.left < p.right - 1 && p.top < q.bottom - 1 && q.top < p.bottom - 1
    expect(overlap, `markers ${p.text} and ${q.text} overlap`).toBe(false)
  }
  // The front row's markers stand clear of the "Ready to recall" strip.
  const strip = (await page.locator("[data-recall-strip]").boundingBox())!
  for (const m of all) {
    const under = m.left < strip.x + strip.width && strip.x < m.right && m.bottom > strip.y
    expect(under, `${m.text} marker under the recall strip`).toBe(false)
  }
  if (process.env.SIGNPOST_SHOTS) await page.screenshot({ path: `${process.env.SIGNPOST_SHOTS}/signposts-busy.png` })
})
