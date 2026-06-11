# Lummy Automation — Enterprise Implementation Plan

**Generated:** 2026-05-23  
**Status:** Living Document — updated per phase completion  
**Owner:** Engineering  
**Scope:** Full automation runtime, AI gateway, notification pipelines, observability, and workflow orchestration

---

## Audit Summary

Lummy enters this implementation cycle with a surprisingly mature automation skeleton for its stage. The codebase contains 40 applied migrations covering auth, RLS, storefront schema, payment webhooks, AI conversion funnels, WhatsApp ingestion, churn scoring, referrals, discovery, and a runtime reconciliation layer. The existing event fabric (`automation_events` table + `dispatchAutomation()` / `triggerAutomation()` in `src/lib/automation/triggers.ts`) is structurally sound, and the Paystack payment webhook path is fully end-to-end verified. Onboarding, product management, and basic CRM flows are wired at the data layer. The platform has the bones of an enterprise commerce operating system.

The critical gaps are operational rather than architectural. Four independent Anthropic SDK clients are scattered across `src/lib/ai/`, `src/app/api/`, and server actions with no shared rate-limiting, cost tracking, or prompt registry. Redis and BullMQ are entirely absent — all queues are Supabase tables polled by crons, which cannot provide priority ordering, backpressure, or sub-second latency. WhatsApp outbound dispatch is completely missing despite the inbound parsing being built. Three parallel observability systems (`logger`, `trackEvent`, `logApiEvent`) emit to different sinks with no correlation. Automation failures are silent — events are marked `processed=true` even when handlers throw, with no retry counter, no dead-letter queue, and no alerting. These gaps must be closed before Lummy can reliably convert traffic into revenue at scale.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LUMMY AUTOMATION RUNTIME                    │
└─────────────────────────────────────────────────────────────────────┘

[Creator Events]──────────►[Event Fabric]──────────►[Queue Runtime]──────►[AI Runtime]
 order.paid                  enhanced fabric           BullMQ/Redis         AI Gateway
 whatsapp.message_received    idempotency guard         ai-jobs              named agents
 creator.churn_risk_high      fan-out router            whatsapp-jobs        prompt cache
 product.published            outbox pattern            payment-jobs         cost tracking
                                                         campaign-jobs
                                   │                         │
                                   ▼                         ▼
                            [Workflow Engine]    [Notification Runtime]
                             n8n-thin wiring       email (Resend)
                             WA-01..SC-01          WhatsApp outbound
                             SLA tracking          in-app realtime
                             rollout %             push / SMS

[n8n Orchestration]─────►[Automation SDK]──────────────►[Supabase DB]
 external triggers           sdk primitives               source of truth
 low-code flows              type-safe wrappers           RLS enforced
 webhook relay               retry/DLQ helpers            audit log

[Mission Control UI]◄────[Observability Bus]◄──────────── all systems
 ops/dashboard               unified sink                 AI Runtime
 DLQ viewer                  correlation IDs              Queue Runtime
 workflow health             traceId propagation          Notification Runtime
 SLA dashboards              structured JSON logs         Event Fabric
 rollout controls            cost + latency metrics       Security Runtime
