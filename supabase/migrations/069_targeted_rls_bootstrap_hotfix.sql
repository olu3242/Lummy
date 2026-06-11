-- Lummy targeted onboarding bootstrap RLS hotfix.
--
-- Target project: llbuddtdsdbljnsvzide (Lummy Creator Dev)
-- Do not run this through `supabase db push` while the migration registry is empty.
-- Execute this SQL directly against the dev database, then verify the policy
-- inventory queries at the bottom before preparing production deployment.
--
-- Backup / current-state snapshot queries to run before this hotfix:
--
-- select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in (
--     'organizations',
--     'organization_members',
--     'storefronts',
--     'onboarding_states',
--     'creator_profiles',
--     'products'
--   )
-- order by tablename, policyname;
--
-- select pg_get_functiondef('public.is_org_member(uuid)'::regprocedure);

begin;

create or replace function public.is_org_owner(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = org_id
      and o.owner_id = auth.uid()
  );
$$;

create or replace function public.org_has_members(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
  );
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_org_owner(org_id)
  or exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

alter table if exists public.organizations enable row level security;
alter table if exists public.organization_members enable row level security;

-- Remove only the confirmed legacy organization bootstrap-deadlocking policy.
drop policy if exists "org visible to members" on public.organizations;

-- Keep existing organizations_insert / organizations_select / organizations_update
-- policies in place. The required invariant is that no remaining INSERT policy
-- requires membership before the first owner membership exists.

-- Replace the confirmed legacy organization_members FOR ALL policy.
drop policy if exists "org members visible" on public.organization_members;

drop policy if exists "members_select" on public.organization_members;
drop policy if exists "members_insert" on public.organization_members;
drop policy if exists "members_update" on public.organization_members;
drop policy if exists "members_delete" on public.organization_members;

create policy "members_select"
  on public.organization_members
  for select
  using (public.is_org_member(organization_id));

create policy "members_insert"
  on public.organization_members
  for insert
  with check (
    auth.uid() is not null
    and (
      (
        user_id = auth.uid()
        and role = 'owner'
        and public.is_org_owner(organization_id)
        and not public.org_has_members(organization_id)
      )
      or (
        public.is_org_owner(organization_id)
        and role in ('owner', 'admin', 'member')
      )
    )
  );

create policy "members_update"
  on public.organization_members
  for update
  using (public.is_org_owner(organization_id))
  with check (
    public.is_org_owner(organization_id)
    and role in ('owner', 'admin', 'member')
  );

create policy "members_delete"
  on public.organization_members
  for delete
  using (public.is_org_owner(organization_id));

commit;

-- Verification queries to run after this hotfix:
--
-- select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('organizations', 'organization_members')
-- order by tablename, policyname;
--
-- select count(*) = 0 as legacy_org_policy_removed
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'organizations'
--   and policyname = 'org visible to members';
--
-- select count(*) = 0 as legacy_member_policy_removed
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'organization_members'
--   and policyname = 'org members visible';
--
-- select policyname, cmd, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'organizations'
--   and cmd in ('INSERT', 'ALL')
-- order by policyname;
