# Automation Gap Analysis — Lummy Creator Commerce OS
**Date**: 2026-05-23  
**Project**: llbuddtdsdbljnsvzide  
**Branch**: claude/lummy-creator-commerce-gKhmI

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ COMPLETE | End-to-end functional |
| 🟡 PARTIAL | Infrastructure exists, missing 1-2 components |
| 🔴 STUB | Route/handler exists, returns placeholder response |
| ❌ MISSING | No implementation exists |

---

## Phase 1 — Creator Lifecycle

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 1.1 | Sign-up → onboarding start | ✅ COMPLETE | Auth hook, `onboarding_states` table, 4-step wizard | — | — |
| 1.2 | Onboarding step tracking | ✅ COMPLETE | `useOnboardingStore`, `onboarding_states.current_step` upsert | — | — |
| 1.3 | Onboarding complete → org + storefront creation | ✅ COMPLETE | Server action creates org, storefront, sets `onboarding_completed=true` | — | — |
| 1.4 | Welcome sequence (email + WhatsApp) | ❌ MISSING | `automation_events` dispatch stub only | Outbound email via Resend, outbound WhatsApp send | P0 |
| 1.5 | Profile incomplete after 24h → nudge | ❌ MISSING | Churn scoring exists (`computeChurnRisk`) | Cron trigger, nudge dispatch, email/WhatsApp send | P1 |
| 1.6 | Creator deactivation / account deletion | 🔴 STUB | Route `/api/account/delete` returns `{status:'ok'}` | Cascade: cancel subscriptions, archive data, revoke tokens | P2 |

---

## Phase 2 — Storefront & Product Management

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 2.1 | Product created → storefront publish | 🟡 PARTIAL | `products` table, RLS policies, `status` field | Auto-publish flow, draft→active transition event | P1 |
| 2.2 | Product price change → notification | ❌ MISSING | — | DB trigger or application event, subscriber notify | P2 |
| 2.3 | Low stock alert | ❌ MISSING | `showStock` flag in schema | `stock_count` column missing from `products`, alert threshold logic | P1 |
| 2.4 | Product image upload → CDN optimization | 🟡 PARTIAL | Supabase Storage bucket `products` configured | Image transform pipeline, srcset generation | P2 |
| 2.5 | Storefront theme save → live publish | 🟡 PARTIAL | `storefronts.store_schema` JSONB column, `storefronts.theme` JSONB | Editor ↔ DB sync (currently saves to localStorage only) | P0 |
| 2.6 | Custom domain setup → DNS verify | 🔴 STUB | `storefronts.custom_domain` column (plan: in schema) | DNS verification logic, TLS provisioning, route binding | P2 |

---

## Phase 3 — Orders & Payments

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 3.1 | Checkout initiation → Paystack redirect | ✅ COMPLETE | `createPaystackCheckoutSession()`, order insert, redirect | — | — |
| 3.2 | Paystack webhook → order fulfilled | ✅ COMPLETE | HMAC verify, idempotency via `provider_webhook_events`, order status update | — | — |
| 3.3 | Payment success → customer memory sync | ✅ COMPLETE | `PAYMENT_RECEIVED` automation event → handler → customer upsert | — | — |
| 3.4 | Payment failure → retry prompt | ❌ MISSING | `failure_reason` stored in `payments` | Retry link generation, customer notification | P1 |
| 3.5 | Order fulfilled → creator notification (push/in-app) | 🟡 PARTIAL | Realtime subscription exists (`subscribeToNotifications`) | Server-side push: missing `notifications` table insert on payment success | P0 |
| 3.6 | Order fulfilled → receipt email to customer | ❌ MISSING | Resend API key configured | Email template, send trigger from webhook handler | P0 |
| 3.7 | Stripe webhook → subscription events | 🟡 PARTIAL | `STRIPE_WEBHOOK_SECRET` env var, unified webhook route | Stripe-specific event parsing (currently only Paystack paths wired) | P1 |
| 3.8 | Refund initiated → order rollback | 🔴 STUB | `refund_status` not in schema | Refund table, reversal logic, customer notification | P2 |
| 3.9 | Flutterwave payment flow | ❌ MISSING | Env vars set (`FLUTTERWAVE_SECRET_KEY`) | Provider implementation (no `FlutterwaveProvider`) | P1 |
| 3.10 | Subscription created → plan upgrade | 🟡 PARTIAL | `subscriptions` table, `organizations.plan` field | Stripe subscription webhook parsing, feature flag unlock | P1 |

