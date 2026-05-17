create table if not exists commerce_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_name text not null,
  tenant_id uuid,
  actor_id text,
  agent_id text,
  correlation_id text not null,
  causation_id text,
  idempotency_key text not null unique,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  processed_at timestamptz,
  replay_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists commerce_events_tenant_occurred_idx
  on commerce_events (tenant_id, occurred_at desc);

create index if not exists commerce_events_correlation_idx
  on commerce_events (correlation_id, occurred_at desc);

create table if not exists order_state_transitions (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  event_id text not null,
  event_name text not null,
  previous_state text not null,
  next_state text not null,
  valid boolean not null default true,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_state_transitions_order_idx
  on order_state_transitions (order_id, occurred_at desc);

create table if not exists dead_letter_events (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  event_name text,
  tenant_id uuid,
  correlation_id text,
  caused_by text,
  idempotency_key text,
  attempts integer not null default 0,
  reason text not null,
  failed_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  replay_status text not null default 'pending',
  replayed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists dead_letter_events_status_idx
  on dead_letter_events (replay_status, failed_at desc);

create table if not exists commerce_operational_timeline (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  subject_id text not null,
  subject_type text not null,
  event_id text not null,
  event_name text not null,
  correlation_id text not null,
  occurred_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists commerce_operational_timeline_subject_idx
  on commerce_operational_timeline (tenant_id, subject_type, subject_id, occurred_at desc);

create table if not exists commerce_realtime_feeds (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  feed_key text not null,
  event_name text not null,
  subject_id text,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists commerce_realtime_feeds_tenant_feed_idx
  on commerce_realtime_feeds (tenant_id, feed_key, created_at desc);

create table if not exists commerce_workflow_failures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  workflow_key text not null,
  event_id text,
  queue_name text,
  retryable boolean not null default true,
  attempts integer not null default 0,
  error text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists commerce_workflow_failures_tenant_idx
  on commerce_workflow_failures (tenant_id, workflow_key, created_at desc);

alter table workflow_failures
  add column if not exists tenant_id uuid,
  add column if not exists workflow_key text,
  add column if not exists event_id text,
  add column if not exists queue_name text,
  add column if not exists retryable boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table commerce_events enable row level security;
alter table order_state_transitions enable row level security;
alter table dead_letter_events enable row level security;
alter table commerce_operational_timeline enable row level security;
alter table commerce_realtime_feeds enable row level security;
alter table commerce_workflow_failures enable row level security;

create policy if not exists commerce_events_service_role_policy
  on commerce_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists order_state_transitions_service_role_policy
  on order_state_transitions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists dead_letter_events_service_role_policy
  on dead_letter_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists commerce_operational_timeline_service_role_policy
  on commerce_operational_timeline for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists commerce_realtime_feeds_service_role_policy
  on commerce_realtime_feeds for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists commerce_workflow_failures_service_role_policy
  on commerce_workflow_failures for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
