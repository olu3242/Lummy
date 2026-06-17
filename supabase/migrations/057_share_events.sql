-- Storefront share/click tracking. The dashboard "Share Store" panel was a
-- fully mocked component (hardcoded handle "sade.styles", no persistence) —
-- this table backs the real version so shares and resulting storefront visits
-- are attributable.
--
-- Inserts only ever happen from trusted server code: 'share' rows are written
-- by an authenticated server action scoped to the creator's own org, 'click'
-- rows are written server-side in the public storefront page render using the
-- service-role client (never via a public RLS insert policy — we just closed
-- one unrestricted public-access hole on `orders` in migration 056 and aren't
-- reopening the same shape here).

create table if not exists public.share_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  storefront_id    uuid not null references public.storefronts(id) on delete cascade,
  event_type       text not null check (event_type in ('share', 'click')),
  channel          text not null default 'whatsapp',
  customer_source  text,
  campaign         text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_share_events_org_created
  on public.share_events(organization_id, created_at desc);

create index if not exists idx_share_events_storefront
  on public.share_events(storefront_id, event_type);

alter table public.share_events enable row level security;

drop policy if exists "share_events org" on public.share_events;
create policy "share_events org"
  on public.share_events
  for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
