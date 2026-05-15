<<<<<<< HEAD
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
=======
import type { JobEnvelope, QueueAdapter, QueueName } from "../../../runtime-orchestrator/src"
import type { AutomationAction } from "../dsl/rules"

const queueByAction: Record<AutomationAction["type"], QueueName> = {
  "enqueue.messaging": "automation.execute",
  "enqueue.analytics": "automation.execute",
  "enqueue.ai": "automation.execute",
}

export async function enqueueDownstreamAction(
  queue: QueueAdapter,
  job: JobEnvelope,
  action: AutomationAction
): Promise<void> {
  await queue.enqueue(queueByAction[action.type], {
    ...job,
    payload: {
      kind: action.type,
      payload: action.payload,
    },
  })
>>>>>>> main
}
