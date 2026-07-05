-- Product management convergence: canonical product columns + import jobs.

-- 1. Columns the canonical Product Service and import pipeline need.
--    The live products table is the 029/040 org schema (organization_id/title/status).
alter table public.products add column if not exists sku            text;
alter table public.products add column if not exists slug           text;
alter table public.products add column if not exists category       text;
alter table public.products add column if not exists stock_quantity integer;
alter table public.products add column if not exists updated_at     timestamptz;

-- 2. Per-organization uniqueness for sku and slug (import dedup relies on these).
create unique index if not exists idx_products_org_sku_unique
  on public.products(organization_id, sku)
  where sku is not null;

create unique index if not exists idx_products_org_slug_unique
  on public.products(organization_id, slug)
  where slug is not null;

create index if not exists idx_products_org_status
  on public.products(organization_id, status);

-- 3. Import job history (Products → Import History).
create table if not exists public.product_import_jobs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  file_name       text not null,
  file_type       text not null default 'csv',
  total_rows      integer not null default 0,
  imported_rows   integer not null default 0,
  failed_rows     integer not null default 0,
  status          text not null default 'completed', -- completed | failed | partial
  error_report    jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_product_import_jobs_org
  on public.product_import_jobs(organization_id, created_at desc);

alter table public.product_import_jobs enable row level security;

drop policy if exists "product_import_jobs org" on public.product_import_jobs;
create policy "product_import_jobs org"
  on public.product_import_jobs for all
  using  (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
