create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null,
  owner_id   uuid references auth.users(id) on delete cascade,
  plan       text not null default 'free',
  currency   text not null default 'NGN',
  country    text not null default 'NG',
  created_at timestamptz not null default now()
);

create unique index if not exists organizations_slug_key
  on public.organizations(slug);

create unique index if not exists organizations_owner_id_key
  on public.organizations(owner_id)
  where owner_id is not null;

create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'member',
  created_at      timestamptz not null default now()
);

create unique index if not exists organization_members_org_user_key
  on public.organization_members(organization_id, user_id);

create index if not exists idx_org_members_user_id
  on public.organization_members(user_id);

create index if not exists idx_org_members_org_id
  on public.organization_members(organization_id);

create table if not exists public.storefronts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  handle          text not null,
  bio             text,
  theme           jsonb,
  store_schema    jsonb,
  hero_image      text,
  social_links    jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

create unique index if not exists storefronts_organization_id_key
  on public.storefronts(organization_id);

create unique index if not exists storefronts_handle_key
  on public.storefronts(handle);

create index if not exists idx_storefronts_handle_active
  on public.storefronts(handle)
  where is_active = true;

create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title           text not null,
  description     text,
  price           numeric(12, 2) not null,
  currency        text not null default 'NGN',
  image_url       text,
  status          text not null default 'draft',
  created_at      timestamptz not null default now()
);

create index if not exists idx_products_org_created
  on public.products(organization_id, created_at desc);

create index if not exists idx_products_status
  on public.products(status)
  where status = 'active';

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  creator_id       uuid references auth.users(id),
  customer_email   text not null,
  customer_name    text,
  customer_phone   text,
  customer_address text,
  status           text not null default 'pending',
  payment_status   text default 'pending',
  amount           numeric(12, 2) not null,
  currency         text not null default 'NGN',
  payment_provider text not null default 'paystack',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

create index if not exists idx_orders_org_created
  on public.orders(organization_id, created_at desc);

create index if not exists idx_orders_payment_status
  on public.orders(payment_status);

create index if not exists idx_orders_creator
  on public.orders(creator_id)
  where creator_id is not null;

create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  provider           text not null,
  provider_reference text,
  provider_event_id  text,
  amount             numeric(12, 2) not null,
  currency           text not null default 'NGN',
  status             text not null default 'pending',
  failure_reason     text,
  paid_at            timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists idx_payments_org_created
  on public.payments(organization_id, created_at desc);

create index if not exists idx_payments_order_id
  on public.payments(order_id);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'payments_provider_reference_unique'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_provider_reference_unique
      unique (provider, provider_reference);
  end if;
exception when others then null;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'payments_provider_event_id_unique'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_provider_event_id_unique
      unique (provider, provider_event_id);
  end if;
exception when others then null;
end $$;

create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  provider                 text not null,
  provider_subscription_id text,
  status                   text not null default 'inactive',
  current_period_end       timestamptz,
  created_at               timestamptz not null default now()
);

create index if not exists idx_subscriptions_org
  on public.subscriptions(organization_id);

create table if not exists public.onboarding_states (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  current_step    text,
  completed       boolean not null default false,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists onboarding_states_user_key
  on public.onboarding_states(user_id);

create index if not exists idx_onboarding_states_org
  on public.onboarding_states(organization_id)
  where organization_id is not null;

create table if not exists public.provider_webhook_events (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid,
  idempotency_key text,
  raw_payload     text,
  created_at      timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'provider_webhook_events_idempotency_unique'
      and conrelid = 'public.provider_webhook_events'::regclass
  ) then
    alter table public.provider_webhook_events
      add constraint provider_webhook_events_idempotency_unique
      unique (tenant_id, idempotency_key);
  end if;
exception when others then null;
end $$;

alter table if exists public.profiles
  add column if not exists organization_id       uuid,
  add column if not exists onboarding_completed  boolean not null default false,
  add column if not exists onboarding_step       text,
  add column if not exists default_storefront_id uuid,
  add column if not exists full_name             text,
  add column if not exists avatar_url            text,
  add column if not exists phone                 text,
  add column if not exists updated_at            timestamptz;

do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'profiles'
      and constraint_name = 'profiles_organization_id_fkey'
      and table_schema = 'public'
  ) then
    alter table public.profiles
      add constraint profiles_organization_id_fkey
      foreign key (organization_id)
      references public.organizations(id)
      on delete set null;
  end if;
exception when others then null;
end $$;

do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'profiles'
      and constraint_name = 'profiles_default_storefront_id_fkey'
      and table_schema = 'public'
  ) then
    alter table public.profiles
      add constraint profiles_default_storefront_id_fkey
      foreign key (default_storefront_id)
      references public.storefronts(id)
      on delete set null;
  end if;
exception when others then null;
end $$;

create index if not exists idx_profiles_organization_id
  on public.profiles(organization_id)
  where organization_id is not null;

create index if not exists idx_profiles_onboarding_completed
  on public.profiles(onboarding_completed)
  where onboarding_completed = false;

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.organizations o
    where o.id = org_id
      and o.owner_id = auth.uid()
  ) or exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

alter table if exists public.organizations           enable row level security;
alter table if exists public.organization_members    enable row level security;
alter table if exists public.storefronts             enable row level security;
alter table if exists public.products                enable row level security;
alter table if exists public.orders                  enable row level security;
alter table if exists public.payments                enable row level security;
alter table if exists public.subscriptions           enable row level security;
alter table if exists public.onboarding_states       enable row level security;
alter table if exists public.provider_webhook_events enable row level security;

drop policy if exists "profiles self" on public.profiles;
create policy "profiles self"
  on public.profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "org visible to members" on public.organizations;
create policy "org visible to members"
  on public.organizations for all
  using (public.is_org_member(id))
  with check (owner_id = auth.uid());

drop policy if exists "org members visible" on public.organization_members;
create policy "org members visible"
  on public.organization_members for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "storefronts org manage" on public.storefronts;
create policy "storefronts org manage"
  on public.storefronts for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "storefronts public read" on public.storefronts;
create policy "storefronts public read"
  on public.storefronts for select
  using (is_active = true);

drop policy if exists "products org manage" on public.products;
create policy "products org manage"
  on public.products for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "products public read" on public.products;
create policy "products public read"
  on public.products for select
  using (status in ('active', 'published'));

drop policy if exists "orders org" on public.orders;
create policy "orders org"
  on public.orders for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "orders public track" on public.orders;
create policy "orders public track"
  on public.orders for select
  using (true);

drop policy if exists "payments org" on public.payments;
create policy "payments org"
  on public.payments for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "subscriptions org" on public.subscriptions;
create policy "subscriptions org"
  on public.subscriptions for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "onboarding_states self" on public.onboarding_states;
create policy "onboarding_states self"
  on public.onboarding_states for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "webhook_events service only" on public.provider_webhook_events;
create policy "webhook_events service only"
  on public.provider_webhook_events for all
  using (false);

insert into storage.buckets (id, name, public)
values
  ('avatars',     'avatars',     false),
  ('storefronts', 'storefronts', false),
  ('products',    'products',    false)
on conflict (id) do nothing;

create or replace function public.resolve_user_context()
returns jsonb language plpgsql security definer as $$
declare
  v_user_id         uuid := auth.uid();
  v_profile         record;
  v_org             record;
  v_storefront      record;
  v_onb_state       record;
  v_route           text;
  v_onboarding_done boolean;
begin
  if v_user_id is null then
    return jsonb_build_object('authenticated', false);
  end if;

  select id, onboarding_completed, organization_id, onboarding_step, full_name
  into v_profile
  from public.profiles
  where id = v_user_id;

  if not found then
    return jsonb_build_object(
      'authenticated', true,
      'has_profile',   false,
      'route',         'onboarding'
    );
  end if;

  if v_profile.organization_id is not null then
    select id, name, slug into v_org
    from public.organizations
    where id = v_profile.organization_id;
  end if;

  if v_org.id is null then
    select o.id, o.name, o.slug into v_org
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = v_user_id
    order by m.created_at asc
    limit 1;
  end if;

  if v_org.id is not null then
    select id, handle, is_active into v_storefront
    from public.storefronts
    where organization_id = v_org.id;
  end if;

  select completed, current_step, metadata into v_onb_state
  from public.onboarding_states
  where user_id = v_user_id;

  v_onboarding_done := coalesce(v_profile.onboarding_completed, false)
    or coalesce(v_onb_state.completed, false);

  if v_onboarding_done and v_org.id is not null then
    v_route := 'dashboard';
  else
    v_route := 'onboarding';
  end if;

  return jsonb_build_object(
    'authenticated',        true,
    'has_profile',          true,
    'onboarding_completed', v_onboarding_done,
    'organization_id',      v_org.id,
    'organization_slug',    v_org.slug,
    'storefront_handle',    v_storefront.handle,
    'storefront_active',    coalesce(v_storefront.is_active, false),
    'onboarding_step',      coalesce(v_onb_state.current_step, v_profile.onboarding_step),
    'route',                v_route
  );
end;
$$;
