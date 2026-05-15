<<<<<<< HEAD
import type { JobEnvelope, JobResult } from "@lummy/runtime-orchestrator"

export async function eventsOutboxHandler(job: JobEnvelope): Promise<JobResult> {
  return { ok: true, retryable: false, error: job.payload ? undefined : "missing payload" }
=======
import type { JobEnvelope, JobResult, QueueAdapter } from "../../../../packages/runtime-orchestrator/src"

export async function handleEventsOutbox(queue: QueueAdapter, job: JobEnvelope): Promise<JobResult> {
  try {
    await queue.enqueue("events.retry", {
      ...job,
      payload: { ...job.payload, dispatched: true },
    })
    return { ok: true }
  } catch (err) {
    await queue.enqueue("events.dlq", {
      ...job,
      payload: { ...job.payload, error: err instanceof Error ? err.message : "dispatch_failed" },
    })
    return { ok: false, retryable: false, error: "dispatch_failed" }
  }
>>>>>>> main
}
