# Foundation + Events + Telemetry Integration Points

## Worker Integration Points
- `events.outbox`: read `outbox_events` where `dispatched_at IS NULL`, publish to `events`.
- `events.retry`: retry failed dispatches with backoff.
- `events.dlq`: park permanently failed dispatches and emit incident alerts.
- `telemetry.flush`: optional batching sink for high-volume telemetry.

## Feature Flags
- `FF_PLATFORM_CORE_V1`
- `FF_REPOSITORY_LAYER_V1`
- `FF_EVENTS_OUTBOX_WRITE`
- `FF_TELEMETRY_V1`

## Acceptance Test Matrix
- Repository tenant mismatch rejection.
- Mutation emits outbox event with correlation/causation/idempotency.
- Duplicate idempotency key rejected by unique constraint.
- RLS read isolation across tenants.
- Replay safety on `events` + `telemetry_logs` unique keys.
