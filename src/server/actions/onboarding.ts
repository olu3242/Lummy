'use server';

import { saveOnboardingProfile, ensureOrganizationForUser } from '@/repositories/onboarding-repository';
import { upsertStorefront } from '@/repositories/storefront-repository';
import { createProduct } from '@/repositories/product-repository';
import { createClient } from '@/lib/supabase/server';
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

function isMissingColumnError(error: unknown) {
  const err = error as { code?: string; message?: string };
  return err?.code === '42703' || err?.code === 'PGRST204' || /column .* does not exist|Could not find .* column/i.test(err?.message ?? '');
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

  const correlationId = `onb_${auth.user.id.slice(0, 8)}_${Date.now()}`;
  logOnboarding('complete.start', { correlationId, userId: auth.user.id, email: auth.user.email, handle: input.handle });

  await saveOnboardingProfile({ full_name: input.fullName, phone: input.phone, country: input.country, currency: input.currency, onboarding_step: 'organization' });
  logOnboarding('profile.saved', { correlationId, userId: auth.user.id });

  const organization = await ensureOrganizationForUser({ userId: auth.user.id, orgName: input.orgName, country: input.country, currency: input.currency });
  if (!organization?.id) {
    logOnboardingError('organization.missing', new Error('Organization bootstrap returned no id'), { correlationId, userId: auth.user.id });
    throw new Error('Organization bootstrap failed');
  }
  logOnboarding('organization.ready', { correlationId, userId: auth.user.id, organizationId: organization.id });

  const preferenceUpdate = await supabase
    .from('organizations')
    .update({
      country: input.country ?? 'US',
      currency: input.currency ?? 'USD',
      country_code: input.country ?? 'US',
      currency_code: input.currency ?? 'USD',
      locale: input.locale ?? 'en-US',
      timezone: input.timezone ?? 'UTC',
    })
    .eq('id', organization.id);
  if (preferenceUpdate.error) {
    if (isMissingColumnError(preferenceUpdate.error)) {
      logOnboardingError('organization.preferences_legacy_schema', preferenceUpdate.error, { correlationId, organizationId: organization.id });
      const legacyUpdate = await supabase
        .from('organizations')
        .update({ country: input.country ?? 'US', currency: input.currency ?? 'USD' })
        .eq('id', organization.id);
      if (legacyUpdate.error) {
        logOnboardingError('organization.legacy_preferences_failed', legacyUpdate.error, { correlationId, organizationId: organization.id });
        throw legacyUpdate.error;
      }
    } else {
      logOnboardingError('organization.preferences_failed', preferenceUpdate.error, { correlationId, organizationId: organization.id });
      throw preferenceUpdate.error;
    }
  }

  const storefront = await upsertStorefront(organization.id, { handle: input.handle });
  if (storefront.error) {
    logOnboardingError('storefront.upsert_failed', storefront.error, { correlationId, organizationId: organization.id, handle: input.handle });
    throw storefront.error;
  }
  if (!storefront.data?.id && !storefront.data?.handle) {
    logOnboardingError('storefront.missing_after_upsert', new Error('Storefront upsert returned no row'), { correlationId, organizationId: organization.id, handle: input.handle });
    throw new Error('Storefront creation failed');
  }
  logOnboarding('storefront.ready', { correlationId, organizationId: organization.id, storefrontId: storefront.data.id, handle: storefront.data.handle });

  // Publish storefront immediately so it's accessible at /{handle}
  const publish = await supabase.from('storefronts').update({ is_active: true }).eq('organization_id', organization.id);
  if (publish.error) {
    logOnboardingError('storefront.publish_failed', publish.error, { correlationId, organizationId: organization.id });
    throw publish.error;
  }

  if (input.productTitle && input.productPrice && input.productPrice > 0) {
    // Skip if a product with this title already exists (prevents duplicate on double-submit)
    const existingProduct = await supabase
      .from('products')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('title', input.productTitle)
      .maybeSingle();
    if (existingProduct.error) {
      logOnboardingError('product.existing_lookup_failed', existingProduct.error, { correlationId, organizationId: organization.id });
      throw existingProduct.error;
    }
    if (!existingProduct.data) {
      const product = await createProduct(organization.id, { title: input.productTitle, price: input.productPrice, description: input.productDescription, currency: input.currency ?? 'USD' });
      if (product.error) {
        logOnboardingError('product.create_failed', product.error, { correlationId, organizationId: organization.id, title: input.productTitle });
        throw product.error;
      }
      logOnboarding('product.ready', { correlationId, organizationId: organization.id, productId: product.data?.id });
    }
  }

  const profileUpdate = await supabase.from('profiles').upsert(
    { id: auth.user.id, email: auth.user.email!, onboarding_completed: true, onboarding_step: 'completed', organization_id: organization.id },
    { onConflict: 'id' },
  );
  if (profileUpdate.error) {
    logOnboardingError('profile.complete_failed', profileUpdate.error, { correlationId, organizationId: organization.id });
    throw profileUpdate.error;
  }

  // Upsert creator_profiles so getCreatorByHandle() can resolve WhatsApp + store_schema.
  // is_published = true makes the creator discoverable on public storefront.
  const cleanHandle = input.handle.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
  const creatorProfile = await supabase.from('creator_profiles').upsert(
    {
      user_id:       auth.user.id,
      handle:        cleanHandle,
      business_name: input.orgName,
      whatsapp_number: input.phone,
      is_published:  true,
      onboarding_completed: true,
    },
    { onConflict: 'user_id' },
  );
  if (creatorProfile.error) {
    logOnboardingError('creator_profile.upsert_failed', creatorProfile.error, { correlationId, organizationId: organization.id, handle: cleanHandle });
    throw creatorProfile.error;
  }

  // Write canonical onboarding_states record for future continuity bootstrap.
  // Uses upsert so re-running completeOnboarding is idempotent.
  const onboardingState = await supabase.from('onboarding_states').upsert(
    {
      user_id: auth.user.id,
      organization_id: organization.id,
      current_step: 'completed',
      completed: true,
      metadata: {
        completed_at: new Date().toISOString(),
        store_handle: cleanHandle,
        locale: input.locale ?? 'en-US',
        timezone: input.timezone ?? 'UTC',
        country: input.country ?? 'US',
        currency: input.currency ?? 'USD',
      },
    },
    { onConflict: 'user_id' },
  );
  if (onboardingState.error) {
    logOnboardingError('onboarding_state.complete_failed', onboardingState.error, { correlationId, organizationId: organization.id });
    throw onboardingState.error;
  }

  const [profileCheck, membershipCheck, storefrontCheck, onboardingCheck] = await Promise.all([
    supabase.from('profiles').select('id,organization_id,onboarding_completed,onboarding_step').eq('id', auth.user.id).maybeSingle(),
    supabase.from('organization_members').select('organization_id,role').eq('user_id', auth.user.id).eq('organization_id', organization.id).maybeSingle(),
    supabase.from('storefronts').select('id,organization_id,handle,is_active').eq('organization_id', organization.id).maybeSingle(),
    supabase.from('onboarding_states').select('organization_id,current_step,completed').eq('user_id', auth.user.id).maybeSingle(),
  ]);

  for (const [name, result] of Object.entries({ profileCheck, membershipCheck, storefrontCheck, onboardingCheck })) {
    if (result.error) {
      logOnboardingError(`verify.${name}.failed`, result.error, { correlationId, organizationId: organization.id });
      throw result.error;
    }
    if (!result.data) {
      logOnboardingError(`verify.${name}.missing`, new Error(`${name} returned no row`), { correlationId, organizationId: organization.id });
      throw new Error(`Onboarding verification failed: ${name}`);
    }
  }
  logOnboarding('complete.verified', {
    correlationId,
    userId: auth.user.id,
    organizationId: organization.id,
    profile: profileCheck.data,
    membership: membershipCheck.data,
    storefront: storefrontCheck.data,
    onboardingState: onboardingCheck.data,
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
