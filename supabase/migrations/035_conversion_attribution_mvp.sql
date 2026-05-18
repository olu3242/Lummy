create table if not exists public.conversion_attribution (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  storefront_id uuid null references public.storefronts(id) on delete set null,
  customer_id uuid null references public.customer_profiles(id) on delete set null,
  interaction_id uuid null references public.customer_interactions(id) on delete set null,
  checkout_id uuid null references public.orders(id) on delete set null,
  order_id uuid null references public.orders(id) on delete set null,
  source_platform text not null default 'Direct',
  source_campaign text null,
  source_content_reference text null,
  referral_code text null,
  conversion_type text not null default 'inquiry',
  revenue_amount numeric(12,2) not null default 0,
  conversion_status text not null default 'inquiry_captured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversion_attribution_org_created
  on public.conversion_attribution(org_id, created_at desc);

create unique index if not exists idx_conversion_attribution_interaction_unique
  on public.conversion_attribution(interaction_id)
  where interaction_id is not null;

alter table public.conversion_attribution enable row level security;

drop policy if exists "Users can view attribution rows in their org" on public.conversion_attribution;
create policy "Users can view attribution rows in their org"
  on public.conversion_attribution for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.organization_id = conversion_attribution.org_id
    )
  );

drop policy if exists "Service role manages attribution rows" on public.conversion_attribution;
create policy "Service role manages attribution rows"
  on public.conversion_attribution for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
