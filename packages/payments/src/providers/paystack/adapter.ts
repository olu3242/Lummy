import type { PaymentIntentInput, PaymentProviderAdapter, ProviderIntentResult } from "../types"
import { verifyHmacSha256Hex } from "../security"

export class PaystackProviderAdapter implements PaymentProviderAdapter {
  constructor(private readonly secretKey: string) {}
  async createIntent(input: PaymentIntentInput): Promise<ProviderIntentResult> {
    if (!this.secretKey) {
      console.error('Paystack adapter createIntent called but secretKey missing', { idempotencyKey: input.idempotencyKey })
      throw new Error('Paystack adapter not configured: missing secret key')
    }
    console.error('Paystack createIntent not implemented', { idempotencyKey: input.idempotencyKey })
    throw new Error('Paystack createIntent not implemented: integrate Paystack SDK to create checkout sessions')
  }
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean {
    return verifyHmacSha256Hex(this.secretKey, rawBody, headers["x-paystack-signature"])
  }
}
