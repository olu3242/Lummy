import crypto from 'crypto'
import logger from '../../logging/logger'
import { BillingProvider } from '../providers/base';
import { ProviderSubscriptionPayload } from '../types';

export function verifyPaystackSignature(rawBody: string, signature?: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET
  if (!secret || !signature) return false
  try {
    const expected = crypto.createHmac('sha256', String(secret)).update(rawBody).digest('hex')
    return expected === signature
  } catch (e) {
    return false
  }
}

export const paystackProvider: BillingProvider = {
  async createCheckoutSession(_payload: ProviderSubscriptionPayload) {
    // Creating Paystack hosted checkout sessions requires server-side API calls using a secret key.
    // Do not return placeholder checkout URLs. Fail fast if provider not implemented.
    if (!process.env.PAYSTACK_SECRET_KEY) {
      logger.error('Paystack createCheckoutSession called but PAYSTACK_SECRET_KEY missing')
      throw new Error('Paystack provider not configured: set PAYSTACK_SECRET_KEY to enable live Paystack sessions')
    }
    logger.error('Paystack createCheckoutSession not implemented — integration required')
    throw new Error('Paystack createCheckoutSession is not implemented — integrate Paystack SDK or API here')
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
