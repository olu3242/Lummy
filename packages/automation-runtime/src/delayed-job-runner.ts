import type { AutomationJob, AutomationQueue } from "./types"

export class DelayedJobRunner {
  constructor(private readonly queue: AutomationQueue) {}

  schedule(queueName: string, job: AutomationJob, runAt: string) {
    return this.queue.enqueue(queueName, { ...job, runAt, status: undefined } as AutomationJob)
  }
}
