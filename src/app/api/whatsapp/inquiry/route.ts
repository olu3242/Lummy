import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectIntent, generateSuggestedReply } from '@/lib/ai-conversion';
import { emitConversionEvent } from '@/lib/ai-conversion-events';
import { createPendingOrder, upsertConversionAttribution, upsertCustomerMemoryFromInteraction, syncCustomerMemoryForOrder } from '@/repositories/order-repository';
import { createPaystackCheckoutSession } from '@/lib/payments/paystack/provider';
import { createStripeCheckoutSession } from '@/lib/payments/stripe/provider';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';

function buildRedirect(path: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error('Missing NEXT_PUBLIC_APP_URL');
  return `${appUrl}${path}`;
}

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    const body = await req.json();
    const supabase = createClient();
    const storefront = await supabase.from('storefronts').select('id,organization_id,handle,is_active').eq('handle', body.handle).maybeSingle();
    if (storefront.error || !storefront.data?.is_active) return errorResponse(404, 'STOREFRONT_NOT_FOUND', 'Storefront not found', correlationId);

    const orgId = storefront.data.organization_id;
    const message = String(body.message ?? '').slice(0, 240);
    const customerIdentifier = String(body.customerIdentifier ?? body.phone ?? body.customerEmail ?? 'unknown').slice(0, 120);

    const interaction = await supabase.from('customer_interactions').insert({ org_id: orgId, storefront_id: storefront.data.id, customer_identifier: customerIdentifier, source_channel: 'whatsapp', interaction_type: body.interactionType || 'inquiry', message_excerpt: message, associated_product_id: body.productId ?? null, conversion_status: 'new' }).select('*').single();
    if (interaction.error) throw interaction.error;

    await emitConversionEvent({ orgId, interactionId: interaction.data.id, eventType: 'inquiry_received', aiAction: 'whatsappEntryIngest', correlationId, payload: { entryMethod: body.entryMethod || 'click_to_whatsapp' } });
    await upsertCustomerMemoryFromInteraction({ orgId, storefrontId: storefront.data.id, customerIdentifier, email: body.customerEmail, phone: body.phone, preferredChannel: 'whatsapp', interactionId: interaction.data.id, correlationId });
    await upsertConversionAttribution({ orgId, storefrontId: storefront.data.id, interactionId: interaction.data.id, customerIdentifier, sourcePlatform: body.sourcePlatform || 'WhatsApp', sourceCampaign: body.sourceCampaign, sourceContentReference: body.sourceContentReference, referralCode: body.referralCode, conversionType: 'inquiry', conversionStatus: 'inquiry_captured' });

    const { intent, confidence } = detectIntent(message);
    await supabase.from('customer_interactions').update({ ai_intent: intent, ai_confidence: confidence, conversion_status: 'intent_detected' }).eq('id', interaction.data.id).eq('org_id', orgId);

    let checkoutUrl: string | undefined;
    if ((intent === 'purchase_intent' || intent === 'pricing_inquiry') && body.productId) {
      const provider = body.method === 'stripe' ? 'stripe' : 'paystack';
      const created = await createPendingOrder({ organizationId: orgId, productId: body.productId, customerEmail: body.customerEmail || 'guest@lummy.local', quantity: 1, provider });
      const metadata = { orderId: created.order.id, paymentId: created.payment.id, organizationId: orgId, productId: created.product.id, quantity: '1' };
      const session = provider === 'stripe'
        ? await createStripeCheckoutSession({ amount: Number(created.order.amount), currency: created.order.currency, customerEmail: created.order.customer_email, metadata, successUrl: buildRedirect(`/track/${created.order.id}?status=success`), cancelUrl: buildRedirect(`/track/${created.order.id}?status=cancelled`) })
        : await createPaystackCheckoutSession({ amount: Number(created.order.amount), currency: created.order.currency, customerEmail: created.order.customer_email, metadata, successUrl: buildRedirect(`/track/${created.order.id}?status=success`), cancelUrl: buildRedirect(`/track/${created.order.id}?status=cancelled`) });
      await supabase.from('payments').update({ provider_reference: session.providerReference }).eq('id', created.payment.id);
      await supabase.from('customer_interactions').update({ associated_checkout_id: created.order.id, checkout_association: created.order.id, conversion_status: 'checkout_generated' }).eq('id', interaction.data.id).eq('org_id', orgId);
      await supabase.from('conversion_recovery_queue').insert({ org_id: orgId, interaction_id: interaction.data.id, checkout_id: created.order.id, recovery_stage: 'initial', recovery_status: 'pending' });
      await emitConversionEvent({ orgId, interactionId: interaction.data.id, eventType: 'checkout_created', aiAction: 'createCheckoutFromWhatsAppInquiry', correlationId, payload: { provider, orderId: created.order.id } });
      await upsertConversionAttribution({ orgId, storefrontId: storefront.data.id, interactionId: interaction.data.id, checkoutId: created.order.id, orderId: created.order.id, customerIdentifier, sourcePlatform: body.sourcePlatform || 'WhatsApp', sourceCampaign: body.sourceCampaign, sourceContentReference: body.sourceContentReference, referralCode: body.referralCode, conversionType: 'checkout', conversionStatus: 'checkout_generated' });
      await syncCustomerMemoryForOrder({ orgId, orderId: created.order.id, paymentId: created.payment.id, correlationId });
      checkoutUrl = session.checkoutUrl;
    }

    const suggestedReply = generateSuggestedReply({ intent, productTitle: body.productTitle, handle: storefront.data.handle, checkoutUrl });
    return NextResponse.json({ interactionId: interaction.data.id, intent, confidence, suggestedReply, checkoutUrl, correlationId }, { headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logApiEvent('error', 'whatsapp.inquiry_failed', { correlationId, message: error instanceof Error ? error.message : 'unknown error' });
    return errorResponse(500, 'WHATSAPP_INQUIRY_FAILED', 'WhatsApp inquiry workflow failed', correlationId);
  }
}
