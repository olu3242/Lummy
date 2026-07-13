-- Zenith PROS Communication OS evidence model.
-- Delivery writes are service-role only through the centralized communication service.

create table if not exists public.communication_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null references public.organizations(id) on delete set null,
  template_id text not null,
  template_version integer not null default 1,
  event_name text not null,
  recipient text not null,
  subject text not null,
  provider text not null default 'resend',
  provider_status text not null default 'rendered'
    check (provider_status in ('rendered', 'sent', 'delivered', 'failed', 'bounced', 'complained')),
  provider_message_id text null,
  variant text not null default 'default' check (variant in ('default', 'a', 'b')),
  correlation_id text null,
  metadata jsonb not null default '{}'::jsonb,
  error jsonb null,
  sent_at timestamptz null,
  delivered_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.communication_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.communication_deliveries(id) on delete cascade,
  organization_id uuid null references public.organizations(id) on delete set null,
  template_id text not null,
  recipient text not null,
  event_type text not null check (event_type in ('sent', 'opened', 'clicked', 'bounced', 'complained')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists communication_deliveries_org_created_idx
  on public.communication_deliveries(organization_id, created_at desc);

create index if not exists communication_deliveries_template_created_idx
  on public.communication_deliveries(template_id, created_at desc);

create index if not exists communication_deliveries_status_created_idx
  on public.communication_deliveries(provider_status, created_at desc);

create index if not exists communication_deliveries_correlation_idx
  on public.communication_deliveries(correlation_id);

create index if not exists communication_events_delivery_idx
  on public.communication_events(delivery_id, created_at desc);

create index if not exists communication_events_org_created_idx
  on public.communication_events(organization_id, created_at desc);

alter table public.communication_deliveries enable row level security;
alter table public.communication_events enable row level security;

drop policy if exists "communication_deliveries_org_read" on public.communication_deliveries;
create policy "communication_deliveries_org_read"
  on public.communication_deliveries
  for select
  using (
    organization_id is null
    or public.is_org_member(organization_id)
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.role in ('admin', 'ops'))
    )
  );

drop policy if exists "communication_events_org_read" on public.communication_events;
create policy "communication_events_org_read"
  on public.communication_events
  for select
  using (
    organization_id is null
    or public.is_org_member(organization_id)
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.role in ('admin', 'ops'))
    )
  );

drop policy if exists "communication_deliveries_service_role" on public.communication_deliveries;
create policy "communication_deliveries_service_role"
  on public.communication_deliveries
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "communication_events_service_role" on public.communication_events;
create policy "communication_events_service_role"
  on public.communication_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
