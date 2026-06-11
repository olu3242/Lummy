-- Migration 052: Intervention system, stability governance, stabilization scaling
-- Adds workflow registry entries for INTV, STAB, SCAL series

-- ── Intervention system log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intervention_system_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine          TEXT NOT NULL,
  interventions_ranked  INT NOT NULL DEFAULT 0,
  events_emitted  INT NOT NULL DEFAULT 0,
  alerts_raised   INT NOT NULL DEFAULT 0,
  duration_ms     INT,
  signals         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intervention_system_log_run_at
  ON intervention_system_log (run_at DESC);

-- ── Stability governance log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stability_governance_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine          TEXT NOT NULL,
  stability_score NUMERIC(5,2),
  events_emitted  INT NOT NULL DEFAULT 0,
  alerts_raised   INT NOT NULL DEFAULT 0,
  duration_ms     INT,
  signals         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stability_governance_log_run_at
  ON stability_governance_log (run_at DESC);

-- ── Stabilization scaling log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stabilization_scaling_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine          TEXT NOT NULL,
  bottlenecks_detected  INT NOT NULL DEFAULT 0,
  events_emitted  INT NOT NULL DEFAULT 0,
  alerts_raised   INT NOT NULL DEFAULT 0,
  duration_ms     INT,
  signals         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stabilization_scaling_log_run_at
  ON stabilization_scaling_log (run_at DESC);

-- ── Workflow registry — Intervention system (INTV series) ───────────────────
INSERT INTO workflow_registry (workflow_id, workflow_name, trigger_event, handler_key, priority, max_retries, timeout_seconds, is_active)
VALUES
  ('INTV-01-01', 'Intervention Engine',              'creator_intervention_required',        'intervention_engine',              2, 3, 120, true),
  ('INTV-01-02', 'Intervention Routing Engine',      'intervention_priority_high',           'intervention_routing_engine',      2, 3, 120, true),
  ('INTV-01-03', 'Intervention Governance Engine',   'governance_intervention_required',     'intervention_governance_engine',   2, 3, 120, true),
  ('INTV-01-04', 'Intervention Compression Engine',  'operational_intervention_required',    'intervention_compression_engine',  3, 3,  90, true)
ON CONFLICT (workflow_id) DO NOTHING;

-- ── Workflow registry — Stability governance (STAB series) ──────────────────
INSERT INTO workflow_registry (workflow_id, workflow_name, trigger_event, handler_key, priority, max_retries, timeout_seconds, is_active)
VALUES
  ('STAB-01-01', 'Governance Stability Engine',       'governance_degradation_detected',      'governance_stability_engine',      2, 3, 120, true),
  ('STAB-01-02', 'Integrity Stabilization Engine',    'marketplace_stability_risk',           'integrity_stabilization_engine',   3, 3,  90, true),
  ('STAB-01-03', 'Trust Stability Engine',            'trust_stability_degraded',             'trust_stability_engine',           3, 3,  90, true),
  ('STAB-01-04', 'Marketplace Sustainability Engine', 'ecosystem_sustainability_risk',        'marketplace_sustainability_engine',4, 3,  90, true),
  ('STAB-01-05', 'Operational Stability Engine',      'operational_instability_detected',     'operational_stability_engine',     2, 3, 120, true)
ON CONFLICT (workflow_id) DO NOTHING;

-- ── Workflow registry — Stabilization scaling (SCAL series) ─────────────────
INSERT INTO workflow_registry (workflow_id, workflow_name, trigger_event, handler_key, priority, max_retries, timeout_seconds, is_active)
VALUES
  ('SCAL-01-01', 'Adaptive Scaling Stabilization Engine',       'scaling_stabilization_required',   'adaptive_scaling_engine',                3, 3, 90, true),
  ('SCAL-01-02', 'Capacity Stabilization Engine',               'scaling_stabilization_required',   'capacity_stabilization_engine',          3, 3, 90, true),
  ('SCAL-01-03', 'Creator Density Stabilization Engine',        'scaling_stabilization_required',   'creator_density_stabilization_engine',   3, 3, 90, true),
  ('SCAL-01-04', 'Bottleneck Stabilization Engine',             'workflow_stabilization_required',  'bottleneck_stabilization_engine',        2, 3, 90, true),
  ('SCAL-01-05', 'Monetization Scaling Engine',                 'monetization_recovery_required',   'monetization_scaling_engine',            2, 3, 90, true)
ON CONFLICT (workflow_id) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE intervention_system_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stability_governance_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stabilization_scaling_log  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON intervention_system_log    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON stability_governance_log   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON stabilization_scaling_log  FOR ALL USING (auth.role() = 'service_role');
