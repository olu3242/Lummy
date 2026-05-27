import { test, expect } from "@playwright/test"

test.describe("Auth flow", () => {
  test("login page renders with required elements", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveTitle(/Lummy|Log in|Sign in/i)
    await expect(page.locator('input[type="email"], [name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("signup page renders with required elements", async ({ page }) => {
    await page.goto("/signup")
    await expect(page).toHaveTitle(/Lummy|Sign up|Create/i)
    await expect(page.locator('input[type="email"], [name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("protected /dashboard redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })

  test("protected /onboarding redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/onboarding")
    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })

  test("protected /ops redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/ops")
    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
  })

  test("login page has link to signup", async ({ page }) => {
    await page.goto("/login")
    const signupLink = page.locator('a[href*="signup"], a:has-text("Sign up"), a:has-text("Create account")')
    await expect(signupLink.first()).toBeVisible()
  })

  test("signup page has link to login", async ({ page }) => {
    await page.goto("/signup")
    const loginLink = page.locator('a[href*="login"], a:has-text("Log in"), a:has-text("Sign in")')
    await expect(loginLink.first()).toBeVisible()
  })

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[type="email"], [name="email"]', "notreal@example.com")
    await page.fill('input[type="password"]', "wrongpassword123")
    await page.click('button[type="submit"]')
    // Should stay on login page
    await expect(page).toHaveURL(/login/, { timeout: 8_000 })
    // Should show some error indication (toast, message, etc.)
    const errorIndicator = page.locator('[role="alert"], .text-destructive, [data-toast], [class*="error"]')
    await expect(errorIndicator.first()).toBeVisible({ timeout: 8_000 })
  })
})
