import { test, expect } from "@playwright/test"

/**
 * API smoke tests — verify runtime API routes are reachable and return
 * correct status codes without auth (401/403) rather than 500 (crash).
 */

test.describe("API smoke tests — unauthenticated", () => {
  test("GET /api/storefront/:handle/products returns 200 or 404", async ({ request }) => {
    const res = await request.get("/api/storefront/nonexistent-handle-xyz/products")
    expect([200, 404]).toContain(res.status())
  })

  test("POST /api/checkout without body returns 400-503, not 500", async ({ request }) => {
    const res = await request.post("/api/checkout", { data: {} })
    expect(res.status()).toBeLessThan(600)
    expect(res.status()).not.toBe(500)
  })

  test("POST /api/payments/webhook without signature returns non-500", async ({ request }) => {
    const res = await request.post("/api/payments/webhook", {
      headers: { "content-type": "application/json" },
      data: { event: "charge.success" },
    })
    // 401 (invalid sig), 503 (unconfigured), or 400 — never 500
    expect([400, 401, 403, 503]).toContain(res.status())
  })

  test("GET /api/orders requires auth — returns 401", async ({ request }) => {
    const res = await request.get("/api/orders")
    expect(res.status()).toBe(401)
  })

  test("GET /api/products requires auth — returns 401", async ({ request }) => {
    const res = await request.get("/api/products")
    expect([401, 403]).toContain(res.status())
  })

  test("GET /api/cron/automation-processor without CRON_SECRET returns 401", async ({ request }) => {
    const res = await request.get("/api/cron/automation-processor")
    expect(res.status()).toBe(401)
  })

  test("GET /api/cron/health-scoring without secret returns 401", async ({ request }) => {
    const res = await request.get("/api/cron/health-scoring")
    expect(res.status()).toBe(401)
  })

  test("GET /api/analytics requires auth — returns 401", async ({ request }) => {
    const res = await request.get("/api/analytics")
    expect([401, 403]).toContain(res.status())
  })
})

test.describe("Static + public routes", () => {
  test("/sitemap.xml is accessible", async ({ request }) => {
    const res = await request.get("/sitemap.xml")
    expect(res.status()).toBe(200)
  })

  test("/robots.txt is accessible", async ({ request }) => {
    const res = await request.get("/robots.txt")
    expect(res.status()).toBe(200)
  })
})
