import type { DistributedLock, JobEnvelope, QueueAdapter, QueueName } from "../../../../packages/runtime-orchestrator/src"
import type { JobResult } from "../../../../packages/runtime-orchestrator/src/contracts"

export type QueueHandler = (job: JobEnvelope) => Promise<JobResult>

export class WorkerRuntime {
  constructor(
    private readonly queue: QueueAdapter,
    private readonly lock: DistributedLock,
    private readonly handlers: Partial<Record<QueueName, QueueHandler>>
  ) {}

  async tick(queueName: QueueName): Promise<void> {
    const lockKey = `worker:${queueName}`
    const acquired = await this.lock.acquire(lockKey, 5000)
    if (!acquired) return

    try {
      const job = await this.queue.dequeue(queueName)
      if (!job) return
      const handler = this.handlers[queueName]
      if (!handler) return
      await handler(job)
    } finally {
      await this.lock.release(lockKey)
    }
  }
}
