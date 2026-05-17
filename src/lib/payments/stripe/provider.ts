import crypto from 'crypto'
import logger from '../../logging/logger'
import { BillingProvider } from '../providers/base';
import { ProviderSubscriptionPayload } from '../types';

export function verifyStripeSignature(rawBody: string, signature?: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !signature) return false
  try {
    const v1 = signature.split(',').find((s) => s.startsWith('v1='))?.slice(3)
    const timestamp = signature.split(',').find((s) => s.startsWith('t='))?.slice(2)
    if (!v1 || !timestamp) return false
    const signed = `${timestamp}.${rawBody}`
    const expected = crypto.createHmac('sha256', String(secret)).update(signed).digest('hex')
    return expected === v1
  } catch (e) {
    return false
  }
}

export const stripeProvider: BillingProvider = {
  async createCheckoutSession(_payload: ProviderSubscriptionPayload) {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('Stripe createCheckoutSession called but STRIPE_SECRET_KEY missing')
      throw new Error('Stripe provider not configured: set STRIPE_SECRET_KEY to enable live Stripe sessions')
    }
    logger.error('Stripe createCheckoutSession not implemented — integration required')
    throw new Error('Stripe createCheckoutSession is not implemented — integrate Stripe SDK or API here')
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
