import type { EventEnvelope } from "@lummy/shared-types"

export type AnyEventEnvelope = EventEnvelope<any>

export interface DeadLetterEntry {
  event: AnyEventEnvelope
  reason: string
  attempts: number
  failedAt: string
}

export interface DeadLetterStore {
  append(entry: DeadLetterEntry): Promise<void>
}

export interface OutboxStore {
  append(event: EventEnvelope): Promise<void>
}

export type EventHandler = (event: AnyEventEnvelope) => Promise<void>
