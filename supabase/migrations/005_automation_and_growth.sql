-- ============================================================
-- Migration 005: Automation engine + growth systems
-- ============================================================

-- ─── Funnel events (lightweight creator analytics) ────────────────────────────
CREATE TABLE IF NOT EXISTS funnel_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_creator ON funnel_events(creator_id, event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_name ON funnel_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_user ON funnel_events(user_id, created_at DESC);

ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "funnel_events_owner" ON funnel_events
  FOR ALL USING (user_id = auth.uid() OR creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));
CREATE POLICY "funnel_events_insert_service" ON funnel_events
  FOR INSERT WITH CHECK (true);

-- ─── Automation events ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_events_creator ON automation_events(creator_id, event_name);
CREATE INDEX IF NOT EXISTS idx_automation_events_unprocessed ON automation_events(processed, created_at) WHERE NOT processed;

ALTER TABLE automation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_events_service_only" ON automation_events USING (false);

-- ─── Creator milestones ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  milestone TEXT NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(creator_id, milestone)
);

CREATE INDEX IF NOT EXISTS idx_milestones_creator ON creator_milestones(creator_id, achieved_at DESC);

ALTER TABLE creator_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_owner" ON creator_milestones
  FOR ALL USING (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "milestones_insert_service" ON creator_milestones FOR INSERT WITH CHECK (true);

-- ─── Creator health scores (cached, recomputed daily) ─────────────────────────
CREATE TABLE IF NOT EXISTS creator_health_scores (
  creator_id UUID PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
  activation_score INTEGER NOT NULL DEFAULT 0,  -- 0-100
  engagement_score INTEGER NOT NULL DEFAULT 0,  -- 0-100
  storefront_score INTEGER NOT NULL DEFAULT 0,  -- 0-100
  overall_score INTEGER NOT NULL DEFAULT 0,     -- 0-100
  risk_level TEXT NOT NULL DEFAULT 'unknown',   -- 'healthy' | 'at_risk' | 'churned'
  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE creator_health_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_scores_owner" ON creator_health_scores
  FOR SELECT USING (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "health_scores_service_write" ON creator_health_scores
  FOR ALL WITH CHECK (true);

-- ─── Job run log (idempotent cron) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running', -- 'running' | 'success' | 'failed'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_job_runs_name ON job_runs(job_name, started_at DESC);

ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_runs_service_only" ON job_runs USING (false);
