# Agent Orchestrator Foundation

## Agent Interaction Model
EVENTS -> ORCHESTRATOR -> ROUTING -> EXECUTION -> VALIDATION -> TELEMETRY -> RECOVERY

## Mandatory Agent Types
- ARCH, SECURITY, ORCHESTRATOR, EXECUTION, AUTOMATION, AI, TELEMETRY,
  GOVERNANCE, VALIDATION, RECOVERY, TRUST, PAYMENT, COMMUNICATION, ANALYTICS

## Queue Topology
- events.outbox
- events.retry
- events.dlq
- automation.execute
- automation.retry
- automation.dlq

## Worker Integration Points
- Outbox dispatcher handler
- Automation execution handler
- Agent execution hook (next phase: bind runtime queue to AgentExecutionService)

## Feature Flag Rollout
- `FF_PLATFORM_CORE_V1`
- `FF_REPOSITORY_LAYER_V1`
- `FF_EVENTS_OUTBOX_WRITE`
- `FF_TELEMETRY_V1`
- `FF_WORKER_RUNTIME_V1`
- `FF_AUTOMATION_CORE_V1`
- `FF_AGENT_ORCHESTRATOR_V1`

## Rollback
- Disable orchestrator/automation flags
- Pause workers for `events.*` and `automation.*`
- Replay from outbox/events by idempotency key
