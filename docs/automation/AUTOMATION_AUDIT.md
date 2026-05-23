# Lummy Automation Infrastructure Audit

**Generated:** 2026-05-23  
**Auditor:** Principal Systems Architect  
**Scope:** Full codebase — `src/`, `supabase/`, `vercel.json`

---

## Executive Summary

Lummy has a **surprisingly mature automation skeleton** for its stage. The core event fabric,
cron pipeline, payment webhooks, WhatsApp ingestion, AI generation, health/churn scoring,
and conversion recovery are all structurally implemented. The critical gaps are:

1. **No actual WhatsApp message dispatch** — inbound works, outbound is missing
2. **Supabase table used as a queue** — no Redis/BullMQ backpressure or priority
3. **Three parallel observability systems** — `logger`, `trackEvent`, `logApiEvent` — not unified
4. **Scattered AI calls** — no centralized gateway, no prompt registry
5. **~100 stub API routes** — one-liner `{status:'ok'}` responses masquerading as features
6. **Automation events have no idempotency guard** — duplicate events can be inserted

---

## Automation Inventory

### Event Fabric

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| `automation_events` table | BUILT | Supabase | Supabase Postgres | 12-event taxonomy; `processed` flag used as queue state |
| `dispatchAutomation()` | BUILT | `src/lib/automation/triggers.ts` | Server | Admin client insert; best-effort (never blocks) |
| `triggerAutomation()` | BUILT | `src/lib/automation/triggers.ts` | Server | Fire-and-forget wrapper |
| `AutomationEventName` taxonomy | BUILT | `src/lib/automation/events.ts` | Types | 12 events: order_created, payment_received, storefront_published, product_created, first_sale_completed, onboarding_completed, creator_inactive_7d/30d, ai_generation_completed, storefront_unpublished, low_product_count, whatsapp_message_received |
| Event handlers | BUILT | `src/lib/automation/handlers.ts` | Server | Handler per event; writes in-app notifications + recordMilestone() |
| `emitConversionEvent()` | BUILT | `src/lib/ai-conversion-events.ts` | Server | Separate event system for AI conversion funnel; writes to `ai_conversion_events` table |
| Event replay | MISSING | — | — | No replay capability on `automation_events` |
| Idempotency guard on dispatch | MISSING | — | — | Duplicate events can be inserted (field exists but never checked) |
| Event routing / fan-out | MISSING | — | — | Single `HANDLERS` map; no multi-subscriber fan-out |
| Redis event bus | MISSING | — | — | No pub/sub infrastructure |

### Queue Infrastructure

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| Automation event queue | PARTIAL | `automation_events` (Supabase) | Cron-pulled | Polling-based; no priority, no concurrency control |
| `conversion_recovery_queue` table | BUILT | Supabase | Supabase | Tracks checkout abandonment recovery state |
| `whatsapp_recovery_events` table | BUILT | Supabase | Supabase | Queues recovery suggestions for WhatsApp follow-up |
| Redis / BullMQ | MISSING | — | — | No real queue infrastructure; all queues are Supabase tables |
| Dead-letter queue | PARTIAL | `src/app/api/runtime/dlq/route.ts` | API stub | Route exists but returns mock data |
| Retry with backoff | MISSING | — | — | Events marked `processed=true` even on handler failure; no retry counter |
| Priority queues | MISSING | — | — | All events processed FIFO |
| Worker concurrency | MISSING | — | — | Single-threaded batch processor; no parallel workers |

### Cron / Scheduling

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| Vercel Cron config | BUILT | `vercel.json` | Vercel Cron | 4 jobs scheduled: analytics-rollup (1am), health-scoring (2am), churn-scoring (3am), notification-cleanup (4am) |
| `analytics-rollup` cron | BUILT | `src/app/api/cron/analytics-rollup/route.ts` | Vercel Cron | Iterates published creators; upserts `creator_metrics_daily` for yesterday |
| `health-scoring` cron | BUILT | `src/app/api/cron/health-scoring/route.ts` | Vercel Cron | Calls `recomputeAllHealthScores()` |
| `churn-scoring` cron | BUILT | `src/app/api/cron/churn-scoring/route.ts` | Vercel Cron | Calls `runChurnScoringJob()` |
| `notification-cleanup` cron | BUILT | `src/app/api/cron/notification-cleanup/route.ts` | Vercel Cron | Cleans stale notifications |
| Unified job runner | BUILT | `src/app/api/jobs/run/route.ts` | API | POST with `{ job: "name" \| "all" }`; logs to `job_runs` table; CRON_SECRET authenticated |
| `job_runs` table logging | BUILT | Supabase | Supabase | Tracks start, status, duration, results |
| Cron continuity audit | BUILT | `src/lib/jobs/continuity.ts` | Server | Checks staleness, failure streaks, CRON_SECRET config |
| `CRON_SECRET` env var | MISSING | — | — | Not set in `.env.local`; all cron endpoints reject (fail-closed) |

