export type ProviderName = 'paystack' | 'stripe' | 'flutterwave'

export type PaymentStatus = 'initiated' | 'authorized' | 'captured' | 'settled' | 'reconciled' | 'refunded' | 'failed' | 'replayed'

export interface InitializePaymentInput { amount: number; currency: string; customerEmail?: string; metadata?: Record<string, unknown>; successUrl?: string; cancelUrl?: string }

export interface ProviderInitializeResult { providerReference?: string; checkoutUrl?: string; status: PaymentStatus; raw?: Record<string, unknown> }

export interface NormalizedTransaction { id: string; provider: ProviderName; status: PaymentStatus; amount: number; currency: string; providerReference?: string; metadata?: Record<string, unknown> }

export interface PaymentProviderInterface {
  name: ProviderName
  initializePayment(input: InitializePaymentInput): Promise<ProviderInitializeResult>
  verifyPayment(headers: Record<string, string>, rawBody: string): Promise<NormalizedTransaction | null>
  reconcileWebhook(raw: any): Promise<NormalizedTransaction | null>
  refundPayment(providerReference: string, amount?: number): Promise<boolean>
  normalizeTransaction(raw: any): NormalizedTransaction
}
