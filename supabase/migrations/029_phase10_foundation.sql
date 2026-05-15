create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  onboarding_completed boolean not null default false,
  onboarding_step text,
  created_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  currency text not null default 'USD',
  country text not null default 'US',
  created_at timestamptz not null default now(),
  unique (owner_id)
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.storefronts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  handle text not null unique,
  bio text,
  theme jsonb,
  hero_image text,
  social_links jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) not null,
  currency text not null default 'USD',
  image_url text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_email text not null,
  status text not null default 'pending',
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  payment_provider text not null default 'stripe',
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  provider_subscription_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.organizations o
    where o.id = org_id and o.owner_id = auth.uid()
  ) or exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.storefronts enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles self" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "org visible to members" on public.organizations for all using (public.is_org_member(id)) with check (owner_id = auth.uid());
create policy "org members visible" on public.organization_members for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "storefronts org" on public.storefronts for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "products org" on public.products for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "orders org" on public.orders for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "subscriptions org" on public.subscriptions for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', false),
  ('storefronts', 'storefronts', false),
  ('products', 'products', false)
on conflict (id) do nothing;
