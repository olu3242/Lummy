create table if not exists job_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  job_id text not null,
  queue text not null,
  attempt int not null default 0,
  status text not null,
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  correlation_id text,
  created_at timestamptz not null default now()
);

create table if not exists job_dead_letters (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  job_id text not null,
  queue text not null,
  payload jsonb not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists job_schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  queue text not null,
  run_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists job_locks (
  lock_key text primary key,
  owner text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists worker_health (
  worker_id text primary key,
  status text not null,
  heartbeat_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists worker_metrics (
  id uuid primary key default gen_random_uuid(),
  worker_id text not null,
  metric_name text not null,
  metric_value numeric not null,
  observed_at timestamptz not null default now()
);
