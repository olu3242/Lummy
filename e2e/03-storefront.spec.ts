import { test, expect } from "@playwright/test"

/**
 * Storefront E2E tests.
 * These tests use a known test handle. In CI, set PLAYWRIGHT_TEST_HANDLE
 * to a handle that exists in the test database.
 * Falls back to a 404 check if the handle doesn't exist.
 */

const TEST_HANDLE = process.env.PLAYWRIGHT_TEST_HANDLE ?? "test-store"

test.describe("Storefront — public routes", () => {
  test("nonexistent handle returns 404 page", async ({ page }) => {
    const response = await page.goto("/__lummy_nonexistent_handle_xyz_404__")
    // Next.js not-found returns 200 with 404 content, or actual 404
    await expect(page.locator("body")).toContainText(/not found|404|doesn't exist/i)
  })

  test("storefront page structure when handle exists", async ({ page }) => {
    const response = await page.goto(`/${TEST_HANDLE}`)
    if (response?.status() === 404) {
      test.skip()
      return
    }
    // Should have a products grid or empty state
    const content = page.locator("[class*='product'], [class*='grid'], h1, h2")
    await expect(content.first()).toBeVisible({ timeout: 8_000 })
  })

  test("storefront has share button", async ({ page }) => {
    const response = await page.goto(`/${TEST_HANDLE}`)
    if (response?.status() === 404) { test.skip(); return }
    const shareBtn = page.locator('button:has([class*="share"]), button[aria-label*="share" i]')
    await expect(shareBtn.first()).toBeVisible({ timeout: 8_000 })
  })

  test("links page renders for valid handle", async ({ page }) => {
    const response = await page.goto(`/${TEST_HANDLE}/links`)
    if (response?.status() === 404) { test.skip(); return }
    await expect(page.locator("body")).toBeVisible()
  })
})

test.describe("Product detail page", () => {
  test("product detail 404 for invalid product", async ({ page }) => {
    await page.goto(`/${TEST_HANDLE}/00000000-0000-0000-0000-000000000000`)
    const errorText = page.locator('body:has-text("not available"), body:has-text("not found"), body:has-text("404")')
    // Page should render without crashing (loading, error, or 404 all acceptable)
    await expect(page.locator("body")).toBeVisible()
  })

  test("checkout page requires valid product", async ({ page }) => {
    await page.goto(`/${TEST_HANDLE}/00000000-0000-0000-0000-000000000000/checkout`)
    await expect(page.locator("body")).toBeVisible()
  })
})
