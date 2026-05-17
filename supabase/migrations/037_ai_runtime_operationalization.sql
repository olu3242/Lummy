create table if not exists ai_execution_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id text not null unique,
  tenant_id uuid,
  workflow text not null,
  provider text not null,
  model text not null,
  prompt_key text not null,
  prompt_version integer not null,
  latency_ms integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  confidence numeric(5, 4) not null default 0,
  degraded boolean not null default false,
  correlation_id text,
  audit_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_execution_logs_tenant_created_idx
  on ai_execution_logs (tenant_id, created_at desc);

create index if not exists ai_execution_logs_workflow_provider_idx
  on ai_execution_logs (workflow, provider, created_at desc);

create table if not exists ai_provider_failures (
  id uuid primary key default gen_random_uuid(),
  execution_id text,
  tenant_id uuid,
  workflow text,
  provider text not null,
  error text not null,
  retry_count integer not null default 0,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists ai_provider_failures_tenant_created_idx
  on ai_provider_failures (tenant_id, created_at desc);

create table if not exists ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null,
  version integer not null,
  environment text not null default 'all',
  approved boolean not null default false,
  system_prompt text not null,
  user_prompt text not null,
  rollback_version integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (prompt_key, version)
);

create index if not exists ai_prompt_versions_key_approved_idx
  on ai_prompt_versions (prompt_key, approved, version desc);

create table if not exists ai_usage_metrics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  workflow text not null,
  provider text not null,
  total_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  latency_ms integer not null default 0,
  conversion_impact numeric(12, 4),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_metrics_tenant_workflow_idx
  on ai_usage_metrics (tenant_id, workflow, created_at desc);

create table if not exists ai_commerce_insights (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  workflow text not null,
  subject_id text not null,
  recommendation text not null,
  confidence numeric(5, 4) not null default 0,
  score numeric(8, 4),
  segment text,
  correlation_id text,
  audit_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_commerce_insights_tenant_subject_idx
  on ai_commerce_insights (tenant_id, subject_id, created_at desc);

insert into ai_prompt_versions (prompt_key, version, environment, approved, system_prompt, user_prompt, metadata)
values
  (
    'commerce.lead_scoring',
    1,
    'all',
    true,
    'You are Lummy''s governed commerce intelligence assistant. Return concise, auditable JSON only. Include confidence between 0 and 1.',
    'Score this lead from operational signals: {{signals}}. Return {"score":number,"recommendation":string,"confidence":number}.',
    '{"owner":"ai-runtime","workflow":"lead_scoring"}'::jsonb
  ),
  (
    'commerce.conversion_prediction',
    1,
    'all',
    true,
    'You are Lummy''s governed commerce intelligence assistant. Return concise, auditable JSON only. Include confidence between 0 and 1.',
    'Predict conversion likelihood from signals: {{signals}}. Return {"score":number,"recommendation":string,"confidence":number}.',
    '{"owner":"ai-runtime","workflow":"conversion_prediction"}'::jsonb
  ),
  (
    'commerce.product_recommendation',
    1,
    'all',
    true,
    'You are Lummy''s governed commerce intelligence assistant. Return concise, auditable JSON only. Include confidence between 0 and 1.',
    'Recommend products from customer and catalog signals: {{signals}}. Return {"recommendation":string,"confidence":number}.',
    '{"owner":"ai-runtime","workflow":"product_recommendation"}'::jsonb
  ),
  (
    'commerce.abandoned_order_analysis',
    1,
    'all',
    true,
    'You are Lummy''s governed commerce intelligence assistant. Return concise, auditable JSON only. Include confidence between 0 and 1.',
    'Analyze this abandoned order and suggest recovery: {{signals}}. Return {"recommendation":string,"confidence":number}.',
    '{"owner":"ai-runtime","workflow":"abandoned_order_analysis"}'::jsonb
  ),
  (
    'commerce.campaign_suggestion',
    1,
    'all',
    true,
    'You are Lummy''s governed commerce intelligence assistant. Return concise, auditable JSON only. Include confidence between 0 and 1.',
    'Suggest a campaign from commerce signals: {{signals}}. Return {"recommendation":string,"confidence":number}.',
    '{"owner":"ai-runtime","workflow":"campaign_suggestion"}'::jsonb
  ),
  (
    'commerce.customer_segmentation',
    1,
    'all',
    true,
    'You are Lummy''s governed commerce intelligence assistant. Return concise, auditable JSON only. Include confidence between 0 and 1.',
    'Segment this customer from signals: {{signals}}. Return {"segment":string,"recommendation":string,"confidence":number}.',
    '{"owner":"ai-runtime","workflow":"customer_segmentation"}'::jsonb
  ),
  (
    'copilot.creator_summary',
    1,
    'all',
    true,
    'You are Lummy''s governed commerce intelligence assistant. Return concise, auditable JSON only. Include confidence between 0 and 1.',
    'Summarize creator operations and recommend next actions: {{signals}}. Return {"summary":string,"hotLeads":string,"campaign":string,"confidence":number}.',
    '{"owner":"ai-runtime","workflow":"creator_copilot"}'::jsonb
  )
on conflict (prompt_key, version) do update
set approved = excluded.approved,
    system_prompt = excluded.system_prompt,
    user_prompt = excluded.user_prompt,
    metadata = excluded.metadata,
    updated_at = now();

alter table ai_execution_logs enable row level security;
alter table ai_provider_failures enable row level security;
alter table ai_prompt_versions enable row level security;
alter table ai_usage_metrics enable row level security;
alter table ai_commerce_insights enable row level security;

create policy if not exists "Service role can manage ai execution logs"
  on ai_execution_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "Service role can manage ai provider failures"
  on ai_provider_failures for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "Service role can manage ai prompt versions"
  on ai_prompt_versions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "Service role can manage ai usage metrics"
  on ai_usage_metrics for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "Service role can manage ai commerce insights"
  on ai_commerce_insights for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
