-- Minimal payout/withdrawal request system for MVP creator loop.

create table if not exists public.payout_accounts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  bank_name       text not null,
  account_number  text not null,
  account_name    text not null,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (organization_id, account_number, bank_name)
);

create index if not exists idx_payout_accounts_org on public.payout_accounts(organization_id);

create table if not exists public.withdrawal_requests (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  payout_account_id uuid references public.payout_accounts(id) on delete set null,
  amount          numeric(12,2) not null check (amount > 0),
  currency        text not null default 'NGN',
  status          text not null default 'pending',
  notes           text,
  processed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_withdrawal_requests_org on public.withdrawal_requests(organization_id, created_at desc);
create index if not exists idx_withdrawal_requests_status on public.withdrawal_requests(status) where status = 'pending';

alter table public.payout_accounts     enable row level security;
alter table public.withdrawal_requests enable row level security;

create policy "payout_accounts org"
  on public.payout_accounts for all
  using  (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "withdrawal_requests org"
  on public.withdrawal_requests for all
  using  (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
