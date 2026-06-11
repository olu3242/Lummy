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
  const supabase = createClient();
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
  const supabase = createClient();

  // Two-step lookup (not an embedded organizations(*) join): embedded joins evaluate the
  // nested resource under its own RLS, which returned null during bootstrap and caused
  // retries to fall through to INSERT and hit UNIQUE(owner_id).
  const existingMembership = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', input.userId)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle();

  if (existingMembership.error) throw existingMembership.error;

  if (existingMembership.data?.organization_id) {
    const orgRow = await supabase
      .from('organizations')
      .select('*')
      .eq('id', existingMembership.data.organization_id)
      .maybeSingle();
    if (orgRow.error) throw orgRow.error;
    if (orgRow.data) return orgRow.data as unknown as { id: string; name: string; slug: string };
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

  if (createdOrg.error) {
    // 23505 = unique violation. A partial previous attempt already created this user's org
    // (UNIQUE(owner_id)) or the slug collided. Recover the existing org by owner lookup
    // instead of failing the whole onboarding.
    if (createdOrg.error.code === '23505') {
      const ownerOrg = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', input.userId)
        .maybeSingle();
      if (ownerOrg.data) {
        // Ensure the owner membership exists too (the previous attempt may have failed
        // between org INSERT and membership INSERT).
        await supabase.from('organization_members').upsert(
          { organization_id: (ownerOrg.data as { id: string }).id, user_id: input.userId, role: 'owner' },
          { onConflict: 'organization_id,user_id' },
        );
        return ownerOrg.data as unknown as { id: string; name: string; slug: string };
      }
    }
    throw createdOrg.error;
  }

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
