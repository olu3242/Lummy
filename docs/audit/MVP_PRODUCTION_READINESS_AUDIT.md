# MVP Production Readiness Audit
**Date:** 2026-05-25  
**Scope:** Infrastructure dependencies and environment variable completeness

---

## Summary Table

| Dependency | Status | Notes |
|---|---|---|
| Redis / BullMQ | `blocked` | No `REDIS_URL` in `.env.local`; falls back to `localhost:6379` which fails in prod |
| BullMQ Workers | `disconnected` | Worker files exist but no entry point calls `startAIWorker()` etc. |
| Cron Jobs | `partial` | All 7 cron routes exist and guard with `CRON_SECRET`, but `CRON_SECRET` is **not set** in `.env.local` |
| Stripe Webhook | `operational` | Signature verified (`STRIPE_WEBHOOK_SECRET` set). 5-min replay guard in place. |
| Paystack Webhook | `operational` | HMAC-SHA512 verified via `verifyPaystackSignature`. `PAYSTACK_SECRET_KEY` set. |
| WhatsApp Outbound | `partial` | Env vars set. Feature-flagged behind `whatsapp_outbound_enabled` (flag state unknown at deploy) |
| Resend Email | `operational` | `RESEND_API_KEY` set. Full transactional template library implemented. |
| Supabase | `operational` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` all set |
| Anthropic AI | `operational` | `ANTHROPIC_API_KEY` set. AI gateway with retry/budget enforcement implemented. |
| CRON_SECRET | `blocked` | Commented out in `.env.local` — all 7 cron jobs will return HTTP 401 on every invocation |

---

## Detail: Redis / BullMQ

**File:** `src/lib/queues/connection.ts`

- Reads `REDIS_URL` first; falls back to `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`
- Neither `REDIS_URL` nor `REDIS_HOST` is present in `.env.local`
- Production behavior: connects to `localhost:6379` → connection error logged, BullMQ queues unavailable
- **Impact:** `enqueue()` calls from the webhook handler will silently fail; no async email/WhatsApp/AI workers run

## Detail: BullMQ Workers — No Entry Point

**Files:** `src/lib/queues/workers/ai-worker.ts`, `email-worker.ts`, `whatsapp-worker.ts`, `analytics-worker.ts`, `notification-worker.ts`

- All workers export `startXWorker()` functions
- Searched entire `src/` tree — **no file calls `startAIWorker()`, `startEmailWorker()`, etc.**
- Workers are imported only from `src/lib/jobs/workers.ts` for cron-driven batch jobs (not the BullMQ consumer runtime)
- **Impact:** BullMQ-based async processing is completely non-functional even if Redis is provisioned

## Detail: CRON_SECRET — Blocked

**File:** `.env.local`, line ~53  
```
# CRON_SECRET=                        # Generate: openssl rand -hex 32
```

All 7 cron routes call `verifyCronSecret()` which checks `process.env.CRON_SECRET`:
- `src/app/api/cron/analytics-rollup/route.ts:8` — returns 401 if secret unset
- `src/app/api/cron/health-scoring/route.ts:8` — returns 401
- `src/app/api/cron/churn-scoring/route.ts:8` — returns 401
- `src/app/api/cron/notification-cleanup/route.ts:8` — returns 401
- `src/app/api/cron/stuck-queue-recovery/route.ts:8` — returns 401
- `src/app/api/cron/weekly-digest/route.ts:16` — returns 401
- `src/app/api/cron/marketplace-intelligence/route.ts:8` — returns 401

**Vercel cron jobs (vercel.json) will silently fail every invocation.**

## Detail: WhatsApp Outbound — Feature-Flagged Off

**File:** `src/lib/whatsapp/send.ts:113-117`

```typescript
const flagEnabled = await isEnabled("whatsapp_outbound_enabled")
if (!flagEnabled) return { success: true, to: payload.to }  // silently skipped
```

`WHATSAPP_BUSINESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are present in `.env.local`.  
Flag must be explicitly enabled in the feature flags table before outbound messages are sent.

## Missing Env Vars (Production Checklist)

| Variable | `.env.local` | Needed For |
|---|---|---|
| `REDIS_URL` | ❌ missing | BullMQ queue consumers |
| `CRON_SECRET` | ❌ commented out | All 7 Vercel cron jobs |
| `META_APP_SECRET` | ❌ commented out | WhatsApp webhook HMAC verification |
| `SENTRY_DSN` | ❌ missing | Error monitoring (optional but recommended) |

---

## Action Items

1. **P0** — Provision Redis (Upstash recommended) and set `REDIS_URL` in Vercel environment variables
2. **P0** — Create a worker entry point (e.g., `scripts/start-workers.ts`) and deploy as a separate process; without it BullMQ workers never run
3. **P0** — Generate and set `CRON_SECRET`: `openssl rand -hex 32`, add to Vercel env and local `.env.local`
4. **P1** — Enable `whatsapp_outbound_enabled` feature flag after testing end-to-end outbound flow
5. **P1** — Set `META_APP_SECRET` for WhatsApp webhook HMAC payload verification
