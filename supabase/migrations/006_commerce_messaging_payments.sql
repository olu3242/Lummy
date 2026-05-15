create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  template_key text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  idempotency_key text not null,
  raw_payload text not null,
  received_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

create table if not exists messaging_failures (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  provider_message_id text,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists settlement_reconciliations (
  id uuid primary key default gen_random_uuid(),
  settlement_key text not null unique,
  payment_intent_id text not null,
  reconciled_at timestamptz not null
);

create table if not exists subscription_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  customer_id text not null,
  provider_subscription_id text not null,
  status text not null,
  plan_code text not null,
  updated_at timestamptz not null,
  unique (tenant_id, provider_subscription_id)
);
