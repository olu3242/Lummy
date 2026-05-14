export type PaymentProvider = "paystack" | "stripe"

export interface PaymentIntentInput {
  provider: PaymentProvider
  tenantId: string
  customerId?: string
  amount: number
  currency: string
  idempotencyKey: string
  metadata?: Record<string, unknown>
}

export interface ProviderIntentResult {
  providerIntentId: string
  checkoutUrl?: string
  status: "pending" | "requires_action" | "failed"
  raw: Record<string, unknown>
}

export interface PaymentProviderAdapter {
  createIntent(input: PaymentIntentInput): Promise<ProviderIntentResult>
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean
}
