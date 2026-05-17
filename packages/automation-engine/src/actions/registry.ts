import type { JobEnvelope, QueueName, QueueService } from "@lummy/runtime-orchestrator"

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
