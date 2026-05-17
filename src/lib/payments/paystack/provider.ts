import crypto from 'crypto';
import { CheckoutInitPayload, CheckoutInitResult } from '../types';

const PAYSTACK_API = 'https://api.paystack.co';

export async function createPaystackCheckoutSession(payload: CheckoutInitPayload): Promise<CheckoutInitResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY missing');

  const amountKobo = Math.round(payload.amount * 100);

  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: payload.customerEmail,
      amount: amountKobo,
      currency: payload.currency,
      callback_url: payload.successUrl,
      metadata: payload.metadata,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json?.status || !json?.data?.authorization_url || !json?.data?.reference) {
    throw new Error(json?.message || 'Paystack checkout initialization failed');
  }

  return { checkoutUrl: json.data.authorization_url, providerReference: json.data.reference };
}

export function verifyPaystackSignature(rawBody: string, signature?: string | null) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || !signature) return false;
  const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  return expected === signature;
}
