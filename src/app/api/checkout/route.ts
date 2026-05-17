import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPendingOrder } from '@/repositories/order-repository';
import { createPaymentSession } from '../../../../packages/payments-core/src/orchestrator';
import { resolveProvider } from '../../../../packages/payments-core/src/provider-router';
import { validateProviderRuntimeEnv, validatePublicRuntimeEnv } from '@/lib/runtime-config';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';
import { createPaymentDatabaseAdapter } from '@/lib/payments/payment-db-adapter';

function buildRedirectUrl(path: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('Missing NEXT_PUBLIC_APP_URL for checkout redirects');
  }
  return `${appUrl}${path}`;
}

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    validatePublicRuntimeEnv();
    const body = await req.json();
    const supabase = await createClient();

    const storefront = await supabase.from('storefronts').select('organization_id,is_active,handle').eq('handle', body.handle).maybeSingle();
    if (storefront.error || !storefront.data?.is_active) {
      logApiEvent('warn', 'checkout.storefront_unavailable', { correlationId, handle: body?.handle });
      return errorResponse(404, 'STOREFRONT_UNAVAILABLE', 'Storefront unavailable', correlationId);
    }

    const provider = resolveProvider(String(body.method || '')).name;
    validateProviderRuntimeEnv(provider);
    const created = await createPendingOrder({
      organizationId: storefront.data.organization_id,
      productId: body.productId,
      customerEmail: body.customer?.email || 'guest@lummy.local',
      quantity: body.quantity || 1,
      provider,
    });

    const successUrl = buildRedirectUrl(`/track/${created.order.id}?status=success`);
    const cancelUrl = buildRedirectUrl(`/track/${created.order.id}?status=cancelled`);

    const metadata = {
      orderId: created.order.id,
      paymentId: created.payment.id,
      organizationId: storefront.data.organization_id,
      productId: created.product.id,
      quantity: String(created.quantity),
    };

    const session = await createPaymentSession(createPaymentDatabaseAdapter(supabase as never), provider, { amount: Number(created.order.amount), currency: created.order.currency, customerEmail: created.order.customer_email, metadata, successUrl, cancelUrl }, correlationId)

    // ensure order/payment record references provider reference
    if (session.providerReference) {
      await supabase.from('payments').update({ provider_reference: session.providerReference }).eq('id', created.payment.id);
    }

    logApiEvent('info', 'checkout.session_created', { correlationId, orderId: created.order.id, provider });
    return NextResponse.json({ order: created.order, payment: created.payment, checkoutUrl: session.checkoutUrl, successUrl, cancelUrl, correlationId }, { headers: { 'x-correlation-id': correlationId } });
  } catch (error) {
    logApiEvent('error', 'checkout.failed', {
      correlationId,
      message: error instanceof Error ? error.message : 'Checkout failed',
    });
    return errorResponse(400, 'CHECKOUT_FAILED', 'Checkout initialization failed', correlationId);
  }
}
