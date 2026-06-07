-- Restore authenticated creator onboarding bootstrap without disabling RLS.
--
-- The previous organizations and organization_members policies used broad
-- FOR ALL membership checks. That made the first organization/member bootstrap
-- fragile because membership-aware checks were required while the first owner
-- membership did not exist yet.

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

create or replace function public.organization_owner_matches(org_id uuid, expected_owner uuid)
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
      and o.owner_id = expected_owner
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
alter table if exists public.storefronts enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.onboarding_states enable row level security;

-- Organizations: split bootstrap insert from member visibility/management.
drop policy if exists "org visible to members" on public.organizations;
drop policy if exists "organizations_select_members" on public.organizations;
drop policy if exists "organizations_insert_owner" on public.organizations;
drop policy if exists "organizations_update_members_owner_preserved" on public.organizations;
drop policy if exists "organizations_delete_owner" on public.organizations;

create policy "organizations_select_members"
  on public.organizations
  for select
  using (public.is_org_member(id));

create policy "organizations_insert_owner"
  on public.organizations
  for insert
  with check (
    auth.uid() is not null
    and owner_id = auth.uid()
  );

create policy "organizations_update_members_owner_preserved"
  on public.organizations
  for update
  using (public.is_org_member(id))
  with check (
    public.is_org_member(id)
    and public.organization_owner_matches(id, owner_id)
  );

create policy "organizations_delete_owner"
  on public.organizations
  for delete
  using (public.is_org_owner(id));

-- Organization members: allow the organization owner to create the first
-- owner membership, then require owner-only administration for future changes.
drop policy if exists "org members visible" on public.organization_members;
drop policy if exists "organization_members_select_members" on public.organization_members;
drop policy if exists "organization_members_insert_first_owner" on public.organization_members;
drop policy if exists "organization_members_insert_owner_admin" on public.organization_members;
drop policy if exists "organization_members_update_owner_admin" on public.organization_members;
drop policy if exists "organization_members_delete_owner_admin" on public.organization_members;

create policy "organization_members_select_members"
  on public.organization_members
  for select
  using (public.is_org_member(organization_id));

create policy "organization_members_insert_first_owner"
  on public.organization_members
  for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and role = 'owner'
    and public.is_org_owner(organization_id)
    and not public.org_has_members(organization_id)
  );

create policy "organization_members_insert_owner_admin"
  on public.organization_members
  for insert
  with check (
    auth.uid() is not null
    and public.is_org_owner(organization_id)
    and role in ('owner', 'admin', 'member')
  );

create policy "organization_members_update_owner_admin"
  on public.organization_members
  for update
  using (public.is_org_owner(organization_id))
  with check (
    public.is_org_owner(organization_id)
    and role in ('owner', 'admin', 'member')
  );

create policy "organization_members_delete_owner_admin"
  on public.organization_members
  for delete
  using (public.is_org_owner(organization_id));

-- Storefronts remain organization-scoped. These policies are recreated so
-- onboarding can create the storefront immediately after first membership.
drop policy if exists "storefronts org manage" on public.storefronts;
drop policy if exists "storefronts_org_select" on public.storefronts;
drop policy if exists "storefronts_org_insert" on public.storefronts;
drop policy if exists "storefronts_org_update" on public.storefronts;
drop policy if exists "storefronts_org_delete" on public.storefronts;

create policy "storefronts_org_select"
  on public.storefronts
  for select
  using (public.is_org_member(organization_id));

create policy "storefronts_org_insert"
  on public.storefronts
  for insert
  with check (public.is_org_member(organization_id));

create policy "storefronts_org_update"
  on public.storefronts
  for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "storefronts_org_delete"
  on public.storefronts
  for delete
  using (public.is_org_owner(organization_id));

drop policy if exists "storefronts public read" on public.storefronts;
create policy "storefronts public read"
  on public.storefronts
  for select
  using (is_active = true);

