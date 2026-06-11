-- ============================================================
-- Migration 004: Storefront publish state + notifications insert
-- ============================================================

-- Add is_published to creator_profiles (storefront live/draft toggle)
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS storefront_published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_creator_profiles_published
  ON creator_profiles(is_published) WHERE is_published = true;

-- Notifications: add service-role insert so backend can create notifications
-- (all SELECT/UPDATE/DELETE already covered by "notifications_own" policy)
DROP POLICY IF EXISTS "notifications_insert_service" ON notifications;
CREATE POLICY "notifications_insert_service" ON notifications
  FOR INSERT TO service_role WITH CHECK (true);

-- Activation metadata on creator_profiles
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS first_product_added_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_sale_at TIMESTAMPTZ;