---

## Phase 4 — WhatsApp Commerce Engine

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 4.1 | Storefront "Order on WhatsApp" click → link | ✅ COMPLETE | `wa.me` link generation, click tracking in `whatsapp_clicks` | — | — |
| 4.2 | Inbound WhatsApp message → inbox | ✅ COMPLETE | HMAC webhook verification, `InboxMessage` type, `processInboxMessage()` | — | — |
| 4.3 | Inbound message → intent detection | ✅ COMPLETE | `detectIntent()` regex engine (12 patterns), 5-min dedup | — | — |
| 4.4 | Purchase intent → checkout link | ✅ COMPLETE | `emitConversionEvent()`, `generateSuggestedReply()` produces checkout URL | — | — |
| 4.5 | **Outbound WhatsApp message SEND** | ❌ MISSING | Token/Phone ID env vars set | **Meta Cloud API `messages` endpoint caller — COMPLETELY ABSENT** | **P0** |
| 4.6 | Suggested reply → auto-send (opt-in) | ❌ MISSING | Reply generated, stored in `ai_conversion_events` | Outbound send (blocked by 4.5), opt-in flag per creator | P0 |
| 4.7 | WhatsApp broadcast to customers | ❌ MISSING | — | Template approval flow, broadcast list, rate limiting | P2 |
| 4.8 | Conversation threading | ❌ MISSING | `InboxMessage.thread_id` field | Thread storage, next-message correlation | P1 |
| 4.9 | WhatsApp opt-out / STOP handling | ❌ MISSING | — | STOP keyword detection, suppression list | P1 |
| 4.10 | After-hours auto-reply | ❌ MISSING | `StoreHoursSettings` in schema plan | Hours check logic, auto-reply send | P2 |

---

## Phase 5 — CRM & Customer Intelligence

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 5.1 | Customer auto-created on first purchase | ✅ COMPLETE | `PAYMENT_RECEIVED` → `CUSTOMER_PURCHASE` event → customer upsert handler | — | — |
| 5.2 | Customer LTV calculation | 🟡 PARTIAL | Order amounts stored, `creator_metrics_daily` aggregation | Per-customer LTV field, cumulative roll-up | P1 |
| 5.3 | Customer tag management | 🔴 STUB | Route exists | Tag schema, apply/remove logic | P2 |
| 5.4 | VIP customer detection → reward | ❌ MISSING | — | LTV threshold rule, VIP tag auto-apply, reward dispatch | P2 |
| 5.5 | Dormant customer → win-back campaign | ❌ MISSING | Churn scoring exists (4-tier: low/medium/high/critical) | Win-back trigger (last_purchase_at check), campaign send | P1 |
| 5.6 | Customer birthday / anniversary | ❌ MISSING | — | `birthday` column, daily cron check, personalized send | P3 |
| 5.7 | Lead capture from storefront | 🔴 STUB | `leads` table in schema | Lead form on storefront, insert action | P1 |
| 5.8 | Lead → customer conversion tracking | ❌ MISSING | — | Lead status field, conversion event linkage | P2 |

---

