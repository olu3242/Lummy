import { createEventTrace, createWorkerHeartbeat, validateEventEnvelope } from "@lummy/events-core"
import type { JobEnvelope, JobResult } from "@lummy/runtime-orchestrator"

export async function eventsOutboxHandler(job: JobEnvelope): Promise<JobResult> {
  if (!job.payload) return { ok: false, retryable: false, error: "missing payload" }

  const event = job.payload.event && typeof job.payload.event === "object" ? job.payload.event : job.payload
  const validation = validateEventEnvelope(event as Parameters<typeof validateEventEnvelope>[0])
  if (!validation.ok) return { ok: false, retryable: false, error: validation.error }

  console.info(JSON.stringify({
    event: "events.outbox.processed",
    heartbeat: createWorkerHeartbeat("events-outbox", job.queue),
    trace: createEventTrace(event as Parameters<typeof createEventTrace>[0], job.attempt),
  }))

  return { ok: true, retryable: false }
}
