-- ============================================================
-- LUMMY — Runtime Orchestrator + Automation Foundation
-- Migration: 003_runtime_automation_foundation.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS runtime_job_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_name TEXT NOT NULL,
  job_id TEXT NOT NULL,
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  UNIQUE(queue_name, job_id, attempt)
);

CREATE INDEX IF NOT EXISTS idx_runtime_job_runs_queue_status ON runtime_job_runs(queue_name, status, started_at DESC);
ALTER TABLE runtime_job_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "runtime_job_runs_select_own_tenant" ON runtime_job_runs
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );

CREATE TABLE IF NOT EXISTS runtime_job_dead_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_name TEXT NOT NULL,
  job_id TEXT NOT NULL,
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  error_message TEXT NOT NULL,
  dead_lettered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runtime_dlq_queue_time ON runtime_job_dead_letters(queue_name, dead_lettered_at DESC);
ALTER TABLE runtime_job_dead_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "runtime_job_dlq_select_own_tenant" ON runtime_job_dead_letters
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant_trigger ON automation_rules(tenant_id, trigger_key, enabled);
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_rules_select_own_tenant" ON automation_rules
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );
CREATE POLICY "automation_rules_insert_own_tenant" ON automation_rules
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );
CREATE POLICY "automation_rules_update_own_tenant" ON automation_rules
  FOR UPDATE USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );

CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_event_id UUID,
  correlation_id TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_tenant_status ON automation_runs(tenant_id, status, started_at DESC);
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_runs_select_own_tenant" ON automation_runs
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );

CREATE TABLE IF NOT EXISTS automation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_events_run ON automation_events(run_id, created_at DESC);
ALTER TABLE automation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_events_select_own_tenant" ON automation_events
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );
