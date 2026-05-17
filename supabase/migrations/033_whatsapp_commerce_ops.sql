alter table public.customer_interactions
  add column if not exists checkout_association text;

create index if not exists idx_customer_interactions_channel_status
  on public.customer_interactions(org_id, source_channel, conversion_status, created_at desc);

create index if not exists idx_customer_interactions_customer
  on public.customer_interactions(org_id, customer_identifier, created_at desc);

create table if not exists public.whatsapp_recovery_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  interaction_id uuid not null references public.customer_interactions(id) on delete cascade,
  checkout_id uuid references public.orders(id) on delete set null,
  event_type text not null,
  suggested_message text,
  correlation_id text not null,
  status text not null default 'queued',
  retry_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_recovery_events_org
  on public.whatsapp_recovery_events(org_id, status, created_at desc);

alter table public.whatsapp_recovery_events enable row level security;

create policy if not exists whatsapp_recovery_events_org_policy on public.whatsapp_recovery_events
for all using (org_id in (select organization_id from public.organization_members where user_id = auth.uid()));
