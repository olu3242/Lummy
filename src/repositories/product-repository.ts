import { createAdminClient, createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { logApiEvent } from '@/lib/ops-observability';

function logProductQueryError(query: string, error: { code?: string; message?: string; details?: string; hint?: string }, extra: Record<string, unknown> = {}) {
  logApiEvent('error', 'product.repository_query_failed', {
    correlationId: extra.correlationId ?? randomUUID(),
    query,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    ...extra,
  });
}

function logProductWrite(
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

export async function createProduct(organizationId: string, input: { title: string; price: number; description?: string; image_url?: string; status?: string; currency?: string; correlationId?: string }) {
  const supabase = createAdminClient();
  const title = input.title?.trim();
  const price = Number(input.price);
  if (!title) throw new Error('Product title is required');
  if (!Number.isInteger(price) || price <= 0) throw new Error('Product price must be a positive integer in minor units');

  const payload = {
    organization_id: organizationId,
    title,
    price,
    description: input.description ?? null,
    image_url: input.image_url ?? null,
    status: input.status ?? 'active',
    currency: input.currency ?? 'USD',
  };
  logProductWrite('info', 'onboarding.products.insert.start', {
    correlationId: input.correlationId,
    payload,
  });

  const product = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single();
  if (product.error) {
    logProductWrite('error', 'onboarding.products.insert.failed', {
      correlationId: input.correlationId,
      payload,
      error: product.error,
    });
    logProductQueryError('createProduct.products_insert', product.error, { organizationId, title });
  } else {
    logProductWrite('info', 'onboarding.products.insert.succeeded', {
      correlationId: input.correlationId,
      payload,
      resultData: product.data,
    });
  }
  return product;
}

export async function createProductForCurrentUser(input: { title: string; price: number; description?: string; image_url?: string; currency?: string }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  const profile = await supabase.from('profiles').select('organization_id').eq('id', auth.user.id).maybeSingle();
  if (profile.error) {
    logProductQueryError('createProductForCurrentUser.profiles', profile.error, { userId: auth.user.id });
    throw profile.error;
  }
  if (!profile.data?.organization_id) throw new Error('No organization context');

  const membership = await supabase.from('organization_members').select('role').eq('organization_id', profile.data.organization_id).eq('user_id', auth.user.id).maybeSingle();
  if (membership.error) {
    logProductQueryError('createProductForCurrentUser.organization_members', membership.error, { userId: auth.user.id, organizationId: profile.data.organization_id });
    throw membership.error;
  }
  if (!membership.data) throw new Error('Forbidden');

  const organization = await supabase.from('organizations').select('currency_code').eq('id', profile.data.organization_id).maybeSingle();
  if (organization.error) {
    logProductQueryError('createProductForCurrentUser.organizations', organization.error, { organizationId: profile.data.organization_id });
    throw organization.error;
  }

  const created = await createProduct(profile.data.organization_id, {
    ...input,
    currency: input.currency ?? organization.data?.currency_code ?? 'USD',
  });
  if (created.error) throw created.error;
  return created.data;
}

export async function getPublishedProductsByHandle(handle: string) {
  const supabase = createClient();
  const storefront = await supabase.from('storefronts').select('organization_id,is_active').eq('handle', handle).maybeSingle();
  if (storefront.error) {
    logProductQueryError('getPublishedProductsByHandle.storefronts', storefront.error, { handle });
    throw storefront.error;
  }
  if (!storefront.data?.is_active) return [];

  const organization = await supabase.from('organizations').select('currency_code').eq('id', storefront.data.organization_id).maybeSingle();
  if (organization.error) {
    logProductQueryError('getPublishedProductsByHandle.organizations', organization.error, { organizationId: storefront.data.organization_id });
    throw organization.error;
  }

  const products = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', storefront.data.organization_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (products.error) {
    logProductQueryError('getPublishedProductsByHandle.products', products.error, { organizationId: storefront.data.organization_id });
    throw products.error;
  }
  const fallbackCurrency = organization.data?.currency_code ?? 'USD';
  return (products.data ?? []).map(product => ({
    ...product,
    currency: product.currency ?? fallbackCurrency,
  }));
}
