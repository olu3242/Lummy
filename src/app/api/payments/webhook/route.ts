import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncCustomerMemoryForOrder, upsertConversionAttribution } from '@/repositories/order-repository';
import { handleProviderWebhook } from '../../../../packages/payments-core/src/orchestrator';
import { detectProviderFromHeaders } from '../../../../packages/payments-core/src/provider-router';
import { validateProviderRuntimeEnv } from '@/lib/runtime-config';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';
import { createPaymentDatabaseAdapter } from '@/lib/payments/payment-db-adapter';

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });

  try {
    const provider = detectProviderFromHeaders(headers);
    validateProviderRuntimeEnv(provider);
    const supabase = await createClient();
    const tx = await handleProviderWebhook(createPaymentDatabaseAdapter(supabase as never), provider, headers, rawBody, correlationId);

    if (!tx) {
      logApiEvent('warn', 'payments.webhook_invalid_signature', { correlationId, provider });
      return errorResponse(401, 'INVALID_WEBHOOK_SIGNATURE', 'Invalid webhook signature', correlationId);
    }

    const metadata = tx.metadata as { orderId?: string; paymentId?: string; organizationId?: string };
    if (!metadata?.orderId || !metadata?.paymentId || !metadata?.organizationId) {
      logApiEvent('warn', 'payments.webhook_missing_metadata', { correlationId, eventId: tx.id, provider });
      return errorResponse(400, 'MISSING_WEBHOOK_METADATA', 'Missing metadata linkage', correlationId);
    }

    if (['settled', 'captured', 'authorized', 'reconciled'].includes(tx.status)) {
      await syncCustomerMemoryForOrder({ orgId: metadata.organizationId, orderId: metadata.orderId, paymentId: metadata.paymentId, correlationId });
      const paymentRow = await supabase.from('payments').select('amount').eq('id', metadata.paymentId).eq('organization_id', metadata.organizationId).maybeSingle();
      if (paymentRow.error) throw paymentRow.error;
      await upsertConversionAttribution({ orgId: metadata.organizationId, orderId: metadata.orderId, checkoutId: metadata.orderId, conversionType: 'payment', conversionStatus: 'payment_completed', revenueAmount: Number(paymentRow.data?.amount || 0) });
    }

    logApiEvent('info', 'payments.webhook_processed', { correlationId, eventId: tx.id, provider, paymentId: metadata.paymentId });
    return NextResponse.json({ ok: true, correlationId }, { headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logApiEvent('error', 'payments.webhook_processing_failed', {
      correlationId,
      message: error instanceof Error ? error.message : 'Webhook processing failed',
    });
    const supabase = await createClient();
    await supabase.from('messaging_failures').insert({
      tenant_id: 'unknown',
      reason: error instanceof Error ? error.message : 'Webhook processing failed',
    });
    return errorResponse(500, 'WEBHOOK_PROCESSING_FAILED', 'Webhook processing failed', correlationId);
  }
}
