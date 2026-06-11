-- Ensure the legacy creator_profiles table required by completeOnboarding()
-- exists in environments where the early baseline migration was not applied.

create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  handle text not null unique,
  business_name text,
  whatsapp_number text,
  is_published boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table if exists public.creator_profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists handle text,
  add column if not exists business_name text,
  add column if not exists whatsapp_number text,
  add column if not exists is_published boolean not null default false,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz;

create unique index if not exists creator_profiles_user_id_key
  on public.creator_profiles(user_id);

create unique index if not exists creator_profiles_handle_key
  on public.creator_profiles(handle)
  where handle is not null;

alter table if exists public.creator_profiles enable row level security;

drop policy if exists "creator_profiles_public_read" on public.creator_profiles;
create policy "creator_profiles_public_read"
  on public.creator_profiles
  for select
  using (coalesce(is_published, false) = true or user_id = auth.uid());

drop policy if exists "creator_profiles_insert_own" on public.creator_profiles;
create policy "creator_profiles_insert_own"
  on public.creator_profiles
  for insert
  with check (user_id = auth.uid());

drop policy if exists "creator_profiles_update_own" on public.creator_profiles;
create policy "creator_profiles_update_own"
  on public.creator_profiles
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "creator_profiles_delete_own" on public.creator_profiles;
create policy "creator_profiles_delete_own"
  on public.creator_profiles
  for delete
  using (user_id = auth.uid());
