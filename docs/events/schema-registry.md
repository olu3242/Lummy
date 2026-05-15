# Event Schema Registry

Naming convention: `domain.entity.action.v1`.

Examples:
- `commerce.order.created.v1`
- `payments.intent.failed.v1`
- `ai.workflow.executed.v1`

Every event must include tenant, trace, correlation and idempotency fields via registry envelope.
