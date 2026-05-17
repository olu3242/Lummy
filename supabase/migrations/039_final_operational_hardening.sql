create table if not exists automation_runtime_executions (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  tenant_id text not null,
  workflow_key text not null,
  status text not null,
  attempt integer not null default 0,
  max_attempts integer not null default 1,
  idempotency_key text not null,
  correlation_id text not null,
  causation_id text,
  run_at timestamptz not null,
  timeout_ms integer not null default 30000,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists automation_runtime_executions_job_idx
  on automation_runtime_executions (job_id, created_at desc);

create index if not exists automation_runtime_executions_tenant_status_idx
  on automation_runtime_executions (tenant_id, status, created_at desc);

create table if not exists automation_worker_heartbeats (
  id uuid primary key default gen_random_uuid(),
  worker_id text not null,
  job_id text,
  tenant_id text,
  workflow_key text,
  correlation_id text,
  beat_at timestamptz not null default now()
);

create index if not exists automation_worker_heartbeats_worker_idx
  on automation_worker_heartbeats (worker_id, beat_at desc);

create table if not exists automation_cancellations (
  id uuid primary key default gen_random_uuid(),
  job_id text not null unique,
  tenant_id text not null,
  reason text not null,
  cancelled_by text not null default 'system',
  created_at timestamptz not null default now()
);

create table if not exists payment_provider_runtime_assertions (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  capability text not null,
  passed boolean not null,
  correlation_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_provider_runtime_assertions_provider_idx
  on payment_provider_runtime_assertions (provider, capability, created_at desc);

alter table payment_provider_events
  add column if not exists tenant_id text,
  add column if not exists provider_reference text,
  add column if not exists normalized_status text,
  add column if not exists latency_ms integer,
  add column if not exists retry_count integer not null default 0;

alter table payment_transaction_logs
  add column if not exists last_verified_at timestamptz,
  add column if not exists refund_status text,
  add column if not exists refund_reference text;

alter table automation_runtime_executions enable row level security;
alter table automation_worker_heartbeats enable row level security;
alter table automation_cancellations enable row level security;
alter table payment_provider_runtime_assertions enable row level security;

create policy if not exists automation_runtime_executions_service_role_policy
  on automation_runtime_executions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists automation_worker_heartbeats_service_role_policy
  on automation_worker_heartbeats for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists automation_cancellations_service_role_policy
  on automation_cancellations for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists payment_provider_runtime_assertions_service_role_policy
  on payment_provider_runtime_assertions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
