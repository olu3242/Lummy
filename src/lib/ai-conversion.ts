export type MonetizationIntent = 'pricing_inquiry' | 'purchase_intent' | 'booking_intent' | 'delivery_inquiry' | 'support_request' | 'low_intent';

export function detectIntent(message: string): { intent: MonetizationIntent; confidence: number } {
  const text = message.toLowerCase();
  if (/(how much|price|cost|amount|₦|naira)/.test(text)) return { intent: 'pricing_inquiry', confidence: 0.86 };
  if (/(buy|pay|checkout|order now|i want this|send account)/.test(text)) return { intent: 'purchase_intent', confidence: 0.91 };
  if (/(book|appointment|slot|schedule)/.test(text)) return { intent: 'booking_intent', confidence: 0.82 };
  if (/(delivery|ship|dispatch|arrive|location)/.test(text)) return { intent: 'delivery_inquiry', confidence: 0.79 };
  if (/(help|issue|problem|refund|support)/.test(text)) return { intent: 'support_request', confidence: 0.72 };
  return { intent: 'low_intent', confidence: 0.55 };
}

export function generateSuggestedReply(input: { intent: MonetizationIntent; productTitle?: string; handle: string; checkoutUrl?: string }) {
  const cta = input.checkoutUrl ? `Complete payment here: ${input.checkoutUrl}` : `Reply "yes" and I will send your checkout link now.`;
  if (input.intent === 'pricing_inquiry') return `Great question. ${input.productTitle ?? 'This item'} is currently available and ready to order. ${cta}`;
  if (input.intent === 'purchase_intent') return `Perfect — I can help you secure it immediately. ${cta}`;
  if (input.intent === 'booking_intent') return `We can book that right away. Confirm your preferred date/time and I will share payment to lock the slot.`;
  if (input.intent === 'delivery_inquiry') return `Delivery is available. Once payment is confirmed, we dispatch immediately. ${cta}`;
  if (input.intent === 'support_request') return `Thanks for flagging this. I can help resolve it quickly. Share your order reference and we’ll sort this out.`;
  return `Thanks for reaching out to ${input.handle}. I can help with pricing, checkout, and delivery details. ${cta}`;
}
