'use server';

import { saveOnboardingProfile, ensureOrganizationForUser } from '@/repositories/onboarding-repository';
import { upsertStorefront } from '@/repositories/storefront-repository';
import { createProduct } from '@/repositories/product-repository';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { sendStorefrontLiveEmail, sendCreatorWelcomeEmail } from '@/lib/notifications/email';

type OnboardingLogContext = Record<string, unknown>;

function logOnboarding(event: string, context: OnboardingLogContext = {}) {
  console.info(`[onboarding:${event}]`, {
    event,
    at: new Date().toISOString(),
    ...context,
  });
}

function logOnboardingError(event: string, error: unknown, context: OnboardingLogContext = {}) {
  const err = error as { message?: string; code?: string; details?: string; hint?: string; stack?: string };
  console.error(`[onboarding:${event}]`, {
    event,
    at: new Date().toISOString(),
    message: err?.message ?? String(error),
    code: err?.code,
    details: err?.details,
    hint: err?.hint,
    stack: err?.stack,
    ...context,
  });
}

function logOnboardingWrite(
  event: string,
  context: {
    correlationId: string;
    payload?: unknown;
    resultData?: unknown;
    error?: { code?: string; message?: string; details?: string; hint?: string } | null;
    [key: string]: unknown;
  },
) {
  const { error, ...rest } = context;
  const level = error ? 'error' : 'info';
  const payload = {
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
    console.error(`[onboarding:${event}]`, payload);
    return;
  }
  console.info(`[onboarding:${event}]`, payload);
}

function onboardingCertificationFailed(details: Record<string, unknown>) {
  return Object.assign(new Error('onboarding_certification_failed'), {
    code: 'onboarding_certification_failed',
    details,
  });
}

export async function saveOnboardingStep(input: { full_name?: string; phone?: string; country?: string; currency?: string; handle?: string; organizationId?: string }) {
  await saveOnboardingProfile({ ...input, onboarding_step: 'profile' });
  if (input.organizationId && input.handle) await upsertStorefront(input.organizationId, { handle: input.handle });
}

