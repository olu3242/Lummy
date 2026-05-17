import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const body = await req.json();
    const supabase = await createClient();

    const interaction = await supabase.from('customer_interactions').select('id,org_id,source_channel,associated_checkout_id').eq('id', body.interactionId).eq('source_channel', 'whatsapp').maybeSingle();
    if (interaction.error || !interaction.data) return errorResponse(404, 'INTERACTION_NOT_FOUND', 'WhatsApp interaction not found', correlationId);

    const suggestedMessage = body.template || 'Hi! Just checking in — your checkout is still open. Reply here if you need any help before payment.';
    const recovery = await supabase.from('whatsapp_recovery_events').insert({ org_id: interaction.data.org_id, interaction_id: interaction.data.id, checkout_id: interaction.data.associated_checkout_id, event_type: body.reason || 'inactivity_followup', suggested_message: suggestedMessage, correlation_id: correlationId, status: 'queued' }).select('*').single();
    if (recovery.error) throw recovery.error;

    await supabase.from('conversion_recovery_queue').update({ recovery_status: 'processing', retry_count: 0 }).eq('interaction_id', interaction.data.id).eq('org_id', interaction.data.org_id);
    return NextResponse.json({ recoveryEventId: recovery.data.id, suggestedMessage, correlationId }, { headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logApiEvent('error', 'whatsapp.recovery_failed', { correlationId, message: error instanceof Error ? error.message : 'unknown error' });
    return errorResponse(500, 'WHATSAPP_RECOVERY_FAILED', 'Failed to queue recovery workflow', correlationId);
  }
}
