import { randomUUID } from "crypto"
import type { EventPublisher } from "../../events/src"
import type { EventEnvelope, TenantContext } from "../../shared-types/src"
import { BaseRepository } from "./base"

export interface CreateOrderInput {
  creatorId: string
  customerId: string
  amount: number
  currency: string
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled" | "refunded"
}

export class OrderRepository extends BaseRepository {
  constructor(tenantDb: ConstructorParameters<typeof BaseRepository>[0], private readonly publisher: EventPublisher) {
    super(tenantDb)
  }

  async create(ctx: TenantContext, input: CreateOrderInput) {
    this.assertTenant(ctx)
    const payload = {
      id: randomUUID(),
      creator_id: input.creatorId,
      customer_id: input.customerId,
      amount: input.amount,
      currency: input.currency,
      status: input.status,
      tenant_id: ctx.tenantId,
    }

    const created = await this.tenantDb.db.insert("orders", payload)
    if (created.error) throw created.error

    const event: EventEnvelope<{ orderId: string; amount: number; status: string }> = {
      eventId: randomUUID(),
      eventName: "order.created",
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      agentId: null,
      correlationId: ctx.correlationId,
      causationId: null,
      idempotencyKey: `order.create.${payload.id}`,
      occurredAt: new Date().toISOString(),
      payload: { orderId: payload.id, amount: payload.amount, status: payload.status },
      version: 1,
    }

    await this.publisher.publish(event)
    return created.data
  }
}
