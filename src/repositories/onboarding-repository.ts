import { createClient } from '@/lib/supabase/server';

const RESERVED_ORG_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'dashboard',
  'login',
  'signup',
  'onboarding',
  'www',
  'support',
  'help',
  'root',
]);

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9- ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export async function saveOnboardingProfile(input: {
  full_name?: string;
  phone?: string;
  country?: string;
  currency?: string;
  onboarding_step?: string;
  onboarding_completed?: boolean;
  organization_id?: string;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  const update: Record<string, unknown> = {
    id: auth.user.id,
    email: auth.user.email!,
    full_name: input.full_name ?? null,
    phone: input.phone ?? null,
  };

  if (input.onboarding_step !== undefined) update.onboarding_step = input.onboarding_step;
  if (input.onboarding_completed !== undefined) update.onboarding_completed = input.onboarding_completed;
  if (input.organization_id !== undefined) update.organization_id = input.organization_id;

  const result = await supabase.from('profiles').upsert(update, { onConflict: 'id' });
  if (result.error) throw result.error;
}

export async function ensureOrganizationForUser(input: { userId: string; orgName: string; country?: string; currency?: string }) {
  const supabase = await createClient();

  const existingMembership = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(*)')
    .eq('user_id', input.userId)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle();

  if (existingMembership.error) throw existingMembership.error;
  if (existingMembership.data?.organizations) {
    return existingMembership.data.organizations as { id: string; name: string; slug: string };
  }

  const base = toSlug(input.orgName) || `org-${input.userId.slice(0, 6)}`;
  const slugBase = RESERVED_ORG_SLUGS.has(base) ? `${base}-${input.userId.slice(0, 4)}` : base;

  let slug = '';
  for (let i = 0; i < 5; i += 1) {
    const suffix = i === 0 ? '' : `-${i + 1}`;
    const candidate = `${slugBase}${suffix}`;
    const clash = await supabase.from('organizations').select('id').eq('slug', candidate).limit(1);
    if (clash.error) throw clash.error;
    if ((clash.data?.length ?? 0) === 0) {
      slug = candidate;
      break;
    }
  }
  // If all 5 attempts collide, append a random suffix to guarantee uniqueness
  if (!slug) slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

  const createdOrg = await supabase
    .from('organizations')
    .insert({
      owner_id: input.userId,
      name: input.orgName,
      slug,
      country: input.country ?? 'US',
      currency: input.currency ?? 'USD',
    })
    .select('*')
    .single();

  if (createdOrg.error) throw createdOrg.error;

  const membership = await supabase.from('organization_members').insert({
    organization_id: createdOrg.data.id,
    user_id: input.userId,
    role: 'owner',
  });

  if (membership.error) {
    await supabase.from('organizations').delete().eq('id', createdOrg.data.id);
    throw membership.error;
  }

  return createdOrg.data;
}
