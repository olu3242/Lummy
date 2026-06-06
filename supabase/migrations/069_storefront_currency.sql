-- Migration: Add currency_code and currency_symbol to storefronts
-- Storefronts inherit their display currency from the parent organization.
-- This column makes the relationship explicit and avoids repeated joins.

alter table public.storefronts
  add column if not exists currency_code text not null default 'USD',
  add column if not exists currency_symbol text not null default '$';

-- Backfill from parent organization for all existing storefronts
update public.storefronts sf
set
  currency_code   = coalesce(org.currency_code, 'USD'),
  currency_symbol = case coalesce(org.currency_code, 'USD')
    when 'USD' then '$'
    when 'GBP' then '£'
    when 'EUR' then '€'
    when 'CAD' then 'CA$'
    when 'AUD' then 'A$'
    when 'NGN' then '₦'
    when 'KES' then 'KSh'
    when 'ZAR' then 'R'
    when 'GHS' then 'GH₵'
    else '$'
  end
from public.organizations org
where sf.organization_id = org.id;

comment on column public.storefronts.currency_code   is 'ISO 4217 currency code for this storefront (e.g. USD, NGN, GBP)';
comment on column public.storefronts.currency_symbol is 'Display symbol for the currency (e.g. $, ₦, £)';
