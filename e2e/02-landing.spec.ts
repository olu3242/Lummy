import { test, expect } from "@playwright/test"

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("renders with Lummy branding", async ({ page }) => {
    await expect(page).toHaveTitle(/Lummy/i)
    await expect(page.locator("body")).toBeVisible()
  })

  test("hero section is visible", async ({ page }) => {
    const hero = page.locator("section, [class*='hero'], h1").first()
    await expect(hero).toBeVisible()
  })

  test("navigation has login and signup CTAs", async ({ page }) => {
    const loginLink = page.locator('nav a[href*="login"], nav a:has-text("Log in")')
    const signupLink = page.locator('nav a[href*="signup"], nav button:has-text("Get Started")')
    await expect(loginLink.first()).toBeVisible()
    await expect(signupLink.first()).toBeVisible()
  })

  test("pricing section exists", async ({ page }) => {
    const pricing = page.locator('[id*="pricing"], section:has-text("Pricing"), section:has-text("Free")')
    await expect(pricing.first()).toBeVisible({ timeout: 8_000 })
  })

  test("footer renders", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const footer = page.locator("footer")
    await expect(footer).toBeVisible()
  })

  test("page has no JS console errors", async ({ page }) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    // Filter out known third-party noise
    const appErrors = errors.filter((e) => !e.includes("favicon") && !e.includes("net::ERR"))
    expect(appErrors).toHaveLength(0)
  })
})
