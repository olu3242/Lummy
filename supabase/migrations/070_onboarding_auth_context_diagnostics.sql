-- Recreate onboarding diagnostics needed to prove the authenticated PostgREST
-- context used by RLS during creator bootstrap.

create or replace function public.auth_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function public.organizations_policy_inventory()
returns table (
  schemaname name,
  tablename name,
  policyname name,
  cmd text,
  qual text,
  with_check text
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    p.schemaname,
    p.tablename,
    p.policyname,
    p.cmd,
    p.qual,
    p.with_check
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename = 'organizations'
  order by p.policyname;
$$;
