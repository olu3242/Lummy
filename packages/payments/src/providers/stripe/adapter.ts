import type { PaymentIntentInput, PaymentProviderAdapter, ProviderIntentResult } from "../types"
export class StripeProviderAdapter implements PaymentProviderAdapter {
  constructor(private readonly webhookSecret: string) {}
  async createIntent(input: PaymentIntentInput): Promise<ProviderIntentResult> { return { providerIntentId: `stp_${input.idempotencyKey}`, status: "initiated", raw: { provider: "stripe" }, checkoutUrl: "https://stripe.test/checkout" } }
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean { return Boolean(this.webhookSecret && headers["stripe-signature"] && rawBody) }
}
