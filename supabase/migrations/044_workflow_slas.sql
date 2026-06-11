-- ============================================================
-- Migration 044: Workflow SLA tracking
-- Per-execution latency against registered SLA targets
-- ============================================================

create table if not exists public.workflow_sla_records (
  id              uuid primary key default gen_random_uuid(),
  workflow_id     text not null references public.workflow_registry(workflow_id) on delete cascade,
  event_id        uuid,                               -- references automation_events(id) if applicable
  tenant_id       uuid references public.organizations(id) on delete cascade,
  started_at      timestamptz not null,
  completed_at    timestamptz,
  duration_ms     integer,
  sla_target_ms   integer,
  breached        boolean not null default false,     -- duration_ms > sla_target_ms
  status          text not null default 'pending',    -- 'pending'|'running'|'completed'|'failed'
  error           text,
  correlation_id  text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_workflow_sla_workflow
  on public.workflow_sla_records(workflow_id, started_at desc);

create index if not exists idx_workflow_sla_breached
  on public.workflow_sla_records(workflow_id, breached)
  where breached = true;

create index if not exists idx_workflow_sla_tenant
  on public.workflow_sla_records(tenant_id, started_at desc)
  where tenant_id is not null;

-- View: SLA breach rates per workflow (last 7 days)
create or replace view public.workflow_sla_summary as
select
  workflow_id,
  count(*) filter (where started_at >= now() - interval '7 days')                    as total_7d,
  count(*) filter (where breached and started_at >= now() - interval '7 days')       as breached_7d,
  round(
    count(*) filter (where breached and started_at >= now() - interval '7 days')::numeric
    / nullif(count(*) filter (where started_at >= now() - interval '7 days'), 0) * 100,
    2
  )                                                                                     as breach_rate_pct,
  round(avg(duration_ms) filter (where started_at >= now() - interval '7 days'), 0)   as avg_duration_ms,
  round(percentile_cont(0.95) within group (order by duration_ms) filter (where started_at >= now() - interval '7 days'), 0) as p95_duration_ms,
  max(sla_target_ms)                                                                    as sla_target_ms
from public.workflow_sla_records
group by workflow_id;

-- RLS
alter table if exists public.workflow_sla_records enable row level security;

drop policy if exists "workflow_sla_service_only" on public.workflow_sla_records;
create policy "workflow_sla_service_only"
  on public.workflow_sla_records for all
  using (false);  -- service role only via admin client
