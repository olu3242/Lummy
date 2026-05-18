create table if not exists public.customer_interactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  storefront_id uuid null references public.storefronts(organization_id),
  customer_identifier text not null,
  source_channel text not null,
  interaction_type text not null,
  message_excerpt text not null,
  ai_intent text,
  ai_confidence numeric(5,2),
  associated_product_id uuid null references public.products(id),
  associated_checkout_id uuid null references public.orders(id),
  conversion_status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_customer_interactions_org on public.customer_interactions(org_id, storefront_id, created_at desc);

create table if not exists public.ai_conversion_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  interaction_id uuid not null references public.customer_interactions(id) on delete cascade,
  event_type text not null,
  ai_action text not null,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text not null,
  processing_status text not null default 'completed',
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_conversion_events_org on public.ai_conversion_events(org_id, created_at desc);

create table if not exists public.conversion_recovery_queue (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  interaction_id uuid not null references public.customer_interactions(id) on delete cascade,
  checkout_id uuid null references public.orders(id),
  recovery_stage text not null default 'initial',
  recovery_status text not null default 'pending',
  retry_count integer not null default 0,
  scheduled_for timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_conversion_recovery_org on public.conversion_recovery_queue(org_id, recovery_status, scheduled_for);

alter table public.customer_interactions enable row level security;
alter table public.ai_conversion_events enable row level security;
alter table public.conversion_recovery_queue enable row level security;

create policy if not exists customer_interactions_org_policy on public.customer_interactions
for all using (org_id in (select organization_id from public.organization_members where user_id = auth.uid()));
create policy if not exists ai_conversion_events_org_policy on public.ai_conversion_events
for all using (org_id in (select organization_id from public.organization_members where user_id = auth.uid()));
create policy if not exists conversion_recovery_org_policy on public.conversion_recovery_queue
for all using (org_id in (select organization_id from public.organization_members where user_id = auth.uid()));
