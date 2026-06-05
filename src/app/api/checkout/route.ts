import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createPendingOrder } from '@/repositories/order-repository';
import { createPaymentSession } from '../../../../packages/payments-core/src/orchestrator';
import { resolveProvider } from '../../../../packages/payments-core/src/provider-router';
import { getRuntimeAppUrl, validateProviderRuntimeEnv, validatePublicRuntimeEnv } from '@/lib/runtime-config';
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability';
import { createPaymentDatabaseAdapter } from '@/lib/payments/payment-db-adapter';

function buildRedirectUrl(req: Request, path: string) {
  return `${getRuntimeAppUrl(req.url)}${path}`;
}

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req);
  try {
    validatePublicRuntimeEnv();
    const body = await req.json();
    const supabase = createAdminClient();

    const storefront = await supabase.from('storefronts').select('organization_id,is_active,handle').eq('handle', body.handle).maybeSingle();
    if (storefront.error || !storefront.data?.is_active) {
      logApiEvent('warn', 'checkout.storefront_unavailable', { correlationId, handle: body?.handle });
      return errorResponse(404, 'STOREFRONT_UNAVAILABLE', 'Storefront unavailable', correlationId);
    }

    const resolvedProvider = resolveProvider(String(body.method || '')).name;
    if (resolvedProvider !== 'stripe' && resolvedProvider !== 'paystack') {
      return errorResponse(400, 'UNSUPPORTED_PAYMENT_PROVIDER', 'Unsupported payment provider', correlationId);
    }
    const provider: 'stripe' | 'paystack' = resolvedProvider;
    validateProviderRuntimeEnv(provider);
    const created = await createPendingOrder({
      organizationId: storefront.data.organization_id,
      productId: body.productId,
      customerEmail: body.customer?.email || 'guest@lummy.local',
      quantity: body.quantity || 1,
      provider,
    }, supabase);

    const successUrl = buildRedirectUrl(req, `/track/${created.order.id}?status=success`);
    const cancelUrl = buildRedirectUrl(req, `/track/${created.order.id}?status=cancelled`);

    const metadata = {
      orderId: created.order.id,
      paymentId: created.payment.id,
      organizationId: storefront.data.organization_id,
      productId: created.product.id,
      quantity: String(created.quantity),
    };

    const session = await createPaymentSession(createPaymentDatabaseAdapter(supabase as never), provider, { amount: Number(created.order.amount), currency: created.order.currency, customerEmail: created.order.customer_email, metadata, successUrl, cancelUrl }, correlationId)

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
