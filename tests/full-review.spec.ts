// E2E for full review (study every card in a notebook) against the dev server.
// AI routes are mocked: import (cards for 3 of 5 sections), on-demand page cards,
// rephrasing, and grading.
import { test, expect, type Page, type Route } from "@playwright/test"
import { bootGuest, openImport, filler, readNotes } from "./import-helpers"

type Card = { id: string; q: string; due: number; reps: number; topic?: string; alts?: string[] }
type Deck = { cards: Card[]; covered?: string[] }
const readDeck = (page: Page, id: string) => page.evaluate(k => JSON.parse(localStorage.getItem(`pulp-recall-${k}`) || "null") as Deck | null, id)
const readJSON = (page: Page, key: string) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || "null"), key)

const HEADINGS = ["Atoms", "Bonds", "Moles", "Gases", "Acids"]
const pasted = HEADINGS.map(h => `${h}\n\n${filler(h)}`).join("\n\n")

function mockAI(page: Page) {
  const calls = { import: 0, page: [] as string[], rephrase: 0, gradedWrong: new Set<string>() }
  page.route("**/api/import", async (route: Route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { remaining: 3, limit: 12, pro: false } })
    calls.import++
    const { heading } = route.request().postDataJSON()
    return route.fulfill({ json: { topic: heading, cards: [1, 2].map(k => ({ q: `Q${k} about ${heading}?`, a: `A${k} ${heading}` })), remaining: 3 - calls.import } })
  })
  page.route("**/api/recall/topic", async (route: Route) => {
    const body = route.request().postDataJSON()
    const topic = HEADINGS.find(h => body.text.includes(`${h} is an important idea`)) ?? "Misc"
    calls.page.push(`${body.mode}:${topic}`)
    return route.fulfill({ json: { topic, cards: [1, 2].map(k => ({ q: `Q${k} about ${topic}?`, a: `A${k} ${topic}` })) } })
  })
  page.route("**/api/recall/rephrase", async (route: Route) => {
    calls.rephrase++
    const { cards } = route.request().postDataJSON() as { cards: { id: string; q: string }[] }
    return route.fulfill({ json: { alts: Object.fromEntries(cards.map(c => [c.id, [`Reworded: ${c.q}`, `Reworded again: ${c.q}`]])) } })
  })
  // Moles questions are wrong the first time (to exercise misses), right after.
  page.route("**/api/recall/grade", async (route: Route) => {
    const { q } = route.request().postDataJSON() as { q: string }
    const base = q.replace(/^Reworded( again)?: /, "")
    if (base.includes("Moles") && !calls.gradedWrong.has(base)) { calls.gradedWrong.add(base); return route.fulfill({ json: { verdict: "wrong", feedback: "Not quite." } }) }
    return route.fulfill({ json: { verdict: "correct", feedback: "Yes." } })
  })
  return calls
}

async function importChem(page: Page) {
  const dialog = await openImport(page)
  await dialog.getByRole("button", { name: "Paste", exact: true }).click()
  await dialog.getByPlaceholder("Title (optional)").fill("Chem Unit")
  await dialog.getByPlaceholder("Paste your notes…").fill(pasted)
  await dialog.getByRole("button", { name: "Continue" }).click()
  await dialog.getByRole("button", { name: "Import", exact: true }).click()
  await expect(dialog.getByText(/cards ready across 3 topics/)).toBeVisible({ timeout: 20_000 })
  await dialog.getByRole("button", { name: "Done" }).click()
  return (await readNotes(page)).find(n => n.subject === "Chem Unit")!
}

// Answer cards until the score screen; returns the questions seen.
async function answerAll(page: Page, max = 40) {
  const seen: string[] = []
  for (let n = 0; n < max; n++) {
    if (await page.getByText(/ of \d+ right$/).isVisible()) break
    const box = page.getByPlaceholder("Type your answer from memory…")
    await box.waitFor({ timeout: 10_000 })
    seen.push(await page.evaluate(() => (document.querySelector("textarea")?.parentElement?.firstElementChild as HTMLElement | null)?.innerText ?? ""))
    await box.fill("my answer")
    await box.press("Enter")
    await expect(page.getByText("Answer", { exact: true })).toBeVisible()
    await page.keyboard.press("Enter")
  }
  await expect(page.getByText(/ of \d+ right$/)).toBeVisible()
  return seen
}

