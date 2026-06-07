'use server';

import { saveOnboardingProfile, ensureOrganizationForUser } from '@/repositories/onboarding-repository';
import { upsertStorefront } from '@/repositories/storefront-repository';
import { createProduct } from '@/repositories/product-repository';
import { createClient } from '@/lib/supabase/server';
import { sendStorefrontLiveEmail, sendCreatorWelcomeEmail } from '@/lib/notifications/email';

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

  await saveOnboardingProfile({ full_name: input.fullName, phone: input.phone, country: input.country, currency: input.currency, onboarding_step: 'organization' });
  const organization = await ensureOrganizationForUser({ userId: auth.user.id, orgName: input.orgName, country: input.country, currency: input.currency });
  // Update org with user's chosen store name, locale, and currency. When bootstrap
  // (ensureCreatorRuntimeContext) ran first, it creates an org with a generic name —
  // this is the authoritative write of the name the creator typed in the wizard.
  await supabase
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

  const storefront = await upsertStorefront(organization.id, { handle: input.handle });
  if (storefront.error) throw storefront.error;

  // Publish storefront immediately so it's accessible at /{handle}
  await supabase.from('storefronts').update({ is_active: true }).eq('organization_id', organization.id);

  if (input.productTitle && input.productPrice && input.productPrice > 0) {
    // Skip if a product with this title already exists (prevents duplicate on double-submit)
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('title', input.productTitle)
      .maybeSingle();
    if (!existing) {
      const product = await createProduct(organization.id, { title: input.productTitle, price: input.productPrice, description: input.productDescription, currency: input.currency ?? 'USD' });
      if (product.error) throw product.error;
    }
  }

  const profileUpdate = await supabase.from('profiles').upsert(
    { id: auth.user.id, email: auth.user.email!, onboarding_completed: true, onboarding_step: 'completed', organization_id: organization.id },
    { onConflict: 'id' },
  );
  if (profileUpdate.error) throw profileUpdate.error;

  // Upsert creator_profiles so getCreatorByHandle() can resolve WhatsApp + store_schema.
  // is_published = true makes the creator discoverable on public storefront.
  // NOTE: creator_profiles.handle has CHECK('^[a-z0-9._-]{3,50}$') — dots are now allowed
  // after migration 075 relaxed the constraint. Storefronts and creator_profiles share handles.
  const cleanHandle = input.handle.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
  const creatorProfileResult = await supabase.from('creator_profiles').upsert(
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
  if (creatorProfileResult.error) {
    // Non-fatal: log but don't block dashboard access. The public.users backfill in
    // migration 075 should prevent this, but guard against any residual FK issues.
    console.error('[completeOnboarding] creator_profiles upsert failed:', creatorProfileResult.error.message);
  }

  // Write canonical onboarding_states record for future continuity bootstrap.
  // Uses upsert so re-running completeOnboarding is idempotent.
  await supabase.from('onboarding_states').upsert(
    { user_id: auth.user.id, organization_id: organization.id, current_step: 'completed', completed: true },
    { onConflict: 'user_id' },
  );

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

  return { organizationId: organization.id };
}

export async function markStorefrontShared() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  const existing = await supabase
    .from('onboarding_states')
    .select('organization_id, metadata')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (existing.error) throw existing.error;

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
      organization_id: existing.data?.organization_id ?? null,
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
  if (result.error) throw result.error;
}
