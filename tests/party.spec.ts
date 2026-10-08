// Party is the one social UI: friends + study group in a single panel.
// Signed-in flows use a fake session and mocked /api routes — nothing reaches the real DB.
import { test, expect, type Page, type Route } from "@playwright/test"
import { BASE, bootGuest } from "./import-helpers"

const REF = "lfoiwfoegtayvdzxnfwv"
const SHOTS = process.env.PARTY_SHOTS // folder for panel screenshots (optional)
const ME = "00000000-0000-0000-0000-0000000000aa"
const MIRA = "00000000-0000-0000-0000-0000000000bb"
const THEO = "00000000-0000-0000-0000-0000000000cc"
const GROUP = 7

const isoIn = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

type Posted = { url: string; body: Record<string, unknown> }

// A stored (fake) Supabase session, Supabase REST/realtime stubbed, and every
// /api call answered here. Returns the POST bodies the app sent.
async function signedIn(page: Page, opts: { groups?: object[]; theme?: "light" | "dark"; membership?: (b: Record<string, unknown>) => { status: number; json: object } } = {}) {
  const posted: Posted[] = []
  const profile = { user_id: ME, juice: 0, gems: 0, last_char_count: 0, grove: [], inventory: {}, username: "you_owl", school: "Test High", grade: "10th Grade", friend_code: "PULP-AB2C" }
  await page.route(`https://${REF}.supabase.co/rest/v1/**`, r => {
    const single = (r.request().headers()["accept"] || "").includes("vnd.pgrst.object")
    const isProfile = r.request().url().includes("/player_profiles")
    if (r.request().method() !== "GET") return r.fulfill({ status: 201, json: [] })
    if (single) return isProfile ? r.fulfill({ json: profile }) : r.fulfill({ status: 406, json: { code: "PGRST116", message: "no rows" } })
    return r.fulfill({ json: isProfile ? [profile] : [] })
  })
  await page.routeWebSocket(/supabase\.co\/realtime/, () => {}) // presence: never connects
  await page.route(`https://${REF}.supabase.co/auth/v1/user*`, r => r.fulfill({ json: { id: ME, aud: "authenticated", email: "t@example.com", app_metadata: {}, user_metadata: {} } }))
  await page.addInitScript(([ref, me, theme]) => {
    const now = Math.floor(Date.now() / 1000)
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: "test-access", refresh_token: "test-refresh", token_type: "bearer", expires_in: 3600, expires_at: now + 3600,
      user: { id: me, aud: "authenticated", email: "t@example.com", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
    }))
    if (theme) localStorage.setItem("pulp-settings", JSON.stringify({ theme }))
  }, [REF, ME, opts.theme ?? ""])

  // Fallback first (routes run newest-first): anything unmocked acts signed out.
  await page.route("**/api/**", r => r.fulfill({ status: 401, json: { error: "Unauthorized" } }))
  const json = (r: Route, body: object, status = 200) => r.fulfill({ status, json: body })
  const record = (r: Route) => { const body = r.request().postDataJSON() ?? {}; posted.push({ url: new URL(r.request().url()).pathname, body }); return body }

  const groups = opts.groups ?? [{ id: GROUP, status: "active", name: "Night Owls", owner_id: ME, term_end: isoIn(41) }]
  await page.route("**/api/groups", r => r.request().method() === "GET" ? json(r, { groups }) : (record(r), json(r, { group: {} })))
  await page.route(/\/api\/groups\?id=/, r => json(r, {
    group: { id: GROUP, name: "Night Owls", owner_id: ME, invite_code: "ABCD2345", term_start: isoIn(-49), term_end: isoIn(41), status: "active", max_members: 5 },
    members: [
      { user_id: ME, role: "owner", status: "active", username: "you_owl" },
      { user_id: MIRA, role: "member", status: "active", username: "mira" },
      { user_id: THEO, role: "member", status: "active", username: "theo" },
    ],
  }))
  await page.route(/\/api\/groups\/leaderboard/, r => json(r, {
    weekly: [
      { user_id: MIRA, username: "mira", focus_minutes: 120, trees: 2 },
      { user_id: ME, username: "you_owl", focus_minutes: 45, trees: 1 },
      { user_id: THEO, username: "theo", focus_minutes: 0, trees: 0 },
    ],
    allTime: [
      { user_id: ME, username: "you_owl", focus_minutes_total: 900, trees: 6 },
      { user_id: MIRA, username: "mira", focus_minutes_total: 610, trees: 4 },
      { user_id: THEO, username: "theo", focus_minutes_total: 300, trees: 1 },
    ],
  }))
  await page.route(/\/api\/groups\/grove/, r => json(r, { trees: [
    { type: "sakura", stage: 2, user_id: MIRA }, { type: "oak", stage: 2, user_id: ME }, { type: "tangerine", stage: 1, user_id: MIRA },
  ] }))
  await page.route(/\/api\/groups\/membership/, r => {
    if (r.request().method() === "GET") return json(r, { status: null })
    const body = record(r)
    const res = opts.membership?.(body) ?? { status: 200, json: { ok: true } }
    return json(r, res.json, res.status)
  })
  await page.route("**/api/friends", r => r.request().method() === "GET" ? json(r, { friends: [], incoming: [], outgoing: [] }) : (record(r), json(r, { ok: true, status: "pending" })))
  await page.route("**/api/profile/identity", r => json(r, { username: "you_owl", friend_code: "PULP-AB2C", school: "Test High", grade: "10th Grade", changed_at: {}, cooldown_ms: 0 }))
  return posted
}

