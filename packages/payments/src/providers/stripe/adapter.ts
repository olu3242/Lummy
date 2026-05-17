import type { PaymentIntentInput, PaymentProviderAdapter, ProviderIntentResult } from "../types"
import { verifyHmacSha256Hex } from "../security"
export class StripeProviderAdapter implements PaymentProviderAdapter {
  constructor(private readonly webhookSecret: string) {}
  async createIntent(input: PaymentIntentInput): Promise<ProviderIntentResult> { return { providerIntentId: `stp_${input.idempotencyKey}`, status: "initiated", raw: { provider: "stripe" }, checkoutUrl: "https://stripe.test/checkout" } }
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean {
    const signature = headers["stripe-signature"]?.split(",").find((part) => part.trim().startsWith("v1="))?.split("=")[1]
    return verifyHmacSha256Hex(this.webhookSecret, rawBody, signature)
  }
}