## Phase 6 — AI Growth Engine

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 6.1 | AI caption generation | ✅ COMPLETE | `generateCaption()` server action, `ai_generations` log, Claude API | — | — |
| 6.2 | AI reply suggestion | ✅ COMPLETE | `generateReply()` server action, Claude API | — | — |
| 6.3 | AI storefront suggestions | ✅ COMPLETE | `generateStorefrontSuggestions()` in `src/lib/ai/commerce.ts` | — | — |
| 6.4 | AI pricing suggestion | ✅ COMPLETE | `generatePricingSuggestion()` in `src/lib/ai/commerce.ts` | — | — |
| 6.5 | AI onboarding interview | 🟡 PARTIAL | Interview UI exists in onboarding step 3 | Streaming response, structured output extraction | P1 |
| 6.6 | Unified AI gateway (single Anthropic client) | ❌ MISSING | **5 separate `new Anthropic()` instances scattered across codebase** | Central `src/lib/ai/gateway.ts` with rate limiting, token counting, cost tracking | P0 |
| 6.7 | AI usage quota enforcement | ❌ MISSING | — | Per-org token budget, quota check before inference, upgrade prompt | P1 |
| 6.8 | AI generation → content calendar | ❌ MISSING | `ai_generations` log exists | Calendar UI, scheduled post publishing | P2 |
| 6.9 | Product description auto-generation | 🟡 PARTIAL | Claude API available, storefront suggestions endpoint exists | Dedicated product description prompt, UI trigger | P1 |
| 6.10 | Trend-aware content suggestions | ❌ MISSING | — | Trend data source, daily refresh cron, creator niche mapping | P3 |

---

## Phase 7 — Health Scoring & Churn Prevention

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 7.1 | Daily health score computation | ✅ COMPLETE | `computeCreatorScore()` (0-100), Vercel cron at 2am | — | — |
| 7.2 | Churn risk scoring | ✅ COMPLETE | `computeChurnRisk()` 4-tier, Vercel cron at 3am | — | — |
| 7.3 | High churn risk → intervention | 🟡 PARTIAL | Score written to (implied) column, automation event dispatched | `creator_health_scores` table not confirmed in schema, intervention handler stub | P0 |
| 7.4 | Score drop alert to creator | ❌ MISSING | — | Score delta detection, notification dispatch | P1 |
| 7.5 | Score-based feature recommendations | ❌ MISSING | — | Recommendation engine mapping score bands → actions | P2 |
| 7.6 | Creator cohort analysis | ❌ MISSING | `creator_metrics_daily` exists | Cohort grouping, comparative percentile | P2 |

---

## Phase 8 — Analytics & Reporting

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 8.1 | Daily metrics rollup | ✅ COMPLETE | Vercel cron 1am, `analytics-rollup` route, `creator_metrics_daily` upsert | — | — |
| 8.2 | Storefront view tracking | 🟡 PARTIAL | `whatsapp_clicks` tracked | Page view events, unique visitor dedup | P1 |
| 8.3 | Product click → conversion funnel | 🟡 PARTIAL | `ai_conversion_events` tracks WhatsApp intent | Non-WhatsApp conversion paths untracked | P1 |
| 8.4 | Revenue dashboard real-time | 🟡 PARTIAL | Supabase Realtime subscription for notifications | Revenue aggregation query, chart component | P1 |
| 8.5 | Weekly performance digest email | ❌ MISSING | — | Metrics aggregation, email template, Resend send | P1 |
| 8.6 | UTM / campaign attribution | ❌ MISSING | `campaign_id` field on some tables | UTM param capture, attribution model | P2 |
| 8.7 | Export analytics to CSV | 🔴 STUB | Route exists | Query + CSV serialization | P2 |

---

## Phase 9 — Notifications & Communications

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 9.1 | In-app notification → Realtime push | ✅ COMPLETE | `subscribeToNotifications()`, Supabase Realtime channel | — | — |
| 9.2 | Notification cleanup (24h TTL) | ✅ COMPLETE | Vercel cron at 4am, `notification-cleanup` route | — | — |
| 9.3 | Email transactional (order receipt) | ❌ MISSING | Resend API key set (`RESEND_API_KEY`) | Email templates, send trigger | P0 |
| 9.4 | Email marketing broadcast | ❌ MISSING | — | Template builder, subscriber list, unsubscribe handling | P2 |
| 9.5 | Push notifications (PWA) | ❌ MISSING | — | Service worker, push subscription endpoint, VAPID keys | P3 |
| 9.6 | SMS fallback | ❌ MISSING | — | SMS provider (Termii/Twilio), send logic | P3 |

