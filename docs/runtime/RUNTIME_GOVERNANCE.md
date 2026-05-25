# Runtime Governance

## Canonical Runtime Rules

These rules are binding. Violations introduce split-brain state and dual-processing bugs.

### 1. Single AI Client

All AI inference routes through `src/lib/ai/gateway.ts`. `callAgent()` is the only permitted Anthropic API caller. Never instantiate `new Anthropic()` outside this file.

### 2. Single Event Bus

All automation events must be emitted via `emitEvent()` from `src/lib/automation/sdk.ts` or `dispatchAutomation()` from `src/lib/automation/triggers.ts`. Never write directly to `automation_events` from application code.

### 3. Single Processor

The only automation event processor is `runAutomationProcessorJob()` in `src/lib/jobs/workers.ts`, invoked by `/api/cron/automation-processor`. Never build secondary consumers of `automation_events`.

### 4. Cron Authentication

All cron routes must call `verifyCronSecret(request)` from `src/lib/runtime/cron.ts` at the top. Fail-closed: if `CRON_SECRET` is not set, all cron requests are rejected.

```typescript
if (!verifyCronSecret(request)) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

### 5. Admin Client Scoping

`createAdminClient()` (service role) is only permitted in:
- Server-side cron routes
- Webhook handlers
- SDK primitives (sdk.ts)
- Job workers (workers.ts)

Never expose service role key to client components.

### 6. Idempotency

All event emissions should include an `idempotencyKey` when the triggering action is retryable (webhooks, API calls). Format: `"<event_name>:<entity_id>"`.

### 7. Status Column Writes

The `automation_events.status` column must be written on every state transition:
- Lock: `status = 'processing'`
- Success: `status = 'completed'`
- Failure (retryable): `status = 'retrying'`
- Failure (first): `status = 'failed'`
- DLQ: `status = 'dead_letter'`

### 8. Disconnected Packages

The following packages are **NOT part of the canonical runtime** and must not be imported:
- `packages/workflow-engine`
- `packages/runtime-orchestrator`
- `packages/ai-os`
- `packages/ai-orchestrator`
- `packages/automation-engine`

Each has a `RUNTIME_STATUS.md` documenting its dormant state.

## Adding a New Automation Event

1. Add the event name to `AutomationEventName` in `src/lib/automation/events.ts`
2. Add a handler to `HANDLERS` in `src/lib/automation/handlers.ts`
3. Add a workflow entry to `workflow_registry` via a new migration
4. Emit via `emitEvent()` from the triggering code path

## Adding a New Cron Job

1. Add the route to `vercel.json` crons array
2. Create `src/app/api/cron/<name>/route.ts`
3. Call `verifyCronSecret(request)` at the top
4. Add a `run<Name>Job()` function to `src/lib/jobs/workers.ts`
5. Add to `ALL_JOBS` map in `workers.ts`

## Changing AI Models

Models are defined in `MODELS` const in `src/lib/ai/gateway.ts`. Agents reference model keys (`primary`, `fast`, `advanced`). To change a model:
1. Update the model ID in `MODELS`
2. Update pricing in `PRICING` 
3. No other files need changing — all agents inherit from the registry
