create table if not exists public.predictive_forecasts (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, forecast_key text not null, forecast_value numeric not null, created_at timestamptz not null default now()
);
create table if not exists public.optimization_recommendations (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, recommendation_key text not null, confidence numeric not null, created_at timestamptz not null default now()
);
create table if not exists public.retention_predictions (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, subject_ref text not null, churn_risk numeric not null, created_at timestamptz not null default now()
);
create table if not exists public.monetization_predictions (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, segment_key text not null, revenue_delta numeric not null, created_at timestamptz not null default now()
);
create table if not exists public.strategy_simulations (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, scenario_key text not null, status text not null default 'queued', replay_key text not null, created_at timestamptz not null default now(), unique (tenant_id, replay_key)
);
create table if not exists public.simulation_results (
  id uuid primary key default gen_random_uuid(), simulation_id uuid not null references public.strategy_simulations(id), result_key text not null, created_at timestamptz not null default now()
);
create table if not exists public.scenario_lineage (
  id uuid primary key default gen_random_uuid(), simulation_id uuid not null references public.strategy_simulations(id), lineage_key text not null, created_at timestamptz not null default now()
);
create table if not exists public.experiment_runs (
  id uuid primary key default gen_random_uuid(), simulation_id uuid not null references public.strategy_simulations(id), experiment_key text not null, status text not null default 'running', created_at timestamptz not null default now()
);
create table if not exists public.adaptive_workflows (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, workflow_key text not null, state text not null default 'active', created_at timestamptz not null default now()
);
create table if not exists public.optimization_loops (
  id uuid primary key default gen_random_uuid(), workflow_id uuid not null references public.adaptive_workflows(id), loop_key text not null, state text not null default 'stable', created_at timestamptz not null default now()
);
create table if not exists public.recommendation_adaptations (
  id uuid primary key default gen_random_uuid(), workflow_id uuid not null references public.adaptive_workflows(id), adaptation_key text not null, created_at timestamptz not null default now()
);
create table if not exists public.orchestration_adjustments (
  id uuid primary key default gen_random_uuid(), workflow_id uuid not null references public.adaptive_workflows(id), adjustment_key text not null, created_at timestamptz not null default now()
);
create table if not exists public.autonomous_decisions (
  id uuid primary key default gen_random_uuid(), tenant_id text not null, decision_key text not null, replay_key text not null, status text not null default 'pending', created_at timestamptz not null default now(), unique (tenant_id, replay_key)
);
create table if not exists public.decision_approvals (
  id uuid primary key default gen_random_uuid(), decision_id uuid not null references public.autonomous_decisions(id), approver_ref text not null, status text not null default 'pending', created_at timestamptz not null default now()
);
create table if not exists public.risk_classifications (
  id uuid primary key default gen_random_uuid(), decision_id uuid not null references public.autonomous_decisions(id), risk_level text not null, created_at timestamptz not null default now()
);
create table if not exists public.optimization_audits (
  id uuid primary key default gen_random_uuid(), decision_id uuid not null references public.autonomous_decisions(id), audit_key text not null, created_at timestamptz not null default now()
);
