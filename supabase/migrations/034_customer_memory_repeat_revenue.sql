create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  storefront_id uuid references public.storefronts(organization_id),
  customer_identifier text not null,
  name text,
  phone text,
  email text,
  preferred_channel text not null default 'whatsapp',
  first_interaction_at timestamptz,
  last_interaction_at timestamptz,
  total_orders integer not null default 0,
  total_revenue numeric(12,2) not null default 0,
  average_order_value numeric(12,2) not null default 0,
  repeat_customer_status text not null default 'new',
  lifecycle_stage text not null default 'new_lead',
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, customer_identifier)
);

create table if not exists public.customer_timeline_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  customer_profile_id uuid not null references public.customer_profiles(id) on delete cascade,
  interaction_id uuid references public.customer_interactions(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  event_type text not null,
  event_summary text not null,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_profiles_org_lifecycle on public.customer_profiles(org_id, lifecycle_stage, updated_at desc);
create index if not exists idx_customer_profiles_org_revenue on public.customer_profiles(org_id, total_revenue desc);
create index if not exists idx_customer_timeline_org_customer on public.customer_timeline_events(org_id, customer_profile_id, created_at desc);

alter table public.customer_profiles enable row level security;
alter table public.customer_timeline_events enable row level security;

create policy if not exists customer_profiles_org_policy on public.customer_profiles
for all using (org_id in (select organization_id from public.organization_members where user_id = auth.uid()));

create policy if not exists customer_timeline_org_policy on public.customer_timeline_events
for all using (org_id in (select organization_id from public.organization_members where user_id = auth.uid()));
