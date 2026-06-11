# Final MVP Blockers Report
**Date:** 2026-05-25  
**Branch:** `claude/lummy-creator-commerce-gKhmI`  
**Status after session fixes:** 2 of 5 P0s resolved this session

---

## P0 — Launch Blockers (must fix before go-live)

### ✅ P0-1 — Checkout uses mock product + fake payment [FIXED]
**File:** `src/app/[handle]/[productId]/checkout/page.tsx`  
**Fix applied this session:**
- Replaced `mockProducts.find(...)` with real DB fetch from `/api/storefront/[handle]/product/[productId]`
- Replaced `setTimeout` payment simulation with real `/api/payments/initiate` → Paystack redirect
- Created new public endpoint `src/app/api/storefront/[handle]/product/[productId]/route.ts` scoped by storefront handle
- WhatsApp order message now uses `product.creatorWhatsApp` from DB (falls back to env-seeded mock only if creator has no WhatsApp configured)

---

### ✅ P0-2 — Hero "Get Started Free" CTA is a dead button [FIXED]
**File:** `src/components/sections/hero-section.tsx:316`  
**Fix applied this session:** Added `asChild` + `<a href="/signup">` — button now routes to signup.

---

### ❌ P0-3 — CRON_SECRET unset — all 7 cron jobs return HTTP 401
**File:** `.env.local` (commented out at line ~53)  
**Impact:** Every Vercel cron invocation is silently rejected. Zero scheduled jobs run:
- `analytics-rollup` (daily)
- `health-scoring` (daily)
- `churn-scoring` (daily)
- `notification-cleanup` (daily)
- `stuck-queue-recovery` (every 5 minutes)
- `weekly-digest` (Monday 7am)
- `marketplace-intelligence` (daily 5am)

**Fix required:**
```bash
openssl rand -hex 32
# Paste output into .env.local and Vercel project settings as CRON_SECRET
```

---

### ❌ P0-4 — Analytics page shows hardcoded fictional revenue to every creator
**File:** `src/app/(dashboard)/dashboard/analytics/page.tsx:24–84`  
**Impact:** All revenue charts, traffic breakdown, top products, location data, and conversion funnels are hardcoded constant arrays. A creator with zero sales sees "₦718,000 revenue in December." This is a trust and credibility issue that will cause immediate churn.

**Fix required:** Replace hardcoded arrays with real Supabase queries. `getDashboardPaymentSummary()` in `order-repository.ts` already exists and computes live revenue charts — wire it up.

---

### ❌ P0-5 — BullMQ workers have no entry point — async processing never runs
**Files:** `src/lib/queues/workers/*.ts` (5 worker files)  
**Also blocked by:** `REDIS_URL` not set in `.env.local`

**Impact:** Email confirmations, WhatsApp order notifications, AI background tasks, and analytics events enqueued via `enqueue()` accumulate silently. For MVP, the Supabase-backed `automation_events` queue (processed by cron) handles most flows — but if BullMQ queues are called from webhook handlers, those jobs are lost.

**Fix required (two-part):**
1. Provision Upstash Redis → set `REDIS_URL` in Vercel env vars and `.env.local`
2. Create `scripts/start-workers.ts` that calls all `startXWorker()` functions and deploy as a separate long-running process (or use Vercel's background functions if on Pro plan)

> **MVP mitigation:** The existing `apps/workers/src/main.ts` uses `InMemoryQueueService` (no Redis needed) and runs the automation event processor loop. This covers the critical payment/onboarding workflows for MVP launch. BullMQ workers are supplementary infrastructure — not blocking for Day 1.

---

## P1 — High Priority (should fix within first week)

### P1-1 — Orders page sparkline uses hardcoded revenue
**File:** `src/app/(dashboard)/dashboard/orders/page.tsx:48`  
```typescript
const DAILY_REVENUE = [42000, 67500, 38000, 91000, 55000, 84000, 112500]
```
Replace with last 7 days from `getDashboardPaymentSummary().recentRevenue`.

### P1-2 — Dashboard header/sidebar use mock creator profile
**Files:** `src/components/layout/dashboard-header.tsx`, `src/components/layout/sidebar.tsx`  
Both import `mockCreatorProfile`. Replace with session user from `supabase.auth.getUser()` + `creator_profiles` query.

### P1-3 — Order detail page uses mockOrders
**File:** `src/app/(dashboard)/dashboard/orders/[orderId]/page.tsx`  
Replace `mockOrders.find(...)` with `getOrderById(orderId)` from `order-repository.ts`.

### P1-4 — Product detail page uses mockProducts
**File:** `src/app/(dashboard)/dashboard/products/[productId]/page.tsx`  
Replace with real `getProductById(productId)` query.

### P1-5 — WhatsApp outbound feature flag must be enabled before launch
**File:** `src/lib/whatsapp/send.ts:113`  
`whatsapp_outbound_enabled` flag defaults to off. Enable in `feature_flags` table after end-to-end testing: `UPDATE feature_flags SET enabled = true WHERE flag_key = 'whatsapp_outbound_enabled';`

### P1-6 — META_APP_SECRET not set (WhatsApp webhook unverified)
**File:** `.env.local` (commented out)  
Without this, incoming WhatsApp webhook payloads cannot be HMAC-verified. Set in Vercel env vars.

---

## P2 — Nice to Have (polish before scale)

| Item | File | Notes |
|---|---|---|
| Delete `src/data/mock/dashboard.ts` after P0-4 migration | — | Prevents accidental re-import |
| Enable Sentry error monitoring | `.env.local` | `SENTRY_DSN` missing |
| Orders/[orderId] — "Track order" link resolves | `checkout/page.tsx:ConfirmationStep` | `/track/${orderId}` route doesn't exist yet |
| Store schema DB sync — validate round-trip on production | `src/app/api/store/schema/route.ts` | Works end-to-end in code; needs real DB test |

---

## Environment Variables — Production Checklist

| Variable | Status | Action |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ set | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ set | — |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ set | — |
| `PAYSTACK_SECRET_KEY` | ✅ set | — |
| `PAYSTACK_PUBLIC_KEY` | ✅ set | — |
| `ANTHROPIC_API_KEY` | ✅ set | — |
| `RESEND_API_KEY` | ✅ set | — |
| `WHATSAPP_BUSINESS_TOKEN` | ✅ set | — |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ set | — |
| `CRON_SECRET` | ❌ commented out | **P0 — generate + set immediately** |
| `REDIS_URL` | ❌ missing | P0 (BullMQ) / P1 (MVP mitigation exists) |
| `META_APP_SECRET` | ❌ commented out | P1 — WhatsApp webhook HMAC |
| `SENTRY_DSN` | ❌ missing | P2 |
