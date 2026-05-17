# Lummy Consolidation Sprint 2+3 — Durable Runtime Fabric & Observability Hardening

Date: 2026-05-15
Scope: code-verified runtime/queue/worker/telemetry hardening.

## Runtime Fabric Audit
- Queue runtime currently remains process-local (in-memory queue service by default in worker runtime).
- Retry and DLQ routing exists in `ExecutionCoordinator` with explicit per-queue mapping.
- Replay API exists (`replay/service.ts`) and in-memory durable broker supports `replay` state transitions.
- Worker lifecycle is driven by `tickAllQueues` over `MANDATORY_QUEUES`.

## Critical Runtime Risks
### CRITICAL
- Queue durability is not backed by Redis/BullMQ persistence in active worker runtime.
### HIGH
- Prior worker bootstrap bug: automation handler queue instance could diverge from worker queue instance.
### MEDIUM
- Metrics existed as traces only; lacked direct counters for retries/dead letters.
### LOW
- Structured failure metadata in retry/DLQ payloads was not normalized.

## Modifications Implemented
1. Fixed worker queue wiring in `apps/workers/src/main.ts`:
   - single worker runtime instance now owns queue + handlers.
   - automation handler now receives the same queue instance as execution runtime.
2. Added handler registration API in `apps/workers/src/runtime/worker.ts`:
   - `registerHandler(queueName, handler)` for deterministic bootstrap wiring.
3. Hardened retry/DLQ metadata + monitor diagnostics in `packages/runtime-orchestrator/src/execution/coordinator.ts`:
   - retry payload now captures `lastError`, timestamp, and `backoffMs`.
   - DLQ payload now captures normalized failure metadata (`error`, queue, correlation).
   - monitor events now include correlation/attempt/latency details.
4. Added runtime counters in `packages/runtime-orchestrator/src/monitoring/service.ts`:
   - started/completed/retried/dead-lettered counters exposed via `metrics()`.

## DLQ + Replay Architecture (Current)
- DLQ strategy: queue-specific DLQs via `DLQ_QUEUE` mapping.
- Replay strategy: explicit `ReplayService.replay(jobId, queue)` and `RecoveryService.replayFromDlq`.
- Retry strategy: deterministic exponential backoff via `RetryService.nextBackoffMs` and attempt cap (`maxAttempts`).
- Failure isolation: poisoned jobs redirected to mapped DLQ with failure metadata.

## Idempotency Audit
- Runtime idempotency utility exists (`idempotency/service.ts`) but not universally enforced across all handlers.
- Payment webhook path has replay check keyed by tenant + idempotency key, but provider signature verification remains simplistic.
- Immediate remediation:
  1. enforce idempotency gate in execution coordinator before handler invocation,
  2. persist idempotency result in durable store,
  3. add per-domain idempotency key schema contract.

## Worker Coordination Audit
- Lock-based queue tick orchestration exists.
- Graceful-shutdown module exists in worker app scaffold.
- Remaining gap: lock/lease state is in-memory, so crash recovery is non-durable.

## Event Contract Governance
- `@lummy/shared-types` remains canonical for event envelope and tenant context.
- Retry and DLQ failure metadata now normalized in coordinator payload writes.

## Observability Audit
- Full OpenTelemetry/Sentry/PostHog instrumentation is not present in active runtime path.
- Added immediate observability hooks:
  - structured event details in monitor traces,
  - lifecycle counters via `WorkerMonitorService.metrics()`,
  - latency visibility for job completion.

## Rollback Considerations
- Worker bootstrap changes are isolated to worker runtime init; rollback = revert `apps/workers/src/main.ts` and `runtime/worker.ts` changes.
- Coordinator payload shape changes affect downstream consumers expecting old payload shape; rollback requires reverting coordinator patch.
- Monitor counters are additive and backward-compatible; safe to keep even if other changes roll back.
