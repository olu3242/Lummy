# LUMMY OS — MVP + Enterprise Foundation Convergence Plan

## 1) Updated Monorepo Architecture

```text
apps/
  web/                         # Next.js product + ops command center
  workers/                     # BullMQ / runtime workers
packages/
  ui/                          # shared design system components
  core/                        # tenant context, config, shared domain primitives
  commerce/                    # products, carts, checkout, orders
  crm/                         # leads, customers, lifecycle, conversations
  payments/                    # stripe/paystack adapters, intents, payouts, webhooks
  messaging/                   # whatsapp, broadcast, notifications
  ai/                          # ai assistant, summarization, generation use-cases
  runtime-orchestrator/        # queue contracts, retries, DLQ, idempotency, replay
  workflow-engine/             # trigger/action orchestration, approvals, scheduler
  observability/               # traces, metrics, incidents, alerts
  governance/                  # RBAC, policy checks, audit logs, feature flags
  api-platform/                # public APIs, auth, keys, webhooks
  platform-sdk/                # typed client + integration helpers
  plugin-runtime/              # extension runtime and capability boundaries
supabase/
  migrations/                  # schema for core, runtime, workflows, ai, governance
```

**Architecture rule:** build product slices first (commerce/crm/messaging/payments), then runtime durability, then workflow intelligence.

## 2) MVP Feature Map (Revenue-first)

### P0 (must ship first)
- Creator onboarding and storefront setup
- Product CRUD + publish state
- Checkout (Stripe + Paystack)
- Order creation + fulfillment status
- WhatsApp customer messaging + payment/order notifications
- CRM-lite: leads, customers, last touchpoint, lifecycle stage

### P1 (immediate monetization expansion)
- Broadcast campaigns
- Abandoned cart recovery automation
- Coupons + upsells
- Referral/affiliate link tracking
- Analytics dashboard (GMV, conversion, AOV, repeat rate)

### P2 (AI-native differentiation)
- AI copywriter for product/store pages
- AI campaign suggestions
- AI automation assistant (workflow templates)

## 3) Runtime Topology

- `apps/workers` boots queue consumers and shared runtime services.
- `packages/runtime-orchestrator` exposes queue/job contracts, retry policy, idempotency and replay hooks.
- Redis/BullMQ acts as durable queue backend.
- Postgres stores outbox/events, job metadata, and execution history.
- Web app emits commands/events; workers consume and execute.

Flow:
1. API route writes business record + outbox event in one transaction.
2. Outbox dispatcher enqueues durable job in BullMQ.
3. Worker executes action with idempotency key.
4. Success/failure events persisted with trace IDs.
5. Retry policy or DLQ path triggered automatically.

## 4) Workflow Architecture

Workflow engine components:
- **Trigger registry** (event trigger, schedule trigger, manual trigger)
- **Action registry** (send message, update CRM stage, create coupon, run AI task)
- **Execution coordinator** (step state machine + compensation/retry)
- **Approval gate** (org policies for risky actions)
- **History store** (workflow_runs + step logs)

MVP workflow templates:
- Abandoned cart recovery
- New lead nurture
- Post-purchase upsell
- Win-back inactive customer

## 5) Queue Lifecycle

1. **Queued**: job created with tenant_id, trace_id, idempotency_key.
2. **Leased**: worker claims execution lock with TTL.
3. **Running**: handler executes business action.
4. **Completed**: result persisted + telemetry emitted.
5. **Failed (retryable)**: exponential backoff + attempt increment.
6. **Failed (terminal)**: moved to DLQ with reason payload.
7. **Replay**: operator requeues DLQ job after remediation.

## 6) Observability Architecture

- OpenTelemetry tracing across API -> queue -> worker.
- Metrics emitted per tenant and per workflow:
  - queue depth
  - success/failure rate
  - p95 execution latency
  - retry count
  - DLQ volume
- Incident model:
  - rule-based alerts (queue stall, rising failures)
  - incident timeline + linked traces
- Command center (`/ops`) consumes these metrics for live operational views.

## 7) AI Orchestration Architecture

- Provider abstraction in `packages/ai` (OpenAI first, extensible adapters).
- Prompt registry with versioned prompts and safety metadata.
- AI execution log table for cost, latency, outcome, tenant ownership.
- AI features shipped in MVP scope:
  - storefront/product copy generation
  - campaign copy generation
  - concise analytics summary
  - workflow suggestion assistant

## 8) Governance Architecture

- Tenant isolation through mandatory `tenant_id` scoping.
- RBAC roles: owner, admin, operator, analyst, support.
- Policy checks before sensitive workflow/payment/admin actions.
- Audit logs for:
  - role changes
  - policy changes
  - manual replays / DLQ operations
  - AI approval overrides
- Feature flags for staged rollout by tenant cohort.

## 9) API Ecosystem Architecture

- API platform exposes stable versioned endpoints (`/api/v1`).
- Access model: org-scoped API keys + webhook signatures.
- Initial ecosystem surface:
  - orders
  - products
  - customers
  - events webhooks
  - workflow triggers
- SDK provides typed clients and webhook verification utilities.
- Plugin runtime enables controlled extension points (workflow actions, post-order hooks).

## 10) Incremental Implementation Roadmap

### Sprint 1 (2 weeks): Commerce MVP Core
- storefront/product/order schema hardening
- checkout + webhook ingestion (Stripe/Paystack)
- CRM lead/customer entities
- baseline dashboard metrics

### Sprint 2 (2 weeks): Messaging + Automation P0
- WhatsApp messaging adapter
- outbox + BullMQ durable queue integration
- abandoned cart + broadcast workflows
- retries, DLQ, replay console (basic)

### Sprint 3 (2 weeks): Command Center + AI P1
- `/ops/runtime`, `/ops/workflows`, `/ops/incidents`
- telemetry dashboards + alert rules
- AI copywriter + analytics summaries

### Sprint 4 (2 weeks): Governance + Ecosystem P1
- RBAC/policies/audit log enforcement
- public API v1 + webhooks
- minimal SDK and extension hooks

## Execution Guardrails

- No speculative package sprawl without an owning feature slice.
- Every new package must map to an active sprint deliverable.
- Runtime correctness > feature volume.
- Each sprint ends with demoable, deployable capabilities.
