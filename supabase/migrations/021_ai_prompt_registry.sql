create table if not exists prompt_definitions (
  id uuid primary key,
  tenant_id uuid not null,
  key text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists prompt_versions (
  id uuid primary key,
  definition_id uuid not null references prompt_definitions(id),
  version integer not null,
  template text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique(definition_id, version)
);

create table if not exists prompt_executions (
  id uuid primary key,
  version_id uuid not null references prompt_versions(id),
  status text not null,
  latency_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists prompt_evaluations (
  id uuid primary key,
  execution_id uuid not null references prompt_executions(id),
  score numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists prompt_rollbacks (
  id uuid primary key,
  definition_id uuid not null references prompt_definitions(id),
  from_version integer not null,
  to_version integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
