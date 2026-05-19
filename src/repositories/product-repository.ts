import { createClient } from '@/lib/supabase/server';

export async function createProduct(organizationId: string, input: { title: string; price: number; description?: string; image_url?: string; status?: string }) {
  const supabase = createClient();
  return supabase
    .from('products')
    .insert({ organization_id: organizationId, title: input.title, price: input.price, description: input.description ?? null, image_url: input.image_url ?? null, status: input.status ?? 'active' })
    .select('*')
    .single();
}

export async function createProductForCurrentUser(input: { title: string; price: number; description?: string; image_url?: string }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  const profile = await supabase.from('profiles').select('organization_id').eq('id', auth.user.id).maybeSingle();
  if (profile.error) throw profile.error;
  if (!profile.data?.organization_id) throw new Error('No organization context');

  const membership = await supabase.from('organization_members').select('role').eq('organization_id', profile.data.organization_id).eq('user_id', auth.user.id).maybeSingle();
  if (membership.error) throw membership.error;
  if (!membership.data) throw new Error('Forbidden');

  const created = await createProduct(profile.data.organization_id, input);
  if (created.error) throw created.error;
  return created.data;
}

export async function getPublishedProductsByHandle(handle: string) {
  const supabase = createClient();
  const storefront = await supabase.from('storefronts').select('organization_id,is_active').eq('handle', handle).maybeSingle();
  if (storefront.error) throw storefront.error;
  if (!storefront.data?.is_active) return [];

  const products = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', storefront.data.organization_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (products.error) throw products.error;
  return products.data;
}
