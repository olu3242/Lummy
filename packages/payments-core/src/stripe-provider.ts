import crypto from 'crypto'
import { PaymentProviderInterface, InitializePaymentInput, ProviderInitializeResult, NormalizedTransaction } from './provider-types'

function verifyStripeSignature(secret: string, rawBody: string, header?: string) {
  if (!secret || !header) return false
  try {
    const parts = header.split(',').map((part) => part.split('='))
    const kv: Record<string, string> = {}
    for (const [key, value] of parts) kv[key] = value

    const timestamp = kv.t
    const v1 = kv.v1
    if (!timestamp || !v1) return false

    const signed = `${timestamp}.${rawBody}`
    const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex')
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(v1, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export class StripeProvider implements PaymentProviderInterface {
  name = 'stripe' as const

  async initializePayment(input: InitializePaymentInput): Promise<ProviderInitializeResult> {
    const secret = process.env.STRIPE_SECRET_KEY
    if (!secret) throw new Error('Stripe provider not configured: STRIPE_SECRET_KEY is required')

    const body = new URLSearchParams()
    body.set('mode', 'payment')
    body.set('success_url', input.successUrl || '')
    body.set('cancel_url', input.cancelUrl || '')
    body.set('line_items[0][quantity]', '1')
    body.set('line_items[0][price_data][currency]', input.currency.toLowerCase())
    body.set('line_items[0][price_data][unit_amount]', String(Math.round(input.amount)))
    body.set('line_items[0][price_data][product_data][name]', String(input.metadata?.productName || input.metadata?.product_name || 'Lummy order'))
    if (input.customerEmail) body.set('customer_email', input.customerEmail)
    for (const [key, value] of Object.entries(input.metadata || {})) body.set(`metadata[${key}]`, String(value))

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secret}`,
        'content-type': 'application/x-www-form-urlencoded',
        'stripe-version': '2026-02-25.clover',
      },
      body,
    })

    const raw = await response.json() as Record<string, unknown>
    if (!response.ok) {
      const error = raw.error && typeof raw.error === 'object' ? (raw.error as Record<string, unknown>).message : response.status
      throw new Error(`Stripe checkout initialization failed: ${String(error)}`)
    }

    return {
      providerReference: String(raw.id || ''),
      checkoutUrl: String(raw.url || ''),
      status: 'initiated',
      raw,
    }
  }

  async verifyPayment(headers: Record<string, string>, rawBody: string): Promise<NormalizedTransaction | null> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    const header = headers['stripe-signature'] || headers['Stripe-Signature']
    if (!verifyStripeSignature(String(secret || ''), rawBody, String(header || ''))) return null

    let parsed: any
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return null
    }

    const obj = parsed.data?.object || parsed
    return this.normalizeTransaction(obj)
  }

  async reconcileWebhook(raw: any): Promise<NormalizedTransaction | null> {
    return this.normalizeTransaction(raw)
  }

  async refundPayment(providerReference: string, amount?: number): Promise<boolean> {
    const secret = process.env.STRIPE_SECRET_KEY
    if (!secret) throw new Error('Stripe provider not configured: STRIPE_SECRET_KEY is required')

    const body = new URLSearchParams()
    body.set('payment_intent', providerReference)
    if (amount) body.set('amount', String(Math.round(amount)))

    const response = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secret}`,
        'content-type': 'application/x-www-form-urlencoded',
        'stripe-version': '2026-02-25.clover',
      },
      body,
    })

    return response.ok
  }

  normalizeTransaction(raw: any): NormalizedTransaction {
    const status = normalizeStripeStatus(String(raw.payment_status || raw.status || 'initiated'))
    return {
      id: String(raw.id || raw.payment_intent || raw.idempotency_key || `stripe_${Date.now()}`),
      provider: 'stripe',
      status,
      amount: Number(raw.amount_total || raw.amount_received || raw.amount || 0),
      currency: String(raw.currency || 'USD').toUpperCase(),
      providerReference: String(raw.payment_intent || raw.provider_reference || raw.id || ''),
      metadata: raw.metadata || {},
    }
  }
}

function normalizeStripeStatus(status: string): NormalizedTransaction['status'] {
  if (status === 'paid' || status === 'succeeded' || status === 'complete') return 'captured'
  if (status === 'processing' || status === 'open') return 'authorized'
  if (status === 'refunded') return 'refunded'
  if (status === 'failed' || status === 'canceled' || status === 'expired') return 'failed'
  return 'initiated'
}
