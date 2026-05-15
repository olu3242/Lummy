-- ============================================================
-- LUMMY — Events + Telemetry Foundation
-- Migration: 002_events_telemetry_foundation.sql
-- ============================================================

-- OUTBOX EVENTS
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  actor_id UUID,
  agent_id TEXT,
  agent_id TEXT,
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  occurred_at TIMESTAMPTZ NOT NULL,
  dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_tenant_created ON outbox_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbox_events_dispatch ON outbox_events(dispatched_at) WHERE dispatched_at IS NULL;

ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outbox_select_own_tenant" ON outbox_events
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  actor_id UUID,
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  idempotency_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  occurred_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_events_tenant_time ON events(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_name_time ON events(event_name, occurred_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_own_tenant" ON events
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );

-- EVENT FAILURES
CREATE TABLE IF NOT EXISTS event_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_event_failures_open ON event_failures(tenant_id, resolved_at) WHERE resolved_at IS NULL;
ALTER TABLE event_failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_failures_select_own_tenant" ON event_failures
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );

-- USER SESSIONS
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL UNIQUE,
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  user_id UUID,
  source TEXT NOT NULL DEFAULT 'web',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_last_seen ON user_sessions(tenant_id, last_seen_at DESC);
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_own_tenant" ON user_sessions
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );

-- TELEMETRY LOGS
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_key TEXT NOT NULL,
  tenant_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  source TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_time ON telemetry_logs(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_event_time ON telemetry_logs(event_key, occurred_at DESC);
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telemetry_select_own_tenant" ON telemetry_logs
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );

-- CONVERSION EVENTS
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  user_id UUID,
  conversion_type TEXT NOT NULL,
  amount BIGINT,
  currency TEXT,
  source_event_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversion_tenant_time ON conversion_events(tenant_id, occurred_at DESC);
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversion_select_own_tenant" ON conversion_events
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()) OR has_role('admin')
  );
