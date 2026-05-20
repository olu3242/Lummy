import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateStorefrontForCurrentUser } from '@/repositories/storefront-repository';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';

export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized', correlationId);

  const profile = await supabase.from('profiles').select('organization_id').eq('id', auth.user.id).maybeSingle();
  if (profile.error) {
    logApiEvent('error', 'storefront.profile_lookup_failed', { correlationId, message: profile.error.message });
    return errorResponse(400, 'PROFILE_LOOKUP_FAILED', 'Profile lookup failed', correlationId);
  }
  if (!profile.data?.organization_id) return errorResponse(400, 'NO_ORGANIZATION', 'No organization', correlationId);

  const storefront = await supabase
    .from('storefronts')
    .select('*')
    .eq('organization_id', profile.data.organization_id)
    .maybeSingle();

  if (storefront.error) {
    logApiEvent('error', 'storefront.fetch_failed', { correlationId, message: storefront.error.message });
    return errorResponse(400, 'STOREFRONT_FETCH_FAILED', 'Storefront fetch failed', correlationId);
  }
  return NextResponse.json({ storefront: storefront.data, correlationId }, { headers: { 'x-correlation-id': correlationId } });
}

export async function PATCH(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const body = await req.json();
    const storefront = await updateStorefrontForCurrentUser(body);
    return NextResponse.json({ storefront, correlationId }, { headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logApiEvent('error', 'storefront.update_failed', { correlationId, message: error instanceof Error ? error.message : 'Storefront update failed' });
    return errorResponse(400, 'STOREFRONT_UPDATE_FAILED', 'Storefront update failed', correlationId);
  }
}
