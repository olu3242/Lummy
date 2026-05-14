create table if not exists trust_signals (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  signal_type text not null,
  signal_key text not null,
  creator_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists creator_trust_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  creator_id text not null,
  score numeric not null,
  version int not null,
  idempotency_key text not null,
  created_at timestamptz not null,
  unique(tenant_id, creator_id, idempotency_key)
);
create table if not exists review_insights (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  review_id text not null,
  quality_score numeric not null,
  toxicity_score numeric not null,
  created_at timestamptz not null
);
create table if not exists moderation_actions (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, actor_id text not null, subject_id text not null, action text not null, reason text not null, created_at timestamptz not null);
create table if not exists fraud_cases (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, subject_id text not null, indicators jsonb not null, severity text not null, created_at timestamptz not null);
create table if not exists trust_score_versions (
  id uuid primary key default gen_random_uuid(), version int not null unique, created_at timestamptz not null default now());
create table if not exists moderation_audits (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, actor_id text not null, subject_id text not null, action text not null, reason text not null, audited_at timestamptz not null);
create table if not exists creator_rankings (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, creator_id text not null, score numeric not null, updated_at timestamptz not null, unique(tenant_id, creator_id));
create table if not exists product_rankings (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, product_id text not null, score numeric not null, updated_at timestamptz not null, unique(tenant_id, product_id));
create table if not exists discovery_sessions (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, session_id text not null, ranked_ids jsonb not null, created_at timestamptz not null, unique(tenant_id, session_id));
create table if not exists personalization_profiles (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, subject_id text not null, profile jsonb not null, updated_at timestamptz not null, unique(tenant_id, subject_id));
create table if not exists ranking_explanations (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, session_id text not null, entity_id text not null, explanation text not null, created_at timestamptz not null);
