// Highlight-to-card: select text in a page box -> "Card" in the selection bubble
// (or the shortcut) -> a recall card in this notebook's deck, a toast with Undo and
// editable Q/A. The note itself never changes. Guest mode: everything is local.
import { test, expect, type Page } from "@playwright/test"
import { bootGuest } from "./import-helpers"

test.use({ viewport: { width: 1440, height: 900 } })

const HOUR = 3_600_000
type Card = { id: string; q: string; a: string; topic?: string; due: number; reps: number; last?: number }
type Deck = { noteId: string; cards: Card[]; covered?: string[] }

const firstNote = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem("pulp-notes") || "[]")[0] ?? null) as { id: string; subject: string } | null)
const readDeck = (page: Page, noteId: string) => page.evaluate(id => JSON.parse(localStorage.getItem(`pulp-recall-${id}`) || "null") as Deck | null, noteId)
const boxHtml = (page: Page) => page.locator('#editor-paper [contenteditable="true"]').first().innerHTML()

// Type into the first page box, wait until the notebook is saved, return it.
async function write(page: Page, text: string) {
  const r = (await page.locator("#editor-paper").boundingBox())!
  await page.mouse.click(r.x + 120, r.y + 240)
  await page.keyboard.type(text)
  await expect.poll(async () => (await firstNote(page))?.id ?? null).not.toBeNull()
  return (await firstNote(page))!
}

// Double-click a word on the paper, like a student would.
async function selectWord(page: Page, word: string) {
  const at = await page.evaluate(w => {
    const root = document.getElementById("editor-paper")!
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const i = n.textContent!.indexOf(w)
      if (i < 0) continue
      const r = document.createRange()
      r.setStart(n, i); r.setEnd(n, i + w.length)
      const b = r.getBoundingClientRect()
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 }
    }
    return null
  }, word)
  expect(at, `"${word}" on the page`).not.toBeNull()
  await page.mouse.dblclick(at!.x, at!.y)
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim())).toBe(word)
}

const listenForQueued = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { __queued: unknown[] }
  w.__queued = []
  window.addEventListener("pulp-cards-queued", e => w.__queued.push((e as CustomEvent).detail))
})
const queuedEvents = (page: Page) => page.evaluate(() => (window as unknown as { __queued: unknown[] }).__queued)

test("one word -> cloze card under the matching topic, due next morning; edit, then Undo", async ({ page }) => {
  await bootGuest(page)
  const note = await write(page, "The powerhouse of the cell is the mitochondria which makes ATP.")

  // This notebook already has two topics; the card should join the one it's about.
  await page.evaluate(id => {
    const base = { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0, due: Date.now() + 86_400_000 }
    localStorage.setItem(`pulp-recall-${id}`, JSON.stringify({ noteId: id, generatedAt: Date.now(), noteHash: "", covered: [], cards: [
      { ...base, id: "seed1", q: "What do mitochondria make?", a: "ATP", topic: "Cell Biology", last: Date.now() - 5 * 86_400_000 },
      { ...base, id: "seed2", q: "When did the French Revolution begin?", a: "1789", topic: "French Revolution", last: Date.now() - 3_600_000 },
    ] }))
  }, note.id)
  await listenForQueued(page)
  const htmlBefore = await boxHtml(page)

  await selectWord(page, "mitochondria")
  const pill = page.getByRole("button", { name: "Make card" })
  await expect(pill).toBeVisible()
  const t0 = Date.now()
  await pill.click()

  const toast = page.getByRole("status", { name: "Card added" })
  await expect(toast).toContainText("Card added · due tomorrow")
  await expect(toast).toContainText("in Cell Biology")
  await expect(toast.getByLabel("Question")).toHaveValue("The powerhouse of the cell is the _____ which makes ATP.")
  await expect(toast.getByLabel("Answer")).toHaveValue("mitochondria")

  const deck = (await readDeck(page, note.id))!
  expect(deck.cards).toHaveLength(3)
  const card = deck.cards.find(c => c.a === "mitochondria")!
  expect(card.q).toBe("The powerhouse of the cell is the _____ which makes ATP.")
  expect(card.topic).toBe("Cell Biology")
  expect(card.reps).toBe(0)
  // First due like session cards: the next 6am at least 6h away.
  const due = new Date(card.due)
  expect([due.getHours(), due.getMinutes()]).toEqual([6, 0])
  expect(card.due - t0).toBeGreaterThan(6 * HOUR)
  expect(card.due - t0).toBeLessThan(31 * HOUR)
  expect(await queuedEvents(page)).toEqual([{ noteId: note.id, topic: "Cell Biology", count: 1 }])
  expect(await boxHtml(page)).toBe(htmlBefore) // the note is untouched
  await expect(page.getByRole("button", { name: "Make card" })).toBeVisible() // still selected

  // Tweak the wording in the toast: saved to the same card.
  await toast.getByLabel("Question").fill("What is the powerhouse of the cell?")
  await toast.getByLabel("Question").press("Enter")
  await expect.poll(async () => (await readDeck(page, note.id))!.cards.find(c => c.a === "mitochondria")?.q).toBe("What is the powerhouse of the cell?")
  expect((await readDeck(page, note.id))!.cards).toHaveLength(3)

  // Undo removes just that card.
  await toast.getByRole("button", { name: "Undo" }).click()
  await expect(page.getByRole("status", { name: "Card removed" })).toBeVisible()
  const after = (await readDeck(page, note.id))!
  expect(after.cards.map(c => c.id).sort()).toEqual(["seed1", "seed2"])
  await expect(page.getByRole("status", { name: /^Card/ })).toHaveCount(0, { timeout: 5000 })
  expect(await boxHtml(page)).toBe(htmlBefore)
})

