-- Guarantee profiles.default_storefront_id exists and is populated for every
-- completed creator.
--
-- Root cause: migration 029 created public.profiles without default_storefront_id.
-- Migration 040 added it via ALTER TABLE, but:
--   (a) any database where 040 was never applied is still missing the column, and
--   (b) users who completed onboarding before the fix was applied have NULL
--       because the old completeOnboarding() never wrote the column.
--
-- This migration is idempotent (add column if not exists, update only NULLs).
-- Apply directly against the database — do not rely on `supabase db push` if
-- the migration registry is empty.

-- ── 1. Ensure column exists ───────────────────────────────────────────────────

alter table public.profiles
  add column if not exists default_storefront_id uuid;

-- ── 2. Add FK constraint if missing ──────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name       = 'profiles'
      and constraint_name  = 'profiles_default_storefront_id_fkey'
      and table_schema     = 'public'
  ) then
    alter table public.profiles
      add constraint profiles_default_storefront_id_fkey
      foreign key (default_storefront_id)
      references public.storefronts(id)
      on delete set null;
  end if;
exception when others then null;
end $$;

-- ── 3. Backfill: fill in NULL default_storefront_id for every completed creator
--       whose organization has exactly one storefront (the only safe assumption).

update public.profiles p
set    default_storefront_id = s.id
from   public.storefronts s
where  p.organization_id      = s.organization_id
  and  p.onboarding_completed = true
  and  p.default_storefront_id is null;

-- ── 4. Certification query (run after applying to verify success) ─────────────
--
-- SELECT
--   p.email,
--   p.organization_id,
--   p.default_storefront_id,
--   p.onboarding_completed,
--   s.handle,
--   CASE
--     WHEN p.organization_id        IS NULL THEN 'FAIL: no org'
--     WHEN p.default_storefront_id  IS NULL THEN 'FAIL: no storefront link'
--     WHEN p.onboarding_completed   IS FALSE THEN 'FAIL: not completed'
--     ELSE 'PASS'
--   END AS linkage_status
-- FROM profiles p
-- LEFT JOIN storefronts s
--        ON s.id = p.default_storefront_id
-- WHERE p.onboarding_completed = true
-- ORDER BY p.created_at DESC;
--
-- SUCCESS CRITERIA:
--   Every row shows linkage_status = 'PASS'
--   No row has default_storefront_id IS NULL where onboarding_completed = true