// The Party modal (opened via /app?party=open, which PartyPresence handles).
async function openParty(page: Page) {
  await page.goto(`${BASE}/app?party=open`)
  const panel = page.getByTestId("party-panel")
  await expect(panel).toBeVisible({ timeout: 30000 })
  return panel
}

test("guest: Party from the sidebar asks to sign in; no Community button anywhere", async ({ page }) => {
  await bootGuest(page)
  await expect(page.locator('button[title="Community"]')).toHaveCount(0)
  const open = page.locator('[title="Open Sidebar"]')
  if (await open.isVisible()) await open.click()
  await page.locator('button:has(span:text-is("party")), button[title="Party"]').first().click()
  await expect(page.getByText("Sign in to start a party with friends.")).toBeVisible()
  await expect(page.locator('button[title="Community"]')).toHaveCount(0)
})

test("signed in: members, season line, week/season standings, recent trees", async ({ page }) => {
  await signedIn(page)
  const panel = await openParty(page)
  await expect(panel.getByRole("heading", { name: "Night Owls" })).toBeVisible()
  await expect(panel.getByTestId("party-season")).toContainText("season ends in 41d")
  const standings = panel.getByTestId("party-standings")
  await expect(standings).toContainText("@mira")
  await expect(standings).toContainText("@theo")
  await expect(page.locator('button[title="Community"]')).toHaveCount(0)

  // Week: mira leads. Season: you lead, with season tree counts.
  const first = standings.locator(".party-row").first()
  await expect(first).toContainText("@mira")
  await expect(first).toContainText("120 min")
  await panel.getByRole("tab", { name: "season" }).click()
  await expect(first).toContainText("@you_owl")
  await expect(first).toContainText("900 min")
  await expect(first).toContainText("🌳 6")
  await panel.getByRole("tab", { name: "week" }).click()
  await expect(first).toContainText("@mira")
  await expect(panel.getByTestId("party-trees")).toBeVisible()
})

test("owner: hover × removes a member (after the app's confirm dialog)", async ({ page }) => {
  const posted = await signedIn(page)
  const panel = await openParty(page)
  const theoRow = panel.locator(".party-row", { hasText: "@theo" })
  await expect(panel.locator(".party-row", { hasText: "@you_owl" }).getByRole("button", { name: /Remove/ })).toHaveCount(0) // never yourself
  await theoRow.hover()
  await theoRow.getByRole("button", { name: "Remove @theo" }).click()
  await expect(page.getByText("Remove @theo?")).toBeVisible()
  await page.getByRole("button", { name: "Remove", exact: true }).click()
  await expect.poll(() => posted.find(p => p.body.action === "remove")?.body).toEqual({ action: "remove", groupId: GROUP, userId: THEO })
})

