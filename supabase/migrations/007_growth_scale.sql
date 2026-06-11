-- Migration 007: Growth + scale optimization tables

-- Creator experiment assignments (lightweight A/B)
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  variants JSONB NOT NULL DEFAULT '["control","treatment"]',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_key TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted BOOLEAN NOT NULL DEFAULT false,
  converted_at TIMESTAMPTZ,
  UNIQUE(experiment_key, creator_id)
);
CREATE INDEX IF NOT EXISTS exp_assignments_key_idx ON experiment_assignments(experiment_key, variant);

-- Creator engagement events (streaks, milestones, momentum)
CREATE TABLE IF NOT EXISTS creator_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS eng_events_creator_idx ON creator_engagement_events(creator_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS eng_events_type_idx ON creator_engagement_events(event_type, occurred_at DESC);

-- Churn risk scores (updated by scoring job)
CREATE TABLE IF NOT EXISTS creator_churn_scores (
  creator_id UUID PRIMARY KEY REFERENCES creator_profiles(id) ON DELETE CASCADE,
  risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  risk_tier TEXT NOT NULL DEFAULT 'low' CHECK (risk_tier IN ('low','medium','high','critical')),
  signals JSONB DEFAULT '[]',
  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experiments_service_only" ON experiments USING (false);

ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exp_assignments_owner" ON experiment_assignments
  FOR SELECT USING (auth.uid() = (
    SELECT user_id FROM creator_profiles WHERE id = creator_id LIMIT 1
  ));
CREATE POLICY "exp_assignments_service" ON experiment_assignments
  FOR ALL TO service_role USING (true);

ALTER TABLE creator_engagement_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eng_events_service_only" ON creator_engagement_events USING (false);

ALTER TABLE creator_churn_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "churn_scores_owner" ON creator_churn_scores
  FOR SELECT USING (auth.uid() = (
    SELECT user_id FROM creator_profiles WHERE id = creator_id LIMIT 1
  ));
CREATE POLICY "churn_scores_service" ON creator_churn_scores
  FOR ALL TO service_role USING (true);

-- Seed experiments
INSERT INTO experiments (key, name, description, variants) VALUES
  ('onboarding_cta',   'Onboarding CTA Copy',    'Test different CTA labels on onboarding step 1', '["control","treatment_a"]'),
  ('storefront_hero',  'Storefront Hero Layout',  'Centered vs split hero layout',                  '["control","split_left"]'),
  ('whatsapp_cta',     'WhatsApp CTA Label',      'Chat to buy vs Order on WhatsApp',               '["control","treatment_a"]')
ON CONFLICT (key) DO NOTHING;
