# Disconnected Runtime Systems

These systems exist in the codebase but are **not part of the canonical runtime**. They must not be imported from application code.

## packages/workflow-engine

**Status**: DORMANT  
**Location**: `packages/workflow-engine/`  
**What it does**: Alternative workflow execution engine with its own event types and handlers  
**Why disconnected**: No wiring to Supabase, no activation entry point, conflicts with canonical `automation_events` processor  
**RUNTIME_STATUS.md**: `packages/workflow-engine/RUNTIME_STATUS.md`  

## packages/runtime-orchestrator

**Status**: DORMANT  
**Location**: `packages/runtime-orchestrator/`  
**What it does**: In-memory queue service (`InMemoryQueueService`) used by `apps/workers/`  
**Why disconnected**: In-memory queues don't survive process restarts, not production-safe; `apps/workers/` has no deployment path on Vercel  
**RUNTIME_STATUS.md**: `packages/runtime-orchestrator/RUNTIME_STATUS.md`  

## packages/ai-os

**Status**: DORMANT  
**Location**: `packages/ai-os/`  
**What it does**: Alternative AI orchestration layer  
**Why disconnected**: Duplicates `src/lib/ai/gateway.ts`; canonical gateway handles all AI inference  
**RUNTIME_STATUS.md**: `packages/ai-os/RUNTIME_STATUS.md`  

## packages/ai-orchestrator

**Status**: DORMANT  
**Location**: `packages/ai-orchestrator/`  
**What it does**: AI agent orchestration pipeline  
**Why disconnected**: Duplicates canonical AI gateway; no shared type system with live codebase  
**RUNTIME_STATUS.md**: `packages/ai-orchestrator/RUNTIME_STATUS.md`  

## packages/automation-engine

**Status**: DORMANT  
**Location**: `packages/automation-engine/`  
**What it does**: Alternative automation processing engine  
**Why disconnected**: Parallel processor would create split-brain state with `automation_events`  
**RUNTIME_STATUS.md**: `packages/automation-engine/RUNTIME_STATUS.md`  

## src/lib/queues/workers/

**Status**: DISCONNECTED (files annotated)  
**Location**: `src/lib/queues/workers/{ai,email,whatsapp,analytics,notification}-worker.ts`  
**What it does**: BullMQ-based workers for each job type  
**Why disconnected**: No Redis connection configured, no entry point wired, no startup path  
**Files annotated**: Each worker file has `// RUNTIME STATUS: DISCONNECTED` comment  

**Activation path**:
1. Configure `REDIS_URL` environment variable
2. Create `src/lib/queues/start-workers.ts` entry point calling each worker's `start()`
3. Deploy as a long-running Vercel Background Function or separate worker dyno
4. Ensure BullMQ job names match `AutomationEventName` values (currently mismatched)

## apps/workers/

**Status**: DISCONNECTED  
**Location**: `apps/workers/`  
**What it does**: Worker process using `@lummy/runtime-orchestrator` (InMemoryQueueService)  
**Why disconnected**: In-memory only, no deployment path, uses disconnected orchestrator package  

## Design Principle

Activating any of these systems would create **two competing processors** for the same event queue. The canonical `automation_events` table must have exactly one consumer: `runAutomationProcessorJob()` in `src/lib/jobs/workers.ts`.

If BullMQ workers are activated in the future, they should **replace** the cron processor for their event types — not run in parallel.
