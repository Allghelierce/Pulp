// E2E for note import against the running dev server (:3000), guest style.
// /api/import is mocked: a 200 from GET is what lets a guest card sections
// (the modal trusts the server's allowance over the client's auth state).
import { test, expect, type Page, type Route } from "@playwright/test"
import { bootGuest, openImport, readNotes, pageHtml, docxFixture, filler } from "./import-helpers"

test.use({ screenshot: "only-on-failure", viewport: { width: 1440, height: 900 } })

type Deck = { noteId: string; cards: { q: string; a: string; topic?: string; due: number }[] }
const readDeck = (page: Page, noteId: string) =>
  page.evaluate(id => JSON.parse(localStorage.getItem(`pulp-recall-${id}`) || "null") as Deck | null, noteId)

const HEADINGS = ["Atoms", "Bonds", "Moles", "Gases", "Acids"]
const pasted = HEADINGS.map(h => `${h}\n\n${filler(h)}`).join("\n\n")

// GET -> allowance; POST -> "Topic N" with 2-3 cards, counting down remaining.
function mockImport(page: Page, opts: { remaining: number; postStatus?: (n: number) => number }) {
  const posts: { text: string; title?: string; heading?: string; topics?: string[] }[] = []
  let remaining = opts.remaining
  page.route("**/api/import", async (route: Route) => {
    const req = route.request()
    if (req.method() === "GET") return route.fulfill({ json: { remaining, limit: 12, pro: false } })
    const body = req.postDataJSON()
    posts.push(body)
    const n = posts.length
    const status = opts.postStatus?.(n) ?? 200
    if (status === 402) return route.fulfill({ status, json: { error: "You've used your free imports. Upgrade to Pro to import more.", code: "import_limit" } })
    if (status !== 200) return route.fulfill({ status, json: { error: "nope" } })
    remaining = Math.max(0, remaining - 1)
    const cards = Array.from({ length: 2 + (n % 2) }, (_, i) => ({ q: `Q${n}.${i + 1} about ${body.heading}?`, a: `A${n}.${i + 1}` }))
    return route.fulfill({ json: { topic: `Topic ${n}`, cards, remaining } })
  })
  return posts
}

async function pasteAndPreview(page: Page, title: string) {
  const dialog = await openImport(page)
  await dialog.getByRole("button", { name: "Paste", exact: true }).click()
  await dialog.getByPlaceholder("Title (optional)").fill(title)
  await dialog.getByPlaceholder("Paste your notes…").fill(pasted)
  await dialog.getByRole("button", { name: "Continue" }).click()
  await expect(dialog.getByText(/^5 sections · \d+ words/)).toBeVisible()
  return dialog
}

test("signed out: notes import, no cards, sign-in message", async ({ page }) => {
  test.setTimeout(90_000)
  let posts = 0
  await page.route("**/api/import", r => { if (r.request().method() === "POST") posts++; return r.fulfill({ status: 401, json: { error: "Unauthorized" } }) })
  await bootGuest(page)
  const dialog = await pasteAndPreview(page, "Guest Chem")
  await expect(dialog.getByText("Your notes import fine — sign in to get recall cards from them.")).toBeVisible()
  await dialog.getByRole("button", { name: "Import", exact: true }).click()
  await expect(dialog.getByText("Notes imported.")).toBeVisible()
  await expect(dialog.getByText("saved — no cards (sign in for cards)")).toHaveCount(5)
  await expect(dialog.getByRole("button", { name: "Start recalling" })).toHaveCount(0)
  await dialog.getByRole("button", { name: "Done" }).click()
  // Five short sections share one page (pages fill before the next starts).
  await expect.poll(async () => (await readNotes(page)).find(n => n.subject === "Guest Chem")?.pages.length).toBe(1)
  const note = (await readNotes(page)).find(n => n.subject === "Guest Chem")!
  expect((await readDeck(page, note.id))?.cards ?? []).toHaveLength(0)
  expect(posts).toBe(0)
})

