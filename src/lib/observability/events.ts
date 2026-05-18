import { logger } from "./logger"

export type EventName =
  | "storefront.view"
  | "product.view"
  | "whatsapp.click"
  | "order.created"
  | "order.paid"
  | "order.failed"
  | "ai.generation"
  | "auth.signup"
  | "auth.login"
  | "onboarding.complete"
  | "store.schema.saved"
  | "upload.success"
  | "webhook.received"
  | "webhook.failed"
  | "webhook.dead"

interface EventPayload {
  event: EventName
  userId?: string
  creatorId?: string
  correlationId?: string
  [key: string]: unknown
}

export function trackEvent(name: EventName, payload: Omit<EventPayload, "event"> = {}): void {
  logger.info(`event:${name}`, { event: name, ...payload })
}

export function trackError(name: EventName, error: unknown, payload: Omit<EventPayload, "event"> = {}): void {
  const msg = error instanceof Error ? error.message : String(error)
  logger.error(`event:${name}`, { event: name, error: msg, ...payload })
}
