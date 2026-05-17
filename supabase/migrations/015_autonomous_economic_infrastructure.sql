create table if not exists public.autonomous_workflows (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, workflow_key text not null, replay_key text not null, status text not null default 'queued', created_at timestamptz not null default now(), unique (tenant_id, replay_key)
);
create table if not exists public.agent_negotiations (
  id uuid primary key default gen_random_uuid(), workflow_id uuid not null references public.autonomous_workflows(id), negotiation_state text not null default 'open', trust_score numeric not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.commerce_approvals (
  id uuid primary key default gen_random_uuid(), workflow_id uuid not null references public.autonomous_workflows(id), approver_ref text not null, state text not null default 'pending', created_at timestamptz not null default now()
);
create table if not exists public.collaboration_contracts (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, contract_key text not null, contract_status text not null default 'draft', created_at timestamptz not null default now()
);
create table if not exists public.creator_collaborations (
  id uuid primary key default gen_random_uuid(), contract_id uuid not null references public.collaboration_contracts(id), collaborator_a text not null, collaborator_b text not null, created_at timestamptz not null default now()
);
create table if not exists public.economic_routes (
  id uuid primary key default gen_random_uuid(), workflow_id uuid not null references public.autonomous_workflows(id), route_key text not null, route_state text not null default 'active', created_at timestamptz not null default now()
);
create table if not exists public.incentive_allocations (
  id uuid primary key default gen_random_uuid(), workflow_id uuid not null references public.autonomous_workflows(id), allocation_key text not null, amount_cents bigint not null, created_at timestamptz not null default now()
);
create table if not exists public.trust_weighted_rewards (
  id uuid primary key default gen_random_uuid(), allocation_id uuid not null references public.incentive_allocations(id), trust_multiplier numeric not null default 1, created_at timestamptz not null default now()
);
create table if not exists public.autonomous_settlements (
  id uuid primary key default gen_random_uuid(), workflow_id uuid not null references public.autonomous_workflows(id), settlement_key text not null, status text not null default 'pending', created_at timestamptz not null default now()
);
create table if not exists public.settlement_allocations (
  id uuid primary key default gen_random_uuid(), settlement_id uuid not null references public.autonomous_settlements(id), beneficiary_ref text not null, amount_cents bigint not null, created_at timestamptz not null default now()
);
create table if not exists public.commission_routes (
  id uuid primary key default gen_random_uuid(), settlement_id uuid not null references public.autonomous_settlements(id), route_ref text not null, amount_cents bigint not null, created_at timestamptz not null default now()
);
create table if not exists public.reconciliation_lineage (
  id uuid primary key default gen_random_uuid(), settlement_id uuid not null references public.autonomous_settlements(id), lineage_key text not null, drift_score numeric not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.incentive_programs (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, program_key text not null, state text not null default 'active', created_at timestamptz not null default now()
);
create table if not exists public.creator_rewards (
  id uuid primary key default gen_random_uuid(), program_id uuid not null references public.incentive_programs(id), creator_ref text not null, amount_cents bigint not null, created_at timestamptz not null default now()
);
create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(), program_id uuid not null references public.incentive_programs(id), referral_ref text not null, amount_cents bigint not null, created_at timestamptz not null default now()
);
create table if not exists public.economic_reputation_scores (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, actor_ref text not null, reputation_score numeric not null default 0, created_at timestamptz not null default now(), unique (tenant_id, actor_ref)
);
