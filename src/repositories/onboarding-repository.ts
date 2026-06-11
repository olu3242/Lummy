import { createAdminClient, createClient } from '@/lib/supabase/server';

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

function logOnboardingWrite(
  level: 'info' | 'error',
  event: string,
  context: {
    correlationId?: string;
    payload?: unknown;
    resultData?: unknown;
    error?: { code?: string; message?: string; details?: string; hint?: string } | null;
    [key: string]: unknown;
  },
) {
  const { error, ...rest } = context;
  const logPayload = {
    event,
    at: new Date().toISOString(),
    ...rest,
    resultData: rest.resultData ?? null,
    error: {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    },
  };

  if (level === 'error') {
    console.error(`[onboarding:${event}]`, logPayload);
    return;
  }
  console.info(`[onboarding:${event}]`, logPayload);
}

async function certifyAuthContext(
  supabase: ReturnType<typeof createClient>,
  input: { correlationId?: string; authUserId: string },
) {
  console.error('[AUTH_CONTEXT]', {
    correlationId: input.correlationId,
    authUserId: input.authUserId,
  });

  const result = await supabase.rpc('auth_user_id');
  const authUid = result.data ?? null;

  console.error('[AUTH_UID]', {
    correlationId: input.correlationId,
    authUid,
    error: result.error
      ? {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
        }
      : null,
    match: authUid === input.authUserId,
  });

  return { authUid, error: result.error };
}

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

export async function ensureOrganizationForUser(input: { userId: string; orgName: string; country?: string; currency?: string; locale?: string; timezone?: string; correlationId?: string }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  const authUserId = auth.user.id;
  const requestedUserId = input.userId;
  const userIdMatchesAuthUser = requestedUserId === authUserId;
  const ownerId = authUserId;
  const admin = createAdminClient();

  const existingMembership = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', ownerId)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle();

  if (existingMembership.error) throw existingMembership.error;

  if (existingMembership.data?.organization_id) {
    const orgRow = await admin
      .from('organizations')
      .select('*')
      .eq('id', existingMembership.data.organization_id)
      .maybeSingle();
    if (orgRow.error) throw orgRow.error;
    if (orgRow.data) return orgRow.data as unknown as { id: string; name: string; slug: string };
  }

  const base = toSlug(input.orgName) || `org-${ownerId.slice(0, 6)}`;
  const slugBase = RESERVED_ORG_SLUGS.has(base) ? `${base}-${ownerId.slice(0, 4)}` : base;

  let slug = '';
  for (let i = 0; i < 5; i += 1) {
    const suffix = i === 0 ? '' : `-${i + 1}`;
    const candidate = `${slugBase}${suffix}`;
    const clash = await admin.from('organizations').select('id').eq('slug', candidate).limit(1);
    if (clash.error) throw clash.error;
    if ((clash.data?.length ?? 0) === 0) {
      slug = candidate;
      break;
    }
  }
  // If all 5 attempts collide, append a random suffix to guarantee uniqueness
  if (!slug) slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

  const insertPayload = {
    owner_id: ownerId,
    name: input.orgName,
    slug,
    country: input.country ?? 'US',
    currency: input.currency ?? 'USD',
  };

  logOnboardingWrite('info', 'organizations.insert.start', {
    correlationId: input.correlationId,
    payload: insertPayload,
    owner_id: insertPayload.owner_id,
    authUserId,
    payloadContainsOwnerId: Object.prototype.hasOwnProperty.call(insertPayload, 'owner_id'),
    ownerIdMatchesAuthUser: insertPayload.owner_id === authUserId,
    requestedUserId,
    requestedUserIdMatchesAuthUser: userIdMatchesAuthUser,
  });

  const authContext = await certifyAuthContext(supabase, {
    correlationId: input.correlationId,
    authUserId,
  });

  if (authContext.error) {
    logOnboardingWrite('error', 'auth_context.certification_unavailable', {
      correlationId: input.correlationId,
      payload: { authUserId },
      error: authContext.error,
    });
  }

  const createdOrg = await admin
    .from('organizations')
    .insert(insertPayload)
    .select('*')
    .single();

  if (createdOrg.error) {
    // 23505 = unique violation. A partial previous attempt already created this user's org
    // (UNIQUE(owner_id)) or the slug collided. Recover the existing org by owner lookup
    // instead of failing the whole onboarding.
    if (createdOrg.error.code === '23505') {
      const ownerOrg = await admin
        .from('organizations')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();
      if (ownerOrg.data) {
        // Ensure the owner membership exists too (the previous attempt may have failed
        // between org INSERT and membership INSERT).
        const recoveredMembershipPayload = { organization_id: (ownerOrg.data as { id: string }).id, user_id: ownerId, role: 'owner' };
        const recoveredMembership = await admin.from('organization_members').upsert(
          recoveredMembershipPayload,
          { onConflict: 'organization_id,user_id' },
        ).select('*').single();
        if (recoveredMembership.error) {
          logOnboardingWrite('error', 'organization_members.recovery_upsert.failed', {
            correlationId: input.correlationId,
            payload: recoveredMembershipPayload,
            error: recoveredMembership.error,
          });
          throw recoveredMembership.error;
        }
        logOnboardingWrite('info', 'organizations.insert.recovered_existing_owner_org', {
          correlationId: input.correlationId,
          payload: insertPayload,
          resultData: ownerOrg.data,
        });
        return ownerOrg.data as unknown as { id: string; name: string; slug: string };
      }
    }
    logOnboardingWrite('error', 'organizations.insert.failed', {
      correlationId: input.correlationId,
      payload: insertPayload,
      owner_id: insertPayload.owner_id,
      authUserId,
      payloadContainsOwnerId: Object.prototype.hasOwnProperty.call(insertPayload, 'owner_id'),
      ownerIdMatchesAuthUser: insertPayload.owner_id === authUserId,
      error: createdOrg.error,
    });
    throw createdOrg.error;
  }
  logOnboardingWrite('info', 'organizations.insert.succeeded', {
    correlationId: input.correlationId,
    payload: insertPayload,
    resultData: createdOrg.data,
    owner_id: insertPayload.owner_id,
    authUserId,
    payloadContainsOwnerId: Object.prototype.hasOwnProperty.call(insertPayload, 'owner_id'),
    ownerIdMatchesAuthUser: insertPayload.owner_id === authUserId,
  });

  const membershipPayload = {
    organization_id: createdOrg.data.id,
    user_id: ownerId,
    role: 'owner',
  };

  logOnboardingWrite('info', 'organization_members.upsert.start', {
    correlationId: input.correlationId,
    payload: membershipPayload,
  });

  const membership = await admin
    .from('organization_members')
    .upsert(membershipPayload, { onConflict: 'organization_id,user_id' })
    .select('*')
    .single();

  if (membership.error) {
    logOnboardingWrite('error', 'organization_members.upsert.failed', {
      correlationId: input.correlationId,
      payload: membershipPayload,
      error: membership.error,
    });
    throw membership.error;
  }
  logOnboardingWrite('info', 'organization_members.upsert.succeeded', {
    correlationId: input.correlationId,
    payload: membershipPayload,
    resultData: membership.data,
  });

  return createdOrg.data;
}
