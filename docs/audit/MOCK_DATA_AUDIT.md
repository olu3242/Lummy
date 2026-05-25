# Mock Data Audit
**Date:** 2026-05-25  
**Scope:** Fake / hardcoded data used in live creator-facing UI vs acceptable demo contexts

---

## Summary Table

| Location | Mock Source | Classification | Impact |
|---|---|---|---|
| Analytics page — revenue/order charts | Hardcoded arrays in component | `must-fix` | Creator sees fictional revenue data |
| Analytics page — traffic sources | Hardcoded pie chart data | `must-fix` | Fictional traffic breakdown shown to creator |
| Analytics page — top products | Hardcoded product array | `must-fix` | Fictional product performance data |
| Analytics page — location data | Hardcoded city array | `must-fix` | Fictional customer location breakdown |
| Checkout page — product resolution | `mockProducts` array | `must-fix` | No real product loaded; all orders use mock product |
| Checkout page — creator details | `storefrontCreator` mock | `must-fix` | Wrong WhatsApp number sent to customer |
| Products page — stats row (sales/views/revenue) | Set to `0` for API products | `acceptable` | Shows zero because those fields aren't in the API response |
| Orders page — `DAILY_REVENUE` sparkline | `[42000, 67500, 38000...]` hardcoded | `must-fix` | Hardcoded 7-day sparkline shown to creator |
| Dashboard main page — `topActions` | `src/data/mock/dashboard-overview.ts` | `acceptable` | Quick-action links; not real metrics |
| Dashboard main page — "AI weekly brief" banner | Static copy | `acceptable` | No fake numbers; just placeholder copy |

---

## Critical: Analytics Page (`src/app/(dashboard)/dashboard/analytics/page.tsx`)

The entire analytics page is built on hardcoded constant arrays defined at module scope (lines 24-84):

```typescript
const revenueData = [
  { month: "Jan", revenue: 285000, orders: 42, ... },
  ...
  { month: "Dec", revenue: 718000, orders: 112, ... },
]

const weeklyConversionData = [
  { day: "Mon", views: 312, clicks: 87, orders: 14 },
  ...
]

const trafficSourceData = [
  { name: "WhatsApp", value: 58 },
  { name: "Direct Link", value: 24 },
  ...
]

const topProductsData = [
  { name: "Ankara Print Dress", views: 1842, orders: 89, revenue: 890000 },
  ...
]

const locationData = [
  { city: "Lagos", customers: 187, pct: 73 },
  ...
]
```

No Supabase query or API call is made anywhere in this file. The `CURRENT_MONTH_REVENUE = 623000` constant (line 22) is also hardcoded.

**Every creator sees the same fictional data.** This is a P0 trust issue — a creator with zero sales will see "₦718,000 revenue" in December.

---

## Critical: Checkout Page Mock Product

**File:** `src/app/[handle]/[productId]/checkout/page.tsx`

```typescript
// Line 16-17
import { mockProducts } from "@/data/mock/dashboard"
import { storefrontCreator, buildWhatsAppUrl } from "@/data/mock/storefront"

// Line 387-388
const product = mockProducts.find(p => p.id === productId) ?? mockProducts[0]
const creator = storefrontCreator
```

- `mockProducts[0]` is "Ankara Print Dress" at ₦18,500
- `storefrontCreator.whatsapp` is a hardcoded Nigerian phone number from the mock file
- The WhatsApp order message sent to `creator.whatsapp` uses this mock phone — it will go to the wrong person

---

## Orders Page — Partial Mock

**File:** `src/app/(dashboard)/dashboard/orders/page.tsx`

Orders are loaded from `/api/orders` (real DB). However:
- Line 48: `const DAILY_REVENUE = [42000, 67500, 38000, 91000, 55000, 84000, 112500]` — hardcoded 7-day sparkline shown in the KPI strip
- The sparkline does not reflect the creator's actual revenue

---

## Mock Data Files

| File | Contents | Consumers |
|---|---|---|
| `src/data/mock/dashboard.ts` | Products, orders, stats, revenue charts | Checkout page (P0), Analytics page (P0) |
| `src/data/mock/dashboard-overview.ts` | Quick-action button config | Dashboard main page (acceptable) |
| `src/data/mock/storefront.ts` | Creator profile, WhatsApp number, store name | Checkout page (P0), storefront demo |
| `src/data/mock/index.ts` | Re-exports, `mockPricingPlans` | Pricing page (acceptable — plan definitions) |

---

## Action Items

1. **P0** — Replace `mockProducts` and `storefrontCreator` in `checkout/page.tsx` with real queries from `storefront-repository` and `product-repository`
2. **P0** — Replace all hardcoded arrays in `analytics/page.tsx` with real Supabase queries (use `getDashboardPaymentSummary()` from `order-repository.ts` which already computes revenue charts from live data)
3. **P1** — Replace `DAILY_REVENUE` sparkline in `orders/page.tsx:48` with last 7 days from `getDashboardPaymentSummary().recentRevenue`
4. **P2** — Delete or archive `src/data/mock/dashboard.ts` after migration to prevent future accidental imports
