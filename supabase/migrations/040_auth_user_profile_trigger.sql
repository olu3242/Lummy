-- Auto-create public.profiles row when a new auth.users row is inserted.
-- Prevents the window between signup and the first onboarding upsert
-- where queries against profiles return no row.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, created_at)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@placeholder.lummy'),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    now()
  )
  on conflict (id) do update
    set
      email      = excluded.email,
      full_name  = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now()
  where public.profiles.full_name is null or public.profiles.email != excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Backfill: ensure every existing auth user has a profiles row
insert into public.profiles (id, email, full_name, created_at)
select
  au.id,
  coalesce(au.email, au.id::text || '@placeholder.lummy'),
  coalesce(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(coalesce(au.email, ''), '@', 1)
  ),
  au.created_at
from auth.users au
where not exists (select 1 from public.profiles p where p.id = au.id)
on conflict (id) do nothing;

-- Add updated_at column to profiles if not present (the trigger references it)
alter table public.profiles add column if not exists updated_at timestamptz;
