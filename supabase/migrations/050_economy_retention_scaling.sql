-- Migration 050: Economy, Retention & Scaling Intelligence
-- Adds tables and workflow registry entries for Phase 5 intelligence layers.

-- ── Economy Intelligence Tables ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creator_economy_scores (
  creator_id          TEXT        PRIMARY KEY,
  economy_score       INTEGER     NOT NULL DEFAULT 0 CHECK (economy_score BETWEEN 0 AND 100),
  revenue_growth_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
  avg_order_value     BIGINT      NOT NULL DEFAULT 0,
  repeat_purchase_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  order_velocity      INTEGER     NOT NULL DEFAULT 0,
  computed_at         DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_economy_scores_score
  ON creator_economy_scores (economy_score DESC);

CREATE TABLE IF NOT EXISTS economy_health_snapshots (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date              DATE        NOT NULL UNIQUE,
  total_gmv_30d_kobo         BIGINT      NOT NULL DEFAULT 0,
  growth_rate                NUMERIC(8,4) NOT NULL DEFAULT 0,
  avg_creator_revenue_30d_kobo BIGINT    NOT NULL DEFAULT 0,
  active_creators            INTEGER     NOT NULL DEFAULT 0,
  economy_score              INTEGER     NOT NULL DEFAULT 0 CHECK (economy_score BETWEEN 0 AND 100),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Scaling Coordination Tables ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scaling_bottleneck_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bottleneck_type  TEXT        NOT NULL,
  severity         TEXT        NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_creators INTEGER,
  estimated_revenue_loss_kobo BIGINT,
  recommended_action TEXT      NOT NULL,
  snapshot_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scaling_bottleneck_log_date
  ON scaling_bottleneck_log (snapshot_date DESC);

-- ── Workflow Registry — Economy Intelligence (ECON-01 through ECON-07) ────────

INSERT INTO workflow_registry (workflow_id, event_name, description, sla_minutes, max_retries, priority, is_active)
VALUES
  ('ECON-01', 'creator_high_growth',            'Notify creator of high WoW revenue growth',        60,  3, 4, true),
  ('ECON-02', 'creator_revenue_accelerated',     'Notify creator of revenue acceleration signal',    60,  3, 4, true),
  ('ECON-03', 'creator_profitability_growth',    'Notify creator of AOV growth milestone',          120,  2, 5, true),
  ('ECON-04', 'creator_scaling_opportunity',     'Notify creator of scaling opportunity signal',    120,  2, 5, true),
  ('ECON-05', 'repeat_purchase_accelerated',     'Notify creator of repeat purchase rate improvement', 120, 2, 5, true),
  ('ECON-06', 'economy_health_updated',          'Log platform economy health snapshot',            240,  1, 9, true),
  ('ECON-07', 'creator_ecosystem_influence_growth', 'Notify creator of ecosystem influence growth', 240, 2, 7, true)
ON CONFLICT (workflow_id) DO UPDATE SET
  event_name  = EXCLUDED.event_name,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();

-- ── Workflow Registry — Retention Intelligence (RET-01 through RET-07) ────────

INSERT INTO workflow_registry (workflow_id, event_name, description, sla_minutes, max_retries, priority, is_active)
VALUES
  ('RET-01', 'creator_retention_risk',             'Alert creator about retention risk signal',        30,  3, 3, true),
  ('RET-02', 'customer_churn_risk',                'Alert creator about high-risk churning customer',  60,  3, 3, true),
  ('RET-03', 'customer_retention_recovery_needed', 'Alert creator to take recovery action',            60,  3, 3, true),
  ('RET-04', 'customer_repeat_purchase_growth',    'Notify creator of repeat purchase growth',        120,  2, 6, true),
  ('RET-05', 'customer_community_growth',          'Notify creator of community growth milestone',    120,  2, 7, true),
  ('RET-06', 'loyalty_acceleration',               'Notify creator of loyalty tier achievement',      120,  2, 6, true),
  ('RET-07', 'engagement_decay',                   'Alert creator of storefront traffic decay',        60,  3, 4, true)
ON CONFLICT (workflow_id) DO UPDATE SET
  event_name  = EXCLUDED.event_name,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();

-- ── Workflow Registry — Scaling Coordination (SCALE-01 through SCALE-08) ─────

INSERT INTO workflow_registry (workflow_id, event_name, description, sla_minutes, max_retries, priority, is_active)
VALUES
  ('SCALE-01', 'scaling_governance_alert',           'Ops alert for system health threshold breach',    15,  2, 2, true),
  ('SCALE-02', 'marketplace_scaling_bottleneck',     'Ops alert for marketplace scaling bottleneck',    30,  2, 3, true),
  ('SCALE-03', 'ecosystem_integrity_risk',           'Ops alert for ecosystem integrity risk',          30,  2, 3, true),
  ('SCALE-04', 'monetization_anomaly',               'Ops alert for revenue/refund anomaly',            30,  2, 3, true),
  ('SCALE-05', 'creator_acquisition_opportunity',    'Log creator acquisition opportunity signal',     480,  1, 8, true),
  ('SCALE-06', 'localized_monetization_opportunity', 'Log localized monetization opportunity',         480,  1, 8, true),
  ('SCALE-07', 'region_high_growth',                 'Log regional high growth signal',                480,  1, 8, true),
  ('SCALE-08', 'discovery_optimization_recommended', 'Log discovery optimization recommendation',      240,  1, 7, true)
ON CONFLICT (workflow_id) DO UPDATE SET
  event_name  = EXCLUDED.event_name,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();
