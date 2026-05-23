-- ============================================================
-- Migration 041: Enterprise Automation Runtime
-- DLQ infrastructure, workflow registry, automation logs,
-- AI budget tracking, security events, feature flags extension
-- ============================================================

-- ── Extend automation_events for DLQ support ─────────────────

alter table if exists public.automation_events
  add column if not exists processing      boolean not null default false,
  add column if not exists attempt_count   integer not null default 0,
  add column if not exists last_error      text,
  add column if not exists failed_at       timestamptz,
  add column if not exists scheduled_for   timestamptz;

create index if not exists idx_automation_events_dlq
  on public.automation_events(processed, attempt_count, failed_at)
  where processed = false and attempt_count >= 3;

create index if not exists idx_automation_events_scheduled
  on public.automation_events(scheduled_for)
  where scheduled_for is not null and processed = false;

-- ── Automation logs (execution audit trail) ──────────────────

create table if not exists public.automation_logs (
  id             uuid primary key default gen_random_uuid(),
  workflow_id    text not null,
  event_name     text not null,
  status         text not null default 'success',   -- 'success'|'failure'|'skipped'
  duration_ms    integer,
  tenant_id      uuid,
  creator_id     text,
  correlation_id text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists idx_automation_logs_workflow
  on public.automation_logs(workflow_id, created_at desc);

create index if not exists idx_automation_logs_tenant
  on public.automation_logs(tenant_id, created_at desc)
  where tenant_id is not null;

create index if not exists idx_automation_logs_status
  on public.automation_logs(status)
  where status = 'failure';

-- ── Workflow registry ─────────────────────────────────────────

create table if not exists public.workflow_registry (
  id          uuid primary key default gen_random_uuid(),
  workflow_id text not null unique,
  name        text not null,
  description text,
  version     integer not null default 1,
  status      text not null default 'active',  -- 'active'|'paused'|'draft'|'deprecated'|'canary'
  triggers    jsonb not null default '[]'::jsonb,
  queue_name  text,
  sla_max_ms  integer,
  rollout_pct integer not null default 100,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Seed P0 workflows
insert into public.workflow_registry (workflow_id, name, description, status, triggers, queue_name, sla_max_ms)
values
  ('WA-01', 'WhatsApp Router',       'Route inbound WhatsApp messages to intent detection',        'active', '["whatsapp.message_received"]', 'whatsapp-jobs', 5000),
  ('WA-02', 'Lead Qualifier',        'Score and qualify WhatsApp leads',                           'active', '["whatsapp.intent_detected"]',  'whatsapp-jobs', 10000),
  ('WA-04', 'Order Confirmation',    'Send WhatsApp order confirmation after payment',             'active', '["payment.received"]',           'whatsapp-jobs', 30000),
  ('PAY-01', 'Paystack Webhook',     'Process Paystack payment webhooks',                          'active', '["payment.received"]',           'payment-jobs',  5000),
  ('PAY-02', 'Order Status Updater', 'Update order status and sync customer memory',               'active', '["payment.received"]',           'payment-jobs',  10000),
  ('AM-01', 'Lead Scorer',           'Score and tag CRM leads based on activity',                  'active', '["whatsapp.message_received"]',  'analytics-jobs', 30000),
  ('CH-01', 'Daily Metrics',         'Compute daily creator health and churn scores',              'active', '["cron.daily"]',                  'analytics-jobs', 120000),
  ('OB-01', 'Creator Welcome',       'Send welcome email + WhatsApp on onboarding completion',    'active', '["creator.onboarding_completed"]', 'onboarding-jobs', 30000)
on conflict (workflow_id) do nothing;

-- ── Workflow versions (deployment history) ────────────────────

create table if not exists public.workflow_versions (
  id           uuid primary key default gen_random_uuid(),
  workflow_id  text not null references public.workflow_registry(workflow_id) on delete cascade,
  version      integer not null,
  definition   jsonb not null default '{}'::jsonb,
  deployed_by  text,
  deployed_at  timestamptz not null default now(),
  rollback_of  integer,
  is_active    boolean not null default false,
  notes        text
);

create unique index if not exists workflow_versions_id_version_key
  on public.workflow_versions(workflow_id, version);

-- ── AI usage budgets + cost tracking ─────────────────────────

create table if not exists public.ai_usage_budgets (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  period_start    date not null,
  period_end      date not null,
  budget_usd      numeric(10,4) not null default 10.0000,
  used_usd        numeric(10,4) not null default 0.0000,
  alert_threshold numeric(5,2) not null default 80.0,   -- % of budget
  hard_cap        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists ai_usage_budgets_org_period_key
  on public.ai_usage_budgets(organization_id, period_start)
  where organization_id is not null;

create table if not exists public.ai_cost_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  creator_id      text,
  agent_name      text not null,
  generation_type text not null,
  model           text not null,
  input_tokens    integer not null default 0,
  output_tokens   integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  cost_usd        numeric(10,6) not null default 0,
  latency_ms      integer,
  correlation_id  text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_ai_cost_events_org_date
  on public.ai_cost_events(organization_id, created_at desc)
  where organization_id is not null;

create index if not exists idx_ai_cost_events_agent
  on public.ai_cost_events(agent_name, created_at desc);

-- ── Security events ───────────────────────────────────────────

create table if not exists public.security_events (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null,
  severity        text not null default 'medium',  -- 'low'|'medium'|'high'|'critical'
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  ip_address      text,
  endpoint        text,
  details         jsonb not null default '{}'::jsonb,
  resolved        boolean not null default false,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_security_events_type_date
  on public.security_events(event_type, created_at desc);

create index if not exists idx_security_events_severity
  on public.security_events(severity, resolved)
  where resolved = false;

create index if not exists idx_security_events_org
  on public.security_events(organization_id, created_at desc)
  where organization_id is not null;

-- ── Human intervention queue ──────────────────────────────────

create table if not exists public.human_intervention_queue (
  id              uuid primary key default gen_random_uuid(),
  workflow_id     text,
  event_type      text not null,
  severity        text not null default 'medium',
  organization_id uuid references public.organizations(id) on delete cascade,
  title           text not null,
  description     text,
  context         jsonb not null default '{}'::jsonb,
  status          text not null default 'pending',  -- 'pending'|'in_review'|'resolved'|'dismissed'
  assigned_to     text,
  resolved_at     timestamptz,
  resolution_note text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_human_queue_status
  on public.human_intervention_queue(status, severity, created_at desc)
  where status = 'pending';

-- ── Feature flags (ensure table exists — may already exist) ──

create table if not exists public.feature_flags (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  enabled     boolean not null default false,
  rollout_pct integer not null default 0,
  description text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Seed P0 feature flags
insert into public.feature_flags (key, enabled, rollout_pct, description)
values
  ('whatsapp_outbound_enabled', false, 0,   'Enable outbound WhatsApp message sending'),
  ('email_receipts_enabled',    false, 0,   'Enable customer order receipt emails'),
  ('ai_gateway_enabled',        true,  100, 'Route all AI calls through centralized gateway'),
  ('automation_dlq_enabled',    true,  100, 'Enable DLQ pattern for failed automation events'),
  ('creator_welcome_email',     false, 0,   'Send welcome email on onboarding completion'),
  ('weekly_digest_enabled',     false, 0,   'Send weekly performance digest to creators')
on conflict (key) do nothing;

-- ── Analytics events (if not exists from earlier migrations) ──

create table if not exists public.analytics_events (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  product_id      uuid,
  value           numeric(12,4) not null default 1,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_analytics_events_org_type
  on public.analytics_events(organization_id, event_type, created_at desc)
  where organization_id is not null;

-- ── RLS: automation_logs (service role only for writes) ───────

alter table if exists public.automation_logs          enable row level security;
alter table if exists public.workflow_registry        enable row level security;
alter table if exists public.workflow_versions        enable row level security;
alter table if exists public.ai_usage_budgets         enable row level security;
alter table if exists public.ai_cost_events           enable row level security;
alter table if exists public.security_events          enable row level security;
alter table if exists public.human_intervention_queue enable row level security;
alter table if exists public.feature_flags            enable row level security;
alter table if exists public.analytics_events         enable row level security;

-- Automation logs: creators can read their own
drop policy if exists "automation_logs_read_own" on public.automation_logs;
create policy "automation_logs_read_own"
  on public.automation_logs for select
  using (tenant_id = (
    select organization_id from public.profiles where id = auth.uid() limit 1
  ));

-- Workflow registry: public read
drop policy if exists "workflow_registry_public_read" on public.workflow_registry;
create policy "workflow_registry_public_read"
  on public.workflow_registry for select
  using (true);

-- Feature flags: public read
drop policy if exists "feature_flags_public_read" on public.feature_flags;
create policy "feature_flags_public_read"
  on public.feature_flags for select
  using (true);

-- AI budgets: org members can read their own
drop policy if exists "ai_budgets_org_read" on public.ai_usage_budgets;
create policy "ai_budgets_org_read"
  on public.ai_usage_budgets for select
  using (public.is_org_member(organization_id));

-- Analytics events: org members can read their own
drop policy if exists "analytics_events_org_read" on public.analytics_events;
create policy "analytics_events_org_read"
  on public.analytics_events for select
  using (public.is_org_member(organization_id));

-- Human queue: no direct user access (service role only)
drop policy if exists "human_queue_service_only" on public.human_intervention_queue;
create policy "human_queue_service_only"
  on public.human_intervention_queue for all
  using (false);

-- Security events: no direct user access
drop policy if exists "security_events_service_only" on public.security_events;
create policy "security_events_service_only"
  on public.security_events for all
  using (false);
