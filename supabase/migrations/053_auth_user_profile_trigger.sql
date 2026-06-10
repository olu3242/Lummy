-- Bootstrap auth users → public.profiles AND public.users (required by creator_profiles FK).
-- Also relaxes creator_profiles.handle constraint to allow dots (e.g. sade.styles).

-- Ensure updated_at exists before the trigger references it
alter table public.profiles add column if not exists updated_at timestamptz;

-- Ensure public.users row exists (creator_profiles.user_id references this table)
alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists avatar_url text;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_email     text;
begin
  v_email     := coalesce(new.email, new.id::text || '@placeholder.lummy');
  v_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(v_email, '@', 1)
  );

  -- 1. Populate public.users (referenced by creator_profiles.user_id FK)
  insert into public.users (id, email, full_name, role, created_at, updated_at)
  values (new.id, v_email, v_full_name, 'customer', now(), now())
  on conflict (id) do update
    set
      email      = excluded.email,
      full_name  = coalesce(public.users.full_name, excluded.full_name),
      updated_at = now();

  -- 2. Populate public.profiles (used by auth/session flow)
  insert into public.profiles (id, email, full_name, created_at, updated_at)
  values (new.id, v_email, v_full_name, now(), now())
  on conflict (id) do update
    set
      email      = excluded.email,
      full_name  = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Backfill public.users for all existing auth users
insert into public.users (id, email, full_name, role, created_at, updated_at)
select
  au.id,
  coalesce(au.email, au.id::text || '@placeholder.lummy'),
  coalesce(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(coalesce(au.email, ''), '@', 1)
  ),
  'customer',
  au.created_at,
  now()
from auth.users au
where not exists (select 1 from public.users u where u.id = au.id)
on conflict (id) do nothing;

-- Backfill public.profiles for all existing auth users
insert into public.profiles (id, email, full_name, created_at, updated_at)
select
  au.id,
  coalesce(au.email, au.id::text || '@placeholder.lummy'),
  coalesce(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(coalesce(au.email, ''), '@', 1)
  ),
  au.created_at,
  now()
from auth.users au
where not exists (select 1 from public.profiles p where p.id = au.id)
on conflict (id) do nothing;

-- Relax creator_profiles.handle CHECK to allow dots (e.g. sade.styles)
alter table public.creator_profiles drop constraint if exists handle_format;
alter table public.creator_profiles
  add constraint handle_format
  check (handle ~ '^[a-z0-9._-]{3,50}$');
