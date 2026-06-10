'use server';

import { saveOnboardingProfile, ensureOrganizationForUser } from '@/repositories/onboarding-repository';
import { upsertStorefront } from '@/repositories/storefront-repository';
import { createProduct } from '@/repositories/product-repository';
import { createClient } from '@/lib/supabase/server';

export async function saveOnboardingStep(input: { full_name?: string; phone?: string; country?: string; currency?: string; handle?: string; organizationId?: string }) {
  await saveOnboardingProfile({ ...input, onboarding_step: 'profile' });
  if (input.organizationId && input.handle) await upsertStorefront(input.organizationId, { handle: input.handle });
}

export async function completeOnboarding(input: {
  fullName: string;
  phone: string;
  country?: string;
  currency?: string;
  orgName: string;
  handle: string;
  productTitle?: string;
  productPrice?: number;
  productDescription?: string;
}) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  const userId = auth.user.id;
  const correlationId = `onb_${userId.slice(0, 8)}_${Date.now()}`;
  const log = (stage: string, extra?: Record<string, unknown>) =>
    console.info(JSON.stringify({ ts: new Date().toISOString(), event: `onboarding.${stage}`, userId, correlationId, ...extra }));

  log('start', { orgName: input.orgName, handle: input.handle });

  const realFullName = (auth.user.user_metadata?.full_name as string | undefined) || input.fullName;
  await saveOnboardingProfile({ full_name: realFullName, phone: input.phone, country: input.country, currency: input.currency, onboarding_step: 'organization' });
  log('profile_draft_saved');

  const organization = await ensureOrganizationForUser({ userId, orgName: input.orgName, country: input.country, currency: input.currency });
  log('org_ensured', { orgId: organization.id });

  const storefront = await upsertStorefront(organization.id, { handle: input.handle });
  if (storefront.error) throw storefront.error;
  log('storefront_upserted', { storefrontId: storefront.data?.id, handle: input.handle });

  await supabase.from('storefronts').update({ is_active: true }).eq('organization_id', organization.id);

  if (input.productTitle && input.productPrice && input.productPrice > 0) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('title', input.productTitle)
      .maybeSingle();
    if (!existing) {
      const product = await createProduct(organization.id, { title: input.productTitle, price: input.productPrice, description: input.productDescription });
      if (product.error) throw product.error;
      log('product_created', { productId: (product.data as { id?: string } | null)?.id });
    }
  }

  // UPSERT (not update) so that if the profiles row was never bootstrapped (e.g. trigger
  // not yet applied), we create it here rather than silently matching 0 rows.
  const profileUpsert = await supabase.from('profiles').upsert(
    {
      id:                    userId,
      email:                 auth.user.email!,
      onboarding_completed:  true,
      onboarding_step:       'completed',
      organization_id:       organization.id,
      default_storefront_id: storefront.data?.id ?? null,
    },
    { onConflict: 'id' },
  );
  if (profileUpsert.error) throw profileUpsert.error;
  log('profile_completed', { orgId: organization.id, storefrontId: storefront.data?.id });

  const cleanHandle = input.handle.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
  if (cleanHandle) {
    const creatorProfileResult = await supabase.from('creator_profiles').upsert(
      {
        user_id:              userId,
        handle:               cleanHandle,
        business_name:        input.orgName,
        whatsapp_number:      input.phone,
        is_published:         true,
        onboarding_completed: true,
      },
      { onConflict: 'user_id' },
    );
    if (creatorProfileResult.error) {
      // Non-fatal: creator_profiles is for legacy handle resolution. Log and continue.
      console.warn(JSON.stringify({ ts: new Date().toISOString(), event: 'onboarding.creator_profile_warn', userId, correlationId, error: creatorProfileResult.error.message, code: creatorProfileResult.error.code }));
    } else {
      log('creator_profile_upserted');
    }
  }

  const stateUpsert = await supabase.from('onboarding_states').upsert(
    { user_id: userId, organization_id: organization.id, current_step: 'completed', completed: true },
    { onConflict: 'user_id' },
  );
  if (stateUpsert.error) {
    console.warn(JSON.stringify({ ts: new Date().toISOString(), event: 'onboarding.state_warn', userId, correlationId, error: stateUpsert.error.message }));
  } else {
    log('state_completed');
  }

  log('done', { orgId: organization.id });
  return { organizationId: organization.id };
}
