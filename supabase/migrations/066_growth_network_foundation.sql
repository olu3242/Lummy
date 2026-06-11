-- Phase 22-24 growth foundation: discovery, revenue expansion, and retention primitives.

create table if not exists public.discovery_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  storefront_id   uuid references public.storefronts(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  event_type      text not null check (event_type in ('store_view','product_view','discover_click','promotion_click','follow','save')),
  source          text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists discovery_events_org_created_idx
  on public.discovery_events(organization_id, created_at desc);
create index if not exists discovery_events_storefront_created_idx
  on public.discovery_events(storefront_id, created_at desc);
create index if not exists discovery_events_product_created_idx
  on public.discovery_events(product_id, created_at desc)
  where product_id is not null;

create table if not exists public.creator_followers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_email  text,
  customer_phone  text,
  channel         text not null default 'email' check (channel in ('email','whatsapp','sms')),
  status          text not null default 'active' check (status in ('active','unsubscribed','bounced')),
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

create unique index if not exists creator_followers_org_email_key
  on public.creator_followers(organization_id, lower(customer_email))
  where customer_email is not null;
create unique index if not exists creator_followers_org_phone_key
  on public.creator_followers(organization_id, customer_phone)
  where customer_phone is not null;

create table if not exists public.saved_stores (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_email  text not null,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create unique index if not exists saved_stores_org_email_key
  on public.saved_stores(organization_id, lower(customer_email));

create table if not exists public.saved_products (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  customer_email  text not null,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create unique index if not exists saved_products_product_email_key
  on public.saved_products(product_id, lower(customer_email));

create table if not exists public.storefront_collections (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title           text not null,
  slug            text not null,
  description     text,
  is_public       boolean not null default true,
  starts_at       timestamptz,
  ends_at         timestamptz,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  unique(organization_id, slug)
);

create index if not exists storefront_collections_public_idx
  on public.storefront_collections(organization_id, slug)
  where is_public = true;

create table if not exists public.storefront_collection_products (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.storefront_collections(id) on delete cascade,
  product_id    uuid not null references public.products(id) on delete cascade,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  unique(collection_id, product_id)
);

create index if not exists storefront_collection_products_collection_idx
  on public.storefront_collection_products(collection_id, position);

create table if not exists public.product_relationships (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  product_id         uuid not null references public.products(id) on delete cascade,
  related_product_id uuid not null references public.products(id) on delete cascade,
  relationship_type  text not null default 'related' check (relationship_type in ('related','frequently_bought_together','order_bump','upsell')),
  weight             numeric(8, 2) not null default 1,
  created_at         timestamptz not null default now(),
  unique(product_id, related_product_id, relationship_type),
  check(product_id <> related_product_id)
);

create index if not exists product_relationships_product_idx
  on public.product_relationships(product_id, relationship_type, weight desc);

create table if not exists public.promotion_links (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug            text not null,
  title           text not null,
  discount_type   text not null check (discount_type in ('percentage','fixed')),
  discount_value  numeric(12, 2) not null check (discount_value >= 0),
  starts_at       timestamptz,
  ends_at         timestamptz,
  is_active       boolean not null default true,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  unique(organization_id, slug)
);

create index if not exists promotion_links_active_idx
  on public.promotion_links(organization_id, slug)
  where is_active = true;

create table if not exists public.promotion_link_events (
  id                uuid primary key default gen_random_uuid(),
  promotion_link_id uuid not null references public.promotion_links(id) on delete cascade,
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  order_id          uuid references public.orders(id) on delete set null,
  event_type        text not null check (event_type in ('visit','checkout_started','order_paid')),
  amount            numeric(12, 2),
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists promotion_link_events_link_created_idx
  on public.promotion_link_events(promotion_link_id, created_at desc);

alter table public.discovery_events enable row level security;
alter table public.creator_followers enable row level security;
alter table public.saved_stores enable row level security;
alter table public.saved_products enable row level security;
alter table public.storefront_collections enable row level security;
alter table public.storefront_collection_products enable row level security;
alter table public.product_relationships enable row level security;
alter table public.promotion_links enable row level security;
alter table public.promotion_link_events enable row level security;

drop policy if exists "discovery events org manage" on public.discovery_events;
create policy "discovery events org manage"
  on public.discovery_events for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "followers org manage" on public.creator_followers;
create policy "followers org manage"
  on public.creator_followers for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "followers public insert" on public.creator_followers;
create policy "followers public insert"
  on public.creator_followers for insert
  with check (customer_email is not null or customer_phone is not null);

drop policy if exists "saved stores org manage" on public.saved_stores;
create policy "saved stores org manage"
  on public.saved_stores for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "saved stores public insert" on public.saved_stores;
create policy "saved stores public insert"
  on public.saved_stores for insert
  with check (customer_email is not null);

drop policy if exists "saved products org manage" on public.saved_products;
create policy "saved products org manage"
  on public.saved_products for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "saved products public insert" on public.saved_products;
create policy "saved products public insert"
  on public.saved_products for insert
  with check (customer_email is not null);

drop policy if exists "collections public read" on public.storefront_collections;
create policy "collections public read"
  on public.storefront_collections for select
  using (is_public = true);

drop policy if exists "collections org manage" on public.storefront_collections;
create policy "collections org manage"
  on public.storefront_collections for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "collection products public read" on public.storefront_collection_products;
create policy "collection products public read"
  on public.storefront_collection_products for select
  using (exists (
    select 1
    from public.storefront_collections c
    where c.id = collection_id
      and c.is_public = true
  ));

drop policy if exists "collection products org manage" on public.storefront_collection_products;
create policy "collection products org manage"
  on public.storefront_collection_products for all
  using (exists (
    select 1
    from public.storefront_collections c
    where c.id = collection_id
      and public.is_org_member(c.organization_id)
  ))
  with check (exists (
    select 1
    from public.storefront_collections c
    where c.id = collection_id
      and public.is_org_member(c.organization_id)
  ));

drop policy if exists "product relationships public read" on public.product_relationships;
create policy "product relationships public read"
  on public.product_relationships for select
  using (true);

drop policy if exists "product relationships org manage" on public.product_relationships;
create policy "product relationships org manage"
  on public.product_relationships for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "promotion links public read" on public.promotion_links;
create policy "promotion links public read"
  on public.promotion_links for select
  using (is_active = true);

drop policy if exists "promotion links org manage" on public.promotion_links;
create policy "promotion links org manage"
  on public.promotion_links for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "promotion link events org manage" on public.promotion_link_events;
create policy "promotion link events org manage"
  on public.promotion_link_events for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "promotion link events public insert" on public.promotion_link_events;
create policy "promotion link events public insert"
  on public.promotion_link_events for insert
  with check (event_type in ('visit','checkout_started'));
