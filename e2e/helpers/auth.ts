import type { Page } from "@playwright/test"

export async function signUp(page: Page, email: string, password: string) {
  await page.goto("/signup")
  await page.fill('[name="email"], [placeholder*="email" i]', email)
  await page.fill('[name="password"], [placeholder*="password" i]', password)
  await page.click('button[type="submit"], button:has-text("Sign up"), button:has-text("Create account")')
  // Wait for redirect away from /signup
  await page.waitForURL((url) => !url.pathname.includes("/signup"), { timeout: 10_000 })
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.fill('[name="email"], [placeholder*="email" i]', email)
  await page.fill('[name="password"], [placeholder*="password" i]', password)
  await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")')
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10_000 })
}

export async function signOut(page: Page) {
  // Try API signout first
  await page.goto("/api/auth/signout")
  await page.waitForURL("/login", { timeout: 8_000 }).catch(() => {})
}
