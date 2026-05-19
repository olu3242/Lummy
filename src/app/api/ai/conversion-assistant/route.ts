import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPendingOrder, upsertConversionAttribution } from '@/repositories/order-repository';
import { createPaystackCheckoutSession } from '@/lib/payments/paystack/provider';
import { createStripeCheckoutSession } from '@/lib/payments/stripe/provider';
import { detectIntent, generateSuggestedReply } from '@/lib/ai-conversion';
import { getCorrelationId, logApiEvent, errorResponse } from '@/lib/ops-observability';
import { emitConversionEvent } from '@/lib/ai-conversion-events';

function buildRedirect(path: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error('Missing NEXT_PUBLIC_APP_URL');
  return `${appUrl}${path}`;
}

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const body = await req.json();
    const supabase = await createClient();
    const storefront = await supabase
      .from('storefronts')
      .select('id,organization_id,handle')
      .eq('handle', body.handle)
      .maybeSingle();

    if (storefront.error || !storefront.data) {
      return errorResponse(404, 'STOREFRONT_NOT_FOUND', 'Storefront not found', correlationId);
    }

    const storefrontId = storefront.data.id;
    const orgId = storefront.data.organization_id;

    const interaction = await supabase
      .from('customer_interactions')
      .insert({
        org_id: orgId,
        storefront_id: storefrontId,
        customer_identifier: body.customerIdentifier || body.customerEmail || 'unknown',
        source_channel: body.sourceChannel || 'storefront',
        interaction_type: 'inquiry',
        message_excerpt: String(body.message || '').slice(0, 240),
        associated_product_id: body.productId ?? null,
        conversion_status: 'new',
      })
      .select('*')
      .single();
    if (interaction.error) throw interaction.error;

    await emitConversionEvent({ orgId, interactionId: interaction.data.id, eventType: 'inquiry_received', aiAction: 'ingestInquiry', correlationId, payload: { source: body.sourceChannel || 'storefront' } });
    await upsertConversionAttribution({ orgId, storefrontId, interactionId: interaction.data.id, customerIdentifier: body.customerIdentifier || body.customerEmail || 'unknown', sourcePlatform: body.sourcePlatform || body.sourceChannel || 'Direct', sourceCampaign: body.sourceCampaign, sourceContentReference: body.sourceContentReference, referralCode: body.referralCode, conversionType: 'inquiry', conversionStatus: 'inquiry_captured' });

    const { intent, confidence } = detectIntent(body.message || '');
    await supabase
      .from('customer_interactions')
      .update({ ai_intent: intent, ai_confidence: confidence, conversion_status: 'intent_detected' })
      .eq('id', interaction.data.id)
      .eq('org_id', orgId);
    await emitConversionEvent({ orgId, interactionId: interaction.data.id, eventType: 'intent_detected', aiAction: 'detectIntent', correlationId, payload: { intent, confidence } });

    let checkoutUrl: string | undefined;
    let orderId: string | undefined;

    if ((intent === 'purchase_intent' || intent === 'pricing_inquiry') && body.productId) {
      const provider = body.method === 'stripe' ? 'stripe' : 'paystack';
      const created = await createPendingOrder({
        organizationId: orgId,
        productId: body.productId,
        customerEmail: body.customerEmail || 'guest@lummy.local',
        quantity: 1,
        provider,
      });

      const metadata = {
        orderId: created.order.id,
        paymentId: created.payment.id,
        organizationId: orgId,
        productId: created.product.id,
        quantity: '1',
      };

      const session = provider === 'stripe'
        ? await createStripeCheckoutSession({ amount: Number(created.order.amount), currency: created.order.currency, customerEmail: created.order.customer_email, metadata, successUrl: buildRedirect(`/track/${created.order.id}?status=success`), cancelUrl: buildRedirect(`/track/${created.order.id}?status=cancelled`) })
        : await createPaystackCheckoutSession({ amount: Number(created.order.amount), currency: created.order.currency, customerEmail: created.order.customer_email, metadata, successUrl: buildRedirect(`/track/${created.order.id}?status=success`), cancelUrl: buildRedirect(`/track/${created.order.id}?status=cancelled`) });

      await supabase.from('payments').update({ provider_reference: session.providerReference }).eq('id', created.payment.id);
      await supabase
        .from('customer_interactions')
        .update({ associated_checkout_id: created.order.id, conversion_status: 'checkout_generated' })
        .eq('id', interaction.data.id)
        .eq('org_id', orgId);
      await emitConversionEvent({ orgId, interactionId: interaction.data.id, eventType: 'checkout_created', aiAction: 'createCheckoutFromInquiry', correlationId, payload: { orderId: created.order.id, paymentId: created.payment.id, provider } });
      await upsertConversionAttribution({ orgId, storefrontId, interactionId: interaction.data.id, checkoutId: created.order.id, orderId: created.order.id, customerIdentifier: body.customerIdentifier || body.customerEmail || 'unknown', sourcePlatform: body.sourcePlatform || body.sourceChannel || 'Direct', sourceCampaign: body.sourceCampaign, sourceContentReference: body.sourceContentReference, referralCode: body.referralCode, conversionType: 'checkout', conversionStatus: 'checkout_generated' });

      checkoutUrl = session.checkoutUrl;
      orderId = created.order.id;

      await supabase.from('conversion_recovery_queue').insert({
        org_id: orgId,
        interaction_id: interaction.data.id,
        checkout_id: created.order.id,
        recovery_stage: 'initial',
        recovery_status: 'pending',
      });
    }

    const reply = generateSuggestedReply({ intent, productTitle: body.productTitle, handle: storefront.data.handle, checkoutUrl });
    await emitConversionEvent({ orgId, interactionId: interaction.data.id, eventType: 'ai_reply_generated', aiAction: 'generateSuggestedReply', correlationId, payload: { intent, hasCheckout: Boolean(checkoutUrl) } });

    return NextResponse.json({ interactionId: interaction.data.id, intent, confidence, suggestedReply: reply, checkoutUrl, orderId, correlationId }, { headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logApiEvent('error', 'ai_conversion_assistant.failed', { correlationId, message: error instanceof Error ? error.message : 'unknown error' });
    return errorResponse(500, 'AI_CONVERSION_FAILED', 'AI conversion workflow failed', correlationId);
  }
}
