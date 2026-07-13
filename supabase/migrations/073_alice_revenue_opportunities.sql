-- ALICE canonical Revenue Intelligence Layer.
-- This table is the single source of truth for detected revenue opportunities.

create table if not exists public.revenue_opportunities (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type in (
    'recall',
    'treatment_acceptance',
    'lead_conversion',
    'review',
    'referral',
    'insurance_recovery',
    'provider_utilization'
  )),
  score integer not null check (score >= 0 and score <= 100),
  estimated_revenue numeric(12,2) not null default 0,
  confidence integer not null check (confidence >= 0 and confidence <= 100),
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  recommended_workflow text not null,
  status text not null default 'detected' check (status in (
    'detected',
    'assigned',
    'in_progress',
    'won',
    'lost',
    'dismissed'
  )),
  evidence jsonb not null default '{}'::jsonb,
  forecast jsonb not null default '{}'::jsonb,
  outcome jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, type, recommended_workflow, status)
);

create index if not exists revenue_opportunities_org_score_idx
  on public.revenue_opportunities(organization_id, score desc, created_at desc);

create index if not exists revenue_opportunities_status_priority_idx
  on public.revenue_opportunities(status, priority, created_at desc);

create index if not exists revenue_opportunities_type_idx
  on public.revenue_opportunities(type, created_at desc);

alter table public.revenue_opportunities enable row level security;

drop policy if exists "revenue_opportunities_org_read" on public.revenue_opportunities;
create policy "revenue_opportunities_org_read"
  on public.revenue_opportunities
  for select
  using (
    public.is_org_member(organization_id)
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.role in ('admin', 'ops'))
    )
  );

drop policy if exists "revenue_opportunities_service_role" on public.revenue_opportunities;
create policy "revenue_opportunities_service_role"
  on public.revenue_opportunities
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
