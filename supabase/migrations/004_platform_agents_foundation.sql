-- ============================================================
-- LUMMY — Platform + Agent Orchestrator Foundation
-- Migration: 004_platform_agents_foundation.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(key, tenant_id)
);
ALTER TABLE platform_feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_flags_select_admin_or_tenant" ON platform_feature_flags
  FOR SELECT USING (has_role('admin') OR tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  actor_id UUID,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE platform_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_audit_select_admin_or_tenant" ON platform_audit_logs
  FOR SELECT USING (has_role('admin') OR tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL UNIQUE,
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, tenant_id, permission_key)
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id TEXT NOT NULL UNIQUE,
  agent_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  event_id UUID,
  queue_name TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  memory_key TEXT NOT NULL,
  memory_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, agent_id, memory_key)
);

CREATE TABLE IF NOT EXISTS agent_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  tags JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  workflow_key TEXT NOT NULL,
  workflow_version TEXT NOT NULL,
  definition JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, workflow_key, workflow_version)
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  run_id TEXT,
  agent_id TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  run_id TEXT,
  agent_id TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_recovery_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  failure_id UUID REFERENCES agent_failures(id) ON DELETE CASCADE,
  strategy TEXT NOT NULL,
  status TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_recovery_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_select_own_tenant" ON agents FOR SELECT USING (has_role('admin') OR tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "agent_runs_select_own_tenant" ON agent_runs FOR SELECT USING (has_role('admin') OR tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "agent_memory_select_own_tenant" ON agent_memory FOR SELECT USING (has_role('admin') OR tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "agent_metrics_select_own_tenant" ON agent_metrics FOR SELECT USING (has_role('admin') OR tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
