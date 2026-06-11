-- Migration 051: Kernel Intelligence, Governance, Revenue Stability, Recovery, Scaling Kernel
-- Adds tables and workflow registry entries for Phases 1-12 intelligence compression.

-- ── Kernel Intelligence Tables ────────────────────────────────────────────────

-- Operational truth snapshots (compressed canonical scores, stored in marketplace_memory)
-- marketplace_memory table already exists from migration 049 — no new table needed.

-- Intervention log (persistent ranked intervention history)
CREATE TABLE IF NOT EXISTS kernel_intervention_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category         TEXT        NOT NULL CHECK (category IN ('creator','monetization','retention','scaling','governance','operational')),
  creator_id       TEXT,
  title            TEXT        NOT NULL,
  urgency          TEXT        NOT NULL CHECK (urgency IN ('critical','high','medium')),
  score            INTEGER     NOT NULL CHECK (score BETWEEN 0 AND 100),
  signal           TEXT        NOT NULL,
  recommended_action TEXT      NOT NULL,
  resolved         BOOLEAN     NOT NULL DEFAULT false,
  resolved_at      TIMESTAMPTZ,
  snapshot_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kernel_intervention_log_category
  ON kernel_intervention_log (category, score DESC);
CREATE INDEX IF NOT EXISTS idx_kernel_intervention_log_date
  ON kernel_intervention_log (snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_kernel_intervention_log_creator
  ON kernel_intervention_log (creator_id) WHERE creator_id IS NOT NULL;

-- ── Governance Kernel Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS governance_snapshots (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date          DATE        NOT NULL UNIQUE,
  marketplace_score      INTEGER     NOT NULL DEFAULT 0 CHECK (marketplace_score BETWEEN 0 AND 100),
  trust_score            INTEGER     NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  integrity_score        INTEGER     NOT NULL DEFAULT 0 CHECK (integrity_score BETWEEN 0 AND 100),
  monetization_score     INTEGER     NOT NULL DEFAULT 0 CHECK (monetization_score BETWEEN 0 AND 100),
  retention_score        INTEGER     NOT NULL DEFAULT 0 CHECK (retention_score BETWEEN 0 AND 100),
  composite_score        INTEGER     NOT NULL DEFAULT 0 CHECK (composite_score BETWEEN 0 AND 100),
  alerts_raised          INTEGER     NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Workflow Registry — Kernel Intelligence (KERN-01 through KERN-06) ─────────

INSERT INTO workflow_registry (workflow_id, event_name, description, sla_minutes, max_retries, priority, is_active)
VALUES
  ('KERN-01', 'intervention_priority_high',         'Log and route critical ranked intervention',    15,  2, 2, true),
  ('KERN-02', 'monetization_intervention_required', 'Route monetization risk intervention',          30,  2, 2, true),
  ('KERN-03', 'retention_intervention_required',    'Route retention risk intervention',             30,  2, 2, true),
  ('KERN-04', 'governance_intervention_required',   'Route governance risk intervention',            30,  2, 2, true),
  ('KERN-05', 'scaling_intervention_required',      'Route scaling bottleneck intervention',         60,  2, 3, true),
  ('KERN-06', 'operational_intervention_required',  'Alert ops team of runtime health degradation',  15,  2, 2, true)
ON CONFLICT (workflow_id) DO UPDATE SET
  event_name  = EXCLUDED.event_name,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();

-- ── Workflow Registry — Governance Kernel (GOV-01 through GOV-04) ────────────

INSERT INTO workflow_registry (workflow_id, event_name, description, sla_minutes, max_retries, priority, is_active)
VALUES
  ('GOV-01', 'marketplace_governance_risk',     'Log marketplace governance degradation',    60,  1, 3, true),
  ('GOV-02', 'marketplace_sustainability_risk', 'Alert on marketplace sustainability risk',  60,  1, 3, true),
  ('GOV-03', 'trust_governance_degraded',       'Alert on platform trust governance drop',   60,  2, 3, true),
  ('GOV-04', 'monetization_governance_alert',   'Alert on monetization governance issue',    30,  2, 3, true)
ON CONFLICT (workflow_id) DO UPDATE SET
  event_name  = EXCLUDED.event_name,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();

-- ── Workflow Registry — Revenue Stability (REV-01 through REV-05) ────────────

INSERT INTO workflow_registry (workflow_id, event_name, description, sla_minutes, max_retries, priority, is_active)
VALUES
  ('REV-01', 'creator_revenue_risk',               'Alert creator and ops on revenue risk',       30,  3, 3, true),
  ('REV-02', 'monetization_interruption_detected', 'Alert on monetization interruption',          15,  3, 2, true),
  ('REV-03', 'payout_degradation_detected',        'Alert creator on payment failures',           15,  3, 2, true),
  ('REV-04', 'creator_revenue_stabilized',         'Confirm creator revenue recovery',           120,  1, 7, true),
  ('REV-05', 'ecosystem_revenue_stabilized',       'Log ecosystem revenue stabilization',        240,  1, 8, true)
ON CONFLICT (workflow_id) DO UPDATE SET
  event_name  = EXCLUDED.event_name,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();

-- ── Workflow Registry — Recovery Kernel (REC-01 through REC-05) ──────────────

INSERT INTO workflow_registry (workflow_id, event_name, description, sla_minutes, max_retries, priority, is_active)
VALUES
  ('REC-01', 'creator_recovery_required',    'Notify creator to reactivate store',          60,  3, 3, true),
  ('REC-02', 'customer_recovery_required',   'Notify creator to re-engage customers',       60,  3, 3, true),
  ('REC-03', 'engagement_recovery_required', 'Notify creator of engagement decay recovery', 120, 2, 4, true),
  ('REC-04', 'storefront_recovery_required', 'Notify creator to refresh storefront',        120, 2, 4, true),
  ('REC-05', 'lifecycle_recovery_required',  'Notify creator of lifecycle recovery action', 120, 2, 4, true)
ON CONFLICT (workflow_id) DO UPDATE SET
  event_name  = EXCLUDED.event_name,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();

-- ── Workflow Registry — Scaling Kernel (SKL-01 through SKL-05) ───────────────

INSERT INTO workflow_registry (workflow_id, event_name, description, sla_minutes, max_retries, priority, is_active)
VALUES
  ('SKL-01', 'scaling_bottleneck_detected',   'Log category-level scaling bottleneck',    60,  1, 3, true),
  ('SKL-02', 'marketplace_capacity_risk',     'Alert on marketplace capacity pressure',   30,  2, 3, true),
  ('SKL-03', 'creator_density_high_growth',   'Log creator density growth signal',       240,  1, 8, true),
  ('SKL-04', 'category_saturation_detected',  'Log category saturation signal',          240,  1, 7, true),
  ('SKL-05', 'scaling_coordination_required', 'Alert on cross-module scaling pressure',   30,  2, 3, true)
ON CONFLICT (workflow_id) DO UPDATE SET
  event_name  = EXCLUDED.event_name,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();
