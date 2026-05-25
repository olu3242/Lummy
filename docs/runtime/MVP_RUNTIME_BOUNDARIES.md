# MVP Runtime Boundaries

Defines what is in-scope and out-of-scope for the Lummy MVP runtime.

## In Scope (Operational)

### Event Bus
- `automation_events` table with full lifecycle (pending → completed/dead_letter)
- Vercel Cron processor running every 2 minutes
- 8 registered workflow IDs (WA-01, WA-02, WA-04, PAY-01, PAY-02, AM-01, CH-01, OB-01)
- 4 additional workflows (PAY-03, STO-01, PRD-01, CHK-01) added in migration 046

### Event Types (AutomationEventName)
All 19 event types are registered and handled:
- Commerce: `order_created`, `payment_received`, `payment_failed`, `payment_timeout`
- Store: `storefront_published`, `storefront_unpublished`, `store_schema_updated`
- Product: `product_created`, `first_sale_completed`
- Creator lifecycle: `onboarding_completed`, `creator_inactive_7d`, `creator_inactive_30d`
- Engagement: `whatsapp_message_received`, `weekly_digest_requested`, `low_product_count`
- AI: `ai_generation_completed`
- Checkout: `checkout_started`, `checkout_abandoned`
- CRM: `lead_scored`

### Payment Runtime
- Paystack webhook: `charge.success`, `charge.failed`
- Stripe webhook: `checkout.session.completed`, `payment_intent.payment_failed`
- Idempotency via `provider_webhook_events` table
- Automation events emitted for both success and failure paths

### Notifications
- In-app notifications (creator dashboard)
- Email notifications (creator + customer receipts)
- WhatsApp template messages

### AI Runtime
- 6 named agents (adaeze, ngozi, chidi, emeka, taiwo, amara)
- Budget enforcement (hard cap + alert threshold)
- Cost tracking (`ai_cost_events`, `ai_usage_budgets`)
- Audit log (`ai_generations`)

## Out of Scope for MVP

### BullMQ / Redis Workers
Files exist in `src/lib/queues/workers/` but have no entry point and no Redis connection. These are dormant. The Vercel Cron path covers all P0 automation workflows.

**Activation path**: Wire a Redis URL, add `startWorkers()` entry point to a long-running process or Vercel Background Function. Not needed for MVP.

### Real-time Streaming AI
The AI gateway uses request-response only. Streaming responses are not wired to any UI.

### Multi-tenant Workflow Isolation
All automation runs in a single processor job. Per-tenant queue isolation (queue_name column exists in workflow_registry) is not enforced at MVP — all events share the same processing pool.

### Rollout Percentage (rollout_pct)
`workflow_registry.rollout_pct` column exists but is not consumed by the processor. All active workflows run for all creators.

### Payout Initiation Automation
`payout.initiated` and `payout.completed` events exist in design documents but are not yet registered as `AutomationEventName` entries. Manual payout flows via Paystack dashboard.

## P0 Risk Mitigations

| Risk | Mitigation |
|---|---|
| BullMQ workers dormant | Cron processor runs every 2min, covers all P0 workflows |
| Registry trigger mismatch | Migration 046 fixes all dot→underscore names |
| Double-processing | Optimistic lock: `processing=false` check on UPDATE |
| Stuck events | Self-healing job every 5min resets processing>5min locks |
| Budget overrun | AI gateway hard cap enforcement, best-effort non-blocking |
| Webhook replay | `provider_webhook_events` idempotency deduplication |
