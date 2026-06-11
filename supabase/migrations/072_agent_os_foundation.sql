-- Migration 072: Agent OS Foundation (Phase K)
-- Core agent registry, memory, events, audit, tools, permissions

-- ── Agent Registry (platform-level, no tenant scoping) ───────────────────────
create table if not exists public.agent_registry (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  display_name text not null,
  version      text not null default '1.0.0',
  status       text not null default 'active'
                 check (status in ('active', 'inactive', 'maintenance')),
  agent_type   text not null,
  description  text,
  capabilities text[] not null default '{}',
  created_at   timestamptz not null default now()
);

-- ── Agent Memories (org-scoped, per-agent) ───────────────────────────────────
create table if not exists public.agent_memories (
  id              uuid primary key default gen_random_uuid(),
  agent_name      text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  memory_type     text not null
                    check (memory_type in ('observation', 'recommendation', 'incident', 'outcome', 'trend')),
  content         text not null,
  confidence      numeric(3,2) not null default 0.80
                    check (confidence between 0 and 1),
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_agent_memories_agent_org
  on public.agent_memories(agent_name, organization_id, created_at desc);

alter table public.agent_memories enable row level security;
create policy "agent_memories_org" on public.agent_memories
  for all using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- ── Agent Events (org-scoped) ────────────────────────────────────────────────
create table if not exists public.agent_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  event_type      text not null,
  event_source    text not null,
  payload         jsonb not null default '{}',
  status          text not null default 'pending'
                    check (status in ('pending', 'processing', 'processed', 'failed')),
  processed_by    text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_agent_events_org_type
  on public.agent_events(organization_id, event_type, created_at desc);

alter table public.agent_events enable row level security;
create policy "agent_events_org" on public.agent_events
  for all using (organization_id is null or is_org_member(organization_id))
  with check (organization_id is null or is_org_member(organization_id));

-- ── Agent Audit Logs (org-scoped) ────────────────────────────────────────────
create table if not exists public.agent_audit_logs (
  id              uuid primary key default gen_random_uuid(),
  agent_name      text not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  input           jsonb not null default '{}',
  decision        text,
  confidence      numeric(3,2) not null default 0.80,
  action_taken    text,
  result          jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_agent_audit_org
  on public.agent_audit_logs(organization_id, agent_name, created_at desc);

alter table public.agent_audit_logs enable row level security;
create policy "agent_audit_org" on public.agent_audit_logs
  for all using (organization_id is null or is_org_member(organization_id));

-- ── Agent Tools (platform-level) ─────────────────────────────────────────────
create table if not exists public.agent_tools (
  id          uuid primary key default gen_random_uuid(),
  tool_name   text not null unique,
  resource    text not null,
  permissions text[] not null default '{}',
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Agent Permissions (platform-level) ───────────────────────────────────────
create table if not exists public.agent_permissions (
  id         uuid primary key default gen_random_uuid(),
  agent_name text not null,
  resource   text not null,
  action     text not null,
  unique (agent_name, resource, action)
);

-- ── Seed: Agent Registry ─────────────────────────────────────────────────────
insert into public.agent_registry (name, display_name, agent_type, description, capabilities) values
  ('NOVA',      'Nova',      'creator_success',  'Creator success, revenue growth, store performance', array['revenue_analysis','trend_detection','recommendation_generation']),
  ('ATLAS',     'Atlas',     'payments',         'Payment reliability, failure detection, webhook monitoring', array['payment_analysis','failure_detection','reconciliation']),
  ('TREASURY',  'Treasury',  'payouts',          'Payout management, balance tracking, withdrawal optimization', array['balance_tracking','payout_scheduling','withdrawal_guidance']),
  ('PULSE',     'Pulse',     'operations',       'Operational health, webhook reliability, system monitoring', array['ops_monitoring','webhook_analysis','incident_detection']),
  ('MERCHANT',  'Merchant',  'commerce',         'Product performance, pricing intelligence, inventory optimization', array['product_analysis','pricing_optimization','inventory_management']),
  ('VELOCITY',  'Velocity',  'marketing',        'Campaign performance, traffic analysis, conversion optimization', array['campaign_analysis','traffic_monitoring','conversion_optimization']),
  ('AURA',      'Aura',      'customer_experience','Customer lifetime value, retention, satisfaction', array['customer_analysis','retention_scoring','satisfaction_monitoring']),
  ('SENTINEL',  'Sentinel',  'security',         'Security monitoring, anomaly detection, tenant isolation', array['security_monitoring','anomaly_detection','threat_analysis']),
  ('ORBIT',     'Orbit',     'growth_intelligence','Growth metrics, creator lifecycle, expansion opportunities', array['growth_analysis','lifecycle_tracking','opportunity_scoring']),
  ('ASCEND',    'Ascend',    'acquisition',      'Landing page optimization, signup funnel, activation intelligence', array['acquisition_analysis','funnel_optimization','activation_scoring'])
on conflict (name) do nothing;

-- ── Seed: Agent Tools ─────────────────────────────────────────────────────────
insert into public.agent_tools (tool_name, resource, permissions) values
  ('get_orders',             'orders',              array['read']),
  ('get_products',           'products',            array['read']),
  ('get_storefront',         'storefronts',         array['read']),
  ('get_customers',          'customer_profiles',   array['read']),
  ('get_campaigns',          'campaigns',           array['read']),
  ('get_payments',           'payments',            array['read']),
  ('get_payouts',            'payouts',             array['read']),
  ('get_balance',            'payments',            array['read']),
  ('get_metrics',            'agent_audit_logs',    array['read']),
  ('create_recommendation',  'agent_recommendations', array['write']),
  ('create_incident',        'agent_insights',      array['write']),
  ('create_review_request',  'agent_actions',       array['write'])
on conflict (tool_name) do nothing;

-- ── Seed: Agent Permissions ────────────────────────────────────────────────────
insert into public.agent_permissions (agent_name, resource, action) values
  ('NOVA',     'orders',    'read'), ('NOVA',     'payments', 'read'), ('NOVA',     'products', 'read'),
  ('ATLAS',    'payments',  'read'), ('ATLAS',    'webhook_events', 'read'),
  ('TREASURY', 'payouts',   'read'), ('TREASURY', 'payments', 'read'), ('TREASURY', 'payout_accounts', 'read'),
  ('PULSE',    'webhook_events', 'read'), ('PULSE', 'orders', 'read'), ('PULSE', 'payments', 'read'),
  ('MERCHANT', 'products',  'read'), ('MERCHANT', 'orders', 'read'),
  ('VELOCITY', 'campaigns', 'read'), ('VELOCITY', 'orders', 'read'),
  ('AURA',     'customer_profiles', 'read'), ('AURA', 'orders', 'read'),
  ('SENTINEL', 'agent_audit_logs', 'read'),
  ('ORBIT',    'orders', 'read'), ('ORBIT', 'products', 'read'), ('ORBIT', 'customer_profiles', 'read'),
  ('ASCEND',   'orders', 'read'), ('ASCEND', 'storefronts', 'read')
on conflict (agent_name, resource, action) do nothing;
