import { ProviderSubscriptionPayload } from '../types';

export interface BillingProvider {
  createCheckoutSession(payload: ProviderSubscriptionPayload): Promise<{ checkoutUrl: string; providerReference?: string }>;
  parseWebhook(rawBody: string, signature?: string): Promise<{ type: string; data: Record<string, unknown> }>;
}
