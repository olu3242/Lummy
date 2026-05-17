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

interface CheckoutResult {
  checkoutUrl: string
  providerReference: string
}

export function verifyPaystackSignature(rawBody: string, signature?: string | null): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET
  if (!secretKey || !signature) return false

  try {
    const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex')
    return expected === signature
  } catch {
    return false
  }
}

export async function createPaystackCheckoutSession(params: CheckoutParams): Promise<CheckoutResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured')

  const reference = `LMY-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.customerEmail,
      amount: params.amount,
      currency: params.currency || 'NGN',
      reference,
      metadata: params.metadata,
      callback_url: params.successUrl,
    }),
  })

  const data = await res.json() as {
    status: boolean
    message: string
    data?: { authorization_url: string; reference: string }
  }

  if (!data.status || !data.data) {
    throw new Error(`Paystack error: ${data.message}`)
  }

  return { checkoutUrl: data.data.authorization_url, providerReference: data.data.reference }
}

export const paystackProvider: BillingProvider = {
  async createCheckoutSession(_payload: ProviderSubscriptionPayload) {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      logger.error('Paystack createCheckoutSession called but PAYSTACK_SECRET_KEY missing')
      throw new Error('Paystack provider not configured: set PAYSTACK_SECRET_KEY to enable live Paystack sessions')
    }
    logger.error('Paystack createCheckoutSession requires checkout payload adapter')
    throw new Error('Paystack createCheckoutSession requires checkout payload adapter')
  },
  async parseWebhook(rawBody?: string) {
    if (!rawBody) return null
    try {
      return JSON.parse(rawBody)
    } catch (e) {
      logger.warn('Paystack parseWebhook failed to parse rawBody', { error: e instanceof Error ? e.message : String(e) })
      return null
    }
  },
}
