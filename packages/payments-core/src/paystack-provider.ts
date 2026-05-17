import crypto from 'crypto'
import { PaymentProviderInterface, InitializePaymentInput, ProviderInitializeResult, NormalizedTransaction } from './provider-types'
import { paystackProvider } from '../../../src/lib/payments/paystack/provider'

function verifyHmac(secret: string, rawBody: string, signature?: string) {
  if (!secret || !signature) return false
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    // Use timing-safe comparison
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(signature, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch (e) {
    return false
  }
}

export class PaystackProvider implements PaymentProviderInterface {
  async initializePayment(input: InitializePaymentInput): Promise<ProviderInitializeResult> {
    const res = await paystackProvider.createCheckoutSession({ organizationId: String(input.metadata?.organizationId) })
    return { providerReference: res.checkoutUrl?.split('/').pop() || undefined, checkoutUrl: res.checkoutUrl, status: 'initiated', raw: { provider: 'paystack' } }
  }

  async verifyPayment(headers: Record<string, string>, rawBody: string): Promise<NormalizedTransaction | null> {
    const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET
    const signature = headers['x-paystack-signature'] || headers['x-paystack-signature'.toLowerCase()]
    if (!verifyHmac(String(secret || ''), rawBody, String(signature || ''))) {
      return null
    }

    // Parse payload and normalize
    let parsed: any
    try {
      parsed = JSON.parse(rawBody)
    } catch (e) {
      return null
    }

    const data = parsed.data || parsed
    return this.normalizeTransaction(data)
  }

  async reconcileWebhook(raw: any): Promise<NormalizedTransaction | null> {
    return this.normalizeTransaction(raw)
  }

  async refundPayment(providerReference: string, amount?: number): Promise<boolean> {
    return false
  }

  normalizeTransaction(raw: any): NormalizedTransaction {
    return {
      id: String(raw.id || raw.transaction || raw.reference || `paystack_${Date.now()}`),
      provider: 'paystack',
      status: (raw.status as NormalizedTransaction['status']) || 'initiated',
      amount: Number(raw.amount || 0),
      currency: String(raw.currency || 'NGN'),
      providerReference: String(raw.reference || raw.provider_reference || ''),
      metadata: raw.metadata || {},
    }
  }
}