test("a whole sentence, signed out -> local fallback card (no AI call), via the shortcut", async ({ page }) => {
  const aiCalls: string[] = []
  page.on("request", r => { if (r.url().includes("/api/recall")) aiCalls.push(r.url()) })
  await bootGuest(page)
  const note = await write(page, "Osmosis is the movement of water across a semipermeable membrane.")
  await listenForQueued(page)
  await page.keyboard.press("ControlOrMeta+KeyA") // everything in this box
  await expect(page.getByRole("button", { name: "Make card" })).toBeVisible()
  await page.keyboard.press("ControlOrMeta+Shift+KeyC")

  const toast = page.getByRole("status", { name: "Card added" })
  await expect(toast).toContainText("Card added · due tomorrow")
  const deck = (await readDeck(page, note.id))!
  expect(deck.cards).toHaveLength(1)
  expect(deck.cards[0]).toMatchObject({ q: "What is Osmosis?", a: "the movement of water across a semipermeable membrane", topic: note.subject, reps: 0 })
  // A deck started by a highlight doesn't count the notes as carded (full review still cards them).
  expect(deck.covered).toEqual([])
  expect(await queuedEvents(page)).toEqual([{ noteId: note.id, topic: note.subject, count: 1 }])
  expect(aiCalls).toEqual([])
  await expect(page.locator('#editor-paper [contenteditable="true"]').first()).toHaveText("Osmosis is the movement of water across a semipermeable membrane.")

  // The new deck is in step with the notes: when the card comes due, no "notes changed" banner.
  await page.evaluate(id => {
    const d = JSON.parse(localStorage.getItem(`pulp-recall-${id}`)!)
    d.cards[0].due = Date.now() - 60_000
    localStorage.setItem(`pulp-recall-${id}`, JSON.stringify(d))
  }, note.id)
  await page.reload()
  await page.getByText("recall", { exact: true }).click()
  await page.getByRole("button", { name: /Start · 1/ }).click()
  await expect(page.getByText("What is Osmosis?")).toBeVisible()
  await expect(page.getByText("Your notes changed since this deck was built.")).toHaveCount(0)
})

test("selecting text still bolds with the keyboard and sizes from the bubble", async ({ page }) => {
  await bootGuest(page)
  const note = await write(page, "Enzymes lower the activation energy of reactions.")
  await selectWord(page, "activation")
  await expect(page.getByRole("button", { name: "Make card" })).toBeVisible()
  await page.keyboard.press("ControlOrMeta+KeyB")
  await expect.poll(() => boxHtml(page)).toMatch(/<b>activation<\/b>/)
  await page.getByRole("toolbar", { name: "Text size" }).getByRole("button", { name: "Bigger text" }).click()
  await expect.poll(() => boxHtml(page)).toMatch(/font-size: \d+px/)
  expect(await readDeck(page, note.id)).toBeNull() // no card unless asked
})

// Replace the first box's content (a table, headings…) as if it had been typed/pasted.
async function setBox(page: Page, html: string) {
  await page.evaluate(h => {
    const el = document.querySelector<HTMLElement>('#editor-paper [contenteditable="true"]')!
    el.innerHTML = h
    el.dispatchEvent(new Event("input", { bubbles: true }))
  }, html)
}
// Select exactly `text` (first occurrence) on the paper.
async function selectText(page: Page, text: string) {
  await page.evaluate(t => {
    const root = document.getElementById("editor-paper")!
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const i = n.textContent!.indexOf(t)
      if (i < 0) continue
      const r = document.createRange()
      r.setStart(n, i); r.setEnd(n, i + t.length)
      const sel = window.getSelection()!
      sel.removeAllRanges(); sel.addRange(r)
      return
    }
    throw new Error(`"${t}" not on the page`)
  }, text)
  await expect(page.getByRole("button", { name: "Make card" })).toBeVisible()
}
const cardFor = async (page: Page, noteId: string, a: string) => (await readDeck(page, noteId))?.cards.find(c => c.a === a)

