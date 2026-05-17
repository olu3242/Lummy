# Runtime Contract Governance + Event Consistency

## 1. Runtime Contract Audit

### Event topology
- Queue orchestration uses `JobEnvelope` in `runtime-orchestrator`.
- Replay control uses `ReplayService` metadata gateway.
- Payment webhook ingestion uses `WebhookReplayService` + provider signature verification.
- AI execution uses `AIExecutionInput`/`AIExecutionResult` through provider router.
- Telemetry ingestion uses `TelemetryEvent` persisted to SQL sink.

### Replay compatibility analysis
- Pre-hardening risk: replay metadata existed but was not version-governed.
- Hardening: replay request version introduced and validated.
- Remaining gap: adapter-level replay persistence/audit store still minimal.

### Contract drift analysis
- High drift prior risk: runtime envelopes and provider payloads were not uniformly versioned.
- Hardening: added schema version checks for queue envelope, replay request, AI execution input/output, and payment webhook event envelope.

### Schema consistency analysis
- Core runtime schemas now explicitly encode version fields where hardened in this phase.
- Deterministic required-field validation added at execution boundary.

---

## 2. Event Governance Framework

- Queue events: versioned envelope with boundary assertion before execution.
- Replay events: versioned replay request + mandatory metadata (actor, reason, correlation).
- Worker/orchestration events: structured logs and queue snapshots retained from prior hardening.
- Webhook events: canonical payment webhook event envelope with schema version.

---

## 3. Replay Consistency Framework

Replay must preserve:
1. `jobId`
2. `idempotencyKey`
3. `tenant/org context`
4. `correlationId`
5. schema version compatibility

Enforcement in this phase:
- Replay request schema version validation.
- Required replay metadata validation.
- Queue envelope schema assertion at execution boundary.

---

## 4. AI + Payment Contract Governance

### AI
- Input contract now versioned (`AIExecutionInput.version`).
- Output contract now versioned (`AIExecutionResult.version`).
- Executor now validates output version before persistence.

### Payments
- Webhook ingestion now canonicalizes into a versioned `PaymentWebhookEventEnvelope`.
- Insert payload includes `schema_version` and normalized idempotency key.

---

## 5. Runtime Schema Versioning Framework

Schema governance policy:
- Additive evolution only within same major version.
- Replay compatibility requires explicit migrator for major changes.
- Execution boundaries must assert supported versions.

Compatibility strategy:
- Boundary assertions fail fast on unsupported schema versions.
- Version field must be persisted with key operational events/logs.

---

## 6. Contract Validation Framework

Validation points enforced:
- Queue execution boundary: required fields + schema version.
- Replay request boundary: version + metadata integrity.
- AI execution boundary: output version integrity.
- Webhook ingestion boundary: identifier completeness + canonical envelope + schema version.

---

## 7. Exact Contract-Governance Modifications

1. Added `packages/runtime-orchestrator/src/contracts/schema.ts` with `JOB_ENVELOPE_VERSION` and `assertJobEnvelope`.
2. Updated coordinator to validate queue payload schema before handler execution.
3. Updated replay service to require `version` and enforce supported replay request version.
4. Versioned AI execution contracts (`AIExecutionInput`, `AIExecutionResult`) and enforced output version in run executor.
5. Added payment webhook contract envelope at `packages/payments/src/contracts/webhook.ts`.
6. Updated webhook ingestion to persist canonical envelope with `schema_version`.

---

## 8. Operational Risk Analysis

### Replay corruption risks
- Reduced by version-gated replay requests and envelope assertions.
- Remaining risk: non-durable adapter replay trails.

### Schema drift risks
- Reduced by explicit versioning and boundary validation.
- Remaining risk: packages not yet migrated to versioned runtime envelopes.

### Provider compatibility risks
- AI/provider and payment/provider contracts now more deterministic, but provider-specific raw fields remain heterogeneous.

### Runtime fragmentation risks
- Lowered through canonical webhook envelope and queue/AI contract checks.

---

## 9. Contract Readiness Scorecard

| Dimension | Score / 10 | Notes |
|---|---:|---|
| Replay determinism | 6 | Metadata+version checks present; durable replay store still limited |
| Contract consistency | 6 | Core hardened paths versioned; broader package surface pending |
| Schema governance | 6 | Version policy and boundary checks established |
| Operational auditability | 6 | Structured logs + correlation + schema versions improved |
| Runtime interoperability | 5 | Contract portability improved; provider/runtime adapters still partial |

## Certification status
- **Partially certified for controlled runtime hardening stage**.
- **Not fully certified for enterprise-wide deterministic replay** until durable replay adapters and broader package-wide schema versioning are completed.