export async function completeOnboarding(input: {
  fullName: string;
  phone: string;
  country?: string;
  currency?: string;
  locale?: string;
  timezone?: string;
  orgName: string;
  handle: string;
  productTitle?: string;
  productPrice?: number;
  productDescription?: string;
}) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');
  const admin = createAdminClient();

  const correlationId = `onb_${auth.user.id.slice(0, 8)}_${Date.now()}`;
  logOnboarding('complete.start', { correlationId, userId: auth.user.id, email: auth.user.email, handle: input.handle });

  const organization = await ensureOrganizationForUser({
    userId: auth.user.id,
    orgName: input.orgName,
    country: input.country,
    currency: input.currency,
    locale: input.locale,
    timezone: input.timezone,
    correlationId,
  });
  if (!organization?.id) {
    logOnboardingError('organization.missing', new Error('Organization bootstrap returned no id'), { correlationId, userId: auth.user.id });
    throw new Error('Organization bootstrap failed');
  }
  logOnboarding('organization.ready', { correlationId, userId: auth.user.id, organizationId: organization.id });

  const storefront = await upsertStorefront(organization.id, { handle: input.handle, is_active: true, correlationId });
  if (storefront.error) {
    logOnboardingError('storefront.upsert_failed', storefront.error, { correlationId, organizationId: organization.id, handle: input.handle });
    throw storefront.error;
  }
  if (!storefront.data?.id || !storefront.data?.handle) {
    logOnboardingError('storefront.missing_after_upsert', new Error('Storefront upsert returned no row'), { correlationId, organizationId: organization.id, handle: input.handle });
    throw new Error('Storefront creation failed');
  }
  logOnboarding('storefront.ready', { correlationId, organizationId: organization.id, storefrontId: storefront.data.id, handle: storefront.data.handle });

  if (input.productTitle && input.productPrice && input.productPrice > 0) {
    const product = await createProduct(organization.id, {
      title: input.productTitle,
      price: input.productPrice,
      description: input.productDescription,
      currency: input.currency ?? 'USD',
      correlationId,
    });
    if (product.error) {
      logOnboardingError('product.create_failed', product.error, { correlationId, organizationId: organization.id, title: input.productTitle });
      throw product.error;
    }
    logOnboarding('product.ready', { correlationId, organizationId: organization.id, productId: product.data?.id });
  }

  // Upsert creator_profiles so getCreatorByHandle() can resolve WhatsApp + store_schema.
  const cleanHandle = input.handle.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
  const creatorProfilePayload = {
    user_id: auth.user.id,
    handle: cleanHandle,
    business_name: input.orgName,
    whatsapp_number: input.phone,
    is_published: true,
    onboarding_completed: true,
  };
  logOnboardingWrite('creator_profiles.upsert.start', { correlationId, payload: creatorProfilePayload });
  const creatorProfile = await admin
    .from('creator_profiles')
    .upsert(creatorProfilePayload, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (creatorProfile.error) {
    logOnboardingWrite('creator_profiles.upsert.failed', { correlationId, payload: creatorProfilePayload, error: creatorProfile.error });
    throw creatorProfile.error;
  }
  logOnboardingWrite('creator_profiles.upsert.succeeded', { correlationId, payload: creatorProfilePayload, resultData: creatorProfile.data });

  // Write canonical onboarding_states record for future continuity bootstrap.
  // Uses upsert so re-running completeOnboarding is idempotent.
  const onboardingStatePayload = {
    user_id: auth.user.id,
    organization_id: organization.id,
    current_step: 'completed',
    completed: true,
    metadata: {
      completed_at: new Date().toISOString(),
      store_handle: cleanHandle,
      storefront_id: storefront.data.id,
      locale: input.locale ?? 'en-US',
      timezone: input.timezone ?? 'UTC',
      country: input.country ?? 'US',
      currency: input.currency ?? 'USD',
    },
  };
  logOnboardingWrite('onboarding_states.upsert.start', { correlationId, payload: onboardingStatePayload });
  const onboardingState = await admin
    .from('onboarding_states')
    .upsert(onboardingStatePayload, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (onboardingState.error) {
    logOnboardingWrite('onboarding_states.upsert.failed', { correlationId, payload: onboardingStatePayload, error: onboardingState.error });
    throw onboardingState.error;
  }
  logOnboardingWrite('onboarding_states.upsert.succeeded', { correlationId, payload: onboardingStatePayload, resultData: onboardingState.data });

  const profilePayload = {
    id: auth.user.id,
    email: auth.user.email ?? `${auth.user.id}@unknown.lummy.local`,
    full_name: input.fullName,
    phone: input.phone,
    onboarding_completed: true,
    onboarding_step: 'completed',
    organization_id: organization.id,
    default_storefront_id: storefront.data.id,
  };
  logOnboardingWrite('profiles.upsert.start', { correlationId, payload: profilePayload });
  const profileUpdate = await admin
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' })
    .select('id,email,full_name,phone,organization_id,default_storefront_id,onboarding_completed,onboarding_step')
    .single();
  if (profileUpdate.error) {
    logOnboardingWrite('profiles.upsert.failed', { correlationId, payload: profilePayload, error: profileUpdate.error });
    throw profileUpdate.error;
  }
  logOnboardingWrite('profiles.upsert.succeeded', { correlationId, payload: profilePayload, resultData: profileUpdate.data });

  const [profileCheck, membershipCheck, organizationCheck, storefrontCheck] = await Promise.all([
    admin.from('profiles').select('id,organization_id,default_storefront_id,onboarding_completed,onboarding_step').eq('id', auth.user.id).maybeSingle(),
    admin.from('organization_members').select('organization_id,user_id,role').eq('user_id', auth.user.id).eq('organization_id', organization.id).maybeSingle(),
    admin.from('organizations').select('id,owner_id,name,slug').eq('id', organization.id).maybeSingle(),
    admin.from('storefronts').select('id,organization_id,handle,is_active').eq('organization_id', organization.id).maybeSingle(),
  ]);

  for (const [name, result] of Object.entries({ profileCheck, membershipCheck, organizationCheck, storefrontCheck })) {
    if (result.error) {
      logOnboardingWrite(`certification.${name}.failed`, { correlationId, payload: { userId: auth.user.id, organizationId: organization.id }, error: result.error });
      throw result.error;
    }
    if (!result.data) {
      const error = onboardingCertificationFailed({ missing: name, userId: auth.user.id, organizationId: organization.id });
      logOnboardingError(`certification.${name}.missing`, error, { correlationId, organizationId: organization.id });
      throw error;
    }
  }

  const certificationFailures = [
    !profileCheck.data?.organization_id ? 'profiles.organization_id_missing' : null,
    profileCheck.data?.default_storefront_id !== storefrontCheck.data?.id ? 'profiles.default_storefront_id_missing_or_mismatch' : null,
    profileCheck.data?.onboarding_completed !== true ? 'profiles.onboarding_completed_not_true' : null,
    !membershipCheck.data ? 'organization_members.missing' : null,
    !organizationCheck.data ? 'organizations.missing' : null,
    !storefrontCheck.data ? 'storefronts.missing' : null,
  ].filter(Boolean);

  if (certificationFailures.length > 0) {
    const error = onboardingCertificationFailed({
      failures: certificationFailures,
      profile: profileCheck.data,
      membership: membershipCheck.data,
      organization: organizationCheck.data,
      storefront: storefrontCheck.data,
    });
    logOnboardingError('certification.failed', error, { correlationId, organizationId: organization.id });
    throw error;
  }

  logOnboarding('complete.verified', {
    correlationId,
    userId: auth.user.id,
    organizationId: organization.id,
    profile: profileCheck.data,
    membership: membershipCheck.data,
    organization: organizationCheck.data,
    storefront: storefrontCheck.data,
    dashboardRedirect: '/dashboard',
    storefrontUrl: `/${cleanHandle}`,
  });

  // Fire-and-forget: storefront-live + welcome emails (non-blocking)
  const creatorEmail = auth.user.email;
  if (creatorEmail) {
    void sendStorefrontLiveEmail({
      to: creatorEmail,
      creatorName: input.fullName,
      storeName: input.orgName,
      storeHandle: cleanHandle,
    }).catch(() => { /* non-critical — never block onboarding completion */ });

    void sendCreatorWelcomeEmail({
      to: creatorEmail,
      creatorName: input.fullName,
      storeHandle: cleanHandle,
      storeName: input.orgName,
    }).catch(() => {});
  }

  return { organizationId: organization.id, handle: cleanHandle };
}

export async function markStorefrontShared() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');
  const correlationId = `share_${auth.user.id.slice(0, 8)}_${Date.now()}`;
  logOnboarding('share.start', { correlationId, userId: auth.user.id });

  const existing = await supabase
    .from('onboarding_states')
    .select('organization_id, metadata')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (existing.error) {
    logOnboardingError('share.state_lookup_failed', existing.error, { correlationId, userId: auth.user.id });
    throw existing.error;
  }

  let organizationId = existing.data?.organization_id ?? null;
  if (!organizationId) {
    const profile = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', auth.user.id)
      .maybeSingle();
    if (profile.error) {
      logOnboardingError('share.profile_lookup_failed', profile.error, { correlationId, userId: auth.user.id });
      throw profile.error;
    }
    organizationId = profile.data?.organization_id ?? null;
  }
  if (!organizationId) {
    logOnboardingError('share.organization_missing', new Error('No organization context for share state'), { correlationId, userId: auth.user.id });
    throw new Error('No organization context');
  }

  const previousMetadata =
    existing.data?.metadata && typeof existing.data.metadata === 'object'
      ? existing.data.metadata as Record<string, unknown>
      : {};
  const previousActivation =
    previousMetadata.activation && typeof previousMetadata.activation === 'object'
      ? previousMetadata.activation as Record<string, unknown>
      : {};

  const sharedAt = new Date().toISOString();
  const result = await supabase.from('onboarding_states').upsert(
    {
      user_id: auth.user.id,
      organization_id: organizationId,
      current_step: 'completed',
      completed: true,
      metadata: {
        ...previousMetadata,
        activation: {
          ...previousActivation,
          storefront_shared_at: sharedAt,
          storefront_shared_channel: 'whatsapp',
        },
      },
      updated_at: sharedAt,
    },
    { onConflict: 'user_id' },
  );
  if (result.error) {
    logOnboardingError('share.state_update_failed', result.error, { correlationId, userId: auth.user.id, organizationId });
    throw result.error;
  }
  logOnboarding('share.completed', { correlationId, userId: auth.user.id, organizationId });
}