---

## Phase 10 — Subscription & Billing

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 10.1 | Free → paid plan upgrade | 🟡 PARTIAL | `subscriptions` table, `organizations.plan` field, Stripe keys | Stripe checkout session creation for subscriptions | P1 |
| 10.2 | Trial expiry warning (3d, 1d, 0d) | ❌ MISSING | — | Trial start tracking, cron check, notification dispatch | P1 |
| 10.3 | Subscription renewal success | 🟡 PARTIAL | `subscriptions.current_period_end` field | Stripe renewal webhook parsing, feature refresh | P1 |
| 10.4 | Subscription cancellation | 🟡 PARTIAL | Stripe webhook route exists | Cancellation path parsing, plan downgrade, data archival | P1 |
| 10.5 | Payment method update | 🔴 STUB | — | Stripe payment method update flow | P2 |
| 10.6 | Dunning (failed payment retry) | ❌ MISSING | — | Failed charge detection, retry schedule, escalation | P2 |

---

## Phase 11 — Observability & Operations

| # | Workflow | Status | Existing Components | Missing Components | Priority |
|---|----------|--------|--------------------|--------------------|----------|
| 11.1 | Structured request logging | 🟡 PARTIAL | `logApiEvent()` in `ops-observability.ts`, `logger.ts` JSON logger | **Three parallel uncoordinated systems — consolidation needed** | P1 |
| 11.2 | Error tracking | 🟡 PARTIAL | `trackError()` in `observability/events.ts` | Sentry DSN not set (`# SENTRY_DSN=`) | P1 |
| 11.3 | Job health monitoring | ✅ COMPLETE | `continuity.ts` staleness detection, `ALL_JOBS` registry | — | — |
| 11.4 | Automation event dead-letter queue | ❌ MISSING | Events marked `processed=true` even on handler failure | Failed event detection, retry with backoff, DLQ table | P0 |
| 11.5 | Multi-tenant data isolation audit | 🟡 PARTIAL | RLS on all 9 core tables, `is_org_member()` guard | `provider_webhook_events.tenant_id` nullable (no isolation), admin bypass pattern needed | P1 |
| 11.6 | Rate limiting (AI endpoints) | ❌ MISSING | — | Per-org token budget enforcement (noted in CLAUDE.md as required) | P0 |
| 11.7 | CRON_SECRET enforcement | 🟡 PARTIAL | Fail-closed pattern in cron routes | `CRON_SECRET` not set in `.env.local` — all cron jobs rejected in dev | P0 |

---

## Critical Gap Summary

### P0 — Ship Blocker

| Gap | Impact | Effort |
|-----|--------|--------|
| WhatsApp outbound send (4.5) | Entire commerce engine is inbound-only | Medium — add Meta Cloud API `POST /messages` caller |
| Creator notification on payment (3.5) | Creators blind to orders | Small — add DB insert in webhook handler |
| Customer receipt email (3.6) | No post-purchase confirmation | Small — Resend template + send call |
| Storefront theme → DB sync (2.5) | Editor changes lost on refresh | Medium — save schema to `storefronts.store_schema` |
| Unified AI gateway (6.6) | Cost unknown, no quota, 5 isolated clients | Medium — extract `src/lib/ai/gateway.ts` |
| Automation DLQ (11.4) | Silent failures swallow errors | Small — add `failed_at` column + retry cron |
| CRON_SECRET env var (11.7) | All scheduled jobs dead in dev | Trivial — `openssl rand -hex 32` → `.env.local` |
| High churn risk intervention (7.3) | Scoring runs but never acts | Small — wire handler to notification/email dispatch |

### P1 — Next Sprint

| Gap | Impact |
|-----|--------|
| Flutterwave provider implementation (3.9) | Large segment of Nigerian market unreachable |
| Welcome sequence (1.4) | First-hour activation moment missed |
| Payment failure retry prompt (3.4) | Revenue leakage |
| AI usage quota (6.7) | API costs unbounded |
| Customer win-back campaign (5.5) | Revenue recovery path absent |
| Weekly performance digest (8.5) | Creator retention signal |
| Subscription upgrade flow (10.1) | Monetization path incomplete |

