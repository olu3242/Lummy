-- ============================================================
-- Migration 043: Marketplace Intelligence
-- Trending products, creator benchmarks, pricing signals
-- ============================================================

-- ── Marketplace trends ────────────────────────────────────────

create table if not exists public.marketplace_trends (
  id              uuid primary key default gen_random_uuid(),
  period_date     date not null,
  niche           text not null,
  trend_type      text not null,  -- 'top_product_type'|'peak_hour'|'avg_order_value'|'growth_metric'
  value           jsonb not null default '{}'::jsonb,
  sample_size     integer not null default 0,
  created_at      timestamptz not null default now()
);

create unique index if not exists marketplace_trends_period_niche_type_key
  on public.marketplace_trends(period_date, niche, trend_type);

create index if not exists idx_marketplace_trends_date
  on public.marketplace_trends(period_date desc, niche);

-- ── Creator benchmarks ────────────────────────────────────────

create table if not exists public.creator_benchmarks (
  id              uuid primary key default gen_random_uuid(),
  period_date     date not null,
  niche           text not null,
  percentile_10   numeric(12,2) not null default 0,
  percentile_25   numeric(12,2) not null default 0,
  percentile_50   numeric(12,2) not null default 0,   -- median
  percentile_75   numeric(12,2) not null default 0,
  percentile_90   numeric(12,2) not null default 0,
  metric          text not null,                       -- 'monthly_revenue_kobo'|'order_count'|'conversion_rate'
  sample_size     integer not null default 0,
  created_at      timestamptz not null default now()
);

create unique index if not exists creator_benchmarks_period_niche_metric_key
  on public.creator_benchmarks(period_date, niche, metric);

-- ── Viral products signals ────────────────────────────────────

create table if not exists public.viral_products (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid references public.products(id) on delete cascade,
  organization_id   uuid references public.organizations(id) on delete cascade,
  niche             text,
  virality_score    numeric(5,2) not null default 0,   -- 0-100
  whatsapp_clicks   integer not null default 0,
  orders_count      integer not null default 0,
  views_count       integer not null default 0,
  conversion_rate   numeric(5,4) not null default 0,
  computed_at       timestamptz not null default now(),
  period_start      date not null,
  period_end        date not null
);

create index if not exists idx_viral_products_score
  on public.viral_products(virality_score desc, computed_at desc);

create index if not exists idx_viral_products_niche
  on public.viral_products(niche, virality_score desc)
  where niche is not null;

-- ── Pricing signals ───────────────────────────────────────────

create table if not exists public.pricing_signals (
  id              uuid primary key default gen_random_uuid(),
  niche           text not null,
  price_tier      text not null,   -- 'budget'|'mid'|'premium'|'luxury'
  min_price_kobo  bigint not null,
  max_price_kobo  bigint not null,
  avg_conversion_rate numeric(5,4) not null default 0,
  avg_order_count integer not null default 0,
  sample_size     integer not null default 0,
  period_date     date not null,
  created_at      timestamptz not null default now()
);

create unique index if not exists pricing_signals_niche_tier_period_key
  on public.pricing_signals(niche, price_tier, period_date);

-- ── Creator performance snapshots ────────────────────────────

create table if not exists public.creator_performance_snapshots (
  id              uuid primary key default gen_random_uuid(),
  creator_id      text not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  snapshot_date   date not null,
  revenue_kobo    bigint not null default 0,
  order_count     integer not null default 0,
  product_count   integer not null default 0,
  whatsapp_clicks integer not null default 0,
  health_score    numeric(5,2),
  churn_risk      text,           -- 'low'|'medium'|'high'|'critical'
  niche           text,
  created_at      timestamptz not null default now()
);

create unique index if not exists creator_perf_snapshots_creator_date_key
  on public.creator_performance_snapshots(creator_id, snapshot_date);

create index if not exists idx_creator_perf_snapshots_org_date
  on public.creator_performance_snapshots(organization_id, snapshot_date desc)
  where organization_id is not null;

-- ── RLS ───────────────────────────────────────────────────────

alter table if exists public.marketplace_trends           enable row level security;
alter table if exists public.creator_benchmarks           enable row level security;
alter table if exists public.viral_products               enable row level security;
alter table if exists public.pricing_signals              enable row level security;
alter table if exists public.creator_performance_snapshots enable row level security;

-- Marketplace trends and benchmarks: public read (anonymous signals, no PII)
drop policy if exists "marketplace_trends_public_read"   on public.marketplace_trends;
create policy "marketplace_trends_public_read"
  on public.marketplace_trends for select using (true);

drop policy if exists "creator_benchmarks_public_read"   on public.creator_benchmarks;
create policy "creator_benchmarks_public_read"
  on public.creator_benchmarks for select using (true);

drop policy if exists "pricing_signals_public_read"      on public.pricing_signals;
create policy "pricing_signals_public_read"
  on public.pricing_signals for select using (true);

-- Viral products: org members can read their own
drop policy if exists "viral_products_org_read"          on public.viral_products;
create policy "viral_products_org_read"
  on public.viral_products for select
  using (public.is_org_member(organization_id));

-- Performance snapshots: org members can read their own
drop policy if exists "creator_perf_snapshots_org_read"  on public.creator_performance_snapshots;
create policy "creator_perf_snapshots_org_read"
  on public.creator_performance_snapshots for select
  using (public.is_org_member(organization_id));
