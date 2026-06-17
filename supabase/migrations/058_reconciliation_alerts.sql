-- Persists payment/order reconciliation anomalies detected by
-- runPaymentReconciliation() (src/lib/payments/audit.ts). createPendingOrder
-- and markPaymentCompleted (src/repositories/order-repository.ts) write the
-- order and its payment in two separate inserts/updates, not one DB
-- transaction, so the two can diverge if either write fails partway through.
-- This table makes that divergence visible instead of leaking revenue
-- silently.

create table if not exists public.reconciliation_alerts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  order_id         uuid not null references public.orders(id) on delete cascade,
  payment_id       uuid references public.payments(id) on delete set null,
  anomaly_type     text not null check (anomaly_type in ('order_paid_without_payment', 'payment_succeeded_without_paid_order')),
  amount           numeric(12, 2) not null,
  detail           text not null,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now()
);

create unique index if not exists reconciliation_alerts_org_order_type_key
  on public.reconciliation_alerts(organization_id, order_id, anomaly_type);

create index if not exists idx_reconciliation_alerts_unresolved
  on public.reconciliation_alerts(organization_id)
  where resolved_at is null;

alter table public.reconciliation_alerts enable row level security;

drop policy if exists "reconciliation_alerts org read" on public.reconciliation_alerts;
create policy "reconciliation_alerts org read"
  on public.reconciliation_alerts
  for select
  using (public.is_org_member(organization_id));

-- Written exclusively by runPaymentReconciliation() via the service-role client.
drop policy if exists "reconciliation_alerts service role write" on public.reconciliation_alerts;
create policy "reconciliation_alerts service role write"
  on public.reconciliation_alerts
  for insert
  with check (auth.role() = 'service_role');

drop policy if exists "reconciliation_alerts service role update" on public.reconciliation_alerts;
create policy "reconciliation_alerts service role update"
  on public.reconciliation_alerts
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
