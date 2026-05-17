import type { PaymentIntentInput, PaymentProviderAdapter, ProviderIntentResult } from "../types"
import { verifyHmacSha256Hex } from "../security"

export class StripeProviderAdapter implements PaymentProviderAdapter {
  constructor(private readonly webhookSecret: string) {}
  async createIntent(input: PaymentIntentInput): Promise<ProviderIntentResult> {
    if (!this.webhookSecret) {
      console.error('Stripe adapter createIntent called but webhookSecret missing', { idempotencyKey: input.idempotencyKey })
      throw new Error('Stripe adapter not configured: missing webhook secret')
    }
    console.error('Stripe createIntent not implemented', { idempotencyKey: input.idempotencyKey })
    throw new Error('Stripe createIntent not implemented: integrate Stripe SDK to create checkout sessions')
  }
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean {
    const signature = headers["stripe-signature"]?.split(",").find((part) => part.trim().startsWith("v1="))?.split("=")[1]
    return verifyHmacSha256Hex(this.webhookSecret, rawBody, signature)
  }
}