### AI Infrastructure

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| Anthropic Claude API client | BUILT | `src/app/actions/ai.ts` | Server Action | `claude-sonnet-4-20250514`; direct Anthropic SDK usage |
| `generateCaption()` | BUILT | `src/app/actions/ai.ts` | Server Action | Logs to `ai_generations` table with token count |
| `generateReply()` | BUILT | `src/app/actions/ai.ts` | Server Action | Customer WhatsApp reply; no `ai_generations` logging |
| `generateStorefrontSuggestions()` | BUILT | `src/lib/ai/commerce.ts` | Server | Bio/CTA/headline suggestions; JSON-parsed Claude output |
| `generatePricingSuggestion()` | BUILT | `src/lib/ai/commerce.ts` | Server | Rule-based (no AI latency); suggests price adjustments |
| Intent detection (`detectIntent()`) | BUILT | `src/lib/ai-conversion.ts` | Server | Regex-based; 6 intent types; no actual LLM call |
| `generateSuggestedReply()` | BUILT | `src/lib/ai-conversion.ts` | Server | Template-based reply per intent |
| `ai_generations` table | BUILT | Supabase | Supabase | Logs type, prompt_input, output, model, tokens_used |
| Centralized AI gateway | MISSING | — | — | AI calls scattered across 5+ files with duplicate Anthropic client instantiation |
| Prompt registry | MISSING | — | — | Prompts hardcoded inline; not versioned or reusable |
| Named AI agents | MISSING | — | — | No Adaeze/Ngozi/Emeka/Chidi/Taiwo/Amara agents |
| Token budget enforcement | MISSING | — | — | No per-creator or per-org token limits |
| AI cost tracking per tenant | PARTIAL | `ai_generations` table | Supabase | Stored but not aggregated or alerted |
| AI governance endpoint | PARTIAL | `src/app/api/ai/governance/route.ts` | API stub | Returns `{status:'ok'}` |

### WhatsApp Integration

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| Meta webhook receiver | BUILT | `src/app/api/webhooks/whatsapp/route.ts` | API | HMAC signature verification; stores to `whatsapp_events` |
| Inbound message handling | BUILT | `src/app/api/webhooks/whatsapp/route.ts` | API | Parses WAMessage, WAContact; upserts conversation |
| WhatsApp inquiry API | BUILT | `src/app/api/whatsapp/inquiry/route.ts` | API | 5-min dedup window; creates `customer_interactions`; emits conversion events |
| WhatsApp inbox management | BUILT | `src/lib/whatsapp/inbox.ts` | Server | Read/filter/mark-read/follow-up functions |
| WhatsApp inbox API | BUILT | `src/app/api/whatsapp/inbox/route.ts` | API | Creator inbox with attribution tracking |
| Payment link dispatch | BUILT | `src/app/api/whatsapp/inbox/send-link/route.ts` | API | Sends product payment link via WhatsApp |
| Conversion recovery | BUILT | `src/app/api/whatsapp/recovery/route.ts` | API | Queues recovery events for abandoned checkouts |
| WhatsApp tracking | BUILT | `src/app/api/whatsapp/track/route.ts` | API | Click tracking |
| **Actual WhatsApp message sending** | **MISSING** | — | — | **No `sendMessage()` via WhatsApp Business API. Recovery events are queued but never dispatched.** |
| WhatsApp broadcast | MISSING | — | — | No bulk/campaign message sending |
| wa_conversations Realtime | PARTIAL | `src/lib/whatsapp/conversations.ts` | Server | Fetch exists; no realtime subscription |

