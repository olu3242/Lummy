-- src/app/api/webhooks/whatsapp/route.ts already queries
-- creator_profiles.whatsapp_phone_number_id to resolve which creator owns an
-- inbound Meta Cloud API message, but no migration ever created that column —
-- every lookup silently failed and fell back to phone-suffix matching only.
-- This adds the column so creators issued their own Cloud API phone number
-- (under Lummy's WhatsApp Business Account, tech-provider model) can be
-- resolved directly.

alter table public.creator_profiles
  add column if not exists whatsapp_phone_number_id text;

create unique index if not exists idx_creator_profiles_whatsapp_phone_number_id
  on public.creator_profiles(whatsapp_phone_number_id)
  where whatsapp_phone_number_id is not null;