---

## Architecture Debt

### 1. Three Parallel Observability Systems
**Files**: `src/lib/observability/logger.ts`, `src/lib/ops-observability.ts`, `src/lib/observability/events.ts`  
**Problem**: Three uncoordinated logging systems — nothing aggregates to a single stream.  
**Fix**: Route all three to a shared `ObservabilityBus` that fans out to console (dev) / structured log (prod) / Sentry (errors).

### 2. Five Scattered Anthropic Clients
**Files**: `src/app/actions/ai.ts`, `src/lib/ai/commerce.ts`, `src/lib/ai-conversion.ts`, + 2 others  
**Problem**: No shared rate limit, token counting, or cost tracking.  
**Fix**: Create `src/lib/ai/gateway.ts` — single `AnthropicGateway` class. All callers import from it.

### 3. Automation Event Silent Failures
**File**: `src/lib/automation/handlers.ts`  
**Problem**: Events marked `processed = true` in the polling loop before handler runs; exceptions are caught and silently discarded.  
**Fix**: Mark `processing = true` optimistically, mark `processed = true` only on handler success, write `failed_at + error_message` on exception.

### 4. ~90 Stub Routes
**Location**: `src/app/api/**`  
**Problem**: Route files exist with `return NextResponse.json({ status: 'ok' })` or throw immediately — gives false impression of completeness.  
**Fix**: Audit list below; implement P0/P1 routes; delete or `501 Not Implemented` the rest.

### 5. localStorage-Only Store Schema
**File**: `src/app/(dashboard)/dashboard/store/page.tsx`  
**Problem**: `saveSettings()` writes to `localStorage` only. Schema never reaches `storefronts.store_schema`. Public storefront at `/[handle]` never reflects editor changes.  
**Fix**: `save()` in `useStoreSchema` must call a server action that upserts `storefronts.store_schema`.

### 6. No Idempotency on Automation Events
**File**: `src/lib/automation/triggers.ts`  
**Problem**: `dispatchAutomation()` inserts without idempotency key. Webhook retries can double-fire events.  
**Fix**: Add `idempotency_key` column to `automation_events`; generate from `${eventName}:${tenantId}:${Math.floor(Date.now()/300000)}` (5-min window dedup).

---

## Recommended Implementation Order

```
Week 1 — Unblock Revenue
  1. Generate CRON_SECRET → all cron jobs functional in dev
  2. Add `notifications` table insert to payment webhook handler
  3. Implement WhatsApp outbound send (Meta Cloud API)
  4. Implement customer receipt email (Resend template)

Week 2 — Data Integrity
  5. Fix automation event silent failure (DLQ pattern)
  6. Wire storefront schema save to DB (not just localStorage)
  7. Create unified AI gateway

Week 3 — Growth Loops
  8. Welcome sequence (email + WhatsApp on onboarding complete)
  9. High churn risk → intervention dispatch
  10. Payment failure retry prompt

Week 4 — Monetization
  11. Flutterwave provider implementation
  12. Subscription upgrade flow (Stripe checkout)
  13. AI usage quota enforcement
  14. Weekly performance digest email
```

---

## Stub Routes Requiring Implementation

Routes that currently return `{status:'ok'}` or throw immediately (P0/P1 only):

| Route | Priority | Required Action |
|-------|----------|----------------|
| `POST /api/whatsapp/send` | P0 | Meta Cloud API caller |
| `POST /api/notifications/send` | P0 | Insert to `notifications` table + Realtime push |
| `POST /api/emails/transactional` | P0 | Resend `send()` call |
| `POST /api/payments/flutterwave/initiate` | P1 | Flutterwave checkout session |
| `POST /api/subscriptions/upgrade` | P1 | Stripe checkout for subscription |
| `GET  /api/analytics/export` | P2 | CSV serialization of metrics |
| `POST /api/customers/tags` | P2 | Tag apply/remove on customer record |

---

*Generated by automation audit agent — 2026-05-23*
