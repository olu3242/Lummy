import { createClient } from '@/lib/supabase/server';

export async function upsertStorefront(organizationId: string, payload: { handle: string; bio?: string; hero_image?: string }) {
  const supabase = await createClient();
  return supabase.from('storefronts').upsert({ organization_id: organizationId, handle: payload.handle, bio: payload.bio ?? null, hero_image: payload.hero_image ?? null }, { onConflict: 'organization_id' }).select('*').single();
}
