import { createClient } from '@/lib/supabase/server';

export type ConversionEventType =
  | 'inquiry_received'
  | 'intent_detected'
  | 'ai_reply_generated'
  | 'checkout_created'
  | 'payment_completed'
  | 'conversion_recovered'
  | 'recovery_failed';

export async function emitConversionEvent(input: {
  orgId: string;
  interactionId: string;
  eventType: ConversionEventType;
  aiAction: string;
  correlationId: string;
  payload?: Record<string, unknown>;
  processingStatus?: 'completed' | 'failed' | 'pending';
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('ai_conversion_events').insert({
    org_id: input.orgId,
    interaction_id: input.interactionId,
    event_type: input.eventType,
    ai_action: input.aiAction,
    payload: input.payload ?? {},
    correlation_id: input.correlationId,
    processing_status: input.processingStatus ?? 'completed',
  });
  if (error) throw error;
}
