-- ── Migration 048: Coordination, Marketplace + Ecosystem Intelligence ─────────
--
-- 1. priority column on automation_events — enables SLA-aware prioritized
--    processing (1=highest, 10=lowest, default 5)
--
-- 2. creator_rankings — periodic snapshot of creator rankings by composite score
--
-- 3. marketplace_health_snapshots — platform-wide health aggregate history

-- ── Priority-aware event processing ──────────────────────────────────────────

alter table public.automation_events
  add column if not exists priority integer not null default 5
    check (priority between 1 and 10);

-- Priority-ordered index for the processor query
create index if not exists idx_automation_events_priority_queue
  on public.automation_events(status, priority asc, created_at asc)
  where status in ('pending', 'retrying');

-- ── Creator rankings ──────────────────────────────────────────────────────────

create table if not exists public.creator_rankings (
  id             uuid        primary key default gen_random_uuid(),
  creator_id     text        not null,
  snapshot_date  date        not null,
  rank           integer     not null,
  total_creators integer     not null default 0,
  percentile     numeric(5,2) not null default 0,
  revenue_score  numeric(5,2) not null default 0,
  health_score   numeric(5,2) not null default 0,
  engagement_score numeric(5,2) not null default 0,
  composite_score  numeric(5,2) not null default 0,
  niche          text,
  tier           text        not null default 'standard'
    check (tier in ('top_10', 'top_25', 'growth', 'standard', 'new')),
  created_at     timestamptz default now()
);

create unique index if not exists idx_creator_rankings_unique
  on public.creator_rankings(creator_id, snapshot_date);

create index if not exists idx_creator_rankings_date_rank
  on public.creator_rankings(snapshot_date desc, rank asc);

-- ── Marketplace health snapshots ──────────────────────────────────────────────

create table if not exists public.marketplace_health_snapshots (
  id              uuid        primary key default gen_random_uuid(),
  snapshot_date   date        not null,
  active_creators integer     not null default 0,
  new_creators    integer     not null default 0,
  total_revenue_kobo bigint   not null default 0,
  total_orders    integer     not null default 0,
  avg_health_score numeric(5,2) not null default 0,
  avg_conversion_rate numeric(8,4) not null default 0,
  critical_risk_count integer not null default 0,
  published_storefronts integer not null default 0,
  platform_health_score numeric(5,2) not null default 0,
  signals         jsonb       default '{}',
  created_at      timestamptz default now()
);

create unique index if not exists idx_marketplace_health_date
  on public.marketplace_health_snapshots(snapshot_date);

-- ── Add coordination + marketplace + ecosystem workflows ──────────────────────

insert into public.workflow_registry (workflow_id, name, description, status, triggers, queue_name, sla_max_ms)
values
  ('COORD-01', 'Creator Monetization Opportunity',  'Surface monetization opportunity to creator',             'active',
   '["creator_monetization_opportunity"]', 'analytics-jobs', 30000),
  ('COORD-02', 'High Influence Creator Detected',   'Accelerate high-influence creator growth programs',       'active',
   '["creator_high_influence_detected"]',  'analytics-jobs', 30000),
  ('MKT-01',   'Marketplace Health Updated',        'Persist and surface marketplace health snapshot',          'active',
   '["marketplace_health_updated"]',       'analytics-jobs', 30000),
  ('MKT-02',   'Marketplace Conversion Drop',       'Alert on platform-wide conversion decline',               'active',
   '["marketplace_conversion_drop"]',      'analytics-jobs', 15000),
  ('MKT-03',   'Storefront Performance Risk',       'Notify creator of storefront underperformance signals',   'active',
   '["storefront_performance_risk"]',      'analytics-jobs', 30000),
  ('ECO-01',   'Ecosystem Revenue Growth',          'Celebrate and reinforce platform-level revenue growth',   'active',
   '["ecosystem_revenue_growth"]',         'analytics-jobs', 60000),
  ('ECO-02',   'Ecosystem Retention Risk',          'Alert on platform-wide retention decline',                'active',
   '["ecosystem_retention_risk"]',         'analytics-jobs', 30000)
on conflict (workflow_id) do nothing;
