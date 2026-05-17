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
  try {
    ensurePaymentProvidersConfigured()
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase runtime is not configured')
    }
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('No AI provider configured: set OPENAI_API_KEY or ANTHROPIC_API_KEY')
    }
  } catch (e) {
    throw e
  }
}
