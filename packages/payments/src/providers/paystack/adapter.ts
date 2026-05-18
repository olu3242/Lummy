import type { PaymentIntentInput, PaymentProviderAdapter, ProviderIntentResult } from "../types"
import { verifyHmacSha256Hex } from "../security"
export class PaystackProviderAdapter implements PaymentProviderAdapter {
  constructor(private readonly secretKey: string) {}
  async createIntent(input: PaymentIntentInput): Promise<ProviderIntentResult> { return { providerIntentId: `pst_${input.idempotencyKey}`, status: "initiated", raw: { provider: "paystack" }, checkoutUrl: "https://paystack.test/checkout" } }
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean {
    return verifyHmacSha256Hex(this.secretKey, rawBody, headers["x-paystack-signature"])
  }
}
