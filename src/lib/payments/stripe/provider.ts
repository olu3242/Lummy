import { CheckoutInitPayload, CheckoutInitResult } from '../types';

const STRIPE_API = 'https://api.stripe.com/v1';

export async function createStripeCheckoutSession(payload: CheckoutInitPayload): Promise<CheckoutInitResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY missing');

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', payload.successUrl);
  form.set('cancel_url', payload.cancelUrl);
  form.set('customer_email', payload.customerEmail);
  form.set('line_items[0][price_data][currency]', payload.currency.toLowerCase());
  form.set('line_items[0][price_data][product_data][name]', 'Lummy Checkout');
  form.set('line_items[0][price_data][unit_amount]', String(Math.round(payload.amount * 100)));
  form.set('line_items[0][quantity]', '1');
  Object.entries(payload.metadata).forEach(([k, v]) => form.set(`metadata[${k}]`, v));

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });

  const json = await res.json();
  if (!res.ok || !json?.url || !json?.id) throw new Error(json?.error?.message || 'Stripe checkout initialization failed');

  return { checkoutUrl: json.url, providerReference: json.id };
}
