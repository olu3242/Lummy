import { BillingProvider } from '../providers/base';
import { ProviderSubscriptionPayload } from '../types';

export const stripeProvider: BillingProvider = {
  async createCheckoutSession(payload: ProviderSubscriptionPayload) {
    return { checkoutUrl: `https://checkout.stripe.com/pay/${payload.organizationId}` };
  },
  async parseWebhook() {
    return { type: 'subscription.updated', data: {} };
  },
};

interface CheckoutParams {
  amount: number;
  currency: string;
  customerEmail: string;
  metadata: Record<string, unknown>;
  successUrl: string;
  cancelUrl: string;
}

export async function createStripeCheckoutSession(params: CheckoutParams): Promise<{ checkoutUrl: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured');

  const body = new URLSearchParams({
    'payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': params.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(params.amount),
    'line_items[0][price_data][product_data][name]': String((params.metadata as Record<string, unknown>).product_name ?? 'Order'),
    'line_items[0][quantity]': '1',
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await res.json() as { url?: string; error?: { message: string } };

  if (!data.url) {
    throw new Error(`Stripe error: ${data.error?.message ?? 'unknown'}`);
  }

  return { checkoutUrl: data.url };
}
