-- ── Migration 045: Event Lifecycle Normalization ──────────────────────────────
--
-- Promotes correlation_id and workflow_id from payload JSON to first-class
-- columns on automation_events, enabling direct SQL queries without JSON
-- extraction. Also adds execution_duration_ms for latency observability.
--
-- These columns are already written by runAutomationProcessorJob (workers.ts).
-- This migration makes the schema match the runtime's expectations.

-- correlation_id: propagated from original SDK emitEvent call through execution
alter table if exists public.automation_events
  add column if not exists correlation_id       text,
  add column if not exists execution_duration_ms int4,
  add column if not exists workflow_id           text,
  add column if not exists updated_at            timestamptz default now();

-- Index correlation_id for cross-system event tracing
create index if not exists idx_automation_events_correlation
  on public.automation_events(correlation_id)
  where correlation_id is not null;

-- Index workflow_id for registry-based execution dashboards
create index if not exists idx_automation_events_workflow
  on public.automation_events(workflow_id, processed, created_at desc)
  where workflow_id is not null;

-- Composite index for the processor's primary query pattern:
-- WHERE processed = false AND processing = false AND (scheduled_for IS NULL OR scheduled_for <= now)
create index if not exists idx_automation_events_pending_scheduled
  on public.automation_events(processed, processing, scheduled_for, created_at)
  where processed = false;
