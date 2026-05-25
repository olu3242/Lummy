# workflow-engine — DEFERRED / NON-CANONICAL

**Status: DORMANT**

This package is **not part of the operational MVP runtime execution path.**

## Canonical Runtime (use this instead)

The active runtime spine lives in:

```
src/lib/automation/     — event dispatch, handlers, SDK
src/lib/jobs/workers.ts — cron job processors
src/lib/ai/gateway.ts   — AI inference gateway
src/runtime/            — canonical interface layer
```

## Why This Package Exists

This package was created as forward-looking infrastructure for
future-scale distributed/multi-tenant execution. It is preserved
for potential activation when operational requirements justify it.

## Do Not Import

Do NOT import from this package in:
- `src/app/` routes
- `src/lib/` modules
- Vercel serverless functions
- Cron job handlers

Imports will compile but the runtime they reference has no active
entry point and is not supervised, monitored, or SLA-tracked.

## Activation Path

To activate this package in the future:
1. Provision the required external dependencies (Redis / BullMQ)
2. Create a supervised entry point in `apps/workers/`
3. Wire to the canonical `automation_events` table
4. Add to Vercel background process or separate worker dyno
5. Remove this notice
