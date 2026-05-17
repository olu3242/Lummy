import { nextBackoffMs, type JobEnvelope, type JobResult, type QueueAdapter } from "@lummy/runtime-orchestrator"
import { enqueueDownstreamAction } from "../actions/registry"
import type { AutomationRule } from "../dsl/rules"

export async function runAutomationJob(
  queue: QueueAdapter,
  rules: AutomationRule[],
  job: JobEnvelope<{ trigger: string; payload: Record<string, unknown> }>
): Promise<JobResult> {
  const matching = rules.filter((r) => r.enabled && r.trigger === job.payload.trigger)

  for (const rule of matching) {
    for (const action of rule.actions) {
      await enqueueDownstreamAction(queue, job, action)
    }
  }

  return { ok: true }
}

export async function handleFailure(queue: QueueAdapter, job: JobEnvelope, error: string): Promise<void> {
  if (job.attempt >= job.maxAttempts) {
    await queue.enqueue("automation.dlq", { ...job, payload: { ...job.payload, error } })
    return
  }

  const delay = nextBackoffMs(job.attempt + 1)
  await queue.enqueue("automation.retry", {
    ...job,
    attempt: job.attempt + 1,
    runAt: new Date(Date.now() + delay).toISOString(),
  })
}
