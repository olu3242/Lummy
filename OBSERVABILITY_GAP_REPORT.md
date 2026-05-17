# Observability Gap Report

## Current Coverage

- API routes use `getCorrelationId`, `logApiEvent`, and `errorResponse` in the newer runtime/payment/AI flows.
- Runtime orchestration emits structured events through `logRuntime`.
- AI provider routing logs success/failure with provider, tenant, correlation ID, token usage, and latency.
- Launch readiness and metrics endpoints expose deployment health and correlation headers.

## Gaps

- Some placeholder API routes still return static status payloads without correlation IDs.
- Runtime queue metrics are in-memory only; they are not yet exported to a durable telemetry sink.
- Payment webhook failures write to `messaging_failures`, which is operationally visible but semantically imprecise.
- Several UI-only dashboard flows still rely on local storage and mock-like defaults; these should not be treated as production observability.

## Recommendations

- Standardize all API route responses on `x-correlation-id`.
- Route runtime counters to the telemetry package once the durable telemetry sink is selected.
- Split payment processing failures into a payment-specific failure table or event stream.
- Add CI checks for routes that omit correlation propagation once the API surface stabilizes.
