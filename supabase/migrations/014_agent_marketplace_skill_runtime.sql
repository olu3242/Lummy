create table if not exists public.marketplace_skills (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  skill_key text not null,
  status text not null default 'draft',
  trust_score numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, skill_key)
);
create table if not exists public.skill_publishers (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  publisher_ref text not null,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now()
);
create table if not exists public.skill_installs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  skill_id uuid not null references public.marketplace_skills(id),
  installed_version text not null,
  install_status text not null default 'requested',
  created_at timestamptz not null default now()
);
create table if not exists public.skill_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  skill_id uuid not null references public.marketplace_skills(id),
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now()
);
create table if not exists public.skill_monetization (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  skill_id uuid not null references public.marketplace_skills(id),
  pricing_plan text not null,
  billing_state text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.capability_registry (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  capability_key text not null,
  active_version text not null,
  approval_state text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (tenant_id, capability_key)
);
create table if not exists public.capability_versions (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capability_registry(id),
  version text not null,
  checksum text not null,
  created_at timestamptz not null default now(),
  unique (capability_id, version)
);
create table if not exists public.capability_dependencies (
  id uuid primary key default gen_random_uuid(),
  capability_version_id uuid not null references public.capability_versions(id),
  dependency_capability_key text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.capability_permissions (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capability_registry(id),
  permission_key text not null,
  effect text not null default 'allow',
  created_at timestamptz not null default now()
);

create table if not exists public.skill_executions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  capability_id uuid not null references public.capability_registry(id),
  execution_key text not null,
  execution_status text not null default 'queued',
  replay_safe boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, execution_key)
);
create table if not exists public.skill_memory (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  execution_id uuid not null references public.skill_executions(id),
  memory_scope text not null,
  encrypted_blob text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.skill_sandboxes (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  execution_id uuid not null references public.skill_executions(id),
  isolation_profile text not null,
  status text not null default 'prepared',
  created_at timestamptz not null default now()
);
create table if not exists public.skill_runtime_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.skill_executions(id),
  severity text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.capability_approvals (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capability_registry(id),
  approver_ref text not null,
  state text not null default 'pending',
  created_at timestamptz not null default now()
);
create table if not exists public.capability_moderation (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capability_registry(id),
  moderator_ref text not null,
  state text not null default 'open',
  created_at timestamptz not null default now()
);
create table if not exists public.capability_policy_violations (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capability_registry(id),
  violation_key text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create table if not exists public.capability_throttles (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capability_registry(id),
  throttle_key text not null,
  limit_per_minute integer not null,
  created_at timestamptz not null default now()
);
