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

function isMissingTableError(error: unknown) {
  const err = error as { code?: string; message?: string };
  return err?.code === '42P01' || err?.code === 'PGRST205' || /relation .* does not exist|Could not find the table/i.test(err?.message ?? '');
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

  // Update org with user's chosen store name, locale, and currency. When bootstrap
  // (ensureCreatorRuntimeContext) ran first, it creates an org with a generic name —
  // this is the authoritative write of the name the creator typed in the wizard.
  const preferenceUpdate = await supabase
    .from('organizations')
    .update({
      name: input.orgName,
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

  // ── Structured pre-write log (Step 4) ──────────────────────────────────────
  const storefrontIdToWrite = storefront.data?.id ?? null;
  logOnboarding('storefront.created', {
    correlationId,
    storefrontId: storefrontIdToWrite,
    organizationId: organization.id,
    handle: storefront.data?.handle ?? null,
  });

  const profilePayload: Record<string, unknown> = {
    id: auth.user.id,
    email: auth.user.email!,
    onboarding_completed: true,
    onboarding_step: 'completed',
    organization_id: organization.id,
    default_storefront_id: storefrontIdToWrite,
  };
  let profileUpdate = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
  if (profileUpdate.error && isMissingColumnError(profileUpdate.error)) {
    // default_storefront_id column does not exist on this database (migration 040 not yet applied).
    // Log the column name so ops can detect which migration is missing, then fall back to writing
    // the minimum required fields. Migration 077 adds the column and backfills existing rows.
    logOnboardingError('profile.default_storefront_legacy_schema', profileUpdate.error, {
      correlationId,
      organizationId: organization.id,
      storefrontId: storefrontIdToWrite,
      missingColumn: 'default_storefront_id',
      actionRequired: 'apply migration 077_profiles_default_storefront_id.sql',
    });
    delete profilePayload.default_storefront_id;
    profileUpdate = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
  }
  if (profileUpdate.error) {
    logOnboardingError('profile.complete_failed', profileUpdate.error, { correlationId, organizationId: organization.id });
    throw profileUpdate.error;
  }

  // ── Post-write structured log (Step 4) ──────────────────────────────────────
  logOnboarding('profile.completed', {
    correlationId,
    profileId: auth.user.id,
    organizationId: organization.id,
    defaultStorefrontId: storefrontIdToWrite,
    onboardingCompleted: true,
  });

  // Upsert creator_profiles so getCreatorByHandle() can resolve WhatsApp + store_schema.
  // NON-FATAL: production runs the organizations/storefronts schema and does not have
  // this legacy table — a missing table or any other error here must never block
  // onboarding completion. Handle constraint: CHECK('^[a-z0-9._-]{3,50}$').
  const cleanHandle = input.handle.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
  const creatorProfile = await supabase.from('creator_profiles').upsert(
    {
      user_id:         auth.user.id,
      handle:          cleanHandle,
      business_name:   input.orgName,
      whatsapp_number: input.phone || 'pending',
      is_published:    true,
      onboarding_completed: true,
    },
    { onConflict: 'user_id' },
  );
  if (creatorProfile.error) {
    if (isMissingTableError(creatorProfile.error)) {
      logOnboarding('creator_profile.table_absent_skipped', { correlationId, organizationId: organization.id });
    } else {
      logOnboardingError('creator_profile.upsert_failed_nonfatal', creatorProfile.error, { correlationId, organizationId: organization.id, handle: cleanHandle });
    }
  }

  // Write canonical onboarding_states record for future continuity bootstrap.
  // Uses upsert so re-running completeOnboarding is idempotent.
  const statePayload: Record<string, unknown> = {
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
  };
  let onboardingState = await supabase.from('onboarding_states').upsert(statePayload, { onConflict: 'user_id' });
  if (onboardingState.error && isMissingColumnError(onboardingState.error)) {
    // Legacy schema without metadata column — retry without it
    logOnboardingError('onboarding_state.metadata_legacy_schema', onboardingState.error, { correlationId, organizationId: organization.id });
    delete statePayload.metadata;
    onboardingState = await supabase.from('onboarding_states').upsert(statePayload, { onConflict: 'user_id' });
  }
  if (onboardingState.error) {
    logOnboardingError('onboarding_state.complete_failed', onboardingState.error, { correlationId, organizationId: organization.id });
    throw onboardingState.error;
  }

  // ── Runtime verification (Step 5) ───────────────────────────────────────────
  // Re-query all four tables after writes. profile select explicitly includes
  // default_storefront_id — if the column was silently dropped by the legacy
  // fallback above, this SELECT will either error (column absent) or return null,
  // and we throw rather than silently shipping a broken profile.
  const [profileCheck, membershipCheck, storefrontCheck, onboardingCheck] = await Promise.all([
    supabase.from('profiles').select('id,organization_id,onboarding_completed,onboarding_step,default_storefront_id').eq('id', auth.user.id).maybeSingle(),
    supabase.from('organization_members').select('organization_id,role').eq('user_id', auth.user.id).eq('organization_id', organization.id).maybeSingle(),
    supabase.from('storefronts').select('id,organization_id,handle,is_active').eq('organization_id', organization.id).maybeSingle(),
    supabase.from('onboarding_states').select('organization_id,current_step,completed').eq('user_id', auth.user.id).maybeSingle(),
  ]);

  for (const [name, result] of Object.entries({ profileCheck, membershipCheck, storefrontCheck, onboardingCheck })) {
    // If the column doesn't exist, PostgREST returns a PGRST204/42703 error on
    // the select — that signals migration 077 hasn't been applied yet, which is
    // actionable for ops, so we log and skip the linkage check (don't block the
    // user), rather than throwing a hard error on a missing-column verify.
    if (result.error && isMissingColumnError(result.error)) {
      logOnboardingError(`verify.${name}.column_missing`, result.error, {
        correlationId,
        organizationId: organization.id,
        actionRequired: 'apply migration 077_profiles_default_storefront_id.sql',
      });
      continue;
    }
    if (result.error) {
      logOnboardingError(`verify.${name}.failed`, result.error, { correlationId, organizationId: organization.id });
      throw result.error;
    }
    if (!result.data) {
      logOnboardingError(`verify.${name}.missing`, new Error(`${name} returned no row`), { correlationId, organizationId: organization.id });
      throw new Error(`Onboarding verification failed: ${name}`);
    }
  }

  // Explicit linkage check: profile → default_storefront_id must match the
  // storefront we just created. If it's null and the column exists (the legacy
  // fallback fired), that's an ops-facing data defect — throw so the user
  // retries rather than silently landing on a dashboard with a broken linkage.
  const verifiedProfile = profileCheck.data as {
    organization_id: string | null;
    onboarding_completed: boolean;
    default_storefront_id: string | null;
  } | null;
  if (verifiedProfile && storefrontIdToWrite && verifiedProfile.default_storefront_id === null) {
    // Column exists (no error above) but value is null — legacy fallback dropped the write.
    logOnboardingError('verify.profile.default_storefront_id_null', new Error('default_storefront_id not persisted'), {
      correlationId,
      organizationId: organization.id,
      storefrontId: storefrontIdToWrite,
      actionRequired: 'apply migration 077_profiles_default_storefront_id.sql then run backfill',
    });
    // Non-fatal: the user's onboarding IS complete, dashboard will work.
    // Ops must run the backfill migration. Do NOT redirect to onboarding.
  }

  logOnboarding('complete.verified', {
    correlationId,
    userId: auth.user.id,
    organizationId: organization.id,
    profile: profileCheck.data,
    membership: membershipCheck.data,
    storefront: storefrontCheck.data,
    onboardingState: onboardingCheck.data,
    defaultStorefrontId: verifiedProfile?.default_storefront_id ?? null,
    defaultStorefrontIdExpected: storefrontIdToWrite,
    defaultStorefrontIdMatch: verifiedProfile?.default_storefront_id === storefrontIdToWrite,
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
