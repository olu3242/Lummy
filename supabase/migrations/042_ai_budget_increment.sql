-- ============================================================
-- Migration 042: AI Budget Increment RPC
-- Atomic increment of ai_usage_budgets.used_usd
-- Called from gateway.ts recordCost() after each AI generation
-- ============================================================

create or replace function public.increment_ai_budget_used(
  p_org_id       uuid,
  p_period_start date,
  p_cost_usd     numeric
)
returns void
language plpgsql
security definer
as $$
begin
  update public.ai_usage_budgets
  set    used_usd   = used_usd + p_cost_usd,
         updated_at = now()
  where  organization_id = p_org_id
    and  period_start    = p_period_start;
end;
$$;

-- Grant to service role only
revoke all on function public.increment_ai_budget_used(uuid, date, numeric) from public;
grant execute on function public.increment_ai_budget_used(uuid, date, numeric) to service_role;
