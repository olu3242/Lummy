import crypto from 'crypto'
import { PaymentProviderInterface, InitializePaymentInput, ProviderInitializeResult, NormalizedTransaction } from './provider-types'

function verifyHmac(secret: string, rawBody: string, signature?: string) {
  if (!secret || !signature) return false
  try {
    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(signature, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export class PaystackProvider implements PaymentProviderInterface {
  name = 'paystack' as const

  async initializePayment(input: InitializePaymentInput): Promise<ProviderInitializeResult> {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) throw new Error('Paystack provider not configured: PAYSTACK_SECRET_KEY is required')

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(input.amount),
        currency: input.currency,
        email: input.customerEmail,
        callback_url: input.successUrl,
        metadata: input.metadata || {},
      }),
    })

    const raw = await response.json() as Record<string, any>
    if (!response.ok || raw.status === false) {
      throw new Error(`Paystack checkout initialization failed: ${String(raw.message || response.status)}`)
    }

    return {
      providerReference: String(raw.data?.reference || ''),
      checkoutUrl: String(raw.data?.authorization_url || ''),
      status: 'initiated',
      raw,
    }
  }

  async verifyPayment(headers: Record<string, string>, rawBody: string): Promise<NormalizedTransaction | null> {
    const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET
    const signature = headers['x-paystack-signature']
    if (!verifyHmac(String(secret || ''), rawBody, String(signature || ''))) return null

    let parsed: any
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return null
    }

    const data = parsed.data || parsed
    return this.normalizeTransaction(data)
  }

  async reconcileWebhook(raw: any): Promise<NormalizedTransaction | null> {
    return this.normalizeTransaction(raw)
  }

  async refundPayment(providerReference: string, amount?: number): Promise<boolean> {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) throw new Error('Paystack provider not configured: PAYSTACK_SECRET_KEY is required')

    const response = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      body: JSON.stringify({ transaction: providerReference, amount: amount ? Math.round(amount) : undefined }),
    })

    return response.ok
  }

  normalizeTransaction(raw: any): NormalizedTransaction {
    const status = normalizePaystackStatus(String(raw.status || 'initiated'))
    return {
      id: String(raw.id || raw.transaction || raw.reference || `paystack_${Date.now()}`),
      provider: 'paystack',
      status,
      amount: Number(raw.amount || 0),
      currency: String(raw.currency || 'USD').toUpperCase(),
      providerReference: String(raw.reference || raw.provider_reference || ''),
      metadata: raw.metadata || {},
    }
  }
}

function normalizePaystackStatus(status: string): NormalizedTransaction['status'] {
  if (status === 'success') return 'captured'
  if (status === 'abandoned' || status === 'failed' || status === 'reversed') return 'failed'
  if (status === 'pending' || status === 'ongoing') return 'authorized'
  return status as NormalizedTransaction['status']
}
