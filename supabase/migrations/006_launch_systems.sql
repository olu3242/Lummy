-- Migration 006: Beta invites, support tickets, feature flags, cohort tags

-- Beta invites
CREATE TABLE IF NOT EXISTS beta_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  email TEXT,
  created_by UUID REFERENCES auth.users(id),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  max_uses INT NOT NULL DEFAULT 1,
  use_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS beta_invites_code_idx ON beta_invites(code);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_creator_idx ON support_tickets(creator_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);

-- Feature flags (server-side only)
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_pct INT NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO feature_flags (key, enabled, rollout_pct, description) VALUES
  ('ai_suggestions',     true,  100, 'AI storefront suggestions'),
  ('beta_invite_gate',   false,   0, 'Require beta invite for signup'),
  ('whatsapp_auto_reply',false,   0, 'Automated WhatsApp replies'),
  ('ai_pricing',         false,  50, 'AI pricing recommendations'),
  ('advanced_analytics', true,  100, 'Advanced growth analytics')
ON CONFLICT (key) DO NOTHING;

-- Creator cohort tags (append-only label per creator)
CREATE TABLE IF NOT EXISTS creator_cohort_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creator_id, tag)
);
CREATE INDEX IF NOT EXISTS creator_cohort_tags_creator_idx ON creator_cohort_tags(creator_id);
CREATE INDEX IF NOT EXISTS creator_cohort_tags_tag_idx ON creator_cohort_tags(tag);

-- RLS policies
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beta_invites_service_only" ON beta_invites USING (false);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_tickets_owner" ON support_tickets
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "support_tickets_service" ON support_tickets
  FOR ALL TO service_role USING (true);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feature_flags_service_only" ON feature_flags USING (false);

ALTER TABLE creator_cohort_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cohort_tags_service_only" ON creator_cohort_tags USING (false);
