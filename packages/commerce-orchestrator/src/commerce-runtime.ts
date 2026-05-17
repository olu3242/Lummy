import type { EventBus } from "@lummy/events-core"
import { AutomationRouter, type CommerceAutomationQueue } from "./automation-router"
import { ConversationOrchestrator } from "./conversation-orchestrator"
import { CustomerTimelineOrchestrator } from "./customer-timeline-orchestrator"
import { FulfillmentOrchestrator } from "./fulfillment-orchestrator"
import { OrderOrchestrator } from "./order-orchestrator"
import type { OrchestratorStore } from "./persistence"
import { PaymentOrchestrator } from "./payment-orchestrator"

export function createCommerceRuntime(store: OrchestratorStore, bus: EventBus, queue?: CommerceAutomationQueue) {
  const orders = new OrderOrchestrator(store, bus)
  const timeline = new CustomerTimelineOrchestrator(store)

  bus.subscribe("lead.created", async (event) => { await orders.handleEvent(event) })
  bus.subscribe("conversation.started", (event) => Promise.all([orders.handleEvent(event), timeline.record(event)]).then(() => undefined))
  bus.subscribe("product.selected", (event) => Promise.all([orders.handleEvent(event), timeline.record(event)]).then(() => undefined))
  bus.subscribe("checkout.initiated", (event) => Promise.all([orders.handleEvent(event), timeline.record(event)]).then(() => undefined))
  bus.subscribe("payment.pending", async (event) => { await orders.handleEvent(event) })
  bus.subscribe("payment.confirmed", async (event) => { await orders.handleEvent(event) })
  bus.subscribe("creator.notified", async (event) => { await orders.handleEvent(event) })
  bus.subscribe("fulfillment.started", async (event) => { await orders.handleEvent(event) })
  bus.subscribe("delivery.completed", async (event) => { await orders.handleEvent(event) })

  if (queue) new AutomationRouter(queue).attach(bus)

  return {
    orders,
    payments: new PaymentOrchestrator(bus),
    fulfillment: new FulfillmentOrchestrator(bus),
    conversations: new ConversationOrchestrator(bus),
    timeline,
    automation: queue ? new AutomationRouter(queue) : undefined,
  }
}
