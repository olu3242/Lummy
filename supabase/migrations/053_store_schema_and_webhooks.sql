-- ============================================================
-- Migration 002: Store schema persistence + webhook retry tracking
-- ============================================================

-- Add store_schema column to creator_profiles
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS store_schema JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Webhook events for retry tracking and dead-letter queue
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,                      -- 'paystack' | 'whatsapp' | 'flutterwave'
  event_type TEXT NOT NULL,
  correlation_id TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'processed' | 'failed' | 'dead'
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_source ON webhook_events(source);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_correlation ON webhook_events(correlation_id);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write webhook events (no user-facing RLS needed)
CREATE POLICY "webhook_events_service_only" ON webhook_events
  USING (false);
