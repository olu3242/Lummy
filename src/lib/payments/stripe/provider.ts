import crypto from 'crypto'
import logger from '../../logging/logger'
import { BillingProvider } from '../providers/base'
import { ProviderSubscriptionPayload } from '../types'

interface CheckoutParams {
  amount: number
  currency: string
  customerEmail: string
  metadata: Record<string, unknown>
  successUrl: string
  cancelUrl: string
}

export function verifyStripeSignature(rawBody: string, signature?: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !signature) return false

  try {
    const v1 = signature.split(',').find((s) => s.startsWith('v1='))?.slice(3)
    const timestamp = signature.split(',').find((s) => s.startsWith('t='))?.slice(2)
    if (!v1 || !timestamp) return false

    const signed = `${timestamp}.${rawBody}`
    const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex')
    return expected === v1
  } catch {
    return false
  }
}

export async function createStripeCheckoutSession(params: CheckoutParams): Promise<{ checkoutUrl: string; providerReference: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured')

  const body = new URLSearchParams({
    'payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': params.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(params.amount),
    'line_items[0][price_data][product_data][name]': String(params.metadata.product_name ?? 'Order'),
    'line_items[0][quantity]': '1',
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
  })

  for (const [key, value] of Object.entries(params.metadata)) {
    if (value !== null && value !== undefined) body.set(`metadata[${key}]`, String(value))
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const data = await res.json() as { id?: string; url?: string; error?: { message: string } }

  if (!data.url) {
    throw new Error(`Stripe error: ${data.error?.message ?? 'unknown'}`)
  }

  return { checkoutUrl: data.url, providerReference: data.id ?? '' }
}

export const stripeProvider: BillingProvider = {
  async createCheckoutSession(_payload: ProviderSubscriptionPayload) {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('Stripe createCheckoutSession called but STRIPE_SECRET_KEY missing')
      throw new Error('Stripe provider not configured: set STRIPE_SECRET_KEY to enable live Stripe sessions')
    }
    logger.error('Stripe createCheckoutSession requires checkout payload adapter')
    throw new Error('Stripe createCheckoutSession requires checkout payload adapter')
  },
  async parseWebhook(rawBody?: string) {
    if (!rawBody) return null
    try {
      return JSON.parse(rawBody)
    } catch (e) {
      logger.warn('Stripe parseWebhook failed to parse rawBody', { error: e instanceof Error ? e.message : String(e) })
      return null
    }
  },
}
