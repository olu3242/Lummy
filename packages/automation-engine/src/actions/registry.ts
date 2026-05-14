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
}
