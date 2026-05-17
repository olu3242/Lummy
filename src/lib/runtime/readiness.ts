import logger from '../logging/logger'

export function ensurePaymentProvidersConfigured() {
  const hasPaystack = Boolean(process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET)
  const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_WEBHOOK_SECRET)

  if (!hasPaystack && !hasStripe) {
    logger.error('No payment providers configured', { hasPaystack, hasStripe })
    throw new Error('No payment provider configured: set PAYSTACK_SECRET_KEY or STRIPE_SECRET_KEY')
  }
  logger.info('Payment providers readiness', { hasPaystack, hasStripe })
}

export function ensureRuntimeReadiness() {
  // Add other runtime readiness checks as needed
  try {
    ensurePaymentProvidersConfigured()
  } catch (e) {
    throw e
  }
}
