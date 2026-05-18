import type { JobEnvelope, QueueName } from "./contracts"

export interface QueueAdapter {
  enqueue<T>(queue: QueueName, job: JobEnvelope<T>): Promise<void>
  dequeue<T>(queue: QueueName): Promise<JobEnvelope<T> | null>
}

export class InMemoryQueueAdapter implements QueueAdapter {
  private readonly queues = new Map<QueueName, JobEnvelope<unknown>[]>()

  async enqueue<T>(queue: QueueName, job: JobEnvelope<T>): Promise<void> {
    const list = this.queues.get(queue) || []
    list.push(job as JobEnvelope<unknown>)
    this.queues.set(queue, list)
  }

  async dequeue<T>(queue: QueueName): Promise<JobEnvelope<T> | null> {
    const list = this.queues.get(queue)
    if (!list || list.length === 0) return null
    return list.shift() as JobEnvelope<T>
  }
}
