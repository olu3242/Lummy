-- Normalize legacy storefront foreign keys that incorrectly target storefronts.organization_id.

alter table public.customer_interactions
  drop constraint if exists customer_interactions_storefront_id_fkey;

alter table public.customer_profiles
  drop constraint if exists customer_profiles_storefront_id_fkey;

-- Backfill storefront IDs using org-scoped default storefront when records currently hold organization_id values.
update public.customer_interactions ci
set storefront_id = s.id
from public.storefronts s
where ci.storefront_id = s.organization_id
  and ci.org_id = s.organization_id;

update public.customer_profiles cp
set storefront_id = s.id
from public.storefronts s
where cp.storefront_id = s.organization_id
  and cp.org_id = s.organization_id;

-- Null out unresolved storefront references to avoid orphaned FKs.
update public.customer_interactions ci
set storefront_id = null
where storefront_id is not null
  and not exists (select 1 from public.storefronts s where s.id = ci.storefront_id);

update public.customer_profiles cp
set storefront_id = null
where storefront_id is not null
  and not exists (select 1 from public.storefronts s where s.id = cp.storefront_id);

alter table public.customer_interactions
  add constraint customer_interactions_storefront_id_fkey
  foreign key (storefront_id) references public.storefronts(id) on delete set null;

alter table public.customer_profiles
  add constraint customer_profiles_storefront_id_fkey
  foreign key (storefront_id) references public.storefronts(id) on delete set null;
