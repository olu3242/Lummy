import type { DatabaseClient } from "@lummy/db-core"
import type { CommerceEventEnvelope, CommerceTimelineEntry, OrderHistoryEntry, OrderRecord } from "./types"

export interface OrchestratorStore {
  getOrder(orderId: string): Promise<OrderRecord | null>
  upsertOrder(order: OrderRecord): Promise<void>
  appendOrderHistory(entry: OrderHistoryEntry): Promise<void>
  appendOrderTransition(entry: OrderHistoryEntry & { previousState: string; nextState: string; valid: boolean }): Promise<void>
  appendTimeline(entry: CommerceTimelineEntry): Promise<void>
  appendEvent(event: CommerceEventEnvelope): Promise<void>
  markIdempotencyKey?(idempotencyKey: string): Promise<boolean>
}

export class SqlOrchestratorStore implements OrchestratorStore {
  constructor(private readonly db: DatabaseClient) {}

  async getOrder(orderId: string): Promise<OrderRecord | null> {
    const result = await this.db.findOne<OrderRecord>("orders", { order_id: orderId })
    if (result.error) throw result.error
    return result.data || null
  }

  async upsertOrder(order: OrderRecord): Promise<void> {
    const result = await this.db.upsert("orders", {
      order_id: order.orderId,
      tenant_id: order.tenantId,
      state: order.state,
      channel: order.channel,
      customer_id: order.customerId,
      total_amount: order.totalAmount,
      currency: order.currency,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      last_event_id: order.lastEvent,
      metadata: order.metadata,
    })

    if (result.error) throw result.error
  }

  async appendOrderHistory(entry: OrderHistoryEntry): Promise<void> {
    const result = await this.db.insert("order_history", {
      order_id: entry.orderId,
      event_id: entry.eventId,
      event_name: entry.eventName,
      occurred_at: entry.occurredAt,
      payload: entry.payload,
    })

    if (result.error) throw result.error
  }

  async appendOrderTransition(entry: OrderHistoryEntry & { previousState: string; nextState: string; valid: boolean }): Promise<void> {
    const result = await this.db.insert("order_state_transitions", {
      order_id: entry.orderId,
      event_id: entry.eventId,
      event_name: entry.eventName,
      previous_state: entry.previousState,
      next_state: entry.nextState,
      valid: entry.valid,
      occurred_at: entry.occurredAt,
      payload: entry.payload,
    })

    if (result.error) throw result.error
  }

  async appendTimeline(entry: CommerceTimelineEntry): Promise<void> {
    const result = await this.db.insert("commerce_operational_timeline", {
      tenant_id: entry.tenantId,
      subject_id: entry.subjectId,
      subject_type: entry.subjectType,
      event_id: entry.eventId,
      event_name: entry.eventName,
      correlation_id: entry.correlationId,
      occurred_at: entry.occurredAt,
      metadata: entry.metadata,
    })

    if (result.error) throw result.error
  }

  async appendEvent(event: CommerceEventEnvelope): Promise<void> {
    const result = await this.db.insert("commerce_events", {
      event_id: event.eventId,
      event_name: event.eventName,
      tenant_id: event.tenantId,
      actor_id: event.actorId,
      agent_id: event.agentId,
      correlation_id: event.correlationId,
      causation_id: event.causationId,
      idempotency_key: event.idempotencyKey,
      occurred_at: event.occurredAt,
      payload: event.payload,
      version: event.version,
    })

    if (result.error) throw result.error
  }
}
