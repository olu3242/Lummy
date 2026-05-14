export type MessagingProvider = "whatsapp" | "email" | "sms"
<<<<<<< HEAD
export type MessageStatus = "queued" | "sent" | "delivered" | "failed" | "retried" | "dead_lettered" | "reconciled"

export interface ProviderMessagePayload { provider: MessagingProvider; to: string; templateId?: string; content: string; variables?: Record<string, string>; idempotencyKey: string }
export interface ProviderSendResult { providerMessageId: string; accepted: boolean; raw: Record<string, unknown> }
export interface ProviderAdapter { send(payload: ProviderMessagePayload): Promise<ProviderSendResult>; verifyWebhookSignature(headers: Record<string, string>, body: string): boolean }
=======

export interface ProviderMessagePayload {
  provider: MessagingProvider
  to: string
  templateId?: string
  content: string
  variables?: Record<string, string>
  idempotencyKey: string
}

export interface ProviderSendResult {
  providerMessageId: string
  accepted: boolean
  raw: Record<string, unknown>
}

export interface ProviderAdapter {
  send(payload: ProviderMessagePayload): Promise<ProviderSendResult>
  verifyWebhookSignature(headers: Record<string, string>, body: string): boolean
}
>>>>>>> main
