import type { JobEnvelope, QueueName, QueueService } from "@lummy/runtime-orchestrator"
import type { AutomationAction } from "../dsl/rules"

const queueByKind: Record<string, QueueName> = {
  messaging: "messaging.send",
  analytics: "analytics.rollup",
  ai: "ai.execute",
  payments: "payments.reconcile",
}

export class ActionRegistry {
  constructor(private readonly queue: QueueService) {}
  async enqueue(job: JobEnvelope, kind: keyof typeof queueByKind, payload: Record<string, unknown>) {
    const target = queueByKind[kind]
    await this.queue.enqueue(target, { ...job, queue: target, payload: { kind, payload } })
  }
}

export async function enqueueDownstreamAction(queue: QueueService, job: JobEnvelope, action: AutomationAction) {
  const kind = action.type.replace("enqueue.", "") as keyof typeof queueByKind
  const target = queueByKind[kind]
  await queue.enqueue(target, { ...job, queue: target, payload: { kind, payload: action.payload } })
}
