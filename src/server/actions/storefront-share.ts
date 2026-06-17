'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { buildStorefrontUrl } from '@/lib/whatsapp/share';

async function getCurrentOrgStorefront() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Unauthorized');

  const profile = await supabase.from('profiles').select('organization_id').eq('id', auth.user.id).maybeSingle();
  if (profile.error) throw profile.error;
  const organizationId = profile.data?.organization_id;
  if (!organizationId) throw new Error('No organization context');

  const [storefront, organization] = await Promise.all([
    supabase.from('storefronts').select('id,handle,organization_id').eq('organization_id', organizationId).maybeSingle(),
    supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle(),
  ]);
  if (storefront.error) throw storefront.error;
  if (!storefront.data) throw new Error('Storefront not created yet');

  return { supabase, organizationId, storefront: storefront.data, storeName: organization.data?.name ?? storefront.data.handle };
}

export async function getShareableStorefront() {
  const { storefront, storeName } = await getCurrentOrgStorefront();
  const storeUrl = buildStorefrontUrl(storefront.handle);
  // ?ref=share&src=whatsapp lets the public storefront page attribute the
  // resulting visit back to this share action via recordStorefrontClick().
  const trackedUrl = `${storeUrl}?ref=share&src=whatsapp`;
  const message = `Hey! 👋 Check out ${storeName} on Lummy.\n\nShop here 👉 ${trackedUrl}\n\nDM me to order! 💜`;
  return {
    handle: storefront.handle,
    storeName,
    storeUrl,
    whatsAppShareLink: `https://wa.me/?text=${encodeURIComponent(message)}`,
  };
}

export async function recordStorefrontShare(channel: 'whatsapp' | 'copy_link' | 'instagram') {
  const { supabase, organizationId, storefront } = await getCurrentOrgStorefront();
  const result = await supabase.from('share_events').insert({
    organization_id: organizationId,
    storefront_id: storefront.id,
    event_type: 'share',
    channel,
  });
  if (result.error) throw result.error;
}

export async function recordStorefrontClick(handle: string, customerSource?: string, campaign?: string) {
  const admin = supabaseAdmin();
  const storefront = await admin.from('storefronts').select('id,organization_id').eq('handle', handle).eq('is_active', true).maybeSingle();
  if (storefront.error || !storefront.data) return;

  await admin.from('share_events').insert({
    organization_id: storefront.data.organization_id,
    storefront_id: storefront.data.id,
    event_type: 'click',
    channel: customerSource ?? 'whatsapp',
    customer_source: customerSource ?? null,
    campaign: campaign ?? null,
  });
}

export async function getShareEventSummary() {
  const { supabase, organizationId } = await getCurrentOrgStorefront();
  const events = await supabase.from('share_events').select('event_type,channel,created_at').eq('organization_id', organizationId);
  if (events.error) throw events.error;

  const rows = events.data ?? [];
  const shares = rows.filter((r) => r.event_type === 'share').length;
  const clicks = rows.filter((r) => r.event_type === 'click').length;
  const conversionRate = shares > 0 ? Number(((clicks / shares) * 100).toFixed(1)) : 0;
  return { shares, clicks, conversionRate };
}
