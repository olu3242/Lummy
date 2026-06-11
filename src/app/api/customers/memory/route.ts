import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';

export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized', correlationId);

    const profile = await supabase.from('profiles').select('organization_id').eq('id', auth.user.id).maybeSingle();
    if (profile.error || !profile.data?.organization_id) return errorResponse(400, 'ORG_NOT_FOUND', 'Organization not found', correlationId);

    const orgId = profile.data.organization_id;
    const customers = await supabase.from('customer_profiles').select('id,customer_identifier,email,phone,total_orders,total_revenue,lifecycle_stage,ai_summary,last_interaction_at').eq('org_id', orgId).order('updated_at', { ascending: false }).limit(50);
    if (customers.error) throw customers.error;

    const customerIds = (customers.data ?? []).map((c) => c.id);
    const timeline = customerIds.length === 0
      ? { data: [] }
      : await supabase.from('customer_timeline_events').select('id,customer_profile_id,event_type,event_summary,created_at').eq('org_id', orgId).in('customer_profile_id', customerIds).order('created_at', { ascending: false }).limit(200);
    if ('error' in timeline && timeline.error) throw timeline.error;

    const opportunities = (customers.data ?? [])
      .filter((c) => c.lifecycle_stage === 'repeat_customer' || c.lifecycle_stage === 'high_value_customer' || c.lifecycle_stage === 'abandoned_customer' || c.lifecycle_stage === 'inactive_customer')
      .slice(0, 8)
      .map((c) => ({ customerIdentifier: c.customer_identifier, lifecycleStage: c.lifecycle_stage, suggestion: c.ai_summary || 'Recommend follow-up for repeat revenue.' }));

    return NextResponse.json({ customers: customers.data ?? [], timeline: ('data' in timeline ? timeline.data : []) ?? [], opportunities, correlationId }, { headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logApiEvent('error', 'customers.memory_fetch_failed', { correlationId, message: error instanceof Error ? error.message : 'unknown error' });
    return errorResponse(500, 'CUSTOMER_MEMORY_FETCH_FAILED', 'Failed to fetch customer memory', correlationId);
  }
}
