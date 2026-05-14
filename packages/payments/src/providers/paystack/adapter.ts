import type { PaymentIntentInput, PaymentProviderAdapter, ProviderIntentResult } from "../types"
export class PaystackProviderAdapter implements PaymentProviderAdapter {
  constructor(private readonly secretKey: string) {}
  async createIntent(input: PaymentIntentInput): Promise<ProviderIntentResult> { return { providerIntentId: `pst_${input.idempotencyKey}`, status: "initiated", raw: { provider: "paystack" }, checkoutUrl: "https://paystack.test/checkout" } }
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean { return Boolean(this.secretKey && headers["x-paystack-signature"] && rawBody) }
}
