import type { EventEnvelope } from "@lummy/shared-types"
import type { DatabaseClient } from "@lummy/db-core"
import type { DeadLetterEntry, DeadLetterStore } from "./contracts"
import { EventRetryPolicy } from "./retry"
import { eventTraceMetadata, validateEventEnvelope } from "./schema"

export class EventQueueWorker {
  constructor(
    private readonly handler: (event: EventEnvelope) => Promise<void>,
    private readonly deadLetterStore?: DeadLetterStore,
    private readonly maxAttempts = 3,
    private readonly retryPolicy = new EventRetryPolicy(maxAttempts),
  ) {}

  async process(event: EventEnvelope, attemptCount = 1): Promise<void> {
    const validation = validateEventEnvelope(event)
    if (!validation.ok) throw new Error(validation.error)

    try {
      await this.handler(event)
    } catch (error) {
      const attemptNumber = attemptCount
      const reason = error instanceof Error ? error.message : String(error)
      const failedAt = new Date().toISOString()
      const decision = this.retryPolicy.decide(attemptNumber)

      if (this.deadLetterStore && decision.deadLetter) {
        await this.deadLetterStore.append({
          event,
          reason,
          attempts: attemptNumber,
          failedAt,
        })
        return
      }

      throw new Error(`Event queue worker failed [attempt ${attemptNumber}; retryDelayMs=${decision.delayMs}]: ${reason}`)
    }
  }
}

export function createWorkerHeartbeat(workerId: string, queueName: string) {
  return {
    workerId,
    queueName,
    beatAt: new Date().toISOString(),
  }
}

export function createEventTrace(event: EventEnvelope, attempt: number) {
  return { ...eventTraceMetadata(event), attempt }
}

export class SqlDeadLetterStore implements DeadLetterStore {
  constructor(private readonly db: DatabaseClient) {}

  async append(entry: DeadLetterEntry): Promise<void> {
    const result = await this.db.insert("dead_letter_events", {
      event_id: entry.event.eventId,
      event_name: entry.event.eventName,
      tenant_id: entry.event.tenantId,
      correlation_id: entry.event.correlationId,
      caused_by: entry.event.causationId,
      idempotency_key: entry.event.idempotencyKey,
      attempts: entry.attempts,
      reason: entry.reason,
      failed_at: entry.failedAt,
      payload: entry.event.payload,
      created_at: new Date().toISOString(),
    })

    if (result.error) throw result.error
  }
}
