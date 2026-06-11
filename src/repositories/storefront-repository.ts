import { createAdminClient, createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { logApiEvent } from '@/lib/ops-observability';

const RESERVED_STOREFRONT_HANDLES = new Set(['admin', 'api', 'app', 'dashboard', 'login', 'signup', 'onboarding', 'www']);

const normalizeHandle = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');

function logStorefrontQueryError(query: string, error: { code?: string; message?: string; details?: string; hint?: string }, extra: Record<string, unknown> = {}) {
  logApiEvent('error', 'storefront.repository_query_failed', {
    correlationId: extra.correlationId ?? randomUUID(),
    query,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    ...extra,
  });
}

function logStorefrontWrite(
  level: 'info' | 'error',
  event: string,
  context: {
    correlationId?: string;
    payload?: unknown;
    resultData?: unknown;
    error?: { code?: string; message?: string; details?: string; hint?: string } | null;
    [key: string]: unknown;
  },
) {
  const { error, ...rest } = context;
  logApiEvent(level, event, {
    ...rest,
    resultData: rest.resultData ?? null,
    error: {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    },
  });
}

function fallbackHandle(input: { existingHandle?: string | null; storeName?: string; email?: string | null; userId: string }) {
  const fromExisting = normalizeHandle(input.existingHandle ?? '');
  if (fromExisting && !RESERVED_STOREFRONT_HANDLES.has(fromExisting)) return fromExisting;
  const fromStore = normalizeHandle(input.storeName ?? '');
  if (fromStore && !RESERVED_STOREFRONT_HANDLES.has(fromStore)) return fromStore;
  const fromEmail = normalizeHandle(input.email?.split('@')[0] ?? '');
  if (fromEmail && !RESERVED_STOREFRONT_HANDLES.has(fromEmail)) return fromEmail;
  return `creator-${input.userId.slice(0, 8)}`;
}

async function availableHandle(supabase: ReturnType<typeof createClient>, organizationId: string, handle: string, userId: string) {
  const clean = normalizeHandle(handle);
  const clash = await supabase.from('storefronts').select('organization_id').eq('handle', clean).neq('organization_id', organizationId).limit(1);
  if (clash.error) {
    logStorefrontQueryError('availableHandle.storefronts_clash', clash.error, { organizationId, handle: clean });
    throw clash.error;
  }
  if ((clash.data?.length ?? 0) === 0) return clean;
  return `${clean}-${userId.slice(0, 6)}`;
}

export async function upsertStorefront(organizationId: string, payload: { handle: string; bio?: string; hero_image?: string; is_active?: boolean; correlationId?: string }) {
  const supabase = createAdminClient();
  const cleanHandle = normalizeHandle(payload.handle);
  if (!cleanHandle || RESERVED_STOREFRONT_HANDLES.has(cleanHandle)) throw new Error('Reserved storefront handle');

  const clash = await supabase.from('storefronts').select('organization_id').eq('handle', cleanHandle).neq('organization_id', organizationId).limit(1);
  if (clash.error) {
    logStorefrontQueryError('upsertStorefront.storefronts_clash', clash.error, { organizationId, handle: cleanHandle });
    throw clash.error;
  }
  if ((clash.data?.length ?? 0) > 0) throw new Error('Storefront handle already taken');

  const writePayload = {
    organization_id: organizationId,
    handle: cleanHandle,
    bio: payload.bio ?? null,
    hero_image: payload.hero_image ?? null,
    ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
  };
  logStorefrontWrite('info', 'onboarding.storefronts.upsert.start', {
    correlationId: payload.correlationId,
    payload: writePayload,
  });

  const storefront = await supabase
    .from('storefronts')
    .upsert(writePayload, { onConflict: 'organization_id' })
    .select('*')
    .single();
  if (storefront.error) {
    logStorefrontWrite('error', 'onboarding.storefronts.upsert.failed', {
      correlationId: payload.correlationId,
      payload: writePayload,
      error: storefront.error,
    });
    logStorefrontQueryError('upsertStorefront.storefronts_upsert', storefront.error, { organizationId, handle: cleanHandle });
  } else {
    logStorefrontWrite('info', 'onboarding.storefronts.upsert.succeeded', {
      correlationId: payload.correlationId,
      payload: writePayload,
      resultData: storefront.data,
    });
  }
  return storefront;
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
  if (membership.error) {
    logStorefrontQueryError('updateStorefrontForCurrentUser.organization_members', membership.error, { userId: auth.user.id });
    throw membership.error;
  }
  if (!membership.data?.organization_id) throw new Error('No organization context');

  const orgId = membership.data.organization_id;
  const existing = await supabase
    .from('storefronts')
    .select('handle')
    .eq('organization_id', orgId)
    .maybeSingle();
  if (existing.error) {
    logStorefrontQueryError('updateStorefrontForCurrentUser.existing_storefront', existing.error, { orgId });
    throw existing.error;
  }

  const patch: Record<string, unknown> = {};

  if (input.handle !== undefined) {
    const cleanHandle = normalizeHandle(input.handle);
    if (!cleanHandle || RESERVED_STOREFRONT_HANDLES.has(cleanHandle)) throw new Error('Reserved storefront handle');
    const clash = await supabase.from('storefronts').select('organization_id').eq('handle', cleanHandle).neq('organization_id', orgId).limit(1);
    if (clash.error) {
      logStorefrontQueryError('updateStorefrontForCurrentUser.storefronts_clash', clash.error, { orgId, handle: cleanHandle });
      throw clash.error;
    }
    if ((clash.data?.length ?? 0) > 0) throw new Error('Storefront handle already taken');
    patch.handle = cleanHandle;
  }

  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.hero_image !== undefined) patch.hero_image = input.hero_image;
  if (input.social_links !== undefined) patch.social_links = input.social_links;
  if (input.publish !== undefined) patch.is_active = input.publish;

  if (input.storeName !== undefined) {
    const orgUpdate = await supabase.from('organizations').update({ name: input.storeName }).eq('id', orgId);
    if (orgUpdate.error) {
      logStorefrontQueryError('updateStorefrontForCurrentUser.organizations_update', orgUpdate.error, { orgId });
      throw orgUpdate.error;
    }
  }

  patch.handle = await availableHandle(
    supabase,
    orgId,
    String(patch.handle ?? fallbackHandle({ existingHandle: existing.data?.handle, storeName: input.storeName, email: auth.user.email, userId: auth.user.id })),
    auth.user.id,
  );

  const storefront = await supabase
    .from('storefronts')
    .upsert({ organization_id: orgId, ...patch }, { onConflict: 'organization_id' })
    .select('*')
    .single();

  if (storefront.error) {
    logStorefrontQueryError('updateStorefrontForCurrentUser.storefronts_upsert', storefront.error, { orgId });
    throw storefront.error;
  }
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

  if (storefront.error) {
    logStorefrontQueryError('getPublishedStorefrontByHandle.storefronts', storefront.error, { handle: cleanHandle });
    throw storefront.error;
  }
  return storefront.data;
}
