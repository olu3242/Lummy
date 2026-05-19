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
  const supabase = await createClient();
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

  return { organizationId: organization.id };
}
