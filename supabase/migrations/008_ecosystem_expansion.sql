-- Migration 008: Creator economy expansion — referrals, collaborations, campaign attribution

-- Creator referral codes + attribution
CREATE TABLE IF NOT EXISTS creator_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES creator_profiles(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','activated','rewarded','void')),
  referred_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,   -- when referred creator published store
  first_sale_at TIMESTAMPTZ,  -- when referred made first sale
  reward_amount_kobo BIGINT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON creator_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_code_idx ON creator_referrals(code);
CREATE INDEX IF NOT EXISTS referrals_referred_idx ON creator_referrals(referred_id) WHERE referred_id IS NOT NULL;

-- Creator collaborations
CREATE TABLE IF NOT EXISTS creator_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  collaboration_type TEXT NOT NULL DEFAULT 'cross_promotion' CHECK (collaboration_type IN ('cross_promotion','affiliate','co_campaign','bundle')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','paused','ended')),
  affiliate_code TEXT UNIQUE,
  commission_pct INT NOT NULL DEFAULT 0 CHECK (commission_pct BETWEEN 0 AND 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(initiator_id, partner_id, collaboration_type)
);
CREATE INDEX IF NOT EXISTS collab_initiator_idx ON creator_collaborations(initiator_id);
CREATE INDEX IF NOT EXISTS collab_partner_idx ON creator_collaborations(partner_id);

-- Campaign attribution (WhatsApp / social links)
CREATE TABLE IF NOT EXISTS campaign_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  source TEXT NOT NULL,           -- whatsapp, instagram, tiktok, direct
  medium TEXT,                    -- story, bio, dm, post
  utm_content TEXT,
  attributed_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  attributed_revenue_kobo BIGINT NOT NULL DEFAULT 0,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS attr_creator_idx ON campaign_attributions(creator_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS attr_campaign_idx ON campaign_attributions(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS attr_source_idx ON campaign_attributions(source, clicked_at DESC);

-- RLS
ALTER TABLE creator_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_owner" ON creator_referrals
  FOR ALL USING (referrer_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "referrals_service" ON creator_referrals
  FOR ALL TO service_role USING (true);

ALTER TABLE creator_collaborations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collabs_participant" ON creator_collaborations
  FOR SELECT USING (
    initiator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid())
    OR partner_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "collabs_service" ON creator_collaborations
  FOR ALL TO service_role USING (true);

ALTER TABLE campaign_attributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attr_owner" ON campaign_attributions
  FOR ALL USING (creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "attr_service" ON campaign_attributions
  FOR ALL TO service_role USING (true);
