-- ── Migration 049: Trust, Discovery & Marketplace Expansion Intelligence ─────
--
-- 1. creator_trust_scores — per-creator trust scores computed by trust engine
-- 2. marketplace_integrity_snapshots — daily platform-wide integrity aggregate
-- 3. marketplace_memory — lightweight key-value continuity store (Phase 9)
-- 4. Workflow registry entries for all new trust/discovery/expansion events

-- ── Creator Trust Scores ──────────────────────────────────────────────────────

create table if not exists public.creator_trust_scores (
  creator_id            uuid primary key references public.creator_profiles(id) on delete cascade,
  trust_score           integer not null default 60 check (trust_score between 0 and 100),
  tier                  text not null default 'standard'
                          check (tier in ('verified', 'trusted', 'standard', 'at_risk')),
  fulfillment_rate      numeric(5,2) not null default 70.0,
  response_consistency  numeric(5,2) not null default 60.0,
  payment_reliability   numeric(5,2) not null default 80.0,
  dispute_frequency     numeric(5,2) not null default 90.0,
  tenure_bonus          integer not null default 0 check (tenure_bonus between 0 and 20),
  signals               text[] not null default '{}',
  computed_at           date not null default current_date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_creator_trust_scores_tier
  on public.creator_trust_scores(tier);

create index if not exists idx_creator_trust_scores_score
  on public.creator_trust_scores(trust_score desc);

-- ── Marketplace Integrity Snapshots ──────────────────────────────────────────

create table if not exists public.marketplace_integrity_snapshots (
  id                      uuid primary key default gen_random_uuid(),
  snapshot_date           date not null unique,
  overall_integrity_score integer not null check (overall_integrity_score between 0 and 100),
  trust_score             numeric(5,2) not null default 70.0,
  dispute_score           numeric(5,2) not null default 90.0,
  fraud_score             numeric(5,2) not null default 95.0,
  high_risk_creators      integer not null default 0,
  signals                 text[] not null default '{}',
  created_at              timestamptz not null default now()
);

create index if not exists idx_marketplace_integrity_date
  on public.marketplace_integrity_snapshots(snapshot_date desc);

-- ── Marketplace Memory (Phase 9 continuity) ───────────────────────────────────
-- Lightweight key-value store for operational marketplace history.
-- Keys are namespaced: "trust:{creatorId}", "discovery:{date}", "expansion:{type}", etc.

create table if not exists public.marketplace_memory (
  id            uuid primary key default gen_random_uuid(),
  namespace     text not null,              -- "trust", "discovery", "expansion", "integrity"
  entity_id     text not null,              -- creatorId, "platform", or custom key
  memory_key    text not null,
  memory_value  jsonb not null default '{}',
  expires_at    timestamptz,               -- null = permanent
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (namespace, entity_id, memory_key)
);

create index if not exists idx_marketplace_memory_lookup
  on public.marketplace_memory(namespace, entity_id);

create index if not exists idx_marketplace_memory_expires
  on public.marketplace_memory(expires_at)
  where expires_at is not null;

-- ── Workflow Registry: Trust Intelligence ─────────────────────────────────────

insert into public.workflow_registry
  (workflow_id, event_name, description, sla_minutes, priority, is_active)
values
  ('TRUST-01', 'creator_trust_improved',       'Trust improvement notification',     60,   6, true),
  ('TRUST-02', 'creator_trust_degraded',       'Trust degradation alert + review',   30,   3, true),
  ('TRUST-03', 'creator_high_reliability',     'High reliability badge + notify',    120,  7, true),
  ('TRUST-04', 'creator_dispute_risk',         'Dispute risk intervention',          30,   3, true),
  ('TRUST-05', 'creator_reputation_drop',      'Reputation drop creator alert',      60,   4, true),
  ('TRUST-06', 'creator_network_growth_detected', 'Network growth notification',     120,  6, true),
  ('TRUST-07', 'creator_collaboration_opportunity', 'Collaboration invite trigger',  120,  5, true),
  ('TRUST-08', 'creator_fulfillment_risk',     'Fulfillment risk ops alert',         30,   3, true),
  ('TRUST-09', 'customer_trust_risk',          'Customer trust ops flag',            30,   3, true),
  ('TRUST-10', 'customer_fraud_risk',          'Fraud risk escalation',              15,   2, true),
  ('TRUST-11', 'suspicious_checkout_detected', 'Suspicious checkout ops alert',      15,   2, true),
  ('TRUST-12', 'dispute_spike_detected',       'Dispute spike ops alert',            15,   2, true),
  ('TRUST-13', 'marketplace_integrity_risk',   'Integrity risk platform alert',      15,   2, true),
  ('TRUST-14', 'marketplace_trust_degradation','Trust degradation platform alert',   30,   3, true)
on conflict (workflow_id) do nothing;

-- ── Workflow Registry: Discovery Intelligence ─────────────────────────────────

insert into public.workflow_registry
  (workflow_id, event_name, description, sla_minutes, priority, is_active)
values
  ('DISC-01', 'creator_trending',                'Trending creator notify + boost',  60,   4, true),
  ('DISC-02', 'creator_discovery_boost',         'Discovery boost creator notify',   120,  5, true),
  ('DISC-03', 'storefront_discovery_accelerated','Discovery acceleration signal',    120,  6, true),
  ('DISC-04', 'storefront_recommendation_generated', 'Recommendation surfaced',     120,  7, true),
  ('DISC-05', 'customer_match_high_confidence',  'High-confidence match signal',     60,   4, true),
  ('DISC-06', 'customer_discovery_accelerated',  'Customer discovery signal',        120,  7, true),
  ('DISC-07', 'customer_referral_detected',      'Referral detected + notify',       60,   4, true),
  ('DISC-08', 'customer_loyalty_accelerated',    'Loyalty acceleration notify',      120,  6, true),
  ('DISC-09', 'conversion_priority_high',        'High priority conversion window',  30,   2, true)
on conflict (workflow_id) do nothing;

-- ── Workflow Registry: Expansion Events ──────────────────────────────────────

insert into public.workflow_registry
  (workflow_id, event_name, description, sla_minutes, priority, is_active)
values
  ('EXP-01', 'creator_referral_opportunity',   'Referral opportunity notify',        120,  5, true),
  ('EXP-02', 'ecosystem_network_acceleration', 'Network acceleration ops signal',    120,  8, true),
  ('EXP-03', 'ecosystem_monetization_opportunity', 'Monetization opportunity ops',   120,  7, true),
  ('EXP-04', 'category_high_growth',           'High-growth category ops signal',    120,  8, true),
  ('EXP-05', 'ecosystem_expansion_opportunity','Expansion opportunity ops signal',   120,  8, true),
  ('EXP-06', 'geography_expansion_opportunity','Geography expansion ops signal',     120,  9, true),
  ('EXP-07', 'creator_network_scaling',        'Network scaling ops signal',         120,  9, true)
on conflict (workflow_id) do nothing;

-- ── Priority Map: trust events get elevated priority in PRIORITY_RULES ────────
-- (These complement the coordination-events.ts PRIORITY_RULES — DB is source of truth
--  for workflow_registry; the code table handles real-time event queue ordering)

-- Update priority for trust events in automation_events (applied via priority-engine)
-- The workflow_registry sla_minutes drives SLA tracking; priority column drives queue ordering.
