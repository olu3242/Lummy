# Runtime + Automation Execution Layer

## Queue Topology
- `events.outbox` -> dispatch canonical events
- `events.retry` -> retry failed event dispatch with backoff
- `events.dlq` -> dead-letter unrecoverable event jobs
- `automation.execute` -> execute automation runs from triggers
- `automation.retry` -> retry automation runs
- `automation.dlq` -> dead-letter failed automation runs

## Determinism + Replay
- Every job carries: `idempotencyKey`, `correlationId`, `causationId`, `attempt`, `runAt`.
- Retry schedule uses exponential backoff (`nextBackoffMs`).
- DLQ records preserve payload and error for replay diagnostics.

## Lock Strategy
- Queue-level distributed lock key: `worker:<queueName>`
- Prevents concurrent handler contention across worker instances.

## Kill Switch
- Rollout control flags:
  - `FF_WORKER_RUNTIME_V1`
  - `FF_AUTOMATION_CORE_V1`
  - `FF_EVENTS_OUTBOX_WRITE`

## Observability Dashboard Requirements
- Queue depth by queue name
- Retry rate and median attempt count
- DLQ volume + top failure signatures
- Automation run success/failure by trigger
