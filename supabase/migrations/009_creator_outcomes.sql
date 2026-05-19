-- Migration 009: Creator outcomes — action tracking, monetization milestones, ecosystem participation

-- Track which guided actions creators have completed
CREATE TABLE IF NOT EXISTS creator_action_completions (
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  action_key  TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_id, action_key)
);
CREATE INDEX IF NOT EXISTS action_completions_creator_idx ON creator_action_completions(creator_id);

-- Revenue / monetization milestones (₦10k, ₦100k, ₦1m, etc.)
CREATE TABLE IF NOT EXISTS creator_monetization_milestones (
  creator_id   UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL,       -- first_sale, revenue_10k, revenue_100k, revenue_1m, orders_10, orders_50
  value_kobo   BIGINT NOT NULL DEFAULT 0,
  achieved_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_id, milestone_key)
);
CREATE INDEX IF NOT EXISTS mon_milestones_creator_idx ON creator_monetization_milestones(creator_id);

-- Ecosystem participation events (lightweight append-only log)
CREATE TABLE IF NOT EXISTS ecosystem_participation_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,  -- referral_sent, collaboration_started, attribution_link_created, cross_promo_shared
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ecosystem_events_creator_idx ON ecosystem_participation_events(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ecosystem_events_type_idx   ON ecosystem_participation_events(activity_type, created_at DESC);

-- RLS
ALTER TABLE creator_action_completions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_monetization_milestones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecosystem_participation_events    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action_completions_owner" ON creator_action_completions
  FOR ALL USING (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "action_completions_service" ON creator_action_completions
  FOR ALL TO service_role USING (true);

CREATE POLICY "mon_milestones_owner" ON creator_monetization_milestones
  FOR ALL USING (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "mon_milestones_service" ON creator_monetization_milestones
  FOR ALL TO service_role USING (true);

CREATE POLICY "ecosystem_events_owner" ON ecosystem_participation_events
  FOR SELECT USING (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "ecosystem_events_service" ON ecosystem_participation_events
  FOR ALL TO service_role USING (true);
