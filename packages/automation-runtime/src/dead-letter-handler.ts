import type { AutomationJob, AutomationQueue, AutomationStore } from "./types"

export class DeadLetterHandler {
  constructor(private readonly queue: AutomationQueue, private readonly store: AutomationStore) {}

  async send(job: AutomationJob, error: string) {
    await this.store.recordExecution(job, "dead_lettered", { error })
    await this.queue.enqueue("automation.dlq", { ...job, payload: { ...job.payload, failure: { error, at: new Date().toISOString() } } })
  }
}
