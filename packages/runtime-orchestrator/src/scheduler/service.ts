import type { JobEnvelope } from "../contracts/types"

export class SchedulerService {
  isReady(job: JobEnvelope) { return Date.parse(job.runAt) <= Date.now() }
}