```

---

## Implementation Phases

| Phase | Name | Week | Status | Dependencies |
|-------|------|------|--------|--------------|
| 1 | Shared Contracts | 1 | COMPLETE | — |
| 2 | AI Gateway Centralization | 1 | PENDING | Phase 1 |
| 3 | Event Fabric Enhancement | 1 | PENDING | Phase 1 |
| 13 | DLQ Infrastructure | 1 | PENDING — P0 | Phase 1 |
| 4 | Queue Runtime — BullMQ | 2 | PENDING | Phase 3, Phase 13 |
| 5 | Automation SDK | 2 | PENDING | Phase 4 |
| 6 | WhatsApp Outbound | 2 | PENDING — P0 REVENUE BLOCKER | Phase 4, Phase 5 |
| 7 | Email Notifications | 2 | PENDING — P0 REVENUE BLOCKER | Phase 4, Phase 5 |
| 8 | Security Runtime Enhancement | 3 | PENDING | Phase 3, Phase 4 |
| 9 | P0 Workflow Orchestration | 3 | PENDING | Phase 6, Phase 7 |
| 10 | Mission Control UI | 3 | PENDING | Phase 9, Phase 14 |
| 14 | Observability Consolidation | 3 | PENDING | Phase 3, Phase 4 |
| 11 | Feature Flags & Rollouts | 4 | PENDING | Phase 10 |
| 12 | n8n Integration | 4 | PENDING | Phase 9 |
| 19 | Notification Runtime | 4 | PENDING | Phase 6, Phase 7 |
| 15 | Marketplace Intelligence | 5 | PENDING | Phase 12, Phase 19 |
| 16 | SLA Framework | 5 | PENDING | Phase 14, Phase 19 |
| 17 | Human Intervention Queue | 5 | PENDING | Phase 13, Phase 16 |
| 18 | Self-Healing Infrastructure | 6 | PENDING | Phase 16, Phase 17 |
| 20 | Data Retention | 6 | PENDING | Phase 14 |
| 21 | Workflow Governance | 6 | PENDING | Phase 11, Phase 16 |

### Phase Descriptions

**Phase 1 — Shared Contracts (Week 1, COMPLETE)**  
Centralized type contracts in `src/contracts/index.ts`: `LummyEvent`, `QueueJob`, `AIJobRequest`, `AIJobResult`, `WorkflowDefinition`, `NotificationRequest`, `DLQEntry`, `ObservabilityEvent`, `SecurityEvent`, `WorkflowRollout`, `WorkflowSLA`. Single source of truth prevents type drift across packages.

**Phase 2 — AI Gateway Centralization (Week 1)**  
Replace 4 scattered Anthropic clients with a single `src/lib/ai/gateway.ts`. Implements named agent dispatch, prompt registry, token budget enforcement, cost tracking per tenant, and automatic prompt caching for system prompts exceeding 1024 tokens. Writes generation metadata to `ai_generations` table.

**Phase 3 — Event Fabric Enhancement (Week 1)**  
Upgrade `src/lib/automation/triggers.ts` to enforce idempotency (check `idempotency_key` before insert), propagate `correlation_id` and `trace_id`, support multi-subscriber fan-out, and emit to the observability bus on every dispatch.

**Phase 13 — DLQ Infrastructure (Week 1, P0)**  
Implement real dead-letter queue logic behind the existing stub at `src/app/api/runtime/dlq/route.ts`. Add `dlq_entries` table in migration 041, retry-with-backoff for failed automation handlers, max-retry enforcement, and DLQ ingestion API. This unblocks silent failure detection.

**Phase 4 — Queue Runtime — BullMQ (Week 2)**  
Introduce Redis + BullMQ worker infrastructure in `src/lib/queues/`. Queues: `ai-jobs`, `whatsapp-jobs`, `email-jobs`, `payment-jobs`, `campaign-jobs`, `notification-jobs`, `onboarding-jobs`, `analytics-jobs`. Each queue backed by a corresponding DLQ. Priority levels 1–10. Delayed execution support via `scheduledAt`.

**Phase 5 — Automation SDK (Week 2)**  
Create `src/lib/automation/sdk.ts` with type-safe primitives: `enqueueJob()`, `scheduleJob()`, `cancelJob()`, `retryFromDLQ()`, `emitEvent()`, `registerWorkflow()`. Wraps BullMQ and Supabase in a single ergonomic interface. All calls are typed against contracts from Phase 1.

**Phase 6 — WhatsApp Outbound (Week 2, P0 REVENUE BLOCKER)**  
Implement `src/lib/whatsapp/send.ts` using the WhatsApp Business Cloud API. Functions: `sendTextMessage()`, `sendTemplateMessage()`, `sendOrderConfirmation()`, `sendCheckoutLink()`, `sendReengagementMessage()`. Enqueues via `whatsapp-jobs` BullMQ queue with retry-on-429.

**Phase 7 — Email Notifications (Week 2, P0 REVENUE BLOCKER)**  
Implement `src/lib/notifications/email.ts` using Resend. Functions: `sendWelcomeEmail()`, `sendOrderConfirmationEmail()`, `sendAbandonedCartEmail()`, `sendWeeklyDigestEmail()`, `sendReengagementEmail()`. Template keys typed against `NotificationRequest.template`. Enqueues via `email-jobs`.

**Phase 8 — Security Runtime Enhancement (Week 3)**  
Upgrade `src/lib/security/trust.ts` with: webhook replay detection using `provider_webhook_events` idempotency table (already exists), AI prompt injection detection heuristics, per-tenant rate limit enforcement with Redis counters, and security event emission to the observability bus.

**Phase 9 — P0 Workflow Orchestration (Week 3)**  
Implement the 12 P0 workflows defined in `WorkflowId`: WA-01 WhatsApp router, WA-02 lead qualifier, WA-04 order confirmation, PAY-01 Paystack webhook, PAY-02 order status updater, AM-01 lead scorer, CH-01 daily metrics, OB-01 creator welcome, CR-01 win-back campaign, CR-02 VIP detection, AN-01 weekly digest, SC-01 subscription lifecycle. Each workflow is a typed handler registered via the Automation SDK.

**Phase 10 — Mission Control UI (Week 3)**  
Enhance existing `src/app/(dashboard)/dashboard/ops/` to a full Mission Control: real-time queue depths via Supabase Realtime, DLQ browser with manual retry, workflow health grid, per-tenant AI cost dashboard, active rollout controls, and SLA breach alerts.

**Phase 14 — Observability Consolidation (Week 3)**  
Replace `logger`, `trackEvent`, and `logApiEvent` with a single `ObservabilityBus` in `src/lib/observability/`. All systems emit `ObservabilityEvent` structs with `correlationId` and `traceId`. Structured JSON to stdout (Vercel logs), forwarded to chosen sink (Axiom/Datadog/Sentry). Eliminates the three-system fragmentation.

**Phase 11 — Feature Flags & Rollouts (Week 4)**  
Implement progressive rollout engine in `src/lib/experiments/`. Workflows can target percentage of tenants or specific `targetTenantIds`. Rollout state tracked in `workflow_rollouts` table (migration 041). Mission Control provides dial controls to increase/pause/rollback any workflow canary.

**Phase 12 — n8n Integration (Week 4)**  
Wire n8n as a thin orchestration layer only — it triggers Lummy Automation SDK actions via authenticated webhooks, never reads from Supabase directly. n8n handles: external service integrations, low-code business logic by non-engineers, scheduled marketing campaigns. Supabase remains the source of truth.

**Phase 19 — Notification Runtime (Week 4)**  
Unified `NotificationRuntime` that routes `NotificationRequest` to the correct channel handler (WhatsApp, email, in-app, push, SMS, Slack) with automatic fallback channel on delivery failure. Deduplication via `idempotencyKey`. Delivery receipts written to `notification_log` table.

**Phase 15 — Marketplace Intelligence (Week 5)**  
AI-powered market intelligence: price benchmarking against comparable creators, product gap analysis, trend detection from aggregate purchase patterns. Powered by Chidi agent (analytics). Surfaces insights in creator dashboard with actionable suggestions.

**Phase 16 — SLA Framework (Week 5)**  
Instrument every workflow with P50/P95/P99 latency tracking. Emit `WorkflowSLA` records to `workflow_sla_snapshots` table (migration 041) every hour. Mission Control SLA dashboard shows breach rates. Automated alerting when P95 exceeds `sla.alertThreshold`.

**Phase 17 — Human Intervention Queue (Week 5)**  
When a job exceeds `maxRetries` and enters DLQ, high-severity entries (payment failures, WhatsApp opt-outs, security events) are escalated to a human review queue visible in Mission Control. Supports one-click retry, manual resolution, and audit trail.

**Phase 18 — Self-Healing Infrastructure (Week 6)**  
Automated recovery patterns: Redis connection failover to Supabase-backed queue, AI provider fallback (Anthropic → OpenAI → cached response), WhatsApp delivery retry with exponential backoff, dead worker detection via BullMQ health checks. Healing actions logged to observability bus.

**Phase 20 — Data Retention (Week 6)**  
Automated purge policies: `automation_events` older than 90 days, `ai_generations` older than 180 days, `observability_events` older than 30 days, `dlq_entries` resolved older than 60 days. Implemented as Supabase cron jobs. Tenant-configurable retention overrides for enterprise plans.

**Phase 21 — Workflow Governance (Week 6)**  
Version control for workflow definitions: each `WorkflowDefinition` change increments version, previous versions archived. Approval required for status transitions from `canary` → `active`. Audit log of all rollout changes with actor, timestamp, and justification.

---

## P0 Revenue Blockers

The following 8 gaps directly block revenue conversion and must be resolved before any other phase work:

### 1. WhatsApp Outbound Dispatch Missing
**Gap:** `src/lib/whatsapp/` contains only inbound parsing. No outbound send capability exists.  
**Impact:** Order confirmations, checkout links, and re-engagement messages cannot be delivered via WhatsApp.  
**Fix:** Create `src/lib/whatsapp/send.ts` using `WHATSAPP_BUSINESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` env vars. Implement `sendTemplateMessage()` and `sendTextMessage()` backed by `whatsapp-jobs` BullMQ queue.

### 2. Email Notification Pipeline Missing
**Gap:** `src/lib/notifications/` has stubs for in-app notifications only. No Resend integration exists.  
**Impact:** Welcome emails, order confirmations, and re-engagement sequences are never sent.  
**Fix:** Create `src/lib/notifications/email.ts` with Resend client. Add `RESEND_API_KEY` to environment. Implement welcome, order confirmation, and abandoned cart templates.

### 3. Automation Failures Are Silent
**Gap:** In `src/lib/automation/handlers.ts`, the handler catch block marks events `processed=true` on failure. No retry counter, no DLQ, no alert.  
**Impact:** Failed automations vanish. Revenue-critical events (payment received, first sale) may silently drop.  
**Fix:** Add `retry_count` and `last_error` columns to `automation_events` (migration 041). Implement exponential backoff retry in the handler loop. Route max-retry events to DLQ.

### 4. DLQ Route Is a Stub
**Gap:** `src/app/api/runtime/dlq/route.ts` returns mock data. No real DLQ infrastructure exists.  
**Impact:** Dead jobs cannot be inspected, retried, or alerted on.  
**Fix:** Implement `dlq_entries` table (migration 041) and real DLQ ingestion. Wire handler failures to insert DLQ entries. Build DLQ viewer in Mission Control.

### 5. No Centralized AI Gateway
**Gap:** Anthropic client is instantiated independently in at minimum: `src/lib/ai/commerce.ts`, `src/lib/ai/conversion.ts`, `src/app/actions/ai.ts`, and `src/app/api/` routes.  
**Impact:** No shared rate limiting, cost tracking, prompt caching, or quota enforcement. AI cost can overrun silently per tenant.  
**Fix:** Create `src/lib/ai/gateway.ts` as the single Anthropic client. All AI calls go through named agent dispatch. Implement per-tenant token budget with `ai_generations` table tracking.

### 6. No Redis / BullMQ — Queue Saturation Risk
**Gap:** All queue state lives in Supabase tables polled by crons at 1-minute intervals.  
**Impact:** High-volume events (WhatsApp bursts, campaign sends) will saturate Supabase connection pool. No priority ordering means payment jobs compete with analytics jobs.  
**Fix:** Provision Redis (Upstash recommended for Vercel). Implement BullMQ workers in `src/lib/queues/` with typed queue names from `QueueName` contract.

### 7. Storefront Theme Saves to localStorage Only
**Gap:** `storefronts.store_schema` JSONB column exists in Supabase but the storefront editor saves theme changes to `localStorage` only.  
**Impact:** Theme changes are not persisted cross-device. Storefront publishes do not reflect editor state.  
**Fix:** Wire the storefront editor save action to `UPDATE storefronts SET store_schema = $1 WHERE id = $2` via a server action. Emit `store.schema_updated` event on save.

### 8. Three Parallel Observability Systems
**Gap:** `src/lib/observability/` contains `logger`, `trackEvent`, and `logApiEvent` as independent systems with no correlation.  
**Impact:** Debugging a failed payment requires searching three separate log streams with no shared `correlationId`. SLA measurement is impossible.  
**Fix:** Implement `ObservabilityBus` in `src/lib/observability/` that all three systems delegate to. Enforce `correlationId` and `traceId` on every emission. Consolidate to structured JSON.

---

## Architectural Decisions

### 1. Supabase as Source of Truth (Not n8n)
All business state — orders, creators, products, automation events, workflow definitions — lives in Supabase Postgres with RLS. n8n is a thin orchestration layer that calls Lummy APIs; it never reads from Supabase directly. This ensures data integrity, auditability, and security boundary enforcement regardless of n8n availability.

### 2. BullMQ Over Supabase Queue for Real-Time Jobs
Supabase-as-queue works for low-volume polling but fails at sub-second latency, priority queuing, and backpressure. BullMQ on Redis (Upstash) provides: job priorities 1–10, delayed execution, concurrency control per queue, built-in retry with exponential backoff, and a web UI for monitoring. Supabase tables remain the audit log; Redis is the execution plane.

### 3. Single AI Gateway with Named Agents Pattern
A single `gateway.ts` dispatches all AI calls through named agent personalities (`adaeze`, `ngozi`, `chidi`, `emeka`, `taiwo`, `amara`). Each agent has a fixed system prompt registered in the gateway. Benefits: shared rate limiting, per-tenant cost budgets, prompt cache hit tracking, provider fallback (Anthropic → OpenAI), and consistent brand voice across all AI-generated content.

### 4. Observability Bus Consolidating Three Parallel Systems
`logger`, `trackEvent`, and `logApiEvent` are consolidated into a single `ObservabilityBus` that emits `ObservabilityEvent` structs. All emissions include `correlationId`, `traceId`, `tenantId`, and `durationMs`. The bus fans out to: structured stdout (Vercel), Supabase `observability_events` table (short-term hot store), and optional third-party sink. No more three-stream debugging.

### 5. n8n as Thin Orchestration Only
n8n handles: external SaaS integrations (Slack notifications, Google Sheets exports), low-code flows for marketing team, scheduled campaign triggers. It does not contain business logic. All state mutations go through the Automation SDK's typed API. This keeps n8n replaceable and the codebase auditable by engineers without n8n access.

---

## Named AI Agents

| Agent | Role | Capabilities | Primary Queue |
|-------|------|--------------|---------------|
| **Adaeze** | Commerce Strategist | Pricing suggestions, storefront optimization, product descriptions, conversion analysis | `ai-jobs` |
| **Ngozi** | Content Creator | Social media captions, WhatsApp copy, campaign creatives, CTA generation | `ai-jobs` |
| **Chidi** | Analytics & Insights | Weekly digest generation, metrics narrative, cohort analysis, market intelligence | `ai-jobs` |
| **Emeka** | Customer Relations | WhatsApp reply generation, lead qualification responses, re-engagement prompts | `whatsapp-jobs` → `ai-jobs` |
| **Taiwo** | Campaign Optimizer | Campaign performance analysis, A/B test recommendations, audience segmentation | `campaign-jobs` → `ai-jobs` |
| **Amara** | Onboarding Guide | AI interview during onboarding (Step 3), storefront starter suggestions, niche positioning | `onboarding-jobs` → `ai-jobs` |

All agents share the same Anthropic client via the AI gateway. System prompts are cached (Claude prompt caching enabled for prompts > 1024 tokens). Each generation is logged to `ai_generations` with `agent`, `type`, `tokens_used`, `cost_usd`, and `latency_ms`.

---

## DB Migration Plan — Migration 041

Migration 040 (`040_runtime_foundation_reconciliation.sql`) reconciles the runtime layer. Migration 041 adds the automation execution infrastructure:

**Tables to add in migration 041:**

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `dlq_entries` | Dead-letter queue storage | `id`, `original_queue`, `job_id`, `job_type`, `payload`, `failure_reason`, `attempt_count`, `first_failed_at`, `last_failed_at`, `tenant_id`, `correlation_id`, `can_retry`, `retry_after`, `resolved_at`, `resolved_by` |
| `workflow_rollouts` | Canary rollout tracking | `id`, `workflow_id`, `version`, `status`, `target_percentage`, `current_percentage`, `started_at`, `completed_at`, `rollback_reason`, `created_by` |
| `workflow_sla_snapshots` | Hourly SLA measurements | `id`, `workflow_id`, `p50_ms`, `p95_ms`, `p99_ms`, `error_rate`, `success_rate`, `sample_count`, `window_start`, `window_end` |
| `notification_log` | Delivery receipts for all channels | `id`, `channel`, `to`, `template`, `tenant_id`, `creator_id`, `idempotency_key`, `status`, `provider_message_id`, `attempted_at`, `delivered_at`, `failure_reason` |
| `observability_events` | Short-term hot store (30d retention) | `id`, `level`, `service`, `operation`, `tenant_id`, `creator_id`, `correlation_id`, `trace_id`, `duration_ms`, `status_code`, `error`, `metadata`, `timestamp` |

**Columns to add to existing tables:**

| Table | Columns to Add |
|-------|---------------|
| `automation_events` | `retry_count INT DEFAULT 0`, `last_error TEXT`, `correlation_id UUID`, `trace_id UUID`, `max_retries INT DEFAULT 3` |
| `ai_generations` | `agent VARCHAR(32)`, `cost_usd NUMERIC(10,6)`, `latency_ms INT`, `cache_read_tokens INT`, `cache_write_tokens INT` |

**Already covered by migrations 001–040:**
- `automation_events` — migration 003/003_runtime_automation_foundation.sql
- `provider_webhook_events` (idempotency) — migration 031
- `ai_generations` — migration 007_intelligence_analytics_ai.sql
- `whatsapp_recovery_events` — migration 033
- `conversion_recovery_queue` — migration 032
- `creator_metrics_daily` — migration 007
- `onboarding_states` — migration 030
- `workflow_definitions` — migration 029/Phase 10 foundation

---

## File Structure

Files marked NEW are to be created. Files marked EXISTING are to be enhanced.

```
src/
  contracts/
    index.ts              ← COMPLETE: all shared type contracts (Phase 1)

  lib/
    ai/
      gateway.ts          ← NEW: centralized Anthropic client, named agent dispatch,
      │                          cost tracking, prompt caching, provider fallback
      agents/
        adaeze.ts         ← NEW: Commerce Strategist system prompt + capabilities
        ngozi.ts          ← NEW: Content Creator system prompt + capabilities
        chidi.ts          ← NEW: Analytics & Insights system prompt + capabilities
        emeka.ts          ← NEW: Customer Relations system prompt + capabilities
        taiwo.ts          ← NEW: Campaign Optimizer system prompt + capabilities
        amara.ts          ← NEW: Onboarding Guide system prompt + capabilities
      commerce.ts         ← EXISTING: refactor to use gateway.ts
      conversion.ts       ← EXISTING: refactor to use gateway.ts

    events/
      fabric.ts           ← NEW: enhanced event fabric with idempotency, fan-out,
                                  correlation ID propagation, observability emission

    queues/
      index.ts            ← NEW: BullMQ queue registry, typed job enqueue helpers
      workers/
        ai-worker.ts      ← NEW: BullMQ worker for ai-jobs queue
        whatsapp-worker.ts← NEW: BullMQ worker for whatsapp-jobs queue
        email-worker.ts   ← NEW: BullMQ worker for email-jobs queue
        payment-worker.ts ← NEW: BullMQ worker for payment-jobs queue
        campaign-worker.ts← NEW: BullMQ worker for campaign-jobs queue
      dlq.ts              ← NEW: DLQ ingestion, retry, and escalation logic

    automation/
      events.ts           ← EXISTING: AutomationEventName (12 events, keep for compat)
      triggers.ts         ← EXISTING: enhance with idempotency guard + correlation IDs
      handlers.ts         ← EXISTING: add retry counter + DLQ routing on max-retry
      sdk.ts              ← NEW: Automation SDK primitives (enqueueJob, scheduleJob,
                                  cancelJob, retryFromDLQ, emitEvent, registerWorkflow)

    notifications/
      email.ts            ← NEW: Resend email runtime (welcome, order confirm, cart)
      in-app.ts           ← EXISTING: enhance with correlation ID + delivery log
      runtime.ts          ← NEW: unified NotificationRuntime with channel routing
                                  and fallback chain

    whatsapp/
      send.ts             ← NEW: WhatsApp Business Cloud API outbound dispatch
                                  (sendTextMessage, sendTemplateMessage,
                                   sendOrderConfirmation, sendCheckoutLink,
                                   sendReengagementMessage)
      inbox.ts            ← EXISTING: inbound parsing (keep as-is)

    security/
      trust.ts            ← NEW: enhanced security runtime (replay detection,
                                  prompt injection heuristics, Redis rate limits,
                                  security event emission)

    observability/
      bus.ts              ← NEW: unified ObservabilityBus consolidating logger,
                                  trackEvent, logApiEvent
      events.ts           ← EXISTING: retain for existing callers, delegate to bus.ts

  app/
    (dashboard)/
      dashboard/
        ops/              ← EXISTING: enhance to Mission Control
          page.tsx        ← EXISTING: add queue depths, DLQ browser, workflow grid
          dlq/
            page.tsx      ← NEW: DLQ viewer with manual retry controls
          workflows/
            page.tsx      ← NEW: workflow health grid + rollout controls
          sla/
            page.tsx      ← NEW: SLA dashboards per workflow
          costs/
            page.tsx      ← NEW: per-tenant AI cost breakdown

    api/
      runtime/
        dlq/
          route.ts        ← EXISTING stub: implement real DLQ API (Phase 13)
        queues/
          route.ts        ← NEW: queue depth + job status API
        workflows/
          route.ts        ← NEW: workflow registration + status API
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Redis (Upstash) unavailable during job burst | Low | High | BullMQ graceful degradation: fall back to Supabase `automation_events` table polling. Circuit breaker in `src/lib/queues/index.ts` detects Redis connectivity and switches queue backend automatically. Alert via observability bus on fallback activation. |
| WhatsApp Cloud API rate limits (1,000 msgs/day on free tier) | Medium | High | Enqueue all outbound messages via `whatsapp-jobs` BullMQ queue with rate limiter (max 14 msgs/min = 1000/day with headroom). Implement template message pre-approval workflow. Monitor delivery receipts and pause queue on 429 response. Upgrade to Business tier at 500 DAU. |
| AI cost overrun per tenant | Medium | Medium | Per-tenant token budget enforced in AI gateway before dispatch. Budget tracked in `ai_generations` table aggregated daily. Mission Control cost dashboard with configurable alerts at 80% and 100% of monthly budget. Hard cap returns cached fallback response on budget exceeded. |
| Supabase queue table saturation (automation_events) | Medium | High | Migration 041 adds `retry_count` and `max_retries` to prevent infinite loops. BullMQ adoption (Phase 4) moves high-volume jobs off the Supabase table. Retain Supabase queue only for low-frequency lifecycle events. Add database index on `processed = false AND retry_count < max_retries` to prevent full table scans. |
| n8n workflow drift from Lummy schema | Low | Medium | n8n connects only via Lummy's typed Automation SDK API, never directly to Supabase. Schema changes to Lummy API are versioned. n8n webhook endpoints are versioned (`/api/v1/automation/...`). Integration tests in CI verify n8n trigger payloads against Zod schemas. |
| Prompt injection via WhatsApp messages | Medium | High | Emeka agent (Customer Relations) applies prompt injection heuristics in `src/lib/security/trust.ts` before any user-supplied text is included in an AI prompt. Suspicious patterns emit `security.suspicious_activity` event. Content is escaped and bracketed in the system prompt context window, never interpolated raw. |
| Anthropic API downtime during peak commerce hours | Low | High | AI gateway implements provider fallback: Anthropic → OpenAI (gpt-4o-mini for non-critical) → cached last-good response for idempotent generation types (captions, descriptions). Payment and order confirmation flows never depend on AI generation — they complete regardless of AI availability. |
| Migration 041 conflicts with existing schema | Low | High | Run `supabase db diff` before applying. All new tables use `IF NOT EXISTS`. Column additions use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Test migration on staging Supabase project before production push. |
