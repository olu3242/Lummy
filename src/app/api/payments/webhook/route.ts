import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { markPaymentCompleted, syncCustomerMemoryForOrder, upsertConversionAttribution } from '@/repositories/order-repository';
import { verifyPaystackSignature } from '@/lib/payments/paystack/provider';
import { validatePaymentRuntimeEnv } from '@/lib/runtime-config';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';
import { notifyCreator, sendCustomerReceipt, notifyCreatorEmail, emitEvent } from '@/lib/automation/sdk';

type ParsedWebhook = {
  eventId: string;
  eventType: string;
  providerReference: string;
  metadata: { orderId: string; paymentId: string; organizationId: string };
};

function verifyStripeSignature(rawBody: string, signature?: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const v1 = signature.split(',').find((s) => s.startsWith('v1='))?.slice(3);
  if (!v1) return false;
  const timestamp = signature.split(',').find((s) => s.startsWith('t='))?.slice(2);
  if (!timestamp) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false;
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return expected === v1;
}

function parseWebhook(rawBody: string): ParsedWebhook {
  const payload = JSON.parse(rawBody);

  if (payload.event === 'charge.success') {
    return {
      eventId: payload.data?.id?.toString() || payload.data?.reference,
      eventType: 'checkout.session.completed',
      providerReference: payload.data?.reference,
      metadata: payload.data?.metadata,
    };
  }

  if (payload.type === 'checkout.session.completed') {
    return {
      eventId: payload.id,
      eventType: payload.type,
      providerReference: payload.data?.object?.id,
      metadata: payload.data?.object?.metadata,
    };
  }

  throw new Error('Unsupported webhook event');
}

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  validatePaymentRuntimeEnv();
  const rawBody = await req.text();
  const stripeSig = req.headers.get('stripe-signature');
  const paystackSig = req.headers.get('x-paystack-signature');

  const valid = verifyStripeSignature(rawBody, stripeSig) || verifyPaystackSignature(rawBody, paystackSig);
  if (!valid) {
    logApiEvent('warn', 'payments.webhook_invalid_signature', { correlationId });
    return errorResponse(401, 'INVALID_WEBHOOK_SIGNATURE', 'Invalid webhook signature', correlationId);
  }

  try {
    const parsed = parseWebhook(rawBody);
    if (!parsed.metadata?.orderId || !parsed.metadata?.paymentId || !parsed.metadata?.organizationId) {
      logApiEvent('warn', 'payments.webhook_missing_metadata', { correlationId, eventId: parsed.eventId, eventType: parsed.eventType });
      return errorResponse(400, 'MISSING_WEBHOOK_METADATA', 'Missing metadata linkage', correlationId);
    }

    const supabase = createClient();
    const webhookInsert = await supabase.from('provider_webhook_events').insert({
      tenant_id: parsed.metadata.organizationId,
      idempotency_key: parsed.eventId,
      raw_payload: rawBody,
    });

    if (webhookInsert.error) {
      if (webhookInsert.error.message.toLowerCase().includes('duplicate') || webhookInsert.error.message.toLowerCase().includes('unique')) {
        logApiEvent('warn', 'payments.webhook_duplicate_event', { correlationId, eventId: parsed.eventId });
        return NextResponse.json({ ok: true, duplicate: true, correlationId }, { headers: { 'x-correlation-id': correlationId } });
      }
      logApiEvent('error', 'payments.webhook_persistence_error', { correlationId, message: webhookInsert.error.message });
      return errorResponse(500, 'WEBHOOK_PERSISTENCE_ERROR', 'Webhook event persistence failed', correlationId);
    }

    if (parsed.eventType === 'checkout.session.completed') {
      await markPaymentCompleted({
        orderId: parsed.metadata.orderId,
        paymentId: parsed.metadata.paymentId,
        providerReference: parsed.providerReference,
        providerEventId: parsed.eventId,
      });
      await syncCustomerMemoryForOrder({ orgId: parsed.metadata.organizationId, orderId: parsed.metadata.orderId, paymentId: parsed.metadata.paymentId, correlationId });
      const paymentRow = await supabase.from('payments').select('amount').eq('id', parsed.metadata.paymentId).eq('organization_id', parsed.metadata.organizationId).maybeSingle();
      if (paymentRow.error) throw paymentRow.error;
      await upsertConversionAttribution({ orgId: parsed.metadata.organizationId, orderId: parsed.metadata.orderId, checkoutId: parsed.metadata.orderId, conversionType: 'payment', conversionStatus: 'payment_completed', revenueAmount: Number(paymentRow.data?.amount || 0) });

      // ── P0: Notifications on payment ──────────────────────────────────────
      const amountNgn = Number(paymentRow.data?.amount || 0)
      const amountFormatted = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amountNgn)
      const sdkCtx = { tenantId: parsed.metadata.organizationId, correlationId }

      // 1. Enrich order data for notifications
      const admin = createAdminClient()
      const [orderRow, orgRow] = await Promise.all([
        admin.from('orders')
          .select('customer_email,customer_name,customer_phone,creator_id')
          .eq('id', parsed.metadata.orderId)
          .maybeSingle(),
        admin.from('organizations')
          .select('name')
          .eq('id', parsed.metadata.organizationId)
          .maybeSingle(),
      ])

      const order = orderRow.data as { customer_email?: string; customer_name?: string; customer_phone?: string; creator_id?: string } | null
      const org = orgRow.data as { name?: string } | null
      const storeName = org?.name ?? "Lummy Store"

      // 2. Resolve creator profile for notification
      let creatorUserId: string | null = null
      let creatorEmail: string | null = null
      if (order?.creator_id) {
        const creatorRow = await admin.from('creator_profiles')
          .select('user_id, contact_email')
          .eq('id', order.creator_id)
          .maybeSingle()
        const creator = creatorRow.data as { user_id?: string; contact_email?: string } | null
        creatorUserId = creator?.user_id ?? null
        creatorEmail = creator?.contact_email ?? null
      }

      // 3. In-app notification to creator
      if (creatorUserId) {
        void notifyCreator({
          userId: creatorUserId,
          title: `${amountFormatted} received! 💰`,
          body: `Payment confirmed for order #${parsed.metadata.orderId.slice(0, 8).toUpperCase()}. Check your orders.`,
          actionUrl: '/dashboard/orders',
          ctx: sdkCtx,
        })
      }

      // 4. Email notification to creator
      if (creatorEmail) {
        void notifyCreatorEmail({
          to: creatorEmail,
          creatorName: storeName,
          customerName: order?.customer_name ?? 'Customer',
          productName: 'Order',
          amountFormatted,
          orderReference: parsed.metadata.orderId.slice(0, 8).toUpperCase(),
          ctx: sdkCtx,
        })
      }

      // 5. Receipt email to customer
      if (order?.customer_email) {
        void sendCustomerReceipt({
          to: order.customer_email,
          customerName: order.customer_name ?? 'Customer',
          orderReference: parsed.metadata.orderId.slice(0, 8).toUpperCase(),
          productName: 'Your Order',
          amountFormatted,
          storeName,
          storeHandle: parsed.metadata.organizationId,
          ctx: sdkCtx,
        })
      }

      // 6. Emit automation event for downstream workflows
      void emitEvent('payment_received', sdkCtx, {
        orderId:        parsed.metadata.orderId,
        paymentId:      parsed.metadata.paymentId,
        amountKobo:     amountNgn * 100,
        amountFormatted,
        correlationId,
      }, `payment_received:${parsed.metadata.paymentId}`)
    }

    logApiEvent('info', 'payments.webhook_processed', { correlationId, eventId: parsed.eventId, eventType: parsed.eventType, paymentId: parsed.metadata.paymentId });
    return NextResponse.json({ ok: true, correlationId }, { headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logApiEvent('error', 'payments.webhook_processing_failed', {
      correlationId,
      message: error instanceof Error ? error.message : 'Webhook processing failed',
    });
    const supabase = createClient();
    await supabase.from('messaging_failures').insert({
      tenant_id: 'unknown',
      reason: error instanceof Error ? error.message : 'Webhook processing failed',
    });
    return errorResponse(500, 'WEBHOOK_PROCESSING_FAILED', 'Webhook processing failed', correlationId);
  }
}
