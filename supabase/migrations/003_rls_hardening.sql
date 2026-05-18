-- ============================================================
-- Migration 003: RLS hardening, idempotency, storage security
-- ============================================================

-- ─── Fix WhatsApp event insert — validate creator exists ──────────────────────
DROP POLICY IF EXISTS "whatsapp_events_insert_public" ON whatsapp_events;
CREATE POLICY "whatsapp_events_insert_validated" ON whatsapp_events
  FOR INSERT WITH CHECK (
    creator_id IN (SELECT id FROM creator_profiles WHERE is_active = true)
  );

-- ─── Transactions: add idempotency_key for webhook dedup ──────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'transactions' AND constraint_name = 'transactions_idempotency_key_unique'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_idempotency_key_unique UNIQUE (idempotency_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_idempotency
  ON transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ─── Webhook events: event_hash for replay detection ──────────────────────────
ALTER TABLE webhook_events
  ADD COLUMN IF NOT EXISTS event_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_hash
  ON webhook_events(event_hash) WHERE event_hash IS NOT NULL;

-- ─── Missing performance indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON orders(payment_status, creator_id);

CREATE INDEX IF NOT EXISTS idx_transactions_provider_creator
  ON transactions(provider, creator_id);

CREATE INDEX IF NOT EXISTS idx_ai_generations_model_date
  ON ai_generations(model, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_events_type_creator
  ON whatsapp_events(event_type, creator_id);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_active
  ON creator_profiles(is_active) WHERE is_active = true;

-- ─── Storage: bucket definitions and access policies ──────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('creator-assets', 'creator-assets', true, 10485760,
   ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('product-images', 'product-images', true, 10485760,
   ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- creator-assets: authenticated upload to own folder (folder = creator profile id)
DROP POLICY IF EXISTS "creator_assets_upload_own" ON storage.objects;
CREATE POLICY "creator_assets_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'creator-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM creator_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "creator_assets_read_public" ON storage.objects;
CREATE POLICY "creator_assets_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'creator-assets');

DROP POLICY IF EXISTS "creator_assets_delete_own" ON storage.objects;
CREATE POLICY "creator_assets_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'creator-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM creator_profiles WHERE user_id = auth.uid()
    )
  );

-- product-images: same ownership model
DROP POLICY IF EXISTS "product_images_upload_own" ON storage.objects;
CREATE POLICY "product_images_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM creator_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_images_read_public" ON storage.objects;
CREATE POLICY "product_images_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_delete_own" ON storage.objects;
CREATE POLICY "product_images_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM creator_profiles WHERE user_id = auth.uid()
    )
  );
