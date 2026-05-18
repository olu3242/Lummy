import { BillingProvider } from '../providers/base';
import { ProviderSubscriptionPayload } from '../types';

export const paystackProvider: BillingProvider = {
  async createCheckoutSession(payload: ProviderSubscriptionPayload) {
    return { checkoutUrl: `https://paystack.com/pay/${payload.organizationId}` };
  },
  async parseWebhook() {
    return { type: 'subscription.updated', data: {} };
  },
};
