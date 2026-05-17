import type { AutomationJob } from "./types"

export class AutomationScheduler {
  isReady(job: AutomationJob) {
    return new Date(job.runAt).getTime() <= Date.now()
  }

  assertReplaySafe(job: AutomationJob) {
    if (!job.idempotencyKey) throw new Error("Automation job missing idempotencyKey")
    if (!job.correlationId) throw new Error("Automation job missing correlationId")
  }
}
