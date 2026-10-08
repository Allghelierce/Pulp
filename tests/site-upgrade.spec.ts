// Upgrading from the website goes straight to Stripe (or sign-in), never through the app.
import { test, expect, type Page } from "@playwright/test"
const BASE = process.env.PULP_URL || "http://localhost:3000"
const REF = "lfoiwfoegtayvdzxnfwv"

// A stored (fake) Supabase session so getSession() returns a user without the network.
async function fakeSession(page: Page) {
  // Pages may verify the session with Supabase; answer as that (fake) user.
  await page.route(`https://${REF}.supabase.co/auth/v1/user*`, r => r.fulfill({ json: { id: "00000000-0000-0000-0000-0000000000aa", aud: "authenticated", email: "t@example.com", app_metadata: {}, user_metadata: {} } }))
  await page.addInitScript(([ref]) => {
    const now = Math.floor(Date.now() / 1000)
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: "test-access", refresh_token: "test-refresh", token_type: "bearer", expires_in: 3600, expires_at: now + 3600,
      user: { id: "00000000-0000-0000-0000-0000000000aa", aud: "authenticated", email: "t@example.com", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
    }))
  }, [REF])
}

async function mockStripe(page: Page) {
  const bodies: { plan: string; from?: string }[] = []
  await page.route("**/api/stripe/checkout", r => { bodies.push(r.request().postDataJSON()); return r.fulfill({ json: { url: "https://checkout.stripe.com/c/pay/test_123" } }) })
  await page.route("https://checkout.stripe.com/**", r => r.fulfill({ contentType: "text/html", body: "<title>Stripe Checkout</title>stripe" }))
  return bodies
}

const visitedApp = (page: Page) => { const seen: string[] = []; page.on("framenavigated", f => { if (f === page.mainFrame()) seen.push(f.url()) }); return seen }

test("signed out: upgrade goes to sign-in (not the app)", async ({ page }) => {
  const seen = visitedApp(page)
  await page.goto(`${BASE}/#pricing`)
  await page.getByRole("button", { name: "upgrade now" }).click()
  await expect(page).toHaveURL(/\/login\?checkout=plus_yearly$/)
  expect(seen.some(u => new URL(u).pathname === "/app")).toBe(false)
})

test("signed in at the sign-in page: back to the site, then straight to Stripe (never the app)", async ({ page }) => {
  await fakeSession(page)
  const bodies = await mockStripe(page)
  const seen = visitedApp(page)
  await page.goto(`${BASE}/login?checkout=plus_monthly`)
  await expect(page).toHaveURL(/checkout\.stripe\.com/)
  expect(bodies).toEqual([{ plan: "plus_monthly", from: "site" }])
  expect(seen.some(u => new URL(u).pathname === "/app")).toBe(false)
})

test("back from sign-in (?checkout=plan): checkout opens right away on the site", async ({ page }) => {
  await fakeSession(page)
  const bodies = await mockStripe(page)
  await page.goto(`${BASE}/?checkout=plus_yearly`)
  await expect(page).toHaveURL(/checkout\.stripe\.com/)
  expect(bodies).toEqual([{ plan: "plus_yearly", from: "site" }])
})
