# Alpha Readiness Framework

## Required Gates

- Payment reliability: checkout initialization, webhook verification, transaction normalization, reconciliation, and refunds must route through the canonical provider contract.
- Webhook integrity: every webhook must carry a provider-specific signature, idempotency key, normalized transaction, and correlation ID.
- Queue durability: event and automation queues must support retry, DLQ routing, worker heartbeat visibility, and replay diagnostics.
- Realtime consistency: commerce events, order transitions, and operational timeline writes must be persisted before realtime feeds are trusted.
- AI runtime stability: AI execution requires a configured live provider, structured output validation, token/cost governance, telemetry, and prompt version metadata.
- Automation replay safety: automation jobs must include idempotency keys, correlation IDs, attempts, timeout, cancellation checks, and DLQ fallback.

## Launch Checklist

- Run `pnpm install`.
- Run `pnpm run typecheck`.
- Run `pnpm run lint`.
- Run `pnpm run build`.
- Run `node scripts/operational-validation/final-hardening-check.mjs`.
- Apply Supabase migrations through `039_final_operational_hardening.sql`.
- Call `/api/runtime/launch-readiness` and require `ready: true`.
- Verify one live provider path for each enabled payment provider before inviting creators.
- Verify one live AI execution with either OpenAI or Anthropic configured before enabling AI copilots.

## Incident Workflow

- Freeze new creator onboarding.
- Capture correlation IDs from affected checkout, webhook, automation, or AI execution logs.
- Inspect `dead_letter_events`, `commerce_workflow_failures`, `automation_runtime_executions`, `ai_provider_failures`, and `payment_provider_events`.
- Replay only idempotent events with known idempotency keys.
- If provider integrity is uncertain, disable the affected provider at the routing layer and keep unaffected providers live.

## Rollback Procedure

- Revert the application deployment to the last green build.
- Do not delete operational event tables during rollback.
- Preserve DLQ, payment, AI, and automation telemetry for reconciliation.
- Resume queues only after duplicate transaction and replay checks pass.