test("paste 5 sections: first 3 carded, rest saved, recall opens", async ({ page }) => {
  test.setTimeout(90_000)
  const posts = mockImport(page, { remaining: 3 })
  await bootGuest(page)
  const queued: unknown[] = []
  await page.exposeFunction("__queued", (d: unknown) => { queued.push(d) })
  await page.evaluate(() => window.addEventListener("pulp-cards-queued", e => (window as unknown as { __queued: (d: unknown) => void }).__queued((e as CustomEvent).detail)))

  const dialog = await pasteAndPreview(page, "Chem Unit")
  await expect(dialog.getByText("Recall cards for the first 3 sections (3 free imports left)")).toBeVisible()
  const t0 = Date.now()
  await dialog.getByRole("button", { name: "Import", exact: true }).click()
  await expect(dialog.getByText(/cards ready across 3 topics/)).toBeVisible({ timeout: 20_000 })
  await expect(dialog.getByText("8 cards ready across 3 topics")).toBeVisible()
  await expect(dialog.getByText("✓ Topic 1 · 3 cards")).toBeVisible()
  await expect(dialog.getByText("✓ Topic 2 · 2 cards")).toBeVisible()
  await expect(dialog.getByText("✓ Topic 3 · 3 cards")).toBeVisible()
  await expect(dialog.getByText(/^saved — /)).toHaveCount(2)
  await expect(dialog.getByText("saved — upgrade for cards")).toHaveCount(2)

  // Requests: sequential, with heading/title and the topics carded so far.
  expect(posts.map(p => p.heading)).toEqual(["Atoms", "Bonds", "Moles"])
  expect(posts.every(p => p.title === "Chem Unit")).toBe(true)
  expect(posts.map(p => p.topics)).toEqual([[], ["Topic 1"], ["Topic 1", "Topic 2"]])
  expect(posts[0].text).toContain("Atoms is an important idea")

  await expect.poll(async () => (await readNotes(page)).find(n => n.subject === "Chem Unit")?.pages.length).toBe(1)
  const note = (await readNotes(page)).find(n => n.subject === "Chem Unit")!
  expect(pageHtml(note).join("")).toContain(">Gases</h2>")
  const deck = (await readDeck(page, note.id))!
  expect(deck.cards).toHaveLength(8)
  expect(new Set(deck.cards.map(c => c.topic))).toEqual(new Set(["Topic 1", "Topic 2", "Topic 3"]))
  const now = await page.evaluate(() => Date.now())
  for (const c of deck.cards) { expect(c.due).toBeLessThanOrEqual(now); expect(c.due).toBeGreaterThanOrEqual(t0 - 60_000) }
  expect(queued).toEqual([
    { noteId: note.id, topic: "Topic 1", count: 3 },
    { noteId: note.id, topic: "Topic 2", count: 2 },
    { noteId: note.id, topic: "Topic 3", count: 3 },
  ])

  await dialog.getByRole("button", { name: "Start recalling" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText(/^Q\d\.\d about (Atoms|Bonds|Moles)\?$/).first()).toBeVisible({ timeout: 15_000 })
})

test("402 on the first POST stops carding with an upgrade message", async ({ page }) => {
  test.setTimeout(90_000)
  const posts = mockImport(page, { remaining: 3, postStatus: () => 402 })
  await bootGuest(page)
  const dialog = await pasteAndPreview(page, "Chem Limit")
  await expect(dialog.getByText("Recall cards for the first 3 sections (3 free imports left)")).toBeVisible()
  await dialog.getByRole("button", { name: "Import", exact: true }).click()
  await expect(dialog.getByText("Notes imported.")).toBeVisible({ timeout: 20_000 })
  expect(posts).toHaveLength(1)
  await expect(dialog.getByText("saved — upgrade for cards")).toHaveCount(5)
  await expect(dialog.getByRole("button", { name: "Start recalling" })).toHaveCount(0)
  await expect.poll(async () => (await readNotes(page)).find(n => n.subject === "Chem Limit")?.pages.length).toBe(1)
  const note = (await readNotes(page)).find(n => n.subject === "Chem Limit")!
  expect((await readDeck(page, note.id))?.cards ?? []).toHaveLength(0)
})

test("upload a .docx: sections from its headings, carded", async ({ page }) => {
  test.setTimeout(90_000)
  const posts = mockImport(page, { remaining: 10 })
  await bootGuest(page)
  const dialog = await openImport(page)
  await dialog.locator('input[type="file"]').setInputFiles({ name: "bio.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: docxFixture() })
  await expect(dialog.getByText(/^3 sections · \d+ words/)).toBeVisible()
  await expect(dialog.locator("input").first()).toHaveValue("Biology Notes")
  await expect(dialog.getByText("Recall cards for the first 3 sections (10 free imports left)")).toBeVisible()
  await dialog.getByRole("button", { name: "Import", exact: true }).click()
  await expect(dialog.getByText("8 cards ready across 3 topics")).toBeVisible({ timeout: 20_000 })
  expect(posts.map(p => p.heading)).toEqual(["Cells", "Mitochondria", "Photosynthesis"])
  expect(posts[0].text).toContain("Term\tDefinition\nLine after break <script>alert(1)</script>")
  await expect.poll(async () => (await readNotes(page)).find(n => n.subject === "Biology Notes")?.pages.length).toBe(1)
})
