import type { ProviderAdapter, ProviderMessagePayload, ProviderSendResult } from "../types"

export class WhatsAppCloudProvider implements ProviderAdapter {
  constructor(private readonly appSecret: string) {}
  async send(payload: ProviderMessagePayload): Promise<ProviderSendResult> {
    return { providerMessageId: `wa_${payload.idempotencyKey}`, accepted: true, raw: { provider: "whatsapp" } }
  }
  verifyWebhookSignature(headers: Record<string, string>, body: string): boolean {
    return Boolean(this.appSecret && headers["x-hub-signature-256"] && body)
  }
}
