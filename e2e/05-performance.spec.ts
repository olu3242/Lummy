import { test, expect } from "@playwright/test"

test.describe("Performance — Core Web Vitals thresholds", () => {
  test("landing page LCP within threshold", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    const lcp = await page.evaluate(() =>
      new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
          resolve(last.startTime)
        }).observe({ type: "largest-contentful-paint", buffered: true })
        setTimeout(() => resolve(Infinity), 5000)
      })
    )
    // LCP < 4s (good < 2.5s, needs improvement < 4s)
    expect(lcp).toBeLessThan(4000)
  })

  test("landing page has no render-blocking scripts", async ({ page }) => {
    const blockingScripts: string[] = []
    page.on("response", (res) => {
      const url = res.url()
      const type = res.headers()["content-type"] ?? ""
      if (type.includes("javascript") && !url.includes("_next/static")) {
        blockingScripts.push(url)
      }
    })
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")
    expect(blockingScripts).toHaveLength(0)
  })

  test("storefront loads within 3s on mobile emulation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const start = Date.now()
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(3000)
  })

  test("login page loads within 2s", async ({ page }) => {
    const start = Date.now()
    await page.goto("/login")
    await page.waitForLoadState("domcontentloaded")
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(2000)
  })
})
