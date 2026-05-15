export type PaymentProvider = 'stripe' | 'paystack';

export type ProviderSubscriptionPayload = {
  organizationId: string;
  customerEmail: string;
  planCode: string;
};
