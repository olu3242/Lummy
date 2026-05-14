import type { TenantContext } from "../../shared-types/src"

export type QueueName =
  | "events.outbox"
  | "events.retry"
  | "events.dlq"
  | "automation.execute"
  | "automation.retry"
  | "automation.dlq"

export interface JobEnvelope<TPayload = Record<string, unknown>> {
  jobId: string
  queue: QueueName
  tenant: TenantContext
  payload: TPayload
  idempotencyKey: string
  correlationId: string
  causationId: string | null
  attempt: number
  maxAttempts: number
  runAt: string
  createdAt: string
}

export interface JobResult {
  ok: boolean
  retryable?: boolean
  error?: string
}
