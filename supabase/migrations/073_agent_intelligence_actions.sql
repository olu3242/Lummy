-- Migration 073: Agent Intelligence + Actions + Collaboration (Phases L, M, N)

-- ── Agent Recommendations (org-scoped) ───────────────────────────────────────
create table if not exists public.agent_recommendations (
  id                  uuid primary key default gen_random_uuid(),
  agent_name          text not null,
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  recommendation_type text not null,
  title               text not null,
  description         text not null,
  confidence          numeric(3,2) not null default 0.80 check (confidence between 0 and 1),
  impact_score        integer not null default 50 check (impact_score between 0 and 100),
  status              text not null default 'active'
                        check (status in ('active', 'dismissed', 'acted_on')),
  created_at          timestamptz not null default now()
);

create index if not exists idx_recommendations_org_status
  on public.agent_recommendations(organization_id, status, created_at desc);

alter table public.agent_recommendations enable row level security;
create policy "recommendations_org" on public.agent_recommendations
  for all using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- ── Agent Insights (org-scoped) ───────────────────────────────────────────────
create table if not exists public.agent_insights (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  insight_type    text not null,
  summary         text not null,
  severity        text not null default 'info'
                    check (severity in ('info', 'warning', 'critical')),
  confidence      numeric(3,2) not null default 0.80 check (confidence between 0 and 1),
  created_at      timestamptz not null default now()
);

create index if not exists idx_insights_org_severity
  on public.agent_insights(organization_id, severity, created_at desc);

alter table public.agent_insights enable row level security;
create policy "insights_org" on public.agent_insights
  for all using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- ── Agent Actions (org-scoped, requires human approval) ──────────────────────
create table if not exists public.agent_actions (
  id               uuid primary key default gen_random_uuid(),
  agent_name       text not null,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  action_type      text not null,
  title            text not null,
  description      text not null,
  payload          jsonb not null default '{}',
  confidence       numeric(3,2) not null default 0.80 check (confidence between 0 and 1),
  status           text not null default 'proposed'
                     check (status in ('proposed', 'approved', 'executing', 'completed', 'failed', 'rejected')),
  requires_approval boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists idx_agent_actions_org_status
  on public.agent_actions(organization_id, status, created_at desc);

alter table public.agent_actions enable row level security;
create policy "agent_actions_org" on public.agent_actions
  for all using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- ── Action Registry (platform-level, what actions exist) ─────────────────────
create table if not exists public.agent_action_registry (
  id                uuid primary key default gen_random_uuid(),
  action_type       text not null unique,
  display_name      text not null,
  description       text,
  requires_approval boolean not null default true,
  enabled           boolean not null default true
);

insert into public.agent_action_registry (action_type, display_name, description) values
  ('create_discount',    'Create Discount',    'Draft a discount code or offer'),
  ('create_campaign',    'Create Campaign',    'Draft a marketing campaign'),
  ('feature_product',    'Feature Product',    'Highlight a product on the storefront'),
  ('generate_content',   'Generate Content',   'Draft marketing content or captions'),
  ('send_broadcast',     'Send Broadcast',     'Draft a WhatsApp broadcast message'),
  ('create_bundle',      'Create Bundle',      'Draft a product bundle'),
  ('raise_incident',     'Raise Incident',     'Flag an operational incident'),
  ('draft_landing_copy', 'Draft Landing Copy', 'Draft landing page copy variation'),
  ('draft_cta',          'Draft CTA',          'Draft a call-to-action variation')
on conflict (action_type) do nothing;

-- ── Action Approvals ──────────────────────────────────────────────────────────
create table if not exists public.agent_action_approvals (
  id          uuid primary key default gen_random_uuid(),
  action_id   uuid not null references public.agent_actions(id) on delete cascade,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  status      text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  notes       text
);

alter table public.agent_action_approvals enable row level security;
create policy "approvals_via_actions" on public.agent_action_approvals
  for all using (
    exists (
      select 1 from public.agent_actions a
      where a.id = agent_action_approvals.action_id
        and is_org_member(a.organization_id)
    )
  );

-- ── Execution Logs ────────────────────────────────────────────────────────────
create table if not exists public.agent_execution_logs (
  id               uuid primary key default gen_random_uuid(),
  action_id        uuid references public.agent_actions(id) on delete set null,
  agent_name       text not null,
  organization_id  uuid references public.organizations(id) on delete cascade,
  status           text not null,
  execution_result jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

alter table public.agent_execution_logs enable row level security;
create policy "exec_logs_org" on public.agent_execution_logs
  for all using (organization_id is null or is_org_member(organization_id));

-- ── Agent Contexts (collaboration bus) ───────────────────────────────────────
create table if not exists public.agent_contexts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  context_type    text not null,
  source_agent    text not null,
  payload         jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_agent_contexts_org
  on public.agent_contexts(organization_id, context_type, created_at desc);

alter table public.agent_contexts enable row level security;
create policy "contexts_org" on public.agent_contexts
  for all using (is_org_member(organization_id))
  with check (is_org_member(organization_id));
