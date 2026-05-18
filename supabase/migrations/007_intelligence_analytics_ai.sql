create table if not exists metric_versions (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null,
  metric_version int not null,
  created_at timestamptz not null default now(),
  unique(metric_key, metric_version)
);

create table if not exists analytics_daily (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  metric_key text not null,
  metric_version int not null,
  event_id text not null,
  payload jsonb not null,
  occurred_at timestamptz not null
);

create table if not exists cohort_retention (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  cohort_key text not null,
  day_index int not null,
  retained_users int not null,
  updated_at timestamptz not null
);

create table if not exists attribution_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  customer_id text not null,
  source text not null,
  campaign text not null,
  event_id text not null,
  occurred_at timestamptz not null
);

create table if not exists recommendation_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  subject_id text not null,
  recommendation_type text not null,
  score numeric not null,
  created_at timestamptz not null
);

create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  run_id text not null unique,
  tenant_id text not null,
  prompt_key text not null,
  prompt_version int not null,
  provider text not null,
  output text,
  prompt_tokens int,
  completion_tokens int,
  created_at timestamptz not null
);

create table if not exists ai_memories (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  memory_key text not null,
  value jsonb not null,
  updated_at timestamptz not null,
  unique(tenant_id, memory_key)
);

create table if not exists ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null,
  version int not null,
  content text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique(prompt_key, version)
);

create table if not exists ai_tool_logs (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  tool_name text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists ai_usage_metrics (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  provider text not null,
  prompt_tokens int not null,
  completion_tokens int not null,
  created_at timestamptz not null default now()
);

create table if not exists ai_evaluations (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  score numeric not null,
  notes text,
  created_at timestamptz not null
);

create table if not exists ai_failures (
  id uuid primary key default gen_random_uuid(),
  run_id text,
  tenant_id text not null,
  reason text not null,
  created_at timestamptz not null default now()
);
