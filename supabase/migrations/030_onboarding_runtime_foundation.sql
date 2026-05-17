-- MVP onboarding runtime foundation: organization ownership, membership integrity and profile/org linkage.

alter table if exists organizations
  add column if not exists owner_id uuid,
  add column if not exists slug text,
  add column if not exists country text default 'US',
  add column if not exists currency text default 'USD';

create unique index if not exists organizations_slug_key on organizations(slug);
create unique index if not exists organizations_owner_id_key on organizations(owner_id) where owner_id is not null;

alter table if exists organization_members
  add column if not exists organization_id uuid,
  add column if not exists user_id uuid,
  add column if not exists role text default 'member';

create unique index if not exists organization_members_org_user_key on organization_members(organization_id, user_id);

alter table if exists profiles
  add column if not exists organization_id uuid,
  add column if not exists onboarding_step text,
  add column if not exists onboarding_completed boolean default false;
