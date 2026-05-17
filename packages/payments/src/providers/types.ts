export type PaymentProvider = "paystack" | "stripe"
export type PaymentStatus = "initiated" | "authorized" | "captured" | "settled" | "reconciled" | "refunded" | "failed" | "replayed"
export interface PaymentIntentInput { provider: PaymentProvider; tenantId: string; customerId?: string; amount: number; currency: string; idempotencyKey: string; metadata?: Record<string, unknown> }
export interface ProviderIntentResult { providerIntentId: string; checkoutUrl?: string; status: PaymentStatus; raw: Record<string, unknown> }
export interface PaymentProviderAdapter { createIntent(input: PaymentIntentInput): Promise<ProviderIntentResult>; verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean }
