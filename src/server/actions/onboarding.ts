'use server';

import { saveOnboardingProfile } from '@/repositories/onboarding-repository';
import { upsertStorefront } from '@/repositories/storefront-repository';

export async function saveOnboardingStep(input: { full_name?: string; phone?: string; country?: string; currency?: string; handle?: string; organizationId?: string }) {
  await saveOnboardingProfile(input);
  if (input.organizationId && input.handle) await upsertStorefront(input.organizationId, { handle: input.handle });
}
