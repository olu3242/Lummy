-- Fix: creator_profiles.user_id FK points to public.users(id) which is never populated
-- for new Supabase auth users. The trigger only inserts into public.profiles.
-- This migration:
--   1. Backfills public.users for all existing auth.users rows
--   2. Updates the auth trigger to insert into both public.users AND public.profiles
--   3. Relaxes the creator_profiles.handle CHECK constraint to allow dots/periods

-- ── 1. Backfill public.users from auth.users ─────────────────────────────────
-- Any auth user that doesn't have a public.users row gets one now.
insert into public.users (id, email, full_name, avatar_url, role, created_at, updated_at)
select
  au.id,
  coalesce(au.email, au.id::text || '@placeholder.lummy'),
  coalesce(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name'),
  au.raw_user_meta_data ->> 'avatar_url',
  'customer',
  au.created_at,
  now()
from auth.users au
where not exists (
  select 1 from public.users pu where pu.id = au.id
)
on conflict (id) do nothing;

-- ── 2. Update trigger to populate BOTH public.users and public.profiles ───────
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Populate public.users (required by creator_profiles.user_id FK)
  insert into public.users (id, email, full_name, avatar_url, role, created_at, updated_at)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@placeholder.lummy'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    'customer',
    now(),
    now()
  )
  on conflict (id) do update
  set
    full_name  = coalesce(public.users.full_name, excluded.full_name),
    avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url),
    updated_at = now();

  -- Populate public.profiles
  insert into public.profiles (id, email, full_name, avatar_url, onboarding_completed, onboarding_step, created_at, updated_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    false,
    'profile',
    now(),
    now()
  )
  on conflict (id) do update
  set
    email            = excluded.email,
    full_name        = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url       = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    onboarding_step  = coalesce(public.profiles.onboarding_step, excluded.onboarding_step),
    updated_at       = now();

  return new;
end;
$$;

-- Re-register the trigger (create or replace on the function is not enough — must recreate trigger)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ── 3. Relax creator_profiles.handle CHECK constraint to allow dots ───────────
-- Storefronts allow dots in handles; creator_profiles must match.
alter table public.creator_profiles
  drop constraint if exists handle_format;

alter table public.creator_profiles
  add constraint handle_format
  check (handle ~ '^[a-z0-9._-]{3,50}$');
