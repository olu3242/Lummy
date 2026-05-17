import crypto from 'crypto'
import { PaymentProviderInterface, InitializePaymentInput, ProviderInitializeResult, NormalizedTransaction } from './provider-types'
import { stripeProvider } from '../../../src/lib/payments/stripe/provider'

function verifyStripeSignature(secret: string, rawBody: string, header?: string) {
  if (!secret || !header) return false
  try {
    // header format: t=timestamp,v1=signature,v0=...
    const parts = header.split(',').map(p => p.split('='))
    const kv: Record<string,string> = {}
    for (const [k,v] of parts) kv[k] = v
    const t = kv['t']
    const v1 = kv['v1']
    if (!t || !v1) return false
    const signed = `${t}.${rawBody}`
    const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex')
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(v1, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch (e) {
    return false
  }
}

export class StripeProvider implements PaymentProviderInterface {
  async initializePayment(input: InitializePaymentInput): Promise<ProviderInitializeResult> {
    const res = await stripeProvider.createCheckoutSession({ organizationId: String(input.metadata?.organizationId) })
    return { providerReference: res.checkoutUrl?.split('/').pop() || undefined, checkoutUrl: res.checkoutUrl, status: 'initiated', raw: { provider: 'stripe' } }
  }

  async verifyPayment(headers: Record<string, string>, rawBody: string): Promise<NormalizedTransaction | null> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    const header = headers['stripe-signature'] || headers['stripe-signature'.toLowerCase()] || headers['Stripe-Signature']
    if (!verifyStripeSignature(String(secret || ''), rawBody, String(header || ''))) return null

    let parsed: any
    try {
      parsed = JSON.parse(rawBody)
    } catch (e) {
      return null
    }

    const obj = parsed.data?.object || parsed
    return this.normalizeTransaction(obj)
  }

  async reconcileWebhook(raw: any): Promise<NormalizedTransaction | null> {
    return this.normalizeTransaction(raw)
  }

  async refundPayment(providerReference: string, amount?: number): Promise<boolean> {
    return false
  }

  normalizeTransaction(raw: any): NormalizedTransaction {
    return {
      id: String(raw.id || raw.payment_intent || raw.idempotency_key || `stripe_${Date.now()}`),
      provider: 'stripe',
      status: (raw.status as NormalizedTransaction['status']) || 'initiated',
      amount: Number(raw.amount || 0),
      currency: String(raw.currency || 'USD'),
      providerReference: String(raw.provider_reference || raw.id || ''),
      metadata: raw.metadata || {},
    }
  }
}
