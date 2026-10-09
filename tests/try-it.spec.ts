// The login page's "or just try it" link opens the app as a guest, even for someone who
// started an upgrade while signed out (older builds left a flag that bounced every later
// guest visit back to /login). No fake avatars under the form.
import { test, expect } from "@playwright/test"
import { BASE } from "./import-helpers"

test.use({ viewport: { width: 1280, height: 900 } })

test('"or just try it" opens the app, even with a leftover checkout flag', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("pulp-pending-checkout", "plus_monthly") })
  await page.reload()
  await expect(page.getByText("or just try it")).toBeVisible()
  // The made-up "A M J S" avatar row is gone.
  for (const letter of ["A", "M", "J", "S"]) await expect(page.getByText(letter, { exact: true })).toHaveCount(0)

  await page.getByText("or just try it").click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.getByText("Start Now").first()).toBeVisible()
  await page.waitForTimeout(1500) // the old bounce came a moment after load
  await expect(page).toHaveURL(/\/app$/)
  expect(await page.evaluate(() => localStorage.getItem("pulp-pending-checkout"))).toBeNull()
})

test("an /app checkout link while signed out goes to sign-in, keeping the plan", async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/app?checkout=plus_yearly`)
  await expect(page).toHaveURL(/\/login\?checkout=plus_yearly$/)
})
