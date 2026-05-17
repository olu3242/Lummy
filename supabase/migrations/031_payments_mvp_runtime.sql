create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  provider_reference text,
  provider_event_id text,
  amount numeric(12,2) not null,
  currency text not null default 'NGN',
  status text not null default 'pending',
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_reference),
  unique(provider, provider_event_id)
);

create index if not exists idx_payments_org_created on public.payments(organization_id, created_at desc);
create index if not exists idx_payments_order on public.payments(order_id);

alter table public.payments enable row level security;
create policy "payments org" on public.payments for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
