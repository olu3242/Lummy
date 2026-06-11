-- Migration 074: Business Operating System (Phase Q)
-- Objectives, KPIs, goals, agent performance, forecasting, playbooks

-- ── Business Objectives (org-scoped) ─────────────────────────────────────────
create table if not exists public.business_objectives (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  objective_type  text not null,
  title           text not null,
  target_value    numeric(12,2) not null,
  current_value   numeric(12,2) not null default 0,
  unit            text not null default 'NGN',
  status          text not null default 'active'
                    check (status in ('active', 'achieved', 'missed', 'paused')),
  deadline_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

create index if not exists idx_objectives_org_status
  on public.business_objectives(organization_id, status);

alter table public.business_objectives enable row level security;
create policy "objectives_org" on public.business_objectives
  for all using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- ── Business KPIs (cached, computed on demand) ───────────────────────────────
create table if not exists public.business_kpis (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  metric_name     text not null,
  metric_value    numeric(12,4) not null default 0,
  metric_unit     text,
  period          text not null default '30d',
  computed_at     timestamptz not null default now(),
  unique (organization_id, metric_name, period)
);

alter table public.business_kpis enable row level security;
create policy "kpis_org" on public.business_kpis
  for all using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- ── Agent Performance (org-scoped) ───────────────────────────────────────────
create table if not exists public.agent_performance (
  id                        uuid primary key default gen_random_uuid(),
  agent_name                text not null,
  organization_id           uuid references public.organizations(id) on delete cascade,
  period                    text not null default '30d',
  recommendations_generated integer not null default 0,
  recommendations_accepted  integer not null default 0,
  actions_approved          integer not null default 0,
  actions_completed         integer not null default 0,
  revenue_influenced        numeric(12,2) not null default 0,
  computed_at               timestamptz not null default now(),
  unique (agent_name, organization_id, period)
);

alter table public.agent_performance enable row level security;
create policy "perf_org" on public.agent_performance
  for all using (organization_id is null or is_org_member(organization_id));

-- ── Playbooks (platform-level templates) ─────────────────────────────────────
create table if not exists public.agent_playbooks (
  id               uuid primary key default gen_random_uuid(),
  playbook_type    text not null unique,
  title            text not null,
  trigger_condition text not null,
  steps            jsonb not null default '[]',
  agents_involved  text[] not null default '{}',
  enabled          boolean not null default true
);

insert into public.agent_playbooks (playbook_type, title, trigger_condition, agents_involved, steps) values
  ('low_revenue',    'Low Revenue Recovery',    'Monthly revenue < 50% of target',
   array['NOVA','VELOCITY','MERCHANT'],
   '[{"step":1,"agent":"NOVA","action":"Identify revenue gap and top underperforming products"},{"step":2,"agent":"MERCHANT","action":"Review pricing and bundle opportunities"},{"step":3,"agent":"VELOCITY","action":"Draft promotional campaign to boost sales"}]'::jsonb),
  ('low_traffic',    'Traffic Recovery',        'Storefront visits < 10 in last 7 days',
   array['ASCEND','VELOCITY'],
   '[{"step":1,"agent":"ASCEND","action":"Identify traffic source drop-offs"},{"step":2,"agent":"VELOCITY","action":"Draft social media campaign to drive traffic"}]'::jsonb),
  ('low_conversion', 'Conversion Optimization', 'Payment success rate < 60%',
   array['ATLAS','MERCHANT'],
   '[{"step":1,"agent":"ATLAS","action":"Identify payment failure patterns"},{"step":2,"agent":"MERCHANT","action":"Optimize checkout experience and pricing"}]'::jsonb),
  ('low_activation', 'Creator Activation',      'Storefront created but no products or orders',
   array['NOVA','MERCHANT','ASCEND'],
   '[{"step":1,"agent":"NOVA","action":"Identify activation drop-off stage"},{"step":2,"agent":"MERCHANT","action":"Guide product creation with pricing recommendations"},{"step":3,"agent":"ASCEND","action":"Draft launch announcement copy"}]'::jsonb),
  ('high_refunds',   'Refund Rate Reduction',   'Refund rate > 10% of orders',
   array['ATLAS','AURA','MERCHANT'],
   '[{"step":1,"agent":"ATLAS","action":"Analyze refund patterns and payment issues"},{"step":2,"agent":"AURA","action":"Identify customer satisfaction issues"},{"step":3,"agent":"MERCHANT","action":"Recommend product description improvements"}]'::jsonb)
on conflict (playbook_type) do nothing;
