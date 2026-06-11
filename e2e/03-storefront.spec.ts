import { test, expect } from "@playwright/test"

/**
 * Storefront E2E tests.
 * These tests use a known test handle. In CI, set PLAYWRIGHT_TEST_HANDLE
 * to a handle that exists in the test database.
 * Falls back gracefully when Supabase is not connected in CI.
 */

const TEST_HANDLE = process.env.PLAYWRIGHT_TEST_HANDLE ?? "test-store"

test.describe("Storefront — public routes", () => {
  test("nonexistent handle shows not-found or error page (never crashes)", async ({ page }) => {
    await page.goto("/__lummy_nonexistent_handle_xyz_404__")
    // Page must render something — not-found page OR error page — never a blank screen
    await expect(page.locator("body")).toBeVisible()
    // Must contain some meaningful text (not a blank page)
    const text = await page.locator("body").innerText()
    expect(text.trim().length).toBeGreaterThan(10)
  })

  test("storefront page renders something for any handle", async ({ page }) => {
    const response = await page.goto(`/${TEST_HANDLE}`)
    // Either renders store (200), not-found (404 content), or error page — not a blank screen
    await expect(page.locator("body")).toBeVisible()
    const text = await page.locator("body").innerText()
    expect(text.trim().length).toBeGreaterThan(10)
  })

  test("links page renders without crashing", async ({ page }) => {
    await page.goto(`/${TEST_HANDLE}/links`)
    await expect(page.locator("body")).toBeVisible()
  })
})

test.describe("Product detail page", () => {
  test("invalid product ID renders without JS crash", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (err) => errors.push(err.message))
    await page.goto(`/${TEST_HANDLE}/00000000-0000-0000-0000-000000000000`)
    await expect(page.locator("body")).toBeVisible()
    // No uncaught JS exceptions
    expect(errors).toHaveLength(0)
  })

  test("checkout page renders without JS crash", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (err) => errors.push(err.message))
    await page.goto(`/${TEST_HANDLE}/00000000-0000-0000-0000-000000000000/checkout`)
    await expect(page.locator("body")).toBeVisible()
    expect(errors).toHaveLength(0)
  })
})
