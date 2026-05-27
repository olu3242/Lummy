-- ============================================================
-- Migration 010: WhatsApp inbox workflow state
-- ============================================================

-- Add inbox workflow columns to whatsapp_events
ALTER TABLE whatsapp_events
  ADD COLUMN IF NOT EXISTS is_read         BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_followed_up  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_note    TEXT,
  ADD COLUMN IF NOT EXISTS followed_up_at  TIMESTAMPTZ;

-- Conversation events (type='conversation') start as unread
UPDATE whatsapp_events
  SET is_read = false
  WHERE event_type = 'conversation' AND is_read = true;

-- Inbox query index: creator + type + created_at (covers pagination)
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_inbox
  ON whatsapp_events(creator_id, event_type, created_at DESC)
  WHERE event_type = 'conversation';

-- Unread count index
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_unread
  ON whatsapp_events(creator_id, is_read)
  WHERE event_type = 'conversation' AND is_read = false;

-- Repeat sender index: sender phone lookup in metadata
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_sender
  ON whatsapp_events USING gin(metadata)
  WHERE event_type = 'conversation';
