# Lummy Sovereign Runtime Architecture + Platform Independence

## 1) Sovereign Runtime Audit

### Vendor dependency graph (code-verified)
- **AI execution**: `packages/ai-engine` routes by provider string and supports fallback routing order; currently uses provider adapters behind `ProviderRouter`. Vendor-specific selection is runtime string-driven, not contract-versioned.  
- **Payments**: `packages/payments` includes provider adapter contracts + webhook signature verification helper + replay ingestion/reconciliation services; app-level billing providers include Stripe and Paystack stubs.  
- **Queue/runtime orchestration**: `packages/runtime-orchestrator` currently relies on in-memory queue/lock implementations in worker runtime; durable providers are placeholder exports only.  
- **Database**: Supabase is the active integration path in `src/lib/supabase/*`; server/browser/admin client factories are directly bound to Supabase env vars.  
- **Telemetry**: `packages/telemetry` currently persists events via SQL sink (`telemetry_logs` table path), with no second sink configured.  
- **Auth**: runtime auth checks are Supabase-auth dependent (`requireUser`).

### Runtime lock-in map
- **High lock-in**: Supabase DB/auth, in-memory queue runtime (no deployable durable backend), single telemetry sink pattern.
- **Medium lock-in**: AI provider routing exists, but policy/governance for provider portability is incomplete.
- **Medium lock-in**: payment provider portability present at contract layer, but failover orchestration and normalized provider event contract are incomplete.

### Provider concentration analysis
- DB/Auth concentration: **single-vendor**.
- Queue durability concentration: **single in-memory implementation** (non-production).
- Telemetry concentration: **single SQL sink path**.
- AI provider concentration: **potentially multi-provider**, but routing observability and deterministic replay semantics still incomplete.
- Payment concentration: **dual provider scaffolding**, but operational failover governance incomplete.

### Portability analysis summary
- Portability strongest in contract intent, weakest in runtime deployability and deterministic migration mechanics.

---

## 2) Runtime Portability Framework

### Queue portability
- Canonical queue contract remains `JobEnvelope` and queue adapter contract in runtime-orchestrator.
- Introduce **provider capability matrix** (lease semantics, delayed delivery, ack/nack guarantees, ordering mode).
- Replay safety requirement: preserve `jobId`, `idempotencyKey`, `correlationId`, `attempt`, `replayCount` across provider migration snapshots.

### Replay portability
- Replay requests must require metadata (`actor`, `reason`, `correlationId`) and emit audit trails.
- Migration runbook must support **replay freeze window** and **source→target parity verification** before write cutover.

### AI provider portability
- Maintain provider-neutral execution schema (`prompt`, `model`, `maxTokens`, `metadata`).
- Add provider-agnostic outcome envelope (`latency`, `token totals`, `finish reason`, `retry cause`).

### Payment portability
- Normalize provider webhook events into canonical payment event contract before reconciliation.
- Require idempotency-key canonicalization and provider-event dedupe keys.

### Telemetry portability
- Standardize event schema at source; sinks are adapters.
- Avoid sink-specific fields in runtime event producers.

---

## 3) AI + Payment Sovereignty Architecture

### AI sovereignty controls
1. Provider routing policy per tenant/workload class.
2. Deterministic fallback ordering with retry budget and timeout class.
3. Replay-safe run record includes provider sequence attempted.
4. Portable token accounting fields in `ai_runs` + diagnostic logs.

### Payment sovereignty controls
1. Canonical webhook event normalization layer.
2. Provider failover playbook for checkout + reconciliation continuity.
3. Replay-safe settlement dedupe keys (`settlement_key`, normalized webhook idempotency key).
4. Payout provider portability via provider capability flags.

---

## 4) Multi-Cloud + Runtime Resilience Framework

- Treat workload runtime as portable process package with externalized state contracts.
- Required precondition for multi-cloud: durable queue backend and externalized lock/lease implementation.
- Deployment portability baseline:
  - env contract manifest
  - deterministic build artifact policy
  - secret key namespace contract independent of vendor naming.

---

## 5) Governance Continuity Framework

- Governance events must remain independent of telemetry sink vendor.
- Minimum audit set for every critical flow:
  - correlationId
  - actor/system identity
  - decision reason code
  - replay metadata
  - provider metadata
- Enforce immutable audit envelope before sink fanout.

---

## 6) Long-Term Sustainability Forecast

### Risk scoring (1 low risk → 5 high risk)
- DB/Auth concentration risk: **5**
- Queue durability concentration risk: **5**
- AI cost concentration risk: **4**
- Payment concentration risk: **3**
- Telemetry concentration risk: **4**
- Migration operational pressure: **4**

### Survivability pressure points
- Vendor policy shifts in AI or auth can produce immediate runtime disruption without portability controls.
- Lack of durable queue backend is largest blocker to operational sovereignty.

---

## 7) Exact Sovereignty Modifications (this phase)

1. Break TypeScript project-reference cycles by removing non-required references:
   - `packages/shared-types/tsconfig.json` no longer references `platform-core`.
   - `packages/db-core/tsconfig.json` no longer references `platform-core`.
2. Preserve replay and observability hardening from prior pass as sovereignty preconditions:
   - replay metadata enforcement
   - structured runtime logs
   - queue depth snapshots
   - AI provider diagnostics
   - webhook idempotency normalization.

---

## 8) Operational Risk Analysis

### Top vendor concentration risks
- Single-vendor auth+db pathway.
- Non-durable runtime queue path.

### Replay migration risks
- Missing durable queue snapshot semantics can cause attempt counters or lease state drift.
- Missing multi-sink immutable audit envelope can fragment incident evidence.

### Portability gaps
- No production Redis/queue provider wiring.
- No formal provider capability registry for AI/payment/queue.

### Observability fragmentation risks
- Sink-coupled telemetry expansion can fork schema semantics.

---

## 9) Sovereignty Readiness Scorecard

| Category | Score / 10 | Status |
|---|---:|---|
| Provider independence | 4 | Partial contracts, limited runtime portability |
| Replay portability | 5 | Metadata guardrails present, migration mechanics incomplete |
| Operational portability | 3 | Queue/runtime still non-durable |
| Governance continuity | 5 | Baseline controls present, sink portability incomplete |
| Long-term sustainability | 4 | Concentration risks measurable but not yet mitigated |

## Certification verdict
- **Current phase verdict**: foundationally measurable, **not yet sovereignty-certified for production**.
- **Primary blocker**: durable queue/runtime provider path with deterministic migration tooling.
