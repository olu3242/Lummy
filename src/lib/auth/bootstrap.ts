import { createClient } from '@/lib/supabase/server';
import { ensureOrganizationForUser, saveOnboardingProfile } from '@/repositories/onboarding-repository';
import { upsertStorefront } from '@/repositories/storefront-repository';

const normalizeHandle = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '').slice(0, 50);

const fallbackHandle = (email: string, userId: string) => {
  const local = normalizeHandle(email.split('@')[0] ?? '');
  const base = local.length >= 3 ? local : `creator-${userId.slice(0, 6)}`;
  return normalizeHandle(`${base}-${userId.slice(0, 4)}`);
};

export async function ensureUserWorkspace(input?: {
  fullName?: string | null;
  handle?: string | null;
  next?: string | null;
}) {
  const supabase = createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error('Unauthorized');

  const user = auth.user;
  const email = user.email ?? '';
  const fullName =
    input?.fullName ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    email.split('@')[0] ??
    'Creator';

  await saveOnboardingProfile({
    full_name: fullName,
    onboarding_step: 'profile',
    onboarding_completed: false,
  });

  const organization = await ensureOrganizationForUser({
    userId: user.id,
    orgName: `${fullName}'s Workspace`,
    country: 'NG',
    currency: 'NGN',
  });

  const preferredHandle =
    normalizeHandle(input?.handle ?? user.user_metadata?.handle ?? '') ||
    fallbackHandle(email, user.id);

  try {
    await upsertStorefront(organization.id, { handle: preferredHandle });
  } catch {
    await upsertStorefront(organization.id, { handle: fallbackHandle(email, user.id) });
  }

  await supabase
    .from('profiles')
    .update({ organization_id: organization.id, onboarding_step: 'organization' })
    .eq('id', user.id);

  return { user, organizationId: organization.id };
}
