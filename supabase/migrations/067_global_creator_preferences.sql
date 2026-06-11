-- Global creator preferences: currency, locale, country, and timezone.

alter table if exists public.organizations
  add column if not exists currency_code text,
  add column if not exists country_code text,
  add column if not exists locale text,
  add column if not exists timezone text;

update public.organizations
set
  currency_code = coalesce(currency_code, currency, 'USD'),
  country_code = coalesce(country_code, country, 'US'),
  locale = coalesce(locale, 'en-US'),
  timezone = coalesce(timezone, 'UTC');

alter table if exists public.organizations
  alter column currency_code set default 'USD',
  alter column country_code set default 'US',
  alter column locale set default 'en-US',
  alter column timezone set default 'UTC';

alter table if exists public.storefronts
  add column if not exists locale text,
  add column if not exists timezone text;

update public.storefronts
set
  locale = coalesce(locale, 'en-US'),
  timezone = coalesce(timezone, 'UTC');

alter table if exists public.storefronts
  alter column locale set default 'en-US',
  alter column timezone set default 'UTC';

alter table if exists public.products
  alter column currency set default 'USD';

alter table if exists public.orders
  alter column currency set default 'USD';

alter table if exists public.payments
  alter column currency set default 'USD';
