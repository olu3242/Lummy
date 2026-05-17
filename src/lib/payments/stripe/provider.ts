import { BillingProvider } from '../providers/base';
import { ProviderSubscriptionPayload } from '../types';

export const stripeProvider: BillingProvider = {
  async createCheckoutSession(payload: ProviderSubscriptionPayload) {
    return { checkoutUrl: `https://checkout.stripe.com/pay/${payload.organizationId}` };
  },
  async parseWebhook() {
    return { type: 'subscription.updated', data: {} };
  },
};
