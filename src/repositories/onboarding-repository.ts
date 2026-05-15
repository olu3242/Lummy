import { createClient } from '@/lib/supabase/server';

export async function saveOnboardingProfile(input: { full_name?: string; phone?: string; country?: string; currency?: string }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  await supabase.from('profiles').upsert({ id: auth.user.id, email: auth.user.email!, full_name: input.full_name ?? null, phone: input.phone ?? null });
  await supabase.from('organizations').upsert({ owner_id: auth.user.id, name: `${input.full_name ?? 'Creator'} Org`, slug: auth.user.id.slice(0, 8), country: input.country ?? 'US', currency: input.currency ?? 'USD' }, { onConflict: 'owner_id' });
}
