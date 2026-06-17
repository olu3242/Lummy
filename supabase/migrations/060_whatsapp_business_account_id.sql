-- Cloud API tech-provider model needs both IDs to send/receive as a given
-- creator: phone_number_id (added in 059) identifies which number sends, and
-- whatsapp_business_account_id identifies which WABA it belongs to (required
-- by some Graph API calls and useful for support/debugging multi-WABA setups).

alter table public.creator_profiles
  add column if not exists whatsapp_business_account_id text;