-- Products remain organization-scoped and publicly readable only when active.
drop policy if exists "products org manage" on public.products;
drop policy if exists "products_org_select" on public.products;
drop policy if exists "products_org_insert" on public.products;
drop policy if exists "products_org_update" on public.products;
drop policy if exists "products_org_delete" on public.products;

create policy "products_org_select"
  on public.products
  for select
  using (public.is_org_member(organization_id));

create policy "products_org_insert"
  on public.products
  for insert
  with check (public.is_org_member(organization_id));

create policy "products_org_update"
  on public.products
  for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "products_org_delete"
  on public.products
  for delete
  using (public.is_org_owner(organization_id));

drop policy if exists "products public read" on public.products;
create policy "products public read"
  on public.products
  for select
  using (status in ('active', 'published'));

-- Orders remain tenant-scoped for creators. Public tracking policy is preserved
-- for the existing tracking route, but should be narrowed in a later payment
-- privacy pass.
drop policy if exists "orders org" on public.orders;
drop policy if exists "orders_org_select" on public.orders;
drop policy if exists "orders_org_insert" on public.orders;
drop policy if exists "orders_org_update" on public.orders;
drop policy if exists "orders_org_delete" on public.orders;

create policy "orders_org_select"
  on public.orders
  for select
  using (public.is_org_member(organization_id));

create policy "orders_org_insert"
  on public.orders
  for insert
  with check (public.is_org_member(organization_id));

create policy "orders_org_update"
  on public.orders
  for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "orders_org_delete"
  on public.orders
  for delete
  using (public.is_org_owner(organization_id));

drop policy if exists "orders public track" on public.orders;
create policy "orders public track"
  on public.orders
  for select
  using (true);

-- Onboarding state is self-owned and independent of organization membership so
-- progress can be saved before org bootstrap and completed afterward.
drop policy if exists "onboarding_states self" on public.onboarding_states;
drop policy if exists "onboarding_states_self_select" on public.onboarding_states;
drop policy if exists "onboarding_states_self_insert" on public.onboarding_states;
drop policy if exists "onboarding_states_self_update" on public.onboarding_states;
drop policy if exists "onboarding_states_self_delete" on public.onboarding_states;

create policy "onboarding_states_self_select"
  on public.onboarding_states
  for select
  using (user_id = auth.uid());

create policy "onboarding_states_self_insert"
  on public.onboarding_states
  for insert
  with check (user_id = auth.uid());

create policy "onboarding_states_self_update"
  on public.onboarding_states
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "onboarding_states_self_delete"
  on public.onboarding_states
  for delete
  using (user_id = auth.uid());

-- Legacy creator_profiles, when present, must remain writable by the owning
-- authenticated creator because completeOnboarding upserts this row.
do $$
begin
  if to_regclass('public.creator_profiles') is not null then
    execute 'alter table public.creator_profiles enable row level security';

    execute 'drop policy if exists "creators_select_public" on public.creator_profiles';
    execute 'drop policy if exists "creators_insert_own" on public.creator_profiles';
    execute 'drop policy if exists "creators_update_own" on public.creator_profiles';
    execute 'drop policy if exists "creator_profiles_public_read" on public.creator_profiles';
    execute 'drop policy if exists "creator_profiles_insert_own" on public.creator_profiles';
    execute 'drop policy if exists "creator_profiles_update_own" on public.creator_profiles';
    execute 'drop policy if exists "creator_profiles_delete_own" on public.creator_profiles';

    execute 'create policy "creator_profiles_public_read"
      on public.creator_profiles
      for select
      using (coalesce(is_published, false) = true or user_id = auth.uid())';

    execute 'create policy "creator_profiles_insert_own"
      on public.creator_profiles
      for insert
      with check (user_id = auth.uid())';

    execute 'create policy "creator_profiles_update_own"
      on public.creator_profiles
      for update
      using (user_id = auth.uid())
      with check (user_id = auth.uid())';

    execute 'create policy "creator_profiles_delete_own"
      on public.creator_profiles
      for delete
      using (user_id = auth.uid())';
  end if;
end $$;