test("friends: a #PULP code sends {friend_code}", async ({ page }) => {
  const posted = await signedIn(page)
  const panel = await openParty(page)
  await panel.getByRole("button", { name: "friends", exact: true }).click()
  await expect(panel.getByText("#PULP-AB2C")).toBeVisible()
  const box = panel.getByPlaceholder("@username or PULP-code")
  await box.fill("#pulp-xy7z")
  await panel.getByRole("button", { name: "Add", exact: true }).click()
  await expect(panel.getByText("Request sent.")).toBeVisible()
  expect(posted.find(p => p.url === "/api/friends")?.body).toEqual({ action: "request", friend_code: "PULP-XY7Z" })
})

test("joining a second party explains why it can't", async ({ page }) => {
  await signedIn(page, {
    groups: [],
    membership: b => b.action === "join"
      ? { status: 409, json: { error: "You're already in a party. Leave it first to join another." } }
      : { status: 200, json: { ok: true } },
  })
  const panel = await openParty(page)
  await panel.getByRole("button", { name: /Join a party/ }).click()
  await panel.getByPlaceholder("invite code").fill("WXYZ2345")
  await panel.getByRole("button", { name: "Join", exact: true }).click()
  await expect(panel.getByText("You're already in a party. Leave it first to join another.")).toBeVisible()
})

test("a season that just ended shows final standings; the owner can renew", async ({ page }) => {
  const posted = await signedIn(page, { groups: [{ id: GROUP, status: "archived", name: "Night Owls", owner_id: ME, term_end: isoIn(-2) }] })
  const panel = await openParty(page)
  const recap = panel.getByTestId("party-recap")
  await expect(recap).toContainText("final standings")
  await expect(recap.locator("div", { hasText: "@you_owl" }).first()).toBeVisible()
  await recap.getByRole("button", { name: "Renew season" }).click()
  await expect.poll(() => posted.find(p => p.body.action === "renew")?.body).toEqual({ action: "renew", groupId: GROUP })
})

test("a declined join request stops waiting and says so", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("pulp-party-pending", JSON.stringify({ groupId: 9, code: "WXYZ2345" })))
  await signedIn(page, { groups: [] })
  const panel = await openParty(page)
  await expect(panel.getByText("Your request to join WXYZ2345 wasn't accepted.")).toBeVisible()
  await expect(panel.getByText("Waiting to be let in")).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem("pulp-party-pending"))).toBeNull()
  await expect.poll(() => page.evaluate(() => localStorage.getItem("pulp-party-declined"))).toBeNull() // shown once
})

for (const theme of ["light", "dark"] as const) {
  test(`screenshot: party panel (${theme})`, async ({ page }) => {
    test.skip(!SHOTS, "set PARTY_SHOTS=<dir> to save screenshots")
    await page.setViewportSize({ width: 1280, height: 1000 })
    await signedIn(page, { theme })
    const panel = await openParty(page)
    await expect(panel.getByTestId("party-trees")).toBeVisible()
    await page.waitForTimeout(1200) // grove rise animation
    await page.screenshot({ path: `${SHOTS}/party-${theme}.png` })
    await panel.locator(".party-row", { hasText: "@theo" }).hover()
    await panel.getByRole("tab", { name: "season" }).click()
    await page.waitForTimeout(300)
    const modal = page.locator('div[style*="max-height: 82vh"]')
    await modal.evaluate(el => { el.scrollTop = el.scrollHeight })
    await panel.locator(".party-row", { hasText: "@theo" }).hover()
    await page.waitForTimeout(400) // × fades in
    await page.screenshot({ path: `${SHOTS}/party-${theme}-season.png` })
    await panel.getByRole("button", { name: "Remove @theo" }).click()
    await expect(page.getByText("Remove @theo?")).toBeVisible()
    await page.waitForTimeout(400) // dialog fades in
    await page.screenshot({ path: `${SHOTS}/party-${theme}-confirm.png` })
  })
}

test("screenshot: season recap + friends (light)", async ({ page }) => {
  test.skip(!SHOTS, "set PARTY_SHOTS=<dir> to save screenshots")
  await page.setViewportSize({ width: 1280, height: 900 })
  await signedIn(page, { theme: "light", groups: [{ id: GROUP, status: "archived", name: "Night Owls", owner_id: ME, term_end: isoIn(-2) }] })
  const panel = await openParty(page)
  await expect(panel.getByTestId("party-recap")).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/party-recap-light.png` })
  await panel.getByRole("button", { name: "friends", exact: true }).click()
  await expect(panel.getByText("#PULP-AB2C")).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/party-friends-light.png` })
})