### Payment Flows

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| Payment initiation | BUILT | `src/app/api/payments/initiate/route.ts` | API | Creates order + payment record |
| Paystack checkout session | BUILT | `src/lib/payments/paystack/provider.ts` | Server | POSTs to Paystack `/transaction/initialize` |
| Stripe checkout session | BUILT | `src/lib/payments/stripe/provider.ts` | Server | Uses Stripe SDK |
| Payment webhook handler | BUILT | `src/app/api/payments/webhook/route.ts` | API | Verifies Paystack HMAC + Stripe signature; idempotent via `provider_webhook_events` |
| `markPaymentCompleted()` | BUILT | `src/repositories/order-repository.ts` | Server | Updates order status; syncs customer memory; upserts conversion attribution |
| Payment verification | BUILT | `src/app/api/payments/verify/route.ts` | API | Vercel redirect after payment |
| Post-payment automation trigger | PARTIAL | `src/lib/automation/handlers.ts` | Server | `payment_received` handler exists but not called from webhook |
| Subscription billing | PARTIAL | `src/lib/payments/providers/base.ts` | Types | Interface exists; no implementation |
| Refund automation | MISSING | — | — | No refund flow |
| Failed payment retry | MISSING | — | — | No automatic retry on payment failure |

### Analytics & Business Intelligence

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| `creator_metrics_daily` rollup | BUILT | `src/app/api/cron/analytics-rollup/route.ts` | Cron | Upserts daily metrics per creator |
| `trackFunnelEvent()` | BUILT | `src/lib/analytics/funnel.ts` | Server | 16 funnel events; writes to `funnel_events` table |
| `trackEvent()` (observability) | BUILT | `src/lib/observability/events.ts` | Server | 17 event types; writes structured logs only (not DB) |
| `computeCreatorScore()` | BUILT | `src/lib/growth/scoring.ts` | Server | Activation + engagement + storefront scores; 0-100 each |
| `computeChurnRisk()` | BUILT | `src/lib/creator/churn.ts` | Server | 4-tier risk: low/medium/high/critical |
| `runChurnScoringJob()` | BUILT | `src/lib/creator/churn.ts` | Cron | Scores all active creators; dispatches `creator_inactive_7d/30d` events |
| `runHealthScoringJob()` | BUILT | `src/lib/growth/health.ts` | Cron | Recomputes all creator health scores |
| Funnel cohort analysis | PARTIAL | `src/lib/analytics/cohort.ts` | Server | Exists but depth unknown |
| Attribution tracking | BUILT | `src/repositories/order-repository.ts` | Server | `upsertConversionAttribution()` with UTM/referral/platform tracking |
| Analytics API | PARTIAL | `src/app/api/analytics/route.ts` | API | Exists; depth unknown |

### CRM & Lead Management

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| `customer_interactions` table | BUILT | Supabase | Supabase | Stores inquiries with intent + confidence |
| `conversion_recovery_queue` | BUILT | Supabase | Supabase | Tracks checkout abandonment stages |
| `syncCustomerMemoryForOrder()` | BUILT | `src/repositories/order-repository.ts` | Server | Updates customer record post-purchase |
| Lead scoring | MISSING | — | — | Intent/confidence stored but no composite lead score |
| Customer segmentation | MISSING | — | — | No segment assignment on customers |
| Follow-up automation | PARTIAL | `src/app/api/whatsapp/recovery/route.ts` | API | Queues recovery — never dispatches actual message |
| CRM dashboard API | PARTIAL | `src/app/api/leads/route.ts` | API | Exists; depth unknown |

### Notifications

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| In-app notification insert | BUILT | `src/lib/automation/handlers.ts` | Server | Writes to `notifications` table per automation event |
| Supabase Realtime subscription | BUILT | `src/lib/realtime/notifications.ts` | Client | Singleton channel; deduplication guard |
| Email via Resend | MISSING | — | — | `RESEND_API_KEY` in env; no sending code exists |
| Push notifications | MISSING | — | — | No web push / FCM |
| SMS notifications | MISSING | — | — | No SMS provider |
| Notification cleanup | BUILT | `src/app/api/cron/notification-cleanup/route.ts` | Cron | Removes stale notifications |

