import type { JobEnvelope, JobResult } from "@lummy/runtime-orchestrator"

export async function eventsOutboxHandler(job: JobEnvelope): Promise<JobResult> {
  return { ok: true, retryable: false, error: job.payload ? undefined : "missing payload" }
}
