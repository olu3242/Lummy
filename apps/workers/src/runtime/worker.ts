<<<<<<< HEAD
import {
  ExecutionCoordinator,
  InMemoryLockService,
  InMemoryQueueService,
  type QueueHandler,
  type QueueName,
  WorkerMonitorService,
} from "@lummy/runtime-orchestrator"

export class WorkerRuntime {
  private readonly queue = new InMemoryQueueService()
  private readonly lock = new InMemoryLockService()
  private readonly monitor = new WorkerMonitorService()
  private readonly coordinator = new ExecutionCoordinator(this.queue, this.lock, this.monitor)

  constructor(private readonly handlers: Partial<Record<QueueName, QueueHandler>>) {}

  getQueue() { return this.queue }
  getMonitor() { return this.monitor }

  async tick(queueName: QueueName): Promise<void> {
    await this.coordinator.tick(queueName, this.handlers[queueName])
  }

  async tickAllQueues(queueNames: QueueName[]): Promise<void> {
    for (const queueName of queueNames) await this.tick(queueName)
=======
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
>>>>>>> main
  }
}