### Observability

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| `logger` (structured JSON) | BUILT | `src/lib/observability/logger.ts` | Server | dev: pretty-print; prod: JSON; Vercel/Datadog compatible |
| `trackEvent()` | BUILT | `src/lib/observability/events.ts` | Server | Logs only; no DB write |
| `logApiEvent()` | BUILT | `src/lib/ops-observability.ts` | Server | Legacy; console.info/warn/error JSON; duplicates logger |
| `correlation_id` propagation | BUILT | `src/lib/ops-observability.ts` | Server | `x-correlation-id` header; UUID fallback |
| `job_runs` table | BUILT | Supabase | Supabase | Tracks cron job execution with status + duration |
| Launch readiness report | BUILT | `src/lib/runtime/launch.ts` | Server | Checks env vars, Supabase connectivity, payment config |
| Cron continuity audit | BUILT | `src/lib/jobs/continuity.ts` | Server | Staleness + failure streak detection |
| `automation_logs` table | UNCERTAIN | — | — | Referenced in architecture docs but not confirmed in DB |
| Centralized metrics aggregation | MISSING | — | — | No Prometheus/StatsD/Grafana |
| Alert routing | MISSING | — | — | No PagerDuty/OpsGenie/Slack alerts |

### Multi-Tenant Isolation

| Automation | Status | Location | Runtime | Notes |
|---|---|---|---|---|
| `org_id` scoping (conversion events) | BUILT | `src/app/api/ai/conversion-assistant/route.ts` | API | Uses `org_id` on all conversion tables |
| `creator_id` scoping (automation events) | BUILT | `src/lib/automation/triggers.ts` | Server | Uses `creator_id`; inconsistent with `org_id` pattern |
| RLS on automation tables | PARTIAL | `supabase/migrations/040_*.sql` | Supabase | Core tables have RLS; automation-specific tables unclear |
| Tenant-aware job processing | MISSING | — | — | `runAutomationProcessorJob()` processes all tenants in one batch |

### Stub / Aspirational Routes (one-liner returns)

These routes exist as files but return `{ resource: '...', status: 'ok' }` only.
They represent **planned architecture**, not implemented features.

| Route Namespace | Count | Status |
|---|---|---|
| `/api/cognition/*` | 8 routes | STUB |
| `/api/federation/*` | 3 routes | STUB |
| `/api/grid/*` | 6 routes | STUB |
| `/api/meta/*` | 7 routes | STUB |
| `/api/economy/*` | 6 routes | STUB |
| `/api/interoperability/*` | 3 routes | STUB |
| `/api/orchestration/*` | 3 routes | STUB |
| `/api/strategy/*` | 8 routes | STUB |
| `/api/evolution/*` | 3 routes | STUB |
| `/api/intelligence/*` | 7 routes | STUB |
| `/api/platform/*` | 7 routes | STUB |
| `/api/infrastructure/*` | 8 routes | STUB |
| `/api/governance/*` | 8 routes | STUB |
| `/api/runtime/*` | 7 routes | PARTIAL/STUB |
| `/api/creator/*` | 5 routes | PARTIAL/STUB |

**Total stub surface: ~90 routes.** These should be treated as aspirational
placeholders and explicitly marked. They add no runtime value and inflate the
apparent complexity of the system.

---

## Infrastructure Primitives Assessment

### 1. Event Fabric

| Primitive | Status | Severity if Missing |
|---|---|---|
| `automation_events` table | BUILT | — |
| `emitEvent()` / `dispatchAutomation()` | BUILT | — |
| Event taxonomy (12 types) | BUILT | — |
| `emitConversionEvent()` (separate) | BUILT | — |
| Idempotency key enforcement | MISSING | HIGH — duplicate events fire duplicate notifications |
| Event replay | MISSING | MEDIUM — can't re-process failed events |
| Dead-letter handling | MISSING | HIGH — failed events silently vanish |
| Retry counter on events | MISSING | HIGH — no retry logic; events never retried |
| Multi-subscriber fan-out | MISSING | LOW — single handler map sufficient for MVP |

### 2. Queue Infrastructure

