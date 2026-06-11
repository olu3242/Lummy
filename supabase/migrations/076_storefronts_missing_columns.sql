-- Repair storefronts schema drift between migration 029 and 040.
--
-- Migration 029 created public.storefronts WITHOUT store_schema and updated_at.
-- Migration 040 used `create table if not exists`, which is a no-op on any
-- database where 029 already ran — so those columns were never added there.
--
-- getPublishedStorefrontByHandle selects store_schema and theme; on a
-- 029-bootstrapped database that SELECT fails with 42703 and crashed every
-- public storefront page via generateMetadata. The runtime now has a legacy
-- fallback, but the schema should converge regardless.

alter table public.storefronts
  add column if not exists store_schema jsonb,
  add column if not exists theme jsonb,
  add column if not exists updated_at timestamptz;

comment on column public.storefronts.store_schema is 'Storefront section/layout schema (StoreSchema JSON) rendered by the public storefront';
comment on column public.storefronts.theme is 'Legacy theme overrides (accent, font, layout) used as fallback when store_schema is absent';
