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
      const product = await createProduct(organization.id, { title: input.productTitle, price: input.productPrice, description: input.productDescription });
      if (product.error) throw product.error;
    }
  }

  const profileUpdate = await supabase.from('profiles').update({ onboarding_completed: true, onboarding_step: 'completed', organization_id: organization.id }).eq('id', auth.user.id);
  if (profileUpdate.error) throw profileUpdate.error;

  // Upsert creator_profiles so getCreatorByHandle() can resolve WhatsApp + store_schema.
  // is_published = true makes the creator discoverable on public storefront.
  const cleanHandle = input.handle.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
  await supabase.from('creator_profiles').upsert(
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
