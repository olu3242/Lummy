import { createClient } from '@/lib/supabase/server';

const RESERVED_STOREFRONT_HANDLES = new Set(['admin', 'api', 'app', 'dashboard', 'login', 'signup', 'onboarding', 'www']);

const normalizeHandle = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');

export async function upsertStorefront(organizationId: string, payload: { handle: string; bio?: string; hero_image?: string }) {
  const supabase = createClient();
  const cleanHandle = normalizeHandle(payload.handle);
  if (!cleanHandle || RESERVED_STOREFRONT_HANDLES.has(cleanHandle)) throw new Error('Reserved storefront handle');

  const clash = await supabase.from('storefronts').select('organization_id').eq('handle', cleanHandle).neq('organization_id', organizationId).limit(1);
  if (clash.error) throw clash.error;
  if ((clash.data?.length ?? 0) > 0) throw new Error('Storefront handle already taken');

  return supabase
    .from('storefronts')
    .upsert(
      { organization_id: organizationId, handle: cleanHandle, bio: payload.bio ?? null, hero_image: payload.hero_image ?? null },
      { onConflict: 'organization_id' },
    )
    .select('*')
    .single();
}

export async function updateStorefrontForCurrentUser(input: {
  storeName?: string;
  handle?: string;
  bio?: string;
  hero_image?: string;
  social_links?: Record<string, string>;
  publish?: boolean;
}) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  const membership = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membership.error) throw membership.error;
  if (!membership.data?.organization_id) throw new Error('No organization context');

  const orgId = membership.data.organization_id;

  const patch: Record<string, unknown> = {};

  if (input.handle !== undefined) {
    const cleanHandle = normalizeHandle(input.handle);
    if (!cleanHandle || RESERVED_STOREFRONT_HANDLES.has(cleanHandle)) throw new Error('Reserved storefront handle');
    const clash = await supabase.from('storefronts').select('organization_id').eq('handle', cleanHandle).neq('organization_id', orgId).limit(1);
    if (clash.error) throw clash.error;
    if ((clash.data?.length ?? 0) > 0) throw new Error('Storefront handle already taken');
    patch.handle = cleanHandle;
  }

  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.hero_image !== undefined) patch.hero_image = input.hero_image;
  if (input.social_links !== undefined) patch.social_links = input.social_links;
  if (input.publish !== undefined) patch.is_active = input.publish;

  if (input.storeName !== undefined) {
    const orgUpdate = await supabase.from('organizations').update({ name: input.storeName }).eq('id', orgId);
    if (orgUpdate.error) throw orgUpdate.error;
  }

  const storefront = await supabase
    .from('storefronts')
    .upsert({ organization_id: orgId, ...patch }, { onConflict: 'organization_id' })
    .select('*')
    .single();

  if (storefront.error) throw storefront.error;
  return storefront.data;
}

export async function getPublishedStorefrontByHandle(handle: string) {
  const supabase = createClient();
  const cleanHandle = normalizeHandle(handle);
  const storefront = await supabase
    .from('storefronts')
    .select('handle,bio,hero_image,social_links,is_active,organization_id,store_schema,theme,organizations(name,owner_id)')
    .eq('handle', cleanHandle)
    .eq('is_active', true)
    .maybeSingle();

  if (storefront.error) throw storefront.error;
  return storefront.data;
}