| Primitive | Status | Severity |
|---|---|---|
| Table-as-queue (Supabase) | BUILT | — (functional but limited) |
| Redis / BullMQ | MISSING | MEDIUM — needed for priority queues, rate limiting, backpressure |
| Delayed jobs | MISSING | HIGH — recovery follow-ups need delay (e.g. 2h after abandonment) |
| Dead-letter queue | MISSING | HIGH — failed jobs have no retry or alerting |
| Worker concurrency control | MISSING | MEDIUM — single batch with no parallelism |
| Priority lanes | MISSING | MEDIUM — payment events should preempt churn scoring |

### 3. AI Infrastructure

| Primitive | Status | Severity |
|---|---|---|
| Anthropic SDK integrated | BUILT | — |
| `ai_generations` logging | BUILT | — |
| Centralized AI gateway | MISSING | HIGH — 5 separate Anthropic client instances; no shared config |
| Prompt registry | MISSING | MEDIUM — prompts hardcoded inline; impossible to A/B test |
| Token budget per tenant | MISSING | HIGH — unbounded AI spend per creator |
| Named AI agents | MISSING | LOW — nice-to-have architecture pattern |
| AI response caching | MISSING | MEDIUM — repeated similar prompts not cached |

### 4. Automation Observability

| Primitive | Status | Severity |
|---|---|---|
| `logger` structured logging | BUILT | — |
| `correlation_id` | BUILT | — |
| `job_runs` table | BUILT | — |
| Three parallel log systems | DUPLICATED | MEDIUM — `logger` + `logApiEvent` + `trackEvent` should be one |
| `automation_logs` per execution | MISSING | MEDIUM — no per-event success/failure log |
| Workflow execution metrics | MISSING | MEDIUM — no duration/throughput tracking |
| Alert routing | MISSING | HIGH — no alerting on job failure |

### 5. Multi-Tenant Isolation

| Primitive | Status | Severity |
|---|---|---|
| `org_id` on conversion tables | BUILT | — |
| `creator_id` on automation events | BUILT (inconsistent) | MEDIUM — should align to `org_id` |
| Tenant-scoped job processing | MISSING | HIGH — all tenants processed in same batch |
| Per-tenant rate limiting | MISSING | MEDIUM — one creator could flood the queue |

### 6. Recovery Infrastructure

| Primitive | Status | Severity |
|---|---|---|
| `conversion_recovery_queue` table | BUILT | — |
| Recovery event insert | BUILT | — |
| Actual recovery dispatch (send message) | MISSING | CRITICAL — the most important gap |
| Retry backoff on automation_events | MISSING | HIGH |
| Idempotency on event dispatch | MISSING | HIGH |

---

## Key Technical Debt

1. **Three observability systems** — `logger.ts`, `ops-observability.ts`, `observability/events.ts` — should be unified under `logger`
2. **`creator_id` vs `org_id` inconsistency** — automation events use `creator_id`; conversion events use `org_id`
3. **Events marked processed on failure** — `runAutomationProcessorJob()` sets `processed=true` regardless of handler success; failed events are permanently dropped
4. **No WhatsApp outbound** — the entire recovery flow queues events that are never sent
5. **AI client instantiation scattered** — `new Anthropic()` called in 5+ locations; should be singleton
6. **~90 stub routes** — create false impression of implemented features; should be clearly marked or removed
7. **`creator_profiles` vs `profiles`** — two profile tables referenced; unclear which is canonical
8. **No Resend email** — API key in env; zero sending code; email notifications silent

---

## What Is Actually Wired End-to-End

These are the flows that are **truly functional** from trigger to effect:

1. **Payment webhook → order completion** — Paystack/Stripe → signature verify → idempotent insert → markPaymentCompleted → customer memory sync
2. **WhatsApp inquiry → conversion events** — POST to `/api/whatsapp/inquiry` → dedup → `customer_interactions` insert → intent detection → checkout session creation
3. **Automation event dispatch → in-app notification** — `triggerAutomation()` → `automation_events` insert → `runAutomationProcessorJob()` → handler → `notifications` insert → Realtime push
4. **Cron → health/churn scoring** — Vercel Cron → score computation → `creator_profiles` update → `creator_inactive_*` event dispatch
5. **Daily metrics rollup** — Vercel Cron → `creator_metrics_daily` upsert per creator
6. **AI caption generation** — Server Action → Claude API → `ai_generations` log → return to UI
