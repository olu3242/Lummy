export type PaymentProvider = 'stripe' | 'paystack';

export type ProviderSubscriptionPayload = {
  organizationId: string;
  customerEmail: string;
  planCode: string;
};

export type CheckoutInitPayload = {
  amount: number;
  currency: string;
  customerEmail: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutInitResult = {
  checkoutUrl: string;
  providerReference: string;
};