test.use({ screenshot: "only-on-failure", viewport: { width: 1280, height: 900 } })

test("full review: cards uncovered pages on demand, mixes wording, scores, paces growth", async ({ page }) => {
  test.setTimeout(150_000)
  const calls = mockAI(page)
  await bootGuest(page)
  const note = await importChem(page)
  const imported = (await readDeck(page, note.id))!
  expect(imported.cards).toHaveLength(6)
  expect(imported.covered?.length).toBeGreaterThan(0) // carded import text counts as covered

  // Recall hub -> Whole notebooks -> Full review
  const open = page.locator('[title="Open Sidebar"]'); if (await open.isVisible()) await open.click()
  await page.getByText("recall", { exact: true }).first().click()
  await expect(page.getByText("Whole notebooks")).toBeVisible()
  await page.getByRole("button", { name: "Full review" }).first().click()

  // Only the 2 uncarded pages (Gases, Acids) get cards made, in page mode.
  await expect(page.getByPlaceholder("Type your answer from memory…")).toBeVisible({ timeout: 20_000 })
  expect(calls.page.sort()).toEqual(["page:Acids", "page:Gases"])
  expect((await readDeck(page, note.id))!.cards).toHaveLength(10)

  const seen = await answerAll(page)
  expect(seen.some(q => q.startsWith("Reworded"))).toBe(true)
  expect(calls.rephrase).toBe(1)

  // Score: Moles missed first time; everything else right.
  await expect(page.locator("span", { hasText: /^Moles$/ })).toBeVisible()
  await expect(page.getByText("0/2")).toBeVisible()
  await expect(page.getByRole("button", { name: "Drill misses (2)" })).toBeVisible()

  // Paced growth: no trees exist, so growth banks — at most 2 per topic per day.
  const ledger = await readJSON(page, "pulp-full-review-growth") as { topics: Record<string, number>; cards: string[] }
  expect(ledger.cards.length).toBe(8) // the 2 Moles cards were missed on the first try, so they grew nothing
  for (const v of Object.values(ledger.topics)) expect(v).toBeLessThanOrEqual(2)
  const bank = (await readJSON(page, "pulp-topic-bank")) as Record<string, number> | null
  for (const v of Object.values(bank ?? {})) expect(v).toBeLessThanOrEqual(2)

  // Second full review: right answers on cards that aren't due leave the schedule alone,
  // and nothing grows again today.
  const before = (await readDeck(page, note.id))!
  const atomsCard = before.cards.find(c => c.topic === "Atoms")!
  expect(atomsCard.due).toBeGreaterThan(Date.now())
  await page.getByRole("button", { name: "Done" }).click()
  await expect(page.getByText(/ of \d+ right$/)).toBeHidden()
  // A deck from before coverage tracking (no `covered`) counts its notes as carded: no re-carding.
  await page.evaluate(k => { const d = JSON.parse(localStorage.getItem(k)!); delete d.covered; localStorage.setItem(k, JSON.stringify(d)) }, `pulp-recall-${note.id}`)
  await page.getByText("recall", { exact: true }).first().click().catch(() => {})
  await page.getByRole("button", { name: "Full review" }).first().click()
  await expect(page.getByPlaceholder("Type your answer from memory…")).toBeVisible({ timeout: 20_000 })
  await answerAll(page)
  expect(calls.page).toHaveLength(2)
  expect((await readDeck(page, note.id))!.covered?.length).toBeGreaterThan(0)
  const after = (await readDeck(page, note.id))!
  expect(after.cards.find(c => c.id === atomsCard.id)!.due).toBe(atomsCard.due)
  const ledger2 = await readJSON(page, "pulp-full-review-growth") as { topics: Record<string, number> }
  // Topics that already grew today don't grow again; Moles (missed earlier) grows now, still capped.
  expect(ledger2.topics).toEqual({ ...ledger.topics, "bank:moles": 2 })
})
