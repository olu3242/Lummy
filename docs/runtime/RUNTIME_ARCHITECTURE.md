# Lummy Canonical Runtime Architecture

## Overview

Lummy's operational runtime is a single, coherent system rooted in `src/lib/` and exposed through `src/runtime/`. All automation, AI inference, payments, and notifications flow through this spine.

## Canonical Stack

```
External triggers (webhooks, crons, user actions)
       │
       ▼
automation_events table (Supabase Postgres)
  ─ status: pending → processing → completed | failed | retrying | dead_letter
  ─ columns: correlation_id, workflow_id, execution_duration_ms, status
       │
       ▼
runAutomationProcessorJob()         ← src/lib/jobs/workers.ts
  ─ Batch fetch (pending + retrying, scheduled_for ≤ now)
  ─ Optimistic lock (processing=true, status=processing)
  ─ getWorkflowByEventName() → workflow_registry (5-min cache)
  ─ processAutomationEvent() → handlers.ts
  ─ logAutomation() → automation_logs
  ─ completeSLARecord() → workflow_sla_records
  ─ DLQ after 5 attempts (status=dead_letter)
       │
       ▼
SDK Primitives                      ← src/lib/automation/sdk.ts
  ─ notifyCreator(), notifyCreatorEmail(), sendCustomerReceipt()
  ─ sendCreatorWelcome(), emitEvent(), logAutomation()
  ─ sendWhatsAppTemplate(), trackMetric()
       │
       ▼
AI Gateway                          ← src/lib/ai/gateway.ts
  ─ callAgent() / generateText()
  ─ 6 named agents: adaeze, ngozi, chidi, emeka, taiwo, amara
  ─ Budget enforcement, retry, audit log to ai_generations
```

## Canonical Entry Points

| System | Import path |
|---|---|
| Emit automation event | `import { emitEvent } from "@/lib/automation/sdk"` |
| Dispatch automation event | `import { dispatchAutomation } from "@/lib/automation/triggers"` |
| Process events (job) | `import { runAutomationProcessorJob } from "@/lib/jobs/workers"` |
| Workflow registry lookup | `import { getWorkflowByEventName } from "@/runtime/registry"` |
| AI inference | `import { callAgent } from "@/lib/ai/gateway"` |
| SLA tracking | `import { startSLARecord, completeSLARecord } from "@/lib/automation/sla"` |
| Correlation ID | `import { generateCorrelationId } from "@/lib/observability/correlation"` |
| Logger | `import { logger } from "@/lib/observability/logger"` |

Everything is also re-exported from `@/runtime` for convenience.

## Scheduler

8 Vercel Cron jobs defined in `vercel.json`:

| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/automation-processor` | `*/2 * * * *` | Core automation heartbeat |
| `/api/cron/stuck-queue-recovery` | `*/5 * * * *` | Unstick processing-locked events |
| `/api/cron/webhook-retry` | `*/10 * * * *` | Retry failed webhook deliveries |
| `/api/cron/health-scoring` | daily | Creator health score recompute |
| `/api/cron/churn-scoring` | daily | Churn risk scoring |
| `/api/cron/marketplace-intelligence` | daily | Virality + performance snapshots |
| `/api/cron/notification-cleanup` | weekly | Delete read notifications > 90d |

All cron routes use `verifyCronSecret()` from `src/lib/runtime/cron.ts`.

## Data Flow: Payment Completed

```
Paystack webhook (charge.success)
  → /api/payments/webhook
  → verifyPaystackSignature()
  → markPaymentCompleted()          (order-repository)
  → syncCustomerMemoryForOrder()
  → notifyCreator()                 (in-app notification)
  → notifyCreatorEmail()            (email to creator)
  → sendCustomerReceipt()           (email to customer)
  → emitEvent("payment_received")   (→ automation_events)
        → processor picks up → WA-04/PAY-01/PAY-02 handlers
```

## Data Flow: Payment Failed

```
Paystack webhook (charge.failed)
  → /api/payments/webhook
  → payments table: status=failed
  → emitEvent("payment_failed")     (→ automation_events)
        → processor picks up → PAY-03 handler → notify creator
```
