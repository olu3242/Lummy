-- Migration 055: Onboarding completion guards
-- Fixes root causes of 7 users stuck at preview → launch transition.

-- 1. Re-ensure is_org_member is security definer (idempotent re-apply).
--    Without security definer, the function evaluates organizations RLS recursively,
--    causing the embedded join in ensureOrganizationForUser to silently return null
--    on retry, leading to a UNIQUE constraint violation on owner_id.
create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = org_id
      and o.owner_id = auth.uid()
  ) or exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

-- 2. Add a direct owner-can-see-own-org SELECT policy so that the fallback
--    owner_id lookup in ensureOrganizationForUser works even before membership
--    is confirmed (belt-and-suspenders alongside is_org_member).
drop policy if exists "org owner direct" on public.organizations;
create policy "org owner direct"
  on public.organizations for select
  using (owner_id = auth.uid());

-- 3. Ensure profiles.default_storefront_id column exists (added by 040, but guard
--    in case any migration was skipped in an older deployment).
alter table public.profiles add column if not exists default_storefront_id uuid;

do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'profiles'
      and constraint_name = 'profiles_default_storefront_id_fkey'
      and table_schema = 'public'
  ) then
    alter table public.profiles
      add constraint profiles_default_storefront_id_fkey
      foreign key (default_storefront_id)
      references public.storefronts(id)
      on delete set null;
  end if;
exception when others then null;
end $$;

-- 4. Backfill profiles.organization_id and default_storefront_id for stuck users
--    who have an org membership but a NULL profiles.organization_id.
--    This is a one-time reconciliation; the upsert in completeOnboarding handles
--    future users automatically.
update public.profiles p
set
  organization_id       = m.organization_id,
  default_storefront_id = coalesce(p.default_storefront_id, s.id),
  onboarding_completed  = true,
  onboarding_step       = 'completed',
  updated_at            = now()
from public.organization_members m
left join public.storefronts s on s.organization_id = m.organization_id
where m.user_id    = p.id
  and m.role       = 'owner'
  and p.organization_id is null;

-- 5. Reconcile onboarding_states for users whose profiles are now completed
--    but whose onboarding_states still show current_step != 'completed'.
insert into public.onboarding_states (user_id, organization_id, current_step, completed, updated_at)
select p.id, p.organization_id, 'completed', true, now()
from public.profiles p
where p.onboarding_completed = true
  and p.organization_id is not null
on conflict (user_id) do update
  set organization_id = excluded.organization_id,
      current_step    = 'completed',
      completed       = true,
      updated_at      = now()
  where public.onboarding_states.completed = false;
