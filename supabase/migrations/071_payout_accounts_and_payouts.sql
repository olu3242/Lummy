-- Migration 071: Creator payout infrastructure
-- payout_accounts: bank account details per org
-- payouts: withdrawal requests (manual approval, no automated transfers)

create table if not exists public.payout_accounts (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  bank_name       text not null,
  account_name    text not null,
  account_number  text not null,
  currency_code   text not null default 'NGN',
  verified        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

-- one payout account per org for MVP
create unique index if not exists idx_payout_accounts_org_id
  on public.payout_accounts(org_id);

alter table public.payout_accounts enable row level security;

create policy "payout_accounts_org_access" on public.payout_accounts
  for all using (is_org_member(org_id))
  with check (is_org_member(org_id));

create table if not exists public.payouts (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id) on delete cascade,
  payout_account_id   uuid references public.payout_accounts(id) on delete set null,
  amount              numeric(12, 2) not null,
  currency_code       text not null default 'NGN',
  status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'paid', 'failed')),
  provider            text,
  provider_reference  text,
  requested_at        timestamptz not null default now(),
  completed_at        timestamptz,
  notes               text
);

create index if not exists idx_payouts_org_id
  on public.payouts(org_id, requested_at desc);

alter table public.payouts enable row level security;

create policy "payouts_org_access" on public.payouts
  for all using (is_org_member(org_id))
  with check (is_org_member(org_id));
