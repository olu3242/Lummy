-- ── Migration 047: Operational Intelligence Layer ────────────────────────────
--
-- 1. creator_recommendations — lightweight advisory recommendations persisted
--    from the recommendation engine and emitted as automation events
--
-- 2. operational_intelligence_snapshots — periodic health snapshots from
--    intelligence scoring jobs (runtime, creator, workflow, AI, payment)

-- ── creator_recommendations ───────────────────────────────────────────────────

create table if not exists public.creator_recommendations (
  id               uuid        primary key default gen_random_uuid(),
  creator_id       text        not null,
  organization_id  uuid        references public.organizations(id) on delete cascade,
  type             text        not null
    check (type in (
      'product_optimization', 'pricing', 'storefront', 'messaging',
      'engagement_timing', 'checkout_recovery', 'onboarding',
      'conversion', 'ai_usage', 'workflow'
    )),
  title            text        not null,
  body             text        not null,
  priority         text        not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  status           text        not null default 'pending'
    check (status in ('pending', 'viewed', 'actioned', 'dismissed')),
  correlation_id   text,
  metadata         jsonb       default '{}',
  expires_at       timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_creator_recommendations_creator
  on public.creator_recommendations(creator_id, created_at desc);

create index if not exists idx_creator_recommendations_pending
  on public.creator_recommendations(creator_id, status)
  where status = 'pending';

-- ── operational_intelligence_snapshots ───────────────────────────────────────

create table if not exists public.operational_intelligence_snapshots (
  id              uuid        primary key default gen_random_uuid(),
  snapshot_type   text        not null
    check (snapshot_type in (
      'runtime_health', 'creator_health', 'workflow_health',
      'ai_health', 'payment_health', 'conversion_health'
    )),
  organization_id uuid        references public.organizations(id) on delete cascade,
  score           numeric(5,2) not null,
  signals         jsonb       default '{}',
  alerts          jsonb       default '[]',
  created_at      timestamptz default now()
);

create index if not exists idx_ops_snapshots_type_time
  on public.operational_intelligence_snapshots(snapshot_type, created_at desc);

-- ── Add intelligence-tier workflow entries ────────────────────────────────────

insert into public.workflow_registry (workflow_id, name, description, status, triggers, queue_name, sla_max_ms)
values
  ('INT-01', 'Creator Health Degraded',      'Alert creator and ops when health score drops significantly',     'active',
   '["creator_health_degraded"]',     'analytics-jobs', 30000),
  ('INT-02', 'Creator Revenue Drop',         'Trigger recovery recommendations when revenue drops',             'active',
   '["creator_revenue_drop"]',        'analytics-jobs', 30000),
  ('INT-03', 'Creator Growth Detected',      'Accelerate high-growth creators with optimization recommendations','active',
   '["creator_growth_detected"]',     'analytics-jobs', 30000),
  ('INT-04', 'Creator Churn Risk',           'Proactive retention intervention for at-risk creators',           'active',
   '["creator_churn_risk"]',          'analytics-jobs', 30000),
  ('INT-05', 'Workflow Retry Spike',         'Alert on abnormal retry volume — possible runtime degradation',   'active',
   '["workflow_retry_spike"]',        'analytics-jobs', 15000),
  ('INT-06', 'AI Cost Spike',                'Alert when AI costs spike beyond normal operational range',        'active',
   '["ai_cost_spike"]',               'analytics-jobs', 15000),
  ('INT-07', 'AI Budget Risk',               'Pre-emptive alert before hard cap is reached',                    'active',
   '["ai_budget_risk"]',              'analytics-jobs', 15000),
  ('INT-08', 'Recommendation Generated',     'Persist and surface actionable creator recommendation',           'active',
   '["recommendation_generated"]',    'analytics-jobs', 10000),
  ('INT-09', 'Customer High Value',          'Accelerate engagement for high-value customers',                  'active',
   '["customer_high_value"]',         'payment-jobs',   15000),
  ('INT-10', 'Customer Reengagement Needed', 'Trigger re-engagement workflow for disengaged customers',         'active',
   '["customer_reengagement_needed"]','analytics-jobs', 30000),
  ('INT-11', 'Creator Engagement Drop',      'Alert on engagement drop for active creators',                    'active',
   '["creator_engagement_drop"]',     'analytics-jobs', 30000),
  ('INT-12', 'Creator Revenue Forecast',     'Surface revenue forecast update to creator dashboard',            'active',
   '["creator_revenue_forecast_updated"]', 'analytics-jobs', 30000)
on conflict (workflow_id) do nothing;