test("table rows, lone terms, headings and vocab pairs make cards that don't answer themselves", async ({ page }) => {
  await bootGuest(page)
  const note = await write(page, "x")
  // An import that got no cards leaves an empty deck: one highlight mustn't mark the notes as carded.
  await page.evaluate(id => localStorage.setItem(`pulp-recall-${id}`, JSON.stringify({ noteId: id, cards: [], generatedAt: Date.now(), noteHash: "import" })), note.id)
  const makeCard = async (text: string) => {
    await selectText(page, text)
    await page.getByRole("button", { name: "Make card" }).click()
  }

  // A table row: cells read as "term — meaning", not one run-on word.
  await setBox(page, "<table><tbody><tr><td>Mitochondria</td><td>Powerhouse of the cell</td></tr></tbody></table>")
  await makeCard("Powerhouse")
  await expect.poll(() => cardFor(page, note.id, "Powerhouse")).toMatchObject({ q: "Mitochondria — _____ of the cell" })
  expect(await readDeck(page, note.id)).toMatchObject({ covered: [], noteHash: "import" })

  // A term on its own line: asked about, answered by the line under it.
  await setBox(page, "<div>Mitosis</div><div>Cell division that makes two identical daughter cells.</div>")
  await makeCard("Mitosis")
  await expect.poll(() => cardFor(page, note.id, "Cell division that makes two identical daughter cells."))
    .toMatchObject({ q: "What do your notes say about “Mitosis”?" })

  // "term - meaning" on one line: front and back.
  await setBox(page, "<div>la manzana - the apple</div>")
  await makeCard("la manzana - the apple")
  await expect.poll(() => cardFor(page, note.id, "the apple")).toMatchObject({ q: "What does “la manzana” mean?" })

  // A heading with nothing under it: no card, and a hint about what would work.
  const before = (await readDeck(page, note.id))!.cards.length
  await setBox(page, "<h2>Krebs Cycle</h2>")
  await makeCard("Krebs Cycle")
  await expect(page.getByRole("status", { name: "No card made" })).toContainText("Highlight the sentence")
  expect((await readDeck(page, note.id))!.cards).toHaveLength(before)
  expect((await readDeck(page, note.id))!.cards.every(c => !c.q.includes(c.a))).toBe(true)
})

test("a double-click on Card makes one card and keeps Undo; a low highlight puts the toast up top, under the bubble", async ({ page }) => {
  await bootGuest(page)
  const lines = Array.from({ length: 15 }, (_, i) => `Line ${i + 1}: the vagus nerve slows the heart rate during rest.`)
  const note = await write(page, lines.join("\n") + "\nThe sinoatrial node is the natural pacemaker of the heart and sets the rhythm.")
  await selectWord(page, "pacemaker")
  const sel = (await page.evaluate(() => { const r = window.getSelection()!.getRangeAt(0).getBoundingClientRect(); return { top: r.top, bottom: r.bottom } }))
  expect(sel.top).toBeGreaterThan(900 * 0.55) // low on the screen

  await page.getByRole("button", { name: "Make card" }).dblclick()
  const toast = page.getByRole("status", { name: "Card added" })
  await expect(toast).toContainText("Card added · due tomorrow")
  await expect(toast.getByRole("button", { name: "Undo" })).toBeVisible()
  await expect(page.getByRole("status", { name: "Already a card" })).toHaveCount(0)
  expect((await readDeck(page, note.id))!.cards).toHaveLength(1)
  // Up top, clear of the lines being worked on.
  expect((await toast.boundingBox())!.y + (await toast.boundingBox())!.height).toBeLessThan(sel.top)

  // The next highlight's bubble is reachable (nothing on top of it).
  await selectWord(page, "sinoatrial")
  const pill = page.getByRole("button", { name: "Make card" })
  const pb = (await pill.boundingBox())!
  expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('[aria-label="Make card"]') != null, [pb.x + pb.width / 2, pb.y + pb.height / 2])).toBe(true)
})

test("no bubble and no card while a full-screen view covers the selection", async ({ page }) => {
  await bootGuest(page)
  const note = await write(page, "Ribosomes translate messenger RNA into proteins in the cytoplasm.")
  await selectWord(page, "messenger")
  await expect(page.getByRole("button", { name: "Make card" })).toBeVisible()
  await page.getByText("recall", { exact: true }).click()
  await expect(page.getByRole("button", { name: "Make card" })).toHaveCount(0, { timeout: 3000 })
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe("messenger") // still selected underneath
  await page.keyboard.press("ControlOrMeta+Shift+KeyC")
  await page.waitForTimeout(300)
  expect(await readDeck(page, note.id)).toBeNull()
})
